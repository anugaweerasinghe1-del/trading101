import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/config';

type State = { stopped: boolean; generation: number; activeCandidates: number; checkedAt: Date };
export default function AdminRepairControls({ adminKey }: { adminKey: string }) {
  const [state, setState] = useState<State | null>(null);
  const [pending, setPending] = useState<'status' | 'stop' | null>(null);
  const [message, setMessage] = useState('Repair status has not been checked.');
  const active = useRef(false);
  const request = useRef<AbortController | null>(null);
  const requestAction = useRef<'status' | 'stop' | null>(null);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; request.current?.abort(); };
  }, []);
  async function run(action: 'status' | 'stop') {
    if (request.current) {
      if (action !== 'stop' || requestAction.current !== 'status') return;
      request.current.abort();
    }
    const controller = new AbortController(); request.current = controller;
    requestAction.current = action;
    setPending(action); setState(null); setMessage(action === 'stop' ? 'Requesting stop; awaiting confirmation.' : 'Checking repair status.');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const work = async () => {
        // This only retrieves the bearer token. The endpoint independently verifies
        // the owner with Auth.getUser and the separate admin master key.
        const { data, error } = await supabase.auth.getSession();
        if (controller.signal.aborted || !active.current) throw Error('CANCELED');
        if (error || !data.session?.access_token) throw Error('SIGN_IN');
        const response = await fetch(SUPABASE_URL + '/functions/v1/repair-owner-control', {
          method: 'POST', redirect: 'error', signal: controller.signal,
          headers: { 'Content-Type': 'application/json', apikey: SUPABASE_PUBLISHABLE_KEY,
            authorization: 'Bearer ' + data.session.access_token, 'x-admin-key': adminKey },
          body: JSON.stringify({ action }),
        });
        if (!response.ok) throw Error('UNAVAILABLE');
        const value = await response.json();
        const expected = action === 'stop' ? 'DURABLE_STOP_CONFIRMED' : 'CONTROL_STATUS';
        if (value?.code !== expected || value.mode !== 'OWNER_STOP_ONLY' || typeof value.stopped !== 'boolean'
          || !Number.isSafeInteger(value.generation) || value.generation < 0
          || !Number.isSafeInteger(value.activeCandidates) || value.activeCandidates < 0 || value.activeCandidates > 1
          || !value.authorization || Object.keys(value.authorization).sort().join('|') !== 'codeWrites|merge|modelCalls|productionRelease'
          || Object.values(value.authorization).some(x => x !== false)
          || (action === 'stop' && (!value.stopped || value.activeCandidates !== 0))) throw Error('UNVERIFIED');
        return { stopped: value.stopped, generation: value.generation, activeCandidates: value.activeCandidates, checkedAt: new Date() };
      };
      const value = await Promise.race([work(), new Promise<never>((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(Error('TIME')); }, 15000);
      })]);
      if (active.current && request.current === controller) {
        setState(value); setMessage(action === 'stop' ? 'Stop confirmed by the server.' : 'Status confirmed by the server.');
      }
    } catch (error) {
      if (active.current && request.current === controller) {
        setState(null); setMessage(error instanceof Error && error.message === 'SIGN_IN'
          ? 'Sign in with the registered owner account, then try again.'
          : 'Repair controls are unavailable or paused. A stop has not been confirmed. You can retry Stop repairs or check status.');
      }
    } finally {
      clearTimeout(timer);
      if (request.current === controller) {
        request.current = null; requestAction.current = null;
        if (active.current) setPending(null);
      }
    }
  }
  return <section className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6 space-y-3" aria-label="Repair controls">
    <h2 className="font-semibold">Repair controls</h2>
    <p className="text-sm text-muted-foreground">Use your owner sign-in and administrator key to check status or stop repairs. Starting repairs requires separate owner approval.</p>
    <p className="text-sm" role="status" aria-live="polite">{message}</p>
    {state && <p className="text-sm">{state.stopped ? 'Repairs are stopped.' : 'The control policy is open; this does not confirm a running repair.'} Active candidates: {state.activeCandidates}. Checked {state.checkedAt.toLocaleTimeString()}.</p>}
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={!!pending} onClick={() => void run('status')} className="rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-50">{pending === 'status' ? 'Checking status…' : 'Check repair status'}</button>
      <button type="button" disabled={pending === 'stop'} onClick={() => void run('stop')} className="rounded-xl border border-destructive/50 px-4 py-2 text-sm text-destructive disabled:opacity-50">{pending === 'stop' ? 'Stopping…' : 'Stop repairs'}</button>
      <Link to="/auth" className="text-sm text-primary self-center hover:underline">Owner sign-in</Link>
    </div>
  </section>;
}
