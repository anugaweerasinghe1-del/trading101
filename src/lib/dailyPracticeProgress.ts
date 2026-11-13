import { exerciseForDate, practiceDate, validateExercises, type DailyBatch, type DailyExercise } from '../../supabase/functions/_shared/dailyPractice';
export interface PracticeProgress { date: string; bankId: string; exercise: DailyExercise; answers: number[]; reflection: string }
const KEY = 'tradehq:deeper-practice:v1';
export function validProgress(value: unknown): value is PracticeProgress {
  const p = value as PracticeProgress;
  return !!p && typeof p === 'object' && typeof p.date === 'string' && p.date === practiceDate(new Date(p.date + 'T12:00:00'))
    && typeof p.bankId === 'string' && validateExercises([p.exercise], 1).length === 0
    && Array.isArray(p.answers) && p.answers.length <= p.exercise.questions.length && p.answers.every(a => Number.isInteger(a) && a >= 0 && a <= 2)
    && typeof p.reflection === 'string' && p.reflection.length <= 1500;
}
export function readPractice(date = practiceDate(), storage?: Pick<Storage, 'getItem'>): PracticeProgress | null {
  try { const rows: unknown = JSON.parse((storage ?? globalThis.localStorage).getItem(KEY) ?? '[]');
    return Array.isArray(rows) ? rows.find(p => validProgress(p) && p.date === date) ?? null : null;
  } catch { return null; }
}
/** Read only complete past case attempts from this browser. No analytics or account transfer. */
export function readPracticeHistory(beforeDate = practiceDate(), storage?: Pick<Storage, 'getItem'>): PracticeProgress[] {
  try {
    const raw: unknown = JSON.parse((storage ?? globalThis.localStorage).getItem(KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter((p): p is PracticeProgress => validProgress(p)
      && p.date < beforeDate && p.answers.length === p.exercise.questions.length)
      .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  } catch { return []; }
}

/** Select a reviewed case in a recently missed category; never change a saved day's case. */
export function choosePracticeExercise(bank: DailyBatch, date: string, history: readonly PracticeProgress[] = []): DailyExercise {
  const usual = exerciseForDate(bank, date);
  const day = Date.parse(date + 'T12:00:00Z');
  if (!Number.isFinite(day)) return usual;
  const recent = history.filter(p => validProgress(p) && p.date < date
    && p.answers.length === p.exercise.questions.length
    && day - Date.parse(p.date + 'T12:00:00Z') <= 30 * 86400000)
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  const missed = new Map<string, { count: number; last: string }>();
  for (const entry of recent) {
    const errors = entry.answers.filter((answer, index) => answer !== entry.exercise.questions[index].correctAnswer).length;
    if (!errors) continue;
    const previous = missed.get(entry.exercise.category);
    missed.set(entry.exercise.category, { count: (previous?.count ?? 0) + errors,
      last: previous?.last && previous.last > entry.date ? previous.last : entry.date });
  }
  const topic = [...missed.entries()].sort((a, b) => b[1].count - a[1].count
    || b[1].last.localeCompare(a[1].last) || a[0].localeCompare(b[0]))[0]?.[0];
  if (!topic) return usual;
  const alreadySeen = new Set(recent.filter(p => p.bankId === bank.id).map(p => p.exercise.id));
  const fresh = bank.exercises.filter(e => e.category === topic && !alreadySeen.has(e.id));
  if (!fresh.length) return usual;
  const seed = Number(date.replace(/-/g, ''));
  return fresh[Number.isFinite(seed) ? seed % fresh.length : 0];
}

export function newPractice(bank: DailyBatch, date = practiceDate(), history: readonly PracticeProgress[] = []): PracticeProgress {
  return { date, bankId: bank.id, exercise: choosePracticeExercise(bank, date, history), answers: [], reflection: '' };
}
/** Extend the original three questions only when their exact snapshot still matches. */
export function canExtendPractice(old: PracticeProgress, next: PracticeProgress) {
  return old.date === next.date && old.exercise.id === next.exercise.id
    && old.exercise.questions.length === 3 && next.exercise.questions.length === 10
    && JSON.stringify(old.exercise.questions) === JSON.stringify(next.exercise.questions.slice(0, 3))
    && old.answers.every((answer, i) => next.answers[i] === answer);
}
export function upgradePractice(progress: PracticeProgress, bank: DailyBatch): PracticeProgress {
  const exercise = bank.exercises.find(e => e.id === progress.exercise.id);
  if (!exercise) return progress;
  const next = { ...progress, exercise, bankId: bank.id };
  return canExtendPractice(progress, next) ? next : progress;
}
/** Preserve the first recorded answers and case snapshot across tabs; no account sync. */
export function savePractice(progress: PracticeProgress, storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  try {
    const raw: unknown = JSON.parse((storage ?? globalThis.localStorage).getItem(KEY) ?? '[]');
    const rows = Array.isArray(raw) ? raw.filter(validProgress) : [];
    const old = rows.find(p => p.date === progress.date);
    const conflicts = old && !canExtendPractice(old, progress) && (
      old.bankId !== progress.bankId || JSON.stringify(old.exercise) !== JSON.stringify(progress.exercise)
      || old.answers.some((answer, i) => progress.answers[i] !== answer)
    );
    const next = conflicts ? old : progress;
    (storage ?? globalThis.localStorage).setItem(KEY, JSON.stringify([next, ...rows.filter(p => p.date !== next.date)].slice(0, 60)));
    return { progress: next, saved: true };
  } catch { return { progress, saved: false }; }
}

/** The UI must not credit a Daily streak if the final answer was never persisted. */
export function savedPracticeComplete(result: ReturnType<typeof savePractice>): boolean {
  return result.saved && result.progress.answers.length === result.progress.exercise.questions.length;
}
