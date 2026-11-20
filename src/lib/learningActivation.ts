import type { CourseProgressState } from "./courseProgress";
import type { BeginnerJourneyProgress } from "./beginnerJourney";
import { buildLearningOverview, type LearningTrack } from "./learningOverview";

export interface LearningActivation {
  href: string;
  heading: string;
  description: string;
  buttonLabel: string;
  state: "start" | "journey" | "lesson" | "mastery";
}

/**
 * Reuse the existing learner progress and approved catalog; never create a
 * separate onboarding record or equate visits with completed lessons.
 */
export function chooseLearningActivation(
  tracks: LearningTrack[],
  course: CourseProgressState,
  journey: BeginnerJourneyProgress,
  mastery: { href: string; label: string; reason: string },
): LearningActivation {
  const overview = buildLearningOverview(tracks, course, journey);
  const hasLessonHistory = overview.lessonsDone > 0 ||
    overview.lessonsInProgress > 0 ||
    overview.next?.inProgress === true;

  if (hasLessonHistory && overview.next) {
    return {
      href: overview.next.href,
      heading: overview.next.title,
      description: overview.next.reason + " · " + overview.next.trackTitle,
      buttonLabel: overview.next.inProgress ? "Resume my lesson" : "Continue learning",
      state: "lesson",
    };
  }
  if (hasLessonHistory && !overview.next) {
    return {
      href: mastery.href,
      heading: "Keep your knowledge active",
      description: mastery.reason,
      buttonLabel: mastery.label,
      state: "mastery",
    };
  }
  if (!overview.journeyFinished) {
    return overview.journeyDone > 0
      ? {
        href: "/start",
        heading: "Continue your first-trade lesson",
        description: "Resume your saved step. The practice order is voluntary and uses virtual money only.",
        buttonLabel: "Continue my journey",
        state: "journey",
      }
      : {
        href: "/start",
        heading: "Understand your first virtual trade",
        description: "Start with a short explanation of orders and fees, then practise when you feel ready. No real money or signup is required.",
        buttonLabel: "Start learning",
        state: "start",
      };
  }
  if (overview.next) {
    return {
      href: overview.next.href,
      heading: overview.next.title,
      description: overview.next.reason + " · " + overview.next.trackTitle,
      buttonLabel: "Start my next lesson",
      state: "lesson",
    };
  }
  return {
    href: mastery.href,
    heading: "Keep learning through practice",
    description: mastery.reason,
    buttonLabel: mastery.label,
    state: "mastery",
  };
}
