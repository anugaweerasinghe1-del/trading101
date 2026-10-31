/**
 * Shared route manifest — the single source of truth for:
 *   - public/sitemap.xml   (generate-sitemap.ts)
 *   - dist/<route>/index.html prerender (prerender.ts)
 *   - verify-seo.js
 *
 * Each route carries the SEO metadata that gets baked into its raw HTML
 * so search engines see a real title / description / canonical / H1 /
 * body copy BEFORE JavaScript executes.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { tradingGlossary } from "../src/lib/tradingGlossary";
import { LEARN_ARTICLES } from "../src/lib/learnArticles";
import { lessonData } from "../src/lib/lessonData";
import { COMPARE_PAIRS, HOWTO_ASSETS, STRATEGIES } from "../src/lib/seoData";
import { starterPracticeBank } from "../src/lib/dailyPracticeBank";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DOMAIN = "https://www.thetradehq.com";
export const TODAY = new Date().toISOString().split("T")[0];
export const BALANCE = "$100,000";

const SECTOR_ROUTES = [
  { slug: "ai-tech", name: "AI & Technology" },
  { slug: "crypto-defi", name: "Crypto & DeFi" },
  { slug: "mega-cap", name: "Mega-Cap Leaders" },
  { slug: "tech-giants", name: "Tech Giants" },
  { slug: "forex-currencies", name: "Forex & Currencies" },
  { slug: "commodities", name: "Commodities" },
  { slug: "etf-indices", name: "ETFs & Indices" },
] as const;

export interface RouteMeta {
  path: string;                // "/wiki/macd"
  title: string;               // <title>
  description: string;         // <meta name="description">
  h1: string;                  // primary visible heading
  summary: string;             // 1-3 sentence prose visible to crawlers
  changefreq?: string;
  priority?: string;
  keywords?: string;
  /** Excluded from the sitemap and served with robots: noindex. */
  noindex?: boolean;
}


function readSrc(rel: string): string {
  return fs.readFileSync(path.resolve(__dirname, "..", rel), "utf-8");
}

function extractAssetIds(): string[] {
  const src = readSrc("src/lib/assets.ts");
  return (src.match(/id:\s*['"]([^'"]+)['"]/g) || [])
    .map((m) => m.replace(/id:\s*['"]/, "").replace(/['"]$/, ""));
}

function extractAssets(): { id: string; name: string; symbol: string }[] {
  const src = readSrc("src/lib/assets.ts");
  const results: { id: string; name: string; symbol: string }[] = [];
  const re = /id:\s*['"]([^'"]+)['"][\s\S]*?symbol:\s*['"]([^'"]+)['"][\s\S]*?name:\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    results.push({ id: m[1], symbol: m[2], name: m[3] });
  }
  return results;
}

function extractAssetContentKeys(): string[] {
  const src = readSrc("src/lib/assetContent.ts");
  const start = src.indexOf("export const ASSET_CONTENT");
  if (start < 0) return [];
  const block = src.slice(start);
  // Top-level keys are indented by exactly two spaces inside the object literal.
  return (block.match(/^  ([a-z0-9]+):\s*\{/gm) || []).map((m) =>
    m.trim().replace(/:\s*\{$/, "")
  );
}

/**
 * Assets that carry authored Q&A on top of the editorial block. Only these
 * carry enough genuinely unique writing to be worth indexing; the rest stay
 * reachable in-app but noindex, so we never ship near-duplicate pages.
 */
function extractAssetFaqKeys(): string[] {
  const src = readSrc("src/lib/assetContent.ts");
  const start = src.indexOf("ASSET_FAQS");
  if (start < 0) return [];
  const block = src.slice(start);
  return (block.match(/^  ([a-z0-9]+):\s*\[/gm) || []).map((m) =>
    m.trim().replace(/:\s*\[$/, "")
  );
}


function firstCompleteSentence(text: string): string {
  const match = text.trim().match(/^(.+?[.!?])(?:\s|$)/);
  return match ? match[1] : text.trim();
}

function humanizeSlug(slug: string): string {
  const acronyms = new Set(["macd", "rsi", "etf", "etfs", "btc", "eth", "ai"]);
  return slug
    .split("-")
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === "vs") return "vs";
      if (acronyms.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function extractGlossary(): { slug: string; term: string; definition: string }[] {
  return tradingGlossary.map(({ slug, term, definition }) => ({ slug, term, definition }));
}

function extractLearnArticles(): { slug: string; title: string; metaDescription: string; summary: string }[] {
  return LEARN_ARTICLES.map(({ slug, title, metaDescription, summary }) => ({ slug, title, metaDescription, summary }));
}

function extractNicheSymbols(): string[] {
  const src = readSrc("src/lib/nicheData.ts");
  const match = src.match(/export const NICHE_SYMBOLS:[^=]*=\s*\[([\s\S]*?)\];/);
  if (!match) return [];
  const symbols = new Set<string>();
  const re = /["']([A-Z0-9-]{2,12})["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(match[1])) !== null) symbols.add(m[1]);
  return Array.from(symbols);
}

function extractSeoDataList(constName: "COMPARE_PAIRS" | "HOWTO_ASSETS" | "STRATEGIES"): { slug?: string; symbol?: string; title?: string; name?: string; fullName?: string; intro?: string; whyTrade?: string; hook?: string }[] {
  return { COMPARE_PAIRS, HOWTO_ASSETS, STRATEGIES }[constName];
}

function extractCourses(): { slug: string; title: string; tagline: string; lessons: { slug: string; title: string; summary: string }[] }[] {
  const src = readSrc("src/lib/coursesData.ts");
  const tracks: { slug: string; title: string; tagline: string; lessons: { slug: string; title: string; summary: string }[] }[] = [];
  const trackRe = /slug:\s*"([^"]+)",\s*\n\s*title:\s*"([^"]+)",\s*\n\s*tagline:\s*"([^"]+)"/g;
  let tm: RegExpExecArray | null;
  const trackStarts: { slug: string; title: string; tagline: string; index: number }[] = [];
  while ((tm = trackRe.exec(src)) !== null) {
    trackStarts.push({ slug: tm[1], title: tm[2], tagline: tm[3], index: tm.index });
  }
  for (let i = 0; i < trackStarts.length; i++) {
    const t = trackStarts[i];
    const end = i + 1 < trackStarts.length ? trackStarts[i + 1].index : src.length;
    const block = src.slice(t.index, end);
    const lessonRe = /slug:\s*"([^"]+)",\s*\n\s*title:\s*"([^"]+)",\s*\n\s*summary:\s*"([^"]+)"/g;
    const lessons: { slug: string; title: string; summary: string }[] = [];
    let lm: RegExpExecArray | null;
    while ((lm = lessonRe.exec(block)) !== null) {
      lessons.push({ slug: lm[1], title: lm[2], summary: lm[3] });
    }
    tracks.push({ slug: t.slug, title: t.title, tagline: t.tagline, lessons });
  }
  return tracks;
}

export function buildRoutes(): RouteMeta[] {
  const routes: RouteMeta[] = [];

  // ---- Core pages ----
  routes.push({
    path: "/",
    title: "TradeHQ — Free Paper Trading Simulator | $100K Virtual Cash (No Signup)",
    description: `Practice stock, crypto, ETF, forex & commodities trading with ${BALANCE} virtual cash. No signup. AI mentor, simulated charts, portfolio tracking & 170 assets. Free educational trading simulator.`,
    h1: "TradeHQ — Free Paper Trading Simulator",
    summary: `Practice simulated trading across 170 assets with ${BALANCE} in virtual cash. No real money is involved. Learn order mechanics, portfolio tracking, and risk concepts across stocks, crypto, ETFs, forex and commodities.`,
    priority: "1.0",
    changefreq: "daily",
  });

  routes.push({
    path: "/trade",
    title: "Paper Trade 170 Assets — Free Simulator | TradeHQ",
    description: `Buy and sell 170 stocks, crypto, ETFs, forex and commodities with ${BALANCE} in virtual cash. No signup or real-money trading. Educational simulation only.`,
    h1: "Paper Trade 170 Assets",
    summary: `Choose from 170 simulated assets and place buy or sell orders instantly. Every account starts with ${BALANCE} in virtual cash. Educational simulation — no real money and no brokerage relationship.`,
    priority: "0.9",
    changefreq: "daily",
  });

  routes.push({
    path: "/markets",
    title: "Practice Markets — Stocks, Crypto, ETFs, Forex | TradeHQ",
    description: `Browse 170 simulated markets across stocks, crypto, ETFs, forex and commodities. Practice trading with ${BALANCE} virtual cash — free, no signup.`,
    h1: "Markets Overview",
    summary: `Browse 170 simulated markets across major asset classes. Explore movers, sentiment-style indicators and sector groupings, then practise with ${BALANCE} virtual cash. Data may be simulated or delayed and is for education only.`,
    priority: "0.9",
    changefreq: "daily",
  });

  // Sector hubs stay reachable in-app but are explicitly governed here and
  // excluded from indexing until each route passes the same authored-content review.
  for (const sector of SECTOR_ROUTES) {
    routes.push({
      path: `/sectors/${sector.slug}`,
      title: `${sector.name} Practice Hub | TradeHQ`,
      description: `Browse simulated ${sector.name.toLowerCase()} assets and open matching practice pages. Educational simulation only.`,
      h1: sector.name,
      summary: `A simulator hub for ${sector.name.toLowerCase()} assets. Values on the hub are catalogue references; asset pages label their current data status.`,
      changefreq: "weekly",
      noindex: true,
    });
  }

  routes.push({
    path: "/portfolio",
    title: "Your Practice Portfolio — Positions, P&L, Analytics | TradeHQ",
    description: `Track simulated positions, realised and unrealised P&L, max drawdown, open-position P&L dispersion and allocation snapshots. Free practice portfolio seeded with ${BALANCE}.`,
    h1: "Practice Portfolio",
    summary: `Review simulated positions, trades, P&L, drawdown and allocation snapshots. Guest records stay in your browser; account cash, positions and server-recorded trades restore when the service is available. Server-recorded account trades restore across devices; earlier guest history and journals remain browser-held.`,
    priority: "0.8",
    changefreq: "daily",
  });

  routes.push({
    path: "/start",
    title: "Start Here — Beginner Practice Trading Journey | TradeHQ",
    description: "Learn how virtual trading works, practise an order, understand its costs, review your portfolio and continue with daily exercises.",
    h1: "Your First Virtual Trade, Explained",
    summary: "A guided five-step educational exercise: understand the order and fees, place a voluntary simulated trade, review cash and holdings, reflect, and continue with Daily Practice. No account or real money is required. Progress is stored in your browser.",
    priority: "0.8",
    changefreq: "weekly",
  });

  routes.push({
    path: "/learn",
    title: "Learn to Trade — Free Lessons, Guides & Glossary | TradeHQ",
    description: `Free trading lessons, glossary, and step-by-step guides for beginners. Learn stocks, crypto and technical analysis, then practice with ${BALANCE} virtual cash.`,
    h1: "Learn to Trade",
    summary: `Structured lessons, a ${tradingGlossary.length}-term glossary, and long-form guides on stocks, crypto, ETFs and technical analysis. Supported spot mechanics can be explored in the simulator; derivatives and unsupported indicators use separate conceptual worksheets.`,
    priority: "0.9",
    changefreq: "weekly",
  });

  routes.push({
    path: "/learn-trading-guide",
    title: "Beginner Trading Practice Guide | TradeHQ",
    description: `Study simulated market orders, fees, price observations and record-keeping, with ${BALANCE} in virtual practice funds. Not a complete investing course.`,
    h1: "Beginner Trading Practice Guide",
    summary: `An introduction to the virtual practice dashboard, order mechanics and a worked buy/sell-fee example. Links to longer courses and reference material; ${BALANCE} is simulated money, not an investment account.`,
    priority: "0.9",
    changefreq: "weekly",
  });

  routes.push({
    path: "/leaderboard",
    title: "Trader Leaderboard — Top Practice Portfolios | TradeHQ",
    description: `Community practice board for public TradeHQ accounts. Ranked portfolios use server-recorded simulated trades, cached provider quotes or fixed simulator prices. Earlier browser-reported summaries appear separately as previous results.`,
    h1: "Trader Leaderboard",
    summary: `New accounts start public and can switch private. All public members appear without a minimum trade count. Comparable portfolios receive practice ranks after their first server-recorded trade. Held asset prices are refreshed in the background, with quote age and simulation labels. Previous browser-reported results are labelled separately from current rankings; practice results are not audited investment returns.`,
    priority: "0.7",
    changefreq: "daily",
  });

  routes.push({
    path: "/ai-mentor",
    title: "AI Trading Mentor — Free Practice Coach | TradeHQ",
    description: `Ask educational trading questions using a built-in answer library and local topic matching. This chat makes no AI API request.`,
    h1: "AI Trading Mentor",
    summary: `Ask the mentor about trading concepts. This chat uses a built-in answer library and local topic matching, with no AI API request. Answers can miss your question and are educational only. Practice what you learn on the free simulator with ${BALANCE} virtual cash.`,
    priority: "0.7",
    changefreq: "weekly",
  });

  routes.push({
    path: "/daily",
    title: "Daily Trading Challenge — Build Your Streak | TradeHQ",
    description: `A quick daily scenario plus 8–12 minute case study with visuals, ${starterPracticeBank.exercises[0].questions.length} linked questions and worked answers. Learn from ${starterPracticeBank.exercises.length} rotating exercises for free.`,
    h1: "Daily Trading Challenge",
    summary: `Practise a quick scenario or go deeper with a hypothetical case, labelled visual, ${starterPracticeBank.exercises[0].questions.length} linked questions and worked explanations. ${starterPracticeBank.exercises.length} exercises rotate; new banks are prepared every two months and wait for owner approval. Answers stay on this browser.`,
    priority: "0.9",
    changefreq: "daily",
  });

  routes.push({
    path: "/reviews",
    title: "TradeHQ Reviews — What Traders Are Saying | TradeHQ",
    description: `Read honest reviews from TradeHQ practice traders. Free educational simulator with ${BALANCE} virtual cash — no signup.`,
    h1: "TradeHQ Reviews",
    summary: `Community-submitted reviews of the TradeHQ practice simulator. Submissions are moderated and duplicate-limited but are not independently verified.`,
    priority: "0.6",
    changefreq: "weekly",
  });

  routes.push({
    path: "/roadmap",
    title: "TradeHQ Roadmap — What's Shipping Next | TradeHQ",
    description: `Review existing TradeHQ features and proposals for portfolio projections and embeddable price widgets. Planned features have no confirmed release date.`,
    h1: "TradeHQ Roadmap",
    summary: `The TradeHQ roadmap separates implemented features from proposals for portfolio projections and embeddable price widgets. Planned features have no confirmed release date; account features depend on backend availability.`,
    priority: "0.5",
    changefreq: "weekly",
  });

  routes.push({
    path: "/about",
    title: "About TradeHQ — Built by Anuga Weerasinghe | TradeHQ",
    description: `TradeHQ is a free educational trading simulator built by Anuga Weerasinghe. No brokerage, no real money, no signup — just ${BALANCE} virtual cash to learn with.`,
    h1: "About TradeHQ",
    summary: `TradeHQ is a free educational trading simulator built by Anuga Weerasinghe. It is not a brokerage and uses virtual money. Core simulator features work without signup; the site also uses third-party services including advertising.`,
    priority: "0.6",
    changefreq: "monthly",
  });

  routes.push({
    path: "/contact",
    title: "Contact TradeHQ | TradeHQ",
    description: `Contact the TradeHQ team for questions, feedback or partnership inquiries. Free educational trading simulator.`,
    h1: "Contact TradeHQ",
    summary: `Send a message to the TradeHQ team. Response times vary with request volume. TradeHQ is a free educational simulator — not a brokerage.`,
    priority: "0.4",
    changefreq: "monthly",
  });

  routes.push({
    path: "/challenge",
    title: `Challenge a Friend — 30-Day ${BALANCE} Practice Duel | TradeHQ`,
    description: `Challenge a friend to a 30-day simulated trading exercise. Each side is measured from its own recorded starting value; scores use server-recorded simulated trades and are frozen at the deadline.`,
    h1: "Challenge a Friend",
    summary: `Create a shareable invite for a 30-day practice duel. Each participant is measured from their own recorded starting value, using server-recorded trades and deadline-frozen simulated scores. Educational simulation only.`,
    priority: "0.6",
    changefreq: "weekly",
  });

  routes.push({
    path: "/privacy",
    title: "Privacy Policy | TradeHQ",
    description: `TradeHQ privacy policy covering guest browser data, signed-in portfolio sync, optional accounts, analytics, advertising and your choices.`,
    h1: "Privacy Policy",
    summary: `Guest simulator records stay in your browser. Account cash, positions and server-recorded trades are stored with Supabase; account, community and consented analytics features also involve provider processing. See the full policy for details.`,
    priority: "0.3",
    changefreq: "monthly",
  });

  routes.push({
    path: "/terms",
    title: "Terms of Service | TradeHQ",
    description: `TradeHQ terms of service. Free educational trading simulator — no brokerage, no real money, no financial advice.`,
    h1: "Terms of Service",
    summary: `TradeHQ is a free educational simulator. It is not a brokerage, does not execute real trades, and none of its content is financial advice. Full terms below.`,
    priority: "0.3",
    changefreq: "monthly",
  });

  // ---- Trade asset pages (/trade/:id) ----
  // Only assets with authored, unique editorial content are indexable.
  // The rest are still reachable in-app but marked noindex and kept out
  // of the sitemap so we never ship mass-templated near-duplicates.
  const editorial = new Set(extractAssetContentKeys());
  const authored = new Set(extractAssetFaqKeys().filter((k) => editorial.has(k)));

  for (const a of extractAssets()) {
    routes.push({
      path: `/trade/${a.id}`,
      title: `Paper Trade ${a.name} (${a.symbol}) Free — ${BALANCE} Simulator | TradeHQ`,
      description: `Practise ${a.name} (${a.symbol}) with ${BALANCE} virtual cash. Simulated charts, portfolio tracking, no signup. Educational only.`,
      h1: `Paper Trade ${a.name} (${a.symbol})`,
      summary: `Simulate buying and selling ${a.name} (${a.symbol}) with ${BALANCE} in virtual cash. Charts and prices are for education only — no real money, no brokerage relationship.`,
      priority: "0.8",
      changefreq: "daily",
      noindex: !authored.has(a.id),
    });
  }


  // ---- Wiki glossary pages (/wiki/:slug) ----
  routes.push({
    path: "/wiki",
    title: "Trading Glossary — Every Term Explained | TradeHQ Wiki",
    description: `A complete plain-language trading glossary, browsable by category, with practice on the free ${BALANCE} simulator. Educational only.`,
    h1: "Trading Glossary",
    summary: `Browse trading terms, distinct worksheets and scoped references. Check feature limitations: not every contract or indicator is implemented in the ${BALANCE} virtual simulator.`,
    priority: "0.7",
    changefreq: "weekly",
  });
  for (const g of extractGlossary()) {
    routes.push({
      path: `/wiki/${g.slug}`,
      title: `${g.term} — Explanation & Learning Exercise | TradeHQ Wiki`,
      description: g.slug === "circuit-breaker"
        ? "US circuit breakers pause trading at specified thresholds. Learn how market-wide halts differ from individual-security pauses and why exits remain uncertain."
        : firstCompleteSentence(g.definition),
      h1: `${g.term} — Trading Wiki`,
      summary: `${g.definition}`,
      priority: "0.7",
      changefreq: "weekly",
    });
  }

  // ---- Learn articles (/learn/article/:slug) ----
  for (const a of extractLearnArticles()) {
    routes.push({
      path: `/learn/article/${a.slug}`,
      title: `${a.title} | TradeHQ Learn`,
      description: a.metaDescription,
      h1: a.title,
      summary: a.summary,
      priority: "0.8",
      changefreq: "weekly",
    });
  }

  // ---- Legacy numeric lessons (/learn/:lessonId) ----
  // Keep existing in-app links working, but place these older lessons inside
  // the shared prerender/SEO quality gate and exclude them from search.
  for (const l of lessonData) {
    routes.push({
      path: `/learn/${l.id}`,
      title: `${l.title} — Trading Lesson | TradeHQ`,
      description: firstCompleteSentence(l.description),
      h1: l.title,
      summary: l.description,
      changefreq: "monthly",
      noindex: true,
    });
  }

  // ---- Niche asset pages (/niche/:symbol) ----
  for (const sym of extractNicheSymbols()) {
    routes.push({
      path: `/niche/${sym.toLowerCase()}`,
      title: `${sym} Practice Overview | TradeHQ`,
      description: `Read ${sym} reference facts and educational price-driver notes, then open the virtual simulator. ${BALANCE} virtual cash. Not financial advice.`,
      h1: `${sym} — Practice Overview`,
      summary: `Catalogue reference values and general price-driver notes for ${sym}, with a link to virtual practice. Reference values are not live quotes, and this overview does not provide a chart or an investment recommendation.`,
      priority: "0.6",
      changefreq: "daily",
      noindex: true,
    });
  }

  // ---- Programmatic SEO pages from seoData ----
  for (const c of extractSeoDataList("COMPARE_PAIRS")) {
    if (!c.slug) continue;
    const label = humanizeSlug(c.slug);
    routes.push({
      path: `/compare/${c.slug}`,
      title: `${label} — Key Differences Explained | TradeHQ`,
      description: c.intro || `Compare and paper-trade both with ${BALANCE} in virtual cash. Educational simulation only.`,
      h1: label,
      summary: c.intro || `Head-to-head comparison and practice trading with ${BALANCE} virtual cash.`,
      priority: "0.7",
      changefreq: "weekly",
    });
  }

  routes.push({
    path: "/compare",
    title: "Compare Assets — Head-to-Head Trading Guides | TradeHQ",
    description: "Compare named assets and instrument categories using specific educational worksheets, research questions and sources. TradeHQ uses virtual funds and simplified fills.",
    h1: "Compare Assets",
    summary: "Compare instrument structures, risks and research inputs. Use a pair-specific worksheet with stated assumptions, and distinguish simulated practice from documented market observations.",
    priority: "0.7",
    changefreq: "weekly",
  });

  for (const h of extractSeoDataList("HOWTO_ASSETS")) {
    if (!h.symbol) continue;
    const label = h.fullName || h.name || h.symbol.toUpperCase();
    routes.push({
      path: `/how-to-trade/${h.symbol}`,
      title: `How to Trade ${label} — Step-by-Step Guide | TradeHQ`,
      description: `Learn how to trade ${label} step-by-step with ${BALANCE} virtual cash. Free practice account, no signup. Educational simulation only.`,
      h1: `How to Trade ${label}`,
      summary: h.whyTrade || `Step-by-step guide to trading ${label}, followed by practice with virtual cash on the free ${BALANCE} simulator.`,
      priority: "0.7",
      changefreq: "weekly",
    });
  }

  routes.push({
    path: "/how-to-trade",
    title: "How to Trade — Step-by-Step Asset Guides | TradeHQ",
    description: `Free step-by-step guides on how to trade Bitcoin, Ethereum, Tesla, Nvidia and more. Practise with ${BALANCE} virtual cash, no signup.`,
    h1: "How to Trade — Guides",
    summary: `Pick an asset and follow a step-by-step guide, then try it on the free simulator with ${BALANCE} virtual cash.`,
    priority: "0.7",
    changefreq: "weekly",
  });

  for (const s of extractSeoDataList("STRATEGIES")) {
    if (!s.slug) continue;
    const label = s.name || s.title || humanizeSlug(s.slug);
    routes.push({
      path: `/strategy/${s.slug}`,
      title: `${label} — Strategy Guide | TradeHQ`,
      description: s.hook || s.intro || `Learn how ${label} works, then practise it with ${BALANCE} virtual cash.`,
      h1: label,
      summary: s.hook || s.intro || `A step-by-step walkthrough of ${label} with practice on the free ${BALANCE} simulator.`,
      priority: "0.7",
      changefreq: "weekly",
    });
  }

  routes.push({
    path: "/strategy",
    title: "Trading Strategies — Free Guides & Simulator | TradeHQ",
    description: `Curated trading strategies with step-by-step examples. Practice each one with ${BALANCE} virtual cash — free, no signup.`,
    h1: "Trading Strategies",
    summary: `Compare six strategy topics through conceptual worksheets and supported spot practice with ${BALANCE} in virtual cash. No strategy performance is validated.`,
    priority: "0.7",
    changefreq: "weekly",
  });

  // ---- Structured course tracks (/courses, /courses/:track, /courses/:track/:lesson) ----
  routes.push({
    path: "/courses",
    title: "Free Trading Courses — Options, Futures, Macro & Psychology | TradeHQ",
    description: `Four structured trading courses with original lessons, quizzes and completion badges. Practise concepts with ${BALANCE} virtual cash.`,
    h1: "Structured Trading Courses",
    summary: `Four structured tracks — options, futures, macro reading, and trading psychology — each with quizzes and a completion badge. Practise supported spot instruments with ${BALANCE} in virtual cash; derivatives contract exercises are conceptual.`,
    priority: "0.8",
    changefreq: "weekly",
  });
  for (const t of extractCourses()) {
    routes.push({
      path: `/courses/${t.slug}`,
      title: `${t.title} — Free Trading Course | TradeHQ`,
      description: `${t.tagline} ${t.lessons.length} free lessons with quizzes and a completion badge. Derivatives examples are conceptual; simulator practice uses spot instruments.`,
      h1: t.title,
      summary: `${t.tagline} Includes ${t.lessons.length} lessons, quizzes, sources, and a completion badge. The ${BALANCE} simulator supports spot instruments; options and futures contract mechanics are worksheet exercises.`,
      priority: "0.75",
      changefreq: "weekly",
    });
    for (const l of t.lessons) {
      routes.push({
        path: `/courses/${t.slug}/${l.slug}`,
        title: `${l.title} — ${t.title} | TradeHQ`,
        description: t.slug === "futures-and-derivatives" && l.slug === "hedging-with-futures"
          ? "Learn how airlines, farmers and funds study futures hedges, including basis risk, margin requirements and why price offsets are never guaranteed."
          : firstCompleteSentence(l.summary),
        h1: l.title,
        summary: `${l.summary} TradeHQ offers ${BALANCE} virtual cash for supported spot instruments. Derivatives contracts remain conceptual exercises. Educational only, not financial advice.`,
        priority: "0.7",
        changefreq: "monthly",
      });
    }
  }

  return routes;
}

// ---- Country guides & trader profile appended ----
const COUNTRIES = [
  { slug: "sri-lanka", name: "Sri Lanka" },
  { slug: "india", name: "India" },
  { slug: "philippines", name: "Philippines" },
  { slug: "pakistan", name: "Pakistan" },
  { slug: "nigeria", name: "Nigeria" },
];

function extraRoutes(): RouteMeta[] {
  const out: RouteMeta[] = [];
  out.push({
    path: "/learn/country",
    title: "Country Guides — Learn Trading Locally | TradeHQ",
    description: `Free trading guides for Sri Lanka, India, Philippines, Pakistan and Nigeria. Local regulator, exchange and ${BALANCE} virtual practice cash.`,
    h1: "Country trading guides",
    summary: `Free trading guides tailored to five focus markets — with local regulator, exchange, tax notes and the free ${BALANCE} practice account.`,
    priority: "0.6",
    changefreq: "monthly",
  });
  for (const c of COUNTRIES) {
    out.push({
      path: `/learn/country/${c.slug}`,
      title: `Learn Trading in ${c.name} — Free Guide for ${c.name} Students | TradeHQ`,
      description: `Free trading education for ${c.name}. Practise with ${BALANCE} virtual cash, learn how global markets work, and understand local rules. Educational simulation only.`,
      h1: `Learn Trading in ${c.name}`,
      summary: `A localised free guide for ${c.name} learners — local regulator, local exchange, tax note and the same ${BALANCE} virtual practice account.`,
      priority: "0.6",
      changefreq: "monthly",
    });
  }
  for (const entry of [
    ["/admin", "Admin Dashboard"],
    ["/admin/ai", "AI Development Desk"],
    ["/admin/courses", "Course Administration"],
    ["/admin/reviews", "Review Administration"],
    ["/admin/validator", "Link Validator"],
    ["/admin/seo-audit", "SEO Audit"],
    ["/admin/editor", "Editorial Administration"],
  ]) {
    out.push({ path: entry[0], title: entry[1] + " | TradeHQ", description: "Restricted TradeHQ administration utility.", h1: entry[1], summary: "Owner-only workspace for TradeHQ administration.", priority: "0.1", changefreq: "monthly", noindex: true });
  }
  out.push({ path: "/admin/daily", title: "Daily Practice Administration | TradeHQ", description: "Private owner editing and approval for daily practice banks.", h1: "Daily practice administration", summary: "Owner administration requires the master key.", priority: "0.1", changefreq: "monthly", noindex: true });
  return out;
}

/** Keep authored titles complete; search engines may shorten their display. */
function fitTitle(title: string): string {
  return title.replace(/\s+/g, " ").trim();
}

function fitDescription(desc: string): string {
  const d = desc.replace(/\s+/g, " ").trim();
  if (d.length <= 158) return d;
  const cut = d.slice(0, 158);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  if (end >= 0) return cut.slice(0, end + 1).trim();
  return firstCompleteSentence(d);
}

// Dedupe path collisions (last write wins) so future data overlap can't ship two entries for the same URL.
export function uniqueRoutes(): RouteMeta[] {
  const map = new Map<string, RouteMeta>();
  for (const r of [...buildRoutes(), ...extraRoutes()]) map.set(r.path, r);
  return Array.from(map.values()).map((r) => ({
    ...r,
    title: fitTitle(r.title),
    description: fitDescription(r.description),
  }));

}
