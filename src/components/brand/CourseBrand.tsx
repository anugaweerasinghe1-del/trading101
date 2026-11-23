import { BrandMark } from "./BrandMark";

/** Exact existing site symbol and verified display name; not embedded AI text. */
export function CourseBrand() {
  return (
    <span className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-black/80 px-2 py-1 text-sm font-semibold text-white" aria-hidden="true">
      <BrandMark size="sm" />
      <span>TradeHQ</span>
    </span>
  );
}
