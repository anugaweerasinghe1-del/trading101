import { configuredAlphaVantageKey } from "./marketProviders.ts";

/** Non-secret configuration snapshot, not proof of key validity, quota or entitlement.
 * Unknown metadata must not fail a successful quote refresh or imply missing keys. */
export function priceProviderConfiguration(readEnv: (name: string) => string | undefined) {
  const configured = (name: string, normalize: (value: string | undefined) => string | null | undefined): boolean | null => {
    try { return Boolean(normalize(readEnv(name))); }
    catch { return null; }
  };
  return {
    polygon: configured('POLYGON_API_KEY', value => value?.trim()),
    alphaVantage: configured('ALPHA_VANTAGE_API_KEY', configuredAlphaVantageKey),
  };
}

