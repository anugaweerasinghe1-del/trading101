import assert from 'node:assert/strict';
import {hasQuantifiedWorkedExample,reviewCourseQuality} from '../supabase/functions/_shared/courseQualityGate';
import {readFileSync} from 'node:fs';
import {createCourseAdminHandler} from '../supabase/functions/_shared/courseAdmin';
import {courseAdminError} from '../src/lib/adminFunctionError';
import {requireExactRevisionReview} from '../supabase/functions/_shared/coursePublicationGate';
const words='Suppose an asset trades at ten dollars with a volume of one thousand units, and at eleven dollars with one hundred units. Multiply price by volume, sum the products, then divide by one thousand one hundred units.';
assert.equal(hasQuantifiedWorkedExample(words),true,'An explicit word-number calculation must not be rejected');
assert.equal(hasQuantifiedWorkedExample('Multiply $10 by 2 units to calculate the amount.'),true);
assert.equal(hasQuantifiedWorkedExample('Calculate a hypothetical decline of 12.5%.'),true);
assert.equal(hasQuantifiedWorkedExample('Divide twenty-five dollars by five units.'),true);
assert.equal(hasQuantifiedWorkedExample('One example describes how to calculate an unspecified result.'),false,'A vague number word is not a quantity with a unit');
assert.equal(hasQuantifiedWorkedExample('A price is ten dollars.'),false,'A quantity alone is not a worked calculation');
assert.equal(hasQuantifiedWorkedExample('Calculate a weighted average carefully.'),false,'An operation without quantified inputs is insufficient');
assert.equal(hasQuantifiedWorkedExample('Multiply $NaN by an unspecified quantity.'),false);
const fixture=JSON.parse(readFileSync('scripts/fixtures/bitcoin-editorial.json','utf8')).document;
const weak=structuredClone(fixture);weak.lessons[0].body=weak.lessons[0].body.map((p:string)=>p.startsWith('## ')?p:'Discuss a concept without an amount or a concrete worked calculation.');
assert.ok(reviewCourseQuality(weak).includes('Lesson 1: missing a quantified worked example.'),'The missing-example gate must remain active');
assert.ok(reviewCourseQuality(weak).includes('Lesson 1: a body paragraph is too brief to teach the concept.'),'Paragraph quality gate remains active');
console.log('PASS word-number/digit/decimal inputs; vague prose and missing-operation negatives; existing missing-example and paragraph gates remain active');

// Exercise actual HTTP failures through the handler and browser error adapter.
// Owner denial must happen before the store is called; fixtures never publish.
for (const [reason, code, expected] of [
  ['Course changed since review.', 'COURSE_CHANGED', /saved revision changed/],
  ['Course is incomplete: fixture failure', 'COURSE_VALIDATION', /content checks/],
  ['Independent course quality review blocked this draft.', 'COURSE_REVIEW_BLOCKED', /rejected this revision/],
  ['Independent course review unavailable.', 'COURSE_REVIEW_UNAVAILABLE', /Publication is blocked/],
  ['Free AI quota exhausted.', 'COURSE_REVIEW_QUOTA', /quota/],
  ['Course publication configuration requires a verified free Gemini model.', 'COURSE_REVIEW_CONFIG', /refreshing cannot fix/],
  ['Too few verified sources for independent course review.', 'COURSE_SOURCES_UNAVAILABLE', /reference sources/],
  ['PRIVATE_PROVIDER_TOKEN', 'COURSE_WRITE_FAILED', /server diagnostics/],
] as const) {
  let calls=0;
  const handler=createCourseAdminHandler({getKey:()=> 'fixture-key',rateLimit:async()=>true,authorizePublish:async()=>true,
    store:{list:async()=>[],save:async()=>({}),publish:async()=>{calls++;throw Error(reason);},reject:async()=>({}),settings:async()=>({}),configure:async()=>({}),run:async()=>({})}});
  const response=await handler(new Request('https://example.test',{method:'POST',headers:{'x-admin-key':'fixture-key'},body:JSON.stringify({action:'publish',id:'12345678-1234-1234-1234-123456789012',revision:1,reviewed:true,reviewer:'Fixture reviewer'})}));
  assert.equal(response.status,409);assert.equal(calls,1);
  const body=await response.json();assert.equal(body.code,code);
  assert.doesNotMatch(JSON.stringify(body),/PRIVATE_PROVIDER_TOKEN/);
  const displayed=await courseAdminError({context:new Response(JSON.stringify(body),{status:409})});
  assert.match(displayed,expected);assert.doesNotMatch(displayed,/PRIVATE_PROVIDER_TOKEN/);
}
console.log('PASS handler-to-browser failure categories: changed revision, validation, review rejection, unavailable review, quota, configuration, sources and sanitized unknown failure');
await assert.rejects(requireExactRevisionReview({}, {}, async()=>{throw Error('PRIVATE_PROVIDER_TIMEOUT');}),
  {message:'Independent course review unavailable. Draft withheld.'});
await assert.rejects(requireExactRevisionReview({}, {}, async()=>{throw Error('Independent course quality review blocked this draft.');}),
  /Independent course quality review blocked/);
