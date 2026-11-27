// End-to-end self test: checks every part the app needs, one step at a time, and says in plain
// words what to fix. The last step (a recorded question → transcript → instant answer + Claude)
// is driven by the screen, through exactly the same code a live meeting uses.

const SAMPLE_QUESTION_FILE = 'self-test-question.wav'; // "Why did you use a queueable for the price revision callout?"

// Instant-answer checks: a question about the user's project, a general one, and meeting chatter.
const INSTANT_CHECKS = [
  { q: 'How does pricing work in your CPQ project?', want: 'project', label: 'project question → your project answer' },
  { q: 'What is Database.Stateful in batch Apex?', want: 'bank', label: 'general question → Q&A bank answer' },
  { q: 'Can everyone hear me okay?', want: 'none', label: 'small talk → no answer shown' }
];

// d: {
//   engine: 'claude-code' | 'api', claudeFound, hasApiKey, complete({system,prompt,model}),
//   waitBank(onProgress) -> status, find(q) -> {matches, show},
//   projectFiles, transcriber: 'local' | 'deepgram', deepgramKey, speechInstalled, transcribeSample() -> text
// }
async function runSelfTest(d, onStep) {
  const out = { ok: true, transcript: '' };
  const step = async (id, label, fn) => {
    onStep({ id, label, status: 'running' });
    let r;
    try { r = (await fn()) || {}; } catch (err) { r = { status: 'fail', detail: err.message || String(err) }; }
    const status = r.status || 'ok';
    if (status === 'fail') out.ok = false;
    onStep({ id, label, status, detail: r.detail || '' });
    return r;
  };

  await step('claude', 'Claude answers', async () => {
    if (d.engine === 'claude-code' && !d.claudeFound) {
      return { status: 'fail', detail: 'Claude Code is not installed. In PowerShell run:  irm https://claude.ai/install.ps1 | iex  — then run "claude" once and sign in with your Claude account.' };
    }
    if (d.engine === 'api' && !d.hasApiKey) {
      return { status: 'fail', detail: 'No API key. Switch ⚙ → Claude answers to "Claude Code (my plan)".' };
    }
    const t0 = Date.now();
    const reply = await d.complete({ system: 'This is a connection test. Reply with exactly: OK', prompt: 'Connection test.' });
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    if (!/\bOK\b/i.test(String(reply))) return { status: 'warn', detail: `Claude replied in ${secs} s, but not as expected: "${String(reply).slice(0, 80)}"` };
    return { detail: `${d.engine === 'claude-code' ? 'Claude Code (your plan)' : 'Claude API'} replied in ${secs} s` };
  });

  const bank = await step('bank', 'Q&A bank', async () => {
    const st = await d.waitBank((pct) => onStep({ id: 'bank', label: 'Q&A bank', status: 'running', detail: `preparing smart matching… ${pct}% (first run only)` }));
    const sources = (st.sources || []).map(s => `${s.name.replace(/^Project: /, 'project ')}: ${s.count}`).join(' · ');
    if (st.state === 'ready') return { detail: `${st.entries} questions, smart matching ready (${sources})`, ready: true };
    if (st.state === 'keyword-only') {
      return { status: 'warn', detail: `Smart matching could not load (${st.error || 'unknown error'}). Instant answers stay off; Claude still answers. It needs internet once to download a 23 MB model.` };
    }
    return { status: 'fail', detail: st.error || 'The Q&A bank file is missing. Reinstall the app.' };
  });

  await step('instant', 'Instant answers', async () => {
    if (!bank.ready) return { status: 'warn', detail: 'Skipped: smart matching is not ready.' };
    const lines = [];
    let bad = 0;
    for (const c of INSTANT_CHECKS) {
      const r = await d.find(c.q);
      const top = r.matches[0];
      const got = !r.show ? 'none' : top.source && top.source.startsWith('project:') ? 'project' : 'bank';
      // No project Q&A loaded: a general answer for the project question is still a pass.
      const ok = got === c.want || (c.want === 'project' && got === 'bank' && !d.hasProjectQA);
      if (!ok) bad++;
      lines.push(`${ok ? '✓' : '✗'} ${c.label}${r.show ? ` (${Math.round(top.confidence * 100)}%)` : ''}`);
    }
    return { status: bad ? 'warn' : 'ok', detail: lines.join(' · ') };
  });

  await step('project', 'Project folder', async () => {
    if (!d.projectFiles) return { status: 'warn', detail: 'No project folder added yet. Add it in ⚙ so questions about your work are answered from your code.' };
    return { detail: `${d.projectFiles} files from your project are read for answers` };
  });

  await step('speech', 'Speech to text', async () => {
    if (d.transcriber === 'deepgram') {
      return d.deepgramKey
        ? { detail: 'Deepgram is selected (key saved). It is checked in the live test below.' }
        : { status: 'fail', detail: 'Deepgram is selected but no key is saved. Paste it in ⚙ or switch to Free offline.' };
    }
    if (!d.speechInstalled) {
      return { status: 'warn', detail: 'The free speech model is not downloaded yet. Open ⚙ → Download now (one time), then run the test again.' };
    }
    const text = await d.transcribeSample();
    out.transcript = text;
    if (!/price|revision|queue|cue|callout/i.test(text)) return { status: 'warn', detail: `Heard: "${text || '(nothing)'}" — not what the recording says.` };
    return { detail: `Heard the test recording: "${text}"` };
  });

  return out;
}

// 16-bit PCM WAV → Float32 samples. Read with fs (works inside the installed app's archive,
// where native file readers can't reach).
function parseWav(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error('not a WAV file');
  let off = 12, fmt = null;
  while (off + 8 <= buf.length) {
    const id = buf.toString('ascii', off, off + 4), size = buf.readUInt32LE(off + 4), body = off + 8;
    if (id === 'fmt ') fmt = { format: buf.readUInt16LE(body), channels: buf.readUInt16LE(body + 2), sampleRate: buf.readUInt32LE(body + 4), bits: buf.readUInt16LE(body + 14) };
    if (id === 'data') {
      if (!fmt || fmt.format !== 1 || fmt.bits !== 16) throw new Error('only 16-bit PCM WAV is supported');
      const frames = Math.floor(Math.min(size, buf.length - body) / (2 * fmt.channels));
      const samples = new Float32Array(frames);
      for (let i = 0; i < frames; i++) samples[i] = buf.readInt16LE(body + i * 2 * fmt.channels) / 32768;
      return { samples, sampleRate: fmt.sampleRate };
    }
    off = body + size + (size % 2);
  }
  throw new Error('WAV file has no audio data');
}

module.exports = { runSelfTest, parseWav, INSTANT_CHECKS, SAMPLE_QUESTION_FILE };
