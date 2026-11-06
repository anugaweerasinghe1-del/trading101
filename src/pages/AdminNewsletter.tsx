import { Link } from "react-router-dom";
import { useAdminDraftNavigation } from "@/hooks/useAdminDraftNavigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { newsletterAdminError } from "@/lib/newsletterAdminError";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, RefreshCw, Sparkles, Lock, Mail } from "lucide-react";

import { useAdminRefresh, useAdminRequestScope } from '@/hooks/useAdminRefresh';
import { isAdminRequestCancelled } from '@/lib/adminRequestScope';
import { AdminFreshness } from '@/components/admin/AdminFreshness';

type LessonTopic = { id: string; title: string; sourceTitle: string };
type NextIssuePreview = { week_of: string; subject: string; preheader: string; body_markdown: string; note: string };
type Audience = {
  counts: { confirmed: number; unsubscribed: number; pending: number; bounced: number };
  subscribers: { id: string; email: string; status: string; confirmed_at: string | null; unsubscribed_at: string | null; source: string }[];
  recentDeliveries: { edition_id: string; status: string; provider_id: string | null; created_at: string }[];
  limitInfo: string; webhookConfigured: boolean;
};
type PublishResult = { accepted: number; rejected: number; unknown: number; skipped: number; eligible: number; note: string };
type Edition = {
  id: string; week_of: string; status: "generating" | "draft" | "approved" | "failed";
  revision: number; subject: string; preheader: string; body_markdown: string;
  reviewed_by: string | null; reviewed_at: string | null; updated_at: string;
  ai_model: string | null; generator_error: string | null;
};
const border = "min-w-0 rounded-2xl border border-border bg-card/70 p-5";
export default function AdminNewsletter() {
  const [key, setKey] = useState("");
  const scope = useAdminRequestScope(key);
  const pending = useRef(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null), [refreshError, setRefreshError] = useState('');
  const [syncRequired, setSyncRequired] = useState(false);
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
  const [audienceCheckedAt, setAudienceCheckedAt] = useState<Date | null>(null);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [sendOwnerVerified, setSendOwnerVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const dirty = !!current && (current.subject !== subject || current.preheader !== preheader || current.body_markdown !== body);
  useAdminDraftNavigation(dirty);
  const stale = syncRequired || !!current && !editions.some(row => row.id === current.id && row.revision === current.revision && row.status === current.status);
  const editor = useRef({ current, dirty }); editor.current = { current, dirty };
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const guard = scope.capture(key);
    const { data, error: invokeError } = await supabase.functions.invoke("newsletter-editor", {
      body: { action, ...payload },
      headers: { "x-admin-key": key },
    });
    guard.assert();
    if (invokeError || data?.error) {
      // Supabase returns a FunctionsHttpError on 4xx/5xx; data is null on that
      // path. The old UI misreported rejected master keys as missing backend.
      const context = (invokeError as { context?: { status?: number } } | null)?.context;
      throw Error(newsletterAdminError(context?.status, typeof data?.error === "string" ? data.error : null));
    }
    return data.data;
  }, [key]);

  const distributionCall = useCallback(async (action: string, payload: Record<string, unknown> = {}, bearerToken?: string) => {
    const guard = scope.capture(key);
    const { data, error: invokeError } = await supabase.functions.invoke("newsletter-dispatch", {
      body: { action, ...payload }, headers: { "x-admin-key": key, ...(bearerToken ? { authorization: "Bearer " + bearerToken } : {}) },
    });
    guard.assert();
    if (invokeError || data?.error) {
      const status = (invokeError as { context?: { status?: number } } | null)?.context?.status;
      if (status === 403) throw Error("Newsletter sending requires the registered owner's current TradeHQ login in addition to the master key.");
      if (status === 401) throw Error("The TradeHQ admin master key was rejected.");
      throw Error(data?.error || "Subscriber delivery service unavailable.");
    }
    return data.data;
  }, [key]);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (event !== 'SIGNED_OUT') return;
      scope.invalidate(); pending.current = false; setBusy(false);
      setSendOwnerVerified(false); setReviewed(false);
    });
    return () => data.subscription.unsubscribe();
  }, [scope]);
  const loadAudience = useCallback(async () => {
    const guard = scope.capture(key, 'audience');
    const result = await distributionCall('status') as Audience;
    guard.assert(); setAudience(result); setAudienceCheckedAt(new Date());
  }, [distributionCall]);
  const refreshAfterWrite = async (id?: string) => {
    try { await refresh(id); }
    catch (failure) {
      if (isAdminRequestCancelled(failure)) throw failure;
      setSyncRequired(true);
      setRefreshError('The action was confirmed, but editions could not refresh. Refresh before another editorial action.');
    }
  };
  const previewNextIssue = () => void run(async () => {
    const next = await call("preview-upcoming") as NextIssuePreview;
    setNextPreview(next);
    toast.message("Unsaved AI sample generated. No emails sent.");
  });
  const ownerToken = async (): Promise<string> => {
    const guard = scope.capture(key);
    const { data, error: authError } = await supabase.auth.getSession();
    guard.assert();
    if (authError || !data.session?.access_token)
      throw Error("Sign in with the registered TradeHQ owner account before sending. No emails were sent.");
    return data.session.access_token;
  };
  const verifyOwnerSend = () => void run(async () => {
    setSendOwnerVerified(false);
    const token = await ownerToken();
    const result = await distributionCall("publish-readiness", {}, token) as {
      ownerVerified?: boolean; emailsSent?: number; providerAttemptMade?: boolean;
    };
    if (result?.ownerVerified !== true || result?.emailsSent !== 0 || result?.providerAttemptMade !== false)
      throw Error("Unexpected owner verification result. No email was sent.");
    setSendOwnerVerified(true);
    toast.success("Registered owner verified. No newsletter was sent.");
  });
  const publishEdition = () => void run(async () => {
    if (!current || current.status !== "approved") return;
    if (editor.current.dirty)
      throw Error("Save and approve the exact newsletter revision before sending. Unsaved changes cannot be sent.");
    const token = await ownerToken();
    if (!window.confirm("Send this approved educational issue to confirmed TradeHQ Newsletter subscribers? Sending cannot be undone.")) return;
    setPublishResult(null);
    const result = await distributionCall("publish", {
      editionId: current.id, revision: current.revision, confirmed: true,
    }, token) as PublishResult;
    setPublishResult(result);
    try { await loadAudience(); } catch (failure) {
      if (isAdminRequestCancelled(failure)) throw failure;
      setRefreshError('The delivery result was received, but current receipts could not refresh. Check delivery history before retrying.');
    }
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
    const guard = scope.capture(key, 'editions');
    const list = await call("list") as Edition[];
    guard.assert();
    if (!Array.isArray(list)) throw Error("Invalid newsletter response");
    setEditions(list); setSyncRequired(false); setCheckedAt(new Date()); setRefreshError("");
    const active = list.find(item => item.id === preferId) || list[0];
    if (active) pick(active);
    else setCurrent(null);
  }, [call]);
  const run = async (work: () => Promise<void>) => {
    if (pending.current) return; pending.current = true; const guard = scope.capture(key);
    setBusy(true); setError("");
    try { await work(); }
    catch (failure) { if (guard.current() && !isAdminRequestCancelled(failure)) setError(failure instanceof Error ? failure.message : "Newsletter operation failed"); }
    finally { if (guard.current()) { pending.current = false; setBusy(false); } }
  };
  const refreshMetadata = useCallback(async () => {
    const guard = scope.capture(key, 'editions');
    const list = await call('list') as Edition[];
    guard.assert();
    if (!Array.isArray(list)) throw Error('Invalid newsletter response');
    setEditions(list); setSyncRequired(false); setCheckedAt(new Date()); setRefreshError('');
    const state = editor.current;
    const updated = list.find(item => item.id === state.current?.id);
    if (!state.current && list[0]) pick(list[0]);
    else if (!state.dirty && updated && (updated.revision !== state.current?.revision || updated.status !== state.current?.status)) pick(updated);
    await loadAudience();
  }, [call, key, loadAudience, scope]);
  useAdminRefresh(unlocked, refreshMetadata, { paused: () => pending.current,
    onError: () => setRefreshError('Could not refresh newsletter or subscriber status.') });
  const unlock = (event: React.FormEvent) => {
    event.preventDefault();
    void run(async () => {
      await refresh();
      const available = await call("topics") as LessonTopic[];
      if (!Array.isArray(available) || !available.length) throw Error("Newsletter learning topics unavailable");
      setTopics(available);
      setTopicId(available[0].id);
      setUnlocked(true);
      const audienceGuard = scope.capture(key);
      void loadAudience().catch(() => { if (audienceGuard.current()) { setAudience(null); setRefreshError('Subscriber status is unavailable.'); } });
    });
  };
  const generate = () => void run(async () => {
    if (editor.current.dirty && !window.confirm("Generating a weekly draft will replace your unsaved newsletter edits. Discard those edits?")) return;
    const result = await call("generate-weekly") as { created: boolean; status: string };
    await refreshAfterWrite();
    toast.message(result.created ? "Weekly AI draft created. Review it before approval." : "Weekly draft already exists or needs provider configuration.");
  });
  const save = () => void run(async () => {
    if (!current || stale) return;
    await call("save", { id: current.id, revision: current.revision, subject, preheader, body_markdown: body });
    await refreshAfterWrite(current.id);
    setPreviewGenerated(false);
    toast.success("Educational draft saved. Review and approve separately; nothing was sent.");
  });
  const reopen = () => void run(async () => {
    if (!current || current.status !== "approved") return;
    if (editor.current.dirty && !window.confirm("Reopening this edition will discard your unsaved newsletter edits. Continue?")) return;
    await call("reopen", { id: current.id, revision: current.revision });
    await refreshAfterWrite(current.id);
    toast.message("Editorial approval withdrawn for revisions. Nothing was emailed.");
  });
  const previewLesson = () => void run(async () => {
    if (!current || current.status !== "draft") return;
    if (editor.current.dirty && !window.confirm("This AI preview will replace your unsaved newsletter edits in the editor. Discard them?")) return;
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
    if (!current || stale || !reviewed || reviewer.trim().length < 2) throw Error("Read the draft and confirm your review.");
    const dirty = current.subject !== subject || current.preheader !== preheader || current.body_markdown !== body;
    if (dirty) throw Error("Save your edits before approving the exact revision.");
    await call("approve", { id: current.id, revision: current.revision, reviewed: true, reviewer });
    await refreshAfterWrite(current.id);
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
              <strong> does not send emails</strong>. Only your explicit Publish action sends
              the reviewed issue to readers who have confirmed their subscription.
            </p>
          </div>
        </div>
      </section>

      {!unlocked ? <form onSubmit={unlock} className={border + " max-w-md space-y-4"}>
        <div className="flex items-center gap-2 font-semibold"><Lock className="h-4 w-4"/> Admin access</div>
        <Label htmlFor="newsletter-key">TradeHQ Admin Dashboard master key</Label>
        <Input id="newsletter-key" type="password" disabled={busy} value={key} onChange={event => setKey(event.target.value)} required autoComplete="off" />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button className="max-w-full whitespace-normal h-auto min-h-10" type="submit" disabled={busy || key.length < 8}>{busy ? "Checking…" : "Unlock drafts"}</Button>
      </form> : <>
        <div className="flex flex-wrap items-center gap-3 [&>button]:max-w-full [&>button]:whitespace-normal [&>button]:h-auto [&>button]:min-h-10">
          <Button className="max-w-full whitespace-normal h-auto min-h-10" onClick={previewNextIssue} variant="outline" disabled={busy}>
            <Sparkles className="mr-2 h-4 w-4"/> Preview next week's AI issue
          </Button>
          <Button className="max-w-full whitespace-normal h-auto min-h-10" onClick={generate} disabled={busy}><Sparkles className="mr-2 h-4 w-4"/> Generate this week's draft</Button>
          <Button className="max-w-full whitespace-normal h-auto min-h-10" onClick={() => { if (dirty && !confirm('Discard unsaved newsletter edits and load the latest revision?')) return; void run(async () => { await refresh(current?.id); await loadAudience(); }); }} variant="outline" disabled={busy}><RefreshCw className="mr-2 h-4 w-4"/> Refresh</Button>
          <Button className="max-w-full whitespace-normal h-auto min-h-10" variant="outline" onClick={() => { if (dirty && !confirm('Discard unsaved newsletter edits and lock?')) return; scope.invalidate(); pending.current = false; setBusy(false); setCheckedAt(null); setRefreshError(''); setSyncRequired(false); setSubject(''); setPreheader(''); setBody(''); setReviewed(false); setReviewer(''); setUnlocked(false); setKey(""); setCurrent(null); setEditions([]); setTopics([]); setAudience(null); setAudienceCheckedAt(null); setPublishResult(null); setNextPreview(null); setSendOwnerVerified(false); }} disabled={busy}>Lock</Button>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <AdminFreshness checkedAt={checkedAt} error={refreshError} />
        {current && editions.some(item => item.id === current.id && item.revision !== current.revision) && <p role="status" className="text-sm text-amber-600 dark:text-amber-400">This edition changed on the server. Your edits are preserved. Load the latest revision before approval.</p>}
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
          <h2 className="font-semibold">TradeHQ Newsletter · confirmed subscribers</h2>
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
          <div className="flex flex-wrap items-center gap-3 [&>button]:max-w-full [&>button]:whitespace-normal [&>button]:h-auto [&>button]:min-h-10">
            <Button className="max-w-full whitespace-normal h-auto min-h-10" variant="outline" disabled={busy} onClick={() => void run(loadAudience)}>Refresh subscribers</Button>
            <Button className="max-w-full whitespace-normal h-auto min-h-10" variant="outline" disabled={busy} onClick={verifyOwnerSend}>Verify owner access (no email)</Button>
            <Button className="max-w-full whitespace-normal h-auto min-h-10" disabled={busy || dirty || stale || current?.status !== "approved" || !audience?.webhookConfigured} onClick={publishEdition}>
              <Mail className="mr-2 h-4 w-4"/> Publish approved issue to subscribers
            </Button>
          </div>
          {sendOwnerVerified && <p role="status" className="text-sm text-muted-foreground">
            Registered owner verified for this session. No email was sent; the protected send action still requires confirmation.
          </p>}
          {!audience && <p role="status" className="text-xs text-amber-600">Subscriber and webhook status are unavailable. Refresh subscribers to check.</p>}
          {audience && !audience.webhookConfigured && <p className="text-xs text-amber-600">
            Publishing is safety-locked until the signed Resend delivery webhook is configured.
            Signup and confirmation work independently.
          </p>}
          <p className="text-xs text-muted-foreground">
            Publishing requires the registered owner’s current website login plus the admin key, and a separate deliberate confirmation after approval. Maximum 20 unique recipients
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
          <p className="text-xs text-muted-foreground">Subscriber and delivery data last refreshed: {audienceCheckedAt?.toLocaleString() ?? 'not yet confirmed'}.</p>
          <section aria-label="Newsletter delivery history" className="space-y-2">
            <h3 className="text-sm font-semibold">Recent delivery receipts</h3>
            <p className="text-xs text-muted-foreground">Up to 50 recent receipts across editions. Accepted means the provider accepted the request; only a delivery event confirms delivered. Unknown outcomes need investigation before retrying.</p>
            {!audience ? <p className="text-sm">Delivery history unavailable.</p> : !audience.recentDeliveries.length ? <p className="text-sm">No recent receipts returned.</p> :
              <ul className="space-y-2 text-xs">{audience.recentDeliveries.map((receipt, index) => <li key={index} className="rounded-lg border border-border p-3 break-words">
                <p>Edition: {editions.find(edition => edition.id === receipt.edition_id)?.week_of ?? 'outside loaded editions'}{receipt.edition_id === current?.id ? ' · selected edition' : ''}</p>
                <p>Recorded status: {receipt.status} · {new Date(receipt.created_at).toLocaleString()}</p>
              </li>)}</ul>}
          </section>
          <p className="text-xs text-muted-foreground">{audience?.limitInfo}</p>
        </section>
        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className={border+" space-y-3"}>
            <h2 className="font-semibold">Newsletter editions</h2>
            {!editions.length && <p className="text-sm text-muted-foreground">No drafts stored. Generate one once the backend is ready.</p>}
            {editions.map(edition => (
              <button type="button" disabled={busy} key={edition.id} onClick={() => { if (dirty && !confirm('Discard unsaved newsletter edits?')) return; pick(edition); }}
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
                  <p className="text-sm text-muted-foreground">This edition is approved. Check delivery history for any sends already recorded. Reopen it to revise the content before a new approval.</p>
                  <Button className="max-w-full whitespace-normal h-auto min-h-10" variant="outline" onClick={reopen} disabled={busy}>Reopen for revisions</Button>
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
                  <select id="lesson-topic" disabled={busy} value={topicId} onChange={e => setTopicId(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background p-2 text-sm">
                    {topics.map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
                  </select>
                  <Button className="max-w-full whitespace-normal h-auto min-h-10" variant="outline" onClick={previewLesson} disabled={busy || !topics.length}>
                    <Sparkles className="mr-2 h-4 w-4" /> Draft a deeper lesson (preview only)
                  </Button>
                  {previewGenerated && (
                    <p className="text-xs text-primary" role="status">Unsaved AI preview. Review every fact, then save your edits before approving.</p>
                  )}
                </div>
              )}
              <Label htmlFor="newsletter-subject">Email subject</Label>
              <Input id="newsletter-subject" value={subject} onChange={e => { setSubject(e.target.value); setReviewed(false); }} maxLength={140} disabled={busy || current.status !== "draft"} />
              <Label htmlFor="newsletter-preheader">Short preview line</Label>
              <Input id="newsletter-preheader" value={preheader} onChange={e => { setPreheader(e.target.value); setReviewed(false); }} maxLength={240} disabled={busy || current.status !== "draft"} />
              <Label htmlFor="newsletter-body">Newsletter text (Markdown)</Label>
              <Textarea id="newsletter-body" value={body} onChange={e => { setBody(e.target.value); setReviewed(false); }} rows={19} className="font-mono text-sm" disabled={busy || current.status !== "draft"} />
              <p className="text-xs text-muted-foreground">Check independent sources, calculations and links before approving.</p>
              {current.status === "draft" && <>
                <Button className="max-w-full whitespace-normal h-auto min-h-10" onClick={save} disabled={busy || stale || !dirty} variant="outline">Save edits</Button>
                <div className="border-t border-border pt-4 space-y-3">
                  <label className="flex items-start gap-2 text-sm"><input type="checkbox" disabled={busy || dirty || stale} checked={reviewed} onChange={e => setReviewed(e.target.checked)} className="mt-1" />
                    I reviewed this exact draft, its links and financial statements, and approve it for editorial use.</label>
                  <Label htmlFor="newsletter-reviewer">Reviewer name</Label>
                  <Input id="newsletter-reviewer" disabled={busy} value={reviewer} onChange={e => setReviewer(e.target.value)} maxLength={80} />
                  <Button className="max-w-full whitespace-normal h-auto min-h-10" disabled={busy || dirty || stale || !reviewed || reviewer.trim().length < 2} onClick={approve}>Approve draft (no email sent)</Button>
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
