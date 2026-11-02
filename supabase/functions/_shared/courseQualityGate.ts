import type { CourseDocument } from "./courseDocument.ts";

/**
 * Fail-closed, provider-independent review of a course's factual hygiene and
 * instructional value. This cannot prove financial accuracy or policy approval;
 * it blocks known misleading claims and low-value or unsupported structure.
 */
export function reviewCourseQuality(
  doc: CourseDocument,
  allowedSources: readonly string[] = [],
  existing: readonly { slug?: string; title: string }[] = [],
): string[] {
  const issues: string[] = [];
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const words = (s: string) => norm(s).split(" ").filter(Boolean);
  const material = (s: string) => words(s).filter(w => w.length > 3 && !["trade", "trading", "course", "intro", "fundamentals", "basic", "basics", "the", "with"].includes(w));
  const overlap = (a: string, b: string) => {
    const A = new Set(material(a)), B = new Set(material(b));
    return A.size && B.size ? [...A].filter(w => B.has(w)).length / Math.min(A.size, B.size) : 0;
  };

  for (const other of existing) {
    if (other.slug === doc.slug || overlap(doc.title, other.title) >= 0.8) {
      issues.push("Course duplicates an existing topic or title.");
      break;
    }
  }
  const prose = doc.lessons.map(l => l.body.filter(s => !s.trimStart().startsWith("## ")).join(" "));
  const all = [doc.title, doc.tagline, doc.description, ...doc.outcomes, ...doc.lessons.flatMap(l =>
    [l.title, l.summary, ...l.body, ...l.keyTakeaways, ...l.quiz.flatMap(q => [q.question, q.options[q.correctAnswer] ?? "", q.explanation])])].join("\n");
  const prohibited: { test: RegExp; reason: string }[] = [
    { test: /\b(?:zero[- ]risk|risk[- ]free (?:trading|strategy|experiment|environment|practice)|absolute psychological freedom)\b/i, reason: "Unqualified risk-free or psychological claim." },
    { test: /\b(?:live price feeds|continuous(?:ly)? (?:live|updated|real[- ]time) (?:feeds|data|prices)|real[- ]time price feeds)\b/i, reason: "Misleading continuous or live quote claim." },
    { test: /\b(?:no transaction fees|does not (?:simulate|charge|include) (?:virtual |real[- ]world )?transaction fees|omits? (?:real[- ]world )?(?:transaction )?fees|without (?:transaction )?fees or slippage)\b/i, reason: "TradeHQ charges a 0.1% virtual fee; do not claim fees are omitted." },
    { test: /\b(?:guarantee(?:s|d)? (?:future|profitable|returns|safety)|eliminat(?:e|es|ing) emotional bias|proves? (?:trading|investment) skill|certain profit)\b/i, reason: "Unsupported guaranteed outcomes or behavioural claims." },
    { test: /\b(?:TradeHQ (?:executes|supports|offers) (?:options|futures|limit orders|margin|short sales)|withdraw(?:able)? (?:real )?(?:profits|funds) from TradeHQ)\b/i, reason: "Misrepresents the simulator's supported products." },
  ];
  for (const p of prohibited) if (p.test.test(all)) issues.push(p.reason);
  const seen = new Set<string>();
  for (const [i, lesson] of doc.lessons.entries()) {
    const id = "Lesson " + (i + 1);
    const headCount = lesson.body.filter(s => s.trimStart().startsWith("## ")).length;
    if (lesson.body.length !== 12 || headCount !== 4 || lesson.body.some((s, n) => n % 3 === 0 ? !s.trimStart().startsWith("## ") : s.trimStart().startsWith("## ")))
      issues.push(id + ": use four substantive sections with two paragraphs each.");
    const paragraphs = lesson.body.filter(s => !s.trimStart().startsWith("## "));
    if (paragraphs.some(p => p.trim().split(/\s+/).length < 65))
      issues.push(id + ": a body paragraph is too brief to teach the concept.");
    if (!/\b(?:calculate|divide|multiply|subtract|sum|equals|computed|amount|percent|percentage)\b/i.test(prose[i]) || !/(?:\$\s?\d|\d+(?:\.\d+)?%)/.test(prose[i]))
      issues.push(id + ": missing a quantified worked example.");
    if (!/\b(?:practice|exercise|worksheet|debrief|try this|worked example)\b/i.test(prose[i]))
      issues.push(id + ": missing a concrete practice exercise or debrief.");
    if (!/\b(?:hypothetical|illustrative|assum(?:e|ing)|limitation|cannot|does not|may differ)\b/i.test(prose[i]))
      issues.push(id + ": missing stated assumptions or limitations.");
    for (const para of paragraphs) {
      const key = norm(para);
      if (key.length > 200 && seen.has(key)) issues.push(id + ": copied paragraph reused across lessons.");
      seen.add(key);
    }
    const sources = lesson.sources.map(s => s.url);
    if (new Set(sources).size < 2 || (allowedSources.length && sources.some(url => !allowedSources.includes(url))))
      issues.push(id + ": needs two distinct reachable, approved source URLs.");
    // Monetary-policy documentation is not evidence of simulator execution or
    // quote-feed mechanics. Require lesson-specific monetary context before use.
    if (sources.some(url => url.includes("federalreserve.gov/monetarypolicy"))
      && !/\b(?:federal reserve|monetary policy|interest rates|inflation|fomc|central bank)\b/i.test(prose[i]))
      issues.push(id + ": monetary-policy source is not relevant to the lesson.");
    const quizSeen = new Set<string>();
    for (const [j, question] of lesson.quiz.entries()) {
      const opts = question.options.map(norm);
      if (new Set(opts).size !== opts.length) issues.push(id + " quiz " + (j + 1) + ": duplicate answer choices.");
      const stem = norm(question.question);
      if (quizSeen.has(stem)) issues.push(id + ": duplicate quiz question.");
      quizSeen.add(stem);
      if (question.explanation.trim().length < 40) issues.push(id + " quiz " + (j + 1) + ": explanation lacks detail.");
    }
    // A course should never substitute a citation list for actual lessons.
    if (lesson.keyTakeaways.some(t => !t.trim()) || !lesson.summary.trim())
      issues.push(id + ": empty summary or takeaway.");
  }
  return [...new Set(issues)];
}
