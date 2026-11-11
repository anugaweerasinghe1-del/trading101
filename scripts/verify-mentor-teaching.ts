import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { courseTracks } from "../src/lib/coursesData";
import { getMentorTeachingReply } from "../src/lib/mentorTeaching";

const track = courseTracks.find(t => t.slug === "options-trading-fundamentals");
assert.ok(track);
const lesson = track.lessons.find(l => l.slug === "what-is-an-option");
assert.ok(lesson);
const context = {
  trackTitle: track.title,
  lessonTitle: lesson.title,
  summary: lesson.summary,
  takeaways: lesson.keyTakeaways,
  workedExample: lesson.body.find(text => /\b(example|imagine|suppose|hypothetical)\b/i.test(text)),
  quiz: { question: lesson.quiz[0].question, explanation: lesson.quiz[0].explanation },
};
const beginner = getMentorTeachingReply("Explain this lesson in simple words", "Beginner", context);
assert.match(beginner, /Core idea:/);
assert.ok(beginner.includes(lesson.summary));
assert.match(beginner, /Check your understanding:/);
const quizHelp = getMentorTeachingReply("Why was the quiz answer correct?", "Beginner", context);
assert.ok(quizHelp.includes(lesson.quiz[0].question) && quizHelp.includes(lesson.quiz[0].explanation));
const intermediate = getMentorTeachingReply("Explain stop-loss orders", "Intermediate");
assert.match(intermediate, /stop at \$45/i);
assert.match(intermediate, /Apply it:/);
const advanced = getMentorTeachingReply("Explain leverage", "Advanced");
assert.match(advanced, /\$100 committed at 10× leverage/);
assert.match(advanced, /assumptions, costs and failure cases/i);
assert.match(advanced, /no leverage/i);
const unknown = getMentorTeachingReply("What will MYX token be worth tomorrow?", "Advanced", context);
assert.match(unknown, /don't have a verified authored answer/);
assert.doesNotMatch(unknown, /will (rise|fall) tomorrow/i);
for (const result of [beginner,quizHelp,intermediate,advanced,unknown]) {
  assert.match(result, /not financial advice/);
}
const mentorPage = readFileSync("src/pages/AIMentor.tsx","utf8");
const lessonPage = readFileSync("src/pages/CourseLesson.tsx","utf8");
assert.match(mentorPage,/useCourseDocument\(trackSlug\)/);
assert.match(mentorPage,/getMentorTeachingReply\(messageText, level, lessonContext\)/);
assert.match(mentorPage,/You choose your level/);
assert.match(lessonPage,/question=\$\{qi\}/);
assert.match(lessonPage,/to=\{mentorPath\}/);
console.log("PASS mentor contextual lesson and quiz handoff, levels, worked examples, fallback and disclaimers");
