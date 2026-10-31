import { useRef, useState } from "react";
import { ArrowDownToLine, CloudDownload, FileCheck2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { restoreAccountPortfolioFromServer } from "@/lib/cloudPortfolio";

export function VerifiedAccountRecovery({ userId }: { userId: string }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"restore"|"export"|"verify"|null>(null);
  const [message, setMessage] = useState("");

  const exportVerified = async () => {
    if (busy) return;
    setBusy("export");
    setMessage("");
    try {
      const { data, error } = await supabase.rpc("export_my_verified_practice_history");
      if (error || !data) throw new Error(error?.message || "No server-recorded practice history was available.");
      const parsed = data as Record<string, unknown>;
      if (parsed.key_id !== "v1" || !parsed.signature || !parsed.payload)
        throw new Error("The server did not return a verified export.");
      const file = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
      const url = URL.createObjectURL(file);
      const a=document.createElement("a");
      a.href=url; a.download="tradehq-verified-account-practice.json";
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),1200);
      setMessage("Signed historical export downloaded. It contains your current-cycle server-recorded practice data; it is NOT a file that can overwrite ranked account history.");
    } catch(e) {
      setMessage(e instanceof Error?e.message:"Could not export signed account history.");
    } finally {setBusy(null);}
  };

  const restoreCloud = async () => {
    if (busy) return;
    if (!window.confirm("Replace the browser's displayed account portfolio with your existing server-recorded snapshot? This does not modify server trades or rankings.")) return;
    setBusy("restore");setMessage("");
    try {
      const p=await restoreAccountPortfolioFromServer(userId);
      setMessage(`Recovered your current server snapshot: ${p.trades.length} recorded orders, ${p.positions.length} open positions. Server trading history was not changed.`);
    } catch(e) {
      setMessage(e instanceof Error?e.message:"The account snapshot could not be recovered.");
    } finally {setBusy(null);}
  };

  const verifyFile = async (file?: File) => {
    if (!file || busy) return;
    if (file.size>2_100_000 || !file.name.endsWith(".json")) {
      setMessage("Choose a signed TradeHQ account-history JSON export under 2.1 MB.");
      return;
    }
    setBusy("verify");setMessage("");
    try {
      const document=JSON.parse(await file.text());
      const {data,error}=await supabase.rpc("verify_my_practice_history_export",{p_document:document});
      if(error) throw error;
      const result = data as Record<string,unknown>|null;
      setMessage(result?.verified === true
        ? "Signature valid: this historical file was issued by TradeHQ's server for your signed-in account and hasn't been changed. Verification does not import trades."
        : "Signature NOT verified. The file may have changed, belong to another account or use an unsupported format. No portfolio data was imported.");
    } catch {
      setMessage("Could not verify this file. Check the account and file format. No data was imported.");
    } finally {setBusy(null);if(fileInput.current)fileInput.current.value="";}
  };

  return (
    <div className="mt-4 space-y-4" aria-label="Authenticated cloud portfolio recovery">
      <p className="text-sm text-muted-foreground">
        Your account's practice trades live on TradeHQ's server. You can safely refresh the browser from those verified records,
        download an uneditable-without-detection historical export, or verify a signed export for this account.
        Uploaded files are NEVER applied to your ranked trading record.
      </p>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border p-4 flex flex-col gap-3">
          <h3 className="font-semibold flex gap-2 items-center"><CloudDownload className="w-4 h-4 text-primary"/> Restore from server</h3>
          <p className="text-xs text-muted-foreground flex-1">Reload your existing server-recorded portfolio after a browser reset. Does not import an editable file.</p>
          <Button size="lg" variant="outline" disabled={busy!==null} onClick={()=>void restoreCloud()}>Recover account portfolio</Button>
        </div>
        <div className="rounded-xl border border-border p-4 flex flex-col gap-3">
          <h3 className="font-semibold flex gap-2 items-center"><ArrowDownToLine className="w-4 h-4 text-primary"/> Signed historical export</h3>
          <p className="text-xs text-muted-foreground flex-1">Download a server-issued signed record of current-cycle simulated transactions and prices. Keep it privately.</p>
          <Button size="lg" variant="outline" disabled={busy!==null} onClick={()=>void exportVerified()}>Download signed export</Button>
        </div>
        <div className="rounded-xl border border-border p-4 flex flex-col gap-3">
          <h3 className="font-semibold flex gap-2 items-center"><FileCheck2 className="w-4 h-4 text-primary"/> Verify export integrity</h3>
          <p className="text-xs text-muted-foreground flex-1">Check a signed historical file against TradeHQ's server. This NEVER restores or changes server account data.</p>
          <input ref={fileInput} type="file" accept=".json,application/json" aria-label="Choose signed TradeHQ history JSON to verify"
            onChange={e=>void verifyFile(e.currentTarget.files?.[0])} className="sr-only" />
          <Button size="lg" variant="outline" disabled={busy!==null} onClick={()=>fileInput.current?.click()}>Choose signed file</Button>
        </div>
      </div>
      <p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="w-4 h-4 shrink-0 text-primary"/>
        Signed exports are tamper-evident historical records, not investment-performance certifications. New quotes and later trades can change your current practice portfolio.
      </p>
      {message && <p role="status" className="text-sm rounded-lg bg-muted/40 p-3">{message}</p>}
    </div>
  );
}
