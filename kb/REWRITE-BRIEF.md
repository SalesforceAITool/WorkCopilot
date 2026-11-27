# Rewrite brief: make existing answers human, with an example

The user wants every answer in the bank to sound like a person explaining to a colleague, with a
concrete example, instead of textbook language. These answers were already fact-checked, so the
facts must survive the rewrite exactly.

For each entry in the file(s) you are given:
- Rewrite ONLY "a" (and lightly "points" if they read bookish). Do not change id, topic, level, type,
  q, alt, code or tags.
- Keep every fact: every number, limit, product/feature/object/field name, version, retirement date,
  "formerly" note, caveat and trade-off must still be there and still be correct. Do not add new
  technical claims; if you add an example it must only illustrate facts already in the answer.
- Lead with the direct answer, then a small concrete example ("Say a sales rep converts a lead…",
  "For example, if a batch processes 50,000 order records…"), then the gotcha/best practice.
- Plain words, short sentences, first person where natural ("I'd…", "What I usually do is…").
  No marketing words ("robust", "seamless", "leverage", "empower", "streamline"). No real client names.
- 50–190 words. Spoken style — it will be read out in a live interview.
- If an answer is already human and has a good example, leave it as is.

Work on a copy in memory and write the file back as a JSON array (2-space indent is fine).
Then run: node /home/claude/work-copilot/kb/tools/validate.js <file> — must print OK.
Edit only the files you are given.
