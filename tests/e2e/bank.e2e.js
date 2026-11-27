// End-to-end: the real app with the real Q&A bank and the real sentence model (local copy:
// COPILOT_TEXT_MODEL_DIR). Instant stored answer, Claude given the reference answers,
// "Q&A bank only" mode not calling Claude, and a CPQ question leading with my project answer.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { _electron: electron } = require('playwright-core');
const electronPath = require('electron');

const ROOT = path.join(__dirname, '..', '..');
const FIXTURE = path.join(ROOT, 'tests', 'fixtures', 'sf-project');
const FAKE = path.join(ROOT, 'tests', 'helpers', 'fake-claude.js');
const SHOTS = process.env.E2E_SHOTS || path.join(os.tmpdir(), 'copilot-e2e-shots');
const MODEL = process.env.COPILOT_TEXT_MODEL_DIR;

const PROJECT = [{
  id: 'proj-qtc-001', topic: 'QTC project — classes', level: 'mid', type: 'scenario',
  q: 'How did you use CPQ price rules and pricing in the QTC project?',
  alt: ['How does pricing work in your CPQ project?', 'Explain the price rules you built in QTC'],
  a: 'In QTC the quote line trigger handler, AMT_QuoteLineTriggerHandler, reads the matching price record and sets the net price on SBQQ__QuoteLine__c, so CPQ calculation starts from the Amkor price. That is the project answer for this test and it is long enough.',
  points: ['AMT_QuoteLineTriggerHandler sets prices'], tags: ['cpq', 'pricing']
}];

async function launch(cfg, env) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilot-bank-'));
  const cfgPath = path.join(dir, 'config.json');
  fs.writeFileSync(cfgPath, JSON.stringify({ yourName: 'Akshay', projectFolders: [FIXTURE], answerEngine: 'claude-code', claudeCodePath: FAKE, ...cfg }));
  const kb = path.join(dir, 'project-kb');
  fs.mkdirSync(kb);
  fs.writeFileSync(path.join(kb, 'qtc.json'), JSON.stringify(PROJECT));
  const app = await electron.launch({ executablePath: electronPath, args: [ROOT, '--no-sandbox'],
    env: { ...process.env, DEEPGRAM_API_KEY: '', ANTHROPIC_API_KEY: '', COPILOT_CONFIG: cfgPath, COPILOT_PROJECT_KB: kb, COPILOT_TEXT_MODEL_DIR: MODEL, ...env } });
  const win = await app.firstWindow();
  await win.waitForLoadState('domcontentloaded');
  await win.evaluate(() => { document.querySelector('#setup').classList.add('hidden'); });
  await win.waitForFunction(() => typeof state !== 'undefined' && state.bank && ['ready', 'keyword-only'].includes(state.bank.state), null, { timeout: 240000, polling: 500 })
    .catch(() => {});
  const bank = await win.evaluate(() => state.bank);
  assert.equal(bank && bank.state, 'ready', `smart matching should be ready: ${JSON.stringify(bank)}`);
  return { app, win };
}
async function ask(win, q) {
  await win.evaluate(() => { document.querySelector('#card').classList.remove('hidden'); });
  await win.fill('#chat', q);
  await win.press('#chat', 'Enter');
}
const events = (log) => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];

test('Q&A bank in the real app', { skip: !MODEL && 'set COPILOT_TEXT_MODEL_DIR to a local all-MiniLM-L6-v2' }, async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const log = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cclog-')), 'log.jsonl');

  // 1) Both: stored answer appears, then Claude's, which was given the reference answers.
  let { app, win } = await launch({ answerSource: 'both' }, { FAKE_CC_LOG: log, FAKE_CC_MODE: 'ok' });
  assert.match(await win.evaluate(() => JSON.stringify(state.bank.sources)), /qtc/);
  await ask(win, 'how would you stop a trigger from running recursively');
  await win.waitForSelector('#a .bank-head', { timeout: 15000 });
  assert.match(await win.textContent('#a .bank-q'), /recurs/i);
  await win.waitForFunction(() => /SAP pricing call is a callout/.test(document.querySelector('#a').textContent), null, { timeout: 20000 });
  const sent = JSON.stringify(events(log).find(e => e.event === 'ask').message);
  assert.match(sent, /REFERENCE ANSWERS FROM MY Q&A BANK/);
  assert.match(sent, /recurs/i);
  await win.screenshot({ path: path.join(SHOTS, 'b1-bank-plus-claude.png') });

  // 2) A CPQ question about my work leads with my project answer.
  await ask(win, 'how does pricing work in your CPQ project');
  await win.waitForFunction(() => document.querySelectorAll('#a .bank-head').length && /Your project/.test(document.querySelector('#a .bank-head').textContent), null, { timeout: 15000 });
  assert.match(await win.textContent('#a .bank-q'), /QTC project/);
  await win.screenshot({ path: path.join(SHOTS, 'b2-cpq-project-first.png') });

  // 3) Ordinary chatter: no stored answer shown.
  await ask(win, 'can everyone hear me okay, shall we start');
  await win.waitForFunction(() => /SAP pricing call/.test(document.querySelector('#a').textContent) && /can everyone hear/.test(document.querySelector('#q').textContent), null, { timeout: 20000 });
  assert.equal(await win.$('#a .bank-head'), null);
  await app.close();

  // 4) Bank only: a matched question is answered from the bank and Claude is not called.
  const log2 = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cclog-')), 'log.jsonl');
  ({ app, win } = await launch({ answerSource: 'bank' }, { FAKE_CC_LOG: log2, FAKE_CC_MODE: 'ok' }));
  await ask(win, 'what is the difference between a future method and queueable apex');
  await win.waitForSelector('#a .bank-head', { timeout: 15000 });
  await win.waitForFunction(() => /done|s\b/.test(document.querySelector('#meta').textContent) || !/Claude is adding/.test(document.querySelector('#a').textContent), null, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1500));
  assert.doesNotMatch(await win.textContent('#a'), /Claude is adding|SAP pricing call/);
  assert.equal(events(log2).filter(e => e.event === 'ask').length, 0, 'Claude must not be asked in bank-only mode');
  await win.screenshot({ path: path.join(SHOTS, 'b3-bank-only.png') });

  // 5) Search panel.
  await win.click('#btnBank');
  await win.fill('#bankQuery', 'database stateful');
  await win.waitForSelector('#bankResults .bank-item', { timeout: 10000 });
  assert.match(await win.textContent('#bankResults .bank-item summary'), /Stateful/i);
  await win.screenshot({ path: path.join(SHOTS, 'b4-bank-search.png') });
  await app.close();
});
