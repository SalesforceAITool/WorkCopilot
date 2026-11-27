// Answers through the official, unmodified Claude Code CLI (`claude -p`) signed in with the
// user's own Claude Pro/Max plan. This app never reads or handles the login: Claude Code does.
// Anthropic allows an end user to sign in to the unmodified Claude Code binary with their own
// subscription (https://code.claude.com/docs/en/legal-and-compliance). Usage counts against the
// plan's normal limits.

const { spawn, execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { SPEED, resolveMeeting } = require('./presets');
const { systemPrompt } = require('./claude');

const MODEL_ALIAS = { fast: 'haiku', balanced: 'sonnet', accurate: 'opus' };

// Where `claude` lives: the configured path, the native installer's folder, or PATH.
function findClaude(configured) {
  if (configured) return fs.existsSync(configured) ? configured : null;
  const home = os.homedir();
  const candidates = process.platform === 'win32'
    ? [path.join(home, '.local', 'bin', 'claude.exe')]
    : [path.join(home, '.local', 'bin', 'claude'), path.join(home, '.claude', 'local', 'claude')];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  try {
    const out = execFileSync(process.platform === 'win32' ? 'where' : 'which', ['claude'], { encoding: 'utf8', windowsHide: true });
    const lines = out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    return lines.find(l => /\.exe$/i.test(l)) || lines.find(l => /\.cmd$/i.test(l)) || lines[0] || null;
  } catch { return null; }
}

// Plain-language versions of what Claude Code reports.
function friendlyError(text) {
  const t = String(text || '');
  if (/not logged in|please run \/login|login required|invalid api key|authenticat|oauth/i.test(t)) {
    return 'Claude Code is not signed in. Open a terminal, run "claude", choose to sign in with your Claude account (Pro/Max), then try again.';
  }
  if (/usage limit|limit reached|rate limit|429|overloaded/i.test(t)) {
    return 'Your Claude plan\'s usage limit is reached for now. It resets after a few hours; or switch ⚙ → Claude answers to "API key".';
  }
  if (/ENOENT|not recognized as an internal|command not found|could not find claude/i.test(t)) {
    return 'Claude Code is not installed. Install it (claude.com/code), sign in with your Claude account, then try again.';
  }
  return t.trim().split('\n').slice(-3).join(' ').slice(0, 400) || 'Claude Code stopped without an answer.';
}

class ClaudeCodeAnswerer {
  constructor({ name, role, claudePath } = {}) {
    this.name = name || 'me';
    this.role = role;
    this.claudePath = claudePath || '';
    this.workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'work-copilot-cc-')); // empty: no project CLAUDE.md picked up
    this.current = null;
    this.standby = null; // one process started ahead of time, waiting for its question
    this.oneShots = new Set(); // Build Q&A requests in flight
  }

  settings(meeting) {
    const m = resolveMeeting(meeting);
    return { meeting: m, model: MODEL_ALIAS[m.speed] || 'sonnet', speed: SPEED[m.speed] };
  }

  promptFile(meeting) {
    const text = systemPrompt(this.name, meeting, this.role);
    const key = crypto.createHash('sha1').update(text).digest('hex').slice(0, 12);
    const file = path.join(this.workDir, `system-${key}.txt`);
    if (!fs.existsSync(file)) fs.writeFileSync(file, text);
    return { file, key };
  }

  spawnProcess(model, systemFile, { oneShot = false } = {}) {
    const bin = findClaude(this.claudePath);
    if (!bin) throw new Error(friendlyError('could not find claude'));
    const io = oneShot
      ? ['--output-format', 'json']   // whole reply at the end; the prompt comes on stdin as text
      : ['--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose', '--include-partial-messages'];
    const args = [
      '-p',
      ...io,
      '--tools', '',                 // answer only: no file, shell or web tools
      '--strict-mcp-config',         // no MCP servers
      '--disable-slash-commands',
      '--no-session-persistence',
      '--model', model,
      '--system-prompt-file', systemFile
    ];
    // Never pass an API key or proxy to Claude Code: it must use the user's own plan sign-in,
    // not silently bill API credit.
    const env = { ...process.env };
    for (const k of ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL', 'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX']) delete env[k];
    const isCmd = process.platform === 'win32' && /\.(cmd|bat)$/i.test(bin);
    const child = isCmd
      ? spawn(`"${bin}" ${args.map(a => `"${a}"`).join(' ')}`, { cwd: this.workDir, env, shell: true, windowsHide: true })
      : spawn(bin, args, { cwd: this.workDir, env, windowsHide: true });
    const proc = { child, model, systemFile, stderr: '', exited: false, spawnError: null };
    child.stderr.on('data', d => { proc.stderr = (proc.stderr + d).slice(-4000); });
    child.on('error', err => { proc.spawnError = err; });
    child.on('exit', () => { proc.exited = true; });
    child.stdin.on('error', () => {});
    return proc;
  }

  takeProcess(model, systemFile) {
    const s = this.standby;
    this.standby = null;
    if (s && !s.exited && !s.spawnError && s.model === model && s.systemFile === systemFile) return s;
    if (s) kill(s.child);
    return this.spawnProcess(model, systemFile);
  }

  // Start the next process ahead of time (no question sent, so no usage).
  prepare(meeting) {
    try {
      const { model } = this.settings(meeting);
      const { file } = this.promptFile(meeting);
      if (this.standby && !this.standby.exited && this.standby.model === model && this.standby.systemFile === file) return;
      if (this.standby) kill(this.standby.child);
      this.standby = this.spawnProcess(model, file);
    } catch { /* reported when a question is asked */ }
  }

  warm(_context, meeting) { this.prepare(meeting); return Promise.resolve(); }

  cancel() {
    if (this.current) {
      this.current.cancelled = true;
      kill(this.current.proc.child);
      this.current = null;
    }
  }

  answer({ question, transcript, context, excerpts, screenshotBase64, onDelta, meeting }) {
    this.cancel();
    const { model } = this.settings(meeting);
    const { file } = this.promptFile(meeting);
    let proc;
    try { proc = this.takeProcess(model, file); } catch (err) { return Promise.reject(err); }
    const handle = { proc, cancelled: false };
    this.current = handle;

    const content = [{ type: 'text', text: context }];
    if (excerpts) content.push({ type: 'text', text: excerpts });
    if (screenshotBase64) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: screenshotBase64 } });
    content.push({
      type: 'text',
      text:
        (transcript ? `Recent meeting transcript (for context):\n${transcript}\n\n` : '') +
        (screenshotBase64 ? 'A screenshot of my screen is attached; use it if the question refers to it.\n\n' : '') +
        `Question I was just asked:\n${question || '(see transcript / screenshot — find the latest question)'}`
    });

    return new Promise((resolve, reject) => {
      const child = proc.child;
      let buf = '';
      let streamed = '';
      let result = null;
      const onLine = (line) => {
        if (!line.trim()) return;
        let msg;
        try { msg = JSON.parse(line); } catch { return; }
        if (msg.type === 'stream_event' && msg.event && msg.event.type === 'content_block_delta' &&
            msg.event.delta && msg.event.delta.type === 'text_delta') {
          streamed += msg.event.delta.text;
          if (!handle.cancelled && onDelta) onDelta(msg.event.delta.text);
        } else if (msg.type === 'assistant' && msg.message && Array.isArray(msg.message.content) && !streamed) {
          // No partial chunks (older CLI): show the whole message at once.
          const text = msg.message.content.filter(b => b.type === 'text').map(b => b.text).join('');
          if (text) { streamed = text; if (!handle.cancelled && onDelta) onDelta(text); }
        } else if (msg.type === 'result') {
          result = msg;
        }
      };
      child.stdout.on('data', (d) => {
        buf += d;
        let i;
        while ((i = buf.indexOf('\n')) >= 0) { onLine(buf.slice(0, i)); buf = buf.slice(i + 1); }
      });
      const finish = () => {
        if (buf) { onLine(buf); buf = ''; }
        if (this.current === handle) this.current = null;
        setImmediate(() => this.prepare(meeting)); // next answer starts without the CLI's startup delay
        if (handle.cancelled) { const e = new Error('cancelled'); e.cancelled = true; return reject(e); }
        if (proc.spawnError) return reject(new Error(friendlyError(proc.spawnError.code || proc.spawnError.message)));
        if (result && !result.is_error && result.subtype === 'success') {
          if (!streamed && result.result && onDelta) onDelta(result.result);
          return resolve({ usage: result.usage, model: `Claude Code · ${model}` });
        }
        reject(new Error(friendlyError((result && (result.result || result.subtype)) || proc.stderr || 'Claude Code stopped without an answer.')));
      };
      if (proc.exited) return finish();
      child.on('close', finish);
      const line = JSON.stringify({ type: 'user', message: { role: 'user', content }, parent_tool_use_id: null }) + '\n';
      child.stdin.write(line, () => child.stdin.end());
    });
  }

  // One request, whole reply as text (used to build project Q&A from the user's own repo).
  complete({ system, prompt, model = 'sonnet', timeoutMs = 8 * 60 * 1000 }) {
    fs.mkdirSync(this.workDir, { recursive: true });
    const file = path.join(this.workDir, `system-oneshot-${crypto.createHash('sha1').update(system).digest('hex').slice(0, 12)}.txt`);
    if (!fs.existsSync(file)) fs.writeFileSync(file, system);
    let proc;
    try { proc = this.spawnProcess(model, file, { oneShot: true }); } catch (err) { return Promise.reject(err); }
    this.oneShots.add(proc.child);
    return new Promise((resolve, reject) => {
      let out = '';
      const timer = setTimeout(() => { kill(proc.child); reject(new Error('Claude Code took too long to answer.')); }, timeoutMs);
      proc.child.stdout.on('data', d => { out += d; });
      proc.child.on('close', () => {
        clearTimeout(timer);
        this.oneShots.delete(proc.child);
        if (proc.child.__stopped) return reject(new Error('stopped because the Claude answers setting changed or the app closed'));
        if (proc.spawnError) return reject(new Error(friendlyError(proc.spawnError.code || proc.spawnError.message)));
        let msg;
        try { msg = JSON.parse(out.trim().split('\n').filter(Boolean).pop()); } catch { return reject(new Error(friendlyError(proc.stderr || out || 'Claude Code returned nothing.'))); }
        if (msg.is_error || msg.subtype !== 'success') return reject(new Error(friendlyError(msg.result || msg.subtype)));
        resolve(msg.result || '');
      });
      proc.child.stdin.end(prompt);
    });
  }

  dispose() {
    if (this.standby) kill(this.standby.child);
    for (const c of this.oneShots) { c.__stopped = true; kill(c); }
    this.cancel();
    try { fs.rmSync(this.workDir, { recursive: true, force: true }); } catch {}
  }
}

// On Windows a .cmd shim runs claude under cmd.exe: end the whole tree, not just the shell.
function kill(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    try { execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); return; } catch {}
  }
  try { child.kill(); } catch {}
}

module.exports = { ClaudeCodeAnswerer, findClaude, friendlyError, MODEL_ALIAS };
