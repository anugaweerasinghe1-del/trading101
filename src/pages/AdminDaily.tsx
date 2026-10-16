import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PracticeEditor } from '@/components/daily/PracticeEditor';
import { GenerationReadiness } from '@/components/daily/GenerationReadiness';
import { PracticeReviewSummary } from '@/components/daily/PracticeReviewSummary';
import type { DailyGenerationStatus } from '@/lib/dailyGenerationStatus';
import { PracticeVisual } from '@/components/DailyPractice';
import { validateBatch, validateExercises, type DailyBatch } from '../../supabase/functions/_shared/dailyPractice';
interface Draft {
  id: string; status: string; revision: number; document: DailyBatch;
  research?: {
    method?: string; model?: string; generatedAt?: string; checks?: string[];
    usage?: { inputTokens?: number | null; outputTokens?: number | null; totalTokens?: number | null } | null;
  };
}
type Status = DailyGenerationStatus;
const button = 'rounded-xl border border-white/15 px-4 py-2 text-sm disabled:opacity-40';
export default function AdminDaily() {
  const [key, setKey] = useState(''), [unlocked, setUnlocked] = useState(false), [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Draft[]>([]), [status, setStatus] = useState<Status | null>(null);
  const [selected, setSelected] = useState<Draft | null>(null), [doc, setDoc] = useState<DailyBatch | null>(null);
  const [index, setIndex] = useState(0), [preview, setPreview] = useState(false), [reviewed, setReviewed] = useState(false), [reviewer, setReviewer] = useState('');
  const [filter, setFilter] = useState('all');
  const exercisePanel = useRef<HTMLElement>(null);
  const pending = useRef(false), dirty = !!doc && JSON.stringify(doc) !== JSON.stringify(selected?.document);
  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke('admin-courses', { body: { action: 'daily-' + action, ...payload }, headers: { 'x-admin-key': key } });
    if (error || data?.error) throw new Error(data?.error ?? 'Could not connect. Check your master key and retry.');
    return data.data;
  }, [key]);
  const load = useCallback(async () => {
    const [drafts, settings] = await Promise.all([call('list'), call('status')]);
    if (!Array.isArray(drafts) || !settings) throw new Error('Could not load Daily administration.');
    setRows(drafts); setStatus(settings); return drafts as Draft[];
  }, [call]);
  const run = async (work: () => Promise<void>) => {
    if (pending.current) return; pending.current = true; setBusy(true);
    try { await work(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not complete action.'); }
    finally { pending.current = false; setBusy(false); }
  };
  useEffect(() => {
    if (!unlocked) return;
    const timer = window.setInterval(() => { if (!pending.current && document.visibilityState !== 'hidden') void load().catch(() => {}); }, 60000);
    return () => window.clearInterval(timer);
  }, [unlocked, load]);
  useEffect(() => {
    if (!dirty) return; const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const choose = (row: Draft) => {
    if (dirty && !confirm('Discard your unsaved edits?')) return;
    setSelected(row); setDoc(structuredClone(row.document)); setIndex(0); setReviewed(false);
  };
  const updateRow = async (action: string) => {
    if (!doc || !selected) return;
    const row = await call(action, { id: selected.id, revision: selected.revision, document: doc, reviewer: reviewer.trim(), reviewed }) as Draft;
    setSelected(row); setDoc(structuredClone(row.document)); setReviewed(false); await load();
    toast.success(action === 'publish' ? 'Approved snapshot saved. It becomes available on its start date.' : action === 'reject' ? 'Draft rejected. Existing approved practice continues.' : 'Private draft saved. Approval is required for edited content.');
  };
  const errors = doc ? validateExercises(doc.exercises) : [], e = doc?.exercises[index];
  return <main className="min-h-screen bg-background text-foreground px-5 py-10"><Helmet><title>Daily Practice Administration | TradeHQ</title><meta name="robots" content="noindex, nofollow" /></Helmet><div className="max-w-6xl mx-auto space-y-6">
    <header className="flex flex-wrap justify-between gap-4"><div><h1 className="text-2xl font-bold">Daily practice</h1><p className="text-sm text-muted-foreground mt-1">50 deeper exercises · a new private bank every two months</p></div><nav className="flex gap-4 text-sm"><Link to="/admin" className="text-primary">Dashboard</Link><Link to="/admin/courses" className="text-primary">Courses</Link><Link to="/admin/reviews" className="text-primary">Reviews</Link>{unlocked && <button onClick={() => { if (dirty && !confirm('Discard unsaved edits and lock?')) return; setKey(''); setUnlocked(false); setDoc(null); setSelected(null); setRows([]); setStatus(null); }}>Lock</button>}</nav></header>
    {!unlocked ? <form className="max-w-md border border-white/10 rounded-2xl p-6 space-y-4" onSubmit={ev => { ev.preventDefault(); void run(async () => { const drafts = await load(); setUnlocked(true); if (drafts[0]) choose(drafts[0]); }); }}>
      <label className="block text-sm">Admin master key<input required type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} className="mt-2 w-full bg-background rounded-xl border border-white/15 p-3" /></label><button disabled={busy} className={button}>Unlock</button>
    </form> : <>
      {status && <section className="border border-white/10 rounded-2xl p-5 space-y-3"><div className="flex flex-wrap justify-between gap-4"><h2 className="font-semibold">Generation schedule</h2><button disabled={busy} className={button} onClick={() => void run(async () => { setStatus(await call('configure', { enabled: !status.enabled })); })}>{status.enabled ? 'Pause generation' : 'Enable generation'}</button></div>
        <p className="text-sm text-muted-foreground leading-relaxed">{status.enabled ? 'Enabled' : 'Paused'} · next bank starts {status.nextDue}. Preparation begins {status.prepareAfter}. Daily checks run at 09:15 Sri Lanka time. Each case has ten scored questions and a final takeaway. One standard Gemini request writes ten cases; five successful parts make a bank. Completed months use no AI requests.</p>
        <GenerationReadiness status={status} busy={busy} onGenerate={() => void run(async () => { const queued = await call('generate'); await load(); toast.message(queued ? 'Next part queued. Refresh in about two minutes.' : 'Nothing queued: another request, cooldown or attempt cap is active.'); })} onRefresh={() => void run(async () => { await load(); })} />
      </section>}
      <div className="grid md:grid-cols-[230px_1fr] gap-6"><aside className="space-y-2"><h2 className="text-sm font-semibold mb-3">Banks</h2>
        <label className="block text-sm pb-2">Show banks<select className="block mt-2 w-full bg-background rounded-xl border border-white/15 p-3" value={filter} onChange={event => setFilter(event.target.value)}>{[['all', 'All'], ['draft', 'Awaiting review'], ['published', 'Approved'], ['rejected', 'Rejected']].map(([value, label]) => <option key={value} value={value}>{label} ({rows.filter(row => value === 'all' || row.status === value).length})</option>)}</select></label>
        {rows.filter(row => filter === 'all' || row.status === filter).map(row => <button key={row.id} className={`w-full text-left rounded-xl border p-3 ${selected?.id === row.id ? 'border-primary/40 bg-primary/5' : 'border-white/10'}`} onClick={() => choose(row)}><span className="block text-sm">{row.document.effectiveFrom}</span><span className="text-xs text-muted-foreground">{row.status === 'draft' ? 'Awaiting review' : row.status === 'published' ? 'Approved' : row.status} · revision {row.revision}</span></button>)}
        {!rows.some(row => filter === 'all' || row.status === filter) && <p className="text-sm text-muted-foreground py-3">No banks in this view. Previously approved practice stays available.</p>}</aside>
      {doc && e && <section className="min-w-0 space-y-5">
        <PracticeReviewSummary exercises={doc.exercises} onInspect={exerciseIndex => { setIndex(exerciseIndex); setPreview(true); requestAnimationFrame(() => { exercisePanel.current?.scrollIntoView({ block: 'start' }); exercisePanel.current?.focus({ preventScroll: true }); }); }} />
        {selected?.research && (selected.research.model || selected.research.usage || selected.research.checks?.length) ? <aside aria-label="Daily generation provenance" className="rounded-xl border border-white/10 bg-card/50 p-4 space-y-2 text-xs text-muted-foreground">
          <h2 className="font-semibold text-sm text-foreground">Generation evidence for editorial review</h2>
          {selected.research.model && <p>Recorded model: {selected.research.model}</p>}
          {selected.research.usage && <p>Provider-reported tokens for the final successful 10-case part only: input {selected.research.usage.inputTokens ?? 'not reported'} · output {selected.research.usage.outputTokens ?? 'not reported'} · total {selected.research.usage.totalTokens ?? 'not reported'}.</p>}
          {selected.research.usage && <p>These counts are not the five-part cycle total, live remaining quota, or proof of free-tier eligibility.</p>}
          {selected.research.checks?.length ? <ul className="list-disc pl-5 space-y-1" aria-label="Generator checks, not owner approval">{selected.research.checks.map((check, i) => <li key={i}>{check}</li>)}</ul> : null}
        </aside> : null}
        <section ref={exercisePanel} tabIndex={-1} aria-label="Exercise review" className="space-y-5 scroll-mt-5"><div className="flex flex-wrap gap-3 items-end"><label className="text-sm">Start date<input type="date" value={doc.effectiveFrom} className="block mt-2 p-2 rounded-lg border border-white/15 bg-background" onChange={v => { setDoc({ ...doc, effectiveFrom: v.target.value }); setReviewed(false); }} /></label><button className={button} onClick={() => setPreview(!preview)}>{preview ? 'Edit exercise' : 'Preview exercise'}</button></div>
        <label className="block text-sm">Exercise<select className="block mt-2 w-full bg-background rounded-xl border border-white/15 p-3" value={index} onChange={v => setIndex(Number(v.target.value))}>{doc.exercises.map((ex, i) => <option value={i} key={ex.id}>{i + 1}. {ex.title}</option>)}</select></label>
        {preview ? <article className="rounded-2xl border border-white/10 p-5 space-y-4"><h2 className="text-xl font-bold">{e.title}</h2><p className="text-sm leading-relaxed">{e.scenario}</p><PracticeVisual exercise={e} />{e.questions.map((q, i) => <div key={i} className="border-t border-white/10 pt-4 space-y-2"><h3 className="font-medium text-sm">{i + 1}. {q.prompt}</h3><ul className="space-y-1 text-sm">{q.options.map((o, n) => <li key={n} className={n === q.correctAnswer ? 'text-primary' : 'text-muted-foreground'}>{n + 1}. {o}{n === q.correctAnswer ? ' — correct' : ''}</li>)}</ul><p className="text-sm leading-relaxed text-muted-foreground">{q.explanation}</p></div>)}<h3 className="font-medium text-sm">{e.reflection}</h3><p className="text-sm text-muted-foreground leading-relaxed">{e.reflectionGuide}</p>{e.sources.map(s => <a key={s.url} className="block text-primary text-xs underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>)}</article>
          : <PracticeEditor exercise={e} onChange={value => { setDoc({ ...doc, exercises: doc.exercises.map((old, i) => i === index ? value : old) }); setReviewed(false); }} />}
        </section>
        <footer className="rounded-2xl border border-white/15 p-5 space-y-4"><p className="text-xs text-muted-foreground">{selected?.research?.method ?? 'AI-assisted draft'} · Saving edits keeps them private. The previous approved snapshot stays public until you approve this revision. Review every exercise, calculation, source and answer before approving.</p>
          {errors.length > 0 && <p role="alert" className="text-sm text-amber-400">{errors.slice(0, 3).join(' ')}</p>}
          <button className={button} disabled={busy || !dirty || !validateBatch(doc)} onClick={() => void run(() => updateRow('save'))}>Save private edits</button>
          <label className="block text-sm">Reviewer name<input value={reviewer} maxLength={80} onChange={v => setReviewer(v.target.value)} className="mt-2 block w-full rounded-xl border border-white/15 p-3 bg-background" /></label>
          <label className="flex gap-3 text-sm leading-relaxed"><input type="checkbox" checked={reviewed} onChange={v => setReviewed(v.target.checked)} className="mt-1" /><span>I reviewed all 50 exercises for originality, factual accuracy, calculations, answers and teaching quality.</span></label>
          <div className="flex flex-wrap gap-3"><button className={`${button} bg-primary text-primary-foreground`} disabled={busy || dirty || !reviewed || reviewer.trim().length < 2 || !validateBatch(doc) || selected?.status === 'rejected'} onClick={() => void run(() => updateRow('publish'))}>Approve this bank</button><button className={button} disabled={busy || dirty || selected?.status === 'rejected'} onClick={() => void run(() => updateRow('reject'))}>Reject private draft</button></div>
          {dirty && <p className="text-xs text-amber-400">Save your edits before approving.</p>}
        </footer>
      </section>}</div>
    </>}
  </div></main>;
}
