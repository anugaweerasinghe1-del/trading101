import { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles, TrendingUp, BookOpen, Shield, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { SEOSection } from "@/components/SEOSection";
import { getAIReply, MENTOR_SUGGESTIONS } from "@/lib/smartMentor";
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
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm your **Smart Mentor** — a curated trading-knowledge engine built from real strategy, risk, and psychology lessons. Ask me anything about trading, or tap a topic below."
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
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const reply = await getAIReply(messageText, { history });
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
        <title>Smart Trading Mentor — Free Strategy, Risk & Psychology Coach | TradeHQ</title>
        <meta name="description" content="Chat with TradeHQ's Smart Mentor — a curated knowledge engine covering stop-losses, RSI, position sizing, psychology, crypto, ETFs and more. Free, instant, no signup." />
        <link rel="canonical" href="https://www.thetradehq.com/ai-mentor" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Smart Trading Mentor — Your Free Trading Coach | TradeHQ" />
        <meta property="og:description" content="Ask anything about trading, risk, psychology, or markets. Rule-based educational explanations. Free on TradeHQ." />
        <meta property="og:url" content="https://www.thetradehq.com/ai-mentor" />
        <meta property="og:image" content="https://www.thetradehq.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="TradeHQ" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Smart Trading Mentor — Your Free Trading Coach | TradeHQ" />
        <meta name="twitter:description" content="Ask anything about trading, risk, psychology, or markets. Rule-based educational explanations." />
        <meta name="twitter:image" content="https://www.thetradehq.com/og-image.png" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />

        <main className="flex-1 pt-24 pb-8 container mx-auto px-4 max-w-4xl flex flex-col">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-primary/10 border border-primary/20">
              <Brain className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Smart Trading Mentor</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Trading Mentor <span className="text-primary">— Curated Knowledge</span>
            </h1>
            <p className="text-muted-foreground">
              Educational answers — strategy, risk, psychology, technicals
            </p>
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
                  "An educational mentor using a labelled built-in library of authored answers and topic matching. It makes no AI API request. It explains trading concepts; it does not assess whether a real-money trade suits you.",
              },
              {
                question: "Can the AI Mentor predict prices?",
                answer:
                  "No. This chat matches questions to a built-in educational answer library. It does not read your journal or trade history, forecast prices or assess whether an investment suits you.",
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
