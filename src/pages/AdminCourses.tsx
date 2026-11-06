import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Lock, BookOpen, Save, Eye, Settings2, CheckCircle2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CourseDraftEditor, blankCourse } from "@/components/courses/CourseDraftEditor";
import { CoursePreview } from "@/components/courses/CoursePreview";
import { CourseGenerationSettings, type GenerationSettings } from "@/components/courses/CourseGenerationSettings";
import { validateCourseDocument, type CourseDocument } from "../../supabase/functions/_shared/courseDocument";
import { reviewCourseQuality } from "../../supabase/functions/_shared/courseQualityGate";

import { useAdminRefresh, useAdminRequestScope } from '@/hooks/useAdminRefresh';
import { isAdminRequestCancelled } from '@/lib/adminRequestScope';
import { courseAdminError } from "@/lib/adminFunctionError";
import { AdminFreshness } from '@/components/admin/AdminFreshness';
interface Draft {
  id: string; status: string; revision: number; published_revision: number; document: CourseDocument;
  research: { method?: string; demandNote?: string; checks?: string[]; sources?: { label: string; url: string }[] };
  updated_at: string;
}
export default function AdminCourses() {
  const [key, setKey] = useState(""), [unlocked, setUnlocked] = useState(false);
  const scope = useAdminRequestScope(key);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null), [refreshError, setRefreshError] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]), [selected, setSelected] = useState<Draft | null>(null);
  const [document, setDocument] = useState<CourseDocument | null>(null);
  const [settings, setSettings] = useState<GenerationSettings | null>(null);
  const [mode, setMode] = useState<"edit" | "preview" | "settings">("edit");
  const [busy, setBusy] = useState(false), [reviewed, setReviewed] = useState(false);
  const [reviewer, setReviewer] = useState("Anuga Weerasinghe");
  const [ownerCheck, setOwnerCheck] = useState<"verified" | "denied" | null>(null);
  const pending = useRef(false);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const dirty = settingsDirty || !!document && JSON.stringify(document) !== JSON.stringify(selected?.document);
  const stale = !!selected && !drafts.some(row => row.id === selected.id && row.revision === selected.revision && row.status === selected.status);
  const errors = document ? [...validateCourseDocument(document, true), ...reviewCourseQuality(document)] : [];
  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}, bearerToken?: string) => {
    const guard = scope.capture(key);
    const { data, error } = await supabase.functions.invoke("admin-courses", { body: { action, ...payload },
      headers: { "x-admin-key": key, ...(bearerToken ? { authorization: "Bearer " + bearerToken } : {}) } });
    guard.assert();
    if (error || data?.error) throw new Error(await courseAdminError(error, data));
    return data?.data;
  }, [key]);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (event !== 'SIGNED_OUT') return;
      scope.invalidate(); pending.current = false; setBusy(false);
      setOwnerCheck(null); setReviewed(false);
    });
    return () => data.subscription.unsubscribe();
  }, [scope]);
  const load = useCallback(async () => {
    const guard = scope.capture(key, 'metadata');
    const [rows, status] = await Promise.all([call("list"), call("settings")]);
    if (!Array.isArray(rows) || !status) throw new Error("Could not load course administration.");
    guard.assert(); setDrafts(rows); setSettings(status); setCheckedAt(new Date()); setRefreshError('');
    return rows as Draft[];
  }, [call]);
  const action = async (work: () => Promise<void>) => {
    if (pending.current) return false;
    pending.current = true; const guard = scope.capture(key); setBusy(true);
    try { await work(); return true; } catch (error) { if (guard.current() && !isAdminRequestCancelled(error)) toast.error(error instanceof Error ? error.message : "Could not save changes."); return false; }
    finally { if (guard.current()) { pending.current = false; setBusy(false); } }
  };
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useAdminRefresh(unlocked, load, { paused: () => pending.current,
    onError: () => setRefreshError('Could not refresh this desk.') });
  const choose = (draft: Draft | null) => {
    if (dirty && !confirm("Discard your unsaved edits?")) return;
    setSelected(draft); setDocument(draft ? structuredClone(draft.document) : blankCourse()); setReviewed(false); setMode("edit");
  };
  const refreshAfterWrite = async () => {
    try { return await load(); }
    catch (error) {
      if (isAdminRequestCancelled(error)) throw error;
      setRefreshError('The action was confirmed, but the inbox could not refresh. Refresh before another action.');
      return null;
    }
  };
  const save = async () => {
    if (!document || stale) return;
    const row = await call("save", { id: selected?.id ?? null, revision: selected?.revision ?? null, document }) as Draft;
    setSelected(row); setDocument(structuredClone(row.document)); setReviewed(false); await refreshAfterWrite();
    toast.success("Draft saved. Approval is required before publication.");
  };
  const checkOwnerAccess = async () => {
    setOwnerCheck(null);
    const guard = scope.capture(key);
    const { data: auth, error: authError } = await supabase.auth.getSession();
    guard.assert();
    if (authError || !auth.session?.access_token) {
      setOwnerCheck("denied");
      throw new Error("Sign in with the registered TradeHQ owner account first. No course was published.");
    }
    try {
      const result = await call("publish-readiness", {}, auth.session.access_token) as {
        ownerVerified?: boolean; publicationPerformed?: boolean; aiAttemptMade?: boolean;
      };
      guard.assert();
      if (result?.ownerVerified !== true || result?.publicationPerformed !== false || result?.aiAttemptMade !== false)
        throw new Error("Owner verification returned an unexpected result.");
      setOwnerCheck("verified");
      toast.success("Registered owner verified. No course was published or generated.");
    } catch (error) {
      if (guard.current()) setOwnerCheck("denied");
      throw error;
    }
  };
  const publish = async () => {
    if (!selected || dirty || stale || !reviewed || errors.length) return;
    const guard = scope.capture(key);
    const { data: auth, error: authError } = await supabase.auth.getSession();
    guard.assert();
    if (authError || !auth.session?.access_token)
      throw new Error("Sign in with the registered TradeHQ owner account before publishing a course. Your admin key alone cannot publish.");
    await call("publish", { id: selected.id, revision: selected.revision, reviewed, reviewer },
      auth.session.access_token);
    const rows = await refreshAfterWrite(), row = rows?.find(d => d.id === selected.id);
    if (row) { setSelected(row); setDocument(structuredClone(row.document)); }
    setReviewed(false); toast.success("Course approved and published.");
  };
  return <>
    <Helmet><title>Course drafts · TradeHQ Admin</title><meta name="robots" content="noindex, nofollow" /></Helmet>
    {!unlocked ? <main className="min-h-screen flex items-center justify-center px-4 bg-background">
      <form onSubmit={e => { e.preventDefault(); void action(async () => { await load(); setUnlocked(true); }); }} className="w-full max-w-sm rounded-3xl border border-border bg-card p-7 space-y-5">
        <BookOpen className="w-7 h-7 text-primary" /><div><h1 className="text-xl font-semibold">Course desk</h1><p className="text-sm text-muted-foreground mt-2">Review drafts, edit lessons and approve publication.</p></div>
        <label className="block text-sm space-y-2"><span>Master key</span><input type="password" disabled={busy} autoComplete="off" value={key} onChange={e => setKey(e.target.value)} className="w-full rounded-xl bg-background border border-border px-3 py-3" /></label>
        <button disabled={busy} className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm disabled:opacity-50">{busy ? "Checking…" : "Open course desk"}</button>
        <Link className="block text-sm text-primary" to="/admin">← Admin dashboard</Link>
        <Link className="block text-sm text-primary" to="/admin/daily">Daily practice administration →</Link>
        <Link className="block text-sm text-muted-foreground" to="/admin/reviews">Review administration →</Link>
      </form>
    </main> : <main className="min-h-screen bg-background px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8"><div><p className="text-xs uppercase tracking-widest text-primary mb-2">TradeHQ · Admin</p><h1 className="text-2xl font-semibold">Course desk</h1></div>
        <div className="flex flex-wrap items-center gap-4 text-sm"><Link to="/admin" className="text-primary">Dashboard</Link><Link to="/admin/daily" className="text-primary">Daily practice</Link><Link to="/admin/reviews" className="text-muted-foreground">Reviews</Link><button onClick={() => { if (dirty && !confirm("Discard unsaved edits and lock?")) return; scope.invalidate(); pending.current = false; setBusy(false); setUnlocked(false); setKey(""); setDocument(null); setSelected(null); setDrafts([]); setSettings(null); setReviewed(false); setCheckedAt(null); setRefreshError(''); setOwnerCheck(null); setSettingsDirty(false); }} className="flex items-center gap-2"><Lock className="w-4 h-4" />Lock</button></div></header>
      <div className="flex flex-wrap gap-3 mb-6">
        <button type="button" onClick={() => { if (settingsDirty && !confirm("Discard unsaved generation settings?")) return; setMode("edit"); }} className="rounded-xl border border-border px-4 py-2 text-sm">Draft inbox ({drafts.filter(d => d.status === "draft").length})</button>
        <button type="button" onClick={() => setMode("settings")} className="rounded-xl border border-border px-4 py-2 text-sm inline-flex items-center gap-2"><Settings2 className="w-4 h-4" />Generation settings</button>
        <button type="button" disabled={busy} onClick={() => void action(async () => { await load(); toast.success("Inbox refreshed"); })} className="text-sm text-muted-foreground inline-flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
        <button type="button" disabled={busy} onClick={() => void action(checkOwnerAccess)}
          className="rounded-xl border border-border px-3 py-2 text-sm">Verify owner access (no publication)</button>
      </div>
      <AdminFreshness checkedAt={checkedAt} error={refreshError} />
      {ownerCheck && <p role="status" className="mb-4 text-sm text-muted-foreground">
        {ownerCheck === "verified" ? "Registered owner's current sign-in verified. No course, AI or publication state was changed." :
          "Owner access could not be verified. No course was published or generated."}
      </p>}
      {stale && <p role="status" className="text-sm text-amber-600 dark:text-amber-400 mb-4">This draft changed on the server. Your edits are preserved. Reopen the latest revision before saving or approving.</p>}
      {mode === "settings" && settings ? <CourseGenerationSettings onDirtyChange={setSettingsDirty}
        settings={settings} busy={busy} save={values => action(async () => { await call("configure", { settings: values }); await refreshAfterWrite(); toast.success("Generation settings saved."); })}
        generate={async () => { await action(async () => { const request = await call("generate"); await refreshAfterWrite(); toast.success(request ? "Generation queued. Refresh the inbox in a few minutes." : "No draft queued. Check setup, monthly slots and retry limits."); }); }} />
        : <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
          <aside className="space-y-3"><button type="button" disabled={busy} className="w-full rounded-xl border border-primary/30 text-primary py-3 text-sm" onClick={() => choose(null)}>+ Create a draft</button>
            {!drafts.length && <div className="rounded-2xl border border-border p-5 text-sm text-muted-foreground">Your draft inbox is empty. Set up the free API to receive monthly courses, or create a draft here.</div>}
            {drafts.map(d => <button disabled={busy} key={d.id} type="button" onClick={() => choose(d)} className={"w-full text-left rounded-2xl border p-4 space-y-2 " + (selected?.id === d.id ? "border-primary/50 bg-primary/5" : "border-border bg-card")}>
              <span className="block text-xs text-muted-foreground">{d.status === "draft" && d.published_revision > 0 ? "Changes awaiting approval" : d.status === "draft" ? "Awaiting review" : d.status}</span>
              <span className="block font-medium text-sm">{d.document.title || "Untitled course"}</span>
              <span className="block text-xs text-muted-foreground">{d.document.lessons.length} lessons · Revision {d.revision}</span></button>)}
          </aside>
          <section className="rounded-2xl border border-border p-5 sm:p-7 min-w-0">
            {!document ? <div className="py-16 text-center space-y-4"><BookOpen className="w-9 h-9 mx-auto text-primary" /><h2 className="text-xl font-semibold">Your editorial workspace</h2><p className="text-sm text-muted-foreground">Choose a draft to edit or preview. Courses become public only after your approval.</p></div>
              : <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{dirty ? "Unsaved changes" : selected ? "Saved · Revision " + selected.revision : "New draft"}</p>
                  <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setMode(mode === "preview" ? "edit" : "preview")} className="rounded-xl border border-border px-3 py-2 text-sm inline-flex items-center gap-2"><Eye className="w-4 h-4" />{mode === "preview" ? "Edit" : "Reader preview"}</button>
                    <button type="button" disabled={busy || stale || !dirty} onClick={() => void action(save)} className="rounded-xl bg-primary text-primary-foreground px-3 py-2 text-sm inline-flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" />Save draft</button></div></div>
                {selected?.research?.method && <details className="rounded-xl bg-muted/30 p-4 text-sm"><summary className="cursor-pointer">Research and checks · {selected.research.method}</summary>
                  <div className="mt-3 space-y-2 text-muted-foreground">{selected.research.demandNote && <p>{selected.research.demandNote}</p>}{selected.research.checks?.map((c, i) => <p key={i}>{c}</p>)}</div></details>}
                {mode === "preview" ? <CoursePreview document={document} /> : <fieldset disabled={busy}><CourseDraftEditor document={document} setDocument={value => { setDocument(value); setReviewed(false); }} published={(selected?.published_revision ?? 0) > 0} /></fieldset>}
                <section className="border-t border-border pt-6 space-y-4"><h2 className="font-semibold">Final approval</h2>
                  {errors.length > 0 && <details className="text-sm rounded-xl bg-muted/30 p-4"><summary className="cursor-pointer">{errors.length} items to resolve before approval</summary><ul className="mt-3 list-disc pl-5 space-y-2 text-muted-foreground">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></details>}
                  <label className="block text-sm space-y-2"><span className="text-muted-foreground">Reviewer name</span><input maxLength={80} disabled={busy} value={reviewer} onChange={e => setReviewer(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 w-full" /></label>
                  <label className="flex items-start gap-3 text-sm"><input type="checkbox" disabled={busy || dirty || stale} checked={reviewed} onChange={e => setReviewed(e.target.checked)} className="mt-1" />
                    <span>I have reviewed the sources, calculations, originality and lesson quality. Publishing also requires signing in with the registered owner account; the master key alone is insufficient. Edited drafts receive a fresh independent review before publication.</span></label>
                  <div className="flex flex-wrap gap-3"><button type="button" disabled={busy || dirty || stale || !selected || reviewer.trim().length < 2 || !reviewed || errors.length > 0 || selected.status === "rejected"}
                    onClick={() => void action(publish)} className="rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm inline-flex items-center gap-2 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" />Approve and publish</button>
                    {selected && <button type="button" disabled={busy || dirty || stale} onClick={() => {
                      if (dirty || !confirm("Reject this saved revision? Any existing published version will stay available. Save or discard unsaved edits first.")) return;
                      void action(async () => { await call("reject", { id: selected.id, revision: selected.revision }); const rows = await refreshAfterWrite(); const row = rows?.find(d => d.id === selected.id); if (row) { setSelected(row); setDocument(row.document); } setReviewed(false); toast.success("Draft rejected."); });
                    }} className="rounded-xl border border-border px-4 py-3 text-sm disabled:opacity-50">Reject draft</button>}
                    {selected?.published_revision > 0 && <Link to={"/courses/" + selected.document.slug} className="text-sm text-primary py-3" target="_blank">View published course →</Link>}
                  </div><p className="text-xs text-muted-foreground">Save your edits before approval. Approval publishes this saved revision and records your name and review date.</p>
                </section>
              </div>}
          </section>
        </div>}
    </main>}
  </>;
}
