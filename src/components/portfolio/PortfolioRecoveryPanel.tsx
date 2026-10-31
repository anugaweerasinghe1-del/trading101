import { useEffect, useState } from "react";
import { Download, Upload, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPortfolio, savePortfolio } from "@/lib/portfolio";
import { browserCanPersistPortfolio, exportPracticeBackup, parsePracticeBackup } from "@/lib/portfolioRecovery";
import type { Portfolio } from "@/lib/types";

export function PortfolioRecoveryPanel({ signedIn, authLoading = false }: { signedIn: boolean; authLoading?: boolean }) {
  const [warning, setWarning] = useState(false);
  const [message, setMessage] = useState("");
  const [candidate, setCandidate] = useState<{ name: string; portfolio: Portfolio } | null>(null);

  useEffect(() => {
    setWarning(!browserCanPersistPortfolio());
    const onWarning = () => setWarning(true);
    const onRecovered = () => setMessage("A saved browser recovery snapshot was restored. Download a backup to keep a separate copy.");
    window.addEventListener("tradehq:portfolio-storage-warning", onWarning);
    window.addEventListener("tradehq:portfolio-recovered", onRecovered);
    return () => {
      window.removeEventListener("tradehq:portfolio-storage-warning", onWarning);
      window.removeEventListener("tradehq:portfolio-recovered", onRecovered);
    };
  }, []);

  const download = () => {
    try {
      const blob = new Blob([exportPracticeBackup(getPortfolio())], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "tradehq-practice-backup.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Backup downloaded. Keep the JSON file somewhere safe; it contains your simulated trade history and any journal notes.");
    } catch {
      setMessage("Could not create a backup in this browser. Check your browser permissions.");
    }
  };

  const chooseFile = async (file?: File) => {
    setCandidate(null);
    if (!file) return;
    if (file.size > 5_000_000) { setMessage("The backup exceeds the 5 MB limit."); return; }
    try {
      const data = parsePracticeBackup(await file.text());
      setCandidate({ name: file.name, portfolio: data });
      setMessage("Review the selected backup before restoring it. No existing data has changed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invalid backup file.");
    }
  };

  const restore = () => {
    if (!candidate || signedIn || authLoading) return;
    if (!window.confirm("Replace this browser's CURRENT guest portfolio with the selected backup? Download the current portfolio first if you want to keep it.")) return;
    savePortfolio(candidate.portfolio);
    setCandidate(null);
    setMessage("Guest portfolio restored in this browser. The portfolio display now uses the recovered cash, positions and trade history.");
  };

  return (
    <section aria-label="Practice portfolio backups" className="rounded-2xl border border-border bg-card/40 p-4 sm:p-5 mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-base"><ShieldCheck className="w-4 h-4 text-primary" /> Keep your practice portfolio safe</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            TradeHQ saves guest trades in this browser and keeps a local recovery copy. Download a backup so you can restore after clearing site data or changing devices.
            {signedIn ? " Your signed-in account portfolio is restored from server records; backup imports never overwrite it." : " No account is required."}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={download} className="shrink-0"><Download className="w-4 h-4 mr-2" /> Download backup</Button>
      </div>
      {warning && <p role="alert" className="mt-3 text-sm text-amber-500 flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> Browser storage isn't available. Your practice activity might not survive a reload. Download a backup before leaving.</p>}
      {!signedIn && !authLoading && <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <label htmlFor="portfolio-restore-file" className="text-sm font-medium flex items-center gap-2"><Upload className="w-4 h-4" /> Restore a guest backup</label>
        <input id="portfolio-restore-file" type="file" accept=".json,application/json"
          className="text-sm max-w-full file:mr-3 file:rounded-lg file:border file:border-border file:bg-muted file:px-3 file:py-2 file:text-foreground"
          onChange={(event) => void chooseFile(event.target.files?.[0])} />
        {candidate && <Button type="button" variant="secondary" onClick={restore}>Restore {candidate.portfolio.trades.length} saved trades</Button>}
      </div>}
      {message && <p role="status" className="mt-3 text-xs text-muted-foreground">{message}</p>}
      <p className="mt-3 text-xs text-muted-foreground">Privacy: backup files stay on your device unless you choose to share them. Clearing all site data also removes browser-local recovery copies. Account portfolios and guest portfolios are separate.</p>
    </section>
  );
}
