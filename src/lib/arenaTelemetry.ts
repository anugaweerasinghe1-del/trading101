/**
 * Explicitly consent-gated Practice Arena milestones.
 * No user ID, account ID, email, rationale, score, position, equity or note
 * enters custom event properties. Only the freshly consented, no-autocapture Amplitude SDK handles its
 * own consented visitor/session identity.
 */
import { scenarioById } from "./practiceArena";

export const ARENA_VISIT_KEY = "tradehq:arena-analytics-last-seen:v1";
export const ARENA_ANALYTICS_CONSENT_KEY = "tradehq_consent_v3";
export const ARENA_READY_EVENT = "tradehq:analytics-ready";

export type ArenaMilestone =
  | "Arena Viewed"
  | "Arena Started"
  | "Arena Completed"
  | "Arena Resumed"
  | "Arena Returned";

type ArenaAmplitude = {
  track: (eventName: string, properties?: Record<string, string | number>) => unknown;
};
type ArenaWindow = Window & {
  amplitude?: ArenaAmplitude;
  __tradehqAmplitudeStarted?: boolean;
};

export function arenaAnalyticsAllowed(choice: string | null): boolean {
  return choice === "accepted";
}

export function utcDayGap(previous: string | null, current: string): number | null {
  if (!previous || !/^\d{4}-\d{2}-\d{2}$/.test(previous) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(current)) return null;
  const from = Date.parse(previous + "T00:00:00.000Z");
  const to = Date.parse(current + "T00:00:00.000Z");
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  const gap = (to - from) / 86_400_000;
  return Number.isInteger(gap) && gap >= 0 ? gap : null;
}

function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  try { return arenaAnalyticsAllowed(window.localStorage.getItem(ARENA_ANALYTICS_CONSENT_KEY)); }
  catch { return false; }
}

export function trackArenaMilestone(event: ArenaMilestone, scenarioId?: string, daysSinceLast?: number): void {
  if (!hasConsent()) return;
  const scenario = scenarioId ? scenarioById(scenarioId) : undefined;
  // The call-site is not allowed to attach arbitrary event properties.
  const props: Record<string, string | number> = {};
  if (scenario) {
    props.scenario_id = scenario.id;
    props.difficulty = scenario.level;
  }
  if (event === "Arena Returned" && daysSinceLast !== undefined &&
      Number.isInteger(daysSinceLast) && daysSinceLast >= 1 && daysSinceLast <= 30) {
    props.days_since_last_arena_visit = daysSinceLast;
  }
  const send = () => {
    if (!hasConsent()) return; // Covers consent withdrawal while the script loads.
    const w = window as ArenaWindow;
    if (w.__tradehqAmplitudeStarted && typeof w.amplitude?.track === "function") {
      try { w.amplitude.track("TradeHQ " + event, props); } catch { /* A tracking failure never blocks practice. */ }
    }
  };
  const w = window as ArenaWindow;
  if (w.__tradehqAmplitudeStarted && typeof w.amplitude?.track === "function") send();
  else window.addEventListener(ARENA_READY_EVENT, send, { once: true });
}

/**
 * Visit measurement counts a consented revisit on a later UTC day as a return.
 * This is a same-browser proxy, not proof that a person learned or returned
 * voluntarily; users clearing storage or switching devices are unlinked.
 */
export function recordConsentedArenaVisit(date = new Date()): boolean {
  if (!hasConsent()) return false;
  // Do not record a "last visit" when the SDK is blocked or not initialized.
  // Otherwise a later working visit could be misclassified as a return despite
  // no earlier event ever reaching Amplitude.
  const w = window as ArenaWindow;
  if (!w.__tradehqAmplitudeStarted || typeof w.amplitude?.track !== "function") return false;
  const day = date.toISOString().slice(0, 10);
  trackArenaMilestone("Arena Viewed");
  try {
    const prior = window.localStorage.getItem(ARENA_VISIT_KEY);
    const days = utcDayGap(prior, day);
    if (days !== null && days >= 1 && days <= 30) trackArenaMilestone("Arena Returned", undefined, days);
    window.localStorage.setItem(ARENA_VISIT_KEY, day);
  } catch { /* Private-browsing storage restrictions cannot break the Arena. */ }
  return true;
}
