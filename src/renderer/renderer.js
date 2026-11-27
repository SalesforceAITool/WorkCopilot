/* global copilot */
const $ = (id) => document.getElementById(id);
const selectLabels = new Map(); // drawn dropdowns (see enhanceSelect)

let state = { config: { meeting: {} }, stats: null, deepgramKey: '', hasAnthropicKey: false, activeFolders: [] };
let presets = { speed: {}, style: {}, language: {}, scenarios: {} };
const answers = [];          // [{id, question, answer, status, meta}]
let viewIndex = -1;
let seq = 0;

// ---------------- panels ----------------
function show(panel) {
  for (const p of ['card', 'setup', 'settings', 'bankPanel', 'selftestPanel', 'practicePanel']) $(p).classList.toggle('hidden', p !== panel);
}
function toggle(panel) { expandIfCompact(); show($(panel).classList.contains('hidden') ? panel : 'card'); }

function notice(text) {
  const n = $('notice');
  n.textContent = text;
  n.classList.toggle('hidden', !text);
  if (text) expandIfCompact(); // a problem should never be hidden by the collapsed view
}

// ---------------- window: collapse / maximize / resize ----------------
let winMode = 'normal';
// Arrows pointing in = collapse to the toolbar; arrows pointing out = open it again.
const ICON_COLLAPSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>';
const ICON_EXPAND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
function setWinMode(mode) {
  winMode = mode;
  document.body.classList.toggle('compact', mode === 'compact');
  document.body.classList.toggle('maximized', mode === 'maximized');
  $('btnCompact').innerHTML = mode === 'compact' ? ICON_EXPAND : ICON_COLLAPSE;
  $('btnCompact').title = mode === 'compact' ? 'Expand' : 'Collapse to toolbar';
  $('btnMax').textContent = mode === 'maximized' ? '❐' : '□';
  $('btnMax').title = mode === 'maximized' ? 'Restore size' : 'Maximize';
}
function expandIfCompact() { if (winMode === 'compact') copilot.expand(); }

// Bottom-right corner drag. The window grows under the cursor, so the drag is tracked on the
// whole window (not the corner element, which moves away) and ends when the button is released.
// Screen coordinates; at most one size update per animation frame.
let resizing = null;
$('resizeGrip').addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  e.preventDefault();
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  const session = { sx: e.screenX, sy: e.screenY, start: null, want: null, frame: false };
  resizing = session;
  copilot.getBounds().then(b => { session.start = b; flushResize(session); });
});
function flushResize(session) {
  if (!session.start || !session.want || session.frame) return;
  session.frame = true;
  requestAnimationFrame(() => {
    session.frame = false;
    copilot.resizeTo(session.start, session.start.width + session.want.dx, session.start.height + session.want.dy);
  });
}
window.addEventListener('pointermove', (ev) => {
  if (!resizing) return;
  if ((ev.buttons & 1) === 0) { resizing = null; return; } // released outside the window
  resizing.want = { dx: ev.screenX - resizing.sx, dy: ev.screenY - resizing.sy };
  flushResize(resizing);
}, true);
for (const type of ['pointerup', 'pointercancel', 'blur']) window.addEventListener(type, () => { resizing = null; }, true);

// ---------------- transcript / listening ----------------
const utterances = [];        // [{text, at, isQ}]
let pending = '';             // finalized words of the current utterance
let interim = '';             // words still being recognized
let listening = false;
let ws = null, recorder = null, displayStream = null, micStream = null, audioCtx = null, keepAlive = null;
let starting = false;
let stopping = false;
let reconnects = 0;
let warmTimer = null;
let autoTimer = null;       // waits briefly so a question with a pause is answered whole
let queuedQuestion = null;  // a question that arrived while an answer was still fresh
const AUTO_WAIT_MS = 1200;
const MAX_RECONNECTS = 3;

const Q_START = /^(so\s+|and\s+|okay\s+|ok\s+|right\s+)?(what|why|how|when|where|which|who|can you|could you|would you|will you|did you|do you|does|have you|has|is there|are there|is it|was it|tell me|explain|walk (me|us) through|describe|share|kya|kaise|kyun|kyu|kab|kaun|kis|batao|bataiye|samjhao)\b/i;

function looksLikeQuestion(text) {
  const t = text.trim();
  if (t.split(/\s+/).length < 4) return false;
  return /\?\s*$/.test(t) || Q_START.test(t);
}

function toggleListening() { (listening || ws || starting) ? stopListening() : startListening(); }

let localActive = false;   // the free offline engine is running
let processor = null;      // feeds raw audio to the offline engine

// Meeting audio = what others say in Teams / Zoom / Meet (system audio), plus the mic if enabled.
// If Windows won't share system audio but the mic is on (e.g. an in-person meeting), the mic alone is used.
async function captureAudio() {
  let sysTrack = null;
  try {
    displayStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 1, width: 320, height: 180 }, audio: true });
    sysTrack = displayStream.getAudioTracks()[0] || null;
  } catch (err) {
    if (!state.config.includeMic) throw err;
  }
  if (!sysTrack && !state.config.includeMic) throw new Error('Windows did not share any system audio.');
  audioCtx = new AudioContext();
  const mix = audioCtx.createGain();
  if (sysTrack) audioCtx.createMediaStreamSource(new MediaStream([sysTrack])).connect(mix);
  if (state.config.includeMic) {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    audioCtx.createMediaStreamSource(micStream).connect(mix);
  }
  startLevelMeter(mix);
  return { mix, systemAudio: !!sysTrack };
}

// ---------------- audio level: is anything being heard? ----------------
let levelTimer = null;
let lastSoundAt = 0;
let silenceWarned = false;
const SILENCE_WARN_MS = 20000;
const SILENCE_NOTICE = 'Not hearing any audio for 20 seconds.';

function startLevelMeter(node) {
  stopLevelMeter();
  let analyser;
  try { analyser = audioCtx.createAnalyser(); analyser.fftSize = 1024; node.connect(analyser); } catch { return; }
  const buf = new Float32Array(analyser.fftSize);
  lastSoundAt = Date.now();
  silenceWarned = false;
  $('level').classList.remove('hidden');
  levelTimer = setInterval(() => {
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    $('levelFill').style.width = Math.min(100, Math.round(rms * 600)) + '%';
    const now = Date.now();
    if (rms > 0.005) {
      lastSoundAt = now;
      if (silenceWarned) { silenceWarned = false; if ($('notice').textContent.startsWith(SILENCE_NOTICE)) notice(''); }
    } else if (!silenceWarned && now - lastSoundAt > SILENCE_WARN_MS) {
      silenceWarned = true;
      notice(SILENCE_NOTICE + (state.config.includeMic
        ? ' Check that meeting sound plays through your normal speakers/headset and your mic is not muted.'
        : ' If you are testing by speaking yourself, turn on ⚙ → "Also transcribe my mic" — normally only the other people in the meeting are heard.'));
    }
  }, 150);
}

function stopLevelMeter() {
  clearInterval(levelTimer);
  levelTimer = null;
  const el = document.getElementById('level');
  if (el) el.classList.add('hidden');
}

async function startListening({ reconnect = false } = {}) {
  if (listening || ws || starting) return;
  if (!reconnect) reconnects = 0;
  if (state.transcriber === 'local') return startLocal();
  if (!state.deepgramKey) {
    notice('DEEPGRAM_API_KEY is missing in the .env file. Add it, or switch ⚙ → Meeting transcription to "Free offline". You can still type questions or use Screenshot.');
    return;
  }
  starting = true;
  try {
    const { mix } = await captureAudio();
    const dest = audioCtx.createMediaStreamDestination();
    mix.connect(dest);

    // Built in the main process: language plus vocabulary hints (Salesforce + project + meeting terms).
    const url = await copilot.deepgramUrl();
    const socket = new WebSocket(url, ['token', state.deepgramKey]);
    ws = socket;
    let opened = false;

    socket.onopen = () => {
      opened = true;
      recorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus' });
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0 && socket.readyState === 1) socket.send(ev.data);
      };
      recorder.start(250);
      keepAlive = setInterval(() => {
        if (socket.readyState === 1) socket.send(JSON.stringify({ type: 'KeepAlive' }));
      }, 8000);
      // The prompt cache lives ~5 minutes: refresh it so a question after a quiet spell is still fast.
      startWarmTimer();
      starting = false;
      reconnects = 0;
      setListening(true);
      notice('');
    };
    socket.onmessage = (m) => { try { handleDeepgram(JSON.parse(m.data)); } catch {} };
    socket.onclose = (ev) => {
      if (ws !== socket) return; // an older socket closing after a restart
      const wasListening = listening;
      cleanupAudio();
      if (!opened) {
        notice(`Could not connect to Deepgram${ev.code ? ` (code ${ev.code})` : ''}. Check DEEPGRAM_API_KEY and your internet.`);
      } else if (wasListening && !stopping) {
        if (reconnects < MAX_RECONNECTS) {
          reconnects++;
          notice(`Transcription dropped — reconnecting (${reconnects}/${MAX_RECONNECTS})…`);
          setTimeout(() => startListening({ reconnect: true }), 1000 * 2 ** (reconnects - 1));
        } else {
          notice('Transcription keeps dropping. Check your internet, then press Listen.');
        }
      }
    };
  } catch (err) {
    cleanupAudio();
    notice('Could not start listening: ' + err.message);
  }
}

// The prompt cache lives ~5 minutes: refresh it so a question after a quiet spell is still fast.
function startWarmTimer() {
  clearInterval(warmTimer);
  warmTimer = setInterval(() => copilot.warm(), 4 * 60 * 1000);
}

// Free offline engine: Whisper on this PC. First use downloads the model once.
async function startLocal() {
  starting = true;
  try {
    if (!state.modelInstalled) {
      notice('Downloading the free speech model (one time)…');
      state = await copilot.sttInstall();
      if (!state.modelInstalled) throw new Error('the speech model did not finish downloading');
    }
    notice('Loading the speech model…');
    await copilot.sttStart();
    const { mix, systemAudio } = await captureAudio();
    // Raw audio in ~85 ms blocks to the engine; nothing is played back.
    processor = audioCtx.createScriptProcessor(4096, 1, 1);
    const silent = audioCtx.createGain();
    silent.gain.value = 0;
    processor.onaudioprocess = (ev) => copilot.sttAudio(new Float32Array(ev.inputBuffer.getChannelData(0)), audioCtx.sampleRate);
    mix.connect(processor);
    processor.connect(silent);
    silent.connect(audioCtx.destination);
    localActive = true;
    startWarmTimer();
    starting = false;
    setListening(true);
    notice(systemAudio ? '' : 'Windows did not share meeting audio, so only your microphone is being heard.');
  } catch (err) {
    cleanupAudio();
    notice('Could not start free offline listening: ' + err.message);
  }
}

copilot.on('stt:progress', (p) => {
  if (p.stage === 'download' && p.total) {
    notice(`Downloading the free speech model (one time): ${Math.round(p.received / 1048576)} of ${Math.round(p.total / 1048576)} MB…`);
  } else if (p.stage === 'unpack') {
    notice('Unpacking the speech model…');
  }
});
copilot.on('stt:text', (text) => {
  if (!localActive) return;
  pending = (pending + ' ' + text).trim();
  interim = '';
  flushUtterance();
});
copilot.on('stt:speaking', (on) => {
  if (!localActive) return;
  interim = on ? '…' : '';
  renderTranscript();
});
copilot.on('stt:error', (message) => notice('Offline transcription problem: ' + message));

function stopListening() {
  stopping = true;
  const socket = ws;
  // Ask Deepgram to flush the last words, then close shortly after.
  try { if (socket && socket.readyState === 1) socket.send(JSON.stringify({ type: 'CloseStream' })); } catch {}
  cleanupAudio({ closeAfterMs: 800 });
  stopping = false;
}

// Always releases screen/audio capture, whatever state the socket got to.
function cleanupAudio({ closeAfterMs = 0 } = {}) {
  try { if (recorder && recorder.state !== 'inactive') recorder.stop(); } catch {}
  if (processor) { try { processor.onaudioprocess = null; processor.disconnect(); } catch {} processor = null; }
  stopLevelMeter();
  if (localActive) { localActive = false; copilot.sttStop(); } // finishes the last sentence, then releases
  const socket = ws;
  ws = null;
  starting = false;
  const close = () => { try { if (socket && socket.readyState <= 1) socket.close(); } catch {} };
  if (closeAfterMs) setTimeout(close, closeAfterMs); else close();
  clearInterval(keepAlive);
  clearInterval(warmTimer);
  [displayStream, micStream].forEach(s => s && s.getTracks().forEach(t => t.stop()));
  try { if (audioCtx) audioCtx.close(); } catch {}
  recorder = displayStream = micStream = audioCtx = null;
  flushUtterance();
  setListening(false);
}

function setListening(on) {
  listening = on;
  $('dot').classList.toggle('live', on);
  $('listenLabel').textContent = on ? 'Listening' : 'Listen';
  renderTranscript();
}

function handleDeepgram(msg) {
  if (msg.type === 'Results') {
    const alt = msg.channel && msg.channel.alternatives && msg.channel.alternatives[0];
    const t = (alt && alt.transcript) || '';
    if (msg.is_final) {
      if (t) pending = (pending + ' ' + t).trim();
      interim = '';
      if (msg.speech_final) flushUtterance();
    } else {
      interim = t;
    }
    renderTranscript();
  } else if (msg.type === 'UtteranceEnd') {
    flushUtterance();
  }
}

function flushUtterance() {
  const u = pending.trim();
  pending = '';
  interim = '';
  if (!u) return;
  const isQ = looksLikeQuestion(u);
  utterances.push({ text: u, at: Date.now(), isQ });
  if (utterances.length > 200) utterances.shift();
  renderTranscript();
  if (!state.config.autoAnswer) return;
  if (autoTimer) {
    // More speech right after a question: it is the rest of the same question.
    clearTimeout(autoTimer.handle);
    autoTimer.text += ' ' + u;
    autoTimer.handle = setTimeout(fireAuto, AUTO_WAIT_MS);
  } else if (isQ) {
    autoTimer = { text: u, handle: setTimeout(fireAuto, AUTO_WAIT_MS) };
  }
}

function fireAuto() {
  const q = autoTimer && autoTimer.text.trim();
  autoTimer = null;
  if (!q) return;
  // Don't cut off an answer that just started; answer this one as soon as that finishes.
  const current = answers[answers.length - 1];
  const busy = current && ['thinking', 'streaming'].includes(current.status) && Date.now() - current.startedAt < 6000;
  if (busy) { queuedQuestion = q; return; }
  ask({ question: q });
}

function runQueued() {
  if (!queuedQuestion) return;
  const q = queuedQuestion;
  queuedQuestion = null;
  ask({ question: q });
}

function recentTranscript(ms = 3 * 60 * 1000) {
  const since = Date.now() - ms;
  return utterances.filter(u => u.at >= since).map(u => u.text).join('\n');
}

function latestQuestionGuess() {
  const live = (pending + ' ' + interim).trim();
  const lastQ = [...utterances].reverse().find(u => u.isQ);
  const tail = utterances.slice(-2).map(u => u.text).join(' ');
  if (live) return (tail + ' ' + live).trim();
  if (lastQ && Date.now() - lastQ.at < 90000) return lastQ.text;
  return tail;
}

function renderTranscript() {
  const box = $('transcript');
  const last = utterances.slice(-6);
  if (!last.length && !pending && !interim) {
    box.innerHTML = `<span class="muted">${listening ? 'Listening… waiting for speech.' : 'Press Listen — the meeting audio will appear here.'}</span>`;
    return;
  }
  box.innerHTML =
    last.map(u => `<span class="u${u.isQ ? ' q' : ''}">${esc(u.text)}</span>`).join(' · ') +
    (pending || interim ? ` <span class="interim">${esc((pending + ' ' + interim).trim())}</span>` : '');
  box.scrollTop = box.scrollHeight;
}

// ---------------- asking Claude ----------------
function ask({ question, withScreenshot = false } = {}) {
  if (!state.canAnswer) { notice('ANTHROPIC_API_KEY is missing in the .env file, or switch ⚙ → Claude answers to "Claude Code".'); return; }
  const q = (question || '').trim() || latestQuestionGuess();
  if (!q && !withScreenshot) {
    notice('Nothing heard yet. Press Listen, type a question, or use Screenshot.');
    return;
  }
  expandIfCompact(); // a new answer always shows, even when collapsed
  const id = ++seq;
  answers.push({ id, question: q || '(question from screenshot)', answer: '', status: 'thinking', meta: '', startedAt: Date.now() });
  viewIndex = answers.length - 1;
  show('card');
  renderAnswer(true);
  copilot.ask({ id, question: q, transcript: recentTranscript(), withScreenshot });
}

// "Ask Claude" on a booklet-only answer: Claude answers below it, in the same card.
function askClaudeToo(e, depth) {
  e.status = 'thinking';
  e.bankOnly = false;
  e.answer = '';
  e.startedAt = Date.now();
  renderAnswer();
  copilot.ask({ id: e.id, question: e.question, transcript: recentTranscript(), forceClaude: true, ...(depth ? { depth } : {}) });
}

function byId(id) { return answers.find(h => h.id === id); }
function rerender(e) { if (answers[viewIndex] === e) renderAnswer(); }

copilot.on('answer:meta', ({ id, mode, sourceCount, speed, depth }) => {
  const e = byId(id); if (!e) return;
  const src = mode === 'full' ? 'whole project' : mode === 'none' ? 'no folder yet' : `${sourceCount} relevant files`;
  e.depth = depth;
  e.meta = `${(presets.speed[speed] || {}).label || speed}${depth === 'full' ? ' · full answer' : ''} · ${src}`;
  rerender(e);
});
copilot.on('answer:delta', ({ id, delta }) => {
  const e = byId(id); if (!e || e.status === 'cancelled') return;
  e.status = 'streaming';
  e.answer += delta;
  rerender(e);
});
copilot.on('answer:bank', ({ id, matches }) => {
  const e = byId(id); if (!e || !matches || !matches.length) return;
  e.bank = matches;
  e.bankIndex = 0;
  e.bankMs = Date.now() - e.startedAt;
  rerender(e);
});
copilot.on('answer:done', ({ id, bankOnly }) => {
  const e = byId(id); if (!e) return;
  e.bankOnly = !!bankOnly;
  e.status = 'done';
  e.totalMs = Date.now() - e.startedAt;
  rerender(e);
  if (answers[answers.length - 1] === e) setTimeout(runQueued, 0);
});
copilot.on('answer:cancelled', ({ id }) => {
  const e = byId(id); if (!e) return;
  e.status = 'cancelled';
  rerender(e);
});
copilot.on('answer:error', ({ id, message }) => {
  const e = byId(id); if (!e) return;
  e.status = 'error'; e.answer = message;
  rerender(e);
  if (answers[answers.length - 1] === e) setTimeout(runQueued, 0);
});
copilot.on('notice', (text) => notice(text));

function renderAnswer(scrollTop = false) {
  const e = answers[viewIndex];
  if (!e) return;
  $('q').textContent = e.question || '…';
  const timing = e.totalMs ? ` · ${(e.totalMs / 1000).toFixed(1)}s` : '';
  const tag = e.status === 'cancelled' ? ' · stopped (newer question)' : '';
  $('meta').textContent = `${viewIndex + 1}/${answers.length}${e.meta ? ' · ' + e.meta : ''}${timing}${tag}`;
  const a = $('a');
  let claude;
  if (e.status === 'thinking') claude = `<span class="thinking">${e.bank ? 'Claude is adding to this…' : 'Reading your project…'}</span>`;
  else if (e.status === 'error') claude = `<span class="error">${esc(e.answer)}</span>`;
  else claude = md(e.answer);
  const bankOnlyDone = e.bankOnly && e.status === 'done';
  a.innerHTML = (e.bank ? bankBlock(e) : '') + (e.bank && !bankOnlyDone ? '<div class="claude-head">Claude</div>' : '') + (bankOnlyDone ? '' : claude) +
    (bankOnlyDone ? '<button class="pill small-pill ask-claude" id="btnAskClaude" title="Get Claude\'s answer too">Ask Claude ↗</button>' : '') +
    (e.status === 'done' && !e.bankOnly && e.depth !== 'full' && e.question ? '<button class="pill small-pill ask-claude" id="btnMoreDetail" title="A full, detailed answer like a chat reply (stronger model, longer)">More detail ↗</button>' : '');
  const askBtn = a.querySelector('#btnAskClaude');
  if (askBtn) askBtn.onclick = () => askClaudeToo(e);
  const moreBtn = a.querySelector('#btnMoreDetail');
  if (moreBtn) moreBtn.onclick = () => askClaudeToo(e, 'full');
  a.querySelectorAll('[data-alt]').forEach(b => b.onclick = () => { e.bankIndex = Number(b.dataset.alt); renderAnswer(); });
  if (scrollTop) $('card').scrollTop = 0;
}

// The stored answer, shown the moment the question is heard.
function bankBlock(e) {
  const m = e.bank[e.bankIndex || 0];
  const project = m.source && m.source.startsWith('project:');
  // Below ~0.72 the stored question is usually a neighbour of the one asked: say so.
  const close = m.confidence >= 0.72;
  const badge = m.source === 'project:resume' ? 'Your resume' : 'Your project';
  const head = `<div class="bank-head">⚡ ${project ? `<span class="badge">${badge}</span> ` : ''}${esc(m.topic || 'Q&A bank')} · ${close ? `${Math.round(m.confidence * 100)}% match` : '<span class="related">related answer — may not cover everything asked</span>'}</div>`;
  const others = e.bank.map((x, i) => i === (e.bankIndex || 0) ? '' : `<button class="link" data-alt="${i}">${esc(x.q)}</button>`).filter(Boolean);
  return `<div class="bank">${head}<div class="bank-q">${esc(m.q)}</div>${entryPoints(m)}` +
    (others.length ? `<div class="also">Also close: ${others.join(' · ')}</div>` : '') + '</div>';
}

// The booklet answer as an interviewer wants it: one line to say first, then short points;
// the full answer and code stay one click away.
function entryPoints(m) {
  const sentences = String(m.a || '').split(/(?<=[.!?])\s+/).filter(Boolean);
  const opener = sentences[0] || '';
  const bullets = (m.points && m.points.length >= 2) ? m.points : sentences.slice(1, 5);
  return `<div class="say-first">${inline(opener)}</div>` +
    (bullets.length ? '<ul class="say-points">' + bullets.map(p => `<li>${inline(p)}</li>`).join('') + '</ul>' : '') +
    `<details class="full"><summary>Full answer</summary>${md(m.a)}</details>` +
    (m.code ? `<details class="code"><summary>Code</summary><pre>${esc(m.code)}</pre></details>` : '');
}

function entryBody(m) {
  return md(m.a) + (m.points && m.points.length ? '<ul>' + m.points.map(p => `<li>${inline(p)}</li>`).join('') + '</ul>' : '') +
    (m.code ? `<details class="code"><summary>Code</summary><pre>${esc(m.code)}</pre></details>` : '');
}

// ---------------- tiny markdown ----------------
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
function md(text) {
  const out = [];
  let inList = false;   // 'ul' | 'ol' | false
  let code = null;      // lines of an open ``` block
  const closeList = () => { if (inList) { out.push(`</${inList}>`); inList = false; } };
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd();
    if (/^\s*```/.test(line)) {
      if (code) { out.push(`<pre class="map">${esc(code.join('\n'))}</pre>`); code = null; }
      else { closeList(); code = []; }
      continue;
    }
    if (code) { code.push(raw); continue; }
    const li = line.match(/^\s*[-*•]\s+(.*)/);
    const oli = !li && line.match(/^\s*\d+[.)]\s+(.*)/);
    if (li || oli) {
      const kind = li ? 'ul' : 'ol';
      if (inList !== kind) { closeList(); out.push(`<${kind}>`); inList = kind; }
      out.push(`<li>${inline((li || oli)[1])}</li>`);
      continue;
    }
    closeList();
    if (!line.trim()) continue;
    if (/^files?:/i.test(line.trim())) out.push(`<div class="files">📄 ${inline(line.trim())}</div>`);
    else out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  if (code) out.push(`<pre class="map">${esc(code.join('\n'))}</pre>`); // unfinished block while streaming
  return out.join('');
}

// ---------------- meeting setup ----------------
let draft = {};

function fillSelect(sel, entries, value) {
  sel.innerHTML = entries.map(([k, label]) => `<option value="${esc(k)}">${esc(label)}</option>`).join('');
  sel.value = value;
}

function renderSetup() {
  const m = draft;
  $('speedCards').innerHTML = Object.entries(presets.speed).map(([k, s]) =>
    `<button class="speed${m.speed === k ? ' on' : ''}" data-speed="${esc(k)}"><b>${esc(s.label)}</b><span>${esc(s.hint)}</span></button>`
  ).join('');
  document.querySelectorAll('[data-speed]').forEach(b => b.onclick = () => { draft.speed = b.dataset.speed; renderSetup(); });

  fillSelect($('mScenario'), Object.entries(presets.scenarios).map(([k, s]) => [k, s.label]), m.scenario);
  fillSelect($('mStyle'), Object.entries(presets.style), m.style);
  const sc = presets.scenarios[m.scenario];
  $('mBrief').placeholder = sc ? `Example: ${sc.example}` : '';
  if ($('mBrief').value !== m.brief) $('mBrief').value = m.brief;
  if ($('mTerms').value !== (m.terms || '')) $('mTerms').value = m.terms || '';

  const folders = state.config.projectFolders || [];
  $('mFolders').innerHTML = folders.length
    ? folders.map(f => `<label><input type="checkbox" data-folder="${esc(f)}" ${!m.folders.length || m.folders.includes(f) ? 'checked' : ''}> ${esc(f)}</label>`).join('')
    : '<span class="muted">No project folder yet — add one in ⚙.</span>';
  document.querySelectorAll('[data-folder]').forEach(cb => cb.onchange = () => {
    const checked = [...document.querySelectorAll('[data-folder]')].filter(x => x.checked).map(x => x.dataset.folder);
    draft.folders = checked.length === folders.length ? [] : checked; // all ticked = "all"
  });
  if (typeof refreshSelects === 'function') refreshSelects();
}

function renderSetupLabel() {
  const m = state.config.meeting || {};
  const sp = presets.speed[m.speed];
  const sc = presets.scenarios[m.scenario];
  $('setupLabel').textContent = sp && sc ? `${sp.label} · ${sc.label}` : 'Setup';
}

$('mScenario').onchange = (e) => {
  const prev = presets.scenarios[draft.scenario];
  draft.scenario = e.target.value;
  const sc = presets.scenarios[draft.scenario];
  // Follow the scenario's default style unless the user already changed it.
  if (!prev || draft.style === prev.style) draft.style = sc.style;
  renderSetup();
};
$('mStyle').onchange = (e) => { draft.style = e.target.value; };
$('mBrief').oninput = (e) => { draft.brief = e.target.value; };
$('mTerms').oninput = (e) => { draft.terms = e.target.value; };
$('useExample').onclick = (e) => {
  e.preventDefault();
  draft.brief = presets.scenarios[draft.scenario].example;
  renderSetup();
};

async function saveSetup() {
  state = await copilot.setMeeting(draft);
  draft = { ...state.config.meeting };
  renderSetupLabel();
  renderSettings();
  return state;
}

$('btnSaveSetup').onclick = async () => {
  await saveSetup();
  $('setupStatus').textContent = 'Saved ✓';
  setTimeout(() => ($('setupStatus').textContent = ''), 1500);
};
$('btnStart').onclick = async () => {
  await saveSetup();
  show('card');
  copilot.warm(); // fire and forget: makes the first answer faster
  startListening();
};

// ---------------- projects & options ----------------
function renderSettings() {
  const c = state.config;
  const s = state.stats;
  $('folders').innerHTML = (c.projectFolders || []).length
    ? c.projectFolders.map(f => `<div class="folder"><span>${esc(f)}</span><span><button class="pill small-pill" data-buildqa="${esc(f)}" title="Claude reads this project once and writes Q&A about it, so project questions get instant answers">Build Q&A</button> <button class="icon small" data-rm="${esc(f)}">✕</button></span></div>`).join('') + '<div id="projectQAStatus" class="muted small"></div>'
    : '<div class="muted">No folder yet — add your Salesforce project (the one with force-app).</div>';
  $('stats').textContent = s && s.files
    ? `${s.files} files · ~${Math.round(s.approxTokens / 1000)}k tokens · ${s.mode === 'full' ? 'sends whole project' : 'sends best-matching parts'}${s.notes ? ` · ${s.notes} notes file` : ''}${s.skippedLarge ? ` · ${s.skippedLarge} skipped (over 200 KB)` : ''}`
    : (s && s.notes ? `notes only (${s.notes} file)` : '');
  const me = state.aboutMe || { resume: [], docs: [] };
  $('resumeName').innerHTML = me.resume.length
    ? `${esc(me.resume[0])} ✓ <button class="icon small" data-rmdoc="resume|${esc(me.resume[0])}" title="Remove">✕</button>` : 'not added';
  $('docList').innerHTML = me.docs.map(n => `<div class="folder"><span>📄 ${esc(n)}</span><button class="icon small" data-rmdoc="docs|${esc(n)}" title="Remove">✕</button></div>`).join('');
  document.querySelectorAll('[data-rmdoc]').forEach(b => b.onclick = async () => {
    const [kind, ...name] = b.dataset.rmdoc.split('|');
    state = await copilot.removeDoc(kind, name.join('|'));
    renderSettings();
  });
  $('optAuto').checked = !!c.autoAnswer;
  $('optMic').checked = !!c.includeMic;
  $('optHide').checked = !!c.hideFromScreenShare;
  $('optLang').value = c.transcriptLanguage === 'en' ? 'en' : 'en-IN';
  $('optEngine').value = state.transcriber || 'local';
  $('deepgramRow').classList.toggle('hidden', !!state.deepgramKey && state.transcriber === 'deepgram');
  $('deepgramHint').textContent = state.deepgramKey
    ? 'Deepgram key saved ✓'
    : 'Most accurate option, handles Indian English and Hindi–English mix. New Deepgram accounts get $200 free credit (hundreds of meeting hours): console.deepgram.com → API Keys.';
  const models = state.localModels || {};
  $('optModel').innerHTML = Object.entries(models).map(([k, label]) => `<option value="${esc(k)}">${esc(label)}</option>`).join('');
  $('optModel').value = c.localModel || 'base';
  const local = state.transcriber === 'local';
  $('modelRow').classList.toggle('hidden', !local);
  $('modelStatusRow').classList.toggle('hidden', !local);
  $('modelStatus').textContent = state.modelInstalled
    ? 'Speech model downloaded ✓ — audio stays on this PC.'
    : 'Speech model not downloaded yet — it downloads once, the first time you press Listen.';
  $('btnDownloadModel').classList.toggle('hidden', !!state.modelInstalled);
  const missing = [];
  $('optAnswerEngine').value = state.answerEngine || 'api';
  $('answerEngineStatus').textContent = state.answerEngine === 'claude-code'
    ? (state.claudeCodeFound ? 'Claude Code found ✓ — make sure you have signed in to it once.' : 'Claude Code not found — install it from claude.com/code and sign in.')
    : '';
  if (!state.hasAnthropicKey && state.answerEngine !== 'claude-code') missing.push('ANTHROPIC_API_KEY');
  if (!state.deepgramKey && !local) missing.push('DEEPGRAM_API_KEY');
  $('keys').textContent = missing.length ? `Missing in .env: ${missing.join(', ')}` : 'API keys loaded ✓';
  document.querySelectorAll('[data-buildqa]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    $('projectQAStatus').textContent = 'Starting… Claude reads the project once (a few minutes, uses your Claude plan).';
    const res = await copilot.buildProjectQA(b.dataset.buildqa);
    const { buildResult, ...rest } = res;
    state = rest;
    renderSettings();
    $('projectQAStatus').textContent = buildResult || '';
  });
  $('optAnswerSource').value = c.answerSource || 'smart';
  $('modeQuick').value = c.answerSource || 'smart';
  if (document.activeElement !== $('optRole')) $('optRole').value = c.yourRole || 'Salesforce Technical Lead';
  $('bankStatus').textContent = bankStatusText(state.bank);
  document.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => {
    state = await copilot.removeFolder(b.dataset.rm);
    draft = { ...state.config.meeting };
    renderSettings();
  });
  if (typeof refreshSelects === 'function') refreshSelects();
}

async function setOpt(key, value) {
  state = await copilot.setOption(key, value);
  renderSettings();
}

// ---------------- wiring ----------------
$('btnListen').onclick = toggleListening;
$('btnAnswer').onclick = () => ask({});
$('btnShot').onclick = () => ask({ withScreenshot: true });
$('btnSetup').onclick = () => { draft = { ...state.config.meeting }; renderSetup(); toggle('setup'); };
$('btnSettings').onclick = () => toggle('settings');
$('btnCompact').onclick = () => copilot.toggleCompact();
$('btnMin').onclick = () => copilot.minimize();
$('btnMax').onclick = () => copilot.toggleMaximize();
copilot.on('win:state', ({ mode }) => setWinMode(mode));
setWinMode('normal');
$('btnQuit').onclick = () => copilot.quit();
$('prev').onclick = () => { if (viewIndex > 0) { viewIndex--; renderAnswer(true); } };
$('next').onclick = () => { if (viewIndex < answers.length - 1) { viewIndex++; renderAnswer(true); } };
$('chat').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.value.trim()) { ask({ question: e.target.value }); e.target.value = ''; }
  if (e.key === 'Escape') copilot.cancel();
});
$('btnAddFolder').onclick = async () => { state = await copilot.addFolder(); draft = { ...state.config.meeting }; renderSettings(); };
$('btnReindex').onclick = async () => { state = await copilot.reindex(); renderSettings(); };
$('optAuto').onchange = (e) => setOpt('autoAnswer', e.target.checked);
$('optMic').onchange = (e) => setOpt('includeMic', e.target.checked);
$('optHide').onchange = (e) => setOpt('hideFromScreenShare', e.target.checked);
$('optLang').onchange = (e) => setOpt('transcriptLanguage', e.target.value);
$('optEngine').onchange = (e) => setOpt('transcriber', e.target.value);
$('optAnswerEngine').onchange = (e) => setOpt('answerEngine', e.target.value);
$('optAnswerSource').onchange = (e) => setOpt('answerSource', e.target.value);
$('modeQuick').onchange = (e) => setOpt('answerSource', e.target.value);

// ---------------- About me: resume and project documents ----------------
async function docsAction(fn, busyText) {
  if (busyText) $('docsStatus').textContent = busyText;
  const res = await fn();
  const { docsResult, ...rest } = res;
  state = rest;
  renderSettings();
  $('docsStatus').textContent = docsResult || '';
}
$('btnAddResume').onclick = () => docsAction(() => copilot.addDocs('resume'));
$('btnAddDocs').onclick = () => docsAction(() => copilot.addDocs('docs'));
$('btnResumeQA').onclick = () => docsAction(() => copilot.buildDocQA('resume'), 'Claude is reading your resume (about a minute, uses your Claude plan)…');
$('btnDocsQA').onclick = () => docsAction(() => copilot.buildDocQA('docs'), 'Claude is reading your project documents (a minute or two)…');
$('optRole').onchange = (e) => setOpt('yourRole', e.target.value);

// ---------------- Q&A bank panel and status ----------------
function bankStatusText(b) {
  if (!b || !b.entries) return (b && b.error) || 'Q&A bank not found.';
  const parts = (b.sources || []).map(s => `${s.name}: ${s.count}`).join(' · ');
  const st = b.state === 'ready' ? 'smart matching ready ✓'
    : b.state === 'preparing' ? `preparing smart matching… ${b.progress || 0}% (first run only)`
    : b.state === 'keyword-only' ? `smart matching unavailable (${b.error || 'model not loaded'}) — typed search still works`
    : '';
  return `${parts}${st ? ' — ' + st : ''}`;
}
copilot.on('bank:status', (b) => { state.bank = b; $('bankStatus').textContent = bankStatusText(b); $('bankCount').textContent = bankStatusText(b); });

let bankTimer = null;
$('btnBank').onclick = () => { toggle('bankPanel'); $('bankCount').textContent = bankStatusText(state.bank); setTimeout(() => $('bankQuery').focus(), 0); };
$('bankQuery').addEventListener('input', () => {
  clearTimeout(bankTimer);
  bankTimer = setTimeout(async () => {
    const q = $('bankQuery').value.trim();
    if (!q) { $('bankResults').innerHTML = ''; return; }
    const { matches } = await copilot.bankSearch(q);
    $('bankResults').innerHTML = matches.length ? matches.map((m, i) =>
      `<details class="bank-item"${i === 0 ? ' open' : ''}><summary><b>${esc(m.q)}</b> <span class="muted small">${m.source && m.source.startsWith('project:') ? 'Your project · ' : ''}${esc(m.topic || '')} · ${esc(m.level || '')}</span></summary>${entryBody(m)}</details>`
    ).join('') : '<div class="muted">No match.</div>';
  }, 200);
});

// ---------------- dropdowns drawn inside the overlay ----------------
// On Windows a native <select> opens its list in a separate pop-up window, which screen sharing
// can see even with "Hide from screen share" on. Each <select> is kept (hidden) for its value and
// change events, and shown as a button + list drawn inside this window instead.
function refreshSelects() { for (const label of selectLabels.values()) label(); }
function enhanceSelect(sel) {
  if (sel.dataset.enhanced) return;
  sel.dataset.enhanced = '1';
  const wrap = document.createElement('span');
  wrap.className = 'xsel' + (sel.classList.contains('mode') ? ' mode' : '');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'xsel-btn';
  btn.title = sel.title || '';
  const list = document.createElement('div');
  list.className = 'xsel-list hidden';
  sel.parentNode.insertBefore(wrap, sel);
  wrap.append(btn, list, sel);
  sel.style.display = 'none';
  if (sel.id) btn.id = sel.id + 'Btn';
  const label = () => { const o = sel.options[sel.selectedIndex]; btn.textContent = (o ? o.textContent : '') + ' ▾'; };
  // Keep the button in step when the options are rebuilt; refreshSelects() after code sets values.
  selectLabels.set(sel, label);
  new MutationObserver(label).observe(sel, { childList: true, subtree: true });
  const close = () => list.classList.add('hidden');
  btn.onclick = (ev) => {
    ev.stopPropagation();
    const open = list.classList.contains('hidden');
    document.querySelectorAll('.xsel-list').forEach(l => l.classList.add('hidden'));
    if (!open) return;
    list.innerHTML = [...sel.options].map((o, i) =>
      `<div class="xsel-opt${i === sel.selectedIndex ? ' on' : ''}" data-i="${i}">${esc(o.textContent)}</div>`).join('');
    list.querySelectorAll('.xsel-opt').forEach(el => el.onclick = (e2) => {
      e2.stopPropagation();
      sel.selectedIndex = Number(el.dataset.i);
      label();
      close();
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    list.classList.remove('hidden');
    // Open upwards when there is no room below (small overlay).
    const r = btn.getBoundingClientRect();
    list.classList.toggle('up', r.bottom + 220 > window.innerHeight && r.top > window.innerHeight - r.bottom);
  };
  label();
}
document.addEventListener('click', () => document.querySelectorAll('.xsel-list').forEach(l => l.classList.add('hidden')));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('.xsel-list').forEach(l => l.classList.add('hidden')); });
document.querySelectorAll('select').forEach(enhanceSelect);

// ---------------- practice interview ----------------
const P = { info: null, opts: null, queue: [], i: 0, results: [], target: 0, pending: 0, error: '' };
const LEVEL_NAME = { fresher: 'basic', mid: 'mid', senior: 'senior' };

function pView(v) { for (const id of ['pSetup', 'pQuestion', 'pSummary']) $(id).classList.toggle('hidden', id !== v); }

async function openPractice() {
  expandIfCompact();
  show('practicePanel');
  P.info = await copilot.practiceInfo();
  renderPracticeSetup();
  pView('pSetup');
}

function renderPracticeSetup() {
  const s = P.info.settings || {};
  const chosen = new Set(s.focus && s.focus.length ? s.focus : ['basics']);
  $('pAreas').innerHTML = P.info.areas
    .filter(a => a.count > 0 || (a.key === 'resume' && P.info.hasResume))
    .map(a => `<label class="chip${chosen.has(a.key) ? ' on' : ''}" title="${esc(a.hint)}"><input type="checkbox" value="${a.key}"${chosen.has(a.key) ? ' checked' : ''}> ${esc(a.label)}${a.count ? ` <span class="muted">${a.count}</span>` : ''}</label>`).join('');
  $('pAreas').querySelectorAll('input').forEach(i => i.onchange = () => i.parentNode.classList.toggle('on', i.checked));
  $('pExperience').value = s.experience || 'five';
  $('pCount').value = String(s.count || 10);
  $('pSource').value = s.source || 'booklet';
  $('pBasics').checked = s.basics !== false;
  $('pMine').checked = s.mine !== false;
  $('pSpeak').checked = !!s.speak;
  refreshSelects();
  const h = P.info.history;
  $('pHistory').textContent = h.seen ? `${h.seen} practised · ⭐ ${h.starred} to revise` : '';
  for (const id of ['pStarred', 'pStarred2']) $(id).classList.toggle('hidden', !h.starred);
}

function practiceOptions() {
  return {
    focus: [...$('pAreas').querySelectorAll('input:checked')].map(i => i.value),
    experience: $('pExperience').value, count: Number($('pCount').value), source: $('pSource').value,
    basics: $('pBasics').checked, mine: $('pMine').checked, speak: $('pSpeak').checked
  };
}

async function startPractice(starred = false) {
  const opts = practiceOptions();
  P.opts = opts;
  P.results = [];
  P.i = 0;
  P.error = '';
  const res = await copilot.practiceStart({ ...opts, starred });
  P.queue = res.questions || [];
  P.target = starred ? P.queue.length : opts.count;
  if (!starred && opts.source !== 'booklet') generateMore(opts.source === 'claude' ? opts.count : opts.count - P.queue.length);
  pView('pQuestion');
  showPracticeQuestion();
}

// New questions from Claude, five at a time, slotted in between the booklet ones.
async function generateMore(n) {
  while (n > 0) {
    const batch = Math.min(5, n);
    P.pending += batch;
    if (!P.queue[P.i]) showPracticeQuestion();
    const res = await copilot.practiceGenerate({ focus: P.opts.focus, experience: P.opts.experience, count: batch, avoid: P.queue.map(q => q.q) });
    P.pending -= batch;
    if (res.error || !res.questions.length) { P.error = res.error || 'Claude returned no questions.'; P.target = Math.min(P.target, P.queue.length); break; }
    // Interleave with the booklet questions not yet asked.
    const rest = P.queue.splice(P.i + 1);
    const merged = [];
    while (rest.length || res.questions.length) { if (res.questions.length) merged.push(res.questions.shift()); if (rest.length) merged.push(rest.shift()); }
    P.queue.push(...merged);
    n -= batch;
    if (!$('pQuestion').classList.contains('hidden') && $('pQ').dataset.waiting) showPracticeQuestion();
  }
  if (!$('pQuestion').classList.contains('hidden') && $('pQ').dataset.waiting) showPracticeQuestion();
}

function showPracticeQuestion() {
  if (P.i >= P.target) return finishPractice();
  const q = P.queue[P.i];
  $('pFeedback').classList.add('hidden');
  $('pAnswer').classList.add('hidden');
  $('pMy').value = '';
  if (!q) {
    if (P.pending > 0) {
      $('pQ').dataset.waiting = '1';
      $('pMeta').textContent = `Question ${P.i + 1} of ${P.target}`;
      $('pQ').innerHTML = '<span class="thinking">Claude is preparing interview questions for you…</span>';
      return;
    }
    if (P.error) $('pSumLine').textContent = P.error;
    return finishPractice();
  }
  delete $('pQ').dataset.waiting;
  const kind = /scenario|troubleshooting|design/.test(q.type) ? 'Scenario' : q.type === 'comparison' ? 'Comparison' : 'Concept';
  $('pMeta').textContent = `Question ${P.i + 1} of ${P.target} · ${q.topic || ''} · ${kind} · ${LEVEL_NAME[q.level] || q.level || ''}${q.source === 'claude' ? ' · new from Claude' : ''}`;
  $('pQ').textContent = q.q;
  $('pStar').textContent = q.starred ? '★' : '☆';
  copilot.practiceMark({ question: q, seen: true });
  if (P.opts.speak && window.speechSynthesis) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(q.q);
      u.lang = 'en-US';
      u.rate = 1;
      speechSynthesis.speak(u);
    } catch { /* no voice available */ }
  }
}

function practiceResult() {
  const q = P.queue[P.i];
  let r = P.results.find(x => x.q === q);
  if (!r) { r = { q, shown: false, score: null }; P.results.push(r); }
  return r;
}

$('btnPractice').onclick = () => openPractice();
$('pStart').onclick = () => startPractice(false);
$('pStarred').onclick = () => startPractice(true);
$('pStarred2').onclick = () => startPractice(true);
$('pAgain').onclick = () => openPractice();
$('pShow').onclick = () => {
  const q = P.queue[P.i]; if (!q) return;
  practiceResult().shown = true;
  $('pAnswer').innerHTML = `<div class="claude-head">Model answer</div>${entryPoints(q)}`;
  $('pAnswer').classList.remove('hidden');
};
$('pCheck').onclick = async () => {
  const q = P.queue[P.i]; if (!q) return;
  const mine = $('pMy').value.trim();
  const fb = $('pFeedback');
  fb.classList.remove('hidden');
  if (!mine) { fb.innerHTML = '<span class="muted">Type your answer first (a few lines is enough), then Check.</span>'; return; }
  fb.innerHTML = '<span class="thinking">Claude is checking your answer…</span>';
  const r = await copilot.practiceFeedback({ q: q.q, modelAnswer: [q.a, ...(q.points || [])].join('\n'), myAnswer: mine });
  if (P.queue[P.i] !== q) return;
  if (r.error) { fb.innerHTML = `<span class="error">${esc(r.error)}</span>`; return; }
  practiceResult().score = r.score;
  const list = (title, items) => items.length ? `<div class="fb-title">${title}</div><ul>${items.map(x => `<li>${inline(x)}</li>`).join('')}</ul>` : '';
  fb.innerHTML = `<div class="fb-score">Score: <b>${r.score}/10</b></div>` + list('✅ Good', r.good) + list('➕ Missing', r.missing) + list('🗣 Say it like this', r.better);
};
$('pNext').onclick = () => { practiceResult(); P.i++; showPracticeQuestion(); };
$('pEnd').onclick = () => { if (P.queue[P.i]) practiceResult(); finishPractice(); };
$('pStar').onclick = async () => {
  const q = P.queue[P.i]; if (!q) return;
  q.starred = !q.starred;
  $('pStar').textContent = q.starred ? '★' : '☆';
  P.info.history = await copilot.practiceMark({ question: q, starred: q.starred });
};

async function finishPractice() {
  if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch {}
  const done = P.results.length;
  const scored = P.results.filter(r => r.score !== null);
  const avg = scored.length ? (scored.reduce((s, r) => s + r.score, 0) / scored.length) : null;
  if (P.opts && done) P.info.history = await copilot.practiceFinish({ focus: P.opts.focus, experience: P.opts.experience, asked: done, checked: scored.length, avgScore: avg });
  const line = `${done} question${done === 1 ? '' : 's'}${avg !== null ? ` · average score ${avg.toFixed(1)}/10` : ''}`;
  $('pSumLine').textContent = P.error && done < P.target ? `${line} · ${P.error}` : line;
  $('pSumList').innerHTML = P.results.map(r => `<li><span>${esc(r.q.q)}</span> <span class="muted small">${r.score !== null ? `${r.score}/10` : r.shown ? 'answer viewed' : 'skipped'}${r.q.starred ? ' · ⭐' : ''}</span></li>`).join('');
  $('pStarred2').classList.toggle('hidden', !(P.info && P.info.history && P.info.history.starred));
  pView('pSummary');
}

// ---------------- end-to-end self test ----------------
const TEST_ICON = { running: '⏳', ok: '✅', warn: '⚠️', fail: '❌' };
const testSteps = new Map();
let selfTestRunning = false;
let selfTestAnswerId = null;

function setTestStep(s) { testSteps.set(s.id, { ...(testSteps.get(s.id) || {}), ...s }); renderSelfTest(); }
function renderSelfTest() {
  $('selftestSteps').innerHTML = [...testSteps.values()].map(s =>
    `<li class="st-${s.status}"><span class="st-icon">${TEST_ICON[s.status] || ''}</span><b>${esc(s.label)}</b>${s.detail ? `<div class="muted small">${esc(s.detail)}</div>` : ''}</li>`).join('');
}
copilot.on('selftest:step', setTestStep);
copilot.on('selftest:open', () => runSelfTest());

async function runSelfTest() {
  expandIfCompact();
  show('selftestPanel');
  if (selfTestRunning) return;
  selfTestRunning = true;
  testSteps.clear();
  selfTestAnswerId = null;
  $('btnSelfTestAnswer').classList.add('hidden');
  $('selftestSummary').textContent = 'Testing… (the first run can take a few minutes while the Q&A bank is prepared)';
  renderSelfTest();
  let res = { ok: false, transcript: '' };
  try { res = await copilot.selfTest(); } catch (err) { setTestStep({ id: 'error', label: 'Test', status: 'fail', detail: err.message }); }
  await meetingPipelineTest(res.transcript);
  setTestStep({ id: 'live', label: 'Your live check (1 minute)', status: 'warn',
    detail: 'Press Listen, then play any Salesforce interview video (YouTube) with sound. Words should appear in the bar under the toolbar, and questions should get answers. Use headphones? Turn on ⚙ → Also transcribe my mic only if you want your own voice too.' });
  const steps = [...testSteps.values()];
  const fails = steps.filter(s => s.status === 'fail').length;
  const warns = steps.filter(s => s.status === 'warn' && s.id !== 'live').length;
  $('selftestSummary').textContent = fails ? `${fails} problem${fails > 1 ? 's' : ''} to fix — see ❌ above.`
    : warns ? `Working, with ${warns} thing${warns > 1 ? 's' : ''} to check (⚠️).` : 'Everything works ✓ — do the 1-minute live check and you are ready.';
  show('selftestPanel');
  selfTestRunning = false;
}

// A recorded interview question goes through exactly what a live meeting uses:
// transcript → question detection → instant Q&A-bank answer → Claude's answer.
async function meetingPipelineTest(transcript) {
  const step = { id: 'pipeline', label: 'Full meeting flow (recorded question → answer)' };
  if (!transcript) { setTestStep({ ...step, status: 'warn', detail: 'Skipped: needs the speech-to-text step to pass.' }); return; }
  setTestStep({ ...step, status: 'running', detail: `Playing "${transcript}" through the meeting flow…` });
  const before = seq;
  if (!looksLikeQuestion(transcript)) { setTestStep({ ...step, status: 'fail', detail: `"${transcript}" was not recognised as a question.` }); return; }
  if (state.config.autoAnswer) { pending = (pending + ' ' + transcript).trim(); flushUtterance(); }
  else { utterances.push({ text: transcript, at: Date.now(), isQ: true }); renderTranscript(); ask({ question: transcript }); }
  const e = await waitFor(() => answers.find(a => a.id > before), 15000);
  if (!e) { setTestStep({ ...step, status: 'fail', detail: 'The question was heard but no answer started.' }); return; }
  selfTestAnswerId = e.id;
  await waitFor(() => ['done', 'error', 'cancelled'].includes(e.status), 120000);
  const bankMs = e.bankMs;
  // Smart / booklet-only mode answered from the booklet: also check Claude's answer, as "Ask Claude" would.
  if (e.status === 'done' && e.bankOnly) {
    askClaudeToo(e);
    await waitFor(() => ['done', 'error', 'cancelled'].includes(e.status), 120000);
    e.bankMs = bankMs;
  }
  const parts = [];
  if (e.bank) parts.push(`instant answer in ${e.bankMs < 1000 ? `${e.bankMs} ms` : `${(e.bankMs / 1000).toFixed(1)} s`} ("${e.bank[0].q}")`);
  else if (state.config.answerSource !== 'claude') parts.push('no instant answer for this one');
  if (e.status === 'done') parts.push(`Claude answered in ${(e.totalMs / 1000).toFixed(1)} s`);
  $('btnSelfTestAnswer').classList.remove('hidden');
  if (e.status === 'error') setTestStep({ ...step, status: 'fail', detail: `Claude failed: ${e.answer}` });
  else if (e.status !== 'done') setTestStep({ ...step, status: 'fail', detail: 'No answer within 2 minutes.' });
  else setTestStep({ ...step, status: 'ok', detail: parts.join(' · ') });
}
function waitFor(check, ms) {
  return new Promise(resolve => {
    const t0 = Date.now();
    const tick = () => { const v = check(); if (v || Date.now() - t0 > ms) return resolve(v || null); setTimeout(tick, 200); };
    tick();
  });
}
$('btnSelfTest').onclick = () => runSelfTest();
$('btnSelfTestAgain').onclick = () => runSelfTest();
$('btnSelfTestAnswer').onclick = () => {
  const i = answers.findIndex(a => a.id === selfTestAnswerId);
  if (i >= 0) { viewIndex = i; show('card'); renderAnswer(true); }
};

// ---------------- project Q&A ----------------
copilot.on('project:progress', (p) => {
  if (!$('projectQAStatus')) return;
  $('projectQAStatus').textContent = p.error
    ? `Part ${p.step} of ${p.total} (${p.group}) failed: ${p.error}`
    : `Reading ${p.name}: part ${p.step} of ${p.total} (${p.group})…`;
});
$('btnSaveDeepgram').onclick = async () => {
  const key = $('deepgramKey').value;
  $('btnSaveDeepgram').disabled = true;
  $('deepgramResult').textContent = 'Checking the key with Deepgram…';
  const res = await copilot.setDeepgramKey(key);
  $('btnSaveDeepgram').disabled = false;
  const { keyResult, ...rest } = res;
  state = rest;
  renderSettings();
  $('deepgramResult').textContent = keyResult || '';
  if (state.deepgramKey) $('deepgramKey').value = '';
};
$('optModel').onchange = (e) => setOpt('localModel', e.target.value);
$('btnDownloadModel').onclick = async () => {
  $('btnDownloadModel').disabled = true;
  state = await copilot.sttInstall();
  $('btnDownloadModel').disabled = false;
  renderSettings();
  if (state.modelInstalled) notice('');
};

copilot.on('hotkey', (name) => {
  if (name === 'answer') ask({});
  if (name === 'screenshot') ask({ withScreenshot: true });
});

(async () => {
  [state, presets] = await Promise.all([copilot.getState(), copilot.getPresets()]);
  draft = { ...state.config.meeting };
  renderSettings();
  renderSetup();
  renderSetupLabel();
  // Before a meeting: open the setup first; if nothing is configured yet, open projects & keys.
  if (!(state.config.projectFolders || []).length || !state.canAnswer) show('settings');
  else show('setup');
})();
