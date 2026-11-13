import type { PracticeProgress } from "./dailyPracticeProgress";

/** Browser-local acknowledgement of reviewing a completed case's mistakes.
 * It is a navigation preference, never a grade, certificate, or analytics event.
 */
const REVIEWED_KEY = "tradehq:daily-mistakes-reviewed:v1";
type ReviewMarker = { date: string; bankId: string; exerciseId: string };

function marker(progress: PracticeProgress): ReviewMarker {
  return { date: progress.date, bankId: progress.bankId, exerciseId: String(progress.exercise.id) };
}

function hasMissedAnswers(progress: PracticeProgress | null): progress is PracticeProgress {
  return !!progress && progress.answers.length === progress.exercise.questions.length
    && progress.answers.some((answer, i) => answer !== progress.exercise.questions[i].correctAnswer);
}

export function hasReviewedDailyMistakes(progress: PracticeProgress | null, storage?: Pick<Storage, "getItem">): boolean {
  if (!hasMissedAnswers(progress)) return false;
  try {
    const saved: unknown = JSON.parse((storage ?? localStorage).getItem(REVIEWED_KEY) ?? "null");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return false;
    const value = saved as Partial<ReviewMarker>;
    const current = marker(progress);
    return value.date === current.date && value.bankId === current.bankId && value.exerciseId === current.exerciseId;
  } catch { return false; }
}

export function acknowledgeDailyMistakes(progress: PracticeProgress, storage?: Pick<Storage, "setItem">): boolean {
  if (!hasMissedAnswers(progress)) return false;
  try {
    (storage ?? localStorage).setItem(REVIEWED_KEY, JSON.stringify(marker(progress)));
    return true;
  } catch { return false; }
}
