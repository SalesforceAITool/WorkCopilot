// Answers through Claude Code with the user's own plan — checked against a stand-in CLI.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ClaudeCodeAnswerer, friendlyError } = require('../src/claude-code');

const FAKE = path.join(__dirname, 'helpers', 'fake-claude.js');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function setup(t, mode = 'ok') {
  const log = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cc-')), 'log.jsonl');
  process.env.FAKE_CC_LOG = log;
  process.env.FAKE_CC_MODE = mode;
  process.env.ANTHROPIC_API_KEY = 'sk-ant-should-never-reach-claude-code';
  process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:1';
  const a = new ClaudeCodeAnswerer({ name: 'Akshay', claudePath: FAKE });
  t.after(() => { a.dispose(); delete process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_BASE_URL; });
  const events = () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];
  return { a, events };
}

test('answers stream from Claude Code, which runs with no API key, no tools and the meeting setup', async (t) => {
  const { a, events } = setup(t);
  let streamed = '';
  const res = await a.answer({
    question: 'Why did you use a queueable?', transcript: 'so why a queueable', context: 'FILE: PriceRevisionQueueable.cls',
    meeting: { speed: 'balanced', scenario: 'client_demo', brief: 'Amkor business users' }, onDelta: d => (streamed += d)
  });
  assert.equal(streamed, '**Answer:** I used a Queueable because the SAP pricing call is a callout.');
  assert.equal(res.model, 'Claude Code · sonnet');
  const ask = events().find(e => e.event === 'ask');
  const spawn = events().find(e => e.event === 'spawn' && e.pid === ask.pid);
  assert.equal(spawn.hasApiKey, false, 'API key leaked to Claude Code: it would bill API credit instead of the plan');
  assert.equal(spawn.hasBaseUrl, false);
  const argv = spawn.argv;
  assert.ok(!argv.includes('--bare'), '--bare disables plan sign-in');
  assert.equal(argv[argv.indexOf('--tools') + 1], '', 'tools must be off: answer only');
  assert.ok(argv.includes('-p') && argv.includes('--strict-mcp-config') && argv.includes('--no-session-persistence'));
  assert.equal(argv[argv.indexOf('--input-format') + 1], 'stream-json');
  assert.notEqual(path.resolve(spawn.cwd), path.resolve(process.cwd()), 'must not run inside a project folder (CLAUDE.md)');
  assert.match(ask.systemPrompt, /Scenario: Client demo/);
  assert.match(ask.systemPrompt, /Amkor business users/);
  const content = ask.message.message.content;
  assert.equal(content[0].text, 'FILE: PriceRevisionQueueable.cls');
  assert.match(content.at(-1).text, /Question I was just asked:\nWhy did you use a queueable\?/);
});

test('speed picks the Claude Code model', async (t) => {
  const { a, events } = setup(t);
  for (const speed of ['fast', 'accurate']) await a.answer({ question: 'q', context: 'c', meeting: { speed } });
  const models = events().filter(e => e.event === 'ask').map(e => {
    const s = events().find(x => x.event === 'spawn' && x.pid === e.pid);
    return s.argv[s.argv.indexOf('--model') + 1];
  });
  assert.deepEqual(models, ['haiku', 'opus']);
});

test('the next question uses a Claude Code process started in advance (no startup wait)', async (t) => {
  const { a, events } = setup(t);
  const meeting = { speed: 'balanced' };
  await a.answer({ question: 'one', context: 'c', meeting });
  await sleep(300); // standby starts after the answer
  const before = Date.now();
  await a.answer({ question: 'two', context: 'c', meeting });
  const asks = events().filter(e => e.event === 'ask');
  assert.equal(asks.length, 2);
  assert.ok(asks[1].started < before, 'second answer had to start a fresh process');
});

test('a screenshot is passed to Claude Code as an image', async (t) => {
  const { a, events } = setup(t);
  await a.answer({ question: 'what is this error?', context: 'c', screenshotBase64: 'iVBORw0KGgo=' });
  const content = events().find(e => e.event === 'ask').message.message.content;
  assert.equal(content.find(b => b.type === 'image').source.data, 'iVBORw0KGgo=');
});

test('a newer question stops the one still answering', async (t) => {
  const { a } = setup(t, 'slow');
  const first = a.answer({ question: 'one', context: 'c' });
  await sleep(400);
  const second = a.answer({ question: 'two', context: 'c' });
  await assert.rejects(first, e => e.cancelled === true);
  await second;
});

test('not signed in, usage limit and not installed each give a clear next step', async (t) => {
  let { a } = setup(t, 'not_logged_in');
  await assert.rejects(a.answer({ question: 'q', context: 'c' }), /not signed in.*run "claude"/i);
  ({ a } = setup(t, 'limit'));
  await assert.rejects(a.answer({ question: 'q', context: 'c' }), /usage limit is reached/i);
  const missing = new ClaudeCodeAnswerer({ claudePath: path.join(os.tmpdir(), 'no-such-claude') });
  t.after(() => missing.dispose());
  await assert.rejects(missing.answer({ question: 'q', context: 'c' }), /Claude Code is not installed/);
  assert.match(friendlyError("'claude' is not recognized as an internal or external command"), /not installed/);
});
