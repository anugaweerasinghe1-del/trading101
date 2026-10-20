import optionsHero from "@/assets/courses/options-hero.jpg";
import futuresHero from "@/assets/courses/futures-hero.jpg";
import macroHero from "@/assets/courses/macro-hero.jpg";
import psychologyHero from "@/assets/courses/psychology-hero.jpg";

export interface CourseQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CourseLesson {
  slug: string;
  title: string;
  summary: string;
  readingMinutes: number;
  sourceCheck?: { date: string; scope: string };
  body: string[];
  keyTakeaways: string[];
  sources: { label: string; url: string }[];
  quiz: CourseQuizQuestion[];
}

export interface CourseTrack {
  editorial?: { assisted: boolean; reviewer: string; reviewedAt: string };
  slug: string;
  title: string;
  tagline: string;
  description: string;
  hero: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  badge: { name: string; description: string };
  /** Concrete capabilities the learner should have at the end of the track. */
  outcomes: string[];
  /** What the learner should already know or have done first. */
  prerequisites: string;
  /** How the lessons build on one another. */
  progression: string;
  /** Honest statement of who this track is not for. */
  notFor: string;
  lessons: CourseLesson[];
}

const DISC =
  "(Educational only — not financial advice. TradeHQ offers $100,000 virtual cash for supported spot instruments. Options contracts, Greeks, futures margin and settlement are conceptual exercises; the simulator does not execute them.)";

const optionsTrack: CourseTrack = {
  slug: "options-trading-fundamentals",
  title: "Options Trading Fundamentals",
  tagline: "Calls, puts, spreads and Greeks — decoded for beginners.",
  description:
    "A structured introduction to listed options — from call contracts and the Greeks to defined-risk spread examples. Work through contract payoffs on paper; TradeHQ's spot simulator does not execute options contracts.",
  hero: optionsHero,
  level: "Intermediate",
  badge: {
    name: "Options Fundamentals Completion",
    description:
      "Awarded after completing every lesson and submitting every quiz in the Options Trading Fundamentals track.",
  },
  outcomes: [
    "Read an option chain and explain what a specific call or put contract obliges each side to do.",
    "Estimate how a position's value changes when price, time or implied volatility moves, using delta, theta and vega rather than intuition.",
    "Calculate an intact vertical spread’s theoretical expiration payoff and distinguish costs, assignment and separate stock exposure.",
    "Recognise why an option can lose money even when the directional call was correct.",
    "Compare hypothetical option quantities with a stated loss budget without claiming any amount is personally survivable.",
  ],
  prerequisites:
    "You should be comfortable with what a share of stock is, how a market order differs from a limit order, and what a percentage return means. No mathematics beyond arithmetic is required. If you have never placed a simulated trade, spend an hour in the practice terminal first — the options lessons assume you have seen an order ticket.",
  progression:
    "The track moves from object to behaviour to structure. The first lesson defines the contract itself, because almost every later misunderstanding traces back to a fuzzy definition. The Greeks lesson then explains why the contract's price moves the way it does, which is what turns a static definition into something you can reason about. Spread worksheets compare bounded expiration payoffs under stated assumptions, separately from assignment, costs and stock exposure. The implied-volatility lesson compares direction, time and volatility without ranking their frequency as causes of losses. The final lesson is risk management, placed last deliberately: rules only make sense once you understand what they are protecting you from.",
  notFor:
    "This is not a track about income strategies, signal services or generating consistent weekly returns. It will not tell you which contracts to buy, and it does not cover selling naked options, which carries loss potential far beyond the premium received. If you are looking for trade recommendations rather than an explanation of how the instrument works, this material will disappoint you.",
  lessons: [
    {
      slug: "what-is-an-option",
      title: "What Is an Option? Calls & Puts Explained",
      summary:
        "A stock option gives its buyer a contractual right; contract size, exercise style and settlement terms determine what that right involves.",
      readingMinutes: 8,
      body: [
        "## The core definition",
        "This lesson focuses on standard unadjusted US equity options, which generally cover 100 shares. A call gives its buyer a right to buy and a put a right to sell at the strike under the contract terms. American-style options can be exercised before expiry; European-style options have a different exercise schedule. Adjusted contracts and cash-settled index options can have different deliverables. The writer takes the corresponding obligation. Read the specific contract and OCC risk disclosure rather than assume every option is identical.",
        "Because one contract controls 100 shares, a call option quoted at $2.50 actually costs $250 to buy. That single number embeds four separate ideas: the direction you expect (up for calls, down for puts), how far you expect the move to go (the strike), how much time you're giving it (the expiration), and how much volatility the market currently prices in.",
        "## Why options exist",
        "A share holder can buy a put to offset some losses below its strike during the option term, at the cost of its premium. A covered call adds premium income but limits upside and retains substantial share-price risk. These examples illustrate different payoffs; neither is a guaranteed return or a universally suitable position.",
        "## A simple worked example",
        "Imagine Apple trades at $180 and you buy one 30-day $185 call for $3.00 ($300 total). Three things can happen. If Apple closes above $188 on expiration, you're profitable — the intrinsic value of the call exceeds what you paid. If it closes between $185 and $188 you're partially in-the-money but net negative. If it closes at or below $185, the call expires worthless and you lose the full $300 — but nothing more. These are hypothetical expiration payoffs before costs for the purchased option alone. Exercise can create a stock position with separate funding and market risk. Short options have different obligations, and an uncovered short call can have unlimited loss.",
        "## What you can practise on TradeHQ",
        "TradeHQ supports spot instruments, including shares and ETFs, with $100,000 virtual capital. It does not model option strikes, expirations or premiums. Use this lesson's worked examples to calculate hypothetical contract payoffs on paper; buying an underlying share in the simulator is a different transaction from buying an option on it.",
        "> Options are contracts, not shares. You are trading a right that decays with time.",
        DISC,
      ],
      keyTakeaways: [
        "A standard unadjusted US equity option generally covers 100 shares; adjusted and other contracts can differ.",
        "At expiration, before costs, a purchased call has a net gain above strike + premium; a purchased put has a net gain below strike − premium. Those levels are break-even prices.",
        "A purchased option held without exercise can lose its premium plus costs; exercise can create a separate underlying position and obligations.",
        "Options can be used for hedging and speculation; their risk depends on the position and contract.",
      ],
      sources: [
        { label: "OCC — Characteristics and Risks of Standardized Options", url: "https://www.theocc.com/company-information/documents-and-archives/options-disclosure-document" },
        { label: "OIC — Options Basics", url: "https://www.optionseducation.org/optionsoverview/options-basics" },
        { label: "Cboe Options Institute", url: "https://www.cboe.com/education/" },
      ],
      quiz: [
        { question: "How many shares does one standard US equity option contract control?", options: ["10", "50", "100", "1,000"], correctAnswer: 2, explanation: "A standard unadjusted US equity option generally covers 100 shares. Adjusted deliverables and other option types differ." },
        { question: "What is the maximum loss for someone who buys (goes long) a single call option?", options: ["Unlimited", "The strike price × 100", "The premium paid", "The stock price × 100"], correctAnswer: 2, explanation: "For the purchased option alone before exercise and costs, loss is limited to the premium. Exercise can create a separate position." },
        { question: "A call option gives the buyer the right to:", options: ["Sell shares at the strike price", "Buy shares at the strike price", "Short the stock", "Receive dividends"], correctAnswer: 1, explanation: "Call = right to buy. Put = right to sell." },
        { question: "Buying a protective put alongside shares is an example of:", options: ["Eliminating every cost", "A guaranteed gain", "Hedging downside exposure", "Avoiding contract terms"], correctAnswer: 2, explanation: "A put can offset some downside below its strike, but the premium, expiry and other terms matter." },
      ],
    },
    {
      slug: "the-greeks-delta-gamma-theta-vega",
      title: "The Greeks — Delta, Gamma, Theta & Vega",
      summary:
        "The four Greeks quantify how an option's price reacts to stock moves, volatility, and the passage of time.",
      readingMinutes: 10,
      body: [
        "## Why Greeks matter",
        "Greeks are model-based sensitivities to inputs, holding other inputs fixed. Delta describes underlying-price sensitivity; gamma describes a change in delta; theta describes time sensitivity; vega describes implied-volatility sensitivity. Interest rates and dividends can also matter. Finite market moves need not equal a first-order estimate, and different pricing models can produce different values.",
        "## Delta — directional exposure",
        "A delta of 0.50 per share describes an approximate $0.50 option-price change for a $1 underlying move, with other inputs held fixed. For a 100-share contract that is about $50, before gamma and other effects. Some traders use delta as a rough probability shorthand, but it is not a calibrated real-world probability and need not match the model probability of finishing in the money.",
        "## Gamma — how fast delta changes",
        "Gamma measures how delta changes as the underlying moves. It is often relatively large near the strike close to expiry, depending on volatility and other inputs. Dealer hedging can affect demand, but a chart or open-interest figure alone does not establish dealer positions, required hedges or the cause of a price move.",
        "## Theta — the ticking clock",
        "Theta estimates an option value change as time passes under a model, holding other inputs fixed. State whether the quote is per share or per contract and whether a calendar or trading-day convention is used. Purchased options commonly have negative theta, but realised profit also depends on price, volatility and costs. Selling premium is not a guaranteed collection of that estimate.",
        "## Vega — volatility sensitivity",
        "Vega estimates sensitivity to a one-percentage-point change in implied volatility, with other inputs held fixed. Implied volatility can change around earnings, but it need not rise before every release or fall afterwards. A long option can lose despite a favorable underlying move if time decay and a volatility decline offset that move.",
        "> Every option position is really four separate bets: on direction, on the speed of that direction, on time, and on volatility.",
        DISC,
      ],
      keyTakeaways: [
        "Delta estimates underlying-price sensitivity, not a guaranteed payoff or real-world event probability.",
        "Gamma is often relatively large near the strike close to expiration; volatility and other model inputs also matter.",
        "Theta is a model sensitivity; other price changes can offset or exceed it.",
        "Vega measures volatility sensitivity; a change in implied volatility is a different quantity.",
      ],
      sources: [
        { label: "OIC — Delta", url: "https://www.optionseducation.org/advancedconcepts/delta" },
        { label: "OIC — Theta", url: "https://www.optionseducation.org/advancedconcepts/theta" },
        { label: "OIC — Vega", url: "https://www.optionseducation.org/advancedconcepts/vega" },
        { label: "Cboe — The Greeks", url: "https://www.cboe.com/education/tools/" },
      ],
      quiz: [
        { question: "What does theta measure?", options: ["Directional exposure", "Time decay per day", "Volatility sensitivity", "Interest-rate risk"], correctAnswer: 1, explanation: "Theta is a model estimate of time sensitivity with other inputs held fixed; units and time conventions must be stated." },
        { question: "In the lesson example, a 0.50 delta and a $1 underlying rise imply approximately what change per option share, before other effects?", options: ["$0.10", "$0.30", "$0.50", "$0.90"], correctAnswer: 2, explanation: "0.50 × $1 = $0.50 per share, holding other inputs fixed; this is not an event probability." },
        { question: "'IV crush' typically happens:", options: ["Right before earnings", "Right after earnings", "On Fed decision day", "At market open"], correctAnswer: 1, explanation: "A post-announcement drop in implied volatility is often called IV crush; it is not inevitable after every release." },
        { question: "Which Greek measures the rate of change of delta?", options: ["Vega", "Theta", "Gamma", "Rho"], correctAnswer: 2, explanation: "Gamma tells you how quickly delta itself changes." },
      ],
    },
    {
      slug: "defined-risk-spreads",
      title: "Defined-Risk Spreads — Verticals & Iron Condors",
      summary: "Vertical spreads and iron condors illustrate bounded expiration payoffs, with execution and assignment risks to consider.",
      readingMinutes: 9,
      body: [
        "## Comparing expiration payoffs",
        "A spread combines long and short options. Certain vertical spreads have bounded theoretical payoffs at expiration, unlike an uncovered short call. That comparison does not make spreads universally safe or suitable for beginners. TradeHQ does not execute options spreads; the examples below are worksheet exercises.",
        "## Bull call spread — a hypothetical example",
        "Assume one standard 100-share contract per leg, the same expiration, a $180 long call costing $4 per share and a $185 short call receiving $2. The net debit is $200. With both legs resolved as the expiration payoff assumes, the maximum loss is $200 and the maximum gain is ($185 - $180) × 100 - $200 = $300, before costs. At a $182 expiration price, the $200 intrinsic value offsets the debit for gross break-even. These selected quotes are arithmetic inputs, not current Apple prices or a recommended trade.",
        "## Iron condor — another payoff structure",
        "A short iron condor combines a put credit spread below and a call credit spread above the underlying price. With all four legs intact, its expiration payoff has a maximum gain equal to the net credit when the price lies between the short strikes. Movement beyond the range can produce a loss. Time decay and implied volatility affect its value before expiration; this structure is an example for comparison rather than a preferred trade.",
        "## A hypothetical sizing worksheet",
        "For arithmetic practice, suppose a worksheet assigns 1-2% of a hypothetical $100,000 account to a trade's planned loss budget: that is $1,000-$2,000. These percentages are assumptions, not an institutional standard or a recommendation for a real account. Repeated losses reduce equity, and correlated positions can lose together. The percentage alone does not establish how many trades an account can withstand.",
        "## What the payoff diagram leaves out",
        "Costs and poor fills can change realised results. American-style short options can be assigned before expiration. Exercise or assignment of only one leg can leave stock exposure, particularly near a strike at expiration. A bounded payoff diagram assumes the legs are maintained and resolved together; it is not a guarantee about every account outcome. Closing a spread can reduce remaining expiration exposure but adds execution costs and cannot undo earlier assignment.",
        "## Worksheet comparison",
        "Calculate the bull call example at expiration prices of $175, $182 and $190. Then add an assumed $8 in total costs: the gross outcomes of -$200, $0 and +$300 become -$208, -$8 and +$292. Separately describe what could happen if the short leg were assigned and the stock position remained open. Keep that exposure separate from the intact-spread payoff.",
        DISC,
      ],
      keyTakeaways: [
        "Certain spreads have bounded theoretical expiration payoffs when their legs remain intact.",
        "The example's $200 debit and $300 maximum gain exclude costs and additional stock exposure.",
        "An iron condor's range-based payoff does not make it a preferred or safe trade.",
        "TradeHQ supports spot simulation; options spreads are studied in worksheets.",
      ],
      sources: [
        { label: "OIC — Bull Call Spread and Assignment Risk", url: "https://www.optionseducation.org/strategies/all-strategies/bull-call-spread-debit-call-spread" },
        { label: "OIC — Short Condor (Iron Condor)", url: "https://www.optionseducation.org/strategies/all-strategies/short-condor" },
        { label: "OCC — Options Disclosure Document", url: "https://www.theocc.com/company-information/documents-and-archives/options-disclosure-document" },
      ],
      quiz: [
        { question: "For the intact bull call example, maximum expiration loss before costs is:", options: ["Unlimited", "The width of the spread", "The $200 net debit", "The strike price"], correctAnswer: 2, explanation: "Both calls expire worthless below $180, leaving the $200 debit as the gross loss. Costs and separate stock exposure are excluded." },
        { question: "An intact short iron condor has its maximum gross expiration gain when the underlying:", options: ["Rallies sharply beyond the upper wing", "Crashes beyond the lower wing", "Finishes between the short strikes", "Goes to zero"], correctAnswer: 2, explanation: "The four options expire without intrinsic value between the short strikes, leaving the credit before costs." },
        { question: "In the worksheet, 1-2% of a hypothetical $100,000 account equals:", options: ["$50,000", "$25,000", "$1,000-$2,000", "$100"], correctAnswer: 2, explanation: "100,000 × 0.01 to 0.02 = $1,000-$2,000. The percentages are illustrative assumptions, not a universal standard." },
        { question: "Why can an expiration payoff diagram understate account exposure?", options: ["It guarantees a profit", "It includes all commissions", "Assignment of one leg can leave a stock position", "Spreads cannot lose"], correctAnswer: 2, explanation: "The intact-spread payoff assumes both legs are resolved together. Assignment can create separate stock exposure and costs." },
      ],
    },
    {
      slug: "implied-volatility-and-earnings",
      title: "Implied Volatility & Trading Around Earnings",
      summary: "Implied volatility is a model-implied input derived from option prices, with limits as a forecast of realised volatility.",
      readingMinutes: 8,
      body: [
        "## What implied volatility actually is",
        "Implied volatility (IV) is the volatility figure that, plugged into an option pricing model, would produce the option's current market price. It is not a prediction any single person makes — it emerges from the aggregate bids and offers of every participant. Changes can reflect expected uncertainty, demand for protection and risk premiums. IV is model-dependent and need not equal later realised volatility.",
        "## IV rank vs IV percentile",
        "The raw IV number is meaningless without context. IV rank compares today's IV to the highest and lowest reading of the last 12 months on a 0-100 scale. IV percentile tells you what fraction of the last year the stock traded below today's IV. Neither an IV-rank threshold nor an IV-percentile threshold establishes a buy or sell rule. Compare the chosen lookback, option expiry, price source and costs before interpreting either measure.",
        "## The earnings trap",
        "Implied volatility often rises before earnings and can fall sharply afterwards. A trader can be directionally correct and still lose on a long option if the volatility drop and time decay outweigh the price move.",
        "## Comparing hypothetical earnings payoffs",
        "In a paper worksheet, compare hypothetical long-premium and defined-risk premium-selling structures around earnings to see how direction, implied volatility and the size of the actual move interact. TradeHQ does not price these structures. Avoid treating volatility selling as inherently safer; short premium can carry substantial risk.",
        "## Practice loop",
        "For a historical study, record dated option quotes and implied-volatility observations from an options-data source before and after an earnings announcement. Keep the expiry, strike and data methodology consistent, and record price changes as well as volatility changes. TradeHQ does not supply an options chain or IV-rank data. A small sample can illustrate mechanisms without establishing a reliable trading edge.",
        DISC,
      ],
      keyTakeaways: [
        "IV is inferred from option prices under a model; it can differ from future realised volatility.",
        "IV rank contextualises today's IV against the last 12 months.",
        "IV crush after earnings can turn a correct directional bet into a loss.",
        "Elevated implied volatility changes the payoff profile of premium-selling strategies, but higher premiums also reflect higher expected uncertainty and risk.",
      ],
      sources: [
        { label: "OIC — Vega and implied volatility sensitivity", url: "https://www.optionseducation.org/advancedconcepts/vega" },
        { label: "OIC — IV rank and percentile definitions", url: "https://www.optionseducation.org/news/june-office-hours-faqs-iv-statistics-position-management-and-the-wheel-strategy" },
      ],
      quiz: [
        { question: "IV rank of 80 means:", options: ["IV is at 80%", "IV is near a 12-month high", "IV is near a 12-month low", "80% of options are profitable"], correctAnswer: 1, explanation: "IV rank normalises IV against the last year on a 0-100 scale." },
        { question: "Why can a long option lose even if the price moves in the expected direction after earnings?", options: ["Because options never follow the underlying", "A drop in implied volatility and time value can offset the directional gain", "Because earnings cancel the contract", "Because all options are illiquid"], correctAnswer: 1, explanation: "Option value depends on more than direction; implied volatility and time value can change sharply after earnings." },
        { question: "What does a high IV rank tell you?", options: ["A premium-selling trade is guaranteed to work", "Current implied volatility is high relative to its own recent range", "The stock must fall", "The next move will be small"], correctAnswer: 1, explanation: "IV rank is context about relative option pricing, not a standalone buy or sell signal." },
        { question: "Implied volatility is:", options: ["Historical vol over 30 days", "An exchange forecast", "The volatility that makes model = market price", "The stock's beta"], correctAnswer: 2, explanation: "IV is the vol input that reconciles a pricing model with the live option price." },
      ],
    },
    {
      slug: "options-risk-management",
      title: "Options Risk Management — Sizing, Rolling & Cutting Losses",
      summary: "Options losses can be amplified by position size, leverage, volatility and time decay. This lesson measures those risks using hypothetical contract examples.",
      readingMinutes: 9,
      body: [
        "## Illustrative 1% budget for a defined-risk worksheet",
        "For simulation, choose a small predefined risk budget before entering a position and compare how different limits affect drawdown. For example, 1% of a $100,000 practice account is $1,000. This is an educational parameter, not a universal real-money rule.",
        "## Testing a hypothetical loss multiplier",
        "Naked puts and short strangles can create losses far larger than the premium collected. In a paper worksheet, model adverse moves explicitly and compare the resulting losses with a hypothetical risk budget rather than relying on one fixed multiplier. TradeHQ does not execute these option positions.",
        "## Rolling — extending, not doubling down",
        "Rolling means closing an existing option and opening another with a different expiry and sometimes a different strike. A credit or debit alone does not determine whether the adjustment makes sense; compare the new maximum loss, break-even points, time remaining and total capital at risk in a worked example. Rolling options is not supported by TradeHQ's order engine.",
        "## When to cut a loss",
        "Predefined exits can prevent open-ended decision-making, but no single percentage works for every option structure. In a worksheet with appropriate historical option prices, compare several hypothetical exit rules and record drawdown, average loss and opportunity cost. Account for execution assumptions and costs; TradeHQ's spot simulator cannot perform this options backtest.",
        "## Journaling every trade",
        "For each hypothetical options example, record the thesis, dated volatility inputs, contract size, possible loss, exit assumptions and calculated P&L in a separate worksheet. TradeHQ's journal records supported simulator trades; it does not automatically capture options contracts or IV rank. Reviewing examples may reveal recurring mistakes, but no fixed number of trades establishes a reliable edge.",
        DISC,
      ],
      keyTakeaways: [
        "Use a predefined practice risk budget and record the effect on drawdown.",
        "Model adverse scenarios for structures whose losses can exceed the premium collected.",
        "Evaluate a roll by its full risk profile, not only by whether it creates a credit or debit.",
        "Test predefined exits in simulation rather than treating one threshold as universal.",
      ],
      sources: [
        { label: "OCC — Options Risk Disclosure", url: "https://www.theocc.com/company-information/documents-and-archives/options-disclosure-document" },
        { label: "OIC — Options Basics", url: "https://www.optionseducation.org/optionsoverview/options-basics" },
      ],
      quiz: [
        { question: "Why define a risk budget before a simulated options trade?", options: ["To guarantee profit", "To control the potential effect of one loss", "To predict volatility", "To avoid all drawdowns"], correctAnswer: 1, explanation: "A predefined risk budget limits how much one trade can affect the practice account; there is no universal percentage that fits every trader or strategy." },
        { question: "What should be compared when evaluating a roll?", options: ["Only whether it creates a credit", "Only the new expiry", "The new risk, break-even points, cost and time remaining", "Nothing — rolling is always better"], correctAnswer: 2, explanation: "A roll changes several dimensions of the position, so the full risk profile matters more than credit versus debit alone." },
        { question: "How can a hypothetical options exit rule be studied outside TradeHQ’s spot engine?", options: ["Assume one percentage always works", "Use a separate options-data worksheet with explicit fills and costs", "Change the rule after every loss", "Ignore position size"], correctAnswer: 1, explanation: "TradeHQ cannot execute an options backtest. A separate worksheet needs actual options observations and assumptions; a selected sample cannot validate future performance." },
        { question: "Why journal every trade?", options: ["Tax only", "Review recorded assumptions and mistakes", "Required by regulators", "Boosts win rate automatically"], correctAnswer: 1, explanation: "A journal records assumptions and observed mistakes. It does not prove a statistical edge or predict future profits." },
      ],
    },
  ],
};

const futuresTrack: CourseTrack = {
  slug: "futures-and-derivatives",
  title: "Futures & Derivatives",
  tagline: "Contracts, margin, contango and hedging — the trader's toolkit.",
  description:
    "A ground-up guide to exchange-listed futures — how contracts are specified, how margin actually works, why term-structure matters, and how hedgers and speculators interact on the CME.",
  hero: futuresHero,
  level: "Intermediate",
  badge: { name: "Futures Fundamentals Completion", description: "Awarded after completing every lesson in the Futures & Derivatives track." },
  outcomes: [
    "Explain what a futures contract standardises and who the natural counterparties in a market are.",
    "Calculate the notional value behind a contract and the margin actually required to hold it.",
    "Read a term structure and say whether a market is in contango or backwardation, and what that implies for anyone holding a rolling position.",
    "Describe how a producer or consumer uses futures to hedge a real-world exposure.",
    "Compare contract multipliers and notional exposure against a stated hypothetical account value; smaller contracts still carry leveraged risk.",
  ],
  prerequisites:
    "Some familiarity with charts and with the idea of buying and selling an asset. The margin lesson involves multiplication and percentages, nothing more. The Trading Decisions and Behaviour track offers optional exercises for recording assumptions. No lesson establishes a suitable real-money contract size or leverage level.",
  progression:
    "The sequence starts with contract specifications, then margin and leverage. Term structure follows to explain differences between delivery prices and rolling exposure. Hedging introduces basis risk, and micro contracts illustrate smaller multipliers. No contract size is universally suitable, and losses are not limited to the margin deposit.",
  notFor:
    "This track does not teach day-trading systems, scalping methods or any approach that relies on high leverage to produce results. It does not cover crypto perpetual contracts, which have different funding mechanics. High notional exposure relative to account equity magnifies losses; this track does not establish a measured survival rate or a suitable real-money leverage level.",
  lessons: [
    {
      slug: "what-is-a-futures-contract",
      title: "What Is a Futures Contract?",
      summary: "A futures contract is a standardised, exchange-traded agreement to buy or sell a fixed quantity of an asset at a set price on a set future date.",
      readingMinutes: 8,
      body: [
        "## The core definition",
        "A futures contract is a standardised, exchange-traded agreement with a specified underlying asset or reference, contract size and settlement date. Settlement can involve physical delivery or a cash payment under the contract rules. The clearing house acts as central counterparty to cleared trades and uses margin, settlement and default safeguards to manage risk. Clearing reduces counterparty exposure; it does not make default impossible or protect a position from market losses.",
        "## Contract specifications matter",
        "Every futures contract has a spec sheet: contract size, tick size, tick value, trading hours, delivery month, and settlement method (physical or cash). These details determine the exposure and settlement obligations. One E-mini S&P 500 contract represents $50 × the index — with the index at 5,000, a single contract has $250,000 of notional exposure.",
        "## Long and short positions",
        "A participant can open a long futures position by buying or a short position by selling the contract. A short futures position does not require first borrowing the underlying asset as a short stock sale does. Both directions remain subject to margin requirements, broker permissions and applicable exchange rules, including position limits. The contract's settlement obligations still matter; being able to sell first does not mean that trading is unrestricted.",
        "## Speculators and price discovery",
        "Hedgers use futures to offset exposure to price changes in another activity or holding. Speculators accept price exposure in pursuit of a trading profit. For a hypothetical producer, a short futures position may offset some losses from a falling sale price; the hedge can be imperfect if the cash and futures prices move differently. These roles help explain why participants trade. This lesson does not assign a universal percentage of market volume to either group.",
        DISC,
      ],
      keyTakeaways: [
        "A futures contract is a standardised exchange agreement to transact a fixed asset at a future date.",
        "The clearing house manages counterparty risk through safeguards; it does not eliminate all risk.",
        "Both long and short futures positions remain subject to margin, permissions and exchange rules.",
        "Every contract has a spec sheet — always read it.",
      ],
      sources: [
        { label: "CME — Futures introduction and participant roles", url: "https://www.cmegroup.com/education/courses/introduction-to-futures" },
        { label: "CME — Introduction to Futures", url: "https://www.cmegroup.com/education/courses/introduction-to-futures" },
        { label: "CME — E-mini S&P 500 contract specifications", url: "https://www.cmegroup.com/markets/equities/sp/e-mini-sandp500.contractSpecs.html" },
        { label: "CME — Clearing safeguards", url: "https://www.cmegroup.com/solutions/risk-management/financial-safeguards.html" },
        { label: "CME — Position limits overview", url: "https://www.cmegroup.com/education/courses/market-regulation/position-limits/position-limits-overview" },
      ],
      quiz: [
        { question: "The central counterparty on a US futures exchange is:", options: ["The buyer", "The seller", "The exchange's clearing house", "The broker"], correctAnswer: 2, explanation: "The clearing house novates every trade." },
        { question: "Notional value of one E-mini S&P at index 5,000 ≈", options: ["$5,000", "$50,000", "$250,000", "$1,000,000"], correctAnswer: 2, explanation: "$50 × 5,000 = $250,000." },
        { question: "Which statement about opening a short futures position is correct?", options: ["It removes margin requirements", "It is exempt from exchange rules", "It does not require borrowing the underlying asset first", "It guarantees a maximum loss"], correctAnswer: 2, explanation: "Selling a futures contract creates short exposure, subject to margin and applicable trading rules." },
        { question: "A producer uses a short futures position to offset falling sale prices. This is an example of:", options: ["Guaranteed profit", "Eliminating default risk", "Hedging price exposure", "Avoiding all settlement obligations"], correctAnswer: 2, explanation: "The futures position can offset some price exposure, but a hedge need not remove every risk." },
      ],
    },
    {
      slug: "margin-and-leverage-in-futures",
      title: "Margin & Leverage in Futures",
      summary: "Futures margin is collateral for contract obligations. Losses and variation-margin demands can exceed an initial margin deposit.",
      readingMinutes: 8,
      body: [
        "## Margin is not what you think",
        "Stock margin can involve borrowing to purchase shares. Futures margin is collateral, often called a performance bond, rather than a loan to purchase the contract's notional value. It does not cap losses. Exchange requirements vary by contract and market conditions, and brokers can require additional funds. The figures below are a hypothetical worksheet, not current margin requirements.",
        "## Maintenance margin and margin calls",
        "Maintenance margin is the minimum account equity required to maintain a position. It is not a universal percentage of initial margin. A shortfall can require additional funds or a reduction in positions; a broker may liquidate positions under its rules. Requirements can change, and action may occur intraday. Check the contract requirements and broker agreement instead of assuming a fixed deadline or a guaranteed warning.",
        "## Daily mark-to-market",
        "Futures positions are marked to market, with gains and losses settled through variation margin. Daily settlement limits the accumulation of unpaid losses, and clearing arrangements may include intraday settlement. It does not eliminate default or overnight risk: clearing houses also use collateral and other financial safeguards. A hypothetical $2,000 loss reduces the account's funds; the timing of customer-account entries depends on the broker's arrangements.",
        "## Why leverage cuts both ways",
        "For a hypothetical E-mini S&P 500 contract at an index level of 5,000, the $50 multiplier gives $250,000 of notional exposure. A 1% index move is 50 points, or $2,500 per contract before costs. Relative to an assumed $13,000 margin deposit, that is about 19.2%; it is not a percentage of every trader's total account equity. A different index level, contract quantity or account balance changes the calculation.",
        DISC,
      ],
      keyTakeaways: [
        "Futures margin is a performance bond, not a loan.",
        "Accounts are marked-to-market every trading day.",
        "A maintenance shortfall can require more funds, reduced positions or liquidation under broker rules.",
        "Leverage depends on contract exposure and the equity used in the calculation.",
      ],
      sources: [
        { label: "CME — Margin: Know What Is Needed", url: "https://www.cmegroup.com/education/courses/introduction-to-futures/margin-know-what-is-needed" },
        { label: "CME — Financial Safeguards", url: "https://www.cmegroup.com/solutions/risk-management/financial-safeguards.html" },
      ],
      quiz: [
        { question: "Futures margin is best described as:", options: ["A loan", "A performance bond", "A fee", "A tax"], correctAnswer: 1, explanation: "It is collateral supporting the position, not a loan or a cap on losses." },
        { question: "Futures accounts are marked-to-market:", options: ["Yearly", "Monthly", "Every trading day", "Only at expiration"], correctAnswer: 2, explanation: "Daily settlement moves cash in/out." },
        { question: "In the worksheet (index 5,000, $50 multiplier), a 1% move relative to an assumed $13,000 deposit is approximately:", options: ["1%", "5%", "~19%", "50%"], correctAnswer: 2, explanation: "$2,500 on $13,000 ≈ 19%." },
        { question: "A margin call means:", options: ["You made money", "Deposit more or be liquidated", "Exchange closed", "Broker owes interest"], correctAnswer: 1, explanation: "The broker may require additional funds or reduce or liquidate positions under its rules." },
      ],
    },
    {
      slug: "contango-and-backwardation",
      title: "Contango & Backwardation — Term Structure Explained",
      summary: "Compare prices across delivery dates and study carrying costs, supply conditions and the assumptions behind rolling exposure.",
      readingMinutes: 9,
      body: [
        "## Term structure — the futures curve",
        "A futures curve compares quoted prices across the delivery dates available for a specified contract family and observation time. The number of listed expirations varies by product and exchange. Later delivery priced above nearer delivery is commonly called contango; the reverse comparison is backwardation. State which dates are being compared rather than assume the entire curve has one slope.",
        "## Why contango happens",
        "Carrying costs such as storage, insurance and financing can contribute to higher prices for later delivery. A simplified example with $4 of carrying costs may illustrate that relationship, but convenience yield, constraints and market conditions also matter; there is no universal $4 premium or default curve.",
        "## Why backwardation happens",
        "Backwardation means later-delivery contracts trade below nearer delivery in the comparison being made. Supply conditions and the value of immediate availability can contribute, but the curve alone does not prove a physical shortage or identify a future price direction.",
        "## The roll yield trap",
        "A fund with futures exposure may replace expiring contracts according to its current published methodology. Rolling can affect performance relative to spot, alongside collateral returns, fees and the price path. A roll is not an automatic cash loss equal to the price gap; inspect the specific fund and observation period.",
        "## Trading implications",
        "The curve records prices for different delivery dates. It is context for an educational comparison, not an automatic top, bottom or squeeze signal and not a direct measurement of commercial hedger positioning.",
        DISC,
      ],
      keyTakeaways: [
        "Contango: later delivery trades above nearer delivery in the comparison; carrying costs can contribute.",
        "Backwardation: later delivery trades below nearer delivery; the curve alone does not establish a shortage.",
        "Futures-fund returns depend on methodology, contract price changes, collateral returns and costs.",
        "The curve shows delivery prices, not the identity or positioning of participants.",
      ],
      sources: [
        { label: "CME — Contango/Backwardation", url: "https://www.cmegroup.com/education/courses/introduction-to-precious-metals/what-is-contango-and-backwardation" },
        { label: "FRED — WTI", url: "https://fred.stlouisfed.org/series/DCOILWTICO" },
      ],
      quiz: [
        { question: "Further-dated below front month =", options: ["Contango", "Backwardation", "Equilibrium", "Rollover"], correctAnswer: 1, explanation: "Backwardation describes relative delivery prices; it does not by itself prove a shortage." },
        { question: "Which factor can make a futures fund differ from spot performance?", options: ["Guaranteed gains", "Contract selection and rolling methodology", "No costs", "Identical exposure"], correctAnswer: 1, explanation: "Methodology, contract price changes, collateral returns and costs affect fund performance." },
        { question: "Contango is typical for:", options: ["Perishables", "Storable commodities in normal markets", "Only metals", "Only ags"], correctAnswer: 1, explanation: "Storage costs push distant deliveries up." },
        { question: "Which condition can contribute to backwardation, without being proven by the curve alone?", options: ["Quiet market", "Physical shortage", "Delisting", "Low vol"], correctAnswer: 1, explanation: "Hedgers pay for immediate supply." },
      ],
    },
    {
      slug: "hedging-with-futures",
      title: "Hedging with Futures — The Original Use Case",
      summary: "Hedging is one use of futures. Airlines may hedge fuel, producers may hedge output, and funds may hedge equity beta.",
      readingMinutes: 8,
      body: [
        "## The airline case study",
        "Hypothetical cross-hedge: an airline with future jet-fuel costs considers a crude-oil futures position. Rising futures prices could offset part of a higher fuel bill, but jet fuel and crude oil are different products, the hedge quantity and delivery dates may not match, and margins can require cash before the fuel purchase. It is not a lock on the airline’s complete fuel cost.",
        "## The farmer case study",
        "Hypothetical producer hedge: a farmer expecting to sell corn later takes a short futures position in a chosen contract month. A fall in the futures price could produce a gain offsetting part of a lower cash sale price. The final result also depends on local basis, quantity, crop yield, contract terms and costs. The futures entry price is not a guarantee of the final net farm receipt.",
        "## Portfolio hedging with equity index futures",
        "In a hypothetical worksheet, $50 million divided by $250,000 of contract notional gives 200 contracts. That arithmetic assumes one-for-one exposure; actual hedge sizing also depends on portfolio beta, basis risk and contract specifications. It does not guarantee full neutralisation or establish trading volume.",
        "## The hedge is never perfect",
        "Basis risk concerns changes in the relationship between the hedged exposure and the futures price. A hedge can reduce one exposure while introducing margin liquidity, execution and operational risks. Its effectiveness depends on the products, quantities, dates and outcome being measured; neither complete protection nor a fixed amount of risk reduction follows from the label hedge.",
        DISC,
      ],
      keyTakeaways: [
        "Hedging uses a position to offset a specified exposure; it need not eliminate every risk.",
        "Producers sell; consumers buy.",
        "Equity funds hedge beta by shorting index futures.",
        "Basis changes, cash-flow needs and mismatched quantities can affect a hedge.",
      ],
      sources: [
        { label: "CME — Hedging", url: "https://www.cmegroup.com/education/courses/introduction-to-futures" },
        { label: "CME — Hedgers and futures mechanics", url: "https://www.cmegroup.com/education/courses/introduction-to-futures" },
      ],
      quiz: [
        { question: "Which conceptual futures direction offsets some exposure to a falling wheat sale price?", options: ["Buy wheat futures", "Sell wheat futures", "Buy corn futures", "Buy S&P"], correctAnswer: 1, explanation: "A short wheat future can gain when its futures price falls, but basis, quantity and costs affect the combined result." },
        { question: "Which conceptual crude futures position gains if its futures price rises?", options: ["Sell crude futures", "Buy crude futures", "Buy S&P", "Do nothing"], correctAnswer: 1, explanation: "Buying futures profits if crude rises." },
        { question: "Basis risk is:", options: ["Exchange default", "Futures vs physical don't move perfectly together", "Rate risk", "FX risk"], correctAnswer: 1, explanation: "Basis fluctuates." },
        { question: "Hedge $50M with $250K notional contracts →", options: ["20", "200", "500", "1,000"], correctAnswer: 1, explanation: "$50M / $250K = 200." },
      ],
    },
    {
      slug: "micro-futures-for-beginners",
      title: "Micro Futures — Contract Size and Risk",
      summary: "Compare Micro E-mini equity-index contracts with their E-mini counterparts, while checking each product’s specifications and risks.",
      readingMinutes: 7,
      body: [
        "## What micros are",
        "CME's Micro E-mini S&P 500, Nasdaq-100, Dow and Russell 2000 contracts are one-tenth the size of their respective E-mini equity-index contracts. For example, MES has a $5 multiplier per index point, compared with $50 for ES. Do not apply that ratio to every product called micro, including unrelated crypto contracts. Margin requirements must be checked separately with the exchange and broker.",
        "## Smaller contracts still carry risk",
        "A smaller contract allows finer adjustments to notional exposure, but does not establish a trading edge or prevent excessive risk. Ten MES contracts have the same index-point exposure as one ES contract, before differences in costs. Compare the total number of contracts, account equity and potential price movement rather than assuming that a micro label makes a position safe.",
        "## Compare the contract specifications",
        "MES and ES both use a 0.25-index-point minimum price increment. That tick is worth $1.25 for one MES contract and $12.50 for one ES contract. Futures margin and settlement principles apply to both, but fees, liquidity and broker requirements need separate checks. For a hypothetical index level of 5,000, one MES contract represents $25,000 of notional exposure; the margin deposit is not the amount of exposure or a maximum loss.",
        "## On the simulator",
        "TradeHQ's $100,000 practice account supports spot instruments. It does not model futures contracts, initial or maintenance margin, daily settlement, or margin calls. Use a paper worksheet to calculate a hypothetical contract's daily P&L and margin balance; buying a similarly named spot instrument does not reproduce futures mechanics.",
        DISC,
      ],
      keyTakeaways: [
        "The four Micro E-mini equity-index contracts are one-tenth their respective E-mini contract sizes.",
        "Check each contract’s multiplier, tick value, fees, liquidity and margin requirements.",
        "Micros let beginners scale one contract at a time.",
        "TradeHQ offers spot practice; futures margin and settlement remain worksheet exercises.",
      ],
      sources: [
        { label: "CME — Micro E-mini", url: "https://www.cmegroup.com/markets/equities/sp/micro-e-mini-sandp-500.html" },
      ],
      quiz: [
        { question: "A micro E-mini S&P (MES) is what fraction of a standard e-mini?", options: ["1/2", "1/5", "1/10", "1/100"], correctAnswer: 2, explanation: "MES has a $5 multiplier versus $50 for ES; margin requirements are checked separately." },
        { question: "One 0.25-point tick in one MES contract is worth:", options: ["$0.25", "$1.25", "$12.50", "$50"], correctAnswer: 1, explanation: "0.25 points × $5 per point = $1.25 before costs." },
        { question: "Which MES and ES comparison is correct?", options: ["Fees must be identical", "Margin never changes", "MES uses $5 per point; ES uses $50", "MES losses cannot exceed margin"], correctAnswer: 2, explanation: "The multipliers determine index-point exposure; other requirements need separate checks." },
        { question: "At a hypothetical index level of 5,000, one MES contract represents:", options: ["$5,000", "$25,000", "$250,000", "$1,250"], correctAnswer: 1, explanation: "5,000 × $5 = $25,000 of notional exposure, not a margin quote or maximum loss." },
      ],
    },
  ],
};

const macroTrack: CourseTrack = {
  slug: "macro-reading-for-traders",
  title: "Macro Reading for Traders",
  tagline: "CPI, the Fed, the yield curve and the dollar — how the pieces connect.",
  description:
    "An introduction to CPI releases, central-bank decisions, Treasury yields and the dollar index, with exercises for separating observed data from uncertain market interpretations.",
  hero: macroHero,
  level: "Intermediate",
  badge: { name: "Macro Reading Completion", description: "Awarded after completing every lesson in the Macro Reading for Traders track." },
  outcomes: [
    "Read a CPI release and identify which component drove the surprise, rather than reacting to the headline number.",
    "Explain how FOMC decisions are announced and why published expectations and other information may influence different market reactions.",
    "Interpret the shape of the yield curve and describe what a flattening or inversion has historically signalled.",
    "Connect dollar strength to the behaviour of commodities, emerging markets and large exporters.",
    "Combine several macro signals into one written view instead of trading each release in isolation.",
  ],
  prerequisites:
    "No economics background is assumed. You should know what an interest rate is and be willing to read a data release rather than a summary of it. Each lesson links to the primary source — the statistical agency or the central bank itself — so you can check every figure yourself.",
  progression:
    "Start by reading CPI definitions and component changes. The Fed lesson then distinguishes policy announcements from expectations; inflation is one input among several. The yield-curve lesson compares maturities and model limitations. The dollar lesson considers currency translation and exposures without assuming a fixed price response. The final exercise compares several observations and alternative explanations.",
  notFor:
    "This is not a macroeconomic forecasting course and it will not tell you where rates or inflation are going. It does not cover trading around releases with leverage, which is a specialist activity with execution risks that reading cannot prepare you for. If you want a directional call on the economy, no honest course can give you one.",
  lessons: [
    {
      slug: "reading-cpi-and-inflation",
      title: "Reading CPI and Inflation Data",
      summary: "CPI measures selected consumer-price changes. Read the release, its definitions and components without assuming a predictable market response.",
      readingMinutes: 8,
      body: [
        "## What CPI actually measures",
        "The Consumer Price Index is a monthly Bureau of Labor Statistics survey of prices paid by urban consumers for a basket of goods and services. It has two headline flavours: headline CPI (includes food and energy) and core CPI (excludes them, because they're volatile). Core readings are used to study trends, while the FOMC states its longer-run 2% inflation goal in terms of the annual change in the PCE price index.",
        "## The release mechanics",
        "Check the current BLS release calendar for CPI timing; scheduled releases are generally at 8:30 AM Eastern. Market reactions depend on expectations and other information. No fixed first-minute percentage move or single class of participant is established by this lesson.",
        "## Consensus, surprise and market reaction",
        "A consensus figure is an aggregation of a particular survey’s forecasts, not the view of every economist. Record the provider, collection time and aggregation method before comparing it with the release. The difference is often called a surprise, but its sign alone cannot determine yields, exchange rates or share returns; expectations, revisions and other information can also matter.",
        "## The three-layer read",
        "For a study worksheet, compare the reported headline and core changes with a specifically identified expectation, then inspect the component contributions and measurement period. Headline and core answer different questions. The Fed’s stated longer-run target uses PCE inflation rather than either CPI measure, and policy considers more than one statistic.",
        DISC,
      ],
      keyTakeaways: [
        "Use the current BLS release calendar; releases are generally scheduled at 8:30 AM Eastern.",
        "Core CPI excludes food and energy; the FOMC’s longer-run inflation target uses PCE.",
        "A release-versus-survey difference is context, not a deterministic market signal.",
        "Read the underlying components.",
      ],
      sources: [
        { label: "BLS — CPI", url: "https://www.bls.gov/cpi/" },
        { label: "FRED — CPI-U", url: "https://fred.stlouisfed.org/series/CPIAUCSL" },
      ],
      quiz: [
        { question: "The Fed's 2% longer-run inflation goal is measured using:", options: ["Headline CPI", "Core CPI", "PCE price index", "PPI"], correctAnswer: 2, explanation: "The FOMC states its 2% longer-run inflation goal in terms of the annual change in the PCE price index." },
        { question: "CPI is released at:", options: ["8:00 AM ET", "8:30 AM ET", "10:00 AM ET", "2:00 PM ET"], correctAnswer: 1, explanation: "8:30 AM Eastern." },
        { question: "Why core over headline?", options: ["Core is higher", "Food/energy too volatile to signal trend", "Headline not reported", "Only economists care"], correctAnswer: 1, explanation: "Stripping volatile components isolates trend." },
        { question: "A CPI result above one survey’s median forecast establishes:", options: ["The next stock return", "A difference from that specified forecast", "A guaranteed rate increase", "Which participant moved the market"], correctAnswer: 1, explanation: "A forecast difference alone does not identify market participants or determine the next price move." },
      ],
    },
    {
      slug: "the-fed-and-fomc-cycle",
      title: "The Fed & FOMC Cycle — How Rates Get Set",
      summary: "The FOMC has eight regularly scheduled meetings a year, and its decisions can affect market expectations.",
      readingMinutes: 9,
      body: [
        "## The mandate",
        "The Federal Reserve conducts monetary policy under statutory goals that include maximum employment and stable prices. The FOMC states a 2% longer-run inflation goal measured by the annual change in the PCE price index and considers a wide range of economic information when making decisions.",
        "## The eight-meeting cycle",
        "The Federal Open Market Committee (FOMC) schedules eight regular meetings a year and can hold additional meetings when needed. A policy statement follows each regular meeting, and the Chair holds a press briefing after each meeting. Economic projections are discussed four times a year.",
        "## Market pricing of Fed decisions",
        "The CME FedWatch Tool converts federal-funds futures prices into implied probabilities for possible policy outcomes. Those probabilities describe market pricing, not certainty. Market reactions depend on the decision, accompanying statement, economic outlook and what participants had already expected.",
        "## Reading the statement vs the presser",
        "The policy statement records the Committee's decision and assessment. The post-meeting press conference can add context beyond the statement and projections, so market participants may react to both the written release and the Chair's answers.",
        "## Trading the Fed",
        "For an educational exercise, observe how prices react around the statement and press conference rather than assuming the first move is predictable. Short-term reactions can change as participants process new information.",
        DISC,
      ],
      keyTakeaways: [
        "The Fed pursues its statutory employment and price-stability goals; the FOMC states a 2% longer-run PCE inflation goal.",
        "FOMC schedules 8 regular meetings a year; economic projections are discussed four times a year.",
        "CME FedWatch shows futures-implied probabilities, not certain outcomes.",
        "The press conference can add information beyond the written statement.",
      ],
      sources: [
        { label: "Federal Reserve — FOMC", url: "https://www.federalreserve.gov/monetarypolicy/fomc.htm" },
        { label: "Federal Reserve — projections and participant policy assessments (September 2026)", url: "https://www.federalreserve.gov/monetarypolicy/fomcprojtabl20260916.htm" },
        { label: "CME — FedWatch", url: "https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html" },
      ],
      quiz: [
        { question: "How many FOMC meetings per year?", options: ["4", "6", "8", "12"], correctAnswer: 2, explanation: "Eight scheduled." },
        { question: "Fed's dual mandate:", options: ["Low rates + growth", "Max employment + price stability", "Full employment + stock gains", "Low inflation + strong dollar"], correctAnswer: 1, explanation: "Set by Congress." },
        { question: "The 'dot plot' shows:", options: ["Historical rates", "Each participant's assessment of appropriate policy", "Balance sheet", "Sentiment"], correctAnswer: 1, explanation: "The dots record individual participants’ assessments of an appropriate policy path, not only voting members and not a Committee promise." },
        { question: "FedWatch derives probabilities from:", options: ["Analyst surveys", "Fed funds futures pricing", "Twitter", "Reuters polls"], correctAnswer: 1, explanation: "Fed funds futures embed implied rate probabilities." },
      ],
    },
    {
      slug: "the-yield-curve-and-recession",
      title: "The Yield Curve and Recession-Risk Research",
      summary: "Yield-curve inversion has historically been associated with elevated US recession risk, but timing varies and the signal is not a standalone forecast.",
      readingMinutes: 8,
      body: [
        "## What the yield curve is",
        "The yield curve plots the yield on US Treasury securities across maturities — from 3 months out to 30 years. In normal times it's upward-sloping: you get paid more for lending longer. When short-term yields exceed long-term yields, the curve is inverted.",
        "## Why inversion signals recession",
        "An inverted curve can reflect expectations for slower growth, lower future policy rates, or changing term premia. Historically, commonly watched Treasury-curve inversions have often preceded US recessions, but the lead time varies and the relationship is not a deterministic forecast.",
        "## The 10Y-2Y vs 10Y-3M",
        "The linked New York Fed model uses the ten-year minus three-month Treasury yield spread to estimate a probability for a stated future horizon. The ten-year minus two-year spread is a different series. Model probabilities depend on the model and sample and are not certain outcomes; the two spreads need not invert on the same date.",
        "## Trading around the curve",
        "The curve is a slow-moving macro indicator. Treat it as one piece of economic context rather than as an intraday timing tool or an automatic instruction to change a portfolio.",
        DISC,
      ],
      keyTakeaways: [
        "The yield curve is normally upward-sloping.",
        "Inversions have historically been associated with elevated recession risk, with timing that varies across cycles.",
        "The linked NY Fed recession model uses the ten-year minus three-month Treasury yield spread.",
        "Use the curve as one macro indicator alongside other evidence.",
      ],
      sources: [
        { label: "NY Fed — Yield Curve Recession Probability", url: "https://www.newyorkfed.org/research/capital_markets/ycfaq" },
        { label: "FRED — T10Y2Y", url: "https://fred.stlouisfed.org/series/T10Y2Y" },
      ],
      quiz: [
        { question: "Inverted curve =", options: ["Short < long", "Short > long", "Flat", "Negative yields"], correctAnswer: 1, explanation: "Short-term exceeds long-term." },
        { question: "Which spread does the linked NY Fed recession model use?", options: ["10Y-2Y", "10Y-3M", "30Y-5Y", "2Y-Fed Funds"], correctAnswer: 1, explanation: "10Y-3M used in official model." },
        { question: "What is the safest interpretation of a yield-curve inversion?", options: ["It guarantees a recession", "It is one historical recession-risk indicator with uncertain timing", "It predicts the exact market bottom", "It only matters for day traders"], correctAnswer: 1, explanation: "Yield-curve inversion is informative context, but it is not a guaranteed or precisely timed forecast." },
        { question: "The yield curve by itself provides:", options: ["An exact entry time", "A dated description of yields across maturities", "Guaranteed equity returns", "One required asset allocation"], correctAnswer: 1, explanation: "A curve describes relative yields; any forecast requires additional assumptions and remains uncertain." },
      ],
    },
    {
      slug: "the-dollar-index-dxy",
      title: "The Dollar Index (DXY) — Reading Currency Context",
      summary: "DXY tracks the dollar against six currencies and offers context for studying currency exposure, with important limits.",
      readingMinutes: 7,
      body: [
        "## What the basket measures",
        "ICE's US Dollar Index measures the dollar against six currencies: euro (57.6%), Japanese yen (13.6%), British pound (11.9%), Canadian dollar (9.1%), Swedish krona (4.2%) and Swiss franc (3.6%). It is heavily weighted toward the euro and excludes many trading partners. A DXY rise therefore does not imply the same dollar appreciation against every currency.",
        "## Translation and company earnings",
        "Dollar appreciation against a company's revenue currencies can reduce the dollar value of unhedged foreign earnings. The overall effect also depends on costs, hedges, pricing and the currencies involved. Federal Reserve research describes translation and export-competitiveness channels; it does not establish a universal conversion from a DXY percentage move to S&P 500 earnings per share.",
        "## A currency worksheet",
        "Suppose a fictional company earns EUR 1 million and has no hedge. At $1.10 per euro, translation gives $1.10 million; at $1.00 per euro, it gives $1.00 million. That $100,000 difference is an illustration for one currency and one unchanged earnings amount. It is not an EPS forecast, and a move in DXY alone does not supply those exchange rates.",
        "## Commodities and other influences",
        "For a dollar-priced commodity with an unchanged dollar price, a weaker local currency raises the local-currency purchase cost. In actual markets, commodity prices also change with supply, demand, inventories and interest rates. An inverse relationship with the dollar can appear in a selected sample, but it is not a fixed rule for gold or any other commodity.",
        "## Dollar borrowing in emerging markets",
        "A borrower with dollar debt and local-currency income can face a larger local-currency debt-service burden when that currency weakens against the dollar. Dollar revenues or hedges can offset some exposure. BIS research studies broader links between dollar strength and financial conditions; effects vary across economies and periods, so DXY is not an automatic equity signal.",
        "## Compare indicators rather than choose one",
        "Read DXY alongside relevant bilateral exchange rates, a broader trade-weighted dollar index, interest rates and the asset's own context. For a study exercise, compare the same dated observations over a chosen interval and report where relationships change. A correlation does not show that the dollar caused another asset's move or predict the next trade.",
        DISC,
      ],
      keyTakeaways: [
        "DXY's euro weight is 57.6%; the basket does not represent every currency.",
        "Earnings effects depend on actual currency exposure, costs and hedging.",
        "Dollar and commodity relationships vary over time.",
        "Dollar debt exposure depends on the borrower's income currency and hedges.",
      ],
      sources: [
        { label: "ICE — US Dollar Index Composition", url: "https://www.ice.com/insights/indexation-and-etfs/managing-us-dollar-risk-in-uncertain-times" },
        { label: "Federal Reserve — Dollar Appreciation and Corporate Profits (2015)", url: "https://www.federalreserve.gov/econresdata/notes/ifdp-notes/2015/how-much-has-dollar-appreciation-affected-us-corporate-profits-20150717.html" },
        { label: "BIS — Exchange Rates and Financial Conditions in EMEs (2023)", url: "https://www.bis.org/publications/bulletin-79-lessons-recent-experiences-exchange-rates-capital-flows-and-financial-conditions-emes" },
        { label: "FRED — Broad Trade-Weighted US Dollar Index", url: "https://fred.stlouisfed.org/series/DTWEXBGS" },
      ],
      quiz: [
        { question: "Largest DXY weight:", options: ["Yen", "Pound", "Euro (~57.6%)", "Yuan"], correctAnswer: 2, explanation: "The euro has a 57.6% weight in ICE's six-currency basket." },
        { question: "Dollar appreciation can reduce translated earnings when a company has:", options: ["No foreign exposure", "Unhedged foreign-currency earnings", "Only dollar revenue and costs", "No earnings"], correctAnswer: 1, explanation: "Unchanged foreign-currency earnings translate into fewer dollars if the dollar strengthens against that currency. This is not a universal EPS forecast." },
        { question: "A gold-DXY correlation measured over one period:", options: ["Guarantees the next price move", "Proves dollar moves cause gold moves", "May differ in another period", "Is always positive"], correctAnswer: 2, explanation: "Correlation depends on the selected sample and does not establish causation or a fixed trading rule." },
        { question: "Which borrower is directly exposed to a larger local-currency burden when its currency weakens against the dollar?", options: ["One with matching dollar income and debt", "One with unhedged dollar debt and local-currency income", "One with no debt", "Every borrower equally"], correctAnswer: 1, explanation: "Currency mismatch can increase the local-currency cost of dollar debt service; hedges or dollar revenues can change that exposure." },
      ],
    },
    {
      slug: "putting-macro-signals-together",
      title: "Putting It Together — A Macro Dashboard for Traders",
      summary: "Compare growth, inflation and financial indicators in a documented worksheet, without treating a regime label as a trading instruction.",
      readingMinutes: 8,
      sourceCheck: { date: "2026-10-18", scope: "FRED, BEA GDP and BLS CPI source definitions; no investment-performance validation or professional review." },
      body: [
        "## The four-quadrant regime framework",
        "A four-quadrant worksheet can classify selected observations by whether growth and inflation are rising or falling. Define the measures first: real GDP growth, a survey measure and a monthly release are not interchangeable, and inflation levels differ from changes in the inflation rate. A quadrant is a descriptive simplification, not an asset-allocation rule. Interest rates, starting valuations, supply shocks and expectations can produce different asset returns within the same label.",
        "## Building a personal dashboard",
        "FRED provides economic time series and links to their sources and releases. Start a practice dashboard by selecting a few series relevant to a specific question, then record each series' units, frequency, observation date and release date. Check revisions and definitions before comparing values. A dashboard is an aid to study; no measured percentage of useful information or advantage over other traders is established here.",
        "## The weekly ritual",
        "For a hypothetical study, choose a review date and record selected yields, exchange rates and price indices. Keep observation dates separate from release dates: GDP is not measured weekly, and later revisions can change the growth story. Record what was actually available at the time. Comparing a later revised series with an earlier trading decision can introduce look-ahead bias.",
        "## Don't over-trade macro",
        "A macro label cannot determine an appropriate position size or entry time. Scheduled releases can affect prices quickly even when the underlying economic series changes slowly. Compare alternative explanations and unfavorable cases; a dashboard neither proves causation nor guarantees investment outcomes.",
        DISC,
      ],
      keyTakeaways: [
        "Growth and inflation can form a four-quadrant descriptive worksheet if the measures are defined.",
        "Record the source, units and dates of each economic series; check revisions before comparisons.",
        "A dated log separates observations from releases and later revisions.",
        "A regime label is not a position-sizing, allocation or timing instruction.",
      ],
      sources: [
        { label: "FRED", url: "https://fred.stlouisfed.org/" },
        { label: "BEA — GDP", url: "https://www.bea.gov/data/gdp/gross-domestic-product" },
        { label: "BLS — Consumer Price Index", url: "https://www.bls.gov/cpi/" },
      ],
      quiz: [
        { question: "The descriptive worksheet in this lesson classifies:", options: ["Guaranteed returns", "Selected growth and inflation directions", "Correct trade sizes", "Future prices"], correctAnswer: 1, explanation: "The selected measures define a description, not a forecast." },
        { question: "Which combination best describes stagflation?", options: ["Strong growth + high inflation", "Strong growth + low inflation", "Weak or stagnant growth + high inflation", "Weak or stagnant growth + low inflation"], correctAnswer: 2, explanation: "Stagflation combines weak or stagnant economic activity with high inflation. Inflation need not accelerate every month; its level differs from a change in the inflation rate." },
        { question: "Why record release dates as well as observation dates?", options: ["To guarantee a profit", "To know what information was available at the decision time", "To remove market risk", "To predict every revision"], correctAnswer: 1, explanation: "Later releases and revisions must not be treated as knowledge available earlier." },
        { question: "Which resource is the St. Louis Fed’s economic-data database?", options: ["Bloomberg", "Reuters Eikon", "FRED", "Cap IQ"], correctAnswer: 2, explanation: "St Louis Fed's free database." },
      ],
    },
  ],
};

const psychologyTrack: CourseTrack = {
  slug: "trading-psychology-mastery",
  title: "Trading Decisions and Behaviour",
  tagline: "Understand decision biases, review assumptions and practise reflective exercises.",
  description:
    "This educational track examines research on decision biases alongside fictional trading examples. It introduces optional records and checklists that can support reflection, without claiming professional consensus or a link to profitable performance.",
  hero: psychologyHero,
  level: "Beginner",
  badge: { name: "Trading Psychology Completion", description: "Awarded after completing every lesson in the Trading Psychology Mastery track." },
  outcomes: [
    "Name the specific biases most likely to affect your own decisions, with an example from your own trade log.",
    "Recognise when a fictional trading scenario invites an impulsive decision and consider alternatives including not trading.",
    "Keep a record of assumptions before evaluating a hypothetical outcome; compare facts with interpretations.",
    "Create an optional preparation and review checklist with no fixed time requirement.",
    "Distinguish between a losing trade that followed the plan and a winning trade that broke it.",
  ],
  prerequisites:
    "No previous trading is required. All exercises can be completed with made-up data and virtual observations, without real transactions.",
  progression:
    "The sequence explores possible decision biases, reactions to an outcome, a journal as an observation record, optional checklists and portfolio-drawdown arithmetic. It does not constitute psychological assessment or a tested method for earning returns.",
  notFor:
    "This track does not address clinical mental health, gambling addiction or financial distress, and it is not a substitute for professional support. If trading is causing you real financial or psychological harm, please speak to a qualified professional rather than reading another lesson on discipline.",
  lessons: [
    {
      slug: "cognitive-biases-in-trading",
      title: "Cognitive Biases in Trading Decisions",
      summary: "Confirmation bias, anchoring and loss aversion offer ways to examine decisions without assuming a universal emotional response.",
      readingMinutes: 9,
      body: [
        "## Research and individual decisions",
        "Behavioural research studies patterns in how people evaluate uncertain outcomes. Those patterns can help frame journal questions, but they do not diagnose an individual or guarantee better financial results. No level of intelligence or discipline removes market uncertainty.",
        "## Confirmation bias",
        "Confirmation bias describes giving more attention or weight to evidence that supports an existing belief. In a practice journal, record the original rationale and at least one observation that would challenge it. Compare how you treated supporting and conflicting information without assuming the exercise removes the bias.",
        "## Anchoring",
        "An initial number can influence a later judgement even when it provides little information about current value. A purchase price may become such an anchor. For a worksheet, compare the reasons for keeping a hypothetical position with the reasons for choosing it today; also record costs and constraints. That comparison is a reflection prompt, not an automatic instruction to sell.",
        "## Loss aversion and the two-times shorthand",
        "Loss aversion describes losses receiving greater weight than comparable gains relative to a reference point. Tversky and Kahneman's 1992 model estimated a loss-aversion parameter from experimental choices. The familiar 'about twice' shorthand is not a universal measurement of emotional pain. Later studies estimate different magnitudes across people, tasks and methods, and a model parameter should not be treated as an individual trading rule.",
        "## A journal exercise",
        "Write down your expected reaction to a hypothetical $100 gain and $100 loss, then describe how the reaction might change with the starting balance or reference point. This exercise observes your reasoning; it does not measure a validated loss-aversion coefficient. A written plan can make decisions easier to review, but it cannot guarantee an exit price or prevent loss. TradeHQ does not execute automatic stop orders.",
        "## Recency bias and sample limits",
        "Recency bias can mean giving disproportionate weight to recent observations. A short winning or losing run does not establish a reliable strategy. Compare recent and longer journal periods while noting that market conditions may have changed. No fixed trade count or rolling win-rate window eliminates bias or proves an edge.",
        DISC,
      ],
      keyTakeaways: [
        "Record supporting and conflicting evidence when reviewing a practice decision.",
        "A purchase-price anchor is a reflection prompt, not an automatic exit rule.",
        "Loss aversion varies; the two-times shorthand is not a universal emotional ratio.",
        "Journal samples and written plans cannot guarantee returns or execution.",
      ],
      sources: [
        { label: "Tversky & Kahneman — Cumulative Prospect Theory (1992)", url: "https://doi.org/10.1007/BF00122574" },
        { label: "Walasek, Mullett & Stewart — A Meta-analysis of Loss Aversion in Risky Contexts (2024)", url: "https://wrap.warwick.ac.uk/id/eprint/185745/13/1-s2.0-S0167487024000485-main.pdf" },
      ],
      quiz: [
        { question: "Loss aversion describes:", options: ["Identical reactions from everyone", "Giving losses more weight than comparable gains relative to a reference point", "Preferring losses to gains", "Avoiding all trades"], correctAnswer: 1, explanation: "The concept concerns asymmetric evaluation around a reference point. Its magnitude varies and is not a universal two-times emotional ratio." },
        { question: "Which example illustrates a possible purchase-price anchor?", options: ["Treating the entry price as the only reason to keep a position", "Recording transaction costs", "Comparing company revenues", "Reading conflicting evidence"], correctAnswer: 0, explanation: "An entry price can anchor judgement without establishing current value or dictating whether a position should be kept." },
        { question: "Which journal exercise examines confirmation bias?", options: ["Record only supporting headlines", "Record both supporting and conflicting evidence", "Assume a profitable result proves the reasoning", "Ignore uncertainty"], correctAnswer: 1, explanation: "Comparing how both kinds of evidence were treated can help examine reasoning; it does not guarantee the bias disappears." },
        { question: "Recency bias can lead someone to:", options: ["Give all observations equal weight", "Over-weight the last few outcomes", "Ignore all recent evidence", "Know the next market move"], correctAnswer: 1, explanation: "Recent outcomes can receive disproportionate weight, while neither a short nor a fixed-size sample proves an edge." },
      ],
    },
    {
      slug: "revenge-trading-and-tilt",
      title: "Revenge Trading & Tilt — Recognising Unplanned Decisions",
      summary: "Tilt is the emotional state where a trader tries to recover a loss immediately with larger, unplanned trades.",
      readingMinutes: 8,
      body: [
        "## What tilt actually is",
        "Tilt describes an emotional reaction to recent outcomes that can pull decisions away from a plan. After a loss, a trader may feel pressure to recover it immediately. That is a prompt for reflection, not evidence that the next trade will win or lose. This lesson uses hypothetical situations and does not rank the causes of account losses.",
        "## Notice the urge to change the plan",
        "A useful practice question is whether the next decision follows the original plan or is mainly a response to the last result. Write down any urge to increase size, re-enter immediately or abandon the original rationale. These observations are personal journal notes, not a diagnosis or a reliable prediction of performance.",
        "## The revenge trade pattern",
        "A hypothetical sequence is loss, frustration, an unplanned increase in position size and another loss. The eventual drawdown depends on the positions and price changes; no particular percentage follows automatically from that sequence. In a practice journal, compare the intended position size with the size actually submitted.",
        "## Concrete circuit breakers",
        "A practice plan can include a chosen daily loss threshold and a pause to review decisions. For arithmetic only, 3% of a hypothetical $100,000 starting balance is $3,000; this is not an industry standard. TradeHQ does not enforce a 3% daily-loss lockout. Its desktop and mobile order panels can show a five-second pause when a proposed trade exceeds 10% of the account balance used by the panel within five minutes of a locally recorded loss. After the pause, the user can proceed or cancel. This is a limited prompt, not a guarantee against further losses.",
        "## Recovering from a bad day",
        "For a practice exercise, pause after an unplanned decision and record what changed, why it changed and what you would review before another trade. A plan may specify a break, but no fixed 24-hour interval guarantees emotional recovery or prevents future losses.",
        DISC,
      ],
      keyTakeaways: [
        "Use journal notes to distinguish a planned decision from a reaction to a recent outcome.",
        "An unplanned increase in size changes exposure; this lesson does not rank causes of trading losses.",
        "Any percentage threshold needs explicit assumptions; it cannot guarantee a maximum realised loss.",
        "TradeHQ’s cooldown permits proceeding after five seconds; it is not a daily-loss lockout.",
      ],
      sources: [
        { label: "TradeHQ — Revenge Trading Blocker", url: "/portfolio" },
        { label: "Kahneman and Tversky — decision-making under uncertainty", url: "https://doi.org/10.1007/BF00122574" },
      ],
      quiz: [
        { question: "Tilt is:", options: ["A strategy", "Emotional state driving reckless trades", "A chart pattern", "A fee"], correctAnswer: 1, explanation: "Post-loss unplanned oversized trading." },
        { question: "In the hypothetical worksheet, 3% of $100,000 is:", options: ["$100", "$3,000", "$25,000", "$30,000"], correctAnswer: 1, explanation: "100,000 × 0.03 = $3,000. This is arithmetic, not an industry-standard limit." },
        { question: "What does TradeHQ’s cooldown allow after five seconds?", options: ["Guaranteed recovery", "Proceeding with or cancelling the trade", "Automatic account reset", "A mandatory 24-hour lockout"], correctAnswer: 1, explanation: "The prompt allows a choice after the pause; it does not enforce a daily drawdown limit." },
        { question: "Which journal entry helps review a changed decision?", options: ["Only the final price", "The intended size, actual size and reason for changing it", "A guaranteed profit target", "Another trader’s ranking"], correctAnswer: 1, explanation: "Recording the original plan and the change makes the decision reviewable." },
      ],
    },
    {
        slug: "the-trading-journal",
        title: "A Trading Journal: Observations and Limits",
        summary: "Use a decision record to review assumptions without claiming it proves profitable skill.",
        "readingMinutes": 8,
        "sourceCheck": {
          "date": "2026-10-18",
          "scope": "Editorial check of simulator limitations and referenced U.S. regulator materials; not an expert certification."
        },
        "body": [
          "## What a trading journal can document",
          "A journal is a dated record of choices and the information available when they were made. It may help a learner explain why a simulated transaction was entered and how that reasoning changed. A record by itself does not establish a statistical edge, explain the causes of profits or predict future returns.",
          "## Separate a fill record from an interpretation",
          "TradeHQ stores virtual transactions in portfolio history. The user can separately record a hypothesis, alternate explanation, observation time and what would disconfirm the hypothesis. A price marker on a practice chart is not an independent confirmation that a real exchange would execute at that price.",
          "## Example: reconcile a practice purchase",
          "Suppose a hypothetical order buys 2 units at $100 each. At a stated 0.1% virtual buy fee, recorded cash decreases by $200.20; the holding has a $200 gross marked value at that price. A later displayed price of $105 would value the 2 units at $210 and show a $10 gross price change. A later hypothetical sale would have additional fees. The exercise is about distinguishing gross and net arithmetic, not a claim about an asset.",
          "## Fields worth recording",
          "Possible fields include date and timezone, ticker and instrument type, quantity, observed source and quote age, virtual order price, transaction fee, original question, alternative explanation, and planned review criterion. More columns are not automatically better; use only what serves the learning question.",
          "## Review observations, not imagined causes",
          "Grouping past results may reveal a calculation error or a difference between chosen samples. It does not establish that the labels in a journal caused those outcomes. Record unfavorable cases and changes in rules, and avoid interpreting a convenient short sample as proof of a repeatable method.",
          "## Sample-size limits",
          "No fixed number such as 30 or 100 decisions proves reliability. Market conditions and dependence between observations matter, as do selection bias, virtual fill assumptions and transaction costs. A journal supports transparent accounting; it does not license larger real-money positions.",
          DISC
        ],
        "keyTakeaways": [
          "A journal is a record, not proof of an investment edge.",
          "Distinguish virtual transactions, observed price marks, interpretation and hypothetical future fills.",
          "Use dated assumptions and include unfavorable observations when reviewing a sample.",
          "No universal trade count validates future performance."
        ],
        "sources": [
          {
            "label": "SEC Investor.gov — transaction record-keeping",
            "url": "https://www.investor.gov/introduction-investing/investing-basics/glossary/broker-dealers-record-keeping-requirements"
          },
          {
            "label": "FINRA — account statements and trade confirmations",
            "url": "https://www.finra.org/sites/default/files/2020-12/understanding-brokerage-account-statements-and-trade-confirmations.pdf"
          }
        ],
        "quiz": [
          {
            "question": "What does a journal prove on its own?",
            "options": [
              "A profitable edge",
              "Why the market moved",
              "What observations and assumptions were recorded",
              "A future win rate"
            ],
            "correctAnswer": 2,
            "explanation": "The journal documents information; it does not prove causation or future returns."
          },
          {
            "question": "In a hypothetical 2-unit order at $100 with a 0.1% buy fee, what cash is spent?",
            "options": [
              "$200",
              "$200.20",
              "$210",
              "$0.20"
            ],
            "correctAnswer": 1,
            "explanation": "The $200 notional plus 0.1%, or $0.20, is $200.20."
          },
          {
            "question": "Which sample should a review include?",
            "options": [
              "Only gains",
              "Only days with stable prices",
              "Only large positions",
              "Favorable and unfavorable cases under recorded rules"
            ],
            "correctAnswer": 3,
            "explanation": "Selecting only attractive cases makes the summary misleading."
          },
          {
            "question": "Does 30 recorded trades establish a reliable strategy?",
            "options": [
              "No universal sample count can do that",
              "Yes, always",
              "Only with a journal",
              "Only if there were no losing trades"
            ],
            "correctAnswer": 0,
            "explanation": "Sample design, costs, dependence and uncertainty matter."
          }
        ]
      },
    {
        slug: "discipline-and-daily-rituals",
        title: "Optional Checklists for Practice Sessions",
        summary: "Prepare and review educational exercises without prescribing a professional routine or profitable outcome.",
        "readingMinutes": 8,
        "sourceCheck": {
          "date": "2026-10-18",
          "scope": "Reviewed claimed routine durations and simulator limitations; no duration treated as an empirically validated standard."
        },
        "body": [
          "## A checklist is an organisational tool",
          "A checklist may help a learner remember what an exercise is meant to test. It is not a proven method for increasing financial returns and there is no universal pre-market, hourly or end-of-day schedule suitable for everyone.",
          "## Before a virtual exercise",
          "Write a narrow objective: for example, calculate a trade fee from an assumed price and quantity, or distinguish a spot quote from a futures-contract example. Record whether the numbers come from dated market observations or are invented for teaching. It is fine to spend a session learning without placing an order.",
          "## During the exercise",
          "If the original question changes, note the change rather than silently replacing earlier assumptions. A learner can pause or end an exercise at any point. TradeHQ places manual market orders in supported spot instruments; writing a stop or a take-profit on a checklist does not create one.",
          "## After the exercise",
          "Compare original assumptions with the observed virtual result. For example, 10 units at a hypothetical $50 price have $500 notional; a 0.1% virtual transaction fee would be $0.50. Ask whether transaction costs were included and whether a later price is comparable by timestamp and source.",
          "## Design your own review cadence",
          "Some learners may prefer a short end-of-session note; others may periodically review multiple examples. Neither 30-minute preparation nor a 60-second hourly check nor a 20-minute closing ritual is a professional standard established by this course. The quantity of time spent does not prove better decision quality.",
          "## Distinguish participation from outcomes",
          "Completing a quiz or maintaining an educational streak reflects participation under feature rules. It does not validate a trading system, require frequent trading or establish higher expected returns.",
          DISC
        ],
        "keyTakeaways": [
          "Use a checklist only when it assists a defined educational question.",
          "Any duration, time of day or review frequency is optional.",
          "Record how prices, assumptions and fees were obtained.",
          "Completing a routine does not imply profitability or the need to trade."
        ],
        "sources": [
          {
            "label": "SEC Investor.gov — risk",
            "url": "https://www.investor.gov/introduction-investing/investing-basics/glossary/risk"
          },
          {
            "label": "TradeHQ — virtual practice desk",
            "url": "/trade"
          }
        ],
        "quiz": [
          {
            "question": "What duration must a pre-session checklist have?",
            "options": [
              "Exactly 30 minutes",
              "An hour",
              "No universal duration",
              "Exactly five minutes"
            ],
            "correctAnswer": 2,
            "explanation": "Checklists are optional learning tools, not a timed professional standard."
          },
          {
            "question": "Does a written stop price create a resting order in TradeHQ?",
            "options": [
              "No, virtual orders are manual market orders",
              "Yes, always",
              "Only after 20 minutes",
              "Only with an options contract"
            ],
            "correctAnswer": 0,
            "explanation": "A worksheet assumption is not an executable resting order."
          },
          {
            "question": "Why record source and observation time?",
            "options": [
              "It guarantees a fill",
              "It can clarify which information was available",
              "It proves market direction",
              "It increases expected profit"
            ],
            "correctAnswer": 1,
            "explanation": "A source timestamp helps interpret an observed price without promising any outcome."
          },
          {
            "question": "What does a learning streak measure?",
            "options": [
              "Trading expertise",
              "Future profit",
              "Low drawdown",
              "Participation under the feature's rules"
            ],
            "correctAnswer": 3,
            "explanation": "Participation is not an investment-performance measure."
          }
        ]
      },
    {
        slug: "handling-drawdowns",
        title: "Understanding Drawdowns in a Simulation",
        summary: "Calculate declines from a previous portfolio peak and compare hypothetical sizing and recovery assumptions.",
        "readingMinutes": 8,
        "sourceCheck": {
          "date": "2026-10-18",
          "scope": "Checked arithmetic and removed unsupported physical-health and professional-behaviour claims."
        },
        "body": [
          "## What drawdown actually measures",
          "A drawdown compares a portfolio's value with an earlier peak, using the same measurement basis. If an illustrative virtual portfolio peaks at $100,000 and later marks at $90,000, the peak-to-trough drawdown is ($100,000 - $90,000) / $100,000 = 10%. This number describes a past decline, not the probability of a future loss.",
          "## A different denominator for recovery",
          "Moving from $90,000 back to $100,000 requires $10,000 / $90,000, or approximately 11.11% growth, not 10%. A 20% decline from $100,000 to $80,000 requires a 25% gain to return to the same previous peak. This asymmetry is simple arithmetic; it does not prescribe a trading strategy.",
          "## The effect of sizing assumptions",
          "The same assumed asset movement can produce different portfolio-level changes depending on allocation. In a fee-free illustration, a 20% drop in an asset that is 10% of a $100,000 portfolio contributes approximately a 2% portfolio decline if everything else stays constant. Concentration, other holdings, fees and timing can change the observed result.",
          "## Sequence and measurement matter",
          "Drawdown depends on the path of account values, not only the first and final price. Specify whether account values include fees, deposits or withdrawals, and whether valuations are current or delayed. A sequence built from generated practice candles is not an observed market drawdown.",
          "## Testing changes to a fictional rule",
          "A learner may compare two explicitly hypothetical size schedules after a recorded decline. Define each rule before looking at its result; document any change so a revised rule is not mixed with the original sample. No fixed 10%, 20% or other threshold is universally suitable.",
          "## Scope of this lesson",
          "A portfolio decline cannot be used to diagnose stress, sleep, hormones or mental-health conditions. This lesson teaches virtual portfolio arithmetic and uncertainty, not healthcare guidance or advice about recovering real financial losses.",
          DISC
        ],
        "keyTakeaways": [
          "Drawdown is measured from a previous peak, with a clear valuation basis.",
          "Recovering from a decline requires calculating the gain on the reduced base.",
          "Allocation, costs and price sequence affect portfolio-level outcomes.",
          "No particular drawdown threshold or response is universally validated."
        ],
        "sources": [
          {
            "label": "SEC Investor.gov — risk",
            "url": "https://www.investor.gov/introduction-investing/investing-basics/glossary/risk"
          },
          {
            "label": "SEC Investor.gov — past-performance limitations",
            "url": "https://www.investor.gov/introduction-investing/investing-basics/glossary/mutual-funds-past-performance"
          }
        ],
        "quiz": [
          {
            "question": "A virtual portfolio falls from $100,000 to $90,000. Its peak-to-trough drawdown is:",
            "options": [
              "5%",
              "10%",
              "11.11%",
              "90%"
            ],
            "correctAnswer": 1,
            "explanation": "$10,000 divided by the $100,000 peak is 10%."
          },
          {
            "question": "How much growth returns $90,000 to $100,000?",
            "options": [
              "10%",
              "1%",
              "20%",
              "About 11.11%"
            ],
            "correctAnswer": 3,
            "explanation": "The $10,000 recovery is divided by the lower $90,000 balance."
          },
          {
            "question": "What determines portfolio impact from an asset loss?",
            "options": [
              "Allocation and the asset's movement, among other factors",
              "Only the ticker",
              "Only the price per unit",
              "The lesson completion badge"
            ],
            "correctAnswer": 0,
            "explanation": "Position weight affects the portfolio-level change."
          },
          {
            "question": "Can a drawdown percentage diagnose a health condition?",
            "options": [
              "Yes",
              "Only after 30 trades",
              "No",
              "Only for experienced traders"
            ],
            "correctAnswer": 2,
            "explanation": "A finance calculation is not a medical assessment."
          }
        ]
      },
  ],
};

export const courseTracks: CourseTrack[] = [optionsTrack, futuresTrack, macroTrack, psychologyTrack];

export function getTrack(slug: string): CourseTrack | undefined {
  return courseTracks.find((t) => t.slug === slug);
}

export function getLesson(
  trackSlug: string,
  lessonSlug: string,
): { track: CourseTrack; lesson: CourseLesson; index: number } | undefined {
  const track = getTrack(trackSlug);
  if (!track) return undefined;
  const index = track.lessons.findIndex((l) => l.slug === lessonSlug);
  if (index < 0) return undefined;
  return { track, lesson: track.lessons[index], index };
}
