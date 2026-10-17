import { marketLimit, RateLimitUnavailable } from "../_shared/rateLimitPolicy.ts";
import { allow, clientIp } from "../_shared/rateLimit.ts";
import { coinQuote } from "../_shared/providerQuotes.ts";
import { CRYPTO_ID_MAP, COMMODITY_MAP, fetchCryptoData, fetchCryptoCandles, fetchStockData, fetchForexData, type MarketData, type CandleData, type DataProvenance } from "../_shared/marketProviders.ts";
import { cachePrice, readSharedCryptoQuote } from "../_shared/priceCache.ts";
import { readTraditionalQuote } from "../_shared/traditionalQuoteCache.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateSimulatedData(basePrice: number, type: string): MarketData {
  return {
    price: basePrice,
    change24h: null, changePercent24h: null,
    high24h: null, low24h: null, volume24h: null,
    lastUpdated: null, source: 'simulated',
    provenance: {
      status: 'simulated', provider: 'TradeHQ fixed simulator quote',
      fetchedAt: new Date().toISOString(),
      note: 'No usable provider observation. This is a fixed simulator input, not a live market quote.',
    },
  };
}

function generateSimulatedCandles(basePrice: number, count: number = 60): CandleData[] {
  const candles: CandleData[] = [];
  let price = basePrice * (0.98 + Math.random() * 0.04);
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const open = price;
    const vol = 0.003;
    const change = (Math.random() - 0.48) * basePrice * vol;
    const close = price + change;
    candles.push({
      time: new Date(now - i * 60000).toISOString(),
      open: +open.toFixed(4), high: +Math.max(open, close) * (1 + Math.random() * vol),
      low: +Math.min(open, close) * (1 - Math.random() * vol),
      close: +close.toFixed(4), volume: Math.floor(Math.random() * 100000),
    });
    price = close;
  }
  return candles;
}

const ALLOWED_DATA_TYPES = new Set(['quote', 'candles']);
const ALLOWED_TYPES = new Set(['crypto', 'stock', 'etf', 'forex', 'commodity', 'index']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  const bad = (msg: string, status = 400) =>
    new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...([429,503].includes(status) ? {'Retry-After':'60'} : {}) } });

  if (req.method !== 'GET') return bad('Only GET is supported', 405);
  try {
    const url = new URL(req.url);
    if (url.search.length > 300) return bad('Request too large', 413);

    const assetId = url.searchParams.get('assetId')?.toLowerCase();
    const assetType = url.searchParams.get('type')?.toLowerCase();
    const dataType = url.searchParams.get('dataType') || 'quote';
    const basePriceRaw = parseFloat(url.searchParams.get('basePrice') || '0');
    const basePrice = Number.isFinite(basePriceRaw) && basePriceRaw >= 0 && basePriceRaw < 1e9 ? basePriceRaw : 0;
    const daysRaw = parseInt(url.searchParams.get('days') || '1', 10);
    const days = Number.isFinite(daysRaw) ? Math.min(Math.max(daysRaw, 1), 365) : 1;

    if (!assetId || !/^[a-z0-9-]{1,20}$/.test(assetId)) return bad('Valid assetId is required');
    if (!ALLOWED_DATA_TYPES.has(dataType)) return bad('Unsupported dataType');
    if (assetType && !ALLOWED_TYPES.has(assetType)) return bad('Unsupported type');

    if (!await marketLimit(`ip:${clientIp(req)}`, allow)) return bad('Too many requests — please try again later.', 429);

    console.log(`Fetching ${dataType} for ${assetId} (type: ${assetType}, days: ${days})`);

    let data: MarketData | CandleData[] | null = null;
    let candleProvenance: DataProvenance | null = null;
    let servedSharedQuote = false;

    if (dataType === 'candles') {
      if (assetType === 'crypto' && CRYPTO_ID_MAP[assetId]) {
        data = await fetchCryptoCandles(assetId, days);
        if (Array.isArray(data) && data.length > 0) {
          candleProvenance = {
            status: 'provider',
            provider: 'CoinGecko OHLC',
            fetchedAt: new Date().toISOString(),
            note: 'Historical provider candles; interval depends on provider range rules.',
          };
        }
      }
      if (!data || (Array.isArray(data) && data.length === 0)) {
        data = generateSimulatedCandles(basePrice || 100, Math.min(days * 4, 500));
        candleProvenance = {
          status: 'simulated',
          provider: 'TradeHQ simulation',
          fetchedAt: new Date().toISOString(),
        };
      }
    } else {
      if (assetType === 'crypto') {
        data = await readSharedCryptoQuote(assetId);
        servedSharedQuote = !!data;
        if (!data) data = await fetchCryptoData(assetId);
      } else if (assetType === 'stock' || assetType === 'etf') {
        data = await readTraditionalQuote(assetId, "Polygon") ?? await readTraditionalQuote(assetId, "Alpha Vantage");
        servedSharedQuote = !!data;
        if (!data) data = await fetchStockData(assetId);
      } else if (assetType === 'forex') {
        data = await readTraditionalQuote(assetId, "Alpha Vantage");
        servedSharedQuote = !!data;
        if (!data) data = await fetchForexData(assetId);
      } else if (assetType === 'commodity') {
        if (COMMODITY_MAP[assetId]) {
          const coinId = COMMODITY_MAP[assetId];
          try {
            const response = await fetch(
              `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_last_updated_at=true`,
              { headers: { 'Accept': 'application/json' } }
            );
            if (response.ok) {
              const coinData = await response.json();
              if (coinData[coinId]) {
                data = coinQuote(coinData[coinId], true);
              }
            }
          } catch (e) { console.error('Commodity fetch error:', e); }
        }
      }

      if (!data && basePrice > 0) {
        console.log(`Using simulated data for ${assetId}`);
        data = generateSimulatedData(basePrice, assetType || 'stock');
      }
    }

    if (dataType !== 'candles' && data && !Array.isArray(data) && data.source === 'live' && data.provenance.status !== 'proxy') {
      // A shared-cache read must not advance fetchedAt or add valuation history.
      if (!servedSharedQuote) {
        await cachePrice(assetId, data.price, data.provenance?.provider ?? 'provider', data.provenance.observedAt ?? null, data.provenance.status, data);
      }
    }



    return new Response(
      JSON.stringify({
        success: true,
        data,
        assetId,
        provenance: dataType === 'candles'
          ? candleProvenance
          : (!Array.isArray(data) ? data?.provenance ?? null : null),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    if (error instanceof RateLimitUnavailable) return bad('Market data temporarily unavailable. Please retry later.', 503);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Live market data error:', msg);
    return new Response(
      JSON.stringify({ error: msg, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
