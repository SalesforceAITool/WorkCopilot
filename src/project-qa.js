// Builds a Q&A file about the user's own project from its files, using Claude once.
// Every answer must come from the code it was shown: no invented features, clients or numbers.

const path = require('path');
const { checkEntries } = require('../kb/tools/validate');

const BATCH_CHARS = 45000;   // project text per Claude request
const FILE_CHARS = 6000;     // long files are cut so a batch covers more of them
const PER_BATCH = 10;
const MAX_BATCHES = 8;
// Metadata folders worth questions, most interview-relevant first.
const PRIORITY = ['classes', 'triggers', 'lwc', 'flows', 'staticresources', 'objects', 'aura', 'customMetadata',
  'omniScripts', 'omniIntegrationProcedures', 'omniUiCard', 'omniDataTransforms', 'pages', 'permissionsets', 'docs'];

const SYSTEM = (name) => `You write question-and-answer pairs about a Salesforce developer's OWN project ("${name}"), so that when an interviewer, manager or client asks about his work, he can answer correctly and quickly.

Strict rules:
- Use ONLY what the files you are shown prove. Never invent features, clients, people, dates, numbers, results or business impact. If the purpose of something is not clear from the code, describe what the code does, not why.
- Answers are in first person, spoken style ("In this project I built…", "Our quote trigger…"), 40–150 words, leading with the direct answer, naming the real classes, triggers, LWCs, flows, objects and fields.
- Questions are what someone would really ask about this work: what it does, how a piece works, why it is designed that way (only if visible), how data flows, how it is tested, how errors are handled, what you would improve (only from visible TODOs/limitations), and CPQ / quote-to-cash specifics when present.
- "code" may only contain a short excerpt copied from the files shown (max ~15 lines), or be omitted.

Reply with ONLY a JSON array, no prose, of objects:
{"q": string, "alt": [2-4 other ways to ask it], "a": string, "points": [2-5 short key points], "code": string (optional),
 "tags": [2-6 lowercase keywords], "level": "fresher"|"mid"|"senior", "type": "concept"|"scenario"|"code"|"comparison"|"troubleshooting"|"design"}
(type "code" requires "code").`;

// Q&A about the person from their resume or project documents, for instant answers.
const SYSTEM_DOC = (kind) => `You write interview question-and-answer pairs for a Salesforce professional who interviews for LEAD roles, using ONLY his ${kind === 'resume' ? 'resume' : 'project documents'} shown to you.

Strict rules:
- Use ONLY facts written in the document. Never invent companies, dates, titles, numbers, clients, team sizes or results. Keep every number exactly as written.
- First person, spoken, simple everyday English, sounding like a lead ("I owned…", "I led…", "My team…" only where the document supports it). Answers 50–160 words, leading with the direct answer, then the concrete details and a short example from the document.
- ${kind === 'resume'
    ? 'Cover: "Tell me about yourself" (a 45–60 second pitch), "Walk me through your resume", each company/role, each project (what it was, what I did, technologies, outcome only if written), key skills, certifications, leadership/team experience, AI tools experience — only where the resume has content.'
    : 'Cover: what the project/business process is, the main modules and how they fit, data flow, integrations, roles/users, key business rules, and what I would explain to a new team member — only what the document says.'}

Reply with ONLY a JSON array, no prose, of objects:
{"q": string, "alt": [2-4 other ways an interviewer asks it], "a": string, "points": [2-5 short spoken key points], "tags": [2-6 lowercase keywords], "level": "fresher"|"mid"|"senior", "type": "concept"|"scenario"|"design"}`;

async function buildDocQA({ kind, name, text, complete }) {
  const prompt = `${kind === 'resume' ? 'MY RESUME' : `PROJECT DOCUMENT: ${name}`}:\n\n${String(text).slice(0, 60000)}\n\nWrite ${kind === 'resume' ? 25 : 20} Q&As.`;
  const list = parseArray(await complete({ system: SYSTEM_DOC(kind), prompt }));
  const prefix = kind === 'resume' ? 'me-resume' : `doc-${slug(name).slice(0, 30)}`;
  const topic = kind === 'resume' ? 'My resume' : `Project document — ${name}`;
  const entries = [];
  let skipped = 0;
  for (const raw of list) {
    const e = { ...raw, id: `${prefix}-${String(entries.length + 1).padStart(3, '0')}`, topic };
    if (!Array.isArray(e.tags) || !e.tags.length) e.tags = [kind];
    if (checkEntries([e]).length) { skipped++; continue; }
    entries.push(e);
  }
  return { entries, skipped };
}

function group(rel) {
  const parts = rel.split(/[\\/]/);
  const i = parts.indexOf('default');
  if (i >= 0 && parts[i + 1]) return parts[i + 1];
  if (parts.includes('docs') || /readme/i.test(parts.at(-1))) return 'docs';
  return parts.length > 2 ? parts[1] : 'other';
}

function batches(files, name) {
  const byGroup = new Map();
  for (const f of files) {
    const g = group(f.rel);
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(f);
  }
  const order = [...byGroup.keys()].sort((a, b) => {
    const pa = PRIORITY.indexOf(a), pb = PRIORITY.indexOf(b);
    return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb) || byGroup.get(b).length - byGroup.get(a).length;
  });
  const out = [];
  for (const g of order) {
    // Bigger files first: they hold most of the logic. Test classes after the code they test.
    const list = byGroup.get(g).slice().sort((a, b) => (/test/i.test(a.rel) - /test/i.test(b.rel)) || b.text.length - a.text.length);
    let cur = [], used = 0;
    for (const f of list) {
      const text = f.text.length > FILE_CHARS ? f.text.slice(0, FILE_CHARS) + '\n… (file continues)' : f.text;
      if (used + text.length > BATCH_CHARS && cur.length) { out.push({ group: g, files: cur }); cur = []; used = 0; }
      cur.push({ rel: f.rel, text });
      used += text.length;
    }
    if (cur.length) out.push({ group: g, files: cur });
  }
  return out;
}

function parseArray(text) {
  const t = String(text || '').replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/m, '');
  const start = t.indexOf('['), end = t.lastIndexOf(']');
  if (start < 0 || end <= start) throw new Error('Claude did not return a JSON list');
  return JSON.parse(t.slice(start, end + 1));
}

function slug(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
}

// complete({ system, prompt }) -> text. Returns { entries, skipped, batches }.
async function buildProjectQA({ index, name, complete, onProgress = () => {}, maxBatches = MAX_BATCHES }) {
  const files = (index.files || []).filter(f => f.text && f.text.trim());
  if (!files.length) throw new Error('No project files to read. Add the project folder in ⚙ first.');
  const id = slug(name);
  const plan = [{ group: 'overview', overview: true }, ...batches(files, name).slice(0, maxBatches - 1)];
  const entries = [];
  let skipped = 0;
  for (let b = 0; b < plan.length; b++) {
    const step = plan[b];
    onProgress({ step: b + 1, total: plan.length, group: step.group });
    const body = step.overview
      ? `Project file list:\n${index.fileTree()}\n\n${(index.notes || []).map(n => `--- NOTES: ${n.rel} ---\n${n.text}`).join('\n\n')}\n\n` +
        files.filter(f => group(f.rel) === 'docs').slice(0, 5).map(f => `--- FILE: ${f.rel} ---\n${f.text.slice(0, 8000)}`).join('\n\n') +
        `\n\nWrite ${PER_BATCH + 2} Q&As about the project as a whole: what it is, its main parts and how they fit, the main objects and automation, and how it is deployed/tested — only what the file list and files show.`
      : `Files from the "${step.group}" part of the project:\n\n` + step.files.map(f => `--- FILE: ${f.rel} ---\n${f.text}`).join('\n\n') +
        `\n\nWrite ${PER_BATCH} Q&As about these files.`;
    let list;
    try { list = parseArray(await complete({ system: SYSTEM(name), prompt: body })); } catch (err) {
      onProgress({ step: b + 1, total: plan.length, group: step.group, error: err.message });
      continue;
    }
    for (const raw of list) {
      const e = { ...raw, id: `proj-${id}-${String(entries.length + 1).padStart(3, '0')}`, topic: `${name} project — ${step.group}` };
      if (!Array.isArray(e.tags) || !e.tags.length) e.tags = [step.group.toLowerCase()];
      if (checkEntries([e]).length) { skipped++; continue; }
      entries.push(e);
    }
  }
  return { entries, skipped, batches: plan.length };
}

module.exports = { buildProjectQA, buildDocQA, batches, group, parseArray, slug, SYSTEM, SYSTEM_DOC };
