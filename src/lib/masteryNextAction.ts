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
