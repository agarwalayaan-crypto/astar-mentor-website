/**
 * ai-proxy-server.js
 *
 * A tiny, zero-dependency local proxy that lets tutor.html talk to the real
 * Claude API without exposing your API key to the browser or the internet.
 *
 * Why this exists: Anthropic's API is designed to be called from a server,
 * not directly from browser JavaScript, so tutor.html cannot reach it on its
 * own. This script runs ONLY on your own machine, holds your API key in an
 * environment variable (never in the browser, never in a file you might
 * share), and forwards chat messages to Claude on your behalf.
 *
 * Usage (Windows PowerShell):
 *   $env:ANTHROPIC_API_KEY = "sk-ant-your-key-here"
 *   node ai-proxy-server.js
 *
 * Usage (cmd.exe):
 *   set ANTHROPIC_API_KEY=sk-ant-your-key-here
 *   node ai-proxy-server.js
 *
 * Then open tutor.html, expand "Advanced: Connect a Real AI Model", and tick
 * "Use my local Claude proxy when available". Leave the Proxy URL as the
 * default (http://localhost:8787/chat) unless you changed the PORT below.
 *
 * This proxy only ever talks to api.anthropic.com and only ever listens on
 * localhost — it is not reachable from other devices or the internet.
 */

'use strict';

const http = require('http');
const https = require('https');

const PORT = 8787;
const MODEL = 'claude-opus-5';
const MAX_TOKENS = 4096;

const API_KEY = process.env.ANTHROPIC_API_KEY;

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function callClaude(system, messages) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: system,
      messages: messages,
    });

    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
        },
      },
      (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => { data += chunk; });
        apiRes.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (apiRes.statusCode >= 400) {
              const message = (parsed && parsed.error && parsed.error.message) || `Claude API returned status ${apiRes.statusCode}`;
              reject(new Error(message));
              return;
            }
            const textBlock = (parsed.content || []).find((block) => block.type === 'text');
            resolve(textBlock ? textBlock.text : '(Claude returned no text content.)');
          } catch (err) {
            reject(new Error('Could not parse Claude API response: ' + err.message));
          }
        });
      }
    );

    req.on('error', (err) => reject(new Error('Network error calling Claude API: ' + err.message)));
    req.write(requestBody);
    req.end();
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { ok: true, model: MODEL, hasApiKey: Boolean(API_KEY) });
    return;
  }

  if (req.method !== 'POST' || req.url !== '/chat') {
    sendJson(res, 404, { error: 'Not found. POST to /chat.' });
    return;
  }

  if (!API_KEY) {
    sendJson(res, 500, {
      error: 'ANTHROPIC_API_KEY is not set. Stop this server, set the environment variable, and restart it. See the comment at the top of this file for the exact command.',
    });
    return;
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', async () => {
    try {
      const parsed = JSON.parse(body || '{}');
      const system = typeof parsed.system === 'string' ? parsed.system : 'You are a helpful study mentor.';
      const message = typeof parsed.message === 'string' ? parsed.message.trim() : '';
      const history = Array.isArray(parsed.history) ? parsed.history : [];

      if (!message) {
        sendJson(res, 400, { error: 'Missing "message" field.' });
        return;
      }

      const messages = history
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
        .map((m) => ({ role: m.role, content: m.text }))
        .concat([{ role: 'user', content: message }]);

      const reply = await callClaude(system, messages);
      sendJson(res, 200, { reply });
    } catch (err) {
      sendJson(res, 500, { error: err.message || 'Unknown error handling request.' });
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`AI Tutor proxy running at http://localhost:${PORT}`);
  console.log(`Model: ${MODEL}`);
  console.log(API_KEY ? 'ANTHROPIC_API_KEY detected.' : 'WARNING: ANTHROPIC_API_KEY is not set — requests will fail until you set it and restart.');
  console.log('This server only accepts connections from your own computer (127.0.0.1).');
});
