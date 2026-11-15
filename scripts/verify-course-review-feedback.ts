import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {independentCourseReview,readCoursePublicationReferences} from '../supabase/functions/_shared/courseGenerator';
import {CourseReviewBlockedError,readCourseReviewFindings} from '../supabase/functions/_shared/courseReviewFeedback';
import {createCourseAdminHandler} from '../supabase/functions/_shared/courseAdmin';
import {adminFailureDetails} from '../src/lib/adminFunctionError';
import {requireExactRevisionReview} from '../supabase/functions/_shared/coursePublicationGate';
const document=JSON.parse(readFileSync('scripts/fixtures/bitcoin-editorial.json','utf8')).document;
const findings=['Lesson 2: qualify the statement about emotional stakes.','Lesson 3: verify the cited drawdown definition.'];
const responseFor=(decision:unknown):typeof fetch=>async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(decision)}]}}]}));
let blocked:CourseReviewBlockedError|undefined;
try{await independentCourseReview(document,[],{model:'test-only',apiKey:'PRIVATE_TEST_KEY'},responseFor({verdict:'BLOCK',findings}));}catch(error){assert.ok(error instanceof CourseReviewBlockedError);blocked=error;}
assert.deepEqual(blocked?.findings,findings);
const handler=createCourseAdminHandler({getKey:()=> 'fixture-key',rateLimit:async()=>true,authorizePublish:async()=>true,store:{list:async()=>[],save:async()=>({}),publish:async()=>{throw blocked;},reject:async()=>({}),settings:async()=>({}),configure:async()=>({}),run:async()=>({})}});
const result=await handler(new Request('https://example.test',{method:'POST',headers:{'x-admin-key':'fixture-key'},body:JSON.stringify({action:'publish',id:'12345678-1234-1234-1234-123456789012',revision:8,reviewed:true,reviewer:'Fixture'})}));
assert.equal(result.status,409);const wire=await result.json();assert.equal(wire.code,'COURSE_REVIEW_BLOCKED');assert.deepEqual(wire.reviewFindings,findings);assert.doesNotMatch(JSON.stringify(wire),/PRIVATE_TEST_KEY|candidates|generationConfig/);
assert.deepEqual((await adminFailureDetails({context:new Response(JSON.stringify(wire),{status:409})})).reviewFindings,findings);
await assert.rejects(requireExactRevisionReview(document,{},async()=>{throw blocked;}),error=>error===blocked,'Exact-revision gate must preserve structured rejection');
for(const invalid of [null,{},[],{verdict:['PASS'],findings:[]},{verdict:{toString:'PASS'},findings:[]},{verdict:'UNKNOWN',findings:[]},{verdict:'BLOCK',findings:[]},{verdict:'PASS',findings:['conflicting result']},{verdict:'BLOCK',findings:[null]},{verdict:'BLOCK',findings:['\u0000']},{verdict:'BLOCK',findings:['x'.repeat(601)]}]){
 await assert.rejects(independentCourseReview(document,[],{model:'fixture',apiKey:'fixture'},responseFor(invalid)),/review returned malformed data/);
}
await independentCourseReview(document,[],{model:'fixture',apiKey:'fixture'},responseFor({verdict:'PASS',findings:[]}));
assert.deepEqual(readCourseReviewFindings(['x'.repeat(601)]),[]);assert.deepEqual(readCourseReviewFindings(Array(9).fill('x')),[]);
assert.doesNotMatch(readCourseReviewFindings(['Check Bearer secret-token and AIza'+'a'.repeat(35)])[0],/secret-token|AIza/);
assert.deepEqual((await adminFailureDetails(null,{code:'COURSE_WRITE_FAILED',reviewFindings:findings})).reviewFindings,[]);
const course=structuredClone(document);course.lessons[2].sources.push({label:'Drawdown',url:'https://www.morningstar.com/investing-terms/maximum-drawdown'});course.lessons[0].sources.push({label:'Untrusted',url:'http://169.254.169.254/latest/meta-data'});
const fetched:string[]=[];
await readCoursePublicationReferences(course,async input=>{fetched.push(String(input));return new Response('<main>'+Array(110).fill('Source explanation.').join(' ')+'</main>',{headers:{'Content-Type':'text/html'}});});
assert.ok(fetched.includes('https://www.morningstar.com/investing-terms/maximum-drawdown'));
assert.ok(!fetched.some(url=>url.includes('169.254.169.254')),'Draft citations must not turn into arbitrary network requests');
assert.ok(!fetched.some(url=>url.includes('federalreserve.gov')),'Uncited general sources must not replace lesson citations');
const page=readFileSync('src/pages/AdminCourses.tsx','utf8');assert.match(page,/reviewReport\.findings\.map/);assert.match(page,/not verified facts or an AdSense decision/);assert.doesNotMatch(page,/dangerouslySetInnerHTML/);assert.match(page,/setReviewed\(false\); setReviewReport\(null\)/);
console.log('PASS structured reviewer findings reach owner adapter; malformed verdicts remain unavailable; exact-revision rejection survives; credentials/envelopes withheld; cited allowlisted references fetched with no SSRF; owner panel labels unverified concerns and clears on sign-out. Fixtures only; no model requests.');
