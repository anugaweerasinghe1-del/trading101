import type { Portfolio, Trade } from "./types";

/**
 * Browser backup is a convenience copy, not a cloud backup. It disappears when
 * a visitor clears all site data; downloading the file protects against that.
 */
export const RECOVERY_KEY = "tradehq:portfolio-recovery:v1";
export const BACKUP_FORMAT = "tradehq-practice-portfolio";
export interface PracticeBackup {
  format: typeof BACKUP_FORMAT;
  version: 1;
  exportedAt: string;
  portfolio: Portfolio;
}
const finite = (n: unknown) => typeof n === "number" && Number.isFinite(n);
const validAmount = (n: unknown) => finite(n) && (n as number) >= 0 && (n as number) < 1e13;

export function parsePracticePortfolio(input: unknown): Portfolio | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  if (!validAmount(raw.cash) || !validAmount(raw.totalValue) || !Array.isArray(raw.positions) || !Array.isArray(raw.trades)) return null;
  if (raw.positions.length > 1000 || raw.trades.length > 20000) return null;
  const positions = [];
  for (const value of raw.positions) {
    if (!value || typeof value !== "object") return null;
    const p = value as Record<string, any>;
    const a = p.asset;
    if (!a || typeof a.id !== "string" || a.id.length > 80 || typeof a.symbol !== "string" ||
        !validAmount(a.price) || !validAmount(p.quantity) || !validAmount(p.avgPrice) ||
        !finite(p.currentValue) || !finite(p.profitLoss) || !finite(p.profitLossPercent)) return null;
    positions.push(value as Portfolio["positions"][number]);
  }
  const trades: Trade[] = [];
  for (const value of raw.trades) {
    if (!value || typeof value !== "object") return null;
    const t = value as Record<string, any>;
    const timestamp = new Date(t.timestamp);
    if (typeof t.id !== "string" || t.id.length > 100 || typeof t.assetId !== "string" ||
        typeof t.symbol !== "string" || t.symbol.length > 40 ||
        !["buy", "sell"].includes(t.type) || !validAmount(t.quantity) ||
        !validAmount(t.price) || !finite(t.total) || !Number.isFinite(timestamp.getTime())) return null;
    trades.push({ ...t, timestamp } as Trade);
  }
  return { cash: raw.cash as number, totalValue: raw.totalValue as number, positions, trades };
}

export function readRecoveryPortfolio(): Portfolio | null {
  try {
    const value = localStorage.getItem(RECOVERY_KEY);
    if (!value) return null;
    const envelope = JSON.parse(value);
    return envelope?.format === BACKUP_FORMAT && envelope.version === 1
      ? parsePracticePortfolio(envelope.portfolio) : null;
  } catch { return null; }
}

export function writeRecoveryPortfolio(portfolio: Portfolio): boolean {
  try {
    localStorage.setItem(RECOVERY_KEY, JSON.stringify({
      format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(), portfolio,
    }));
    return true;
  } catch { return false; }
}

export function exportPracticeBackup(portfolio: Portfolio): string {
  return JSON.stringify({
    format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(), portfolio,
  } satisfies PracticeBackup, null, 2);
}

export function parsePracticeBackup(text: string): Portfolio {
  if (text.length > 5_000_000) throw new Error("This backup is larger than 5 MB.");
  let candidate: any;
  try { candidate = JSON.parse(text); } catch { throw new Error("This is not a valid JSON backup."); }
  if (candidate?.format !== BACKUP_FORMAT || candidate?.version !== 1)
    throw new Error("This is not a TradeHQ practice portfolio backup.");
  const portfolio = parsePracticePortfolio(candidate.portfolio);
  if (!portfolio) throw new Error("The backup is missing valid portfolio information.");
  return portfolio;
}

export function browserCanPersistPortfolio(): boolean {
  try {
    const key = "tradehq:storage-probe";
    localStorage.setItem(key, "ok");
    localStorage.removeItem(key);
    return true;
  } catch { return false; }
}
