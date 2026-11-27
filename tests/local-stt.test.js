// Free offline transcription: model install (download, unpack, fallbacks) and real speech → text.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');
const stt = require('../src/local-stt');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'stt-'));

// A fake release server: a tiny .tar.bz2 with the base model's file names, plus the VAD file.
function fakeArchive() {
  const src = tmp();
  const dir = path.join(src, 'sherpa-onnx-whisper-base');
  fs.mkdirSync(path.join(dir, 'test_wavs'), { recursive: true });
  for (const f of ['base-encoder.int8.onnx', 'base-decoder.int8.onnx', 'base-tokens.txt', 'base-encoder.onnx', 'test_wavs/0.wav']) {
    fs.writeFileSync(path.join(dir, f), 'x'.repeat(1000));
  }
  const out = path.join(tmp(), 'sherpa-onnx-whisper-base.tar.bz2');
  execFileSync('tar', ['-cjf', out, '-C', src, 'sherpa-onnx-whisper-base']);
  return fs.readFileSync(out);
}

function serve(routes) {
  const hits = [];
  const server = http.createServer((req, res) => {
    hits.push(req.url);
    const body = routes[req.url];
    if (body === undefined) { res.writeHead(404); return res.end(); }
    if (body === 'CUT') { res.writeHead(200, { 'content-length': 5000 }); res.write('x'.repeat(100)); return res.destroy(); }
    res.writeHead(200, { 'content-length': body.length });
    res.end(body);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ url: `http://127.0.0.1:${server.address().port}/`, hits, close: () => server.close() })));
}

test('install: downloads, unpacks only the files used, deletes the archive, reports progress', async (t) => {
  const srv = await serve({ '/silero_vad.onnx': Buffer.from('vad'), '/sherpa-onnx-whisper-base.tar.bz2': fakeArchive() });
  t.after(srv.close);
  const dir = tmp();
  const stages = new Set();
  assert.equal(stt.isInstalled(dir, 'base'), false);
  await stt.install(dir, 'base', { baseUrl: srv.url, onProgress: p => stages.add(p.stage) });
  assert.equal(stt.isInstalled(dir, 'base'), true);
  assert.deepEqual([...stages], ['download', 'unpack', 'ready']);
  assert.equal(fs.existsSync(path.join(dir, 'sherpa-onnx-whisper-base.tar.bz2')), false);
  assert.equal(fs.existsSync(path.join(dir, 'sherpa-onnx-whisper-base', 'base-encoder.onnx')), false, 'unpacked unused fp32 file');

  // Second run: nothing downloaded again.
  const before = srv.hits.length;
  await stt.install(dir, 'base', { baseUrl: srv.url });
  assert.equal(srv.hits.length, before);
});

test('install: falls back to the built-in unpacker when system tar is unavailable', async (t) => {
  const srv = await serve({ '/silero_vad.onnx': Buffer.from('vad'), '/sherpa-onnx-whisper-base.tar.bz2': fakeArchive() });
  t.after(srv.close);
  const dir = tmp();
  const noTar = () => Promise.reject(new Error('tar: not found'));
  await stt.install(dir, 'base', { baseUrl: srv.url, extractors: [noTar, stt.extractWithJs] });
  assert.equal(stt.isInstalled(dir, 'base'), true);
});

test('install: a cut-off or missing download fails clearly and leaves nothing half-installed', async (t) => {
  const srv = await serve({ '/silero_vad.onnx': Buffer.from('vad'), '/sherpa-onnx-whisper-base.tar.bz2': 'CUT' });
  t.after(srv.close);
  const dir = tmp();
  await assert.rejects(stt.install(dir, 'base', { baseUrl: srv.url }), /cut off|terminated|fetch failed|other side closed/i);
  assert.equal(stt.isInstalled(dir, 'base'), false);
  assert.equal(fs.existsSync(path.join(dir, 'sherpa-onnx-whisper-base.tar.bz2')), false);
  await assert.rejects(stt.install(tmp(), 'turbo', { baseUrl: srv.url }), /Download failed \(404\)/);
});

test('offline models: Parakeet is the default; Whisper never auto-detects language (Indian English came out as Hindi)', () => {
  assert.equal(stt.DEFAULT_MODEL, 'parakeet');
  assert.equal(stt.whisperLanguage('multi'), 'en');
  assert.equal(stt.whisperLanguage('en-IN'), 'en');
  assert.equal(stt.whisperLanguage('hi'), 'en', 'English only');
  const dir = '/models';
  const p = stt.recognizerConfig(dir, 'parakeet', 'multi', 2);
  assert.equal(p.modelConfig.modelType, 'nemo_transducer');
  assert.match(p.modelConfig.transducer.joiner, /sherpa-onnx-nemo-parakeet-tdt-0\.6b-v2-int8[\/\\]joiner\.int8\.onnx$/);
  const turbo = stt.recognizerConfig(dir, 'turbo', 'multi', 2);
  assert.equal(turbo.featConfig.featureDim, 128, 'turbo needs 128 mel bins');
  assert.equal(turbo.modelConfig.whisper.language, 'en');
  assert.equal(stt.recognizerConfig(dir, 'base', 'hi', 2).modelConfig.whisper.language, 'en');
  assert.throws(() => stt.recognizerConfig(dir, 'nope', 'en', 2), /Unknown speech model/);
});

test('Whisper "hearing" filler in silence is dropped', () => {
  for (const junk of ['[Music]', '(silence)', 'Thank you.', 'you', '...', '♪♪']) assert.equal(stt.cleanText(junk), '');
  assert.equal(stt.cleanText('  Why did you   use a queueable? '), 'Why did you use a queueable?');
});

// Real model, real speech. Set WHISPER_MODEL_DIR to a folder holding sherpa-onnx-whisper-base/ and silero_vad.onnx,
// and SPEECH_WAV to a recording of the question below.
const MODEL_DIR = process.env.WHISPER_MODEL_DIR;
const REAL_MODEL = process.env.STT_MODEL || 'base';
test(`real speech in small live chunks becomes one sentence (${REAL_MODEL})`, { skip: !MODEL_DIR && 'WHISPER_MODEL_DIR not set' }, async () => {
  const sherpa = require('sherpa-onnx-node');
  const wav = sherpa.readWave(process.env.SPEECH_WAV);
  const tr = await stt.LocalTranscriber.create({ modelDir: MODEL_DIR, model: REAL_MODEL, language: 'multi' });
  const texts = [];
  const speaking = [];
  const decodedLengths = [];
  const decode = tr.decode.bind(tr);
  tr.decode = (samples) => { decodedLengths.push(samples.length); return decode(samples); };
  tr.onText = t => texts.push(t);
  tr.onSpeaking = s => speaking.push(s);
  const chunk = Math.round(wav.sampleRate / 10); // 100 ms, like the app sends
  const silence = new Float32Array(wav.sampleRate); // 1 s of quiet after the question
  const all = new Float32Array(wav.samples.length + silence.length * 2);
  all.set(silence); all.set(wav.samples, silence.length);
  for (let i = 0; i < all.length; i += chunk) tr.accept(all.subarray(i, i + chunk), wav.sampleRate);
  await tr.close();
  assert.equal(texts.length, 1, JSON.stringify(texts));
  // The question itself must come through. (The base model sometimes drops or mishears the very
  // last word of this synthetic voice; that is model accuracy, not something this code controls.)
  // Rare words like "Queueable" can come out misspelled ("cubeable"); Claude is told to read those as meant.
  assert.match(texts[0].toLowerCase(), /why did you use a \w+ for the price revision/);
  // The whole spoken question reaches Whisper, with padding either side (the detector trims ends).
  const speech16k = Math.round(wav.samples.length * 16000 / wav.sampleRate);
  assert.ok(decodedLengths[0] >= speech16k, `decoded ${decodedLengths[0]} samples < ${speech16k} of speech`);
  assert.deepEqual(speaking.slice(0, 2), [true, false]);
});

test('out of memory ("bad allocation") on a big model falls back to Whisper base when it is installed', async () => {
  const { createWithFallback, isOutOfMemory, modelPaths } = require('../src/local-stt');
  const fs = require('fs'), os = require('os'), path = require('path');
  assert.equal(isOutOfMemory(new Error('Load model from x failed:bad allocation')), true);
  assert.equal(isOutOfMemory(new Error('file not found')), false);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stt-'));
  const tried = [];
  const create = async ({ model }) => { tried.push(model); if (model !== 'base') throw new Error('bad allocation'); return { model }; };
  // base not installed: the original error is kept
  await assert.rejects(createWithFallback({ modelDir: dir, model: 'parakeet', language: 'en', create }), /bad allocation/);
  for (const [k, f] of Object.entries(modelPaths(dir, 'base'))) if (k !== 'dir') { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, 'x'); }
  const r = await createWithFallback({ modelDir: dir, model: 'parakeet', language: 'en', create });
  assert.deepEqual([r.model, r.fellBack], ['base', true]);
  // other errors are not hidden
  await assert.rejects(createWithFallback({ modelDir: dir, model: 'parakeet', create: async () => { throw new Error('file not found'); } }), /file not found/);
});
