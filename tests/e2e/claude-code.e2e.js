// End-to-end: the real app answering through Claude Code (stand-in CLI), and the API path's
// "credit ran out" message pointing to that option.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { _electron: electron } = require('playwright-core');
const electronPath = require('electron');
const { startMockAnthropic } = require('../helpers/mock-anthropic');

const ROOT = path.join(__dirname, '..', '..');
const FIXTURE = path.join(ROOT, 'tests', 'fixtures', 'sf-project');
const FAKE = path.join(ROOT, 'tests', 'helpers', 'fake-claude.js');
const SHOTS = process.env.E2E_SHOTS || path.join(os.tmpdir(), 'copilot-e2e-shots');

async function launch(cfg, env) {
  const cfgPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'copilot-cc-')), 'config.json');
  fs.writeFileSync(cfgPath, JSON.stringify({ yourName: 'Akshay', projectFolders: [FIXTURE], ...cfg }));
  const app = await electron.launch({ executablePath: electronPath, args: [ROOT, '--no-sandbox'], env: { ...process.env, DEEPGRAM_API_KEY: '', COPILOT_CONFIG: cfgPath, ...env } });
  const win = await app.firstWindow();
  await win.waitForLoadState('domcontentloaded');
  return { app, win, cfgPath };
}
async function askTyped(win, q) {
  await win.evaluate(() => { document.querySelector('#setup').classList.add('hidden'); });
  await win.fill('#chat', q);
  await win.press('#chat', 'Enter');
}

test('answers through Claude Code with my plan; API out-of-credit points there', async (t) => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const log = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cclog-')), 'log.jsonl');

  // 1) Claude Code engine, no API key at all.
  let { app, win } = await launch({ answerEngine: 'claude-code', claudeCodePath: FAKE }, { ANTHROPIC_API_KEY: '', FAKE_CC_LOG: log, FAKE_CC_MODE: 'ok' });
  await win.click('#btnSettings');
  assert.equal(await win.inputValue('#optAnswerEngine'), 'claude-code');
  assert.match(await win.textContent('#answerEngineStatus'), /Claude Code found/);
  assert.doesNotMatch(await win.textContent('#keys'), /ANTHROPIC_API_KEY/);
  await win.screenshot({ path: path.join(SHOTS, 'c1-settings-claude-code.png') });
  await askTyped(win, 'Why did you use a queueable?');
  await win.waitForFunction(() => /SAP pricing call is a callout/.test(document.querySelector('#a').textContent), null, { timeout: 15000 });
  const ask = fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse).find(e => e.event === 'ask');
  assert.match(JSON.stringify(ask.message), /Work_Time_Log\.flow-meta\.xml/); // project context went to Claude Code
  await win.screenshot({ path: path.join(SHOTS, 'c2-answered-via-claude-code.png') });
  await app.close();

  // 2) API engine with no credit: clear message naming the fix and the Claude Code option.
  const api = await startMockAnthropic({ status: 400, errorType: 'invalid_request_error',
    errorMessage: 'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.' });
  t.after(api.close);
  ({ app, win } = await launch({ answerEngine: 'api' }, { ANTHROPIC_API_KEY: 'sk-test', ANTHROPIC_BASE_URL: api.url }));
  await askTyped(win, 'Why did you use a queueable?');
  await win.waitForFunction(() => /API credit has run out/.test(document.querySelector('#a').textContent), null, { timeout: 15000 });
  assert.match(await win.textContent('#a'), /Claude Code \(my Claude plan\)/);
  assert.doesNotMatch(await win.textContent('#a'), /\{"type":"error"/);
  await app.close();
});
