import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { starterPracticeBank } from '@/lib/dailyPracticeBank';
import { DAILY_PROGRESS_EVENT } from '@/lib/dailyChallenge';
import { acknowledgeDailyMistakes, hasReviewedDailyMistakes } from '@/lib/dailyPracticeReviewReceipt';
import { newPractice, readPractice, readPracticeHistory, savePractice, savedPracticeComplete, upgradePractice } from '@/lib/dailyPracticeProgress';
import { practiceDate, validateBatch, type DailyBatch, type DailyExercise } from '../../supabase/functions/_shared/dailyPractice';

export function PracticeVisual({ exercise }: { exercise: DailyExercise }) {
  const max = Math.max(1, ...exercise.visual.bars.map(b => b.value));
  return <figure className="rounded-2xl border border-border/70 bg-card/80 p-4 my-6">
    <figcaption className="text-xs text-muted-foreground mb-4">{exercise.visual.caption} · {exercise.visual.unit}</figcaption>
    <div className="space-y-3">{exercise.visual.bars.map((b, i) => <div key={i}>
      <div className="flex justify-between gap-4 text-sm mb-1"><span>{b.label}</span><span className="font-mono tabular-nums">{b.value.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span></div>
      <div aria-hidden="true" className="h-2 rounded-full bg-white/5"><div className="h-2 rounded-full bg-primary/60" style={{ width: `${b.value / max * 100}%` }} /></div>
    </div>)}</div>
  </figure>;
}
export function DailyPractice({ date, reviewMissed = false, open, onOpen, onClose, onComplete }: { date: string; reviewMissed?: boolean; open: boolean; onOpen: () => void; onClose: () => void; onComplete: () => void }) {
  const [progress, setProgress] = useState(() => upgradePractice(readPractice(date) ?? newPractice(starterPracticeBank, date, readPracticeHistory(date)), starterPracticeBank));
  const [question, setQuestion] = useState(() => {
    const firstMiss = reviewMissed && progress.answers.length === progress.exercise.questions.length
      ? progress.answers.findIndex((answer, i) => answer !== progress.exercise.questions[i].correctAnswer)
      : -1;
    return firstMiss >= 0 ? firstMiss : Math.min(progress.answers.length, progress.exercise.questions.length - 1);
  });
  const [pick, setPick] = useState<number | null>(null), [storageOk, setStorageOk] = useState(true);
  const [reviewAcknowledged, setReviewAcknowledged] = useState(() => hasReviewedDailyMistakes(progress));
  const heading = useRef<HTMLHeadingElement>(null);
  const ownedProgress = useRef(progress); ownedProgress.current = progress;
  const { data: bank } = useQuery({ queryKey: ['daily-practice-bank', date], staleTime: 300000,
    queryFn: async (): Promise<DailyBatch> => {
      const { data, error } = await (supabase.rpc as unknown as (name: string) => Promise<{ data: unknown; error: unknown }>)('get_daily_practice_bank');
      return error || !validateBatch(data) ? starterPracticeBank : data;
    }, retry: false,
  });
  useEffect(() => {
    const saved = readPractice(date), prev = ownedProgress.current;
    const owned = saved ?? (prev.date === date && prev.answers.length > 0 ? prev : newPractice(bank ?? starterPracticeBank, date, readPracticeHistory(date)));
    const next = upgradePractice(owned, bank ?? starterPracticeBank);
    if (next !== owned) { const stored = savePractice(next); setStorageOk(stored.saved); setProgress(stored.progress); }
    else setProgress(next);
    setReviewAcknowledged(hasReviewedDailyMistakes(next));
    setPick(null);
  }, [date, bank]);
  useEffect(() => {
    const sync = () => { const saved = readPractice(date); if (saved) { setProgress(upgradePractice(saved, bank ?? starterPracticeBank)); setReviewAcknowledged(hasReviewedDailyMistakes(saved)); setPick(null); } };
    window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
  }, [date, bank]);
  useEffect(() => {
    if (!reviewMissed || progress.answers.length !== progress.exercise.questions.length) return;
    const firstMiss = progress.answers.findIndex((answer, i) => answer !== progress.exercise.questions[i].correctAnswer);
    if (firstMiss >= 0) setQuestion(firstMiss);
  }, [reviewMissed, progress.date, progress.answers.length, progress.exercise.id]);
  useEffect(() => {
    if (open) { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); }
  }, [open]);
  const persist = (next: typeof progress) => { const result = savePractice(next); setStorageOk(result.saved); if (result.saved) setProgress(result.progress); return result; };
  const exercise = progress.exercise, answered = progress.answers.length, total = exercise.questions.length, done = answered === total;
  const index = Math.min(question, answered, total - 1), q = exercise.questions[index], reviewed = index < answered;
  const score = progress.answers.filter((a, i) => a === exercise.questions[i].correctAnswer).length;
  const move = (i: number) => { setQuestion(i); setPick(null); };
  const submit = () => {
    if (pick === null || reviewed || done || date !== practiceDate() || progress.date !== date) return;
    const saved = persist({ ...progress, answers: [...progress.answers, pick] });
    // Keep the selection and unfinished question available for a retry if storage fails.
    if (saved.saved) setPick(null);
    if (savedPracticeComplete(saved)) onComplete();
  };
  return <section id="deeper-practice" aria-labelledby="deeper-title" className="scroll-mt-24 rounded-[24px] border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-white/[0.02] p-6 md:p-8 mb-8">
    <div className="flex flex-wrap justify-between gap-3 mb-5"><p className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary"><BookOpen className="w-4 h-4" />Daily case study</p><span className="text-xs text-muted-foreground">{total === 10 ? '8–12 minutes' : 'Saved shorter attempt'} · {answered}/{total} reviewed</span></div>
    <h2 ref={heading} tabIndex={-1} id="deeper-title" className="scroll-mt-24 outline-none text-2xl md:text-3xl font-bold tracking-tight">{exercise.title}</h2>
    <p className="text-sm text-muted-foreground mt-2">{exercise.category} · {date}</p>
    {!open ? <div className="mt-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
      <p className="text-sm leading-relaxed text-foreground/70 max-w-xl">Work through a longer hypothetical case, test the follow-up situations and get feedback on every answer.</p>
      <button onClick={onOpen} aria-expanded={false} aria-controls="case-study-content" className="shrink-0 inline-flex justify-center items-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-3 font-semibold text-sm">{answered ? done ? 'Review case study' : 'Continue case study' : 'Start case study'}<ArrowRight className="w-4 h-4" /></button>
    </div> : <div id="case-study-content" className="mt-5">
      <div className="flex justify-between items-center gap-3 mb-4"><p className="text-xs text-muted-foreground">Read the case first. Use its assumptions; these are not live market prices.</p><button onClick={onClose} aria-expanded={true} aria-controls="case-study-content" className="text-xs text-muted-foreground inline-flex items-center gap-1 shrink-0">Close case<ChevronDown className="w-3 h-3" /></button></div>
      <details open className="rounded-2xl border border-border/70 px-4 py-3">
        <summary className="cursor-pointer font-medium text-sm">Case briefing and follow-up situation</summary>
        <div className="space-y-4 mt-4">{exercise.scenario.split('\n\n').map((p, i) => <p key={i} className="text-base leading-relaxed text-foreground/85">{p}</p>)}</div>
        <PracticeVisual exercise={exercise} />
      </details>
      <div className="my-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2"><span>Case progress</span><span>{answered} of {total} answers checked</span></div>
        <div role="progressbar" aria-label="Case progress" aria-valuenow={answered} aria-valuemin={0} aria-valuemax={total} className="h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${answered / total * 100}%` }} /></div>
      </div>
      <div key={`${exercise.id}-${index}`} className="rounded-2xl border border-border/70 p-4 md:p-6">
        <p className="text-xs text-primary mb-2">Question {index + 1} of {total} · {index < 3 ? 'Understand the starting case' : index < 7 ? 'Apply the follow-up' : 'Check the conclusions'}</p>
        <fieldset disabled={reviewed}><legend className="font-semibold leading-relaxed mb-4">{q.prompt === "How should a unresolved claim appear in a practice journal?" ? "How should an unresolved claim appear in a practice journal?" : q.prompt}</legend>
          <div className="space-y-2">{q.options.map((option, n) => <label key={n} className={`flex gap-3 items-start p-3 rounded-xl border ${reviewed ? '' : 'cursor-pointer'} ${reviewed && n === q.correctAnswer ? 'border-primary/50 bg-primary/10' : 'border-border/70 bg-muted/60'}`}>
            <input type="radio" name={`practice-${exercise.id}-${index}`} checked={reviewed ? progress.answers[index] === n : pick === n} onChange={() => setPick(n)} className="mt-1 accent-primary shrink-0" />
            <span className="text-sm leading-relaxed">{option}{reviewed && n === q.correctAnswer && <span className="block text-primary text-xs mt-1">Correct answer</span>}{reviewed && progress.answers[index] === n && n !== q.correctAnswer && <span className="block text-muted-foreground text-xs mt-1">Your answer</span>}</span>
          </label>)}</div>
        </fieldset>
        {reviewed ? <div role="status" className="mt-5 rounded-xl bg-white/[0.03] p-4"><p className="text-sm font-medium mb-2">{progress.answers[index] === q.correctAnswer ? 'That’s right.' : 'Here’s the reasoning.'}</p><p className="text-sm leading-relaxed text-muted-foreground">{q.explanation}</p></div>
          : <button onClick={submit} disabled={pick === null || progress.date !== date} className="mt-5 inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-40">Check answer<CheckCircle2 className="w-4 h-4" /></button>}
        <div className="flex justify-between gap-3 mt-5">
          <button onClick={() => move(index - 1)} disabled={index === 0} className="inline-flex items-center gap-2 text-sm text-muted-foreground disabled:opacity-30"><ArrowLeft className="w-4 h-4" />Previous</button>
          {reviewed && index < total - 1 && <button onClick={() => move(index + 1)} className="inline-flex items-center gap-2 text-primary font-semibold text-sm">Next question<ArrowRight className="w-4 h-4" /></button>}
        </div>
      </div>
      {done && <div className="mt-6 rounded-2xl bg-primary/[0.05] border border-primary/20 p-5 space-y-4">
        <p className="flex gap-2 items-center font-semibold text-primary" role="status"><CheckCircle2 className="w-5 h-5" />Case complete · {score}/{total} correct</p>
        <p className="text-sm text-muted-foreground">Your original answers stay recorded. Review the explanations for anything you missed; this is practice, not a trading qualification.</p>
        <nav aria-label="Review case answers" className="flex flex-wrap gap-2">{exercise.questions.map((item, i) => <button key={i} onClick={() => move(i)} aria-label={`Review question ${i + 1}: ${progress.answers[i] === item.correctAnswer ? 'correct' : 'needs review'}`} className={`w-9 h-9 rounded-lg text-sm border ${progress.answers[i] === item.correctAnswer ? 'border-primary/40 text-primary' : 'border-amber-400/40 text-amber-300'}`}>{i + 1}</button>)}</nav>
        {score < total && <div className="space-y-2 rounded-xl border border-border/70 p-4">
          <p className="text-sm text-muted-foreground">Use the numbered questions above to read the explanations you missed. When you are done, note the review so your next recommendation can move forward. This does not change your score.</p>
          {reviewAcknowledged ? <Link to="/learn" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">Review noted — return to Learn <ArrowRight className="h-4 w-4" /></Link>
            : <button type="button" className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => {
              if (acknowledgeDailyMistakes(progress)) {
                setReviewAcknowledged(true);
                window.dispatchEvent(new Event(DAILY_PROGRESS_EVENT));
              } else setStorageOk(false);
            }}>I've reviewed my missed answers</button>}
        </div>}
        <p className="text-sm font-medium">Case takeaway</p><p className="text-sm text-muted-foreground leading-relaxed">{exercise.reflectionGuide}</p>
      </div>}
      <div className="mt-6 border-t border-border/70 pt-4"><p className="text-xs text-muted-foreground">Further reading</p><ul className="mt-2 space-y-1">{exercise.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline underline-offset-4">{s.label}</a></li>)}</ul></div>
    </div>}
    <p className="text-xs leading-relaxed text-muted-foreground mt-5">50 reviewed cases. When you have saved earlier case-study mistakes on this browser, a new day can prioritize one of those topics; otherwise cases rotate by date. New banks require owner approval. Answers stay on this browser. {bank?.reviewer ? `Bank reviewed by ${bank.reviewer}.` : 'Authored starter bank.'}</p>
    {!storageOk && <p role="alert" className="text-xs text-amber-400 mt-2">Browser storage is unavailable. This attempt may not survive a refresh.</p>}
  </section>;
}
