# TODOs (deferred from the 2026-10-19 gstack review)

- [P2] Hindi in Devanagari finds no code excerpts in big projects (`src/context.js` tokenize keeps only a–z/0–9). Whole-project mode is unaffected. Fix: transliterate, or extract English identifiers first.
- [P2] Deepgram key is read by the renderer. Mint short-lived tokens in the main process and keep both keys in Electron `safeStorage` instead of `.env`.
- [P2] Indexing runs on the main process. Measured 96 ms for 2,500 classes, so it is fine today; move it to a worker thread if orgs reach tens of thousands of files.
- [P2] Answer-quality eval with a real API key: ~20 labelled work/generic questions on the fixture project, checking the General:/Not in your files labels and that every class name in an answer exists in the index.
- [P3] Screenshot uses the primary display; let the user pick the screen the meeting is on.
- [P3] Transparent windows can't be resized by dragging on Windows; add a size toggle.
- [P3] Live test on Windows still needed: loopback audio capture, Ctrl+Alt+L hotkey, hide-from-screen-share.
