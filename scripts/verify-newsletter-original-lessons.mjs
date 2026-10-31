import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  NEWSLETTER_LABS, newsletterLab, appendVerifiedLab, validateNewsletterCopy,
} from "../supabase/functions/_shared/newsletterLabs.ts";

assert.equal(NEWSLETTER_LABS.length, 8);
assert.equal(new Set(NEWSLETTER_LABS.map(x => x.id)).size, NEWSLETTER_LABS.length);
assert.ok(NEWSLETTER_LABS.every(x => x.sourceUrl.startsWith("https://www.investor.gov/")));
for (const lab of NEWSLETTER_LABS) {
  const narrative = [
    "## The hidden trap",
    "Financial decisions often hide a subtle assumption that a chart alone cannot test. ".repeat(10),
    "## What changes the decision",
    "A useful thought experiment is to separate the price someone wants from the price a market could provide. ".repeat(10),
    "## A useful habit",
    "Write your assumptions, compare alternative outcomes and say what this lesson cannot establish. ".repeat(10),
  ].join("\n\n");
  const body = appendVerifiedLab(narrative, lab);
  assert.equal(validateNewsletterCopy(
    "Why this tiny detail changes the entire decision",
    "Learn a concrete financial mechanism with an original number exercise.",
    body, lab,
  ), true, "Lab rejected: " + lab.id);
  assert.ok(!validateNewsletterCopy(
    "Why this tiny detail changes the entire decision",
    "Learn a concrete financial mechanism with an original number exercise.",
    body.replace(lab.sourceUrl, "https://ads.example.invalid/sale"), lab,
  ), "Off-allowlist link accepted");
  assert.equal(newsletterLab("2026-10-26", lab.id).id, lab.id);
  assert.ok(lab.answer.length > 80, "Answer must be substantive");
}
assert.notEqual(newsletterLab("2026-10-26").id, newsletterLab("2026-11-02").id);
assert.match(NEWSLETTER_LABS.find(x=>x.id==="stop-gap").answer, /\$600/);
assert.match(NEWSLETTER_LABS.find(x=>x.id==="spread-cost").answer, /\$100/);
assert.match(NEWSLETTER_LABS.find(x=>x.id==="fund-overlap").answer, /20%/);
assert.match(NEWSLETTER_LABS.find(x=>x.id==="drawdown-math").answer, /25%/);

const api = readFileSync("supabase/functions/newsletter-editor/index.ts", "utf8");
const ui = readFileSync("src/pages/AdminNewsletter.tsx", "utf8");
assert.match(api, /if \(action === "reopen"\)/);
assert.match(api, /if \(action === "preview-rewrite"\)/);
assert.match(api, /if \(action === "topics"/);
assert.match(api, /\.eq\("status", "approved"\)/);
assert.match(api, /current.status !== "draft"/);
assert.match(api, /const preview = await composeOriginalNewsletter/);
assert.match(api, /source_links: \[\.\.\.String\(body\.body_markdown\)/);
assert.match(api, /return reply\(\{ data: preview \}\)/);
assert.doesNotMatch(api, /api\.resend\.com|newsletter_subscribers|sendNewsletter\(/);
assert.match(ui, /Reopen for revisions/);
assert.match(ui, /Draft a deeper lesson \(preview only\)/);
assert.match(ui, /Unsaved AI preview/);
assert.match(ui, /Approve draft \(no email sent\)/);
console.log("PASS original educational newsletter labs, SEC source allowlist, safe revisions and no email sending");
