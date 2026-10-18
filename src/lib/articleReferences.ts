/** Background references, scoped to the concepts named in their labels. */
const orders = { href: "https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders", label: "SEC Investor.gov — order types and price/execution trade-offs" };
const risk = { href: "https://www.investor.gov/introduction-investing/investing-basics/what-risk", label: "SEC Investor.gov — business, volatility and liquidity risks" };
const indicators = { href: "https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/overview", label: "Fidelity — historical technical-indicator concepts, not evidence of a profitable strategy" };
export const ARTICLE_REFERENCES: Record<string, { href: string; label: string }[]> = {
  "what-is-paper-trading": [orders, risk],
  "how-to-read-stock-charts": [indicators],
  "crypto-vs-stocks": [risk, { href: "https://bitcoin.org/bitcoin.pdf", label: "Bitcoin white paper — protocol design, not a valuation forecast" }],
  "trading-strategies-for-beginners": [orders, { href: "https://www.investor.gov/introduction-investing/investing-basics/glossary/dollar-cost-averaging", label: "SEC Investor.gov — scheduled dollar-cost averaging" }],
  "stock-market-index-etfs": [risk, { href: "https://www.ssga.com/us/en/individual/etfs/spdr-sp-500-etf-trust-spy", label: "State Street — SPY objective, holdings and fund disclosures; consult dated documents" }],
  "how-to-build-a-portfolio": [risk],
  "risk-management-in-trading": [risk, orders],
  "market-orders-vs-limit-orders": [orders],
  "technical-indicators-rsi-macd-moving-averages": [indicators],
};
