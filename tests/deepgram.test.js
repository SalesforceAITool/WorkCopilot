// Deepgram listen URL: language and vocabulary hints (keyterms) built from Salesforce, project and meeting terms.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const http = require('http');
const dg = require('../src/deepgram');
const { ProjectIndex } = require('../src/context');

const FIXTURE = path.join(__dirname, 'fixtures', 'sf-project');

test('URL asks for Nova-3 with the chosen language and every keyterm', () => {
  const u = new URL(dg.listenUrl({ language: 'en-IN', terms: ['Queueable', 'Work Time Log'] }));
  assert.equal(u.origin + u.pathname, 'wss://api.deepgram.com/v1/listen');
  assert.equal(u.searchParams.get('model'), 'nova-3');
  assert.equal(u.searchParams.get('language'), 'en-IN');
  assert.deepEqual(u.searchParams.getAll('keyterm'), ['Queueable', 'Work Time Log']);
  // English only: anything else (old "multi"/Hindi settings) becomes Indian English, never multilingual.
  for (const old of ['multi', 'hi', 'nonsense', undefined]) assert.equal(new URL(dg.listenUrl({ language: old })).searchParams.get('language'), 'en-IN');
  assert.equal(new URL(dg.listenUrl({ language: 'en' })).searchParams.get('language'), 'en');
});

test('keyterms: meeting terms first, then project words, then Salesforce terms; no duplicates; within limits', () => {
  const idx = new ProjectIndex({ projectFolders: [FIXTURE] });
  idx.build();
  const terms = dg.keyterms({ meetingTerms: 'Amkor, QTC-1566, queueable', files: idx.files });
  assert.deepEqual(terms.slice(0, 3), ['Amkor', 'QTC-1566', 'queueable']);
  assert.ok(!terms.slice(3).some(t => t.toLowerCase() === 'queueable'), 'duplicate Queueable');
  assert.equal(terms[3], 'revised', 'distinctive project word (Revised_Price__c) follows the meeting terms');
  assert.ok(!terms.includes('uploader') && !terms.includes('handler'), 'generic code words are not hints');
  assert.ok(terms.includes('Lightning Web Component') && terms.includes('SOQL') && terms.includes('OmniStudio'));
  assert.ok(terms.length <= 60);
  const tokens = terms.reduce((n, t) => n + Math.ceil(t.length / 4) + 1, 0);
  assert.ok(tokens <= 450, `keyterms too long for Deepgram: ~${tokens} tokens`);
});

test('project words skip generic code words and keep distinctive names', () => {
  const files = ['AmkorPricingService.cls', 'AmkorInvoiceBatch.cls', 'QtcRegionHandler.cls', 'AccountTriggerHandler.cls', 'Revised_Price__c.field-meta.xml']
    .map(rel => ({ rel }));
  const words = dg.projectTerms(files);
  assert.equal(words[0], 'amkor');
  assert.ok(words.includes('pricing') && words.includes('region'));
  for (const generic of ['handler', 'trigger', 'service', 'batch', 'account', 'invoice', 'price']) assert.ok(!words.includes(generic), generic);
});

test('a huge meeting-terms list is cut to fit', () => {
  const many = Array.from({ length: 200 }, (_, i) => `ClientProductName${i}`).join(', ');
  const terms = dg.keyterms({ meetingTerms: many });
  assert.equal(terms.filter(x => x.startsWith('ClientProduct')).length, 25, 'at most 25 meeting terms');
  assert.ok(terms.includes('Queueable'), 'Salesforce terms still fit after a long meeting list');
  assert.ok(terms.reduce((n, t) => n + Math.ceil(t.length / 4) + 1, 0) <= 450);
});

test('key check: accepted, rejected, unreachable', async (t) => {
  const server = http.createServer((req, res) => {
    const ok = req.headers.authorization === 'Token good';
    res.writeHead(req.url === '/v1/projects' && ok ? 200 : 401, { 'content-type': 'application/json' });
    res.end('{}');
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal(await dg.checkKey(fetch, 'good', base), true);
  assert.equal(await dg.checkKey(fetch, 'bad', base), false);
  await assert.rejects(dg.checkKey(fetch, 'good', 'http://127.0.0.1:1'));
});
