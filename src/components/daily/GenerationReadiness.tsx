import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dailyGenerationReadiness, type DailyGenerationStatus } from '@/lib/dailyGenerationStatus';

export function GenerationReadiness({ status, busy, onGenerate, onRefresh }: {
  status: DailyGenerationStatus; busy: boolean; onGenerate: () => void; onRefresh: () => void;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 15000);
    window.addEventListener('focus', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);
  const readiness = dailyGenerationReadiness(status, now);
  const time = (value?: string | null) => value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString() : 'Not reported';
  const button = 'rounded-xl border border-white/15 px-4 py-2 text-sm disabled:opacity-40';
  const parts = Math.floor(status.completed / 10);
  const providerUnavailable = /HTTP 503/.test(status.lastError ?? '');
  return <div className="space-y-3">
    <p className="text-sm">{status.completed}/50 exercises saved · {parts}/5 parts completed · {status.attempts}/3 attempts for the current part · {status.model}</p>
    <p className="text-sm text-muted-foreground">Uses the free-tier key in <Link to="/admin/courses" className="text-primary underline">course settings</Link>. Each request prepares ten private exercises. Five successful parts create a draft for editorial review; generation does not publish it.</p>
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
      <div><dt className="text-muted-foreground">Last attempt started</dt><dd>{time(status.lastStarted)}</dd></div>
      <div><dt className="text-muted-foreground">Last attempt finished</dt><dd>{time(status.lastFinished)}</dd></div>
      {status.retryAfter && <div><dt className="text-muted-foreground">Retry after (your local time)</dt><dd>{time(status.retryAfter)}</dd></div>}
    </dl>
    {status.lastError && <div role="alert" className="text-amber-400 text-sm space-y-1"><p>{status.lastError}</p>{providerUnavailable && <p>The provider returned HTTP 503. This attempt did not produce a valid part; this response alone does not establish quota exhaustion.</p>}</div>}
    <p role="status" className="text-sm">{readiness.message}</p>
    <p className="text-xs text-muted-foreground">Keep billing disabled. Failed requests retain the server cooldown and saved parts. Existing approved practice remains available. There is no paid fallback or automatic retry from this page.</p>
    <div className="flex gap-3 flex-wrap"><button className={button} disabled={busy || !readiness.available} onClick={onGenerate}>Prepare next part now</button><button className={button} disabled={busy} onClick={onRefresh}>Refresh</button></div>
  </div>;
}
