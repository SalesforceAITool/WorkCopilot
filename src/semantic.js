// Meaning-based matching for the Q&A bank: a small sentence model (all-MiniLM-L6-v2) running
// on this PC through transformers.js. It is downloaded once (~23 MB, quantized) from Hugging Face
// into the app's data folder; the bank's sentence vectors are cached on disk after the first build.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

class Embedder {
  // cacheDir: where the model is downloaded. localModelPath: use model files already on disk
  // (folder containing Xenova/all-MiniLM-L6-v2/…) and never download.
  constructor({ cacheDir, localModelPath, dtype } = {}) {
    this.cacheDir = cacheDir;
    this.localModelPath = localModelPath;
    // Quantized (~23 MB) by default; a local folder with only the full model uses that.
    this.dtype = dtype || (localModelPath && !fs.existsSync(path.join(localModelPath, MODEL_ID, 'onnx', 'model_quantized.onnx')) ? 'fp32' : 'q8');
    this.pipe = null;
  }

  get key() { return `${MODEL_ID}:${this.dtype}`; }

  async load() {
    if (this.pipe) return this.pipe;
    if (!this.loading) {
      this.loading = (async () => {
        const { pipeline, env } = require('@huggingface/transformers');
        if (this.localModelPath) { env.allowRemoteModels = false; env.localModelPath = this.localModelPath; }
        if (this.cacheDir) env.cacheDir = this.cacheDir;
        this.pipe = await pipeline('feature-extraction', MODEL_ID, { dtype: this.dtype });
        return this.pipe;
      })().catch((err) => { this.loading = null; throw err; });
    }
    return this.loading;
  }

  async embed(texts, onProgress) {
    const pipe = await this.load();
    const out = [];
    for (let i = 0; i < texts.length; i += 64) {
      const t = await pipe(texts.slice(i, i + 64), { pooling: 'mean', normalize: true });
      const dim = t.dims[1];
      for (let r = 0; r < t.dims[0]; r++) out.push(t.data.slice(r * dim, (r + 1) * dim));
      if (onProgress) onProgress(Math.min(texts.length, i + 64), texts.length);
    }
    return out;
  }
}

// Vectors for every entry's question and other phrasings; best similarity per entry.
class SemanticIndex {
  constructor(vectors, owner, count) {
    this.vectors = vectors;
    this.owner = owner;
    this.count = count;
  }

  // Per entry: the question, its other phrasings, and the question with the start of its answer
  // (catches questions about a detail the answer covers, e.g. "are Apex classes final by default?").
  static texts(entries, holdOut) {
    const texts = [], owner = [];
    entries.forEach((e, i) => {
      const skip = holdOut ? holdOut(e) : -1;
      const opening = String(e.a || '').split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
      [e.q, ...(e.alt || []).filter((_, k) => k !== skip), `${e.q} ${opening}`].forEach(t => { texts.push(t); owner.push(i); });
    });
    return { texts, owner };
  }

  // Vectors are cached per sentence (keyed by model + text), so adding a project Q&A file or
  // editing a few answers only embeds the new sentences.
  static async build(embedder, entries, { cacheFile, holdOut, onProgress } = {}) {
    const { texts, owner } = SemanticIndex.texts(entries, holdOut);
    const keyOf = (t) => crypto.createHash('sha1').update(embedder.key + '\n' + t).digest('hex').slice(0, 20);
    const cache = cacheFile ? readCache(cacheFile) : new Map();
    const keys = texts.map(keyOf);
    const missing = [...new Set(keys.filter(k => !cache.has(k)))];
    if (missing.length) {
      const textByKey = new Map(keys.map((k, i) => [k, texts[i]]));
      const vecs = await embedder.embed(missing.map(k => textByKey.get(k)), onProgress);
      missing.forEach((k, i) => cache.set(k, vecs[i]));
      if (cacheFile) { try { writeCache(cacheFile, cache, new Set(keys)); } catch { /* cache is only a speed-up */ } }
    } else if (onProgress) onProgress(texts.length, texts.length);
    return new SemanticIndex(keys.map(k => cache.get(k)), owner, entries.length);
  }

  scores(queryVector) {
    const best = new Float32Array(this.count).fill(-1);
    for (let j = 0; j < this.vectors.length; j++) {
      const v = this.vectors[j];
      let s = 0;
      for (let k = 0; k < v.length; k++) s += v[k] * queryVector[k];
      const i = this.owner[j];
      if (s > best[i]) best[i] = s;
    }
    return best;
  }
}

// File: [u32 header length][JSON {dim, keys}][float32 vectors in key order]
function readCache(file) {
  const map = new Map();
  try {
    const buf = fs.readFileSync(file);
    const hl = buf.readUInt32LE(0);
    const { dim, keys } = JSON.parse(buf.subarray(4, 4 + hl).toString());
    if (!dim || !Array.isArray(keys) || buf.length < 4 + hl + keys.length * dim * 4) return map; // cut short: rebuild
    const body = new Float32Array(buf.buffer.slice(buf.byteOffset + 4 + hl, buf.byteOffset + 4 + hl + keys.length * dim * 4));
    keys.forEach((k, i) => map.set(k, body.subarray(i * dim, (i + 1) * dim)));
  } catch { /* none yet */ }
  return map;
}

function writeCache(file, cache, keep) {
  const keys = [...cache.keys()].filter(k => keep.has(k)); // drop sentences no longer in the bank
  if (!keys.length) return;
  const dim = cache.get(keys[0]).length;
  const head = Buffer.from(JSON.stringify({ dim, keys }));
  const len = Buffer.alloc(4); len.writeUInt32LE(head.length, 0);
  const body = Buffer.alloc(keys.length * dim * 4);
  keys.forEach((k, i) => { const v = cache.get(k); Buffer.from(v.buffer, v.byteOffset, dim * 4).copy(body, i * dim * 4); });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, Buffer.concat([len, head, body]));
  fs.renameSync(tmp, file);
}

module.exports = { Embedder, SemanticIndex, MODEL_ID };
