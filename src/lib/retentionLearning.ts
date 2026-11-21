import type { CourseProgressState } from "./courseProgress";

/**
 * Reserve small, non-catalog learning tracks in the existing private course
 * progress record. Existing cloud merge/sync applies without a new table or
 * cookies. These are learning receipts, never public badges or trading stats.
 */
export const QUICK_READ_TRACK = "quick-reads";
export const TRADE_REVIEW_TRACK = "trade-learning";
export const TRADE_REVIEW_LESSON = "orders-and-fees";
export const TRADE_RECALL_LESSON = "orders-and-fees-recall";
const DAY = 24 * 60 * 60 * 1000;

export function quickReadKey(id: number): string {
  return `read-${id}`;
}

export function suggestedQuickRead(progress: CourseProgressState, now = Date.now()):
  { id: number; state: "resume" | "recall" } | null {
  const rows = progress.tracks[QUICK_READ_TRACK]?.lessons ?? {};
  const entries = Object.entries(rows)
    .map(([slug, row]) => ({ id: Number(slug.slice(5)), slug, row }))
    .filter(entry => /^read-[1-9]\d{0,2}$/.test(entry.slug));
  const current = progress.lastLesson?.track === QUICK_READ_TRACK
    ? entries.find(entry => entry.slug === progress.lastLesson?.lesson)
    : undefined;
  const unfinished = (current?.row.status === "in-progress" ? current : undefined) ??
    entries.find(entry => entry.row.status === "in-progress");
  if (unfinished) return { id: unfinished.id, state: "resume" };

  // Retrieval practice is voluntary and only suggested after a delay, not
  // every visit. A remembered score is not an estimate of trading competence.
  const completed = entries.filter(entry => entry.row.status === "completed" && entry.row.completedAt)
    .sort((a, b) => Date.parse(b.row.completedAt ?? "") - Date.parse(a.row.completedAt ?? ""));
  const latest = completed[0];
  const elapsed = now - Date.parse(latest?.row.completedAt ?? "");
  return latest && Number.isFinite(elapsed) && elapsed >= DAY
    ? { id: latest.id, state: "recall" } : null;
}

export function tradeReviewStage(progress: CourseProgressState, now = Date.now()):
  "first" | "recall" | "recent" {
  const lessons = progress.tracks[TRADE_REVIEW_TRACK]?.lessons ?? {};
  const first = lessons[TRADE_REVIEW_LESSON];
  if (first?.status !== "completed" || !first.completedAt) return "first";
  const recall = lessons[TRADE_RECALL_LESSON];
  const last = recall?.status === "completed" ? recall.completedAt : first.completedAt;
  const elapsed = now - Date.parse(last ?? "");
  // Wrong answers remain an optional recall opportunity after a day,
  // while a correct review rests for three days. No notification or streak.
  const interval = recall?.status === "completed" && recall.score === 100 ? 3 * DAY : DAY;
  return Number.isFinite(elapsed) && elapsed >= interval ? "recall" : "recent";
}
