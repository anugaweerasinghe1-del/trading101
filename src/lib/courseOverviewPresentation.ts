/** Only these authored overviews have integrated their full publisher copy. */
const integratedPaths = new Set([
  "/courses/options-trading-fundamentals",
  "/courses/futures-and-derivatives",
  "/courses/macro-reading-for-traders",
  "/courses/trading-psychology-mastery",
]);

export const hasIntegratedCourseOverview = (path: string) => integratedPaths.has(path);
