/**
 * Tracks the user's last-visited route and last-viewed asset
 * so the homepage can offer a "Continue where you left off" hook.
 * Pure client-side, no login required.
 */
const ROUTE_KEY = "tradehq_last_route";
const ASSET_KEY = "tradehq_last_asset";
const VISIT_KEY = "tradehq_last_visit_at";
const PREVIOUS_VISIT_KEY = "tradehq_previous_visit_at";
let recordedThisSession = false;

export function recordVisit(pathname: string) {
  try {
    // Home is a landing page, not a replacement for the last meaningful destination.
    if (pathname !== "/") localStorage.setItem(ROUTE_KEY, pathname);
    const previous = localStorage.getItem(VISIT_KEY);
    if (!recordedThisSession) {
      if (previous) localStorage.setItem(PREVIOUS_VISIT_KEY, previous);
      else localStorage.removeItem(PREVIOUS_VISIT_KEY);
      recordedThisSession = true;
    }
    localStorage.setItem(VISIT_KEY, new Date().toISOString());
    const m = pathname.match(/^\/trade\/([a-z0-9-]+)/i);
    if (m) localStorage.setItem(ASSET_KEY, m[1].toLowerCase());
  } catch {}
}

export function getLastVisit(): {
  route: string | null;
  asset: string | null;
  daysAgo: number | null;
} {
  try {
    const route = localStorage.getItem(ROUTE_KEY);
    const asset = localStorage.getItem(ASSET_KEY);
    const at = localStorage.getItem(PREVIOUS_VISIT_KEY) ?? localStorage.getItem(VISIT_KEY);
    let daysAgo: number | null = null;
    if (at) {
      const diff = Date.now() - new Date(at).getTime();
      daysAgo = Math.floor(diff / (1000 * 60 * 60 * 24));
    }
    return { route, asset, daysAgo };
  } catch {
    return { route: null, asset: null, daysAgo: null };
  }
}

export function isReturningUser(): boolean {
  const { daysAgo } = getLastVisit();
  return daysAgo !== null && daysAgo >= 1;
}
