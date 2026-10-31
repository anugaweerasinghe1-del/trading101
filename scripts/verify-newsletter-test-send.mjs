import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const sender = readFileSync("supabase/functions/newsletter-test-send/index.ts","utf8");
const editor = readFileSync("supabase/functions/newsletter-editor/index.ts","utf8");
const desk = readFileSync("src/pages/AdminNewsletter.tsx","utf8");
const migration = readFileSync("supabase/migrations/20261031133500_newsletter_test_delivery_receipts.sql","utf8");

assert.match(sender, /status:410/);
assert.match(sender, /retired/);
assert.doesNotMatch(sender, /api\.resend\.com|send-test|RESEND_API_KEY|NEWSLETTER_TEST_TO_EMAIL/);
assert.match(migration, /UNIQUE \(edition_id, edition_revision\)/);
assert.match(editor, /"preview-upcoming" && admin/);
assert.match(desk, /Preview next week's AI issue/);
assert.match(desk, /Publish approved issue to subscribers/);
assert.doesNotMatch(desk, /Send test to my inbox/);
console.log("PASS retired test-only sender, retained receipt history, real confirmed-only newsletter");
