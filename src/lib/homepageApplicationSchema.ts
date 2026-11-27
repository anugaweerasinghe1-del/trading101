/** One product entity for both the static and interactive homepage. */
const homepageApplication = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TradeHQ",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: "Free paper trading simulator with $100,000 virtual cash for stocks, crypto, ETFs, forex and commodities.",
  featureList: [
    "$100,000 virtual trading capital",
    "170 simulated practice assets (stocks, crypto, ETFs, forex, commodities)",
    "Rule-based educational mentor",
    "Portfolio performance tracking",
    "Leaderboard competition",
    "Technical analysis indicators",
    "market education hub",
  ],
  url: "https://www.thetradehq.com/",
  author: { "@type": "Person", name: "Anuga Weerasinghe", url: "https://www.thetradehq.com/about" },
  publisher: { "@type": "Organization", name: "TradeHQ", url: "https://www.thetradehq.com/" },
};

export const homepageApplicationJsonLd = JSON.stringify(homepageApplication).replace(/</g, "\\u003c");
