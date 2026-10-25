/** Only bundled lessons whose full reference copy is integrated in main. */
const integratedPaths = new Set([
  "/courses/futures-and-derivatives/contango-and-backwardation",
  "/courses/futures-and-derivatives/hedging-with-futures",
  "/courses/futures-and-derivatives/margin-and-leverage-in-futures",
  "/courses/futures-and-derivatives/micro-futures-for-beginners",
  "/courses/futures-and-derivatives/what-is-a-futures-contract",
  "/courses/macro-reading-for-traders/putting-macro-signals-together",
  "/courses/macro-reading-for-traders/reading-cpi-and-inflation",
  "/courses/macro-reading-for-traders/the-dollar-index-dxy",
  "/courses/macro-reading-for-traders/the-fed-and-fomc-cycle",
  "/courses/macro-reading-for-traders/the-yield-curve-and-recession",
  "/courses/options-trading-fundamentals/defined-risk-spreads",
  "/courses/options-trading-fundamentals/implied-volatility-and-earnings",
  "/courses/options-trading-fundamentals/options-risk-management",
  "/courses/options-trading-fundamentals/the-greeks-delta-gamma-theta-vega",
  "/courses/options-trading-fundamentals/what-is-an-option",
  "/courses/trading-psychology-mastery/cognitive-biases-in-trading",
  "/courses/trading-psychology-mastery/discipline-and-daily-rituals",
  "/courses/trading-psychology-mastery/handling-drawdowns",
  "/courses/trading-psychology-mastery/revenge-trading-and-tilt",
  "/courses/trading-psychology-mastery/the-trading-journal"
]);

export const hasIntegratedCourseLesson = (path: string) => integratedPaths.has(path);
