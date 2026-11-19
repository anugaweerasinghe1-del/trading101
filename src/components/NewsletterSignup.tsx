import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/** Visitor consent is explicit. No contact becomes subscribed until verified. */
export function NewsletterSignup({ prominent = false }: { prominent?: boolean }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "verify" | "done">("email");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const inputId = prominent ? "newsletter-main-email" : "newsletter-footer-email";
  const codeId = prominent ? "newsletter-main-code" : "newsletter-footer-code";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !consent || step !== "email") return;
    setBusy(true); setNotice("");
    try {
      const { data, error } = await supabase.functions.invoke("newsletter-public", {
        body: { action: "subscribe", email: email.trim(), consent, honeypot },
      });
      if (error || data?.error) throw new Error(data?.error || "Unable to sign up right now.");
      setEmail(email.trim().toLowerCase());
      setCode("");
      setStep("verify");
      setNotice(data?.message || "Check your inbox for the six-digit confirmation code.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Please try again later.");
    } finally { setBusy(false); }
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || step !== "verify" || !/^[0-9]{6}$/.test(code)) return;
    setBusy(true); setNotice("");
    try {
      const { data, error } = await supabase.functions.invoke("newsletter-public", {
        body: { action: "confirm-code", email, code },
      });
      if (error || data?.error) throw new Error(data?.error || "Unable to verify right now.");
      if (!data?.confirmed) {
        setNotice(data?.message || "This code is invalid or expired. Please check your email.");
        return;
      }
      setStep("done");
      setCode("");
      setNotice(data?.message || "You're subscribed! Welcome to TradeHQ Newsletter.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Please try again later.");
    } finally { setBusy(false); }
  };

  const reset = () => {
    setStep("email");
    setCode("");
    setConsent(false);
    setNotice("");
  };

  return (
    <section aria-label="Free weekly newsletter" className={prominent
      ? "rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.10] via-card to-card p-5 sm:p-7 md:p-10"
      : "rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"}>
      <div className="flex gap-2 items-center text-primary text-xs uppercase font-semibold tracking-[0.18em]">
        <Mail className="h-4 w-4" aria-hidden="true" /> TradeHQ Newsletter
      </div>
      <h2 className="mt-3 text-2xl font-semibold text-foreground">
        {step === "verify" ? "One quick step. Check your inbox." :
          step === "done" ? "You're on the list." :
          "Understand money, one useful idea at a time."}
      </h2>
      {step === "email" && <>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          A free, original, beginner-friendly financial lesson each week. Real examples,
          simple explanations, no trading jargon or hype. No account required.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <label htmlFor={inputId} className="sr-only">Your email address</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input id={inputId}
              type="email" autoComplete="email" required maxLength={254} value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              className="min-w-0 w-full flex-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60" />
            <button type="submit" disabled={busy || !consent}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {busy ? "Sending code…" : "Subscribe free"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
            <label>Leave blank<input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e=>setHoneypot(e.target.value)}/></label>
          </div>
          <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required
              className="mt-0.5 accent-primary" />
            <span>I agree to receive the free weekly TradeHQ Newsletter. I'll confirm my email and can unsubscribe anytime. See the <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.</span>
          </label>
        </form>
      </>}

      {step === "verify" && <>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We sent a six-digit code to <strong className="break-all font-medium text-foreground">{email}</strong> if this address is eligible.
          Paste it below to confirm your subscription. No account or password needed.
        </p>
        <form onSubmit={verifyCode} className="mt-5 space-y-3">
          <label htmlFor={codeId} className="block text-sm font-medium text-foreground">Email verification code</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input id={codeId} type="text" inputMode="numeric" autoComplete="one-time-code"
              pattern="[0-9]{6}" maxLength={6} required value={code}
              onChange={e => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              placeholder="000000" aria-describedby={codeId + "-hint"}
              className="min-w-0 w-full flex-1 rounded-xl border border-border bg-background px-4 py-3 text-center text-xl tracking-[0.2em] font-semibold tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60" />
            <button type="submit" disabled={busy || code.length !== 6}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {busy ? "Checking…" : "Confirm subscription"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p id={codeId + "-hint"} className="text-xs text-muted-foreground">
            Code valid for 20 minutes. You can also click the confirmation link in your email.
            Check spam if you can't find it.
          </p>
        </form>
        <button type="button" onClick={reset} className="mt-3 min-h-11 text-sm text-primary underline underline-offset-4 hover:text-foreground">
          Change email or request another code
        </button>
        <p className="text-xs text-muted-foreground">To limit spam, another code can be sent after 15 minutes.</p>
      </>}

      {step === "done" && <div className="mt-5 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/10 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm text-foreground">Email confirmed. Your weekly financial lessons are on their way after editorial approval. You can unsubscribe at any time.</p>
      </div>}
      {notice && <p role="status" aria-live="polite" className="mt-3 text-sm text-foreground">{notice}</p>}
      <p className="mt-4 text-xs text-muted-foreground">One educational email per week after editorial review. No promotions or account needed.</p>
      {!prominent && <Link to="/contact" className="mt-3 inline-block text-xs text-primary hover:underline">Contact TradeHQ</Link>}
    </section>
  );
}
