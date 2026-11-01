import { Link } from "react-router-dom";
import { Position } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuoteCoverage } from "@/lib/quoteCoverage";

interface PositionsTableProps {
  positions: Position[];
  quoteCoverage?: Record<string, QuoteCoverage>;
}

function formatMoney(value: number) {
  if (Math.abs(value) < 1) return `$${value.toFixed(4)}`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function PnlBar({ percent }: { percent: number }) {
  const capped = Math.min(Math.abs(percent), 50);
  const width = Math.max(capped * 2, 4);

  return (
    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          percent >= 0 ? "bg-profit" : "bg-loss",
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <Badge
      variant="outline"
      className="border-white/10 bg-white/5 text-[10px] uppercase tracking-wide text-muted-foreground"
    >
      {type}
    </Badge>
  );
}

function QuoteBadge({ quote }: { quote?: QuoteCoverage }) {
  if (!quote) return <span className="text-xs text-muted-foreground">Checking quote source…</span>;
  const labels: Record<QuoteCoverage["status"], string> = {
    provider: "Provider snapshot", previous_close: "Previous close", delayed: "Delayed quote",
    stale: "Stale quote", simulator: "Simulator-only",
  };
  return (
    <span className={cn("block text-[11px] leading-tight", quote.status === "simulator" || quote.status === "stale" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}
      title={quote.note + (quote.fetchedAt ? " · Fetched " + new Date(quote.fetchedAt).toLocaleString() : "")}
      aria-label={"Quote status: " + quote.note}>
      {labels[quote.status]}
    </span>
  );
}

function DesktopRow({ position, quote }: { position: Position; quote?: QuoteCoverage }) {
  const isUp = position.profitLoss >= 0;

  return (
    <tr
      className={cn(
        "border-b border-border/30 transition-colors hover:bg-muted/30",
        isUp ? "hover:bg-profit/[0.03]" : "hover:bg-loss/[0.03]",
      )}
    >
      <td className="px-4 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{position.asset.symbol}</span>
            <TypeBadge type={position.asset.type} />
          </div>
          <span className="text-sm text-muted-foreground">
            {position.asset.name}
          </span>
          <QuoteBadge quote={quote} />
        </div>
      </td>
      <td className="px-4 py-4 tabular-nums">{formatMoney(position.avgPrice)}</td>
      <td className="px-4 py-4 tabular-nums">{formatMoney(position.asset.price)}</td>
      <td className="px-4 py-4 tabular-nums">{position.quantity.toFixed(4)}</td>
      <td className="px-4 py-4 tabular-nums text-muted-foreground">
        {formatMoney(position.avgPrice * position.quantity)}
      </td>
      <td className="px-4 py-4 tabular-nums">{formatMoney(position.currentValue)}</td>
      <td
        className={cn(
          "px-4 py-4 tabular-nums font-medium",
          isUp ? "text-profit" : "text-loss",
        )}
      >
        {isUp ? "+" : ""}
        {formatMoney(position.profitLoss).replace("$", "$")}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-3">
          <span
            className={cn(
              "tabular-nums text-sm font-medium",
              isUp ? "text-profit" : "text-loss",
            )}
          >
            {isUp ? "+" : ""}
            {position.profitLossPercent.toFixed(2)}%
          </span>
          <PnlBar percent={position.profitLossPercent} />
        </div>
      </td>
    </tr>
  );
}

function MobileCard({ position, quote }: { position: Position; quote?: QuoteCoverage }) {
  const isUp = position.profitLoss >= 0;

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{position.asset.symbol}</h3>
            <TypeBadge type={position.asset.type} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {position.asset.name}
          </p>
        </div>

        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            isUp
              ? "bg-profit/10 text-profit"
              : "bg-loss/10 text-loss",
          )}
        >
          {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {isUp ? "+" : ""}
          {position.profitLossPercent.toFixed(2)}%
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Entry</p>
          <p className="mt-1 font-medium tabular-nums">{formatMoney(position.avgPrice)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Current</p>
          <p className="mt-1 font-medium tabular-nums">{formatMoney(position.asset.price)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Qty</p>
          <p className="mt-1 font-medium tabular-nums">{position.quantity.toFixed(4)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Value</p>
          <p className="mt-1 font-medium tabular-nums">{formatMoney(position.currentValue)}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">P&amp;L</p>
          <p
            className={cn(
              "mt-1 font-semibold tabular-nums",
              isUp ? "text-profit" : "text-loss",
            )}
          >
            {isUp ? "+" : ""}
            {formatMoney(position.profitLoss).replace("$", "$")}
          </p>
        </div>
        <PnlBar percent={position.profitLossPercent} />
      </div>
    </div>
  );
}

export function PositionsTable({ positions, quoteCoverage }: PositionsTableProps) {
  if (positions.length === 0) {
    return (
      <div className="glass-tactile border-chrome rounded-2xl p-8 text-center">
        <h3 className="text-xl font-semibold">No positions yet</h3>
        <p className="mt-2 text-muted-foreground">
          Start trading to build your portfolio and track performance.
        </p>
        <Link
          to="/trade"
          className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Start Trading →
        </Link>
      </div>
    );
  }

  const sorted = [...positions].sort(
    (a, b) => b.profitLossPercent - a.profitLossPercent,
  );

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-white/8 md:block">
        <table className="w-full">
          <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Entry</th>
              <th className="px-4 py-3">Current</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Cost Basis</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">P&amp;L</th>
              <th className="px-4 py-3 text-right">Return</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((position) => (
              <DesktopRow
                key={`${position.asset.id}-${position.quantity}-${position.avgPrice}`}
                position={position}
                quote={quoteCoverage?.[position.asset.id]}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {sorted.map((position) => (
          <MobileCard
            key={`${position.asset.id}-${position.quantity}-${position.avgPrice}`}
            position={position}
            quote={quoteCoverage?.[position.asset.id]}
          />
        ))}
      </div>
    </>
  );
}
