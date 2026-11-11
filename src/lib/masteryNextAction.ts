/** Read-only selection for learners who have completed every available lesson.
 * Never infer competence, place orders, or write any portfolio or learning data.
 */
export type MasteryNextAction = { href: "/daily" | "/trade" | "/portfolio"; label: string; reason: string };
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
export function chooseMasteryNextActionForTradeCount(playedToday: boolean, tradeCount: number | null): MasteryNextAction {
  if (tradeCount === null && playedToday) return {
    href: "/portfolio", label: "Check your saved portfolio",
    reason: "Your account trade history is not yet available. Review it before choosing another virtual trade.",
  };
  return chooseMasteryNextAction(playedToday, (tradeCount ?? 0) > 0);
}
