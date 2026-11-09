import assert from "node:assert/strict";
import { readAdminGithubList } from "../src/lib/adminGithubList.ts";

const noCancel = () => {};
const page = (count: number, next = false): Response =>
  new Response(JSON.stringify(Array.from({ length: count }, (_, i) => ({ id: i + 1 }))), {
    status: 200,
    headers: next ? { Link: '<https://api.github.com/?page=2>; rel="next"' } : {},
  });

let calls = 0;
const laterRateLimited = async (): Promise<Response> => {
  calls++;
  return calls === 1 ? page(100, true) : new Response(null, { status: 403 });
};
const partial = await readAdminGithubList<{ id: number }>('issues', noCancel, laterRateLimited as typeof fetch);
assert.equal(calls, 2);
assert.equal(partial.items.length, 100);
assert.equal(partial.complete, false, 'A rate-limited second page must not be labelled complete');

for (const status of [403, 429]) {
  calls = 0;
  const limited = async (): Promise<Response> => {
    calls++;
    return calls === 1 ? page(100, true) : new Response(null, { status });
  };
  const result = await readAdminGithubList<{ id: number }>('pulls', noCancel, limited as typeof fetch);
  assert.equal(result.items.length, 100);
  assert.equal(result.complete, false);
  await assert.rejects(
    () => readAdminGithubList('issues', noCancel, (async () => new Response(null, { status })) as typeof fetch),
    /GitHub issues HTTP/,
    'No accessible page must still be reported as unavailable',
  );
}

const complete = await readAdminGithubList('issues', noCancel, (async () => page(2)) as typeof fetch);
assert.equal(complete.items.length, 2);
assert.equal(complete.complete, true);

await assert.rejects(
  () => readAdminGithubList('issues', noCancel, (async () => new Response(null, { status: 500 })) as typeof fetch),
  /HTTP 500/,
  'Non-rate-limit failures should remain visible as failures',
);
console.log('Admin GitHub bounded partial-page tests passed');
