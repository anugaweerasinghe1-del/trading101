import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { adminFailureDetails, courseAdminError } from '../src/lib/adminFunctionError';

const source = (path: string) => readFileSync(path, 'utf8');
const newsletter = source('src/pages/AdminNewsletter.tsx');
const courses = source('src/pages/AdminCourses.tsx');
const generator = source('src/components/courses/CourseGenerationSettings.tsx');
const queue = source('src/components/AdminCodeQueue.tsx');
const controls = source('src/components/AdminRepairControls.tsx');
const dashboard = source('src/pages/AdminDashboard.tsx');
const dailyDesk = source('src/pages/AdminDaily.tsx');
const adminHandler = source('supabase/functions/_shared/courseAdmin.ts');
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
assert.match(courses, /disabled=\{busy \|\| dirty \|\| stale\} onClick=\{\(\) => \{/);
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
// The compiled browser regression covers all three bounded review lists.
assert.match(inbox, /item\.to\.endsWith\('newsletter'\) \? 'Newsletter desk'/);
// The two publishing desks must now require a live owner login as well as a
// private admin key. No model call or publication occurs in dashboard readiness.
assert.match(dailyDesk, /supabase\.auth\.getSession\(\)/);
assert.match(dailyDesk, /bearerToken = auth\.session\.access_token/);
assert.match(dailyDesk, /registered owner's website login alongside the master key/);
assert.match(adminHandler, /if \(body\.action === "daily-publish"\) \{/);
assert.match(adminHandler, /body\.reviewer = "TradeHQ owner \(authenticated\)"/);
assert.match(dashboard, /body: \{ action: "status" \}/);
assert.match(dashboard, /CONFIGURED_NOT_TESTED/);
assert.match(dashboard, /PILOT_PAUSED/);
assert.match(dashboard, /setChatReadiness\(null\); warnings\.push/);
// The AI Development Desk must fail closed on a total GitHub read failure:
 // no earlier approval proposal, check status, or freshness timestamp remains.
const aiDesk = source('src/pages/AdminAIAssistant.tsx');
assert.match(aiDesk, /if \(!guard\.current\(\)\) return;\s*\/\/ A failed GitHub fetch/);
assert.match(aiDesk, /setIssues\(\[\]\);\s*setPrs\(\[\]\);\s*setChecks\(\{\}\);\s*setGithubCheckedAt\(null\);/);
assert.match(aiDesk, /Previous GitHub proposal and validation snapshots were cleared/);
assert.match(aiDesk, /setChecks\(next\);/);
// Public GitHub polling must clear outdated status after partial and total outages.
// A cached green agent run cannot masquerade as a current provider or deployment check.
assert.match(dashboard, /else setIssues\(\[\]\); \/\/ Do not show an earlier issue feed/);
assert.match(dashboard, /else \{ setRun\(null\); setPreviousSuccess\(null\); setPreviousFailure\(null\); \}/);
assert.match(dashboard, /else \{ setCodeRun\(null\); setPreviousCodeFailure\(null\); \}/);
assert.match(dashboard, /else setProposals\(\[\]\);/);
assert.match(dashboard, /Missing feeds have been cleared/);
assert.match(dashboard, /setDeploymentChecks\(null\); setLastGitHubChecked\(null\);/);
assert.match(dashboard, /Previous snapshots were cleared/);
assert.doesNotMatch(dashboard, />Weekly Newsletter</);
console.log('ADMIN_EDITORIAL_SAFETY_PASS: unsaved editorial review, saved-only generation, owner sign-out late-response fencing and independent newsletter totals');

// Real FunctionsHttpError response bodies: codes are available on context, not data.
const failed = (status: number, body: unknown) => ({ context: new Response(JSON.stringify(body), { status }) });
assert.equal((await adminFailureDetails(failed(429, { code: 'DAILY_LIMIT' }), null)).code, 'DAILY_LIMIT');
assert.match(await courseAdminError(failed(403, { error: 'private provider payload' })), /registered owner/);
assert.match(await courseAdminError(failed(409, { error: 'Independent course review failed' })), /Publication is blocked/);
assert.match(await courseAdminError(failed(409, { error: 'Course changed since review' })), /saved revision changed/);
assert.match(await courseAdminError(failed(429, {})), /rate-limited/);
assert.match(await courseAdminError(new Error('network failed')), /could not confirm/);
for (const status of [400, 401, 403, 409, 422, 429, 503])
  assert.doesNotMatch(await courseAdminError(failed(status, { error: 'PRIVATE_TOKEN_MUST_NOT_RENDER' })), /PRIVATE_TOKEN/);
assert.equal((await adminFailureDetails({ context: new Response('not JSON', { status: 503 }) })).code, '');
console.log('ADMIN_FUNCTION_ERRORS_PASS: HTTP response-body codes, owner/quota/revision/review denials, malformed/transport failures, no raw provider payload exposure.');

// Older owner requests must survive pages filled with newer pull requests.
const { readAdminGithubList } = await import('../src/lib/adminGithubList');
const listCalls: string[] = [];
const listFetcher = (pages: unknown[], next = false): typeof fetch => async (input, init) => {
  const url = String(input); listCalls.push(url);
  assert.match(url, /^https:\/\/api\.github\.com\/repos\/anugaweerasinghe1-del\/trading101\/(issues|pulls)\?/);
  assert.equal(init?.credentials, 'omit'); assert.equal(init?.redirect, 'error');
  assert.deepEqual(init?.headers, { Accept: 'application/vnd.github+json' });
  return new Response(JSON.stringify(pages.shift()), { headers: next ? { Link: '<https://untrusted.invalid/page>; rel="next"' } : {} });
};
const full = Array.from({ length: 100 }, (_, i) => ({ number: 1000 + i, title: 'Newer PR', pull_request: {} }));
const old = { number: 94, title: '[TradeHQ Code Request]', user: { login: 'anugaweerasinghe1-del' } };
let listed = await readAdminGithubList('issues', () => {}, listFetcher([full, [old]]));
assert.equal(listed.complete, true); assert.equal(listed.items.length, 101);
assert.deepEqual(listed.items.at(-1), old); assert.equal(listCalls.length, 2);
assert.match(listCalls[1], /state=all&per_page=100&page=2$/);
for (const [resource, limit] of [['issues', 4], ['pulls', 2]] as const) {
  listCalls.length = 0;
  listed = await readAdminGithubList(resource, () => {}, listFetcher(Array(limit).fill(full)));
  assert.equal(listed.complete, false); assert.equal(listCalls.length, limit);
}
for (const status of [401, 403, 429, 500, 503]) {
  let calls = 0;
  await assert.rejects(readAdminGithubList('issues', () => {}, async () => {
    calls++; return calls === 1 ? new Response(JSON.stringify(full)) : new Response('{}', { status });
  }), new RegExp('HTTP ' + status));
  assert.equal(calls, 2, 'Failed page never retries or returns a complete empty history');
}
for (const bad of [null, {}, Array(101).fill(old)]) {
  await assert.rejects(readAdminGithubList('issues', () => {}, listFetcher([bad])), /invalid/);
}
// A Link header can request another bounded page, but cannot select its origin.
listCalls.length = 0;
await readAdminGithubList('pulls', () => {}, listFetcher([[old], []], true));
assert.equal(listCalls.length, 2); assert.ok(listCalls.every(url => !url.includes('untrusted')));
let locked = false, lockCalls = 0;
await assert.rejects(readAdminGithubList('issues', () => { if (locked) throw Error('locked'); }, async () => {
  lockCalls++; locked = true; return new Response(JSON.stringify(full));
}), /locked/);
assert.equal(lockCalls, 1, 'Lock fences the response before another public page request');
console.log('ADMIN_GITHUB_HISTORY_PASS: older requests, bounded partial lists, page errors, malformed data, fixed-origin pagination, no credentials and lock cancellation.');
