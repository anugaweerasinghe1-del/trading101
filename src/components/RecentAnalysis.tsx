import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  sentiment: string;
  created_at: string;
  updated_at: string;
  content: string;
}

export function RecentAnalysis({ focusAsset }: { focusAsset: string }) {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('market_articles')
        .select('id, title, slug, sentiment, created_at, updated_at, content')
        .eq('focus_asset', focusAsset.toLowerCase())
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) setArticles(data);
    }
    load();
  }, [focusAsset]);

  if (articles.length === 0) return null;

  const SentimentIcon = ({ s }: { s: string }) => {
    if (s === 'Bullish') return <TrendingUp className="w-3.5 h-3.5 text-profit" />;
    if (s === 'Bearish') return <TrendingDown className="w-3.5 h-3.5 text-loss" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  return (
    <section className="mt-6 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08]" style={{ backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-[hsl(var(--neon))]" />
        <h2 className="text-base font-bold text-foreground tracking-tight">Recent Analysis</h2>
      </div>
      <div className="grid gap-3">
        {articles.map(a => (
          <article key={a.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-[hsl(var(--neon)/0.3)] transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">{a.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {a.content.slice(0, 120)}...
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <SentimentIcon s={a.sentiment} />
                <span className={`text-[10px] font-semibold ${
                  a.sentiment === 'Bullish' ? 'text-profit' : a.sentiment === 'Bearish' ? 'text-loss' : 'text-muted-foreground'
                }`}>
                  {a.sentiment}
                </span>
              </div>
            </div>
            <time className="text-[10px] text-muted-foreground/60 mt-2 block">
              {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </time>

            {/* Generic Article JSON-LD: these CMS entries are analysis, not necessarily news. */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": a.title,
              "datePublished": a.created_at,
              "dateModified": a.updated_at,
              "author": { "@type": "Organization", "name": "TradeHQ" },
              "publisher": {
                "@type": "Organization",
                "name": "TradeHQ",
                "logo": { "@type": "ImageObject", "url": "https://www.thetradehq.com/logo.png" }
              },
              "description": a.content.slice(0, 160),
            }) }} />
          </article>
        ))}
      </div>
    </section>
  );
}
