import { CRYPTO_ID_MAP, fetchStockData, fetchForexData, type MarketData } from "./marketProviders.ts";
import { coinQuote } from "./providerQuotes.ts";
export interface HeldAsset { assetId: string; type: string }
interface Dependencies {
  fetch: typeof fetch; stock: typeof fetchStockData; forex: typeof fetchForexData;
  store: (asset: string, quote: MarketData) => Promise<boolean>;
}
/** One crypto batch and at most two traditional instruments per scheduled lease. */
export async function refreshHeldQuotes(assets: HeldAsset[], deps: Dependencies) {
  const unique = [...new Map(assets.map(a => [a.assetId, a])).values()];
  let updated = 0, unavailable = 0;
  const save = async (asset: string, quote: MarketData | null) => {
    const observedAt = quote?.provenance.observedAt ? Date.parse(quote.provenance.observedAt) : NaN;
    const now = Date.now();
    // Upstream HTTP success does not establish quote freshness. In particular,
    // legacy CoinGecko assets can return years-old observations indefinitely.
    const fresh = Number.isFinite(observedAt) && observedAt <= now + 60_000
      && now - observedAt <= (quote?.provenance.status === "previous_close" ? 7 * 86400_000 : 15 * 60_000);
    if (!quote || quote.source !== "live" || !fresh
      || quote.provenance.status === "proxy" || quote.provenance.status === "simulated") {
      unavailable++; return;
    }
    if (await deps.store(asset, quote)) updated++; else unavailable++;
  };
  const crypto = unique.filter(a => a.type === "crypto");
  const mapped = crypto.filter(a => CRYPTO_ID_MAP[a.assetId]);
  unavailable += crypto.length - mapped.length;
  if (mapped.length) {
    // Separate the upstream batch failure from per-asset decoding and cache
    // writes. A single bad response entry or failed store must not prevent
    // independent fresh quotes from reaching other accounts' portfolios.
    let body: Record<string, unknown> | null = null;
    try {
      const ids = mapped.map(a => CRYPTO_ID_MAP[a.assetId]).join(",");
      const response = await deps.fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_last_updated_at=true&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
        { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
      if (response.ok) {
        const decoded: unknown = await response.json();
        if (decoded && typeof decoded === "object" && !Array.isArray(decoded))
          body = decoded as Record<string, unknown>;
      } else {
        void response.body?.cancel().catch(() => {});
      }
    } catch {
      // No trusted quotes arrived; do not substitute simulated prices.
    }
    if (!body) unavailable += mapped.length;
    else for (const asset of mapped) {
      try {
        const raw = body[CRYPTO_ID_MAP[asset.assetId]];
        const quote = raw && typeof raw === "object" && !Array.isArray(raw)
          ? coinQuote(raw as Record<string, unknown>) : null;
        await save(asset.assetId, quote);
      } catch {
        // Preserve the already-saved quotes and continue with the next asset.
        unavailable++;
      }
    }
  }
  for (const asset of unique.filter(a => a.type !== "crypto").slice(0, 2)) {
    try {
      const quote = asset.type === "stock" || asset.type === "etf" ? await deps.stock(asset.assetId)
        : asset.type === "forex" ? await deps.forex(asset.assetId) : null;
      await save(asset.assetId, quote);
    } catch { unavailable++; }
  }
  return { requested: unique.length, updated, unavailable };
}
