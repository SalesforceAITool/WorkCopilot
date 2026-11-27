#!/usr/bin/env node
// Stand-in for the Claude Code CLI in headless stream-json mode. Logs how it was called to
// $FAKE_CC_LOG and answers according to $FAKE_CC_MODE: ok | slow | not_logged_in | limit.
const fs = require('fs');
const log = process.env.FAKE_CC_LOG;
const started = Date.now();
const record = (o) => log && fs.appendFileSync(log, JSON.stringify(o) + '\n');
record({ event: 'spawn', pid: process.pid, started, argv: process.argv.slice(2),
  hasApiKey: 'ANTHROPIC_API_KEY' in process.env, hasBaseUrl: 'ANTHROPIC_BASE_URL' in process.env, cwd: process.cwd() });
let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', async () => {
  if (!input.trim()) process.exit(0);
  if (process.argv.includes('json') && !process.argv.includes('stream-json')) {
    // one-shot: plain-text prompt in, single JSON result out
    record({ event: 'oneshot', pid: process.pid, prompt: input, argv: process.argv.slice(2) });
    // FAKE_CC_ONESHOT_RULES: [[regex, reply], …] matched against the prompt (first match wins).
    let reply = process.env.FAKE_CC_ONESHOT || '[]';
    for (const [re, r] of JSON.parse(process.env.FAKE_CC_ONESHOT_RULES || '[]')) {
      if (new RegExp(re, 'i').test(input)) { reply = r; break; }
    }
    process.stdout.write(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: reply }) + '\n');
    return;
  }
  const msg = JSON.parse(input.trim().split('\n')[0]);
  const sysIdx = process.argv.indexOf('--system-prompt-file');
  record({ event: 'ask', pid: process.pid, started, askedAt: Date.now(), message: msg,
    systemPrompt: sysIdx > 0 ? fs.readFileSync(process.argv[sysIdx + 1], 'utf8') : null });
  const out = (o) => process.stdout.write(JSON.stringify(o) + '\n');
  out({ type: 'system', subtype: 'init', model: process.argv[process.argv.indexOf('--model') + 1] });
  const mode = process.env.FAKE_CC_MODE || 'ok';
  if (mode === 'not_logged_in') { out({ type: 'result', subtype: 'success', is_error: true, result: 'Not logged in · Please run /login' }); return process.exit(1); }
  if (mode === 'limit') { out({ type: 'result', subtype: 'success', is_error: true, result: 'Claude AI usage limit reached|1792440000' }); return process.exit(1); }
  const text = '**Answer:** I used a Queueable because the SAP pricing call is a callout.';
  for (const part of text.match(/.{1,10}/g)) {
    if (mode === 'slow') await new Promise(r => setTimeout(r, 60));
    out({ type: 'stream_event', event: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: part } } });
  }
  out({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } });
  out({ type: 'result', subtype: 'success', is_error: false, result: text, usage: { input_tokens: 10, output_tokens: 20 } });
});
