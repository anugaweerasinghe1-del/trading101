import assert from "node:assert/strict";
import { requestGeminiJson, FREE_FLASH_LITE_MODELS } from "./gemini-free-models.mjs";
import { createServer } from 'node:http';

const testKey = "local-mock-key-not-a-real-secret";
const response = (status, value = {}) => new Response(JSON.stringify(value), { status });
const success = response(200, {
  candidates: [{ content: { parts: [{ text: JSON.stringify({ ideas: [{ title: "One" }, { title: "Two" }] }) }] }, finishReason: "STOP" }],
});
assert.deepEqual(FREE_FLASH_LITE_MODELS, ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]);
{
  const calls = [];
  const result = await requestGeminiJson({
    apiKey: testKey, prompt: "Mock", fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return calls.length === 1 ? response(404) : success.clone();
    },
  });
  assert.equal(result.model, "gemini-3.1-flash-lite");
  assert.equal(result.value.ideas.length, 2);
  assert.equal(calls.length, 2);
  assert.ok(calls[0].url.includes("gemini-3.5-flash-lite"));
  assert.ok(calls[1].url.includes("gemini-3.1-flash-lite"));
  assert.equal(calls[0].options.headers["x-goog-api-key"], testKey);
  assert.ok(!calls[0].url.includes(testKey), "never put API keys in Gemini request URLs");
}
for (const status of [401, 403, 429, 500]) {
  let count = 0;
  await assert.rejects(requestGeminiJson({
    apiKey: testKey, prompt: "Mock", fetchImpl: async () => { count++; return response(status); },
  }), new RegExp(String(status)));
  assert.equal(count, 1, "do not fall back after auth/quota/server errors");
}
{
  let count = 0;
  await assert.rejects(requestGeminiJson({
    apiKey: testKey, prompt: "Mock", fetchImpl: async () => { count++; return response(404); },
  }), /404 for all approved/);
  assert.equal(count, FREE_FLASH_LITE_MODELS.length);
}
{
  let count = 0;
  await assert.rejects(requestGeminiJson({
    apiKey: testKey, prompt: "Mock", preferredModel: "gemini-3.8-pro",
    fetchImpl: async () => { count++; return success.clone(); },
  }), /not in TradeHQ/);
  assert.equal(count, 0, "never invoke a model not in the allowlist");
}
// An intermittently malformed JSON response permits exactly ONE extra request,
// and it must use the SAME approved free-tier model, never a paid or other fallback.
const malformed = response(200, {
  candidates: [{ content: { parts: [{ text: '{"ideas":[' }] }, finishReason: "STOP" }],
});
const empty = response(200, {
  candidates: [{ content: { parts: [{ text: "" }] }, finishReason: "STOP" }],
});
{
  const calls = [];
  const result = await requestGeminiJson({
    apiKey: testKey, prompt: "Mock",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return calls.length === 1 ? malformed.clone() : success.clone();
    },
  });
  assert.equal(result.model, FREE_FLASH_LITE_MODELS[0]);
  assert.equal(result.value.ideas.length, 2);
  assert.equal(calls.length, 2, "retry malformed JSON only once");
  assert.equal(calls[0].url, calls[1].url, "malformed JSON must not select another model");
  const firstBody = JSON.parse(calls[0].options.body);
  const secondBody = JSON.parse(calls[1].options.body);
  assert.equal(firstBody.generationConfig.responseMimeType, "application/json");
  assert.equal(secondBody.generationConfig.responseMimeType, "application/json");
  assert.ok(secondBody.contents[0].parts[0].text.includes("syntactically valid JSON"));
}
{
  let count = 0;
  await assert.rejects(requestGeminiJson({
    apiKey: testKey, prompt: "Mock",
    fetchImpl: async () => { count++; return malformed.clone(); },
  }), /invalid or empty JSON.*after one retry/);
  assert.equal(count, 2, "two malformed responses must stop without publishing");
}
{
  let count = 0;
  const result = await requestGeminiJson({
    apiKey: testKey, prompt: "Mock",
    fetchImpl: async () => { count++; return count === 1 ? empty.clone() : success.clone(); },
  });
  assert.equal(result.model, FREE_FLASH_LITE_MODELS[0]);
  assert.equal(count, 2, "empty response gets only one bounded retry");
}
{
  let count = 0;
  await assert.rejects(requestGeminiJson({
    apiKey: testKey, prompt: "Mock",
    fetchImpl: async () => { count++; return count === 1 ? malformed.clone() : response(429); },
  }), /429/);
  assert.equal(count, 2, "do not fall back after rate limit on JSON retry");
}
{
  let count = 0;
  await assert.rejects(requestGeminiJson({
    apiKey: testKey, prompt: "Mock",
    fetchImpl: async () => {
      count++;
      return response(200, { candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: "{}" }] } }] });
    },
  }), /token limit/);
  assert.equal(count, 1, "do not retry truncated output");
}
{
  let count = 0;
  await assert.rejects(requestGeminiJson({
    apiKey: testKey, prompt: "Mock",
    fetchImpl: async () => {
      count++;
      return response(200, { candidates: [{ finishReason: "SAFETY", content: { parts: [] } }] });
    },
  }), /stopped with SAFETY/);
  assert.equal(count, 1, "do not retry safety-blocked output");
}
{
  let count = 0;
  const invalidRoot = response(200, {
    candidates: [{ content: { parts: [{ text: '"not a JSON object"' }] }, finishReason: "STOP" }],
  });
  const result = await requestGeminiJson({
    apiKey: testKey, prompt: "Mock",
    fetchImpl: async () => { count++; return count === 1 ? invalidRoot.clone() : success.clone(); },
  });
  assert.equal(result.value.ideas.length, 2);
  assert.equal(count, 2, "a JSON primitive must not pass the required object shape");
}

// Actual loopback HTTP covers redirects and a body stalled after response headers.
// All keys are disposable fixtures; these tests never contact Google.
let forwarded = 0, startRequests = 0;
const destination = createServer((req, res) => { forwarded++; res.end('{}'); });
await new Promise(resolve => destination.listen(0, '127.0.0.1', resolve));
const source = createServer((req, res) => {
  startRequests++;
  if (req.url === '/redirect') {
    res.writeHead(302, { Location: 'http://127.0.0.1:' + destination.address().port + '/unexpected' }); res.end();
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.flushHeaders();
    const timer = setTimeout(() => res.end(JSON.stringify({ candidates: [] })), 1000);
    res.on('close', () => clearTimeout(timer));
  }
});
await new Promise(resolve => source.listen(0, '127.0.0.1', resolve));
try {
  await assert.rejects(requestGeminiJson({ apiKey: testKey, prompt: 'Loopback fixture',
    fetchImpl: (url, init) => fetch('http://127.0.0.1:' + source.address().port + '/redirect', init) }), /No retry or fallback/);
  assert.equal(forwarded, 0, 'Redirect destination must not receive the API-key request');
  await assert.rejects(requestGeminiJson({ apiKey: testKey, prompt: 'Loopback fixture', timeoutMs: 150,
    fetchImpl: (url, init) => fetch('http://127.0.0.1:' + source.address().port + '/stall', init) }), /timed out/);
  assert.equal(startRequests, 2, 'Transport failures must not add retries or change models');
} finally {
  source.closeAllConnections(); destination.closeAllConnections();
  await Promise.all([new Promise(resolve => source.close(resolve)), new Promise(resolve => destination.close(resolve))]);
}
for (const [label, make, expected] of [
  ['oversize', () => new Response(new Uint8Array(2 * 1024 * 1024 + 1)), /byte limit/],
  ['invalid UTF-8', () => new Response(new Uint8Array([0xc3, 0x28])), /UTF-8/],
  ['invalid envelope', () => new Response('{private-provider-body'), /envelope invalid/],
  ['primitive envelope', () => new Response('null'), /envelope invalid/],
]) {
  let attempts = 0;
  await assert.rejects(requestGeminiJson({ apiKey: testKey, prompt: 'Fixture', fetchImpl: async () => { attempts++; return make(); } }), expected);
  assert.equal(attempts, 1, label + ' must stop without retry or fallback');
}
let canceled = false, attempts = 0;
await assert.rejects(requestGeminiJson({ apiKey: testKey, prompt: 'Fixture', timeoutMs: 30,
  fetchImpl: async () => { attempts++; return new Response(new ReadableStream({
    start(c) { c.enqueue(new TextEncoder().encode('{')); },
    cancel() { canceled = true; return new Promise(() => {}); },
  })); } }), /timed out/);
assert.equal(canceled, true, 'Stalled body is canceled without awaiting hanging cancellation');
assert.equal(attempts, 1);
for (const privateMessage of ['private fixture key ' + testKey, 'Gemini response byte limit exceeded; ' + testKey]) {
  await assert.rejects(requestGeminiJson({ apiKey: testKey, prompt: 'Fixture', fetchImpl: async () => { throw Error(privateMessage); } }),
    error => !error.message.includes(testKey) && error.message.includes('No retry or fallback'));
}
await assert.rejects(requestGeminiJson({ apiKey: testKey, prompt: 'Fixture', fetchImpl: async () => response(200,
  { candidates: [{ finishReason: testKey }] }) }), error => error.message.includes('UNKNOWN') && !error.message.includes(testKey));

console.log("Gemini model limits, real redirect/body deadlines, redaction and bounded no-paid-fallback tests passed.");
