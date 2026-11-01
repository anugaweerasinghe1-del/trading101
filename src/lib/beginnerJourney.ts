import type { Trade } from "./types";

export const JOURNEY_KEY = "tradehq:beginner-journey:v1";
export const JOURNEY_EVENT = "tradehq:journey-updated";
export interface BeginnerJourneyProgress {
  version: 1;
  lessonCompleted: boolean;
  tradeId: string | null;
  portfolioExplained: boolean;
  reflection: string;
  completedAt: string | null;
  updatedAt: string;
}
const defaults = (): BeginnerJourneyProgress => ({
  version: 1, lessonCompleted: false, tradeId: null, portfolioExplained: false,
  reflection: "", completedAt: null, updatedAt: new Date().toISOString(),
});
/** Parse independently sourced account records with the same limits as local data. */
export function parseJourneyProgress(raw: unknown): BeginnerJourneyProgress {
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!data || data.version !== 1 || typeof data.lessonCompleted !== "boolean") return defaults();
    return {
      version: 1, lessonCompleted: data.lessonCompleted,
      tradeId: typeof data.tradeId === "string" && data.tradeId.length < 120 ? data.tradeId : null,
      portfolioExplained: data.portfolioExplained === true,
      reflection: typeof data.reflection === "string" ? data.reflection.slice(0, 1200) : "",
      completedAt: typeof data.completedAt === "string" && Number.isFinite(Date.parse(data.completedAt)) ? data.completedAt : null,
      updatedAt: typeof data.updatedAt === "string" && Number.isFinite(Date.parse(data.updatedAt)) ? data.updatedAt : new Date(0).toISOString(),
    };
  } catch { return defaults(); }
}

export function readJourney(): BeginnerJourneyProgress {
  try { return parseJourneyProgress(localStorage.getItem(JOURNEY_KEY)); }
  catch { return defaults(); }
}

/** Restore a validated remote snapshot without inventing a new completion time. */
export function replaceJourneySnapshot(data: BeginnerJourneyProgress) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(JOURNEY_KEY, JSON.stringify(parseJourneyProgress(data)));
    window.dispatchEvent(new Event(JOURNEY_EVENT));
  } catch { /* Browsers with blocked storage remain guest-only. */ }
}

export function saveJourney(patch: Partial<BeginnerJourneyProgress>) {
  const next = { ...readJourney(), ...patch, version: 1 as const, updatedAt: new Date().toISOString() };
  try { localStorage.setItem(JOURNEY_KEY, JSON.stringify(next)); }
  catch { /* Browser storage could be disabled; don't misrepresent durability. */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(JOURNEY_EVENT));
  return next;
}
export function markJourneyTrade(trade: Trade) {
  const progress = readJourney();
  // Do not mark progress for a simulated click or a failed order.
  if (!progress.lessonCompleted || progress.tradeId || !trade?.id) return;
  saveJourney({ tradeId: trade.id });
}
export function journeyStage(progress: BeginnerJourneyProgress): number {
  if (!progress.lessonCompleted) return 0;
  if (!progress.tradeId) return 1;
  if (!progress.portfolioExplained) return 2;
  if (progress.reflection.trim().length < 15) return 3;
  return 4;
}
