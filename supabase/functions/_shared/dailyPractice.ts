export const DAILY_CATEGORIES = ["Portfolio arithmetic", "Costs and orders", "Price data", "Risk and uncertainty", "Decision habits"] as const;
export const MIN_DAILY_EXPLANATION_CHARS = 100;
export const DAILY_VISUAL_LIMITS = Object.freeze({ captionMin: 10, captionMax: 240, unitMin: 1, unitMax: 30,
  barsMin: 2, barsMax: 6, labelMin: 1, labelMax: 50, valueMin: 0, valueMax: 1e9 });
export interface PracticeQuestion { prompt: string; options: string[]; correctAnswer: number; explanation: string }
export interface DailyExercise {
  id: string; title: string; category: string; scenario: string;
  visual: { caption: string; unit: string; bars: { label: string; value: number }[] };
  questions: PracticeQuestion[]; reflection: string; reflectionGuide: string;
  sources: { label: string; url: string }[];
}
export interface DailyBatch { id: string; effectiveFrom: string; exercises: DailyExercise[]; reviewer?: string; reviewedAt?: string }
const text = (v: unknown, min: number, max: number) => typeof v === "string" && v.trim().length >= min && v.length <= max;
export const normalized = (s: string) => s.toLowerCase().replace(/−/g, "-").replace(/[^a-z0-9+.-]+/g, " ").trim();
function joinReasoning(value: unknown): string {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(part => typeof part === 'string' && part.trim())) return '';
  const [first, second] = value.map(part => part.trim());
  return normalized(first) === normalized(second) ? '' : first + ' ' + second;
}

/** Convert provider-only sentence pairs to the existing stored exercise format. */
export function assembleDailyExercises(items: unknown): unknown {
  if (!Array.isArray(items)) return items;
  return items.map(exercise => {
    if (!exercise || typeof exercise !== 'object' || Array.isArray(exercise)) return exercise;
    return {
      ...exercise,
      reflectionGuide: joinReasoning(exercise.reflectionGuide),
      questions: Array.isArray(exercise.questions) ? exercise.questions.map(question =>
        question && typeof question === 'object' && !Array.isArray(question)
          ? { ...question, explanation: joinReasoning(question.explanation) }
          : question) : exercise.questions,
    };
  });
}

export function validateExercises(value: unknown, count = 50, questionCount?: number): string[] {
  const errors: string[] = [];
  if (!Array.isArray(value) || value.length !== count) return [`A batch needs exactly ${count} exercises.`];
  const ids = new Set<string>(), titles = new Set<string>(), prompts = new Set<string>();
  value.forEach((e, i) => {
    const label = `Exercise ${i + 1}`;
    if (!e || typeof e !== "object") { errors.push(`${label} is invalid.`); return; }
    if (!text(e.id, 1, 90) || !/^[a-z0-9-]+$/.test(e.id) || ids.has(e.id)) errors.push(`${label} needs a unique ID.`);
    ids.add(e.id);
    if (!text(e.title, 8, 120) || titles.has(normalized(typeof e.title === "string" ? e.title : ""))) errors.push(`${label} needs a distinct title.`);
    titles.add(normalized(typeof e.title === "string" ? e.title : ""));
    if (!(DAILY_CATEGORIES as readonly string[]).includes(e.category)) errors.push(`${label} needs a supported category.`);
    if (!text(e.scenario, 180, 5000)) errors.push(`${label} needs a substantial scenario.`);
    const v = e.visual;
    const limits = DAILY_VISUAL_LIMITS;
    // Fixed field codes only: identify failures without retaining generated prose.
    const visualRules = [
      !text(v?.caption, limits.captionMin, limits.captionMax) && 'VISUAL_CAPTION',
      !text(v?.unit, limits.unitMin, limits.unitMax) && 'VISUAL_UNIT',
      (!Array.isArray(v?.bars) || v.bars.length < limits.barsMin || v.bars.length > limits.barsMax) && 'VISUAL_BAR_COUNT',
      Array.isArray(v?.bars) && v.bars.some((b: { label?: unknown } | null) => !text(b?.label, limits.labelMin, limits.labelMax)) && 'VISUAL_BAR_LABEL',
      Array.isArray(v?.bars) && v.bars.some((b: { value?: unknown } | null) => typeof b?.value !== 'number' || !Number.isFinite(b.value) || b.value < limits.valueMin || b.value > limits.valueMax) && 'VISUAL_BAR_VALUE',
    ].filter(Boolean);
    if (visualRules.length) errors.push(`${label} needs a labelled nonnegative illustration (${visualRules.join(', ')}).`);
    if (!Array.isArray(e.questions) || (questionCount ? e.questions.length !== questionCount : ![3, 10].includes(e.questions.length))) errors.push(`${label} needs ${questionCount ?? 'three saved or ten new'} questions.`);
    else e.questions.forEach((q: PracticeQuestion, n: number) => {
      if (!q || !text(q.prompt, 12, 450) || !text(q.explanation, MIN_DAILY_EXPLANATION_CHARS, 2000) || !Array.isArray(q.options) || q.options.length !== 3
        || q.options.some(o => !text(o, 1, 350)) || new Set(q.options.map(normalized)).size !== 3
        || !Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer > 2) errors.push(`${label}, question ${n + 1} is incomplete.`);
      if (q && text(q.prompt, 12, 450)) { const p = normalized(q.prompt); if (prompts.has(p)) errors.push(`${label} repeats a question.`); prompts.add(p); }
    });
    if (!text(e.reflection, 20, 500) || !text(e.reflectionGuide, 120, 1800)) errors.push(`${label} needs a reflection and a useful review guide.`);
    if (!Array.isArray(e.sources) || e.sources.length < 1 || e.sources.length > 4 || e.sources.some((s: { label: string; url: string }) => !s || !text(s.label, 3, 160)
      || !/^https:\/\/(www\.investor\.gov|www\.finra\.org|www\.cftc\.gov|www\.federalreserve\.gov|docs\.coingecko\.com|www\.coingecko\.com)\/[^\s<>]*$/.test(s.url))) errors.push(`${label} needs a supported primary source.`);
  });
  return errors;
}
export function validateBatch(value: unknown): value is DailyBatch {
  const b = value as DailyBatch;
  return !!b && typeof b === "object" && text(b.id, 1, 90) && /^\d{4}-\d{2}-\d{2}$/.test(b.effectiveFrom)
    && Number.isFinite(Date.parse(b.effectiveFrom)) && new Date(b.effectiveFrom).toISOString().slice(0, 10) === b.effectiveFrom && validateExercises(b.exercises).length === 0;
}
/** Calendar date, independent of elapsed hours and daylight-saving transitions. */
export function practiceDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function exerciseForDate(batch: DailyBatch, date = practiceDate()): DailyExercise {
  const n = Math.floor((Date.parse(date) - Date.parse(batch.effectiveFrom)) / 86400000);
  return batch.exercises[((n % batch.exercises.length) + batch.exercises.length) % batch.exercises.length];
}
