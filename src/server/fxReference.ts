import { buildFxReferenceBatch, referenceRequestDate, validateFxReferenceBatch } from '../lib/fxReference.js';
export interface ReferenceCache { match(request: Request): Promise<Response | undefined>; put(request: Request, response: Response): Promise<unknown> }
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow' };
const unavailable = (reason: string) => new Response(JSON.stringify({ error: 'Daily forex reference information is temporarily unavailable.' }), { status: 503, headers: { ...headers, 'Cache-Control': 'public, max-age=0, s-maxage=60', 'Retry-After': '60', 'X-Forex-Reference-Status': reason } });
export function createFxReferenceHandler(options: { fetchImpl?: typeof fetch; now?: () => number } = {}) {
  const memory = new Map<string, { response: Response; until: number }>();
  const pending = new Map<string, Promise<Response>>();
  return async (request: Request, cache?: ReferenceCache): Promise<Response> => {
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET', 'Cache-Control': 'no-store' } });
    if (new URL(request.url).search) return new Response(JSON.stringify({ error: 'Query parameters are not supported.' }), { status: 400, headers: { ...headers, 'Cache-Control': 'no-store' } });
    const now = options.now?.() ?? Date.now(), date = referenceRequestDate(now);
    const key = new Request('https://www.thetradehq.com/__fx-reference-cache/' + date);
    const saved = memory.get(date);
    if (saved && saved.until > now) return saved.response.clone();
    if (pending.has(date)) return (await pending.get(date)!).clone();
    const read = async () => {
      try {
        const stored = await cache?.match(key);
        if (stored?.ok) {
          const valid = validateFxReferenceBatch(await stored.clone().json(), now);
          if (valid && valid.requestedDate === date) return new Response(JSON.stringify(valid), { headers: { ...headers, 'Cache-Control': 'public, max-age=300, s-maxage=3600' } });
        }
      } catch { /* Cache failure cannot disable the read-only reference panel. */ }
      let response: Response, failure = 'request-failed';
      try {
        // Fixed server-side request; no visitor IP, cookies, auth, or arbitrary URL forwarding.
        // Workers does not implement RequestInit.credentials; explicit headers contain no credentials.
        const quotes = 'EUR,GBP,JPY,CHF,AUD,CAD,NZD,HKD,SGD,MXN,ZAR,TRY';
        const upstream = await (options.fetchImpl ?? fetch)('https://api.frankfurter.dev/v2/rates?date=' + date + '&base=USD&quotes=' + quotes, {
          method: 'GET', headers: { Accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(8000),
        });
        if (!upstream.ok) { failure = 'upstream-http-' + upstream.status; throw Error('unavailable'); }
        if (!upstream.headers.get('content-type')?.includes('application/json') || !upstream.body) { failure = 'upstream-format'; throw Error('unavailable'); }
        failure = 'upstream-body';
        const reader = upstream.body.getReader(), chunks: Uint8Array[] = []; let bytes = 0;
        try {
          for (;;) {
            const { done, value } = await reader.read(); if (done) break;
            bytes += value.byteLength; if (bytes > 32768) throw Error('oversized'); chunks.push(value);
          }
        } finally { await reader.cancel().catch(() => {}); }
        const body = new Uint8Array(bytes); let offset = 0;
        for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
        const valid = buildFxReferenceBatch(JSON.parse(new TextDecoder().decode(body)), date);
        if (!valid) { failure = 'invalid-reference-data'; throw Error('unavailable'); }
        response = new Response(JSON.stringify(valid), { headers: { ...headers, 'Cache-Control': 'public, max-age=300, s-maxage=3600' } });
      } catch { response = unavailable(failure); }
      memory.clear(); memory.set(date, { response: response.clone(), until: now + (response.ok ? 86400000 : 60000) });
      if (response.ok) {
        try { await cache?.put(key, new Response(await response.clone().text(), { headers: { ...headers, 'Cache-Control': 'public, max-age=86400' } })); } catch { /* Successful data remains usable. */ }
      }
      return response;
    };
    const task = read(); pending.set(date, task);
    try { return (await task).clone(); } finally { pending.delete(date); }
  };
}
