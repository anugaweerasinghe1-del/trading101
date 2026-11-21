/**
 * Private, opt-in learning-funnel measurement. Reuses TradeHQ's existing
 * analytics consent and Amplitude SDK. Never sends user IDs, emails,
 * lesson text, scores, portfolio figures, symbols or URLs.
 */
import { ARENA_ANALYTICS_CONSENT_KEY, ARENA_READY_EVENT, utcDayGap } from "./arenaTelemetry";

export const LEARNING_VISIT_KEY = "tradehq:learning-analytics-last-seen:v1";
export type LearningMilestone =
  | "Quick Read Started"
  | "Quick Read Completed"
  | "Trade Review Viewed"
  | "Trade Review Completed";

type LearningAmplitude = { track: (name: string, properties?: Record<string, number>) => unknown };
type LearningWindow = Window & { amplitude?: LearningAmplitude; __tradehqAmplitudeStarted?: boolean };

function consentGiven(): boolean {
  if (typeof window === "undefined") return false;
  try { return window.localStorage.getItem(ARENA_ANALYTICS_CONSENT_KEY) === "accepted"; }
  catch { return false; }
}

function withActiveAnalytics(fn: (sdk: LearningAmplitude) => void): void {
  if (!consentGiven()) return;
  const send = () => {
    if (!consentGiven()) return;
    const w = window as LearningWindow;
    if (!w.__tradehqAmplitudeStarted || typeof w.amplitude?.track !== "function") return;
    try { fn(w.amplitude); } catch { /* Analytics can never break education. */ }
  };
  const w = window as LearningWindow;
  if (w.__tradehqAmplitudeStarted && typeof w.amplitude?.track === "function") send();
  else window.addEventListener(ARENA_READY_EVENT, send, { once: true });
}

export function trackLearningMilestone(event: LearningMilestone): void {
  withActiveAnalytics(sdk => sdk.track("TradeHQ " + event));
}

/**
 * A consented later-calendar-day return is a same-browser proxy, NOT proof
 * that the visitor studied or an estimate of signed-in D7 retention.
 * Only advance the date if the SDK was ready and the event was attempted.
 */
export function recordConsentedLearningVisit(date = new Date()): void {
  const day = date.toISOString().slice(0, 10);
  withActiveAnalytics(sdk => {
    sdk.track("TradeHQ Learning Viewed");
    try {
      const prior = window.localStorage.getItem(LEARNING_VISIT_KEY);
      const days = utcDayGap(prior, day);
      if (days !== null && days >= 1 && days <= 30) {
        sdk.track("TradeHQ Learning Returned", { days_since_learning_visit: days });
      }
      window.localStorage.setItem(LEARNING_VISIT_KEY, day);
    } catch { /* Restricted browser storage remains fully usable. */ }
  });
}
