// End-to-end self test: each step reports plainly, failures say what to fix.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runSelfTest, parseWav, SAMPLE_QUESTION_FILE } = require('../src/self-test');

const good = (over = {}) => ({
  engine: 'claude-code', claudeFound: true, hasApiKey: false,
  complete: async () => 'OK',
  waitBank: async (p) => { p(50); return { state: 'ready', entries: 1614, sources: [{ name: 'Salesforce Q&A bank', count: 1342 }, { name: 'Project: amkor-qtc', count: 272 }] }; },
  find: async (q) => /CPQ project/.test(q) ? { show: true, matches: [{ source: 'project:amkor-qtc', confidence: 0.9 }] }
    : /Stateful/.test(q) ? { show: true, matches: [{ source: 'bank', confidence: 0.85 }] }
    : { show: false, matches: [{ source: 'bank', confidence: 0.3 }] },
  hasProjectQA: true, projectFiles: 236, transcriber: 'local', deepgramKey: '', speechInstalled: true,
  transcribeSample: async () => 'Why did you use a cuable for the price revision callout?',
  ...over
});
async function run(d) {
  const steps = [];
  const res = await runSelfTest(d, s => steps.push(s));
  const final = {};
  for (const s of steps) if (s.status !== 'running') final[s.id] = s;
  return { res, steps, final };
}

test('all good: every step passes and the heard question is handed on for the meeting-flow test', async () => {
  const { res, steps, final } = await run(good());
  assert.equal(res.ok, true);
  assert.equal(res.transcript, 'Why did you use a cuable for the price revision callout?');
  assert.deepEqual(Object.keys(final), ['claude', 'bank', 'instant', 'project', 'speech']);
  for (const s of Object.values(final)) assert.equal(s.status, 'ok', `${s.id}: ${s.detail}`);
  assert.match(final.claude.detail, /Claude Code \(your plan\) replied in/);
  assert.match(final.bank.detail, /1614 questions.*project amkor-qtc: 272/);
  assert.ok(steps.some(s => s.id === 'bank' && /preparing smart matching… 50%/.test(s.detail || '')));
  assert.match(final.instant.detail, /✓ project question.*✓ general question.*✓ small talk/);
});

test('problems are explained with the fix, and later steps still run', async () => {
  const { res, final } = await run(good({
    claudeFound: false,
    waitBank: async () => ({ state: 'keyword-only', error: 'fetch failed', entries: 1614, sources: [] }),
    projectFiles: 0, speechInstalled: false
  }));
  assert.equal(res.ok, false);
  assert.equal(final.claude.status, 'fail');
  assert.match(final.claude.detail, /irm https:\/\/claude\.ai\/install\.ps1 \| iex/);
  assert.equal(final.bank.status, 'warn');
  assert.match(final.bank.detail, /fetch failed.*internet once/);
  assert.equal(final.instant.status, 'warn');
  assert.equal(final.project.status, 'warn');
  assert.match(final.project.detail, /Add it in ⚙/);
  assert.equal(final.speech.status, 'warn');
  assert.match(final.speech.detail, /Download now/);
  assert.equal(res.transcript, '');
});

test('a Claude error (e.g. not signed in) fails that step with its message; Deepgram without a key fails speech', async () => {
  const { final } = await run(good({
    complete: async () => { throw new Error('Claude Code is not signed in. Open a terminal, run "claude"…'); },
    transcriber: 'deepgram', deepgramKey: ''
  }));
  assert.equal(final.claude.status, 'fail');
  assert.match(final.claude.detail, /not signed in/);
  assert.equal(final.speech.status, 'fail');
  assert.match(final.speech.detail, /no key is saved/);
});

test('a wrong instant match is flagged; no project Q&A loaded is not held against the project check', async () => {
  const swapped = await run(good({ find: async () => ({ show: true, matches: [{ source: 'bank', confidence: 0.7 }] }) }));
  assert.equal(swapped.final.instant.status, 'warn');
  assert.match(swapped.final.instant.detail, /✗ small talk/);
  const noProject = await run(good({ hasProjectQA: false, find: async (q) => /hear me/.test(q) ? { show: false, matches: [{ source: 'bank', confidence: 0.2 }] } : { show: true, matches: [{ source: 'bank', confidence: 0.8 }] } }));
  assert.equal(noProject.final.instant.status, 'ok');
});

test('the bundled test recording is a readable 16-bit WAV of a few seconds', () => {
  const { samples, sampleRate } = parseWav(fs.readFileSync(path.join(__dirname, '..', 'assets', SAMPLE_QUESTION_FILE)));
  assert.equal(sampleRate, 22050);
  assert.ok(samples.length / sampleRate > 2 && samples.length / sampleRate < 6);
  let peak = 0;
  for (let i = 0; i < Math.min(samples.length, 50000); i++) peak = Math.max(peak, Math.abs(samples[i]));
  assert.ok(peak > 0.05, 'has sound');
  assert.throws(() => parseWav(Buffer.from('not a wav file at all')), /not a WAV/);
});
