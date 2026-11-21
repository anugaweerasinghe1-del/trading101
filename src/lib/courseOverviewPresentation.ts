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
export function courseMetaDescription(track: { slug: string; tagline: string; description?: string; lessons: readonly unknown[] }): string {
  // Dynamic, owner-approved courses serve their own description in initial HTML.
  // Keep the hydrated head identical rather than swapping in a generic tagline.
  if (!hasIntegratedCourseOverview(`/courses/${track.slug}`) && track.description) {
    return track.description.slice(0, 155);
  }
  const core = `${track.tagline} ${track.lessons.length} free lessons with quizzes and a completion badge.`;
  return track.slug === "futures-and-derivatives"
    ? `${core} Futures contracts are worksheet-only.`
    : core;
}

export function coursePageTitle(track: { slug: string; title: string }): string {
  return hasIntegratedCourseOverview(`/courses/${track.slug}`)
    ? `${track.title} — Free Trading Course | TradeHQ`
    : `${track.title} | TradeHQ`;
}

export function coursePracticeScope(slug: string): string {
  return slug === "options-trading-fundamentals" || slug === "futures-and-derivatives"
    ? "The $100,000 simulator supports virtual spot-style instruments; options and futures contract mechanics are worksheet exercises."
    : "The $100,000 simulator supports virtual spot-style instruments; no real-money brokerage orders are placed.";
}
