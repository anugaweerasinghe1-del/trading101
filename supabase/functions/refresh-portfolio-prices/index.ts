import { priceProviderConfiguration } from "../_shared/priceProviderConfiguration.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.1";
import { refreshHeldQuotes, type HeldAsset } from "../_shared/refreshPrices.ts";
import { fetchStockData, fetchForexData } from "../_shared/marketProviders.ts";
import { cachePrice } from "../_shared/priceCache.ts";
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
Deno.serve(async req => {
  if (req.method !== "POST") return json({ error: "Only POST is supported" }, 405);
  const token = req.headers.get("x-refresh-token");
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return json({ error: "Unauthorized" }, 401);
  // Service-only RPC checks the expiring single-use scheduler token and atomically claims a lease.
  const { data: claim, error } = await admin.rpc("claim_portfolio_price_refresh", { p_token: token });
  if (error) return json({ error: "Refresh service unavailable" }, 503);
  if (!claim) return json({ error: "Unauthorized or refresh already running" }, 401);
  try {
    const quotes = await refreshHeldQuotes(claim.assets as HeldAsset[], {
      fetch, stock: fetchStockData, forex: fetchForexData,
      store: (asset, q) => cachePrice(asset, q.price, q.provenance.provider, q.provenance.observedAt ?? null, q.provenance.status, q),
    });
    // Scheduler-only result; no extra provider request, secret value or user position.
    const result = { ...quotes, providerConfiguration: priceProviderConfiguration(name => Deno.env.get(name)) };
    const { error: finishError } = await admin.rpc("finish_portfolio_price_refresh", { p_lease: claim.lease, p_result: result });
    if (finishError) return json({ error: "Refresh status could not be saved" }, 503);
    console.log("Portfolio quote refresh", result);
    return json(result);
  } catch {
    await admin.rpc("finish_portfolio_price_refresh", { p_lease: claim.lease, p_result: { error: "Refresh failed" } });
    return json({ error: "Refresh failed" }, 503);
  }
});
