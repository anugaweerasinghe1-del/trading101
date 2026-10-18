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
          "The point of a simulator is to let you make the expensive mistakes for free. Most beginners lose money not because they picked the wrong stock but because they sized positions badly, moved a stop, doubled down after a loss, or traded an instrument they did not understand. All of those habits are visible in a practice account, and all of them are cheaper to unlearn there.",
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
      { href: "/learn-trading-guide", label: "Complete beginner guide" },
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
          "One order type is supported today: the market order, which fills immediately at the shown simulator price. Limit and stop orders are explained in the glossary but cannot yet be placed on the desk. Position sizing is entirely up to you, which is deliberate — learning to size a position is one of the few skills a simulator can teach almost as well as a live account.",
        ],
      },
      {
        h: "What to practise on the desk",
        list: [
          "Fixed-fraction sizing: risk the same small percentage of the balance on every trade and see how the equity curve smooths out.",
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
          "Commodities: physical goods with supply-and-demand and seasonality effects that equities do not have.",
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
          "Both formats point back at the same free practice account, because reading about position sizing and actually sizing a position are different skills, and only the second one shows up in your results.",
        ],
      },
      {
        h: "A suggested order for complete beginners",
        list: [
          "Read the complete beginner guide end to end so the vocabulary stops being a barrier.",
          "Use the trading psychology course to examine records, decisions and bias; it does not assign a universal cause to beginner losses.",
          "Use the macro course to read releases and distinguish observed information from uncertain explanations of price changes.",
          "Only then take options or futures, which are leveraged and unforgiving of gaps in the basics.",
          "Keep the glossary open in a second tab and look up every unfamiliar term as it appears.",
        ],
      },
      {
        h: "How this material is written and reviewed",
        p: [
          "Lessons are written in plain English, cite primary sources such as exchange and regulator documentation where a factual claim is made, and avoid predictions entirely. Where a lesson uses numbers, they are worked examples, not forecasts. Nothing here is personalised advice, and no lesson tells you what to buy.",
        ],
      },
    ],
    links: [
      { href: "/courses", label: "Structured courses" },
      { href: "/learn-trading-guide", label: "Complete beginner guide" },
      { href: "/wiki", label: "Trading glossary" },
      { href: "/learn/country", label: "Country guides" },
    ],
  },

  "/learn-trading-guide": {
    sections: [
      {
        h: "What this guide covers",
        p: [
          "This is the single long-form starting point on TradeHQ. It walks a complete beginner from not knowing what a bid-ask spread is through to placing a first practice trade with a written plan. It is deliberately sequential: markets and participants, instruments, order types, chart reading, risk sizing, journaling, and then the psychology that decides whether any of it survives contact with a losing streak.",
        ],
      },
      {
        h: "The parts most beginners skip",
        list: [
          "Position sizing: how much of the account a single idea is allowed to cost you if you are wrong.",
          "Exit planning: where the trade is invalidated, decided before entry rather than during a loss.",
          "Record keeping: a journal entry per trade, because memory rewrites losing trades into bad luck.",
          "Sample size: judging a method over dozens of trades instead of the last three.",
        ],
      },
      {
        h: "How to use it with the simulator",
        p: [
          "Use the $100,000 virtual practice account to explore the market-order, position-sizing and portfolio concepts supported by the simulator. Limit and stop orders are educational concepts in the guide; they cannot currently be placed on TradeHQ. Study those sections as explanations of real-market mechanics rather than instructions for an available simulator feature.",
        ],
      },
    ],
    links: [
      { href: "/courses", label: "Structured courses" },
      { href: "/wiki", label: "Glossary" },
      { href: "/strategy", label: "Strategy guides" },
      { href: "/trade", label: "Practice desk" },
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
          "The mentor is a chat assistant that explains trading concepts, indicators, order types and strategies in plain language, and comments on the practice trades in your simulated journal. It is a study aid: it explains why a moving-average crossover is a lagging signal, or what your win-rate and average-loss numbers imply about your sizing.",
        ],
      },
      {
        h: "What it will not do",
        list: [
          "It does not give buy or sell recommendations, price targets or personalised financial advice.",
          "It does not know your real financial circumstances and cannot assess suitability.",
          "It can be wrong. Language models make confident factual errors; verify anything that matters against a primary source.",
          "It is not a substitute for a licensed professional in your own jurisdiction.",
        ],
      },
      {
        h: "Getting useful answers",
        p: [
          "Ask about mechanics rather than outcomes. 'What does implied volatility do to an option's price into earnings?' is a good question. 'Should I buy this?' is not, and the mentor will decline it. Pair every answer with a practice trade so the concept becomes procedural rather than theoretical.",
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
          "We do not publish performance claims or income claims.",
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
          "Agree a maximum position size in advance so the duel does not become a coin-flip on leverage.",
          "Both traders journal every entry and exit; compare journals at the end, not just returns.",
          "Judge the winner on drawdown as well as return.",
          "Run a second duel afterwards with the losing habits explicitly banned.",
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
        h: "What TradeHQ will never add",
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
          "TradeHQ is built and maintained by Anuga Weerasinghe as an independent educational project. It began as a way to let students in markets with limited access to brokerage accounts learn how trading actually works before risking money they cannot afford to lose.",
          "TradeHQ is not a brokerage, not a registered investment adviser, and not affiliated with any exchange or broker. It holds no client money because it never handles money at all.",
        ],
      },
      {
        h: "How the content is produced",
        list: [
          "Lessons and guides are written for TradeHQ, not syndicated from elsewhere.",
          "Factual claims about market mechanics cite exchange, regulator or central-bank documentation where possible.",
          "Nothing on the site forecasts prices, and no page recommends an instrument.",
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
