/**
 * New learning-funnel measurement is suspended: the existing adult v3
 * analytics choice covers Arena and leaderboard registration only.
 * Keep the educational call sites intact, but never send events or write
 * a visit marker under that earlier permission. Any future measurement
 * requires a separately reviewed disclosure and fresh, informed adult opt-in.
 */
export const LEARNING_VISIT_KEY = "tradehq:learning-analytics-last-seen:v1";
export type LearningMilestone =
  | "Quick Read Started"
  | "Quick Read Completed"
  | "Trade Review Viewed"
  | "Trade Review Completed"
  | "Learning Hub Viewed"
  | "Bitcoin Simulator Viewed"
  | "Bitcoin Guide Selected"
  | "Bitcoin Glossary Selected"
  | "Mobile Order Panel Opened"
  | "Virtual Practice Order Confirmed"
  | "Virtual Practice Order Rejected";

export function trackLearningMilestone(_event: LearningMilestone): void {
  // Intentionally disabled; practice and learning never depend on analytics.
}

export function recordConsentedLearningVisit(_date?: Date): void {
  // Intentionally disabled; do not create a local visit marker.
}
