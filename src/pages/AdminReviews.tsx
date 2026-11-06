import { Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, Trash2, Eye, EyeOff, Star, Save, MessageSquare, RotateCcw } from "lucide-react";

import { useAdminRefresh, useAdminRequestScope } from '@/hooks/useAdminRefresh';
import { isAdminRequestCancelled } from '@/lib/adminRequestScope';
import { AdminFreshness } from '@/components/admin/AdminFreshness';

interface Review {
  id: string;
  name: string | null;
  content: string;
  rating: number;
  is_visible: boolean;
  is_featured: boolean;
  created_at: string;
  owner_reply: string | null;
  owner_reply_updated_at: string | null;
  deleted_at: string | null;
}

export default function AdminReviews() {
  const [unlocked, setUnlocked] = useState(false);
  const [key, setKey] = useState("");
  const scope = useAdminRequestScope(key);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null), [refreshError, setRefreshError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const pending = useRef(new Set<string>());
  // A successful write is not undone by a failed list request. Keep its submitted
  // fields visible and prevent another mutation until the server list catches up.
  const confirmed = useRef(new Map<string, string>());
  const [awaitingRefresh, setAwaitingRefresh] = useState<string[]>([]);
  const [edits, setEdits] = useState<Record<string, Partial<Review>>>({});
  const hasUnsaved = Object.keys(edits).some(id => confirmed.current.get(id) !== "update") || Object.entries(replies).some(
    ([id, value]) => confirmed.current.get(id) !== "reply" && value !== (reviews.find(review => review.id === id)?.owner_reply ?? "")
  );
  useEffect(() => {
    if (!unlocked || !hasUnsaved) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unlocked, hasUnsaved]);

  const lockAdmin = () => {
    if (hasUnsaved && !window.confirm("Discard unsaved moderation changes and public replies?")) return;
    scope.invalidate();
    pending.current.clear(); confirmed.current.clear(); setAwaitingRefresh([]);
    setBusy({}); setVerifying(false); setLoading(false); setCheckedAt(null); setRefreshError("");
    setUnlocked(false); setKey(""); setReviews([]); setEdits({}); setReplies({});
  };

  const load = useCallback(async (silent = false): Promise<boolean> => {
    const guard = scope.capture(key, 'reviews');
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-reviews", {
        body: { action: "list" }, headers: { "x-admin-key": key },
      });
      guard.assert();
      if (error || data?.error || !Array.isArray(data?.data)) throw new Error("Could not load reviews. Check your master key and retry.");
      setReviews(data.data); setCheckedAt(new Date()); setRefreshError("");
      const settled = new Map(confirmed.current);
      setEdits(prev => {
        const next = { ...prev };
        for (const [id, action] of settled) if (action === "update") delete next[id];
        return next;
      });
      setReplies(prev => {
        const next = { ...prev };
        for (const [id, action] of settled) if (action === "reply") delete next[id];
        return next;
      });
      confirmed.current.clear(); setAwaitingRefresh([]);
      return true;
    } catch (error) {
      if (guard.current() && !isAdminRequestCancelled(error)) {
        setRefreshError('Could not refresh reviews.');
        if (!silent) toast.error(error instanceof Error ? error.message : 'Could not load reviews');
      }
      return false;
    } finally { if (guard.current()) setLoading(false); }
  }, [key, scope]);
  useAdminRefresh(unlocked, async () => { await load(true); }, { paused: () => pending.current.size > 0 });

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifying) return; const guard = scope.capture(key); setVerifying(true);
    try { if (await load()) { guard.assert(); setUnlocked(true); } }
    finally { if (guard.current()) setVerifying(false); }
  };

  const patchField = (id: string, patch: Partial<Review>) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const mutate = async (id: string, action: string, payload: Record<string, unknown> = {}) => {
    if (pending.current.has(id) || confirmed.current.has(id)) return;
    const guard = scope.capture(key);
    // A list started before this write must not overwrite its confirmed outcome.
    scope.capture(key, 'reviews');
    setLoading(false);
    pending.current.add(id);
    setBusy(prev => ({ ...prev, [id]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("admin-reviews", {
        body: { action, id, ...payload }, headers: { "x-admin-key": key },
      });
      guard.assert();
      if (error || data?.error || data?.ok !== true) throw new Error(data?.error || "Could not save changes. Please retry.");
      toast.success(action === "delete" ? "Review deleted from public view" : action === "restore" ? "Review restored" : "Saved");
      confirmed.current.set(id, action);
      setAwaitingRefresh([...confirmed.current.keys()]);
      await load();
    } catch (error) {
      if (guard.current() && !isAdminRequestCancelled(error)) toast.error(error instanceof Error ? error.message : "Could not save changes");
    } finally {
      pending.current.delete(id);
      if (guard.current()) setBusy(prev => ({ ...prev, [id]: false }));
    }
  };

  const remove = (id: string) => {
    if (confirm("Delete this review from public view? You can restore it here later.")) void mutate(id, "delete");
  };

  if (!unlocked) {
    return (
      <>
        <Helmet>
          <title>Admin Reviews — TradeHQ</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <form onSubmit={verify} className="w-full max-w-sm space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
            <Link to="/admin" className="block text-sm text-primary mb-4">← Admin dashboard</Link>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold">Admin Reviews</h1>
            </div>
            <input
              disabled={verifying}
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              aria-label="Master key"
              autoComplete="off"
              placeholder="Master Key"
              className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm"
            />
            <button
              type="submit"
              disabled={verifying || !key.trim()}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
            >
              {verifying ? "Verifying…" : "Unlock"}
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Reviews — TradeHQ</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold">Reviews ({reviews.length})</h1>
            <button type="button" onClick={lockAdmin} disabled={Object.values(busy).some(Boolean)} className="text-sm underline">Lock admin panel</button>
          </div>
          <p className="text-sm text-muted-foreground">Replies are public and labelled as yours. Deleted reviews stay here so you can restore them.</p>
          {hasUnsaved && <p role="status" className="text-sm text-amber-600 dark:text-amber-400">You have unsaved review changes or a public reply. Save them before leaving or locking this desk.</p>}
          <button type="button" disabled={loading || Object.values(busy).some(Boolean)} className="text-sm underline" onClick={() => void load()}>Refresh reviews</button>
          <AdminFreshness checkedAt={checkedAt} error={refreshError} />
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {reviews.map((r) => {
            const e = edits[r.id] ?? {};
            const merged = { ...r, ...e };
            return (
              <fieldset disabled={!!busy[r.id] || awaitingRefresh.includes(r.id)} key={r.id} className="p-4 rounded-xl border border-border bg-white/[0.02] space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(r.created_at).toLocaleString()}</span>
                  <span className="font-mono">{r.id.slice(0, 8)}</span>
                </div>
                {r.deleted_at && <p className="text-sm text-destructive">Deleted from public view</p>}
                <fieldset disabled={!!r.deleted_at} className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    value={merged.name ?? ""}
                    onChange={(ev) => patchField(r.id, { name: ev.target.value })}
                    aria-label="Review author name"
                    maxLength={60}
                    placeholder="(anonymous)"
                    className="h-9 px-3 rounded-lg bg-input border border-border text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Rating</label>
                    <input
                      aria-label="Review rating"
                      type="number"
                      min={1}
                      max={5}
                      value={merged.rating}
                      onChange={(ev) => patchField(r.id, { rating: Number(ev.target.value) })}
                      className="w-16 h-9 px-2 rounded-lg bg-input border border-border text-sm"
                    />
                    <Star className="w-4 h-4 text-yellow-400" />
                  </div>
                </div>
                <textarea
                  aria-label="Review content"
                  maxLength={1000}
                  value={merged.content}
                  onChange={(ev) => patchField(r.id, { content: ev.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm resize-y"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => patchField(r.id, { is_visible: !merged.is_visible })}
                    className={`text-xs px-3 py-1.5 rounded-lg border ${merged.is_visible ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}
                  >
                    {merged.is_visible ? <><Eye className="w-3 h-3 inline mr-1" />Visible</> : <><EyeOff className="w-3 h-3 inline mr-1" />Hidden</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => patchField(r.id, { is_featured: !merged.is_featured })}
                    className={`text-xs px-3 py-1.5 rounded-lg border ${merged.is_featured ? "bg-yellow-400/10 text-yellow-500 border-yellow-400/30" : "bg-muted text-muted-foreground border-border"}`}
                  >
                    {merged.is_featured ? "★ Featured" : "☆ Feature"}
                  </button>
                  <button
                    type="button"
                    disabled={!edits[r.id] || !!busy[r.id]}
                    onClick={() => void mutate(r.id, "update", { patch: edits[r.id] })}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 ml-auto"
                  >
                    <Save className="w-3 h-3 inline mr-1" />
                    Save
                  </button>
                </div>
                <div className="space-y-2 border-t border-border pt-3">
                  <label htmlFor={`reply-${r.id}`} className="text-sm font-medium flex items-center gap-2"><MessageSquare className="h-4 w-4" />Your public reply</label>
                  <textarea id={`reply-${r.id}`} value={replies[r.id] ?? r.owner_reply ?? ""} onChange={ev => setReplies(prev => ({ ...prev, [r.id]: ev.target.value }))} maxLength={2000} rows={3} className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm resize-y" placeholder="Reply as the TradeHQ owner…" />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{(replies[r.id] ?? r.owner_reply ?? "").length}/2000 · Clear the text and save to remove your reply.</span>
                    <button type="button" disabled={replies[r.id] === undefined || replies[r.id] === (r.owner_reply ?? "")} onClick={() => void mutate(r.id, "reply", { reply: replies[r.id] })} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40">Save reply</button>
                  </div>
                </div>
                </fieldset>
                <div className="flex justify-end">
                  {r.deleted_at ? <button type="button" onClick={() => void mutate(r.id, "restore")} className="text-xs px-3 py-1.5 rounded-lg border border-border"><RotateCcw className="w-3 h-3 inline mr-1" />Restore review</button> : <button type="button" onClick={() => remove(r.id)} className="text-xs px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/30"><Trash2 className="w-3 h-3 inline mr-1" />Delete review</button>}
                </div>
                {awaitingRefresh.includes(r.id) && <p role="status" className="text-sm text-amber-600 dark:text-amber-400">Saved on the server; refresh reviews before making another change to this review.</p>}
                {busy[r.id] && <p className="text-xs text-muted-foreground" role="status">Saving…</p>}
              </fieldset>
            );
          })}
        </div>
      </div>
    </>
  );
}
