export interface LearnArticleSection {
  heading: string;
  paragraphs: string[];
}

export interface LearnArticleLink {
  href: string;
  label: string;
}

export interface LearnArticle {
  slug: string;
  title: string;
  summary: string;
  metaDescription: string;
  readTime: string;
  sourceCheck?: { date: string; scope: string };
  sections: LearnArticleSection[];
  relatedLinks: LearnArticleLink[];
}

export const LEARN_ARTICLES: LearnArticle[] = [
  {
    slug: "what-is-paper-trading",
    title: "What Is Paper Trading? Practice, Uses and Limitations",
    summary: "Paper trading lets you practice buying and selling stocks, crypto, and other assets using virtual money — so you can learn without losing a cent.",
    metaDescription: "Learn what paper trading is and how virtual practice works. Practice with $100,000 virtual cash on TradeHQ — no signup, no risk.",
    readTime: "5 min read",
    sections: [
      {
        heading: "What Is Paper Trading?",
        paragraphs: [
          "Paper trading is the practice of simulating trades without using real money. Instead of risking your hard-earned savings, you use virtual currency to buy and sell stocks, ETFs, cryptocurrencies, and other financial instruments. The term dates back to a time when aspiring traders would literally write their hypothetical trades on paper to track performance.",
          "Today, paper trading is usually done digitally through simulated platforms. It can help beginners practise order entry, chart reading, record-keeping, and portfolio mechanics without risking real money. It is one practical way to learn how markets work, but it cannot reproduce every part of live trading, especially slippage, liquidity constraints, and the emotions attached to real losses.",
          "On TradeHQ, every user starts with $100,000 in virtual cash. You can trade 170 assets including blue-chip stocks like Apple (AAPL), cryptocurrencies like Bitcoin (BTC), ETFs like SPY, forex pairs, and commodities like gold. Every trade you make is tracked, giving you a realistic portfolio experience."
        ]
      },
      {
        heading: "What Beginners Can Practise",
        paragraphs: [
          "Paper trading gives you a controlled environment to make mistakes, test a process, and learn the mechanics before real money is involved. There is no universal number of practice weeks or months that guarantees better results. A more useful goal is to practise until you can follow the same written process consistently across a meaningful sample of simulated trades.",
          "A virtual exercise can compare day trading, swing trading and buy-and-hold under the same stated assumptions. Record hypothetical entries and exits and review gains and losses over a meaningful sample. TradeHQ executes market orders; stop and limit orders are explained conceptually rather than implemented as pending orders.",
          "Paper trading can also be used to practise risk management. You can test position sizing, predefined exit rules, diversification, and the discipline of writing a trading plan before placing an order. Any percentage risk limit should be treated as a practice parameter, not a universal rule."
        ]
      },
      {
        heading: "How to Get Started with Paper Trading on TradeHQ",
        paragraphs: [
          "Visit TradeHQ to start with $100,000 in virtual cash. Browse the asset catalogue, read the practice-data labels, place a simulated market order, and review the portfolio accounting. The practice snapshot is descriptive and need not reflect actual news or market execution.",
          "The mentor offers rule-based educational prompts about a practice portfolio. Use those prompts as questions for a journal, rather than personalized investment recommendations. Compare what was expected with what happened in the simulation and record where an assumption failed.",
          "A simulator can help document a process before testing it elsewhere, but virtual results do not establish readiness for real-money trading. Liquidity, transaction costs, gaps, taxes and behaviour under real losses can differ. Learning the mechanics is the purpose of this exercise."
        ]
      }
    ],
    relatedLinks: [
      { href: "/trade", label: "Start paper trading with $100,000 virtual cash" },
      { href: "/trade/aapl", label: "Practice trading Apple (AAPL)" },
      { href: "/trade/btc", label: "Practice trading Bitcoin (BTC)" },
      { href: "/learn/article/how-to-read-stock-charts", label: "Learn how to read stock charts" },
    ],
  },
  {
    slug: "how-to-read-stock-charts",
    title: "How to Read a Stock Chart: A Beginner's Guide",
    summary: "Stock charts are the language of the market. Learn how to read candlestick patterns, identify trends, and use indicators to make smarter trades.",
    metaDescription: "Learn how to read stock charts like a pro. Understand candlesticks, support and resistance, volume, and key indicators. Free guide on TradeHQ.",
    readTime: "6 min read",
    sections: [
      {
        heading: "Understanding the Basics of Stock Charts",
        paragraphs: [
          "A stock chart is a visual representation of a security's price movement over time. The x-axis shows time (minutes, hours, days, or years) and the y-axis shows price. The most common chart types are line charts, bar charts, and candlestick charts. Candlestick charts are the most popular among traders because they show four key data points: open, high, low, and close prices.",
          "Each candlestick represents a specific time period. A green (or hollow) candle means the closing price was higher than the opening price — the asset went up. A red (or filled) candle means it went down. The body of the candle shows the open-to-close range, while the thin lines above and below (called wicks or shadows) show the high and low.",
          "Candlestick names such as Doji, Hammer and Engulfing describe shapes in an observed price series. They do not prove that a reversal or continuation will occur. On TradeHQ, inspect whether the chart uses provider candles or generated practice candles before interpreting the displayed shape."
        ]
      },
      {
        heading: "Support, Resistance, and Trend Lines",
        paragraphs: [
          "Support and resistance describe areas where a price has previously paused or changed direction. They are approximate chart observations rather than floors or ceilings. A price may cross a marked level and keep moving, so compare both continuation and reversal scenarios in a journal.",
          "Trend lines connect selected price points, such as higher lows or lower highs. Their placement depends on the observation period and chosen points. A break changes that chart description; it does not establish that a new trend will continue.",
          "Volume counts shares, contracts or units traded during a stated period. A price move with high volume is an observation to investigate, not proof of reliability or institutional intent. Compare the source, interval and alternative explanations before making a simulated assumption."
        ]
      },
      {
        heading: "Key Technical Indicators for Beginners",
        paragraphs: [
          "Moving averages smooth a specified historical price series. A 50-period average crossing above a 200-period average is commonly called a golden cross; the reverse is a death cross. These lagging descriptions can change repeatedly and do not guarantee useful entry or exit timing.",
          "The Relative Strength Index (RSI) measures momentum on a scale of 0 to 100. An RSI above 70 suggests the asset is overbought (potentially due for a pullback), while below 30 suggests it's oversold (potentially due for a bounce). MACD (Moving Average Convergence Divergence) is another momentum indicator that shows the relationship between two moving averages.",
          "Practice reading charts on TradeHQ by opening any asset page — for example, NVIDIA (NVDA) or Ethereum (ETH). Study the candlestick patterns, identify support and resistance levels, and watch how indicators confirm or contradict price action. The more charts you study, the better your pattern recognition becomes."
        ]
      }
    ],
    relatedLinks: [
      { href: "/trade/nvda", label: "Practice reading NVIDIA (NVDA) charts" },
      { href: "/trade/eth", label: "Analyze Ethereum (ETH) price action" },
      { href: "/learn/article/trading-strategies-for-beginners", label: "5 trading strategies for beginners" },
      { href: "/learn/article/what-is-paper-trading", label: "What is paper trading?" },
    ],
  },
  {
    slug: "crypto-vs-stocks",
    title: "Crypto vs Stocks: Which Should You Practice Trading First?",
    summary: "Crypto and stocks have different risk profiles, trading hours, and volatility. Here's how to decide which to practice first as a beginner.",
    metaDescription: "Crypto vs stocks — which should beginners practice first? Compare volatility, risk, and trading hours. Practice both free on TradeHQ.",
    readTime: "5 min read",
    sections: [
      {
        heading: "The Key Differences Between Crypto and Stocks",
        paragraphs: [
          "Stocks represent ownership in real companies. When you buy Apple stock, you own a tiny piece of a trillion-dollar technology company that generates revenue, pays dividends, and is regulated by the SEC. Stock markets operate Monday through Friday during set hours (9:30 AM to 4:00 PM ET for the NYSE).",
          "Cryptocurrencies are decentralized digital assets that trade 24/7, 365 days a year. There's no closing bell, no holidays, and often no central authority governing their issuance. This means crypto prices can make dramatic moves at any hour — on a Sunday night, during a holiday, or while you sleep.",
          "Price variability depends on the asset, observation period and market conditions. A cryptocurrency and a company share can both have large gains or losses; a typical daily percentage is not a fixed risk classification. Compare percentage changes over the same sample rather than assume a permanent volatility ranking."
        ]
      },
      {
        heading: "Advantages of Starting with Stocks",
        paragraphs: [
          "Company reports provide information about revenue, expenses and business risks. Such information can inform an analysis without making a stock stable or its future return predictable. Any historical index return depends on the dates, reinvestment assumptions, inflation and costs used.",
          "Stocks are also more heavily regulated, which provides investor protections. You can learn about well-known companies you already use daily (Apple, Google, Amazon) and understand how real-world events affect stock prices. This practical connection makes learning more intuitive.",
          "TradeHQ lets you study company examples using virtual cash. Treat a news explanation as a hypothesis and compare alternative outcomes. Generated simulator changes do not reproduce an earnings announcement or establish how the actual stock responded."
        ]
      },
      {
        heading: "Why Some Beginners Prefer Crypto First",
        paragraphs: [
          "Crypto markets never close, so simulated practice is available at any time. Higher volatility can make price changes appear faster and larger, but that does not make learning easier or safer. An asset's unit price also does not measure its risk or accessibility; position size and total exposure matter more than whether one token costs less than $1.",
          "The crypto ecosystem introduces you to concepts like blockchain technology, decentralized finance (DeFi), and tokenomics — knowledge that helps you distinguish a network's function from a token's market price. Understanding both worlds can help you ask more precise questions about the risks.",
          "A learning exercise can compare one company example with one cryptocurrency using the same hypothetical position value and observation period. Record differences in mechanics and uncertainty without treating either market as the required starting choice. Virtual results do not establish real-money suitability."
        ]
      }
    ],
    relatedLinks: [
      { href: "/trade/btc", label: "Practice trading Bitcoin (BTC)" },
      { href: "/trade/aapl", label: "Practice trading Apple (AAPL)" },
      { href: "/markets", label: "Explore all 170 tradeable assets" },
      { href: "/learn/article/how-to-build-a-portfolio", label: "How to build a balanced portfolio" },
    ],
  },
  {
    slug: "trading-strategies-for-beginners",
    title: "5 Trading Strategy Hypotheses to Study with Virtual Cash",
    summary: "From buy-and-hold to momentum trading — explore five strategy hypotheses you can practice with virtual money before risking real capital.",
    metaDescription: "Study five trading strategy hypotheses with $100K virtual cash on TradeHQ. Compare simulated gains, losses and limitations; no real money is traded.",
    readTime: "7 min read",
    sections: [
      {
        heading: "1. Buy and Hold (The Warren Buffett Approach)",
        paragraphs: [
          "Buy and hold means retaining an investment over a longer period instead of trading each short-term move. A business can lose value permanently, and patience does not guarantee recovery. In a simulation, define the observation period and compare a hold with alternative rules under the same assumptions.",
          "On TradeHQ, you can practice buying blue-chip stocks like Apple (AAPL) or index ETFs like SPY and tracking their performance over weeks or months. This strategy teaches you to think long-term and avoid the emotional trap of selling during temporary dips. It also helps you understand the power of compound growth.",
          "For an educational company comparison, record revenue, costs, debt and business assumptions before observing later results. The mentor provides rule-based practice prompts, not a forecast or a recommendation to commit capital. Distinguish information available at the time from hindsight."
        ]
      },
      {
        heading: "2. Swing Trading (Capturing Multi-Day Moves)",
        paragraphs: [
          "Swing trading involves holding positions for several days to weeks, aiming to capture medium-term price moves. Holding overnight introduces gaps and news exposure. A written example can compare review schedules, but a holding period does not establish suitability for a particular person or guarantee that less monitoring is sufficient.",
          "A swing-trading hypothesis may refer to support, resistance or a chosen chart pattern. Those descriptions do not identify an asset that is certainly about to move. Record an entry assumption and hypothetical exit, then compare alternative outcomes and the effect of gaps or costs.",
          "Compare virtual swing-trading examples with a simple hold over the same period. Record entry, exit and sample size in a journal. TradeHQ implements market orders; a stop or target recorded in the journal does not automatically execute. A short sample cannot establish a dependable edge."
        ]
      },
      {
        heading: "3. Momentum Trading, 4. Mean Reversion, and 5. Dollar-Cost Averaging",
        paragraphs: [
          "Momentum methods use past price changes to define a rule for studying continuation. A trend may reverse after entry. Compare a precisely specified hypothetical rule with a simple baseline rather than treat a moving average or RSI reading as confirmation of the next move.",
          "Mean-reversion methods test whether deviations from a specified average tend to narrow in a chosen sample. A price may remain far from its average or continue moving away. Define the sample, exit assumption and costs before interpreting any simulated result.",
          "Dollar-cost averaging means contributing a fixed amount at regular intervals. It changes purchase timing and units acquired, but it does not guarantee a lower average cost or remove loss risk. Compare scheduled hypothetical purchases with a lump-sum example using the same total contribution and dates.",
          "Compare the five methods as educational hypotheses with a common starting balance, period and cost assumptions. Record failed assumptions as carefully as favourable outcomes. Neither a comfortable routine nor several successful practice weeks proves that a method will work with real money."
        ]
      }
    ],
    relatedLinks: [
      { href: "/trade", label: "Start testing strategies with $100K virtual cash" },
      { href: "/trade/tsla", label: "Practice swing trading Tesla (TSLA)" },
      { href: "/trade/sol", label: "Trade Solana (SOL) momentum" },
      { href: "/learn/article/how-to-read-stock-charts", label: "How to read stock charts" },
    ],
  },
  {
    slug: "stock-market-index-etfs",
    title: "What Is a Stock Market Index and How Do ETFs Work?",
    summary: "Understand what the S&P 500, Nasdaq, and Dow Jones actually track — and how ETFs let you invest in entire markets with a single trade.",
    metaDescription: "What are stock market indexes and ETFs? Learn about the S&P 500, Nasdaq, and Dow Jones. Practice trading SPY, QQQ on TradeHQ — free simulator.",
    readTime: "5 min read",
    sections: [
      {
        heading: "What Is a Stock Market Index?",
        paragraphs: [
          "A stock market index is a measurement of a section of the stock market. It's calculated from the prices of selected stocks and represents a benchmark for the overall market or a specific sector. The three most famous U.S. indexes are the S&P 500 (500 large companies), the Nasdaq Composite (tech-heavy), and the Dow Jones Industrial Average (30 blue-chip stocks).",
          "You can't directly buy an index — it's a number, not a tradeable security. But you can buy products that track the index, giving you exposure to all the stocks in it. These products are called ETFs (Exchange-Traded Funds), and they're one of the most popular investment vehicles in the world.",
          "When financial news says 'the market was up 2% today,' they're usually referring to the S&P 500 index. Understanding indexes helps you gauge overall market health and compare individual stock performance against the broader market."
        ]
      },
      {
        heading: "How ETFs Work",
        paragraphs: [
          "An ETF is a fund that holds a basket of securities (stocks, bonds, commodities) and trades on an exchange like a regular stock. SPY tracks the S&P 500, QQQ tracks the Nasdaq 100, and DIA tracks the Dow Jones. When you buy one share of SPY, you effectively own a tiny piece of all 500 companies in the S&P 500.",
          "An ETF provides the exposure specified by its objective and holdings. Diversification, concentration, leverage, annual expenses and trading costs vary by fund; low cost or broad diversification is not guaranteed. Read the current fund documents before interpreting a historical comparison.",
          "Compare ETF examples with an individual company using the same period and position value in the simulator. Examine holdings and concentration rather than treating any fund as a universally appropriate beginner investment. Several funds can hold overlapping securities."
        ]
      },
      {
        heading: "Building a Portfolio with ETFs",
        paragraphs: [
          "As a hypothetical accounting exercise, compare a 60% SPY, 20% QQQ and 20% cash allocation with another allocation that also totals 100%. These are arbitrary practice settings, not a suggested beginner portfolio. Overlapping holdings can create concentration even when several instruments are used.",
          "ETFs are also excellent for learning about different sectors and asset classes. Want exposure to the semiconductor industry? There's an ETF for that. Interested in international markets, clean energy, or real estate? ETFs cover virtually every market segment imaginable.",
          "Use TradeHQ to build a virtual portfolio with ETFs and track its performance against individual stock picks. This exercise teaches you about correlation, diversification benefits, and the trade-off between concentrated bets and broad market exposure. This exercise uses virtual cash and does not establish that a strategy will succeed with real money."
        ]
      }
    ],
    relatedLinks: [
      { href: "/trade/spy", label: "Practice trading the S&P 500 ETF (SPY)" },
      { href: "/trade/qqq", label: "Trade the Nasdaq 100 ETF (QQQ)" },
      { href: "/learn/article/how-to-build-a-portfolio", label: "How to build a balanced portfolio" },
      { href: "/learn/article/crypto-vs-stocks", label: "Crypto vs stocks comparison" },
    ],
  },
  {
    slug: "how-to-build-a-portfolio",
    title: "How to Build a Balanced Virtual Portfolio from Scratch",
    summary: "Learn the fundamentals of portfolio construction — asset allocation, diversification, and rebalancing — using your $100,000 TradeHQ virtual cash.",
    metaDescription: "Learn how to build a diversified portfolio from scratch. Practice asset allocation with $100K virtual cash on TradeHQ — free stock simulator.",
    readTime: "6 min read",
    sections: [
      {
        heading: "The Foundation: Asset Allocation",
        paragraphs: [
          "Asset allocation divides a portfolio across selected asset classes or holdings. Its effect depends on exposures, correlations and the period examined. Allocation does not guarantee diversification or performance; document the assumptions rather than rank it as universally more important than every other decision.",
          "For a virtual accounting example, choose percentages that total 100%, such as 60% in a stock-index example, 30% cash and 10% another practice asset. These numbers illustrate weighting only. Compare another normalized allocation and identify overlapping holdings and concentration.",
          "Real-money allocation depends on circumstances including objectives, time horizon, liabilities and ability to bear loss. Age alone cannot determine a suitable stock/bond split. A simulator can compare hypothetical exposures, but it cannot discover a person's true risk tolerance or certify an investment allocation."
        ]
      },
      {
        heading: "Diversification: Don't Put All Eggs in One Basket",
        paragraphs: [
          "Diversification means spreading investments across different assets so that poor performance in one area doesn't devastate your entire portfolio. If you own only tech stocks and the tech sector drops 30%, your whole portfolio suffers. But if tech is just 25% of a diversified portfolio, the impact is cushioned.",
          "Effective diversification happens across multiple dimensions: asset classes (stocks, crypto, commodities), sectors (technology, healthcare, energy), geographies (US, international), and company sizes (large-cap, mid-cap, small-cap). ETFs make diversification simple — SPY gives you 500 stocks in one trade.",
          "Compare a concentrated virtual portfolio with one spread across different practice exposures. Keep total starting value and observation period equal and record each contribution to gains and losses. A commodity or ETF is not an assured hedge; correlations and fund holdings can change."
        ]
      },
      {
        heading: "Rebalancing and Ongoing Management",
        paragraphs: [
          "Over time, your portfolio allocation will drift as some assets outperform others. If your crypto holdings surge 50% while stocks grow 10%, crypto becomes a larger percentage of your portfolio than you intended — increasing your risk. Rebalancing means periodically selling some winners and buying more of the underperformers to maintain your target allocation.",
          "Rebalancing restores selected target weights. Timing and thresholds are choices to compare, not universal quarterly or five-percent rules. Rebalancing can add costs and can reduce returns in a continuing trend, so record turnover and compare against a portfolio left unchanged.",
          "Practice rebalancing on TradeHQ by setting a target allocation at the start, then checking your portfolio monthly. Use the portfolio analytics feature to see how your allocations have shifted and make adjustment trades. This exercise builds the discipline you'll need when managing real investments. Remember: successful investing is a marathon, not a sprint."
        ]
      }
    ],
    relatedLinks: [
      { href: "/portfolio", label: "View and manage your virtual portfolio" },
      { href: "/trade/spy", label: "Add S&P 500 ETF (SPY) to your portfolio" },
      { href: "/trade/btc", label: "Add Bitcoin (BTC) to your portfolio" },
      { href: "/learn/article/stock-market-index-etfs", label: "Understanding ETFs and indexes" },
    ],
  },
  {
    slug: "risk-management-in-trading",
    title: "What Is Risk Management in Trading? The Complete Beginner's Guide",
    summary: "Learn how position sizing, stop-loss orders and predefined risk limits can be tested in a simulator. Percentage rules such as 1% or 2% are examples, not universal prescriptions.",
    metaDescription: "Learn risk-management concepts including position sizing, stop-loss orders, reward-to-risk assumptions, and example percentage risk limits using TradeHQ practice tools.",
    readTime: "6 min read",
    sections: [
      {
        heading: "Why Risk Management Matters More Than Stock Picks",
        paragraphs: [
          "Risk management describes how exposure and losses are measured or limited under a chosen process. Profitability also depends on realized gains, losses, frequency and costs. For example, a 40% win rate with fixed 2R gains and 1R losses has gross expectancy 0.4×2−0.6×1=0.2R per trade before costs; it is hypothetical arithmetic.",
          "Risk management is a set of rules and strategies designed to limit your potential losses on any single trade and across your entire portfolio. Without it, a single bad trade can wipe out weeks or months of gains. With it, you can survive losing streaks, preserve capital, and stay in the game long enough for your edge to play out.",
          "On TradeHQ, you can practise risk-management ideas with $100,000 in virtual cash. Experiment with different position sizes, exit rules, and reward-to-risk assumptions, then review how each choice changes drawdown and variability over a larger sample of trades. The aim is to build a repeatable process, not to discover a guaranteed formula."
        ]
      },
      {
        heading: "Position Sizing With a Predefined Risk Limit",
        paragraphs: [
          "Position sizing determines how much of your portfolio you expose to a single trade. Percentage-based limits such as 1% or 2% are common educational examples, but they are not universal prescriptions. On a $100,000 practice account, a 1% risk budget would be $1,000 and a 2% budget would be $2,000.",
          "To calculate an illustrative position size, use three inputs: account size, a chosen practice risk budget, and the distance between entry and exit. For example, if a practice account is $100,000, the chosen risk budget is 1% ($1,000), and a hypothetical entry is $100 with an exit at $95, the risk per share is $5. Dividing $1,000 by $5 gives 200 shares, or a $20,000 position. This is arithmetic for simulation, not a recommendation for real-money trading.",
          "Smaller predefined risk budgets reduce the damage from a losing streak, while larger ones make drawdowns compound much faster. Use the simulator to compare several fixed-risk assumptions and record the resulting drawdowns rather than treating any single percentage as a magic number."
        ]
      },
      {
        heading: "Stop-Losses and Risk-Reward Ratios",
        paragraphs: [
          "A stop order uses a trigger price, while its eventual fill depends on the order type and market conditions. Gaps or limited liquidity can produce a worse fill than the planned price. A journal exit assumption is useful for arithmetic but does not establish an exact maximum loss.",
          "Reward-to-risk compares an assumed gain with an assumed loss. With fixed realized 3R wins and 1R losses, a 25% win rate gives 0.25×3−0.75×1=0R gross expectancy before costs. A planned target need not be achieved, and fees can make even that break-even example negative.",
          "Compare position sizes and hypothetical exit rules in a practice journal, using the same observation period and stated cost assumptions. TradeHQ executes market orders and does not place automatic stop orders. Review drawdown, realized gains and losses, sample size and assumptions without treating any ratio as a guarantee."
        ]
      }
    ],
    relatedLinks: [
      { href: "/trade", label: "Practice risk management with $100K virtual cash" },
      { href: "/learn/article/trading-strategies-for-beginners", label: "5 beginner trading strategies" },
      { href: "/trade/btc", label: "Practice position sizing on Bitcoin (BTC)" },
      { href: "/learn/article/how-to-read-stock-charts", label: "How to read stock charts" },
    ],
  },
  {
    slug: "market-orders-vs-limit-orders",
    title: "Market Orders vs Limit Orders: Which Should You Use and When?",
    summary: "Understanding order types is essential before placing your first trade. Learn the difference between market and limit orders, and when to use each one.",
    metaDescription: "Market orders vs limit orders explained for beginners. Learn about slippage, fill guarantees, and when to use each order type. Practice free on TradeHQ.",
    readTime: "5 min read",
    sections: [
      {
        heading: "What Is a Market Order?",
        paragraphs: [
          "A market order seeks execution at available prices rather than specifying a limit price. Execution and the final price depend on available liquidity, trading halts and other conditions. The displayed quote is not a guaranteed fill, particularly when prices move quickly.",
          "Market orders prioritize seeking execution over a specified price limit. That trade-off can involve substantial uncertainty in the eventual fill. Compare hypothetical outcomes under different liquidity and gap assumptions rather than prescribe one order type for every urgent situation.",
          "Slippage is the difference between an expected price and the actual fill. Its size varies with order size, liquidity and timing; it is not always pennies in a named asset. TradeHQ uses simplified practice market fills and does not reproduce every exchange execution condition."
        ]
      },
      {
        heading: "What Is a Limit Order?",
        paragraphs: [
          "A limit order lets you set the exact price at which you want to buy or sell. A buy limit order executes only at your specified price or lower; a sell limit order executes only at your specified price or higher. Unlike market orders, limit orders give you price control but don't guarantee execution.",
          "For example, if Bitcoin is trading at $68,000 and you want to buy at $65,000, you place a buy limit order at $65,000. If the market reaches that level, the order becomes eligible to fill, subject to available liquidity and order priority. If it never reaches $65,000, the order remains open until you cancel it or it expires.",
          "Limit orders can be useful when price control matters more than immediate execution. They are commonly used for planned entries and exits, but the trade-off is that the order may not fill at all, or may fill only partially, if there is not enough matching liquidity."
        ]
      },
      {
        heading: "When to Use Each Order Type",
        paragraphs: [
          "A market order and a limit order make different trade-offs between seeking execution and controlling price. For a learning exercise, compare possible fills during a liquid session, a wide spread and a price gap. Neither urgency nor a familiar ticker guarantees a small execution cost.",
          "A limit order specifies a maximum buy price or minimum sell price. Price control does not guarantee any fill or a full fill, even when a chart touches the level. Compare an unfilled order with a partial fill and a completed fill in a written hypothetical example.",
          "TradeHQ currently executes market orders only. Study limit-order mechanics conceptually with a written example; there is no pending limit-order feature to test on SOL or another asset. Simulator fills cannot establish which order type gives better actual execution."
        ]
      }
    ],
    relatedLinks: [
      { href: "/trade/nvda", label: "Practice order types on NVIDIA (NVDA)" },
      { href: "/trade/sol", label: "Practice market orders on Solana (SOL)" },
      { href: "/learn/article/risk-management-in-trading", label: "Risk management guide" },
      { href: "/wiki/limit-order-vs-market-order", label: "Glossary: Limit vs Market Order" },
    ],
  },
  {
    slug: "technical-indicators-rsi-macd-moving-averages",
    sourceCheck: { date: "2026-10-18", scope: "RSI, MACD and moving-average definitions compared with the linked Fidelity guides; no predictive-performance or professional review claimed." },
    title: "How to Use Technical Indicators: RSI, MACD, and Moving Averages Explained",
    summary: "RSI, MACD and moving averages describe selected price observations. Learn their calculations, conventional interpretations and limits, then compare hypothetical examples without treating a signal as a trade recommendation.",
    metaDescription: "Learn how to use RSI, MACD, and Moving Averages for trading. Understand overbought/oversold signals, crossovers, and trend confirmation. Free practice on TradeHQ.",
    readTime: "7 min read",
    sections: [
      {
        heading: "Moving Averages: The Foundation of Trend Analysis",
        paragraphs: [
          "Moving averages (MAs) smooth out price data to reveal the underlying trend. The two most common types are the Simple Moving Average (SMA), which gives equal weight to all prices in the period, and the Exponential Moving Average (EMA), which gives more weight to recent prices and reacts faster to changes.",
          "A 50-period average crossing above a 200-period average is called a golden cross; the reverse is a death cross. The period might mean days or another chart interval. These lagging observations describe the selected series and do not establish that a rally or decline will follow.",
          "Shorter averages such as a 9-period or 21-period EMA react differently from longer averages. A price above an average describes its position relative to that calculation, not a guaranteed trend. TradeHQ chart controls include moving-average and volume overlays; indicator examples should match the actual chart features."
        ]
      },
      {
        heading: "RSI: Measuring Momentum and Overbought/Oversold Conditions",
        paragraphs: [
          "The Relative Strength Index (RSI) is a momentum oscillator that measures the speed and magnitude of price changes on a scale of 0 to 100. Developed by J. Welles Wilder, RSI compares the average gains and losses over a 14-period window to determine whether an asset is overbought (above 70) or oversold (below 30).",
          "Readings above 70 or below 30 are conventional RSI descriptions rather than instructions to sell or buy. An extreme reading can persist. Divergence means price and oscillator observations differ; it does not prove a reversal or make one signal universally most reliable.",
          "Compare hypothetical RSI settings and record what each describes before looking at later prices. A pullback to 40–50 or a bounce to 50–60 is not a universal entry rule. TradeHQ's simplified RSI-style practice value should not be mistaken for a standard RSI calculation on historical provider closes."
        ]
      },
      {
        heading: "MACD: Combining Trend and Momentum Signals",
        paragraphs: [
          "The Moving Average Convergence Divergence (MACD) is a versatile indicator that shows the relationship between two exponential moving averages — typically the 12-period and 26-period EMAs. The MACD line is the difference between these two EMAs, and the signal line is a 9-period EMA of the MACD line. The histogram shows the gap between them.",
          "A positive histogram means the MACD line is above its signal line; a negative histogram means it is below. Those relationships are often called bullish and bearish respectively, but describe the selected calculations rather than the next price move. Crossovers can reverse in both trending and sideways samples; performance depends on the rules, period, costs and comparison used.",
          "Combining indicators creates another hypothesis to evaluate, rather than guaranteeing the best results. Define each calculation, interval and decision rule, then compare against a simple baseline with the same costs and sample. TradeHQ does not provide a MACD chart overlay; journal examples are conceptual."
        ]
      }
    ],
    relatedLinks: [
      { href: "https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/RSI", label: "Fidelity — RSI definition and limitations" },
      { href: "https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/macd", label: "Fidelity — MACD calculation" },
      { href: "https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/sma", label: "Fidelity — simple moving average" },
      { href: "/trade/eth", label: "Practice indicators on Ethereum (ETH)" },
      { href: "/trade/nvda", label: "NVDA practice workspace — indicator examples are conceptual" },
      { href: "/wiki/macd", label: "Glossary: MACD explained" },
      { href: "/wiki/rsi-divergence", label: "Glossary: RSI Divergence" },
    ],
  },
];
