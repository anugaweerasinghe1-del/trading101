import type { CourseProgressState } from "./courseProgress";
import type { BeginnerJourneyProgress } from "./beginnerJourney";
import { buildLearningOverview, type LearningTrack } from "./learningOverview";
import { suggestedQuickRead, tradeReviewStage } from "./retentionLearning";

export interface LearningActivation {
  href: string;
  heading: string;
  description: string;
  buttonLabel: string;
  state: "start" | "journey" | "lesson" | "mastery" | "quick-read" | "trade" | "recall";
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
  activity: { hasPracticeTrade?: boolean; now?: number } = {},
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
  const quick = suggestedQuickRead(course, activity.now);
  if (quick?.state === "resume") {
    return {
      href: "/learn/" + quick.id,
      heading: "Pick up your saved quick read",
      description: "Continue where you left off. Your reading and quiz progress stays private.",
      buttonLabel: "Resume my reading",
      state: "quick-read",
    };
  }
  // Someone who has already begun the guided journey should complete the
  // saved stage before seeing an unrelated new recommendation.
  if (overview.journeyDone > 0 && !overview.journeyFinished) {
    return {
      href: "/start",
      heading: "Continue your first-trade lesson",
      description: "Resume your saved step. Every simulated trade remains voluntary.",
      buttonLabel: "Continue my journey",
      state: "journey",
    };
  }
  if (activity.hasPracticeTrade) {
    const review = tradeReviewStage(course, activity.now);
    if (review === "first") return {
      href: "/learn/trade-review",
      heading: "You've traded. Now understand the numbers.",
      description: "Review a saved virtual order's cash movement and fees, then answer one optional question. No new trade is required.",
      buttonLabel: "Understand my trade",
      state: "trade",
    };
    if (review === "recall") return {
      href: "/learn/trade-review?review=1",
      heading: "Can you recall what your trade taught you?",
      description: "A short, optional knowledge refresh based on your earlier review. No streaks or trading targets.",
      buttonLabel: "Review one concept",
      state: "recall",
    };
  }
  if (quick?.state === "recall") return {
    href: "/learn/" + quick.id,
    heading: "Revisit something you learned",
    description: "A short review after a break helps you check what you still remember.",
    buttonLabel: "Review my quick read",
    state: "recall",
  };
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
