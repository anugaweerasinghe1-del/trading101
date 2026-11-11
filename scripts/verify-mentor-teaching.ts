import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadSiteData } from "./loadData";
import { getMentorTeachingReply } from "../src/lib/mentorTeaching";

const { courseTracks } = await loadSiteData();
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
  body: lesson.body,
  quiz: { question: lesson.quiz[0].question, explanation: lesson.quiz[0].explanation },
};
const beginner = getMentorTeachingReply("Explain this lesson in simple words", "Beginner", context);
assert.match(beginner, /Core idea:/);
assert.ok(beginner.includes(lesson.summary));
assert.match(beginner, /Check your understanding:/);
const quizHelp = getMentorTeachingReply("Why was the quiz answer correct?", "Beginner", context);
assert.ok(quizHelp.includes(lesson.quiz[0].question) && quizHelp.includes(lesson.quiz[0].explanation));

const optionConcept = getMentorTeachingReply("What is a call option?", "Beginner", context);
assert.doesNotMatch(optionConcept, /Quiz question:|Published explanation:/, "An option-contract question must not be treated as a quiz-answer request");
assert.match(optionConcept, /option/i, "The answer must address the published option lesson");
const mechanics = getMentorTeachingReply("Will a stop-loss order execute if a stock's price falls tomorrow?", "Beginner", context);
assert.match(mechanics, /stop|trigger|market order/i, "Conditional order mechanics are educational, not a forecast");
assert.doesNotMatch(mechanics, /don't have a verified authored answer to a future price/, "Do not refuse legitimate mechanics questions");
const prediction = getMentorTeachingReply("Will Bitcoin rise tomorrow?", "Advanced", context);
assert.match(prediction, /don't have a verified authored answer to a future price/, "Real asset direction predictions remain unsupported");
const explanation = getMentorTeachingReply("Explain option premium, not my quiz answer", "Intermediate", context);
assert.doesNotMatch(explanation, /Quiz question:/, "The user expressly declined quiz help");

const intermediate = getMentorTeachingReply("Explain stop-loss orders", "Intermediate");
assert.match(intermediate, /stop at \$45/i);
assert.match(intermediate, /Apply it:/);
const advanced = getMentorTeachingReply("Explain leverage", "Advanced");
assert.match(advanced, /\$100 committed at 10× leverage/);
assert.match(advanced, /assumptions, costs and failure cases/i);
assert.match(advanced, /no leverage/i);
const greeks = track.lessons.find(l => l.slug === "the-greeks-delta-gamma-theta-vega");
assert.ok(greeks);
const grounded = getMentorTeachingReply("What does gamma mean?", "Advanced", {
  trackTitle: track.title, lessonTitle: greeks.title, summary: greeks.summary,
  takeaways: greeks.keyTakeaways, body: greeks.body,
});
assert.match(grounded, /published .* lesson/i);
assert.match(grounded, /Gamma measures how delta changes/i);
const followUp = getMentorTeachingReply("Explain it more simply", "Beginner", undefined, [
  {role:"user",content:"What is slippage?"},{role:"assistant",content:"A spread example"},
]);
assert.match(followUp, /\$50\.25/);
const unknown = getMentorTeachingReply("What will MYX token be worth tomorrow?", "Advanced", context);
assert.match(unknown, /don't have a verified authored answer/);
assert.doesNotMatch(unknown, /will (rise|fall) tomorrow/i);
for (const result of [beginner,quizHelp,intermediate,advanced,grounded,followUp,unknown]) {
  assert.match(result, /not financial advice/);
}
const mentorPage = readFileSync("src/pages/AIMentor.tsx","utf8");
const lessonPage = readFileSync("src/pages/CourseLesson.tsx","utf8");
assert.match(mentorPage,/useCourseDocument\(trackSlug\)/);
assert.match(mentorPage,/getMentorTeachingReply\(messageText, level, lessonContext, messages\)/);
assert.match(mentorPage,/You choose your level/);
assert.match(lessonPage,/question=\$\{qi\}/);
assert.match(lessonPage,/to=\{mentorPath\}/);
console.log("PASS mentor contextual lesson and quiz handoff, levels, worked examples, fallback and disclaimers");
