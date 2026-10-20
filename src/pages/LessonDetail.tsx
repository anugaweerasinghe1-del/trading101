import NotFound from "./NotFound";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Quote, TrendingUp, Sparkles } from "lucide-react";
import { useState } from "react";
import { lessonData } from "@/lib/lessonData";
import { Quiz } from "@/components/Quiz";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";

// Eagerly import every lesson image so Vite fingerprints them and the src
// resolves in prod (raw `/src/assets/*` paths would 404 after build).
const LESSON_IMAGE_MODULES = import.meta.glob("@/assets/lesson-*.jpg", {
  eager: true,
  import: "default",
}) as Record<string, string>;

function resolveLessonImage(raw: string): string {
  const filename = raw.split("/").pop() ?? "";
  const match = Object.entries(LESSON_IMAGE_MODULES).find(([k]) => k.endsWith("/" + filename));
  return match ? match[1] : raw;
}

export default function LessonDetail() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [currentSubtopic, setCurrentSubtopic] = useState(0);
  const [completedSubtopics, setCompletedSubtopics] = useState<Set<number>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);

  const lesson = lessonData.find((l) => l.id === Number(lessonId));

  if (!lesson) return <NotFound />;

  const progress = (completedSubtopics.size / lesson.subtopics.length) * 100;
  const currentTopic = lesson.subtopics[currentSubtopic];

  const handleComplete = () => {
    const newCompleted = new Set(completedSubtopics);
    newCompleted.add(currentSubtopic);
    setCompletedSubtopics(newCompleted);

    if (currentSubtopic < lesson.subtopics.length - 1) {
      setCurrentSubtopic(currentSubtopic + 1);
    } else {
      setShowQuiz(true);
    }
  };

  const handleQuizComplete = (score: number) => {
    console.log("Quiz completed with score:", score);
    navigate("/learn");
  };

  if (showQuiz) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-6 max-w-4xl">
            <Quiz lesson={lesson} onComplete={handleQuizComplete} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{lesson.title} — Free Trading Course | TradeHQ</title>
        <meta name="description" content={`Learn ${lesson.title.toLowerCase()}. ${lesson.description} Free interactive course with quiz.`} />
        <link rel="canonical" href={`https://www.thetradehq.com/learn/${lessonId}`} />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Header */}
          <div className="mb-12 animate-fade-in">
            <Button
              variant="ghost"
              onClick={() => navigate("/learn")}
              className="mb-8 hover:bg-primary/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lessons
            </Button>

            <div className="mb-8">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm">
                {lesson.category}
              </Badge>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight">{lesson.title}</h1>
              <p className="text-2xl text-muted-foreground leading-relaxed max-w-4xl">
                {lesson.description}
              </p>
            </div>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Subtopic {currentSubtopic + 1} of {lesson.subtopics.length}
                </span>
                <span className="text-sm font-semibold">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-3" />
            </Card>
          </div>

          <aside className="mb-8 rounded-xl border border-border p-4 text-sm text-muted-foreground">
            <p>TradeHQ publishes these AI-assisted educational lessons with source and calculation checks. This is not professional certification or a personalized investment assessment. Examples use invented inputs unless stated otherwise.</p>
            <p className="mt-2">Sources for this lesson:</p>
            <ul className="mt-1 space-y-1">{lesson.references?.map(reference => <li key={reference.href}><a className="underline" href={reference.href} target="_blank" rel="noopener noreferrer">{reference.label}</a></li>)}</ul>
          </aside>
          {/* Subtopic Navigation */}
          <div className="flex gap-3 mb-12 overflow-x-auto pb-4 scrollbar-hide">
            {lesson.subtopics.map((subtopic, index) => (
              <Button
                key={index}
                variant={currentSubtopic === index ? "default" : "outline"}
                size="lg"
                onClick={() => setCurrentSubtopic(index)}
                className="flex-shrink-0 font-medium px-6"
              >
                {completedSubtopics.has(index) && (
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                )}
                {subtopic.title}
              </Button>
            ))}
          </div>

          {/* Content */}
          <Card className="p-5 sm:p-8 md:p-16 mb-12 bg-gradient-to-br from-card/40 via-card/30 to-transparent backdrop-blur-xl border-0 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-12 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-lg">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{currentTopic.title}</h2>
              </div>

              <div className="space-y-10 max-w-4xl">
                {currentTopic.content.map((section, index) => (
                  <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    {section.type === "text" && (
                      <p className="text-xl leading-relaxed text-foreground/90">
                        {section.data}
                      </p>
                    )}

                  {section.type === "heading" && (
                    <h3 className="text-3xl font-bold mt-12 mb-6">{section.data}</h3>
                  )}

                  {section.type === "list" && (
                    <ul className="space-y-4 ml-2">
                      {(section.data as string[]).map((item, i) => (
                        <li key={i} className="flex items-start gap-4 text-lg">
                          <div className="w-2 h-2 rounded-full bg-primary mt-3 flex-shrink-0" />
                          <span className="text-foreground/80">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.type === "image" && (
                    <div className="my-12 rounded-3xl overflow-hidden shadow-2xl hover-lift relative group">
                      <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      <img
                        src={resolveLessonImage(section.data as string)}
                        alt={section.alt || "Lesson visual"}
                        loading="lazy"
                        className="w-full h-auto transform group-hover:scale-105 transition-transform duration-700"
                      />
                      {section.caption && (
                        <div className="relative bg-gradient-to-r from-primary/10 to-accent/10 p-6 border-t border-primary/20">
                          <p className="text-lg text-foreground font-medium text-center">
                            {section.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {section.type === "example" && (
                    <Card className="p-8 bg-primary/5 border-primary/20 backdrop-blur-sm">
                      <h4 className="font-bold text-2xl mb-4 flex items-center gap-3">
                        <span className="text-3xl">💡</span> Example
                      </h4>
                      <p className="text-lg text-foreground/80 leading-relaxed">{section.data}</p>
                    </Card>
                  )}

                  {section.type === "tip" && (
                    <Card className="p-8 bg-gradient-to-br from-accent/30 to-accent/10 border-accent/30 backdrop-blur-sm hover-lift">
                      <h4 className="font-bold text-2xl mb-4 flex items-center gap-3">
                        <Sparkles className="w-7 h-7 text-accent" /> Pro Tip
                      </h4>
                      <p className="text-lg text-foreground/80 leading-relaxed">{section.data}</p>
                    </Card>
                  )}

                  {section.type === "quote" && (
                    <Card className="p-10 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/30 backdrop-blur-xl hover-lift relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                      <Quote className="w-12 h-12 text-primary/40 mb-6" />
                      <blockquote className="text-2xl md:text-3xl font-serif italic leading-relaxed mb-6 text-foreground">
                        "{section.data}"
                      </blockquote>
                      {section.author && (
                        <p className="text-lg text-primary font-semibold">— {section.author}</p>
                      )}
                    </Card>
                  )}

                  {section.type === "stat" && (
                    <Card className="p-10 bg-gradient-gold border-0 backdrop-blur-xl hover-lift relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative">
                        <TrendingUp className="w-10 h-10 text-primary mb-4 animate-pulse" />
                        <div className="text-3xl sm:text-5xl md:text-6xl font-bold text-gradient-gold mb-3">
                          {section.value}
                        </div>
                        <div className="text-xl font-semibold text-primary mb-4">
                          {section.label}
                        </div>
                        <p className="text-lg text-foreground/70 leading-relaxed">
                          {section.data}
                        </p>
                      </div>
                    </Card>
                  )}

                  {section.type === "highlight" && (
                    <Card className="p-8 bg-gradient-to-r from-primary/20 via-accent/15 to-primary/20 border-primary/40 backdrop-blur-sm hover-lift relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Sparkles className="w-6 h-6 text-primary mb-3 relative" />
                      <p className="text-xl font-semibold leading-relaxed relative">{section.data}</p>
                    </Card>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 mb-12">
            <Button
              variant="outline"
              onClick={() => setCurrentSubtopic(Math.max(0, currentSubtopic - 1))}
              disabled={currentSubtopic === 0}
              size="lg"
              className="px-8"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Previous
            </Button>

            <Button onClick={handleComplete} size="lg" className="px-8 text-lg">
              {currentSubtopic === lesson.subtopics.length - 1 ? "Take Quiz" : "Continue"}
              {currentSubtopic < lesson.subtopics.length - 1 && (
                <ArrowRight className="w-5 h-5 ml-2" />
              )}
            </Button>
          </div>

          {/* Quick Links Footer for SEO */}
          <nav aria-label="Quick navigation" className="border-t border-border/50 pt-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Quick Links</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">Home</Link>
              <Link to="/markets" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">Markets</Link>
              <Link to="/portfolio" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">Portfolio</Link>
              <Link to="/learn" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">All Courses</Link>
              <Link to="/trade" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all">Practice Trading</Link>
            </div>
          </nav>
        </div>
        <EducationalDisclaimer variant="footer" className="mb-10" />
      </main>
    </div>
    </>
  );
}
