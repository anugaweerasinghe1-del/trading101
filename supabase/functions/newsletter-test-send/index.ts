import { createClient } from "npm:@supabase/supabase-js@2.75.1";
import { allow, clientIp } from "../_shared/rateLimit.ts";

// Test ONLY. No bulk mail, no legacy subscribers, no arbitrary recipient.
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type, x-admin-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers });
const emailOk = (s: string | undefined): s is string =>
  Boolean(s && /^[A-Za-z0-9.!#$%&'*+/=?^_\x60{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(s) && s.length <= 254);
function secretMatches(expected: string | undefined, supplied: string | null): boolean {
  if (!expected || !supplied || expected.length !== supplied.length) return false;
  let delta = 0;
  for (let i = 0; i < expected.length; i++) delta |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return delta === 0;
}
const htmlEscape = (x: string) => x
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#39;");

function inlineMarkdown(value: string): string {
  // Escaping happens first: saved markdown cannot inject arbitrary HTML.
  let s = htmlEscape(value);
  s = s.replace(/\[([^\]\n]{1,160})\]\((https:\/\/[^\s)<>]{1,500})\)/g,
    (_, title: string, href: string) => {
      const safe = /^https:\/\/[a-z0-9.-]+\//i.test(href);
      return safe ? '<a href="' + href.replaceAll("&", "&amp;") +
        '" style="color:#60a5fa;text-decoration:underline">' + title + "</a>" : title;
    });
  s = s.replace(/\*\*([^*\n]{1,300})\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(?<!\*)\*([^*\n]{1,300})\*(?!\*)/g, "<em>$1</em>");
  return s;
}
function mailHtml(subject: string, preheader: string, markdown: string): string {
  const fragments = markdown.split(/\r?\n/).map(line => {
    const value = line.trim();
    if (!value) return "";
    if (value.startsWith("# ")) return '<h1 style="font-size:26px;line-height:1.3;margin:28px 0 14px">' + inlineMarkdown(value.slice(2)) + "</h1>";
    if (value.startsWith("## ")) return '<h2 style="font-size:19px;line-height:1.4;margin:25px 0 12px">' + inlineMarkdown(value.slice(3)) + "</h2>";
    if (/^\|/.test(value)) return '<div style="font-family:monospace;font-size:12px;overflow-wrap:anywhere">' + inlineMarkdown(value) + "</div>";
    if (/^[-*] /.test(value)) return '<p style="margin:8px 0 8px 18px">• ' + inlineMarkdown(value.slice(2)) + "</p>";
    return '<p style="margin:0 0 16px">' + inlineMarkdown(value) + "</p>";
  }).join("\n");
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
  '<body style="margin:0;padding:24px;background:#0b0d12;color:#e5e7eb;font-family:Arial,Helvetica,sans-serif">' +
  '<div style="max-width:640px;margin:auto;background:#141820;border:1px solid #303746;border-radius:16px;padding:30px">' +
  '<div style="font-size:12px;letter-spacing:3px;color:#aab5c6;margin-bottom:20px">TRADEHQ / TEST PREVIEW</div>' +
  '<p style="font-size:13px;color:#aab5c6">' + htmlEscape(preheader) + '</p>' +
  '<div style="font-size:15px;line-height:1.7">' + fragments + '</div>' +
  '<div style="border-top:1px solid #303746;padding-top:20px;font-size:12px;color:#aab5c6">' +
  'Internal test for the owner only. This does not subscribe anyone or send a live campaign. ' +
  'Financial examples are educational, not personal investment advice.</div></div></body></html>';
}
function settings() {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("NEWSLETTER_FROM_EMAIL")?.trim();
  const to = Deno.env.get("NEWSLETTER_TEST_TO_EMAIL")?.trim();
  return {
    configured: Boolean(apiKey && emailOk(from) && emailOk(to)),
    provider: "Resend",
    senderConfigured: emailOk(from),
    testInboxConfigured: emailOk(to),
    apiKeyConfigured: Boolean(apiKey),
    testInbox: emailOk(to) ? to : null,
    subscriberPublishingEnabled: false,
  };
}
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    if (!(await allow("newsletter-test-global", "newsletter-test", 60, 10)) ||
        !(await allow("newsletter-test-ip:" + clientIp(req), "newsletter-test-ip", 60, 6))) {
      return reply({ error: "Too many test requests" }, 429);
    }
    const masterKey = Deno.env.get("ADMIN_MASTER_KEY");
    if (!masterKey) return reply({ error: "Newsletter admin key is not configured" }, 503);
    if (!secretMatches(masterKey, req.headers.get("x-admin-key")))
      return reply({ error: "Incorrect TradeHQ admin master key" }, 401);

    let input: Record<string, unknown>;
    try {
      const raw = await req.text();
      if (raw.length > 2000) return reply({ error: "Request too large" }, 413);
      input = JSON.parse(raw);
    } catch { return reply({ error: "Invalid JSON" }, 400); }
    const action = input.action;
    if (action === "status") {
      const { data, error } = await db.from("newsletter_test_deliveries")
        .select("edition_id,edition_revision,test_to,status,provider_id,error_code,created_at")
        .order("created_at", { ascending: false }).limit(8);
      if (error) return reply({ error: "Private test ledger is unavailable" }, 503);
      return reply({ data: { ...settings(), recent: data ?? [] } });
    }
    if (action !== "send-test") return reply({ error: "Unknown action" }, 400);

    const configuration = settings();
    if (!configuration.configured)
      return reply({ error: "Resend test sender is not configured: add RESEND_API_KEY, NEWSLETTER_FROM_EMAIL, and NEWSLETTER_TEST_TO_EMAIL in Supabase Edge Function secrets. No mail was sent.", code: "NOT_CONFIGURED" }, 503);
    const id = input.editionId;
    const revision = input.revision;
    if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id) ||
        !Number.isInteger(revision) || Number(revision) < 1)
      return reply({ error: "Invalid edition identifier or revision" }, 400);
    const { data: edition, error: editionError } = await db.from("newsletter_editions")
      .select("id,revision,status,subject,preheader,body_markdown")
      .eq("id", id).eq("revision", revision).eq("status", "approved").maybeSingle();
    if (editionError || !edition)
      return reply({ error: "Only an unchanged, approved edition can be tested" }, 409);

    // Unique revision prevents concurrency and accidental double-click sends.
    const recipient = Deno.env.get("NEWSLETTER_TEST_TO_EMAIL")!.trim();
    const { data: reserved, error: insertError } = await db.from("newsletter_test_deliveries")
      .insert({ edition_id: edition.id, edition_revision: edition.revision, test_to: recipient, status: "pending" })
      .select("id").single();
    if (insertError || !reserved) {
      if (insertError?.code === "23505") {
        const { data: previous } = await db.from("newsletter_test_deliveries")
          .select("status,provider_id,error_code,created_at")
          .eq("edition_id", edition.id).eq("edition_revision", edition.revision).maybeSingle();
        return reply({ data: { duplicatePrevented: true, previous, note: "An email test was already attempted for this exact approved revision. This request sent nothing." } });
      }
      return reply({ error: "Could not reserve a unique email test. Nothing was sent." }, 503);
    }
    const sendId = reserved.id;
    let status: "accepted" | "rejected" | "unknown" = "unknown";
    let providerId: string | null = null;
    let errorCode: string | null = null;
    try {
      const payload = {
        from: "TradeHQ <" + Deno.env.get("NEWSLETTER_FROM_EMAIL")!.trim() + ">",
        to: [recipient],
        subject: "[TEST] " + edition.subject,
        html: mailHtml(edition.subject, edition.preheader, edition.body_markdown),
        text: "TRADEHQ / TEST PREVIEW\n\n" + edition.preheader + "\n\n" + edition.body_markdown +
          "\n\nInternal test only. This is not a subscription or a live newsletter.",
      };
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + Deno.env.get("RESEND_API_KEY"),
          "Content-Type": "application/json",
          "Idempotency-Key": "tradehq-newsletter-test-" + edition.id + "-" + edition.revision,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) {
        const json = await response.json().catch(() => ({})) as { id?: string };
        if (!json.id) { status = "unknown"; errorCode = "missing_provider_receipt"; }
        else { status = "accepted"; providerId = json.id; }
      } else {
        status = "rejected";
        errorCode = "provider_http_" + response.status;
      }
    } catch {
      // Timeout/network error may mean provider accepted a message; never auto-retry.
      status = "unknown";
      errorCode = "network_or_provider_outcome_unknown";
    }
    const { error: recordError } = await db.from("newsletter_test_deliveries")
      .update({ status, provider_id: providerId, error_code: errorCode, updated_at: new Date().toISOString() })
      .eq("id", sendId).eq("status", "pending");
    if (recordError) return reply({ data: { status, providerId, note: "Provider result returned; ledger update could not be confirmed." } }, 202);
    return reply({ data: { status, providerId, errorCode, testInbox: recipient,
      note: status === "accepted"
        ? "Resend accepted the test request. Check the inbox and spam folder; API acceptance does not confirm delivery."
        : status === "rejected"
        ? "The provider rejected this test. No subscriber email was attempted."
        : "The outcome is unknown. Check Resend logs and inbox before trying a newer revision." } });
  } catch {
    return reply({ error: "Newsletter test service temporarily unavailable" }, 503);
  }
});