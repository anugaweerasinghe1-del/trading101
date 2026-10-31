import { useEffect, useState } from "react";
import { Download, Upload, ShieldCheck, AlertTriangle, FileJson, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPortfolio, savePortfolio } from "@/lib/portfolio";
import { browserCanPersistPortfolio, exportPracticeBackup, parsePracticeBackup, UNREADABLE_KEY } from "@/lib/portfolioRecovery";
import type { Portfolio } from "@/lib/types";

interface Candidate { name: string; portfolio: Portfolio; exportedAt: string }
function usd(value: number): string { return value.toLocaleString("en-US",{style:"currency",currency:"USD"}); }
function downloadText(contents: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function PortfolioRecoveryPanel({ signedIn, authLoading = false }: { signedIn: boolean; authLoading?: boolean }) {
  const [warning, setWarning] = useState(false);
  const [unreadable, setUnreadable] = useState(() => {
    try { return Boolean(localStorage.getItem(UNREADABLE_KEY)); } catch { return false; }
  });
  const [message, setMessage] = useState("");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [preservedCurrent, setPreservedCurrent] = useState(false);
  const [backupSaved, setBackupSaved] = useState(false);

  useEffect(() => {
    setWarning(!browserCanPersistPortfolio());
    const onWarning = () => setWarning(true);
    const onRecovered = () => setMessage("A saved browser recovery snapshot was restored. Download a separate backup to protect it.");
    window.addEventListener("tradehq:portfolio-storage-warning", onWarning);
    window.addEventListener("tradehq:portfolio-recovered", onRecovered);
    return () => {
      window.removeEventListener("tradehq:portfolio-storage-warning", onWarning);
      window.removeEventListener("tradehq:portfolio-recovered", onRecovered);
    };
  }, []);

  const download = () => {
    try {
      downloadText(exportPracticeBackup(getPortfolio()), "tradehq-practice-backup.json");
      setPreservedCurrent(true);
      setBackupSaved(true);
      setMessage("Backup download requested. Check your device's Downloads before relying on this copy. JSON includes private trade notes.");
    } catch { setMessage("Backup could not be created. Check browser permissions and available storage."); }
  };

  const downloadOriginal = () => {
    try {
      const raw = localStorage.getItem(UNREADABLE_KEY);
      if (!raw) return;
      downloadText(raw, "tradehq-original-unreadable-portfolio.json");
      setMessage("Original unreadable bytes downloaded for possible manual recovery, not verified as genuine practice activity.");
    } catch { setMessage("Unable to download the original data."); }
  };

  const chooseFile = async (file?: File) => {
    setCandidate(null);
    setPreservedCurrent(false);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json") || file.size > 5_000_000) {
      setMessage("Only TradeHQ JSON backups up to 5 MB can be selected.");
      return;
    }
    try {
      const raw = await file.text();
      const portfolio = parsePracticeBackup(raw);
      const envelope = JSON.parse(raw);
      setCandidate({ name: file.name, portfolio, exportedAt: envelope.exportedAt });
      setMessage("Backup format and fields validated. Authenticity cannot be proven from a browser file; imported activity stays unverified.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unsupported backup."); }
  };

  const restore = () => {
    if (!candidate || signedIn || authLoading || !preservedCurrent) return;
    if (!window.confirm("Replace the current GUEST portfolio with this UNVERIFIED local backup? This will not create ranked trading history. Continue only if you've saved your current portfolio elsewhere.")) return;
    try {
      savePortfolio(candidate.portfolio);
      setCandidate(null);
      setFileKey(k => k + 1);
      setPreservedCurrent(false);
      setBackupSaved(false);
      setMessage("Guest practice data restored locally. The page is refreshing to show the restored positions and trades.");
      window.location.reload();
    } catch { setMessage("Restore failed. Your current portfolio might not have been saved; check browser storage settings."); }
  };

  const current = getPortfolio();
  return (
    <section id="backup-restore" aria-labelledby="portfolio-recovery-title" className="rounded-2xl border border-primary/20 bg-card/60 p-5 sm:p-7 mb-7 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h2 id="portfolio-recovery-title" className="font-semibold text-xl">Backup & Restore</h2>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Don't lose your practice work when you change devices or clear browser data.
        Save a <strong>JSON backup</strong> on your device. A file can restore a guest portfolio, but cannot prove that its simulated trades really happened.
        {signedIn ? " Signed-in portfolios are restored from verified server records and cannot be overwritten with imported files." : " A free account isn't required."}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold"><Download className="w-4 h-4" /> 1. Save your portfolio</div>
          <p className="text-xs text-muted-foreground">Save a copy of your current browser activity: {current.trades.length} trades, {current.positions.length} holdings. Includes private journal entries, if any.</p>
          <Button type="button" onClick={download} variant="outline" className="w-full min-h-11">Download TradeHQ JSON backup</Button>
          {backupSaved && <p className="text-xs text-primary flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Download initiated — confirm the file is saved.</p>}
        </div>
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold"><Upload className="w-4 h-4" /> 2. Restore a guest portfolio</div>
          {signedIn || authLoading ? (
            <p className="text-sm text-muted-foreground">Guest restore is disabled for signed-in accounts. Your cloud portfolio will not be replaced by uploaded JSON.</p>
          ) : <>
            <label htmlFor="portfolio-restore-file" className="block text-xs text-muted-foreground">Choose a downloaded <code>tradehq-practice-backup.json</code> file</label>
            <input key={fileKey} id="portfolio-restore-file" type="file" accept=".json,application/json"
              className="block w-full min-w-0 text-sm file:mr-2 file:rounded-lg file:border file:border-border file:bg-muted file:px-3 file:py-2 file:text-foreground"
              onChange={e => void chooseFile(e.target.files?.[0])} />
            {!candidate && <p className="text-xs text-muted-foreground">Only TradeHQ-format JSON backups are accepted. DOCX, PDFs and arbitrary files are rejected.</p>}
          </>}
        </div>
      </div>
      {candidate && !signedIn && !authLoading && <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-4 space-y-3" aria-label="Backup preview">
        <h3 className="font-semibold flex items-center gap-2"><FileJson className="h-4 w-4" /> Preview before restore</h3>
        <p className="text-xs text-muted-foreground break-all">{candidate.name} · Exported {new Date(candidate.exportedAt).toLocaleString()}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ["Saved cash", usd(candidate.portfolio.cash)],
            ["Saved portfolio value", usd(candidate.portfolio.totalValue)],
            ["Holdings", String(candidate.portfolio.positions.length)],
            ["Transactions", String(candidate.portfolio.trades.length)]
          ].map(([label,value]) => <div key={label} className="p-3 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold tabular-nums">{value}</p>
          </div>)}
        </div>
        <p className="text-xs text-amber-500">Unverified browser file: values can be edited. Imported trades never establish ranked or verified performance.</p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button type="button" variant="outline" onClick={download}>First download my current portfolio</Button>
          <Button type="button" disabled={!preservedCurrent} onClick={restore} className="min-h-11">
            Restore this guest backup
          </Button>
        </div>
        {!preservedCurrent && <p className="text-xs text-muted-foreground">Download your existing portfolio before enabling the replace action.</p>}
      </div>}
      {unreadable && <div role="alert" className="rounded-lg border border-amber-500/30 p-3 text-sm">
        An older portfolio record could not be read and has been quarantined in this browser.
        <button type="button" className="ml-2 underline text-primary" onClick={downloadOriginal}>Download original bytes</button>
      </div>}
      {warning && <p role="alert" className="text-sm text-amber-500 flex items-start gap-2">
        <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0" /> Browser storage is unavailable. Your trades may not survive leaving this page.
      </p>}
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
      <p className="text-xs text-muted-foreground">This is local recovery, not an authenticated trade receipt. Clearing all site data removes local recovery snapshots. Keep backup files private; they may contain journal notes. Rankings only use server-recorded eligible trading activity.</p>
    </section>
  );
}
