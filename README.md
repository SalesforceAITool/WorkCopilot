# Work Copilot

A small always-on-top overlay for Windows. It listens to your meeting (Teams / Zoom / Meet),
catches questions, and shows you what to say:

- **Question about your work** → answered only from your project folder (Apex, LWC, Flows, objects, notes…), with the file names it used. If it isn't in your files it says **Not in your files** instead of making something up.
- **Generic question** (concepts, best practice, governor limits…) → answered from Claude's own knowledge, marked **General:**, plus an "In my project:" example only if your files really have one.
- **Instant answer from your Q&A bank** → 1,342 fact-checked Salesforce interview questions (fresher to 10 years: Apex, triggers, batch/async, LWC, Flow, security, integration, Sales/Service/Experience/Health Cloud, Field Service, CPQ, Revenue Cloud, OmniStudio, Data 360, Agentforce, architecture, DevOps) plus Q&A about **your own Amkor QTC project**. The closest stored answer shows in about a second, with Claude's answer below it.

- **About me**: add your resume and project documents (PDF, Word, .txt, .md) so "tell me about yourself" and career questions are answered from your own words.
- **Practice interview** tab: pick areas (CPQ, Health Cloud, Agentforce, Service Cloud…) and your experience; it asks scenario questions, you answer, then you see the model answer and feedback.

## Install on Windows (easiest)

Run **Work Copilot Setup 1.7.1.exe**. It installs for your user only (no admin), and adds **Work Copilot** to the Start menu and the desktop, plus **Work Copilot Self Test** in the Start menu. Run the self test once: it checks Claude Code, the Q&A bank, instant answers, your project and offline speech (it plays a recorded question through the real meeting flow) and tells you how to fix anything that fails. Settings live in `%APPDATA%\Work Copilot`.

Build the installer yourself (from Linux, needs wine): `npm run build:win` → `dist/Work-Copilot-Setup-<version>.exe`.

You still need Claude Code signed in (steps 2–3 below).

## Setup from source (one time, ~10 minutes) — no API keys, nothing extra to pay

Answers come from **Claude Code signed in with your own Claude plan** (Pro or Max), and listening uses the **free offline Whisper** on your PC. Both run on your laptop.

1. Install **Node.js LTS** from nodejs.org (if you don't have it).
2. Install **Claude Code**: open **PowerShell** and run
   ```
   irm https://claude.ai/install.ps1 | iex
   ```
   (In CMD instead: `curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd`)
3. Open a **new** terminal, run `claude` once, and sign in with your Claude account (the one with your Max plan). Then type `/exit`.
4. Unzip this folder anywhere, e.g. `C:\Users\<you>\work-copilot`, and double-click **start.bat**.
5. In the app: ⚙ → **+ Add folder** → pick your Salesforce project (the folder that contains `force-app`).

Answers use your plan's normal usage limits, the same pool as your Claude chats and Claude Code. Choose **Fast** in Meeting Setup to use the least.

**How this stays within Anthropic's rules:** the app runs the official, unmodified Claude Code program, which signs in with your own subscription through Anthropic's own login. The app never reads or stores your login, and it is for your own use on your own laptop ([Anthropic: legal & compliance](https://code.claude.com/docs/en/legal-and-compliance)). If you share the app with someone, they must sign in to Claude Code with their own plan. The app also never passes an API key to Claude Code, so it can't bill API credit by mistake.

**Optional:** if you'd rather pay per use with an API key, put `ANTHROPIC_API_KEY` in `.env` and choose ⚙ → **Claude answers → API key**. For cloud transcription, add `DEEPGRAM_API_KEY` and choose ⚙ → **Meeting transcription → Deepgram**.

## Before each meeting: Meeting Setup

The app opens on **Meeting setup** (or click the setup pill in the toolbar, e.g. "Balanced · Technical…"):

| Setting | What it does |
|---|---|
| **How should answers come?** | **Fast** (Haiku, first words in ~1–2 s) · **Balanced** (Sonnet, default) · **Most accurate** (Opus, reads more of your code, slower) |
| **Scenario** | Client demo · Status update to manager · Technical / architecture discussion · Mock interview / practice · Sprint review · Custom. Each has an example brief. |
| **About this meeting** | Who's in it, the topic, which project, what to stress or avoid. Click **Use the example** to start from the scenario's example and edit it. |
| **Answer style** | Short talking points · Detailed explanation (with an example) · Word-for-word script |
| **Projects for this meeting** | Untick folders that don't matter today, so answers come from the right project |

Press **▶ Start meeting**: it saves the setup, pre-loads your project into Claude so the first answer is fast, and starts listening.

Example brief (Client demo):
> Demo of the Field Service work-order file upload to the client team. Audience is business users, not developers. Explain in business terms (what technicians can do now, time saved). Avoid code details unless asked. Do not promise dates.

## During the meeting

| Action | Button / hotkey |
|---|---|
| Start / stop listening | **Listen** · `Ctrl+Alt+L` |
| Answer the latest question now | **Answer** · `Ctrl+Alt+A` |
| Answer using a screenshot of your screen (code or a record being discussed) | **Screenshot** · `Ctrl+Alt+S` |
| Hide / show the overlay | `Ctrl+Alt+H` |
| Type a question yourself | the box in the toolbar, Enter (Esc stops the answer) |
| Older answers | ‹ › on the answer card |

With **Auto-answer** on (default), anything that sounds like a question ("how did you…", "why did you…", "kya…", "kaise…") is answered once the speaker finishes. If a second question comes while an answer is still fresh, it is answered right after. If transcription drops, it reconnects by itself (up to 3 tries).

## Moving and sizing the overlay

| Want to… | Do this |
|---|---|
| Move it anywhere (any monitor) | Hold and drag the **four-arrow move button** at the left of the toolbar |
| Make it bigger or smaller | Drag the **bottom-right corner** |
| Fill the screen it's on | **□** (click **❐** to go back to the exact previous size and spot) |
| Shrink it to just the toolbar | The **arrows-in** button — it opens again by itself when a new answer starts or something needs your attention; the **arrows-out** button opens it yourself |
| Send it to the taskbar | **—** · bring it back from the taskbar or with `Ctrl+Alt+H` |
| Hide it completely | `Ctrl+Alt+H` (press again to show) |

It reopens where you left it, at the same size and mode. If that spot is on a monitor that's no longer connected, it comes back to the top of your main screen.

## Getting the transcript right

Two ways to listen. Pick in ⚙ → **Meeting transcription**.

| | **Deepgram** (recommended) | **Free offline** |
|---|---|---|
| Accuracy | Best; tuned for Indian English | Good with Parakeet (default) or Whisper turbo |
| Cost | New accounts get **$200 free credit** (~$0.0077/min, so hundreds of meeting hours) | Free |
| Privacy | Audio goes to Deepgram | Audio never leaves your PC |
| Setup | ⚙ → paste key → **Use Deepgram** | First Listen downloads the model once (~460 MB) |

**Deepgram setup:** sign up at console.deepgram.com → **API Keys** → create a key → paste it in ⚙ → **Use Deepgram**. The app checks the key and switches over. Deepgram is told to expect Salesforce terms (Queueable, SOQL, OmniStudio, FlexCard…), words from your project's file names, and the **Names and terms** you type in Meeting Setup.

**Free offline models** (⚙ → Offline model). Measured on noisy call-quality recordings of Salesforce interview questions in four accents:

| Model | Word errors | Notes |
|---|---|---|
| **Parakeet v2** (default) | ~30% on robotic test voices, much lower on real voices | Fast; English only |
| Whisper turbo | ~27% | Slower; needs a faster PC |
| Whisper base (old default) | 62–70% | Small download only |

**Tips that make the biggest difference:**
- **Meeting audio language:** English only. *Indian English* (default) or *US / UK English*. Both engines are locked to English, which is more accurate than letting them guess the language. Answers are always in English.
- **Type the names that will come up** (client, product, class or ticket names) in Meeting Setup → *Names and terms*.
- **Testing by speaking yourself?** Turn on ⚙ → *Also transcribe my mic*. Normally only the other people in the meeting are heard. The green bar in the Listen button shows when audio is being heard, and the app warns after 20 seconds of silence.
- A wired headset, or the meeting app's noise suppression, helps any engine.
- Claude is told the question comes from speech recognition and to read mis-heard words as meant (e.g. "cubeable" → Queueable). If a question is too garbled, the answer starts with **Didn't catch that clearly** and gives its best guess.

If you had no system audio (e.g. an in-person meeting), tick **Also transcribe my mic** and it will listen through the microphone.

## Q&A bank (instant answers)

When a question is heard, the app looks it up in the bank first. If a stored answer clearly matches (by meaning, not just words) it shows at once under **⚡**, with key points, a folded **Code** section, and **Also close:** links to similar questions. Claude's answer then appears below it, and Claude is given the matching stored answers so it doesn't contradict them.

- **CPQ / quote-to-cash questions lead with your project.** Project answers are marked **Your project** and go first when they are reasonably close; the generic CPQ answer stays in *Also close*. Questions about CPQ in general still get Claude's general answer below.
- **📚** in the toolbar: search and read the whole bank (good for practice before an interview). Readable study pages are in `kb/docs/` and the Amkor project pages in `project-kb/docs/`.
- **Answer mode** (on the main screen, next to Listen):
  - *Smart* (default): a question about your project shows the booklet answer only (with **Ask Claude** if you want more); anything else goes straight to Claude.
  - *Booklet + Claude*, *Booklet only* (Claude only when nothing matches — saves plan usage), *Claude only*.
- **Answers are short and point-wise** for normal questions, written the way an interviewer wants to hear them, in the voice of your role (⚙ → **My role**, default *Salesforce Technical Lead*).
- **Deep questions get full answers** (data model, architecture, lifecycle, comparisons, design): longer, structured like a claude.ai answer. On any answer, **More detail ↗** asks again for the full version.
- First start downloads a small sentence model (~23 MB) once and prepares the bank (~30 s; the status line in ⚙ shows progress). After that it starts instantly and works offline.
- **Build Q&A** next to a project folder in ⚙: Claude reads that project once (a few minutes, uses your Claude plan) and writes Q&A about it from the code only. The Amkor QTC Q&A is already included — no need to build it.
- Add your own questions: put a JSON file in `project-kb/` (same format as `kb/src/_example.json`) and restart.

## About me (resume and project documents)

⚙ → **About me** → *Add resume…* / *+ Project documents…*. Files are turned into text once and kept next to your settings (a new resume replaces the old one). Claude gets them with every question, so "tell me about yourself", "what did you do at your last company" or "explain your project's business process" come from your own documents, and the resume also gives instant answers. Scanned PDFs have no text: save them as Word first.

## Practice interview

Open the **Practice** tab, tick the areas (Salesforce basics, CPQ / Revenue Cloud, Health Cloud, Agentforce, Service Cloud incl. Field Service / Omni-Channel / Voice, Sales Cloud, Experience Cloud, OmniStudio, Integration, Lead & architecture, My project, My resume), choose your experience (e.g. 5–7 years) and how many questions. Questions are mostly scenario-based and the most commonly asked, picked from the booklet (questions you have already seen come up less); under **Questions from** you can also mix in new ones from Claude or have Claude write all of them. Type or say your answer, then reveal the model answer, get a score and what was missing, and ★ questions to revise later. History is saved in `practice.json` next to your settings.

## Projects & options (⚙)

- **Dropdowns are hidden from screen share too**: Windows draws normal dropdown lists in a separate window that screen share can see, so the app draws its own lists inside the overlay.

- **Hide from screen share** (on by default): you see the overlay, but people watching your shared screen or a recording don't — like presenter notes. Windows 10 (2004) or 11.
- **Also transcribe my mic**: off by default, so it only listens to the other people.
- **Meeting audio language**: Indian English (default) or US / UK English.
- The stats line shows how many files are indexed, whether the whole project is sent, and how many files were skipped for being over 200 KB.

## Make answers much better: add a notes file

Code shows *what* you built, not *why* or the business result. Copy `MY_WORK_TEMPLATE.md`, fill it in for each project, and add its full path to `config.json` under `"notesFiles"`:

```json
"notesFiles": ["C:\\Users\\you\\Documents\\MY_WORK.md"]
```

The copilot treats this file as the most reliable source. Notes work even without a project folder.

## What gets read from your project

- Indexed: Apex classes and triggers, LWC/Aura, Visualforce, Flows, objects and fields, custom labels, custom metadata, flexipages, email templates, JSON/YAML/Markdown.
- Skipped: `node_modules`, `.sfdx`, `.sf`, `.git`, `staticresources`, `profiles`, `permissionsets`, `layouts`, `translations` (they mention every field and drown out real code), companion `*.cls-meta.xml`-style files, and files over 200 KB.
- Small projects (up to ~50k tokens) are sent whole and cached. Bigger ones send the file list plus the best-matching excerpts for each question.

Check what it would pick for a question (no API call):

```
npm run test-index -- "C:\path\to\project" "why did you use a queueable here"
```

## Your data

Your project files and the meeting audio go to Anthropic (answers) and Deepgram (transcription). For client code, check that your contract and the client allow that, and tell people when a meeting is being transcribed where that's required.

## Tests (for developers)

```
npm test           # unit/integration tests: indexer, Claude call (local fake API), Q&A bank, practice, About me, self test, UI (jsdom)
npm run build:win  # Windows installer (Linux + wine)
node kb/tools/validate.js kb/src/*.json project-kb/*.json && node kb/tools/build.js   # check + rebuild the bank
COPILOT_TEXT_MODEL_DIR=<folder with Xenova/all-MiniLM-L6-v2> npm run test:e2e:bank  # real app + real sentence model
npm run test:e2e   # launches the real app against a local fake API (Linux: xvfb-run -a npm run test:e2e)
```

## Troubleshooting

- **Listen does nothing / banner says Deepgram**: check `DEEPGRAM_API_KEY` in `.env`, or switch ⚙ → Meeting transcription to *Free offline*. Make sure meeting audio plays through your normal Windows output.
- **"Claude Code is not signed in"**: open a terminal, run `claude`, sign in with your Claude account, then try again.
- **"Claude Code is not installed"**: run the install command from Setup step 2, then open a *new* terminal so `claude` is found. If it still isn't, set its full path in `config.json` → `claudeCodePath` (for example `C:\\Users\\you\\.local\\bin\\claude.exe`).
- **"usage limit is reached"**: your plan's limit resets after a few hours.
- **"bad allocation" when listening starts**: not enough free memory for the big speech model. The app falls back to Whisper base automatically when it is downloaded; close other heavy apps or pick *Whisper base* in ⚙.
- **Free offline won't start**: install the Microsoft Visual C++ Redistributable (x64) from microsoft.com — the speech engine needs it — then try again.
- **Banner says a hotkey is taken**: another app owns it — change it in `config.json` → `hotkeys` and restart.
- **After you change code in your project**: ⚙ → **Re-index**.
