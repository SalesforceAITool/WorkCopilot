# Brief: project Q&A for the Amkor QTC project

The user (a Salesforce developer) works on this project. The live-answer app shows these answers when
an interviewer, manager or client asks about HIS project, and CPQ questions default to this project.
The code is at: /tmp/claude-0/-home-claude/49ab94e2-d36a-5f58-b6d2-09bd77a8dde2/scratchpad/qtc
(force-app/main/default/{classes,triggers,lwc,aura,flows}, plus CLAUDE.md, RULES.md, docs/).

## Output
ONE JSON array file at the path you are given, same schema as the Salesforce bank
(/home/claude/work-copilot/kb/src/_example.json; rules in /home/claude/work-copilot/kb/WRITER-BRIEF.md
for format only). Use the id prefix you are given ("qtc-<x>-NNN") and topic "QTC project — <your area>".

## Content rules (strict — read the code before writing about it)
- ONLY state what the files prove. Read each class/trigger/LWC/flow you write about. Name real class,
  trigger, method, object, field and LWC names exactly as in the code (e.g. AMT_QuoteLineTriggerHandler,
  SBQQ__QuoteLine__c).
- Never invent business impact, numbers, dates, client names beyond "Amkor" (the org prefix is AMT),
  team size, or the user's personal role. If WHY something was done is not visible in code/comments,
  describe WHAT it does and HOW. Use code comments, names and RULES.md/CLAUDE.md as evidence.
- First person, spoken style: "In our QTC project, the quote line trigger…", "I worked on…" only in a
  generic sense (no claims of sole ownership). Simple English. Lead with the direct answer.
- Questions an interviewer/manager would ask about this work: what does X do, how does it work end to
  end, how data flows between objects, how CPQ (SBQQ) is extended, how triggers are structured, how
  you handle bulk/governor limits, error handling, how integration with SAP/external systems works,
  how it is tested, deployment/dev process, what you would improve (only from visible TODOs, comments,
  or obvious issues you can point to in code — say "one thing I'd improve…").
- "code": optional short excerpt (≤15 lines) COPIED from the files (no edits except trimming), with the
  file name in a comment on the first line.
- level/type: pick honestly; include scenario-style questions ("A user says the quote line price is
  wrong — how would you debug it in this project?") answered from the real code paths.
- alt: 2–4 other ways people would ask it, including generic CPQ phrasings that should lead to this
  project answer (e.g. "how did you customize CPQ quote lines?").

## Finish
1. node /home/claude/work-copilot/kb/tools/validate.js <your file> → must print OK.
2. Reply with: count, list of main classes/components covered, and anything you could not work out.
Do not edit any other file. Do not copy large blocks of code; this file is for spoken answers.
