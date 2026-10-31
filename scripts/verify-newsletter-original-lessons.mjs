import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  NEWSLETTER_LABS, NEWSLETTER_FORMATS, newsletterLab, newsletterFormat, appendVerifiedLab, validateNewsletterCopy,
} from "../supabase/functions/_shared/newsletterLabs.ts";

assert.equal(NEWSLETTER_LABS.length, 12);
assert.equal(NEWSLETTER_FORMATS.length, 10);
assert.equal(new Set(NEWSLETTER_FORMATS.map(f => f.id)).size, NEWSLETTER_FORMATS.length);
assert.equal(new Set(NEWSLETTER_LABS.map(x => x.id)).size, NEWSLETTER_LABS.length);
assert.ok(NEWSLETTER_LABS.every(x => x.sourceUrl.startsWith("https://www.investor.gov/")));
for (const lab of NEWSLETTER_LABS) {
  const format = newsletterFormat("2026-11-02");
  const narrative = [
    format.requiredHeading,
    "Financial decisions often hide a subtle assumption that a chart alone cannot test. ".repeat(10),
    "## What changes the decision",
    "A useful thought experiment is to separate the price someone wants from the price a market could provide. ".repeat(10),
    "## A useful habit",
    "Write your assumptions, compare alternative outcomes and say what this lesson cannot establish. ".repeat(10),
  ].join("\n\n");
  const body = appendVerifiedLab(narrative, lab, format);
  assert.equal(validateNewsletterCopy(
    "Why this tiny detail changes the entire decision",
    "Learn a concrete financial mechanism with an original number exercise.",
    body, lab, format,
  ), true, "Lab rejected: " + lab.id);
  assert.ok(!validateNewsletterCopy(
    "Why this tiny detail changes the entire decision",
    "Learn a concrete financial mechanism with an original number exercise.",
    body.replace(lab.sourceUrl, "https://ads.example.invalid/sale"), lab, format,
  ), "Off-allowlist link accepted");
  assert.equal(newsletterLab("2026-10-26", lab.id).id, lab.id);
  assert.ok(lab.answer.length > 80, "Answer must be substantive");
}
// An entire quarter should have no repeat of the same topic or format in
// adjacent weeks; the different 12/10-week cycles produce 60 unique pairs.
const start = Date.parse("2026-11-02T00:00:00Z");
const issuePlan = Array.from({length:60}, (_,i) => {
  const week = new Date(start + i*7*86_400_000).toISOString().slice(0,10);
  return [newsletterLab(week).id, newsletterFormat(week).id];
});
assert.equal(new Set(issuePlan.map(v=>v.join("|"))).size, 60);
for (let i=1;i<issuePlan.length;i++) {
  assert.notEqual(issuePlan[i][0],issuePlan[i-1][0]);
  assert.notEqual(issuePlan[i][1],issuePlan[i-1][1]);
}
assert.notEqual(newsletterLab("2026-10-26").id, newsletterLab("2026-11-02").id);
assert.match(NEWSLETTER_LABS.find(x=>x.id==="stop-gap").answer, /\$600/);
assert.match(NEWSLETTER_LABS.find(x=>x.id==="spread-cost").answer, /\$100/);
assert.match(NEWSLETTER_LABS.find(x=>x.id==="fund-overlap").answer, /20%/);
assert.match(NEWSLETTER_LABS.find(x=>x.id==="drawdown-math").answer, /25%/);

const api = readFileSync("supabase/functions/newsletter-editor/index.ts", "utf8");
const ui = readFileSync("src/pages/AdminNewsletter.tsx", "utf8");
assert.match(api, /newsletterFormat\(week\)/);
assert.match(api, /VARIETY IS A CORE REQUIREMENT/);
assert.match(api, /complete beginner/);
assert.match(api, /recentSubjectsToAvoidImitating/);
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
