# Changelog

## 1.7.1 — full answers when the question needs one
### Added
- Deep questions (data model, architecture, lifecycle, compare, design) get a full, structured answer like claude.ai: at least the Balanced model, up to ~1,800 tokens.
- **More detail ↗** on every answer asks again for the full version.

## 1.7.0 — practice interviews
### Added
- **Practice** tab: choose areas and experience level; scenario-heavy, most-asked questions from the booklet (70% your areas, 20% basics, 10% your project; seen questions come up less) or new ones from Claude; model answer, score and feedback; starred questions and history.

## 1.6.2 — answer modes, About me, hidden dropdowns
### Added
- **Answer mode** on the main screen: Smart (default: project question → booklet answer + Ask Claude; anything else → Claude only), Booklet + Claude, Booklet only, Claude only.
- Answers are fast, point-wise and in plain language, in a lead's voice (⚙ → My role).
- **About me**: resume and project documents (PDF, Word, .txt, .md) given to Claude and used for instant career answers.
- Lead-level and scenario content for Agentforce, CPQ, Sales/Service/Experience/Health Cloud and Field Service (booklet now 1,342 questions, project 272).
### Fixed
- Dropdown lists were visible in screen share; they are now drawn inside the protected overlay.

## 1.6.1 — Windows installer and self test
### Added
- Windows installer: Start menu and desktop shortcuts, settings in `%APPDATA%\Work Copilot`.
- **Work Copilot Self Test**: checks Claude, the bank, instant answers, the project and offline speech with a recorded question through the real meeting flow.
### Fixed
- "bad allocation" when loading the Parakeet model on low memory: falls back to Whisper base.

## 1.6.0 — 2026-10-20 — Salesforce Q&A bank + Amkor project Q&A
### Added
- **Q&A bank: 920 fact-checked Salesforce interview questions** (304 fresher, 369 mid, 247 senior; 228 scenario-based; 195 with code) across Apex, triggers, async/batch, SOQL, LWC, admin/security/Flow, integration, Sales/Service Cloud, Experience/Health Cloud/Field Service, CPQ/Revenue Cloud/OmniStudio, Data 360/Agentforce, architecture/DevOps. Current product names (Data 360, Experience Cloud, Agentforce…).
- **Amkor QTC project Q&A** written from the real repo (triggers, CPQ quote lines, price records/agreements, SAP integration and batches, LWCs, flows and tests), first person, real class names, no invented results.
- **Instant answers:** the closest stored answer shows in ~1 s, matched by meaning (local all-MiniLM-L6-v2 sentence model, ~23 MB, offline after first download); Claude's answer follows and is given the matches as reference.
- CPQ / quote-to-cash questions lead with the project answer.
- 📚 bank search panel; ⚙ → Answers (bank + Claude / bank only / Claude only); bank status line.
- ⚙ → **Build Q&A** per project folder: Claude reads the project once and writes Q&A from the code only.
- Study pages: `kb/docs/*.md`, `project-kb/docs/*.md`.

## 1.5.1 — 2026-10-20 — English only
- Meetings are always in English: transcription is locked to English (Deepgram uses monolingual Indian English, more accurate than its multilingual mode; offline Whisper is fixed to English). Hindi / Hinglish options removed; answers are always in English.
- Settings saved as "English + Hindi mix" or Hindi move to Indian English automatically.

## 1.5.0 — 2026-10-20 — better transcripts
### Added
- **Free offline: Parakeet v2 (new default) and Whisper turbo.** On noisy call-quality test recordings of Salesforce interview questions, word errors fell from 70% (old default) to ~30% (Parakeet) / ~27% (turbo). Existing installs move to Parakeet unless a model was picked by hand.
- **Deepgram upgrade:** vocabulary hints (Salesforce terms, words from the project's file names, Meeting Setup terms), *Indian English* option, and paste-your-key in ⚙ with a live key check (writes `.env` for you).
- Meeting Setup → **Names and terms that may come up**: used by Deepgram and given to Claude.
- Audio level bar in the Listen button; a warning after 20 s of silence with the "Also transcribe my mic" tip.
- Claude is told the question comes from speech recognition: it reads mis-heard words as meant, or says it didn't catch the question.
### Fixed
- Offline Whisper auto-detected the language per sentence and turned Indian English into Hindi; "English + Hindi mix" now runs as English offline.
- A pause of 0.6 s split a question into fragments that were transcribed separately; it now takes a 1 s pause.

## 1.4.0 — 2026-10-20
### Added
- **Answers through Claude Code with your own Claude plan (Pro/Max)** — no API key or extra payment. Now the default. Runs the official, unmodified `claude` CLI in headless mode with tools off; the app never touches the login and never passes an API key to it.
- One Claude Code process is started ahead of time so answers don't wait for its startup.
- ⚙ → Claude answers: Claude Code (my plan) / API key (pay per use).
- Clear messages for: API credit ran out, Claude Code not installed, not signed in, plan usage limit reached.
- start.bat no longer asks for keys; it tells you if Claude Code isn't installed.

## 1.3.0 — 2026-10-20
### Added
- **Free offline transcription**: Whisper (sherpa-onnx) + voice-activity detection on this PC, no Deepgram key needed; audio never leaves the machine. Default when no Deepgram key is set.
- One-time model download from GitHub with progress (Whisper base ≈200 MB or small ≈640 MB), unpacked with Windows' built-in tar (pure-JS fallback); only the files used are kept.
- ⚙ settings: Meeting transcription (Free offline / Deepgram), Offline model, Download now.
- Mic-only listening when Windows won't share system audio and "Also transcribe my mic" is on.
### Fixed during testing
- Detected sentences were trimmed at the ends (lost the last word); they are now padded from recent audio.

## 1.2.1 — 2026-10-20
- Move handle is now a clear four-arrow move button; collapse/expand use arrows-in / arrows-out icons.

## 1.2.0 — 2026-10-20

### Added
- Move the overlay anywhere with the ⠿ drag handle (the toolbar was almost all buttons, so there was little to grab).
- Maximize / restore (□ / ❐) on whichever screen the overlay is on.
- Minimize to the taskbar (—); `Ctrl+Alt+H` also brings a minimized overlay back.
- Collapse to just the toolbar (▴ / ▾); it expands by itself for a new answer, a warning, or when Setup/⚙ is opened.
- Bottom-right corner resize (Windows can't edge-resize see-through windows).
- Position, size and mode are remembered across restarts; an overlay left on an unplugged monitor comes back on screen.
- Tests: window placement maths (8 unit tests) and a real-app test driven with real OS mouse drags.

## 1.1.0 — 2026-10-19

Rebuilt and tested with the gstack workflow (eng review, independent outside-voice review, QA, ship).

### Added
- **Meeting Setup** before each meeting: answer speed (Fast / Balanced / Most accurate), scenario presets with example briefs, a free-text brief, answer style, answer language, and which project folders apply.
- **Start meeting** pre-loads the project into Claude's prompt cache; the cache is refreshed every 4 minutes while listening.
- Deepgram auto-reconnect (3 tries with backoff) and visible banners for every failure.
- Notes-only setups (no project folder needed).
- Test suite: 35 unit/integration tests plus a real-app end-to-end test.

### Fixed
- Flows, objects/fields and custom labels were never indexed (every `*-meta.xml` was skipped).
- On big orgs each question sent ~85k tokens (whole file list plus filler); now a folder summary plus the top relevant excerpts.
- A slower older question (e.g. with a screenshot) could finish after, and replace, a newer one.
- Generic answers could claim personal experience ("I built…"); "you"-phrased concept questions were treated as project questions.
- Retrieval excerpts sat in the cached prompt block, so the cache never hit.
- Auto-answer fired on the first half of a question with a pause; a second question during an answer was dropped.
- A failed Deepgram connection left screen and audio capture running.
- Stopped answers were left on "Reading your project…".
- UI: unreadable banner, Start button below the fold, squeezed question box.

### Changed
- Profiles, permission sets, layouts and translations are skipped by default.
- The model picker is replaced by the speed tiers.
- "Technical interview" preset replaced by "Mock interview / practice".

## 1.0.0 — 2026-10-19
- First version: overlay, live transcription, answers from the project folder, generic answers from Claude.
