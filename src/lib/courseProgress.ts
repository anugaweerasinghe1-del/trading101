/**
 * Course progress persistence — localStorage-backed, versioned schema.
 * Tracks lesson completion, quiz scores, badges earned, and last-read
 * lesson so users can resume where they left off across sessions.
 */
export interface LessonProgress {
  status: "not-started" | "in-progress" | "completed";
  score?: number;
  completedAt?: string;
  scrolledPct?: number;
  quizAnswers?: Record<string, number>;
}

export interface TrackProgress {
  lessons: Record<string, LessonProgress>;
  badgeEarnedAt?: string;
}

export interface CourseProgressState {
  v: 1;
  tracks: Record<string, TrackProgress>;
  lastLesson?: { track: string; lesson: string; at: string };
  updatedAt: string;
}

export const COURSE_PROGRESS_EVENT = "tradehq:course-progress-updated";
export const COURSE_PROGRESS_KEY = "tradehq_course_progress_v1";
const KEY = COURSE_PROGRESS_KEY;
const emptyTrack = (): TrackProgress => ({ lessons: Object.create(null) });

const empty = (): CourseProgressState => ({
  v: 1,
  tracks: Object.create(null),
  updatedAt: new Date(0).toISOString(),
});

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function timestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

/** Recover malformed fragments without discarding other valid saved progress. */
export function parseCourseProgress(raw: string | null): CourseProgressState {
  try {
    if (!raw) return empty();
    const parsed: unknown = JSON.parse(raw);
    if (!record(parsed) || parsed.v !== 1 || !record(parsed.tracks)) return empty();
    const state = empty();
    state.updatedAt = timestamp(parsed.updatedAt) ? parsed.updatedAt : state.updatedAt;
    for (const [track, value] of Object.entries(parsed.tracks)) {
      if (!record(value)) continue;
      const progress = emptyTrack();
      if (record(value.lessons)) for (const [lesson, item] of Object.entries(value.lessons)) {
        if (!record(item) || typeof item.status !== 'string' || !['not-started', 'in-progress', 'completed'].includes(item.status)) continue;
        const row: LessonProgress = { status: item.status as LessonProgress['status'] };
        if (typeof item.score === 'number' && Number.isInteger(item.score) && item.score >= 0) row.score = item.score;
        if (timestamp(item.completedAt)) row.completedAt = item.completedAt;
        if (typeof item.scrolledPct === 'number' && Number.isFinite(item.scrolledPct) && item.scrolledPct >= 0 && item.scrolledPct <= 100) row.scrolledPct = item.scrolledPct;
        if (record(item.quizAnswers) && row.status !== "completed") {
          const answers: Record<string, number> = Object.create(null);
          for (const [question, option] of Object.entries(item.quizAnswers).slice(0, 24)) {
            if (/^(0|[1-9]\d{0,2})$/.test(question) && typeof option === "number" &&
                Number.isInteger(option) && option >= 0 && option <= 11) answers[question] = option;
          }
          if (Object.keys(answers).length) row.quizAnswers = answers;
        }
        progress.lessons[lesson] = row;
      }
      if (timestamp(value.badgeEarnedAt)) progress.badgeEarnedAt = value.badgeEarnedAt;
      state.tracks[track] = progress;
    }
    if (record(parsed.lastLesson) && typeof parsed.lastLesson.track === 'string' && typeof parsed.lastLesson.lesson === 'string' && timestamp(parsed.lastLesson.at)) {
      state.lastLesson = { track: parsed.lastLesson.track, lesson: parsed.lastLesson.lesson, at: parsed.lastLesson.at };
    }
    return state;
  } catch { return empty(); }
}

export function loadProgress(): CourseProgressState {
  if (typeof window === "undefined") return empty();
  try { return parseCourseProgress(localStorage.getItem(KEY)); }
  catch { return empty(); }
}

function save(state: CourseProgressState) {
  if (typeof window === "undefined") return;
  state.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent?.(new Event(COURSE_PROGRESS_EVENT));
  } catch { /* Disabled browser storage must not claim persistence. */ }
}

export function markLessonStarted(track: string, lesson: string) {
  const s = loadProgress();
  s.tracks[track] ??= emptyTrack();
  const l = s.tracks[track].lessons[lesson];
  if (!l || l.status === "not-started") {
    s.tracks[track].lessons[lesson] = { status: "in-progress" };
  }
  s.lastLesson = { track, lesson, at: new Date().toISOString() };
  save(s);
}

/** Preserve partial quiz answers without changing completed lessons or placing orders. */
export function saveLessonDraft(track: string, lesson: string, answers: Record<number, number>) {
  const s = loadProgress();
  s.tracks[track] ??= emptyTrack();
  const previous = s.tracks[track].lessons[lesson];
  if (previous?.status === "completed") return;
  const clean: Record<string, number> = Object.create(null);
  for (const [question, option] of Object.entries(answers).slice(0, 24)) {
    if (/^(0|[1-9]\d{0,2})$/.test(question) && Number.isInteger(option) && option >= 0 && option <= 11) clean[question] = option;
  }
  s.tracks[track].lessons[lesson] = {
    ...previous, status: "in-progress",
    ...(Object.keys(clean).length ? { quizAnswers: clean } : { quizAnswers: undefined }),
  };
  s.lastLesson = { track, lesson, at: new Date().toISOString() };
  save(s);
}

/** Never turn a completed lesson back into an unfinished one. */
export function saveLessonPosition(track: string, lesson: string, percent: number) {
  if (!Number.isFinite(percent)) return;
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const s = loadProgress();
  s.tracks[track] ??= emptyTrack();
  const previous = s.tracks[track].lessons[lesson];
  if (previous?.status === "completed" || previous?.scrolledPct === pct) return;
  s.tracks[track].lessons[lesson] = { ...previous, status: "in-progress", scrolledPct: pct };
  s.lastLesson = { track, lesson, at: new Date().toISOString() };
  save(s);
}

export function readLessonDraft(track: string, lesson: string) {
  const row = getTrackProgress(track).lessons[lesson];
  return { answers: row?.status === "completed" ? {} : { ...(row?.quizAnswers ?? {}) }, scrolledPct: row?.scrolledPct ?? 0 };
}

export function markLessonCompleted(track: string, lesson: string, score: number) {
  const s = loadProgress();
  s.tracks[track] ??= emptyTrack();
  s.tracks[track].lessons[lesson] = {
    status: "completed",
    score,
    completedAt: new Date().toISOString(),
    scrolledPct: 100,
  };
  s.lastLesson = { track, lesson, at: new Date().toISOString() };
  save(s);
}

export function awardBadge(track: string) {
  const s = loadProgress();
  s.tracks[track] ??= emptyTrack();
  if (!s.tracks[track].badgeEarnedAt) {
    s.tracks[track].badgeEarnedAt = new Date().toISOString();
    save(s);
  }
}

export function getTrackProgress(track: string): TrackProgress {
  return loadProgress().tracks[track] ?? emptyTrack();
}

export function isLessonCompleted(track: string, lesson: string): boolean {
  return getTrackProgress(track).lessons[lesson]?.status === "completed";
}

export function trackCompletionPct(track: string, totalLessons: number): number {
  const p = getTrackProgress(track);
  const done = Object.values(p.lessons).filter((l) => l.status === "completed").length;
  return totalLessons === 0 ? 0 : Math.round((done / totalLessons) * 100);
}
