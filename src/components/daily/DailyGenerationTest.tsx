import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRequestScope } from '@/hooks/useAdminRefresh';
import { isAdminRequestCancelled } from '@/lib/adminRequestScope';
import { adminFailureDetails, courseAdminError } from '@/lib/adminFunctionError';
import { validProbeDiagnostics } from '../../../supabase/functions/_shared/dailyProbeDiagnostics';
import type { DailyProbeResult } from '../../../supabase/functions/_shared/dailyPracticeProbe';
export function DailyGenerationTest({ masterKey, disabled, onBusyChange }: { masterKey: string; disabled: boolean; onBusyChange: (busy: boolean) => void }) {
  const scope = useAdminRequestScope(masterKey);
  const pending = useRef(false);
  const [confirmed, setConfirmed] = useState(false), [spent, setSpent] = useState(false);
  const [result, setResult] = useState<DailyProbeResult | null>(null), [error, setError] = useState('');
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (event !== 'SIGNED_OUT') return;
      scope.invalidate(); pending.current = false; setConfirmed(false); setSpent(false); setResult(null); setError(''); onBusyChange(false);
    });
    return () => data.subscription.unsubscribe();
  }, [scope, onBusyChange]);
  const run = async () => {
    if (pending.current || !confirmed || spent || disabled || !window.confirm('Make one real Gemini request using the saved free-tier Gemini 3.5 Flash Lite key? The result is discarded after validation. No bank, draft, attempt counter or publication will be changed. There is no automatic retry.')) return;
    pending.current = true;
    const guard = scope.capture(masterKey);
    setSpent(true); setResult(null); setError(''); onBusyChange(true);
    try {
      const { data: auth, error: authError } = await supabase.auth.getSession(); guard.assert();
      if (authError || !auth.session?.access_token) throw Error('Sign in with the registered owner account before testing.');
      const { data, error } = await supabase.functions.invoke('daily-practice-test', {
        headers: { 'x-admin-key': masterKey, authorization: 'Bearer ' + auth.session.access_token }, body: { confirmFreeTier: true },
      });
      guard.assert();
      if (error || data?.error) {
        const details = await adminFailureDetails(error, data);
        if (details.code === 'TEST_ALLOWANCE_USED') throw Error('The one-test allowance is already used for this UTC day. Do not retry before the next UTC day.');
        if (details.code === 'TEST_CONFIG_REQUIRED') throw Error('Check saved course settings: verified free Gemini 3.5 Flash Lite is required.');
        throw Error(await courseAdminError(error, data));
      }
      const value = data?.data as DailyProbeResult;
      if (value?.diagnostics !== undefined && !validProbeDiagnostics(value.diagnostics)) throw Error('The private test diagnostic metadata could not be verified.');
      if (!value || !['passed', 'failed'].includes(value.outcome) || value.productionCycleChanged !== false || value.published !== false || value.saved !== false ||
        typeof value.providerGenerationAttempted !== 'boolean' || value.model !== 'gemini-3.5-flash-lite' || value.outcome === 'passed' && (!value.providerGenerationAttempted || value.exercises !== 10 || value.questions !== 100))
        throw Error('The private test result could not be verified. Do not retry blindly.');
      setResult(value);
    } catch (failure) {
      if (guard.current() && !isAdminRequestCancelled(failure)) setError(failure instanceof Error ? failure.message : 'The private test could not be confirmed.');
    } finally { if (guard.current()) { pending.current = false; onBusyChange(false); } }
  };
  return <section aria-label="Private Daily generation test" className="rounded-2xl border border-border p-5 space-y-3">
    <h2 className="font-semibold">Private generation test</h2>
    <p className="text-sm text-muted-foreground">One real Gemini 3.5 Flash Lite request validates ten exercises and discards the content. It does not reset the production cycle, save drafts or publish. Passing checks structure and sources; factual and editorial quality still require review.</p>
    <p className="text-sm text-muted-foreground">Limit: one test per UTC day across all callers, including failed or unconfirmed tests. Request size is capped at 120,000 bytes and output at 32,768 tokens. Shared project quota still applies. No paid fallback or automatic retry.</p>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={confirmed} disabled={disabled || spent} onChange={event => setConfirmed(event.target.checked)} />I reviewed the saved key’s project: Free tier, billing disabled, with quota available for one request.</label>
    <button type="button" disabled={disabled || spent || !confirmed} onClick={() => void run()} className="rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-40">Run one private generation test</button>
    {result && <p role="status" className="text-sm">{result.outcome === 'passed'
      ? 'Private test passed: 10 exercises and 100 questions validated. Content discarded; production cycle and published bank unchanged.'
      : 'Private test failed: ' + result.code + (result.httpStatus ? ' (HTTP ' + result.httpStatus + ')' : '') + (result.field ? ' · ' + result.field : '') + '. Production cycle unchanged. No automatic retry.'}
      {' '}{result.providerGenerationAttempted ? 'One Gemini generation request was attempted.' : 'No Gemini generation request was attempted.'}</p>}
    {result?.outcome === 'passed' && result.diagnostics?.structure && result.diagnostics.structure.exerciseCount > 10 &&
      <p className="text-sm text-muted-foreground">Gemini returned {result.diagnostics.structure.exerciseCount} exercises; the first two in each supported category were selected and all 100 questions validated. The {result.diagnostics.structure.exerciseCount - 10} surplus exercises were discarded. Factual accuracy and case-plan fit still need editorial review.</p>}
    {result?.diagnostics && <aside aria-label="Private test diagnostics" className="space-y-1 text-xs text-muted-foreground">
      {result.diagnostics.validation && <p>Validation: {result.diagnostics.validation.stage}{result.diagnostics.validation.rules.length ? ' · ' + result.diagnostics.validation.rules.join(', ') : ''}{result.diagnostics.validation.exercise ? ' · exercise ' + result.diagnostics.validation.exercise : ''}{result.diagnostics.validation.question ? ', question ' + result.diagnostics.validation.question : ''}.</p>}
      {result.diagnostics.provider && <p>Provider finish: {result.diagnostics.provider.finishReason} · output tokens: {result.diagnostics.provider.outputTokens ?? 'not reported'}. These are this test’s metadata, not remaining quota or factual-accuracy evidence.</p>}
      {result.diagnostics.structure && <p>Received exercises: {result.diagnostics.structure.exerciseCount} · question counts: {result.diagnostics.structure.questionCounts.map(n => n ?? '?').join(', ')} · shortest explanation: {result.diagnostics.structure.minExplanationChars ?? 'not reported'} characters. Generated text was discarded.</p>}
    </aside>}
    {error && <p role="alert" className="text-sm text-destructive">{error} The result is unconfirmed; no automatic retry was made.</p>}
  </section>;
}
