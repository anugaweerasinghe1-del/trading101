/** Read-only selection for learners who have completed every available lesson.
 * Never infer competence, place orders, or write any portfolio or learning data.
 */
export type MasteryNextAction = { href: "/daily" | "/daily?review=mistakes#deeper-practice" | "/trade" | "/portfolio"; label: string; reason: string };
export function chooseMasteryNextAction(playedToday: boolean, hasPracticeTrade: boolean): MasteryNextAction {
  if (!playedToday) return {
    href: "/daily", label: "Try today's Daily Practice",
    reason: "A fresh scenario helps you apply what you've learned.",
  };
  if (!hasPracticeTrade) return {
    href: "/trade", label: "Explore virtual trading",
    reason: "You've practised a scenario. Try an optional virtual trade without real money.",
  };
  return {
    href: "/portfolio", label: "Review your virtual portfolio",
    reason: "You've practised today. Reflect on simulated positions and decisions before your next session.",
  };
}

/** An unavailable signed-in snapshot is not proof the learner has never traded. */
export function chooseMasteryNextActionForTradeCount(playedToday: boolean, tradeCount: number | null, reviewMistakes = 0): MasteryNextAction {
  // Recent saved errors are a concrete learning opportunity, not a performance grade.
  // Prefer finishing that review before offering another trade or generic portfolio task.
  if (playedToday && reviewMistakes > 0) return {
    href: "/daily?review=mistakes#deeper-practice",
    label: "Review missed case answers",
    reason: `You have ${reviewMistakes} ${reviewMistakes === 1 ? "answer" : "answers"} to revisit in today's case study. Read the worked explanations before moving on.`,
  };
  if (tradeCount === null && playedToday) return {
    href: "/portfolio", label: "Check your saved portfolio",
    reason: "Your account trade history is not yet available. Review it before choosing another virtual trade.",
  };
  return chooseMasteryNextAction(playedToday, (tradeCount ?? 0) > 0);
}

/**
 * Read-only signals from the longer Daily case. This never assigns proficiency:
 * a missed answer merely suggests explanations worth revisiting.
 */
export function missedDailyCaseAnswers(practice: {
  answers: number[];
  exercise: { questions: Array<{ correctAnswer: number }> };
} | null): number {
  if (!practice || !Array.isArray(practice.answers) ||
      !Array.isArray(practice.exercise?.questions) ||
      practice.exercise.questions.length === 0 ||
      practice.answers.length !== practice.exercise.questions.length) return 0;
  return practice.answers.reduce(
    (missed, answer, index) => missed + (answer === practice.exercise.questions[index].correctAnswer ? 0 : 1), 0,
  );
}
