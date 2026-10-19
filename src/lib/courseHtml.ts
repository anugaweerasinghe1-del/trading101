import { validateCourseDocument, type CourseDocument } from "../../supabase/functions/_shared/courseDocument.js";
import { applyCourseEditorialCorrections } from "./courseEditorialCorrections.js";

export const escapeCourseHtml = (value: string) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const domain = "https://www.thetradehq.com";
export function renderApprovedCourse(shell: string, doc: CourseDocument, lessonSlug?: string) {
  if (validateCourseDocument(doc, true).length) throw new Error("Invalid published course.");
  doc = applyCourseEditorialCorrections(doc);
  const lesson = lessonSlug ? doc.lessons.find(l => l.slug === lessonSlug) : undefined;
  if (lessonSlug && !lesson) return null;
  const esc = escapeCourseHtml, title = (lesson?.title ?? doc.title) + " | TradeHQ";
  const description = lesson?.summary ?? doc.description;
  const url = domain + "/courses/" + doc.slug + (lesson ? "/" + lesson.slug : "");
  const editorial = doc.editorial ? '<p style="color:#9ca3af">Prepared with AI assistance · Publication review recorded by ' + esc(doc.editorial.reviewer)
    + ' · ' + esc(doc.editorial.reviewedAt.slice(0, 10)) + "</p>" : "";
  const list = (items: string[]) => "<ul>" + items.map(i => "<li>" + esc(i) + "</li>").join("") + "</ul>";
  const body = lesson
    ? lesson.body.map(p => p.startsWith("## ") ? "<h2>" + esc(p.slice(3)) + "</h2>" : '<p style="line-height:1.8">' + esc(p) + "</p>").join("")
      + "<h2>Key takeaways</h2>" + list(lesson.keyTakeaways) + "<h2>Sources</h2><ul>"
      + lesson.sources.map(s => '<li><a href="' + esc(s.url) + '">' + esc(s.label) + "</a></li>").join("") + "</ul>"
    : "<p>" + esc(doc.description) + "</p><h2>Learning outcomes</h2>" + list(doc.outcomes)
      + "<h2>Before you start</h2><p>" + esc(doc.prerequisites) + "</p><h2>How the lessons build</h2><p>"
      + esc(doc.progression) + "</p><h2>Who this course is not for</h2><p>" + esc(doc.notFor) + "</p><h2>Lessons</h2><ol>"
      + doc.lessons.map(l => '<li><a href="/courses/' + esc(doc.slug) + "/" + esc(l.slug) + '">' + esc(l.title) + "</a><p>" + esc(l.summary) + "</p></li>").join("") + "</ol>";
  const article = '<main style="max-width:820px;margin:0 auto;padding:48px 24px;color:#e5e7eb;background:#0a0a0f;font-family:system-ui"><nav><a href="/">TradeHQ</a> · <a href="/courses">Courses</a></nav><article><h1>'
    + esc(lesson?.title ?? doc.title) + "</h1>" + editorial + '<img src="' + esc(doc.hero) + '" alt="' + esc(doc.title + " — cover illustration") + '" width="1920" height="1080" style="width:100%;height:auto;border-radius:16px;margin:24px 0">' + body + '</article><p style="margin-top:40px">Educational only. Practice uses virtual cash; simulated performance does not predict real returns.</p></main>';
  const structured = lesson ? {
    "@context": "https://schema.org", "@type": "LearningResource", name: lesson.title, description: lesson.summary,
    url, learningResourceType: "Lesson", inLanguage: "en", isPartOf: { "@type": "Course", name: doc.title, url: domain + "/courses/" + doc.slug },
  } : { "@context": "https://schema.org", "@type": "Course", name: doc.title, description: doc.description,
    url, inLanguage: "en", provider: { "@type": "Organization", name: "TradeHQ", url: domain } };
  const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
  const head = "<title>" + esc(title) + '</title><meta data-static-head name="description" content="' + esc(description.slice(0, 155)) + '">'
    + '<meta data-static-head name="robots" content="index, follow"><link rel="canonical" href="' + esc(url) + '" data-static-head>'
    + '<meta data-static-head property="og:title" content="' + esc(title) + '"><meta data-static-head property="og:description" content="' + esc(description.slice(0, 155)) + '">'
    + '<meta data-static-head property="og:url" content="' + esc(url) + '"><script type="application/ld+json">' + safeJson(structured) + "</script>";
  return shell.replace(/<title>[\s\S]*?<\/title>/i, "").replace(/<meta\b[^>]*(?:name=["'](?:description|robots)["']|property=["']og:[^"']+["'])[^>]*>/gi, "")
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, "").replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "").replace(/<\/head>/i, head + "</head>")
    .replace(/<div\s+id=["']root["']>\s*<\/div>/i, '<div id="root">' + article + "</div>")
    .replace(/<\/body>/i, '<script id="approved-course-bootstrap" type="application/json">' + safeJson(doc) + "</script></body>");
}
