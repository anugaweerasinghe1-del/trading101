import type { DailyBatch } from "../../supabase/functions/_shared/dailyPractice";
/** Original hypothetical cases with ten linked scored questions and worked explanations. */
export const starterPracticeBank: DailyBatch = {
  "id": "authored-2026-10-depth",
  "effectiveFrom": "2026-10-09",
  "exercises": [
    {
      "id": "practice-01",
      "title": "A rising coin, a mostly cash account",
      "category": "Portfolio arithmetic",
      "scenario": "A hypothetical account starts with $80,000 cash and a $20,000 Bitcoin position. Bitcoin then rises by 10%. No trades, deposits, withdrawals or fees occur during this interval. A friend says the account must also be up 10%. Work through the position value and the cash separately before judging that claim.\n\nFollow the account through a second hypothetical interval: after the rise, the Bitcoin holding falls 10% from its new $22,000 value. Cash still earns nothing and no trade occurs. Compare the final account with both its original value and its peak. A classmate proposes selling enough Bitcoin at the peak to restore the original 20% allocation; treat that as a separate, fee-free worksheet, not an automatic simulator order. Keep those branches separate.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Cash",
            "value": 80000
          },
          {
            "label": "BTC before",
            "value": 20000
          },
          {
            "label": "BTC after",
            "value": 22000
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the Bitcoin position worth after the rise?",
          "options": [
            "$22,000",
            "$30,000",
            "$20,010"
          ],
          "correctAnswer": 0,
          "explanation": "Multiply the $20,000 position by 1.10. The $2,000 gain belongs to the invested portion. A quoted percentage change describes the asset, not automatically every account that holds it."
        },
        {
          "prompt": "What is the return of the entire account in this case?",
          "options": [
            "2%",
            "10%",
            "20%"
          ],
          "correctAnswer": 0,
          "explanation": "Cash remains $80,000 and the position becomes $22,000, giving $102,000 total. Divide the $2,000 account gain by the original $100,000. That is 2%, before any costs excluded from this case."
        },
        {
          "prompt": "Which denominator gives the new Bitcoin allocation?",
          "options": [
            "$102,000 total account value",
            "$100,000 starting value",
            "$22,000 position value"
          ],
          "correctAnswer": 0,
          "explanation": "The new weight is $22,000 divided by $102,000, approximately 21.57%. Using the original balance gives 22%, but that is not the current portfolio weight because total value changed."
        },
        {
          "prompt": "After the second 10% move down, what is the Bitcoin holding worth?",
          "options": [
            "$20,000",
            "$18,000",
            "$19,800"
          ],
          "correctAnswer": 2,
          "explanation": "Apply 0.90 to $22,000 to get $19,800. Equal opposite percentage moves use different bases, so they do not cancel and restore the original position value."
        },
        {
          "prompt": "What is the account worth after that second interval?",
          "options": [
            "$98,000",
            "$99,800",
            "$100,000"
          ],
          "correctAnswer": 1,
          "explanation": "Add unchanged $80,000 cash to the $19,800 holding. The account ends $200 below its original $100,000 despite the earlier asset rally."
        },
        {
          "prompt": "What is the account’s full-period return across both intervals?",
          "options": [
            "−0.2%",
            "−2%",
            "0%"
          ],
          "correctAnswer": 0,
          "explanation": "Divide the $200 loss by the original $100,000 account. The asset loses 1% across the sequence, but its original account weight was only 20%."
        },
        {
          "prompt": "At the $102,000 peak, what Bitcoin value equals a 20% target?",
          "options": [
            "$20,000",
            "$22,000",
            "$20,400"
          ],
          "correctAnswer": 2,
          "explanation": "Twenty percent of current $102,000 equity is $20,400. A $20,000 holding would be slightly below the target because the portfolio denominator has changed."
        },
        {
          "prompt": "In the separate fee-free rebalancing branch, how much Bitcoin value would be sold?",
          "options": [
            "$400",
            "$1,600",
            "$2,000"
          ],
          "correctAnswer": 1,
          "explanation": "Subtract the $20,400 target from the $22,000 holding. Selling $1,600 transfers value to cash and leaves equity unchanged when transaction fees are excluded."
        },
        {
          "prompt": "What is the decline from the $102,000 account peak to $99,800, approximately?",
          "options": [
            "2.16%",
            "0.2%",
            "10%"
          ],
          "correctAnswer": 0,
          "explanation": "The peak-to-current loss is $2,200. Divide by the $102,000 peak, rather than the original account balance, to obtain approximately 2.16%."
        },
        {
          "prompt": "Which statement distinguishes the two account branches accurately?",
          "options": [
            "The price refresh automatically performs the rebalance",
            "A 20% target guarantees a 20% account return",
            "Rebalancing changes exposure through a separate order"
          ],
          "correctAnswer": 2,
          "explanation": "A price refresh only marks existing units. A rebalance changes units and cash through orders; choosing an allocation does not guarantee the resulting return."
        }
      ],
      "reflection": "Why can an accurate asset return still produce a misleading account-return claim?",
      "reflectionGuide": "Name the share of money exposed to the move, show the unchanged cash, and use starting account value for return. Distinguish that calculation from current allocation, which uses the new total.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-11",
      "title": "The unchanged-price round trip",
      "category": "Costs and orders",
      "scenario": "You buy $1,000 of a hypothetical asset and later sell the same quantity at the same quote. Apply a 0.1% fee to each $1,000 transaction. There is no spread or slippage in this worksheet. The price chart is flat, but the cash ledger will not be. Work out the two separate charges before describing the result.\n\nRepeat the same flat-price round trip five times as a separate worksheet. Each transaction still has $1,000 notional, the quote never moves, and only the 0.1% fee applies. Compare activity count with accumulated cost. Then identify what a small price gain would need to cover before the round trip becomes profitable. A flat chart does not imply an unchanged cash ledger.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Buy notional",
            "value": 1000
          },
          {
            "label": "Sell notional",
            "value": 1000
          },
          {
            "label": "Each fee",
            "value": 1
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the fee on the $1,000 buy?",
          "options": [
            "$10",
            "$0.10",
            "$1"
          ],
          "correctAnswer": 2,
          "explanation": "A 0.1% fee is 0.001 times the trade value. Multiplying $1,000 by 0.001 gives $1. Converting a percentage to a decimal correctly matters before using any fee estimate."
        },
        {
          "prompt": "What is the net result of the flat-price round trip?",
          "options": [
            "No gain or loss",
            "A $1 gain",
            "A $2 loss"
          ],
          "correctAnswer": 2,
          "explanation": "The buy debits $1,001 and the sale credits $999. Subtract the debit from the credit to obtain −$2. The asset made no price gain, but both fees affected the account."
        },
        {
          "prompt": "Would doubling the number of identical round trips remove that loss?",
          "options": [
            "Yes; fees cancel each other",
            "Yes; a flat price ensures break-even",
            "No; it doubles these assumed fees"
          ],
          "correctAnswer": 2,
          "explanation": "Two identical round trips incur $4 of fees under these inputs. More activity alone does not create an edge. This case deliberately excludes other execution costs, so real-world costs could differ."
        },
        {
          "prompt": "What is total notional for one complete $1,000 buy and $1,000 sell?",
          "options": [
            "$0",
            "$2,000",
            "$1,000"
          ],
          "correctAnswer": 1,
          "explanation": "The buy and sale each count toward turnover, giving $2,000 total. Turnover measures traded notional, not equity earned or the final holding remaining."
        },
        {
          "prompt": "What net cash arrives from the unchanged-price $1,000 sale?",
          "options": [
            "$999",
            "$1,000",
            "$1,001"
          ],
          "correctAnswer": 0,
          "explanation": "Subtract the $1 sale fee from $1,000 gross proceeds. The buy fee is separate and must also be counted when reviewing the entire round trip."
        },
        {
          "prompt": "How many transactions occur across five of these round trips?",
          "options": [
            "5 transactions",
            "20 transactions",
            "10 transactions"
          ],
          "correctAnswer": 2,
          "explanation": "Each round trip includes one buy and one sell. Five completed pairs therefore contain ten fee-bearing transactions rather than only five."
        },
        {
          "prompt": "What total fee is charged across those five flat-price round trips?",
          "options": [
            "$2",
            "$10",
            "$5"
          ],
          "correctAnswer": 1,
          "explanation": "Ten transactions each cost $1, giving $10 total fees. The absence of price movement does not erase the accumulated costs of repeated activity."
        },
        {
          "prompt": "What combined gross price gain would cover those $10 fees exactly?",
          "options": [
            "$10",
            "$0",
            "$5"
          ],
          "correctAnswer": 0,
          "explanation": "Net result equals gross price gain minus costs. In this fixed-notional worksheet, a $10 gross gain covers the stated $10 charges without creating positive net profit."
        },
        {
          "prompt": "Does a fee-free hypothetical chart establish a fee-free execution ledger?",
          "options": [
            "Yes; all flat charts imply zero costs",
            "Yes; a plotted quote already includes every user fee",
            "No; the transaction rules must also be checked"
          ],
          "correctAnswer": 2,
          "explanation": "A chart records prices, while an execution ledger records units, cash and applicable charges. The two must be combined before evaluating net performance."
        },
        {
          "prompt": "Which record would make this repeated-trading review reproducible?",
          "options": [
            "Only the final asset symbol",
            "Both transaction notionals and each fee",
            "Only the count of profitable-looking charts"
          ],
          "correctAnswer": 1,
          "explanation": "Recording the buy and sell notionals and charges lets another reader reconstruct net cash. A chart or trade count alone does not identify the costs."
        }
      ],
      "reflection": "What should your journal say when the chart is flat but equity is lower?",
      "reflectionGuide": "Reconcile the two fee entries rather than blaming an unexplained price change. Mark the excluded spread and slippage assumptions so the worksheet is not mistaken for a complete real execution model.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-21",
      "title": "A snapshot has an observation time",
      "category": "Price data",
      "scenario": "A screen refreshes at 10:05 but shows a provider observation stamped 10:02. A different website displays a newer-looking number without a timestamp. All times are hypothetical. Before declaring one quote incorrect, distinguish when the page loaded from when the underlying price was observed, and check the asset identifier and currency.\n\nNow the page is opened again at 10:08, but its provider observation still says 10:02. The displayed mark has not acquired a new observation merely because it was fetched again. A second page identifies the same asset in USD at 10:07. Compare the ages before comparing the prices. A cached quote may remain useful for a labelled valuation even when it is unsuitable for a claim about the current market.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "minute after 10:00",
        "bars": [
          {
            "label": "Observed",
            "value": 2
          },
          {
            "label": "Page loaded",
            "value": 5
          }
        ]
      },
      "questions": [
        {
          "prompt": "How old is the stated observation at the 10:05 refresh?",
          "options": [
            "Five hours",
            "Three minutes",
            "Zero minutes"
          ],
          "correctAnswer": 1,
          "explanation": "Subtract 10:02 from 10:05 to get three minutes. Refreshing a page does not necessarily obtain a new market observation; it can display a cached provider response with an older timestamp."
        },
        {
          "prompt": "Which timestamp best describes the age of the quote itself?",
          "options": [
            "The time your account was created",
            "The provider observation time",
            "Only the page refresh time"
          ],
          "correctAnswer": 1,
          "explanation": "The observation timestamp belongs to the price data. The loading timestamp describes the interface request. Both can be useful, but substituting the latter can make an old observation appear newly priced."
        },
        {
          "prompt": "What should be checked before comparing the other website’s number?",
          "options": [
            "Only the website’s font size",
            "Matching asset, currency, time and methodology",
            "Only which number is larger"
          ],
          "correctAnswer": 1,
          "explanation": "Two plausible prices can refer to different currencies, timestamps or market sources. An identifier and methodology check helps make the comparison meaningful; a visual difference alone does not establish an error."
        },
        {
          "prompt": "At the later 10:08 page visit, how old is the unchanged 10:02 observation?",
          "options": [
            "Six minutes",
            "One minute",
            "Zero minutes"
          ],
          "correctAnswer": 0,
          "explanation": "Subtract the observation time from the viewing time. Fetching the same mark again at 10:08 does not reset its underlying age to zero."
        },
        {
          "prompt": "How old is the second page’s 10:07 observation at 10:08?",
          "options": [
            "Six minutes",
            "Eight minutes",
            "One minute"
          ],
          "correctAnswer": 2,
          "explanation": "The second observation was recorded one minute before viewing. Its age differs from the first page even though both are inspected at the same time."
        },
        {
          "prompt": "Which stored field should remain unchanged when the same observation is served again?",
          "options": [
            "The price silently converted into a forecast",
            "The original observation timestamp",
            "The original observation rewritten to 10:08"
          ],
          "correctAnswer": 1,
          "explanation": "A cache read should preserve the source observation’s timestamp. The response can have a new fetch time without suggesting the underlying price was observed again."
        },
        {
          "prompt": "Can a six-minute-old observation alone establish the price at 10:08?",
          "options": [
            "No; it establishes a mark observed at 10:02",
            "Yes; every successful fetch is a current quote",
            "Yes; caching freezes the real market"
          ],
          "correctAnswer": 0,
          "explanation": "The mark describes the supplied observation time. Markets may move between observations, so a successful cached response is not proof of the current price."
        },
        {
          "prompt": "What identifier check should precede this timestamp comparison?",
          "options": [
            "Matching font and display precision only",
            "Matching website refresh animation",
            "The same provider asset and quote currency"
          ],
          "correctAnswer": 2,
          "explanation": "Even simultaneous observations are not comparable if they identify different instruments or currencies. Resolve identity and units before attributing a difference to freshness."
        },
        {
          "prompt": "Which label communicates the first page’s data most accurately at 10:08?",
          "options": [
            "Verified execution available at this price",
            "Provider snapshot observed 10:02, fetched 10:08",
            "Real-time price observed 10:08"
          ],
          "correctAnswer": 1,
          "explanation": "The label separates quote observation from page retrieval. It describes the available snapshot without promising current data or execution at a particular venue."
        },
        {
          "prompt": "What would strengthen a claim that one of these feeds is incorrect?",
          "options": [
            "Matched-identity, matched-time evidence and provider methodology",
            "A price difference with no timestamps",
            "A faster refresh icon"
          ],
          "correctAnswer": 0,
          "explanation": "A time-aligned comparison can narrow alternative explanations such as different observation windows. Price differences alone do not establish which data source is wrong."
        }
      ],
      "reflection": "Write an honest freshness label for this screen.",
      "reflectionGuide": "Say “page loaded at 10:05; quote observed at 10:02.” Avoid calling it a continuous tick feed. Mention the missing timestamp when describing the competing quote instead of assuming it is fresher.",
      "sources": [
        {
          "label": "CoinGecko — Price methodology",
          "url": "https://www.coingecko.com/en/methodology"
        }
      ]
    },
    {
      "id": "practice-31",
      "title": "An ETF can overlap a stock you own",
      "category": "Risk and uncertainty",
      "scenario": "Your hypothetical $10,000 account holds $2,000 of stock A and $8,000 of an ETF. For this worksheet the ETF has a fixed 10% exposure to stock A. Ignore other assets, fees and changing weights. Although you see two account rows, part of both rows depends on the same company. Look through the fund rather than counting labels.\n\nIn a separate sensitivity worksheet, stock A falls 20% and every other ETF holding stays unchanged. Keep the ETF’s 10% A weight fixed for this calculation, with no fees or trades. Trace the direct holding and the indirect slice separately before adding their losses. The result is conditional on these assumptions; actual fund weights and other constituents can also change.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Direct A",
            "value": 2000
          },
          {
            "label": "A inside ETF",
            "value": 800
          },
          {
            "label": "Other ETF holdings",
            "value": 7200
          }
        ]
      },
      "questions": [
        {
          "prompt": "How much indirect A exposure is inside the ETF?",
          "options": [
            "$800",
            "$8,000",
            "$200"
          ],
          "correctAnswer": 0,
          "explanation": "Ten percent of the $8,000 ETF position is $800 under the assumed fixed weight. A fund holding can contain exposure to an asset already held directly, even though it appears as another row."
        },
        {
          "prompt": "What is the combined direct and indirect A exposure?",
          "options": [
            "$2,800",
            "$2,000",
            "$10,000"
          ],
          "correctAnswer": 0,
          "explanation": "Add the $2,000 direct holding and $800 look-through exposure. The resulting $2,800 is 28% of this $10,000 account. Counting the ETF as completely unrelated would miss the overlap."
        },
        {
          "prompt": "Does owning two rows guarantee broad diversification?",
          "options": [
            "No; underlying exposures can overlap",
            "Yes; row count is the diversification measure",
            "Yes; any ETF eliminates company risk"
          ],
          "correctAnswer": 0,
          "explanation": "Diversification depends on what the instruments expose you to, not just how many names are displayed. A fund may hold many securities, but its overlap with direct positions can still increase concentration."
        },
        {
          "prompt": "What percentage of the account is directly invested in A?",
          "options": [
            "10%",
            "28%",
            "20%"
          ],
          "correctAnswer": 2,
          "explanation": "The direct $2,000 A position divided by $10,000 equity is 20%. Indirect exposure must be considered separately before computing the combined company sensitivity."
        },
        {
          "prompt": "What percentage of account equity is indirectly exposed to A through the ETF?",
          "options": [
            "80%",
            "8%",
            "10%"
          ],
          "correctAnswer": 1,
          "explanation": "The ETF’s $800 A slice divided by $10,000 account equity is 8%. The fund’s own 10% holding weight is not the whole account’s indirect exposure."
        },
        {
          "prompt": "What is total account weight dependent on A under the stated look-through method?",
          "options": [
            "28%",
            "20%",
            "90%"
          ],
          "correctAnswer": 0,
          "explanation": "Add 20% direct and 8% indirect company exposure. Counting the ETF as unrelated merely because it is a second row would miss the overlap."
        },
        {
          "prompt": "How much does the direct A holding lose in the 20% decline branch?",
          "options": [
            "$200",
            "$560",
            "$400"
          ],
          "correctAnswer": 2,
          "explanation": "Apply the selected 20% decline to the direct $2,000 position. The resulting $400 loss excludes the additional A exposure inside the ETF."
        },
        {
          "prompt": "How much does the ETF’s A slice lose in this branch?",
          "options": [
            "$400",
            "$160",
            "$800"
          ],
          "correctAnswer": 1,
          "explanation": "Apply 20% to the ETF’s $800 A exposure. Other constituents are assumed unchanged, so this $160 loss is the ETF’s supplied contribution from A."
        },
        {
          "prompt": "What is the combined account loss due to this A-only move?",
          "options": [
            "$560",
            "$400",
            "$2,000"
          ],
          "correctAnswer": 0,
          "explanation": "Add the $400 direct loss and $160 indirect loss. The $560 total is 5.6% of account equity under the fixed-weight, other-assets-unchanged assumptions."
        },
        {
          "prompt": "What change would invalidate treating this sensitivity as a complete account forecast?",
          "options": [
            "Only the ETF name remaining the same",
            "Only two rows being visible",
            "Other fund holdings or weights also moving"
          ],
          "correctAnswer": 2,
          "explanation": "The worksheet isolates one company and freezes other inputs. Actual changes in constituents, weights or costs require a broader calculation and cannot be inferred from this isolated branch."
        }
      ],
      "reflection": "What fund information would you inspect beyond this worksheet?",
      "reflectionGuide": "Check the actual holdings, weights and date of disclosure. The assumed 10% is not a live ETF fact. Look for sector and company overlap as well as the number of fund constituents.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-41",
      "title": "A good process can have a losing outcome",
      "category": "Decision habits",
      "scenario": "Two learners each make one hypothetical decision. One records evidence, exposure and a review condition, then loses $50. The other skips those steps and gains $50. A single result cannot tell you which process is repeatable. Evaluate what was known at decision time separately from the outcome that became visible later.\n\nFor a separate process check, use a three-item checklist: recorded evidence, recorded exposure and a recorded review condition. Learner A recorded all three; learner B recorded none. This checklist is not a validated skill score or proof of future profitability. Use it to identify documented versus missing steps, then decide how repeated observations could support a fairer comparison than one $50 outcome.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$ outcome magnitude",
        "bars": [
          {
            "label": "Documented loss",
            "value": 50
          },
          {
            "label": "Undocumented gain",
            "value": 50
          }
        ]
      },
      "questions": [
        {
          "prompt": "Does the winning result prove the undocumented process was better?",
          "options": [
            "Yes; every profitable decision is well reasoned",
            "Yes; evidence matters only after a loss",
            "No; one outcome cannot establish that"
          ],
          "correctAnswer": 2,
          "explanation": "An outcome is one observation produced under uncertainty. It can be favorable despite a weak process or unfavorable despite careful reasoning. Assessing the pre-decision evidence avoids judging everything through hindsight."
        },
        {
          "prompt": "What should a process review examine first?",
          "options": [
            "Only the final profit color",
            "Only whether a friend agreed afterward",
            "The information and rules available before acting"
          ],
          "correctAnswer": 2,
          "explanation": "Review the dated thesis, exposure and decision criteria before adding later information. That preserves a fair account of what could reasonably have been considered and makes later changes to the thesis visible."
        },
        {
          "prompt": "What would help compare the methods over time?",
          "options": [
            "Deleting the losing decision",
            "Calling either method certain after one result",
            "Consistent prospective records across more decisions"
          ],
          "correctAnswer": 2,
          "explanation": "A complete sequence of records can reveal repeated weaknesses or strengths better than a selected result. It still needs context and uncertainty; prospective documentation reduces retrospective storytelling and omitted failures."
        },
        {
          "prompt": "How many of the three defined documentation items did A record?",
          "options": [
            "Zero",
            "Three",
            "One"
          ],
          "correctAnswer": 1,
          "explanation": "The case explicitly records evidence, exposure and a review condition for A. Counting those items measures documentation completeness under this narrow worksheet definition."
        },
        {
          "prompt": "How many of those defined documentation items did B record?",
          "options": [
            "Zero",
            "Three",
            "One"
          ],
          "correctAnswer": 0,
          "explanation": "The case says B skipped the listed steps. That creates a documentation gap even though B’s one supplied outcome happened to be profitable."
        },
        {
          "prompt": "What outcome difference separates B’s +$50 from A’s −$50?",
          "options": [
            "$50",
            "$0",
            "$100"
          ],
          "correctAnswer": 2,
          "explanation": "Subtract −$50 from +$50 to obtain a $100 gap. This single dollar comparison describes outcomes without establishing which process is repeatable."
        },
        {
          "prompt": "Does A’s complete checklist prove the next decision will win?",
          "options": [
            "Yes; a review condition eliminates uncertainty",
            "No; documentation is not a profit guarantee",
            "Yes; all recorded processes are profitable"
          ],
          "correctAnswer": 1,
          "explanation": "A documented process can make assumptions reviewable, but the supplied checklist does not remove uncertainty or validate future returns."
        },
        {
          "prompt": "Which record helps assess whether each learner followed their stated plan?",
          "options": [
            "The original dated plan and the actual actions",
            "Only the final profit number",
            "Only the winner’s username"
          ],
          "correctAnswer": 0,
          "explanation": "Comparing a plan written before the outcome with the subsequent actions distinguishes adherence from a story reconstructed after the result."
        },
        {
          "prompt": "What would make a repeated comparison more informative?",
          "options": [
            "Selecting only the best decision from each learner",
            "Changing the checklist to fit each outcome",
            "Consistent inclusion rules, comparable exposure and costs"
          ],
          "correctAnswer": 2,
          "explanation": "Comparable records and predefined inclusion reduce selective interpretation. Exposure and costs affect outcomes, so a fair comparison requires more than repeating profit headlines."
        },
        {
          "prompt": "What feedback matches A’s single losing case without overclaiming?",
          "options": [
            "The loss proves A should double the next position",
            "The documented steps can be reviewed separately from the loss",
            "The loss proves all three steps were useless"
          ],
          "correctAnswer": 1,
          "explanation": "The case permits a review of evidence, exposure and conditions independently of one outcome. It does not justify discarding the process or increasing risk automatically."
        }
      ],
      "reflection": "How would you review the losing decision without automatically calling it foolish?",
      "reflectionGuide": "Compare the planned reasoning with the evidence available then, note execution and costs, and identify what changed. Keep the loss in the record while avoiding a claim that good preparation guarantees success.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-02",
      "title": "Two unequal positions fall together",
      "category": "Portfolio arithmetic",
      "scenario": "Consider $60,000 cash, $30,000 in a stock and $10,000 in a crypto asset. The stock falls 5% while the crypto falls 20%. Treat these as simultaneous hypothetical moves with no trades or fees. Both position losses matter, but averaging the two percentage changes ignores how much money was invested in each.\n\nAfter the simultaneous declines, consider a follow-up interval: the stock rebounds 5% from its reduced value while crypto rebounds 20% from its reduced value. Cash stays unchanged. Prepare an account-value bridge showing both invested contributions and cash. These selected moves are worksheet inputs, not forecasts. Distinguish each holding’s own return from its contribution to the starting account, and check whether the two rebounds restore the original total.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Stock start",
            "value": 30000
          },
          {
            "label": "Crypto start",
            "value": 10000
          },
          {
            "label": "Cash",
            "value": 60000
          }
        ]
      },
      "questions": [
        {
          "prompt": "How much does the stock position lose?",
          "options": [
            "$5,000",
            "$150",
            "$1,500"
          ],
          "correctAnswer": 2,
          "explanation": "The loss is $30,000 multiplied by 0.05, or $1,500. A price move must be applied to the dollars held in that asset; it is not applied to cash or to another position."
        },
        {
          "prompt": "What is the combined account loss?",
          "options": [
            "$12,500",
            "$2,000",
            "$3,500"
          ],
          "correctAnswer": 2,
          "explanation": "The crypto loses $10,000 × 20% = $2,000. Add the $1,500 stock loss to obtain $3,500. The account becomes $96,500, so its return is −3.5% under the stated assumptions."
        },
        {
          "prompt": "Why is a simple average of −5% and −20% unsuitable here?",
          "options": [
            "Cash must lose 12.5% too",
            "Losses cannot be added",
            "The positions have different dollar weights"
          ],
          "correctAnswer": 2,
          "explanation": "A simple average assumes equal exposure to the two assets and omits cash. Dollar-weighted changes preserve the different position sizes. Neither asset volatility nor the number of holdings alone supplies the missing weights."
        },
        {
          "prompt": "How much does the crypto holding lose in the first interval?",
          "options": [
            "$6,000",
            "$2,000",
            "$200"
          ],
          "correctAnswer": 1,
          "explanation": "Twenty percent of the $10,000 crypto position is $2,000. Applying that percentage to the stock position or the whole account would use the wrong exposure."
        },
        {
          "prompt": "What is total equity immediately after both initial declines?",
          "options": [
            "$96,500",
            "$87,500",
            "$100,000"
          ],
          "correctAnswer": 0,
          "explanation": "The stock becomes $28,500 and crypto becomes $8,000. Add $60,000 cash to obtain $96,500, a $3,500 account loss."
        },
        {
          "prompt": "What contribution does the stock loss make to starting-account return?",
          "options": [
            "−5 percentage points",
            "−30 percentage points",
            "−1.5 percentage points"
          ],
          "correctAnswer": 2,
          "explanation": "The stock loses $1,500 on a $100,000 starting account. Its own return is −5%, but its contribution to whole-account return is −1.5 percentage points."
        },
        {
          "prompt": "What is the stock value after its separate 5% rebound?",
          "options": [
            "$31,500",
            "$29,925",
            "$30,000"
          ],
          "correctAnswer": 1,
          "explanation": "Apply 1.05 to $28,500, giving $29,925. The rebound starts from a smaller base than the original decline and therefore does not fully reverse it."
        },
        {
          "prompt": "What is the crypto value after its separate 20% rebound?",
          "options": [
            "$9,600",
            "$10,000",
            "$12,000"
          ],
          "correctAnswer": 0,
          "explanation": "Multiply the reduced $8,000 position by 1.20. The $1,600 rebound is smaller than the earlier $2,000 loss because the percentage denominator changed."
        },
        {
          "prompt": "What is final account equity after both stated rebounds?",
          "options": [
            "$100,000",
            "$103,500",
            "$99,525"
          ],
          "correctAnswer": 2,
          "explanation": "Add $60,000 cash, $29,925 stock and $9,600 crypto. The account is still $475 below its original value despite both holdings’ positive second intervals."
        },
        {
          "prompt": "Which comparison describes the initial dollar loss contributions correctly?",
          "options": [
            "Both lost equally because both prices fell",
            "Crypto lost more dollars despite the smaller position",
            "Stock lost more because its position was larger"
          ],
          "correctAnswer": 1,
          "explanation": "Crypto lost $2,000 and stock lost $1,500. Dollar impact depends on position size and percentage move together, rather than either one considered alone."
        }
      ],
      "reflection": "Explain which position contributed more to the loss and why.",
      "reflectionGuide": "The smaller crypto position lost $2,000, exceeding the stock’s $1,500 loss because its assumed decline was much larger. Discuss both size and price change rather than treating either factor as the whole explanation.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-12",
      "title": "A sale fee uses the exit value",
      "category": "Costs and orders",
      "scenario": "A hypothetical position was bought for $2,000 before its buy fee. Its market value is now $2,200 and you sell it all. Use a 0.1% fee on each transaction’s actual notional value. The sale fee is based on $2,200, not on the original $2,000 purchase or on the $200 gross price gain.\n\nAssume the full position is sold at the stated $2,200 value and no other account activity occurs. Build a cash bridge from original purchase debit to net proceeds. Then test a separate exit at $1,800 using the same fee rate. Treat the two exits as alternative branches, not consecutive sales of the same holding. The fee depends on each branch’s actual exit value.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Buy value",
            "value": 2000
          },
          {
            "label": "Sale value",
            "value": 2200
          },
          {
            "label": "Gross gain",
            "value": 200
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the sale fee under the stated rule?",
          "options": [
            "$0.20",
            "$2.20",
            "$2"
          ],
          "correctAnswer": 1,
          "explanation": "Multiply the $2,200 exit notional by 0.001. That gives $2.20. A fee on the transaction’s whole value differs from a tax or charge calculated only on profit."
        },
        {
          "prompt": "What net sale proceeds reach cash?",
          "options": [
            "$197.80",
            "$2,197.80",
            "$2,200"
          ],
          "correctAnswer": 1,
          "explanation": "Subtract the $2.20 sale fee from $2,200 gross proceeds. The $2,197.80 cash credit contains original capital and gain. It should not all be reported as profit."
        },
        {
          "prompt": "What is the net gain after the $2 buy fee and sale fee?",
          "options": [
            "$197.80",
            "$195.80",
            "$200"
          ],
          "correctAnswer": 1,
          "explanation": "The original cash debit was $2,002. Compare it with $2,197.80 net proceeds to get $195.80. Both fee bases are their respective trade values, and each fee is counted once."
        },
        {
          "prompt": "What initial cash outlay includes the $2,000 purchase and its fee?",
          "options": [
            "$2,002",
            "$2,000",
            "$2,200"
          ],
          "correctAnswer": 0,
          "explanation": "The purchase fee is $2,000 times 0.001, or $2. Add it to the purchase notional to obtain the full $2,002 entry debit."
        },
        {
          "prompt": "What gross price gain occurs at the $2,200 exit before any fees?",
          "options": [
            "$197.80",
            "$202",
            "$200"
          ],
          "correctAnswer": 2,
          "explanation": "Subtract original $2,000 purchase notional from $2,200 sale notional. This price-only gain has not yet accounted for either transaction charge."
        },
        {
          "prompt": "What is the sum of entry and exit fees in the $2,200 branch?",
          "options": [
            "$2.20",
            "$4.20",
            "$4"
          ],
          "correctAnswer": 1,
          "explanation": "The entry charge is $2 and the exit charge is $2.20. Add both to obtain $4.20 total, rather than counting only the latest transaction."
        },
        {
          "prompt": "What is net return on the $2,002 initial outlay, approximately?",
          "options": [
            "9.78%",
            "10%",
            "19.58%"
          ],
          "correctAnswer": 0,
          "explanation": "Divide the $195.80 net gain by $2,002 total entry debit. The denominator includes the buy fee because this comparison uses actual initial cash spent."
        },
        {
          "prompt": "In the separate $1,800 exit branch, what fee applies to the sale?",
          "options": [
            "$2",
            "$0.20",
            "$1.80"
          ],
          "correctAnswer": 2,
          "explanation": "Charge 0.1% to the actual $1,800 exit value. The fee is neither based on the original purchase nor only on the position’s $200 loss."
        },
        {
          "prompt": "In that $1,800 branch, what is the net loss including both fees?",
          "options": [
            "$201.80",
            "$203.80",
            "$200"
          ],
          "correctAnswer": 1,
          "explanation": "Net proceeds are $1,798.20 compared with $2,002 initial outlay. Their difference is a $203.80 loss, including the entry and exit fees."
        },
        {
          "prompt": "Why must the two alternative exit branches be kept separate?",
          "options": [
            "One position cannot be sold in full twice without another purchase",
            "Both branches automatically occur on refresh",
            "The fee changes the number of holdings into two"
          ],
          "correctAnswer": 0,
          "explanation": "Each branch imagines a different full-sale price for the same starting holding. Combining both as actual proceeds would double-count quantity and cash."
        }
      ],
      "reflection": "How would you explain the difference between gross gain and net gain?",
      "reflectionGuide": "Show the $200 price gain and subtract the $2 purchase fee plus $2.20 exit fee. Keep these expenses separate from the sale proceeds so the account ledger stays easy to verify.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-22",
      "title": "An aggregate is not one exchange’s last trade",
      "category": "Price data",
      "scenario": "A hypothetical asset trades at $100 on venue A and $102 on venue B. A provider reports an aggregate $101 reference. No volume weights or exclusion rules have been supplied. These three numbers can describe different measurements at the same time. A paper-trading mark also does not promise execution at any of these real venues.\n\nConsider two possible aggregation methods as conceptual examples: equal weighting of $100 and $102, or 75% weight on A and 25% on B. Neither is asserted to be the actual provider method. Calculate both references and compare them with observed venue trades. The exercise distinguishes a calculated mark, a venue observation and an executable bid or ask.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Venue A",
            "value": 100
          },
          {
            "label": "Venue B",
            "value": 102
          },
          {
            "label": "Reference",
            "value": 101
          }
        ]
      },
      "questions": [
        {
          "prompt": "Does the $101 reference prove a trade occurred at exactly $101?",
          "options": [
            "No; a reference can combine observations",
            "Yes; every aggregate is a last trade",
            "Yes; a midpoint is always executable"
          ],
          "correctAnswer": 0,
          "explanation": "An aggregate can summarize multiple market observations without being the price of a particular transaction. To describe a last trade, you need the actual venue, transaction and timestamp rather than only a reference figure."
        },
        {
          "prompt": "Can you recover the provider’s weighting method from these numbers alone?",
          "options": [
            "No; methodology and input weights are missing",
            "Yes; all aggregates are equal-weight averages",
            "Yes; the larger venue price has full weight"
          ],
          "correctAnswer": 0,
          "explanation": "The stated reference happens to lie between the two inputs, but that does not reveal weighting, filtering or source coverage. Consult the methodology instead of inventing an algorithm from a single result."
        },
        {
          "prompt": "What does the simulator’s mark establish?",
          "options": [
            "A valuation input for the paper account",
            "A reserved real exchange fill",
            "A guaranteed price for unlimited quantity"
          ],
          "correctAnswer": 0,
          "explanation": "A mark supports simulated valuation under the product’s rules. Real execution depends on an actual venue and available liquidity. Treat the provider number as a reference rather than a promise that money can be exchanged at that price."
        },
        {
          "prompt": "What reference does equal weighting of the two venue prices produce?",
          "options": [
            "$100.50",
            "$102",
            "$101"
          ],
          "correctAnswer": 2,
          "explanation": "Average the two supplied prices with equal weights: half of $100 plus half of $102 is $101. This matches the reported reference under one possible method."
        },
        {
          "prompt": "What reference results from 75% A and 25% B weights?",
          "options": [
            "$101",
            "$100.50",
            "$101.50"
          ],
          "correctAnswer": 1,
          "explanation": "Multiply $100 by 0.75 and $102 by 0.25, then add $75 and $25.50. The resulting $100.50 shows how different weights alter an aggregate."
        },
        {
          "prompt": "Does matching the equal-weight calculation prove the provider used that method?",
          "options": [
            "No; several methods or inputs could produce $101",
            "Yes; one arithmetic match proves the entire methodology",
            "Yes; every aggregate must use equal weights"
          ],
          "correctAnswer": 0,
          "explanation": "A numerical match does not uniquely identify how a provider produced its reference. Additional observations or the published method are needed to establish the process."
        },
        {
          "prompt": "What is venue B’s price premium over venue A in percentage terms?",
          "options": [
            "1%",
            "102%",
            "2%"
          ],
          "correctAnswer": 2,
          "explanation": "Divide the $2 difference by venue A’s $100 price. The 2% relative gap should be labelled with its comparison base rather than treated as an account return."
        },
        {
          "prompt": "Does a calculated $100.50 reference imply a venue trade at that exact price?",
          "options": [
            "Yes; it proves A’s $100 trade never occurred",
            "No; a weighted reference can lie between venue observations",
            "Yes; every reference is a recorded transaction"
          ],
          "correctAnswer": 1,
          "explanation": "A calculation can combine separate observations into a new reference value. That reference is not automatically evidence of an executed trade at the calculated price."
        },
        {
          "prompt": "Which additional data would be necessary to assess immediate execution?",
          "options": [
            "Current venue bids, asks and relevant execution constraints",
            "Only the aggregate reference",
            "Only the arithmetic midpoint"
          ],
          "correctAnswer": 0,
          "explanation": "Execution depends on available orders and venue conditions. A reference price alone does not establish a bid or ask at which the user can actually transact."
        },
        {
          "prompt": "Which report keeps the hypothetical aggregation methods honest?",
          "options": [
            "Attribute both to the provider as facts",
            "Call the larger reference a guaranteed sale price",
            "Label both weight choices as conceptual alternatives"
          ],
          "correctAnswer": 2,
          "explanation": "The case supplies alternative worksheet weights, not verified provider rules. Clear labels prevent a mathematical example from turning into an unsupported methodology claim."
        }
      ],
      "reflection": "Describe a fair comparison between a venue quote and an aggregate.",
      "reflectionGuide": "Label each source and timestamp, explain that their methodologies can differ, and compare like currencies. Acknowledge that this case omits volume weights and does not model real exchange execution.",
      "sources": [
        {
          "label": "CoinGecko — Price methodology",
          "url": "https://www.coingecko.com/en/methodology"
        }
      ]
    },
    {
      "id": "practice-32",
      "title": "Correlation can change when you need it",
      "category": "Risk and uncertainty",
      "scenario": "Two hypothetical assets moved in opposite directions in three earlier observations. In a fourth observation both fall. A learner calls the fourth pair impossible because the assets were “uncorrelated.” The small sample cannot establish a permanent relationship, and low historical correlation does not promise that losses will offset in every interval.\n\nAdd the following hypothetical paired percentage moves: first observation A +2%, B −1%; second A −2%, B +1%; third A +1%, B −0.5%; fourth A −3%, B −4%. Treat them as a tiny illustrative sample rather than a permanent relationship estimate. Compare the direction pairs, then test an equal-dollar $1,000 holding in each asset for the fourth observation only.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "fourth-interval loss (%)",
        "bars": [
          {
            "label": "Asset A",
            "value": 3
          },
          {
            "label": "Asset B",
            "value": 4
          }
        ]
      },
      "questions": [
        {
          "prompt": "Does three earlier observations establish a permanent correlation?",
          "options": [
            "Yes; three is always enough",
            "Yes; opposite moves guarantee independence",
            "No; the sample and period are limited"
          ],
          "correctAnswer": 2,
          "explanation": "Correlation is a sample-dependent statistic, not a fixed contract between assets. Three observations supply very little evidence, and a relationship estimated in one period may not hold in another."
        },
        {
          "prompt": "Can low past correlation guarantee no simultaneous losses?",
          "options": [
            "Yes; simultaneous losses violate the definition",
            "Yes; one asset must rise every day",
            "No; individual intervals can still move together"
          ],
          "correctAnswer": 2,
          "explanation": "A low aggregate relationship can coexist with particular intervals where both assets fall. Correlation does not promise a hedge on every date, and changing conditions can alter the estimated relationship."
        },
        {
          "prompt": "What is the better way to describe the earlier evidence?",
          "options": [
            "A guaranteed hedge",
            "Proof of market-neutral profits",
            "A limited historical pattern, with its sample stated"
          ],
          "correctAnswer": 2,
          "explanation": "Specify the period, observations and method used. Avoid upgrading a historical estimate into a guarantee. Even a designed hedge can retain mismatch, liquidity and cost risks beyond the correlation statistic."
        },
        {
          "prompt": "In how many of the four supplied observations do the assets move in opposite directions?",
          "options": [
            "One observation",
            "Three observations",
            "Four observations"
          ],
          "correctAnswer": 1,
          "explanation": "The first three pairs have opposite signs while the fourth has two negative signs. Counting directions describes this sample without establishing a stable correlation coefficient."
        },
        {
          "prompt": "In the fourth observation, how much does a $1,000 A holding lose?",
          "options": [
            "$30",
            "$3",
            "$300"
          ],
          "correctAnswer": 0,
          "explanation": "Apply A’s selected 3% decline to $1,000 exposure. The $30 loss is a dollar contribution for this one observation, not the asset’s permanent risk."
        },
        {
          "prompt": "In that fourth observation, how much does a $1,000 B holding lose?",
          "options": [
            "$4",
            "$400",
            "$40"
          ],
          "correctAnswer": 2,
          "explanation": "Apply B’s selected 4% decline to $1,000. Its $40 loss joins the A loss rather than offsetting it in this particular same-direction observation."
        },
        {
          "prompt": "What is the combined fourth-observation loss on the equal-dollar holdings?",
          "options": [
            "$35",
            "$70",
            "$10"
          ],
          "correctAnswer": 1,
          "explanation": "Add $30 A loss and $40 B loss. Equal notionals do not force opposing performance when both supplied asset moves are negative."
        },
        {
          "prompt": "What return does that combined $2,000 position show for the fourth observation?",
          "options": [
            "−3.5%",
            "−7%",
            "−1%"
          ],
          "correctAnswer": 0,
          "explanation": "Divide the $70 loss by the combined $2,000 starting value. Adding the two asset percentage declines without weighting would overstate the portfolio percentage."
        },
        {
          "prompt": "Do these direction counts alone supply a reliable long-run correlation estimate?",
          "options": [
            "Yes; three opposite pairs guarantee permanent negative correlation",
            "Yes; one same-direction pair proves permanent positive correlation",
            "No; magnitudes, a suitable sample and method matter"
          ],
          "correctAnswer": 2,
          "explanation": "A small selected sample and sign counts cannot establish a durable statistical relationship. A defined method and broader representative observations are needed."
        },
        {
          "prompt": "Which statement is supported without overstating the evidence?",
          "options": [
            "The fourth observation could not occur",
            "Opposite earlier moves did not prevent a simultaneous loss in the fourth case",
            "Diversification never helps"
          ],
          "correctAnswer": 1,
          "explanation": "The supplied pairs demonstrate that an earlier pattern did not hold in one later observation. They do not settle all diversification outcomes or future relationships."
        }
      ],
      "reflection": "Write a diversification claim that acknowledges this limit.",
      "reflectionGuide": "State that different exposures may reduce concentration but can still lose together. Identify the historical sample and avoid promising that one position will always offset another.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-42",
      "title": "Write the thesis before the price moves",
      "category": "Decision habits",
      "scenario": "A learner buys a hypothetical stock at $40, then sees it rise to $44. Afterward they write that a strong report made the rise obvious, although their original reason was a chart pattern. The revised story hides what was actually tested. A dated pre-decision note lets you compare the original hypothesis with the later evidence.\n\nAssume ten units were bought at $40 and later marked at $44, excluding fees. Keep the original dated chart-pattern note and add the later report as new information rather than overwriting the first thesis. Compare the price gain with evidence about why the decision was made. A profitable result is compatible with weak attribution, so the journal should preserve the information available at each time.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Entry",
            "value": 40
          },
          {
            "label": "Later quote",
            "value": 44
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the observed price change in this case?",
          "options": [
            "+40%",
            "+10%",
            "+4%"
          ],
          "correctAnswer": 1,
          "explanation": "The $4 increase divided by the $40 starting price is 10%. That observed return is separate from why the learner acted and does not validate a reason invented after the movement."
        },
        {
          "prompt": "What is wrong with replacing the original reason after the rise?",
          "options": [
            "It makes the report a proven cause",
            "It prevents a fair test of the original hypothesis",
            "It improves the historical evidence"
          ],
          "correctAnswer": 1,
          "explanation": "A rewritten explanation can make outcomes look more predictable than they were. Preserve the original thesis and add new information as a dated update rather than silently changing what the decision supposedly tested."
        },
        {
          "prompt": "What should a useful pre-decision note contain?",
          "options": [
            "Only the hoped-for profit",
            "Evidence, uncertainty and a review condition",
            "A certainty claim about the next quote"
          ],
          "correctAnswer": 1,
          "explanation": "A brief note can state the observable evidence, alternative explanations and what would prompt reconsideration. It creates a reviewable process without pretending a future price is known."
        },
        {
          "prompt": "What notional was invested in the ten units at $40?",
          "options": [
            "$400",
            "$40",
            "$440"
          ],
          "correctAnswer": 0,
          "explanation": "Ten units multiplied by the original $40 quote gives $400 before fees. This is the invested notional, not the total size of an unspecified account."
        },
        {
          "prompt": "What is the later ten-unit holding worth at $44?",
          "options": [
            "$400",
            "$44",
            "$440"
          ],
          "correctAnswer": 2,
          "explanation": "Multiply ten unchanged units by the later $44 mark. The $440 value can be verified without accepting any particular explanation of the price increase."
        },
        {
          "prompt": "What is the holding’s gross dollar gain?",
          "options": [
            "$400",
            "$40",
            "$4"
          ],
          "correctAnswer": 1,
          "explanation": "Subtract $400 original notional from $440 marked value. Ten units translate the $4 per-unit price move into a $40 position gain."
        },
        {
          "prompt": "What is the quote’s return from $40 to $44?",
          "options": [
            "10%",
            "4%",
            "40%"
          ],
          "correctAnswer": 0,
          "explanation": "Divide the $4 quote increase by the $40 starting quote. This 10% gross asset return does not establish how much an entire account earned after costs."
        },
        {
          "prompt": "How should the later report be recorded without changing the original thesis?",
          "options": [
            "As proof the original note always mentioned it",
            "By deleting the chart-pattern reason",
            "As dated new evidence beside the original note"
          ],
          "correctAnswer": 2,
          "explanation": "A dated addition preserves which evidence was available when the decision occurred. Overwriting the entry note hides the hypothesis actually tested."
        },
        {
          "prompt": "Does the $40 gain prove the later report caused the price move?",
          "options": [
            "Yes; journals determine market prices",
            "No; the case supplies no causal test",
            "Yes; every positive result validates the latest story"
          ],
          "correctAnswer": 1,
          "explanation": "The arithmetic establishes a gain but not its cause. Attribution requires evidence connecting the event and price response beyond an after-the-fact explanation."
        },
        {
          "prompt": "What comparison would best reveal hindsight rewriting?",
          "options": [
            "The original note against the later revised explanation",
            "Only the final green return badge",
            "Only another user’s account rank"
          ],
          "correctAnswer": 0,
          "explanation": "A preserved original record exposes which reasons changed after the outcome. This comparison supports process learning without requiring a confident market forecast."
        }
      ],
      "reflection": "Draft a pre-decision note for this case using only the supplied facts.",
      "reflectionGuide": "You can state the hypothetical entry and acknowledge that no actual report evidence is supplied. Name information to investigate and a review condition; avoid inventing a catalyst to explain the observed gain.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-03",
      "title": "Cash after a fee-paying buy",
      "category": "Portfolio arithmetic",
      "scenario": "A virtual account has $10,000 cash. You plan to buy 20 shares at a fixed $100 quote. For this worksheet use TradeHQ’s 0.1% fee on the $2,000 trade value. The quote stays unchanged afterward. Separate cash spent, the marked position value, and the fee: the fee is not a share that remains in the account.\n\nContinue after the purchase: the 20 shares rise from $100 to $110 each, then all are sold at that exact quote. Apply the same 0.1% fee to the sale. There are no further cash flows or costs. Make a ledger showing original cash, purchase debit, remaining cash, gross sale proceeds and exit fee. Compare the gross price gain with the final net account gain; a gain in the asset and a gain in the entire account use different denominators.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Starting cash",
            "value": 10000
          },
          {
            "label": "Trade value",
            "value": 2000
          },
          {
            "label": "Fee",
            "value": 2
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the total cash debit for this purchase?",
          "options": [
            "$2,200",
            "$2,002",
            "$2,000"
          ],
          "correctAnswer": 1,
          "explanation": "Twenty shares at $100 have a $2,000 notional value. The fee is $2,000 × 0.001 = $2, so cash falls by $2,002. Counting only share cost would leave the cash ledger overstated."
        },
        {
          "prompt": "What cash remains after that debit?",
          "options": [
            "$9,998",
            "$7,998",
            "$8,000"
          ],
          "correctAnswer": 1,
          "explanation": "Subtract the full $2,002 debit from $10,000. The resulting $7,998 cash plus $2,000 of shares equals $9,998 in equity at the unchanged mark; the $2 difference is the fee."
        },
        {
          "prompt": "Is the unchanged quote enough to keep total equity at $10,000?",
          "options": [
            "No; equity is $7,998",
            "No; equity is $9,998 after the fee",
            "Yes; fees become holdings"
          ],
          "correctAnswer": 1,
          "explanation": "An unchanged asset price does not refund transaction costs. The marked holding still has $2,000 of value, but $2 has left cash. Equity includes cash and holdings, not the cash balance alone."
        },
        {
          "prompt": "What purchase fee is included in the original $2,002 debit?",
          "options": [
            "$2",
            "$20",
            "$200"
          ],
          "correctAnswer": 0,
          "explanation": "Convert 0.1% to 0.001 and multiply by the $2,000 notional. The $2 charge is an expense, not additional value held as shares."
        },
        {
          "prompt": "How many shares are owned immediately after this fee-paying purchase?",
          "options": [
            "20.02 shares",
            "19.98 shares",
            "20 shares"
          ],
          "correctAnswer": 2,
          "explanation": "The order buys exactly 20 shares and charges its fee separately in cash. A cash fee affects equity but does not silently alter the order quantity."
        },
        {
          "prompt": "At the later $110 quote, what is the position’s marked value?",
          "options": [
            "$2,000",
            "$2,200",
            "$2,202"
          ],
          "correctAnswer": 1,
          "explanation": "Twenty shares multiplied by $110 gives $2,200. Purchase fees affect net performance, but are not added to the current units-times-quote valuation."
        },
        {
          "prompt": "What exit fee applies to the $2,200 sale?",
          "options": [
            "$2.20",
            "$2",
            "$20"
          ],
          "correctAnswer": 0,
          "explanation": "Multiply the $2,200 sale notional by 0.001. Reusing the original $2 purchase fee would understate the charge on this larger exit value."
        },
        {
          "prompt": "What is final cash after selling all 20 shares?",
          "options": [
            "$10,200",
            "$10,197.80",
            "$10,195.80"
          ],
          "correctAnswer": 2,
          "explanation": "Add $2,197.80 net sale proceeds to $7,998 remaining cash. Both fees reduce the final balance below the amount implied by the gross $200 price gain."
        },
        {
          "prompt": "What is net account gain across the complete purchase and sale?",
          "options": [
            "$197.80",
            "$195.80",
            "$200"
          ],
          "correctAnswer": 1,
          "explanation": "Subtract original $10,000 cash from the $10,195.80 final balance. The $200 gross price gain is reduced by $2 entry and $2.20 exit fees."
        },
        {
          "prompt": "What is net return measured against the original account equity?",
          "options": [
            "1.958%",
            "10%",
            "9.79%"
          ],
          "correctAnswer": 0,
          "explanation": "Divide the $195.80 net gain by $10,000 starting equity. The share quote rose 10%, but only part of the account was invested and fees reduced the gain."
        }
      ],
      "reflection": "Write a three-line ledger for cash, holding value and total equity.",
      "reflectionGuide": "Check that cash plus marked holdings equals equity. Keep the fee as an expense already deducted from cash; deducting it a second time from equity would also be an error.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-13",
      "title": "An affordable quantity still needs fee room",
      "category": "Costs and orders",
      "scenario": "A virtual account has exactly $1,000 cash and an asset quote of $100 per unit. A learner tries to buy ten units because ten times $100 is $1,000. Apply the simulator’s 0.1% purchase fee. For this worksheet consider whole-unit alternatives only; the actual supported quantity precision depends on the instrument.\n\nCompare buying nine whole units with attempting ten. The quote stays $100 and the transaction fee is paid in cash. For a separate mathematical check, allow fractional units with no rounding constraint and solve quantity times quote times 1.001 equal to the $1,000 cash balance. The computed upper bound is a worksheet limit; actual quantity precision and validation can require rounding down.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Cash available",
            "value": 1000
          },
          {
            "label": "Ten-unit cost",
            "value": 1000
          },
          {
            "label": "Nine-unit cost",
            "value": 900
          }
        ]
      },
      "questions": [
        {
          "prompt": "What would ten units cost including the fee?",
          "options": [
            "$1,001",
            "$1,000",
            "$990"
          ],
          "correctAnswer": 0,
          "explanation": "Ten units have a $1,000 notional, and 0.1% adds $1. The total exceeds available cash. A displayed balance that exactly matches notional does not leave room for a fee."
        },
        {
          "prompt": "Which stated whole-unit alternative fits the cash balance?",
          "options": [
            "Nine units, costing $900.90",
            "Ten units, costing $1,001",
            "Eleven units, costing $1,101.10"
          ],
          "correctAnswer": 0,
          "explanation": "Nine units cost $900 plus $0.90 fee, or $900.90. The remaining $99.10 is cash. Checking the full debit is more reliable than checking notional alone."
        },
        {
          "prompt": "What should an insufficient-cash message lead you to inspect first?",
          "options": [
            "Quantity, current quote and the total debit",
            "Whether the asset must rise tomorrow",
            "Whether fees can be ignored in a simulator"
          ],
          "correctAnswer": 0,
          "explanation": "Affordability depends on the current price, requested quantity and applicable costs. It is an execution constraint, not a signal about direction. Reducing a quantity should follow a budget check rather than a forecast."
        },
        {
          "prompt": "What is the fee on the attempted ten-unit $1,000 purchase?",
          "options": [
            "$10",
            "$0.10",
            "$1"
          ],
          "correctAnswer": 2,
          "explanation": "Multiply $1,000 notional by 0.001 to obtain a $1 fee. Spending the entire cash balance on notional leaves no room for this separate charge."
        },
        {
          "prompt": "What cash shortfall does the ten-unit order create?",
          "options": [
            "$0",
            "$1",
            "$100"
          ],
          "correctAnswer": 1,
          "explanation": "Total debit would be $1,001 against only $1,000 available. The $1 difference explains the failure without implying any missing price data."
        },
        {
          "prompt": "What does nine units cost including the stated fee?",
          "options": [
            "$900.90",
            "$900",
            "$901"
          ],
          "correctAnswer": 0,
          "explanation": "Nine units at $100 give $900 notional and a $0.90 fee. The total is $900.90, so this whole-unit alternative fits the cash balance."
        },
        {
          "prompt": "How much cash remains after the nine-unit purchase?",
          "options": [
            "$100",
            "$99",
            "$99.10"
          ],
          "correctAnswer": 2,
          "explanation": "Subtract the $900.90 debit from $1,000 cash. The remaining $99.10 accounts for both the holding’s purchase value and its transaction fee."
        },
        {
          "prompt": "What is the fee-inclusive cost per unit at this unchanged quote?",
          "options": [
            "$101",
            "$100.10",
            "$100"
          ],
          "correctAnswer": 1,
          "explanation": "Apply the 1.001 purchase-cost multiplier to $100 per unit. This $100.10 is cash spent per unit under the fee rule, not the asset’s new market quote."
        },
        {
          "prompt": "Without rounding constraints, what quantity just fits $1,000, approximately?",
          "options": [
            "9.99001 units",
            "10 units",
            "9.9 units"
          ],
          "correctAnswer": 0,
          "explanation": "Divide $1,000 by $100 times 1.001. Actual execution precision may require rounding this mathematical upper bound downward so the debit cannot exceed available cash."
        },
        {
          "prompt": "Which action addresses the stated insufficient-cash cause?",
          "options": [
            "Repeatedly refresh until cash increases",
            "Treat the fee as extra shares",
            "Reduce quantity to leave room for the fee"
          ],
          "correctAnswer": 2,
          "explanation": "Adjusting quantity changes notional and its proportional fee. Refreshing a page does not create cash, and the fee does not add a holding."
        }
      ],
      "reflection": "Draft a pre-click affordability check in your own words.",
      "reflectionGuide": "Use quantity × current quote, add the stated purchase fee, and compare the full amount with available cash. Leave room for a changing quote; do not assume a future fill must use an earlier display.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-23",
      "title": "Currency mismatch looks like a price error",
      "category": "Price data",
      "scenario": "One hypothetical page quotes an asset at 100 US dollars, another at 92 euros. For this worksheet assume one euro equals 1.10 US dollars at the same time. The figures are selected inputs, not current currency rates. Convert to a common unit before deciding how far apart the two asset quotes really are.\n\nUse the stated rate to compare both quotes in euros as well as dollars. Then test a separate conversion at $1.08 per euro; keep the asset’s €92 price unchanged in that branch. Currency conversion alone can change the apparent dollar difference. Record the rate and time used instead of mixing reference units or treating exchange-rate changes as asset price changes.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$ equivalent",
        "bars": [
          {
            "label": "USD quote",
            "value": 100
          },
          {
            "label": "EUR converted",
            "value": 101.2
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is €92 expressed in dollars at the stated exchange rate?",
          "options": [
            "$83.64",
            "$92",
            "$101.20"
          ],
          "correctAnswer": 2,
          "explanation": "Multiply €92 by $1.10 per euro to get $101.20. The currency units matter: dividing by 1.10 would use the opposite conversion and answer a different question."
        },
        {
          "prompt": "What dollar difference separates the converted quote from $100?",
          "options": [
            "$8",
            "$10",
            "$1.20"
          ],
          "correctAnswer": 2,
          "explanation": "The converted €92 quote is $101.20, so it is $1.20 above $100. Comparing the raw 92 and 100 without currency labels would suggest an $8 gap that is not this common-unit difference."
        },
        {
          "prompt": "What remains necessary for a reliable cross-site comparison?",
          "options": [
            "A rule that the lower number is correct",
            "Ignoring conversion because both are prices",
            "Matched timestamps and source definitions"
          ],
          "correctAnswer": 2,
          "explanation": "Currency conversion resolves one mismatch only. Different observation times, venue inputs or asset identifiers can still affect the comparison. A fair audit records these fields rather than declaring accuracy from one converted pair."
        },
        {
          "prompt": "At $1.10 per euro, what is the $100 quote worth in euros, approximately?",
          "options": [
            "€100",
            "€90.91",
            "€110"
          ],
          "correctAnswer": 1,
          "explanation": "Divide $100 by $1.10 per euro. The euro value is approximately €90.91; multiplying instead would reverse the conversion direction."
        },
        {
          "prompt": "At the original rate, what percentage premium does the €92 quote have over $100?",
          "options": [
            "1.2%",
            "8%",
            "10%"
          ],
          "correctAnswer": 0,
          "explanation": "The euro quote converts to $101.20, a $1.20 premium. Divide that gap by the $100 comparison price to obtain 1.2%."
        },
        {
          "prompt": "In the separate $1.08-per-euro branch, what is €92 in dollars?",
          "options": [
            "$101.20",
            "$85.19",
            "$99.36"
          ],
          "correctAnswer": 2,
          "explanation": "Multiply €92 by $1.08 per euro to obtain $99.36. This changes the converted value while the asset’s euro quote remains exactly the same."
        },
        {
          "prompt": "In that alternative-rate branch, how does the converted quote compare with $100?",
          "options": [
            "It is exactly equal",
            "It is $0.64 lower",
            "It is $1.20 higher"
          ],
          "correctAnswer": 1,
          "explanation": "Subtract $99.36 from $100 to obtain a $0.64 discount. The direction of the cross-currency comparison changed solely because the assumed exchange rate changed."
        },
        {
          "prompt": "What dollar-per-euro rate would make €92 equal $100, approximately?",
          "options": [
            "$1.08696 per euro",
            "$0.92 per euro",
            "$1.20 per euro"
          ],
          "correctAnswer": 0,
          "explanation": "Solve 92 times the conversion rate equal to 100. Dividing 100 by 92 gives approximately 1.08696 dollars per euro."
        },
        {
          "prompt": "Can changing the conversion rate prove the underlying euro asset price changed?",
          "options": [
            "Yes; every dollar conversion change is an asset trade",
            "Yes; conversion automatically changes units owned",
            "No; the euro quote was held fixed in this branch"
          ],
          "correctAnswer": 2,
          "explanation": "The worksheet explicitly keeps €92 unchanged. Its dollar expression changes with the currency rate, without proving a new asset quote or any transaction."
        },
        {
          "prompt": "Which record makes the price comparison reproducible across currencies?",
          "options": [
            "Only the chosen currency symbol",
            "Both asset quotes, their times and the conversion rate used",
            "Only the larger displayed number"
          ],
          "correctAnswer": 1,
          "explanation": "A reader needs values, units, observation times and the applied rate to reconstruct the comparison. Displayed numbers alone omit important conversion assumptions."
        }
      ],
      "reflection": "List the inputs you would save alongside this calculation.",
      "reflectionGuide": "Record both asset quotes, their currency units, their timestamps and the assumed conversion rate. Label the rate hypothetical; an actual comparison would need a rate appropriate to the same time window.",
      "sources": [
        {
          "label": "CoinGecko — Price methodology",
          "url": "https://www.coingecko.com/en/methodology"
        }
      ]
    },
    {
      "id": "practice-33",
      "title": "A planned payoff ratio is not a realized result",
      "category": "Risk and uncertainty",
      "scenario": "A worksheet lists a $100 planned loss and a $300 planned gain per attempt. Four attempts produce the full $300 gain and six produce the full $100 loss. Costs are excluded. First calculate this deliberately fixed-payoff sample, then ask what happens if real exits fail to match the plan.\n\nCompare a second payoff branch where the four winning attempts earn only $200 each while the six losses remain $100 each. Then charge a hypothetical $5 cost per attempt to each branch. These fixed samples illustrate how actual payoffs and costs matter; they do not demonstrate a repeatable trading edge. Keep planned gain, realized gain and sample net result separate.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Gain per winner",
            "value": 300
          },
          {
            "label": "Loss per loser",
            "value": 100
          }
        ]
      },
      "questions": [
        {
          "prompt": "What gross total do four full winners contribute?",
          "options": [
            "$400",
            "$1,200",
            "$300"
          ],
          "correctAnswer": 1,
          "explanation": "Four winners times $300 each equal $1,200. This assumes every listed winner realizes the entire planned payoff. An intended target alone does not establish what a position actually returns."
        },
        {
          "prompt": "What is the net sample result after six full losses, before costs?",
          "options": [
            "−$600",
            "+$600",
            "+$1,200"
          ],
          "correctAnswer": 1,
          "explanation": "Six losses total $600. Subtract $600 from the $1,200 gains to obtain a $600 positive sample result. It is a calculation for these exact outcomes, not proof that future attempts will match them."
        },
        {
          "prompt": "What would invalidate using this sample as a general profit promise?",
          "options": [
            "Nothing; the planned ratio ensures profit",
            "Different realized payoffs, outcomes or costs",
            "Only a different chart color"
          ],
          "correctAnswer": 1,
          "explanation": "Actual win frequency, average realized gains, average losses and costs determine the result. Exits may differ from planned thresholds. A stated risk-to-reward ratio is not sufficient evidence of a profitable strategy."
        },
        {
          "prompt": "What is the recorded win rate across the ten original attempts?",
          "options": [
            "40%",
            "60%",
            "300%"
          ],
          "correctAnswer": 0,
          "explanation": "Four winning attempts divided by ten total attempts gives 40%. Win rate is a count-based measure and does not describe the size of each outcome."
        },
        {
          "prompt": "What gross loss do the six losing attempts contribute?",
          "options": [
            "$100",
            "$1,000",
            "$600"
          ],
          "correctAnswer": 2,
          "explanation": "Six losses of $100 each total $600. This loss must be subtracted from the winners’ $1,200 contribution in the original fixed-payoff sample."
        },
        {
          "prompt": "What is original average gross result per attempt?",
          "options": [
            "−$60",
            "+$60",
            "+$600"
          ],
          "correctAnswer": 1,
          "explanation": "The original $600 gross sample gain divided by ten attempts is $60 each on average. It is a description of the sample rather than a forecast."
        },
        {
          "prompt": "With winners reduced to $200, what is the alternative gross sample gain?",
          "options": [
            "$200",
            "$600",
            "$800"
          ],
          "correctAnswer": 0,
          "explanation": "Four $200 winners contribute $800, and six $100 losses total $600. Subtract to obtain a $200 gross result in this separate branch."
        },
        {
          "prompt": "What total cost applies at $5 per attempt across ten attempts?",
          "options": [
            "$5",
            "$100",
            "$50"
          ],
          "correctAnswer": 2,
          "explanation": "Ten attempts each incur the specified $5 charge, giving $50 total. This conceptual fixed cost is separate from TradeHQ’s notional-based transaction fee."
        },
        {
          "prompt": "What net result remains in the $200-winner branch after those costs?",
          "options": [
            "+$550",
            "+$150",
            "+$200"
          ],
          "correctAnswer": 1,
          "explanation": "Reduce the alternative $200 gross result by $50 costs. Changing realized winner size materially changes the sample outcome despite the same 40% win count."
        },
        {
          "prompt": "Why can’t the original planned payoff ratio guarantee the alternative result?",
          "options": [
            "Realized exits and costs can differ from planned amounts",
            "Every planned ratio executes automatically",
            "A 40% win rate fixes all dollar results"
          ],
          "correctAnswer": 0,
          "explanation": "A plan specifies intended conditions, while actual outcomes determine realized profit. The alternative branch demonstrates that the same count can produce different net results."
        }
      ],
      "reflection": "Which records would you need to evaluate the plan after use?",
      "reflectionGuide": "Compare planned and realized exits, fees and each outcome over a stated sample. Include losses that exceeded the worksheet assumption and avoid selecting only attempts that fit the original targets.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-43",
      "title": "The old high is a reference, not a promise",
      "category": "Decision habits",
      "scenario": "A hypothetical asset once traded at $200 and now trades at $120. A learner calls it “40% off” and assumes it must return to $200. No evidence about business conditions or valuation is supplied. The previous quote is a historical reference; it does not independently establish fair value or the likelihood of recovery.\n\nConsider ten units acquired at $120, with fees excluded. Compare a separate rise to $150 and a separate fall to $100, then the full recovery price of $200. The old high remains a reference, not a target guaranteed by the market. Express each branch relative to the $120 entry while keeping the earlier decline from $200 separate. A recovery percentage depends on the current base.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Earlier high",
            "value": 200
          },
          {
            "label": "Current quote",
            "value": 120
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the decline from $200 to $120?",
          "options": [
            "40%",
            "66.67%",
            "80%"
          ],
          "correctAnswer": 0,
          "explanation": "The decline is $80 divided by the original $200, or 40%. This measures a past price change. It does not show that the current asset is undervalued or that the earlier high was justified."
        },
        {
          "prompt": "What rise from $120 would restore $200, approximately?",
          "options": [
            "66.67%",
            "40%",
            "80%"
          ],
          "correctAnswer": 0,
          "explanation": "The required $80 gain is divided by the current $120 base, giving approximately 66.67%. A 40% rebound would not undo a 40% loss because it applies to a smaller base."
        },
        {
          "prompt": "What conclusion does the earlier high alone support?",
          "options": [
            "Only that the asset had a higher quoted price before",
            "A guaranteed return to $200",
            "A verified current bargain"
          ],
          "correctAnswer": 0,
          "explanation": "A historical price can anchor expectations without supplying present valuation evidence. Investigate current conditions and alternative outcomes instead of treating a prior high as an entitlement or an inevitable destination."
        },
        {
          "prompt": "What is the ten-unit position’s entry notional at $120?",
          "options": [
            "$2,000",
            "$120",
            "$1,200"
          ],
          "correctAnswer": 2,
          "explanation": "Ten units multiplied by $120 gives $1,200 before fees. The historic $200 high does not change the amount spent at the stated entry."
        },
        {
          "prompt": "At the separate $150 mark, what is the ten-unit position worth?",
          "options": [
            "$150",
            "$1,500",
            "$1,200"
          ],
          "correctAnswer": 1,
          "explanation": "Ten units times $150 gives $1,500. This selected branch is a calculation of marked value rather than a forecast that the asset will reach that quote."
        },
        {
          "prompt": "What is the return from the $120 entry to the $150 branch?",
          "options": [
            "25%",
            "30%",
            "40%"
          ],
          "correctAnswer": 0,
          "explanation": "Divide the $30 quote rise by the $120 entry. The 25% return uses the entry as base, not the older $200 high."
        },
        {
          "prompt": "At the separate $100 branch, what is the return from $120, approximately?",
          "options": [
            "−20%",
            "−50%",
            "−16.67%"
          ],
          "correctAnswer": 2,
          "explanation": "The $20 decline divided by $120 is approximately −16.67%. Percentages differ when the reference base differs, even with similar dollar moves."
        },
        {
          "prompt": "How much must the ten-unit position gain to rise from $1,200 to the old-high value?",
          "options": [
            "$2,000",
            "$800",
            "$400"
          ],
          "correctAnswer": 1,
          "explanation": "Ten units at $200 would be $2,000. Subtract $1,200 current-entry value to obtain an $800 recovery gain for this specific quantity."
        },
        {
          "prompt": "Would calling $120 “40% off” establish an independently verified fair value?",
          "options": [
            "No; it only compares the quote with an old high",
            "Yes; the old high guarantees a bargain",
            "Yes; all historical highs are fair-value estimates"
          ],
          "correctAnswer": 0,
          "explanation": "The 40% decline is a reference calculation. Without relevant valuation evidence, it cannot establish fair value or the likelihood of returning to the earlier quote."
        },
        {
          "prompt": "Which question would extend the analysis beyond anchoring to the high?",
          "options": [
            "How can the old high be treated as certain?",
            "How many times can the old high be repeated?",
            "What current evidence supports the valuation assumptions?"
          ],
          "correctAnswer": 2,
          "explanation": "A current evidence-based valuation review addresses assumptions and uncertainty. Repeating a historic price alone does not supply missing information about value or future outcomes."
        }
      ],
      "reflection": "Rewrite “it has to get back to $200” as an investigable question.",
      "reflectionGuide": "Ask which current evidence could support or weaken a recovery hypothesis. Show the required 66.67% rise and state that the previous high alone supplies neither fair value nor a probability.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-04",
      "title": "Selling half is not selling the gain",
      "category": "Portfolio arithmetic",
      "scenario": "You own 10 hypothetical shares bought at $80 each. The current quote is $100 and you sell five shares. Ignore fees for the first two questions, then consider what fee tracking would change. The sale realizes a gain on the shares sold, while the unsold shares still carry an unrealized gain.\n\nAfter the five-share sale, the remaining five shares fall to $90 each. Continue excluding fees to separate realized and unrealized results. No deposit or extra purchase occurs. Compare original $800 cost with sale cash plus remaining marked value. An observer calls the entire $500 sale receipt profit; identify recovered cost within that receipt. The later mark changes the unsold holding but cannot rewrite the completed sale’s price.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Cost per share",
            "value": 80
          },
          {
            "label": "Sale per share",
            "value": 100
          },
          {
            "label": "Remaining mark",
            "value": 500
          }
        ]
      },
      "questions": [
        {
          "prompt": "How much gross cash arrives from the five-share sale?",
          "options": [
            "$500",
            "$100",
            "$1,000"
          ],
          "correctAnswer": 0,
          "explanation": "Five shares multiplied by the $100 sale price gives $500 proceeds. Proceeds include both recovery of original capital and profit; they are not the same thing as the realized gain."
        },
        {
          "prompt": "What is the gross realized gain on those five shares?",
          "options": [
            "$100",
            "$200",
            "$500"
          ],
          "correctAnswer": 0,
          "explanation": "The sold shares cost 5 × $80 = $400. Subtract this cost from $500 proceeds for a $100 gross realized gain. The other $100 price gain remains attached to the five unsold shares."
        },
        {
          "prompt": "How should a net-return review handle transaction fees?",
          "options": [
            "Include applicable buy and sell fees once",
            "Ignore fees because some shares remain",
            "Subtract the full sale proceeds"
          ],
          "correctAnswer": 0,
          "explanation": "Net performance includes relevant transaction expenses. Record which fee belongs to which calculation and avoid double counting. Gross realized gain, remaining unrealized gain and net account return answer different questions."
        },
        {
          "prompt": "What original cost belongs to the five shares sold?",
          "options": [
            "$800",
            "$500",
            "$400"
          ],
          "correctAnswer": 2,
          "explanation": "Five shares bought at $80 each have $400 cost. Allocating the entire ten-share cost to the half-sale would distort the realized result."
        },
        {
          "prompt": "At the $100 quote, what unrealized gain remains in the unsold five shares?",
          "options": [
            "$500",
            "$100",
            "$200"
          ],
          "correctAnswer": 1,
          "explanation": "The unsold holding is worth $500 and cost $400 before fees. Its $100 gain remains unrealized because those five shares have not been sold."
        },
        {
          "prompt": "At the subsequent $90 quote, what is the remaining marked value?",
          "options": [
            "$450",
            "$500",
            "$400"
          ],
          "correctAnswer": 0,
          "explanation": "Multiply five remaining shares by $90. The new $450 mark changes the unsold position, while the earlier $500 sale receipt remains part of cash."
        },
        {
          "prompt": "At $90, what unrealized gain remains against the unsold shares’ cost?",
          "options": [
            "$150",
            "−$50",
            "$50"
          ],
          "correctAnswer": 2,
          "explanation": "Compare $450 current value with $400 remaining cost. There is still a $50 unrealized gain even though the quote fell after the partial sale."
        },
        {
          "prompt": "What is sale cash plus the final unsold holding’s value?",
          "options": [
            "$1,000",
            "$950",
            "$900"
          ],
          "correctAnswer": 1,
          "explanation": "Add the earlier $500 gross sale receipt to $450 remaining marked value. Compare this $950 combined amount with the original $800 total cost."
        },
        {
          "prompt": "What is total gross gain across sold and unsold shares at the end?",
          "options": [
            "$150",
            "$500",
            "$50"
          ],
          "correctAnswer": 0,
          "explanation": "The $100 realized gain and $50 remaining unrealized gain total $150. The same result follows from $950 combined value minus $800 original cost."
        },
        {
          "prompt": "Which part of the $500 sale receipt is recovered original cost?",
          "options": [
            "$100",
            "$500",
            "$400"
          ],
          "correctAnswer": 2,
          "explanation": "The five sold shares originally cost $400. Only the remaining $100 is gross realized gain; the full cash receipt includes returned investment principal."
        }
      ],
      "reflection": "Why would calling the $500 proceeds “profit” distort your review?",
      "reflectionGuide": "State the $400 original capital inside the proceeds and the $100 gross gain. Then separate the five shares still held; their marked gain has not become cash through this sale.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-14",
      "title": "The quote changes before you submit",
      "category": "Costs and orders",
      "scenario": "You calculate a two-unit purchase using a $500 displayed quote, but the quote becomes $510 before submission. Use the later $510 value and a 0.1% fee for this worksheet. This is a changing-input example, not a claim that TradeHQ simulates order-book slippage or provides a guaranteed locked quote.\n\nCompare the original estimate at $500 with the revised debit at $510. Then examine a separate two-unit purchase at $490, again charging 0.1%. These selected quotes illustrate a changing input rather than exchange execution guarantees. Record the quote used for the final calculation and distinguish the display timestamp from an actual order receipt.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Earlier unit quote",
            "value": 500
          },
          {
            "label": "Later unit quote",
            "value": 510
          },
          {
            "label": "Later notional",
            "value": 1020
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the two-unit notional using the later quote?",
          "options": [
            "$1,000",
            "$510",
            "$1,020"
          ],
          "correctAnswer": 2,
          "explanation": "Multiply two units by the later $510 quote. The notional becomes $1,020, $20 more than the earlier estimate. The relevant input must be identified before judging the debit."
        },
        {
          "prompt": "What is the later total debit including the stated fee?",
          "options": [
            "$1,001",
            "$1,020.10",
            "$1,021.02"
          ],
          "correctAnswer": 2,
          "explanation": "The fee is $1,020 × 0.001 = $1.02. Add it to notional for a $1,021.02 debit. A fee calculated on the earlier estimate would not match this assumed transaction."
        },
        {
          "prompt": "What is the most useful review step after a changed quote?",
          "options": [
            "Assume the provider owes the earlier price",
            "Treat the difference as proof of manipulation",
            "Compare the submitted trade record with the earlier estimate"
          ],
          "correctAnswer": 2,
          "explanation": "The record and timestamps can explain whether different inputs were used. A discrepancy deserves investigation, but it does not independently prove wrongdoing. A periodic quote is not a promise of a future real-market fill."
        },
        {
          "prompt": "What notional was expected when two units were first estimated at $500?",
          "options": [
            "$1,020",
            "$1,000",
            "$500"
          ],
          "correctAnswer": 1,
          "explanation": "Two units times the original $500 quote gives $1,000 notional. That estimate changes when the quote used for the later calculation changes."
        },
        {
          "prompt": "What fee was expected on the original $1,000 notional?",
          "options": [
            "$1",
            "$10",
            "$0.50"
          ],
          "correctAnswer": 0,
          "explanation": "Applying 0.1% to $1,000 gives $1. The initial estimated total debit was therefore $1,001 rather than exactly the notional."
        },
        {
          "prompt": "How much larger is the revised total debit than the original $1,001 estimate?",
          "options": [
            "$20",
            "$10.01",
            "$20.02"
          ],
          "correctAnswer": 2,
          "explanation": "The later debit is $1,021.02. Subtract the original $1,001 estimate to get $20.02, including both the notional difference and its fee effect."
        },
        {
          "prompt": "What percentage increase occurred in the quote from $500 to $510?",
          "options": [
            "1%",
            "2%",
            "10%"
          ],
          "correctAnswer": 1,
          "explanation": "Divide the $10 quote increase by the original $500. This 2% quote move also raises two-unit notional by 2% before fees."
        },
        {
          "prompt": "In the separate $490 quote branch, what is the two-unit notional?",
          "options": [
            "$980",
            "$990",
            "$1,000"
          ],
          "correctAnswer": 0,
          "explanation": "Multiply two units by $490 to obtain $980. This alternative branch uses its own stated quote rather than the $510 quote from the first continuation."
        },
        {
          "prompt": "What total debit applies in that $490 branch?",
          "options": [
            "$980",
            "$981.02",
            "$980.98"
          ],
          "correctAnswer": 2,
          "explanation": "The $980 notional incurs a $0.98 fee at 0.1%. Add the purchase notional and charge to get $980.98 total cash debit."
        },
        {
          "prompt": "Which record distinguishes a displayed estimate from an executed order?",
          "options": [
            "Only the latest chart colour",
            "The execution receipt’s quantity, price, fee and time",
            "Only the older screenshot of the quote"
          ],
          "correctAnswer": 1,
          "explanation": "A displayed estimate can become outdated before submission. The completed order receipt identifies the actual inputs and charge used by the transaction."
        }
      ],
      "reflection": "What two timestamps would help explain this transaction?",
      "reflectionGuide": "Identify when the display was loaded and when the transaction was recorded. Keep price change, fee and unsupported real-order execution assumptions separate when reconstructing the amount.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-24",
      "title": "A closed market can have a fresh fetch",
      "category": "Price data",
      "scenario": "A stock’s last eligible quote was observed on Friday afternoon. The page fetches that same observation on Sunday. No new stock trade is stated. Crypto on the page has a separate Sunday observation. The shared interface can therefore contain assets with different ages even when the page request itself is recent.\n\nFor precise age arithmetic, assume the stock observation occurred Friday at 16:00 and the page fetch happened Sunday at 16:00 in the same timezone. Crypto was observed Sunday at 15:58. Ignore holidays and unusual trading sessions; none is supplied. Compare observation ages and decide which labels are supported. A working server on Sunday can retrieve an older eligible stock mark without creating a new stock trade.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "observation age (minutes)",
        "bars": [
          {
            "label": "Stock observation age",
            "value": 2880
          },
          {
            "label": "Crypto observation age",
            "value": 2
          }
        ]
      },
      "questions": [
        {
          "prompt": "Does a Sunday fetch prove the stock traded on Sunday?",
          "options": [
            "Yes; all markets share crypto hours",
            "No; it may return the earlier observation",
            "Yes; every fetch creates a market trade"
          ],
          "correctAnswer": 1,
          "explanation": "Fetching data and observing a new market transaction are different events. The case explicitly supplies an earlier stock observation; a recent HTTP response must not be presented as evidence of Sunday stock trading."
        },
        {
          "prompt": "Should the stock inherit the crypto quote’s freshness label?",
          "options": [
            "Yes; one fresh quote refreshes all holdings",
            "No; freshness belongs to each observation",
            "Yes; both are on one page"
          ],
          "correctAnswer": 1,
          "explanation": "Each asset has its own source and timestamp. A shared page or batch request does not make every observation equally recent. Per-asset freshness prevents a current crypto quote from hiding an older stock mark."
        },
        {
          "prompt": "What wording best describes this stock mark?",
          "options": [
            "A guaranteed Sunday sale price",
            "Last observed quote, with its Friday timestamp",
            "Live Sunday stock tick"
          ],
          "correctAnswer": 1,
          "explanation": "The supplied timestamp gives readers evidence for the mark’s age. “Last observed” is precise without inventing a new transaction or promising an executable price during a different market session."
        },
        {
          "prompt": "How many hours old is the stock observation at the Sunday fetch?",
          "options": [
            "48 hours",
            "24 hours",
            "Zero hours"
          ],
          "correctAnswer": 0,
          "explanation": "Friday 16:00 to Sunday 16:00 spans two days, or 48 hours in this fixed-time worksheet. The fetch timestamp does not replace the observation timestamp."
        },
        {
          "prompt": "How old is the crypto observation at Sunday 16:00?",
          "options": [
            "48 hours",
            "Zero minutes",
            "Two minutes"
          ],
          "correctAnswer": 2,
          "explanation": "Subtract Sunday 15:58 from 16:00 to obtain two minutes. That age belongs to the crypto quote and cannot be assigned to the stock."
        },
        {
          "prompt": "Which phrase would misrepresent the stock data in this case?",
          "options": [
            "Cached eligible stock mark",
            "Stock price newly observed on Sunday at 16:00",
            "Stock observation from Friday, retrieved Sunday"
          ],
          "correctAnswer": 1,
          "explanation": "No new stock observation is supplied on Sunday. Calling the mark newly observed would confuse a successful retrieval with the underlying market event."
        },
        {
          "prompt": "Does a 48-hour-old mark establish the stock’s next reopening price?",
          "options": [
            "No; the reopening price is not supplied",
            "Yes; a cached quote guarantees the next trade",
            "Yes; the page fetch locks the stock price"
          ],
          "correctAnswer": 0,
          "explanation": "The prior eligible mark can support a labelled valuation, but it does not predict or guarantee the price at the next trading session."
        },
        {
          "prompt": "What extra information could affect whether Friday is the last eligible observation?",
          "options": [
            "Only the crypto refresh rate",
            "Only the browser’s battery level",
            "The venue’s actual trading-session calendar and source rules"
          ],
          "correctAnswer": 2,
          "explanation": "Trading calendars and provider coverage determine which observations are eligible. The worksheet’s simplified timing should not be converted into a universal venue rule."
        },
        {
          "prompt": "Which timestamp may legitimately change on a Sunday cache retrieval?",
          "options": [
            "The original stock trade date",
            "The page’s fetch time",
            "The original stock observation time"
          ],
          "correctAnswer": 1,
          "explanation": "A retrieval creates a new fetch timestamp. Preserving the older observation allows the interface to show the mark’s real age rather than falsely making it fresh."
        },
        {
          "prompt": "What is a defensible combined-account freshness description?",
          "options": [
            "Mixed ages, with each holding’s observation shown",
            "Every holding is real-time because one is recent",
            "All assets share the newest crypto timestamp"
          ],
          "correctAnswer": 0,
          "explanation": "Different holdings can depend on different observation windows. Showing their individual ages avoids treating one fresh asset as evidence that the entire account has current prices."
        }
      ],
      "reflection": "Explain how you would display mixed freshness in a portfolio.",
      "reflectionGuide": "Use per-asset source and observation times, with a compact summary when any holdings are stale. Keep the fetch time available without presenting it as the market timestamp for every row.",
      "sources": [
        {
          "label": "CoinGecko — Price methodology",
          "url": "https://www.coingecko.com/en/methodology"
        }
      ]
    },
    {
      "id": "practice-34",
      "title": "A high win rate can lose money",
      "category": "Risk and uncertainty",
      "scenario": "In ten hypothetical attempts, eight gain $10 each and two lose $60 each. Ignore fees. The learner highlights the 80% win rate and calls the method profitable. Counting wins answers one question; comparing the dollars won and lost answers another. Work through both before deciding what the sample demonstrates.\n\nNow compare a separate sample with the same eight $10 winners but two $30 losses. Then introduce $1 of hypothetical cost per attempt to both samples. The winner count remains eight in either branch. Track total winnings, losses and costs so the changing outcome is explained by payoff sizes rather than a different win-rate headline.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Total gains",
            "value": 80
          },
          {
            "label": "Total losses",
            "value": 120
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the total from the eight winners?",
          "options": [
            "$80",
            "$800",
            "$10"
          ],
          "correctAnswer": 0,
          "explanation": "Eight gains of $10 sum to $80. A count of profitable attempts does not tell you the total dollars earned unless the size of each outcome is included."
        },
        {
          "prompt": "What is the net result across all ten attempts?",
          "options": [
            "−$40",
            "+$80",
            "+$40"
          ],
          "correctAnswer": 0,
          "explanation": "The two $60 losses total $120. Subtract $120 from $80 for a $40 loss. The 80% win rate is accurate, but it does not make the sample profitable."
        },
        {
          "prompt": "Which summary better explains performance than win rate alone?",
          "options": [
            "Win frequency plus gain/loss sizes and costs",
            "Only the largest winning streak",
            "Only the number of green entries"
          ],
          "correctAnswer": 0,
          "explanation": "Frequency and magnitude must be considered together. Costs can further reduce net results. A useful review includes all outcomes rather than selecting a statistic that looks favorable while omitting the account impact."
        },
        {
          "prompt": "What dollar loss comes from the two original $60 losers?",
          "options": [
            "$60",
            "$20",
            "$120"
          ],
          "correctAnswer": 2,
          "explanation": "Two losing attempts at $60 each produce $120 in losses. Comparing this amount with $80 total winnings reveals why the high win rate is insufficient."
        },
        {
          "prompt": "What is average gross result per attempt in the original sample?",
          "options": [
            "−$40",
            "−$4",
            "+$8"
          ],
          "correctAnswer": 1,
          "explanation": "The original sample loses $40 across ten attempts. Dividing by ten gives a −$4 average gross result, despite eight wins."
        },
        {
          "prompt": "What is the original average winner-to-loser magnitude ratio?",
          "options": [
            "1:6",
            "6:1",
            "8:2"
          ],
          "correctAnswer": 0,
          "explanation": "A typical winner is $10 while a loser is $60. The 1:6 payoff-size ratio differs from the 8:2 count of winning and losing attempts."
        },
        {
          "prompt": "With two $30 losses instead, what is the alternative gross result?",
          "options": [
            "−$40",
            "+$80",
            "+$20"
          ],
          "correctAnswer": 2,
          "explanation": "The eight winners still total $80, but the alternative losses total $60. Subtract losses to obtain a $20 gross gain at the same 80% win rate."
        },
        {
          "prompt": "What total cost applies at $1 per attempt in either ten-attempt sample?",
          "options": [
            "$8",
            "$10",
            "$1"
          ],
          "correctAnswer": 1,
          "explanation": "Charge the stated $1 for every attempt, including losses. Ten attempts therefore cost $10; counting only the eight winners would miss two charges."
        },
        {
          "prompt": "What is the alternative sample’s net result after those costs?",
          "options": [
            "+$10",
            "+$20",
            "−$10"
          ],
          "correctAnswer": 0,
          "explanation": "Reduce its $20 gross gain by $10 costs. The sample remains positive, but its net result is smaller than the headline price-only result."
        },
        {
          "prompt": "Which factor changed performance while leaving the win rate unchanged?",
          "options": [
            "The number of winning attempts",
            "The percentage of winners",
            "The average losing amount"
          ],
          "correctAnswer": 2,
          "explanation": "Both samples have eight wins and two losses. Reducing loser size changes net dollars even with an identical win-rate summary."
        }
      ],
      "reflection": "Write a fair two-sentence review of this method’s sample.",
      "reflectionGuide": "Report eight winners out of ten and the $40 gross loss. Explain that the two larger losses outweighed the small gains. Avoid claiming either future success or failure from this small hypothetical sample.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-44",
      "title": "One rumor is not three independent sources",
      "category": "Decision habits",
      "scenario": "Three hypothetical social posts repeat the same anonymous rumor about a company. All link back to the same original post, and none cites a company filing. Counting the reposts as independent confirmation exaggerates the evidence. Trace the source chain before using popularity as a reason for a simulated decision.\n\nDraw the source chain as one anonymous origin feeding three reposts. Now suppose a fourth message repeats the same claim but provides no new source, while a separate company document is located but says nothing about the rumor. Trace which items add independent information and which merely repeat or fail to address the claim. A primary document’s existence alone is not confirmation of every allegation.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "posts",
        "bars": [
          {
            "label": "Reposts",
            "value": 3
          },
          {
            "label": "Original rumor source",
            "value": 1
          }
        ]
      },
      "questions": [
        {
          "prompt": "How many original rumor sources are stated here?",
          "options": [
            "Three",
            "Four",
            "One"
          ],
          "correctAnswer": 2,
          "explanation": "The three posts share one anonymous origin. Multiple repetitions can amplify visibility without adding independent evidence. The source chain matters more than the raw number of posts."
        },
        {
          "prompt": "What would be a stronger next verification step?",
          "options": [
            "Count more reposts of the same rumor",
            "Assume popularity confirms accuracy",
            "Find a relevant primary statement or filing"
          ],
          "correctAnswer": 2,
          "explanation": "A primary record can provide attributable information to compare with the claim. It may confirm, contradict or leave the rumor unresolved. More copies of the same unsupported statement do not independently verify it."
        },
        {
          "prompt": "How should the claim be labelled while unresolved?",
          "options": [
            "A confirmed company fact",
            "A guaranteed catalyst",
            "An unverified rumor with its source identified"
          ],
          "correctAnswer": 2,
          "explanation": "Labelling the uncertainty prevents an unattributed claim from being presented as established evidence. A price reaction or a large audience does not itself prove that the underlying statement is correct."
        },
        {
          "prompt": "How many independent stated rumor origins are there after the fourth repost?",
          "options": [
            "Two",
            "One",
            "Four"
          ],
          "correctAnswer": 1,
          "explanation": "The fourth message still traces to the same anonymous origin. Repost count increases distribution without adding a new independent source for the claim."
        },
        {
          "prompt": "What does a company document silent on the rumor establish?",
          "options": [
            "It does not by itself confirm or disprove the rumor",
            "It automatically proves the rumor true",
            "It proves every anonymous claim false"
          ],
          "correctAnswer": 0,
          "explanation": "A document that does not address the claim supplies no direct resolution. Its primary-source status does not make unrelated silence into confirmation."
        },
        {
          "prompt": "Which finding would directly improve verification of the specific claim?",
          "options": [
            "A fifth repost of the same anonymous text",
            "More reactions on the first post",
            "Relevant attributable evidence addressing the allegation"
          ],
          "correctAnswer": 2,
          "explanation": "Verification improves when evidence addresses the actual allegation and can be traced to an accountable source. Popularity and repetition do not provide that link."
        },
        {
          "prompt": "Why is three reposts not equivalent to three independent confirmations?",
          "options": [
            "Only the first person can ever publish evidence",
            "They share the same underlying source",
            "All reposts are necessarily false"
          ],
          "correctAnswer": 1,
          "explanation": "Dependence matters: the messages reproduce one origin rather than three separate observations. This does not prove falsity, but it prevents treating the count as corroboration."
        },
        {
          "prompt": "How should a unresolved claim appear in a practice journal?",
          "options": [
            "Attributed and explicitly unverified",
            "Presented as a confirmed company event",
            "Removed from uncertainty notes because it is popular"
          ],
          "correctAnswer": 0,
          "explanation": "Attribution and an unresolved label preserve the difference between a claim and established information. That helps future review avoid treating repeated rumor as fact."
        },
        {
          "prompt": "Does the rumor’s popularity supply a probability of its truth in this case?",
          "options": [
            "Yes; three shares imply 75% truth",
            "Yes; more shares guarantee accuracy",
            "No; no calibrated reliability evidence was given"
          ],
          "correctAnswer": 2,
          "explanation": "The supplied repost count has no calibrated relationship to truth. A probability would need a defensible method and relevant evidence beyond social repetition."
        },
        {
          "prompt": "Which source-note structure best preserves this chain?",
          "options": [
            "Only the most-liked message saved",
            "Origin, repost links and verification status recorded separately",
            "Every repost labelled an independent original"
          ],
          "correctAnswer": 1,
          "explanation": "Keeping origin and distribution distinct exposes dependencies. Recording verification status also prevents later readers from assuming an unresolved claim was checked successfully."
        }
      ],
      "reflection": "Draft an evidence note that does not spread the rumor as fact.",
      "reflectionGuide": "Identify that the posts share an anonymous origin, record what primary evidence is missing, and state what would resolve the question. Avoid repeating the claim with confident language simply because others did.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-05",
      "title": "A rebound that does not restore the balance",
      "category": "Portfolio arithmetic",
      "scenario": "A hypothetical account begins at $100,000, falls to $80,000, and then rises 20% from that lower balance. No money enters or leaves. Someone adds −20% and +20% and declares the account even. Follow the dollar amounts instead: returns apply to the balance present at the start of each interval.\n\nFrom the $96,000 rebound balance, consider a 5% gain and a 5% loss as separate next intervals. Each starts at $96,000 and neither is a prediction. Compare the new balances with the original $100,000. A classmate says any profitable interval means recovery is complete. Check that claim using the actual gap: the reference point for one interval’s return is different from the reference point for full recovery.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Start",
            "value": 100000
          },
          {
            "label": "After loss",
            "value": 80000
          },
          {
            "label": "After rebound",
            "value": 96000
          }
        ]
      },
      "questions": [
        {
          "prompt": "What balance follows the 20% rebound from $80,000?",
          "options": [
            "$100,000",
            "$120,000",
            "$96,000"
          ],
          "correctAnswer": 2,
          "explanation": "The rebound adds $80,000 × 0.20 = $16,000. The resulting $96,000 is still $4,000 below the initial balance. The rise and fall use different dollar bases."
        },
        {
          "prompt": "What percentage gain from $80,000 would restore $100,000?",
          "options": [
            "20%",
            "40%",
            "25%"
          ],
          "correctAnswer": 2,
          "explanation": "The missing $20,000 must be divided by the current $80,000: 0.25. A 25% rise recovers the original balance. This arithmetic says nothing about how likely or how soon such a rise is."
        },
        {
          "prompt": "What is the full-period return after the stated rebound?",
          "options": [
            "0%",
            "+4%",
            "−4%"
          ],
          "correctAnswer": 2,
          "explanation": "Compare the final $96,000 with the original $100,000. The $4,000 shortfall is 4% of starting value. Compounding multiplies interval growth factors; adding the two percentages would give the wrong answer."
        },
        {
          "prompt": "How many dollars were lost in the initial fall?",
          "options": [
            "$25,000",
            "$20,000",
            "$16,000"
          ],
          "correctAnswer": 1,
          "explanation": "Subtract the $80,000 trough from the $100,000 start. This $20,000 loss represents 20% of starting equity, rather than 20% of the later trough."
        },
        {
          "prompt": "How many dollars were gained in the stated 20% rebound?",
          "options": [
            "$16,000",
            "$20,000",
            "$4,000"
          ],
          "correctAnswer": 0,
          "explanation": "Multiply the reduced $80,000 balance by 20%. The $16,000 gain is smaller than the earlier loss even though the interval percentages have the same magnitude."
        },
        {
          "prompt": "How far below the original start is the $96,000 account?",
          "options": [
            "$16,000",
            "$20,000",
            "$4,000"
          ],
          "correctAnswer": 2,
          "explanation": "Subtract current $96,000 from original $100,000. The $4,000 remaining gap is distinct from both the $20,000 first loss and $16,000 rebound gain."
        },
        {
          "prompt": "What rise from $96,000 would exactly restore the start, approximately?",
          "options": [
            "20%",
            "4.17%",
            "4%"
          ],
          "correctAnswer": 1,
          "explanation": "Divide the required $4,000 recovery by current $96,000 equity. Using the original balance as denominator would understate the next interval’s required return."
        },
        {
          "prompt": "In the separate 5% gain branch, what is the next balance?",
          "options": [
            "$100,800",
            "$101,000",
            "$96,005"
          ],
          "correctAnswer": 0,
          "explanation": "Multiplying $96,000 by 1.05 gives $100,800. This branch goes $800 above the original account balance; the gain is calculated from its own interval start."
        },
        {
          "prompt": "In the separate 5% loss branch, what is the next balance?",
          "options": [
            "$90,000",
            "$95,995",
            "$91,200"
          ],
          "correctAnswer": 2,
          "explanation": "Multiply $96,000 by 0.95 to get $91,200. The $4,800 interval loss should not be calculated from the original $100,000 account instead."
        },
        {
          "prompt": "Why can a profitable interval still leave recovery incomplete?",
          "options": [
            "Recovery uses only the count of winning days",
            "Equity may remain below the original reference balance",
            "Every gain erases all previous losses"
          ],
          "correctAnswer": 1,
          "explanation": "An interval can be positive while equity remains below its starting level or peak. Recovery requires comparing actual balances with an explicitly chosen reference."
        }
      ],
      "reflection": "Explain the mistake without using the word “compounding.”",
      "reflectionGuide": "Describe how losing $20,000 leaves a smaller amount to grow. A 20% gain on $80,000 adds only $16,000. Use the changing base to explain the remaining shortfall.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-15",
      "title": "A spread is not a commission",
      "category": "Costs and orders",
      "scenario": "Outside the simulator, a hypothetical venue shows a $99 bid and $101 ask. A buyer crosses the ask and immediately sells at the unchanged bid. Ignore commissions and use one unit. This worksheet isolates spread cost; TradeHQ’s single provider quote and 0.1% fee should not be described as a real bid-ask order book.\n\nRepeat the conceptual bid-ask example with ten units rather than one. Keep the $99 bid and $101 ask unchanged and continue excluding commissions. Then compare the $100 midpoint with the quotes at which this particular immediate buy and sale occur. These are external venue mechanics; do not assume TradeHQ offers this order book or executes at its midpoint.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Bid",
            "value": 99
          },
          {
            "label": "Ask",
            "value": 101
          }
        ]
      },
      "questions": [
        {
          "prompt": "At which stated quote does this hypothetical buyer purchase?",
          "options": [
            "$100 midpoint",
            "$101 ask",
            "$99 bid"
          ],
          "correctAnswer": 1,
          "explanation": "A buyer accepting the displayed seller’s price crosses the ask at $101. The midpoint is a comparison reference, not a guaranteed executable quote in this example."
        },
        {
          "prompt": "What happens after immediately selling at the unchanged bid?",
          "options": [
            "A $2 gross gain",
            "A $2 gross loss",
            "No loss because the midpoint is stable"
          ],
          "correctAnswer": 1,
          "explanation": "Paying $101 and receiving $99 produces a $2 loss before commissions. An unchanged midpoint does not remove the difference between the two sides of the market."
        },
        {
          "prompt": "How should this worksheet be compared with TradeHQ?",
          "options": [
            "As the simulator’s hidden $2 fee",
            "As a separate execution-cost concept",
            "As proof TradeHQ fills at a real exchange ask"
          ],
          "correctAnswer": 1,
          "explanation": "This exercise describes an explicitly hypothetical bid-ask venue. The simulator uses marked snapshots and its stated fee; a lesson must not invent exchange routing, order-book fills or costs that the product does not implement."
        },
        {
          "prompt": "What is the dollar width between the stated bid and ask?",
          "options": [
            "$2 per unit",
            "$1 per unit",
            "$200 per unit"
          ],
          "correctAnswer": 0,
          "explanation": "Subtract $99 bid from $101 ask to obtain a $2 spread. The midpoint is between the two quotes but does not reduce their actual separation."
        },
        {
          "prompt": "What is the arithmetic midpoint of the bid and ask?",
          "options": [
            "$99",
            "$101",
            "$100"
          ],
          "correctAnswer": 2,
          "explanation": "Average $99 and $101 to get $100. A reference midpoint is not proof that either crossing transaction in this worksheet executes at that value."
        },
        {
          "prompt": "What does buying ten units at the ask cost before commissions?",
          "options": [
            "$990",
            "$1,010",
            "$1,000"
          ],
          "correctAnswer": 1,
          "explanation": "Ten units at the $101 ask require $1,010. Using the midpoint instead would understate the explicit buy price supplied by the case."
        },
        {
          "prompt": "What proceeds come from selling those ten units immediately at the bid?",
          "options": [
            "$990",
            "$1,000",
            "$1,010"
          ],
          "correctAnswer": 0,
          "explanation": "Ten units at the unchanged $99 bid yield $990 before commissions. The proceeds use the buyer’s available bid, not the earlier ask."
        },
        {
          "prompt": "What is the ten-unit round-trip loss with quotes unchanged?",
          "options": [
            "$10",
            "$0",
            "$20"
          ],
          "correctAnswer": 2,
          "explanation": "Subtract $990 sale proceeds from $1,010 purchase cost. The $20 difference is ten times the $2 per-unit spread, even without commissions."
        },
        {
          "prompt": "What is that loss as a percentage of the $1,010 buy cost, approximately?",
          "options": [
            "0%",
            "1.98%",
            "2.02%"
          ],
          "correctAnswer": 1,
          "explanation": "Divide the $20 loss by $1,010 cash spent. A percentage using the bid proceeds as denominator answers a different question and gives a different result."
        },
        {
          "prompt": "Would a separate commission eliminate the spread cost?",
          "options": [
            "No; it would be an additional cost under its own rule",
            "Yes; commission replaces the bid-ask difference",
            "Yes; the midpoint refunds every spread"
          ],
          "correctAnswer": 0,
          "explanation": "A commission and spread arise from different mechanisms. If both apply, calculate each explicitly rather than treating one as compensation for the other."
        }
      ],
      "reflection": "Explain why a flat midpoint may coexist with a trading loss.",
      "reflectionGuide": "Describe buying at one side and selling at the other, using the $101 and $99 inputs. Mention separately excluded commissions and identify that the worksheet is outside the simulator execution model.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-25",
      "title": "A ticker can identify more than one asset",
      "category": "Price data",
      "scenario": "A learner sees the same short symbol on two crypto listings. The listings have different provider identifiers and describe different projects. One is quoted at $2 and the other at $20. These are hypothetical projects. Choosing the first matching ticker would value ten units very differently, so identity must be checked before arithmetic.\n\nName the projects A and B and retain their separate provider identifiers. Project A is $2 and B is $20 per unit. Your account holds ten units of A. A lookup bug returns B’s quote solely because the ticker matches. Calculate the correct mark and the erroneous one, then identify which evidence is needed to repair the mapping without silently reclassifying the user’s holding.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Project A quote",
            "value": 2
          },
          {
            "label": "Project B quote",
            "value": 20
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the value of ten units of project A at its stated quote?",
          "options": [
            "$20",
            "$200",
            "$2"
          ],
          "correctAnswer": 0,
          "explanation": "Ten units multiplied by project A’s $2 quote give $20. Using the other project’s $20 quote would value the holding at $200 and introduce a tenfold identity error."
        },
        {
          "prompt": "Which field helps distinguish the two listings?",
          "options": [
            "The explicit provider asset identifier",
            "Only the shared ticker",
            "The higher price"
          ],
          "correctAnswer": 0,
          "explanation": "A short symbol can be ambiguous. A stable provider identifier and project information help establish which asset is meant. Price magnitude is not a dependable way to resolve an identity mismatch."
        },
        {
          "prompt": "What should happen when an asset mapping is uncertain?",
          "options": [
            "Flag it instead of silently using another project",
            "Use the first symbol match",
            "Average the unrelated project prices"
          ],
          "correctAnswer": 0,
          "explanation": "A wrong identity makes subsequent calculations misleading even if multiplication is correct. Flagging an unsupported or uncertain mapping is more honest than silently substituting a different asset with a familiar symbol."
        },
        {
          "prompt": "What value would the incorrect B quote assign to ten A units?",
          "options": [
            "$20",
            "$2",
            "$200"
          ],
          "correctAnswer": 2,
          "explanation": "Ten units times the incorrect $20 quote gives $200. The arithmetic is internally consistent, but the instrument identity feeding it is wrong."
        },
        {
          "prompt": "By how many dollars does that incorrect mark overstate the holding?",
          "options": [
            "$200",
            "$180",
            "$18"
          ],
          "correctAnswer": 1,
          "explanation": "The correct A value is $20 and the incorrect value is $200. Subtract to obtain a $180 overstatement caused by the mapping, not market performance."
        },
        {
          "prompt": "How many times as large is the erroneous mark as the correct mark?",
          "options": [
            "Ten times",
            "Two times",
            "One hundred times"
          ],
          "correctAnswer": 0,
          "explanation": "Divide the incorrect $200 mark by the correct $20 value. A shared ticker led to a tenfold valuation error in the selected example."
        },
        {
          "prompt": "What should a repaired mapping preserve about the original holding?",
          "options": [
            "It becomes ten units of B automatically",
            "It becomes one unit of B to match dollars",
            "It remains ten units of project A"
          ],
          "correctAnswer": 2,
          "explanation": "Repairing a quote lookup should not change the owned instrument or quantity. The account bought A, so corrections must restore A’s appropriate mark."
        },
        {
          "prompt": "Which information provides stronger identity evidence than the short ticker?",
          "options": [
            "Only a similar logo colour",
            "Provider ID and project or contract details",
            "Only a matching first letter"
          ],
          "correctAnswer": 1,
          "explanation": "A unique provider identifier and project details help disambiguate reused symbols. A ticker or appearance alone cannot establish the instrument being valued."
        },
        {
          "prompt": "Should a lookup uncertainty be represented as a verified current quote?",
          "options": [
            "No; expose the uncertainty and use a labelled fallback if needed",
            "Yes; the higher price is safer",
            "Yes; any matching symbol is sufficient"
          ],
          "correctAnswer": 0,
          "explanation": "Uncertain identity prevents a defensible provider mark. A clearly labelled fallback preserves the distinction between missing mapping evidence and a verified price."
        },
        {
          "prompt": "Which audit would reveal this identity error most directly?",
          "options": [
            "Count how many times the page refreshed",
            "Check whether both numbers are positive",
            "Compare the holding’s identifier with the fetched quote’s identifier"
          ],
          "correctAnswer": 2,
          "explanation": "A positive numeric response can still describe the wrong asset. Matching identifiers across the holding and quote is necessary before validating the valuation arithmetic."
        }
      ],
      "reflection": "Write an identity checklist before accepting a quote.",
      "reflectionGuide": "Match the provider ID, project name and supported asset mapping, then check currency and observation time. If these disagree, retain an explicit unavailable or fallback label while investigating.",
      "sources": [
        {
          "label": "CoinGecko — Price methodology",
          "url": "https://www.coingecko.com/en/methodology"
        }
      ]
    },
    {
      "id": "practice-35",
      "title": "A few winners do not establish an edge",
      "category": "Risk and uncertainty",
      "scenario": "A new practice method has three hypothetical winning attempts and no recorded losses yet. Its author announces a 100% success rate and invites others to copy it. The count is mathematically true for the recorded sample, but evidence about repeatability is still weak. Consider sample size, selection and uncertainty before interpreting the headline.\n\nAssume each of the first three wins earned $20 before costs. Then add a fourth attempt losing $80 as a continuation, with no other attempts supplied. Compare the initial and expanded summaries. The new observation does not prove the method will fail forever, but it demonstrates how a very small sample’s headline can change abruptly.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "recorded attempts",
        "bars": [
          {
            "label": "Winners",
            "value": 3
          },
          {
            "label": "Losers",
            "value": 0
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the observed win rate for the three recorded attempts?",
          "options": [
            "Proof of a guaranteed 100% future rate",
            "33%",
            "100% within this sample"
          ],
          "correctAnswer": 2,
          "explanation": "Three winners divided by three recorded attempts is 100%. The qualifier matters: it describes these observations only. A tiny observed sample should not be treated as a promise about future outcomes."
        },
        {
          "prompt": "What missing information most affects the claim?",
          "options": [
            "A more impressive strategy name",
            "The author’s preferred chart theme",
            "A complete, larger record with losses and selection rules"
          ],
          "correctAnswer": 2,
          "explanation": "You need to know what was counted, whether failed attempts were omitted and how results behave across more conditions. Three selected winners alone cannot separate skill, chance and reporting bias."
        },
        {
          "prompt": "What is an appropriate next practice step?",
          "options": [
            "Increase exposure because losses are impossible",
            "Delete any later losing entry",
            "Record prospective attempts under consistent rules"
          ],
          "correctAnswer": 2,
          "explanation": "Define the method before observing results and record subsequent outcomes consistently. That reduces hindsight editing and cherry-picking. Practice remains simulated, and a broader record still carries uncertainty rather than a guarantee."
        },
        {
          "prompt": "What total gross gain was recorded in the first three attempts?",
          "options": [
            "$100",
            "$60",
            "$20"
          ],
          "correctAnswer": 1,
          "explanation": "Three wins at $20 each give $60 total gross gain. This statement describes the supplied observations and does not establish future payoff reliability."
        },
        {
          "prompt": "After adding one losing attempt, what is the expanded observed win rate?",
          "options": [
            "75%",
            "100%",
            "25%"
          ],
          "correctAnswer": 0,
          "explanation": "Three wins out of four total attempts produce 75%. A single added result changes the small-sample rate substantially without changing the first three records."
        },
        {
          "prompt": "What is net gross result across the three wins and one $80 loss?",
          "options": [
            "+$60",
            "−$80",
            "−$20"
          ],
          "correctAnswer": 2,
          "explanation": "Subtract the $80 fourth-attempt loss from $60 earlier gains. The expanded sample loses $20 despite winning on three of four attempts."
        },
        {
          "prompt": "What is the expanded average gross result per attempt?",
          "options": [
            "−$20",
            "−$5",
            "+$15"
          ],
          "correctAnswer": 1,
          "explanation": "Divide the $20 sample loss by four attempts. The −$5 average reflects payoff sizes as well as the counts of wins and losses."
        },
        {
          "prompt": "Would hiding the fourth attempt make the method’s reported evidence representative?",
          "options": [
            "No; it would select only favourable observations",
            "Yes; losing attempts do not count",
            "Yes; the original headline must stay unchanged"
          ],
          "correctAnswer": 0,
          "explanation": "A transparent record includes the fourth result under the same inclusion rule. Removing it after seeing the outcome would introduce selection bias."
        },
        {
          "prompt": "Does the fourth attempt prove every future attempt will lose?",
          "options": [
            "Yes; one loss guarantees a permanent negative edge",
            "Yes; the first three wins become invalid",
            "No; the expanded sample is still small"
          ],
          "correctAnswer": 2,
          "explanation": "The added loss weakens the initial success claim but does not establish all future outcomes. Keep uncertainty explicit and avoid reversing one absolute claim into another."
        },
        {
          "prompt": "What review would provide stronger evidence than either short headline?",
          "options": [
            "A promise to ignore future losses",
            "A defined inclusion rule, more observations and costs/exposure records",
            "Only more screenshots of wins"
          ],
          "correctAnswer": 1,
          "explanation": "Broader consistently recorded evidence supports better assessment of repeatability. Costs, exposure and predetermined inclusion rules matter alongside the number of observations."
        }
      ],
      "reflection": "How would you rewrite the author’s headline honestly?",
      "reflectionGuide": "Say “three recorded attempts were profitable” and identify the sample limit. Add the requirement for a complete record and avoid language implying verified skill or recommending that others copy the trades.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-45",
      "title": "Paper results omit some real-money pressures",
      "category": "Decision habits",
      "scenario": "A learner grows a hypothetical paper balance from $100,000 to $110,000 and says this proves they would make $10,000 with real savings. The simulator uses virtual cash and marked snapshots. Real execution, personal constraints and emotional responses are not fully reproduced. Calculate the paper result, then state what the experiment actually tested.\n\nTreat the $10,000 paper gain as a result under the simulator’s actual recorded conditions. Then consider a hypothetical external execution where additional costs would reduce that gross gain by $1,500; this is a separate worksheet, not a forecast of real trading. Compare what the virtual ledger demonstrates with what remains untested, including personal liquidity needs and reactions when real savings are at stake.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Paper start",
            "value": 100000
          },
          {
            "label": "Paper end",
            "value": 110000
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the paper account’s stated return?",
          "options": [
            "1%",
            "10%",
            "110%"
          ],
          "correctAnswer": 1,
          "explanation": "The hypothetical gain is $10,000 on $100,000, or 10%. It is a virtual result under the simulator’s inputs and rules, not evidence that real money has been earned."
        },
        {
          "prompt": "What does this result fail to establish?",
          "options": [
            "Whether virtual positions were displayed",
            "The same real-world outcome under different constraints",
            "Whether subtraction is possible"
          ],
          "correctAnswer": 1,
          "explanation": "The experiment does not reproduce every real cost, fill condition, emotional pressure or personal constraint. A paper gain can support learning while remaining insufficient to predict real returns."
        },
        {
          "prompt": "What is the most useful description of the achievement?",
          "options": [
            "Proof that losses are no longer possible",
            "A simulated result with a reviewable process and limitations",
            "A certified real-money profit"
          ],
          "correctAnswer": 1,
          "explanation": "Report the virtual outcome, the assumptions and the record of decisions. This preserves the educational value without turning one simulation into a guarantee or a certification of trading skill."
        },
        {
          "prompt": "How many virtual dollars did the stated paper balance gain?",
          "options": [
            "$10,000",
            "$110,000",
            "$1,000"
          ],
          "correctAnswer": 0,
          "explanation": "Subtract $100,000 starting virtual equity from $110,000 ending equity. The gain is a simulator result, rather than cash earned in a real account."
        },
        {
          "prompt": "Does this virtual result create $10,000 that can be withdrawn as real money?",
          "options": [
            "Yes; a profitable practice trade creates withdrawable cash",
            "Yes; completing the course redeems it",
            "No; the balance is virtual"
          ],
          "correctAnswer": 2,
          "explanation": "TradeHQ’s paper holdings and cash are educational simulation records. Their returns do not create real funds or establish a withdrawable financial entitlement."
        },
        {
          "prompt": "In the separate $1,500-extra-cost worksheet, what gain remains?",
          "options": [
            "$11,500",
            "$8,500",
            "$10,000"
          ],
          "correctAnswer": 1,
          "explanation": "Subtract the stipulated $1,500 additional cost from the $10,000 gross result. This arithmetic illustrates cost sensitivity without estimating actual execution expenses."
        },
        {
          "prompt": "What return would that $8,500 gain represent on $100,000, before other differences?",
          "options": [
            "8.5%",
            "10%",
            "1.5%"
          ],
          "correctAnswer": 0,
          "explanation": "Divide the hypothetical $8,500 gain by the $100,000 reference capital. This alternative return reflects a chosen cost assumption, not a proven real-money outcome."
        },
        {
          "prompt": "Which real-money constraint was not tested by the virtual starting balance alone?",
          "options": [
            "The written arithmetic of subtracting balances",
            "Whether virtual cash is labelled virtual",
            "The user’s actual liquidity needs and ability to bear loss"
          ],
          "correctAnswer": 2,
          "explanation": "A virtual account does not reproduce the user’s real savings needs or personal loss constraints. Those factors cannot be inferred from a profitable simulated record."
        },
        {
          "prompt": "Could real-money emotions differ despite identical written trade rules?",
          "options": [
            "No; a streak badge fixes all reactions",
            "Yes; financial stakes can change behaviour",
            "No; paper gains guarantee identical behaviour"
          ],
          "correctAnswer": 1,
          "explanation": "The simulator cannot establish that reactions with real savings will match practice behaviour. Keep this limitation explicit when describing what the exercise tested."
        },
        {
          "prompt": "Which achievement statement stays within the evidence?",
          "options": [
            "A 10% recorded virtual-account gain under simulator conditions",
            "A verified 10% future return on real savings",
            "Proof of professional trading competence"
          ],
          "correctAnswer": 0,
          "explanation": "The virtual result supports a factual description of the recorded experiment. It does not establish real-money execution equivalence, future returns or professional credentials."
        }
      ],
      "reflection": "Write a balanced description of this practice result.",
      "reflectionGuide": "Include the 10% virtual return and the conditions used, then describe what you learned about decisions or fees. State that real execution and personal risk are not validated by the paper account.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-06",
      "title": "Allocation drift uses a new total",
      "category": "Portfolio arithmetic",
      "scenario": "Your worksheet contains $40,000 in fund A and $60,000 in fund B. Fund A rises 25% while fund B stays flat. Ignore fees and cash flows. You originally assigned fund A a 40% weight. Before deciding whether it is above that target, recalculate both the holding value and the portfolio denominator.\n\nAt the new $110,000 portfolio total, examine a separate fee-free rebalance to 40% A and 60% B. Assume value can move between funds at unchanged marks without costs. Determine how much leaves A and enters B. The earlier price gain already belongs to equity; selling some of A does not create that gain again. In execution, an allocation target remains a plan until the appropriate supported orders occur.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "A before",
            "value": 40000
          },
          {
            "label": "A after",
            "value": 50000
          },
          {
            "label": "B unchanged",
            "value": 60000
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the new combined portfolio value?",
          "options": [
            "$125,000",
            "$110,000",
            "$100,000"
          ],
          "correctAnswer": 1,
          "explanation": "Fund A becomes $40,000 × 1.25 = $50,000. Fund B remains $60,000. Together they total $110,000; applying A’s 25% rise to the entire portfolio would overstate the change."
        },
        {
          "prompt": "What is fund A’s new weight, rounded to two decimals?",
          "options": [
            "40%",
            "45.45%",
            "50%"
          ],
          "correctAnswer": 1,
          "explanation": "Divide $50,000 by $110,000 and multiply by 100. The result is approximately 45.45%. A’s $10,000 gain changes both its numerator and the portfolio’s denominator."
        },
        {
          "prompt": "How far above the 40% target is that weight?",
          "options": [
            "About 10 percentage points",
            "About 5.45 percentage points",
            "About 25 percentage points"
          ],
          "correctAnswer": 1,
          "explanation": "Subtract the target weight from the current weight: 45.45% − 40% = 5.45 percentage points. Weight drift is distinct from the asset’s 25% price rise and does not by itself prove the asset is expensive."
        },
        {
          "prompt": "What is fund A’s dollar gain in the first interval?",
          "options": [
            "$10,000",
            "$25,000",
            "$12,500"
          ],
          "correctAnswer": 0,
          "explanation": "Apply the 25% move to $40,000 initial value to obtain $10,000. The gain percentage describes fund A, not the entire $100,000 portfolio."
        },
        {
          "prompt": "What is the portfolio’s first-interval return?",
          "options": [
            "25%",
            "40%",
            "10%"
          ],
          "correctAnswer": 2,
          "explanation": "Total value rises from $100,000 to $110,000. A’s 25% return contributes 10 percentage points because it began as 40% of total invested value."
        },
        {
          "prompt": "At $110,000 equity, what amount meets the 40% A target?",
          "options": [
            "$50,000",
            "$44,000",
            "$40,000"
          ],
          "correctAnswer": 1,
          "explanation": "Multiply current $110,000 equity by 0.40. The current target is $44,000, so restoring the original dollar position would not restore the percentage target."
        },
        {
          "prompt": "How much value moves from A to B in this fee-free branch?",
          "options": [
            "$6,000",
            "$10,000",
            "$4,000"
          ],
          "correctAnswer": 0,
          "explanation": "Subtract the $44,000 target from A’s $50,000 mark. Moving the $6,000 difference reduces A’s weight and raises B’s without changing total equity before costs."
        },
        {
          "prompt": "What value would fund B hold after the transfer?",
          "options": [
            "$60,000",
            "$70,000",
            "$66,000"
          ],
          "correctAnswer": 2,
          "explanation": "Add $6,000 transferred from A to B’s existing $60,000. The $66,000 result equals 60% of the unchanged $110,000 total."
        },
        {
          "prompt": "Does the transfer itself create another $6,000 gain?",
          "options": [
            "Yes; every sale creates new wealth",
            "No; it reallocates existing account value",
            "Yes; a transfer always adds its amount to equity"
          ],
          "correctAnswer": 1,
          "explanation": "The transaction exchanges one form of existing value for another. With unchanged marks and no costs or cash flows, reallocating does not create an additional gain."
        },
        {
          "prompt": "Which change would require revising this fee-free rebalance calculation?",
          "options": [
            "Fees or quotes changing during execution",
            "Only display colours changing",
            "Only a new page fetch timestamp"
          ],
          "correctAnswer": 0,
          "explanation": "The worksheet assumes unchanged marks and no costs. Fees or changed execution quotes alter cash and allocation, so the planned amounts must be reconsidered."
        }
      ],
      "reflection": "What information would you need before choosing whether to rebalance?",
      "reflectionGuide": "Identify the documented target, acceptable drift, costs and purpose of the allocation. A weight calculation reveals concentration; it cannot independently determine fair value or create a universal rebalancing rule.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-16",
      "title": "The planned exit is only a worksheet",
      "category": "Costs and orders",
      "scenario": "A learner holds ten units marked at $50 and writes “exit if the quote reaches $45” in a journal. TradeHQ supports manual market buys and sells, not automatic stop orders. For the arithmetic assume all ten units could be sold at exactly $45 and ignore fees. Then separate that calculation from what the written plan actually executes.\n\nSuppose the learner returns late and the available worksheet quote is $43 rather than the planned $45. Compare both assumed exits, initially excluding fees. Then calculate the fee on a ten-unit sale at $43. The journal condition was never a placed stop order. A calculation about a planned exit cannot guarantee the price available when a manual order is finally submitted.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Current position",
            "value": 500
          },
          {
            "label": "Assumed exit value",
            "value": 450
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the gross loss from $50 to the assumed $45 exit?",
          "options": [
            "$50",
            "$5",
            "$450"
          ],
          "correctAnswer": 0,
          "explanation": "Each unit loses $5 and ten units lose $50. The $450 exit value is proceeds, not loss. This calculation assumes an exact $45 exit and does not guarantee that execution price."
        },
        {
          "prompt": "Does writing the journal threshold place a simulator stop order?",
          "options": [
            "No; it records a plan only",
            "Yes; the journal submits an automatic sell",
            "Yes; every saved note becomes an order"
          ],
          "correctAnswer": 0,
          "explanation": "A written threshold helps define an intention but does not create a supported order type. A manual market sale still needs to be submitted. Journaling should not imply automatic monitoring or execution."
        },
        {
          "prompt": "Why might an actual manual exit differ from the worksheet?",
          "options": [
            "The observed quote and timing may differ",
            "A journal guarantees the threshold price",
            "The gross loss must always be exactly $50"
          ],
          "correctAnswer": 0,
          "explanation": "A user may see a different price when returning or submitting. The worksheet’s fixed exit is an assumption, not a fill guarantee. Fees would also affect a net result if included."
        },
        {
          "prompt": "What is the holding’s marked value at the original $50 quote?",
          "options": [
            "$50",
            "$450",
            "$500"
          ],
          "correctAnswer": 2,
          "explanation": "Multiply ten units by $50. This $500 reference value is the base for comparing the dollar declines to the two hypothetical exit quotes."
        },
        {
          "prompt": "What proceeds result from the assumed ten-unit exit at $45 before fees?",
          "options": [
            "$405",
            "$450",
            "$500"
          ],
          "correctAnswer": 1,
          "explanation": "Ten units at exactly $45 yield $450 before fees. The result is conditional on that stated execution price, rather than guaranteed by the journal note."
        },
        {
          "prompt": "What gross proceeds result from a later ten-unit exit at $43?",
          "options": [
            "$430",
            "$450",
            "$470"
          ],
          "correctAnswer": 0,
          "explanation": "Multiply ten units by the later $43 quote. The $430 proceeds are $20 below the planned $45-exit branch, before considering any transaction charge."
        },
        {
          "prompt": "What is the gross loss versus the $500 initial mark at a $43 exit?",
          "options": [
            "$50",
            "$20",
            "$70"
          ],
          "correctAnswer": 2,
          "explanation": "Subtract $430 gross proceeds from the initial $500 marked holding. The $70 loss includes both the planned decline and the extra $20 beyond it."
        },
        {
          "prompt": "What fee is charged on the stated $430 sale notional?",
          "options": [
            "$4.30",
            "$0.43",
            "$0.50"
          ],
          "correctAnswer": 1,
          "explanation": "Apply the 0.001 fee multiplier to $430 actual sale value. The fee is based on exit notional, not the old $500 mark or the $70 loss."
        },
        {
          "prompt": "What net cash proceeds follow that $43 sale?",
          "options": [
            "$429.57",
            "$430",
            "$429.50"
          ],
          "correctAnswer": 0,
          "explanation": "Subtract the $0.43 fee from $430 gross proceeds. This is net sale cash; any earlier purchase fees would additionally matter in a full-trade performance review."
        },
        {
          "prompt": "What would prove the simulator actually executed the manual exit?",
          "options": [
            "The journal threshold alone",
            "A price alert being viewed",
            "A recorded sell transaction and changed units"
          ],
          "correctAnswer": 2,
          "explanation": "Execution requires a completed supported order that changes holdings and creates a trade record. A journal note or observed quote alone does not execute anything."
        }
      ],
      "reflection": "Turn this threshold into an honest practice plan.",
      "reflectionGuide": "Say when you intend to review the position and which evidence would prompt a manual action. State that the journal does not execute it and that the assumed exit price is not protected.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-26",
      "title": "Unsupported does not mean real-time",
      "category": "Price data",
      "scenario": "A hypothetical portfolio holds an asset with a fixed simulator quote of $25. The provider has no usable mapping for that asset. Another holding has a valid provider snapshot. The fixed asset remains worth the same marked amount while the provider-priced holding changes. This is a fallback valuation, not evidence that the first asset’s real market stopped moving.\n\nAssume the account holds four units of the unsupported asset at its fixed $25 simulator mark, plus a provider-priced position worth $900. Later that second position rises to $990 while the unsupported mark stays fixed. No trades occur. A classmate claims that a functioning refresh makes both positions live-priced. Check the contribution of each holding and identify what the combined total can and cannot establish.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Fixed mark",
            "value": 25
          },
          {
            "label": "Provider mark",
            "value": 38
          }
        ]
      },
      "questions": [
        {
          "prompt": "What does the unchanged $25 mark establish?",
          "options": [
            "The real asset has no price movement",
            "Every venue traded at $25",
            "The simulator is using a fixed input"
          ],
          "correctAnswer": 2,
          "explanation": "The fixed value is an application input for unsupported pricing. Its stability describes the fallback, not the real market. A valuation label should explain that distinction so readers know the mark’s limitation."
        },
        {
          "prompt": "How should an account containing this asset be described?",
          "options": [
            "Fully continuous real-time pricing",
            "Entirely provider-priced because one quote is live",
            "A mix of provider-priced and fixed-price holdings"
          ],
          "correctAnswer": 2,
          "explanation": "Coverage is per asset. One usable provider quote does not convert another holding’s fixed fallback into current market data. A mixed account needs an honest summary and accessible detail for each position."
        },
        {
          "prompt": "What would improve the fallback situation?",
          "options": [
            "Removing all timestamps",
            "Calling the fixed value live",
            "A verified asset mapping and usable provider observation"
          ],
          "correctAnswer": 2,
          "explanation": "Expanded coverage requires a correct mapping and working data source. A label change cannot supply missing observations. Retain clear fallback status until verified data is available instead of hiding the limitation."
        },
        {
          "prompt": "What fixed marked value do four unsupported units have?",
          "options": [
            "$900",
            "$100",
            "$25"
          ],
          "correctAnswer": 1,
          "explanation": "Four units times the fixed $25 simulator quote gives $100. The arithmetic is valid for the simulator mark without verifying the asset’s real market price."
        },
        {
          "prompt": "What is the initial combined value of the two holdings?",
          "options": [
            "$1,000",
            "$925",
            "$900"
          ],
          "correctAnswer": 0,
          "explanation": "Add $100 fixed-mark value to $900 provider-marked value. The combined total depends on both methods, rather than being wholly provider-backed."
        },
        {
          "prompt": "What is their combined value after the provider holding rises to $990?",
          "options": [
            "$1,000",
            "$1,100",
            "$1,090"
          ],
          "correctAnswer": 2,
          "explanation": "The unsupported component stays $100 and the provider component becomes $990. Their sum rises by $90 even though only one component has a new provider mark."
        },
        {
          "prompt": "What return does this mixed two-holding worksheet show?",
          "options": [
            "0%",
            "9%",
            "10%"
          ],
          "correctAnswer": 1,
          "explanation": "The $90 increase divided by $1,000 starting total is 9%. That result reflects the supplied mixed marks and should not be called a fully live-market return."
        },
        {
          "prompt": "Does the fixed $25 mark prove the unsupported asset’s real price stayed flat?",
          "options": [
            "No; no usable provider observation was supplied",
            "Yes; fixed simulator marks freeze the real market",
            "Yes; every refresh verifies all catalog prices"
          ],
          "correctAnswer": 0,
          "explanation": "A fixed fallback supplies a simulator valuation input. It says nothing conclusive about the unsupported asset’s real-world trading between refreshes."
        },
        {
          "prompt": "What improvement would justify replacing this fallback with a provider mark?",
          "options": [
            "A random fluctuation around $25",
            "A more frequent loading animation",
            "A verified asset mapping and usable timestamped quote"
          ],
          "correctAnswer": 2,
          "explanation": "A trustworthy mapping and valid observation are required for provider pricing. Random movement or display refresh alone cannot supply missing market evidence."
        },
        {
          "prompt": "Which label fits this combined valuation?",
          "options": [
            "Guaranteed executable market value",
            "Mixed provider snapshots and fixed simulator marks",
            "All holdings priced in real time"
          ],
          "correctAnswer": 1,
          "explanation": "The total combines two different valuation inputs. Naming both methods communicates the limitation without dismissing the useful arithmetic of the stated account."
        }
      ],
      "reflection": "Draft a compact explanation for the fixed-price row.",
      "reflectionGuide": "Say that $25 is a fixed simulator input and is not a current real-market quote. Explain that total account value includes this assumption, even though other holdings may use newer provider snapshots.",
      "sources": [
        {
          "label": "CoinGecko — Price methodology",
          "url": "https://www.coingecko.com/en/methodology"
        }
      ]
    },
    {
      "id": "practice-36",
      "title": "Rank reflects return, not a complete risk record",
      "category": "Risk and uncertainty",
      "scenario": "Two hypothetical public practice accounts end at $120,000 and $115,000 from $100,000 starts. The first briefly fell to $65,000; the second’s low was $95,000. Ignore costs and cash flows. A return-ranked leaderboard can place the first account above the second without explaining the very different paths used to reach those final values.\n\nMeasure each supplied low against the $100,000 start, but do not call it maximum peak-to-trough drawdown without the complete path. Then calculate the gain needed to return from each low to the start. The two accounts have different downside paths even before considering their ending returns. A leaderboard can show one ranking metric without certifying superior decision quality or suitable personal risk.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "A final",
            "value": 120000
          },
          {
            "label": "A low",
            "value": 65000
          },
          {
            "label": "B final",
            "value": 115000
          },
          {
            "label": "B low",
            "value": 95000
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is account A’s ending return from the stated start?",
          "options": [
            "−35%",
            "20%",
            "65%"
          ],
          "correctAnswer": 1,
          "explanation": "The ending gain is $20,000 on $100,000, or 20%. The interim low describes another part of the path; it does not replace the final-value calculation."
        },
        {
          "prompt": "What does this ending-return comparison leave out?",
          "options": [
            "Whether the arithmetic can be done",
            "The size and timing of interim losses",
            "All useful information"
          ],
          "correctAnswer": 1,
          "explanation": "Ending return is useful but incomplete. The account paths show very different interim losses. A full drawdown calculation needs dated peaks and troughs, not merely a position on the final scoreboard."
        },
        {
          "prompt": "What is a responsible use of the leaderboard?",
          "options": [
            "Copy the top account’s positions",
            "Compare simulated outcomes while reviewing limitations",
            "Treat rank as a verified skill certification"
          ],
          "correctAnswer": 1,
          "explanation": "Practice ranks summarize selected simulated statistics. They do not certify a sustainable method, explain every risk or recommend real trades. User privacy choices and eligibility also affect which profiles appear."
        },
        {
          "prompt": "What is account B’s ending return from $100,000 to $115,000?",
          "options": [
            "15%",
            "20%",
            "5%"
          ],
          "correctAnswer": 0,
          "explanation": "Divide B’s $15,000 gain by $100,000 starting equity. This ending return is below A’s 20%, regardless of differences in their intervening paths."
        },
        {
          "prompt": "How far below the start was A’s supplied $65,000 low?",
          "options": [
            "65%",
            "20%",
            "35%"
          ],
          "correctAnswer": 2,
          "explanation": "The difference from $100,000 is $35,000, or 35% of the start. This is a start-to-low comparison, not a complete maximum-drawdown calculation."
        },
        {
          "prompt": "How far below the start was B’s supplied $95,000 low?",
          "options": [
            "95%",
            "5%",
            "15%"
          ],
          "correctAnswer": 1,
          "explanation": "Subtract $95,000 from $100,000 and divide the $5,000 gap by the start. B’s supplied low was 5% below its initial equity."
        },
        {
          "prompt": "What gain from A’s $65,000 low restores $100,000, approximately?",
          "options": [
            "53.85%",
            "35%",
            "65%"
          ],
          "correctAnswer": 0,
          "explanation": "Divide the $35,000 recovery gap by the reduced $65,000 balance. Recovery uses the low as denominator, so the required percentage exceeds its start-to-low loss."
        },
        {
          "prompt": "What gain from B’s $95,000 low restores $100,000, approximately?",
          "options": [
            "5%",
            "15%",
            "5.26%"
          ],
          "correctAnswer": 2,
          "explanation": "The $5,000 recovery gap divided by $95,000 gives approximately 5.26%. The recovery denominator differs from the starting-equity loss denominator."
        },
        {
          "prompt": "Which missing record prevents an exact maximum peak-to-trough drawdown comparison?",
          "options": [
            "Only the account usernames",
            "The complete chronological equity path",
            "Only the final leaderboard positions"
          ],
          "correctAnswer": 1,
          "explanation": "Maximum drawdown compares a peak with a later trough across the actual path. Starts, selected lows and endings do not necessarily reveal every relevant peak."
        },
        {
          "prompt": "What does A’s higher ending-return rank establish in this worksheet?",
          "options": [
            "Its stated ending return is higher under the ranking metric",
            "Its process is verified safer",
            "Its next-period return is guaranteed higher"
          ],
          "correctAnswer": 0,
          "explanation": "The rank orders the supplied final-return metric. It does not certify safety, skill or future performance, and other risk-path information remains important."
        }
      ],
      "reflection": "What extra journal evidence would help compare these accounts?",
      "reflectionGuide": "Ask for dated equity observations, position concentration, fees and the trade record. Explain why a return order can be mechanically correct while remaining insufficient for judging the quality of a method.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-46",
      "title": "A review rule beats checking from boredom",
      "category": "Decision habits",
      "scenario": "A learner refreshes a hypothetical position 40 times in an hour without any new evidence. Another schedules two observation sessions and records the same available facts. Neither count proves better returns. The question is whether checking serves a documented learning purpose or simply triggers repeated reactions to the same inputs.\n\nAssume the 40 refreshes take 30 seconds each, while the two planned sessions take five minutes each. Both inspect the same supplied evidence, with no new observation arriving. Compare time spent with useful information gathered. A review schedule can support attention and documentation, but it does not place orders or guarantee results. Consider what would justify checking sooner than planned.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "checks in the worksheet",
        "bars": [
          {
            "label": "Repeated checks",
            "value": 40
          },
          {
            "label": "Planned sessions",
            "value": 2
          }
        ]
      },
      "questions": [
        {
          "prompt": "Does the higher refresh count demonstrate a stronger method?",
          "options": [
            "No; activity count alone does not show learning quality",
            "Yes; more refreshes always improve returns",
            "Yes; each refresh is new evidence"
          ],
          "correctAnswer": 0,
          "explanation": "Repeatedly viewing the same information can increase activity without adding evidence. A useful evaluation asks what changed and what decision the check was meant to inform, rather than treating attention volume as skill."
        },
        {
          "prompt": "What should a planned observation session record?",
          "options": [
            "The input, its timestamp and any change to the thesis",
            "Only how often the button was clicked",
            "A claim that the next move is certain"
          ],
          "correctAnswer": 0,
          "explanation": "Record what was observed and whether it meets an established review condition. This separates new information from repeated exposure to the same quote and makes the learning process easier to assess."
        },
        {
          "prompt": "What does a review schedule do inside TradeHQ?",
          "options": [
            "Organize the user’s manual practice; it does not place orders",
            "Execute automatic stop orders",
            "Guarantee fresh market ticks"
          ],
          "correctAnswer": 0,
          "explanation": "A personal schedule helps organize attention but does not create an automated order or change provider observation timing. The simulator’s supported manual actions and shared pricing refresh remain separate features."
        },
        {
          "prompt": "How many minutes do forty 30-second checks consume?",
          "options": [
            "40 minutes",
            "10 minutes",
            "20 minutes"
          ],
          "correctAnswer": 2,
          "explanation": "Forty checks times half a minute equals 20 minutes. This measures time spent, not the amount of new information or the quality of decisions."
        },
        {
          "prompt": "How many minutes do two five-minute sessions consume?",
          "options": [
            "2 minutes",
            "10 minutes",
            "20 minutes"
          ],
          "correctAnswer": 1,
          "explanation": "Two sessions at five minutes each total ten minutes. Their lower time cost does not itself prove a better return or a complete review."
        },
        {
          "prompt": "How much additional time does the repeated-refresh approach use here?",
          "options": [
            "10 minutes",
            "30 minutes",
            "Zero minutes"
          ],
          "correctAnswer": 0,
          "explanation": "Compare 20 minutes of checks with ten minutes of planned sessions. The ten-minute difference quantifies this worksheet’s time cost without assigning value to every check."
        },
        {
          "prompt": "How many new observations are stated to arrive during those checks?",
          "options": [
            "Forty",
            "Two",
            "Zero"
          ],
          "correctAnswer": 2,
          "explanation": "The extension explicitly says the available evidence did not change. A refreshed interface does not by itself establish that a new underlying observation arrived."
        },
        {
          "prompt": "Which event could justify a documented earlier review?",
          "options": [
            "The refresh icon changing colour",
            "New relevant evidence or a predefined review condition",
            "Boredom alone counted as new market evidence"
          ],
          "correctAnswer": 1,
          "explanation": "A planned review can be adjusted when relevant information or a stated condition changes. That reason should be recorded rather than assumed from repetitive checking."
        },
        {
          "prompt": "Does scheduling two sessions automatically execute a trade at either time?",
          "options": [
            "No; supported manual orders remain separate",
            "Yes; a calendar note submits an order",
            "Yes; every review session buys the asset"
          ],
          "correctAnswer": 0,
          "explanation": "The schedule concerns attention and review. It does not create an automatic order or replace the simulator’s explicit manual buy and sell actions."
        },
        {
          "prompt": "Which session note would reveal whether the check served a learning purpose?",
          "options": [
            "Only the number of refreshes",
            "Only the current account colour",
            "New evidence, changed assumptions and any decision recorded"
          ],
          "correctAnswer": 2,
          "explanation": "A record of evidence and assumptions makes the review’s purpose assessable. Counting refreshes alone says little about whether information or reasoning improved."
        }
      ],
      "reflection": "Write a two-session review plan with a concrete question for each session.",
      "reflectionGuide": "Choose observable questions, such as quote freshness or allocation drift, and state what evidence would merit a manual action. Do not promise that checking less or more will independently improve returns.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-07",
      "title": "Two buys, one weighted entry price",
      "category": "Portfolio arithmetic",
      "scenario": "A hypothetical trader buys two units at $100, then one unit at $130. Fees are excluded so that the entry-price calculation is visible. The trader writes $115 because it is halfway between the two quotes. But there were different quantities at those prices. Your task is to recover total spend and divide by total units.\n\nMark the three units at $120 each, first without fees. Then compare a cost-inclusive branch charging 0.1% on the $330 total purchases and the $360 full sale. The two purchases had different quantities. A weighted entry is only a summary of those transactions, not a forecast. Check that your total-cost method and your per-unit method produce the same gross result before introducing the two fee charges.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "First quote",
            "value": 100
          },
          {
            "label": "Second quote",
            "value": 130
          },
          {
            "label": "Total spend",
            "value": 330
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the combined cost of the three units?",
          "options": [
            "$330",
            "$230",
            "$345"
          ],
          "correctAnswer": 0,
          "explanation": "The first purchase costs 2 × $100 = $200; the second costs $130. Their sum is $330. Adding the two quoted prices alone would omit one unit from the first purchase."
        },
        {
          "prompt": "What is the quantity-weighted entry price before fees?",
          "options": [
            "$110 per unit",
            "$115 per unit",
            "$165 per unit"
          ],
          "correctAnswer": 0,
          "explanation": "Divide the total $330 cost by three units to get $110. The cheaper quote receives twice the weight because twice as many units were bought there. A midpoint only works for equal quantities."
        },
        {
          "prompt": "Does the weighted entry guarantee the next profitable exit?",
          "options": [
            "No; it is a cost reference",
            "Yes; a lower entry ensures profit",
            "Yes; three units diversify the position"
          ],
          "correctAnswer": 0,
          "explanation": "Entry cost describes past transactions, not future market movement. A later net exit also depends on sale price and fees. Increasing units of the same asset does not create exposure to a different underlying asset."
        },
        {
          "prompt": "At $120 per unit, what is the three-unit position worth?",
          "options": [
            "$330",
            "$240",
            "$360"
          ],
          "correctAnswer": 2,
          "explanation": "Multiply total quantity of three by the current $120 quote. Current valuation uses units held, rather than averaging the original transaction quotes again."
        },
        {
          "prompt": "What is gross gain at that mark, excluding fees?",
          "options": [
            "$60",
            "$30",
            "$15"
          ],
          "correctAnswer": 1,
          "explanation": "Subtract $330 purchase notional from $360 current value. The $110 weighted entry also gives three units times a $10 per-unit gain, or $30."
        },
        {
          "prompt": "What is gross return on the $330 purchases, approximately?",
          "options": [
            "9.09%",
            "10%",
            "4.55%"
          ],
          "correctAnswer": 0,
          "explanation": "Divide $30 gross gain by $330 invested notional. Using the unweighted $115 midpoint or a $300 denominator would misstate this return."
        },
        {
          "prompt": "What are combined purchase fees in the cost-inclusive branch?",
          "options": [
            "$3.30",
            "$0.30",
            "$0.33"
          ],
          "correctAnswer": 2,
          "explanation": "Charge 0.1% to $330 total purchase notional to get $0.33. This agrees with calculating and summing the two purchase fees separately."
        },
        {
          "prompt": "What fee applies to the later $360 full sale?",
          "options": [
            "$3.60",
            "$0.36",
            "$0.33"
          ],
          "correctAnswer": 1,
          "explanation": "The sale fee uses its actual $360 notional. The larger exit base means the fee differs from the combined fees on the $330 purchases."
        },
        {
          "prompt": "What is net gain after both sets of stated fees?",
          "options": [
            "$29.31",
            "$30",
            "$29.67"
          ],
          "correctAnswer": 0,
          "explanation": "Reduce $30 gross gain by $0.33 total entry fees and $0.36 exit fee. Both sides reduce the net amount compared with the price-only result."
        },
        {
          "prompt": "Which alternative would make $115 the correct fee-free average entry?",
          "options": [
            "The current quote becoming $115",
            "A refresh after the second purchase",
            "Equal quantities bought at $100 and $130"
          ],
          "correctAnswer": 2,
          "explanation": "The midpoint is quantity-weighted only when equal quantities were bought at the two prices. A subsequent market quote cannot alter the historical entry ledger."
        }
      ],
      "reflection": "How would you adapt this ledger if each buy had a fee?",
      "reflectionGuide": "Record quantities and notional costs first, then track fees under a consistent cost method. Explain whether your displayed average excludes fees; compare net proceeds with total relevant expenses when reviewing performance.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-17",
      "title": "A network fee is a different charge",
      "category": "Costs and orders",
      "scenario": "A crypto worksheet compares a $1,000 trade with a 0.1% platform fee and a separate hypothetical $8 blockchain transfer charge. TradeHQ paper trades do not send real crypto on a blockchain. The transfer figure belongs to a different activity, so do not add it to the simulator ledger as if a virtual purchase created a real wallet transaction.\n\nCompare two separate activities: the $1,000 paper trade and an external conceptual transfer with an $8 network charge. Neither sends real funds through TradeHQ. Then test a $5,000 platform trade at the same 0.1% rate while leaving the illustrative transfer fee fixed at $8. Different fee bases can make one charge larger or smaller without making the activities equivalent.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Platform fee",
            "value": 1
          },
          {
            "label": "Hypothetical transfer",
            "value": 8
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the stated platform fee on $1,000?",
          "options": [
            "$8",
            "$10",
            "$1"
          ],
          "correctAnswer": 2,
          "explanation": "The fee is $1,000 × 0.001 = $1. This percentage charge is tied to the trade value in the case. It is distinct from a separate transfer charge described elsewhere."
        },
        {
          "prompt": "Which action is associated with the hypothetical blockchain charge?",
          "options": [
            "Every virtual buy on TradeHQ",
            "Refreshing the leaderboard",
            "A real on-chain transfer outside this simulator"
          ],
          "correctAnswer": 2,
          "explanation": "On-chain transfers are different from changing a virtual holding record. The worksheet’s $8 transfer charge must not be represented as a simulator debit or a fee for viewing a portfolio."
        },
        {
          "prompt": "What should a cost comparison state explicitly?",
          "options": [
            "That all crypto fees are identical",
            "That a fixed $8 charge always applies",
            "The activity, provider and cost assumptions"
          ],
          "correctAnswer": 2,
          "explanation": "Costs vary with the activity and provider. This example supplies an assumed transfer charge rather than a current network quote. A useful comparison labels its assumptions and avoids turning one number into a universal rule."
        },
        {
          "prompt": "What decimal multiplier corresponds to the 0.1% platform rate in this case?",
          "options": [
            "0.1",
            "0.001",
            "0.01"
          ],
          "correctAnswer": 1,
          "explanation": "Divide the stated percentage by 100. The 0.001 multiplier converts trade notional into a fee; using 0.01 would charge ten times too much."
        },
        {
          "prompt": "How much larger is the illustrative $8 network fee than the $1 trade fee?",
          "options": [
            "Eight times as large",
            "Two times as large",
            "The same amount"
          ],
          "correctAnswer": 0,
          "explanation": "Divide $8 by $1 to obtain a factor of eight. This size comparison does not imply the blockchain charge belongs to the paper trade."
        },
        {
          "prompt": "What is the fee on a separate $5,000 platform trade?",
          "options": [
            "$50",
            "$8",
            "$5"
          ],
          "correctAnswer": 2,
          "explanation": "Multiply $5,000 notional by 0.001 to obtain $5. The proportional platform rule differs from the separately specified fixed transfer charge."
        },
        {
          "prompt": "At $5,000 notional, which stated charge is larger?",
          "options": [
            "They are equal",
            "The $8 transfer charge",
            "The $5 platform fee"
          ],
          "correctAnswer": 1,
          "explanation": "Compare $8 with the calculated $5 platform charge. Their ordering changes with trade size, but the two charges still relate to different activities."
        },
        {
          "prompt": "What platform-trade notional would produce an $8 fee at 0.1%?",
          "options": [
            "$8,000",
            "$800",
            "$80"
          ],
          "correctAnswer": 0,
          "explanation": "Solve notional times 0.001 equal to $8. Dividing $8 by 0.001 yields $8,000; this mathematical equality does not make the charges interchangeable."
        },
        {
          "prompt": "Does a TradeHQ paper purchase create a blockchain transaction to inspect?",
          "options": [
            "Yes; every purchase sends crypto to a wallet",
            "Yes; a fee always implies a real transaction hash",
            "No; the paper ledger uses virtual holdings"
          ],
          "correctAnswer": 2,
          "explanation": "The simulator does not transfer real tokens over a blockchain. Virtual trades and platform charges should not be presented as on-chain wallet operations."
        },
        {
          "prompt": "Which comparison keeps the charge bases explicit?",
          "options": [
            "Both charges silently added to every paper buy",
            "Trade notional fee versus separately stated transfer fee",
            "Both charges labelled the asset’s price spread"
          ],
          "correctAnswer": 1,
          "explanation": "Naming the activity and calculation base prevents unrelated costs from entering a ledger. A blockchain transfer charge is not a paper-trading commission or quoted spread."
        }
      ],
      "reflection": "Separate a paper trade, an exchange trade and an on-chain transfer.",
      "reflectionGuide": "Identify which record changes in each activity and which fee schedule would need checking. Keep the hypothetical transfer amount outside the virtual account and avoid implying that TradeHQ holds real customer crypto.",
      "sources": [
        {
          "label": "FINRA — Crypto assets",
          "url": "https://www.finra.org/investors/investing/investment-products/crypto-assets"
        }
      ]
    },
    {
      "id": "practice-27",
      "title": "A timeout is not a new zero price",
      "category": "Price data",
      "scenario": "A refresh request times out while the account’s last valid hypothetical quote is $50. You hold ten units. The provider returned no replacement observation. A developer could accidentally turn an empty response into zero and erase the marked holding. Think through the last-known value, freshness warning and distinction between missing data and a genuine price.\n\nAt 10:00 the last valid quote is $50, and at 10:05 the refresh times out. At 10:10 a valid replacement observation reports $48. Keep ten units owned throughout. Compare the labelled last-known mark during the outage with the value after a successful update. The missing response is neither a sale nor a price observation, and recovery should clear the outage message only when a usable response arrives.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Last valid quote",
            "value": 50
          },
          {
            "label": "Last marked holding",
            "value": 500
          }
        ]
      },
      "questions": [
        {
          "prompt": "What was the last-known marked value of the ten units?",
          "options": [
            "$0",
            "$500",
            "$50"
          ],
          "correctAnswer": 1,
          "explanation": "Ten units at the last valid $50 observation were worth $500. That is a last-known mark, not confirmation of the current market value after the failed refresh."
        },
        {
          "prompt": "Does a timeout supply evidence that the asset is worth zero?",
          "options": [
            "Yes; the account has sold the asset",
            "No; it supplies no new valid observation",
            "Yes; missing values are zero"
          ],
          "correctAnswer": 1,
          "explanation": "A network failure is a data-availability event. It does not state a market price and does not execute a sale. Treating absence as zero would fabricate a price change and distort account valuation."
        },
        {
          "prompt": "What is the most honest display during this failure?",
          "options": [
            "A new timestamp on the old quote without warning",
            "Last valid mark with age and a refresh warning",
            "A fresh zero quote"
          ],
          "correctAnswer": 1,
          "explanation": "Keep the known observation identifiable and disclose that refresh failed. Updating only the displayed timestamp would hide the data’s age. Users need to see what is known and what is unavailable."
        },
        {
          "prompt": "During the timeout, what observation remains available?",
          "options": [
            "The earlier valid $50 quote",
            "A new verified zero-dollar quote",
            "An automatic ten-unit sale"
          ],
          "correctAnswer": 0,
          "explanation": "A timeout contains no replacement price. Retaining the earlier observation with its original time preserves information without treating the failure itself as market data."
        },
        {
          "prompt": "At the new valid $48 observation, what are ten units worth?",
          "options": [
            "$500",
            "$48",
            "$480"
          ],
          "correctAnswer": 2,
          "explanation": "Multiply ten unchanged units by the replacement $48 quote. The account can now update its mark based on actual supplied data rather than an empty response."
        },
        {
          "prompt": "What change separates the previous and replacement marked values?",
          "options": [
            "+$20",
            "−$20",
            "−$500"
          ],
          "correctAnswer": 1,
          "explanation": "The prior mark was $500 and the new mark is $480. The $20 decline is supported by the two valid observations, unlike any move inferred from the timeout."
        },
        {
          "prompt": "What is the quote’s percentage change from $50 to $48?",
          "options": [
            "−4%",
            "−2%",
            "−40%"
          ],
          "correctAnswer": 0,
          "explanation": "Divide the $2 price decline by the earlier $50 quote. This gives −4%; the failed request between observations supplies no additional return interval."
        },
        {
          "prompt": "Which display avoids implying a current observation during the outage?",
          "options": [
            "Zero labelled as a new live price",
            "The old quote timestamp rewritten as 10:05",
            "Last-known $50 quote with its age and an unavailable-update notice"
          ],
          "correctAnswer": 2,
          "explanation": "Preserving the original time and naming the update failure keeps stale data distinct from a current observation. The outage should not fabricate freshness."
        },
        {
          "prompt": "After a usable replacement arrives, what should happen to the old outage message?",
          "options": [
            "Clear it before any response validates",
            "Clear it and show the replacement’s observation time",
            "Keep it forever despite successful updates"
          ],
          "correctAnswer": 1,
          "explanation": "Recovery should follow validation of the new quote. Clearing a stale error then accurately reflects restored data availability, without prematurely claiming success."
        },
        {
          "prompt": "What portfolio field should not change solely because of this timeout?",
          "options": [
            "The number of units owned",
            "The warning about quote availability",
            "The displayed age of the last observation"
          ],
          "correctAnswer": 0,
          "explanation": "A data-fetch failure does not execute a trade. Quantity remains ten while data availability and the last observation’s age may change."
        }
      ],
      "reflection": "Explain what you know and what remains unknown after the timeout.",
      "reflectionGuide": "You know the previous quote, its time and the quantity held. You do not know a newer provider observation from this failed request. State that limit rather than inferring a market event.",
      "sources": [
        {
          "label": "CoinGecko — Price methodology",
          "url": "https://www.coingecko.com/en/methodology"
        }
      ]
    },
    {
      "id": "practice-37",
      "title": "A scenario is not a probability estimate",
      "category": "Risk and uncertainty",
      "scenario": "A worksheet imagines an asset worth $100 falling to $80 or rising to $120. No probability is assigned to either branch. A learner averages the two prices and calls $100 the asset’s expected future price. A pair of possibilities can organize thinking, but it is not automatically a complete probabilistic model.\n\nTo make a separate, explicitly hypothetical probability worksheet, assign 25% to the $80 outcome and 75% to the $120 outcome, assuming these two outcomes are exhaustive. Then compare equal weights as another branch. These are chosen assumptions, not estimates derived from market evidence. A weighted average can summarize such assumptions without guaranteeing that the price will equal the average.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Downside branch",
            "value": 80
          },
          {
            "label": "Upside branch",
            "value": 120
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the arithmetic midpoint of the two listed prices?",
          "options": [
            "$100",
            "$200",
            "$20"
          ],
          "correctAnswer": 0,
          "explanation": "Add $80 and $120, then divide by two, giving $100. This is an arithmetic midpoint. Its calculation does not provide evidence that the branches are equally likely."
        },
        {
          "prompt": "What assumption is missing before calling that midpoint an expected price?",
          "options": [
            "Probabilities and an adequate set of outcomes",
            "The chart’s color",
            "An extra decimal place"
          ],
          "correctAnswer": 0,
          "explanation": "An expected value weights outcomes by their probabilities. The worksheet supplies neither probabilities nor proof that these are the only outcomes. The midpoint should not be given a probabilistic interpretation without those assumptions."
        },
        {
          "prompt": "How can the two branches still be useful?",
          "options": [
            "As labelled stress cases for exposure review",
            "As a guaranteed future range",
            "As proof the position cannot lose more"
          ],
          "correctAnswer": 0,
          "explanation": "Stress cases help examine account sensitivity to selected moves. They are not a hard boundary on possible prices and do not quantify likelihood. Keep the selected inputs and their limitations visible."
        },
        {
          "prompt": "With explicitly equal 50% weights, what is the weighted average of $80 and $120?",
          "options": [
            "$80",
            "$120",
            "$100"
          ],
          "correctAnswer": 2,
          "explanation": "Multiply each outcome by one half and add $40 plus $60. The original midpoint can be an expected value only under an appropriate stated probability model."
        },
        {
          "prompt": "With 25% on $80 and 75% on $120, what is the weighted average?",
          "options": [
            "$105",
            "$110",
            "$100"
          ],
          "correctAnswer": 1,
          "explanation": "Multiply $80 by 0.25 and $120 by 0.75, giving $20 plus $90. The assumed unequal weights produce $110 rather than the midpoint."
        },
        {
          "prompt": "Where did the 25% and 75% probabilities come from in this extension?",
          "options": [
            "They were stipulated as hypothetical assumptions",
            "The two prices mathematically determine them",
            "The simulator guarantees them"
          ],
          "correctAnswer": 0,
          "explanation": "The extension supplies the weights for a conceptual calculation. The two possible prices alone did not establish their likelihoods or validate the assumptions."
        },
        {
          "prompt": "Does a calculated $110 expected value guarantee a $110 outcome?",
          "options": [
            "Yes; averages force market prices",
            "Yes; probabilities eliminate uncertainty",
            "No; the listed outcomes are still $80 and $120"
          ],
          "correctAnswer": 2,
          "explanation": "Expected value summarizes the weighted model. A realized result can differ from that average, and this two-outcome worksheet never lists a $110 realized price."
        },
        {
          "prompt": "What is the distance between the two specified scenario prices?",
          "options": [
            "$10",
            "$40",
            "$20"
          ],
          "correctAnswer": 1,
          "explanation": "Subtract $80 from $120 to obtain a $40 spread between the outcomes. This scenario range is not an empirically established maximum market range."
        },
        {
          "prompt": "What return does the $80 branch represent from the $100 starting quote?",
          "options": [
            "−20%",
            "−25%",
            "−80%"
          ],
          "correctAnswer": 0,
          "explanation": "The $20 decline divided by the original $100 quote is −20%. The branch return is separate from its stipulated 25% likelihood in the weighted worksheet."
        },
        {
          "prompt": "What would be needed before presenting these probabilities as evidence-based estimates?",
          "options": [
            "Only the arithmetic being correct",
            "Only a visually balanced scenario chart",
            "A defensible estimation method and relevant supporting data"
          ],
          "correctAnswer": 2,
          "explanation": "Correct arithmetic cannot validate invented likelihoods. Probability estimates require evidence and a method, while this extension intentionally supplies only conceptual assumptions."
        }
      ],
      "reflection": "Write what the branches tell you and what they do not.",
      "reflectionGuide": "They illustrate sensitivity to two assumed price moves. They do not supply probabilities, exclude other outcomes or justify a forecast. Explain how you would use them to examine exposure rather than predict direction.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-47",
      "title": "Separate observation from interpretation",
      "category": "Decision habits",
      "scenario": "A hypothetical asset falls from $50 to $48 while reported volume increases. A journal says “institutions are definitely selling and it will keep falling.” The price and volume are supplied observations, but the identity of sellers and future direction are not. Practice writing a note that preserves what is known without dressing a hypothesis as a fact.\n\nAssume ten units are held as the quote falls from $50 to $48. Reported volume changes from a hypothetical 1,000 units to 1,500 units over comparable windows. No trader-identity data are supplied. Separate the position’s dollar result, the volume calculation and the claim about institutions. A measurable change can be established without validating the story attached to it.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Earlier quote",
            "value": 50
          },
          {
            "label": "Later quote",
            "value": 48
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the stated price change?",
          "options": [
            "−2%",
            "+4%",
            "−4%"
          ],
          "correctAnswer": 2,
          "explanation": "The $2 fall divided by the $50 reference equals −4%. This calculation describes the price change in the supplied interval, not the identity or motive of the participants."
        },
        {
          "prompt": "Which part of the journal goes beyond the supplied evidence?",
          "options": [
            "The $50 and $48 observations",
            "The fact that the displayed prices differ",
            "Who sold and the claim of continued decline"
          ],
          "correctAnswer": 2,
          "explanation": "The case does not identify traders or provide a forecast. Increased volume indicates more reported trading activity under the measure used; it does not by itself prove institutional selling or continuation."
        },
        {
          "prompt": "What is a better journal structure?",
          "options": [
            "A single certain explanation",
            "Only a predicted target price",
            "Observation, possible explanations, and a question to test"
          ],
          "correctAnswer": 2,
          "explanation": "Separate the measured inputs from interpretations and state how a hypothesis could be checked. This keeps reasoning reviewable and makes room for alternative explanations rather than treating one story as settled."
        },
        {
          "prompt": "What is the original ten-unit position value at $50?",
          "options": [
            "$1,000",
            "$500",
            "$50"
          ],
          "correctAnswer": 1,
          "explanation": "Multiply ten units by $50 to obtain $500. The selected holding quantity is needed before translating the per-unit price move into account impact."
        },
        {
          "prompt": "What is the later ten-unit position value at $48?",
          "options": [
            "$480",
            "$48",
            "$500"
          ],
          "correctAnswer": 0,
          "explanation": "Ten units at $48 produce $480 marked value. This result follows directly from quantity and quote without any assumption about seller identity."
        },
        {
          "prompt": "What is the position’s dollar change between those two marks?",
          "options": [
            "−$2",
            "−$50",
            "−$20"
          ],
          "correctAnswer": 2,
          "explanation": "Subtract the initial $500 from the later $480. Ten units turn the $2 per-unit decline into a $20 position loss."
        },
        {
          "prompt": "What percentage increase occurs in comparable volume from 1,000 to 1,500?",
          "options": [
            "150%",
            "50%",
            "500%"
          ],
          "correctAnswer": 1,
          "explanation": "Divide the 500-unit increase by the original 1,000 units. The 50% increase is a volume statistic, not an estimate of institutional participation."
        },
        {
          "prompt": "Does the stated volume reveal exactly who sold the asset?",
          "options": [
            "No; no trader identities were supplied",
            "Yes; all increased volume is institutional selling",
            "Yes; the last seller controls the next price"
          ],
          "correctAnswer": 0,
          "explanation": "Aggregate volume lacks the specific identity evidence required by the journal claim. Increased turnover alone does not identify particular classes of traders."
        },
        {
          "prompt": "Which revised journal sentence keeps the observations and hypothesis distinct?",
          "options": [
            "Institutions definitely sold and the next decline is certain",
            "Volume guarantees a price reversal tomorrow",
            "Price fell 4% and volume rose 50%; seller identity is unknown"
          ],
          "correctAnswer": 2,
          "explanation": "The revised note preserves the measured changes while exposing what is unverified. It avoids assigning a definite identity or forecasting the next move from limited inputs."
        },
        {
          "prompt": "What evidence would directly address the institutional-seller claim?",
          "options": [
            "Only higher refresh frequency",
            "Relevant attributable participant data with clear limits",
            "Only another chart of the same price decline"
          ],
          "correctAnswer": 1,
          "explanation": "Evidence about participants must actually bear on their identities or activity. Replotting the supplied price and volume does not add the missing attribution."
        }
      ],
      "reflection": "Rewrite the original journal note in three short parts.",
      "reflectionGuide": "Keep the −4% change and reported volume increase as observations. Label any participant explanation speculative, and identify missing evidence rather than promising the next direction.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-08",
      "title": "A small position loses half its value",
      "category": "Portfolio arithmetic",
      "scenario": "The account starts with $95,000 cash and $5,000 in one hypothetical asset. The asset loses 50% while cash stays flat. A dramatic percentage in the asset headline can make the account loss feel equally dramatic. Use the actual exposure before describing the result, and remember that a smaller account loss is still a real simulated loss.\n\nAt the reduced $97,500 account, test a further 20% decline in the remaining asset and a separate 100% rise. Cash stays $95,000 in both branches. These unequal selected moves are sensitivity examples, not likelihood estimates. Compare the original and reduced allocations before interpreting the next headline. Position size changes how strongly an asset affects the account, but this arithmetic does not prove that any allocation is appropriate for a particular person.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Cash",
            "value": 95000
          },
          {
            "label": "Position start",
            "value": 5000
          },
          {
            "label": "Position end",
            "value": 2500
          }
        ]
      },
      "questions": [
        {
          "prompt": "What dollar loss occurs in the position?",
          "options": [
            "$50,000",
            "$500",
            "$2,500"
          ],
          "correctAnswer": 2,
          "explanation": "Half of the $5,000 holding is $2,500. The remaining holding is also worth $2,500. The 50% decline applies to that position, not to the $95,000 cash balance."
        },
        {
          "prompt": "What is the resulting account return?",
          "options": [
            "−50%",
            "−5%",
            "−2.5%"
          ],
          "correctAnswer": 2,
          "explanation": "The account becomes $95,000 + $2,500 = $97,500. The $2,500 loss divided by the initial $100,000 equals 2.5%. Keep asset return and account return explicitly labelled."
        },
        {
          "prompt": "What lesson does this example support?",
          "options": [
            "Small positions cannot lose money",
            "Holding cash predicts a market rebound",
            "Position size affects the account impact"
          ],
          "correctAnswer": 2,
          "explanation": "Size controls how much a particular asset move contributes to this account. It does not eliminate that asset’s risk or establish the best allocation. This single assumed outcome cannot prove a generally superior strategy."
        },
        {
          "prompt": "What remains invested after the initial 50% asset loss?",
          "options": [
            "$50,000",
            "$2,500",
            "$5,000"
          ],
          "correctAnswer": 1,
          "explanation": "The original $5,000 asset holding loses half its value, leaving $2,500. The 50% decline does not apply to the unchanged cash balance."
        },
        {
          "prompt": "What is total equity after the original decline?",
          "options": [
            "$97,500",
            "$95,000",
            "$50,000"
          ],
          "correctAnswer": 0,
          "explanation": "Add $95,000 cash to $2,500 remaining asset value. The account’s $2,500 loss depends on the stated exposure and is not a general protection guarantee."
        },
        {
          "prompt": "What is the asset’s new allocation, approximately?",
          "options": [
            "5%",
            "50%",
            "2.56%"
          ],
          "correctAnswer": 2,
          "explanation": "Divide remaining $2,500 value by current $97,500 total. Recompute the allocation denominator after the move rather than keeping the original account value."
        },
        {
          "prompt": "In the further 20% decline branch, what additional loss occurs?",
          "options": [
            "$20,000",
            "$500",
            "$1,000"
          ],
          "correctAnswer": 1,
          "explanation": "The next 20% move applies to current $2,500 exposure, creating a $500 loss. Applying it to the original $5,000 would overstate this interval’s loss."
        },
        {
          "prompt": "In the separate 100% gain branch, what is the asset worth?",
          "options": [
            "$5,000",
            "$7,500",
            "$100,000"
          ],
          "correctAnswer": 0,
          "explanation": "A 100% gain doubles $2,500 to $5,000. It restores the holding’s original value in this branch, without doubling the entire largely-cash account."
        },
        {
          "prompt": "What percentage rise from $2,500 restores the original $5,000 holding?",
          "options": [
            "50%",
            "25%",
            "100%"
          ],
          "correctAnswer": 2,
          "explanation": "The required $2,500 increase equals the reduced holding’s entire value. A 50% loss therefore requires a 100% rise for recovery when costs are excluded."
        },
        {
          "prompt": "Does this example establish that small allocations cannot cause serious losses?",
          "options": [
            "Yes; cash guarantees all holdings recover",
            "No; it quantifies only the supplied exposure and moves",
            "Yes; every small position is risk-free"
          ],
          "correctAnswer": 1,
          "explanation": "Position size affects sensitivity, but the example does not establish guaranteed recovery or an acceptable personal risk level. Other holdings and constraints also matter."
        }
      ],
      "reflection": "How could you report this result without either minimizing or exaggerating it?",
      "reflectionGuide": "Give both figures: a 50% asset decline and a 2.5% account decline, with a $2,500 loss. Include the initial exposure and avoid treating one hypothetical outcome as proof of skill.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-18",
      "title": "Turnover adds up across many small trades",
      "category": "Costs and orders",
      "scenario": "You make 20 hypothetical transactions, each with $500 notional and a 0.1% transaction fee. For this worksheet their combined gross price gains are $8 and no other costs occur. Treat a transaction as one buy or one sell, so a round trip counts twice. Evaluate total turnover and fees before calling the activity profitable.\n\nContinue the worksheet with two alternatives. In one branch, gross gains remain $8 while transaction count doubles to 40 at $500 each. In another, transaction count remains 20 but gross gains rise to $12. Keep the 0.1% fee and exclude other costs. Compare turnover, average fee per transaction and net outcome before interpreting the number of trades as evidence of skill.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Per transaction",
            "value": 500
          },
          {
            "label": "Total gross gain",
            "value": 8
          },
          {
            "label": "Total fees",
            "value": 10
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the total traded notional across these transactions?",
          "options": [
            "$5,000",
            "$10,000",
            "$500"
          ],
          "correctAnswer": 1,
          "explanation": "Twenty transactions times $500 each give $10,000 turnover. This sum measures activity, not necessarily the largest simultaneous holding. Buys and sells each contribute to traded notional."
        },
        {
          "prompt": "What is the total fee for all 20 transactions?",
          "options": [
            "$20",
            "$10",
            "$1"
          ],
          "correctAnswer": 1,
          "explanation": "Each $500 transaction costs $0.50 at 0.1%. Multiplying by 20 gives $10. A small per-transaction charge can exceed a small gross gain when repeated enough times."
        },
        {
          "prompt": "What is the net result after these fees?",
          "options": [
            "A $10 gain",
            "A $2 loss",
            "An $8 gain"
          ],
          "correctAnswer": 1,
          "explanation": "The $8 gross gain minus $10 fees is −$2. Activity count and gross wins do not establish net profitability. The result follows the specified costs only; excluded real execution costs would need separate treatment."
        },
        {
          "prompt": "What fee is charged on each $500 transaction?",
          "options": [
            "$0.50",
            "$5",
            "$0.05"
          ],
          "correctAnswer": 0,
          "explanation": "Multiply $500 by 0.001 to obtain $0.50 per transaction. The 20-transaction total comes from adding this charge across buys and sells alike."
        },
        {
          "prompt": "If transactions were paired evenly, how many round trips could 20 transactions form?",
          "options": [
            "20 round trips",
            "40 round trips",
            "10 round trips"
          ],
          "correctAnswer": 2,
          "explanation": "A round trip contains one purchase and one sale. Twenty transactions can form ten such pairs when the activity is paired evenly as assumed here."
        },
        {
          "prompt": "What average gross gain per transaction corresponds to the initial $8 total?",
          "options": [
            "$0.80",
            "$0.40",
            "$8"
          ],
          "correctAnswer": 1,
          "explanation": "Divide $8 combined gross gain by 20 transactions. The $0.40 average is below the $0.50 fee per transaction in the selected worksheet."
        },
        {
          "prompt": "With 40 transactions, what is total fee at $500 each?",
          "options": [
            "$20",
            "$10",
            "$40"
          ],
          "correctAnswer": 0,
          "explanation": "Forty transactions times $0.50 fee gives $20. Equivalently, $20,000 turnover times 0.001 yields the same charge."
        },
        {
          "prompt": "If gross gains stay $8 in that 40-transaction branch, what is net result?",
          "options": [
            "−$2",
            "+$8",
            "−$12"
          ],
          "correctAnswer": 2,
          "explanation": "Subtract $20 charges from $8 gross gains. Increasing activity without increasing the stated gross result worsens this branch’s net outcome."
        },
        {
          "prompt": "With 20 transactions and $12 gross gains instead, what is net result?",
          "options": [
            "−$2",
            "+$2",
            "+$12"
          ],
          "correctAnswer": 1,
          "explanation": "The original 20-transaction fee remains $10. Subtract it from the alternative $12 gross gain to obtain a $2 positive net result before other excluded costs."
        },
        {
          "prompt": "Which activity summary would permit a fairer comparison than trade count alone?",
          "options": [
            "Net outcome with turnover, costs and exposure",
            "Only the larger transaction count",
            "Only the count of asset symbols"
          ],
          "correctAnswer": 0,
          "explanation": "Transaction count does not show costs or dollar returns. Recording turnover, exposure and net results supports a more meaningful comparison of the actual account activity."
        }
      ],
      "reflection": "What would a “most active” badge fail to tell you here?",
      "reflectionGuide": "Explain that activity is a count, while net performance includes gains and expenses. Show the $8 minus $10 result and avoid treating a frequent-trading statistic as a skill rating.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-28",
      "title": "Offline valuation is not an offline trade",
      "category": "Price data",
      "scenario": "A user closes the browser holding two hypothetical units. A server refresh later changes the shared quote from $100 to $110. No order was submitted. Assume the server uses the newer quote to mark eligible cloud holdings. The account can show a different valuation when the user returns, while its units and trade history stay unchanged.\n\nContinue with two units held and the $110 server mark. A later refresh reports $90, still without any user order. Assume $800 unchanged cash and an original two-unit purchase at $100 per unit, excluding fees for this worksheet. Reconstruct total value at all three quotes. Valuation updates change profit and loss without changing quantity, cash or the recorded number of completed trades.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Earlier position",
            "value": 200
          },
          {
            "label": "Later position",
            "value": 220
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the later marked value of two units at $110?",
          "options": [
            "$220",
            "$200",
            "$110"
          ],
          "correctAnswer": 0,
          "explanation": "Two units times $110 equal $220. The $20 change arises from a different valuation input, not from acquiring another unit. Quantity and quote should be tracked as separate fields."
        },
        {
          "prompt": "Does that mark change prove an order executed while the user was offline?",
          "options": [
            "No; no order was submitted",
            "Yes; every refresh buys an asset",
            "Yes; valuation and trading are identical"
          ],
          "correctAnswer": 0,
          "explanation": "A price refresh can revalue an existing holding without changing ownership quantity. An order is a separate event with its own transaction record. Server-side valuation must not be described as automatic trading."
        },
        {
          "prompt": "What would you check when returning to the portfolio?",
          "options": [
            "Units, source, observation time and recorded trades",
            "Only whether the number increased",
            "Only the leaderboard position"
          ],
          "correctAnswer": 0,
          "explanation": "The holding quantity and trade record verify activity; the quote source and timestamp explain valuation. An increase alone cannot tell you whether it came from a new trade, a price change or an input error."
        },
        {
          "prompt": "What was the two-unit holding worth at the initial $100 mark?",
          "options": [
            "$100",
            "$800",
            "$200"
          ],
          "correctAnswer": 2,
          "explanation": "Two units times $100 gives $200. With $800 cash, the initial worksheet equity is $1,000 before any later provider-price changes."
        },
        {
          "prompt": "What is total equity at the later $110 mark?",
          "options": [
            "$220",
            "$1,020",
            "$1,100"
          ],
          "correctAnswer": 1,
          "explanation": "Add $800 unchanged cash to two units worth $220. Only the invested portion benefits from the quote increase; cash does not inherit the asset’s return."
        },
        {
          "prompt": "At the subsequent $90 quote, what is the holding worth?",
          "options": [
            "$180",
            "$200",
            "$90"
          ],
          "correctAnswer": 0,
          "explanation": "Two unchanged units times $90 gives $180. The falling mark affects valuation but does not reduce the number of units recorded in the account."
        },
        {
          "prompt": "What is total equity at that $90 observation?",
          "options": [
            "$900",
            "$1,000",
            "$980"
          ],
          "correctAnswer": 2,
          "explanation": "Add $800 cash and $180 marked holdings to obtain $980. This is $20 below the original $1,000 equity under the no-fee assumptions."
        },
        {
          "prompt": "What is full-period account return from the initial $1,000 to $980?",
          "options": [
            "−20%",
            "−2%",
            "−10%"
          ],
          "correctAnswer": 1,
          "explanation": "Divide the $20 account loss by the $1,000 start. The asset declined 10% from $100 to $90, but its initial account weight was only 20%."
        },
        {
          "prompt": "How many new completed trades do these two server refreshes imply?",
          "options": [
            "Zero",
            "Two",
            "One"
          ],
          "correctAnswer": 0,
          "explanation": "A price refresh revalues existing holdings. Without a submitted order, it must not create trade records or imply buys and sells while the user is offline."
        },
        {
          "prompt": "Which return-to-account check distinguishes valuation from execution?",
          "options": [
            "Look only at the larger account total",
            "Assume every value change is a new trade",
            "Compare units, cash, trade history and quote observation times"
          ],
          "correctAnswer": 2,
          "explanation": "Stable units and cash with unchanged trade history can explain a pure mark update. Observation timestamps identify the pricing input responsible for the valuation change."
        }
      ],
      "reflection": "Describe the feature without promising constant tick-by-tick updates.",
      "reflectionGuide": "Explain that eligible cloud holdings use shared periodically refreshed quotes, even when the browser is closed. State the observation time and preserve fallback or stale labels; avoid implying automated order execution.",
      "sources": [
        {
          "label": "CoinGecko — Price methodology",
          "url": "https://www.coingecko.com/en/methodology"
        }
      ]
    },
    {
      "id": "practice-38",
      "title": "A pair trade can still lose together",
      "category": "Risk and uncertainty",
      "scenario": "A conceptual worksheet buys $1,000 of asset A and shorts $1,000 of asset B outside TradeHQ’s supported spot orders. A falls 10% while B rises 10%. Ignore borrowing costs and fees. The equal notionals do not guarantee the positions offset: the relative move in this case hurts both legs.\n\nKeep the short leg conceptual and outside TradeHQ. For the long, $1,000 at $100 per unit means ten units. For the short, assume ten borrowed units sold at $100 and later repurchased at $110. Exclude borrowing charges, fees and margin requirements only for the worksheet. Compare the losing branch with a separate branch where both asset prices rise 10%; equal initial notionals do not fix all possible outcomes.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "A long notional",
            "value": 1000
          },
          {
            "label": "B short notional",
            "value": 1000
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the assumed long-leg result when A falls 10%?",
          "options": [
            "+$100",
            "$0",
            "−$100"
          ],
          "correctAnswer": 2,
          "explanation": "The $1,000 long loses 10%, or $100. A conceptual long gains when its marked asset rises and loses when it falls under these simple fixed-notional assumptions."
        },
        {
          "prompt": "What is the assumed short-leg result when B rises 10%?",
          "options": [
            "+$100",
            "$0",
            "−$100"
          ],
          "correctAnswer": 2,
          "explanation": "The simplified short loses $100 when the borrowed asset rises 10%. Combining that with the long loss gives −$200 before excluded costs. Equal initial notional is not equal-and-opposite realized profit."
        },
        {
          "prompt": "How should “market-neutral” be interpreted in education?",
          "options": [
            "A guarantee of profit in every market",
            "A supported short order on TradeHQ",
            "An exposure aim with residual risks, not guaranteed profits"
          ],
          "correctAnswer": 2,
          "explanation": "Strategies may aim to reduce broad-market exposure, yet relative-price moves, hedge mismatch, costs and liquidity can create losses. TradeHQ does not execute the short leg; this remains a conceptual worksheet."
        },
        {
          "prompt": "How many A units does a $1,000 long purchase at $100 buy?",
          "options": [
            "One hundred units",
            "Ten units",
            "One unit"
          ],
          "correctAnswer": 1,
          "explanation": "Divide $1,000 notional by $100 per unit to get ten units. The holding quantity is needed to translate later quotes into dollar profit or loss."
        },
        {
          "prompt": "After A falls to $90, what is the long holding’s value?",
          "options": [
            "$900",
            "$1,100",
            "$100"
          ],
          "correctAnswer": 0,
          "explanation": "Ten units multiplied by the later $90 quote gives $900. Compared with $1,000 entry notional, this creates the stated $100 long-leg loss."
        },
        {
          "prompt": "What does repurchasing the ten conceptual B short units at $110 cost?",
          "options": [
            "$1,000",
            "$900",
            "$1,100"
          ],
          "correctAnswer": 2,
          "explanation": "Ten borrowed units repurchased at $110 require $1,100. Comparing this with the $1,000 original short-sale proceeds yields a $100 loss before excluded costs."
        },
        {
          "prompt": "What is combined gross result when A falls 10% and B rises 10%?",
          "options": [
            "+$200",
            "−$200",
            "$0"
          ],
          "correctAnswer": 1,
          "explanation": "The long loses $100 and the conceptual short also loses $100. Add both legs to obtain a $200 loss despite equal initial dollar notionals."
        },
        {
          "prompt": "In the separate both-rise-10% branch, what is the fee-free combined gross result?",
          "options": [
            "$0",
            "+$200",
            "−$200"
          ],
          "correctAnswer": 0,
          "explanation": "The $100 long gain offsets the $100 short loss in this particular branch. This arithmetic is conditional on matching moves and the excluded costs."
        },
        {
          "prompt": "Which omitted cost could make that zero-gross branch negative in an actual short product?",
          "options": [
            "Only the chart’s colour choice",
            "The worksheet being printed twice",
            "Borrowing charges and transaction costs"
          ],
          "correctAnswer": 2,
          "explanation": "Real short products may charge costs absent from this conceptual example. Excluding them for arithmetic cannot justify a claim about actual net execution results."
        },
        {
          "prompt": "Can this paired long-and-short position be opened using TradeHQ’s spot sell button?",
          "options": [
            "Yes; a Daily answer opens both positions",
            "No; the short leg needs unsupported borrowed exposure",
            "Yes; equal notionals unlock short selling"
          ],
          "correctAnswer": 1,
          "explanation": "The simulator sells owned spot units and does not borrow assets to create shorts. The paired trade is an educational external-product worksheet."
        }
      ],
      "reflection": "Why is “profits regardless of direction” misleading for this pair?",
      "reflectionGuide": "Use the two $100 losses to show that the relative relationship can move adversely. Label the borrowed short conceptual and note excluded costs; reducing one type of exposure does not remove every risk.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-48",
      "title": "Precommit a fair comparison window",
      "category": "Decision habits",
      "scenario": "A hypothetical learner tests two practice methods over ten recorded sessions. Method A leads after session four; method B leads after session ten. The learner chooses whichever ending date makes their favorite method look best. Changing the window after seeing results can produce a flattering summary without a fair comparison.\n\nUse hypothetical cumulative results: after session four, A is +$80 and B +$40; after session ten, A is +$20 and B +$60. Starting capital and exposure rules were intended to be comparable, but costs are not yet supplied. Decide what each fixed window supports and what changes when the endpoint is chosen after observing the winner. Keep both records rather than discarding the less flattering one.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "session number",
        "bars": [
          {
            "label": "Early window end",
            "value": 4
          },
          {
            "label": "Planned window end",
            "value": 10
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the main problem with choosing the end date afterward?",
          "options": [
            "It guarantees a reliable comparison",
            "It selects a favorable result after seeing outcomes",
            "It creates more independent observations"
          ],
          "correctAnswer": 1,
          "explanation": "Post-hoc window selection can cherry-pick a period that favors the preferred method. State the intended comparison window beforehand and disclose any later changes rather than hiding inconvenient intervals."
        },
        {
          "prompt": "What should be held consistent in the comparison?",
          "options": [
            "Only the best individual session",
            "Window, starting conditions and included costs",
            "Only the method names"
          ],
          "correctAnswer": 1,
          "explanation": "Comparable starting balances, timing and costs reduce avoidable differences between methods. The record should include the full chosen window, not just each method’s best moment."
        },
        {
          "prompt": "Does a fair ten-session window settle future superiority?",
          "options": [
            "Yes; the higher final balance is a certification",
            "No; it still has limited sample and conditions",
            "Yes; ten sessions prove every future result"
          ],
          "correctAnswer": 1,
          "explanation": "A fair comparison improves evidence quality but does not eliminate uncertainty or regime dependence. Report the sample, path and limitations rather than declaring a permanent winner from a short simulated test."
        },
        {
          "prompt": "At session four, how far ahead is method A in cumulative dollars?",
          "options": [
            "$40",
            "$80",
            "$20"
          ],
          "correctAnswer": 0,
          "explanation": "Subtract B’s $40 from A’s $80 to obtain A’s $40 lead at this specified endpoint. The lead does not establish the ranking at every other window."
        },
        {
          "prompt": "At session ten, how far ahead is method B in cumulative dollars?",
          "options": [
            "$60",
            "$20",
            "$40"
          ],
          "correctAnswer": 2,
          "explanation": "Subtract A’s $20 from B’s $60. The final ten-session record has a $40 B lead, reversing the earlier ordering without making either record false."
        },
        {
          "prompt": "What change occurs in A’s cumulative result between sessions four and ten?",
          "options": [
            "−$80",
            "−$60",
            "+$20"
          ],
          "correctAnswer": 1,
          "explanation": "A’s cumulative result falls from +$80 to +$20, a $60 decrease. This interval result is distinct from its still-positive full ten-session cumulative total."
        },
        {
          "prompt": "What change occurs in B’s cumulative result over that same interval?",
          "options": [
            "+$20",
            "+$60",
            "−$40"
          ],
          "correctAnswer": 0,
          "explanation": "B rises from +$40 to +$60, adding $20 between the two endpoints. Compare the same interval when assessing how the ranking changed."
        },
        {
          "prompt": "Can these gross totals establish which method has the better net result?",
          "options": [
            "Yes; costs can never affect rankings",
            "Yes; the method with more sessions always wins",
            "Not without comparable cost records"
          ],
          "correctAnswer": 2,
          "explanation": "Different costs can alter or reverse a gross-result comparison. The case has not supplied the charges needed to reconstruct net performance."
        },
        {
          "prompt": "Which endpoint rule reduces this particular hindsight-selection problem?",
          "options": [
            "Hide whichever endpoint reverses the ranking",
            "Choose and record the window before viewing results",
            "End whenever the favourite method leads"
          ],
          "correctAnswer": 1,
          "explanation": "A predetermined comparison window prevents selecting the most flattering endpoint after observing the result. It does not eliminate all other statistical or execution limits."
        },
        {
          "prompt": "What conclusion fits the two supplied endpoints?",
          "options": [
            "The ranking depends on the stated observation window",
            "A is always superior",
            "B is proven superior forever"
          ],
          "correctAnswer": 0,
          "explanation": "A leads at the earlier endpoint and B at the later one. The case shows window sensitivity, not a complete demonstration of future superiority."
        }
      ],
      "reflection": "Create a short comparison protocol before viewing results.",
      "reflectionGuide": "Specify the same observation window, starting account assumptions, fee treatment and decision rules for both methods. Commit to retaining all sessions and explaining changes to the protocol.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-09",
      "title": "Comparing returns after adding money",
      "category": "Portfolio arithmetic",
      "scenario": "Account A starts at $1,000 and ends at $1,200 with no cash flows. Account B starts at $1,000, receives a $500 deposit just before the end, and finishes at $1,600. These are worksheet accounts outside TradeHQ’s fixed starting-balance simulator. Final balance alone cannot tell you which account’s investments performed better.\n\nAssume B’s $500 deposit arrived immediately before final valuation and had no time to earn a return. Compare ending wealth with gain after removing that flow. Then consider why the same shortcut is insufficient if a deposit arrives halfway through the period. Cash contributed by an owner is different from value generated by performance. This remains a conceptual worksheet outside TradeHQ’s fixed starting-balance mechanics.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "A final",
            "value": 1200
          },
          {
            "label": "B final",
            "value": 1600
          },
          {
            "label": "B deposit",
            "value": 500
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is account A’s return with no cash flows?",
          "options": [
            "10%",
            "20%",
            "200%"
          ],
          "correctAnswer": 1,
          "explanation": "Account A gained $200 on a $1,000 starting balance: $200 ÷ $1,000 = 20%. With no deposits or withdrawals, the ordinary starting-to-ending balance calculation is sufficient for this example."
        },
        {
          "prompt": "How much of B’s $600 balance increase is the stated deposit?",
          "options": [
            "$100",
            "$500",
            "$600"
          ],
          "correctAnswer": 1,
          "explanation": "Account B’s increase combines a $500 contribution and a $100 investment gain. The larger final account is not automatically the better-performing investment. Separate outside cash flows before comparing results."
        },
        {
          "prompt": "Why did the scenario specify that the deposit arrived just before the end?",
          "options": [
            "Timing removes the need to record deposits",
            "Cash-flow timing can affect return measurement",
            "Deposits create trading profits"
          ],
          "correctAnswer": 1,
          "explanation": "Money invested for different lengths of time complicates performance measurement. This simplified end-of-period deposit makes the original capital’s $100 gain clear; more complex flows need a consistent time- or money-weighted method."
        },
        {
          "prompt": "What investment gain remains after removing B’s deposit?",
          "options": [
            "$100",
            "$600",
            "$500"
          ],
          "correctAnswer": 0,
          "explanation": "From $1,600 final value, subtract $1,000 original capital and $500 deposited cash. The remaining $100 is investment gain under the stated timing assumption."
        },
        {
          "prompt": "Under that last-moment deposit assumption, what return did B earn on original capital?",
          "options": [
            "60%",
            "40%",
            "10%"
          ],
          "correctAnswer": 2,
          "explanation": "The $100 investment gain arose on the original $1,000 in this simplified case. Dividing those amounts gives 10%, without counting the deposit as earnings."
        },
        {
          "prompt": "Which account has higher investment return under these assumptions?",
          "options": [
            "They are equal because they started equally",
            "A at 20%, versus B at 10%",
            "B because its ending balance is larger"
          ],
          "correctAnswer": 1,
          "explanation": "A gains $200 without cash flows while B gains $100 after removing its late deposit. Investment return and ending wealth answer different comparison questions."
        },
        {
          "prompt": "How much larger is B’s final wealth than A’s?",
          "options": [
            "$400",
            "$500",
            "$600"
          ],
          "correctAnswer": 0,
          "explanation": "Subtract A’s $1,200 from B’s $1,600. The $400 wealth difference cannot establish better investment performance because the owners contributed different cash."
        },
        {
          "prompt": "What additional records would help if B deposited money mid-period?",
          "options": [
            "Only the final balance",
            "A claim that all deposits earned the same return",
            "Dated flows and valuations suitable for the chosen return method"
          ],
          "correctAnswer": 2,
          "explanation": "Capital invested for different lengths of time requires a method that handles cash-flow timing. A single end-balance subtraction does not recover the entire investment path."
        },
        {
          "prompt": "Does this exercise add deposits to TradeHQ’s standard starting balance?",
          "options": [
            "Yes; reading the case adds virtual cash",
            "No; it is a conceptual cash-flow worksheet",
            "Yes; completing Daily credits $500"
          ],
          "correctAnswer": 1,
          "explanation": "The scenario explicitly sits outside the simulator’s fixed starting-balance mechanics. Its illustrative deposits do not create orders or additional virtual funds."
        },
        {
          "prompt": "Which report would communicate B’s result most clearly?",
          "options": [
            "Starting capital, added cash, ending value and return method",
            "The full $600 increase labelled investment profit",
            "The deposit hidden from readers"
          ],
          "correctAnswer": 0,
          "explanation": "Separating contributed cash from investment gain prevents ending wealth from being mistaken for performance. State timing assumptions and the return method alongside the balance bridge."
        }
      ],
      "reflection": "What extra ledger fields would make a real cash-flow comparison defensible?",
      "reflectionGuide": "Record the date and amount of every deposit or withdrawal as well as valuations. Explain the chosen return method. TradeHQ’s fixed practice balance should not be described as supporting these worksheet deposits.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-19",
      "title": "A short thesis does not create a short position",
      "category": "Costs and orders",
      "scenario": "A hypothetical asset is quoted at $100 and your research expects it could fall. You hold zero units. TradeHQ’s supported sell operation disposes of owned spot units; it does not borrow assets or open short positions. Use this case to distinguish a directional idea, a manual sale of a holding and a different product’s leveraged or borrowed exposure.\n\nFor a separate spot-account branch, suppose you own three units bought earlier and the quote is still $100. You choose to sell two owned units with the 0.1% fee. Calculate cash received and units remaining. Then let the quote fall to $90 without another order. The unowned-units branch and the owned-sale branch have different valid actions; a bearish thesis alone creates neither borrowed exposure nor an executed sale.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "units",
        "bars": [
          {
            "label": "Owned units",
            "value": 0
          },
          {
            "label": "Proposed sell units",
            "value": 2
          }
        ]
      },
      "questions": [
        {
          "prompt": "Can selling two unowned units open a short on TradeHQ?",
          "options": [
            "No; the simulator does not implement short selling",
            "Yes; every sell button borrows units",
            "Yes; a bearish note supplies collateral"
          ],
          "correctAnswer": 0,
          "explanation": "A bearish idea does not alter the product’s supported mechanics. Selling an owned spot holding and borrowing an asset to sell short are different operations; TradeHQ only implements the former."
        },
        {
          "prompt": "What supported action could reduce existing spot exposure?",
          "options": [
            "Manually sell some units already owned",
            "Create a negative holding by journaling",
            "Request borrowed assets from the leaderboard"
          ],
          "correctAnswer": 0,
          "explanation": "Selling owned units reduces the quantity held and returns net proceeds to virtual cash. It does not create a profit from a future fall after the position is closed, nor does it establish a borrowed liability."
        },
        {
          "prompt": "How should an educational short-sale example be labelled?",
          "options": [
            "A conceptual worksheet outside supported simulator orders",
            "A live TradeHQ execution guide",
            "A guaranteed way to profit from a decline"
          ],
          "correctAnswer": 0,
          "explanation": "A lesson can explain short mechanics while clearly separating them from the available simulator. Borrowing costs, losses and execution constraints would also matter in a real short; a direction prediction alone is incomplete."
        },
        {
          "prompt": "In the owned-units branch, what is gross notional for selling two units at $100?",
          "options": [
            "$300",
            "$100",
            "$200"
          ],
          "correctAnswer": 2,
          "explanation": "Two owned units multiplied by the $100 quote gives $200 sale notional. The third unit remains held unless a separate valid sell order includes it."
        },
        {
          "prompt": "What fee applies to that $200 spot sale?",
          "options": [
            "$20",
            "$0.20",
            "$2"
          ],
          "correctAnswer": 1,
          "explanation": "Multiply $200 by 0.001 to obtain $0.20. The fee is charged on sale notional rather than on the number of units or an assumed future decline."
        },
        {
          "prompt": "What net sale cash is received in the owned-units branch?",
          "options": [
            "$199.80",
            "$200",
            "$198"
          ],
          "correctAnswer": 0,
          "explanation": "Subtract the $0.20 transaction fee from $200 gross sale value. Net proceeds enter cash and are separate from the mark of any units remaining."
        },
        {
          "prompt": "How many spot units remain after selling two of three owned units?",
          "options": [
            "Negative two units",
            "Three units",
            "One unit"
          ],
          "correctAnswer": 2,
          "explanation": "Subtract the two sold units from the three previously owned. The result is one positive spot holding, not a borrowed short position."
        },
        {
          "prompt": "At a subsequent $90 quote, what is the remaining one-unit holding worth?",
          "options": [
            "$270",
            "$90",
            "$100"
          ],
          "correctAnswer": 1,
          "explanation": "One remaining unit times $90 gives $90 marked value. The completed two-unit sale’s cash receipt is not rewritten by this later quote."
        },
        {
          "prompt": "What is the remaining holding’s change from its $100 pre-move mark?",
          "options": [
            "−$10",
            "+$20",
            "−$30"
          ],
          "correctAnswer": 0,
          "explanation": "Only one unit remains exposed to the $10 quote decline. Reducing spot exposure avoids some further loss but does not create a separate gain from unowned short units."
        },
        {
          "prompt": "Which feature would be required to profit directly from a new borrowed short position?",
          "options": [
            "A bearish Daily answer",
            "A sell attempt with zero owned units",
            "A product supporting borrowing and short exposure"
          ],
          "correctAnswer": 2,
          "explanation": "Opening borrowed short exposure needs mechanics the simulator does not provide. A directional idea or invalid sale attempt cannot create that financial product."
        }
      ],
      "reflection": "Rewrite a bearish practice plan using only supported actions.",
      "reflectionGuide": "Describe observation, a hypothetical worksheet or reducing an owned position with a manual sale. Do not promise a negative position, leverage or automated order execution that the simulator does not support.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-29",
      "title": "Comparing prices from different minutes",
      "category": "Price data",
      "scenario": "A provider observes $100 at 12:00 and another observes $103 at 12:04. A learner sees both at 12:05 and calls the first provider inaccurate. No same-minute pair is supplied. The gap could involve time, method or venue. Keep those possibilities separate from a demonstrated error before choosing which mark to trust.\n\nAt 12:05, label the first observation’s age and the second’s age separately. For a further matched-time comparison, suppose both providers publish new observations at 12:10, one at $104 and one at $104.20. Their methods and venues are still unspecified. A smaller time gap narrows one explanation, but even synchronized observations need identity and method checks before a difference is diagnosed as an error.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "12:00 observation",
            "value": 100
          },
          {
            "label": "12:04 observation",
            "value": 103
          }
        ]
      },
      "questions": [
        {
          "prompt": "How far apart are the two observation times?",
          "options": [
            "One minute",
            "Five minutes",
            "Four minutes"
          ],
          "correctAnswer": 2,
          "explanation": "The relevant gap is between 12:00 and 12:04, which is four minutes. Both numbers being visible at 12:05 does not make their underlying market observations simultaneous."
        },
        {
          "prompt": "What does the $3 difference prove on its own?",
          "options": [
            "That the earlier provider is fraudulent",
            "That the asset will keep rising",
            "Only that the supplied observations differ"
          ],
          "correctAnswer": 2,
          "explanation": "A mismatch is a starting point for checking, not a conclusion about accuracy or future direction. Without matched times and methods, the difference can have several explanations supported by the case."
        },
        {
          "prompt": "What would make the next comparison more informative?",
          "options": [
            "Comparing whichever two numbers are convenient",
            "Discarding every lower price",
            "Same asset, currency and time window with source details"
          ],
          "correctAnswer": 2,
          "explanation": "A controlled comparison reduces avoidable mismatches before investigating remaining differences. Matching definitions and documenting timestamps make a discrepancy easier to explain than choosing a quote based on its direction."
        },
        {
          "prompt": "At 12:05, how old is the 12:00 observation?",
          "options": [
            "One minute",
            "Five minutes",
            "Four minutes"
          ],
          "correctAnswer": 1,
          "explanation": "Subtract the first observation time from the common viewing time. Its five-minute age should not be replaced by the age of the page fetch."
        },
        {
          "prompt": "At 12:05, how old is the 12:04 observation?",
          "options": [
            "One minute",
            "Five minutes",
            "Four minutes"
          ],
          "correctAnswer": 0,
          "explanation": "The second quote was observed one minute before viewing. This age difference matters before attributing the $3 price gap to incorrect data."
        },
        {
          "prompt": "What percentage gap does $103 have relative to the earlier $100?",
          "options": [
            "4%",
            "1%",
            "3%"
          ],
          "correctAnswer": 2,
          "explanation": "The $3 difference divided by $100 is 3%. This arithmetic describes a cross-observation comparison and does not prove either provider made an error."
        },
        {
          "prompt": "For the two 12:10 observations, what is the dollar gap?",
          "options": [
            "$0",
            "$0.20",
            "$4.20"
          ],
          "correctAnswer": 1,
          "explanation": "Subtract $104 from $104.20. Their common timestamp removes the four-minute mismatch from this particular comparison, while a $0.20 gap remains."
        },
        {
          "prompt": "What percentage gap is $0.20 relative to $104, approximately?",
          "options": [
            "0.192%",
            "2%",
            "0.02%"
          ],
          "correctAnswer": 0,
          "explanation": "Divide $0.20 by $104 and multiply by 100. The approximate 0.192% gap is much smaller than the earlier unmatched-time comparison."
        },
        {
          "prompt": "Do matched timestamps alone guarantee the same reference price?",
          "options": [
            "Yes; all simultaneous observations are identical",
            "Yes; the smaller quote must be wrong",
            "No; venues and aggregation methods can still differ"
          ],
          "correctAnswer": 2,
          "explanation": "Time alignment removes one source of difference, but identity, currency, venue and methodology can still vary. Those fields require their own checks."
        },
        {
          "prompt": "What conclusion is justified by the synchronized observations alone?",
          "options": [
            "The higher quote guarantees an executable sale",
            "A small contemporaneous difference exists between the stated references",
            "The lower provider is proven fraudulent"
          ],
          "correctAnswer": 1,
          "explanation": "The worksheet supports a measured gap at the supplied time. It does not establish dishonesty or prove execution availability at either reference price."
        }
      ],
      "reflection": "Write a cautious discrepancy report with these inputs.",
      "reflectionGuide": "Include both values and observation times, say that they are not simultaneous, and request comparable data before judging accuracy. Do not turn a four-minute price difference into a directional forecast.",
      "sources": [
        {
          "label": "CoinGecko — Price methodology",
          "url": "https://www.coingecko.com/en/methodology"
        }
      ]
    },
    {
      "id": "practice-39",
      "title": "The same headline can fit several explanations",
      "category": "Risk and uncertainty",
      "scenario": "A hypothetical company reports revenue growth of 15%, but its stock falls 4% after the report. The worksheet provides no prior expectations, margins or guidance. One learner says growing revenue proves the price should rise. Another says the fall proves the company is failing. Both explanations reach beyond the supplied evidence.\n\nAdd two hypothetical expectations cases: in branch A, analysts had expected 20% revenue growth; in branch B, they had expected 10%. Actual reported growth stays 15%. No information about margins, valuation or guidance is added. Compare the arithmetic surprise while keeping the observed 4% stock fall separate from a proven causal explanation. More context can narrow interpretation without making a single metric a price forecast.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "percent",
        "bars": [
          {
            "label": "Revenue growth",
            "value": 15
          },
          {
            "label": "Price decline magnitude",
            "value": 4
          }
        ]
      },
      "questions": [
        {
          "prompt": "What does the stated revenue growth measure?",
          "options": [
            "The company’s profit margin",
            "A business metric over its reporting comparison",
            "A guaranteed stock return"
          ],
          "correctAnswer": 1,
          "explanation": "Revenue growth and share-price return are different measurements. Higher sales do not directly specify expenses, profitability, expectations or valuation. The report needs its own definitions and comparison period."
        },
        {
          "prompt": "Which additional evidence would help explain the price reaction?",
          "options": [
            "A rule that revenue and prices must match",
            "Prior expectations, margins, guidance and market conditions",
            "Only the direction of one candle"
          ],
          "correctAnswer": 1,
          "explanation": "A market response can reflect how new information differs from expectations as well as broader conditions. The missing fields prevent a confident single-cause explanation from this short case."
        },
        {
          "prompt": "What is the best-supported conclusion from the supplied facts?",
          "options": [
            "The business is certainly failing",
            "Revenue grew while the stock fell; the cause is unresolved",
            "The stock must rebound next session"
          ],
          "correctAnswer": 1,
          "explanation": "Report the two observations separately and acknowledge the missing evidence. Neither a price decline nor a revenue increase supplies a complete business assessment or establishes the next market move."
        },
        {
          "prompt": "Against the branch-A 20% expectation, what is the growth surprise?",
          "options": [
            "5 percentage points below expectation",
            "5% above expectation",
            "15 percentage points above expectation"
          ],
          "correctAnswer": 0,
          "explanation": "Subtract expected 20% growth from actual 15% growth. The −5 percentage-point gap describes the growth-rate difference, not a negative revenue level."
        },
        {
          "prompt": "Against the branch-B 10% expectation, what is the growth surprise?",
          "options": [
            "5 percentage points below expectation",
            "50 percentage points above expectation",
            "5 percentage points above expectation"
          ],
          "correctAnswer": 2,
          "explanation": "Actual 15% growth exceeds the selected 10% expectation by five percentage points. The same report can have a different surprise against a different reference."
        },
        {
          "prompt": "Does branch A’s missed expectation mean revenue fell year over year?",
          "options": [
            "Yes; the stock move rewrites the revenue figure",
            "No; reported growth is still positive 15%",
            "Yes; any missed expectation means falling revenue"
          ],
          "correctAnswer": 1,
          "explanation": "Revenue can grow while falling short of an expected growth rate. Distinguish the positive reported change from its negative surprise against the benchmark."
        },
        {
          "prompt": "Does branch B’s positive surprise guarantee a rising stock price?",
          "options": [
            "No; other evidence and pricing assumptions remain missing",
            "Yes; any beat fixes the next price",
            "Yes; growth and return percentages are identical"
          ],
          "correctAnswer": 0,
          "explanation": "A positive surprise in one metric does not settle margins, valuation, guidance or market expectations elsewhere. The case cannot convert revenue growth into a guaranteed return."
        },
        {
          "prompt": "What is the supplied stock return after the report?",
          "options": [
            "+15%",
            "−5%",
            "−4%"
          ],
          "correctAnswer": 2,
          "explanation": "The worksheet independently states a 4% price decline. That market outcome should not be replaced by the revenue growth rate or the expectation-gap calculation."
        },
        {
          "prompt": "What is missing before attributing the fall solely to a revenue surprise?",
          "options": [
            "Only more repetitions of the same headline",
            "Comparable expectations and broader event context",
            "Only a larger title font"
          ],
          "correctAnswer": 1,
          "explanation": "The branch expectations are hypothetical alternatives and other relevant data remain absent. A causal explanation needs evidence beyond a coincident report and price move."
        },
        {
          "prompt": "Which note most accurately separates fact from interpretation?",
          "options": [
            "Revenue grew 15%; price fell 4%; the reason remains uncertain",
            "The fall proves the business is failing",
            "The growth proves the stock must rise tomorrow"
          ],
          "correctAnswer": 0,
          "explanation": "The statement preserves both supplied observations and the limit of their causal interpretation. It avoids replacing missing evidence with a confident directional story."
        }
      ],
      "reflection": "Write one observation, one hypothesis and one question to investigate.",
      "reflectionGuide": "Keep the observed numbers distinct from proposed causes. For example, ask how the report compared with expectations, then seek the actual source instead of presenting the hypothesis as an established explanation.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-49",
      "title": "A reflection can be useful without a forecast score",
      "category": "Decision habits",
      "scenario": "Two learners disagree about a hypothetical market’s next direction. Both can identify the scenario’s assumptions, missing evidence and position exposure. TradeHQ’s quick directional challenge is a reflection exercise, while the deeper questions assess explicit concepts and arithmetic. A system should not manufacture a single correct forecast from an uncertain case.\n\nFor a conceptual scoring example, a learner answers a defined arithmetic question correctly but chooses a directional view that differs from another learner’s view. No future market outcome or calibrated forecasting model is supplied. Keep objective answer checking separate from the discussion of uncertainty. Completing a longer case can contribute one streak day, but it should not fabricate a prediction score or cause automatic trading.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "learning checks",
        "bars": [
          {
            "label": "Reasoning tasks",
            "value": 3
          },
          {
            "label": "Guaranteed forecasts",
            "value": 0
          }
        ]
      },
      "questions": [
        {
          "prompt": "What can be scored objectively when inputs are explicit?",
          "options": [
            "A calculation or concept with a justified answer",
            "The next uncertain market direction",
            "Which choice feels most confident"
          ],
          "correctAnswer": 0,
          "explanation": "A question with stated numbers or clear product mechanics can have a checkable answer. Directional outcomes without enough evidence should not be labelled objectively correct merely to provide a score."
        },
        {
          "prompt": "What makes a directional reflection useful?",
          "options": [
            "Evidence, alternatives and an explicit uncertainty statement",
            "Pretending there is no uncertainty",
            "Choosing the most popular answer"
          ],
          "correctAnswer": 0,
          "explanation": "A reflection can assess how a learner frames the problem, considers alternatives and controls exposure. It should not claim to predict future prices or equate confidence with correctness."
        },
        {
          "prompt": "What does completing either Daily activity do to the daily streak?",
          "options": [
            "At most one completion is counted for that local day",
            "Every answer adds a new streak day",
            "A wrong forecast erases the entire history"
          ],
          "correctAnswer": 0,
          "explanation": "The streak records a daily practice habit, not a verified forecasting record. Completing both activities on the same date should not create multiple elapsed days or inflate the streak count."
        },
        {
          "prompt": "Which additional item could be graded against explicit case inputs?",
          "options": [
            "The next market direction with no outcome supplied",
            "Which learner sounds more confident",
            "A units-times-quote valuation"
          ],
          "correctAnswer": 2,
          "explanation": "A defined quantity and quote produce a checkable value. Confidence or an unsupported future direction cannot create a defensible answer key."
        },
        {
          "prompt": "Does disagreement about direction prove one learner failed the arithmetic question?",
          "options": [
            "Yes; agreeing with the other learner is required",
            "No; the two questions assess different things",
            "Yes; every bearish view is mathematically wrong"
          ],
          "correctAnswer": 1,
          "explanation": "A directional view and an input-based calculation have different evidence requirements. Correct arithmetic is not invalidated simply by disagreement about an uncertain future."
        },
        {
          "prompt": "What would make a directional discussion more informative?",
          "options": [
            "Conditions that could challenge each view",
            "A fabricated guaranteed price target",
            "A score awarded for confidence alone"
          ],
          "correctAnswer": 0,
          "explanation": "Stating what evidence would change a view makes assumptions reviewable. A confidence score or invented certainty does not resolve the case’s missing future outcome."
        },
        {
          "prompt": "Does finishing the quick activity and deeper case on the same date count as two streak days?",
          "options": [
            "Yes; each button creates another day",
            "Yes; every correct answer adds a day",
            "No; completion counts once per local date"
          ],
          "correctAnswer": 2,
          "explanation": "The Daily streak is calendar-based and capped at one completion per local day. Both learning activities can be completed without inflating the day count."
        },
        {
          "prompt": "Does checking a case-study answer execute its hypothetical trade?",
          "options": [
            "Yes; opening Go Deeper sells current holdings",
            "No; learning answers and manual orders are separate",
            "Yes; a correct answer buys the asset"
          ],
          "correctAnswer": 1,
          "explanation": "Case questions assess supplied concepts and arithmetic. They do not submit supported buy or sell orders or change real or virtual holdings."
        },
        {
          "prompt": "What does a worked explanation establish about an answer?",
          "options": [
            "How it follows from the stated inputs and assumptions",
            "That the user will make future profits",
            "That a market forecast is guaranteed"
          ],
          "correctAnswer": 0,
          "explanation": "An explanation connects a defensible answer to the worksheet. Its educational role does not validate future returns or turn uncertain direction into fact."
        },
        {
          "prompt": "What is an honest final score label for the longer case?",
          "options": [
            "Verified forecasting accuracy",
            "Professional trading certification",
            "Correct answers out of the scored concept questions"
          ],
          "correctAnswer": 2,
          "explanation": "The score records performance on the explicit educational questions. It should not imply a verified forecasting record or professional credential that the exercise never established."
        }
      ],
      "reflection": "Name one thing you can check and one thing this case leaves uncertain.",
      "reflectionGuide": "Use arithmetic or product mechanics as the checkable item, and future direction as unresolved. Explain that the daily completion tracks participation, while learning quality requires reviewing the reasoning.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-10",
      "title": "A position value is not a share price",
      "category": "Portfolio arithmetic",
      "scenario": "A worksheet has 40 shares of company A at $25 and five shares of company B at $200. Both positions therefore have equal market value. A learner says B takes up eight times more of the account because its per-share price is eight times higher. Compare quantities and prices before drawing a concentration conclusion.\n\nPlace the two equal $1,000 holdings in a $10,000 account with $8,000 cash. Let A rise 10% and B fall 10% simultaneously, with no fees or trades. Then inspect a separate purchase of one share at either original quote. A single share is not a fixed dollar exposure across companies. Keep units, dollar positions and business valuation measures in separate columns when checking the concentration claim.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "A position",
            "value": 1000
          },
          {
            "label": "B position",
            "value": 1000
          },
          {
            "label": "A quote",
            "value": 25
          },
          {
            "label": "B quote",
            "value": 200
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the market value of the 40-share A position?",
          "options": [
            "$1,000",
            "$25",
            "$40"
          ],
          "correctAnswer": 0,
          "explanation": "Multiply 40 shares by $25 per share. The resulting $1,000 is the position value. Neither the quoted price nor the share count alone tells you how many dollars are exposed."
        },
        {
          "prompt": "How do the two dollar exposures compare in this case?",
          "options": [
            "They are equal",
            "B is eight times larger",
            "A is eight times larger"
          ],
          "correctAnswer": 0,
          "explanation": "Five shares at $200 also equal $1,000. Equal dollar exposure does not imply equal volatility or equal risk, but the higher nominal share price does not create a larger allocation here."
        },
        {
          "prompt": "What would be needed to compare the businesses’ valuations?",
          "options": [
            "Business measures and shares outstanding, among other evidence",
            "Only their nominal share prices",
            "Only your share quantities"
          ],
          "correctAnswer": 0,
          "explanation": "A share price is the price of one ownership unit. Different share counts and business fundamentals make nominal prices unsuitable for declaring one company cheaper. Position arithmetic and business valuation are separate tasks."
        },
        {
          "prompt": "What account weight does each original $1,000 position represent?",
          "options": [
            "2.5% for A and 20% for B",
            "50% each",
            "10% each"
          ],
          "correctAnswer": 2,
          "explanation": "Divide each $1,000 holding by $10,000 equity. Different share counts and share prices still produce equal dollar allocations in this stated account."
        },
        {
          "prompt": "After A rises 10%, what is its original position worth?",
          "options": [
            "$1,400",
            "$1,100",
            "$1,010"
          ],
          "correctAnswer": 1,
          "explanation": "The original $1,000 position gains $100, becoming $1,100. Forty shares at the updated $27.50 quote produce exactly the same marked value."
        },
        {
          "prompt": "After B falls 10%, what is its original position worth?",
          "options": [
            "$900",
            "$980",
            "$500"
          ],
          "correctAnswer": 0,
          "explanation": "The original $1,000 position loses $100. Its five shares are now $180 each, and quantity times quote gives $900 remaining value."
        },
        {
          "prompt": "What is total equity after these simultaneous opposing moves?",
          "options": [
            "$10,200",
            "$9,800",
            "$10,000"
          ],
          "correctAnswer": 2,
          "explanation": "The $100 A gain offsets the $100 B loss in this chosen case. Add $8,000 cash, $1,100 A and $900 B to verify the unchanged total."
        },
        {
          "prompt": "At its original quote, what notional does one extra B share add?",
          "options": [
            "$1,000",
            "$200",
            "$25"
          ],
          "correctAnswer": 1,
          "explanation": "The original B quote is $200 per share. One additional B share adds that notional, while one A share adds only $25 before transaction fees."
        },
        {
          "prompt": "How many A shares match one B share’s purchase notional at the original quotes?",
          "options": [
            "Eight A shares",
            "Two A shares",
            "Half an A share"
          ],
          "correctAnswer": 0,
          "explanation": "One B share costs $200 and each A share costs $25. Eight A shares provide equal notional, without establishing equivalent businesses or future risks."
        },
        {
          "prompt": "Why can’t the $25 and $200 quotes alone identify the cheaper business?",
          "options": [
            "The smaller quote always means better value",
            "Equal position sizes imply identical company valuations",
            "Shares outstanding and comparable business fundamentals also matter"
          ],
          "correctAnswer": 2,
          "explanation": "Per-share prices depend partly on the number of units outstanding. Business comparison requires appropriate valuation measures and fundamentals, not just the investor’s selected quantities."
        }
      ],
      "reflection": "Write a sentence separating equal exposure from equal risk.",
      "reflectionGuide": "Show that both holdings are $1,000, then name risks that could differ, such as business conditions or price variability. Do not infer either company’s quality from the dollar price of one share.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-20",
      "title": "Small decimal quantities still need units",
      "category": "Costs and orders",
      "scenario": "A hypothetical crypto quote is $40,000 per coin. A learner buys 0.025 coin before fees. The long decimal can make the purchase seem either tiny or expensive depending on which number is noticed. Translate the quantity into notional dollars and apply the 0.1% fee before comparing it with an account balance.\n\nAfter the 0.025-coin purchase, suppose the quote rises to $44,000 per whole coin. Sell the entire holding at that exact quote and charge 0.1% on the sale. No blockchain transfer or additional order occurs. Track the small quantity through both trades instead of treating the whole-coin price as the invested amount. Compare asset return with net gain after the entry and exit charges.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Notional",
            "value": 1000
          },
          {
            "label": "Fee",
            "value": 1
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the notional value of 0.025 coin at $40,000?",
          "options": [
            "$100",
            "$40,000",
            "$1,000"
          ],
          "correctAnswer": 2,
          "explanation": "Multiply 0.025 coin by $40,000 per coin. The coin units cancel, leaving $1,000. A decimal quantity should always be read with its unit and the price per unit."
        },
        {
          "prompt": "What debit follows when the 0.1% fee is included?",
          "options": [
            "$1,000.10",
            "$1,025",
            "$1,001"
          ],
          "correctAnswer": 2,
          "explanation": "The $1,000 trade has a $1 fee. The full debit is $1,001. Using the quantity 0.025 as a dollar fee would mix incompatible units and produce the wrong cash result."
        },
        {
          "prompt": "Does a high price per whole coin prevent a small dollar exposure?",
          "options": [
            "Yes; every purchase must cost a whole coin",
            "No; fractional quantities eliminate losses",
            "No; fractional quantity changes the exposure"
          ],
          "correctAnswer": 2,
          "explanation": "Fractional quantities can represent smaller dollar amounts when the instrument supports them. They do not eliminate price risk. Verify supported precision and costs rather than inferring affordability from the whole-coin price."
        },
        {
          "prompt": "What fraction of one whole coin is the original 0.025 quantity?",
          "options": [
            "25%",
            "2.5%",
            "0.025%"
          ],
          "correctAnswer": 1,
          "explanation": "Multiply the decimal quantity by 100 to express it as a percentage of a coin. The purchase holds 2.5% of one coin, not the entire quoted unit."
        },
        {
          "prompt": "What marked value does 0.025 coin have at the later $44,000 quote?",
          "options": [
            "$1,100",
            "$44,000",
            "$11,000"
          ],
          "correctAnswer": 0,
          "explanation": "Multiply 0.025 by $44,000 to obtain $1,100. The whole-coin quote is a unit price, rather than the notional of this fractional holding."
        },
        {
          "prompt": "What is the whole-coin quote’s return from $40,000 to $44,000?",
          "options": [
            "4%",
            "0.1%",
            "10%"
          ],
          "correctAnswer": 2,
          "explanation": "Divide the $4,000 quote increase by the $40,000 starting quote. The fractional position has the same gross percentage move before transaction fees."
        },
        {
          "prompt": "What is the sale fee on this $1,100 holding?",
          "options": [
            "$1",
            "$1.10",
            "$44"
          ],
          "correctAnswer": 1,
          "explanation": "Apply 0.1% to the actual $1,100 sale notional. Charging the fee against the $44,000 whole-coin price would overstate this fractional transaction’s cost."
        },
        {
          "prompt": "What net proceeds arrive from the full fractional sale?",
          "options": [
            "$1,098.90",
            "$1,100",
            "$1,099"
          ],
          "correctAnswer": 0,
          "explanation": "Subtract the $1.10 exit fee from $1,100 gross proceeds. The earlier $1 purchase fee is accounted for separately in the initial cash debit."
        },
        {
          "prompt": "What is net gain versus the original $1,001 entry debit?",
          "options": [
            "$100",
            "$98.90",
            "$97.90"
          ],
          "correctAnswer": 2,
          "explanation": "Compare $1,098.90 net sale proceeds with $1,001 initial debit. Their $97.90 difference includes both the entry and exit fees."
        },
        {
          "prompt": "Which detail is necessary to translate any whole-coin quote into exposure?",
          "options": [
            "Only the asset’s popularity",
            "The owned fraction of the coin",
            "Only the number of digits in its price"
          ],
          "correctAnswer": 1,
          "explanation": "Units held multiplied by the per-unit quote determines exposure. A high whole-unit price alone does not indicate how much of the account is invested."
        }
      ],
      "reflection": "Write the calculation so a beginner can follow the units.",
      "reflectionGuide": "Use “0.025 coin × $40,000 per coin = $1,000,” then add the $1 stated fee. Keep quantity, price, notional and fee as separately labelled fields.",
      "sources": [
        {
          "label": "FINRA — Crypto assets",
          "url": "https://www.finra.org/investors/investing/investment-products/crypto-assets"
        }
      ]
    },
    {
      "id": "practice-30",
      "title": "Price-change percentages need a window",
      "category": "Price data",
      "scenario": "A coin is quoted at $110. One page says +10% from a $100 reference; another says −8.33% from a $120 reference. Both reference values are hypothetical and represent different periods. An identical current price can have opposite signed changes when the start points differ. Identify the window before treating either percentage as contradictory.\n\nTreat the $100 and $120 reference prices as two different labelled windows ending at $110. Then add a third reference at $105. The current quote does not change across these calculations. Compare the signed dollar changes and percentage bases. A report that drops the reference window can make valid numbers look inconsistent, while a cached current quote introduces a separate freshness question.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Reference A",
            "value": 100
          },
          {
            "label": "Reference B",
            "value": 120
          },
          {
            "label": "Current",
            "value": 110
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is the change from $100 to $110?",
          "options": [
            "−10%",
            "+10%",
            "+110%"
          ],
          "correctAnswer": 1,
          "explanation": "The gain is $10 and the starting base is $100. Dividing $10 by $100 gives 10%. The current price alone is not sufficient to calculate a percentage change without a reference."
        },
        {
          "prompt": "What is the change from $120 to $110, approximately?",
          "options": [
            "+8.33%",
            "−8.33%",
            "−10%"
          ],
          "correctAnswer": 1,
          "explanation": "The $10 loss is divided by the $120 starting reference, giving approximately −8.33%. Using $100 or the final $110 as the denominator would answer a different calculation."
        },
        {
          "prompt": "What should the interface attach to a percentage-change label?",
          "options": [
            "Only an arrow color",
            "Its reference period or start time",
            "A promise that the trend continues"
          ],
          "correctAnswer": 1,
          "explanation": "The time window explains what the percentage measures. Different valid windows can produce different signs. A color or arrow may summarize a result, but it cannot replace the reference definition."
        },
        {
          "prompt": "What is the dollar change from the $100 reference?",
          "options": [
            "+$10",
            "−$10",
            "+$110"
          ],
          "correctAnswer": 0,
          "explanation": "Subtract $100 from $110 to obtain a $10 rise. This change belongs to the window using $100 as its reference, not every period on the page."
        },
        {
          "prompt": "What is the dollar change from the $120 reference?",
          "options": [
            "+$10",
            "−$120",
            "−$10"
          ],
          "correctAnswer": 2,
          "explanation": "Subtract $120 from the same $110 current quote. The $10 decline is compatible with the positive change measured from the different $100 reference."
        },
        {
          "prompt": "From a third $105 reference, what is the percentage change, approximately?",
          "options": [
            "−4.76%",
            "+4.76%",
            "+5%"
          ],
          "correctAnswer": 1,
          "explanation": "Divide the $5 rise by the $105 reference and multiply by 100. The reference denominator creates a third valid change for the same endpoint."
        },
        {
          "prompt": "What gain from $110 would restore the $120 reference, approximately?",
          "options": [
            "9.09%",
            "8.33%",
            "10%"
          ],
          "correctAnswer": 0,
          "explanation": "The required $10 rise must be divided by current $110. It is not the same percentage as the earlier $10 loss divided by $120."
        },
        {
          "prompt": "Does the shared $110 endpoint make the two original return windows equivalent?",
          "options": [
            "Yes; identical endpoints imply identical returns",
            "Yes; signs should be removed to compare them",
            "No; their reference points differ"
          ],
          "correctAnswer": 2,
          "explanation": "A return depends on both starting reference and ending value. Equal endpoints do not erase different histories or justify replacing distinct window labels."
        },
        {
          "prompt": "Which metadata pair would clarify these percentage labels?",
          "options": [
            "Only the newest page fetch time",
            "Reference-window definition and quote observation time",
            "Only the text colour and arrow direction"
          ],
          "correctAnswer": 1,
          "explanation": "The window explains the return base, while observation time explains the endpoint’s age. A page-fetch timestamp alone cannot answer either question completely."
        },
        {
          "prompt": "What would make a claimed contradiction stronger than this example?",
          "options": [
            "Different percentages with the same verified start, end and method",
            "Opposite signs from different starting references",
            "A longer number of decimal places"
          ],
          "correctAnswer": 0,
          "explanation": "To establish inconsistency, compare calculations on identical inputs and definitions. This case supplies different references, so opposite signs are not themselves contradictory."
        }
      ],
      "reflection": "Explain how both percentages could be correct.",
      "reflectionGuide": "Show each starting value and divide the $10 change by that value. Mention that the windows differ and that neither past-window change is a guarantee of the next price move.",
      "sources": [
        {
          "label": "CoinGecko — Price methodology",
          "url": "https://www.coingecko.com/en/methodology"
        }
      ]
    },
    {
      "id": "practice-40",
      "title": "A single stress test is not the worst case",
      "category": "Risk and uncertainty",
      "scenario": "A worksheet tests a $10,000 position against a 10% decline and obtains a $1,000 loss. The learner calls that the maximum possible loss. No contractual protection or price floor is stated. Stress testing one selected move shows sensitivity to that input, but the choice of scenario does not restrict what the asset can do.\n\nAdd separate stress branches of a 25% decline and a 100% decline to the same $10,000 unprotected spot position. Assume no leverage, no sale and no other account holdings for this worksheet. These are selected sensitivities, not assigned probabilities. Compare losses and remaining marks, then identify why neither a selected scenario list nor a journal threshold creates contractual downside protection.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$",
        "bars": [
          {
            "label": "Position value",
            "value": 10000
          },
          {
            "label": "Test loss",
            "value": 1000
          }
        ]
      },
      "questions": [
        {
          "prompt": "What loss follows from the selected 10% decline?",
          "options": [
            "$1,000",
            "$10,000",
            "$100"
          ],
          "correctAnswer": 0,
          "explanation": "Multiply $10,000 by 0.10 to get $1,000. This is the loss in the supplied stress case. It should be labelled with the assumed move rather than described as a universal risk bound."
        },
        {
          "prompt": "Does choosing a 10% stress move cap the asset’s decline at 10%?",
          "options": [
            "No; the worksheet imposes no protection",
            "Yes; selected scenarios limit markets",
            "Yes; a journal creates a price floor"
          ],
          "correctAnswer": 0,
          "explanation": "A chosen scenario is an analytical input, not an order or contractual guarantee. Larger declines remain possible, and missing data or execution constraints can complicate an actual exit."
        },
        {
          "prompt": "What would make a sensitivity review more informative?",
          "options": [
            "Several labelled moves and the account impact of each",
            "Only the most comfortable scenario",
            "Deleting adverse outcomes from the record"
          ],
          "correctAnswer": 0,
          "explanation": "Testing multiple selected conditions reveals how exposure responds across a wider range. Even a larger set is not exhaustive. Keep assumptions clear and avoid calling a scenario list a complete forecast distribution."
        },
        {
          "prompt": "What value remains after the original 10% decline test?",
          "options": [
            "$1,000",
            "$10,000",
            "$9,000"
          ],
          "correctAnswer": 2,
          "explanation": "The original selected loss is $1,000, leaving $9,000 marked value. A stress-loss amount and the remaining asset value are different quantities."
        },
        {
          "prompt": "In the separate 25% decline branch, what dollar loss occurs?",
          "options": [
            "$7,500",
            "$2,500",
            "$250"
          ],
          "correctAnswer": 1,
          "explanation": "Multiply $10,000 exposure by 25% to obtain a $2,500 loss. This larger chosen move demonstrates sensitivity beyond the first test without predicting likelihood."
        },
        {
          "prompt": "What value remains in that 25% decline branch?",
          "options": [
            "$7,500",
            "$2,500",
            "$9,000"
          ],
          "correctAnswer": 0,
          "explanation": "Subtract the $2,500 selected loss from $10,000. The $7,500 remaining mark is conditional on this specific decline, not a guaranteed minimum value."
        },
        {
          "prompt": "Under the stated unleveraged 100% asset-decline branch, what holding value remains?",
          "options": [
            "$1,000",
            "−$10,000",
            "$0"
          ],
          "correctAnswer": 2,
          "explanation": "A 100% decline takes the positive $10,000 asset value to zero in this unleveraged spot worksheet. No borrowed exposure or additional liabilities are supplied."
        },
        {
          "prompt": "Does choosing several stress branches assign probabilities to them?",
          "options": [
            "Yes; the most extreme branch always occurs",
            "No; no likelihood model was supplied",
            "Yes; every listed branch is equally likely"
          ],
          "correctAnswer": 1,
          "explanation": "A scenario list organizes sensitivities. Probabilities need a separate stated model or supporting estimation method, rather than being inferred from the number of examples."
        },
        {
          "prompt": "Would a written “sell after 10%” note itself cap this simulator position’s loss?",
          "options": [
            "No; it is not an executed or automatic stop order",
            "Yes; journal text provides contractual protection",
            "Yes; a stress test locks an exit price"
          ],
          "correctAnswer": 0,
          "explanation": "A note expresses a plan, while TradeHQ requires supported manual orders. It neither executes automatically nor guarantees the quote available at an eventual sale."
        },
        {
          "prompt": "What is an honest description of the expanded stress review?",
          "options": [
            "An exhaustive prediction of future losses",
            "A guarantee that all risks have been measured",
            "Selected downside sensitivities with explicit assumptions"
          ],
          "correctAnswer": 2,
          "explanation": "The tests show account impact under chosen moves and mechanics. Even a wider set is not a complete forecast or proof that every possible constraint has been captured."
        }
      ],
      "reflection": "Design a second stress case without presenting it as a prediction.",
      "reflectionGuide": "Choose another explicitly hypothetical decline, multiply it by the position value and compare the account impact. State that neither test supplies a probability or a guaranteed maximum loss.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    },
    {
      "id": "practice-50",
      "title": "Review an error without rewriting the score",
      "category": "Decision habits",
      "scenario": "You answer a hypothetical fee question incorrectly, then read the worked explanation and recognize that 0.1% equals 0.001 rather than 0.01. A tempting response is to erase the attempt so the record looks perfect. Keeping the original answer and writing the corrected reasoning gives the mistake an educational purpose.\n\nUse a second fee calculation to test transfer rather than merely remembering the corrected option. Charge 0.1% on $2,500 and compare it with 1% on the same notional. Then inspect the original wrong attempt and its corrected reasoning. Keep the historical score unchanged while recording what concept needs another review; learning progress does not require erasing evidence of the mistake.",
      "visual": {
        "caption": "Hypothetical case inputs — not a live market chart",
        "unit": "$ fee on $1,000",
        "bars": [
          {
            "label": "Correct fee",
            "value": 1
          },
          {
            "label": "Mistaken fee",
            "value": 10
          }
        ]
      },
      "questions": [
        {
          "prompt": "What is 0.1% expressed as a decimal multiplier?",
          "options": [
            "0.01",
            "0.1",
            "0.001"
          ],
          "correctAnswer": 2,
          "explanation": "Divide the percentage number by 100: 0.1 ÷ 100 = 0.001. Multiplying $1,000 by that decimal gives a $1 fee. The mistaken 0.01 multiplier would represent 1%."
        },
        {
          "prompt": "How much larger is the mistaken $10 estimate than the correct $1 fee?",
          "options": [
            "Two times as large",
            "The same amount",
            "Ten times as large"
          ],
          "correctAnswer": 2,
          "explanation": "Divide $10 by $1 to obtain a factor of ten. Identifying the source of a decimal conversion error is more useful than memorizing a corrected option without understanding how the units changed."
        },
        {
          "prompt": "What is the most useful response after reviewing the error?",
          "options": [
            "Rewrite the original answer as correct",
            "Ignore the explanation because the score is imperfect",
            "Keep the attempt and explain the corrected conversion"
          ],
          "correctAnswer": 2,
          "explanation": "A saved attempt preserves evidence of the learning gap. A short corrected explanation helps test understanding next time. Practice progress is not a certification and should not require a perfect record to be worthwhile."
        },
        {
          "prompt": "At 0.1%, what is the fee on a new $2,500 notional?",
          "options": [
            "$250",
            "$2.50",
            "$25"
          ],
          "correctAnswer": 1,
          "explanation": "Multiply $2,500 by 0.001. Applying the corrected conversion to a different notional checks understanding beyond memorizing the earlier $1 answer."
        },
        {
          "prompt": "At 1%, what is the fee on the same $2,500?",
          "options": [
            "$25",
            "$2.50",
            "$250"
          ],
          "correctAnswer": 0,
          "explanation": "Convert 1% to 0.01 and multiply by $2,500. The $25 result is ten times the fee at 0.1% on an identical notional."
        },
        {
          "prompt": "What is the difference between those two fee amounts?",
          "options": [
            "$2.50",
            "$25",
            "$22.50"
          ],
          "correctAnswer": 2,
          "explanation": "Subtract $2.50 from $25 to obtain $22.50. Comparing both rates on the same notional isolates the percentage-conversion difference."
        },
        {
          "prompt": "Which decimal multiplier represents 0.01%, one tenth of 0.1%?",
          "options": [
            "0.01",
            "0.0001",
            "0.001"
          ],
          "correctAnswer": 1,
          "explanation": "Divide 0.01 by 100 to get 0.0001. The percentage and decimal forms must not be confused, especially when checking small transaction rates."
        },
        {
          "prompt": "What fee would 0.01% produce on $2,500?",
          "options": [
            "$0.25",
            "$2.50",
            "$25"
          ],
          "correctAnswer": 0,
          "explanation": "Multiply $2,500 by 0.0001 to obtain $0.25. Moving the percentage rate down by a factor of ten also reduces the fee by ten on the same base."
        },
        {
          "prompt": "Which order-of-magnitude check would catch the original $10-versus-$1 error?",
          "options": [
            "Count the number of letters in the ticker",
            "Assume every decimal answer should be rounded to ten",
            "Compare the fee with 1% of the same notional"
          ],
          "correctAnswer": 2,
          "explanation": "At $1,000, 1% is $10 and 0.1% must be one tenth of that. This benchmark reveals a tenfold conversion error before the ledger is interpreted."
        },
        {
          "prompt": "What should happen to the recorded original wrong answer after review?",
          "options": [
            "Delete every attempt containing an error",
            "Keep it and use the explanation to identify the learning gap",
            "Rewrite it as correct to improve the score"
          ],
          "correctAnswer": 1,
          "explanation": "Preserving the original attempt keeps the score honest and the gap visible. Reviewing a new calculation can show progress without changing what happened earlier."
        }
      ],
      "reflection": "Write a reusable percent-to-decimal check for future fee calculations.",
      "reflectionGuide": "Divide the stated percent by 100, multiply by notional dollars, and check the order of magnitude. Keep the original attempt visible and note how the tenfold error occurred.",
      "sources": [
        {
          "label": "Investor.gov — Investing basics",
          "url": "https://www.investor.gov/introduction-investing"
        }
      ]
    }
  ]
};
