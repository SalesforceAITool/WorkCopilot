// Overlay UI: question detection, live transcript → auto answer, failures, meeting setup.
// Runs the real index.html + renderer.js in jsdom with the preload API and browser media stubbed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const presets = require('../src/presets');

const HTML = fs.readFileSync(path.join(__dirname, '../src/renderer/index.html'), 'utf8').replace(/<script[^>]*><\/script>/, '');
const JS = fs.readFileSync(path.join(__dirname, '../src/renderer/renderer.js'), 'utf8');
const tick = (ms = 0) => new Promise(r => setTimeout(r, ms));
const windows = [];
const BANK_HITS = [
  { id: 'proj-qtc-001', q: 'How did you use price rules in QTC?', a: 'Our **price rules** set the Amkor price.', points: ['Runs on calculate'], code: 'SBQQ__PriceRule__c r;', topic: 'QTC project — classes', level: 'mid', source: 'project:qtc', confidence: 0.82 },
  { id: 'cpq-001', q: 'What is a CPQ price rule?', a: 'A price rule sets quote line values <script>x</script>.', points: [], topic: 'Salesforce CPQ', level: 'mid', source: 'bank', confidence: 0.79 }
];
test.after(() => windows.forEach(w => w.close()));

async function load({ stateOverrides = {}, wsBehavior = 'open', audioLevel = 0.1 } = {}) {
  const dom = new JSDOM(HTML, { runScripts: 'outside-only', url: 'file:///index.html' });
  const w = dom.window;
  windows.push(w);
  const handlers = {};
  const calls = { ask: [], setMeeting: [], warm: 0, cancel: 0, deepgramKeys: [] };
  const level = { value: audioLevel };
  const tracks = [];
  const sockets = [];
  let st = {
    config: { projectFolders: ['C:/proj/qtc', 'C:/proj/fsl'], autoAnswer: true, includeMic: false,
      transcriptLanguage: 'multi', hideFromScreenShare: true, meeting: presets.resolveMeeting({}) },
    stats: { files: 7, approxTokens: 300, mode: 'full' }, hasAnthropicKey: true, deepgramKey: 'dg', activeFolders: [],
    canAnswer: true, answerEngine: 'claude-code', claudeCodeFound: true, transcriber: 'deepgram',
    localModels: { parakeet: 'Parakeet v2', turbo: 'Whisper turbo', base: 'Whisper base' }, modelInstalled: true,
    ...stateOverrides
  };
  w.copilot = {
    getState: async () => st,
    getPresets: async () => ({ speed: presets.SPEED, style: presets.STYLE, language: presets.LANGUAGE, scenarios: presets.SCENARIOS }),
    on: (c, f) => (handlers[c] = f),
    ask: (p) => calls.ask.push(p),
    setMeeting: async (m) => { calls.setMeeting.push(m); st = { ...st, config: { ...st.config, meeting: presets.resolveMeeting(m) } }; return st; },
    warm: async () => { calls.warm++; return { warmed: true }; },
    setOption: async (k, v) => { (calls.setOption = calls.setOption || []).push([k, v]); st = { ...st, config: { ...st.config, [k]: v } }; return st; }, cancel: () => calls.cancel++, hide() {}, quit() {},
    bankSearch: async (q) => { (calls.bankSearch = calls.bankSearch || []).push(q); return { matches: BANK_HITS }; },
    buildProjectQA: async (f) => { (calls.buildQA = calls.buildQA || []).push(f); handlers['project:progress']({ name: 'qtc', step: 2, total: 8, group: 'classes' }); calls.progressShown = w.document.getElementById('projectQAStatus').textContent; return { ...st, buildResult: 'Built 64 project questions for qtc.' }; },
    addFolder: async () => st, reindex: async () => st, removeFolder: async () => st,
    deepgramUrl: async () => 'wss://api.deepgram.com/v1/listen?model=nova-3&language=multi&keyterm=Queueable',
    setDeepgramKey: async (k) => {
      calls.deepgramKeys.push(k);
      if (k === 'good-key-1234567890abcd') { st = { ...st, deepgramKey: 'set', transcriber: 'deepgram' }; return { ...st, keyResult: 'Key works ✓ — meeting transcription switched to Deepgram.' }; }
      return { ...st, keyResult: 'Deepgram rejected this key. Create a new one at console.deepgram.com → API Keys.' };
    },
    toggleCompact() {}, toggleMaximize() {}, minimize() {}, expand() {}, getBounds: async () => ({ x: 0, y: 0, width: 780, height: 520 }),
    sttInstall: async () => st, sttStart: async () => true, sttAudio() {}, sttStop: async () => {}
  };
  // ---- browser media stubs ----
  const mkTrack = () => { const t = { stopped: false, stop() { this.stopped = true; } }; tracks.push(t); return t; };
  w.navigator.mediaDevices = {
    getDisplayMedia: async () => { const a = mkTrack(), v = mkTrack(); return { getAudioTracks: () => [a], getTracks: () => [a, v] }; },
    getUserMedia: async () => { const a = mkTrack(); return { getTracks: () => [a] }; }
  };
  w.MediaStream = class { constructor(t) { this.t = t; } };
  w.AudioContext = class {
    constructor() { this.sampleRate = 48000; this.destination = {}; }
    createMediaStreamDestination() { return { stream: {} }; }
    createMediaStreamSource() { return { connect() {} }; }
    createGain() { return { gain: { value: 1 }, connect() {} }; }
    createScriptProcessor() { return { connect() {}, disconnect() {} }; }
    createAnalyser() { return { fftSize: 1024, getFloatTimeDomainData(buf) { buf.fill(level.value); } }; }
    close() { this.closed = true; }
  };
  w.MediaRecorder = class { constructor() { this.state = 'inactive'; } start() { this.state = 'recording'; } stop() { this.state = 'inactive'; } };
  w.WebSocket = class {
    constructor(url, protocols) {
      this.url = url; this.protocols = protocols; this.readyState = 0; this.sent = []; sockets.push(this);
      setTimeout(() => {
        if (wsBehavior === 'open') { this.readyState = 1; this.onopen && this.onopen(); }
        else { this.readyState = 3; this.onclose && this.onclose({ code: 1008, reason: 'unauthorized' }); }
      }, 0);
    }
    send(d) { this.sent.push(d); }
    close() { this.readyState = 3; }
  };
  w.eval(JS);
  await tick(5);
  const deepgram = (text, { final = true, speech = true } = {}) => sockets.at(-1).onmessage({
    data: JSON.stringify({ type: 'Results', is_final: final, speech_final: speech, channel: { alternatives: [{ transcript: text }] } })
  });
  return { w, doc: w.document, handlers, calls, tracks, sockets, deepgram, level, $: (id) => w.document.getElementById(id) };
}

test('question detection: English, Hinglish, and ordinary talk', async () => {
  const { w } = await load();
  const q = (s) => w.eval(`looksLikeQuestion(${JSON.stringify(s)})`);
  assert.equal(q('Why did you use a queueable for the price revision?'), true);
  assert.equal(q('so how does the upload work on mobile'), true);
  assert.equal(q('kaise kiya tumne ye integration'), true);
  assert.equal(q('ok I will share my screen now'), false);
  assert.equal(q('why?'), false); // too short to act on
});

test('live transcript: a detected question is answered automatically, after it is finished', async () => {
  const t = await load();
  t.$('btnListen').click();
  await tick(5);
  assert.equal(t.$('listenLabel').textContent, 'Listening');
  assert.match(t.sockets[0].url, /model=nova-3.*keyterm=Queueable/);
  assert.deepEqual([...t.sockets[0].protocols], ['token', 'dg']);

  t.deepgram('Why did you use a', { final: false, speech: false });
  t.deepgram('Why did you use a queueable');
  assert.equal(t.calls.ask.length, 0, 'answered before the speaker finished');
  t.deepgram('for the price revision?');            // same question, after a pause
  await tick(1300);
  assert.equal(t.calls.ask.length, 1);
  assert.equal(t.calls.ask[0].question, 'Why did you use a queueable for the price revision?');
});

test('a second question during a fresh answer is queued and answered next, not dropped', async () => {
  const t = await load();
  t.$('btnListen').click();
  await tick(5);
  t.deepgram('Why did you use a queueable for the price revision?');
  await tick(1300);
  const first = t.calls.ask[0].id;
  t.deepgram('And how did you test that callout?');
  await tick(1300);
  assert.equal(t.calls.ask.length, 1, 'cut off the answer that had just started');
  t.handlers['answer:done']({ id: first });
  await tick(5);
  assert.equal(t.calls.ask.length, 2);
  assert.equal(t.calls.ask[1].question, 'And how did you test that callout?');
});

test('pressing Listen twice quickly starts only one capture', async () => {
  const t = await load();
  t.w.eval('toggleListening(); startListening();');
  await tick(10);
  assert.equal(t.sockets.length, 1);
});

test('a dropped Deepgram connection reconnects by itself', async () => {
  const t = await load();
  t.$('btnListen').click();
  await tick(5);
  const s0 = t.sockets[0];
  s0.readyState = 3;
  s0.onclose({ code: 1006, reason: '' });
  assert.match(t.$('notice').textContent, /reconnecting \(1\/3\)/);
  await tick(1100);
  assert.equal(t.sockets.length, 2);
  assert.equal(t.$('listenLabel').textContent, 'Listening');
});

test('Deepgram rejecting the key: capture is released and the user is told why', async () => {
  const t = await load({ wsBehavior: 'reject' });
  t.$('btnListen').click();
  await tick(10);
  assert.ok(t.tracks.length >= 2);
  assert.ok(t.tracks.every(tr => tr.stopped), 'screen/audio capture left running');
  assert.equal(t.$('listenLabel').textContent, 'Listen');
  assert.match(t.$('notice').textContent, /Could not connect to Deepgram \(code 1008\)/);
});

test('missing Deepgram key: no capture starts, clear message', async () => {
  const t = await load({ stateOverrides: { deepgramKey: '' } });
  t.$('btnListen').click();
  await tick(5);
  assert.equal(t.tracks.length, 0);
  assert.match(t.$('notice').textContent, /DEEPGRAM_API_KEY is missing/);
});

test('Answer with nothing heard does not call Claude', async () => {
  const t = await load();
  t.$('btnAnswer').click();
  assert.equal(t.calls.ask.length, 0);
  assert.match(t.$('notice').textContent, /Nothing heard yet/);
});

test('streamed answer renders as talking points; HTML from the model is escaped', async () => {
  const t = await load();
  const chat = t.$('chat');
  chat.value = 'what is a governor limit?';
  chat.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Enter' }));
  const { id } = t.calls.ask[0];
  t.handlers['answer:meta']({ id, mode: 'full', sourceCount: 7, speed: 'fast' });
  t.handlers['answer:delta']({ id, delta: '**General:** Limits per transaction.\n- 100 SOQL queries <img src=x onerror=alert(1)>\nFiles: none' });
  t.handlers['answer:done']({ id });
  const a = t.$('a').innerHTML;
  assert.match(a, /<b>General:<\/b>/);
  assert.match(a, /<li>100 SOQL queries &lt;img/);
  assert.equal(t.$('a').querySelector('img'), null);
  assert.match(t.$('meta').textContent, /Fast · whole project/);
});

test('an answer replaced by a newer question is marked stopped, not left spinning', async () => {
  const t = await load();
  const chat = t.$('chat');
  chat.value = 'first?'; chat.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Enter' }));
  const first = t.calls.ask[0].id;
  t.handlers['answer:cancelled']({ id: first });
  assert.match(t.$('meta').textContent, /stopped \(newer question\)/);
});

test('meeting setup opens first and saves speed, scenario example, style and folders', async () => {
  const t = await load();
  assert.equal(t.$('setup').classList.contains('hidden'), false);

  t.doc.querySelector('[data-speed="accurate"]').click();
  const sc = t.$('mScenario');
  sc.value = 'client_demo';
  sc.dispatchEvent(new t.w.Event('change'));
  assert.match(t.$('mBrief').placeholder, /^Example: Demo of the Field Service/);
  assert.equal(t.$('mStyle').value, 'points'); // follows the scenario's default style
  t.$('useExample').click();
  assert.match(t.$('mBrief').value, /business users/);

  const fsl = t.doc.querySelector('[data-folder="C:/proj/fsl"]');
  fsl.checked = false;
  fsl.dispatchEvent(new t.w.Event('change'));

  t.$('btnStart').click();
  for (let i = 0; i < 100 && t.$('listenLabel').textContent !== 'Listening'; i++) await tick(10);
  const saved = t.calls.setMeeting.at(-1);
  assert.equal(saved.speed, 'accurate');
  assert.equal(saved.scenario, 'client_demo');
  assert.equal(saved.style, 'points');
  assert.deepEqual([...saved.folders], ['C:/proj/qtc']);
  assert.match(saved.brief, /business users/);
  assert.equal(t.calls.warm, 1);
  assert.equal(t.$('listenLabel').textContent, 'Listening');
  assert.match(t.$('setupLabel').textContent, /Most accurate · Client demo/);
});

test('first run without folders or key opens projects & keys instead of setup', async () => {
  const t = await load({ stateOverrides: { hasAnthropicKey: false, canAnswer: false, answerEngine: 'api' } });
  assert.equal(t.$('settings').classList.contains('hidden'), false);
  assert.match(t.$('keys').textContent, /ANTHROPIC_API_KEY/);
});

test('audio meter moves while listening; 20 s of silence gives the mic tip, sound clears it', async () => {
  const t = await load({ audioLevel: 0.1 });
  t.$('btnListen').click();
  await tick(400);
  assert.equal(t.$('level').classList.contains('hidden'), false);
  assert.notEqual(t.$('levelFill').style.width, '0%');
  t.level.value = 0;
  await tick(300);
  const realNow = t.w.Date.now.bind(t.w.Date);
  t.w.Date.now = () => realNow() + 21000; // 21 s of silence later
  await tick(300);
  assert.match(t.$('notice').textContent, /Not hearing any audio for 20 seconds.*Also transcribe my mic/);
  t.level.value = 0.1;
  await tick(300);
  assert.equal(t.$('notice').classList.contains('hidden'), true);
  t.$('btnListen').click();
  await tick(20);
  assert.equal(t.$('level').classList.contains('hidden'), true);
});

test('Deepgram key pasted in settings: rejected key explained, good key switches to Deepgram', async () => {
  const t = await load({ stateOverrides: { deepgramKey: '', transcriber: 'local' } });
  t.$('btnSettings').click();
  assert.match(t.$('deepgramHint').textContent, /\$200 free credit/);
  t.$('deepgramKey').value = 'bad-key-1234567890abcd';
  t.$('btnSaveDeepgram').click();
  await tick(20);
  assert.match(t.$('deepgramResult').textContent, /rejected/);
  t.$('deepgramKey').value = 'good-key-1234567890abcd';
  t.$('btnSaveDeepgram').click();
  await tick(20);
  assert.match(t.$('deepgramResult').textContent, /Key works/);
  assert.equal(t.$('optEngine').value, 'deepgram');
  assert.equal(t.$('deepgramKey').value, '');
});

test('meeting terms are saved with the meeting setup', async () => {
  const t = await load();
  const f = t.$('mTerms');
  f.value = 'Amkor, QTC-1566';
  f.dispatchEvent(new t.w.Event('input'));
  t.$('btnSaveSetup').click();
  await tick(20);
  assert.equal(t.calls.setMeeting.at(-1).terms, 'Amkor, QTC-1566');
});

test('Q&A bank: instant stored answer shows first, Claude adds below; "Also close" switches; code is folded', async () => {
  const t = await load();
  const chat = t.$('chat');
  chat.value = 'how do CPQ price rules work?';
  chat.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Enter' }));
  const { id } = t.calls.ask[0];
  t.handlers['answer:bank']({ id, matches: BANK_HITS });
  let a = t.$('a');
  assert.match(a.querySelector('.bank-head').textContent, /Your project.*QTC project — classes · 82% match/);
  assert.match(a.textContent, /Claude is adding to this/);
  assert.equal(a.querySelector('details.code').open, false);
  assert.equal(a.querySelector('script'), null, 'stored text is escaped');
  t.handlers['answer:delta']({ id, delta: '**Answer:** In QTC I used price rules for SAP prices.' });
  a = t.$('a');
  assert.ok(a.innerHTML.indexOf('bank-head') < a.innerHTML.indexOf('In QTC I used'), 'stored answer stays on top');
  assert.ok(a.querySelector('.claude-head'));
  a.querySelector('[data-alt="1"]').click();
  assert.match(t.$('a').querySelector('.bank-q').textContent, /What is a CPQ price rule/);
  assert.match(t.$('a').querySelector('.bank-head').textContent, /79% match/);
  assert.match(t.$('a').textContent, /In QTC I used price rules/, 'Claude part is kept when switching');
});

test('Q&A bank only mode: finished from the bank, no Claude section', async () => {
  const t = await load();
  const chat = t.$('chat');
  chat.value = 'price rules?';
  chat.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Enter' }));
  const { id } = t.calls.ask[0];
  t.handlers['answer:bank']({ id, matches: BANK_HITS.slice(0, 1) });
  t.handlers['answer:done']({ id, bankOnly: true });
  const a = t.$('a');
  assert.doesNotMatch(a.querySelector('.bank-head').textContent, /related answer/);
  assert.equal(a.querySelector('.claude-head'), null);
  assert.doesNotMatch(a.textContent, /Claude is adding|Reading your project/);
  assert.equal(a.querySelector('.also'), null);
});

test('a weaker bank match is labelled as related, not shown as a sure match', async () => {
  const t = await load();
  const chat = t.$('chat');
  chat.value = 'how did you lead the CPQ rollout?';
  chat.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Enter' }));
  const { id } = t.calls.ask[0];
  t.handlers['answer:bank']({ id, matches: [{ ...BANK_HITS[1], confidence: 0.58 }] });
  const head = t.$('a').querySelector('.bank-head').textContent;
  assert.match(head, /related answer — may not cover everything asked/);
  assert.doesNotMatch(head, /58%/);
});

test('Q&A bank panel searches as you type; settings: Answers choice, status line, Build Q&A per folder', async () => {
  const t = await load({ stateOverrides: { bank: { state: 'preparing', progress: 40, entries: 984, sources: [{ name: 'Salesforce Q&A', count: 920 }, { name: 'qtc', count: 64 }] } } });
  t.$('btnBank').click();
  assert.equal(t.$('bankPanel').classList.contains('hidden'), false);
  assert.match(t.$('bankCount').textContent, /qtc: 64.*preparing smart matching… 40%/);
  t.$('bankQuery').value = 'price rule';
  t.$('bankQuery').dispatchEvent(new t.w.Event('input'));
  await tick(260);
  assert.deepEqual(t.calls.bankSearch, ['price rule']);
  const items = t.$('bankResults').querySelectorAll('.bank-item');
  assert.equal(items.length, 2);
  assert.match(items[0].querySelector('summary').textContent, /Your project/);
  t.handlers['bank:status']({ state: 'ready', entries: 984, sources: [{ name: 'qtc', count: 64 }] });
  assert.match(t.$('bankCount').textContent, /smart matching ready/);

  t.$('btnSettings').click();
  await tick(5);
  assert.equal(t.$('optAnswerSource').value, 'smart');
  assert.equal(t.$('modeQuick').value, 'smart', 'mode picker on the main screen shows the same mode');
  t.$('optAnswerSource').value = 'bank';
  t.$('optAnswerSource').dispatchEvent(new t.w.Event('change'));
  await tick(1);
  assert.deepEqual(t.calls.setOption.at(-1), ['answerSource', 'bank']);
  const btn = t.doc.querySelector('[data-buildqa="C:/proj/qtc"]');
  assert.ok(btn, 'each project folder has a Build Q&A button');
  btn.click();
  await tick(5);
  assert.deepEqual(t.calls.buildQA, ['C:/proj/qtc']);
  assert.match(t.calls.progressShown, /part 2 of 8 \(classes\)/);
  assert.match(t.$('projectQAStatus').textContent, /Built 64 project questions/);
});
