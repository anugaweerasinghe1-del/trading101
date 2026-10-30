/** Exact-text editorial corrections for existing published course records.
 * Applied to display copies only, identically on server and client.
 * A later author edit that changes the expected text is preserved.
 */
const corrections: {slug: string; path: (string | number)[]; expected: unknown; replacement: unknown}[] = [
  {
    slug: "cryptocurrency-price-feeds-and-valuation",
    path: ["outcomes", 1],
    expected: "Identify and filter out price outliers using statistical methods",
    replacement: "Explain why outlier filtering requires the provider’s methodology and observation timestamps",
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      0,
      "body",
      1
    ],
    "expected": "Cryptocurrency price feeds originate within individual digital asset exchanges, where buyers and sellers place orders in real-time. Each trade execution generates a raw transaction record known as a ticker, which indicates the execution price and trade volume. Because exchanges operate independently without a centralized clearinghouse, a single asset like Bitcoin can trade at slightly different prices across different platforms simultaneously. These micro-differences reflect local liquidity, trading activity, and regional demand, establishing the foundational raw data that aggregators collect to determine global average prices.",
    "replacement": "A venue can publish individual trades and ticker summaries. A ticker may contain a last trade, bid, ask or rolling volume rather than one universally defined transaction record. Independent venues have different order books, liquidity, quote currencies and timestamps. Aggregation creates a reference under the provider’s stated method, not a price executable for any quantity on every exchange. Record the asset identifier and quote currency before comparing prices; matching symbols alone cannot establish that two feeds describe the same instrument."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      0,
      "body",
      4
    ],
    "expected": "To synthesize divergent exchange prices into a single representative market price, data providers utilize the Volume-Weighted Average Price, or VWAP. This mathematical approach ensures that exchanges processing massive trading volumes have a proportionally larger influence on the final calculated price than small, inactive platforms. If a major exchange handles eighty percent of a coin's volume at a specific price, the global average must tilt heavily toward that value. Without volume weighting, a tiny transaction on an illiquid platform could distort the perceived market value.",
    "replacement": "In the hypothetical two-venue worksheet, $10 times 1,000 units plus $11 times 100 units gives $11,100 of price-times-volume. Dividing by 1,100 units gives approximately $10.0909. This assumes comparable unit volumes over matching windows and ignores spread and fees. It illustrates one volume-weighted average, not the exact current methodology of every data provider or a guaranteed executable price."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      0,
      "body",
      8
    ],
    "expected": "Aggregators use statistical methods such as the Median Absolute Deviation, or MAD, to establish mathematical boundaries for price exclusion. For assets with multiple trading pairs, any exchange price falling outside these calculated limits is discarded, preventing isolated anomalies from affecting the global index. Additionally, if an exchange fails to update its ticker data for several hours, its volume is blacklisted. This proactive filtering ensures that the final aggregated price reflects actual, active market conditions rather than outdated information or technical system errors.",
    "replacement": "A provider may filter stale, anomalous or unsuitable observations under its published methodology. CoinGecko’s linked methodology describes its aggregation and outlier treatment; read its current rules rather than treating this exercise as a complete implementation. A genuine large move is not automatically an error, and a successful filter cannot guarantee that the remaining reference is fresh or executable. Record the provider observation timestamp, excluded venues and comparison window when those details are available."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      0,
      "quiz",
      2,
      "question"
    ],
    "expected": "What statistical tool do aggregators like CoinGecko use to detect and filter out price outliers?",
    "replacement": "What should you consult before assuming how a provider filters outliers?"
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      0,
      "quiz",
      2,
      "options"
    ],
    "expected": [
      "Simple Moving Average crossovers",
      "Median Absolute Deviation (MAD)",
      "Linear Regression Analysis",
      "Relative Strength Index thresholds"
    ],
    "replacement": [
      "An unrelated moving average",
      "The provider’s current published methodology",
      "Only the token symbol",
      "A guaranteed-price claim"
    ]
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      0,
      "quiz",
      2,
      "explanation"
    ],
    "expected": "Aggregators use Median Absolute Deviation to establish upper and lower bounds for identifying and discarding anomalous price feeds.",
    "replacement": "Filtering is provider-specific. The arithmetic worksheet does not implement every provider’s live aggregation rules."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      1,
      "body",
      1
    ],
    "expected": "Once an aggregator calculates a global volume-weighted price, that data must be distributed to external platforms and paper-trading applications. This transmission relies on Application Programming Interfaces, commonly known as APIs, which serve as digital pipelines. However, data delivery is not instantaneous; it is subject to latency, rate limiting, and caching intervals. Free or basic tier API connections often update their data once every few minutes, creating a distinct delay between the actual live exchange price and the price displayed inside your trading interface.",
    "replacement": "Delivery through an API can involve timestamps, caching, rate limits and service interruptions. Update schedules differ by endpoint and plan; this lesson does not assert a universal delay for free services. Distinguish the provider observation time from the time the page fetched it. A successful HTTP response need not contain a fresh observation, and a failed request supplies no new market price. Use the actual status and timestamps before interpreting a practice valuation."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      1,
      "body",
      7
    ],
    "expected": "Slippage is the difference between the expected price of a trade and the actual price at which the trade is executed. In real-world markets, slippage occurs because order books shift while your transaction is being processed or because your order size exceeds available liquidity. In a paper-trading environment, some simulators may model slippage with a hypothetical adjustment; TradeHQ's snapshot fills should not be assumed to include this adjustment. This manual adjustment ensures that virtual traders do not receive unrealistically perfect execution fills that would be impossible in real markets.",
    "replacement": "A separate worksheet can apply hypothetical slippage assumptions to compare outcomes. That does not reproduce a venue’s actual liquidity or make a simulator fill realistic by itself. TradeHQ fills supported spot orders at its displayed practice input and charges a 0.1% virtual transaction fee; it does not model order-book priority, partial fills or a calibrated slippage process. Keep a delayed observation, an execution assumption and an actual historical exchange fill distinct."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      1,
      "quiz",
      2,
      "question"
    ],
    "expected": "Why do paper-trading simulators incorporate simulated slippage into orders?",
    "replacement": "What is a limitation of adding a hypothetical slippage adjustment to a worksheet?"
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      1,
      "quiz",
      2,
      "options"
    ],
    "expected": [
      "To make the platform run faster and consume less server memory.",
      "To replicate the execution friction and liquidity constraints of real markets.",
      "To generate virtual commission fees for the simulator provider.",
      "To prevent users from holding assets for more than twenty-four hours."
    ],
    "replacement": [
      "It guarantees the actual venue fill",
      "It compares an assumption but does not reproduce actual order-book execution",
      "It creates real commission revenue",
      "It removes the need for timestamps"
    ]
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      1,
      "quiz",
      2,
      "explanation"
    ],
    "expected": "Simulating slippage ensures that virtual traders experience realistic execution pricing rather than perfect, unattainable fills.",
    "replacement": "An invented adjustment is a scenario assumption. TradeHQ does not implement a calibrated exchange slippage model."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      2,
      "body",
      1
    ],
    "expected": "A disciplined approach to paper trading requires establishing clear portfolio weights for each asset class. Portfolio weighting is the percentage of your total capital allocated to a specific security or cryptocurrency. For example, in a one-hundred-thousand-dollar virtual portfolio, you might allocate forty percent to Ethereum, forty percent to Bitcoin, and keep twenty percent in virtual cash. These target allocations help control concentration risk, which is the vulnerability of your entire portfolio to the sharp decline of a single asset class.",
    "replacement": "Portfolio weights divide each marked position value, including cash, by total marked portfolio value. A hypothetical 40% ETH, 40% BTC and 20% cash allocation is a classroom input, not a recommendation. Two crypto holdings can share market and custody exposures; a count of assets does not establish diversification or suitability. Fees, quote age and any deposits or withdrawals affect the comparison. Record the weights and the valuation time before deciding what question the exercise is testing."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      2,
      "body",
      5
    ],
    "expected": "Let us examine how price delays affect this rebalancing process. If you decide to sell five thousand dollars' worth of a token to raise cash, the transaction executes at the current API snapshot price. If the feed is delayed, the cash generated might be slightly higher or lower than your real-time calculations anticipated. Maintaining a small cash cushion prevents your account from falling into negative balances, ensuring that subsequent buy orders execute smoothly without violating the platform's spot-only trading rules.",
    "replacement": "If a worksheet sells an asset to raise virtual cash, the resulting cash depends on quantity, recorded fill and the 0.1% sale fee. Buy orders also need enough cash for their fee. A cash buffer can help fund an adjustment but cannot guarantee that any later order is affordable. Quotes can change between orders, and a dated price input is different from an executable exchange quote. TradeHQ does not borrow money or open short positions to cover an unaffordable purchase."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      2,
      "body",
      8
    ],
    "expected": "Traders must balance the trade-off between cash drag and liquidity. In a paper-trading system, having virtual cash on hand is essential for executing timely rebalancing orders without being forced to liquidate core holdings at disadvantageous prices. Managing cash drag requires analyzing macroeconomic indicators and market trends. For instance, when central bank interest rates are high, holding cash equivalents is more attractive than during periods of aggressive monetary expansion, highlighting the intersection between broad policy and individual portfolio design.",
    "replacement": "Compare cash with a specified invested alternative over the same dates. Non-interest-bearing virtual cash can reduce gains when that alternative rises and reduce losses when it falls. It is not always unproductive relative to a risky holding, and real cash products can have interest, inflation, credit and liquidity characteristics absent here. No central-bank rate or market trend determines a universal appropriate cash percentage; use both rising and falling hypothetical paths before interpreting the comparison."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      2,
      "body",
      11
    ],
    "expected": "To restore your target fifty-fifty allocation, you must calculate the required adjustment. The total portfolio value is one hundred thousand dollars, so your target for each asset is fifty thousand dollars. Since your Bitcoin is valued at sixty thousand dollars, you must sell exactly ten thousand dollars of Bitcoin. This sale increases your virtual cash balance from forty thousand dollars to fifty thousand dollars. Performing this transaction successfully aligns your portfolio with your target risk profile, demonstrating the mechanics of rebalancing.",
    "replacement": "Before costs, selling $10,000 from the $60,000 Bitcoin holding would leave $50,000 Bitcoin and $50,000 cash. With TradeHQ’s 0.1% sale fee, the sale instead nets $9,990: Bitcoin becomes $50,000, cash $49,990 and total value $99,990. The weights are approximately 50.005% and 49.995%, so the naive order does not restore exactly 50/50 after fees. Quote changes and quantity rounding can create further differences. This is a hypothetical accounting exercise, not a required allocation."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "tagline"
    ],
    "expected": "Master portfolio construction, position sizing, and rebalancing techniques using $100,000 in virtual cash.",
    "replacement": "Study hypothetical portfolio weights, concentration and fee-aware rebalancing with virtual cash."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "progression"
    ],
    "expected": "This course prepares you to apply risk management principles to advanced trading and simulation scenarios.",
    "replacement": "Calculate position values first, compare portfolio drift next, then examine how fees and changing quotes affect a hypothetical rebalance. Target weights are study assumptions, not recommendations or guarantees of a particular risk profile."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      0,
      "body",
      1
    ],
    "expected": "Position sizing is the cornerstone of risk management when trading spot assets like equities and cryptocurrencies. On TradeHQ, you begin with a virtual cash balance of $100,000, which serves as your portfolio's base. Instead of arbitrarily deciding how many shares or tokens to buy, professional practices demand that you assign a specific target percentage weight to each asset. By defining these target weights beforehand, you establish a systematic framework that prevents emotional decision-making and helps limit exposure to any one holding, while leaving the portfolio vulnerable to correlated declines and other risks.",
    "replacement": "Position sizing translates a stated classroom exposure into dollars and units. A target percentage is a worksheet assumption rather than a professional requirement or a guarantee against emotional decisions. TradeHQ starts a fresh account with $100,000 virtual cash. For an existing account, use its current marked holdings plus available cash, rather than assuming its value is still the starting balance. Different assets can share risks even when their names differ, and a chosen weight does not make a holding suitable for real money."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      0,
      "body",
      7
    ],
    "expected": "While position sizing is powerful, spot paper trading models have distinct limitations that you must understand. TradeHQ utilizes periodic snapshots for asset prices, meaning the values you see might not reflect live, split-second exchange rates. Furthermore, without access to advanced tools like short selling, leverage, or options, you cannot hedge your downside risk directly within the platform. You must rely entirely on asset diversification and cash buffers to shield your virtual portfolio from sudden and severe adverse market movements.",
    "replacement": "The spot simulator cannot execute derivatives, short sales or leverage. A worksheet can compare lower hypothetical exposure, cash and several assets, but none guarantees protection from adverse market moves. The order engine does not reproduce exchange liquidity or hedging instruments. Prices may be provider-backed, cached, delayed, unavailable or fixed simulator inputs, with chart provenance labelled separately. These limits matter when interpreting an apparent success; simulated results cannot establish that a real hedge or allocation will work."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      0,
      "body",
      11
    ],
    "expected": "To resolve this exercise, first calculate the target dollar allocation by multiplying $100,000 by twenty-five percent, which equals twenty-five thousand dollars. Next, divide this twenty-five thousand dollar target by the share price of two hundred and fifty dollars. This division yields exactly one hundred shares. By executing a market buy order for one hundred shares, you establish your target weight perfectly. If the ETF price rises or falls thereafter, the weight will shift, which we will address in the next lesson.",
    "replacement": "Ignoring costs, $100,000 times 25% gives $25,000, and $25,000 divided by $250 gives 100 shares. On TradeHQ, buying those shares also incurs a 0.1% fee of $25. Cash falls to $74,975, while the position is marked at $25,000: total marked value is $99,975 and the holding is about 25.006% of that total. Thus the simple division sets a pre-fee notional amount, not a perfect post-fee portfolio weight. Recheck affordability, quantity rounding and the actual recorded fill."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      0,
      "quiz",
      1,
      "question"
    ],
    "expected": "How do you calculate the number of asset units to buy on TradeHQ to meet a target dollar allocation?",
    "replacement": "Before fees and rounding, how do you calculate units for a stated dollar notional?"
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      0,
      "quiz",
      1,
      "explanation"
    ],
    "expected": "You divide the target dollar allocation by the current snapshot price of the asset to determine the precise number of units to buy.",
    "replacement": "Divide the stated notional by the assumed price. Check fees and available cash separately; a fee changes total portfolio value and therefore post-trade weights."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      1,
      "body",
      1
    ],
    "expected": "Concentration risk occurs when a substantial portion of your portfolio is allocated to a single asset or sector. In spot trading, high concentration leaves your capital vulnerable to idiosyncratic shocks, which are negative events affecting a specific company or project. If you allocate eighty percent of your $100,000 virtual balance to one cryptocurrency, any adverse regulatory news or technical failure will devastate your portfolio. Diversification across uncorrelated spot assets helps distribute this risk, potentially reducing the impact of individual failures without guaranteeing protection against losses.",
    "replacement": "Concentration describes exposure to a holding, sector or shared risk factor. If 80% of a hypothetical portfolio is in one token and it falls 50% with all other values unchanged, the portfolio falls 40% before costs. An adverse announcement need not produce that particular price move. Several holdings can remain exposed to the same shock, so diversification is a question about exposures as well as asset count. This example illustrates sensitivity rather than prescribing a maximum weight."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      1,
      "body",
      2
    ],
    "expected": "To monitor this vulnerability, traders establish strict exposure limits, such as restricting any single spot holding to a maximum of ten percent of the total portfolio. On TradeHQ, you can track these exposures by monitoring your percentage weights daily. If an asset exceeds your maximum threshold, it creates an unacceptable concentration risk. This rule-based approach forces you to look objectively at your allocations, preventing the natural human tendency to over-allocate to a single winning asset during periods of extreme market optimism.",
    "replacement": "A learner can choose an exposure limit to test as an explicit classroom assumption. Ten percent in one holding is one possible input, not a universal professional standard or a boundary between acceptable and unacceptable investments. Compare more than one threshold, including how turnover, costs and shared exposures change. A journal can record why a hypothetical limit was chosen and when it was reviewed; the rule does not prevent bias or prove positive investment outcomes."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      1,
      "body",
      5
    ],
    "expected": "This drift silently alters your risk profile without any active trading on your part. A portfolio that was initially conservative can gradually become highly aggressive and risky simply because one volatile asset grew unchecked. To manage drift, a trader can set a hypothetical review threshold, such as five percentage points from a target; no universal threshold suits every portfolio. When an asset's actual weight drifts beyond this threshold from its target, it triggers an alert indicating that the portfolio requires rebalancing to align back with the original risk-management strategy.",
    "replacement": "A price change alters marked weights even without an order. A hypothetical drift threshold can be used as a manual review condition, but a breach is not automatically an instruction to trade. Consider the original assumptions, current exposures and transaction costs. TradeHQ does not provide the automatic allocation alert implied by the earlier wording; use a separate calculation and record any decision. No universal percentage threshold fits every portfolio or ensures a particular risk profile."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      1,
      "body",
      8
    ],
    "expected": "Your new total portfolio value is now one hundred and twenty-five thousand dollars. To find the new weights, divide each position value by this new total. The equity ETF now represents forty percent of your portfolio, while the cryptocurrency has drifted up to sixty percent. Your portfolio is now significantly more exposed to cryptocurrency volatility than your original fifty-fifty strategy intended. This clear example demonstrates how market movements alter your risk exposure, requiring systematic action to correct.",
    "replacement": "At the hypothetical end date, $50,000 plus $75,000 gives $125,000. The weights are 40% and 60%. These are invented marked balances that exclude transaction costs and cash flows, not a return forecast. A higher token weight changes sensitivity to that token; the calculation alone does not require a trade or establish the safest allocation. A rebalancing comparison must add fees and alternative outcomes before drawing even a classroom conclusion."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      1,
      "quiz",
      2,
      "explanation"
    ],
    "expected": "A drift from 15% to 27% is a major deviation, indicating that you should plan to reallocate capital to bring it back to the 15% target.",
    "replacement": "The change is 12 percentage points. Compare it with an explicitly chosen worksheet threshold and costs; a deviation alone does not establish a universally required transaction."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      2,
      "summary"
    ],
    "expected": "Master the mechanics of buying and selling spot assets to realign your portfolio with target allocations.",
    "replacement": "Calculate hypothetical trades toward target weights, including transaction fees, affordability and changed quotes."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      2,
      "body",
      1
    ],
    "expected": "Rebalancing is the process of buying and selling assets to return your portfolio to its original target weights. In a spot paper trading account, this process is executed entirely through market buy and sell orders using your available virtual cash. To reduce an overweight position, you sell a portion of that asset, which generates virtual cash. You then use this cash to buy more of the underweight assets. This systematic process forces you to sell high and buy low, matching disciplined investing principles.",
    "replacement": "Rebalancing adjusts holdings toward a stated target allocation. Reducing an overweight holding and increasing an underweight one refers to portfolio weights, not whether either asset is overvalued or undervalued. Selling a winner need not mean its price is high in an economic sense, and the asset bought can later fall. Targets are classroom assumptions, not recommendations. Compare no-trade and rebalance cases over matching dates, with fees included, before interpreting the exercise."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      2,
      "body",
      2
    ],
    "expected": "On TradeHQ, rebalancing does not require complex derivatives or margin trading. Because the platform only supports spot instruments and market orders, every adjustment is straightforward. However, you must carefully calculate the transaction sizes to avoid over-correcting. Since prices are periodic snapshots, you should execute your trades efficiently to minimize the impact of price updates during your rebalancing process. Having a clear mathematical plan beforehand ensures your execution is swift, precise, and highly effective.",
    "replacement": "TradeHQ supports market purchases and sales of held spot units, using available virtual cash. Selling incurs a 0.1% practice fee and buying needs cash for its own 0.1% fee. Prices can change between orders, so a calculated notional and actual recorded result can differ. List the assumed quote, units, fee and available balance for each step. A plan does not guarantee a fill, a perfect target weight or an improvement in returns; actual markets add liquidity and execution constraints not modelled here."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      2,
      "body",
      5
    ],
    "expected": "If your virtual cash balance falls too low, you must generate cash by selling overperforming assets. Conversely, if your cash balance grows too large due to asset sales, your portfolio suffers from drag, meaning your returns are diluted by the unproductive cash. Properly managing this balance on TradeHQ means treating cash as a dynamic asset class that requires regular adjustments, just like your stock, cryptocurrency, or exchange-traded fund holdings.",
    "replacement": "Cash can fund purchases without an immediate sale, subject to affordability and fees. A 5% cash allocation is only a hypothetical input. Compare it with another allocation under the same end dates and both rising and falling asset prices. Cash can reduce gains when the comparison asset rises and reduce losses when it falls; real cash products can also earn interest, unlike TradeHQ virtual cash. No percentage guarantees enough funds for every intended transaction."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      2,
      "body",
      8
    ],
    "expected": "Your target values are forty thousand dollars for stocks, forty thousand dollars for bond ETFs, and twenty thousand dollars for cash. To realign the portfolio, you must sell ten thousand dollars worth of stocks, reducing that position to forty thousand. This sale increases your virtual cash temporarily. Next, you use that cash to purchase ten thousand dollars worth of bond ETFs, raising that position to forty thousand. This execution successfully restores your target forty-forty-twenty distribution perfectly.",
    "replacement": "Ignoring fees, selling $10,000 of stock and buying $10,000 of bond ETFs would restore $40,000, $40,000 and $20,000 cash. With TradeHQ’s 0.1% fee, the sale nets $9,990 and the purchase costs $10,010. Final cash is $19,980, holdings total $80,000 and portfolio value is $99,980. The weights are approximately 40.008%, 40.008% and 19.984%, rather than exactly 40/40/20. This example assumes unchanged quotes and ignores quantity rounding."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      2,
      "body",
      11
    ],
    "expected": "To solve this challenge, first identify the target dollar values: sixty thousand dollars for equities and forty thousand dollars for virtual cash. Your current equity position is seventy thousand dollars, which is ten thousand dollars over your target. Therefore, you must place a market sell order for ten thousand dollars of your equity holding. This trade reduces your equities to sixty thousand dollars and increases your virtual cash to forty thousand, achieving your target allocation perfectly.",
    "replacement": "Before fees, selling $10,000 reduces the $70,000 equity holding to $60,000. With the 0.1% sale fee, cash rises from $30,000 to $39,990 and total marked value becomes $99,990. Equity is about 60.006% and cash 39.994%, not exactly 60/40. Calculate the fee-aware target again if exact fractions are the question, while acknowledging changed quotes and unit rounding. An approximate rebalance may be sufficient for a stated worksheet tolerance; no real-money action is prescribed."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      2,
      "quiz",
      1,
      "options",
      1
    ],
    "expected": "It allows you to buy undervalued assets immediately without forced liquidation of other holdings",
    "replacement": "It can fund affordable purchases of underweight assets without an immediate sale"
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      2,
      "quiz",
      1,
      "explanation"
    ],
    "expected": "A cash buffer provides immediate liquidity, allowing you to purchase underweight assets without being forced to sell other positions first.",
    "replacement": "Underweight is a comparison with a chosen target, not evidence of undervaluation. Cash can fund purchases only within the available balance including fees."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      2,
      "quiz",
      2,
      "question"
    ],
    "expected": "What is 'cash drag' in portfolio management?",
    "replacement": "Relative to a rising invested comparison, what can non-interest-bearing virtual cash do?"
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      2,
      "quiz",
      2,
      "options",
      1
    ],
    "expected": "The reduction in portfolio performance when too much non-earning cash is held relative to active assets",
    "replacement": "Reduce gains; it can instead reduce losses when the comparison falls"
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      2,
      "quiz",
      2,
      "explanation"
    ],
    "expected": "Cash drag occurs when holding an excessive amount of cash dilutes the overall returns of your portfolio because cash is less productive than active assets.",
    "replacement": "The comparison depends on the path and alternative. Cash is not always detrimental and real cash products can have interest and other risks."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      0,
      "body",
      4
    ],
    "expected": "To synthesize divergent exchange prices into a single representative market price, data providers utilize the Volume-Weighted Average Price, or VWAP. This mathematical approach ensures that exchanges processing massive trading volumes have a proportionally larger influence on the final calculated price than small, inactive platforms. If a major exchange handles eighty percent of a coin's volume at a specific price, the global average must tilt heavily toward that value. Without volume weighting, a tiny transaction on an illiquid platform could distort the perceived market value.",
    "replacement": "A volume-weighted average multiplies each comparable price by its matched unit volume, adds the products and divides by total units. Larger weights contribute more to that arithmetic average. Providers may use additional filtering, pair conversions and aggregation methods; this lesson does not claim a single method applies universally. The periods, units and quote currencies must match for the classroom calculation to be interpretable. A reference average is not necessarily available as an actual trade price."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      0,
      "body",
      7
    ],
    "expected": "Data aggregators like CoinGecko must clean incoming ticker streams to prevent technical anomalies or extreme volatility from skewing their benchmark calculations. If an exchange experiences a flash crash or reports corrupted data due to an API malfunction, the recorded price might plunge to zero or spike unnaturally. To protect the integrity of the feed, automated algorithms continuously scan incoming tickers for anomalies. If a ticker deviates significantly from the median price of other active exchanges, it is automatically flagged and temporarily excluded from the average.",
    "replacement": "Outlier rules depend on the provider and data product. A stale timestamp, mapping problem or exchange-specific dislocation may warrant investigation, but an unusual observation is not automatically wrong. Compare the exact provider methodology, identifiers and observation window before describing a rejection rule. The worksheet below uses invented, comparable observations and does not reproduce CoinGecko’s complete live aggregation process or guarantee its data quality."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      1,
      "body",
      8
    ],
    "expected": "Imagine you submit a virtual buy order for an asset when the displayed snapshot price is ten dollars. If the live exchange price has already moved to ten dollars and ten cents due to API delay, an unadjusted fill at ten dollars is unrealistic. In a hypothetical simulator configured with one-percent buy slippage, the adjusted fill would be ten dollars and ten cents; this is not a claim about TradeHQ's implementation. This disciplined adjustment forces you to account for execution friction, preparing you for the realities of live market trading.",
    "replacement": "For a hypothetical 1% adverse buy adjustment to a $10 reference, the assumed fill is $10.10. This arithmetic cannot establish that the real market had that price or enough available quantity. An actual historical fill would require a matched timestamp, venue and execution record. A separate fee remains a different cost from slippage. Label invented adjustments as assumptions and compare more than one path; changing the scenario does not make practice results a reliable forecast."
  }
];

// Residual contradictions found by the individual live review on 19 October.
corrections.push(...[
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "progression"
    ],
    "expected": "This course prepares you for advanced statistical trading, algorithmic execution analysis, and portfolio risk management modules.",
    "replacement": "Start with venue tickers and a volume-weighted arithmetic example, then compare observation times and delayed portfolio marks. Finish with cash-inclusive allocation and a fee-aware rebalance. These lessons do not establish readiness for statistical trading or algorithmic execution."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      0,
      "body",
      2
    ],
    "expected": "To understand how these raw price points translate into actionable data, traders must analyze the bid-ask spread and order book depth. A highly liquid exchange maintains tight spreads, meaning the difference between the highest buy order and the lowest sell order is minimal. When trading volume surges, raw tickers are produced continuously, providing a high-fidelity representation of current market consensus. Conversely, illiquid exchanges present wider spreads and sporadic ticker updates, making their individual prices less reliable for establishing a fair global benchmark for portfolio valuation.",
    "replacement": "A bid is a quoted buying price and an ask is a quoted selling price for a specified venue and time. Their difference is the spread. Available quantity matters separately: a narrow spread does not guarantee a large order can execute at that quote. A burst of volume does not make a ticker complete or certify a global consensus. Compare observations using matching instruments, quote currencies and timestamps before attributing a difference to liquidity. An unusual price can be a real venue observation rather than an erroneous record; the source and measurement window determine which question can be answered."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      0,
      "body",
      4
    ],
    "expected": "In the hypothetical two-venue worksheet, $10 times 1,000 units plus $11 times 100 units gives $11,100 of price-times-volume. Dividing by 1,100 units gives approximately $10.0909. This assumes comparable unit volumes over matching windows and ignores spread and fees. It illustrates one volume-weighted average, not the exact current methodology of every data provider or a guaranteed executable price.",
    "replacement": "A volume-weighted average multiplies each comparable price by its matched unit volume, adds those products and divides by total units. Larger weights contribute more to this arithmetic average. Providers can additionally filter observations, convert quote currencies and apply product-specific aggregation rules. Match the volume periods and quantity units before calculating; dollar turnover is not interchangeable with token units. An aggregate reference is neither a reserved quote nor a guarantee that any specified quantity can be exchanged at that price. The following invented two-venue example demonstrates only the stated weighting calculation."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      0,
      "keyTakeaways"
    ],
    "expected": [
      "Cryptocurrency price feeds are built by aggregating raw ticker data from independent global exchanges.",
      "Volume-Weighted Average Price (VWAP) ensures high-volume exchanges have a larger impact on the aggregated price.",
      "Aggregators filter out price outliers and stale exchange data using statistical algorithms like Median Absolute Deviation."
    ],
    "replacement": [
      "Independent venues can publish different ticker measures and observations.",
      "The worksheet weights comparable prices by matched unit volume; provider implementations can add other rules.",
      "Filtering and freshness require the provider’s current methodology and timestamps, not an assumed universal algorithm."
    ]
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      0,
      "quiz",
      1,
      "explanation"
    ],
    "expected": "VWAP ensures that exchanges processing higher volumes have a proportionally larger influence on the calculated global benchmark price.",
    "replacement": "In the stated worksheet, a larger matched unit volume gives that price more weight. This arithmetic example does not describe every provider’s complete live benchmark methodology."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      1,
      "body",
      2
    ],
    "expected": "This latency means that when you view a price update on a dashboard, you are looking at historical snapshot data rather than a real-time stream. High-frequency changes are frequently smoothed out, meaning rapid price spikes or sudden market drops might not register on your screen immediately. A delay of several minutes can matter differently depending on the task; it should never be assumed harmless, especially during volatile markets. Understanding this technical pipeline is essential for interpreting why your virtual orders might execute at unexpected rates.",
    "replacement": "An observation can be older than the time it reaches a dashboard. A snapshot series can also omit price changes between observations; this is not proof that a smoothing algorithm was applied. Aggregation, sampling, caching and transmission are distinct processes with different timestamps. Their effect depends on the learning question and market conditions. Record the provider observation time and fetch time separately, and keep missing observations distinct from a zero price. A recent page refresh or successful response cannot establish that the underlying observation is fresh or executable."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      1,
      "keyTakeaways"
    ],
    "expected": [
      "API data feeds often use periodic snapshots, introducing a time delay between live markets and dashboards.",
      "Paper portfolio valuations can lag behind live exchange rates, creating temporary price discrepancies.",
      "Simulating slippage and execution delay is necessary to practice realistic portfolio management."
    ],
    "replacement": [
      "Observation time, fetch time and periodic sampling describe different parts of a data feed.",
      "Delayed marks can differ from a contemporaneous comparison quote, whose own venue and timestamp must be stated.",
      "A hypothetical slippage assumption and a separately charged fee do not reproduce actual order-book execution."
    ]
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      2,
      "body",
      2
    ],
    "expected": "As asset prices fluctuate, your actual portfolio weights will drift away from your original targets. If Ethereum experiences a rapid price surge while Bitcoin remains stagnant, Ethereum's share of your portfolio might climb to fifty-five percent. This unplanned shift increases your concentration risk, making your overall net asset value overly sensitive to Ethereum's price movements. To restore your intended risk profile, you must systematically sell overperforming assets and buy underperforming ones through a process called portfolio rebalancing.",
    "replacement": "Price changes can alter portfolio weights without an order. If ETH rises while other marked values stay fixed, its share of total value can increase. That changes sensitivity to ETH, but it does not automatically establish excessive risk or require a sale. Rebalancing is one possible response to a chosen target; retaining the drift or adding new cash are different comparisons. State the objective, costs and measurement date before evaluating an adjustment. A target allocation is an exercise input rather than proof that the resulting portfolio is appropriate for real money."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      2,
      "body",
      7
    ],
    "expected": "Holding a portion of your portfolio in virtual cash provides stability, but it also introduces a phenomenon known as cash drag. Cash drag is the negative impact that uninvested cash has on your overall portfolio returns during a rising market. Because cash does not yield capital gains, a portfolio containing twenty percent cash will underperform a fully invested portfolio when asset prices are climbing. However, during market downturns, this cash reserve acts as a vital buffer, preserving capital and offering liquidity.",
    "replacement": "For a fee-free classroom comparison, suppose one account holds $80,000 of an asset and $20,000 non-interest-bearing virtual cash, while a second holds $100,000 of the same asset. A chosen 10% asset rise produces $108,000 versus $110,000. A 10% fall instead produces $92,000 versus $90,000. Cash changes participation in both paths; the word drag describes the rising comparison, not a universal disadvantage or recommendation. The example excludes interest, inflation, taxes and other product risks. Real cash arrangements need their own terms and cannot be inferred from the simulator balance."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      2,
      "body",
      11
    ],
    "expected": "Before costs, selling $10,000 from the $60,000 Bitcoin holding would leave $50,000 Bitcoin and $50,000 cash. With TradeHQ’s 0.1% sale fee, the sale instead nets $9,990: Bitcoin becomes $50,000, cash $49,990 and total value $99,990. The weights are approximately 50.005% and 49.995%, so the naive order does not restore exactly 50/50 after fees. Quote changes and quantity rounding can create further differences. This is a hypothetical accounting exercise, not a required allocation.",
    "replacement": "Before costs, selling $10,000 from the $60,000 Bitcoin holding would leave $50,000 Bitcoin and $50,000 cash. With TradeHQ’s 0.1% sale fee, the sale instead nets $9,990: Bitcoin becomes $50,000, cash $49,990 and total value $99,990. The weights are approximately 50.005% and 49.995%, so the naive order does not restore exactly 50/50 after fees. Quote changes and quantity rounding can create further differences. This is a hypothetical accounting exercise, not a required allocation. For an exact fee-aware 50% target with unchanged quotes and no quantity rounding, let S be the sale notional: 60,000 − S = 0.5 × (100,000 − 0.001S). Thus S = 10,000/0.9995, approximately $10,005.0025. The holding and cash then each equal approximately $49,994.9975. This derives a worksheet amount, not a real-market execution guarantee."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      2,
      "keyTakeaways"
    ],
    "expected": [
      "Portfolio rebalancing maintains target asset weights to manage concentration risk effectively.",
      "Virtual cash reserves provide necessary liquidity for transactions but can cause cash drag during market rallies.",
      "Accurate rebalancing requires calculating cash requirements while accounting for delayed price execution."
    ],
    "replacement": [
      "Rebalancing adjusts toward selected weights; it does not guarantee lower risk or better returns.",
      "Virtual cash can fund an affordable purchase including fees, while changing participation in gains and losses.",
      "Fee-aware target arithmetic assumes stated quotes and units; changed observations and rounding can alter the result."
    ]
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      2,
      "quiz",
      0,
      "explanation"
    ],
    "expected": "Rebalancing restores your intended asset allocation weights, preventing the portfolio from becoming overly concentrated in one asset.",
    "replacement": "Rebalancing moves toward selected target weights. Those targets can themselves be concentrated, and the adjustment does not prevent shared risks or guarantee lower losses."
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      2,
      "quiz",
      1,
      "question"
    ],
    "expected": "How does cash drag affect a portfolio during a strong market rally?",
    "replacement": "Compared with the same asset fully invested in a fee-free rising-price worksheet, what does some non-interest-bearing virtual cash do?"
  },
  {
    "slug": "cryptocurrency-price-feeds-and-valuation",
    "path": [
      "lessons",
      2,
      "quiz",
      1,
      "explanation"
    ],
    "expected": "Cash drag refers to the drag on performance caused by holding uninvested cash, which does not appreciate during a market rally.",
    "replacement": "With the same rising asset and no other differences, the cash portion does not participate in that gain. A declining path reverses the comparison; real cash can have interest and other characteristics."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      0,
      "body",
      2
    ],
    "expected": "To translate percentage weights into actionable trades, you must perform a simple calculation using your total portfolio value. For instance, if you decide to allocate fifteen percent of your virtual portfolio to a spot exchange-traded fund, your target dollar allocation is fifteen thousand dollars. To find the exact number of units to acquire, you divide this target dollar amount by the current market price of the asset. This methodical approach ensures your trades are always aligned with your pre-determined risk boundaries and overall strategic allocation.",
    "replacement": "To obtain units for a stated notional amount, divide that amount by the assumed price per unit. For example, a hypothetical $15,000 notional at $300 per share gives 50 shares before fees. This does not guarantee a post-trade allocation percentage. A purchase fee reduces cash and total marked equity, changing the denominator; an order also needs sufficient cash for its fee. State whether the target refers to pre-trade value or final value. Quote changes and rounding can create further differences, so reconcile the recorded quantity, cash debit and marked holding after the exercise."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      0,
      "body",
      8
    ],
    "expected": "Additionally, paper trading platforms execute trades using market orders at the current snapshot price, ignoring the liquidity constraints of real-world order books. In actual markets, executing a large buy order can cause slippage, pushing the execution price higher and distorting your intended target weight. Recognizing these differences helps you maintain a realistic perspective on your simulated performance, ensuring you do not develop false confidence when transitioning from a zero-slippage virtual environment to highly volatile, real-world financial markets.",
    "replacement": "TradeHQ’s simplified market orders use a displayed practice input without modelling exchange order queues or calibrated slippage. Other simulators can implement different order types and fill assumptions. An actual venue fill depends on available prices, quantity and timing; a single reference quote does not reserve that execution. A hypothetical worse fill can be written into a separate worksheet, but it is not a measured result unless the matching execution record exists. Keep that scenario, the virtual transaction fee and actual market evidence in separate fields when comparing outcomes."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      0,
      "body",
      11
    ],
    "expected": "Ignoring costs, $100,000 times 25% gives $25,000, and $25,000 divided by $250 gives 100 shares. On TradeHQ, buying those shares also incurs a 0.1% fee of $25. Cash falls to $74,975, while the position is marked at $25,000: total marked value is $99,975 and the holding is about 25.006% of that total. Thus the simple division sets a pre-fee notional amount, not a perfect post-fee portfolio weight. Recheck affordability, quantity rounding and the actual recorded fill.",
    "replacement": "Ignoring costs, $100,000 times 25% gives $25,000, and $25,000 divided by $250 gives 100 shares. On TradeHQ, buying those shares also incurs a 0.1% fee of $25. Cash falls to $74,975, while the position is marked at $25,000: total marked value is $99,975 and the holding is about 25.006% of that total. Thus the simple division sets a pre-fee notional amount, not a perfect post-fee portfolio weight. Recheck affordability, quantity rounding and the actual recorded fill. If an exact 25% post-fee target is the question, let B be the purchase notional: B = 0.25 × (100,000 − 0.001B). Therefore B = 25,000/1.00025, approximately $24,993.7516, or 99.975006 shares at $250. The fee and permitted quantity precision must still be checked; these are fixed-price worksheet assumptions."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      0,
      "keyTakeaways"
    ],
    "expected": [
      "Position sizing uses target percentage weights to manage risk systematically.",
      "Calculating units to trade requires dividing the target dollar amount by the current snapshot price.",
      "Spot simulation on TradeHQ relies entirely on asset diversification and cash buffers since leverage and hedging are unavailable."
    ],
    "replacement": [
      "A selected portfolio weight is a classroom input, not a guaranteed risk boundary.",
      "Units equal assumed notional divided by price; fees change cash and post-trade weights.",
      "TradeHQ provides long-only spot practice without options, futures, borrowed positions or real order-book execution."
    ]
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      0,
      "quiz",
      2,
      "explanation"
    ],
    "expected": "TradeHQ is restricted to spot instruments and does not support short selling, leverage, futures, or options, meaning you cannot hedge downside risk directly.",
    "replacement": "The engine does not execute options, futures, borrowed positions or short sales. Reducing exposure and holding cash are separate actions; this limitation is not a claim that every risk can or cannot be hedged elsewhere."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      1,
      "body",
      11
    ],
    "expected": "To complete the task, first sum the current values: forty-five thousand, thirty-five thousand, and forty thousand dollars. This calculation reveals a new total portfolio value of one hundred and twenty thousand dollars. Next, calculate the weights: gold is thirty-seven and a half percent, the stock index is approximately 29.17 percent, and the token is approximately 33.33 percent. Your token allocation has drifted from twenty percent to thirty-three percent, signaling a major concentration risk that warrants reviewing your hypothetical concentration limit before deciding whether to rebalance.",
    "replacement": "The hypothetical end values total $120,000. Dividing each by that same denominator gives gold 37.5%, the index approximately 29.1667% and the token approximately 33.3333%. The token’s initial weight was 20%, so its weight rose by about 13.3333 percentage points. Percentage points differ from a percent change in the weight itself. These marked balances exclude costs and cash flows. The drift identifies changed exposure, not a universally unacceptable allocation or an automatic trade. Compare any chosen review threshold with the original assumptions and missing risks before evaluating a hypothetical rebalance."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      2,
      "body",
      4
    ],
    "expected": "Managing a virtual cash buffer is crucial when rebalancing spot portfolios. In our paper trading environment, cash is not just idle capital; it serves as a vital shock absorber and liquidity source. When you need to buy underweight assets, your virtual cash balance provides the immediate funds required without forcing you to sell other assets first. Maintaining a target cash allocation, such as five percent of your total portfolio, can provide funds for modest adjustments, but does not guarantee that every planned purchase is affordable.",
    "replacement": "Before a hypothetical purchase, list available cash, assumed price, quantity and the 0.1% buy fee. Before a sale, list held units and the 0.1% sale fee. This distinguishes a chosen allocation from an affordable sequence of virtual orders. Cash can fund a purchase without a preceding sale only when the full debit is available; an order plan is not a promise about later prices. The exercise can compare selling first, using existing cash or leaving the portfolio unchanged, while recording each cost and any changed quote. No particular cash fraction is required by this lesson."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      2,
      "body",
      8
    ],
    "expected": "Ignoring fees, selling $10,000 of stock and buying $10,000 of bond ETFs would restore $40,000, $40,000 and $20,000 cash. With TradeHQ’s 0.1% fee, the sale nets $9,990 and the purchase costs $10,010. Final cash is $19,980, holdings total $80,000 and portfolio value is $99,980. The weights are approximately 40.008%, 40.008% and 19.984%, rather than exactly 40/40/20. This example assumes unchanged quotes and ignores quantity rounding.",
    "replacement": "Ignoring fees, selling $10,000 of stock and buying $10,000 of bond ETFs would restore $40,000, $40,000 and $20,000 cash. With TradeHQ’s 0.1% fee, the sale nets $9,990 and the purchase costs $10,010. Final cash is $19,980, holdings total $80,000 and portfolio value is $99,980. The weights are approximately 40.008%, 40.008% and 19.984%, rather than exactly 40/40/20. This example assumes unchanged quotes and ignores quantity rounding. Under those fixed-price assumptions, an exact 40/40/20 solution instead sells $10,008 of stock and buys $9,992 of the bond-ETF example. The combined fee is still $20. Each holding is $39,992 and cash is $19,996, totalling $99,980; dividing gives 40%, 40% and 20%. This assumes fractional quantities permit those notionals and the inputs stay unchanged."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      2,
      "body",
      11
    ],
    "expected": "Before fees, selling $10,000 reduces the $70,000 equity holding to $60,000. With the 0.1% sale fee, cash rises from $30,000 to $39,990 and total marked value becomes $99,990. Equity is about 60.006% and cash 39.994%, not exactly 60/40. Calculate the fee-aware target again if exact fractions are the question, while acknowledging changed quotes and unit rounding. An approximate rebalance may be sufficient for a stated worksheet tolerance; no real-money action is prescribed.",
    "replacement": "Before fees, selling $10,000 reduces the $70,000 equity holding to $60,000. With the 0.1% sale fee, cash rises from $30,000 to $39,990 and total marked value becomes $99,990. Equity is about 60.006% and cash 39.994%, not exactly 60/40. Calculate the fee-aware target again if exact fractions are the question, while acknowledging changed quotes and unit rounding. An approximate rebalance may be sufficient for a stated worksheet tolerance; no real-money action is prescribed. To finish the exact fixed-price worksheet, let S be the sale notional: 70,000 − S = 0.6 × (100,000 − 0.001S). This gives S = 10,000/0.9994, approximately $10,006.0036. Equity is about $59,993.9964, cash $39,995.9976 and total $99,989.9940: 60% and 40% before any rounding. A changed quote or restricted unit precision can prevent those exact fractions in a recorded order."
  },
  {
    "slug": "diversification-and-position-sizing",
    "path": [
      "lessons",
      2,
      "keyTakeaways"
    ],
    "expected": [
      "Rebalancing restores target weights by reducing overweight holdings and increasing underweight holdings; weight alone does not establish whether an asset is overvalued or undervalued.",
      "Virtual cash acts as an essential liquidity buffer during rebalancing executions.",
      "Properly sized market orders must be used to execute rebalancing smoothly on TradeHQ's spot simulation."
    ],
    "replacement": [
      "A target-weight adjustment differs from a judgement that an asset is cheap or expensive.",
      "Available virtual cash must cover purchase notional and fees; selling also incurs a fee.",
      "Exact worksheet fractions depend on fixed quotes, fee assumptions and permitted quantity precision."
    ]
  }
]);

export function applyCourseEditorialCorrections<T extends { slug: string }>(document: T): T {
  const applicable = corrections.filter(patch => patch.slug === document.slug);
  if (!applicable.length) return document;
  const result = JSON.parse(JSON.stringify(document)) as Record<string, unknown>;
  for (const patch of applicable) {
    let cursor: Record<string, unknown> | undefined = result;
    for (const key of patch.path.slice(0, -1)) {
      const child = cursor?.[key];
      cursor = child && typeof child === "object" ? child as Record<string, unknown> : undefined;
    }
    const key = patch.path[patch.path.length - 1];
    if (cursor && JSON.stringify(cursor[key]) === JSON.stringify(patch.expected)) cursor[key] = patch.replacement;
  }
  return result as unknown as T;
}
