// Practice interviews: choosing the questions, Claude's new questions and feedback, history.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const P = require('../src/practice');

const bank = require('../kb/salesforce-qa.json').map(e => ({ ...e, source: 'bank' }));
const project = require('../project-kb/amkor-qtc.json').map(e => ({ ...e, source: 'project:amkor-qtc' }));
const all = [...bank, ...project];
// Deterministic "random" for repeatable picks.
const seeded = (seed = 7) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

test('every booklet question belongs to a practice area', () => {
  const missing = all.filter(e => !P.areaOf(e)).map(e => e.id);
  assert.deepEqual(missing, []);
  assert.equal(P.areaOf({ id: 'hcx-001' }), 'health');
  assert.equal(P.areaOf({ id: 'fsl-003' }), 'service');
  assert.equal(P.areaOf({ id: 'lead-020', topic: 'CPQ Leadership' }), 'cpq');
  assert.equal(P.areaOf({ id: 'lead-001', topic: 'Technical Leadership' }), 'architecture');
  assert.equal(P.areaOf({ id: 'me-resume-001', source: 'project:resume' }), 'resume');
  assert.equal(P.areaOf({ id: 'qtc-cpq-001', source: 'project:amkor-qtc' }), 'project');
});

test('a Health Cloud practice: mostly Health Cloud, some basics, a project question, no repeats, scenario-heavy', () => {
  const qs = P.pickQuestions(all, { focus: ['health'], experience: 'five', count: 10, basics: true, mine: true }, seeded());
  assert.equal(qs.length, 10);
  assert.equal(new Set(qs.map(q => q.id)).size, 10);
  const areas = qs.map(q => q.area);
  assert.equal(areas.filter(a => a === 'health').length, 7);
  assert.equal(areas.filter(a => a === 'basics').length, 2);
  assert.equal(areas.filter(a => a === 'project').length, 1);
  const scen = qs.filter(q => /scenario|troubleshooting|design/.test(q.type)).length;
  assert.ok(scen >= 4, `only ${scen} scenario questions`);
  for (const q of qs) assert.ok(q.q && q.a, 'question and model answer');
});

test('several areas are shared out; switches turn basics and my-project questions off', () => {
  const qs = P.pickQuestions(all, { focus: ['cpq', 'agentforce'], experience: 'lead', count: 10, basics: false, mine: false }, seeded(3));
  const areas = qs.map(q => q.area);
  assert.ok(areas.every(a => a === 'cpq' || a === 'agentforce'), areas.join());
  assert.ok(areas.filter(a => a === 'cpq').length >= 3 && areas.filter(a => a === 'agentforce').length >= 3);
});

test('experience level shifts the mix: fresher gets basic questions, lead gets senior ones', () => {
  const levels = (exp) => {
    const out = { fresher: 0, mid: 0, senior: 0 };
    for (let s = 1; s <= 20; s++) for (const q of P.pickQuestions(bank, { focus: ['basics'], experience: exp, count: 10, basics: false, mine: false }, seeded(s))) out[q.level]++;
    return out;
  };
  const f = levels('fresher'), l = levels('lead');
  assert.ok(f.fresher > f.senior * 3, JSON.stringify(f));
  assert.ok(l.senior > l.fresher * 4, JSON.stringify(l));
});

test('questions already practised come up much less often', () => {
  const health = all.filter(e => P.areaOf(e) === 'health');
  const seen = new Set(health.slice(0, health.length - 15).map(e => e.id));
  let fresh = 0;
  for (let s = 1; s <= 10; s++) fresh += P.pickQuestions(all, { focus: ['health'], count: 10, basics: false, mine: false, seen }, seeded(s)).filter(q => !seen.has(q.id)).length;
  assert.ok(fresh / 100 > 0.5, `only ${fresh}% unseen`);
});

test('new questions from Claude: asked for the areas and level, scenario-heavy, lead voice; reply parsed and checked', async () => {
  let req;
  const reply = '```json\n' + JSON.stringify([
    { q: 'A clinic wants nurses to see only their own patients. How would you design it?', a: 'I would keep patient records private and share through care teams.', points: ['Private OWD', 'Care team sharing'], topic: 'Health Cloud', level: 'senior', type: 'scenario' },
    { q: '', a: 'no question' }, { q: 'no answer' }
  ]) + '\n```';
  const qs = await P.generateQuestions({ complete: async (r) => { req = r; return reply; }, focus: ['health', 'basics'], experience: 'five', count: 5, avoid: ['What is a care plan?'] });
  assert.equal(qs.length, 1);
  assert.equal(qs[0].source, 'claude');
  assert.match(qs[0].id, /^gen-/);
  assert.match(req.system, /at least 60% scenario-based/);
  assert.match(req.system, /sounding like an experienced lead/);
  assert.match(req.prompt, /Interview areas: Health Cloud; Salesforce basics \(Apex, triggers/);
  assert.match(req.prompt, /Candidate experience: 5–7 years/);
  assert.match(req.prompt, /Write 5 questions/);
  assert.match(req.prompt, /Do not repeat these questions:\n- What is a care plan\?/);
  await assert.rejects(P.generateQuestions({ complete: async () => 'Sorry, I cannot.', focus: [] }), /did not return questions/);
});

test('feedback on my answer: score kept in 0–10, lists cleaned', async () => {
  let req;
  const fb = await P.feedback({
    complete: async (r) => { req = r; return 'Here: {"score": 14, "good": ["Mentioned care teams", 3], "missing": ["Sharing sets for the portal"], "better": ["I keep patient data private", "Care team members get access"]}'; },
    q: 'How do you restrict patient access?', modelAnswer: 'Private OWD and care teams.', myAnswer: 'Use care teams.'
  });
  assert.deepEqual(fb, { score: 10, good: ['Mentioned care teams'], missing: ['Sharing sets for the portal'], better: ['I keep patient data private', 'Care team members get access'] });
  assert.match(req.prompt, /Candidate's answer: Use care teams\./);
  assert.match(req.system, /"score": 0-10/);
});

test('history: seen and starred questions are saved and survive a restart', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'practice-')), 'practice.json');
  const h = new P.PracticeHistory(file);
  h.markSeen('hcx-001'); h.markSeen('hcx-001'); h.markSeen('cpq-002');
  const q = { id: 'hcx-001', q: 'What is a care plan?', a: 'A plan…', points: ['goals'] };
  h.star(q, true);
  h.addSession({ focus: ['health'], asked: 5, avgScore: 7 });
  const again = new P.PracticeHistory(file);
  assert.deepEqual(again.summary().seen, 2);
  assert.equal(again.summary().starred, 1);
  assert.equal(again.summary().last.asked, 5);
  again.star(q, false);
  assert.equal(new P.PracticeHistory(file).summary().starred, 0);
});
