const {
  app, BrowserWindow, globalShortcut, ipcMain, dialog, desktopCapturer, session, screen
} = require('electron');
const fs = require('fs');
const path = require('path');
const { ProjectIndex } = require('./context');
const { ClaudeAnswerer } = require('./claude');
const { ClaudeCodeAnswerer, findClaude } = require('./claude-code');
const presets = require('./presets');
const geo = require('./window-geometry');
const localStt = require('./local-stt');
const deepgram = require('./deepgram');
const { BankService, routeAnswer, answerDepth, fullAnswerMeeting, FULL_ANSWER_NOTE } = require('./bank-service');
const { buildProjectQA, buildDocQA, slug } = require('./project-qa');
const selfTest = require('./self-test');
const { DocumentStore, SUPPORTED: DOC_TYPES } = require('./documents');
const practice = require('./practice');

const ROOT = path.join(__dirname, '..');
// Installed app (Start menu): the program folder is read-only, so settings, keys and the user's own
// project Q&A live in %APPDATA%\Work Copilot. Run from source (start.bat): next to the code, as before.
const DATA = app.isPackaged ? app.getPath('userData') : ROOT;
// COPILOT_CONFIG lets you keep separate setups (and lets the QA run use a throwaway one).
const CONFIG_PATH = process.env.COPILOT_CONFIG || path.join(DATA, 'config.json');
const ENV_PATH = process.env.COPILOT_ENV || path.join(DATA, '.env');
const SELF_TEST = process.argv.includes('--self-test');
if (process.platform === 'win32') app.setAppUserModelId('com.workcopilot.app');

// ---------- config ----------
function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const DEFAULTS = {
  yourName: 'Akshay',
  yourRole: 'Salesforce Technical Lead',   // answers are written in this role's voice
  projectFolders: [],
  notesFiles: [],
  autoAnswer: true,
  includeMic: false,
  transcriptLanguage: 'en-IN',   // English only: 'en-IN' (Indian English) or 'en'
  hideFromScreenShare: true,
  answerEngine: 'claude-code', // 'claude-code' (your Claude Pro/Max plan, default) | 'api' (API key, pay per use)
  claudeCodePath: '',       // empty = find claude automatically
  answerSource: 'smart',   // 'smart' = project question → booklet, otherwise Claude · 'both' · 'bank' · 'claude'
  transcriber: '',          // 'local' (free, offline) | 'deepgram'; empty = Deepgram if a key is set, else local
  localModel: localStt.DEFAULT_MODEL,
  modelDir: '',             // empty = the app's data folder
  meeting: presets.DEFAULT_MEETING,
  hotkeys: {
    answer: 'CommandOrControl+Alt+A',
    screenshot: 'CommandOrControl+Alt+S',
    listen: 'CommandOrControl+Alt+L',
    toggleWindow: 'CommandOrControl+Alt+H'
  }
};

function loadConfig() {
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch {}
  // v1 configs used "language" for the transcription language.
  if (cfg.language && !cfg.transcriptLanguage) cfg.transcriptLanguage = cfg.language;
  // English only: older versions defaulted to "English + Hindi mix".
  if (cfg.transcriptLanguage !== 'en' && cfg.transcriptLanguage !== 'en-IN') cfg.transcriptLanguage = 'en-IN';
  // v1.3/1.4 defaulted to Whisper base, which mishears a lot: move to the better default
  // unless the user picked a model themselves.
  if (!cfg.localModelChosen && (cfg.localModel === 'base' || cfg.localModel === 'small')) cfg.localModel = localStt.DEFAULT_MODEL;
  // 1.6.2: "Smart" (project → booklet, other → Claude) is the new default unless the user picked a mode.
  if (!cfg.answerSourceChosen) delete cfg.answerSource;
  delete cfg.language;
  delete cfg.model; // v1 model picker: the Meeting Setup speed now chooses the model
  return {
    ...DEFAULTS, ...cfg,
    meeting: presets.resolveMeeting(cfg.meeting),
    hotkeys: { ...DEFAULTS.hotkeys, ...(cfg.hotkeys || {}) }
  };
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

loadEnv();
let config = loadConfig();
let index = null;
let indexStats = null;
let answerer = null;
let win = null;

// Only the folders picked for this meeting (all folders when none are picked).
function activeFolders() {
  const picked = (config.meeting.folders || []).filter(f => config.projectFolders.includes(f));
  return picked.length ? picked : config.projectFolders;
}

// Resume and project documents (as text), kept with the settings.
const docStore = new DocumentStore(process.env.COPILOT_DOCS || path.join(DATA, 'about-me'));
function rebuildIndex() {
  index = new ProjectIndex({ ...config, projectFolders: activeFolders(), aboutMe: docStore.list() });
  indexStats = index.build();
  return indexStats;
}

function answerEngine() {
  // Default: Claude Code with the user's own Claude plan (nothing extra to pay).
  return config.answerEngine === 'api' ? 'api' : 'claude-code';
}

let answererEngine = null;
function getAnswerer() {
  const engine = answerEngine();
  if (answerer && answererEngine !== engine) { if (answerer.dispose) answerer.dispose(); else answerer.cancel(); answerer = null; }
  if (!answerer) {
    if (engine === 'claude-code') {
      answerer = new ClaudeCodeAnswerer({ name: config.yourName, role: config.yourRole, claudePath: config.claudeCodePath });
    } else {
      if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY missing in .env (or switch ⚙ → Claude answers to "Claude Code").');
      answerer = new ClaudeAnswerer({ apiKey: process.env.ANTHROPIC_API_KEY, name: config.yourName, role: config.yourRole });
    }
    answererEngine = engine;
  }
  return answerer;
}

// The API's billing and auth errors arrive as raw JSON; say what to do instead.
function friendlyApiError(err) {
  const msg = (err && err.message) || String(err);
  if (/credit balance is too low/i.test(msg)) {
    return 'Your Claude API credit has run out. Add credit at console.anthropic.com → Plans & Billing, or switch ⚙ → Claude answers to "Claude Code (my Claude plan)".';
  }
  if (/invalid x-api-key|authentication_error/i.test(msg)) return 'The Claude API key in .env is not valid. Create a new key at console.anthropic.com.';
  return msg;
}

function activeModel() {
  return localStt.MODELS[config.localModel] ? config.localModel : localStt.DEFAULT_MODEL;
}

function modelDir() {
  return config.modelDir || path.join(app.getPath('userData'), 'models');
}
function effectiveTranscriber() {
  if (config.transcriber === 'local' || config.transcriber === 'deepgram') return config.transcriber;
  return process.env.DEEPGRAM_API_KEY ? 'deepgram' : 'local';
}

function state() {
  const model = activeModel();
  return {
    transcriber: effectiveTranscriber(),
    localModels: Object.fromEntries(Object.entries(localStt.MODELS).map(([k, m]) => [k, m.label])),
    modelInstalled: localStt.isInstalled(modelDir(), model),
    config,
    stats: indexStats,
    activeFolders: activeFolders(),
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    answerEngine: answerEngine(),
    claudeCodeFound: !!findClaude(config.claudeCodePath),
    canAnswer: answerEngine() === 'claude-code' || !!process.env.ANTHROPIC_API_KEY,
    deepgramKey: process.env.DEEPGRAM_API_KEY || '',
    bank: bankService ? bankService.status : { state: 'off', entries: 0, sources: [] },
    aboutMe: docStore.summary()
  };
}

// ---------- Q&A bank ----------
// Built-in project Q&A ships with the app; "Build Q&A" writes the user's own next to their settings.
const PROJECT_KB_DIR = process.env.COPILOT_PROJECT_KB || path.join(DATA, 'project-kb');
const PROJECT_KB_DIRS = [...new Set([PROJECT_KB_DIR, path.join(ROOT, 'project-kb')])]; // user's first: a rebuilt file wins
let bankService = null;
function startBank() {
  bankService = new BankService({
    bankFile: path.join(ROOT, 'kb', 'salesforce-qa.json'),
    projectDir: process.env.COPILOT_PROJECT_KB ? PROJECT_KB_DIR : PROJECT_KB_DIRS,
    modelCacheDir: path.join(app.getPath('userData'), 'models', 'text'),
    vectorCacheFile: path.join(app.getPath('userData'), 'qa-vectors.bin'),
    localModelPath: process.env.COPILOT_TEXT_MODEL_DIR || undefined, // tests: model files already on disk
    onStatus: (st) => { if (win && !win.isDestroyed()) win.webContents.send('bank:status', st); }
  });
  bankService.load();
}

function contextFor(question) {
  if (!indexStats || (!indexStats.files && !indexStats.notes && !indexStats.resume && !indexStats.docs)) {
    // No folder yet: generic questions still work; work questions say "Not in your files".
    return { text: '(No project folder added yet — there are no project files.)', excerpts: '', mode: 'none', sources: [] };
  }
  const speed = presets.SPEED[config.meeting.speed];
  return index.contextFor(question, { retrievalChars: speed.retrievalChars });
}

// ---------- window ----------
// ---------- window placement: move, maximize, collapse, resize, remember ----------
// mode: 'normal' | 'maximized' | 'compact'. normalBounds is the size/position to return to.
let winMode = 'normal';
let normalBounds = null;
let saveTimer = null;

function displays() { return screen.getAllDisplays(); }

function saveWindowState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    config.window = { bounds: normalBounds, mode: winMode };
    try { saveConfig(config); } catch {}
  }, 400);
}

function applyMode(mode, bounds) {
  winMode = mode;
  win.setBounds(bounds);
  if (!win.isDestroyed()) win.webContents.send('win:state', { mode });
  saveWindowState();
}

function toggleMaximize() {
  if (winMode === 'maximized') return applyMode('normal', normalBounds);
  if (winMode === 'normal') normalBounds = win.getBounds();
  applyMode('maximized', geo.maximizedBounds(win.getBounds(), displays()));
}

function toggleCompact() {
  if (winMode === 'compact') return expand();
  const at = win.getBounds();
  if (winMode === 'normal') normalBounds = at;
  applyMode('compact', geo.compactBounds(normalBounds, winMode === 'maximized' ? normalBounds : at));
}

function expand() {
  if (winMode !== 'compact') return;
  const at = win.getBounds();
  applyMode('normal', geo.fitToDisplays({ ...normalBounds, x: at.x, y: at.y }, displays(), screen.getPrimaryDisplay()));
}

function createWindow() {
  const saved = config.window || {};
  normalBounds = geo.fitToDisplays(saved.bounds, displays(), screen.getPrimaryDisplay());
  win = new BrowserWindow({
    ...normalBounds,
    title: 'Work Copilot',
    icon: path.join(ROOT, 'assets', 'icon.png'),
    minWidth: geo.MIN_SIZE.width,
    minHeight: geo.COMPACT_HEIGHT,
    frame: false,
    transparent: true,
    resizable: true,
    // Windows can't maximize or edge-resize see-through windows natively: the app does both itself.
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true);
  // Windows 10 (2004+) / 11: you see the overlay; screen share and recordings don't.
  win.setContentProtection(!!config.hideFromScreenShare);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Remember where the user drags it (and its size in normal mode).
  const track = () => {
    if (win.isDestroyed() || win.isMinimized()) return;
    const b = win.getBounds();
    if (winMode === 'normal') normalBounds = b;
    else if (winMode === 'compact') normalBounds = { ...normalBounds, x: b.x, y: b.y };
    else return;
    saveWindowState();
  };
  // 'move'/'resize' fire on every platform ('moved'/'resized' are Windows/macOS only); saving is debounced.
  win.on('move', track);
  win.on('resize', track);
  win.webContents.once('did-finish-load', () => {
    if (SELF_TEST) win.webContents.send('selftest:open');
    if (saved.mode === 'maximized') toggleMaximize();
    else if (saved.mode === 'compact') toggleCompact();
    else win.webContents.send('win:state', { mode: winMode });
  });
  // Monitor unplugged or resolution changed: pull the overlay back onto a screen.
  const refit = () => {
    if (win.isDestroyed()) return;
    if (winMode === 'maximized') return applyMode('maximized', geo.maximizedBounds(win.getBounds(), displays()));
    normalBounds = geo.fitToDisplays(normalBounds, displays(), screen.getPrimaryDisplay());
    const at = geo.fitToDisplays(win.getBounds(), displays(), screen.getPrimaryDisplay());
    win.setBounds(winMode === 'compact' ? geo.compactBounds(normalBounds, at) : normalBounds);
  };
  screen.on('display-removed', refit);
  screen.on('display-metrics-changed', refit);
}

// System audio (what other people in the meeting say) via loopback capture.
function setupAudioCapture() {
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then(sources => {
      if (!sources.length) return callback({});
      callback({ video: sources[0], audio: 'loopback' });
    }).catch(() => callback({}));
  });
}

async function captureScreenshot() {
  const { width, height } = screen.getPrimaryDisplay().size;
  const scale = Math.min(1, 1600 / width);
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: Math.round(width * scale), height: Math.round(height * scale) }
  });
  if (!sources.length) throw new Error('Could not capture the screen.');
  return sources[0].thumbnail.toPNG().toString('base64');
}

function registerHotkeys() {
  globalShortcut.unregisterAll();
  const hk = config.hotkeys;
  const send = (name) => () => win && !win.isDestroyed() && win.webContents.send('hotkey', name);
  const failed = [];
  const reg = (acc, fn) => {
    if (!acc) return;
    try { if (!globalShortcut.register(acc, fn)) failed.push(acc); } catch { failed.push(acc); }
  };
  reg(hk.answer, send('answer'));
  reg(hk.screenshot, send('screenshot'));
  // Run with a user gesture: Chromium may refuse screen/audio capture without one.
  reg(hk.listen, () => win && !win.isDestroyed() &&
    win.webContents.executeJavaScript('toggleListening()', true).catch(() => {}));
  reg(hk.toggleWindow, () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    else if (win.isVisible()) win.hide();
    else win.showInactive();
  });
  return failed;
}

// ---------- IPC ----------
ipcMain.handle('get-state', () => state());

ipcMain.handle('get-presets', () => ({
  speed: presets.SPEED, style: presets.STYLE, language: presets.LANGUAGE, scenarios: presets.SCENARIOS
}));

ipcMain.handle('add-folder', async () => {
  const res = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'multiSelections'] });
  if (!res.canceled) {
    config.projectFolders = [...new Set([...config.projectFolders, ...res.filePaths])];
    saveConfig(config);
    rebuildIndex();
  }
  return state();
});

ipcMain.handle('remove-folder', (e, folder) => {
  config.projectFolders = config.projectFolders.filter(f => f !== folder);
  config.meeting.folders = config.meeting.folders.filter(f => f !== folder);
  saveConfig(config);
  rebuildIndex();
  return state();
});

ipcMain.handle('reindex', () => { rebuildIndex(); return state(); });

const OPTION_KEYS = ['autoAnswer', 'includeMic', 'hideFromScreenShare', 'transcriptLanguage', 'transcriber', 'localModel', 'answerEngine', 'answerSource', 'yourRole'];
ipcMain.handle('set-option', (e, key, value) => {
  if (!OPTION_KEYS.includes(key)) return state();
  if (key === 'answerSource') config.answerSourceChosen = true;
  config[key] = key === 'yourRole' ? String(value || '').trim().slice(0, 80) || DEFAULTS.yourRole : value;
  // the role is part of the answer instructions: start a fresh Claude process with the new ones
  if (key === 'yourRole' && answerer) { if (answerer.dispose) answerer.dispose(); else answerer.cancel(); answerer = null; }
  if (key === 'localModel') config.localModelChosen = true;
  saveConfig(config);
  if (key === 'hideFromScreenShare' && win) win.setContentProtection(!!value);
  return state();
});

ipcMain.handle('set-meeting', (e, meeting) => {
  const foldersChanged = JSON.stringify(meeting.folders || []) !== JSON.stringify(config.meeting.folders);
  config.meeting = presets.resolveMeeting({ ...config.meeting, ...meeting });
  saveConfig(config);
  if (foldersChanged) rebuildIndex();
  return state();
});

// Pre-loads the whole-project prompt cache so the first question in a meeting is fast.
ipcMain.handle('warm', async () => {
  try {
    if (answerEngine() === 'claude-code') { await getAnswerer().warm(null, config.meeting); return { warmed: true }; }
    const ctx = contextFor('');
    if (ctx.mode !== 'full' || !process.env.ANTHROPIC_API_KEY) return { warmed: false };
    await getAnswerer().warm(ctx.text, config.meeting);
    return { warmed: true };
  } catch (err) {
    return { warmed: false, error: err.message };
  }
});

let latestAskId = 0;
ipcMain.handle('ask', async (e, { id, question, transcript, withScreenshot, forceClaude, depth: depthAsked }) => {
  const wc = e.sender;
  const send = (ch, data) => { if (!wc.isDestroyed()) wc.send(ch, data); };
  // Newest question wins: stop the previous answer now, before any slow step (screenshot),
  // so an older question can never finish after a newer one.
  latestAskId = id;
  if (answerer) answerer.cancel();
  try {
    // The Q&A bank is checked first (a few milliseconds); the answer mode decides what happens next.
    const source = forceClaude ? 'claude' : (config.answerSource || 'smart');
    let found = { matches: [], show: false };
    // Screenshot asks are usually about what is on screen, not the last thing said: no bank lookup.
    // Claude still gets the closest booklet answers as reference (also for "Ask Claude").
    if (question && !withScreenshot) {
      try { found = await bankService.find(question); } catch { /* bank problems never block Claude */ }
      if (id !== latestAskId) { send('answer:cancelled', { id }); return; }
    }
    const route = routeAnswer({ source, found, withScreenshot });
    if (route.showBank) send('answer:bank', { id, matches: found.matches });
    if (!route.useClaude) {
      send('answer:done', { id, bankOnly: true });
      return;
    }
    const ctx = contextFor(`${question || ''}\n${(transcript || '').slice(-1500)}`);
    const shot = withScreenshot ? await captureScreenshot() : null;
    if (id !== latestAskId) { send('answer:cancelled', { id }); return; }
    // Data-model / architecture / process / comparison questions (or "More detail") get a full,
    // structured answer from a stronger model; everything else stays quick.
    const depth = answerDepth(question, depthAsked);
    const meeting = depth === 'full' ? fullAnswerMeeting(config.meeting) : config.meeting;
    send('answer:meta', { id, mode: ctx.mode, sourceCount: ctx.sources.length, speed: meeting.speed, depth });
    const reference = BankService.reference(found.matches, { semantic: found.semantic });
    const result = await getAnswerer().answer({
      question: depth === 'full' && question ? `${question}\n\n(${FULL_ANSWER_NOTE})` : question,
      transcript,
      context: ctx.text,
      excerpts: [ctx.excerpts, reference].filter(Boolean).join('\n\n'),
      screenshotBase64: shot,
      meeting,
      onDelta: (d) => send('answer:delta', { id, delta: d })
    });
    send('answer:done', { id, usage: result.usage, model: result.model });
  } catch (err) {
    if (err && err.cancelled) send('answer:cancelled', { id });
    else send('answer:error', { id, message: friendlyApiError(err) });
  }
});

ipcMain.handle('cancel', () => { if (answerer) answerer.cancel(); });

// Typed search in the Q&A bank panel: always returns the closest entries.
ipcMain.handle('bank:search', async (e, q) => {
  if (!bankService) return { matches: [] };
  const r = await bankService.find(q, { limit: 15 });
  return { matches: r.matches, semantic: r.semantic };
});
ipcMain.handle('bank:reload', async () => { await bankService.load(); return state(); });

// "Build project Q&A": Claude reads the project once and writes project-kb/<name>.json,
// so questions about this project get instant answers too. Runs on the chosen Claude engine.
let buildingQA = null;
ipcMain.handle('project:build-qa', async (e, folder) => {
  const wc = e.sender;
  const send = (data) => { if (!wc.isDestroyed()) wc.send('project:progress', data); };
  if (buildingQA) return { ...state(), buildResult: 'Already building — please wait.' };
  if (!config.projectFolders.includes(folder)) return { ...state(), buildResult: 'Add that folder first.' };
  const name = path.basename(folder);
  buildingQA = (async () => {
    const idx = new ProjectIndex({ ...config, projectFolders: [folder] });
    idx.build();
    const engine = getAnswerer();
    const { entries, skipped } = await buildProjectQA({
      index: idx, name, complete: (req) => engine.complete(req),
      onProgress: (p) => send({ ...p, name })
    });
    if (!entries.length) throw new Error('Claude did not return any usable questions. Try again.');
    fs.mkdirSync(PROJECT_KB_DIR, { recursive: true });
    // Two folders with the same name (…\\A\\QTC and …\\B\\QTC) get separate files.
    const sameName = config.projectFolders.filter(f => path.basename(f) === name).length > 1;
    const file = path.join(PROJECT_KB_DIR, `${slug(sameName ? `${path.basename(path.dirname(folder))}-${name}` : name)}.json`);
    fs.writeFileSync(file + '.tmp', JSON.stringify(entries, null, 2));
    fs.renameSync(file + '.tmp', file);
    await bankService.load();
    return `Built ${entries.length} project questions for ${name}${skipped ? ` (${skipped} skipped as incomplete)` : ''}.`;
  })();
  try {
    const msg = await buildingQA;
    return { ...state(), buildResult: msg };
  } catch (err) {
    return { ...state(), buildResult: 'Could not build project Q&A: ' + friendlyApiError(err) };
  } finally {
    buildingQA = null;
  }
});

// ---------- About me: resume and project documents ----------
ipcMain.handle('docs:add', async (e, kind) => {
  const r = await dialog.showOpenDialog(win, {
    title: kind === 'resume' ? 'Choose your resume' : 'Choose project documents',
    properties: kind === 'resume' ? ['openFile'] : ['openFile', 'multiSelections'],
    filters: [{ name: 'Documents', extensions: DOC_TYPES.map(x => x.slice(1)) }]
  });
  if (r.canceled || !r.filePaths.length) return state();
  const added = [], failed = [];
  for (const f of r.filePaths) {
    try { const d = await docStore.add(kind, f); added.push(`${d.name} (${Math.round(d.chars / 1000) || 1}k characters)`); }
    catch (err) { failed.push(err.message); }
  }
  rebuildIndex();
  if (answerer && answerer.prepare) answerer.prepare(config.meeting);
  return { ...state(), docsResult: [added.length ? `Added: ${added.join(', ')}` : '', ...failed].filter(Boolean).join(' · ') };
});
ipcMain.handle('docs:remove', (e, kind, name) => {
  docStore.remove(kind, name);
  rebuildIndex();
  return state();
});
// Instant answers about me: Claude writes Q&A from the resume / documents once (like Build Q&A for code).
let buildingDocQA = null;
ipcMain.handle('docs:build-qa', async (e, kind) => {
  if (buildingDocQA) return { ...state(), docsResult: 'Already building — please wait.' };
  const docs = docStore.list().filter(d => d.kind === kind);
  if (!docs.length) return { ...state(), docsResult: kind === 'resume' ? 'Add your resume first.' : 'Add project documents first.' };
  const engine = getAnswerer();
  buildingDocQA = (async () => {
    let total = 0, skipped = 0;
    fs.mkdirSync(PROJECT_KB_DIR, { recursive: true });
    for (const d of docs) {
      const r = await buildDocQA({ kind, name: d.name, text: d.text, complete: (req) => engine.complete(req) });
      if (!r.entries.length) continue;
      const file = path.join(PROJECT_KB_DIR, kind === 'resume' ? 'resume.json' : `doc-${slug(d.name)}.json`);
      fs.writeFileSync(file + '.tmp', JSON.stringify(r.entries, null, 2));
      fs.renameSync(file + '.tmp', file);
      total += r.entries.length; skipped += r.skipped;
    }
    if (!total) throw new Error('Claude did not return any usable questions. Try again.');
    await bankService.load();
    return `Built ${total} instant answers from your ${kind === 'resume' ? 'resume' : 'project documents'}${skipped ? ` (${skipped} skipped)` : ''}.`;
  })();
  try { return { ...state(), docsResult: await buildingDocQA }; }
  catch (err) { return { ...state(), docsResult: 'Could not build Q&A: ' + friendlyApiError(err) }; }
  finally { buildingDocQA = null; }
});

// ---------- Practice interviews ----------
const practiceHistory = new practice.PracticeHistory(path.join(path.dirname(CONFIG_PATH), 'practice.json')) // next to the settings;
const bankEntries = () => (bankService && bankService.bank ? bankService.bank.entries : []);
ipcMain.handle('practice:info', () => {
  const counts = practice.areaCounts(bankEntries());
  return {
    areas: Object.entries(practice.AREAS).map(([key, a]) => ({ key, label: a.label, hint: a.hint || '', count: counts[key] || 0 })),
    experience: Object.entries(practice.EXPERIENCE).map(([key, x]) => ({ key, label: x.label })),
    history: practiceHistory.summary(),
    settings: config.practice || null,
    hasResume: docStore.list().some(d => d.kind === 'resume')
  };
});
ipcMain.handle('practice:start', (e, opts = {}) => {
  config.practice = { focus: opts.focus || [], experience: opts.experience || 'five', count: opts.count || 10, source: opts.source || 'booklet',
    basics: opts.basics !== false, mine: opts.mine !== false, speak: !!opts.speak };
  try { saveConfig(config); } catch {}
  if (opts.starred) return { questions: practiceHistory.data.starred.slice(0, opts.count || 50).map(q => ({ ...q, area: null })) };
  if (config.practice.source === 'claude') return { questions: [] };
  const nBooklet = config.practice.source === 'mix' ? Math.ceil(config.practice.count / 2) : config.practice.count;
  return { questions: practice.pickQuestions(bankEntries(), { ...config.practice, count: nBooklet, seen: practiceHistory.seen }) };
});
ipcMain.handle('practice:generate', async (e, { focus, experience, count, avoid }) => {
  try {
    const engine = getAnswerer();
    const questions = await practice.generateQuestions({ complete: (req) => engine.complete(req), focus, experience, count, avoid });
    return { questions };
  } catch (err) { return { questions: [], error: friendlyApiError(err) }; }
});
ipcMain.handle('practice:feedback', async (e, { q, modelAnswer, myAnswer }) => {
  try {
    const engine = getAnswerer();
    return await practice.feedback({ complete: (req) => engine.complete(req), q, modelAnswer, myAnswer });
  } catch (err) { return { error: friendlyApiError(err) }; }
});
ipcMain.handle('practice:mark', (e, { question, seen, starred }) => {
  if (seen) practiceHistory.markSeen(question.id);
  if (starred !== undefined) practiceHistory.star(question, starred);
  return practiceHistory.summary();
});
ipcMain.handle('practice:finish', (e, session) => { practiceHistory.addSession(session); return practiceHistory.summary(); });

// ---------- end-to-end self test (⚙ → Run full test, or the "Work Copilot Self Test" Start menu entry) ----------
let selfTesting = null;
async function transcribeSample() {
  const { samples, sampleRate } = selfTest.parseWav(fs.readFileSync(path.join(ROOT, 'assets', selfTest.SAMPLE_QUESTION_FILE)));
  const { transcriber: t } = await localStt.createWithFallback({ modelDir: modelDir(), model: activeModel(), language: config.transcriptLanguage });
  const heard = [];
  t.onText = (text) => heard.push(text);
  t.accept(samples, sampleRate);
  t.accept(new Float32Array(sampleRate * 2), sampleRate); // a pause after the question ends the sentence
  await t.close();
  return heard.join(' ').trim();
}
async function waitBank(onProgress) {
  const until = Date.now() + 5 * 60 * 1000;
  let last = -1;
  while (Date.now() < until) {
    const st = bankService ? bankService.status : { state: 'off' };
    if (st.state !== 'preparing' && (st.state !== 'off' || (bankService && bankService.bank))) return st;
    if (st.state === 'preparing' && st.progress !== last) { last = st.progress; onProgress(st.progress || 0); }
    await new Promise(r => setTimeout(r, 400));
  }
  return { ...bankService.status, state: 'keyword-only', error: 'preparing took longer than 5 minutes' };
}
ipcMain.handle('selftest:run', async (e) => {
  const wc = e.sender;
  if (selfTesting) return selfTesting;
  const engine = answerEngine();
  selfTesting = selfTest.runSelfTest({
    engine,
    claudeFound: !!findClaude(config.claudeCodePath),
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    complete: (req) => getAnswerer().complete({ ...req, ...(engine === 'claude-code' ? { model: 'haiku', timeoutMs: 120000 } : {}) }),
    waitBank,
    find: (q) => bankService.find(q),
    get hasProjectQA() { return ((bankService && bankService.status.sources) || []).some(s => /^Project:/.test(s.name)); },
    projectFiles: indexStats ? indexStats.files : 0,
    transcriber: effectiveTranscriber(),
    deepgramKey: process.env.DEEPGRAM_API_KEY || '',
    speechInstalled: localStt.isInstalled(modelDir(), activeModel()),
    transcribeSample
  }, (s) => { if (!wc.isDestroyed()) wc.send('selftest:step', s); }).finally(() => { selfTesting = null; });
  return selfTesting;
});

// ---------- Deepgram ----------
// Listen URL with vocabulary hints: this meeting's terms, the project's own words, Salesforce terms.
ipcMain.handle('deepgram:url', () => {
  const terms = deepgram.keyterms({ meetingTerms: config.meeting.terms, files: (index && index.files) || [] });
  return deepgram.listenUrl({ language: config.transcriptLanguage, terms, base: process.env.DEEPGRAM_LISTEN_URL || deepgram.LISTEN_URL });
});

function writeEnvValue(name, value) {
  let text = '';
  try { text = fs.readFileSync(ENV_PATH, 'utf8'); } catch {}
  const line = `${name}=${value}`;
  const re = new RegExp(`^\\s*${name}\\s*=.*$`, 'm');
  text = re.test(text) ? text.replace(re, line) : (text && !text.endsWith('\n') ? text + '\n' : text) + line + '\n';
  fs.writeFileSync(ENV_PATH, text);
}

// Paste the key in ⚙ instead of editing .env. Checked with Deepgram before it is used.
ipcMain.handle('deepgram:set-key', async (e, rawKey) => {
  const key = String(rawKey || '').trim();
  if (!/^[A-Za-z0-9_-]{20,}$/.test(key)) return { ...state(), keyResult: 'That doesn\'t look like a Deepgram key. Copy it again from console.deepgram.com → API Keys.' };
  let ok;
  try {
    const { net } = require('electron');
    ok = await deepgram.checkKey((url, opts) => net.fetch(url, opts), key, process.env.DEEPGRAM_API_BASE || 'https://api.deepgram.com');
  } catch (err) {
    return { ...state(), keyResult: `Couldn't reach Deepgram to check the key (${err.message}). Check your internet and try again.` };
  }
  if (!ok) return { ...state(), keyResult: 'Deepgram rejected this key. Create a new one at console.deepgram.com → API Keys.' };
  writeEnvValue('DEEPGRAM_API_KEY', key);
  process.env.DEEPGRAM_API_KEY = key;
  config.transcriber = 'deepgram';
  saveConfig(config);
  return { ...state(), keyResult: 'Key works ✓ — meeting transcription switched to Deepgram.' };
});

// ---------- free offline transcription ----------
let installing = null;
let transcriber = null;

ipcMain.handle('stt:install', async (e) => {
  const wc = e.sender;
  const model = activeModel();
  if (!installing) {
    // Electron's network stack: follows Windows proxy settings, unlike plain Node fetch.
    const { net } = require('electron');
    installing = localStt.install(modelDir(), model, {
      fetchImpl: (url) => net.fetch(url),
      onProgress: (p) => { if (!wc.isDestroyed()) wc.send('stt:progress', p); }
    }).finally(() => { installing = null; });
  }
  try { await installing; } catch (err) { if (!wc.isDestroyed()) wc.send('notice', 'Speech model download failed: ' + err.message); }
  return state();
});

ipcMain.handle('stt:start', async (e) => {
  const wc = e.sender;
  if (transcriber) { await transcriber.close(); transcriber = null; }
  const model = activeModel();
  const send = (ch, data) => { if (!wc.isDestroyed()) wc.send(ch, data); };
  let opened;
  try {
    opened = await localStt.createWithFallback({ modelDir: modelDir(), model, language: config.transcriptLanguage });
  } catch (err) {
    if (localStt.isOutOfMemory(err)) {
      throw new Error('Not enough free memory (RAM) to load the speech model. Close heavy apps (browser tabs, VS Code, Teams), ' +
        'or pick a smaller one in ⚙ → Offline model → Whisper base, or use Deepgram.');
    }
    throw err;
  }
  const t = opened.transcriber;
  if (opened.fellBack) send('notice', 'Not enough free memory for the Parakeet speech model, so this session uses Whisper base (less accurate). Close heavy apps and press Listen again to retry Parakeet, or use Deepgram.');
  t.onText = (text) => send('stt:text', text);
  t.onSpeaking = (on) => send('stt:speaking', on);
  t.onError = (err) => send('stt:error', err.message || String(err));
  transcriber = t;
  return true;
});

ipcMain.on('stt:audio', (e, { samples, sampleRate }) => {
  if (transcriber) transcriber.accept(samples, sampleRate);
});

ipcMain.handle('stt:stop', async () => {
  const t = transcriber;
  transcriber = null;
  if (t) await t.close();
});
ipcMain.handle('hide', () => win && win.hide());
ipcMain.handle('win:minimize', () => win && win.minimize());
ipcMain.handle('win:toggle-max', () => { toggleMaximize(); return winMode; });
ipcMain.handle('win:toggle-compact', () => { toggleCompact(); return winMode; });
ipcMain.handle('win:expand', () => { expand(); return winMode; });
ipcMain.handle('win:bounds', () => win.getBounds());
// Corner resize: the renderer sends the size it wants while dragging (fire-and-forget for smoothness).
ipcMain.on('win:resize', (e, { start, width, height }) => {
  if (!win || win.isDestroyed()) return;
  const b = geo.resizedBounds(start, width, height, displays());
  winMode = 'normal';
  normalBounds = b;
  win.setBounds(b);
  saveWindowState();
});
ipcMain.handle('quit', () => app.quit());

// ---------- app ----------
// One overlay at a time: starting it again (Start menu, desktop icon) brings the open one forward.
// Tests start several copies in parallel, each with its own settings file, so they skip this.
const secondCopy = !process.env.COPILOT_CONFIG && !app.requestSingleInstanceLock();
if (secondCopy) {
  app.quit();
} else {
  app.on('second-instance', (e, argv) => {
    if (!win || win.isDestroyed()) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
    if (argv.includes('--self-test')) win.webContents.send('selftest:open');
  });
}

app.whenReady().then(() => {
  if (secondCopy) return;
  rebuildIndex();
  setupAudioCapture();
  createWindow();
  startBank();
  const failed = registerHotkeys();
  if (failed.length) {
    win.webContents.once('did-finish-load', () =>
      win.webContents.send('notice', `These hotkeys are taken by another app: ${failed.join(', ')}. Change them in config.json.`));
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (answerer && answerer.dispose) answerer.dispose(); // stop the waiting claude process
});
app.on('window-all-closed', () => app.quit());
