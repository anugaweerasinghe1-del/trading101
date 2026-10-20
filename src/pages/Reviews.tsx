import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Quote, MessageSquare, ThumbsUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { setPendingPath } from "@/lib/pendingRedirect";

interface Review {
  id: string;
  name: string | null;
  content: string;
  rating: number;
  is_featured: boolean;
  created_at: string;
  owner_reply: string | null;
  owner_reply_updated_at: string | null;
}
interface Engagement { count: number; liked: boolean }

const REVIEW_SUBMITTED_KEY = "tradehq:review-submitted:v1";

function Stars({ value, size = 16, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5" role={onChange ? "radiogroup" : undefined} aria-label="rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type={onChange ? "button" : undefined}
          onClick={onChange ? () => onChange(n) : undefined}
          disabled={!onChange}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={onChange ? "hover:scale-110 active:scale-95 transition-transform" : "cursor-default"}
        >
          <Star
            style={{ width: size, height: size }}
            className={n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}
          />
        </button>
      ))}
    </div>
  );
}

export default function Reviews() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const requestVersion = useRef(0);
  const authVersion = useRef(0);
  const pendingLikes = useRef(new Set<string>());
  const [engagement, setEngagement] = useState<Record<string, Engagement>>({});
  const [engagementError, setEngagementError] = useState(false);
  const [liking, setLiking] = useState<Record<string, boolean>>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(() => !!localStorage.getItem(REVIEW_SUBMITTED_KEY));

  const load = useCallback(async (quiet = false) => {
    const version = ++requestVersion.current;
    if (!quiet) setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, name, content, rating, is_featured, created_at, owner_reply, owner_reply_updated_at")
        .eq("is_visible", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      if (version !== requestVersion.current) return;
      setReviews(data ?? []);
      const result = await supabase.rpc("get_review_engagement", { p_review_ids: (data ?? []).map(r => r.id) });
      if (version !== requestVersion.current) return;
      setEngagementError(!!result.error);
      setEngagement(Object.fromEntries((result.error ? [] : result.data ?? []).map(r => [r.review_id, { count: Number(r.like_count), liked: r.liked_by_me }])));
    } catch (error) {
      console.error("Reviews load failed", error);
      if (version === requestVersion.current) {
        setReviews([]);
        setEngagement({});
        setLoadError("Reviews are temporarily unavailable. Please retry.");
      }
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    ++authVersion.current;
    setEngagement({});
    void load();
    const refresh = () => { if (!document.hidden && pendingLikes.current.size === 0) void load(true); };
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const invalidate = () => { ++requestVersion.current; ++authVersion.current; };
    return () => { invalidate(); clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [load, userId]);

  const toggleLike = async (review: Review) => {
    if (!user) { setPendingPath("/reviews"); navigate("/auth"); return; }
    if (pendingLikes.current.has(review.id)) return;
    const version = authVersion.current;
    ++requestVersion.current;
    pendingLikes.current.add(review.id);
    setLiking(prev => ({ ...prev, [review.id]: true }));
    try {
      const { data, error } = await supabase.rpc("set_review_like", { p_review_id: review.id, p_liked: !engagement[review.id]?.liked });
      if (version !== authVersion.current) return;
      if (error || !data?.[0]) throw error ?? new Error("Review unavailable");
      const result = data[0];
      setEngagement(prev => ({ ...prev, [review.id]: { count: Number(result.like_count), liked: result.liked_by_me } }));
    } catch {
      if (version === authVersion.current) { toast.error("Could not update your like. Please try again."); void load(true); }
    } finally {
      pendingLikes.current.delete(review.id);
      setLiking(prev => ({ ...prev, [review.id]: false }));
    }
  };

  const stats = useMemo(() => {
    if (!reviews.length) return { avg: 0, count: 0 };
    const sum = reviews.reduce((a, r) => a + r.rating, 0);
    return { avg: sum / reviews.length, count: reviews.length };
  }, [reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted) {
      toast.error("You've already submitted a review from this device.");
      return;
    }
    if (content.trim().length < 5) {
      toast.error("Review must be at least 5 characters.");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("submit-review", {
      body: { name: name.trim() || undefined, content: content.trim(), rating },
    });
    setSubmitting(false);
    if (error || (data as { error?: string })?.error) {
      const msg = (data as { error?: string })?.error ?? error?.message ?? "Submission failed";
      toast.error(msg);
      if (/already/i.test(msg)) {
        localStorage.setItem(REVIEW_SUBMITTED_KEY, "1");
        setSubmitted(true);
      }
      return;
    }
    localStorage.setItem(REVIEW_SUBMITTED_KEY, "1");
    setSubmitted(true);
    setName("");
    setContent("");
    setRating(5);
    toast.success("Thanks! Your review was submitted.");
    load();
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "TradeHQ Community Reviews",
    description: "User-submitted reviews of the TradeHQ educational trading simulator. Reviews are moderated but not independently verified.",
    url: "https://www.thetradehq.com/reviews",
  };

  return (
    <>
      <Helmet>
        <title>{`TradeHQ Community Reviews${stats.count > 0 ? ` — ${stats.count} submissions` : ""} | TradeHQ`}</title>
        <meta
          name="description"
          content={`Read user-submitted reviews of TradeHQ's educational trading simulator. Reviews are moderated but are not independently verified. ${stats.count > 0 ? `Visible submissions currently average ${stats.avg.toFixed(1)}/5.` : ""}`}
        />
        <link rel="canonical" href="https://www.thetradehq.com/reviews" />
        <meta name="robots" content="index, follow, max-snippet:-1" />
        <meta property="og:title" content="TradeHQ Reviews — What Traders Say" />
        <meta property="og:description" content="User-submitted community reviews of the TradeHQ educational simulator. Submissions are not independently verified." />
        <meta property="og:url" content="https://www.thetradehq.com/reviews" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />

        <main className="pt-24 pb-16 container mx-auto px-4 max-w-5xl">
          <header className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-primary/10 border border-primary/20">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary">Community Reviews</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-3">What Traders Say About TradeHQ</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              User-submitted feedback about the free $100,000 practice simulator. Submissions are moderated and duplicate-limited, but identity and usage are not independently verified.
            </p>
            {stats.count > 0 && (
              <div className="mt-5 inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-card border border-border">
                <Stars value={Math.round(stats.avg)} size={20} />
                <span className="font-bold text-lg tabular-nums">{stats.avg.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">from {stats.count} review{stats.count > 1 ? "s" : ""}</span>
              </div>
            )}
          </header>

          <div className="grid md:grid-cols-[1fr_360px] gap-6">
            {/* Reviews list */}
            <section aria-label="Reviews">
              {loading ? (
                <Card className="p-6 text-sm text-muted-foreground">Loading reviews…</Card>
              ) : loadError ? (
                <Card className="p-8 text-center">
                  <Quote className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">{loadError}</p>
                  <Button type="button" variant="outline" onClick={() => void load()}>Retry</Button>
                </Card>
              ) : reviews.length === 0 ? (
                <Card className="p-8 text-center">
                  <Quote className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">Be the first to review TradeHQ.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <Card key={r.id} className={`p-5 ${r.is_featured ? "border-primary/40 bg-primary/[0.03]" : ""}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Stars value={r.rating} />
                          {r.is_featured && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary uppercase tracking-wide font-semibold">
                              Featured
                            </span>
                          )}
                        </div>
                        <time className="text-xs text-muted-foreground" dateTime={r.created_at}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </time>
                      </div>
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">{r.content}</p>
                      <p className="text-sm text-muted-foreground mt-3">— {r.name || "Anonymous Trader"}</p>
                      {r.owner_reply && <div className="mt-4 border-l-2 border-primary/40 pl-4">
                        <p className="text-xs font-semibold text-primary">TradeHQ owner reply</p>
                        <p className="mt-1 text-sm whitespace-pre-wrap break-words">{r.owner_reply}</p>
                        {r.owner_reply_updated_at && <time className="text-xs text-muted-foreground" dateTime={r.owner_reply_updated_at}>{new Date(r.owner_reply_updated_at).toLocaleDateString()}</time>}
                      </div>}
                      <div className="mt-4 flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" disabled={authLoading || !!liking[r.id] || engagementError || engagement[r.id] === undefined}
                          aria-pressed={!!engagement[r.id]?.liked}
                          aria-label={`${user ? engagement[r.id]?.liked ? "Unlike" : "Like" : "Sign in to like"} review by ${r.name || "Anonymous Trader"}`}
                          onClick={() => void toggleLike(r)}>
                          <ThumbsUp className={`mr-2 h-4 w-4 ${engagement[r.id]?.liked ? "fill-primary/20 text-primary" : ""}`} />
                          {liking[r.id] ? "Saving…" : engagement[r.id]?.liked ? "Liked" : "Like"} · {engagement[r.id]?.count ?? "—"}
                        </Button>
                        <span className="text-xs text-muted-foreground">{engagementError ? "Likes unavailable. " : user ? "One like per account" : "Sign in to like"}
                          {engagementError && <button type="button" className="underline" onClick={() => void load(true)}>Retry</button>}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Submit form */}
            <aside className="md:sticky md:top-24 h-fit">
              <Card className="p-5">
                <h2 className="font-semibold mb-1">Share your experience</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Duplicate submissions are limited using browser/server abuse controls. Name is optional; reviews are not independently verified.
                </p>

                {submitted ? (
                  <div className="text-sm text-muted-foreground p-4 rounded-lg bg-muted/30 text-center">
                    Thanks — you've already submitted your review.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Your rating</label>
                      <Stars value={rating} size={24} onChange={setRating} />
                    </div>
                    <div>
                      <label htmlFor="review-name" className="text-xs text-muted-foreground mb-1 block">Name (optional)</label>
                      <Input id="review-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Anonymous" />
                    </div>
                    <div>
                      <label htmlFor="review-content" className="text-xs text-muted-foreground mb-1 block">Your review</label>
                      <Textarea
                        id="review-content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={5}
                        maxLength={1000}
                        placeholder="What did you think of TradeHQ?"
                        required
                      />
                      <p className="text-[10px] text-muted-foreground mt-1 text-right">{content.length}/1000</p>
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full active:scale-[0.97]">
                      {submitting ? "Submitting…" : "Submit review"}
                    </Button>
                  </form>
                )}
              </Card>
            </aside>
          </div>
          <EducationalDisclaimer variant="footer" className="mb-10" />
        </main>
      </div>
    </>
  );
}
