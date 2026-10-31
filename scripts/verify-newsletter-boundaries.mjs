import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = file => readFileSync(file, "utf8");
const edge = read("supabase/functions/newsletter-editor/index.ts");
const sql = read("supabase/migrations/20261031103000_weekly_newsletter_editorial.sql");
const workflow = read(".github/workflows/newsletter-weekly-draft.yml");
const desk = read("src/pages/AdminNewsletter.tsx");
const routes = read("src/lib/clientFallbackRoutes.ts");
const app = read("src/App.tsx");

assert.match(sql, /alter table public\.newsletter_editions enable row level security/i);
assert.match(sql, /revoke all on public\.newsletter_editions from anon,authenticated/i);
assert.match(sql, /week_of date not null unique/i);
assert.ok(!/\bnewsletter_subscribers\b|\bsubscribers\b/i.test(edge),
  "Draft generator must not read subscriber emails");
assert.ok(!/resend\.com|send-newsletter|smtp|reply_to|newsletter_deliveries/i.test(edge),
  "Draft generator must have no outbound newsletter sending capability");
assert.ok(!/resend\.com|send-newsletter/i.test(workflow),
  "Weekly automation must never send a campaign");
assert.match(edge, /NEWSLETTER_SCHEDULER_TOKEN/);
assert.match(edge, /ADMIN_MASTER_KEY/);
assert.match(edge, /status: "approved"/);
assert.match(edge, /\.eq\("revision", revision\)/);
assert.match(workflow, /30 3 \* \* 1/);
assert.match(workflow, /secrets\.NEWSLETTER_SCHEDULER_TOKEN/);
assert.match(desk, /Approve draft \(no email sent\)/);
assert.match(desk, /Publish to subscribers is not active/);
assert.match(routes, /"\/admin\/newsletter"/);
assert.match(app, /path="\/admin\/newsletter"/);
console.log("PASS weekly private AI draft boundaries: explicit approval, no legacy import or email sends");
