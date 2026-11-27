// End-to-end: moving, maximizing, minimizing, collapsing and resizing the real overlay window,
// and that its placement survives a restart. Drags use the real OS mouse (xdotool), because
// synthetic browser mouse events get scrambled while a window resizes under them.
// Needs a display, a window manager and xdotool:
//   xvfb-run -a -s "-screen 0 1920x1080x24" sh -c 'openbox & sleep 1; node --test tests/e2e/window.e2e.js'
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { _electron: electron } = require('playwright-core');
const electronPath = require('electron');
const { execFileSync } = require('child_process');
const { startMockAnthropic } = require('../helpers/mock-anthropic');
const xdo = (...args) => execFileSync('xdotool', args.map(String));

// Press at (x, y) on the screen, move in steps by (dx, dy), release.
async function realDrag(x, y, dx, dy, steps = 20) {
  xdo('mousemove', x, y); await sleep(100);
  xdo('mousedown', 1); await sleep(100);
  for (let i = 1; i <= steps; i++) { xdo('mousemove', Math.round(x + dx * i / steps), Math.round(y + dy * i / steps)); await sleep(25); }
  await sleep(150);
  xdo('mouseup', 1); await sleep(300);
}

const ROOT = path.join(__dirname, '..', '..');
const FIXTURE = path.join(ROOT, 'tests', 'fixtures', 'sf-project');
const SHOTS = process.env.E2E_SHOTS || path.join(os.tmpdir(), 'copilot-e2e-shots');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// The Linux test window manager can clip a maximized window by a pixel; Windows does not.
const near = (a, b, px = 2) => ['x', 'y', 'width', 'height'].every(k => Math.abs(a[k] - b[k]) <= px);

async function launch(cfgPath, apiUrl) {
  const app = await electron.launch({
    executablePath: electronPath,
    args: [ROOT, '--no-sandbox'],
    env: { ...process.env, ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_BASE_URL: apiUrl, DEEPGRAM_API_KEY: '', COPILOT_CONFIG: cfgPath }
  });
  const win = await app.firstWindow();
  await win.waitForLoadState('domcontentloaded');
  await sleep(300);
  const bounds = () => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getBounds());
  const workArea = () => app.evaluate(({ screen }) => screen.getPrimaryDisplay().workArea);
  return { app, win, bounds, workArea };
}

async function until(fn, ms = 4000, label = '') {
  const end = Date.now() + ms;
  let last;
  while (Date.now() < end) { last = await fn(); if (last) return last; await sleep(50); }
  throw new Error('timed out ' + label + ' ' + JSON.stringify(last));
}

test('overlay window: drag handle, maximize/restore, resize corner, collapse, minimize, remembered placement', async (t) => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const api = await startMockAnthropic({ reply: '**Answer:** The Work Time Log flow logs technician time.' });
  t.after(api.close);
  const cfgPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'copilot-win-')), 'config.json');
  fs.writeFileSync(cfgPath, JSON.stringify({ yourName: 'Akshay', projectFolders: [FIXTURE] }));

  let { app, win, bounds, workArea } = await launch(cfgPath, api.url);
  const errors = [];
  win.on('pageerror', e => errors.push(String(e)));

  // Move: there is a real drag handle (the rest of the toolbar is buttons).
  assert.equal(await win.evaluate(() => getComputedStyle(document.querySelector('.bar')).webkitAppRegion), 'drag');
  assert.equal(await win.evaluate(() => getComputedStyle(document.querySelector('#dragGrip')).webkitAppRegion), 'drag');
  assert.ok((await win.locator('#dragGrip').boundingBox()).width >= 10);
  assert.equal(await win.evaluate(() => getComputedStyle(document.querySelector('#btnMax')).webkitAppRegion), 'no-drag');

  const start = await bounds();

  // Maximize fills the screen; restore returns to the exact previous size and place.
  await win.click('#btnMax');
  const wa = await workArea();
  await until(async () => near(await bounds(), wa), 4000, 'maximize');
  assert.equal(await win.textContent('#btnMax'), '❐');
  assert.equal(await win.isVisible('#resizeGrip'), false);
  await win.screenshot({ path: path.join(SHOTS, 'w1-maximized.png') });
  await win.click('#btnMax');
  await until(async () => near(await bounds(), start, 0), 4000, 'restore');
  assert.equal(await win.textContent('#btnMax'), '□');

  // Resize corner: a real mouse drag 200px right, 100px down.
  const g = await win.locator('#resizeGrip').boundingBox();
  await realDrag(start.x + g.x + 8, start.y + g.y + 8, 200, 100);
  const resized = await until(async () => { const b = await bounds(); return b.width === start.width + 200 && b; }, 4000, 'resize');
  assert.equal(resized.height, start.height + 100);
  assert.equal(resized.x, start.x);
  assert.equal(resized.y, start.y);

  // Collapse to the toolbar; a new question expands it again by itself.
  await win.click('#btnCompact');
  await until(async () => (await bounds()).height === 58, 4000, 'collapse');
  assert.equal(await win.isVisible('#card'), false);
  assert.equal(await win.isVisible('#chat'), true);
  await win.screenshot({ path: path.join(SHOTS, 'w2-collapsed.png') });
  await win.fill('#chat', 'How does your Work Time Log flow work?');
  await win.press('#chat', 'Enter');
  await until(async () => (await bounds()).height === resized.height, 4000, 'auto-expand');
  await win.waitForFunction(() => /Work Time Log flow logs/.test(document.querySelector('#a').textContent));

  // Minimize to the taskbar, and the Ctrl+Alt+H path restores it.
  await win.click('#btnMin');
  await until(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isMinimized()), 4000, 'minimize');
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].restore());
  await until(async () => !(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isMinimized())), 4000, 'unminimize');

  // Move: a real drag of the ⠿ handle 300px left and 200px down.
  const here = await bounds();
  const h = await win.locator('#dragGrip').boundingBox();
  await realDrag(here.x + h.x + h.width / 2, here.y + h.y + h.height / 2, -300, 200);
  const moved = await until(async () => { const b = await bounds(); return Math.abs(b.x - (here.x - 300)) <= 20 && Math.abs(b.y - (here.y + 200)) <= 20 && b; }, 4000, 'move');
  assert.equal(moved.width, here.width);
  await win.screenshot({ path: path.join(SHOTS, 'w3-moved-resized.png') });

  // Restarted: it reopens in the same place and size.
  await sleep(700); // placement is saved shortly after a move
  const before = await bounds();
  await app.close();
  const saved = JSON.parse(fs.readFileSync(cfgPath, 'utf8')).window;
  assert.deepEqual(saved.bounds, before);
  assert.equal(saved.mode, 'normal');

  ({ app, win, bounds } = await launch(cfgPath, api.url));
  assert.deepEqual(await bounds(), before);

  // Maximized state is remembered too.
  await win.click('#btnMax');
  await until(async () => near(await bounds(), wa), 4000, 'maximize again');
  await sleep(700);
  await app.close();
  ({ app, win, bounds } = await launch(cfgPath, api.url));
  await until(async () => near(await bounds(), wa), 4000, 'maximize');
  await win.click('#btnMax');
  await until(async () => near(await bounds(), before, 0), 4000, 'restore after restart');
  await app.close();

  assert.deepEqual(errors, []);
});
