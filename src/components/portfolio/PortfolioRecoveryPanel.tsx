import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowDownToLine, FileJson, RotateCcw, ShieldAlert, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPortfolio, savePortfolio } from "@/lib/portfolio";
import {
  applyUnverifiedGuestRestore, browserCanPersistPortfolio, exportPracticeBackup,
  isGuestImportUnverified, parsePracticeBackup, readPreviousGuestPortfolio,
  restorePreviousProvenance, UNREADABLE_KEY
} from "@/lib/portfolioRecovery";
import type { Portfolio } from "@/lib/types";

const dollars = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
interface Candidate { filename: string; portfolio: Portfolio; date: string | null; }

export function PortfolioRecoveryPanel({ signedIn, authLoading = false }: { signedIn: boolean; authLoading?: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [warning, setWarning] = useState(false);
  const [unreadable] = useState(() => { try { return Boolean(localStorage.getItem(UNREADABLE_KEY)); } catch { return false; } });
  const [imported, setImported] = useState(isGuestImportUnverified);
  const [undoAvailable, setUndoAvailable] = useState(() => Boolean(readPreviousGuestPortfolio()));
  const [message, setMessage] = useState("");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setWarning(!browserCanPersistPortfolio());
    const onWarning = () => setWarning(true);
    const onRecovered = () => setMessage("An earlier browser recovery copy was restored. Download a separate backup to protect it.");
    window.addEventListener("tradehq:portfolio-storage-warning", onWarning);
    window.addEventListener("tradehq:portfolio-recovered", onRecovered);
    return () => {
      window.removeEventListener("tradehq:portfolio-storage-warning", onWarning);
      window.removeEventListener("tradehq:portfolio-recovered", onRecovered);
    };
  }, []);

  const saveTextFile = (raw: string, filename: string) => {
    const blob = new Blob([raw], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  };
  const download = () => {
    if (authLoading) return;
    try {
      saveTextFile(exportPracticeBackup(getPortfolio()), "tradehq-practice-backup.json");
      setMessage("Backup downloaded. Keep it outside this browser; it can include your private simulated trade journal.");
    } catch {
      setMessage("Could not download the practice backup. Check your browser download permissions.");
    }
  };
  const downloadOriginal = () => {
    try {
      const raw = localStorage.getItem(UNREADABLE_KEY);
      if (!raw) return;
      saveTextFile(raw,"tradehq-unreadable-original.json");
      setMessage("The preserved original has been downloaded. It was not automatically interpreted or overwritten.");
    } catch { setMessage("The old record could not be downloaded in this browser."); }
  };
  const selectBackup = async (file?: File) => {
    setCandidate(null);
    setMessage("");
    if (!file || signedIn || authLoading) return;
    if (file.size > 5_000_000) { setMessage("This file exceeds the 5 MB backup limit."); return; }
    if (!file.name.toLowerCase().endsWith(".json")) {
      setMessage("Choose a TradeHQ .json backup. Word documents and screenshots cannot restore simulated trades.");
      return;
    }
    try {
      const raw = await file.text();
      const portfolio = parsePracticeBackup(raw);
      const data = JSON.parse(raw);
      setCandidate({ filename: file.name, portfolio, date: typeof data.exportedAt === "string" ? data.exportedAt : null });
      setMessage("Valid TradeHQ backup format detected. The values are user-editable and UNVERIFIED; nothing has been imported yet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "This file cannot be restored as a TradeHQ practice portfolio.");
    }
  };
  const restore = () => {
    if (!candidate || signedIn || authLoading || busy) return;
    const previous = getPortfolio();
    if (!window.confirm(
      `Replace this browser's GUEST practice portfolio with ${candidate.filename}?\n\nCurrent: ${previous.trades.length} trades / ${dollars(previous.totalValue)}\nSelected: ${candidate.portfolio.trades.length} trades / ${dollars(candidate.portfolio.totalValue)}\n\nThis file is NOT verified trading evidence. The previous browser portfolio will be kept for one-step Undo. Download an independent copy as well.`
    )) return;
    setBusy(true);
    try {
      applyUnverifiedGuestRestore(candidate.portfolio,previous,(p) => savePortfolio(p, { silent: true }));
      setCandidate(null);
      setImported(true);
      setUndoAvailable(Boolean(readPreviousGuestPortfolio()));
      if (fileRef.current) fileRef.current.value = "";
      setMessage("Guest portfolio restored successfully in this browser. This is unverified practice data, excluded from verified rankings. Undo is available below.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Restore failed. The previous guest portfolio was preserved.");
    } finally { setBusy(false); }
  };
  const undo = () => {
    if (signedIn || authLoading || busy) return;
    const previous = readPreviousGuestPortfolio();
    if (!previous) { setUndoAvailable(false); return; }
    if (!window.confirm("Undo your last guest backup restore? This will replace the currently displayed guest portfolio.")) return;
    try {
      savePortfolio(previous, { silent: true });
      restorePreviousProvenance();
      setImported(isGuestImportUnverified());
      setUndoAvailable(false);
      setCandidate(null);
      setMessage("Your guest portfolio from before the last import has been restored.");
    } catch { setMessage("Could not undo the restore. Download a copy of the current data and try again."); }
  };

  return (
    <section aria-label="Backup and restore your virtual portfolio" className="rounded-2xl border border-border bg-card/50 p-4 sm:p-6 mb-8">
      <div className="flex items-start gap-3 mb-5">
        <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-1"/>
        <div>
          <h2 className="text-xl font-semibold">Backup & restore your portfolio</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Keep your practice work even when browser data disappears. Downloads are local JSON files, not brokerage records.
            Guest backups are editable and cannot prove genuine leaderboard activity.
          </p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-background/50 p-4 flex flex-col gap-3">
          <h3 className="font-semibold flex gap-2 items-center"><ArrowDownToLine className="h-4 w-4 text-primary"/> 1. Save a copy</h3>
          <p className="text-sm text-muted-foreground flex-1">Download your current local simulated cash, positions, trades and attached private journal. Store this file somewhere outside the browser, such as your device files.</p>
          <Button type="button" variant="outline" size="lg" className="w-full" disabled={authLoading} onClick={download}>
            <FileJson className="h-4 w-4 mr-2"/> Download .json backup
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-background/50 p-4 flex flex-col gap-3">
          <h3 className="font-semibold flex gap-2 items-center"><Upload className="h-4 w-4 text-primary"/> 2. Restore a copy</h3>
          <p className="text-sm text-muted-foreground flex-1">
            {authLoading ? "Verifying whether this is a guest or account portfolio." : signedIn
              ? "Signed-in portfolios come from server-recorded trades. Sign out to restore a separate guest backup; imports cannot replace account history."
              : "Choose a previously downloaded TradeHQ .json file. Inspect its values before replacing this browser's guest portfolio."}
          </p>
          <input ref={fileRef} id="portfolio-restore-file" type="file" accept=".json,application/json"
            onChange={e=>void selectBackup(e.currentTarget.files?.[0])}
            className="sr-only" disabled={authLoading || signedIn}/>
          <Button type="button" variant="outline" size="lg" className="w-full"
            disabled={authLoading || signedIn || busy} onClick={()=>fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2"/> Choose backup to restore
          </Button>
        </div>
      </div>
      {candidate && !signedIn && !authLoading && (
        <div className="mt-4 rounded-xl border border-primary/40 p-4 space-y-3">
          <h3 className="font-semibold">Preview backup before restoring</h3>
          <p className="text-sm text-muted-foreground break-all">{candidate.filename}{candidate.date ? ` · exported ${candidate.date}` : ""}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {[["Virtual cash",dollars(candidate.portfolio.cash)],["Portfolio total",dollars(candidate.portfolio.totalValue)],["Positions",String(candidate.portfolio.positions.length)],["Saved trades",String(candidate.portfolio.trades.length)]].map(([k,v])=><div key={k} className="bg-muted/40 rounded-lg p-3"><p className="text-xs text-muted-foreground">{k}</p><strong>{v}</strong></div>)}
          </div>
          <p className="text-xs text-amber-500 flex gap-2 items-start"><ShieldAlert className="h-4 w-4 shrink-0"/> File validation checks structure and arithmetic, NOT authenticity. Imported figures remain unverified and cannot create ranked server trades.</p>
          <Button type="button" disabled={busy} onClick={restore}>Confirm guest restore</Button>
          <Button type="button" variant="ghost" onClick={()=>{setCandidate(null); if(fileRef.current) fileRef.current.value="";}}>Cancel</Button>
        </div>
      )}
      {warning && <p role="alert" className="mt-4 text-sm text-amber-500"><AlertTriangle className="h-4 w-4 inline mr-2"/> Browser storage is unavailable; practice changes might not survive closing this page.</p>}
      {unreadable && <div role="alert" className="mt-4 text-sm rounded-xl border border-amber-500/30 p-3">
        An earlier local portfolio couldn't be interpreted, so its original bytes were preserved. <button type="button" className="text-primary underline" onClick={downloadOriginal}>Download the original for manual recovery.</button>
      </div>}
      {imported && <p className="mt-4 text-xs text-amber-500"><ShieldAlert className="h-4 w-4 inline mr-1"/> This guest portfolio contains unverified file-imported data. It is for private learning, not ranked proof.</p>}
      {undoAvailable && !signedIn && !authLoading && <Button type="button" variant="outline" onClick={undo} className="mt-4"><RotateCcw className="w-4 h-4 mr-2"/> Undo my last restore</Button>}
      {message && <p role="status" className="text-sm mt-4">{message}</p>}
      <p className="text-xs text-muted-foreground mt-4">A local recovery snapshot also exists when browser storage works. Clearing all site data removes that snapshot. Keep a downloaded file externally. Account trading and verified rankings use server records, never imported browser balances.</p>
    </section>
  );
}
