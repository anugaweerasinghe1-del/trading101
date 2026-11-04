import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Reply = { reply: string; draftRequest: string | null };
export default function AdminChatPilot({ adminKey, onDraft }: { adminKey: string; onDraft: (draft: string) => void }) {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState<Reply | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const active = useRef(true);
  const pending = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (pending.current || message.trim().length < 10) return;
    pending.current = true;
    setBusy(true); setReply(null); setError('');
    try {
      const { data, error: remote } = await supabase.functions.invoke('admin-agent-chat', { body: { message: message.trim() }, headers: { 'x-admin-key': adminKey } });
      if (!active.current) return;
      if (remote || data?.error) {
        const context = (remote as { context?: { status?: number } } | null)?.context;
        const code = typeof data?.code === 'string' ? data.code : '';
        const status = typeof context?.status === 'number' ? context.status : 0;
        setError(code === 'DAILY_LIMIT' || status === 429
          ? 'The daily AI-chat attempt has been used or rate-limited. No automatic retry; check again after the next UTC day.'
          : code === 'PILOT_PAUSED' || status === 503
            ? 'The chat pilot is paused or its provider request failed. The free-tier configuration needs checking before an additional attempt; nothing changed.'
            : status === 401
              ? 'Administrator access was not verified. Lock this desk, then unlock with your current administrator key.'
              : 'Chat could not verify a response. Nothing changed. You can prepare a manual code request instead.');
        return;
      }
      if (data?.mode !== 'READ_ONLY_PILOT' || data?.claim !== 'UNVERIFIED_SUGGESTION' || data?.rootCauseVerified !== false || data?.historyAvailable !== false
        || !data.authorization || ['codeWrites', 'modelTools', 'merge', 'productionRelease'].some(k => data.authorization[k] !== false)
        || typeof data.reply !== 'string' || data.reply.length > 2400 || (data.draftRequest !== null && (typeof data.draftRequest !== 'string' || data.draftRequest.length > 1200))) throw Error('INVALID');
      setReply({ reply: data.reply, draftRequest: data.draftRequest });
    } catch { if (active.current) setError('The assistant response could not be validated. Nothing was changed.'); }
    finally { pending.current = false; if (active.current) setBusy(false); }
  }
  return <section className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6 space-y-4">
    <h2 className="text-xl font-semibold">Admin assistant · pilot</h2>
    <p className="text-sm text-muted-foreground">Ask for help drafting a narrow frontend change or planning an investigation. Suggestions are unverified; the assistant cannot change code or release anything.</p>
    <p className="text-xs text-muted-foreground">Initial pilot: one provider attempt per UTC day, including failed attempts. No automatic retries. Messages stay in this page's temporary memory and are sent to Gemini only when you submit. A successful reply is not proof that its claims are correct; verify before implementing.</p>
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm space-y-2"><span>Website question or change description</span>
        <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={1200} rows={4} required minLength={10} placeholder="Help me write a request to improve the About page spacing on mobile." className="w-full rounded-xl border border-border bg-background p-3" />
      </label>
      <p className="text-xs text-muted-foreground">Use general website descriptions. Do not include keys, passwords, contact details, private logs or account records.</p>
      <button type="submit" disabled={busy || message.trim().length < 10} className="rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm disabled:opacity-50">{busy ? 'Preparing a suggestion…' : 'Ask assistant'}</button>
    </form>
    {error && <p role="alert" className="text-sm text-amber-500">{error}</p>}
    {reply && <div role="status" aria-live="polite" className="rounded-xl border border-border p-4 space-y-3">
      <strong className="text-sm">Unverified suggestion</strong><p className="whitespace-pre-wrap text-sm">{reply.reply}</p>
      {reply.draftRequest && <><p className="text-xs text-muted-foreground">Review this draft before opening a public GitHub request.</p><p className="whitespace-pre-wrap text-sm">{reply.draftRequest}</p><button type="button" className="text-sm text-primary hover:underline" onClick={() => onDraft(reply.draftRequest!)}>Use as request draft</button></>}
    </div>}
  </section>;
}
