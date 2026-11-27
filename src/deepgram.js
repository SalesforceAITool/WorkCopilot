// Deepgram live transcription settings: the listen URL with vocabulary hints ("keyterm prompting",
// Nova-3), and a key check. Keyterms make Deepgram expect Salesforce and project words, which
// generic speech recognition mishears ("cueable" for Queueable, "FAP" for SAP).

const path = require('path');
const { tokenize } = require('./context');

const LISTEN_URL = 'wss://api.deepgram.com/v1/listen';
const MAX_TERMS = 60;
const MAX_TERM_TOKENS = 450; // Deepgram allows 500 tokens of keyterms per request

const SALESFORCE_TERMS = [
  'Salesforce', 'Apex', 'Apex trigger', 'Lightning Web Component', 'LWC', 'Aura', 'Visualforce',
  'SOQL', 'SOSL', 'DML', 'governor limits', 'Queueable', 'Batch Apex', 'future method', 'Schedulable',
  'platform event', 'Change Data Capture', 'record-triggered flow', 'screen flow', 'Flow Builder',
  'OmniStudio', 'FlexCard', 'OmniScript', 'DataRaptor', 'Integration Procedure', 'Field Service',
  'FSL', 'work order', 'service appointment', 'Sales Cloud', 'Service Cloud', 'Experience Cloud',
  'Agentforce', 'sandbox', 'Copado', 'test class', 'code coverage', 'named credential', 'REST API',
  'SOAP', 'custom metadata', 'permission set', 'sharing rules', 'validation rule', 'trigger handler'
];

// Words that are already easy for speech recognition, or too generic to be worth a hint.
const COMMON = new Set((
  'test tests handler controller service services util utils helper helpers batch trigger triggers class ' +
  'record records data list update create delete insert get set main default force app page component ' +
  'components flow flows object objects field fields label labels custom value values type types file files ' +
  'upload uploader schedule scheduler queue queueable mock mocks base wrapper request response callout api ' +
  'error errors log logs time date user users account accounts contact contacts case cases order orders ' +
  'work price revision invoice invoices config settings setting index utility number name status result'
).split(/\s+/));

// Distinctive words from the project's file names (custom objects, client and feature names).
function projectTerms(files, limit = 15) {
  const counts = new Map();
  for (const f of files) {
    const base = path.basename(f.rel).replace(/(-meta)?\.[a-z.-]+$/i, '').replace(/__c$/, '');
    for (const w of tokenize(base)) {
      if (w.length < 4 || COMMON.has(w) || /^\d+$/.test(w)) continue;
      counts.set(w, (counts.get(w) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([w]) => w);
}

// User terms first (most specific), then project words, then the Salesforce list; de-duplicated
// and kept inside Deepgram's size limit.
function keyterms({ meetingTerms = '', files = [] } = {}) {
  const user = String(meetingTerms).split(/[,;\n]/).map(t => t.trim()).filter(Boolean).slice(0, 25);
  const all = [...user, ...projectTerms(files), ...SALESFORCE_TERMS];
  const seen = new Set();
  const out = [];
  let tokens = 0;
  for (const term of all) {
    const key = term.toLowerCase();
    if (seen.has(key) || term.length > 60) continue;
    const cost = Math.ceil(term.length / 4) + 1;
    if (out.length >= MAX_TERMS || tokens + cost > MAX_TERM_TOKENS) break;
    seen.add(key);
    out.push(term);
    tokens += cost;
  }
  return out;
}

// English only. Monolingual English is more accurate than Deepgram's multilingual mode.
const LANGUAGES = { 'en-IN': 'en-IN', en: 'en' };

function listenUrl({ language = 'en-IN', terms = [], base = LISTEN_URL } = {}) {
  const params = new URLSearchParams({
    model: 'nova-3',
    language: LANGUAGES[language] || 'en-IN',
    smart_format: 'true',
    punctuate: 'true',
    interim_results: 'true',
    endpointing: '400',
    utterance_end_ms: '1200'
  });
  for (const t of terms) params.append('keyterm', t);
  return `${base}?${params}`;
}

// true = key accepted, false = rejected; throws only when Deepgram can't be reached.
async function checkKey(fetchImpl, key, base = 'https://api.deepgram.com') {
  const res = await fetchImpl(`${base}/v1/projects`, { headers: { Authorization: `Token ${key}` } });
  if (res.status === 401 || res.status === 403) return false;
  if (!res.ok) throw new Error(`Deepgram answered ${res.status}`);
  return true;
}

module.exports = { SALESFORCE_TERMS, projectTerms, keyterms, listenUrl, checkKey, LISTEN_URL };
