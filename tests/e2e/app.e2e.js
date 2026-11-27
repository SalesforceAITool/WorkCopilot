// End-to-end: launches the real Electron app (main process, preload, renderer, IPC)
// against the fixture Salesforce project and a local fake Anthropic API.
// Run: npm run test:e2e   (on Linux CI: xvfb-run -a npm run test:e2e)
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
const SHOTS = process.env.E2E_SHOTS || path.join(os.tmpdir(), 'copilot-e2e-shots');

function reply(body) {
  const q = JSON.stringify(body.messages).toLowerCase();
  if (q.includes('governor')) return '**General:** Governor limits cap what one transaction can use.\n- 100 SOQL queries per synchronous transaction\n- In my project: WorkOrderTriggerHandler is bulkified\nFiles: WorkOrderTriggerHandler.cls';
  if (q.includes('slow first')) return 'old answer that must never win';
  if (body.system && body.system[1] && body.system[1].text.includes('Work_Time_Log.flow-meta.xml'))
    return '**Answer:** The Work Time Log flow logs technician time when a Work Order is completed.\n- I built it as an auto-launched flow\nFiles: Work_Time_Log.flow-meta.xml';
  return '**Not in your files.**';
}

test('real app: meeting setup → warm-up → grounded answer → generic answer → newest question wins', async (t) => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const api = await startMockAnthropic({ reply, delayMs: 15 });
  t.after(api.close);
  const cfgPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'copilot-cfg-')), 'config.json');
  fs.writeFileSync(cfgPath, JSON.stringify({ yourName: 'Akshay', projectFolders: [FIXTURE] }));

  const app = await electron.launch({
    executablePath: electronPath,
    args: [ROOT, '--no-sandbox'],
    env: { ...process.env, ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_BASE_URL: api.url, DEEPGRAM_API_KEY: '', COPILOT_CONFIG: cfgPath }
  });
  t.after(() => app.close().catch(() => {}));
  const win = await app.firstWindow();
  const pageErrors = [];
  win.on('pageerror', e => pageErrors.push(String(e)));
  win.on('console', m => { if (m.type() === 'error') pageErrors.push(m.text()); });
  await win.waitForLoadState('domcontentloaded');

  // 1. Meeting setup is the first screen when projects + key exist.
  await win.waitForSelector('#setup:not(.hidden)');
  await win.click('[data-speed="fast"]');
  await win.selectOption('#mScenario', 'client_demo');
  await win.click('#useExample');
  // Regression: ISSUE-003 — Start meeting button was below the fold. Found by /qa on 2026-10-19
  const start = await win.locator('#btnStart').boundingBox();
  const vh = await win.evaluate(() => window.innerHeight);
  assert.ok(start && start.y + start.height <= vh, `Start button off-screen (${start && start.y} > ${vh})`);
  // Regression: ISSUE-004 — question box squeezed to a few characters. Found by /qa on 2026-10-19
  assert.ok((await win.locator('#chat').boundingBox()).width >= 120, 'question box too narrow');
  await win.screenshot({ path: path.join(SHOTS, '1-meeting-setup.png') });
  await win.click('#btnStart');

  // No Deepgram key in this run: listening must explain itself, not fail silently.
  await win.waitForSelector('#notice:not(.hidden)');
  assert.match(await win.textContent('#notice'), /DEEPGRAM_API_KEY is missing/);
  // Regression: ISSUE-001 — banner text unreadable (light text on translucent yellow). Found by /qa on 2026-10-19
  const bgAlpha = await win.evaluate(() => {
    const m = getComputedStyle(document.querySelector('#notice')).backgroundColor.match(/rgba?\(([^)]+)\)/);
    const parts = m[1].split(',').map(Number);
    return parts.length === 4 ? parts[3] : 1;
  });
  assert.ok(bgAlpha >= 0.9, `notice background too transparent (alpha ${bgAlpha})`);

  // 2. Start meeting warmed the cache with the chosen speed's model.
  await waitFor(() => api.requests.some(r => r.body.max_tokens === 1));
  const warm = api.requests.find(r => r.body.max_tokens === 1).body;
  assert.equal(warm.model, 'claude-haiku-5-5');
  assert.match(warm.system[0].text, /Scenario: Client demo/);
  assert.match(warm.system[0].text, /business users/);

  const saved = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  assert.equal(saved.meeting.speed, 'fast');
  assert.equal(saved.meeting.scenario, 'client_demo');

  // 3. A question about his work is answered from the project files (Flow is indexed).
  await win.fill('#chat', 'How does your Work Time Log flow work?');
  await win.press('#chat', 'Enter');
  await win.waitForFunction(() => document.querySelector('#a').textContent.includes('Work Time Log flow logs technician time'));
  await win.waitForFunction(() => /Fast · whole project · [\d.]+s/.test(document.querySelector('#meta').textContent));
  const ask = api.requests.filter(r => r.body.stream).at(-1).body;
  assert.match(ask.system[1].text, /FILE: .*Work_Time_Log\.flow-meta\.xml/);
  assert.doesNotMatch(ask.system[1].text, /Admin\.profile-meta\.xml/);
  assert.deepEqual(ask.system[1].cache_control, { type: 'ephemeral' });
  await win.screenshot({ path: path.join(SHOTS, '2-work-answer.png') });

  // 4. Generic question → General: label.
  await win.fill('#chat', 'What are governor limits?');
  await win.press('#chat', 'Enter');
  await win.waitForFunction(() => document.querySelector('#a b') && document.querySelector('#a b').textContent === 'General:');
  await win.waitForFunction(() => /2\/2 .*[\d.]+s/.test(document.querySelector('#meta').textContent));
  await win.screenshot({ path: path.join(SHOTS, '3-general-answer.png') });

  // 5. Screenshot question immediately followed by a typed one: the newer one must win.
  await win.evaluate(() => { ask({ question: 'slow first question', withScreenshot: true }); ask({ question: 'How does your Work Time Log flow work?' }); });
  await win.waitForFunction(() => /Work Time Log flow logs/.test(document.querySelector('#a').textContent));
  await new Promise(r => setTimeout(r, 1500));
  assert.doesNotMatch(await win.textContent('#a'), /old answer that must never win/);
  const older = await win.evaluate(() => answers.at(-2).status);
  assert.equal(older, 'cancelled');

  assert.deepEqual(pageErrors, []);
});

async function waitFor(fn, ms = 10000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (fn()) return; await new Promise(r => setTimeout(r, 50)); }
  throw new Error('timed out waiting for condition');
}
