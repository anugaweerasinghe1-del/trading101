import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export interface EditorialQueueRow { id: string; status: string }
interface DailySnapshot {
  enabled?: boolean; attempts?: number; retryAfter?: string | null; lastError?: string | null;
  freeConfirmed?: boolean; hasApiKey?: boolean;
}
export function AutomationInbox({ courses, dailyBanks, daily, failedCourseRuns, findingCount, proposalCount, githubAvailable }: {
  courses: EditorialQueueRow[] | null; dailyBanks: EditorialQueueRow[] | null;
  daily: DailySnapshot | null; failedCourseRuns: number;
  findingCount: number; proposalCount: number; githubAvailable: boolean;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60000); return () => window.clearInterval(timer); }, []);
  const items: { title: string; detail: string; to: string; priority: number }[] = [];
  if (!githubAvailable) items.push({ title: 'Agent findings and code queue unavailable', detail: 'Read GitHub history before assuming that no investigation or code review is waiting.', to: '#monitor-findings', priority: 0 });
  else {
    if (findingCount) items.push({ title: `${findingCount} open monitoring finding${findingCount === 1 ? '' : 's'}`, detail: 'Inspect the evidence and investigate the cause before requesting a repair.', to: '#monitor-findings', priority: 0 });
    if (proposalCount) items.push({ title: `${proposalCount} open AI code proposal${proposalCount === 1 ? '' : 's'}`, detail: 'Check the proposed commit, tests and recorded owner decision. An open PR may already have a review.', to: '/admin/ai', priority: 1 });
  }
  for (const [rows, name, to] of [[courses, 'Course', '/admin/courses'], [dailyBanks, 'Daily bank', '/admin/daily']] as const) {
    if (rows === null) items.push({ title: `${name} review queue unavailable`, detail: 'This queue could not be loaded. Open its desk to check; an unavailable count is not zero.', to, priority: 0 });
    else {
      const count = rows.filter(row => row.status === 'draft').length;
      if (count) items.push({ title: `${count} ${name.toLowerCase()} draft${count === 1 ? '' : 's'} awaiting review`, detail: 'Saved drafts stay private until an administrator reviews and approves them.', to, priority: 1 });
    }
  }
  if (failedCourseRuns) items.push({ title: `${failedCourseRuns} course generation failure${failedCourseRuns === 1 ? '' : 's'}`, detail: 'Inspect the recorded failure and remaining attempts in course settings. Existing published courses remain available.', to: '/admin/courses', priority: 0 });
  if (!daily) items.push({ title: 'Daily generation status unavailable', detail: 'Check the Daily desk before requesting generation.', to: '/admin/daily', priority: 0 });
  else {
    const retry = daily.retryAfter ? Date.parse(daily.retryAfter) : NaN;
    const detail = daily.attempts !== undefined && daily.attempts >= 3
      ? 'The three-attempt limit is reached. Approved practice continues; no automatic budget reset is available here.'
      : daily.enabled === false ? 'Generation is paused. Review the schedule and provider setup in the Daily desk.'
        : daily.hasApiKey === false || daily.freeConfirmed === false ? 'Complete free-tier setup in course settings before generation.'
          : Number.isFinite(retry) && retry > now
            ? `Cooldown ends ${new Date(retry).toLocaleString()}. Do not retry early; confirm provider allowance before a later request.`
            : daily.lastError ? 'A provider or generation failure was recorded. Inspect its cause and allowance before another request.' : '';
    if (detail) items.push({ title: 'Daily generation needs attention', detail, to: '/admin/daily', priority: 0 });
  }
  items.sort((a, b) => a.priority - b.priority);
  return <section aria-label="Automation work queue" className="rounded-2xl border border-border bg-card/60 p-5 space-y-4">
    <div><h2 className="font-semibold">Needs your attention</h2><p className="text-xs text-muted-foreground mt-1">Based on the latest dashboard reads. Opening a desk does not approve, retry, publish or repair anything.</p></div>
    {items.length ? <ul className="grid gap-3 md:grid-cols-2">{items.map(item => <li key={item.title} className="rounded-xl border border-border p-4 space-y-2"><h3 className="font-medium text-sm">{item.title}</h3><p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
      {item.to.startsWith('#') ? <button type="button" className="text-sm text-primary hover:underline" onClick={() => { const panel = document.getElementById(item.to.slice(1)); panel?.scrollIntoView({ block: 'start' }); panel?.focus({ preventScroll: true }); }}>Inspect monitoring evidence ↓</button>
        : <Link to={item.to} className="text-sm text-primary hover:underline">Open {item.to.endsWith('daily') ? 'Daily desk' : item.to.endsWith('courses') ? 'course desk' : 'AI workspace'} →</Link>}
    </li>)}</ul>
      : <p className="text-sm text-muted-foreground">No pending items were returned by the loaded queues. This is not a production health or release approval.</p>}
  </section>;
}
