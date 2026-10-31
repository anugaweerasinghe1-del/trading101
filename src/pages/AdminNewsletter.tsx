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

type LessonTopic = { id: string; title: string; sourceTitle: string };
type NextIssuePreview = { week_of: string; subject: string; preheader: string; body_markdown: string; note: string };
type Audience = {
  counts: { confirmed: number; unsubscribed: number; pending: number; bounced: number };
  subscribers: { id: string; email: string; status: string; confirmed_at: string | null; unsubscribed_at: string | null; source: string }[];
  recentDeliveries: { edition_id: string; status: string; provider_id: string | null; created_at: string }[];
  limitInfo: string;
};
type PublishResult = { accepted: number; rejected: number; unknown: number; skipped: number; eligible: number; note: string };
type Edition = {
  id: string; week_of: string; status: "generating" | "draft" | "approved" | "failed";
  revision: number; subject: string; preheader: string; body_markdown: string;
  reviewed_by: string | null; reviewed_at: string | null; updated_at: string;
  ai_model: string | null; generator_error: string | null;
};
const border = "rounded-2xl border border-border bg-card/70 p-5";
export default function AdminNewsletter() {
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [current, setCurrent] = useState<Edition | null>(null);
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [body, setBody] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [reviewer, setReviewer] = useState("");
  const [topics, setTopics] = useState<LessonTopic[]>([]);
  const [topicId, setTopicId] = useState("stop-gap");
  const [previewGenerated, setPreviewGenerated] = useState(false);
  const [nextPreview, setNextPreview] = useState<NextIssuePreview | null>(null);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
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

  const distributionCall = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const { data, error: invokeError } = await supabase.functions.invoke("newsletter-dispatch", {
      body: { action, ...payload }, headers: { "x-admin-key": key },
    });
    if (invokeError || data?.error) throw Error(data?.error || "Subscriber delivery service unavailable.");
    return data.data;
  }, [key]);
  const loadAudience = useCallback(async () => {
    setAudience(await distributionCall("status") as Audience);
  }, [distributionCall]);
  const previewNextIssue = () => void run(async () => {
    const next = await call("preview-upcoming") as NextIssuePreview;
    setNextPreview(next);
    toast.message("Unsaved AI sample generated. No emails sent.");
  });
  const publishEdition = () => void run(async () => {
    if (!current || current.status !== "approved") return;
    if (!window.confirm("Send this approved educational issue to confirmed TradeHQ Weekly subscribers? Sending cannot be undone.")) return;
    setPublishResult(null);
    const result = await distributionCall("publish", {
      editionId: current.id, revision: current.revision, confirmed: true,
    }) as PublishResult;
    setPublishResult(result);
    await loadAudience();
    toast.message(result.note);
  });

  const pick = (edition: Edition) => {
    setCurrent(edition);
    setSubject(edition.subject);
    setPreheader(edition.preheader);
    setBody(edition.body_markdown);
    setReviewed(false);
    setPreviewGenerated(false);
    setPublishResult(null);
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
    void run(async () => {
      await refresh();
      const available = await call("topics") as LessonTopic[];
      if (!Array.isArray(available) || !available.length) throw Error("Newsletter learning topics unavailable");
      setTopics(available);
      setTopicId(available[0].id);
      setUnlocked(true);
      void loadAudience().catch(() => setAudience(null));
    });
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
    setPreviewGenerated(false);
    toast.success("Educational draft saved. Review and approve separately; nothing was sent.");
  });
  const reopen = () => void run(async () => {
    if (!current || current.status !== "approved") return;
    await call("reopen", { id: current.id, revision: current.revision });
    await refresh(current.id);
    toast.message("Editorial approval withdrawn for revisions. Nothing was emailed.");
  });
  const previewLesson = () => void run(async () => {
    if (!current || current.status !== "draft") return;
    const response = await call("preview-rewrite", {
      id: current.id, revision: current.revision, topicId,
    }) as { subject: string; preheader: string; body_markdown: string };
    setSubject(response.subject);
    setPreheader(response.preheader);
    setBody(response.body_markdown);
    setReviewed(false);
    setPreviewGenerated(true);
    toast.message("A deeper, source-backed lesson is ready to review. It is NOT saved or approved yet.");
  });
  const approve = () => void run(async () => {
    if (!current || !reviewed || reviewer.trim().length < 2) throw Error("Read the draft and confirm your review.");
    const dirty = current.subject !== subject || current.preheader !== preheader || current.body_markdown !== body;
    if (dirty) throw Error("Save your edits before approving the exact revision.");
    await call("approve", { id: current.id, revision: current.revision, reviewed: true, reviewer });
    await refresh(current.id);
    toast.success("Editorial approval recorded. Publish it separately when you are satisfied.");
  });

  return <main className="min-h-screen bg-background text-foreground px-4 py-10">
    <Helmet><title>Newsletter Desk | TradeHQ Admin</title><meta name="robots" content="noindex,nofollow"/></Helmet>
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-primary">TradeHQ / Administration</p>
          <h1 className="mt-2 text-3xl font-semibold">Newsletter Desk</h1>
          <p className="mt-2 text-sm text-muted-foreground">One original beginner lesson a week. You review, approve, then publish to confirmed readers.</p>
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
              Each issue now explores an original, hypothetical decision problem with a verified calculation
              and a primary investor-education source—not a list of TradeHQ product links. Your approval
              <strong> does not send emails</strong>. Only your explicit Publish action sends to
              confirmed subscribers receive only issues you explicitly publish after review.
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
          <Button onClick={previewNextIssue} variant="outline" disabled={busy}>
            <Sparkles className="mr-2 h-4 w-4"/> Preview next week's AI issue
          </Button>
          <Button onClick={generate} disabled={busy}><Sparkles className="mr-2 h-4 w-4"/> Generate this week's draft</Button>
          <Button onClick={() => void run(async () => refresh(current?.id))} variant="outline" disabled={busy}><RefreshCw className="mr-2 h-4 w-4"/> Refresh</Button>
          <Button variant="outline" onClick={() => { setUnlocked(false); setKey(""); setCurrent(null); setEditions([]); setTopics([]); setAudience(null); setPublishResult(null); setNextPreview(null); }} disabled={busy}>Lock</Button>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <section className={border+" space-y-3"}>
          <h2 className="font-semibold">Preview a new AI-generated issue</h2>
          <p className="text-xs text-muted-foreground">
            Generate a genuine beginner issue for next Monday without saving, approving or emailing it.
          </p>
          {nextPreview && <div className="space-y-2">
            <p className="text-xs text-primary">Week of {nextPreview.week_of} · unsaved</p>
            <h3 className="text-lg font-semibold">{nextPreview.subject}</h3>
            <p className="text-sm text-muted-foreground">{nextPreview.preheader}</p>
            <Textarea readOnly value={nextPreview.body_markdown} rows={18} className="font-mono text-sm" />
          </div>}
        </section>
        <section className={border+" space-y-3"}>
          <h2 className="font-semibold">TradeHQ Weekly · confirmed subscribers</h2>
          <p className="text-sm text-muted-foreground">
            Readers must actively subscribe and confirm their email. The previous test-only inbox
            has been replaced by a real subscriber registry. Historical addresses with no proven permission
            are never eligible.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              ["Confirmed", audience?.counts.confirmed ?? "—"],
              ["Awaiting confirmation", audience?.counts.pending ?? "—"],
              ["Unsubscribed", audience?.counts.unsubscribed ?? "—"],
              ["Bounced", audience?.counts.bounced ?? "—"],
            ] as const).map(([label, value]) => <div key={label} className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>)}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" disabled={busy} onClick={() => void run(loadAudience)}>Refresh subscribers</Button>
            <Button disabled={busy || current?.status !== "approved"} onClick={publishEdition}>
              <Mail className="mr-2 h-4 w-4"/> Publish approved issue to subscribers
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Publishing is a separate deliberate action after approval. Maximum 20 unique recipients
            per request, with conservative free-tier limits. The same edition cannot be resent to
            a person by clicking again. No email is sent merely by approving a draft.
          </p>
          {publishResult && <p role="status" className="text-sm">
            Provider accepted {publishResult.accepted}; rejected {publishResult.rejected};
            unknown {publishResult.unknown}. {publishResult.note}
          </p>}
          {!!audience?.subscribers.length && <div className="space-y-1">
            <h3 className="text-xs font-semibold">Most recent registry entries (private)</h3>
            {audience.subscribers.slice(0,30).map(row => <p key={row.id}
              className="text-xs text-muted-foreground break-all">{row.email} · {row.status}
              {row.confirmed_at ? " · confirmed " + new Date(row.confirmed_at).toLocaleDateString() : ""}
            </p>)}
          </div>}
          <p className="text-xs text-muted-foreground">{audience?.limitInfo}</p>
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
              {current.status === "approved" && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <p className="text-sm text-muted-foreground">This issue is approved but not sent. Reopen it to replace repetitive content with a more useful educational lesson.</p>
                  <Button variant="outline" onClick={reopen} disabled={busy}>Reopen for revisions</Button>
                </div>
              )}
              {current.status === "draft" && (
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                  <h3 className="text-sm font-semibold">Create an original learning issue</h3>
                  <p className="text-xs text-muted-foreground">
                    Select a topic. AI will explain the subtle mechanism, then attach a checked hypothetical
                    worksheet and a verified SEC Investor.gov source. No product advertisement or article recap.
                    This previews new text; your stored draft is not replaced until you click Save edits.
                  </p>
                  <Label htmlFor="lesson-topic">This week's learning focus</Label>
                  <select id="lesson-topic" value={topicId} onChange={e => setTopicId(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background p-2 text-sm">
                    {topics.map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
                  </select>
                  <Button variant="outline" onClick={previewLesson} disabled={busy || !topics.length}>
                    <Sparkles className="mr-2 h-4 w-4" /> Draft a deeper lesson (preview only)
                  </Button>
                  {previewGenerated && (
                    <p className="text-xs text-primary" role="status">Unsaved AI preview. Review every fact, then save your edits before approving.</p>
                  )}
                </div>
              )}
              <Label htmlFor="newsletter-subject">Email subject</Label>
              <Input id="newsletter-subject" value={subject} onChange={e => setSubject(e.target.value)} maxLength={140} disabled={current.status !== "draft"} />
              <Label htmlFor="newsletter-preheader">Short preview line</Label>
              <Input id="newsletter-preheader" value={preheader} onChange={e => setPreheader(e.target.value)} maxLength={240} disabled={current.status !== "draft"} />
              <Label htmlFor="newsletter-body">Newsletter text (Markdown)</Label>
              <Textarea id="newsletter-body" value={body} onChange={e => setBody(e.target.value)} rows={19} className="font-mono text-sm" disabled={current.status !== "draft"} />
              <p className="text-xs text-muted-foreground">Check independent sources, calculations and links before approving.</p>
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
                Subscriber delivery uses verified opt-ins and unique per-recipient receipts. Use Publish only after reviewing the exact approved issue; confirmations and unsubscribes are handled separately.
              </div>
            </>}
          </section>
        </div>
      </>}
    </div>
  </main>;
}
