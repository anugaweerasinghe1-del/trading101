export interface CountryGuide {
  slug: string;
  sourceCheck: { date: string; scope: string };
  sources: { label: string; href: string }[];
  country: string;
  flag: string;
  currency: string;
  localExchange: string;
  intro: string;
  whyPractice: string;
  regulator: { name: string; url: string };
  brokers: string[];
  taxNote: string;
  studentAngle: string;
  /** How residents actually get access to markets, in practical terms. */
  marketAccess: string;
  /** Realistic starting capital framed in local currency. */
  startingCapital: string;
  /** Assets that are locally relevant to follow while learning. */
  localAssets: string[];
  /** A concrete practice plan for the first three months. */
  practicePlan: string;
  faqs: { q: string; a: string }[];
}

export const COUNTRY_GUIDES: CountryGuide[] = [
  {
    slug: "sri-lanka",
    sourceCheck: { date: "2026-10-18", scope: "Linked regulator or registry information; no verification of individual eligibility, tax rates or remittance permission. No professional legal or financial review." },
    sources: [{"label": "SEC Sri Lanka — rules and licensing", "href": "https://www.sec.gov.lk/"}],
    country: "Sri Lanka",
    flag: "🇱🇰",
    currency: "LKR",
    localExchange: "Colombo Stock Exchange (CSE)",
    intro:
      "TradeHQ provides a free paper-trading environment for people in Sri Lanka who want to learn how global markets work without risking money. Real-money access, tax and foreign-exchange rules can change, so this guide points readers back to current official sources instead of treating those rules as fixed.",
    whyPractice:
      "Paper trading lets you practise order placement, position sizing and record-keeping without opening a real-money account. If you later consider real trading, verify the current requirements with the relevant regulator, exchange or financial institution rather than relying on a static guide.",
    regulator: {
      name: "Securities and Exchange Commission of Sri Lanka (SEC)",
      url: "https://www.sec.gov.lk/",
    },
    brokers: ["Stockbrokers and other market intermediaries listed by the Securities and Exchange Commission of Sri Lanka — verify current status at sec.gov.lk"],
    taxNote:
      "Tax treatment depends on current law and individual circumstances. Check current guidance from the relevant Sri Lankan authorities or a qualified tax professional; TradeHQ does not provide tax advice.",
    studentAngle:
      "Students and beginners can use the free courses and simulator to practise market concepts and keep a record of simulated decisions without using real money.",
    marketAccess:
      "For real-money access to Sri Lankan securities, use the current market-intermediary information published by the Securities and Exchange Commission of Sri Lanka and the Colombo Stock Exchange. For foreign-market access or outward remittances, verify the current rules with the relevant authority and your financial institution. TradeHQ does not represent that any particular overseas broker, account type or funding route is available to a specific user.",
    startingCapital:
      "TradeHQ does not publish a real-money starting amount because broker requirements and personal circumstances vary. If you ever consider a real account, check the provider's current terms and use the simulator first to understand the mechanics without risking money.",
    localAssets: [
      "The All Share Price Index and the S&P SL20 as a daily read on local sentiment",
      "USD/LKR, because it silently determines the rupee value of any foreign asset you hold",
      "Brent crude and global rice and wheat prices, which feed directly into local inflation",
      "US company reporting, studied independently of whether a particular overseas brokerage route is available",
    ],
    practicePlan:
      "Optional study worksheet: choose a dated USD/LKR observation and a fictional USD 100 asset value. Translate it into rupees at that rate, then at a hypothetical stronger and weaker rupee rate, keeping the asset value unchanged. Next change the asset value while keeping the rate fixed. This separates currency translation from asset returns. It does not establish that an overseas account or outward transfer is legally available. Use an official authority and your financial institution for those eligibility questions.",
    faqs: [
      { q: "What should Sri Lankan users know about regulation?", a: "TradeHQ is an educational simulator and does not execute real-money trades. Financial-market rules can change, so for questions about investing, brokerage access or local regulation, check current guidance from the Securities and Exchange Commission of Sri Lanka and other relevant authorities." },
      { q: "Can I convert my paper gains to real money?", a: "No. Paper trades are simulated only. Real-money trading uses separate regulated providers, and eligibility or account requirements should be checked with the relevant regulator and provider." },
      { q: "Do prices show in LKR?", a: "No. Prices are shown in USD to match global exchanges. To estimate LKR exposure, multiply by the current USD/LKR rate." },
    ],
  },
  {
    slug: "india",
    sourceCheck: { date: "2026-10-18", scope: "Linked regulator or registry information; no verification of individual eligibility, tax rates or remittance permission. No professional legal or financial review." },
    sources: [{"label": "SEBI — official rules and intermediary information", "href": "https://www.sebi.gov.in/"}, {"label": "SEBI — equity-derivatives study, FY22–FY24 (September 2024)", "href": "https://www.sebi.gov.in/reports-and-statistics/research/sep-2024/study-analysis-of-profits-and-losses-in-the-equity-derivatives-segment-fy22-fy24-_86905.html"}, {"label": "RBI — official foreign-exchange and remittance guidance", "href": "https://www.rbi.org.in/"}],
    country: "India",
    flag: "🇮🇳",
    currency: "INR",
    localExchange: "NSE and BSE",
    intro:
      "TradeHQ provides a free paper-trading environment for people in India who want to learn market mechanics before considering any real-money account. Current broker, tax and remittance rules should always be checked with official Indian sources.",
    whyPractice:
      "SEBI's September 2024 study reported that 93% of the individual equity-derivatives traders studied incurred losses over FY22–FY24. That historical derivatives sample is not a loss rate for all investors or a prediction for a later period. Virtual practice can illustrate mechanics but cannot guarantee better live results.",
    regulator: { name: "Securities and Exchange Board of India (SEBI)", url: "https://www.sebi.gov.in/" },
    brokers: ["Stock brokers listed in SEBI's current recognised-intermediary registry — verify registration status with SEBI before relying on any provider"],
    taxNote:
      "Tax treatment depends on the instrument, holding period and current Indian rules. TradeHQ is not tax advice; verify current guidance with an official source or qualified tax professional.",
    studentAngle:
      "Students and beginners can use the simulator and courses to practise market concepts and document simulated decisions without risking money.",
    marketAccess:
      "For real-money investing or trading, check SEBI's current recognised-intermediary registry and the current rules published by the relevant Indian authorities. TradeHQ does not state that a particular account structure, overseas product or remittance route is available to every resident, because those details can change and can depend on the user and provider.",
    startingCapital:
      "TradeHQ does not recommend a minimum real-money starting amount. Broker charges, product access and account requirements can change, so check current official/provider information if you ever consider funding an account. SEBI has separately published research showing substantial losses among individual equity-derivatives traders, which is one reason this guide keeps practice separate from real-money claims.",
    localAssets: [
      "Nifty 50 and Bank Nifty as the reference indices for Indian equity sentiment",
      "USD/INR, which affects the rupee return on any foreign holding",
      "Gold, which remains the default household asset and behaves differently in rupees than in dollars",
      "US technology large-caps, widely followed by Indian retail investors through international platforms",
    ],
    practicePlan:
      "Optional study worksheet: read the linked SEBI FY22–FY24 derivatives study and record its population, dates and definition of loss. Compare a virtual share purchase with the leverage and contract obligations discussed in the futures course. Do not apply the study percentage to every investor, cash-equity holder or later period. Use the journal to distinguish observed sample results from an individual prediction; successful simulation does not validate a real-money strategy.",
    faqs: [
      { q: "Is TradeHQ SEBI-registered?", a: "TradeHQ is a free educational simulator and does not execute trades or hold client funds. For the activities and entities that require SEBI registration, use SEBI's current rules and recognised-intermediary registry." },
      { q: "Can I paper trade Indian stocks like Reliance or TCS?", a: "The current TradeHQ catalogue focuses on US and global tickers. Indian-listed tickers are planned but not yet live." },
      { q: "Does the app work offline?", a: "The interface loads and stays usable on slow connections, but live price ticks require an internet connection." },
    ],
  },
  {
    slug: "philippines",
    sourceCheck: { date: "2026-10-18", scope: "Linked regulator or registry information; no verification of individual eligibility, tax rates or remittance permission. No professional legal or financial review." },
    sources: [{"label": "Philippine SEC — eRAMP capital-market participants", "href": "https://eramp.sec.gov.ph/capital-market-participants"}],
    country: "Philippines",
    flag: "🇵🇭",
    currency: "PHP",
    localExchange: "Philippine Stock Exchange (PSE)",
    intro:
      "TradeHQ provides a free paper-trading environment for people in the Philippines who want to learn how US and global markets work without risking money. Real-money provider eligibility and rules should be checked against current official sources.",
    whyPractice:
      "Paper trading lets you learn market mechanics without opening or funding a real-money brokerage account. If you later consider real trading, verify the current requirements with the Philippine SEC, the exchange and the provider involved.",
    regulator: { name: "Securities and Exchange Commission (SEC Philippines)", url: "https://www.sec.gov.ph/" },
    brokers: ["Broker/dealers and other capital-market participants listed in the Philippine SEC's current eRAMP registry"],
    taxNote:
      "Tax treatment depends on current law, the product and individual circumstances. Check current official Philippine guidance or a qualified tax professional; TradeHQ does not provide tax advice.",
    studentAngle:
      "Students and beginners can use the simulator and courses to practise market concepts and keep a record of simulated decisions without using real money.",
    marketAccess:
      "For real-money market access, check the Philippine SEC's current registry of capital-market participants and the provider's current terms. TradeHQ does not state that a particular bank setup, overseas platform, fractional product or account route is available to every resident. Nothing on TradeHQ requires a brokerage account or payment.",
    startingCapital:
      "TradeHQ does not publish a real-money starting amount because provider minimums, fees and personal circumstances vary. Use the simulator to learn the mechanics first, and verify any current account minimum or fee directly with a regulated provider.",
    localAssets: [
      "The PSEi as the headline measure of local equity sentiment",
      "USD/PHP, which matters to any household receiving remittances",
      "Regional bank and property names, which dominate local index weight",
      "US large-caps, the most common first international exposure for Filipino investors",
    ],
    practicePlan:
      "Optional study worksheet: assume a fictional USD 100 remittance and choose two hypothetical PHP-per-USD rates. Calculate the peso receipt under each before fees. Then add an explicit fee assumption and compare the net receipts. This separates currency translation and transaction costs from an investment return. It does not forecast USD/PHP or establish a bank or brokerage route. Select a study schedule that fits school or work rather than following a foreign market overnight.",
    faqs: [
      { q: "Do I need to register with SEC Philippines to use TradeHQ?", a: "TradeHQ is a free educational simulator with no real-money trades. For account eligibility or activities that require registration, check current Philippine SEC rules and the provider involved." },
      { q: "Can Filipino students under 18 use TradeHQ?", a: "TradeHQ is a simulated educational site and does not execute real-money trades. Eligibility for a real brokerage account depends on the provider and applicable rules, so check current official/provider requirements rather than relying on this guide." },
    ],
  },
  {
    slug: "pakistan",
    sourceCheck: { date: "2026-10-18", scope: "Linked regulator or registry information; no verification of individual eligibility, tax rates or remittance permission. No professional legal or financial review." },
    sources: [{"label": "SECP — capital-market licensing", "href": "https://www.secp.gov.pk/licensing/capital-markets/"}],
    country: "Pakistan",
    flag: "🇵🇰",
    currency: "PKR",
    localExchange: "Pakistan Stock Exchange (PSX)",
    intro:
      "TradeHQ provides a free paper-trading environment for people in Pakistan who want to learn global market mechanics without opening a real-money brokerage account.",
    whyPractice:
      "Paper trading lets users practise global-market mechanics without relying on a particular real-money funding or overseas-access route. Current access and exchange-control rules should be checked with official Pakistani sources.",
    regulator: {
      name: "Securities and Exchange Commission of Pakistan (SECP)",
      url: "https://www.secp.gov.pk/",
    },
    brokers: ["Securities brokers on the SECP's current licensed-broker list — verify current status with the SECP"],
    taxNote:
      "Tax treatment depends on current law and individual circumstances. Check current official Pakistani guidance or a qualified tax professional; TradeHQ does not provide tax advice.",
    studentAngle:
      "Students and beginners can use the simulator and courses to practise market concepts and document simulated decisions without risking money.",
    marketAccess:
      "For real-money market access, check the SECP's current licensed-broker and intermediary information together with current provider requirements. For foreign-market access or outward remittances, verify the current rules with the relevant Pakistani authorities and financial institution. Simulated practice on TradeHQ requires no brokerage account or payment.",
    startingCapital:
      "TradeHQ does not publish a real-money starting amount because broker requirements, charges and personal circumstances vary. Verify any current minimum or eligibility rule directly with a licensed provider if you ever consider a real account.",
    localAssets: [
      "The KSE-100 as the headline domestic index",
      "USD/PKR, which drives imported inflation and the local value of foreign holdings",
      "Energy, cement and banking sector names, which lead local index moves",
      "Global oil prices, given their outsized effect on the Pakistani import bill",
    ],
    practicePlan:
      "Optional study worksheet: assume a fictional dollar-priced oil import and two hypothetical PKR-per-USD rates. Calculate the rupee cost with the dollar oil price fixed, then change the oil price while holding the exchange rate constant. This isolates two arithmetic effects rather than predicting inflation or policy. Compare the assumptions with separately dated official observations and record any differences. The exercise does not establish permission to open or fund a foreign-market account.",
    faqs: [
      { q: "Can I use TradeHQ without a Pakistani bank account?", a: "Yes. TradeHQ never asks for any payment or bank details — it is 100% free and simulated." },
      { q: "Do you cover PSX-listed shares?", a: "Not yet. The current catalogue focuses on US and global tickers. Local coverage is on the roadmap." },
    ],
  },
  {
    slug: "nigeria",
    sourceCheck: { date: "2026-10-18", scope: "Linked regulator or registry information; no verification of individual eligibility, tax rates or remittance permission. No professional legal or financial review." },
    sources: [{"label": "SEC Nigeria — registered operator search", "href": "https://sec.gov.ng/for-investors/find-a-registered-operator/"}, {"label": "SEC Nigeria — unregistered online investment schemes notice", "href": "https://sec.gov.ng/for-investors/keep-track-of-circulars/public-notice-unregistered-online-investment-schemes/"}],
    country: "Nigeria",
    flag: "🇳🇬",
    currency: "NGN",
    localExchange: "Nigerian Exchange (NGX)",
    intro:
      "TradeHQ provides a free paper-trading environment for people in Nigeria who want to build practical understanding of US and global markets without risking money.",
    whyPractice:
      "Paper trading lets users experiment with market mechanics using virtual cash without relying on a particular real-money platform, fee structure or FX-funding route.",
    regulator: {
      name: "Securities and Exchange Commission of Nigeria (SEC Nigeria)",
      url: "https://sec.gov.ng/",
    },
    brokers: ["Capital-market operators in the SEC Nigeria registered-operator database — verify the current status of any provider before relying on it"],
    taxNote:
      "Tax treatment depends on current law and individual circumstances. Check current official Nigerian guidance or a qualified tax professional; TradeHQ does not provide tax advice.",
    studentAngle:
      "Students and beginners can use the simulator and courses to practise market concepts and document simulated decisions without risking money.",
    marketAccess:
      "For real-money market access, check the SEC Nigeria registered-operator database and the provider's current terms. The SEC also warns investors about unregistered online investment platforms, so verify registration rather than relying on marketing claims. TradeHQ itself does not require a brokerage account or payment.",
    startingCapital:
      "TradeHQ does not publish a real-money starting amount because provider minimums, fees, FX terms and personal circumstances vary. Verify current terms directly with a registered provider if you ever consider a real account.",
    localAssets: [
      "The NGX All-Share Index as the domestic benchmark",
      "USD/NGN, which shapes almost every price in the economy",
      "Brent crude, given the weight of oil in national revenue",
      "US large-cap equities, the most common international exposure available locally",
    ],
    practicePlan:
      "Optional study worksheet: model a fictional USD 100 oil receipt at two hypothetical NGN-per-USD rates. Next hold the rate fixed and change the dollar receipt. Compare currency translation with a change in export proceeds. Local inflation, production volumes, fiscal decisions and costs introduce further effects, so the worksheet cannot forecast the naira or a listed company. Keep a virtual stock-order exercise separate from any real account or funding decision.",
    faqs: [
      { q: "Is TradeHQ accessible from Nigeria?", a: "Yes. TradeHQ is a global free website. No signup, no payment, no geo-restriction." },
      { q: "Can I trade NGX-listed stocks here?", a: "Not yet. Current coverage focuses on US and global tickers." },
    ],
  },
];

export function getCountryGuide(slug: string): CountryGuide | undefined {
  return COUNTRY_GUIDES.find((c) => c.slug === slug);
}