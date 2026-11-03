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
const newsletter = read("src/pages/NewsletterPage.tsx");
const routeManifest = read("scripts/routes.ts");
const publicCopy = read("scripts/staticCopy.ts");
const cloudflare = read("scripts/prepare-cloudflare.mjs");
const vercel = JSON.parse(read("vercel.json"));

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
assert.match(privacy,/TradeHQ Weekly/);

// Public signup needs a real prerendered response; confirmation/unsubscribe
// must be valid, noindex client fallback URLs on BOTH hosting providers.
assert.match(routeManifest, /path: "\/newsletter"/);
assert.match(publicCopy, /"\/newsletter": \{/);
assert.match(newsletter, /<h1 className="text-4xl font-semibold mb-5">TradeHQ Newsletter<\/h1>/);
assert.doesNotMatch(newsletter, /TradeHQ Weekly/);
for (const path of ["/newsletter/confirm", "/newsletter/unsubscribe"]) {
  assert.ok(cloudflare.includes('"' + path + '"'), "Cloudflare Pages must route " + path);
  assert.ok(vercel.rewrites.some(item => item.source === path && item.destination === "/app-shell.html"), "Vercel must route " + path);
  assert.ok(app.includes('path="' + path + '"'), "React must mount " + path);
}
console.log("PASS public confirmed-only newsletter, unsubscribe, owner publishing limits, signed bounce handling and privacy");
