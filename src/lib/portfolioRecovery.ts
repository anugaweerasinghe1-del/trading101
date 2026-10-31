import type { Portfolio, Trade } from "./types";

/**
 * Browser backup is a convenience copy, not a cloud backup. It disappears when
 * a visitor clears all site data; downloading the file protects against that.
 */
export const RECOVERY_KEY = "tradehq:portfolio-recovery:v1";
export const UNREADABLE_KEY = "tradehq:portfolio-unreadable-original:v1";
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
  validateImportedPracticePortfolio(portfolio);
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

/** These records describe UNVERIFIED guest imports, never ranked performance. */
export const GUEST_IMPORT_MARKER = "tradehq:guest-import-origin:v1";
export const RESTORE_UNDO_KEY = "tradehq:guest-restore-undo:v1";

export function validateImportedPracticePortfolio(portfolio: Portfolio): void {
  // Additional checks are import-only: older browser portfolios retain the
  // legacy parser to avoid erasing existing users' saved data.
  const seen = new Set<string>();
  for (const trade of portfolio.trades) {
    if (!trade.id.trim() || seen.has(trade.id)) throw new Error("Backup has duplicate or missing trade IDs.");
    seen.add(trade.id);
    if (!Number.isFinite(trade.quantity) || trade.quantity <= 0 ||
        !Number.isFinite(trade.price) || trade.price <= 0 ||
        !Number.isFinite(trade.total) || trade.total <= 0 ||
        !trade.assetId.trim() || !trade.symbol.trim())
      throw new Error("Backup contains an invalid simulated trade.");
    if (trade.journal) {
      if (typeof trade.journal.notes !== "string" || typeof trade.journal.reasoning !== "string" ||
          !Array.isArray(trade.journal.emotions) || trade.journal.emotions.some(e=>typeof e!=="string"))
        throw new Error("Backup includes a malformed private trading journal.");
    }
  }
  const assets = new Set<string>();
  for (const pos of portfolio.positions) {
    if (!pos.asset.id.trim() || assets.has(pos.asset.id) ||
        !Number.isFinite(pos.quantity) || pos.quantity <= 0 ||
        !Number.isFinite(pos.avgPrice) || pos.avgPrice <= 0 ||
        !Number.isFinite(pos.asset.price) || pos.asset.price <= 0)
      throw new Error("Backup contains duplicate or invalid holdings.");
    assets.add(pos.asset.id);
  }
  // Distinguish genuine arithmetic errors from minor currency rounding.
  const total = portfolio.cash + portfolio.positions.reduce((sum,pos)=>sum+pos.currentValue,0);
  const allowedRounding = Math.max(2,Math.abs(total)*0.0001);
  if (Math.abs(total-portfolio.totalValue) > allowedRounding)
    throw new Error("Portfolio value does not match cash plus the saved holdings.");
}

export function savePreRestoreCopy(current: Portfolio): void {
  // MUST succeed before any import can replace current local portfolio.
  const raw = localStorage.getItem(GUEST_IMPORT_MARKER);
  localStorage.setItem(RESTORE_UNDO_KEY, JSON.stringify({
    format: BACKUP_FORMAT, version: 1, portfolio: current, provenance: raw,
    savedAt: new Date().toISOString()
  }));
  if (!readPreviousGuestPortfolio()) throw new Error("Could not preserve your previous portfolio. No import was performed.");
}

export function readPreviousGuestPortfolio(): Portfolio | null {
  try {
    const raw = localStorage.getItem(RESTORE_UNDO_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data.format===BACKUP_FORMAT && data.version===1 ? parsePracticePortfolio(data.portfolio) : null;
  } catch { return null; }
}

export function markGuestImport(): void {
  localStorage.setItem(GUEST_IMPORT_MARKER, JSON.stringify({
    source:"unverified-user-supplied-file", importedAt:new Date().toISOString()
  }));
}

export function restorePreviousProvenance(): void {
  try {
    const data=JSON.parse(localStorage.getItem(RESTORE_UNDO_KEY) ?? "null");
    const previous=data?.provenance;
    if(typeof previous==="string") localStorage.setItem(GUEST_IMPORT_MARKER,previous);
    else localStorage.removeItem(GUEST_IMPORT_MARKER);
    localStorage.removeItem(RESTORE_UNDO_KEY);
  } catch {}
}

export function isGuestImportUnverified(): boolean {
  try { return JSON.parse(localStorage.getItem(GUEST_IMPORT_MARKER) || "null")?.source === "unverified-user-supplied-file"; }
  catch { return false; }
}

/** Unverified guest imports are intentionally never a proof of ranked activity. */
export function applyUnverifiedGuestRestore(
  imported: Portfolio, current: Portfolio, saveLocal: (p: Portfolio) => void
): void {
  validateImportedPracticePortfolio(imported);
  if (!browserCanPersistPortfolio()) throw new Error("Browser storage is unavailable. Nothing was restored.");
  savePreRestoreCopy(current);
  try {
    // Mark the guest data as imported *before* applying it so a delayed
    // account initialisation cannot mistake a hand-edited JSON for proof.
    markGuestImport();
    saveLocal(imported);
    const persisted = parsePracticePortfolio(JSON.parse(localStorage.getItem("tradehq_portfolio") ?? "null"));
    if (!persisted || JSON.stringify(persisted) !== JSON.stringify(imported))
      throw new Error("The browser could not verify the saved portfolio. Restore was cancelled.");
  } catch (error) {
    // If rollback cannot be confirmed, retain the one-step undo record.
    try {
      saveLocal(current);
      const rolledBack=parsePracticePortfolio(JSON.parse(localStorage.getItem("tradehq_portfolio") ?? "null"));
      if (rolledBack && JSON.stringify(rolledBack)===JSON.stringify(current)) restorePreviousProvenance();
    } catch {}
    throw error;
  }
}
