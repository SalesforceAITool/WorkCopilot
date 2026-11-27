#!/usr/bin/env node
// Builds the Salesforce Q&A bank:
//   kb/salesforce-qa.json  — every entry in one file (what the app loads)
//   kb/docs/*.md           — one readable page per area, for studying
//   kb/README.md           — index with counts
// Run after editing kb/src/*.json:  node kb/tools/build.js
const fs = require('fs');
const path = require('path');

const KB = path.join(__dirname, '..');
const SRC = path.join(KB, 'src');
const DOCS = path.join(KB, 'docs');

const AREAS = [
  ['apex-core', 'Apex, Governor Limits and Testing'],
  ['triggers', 'Apex Triggers and Order of Execution'],
  ['async-soql', 'Asynchronous Apex, Batch and SOQL'],
  ['lwc-ui', 'LWC, Aura and Visualforce'],
  ['admin-security-flow', 'Admin, Security and Flow'],
  ['integration', 'Integration'],
  ['sales-service', 'Sales Cloud and Service Cloud'],
  ['sales-cloud-more', 'Sales Cloud: lifecycle, features and scenarios'],
  ['service-cloud-more', 'Service Cloud: case lifecycle, features and scenarios'],
  ['experience-health-fsl', 'Experience Cloud, Health Cloud and Field Service'],
  ['experience-cloud-more', 'Experience Cloud: site lifecycle, features and scenarios'],
  ['health-cloud-more', 'Health Cloud: patient lifecycle, features and scenarios'],
  ['cpq-revenue-omnistudio', 'CPQ, Revenue Cloud and OmniStudio'],
  ['cpq-more', 'CPQ: quote-to-cash lifecycle, features and scenarios'],
  ['data360-agentforce', 'Data 360 and Agentforce'],
  ['agentforce-more', 'Agentforce: development, scenarios and newer features'],
  ['architecture-devops', 'Architecture and DevOps'],
  ['lead-scenarios', 'Lead roles: leadership, governance and behavioural']
];
const LEVEL = { fresher: 'Fresher (0–2 yrs)', mid: 'Mid (3–6 yrs)', senior: 'Senior (7–10 yrs)' };

function load() {
  const all = [];
  for (const [file, area] of AREAS) {
    const p = path.join(SRC, file + '.json');
    if (!fs.existsSync(p)) continue;
    for (const e of JSON.parse(fs.readFileSync(p, 'utf8'))) all.push({ ...e, area, file });
  }
  return all;
}

function md(entries, area) {
  const out = [`# ${area}`, '', `${entries.length} questions. Levels: ${['fresher', 'mid', 'senior'].map(l => `${LEVEL[l]} ${entries.filter(e => e.level === l).length}`).join(' · ')}`, ''];
  const byTopic = new Map();
  for (const e of entries) { if (!byTopic.has(e.topic)) byTopic.set(e.topic, []); byTopic.get(e.topic).push(e); }
  for (const [topic, list] of byTopic) {
    out.push(`## ${topic}`, '');
    for (const e of list) {
      out.push(`### ${e.q}`, `*${LEVEL[e.level]} · ${e.type}* · \`${e.id}\``, '', e.a, '');
      if (e.points && e.points.length) { for (const p of e.points) out.push(`- ${p}`); out.push(''); }
      if (e.code) out.push('```' + (/^\s*</.test(e.code) ? 'html' : /^\s*(sf |sfdx |git |npm )/m.test(e.code) ? 'bash' : 'java'), e.code, '```', '');
      if (e.alt && e.alt.length) out.push(`<sub>Also asked as: ${e.alt.join(' · ')}</sub>`, '');
    }
  }
  return out.join('\n');
}

function build() {
  const all = load();
  const bundle = all.map(({ file, ...e }) => e);
  fs.writeFileSync(path.join(KB, 'salesforce-qa.json'), JSON.stringify(bundle));
  fs.mkdirSync(DOCS, { recursive: true });
  const rows = [];
  for (const [file, area] of AREAS) {
    const list = all.filter(e => e.file === file);
    if (!list.length) continue;
    fs.writeFileSync(path.join(DOCS, file + '.md'), md(list, area));
    rows.push(`| [${area}](docs/${file}.md) | ${list.length} | ${list.filter(e => e.type === 'scenario').length} | ${list.filter(e => e.code).length} |`);
  }
  const lv = (l) => all.filter(e => e.level === l).length;
  fs.writeFileSync(path.join(KB, 'README.md'), [
    '# Salesforce Q&A bank',
    '',
    `${all.length} questions with answers in simple spoken English — ${lv('fresher')} fresher (0–2 yrs), ${lv('mid')} mid (3–6 yrs), ${lv('senior')} senior (7–10 yrs).`,
    'The copilot searches this bank instantly when a question is heard, shows the closest answer, and gives it to Claude as a reference.',
    '',
    '| Area | Questions | Scenario | With code |',
    '|---|---|---|---|',
    ...rows,
    '',
    'Edit or add questions in `src/*.json` (format: `src/_example.json`), check them with `node tools/validate.js src/*.json`, then run `node tools/build.js`.',
    'Answers were written fresh and fact-checked against Salesforce documentation (October 2026). Salesforce changes quickly: re-check limits and product names before relying on them.',
    ''
  ].join('\n'));
  return { total: all.length };
}

if (require.main === module) console.log(build());
module.exports = { build, AREAS, md };
