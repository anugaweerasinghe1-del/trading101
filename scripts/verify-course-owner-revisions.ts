import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyCourseEditorialCorrections} from '../src/lib/courseEditorialCorrections';
import {renderApprovedCourse} from '../src/lib/courseHtml';
import {validateCourseDocument} from '../supabase/functions/_shared/courseDocument';
const {document}=JSON.parse(readFileSync('scripts/fixtures/bitcoin-editorial.json','utf8'));
const original=JSON.stringify(document);
const corrected=applyCourseEditorialCorrections(document);
assert.equal(JSON.stringify(document),original);
assert.deepEqual(validateCourseDocument(corrected,true),[]);
assert.deepEqual(applyCourseEditorialCorrections(corrected),corrected);
for(const [lessonIndex,paragraphIndex] of [[0,2],[1,5],[2,11]]){
 const lesson=corrected.lessons[lessonIndex];
 assert.notEqual(lesson.body[paragraphIndex],document.lessons[lessonIndex].body[paragraphIndex]);
 const rendered=renderApprovedCourse('<html><head></head><body><div id="root"></div></body></html>',document,lesson.slug)!;
 const bootstrap=JSON.parse(rendered.match(/id="approved-course-bootstrap" type="application\/json">([\s\S]*?)<\/script>/)![1]);
 assert.equal(bootstrap.lessons[lessonIndex].body[paragraphIndex],lesson.body[paragraphIndex]);
 assert.ok(rendered.includes(lesson.body[paragraphIndex]),'SSR must show the same corrected paragraph');
 const later=structuredClone(document);later.lessons[lessonIndex].body[paragraphIndex]='A later owner revision.';
 assert.equal(applyCourseEditorialCorrections(later).lessons[lessonIndex].body[paragraphIndex],'A later owner revision.');
}
assert.match(corrected.lessons[0].body[2],/does not reproduce every emotional/);
assert.match(corrected.lessons[1].body[5],/Neither approach is universally required/);
assert.match(corrected.lessons[2].body[11],/does not certify trading competence/);
console.log('PASS approved Bitcoin revisions: three SSR/bootstrap pairs, validity, idempotence, immutable source and later-edit guards');
