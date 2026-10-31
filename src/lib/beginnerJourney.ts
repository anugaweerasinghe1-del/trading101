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
export function readJourney(): BeginnerJourneyProgress {
  try {
    const stored = localStorage.getItem(JOURNEY_KEY);
    if (!stored) return defaults();
    const data = JSON.parse(stored);
    if (data?.version !== 1 || typeof data.lessonCompleted !== "boolean") return defaults();
    return {
      version: 1, lessonCompleted: data.lessonCompleted,
      tradeId: typeof data.tradeId === "string" && data.tradeId.length < 120 ? data.tradeId : null,
      portfolioExplained: data.portfolioExplained === true,
      reflection: typeof data.reflection === "string" ? data.reflection.slice(0, 1200) : "",
      completedAt: typeof data.completedAt === "string" ? data.completedAt : null,
      updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
    };
  } catch { return defaults(); }
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
