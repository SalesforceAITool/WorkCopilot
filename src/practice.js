// Practice interviews: pick the interview you are preparing for (CPQ, Health Cloud, Agentforce…),
// get the questions an interviewer would really ask at your experience level (scenario-based first),
// say or type your answer, then read the model answer and, if you like, get feedback on yours.
// Questions come from the fact-checked booklet (instant) and/or fresh from Claude.

const fs = require('fs');
const path = require('path');

// Practice areas → booklet entries. Lead-role questions follow their topic.
const AREAS = {
  basics:       { label: 'Salesforce basics', hint: 'Apex, triggers, async, SOQL, LWC, Flow, security', ids: /^(apex|trg|async|soql|lwc|flow|sec|adm)-/ },
  integration:  { label: 'Integration', ids: /^int-/ },
  sales:        { label: 'Sales Cloud', ids: /^(sales|salesx)-/ },
  service:      { label: 'Service Cloud', hint: 'incl. Field Service, Omni-Channel, Voice', ids: /^(svc|svcx|fsl)-/ },
  experience:   { label: 'Experience Cloud', ids: /^(exp|expx)-/ },
  health:       { label: 'Health Cloud', ids: /^(hc|hcx)-/ },
  cpq:          { label: 'CPQ / Revenue Cloud', ids: /^(cpq|cpqx|rev)-/, topics: /CPQ Leadership/ },
  agentforce:   { label: 'Agentforce', hint: 'incl. Data 360', ids: /^(agent|d360)-/, topics: /Agentforce Leadership/ },
  omnistudio:   { label: 'OmniStudio', ids: /^omni-/ },
  architecture: { label: 'Lead & architecture', hint: 'design, DevOps, leading a team, behavioural', ids: /^(arch|dev)-/, topics: /Technical Leadership|Behavioural \(Lead\)/ },
  project:      { label: 'My project', hint: 'Amkor QTC and your project documents', project: true },
  resume:       { label: 'My resume', hint: 'tell me about yourself, your experience', resume: true }
};

const EXPERIENCE = {
  fresher: { label: 'Fresher (0–2 yrs)', weights: { fresher: 4, mid: 1, senior: 0.2 } },
  mid:     { label: '3–4 years',         weights: { fresher: 1.5, mid: 4, senior: 1 } },
  five:    { label: '5–7 years',         weights: { fresher: 0.7, mid: 3, senior: 3.5 } },
  lead:    { label: '8+ years / Lead',   weights: { fresher: 0.3, mid: 2, senior: 5 } }
};
const SCENARIO_TYPES = /^(scenario|troubleshooting|design)$/;

function areaOf(e) {
  const src = e.source || '';
  if (src === 'project:resume') return 'resume';
  if (src.startsWith('project:')) return 'project';
  for (const [key, a] of Object.entries(AREAS)) {
    if (a.topics && a.topics.test(e.topic || '')) return key;
  }
  for (const [key, a] of Object.entries(AREAS)) {
    if (a.ids && a.ids.test(e.id || '')) return key;
  }
  return null;
}

// Weighted pick without replacement; `rand` is injectable for tests.
function weightedPick(items, weightOf, n, rand = Math.random) {
  const pool = items.map(x => ({ x, w: Math.max(0, weightOf(x)) })).filter(p => p.w > 0);
  const out = [];
  while (out.length < n && pool.length) {
    const total = pool.reduce((s, p) => s + p.w, 0);
    let r = rand() * total, i = 0;
    while (i < pool.length - 1 && (r -= pool[i].w) > 0) i++;
    out.push(pool.splice(i, 1)[0].x);
  }
  return out;
}

// The session's booklet questions. Most come from the chosen areas; a few Salesforce basics and
// (if asked) questions about your own project/resume are mixed in, as in a real interview.
function pickQuestions(entries, { focus = [], experience = 'five', count = 10, basics = true, mine = true, seen = new Set(), starredOnly = null } = {}, rand = Math.random) {
  if (starredOnly) return starredOnly.slice(0, count);
  const lw = (EXPERIENCE[experience] || EXPERIENCE.five).weights;
  const weight = (e) => (lw[e.level] ?? 1) * (SCENARIO_TYPES.test(e.type) ? 2.2 : 1) * (seen.has(e.id) ? 0.15 : 1);
  const byArea = (keys) => entries.filter(e => keys.includes(areaOf(e)));
  const focusKeys = focus.length ? focus : ['basics'];
  const mineKeys = mine ? ['project', 'resume'].filter(k => !focusKeys.includes(k) && entries.some(e => areaOf(e) === k)) : [];
  const basicsOn = basics && !focusKeys.includes('basics');
  const nMine = mineKeys.length ? Math.max(1, Math.round(count * 0.1)) : 0;
  const nBasics = basicsOn ? Math.max(1, Math.round(count * 0.2)) : 0;
  const nFocus = count - nMine - nBasics;
  // Spread the focus questions evenly over the chosen areas.
  const focusPicks = [];
  const per = Math.ceil(nFocus / focusKeys.length);
  for (const k of focusKeys) focusPicks.push(...weightedPick(byArea([k]), weight, per, rand));
  const picked = [
    ...weightedPick(focusPicks, () => 1, nFocus, rand),
    ...weightedPick(byArea(['basics']), weight, nBasics, rand),
    ...weightedPick(byArea(mineKeys), weight, nMine, rand)
  ];
  // Top up from the focus areas if one area ran out.
  if (picked.length < count) {
    const have = new Set(picked);
    picked.push(...weightedPick(byArea(focusKeys).filter(e => !have.has(e)), weight, count - picked.length, rand));
  }
  return weightedPick(picked, () => 1, picked.length, rand) // shuffle so areas are mixed
    .map(e => ({ id: e.id, q: e.q, a: e.a, points: e.points || [], code: e.code || '', topic: e.topic, level: e.level, type: e.type, source: e.source || 'bank', area: areaOf(e) }));
}

const GENERATE_SYSTEM = `You are a senior Salesforce interviewer preparing a realistic mock interview. Write the questions you would really ask, and a model answer for each that the candidate can read and learn from.

Questions: the most frequently asked questions in real interviews (LinkedIn, interview experiences) for the chosen areas and experience level; at least 60% scenario-based ("A client wants…", "Users complain that…", "How would you design…", "What would you do if…"); for 5+ years and lead roles include design, trade-off and leading-the-team questions. Phrase them the way an interviewer speaks.
Answers: what the interviewer wants to hear, in simple spoken English, first person, sounding like an experienced lead: one direct sentence first, then 3–5 short points (how it works → a quick real example → the trade-off or best practice). Facts must be correct and current as of late 2026 (current product names: Data 360 (formerly Data Cloud), Experience Cloud, Agentforce, Revenue Cloud Advanced; Salesforce CPQ is end-of-sale). If unsure of a detail, leave it out.

Reply with ONLY a JSON array, no prose, of objects:
{"q": string, "a": string (the direct sentence + a short explanation, 40–120 words), "points": [3-5 short spoken points], "topic": string (area name), "level": "fresher"|"mid"|"senior", "type": "concept"|"scenario"|"design"|"troubleshooting"|"comparison"}`;

function generatePrompt({ focus = [], experience = 'five', count = 5, avoid = [] }) {
  const areas = (focus.length ? focus : ['basics']).map(k => AREAS[k] ? `${AREAS[k].label}${AREAS[k].hint ? ` (${AREAS[k].hint})` : ''}` : k).join('; ');
  return `Interview areas: ${areas}.
Candidate experience: ${(EXPERIENCE[experience] || EXPERIENCE.five).label}.
Write ${count} questions with model answers.${avoid.length ? `\nDo not repeat these questions:\n- ${avoid.slice(0, 40).join('\n- ')}` : ''}`;
}

function parseQuestions(text) {
  const t = String(text || '').replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/m, '');
  const s = t.indexOf('['), e = t.lastIndexOf(']');
  if (s < 0 || e <= s) throw new Error('Claude did not return questions');
  return JSON.parse(t.slice(s, e + 1))
    .filter(x => x && typeof x.q === 'string' && typeof x.a === 'string' && x.q.trim() && x.a.trim())
    .map((x, i) => ({ id: `gen-${Date.now().toString(36)}-${i}`, q: x.q.trim(), a: x.a.trim(), points: Array.isArray(x.points) ? x.points.filter(p => typeof p === 'string') : [],
      code: '', topic: x.topic || 'Claude', level: x.level || 'mid', type: x.type || 'scenario', source: 'claude', area: null }));
}

async function generateQuestions({ complete, focus, experience, count = 5, avoid = [] }) {
  return parseQuestions(await complete({ system: GENERATE_SYSTEM, prompt: generatePrompt({ focus, experience, count, avoid }) }));
}

const FEEDBACK_SYSTEM = `You are a friendly but honest Salesforce interviewer coaching a candidate for a lead role. Compare the candidate's answer with the model answer and the question.
Reply with ONLY a JSON object, no prose:
{"score": 0-10 integer (how well it answers what the interviewer wanted: correctness, completeness, clarity, example, lead angle),
 "good": [1-3 short points on what was right],
 "missing": [1-4 short points on what was missing or wrong],
 "better": [3-5 short spoken points: how to say it better, in simple English, first person]}`;

async function feedback({ complete, q, modelAnswer, myAnswer }) {
  const text = await complete({ system: FEEDBACK_SYSTEM, prompt: `Question: ${q}\n\nModel answer: ${modelAnswer}\n\nCandidate's answer: ${myAnswer}` });
  const t = String(text || '');
  const s = t.indexOf('{'), e = t.lastIndexOf('}');
  if (s < 0 || e <= s) throw new Error('Claude did not return feedback');
  const f = JSON.parse(t.slice(s, e + 1));
  const list = (v) => Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, 5) : [];
  return { score: Math.max(0, Math.min(10, Math.round(Number(f.score) || 0))), good: list(f.good), missing: list(f.missing), better: list(f.better) };
}

// Seen questions, questions starred for revision, and past sessions — kept next to the settings.
class PracticeHistory {
  constructor(file) { this.file = file; this.data = { seen: [], starred: [], sessions: [] }; this.load(); }
  load() {
    try { this.data = { seen: [], starred: [], sessions: [], ...JSON.parse(fs.readFileSync(this.file, 'utf8')) }; } catch { /* first time */ }
  }
  save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file + '.tmp', JSON.stringify(this.data, null, 1));
    fs.renameSync(this.file + '.tmp', this.file);
  }
  get seen() { return new Set(this.data.seen); }
  markSeen(id) { if (id && !this.data.seen.includes(id)) { this.data.seen.push(id); this.data.seen = this.data.seen.slice(-3000); this.save(); } }
  star(question, on) {
    this.data.starred = this.data.starred.filter(s => s.q !== question.q);
    if (on) this.data.starred.push({ id: question.id, q: question.q, a: question.a, points: question.points || [], code: question.code || '', topic: question.topic, level: question.level, type: question.type, source: question.source });
    this.save();
    return this.data.starred.length;
  }
  addSession(s) { this.data.sessions.push({ at: new Date().toISOString(), ...s }); this.data.sessions = this.data.sessions.slice(-200); this.save(); }
  summary() {
    return { seen: this.data.seen.length, starred: this.data.starred.length, sessions: this.data.sessions.length, last: this.data.sessions.at(-1) || null };
  }
}

function areaCounts(entries) {
  const out = {};
  for (const e of entries) { const a = areaOf(e); if (a) out[a] = (out[a] || 0) + 1; }
  return out;
}

module.exports = { AREAS, EXPERIENCE, areaOf, areaCounts, pickQuestions, weightedPick, generateQuestions, generatePrompt, parseQuestions, feedback, PracticeHistory, GENERATE_SYSTEM, FEEDBACK_SYSTEM };
