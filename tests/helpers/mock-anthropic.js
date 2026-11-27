// Minimal local stand-in for the Anthropic Messages streaming API.
// Records every request body; answers with a scripted text reply as SSE.
const http = require('http');

function sse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function startMockAnthropic({ reply = '**Answer:** ok', delayMs = 0, status = 200, errorMessage = 'invalid x-api-key', errorType = 'authentication_error' } = {}) {
  const requests = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', async () => {
      const json = body ? JSON.parse(body) : {};
      requests.push({ url: req.url, headers: req.headers, body: json });
      if (status !== 200) {
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ type: 'error', error: { type: errorType, message: errorMessage } }));
        return;
      }
      const text = typeof reply === 'function' ? reply(json) : reply;
      if (!json.stream) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ id: 'msg_test', type: 'message', role: 'assistant', model: json.model,
          content: [{ type: 'text', text }], stop_reason: 'end_turn', stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 1 } }));
        return;
      }
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
      sse(res, 'message_start', { type: 'message_start', message: {
        id: 'msg_test', type: 'message', role: 'assistant', model: json.model, content: [],
        stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 1 } } });
      sse(res, 'content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } });
      const parts = text.match(/[\s\S]{1,12}/g) || [''];
      for (const p of parts) {
        if (delayMs) await new Promise(r => setTimeout(r, delayMs));
        if (res.destroyed) return;
        sse(res, 'content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: p } });
      }
      sse(res, 'content_block_stop', { type: 'content_block_stop', index: 0 });
      sse(res, 'message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: parts.length } });
      sse(res, 'message_stop', { type: 'message_stop' });
      res.end();
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    resolve({ url: `http://127.0.0.1:${port}`, requests, close: () => new Promise(r => { server.closeAllConnections?.(); server.close(r); }) });
  }));
}

module.exports = { startMockAnthropic };
