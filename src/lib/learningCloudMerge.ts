import { parseCourseProgress, type CourseProgressState, type LessonProgress } from "./courseProgress";
import { parseJourneyProgress, type BeginnerJourneyProgress } from "./beginnerJourney";

const later = (a: string | undefined, b: string | undefined) => (Date.parse(a ?? "") || 0) >= (Date.parse(b ?? "") || 0) ? a : b;
const newer = (a: string | undefined, b: string | undefined) => later(a,b)===a;

function mergeLesson(a: LessonProgress | undefined,b: LessonProgress | undefined, preferA: boolean): LessonProgress {
  if (!a) return b!;
  if (!b) return a;
  if (a.status==="completed" || b.status==="completed") {
    // An existing completion is immutable relative to an unfinished state:
    // changing even a seemingly harmless field breaks exact saved progress.
    if (a.status==="completed" && b.status!=="completed") return a;
    if (b.status==="completed" && a.status!=="completed") return b;
    const selected = preferA ? a : b;
    const higherScore = Math.max(a.score ?? -1, b.score ?? -1);
    return higherScore > (selected.score ?? -1) ? {...selected, score:higherScore} : selected;
  }
  if (a.status==="in-progress" || b.status==="in-progress") return {
    ...(preferA ? a:b), status:"in-progress", scrolledPct: Math.max(a.scrolledPct??0,b.scrolledPct??0),
    quizAnswers: {...(preferA ? b.quizAnswers:a.quizAnswers),...(preferA ? a.quizAnswers:b.quizAnswers)},
  };
  return preferA?a:b;
}

/** Monotonic learning merge: completed lessons never become unfinished. */
export function mergeCourseRecords(local:CourseProgressState, remote:CourseProgressState):CourseProgressState {
  const result:CourseProgressState={v:1,tracks:Object.create(null),
    updatedAt: later(local.updatedAt,remote.updatedAt) ?? local.updatedAt};
  const preferLocal = newer(local.updatedAt,remote.updatedAt);
  for(const slug of new Set([...Object.keys(remote.tracks),...Object.keys(local.tracks)])) {
    const a=local.tracks[slug],b=remote.tracks[slug];
    const lessons:Record<string,LessonProgress>=Object.create(null);
    for(const name of new Set([...Object.keys(b?.lessons??{}),...Object.keys(a?.lessons??{})])) {
      lessons[name]=mergeLesson(a?.lessons[name],b?.lessons[name],preferLocal);
    }
    result.tracks[slug]={lessons,badgeEarnedAt:a?.badgeEarnedAt??b?.badgeEarnedAt};
  }
  result.lastLesson=(newer(local.lastLesson?.at,remote.lastLesson?.at)?local.lastLesson:remote.lastLesson)
    ??local.lastLesson??remote.lastLesson;
  return parseCourseProgress(JSON.stringify(result));
}

/** Journey steps are local learning indicators, not proof of server-ranked trades. */
export function mergeJourneyRecords(a:BeginnerJourneyProgress,b:BeginnerJourneyProgress):BeginnerJourneyProgress {
  const preferA=newer(a.updatedAt,b.updatedAt);
  const fresh=preferA?a:b,older=preferA?b:a;
  return parseJourneyProgress({
    version:1,lessonCompleted:a.lessonCompleted||b.lessonCompleted,
    tradeId:fresh.tradeId??older.tradeId,
    portfolioExplained:a.portfolioExplained||b.portfolioExplained,
    reflection:fresh.reflection.trim()?fresh.reflection:older.reflection,
    completedAt:a.completedAt??b.completedAt,
    updatedAt:later(a.updatedAt,b.updatedAt),
  });
}
