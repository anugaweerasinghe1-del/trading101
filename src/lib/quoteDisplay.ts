import type { Asset } from "./types";

/** Display units only. Never convert a quote or change virtual order accounting. */
export function quoteUnits(asset: Asset): string {
  if (asset.type === "forex" && /^[A-Z]{3}\/[A-Z]{3}$/.test(asset.symbol)) {
    const [base, quote] = asset.symbol.split("/");
    return `${quote} per ${base}`;
  }
  return "USD per unit";
}

export function quoteDisplay(asset: Asset, formattedNumber: string): string {
  return asset.type === "forex" && /^[A-Z]{3}\/[A-Z]{3}$/.test(asset.symbol)
    ? `${formattedNumber} ${asset.symbol.split("/")[1]}`
    : `$${formattedNumber}`;
}
