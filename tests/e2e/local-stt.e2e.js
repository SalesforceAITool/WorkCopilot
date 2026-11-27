// End-to-end: free offline transcription in the real app.
// Fresh model folder → Listen downloads the Whisper model (real GitHub download, progress shown) →
// a spoken question arrives as meeting audio (Chromium's fake capture device) → Whisper on this machine turns it into
// text → the question is auto-answered.
// Needs SPEECH_WAV (a recording of a question) and network access to github.com.
//   xvfb-run -a sh -c 'openbox & sleep 1; SPEECH_WAV=q.wav node --test tests/e2e/local-stt.e2e.js'
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
const WAV = process.env.SPEECH_WAV;

// The simulated mic loops the file: give it quiet before and after so it sounds like one question.
function paddedQuestion(src) {
  const sherpa = require('sherpa-onnx-node');
  const w = sherpa.readWave(src);
  const quiet = Math.round(w.sampleRate * 1.5);
  const out = new Float32Array(quiet + w.samples.length + quiet * 3);
  for (let i = 0; i < out.length; i++) out[i] = (Math.random() * 2 - 1) * 0.001; // room tone
  out.set(w.samples, quiet);
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'q-')), 'question.wav');
  sherpa.writeWave(file, { samples: out, sampleRate: w.sampleRate });
  return file;
}

test('free offline listening (Parakeet): downloads the model, hears a spoken question, answers it', { skip: !WAV && 'SPEECH_WAV not set', timeout: 600000 }, async (t) => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const api = await startMockAnthropic({ reply: '**Answer:** I used a Queueable so the SAP pricing callout runs async.' });
  t.after(api.close);
  const modelDir = fs.mkdtempSync(path.join(os.tmpdir(), 'models-'));
  const cfgPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'copilot-stt-')), 'config.json');
  fs.writeFileSync(cfgPath, JSON.stringify({
    // Default model (Parakeet) and default language (English + Hindi mix), answers via the fake API.
    yourName: 'Akshay', projectFolders: [FIXTURE], transcriber: 'local', answerEngine: 'api',
    // System audio only (the real meeting path). On Linux the fake audio file feeds both the
    // system-audio and mic tracks, and two overlapping copies would sound like non-stop speech.
    modelDir, includeMic: false, transcriptLanguage: 'multi', autoAnswer: true
  }));

  const app = await electron.launch({
    executablePath: electronPath,
    args: [ROOT, '--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${paddedQuestion(WAV)}`],
    env: { ...process.env, ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_BASE_URL: api.url, DEEPGRAM_API_KEY: '', COPILOT_CONFIG: cfgPath }
  });
  t.after(() => app.close().catch(() => {}));
  const win = await app.firstWindow();
  const errors = [];
  win.on('pageerror', e => errors.push(String(e)));
  await win.waitForLoadState('domcontentloaded');

  // Settings show the free engine, model not downloaded yet.
  await win.click('#btnSettings');
  assert.equal(await win.inputValue('#optEngine'), 'local');
  assert.match(await win.textContent('#modelStatus'), /not downloaded yet/);
  assert.doesNotMatch(await win.textContent('#keys'), /DEEPGRAM/);
  await win.screenshot({ path: path.join(SHOTS, 's1-settings-free-offline.png') });

  // Listen: one-time download with visible progress, then listening.
  await win.click('#btnListen');
  await win.waitForFunction(() => /Downloading the free speech model.*MB/.test(document.querySelector('#notice').textContent), null, { timeout: 120000 });
  await win.screenshot({ path: path.join(SHOTS, 's2-downloading.png') });
  await win.waitForFunction(() => document.querySelector('#listenLabel').textContent === 'Listening', null, { timeout: 400000 });
  const P = 'sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8';
  for (const f of ['encoder.int8.onnx', 'decoder.int8.onnx', 'joiner.int8.onnx', 'tokens.txt']) assert.ok(fs.existsSync(path.join(modelDir, P, f)), f);
  assert.equal(fs.existsSync(path.join(modelDir, P + '.tar.bz2')), false);
  assert.equal(fs.existsSync(path.join(modelDir, P, 'test_wavs')), false, 'unpacked files it never uses');

  // The spoken question is transcribed on this machine and answered automatically.
  await win.waitForFunction(() => /why did you use a \w+ for the price revision/i.test(document.querySelector('#transcript').textContent), null, { timeout: 60000 });
  await win.waitForFunction(() => /SAP pricing callout runs async/.test(document.querySelector('#a').textContent), null, { timeout: 30000 });
  const asked = api.requests.filter(r => r.body.stream).map(r => JSON.stringify(r.body.messages)).join(' ');
  assert.match(asked, /use a \w+ for the price revision/i);
  await win.screenshot({ path: path.join(SHOTS, 's3-heard-and-answered.png') });

  // Stop listening releases the engine cleanly.
  await win.click('#btnListen');
  await win.waitForFunction(() => document.querySelector('#listenLabel').textContent === 'Listen');
  assert.deepEqual(errors, []);
});
