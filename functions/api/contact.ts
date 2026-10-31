/**
 * Optional direct contact delivery for Cloudflare Pages.
 * Fail closed without Resend + Turnstile configuration; no public email relay.
 * No messages saved to TradeHQ's database or application logs.
 */
type Env = {
  RESEND_API_KEY?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_TURNSTILE_SITE_KEY?: string;
  CONTACT_TURNSTILE_SECRET?: string;
};
type Context = { request: Request; env: Env };

const NO_STORE = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, private",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
};
const respond = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: NO_STORE });

const deployedDomain = (url: URL) =>
  url.protocol === "https:" &&
  (url.hostname === "www.thetradehq.com" || url.hostname === "thetradehq.com");

const ready = (env: Env) =>
  Boolean(
    env.RESEND_API_KEY &&
    env.CONTACT_FROM_EMAIL &&
    env.CONTACT_TO_EMAIL &&
    env.CONTACT_TURNSTILE_SITE_KEY &&
    env.CONTACT_TURNSTILE_SECRET
  );

const saneEmail = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= 255 &&
  /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);

export async function onRequestGet({ request, env }: Context): Promise<Response> {
  return respond({
    enabled: deployedDomain(new URL(request.url)) && ready(env),
    siteKey: deployedDomain(new URL(request.url)) && ready(env)
      ? env.CONTACT_TURNSTILE_SITE_KEY
      : null,
  });
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const url = new URL(request.url);
  if (!deployedDomain(url) || !ready(env)) {
    return respond({ sent: false, error: "Direct submission is unavailable. Use the email or copy options." }, 503);
  }
  // Browsers send Origin on cross-site POSTs. Refuse requests without an
  // exact matching Origin; do not allow browser cross-origin writes.
  if (request.headers.get("Origin") !== url.origin) {
    return respond({ sent: false, error: "Request origin not accepted." }, 403);
  }
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return respond({ sent: false, error: "JSON request required." }, 415);
  }
  let payload: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 8000) return respond({ sent: false, error: "Message too large." }, 413);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return respond({ sent: false, error: "Invalid form." }, 400);
    payload = parsed as Record<string, unknown>;
  } catch {
    return respond({ sent: false, error: "Invalid form." }, 400);
  }
  const { name, email, subject, message, website, turnstileToken } = payload;
  if (
    (website !== undefined && website !== "") ||
    typeof name !== "string" || name.trim().length < 1 || name.length > 100 ||
    !saneEmail(email) ||
    typeof subject !== "string" || subject.trim().length < 3 || subject.length > 150 ||
    typeof message !== "string" || message.trim().length < 10 || message.length > 2000 ||
    typeof turnstileToken !== "string" || turnstileToken.length < 1 || turnstileToken.length > 2048
  ) return respond({ sent: false, error: "Invalid form or challenge." }, 400);
  if (!saneEmail(env.CONTACT_FROM_EMAIL) || !saneEmail(env.CONTACT_TO_EMAIL)) {
    return respond({ sent: false, error: "Contact service unavailable." }, 503);
  }

  try {
    const verification = new URLSearchParams({
      secret: env.CONTACT_TURNSTILE_SECRET!,
      response: turnstileToken,
    });
    const ip = request.headers.get("CF-Connecting-IP");
    if (ip) verification.set("remoteip", ip);
    const validation = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verification,
      signal: AbortSignal.timeout(9000),
    });
    if (!validation.ok) return respond({ sent: false, error: "Challenge validation unavailable." }, 503);
    const result = await validation.json() as { success?: boolean; hostname?: string; action?: string };
    if (!result.success || result.hostname !== url.hostname || result.action !== "contact") {
      return respond({ sent: false, error: "Security challenge failed. Try again." }, 403);
    }
  } catch {
    return respond({ sent: false, error: "Challenge validation unavailable." }, 503);
  }

  const body = [
    "TradeHQ contact enquiry",
    "From: " + name.trim(),
    "Reply email: " + email.trim(),
    "Topic: " + subject.trim(),
    "",
    message.trim(),
  ].join("\n");
  try {
    const delivery = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: [email.trim()],
        subject: "[TradeHQ contact] " + subject.trim(),
        text: body,
      }),
      signal: AbortSignal.timeout(10000),
    });
    // Resend returns 200 OK with an accepted-message identifier. Never tell the
    // visitor a message was sent just because a request was attempted.
    if (!delivery.ok) {
      return respond({ sent: false, error: "Email delivery was not accepted. Use the email options instead." }, 502);
    }
    const receipt = await delivery.json() as { id?: string };
    if (!receipt.id) return respond({ sent: false, error: "Delivery not confirmed. Use the email options instead." }, 502);
    return respond({ sent: true, message: "Your message was accepted by the email delivery service." });
  } catch {
    return respond({ sent: false, error: "Delivery unavailable. Use the email options instead." }, 502);
  }
}
