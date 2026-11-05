/** Safe no-generation key/model preflight for the owner-only Daily desk.
 * This does not reserve a generation cycle, reset attempts, or publish content.
 * Even a successful GET cannot prove a future structured generation will pass.
 */
export type GeminiPreflight = {
  code: 'NOT_CONFIGURED' | 'MODEL_REACHABLE' | 'PROVIDER_REJECTED' | 'PROVIDER_UNAVAILABLE';
  providerGenerationAttempted: false;
  generationWorkingVerified: false;
  httpStatus?: number;
};

export async function checkGeminiModelMetadata(
  settings: { apiKey?: string; model?: string; freeConfirmed?: boolean } | null,
  fetcher: typeof fetch = fetch,
): Promise<GeminiPreflight> {
  const common = { providerGenerationAttempted: false, generationWorkingVerified: false } as const;
  if (!settings?.freeConfirmed || !settings.apiKey ||
    !['gemini-3.5-flash', 'gemini-3.5-flash-lite'].includes(settings.model ?? ''))
    return { ...common, code: 'NOT_CONFIGURED' };
  try {
    const response = await fetcher(
      'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(settings.model!),
      { method: 'GET', headers: { 'x-goog-api-key': settings.apiKey }, redirect: 'error',
        signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) {
      void response.body?.cancel().catch(() => {});
      return { ...common, code: 'PROVIDER_REJECTED',
        httpStatus: [400, 401, 403, 404, 429].includes(response.status) ? response.status : 502 };
    }
    // Small metadata only; never return raw provider data to the browser.
    const reader = response.body?.getReader();
    if (!reader) return { ...common, code: 'PROVIDER_UNAVAILABLE' };
    const chunks: Uint8Array[] = []; let length = 0;
    try {
      for (;;) {
        const part = await reader.read();
        if (part.done) break;
        length += part.value.byteLength;
        if (length > 16384) throw Error('metadata_too_large');
        chunks.push(part.value);
      }
    } finally { void reader.cancel().catch(() => {}); reader.releaseLock(); }
    const all = new Uint8Array(length); let at = 0;
    for (const bytes of chunks) { all.set(bytes, at); at += bytes.length; }
    const info = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(all));
    return info?.name === 'models/' + settings.model &&
      Array.isArray(info.supportedGenerationMethods) &&
      info.supportedGenerationMethods.includes('generateContent')
      ? { ...common, code: 'MODEL_REACHABLE' }
      : { ...common, code: 'PROVIDER_UNAVAILABLE' };
  } catch {
    return { ...common, code: 'PROVIDER_UNAVAILABLE' };
  }
}
