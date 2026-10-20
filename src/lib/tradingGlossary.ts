export interface GlossaryTerm {
  slug: string;
  term: string;
  definition: string;
  expertDefinition: string;
  proTip: string;
  difficulty: "Novice" | "Intermediate" | "Pro";
  readTime: string;
  category: string;
  keyPoints: [string, string, string];
  studentPerspective: string;
  relatedTerms: string[];
  sources?: { href: string; label: string }[];
}

export const tradingGlossary: GlossaryTerm[] = [
  {
    slug: "short-squeeze",
    term: "Short Squeeze",
    definition: "A short squeeze occurs when a rising price or difficulty borrowing a security puts pressure on short sellers to close positions by buying shares. That covering demand can add further upward pressure to the price.",
    expertDefinition: "A short seller borrows a security, sells it, and later needs to buy equivalent securities to close the position and return what was borrowed. If the price rises instead of falling, the short position loses value. A short squeeze can develop when price increases or borrowing constraints cause multiple short sellers to cover at the same time; those purchases add demand and can intensify the upward move. Short interest is one useful measure of outstanding short positions, while days to cover compares reported short interest with average daily share volume. FINRA publishes these measures as market data, but they do not create a universal squeeze threshold or a reliable timing signal. Reported short interest is also a periodic snapshot rather than a real-time count. Borrowing availability, trading volume, price movement, liquidity and the behaviour of market participants can all affect whether heavy short positioning ever becomes a squeeze.",
    proTip: "Treat short interest and days-to-cover figures as context, not a trigger. Compare current reported data with earlier periods and check how the price and trading volume are behaving; no single percentage or ratio guarantees that a squeeze will occur.",
    difficulty: "Intermediate",
    readTime: "4 min",
    category: "Market Mechanics",
    keyPoints: [
      "A squeeze can occur when rising prices or borrowing pressure cause short sellers to cover",
      "Covering purchases can add further upward pressure to the price",
      "Short interest and days to cover provide context but do not define a universal squeeze threshold"
    ],
    studentPerspective: "Treat short interest and days-to-cover figures as context, not a trigger. Compare current reported data with earlier periods and check how the price and trading volume are behaving; no single percentage or ratio guarantees that a squeeze will occur.",
    relatedTerms: ["bull-trap", "whale-manipulation", "leverage-trading"]
  },
  {
    slug: "golden-cross",
    term: "Golden Cross",
    definition: "A golden cross is a bullish technical signal that occurs when a short-term moving average (typically the 50-day) crosses above a long-term moving average (typically the 200-day).",
    expertDefinition: "A golden cross labels a shorter moving average crossing above a longer one; 50-day and 200-day simple averages are a common convention. Each average summarizes selected past closing prices. The crossover can arrive after a substantial price rise, and a subsequent reversal can produce another crossover. Changing the interval, lookback or price adjustment changes the observations. The label does not reveal institutional orders or establish a profitable entry. For a comparison, state the dataset and rules before reviewing later prices, include failed examples and account for costs. A generated practice chart cannot establish how a rule performed in real historical markets.",
    proTip: "Compare the 50-day and 200-day averages with the underlying price series. The crossover describes past price behaviour; it does not determine a profitable entry or predict an uptrend.",
    difficulty: "Novice",
    readTime: "3 min",
    category: "Technical Analysis",
    keyPoints: [
      "50-day MA crossing above the 200-day MA is the classic setup",
      "Calculated from past prices; a crossover can lag or reverse",
      "Does not establish future buying activity or a profitable entry"
    ],
    studentPerspective: "The golden cross is one of the first indicators beginners learn. It compares historical averages; the crossover does not establish what price will do next.",
    relatedTerms: ["death-cross", "macd", "support-and-resistance"]
  },
  {
    slug: "death-cross",
    term: "Death Cross",
    definition: "A death cross is the bearish counterpart to the golden cross. It occurs when the 50-day moving average crosses below the 200-day moving average, signaling deteriorating momentum.",
    expertDefinition: "A death cross labels a shorter moving average crossing below a longer one, commonly a 50-day average below a 200-day average. It describes the relationship between selected historical averages. It need not identify the beginning of a decline, and a later recovery can reverse the crossover. The slope of either average is another historical observation, not a universal measure of signal strength. Do not infer how professional managers position portfolios from this label. To evaluate an imagined rule, specify the series, frequency, execution assumptions and comparison period before inspecting outcomes. Include costs and both continuation and recovery cases.",
    proTip: "Check which averages and dates were used to identify the cross. A downward crossover can also occur during a temporary decline; it does not justify a universal percentage reduction in holdings.",
    difficulty: "Novice",
    readTime: "3 min",
    category: "Technical Analysis",
    keyPoints: [
      "50-day MA crossing below the 200-day MA triggers the signal",
      "A description of selected historical prices, not a validated prediction of a downturn",
      "Compare price and volume observations without assuming confirmation predicts returns"
    ],
    studentPerspective: "Mark when the selected averages cross, then compare later continuations and reversals. Recognising a historical crossover does not guarantee protection from a future decline.",
    relatedTerms: ["golden-cross", "rsi-divergence", "stop-loss-hunting"]
  },
  {
    slug: "liquidation-cascade",
    term: "Liquidation Cascade",
    definition: "A liquidation cascade is feedback in which forced position reductions add price pressure that can trigger further reductions. Venue rules, collateral and liquidity affect the outcome.",
    expertDefinition: "In a leveraged market, falling collateral value or adverse price changes can cause positions to breach maintenance requirements. Forced reductions may add buying or selling pressure. If that pressure worsens prices for other leveraged positions, additional liquidations can follow. Such feedback can occur in either direction and does not require a universal leverage ratio or loss threshold. Actual liquidation terms depend on the instrument, collateral, mark-price method, maintenance tiers and venue procedures. A price wick alone does not measure the amount liquidated or identify its cause. TradeHQ does not provide leveraged positions or a liquidation engine; examples remain separate arithmetic exercises.",
    proTip: "Compare the venue's margin and liquidation rules with a hypothetical price shock. Liquidation heatmaps are estimates and cannot prove where positions will close or where price will go.",
    difficulty: "Pro",
    readTime: "5 min",
    category: "Market Mechanics",
    keyPoints: [
      "Feedback depends on leverage, collateral rules and available liquidity",
      "Forced reductions can amplify an adverse move; totals require event-specific evidence",
      "Often creates wicking patterns on candlestick charts"
    ],
    studentPerspective: "Compare a hypothetical price shock with documented margin rules. A cascade label does not establish exact liquidation levels. TradeHQ does not implement leveraged positions or margin calls.",
    relatedTerms: ["leverage-trading", "stop-loss-hunting", "whale-manipulation"]
  },
  {
    slug: "fibonacci-retracement",
    term: "Fibonacci Retracement",
    definition: "Fibonacci retracement is a technical analysis tool using horizontal lines at key ratios (23.6%, 38.2%, 50%, 61.8%, 78.6%) to indicate potential support and resistance levels.",
    expertDefinition: "A retracement drawing selects a price high and low, then marks fractions of their difference. Common chart conventions include 23.6%, 38.2%, 50%, 61.8% and 78.6%; 50% is a midpoint convention rather than a Fibonacci-sequence ratio. The chosen endpoints and interval materially change the levels. Arithmetic does not establish that buyers or sellers will appear at a marked price. Several drawings can fit the same history, so specify the endpoints before reviewing later candles and keep cases where price passes through the levels. The background reference explains historical chart analysis, not a measured success rate for these ratios.",
    proTip: "Calculate the levels from a clearly identified high and low, then compare how changing those anchors changes the chart. A Fibonacci ratio alone does not establish a reversal probability.",
    difficulty: "Intermediate",
    readTime: "5 min",
    category: "Technical Analysis",
    keyPoints: [
      "Key levels: 23.6%, 38.2%, 50%, 61.8%, and 78.6%",
      "61.8% is a selected reference ratio, not a probability of a reversal",
      "Combining chart tools does not establish a success probability"
    ],
    studentPerspective: "Calculate the levels from a clearly identified high and low, then compare how changing those anchors changes the chart. A Fibonacci ratio alone does not establish a reversal probability.",
    relatedTerms: ["support-and-resistance", "golden-cross", "order-block"]
  },
  {
    slug: "rsi-divergence",
    term: "RSI Divergence",
    definition: "RSI divergence occurs when the Relative Strength Index moves opposite to price, signaling weakening momentum and potential reversal.",
    expertDefinition: "Standard RSI compares smoothed upward and downward price changes over a selected lookback and expresses their relative strength on a 0–100 scale. A divergence compares its selected swings with price swings: for example, a lower price low alongside a higher RSI low. Those observations can occur before either a reversal or continued decline. Changing the interval or which swings count changes the comparison. No timeframe is established here as reliably predictive. Use matching external price and standard RSI data for the worksheet; the RSI-style value in TradeHQ is not a standard historical RSI calculation.",
    proTip: "Compare the price swings and RSI swings over the same dates and settings. Record both divergences followed by reversals and those followed by continuation; divergence is not an entry guarantee.",
    difficulty: "Intermediate",
    readTime: "4 min",
    category: "Technical Analysis",
    keyPoints: [
      "Bullish divergence: price lower low + RSI higher low",
      "Bearish divergence: price higher high + RSI lower high",
      "Results depend on the sample and settings; no reliable timeframe is established here"
    ],
    studentPerspective: "Compare the price swings and RSI swings over the same dates and settings. Record both divergences followed by reversals and those followed by continuation; divergence is not an entry guarantee.",
    relatedTerms: ["macd-histogram", "bollinger-band-squeeze", "support-and-resistance"]
  },
  {
    slug: "macd-histogram",
    term: "MACD Histogram",
    definition: "The MACD histogram represents the difference between the MACD line and signal line as vertical bars. It is calculated from past prices.",
    expertDefinition: "The MACD histogram is MACD minus its signal line. Under common defaults, MACD is a 12-period exponential average minus a 26-period average; the signal is a 9-period exponential average of MACD. A positive histogram means MACD exceeds the signal. Bars becoming less negative mean that difference is narrowing, not that the asset must rise. The histogram can change because either component changes. Interval, initialization and price data affect the calculation. TradeHQ does not display a MACD overlay, so calculate this example separately rather than treating the practice chart as indicator evidence.",
    proTip: "Compare the histogram with the difference between the MACD and signal lines. A shrinking bar describes that difference getting smaller; it does not establish when a price reversal will occur.",
    difficulty: "Intermediate",
    readTime: "4 min",
    category: "Technical Analysis",
    keyPoints: [
      "Measures the gap between MACD line and signal line",
      "Bars show MACD minus its signal line; a larger difference does not by itself measure price acceleration",
      "Histogram divergence describes historical observations, not a reversal forecast"
    ],
    studentPerspective: "Reproduce the difference between a MACD line and its signal line before interpreting the bars. This describes calculated observations, not a reliable entry or exit time.",
    relatedTerms: ["macd", "rsi-divergence", "golden-cross"]
  },
  {
    slug: "bollinger-band-squeeze",
    term: "Bollinger Band Squeeze",
    definition: "A Bollinger Band squeeze describes a narrow distance between the bands relative to a selected comparison period. It reflects lower measured volatility, without specifying the direction or size of the next move.",
    expertDefinition: "Bollinger Bands place upper and lower bands around a moving average using a selected measure of price dispersion. A commonly used setup is a 20-period simple average with bands two standard deviations away, but settings vary. A squeeze describes relatively narrow bands compared with a stated lookback. It does not establish when volatility will increase, which direction price will move or how far. Past price distributions need not be normal, and the bands are not a guaranteed probability interval. Record the calculation and comparison period before evaluating later candles; avoid choosing a squeeze only after seeing a large move.",
    proTip: "Record the bandwidth calculation and the period used. Narrow bands describe lower recent volatility; a breakout can fail and the bands do not establish its timing or direction.",
    difficulty: "Intermediate",
    readTime: "4 min",
    category: "Technical Analysis",
    keyPoints: [
      "Narrow bands describe lower recent volatility; they do not establish when a breakout will occur",
      "A break outside a band is an observation that can continue or reverse",
      "Volume provides another observation, without validating a future move"
    ],
    studentPerspective: "Compare the bandwidth over a stated sample. Narrow bands describe recent price dispersion, without storing physical energy or identifying the next move’s size or direction.",
    relatedTerms: ["rsi-divergence", "support-and-resistance", "candlestick-patterns"]
  },
  {
    slug: "order-block",
    term: "Order Block",
    definition: "An order block is a chart-defined zone used in some technical-analysis frameworks; candles alone do not establish actual institutional orders. Identified as the last opposing candle before an impulsive move.",
    expertDefinition: "An order block is a chart-zone label used in some trading frameworks, often for the last opposing candle before a selected directional move. Definitions differ between authors. Candles aggregate transactions and do not identify a particular institution, an unfilled order or a hidden inventory position. Terms such as mitigation and accumulation remain interpretations unless separately supported by order or participant evidence. A useful worksheet fixes the zone criteria in advance, records every revisit and includes failures. The order-mechanics reference explains actual order instructions; it does not validate an order-block forecasting method.",
    proTip: "Label the candle zone and the rule used to select it. Price candles alone cannot identify a particular institution's orders, remaining inventory or future buying intentions.",
    difficulty: "Pro",
    readTime: "5 min",
    category: "Smart Money Concepts",
    keyPoints: [
      "Interprets price zones without proving institutional accumulation or distribution",
      "Bullish OB: last red candle before impulsive move up",
      "Price may revisit or move away from a marked block; continuation is uncertain"
    ],
    studentPerspective: "Label the candle zone and the rule used to select it. Price candles alone cannot identify a particular institution's orders, remaining inventory or future buying intentions.",
    relatedTerms: ["fair-value-gap", "support-and-resistance", "whale-manipulation"]
  },
  {
    slug: "fair-value-gap",
    term: "Fair Value Gap (FVG)",
    definition: "A Fair Value Gap is a three-candle chart pattern where the wicks of the first and third candles do not overlap. The range need not be revisited and does not establish economic fair value or unfilled orders.",
    expertDefinition: "A Fair Value Gap (FVG) is a chart label used in Smart Money Concepts (SMC) and Inner Circle Trader (ICT) frameworks for a non-overlapping range in a three-candle sequence. It does not directly measure market efficiency or remaining orders. Structurally, an FVG is defined by a three-candle sequence where the wicks (shadows) of the first and third candles do not overlap, creating a visible gap in price on the chart. The candle pattern alone cannot show which participants traded or establish that only buyers or sellers were active. An upward FVG is labelled when the high of candle one and the low of candle three do not overlap. The label does not reveal unfilled orders or prove future demand. A bearish FVG forms during a strong downward move: the low of candle one and the high of candle three do not overlap, creating a supply zone. The chart label does not establish economic fair value or a market-efficiency violation. An apparent gap can depend on the selected observations, aggregation interval and data source. No quantified probability of a revisit or trend continuation is established by the gap itself; both fills and unfilled gaps occur. The selected candles and timeframe affect which ranges are labelled as gaps; the label does not measure predictive reliability. Volume and price movement describe the observed sample; their presence does not establish a future response to the marked range. A longer candle interval aggregates more observations, but it does not identify the size or intent of institutional orders. Several chart labels can overlap at the same price range; that overlap is not independent evidence of a profitable trade. A later revisit can be recorded alongside ranges that remain unvisited. Other candle labels describe additional observations; calling them confirmation does not establish a profitable entry or a reliable future response.",
    proTip: "Identify the three candles and the non-overlapping price range. Compare examples where price revisits the range with examples where it does not; a gap need not fill or act as support.",
    difficulty: "Pro",
    readTime: "5 min",
    category: "Smart Money Concepts",
    keyPoints: [
      "Created by a 3-candle sequence with non-overlapping wicks",
      "Labels a non-overlapping candle range that need not be revisited",
      "Not a validated entry rule or guarantee that a gap will fill"
    ],
    studentPerspective: "Identify the three candles and the non-overlapping price range. Compare examples where price revisits the range with examples where it does not; a gap need not fill or act as support.",
    relatedTerms: ["order-block", "liquidation-cascade", "support-and-resistance"]
  },
  {
    slug: "bull-trap",
    term: "Bull Trap",
    definition: "A retrospective label for a move above selected resistance followed by a downward reversal. The pattern alone does not establish buyers’ losses or anyone’s intent.",
    expertDefinition: "A bull trap is a retrospective label for a price move above a selected resistance area that subsequently reverses below it. The apparent breakout can encourage purchases, but a chart alone cannot establish buyers’ motives or a deliberate attempt to trap them. Definitions of resistance, breakout and reversal depend on the interval and tolerance used. At the moment of the initial break, the subsequent reversal is unknown. A study should define its criteria before looking ahead, include successful continuations as well as reversals and compare realistic fills and costs. No pattern label guarantees that an intended stop can execute at its trigger price.",
    proTip: "Compare the breakout level, subsequent close and trading volume. A retest or candle-close filter can be evaluated as a rule, but it cannot eliminate failed breakouts.",
    difficulty: "Novice",
    readTime: "3 min",
    category: "Market Mechanics",
    keyPoints: [
      "False breakout above resistance that reverses quickly",
      "Define the resistance area and reversal window before counting examples or claiming a frequency",
      "Confirmed when price closes back below the broken resistance"
    ],
    studentPerspective: "Record both a breakout and its later reversal using fixed definitions. A confirmation filter changes the rule being tested; it cannot remove every failed signal.",
    relatedTerms: ["bear-trap", "support-and-resistance", "stop-loss-hunting"]
  },
  {
    slug: "bear-trap",
    term: "Bear Trap",
    definition: "A retrospective label for a move below selected support followed by an upward reversal. The price path alone does not establish short positioning or deliberate manipulation.",
    expertDefinition: "A bear trap is a retrospective description of a move below a chosen support area followed by an upward reversal. It need not reveal intentional manipulation or the actual location of short positions. A short seller can lose if the repurchase price rises, but the existence and size of short covering require separate evidence. State the price interval, support criteria and reversal window before collecting examples. Include declines that continue as well as rebounds. TradeHQ cannot open a short position, so any short-sale comparison must be a separate hypothetical worksheet.",
    proTip: "Record when price breaks a chosen support level and later returns above it. The label describes a sequence of prices; it does not prove manipulation or a high win rate.",
    difficulty: "Novice",
    readTime: "3 min",
    category: "Market Mechanics",
    keyPoints: [
      "False breakdown below support that reverses sharply upward",
      "Can cross intended exit levels; a price pattern does not establish deliberate intent",
      "A rebound can occur, but its size and cause are not established by this label"
    ],
    studentPerspective: "Define the chosen support level before reviewing the later candles. A close below that level can still be followed by a recovery; waiting is not guaranteed protection.",
    relatedTerms: ["bull-trap", "short-squeeze", "support-and-resistance"]
  },
  {
    slug: "whale-manipulation",
    term: "Whale Manipulation",
    definition: "Whale manipulation refers to large traders using substantial capital to artificially influence prices through spoofing, wash trading, and strategic order placement.",
    expertDefinition: "Whale is informal language for a participant or wallet with a large position. Holding or moving a large amount does not by itself establish manipulation. Spoofing involves deceptive orders intended to be cancelled rather than executed; wash-trading allegations concern transactions creating a false appearance of activity. Proving either requires evidence beyond a candlestick, displayed order or wallet transfer and depends on applicable rules. A transfer may reflect custody reorganization or another purpose unrelated to a market sale. Distinguish observable size and timing from claims about ownership, intent and price effects. Do not present alleged misconduct as a validated trading signal.",
    proTip: "Separate an observable transfer or order-book change from an inferred motive. A large wallet movement can be custody or exchange activity and is not proof of accumulation or a trade signal.",
    difficulty: "Intermediate",
    readTime: "4 min",
    category: "Market Mechanics",
    keyPoints: [
      "Large ownership alone does not prove spoofing, wash trading or other misconduct",
      "Allegations require evidence and applicable market rules",
      "On-chain analytics can track whale wallet movements in crypto"
    ],
    studentPerspective: "Separate an observed transfer or order-book change from a claim about motive. Unusual size alone does not prove manipulation or identify a profitable response.",
    relatedTerms: ["liquidation-cascade", "stop-loss-hunting", "order-block"]
  },
  {
    slug: "support-and-resistance",
    term: "Support and Resistance",
    definition: "Support and resistance are price areas where traders look for repeated buying or selling responses. Past reactions help define the areas but do not prevent a later price from passing through them.",
    expertDefinition: "Support and resistance describe price areas selected from earlier reactions or other chart rules. A past low can be used to mark support and a past high resistance, but subsequent transactions can occur beyond either. A level’s appearance depends on data frequency, adjustment, chosen tolerance and how many observations are counted. A level marked on a daily chart is not automatically more predictive than one on a shorter interval. Specify the rule before inspecting later prices, record breaks and state whether a purported reaction is an intraday observation or a close. The drawing is a description, not evidence of hidden demand or a guaranteed exit.",
    proTip: "Mark the price reactions used to draw each zone before observing the later result. Repeated tests do not establish a fixed probability of a break, and an apparent floor can fail.",
    difficulty: "Novice",
    readTime: "3 min",
    category: "Technical Analysis",
    keyPoints: [
      "Support and resistance label areas of prior reactions rather than floors or ceilings",
      "Some chart frameworks relabel a crossed level; the next reaction remains uncertain",
      "Record the selected touches, interval and volume without ranking a level as reliably strongest"
    ],
    studentPerspective: "Draw zones from specified price observations and compare alternative anchors. These are chart descriptions rather than floors, ceilings or a required first trading method.",
    relatedTerms: ["fibonacci-retracement", "order-block", "candlestick-patterns"]
  },
  {
    slug: "candlestick-patterns",
    term: "Candlestick Patterns",
    definition: "Candlestick patterns are names for formations built from opening, high, low and closing prices. Traders use them to describe price action; a formation alone does not establish a reliable reversal or continuation.",
    expertDefinition: "A candlestick summarizes opening, high, low and closing prices for a stated interval. Its body runs between open and close; wicks extend to high and low. A doji describes a small open-to-close difference under a chosen tolerance. Engulfing patterns compare at least two candles, while names such as morning star describe longer sequences. A candle does not disclose the order of every transaction within the interval or the identity and motives of participants. Pattern definitions and data quality matter. Comparing failed and successful examples is more informative than selecting a recognizable shape only after its later outcome is known.",
    proTip: "Read each pattern in terms of open, high, low and close. Compare its behaviour across a defined sample rather than assuming that a named pattern has a particular win rate.",
    difficulty: "Novice",
    readTime: "4 min",
    category: "Technical Analysis",
    keyPoints: [
      "Single-candle examples include doji, hammer and shooting star; engulfing needs two candles",
      "Multi-candle: morning star, evening star, three white soldiers",
      "Context changes a pattern description but does not establish its success rate"
    ],
    studentPerspective: "Read the open, high, low and close as observations. A candle shape does not reveal participant motives or the next price movement.",
    relatedTerms: ["support-and-resistance", "head-and-shoulders", "double-bottom"]
  },
  {
    slug: "head-and-shoulders",
    term: "Head and Shoulders",
    definition: "A head and shoulders pattern has three peaks, with a higher central peak and two lower shoulders. A neckline connects the intervening lows; breaking it is a chart observation, not a confirmed future decline or guaranteed target.",
    expertDefinition: "The head and shoulders pattern is a commonly described reversal formation in technical analysis. It consists of three distinct peaks: a left shoulder, a higher central peak (the head), and a right shoulder that is approximately equal in height to the left shoulder. The troughs between these peaks are connected by a line called the neckline, and a break below this neckline completes the conventional pattern description; continued decline is a hypothesis that can fail. The psychology behind the formation tells a story of changing market sentiment across five phases. Phase one: the market trends upward and creates the left shoulder, a normal swing high. Phase two: a pullback creates the first neckline touch. Phase three: renewed buying pushes price to a higher high (the head), suggesting the uptrend is accelerating. Phase four: another pullback returns to the neckline area, and bulls attempt one more push higher. Phase five: the rally fails to reach the head's height, forming the right shoulder — a critical sign that buying enthusiasm is waning. The measured move technique provides a price target: measure the vertical distance from the head to the neckline, then subtract that distance from the neckline breakout point. Volume adds a separate historical observation; it does not validate a forecast. Ideally, volume is highest during the left shoulder's formation, decreases during the head, and is lowest during the right shoulder — showing diminishing participation in each successive rally. The neckline break should occur on increasing volume. Volume alone does not establish the probability that a neckline break will persist. The inverse pattern uses three troughs rather than peaks and is commonly interpreted as a bullish hypothesis, which can fail.",
    proTip: "Draw the three peaks and neckline, then distinguish the pattern's measured-move convention from the actual later price. A projected target is a hypothesis rather than an expected payout.",
    difficulty: "Intermediate",
    readTime: "4 min",
    category: "Chart Patterns",
    keyPoints: [
      "Three peaks: left shoulder, head (highest), right shoulder",
      "A neckline break describes the chart; a measured target is a projection, not a guaranteed outcome",
      "The inverse shape can occur without a lasting upward reversal"
    ],
    studentPerspective: "Draw the three peaks and neckline, then distinguish the pattern's measured-move convention from the actual later price. A projected target is a hypothesis rather than an expected payout.",
    relatedTerms: ["double-bottom", "support-and-resistance", "candlestick-patterns"]
  },
  {
    slug: "double-bottom",
    term: "Double Bottom",
    definition: "A double bottom is a W-shaped chart pattern with two troughs near a similar level. A later move above the intervening peak fits the pattern, but does not ensure that a rally continues.",
    expertDefinition: "The double bottom is a bullish reversal pattern that forms after a sustained downtrend, characterized by two consecutive troughs at approximately the same price level separated by a moderate peak (the neckline). The pattern resembles the letter 'W' on a chart and is commonly interpreted as a possible reversal near a repeated price low; the chart alone cannot establish that selling pressure has been exhausted. The formation process tells a clear narrative. The first bottom forms as the existing downtrend reaches a point where buyers emerge, creating a bounce. The subsequent rally creates the neckline — the intermediate peak between the two bottoms. However, the rally loses momentum and price declines again to retest the support level established by the first bottom. The second bottom is the critical test: if price rises again from the low, it records another bounce at that level without proving the cause or durability. Pattern confirmation occurs when price breaks above the neckline (the peak between the two bottoms). The measured move target equals the depth of the pattern — the distance from the bottoms to the neckline — projected upward from the neckline breakout point. Volume characteristics provide context but do not establish predictive reliability. Ideally, volume is highest during the first decline, diminishes during the second decline (showing reduced selling conviction), and expands significantly on the neckline breakout. A volume observation does not establish a measured breakout failure rate. RSI divergence is another description of the selected historical data, not evidence of a dramatically higher success rate. If the RSI makes a higher low while price makes an equal or lower low at the second bottom, the oscillator records a smaller decline in its selected inputs; this does not validate a subsequent reversal.",
    proTip: "Identify the two lows and intervening high with consistent rules. Compare completed and failed examples; two similar lows alone do not establish a trend reversal.",
    difficulty: "Novice",
    readTime: "3 min",
    category: "Chart Patterns",
    keyPoints: [
      "W-shaped pattern with two tests of the same support level",
      "Confirmed when price breaks above the neckline (middle peak)",
      "RSI divergence is another historical observation, not independent proof of a profitable reversal"
    ],
    studentPerspective: "Identify the two lows and the intervening high under fixed rules, including failed examples. A familiar pattern does not establish a beginner’s readiness or confidence level.",
    relatedTerms: ["head-and-shoulders", "support-and-resistance", "bull-trap"]
  },
  {
    slug: "macd",
    term: "Moving Average Convergence Divergence",
    definition: "MACD shows the relationship between two EMAs. The MACD line, signal line, and histogram together reveal trend direction, momentum, and potential reversals.",
    expertDefinition: "MACD compares exponential moving averages. With common defaults, the MACD line equals the 12-period EMA minus the 26-period EMA, the signal is a 9-period EMA of MACD and the histogram is their difference. A crossover or zero-line crossing is an event in related calculations based on past prices. It need not precede a lasting move and can repeat in a trading range. Prices, interval, initialization and settings must be stated before comparing results. The Fidelity reference documents the default calculation. TradeHQ has no MACD overlay and cannot validate a MACD rule using its generated practice candles.",
    proTip: "State the moving-average settings and compare the resulting crossovers with price. Combining timeframes changes the rule being tested and does not automatically improve its accuracy.",
    difficulty: "Novice",
    readTime: "4 min",
    category: "Technical Analysis",
    keyPoints: [
      "MACD line = 12 EMA minus 26 EMA; Signal line = 9 EMA of MACD",
      "Crossovers are indicator events, rather than validated buy or sell instructions",
      "A zero-line crossing describes the relationship of the selected moving averages"
    ],
    studentPerspective: "Calculate each MACD component from stated data and settings. The resulting crossings describe related averages and do not guarantee a reversal.",
    relatedTerms: ["macd-histogram", "golden-cross", "rsi-divergence"]
  },
  {
    slug: "limit-order-vs-market-order",
    term: "Limit Order vs Market Order",
    definition: "Market orders seek prompt execution at available prices. Limit orders set a price boundary and may remain unfilled. Choosing an order type involves a trade-off between execution priority and price control.",
    expertDefinition: "A market order requests execution at available prices without setting a maximum buy or minimum sell price. A limit order sets that boundary, but may fill partly or not at all. A last-traded price is not a commitment that the same quantity is available now. For a hypothetical example, suppose the ask shows $20 for only five shares while a buyer wants ten. A market fill may reach higher offers. A $20 buy limit cannot execute above $20, but the unfilled quantity may remain open or expire according to its instructions. A stop-market instruction, by contrast, becomes a market order after its trigger and does not promise the trigger price. Compare prices, completion, delays and modeled costs separately rather than assume an order type ensures better financial results. TradeHQ supports simplified virtual market orders only; it does not operate an exchange order book or pending orders.",
    proTip: "Compare price control with execution uncertainty. A market order prioritises execution at available prices; a limit order sets a price boundary but may not fill. TradeHQ currently executes market practice orders only.",
    difficulty: "Novice",
    readTime: "3 min",
    category: "Trading Fundamentals",
    keyPoints: [
      "Market orders request execution at available prices; fills and price depend on liquidity",
      "Limit orders: exact price control, but may not fill",
      "Limit prices constrain execution price, without ensuring a fill or preventing loss"
    ],
    studentPerspective: "Compare price control with execution uncertainty. A market order prioritises execution at available prices; a limit order sets a price boundary but may not fill. TradeHQ currently executes market practice orders only.",
    relatedTerms: ["stop-loss-hunting", "leverage-trading", "support-and-resistance"]
  },
  {
    slug: "stop-loss-hunting",
    term: "Stop Loss Hunting",
    definition: "A suspected intentional move through levels where stop orders may be placed. A price reversal alone does not prove manipulation, identify a trader or reveal actual order locations.",
    expertDefinition: "Stop loss hunting is a term used for a suspected intentional move through levels where stop orders may be placed. A chart showing a move through such a level does not establish manipulation, the identity of a trader or actual order locations. Distinguish a suspected explanation from observable prices, actual order records and findings by a market authority; similar chart movements can have different causes. In a hypothetical example, several participants could choose exits below a recent low. If the market trades through those levels, triggered sell orders could add to selling pressure. That example describes a possible order-flow mechanism, rather than evidence that actual orders were concentrated there or that another participant deliberately moved the price. A later reversal could reflect new orders, changing liquidity, news or other causes. A wick records an interval's price range; it is not a visual signature proving a completed hunt. Public order books show displayed orders, while stop instructions, hidden orders and positions may not be publicly visible. Liquidation estimates and third-party heatmaps also require a clearly identified data source and methodology; they do not reveal every account or the location of the next price move. Charts aggregate trades over a chosen interval, so changing the interval can change how an apparent sweep looks. To examine a suspected event, first record the instrument, venue, observation time, price and volume data. Separate that record from assumptions about hidden orders or participant intent. Compare other plausible explanations and avoid treating a single chart pattern as proof. Trading safeguards involve trade-offs. A stop-market instruction can execute at a different price from its trigger, a stop-limit instruction can remain unfilled, and an unsubmitted mental exit is not an exchange order. Changing a stop level or using a time-based exit cannot guarantee protection against loss or an adverse move. TradeHQ's simulator currently supports market practice orders rather than automated stops. Its displayed practice charts should not be treated as forensic evidence about actual exchange manipulation.",
    proTip: "Distinguish the observed price move from a claim about who caused it. Stop placement involves a trade-off between exposure and the chance of an exit; no fixed buffer prevents losses.",
    difficulty: "Intermediate",
    readTime: "4 min",
    category: "Market Mechanics",
    keyPoints: [
      "Describes a suspected mechanism, rather than proving actual stop locations",
      "A reversal after a level breaks does not establish deliberate manipulation",
      "No stop buffer or exit method guarantees protection against loss"
    ],
    studentPerspective: "A stop can be triggered before price reverses for many ordinary reasons, including volatility, clustered order flow, spread changes, and the level you chose. Avoid assuming manipulation without evidence; review the market structure and your placement instead.",
    relatedTerms: ["whale-manipulation", "bull-trap", "bear-trap"]
  },
  {
    slug: "leverage-trading",
    term: "Leverage Trading",
    definition: "Control a larger market position with borrowed funds or margin. At 10x leverage, $1,000 of margin controls roughly $10,000 of exposure. Leverage amplifies both gains and losses.",
    expertDefinition: "Leverage describes notional exposure relative to the equity or collateral supporting it. A hypothetical $1,000 margin amount supporting $10,000 exposure gives a 10-to-one ratio. A 10% adverse price move on that exposure is $1,000 before costs, but this is not a liquidation formula. Initial and maintenance requirements, eligible collateral, other positions, fees and venue rules all matter. A loan-funded share purchase differs from a futures performance bond or a perpetual contract. Product eligibility and maximum permitted exposure vary by jurisdiction, customer category, broker and instrument. An advertised maximum is neither permission for a particular user nor a recommendation. TradeHQ’s ordinary spot practice orders do not borrow money or reproduce a leveraged account. A worksheet can compare price shocks, account equity and cash-flow demands while keeping legal eligibility and actual margin terms as separate questions. Hypothetical worksheet: an account with $1,500 equity and $10,000 exposure loses $300 on a 3% adverse move before fees. Equity becomes $1,200. The initial exposure-to-account-equity ratio was about 6.67, even if only $1,000 had been labelled posted margin. This is why the denominator and eligible collateral must be stated; no exchange liquidation threshold is supplied by that arithmetic.",
    proTip: "Compare notional exposure with posted margin and calculate hypothetical gains and losses before costs. Maintenance margin, funding, fees and venue rules affect liquidation; leverage alone is insufficient.",
    difficulty: "Intermediate",
    readTime: "5 min",
    category: "Trading Fundamentals",
    keyPoints: [
      "Amplifies both gains and losses by the leverage multiplier",
      "Liquidation depends on maintenance requirements and venue rules and can occur before the deposit is exhausted",
      "No universal professional leverage limit is established here"
    ],
    studentPerspective: "Use a hypothetical exposure-to-equity calculation to compare gains and losses. TradeHQ does not implement leverage, and completing the exercise does not establish suitability for a real margin account.",
    sources: [{ href: "https://www.cmegroup.com/education/courses/introduction-to-futures/margin-know-what-is-needed", label: "CME — futures margin mechanics (distinct from a stock loan)" }],
    relatedTerms: ["liquidation-cascade", "stop-loss-hunting", "limit-order-vs-market-order"]
  },
  {
    slug: "fomo",
    term: "FOMO (Fear of Missing Out)",
    definition: "FOMO is the anxiety-driven urge to trade because a price is moving or others appear to be profiting. The emotion does not identify a market top or establish a measured win rate.",
    expertDefinition: "FOMO means fear of missing out. In market discussions it can describe concern about missing apparent gains or pressure to imitate a publicly shared trade. The label does not diagnose a condition, identify someone’s motives from their purchase or measure future returns. Selectively published gains omit unknown losses, costs and unsuccessful participants. A learner can record what was known before a simulated decision and what was learned later, keeping the price outcome separate from the quality of the reasoning. No neurological claim, universal loss rate or promise that journaling improves returns is established here.",
    proTip: "Write down the information available at the time of a simulated decision and compare it with the reason for acting. A recent percentage move alone does not establish a safe entry or required waiting period.",
    difficulty: "Novice",
    readTime: "3 min",
    category: "Trading Psychology",
    keyPoints: [
      "Emotional response to seeing rapid price increases",
      "Emotion alone does not establish where a market top is or a measured loss probability",
      "Combat FOMO with pre-defined trading plans and alerts"
    ],
    studentPerspective: "Compare the recorded reason for a virtual decision with the information available at that time. The exercise does not diagnose a person or distinguish professionals from amateurs.",
    relatedTerms: ["fud", "bull-trap", "hodl-strategy"]
  },
  {
    slug: "fud",
    term: "FUD (Fear, Uncertainty, Doubt)",
    definition: "FUD means fear, uncertainty and doubt. The label is often applied to negative claims; it does not establish whether a claim is true, false or deliberately manipulative.",
    expertDefinition: "FUD means fear, uncertainty and doubt. It is often applied to negative claims about a company, token or market. Calling a claim FUD does not establish whether it is accurate, mistaken or intentionally deceptive. Identify the original source, publication date, evidence and exact allegation; distinguish a regulatory announcement from commentary about its likely price effects. A later price rise does not disprove an earlier risk, and a decline does not verify every allegation. The exercise concerns information checking rather than diagnosing emotions, inferring a short seller’s motives or forecasting a market response.",
    proTip: "Check the original source, date and uncertainty behind a negative claim. Neither fear nor a negative funding rate proves that a rebound is likely.",
    difficulty: "Novice",
    readTime: "3 min",
    category: "Trading Psychology",
    keyPoints: [
      "Can be legitimate concerns or deliberate manipulation",
      "Often spread on social media to trigger panic selling",
      "Always verify FUD claims through official sources before reacting"
    ],
    studentPerspective: "Check a negative claim’s original source and date. A concern can be material, mistaken or uncertain; a prior thesis does not turn every adverse report into a buying opportunity.",
    relatedTerms: ["fomo", "whale-manipulation", "bear-trap"]
  },
  {
    slug: "hodl-strategy",
    term: "HODL Strategy",
    definition: "HODL is a buy-and-hold expression associated with a Bitcoin forum typo. Holding through volatility can still produce losses; neither a four-year period nor an earlier price history guarantees recovery.",
    expertDefinition: "HODL is informal language for retaining a crypto holding through price fluctuations. It is not a contractual protection, a guaranteed recovery rule or a distinct instrument. A single purchase and a recurring contribution schedule are different cash flows, and either can be held for a long period. A token can lose most or all of its value, become difficult to sell or be lost through custody failure. A published issuance rule alone cannot establish demand, purchasing power or future price. The linked Bitcoin white paper explains the protocol proposal; it does not validate a profitable holding strategy.",
    proTip: "Compare a hold-through-declines scenario with an exit scenario, including the possibility of permanent loss. A long holding period does not guarantee recovery.",
    difficulty: "Novice",
    readTime: "3 min",
    category: "Trading Psychology",
    keyPoints: [
      "Originated from a 2013 Bitcoin forum typo ('HODL' instead of 'HOLD')",
      "Fewer transactions may reduce trading costs while price and timing risks remain",
      "Requires strong conviction and tolerance for drawdowns"
    ],
    studentPerspective: "Compare a hypothetical holding period with an exit case, including permanent loss. Holding longer does not remove emotional decisions or guarantee a recovery.",
    relatedTerms: ["fomo", "fud", "dollar-cost-averaging"]
  },
  {
    slug: "satoshi-nakamoto",
    term: "Satoshi Nakamoto",
    definition: "Satoshi Nakamoto is the pseudonym used by the creator of Bitcoin, who published its whitepaper in 2008. Identity and ownership of wallets attributed to the creator remain uncertain.",
    expertDefinition: "Satoshi Nakamoto is the name attached to the Bitcoin white paper, Bitcoin: A Peer-to-Peer Electronic Cash System. The document proposes electronic payments using cryptographic proof and a distributed timestamp mechanism. The name does not establish a verified individual identity. Claims about personal wealth, motives or ownership of particular early-mined coins require evidence beyond the paper and are not established here. Reading the original proposal helps separate its protocol design from later commentary about Bitcoin’s investment value. Neither the author’s identity nor a protocol description supplies a forecast of token prices.",
    proTip: "Distinguish published evidence about Bitcoin's creation from estimates assigning particular wallets to its creator. A wallet attribution or hypothetical transfer is not a reliable price forecast.",
    difficulty: "Novice",
    readTime: "3 min",
    category: "Crypto Fundamentals",
    keyPoints: [
      "Published the Bitcoin whitepaper on October 31, 2008",
      "Wallet attribution and estimated holdings are uncertain; no exact ownership total is asserted here",
      "True identity remains unknown — one of tech's biggest mysteries"
    ],
    studentPerspective: "Satoshi's creation of Bitcoin introduced the concept of decentralized money. Understanding the origin story contextualizes the entire crypto ecosystem.",
    relatedTerms: ["hodl-strategy", "leverage-trading", "liquidation-cascade"]
  },
  // === TERMS 26-50 ===
  {
    slug: "margin-call",
    term: "Margin Call",
    definition: "A demand for additional collateral under an account’s margin terms. A broker may reduce or liquidate positions under its rules; a call does not guarantee a response period.",
    expertDefinition: "A margin call concerns collateral under a particular account agreement. In a loan-funded securities account, equity is the marked asset value less the loan and relevant obligations. Initial and maintenance requirements differ, and a broker can impose house requirements or change them. Futures performance-bond arrangements are a different mechanism from borrowing to purchase shares. Do not transfer a percentage or deadline between products. The linked SEC bulletin warns that a brokerage may sell securities without consulting the customer and that an extension is not an entitlement. Depositing collateral, reducing exposure or liquidation can change the account, but none guarantees a chosen exit price or caps every loss. TradeHQ has no margin accounts. Use the hypothetical equity calculation below to study the denominator, then keep actual broker procedures as a separate source-reading question.",
    proTip: "Read the account's initial margin, maintenance requirements and broker liquidation terms. Alert thresholds are personal monitoring choices; they do not ensure time to respond before liquidation.",
    difficulty: "Intermediate",
    readTime: "4 min",
    category: "Trading Fundamentals",
    keyPoints: [
      "Triggered when account equity falls below maintenance margin",
      "A broker may reduce or liquidate positions under its agreement; no guaranteed warning or response window is implied",
      "Multiple simultaneous margin calls can amplify market crashes"
    ],
    studentPerspective: "Read the relevant maintenance and liquidation terms. A margin call can require action quickly, and no lesson or alert guarantees time to respond. TradeHQ has no margin accounts.",
    relatedTerms: ["leverage-trading", "liquidation-cascade", "stop-loss-hunting"]
  },
  {
    slug: "liquidation-price",
    term: "Liquidation Price",
    definition: "A liquidation price is an estimate of the level at which a leveraged position may be closed under a platform's margin rules. Collateral, fees, other positions and the pricing method can change that estimate.",
    expertDefinition: "A liquidation price is a venue-calculated threshold used in managing a collateralized position. It is not necessarily an executable price or the price that consumes every dollar of equity. Maintenance requirements, other positions, eligible collateral, fees, funding and mark-price rules affect the threshold. Actual closing orders may execute differently during a gap or liquidity shortage. Isolated and cross-margin arrangements allocate eligible collateral differently; neither label establishes a universal cap on losses or account obligations. Consult a specific contract and venue rules for an actual calculation. TradeHQ’s unleveraged spot simulation has no liquidation-price engine.",
    proTip: "Use the venue's documented formula and include maintenance margin, fees and funding. The reciprocal of leverage is only a simplified margin-loss illustration, not an exact liquidation price.",
    difficulty: "Intermediate",
    readTime: "4 min",
    category: "Trading Fundamentals",
    keyPoints: [
      "Higher leverage brings the liquidation price closer to entry",
      "Isolated-margin treatment depends on the platform rules; it is not a universal loss guarantee",
      "Mark price vs last price affects when liquidation triggers"
    ],
    studentPerspective: "Compare the inputs in a venue’s documented estimate rather than treating one displayed price as fixed. Margin requirements and other positions can change the result.",
    relatedTerms: ["leverage-trading", "margin-call", "liquidation-cascade"]
  },
  {
    slug: "dollar-cost-averaging",
    term: "Dollar Cost Averaging",
    definition: "Dollar-cost averaging means contributing fixed amounts at regular intervals regardless of price. It changes purchase timing and the units acquired; it does not guarantee a lower average cost or outperform a lump-sum investment.",
    expertDefinition: "Dollar Cost Averaging (DCA) is an investment strategy where a fixed dollar amount is invested into a specific asset at regular intervals — weekly, bi-weekly, or monthly — regardless of the asset's current price. Equal contributions buy more units at lower prices and fewer at higher prices. The resulting average cost can be above or below a lump-sum purchase; the price sequence and costs determine the comparison. Price variation changes the units acquired under a fixed contribution schedule; that is a purchase-timing effect rather than a guaranteed mathematical advantage. In a volatile asset like Bitcoin, a $500 monthly investment over 12 months will purchase more BTC during months when the price is depressed and less during price peaks. A fixed schedule reduces decisions about purchase dates but does not eliminate emotion, automate every product or guarantee a better result. For a hypothetical example without fees, investing $100 when a unit costs $10 buys 10 units; another $100 at $20 buys 5. The combined 15 units cost $200, or about $13.33 per unit. Investing the same $200 entirely at the first $10 price would buy 20 units, while investing it entirely at $20 would buy 10. These examples show how timing changes the quantity purchased. They do not imply that either contribution schedule will outperform across a different price path or after costs.",
    proTip: "Compare equal periodic contributions with the same total invested earlier, using stated prices and costs. Contribution frequency changes exposure and does not guarantee a lower cost or better return.",
    difficulty: "Novice",
    readTime: "3 min",
    category: "Trading Fundamentals",
    keyPoints: [
      "Fixed amount invested at regular intervals regardless of price",
      "Buys more when prices are low, less when high — averaging down",
      "A schedule defines purchase timing without eliminating emotion or guaranteeing a better result"
    ],
    studentPerspective: "Calculate units bought under equal contributions at different hypothetical prices. Compare the same total cash over the same dates; a schedule does not establish a better return.",
    relatedTerms: ["hodl-strategy", "fomo", "risk-reward-ratio"]
  },
  {
    slug: "swing-trading",
    term: "Swing Trading",
    definition: "Holding positions across sessions, commonly for days or weeks. Review schedules and chart intervals vary; gaps and execution risks remain.",
    expertDefinition: "Swing trading describes a holding-period style in which positions commonly remain open across multiple sessions. It is not a standardized contract or proof that a particular schedule suits someone with a job or school commitments. Prices can gap during closed sessions, and an intended exit can execute at a different price or fail during a halt or outage. Chart intervals and review schedules are choices rather than universal professional standards. Compare holding windows using matching dates, costs and assumptions, keeping missed reviews and adverse cases in the record. TradeHQ’s instant practice fills omit real order-book execution.",
    proTip: "Define the holding-period and exit rules before evaluating a practice example. Overnight gaps and execution costs affect results; no fixed position-risk percentage is universally appropriate.",
    difficulty: "Intermediate",
    readTime: "4 min",
    category: "Trading Fundamentals",
    keyPoints: [
      "Holds positions days to weeks to capture medium-term moves",
      "Chart intervals are choices for the stated exercise rather than a universal requirement",
      "Time requirements vary with the process and instruments; no universal daily schedule is established"
    ],
    studentPerspective: "Compare a multi-day holding window with a shorter one, including gaps between observations. No holding period is a universal best starting method for beginners.",
    relatedTerms: ["day-trading", "scalping", "support-and-resistance"]
  },
  {
    slug: "day-trading",
    term: "Day Trading",
    definition: "Day trading means opening and closing positions within a trading day. It reduces exposure to overnight moves while retaining intraday price, execution and cost risks; no universal loss rate is asserted.",
    expertDefinition: "Day trading describes opening and closing positions within the same trading day. Fully closing a position removes that position’s later price exposure, but an intended close can be interrupted by a halt, outage or liquidity shortage. Frequent transactions can make spread, commission and slippage important even when gross gains look positive. Neither full-time screen use nor a fixed number of transactions establishes competence or profitability. Margin and account requirements depend on current venue, broker and jurisdiction rules. This entry does not assert a universal retail loss rate. TradeHQ is a virtual spot simulator, not a brokerage or a margin account.",
    proTip: "Record costs, order timing and both winning and losing practice outcomes. No fixed number of trades or months proves a real-money edge, and simulator fills can differ from actual execution.",
    difficulty: "Pro",
    readTime: "5 min",
    category: "Trading Fundamentals",
    keyPoints: [
      "All positions opened and closed within the same trading day",
      "Published research and broker disclosures often report high loss rates among retail day traders; the exact rate varies by market, time period, and sample",
      "Real account margin and day-trading requirements depend on current rules, broker and jurisdiction"
    ],
    studentPerspective: "Compare the time demands and assumptions of swing and intraday examples; practice profit alone does not establish readiness for real-money trading.",
    relatedTerms: ["swing-trading", "scalping", "paper-trading"]
  },
  {
    slug: "scalping",
    term: "Scalping",
    definition: "Scalping describes attempts to capture small price movements over short holding periods. Execution and costs can outweigh gross gains.",
    expertDefinition: "Scalping is a short-holding-period style aimed at small price movements, often over seconds or minutes. A description of the objective is not evidence that the movements can be captured profitably. Latency, queue position, partial fills, spreads and commissions can matter relative to a small target. More transactions multiply costs as well as opportunities; the number alone cannot establish positive expectancy. Not every account offers the same execution or fee terms. TradeHQ’s displayed-price market fills do not reproduce an exchange order book, maker rebates or high-frequency infrastructure, so tiny simulated gains cannot validate an executable scalping strategy.",
    proTip: "Calculate spread, fees and slippage relative to the hypothetical gross gain. Profitability depends on both the size and frequency of wins and losses; a universal win-rate threshold is insufficient.",
    difficulty: "Pro",
    readTime: "4 min",
    category: "Trading Fundamentals",
    keyPoints: [
      "Captures tiny price movements over seconds to minutes",
      "Requires extremely low latency, tight spreads, and low commissions",
      "Break-even win rate depends on realized win and loss amounts plus costs"
    ],
    studentPerspective: "Compare a small hypothetical gross price change with spreads, fees and worse fills. Discipline alone cannot remove execution risk or establish an investment edge.",
    relatedTerms: ["day-trading", "swing-trading", "limit-order-vs-market-order"]
  },
  {
    slug: "volume-profile",
    term: "Volume Profile",
    definition: "Shows trading volume distribution at each price level rather than over time. Reveals where most activity occurred — the Point of Control — and value areas.",
    expertDefinition: "A volume profile groups observed trading volume into price bins over a stated sample. The point of control is the bin with the greatest volume under those settings. A value area encloses a selected share of volume using a specified construction method; a commonly chosen 70% share is not automatically one standard deviation or an economic valuation. Bin width, observation window and data coverage affect the result. A high-volume bin describes earlier activity and need not attract future price. TradeHQ does not supply a standard historical volume-profile overlay; a separate invented table is sufficient to learn the arithmetic.",
    proTip: "Check the selected time window and how traded volume was allocated to price bins. High- and low-volume nodes describe that sample, not a guaranteed future reaction.",
    difficulty: "Pro",
    readTime: "5 min",
    category: "Technical Analysis",
    keyPoints: [
      "Plots volume horizontally at each price level, not over time",
      "Point of Control is the highest-volume price bin in the selected sample; it need not attract future price",
      "A chosen value-area share summarizes observed volume, not economic fair value"
    ],
    studentPerspective: "Volume Profile allocates observed trading volume to price bins; it does not identify who still holds positions. Its bins depend on the chosen data, interval and width; they do not establish a reliable price barrier.",
    relatedTerms: ["support-and-resistance", "order-block", "vwap"]
  },
  {
    slug: "vwap",
    term: "VWAP",
    definition: "VWAP is the average observed trading price weighted by volume over a stated period. Price above or below it describes the sample; the relationship alone does not establish future direction.",
    expertDefinition: "Volume-weighted average price divides the sum of transaction price times quantity by total quantity over a stated sample. It weights trades rather than participants, so it does not reveal how many people are profitable or every investor’s cost basis. A benchmark comparison must specify its venue coverage and window. Some chart implementations use aggregated bars, which can differ from trade-level calculations. Price above VWAP means only that it exceeds that selected average; it need not continue or revert. Anchoring the calculation at another time changes the sample. TradeHQ does not provide a standard exchange-volume VWAP series.",
    proTip: "Recalculate the volume-weighted average for the chosen session or anchor. VWAP is a historical benchmark; price crossing it does not prove future support, resistance or profitability.",
    difficulty: "Intermediate",
    readTime: "4 min",
    category: "Technical Analysis",
    keyPoints: [
      "Average price weighted by the selected traded volume and observation window",
      "Price above or below VWAP describes a reference relationship, not a forecast",
      "A comparison benchmark whose sample and window must be stated"
    ],
    studentPerspective: "Recalculate the volume-weighted average for the chosen session or anchor. VWAP is a historical benchmark; price crossing it does not prove future support, resistance or profitability.",
    relatedTerms: ["volume-profile", "support-and-resistance", "day-trading"]
  },
  {
    slug: "ichimoku-cloud",
    term: "Ichimoku Cloud",
    definition: "A comprehensive Japanese indicator system showing support/resistance, trend direction, and momentum in a single view. The Cloud (Kumo) is the signature feature.",
    expertDefinition: "The Ichimoku Cloud combines five historical-price calculations with different lookbacks and plotting offsets. The linked TradingView documentation describes its components and introduces its late-1960s publication history. A line plotted ahead of the latest candle still uses historical inputs; it does not observe future support or resistance. The five components are: Tenkan-sen (Conversion Line) — the midpoint of the highest high and lowest low over the past 9 periods, serving as a fast signal line. Kijun-sen (Base Line) — the midpoint over 26 periods, serving as a medium-term trend indicator and potential support/resistance. Senkou Span A (Leading Span A) — the average of Tenkan and Kijun lines, plotted 26 periods into the future. Senkou Span B (Leading Span B) — the midpoint of the highest high and lowest low over 52 periods, plotted 26 periods ahead. The shaded area between Senkou Span A and B forms the Cloud (Kumo) — the system's signature feature. Chikou Span (Lagging Span) — the current closing price plotted 26 periods in the past, used for confirmation. Trading signals in Ichimoku follow a hierarchy. One convention labels a bullish alignment when price is above the Cloud, Tenkan-sen is above Kijun-sen, Chikou Span is above the earlier price and Senkou Span A is above B. The alignment describes selected historical calculations; it is not a proven strongest signal.",
    proTip: "Record the lookback and plotting offsets of each line. Lines drawn ahead on a chart are calculated from past prices and do not contain future market information.",
    difficulty: "Pro",
    readTime: "6 min",
    category: "Technical Analysis",
    keyPoints: [
      "Five components that show trend, momentum, and support/resistance",
      "The cloud plots calculated historical values with a chosen displacement",
      "Component alignment describes related calculations without proving predictive strength"
    ],
    studentPerspective: "Identify each lookback and plotting offset. A line displayed ahead of the current candle is calculated from historical prices, rather than knowledge of future support or resistance.",
    relatedTerms: ["support-and-resistance", "golden-cross", "macd"]
  },
  {
    slug: "elliott-wave-theory",
    term: "Elliott Wave Theory",
    definition: "Elliott wave theory interprets price patterns using impulse and corrective wave counts. Different counts can fit the same observations; a chosen count does not establish a reliable forecast.",
    expertDefinition: "Elliott Wave Theory is an interpretive chart framework that labels selected movements as five-wave impulses and three-wave corrections. Additional conventions about overlap and relative wave lengths are used by its proponents, but different start points and intervals can produce competing counts. Labelling a price path after seeing it is prone to hindsight bias. For an educational exercise, draw two plausible counts on one invented series, state the criteria and extend the series to invalidate one of them. Some presentations use Fibonacci ratios, but a ratio does not establish a measured chance of reversal. No labelled wave reveals hidden orders or guarantees that a forecast will occur by a particular time. Generated simulator charts cannot validate historical predictive results.",
    proTip: "Record the proposed count and alternative counts before observing the next move. Wave labels involve interpretation and do not establish the probability or timing of a forecast.",
    difficulty: "Pro",
    readTime: "6 min",
    category: "Technical Analysis",
    keyPoints: [
      "The framework labels selected movements as five-wave impulses and three-wave corrections",
      "Wave labels depend on interpretation and can be revised",
      "Fibonacci levels are selected reference ratios, not established reversal probabilities"
    ],
    studentPerspective: "Elliott Wave provides an interpretive vocabulary. Compare alternative counts; a count does not establish trend age, exhaustion or a reliable forecast.",
    relatedTerms: ["fibonacci-retracement", "support-and-resistance", "ichimoku-cloud"]
  },
  {
    slug: "wyckoff-method",
    term: "Wyckoff Method",
    definition: "The Wyckoff method interprets price and volume through phases such as accumulation, markup, distribution and markdown. Those labels describe a framework rather than verified institutional intentions.",
    expertDefinition: "Wyckoff's historical framework describes selected price and volume changes with labels such as accumulation, markup, distribution and markdown. Some educators label a temporary break below a chosen range a spring. These labels are an interpretation of visible data, not records proving institutional intentions. For a hypothetical exercise, mark the range and spring criteria before looking at later candles, then compare a reversal with a continuation lower. A chart cannot identify beneficial owners, hidden orders or a verified cause for a future rally. A chosen phase does not establish a reliable entry probability. Generated practice charts are not evidence of large traders' actual positions.",
    proTip: "Compare the labelled phases with observable price and volume. The framework interprets those observations; it does not prove institutional intent or guarantee that an accumulation phase will produce a rally.",
    difficulty: "Pro",
    readTime: "6 min",
    category: "Technical Analysis",
    keyPoints: [
      "Four phases: Accumulation, Markup, Distribution, Markdown",
      "A Spring is a framework label, not an established highest-probability entry",
      "Price and volume interpretation does not reveal institutional positions"
    ],
    studentPerspective: "Wyckoff supplies a vocabulary for price and volume interpretation, without proving institutional intent. Compare alternative phase labels and record examples that do not follow the proposed sequence.",
    relatedTerms: ["order-block", "whale-manipulation", "volume-profile"]
  },
  {
    slug: "market-maker",
    term: "Market Maker",
    definition: "A market maker posts bid and ask quotes under venue rules to facilitate trading. A quoted spread is not guaranteed profit, and obligations vary by market.",
    expertDefinition: "A market maker quotes prices at which it is prepared to buy and sell under applicable venue rules. The ask-minus-bid difference is a quoted spread, not a guaranteed realized profit. Quotes can change; fills, inventory price changes, hedging and operating costs affect results. Obligations and permitted conduct differ between markets. A decentralized automated market maker is a different mechanism that applies a pool pricing rule rather than the same dealer quoting arrangement. Do not infer that a displayed quote will fill an arbitrary quantity or that a market maker always earns money. TradeHQ does not reproduce order queues or dealer inventory.",
    proTip: "Compare quoted spreads, depth and actual trades. A wider spread can have several causes; it is not proof of a market maker's directional forecast.",
    difficulty: "Intermediate",
    readTime: "4 min",
    category: "Market Mechanics",
    keyPoints: [
      "Quote bid and ask prices under venue rules; liquidity is not guaranteed for every order",
      "A quoted spread is not guaranteed net profit",
      "AMMs on decentralized exchanges use algorithms instead of human market makers"
    ],
    studentPerspective: "Compare quoted bid and ask prices with actual executions. Spread changes can have multiple explanations and do not establish a participant’s intent or sophistication.",
    relatedTerms: ["limit-order-vs-market-order", "whale-manipulation", "slippage"]
  },
  {
    slug: "dark-pool",
    term: "Dark Pool",
    definition: "A non-displayed trading venue where orders generally do not appear in public pre-trade quotes. Not every off-exchange trade is a dark-pool trade.",
    expertDefinition: "A dark pool is a trading venue whose resting orders generally are not displayed in public pre-trade quotes. It differs from other off-exchange mechanisms such as broker internalisation, which may follow other rules. Non-displayed trading can reduce immediate information exposure, but fills still depend on liquidity, venue procedures and price conditions. Reporting rules vary by jurisdiction and instrument. A transaction marked 'off exchange' does not by itself prove it took place in a dark pool. For a study exercise, specify the reporting authority, market and period before comparing venue statistics. A large reported transaction confirms an execution, not which participant was optimistic or what price will do next. TradeHQ does not model the operation of private trading venues.",
    proTip: "Check the venue and reporting context of an off-exchange print. Every completed trade has both a buyer and seller, so a large print alone does not reveal a bullish institutional view.",
    difficulty: "Pro",
    readTime: "5 min",
    category: "Market Mechanics",
    keyPoints: [
      "Non-displayed venues differ from public exchanges; access and trade sizes depend on venue rules",
      "Current venue shares require a dated market-data source; no percentage is asserted here",
      "May change execution exposure but does not eliminate market impact"
    ],
    studentPerspective: "A reported off-exchange trade does not establish why a price moved or what the participants intended. Identify the venue, timestamp and reporting context before drawing conclusions.",
    relatedTerms: ["market-maker", "whale-manipulation", "volume-profile"]
  },
  {
    slug: "slippage",
    term: "Slippage",
    definition: "The difference between expected trade price and actual execution price. Occurs during high volatility or low liquidity. Can be positive or negative.",
    expertDefinition: "Slippage compares an actual execution price with a defined expected or reference price. The comparison requires a side, quantity and timestamp. Paying more than the reference on a purchase is adverse; paying less is favorable. A changing quote, limited available quantity or a delay can contribute to a difference, but a price series alone cannot isolate the cause. A limit price constrains eligible fills and may leave the order unfilled. It does not guarantee both execution and a particular outcome. TradeHQ fills supported market orders at a displayed practice input and does not model actual exchange liquidity.",
    proTip: "Compare the expected price with the weighted average fill and include fees separately. A limit order constrains its execution price but may remain unfilled and cannot remove every execution risk.",
    difficulty: "Novice",
    readTime: "3 min",
    category: "Trading Fundamentals",
    keyPoints: [
      "Difference between expected and actual execution price",
      "Worse during high volatility and low liquidity conditions",
      "Limit prices constrain eligible fills but do not ensure execution; market fills can differ from a quote"
    ],
    studentPerspective: "Compare expected and weighted-average fill prices, with fees stated separately. A limit price can constrain execution but may leave the order unfilled; neither order type removes every risk.",
    relatedTerms: ["limit-order-vs-market-order", "market-maker", "leverage-trading"]
  },
  {
    slug: "impermanent-loss",
    term: "Impermanent Loss",
    definition: "The opportunity cost of providing liquidity in a DEX pool compared to simply holding the assets. Occurs when token prices diverge from their ratio at deposit time.",
    expertDefinition: "For a fee-free, full-range constant-product pool initially balanced by value, compare the liquidity-provider position with holding the originally deposited assets. If their relative price changes by a factor r and arbitrage rebalances the pool, the relative value difference is 2×sqrt(r)/(1+r)−1 under these assumptions. At r=2 this is about −5.72%; at r=5 it is about −25.46%. This difference is a comparison with holding, not necessarily an absolute cash loss. Fees, incentives, concentrated ranges and token behavior change outcomes. Withdrawing does not create the earlier economic difference; a later price change can narrow or widen it. Smart-contract and custody risks are additional.",
    proTip: "State the pool model, relative price change and fee assumptions when comparing liquidity provision with holding. Stablecoin or correlated pairs still carry depegging, contract and liquidity risks.",
    difficulty: "Pro",
    readTime: "5 min",
    category: "DeFi",
    keyPoints: [
      "Value difference between LP position and simply holding the tokens",
      "Increases as the price ratio of paired tokens diverges from deposit ratio",
      "The value difference exists before withdrawal and can change with subsequent prices"
    ],
    studentPerspective: "Compare liquidity provision with holding the same initial assets under a stated pool model. Fees, incentives and price changes all matter, alongside contract and withdrawal risks.",
    relatedTerms: ["yield-farming", "slippage", "market-maker"]
  },
  {
    slug: "yield-farming",
    term: "Yield Farming",
    definition: "An informal term for seeking fees, interest or token incentives through DeFi protocols. Reward rates, token prices, withdrawal terms and contract risks affect the result.",
    expertDefinition: "Yield farming describes attempts to obtain fees, interest or token incentives through a DeFi arrangement. Liquidity provision, lending and a reward-token programme are different activities; their terms should not be treated as interchangeable. In the linked Uniswap v2 example, a liquidity provider owns a changing pool position and compares its value with holding the original tokens. Fee income and relative token-price changes both matter. An advertised annualised rate is a calculation under stated assumptions rather than a promise that the same rate persists or that a deposit gains value. Reward-token prices, contract failures, withdrawal restrictions and costs can change the outcome. Impermanent-loss arithmetic for a fee-free constant-product pool does not describe every protocol or concentrated range. Separate deposited quantities, rewards received, their valuation date and all costs in a hypothetical worksheet; more reward tokens can coincide with less total value. TradeHQ does not deposit funds into DeFi protocols or pay these rewards.",
    proTip: "Separate fees, token incentives and token-price changes in an example return. An advertised APY can change and does not account for every loss or smart-contract risk.",
    difficulty: "Pro",
    readTime: "5 min",
    category: "DeFi",
    keyPoints: [
      "Depositing crypto into protocols to earn fees, interest, or token rewards",
      "High APYs often unsustainable and offset by IL and token depreciation",
      "Smart contract risk means deposited funds can be lost to exploits"
    ],
    studentPerspective: "Yield farming combines several risks, including changing incentives, token prices, contract failures and withdrawal conditions. A displayed reward rate is not the same as a guaranteed net return.",
    relatedTerms: ["impermanent-loss", "slippage", "leverage-trading"]
  },
  {
    slug: "flash-crash",
    term: "Flash Crash",
    definition: "A very rapid price decline, sometimes followed by a partial or full recovery. Its causes and later path require event-specific evidence.",
    expertDefinition: "A flash crash describes a very rapid price decline, often with at least a partial rebound. The term is descriptive and does not establish one universal cause or a guaranteed recovery. Liquidity withdrawal, order interactions, outages and other mechanisms require event-specific evidence. A plotted candle cannot identify a responsible participant or prove an algorithm caused the move. During a disruption, an expected quote and an executable price can differ, and orders can be delayed or remain unfilled. This entry makes no historical point-loss or liquidation-total claim; use a dated official event report for such figures.",
    proTip: "Compare prices, depth and available execution records around the event. A cheap-looking quote may not be executable, and a sharp decline need not recover.",
    difficulty: "Intermediate",
    readTime: "4 min",
    category: "Market Mechanics",
    keyPoints: [
      "Very rapid price decline; the extent and timing of any recovery vary",
      "Liquidity withdrawal, order interactions or errors are possible explanations requiring event-specific evidence",
      "A plotted price path alone cannot identify the cause or guarantee a recovery"
    ],
    studentPerspective: "Use separately dated records to compare the price path and available liquidity. A sharp decline need not recover, and intended stops or limits do not guarantee execution.",
    relatedTerms: ["liquidation-cascade", "circuit-breaker", "slippage"]
  },
  {
    slug: "circuit-breaker",
    term: "Circuit Breaker",
    definition: "A rule-defined trading pause. US market-wide thresholds use S&P 500 declines of 7%, 13% and 20%, with time-of-day conditions; individual-security and other-market rules differ.",
    expertDefinition: "Circuit breakers are rule-defined trading pauses. In the US market-wide example described by NYSE, declines from the previous S&P 500 close trigger three levels: 7%, 13% and 20%. In a regular session, a Level 1 or Level 2 event before 3:25 p.m. Eastern leads to a fifteen-minute halt; those levels at or after that time do not halt trading. Level 3 ends trading for the day. Check the current exchange rules and special-session arrangements rather than applying this example to every venue. Individual-security Limit Up-Limit Down rules are separate from a market-wide halt: price bands and pauses depend on the applicable plan. Neither mechanism guarantees an exit price or prevents losses, and a reopening can occur at a different price. Other markets and asset types can have different controls. For a hypothetical comparison, distinguish a 7% S&P 500 decline early in a regular session from the same decline after 3:25 p.m., then compare a Level 3 event. These are rule-reading exercises; TradeHQ does not execute exchange orders or reproduce every halt and reopening condition.",
    proTip: "Check the current exchange rules and time-of-day conditions before analysing a halt. The halt mechanism does not predict the direction of trading after reopening.",
    difficulty: "Intermediate",
    readTime: "4 min",
    category: "Market Mechanics",
    keyPoints: [
      "US market-wide halts at S&P 500 declines of 7%, 13%, and 20%",
      "Individual stock halts (LULD) prevent trades outside price bands",
      "Venue-specific crypto trading controls vary; do not assume US equity halt rules apply"
    ],
    studentPerspective: "Read the current venue rules and distinguish a market-wide halt from an individual-security pause. A halt does not prevent every loss or establish a post-reopening opportunity.",
    sources: [{ href: "https://www.nyse.com/network/article/nyse-increases-resiliancy-during-extreme-volatility", label: "NYSE — market-wide circuit breakers and LULD" }, { href: "https://www.luldplan.com/", label: "US Limit Up-Limit Down plan" }],
    relatedTerms: ["flash-crash", "liquidation-cascade", "stop-loss-hunting"]
  },
  {
    slug: "pump-and-dump",
    term: "Pump and Dump",
    definition: "A fraud scheme where promoters artificially inflate an asset's price through misleading hype, then sell their holdings at the peak, crashing the price.",
    expertDefinition: "A pump and dump is a form of securities fraud where individuals or groups artificially inflate the price of an asset through coordinated buying and misleading promotional activities (the 'pump'), then sell their pre-accumulated holdings at the elevated price (the 'dump'), causing the price to crash and leaving other investors with significant losses. The scheme is illegal in regulated securities markets but remains widespread in less regulated spaces, particularly cryptocurrency and penny stock markets. The modern pump and dump typically follows a predictable lifecycle. Phase 1 (Accumulation): the operators quietly accumulate a large position in a low-market-cap, illiquid asset at low prices. Phase 2 (Promotion): coordinated promotion begins across social media (Telegram groups, Twitter, TikTok, YouTube), using claims of insider knowledge, partnership announcements, revolutionary technology, or celebrity endorsements to generate excitement and FOMO. Phase 3 (Pump): as retail buyers flood in, the price rises sharply, and the operators may continue buying to maintain momentum and attract more participants. Phase 4 (Dump): the operators sell their accumulated holdings into the rising demand. Phase 5 (Crash): once operator selling is complete and the promotion stops, the price collapses as remaining holders try to sell and new buying evaporates. In cryptocurrency, pump and dump schemes are particularly prevalent due to the ease of creating new tokens (anyone can deploy an ERC-20 token on Ethereum in minutes), the abundance of low-market-cap assets with thin liquidity, and regulatory gaps. 'Rug pulls' — where developers abandon a project and drain its liquidity pool — are a DeFi-specific variant of the pump and dump. Detecting pump and dump schemes involves looking for warning signs: sudden unexplained price spikes in previously dormant assets, coordinated social media promotion with countdown timers ('BUY NOW before it moons!'), anonymous team members, lack of verifiable technology or product, and paid celebrity endorsements or influencer promotions.",
    proTip: "Check claims against primary disclosures and consider incentives behind a promotion. A social-media mention alone does not prove fraud, while coordinated misleading promotion warrants caution.",
    difficulty: "Novice",
    readTime: "4 min",
    category: "Market Mechanics",
    keyPoints: [
      "Coordinated price inflation followed by insider selling at the peak",
      "Illegal in regulated markets, widespread in crypto and penny stocks",
      "Red flags: sudden hype, anonymous teams, paid promotions, countdown timers"
    ],
    studentPerspective: "Check claims against primary disclosures and consider incentives behind a promotion. A social-media mention alone does not prove fraud, while coordinated misleading promotion warrants caution.",
    relatedTerms: ["whale-manipulation", "fomo", "fud"]
  },
  {
    slug: "paper-trading",
    term: "Paper Trading",
    definition: "Simulated trading with virtual money to study order mechanics and compare ideas. TradeHQ provides $100K virtual cash; practice outcomes do not predict real returns.",
    expertDefinition: "Paper trading records hypothetical positions without exchanging securities or money. Simulators differ in source prices, fills and available orders. TradeHQ provides virtual funds and simulated market orders; it does not reproduce exchange queue priority, real slippage, limit-order execution, borrowing or brokerage settlement. Some quotes use dated provider observations, while other practice values or chart histories can be generated. For arithmetic practice, ten virtual shares purchased at $20 and later marked at $18 lose $20 in quoted value before modeled costs. Record both observation times and prices rather than treating that example as a measured investment result. Real account restrictions, taxes, liquidity and the consequences of losing actual savings are outside the simulation. No number of successful virtual transactions proves future returns or readiness for real investment.",
    proTip: "Use a journal to record assumptions, costs and decisions in a simulation. Practice can reveal mistakes, but no minimum duration or trade count establishes readiness for real-money trading.",
    difficulty: "Novice",
    readTime: "3 min",
    category: "Trading Fundamentals",
    keyPoints: [
      "Simulated trades use virtual money; real trading can lose capital",
      "Virtual practice illustrates mechanics but does not establish readiness for real capital",
      "Limitation: doesn't replicate the emotional pressure of real trading"
    ],
    studentPerspective: "Use virtual cash to study order mechanics and record assumptions. The experience differs from real liquidity, brokerage obligations and the consequences of losing actual savings.",
    relatedTerms: ["day-trading", "swing-trading", "risk-reward-ratio"]
  },
  {
    slug: "risk-reward-ratio",
    term: "Risk-Reward Ratio",
    definition: "The risk-reward ratio compares a trade's planned loss with its planned gain. A 1:3 ratio means a planned $1 loss for a potential $3 gain; it does not guarantee those fills or establish a universal professional minimum.",
    expertDefinition: "The risk-reward ratio (R:R or RRR) is a measurement that compares the potential loss on a trade (from entry to stop loss) against the potential gain (from entry to take profit target). Expressed as a ratio like 1:2 or 1:3, it quantifies the trade's payoff structure before entry, enabling traders to make mathematically informed decisions about which trades are worth taking. A 1:2 risk-reward ratio means that for every dollar risked, two dollars of profit are targeted. A 1:3 ratio means three dollars of potential profit for each dollar of risk. A planned ratio describes selected entry and exit assumptions. A break-even calculation requires realised payoff sizes and costs; the planned ratio alone does not determine profitability. For fixed realised payoffs before costs, a 1:1 ratio breaks even at 50% wins; profitability requires more than 50%. Planned exits do not ensure those realised payoffs. With fixed realized +2R/−1R before costs, the exact break-even rate is one third; profitability requires a higher rate. At 1:3 with fixed realised gains and losses, a win rate above 25% is required before costs; exactly 25% breaks even. Under stated fixed-payoff assumptions, expected value combines the frequency and size of gains and losses. Costs and dependence also matter, and an estimate from one historical sample does not establish a future positive expectancy. A chosen planned payoff ratio is not a universal fund rule or evidence of positive realised expectancy. The calculation is straightforward: divide the distance to your take-profit target by the distance to your stop loss. If your stop loss is $5 below entry and your target is $15 above entry, the R:R is 1:3.",
    proTip: "Compare planned risk and reward with realised outcomes and costs. A positive average in one sample can be luck or overfitting; a ratio alone does not prove an edge.",
    difficulty: "Novice",
    readTime: "3 min",
    category: "Trading Fundamentals",
    keyPoints: [
      "Compares potential loss (stop loss) to potential gain (take profit)",
      "With fixed realized +3R/−1R before costs, 25% wins breaks even; profitability requires more",
      "A planned ratio is not a universal professional minimum or evidence of positive expectancy"
    ],
    studentPerspective: "Calculate the planned ratio, then compare it with realised gains, losses and costs. A favorable planned ratio is not proof that the outcomes will match it.",
    relatedTerms: ["stop-loss-hunting", "leverage-trading", "drawdown"]
  },
  {
    slug: "drawdown",
    term: "Drawdown",
    definition: "The decline from a portfolio's peak value to its lowest point before a new peak. Maximum drawdown measures the largest observed peak-to-trough decline in a specified sample. Critical for risk assessment.",
    expertDefinition: "Drawdown measures a decline from an observed peak to a later lower value within a defined series. Maximum drawdown is the largest such peak-to-trough decline in the chosen sample, not the worst loss that could occur in the future. State whether observations include fees, cash flows and mark-to-market positions; an end-of-day sample can miss an intraday trough. A drop from $100 to $80 is 20%, but recovering from $80 to $100 requires 25%. Deposits can make raw portfolio-value comparisons misleading. The arithmetic does not diagnose stress or predict whether someone would tolerate a real loss.",
    proTip: "Calculate the decline from the relevant peak and state the observation period. Historical maximum drawdown is not an upper bound on future loss, and no universal percentage is a suitable limit for everyone.",
    difficulty: "Intermediate",
    readTime: "4 min",
    category: "Trading Fundamentals",
    keyPoints: [
      "Observed peak-to-trough decline under the specified valuation and sampling method",
      "50% drawdown requires 100% gain to recover — math is asymmetric",
      "Calmar Ratio (return/drawdown) measures risk-adjusted performance"
    ],
    studentPerspective: "Calculate the decline from the relevant peak and state the observation period. Historical maximum drawdown is not an upper bound on future loss, and no universal percentage is a suitable limit for everyone.",
    relatedTerms: ["risk-reward-ratio", "leverage-trading", "paper-trading"]
  },
  {
    slug: "backtesting",
    term: "Backtesting",
    definition: "Testing a strategy against historical data to evaluate its hypothetical performance. Essential for validation but subject to curve-fitting and survivorship bias.",
    expertDefinition: "Backtesting applies predefined rules to historical observations under stated execution and accounting assumptions. Its results describe that selected dataset; they are not executed returns or proof of a future advantage. Look-ahead bias uses information unavailable at the decision time, survivorship bias omits failed or unavailable instruments, and repeated parameter searches can overfit the same history. Separate rule development from held-out evaluation, document the searches performed and account for costs and missing observations. There is no universal number of years or trades that validates a strategy. Generated simulator candles are not historical market observations.",
    proTip: "Separate rule development from evaluation on unseen data and include realistic costs. Out-of-sample results can expose overfitting, but they do not certify future performance.",
    difficulty: "Intermediate",
    readTime: "4 min",
    category: "Trading Fundamentals",
    keyPoints: [
      "Simulates strategy performance using historical price data",
      "Overfitting can make selected historical results misleading",
      "Out-of-sample testing can challenge overfitting but cannot establish a guaranteed future edge"
    ],
    studentPerspective: "Keep rule development separate from evaluation on unseen historical data. Record costs and failed cases. Neither backtesting nor forward simulation certifies future investment performance.",
    relatedTerms: ["paper-trading", "risk-reward-ratio", "drawdown"]
  },
  {
    slug: "correlation-trading",
    term: "Correlation Trading",
    definition: "Studying sampled relationships between asset returns. Correlations vary with the interval and period; a divergence need not reverse or create a profitable trade.",
    expertDefinition: "Correlation summarizes a linear relationship in a chosen sample; it does not establish causation or a permanent link between assets. For market comparisons, state the return interval, matching dates and data treatment. Correlation can change across windows and can be undefined when a series has no variation. A pairs-trading example hypothesizes a relationship between positions, often long and short, but a widening spread need not revert. Costs, borrowing, hedge mismatch and market exposure can produce losses. Any numeric example must be labelled hypothetical unless its dataset is supplied. TradeHQ cannot open the short leg of a pairs trade.",
    proTip: "State the return frequency, observation window and dataset used to calculate correlation. Correlations can change, and a high or low value does not define a universal portfolio allocation.",
    difficulty: "Pro",
    readTime: "5 min",
    category: "Trading Fundamentals",
    keyPoints: [
      "Measures how assets move relative to each other (-1 to +1 scale)",
      "Pairs trading assumes a relationship that can change; divergence can continue and cause losses",
      "Correlations can change during stress; neither universal convergence nor equal losses is implied"
    ],
    studentPerspective: "Calculate correlations with matching dates, return intervals and data sources. Relationships can change; a correlation estimate alone does not determine an appropriate portfolio.",
    relatedTerms: ["risk-reward-ratio", "drawdown", "support-and-resistance"]
  }
];
