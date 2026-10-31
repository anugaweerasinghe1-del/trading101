import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/** Opt-in is explicit; a confirmation email is required before delivery. */
export function NewsletterSignup({ prominent = false }: { prominent?: boolean }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !consent) return;
    setBusy(true); setNotice("");
    try {
      const { data, error } = await supabase.functions.invoke("newsletter-public", {
        body: { action: "subscribe", email: email.trim(), consent, honeypot },
      });
      if (error || data?.error) throw new Error(data?.error || "Unable to sign up right now.");
      setNotice(data?.message || "Check your inbox for a confirmation email.");
      setEmail("");
      setConsent(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Please try again later.");
    } finally { setBusy(false); }
  };
  return (
    <section aria-label="Free weekly newsletter" className={prominent
      ? "rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.10] via-card to-card p-7 md:p-10"
      : "rounded-2xl border border-white/10 bg-white/[0.03] p-6"}>
      <div className="flex gap-2 items-center text-primary text-xs uppercase font-semibold tracking-[0.18em]">
        <Mail className="h-4 w-4"/> TradeHQ Weekly
      </div>
      <h2 className="mt-3 text-2xl font-semibold text-foreground">
        Understand money, one useful idea at a time.
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        A free, original, beginner-friendly financial lesson each week. Real examples,
        simple explanations, no trading jargon or hype. No account required.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <label htmlFor={prominent ? "newsletter-main-email" : "newsletter-footer-email"} className="sr-only">Your email address</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input id={prominent ? "newsletter-main-email" : "newsletter-footer-email"}
            type="email" autoComplete="email" required maxLength={254} value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="Your email address"
            className="min-w-0 w-full flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60" />
          <button type="submit" disabled={busy || !consent}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {busy ? "Submitting…" : "Subscribe free"} <ArrowRight className="h-4 w-4"/>
          </button>
        </div>
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
          <label>Leave blank<input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e=>setHoneypot(e.target.value)}/></label>
        </div>
        <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required
            className="mt-0.5 accent-primary" />
          <span>I agree to receive the free TradeHQ Weekly newsletter. I'll confirm my email and can unsubscribe anytime. See the <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.</span>
        </label>
        {notice && <p role="status" aria-live="polite" className="text-sm text-foreground">{notice}</p>}
      </form>
      <p className="mt-4 text-xs text-muted-foreground">One educational email per week after editorial review. No promotions or account needed.</p>
      {!prominent && <Link to="/contact" className="mt-3 inline-block text-xs text-primary hover:underline">Contact TradeHQ</Link>}
    </section>
  );
}
