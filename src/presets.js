// Meeting Setup options: answer speed tiers and scenario presets with example briefs.
// Shared by the main process (to build the Claude request) and the settings UI.

const SPEED = {
  fast: {
    label: 'Fast',
    hint: 'First words in ~1–2 s. Good for quick back-and-forth.',
    model: 'claude-haiku-5-5', maxTokens: 700, retrievalChars: 30000
  },
  balanced: {
    label: 'Balanced',
    hint: 'Good answers in ~2–4 s. Best default for most meetings.',
    model: 'claude-sonnet-5-5', maxTokens: 700, retrievalChars: 60000
  },
  accurate: {
    label: 'Most accurate',
    hint: 'Deepest reading of your code; slower (~4–8 s). Use for design and deep technical questions.',
    model: 'claude-opus-5-5', maxTokens: 1000, retrievalChars: 100000
  }
};

const STYLE = {
  points: 'Short talking points (one line + 2–4 bullets)',
  detailed: 'Detailed explanation (short paragraph + bullets + example)',
  script: 'Word-for-word script I can read out'
};

// Meetings are always in English.
const LANGUAGE = { english: 'English' };

// Each scenario carries an example brief so the user sees what good input looks like.
const SCENARIOS = {
  job_interview: {
    label: 'Job interview',
    style: 'points',
    example: 'Interview for a Salesforce Lead role (CPQ / Agentforce / Service Cloud). Answer like a lead: the direct answer first, then short points: how it works, a real example, the trade-off and how I guide the team. For my project, use my Amkor QTC files. Keep it simple and spoken.'
  },
  client_demo: {
    label: 'Client demo / client call',
    style: 'points',
    example: 'Demo of the Field Service work-order file upload to the client team. Audience is business users, not developers. Explain in business terms (what technicians can do now, time saved). Avoid code details unless asked. Do not promise dates.'
  },
  manager_update: {
    label: 'Status update to manager',
    style: 'points',
    example: 'Weekly update with my manager on the QTC price revision work (QTC-1566). Focus on what is done, what is blocked and next steps. Keep answers short and confident.'
  },
  tech_discussion: {
    label: 'Technical / architecture discussion',
    style: 'detailed',
    example: 'Design review with the tech lead and architect. Expect questions on why I chose Queueable vs Future, bulkification, governor limits, test coverage and error handling. Name the exact classes and flows.'
  },
  mock_interview: {
    label: 'Mock interview / practice',
    style: 'detailed',
    example: 'Practice round with my students (or with a friend) for Salesforce Developer interviews: Apex, LWC, OmniStudio, FSL. For project questions answer from my files; for concept questions give a clear textbook answer plus a real example from my project if one exists.'
  },
  sprint_review: {
    label: 'Sprint review / presentation',
    style: 'script',
    example: 'Sprint demo while I screen-share. Give me a short script for each question: what the feature does, how to show it, one technical highlight.'
  },
  custom: {
    label: 'Custom',
    style: 'points',
    example: 'Who is in the meeting, what it is about, which project matters, what to emphasise or avoid.'
  }
};

const DEFAULT_MEETING = {
  speed: 'fast',            // quickest answers; switch to Balanced / Most accurate in Meeting Setup
  scenario: 'job_interview',
  style: 'points',
  language: 'english',
  brief: '',
  terms: '', // names and words likely to come up: helps speech recognition and Claude
  folders: [] // empty = all project folders
};

function resolveMeeting(m = {}) {
  const meeting = { ...DEFAULT_MEETING, ...m };
  if (!SPEED[meeting.speed]) meeting.speed = DEFAULT_MEETING.speed;
  if (!SCENARIOS[meeting.scenario]) meeting.scenario = 'custom';
  if (!STYLE[meeting.style]) meeting.style = SCENARIOS[meeting.scenario].style;
  meeting.language = 'english';
  if (!Array.isArray(meeting.folders)) meeting.folders = [];
  meeting.brief = String(meeting.brief || '').slice(0, 4000);
  meeting.terms = String(meeting.terms || '').slice(0, 1000);
  return meeting;
}

module.exports = { SPEED, STYLE, LANGUAGE, SCENARIOS, DEFAULT_MEETING, resolveMeeting };
