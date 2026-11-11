import type { CourseProgressState } from "./courseProgress";
import type { BeginnerJourneyProgress } from "./beginnerJourney";
import { buildLearningOverview, type LearningTrack, type LearningNextStep } from "./learningOverview";

function hasPublishedCourseActivity(tracks: LearningTrack[], progress: CourseProgressState): boolean {
  return tracks.some(track => track.lessons.some(lesson =>
    Boolean(progress.tracks[track.slug]?.lessons[lesson.slug]) ||
    (progress.lastLesson?.track === track.slug && progress.lastLesson.lesson === lesson.slug)));
}

/** Resume only an approved, unfinished published lesson, never the stale last-visited slug. */
export function chooseCourseContinuation(
  tracks: LearningTrack[],
  progress: CourseProgressState,
  journey: BeginnerJourneyProgress,
): LearningNextStep | null {
  if (!hasPublishedCourseActivity(tracks, progress)) return null;
  return buildLearningOverview(tracks, progress, journey).next;
}

export interface ReturnDestination { href: string; label: string }

function safePreviousRoute(path: string): boolean {
  return /^\/(?:trade(?:\/[a-z0-9-]+)?|wiki\/[a-z0-9-]+|learn(?:\/[a-z0-9-]+)?|portfolio|leaderboard|markets|daily|practice|start|ai-mentor)$/i.test(path);
}

/** An old route can disappear; course links must always use the current approved catalog. */
export function chooseReturnDestination(
  tracks: LearningTrack[],
  progress: CourseProgressState,
  journey: BeginnerJourneyProgress,
  previousRoute: string | null,
): ReturnDestination | null {
  const hasCourseActivity = hasPublishedCourseActivity(tracks, progress);
  const next = chooseCourseContinuation(tracks, progress, journey);
  if (next) return {
    href: next.href,
    label: next.inProgress ? "your unfinished lesson — " + next.title : "your next lesson — " + next.title,
  };
  if (hasCourseActivity) return {
    href: "/daily",
    label: "Daily Practice after finishing the available lessons",
  };
  if (previousRoute?.startsWith("/courses")) return { href: "/courses", label: "the approved course catalog" };
  if (!previousRoute || !safePreviousRoute(previousRoute)) return null;
  if (previousRoute.startsWith("/trade/")) return { href: previousRoute, label: "your last trade — " + previousRoute.split("/").pop()?.toUpperCase() };
  if (previousRoute.startsWith("/wiki/")) return { href: previousRoute, label: "the wiki entry you were reading" };
  if (previousRoute.startsWith("/learn")) return { href: previousRoute, label: "your learning page" };
  const labels: Record<string, string> = {
    "/trade": "the virtual trading terminal", "/portfolio": "your portfolio", "/leaderboard": "the leaderboard", "/markets": "the markets page",
    "/daily": "Daily Practice", "/practice": "Practice Arena", "/start": "Start Here",
    "/ai-mentor": "the learning Mentor",
  };
  return { href: previousRoute, label: labels[previousRoute] ?? "where you left off" };
}
