// Q&A bank: meaning-based search, project preference, vector cache, the app service,
// and building project Q&A from code (with Claude stubbed).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { QABank } = require('../src/qa-bank');
const { SemanticIndex } = require('../src/semantic');
const { BankService, preferProject } = require('../src/bank-service');
const { buildProjectQA, parseArray } = require('../src/project-qa');
const { ClaudeCodeAnswerer } = require('../src/claude-code');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'qa-'));
const LONG = ' It is explained here in enough plain words to pass the answer length check of the validator for sure.';

// Stand-in sentence model: bag of words hashed into 128 dims, normalized. Same words → close vectors.
class FakeEmbedder {
  constructor() { this.key = 'fake:1'; this.embedded = 0; }
  async embed(texts, onProgress) {
    this.embedded += texts.length;
    const out = texts.map(t => {
      const v = new Float32Array(128);
      for (const w of String(t).toLowerCase().match(/[a-z0-9]+/g) || []) {
        if (['what', 'is', 'a', 'the', 'how', 'do', 'you', 'of', 'in', 'and', 'it', 'to', 'your'].includes(w)) continue;
        let h = 0; for (const c of w) h = (h * 31 + c.charCodeAt(0)) >>> 0;
        v[h % 128] += 1;
      }
      const n = Math.hypot(...v) || 1;
      return v.map(x => x / n);
    });
    if (onProgress) onProgress(texts.length, texts.length);
    return out;
  }
}

const entry = (id, q, alt, a, extra = {}) => ({ id, topic: 'Test', level: 'mid', type: 'concept', q, alt, a: a + LONG, tags: ['t'], ...extra });
const BANK = [
  entry('trg-001', 'How do you stop trigger recursion?', ['How to avoid a trigger running twice?', 'Recursive trigger fix'], 'Use a static Boolean or a static Set of processed Ids in a handler class.'),
  entry('bat-001', 'What is Database.Stateful in batch Apex?', ['How do you keep state across batch chunks?', 'Stateful batch class'], 'Database.Stateful keeps instance variables between execute calls.'),
  entry('cpq-001', 'What is a CPQ price rule?', ['How do price rules work in Salesforce CPQ?', 'Explain CPQ price rules'], 'A price rule sets quote line field values when conditions match, during calculation.', { topic: 'Salesforce CPQ' })
];

test('meaning-based search finds the right answer for a reworded question; confidence is the meaning score', async () => {
  const emb = new FakeEmbedder();
  const bank = new QABank(BANK);
  bank.attachSemantic(await SemanticIndex.build(emb, bank.entries));
  const [qv] = await emb.embed(['how do I keep state across batch chunks']);
  const [top] = bank.search('how do I keep state across batch chunks', { limit: 3, queryVector: qv });
  assert.equal(top.entry.id, 'bat-001');
  assert.ok(top.confidence > 0.5 && top.confidence <= 1);
  assert.ok(top.score >= top.confidence, 'keyword boost only adds');
});

test('a project answer close to the best general one goes first; a much weaker one does not', () => {
  const gen = { entry: { id: 'g', source: 'bank' }, score: 0.80 };
  const near = { entry: { id: 'p', source: 'project:QTC' }, score: 0.76 };
  const far = { entry: { id: 'p2', source: 'project:QTC' }, score: 0.60 };
  assert.deepEqual(preferProject([gen, near]).map(r => r.entry.id), ['p', 'g']);
  assert.deepEqual(preferProject([gen, far]).map(r => r.entry.id), ['g', 'p2']);
  // CPQ questions lean much harder on the project (most CPQ questions are about Amkor QTC)
  const cpq = { entry: { id: 'c', source: 'bank', topic: 'Salesforce CPQ' }, score: 0.80 };
  const fairlyClose = { entry: { id: 'p2', source: 'project:QTC' }, score: 0.65 };
  assert.deepEqual(preferProject([cpq, fairlyClose]).map(r => r.entry.id), ['p2', 'c']);
  const wayOff = { entry: { id: 'p3', source: 'project:QTC' }, score: 0.45 };
  assert.deepEqual(preferProject([cpq, wayOff]).map(r => r.entry.id), ['c', 'p3']);
  // a plain definition question keeps the general CPQ answer first
  assert.deepEqual(preferProject([cpq, fairlyClose], 0, 'What is a price rule in CPQ?').map(r => r.entry.id), ['c', 'p2']);
  assert.deepEqual(preferProject([cpq, fairlyClose], 0, 'How did you use price rules?').map(r => r.entry.id), ['p2', 'c']);
});

test('vector cache: a restart embeds nothing; adding a project file embeds only its sentences', async () => {
  const dir = tmp(), cacheFile = path.join(dir, 'v.bin');
  const e1 = new FakeEmbedder();
  await SemanticIndex.build(e1, BANK, { cacheFile });
  const first = e1.embedded;
  assert.ok(first > 0);
  const e2 = new FakeEmbedder();
  const again = await SemanticIndex.build(e2, BANK, { cacheFile });
  assert.equal(e2.embedded, 0, 'second start should read every vector from the cache');
  const [qv] = await e2.embed(['trigger recursion']);
  assert.equal(again.scores(qv).length, BANK.length);
  const e3 = new FakeEmbedder();
  await SemanticIndex.build(e3, [...BANK, entry('proj-qtc-001', 'What does AMT_QuoteLineTriggerHandler do?', ['Quote line trigger in QTC', 'Explain the quote line handler'], 'It sets quote line defaults.')], { cacheFile });
  assert.equal(e3.embedded, 4, 'only the new entry: question, 2 phrasings, question+answer opening');
});

test('BankService: loads bank + project files, shows sure matches, gives Claude reference answers marked as my project', async (t) => {
  const dir = tmp();
  const bankFile = path.join(dir, 'bank.json');
  fs.writeFileSync(bankFile, JSON.stringify(BANK));
  const projectDir = path.join(dir, 'project-kb');
  fs.mkdirSync(projectDir);
  fs.writeFileSync(path.join(projectDir, 'qtc.json'), JSON.stringify([
    entry('proj-qtc-001', 'How did you use CPQ price rules in your project?', ['Price rules in the QTC project', 'CPQ price rules you built'], 'In QTC our price rules set the Amkor price from the price record.')
  ]));
  const statuses = [];
  const svc = new BankService({ bankFile, projectDir, vectorCacheFile: path.join(dir, 'v.bin'), embedder: new FakeEmbedder(), onStatus: s => statuses.push(s.state) });
  const st = await svc.load();
  assert.equal(st.state, 'ready');
  assert.equal(st.entries, 4);
  assert.deepEqual(statuses.slice(0, 1), ['preparing']);
  assert.ok(st.sources.some(s => /qtc/i.test(s.name) && s.count === 1), JSON.stringify(st.sources));

  const cpq = await svc.find('how did you use CPQ price rules');
  assert.equal(cpq.show, true);
  assert.equal(cpq.matches[0].source, 'project:qtc', 'a CPQ question should lead with my project answer');
  const ref = BankService.reference(cpq.matches);
  assert.match(ref, /REFERENCE ANSWERS/);
  assert.match(ref, /\(my project\) Q: How did you use CPQ price rules/);

  const chatter = await svc.find('can everyone see my screen okay');
  assert.equal(chatter.show, false);
  assert.equal(BankService.reference(chatter.matches.filter(m => m.confidence < 0.42)), '');
});

test('BankService: if the sentence model cannot load, it never shows a guessed answer but search still works', async () => {
  const dir = tmp();
  const bankFile = path.join(dir, 'bank.json');
  fs.writeFileSync(bankFile, JSON.stringify(BANK));
  const svc = new BankService({ bankFile, embedder: { key: 'x', embed: async () => { throw new Error('offline'); } } });
  const st = await svc.load();
  assert.equal(st.state, 'keyword-only');
  assert.match(st.error, /offline/);
  const r = await svc.find('trigger recursion');
  assert.equal(r.matches[0].id, 'trg-001');
  assert.equal(r.show, false, 'keyword-only matches are not shown as instant answers');
});

const fakeIndex = {
  files: [
    { rel: 'force-app/main/default/classes/AMT_QuoteLineTriggerHandler.cls', text: 'public class AMT_QuoteLineTriggerHandler { }' },
    { rel: 'force-app/main/default/triggers/AMT_QuoteLineTrigger.trigger', text: 'trigger AMT_QuoteLineTrigger on SBQQ__QuoteLine__c (before insert) { }' }
  ],
  notes: [], fileTree: () => 'classes/AMT_QuoteLineTriggerHandler.cls\ntriggers/AMT_QuoteLineTrigger.trigger'
};

test('project Q&A: good entries get ids and topics, broken ones are skipped, a failed part does not stop the build', async () => {
  const prompts = [];
  let call = 0;
  const good = { q: 'What does AMT_QuoteLineTriggerHandler do?', alt: ['Explain the quote line handler', 'Quote line trigger logic'], a: 'In this project the handler runs the quote line trigger logic.' + LONG, points: ['p'], tags: ['cpq'], level: 'mid', type: 'concept' };
  const progress = [];
  const res = await buildProjectQA({
    index: fakeIndex, name: 'QTC', onProgress: p => progress.push(p),
    complete: async ({ system, prompt }) => {
      prompts.push({ system, prompt });
      call++;
      if (call === 1) return '```json\n' + JSON.stringify([good, { q: 'no answer' }]) + '\n```';
      if (call === 2) throw new Error('usage limit');
      return JSON.stringify([{ ...good, q: 'Which object does AMT_QuoteLineTrigger run on?' }]);
    }
  });
  assert.equal(res.batches, 3, 'overview + classes + triggers');
  assert.equal(res.skipped, 1);
  assert.deepEqual(res.entries.map(e => e.id), ['proj-qtc-001', 'proj-qtc-002']);
  assert.equal(res.entries[0].topic, 'QTC project — overview');
  assert.equal(res.entries[1].topic, 'QTC project — triggers');
  assert.ok(progress.some(p => p.error === 'usage limit'));
  assert.match(prompts[0].system, /ONLY what the files you are shown prove/);
  assert.match(prompts[2].prompt, /AMT_QuoteLineTrigger on SBQQ__QuoteLine__c/);
  assert.throws(() => parseArray('Sorry, I cannot.'), /JSON list/);
});

test('Claude Code one-shot request (used by Build Q&A): plan sign-in only, prompt on stdin, whole reply back', async (t) => {
  const log = path.join(tmp(), 'log.jsonl');
  Object.assign(process.env, { FAKE_CC_LOG: log, FAKE_CC_ONESHOT: '[{"q":"x"}]', ANTHROPIC_API_KEY: 'sk-ant-never' });
  const a = new ClaudeCodeAnswerer({ claudePath: path.join(__dirname, 'helpers', 'fake-claude.js') });
  t.after(() => { a.dispose(); delete process.env.ANTHROPIC_API_KEY; delete process.env.FAKE_CC_ONESHOT; });
  const out = await a.complete({ system: 'rules', prompt: 'Files from the classes part' });
  assert.equal(out, '[{"q":"x"}]');
  const ev = fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse);
  const spawn = ev.find(e => e.event === 'spawn');
  assert.equal(spawn.hasApiKey, false);
  assert.equal(spawn.argv[spawn.argv.indexOf('--tools') + 1], '');
  assert.equal(ev.find(e => e.event === 'oneshot').prompt, 'Files from the classes part');
});

test('review fixes: cut-short vector cache is rebuilt, damaged bank file is reported, project answer never hides the card, no keyword-only references', async () => {
  const dir = tmp(), cacheFile = path.join(dir, 'v.bin');
  await SemanticIndex.build(new FakeEmbedder(), BANK, { cacheFile });
  fs.truncateSync(cacheFile, fs.statSync(cacheFile).size - 600);
  const e = new FakeEmbedder();
  await SemanticIndex.build(e, BANK, { cacheFile });
  assert.ok(e.embedded > 0, 'a damaged cache is ignored and rebuilt');
  const again = new FakeEmbedder();
  await SemanticIndex.build(again, BANK, { cacheFile });
  assert.equal(again.embedded, 0, 'and written back whole');

  const bad = path.join(dir, 'bad.json');
  fs.writeFileSync(bad, '[{"q":');
  const svc = new BankService({ bankFile: bad, embedder: new FakeEmbedder() });
  const st = await svc.load();
  assert.equal(st.state, 'off');
  assert.match(st.error, /damaged/);

  const cpq = { entry: { id: 'c', source: 'bank', topic: 'Salesforce CPQ' }, score: 0.70, confidence: 0.62 };
  const weak = { entry: { id: 'p', source: 'project:QTC' }, score: 0.56, confidence: 0.44 };
  assert.deepEqual(preferProject([cpq, weak], 0.5).map(r => r.entry.id), ['c', 'p']);

  const m = [{ q: 'x', a: 'y', confidence: 1, source: 'bank' }];
  assert.equal(BankService.reference(m, { semantic: false }), '');
  assert.match(BankService.reference(m, { semantic: true }), /REFERENCE/);
});
