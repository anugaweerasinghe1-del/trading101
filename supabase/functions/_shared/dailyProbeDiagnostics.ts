import { assembleDailyExercises } from "./dailyPracticeGenerator.ts";

/** Fixed classifications and numeric measurements only; never retain model prose. */
export const PROBE_FINISH_REASONS = ['STOP', 'MAX_TOKENS', 'SAFETY', 'RECITATION', 'OTHER', 'NOT_REPORTED', 'UNRECOGNIZED'] as const;
export const PROBE_STAGES = ['RESPONSE_ENVELOPE', 'MODEL_JSON', 'EXERCISE_STRUCTURE', 'SOURCE_ALLOWLIST', 'CATEGORY_COVERAGE', 'REPETITION'] as const;
export const PROBE_RULES = ['EXERCISE_COUNT', 'ID', 'TITLE', 'CATEGORY', 'SCENARIO', 'VISUAL', 'QUESTION_COUNT', 'QUESTION_FIELDS', 'DUPLICATE_QUESTION', 'REFLECTION', 'CITATION'] as const;
export interface ProbeDiagnostics {
  provider?: { finishReason: typeof PROBE_FINISH_REASONS[number]; inputTokens: number | null; outputTokens: number | null; totalTokens: number | null; textChars: number | null };
  validation?: { stage: typeof PROBE_STAGES[number]; rules: typeof PROBE_RULES[number][]; exercise: number | null; question: number | null };
  structure?: { exerciseCount: number; questionCounts: (number | null)[]; minExplanationChars: number | null; minScenarioChars: number | null; minGuideChars: number | null };
}
const count = (value: unknown): number | null => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const numericOrNull = (value: unknown) => value === null || count(value) !== null;
export function providerDiagnostics(raw: string): ProbeDiagnostics {
  let envelope;
  try { envelope = JSON.parse(raw); } catch { return {}; }
  const candidate = envelope?.candidates?.[0], usage = envelope?.usageMetadata;
  const finish = candidate?.finishReason;
  const parts: unknown = candidate?.content?.parts;
  const text = Array.isArray(parts) ? parts.filter(p => p && !p.thought && typeof p.text === 'string').map(p => p.text).join('') : null;
  const result: ProbeDiagnostics = { provider: {
    finishReason: finish === undefined ? 'NOT_REPORTED' : PROBE_FINISH_REASONS.includes(finish) ? finish : 'UNRECOGNIZED',
    inputTokens: count(usage?.promptTokenCount), outputTokens: count(usage?.candidatesTokenCount),
    totalTokens: count(usage?.totalTokenCount), textChars: text === null ? null : text.length,
  } };
  try {
    const items = assembleDailyExercises(JSON.parse(text ?? '').exercises);
    if (Array.isArray(items)) {
      const first = items.slice(0, 10);
      const length = (value: unknown) => typeof value === 'string' ? value.trim().length : 0;
      const min = (values: number[]) => values.length ? Math.min(...values) : null;
      result.structure = { exerciseCount: items.length,
        questionCounts: first.map(e => Array.isArray(e?.questions) ? e.questions.length : null),
        minExplanationChars: min(first.flatMap(e => Array.isArray(e?.questions) ? e.questions.slice(0, 10).map((q: { explanation?: unknown } | null) => length(q?.explanation)) : [])),
        minScenarioChars: min(first.map(e => length(e?.scenario))), minGuideChars: min(first.map(e => length(e?.reflectionGuide))),
      };
    }
  } catch { /* Incomplete model JSON is classified by the real generator. */ }
  return result;
}
export function validationDiagnostics(message: string): ProbeDiagnostics['validation'] {
  const stage = message.startsWith('Gemini returned an invalid') ? 'RESPONSE_ENVELOPE'
    : message.startsWith('Gemini returned incomplete') ? 'MODEL_JSON'
      : message.startsWith('Daily validation') ? 'EXERCISE_STRUCTURE'
        : message.startsWith('Daily sources') ? 'SOURCE_ALLOWLIST'
          : message.startsWith('Daily batch') ? 'CATEGORY_COVERAGE'
            : message.startsWith('Daily content') ? 'REPETITION' : null;
  if (!stage) return undefined;
  const rules: [RegExp, typeof PROBE_RULES[number]][] = [
    [/exactly \d+ exercises/, 'EXERCISE_COUNT'], [/unique ID/, 'ID'], [/distinct title/, 'TITLE'], [/supported category/, 'CATEGORY'],
    [/substantial scenario/, 'SCENARIO'], [/nonnegative illustration/, 'VISUAL'], [/needs \d+ questions/, 'QUESTION_COUNT'],
    [/question \d+ is incomplete/, 'QUESTION_FIELDS'], [/repeats a question/, 'DUPLICATE_QUESTION'], [/reflection and a useful review guide/, 'REFLECTION'], [/supported primary source/, 'CITATION'],
  ];
  const index = /Exercise (\d+)(?:, question (\d+))?/.exec(message);
  const boundedIndex = (s?: string) => s && Number(s) >= 1 && Number(s) <= 10 ? Number(s) : null;
  return { stage, rules: rules.filter(([test]) => test.test(message)).map(([, rule]) => rule).slice(0, 2),
    exercise: boundedIndex(index?.[1]), question: boundedIndex(index?.[2]) };
}
export function validProbeDiagnostics(value: unknown): value is ProbeDiagnostics {
  if (!record(value) || Object.keys(value).some(key => !['provider', 'validation', 'structure'].includes(key))) return false;
  const p = value.provider, v = value.validation, s = value.structure;
  if (p !== undefined && (!record(p) || Object.keys(p).length !== 5 || !PROBE_FINISH_REASONS.includes(p.finishReason as never)
    || !['inputTokens', 'outputTokens', 'totalTokens', 'textChars'].every(key => numericOrNull(p[key])))) return false;
  if (v !== undefined && (!record(v) || Object.keys(v).length !== 4 || !PROBE_STAGES.includes(v.stage as never)
    || !Array.isArray(v.rules) || v.rules.length > 2 || !v.rules.every(r => PROBE_RULES.includes(r))
    || !['exercise', 'question'].every(key => v[key] === null || typeof v[key] === 'number' && Number.isInteger(v[key]) && v[key] >= 1 && v[key] <= 10))) return false;
  if (s !== undefined && (!record(s) || Object.keys(s).length !== 5 || count(s.exerciseCount) === null
    || !Array.isArray(s.questionCounts) || s.questionCounts.length > 10 || !s.questionCounts.every(numericOrNull)
    || !['minExplanationChars', 'minScenarioChars', 'minGuideChars'].every(key => numericOrNull(s[key])))) return false;
  return true;
}
