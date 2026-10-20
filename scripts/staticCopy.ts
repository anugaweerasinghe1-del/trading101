/**
 * Crawler-visible copy for pages whose content is interactive (tools,
 * hubs, legal). Every paragraph here must be true of the live app —
 * this text is what Google and AdSense read before JavaScript runs.
 */

import type { PageContent } from "./content";
import { PRIVACY_SECTIONS, PRIVACY_REFERENCES } from "../src/lib/privacyCopy";

const D = "Educational simulation only — not financial advice.";

export const STATIC_COPY: Record<string, PageContent> = {
  "/": {
    sections: [
      {
        h: "What TradeHQ actually is",
        p: [
          "TradeHQ is a free paper-trading simulator for people learning how markets work. Every account starts with $100,000 in virtual cash. Nothing on the site touches real money: there is no brokerage account, no deposit, no withdrawal and no order ever reaches an exchange. Supported holdings use periodically refreshed provider quotes. Unsupported assets can use fixed simulator prices, and charts may show synthetic practice candles. Price and chart labels explain their source and freshness.",
          "A practice account lets you examine decisions without putting savings at risk. For example, compare how different quantities change a hypothetical loss, or record why you changed an exit plan. These exercises do not establish why most beginners lose money or guarantee that practice changes later behaviour.",
        ],
      },
      {
        h: "What you can do here",
        list: [
          "Paper trade 170 instruments across stocks, crypto, ETFs, forex and commodities using market orders.",
          "Track a full practice portfolio — open positions, realised and unrealised P&L, maximum drawdown, open-position P&L dispersion and allocation snapshots.",
          "Work through four structured courses (options, futures, macro reading and trading psychology) with quizzes and completion badges.",
          "Read a 49-term trading glossary written in plain language, each entry with a detailed explanation and a worked example.",
          "Follow step-by-step guides for individual assets, side-by-side asset comparisons, and named strategy walkthroughs.",
          "Keep a trading journal, build daily streaks with the daily challenge, and run a 30-day practice duel against a friend.",
        ],
      },
      {
        h: "Who it is for, and who it is not for",
        p: [
          "TradeHQ is built for beginners and self-directed learners who want a place to rehearse market mechanics and a repeatable process without using real money. It can also be useful in classroom or independent-study settings.",
          "It is not for you if you want signals, copy-trading, portfolio management, or someone to tell you what to buy. We do not publish price targets, we do not run a Discord with calls, and we do not accept payment for coverage of any asset. If you are looking for a recommendation, this is the wrong site.",
        ],
      },
      {
        h: "How to start in five minutes",
        list: [
          "Open the markets page and pick one instrument you already recognise.",
          "Read its guide page so you know what actually moves it before you trade it.",
          "Choose a deliberately small practice position first, then compare how different simulated position sizes affect drawdown and volatility.",
          "Write down, before you enter, where you would exit if you are wrong.",
          "Come back the next day, review the trade in the journal, and repeat.",
        ],
      },
    ],
    links: [
      { href: "/markets", label: "Browse all markets" },
      { href: "/courses", label: "Structured trading courses" },
      { href: "/learn-trading-guide", label: "Beginner practice guide" },
      { href: "/wiki", label: "Trading glossary" },
      { href: "/how-to-trade", label: "Asset-by-asset guides" },
      { href: "/about", label: "About TradeHQ" },
    ],
  },

  "/trade": {
    sections: [
      {
        h: "How the practice trading desk works",
        p: [
          "The trading desk is where simulated orders are placed. You choose an instrument, choose a side, choose a size, and the order is filled against the simulator's current price. Guest fills and results are recorded in your browser. Account orders execute through the server and cash, positions and server-recorded trade history restore across devices when the service is available.",
          "One order type is supported today: the market order, which fills immediately at the shown simulator price. Limit and stop orders are explained in the glossary but cannot yet be placed on the desk. The virtual order screen leaves quantities to the learner. Comparing hypothetical account exposure can teach arithmetic, but this simplified fill model does not validate real-market risk management.",
        ],
      },
      {
        h: "What to practise on the desk",
        list: [
          "Position sizing: compare hypothetical quantities under the same adverse price move. A fixed fraction does not guarantee a smoother equity curve, and the current simulator does not execute automatic stop orders.",
          "Stop discipline: decide the exit before entering, then check in the journal whether you actually honoured it.",
          "Entry timing: note the price you intended versus the price you received on a fast-moving instrument, and record the gap in the journal.",
          "Concentration: run a week with five positions and a week with one, and compare the drawdown.",
        ],
      },
      {
        h: "Limits of any simulator",
        p: [
          "A simulator cannot reproduce slippage on illiquid instruments, brokerage fees, overnight financing, tax, or the specific emotional weight of losing money you actually need. Treat practice results as evidence about your process, not as a forecast of live returns. Past simulated performance does not predict future real-world performance.",
        ],
      },
    ],
    links: [
      { href: "/markets", label: "Choose an instrument" },
      { href: "/portfolio", label: "Your practice portfolio" },
      { href: "/how-to-trade", label: "How-to guides per asset" },
      { href: "/strategy", label: "Strategy walkthroughs" },
    ],
  },

  "/markets": {
    sections: [
      {
        h: "What is on the markets page",
        p: [
          "The markets page lists every instrument available in the simulator, grouped by asset class: US equities, cryptocurrencies, exchange-traded funds, major and minor forex pairs, and commodities. Each row shows the current simulated price and the day's change, and links to a dedicated page for that instrument.",
          "The Markets page uses simulated practice prices and estimated changes for visual feedback. Provider-backed, delayed or cached data may appear elsewhere on TradeHQ and is labelled separately when available. This is a learning environment, not a market-data terminal — do not use these quotes for any real decision.",
        ],
      },
      {
        h: "How to choose what to practise first",
        list: [
          "Start with something you already understand as a customer or user — a retailer, an index ETF, or a currency you have actually spent.",
          "Prefer liquid, well-covered instruments. Thin instruments punish beginners with wide spreads and erratic prices.",
          "Choose a manageable set of instruments and record what each exercise tests. No fixed study period establishes competence.",
          "Read the instrument's guide page before the first practice order so you know what typically moves it.",
        ],
      },
      {
        h: "Asset classes explained briefly",
        list: [
          "Stocks: fractional ownership of a listed company; move on earnings, guidance, sector rotation and rates.",
          "ETFs: funds with stated holdings and objectives. Diversification, concentration, leverage and product structure affect risk.",
          "Crypto: 24/7 markets with no closing bell, high volatility and a strong link to overall market liquidity.",
          "Forex: relative pricing of two currencies; driven by rate differentials, inflation prints and risk appetite.",
          "Commodities: exposures linked to physical goods, supply, demand and seasonal conditions. Company earnings and equity prices can also have seasonal influences.",
        ],
      },
    ],
    links: [
      { href: "/trade", label: "Open the trading desk" },
      { href: "/wiki", label: "Glossary of market terms" },
      { href: "/courses", label: "Structured courses" },
      { href: "/compare", label: "Asset comparisons" },
    ],
  },

  "/portfolio": {
    sections: [
      {
        h: "What the practice portfolio tracks",
        p: [
          "The portfolio page shows open positions with entry prices, current practice prices and unrealised profit or loss, plus this browser's history of closed trades. Guest records live in local storage. Signed-in cash and open positions can sync when the service is available; clearing browser data does not delete an account copy already stored on the server.",
          "Beyond raw P&L, the page calculates the metrics that actually describe a process rather than an outcome: fee-inclusive closed-result win rate, average win versus average loss, current open-position return dispersion, and practice maximum drawdown. The chart can include generated history; it is not a verified sequence of account observations.",
        ],
      },
      {
        h: "How to read your own numbers honestly",
        list: [
          "Compare win rate, average realized win, average realized loss and costs together. A high win rate alone does not establish a positive result.",
          "Maximum drawdown describes a selected peak-to-trough decline. It does not measure every risk or predict your response to a real loss.",
          "A short run is an observation, not proof of a repeatable advantage. Selection, dependence, costs and changing conditions matter; no fixed trade count establishes an edge.",
          "If one position drives most of the return, you learned about that position, not about your method.",
        ],
      },
      {
        h: "Why results here do not transfer one-to-one",
        p: [
          "The simulator applies a 0.1% practice transaction fee, rather than a real broker fee schedule. It does not model financing costs, taxes or actual market execution. Review practice results alongside these limits; they do not predict real-money results.",
        ],
      },
    ],
    links: [
      { href: "/trade", label: "Place a practice trade" },
      { href: "/learn-trading-guide", label: "Risk management guide" },
      { href: "/wiki/drawdown", label: "What drawdown means" },
    ],
  },

  "/learn": {
    sections: [
      {
        h: "Two different ways to learn here",
        p: [
          "TradeHQ separates learning into two formats on purpose. Full courses are structured multi-lesson tracks with quizzes, cited sources and a completion badge — use them when you want to actually learn a subject end to end. Quick reads are standalone articles that answer one question well; use them when you have a specific gap to fill.",
          "Both formats link to the virtual practice desk. Reading explains concepts; a simulated order can illustrate the arithmetic and interface, but the resulting virtual performance cannot validate financial competence.",
        ],
      },
      {
        h: "A suggested order for complete beginners",
        list: [
          "Use the beginner practice guide to learn what virtual orders, prices and fees mean, then follow a structured course for more detail.",
          "Use the trading psychology course to examine records, decisions and bias; it does not assign a universal cause to beginner losses.",
          "Use the macro course to read releases and distinguish observed information from uncertain explanations of price changes.",
          "Study the options and futures lessons as conceptual examples of contracts, leverage and risk; TradeHQ does not execute real or simulated derivative contracts.",
          "Keep the glossary open in a second tab and look up every unfamiliar term as it appears.",
        ],
      },
      {
        h: "How this material is written and reviewed",
        p: [
          "Lessons are designed for independent study. Relevant sources accompany many definitions and examples, while some references are background rather than evidence of a strategy's effectiveness. Numerical scenarios are illustrative, not forecasts or individual financial recommendations. Report missing or misleading citations through the Contact page.",
        ],
      },
    ],
    links: [
      { href: "/courses", label: "Structured courses" },
      { href: "/learn-trading-guide", label: "Beginner practice guide" },
      { href: "/wiki", label: "Trading glossary" },
      { href: "/learn/country", label: "Country guides" },
    ],
  },

  "/learn-trading-guide": {
    sections: [
      {
        h: "What this page actually provides",
        p: [
          "This page is a starting map and interactive practice dashboard, not a complete textbook or independently tested trading course. It introduces quote reading, simulated market orders, fees and reviewing hypothetical outcomes. Use the linked structured courses for deeper explanations of instruments, order types and portfolio concepts. The exercises illustrate arithmetic and questions to ask, not a profitable strategy.",
        ],
      },
      {
        h: "Four checks for a virtual practice exercise",
        list: [
          "Exposure: quantify the share of virtual cash used and calculate what a chosen adverse price change would do to the holding.",
          "Exit assumptions: write down both a higher and a lower hypothetical sale price. TradeHQ does not support resting limit or stop orders.",
          "Observation quality: record the quote source, timestamp, asset and quote currency. A generated chart need not reproduce traded market history.",
          "Review: retain the original assumptions, both virtual fees and alternative outcomes. One or ten practice results do not establish a repeatable advantage.",
        ],
      },
      {
        h: "Worked example: virtual shares, fees and two outcomes",
        p: [
          "Assume a purely hypothetical purchase of ten shares at $50 each. The gross cost is $500 and a 0.1% virtual purchase fee is $0.50, so the total cash used is $500.50. If the assumed sale price is $46, the gross proceeds are $460 and a 0.1% virtual sale fee is $0.46; net proceeds are $459.54. Compared with the original $500.50 cost, the round trip produces a loss of $40.96.",
          "For the same ten shares, a separate hypothetical sale at $54 yields $540 gross, less a $0.54 virtual sale fee, or $539.46 net. Subtract the $500.50 initial cost to get a gain of $38.96. These prices are invented, not a forecast or observed fills. Actual transactions can involve spreads, slippage, taxes and other costs not captured here.",
        ],
      },
      {
        h: "What this simulator cannot teach by itself",
        p: [
          "TradeHQ offers virtual market orders, not real brokerage transactions, short positions or resting limit/stop orders. Even when a displayed quote comes from an external provider, a simulated fill does not establish that the same price or liquidity would be available on an exchange.",
          "Use the structured courses and linked sources to check concepts rather than treating a synthetic sentiment label, an indicator, or a hypothetical growth calculator as a verified trading signal. Practice outcomes do not predict real-money results.",
        ],
      },
    ],
    links: [
      { href: "/courses", label: "Structured courses and quizzes" },
      { href: "/wiki", label: "Glossary: order terms and market mechanics" },
      { href: "/strategy", label: "Strategy concepts and limits" },
      { href: "/trade", label: "Virtual practice desk" },
    ],
  },

  "/leaderboard": {
    sections: [
      {
        h: "What the leaderboard shows",
        p: [
          "All public practice profiles can appear without a minimum trade count. Comparable portfolios receive numbered practice ranks after their first server-recorded trade, ordered by simulated return. Unranked members appear separately. New accounts start public and can switch private from their profile. Values use a $100,000 virtual starting balance and display quote freshness and simulation status.",
          "There is no prize, no fee and no real money involved. Use the scoreboard as a prompt to review exposure, costs and assumptions; rank alone does not measure a reliable method.",
        ],
      },
      {
        h: "How to read a ranking without fooling yourself",
        list: [
          "A large return over a handful of trades is insufficient evidence of skill; inspect exposure and the full record.",
          "Compare drawdown alongside return — a 60% gain that survived a 40% drawdown is a fragile method.",
          "Short windows can hide adverse paths and sample uncertainty. Compare consistent periods before drawing a conclusion.",
          "Nobody's practice ranking is a recommendation to copy their trades.",
        ],
      },
    ],
    links: [
      { href: "/challenge", label: "Challenge a friend" },
      { href: "/portfolio", label: "Your own metrics" },
      { href: "/trade", label: "Practice desk" },
    ],
  },

  "/ai-mentor": {
    sections: [
      {
        h: "What the AI mentor does",
        p: [
          "This chat matches your question to a built-in library of educational answers about trading concepts, indicators and order types. It does not call a language model, read your journal or assess a proposed investment. Separate portfolio mentor tools can use the simulated figures shown on that page.",
        ],
      },
      {
        h: "What it will not do",
        list: [
          "It does not give buy or sell recommendations, price targets or personalised financial advice.",
          "It does not know your real financial circumstances and cannot assess suitability.",
          "Authored answers and topic matching can be wrong or miss the question. Check important claims against a primary source.",
          "It is not a substitute for a licensed professional in your own jurisdiction.",
        ],
      },
      {
        h: "Getting useful answers",
        p: [
          "Ask about mechanics rather than what to buy. Try a supported topic such as risk/reward, diversification or dollar-cost averaging. Topic matching may return a general answer or miss your intent; it does not provide a personalised suitability assessment. Derivatives lessons are conceptual because this simulator does not trade options or futures contracts.",
        ],
      },
    ],
    links: [
      { href: "/courses", label: "Structured courses" },
      { href: "/wiki", label: "Glossary" },
      { href: "/learn-trading-guide", label: "Beginner guide" },
    ],
  },

  "/daily": {
    sections: [
      {
        h: "How the daily challenge works",
        p: [
          "Daily offers a quick hypothetical market scenario alongside a longer ten-question case study. You choose a response, compare the reasoning and trade-offs, then answer a short bonus knowledge question about market basics. Completing the quick reasoning step or all ten case-study questions advances the browser-stored streak at most once per local day. Directional reflections are not forecast scores.",
          "The scenario's prices, news events and dates are exercise inputs, not a report of what happened in today's markets. Choosing long, short or hold records a reflection; it does not place an order. Use the explanation to compare assumptions and uncertainty rather than treating completion as evidence of forecasting skill.",
        ],
      },
      {
        h: "Using a daily habit to support review",
        list: [
          "Skill in trading comes from repetition and review, and both need frequency.",
          "A small daily task is easier to sustain than a weekly marathon session.",
          "Streaks make the boring parts — journaling, reviewing, sizing — habitual.",
          "After a missed day, resume when your schedule allows; a streak is a participation aid, not a skill grade.",
        ],
      },
    ],
    links: [
      { href: "/trade", label: "Practice desk" },
      { href: "/wiki", label: "Glossary" },
      { href: "/challenge", label: "Challenge a friend" },
    ],
  },

  "/reviews": {
    sections: [
      {
        h: "Community reviews",
        p: [
          "This page collects visitor-submitted feedback about the practice simulator. Submissions appear automatically and can be moderated after publication. Browser and server-side duplicate checks limit repeat submissions, but identity and usage are not independently verified. Reviews are feedback about the product, not verified investment-performance testimonials.",
          "Signed-in visitors can like or unlike reviews once per account. Like totals are public; individual liker identities are private. Replies from the site owner are labelled separately from visitor feedback.",
          "A visible rating summarises the submissions currently displayed; it does not establish that each author used every feature or that the feedback represents all visitors. Read the specific task and experience described. For a factual correction or a privacy concern, the contact page provides a direct way to reach the maintainer.",
        ],
      },
      {
        h: "What we do not do",
        list: [
          "We do not pay for reviews or offer anything in exchange for one.",
          "We do not delete negative reviews that are honest about the product.",
          "Visitor reviews and leaderboards concern simulated activity; they are not independent evidence of actual investment skill, performance or income.",
        ],
      },
    ],
    links: [
      { href: "/about", label: "About TradeHQ" },
      { href: "/contact", label: "Contact us" },
    ],
  },

  "/challenge": {
    sections: [
      {
        h: "How a practice duel works",
        p: [
          "Create an invite link and send it to a friend. Both starting values are recorded when the invitation is accepted; the values can differ. The page shows a 30-day countdown and compares server-recorded simulated percentage changes. Final scores use trades and the last cached valuation quotes available at the deadline and are then frozen. Older client-summary duels are labelled legacy because reliable final values cannot be recovered.",
          "Nothing is wagered and nothing is won. There is no entry fee, no prize pool and no real money at any point — this is a study device that uses mild competition to make daily practice stick.",
        ],
      },
      {
        h: "Rules that make a duel actually useful",
        list: [
          "For a virtual challenge, agree on the example's quantity and exposure assumptions; TradeHQ does not provide leverage or real-money wagering.",
          "If participants choose to keep a virtual journal, compare stated assumptions and data-source labels rather than treating ranking as a measure of investment ability.",
          "Compare the illustrated drawdowns and simulated returns without claiming they establish superior real-world skill.",
          "Discuss which hypothetical assumptions were missing or changed; there is no prize or real-money outcome.",
        ],
      },
    ],
    links: [
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/trade", label: "Practice desk" },
      { href: "/portfolio", label: "Track your results" },
    ],
  },

  "/roadmap": {
    sections: [
      {
        h: "What this page is",
        p: [
          "The roadmap lists what has already shipped on TradeHQ and what is being worked on next, with honest status labels. Shipped identifies an implemented feature; account and community features still depend on the backend being available. Planned means it is intended but not built, and no confirmed delivery date is promised.",
        ],
      },
      {
        h: "What TradeHQ currently excludes from its educational scope",
        list: [
          "Real-money trading or any brokerage function.",
          "Trade signals, price targets or copy-trading.",
          "Paid tips, sponsored asset coverage or affiliate broker rankings.",
          "Anything that implies simulated performance predicts real returns.",
        ],
      },
    ],
    links: [
      { href: "/about", label: "About TradeHQ" },
      { href: "/contact", label: "Suggest a feature" },
    ],
  },

  "/about": {
    sections: [
      {
        h: "Who builds TradeHQ",
        p: [
          "TradeHQ is maintained as an independent educational project to help learners explore market mechanics with virtual balances. The simulator does not require or enable real-money trading.",
          "TradeHQ is an educational simulator, not a brokerage or registered investment adviser. It does not accept funds or place real securities orders, and no exchange or brokerage affiliation is claimed.",
        ],
      },
      {
        h: "How the content is produced",
        list: [
          "TradeHQ uses AI-assisted drafting and editing for educational material and software. Content is prepared for this site rather than syndicated; AI assistance does not establish accuracy or originality by itself.",
          "Factual claims about market mechanics cite exchange, regulator or central-bank documentation where possible.",
          "Illustrative chart-pattern labels, calculated indicators and hypothetical scenarios should not be interpreted as verified price forecasts or personalised instrument recommendations.",
          "Errors are corrected when reported; the contact page is the fastest route.",
        ],
      },
      {
        h: "How the project is funded",
        p: [
          "TradeHQ is free to use with no subscription and no paid tier. It is not funded by broker referrals or by payment for asset coverage, and no company pays to appear in a lesson, comparison or guide.",
        ],
      },
    ],
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
      { href: "/roadmap", label: "Roadmap" },
    ],
  },

  "/contact": {
    sections: [
      {
        h: "Getting in touch",
        p: [
          "The contact page lists email and phone details for the maintainer. Its form opens your own email client with a prepared draft; it does not send a message automatically or store submissions on TradeHQ. Response times vary with request volume. For a bug report, include the page URL and reproducible steps so the current build can be checked.",
        ],
      },
      {
        h: "What to include so we can help quickly",
        list: [
          "The exact page URL where the problem happened.",
          "What you expected to happen, and what happened instead.",
          "Your browser and whether you are on desktop or mobile.",
          "For content corrections: the sentence you believe is wrong and, ideally, a source.",
        ],
      },
      {
        h: "What we cannot answer",
        list: [
          "Requests for investment advice, trade ideas or price opinions — we do not provide them at any price.",
          "Account or money questions for real brokers; TradeHQ holds no funds and has no brokerage relationship.",
          "Requests to promote an asset, product or course on the site.",
        ],
      },
    ],
    links: [
      { href: "/about", label: "About TradeHQ" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },

  "/privacy": {
    sections: PRIVACY_SECTIONS.map(section => ({ h: section.title, p: section.content.split("\n\n") })),
    links: [...PRIVACY_REFERENCES, { href: "/terms", label: "Terms of service" }, { href: "/contact", label: "Contact TradeHQ" }],
  },

  "/terms": {
    sections: [
      {
        h: "The short version",
        p: [
          "TradeHQ is a free educational simulator. It does not execute real trades, does not hold money, and is not a broker, exchange or investment adviser. Nothing on the site is investment, financial, legal or tax advice, and no content is personalised to your circumstances.",
        ],
      },
      {
        h: "Your responsibilities",
        list: [
          "Use the simulator for learning, not as a source of trading recommendations.",
          "Do not present simulated results as real trading performance to anyone.",
          "Do not scrape, resell or republish the site's lessons and guides without permission.",
          "Follow the laws that apply where you live before trading with real money anywhere.",
        ],
      },
      {
        h: "Liability and accuracy",
        p: [
          "Market data may be delayed, incomplete or simulated between refreshes, and lessons may contain errors. We make no warranty of accuracy and accept no liability for decisions made using this site. Past simulated performance does not predict future real-world performance.",
        ],
      },
    ],
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/about", label: "About TradeHQ" },
      { href: "/contact", label: "Contact us" },
    ],
  },
};

export const DISCLAIMER = D;
