export const ASSET_REFERENCES: Record<string, { label: string; href: string; exercise: string }> = {
  "btc": {
    "label": "Bitcoin project FAQ",
    "href": "https://bitcoin.org/en/faq",
    "exercise": "Compare the scheduled issuance of BTC with ETH staking and fee mechanisms. Record which differences describe network design and which would require dated market evidence; neither supply policy determines a future price."
  },
  "eth": {
    "label": "Ethereum — Ether",
    "href": "https://ethereum.org/what-is-ether/",
    "exercise": "List a wallet transfer, a smart-contract interaction and a staking position. Identify where gas, contract or validator risks arise, then mark which activities are absent from an ETH spot practice order."
  },
  "sol": {
    "label": "Solana developer documentation",
    "href": "https://solana.com/docs",
    "exercise": "Separate SOL token price from a count of successful network transactions. Sketch two hypothetical cases: rising usage with falling price, and falling usage with rising price. Explain why usage alone cannot supply an order rule."
  },
  "xrp": {
    "label": "XRP Ledger — XRP overview",
    "href": "https://xrpl.org/about/xrp",
    "exercise": "Compare ownership of XRP with a hypothetical company share. Identify which gives a token balance and which could give shareholder rights. Do not treat a Ripple company announcement as proof of an XRP holder entitlement."
  },
  "bnb": {
    "label": "BNB Chain documentation",
    "href": "https://docs.bnbchain.org/",
    "exercise": "Separate a transaction fee paid in BNB, a token supply change and an exchange-service announcement. For each, record what evidence would be needed to claim an effect on price; the exercise makes no such measured claim."
  },
  "nvda": {
    "label": "NVIDIA investor reports",
    "href": "https://investor.nvidia.com/home/default.aspx",
    "exercise": "Use a dated NVIDIA report to distinguish Data Center and Gaming revenue. Write a hypothetical case where sales rise but costs or prior expectations offset that growth. A revenue comparison does not predict the stock response."
  },
  "aapl": {
    "label": "Apple investor reports",
    "href": "https://investor.apple.com/investor-relations/default.aspx",
    "exercise": "Separate Apple product revenue from Services revenue in the same dated report. Construct one case with rising sales and falling margin, and another with flat sales and rising margin. Compare the earnings arithmetic without forecasting AAPL."
  },
  "msft": {
    "label": "Microsoft investor reports",
    "href": "https://www.microsoft.com/en-us/investor/default",
    "exercise": "Compare a subscription software activity with cloud infrastructure in a dated Microsoft report. List a revenue input and a cost input for each. Record why company diversification does not remove valuation or concentration risk."
  },
  "amzn": {
    "label": "Amazon investor reports",
    "href": "https://ir.aboutamazon.com/overview/default.aspx",
    "exercise": "Compare AWS with a retail segment in the same dated Amazon report. Calculate operating margin as operating income divided by segment sales, using matching units and periods. Explain why the largest-sales segment need not have the highest margin."
  },
  "googl": {
    "label": "Alphabet investor reports",
    "href": "https://abc.xyz/investor/",
    "exercise": "Separate Google Services, Google Cloud and Other Bets in one dated Alphabet report. Record reported revenue and operating result separately. Test a fictional scenario where a popular new product adds costs before it adds revenue."
  },
  "meta": {
    "label": "Meta investor reports",
    "href": "https://investor.atmeta.com/home/default.aspx",
    "exercise": "Contrast Family of Apps with Reality Labs using one dated Meta report. Identify which figures measure revenue and which measure operating costs or losses. Increased user activity alone does not supply the missing financial quantities."
  },
  "tsla": {
    "label": "Tesla investor reports",
    "href": "https://ir.tesla.com/",
    "exercise": "Separate vehicle deliveries, automotive revenue and energy-storage activity in a dated Tesla report. In a fictional case, multiply more vehicles by a lower average selling price, then compare with costs. Deliveries and profit need not change together."
  },
  "spy": {
    "label": "State Street — SPY fund information",
    "href": "https://www.ssga.com/us/en/individual/etfs/spdr-sp-500-etf-trust-spy",
    "exercise": "Compare a dated SPY holdings list with QQQ over the same date. Record overlapping holdings and concentration rather than counting tickers alone. Explain why two funds can hold some identical companies but have different exposures."
  },
  "qqq": {
    "label": "Invesco — QQQ holdings and sectors",
    "href": "https://www.invesco.com/qqq-etf/en/about.html",
    "exercise": "Find both technology and non-technology holdings in a dated QQQ issuer list. Compare their combined weights with SPY on the same date. A Nasdaq listing or an index name alone does not establish diversification."
  },
  "eurusd": {
    "label": "ECB — euro reference exchange rates",
    "href": "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html",
    "exercise": "For arithmetic only, translate EUR 1,000 at hypothetical USD-per-EUR rates of 1.10 and 1.12. The results are USD 1,100 and USD 1,120 before costs. Reversing the quotation requires division rather than reusing those multiplications."
  },
  "gbpusd": {
    "label": "Bank of England — exchange-rate database",
    "href": "https://www.bankofengland.co.uk/boeapps/database/Rates.asp?Travel=NIxIRx&levels=4&XNotes=Y&Nodes=&SectionRequired=I&HideNums=-1&ExtraInfo=true",
    "exercise": "Translate a hypothetical GBP 1,000 receipt at USD-per-GBP rates of 1.20 and 1.25: USD 1,200 and USD 1,250 before costs. Compare this with EUR/USD to distinguish two different base currencies even though both quotes use dollars."
  },
  "gold": {
    "label": "World Gold Council — about gold",
    "href": "https://www.gold.org/about-gold",
    "exercise": "Compare a gram of physical gold, a fund share and a gold futures contract. List custody, expenses and settlement obligations separately. Mark these as distinct exposures: buying the simplified practice symbol does not acquire any of them."
  },
  "oil": {
    "label": "US EIA — oil and petroleum products",
    "href": "https://www.eia.gov/energyexplained/oil-and-petroleum-products/",
    "exercise": "Draw a chain from crude production to refining to fuel consumption. Put a hypothetical refinery outage and a production cut at their different points in the chain. Explain why the same word, oil, can obscure different prices and physical constraints."
  }
};
