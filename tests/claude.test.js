// The Claude call: request shape, streaming, cancel, errors — against a local fake API.
const test = require('node:test');
const assert = require('node:assert/strict');
const { ClaudeAnswerer, systemPrompt } = require('../src/claude');
const { startMockAnthropic } = require('./helpers/mock-anthropic');

test('system prompt routes work questions to files and generic questions to Claude knowledge', () => {
  const p = systemPrompt('Akshay');
  assert.match(p, /ABOUT HIS OWN WORK[\s\S]*ONLY from the project files/);
  assert.match(p, /GENERIC[\s\S]*your own knowledge[\s\S]*\*\*General:\*\*/);
  assert.match(p, /Never invent features, numbers, clients/);
});

test('meeting setup (scenario, brief, style, language) is written into the system prompt', () => {
  const p = systemPrompt('Akshay', {
    scenario: 'client_demo', style: 'script', language: 'hinglish', // old setting: answers are always English now
    brief: 'Demo of FSL upload to Amkor business users'
  });
  assert.match(p, /Scenario: Client demo/);
  assert.match(p, /Brief from Akshay: """Demo of FSL upload to Amkor business users"""/);
  assert.match(p, /word-for-word script/);
  assert.match(p, /Always reply in clear, simple English/);
  assert.doesNotMatch(p, /Hinglish/);
  assert.match(p, /never present something from the brief as built work/);
});

test('bad or missing meeting settings fall back to safe defaults', () => {
  const p = systemPrompt('Akshay', { scenario: 'nope', style: 'nope', language: 'nope', brief: 42 });
  assert.match(p, /Scenario: Custom/);
  assert.match(p, /No extra brief given|Brief from Akshay: """42"""/);
  assert.match(p, /Always reply in clear, simple English/);
});

test('speed tier picks the model and answer length', async (t) => {
  const api = await startMockAnthropic();
  t.after(api.close);
  const a = new ClaudeAnswerer({ apiKey: 'test', baseURL: api.url });
  for (const [speed, model] of [['fast', 'claude-haiku-5-5'], ['balanced', 'claude-sonnet-5-5'], ['accurate', 'claude-opus-5-5']]) {
    await a.answer({ question: 'q', context: 'ctx', meeting: { speed } });
    assert.equal(api.requests.at(-1).body.model, model);
  }
  assert.ok(api.requests[0].body.max_tokens < api.requests[2].body.max_tokens);
});

test('streams the answer and sends project context as a cached system block', async (t) => {
  const api = await startMockAnthropic({ reply: '**Answer:** I used a Queueable for the SAP callout.' });
  t.after(api.close);
  const a = new ClaudeAnswerer({ apiKey: 'test', model: 'claude-haiku-5-5', name: 'Akshay', baseURL: api.url });
  let streamed = '';
  await a.answer({ question: 'why a queueable?', transcript: 'so why a queueable?', context: 'FILE: PriceRevisionQueueable.cls', onDelta: d => (streamed += d) });

  assert.equal(streamed, '**Answer:** I used a Queueable for the SAP callout.');
  const body = api.requests[0].body;
  assert.equal(body.model, 'claude-haiku-5-5');
  assert.equal(body.stream, true);
  assert.equal(body.system[1].text, 'FILE: PriceRevisionQueueable.cls');
  assert.deepEqual(body.system[1].cache_control, { type: 'ephemeral' });
  assert.match(body.messages[0].content.at(-1).text, /why a queueable\?/);
});

test('screenshot is sent as an image block before the question', async (t) => {
  const api = await startMockAnthropic();
  t.after(api.close);
  const a = new ClaudeAnswerer({ apiKey: 'test', baseURL: api.url });
  await a.answer({ question: 'what is this error?', context: 'ctx', screenshotBase64: 'iVBORw0KGgo=' });
  const content = api.requests[0].body.messages[0].content;
  assert.equal(content[0].type, 'image');
  assert.equal(content[0].source.media_type, 'image/png');
  assert.equal(content[1].type, 'text');
});

test('a new question aborts the one still streaming, and reports it as cancelled', async (t) => {
  const api = await startMockAnthropic({ reply: 'x'.repeat(240), delayMs: 25 });
  t.after(api.close);
  const a = new ClaudeAnswerer({ apiKey: 'test', baseURL: api.url });
  const first = a.answer({ question: 'one', context: 'ctx' });
  await new Promise(r => setTimeout(r, 60));
  const second = a.answer({ question: 'two', context: 'ctx' });
  await assert.rejects(first, (err) => err.cancelled === true);
  await second;
});

test('API errors surface with a readable message', async (t) => {
  const api = await startMockAnthropic({ status: 401 });
  t.after(api.close);
  const a = new ClaudeAnswerer({ apiKey: 'bad', baseURL: api.url });
  await assert.rejects(a.answer({ question: 'q', context: 'ctx' }), /invalid x-api-key|401/);
});

test('warm-up writes the cache with a 1-token request carrying the same system blocks', async (t) => {
  const api = await startMockAnthropic({ reply: '.' });
  t.after(api.close);
  const a = new ClaudeAnswerer({ apiKey: 'test', baseURL: api.url });
  await a.warm('FULL PROJECT');
  const body = api.requests[0].body;
  assert.equal(body.max_tokens, 1);
  assert.equal(body.system[1].text, 'FULL PROJECT');
  assert.deepEqual(body.system[1].cache_control, { type: 'ephemeral' });
});

test('generic answers: a lead\'s voice, but no invented past events; "you"-phrased concept questions are generic', () => {
  const p = systemPrompt('Akshay');
  assert.match(p, /works as a Salesforce Technical Lead/);
  assert.match(p, /answers as a LEAD/);
  assert.match(p, /Do NOT claim specific past events/);
  assert.match(p, /"How do you handle bulkification in triggers\?" -> B/);
  assert.match(p, /ONLY line about his own project allowed in type B is one point starting "In my project:"/);
  assert.match(systemPrompt('Akshay', {}, 'CPQ Lead'), /works as a CPQ Lead/);
  assert.match(systemPrompt('Akshay', {}, '   '), /works as a Salesforce Technical Lead/);
});

test('retrieval excerpts are sent in the question, keeping the cached system block stable', async (t) => {
  const api = await startMockAnthropic();
  t.after(api.close);
  const a = new ClaudeAnswerer({ apiKey: 'test', baseURL: api.url });
  await a.answer({ question: 'what does Svc12 do', context: 'STABLE', excerpts: 'EXCERPT Svc12' });
  await a.answer({ question: 'explain Svc300', context: 'STABLE', excerpts: 'EXCERPT Svc300' });
  const [r1, r2] = api.requests.map(r => r.body);
  assert.deepEqual(r1.system, r2.system);
  assert.equal(r1.messages[0].content[0].text, 'EXCERPT Svc12');
  assert.equal(r2.messages[0].content[0].text, 'EXCERPT Svc300');
});
