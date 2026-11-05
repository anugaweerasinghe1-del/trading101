import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(path, "utf8");
const publicApi = read("supabase/functions/newsletter-public/index.ts");
const publisher = read("supabase/functions/newsletter-dispatch/index.ts");
const webhook = read("supabase/functions/newsletter-provider-events/index.ts");
const migration = read("supabase/migrations/20261031142000_public_newsletter_contacts_and_receipts.sql");
const form = read("src/components/NewsletterSignup.tsx");
const ui = read("src/pages/AdminNewsletter.tsx");
const app = read("src/App.tsx");
const privacy = read("src/lib/privacyCopy.ts");
for (const action of ["subscribe","confirm","unsubscribe"]) assert.match(publicApi,new RegExp('"'+action+'"'));
assert.match(publicApi,/confirmation_token_hash/);
assert.match(publicApi,/confirmation_expires_at/);
assert.match(publicApi,/consent!==true/);
assert.match(publicApi,/honeypot/);
assert.match(publicApi,/confirmation_sent_at/);
assert.match(publicApi,/subscribe-email/);
assert.match(publicApi,/Daily email confirmation limit/);
assert.match(publicApi,/List-Unsubscribe/);
assert.doesNotMatch(publicApi,/from\("subscribers"\)/);
assert.match(migration,/ENABLE ROW LEVEL SECURITY/g);
assert.match(migration,/UNIQUE\(edition_id,contact_id\)/);
assert.match(migration,/CONSTRAINT newsletter_contact_email_unique UNIQUE\(email\)/);
assert.match(migration,/REVOKE ALL ON public.newsletter_contacts FROM PUBLIC, anon, authenticated/);
assert.match(publisher,/ADMIN_MASTER_KEY/);
assert.match(publisher,/RESEND_WEBHOOK_SECRET/);
assert.match(publisher,/List-Unsubscribe-Post/);
// Outbound branding must match the public TradeHQ Newsletter name, not the
// legacy "TradeHQ Weekly" title. Cadence can still be weekly.
assert.match(publicApi, /Confirm your TradeHQ Newsletter subscription/);
assert.match(publicApi, /Please confirm that you requested TradeHQ Newsletter/);
assert.match(publisher, /TRADEHQ NEWSLETTER/);
assert.match(publisher, /You subscribed to TradeHQ Newsletter/);
assert.doesNotMatch(publicApi, /TradeHQ Weekly/);
assert.doesNotMatch(publisher, /TradeHQ Weekly|TRADEHQ WEEKLY/);
assert.match(publisher,/Idempotency-Key/);
assert.match(publisher,/eq\("status","confirmed"\)/);
assert.match(publisher,/60-\(today.count/);
assert.match(publisher,/2000-\(monthly.count/);
assert.match(publisher,/UNIQUE/ .test(migration) ? /newsletter_deliveries/ : /DOES_NOT_MATCH/);
assert.doesNotMatch(publisher,/from\("subscribers"\)|newsletter_test_deliveries/);
assert.match(webhook,/svix-signature/);
assert.match(webhook,/crypto.subtle.sign/);
assert.match(webhook,/email.complained/);
assert.match(webhook,/status:safeState/);
assert.match(form,/consent/);
assert.match(form,/newsletter-public/);
assert.match(form,/type="checkbox"/);
assert.match(app,/path="\/newsletter\/confirm"/);
assert.match(app,/path="\/newsletter\/unsubscribe"/);
assert.match(ui,/Publish approved issue to subscribers/);
assert.doesNotMatch(ui,/Send test to my inbox/);
assert.match(privacy,/TradeHQ Newsletter/);
const page = read("src/pages/NewsletterPage.tsx");
const navigation = read("src/components/Navigation.tsx");
assert.match(navigation,/to: "\/newsletter", label: "Newsletter"/);
assert.match(page,/TradeHQ Newsletter<\/h1>/, "The public newsletter page should have the formal Newsletter heading.");
assert.match(form,/free weekly TradeHQ Newsletter/, "Opt-in copy clearly states frequency and brand.");
for (const path of ["/newsletter", "/newsletter/confirm", "/newsletter/unsubscribe"]) {
  const html = read("dist" + path + "/index.html");
  const noindex = path !== "/newsletter";
  assert.equal(/name="robots" content="noindex/.test(html), noindex,
    "Public newsletter indexable, token action URLs noindex: " + path);
  assert.ok(html.includes('href="https://www.thetradehq.com' + path + '"'),
    "Static newsletter path must have its own canonical: " + path);
  assert.ok(html.includes('<h1>'), "Static route must present a heading to no-JS visitors: " + path);
}
assert.match(page, /onClick={execute}/, "Subscription actions must require an explicit click.");

console.log("PASS public confirmed-only newsletter, unsubscribe, owner publishing limits, signed bounce handling and privacy");
