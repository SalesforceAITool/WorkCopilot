// End-to-end: pasting a Deepgram key in ⚙ (checked against a fake Deepgram), saved to .env,
// and the live-transcription URL the app builds: Indian English + Salesforce/project/meeting vocabulary.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { _electron: electron } = require('playwright-core');
const electronPath = require('electron');

const ROOT = path.join(__dirname, '..', '..');
const FIXTURE = path.join(ROOT, 'tests', 'fixtures', 'sf-project');
const SHOTS = process.env.E2E_SHOTS || path.join(os.tmpdir(), 'copilot-e2e-shots');
const GOOD = 'dg_test_0123456789abcdefghijklmnop';

test('Deepgram key box, saved key, and vocabulary-hinted listen URL', async (t) => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const fakeDeepgram = http.createServer((req, res) => {
    res.writeHead(req.headers.authorization === `Token ${GOOD}` ? 200 : 401, { 'content-type': 'application/json' });
    res.end('{"projects":[]}');
  });
  await new Promise(r => fakeDeepgram.listen(0, '127.0.0.1', r));
  t.after(() => fakeDeepgram.close());
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'copilot-dg-'));
  const cfgPath = path.join(dir, 'config.json');
  const envPath = path.join(dir, '.env');
  fs.writeFileSync(envPath, '# my settings\nANTHROPIC_API_KEY=\n');
  fs.writeFileSync(cfgPath, JSON.stringify({ yourName: 'Akshay', projectFolders: [FIXTURE], transcriber: 'local', transcriptLanguage: 'en-IN' }));

  const app = await electron.launch({
    executablePath: electronPath, args: [ROOT, '--no-sandbox'],
    env: { ...process.env, DEEPGRAM_API_KEY: '', ANTHROPIC_API_KEY: '', COPILOT_CONFIG: cfgPath, COPILOT_ENV: envPath,
      DEEPGRAM_API_BASE: `http://127.0.0.1:${fakeDeepgram.address().port}` }
  });
  t.after(() => app.close().catch(() => {}));
  const win = await app.firstWindow();
  const errors = [];
  win.on('pageerror', e => errors.push(String(e)));
  await win.waitForLoadState('domcontentloaded');

  await win.click('#btnSettings');
  assert.equal(await win.inputValue('#optLang'), 'en-IN');
  assert.match(await win.textContent('#deepgramHint'), /\$200 free credit/);

  await win.fill('#deepgramKey', 'dg_wrong_0123456789abcdefghijklm');
  await win.click('#btnSaveDeepgram');
  await win.waitForFunction(() => /rejected/.test(document.querySelector('#deepgramResult').textContent));
  assert.doesNotMatch(fs.readFileSync(envPath, 'utf8'), /DEEPGRAM_API_KEY/);

  await win.fill('#deepgramKey', GOOD);
  await win.click('#btnSaveDeepgram');
  await win.waitForFunction(() => /Key works/.test(document.querySelector('#deepgramResult').textContent));
  assert.equal(await win.inputValue('#optEngine'), 'deepgram');
  const env = fs.readFileSync(envPath, 'utf8');
  assert.match(env, /^# my settings$/m, 'other .env lines kept');
  assert.match(env, new RegExp(`^DEEPGRAM_API_KEY=${GOOD}$`, 'm'));
  assert.equal(JSON.parse(fs.readFileSync(cfgPath, 'utf8')).transcriber, 'deepgram');
  await win.screenshot({ path: path.join(SHOTS, 'd1-deepgram-key-saved.png') });

  // Meeting terms + project words + Salesforce terms in the URL the app will listen with.
  await win.evaluate(() => copilot.setMeeting({ ...state.config.meeting, terms: 'Amkor, QTC-1566' }));
  const url = new URL(await win.evaluate(() => copilot.deepgramUrl()));
  assert.equal(url.searchParams.get('model'), 'nova-3');
  assert.equal(url.searchParams.get('language'), 'en-IN');
  const terms = url.searchParams.getAll('keyterm');
  assert.deepEqual(terms.slice(0, 3), ['Amkor', 'QTC-1566', 'revised']);
  assert.ok(terms.includes('Queueable') && terms.includes('Lightning Web Component'));
  assert.deepEqual(errors, []);
});
