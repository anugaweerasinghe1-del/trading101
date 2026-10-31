import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = file => readFileSync(file, "utf8");
const edge = read("supabase/functions/newsletter-editor/index.ts");
const sql = read("supabase/migrations/20261031103000_weekly_newsletter_editorial.sql");
const migration = read("supabase/migrations/20261031103000_weekly_newsletter_editorial.sql");
const desk = read("src/pages/AdminNewsletter.tsx");
const routes = read("src/lib/clientFallbackRoutes.ts");
const app = read("src/App.tsx");

assert.match(sql, /alter table public\.newsletter_editions enable row level security/i);
assert.match(sql, /revoke all on public\.newsletter_editions from anon,authenticated/i);
assert.match(sql, /week_of date not null unique/i);
assert.ok(!/\.from\s*\(\s*["\x27](?:newsletter_subscribers|subscribers)["\x27]\s*\)|\.rpc\s*\(\s*["\x27][^"\x27]*subscriber/i.test(edge),
  "Draft generator must not read subscriber emails");
assert.ok(!/resend\.com|send-newsletter|smtp|reply_to|newsletter_deliveries/i.test(edge),
  "Draft generator must have no outbound newsletter sending capability");
assert.ok(!/resend\.com|send-newsletter/i.test(migration),
  "Weekly database automation must never send a campaign");
assert.match(edge, /NEWSLETTER_SCHEDULER_TOKEN/);
assert.match(edge, /ADMIN_MASTER_KEY/);
assert.match(edge, /status: "approved"/);
assert.match(edge, /\.eq\("revision", revision\)/);
assert.match(migration, /30 3 \* \* 1/);
assert.match(migration, /newsletter_scheduler_authorized/);
assert.match(migration, /GRANT EXECUTE ON FUNCTION public.newsletter_ai_credentials\(\) TO service_role/);
assert.match(migration, /tradehq_course_gemini_key/);
assert.match(desk, /Approve draft \(no email sent\)/);
assert.match(desk, /Publish to subscribers is not active/);
assert.match(routes, /"\/admin\/newsletter"/);
assert.match(app, /path="\/admin\/newsletter"/);
console.log("PASS weekly private AI draft boundaries: explicit approval, no legacy import or email sends");
