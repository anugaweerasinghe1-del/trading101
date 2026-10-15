/**
 * Gemini free-tier-eligible model selection for TradeHQ scheduled workflows.
 * Quota / auth / billing errors are fatal; fallback is ONLY for unavailable (404) models.
 * Models in this allowlist are currently documented with a free tier, but Google controls
 * whether the key's project is actually billed; configure a non-billed/free project.
 */
export const FREE_FLASH_LITE_MODELS = Object.freeze([
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
]);

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const RESPONSE_ERRORS = new Set([
  'Gemini response body unavailable; workflow stopped safely.',
  'Gemini response deadline exceeded; no retry or fallback.',
  'Gemini response byte limit exceeded; no retry or fallback.',
  'Gemini response UTF-8 invalid; no retry or fallback.',
  'Gemini response envelope invalid; no retry or fallback.',
]);
async function readPayload(response, signal) {
  if (!response.body) throw Error('Gemini response body unavailable; workflow stopped safely.');
  const reader = response.body.getReader(), chunks = []; let size = 0;
  let rejectDeadline;
  const deadline = new Promise((_, reject) => { rejectDeadline = reject; });
  const abort = () => rejectDeadline(Error('Gemini response deadline exceeded; no retry or fallback.'));
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  try {
    for (;;) {
      const part = await Promise.race([reader.read(), deadline]);
      if (part.done) break;
      size += part.value.byteLength;
      if (size > MAX_RESPONSE_BYTES) throw Error('Gemini response byte limit exceeded; no retry or fallback.');
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let raw;
    try { raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { throw Error('Gemini response UTF-8 invalid; no retry or fallback.'); }
    try {
      const value = JSON.parse(raw);
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error();
      return value;
    }
    catch { throw Error('Gemini response envelope invalid; no retry or fallback.'); }
  } finally {
    signal.removeEventListener('abort', abort);
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function requestGeminiJson({
  apiKey, prompt, preferredModel = FREE_FLASH_LITE_MODELS[0],
  temperature = 0.25, maxOutputTokens = 4096, timeoutMs = 45000,
  fetchImpl = globalThis.fetch,
}) {
  if (!apiKey) throw Error("GEMINI_API_KEY is not configured.");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) throw Error('Bounded Gemini request deadline required.');
  if (!FREE_FLASH_LITE_MODELS.includes(preferredModel)) {
    throw Error("Requested Gemini model is not in TradeHQ's free-tier Flash-Lite allowlist: " + String(preferredModel).slice(0, 80));
  }
  const available = [preferredModel, ...FREE_FLASH_LITE_MODELS.filter(model => model !== preferredModel)];
  const unavailable = [];
  // Maximum one additional request for malformed JSON across all approved models.
  // Never retry 401/403/429/5xx, timeouts, or truncated/safety-blocked responses.
  let malformedRetryUsed = false;
  for (const model of available) {
    while (true) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response, payload;
      try {
        response = await fetchImpl(
          "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent",
          {
            method: "POST", redirect: "error", signal: controller.signal,
            headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{
                text: prompt + (malformedRetryUsed ? "\nReturn exactly one complete, syntactically valid JSON object. No code fences or commentary." : ""),
              }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: malformedRetryUsed ? Math.min(temperature, 0.1) : temperature,
                maxOutputTokens,
              },
            }),
          },
        );
        if (response.ok) payload = await readPayload(response, controller.signal);
      } catch (error) {
        // Transport errors can contain request data; retain only fixed application codes.
        if (controller.signal.aborted) throw Error("Gemini request timed out for " + model + ". No retry or fallback.");
        if (RESPONSE_ERRORS.has(error?.message)) throw Error(error.message);
        throw Error("Gemini request failed for " + model + ". No retry or fallback.");
      } finally {
        clearTimeout(timer);
        if (response && !response.ok) void response.body?.cancel().catch(() => {});
      }
      if (response.status === 404) {
        unavailable.push(model);
        console.warn("Gemini model unavailable for this project: " + model + "; checking allowed Flash-Lite fallback.");
        break;
      }
      if (!response.ok) {
        if (response.status === 429) throw Error("Gemini free-tier quota/rate limit (429) for " + model + ". No fallback or paid call.");
        if (response.status === 403 || response.status === 401) throw Error("Gemini key/project authorization failed (" + response.status + ") for " + model + ". No fallback.");
        throw Error("Gemini HTTP " + response.status + " for " + model + ". Workflow stopped safely.");
      }
      const candidate = payload.candidates?.[0];
      if (candidate?.finishReason === "MAX_TOKENS") throw Error("Gemini hit output token limit for " + model + "; no changes were published.");
      if (candidate?.finishReason && candidate.finishReason !== "STOP") {
        const reason = ['SAFETY', 'RECITATION', 'LANGUAGE', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII', 'MALFORMED_FUNCTION_CALL', 'OTHER'].includes(candidate.finishReason) ? candidate.finishReason : 'UNKNOWN';
        throw Error("Gemini stopped with " + reason + " for " + model + "; no changes were published.");
      }
      const raw = candidate?.content?.parts?.map(part => part.text || "").join("").trim() || "";
      let value;
      try {
        value = JSON.parse(raw);
        if (value === null || typeof value !== "object" || Array.isArray(value)) throw new SyntaxError("Expected JSON object");
      } catch {
        if (malformedRetryUsed) {
          throw Error("Gemini returned invalid or empty JSON for " + model + " after one retry. No changes were published.");
        }
        malformedRetryUsed = true;
        console.warn("Gemini returned invalid or empty JSON for " + model + "; retrying once on the same allowed free-tier model.");
        continue;
      }
      console.log("Gemini response generated using " + model + ".");
      return { value, model };
    }
  }
  throw Error("Gemini HTTP 404 for all approved Flash-Lite models (" + unavailable.join(", ") +
    "). Check model availability in the same Google AI Studio project as this key.");
}
