#!/usr/bin/env node
// Measures how well the app finds the right answer for questions worded differently from the bank.
// Each entry's LAST alt phrasing is left out of the index and used as the question.
// Also: the same questions with speech-recognition style noise, and off-topic chatter that must NOT match.
const path = require('path');
const { QABank } = require('../../src/qa-bank');
const entries = require(path.join(__dirname, '..', 'salesforce-qa.json'));

const NOISE = [
  [/queueable/gi, 'cueable'], [/\bLWC\b/g, 'L W C'], [/lightning web component/gi, 'lightning web content'],
  [/\bSOQL\b/g, 'sock well'], [/\bApex\b/g, 'a pex'], [/Salesforce/g, 'sales force'], [/\bCPQ\b/g, 'C P Q'],
  [/OmniStudio/gi, 'omni studio'], [/[?.,!]/g, '']
];
const noisy = (s) => NOISE.reduce((t, [re, to]) => t.replace(re, to), s).toLowerCase();
const OFF_TOPIC = [
  'how was your weekend', 'can you hear me now', 'let me share my screen', 'what time is it there',
  'tell me about yourself', 'what are your salary expectations', 'are you comfortable with night shifts',
  'shall we start the meeting', 'sorry you were on mute', 'do you have any questions for us',
  'when can you join', 'is the internet working fine', 'we will get back to you', 'what is your notice period',
  'who won the cricket match yesterday', 'please introduce yourself', 'okay thank you so much', 'can everyone see my screen'
];

const bank = new QABank(entries, { holdOut: (e) => e.alt.length - 1 });
const THRESHOLDS = [0.5, 0.55, 0.6, 0.65, 0.7];
function run(label, queries) {
  let top1 = 0, top3 = 0;
  const at = THRESHOLDS.map(() => ({ shown: 0, right: 0 }));
  for (const { q, id } of queries) {
    const r = bank.search(q, { limit: 3 });
    if (r[0] && r[0].entry.id === id) top1++;
    if (r.some(x => x.entry.id === id)) top3++;
    THRESHOLDS.forEach((t, i) => { if (r[0] && r[0].confidence >= t) { at[i].shown++; if (r[0].entry.id === id) at[i].right++; } });
  }
  const n = queries.length;
  console.log(`${label}: top-1 ${(100 * top1 / n).toFixed(1)}% · top-3 ${(100 * top3 / n).toFixed(1)}% (${n} questions)`);
  THRESHOLDS.forEach((t, i) => console.log(`   confidence ≥ ${t}: shown for ${(100 * at[i].shown / n).toFixed(0)}%, right when shown ${at[i].shown ? (100 * at[i].right / at[i].shown).toFixed(1) : '-'}%`));
}
const qs = entries.map(e => ({ q: e.alt[e.alt.length - 1], id: e.id }));
run('Reworded questions', qs);
run('Reworded + speech errors', qs.map(x => ({ ...x, q: noisy(x.q) })));
const off = OFF_TOPIC.map(q => bank.search(q)[0]);
THRESHOLDS.forEach(t => console.log(`Off-topic chatter matched at confidence ≥ ${t}: ${off.filter(r => r && r.confidence >= t).length}/${OFF_TOPIC.length}`));
