import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (path: string) => readFileSync(path, 'utf8');
const newsletter = source('src/pages/AdminNewsletter.tsx');
const courses = source('src/pages/AdminCourses.tsx');
const generator = source('src/components/courses/CourseGenerationSettings.tsx');
const queue = source('src/components/AdminCodeQueue.tsx');
const controls = source('src/components/AdminRepairControls.tsx');
const dashboard = source('src/pages/AdminDashboard.tsx');
const inbox = source('src/components/admin/AutomationInbox.tsx');

// All actions that can replace the newsletter editor must ask before
// discarding a pending owner change, BEFORE calling the backend/model.
for (const action of ['generate-weekly', 'preview-rewrite', 'reopen']) {
  const pos = newsletter.indexOf('await call("' + action + '"');
  assert.ok(pos > 0, 'missing newsletter action ' + action);
  const preceding = newsletter.slice(Math.max(0, pos - 330), pos);
  assert.match(preceding, /editor\.current\.dirty\s*&&\s*!window\.confirm/,
    action + ' must warn before dropping unsaved newsletter edits');
}
assert.match(newsletter, /dirty\s*&&\s*!confirm\('Discard unsaved newsletter edits and load the latest revision\?'\)/);
assert.doesNotMatch(newsletter, /disabled=\{busy\}\s+disabled=\{busy\}/,
  'a button must not silently declare disabled twice');

// Rejecting a course revision must never disregard unsaved editor changes.
assert.match(courses, /disabled=\{busy \|\| dirty\} onClick=\{\(\) => \{/);
assert.match(courses, /if \(dirty \|\| !confirm\("Reject this saved revision/);
assert.doesNotMatch(courses, /<fieldset disabled=\{busy\}><fieldset disabled=\{busy\}>/);
assert.doesNotMatch(courses, /disabled=\{busy\}\s+disabled=\{busy\}/);

// An unsaved free-tier configuration cannot silently trigger generation
// using an older server configuration.
assert.match(generator, /disabled=\{busy \|\| dirty \|\| !settings\.enabled \|\| !settings\.hasApiKey\}/);
assert.match(generator, /the worker uses the saved server configuration/);

// When the owner signs out, privileged queue rows and repair state are
// discarded, and late responses from the old session cannot restore them.
assert.match(queue, /onAuthStateChange\(event=>/);
assert.match(queue, /event!==['"]SIGNED_OUT['"]/);
assert.match(queue, /sessionEpoch\.current\+\+/);
assert.match(queue, /active\.current&&sessionEpoch\.current===epoch/);
assert.match(queue, /if\(sessionEpoch\.current!==epoch\|\|!active\.current\)/);
for (const value of ['setRows([])', 'setPublications([])', 'setReviews([])', 'setDiff(null)', 'setChecked(null)'])
  assert.ok(queue.includes(value), 'sign-out must remove private queue state: ' + value);
assert.match(controls, /onAuthStateChange\(event =>/);
assert.match(controls, /request\.current\?\.abort\(\); request\.current = null/);
assert.match(controls, /setState\(null\); setPending\(null\)/);
// Each dashboard service reports unknown rather than zero when its own read fails.
assert.match(dashboard, /subscriberStatus\.status === "fulfilled"/);
assert.match(dashboard, /Number\.isSafeInteger\(counts\[field\]\)/);
assert.match(dashboard, /setNewsletterSummary\(null\); warnings\.push/);
assert.match(dashboard, /setNewsletterSummary\(null\); setIssues\(\[\]\)/);
// Unavailable newsletter editorial reads are not silently displayed as zero.
assert.match(dashboard, /newsletterDrafts\.status === "fulfilled"/);
assert.match(dashboard, /setNewsletterEdits\(null\); warnings\.push/);
assert.match(dashboard, /newsletterEdits=\{newsletterEdits\}/);
assert.match(inbox, /newsletterEdits: EditorialQueueRow\[\] \| null/);
assert.match(inbox, /\[newsletterEdits, 'Newsletter', '\/admin\/newsletter'\]/);
assert.match(inbox, /item\.to\.endsWith\('newsletter'\) \? 'Newsletter desk'/);
console.log('ADMIN_EDITORIAL_SAFETY_PASS: unsaved editorial review, saved-only generation, owner sign-out late-response fencing and independent newsletter totals');
