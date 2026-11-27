# Brief for Q&A bank writers

You are writing part of a Salesforce interview/meeting question bank used by a live-answer overlay app.
When someone asks a question out loud, the app finds the closest entry and shows its answer instantly,
so the person can SAY the answer. Quality bar: what a strong Salesforce professional would say.

## Output
Write ONE JSON file (an array of entries) at the path you are given. Schema — see kb/src/_example.json:
- id: "<prefix>-NNN" (3 digits, unique, use the prefix you are given)
- topic: short topic name (use the topic names you are given)
- level: "fresher" (0–2 yrs) | "mid" (3–6 yrs) | "senior" (7–10 yrs)
- type: "concept" | "scenario" | "code" | "comparison" | "troubleshooting" | "design"
- q: the question as an interviewer would ask it
- alt: 2–5 OTHER ways people ask the same thing (different wording, casual/spoken style, incl. how a
  speech-to-text system might render it). These are used for matching, so make them genuinely different.
- a: the answer, 40–170 words, simple spoken English, first person where natural ("I would…", "In my
  projects I…" only in a generic way — never invent specific clients, companies or numbers about the speaker).
  Lead with the direct answer in the first sentence.
- points: 2–5 short key points (optional but preferred)
- code: Apex / SOQL / LWC / JSON snippet when it helps (REQUIRED for type "code"; keep it short,
  correct, compilable-looking, bulkified, no hard-coded Ids, follow best practices)
- tags: 2–6 lowercase keywords

## Mix (aim for these proportions)
- Levels: ~35% fresher, ~40% mid, ~25% senior
- Include plenty of SCENARIO questions ("A user complains…", "You need to…", "How would you design…")
  and for code-heavy topics, real code questions (write the trigger/batch/test/LWC).
- Cover: most frequently asked, commonly asked, and deep/tricky questions.

## Accuracy rules (very important — wrong answers in a live interview hurt the user)
- Only state facts you are sure of. Use WebSearch/WebFetch to VERIFY anything that may have changed
  since 2024: product names, retirements, limits, new features. If unsure of a number, leave the number out.
- Current names (as of Oct 2026): Data 360 (formerly Data Cloud, renamed at Dreamforce 2025, under
  Agentforce 360); Experience Cloud (formerly Community Cloud); Agentforce (formerly Einstein Copilot);
  Workflow Rules and Process Builder reached end of support on Dec 31 2025 — use Flow;
  Salesforce CPQ is end-of-sale (still supported for existing customers), successor is Revenue Cloud
  Advanced in the Agentforce Revenue Management suite (formerly Revenue Lifecycle Management);
  new Agentforce Builder (in Agentforce Studio) with Agent Script and hybrid reasoning on the Atlas
  Reasoning Engine; "topics" are increasingly called "subagents". Verify OmniStudio naming
  (DataRaptor vs Data Mapper in standard designers) and Connected Apps vs External Client Apps before stating.
- When you mention an old name, say "X (formerly Y)".
- Governor limits commonly asked (verify if you cite others): SOQL 100 sync / 200 async; DML statements 150;
  rows retrieved by SOQL 50,000; DML rows 10,000; CPU 10 s sync / 60 s async; heap 6 MB sync / 12 MB async;
  callouts 100 per transaction; future calls 50 per transaction; Queueable jobs added via System.enqueueJob 50
  per sync transaction (1 from an executing Queueable); batch scope default 200, max 2,000; 5 concurrent batch
  jobs (Apex flex queue holds up to 100).

## Originality
- You may search the web to learn WHICH questions are commonly asked, but write every answer yourself.
  Do not copy sentences from blogs, LinkedIn posts or Trailhead. No URLs in answers.

## Finish
1. Run: node /home/claude/work-copilot/kb/tools/validate.js <your file>  — fix until it prints OK.
2. Reply with: number of entries, level split, and a short list of any facts you were NOT able to verify.
Do not edit any other file.

## Style (v2 — what the user asked for)
- Sound like a person explaining to a colleague, not a textbook. Short sentences, plain words, no
  marketing language ("robust", "seamless", "leverage", "empower").
- EVERY answer includes a small concrete example or mini-scenario ("Say a customer emails about a broken
  laptop: the case comes in through Email-to-Case, gets assigned to the Tier 1 queue…"). Use realistic but
  generic businesses (a laptop seller, a clinic, a manufacturer) — never claim a real client.
- Lead with the direct answer in the first sentence, then the example, then the one or two things an
  interviewer wants to hear (trade-off, best practice, gotcha).
- Scenario questions get the most weight: "A client wants…", "A user complains…", "How would you design…",
  "What would you do if…". Answer them as steps you would actually take.
- "Lifecycle" questions (lead-to-cash, case lifecycle, patient/care lifecycle, quote-to-cash, site
  lifecycle) walk through the stages in order with the object/feature used at each stage.
