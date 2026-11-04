/**
 * Optional, adult-consented, first-party leaderboard signup attribution.
 *
 * Uses the existing adult-only Amplitude configuration. Two predefined event
 * NAMES are transmitted WITHOUT event properties, user IDs, emails, trading
 * statistics, form text or referral URL. Amplitude still receives its own
 * pseudonymous browser identity and normal network metadata, so this is
 * consented pseudonymous measurement, NOT anonymous collection.
 *
 * Only same-browser newly-created accounts are eligible. No backend writes,
 * third-party identity linking, fingerprinting or unconsented markers.
 */
export const LEADERBOARD_FUNNEL_CONSENT_KEY = "tradehq_consent_v3";
export const LEADERBOARD_FUNNEL_MARKER_KEY = "tradehq:leaderboard-signup-attribution:v1";
export const LEADERBOARD_FUNNEL_READY_EVENT = "tradehq:analytics-ready";
export const LEADERBOARD_FUNNEL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const LEADERBOARD_VISIT_EVENT = "TradeHQ Leaderboard Eligible Visit";
export const LEADERBOARD_REGISTRATION_EVENT = "TradeHQ Leaderboard New Account Confirmed";

type Amplitude = { track: (eventName: string) => unknown };
type AnalyticsWindow = Window & { amplitude?: Amplitude; __tradehqAmplitudeStarted?: boolean };

export function withinConsentedFunnelWindow(visitedAt: number, now: number): boolean {
  return Number.isSafeInteger(visitedAt) && Number.isSafeInteger(now)
    && visitedAt <= now && now - visitedAt <= LEADERBOARD_FUNNEL_WINDOW_MS;
}

export function isNewAccountFromLeaderboard(visitedAt: number, accountCreatedAt: string, now: number): boolean {
  const created = Date.parse(accountCreatedAt);
  return withinConsentedFunnelWindow(visitedAt, now)
    && Number.isFinite(created) && created >= visitedAt && created <= now + 60_000;
}

function context(): { storage: Storage; sdk: Amplitude } | null {
  if (typeof window === "undefined") return null;
  try {
    const w = window as AnalyticsWindow;
    if (w.localStorage.getItem(LEADERBOARD_FUNNEL_CONSENT_KEY) !== "accepted") return null;
    if (!w.__tradehqAmplitudeStarted || typeof w.amplitude?.track !== "function") return null;
    return { storage: w.localStorage, sdk: w.amplitude };
  } catch { return null; }
}

function marker(storage: Storage): number | null {
  try {
    const raw = storage.getItem(LEADERBOARD_FUNNEL_MARKER_KEY);
    if (!raw || raw.length > 90) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    return Object.keys(record).length === 1 && typeof record.visitedAt === "number" && Number.isSafeInteger(record.visitedAt)
      ? record.visitedAt : null;
  } catch { return null; }
}

/** Called only for a signed-OUT visitor after auth initialization completes. */
export function recordConsentedLeaderboardVisit(now = Date.now()): boolean {
  const ctx = context();
  if (!ctx || !Number.isSafeInteger(now)) return false;
  try {
    const prior = marker(ctx.storage);
    if (prior !== null && withinConsentedFunnelWindow(prior, now)) return false;
    // If storage is unavailable, do not emit an unpairable denominator event.
    ctx.storage.setItem(LEADERBOARD_FUNNEL_MARKER_KEY, JSON.stringify({ visitedAt: now }));
    try { ctx.sdk.track(LEADERBOARD_VISIT_EVENT); }
    catch { ctx.storage.removeItem(LEADERBOARD_FUNNEL_MARKER_KEY); return false; }
    return true;
  } catch { return false; }
}

/**
 * Called from the persistent AuthProvider after Supabase auth confirms a user.
 * An EXISTING account cannot qualify, even on a fresh login or OAuth return.
 * Account timestamps are checked locally and never included in analytics.
 */
export function recordConsentedLeaderboardRegistration(accountCreatedAt: string, now = Date.now()): boolean {
  const ctx = context();
  if (!ctx || typeof accountCreatedAt !== "string" || !Number.isSafeInteger(now)) return false;
  try {
    const visitedAt = marker(ctx.storage);
    if (visitedAt === null) return false;
    if (!isNewAccountFromLeaderboard(visitedAt, accountCreatedAt, now)) {
      ctx.storage.removeItem(LEADERBOARD_FUNNEL_MARKER_KEY);
      return false;
    }
    ctx.sdk.track(LEADERBOARD_REGISTRATION_EVENT);
    ctx.storage.removeItem(LEADERBOARD_FUNNEL_MARKER_KEY);
    return true;
  } catch { return false; }
}
