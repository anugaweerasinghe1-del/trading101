import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ContactValues = {
  name: string; email: string; subject: string; message: string; website: string;
};
type TurnstileApi = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    action: string;
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};
type TurnstileWindow = Window & { turnstile?: TurnstileApi };
type Config = { enabled?: boolean; siteKey?: string | null };

/**
 * Optional direct form path: hides itself until the backend confirms that
 * the owner has configured Resend and Cloudflare Turnstile on the real domain.
 * Mailto and copy options in Contact stay available in every case.
 */
export function DirectContactOption({
  values, validate,
}: { values: ContactValues; validate: () => boolean }) {
  const [siteKey, setSiteKey] = useState("");
  const [challenge, setChallenge] = useState("");
  const [sending, setSending] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/contact", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) return null;
        return await response.json() as Config;
      })
      .then(config => {
        if (!cancelled && config?.enabled && typeof config.siteKey === "string")
          setSiteKey(config.siteKey);
      })
      .catch(() => {/* keep email-app and copy fallback */});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!siteKey || !container.current) return;
    let cancelled = false;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (cancelled || !container.current) return;
      const api = (window as TurnstileWindow).turnstile;
      if (!api) return;
      widget.current = api.render(container.current, {
        sitekey: siteKey,
        action: "contact",
        callback: setChallenge,
        "expired-callback": () => setChallenge(""),
        "error-callback": () => setChallenge(""),
      });
    };
    document.head.appendChild(script);
    return () => {
      cancelled = true;
      const api = (window as TurnstileWindow).turnstile;
      if (api && widget.current) api.remove(widget.current);
      widget.current = null;
      script.remove();
    };
  }, [siteKey]);

  if (!siteKey) return null;

  const submitDirect = async () => {
    if (sending || !validate()) return;
    if (!challenge) {
      toast.error("Complete the security challenge before sending.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...values, turnstileToken: challenge }),
      });
      const result = await response.json() as { sent?: boolean; error?: string; message?: string };
      if (response.ok && result.sent) {
        toast.success("Message accepted by the email service. Thank you.");
      } else {
        toast.error(result.error || "Message not sent. Use the email or copy options.");
      }
    } catch {
      toast.error("Could not send. Use the email app or copy option instead.");
    } finally {
      setSending(false);
      setChallenge("");
      if (widget.current) (window as TurnstileWindow).turnstile?.reset(widget.current);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border p-4" aria-label="Optional direct message delivery">
      <p className="text-sm font-semibold">Send directly from this page</p>
      <p className="text-xs text-muted-foreground">
        This optional method uses Cloudflare Turnstile to prevent abuse and Resend to
        deliver your message to TradeHQ's email inbox. Your message and reply
        address are processed for delivery; the app does not save them in its database.
        The options above remain available without this method.
      </p>
      <div ref={container} aria-label="Cloudflare Turnstile security check" />
      <Button type="button" disabled={!challenge || sending} onClick={() => void submitDirect()}>
        {sending ? "Submitting…" : "Send directly"}
      </Button>
    </div>
  );
}
