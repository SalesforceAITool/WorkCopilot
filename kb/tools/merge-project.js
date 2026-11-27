#!/usr/bin/env node
// Joins project Q&A parts into one file the app loads, and writes a readable page.
//   node kb/tools/merge-project.js <name> <out.json> <part.json>...
// e.g. node kb/tools/merge-project.js "Amkor QTC" project-kb/amkor-qtc.json project-kb/parts/*.json
const fs = require('fs');
const path = require('path');
const { checkEntries } = require('./validate');
const { md } = require('./build');

const [name, out, ...parts] = process.argv.slice(2);
if (!name || !out || !parts.length) { console.log('usage: merge-project.js <name> <out.json> <part.json>...'); process.exit(2); }
const all = [];
for (const p of parts) all.push(...JSON.parse(fs.readFileSync(p, 'utf8')));
const errs = checkEntries(all, 'merged');
if (errs.length) { console.log(errs.slice(0, 40).join('\n')); process.exit(1); }
fs.writeFileSync(out, JSON.stringify(all, null, 1));
const docs = path.join(path.dirname(out), 'docs');
fs.mkdirSync(docs, { recursive: true });
fs.writeFileSync(path.join(docs, path.basename(out, '.json') + '.md'),
  md(all, `${name} — project Q&A`).replace(/\n/, `\n\nWritten from the project's code only (classes, triggers, LWCs, flows, tests). Read before an interview; the copilot shows these first for project and CPQ questions.\n`));
console.log(`${out}: ${all.length} questions`);
