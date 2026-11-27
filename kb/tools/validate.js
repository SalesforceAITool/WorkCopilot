#!/usr/bin/env node
// Checks Q&A bank files: node kb/tools/validate.js kb/src/apex-core.json [more files...]
// Prints problems and exits 1 if any file is invalid.
const fs = require('fs');
const path = require('path');

const LEVELS = ['fresher', 'mid', 'senior'];          // 0–2 yrs, 3–6 yrs, 7–10 yrs
const TYPES = ['concept', 'scenario', 'code', 'comparison', 'troubleshooting', 'design'];
// An old name is fine when the new name is in the same sentence ("Data 360 (formerly Data Cloud)").
const OUTDATED = [
  [/\bData Cloud\b/, /\bData 360\b/, 'say "Data 360 (formerly Data Cloud)"'],
  [/\bCommunity Cloud\b/, /\bExperience Cloud\b/, 'say "Experience Cloud (formerly Community Cloud)"'],
  [/\bEinstein Copilot\b/, /\bAgentforce\b/, 'Einstein Copilot is now Agentforce'],
];
function outdated(text) {
  const found = [];
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    for (const [oldName, newName, fix] of OUTDATED) if (oldName.test(sentence) && !newName.test(sentence)) found.push(fix);
  }
  return [...new Set(found)];
}

function check(file) {
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return [`${file}: not valid JSON (${e.message})`]; }
  if (!Array.isArray(data)) return [`${file}: top level must be an array of Q&A objects`];
  return checkEntries(data, path.basename(file));
}

// Problems in a list of entries (empty list = all good). Used by the CLI and the app.
function checkEntries(data, label = 'entries') {
  const errs = [];
  const ids = new Set();
  const qs = new Set();
  data.forEach((e, i) => {
    const at = `${label}[${i}]${e && e.id ? ' ' + e.id : ''}`;
    if (!e || typeof e !== 'object') { errs.push(`${at}: not an object`); return; }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*-\d{3}$/.test(e.id || '')) errs.push(`${at}: id must look like "apex-trg-001"`);
    if (ids.has(e.id)) errs.push(`${at}: duplicate id`);
    ids.add(e.id);
    for (const k of ['topic', 'q', 'a']) if (typeof e[k] !== 'string' || !e[k].trim()) errs.push(`${at}: "${k}" missing`);
    if (!LEVELS.includes(e.level)) errs.push(`${at}: level must be one of ${LEVELS.join('/')}`);
    if (!TYPES.includes(e.type)) errs.push(`${at}: type must be one of ${TYPES.join('/')}`);
    if (!Array.isArray(e.alt) || e.alt.length < 2 || e.alt.some(x => typeof x !== 'string' || !x.trim())) errs.push(`${at}: "alt" needs 2–5 other ways the question is asked`);
    if (e.alt && e.alt.length > 5) errs.push(`${at}: at most 5 alt phrasings`);
    if (e.points !== undefined && (!Array.isArray(e.points) || e.points.some(x => typeof x !== 'string'))) errs.push(`${at}: "points" must be an array of strings`);
    if (e.code !== undefined && typeof e.code !== 'string') errs.push(`${at}: "code" must be a string`);
    if (!Array.isArray(e.tags) || !e.tags.length) errs.push(`${at}: "tags" needs at least one keyword`);
    const words = (e.a || '').split(/\s+/).length;
    if (words < 25 || words > 220) errs.push(`${at}: answer should be 25–220 words (has ${words})`);
    if ((e.type === 'code') && !e.code) errs.push(`${at}: type "code" needs a "code" snippet`);
    const key = (e.q || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (qs.has(key)) errs.push(`${at}: same question twice`);
    qs.add(key);
    const text = [e.q, e.a, ...(e.points || [])].join(' ');
    for (const fix of outdated(text)) errs.push(`${at}: outdated name — ${fix}`);
  });
  return errs;
}

module.exports = { checkEntries };
if (require.main !== module) return;

const files = process.argv.slice(2);
if (!files.length) { console.log('usage: node kb/tools/validate.js <file.json>...'); process.exit(2); }
let bad = 0;
const allIds = new Map();
for (const f of files) {
  try { for (const e of JSON.parse(fs.readFileSync(f, 'utf8'))) {
    if (allIds.has(e.id) && allIds.get(e.id) !== f) { bad++; console.log(`${e.id}: used in both ${path.basename(allIds.get(e.id))} and ${path.basename(f)}`); }
    allIds.set(e.id, f);
  } } catch {}
}
for (const f of files) {
  const errs = check(f);
  if (errs.length) { bad++; console.log(errs.slice(0, 40).join('\n') + (errs.length > 40 ? `\n…and ${errs.length - 40} more` : '')); }
  else console.log(`${f}: OK (${JSON.parse(fs.readFileSync(f, 'utf8')).length} questions)`);
}
process.exit(bad ? 1 : 0);
