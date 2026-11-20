import type { Asset } from "./types";

/** UI-only identity clarifications. Never mutate portfolio keys or provider symbols. */
export function assetPickerLabel(asset: Pick<Asset, "id" | "symbol" | "name">): string {
  if (asset.id === "sq" && asset.symbol === "SQ") {
    return `${asset.name} · legacy SQ (current ticker XYZ)`;
  }
  if (asset.id === "matic" && asset.symbol === "MATIC") {
    return `${asset.name} · legacy MATIC (current Polygon token POL)`;
  }
  return asset.name;
}

export type PickerQuoteOrigin = "fixed" | "saved" | "provider" | "simulated";

/** Classify the displayed *price*, not a potentially different change interval. */
export function pickerQuoteOriginLabel(origin: PickerQuoteOrigin): string {
  switch (origin) {
    case "saved": return "Saved quote";
    case "provider": return "Provider snapshot";
    case "simulated": return "Simulated quote";
    default: return "Fixed practice";
  }
}
