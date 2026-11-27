// Q&A bank service for the app: loads the Salesforce bank and project Q&A files, prepares
// meaning-based matching in the background, and finds the best stored answers for a question.

const { loadBanks, SHOW_AT } = require('./qa-bank');
const { Embedder, SemanticIndex } = require('./semantic');

const PROJECT_PREFERENCE = 0.06; // a project answer this close to the best general one goes first
// CPQ / quote-to-cash questions asked about "you / your project" are about the user's own project
// (Amkor QTC), so there a project answer goes first even when a general one is clearly closer.
// A plain definition ("what is a price rule in CPQ?") keeps the general answer first.
const PROJECT_PREFERENCE_CPQ = 0.2;
const CPQ_TOPIC = /\b(salesforce cpq|revenue cloud|cpq|quote|pricing|price)\b/i;
const PERSONAL = /\b(you|your|yours|you've|we|our|us|project|implementation|built|worked|handled)\b/i;
const REFERENCE_AT = 0.48;       // matches given to Claude as reference: just above off-topic chatter (peaks ~0.47)

class BankService {
  constructor({ bankFile, projectDir, modelCacheDir, vectorCacheFile, localModelPath, embedder, onStatus } = {}) {
    this.opts = { bankFile, projectDir, vectorCacheFile };
    this.embedder = embedder || new Embedder({ cacheDir: modelCacheDir, localModelPath });
    this.onStatus = onStatus || (() => {});
    this.status = { state: 'off', entries: 0, sources: [] };
    this.generation = 0;
  }

  setStatus(patch) {
    this.status = { ...this.status, ...patch };
    this.onStatus(this.status);
  }

  // Loads (or reloads) the files, then prepares meaning-based matching. Never throws:
  // if the sentence model can't be loaded, typed keyword search still works.
  async load() {
    const gen = ++this.generation;
    const { bank, sources, error } = loadBanks({ bankFile: this.opts.bankFile, projectDir: this.opts.projectDir });
    this.bank = bank;
    this.setStatus({ state: bank.size ? 'preparing' : 'off', entries: bank.size, sources, progress: 0, error });
    if (!bank.size) return this.status;
    try {
      const index = await SemanticIndex.build(this.embedder, bank.entries, {
        cacheFile: this.opts.vectorCacheFile,
        onProgress: (done, total) => { if (gen === this.generation) this.setStatus({ progress: Math.round(100 * done / total) }); }
      });
      if (gen !== this.generation) return this.status; // a newer reload started meanwhile
      bank.attachSemantic(index);
      this.setStatus({ state: 'ready', progress: 100 });
    } catch (err) {
      if (gen === this.generation) this.setStatus({ state: 'keyword-only', error: err.message || String(err) });
    }
    return this.status;
  }

  get ready() { return !!(this.bank && this.bank.semantic); }

  // Best matches for a spoken/typed question. `show`: the top one is sure enough to display.
  async find(question, { limit = 3 } = {}) {
    if (!this.bank || !this.bank.size || !String(question || '').trim()) return { matches: [], show: false, semantic: false };
    let results;
    if (this.ready) {
      const [qv] = await this.embedder.embed([question]);
      results = this.bank.search(question, { limit: 10, queryVector: qv });
    } else {
      results = this.bank.search(question, { limit: 10 });
    }
    const threshold = this.ready ? SHOW_AT.semantic : SHOW_AT.keyword;
    results = preferProject(results, this.ready ? threshold : 0, question);
    const matches = results.slice(0, limit).map(r => ({ ...publicEntry(r.entry), confidence: r.confidence }));
    return { matches, show: !!(matches[0] && matches[0].confidence >= threshold), semantic: this.ready };
  }

  // Text for Claude: the closest bank answers, so its answer matches the fact-checked ones.
  // Only meaning-based matches: keyword-only scores are not reliable enough to steer Claude.
  static reference(matches, { semantic = true } = {}) {
    if (!semantic) return '';
    const use = (matches || []).filter(m => m.confidence >= REFERENCE_AT);
    if (!use.length) return '';
    return ['=== REFERENCE ANSWERS FROM MY Q&A BANK (closest matches to the question) ===',
      ...use.map(m => [
        `--- ${m.source && m.source.startsWith('project:') ? '(my project) ' : ''}Q: ${m.q}`,
        `A: ${m.a}`,
        ...(m.points || []).map(p => `- ${p}`),
        m.code ? `Code:\n${m.code}` : ''
      ].filter(Boolean).join('\n'))].join('\n\n');
  }
}

// minConfidence: a project answer is only moved up if it is itself sure enough to show,
// so preferring it never hides the instant answer.
// What to do with a question, given the answer mode and what the Q&A bank found.
//   smart  — project question (a sure project answer) → that answer instantly, no Claude;
//            anything else → Claude only (no booklet card).
//   both   — booklet card when sure, then Claude.   bank — booklet only when sure, else Claude.
//   claude — Claude only.
// Screenshot questions always go to Claude (they are about what's on screen).
function routeAnswer({ source = 'smart', found = {}, withScreenshot = false } = {}) {
  const top = found.matches && found.matches[0];
  const sure = !!(found.show && top);
  const projectHit = sure && !!(top.source && top.source.startsWith('project:'));
  if (withScreenshot || source === 'claude') return { showBank: false, useClaude: true, projectHit };
  if (source === 'smart') return projectHit ? { showBank: true, useClaude: false, projectHit } : { showBank: false, useClaude: true, projectHit };
  if (source === 'bank') return { showBank: sure, useClaude: !sure, projectHit };
  return { showBank: sure, useClaude: true, projectHit }; // both
}

// Questions that need a full, structured answer (like a detailed chat reply), not a few quick points.
const DEEP_QUESTION = /\b(data ?model|architecture|explain (the|how|in detail)|walk (me )?through|life ?cycle|end[- ]to[- ]end|difference between|compare|comparison|versus|vs\.?|how would you (design|implement|build|architect)|design (a|an|the)|implementation (steps|approach)|step[- ]by[- ]step|components of|objects (in|of)|deep dive|in detail)\b/i;
const FULL_ANSWER_NOTE = `Answer depth: FULL. Give the complete answer a senior Salesforce expert would write in a detailed chat reply: well organised with bold section labels, the core objects / steps / components each with what it is and how it connects (real API names), a relationship map or flow in a code block where it helps, the key points an interviewer listens for, a short real example, and "In my project:" only if my files show it. About 250–550 words. Simple, spoken English; every line short and scannable.`;

// Answer depth for a question: 'full' when asked for (More detail) or when the question is a
// data-model / architecture / process / comparison question; otherwise 'quick'.
function answerDepth(question, requested) {
  if (requested === 'full' || requested === 'quick') return requested;
  return DEEP_QUESTION.test(String(question || '')) ? 'full' : 'quick';
}

// The meeting settings for a full answer: at least the Balanced model, detailed style, room to write.
function fullAnswerMeeting(meeting = {}) {
  return { ...meeting, speed: meeting.speed === 'fast' || !meeting.speed ? 'balanced' : meeting.speed, style: 'detailed', maxTokens: 1800 };
}

function preferProject(results, minConfidence = 0, question = 'your project') {
  if (!results.length) return results;
  const top = results[0];
  if (top.entry.source && top.entry.source.startsWith('project:')) return results;
  const margin = PERSONAL.test(question) && CPQ_TOPIC.test(`${top.entry.topic || ''} ${(top.entry.tags || []).join(' ')}`) ? PROJECT_PREFERENCE_CPQ : PROJECT_PREFERENCE;
  const proj = results.find(r => r.entry.source && r.entry.source.startsWith('project:') && r.score >= top.score - margin && (r.confidence === undefined || r.confidence >= minConfidence));
  return proj ? [proj, ...results.filter(r => r !== proj)] : results;
}

function publicEntry(e) {
  const { id, q, a, points, code, topic, level, type, source } = e;
  return { id, q, a, points, code, topic, level, type, source };
}

module.exports = { BankService, preferProject, routeAnswer, answerDepth, fullAnswerMeeting, FULL_ANSWER_NOTE };
