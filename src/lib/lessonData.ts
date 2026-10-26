export interface ContentSection {
  type: "text" | "heading" | "list" | "image" | "example" | "tip" | "quote" | "stat" | "highlight";
  data?: string | string[];
  alt?: string;
  caption?: string;
  author?: string;
  value?: string;
  label?: string;
}

export interface Subtopic {
  title: string;
  content: ContentSection[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Lesson {
  id: number;
  title: string;
  category: string;
  description: string;
  subtopics: Subtopic[];
  quiz: QuizQuestion[];
  references?: { label: string; href: string }[];
}

// Legacy lesson IDs and quiz answer indexes are retained for existing learning flows.
export const lessonData: Lesson[] = [
  {
    "id": 1,
    "title": "Getting Started with Trading",
    "category": "Basics",
    "description": "Learn the fundamentals of trading, key terminology, and how markets work.",
    "subtopics": [
      {
        "title": "Understanding Stocks, ETFs & Securities",
        "content": [
          {
            "type": "image",
            "data": "/src/assets/lesson-trading-workspace.jpg",
            "alt": "Professional trading workspace with multiple monitors",
            "caption": "Illustration for understanding stocks, etfs & securities."
          },
          {
            "type": "image",
            "data": "/src/assets/lesson-etf-diversification.jpg",
            "alt": "ETF diversification network visualization",
            "caption": "Illustration for understanding stocks, etfs & securities."
          },
          {
            "type": "text",
            "data": "A stock is an ownership interest in a company. A new share issue can raise money for the issuer; buying existing shares in the secondary market normally pays the selling holder. Ownership does not promise dividends or a higher resale price."
          },
          {
            "type": "example",
            "data": "Hypothetical share arithmetic: 10 shares at $200 cost $2,000 before fees. At $250 they are worth $2,500, a $500 unrealized gain before costs; at $150 they are worth $1,500, a $500 loss. Market capitalization is price times shares outstanding: 2 billion shares at $50 gives $100 billion. These are invented inputs, not current company valuations."
          },
          {
            "type": "heading",
            "data": "An ETF is a fund structure, not a risk rating"
          },
          {
            "type": "text",
            "data": "An exchange-traded fund gives the exposure specified by its mandate and holdings. A broad equity index fund and a concentrated or leveraged single-stock fund have very different risks. The ETF label alone does not establish diversification, low volatility or suitability."
          },
          {
            "type": "list",
            "data": [
              "Read the objective, holdings, concentration, expense ratio and any leverage or daily-reset terms in current fund documents.",
              "SPY and QQQ follow different indexes; QQQ is not a fund containing only technology companies. Fund holdings can overlap with shares already held.",
              "Other products include issuer debt, commodity exposures and derivative contracts. Their legal rights, costs and settlement terms differ."
            ]
          },
          {
            "type": "example",
            "data": "Compare an invented two-company fund holding 50% in each name with a single-company holding. If one share falls 20% and the other is unchanged, the equally weighted fund falls 10% before costs. If both fall 20%, the fund also falls 20%: multiple holdings do not eliminate market losses."
          },
          {
            "type": "tip",
            "data": "In TradeHQ, inspect the selected practice instrument and quote label before entering a market order. Options and futures lessons explain contracts conceptually; the simulator does not execute those contracts."
          }
        ]
      },
      {
        "title": "How to Read Stock Quotes & Charts",
        "content": [
          {
            "type": "image",
            "data": "/src/assets/lesson-candlestick.jpg",
            "alt": "Understanding candlestick chart patterns",
            "caption": "Illustration for how to read stock quotes & charts."
          },
          {
            "type": "text",
            "data": "A quote is an observation from a source at a time, not a guarantee of the next execution price. Check currency, timestamp, bid, ask and whether data are delayed or generated. Last price, bid and ask answer different questions."
          },
          {
            "type": "list",
            "data": [
              "Bid: a quoted price at which a participant is willing to buy; ask: a quoted selling price. Available size and routing affect execution.",
              "Last price: the most recently reported transaction in the displayed feed. It can differ from both current quotes.",
              "Volume: units traded in a specified interval. A chart must identify the interval and venue or coverage."
            ]
          },
          {
            "type": "example",
            "data": "An invented bid of $99.90 and ask of $100.10 have a $0.20 spread. A displayed last trade of $100 is not a promise that a new purchase will fill there. Ten shares bought at $100.10 and immediately sold at $99.90 lose $2 before any fees, assuming both quotes fill."
          },
          {
            "type": "heading",
            "data": "Read the interval before the shape"
          },
          {
            "type": "text",
            "data": "A line chart connects a chosen series such as closing prices. A candle records open, high, low and close for an interval. Under the common green-up convention, a green body means close above open; color settings can differ. Neither color nor body length predicts the next candle."
          },
          {
            "type": "example",
            "data": "For a candle with open 100, high 105, low 99 and close 103, the body spans 3 and the full range spans 6. A daily candle and a one-minute candle can have that same shape while representing different observations."
          },
          {
            "type": "tip",
            "data": "TradeHQ charts may use provider data or generated practice series, as labeled. Generated candles are illustrations and cannot establish actual past market behavior."
          }
        ]
      },
      {
        "title": "Market Orders vs. Limit Orders",
        "content": [
          {
            "type": "text",
            "data": "Order types describe different trade-offs between execution and price control. This lesson explains their mechanics rather than recommending one order type for every situation."
          },
          {
            "type": "heading",
            "data": "Market Orders: Execution Before Price Control"
          },
          {
            "type": "text",
            "data": "A market order seeks to buy or sell promptly at available prices. The last quoted price may differ from the fill price, particularly in fast or thin markets. Trading halts and limited liquidity can interrupt execution."
          },
          {
            "type": "example",
            "data": "Hypothetical example: a quote shows $200 and an order requests 10 shares. A $200.50 fill costs $2,005 before fees, while a $199.50 fill costs $1,995. The quote alone does not establish the final cost."
          },
          {
            "type": "heading",
            "data": "Limit Orders: A Price Condition"
          },
          {
            "type": "text",
            "data": "A buy limit specifies the highest acceptable purchase price; a sell limit specifies the lowest acceptable sale price. Execution is at that price or better, but the order may fill only partly or not at all. Reaching the limit does not guarantee a fill because other orders may have priority."
          },
          {
            "type": "example",
            "data": "A hypothetical buy limit at $195 cannot fill above $195. If the market stays higher, the order remains unfilled. Even if a fill occurs, the asset can subsequently fall in value."
          },
          {
            "type": "heading",
            "data": "Stop and Stop-Limit Mechanics"
          },
          {
            "type": "text",
            "data": "A stop order becomes a market order when its trigger is reached. A stop-limit instead becomes a limit order. A stop can execute beyond its trigger after a gap; a stop-limit can remain unfilled. Neither guarantees a maximum loss."
          },
          {
            "type": "heading",
            "data": "What TradeHQ Supports"
          },
          {
            "type": "highlight",
            "data": "TradeHQ executes simulated market orders. It does not place resting limit, stop or trailing-stop orders. Study those mechanics using a worksheet; recording an exit condition does not automate it in the simulator."
          },
          {
            "type": "tip",
            "data": "For a worksheet exercise, compare a market-order fill with an unfilled limit-order case and a stop triggered after a price gap. Record the assumptions, fees and remaining exposure rather than assuming any order type is always preferable."
          },
          {
            "type": "heading",
            "data": "Reference"
          },
          {
            "type": "text",
            "data": "SEC Investor.gov — Types of Orders and Stop, Stop-Limit, and Trailing Stop Orders explain the execution trade-offs: https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders and https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-15"
          }
        ]
      },
      {
        "title": "Trading Hours & Market Sessions",
        "content": [
          {
            "type": "text",
            "data": "Trading schedules belong to a venue and product. For regular Nasdaq stock trading, the scheduled session is 9:30 a.m.–4 p.m. Eastern Time on business days, subject to holidays, early closes and interruptions. Eastern Time changes its UTC offset seasonally."
          },
          {
            "type": "list",
            "data": [
              "Nasdaq currently defines pre-market as 4:00–9:30 a.m. Eastern and post-market as 4:00–8:00 p.m. Eastern. Access, eligible orders and broker rules vary.",
              "An exchange schedule does not guarantee liquidity, stable prices or a fill. Spreads and available size can differ outside the regular session.",
              "Many crypto venues ordinarily operate continuously, but maintenance, outages and product restrictions can interrupt access. A continuously open venue does not establish a predictable weekend return."
            ]
          },
          {
            "type": "example",
            "data": "If an exchange is open at 10 a.m. Eastern, a broker may still restrict a particular product or order. Record the venue, date and time zone instead of assuming that every stock, fund, currency pair and token shares one schedule."
          },
          {
            "type": "tip",
            "data": "The TradeHQ practice engine is not an exchange-hours enforcement service. A simulated fill outside a real venue session does not prove a real order could execute then. Check the relevant venue and broker rules for actual activity."
          }
        ]
      }
    ],
    "quiz": [
      {
        "question": "What does owning a stock represent?",
        "options": [
          "Lending money to a company",
          "A piece of ownership in a company",
          "A contract to buy the company",
          "Insurance for the company"
        ],
        "correctAnswer": 1,
        "explanation": "When you buy a stock, you're purchasing a small ownership stake in that company. You become a shareholder!"
      },
      {
        "question": "Which statement about ETF diversification is accurate?",
        "options": [
          "Every ETF eliminates market risk",
          "Exposure depends on the mandate and holdings; a single-stock ETF is not diversified",
          "Every ETF holds all listed stocks",
          "Every ETF is less volatile than every individual stock"
        ],
        "correctAnswer": 1,
        "explanation": "The fund structure alone does not establish diversification or lower risk. Inspect the objective, holdings, leverage and costs."
      },
      {
        "question": "Which order type prioritises immediate execution over price control?",
        "options": [
          "Limit Order",
          "Stop Order",
          "Market Order",
          "Day Order"
        ],
        "correctAnswer": 2,
        "explanation": "Market orders are designed to execute as quickly as available liquidity allows, but the final price can differ and execution is not literally guaranteed in every market condition."
      },
      {
        "question": "When are US stock markets open for regular trading?",
        "options": [
          "24/7 like crypto",
          "8:00 AM - 5:00 PM ET",
          "9:30 AM - 4:00 PM ET",
          "10:00 AM - 3:00 PM ET"
        ],
        "correctAnswer": 2,
        "explanation": "Regular trading hours for US markets are 9:30 AM to 4:00 PM Eastern Time, Monday through Friday (excluding holidays)."
      },
      {
        "question": "What does a green/white candlestick indicate?",
        "options": [
          "The price went down",
          "No trading occurred",
          "The price went up",
          "The stock is overvalued"
        ],
        "correctAnswer": 2,
        "explanation": "A green or white candlestick means the closing price was higher than the opening price - the stock went up that period!"
      }
    ],
    "references": [
      {
        "label": "SEC: stocks",
        "href": "https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks"
      },
      {
        "label": "SEC: single-stock ETFs",
        "href": "https://www.investor.gov/introduction-investing/investing-basics/glossary/single-stock-etfs"
      },
      {
        "label": "Nasdaq: Equity 1 session definitions",
        "href": "https://listingcenter.nasdaq.com/assets/RuleBook/Nasdaq/rules/Nasdaq%20Equity%201.html"
      }
    ]
  },
  {
    "id": 2,
    "title": "Risk Management",
    "category": "Strategy",
    "description": "Essential strategies to protect your capital and manage trading risk.",
    "subtopics": [
      {
        "title": "Position Sizing & The 2% Rule",
        "content": [
          {
            "type": "image",
            "data": "/src/assets/lesson-risk-shield.jpg",
            "alt": "Financial risk protection shield",
            "caption": "Illustration for position sizing & the 2% rule."
          },
          {
            "type": "text",
            "data": "Position sizing converts chosen assumptions into an exposure. The often-mentioned 2% rule is a heuristic, not an appropriate loss limit for every person or trade. A planned exit can be missed, and losses can exceed the worksheet assumption."
          },
          {
            "type": "example",
            "data": "Choose a hypothetical $100,000 account and a 2% planned loss amount: $100,000 × 0.02 = $2,000. With an assumed $100 entry and $95 exit, the $5 difference gives $2,000 ÷ $5 = 400 shares and $40,000 purchase notional before fees. This quantity is a calculation, not a recommendation."
          },
          {
            "type": "list",
            "data": [
              "Specify entry, assumed exit, available cash, units and transaction costs.",
              "Check affordability separately: a worksheet quantity is not automatically an executable order.",
              "Repeat with a worse fill: 400 shares sold at $90 lose $4,000 before costs, twice the planned amount.",
              "Include existing positions when evaluating total exposure; a per-trade number does not cap portfolio losses."
            ]
          },
          {
            "type": "tip",
            "data": "TradeHQ supports market orders. Keep the hypothetical exit in a journal and compare it with the practice result; writing a stop price does not place a protective stop order."
          }
        ]
      },
      {
        "title": "Stop-Loss & Take-Profit Targets",
        "content": [
          {
            "type": "text",
            "data": "A real stop order becomes eligible for execution when its trigger condition is met. A stop-market order does not guarantee the trigger price; a stop-limit order can remain unfilled. Exact trigger and handling rules depend on the product and broker."
          },
          {
            "type": "example",
            "data": "Suppose a share was bought at $100 with a hypothetical stop trigger of $95. If the next available sale fills at $90, the price loss is $10 per share, not $5. Fees add to the loss. An instruction to exit cannot guarantee a maximum loss."
          },
          {
            "type": "text",
            "data": "A take-profit instruction and a trailing stop also depend on execution conditions. Selling some units reduces the remaining exposure after a fill, but a planned target alone does not lock in a gain. A gap can cross both a planned entry and exit level."
          },
          {
            "type": "list",
            "data": [
              "Separate trigger price, limit price and actual execution price in a worksheet.",
              "Compare an orderly price path with a gap and an unfilled-limit case.",
              "Record the number of units still held after each assumed partial fill."
            ]
          },
          {
            "type": "tip",
            "data": "These order types are conceptual in TradeHQ. Use market orders and manual practice exits to study the accounting; the simulator does not implement stop, take-profit or trailing-stop execution."
          }
        ]
      },
      {
        "title": "Understanding Risk-Reward Ratios",
        "content": [
          {
            "type": "heading",
            "data": "Keep the ratio order explicit"
          },
          {
            "type": "text",
            "data": "If the chosen downside is $100 and upside is $300, risk-to-reward is 1:3 and reward-to-risk is 3:1. Reversing the label reverses the meaning. Planned price distances are not realized outcomes, probabilities or guaranteed fills."
          },
          {
            "type": "example",
            "data": "With exactly $300 realized wins and $100 realized losses, three wins and seven losses produce 3 × $300 − 7 × $100 = $200 gross. This selected ten-trade example does not establish a strategy edge. Costs, varying sizes and worse exits change the result."
          },
          {
            "type": "example",
            "data": "For those fixed outcomes, gross break-even solves 300p − 100(1 − p) = 0, so p = 25%. At exactly 25%, profit is zero before costs, not positive. A $5 cost per completed trade raises break-even to (100 + 5) ÷ 400 = 26.25% under the same fixed assumptions."
          },
          {
            "type": "tip",
            "data": "There is no universal minimum ratio for day or swing trading. A high planned reward distance does not make the target likely. Review realized sizes, costs, sample selection and uncertainty together."
          }
        ]
      },
      {
        "title": "Diversification Strategies",
        "content": [
          {
            "type": "text",
            "data": "Diversification changes concentration across exposures. It can reduce dependence on one issuer or outcome, but holdings can fall together and correlations change. It cannot guarantee protection from a market decline or permanent loss."
          },
          {
            "type": "example",
            "data": "Invented equal-weight portfolio: $50 in A and $50 in B. If A falls 20% and B rises 10%, values become $40 and $55, totaling $95: a 5% portfolio loss. If both fall 20%, total value is $80, a 20% loss. The second case shows why two names are not loss insurance."
          },
          {
            "type": "list",
            "data": [
              "Look through fund holdings for overlap with directly held stocks.",
              "Compare weights and shared drivers rather than counting ticker symbols.",
              "Cash, bonds, shares and tokens have different risks; none is assigned a guaranteed stability or return tier here.",
              "Rebalancing restores a chosen weighting rule and can incur fees or taxes; it is not automatically a reason to buy a falling asset."
            ]
          },
          {
            "type": "tip",
            "data": "Compare hypothetical concentrated and mixed exposures over the same invented shocks. Document why the comparison is limited rather than choosing an allocation from an age label or promised return."
          }
        ]
      }
    ],
    "quiz": [
      {
        "question": "In the hypothetical 2% worksheet, what is 2% of $100,000?",
        "options": [
          "$500",
          "$1,000",
          "$2,000",
          "$5,000"
        ],
        "correctAnswer": 2,
        "explanation": "In this lesson's 2% example, 0.02 × $100,000 = $2,000."
      },
      {
        "question": "What is the main purpose of a stop-loss order?",
        "options": [
          "To maximize profits",
          "To limit losses on a trade",
          "To buy more shares",
          "To calculate position size"
        ],
        "correctAnswer": 1,
        "explanation": "A stop order attempts to limit losses by triggering a market order. The execution price is not guaranteed."
      },
      {
        "question": "With fixed realized $300 wins and $100 losses, what win rate gives gross break-even before costs?",
        "options": [
          "10%",
          "15%",
          "20%",
          "25%"
        ],
        "correctAnswer": 3,
        "explanation": "300p − 100(1 − p) = 0 gives p = 25%. Exactly 25% is zero gross profit; costs require a higher rate under the same fixed outcomes."
      },
      {
        "question": "Which statement about a crypto allocation is accurate?",
        "options": [
          "50% is always safe",
          "Age alone determines it",
          "No percentage is universally suitable",
          "90% guarantees gains"
        ],
        "correctAnswer": 2,
        "explanation": "No crypto percentage is universally appropriate. Practice weights are assumptions rather than real-money recommendations."
      },
      {
        "question": "Which limitation of diversification is accurate?",
        "options": [
          "It guarantees no losses",
          "Holdings can still decline together",
          "It guarantees a higher return",
          "It removes execution costs"
        ],
        "correctAnswer": 1,
        "explanation": "Different holdings may reduce issuer concentration, but correlated market losses can affect them together. Diversification does not insure the portfolio."
      }
    ],
    "references": [
      {
        "label": "SEC: order types",
        "href": "https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders"
      },
      {
        "label": "SEC: allocation and diversification",
        "href": "https://www.investor.gov/additional-resources/general-resources/publications-research/info-sheets/beginners-guide-asset"
      }
    ]
  },
  {
    "id": 3,
    "title": "Technical Analysis Basics",
    "category": "Analysis",
    "description": "Learn to read charts and identify trading opportunities using technical indicators.",
    "subtopics": [
      {
        "title": "Candlestick Patterns",
        "content": [
          {
            "type": "image",
            "data": "/src/assets/lesson-technical-indicators.jpg",
            "alt": "Technical analysis indicators and trend lines",
            "caption": "Illustration for candlestick patterns."
          },
          {
            "type": "image",
            "data": "/src/assets/lesson-candlestick.jpg",
            "alt": "Candlestick pattern analysis",
            "caption": "Illustration for candlestick patterns."
          },
          {
            "type": "text",
            "data": "Candlesticks summarize open, high, low and close over a stated interval. Common green-up coloring means close above open; the configured colors must be checked. Shape names describe historical observations, not validated forecasts by themselves."
          },
          {
            "type": "example",
            "data": "Open 100, high 105, low 99 and close 103 give a body of 3, upper wick of 2, lower wick of 1 and total range of 6. Close 99 instead would describe a down body of 1 using the same open; the shape changes with the actual data."
          },
          {
            "type": "list",
            "data": [
              "Doji: open and close are close relative to a chosen tolerance and interval.",
              "Hammer: commonly a small body near the upper end with a longer lower wick; definitions vary.",
              "Engulfing: a multi-candle body comparison, so check whether a definition uses bodies or the full high-low range."
            ]
          },
          {
            "type": "tip",
            "data": "Label the symbol, source, interval and definition before identifying a shape. Finding a named pattern after a price move does not establish that it could predict the move in advance."
          }
        ]
      },
      {
        "title": "Support & Resistance Levels",
        "content": [
          {
            "type": "image",
            "data": "/src/assets/lesson-support-resistance.jpg",
            "alt": "Support and resistance levels explained",
            "caption": "Illustration for support & resistance levels."
          },
          {
            "type": "text",
            "data": "Support and resistance are analyst-selected areas where past prices have stopped falling or rising. They are not physical barriers or proof of participant intent. Choice of lookback, tolerance and chart scale affects where they are drawn."
          },
          {
            "type": "example",
            "data": "Hypothetical closes touch 100, rise to 104, return to 100, then close at 97. Two earlier observations near 100 might motivate a support annotation, but the final observation breaks it. Whether a later return to 100 is called resistance must be checked on later data; it is not an automatic role reversal."
          },
          {
            "type": "list",
            "data": [
              "Write the rule before looking at the next observation.",
              "Record failed levels as well as apparent successful reactions.",
              "Compare a zone with a precise line; changing tolerance after the result can overfit the story."
            ]
          },
          {
            "type": "tip",
            "data": "A drawn level does not place an order. Gaps, execution costs and missing liquidity can make the practice assumption differ from a real fill."
          }
        ]
      },
      {
        "title": "Moving Averages (SMA & EMA)",
        "content": [
          {
            "type": "image",
            "data": "/src/assets/lesson-moving-averages.jpg",
            "alt": "Understanding moving averages",
            "caption": "Illustration for moving averages (sma & ema)."
          },
          {
            "type": "text",
            "data": "A simple moving average gives equal weight to the selected observations. An exponential moving average gives more weight to recent observations under a specified smoothing rule. Both summarize past data and can lag a change in direction."
          },
          {
            "type": "example",
            "data": "Three closes of 100, 102 and 104 have a three-observation SMA of (100 + 102 + 104) ÷ 3 = 102. For a three-period EMA, alpha = 2 ÷ (3 + 1) = 0.5. With a previous EMA of 100 and a new close of 104, the next EMA is 0.5 × 104 + 0.5 × 100 = 102. Initialization affects early values."
          },
          {
            "type": "text",
            "data": "A conventional golden cross means the 50-period average crosses above the 200-period average; specify daily or another interval. A death cross is the reverse. These descriptions do not establish a profitable entry or exit, and repeated crossings can occur in sideways data."
          },
          {
            "type": "tip",
            "data": "Compare the same series using two lookbacks and keep the time window fixed. Do not choose a setting only because it fits the most favorable past segment."
          }
        ]
      },
      {
        "title": "RSI & MACD Indicators",
        "content": [
          {
            "type": "heading",
            "data": "RSI: relative average gains and losses"
          },
          {
            "type": "text",
            "data": "Under a common RSI calculation, RSI = 100 − 100 ÷ (1 + average gain / average loss), using a stated lookback and smoothing method. Conventional 70 and 30 thresholds are often called overbought and oversold, but do not guarantee a reversal."
          },
          {
            "type": "example",
            "data": "With an average gain of 2 and average loss of 1 in the same units, relative strength is 2 and RSI is about 66.67. A zero average-loss case needs a defined boundary treatment. RSI can remain elevated or depressed through a continuing trend."
          },
          {
            "type": "heading",
            "data": "MACD: differences between averages"
          },
          {
            "type": "example",
            "data": "Using the conventional 12/26/9 settings, if the 12-period EMA is 105 and 26-period EMA is 103, MACD is 2. If its signal EMA is 1.5, the histogram is 2 − 1.5 = 0.5. The histogram measures that difference, not the price acceleration itself."
          },
          {
            "type": "tip",
            "data": "An indicator divergence compares selected price and indicator observations. It is not proof that a turn is imminent. Document the settings, source and failed examples as well as any apparent signal."
          }
        ]
      }
    ],
    "quiz": [
      {
        "question": "What does a green/white candlestick indicate?",
        "options": [
          "Opening price was higher than closing",
          "Closing price was higher than opening",
          "The stock is overbought",
          "Volume is high"
        ],
        "correctAnswer": 1,
        "explanation": "Green or white candlesticks show bullish movement - the closing price was higher than the opening price."
      },
      {
        "question": "What RSI level typically indicates an oversold condition?",
        "options": [
          "Above 70",
          "Below 30",
          "Exactly 50",
          "Above 80"
        ],
        "correctAnswer": 1,
        "explanation": "Below 30 is a conventional oversold label under common RSI settings. The reading can persist and does not guarantee a bounce."
      },
      {
        "question": "After a price falls through an analyst-selected support area, which statement is accurate?",
        "options": [
          "It must immediately recover",
          "Later reactions must be observed; the area does not automatically become resistance",
          "The exchange guarantees the old level",
          "All market participants have the same entry price"
        ],
        "correctAnswer": 1,
        "explanation": "Support and resistance describe selected historical areas. A later role reversal is an observation to test, not a guaranteed consequence."
      },
      {
        "question": "Under the conventional daily 50/200 definition, what describes a golden cross?",
        "options": [
          "The 200-day average crosses above the 50-day average",
          "The 50-day average crosses above the 200-day average",
          "RSI falls below 30",
          "Volume doubles"
        ],
        "correctAnswer": 1,
        "explanation": "The cross describes two historical averages and their settings. It does not guarantee a future rise or a profitable trade."
      }
    ],
    "references": [
      {
        "label": "Fidelity: RSI definition and limitations",
        "href": "https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/RSI"
      },
      {
        "label": "Fidelity: MACD",
        "href": "https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/macd"
      },
      {
        "label": "Fidelity: simple moving average",
        "href": "https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/sma"
      }
    ]
  },
  {
    "id": 4,
    "title": "Portfolio Diversification",
    "category": "Strategy",
    "description": "Build a balanced portfolio across different asset classes and sectors.",
    "subtopics": [
      {
        "title": "Asset Allocation Strategies",
        "content": [
          {
            "type": "image",
            "data": "/src/assets/lesson-asset-allocation-chart.jpg",
            "alt": "Portfolio asset allocation visualization",
            "caption": "Illustration of portfolio weights, not a recommended allocation."
          },
          {
            "type": "text",
            "data": "Asset allocation describes how value is divided among exposures. Its effect depends on holdings, correlations and the period examined; it does not guarantee performance or universally outrank every other decision."
          },
          {
            "type": "stat",
            "value": "100%",
            "label": "Total Weight in a Normalized Allocation",
            "data": "The selected weights, including cash, should sum to 100%. This is an accounting identity, not evidence that an allocation determines a fixed share of returns."
          },
          {
            "type": "heading",
            "data": "Three hypothetical allocations"
          },
          {
            "type": "text",
            "data": "Compare the following invented weights. None is a suitability assessment or a recommended allocation."
          },
          {
            "type": "example",
            "data": "Hypothetical A: 80% stock exposures, 15% crypto and 5% cash. Weights total 100%; this is not an age-based recommendation and losses can be permanent."
          },
          {
            "type": "example",
            "data": "Hypothetical B: 60% stock exposures, 30% cash and 10% another practice asset. The example does not certify a balanced or suitable real portfolio."
          },
          {
            "type": "example",
            "data": "Hypothetical C: 40% stock exposures and 60% cash. This illustrates a different weighting rather than promising capital preservation or retirement income."
          },
          {
            "type": "highlight",
            "data": "Age alone cannot determine a suitable allocation. Objectives, liabilities, time horizon and ability to bear loss also matter; a simulator cannot make that determination."
          },
          {
            "type": "heading",
            "data": "The 100-Minus-Age Rule"
          },
          {
            "type": "text",
            "data": "The 100-minus-age shortcut is a simplified heuristic, not a suitability assessment:"
          },
          {
            "type": "list",
            "data": [
              "Subtract your age from 100 = % in stocks",
              "Age 25: 75% stocks, 25% bonds/cash",
              "Age 50: 50% stocks, 50% bonds/cash",
              "Age 70: 30% stocks, 70% bonds/cash",
              "This shortcut ignores liabilities, product risks and ability to bear losses; it cannot establish suitability."
            ]
          },
          {
            "type": "tip",
            "data": "Compare hypothetical annual review and threshold rules under the same assumptions. Five-percent drift is an example setting, not a universally appropriate rebalancing trigger."
          }
        ]
      },
      {
        "title": "Balancing Stocks, ETFs & Crypto",
        "content": [
          {
            "type": "text",
            "data": "A mix of tickers can still concentrate the same underlying exposure. An ETF may overlap with individual shares, and tokens can share price drivers or operational dependencies. Inspect the holdings and weights before counting the number of assets."
          },
          {
            "type": "list",
            "data": [
              "Stocks represent issuer ownership; dividends and price gains are not guaranteed.",
              "ETF costs and risks vary. An ETF is not always cheaper than a mutual fund, and a narrowly focused fund may be concentrated.",
              "Crypto assets differ in network design, custody, issuance and market structure. Market-cap rank does not establish a safe tier or higher future reward.",
              "A simulator balance does not reproduce legal ownership, custody failures, taxes or every transaction cost."
            ]
          },
          {
            "type": "example",
            "data": "Suppose an invented fund is 20% company A. A portfolio with $50 directly in A and $50 in that fund has $60 exposure to A: $50 + 20% × $50. Two tickers have not split the exposure equally."
          },
          {
            "type": "tip",
            "data": "Compare a concentrated portfolio with a different weighting under identical price shocks. Explain the overlap rather than selecting a mix from a promised growth or safety label."
          }
        ]
      },
      {
        "title": "Sector Diversification",
        "content": [
          {
            "type": "text",
            "data": "Sector classification groups businesses under a stated framework; it does not guarantee how those businesses respond to an event. Company revenue sources, financing and valuation differ within a sector. Frameworks and classifications can change."
          },
          {
            "type": "list",
            "data": [
              "Specify the classification system and date when using an actual sector list.",
              "Look through fund holdings: two funds can repeat the same sector exposure.",
              "Labels such as cyclical or defensive describe a proposed economic sensitivity, not guaranteed outperformance in a bull or bear market."
            ]
          },
          {
            "type": "example",
            "data": "Invented portfolio: 70% in one sector and 30% elsewhere. If the first falls 20% while the second is unchanged, the portfolio falls 14% before costs. Reversing the weights reduces that particular shock to 6%, but could do worse under a different shock."
          },
          {
            "type": "tip",
            "data": "Write at least two different shock scenarios. A sector rotation story chosen after returns are known is not evidence that the rotation could have been timed in advance."
          }
        ]
      },
      {
        "title": "Rebalancing Your Portfolio",
        "content": [
          {
            "type": "text",
            "data": "Rebalancing restores chosen target weights after values or cash flows change. A calendar date or deviation threshold can define a hypothetical rule; neither is universally optimal. Trades can incur costs, taxes and execution risk."
          },
          {
            "type": "example",
            "data": "Start with invented stock value 60 and bond value 40, a total of 100. If stocks rise to 160 while bonds stay at 40, the new total is 200 and the weights are 80%/20%. Restoring 60%/40% without costs requires selling 40 of stocks and buying 40 of bonds, leaving 120 and 80. The target itself remains an assumption."
          },
          {
            "type": "text",
            "data": "Contributions or withdrawals can also change weights without selling an existing holding. With fees, value is reduced and the required trade amounts differ from the no-cost worksheet. Rebalancing can sell a rising holding or add to a falling one; it does not guarantee a favorable subsequent return."
          },
          {
            "type": "tip",
            "data": "Compare leaving weights alone, calendar rebalancing and threshold rebalancing using the same price path and explicit costs. Keep the comparison separate from a real-money recommendation."
          }
        ]
      }
    ],
    "quiz": [
      {
        "question": "What does changing asset allocation directly change?",
        "options": [
          "A guaranteed future return",
          "The weights of portfolio exposures and their associated risks",
          "The exchange trading schedule",
          "The amount of market risk to exactly zero"
        ],
        "correctAnswer": 1,
        "explanation": "Weights change exposure. Outcomes also depend on holdings, correlations, cash flows, costs and later prices; no allocation guarantees a result."
      },
      {
        "question": "Which statement about a rebalancing rule is accurate?",
        "options": [
          "All portfolios must rebalance daily",
          "Weekly rebalancing always gives the highest return",
          "A calendar or drift threshold is an example to compare, not a universal requirement",
          "Rebalancing eliminates the possibility of losses"
        ],
        "correctAnswer": 2,
        "explanation": "A calendar or drift threshold is one possible practice rule. Its effect depends on costs and the market path; no frequency is universally best."
      }
    ],
    "references": [
      {
        "label": "SEC: allocation, diversification and rebalancing",
        "href": "https://www.investor.gov/additional-resources/general-resources/publications-research/info-sheets/beginners-guide-asset"
      },
      {
        "label": "SEC: single-stock ETFs",
        "href": "https://www.investor.gov/introduction-investing/investing-basics/glossary/single-stock-etfs"
      }
    ]
  },
  {
    "id": 5,
    "title": "Setting Trading Goals",
    "category": "Basics",
    "description": "Define clear objectives and develop a trading plan that works for you.",
    "subtopics": [
      {
        "title": "Short-term vs Long-term Strategies",
        "content": [
          {
            "type": "image",
            "data": "/src/assets/lesson-goals-roadmap.jpg",
            "alt": "Trading goals roadmap with milestones",
            "caption": "Illustration for short-term vs long-term strategies."
          },
          {
            "type": "text",
            "data": "Holding period is one part of a strategy description. Intraday trading generally opens and closes within a session, while swing and longer-term approaches retain exposure across sessions. The labels alone do not define a reliable return, suitable workload or tax outcome."
          },
          {
            "type": "list",
            "data": [
              "Compare the time needed to observe and record decisions under each hypothetical approach.",
              "More transactions can increase costs; actual fees and turnover must be measured rather than assumed from a label.",
              "Holding overnight adds exposure to news and gaps. Holding longer does not ensure recovery or eliminate permanent loss.",
              "Tax treatment depends on jurisdiction, product and account; no universal long-term tax advantage is asserted here."
            ]
          },
          {
            "type": "example",
            "data": "Invented comparison: two approaches each begin at $1,000 and end at $1,020 before costs. If one completes 20 round trips costing $2 each, its ending value is $980; two such round trips leave $1,016. This isolates cost arithmetic and does not establish that either approach could earn the assumed gross result."
          },
          {
            "type": "tip",
            "data": "Choose a practice review task, such as comparing planned and observed costs over a fixed period. No number of study hours or selected profitable months certifies readiness for real-money trading."
          }
        ]
      },
      {
        "title": "Return Assumptions and Practice Goals",
        "content": [
          {
            "type": "text",
            "data": "A practice lesson cannot establish a realistic monthly return from a label such as beginner, intermediate or professional. Outcomes depend on the strategy, exposure, market conditions and costs. A positive practice result is not evidence that the same result can be repeated with real money. Use explicit assumptions for calculations instead of treating a return target as an entitlement."
          },
          {
            "type": "heading",
            "data": "Separate arithmetic from expectations"
          },
          {
            "type": "list",
            "data": [
              "State the period: a monthly rate and an annual rate are different inputs.",
              "State whether gains are reinvested and whether deposits or withdrawals occur.",
              "Identify which costs the example includes and which it leaves out.",
              "A comparison with a fund or index needs a defined period, benchmark and method; no fund ranking is established here."
            ]
          },
          {
            "type": "example",
            "data": "Hypothetical arithmetic: start with $100, gain 10% in month one, then 10% on the new balance in month two. With reinvestment and no costs or cash flows, the balances are $110 and $121. The two-month gain is 21%, not 20%. The assumed gains are inputs, not forecasts."
          },
          {
            "type": "highlight",
            "data": "If a hypothetical 10% gain repeated every month for twelve months, (1.10^12 − 1) × 100 gives about 213.8% annual growth before costs. This shows the compounding implied by the assumption; it does not make such a result typical or achievable."
          },
          {
            "type": "heading",
            "data": "Losses compound too"
          },
          {
            "type": "example",
            "data": "A hypothetical $100 balance that falls 10% becomes $90. A subsequent 10% gain brings it to $99, not back to $100. Recovering from $90 to $100 requires a gain of about 11.1%. The order and size of gains and losses matter when reviewing a record."
          },
          {
            "type": "heading",
            "data": "Use reviewable practice goals"
          },
          {
            "type": "list",
            "data": [
              "Record the reason for each practice decision before checking its outcome.",
              "Compare the intended position size with the position actually entered.",
              "Review losses as well as gains, and identify missing information.",
              "Track costs and cash flows separately from market gains.",
              "Following a plan makes a decision easier to evaluate; it does not guarantee profit."
            ]
          },
          {
            "type": "tip",
            "data": "Choose a review task you can verify, such as checking whether each journal entry contains its original reasoning. Avoid requiring yourself to make a fixed number of trades or a fixed profit merely to meet a practice goal. Record uncertainty when the evidence is too limited to draw a conclusion."
          }
        ]
      },
      {
        "title": "Creating a Trading Journal",
        "content": [
          {
            "type": "text",
            "data": "A journal preserves the reasoning recorded before an outcome. That makes assumptions easier to inspect, but a journal cannot transform an untested idea into a profitable strategy. Record losses and missing information as carefully as gains."
          },
          {
            "type": "list",
            "data": [
              "Record symbol, source, time, units, entry price, fees and the original reason.",
              "Distinguish a planned exit from an actual fill and preserve both values.",
              "Separate market gains from deposits, withdrawals and costs.",
              "Note what was known at the decision time; avoid replacing the original reasoning with a story inferred from the outcome."
            ]
          },
          {
            "type": "example",
            "data": "Invented entry: 50 shares bought at $180 and sold at $185 produce $250 gross, or about 2.78% of the $9,000 purchase notional before costs. A favorable result does not prove that patience, a chart pattern or the written rationale caused it. A comparable losing observation is necessary for an honest review."
          },
          {
            "type": "tip",
            "data": "Paper or a local spreadsheet is enough for a journal. TradeHQ Ghost Journal can record a practice rationale; browser storage can be cleared, so keep any important personal record separately. Do not enter private financial credentials."
          }
        ]
      },
      {
        "title": "Evaluating Your Performance",
        "content": [
          {
            "type": "text",
            "data": "Review a defined observation period, cash flows and costs before comparing results. Total return, realized gains, unrealized changes and trade counts are different measures. A selected winning sample does not establish repeatable skill."
          },
          {
            "type": "list",
            "data": [
              "Realized win rate: share of completed outcomes classified as wins under an explicit cost and matching method. Open positions are not completed wins.",
              "Profit factor: sum of realized gains divided by the absolute sum of realized losses. It is not average win divided by average loss; a zero loss denominator has no finite ratio.",
              "Average gain and average loss need units and a matching method. Larger positions can dominate dollar measures.",
              "A Sharpe ratio compares mean excess return with return standard deviation on a compatible frequency. Benchmark, risk-free assumption and annualization affect the number; higher historical values are not a guarantee."
            ]
          },
          {
            "type": "example",
            "data": "Two gains of $20 and one loss of $10 give profit factor (20 + 20) ÷ 10 = 4. Average gain divided by average loss is 20 ÷ 10 = 2: a different statistic. Costs and the method for closing partial positions can change both."
          },
          {
            "type": "tip",
            "data": "TradeHQ displays simulated account observations. Ask which data and method produced a metric; the mentor price-only sale comparison excludes fees and lot matching and is explicitly not a realized win rate."
          }
        ]
      }
    ],
    "quiz": [
      {
        "question": "In the hypothetical example, what does $100 become after two consecutive 10% gains with no costs or cash flows?",
        "options": [
          "$100",
          "$110",
          "$121",
          "$120"
        ],
        "correctAnswer": 2,
        "explanation": "$100 × 1.10 × 1.10 = $121. The assumed gains illustrate compounding; they are not a forecast."
      },
      {
        "question": "What is a useful reason to keep a practice trading journal?",
        "options": [
          "It guarantees profits",
          "It preserves the original assumptions for later comparison",
          "It replaces transaction records",
          "It proves every successful trade was skill"
        ],
        "correctAnswer": 1,
        "explanation": "A journal makes original reasoning reviewable. A favorable outcome alone does not validate the reasoning or establish predictive skill."
      }
    ],
    "references": [
      {
        "label": "SEC: fees and expenses",
        "href": "https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-2"
      }
    ]
  },
  {
    "id": 6,
    "title": "Market Trends & Patterns",
    "category": "Analysis",
    "description": "Identify market trends and learn how to trade with momentum.",
    "subtopics": [
      {
        "title": "Bull Markets vs Bear Markets",
        "content": [
          {
            "type": "image",
            "data": "/src/assets/lesson-market-trends-arrows.jpg",
            "alt": "Market trend analysis with directional arrows",
            "caption": "Illustration for bull markets vs bear markets."
          },
          {
            "type": "text",
            "data": "Bull and bear market describe sustained rises and declines over a defined market and period. Twenty-percent changes are common conventions, not universal definitions or instructions. An individual share, a price index and a total-return index can tell different stories."
          },
          {
            "type": "example",
            "data": "An invented index rising from 100 to 120 gains 20%. Falling from 120 to 96 then loses 20%, leaving it 4% below the original 100. A percentage decline and equal percentage recovery do not cancel each other."
          },
          {
            "type": "list",
            "data": [
              "State the starting point and whether dividends are included.",
              "A regime label often becomes clear retrospectively; it does not identify the next turning point.",
              "Buying a dip can precede a further decline. Moving to cash can miss a recovery. Neither action follows automatically from the label."
            ]
          },
          {
            "type": "tip",
            "data": "Compare continuation and reversal scenarios from the same starting observation. Avoid selecting only a period in which every dip later recovered."
          }
        ]
      },
      {
        "title": "Identifying Trend Reversals",
        "content": [
          {
            "type": "text",
            "data": "A trend reversal is a change in a chosen historical trend definition. In real time, the next observations are unknown. Moving-average crosses, divergences and chart shapes can produce false or late descriptions; none is a reliable turning-point detector by itself."
          },
          {
            "type": "example",
            "data": "Hypothetical closes rise 100, 102, 104, then fall 103, 101, 99. A three-close average moves from 102 to 103 to about 102.67 to 101. The average turns after the price peak, illustrating lag rather than an advance warning."
          },
          {
            "type": "list",
            "data": [
              "Define the trend rule, interval and lookback before evaluating it.",
              "Record cases where an apparent turn resumed the prior direction.",
              "Distinguish a price-indicator divergence from proof of future momentum; settings change the comparison."
            ]
          },
          {
            "type": "tip",
            "data": "A retrospective annotation is useful for describing a chart. To evaluate predictive value would require a defined method, unseen data and realistic costs; this exercise does not establish that value."
          }
        ]
      },
      {
        "title": "Volume Analysis",
        "content": [
          {
            "type": "text",
            "data": "Volume counts traded units during a specified interval and coverage. Every executed transaction has a buyer and a seller, so a large bar alone does not reveal which side has superior information or whether institutions are accumulating."
          },
          {
            "type": "example",
            "data": "If the chosen historical average is 1,000 units and the current comparable interval trades 3,000, volume is three times that average. That arithmetic does not establish a continuation probability. A subsequent price can rise, fall or remain flat."
          },
          {
            "type": "list",
            "data": [
              "Keep intervals comparable: a partial session and a complete session can be misleading to compare.",
              "State whether volume covers one venue or a consolidated feed, and check for missing data.",
              "A price breakout with higher volume records price and activity observations; it does not confirm a real breakout or guarantee follow-through."
            ]
          },
          {
            "type": "tip",
            "data": "TradeHQ may display cached provider observations or generated chart data. A generated volume bar is a practice illustration, not evidence of actual market orders or participant intent."
          }
        ]
      },
      {
        "title": "Market Sentiment Indicators",
        "content": [
          {
            "type": "heading",
            "data": "Volatility is not direction"
          },
          {
            "type": "text",
            "data": "The Cboe VIX Index derives an annualized, approximately 30-day expected volatility measure from S&P 500 index option prices. It is not a forecast that shares will rise or fall, and expected volatility can differ from realized volatility. Fixed VIX thresholds do not identify a guaranteed market top or bottom."
          },
          {
            "type": "heading",
            "data": "Specify the put/call ratio basis"
          },
          {
            "type": "example",
            "data": "An invented interval with 600 put contracts and 400 call contracts traded has a volume put/call ratio of 600 ÷ 400 = 1.5. An open-interest ratio uses outstanding contracts instead and can be different. Specify market coverage, date and basis before comparing ratios."
          },
          {
            "type": "text",
            "data": "Puts and calls can be bought or written, used for hedges or combined with other positions. A headline ratio does not reveal net directional intent or establish a contrarian trade. Survey responses and social posts also represent selected populations, not every investor."
          },
          {
            "type": "tip",
            "data": "Record what an indicator measures and what it cannot establish. Compare two possible later price paths under the same indicator observation instead of treating fear or optimism as a timing rule."
          }
        ]
      }
    ],
    "quiz": [
      {
        "question": "What characterizes a bull market?",
        "options": [
          "Falling prices and pessimism",
          "Rising prices and optimism",
          "Sideways movement",
          "High volatility only"
        ],
        "correctAnswer": 1,
        "explanation": "Bull markets are characterized by rising prices, investor optimism, and confidence in economic growth."
      },
      {
        "question": "What does higher traded volume during a price breakout establish by itself?",
        "options": [
          "A guaranteed reversal",
          "More units traded in the specified interval and coverage",
          "That institutions are buying rather than selling",
          "A guaranteed continuation"
        ],
        "correctAnswer": 1,
        "explanation": "Volume describes activity, not superior information or the next price direction. Check the interval, coverage and whether data are provider observations or generated examples."
      }
    ],
    "references": [
      {
        "label": "Cboe: VIX overview and methodology",
        "href": "https://www.cboe.com/tradable-products/vix"
      },
      {
        "label": "Cboe: put/call market statistics",
        "href": "https://www.cboe.com/markets/us/options/market-statistics/daily"
      }
    ]
  }
];
