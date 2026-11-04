import { useEffect, useRef } from 'react';
import { createAdminRequestScope, isAdminRequestCancelled } from '@/lib/adminRequestScope';

export function useAdminRequestScope(key: string) {
  const scope = useRef<ReturnType<typeof createAdminRequestScope>>();
  if (!scope.current) scope.current = createAdminRequestScope();
  scope.current.setKey(key);
  useEffect(() => { scope.current!.activate(); return () => scope.current!.dispose(); }, []);
  return scope.current;
}

/** Refresh visible, online desks; coalesce focus/reconnect/timer events.
 * Background reads never perform editorial mutations or approval actions. */
export function useAdminRefresh(enabled: boolean, refresh: () => Promise<unknown>, options: {
  intervalMs?: number; minGapMs?: number; paused?: () => boolean; onError?: (error: unknown) => void;
} = {}) {
  const latest = useRef({ refresh, options });
  latest.current = { refresh, options };
  const intervalMs = options.intervalMs ?? 60_000;
  useEffect(() => {
    if (!enabled) return;
    let active = true, running = false, lastAttempt = latest.current.options.minGapMs ? Date.now() : 0;
    const check = async () => {
      if (!active || running || document.hidden || navigator.onLine === false ||
          latest.current.options.paused?.() || Date.now() - lastAttempt < (latest.current.options.minGapMs ?? 1000)) return;
      running = true; lastAttempt = Date.now();
      try { await latest.current.refresh(); }
      catch (error) { if (active && !isAdminRequestCancelled(error)) latest.current.options.onError?.(error); }
      finally { running = false; }
    };
    const resume = () => { void check(); };
    const timer = window.setInterval(resume, intervalMs);
    window.addEventListener('focus', resume);
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      active = false; clearInterval(timer);
      window.removeEventListener('focus', resume);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [enabled, intervalMs]);
}
