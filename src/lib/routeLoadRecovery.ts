/** A failed import can be caused by a replaced deployment, offline connection
 * or blocked request. Never retry arbitrary render/business errors. */
export const ROUTE_RECOVERY_PREFIX = "tradehq:route-load-recovery:v1:";
export function isRouteModuleLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === "ChunkLoadError" ||
    /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|failed to load module script|loading chunk [\w-]+ failed|unable to preload css/i.test(error.message);
}

// Automatic reload only on read-only public destinations. Quizzes, forms,
// order entry, account, certificate and owner/admin flows need user choice.
const READ_ONLY = new Set(["/about", "/privacy", "/terms", "/roadmap", "/whats-new", "/wiki", "/learn-trading-guide", "/courses", "/compare", "/strategy", "/how-to-trade"]);
export function claimRouteReload(error: unknown, location: { pathname: string; search: string }, online: boolean, storage: Pick<Storage, "getItem" | "setItem">): boolean {
  if (!online || !isRouteModuleLoadError(error) || location.search) return false;
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const readOnly = READ_ONLY.has(path) || /^\/(?:wiki|compare|strategy|how-to-trade|learn\/article)\/[a-z0-9-]+$/.test(path);
  if (!readOnly) return false;
  try {
    const key = ROUTE_RECOVERY_PREFIX + path;
    if (storage.getItem(key) !== null) return false;
    storage.setItem(key, "1");
    // Storage may be disabled or discard writes. Never risk a reload loop.
    return storage.getItem(key) === "1";
  } catch {
    return false;
  }
}
