/**
 * Builds crawler-visible page content (real sections, not a loading
 * placeholder) for every prerendered route, from the same data modules
 * the React app renders at runtime.
 */

import { loadSiteData } from "./loadData";
import { STATIC_COPY, DISCLAIMER } from "./staticCopy";
import { EXTRA_SECTIONS } from "./staticCopyExtra";
import { ASSET_NOTES } from "./assetNotes";
import { ASSET_REFERENCES } from "../src/lib/assetReferences";
import { GLOSSARY_WORKSHEETS } from "../src/lib/glossaryWorksheets";
import { ARTICLE_REFERENCES } from "../src/lib/articleReferences";

export interface PageSection {
  h: string;
  p?: string[];
  list?: string[];
}

export interface PageContent {
  sections: PageSection[];
  links: { href: string; label: string }[];
}

const BALANCE = "$100,000";

/** Strip markdown-ish artefacts from lesson bodies for the static HTML. */
function clean(s: string): string {
  return s.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
}


/** Asset-class specific pre-trade checklist, so instrument pages do not all
 *  close with the same four lines of text. */
const TYPE_CHECKLIST: Record<string, string[]> = {
  crypto: [
    "Calculate the hypothetical effect of a 10% change on a virtual crypto holding; a continuously traded market can still move sharply between observations.",
    "Record the quote timestamp and available volume source, if any; a chart alone cannot establish actual exchange liquidity.",
    "Compare two hypothetical exit levels and fees on paper; TradeHQ has no resting stops, leverage or liquidation engine.",
  ],
  stock: [
    "Check whether earnings, a split or an index event falls inside your intended holding window.",
    "Compare hypothetical quantities at a fixed price change; a past daily range does not determine a suitable real-money position size.",
    "Record which dated company announcement would change your hypothetical scenario and compare the original assumption with later observations.",
  ],
  etf: [
    "Look at what the fund actually holds; two ETFs with similar names can behave very differently.",
    "Compare the ETF's dated price change with its largest holdings; composition, weights and tracking differences can change the relationship.",
    "Choose a defined observation window for a virtual ETF exercise; holding longer does not itself produce a better result.",
  ],
  forex: [
    "Note which session you are trading in; the same pair behaves differently in London and in Asia.",
    "Check the economic calendar for rate decisions or inflation prints inside your window.",
    "Convert a hypothetical pip change into the virtual account currency using a stated position size and exchange-rate assumption.",
  ],
  commodity: [
    "Check whether the move is supply-driven, demand-driven or currency-driven before deciding it is a trend.",
    "Expect seasonality: several commodities have recurring demand patterns that distort short samples.",
    "Compare two virtual position sizes and price-shock assumptions; a commodity contract's real-world expiry, leverage and execution are not simulated.",
  ],
};


/** Asset-class background used as supporting context on instrument pages. */
const TYPE_GUIDE: Record<string, { h: string; p: string[]; list: string[] }> = {
  crypto: {
    h: "How to approach a crypto instrument as a learner",
    p: [
      "Cryptocurrency markets generally trade around the clock, including weekends, but displayed liquidity and price observations vary by venue and time. Compare dated price changes over the same interval as a stock or ETF instead of assuming a fixed volatility multiple. A continuously traded asset can move sharply between observations even without a daily closing bell.",
      "News, network changes, available liquidity and leveraged positions can coincide with crypto price moves. A candle cannot establish which factor caused a specific change or what portion was forced liquidation. Record the market, quoted source, interval and dated event before comparing explanations.",
    ],
    list: [
      "Compare equal-dollar virtual exposures to a stated 5% or 10% move and calculate the different results; do not infer a universal position size or stop distance.",
      "Choose a repeatable observation interval for a study log and note that unseen moves can occur between checks.",
      "Study leveraged contract risks through external references only; TradeHQ does not support borrowing, margin requirements or forced liquidation.",
      "If analysing weekend data, verify the venue and comparable volume observations rather than assuming every weekend has lower liquidity.",
    ],
  },
  stock: {
    h: "How to approach a listed stock as a learner",
    p: [
      "A listed share represents an ownership interest in a company. Earnings, disclosures, expectations, discount rates and wider market conditions can influence its quoted price, but their relative importance varies by company and period. For a worksheet, state whether you are comparing daily prices, annual reports or a longer set of observations.",
      "Equities also carry structural features a simulator makes easy to forget: they gap between sessions, they halt on news, earnings dates cluster volatility into single days, and index membership can move a price for reasons unrelated to the business.",
    ],
    list: [
      "Look up the announced earnings date and note how reporting events can create uncertainty; no event guarantees a particular price move.",
      "A stop does not protect you overnight — price can open below it.",
      "Read the last quarterly report before forming an opinion about the company.",
      "Be honest about whether your idea is a trade with an exit or an investment with a thesis.",
    ],
  },
  etf: {
    h: "How to approach an ETF as a learner",
    p: [
      "An exchange-traded fund is a basket, so its behaviour comes from what it holds and how it is weighted. A broad market ETF spreads risk across hundreds of companies; a sector or thematic ETF concentrates it, and can fall as hard as any single stock when that theme goes out of favour. The word 'diversified' on a fact sheet is not the same as diversified in practice.",
      "ETF exposure depends on the fund's current holdings, fees, benchmark and legal structure. Some leveraged or inverse funds reset daily, making longer holding-period results path-dependent. ETF market prices can differ from reported net asset values, particularly during market stress.",
    ],
    list: [
      "Check the top ten holdings and their combined weight before assuming a fund is broad.",
      "Use a hypothetical two-day return path to illustrate how daily-reset leveraged or inverse funds differ from multiplying the whole-period return; these instruments are not available as leveraged contracts in TradeHQ.",
      "Compare the quoted spread, dated fund holdings and available liquidity on two ETFs without assuming that volume alone determines execution costs.",
      "Compare the fund's return to its benchmark, not to an unrelated index.",
    ],
  },
  forex: {
    h: "How to approach a currency pair as a learner",
    p: [
      "A currency pair is a relative price: buying one currency is simultaneously selling the other, so every move reflects a change in the relationship rather than in a single asset. The main drivers are interest-rate expectations, inflation data, growth surprises and global risk appetite, and the largest moves cluster around central-bank meetings and monthly data releases.",
      "Retail forex products can involve borrowing, high leverage, financing charges and jurisdiction-specific rules. A small percentage price move can produce a larger change in collateral value when exposure is leveraged. TradeHQ's currency pairs are unleveraged virtual observations, not a model of real broker margin or execution.",
    ],
    list: [
      "Note the dates of relevant central-bank decisions and economic releases before comparing currency movements; neither a calendar nor an indicator predicts the result.",
      "Compare dated spreads, if available, between sessions and venues; the simulator does not reproduce a broker's actual trading conditions.",
      "For an educational example, vary hypothetical notional exposure and adverse percentage changes; TradeHQ does not implement resting stop orders.",
      "Ignore any material that presents high leverage as an opportunity rather than a hazard.",
    ],
  },
  commodity: {
    h: "How to approach a commodity as a learner",
    p: [
      "Commodities include physical goods whose prices can reflect inventories, production, consumption, transport costs, storage and expectations. Some agricultural products have seasonal supply cycles, while energy and metals respond to other factors. Exchange-traded contracts and funds can behave differently from physical spot markets.",
      "Commodity exposure can come through physical holdings, futures contracts or funds with distinct costs and risks. Futures expire and may be rolled; differences between contract prices can affect a fund's return. TradeHQ commodity entries are virtual spot-style symbols, not actual expiring futures contracts.",
    ],
    list: [
      "For each commodity worksheet, identify its particular production, storage and demand context using dated sources.",
      "Understand contract expiry and rolling if you ever move beyond a simulator.",
      "Look up event dates, then compare observed price changes without claiming a specific event caused them by itself.",
      "Record the quotation currency for the selected contract or reference price and distinguish currency conversion from a change in the commodity's underlying value.",
    ],
  },
};


/** Per-asset-class note on where a simulator stops being representative. */
const TYPE_LIVE_GAP: Record<string, string> = {
  crypto:
    "One caveat before you take any of this to a live venue: crypto exchanges differ enormously in fees, withdrawal rules, custody arrangements and how they handle outages, and none of that appears in a simulator. Practice teaches you sizing, patience and how the instrument moves; it cannot teach you what happens when a venue halts withdrawals or when a stop is triggered during a liquidity gap at three in the morning. Assume live execution will be worse than practice execution, and that the emotional weight of a real drawdown in an asset that moves this fast is substantially heavier than the same percentage on a practice screen.",
  stock:
    "One caveat before you take any of this to a live account: real equity execution includes commissions or spreads, settlement rules, and the possibility of an overnight gap straight through your stop. Practice teaches you position sizing, patience and how earnings dates reshape a chart; it cannot teach you how it feels to hold a position through a halt or to watch a gap open against you before the market does. Assume live results will be meaningfully worse than practice results, and treat any simulated track record as evidence about your process rather than a forecast of returns.",
  etf:
    "One caveat before you take any of this to a live account: a fund's expense ratio, tracking difference, bid-ask spread and any dividend or distribution treatment all affect real returns and none of them are fully modelled here. Practice teaches you how the basket behaves and how to size exposure to it; it cannot teach you the tax treatment in your country or how a thinly traded fund behaves in a stressed market. Confirm the fund's own documentation before committing money, and assume real returns will lag the simulated ones.",
  forex:
    "One caveat before you take any of this to a live account: retail forex execution involves spreads that widen around news, overnight financing on positions held past the daily rollover, and leverage terms that vary by jurisdiction. None of those costs are fully represented in a simulator. Practice teaches you the mechanics of a pair and the discipline of sizing from a stop; it cannot teach you what a widened spread does to a tight stop during a rate decision. Assume live results are worse, and treat leverage as a hazard rather than a feature.",
  commodity:
    "One caveat before you take any of this to a live account: real commodity exposure usually means futures or a fund holding futures, which brings contract expiry, roll costs, margin requirements and, in some products, the theoretical obligation to take delivery. None of that is modelled here. Practice teaches you what drives the underlying market and how to size a volatile position; it cannot teach you the operational mechanics of a futures account. Read the contract specification and the product documentation before committing money.",
};

export async function buildContentMap(): Promise<Map<string, PageContent>> {
  const d: any = await loadSiteData();
  const map = new Map<string, PageContent>();

  for (const [path, content] of Object.entries(STATIC_COPY)) {
    map.set(path, {
      ...content,
      sections: [...content.sections, ...(EXTRA_SECTIONS[path] || [])],
    });
  }

  // ---------- Wiki glossary ----------
  const glossary: any[] = d.tradingGlossary;
  const bySlug = new Map(glossary.map((g) => [g.slug, g]));

  map.set("/wiki", {
    sections: [
      {
        h: "A plain-language trading glossary",
        p: [
          `TradeHQ's glossary explains trading terms in plain English, with worked examples and questions to help you examine the ideas in practice. There are ${glossary.length} terms in the index, grouped by the part of trading they belong to. The entries discuss limitations as well as the underlying mechanics.`,
          "Definitions are written for people who are learning, not for people who already know. Where a term has a contested or marketing-inflated meaning, the entry says so rather than repeating the sales version.",
        ],
      },
      {
        h: "Browse by category",
        list: Array.from(new Set(glossary.map((g) => g.category))).map(
          (c) => `${c}: ${glossary.filter((g) => g.category === c).map((g) => g.term).slice(0, 8).join(", ")}`
        ),
      },
      {
        h: "Why a glossary matters more in trading than in most subjects",
        p: [
          "Trading vocabulary is unusually hostile to beginners because the same word often carries a precise technical meaning and a loose marketing meaning at the same time. 'Leverage' is a neutral description of borrowed exposure in a textbook and a sales pitch in an advertisement. 'Support' is a level where buyers previously appeared, not a floor that holds. Reading material without pinning down which meaning is in play is how people end up confident about something they have misunderstood.",
          "Each entry here therefore gives a plain definition first, then a longer expert explanation of the mechanics, then the practical caveat that matters when you try to use the idea. Where a concept is popular but weakly evidenced, the entry says so instead of repeating the folklore.",
        ],
      },
      {
        h: "How to use the glossary while practising",
        list: [
          "Look a term up the first time you meet it rather than guessing from context.",
          "After reading an entry, find the same concept on a live chart in the simulator.",
          "Use the related-terms links at the bottom of each entry to build a map of the topic.",
          `Practise anything you learn with ${BALANCE} in virtual cash — ${DISCLAIMER}`,
        ],
      },
    ],
    links: glossary.map((g) => ({ href: `/wiki/${g.slug}`, label: g.term })),
  });

  for (const g of glossary) {
    const related = (g.relatedTerms || []).filter((r: string) => bySlug.has(r));
    map.set(`/wiki/${g.slug}`, {
      sections: [
        { h: "Publisher and editorial transparency", p: ["Published by TradeHQ. Site creator: Anuga Weerasinghe. This page has no recorded editorial review date; the About page explains the site's editorial approach."] },
        { h: `What ${g.term} means`, p: [g.definition] },
        { h: "In depth", p: splitParagraphs(g.expertDefinition) },
        { h: "Key points", list: g.keyPoints },
        { h: "Why it matters when you are learning", p: [g.studentPerspective] },
        { h: "Worked exercise and its limits", p: [GLOSSARY_WORKSHEETS[g.slug]?.exercise || ""] },
      ],
      links: [
        ...(g.sources || []),
        ...(GLOSSARY_WORKSHEETS[g.slug]?.references || []),
        ...related.map((r: string) => ({ href: `/wiki/${r}`, label: bySlug.get(r)!.term })),
        { href: "/about", label: "Publisher and editorial approach" },
        { href: "/wiki", label: "Full glossary index" },
        { href: "/trade", label: "Practice desk" },
      ],
    });
  }

  // ---------- Courses ----------
  const tracks: any[] = d.courseTracks;
  map.set("/courses", {
    sections: [
      {
        h: `${tracks.length} bundled tracks, ${tracks.reduce((total, track) => total + track.lessons.length, 0)} bundled lessons`,
        p: [
          "These notes describe the bundled course inventory. Additional approved courses may appear in the live catalogue and its separate course sitemap. Courses on TradeHQ are sequential tracks. Each track states what you will be able to do at the end, what you need to know first, how the lessons build on one another, and who the track is not suitable for. Every lesson ends with key takeaways, cited sources and a short quiz, and each completed track awards a badge.",
        ],
      },
      ...tracks.map((t) => ({
        h: `${t.title} (${t.level}, ${t.lessons.length} lessons)`,
        p: [t.description],
        list: t.lessons.map((l: any) => `${l.title} — ${l.summary}`),
      })),
      {
        h: "How to work through a track",
        list: [
          "Do one lesson per session and take the quiz before moving on.",
          `Practise supported spot instruments with ${BALANCE} of virtual cash. Work through options and futures contract examples in a separate worksheet.`,
          "Re-read the key takeaways a week later; recall beats re-reading for retention.",
          `Nothing in these courses is a recommendation. ${DISCLAIMER}`,
        ],
      },
    ],
    links: tracks.map((t) => ({ href: `/courses/${t.slug}`, label: t.title })),
  });

  for (const t of tracks) {
    map.set(`/courses/${t.slug}`, {
      sections: [
        { h: "About this track", p: [t.tagline, t.description] },
        { h: "What you will be able to do", list: t.outcomes },
        { h: "Before you start", p: [t.prerequisites] },
        { h: "How the lessons build", p: [t.progression] },
        { h: "Who this track is not for", p: [t.notFor] },
        {
          h: "Lessons in this track",
          list: t.lessons.map((l: any) => `${l.title} (${l.readingMinutes} min) — ${l.summary}`),
        },
        {
          h: "Completion badge",
          p: [`${t.badge.name}: ${t.badge.description} ${DISCLAIMER}`],
        },
      ],
      links: [
        ...t.lessons.map((l: any) => ({ href: `/courses/${t.slug}/${l.slug}`, label: l.title })),
        { href: "/courses", label: "All courses" },
      ],
    });

    t.lessons.forEach((l: any, i: number) => {
      const prev = t.lessons[i - 1];
      const next = t.lessons[i + 1];
      map.set(`/courses/${t.slug}/${l.slug}`, {
        sections: [
          { h: "Summary", p: [l.summary] },
          ...(l.sourceCheck ? [{ h: "Source-check scope", p: [`Source check: ${l.sourceCheck.date}. ${l.sourceCheck.scope}`] }] : []),
          ...groupLessonBody(l.body),
          { h: "Key takeaways", list: l.keyTakeaways },
          {
            h: "Check your understanding",
            list: l.quiz.map(
              (q: any) =>
                `${q.question} Options: ${q.options.join("; ")}. Correct answer: ${q.options[q.correctAnswer]}. Why: ${q.explanation}`
            ),
          },
          {
            h: "Sources",
            list: (l.sources || []).map((s: any) => `${s.label} (${s.url})`),
          },
          {
            h: "Practise this lesson",
            p: [
              `Use ${BALANCE} in virtual cash to practise supported spot instruments and general habits such as recording a trade thesis. Options contracts, Greeks, futures margin and daily settlement are conceptual exercises: calculate their examples in a worksheet, because TradeHQ does not execute derivatives contracts. ${DISCLAIMER}`,
            ],
          },
        ],
        links: [
          ...(l.sources || []).map((source: {url: string; label: string}) => ({ href: source.url, label: source.label })),
          ...(prev ? [{ href: `/courses/${t.slug}/${prev.slug}`, label: `Previous: ${prev.title}` }] : []),
          ...(next ? [{ href: `/courses/${t.slug}/${next.slug}`, label: `Next: ${next.title}` }] : []),
          { href: `/courses/${t.slug}`, label: t.title },
          { href: "/courses", label: "All courses" },
        ],
      });
    });
  }

  // ---------- Compare ----------
  const pairs: any[] = d.COMPARE_PAIRS;
  map.set("/compare", {
    sections: [
      {
        h: "Head-to-head comparisons",
        p: [
          "Start by identifying the exposure: a company share, fund, currency pair and network token have different structures. Each page compares those structures and offers specific research questions, source links and a hypothetical worksheet. A category such as forex or stocks is broader than the named examples available in the practice terminal. The exercise helps distinguish ownership, quote units and costs without ranking real-money suitability.",
        ],
      },
      {
        h: "Available comparisons",
        list: pairs.map((p) => `${p.a.name} vs ${p.b.name} — ${p.a.tag} against ${p.b.tag}`),
      },
      {
        h: "Why comparison beats a ranking",
        p: [
          "For a numerical comparison, state matching dates, data sources, calculation methods and costs. Equal dollar allocations do not establish equal risk, and a past volatility or drawdown estimate is not a guaranteed future outcome. Separate documented market observations from TradeHQ's generated history and simplified fills. A simulator exercise can illustrate arithmetic without reproducing liquidity, physical delivery, staking or every real execution condition.",
          "None of them tell you what to buy, and none of them predict which side will perform better. The comparison section highlights differences in mechanics, assumptions and risks. It does not rank either instrument as the better investment or prescribe which one to practise first.",
        ],
      },
      {
        h: "How to use a comparison",
        list: [
          "Choose a page and follow its pair-specific worksheet with stated hypothetical inputs. Use supported named instruments rather than assume an entire category is tradable.",
          "Record both favorable and unfavorable scenarios, the quantity units and any excluded costs. Keep asset return separate from total-account return when cash remains uninvested.",
          "Read the relevant product, company or network documents and record their dates. A reporting definition, network measurement and price forecast answer different questions.",
          "Check the mistakes section and mark missing information explicitly. A month of practice results does not establish a reliable strategy or readiness to trade real money.",
          DISCLAIMER,
        ],
      },
      {
        h: "Keep the comparison reproducible",
        p: [
          "Save the source title, date and units with each input. A quarter and a fiscal year cover different durations; a price-only series and a series with reinvested distributions measure different outcomes. If definitions or dates do not match, mark the figures as non-comparable instead of turning them into a ranking. Revisit the original source when a company changes its reporting categories or a network changes its rules.",
          "A useful worksheet also records what remains unknown. Missing data is different from a measured zero, and a provider fetch time is different from the underlying observation time. State those limits beside the result so another reader can reconstruct the exercise. Neither a polished chart nor a familiar ticker establishes the reliability of its inputs.",
        ],
      },
    ],
    links: pairs.map((p) => ({ href: `/compare/${p.slug}`, label: `${p.a.name} vs ${p.b.name}` })),
  });

  for (const p of pairs) {
    map.set(`/compare/${p.slug}`, {
      sections: [
        { h: "How the two differ in practice", p: p.deepDive },
        { h: "Key differences", list: p.bullets },
        { h: "What the comparison shows", p: [p.verdict] },
        { h: "Common mistakes with this comparison", list: p.mistakes },
        {
          h: "How to compare a practice worksheet",
          p: [
            p.worksheet,
            "Equal dollar values do not establish equal risk. Record unfavorable as well as favorable cases. Provider observations and generated history are different; simulated portfolio metrics do not establish real-account drawdowns or suitability.",
          ],
        },
      ],
      links: [
        ...p.sources,
        { href: "/compare", label: "All comparisons" },
        { href: "/markets", label: "Browse markets" },
        { href: "/trade", label: "Practice desk" },
      ],
    });
  }

  // ---------- How to trade ----------
  const howto: any[] = d.HOWTO_ASSETS;
  map.set("/how-to-trade", {
    sections: [
      {
        h: "Step-by-step asset guides",
        p: [
          "Each guide covers one instrument: what actually moves it, a concrete first practice trade with sizing, when during the day or week it is worth trading, the mistakes beginners repeatedly make with that specific instrument, and how to review the trade afterwards.",
        ],
      },
      { h: "Available guides", list: howto.map((h) => `${h.fullName} (${h.type}) — ${h.whyTrade}`) },
      {
        h: "What every one of these guides has in common",
        p: [
          "The structure is deliberate. Beginners usually start with the question 'how do I buy this?', which is the least important part — placing the order takes seconds and any broker will show you how. The parts that decide whether the trade was sensible come before and after it: understanding what actually moves the instrument, choosing a size that survives being wrong, picking a time of day when liquidity is not working against you, and reviewing the result honestly afterwards.",
          "So each guide spends most of its length on those parts. None of them tell you whether to buy, none contain price targets, and none imply that following the steps produces a profit. They aim to make your first practice trade in an instrument an informed one rather than a random one.",
        ],
      },
      {
        h: "Using a guide properly",
        list: [
          "Read the drivers section before looking at a chart, so the chart does not supply your opinion.",
          "Copy the suggested first practice trade exactly, including the sizing, before improvising.",
          "Note the timing guidance — trading an instrument outside its liquid window is a common and avoidable handicap.",
          "Come back to the review section a day after the trade closes, not while it is open.",
        ],
      },
    ],
    links: howto.map((h) => ({ href: `/how-to-trade/${h.symbol}`, label: `How to trade ${h.fullName}` })),
  });

  for (const h of howto) {
    map.set(`/how-to-trade/${h.symbol}`, {
      sections: [
        { h: `Understanding ${h.fullName}`, p: [h.beginnerTip] },
        { h: "What actually moves it", list: h.drivers },
        { h: "Step by step", list: h.steps },
        { h: "A realistic first practice trade", p: [h.firstTrade] },
        { h: "Timing and liquidity", p: [h.timing] },
        { h: "Mistakes specific to this instrument", list: h.mistakes },
        { h: "Reviewing the trade afterwards", p: [h.review] },
        { h: "Risk", p: [h.risk] },
        { h: "If you are learning from outside the US", p: [h.studentNote, DISCLAIMER] },
      ],
      links: [
        { href: `/trade/${h.symbol}`, label: `${h.fullName} practice page` },
        { href: "/how-to-trade", label: "All asset guides" },
        { href: "/strategy", label: "Strategy guides" },
        ...(h.sources || []),
      ],
    });
  }

  // ---------- Strategies ----------
  const strategies: any[] = d.STRATEGIES;
  map.set("/strategy", {
    sections: [
      {
        h: "Named strategy walkthroughs",
        p: [
          "The directory compares six different educational topics. Short-horizon methods, multi-day methods, indicator exercises and fixed-schedule purchases serve different questions. Examples use hypothetical inputs, not documented live performance. Read each method's limitations and supporting references before interpreting a calculation.",
        ],
      },
      { h: "Strategies covered", list: strategies.map((s) => `${s.name} — ${s.oneLiner}`) },
      {
        h: "A simple comparison before choosing a worksheet",
        p: [
          "Consider two different teaching questions: a fixed $100 contribution made at three specified dates is a cash-flow exercise, whereas recording a MACD crossing on three observations is an indicator-definition exercise. They do not use the same denominator or imply comparable expected returns. For the contribution exercise, list total cash added and total units; for an indicator exercise, state the source, price interval and calculation before counting any signals.",
          "Neither example needs a live trade. The choice of an exercise should follow the concept being studied, not a claim that a holding period or indicator offers a better outcome. Any comparison of observed results needs consistent date ranges, costs, valuation conventions and a clear statement that a selected sample cannot verify future performance.",
        ],
      },
      {
        h: "What a strategy is, and what it is not",
        p: [
          "A trading rule describes a testable set of conditions and assumptions. Dollar-cost averaging is different: it schedules contributions, without requiring an active entry or exit signal. The site presents these methods for comparison, not as advice about which method is suitable for a person.",
          "A chosen win percentage without the payoff distribution and costs is not enough to evaluate outcomes. Results from a selected historical or virtual sample are descriptive; they may change in another sample. No source-backed universal winning percentage or account-return forecast is offered.",
        ],
      },
      {
        h: "Testing a strategy without fooling yourself",
        list: [
          "Write down the hypothetical assumptions and observation window before reviewing outcomes.",
          "Avoid treating 30, 100 or any other arbitrary number of observations as a universal statistical threshold. Sample design, selection and dependence matter.",
          "Record cases selected by the exercise criteria, including unfavorable cases and changes to the rule.",
          "If using sample expectancy or drawdown, explicitly label the costs, sizes, dates and limitations of the input data.",
          "Check the effect of a negative-outcome sequence without asserting how often it will occur in practice.",
          "Compare a second specified sample without claiming that a backtest establishes future results.",
        ],
      },
    ],
    links: strategies.map((s) => ({ href: `/strategy/${s.slug}`, label: s.name })),
  });

  for (const s of strategies) {
    map.set(`/strategy/${s.slug}`, {
      sections: [
        { h: "What it is", p: [s.oneLiner, s.depth.context] },
        { h: "Market conditions that matter", p: [s.depth.regime] },
        { h: "Study context", p: [s.bestFor] },
        { h: "Limitations", p: [s.worstFor] },
        { h: "The steps", list: s.steps },
        { h: "Worked example", p: [s.example] },
        { h: "The numbers behind it", p: [s.depth.math] },
        { h: "How it fails", list: s.depth.mistakes },
        { h: "Scope and source limitations", p: [s.successRate, DISCLAIMER] },
      ],
      links: [
        ...(s.sources || []),
        { href: "/strategy", label: "All strategies" },
        { href: "/wiki", label: "Glossary" },
        { href: "/trade", label: "Practice desk" },
      ],
    });
  }

  // ---------- Country guides ----------
  const countries: any[] = d.COUNTRY_GUIDES;
  map.set("/learn/country", {
    sections: [
      {
        h: "Localised learning guides",
        p: [
          "These guides identify local regulatory sources and offer hypothetical country-specific currency and market worksheets. They explain why residency, provider permissions, tax rules and foreign-exchange requirements need separate checks. A simulator does not establish real-market access, and the guides do not recommend brokers or a real-money starting amount.",
        ],
      },
      {
        h: "Guides available",
        list: countries.map((c) => `${c.country} — ${c.localExchange}, regulated by ${c.regulator.name}, local currency ${c.currency}`),
      },
      {
        h: "Why location changes the practical answer",
        p: [
          "Rules for accessing financial services, exchanging currency, and reporting taxable gains can differ by jurisdiction and change over time. These guides point readers to local regulators rather than deciding eligibility, recommending a brokerage or prescribing how much real money to invest.",
          "Treat regulatory summaries as starting points for verification, not current legal advice. Read the relevant authority's latest publications and check the date of any rule before relying on it.",
        ],
      },
      {
        h: "Source-check worksheet for local rules",
        p: [
          "Before interpreting a country-specific statement, record the regulator's name, the exact dated document, the instrument being discussed and the scope of its rules. A rule about domestic exchange-listed equities may not apply to an overseas crypto exchange, an ETF or a simulated order. This is especially important when older blog posts repeat rules that have since changed.",
          "TradeHQ cannot confirm any person's eligibility or give legal or tax clearance. The country guides therefore illustrate where to look, rather than deciding whether a broker, remittance, asset or tax treatment is permitted today.",
        ],
      },
      {
        h: "What these guides deliberately avoid",
        list: [
          "They do not rank or recommend brokers, and they contain no affiliate links.",
          "They do not give tax advice; tax sections point you to a qualified local professional.",
          "They do not suggest that trading is a realistic income source for someone with little capital.",
          "They do not claim regulatory endorsement of any kind — TradeHQ is a simulator, not a licensed firm.",
          "They do not present trading as a solution to financial pressure; if the capital matters to you, learning is the only safe use of it here.",
        ],
      },
    ],
    links: countries.map((c) => ({ href: `/learn/country/${c.slug}`, label: `Learn trading in ${c.country}` })),
  });

  for (const c of countries) {
    map.set(`/learn/country/${c.slug}`, {
      sections: [
        { h: `Trading from ${c.country}`, p: [c.intro] },
        { h: "Publisher and source-check scope", p: [`Published by TradeHQ; site creator: Anuga Weerasinghe. Regulatory source check: ${c.sourceCheck.date}. ${c.sourceCheck.scope}`] },
        { h: "Why practise first", p: [c.whyPractice] },
        { h: "How market access works here", p: [c.marketAccess] },
        { h: "Regulation", p: [`For securities regulation and intermediary information, consult ${c.regulator.name}. Registration for one activity does not establish that every product, overseas service or funding route is permitted. Use the official sources below for the applicable rules.`] },
        { h: "Broker types used locally", list: c.brokers },
        { h: "Starting capital and eligibility", p: [c.startingCapital] },
        { h: "Locally relevant assets to follow", list: c.localAssets },
        { h: "A three-month practice plan", p: [c.practicePlan] },
        { h: "Tax", p: [`${c.taxNote} This is general information, not tax advice — confirm your own position with a qualified local professional.`] },
        { h: "If you are a student", p: [c.studentAngle] },
        { h: "Questions people in this country ask", list: c.faqs.map((f: any) => `${f.q} — ${f.a}`) },
      ],
      links: [
        ...c.sources,
        { href: "/learn/country", label: "All country guides" },
        { href: "/learn-trading-guide", label: "Beginner guide" },
        { href: "/courses", label: "Structured courses" },
      ],
    });
  }

  // ---------- Learn articles ----------
  for (const a of d.LEARN_ARTICLES as any[]) {
    map.set(`/learn/article/${a.slug}`, {
      sections: [
        { h: "Publisher and editorial transparency", p: ["Published by TradeHQ. Site creator: Anuga Weerasinghe. This page has no recorded editorial review date; the About page explains the site's editorial approach."] },
        { h: "Summary", p: [a.summary] },
        ...(a.sourceCheck ? [{ h: "Source-check scope", p: [`Source check: ${a.sourceCheck.date}. ${a.sourceCheck.scope}`] }] : []),
        ...a.sections.map((s: any) => ({ h: s.heading, p: s.paragraphs })),
        { h: "Practise what you just read", p: [`Apply this in the simulator with ${BALANCE} in virtual cash. ${DISCLAIMER}`] },
      ],
      links: [...(ARTICLE_REFERENCES[a.slug] || []), ...(a.relatedLinks || []).map((l: any) => ({ href: l.href, label: l.label })), { href: "/about", label: "Publisher and editorial approach" }, { href: "/learn", label: "All learn articles" }],
    });
  }

  // ---------- Trade asset pages with authored content ----------
  const content: Record<string, any> = d.ASSET_CONTENT;
  const faqs: Record<string, any[]> = d.ASSET_FAQS;
  const intros: Record<string, string> = d.CATEGORY_INTROS;
  const assets: any[] = d.ASSETS;
  const howtoSyms = new Set(howto.map((h) => h.symbol));

  for (const a of assets) {
    const c = content[a.id];
    if (!c) continue;
    const f = faqs[a.id] || [];
    const stats = Object.entries(c.stats || {})
      .filter(([k, v]) => k !== "source" && v !== "live_sourced_at_runtime")
      .map(([k, v]) => `${humanise(k)}: ${v}`);
    map.set(`/trade/${a.id}`, {
      sections: [
        { h: `What ${a.name} is`, p: [c.whatIs] },
        ...(TYPE_GUIDE[a.type] ? [] : [{ h: `${c.category} as an asset class`, p: [intros[a.type] || ""] }]),
        ...(stats.length ? [{ h: "Reference facts", list: stats }] : []),
        { h: "How to practise it here", p: [c.strategy] },
        ...(ASSET_REFERENCES[a.id] ? [{ h: "Asset-specific worksheet (hypothetical)", p: [ASSET_REFERENCES[a.id].exercise] }] : []),
        ...(ASSET_NOTES[a.id]
          ? [
              { h: `Why learners study ${a.name}`, p: [ASSET_NOTES[a.id].why] },
              { h: `What tends to move ${a.name}`, p: [ASSET_NOTES[a.id].watch] },
              { h: `${a.name}: practice versus a real account`, p: [ASSET_NOTES[a.id].gap] },
            ]
          : [
              ...(TYPE_LIVE_GAP[a.type] ? [{ h: "Where practice stops being representative", p: [TYPE_LIVE_GAP[a.type]] }] : []),
              ...(TYPE_GUIDE[a.type]
                ? [
                    { h: TYPE_GUIDE[a.type].h, p: TYPE_GUIDE[a.type].p },
                    { h: "Rules of thumb for this asset class", list: TYPE_GUIDE[a.type].list },
                  ]
                : []),
            ]),
        ...(c.executiveOutlook ? [{ h: "Context to be aware of", p: [`${c.executiveOutlook.summary} This is background context on the asset, not a forecast and not a recommendation.`] }] : []),
        ...(c.institutionalDrivers
          ? [{ h: "Arguments people make on each side", list: [`Bull case commonly cited: ${c.institutionalDrivers.bull}`, `Bear case commonly cited: ${c.institutionalDrivers.bear}`] }]
          : []),
        ...(f.length ? [{ h: `Common questions about trading ${a.name}`, list: f.map((q) => `${q.question} — ${q.answer}`) }] : []),
        {
          h: `A practice checklist for ${a.name}`,
          list: [
            ...(ASSET_NOTES[a.id]?.checklist || TYPE_CHECKLIST[a.type] || TYPE_CHECKLIST.stock),
            `Read the ${a.name} sections above and look up any term here you cannot define out loud. ${DISCLAIMER}`,
          ],
        },

      ],
      links: [
        ...(ASSET_REFERENCES[a.id] ? [{ href: ASSET_REFERENCES[a.id].href, label: ASSET_REFERENCES[a.id].label }] : []),
        ...(howtoSyms.has(a.id) ? [{ href: `/how-to-trade/${a.id}`, label: `How to trade ${a.name}` }] : []),
        { href: "/markets", label: "All markets" },
        { href: "/wiki", label: "Glossary" },
        { href: "/learn-trading-guide", label: "Beginner guide" },
      ],
    });
  }

  return map;
}

function humanise(k: string): string {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function splitParagraphs(text: string): string[] {
  const sentences = text.split(/(?<=\.)\s+/);
  const out: string[] = [];
  let buf: string[] = [];
  for (const s of sentences) {
    buf.push(s);
    if (buf.join(" ").length > 550) {
      out.push(buf.join(" "));
      buf = [];
    }
  }
  if (buf.length) out.push(buf.join(" "));
  return out;
}

/** Lesson bodies use "## Heading" markers between paragraph runs. */
function groupLessonBody(body: string[]): PageSection[] {
  const sections: PageSection[] = [];
  let current: PageSection | null = null;
  for (const raw of body) {
    if (/^#{2,}\s/.test(raw)) {
      if (current) sections.push(current);
      current = { h: clean(raw), p: [] };
    } else {
      if (!current) current = { h: "Lesson", p: [] };
      current.p!.push(clean(raw));
    }
  }
  if (current) sections.push(current);
  return sections.filter((s) => (s.p || []).length > 0);
}
