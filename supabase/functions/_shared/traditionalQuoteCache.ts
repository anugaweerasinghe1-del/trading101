import { createClient } from "npm:@supabase/supabase-js@2.75.1";
import type { MarketData } from "./marketTypes.ts";
import { sharedQuote } from "./sharedQuote.ts";

/** Reuse only fresh, real provider observations; never reuse simulator prices. */
export async function readTraditionalQuote(assetId: string, provider: "Polygon" | "Alpha Vantage"): Promise<MarketData | null> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return null;
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await db.from("market_prices")
      .select("price,source,updated_at,observed_at,quote_status,quote_data")
      .eq("asset_id", assetId).maybeSingle();
    if (error || !data || data.source !== provider) return null;
    return sharedQuote(data);
  } catch {
    return null;
  }
}
