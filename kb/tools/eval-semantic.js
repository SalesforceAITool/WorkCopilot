// Compare keyword, meaning-based and combined matching on held-out reworded questions.
// usage: MINILM_DIR=<folder with Xenova/all-MiniLM-L6-v2> node kb/tools/eval-semantic.js
const path = require('path');
const { pipeline, env } = require('@huggingface/transformers');
const { QABank } = require('../../src/qa-bank');
const entries = require(path.join(__dirname, '..', 'salesforce-qa.json'));
env.allowRemoteModels = false; env.localModelPath = process.env.MINILM_DIR;
const NOISE = [[/queueable/gi, 'cueable'], [/\bLWC\b/g, 'L W C'], [/lightning web component/gi, 'lightning web content'], [/\bSOQL\b/g, 'sock well'], [/\bApex\b/g, 'a pex'], [/Salesforce/g, 'sales force'], [/\bCPQ\b/g, 'C P Q'], [/OmniStudio/gi, 'omni studio'], [/[?.,!]/g, '']];
const noisy = (s) => NOISE.reduce((t, [re, to]) => t.replace(re, to), s).toLowerCase();
const OFF = ['how was your weekend', 'can you hear me now', 'let me share my screen', 'what time is it there', 'tell me about yourself', 'what are your salary expectations', 'are you comfortable with night shifts', 'shall we start the meeting', 'sorry you were on mute', 'do you have any questions for us', 'when can you join', 'is the internet working fine', 'we will get back to you', 'what is your notice period', 'who won the cricket match yesterday', 'please introduce yourself', 'okay thank you so much', 'can everyone see my screen'];
(async () => {
  const fe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'fp32' });
  const embed = async (texts) => { const out = []; for (let i = 0; i < texts.length; i += 128) out.push(...(await fe(texts.slice(i, i + 128), { pooling: 'mean', normalize: true })).tolist()); return out; };
  const t0 = Date.now();
  const texts = [], owner = [];
  entries.forEach((e, i) => { [e.q, ...e.alt.slice(0, -1)].forEach(t => { texts.push(t); owner.push(i); }); });
  const vecs = await embed(texts);
  // Optional: also match against each answer's opening (question + first two sentences).
  const ansVecs = process.env.WITH_ANSWERS ? await embed(entries.map(e => e.q + ' ' + e.a.split(/(?<=[.!?])\s+/).slice(0, 2).join(' '))) : null;
  const ANS_W = Number(process.env.ANS_W || 0.92);
  console.log(`embedded ${texts.length} bank sentences in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  const bm = new QABank(entries, { holdOut: (e) => e.alt.length - 1 });
  const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
  const semScores = (qv) => { const best = new Float32Array(entries.length).fill(-1); vecs.forEach((v, j) => { const c = dot(qv, v); if (c > best[owner[j]]) best[owner[j]] = c; });
    if (ansVecs) ansVecs.forEach((v, i) => { const c = dot(qv, v) * ANS_W; if (c > best[i]) best[i] = c; });
    return best; };
  async function run(label, queries) {
    const qv = await embed(queries.map(x => x.q));
    const res = { kw: [0, 0], sem: [0, 0], hyb: [0, 0] };
    const conf = [];
    queries.forEach((x, k) => {
      const sem = semScores(qv[k]);
      const kw = new Float32Array(entries.length);
      const kr = bm.search(x.q, { limit: 50 });
      const kmax = kr[0] ? kr[0].score : 1;
      for (const r of kr) kw[entries.indexOf(r.entry)] = r.score / kmax;
      const rank = (arr) => [...arr.keys()].sort((a, b) => arr[b] - arr[a]).slice(0, 3);
      const hyb = sem.map((s, i) => s + 0.12 * kw[i]);
      for (const [name, arr] of [['kw', kw], ['sem', sem], ['hyb', hyb]]) {
        const top = rank(arr);
        if (entries[top[0]].id === x.id) res[name][0]++;
        if (top.some(i => entries[i].id === x.id)) res[name][1]++;
      }
      const top = rank(hyb);
      conf.push({ right: entries[top[0]].id === x.id, sim: sem[top[0]] });
    });
    const n = queries.length;
    console.log(`${label} (${n}): keyword top-1 ${(100 * res.kw[0] / n).toFixed(1)}% · meaning ${(100 * res.sem[0] / n).toFixed(1)}% · combined ${(100 * res.hyb[0] / n).toFixed(1)}% (top-3 ${(100 * res.hyb[1] / n).toFixed(1)}%)`);
    for (const t of [0.45, 0.5, 0.55, 0.6, 0.65]) { const shown = conf.filter(c => c.sim >= t); console.log(`   similarity ≥ ${t}: shown ${(100 * shown.length / n).toFixed(0)}%, right when shown ${(100 * shown.filter(c => c.right).length / Math.max(1, shown.length)).toFixed(1)}%`); }
  }
  const qs = entries.map(e => ({ q: e.alt[e.alt.length - 1], id: e.id }));
  await run('Reworded', qs);
  await run('Reworded + speech errors', qs.map(x => ({ ...x, q: noisy(x.q) })));
  const ov = await embed(OFF);
  const offSims = ov.map(v => Math.max(...semScores(v)));
  console.log('off-topic best similarity:', offSims.map(s => s.toFixed(2)).join(' '));
  for (const t of [0.45, 0.5, 0.55, 0.6, 0.65]) console.log(`   off-topic shown at ≥ ${t}: ${offSims.filter(s => s >= t).length}/${OFF.length}`);
})();
