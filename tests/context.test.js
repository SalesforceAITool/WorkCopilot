// Indexer + retrieval: what gets read from a Salesforce DX project, and what gets sent to Claude.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ProjectIndex, tokenize } = require('../src/context');

const FIXTURE = path.join(__dirname, 'fixtures', 'sf-project');
const names = (idx) => idx.files.map(f => path.basename(f.rel)).sort();

function tmpDir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'copilot-')); }

test('tokenize splits camelCase, PascalCase, snake_case and drops stopwords', () => {
  assert.deepEqual(tokenize('WorkOrderTriggerHandler'), ['work', 'order', 'trigger', 'handler']);
  assert.deepEqual(tokenize('Revised_Price__c'), ['revised', 'price']);
  assert.deepEqual(tokenize('HTTPRequest callout'), ['http', 'request', 'callout']);
  assert.deepEqual(tokenize('what is the kya'), []);
});

test('indexes Salesforce source, Flows, fields and labels; skips companion meta files and tool folders', () => {
  const idx = new ProjectIndex({ projectFolders: [FIXTURE] });
  idx.build();
  assert.deepEqual(names(idx), [
    'CustomLabels.labels-meta.xml',
    'PriceRevisionQueueable.cls',
    'Revised_Price__c.field-meta.xml',
    'WorkOrderTrigger.trigger',
    'WorkOrderTriggerHandler.cls',
    'Work_Time_Log.flow-meta.xml',
    'workOrderUploader.js'
  ]);
});

test('a question about a Flow retrieves the Flow file first', () => {
  const idx = new ProjectIndex({ projectFolders: [FIXTURE] });
  idx.build();
  const hits = idx.search('how does your work time log flow work');
  assert.ok(hits.length > 0);
  assert.equal(path.basename(hits[0].rel), 'Work_Time_Log.flow-meta.xml');
});

test('missing folder, empty files and oversized files are skipped without throwing', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'Empty.cls'), '');
  fs.writeFileSync(path.join(dir, 'Big.cls'), 'x'.repeat(300 * 1024));
  fs.writeFileSync(path.join(dir, 'Ok.cls'), 'public class Ok {}');
  fs.writeFileSync(path.join(dir, 'image.png'), 'not text');
  const idx = new ProjectIndex({ projectFolders: [dir, path.join(dir, 'does-not-exist')] });
  const s = idx.build();
  assert.deepEqual(names(idx), ['Ok.cls']);
  assert.equal(s.files, 1);
});

test('small project goes to Claude whole, including notes first', () => {
  const dir = tmpDir();
  const notes = path.join(dir, 'MY_WORK.md');
  fs.writeFileSync(notes, 'Built the price revision callout for client QTC.');
  const idx = new ProjectIndex({ projectFolders: [FIXTURE], notesFiles: [notes] });
  idx.build();
  const ctx = idx.contextFor('anything');
  assert.equal(ctx.mode, 'full');
  assert.ok(ctx.text.indexOf('MY WORK NOTES') < ctx.text.indexOf('FULL PROJECT FILES'));
  assert.match(ctx.text, /Built the price revision callout/);
  assert.match(ctx.text, /FILE: .*Work_Time_Log\.flow-meta\.xml/);
});

test('big project: context per question stays bounded and relevant', () => {
  const dir = tmpDir();
  for (let i = 1; i <= 2500; i++) {
    const n = String(i).padStart(4, '0');
    fs.writeFileSync(path.join(dir, `Service${n}Handler.cls`),
      `public class Service${n}Handler {\n  public static void run(List<Account> accs) {\n    for (Account a : accs) { a.Description = 'svc ${i}'; }\n  }\n}\n`);
  }
  const idx = new ProjectIndex({ projectFolders: [dir] });
  idx.build();
  const ctx = idx.contextFor('what does Service0042Handler do');
  assert.equal(ctx.mode, 'retrieval');
  assert.ok(ctx.text.length <= 90000, `context too big: ${ctx.text.length} chars`);
  assert.equal(path.basename(ctx.sources[0]), 'Service0042Handler.cls');
  assert.ok(ctx.sources.length <= 40, `too many filler chunks: ${ctx.sources.length}`);
});

test('generic question on a big project sends no code excerpts', () => {
  const dir = tmpDir();
  for (let i = 1; i <= 2500; i++) fs.writeFileSync(path.join(dir, `C${i}.cls`), `public class C${i} { Integer v = ${i}; }\n`.repeat(4));
  const idx = new ProjectIndex({ projectFolders: [dir] });
  idx.build();
  const ctx = idx.contextFor('what are governor limits in salesforce');
  assert.equal(ctx.sources.length, 0);
});

test('file list is summarised when it is too long', () => {
  const dir = tmpDir();
  for (let d = 0; d < 60; d++) {
    const sub = path.join(dir, `module${d}`);
    fs.mkdirSync(sub);
    for (let i = 0; i < 50; i++) fs.writeFileSync(path.join(sub, `VeryLongDescriptiveClassName${d}x${i}.cls`), 'public class X {}');
  }
  const idx = new ProjectIndex({ projectFolders: [dir] });
  idx.build();
  const tree = idx.fileTree();
  assert.ok(tree.length <= 20000, `tree too long: ${tree.length}`);
  assert.match(tree, /module7\b.*50 files/);
});

test('profiles and permission sets are not indexed (they name every class and field)', () => {
  const idx = new ProjectIndex({ projectFolders: [FIXTURE] });
  idx.build();
  assert.ok(!names(idx).some(n => /profile|permissionset/.test(n)));
  assert.equal(path.basename(idx.search('price revision queueable')[0].rel), 'PriceRevisionQueueable.cls');
});

test('retrieval mode: the cached part is identical across questions; excerpts travel with the question', () => {
  const dir = tmpDir();
  for (let i = 1; i <= 400; i++) fs.writeFileSync(path.join(dir, `Svc${i}.cls`), `public class Svc${i} { /* handles invoice ${i} */ }\n`.repeat(20));
  const idx = new ProjectIndex({ projectFolders: [dir], fullContextChars: 1000 });
  idx.build();
  const a = idx.contextFor('what does Svc12 do');
  const b = idx.contextFor('explain Svc300');
  assert.equal(a.mode, 'retrieval');
  assert.equal(a.text, b.text);
  assert.match(a.text, /MODE: excerpts only/);
  assert.match(a.excerpts, /FILE: .*Svc12\.cls/);
  assert.doesNotMatch(a.text, /FILE: .*Svc12\.cls \(from line/);
});

test('notes-only setup still gives Claude the notes', () => {
  const dir = tmpDir();
  const notes = path.join(dir, 'MY_WORK.md');
  fs.writeFileSync(notes, 'Led the Work Time Log flow rollout.');
  const idx = new ProjectIndex({ projectFolders: [], notesFiles: [notes] });
  const s = idx.build();
  assert.equal(s.notes, 1);
  const ctx = idx.contextFor('what did you roll out');
  assert.equal(ctx.mode, 'notes');
  assert.match(ctx.text, /Led the Work Time Log flow rollout/);
});

test('files skipped for size are counted so the user can see them', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'BigDataPack.json'), '{"a":"' + 'x'.repeat(300 * 1024) + '"}');
  fs.writeFileSync(path.join(dir, 'Ok.cls'), 'public class Ok {}');
  const s = new ProjectIndex({ projectFolders: [dir] }).build();
  assert.equal(s.skippedLarge, 1);
  assert.equal(s.files, 1);
});
