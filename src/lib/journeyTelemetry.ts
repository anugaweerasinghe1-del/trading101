/**
 * Consent-only measurement for the first virtual-trade journey.
 * No names, account identifiers, balances, trade IDs, answers or reflections
 * are sent. Amplitude's own consented visitor identity is the only identity.
 * A view is not evidence of learning; milestones are recorded at saved actions.
 */
import { ARENA_ANALYTICS_CONSENT_KEY, ARENA_READY_EVENT, arenaAnalyticsAllowed, utcDayGap } from "./arenaTelemetry";
import type { BeginnerJourneyProgress } from "./beginnerJourney";

export const JOURNEY_VISIT_KEY = "tradehq:journey-analytics-last-visit:v1";
export type JourneyMilestone = "Viewed" | "Returned" | "First Lesson Completed" |
  "First Trade Recorded" | "Portfolio Reviewed" | "Completed";

type AnalyticsWindow = Window & {
  amplitude?: { track: (name: string) => unknown };
  __tradehqAmplitudeStarted?: boolean;
};

function allowed(): boolean {
  if (typeof window === "undefined") return false;
  try { return arenaAnalyticsAllowed(localStorage.getItem(ARENA_ANALYTICS_CONSENT_KEY)); }
  catch { return false; }
}

function ready(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as AnalyticsWindow;
  return w.__tradehqAmplitudeStarted === true && typeof w.amplitude?.track === "function";
}

export function newJourneyMilestones(
  before: BeginnerJourneyProgress,
  after: BeginnerJourneyProgress,
): JourneyMilestone[] {
  const result: JourneyMilestone[] = [];
  if (!before.lessonCompleted && after.lessonCompleted) result.push("First Lesson Completed");
  if (!before.tradeId && !!after.tradeId && after.lessonCompleted) result.push("First Trade Recorded");
  if (!before.portfolioExplained && after.portfolioExplained && !!after.tradeId) result.push("Portfolio Reviewed");
  if (!before.completedAt && !!after.completedAt && after.portfolioExplained) result.push("Completed");
  return result;
}

export function trackConsentedJourneyMilestone(event: JourneyMilestone): void {
  if (!allowed()) return;
  const send = () => {
    if (!allowed() || !ready()) return;
    try { (window as AnalyticsWindow).amplitude?.track("TradeHQ Journey " + event); }
    catch { /* Analytics must never interrupt learning or portfolio saves. */ }
  };
  if (ready()) send();
  else window.addEventListener(ARENA_READY_EVENT, send, { once: true });
}

/** Call only after the local journey update has been saved successfully. */
export function trackConsentedJourneyProgress(
  before: BeginnerJourneyProgress,
  after: BeginnerJourneyProgress,
): void {
  for (const event of newJourneyMilestones(before, after)) trackConsentedJourneyMilestone(event);
}

/**
 * Count consented journeys opened and same-browser visits on later UTC days.
 * Does not classify a page load as completion or track users who decline consent.
 */
export function recordConsentedJourneyVisit(date = new Date()): boolean {
  if (!allowed() || !ready()) return false;
  const day = date.toISOString().slice(0, 10);
  trackConsentedJourneyMilestone("Viewed");
  try {
    const previous = localStorage.getItem(JOURNEY_VISIT_KEY);
    const gap = utcDayGap(previous, day);
    if (gap !== null && gap >= 1 && gap <= 30) trackConsentedJourneyMilestone("Returned");
    localStorage.setItem(JOURNEY_VISIT_KEY, day);
  } catch { /* Disabled storage cannot block journey navigation. */ }
  return true;
}
