// About me: resume and project documents become text that Claude is given.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { DocumentStore, extractText } = require('../src/documents');

const FX = path.join(__dirname, 'fixtures', 'docs');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'aboutme-'));

test('reads text out of a PDF resume and a Word design document, line breaks kept', async () => {
  const pdf = await extractText(path.join(FX, 'resume-sample.pdf'));
  assert.match(pdf, /Salesforce Technical Lead\nExperience: 6 years/);
  assert.match(pdf, /SAP integration/);
  const docx = await extractText(path.join(FX, 'design-sample.docx'));
  assert.match(docx, /Order Management Design/);
  assert.match(docx, /queueable callout/);
});

test('unsupported or empty files are refused with a plain explanation', async () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'pic.png'), 'x');
  await assert.rejects(extractText(path.join(dir, 'pic.png')), /not a supported file.*PDF, Word/);
  fs.writeFileSync(path.join(dir, 'empty.txt'), '   ');
  await assert.rejects(extractText(path.join(dir, 'empty.txt')), /No readable text.*scanned PDF/);
});

test('store: a new resume replaces the old one, project documents add up, remove works', async () => {
  const store = new DocumentStore(tmp());
  await store.add('resume', path.join(FX, 'resume-sample.pdf'));
  const notes = path.join(tmp(), 'notes.md');
  fs.writeFileSync(notes, '# My notes\nCPQ quote line triggers call the pricing service for each bundle.');
  await store.add('resume', notes);
  await store.add('docs', path.join(FX, 'design-sample.docx'));
  await store.add('docs', path.join(FX, 'resume-sample.pdf'));
  assert.deepEqual(store.summary(), { resume: ['notes.md'], docs: ['design-sample.docx', 'resume-sample.pdf'] });
  assert.match(store.list().find(d => d.kind === 'resume').text, /pricing service/);
  store.remove('docs', 'resume-sample.pdf');
  assert.deepEqual(store.summary().docs, ['design-sample.docx']);
  await assert.rejects(store.add('photos', notes), /unknown document kind/);
});
