/**
 * Additional crawler-visible sections for the interactive/tool pages.
 * Merged onto STATIC_COPY in content.ts. Everything here must be true of
 * the live product — this is what Google and AdSense read.
 */

import type { PageSection } from "./content";

export const EXTRA_SECTIONS: Record<string, PageSection[]> = {
  "/": [
    {
      h: "Why practice first, honestly",
      p: [
        "The argument for a simulator is not that practice guarantees profit — it does not. It is that the cost of learning market mechanics is unavoidable, and you get to choose whether you pay it in money or in time. A beginner can practice buying and selling holdings with virtual capital, then review those decisions without risking savings. TradeHQ currently supports market orders only; it does not simulate resting limit orders or short positions.",
        "There is a real limitation to be honest about: a simulator removes the emotional weight of losing your own money, and that weight changes behaviour. Treat practice as the place to build a repeatable process — sizing, exits, journaling, review — and expect the emotional part to still be new when real money is involved.",
      ],
    },
    {
      h: "Common questions",
      list: [
        "Is TradeHQ free? Yes, entirely. There is no paid tier, no trial and no card required.",
        "Do I need an account? No. Practice trading, courses and the glossary work without signing up. An optional account supports profiles and community features. Account cash, positions and server-recorded trades restore across devices when available; earlier guest trade history, journals and course progress remain on the original browser.",
        "Is the money real? No. Every balance, order and result is simulated, and the platform holds no funds.",
        "Are the prices real? Supported assets use periodically refreshed provider observations. Unsupported assets can use fixed simulator prices; charts may be synthetic. Check each source and timestamp rather than assuming a continuous exchange feed.",
        "Does TradeHQ give advice? No. There are no signals, price targets or recommendations anywhere on the site.",
        "Where is my data? Guest practice records stay in your browser. Signed-in cash, positions and server-recorded trades are stored in Supabase and restored when the service is available. Earlier guest trade history, journal entries, course progress and streaks remain browser-held; a synced badge count does not restore the course record.",
      ],
    },
  ],

  "/trade": [
    {
      h: "Orders supported by this simulator",
      list: [
        "Market order: fills immediately at the shown simulated price. Simple, but in a fast market the price you see is not always the price you get — in real trading this gap is called slippage.",
        "Limit orders are explained in the learning material but are not available in the current simulator. Practice orders execute as market orders at the shown simulated price.",
        "Closing a position: sell some or all of an existing holding. You cannot sell more than you hold or open a short position. Completed buys and sells appear in portfolio trade history.",
      ],
    },
    {
      h: "A practice routine that actually builds skill",
      p: [
        "Choose an exercise with a stated question, record the assumptions before placing orders and review the result afterwards. Transaction count alone does not measure learning or validate a strategy.",
        "Every session should end with the same three questions written down: did I size this the way I said I would, did I exit where I said I would, and would I take this trade again knowing only what I knew at entry? Answering those honestly over a few months does more for results than any indicator.",
      ],
    },
  ],

  "/markets": [
    {
      h: "Reading a market list without being misled",
      p: [
        "A percentage move needs a clearly stated interval, observation source and comparison sample. A 3% move can have different meanings for different instruments and periods; it is not a permanent volatility category. Generated practice changes do not establish a real-market daily range.",
        "Volume describes trading activity when it is supplied by a valid market-data source. It does not establish the identity or intentions of buyers and sellers, or prove that a price move will continue or reverse. Simulated or unavailable volume cannot confirm an actual market event.",
      ],
    },
    {
      h: "Things that trip beginners on a markets screen",
      list: [
        "Chasing the biggest gainer of the day, which is usually the worst risk-reward entry available.",
        "Assuming a low nominal price means an asset is 'cheap' — price per unit says nothing about value.",
        "Treating an ETF as safe because it is diversified; a sector ETF can fall as hard as a single stock.",
        "Ignoring market hours: equities gap overnight, crypto trades continuously, forex has session-driven liquidity.",
      ],
    },
  ],

  "/portfolio": [
    {
      h: "The metrics explained in plain language",
      list: [
        "Unrealised P&L: what an open position is worth right now versus what you paid. It is not money until you close.",
        "Realised P&L: the result of trades you have actually closed. This is the number that measures decisions you finished making.",
        "Open positions in profit: the share of current open positions showing positive unrealised P&L. This is not a closed-trade win rate.",
        "Open-position P&L dispersion: the spread of current position returns around their average. This is a snapshot, not a Sharpe ratio or time-series volatility measure.",
        "Practice maximum drawdown: the largest fall from a peak in locally stored snapshots, which can include generated hourly backfill. It is not an observed market record or proof that a strategy is survivable.",
      ],
    },
    {
      h: "Reviewing the portfolio weekly",
      p: [
        "Set a fixed weekly review. Look at the three worst trades and ask whether each was a bad decision or a good decision with a bad outcome — the two are different, and confusing them is how traders abandon working methods and keep broken ones.",
        "Then look at the largest win with the same suspicion. Outsized winners often come from oversized positions rather than better analysis, and a habit that produces one great week can produce one catastrophic week later.",
      ],
    },
  ],

  "/learn": [
    {
      h: "What a realistic learning timeline looks like",
      p: [
        "Learning timelines differ with prior knowledge, study time and the task being practised. A calendar duration does not establish proficiency or investment readiness. Set an observable learning goal, such as explaining an order fill or reproducing a fee calculation, and record which parts remain uncertain.",
        "Nobody can promise you a timeline to profitability, and anyone who does is selling something. The material offers questions about position-size arithmetic, exit assumptions, record-keeping and instrument mechanics; completing it cannot guarantee that mistakes disappear.",
      ],
    },
    {
      h: "How to tell good trading education from bad",
      list: [
        "Good material explains mechanics and probability; bad material promises returns.",
        "Good material shows losing examples; bad material only shows winners.",
        "Good material cites exchanges, regulators and primary documents; bad material cites screenshots.",
        "Good material tells you who it is not for; bad material claims to suit everyone.",
        "Good material never asks you to hurry.",
      ],
    },
  ],

  "/learn-trading-guide": [
    {
      h: "The vocabulary you need before anything else",
      list: [
        "Bid and ask: the best price someone will buy at, and the best price someone will sell at. The gap between them is the spread, and it is a cost you pay on every round trip.",
        "Liquidity: how easily you can get in and out without moving the price. Low liquidity magnifies every other mistake.",
        "Volatility: how much an instrument typically moves. It defines what a sensible stop distance and position size look like.",
        "Leverage: borrowing to control a larger position. It multiplies both outcomes and is the most common reason beginners lose accounts quickly.",
        "Expectancy: average win times win rate, minus average loss times loss rate. This sample calculation also needs costs, uncertainty and a consistent outcome record; it does not by itself establish a lasting edge.",
      ],
    },
    {
      h: "A first-month plan",
      list: [
        "Week one: learn the vocabulary and place ten tiny practice trades with no goal other than seeing how orders behave.",
        "Week two: add a written plan to every trade — entry reason, size, invalidation level, target.",
        "Week three: keep the plan and add a journal review at the end of each day.",
        "Week four: stop trading for two days and read your own journal. The pattern in your mistakes is the curriculum for month two.",
      ],
    },
  ],

  "/leaderboard": [
    {
      h: "Why we show it at all",
      p: [
        "Competition is a blunt but effective tool for habit formation. A visible ranking makes people return, and returning is what builds the daily review habit that actually improves results. That is the entire justification for the leaderboard, and it is why the ranking carries no reward.",
        "Ranked practice uses server-recorded orders. Previous results preserve earlier browser-reported summaries separately, with their last-reported date. They do not enter current rankings and are not verified investment returns.",
      ],
    },
    {
      h: "Privacy on the leaderboard",
      list: [
        "New accounts start public. Your profile display name, profile fields and selected simulated statistics can appear on public pages; make your profile private to hide them.",
        "Only your chosen display name and simulated statistics appear — never an email address.",
        "You can stop publishing at any time and the entry is removed.",
      ],
    },
    {
      h: "Frequently asked",
      list: [
        "Do I have to appear here? No. New profiles start public, but you can switch public visibility off at any time from your profile page.",
        "Is there a prize? No. There is no money, no entry fee and nothing to win.",
        "Can I see someone's trades? Only the summary statistics they chose to publish, never their journal.",
        "How often does it update? Held assets are checked in the background every five minutes, with traditional instruments rotating through a limited batch. The visible board refreshes every minute. Provider delays and outages can leave older quotes; unsupported assets use fixed simulator prices.",
        "Who appears? All public members, including accounts with no trades. Only comparable server-recorded portfolios receive practice ranks after a first trade; imported portfolios stay unranked.",
      ],
    },
  ],

  "/ai-mentor": [
    {
      h: "Good questions to ask it",
      list: [
        "Explain what happens to a call option's value if the stock does not move for two weeks.",
        "What is the difference between a stop-loss order and a stop-limit order, and when does each fail?",
        "My practice win rate is 60% but I am down overall — what does that imply about my exits?",
        "Why do forex pairs move on interest-rate announcements?",
        "Walk me through how position size is calculated from account risk and stop distance.",
      ],
    },
    {
      h: "How it works and what it costs",
      p: [
        "The mentor uses a built-in library of authored educational answers, topic matching and calculations. Chat does not call an AI provider or use AI credits. Its coverage is limited to the available topics; an unfamiliar question may receive a general explanation rather than a tailored answer.",
        "Mentor topic matching happens in your browser and does not send the conversation to an AI provider. Advertising and analytics are separate services described in the privacy policy. Educational answers can still contain mistakes or omit context; check substantive claims against a primary source before relying on them.",
      ],
    },
    {
      h: "A reminder about limits",
      p: [
        "No assistant, however fluent, can assess whether a trade suits your finances, and none of the answers here are regulated advice. Treat the mentor as a patient tutor for mechanics and vocabulary, and take anything that sounds like a recommendation as a sign the question needs rewording.",
      ],
    },
  ],

  "/daily": [
    {
      h: "A longer daily practice session",
      p: [
        "The deeper exercise develops one case across three checkable questions, so the learner can calculate an input, interpret the result and identify a limitation. Topics rotate between portfolio arithmetic, transaction costs and supported orders, price-data freshness, risk and uncertainty, and decision habits. The visuals show selected hypothetical inputs with numeric labels; they are not live market charts. Worked explanations appear after each submitted answer, including when the answer was wrong.",
        "An optional reflection asks you to explain the case in your own words. Its review guide helps you check the reasoning without sending your note to an AI grader. Answers and reflections are saved on this browser, and the started exercise keeps its own snapshot if a new bank is approved while you are working. Clearing site data removes this local history; an account does not synchronize these notes to another device.",
        "A new 50-exercise bank is prepared every two calendar months in five parts using the configured free-tier Gemini API. Each completed bank remains private and editable in the owner’s admin panel until final review and approval. If generation hits a quota limit, fails validation or awaits review, the approved bank continues rotating. Fifty exercises can therefore repeat before the next bank begins; revisits are review practice rather than a claim of brand-new daily content. The feature does not use a paid provider fallback.",
      ],
    },
    {
      h: "What the challenges cover",
      list: [
        "A hypothetical market scenario with stated exercise inputs, rather than current market news.",
        "Comparing long, short and hold reasoning without grading one market direction as objectively correct.",
        "A bank of 50 deeper exercises, each with a substantial hypothetical case, a labelled visual and three linked questions with worked explanations.",
        "The existing short bonus quiz plus an optional longer reflection and a review guide.",
      ],
    },
    {
      h: "How the streak is counted",
      p: [
        "A streak advances once per calendar day in your own local time zone, so completing a challenge late one evening and early the next morning still counts as two consecutive days. The counter lives in your browser, which means clearing site data resets it and using a different device starts a separate count even when you have an account; sign-in does not back up local streaks.",
        "There is no penalty for missing a day beyond the counter resetting, and longer streaks unlock browser-local completion badges, not prizes or qualifications. Nothing about the challenge involves money, prizes or entry fees.",
      ],
    },
    {
      h: "If you miss a day",
      p: [
        "Nothing bad happens beyond the counter going back to one. The purpose of the streak is to make practice frequent, not to punish a missed evening, and restarting after a gap is the normal experience rather than a failure. The counter is not a judgment about you or a measurement of future returns.",
        "If daily practice does not fit your schedule, choose a workable review rhythm. A record of what you learned is more informative than a raw session count.",
      ],
    },
  ],

  "/reviews": [
    {
      h: "How reviews are handled",
      list: [
        "Browser storage and server-side duplicate checks limit repeat submissions; these checks do not verify identity.",
        "Submissions appear automatically and can be moderated after publication.",
        "We publish criticism. A page of only five-star reviews would tell you nothing.",
        "Reviews are about the software — usability, content quality, bugs — not about trading returns.",
      ],
    },
    {
      h: "What we would rather you sent us",
      p: [
        "A specific bug report or a specific content correction is worth more to the project than a rating. If a lesson is wrong, if a page renders badly on your phone, or if a term is missing from the glossary, the contact page reaches the maintainer directly and those messages are what actually change the site.",
        "If you are considering whether to use TradeHQ at all: it costs nothing, requires no account for the core features, and holds no money. The only thing at stake is your time.",
      ],
    },
    {
      h: "Reading reviews of any trading product",
      list: [
        "Be sceptical of any review mentioning profits — a simulator cannot produce them, and a real platform showing them proves nothing about you.",
        "Reviews that only appear in a cluster on the same day usually are a cluster from the same source.",
        "The most useful reviews describe a specific task the reviewer tried to complete and whether it worked.",
        "A product with no negative reviews is a product that removes them.",
      ],
    },
    {
      h: "Leaving one",
      p: [
        "You do not need an account to leave feedback. Browser and server-side duplicate checks limit repeat submissions. Say what you were trying to learn, what helped and what did not, including missing content or confusing pages.",
      ],
    },
  ],

  "/challenge": [
    {
      h: "What a duel does and does not prove",
      p: [
        "Thirty days is long enough to expose recklessness and short enough that luck still decides many outcomes. Someone who takes one enormous position and gets it right will beat a disciplined opponent over a month, and would very likely lose to them over a year. Read the result accordingly.",
        "The useful output of a duel is not the winner but the comparison of two journals covering the same market conditions. Two people who traded the same month and disagreed about what to do will each learn more from the other's reasoning than from the scoreboard.",
      ],
    },
    {
      h: "Practical details",
      list: [
        "Each participant uses their own recorded starting balance; those balances can differ.",
        "The scoreboard tracks percentage return so different activity levels stay comparable.",
        "The page shows a 30-day countdown based on the recorded duel dates.",
        "There is no fee, no stake, no prize and no real money — running a duel for money would be gambling, and this is not that.",
      ],
    },
    {
      h: "Setting up a duel",
      list: [
        "Create the duel and copy the invite link that appears.",
        "Send it to one person; the duel starts when they join.",
        "Joining records the second participant's current synced starting value; it does not reset either portfolio.",
        "The scoreboard and countdown appear on this page for both participants for the next 30 days.",
        "The countdown reaching zero does not stop simulator trading. Displayed scores use synced practice statistics and are not frozen, audited final standings.",
      ],
    },
  ],

  "/roadmap": [
    {
      h: "How features get prioritised",
      p: [
        "Requests that come through the contact page are weighted far more heavily than anything else, because a feature nobody asked for is usually a feature nobody uses. After that, the priority is whatever removes a known reason people fail to learn — better review tools beat more instruments, and clearer explanations beat more features.",
        "Historical dates identify recorded implementation milestones. Proposed features have no confirmed release date. A feature appearing in the code does not guarantee that its backend is available; account and community features depend on that service.",
      ],
    },
    {
      h: "Recently shipped",
      list: [
        "Four structured course tracks with quizzes, cited sources and completion badges.",
        "A full trading glossary with detailed explanations and related-term navigation.",
        "Localised country guides covering regulators, market access and realistic starting capital.",
        "Optional public trader profiles and a 30-day practice duel against a friend.",
        "Daily challenges with a local-time streak counter, plus journal and portfolio analytics.",
      ],
    },
    {
      h: "Proposed features",
      list: [
        "Portfolio projections are proposed as a way to explore hypothetical inputs, not as a promise of future returns.",
        "Embeddable price widgets are proposed; their data sources, update frequency and access requirements are not specified.",
        "These proposals are not available execution tools. Options and futures lessons remain conceptual; current simulator practice uses supported spot instruments.",
        "Public profile sharing requires public visibility and uses the /trader/{username} address. New profiles start public; visibility can be switched off at any time. The /trader/me route is an account view, not a public profile link.",
      ],
    },
    {
      h: "How to influence it",
      p: [
        "Guest portfolios, journals and course progress use browser storage. Optional sign-in stores account cash, positions and server-recorded trades for restoration on another device, alongside profile and community features. Earlier guest trade history, journals and course progress remain browser-held.",
        "The contact page is the roadmap's real input. Describe the thing you were trying to learn and where the site failed you — that is far more actionable than a feature name, and it is how most of the items above ended up on the list.",
      ],
    },
  ],

  "/about": [
    {
      h: "Why this site exists",
      p: [
        "Most people meet trading through advertising: a broker campaign, an influencer's screenshot, or an app that makes placing an order feel like a game. Almost none of that explains what an order actually does, what position sizing is, or how quickly leverage removes an account. TradeHQ exists to be the boring middle step between that advertising and someone's savings.",
        "TradeHQ does not present practice results as evidence of future income. Community Reviews publish visitor-submitted feedback without independently verifying identity or experience. The Community Practice Board displays server-recorded ranked simulated portfolios, not verified investment returns.",
      ],
    },
    {
      h: "Editorial standards",
      list: [
        "No price predictions, targets, signals or 'best asset' rankings anywhere on the site.",
        "No invented statistics, testimonials, credentials or performance figures.",
        "Numbers in lessons are worked examples and are labelled as such.",
        "Every page states that the platform is educational and simulated.",
        "Corrections are made promptly when a factual error is reported.",
      ],
    },
    {
      h: "Contacting the maintainer",
      p: [
        "The contact page reaches the person who writes and maintains everything here. Corrections, bug reports and feature requests all go to the same place; response times vary with request volume.",
      ],
    },
  ],

  "/contact": [
    {
      h: "Support questions we answer most often",
      list: [
        "My portfolio disappeared — check which account, browser and device you are using. Guest records are browser-held. Account cash, positions and server-recorded trades can be restored when the service is available. Earlier guest history, journals and course progress stay on the original browser. If sync fails, contact the maintainer before resetting the practice account.",
        "How do I reset my practice balance? There is a reset control in the portfolio area; it returns the account to $100,000 in virtual cash and clears open positions.",
        "A price looks wrong — quotes refresh periodically, can be stale or use a labelled fixed fallback, and need not match a broker’s executable price.",
        "Can I use TradeHQ on my phone? Yes, the whole site works on mobile browsers; there is no app to install.",
        "Do you have an affiliate or partnership programme? No.",
      ],
    },
    {
      h: "Reporting a content error",
      p: [
        "Content corrections are the most valuable messages we receive. Send the page URL, quote the sentence you believe is wrong, and where possible link a primary source such as an exchange rule book, a regulator page or a central-bank release. Corrections are applied to the live lesson rather than buried in an errata list.",
      ],
    },
    {
      h: "Response times and expectations",
      p: [
        "TradeHQ is maintained by one person, so response times vary with request volume and development work. Contact details include email and phone; there is no live support queue. If you have not heard back after a while, sending the message again is reasonable.",
      ],
    },
  ],

  "/privacy": [
    {
      h: "Cookies and analytics",
      p: [
        "TradeHQ stores guest practice records in local browser storage. Account cash, positions and server-recorded trades are stored with Supabase. Optional analytics and advertising services can use cookies or similar identifiers after the applicable consent choice; the privacy policy explains those providers and controls.",
      ],
    },
    {
      h: "Data you can send us, and what happens to it",
      list: [
        "Contact messages: kept only as long as needed to answer you.",
        "Reviews: published with your chosen display name, and removable on request.",
        "Accounts: email address and server-recorded practice trades and holdings; deletable on request. Guest practice, journal notes, course progress and Daily reflections remain browser-specific unless a feature explicitly states otherwise.",
        "Public trader profiles and duels: profile fields and selected simulated statistics can be public. New accounts start public, and you can make your profile private at any time.",
      ],
    },
    {
      h: "Children and jurisdiction",
      p: [
        "The core simulator works without an account, and optional signup does not collect age. Advertising availability depends on provider approval, settings and applicable consent choices; advertising consent is not an age check. Parents or guardians can raise privacy concerns through the contact page. TradeHQ holds no funds and executes no real trades. This policy does not determine the legal classification of the service or certify compliance in every jurisdiction.",
      ],
    },
    {
      h: "Changes and contact",
      p: [
        "TradeHQ does not sell simulated portfolio data to brokers. Optional analytics and advertising are separate third-party services described in the privacy policy and are subject to the user's applicable consent choices.",
        "If this policy changes materially, the updated text appears on this page. Questions about what is stored, requests for a copy of account data, and deletion requests all go through the contact page and are handled by the person who maintains the site rather than an automated system.",
      ],
    },
  ],

  "/terms": [
    {
      h: "No advisory relationship",
      p: [
        "Using this site creates no advisory, fiduciary or brokerage relationship of any kind. Lessons, glossary entries, comparisons, strategy walkthroughs and educational mentor responses are general educational information published to the public at large, with no knowledge of your circumstances, objectives, tax position or risk tolerance.",
        "Before trading real money, consider seeking advice from a professional licensed in your own jurisdiction. Trading involves the risk of losing more than you invest when leverage is used, and most retail accounts trading leveraged products lose money.",
      ],
    },
    {
      h: "Content, accounts and acceptable use",
      list: [
        "Lessons, guides and glossary entries are original work and remain the property of TradeHQ; short quotations with attribution are fine, wholesale republication is not.",
        "Accounts may be removed for abuse, spam, or attempts to present the simulator as a real trading record to third parties.",
        "Automated scraping that degrades the service for others is not permitted.",
        "These terms may change; material changes are reflected on this page.",
      ],
    },
    {
      h: "Availability and jurisdiction",
      p: [
        "You must be old enough to form a contract where you live to use the account features, and you are responsible for keeping your login details private. Accounts that are used to abuse other people through public profiles, reviews or duels can be removed.",
        "The service is provided as it is, without any guarantee of uptime, and features may change or be withdrawn. Because TradeHQ handles no money and executes no trades, disputes about market outcomes cannot arise from using it; anything relating to a real broker is between you and that broker.",
      ],
    },
  ],
};
