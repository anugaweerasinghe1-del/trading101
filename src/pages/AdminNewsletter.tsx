import { useCallback, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { newsletterAdminError } from "@/lib/newsletterAdminError";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, RefreshCw, Sparkles, Lock, Mail } from "lucide-react";

type Edition = {
  id: string; week_of: string; status: "generating" | "draft" | "approved" | "failed";
  revision: number; subject: string; preheader: string; body_markdown: string;
  reviewed_by: string | null; reviewed_at: string | null; updated_at: string;
  ai_model: string | null; generator_error: string | null;
};
type AudienceSummary = {
  legacyRecordsTotal: number; confirmedSubscribers: number;
  unsubscribesTracked: boolean;
  records: { email: string; subscribed_at: string; source: string | null }[];
  notice: string;
};
const border = "rounded-2xl border border-border bg-card/70 p-5";
export default function AdminNewsletter() {
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [audience, setAudience] = useState<AudienceSummary | null>(null);
  const [current, setCurrent] = useState<Edition | null>(null);
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [body, setBody] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [reviewer, setReviewer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const { data, error: invokeError } = await supabase.functions.invoke("newsletter-editor", {
      body: { action, ...payload },
      headers: { "x-admin-key": key },
    });
    if (invokeError || data?.error) {
      // Supabase returns a FunctionsHttpError on 4xx/5xx; data is null on that
      // path. The old UI misreported rejected master keys as missing backend.
      const context = (invokeError as { context?: { status?: number } } | null)?.context;
      throw Error(newsletterAdminError(context?.status, typeof data?.error === "string" ? data.error : null));
    }
    return data.data;
  }, [key]);

  const loadAudience = useCallback(async () => {
    const { data, error: apiError } = await supabase.functions.invoke("newsletter-audience-admin", {
      body: { action: "summary" },
      headers: { "x-admin-key": key },
    });
    if (apiError || data?.error || !data?.data) throw Error("Audience registry is temporarily unavailable.");
    setAudience(data.data as AudienceSummary);
  }, [key]);

  const pick = (edition: Edition) => {
    setCurrent(edition);
    setSubject(edition.subject);
    setPreheader(edition.preheader);
    setBody(edition.body_markdown);
    setReviewed(false);
    setError("");
  };
  const refresh = useCallback(async (preferId?: string) => {
    const list = await call("list") as Edition[];
    if (!Array.isArray(list)) throw Error("Invalid newsletter response");
    setEditions(list);
    const active = list.find(item => item.id === preferId) || list[0];
    if (active) pick(active);
    else setCurrent(null);
  }, [call]);
  const run = async (work: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError("");
    try { await work(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Newsletter operation failed"); }
    finally { setBusy(false); }
  };
  const unlock = (event: React.FormEvent) => {
    event.preventDefault();
    void run(async () => { await refresh(); setUnlocked(true); void loadAudience().catch(() => setAudience(null)); });
  };
  const generate = () => void run(async () => {
    const result = await call("generate-weekly") as { created: boolean; status: string };
    await refresh();
    toast.message(result.created ? "Weekly AI draft created. Review it before approval." : "Weekly draft already exists or needs provider configuration.");
  });
  const save = () => void run(async () => {
    if (!current) return;
    await call("save", { id: current.id, revision: current.revision, subject, preheader, body_markdown: body });
    await refresh(current.id);
    toast.success("Draft saved. No email was sent.");
  });
  const approve = () => void run(async () => {
    if (!current || !reviewed || reviewer.trim().length < 2) throw Error("Read the draft and confirm your review.");
    const dirty = current.subject !== subject || current.preheader !== preheader || current.body_markdown !== body;
    if (dirty) throw Error("Save your edits before approving the exact revision.");
    await call("approve", { id: current.id, revision: current.revision, reviewed: true, reviewer });
    await refresh(current.id);
    toast.success("Editorial approval recorded. Subscriber delivery is not enabled.");
  });

  return <main className="min-h-screen bg-background text-foreground px-4 py-10">
    <Helmet><title>Newsletter Desk | TradeHQ Admin</title><meta name="robots" content="noindex,nofollow"/></Helmet>
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-primary">TradeHQ / Administration</p>
          <h1 className="mt-2 text-3xl font-semibold">Newsletter Desk</h1>
          <p className="mt-2 text-sm text-muted-foreground">Weekly AI drafts. Your edits. Your approval. Never auto-send.</p>
        </div>
        <Link to="/admin" className="text-sm text-primary underline underline-offset-4">Back to dashboard</Link>
      </header>

      <section className={border}>
        <div className="flex items-start gap-3">
          <Mail className="mt-1 h-5 w-5 text-primary" />
          <div className="space-y-2">
            <h2 className="font-semibold">Editorial mode only</h2>
            <p className="text-sm text-muted-foreground">
              TradeHQ's Supabase scheduler prepares a private AI draft every Monday.
              Your review and approval do <strong>not</strong> send any emails. Subscriber delivery
              remains disabled until verified subscriptions, unsubscribe links and a
              legitimate sending provider are configured.
            </p>
          </div>
        </div>
      </section>

      {!unlocked ? <form onSubmit={unlock} className={border + " max-w-md space-y-4"}>
        <div className="flex items-center gap-2 font-semibold"><Lock className="h-4 w-4"/> Admin access</div>
        <Label htmlFor="newsletter-key">TradeHQ Admin Dashboard master key</Label>
        <Input id="newsletter-key" type="password" value={key} onChange={event => setKey(event.target.value)} required autoComplete="off" />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy || key.length < 8}>{busy ? "Checking…" : "Unlock drafts"}</Button>
      </form> : <>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={generate} disabled={busy}><Sparkles className="mr-2 h-4 w-4"/> Generate this week's draft</Button>
          <Button onClick={() => void run(async () => { await refresh(current?.id); await loadAudience().catch(() => setAudience(null)); })} variant="outline" disabled={busy}><RefreshCw className="mr-2 h-4 w-4"/> Refresh</Button>
          <Button variant="outline" onClick={() => { setUnlocked(false); setKey(""); setCurrent(null); setEditions([]); setAudience(null); }} disabled={busy}>Lock</Button>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <section className={border+" space-y-3"}>
          <h2 className="font-semibold">Subscriber registry <span className="text-xs font-normal text-muted-foreground">(private, read-only)</span></h2>
          {!audience ? <p className="text-sm text-muted-foreground">Audience statistics are unavailable or loading. Editorial drafts still work independently.</p> : <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">Historical email records</p><p className="text-2xl font-semibold">{audience.legacyRecordsTotal}</p></div>
              <div><p className="text-xs text-muted-foreground">Verified opt-in records</p><p className="text-2xl font-semibold">{audience.confirmedSubscribers}</p></div>
              <div><p className="text-xs text-muted-foreground">Unsubscribes</p><p className="font-medium">Not tracked</p></div>
            </div>
            <p className="text-xs text-muted-foreground">{audience.notice}</p>
            <div className="space-y-2">
              {audience.records.map(record => <div key={record.email} className="flex flex-wrap items-center justify-between gap-1 rounded-lg border border-border p-3 text-sm">
                <span className="break-all">{record.email}</span>
                <span className="text-xs text-muted-foreground">Legacy · {new Date(record.subscribed_at).toLocaleDateString()} · unverified consent</span>
              </div>)}
              {audience.legacyRecordsTotal > audience.records.length && <p className="text-xs text-muted-foreground">Showing the first {audience.records.length} records.</p>}
            </div>
          </>}
        </section>
        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className={border+" space-y-3"}>
            <h2 className="font-semibold">Weekly editions</h2>
            {!editions.length && <p className="text-sm text-muted-foreground">No drafts stored. Generate one once the backend is ready.</p>}
            {editions.map(edition => (
              <button type="button" key={edition.id} onClick={() => pick(edition)}
                className={"block w-full rounded-xl border px-3 py-3 text-left text-sm transition-colors " +
                  (edition.id === current?.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")}>
                <span className="block font-semibold">{edition.week_of}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{edition.status} · revision {edition.revision}</span>
              </button>
            ))}
          </aside>
          <section className={border+" min-w-0 space-y-4"}>
            {!current ? <p className="text-sm text-muted-foreground">Select a draft to review.</p> : <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-lg font-semibold">Week of {current.week_of}</h2>
                  <p className="text-xs text-muted-foreground">Status: {current.status} · {current.ai_model || "manual / pending"}</p>
                </div>
                {current.status === "approved" && <span className="flex items-center gap-1 text-sm text-primary"><CheckCircle2 className="h-4 w-4"/> Approved by {current.reviewed_by}</span>}
              </div>
              {current.generator_error && <p className="text-sm text-destructive">{current.generator_error}</p>}
              <Label htmlFor="newsletter-subject">Email subject</Label>
              <Input id="newsletter-subject" value={subject} onChange={e => setSubject(e.target.value)} maxLength={140} disabled={current.status !== "draft"} />
              <Label htmlFor="newsletter-preheader">Short preview line</Label>
              <Input id="newsletter-preheader" value={preheader} onChange={e => setPreheader(e.target.value)} maxLength={240} disabled={current.status !== "draft"} />
              <Label htmlFor="newsletter-body">Newsletter text (Markdown)</Label>
              <Textarea id="newsletter-body" value={body} onChange={e => setBody(e.target.value)} rows={19} className="font-mono text-sm" disabled={current.status !== "draft"} />
              <p className="text-xs text-muted-foreground">Independent primary-source references are welcome. Check facts, tone, calculations and every link before approval.</p>
              {current.status === "draft" && <>
                <Button onClick={save} disabled={busy} variant="outline">Save edits</Button>
                <div className="border-t border-border pt-4 space-y-3">
                  <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} className="mt-1" />
                    I reviewed this exact draft, its links and financial statements, and approve it for editorial use.</label>
                  <Label htmlFor="newsletter-reviewer">Reviewer name</Label>
                  <Input id="newsletter-reviewer" value={reviewer} onChange={e => setReviewer(e.target.value)} maxLength={80} />
                  <Button disabled={busy || !reviewed || reviewer.trim().length < 2} onClick={approve}>Approve draft (no email sent)</Button>
                </div>
              </>}
              <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                Publish to subscribers is not active. Activation requires confirmed opt-in, suppression/unsubscribe, a verified sending provider and delivery tracking. Nothing gets mailed just because you approve.
              </div>
            </>}
          </section>
        </div>
      </>}
    </div>
  </main>;
}
