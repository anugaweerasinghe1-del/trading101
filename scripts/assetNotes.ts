/**
 * Hand-written, instrument-specific practice notes for every indexable
 * /trade/:id page. These replace asset-class boilerplate so no two
 * instrument pages share the same paragraphs or checklist lines.
 * Facts are general and verifiable; nothing here is a forecast.
 */
export interface AssetNote {
  why: string;
  watch: string;
  gap: string;
  checklist: string[];
}

export const ASSET_NOTES: Record<string, AssetNote> = {
  btc: {
    why: "Bitcoin provides a case study in a currency with a published issuance schedule and no company earnings. Comparing it with another token can help separate network design from observed price changes. A shared move does not prove that Bitcoin caused another asset to move.",
    watch: "Bitcoin's current consensus rules specify its issuance schedule. ETF flows, exchange conditions and broad risk appetite are possible research topics, not a verified ranking of causes.",
    gap: "TradeHQ records a virtual execution price and a 0.1% simulated transaction fee. An earlier displayed quote need not equal the recorded fill. A real exchange can also involve spreads, slippage, network fees and custody risk. Compare gross price movement with the fee-inclusive practice result; the simulator does not reproduce every real cost.",
    checklist: [
      "Mark the previous week's high and low before you look at today's candles.",
      "Distinguish the observation date and venue; digital-asset market access and available liquidity can vary.",
      "Write down what a 15% drop would do to your practice balance before you size the order.",
    ],
  },
  eth: {
    why: "Ethereum is a programmable network. Demand for block space and the market price of ether are distinct observations; neither alone identifies the cause of a price change.",
    watch: "Network upgrades, staking participation and fee activity are recurring themes in Ethereum news. Compare ETH and BTC over matching dated observations; neither their direction nor relative volatility has a fixed relationship.",
    gap: "Ethereum network transactions use gas fees, whose costs vary. Staking has distinct terms and risks; the simulator performs neither network transactions nor staking. Treat practice results as evidence about your decision process, not your expected returns.",
    checklist: [
      "Compare the day's ETH move with BTC's before deciding the cause is Ethereum news.",
      "Note any scheduled network upgrade dates in your journal.",
      "Compare equal hypothetical ETH and BTC exposures over the same window, including a decline in both.",
    ],
  },
  sol: {
    why: "Solana is a blockchain designed for high transaction throughput. SOL provides a case study in network usage, token ownership and operational risk. Compare observed price variation over a stated interval instead of assuming a permanent volatility ranking against other tokens.",
    watch: "Ecosystem activity, network reliability and broad market conditions are possible research topics; no measured ranking is asserted. Past network outages are part of its history and are a reminder that technical risk exists alongside price risk.",
    gap: "Smaller-cap crypto assets can have thinner order books on some venues, so a real market order may fill noticeably worse than the quoted price. A displayed simulator quote is not a reserved fill price, and the recorded virtual execution does not reproduce venue liquidity.",
    checklist: [
      "Compare several chosen hypothetical sizes and calculate the dollar effect of the same percentage move.",
      "Check whether the whole crypto market moved or only SOL.",
      "Record a hypothetical exit assumption and compare it with a manual market-order exit; TradeHQ does not place automatic stops.",
    ],
  },
  xrp: {
    why: "XRP is the native asset of the XRP Ledger, which supports payments and other transactions. A worksheet can distinguish a dated regulatory announcement from market observations without assuming causation.",
    watch: "Regulatory developments are one possible topic for dated research; this guide does not quantify or rank their historical price effects. Large holder activity and exchange listings are other topics that appear frequently in coverage.",
    gap: "Headline-driven gaps are hard to simulate. A real stop can execute beyond its trigger price during a news spike. TradeHQ has no resting stop orders: exits are manual market orders, so a planned exit is not an implemented loss limit.",
    checklist: [
      "Look up whether any legal or regulatory event is scheduled this week.",
      "Record the source and time of a headline and compare observations before and after it; timing alone does not establish an entry.",
      "Record why you expect the move to continue, in one sentence.",
    ],
  },
  bnb: {
    why: "BNB provides an example of the distinction between a native network token, exchange-related services and company ownership. A company development does not establish a token-price response.",
    watch: "Exchange-related news, token burn announcements and activity on BNB Chain are the recurring talking points. The relationships between organizations, network activity and token exposure require separate evidence.",
    gap: "Depending on where you live, access to the associated exchange may be restricted, and fees differ between venues. The educational simulator does not establish legal eligibility, geographic availability or access to real financial services.",
    checklist: [
      "Write down which organisation-level risk could affect the price before entering.",
      "Record BNB’s and BTC’s percentage price changes for the same week as an illustration. One pair of weekly changes cannot give you a sample correlation or tell you whether they move independently over time.",
      "Calculate this hypothetical position as a share of the whole practice portfolio and compare different concentration scenarios.",
    ],
  },
  nvda: {
    why: "NVIDIA reports data-centre and other business activities. Its share price is not a universal measure of artificial intelligence demand; compare dated company disclosures with separate market observations.",
    watch: "Quarterly earnings and forward guidance are scheduled company-information sources; they do not determine the next price move. Large technology customers' capital-spending plans and export restrictions on advanced chips are other frequently cited drivers.",
    gap: "Real earnings-night gaps can open far beyond a stop. A worksheet can compare hypothetical pre-report and post-report prices with several chosen exposures. Generated practice history does not reproduce a real earnings event.",
    checklist: [
      "Identify an announced earnings date and label the source and observation window.",
      "Describe the dated historical movement without treating it as a forecast.",
      "Compare how an illustrative 10% price change affects fictional positions of different sizes.",
    ],
  },
  aapl: {
    why: "Apple combines device sales with services and a broad supplier network. Its stock offers a case study in product demand, recurring revenue and valuation assumptions. Company size does not guarantee steadier price moves or establish a suitable holding period.",
    watch: "Product cycles, services revenue and geographic results are examples of research topics. Use dated issuer reports and announced event dates rather than assume a fixed schedule.",
    gap: "TradeHQ records a virtual execution price and simulated fee. An earlier displayed quote is not a guarantee of that price. Real execution depends on venue, liquidity, spread and timing; familiarity with a company does not eliminate concentration risk.",
    checklist: [
      "Mark the date of the next product event and earnings report.",
      "Compare its move to the broader Nasdaq before attributing it to Apple news.",
      "Decide on a review date, not just a price target.",
    ],
  },
  tsla: {
    why: "Tesla provides an example for separating vehicle deliveries, revenue, margins and a company narrative. Those measures need not change together, and a simulated price shock does not reproduce an actual announcement.",
    watch: "Quarterly delivery figures, earnings, margins and public statements are possible research topics. Electric-vehicle competition and autonomy claims require separate, dated evidence; none guarantees a price reaction.",
    gap: "Real execution may differ from a requested price, especially when prices gap. A virtual outcome cannot establish how a real position would execute or affect its owner.",
    checklist: [
      "Check the date of the next quarterly delivery report.",
      "Compare equal hypothetical exposures to Tesla and another company over a stated window, then vary the size assumptions.",
      "Write down whether your idea is based on a headline or on the chart.",
    ],
  },
  amzn: {
    why: "Amazon combines retail, advertising and cloud activities. Its operating results and its share price are distinct observations, and published results do not establish what caused a market move.",
    watch: "Cloud growth, retail margins and advertising revenue are different business metrics, not interchangeable reporting segments. Compare dated company disclosures.",
    gap: "A fictional account does not reproduce the financial consequences of a real position. Distinguish reported earnings from observed prices and hypothetical price gaps.",
    checklist: [
      "Identify which business segment today's news is about.",
      "Look at how the stock reacted to its last two earnings reports.",
      "Document assumptions before comparing alternative fictional outcomes.",
    ],
  },
  msft: {
    why: "Microsoft combines enterprise software, cloud infrastructure and other businesses. Recurring contracts provide a useful contrast with one-off sales, but they do not establish lower share-price risk. A practice worksheet can compare different holding periods and valuation assumptions.",
    watch: "Azure cloud growth, enterprise software subscriptions and its investments in AI are the recurring themes in its results. Check dated fund holdings before estimating Microsoft exposure through an index fund.",
    gap: "A familiar company can still create a concentrated position. In real accounts, concentration in one name is a risk even when that company is large and profitable.",
    checklist: [
      "Compare the same dated observation windows for Microsoft and a broad-market index; co-movement does not establish causation.",
      "Note the date of its next quarterly report.",
      "Compare two stated review windows and record how they change the observations, without treating either as a universal schedule.",
    ],
  },
  googl: {
    why: "Alphabet reports advertising, cloud and other activities. Dated reports help distinguish those revenue sources; they do not establish why a share price moved.",
    watch: "Advertising, cloud profitability, regulation and search competition are examples of research questions. GOOGL and GOOG represent different share classes; company documents describe their voting rights.",
    gap: "Regulatory headlines can arrive without warning in the real market. A simulator cannot reproduce the uncertainty of waiting on a court decision.",
    checklist: [
      "Note which share class you are practising with and why.",
      "Check whether advertising-sector peers moved the same way today.",
      "Record any pending regulatory dates in your journal.",
    ],
  },
  meta: {
    why: "Meta owns Facebook, Instagram and WhatsApp and is primarily an advertising business, with large spending on AI and virtual-reality projects. Its history includes both steep declines and strong recoveries, which makes it instructive for studying drawdowns.",
    watch: "User engagement, advertising pricing, capital-expenditure plans and spending on its Reality Labs division are the recurring themes in its reports.",
    gap: "A virtual drawdown does not reproduce a real financial loss. Use separately sourced historical observations for a real drawdown study; generated chart history does not reproduce Meta’s market record.",
    checklist: [
      "Specify a historical sample and calculate its drawdown from dated observations; a recovery may not occur within that sample.",
      "Check the next earnings date and any spending guidance updates.",
      "Compare alternative fictional drawdown scenarios without inferring a suitable personal risk limit.",
    ],
  },
  spy: {
    why: "SPY tracks the S&P 500, which covers roughly 500 large US companies. A fictional index example illustrates diversified holdings, although individual companies can still affect the index.",
    watch: "Interest-rate decisions, inflation, employment data and company results are research topics; no ranking of their price effects is established here. Index weights change; use a dated issuer holdings list to distinguish concentration from a claim about the cause of a daily move.",
    gap: "Funds have disclosed expenses and real transactions may have spreads. A simplified virtual account does not necessarily reproduce all fund and transaction costs.",
    checklist: [
      "Check the economic calendar for inflation or interest-rate announcements.",
      "Compare dated SPY and QQQ observations without treating their difference as proof of sector causation.",
      "Compare scheduled hypothetical contributions with a lump sum using the same total amount and including a declining-price scenario.",
    ],
  },
  qqq: {
    why: "QQQ tracks the Nasdaq-100, a technology-heavy index of large non-financial companies. Compare dated holdings with SPY to study differences in fund concentration; a return difference alone cannot isolate technology’s contribution.",
    watch: "Interest-rate expectations and company results are research topics. Use dated weights and observations instead of assuming a predictable price effect.",
    gap: "A concentrated fund can experience different losses from a broader index. The result depends on the holdings and period, and a virtual loss does not reproduce real financial consequences.",
    checklist: [
      "List the top five holdings and check whether any report earnings this week.",
      "Compare its percentage move with SPY over the past month.",
      "Describe differences in the published fund exposures.",
    ],
  },
  gold: {
    why: "Gold has been used as a store of value for thousands of years and is often discussed as a hedge during uncertainty. The fictional example distinguishes a commodity from a company's earnings; it cannot reproduce or establish a real market response.",
    watch: "Interest rates, currency values, official reserves and geopolitical events are examples of research topics. Physical gold itself does not pay interest; the relationships with market prices can change.",
    gap: "Owning physical gold involves storage, insurance and dealer spreads; gold funds and futures carry their own costs. The practice symbol uses a simplified price input and does not reproduce ownership, storage or settlement.",
    checklist: [
      "Distinguish dated dollar observations from the practice price input.",
      "Note any upcoming interest-rate decision.",
      "Explain why a virtual holding cannot demonstrate the effectiveness of a real hedge.",
    ],
  },
  oil: {
    why: "Crude oil is a global commodity whose price affects inflation, transport costs and the profits of entire sectors. It provides an example for distinguishing physical supply, demand and market-price observations.",
    watch: "Production releases, inventory reports, geopolitical events and demand estimates are examples of research topics, not established rankings of price causes.",
    gap: "Oil futures differ from physical oil and may involve expiry, margin and settlement obligations. The fictional price example does not reproduce these contracts.",
    checklist: [
      "Check the date of the next OPEC+ meeting.",
      "Label the date of an inventory publication and the observation window.",
      "Compare chosen price shocks and hypothetical exposures; futures margin and automatic stops are not implemented here.",
    ],
  },
  eurusd: {
    why: "EUR/USD quotes dollars per euro. The pair offers a worksheet for separating exchange-rate arithmetic from hypotheses about ECB and Federal Reserve policy; policy differences alone do not determine a future rate.",
    watch: "Central-bank releases, inflation and employment figures are possible research topics, not a verified ranking of exchange-rate causes.",
    gap: "Retail forex is commonly traded with high leverage, which can magnify losses quickly. TradeHQ does not implement leverage. Express a chosen hypothetical price move in account currency and distinguish this spot practice from a leveraged real account.",
    checklist: [
      "Check whether an ECB or Fed announcement falls within your window.",
      "Label the observation time and distinguish it from the source's publication time.",
      "Explain the difference between a quoted exchange rate and a change in a hypothetical translated amount.",
    ],
  },
  gbpusd: {
    why: "GBP/USD, often called 'cable', pairs the British pound against the US dollar. Comparing it with EUR/USD can help separate US-dollar movements from currency-specific observations. Volatility rankings depend on the selected interval and period, rather than a fixed learning progression.",
    watch: "Central-bank decisions, inflation and political developments are research topics; their price effects are not fixed.",
    gap: "UK political or economic surprises can cause sharp gaps. Leverage and spreads in real accounts make those moves more costly than they appear in practice.",
    checklist: [
      "Identify the date of a published Bank of England release.",
      "Compare exchange-rate observations from the same dated window without claiming to establish causation.",
      "Compare matched hypothetical exposures and measured ranges over the same window; do not assume a fixed volatility ranking.",
    ],
  },
};
