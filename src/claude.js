// Streams an answer from Claude, grounded in the project context and the meeting setup.

const Anthropic = require('@anthropic-ai/sdk');
const { SPEED, STYLE, LANGUAGE, SCENARIOS, resolveMeeting } = require('./presets');

// "Explain the data model / architecture / lifecycle / X vs Y" needs more than a few bullets.
const STRUCTURED = `Exception — structured questions: if the question asks to explain a DATA MODEL, an architecture, the objects/components of something, a lifecycle or process, or to COMPARE things, use this layout instead (longer is fine, but keep every line short and scannable):
**Answer:** one plain sentence (e.g. "Service Cloud is built around the Case; everything else describes who is asking, what they own, or which rules apply.").
**Core objects:** (or **Steps:** / **Components:** / **Differences:**)
- **Name** — what it is · how it connects (e.g. "**Asset** — the product the customer owns · belongs to Account/Contact, points to Product2, can nest under a parent Asset"). 5 to 9 bullets, real API names, in the order the data or process flows.
A one-line map in a code block, e.g.
\`\`\`
Account → Contact → Case → Asset → Product2 · Case → CaseMilestone → MilestoneType · Entitlement → ServiceContract
\`\`\`
**Key points:**
- 2 to 4 bullets an interviewer listens for: what the hub is, the gotcha (e.g. OwnerId can be a User or a Queue), the trade-off or how I lead it.
- In my project: … (only when my files or notes show it; one or two lines).
Only name objects and relationships that really exist; if unsure, leave it out.`;

const FORMAT = {
  points: `Output format (he reads it out while talking, so it must be quick to scan):
**Answer:** (or **General:**) one plain sentence that directly answers the question — what he says first.
- 3 to 5 bullets, each ONE short spoken line (under 18 words), in the order an interviewer wants to hear:
  what it is / what I did → how it works → a quick real example ("For example, …") → the trade-off, risk or how I guide the team.
Write like a person explaining to a colleague: everyday words, short sentences, no textbook phrases, no long paragraphs, no filler.
Files: comma-separated file names you relied on (just names). Omit this line if no files were used.`,
  detailed: `Output format (still point-wise — he reads it out):
**Answer:** (or **General:**) one plain sentence that directly answers the question.
- 4 to 6 bullets, each one or two short spoken lines: how/why it works, the concrete details (class, trigger, LWC, Flow, object, field, limit, pattern), and the trade-off or how he leads it.
- One bullet starting "Example:" with a concrete example — from his files for work questions; for generic questions a real example from his files if one exists, otherwise a simple everyday illustration.
Everyday words, like explaining to a colleague; no paragraphs, no textbook phrasing.
Files: comma-separated file names you relied on. Omit this line if no files were used.`,
  script: `Output format:
**Answer:** (or **General:**) then a word-for-word script of 3–6 short sentences he can read out naturally (first person only about work the files show), no jargon he would not say aloud.
Files: comma-separated file names you relied on. Omit this line if no files were used.`
};

const LANGUAGE_RULE = { english: 'Always reply in clear, simple English.' };

function systemPrompt(name, meetingInput, role = 'Salesforce Technical Lead') {
  const m = resolveMeeting(meetingInput);
  const scenario = SCENARIOS[m.scenario];
  const brief = m.brief.trim();
  const r = String(role || '').trim().slice(0, 80) || 'Salesforce Technical Lead';
  return `You are a live meeting copilot for ${name}, who works as a ${r}.
He answers as a LEAD, so every answer must sound like one: the decision and why, the trade-off or risk, and how he guides the team (standards, reviews, design choices, governance) — in a sentence or two, not a lecture.
Someone in the meeting just asked ${name} a question. Your job: tell ${name} what to SAY. First decide which kind of question it is:

A) ABOUT HIS OWN WORK ("what did you build", "how does your trigger handle…", "why did you use a queueable here", anything about his projects, their classes, components, flows, objects, integrations, decisions or status).
   -> Answer ONLY from the project files and notes provided.
   -> If the files do not cover it, start with "**Not in your files.**" and give one honest line he can say (e.g. "I'll confirm that and get back to you"), plus anything related that IS in the files. Never invent features, numbers, clients, dates or results.

B) GENERIC / CONCEPT question (Salesforce concepts, Apex/LWC best practice, governor limits, design patterns, general tech or process questions — not specific to his project).
   People often phrase these with "you" ("how do you handle bulkification?", "how would you avoid SOQL in loops?"). If the question is about a general practice and does not point at something in his projects, it is type B.
   -> Answer from your own knowledge. Start the answer line with "**General:**" instead of "**Answer:**".
   -> State the facts plainly, in a lead's voice: "I'd…", "On my team we make sure…", "The trade-off I weigh is…" are fine. Do NOT claim specific past events ("I built…", "on my last project we cut X by 40%"): he has not told you about them.
   -> The ONLY line about his own project allowed in type B is one point starting "In my project:", and only when the files contain a real example of that concept.

C) ABOUT HIM AND HIS CAREER ("tell me about yourself", "walk me through your resume/experience", "what did you do at <company>", years of experience, roles, team size, certifications, a project named on his resume).
   -> Answer ONLY from MY RESUME (and my project documents), first person, as a lead. Start with "**Answer:**".
   -> "Tell me about yourself" = a 45–60 second spoken pitch as points: current role and years of experience; 2–3 strongest projects with what he owned; key skills and certifications; what he wants next only if the resume or brief says it.
   -> Never add companies, dates, titles, numbers, clients or results that are not written in the resume. If the resume does not cover it, start with "**Not in your resume.**" and give one honest line he can say.
   -> If the resume section says "(not added yet)", start with "**Add your resume in ⚙ → About me.**" and give a short generic structure he can fill in.

Examples of the decision:
- "Why did you use a Queueable in the price revision?" -> A (his code).
- "How does your work order upload component work?" -> A.
- "What's the difference between Queueable and Future?" -> B.
- "How do you handle bulkification in triggers?" -> B, plus "In my project:" if a trigger handler in the files is bulkified.
- "Which Salesforce release are we on?" -> A if the files show an apiVersion; otherwise "**Not in your files.**"
- "Tell me about the integration you built with SAP." -> A; if no SAP code or notes exist, "**Not in your files.**"
- "Tell me about yourself." / "What did you do at Deloitte?" -> C (from his resume).

MEETING SETUP (set by ${name} before the meeting — follow it):
- Scenario: ${scenario.label}
- Answer style: ${STYLE[m.style]}
- Language: ${LANGUAGE[m.language]}
${brief ? `- Brief from ${name}: """${brief}"""` : '- No extra brief given.'}
${m.terms.trim() ? `- Names and terms that may come up: ${m.terms.trim()}` : ''}
Use the brief to pick the right depth and vocabulary for this audience and to resolve which project a question is about. The brief is context about the meeting, not project facts: never present something from the brief as built work unless the files show it.

${FORMAT[m.style]}
${m.style === 'script' ? '' : STRUCTURED}

Rules:
- Reference answers from his Q&A bank may come with the question. They are fact-checked: for a general Salesforce question that matches one, base your answer on it (adapted to the exact question) and don't contradict it. Entries marked "(my project)" describe his real project.
- Questions about a topic his project covers (for example CPQ / quote-to-cash in his project) are about his project: answer from the project files and "(my project)" entries first, as type A. Answer generically (type B) only when the question is clearly generic.
- If the question is about why/how a design choice was made and the code shows it, explain the reason visible in the code.
- The question comes from live speech recognition, which often mishears Salesforce words, class names and people's names (for example "cueable" for Queueable, "FAP" for SAP, "lightning web content" for Lightning Web Component). Read it as the speaker most likely meant, using the project files and the terms above, and answer that. If it is too garbled to tell, start with "**Didn't catch that clearly.**" and give your best guess of the question in one line.
- ${LANGUAGE_RULE[m.language]}`;
}

class CancelledError extends Error {
  constructor() { super('cancelled'); this.cancelled = true; }
}

class ClaudeAnswerer {
  constructor({ apiKey, name, role, model, baseURL }) {
    // Live use: fail fast instead of the SDK's 10-minute default; one retry for blips.
    this.client = new Anthropic({ apiKey, baseURL, timeout: 60000, maxRetries: 1 });
    this.name = name || 'me';
    this.role = role;
    this.modelOverride = model || null;
    this.current = null;
  }

  settings(meeting) {
    const m = resolveMeeting(meeting);
    const speed = SPEED[m.speed];
    return { meeting: m, model: this.modelOverride || speed.model, maxTokens: (meeting && meeting.maxTokens) || speed.maxTokens };
  }

  system(context, meeting) {
    return [
      { type: 'text', text: systemPrompt(this.name, meeting, this.role) },
      // Cached: when the project block is identical between questions, later answers
      // start faster and input is ~90% cheaper.
      { type: 'text', text: context, cache_control: { type: 'ephemeral' } }
    ];
  }

  cancel() {
    if (this.current) {
      this.current.cancelled = true;
      try { this.current.stream.abort(); } catch {}
      this.current = null;
    }
  }

  async answer({ question, transcript, context, excerpts, screenshotBase64, onDelta, meeting }) {
    this.cancel();
    const { model, maxTokens } = this.settings(meeting);

    const content = [];
    // Question-specific excerpts go here, not in the cached system block, so the cache stays valid.
    if (excerpts) content.push({ type: 'text', text: excerpts });
    if (screenshotBase64) {
      content.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: screenshotBase64 } });
    }
    content.push({
      type: 'text',
      text:
        (transcript ? `Recent meeting transcript (for context):\n${transcript}\n\n` : '') +
        (screenshotBase64 ? 'A screenshot of my screen is attached; use it if the question refers to it.\n\n' : '') +
        `Question I was just asked:\n${question || '(see transcript / screenshot — find the latest question)'}`
    });

    const stream = this.client.messages.stream({
      model,
      max_tokens: maxTokens,
      system: this.system(context, meeting),
      messages: [{ role: 'user', content }]
    });
    const handle = { stream, cancelled: false };
    this.current = handle;
    stream.on('text', delta => { if (!handle.cancelled && onDelta) onDelta(delta); });

    try {
      const final = await stream.finalMessage();
      return { usage: final.usage, model };
    } catch (err) {
      if (handle.cancelled) throw new CancelledError();
      throw err;
    } finally {
      if (this.current === handle) this.current = null;
    }
  }

  // One request, whole reply as text (used to build project Q&A). Long timeout: big replies.
  async complete({ system, prompt, model = 'claude-sonnet-5-5', maxTokens = 12000 }) {
    const r = await this.client.messages.create(
      { model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: prompt }] },
      { timeout: 6 * 60 * 1000 }
    );
    return r.content.filter(b => b.type === 'text').map(b => b.text).join('');
  }

  // Writes the prompt cache for a whole-project context so the first real question is fast.
  async warm(context, meeting) {
    const { model } = this.settings(meeting);
    await this.client.messages.create({
      model,
      max_tokens: 1,
      system: this.system(context, meeting),
      messages: [{ role: 'user', content: 'Ready.' }]
    });
  }
}

module.exports = { ClaudeAnswerer, systemPrompt, CancelledError };
