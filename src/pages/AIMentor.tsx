import { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles, TrendingUp, BookOpen, Shield, Brain } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useCourseDocument } from "@/hooks/useCourseCatalog";
import { getMentorTeachingReply, type MentorLevel, type MentorLessonContext } from "@/lib/mentorTeaching";
import { SEOSection } from "@/components/SEOSection";
import { MENTOR_SUGGESTIONS } from "@/lib/smartMentor";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_ICONS = [TrendingUp, BookOpen, Shield, Sparkles, Brain, Bot];
const SUGGESTED_QUESTIONS = MENTOR_SUGGESTIONS.map((text, i) => ({
  icon: SUGGESTED_ICONS[i % SUGGESTED_ICONS.length],
  text,
}));

export default function AIMentor() {
  const [searchParams] = useSearchParams();
  const rawTrackSlug = searchParams.get("track") ?? "";
  const trackSlug = /^[a-z0-9-]{1,90}$/.test(rawTrackSlug) ? rawTrackSlug : undefined;
  const rawLessonSlug = searchParams.get("lesson") ?? "";
  const lessonSlug = /^[a-z0-9-]{1,90}$/.test(rawLessonSlug) ? rawLessonSlug : undefined;
  const { track, isPending: lessonPending } = useCourseDocument(trackSlug);
  const lesson = track?.lessons.find(item => item.slug === lessonSlug);
  const rawQuestion = searchParams.get("question");
  const questionIndex = rawQuestion !== null && /^\d{1,2}$/.test(rawQuestion) ? Number(rawQuestion) : -1;
  const quiz = questionIndex >= 0 ? lesson?.quiz[questionIndex] : undefined;
  const lessonContext: MentorLessonContext | undefined = track && lesson ? {
    trackTitle: track.title,
    lessonTitle: lesson.title,
    summary: lesson.summary,
    takeaways: lesson.keyTakeaways,
    workedExample: lesson.body.find(paragraph => /\b(example|imagine|suppose|hypothetical)\b/i.test(paragraph))?.slice(0, 900),
    quiz: quiz ? { question: quiz.question, explanation: quiz.explanation } : undefined,
  } : undefined;
  const [level, setLevel] = useState<MentorLevel>("Beginner");
  useEffect(() => { if (track?.level) setLevel(track.level); }, [track?.level]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Ask about a term from a lesson, such as drawdown or slippage, or choose a question below. The mentor explains supported concepts with built-in examples."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const reply = getMentorTeachingReply(messageText, level, lessonContext);
    setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      <Helmet>
        <title>Rule-Based Trading Learning Mentor — Educational Explanations | TradeHQ</title>
        <meta name="description" content="Ask educational trading questions using a built-in authored-answer library and topic matching. No live AI model, investment recommendations or price predictions." />
        <link rel="canonical" href="https://www.thetradehq.com/ai-mentor" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Rule-Based Trading Mentor — Educational Answers | TradeHQ" />
        <meta property="og:description" content="Explore supported trading concepts using a predefined answer library. No live AI model, market predictions or personal advice." />
        <meta property="og:url" content="https://www.thetradehq.com/ai-mentor" />
        <meta property="og:image" content="https://www.thetradehq.com/tradehq-preview-2026.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="TradeHQ" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Rule-Based Trading Mentor — Educational Answers | TradeHQ" />
        <meta name="twitter:description" content="Built-in educational answers and topic matching. No live AI model, price prediction or personal advice." />
        <meta name="twitter:image" content="https://www.thetradehq.com/tradehq-preview-2026.png" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />

        <main className="flex-1 pt-24 pb-8 container mx-auto px-4 max-w-4xl flex flex-col">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-primary/10 border border-primary/20">
              <Brain className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Rule-based Learning Mentor</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Trading Mentor <span className="text-primary">— Curated Knowledge</span>
            </h1>
            <p className="text-muted-foreground">
              Built-in educational answers about risk, trading mechanics and psychology — not a live AI assistant
            </p>
          </div>

          {/* Lessons are retrieved from approved public course documents, not query-string text. */}
          {trackSlug && (
            <section aria-label="Current lesson help" className="mb-5 rounded-xl border border-border bg-muted/30 p-4 text-sm">
              {lessonPending && !lesson ? <p role="status">Loading approved lesson context…</p> : lesson && track ? (
                <>
                  <p className="font-semibold">Studying: {lesson.title}</p>
                  <p className="text-muted-foreground mt-1">{track.title} · {track.level} course</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <Button type="button" size="sm" variant="outline" onClick={() => void sendMessage(quiz ? "Explain this quiz answer" : "Explain this lesson in simple words")}>
                      {quiz ? "Explain my quiz question" : "Explain this lesson"}
                    </Button>
                    <Link className="text-primary underline underline-offset-4" to={`/courses/${track.slug}/${lesson.slug}`}>Return to lesson</Link>
                  </div>
                </>
              ) : <p role="status">That lesson is unavailable or not published. You can still ask about supported trading concepts.</p>}
            </section>
          )}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label htmlFor="mentor-explanation-level" className="text-sm font-medium">Explanation depth</label>
            <select id="mentor-explanation-level" value={level} onChange={event => setLevel(event.target.value as MentorLevel)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground min-h-11">
              <option value="Beginner">Beginner · plain language</option>
              <option value="Intermediate">Intermediate · application</option>
              <option value="Advanced">Advanced · assumptions</option>
            </select>
            <span className="text-xs text-muted-foreground">You choose your level; no proficiency is inferred.</span>
          </div>
          {/* Chat Area */}
          <Card className="flex-1 flex flex-col glass-panel border-white/10 overflow-hidden animate-scale-in">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 animate-fade-in ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted/50 text-foreground rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                        {isLoading && index === messages.length - 1 && message.role === "assistant" && !message.content && (
                          <span className="inline-flex gap-1 ml-1">
                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </span>
                        )}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-secondary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Suggested Questions */}
            {messages.length <= 1 && (
              <div className="p-4 border-t border-white/5">
                <p className="text-xs text-muted-foreground mb-3">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 rounded-full hover:bg-primary/10 hover:border-primary/30 transition-all animate-fade-in"
                      style={{ animationDelay: `${i * 100}ms` }}
                      onClick={() => sendMessage(q.text)}
                    >
                      <q.icon className="w-3 h-3" />
                      {q.text}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/5">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  aria-label="Trading concept question"
                  placeholder="Ask about trading, stocks, crypto..."
                  className="flex-1 bg-muted/30 border-white/10 rounded-xl focus:border-primary/50"
                  disabled={isLoading}
                />
                <Button 
                  type="submit"
                  aria-label="Send concept question"
                  size="icon" 
                  className="rounded-xl bg-primary hover:bg-primary/90"
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Card>

          {/* Quick Links Footer for SEO */}
          <nav aria-label="Quick navigation" className="mt-8 border-t border-border/50 pt-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Quick Links</h2>
            <div className="flex flex-wrap gap-2">
              <Link to="/" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">Home</Link>
              <Link to="/markets" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">Markets Hub</Link>
              <Link to="/portfolio" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">Portfolio</Link>
              <Link to="/learn" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">Learning Center</Link>
              <Link to="/trade" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all">Trade Now</Link>
            </div>
          </nav>

          <SEOSection
            path="/ai-mentor"
            faqHeading="AI Mentor"
            breadcrumbs={[{ label: "AI Mentor" }]}
            faqs={[
              {
                question: "What is the TradeHQ AI Mentor?",
                answer:
                  "An educational mentor using a built-in library of authored answers and topic matching. Open it from a published lesson or quiz to use that context and choose an explanation level. It makes no AI API request or real-money trade recommendations.",
              },
              {
                question: "Can the AI Mentor predict prices?",
                answer:
                  "No. This chat uses predefined explanations and approved public lesson text when opened from a lesson. It does not read your private journal or trade history, forecast prices or assess whether an investment suits you.",
              },
              {
                question: "Is the AI Mentor free?",
                answer:
                  "Yes — it is included free with every TradeHQ account, no signup or payment required.",
              },
              {
                question: "What questions should I ask?",
                answer:
                  "Try things like: 'Explain stop-loss orders', 'What is dollar-cost averaging?', 'How do I manage risk on a $100K portfolio?', or 'Walk me through a candlestick pattern'.",
              },
            ]}
          />
          <EducationalDisclaimer variant="footer" className="mb-10" />
        </main>
      </div>
    </>
  );
}
