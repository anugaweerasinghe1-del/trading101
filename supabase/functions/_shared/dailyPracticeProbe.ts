import { generatePractice } from './dailyPracticeGenerator.ts';
import { courseReferences, readGenerationResponse, GENERATION_READ_LIMITS } from './courseGenerator.ts';
import { providerDiagnostics, validationDiagnostics, type ProbeDiagnostics } from './dailyProbeDiagnostics.ts';
export const DAILY_PROBE_LIMITS = Object.freeze({ requestsPerUtcDay: 1, requestBytes: 120000, outputTokens: 32768 });
type Config = { apiKey?: string; model?: string; freeConfirmed?: boolean };
export type DailyProbeResult = {
  outcome: 'passed' | 'failed'; model: string; providerGenerationAttempted: boolean;
  productionCycleChanged: false; published: false; saved: false;
  exercises: number; questions: number; code?: string; httpStatus?: number; field?: string;
  usage?: unknown; diagnostics?: ProbeDiagnostics;
};
export function createDailyProbeHandler(options: {
  getKey: () => string | undefined;
  authLimit: (request: Request) => Promise<boolean>;
  owner: (request: Request) => Promise<boolean>;
  config: () => Promise<Config | null>;
  admit: () => Promise<boolean>;
  fetcher?: typeof fetch;
  now?: () => number;
  report?: (metadata: { outcome: string; code: string | null; providerGenerationAttempted: boolean; diagnostics: ProbeDiagnostics }) => void;
}) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key' };
  const reply = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers });
  return async (request: Request) => {
    if (request.method === 'OPTIONS') return new Response(null, { headers });
    if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
    try {
      if (!await options.authLimit(request)) return reply({ code: 'AUTH_RATE_LIMIT', error: 'Administrator request limit reached.' }, 429);
      const expected = options.getKey(), supplied = request.headers.get('x-admin-key');
      if (!expected || !supplied || expected.length !== supplied.length) return reply({ error: 'Admin key required.' }, 401);
      let difference = 0;
      for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
      if (difference) return reply({ error: 'Admin key required.' }, 401);
      if (!await options.owner(request)) return reply({ error: 'Registered owner sign-in required.' }, 403);
      const raw = await request.text();
      if (raw.length > 1024) return reply({ error: 'Invalid test confirmation.' }, 413);
      let body;
      try { body = JSON.parse(raw); } catch { return reply({ error: 'Invalid test confirmation.' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || body.confirmFreeTier !== true)
        return reply({ error: 'Confirm the current free-tier quota before testing.' }, 400);
      const config = await options.config();
      if (config?.freeConfirmed !== true || typeof config.apiKey !== 'string' || !config.apiKey.trim() || config.model !== 'gemini-3.5-flash-lite')
        return reply({ code: 'TEST_CONFIG_REQUIRED', error: 'The saved configuration must use verified free Gemini 3.5 Flash Lite.' }, 409);
      // Atomic, durable, global UTC-day admission. Failed/unknown outcomes consume it.
      if (!await options.admit()) return reply({ code: 'TEST_ALLOWANCE_USED', error: 'The private test allowance is used. Wait until the next UTC day; no automatic retry.' }, 429);
      let providerCalls = 0;
      let diagnostics: ProbeDiagnostics = {};
      const resultReply = (result: DailyProbeResult) => {
        const metadata = { outcome: result.outcome, code: result.code ?? null, providerGenerationAttempted: result.providerGenerationAttempted, diagnostics };
        try { (options.report ?? (value => console.info('DAILY_PRIVATE_TEST_RESULT', JSON.stringify(value))))(metadata); } catch { /* Telemetry cannot change an outcome. */ }
        return reply({ data: result });
      };
      const sources = new Set(courseReferences.map(source => source.url));
      const providerUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';
      const guardedFetch: typeof fetch = async (input, init) => {
        const url = String(input);
        if (url === providerUrl) {
          if (providerCalls || init?.method !== 'POST' || typeof init.body !== 'string' || new TextEncoder().encode(init.body).length > DAILY_PROBE_LIMITS.requestBytes)
            throw Error('PROBE_REQUEST_BOUND');
          const value = JSON.parse(init.body);
          if (value.generationConfig?.maxOutputTokens !== DAILY_PROBE_LIMITS.outputTokens) throw Error('PROBE_REQUEST_BOUND');
          providerCalls++;
        } else if (!sources.has(url) || init?.method && init.method !== 'GET') throw Error('PROBE_REQUEST_BOUND');
        const response = await (options.fetcher ?? fetch)(input, init);
        if (url === providerUrl && response.ok) {
          const raw = await readGenerationResponse(response, GENERATION_READ_LIMITS.providerBytes, GENERATION_READ_LIMITS.providerReadMs);
          diagnostics = providerDiagnostics(raw);
          // One bounded upstream body read; only metadata survives the real generator.
          return new Response(raw, { status: response.status, headers: { 'Content-Type': 'application/json' } });
        }
        return response;
      };
      const base = { model: config.model, productionCycleChanged: false, published: false, saved: false } as const;
      try {
        const generated = await generatePractice({ lease: '', effectiveFrom: new Date(options.now?.() ?? Date.now()).toISOString().slice(0, 10),
          apiKey: config.apiKey, model: config.model, exercises: [], existing: [] }, guardedFetch);
        // The actual production generator performs source/schema/repetition validation.
        // Generated text is discarded: only validation/usage metadata leaves this handler.
        const result: DailyProbeResult = { ...base, outcome: 'passed', providerGenerationAttempted: providerCalls === 1,
          exercises: generated.exercises.length, questions: generated.exercises.reduce((n, exercise) => n + exercise.questions.length, 0),
          usage: generated.research.usage, diagnostics };
        return resultReply(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        const validation = validationDiagnostics(message);
        if (validation) diagnostics.validation = validation;
        const status = /^Gemini rejected generation \(HTTP (\d{3})/.exec(message);
        const result: DailyProbeResult = { ...base, outcome: 'failed', providerGenerationAttempted: providerCalls === 1, exercises: 0, questions: 0, diagnostics,
          code: status ? 'PROVIDER_REJECTED' : message.startsWith('Free Gemini quota') ? 'PROVIDER_RATE_LIMIT'
            : message.startsWith('Too few primary') ? 'SOURCES_UNAVAILABLE'
              : message === 'PROBE_REQUEST_BOUND' ? 'REQUEST_BOUND_EXCEEDED'
                : /^(Daily validation|Daily sources|Daily batch|Daily content|Gemini returned)/.test(message) ? 'OUTPUT_VALIDATION_FAILED' : 'TEST_UNCONFIRMED' };
        if (status) {
          result.httpStatus = Number(status[1]);
          result.field = ['thinkingLevel', 'responseJsonSchema', 'responseMimeType', 'maxOutputTokens'].find(field => message.includes(field));
        }
        return resultReply(result);
      }
    } catch { return reply({ error: 'Private test service unavailable. No automatic retry.' }, 503); }
  };
}
