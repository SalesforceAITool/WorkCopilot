// Instant answers from the Salesforce Q&A bank (kb/salesforce-qa.json) and project Q&A files
// (project-kb/*.json). BM25 search over each question, its other phrasings and tags, with
// Salesforce abbreviations unified and common speech-recognition mishearings repaired.

const fs = require('fs');
const path = require('path');
const { tokenize } = require('./context');

// Phrases folded into one token on both sides, so "lightning web component" matches "LWC".
const CANONICAL = [
  [/\blightning web components?\b|\bl\.?\s?w\.?\s?c\.?s?\b|\blightning web content\b/gi, ' lwc '],
  [/\bfield service( lightning)?\b|\bf\.?\s?s\.?\s?l\b/gi, ' fsl '],
  [/\bdata ?360\b|\bdata cloud\b/gi, ' data360 '],
  [/\bexperience cloud\b|\bcommunity cloud\b|\bcommunities\b/gi, ' experiencecloud '],
  [/\beinstein copilot\b|\bagent ?force\b/gi, ' agentforce '],
  [/\bomni ?studio\b/gi, ' omnistudio '],
  [/\bomni ?scripts?\b/gi, ' omniscript '],
  [/\bflex ?cards?\b/gi, ' flexcard '],
  [/\bdata ?raptors?\b|\bdata ?mappers?\b/gi, ' datamapper '],
  [/\bintegration procedures?\b/gi, ' integrationprocedure '],
  [/\bprocess builder\b/gi, ' processbuilder '],
  [/\bworkflow rules?\b/gi, ' workflowrule '],
  [/\bgovernor limits?\b/gi, ' governorlimit '],
  [/\border of execution\b/gi, ' orderofexecution '],
  [/\brecord[- ]triggered flows?\b/gi, ' recordtriggeredflow '],
  [/\bscreen flows?\b/gi, ' screenflow '],
  [/\bbatch apex\b|\bbatch class(es)?\b|\bbatch jobs?\b/gi, ' batchapex '],
  [/\bfuture methods?\b|@future\b/gi, ' futuremethod '],
  [/\bplatform events?\b/gi, ' platformevent '],
  [/\bchange data capture\b|\bc\.?d\.?c\b/gi, ' cdc '],
  [/\bnamed credentials?\b/gi, ' namedcredential '],
  [/\bexternal credentials?\b/gi, ' externalcredential '],
  [/\bconnected apps?\b/gi, ' connectedapp '],
  [/\bexternal client apps?\b/gi, ' externalclientapp '],
  [/\bpermission set groups?\b/gi, ' permissionsetgroup '],
  [/\bpermission sets?\b/gi, ' permissionset '],
  [/\brole hierarchy\b/gi, ' rolehierarchy '],
  [/\borg[- ]wide defaults?\b|\bo\.?w\.?d\b/gi, ' owd '],
  [/\bsharing rules?\b/gi, ' sharingrule '],
  [/\bvalidation rules?\b/gi, ' validationrule '],
  [/\bmaster[- ]detail\b/gi, ' masterdetail '],
  [/\broll[- ]?up summary\b/gi, ' rollupsummary '],
  [/\bprice ?books?\b/gi, ' pricebook '],
  [/\bprice rules?\b/gi, ' pricerule '],
  [/\bproduct rules?\b/gi, ' productrule '],
  [/\bquote calculator plugin\b|\bq\.?c\.?p\b/gi, ' qcp '],
  [/\bc\.?p\.?q\b/gi, ' cpq '],
  [/\brevenue cloud( advanced)?\b|\brevenue lifecycle management\b/gi, ' revenuecloud '],
  [/\bhealth cloud\b/gi, ' healthcloud '],
  [/\bsales cloud\b/gi, ' salescloud '],
  [/\bservice cloud\b/gi, ' servicecloud '],
  [/\bomni[- ]?channel\b/gi, ' omnichannel '],
  [/\bwork orders?\b/gi, ' workorder '],
  [/\bservice appointments?\b/gi, ' serviceappointment '],
  [/\btest class(es)?\b/gi, ' testclass '],
  [/\bcode coverage\b/gi, ' codecoverage '],
  [/\bmixed dml\b/gi, ' mixeddml '],
  [/\bs\.?o\.?q\.?l\b|\bsoccer l\b/gi, ' soql '],
  [/\bs\.?o\.?s\.?l\b/gi, ' sosl '],
  [/\bd\.?m\.?l\b/gi, ' dml '],
  [/\bsales ?force\b/gi, ' salesforce ']
];

// Words speech recognition often gets wrong in Salesforce talk.
const MISHEARD = [
  [/\b(cueable|cubeable|queable|queuable|q-able|cue able|queue able|cuable|kuable)\b/gi, 'queueable'],
  [/\b(a pex|apecs|apec|apax)\b/gi, 'apex'],
  [/\b(schedule able|schedulable|scheduleable)\b/gi, 'schedulable'],
  [/\b(visual force)\b/gi, 'visualforce'],
  [/\b(trigger handlers)\b/gi, 'trigger handler'],
  [/\b(salesforce\s?dx|sfdx)\b/gi, 'sfdx'],
  [/\b(bulkify|bulkification|bulkifying|bulk ify)\b/gi, 'bulkification']
];

const FIELD_WEIGHT = { q: 3, alt: 2, tags: 2, topic: 1 };
const KEYWORD_BOOST = 0.12;
// Show a bank answer at or above this confidence. Meaning-based: off-topic chatter peaked at 0.47
// in testing. Keyword-only matching (before the sentence model is ready) is only used for typed searches.
const SHOW_AT = { semantic: 0.5, keyword: Infinity }; // keyword-only matched 'tell me about yourself': never show instantly

function normalize(text) {
  let t = ' ' + String(text || '') + ' ';
  for (const [re, to] of MISHEARD) t = t.replace(re, to);
  for (const [re, to] of CANONICAL) t = t.replace(re, to);
  return t;
}

function terms(text) {
  return tokenize(normalize(text));
}

function levenshtein(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

class QABank {
  // entries: Q&A objects; each may carry `source` ('bank' | 'project:<name>').
  // holdOut(entry) -> index of an `alt` to leave out of the index (used by the accuracy check).
  constructor(entries = [], { holdOut } = {}) {
    this.entries = entries;
    this.docs = entries.map((e) => {
      const tf = new Map();
      const add = (text, w) => { for (const t of terms(text)) tf.set(t, (tf.get(t) || 0) + w); };
      add(e.q, FIELD_WEIGHT.q);
      const skip = holdOut ? holdOut(e) : -1;
      (e.alt || []).forEach((a, i) => { if (i !== skip) add(a, FIELD_WEIGHT.alt); });
      add((e.tags || []).join(' '), FIELD_WEIGHT.tags);
      add(e.topic, FIELD_WEIGHT.topic);
      let len = 0;
      for (const v of tf.values()) len += v;
      return { tf, len };
    });
    this.df = new Map();
    for (const d of this.docs) for (const t of d.tf.keys()) this.df.set(t, (this.df.get(t) || 0) + 1);
    this.avgLen = this.docs.reduce((s, d) => s + d.len, 0) / Math.max(1, this.docs.length);
    this.vocab = [...this.df.keys()];
  }

  get size() { return this.entries.length; }

  // Meaning-based matching (SemanticIndex built for these same entries).
  attachSemantic(index) { this.semantic = index && index.count === this.entries.length ? index : null; }

  idf(t) {
    const n = this.df.get(t) || 0;
    const N = this.docs.length || 1;
    return Math.log(1 + (N - n + 0.5) / (n + 0.5));
  }

  // Unknown words (often mis-heard) are mapped to the closest known word.
  repair(tokens) {
    return tokens.map((t) => {
      if (this.df.has(t) || t.length < 5) return t;
      const max = Math.floor(t.length * 0.3);
      let best = null, bestD = max + 1, bestDf = 0;
      for (const v of this.vocab) {
        if (Math.abs(v.length - t.length) > max) continue;
        const d = levenshtein(t, v, max);
        const df = this.df.get(v);
        if (d < bestD || (d === bestD && df > bestDf)) { best = v; bestD = d; bestDf = df; }
      }
      return best || t;
    });
  }

  // Returns [{ entry, score, confidence }] best first.
  // With a query vector and a semantic index: rank by meaning similarity plus a small keyword
  // boost; confidence = meaning similarity (off-topic chatter stays below ~0.48).
  // Without: keyword-only ranking; confidence blends coverage of the question with the margin.
  search(question, { limit = 3, queryVector } = {}) {
    if (queryVector && this.semantic) return this.searchHybrid(question, queryVector, limit);
    return this.searchKeywords(question, { limit });
  }

  searchHybrid(question, queryVector, limit) {
    const sem = this.semantic.scores(queryVector);
    const kw = new Float32Array(this.entries.length);
    const kr = this.searchKeywords(question, { limit: 50 });
    const kmax = kr[0] ? kr[0].score : 1;
    for (const r of kr) kw[r.index] = r.score / kmax;
    const order = [...sem.keys()].sort((a, b) => (sem[b] + KEYWORD_BOOST * kw[b]) - (sem[a] + KEYWORD_BOOST * kw[a]));
    return order.slice(0, limit).map(i => ({ entry: this.entries[i], index: i, score: sem[i] + KEYWORD_BOOST * kw[i], confidence: Math.max(0, sem[i]) }));
  }

  searchKeywords(question, { limit = 3 } = {}) {
    const q = [...new Set(this.repair(terms(question)))];
    if (!q.length || !this.docs.length) return [];
    const qWeight = q.reduce((s, t) => s + (this.df.has(t) ? this.idf(t) : 0), 0);
    if (!qWeight) return [];
    const k1 = 1.2, b = 0.6;
    const scored = [];
    this.docs.forEach((d, i) => {
      let s = 0, covered = 0;
      for (const t of q) {
        const f = d.tf.get(t);
        if (!f) continue;
        const idf = this.idf(t);
        covered += idf;
        s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / this.avgLen));
      }
      if (s > 0) scored.push({ i, s, coverage: covered / qWeight });
    });
    scored.sort((x, y) => y.s - x.s);
    const top = scored.slice(0, limit);
    const second = scored[1] ? scored[1].s : 0;
    return top.map((r, rank) => {
      const margin = rank === 0 ? Math.min(1, (r.s - second) / (r.s || 1) * 2.5) : 0;
      const confidence = Math.max(0, Math.min(1, r.coverage * 0.8 + margin * 0.2));
      return { entry: this.entries[r.i], index: r.i, score: r.s, confidence };
    });
  }
}

// Bank + project Q&A files. Project entries are tagged with their file name.
function loadBanks({ bankFile, projectDir } = {}) {
  const entries = [];
  const sources = [];
  const usable = (e) => e && typeof e.q === 'string' && typeof e.a === 'string' && e.q.trim() && e.a.trim();
  let error = null;
  if (bankFile && fs.existsSync(bankFile)) {
    try {
      for (const e of JSON.parse(fs.readFileSync(bankFile, 'utf8')).filter(usable)) entries.push({ ...e, source: 'bank' });
      sources.push({ name: 'Salesforce Q&A bank', count: entries.length });
    } catch (err) { error = `Q&A bank file is damaged (${err.message})`; }
  }
  const seen = new Set();
  for (const dir of [].concat(projectDir || [])) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
      if (seen.has(f)) continue; // same file name in two folders: the first folder wins
      seen.add(f);
      const projectDir = dir;
      try {
        const list = JSON.parse(fs.readFileSync(path.join(projectDir, f), 'utf8')).filter(usable);
        const name = path.basename(f, '.json');
        for (const e of list) entries.push({ ...e, source: `project:${name}` });
        sources.push({ name: `Project: ${name}`, count: list.length });
      } catch { /* a broken project file is skipped, not fatal */ }
    }
  }
  return { bank: new QABank(entries), sources, error };
}

module.exports = { QABank, loadBanks, normalize, terms, levenshtein, SHOW_AT };
