/**
 * Context-aware, authored teaching help. No network requests or generative AI.
 * Published lesson text is the source of truth; never invent quiz explanations.
 */
import { MENTOR_TOPICS, getSmartMentorReply } from "./smartMentor";

export type MentorLevel = "Beginner" | "Intermediate" | "Advanced";

export interface MentorLessonContext {
  trackTitle: string;
  lessonTitle: string;
  summary: string;
  takeaways: string[];
  workedExample?: string;
  body?: string[];
  quiz?: { question: string; explanation: string };
}

const DISCLAIMER = "\n\n(Educational simulation only — not financial advice.)";
const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function matchingTopic(input: string) {
  const words = ` ${normalize(input)} `;
  let best: (typeof MENTOR_TOPICS)[number] | undefined;
  let score = 0;
  for (const topic of MENTOR_TOPICS) {
    for (const keyword of topic.keywords) {
      const term = normalize(keyword);
      if (term && words.includes(` ${term} `) && term.length > score) {
        best = topic;
        score = term.length;
      }
    }
  }
  return best;
}


/** Option contracts and ordinary questions must not be confused with quiz answers. */
function asksForQuizHelp(text: string): boolean {
  return /\bquiz\b|\b(?:correct|wrong|incorrect|my|the|this|that) answer\b|\b(?:this|that|my) question\b|\bwhich (?:answer|option|choice)\b|\b(?:correct|wrong|incorrect) (?:choice|option)\b|\boption [a-d0-9]\b|\banswer (?:was|is) (?:right|wrong|incorrect|correct)\b/.test(text);
}

/** A conditional order question about tomorrow is not a request to predict a price. */
function asksForPricePrediction(text: string): boolean {
  const asset = /\b(price|worth|stock|token|asset|bitcoin|ethereum|crypto|coin|btc|eth)\b/.test(text);
  if (!asset) return false;
  const future = /\b(tomorrow|next week|next month|next year|future|soon)\b/.test(text);
  const explicit = /\b(predict|forecast|price target)\b/.test(text);
  const futureValue = /\b(?:what|where|how much|how high|how low) (?:will|would) (?:the )?(?:[a-z0-9]+ ){0,3}(?:price|stock|token|asset|bitcoin|ethereum|coin|btc|eth) (?:of [a-z0-9]+ )?(?:be|cost|trade|go|reach|worth)\b/.test(text);
  const futureDirection = /\b(?:will|would) (?:the )?(?:[a-z0-9]+ ){0,3}(?:price|stock|token|asset|bitcoin|ethereum|coin|btc|eth) (?:rise|fall|drop|increase|decrease|go up|go down)\b/.test(text);
  const investmentCall = /\bshould i (?:buy|sell|trade)\b/.test(text);
  return explicit || (future && (futureValue || futureDirection || investmentCall));
}

/** Retrieve only exact excerpts from a published lesson for unanswered subtopics. */
function groundedPassage(question: string, lesson: MentorLessonContext): string | undefined {
  const ignored = new Set(["what", "will", "does", "this", "that", "with", "from", "when", "where", "which", "would", "could", "should", "have", "there", "explain", "understand", "lesson", "about", "because", "more", "some", "please", "mean", "simple", "example"]);
  const tokens = [...new Set(normalize(question).split(" ").filter(word => word.length >= 4 && !ignored.has(word)))];
  if (!tokens.length) return undefined;
  let best: string | undefined;
  let bestScore = 0;
  for (const [index, paragraph] of (lesson.body ?? []).entries()) {
    if (paragraph.startsWith("> ") || paragraph.length < 70 || /not financial advice/i.test(paragraph)) continue;
    const content = ` ${normalize(paragraph)} `;
    const heading = lesson.body?.[index - 1] ?? "";
    const headingText = ` ${normalize(heading)} `;
    const score = tokens.reduce((sum, word) => sum + (content.includes(` ${word} `) ? 1 : 0)
      + (heading.startsWith("## ") && headingText.includes(` ${word} `) ? 2 : 0), 0);
    if (score > bestScore) { best = paragraph.replace(/^## /, ""); bestScore = score; }
  }
  return bestScore > 0 ? best?.slice(0, 1050) : undefined;
}
function learningPrompt(level: MentorLevel, lesson?: MentorLessonContext): string {
  const check = lesson?.quiz?.question ?? "What assumption would change the outcome of this example?";
  if (level === "Beginner") return `\n\nCheck your understanding: ${check} Explain your answer in your own words.`;
  if (level === "Intermediate") return `\n\nApply it: What would change in a hypothetical virtual trade if one assumption differed? Use the lesson's figures, and explain why.\nSelf-check: ${check}`;
  return `\n\nAdvanced review: Identify the assumptions, costs and failure cases; distinguish the observed result from a prediction.\nSelf-check: ${check}`;
}

/** The selected level is user-controlled; do not imply the app inferred proficiency. */
export function getMentorTeachingReply(
  input: string,
  level: MentorLevel,
  lesson?: MentorLessonContext,
  history: { role: "user" | "assistant"; content: string }[] = [],
): string {
  const question = input.trim().slice(0, 500);
  if (!question) return "Ask about a trading concept or choose a lesson question." + DISCLAIMER;
  const normalized = normalize(question);
  // A quoted passage must not be mistaken for a forecast or a trade signal.
  if (asksForPricePrediction(normalized)) {
    return "I don\x27t have a verified authored answer to a future price or trade prediction. A historical example is not a forecast. Ask about risk, order mechanics or an assumption to test with virtual funds." + DISCLAIMER;
  }
  const validLevel: MentorLevel = ["Beginner", "Intermediate", "Advanced"].includes(level) ? level : "Beginner";
  const asksQuiz = asksForQuizHelp(normalized);
  const asksLesson = /\b(this lesson|the lesson|summari[sz]e|recap|key takeaway|explain this|simpler words|simple words)\b/.test(normalized);
  const followUp = /\b(it|that|again|simpler|different example|another example|more detail)\b/.test(normalized)
    && /\b(explain|example|clarify|mean|understand|simplify|detail)\b/.test(normalized);
  const previousTopic = followUp
    ? history.filter(message => message.role === "user").slice(-5).reverse().map(message => matchingTopic(message.content)).find(Boolean)
    : undefined;
  const topic = matchingTopic(question) ?? previousTopic;
  const passage = lesson ? groundedPassage(question, lesson) : undefined;

  if (lesson && asksQuiz && lesson.quiz) {
    return `From "${lesson.lessonTitle}" (authored course material):\n\nQuiz question: ${lesson.quiz.question}\n\nPublished explanation: ${lesson.quiz.explanation}\n\nI can explain the stated reasoning, but this library cannot independently judge every alternative answer.` + learningPrompt(validLevel, lesson) + DISCLAIMER;
  }
  if (lesson && (asksLesson || (!topic && /\b(help|confus|understand|stuck)\b/.test(normalized)))) {
    const sections = [
      `From "${lesson.lessonTitle}" in ${lesson.trackTitle}:`,
      `Core idea: ${lesson.summary}`,
      ...(lesson.takeaways.length ? [`Key takeaway: ${lesson.takeaways[0]}`] : []),
      ...(lesson.workedExample ? [`Example from the published lesson: ${lesson.workedExample}`] : []),
      ...(lesson.quiz ? [`Quiz guidance: ${lesson.quiz.explanation}`] : []),
    ];
    return sections.join("\n\n") + learningPrompt(validLevel, lesson) + DISCLAIMER;
  }
  if (topic) {
    const lead = validLevel === "Beginner" ? `In plain language — ${topic.title}:\n\n`
      : validLevel === "Intermediate" ? `Concept and worked application — ${topic.title}:\n\n`
        : `Advanced assumptions and limitations — ${topic.title}:\n\n`;
    const connection = passage
      ? `\n\nRelated passage from the published "${lesson!.lessonTitle}" lesson: ${passage}`
      : lesson && normalize(lesson.summary).includes(normalize(topic.title).split(" ")[0])
        ? `\n\nConnection to "${lesson.lessonTitle}": ${lesson.summary}` : "";
    return lead + topic.answer + connection + learningPrompt(validLevel, lesson) + DISCLAIMER;
  }
  if (lesson && passage) {
    return `From the published "${lesson.lessonTitle}" lesson (this is an excerpt, not a newly generated answer):\n\n${passage}` + learningPrompt(validLevel, lesson) + DISCLAIMER;
  }
  if (lesson && /\b(what|how|why)\b/.test(normalized)) {
    return `I don't have a verified authored answer to that exact question. The published "${lesson.lessonTitle}" lesson says: ${lesson.summary}\n\nTry naming a specific term, or ask "Explain this lesson" for its written example. I won't invent a missing explanation.` + DISCLAIMER;
  }
  return getSmartMentorReply(question);
}
