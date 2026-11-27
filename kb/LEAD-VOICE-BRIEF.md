# Lead-voice pass

The user works as a Salesforce LEAD and is interviewing for lead roles (Technical Lead, CPQ Lead,
Agentforce Lead). Every answer must sound like a lead said it, not a developer reciting docs.
The answers are already accurate and conversational with an example — keep that.

For each entry, edit ONLY "a" (and "points" lightly if useful):
- Open decisively with the answer/decision ("I'd go with X here, because…", "My rule on the team is…").
- Keep the existing example and EVERY existing fact, number, name, caveat and code reference.
- Add the lead angle in 1–2 sentences where it fits naturally: the trade-off you weigh, the
  standard/guardrail you set for the team, what you check in code review, the risk you plan for,
  or how you'd explain it to a stakeholder. Vary it — don't repeat the same stock phrase
  ("As a lead…") in every answer; many answers need only a light touch.
- Fresher-level definition questions: still answer simply first; add at most one short lead line.
- Never invent specific past events, team sizes, clients, metrics or results ("on my last project we cut
  load time by 40%" is NOT allowed). Generic practice ("on my teams I insist on…") is fine.
- 50–220 words. Spoken style. No marketing words.

Then run: node /home/claude/work-copilot/kb/tools/validate.js <your files> — must print OK.
Edit only your files. Report: how many changed, and any entry where you were unsure.

## Extra rules for PROJECT files (project-kb/parts/qtc-*.json — Amkor QTC)
- He is a lead on this project. Use "we / our team / in QTC we…" for what the code does, and "I" for
  lead activities in general terms (how I review changes to the pricing triggers, what I'd prioritise
  fixing, how I'd explain the design to the client). Do NOT claim he personally designed or wrote a
  specific class or decided a specific design unless the answer already says so.
- Turn "In the code I have, I don't see X" phrasing into confident, honest statements: "In QTC we don't
  use CPQ price rules for this — pricing lives on our AMT_Price_Record__c object…".
- "What I'd improve" answers: frame as the lead's prioritised plan (risk first, then effort).
- Keep every class/field/flow name and code excerpt exactly as is.
