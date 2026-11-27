// Free, offline speech-to-text on this PC (sherpa-onnx): NVIDIA Parakeet or OpenAI Whisper models,
// plus Silero voice-activity detection. Audio never leaves the machine. Models download once from GitHub.

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const RELEASES = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/';

// Accuracy measured on noisy call-quality recordings of Salesforce interview questions in four
// accents (word error rate, lower is better): parakeet 30%, turbo 27%, base 62% (70% on auto-language).
const MODELS = {
  parakeet: {
    label: 'Parakeet v2 — accurate and fast, English (≈460 MB download) · recommended',
    kind: 'transducer',
    archive: 'sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8.tar.bz2',
    folder: 'sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8',
    files: { encoder: 'encoder.int8.onnx', decoder: 'decoder.int8.onnx', joiner: 'joiner.int8.onnx', tokens: 'tokens.txt' }
  },
  turbo: {
    label: 'Whisper turbo — most accurate, slower, needs a faster PC (≈540 MB download)',
    kind: 'whisper', featureDim: 128,
    archive: 'sherpa-onnx-whisper-turbo.tar.bz2',
    folder: 'sherpa-onnx-whisper-turbo',
    files: { encoder: 'turbo-encoder.int8.onnx', decoder: 'turbo-decoder.int8.onnx', tokens: 'turbo-tokens.txt' }
  },
  base: {
    label: 'Whisper base — small download, much less accurate (≈200 MB download)',
    kind: 'whisper', featureDim: 80,
    archive: 'sherpa-onnx-whisper-base.tar.bz2',
    folder: 'sherpa-onnx-whisper-base',
    files: { encoder: 'base-encoder.int8.onnx', decoder: 'base-decoder.int8.onnx', tokens: 'base-tokens.txt' }
  }
};
const DEFAULT_MODEL = 'parakeet';
const VAD_FILE = 'silero_vad.onnx';
const SAMPLE_RATE = 16000;
const VAD_WINDOW = 512;
const PAD_BEFORE = Math.round(0.25 * SAMPLE_RATE); // the detector trims soft starts and endings
const PAD_AFTER = Math.round(0.5 * SAMPLE_RATE);
const HISTORY = 30 * SAMPLE_RATE;                  // audio kept to rebuild padded sentences

function modelPaths(modelDir, model) {
  const m = MODELS[model];
  const dir = path.join(modelDir, m.folder);
  const out = { dir, vad: path.join(modelDir, VAD_FILE) };
  for (const [k, f] of Object.entries(m.files)) out[k] = path.join(dir, f);
  return out;
}

function isInstalled(modelDir, model) {
  if (!MODELS[model]) return false;
  const p = modelPaths(modelDir, model);
  return [...Object.keys(MODELS[model].files).map(k => p[k]), p.vad].every(f => {
    try { return fs.statSync(f).size > 0; } catch { return false; }
  });
}

// Streams a URL to a file, reporting {received, total} as it goes.
async function download(fetchImpl, url, dest, onProgress) {
  const res = await fetchImpl(url);
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status}) for ${path.basename(url)}`);
  const total = Number(res.headers.get('content-length')) || 0;
  const tmp = dest + '.part';
  const out = fs.createWriteStream(tmp);
  let received = 0;
  const reader = res.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
      if (!out.write(Buffer.from(value))) await new Promise(r => out.once('drain', r));
      onProgress && onProgress({ received, total });
    }
  } finally {
    await new Promise((resolve, reject) => out.end(err => (err ? reject(err) : resolve())));
  }
  if (total && received !== total) { fs.rmSync(tmp, { force: true }); throw new Error('Download was cut off. Try again.'); }
  fs.renameSync(tmp, dest);
}

// Windows 10/11, macOS and Linux all ship a tar that reads .tar.bz2 and does it in seconds.
// Pure-JS unpacking is the fallback (much slower: ~80 s for the base model).
function extractWithSystemTar(archive, destDir, members) {
  return new Promise((resolve, reject) => {
    execFile('tar', ['-xjf', archive, '-C', destDir, ...members], { windowsHide: true }, (err) => (err ? reject(err) : resolve()));
  });
}

function extractWithJs(archive, destDir, members) {
  const bz2 = require('unbzip2-stream');
  const tar = require('tar-stream');
  const wanted = new Set(members);
  return new Promise((resolve, reject) => {
    const ex = tar.extract();
    ex.on('entry', (header, stream, next) => {
      if (!wanted.has(header.name)) { stream.resume(); stream.on('end', next); return; }
      const target = path.join(destDir, header.name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const out = fs.createWriteStream(target);
      stream.pipe(out);
      out.on('finish', next);
      out.on('error', reject);
    });
    ex.on('finish', resolve);
    ex.on('error', reject);
    const src = fs.createReadStream(archive);
    src.on('error', reject);
    src.pipe(bz2()).on('error', reject).pipe(ex);
  });
}

async function install(modelDir, model, { onProgress, fetchImpl = fetch, baseUrl = RELEASES, extractors } = {}) {
  const m = MODELS[model];
  if (!m) throw new Error(`Unknown model "${model}"`);
  fs.mkdirSync(modelDir, { recursive: true });
  const report = (stage, extra = {}) => onProgress && onProgress({ stage, ...extra });

  const p = modelPaths(modelDir, model);
  if (!fs.existsSync(p.vad)) {
    report('download', { file: VAD_FILE, received: 0, total: 0 });
    await download(fetchImpl, baseUrl + VAD_FILE, p.vad, (x) => report('download', { file: VAD_FILE, ...x }));
  }
  if (!isInstalled(modelDir, model)) {
    const archive = path.join(modelDir, m.archive);
    if (!fs.existsSync(archive)) {
      await download(fetchImpl, baseUrl + m.archive, archive, (x) => report('download', { file: m.archive, ...x }));
    }
    report('unpack');
    const members = Object.values(m.files).map(f => `${m.folder}/${f}`);
    const order = extractors || [extractWithSystemTar, extractWithJs];
    let lastErr;
    for (const extract of order) {
      try { await extract(archive, modelDir, members); lastErr = null; break; } catch (e) { lastErr = e; }
    }
    if (lastErr || !isInstalled(modelDir, model)) {
      throw new Error('Could not unpack the speech model' + (lastErr ? `: ${lastErr.message}` : '.'));
    }
    fs.rmSync(archive, { force: true }); // keep only the ~160 MB we use
  }
  report('ready');
}

// Meetings are always in English. (Letting Whisper auto-detect made Indian-accented English come out as Hindi.)
function whisperLanguage() {
  return 'en';
}

function defaultThreads() {
  const cores = require('os').cpus().length || 2;
  return Math.max(2, Math.min(4, cores - 1));
}

function recognizerConfig(modelDir, model, language, threads) {
  const m = MODELS[model];
  if (!m) throw new Error(`Unknown speech model "${model}"`);
  const p = modelPaths(modelDir, model);
  const common = { tokens: p.tokens, numThreads: threads, provider: 'cpu', debug: 0 };
  if (m.kind === 'transducer') {
    return {
      featConfig: { sampleRate: SAMPLE_RATE, featureDim: 80 },
      modelConfig: { transducer: { encoder: p.encoder, decoder: p.decoder, joiner: p.joiner }, modelType: 'nemo_transducer', ...common }
    };
  }
  return {
    featConfig: { sampleRate: SAMPLE_RATE, featureDim: m.featureDim || 80 },
    modelConfig: { whisper: { encoder: p.encoder, decoder: p.decoder, language: whisperLanguage(language), task: 'transcribe', tailPaddings: -1 }, ...common }
  };
}

// One listening session: audio in (any sample rate), finished sentences out.
class LocalTranscriber {
  static async create({ modelDir, model = DEFAULT_MODEL, language = 'en-IN', threads = defaultThreads() }) {
    const sherpa = require('sherpa-onnx-node');
    const recognizer = await sherpa.OfflineRecognizer.createAsync(recognizerConfig(modelDir, model, language, threads));
    const p = modelPaths(modelDir, model);
    const vad = new sherpa.Vad({
      // A 1 s pause ends a sentence: interviewers pause mid-question, and the whole question
      // decoded together is far more accurate than its fragments.
      sileroVad: { model: p.vad, threshold: 0.5, minSilenceDuration: 1.0, minSpeechDuration: 0.25, windowSize: VAD_WINDOW, maxSpeechDuration: 20 },
      sampleRate: SAMPLE_RATE, debug: false, numThreads: 1
    }, 60);
    return new LocalTranscriber(sherpa, recognizer, vad);
  }

  constructor(sherpa, recognizer, vad) {
    this.sherpa = sherpa;
    this.recognizer = recognizer;
    this.vad = vad;
    this.buffer = new Float32Array(0);
    this.history = new sherpa.CircularBuffer(HISTORY + 10 * SAMPLE_RATE);
    this.queue = Promise.resolve();
    this.resamplers = new Map();
    this.onText = null;      // (text) => void   — a finished sentence
    this.onSpeaking = null;  // (bool) => void   — someone is talking right now
    this.onError = null;
    this.speaking = false;
    this.closed = false;
  }

  accept(samples, sampleRate) {
    if (this.closed || !samples || !samples.length) return;
    let pcm = samples instanceof Float32Array ? samples : Float32Array.from(samples);
    if (sampleRate && sampleRate !== SAMPLE_RATE) {
      if (!this.resamplers.has(sampleRate)) this.resamplers.set(sampleRate, new this.sherpa.LinearResampler(sampleRate, SAMPLE_RATE));
      pcm = this.resamplers.get(sampleRate).resample(pcm);
    }
    this.history.push(pcm);
    if (this.history.size() > HISTORY) this.history.pop(this.history.size() - HISTORY);
    const merged = new Float32Array(this.buffer.length + pcm.length);
    merged.set(this.buffer);
    merged.set(pcm, this.buffer.length);
    let i = 0;
    for (; i + VAD_WINDOW <= merged.length; i += VAD_WINDOW) this.vad.acceptWaveform(merged.subarray(i, i + VAD_WINDOW));
    this.buffer = merged.slice(i);

    const speaking = this.vad.isDetected();
    if (speaking !== this.speaking) { this.speaking = speaking; this.onSpeaking && this.onSpeaking(speaking); }
    this.drain();
  }

  drain() {
    while (!this.vad.isEmpty()) {
      const seg = this.vad.front(false);
      const samples = this.padded(seg.start, seg.samples);
      this.vad.pop();
      // One sentence at a time, in order, off the main thread.
      this.queue = this.queue.then(() => this.decode(samples)).catch(err => this.onError && this.onError(err));
    }
  }

  // The detected sentence plus a little audio either side, taken from the history.
  padded(start, segSamples) {
    const head = this.history.head();
    const end = head + this.history.size();
    const from = Math.max(head, start - PAD_BEFORE);
    const to = Math.min(end, start + segSamples.length + PAD_AFTER);
    if (start < head || to <= from) return Float32Array.from(segSamples); // too old: use as detected
    return Float32Array.from(this.history.get(from, to - from, false));
  }

  async decode(samples) {
    if (this.closed) return;
    const stream = this.recognizer.createStream();
    stream.acceptWaveform({ sampleRate: SAMPLE_RATE, samples });
    await this.recognizer.decodeAsync(stream);
    const text = cleanText(this.recognizer.getResult(stream).text);
    if (text && !this.closed && this.onText) this.onText(text);
  }

  // Stop: finish whatever was being said, then release.
  async close() {
    if (this.closed) return;
    try { this.vad.flush(); this.drain(); } catch {}
    await this.queue.catch(() => {});
    this.closed = true;
  }
}

// Whisper sometimes "hears" these in silence or music; they are never real questions.
const HALLUCINATIONS = /^(\[.*\]|\(.*\)|thank you\.?|thanks for watching!?|you|\.+|♪+.*)$/i;
function cleanText(text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return HALLUCINATIONS.test(t) ? '' : t;
}

// Not enough free memory to load a model ("bad allocation" from onnxruntime on Windows).
function isOutOfMemory(err) {
  return /bad[ _]?alloc|out of memory|allocat(e|ion) fail|cannot allocate|ENOMEM/i.test(String(err && (err.message || err)));
}

// Open the chosen model; if this PC hasn't enough free memory for it, fall back to a smaller
// model that is already downloaded (Parakeet/turbo → base). Returns { transcriber, model, fellBack }.
async function createWithFallback({ modelDir, model, language, create = (o) => LocalTranscriber.create(o) }) {
  try {
    return { transcriber: await create({ modelDir, model, language }), model, fellBack: false };
  } catch (err) {
    if (!isOutOfMemory(err) || model === 'base' || !isInstalled(modelDir, 'base')) throw err;
    return { transcriber: await create({ modelDir, model: 'base', language }), model: 'base', fellBack: true };
  }
}

module.exports = { isOutOfMemory, createWithFallback, MODELS, DEFAULT_MODEL, SAMPLE_RATE, modelPaths, isInstalled, install, LocalTranscriber, cleanText,
  extractWithSystemTar, extractWithJs, whisperLanguage, recognizerConfig };
