/** Only these authored overviews have integrated their full publisher copy. */
const integratedPaths = new Set([
  "/courses/options-trading-fundamentals",
  "/courses/futures-and-derivatives",
  "/courses/macro-reading-for-traders",
  "/courses/trading-psychology-mastery",
]);

export const hasIntegratedCourseOverview = (path: string) => integratedPaths.has(path);

/**
 * Preserve the subject of each course in both the crawler-visible metadata and
 * the hydrated React page. Derivatives warnings are relevant to derivatives
 * teaching, but repeating them on unrelated tracks obscures the actual topic.
 */
export function courseMetaDescription(track: { slug: string; tagline: string; lessons: readonly unknown[] }): string {
  const core = `${track.tagline} ${track.lessons.length} free lessons with quizzes and a completion badge.`;
  return track.slug === "futures-and-derivatives"
    ? `${core} Futures contracts are worksheet-only.`
    : core;
}

export function coursePracticeScope(slug: string): string {
  return slug === "options-trading-fundamentals" || slug === "futures-and-derivatives"
    ? "The $100,000 simulator supports virtual spot-style instruments; options and futures contract mechanics are worksheet exercises."
    : "The $100,000 simulator supports virtual spot-style instruments; no real-money brokerage orders are placed.";
}
