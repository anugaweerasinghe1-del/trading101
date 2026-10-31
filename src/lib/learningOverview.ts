import { journeyStage, type BeginnerJourneyProgress } from "./beginnerJourney";
import type { CourseProgressState } from "./courseProgress";

export interface LearningTrack {
  slug: string;
  title: string;
  lessons: { slug: string; title: string; readingMinutes: number }[];
}
export interface LearningNextStep {
  href: string;
  title: string;
  trackTitle: string;
  reason: string;
  inProgress: boolean;
}
export interface LearningOverview {
  journeyDone: number;
  journeyStage: number;
  journeyFinished: boolean;
  lessonsDone: number;
  lessonsTotal: number;
  lessonsInProgress: number;
  next: LearningNextStep | null;
}

/**
 * A read-only projection of the existing guest learning stores.
 * Never touches portfolio records, account trades, rankings or balances.
 */
export function buildLearningOverview(
  tracks: LearningTrack[],
  course: CourseProgressState,
  journey: BeginnerJourneyProgress,
): LearningOverview {
  const stage = journeyStage(journey);
  const journeyFinished = stage === 4 && Boolean(journey.completedAt);
  let lessonsDone = 0;
  let lessonsInProgress = 0;
  let lessonsTotal = 0;
  for (const track of tracks) {
    for (const lesson of track.lessons) {
      lessonsTotal++;
      const status = course.tracks[track.slug]?.lessons[lesson.slug]?.status;
      if (status === "completed") lessonsDone++;
      else if (status === "in-progress") lessonsInProgress++;
    }
  }
  const pick = (track: LearningTrack, lesson: LearningTrack["lessons"][number], reason: string): LearningNextStep => ({
    href: "/courses/" + encodeURIComponent(track.slug) + "/" + encodeURIComponent(lesson.slug),
    title: lesson.title, trackTitle: track.title, reason,
    inProgress: course.tracks[track.slug]?.lessons[lesson.slug]?.status === "in-progress",
  });
  let next: LearningNextStep | null = null;
  if (course.lastLesson) {
    const track = tracks.find(t => t.slug === course.lastLesson?.track);
    const lesson = track?.lessons.find(l => l.slug === course.lastLesson?.lesson);
    if (track && lesson) {
      if (course.tracks[track.slug]?.lessons[lesson.slug]?.status !== "completed") {
        next = pick(track, lesson, "Resume your unfinished lesson");
      } else {
        const following = track.lessons.find(l => course.tracks[track.slug]?.lessons[l.slug]?.status !== "completed");
        if (following) next = pick(track, following, "Next lesson in your current course");
      }
    }
  }
  if (!next) {
    for (const track of tracks) {
      const partial = track.lessons.find(l => course.tracks[track.slug]?.lessons[l.slug]?.status === "in-progress");
      if (partial) { next = pick(track, partial, "Resume your unfinished lesson"); break; }
    }
  }
  if (!next) {
    for (const track of tracks) {
      const started = track.lessons.some(l => course.tracks[track.slug]?.lessons[l.slug]?.status === "completed");
      const remaining = track.lessons.find(l => course.tracks[track.slug]?.lessons[l.slug]?.status !== "completed");
      if (started && remaining) { next = pick(track, remaining, "Continue this course"); break; }
    }
  }
  if (!next) {
    const beginner = tracks.find(t => t.slug === "trading-psychology-mastery" && t.lessons.length) ??
      tracks.find(t => t.lessons.length > 0);
    if (beginner) {
      const first = beginner.lessons.find(l => course.tracks[beginner.slug]?.lessons[l.slug]?.status !== "completed");
      if (first) next = pick(beginner, first, "Suggested structured course lesson");
    }
  }
  return {
    journeyDone: journeyFinished ? 5 : stage, journeyStage: stage, journeyFinished,
    lessonsDone, lessonsTotal, lessonsInProgress, next,
  };
}
