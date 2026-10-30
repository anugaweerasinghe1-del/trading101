import { useCallback, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Asset, Portfolio } from "@/lib/types";
import { formatPrice } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { GhostJournalToggle } from "./GhostJournalToggle";
import {
  RevengeTradingBlocker,
  isRevengeTrade,
} from "./RevengeTradingBlocker";

interface MinimalistOrderPanelProps {
  asset: Asset | null;
  availableCash: number;
  portfolio?: Portfolio;
  onTrade: (
    asset: Asset,
    type: "buy" | "sell",
    quantity: number,
    orderType?: "market" | "limit",
    limitPrice?: number,
    rationale?: string,
  ) => void;
}

export function MinimalistOrderPanel({
  asset,
  availableCash,
  portfolio,
  onTrade,
}: MinimalistOrderPanelProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [journalEnabled, setJournalEnabled] = useState(false);
  const [rationale, setRationale] = useState("");
  const [showRevengeBlocker, setShowRevengeBlocker] = useState(false);

  const lastSubmitTime = useRef(0);
  const DEBOUNCE_MS = 1000;

  const price = asset?.price ?? 0;
  const quantity = amount ? parseFloat(amount) : 0;
  const total = quantity * price;
  const fee = total * 0.001;
  const totalWithFee = side === "buy" ? total + fee : total - fee;

  const currentPosition = useMemo(() => {
    if (!asset || !portfolio) return undefined;
    return portfolio.positions.find((position) => position.asset.id === asset.id);
  }, [asset, portfolio]);

  const maxBuyQuantity = price > 0 ? availableCash / (price * 1.001) : 0;
  const maxSellQuantity = currentPosition?.quantity ?? 0;
  const maxActionQuantity = side === "buy" ? maxBuyQuantity : maxSellQuantity;

  const handleQuickAmount = useCallback(
    (percentage: number) => {
      if (maxActionQuantity <= 0) return;
      setAmount((maxActionQuantity * percentage).toFixed(4));
    },
    [maxActionQuantity],
  );

  const executeTrade = useCallback(async () => {
    if (!asset || !quantity || quantity <= 0) return;

    setIsSubmitting(true);
    try {
      await onTrade(
        asset,
        side,
        quantity,
        "market",
        undefined,
        journalEnabled ? rationale : undefined,
      );
      setAmount("");
      setRationale("");
    } finally {
      setTimeout(() => setIsSubmitting(false), 300);
    }
  }, [asset, quantity, onTrade, journalEnabled, rationale, side]);

  const handleSubmit = useCallback(async () => {
    if (!asset || !quantity || quantity <= 0) return;

    const now = Date.now();
    if (now - lastSubmitTime.current < DEBOUNCE_MS) return;
    lastSubmitTime.current = now;

    if (journalEnabled && !rationale.trim()) return;

    const balance = portfolio?.totalValue || availableCash;
    if (isRevengeTrade(total, balance)) {
      setShowRevengeBlocker(true);
      return;
    }

    await executeTrade();
  }, [
    asset,
    quantity,
    journalEnabled,
    rationale,
    portfolio,
    availableCash,
    total,
    executeTrade,
  ]);

  const hasEnoughCash = side === "buy" ? totalWithFee <= availableCash : true;
  const hasEnoughToSell = side === "sell" ? quantity <= maxSellQuantity : true;

  const isValid =
    !!asset &&
    quantity > 0 &&
    hasEnoughCash &&
    hasEnoughToSell &&
    !isSubmitting &&
    (!journalEnabled || rationale.trim().length > 0);

  if (!asset) {
    return (
      <div className="glass-tactile border-chrome rounded-2xl p-6 text-center text-muted-foreground">
        Select an asset to trade
      </div>
    );
  }

  return (
    <>
      <div className="glass-tactile border-chrome rounded-2xl p-5 space-y-5">
        <div className="rounded-xl bg-white/[0.03] p-1.5 flex">
          <button
            type="button"
            onClick={() => setSide("buy")}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all",
              side === "buy"
                ? "bg-profit text-profit-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setSide("sell")}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all",
              side === "sell"
                ? "bg-loss text-loss-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Sell
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Amount</span>
            <span>
              Max: {maxActionQuantity.toFixed(4)} {asset.symbol}
            </span>
          </div>

          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-4">
            <input
              aria-label={`Amount in ${asset.symbol}`}
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0000"
              className="w-full bg-transparent text-lg font-medium tabular-nums outline-none placeholder:text-muted-foreground"
            />
            <span className="ml-3 text-sm font-medium text-muted-foreground">
              {asset.symbol}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => handleQuickAmount(pct / 100)}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium transition-all hover:border-primary/30 hover:bg-white/10"
            >
              {pct}%
            </button>
          ))}
        </div>

        <GhostJournalToggle
          journalEnabled={journalEnabled}
          onToggle={setJournalEnabled}
          rationale={rationale}
          onRationaleChange={setRationale}
        />

        <div className="space-y-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-xs font-medium text-muted-foreground">Virtual execution input · USD per simulator unit</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Price (USD/unit)</span>
            <span className="font-medium tabular-nums">
              ${formatPrice(price, asset.type)}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Chart quotes and generated chart points update separately. No observation timestamp is supplied with this execution input.
            {asset.type === "forex" && " For this simplified FX instrument, the numeric pair rate is treated as a USD cost per virtual unit. No currency conversion, currency delivery or leveraged FX contract is modeled."}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fee (0.1%)</span>
            <span className="font-medium tabular-nums">${fee.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total (USD)</span>
            <span className="font-semibold tabular-nums">
              ${totalWithFee.toFixed(2)}
            </span>
          </div>

          {quantity > 0 ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Est. position value</span>
                <span className="font-medium tabular-nums">
                  ${(quantity * price).toFixed(2)}
                </span>
              </div>

              <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground">
                You are placing a market {side} for {quantity.toFixed(4)}{" "}
                {asset.symbol} at approximately ${formatPrice(price, asset.type)} USD per simulator unit.
              </div>
            </>
          ) : null}
        </div>

        {!hasEnoughCash && side === "buy" ? (
          <p className="text-xs text-loss">
            You do not have enough cash for this order including fees.
          </p>
        ) : null}

        {!hasEnoughToSell && side === "sell" ? (
          <p className="text-xs text-loss">
            You cannot sell more than your current position in this simulator.
          </p>
        ) : null}

        <button
          type="button"
          disabled={!isValid}
          onClick={handleSubmit}
          className={cn(
            "w-full rounded-xl py-3 text-sm font-semibold transition-all",
            isValid
              ? side === "buy"
                ? "bg-profit text-profit-foreground shadow-lg hover:opacity-90"
                : "bg-loss text-loss-foreground shadow-lg hover:opacity-90"
              : "cursor-not-allowed bg-white/5 text-muted-foreground/50",
          )}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              {side === "buy" ? "Buy" : "Sell"} {asset.symbol}
            </>
          )}
        </button>
      </div>

      <RevengeTradingBlocker
        isOpen={showRevengeBlocker}
        onComplete={() => {
          setShowRevengeBlocker(false);
          executeTrade();
        }}
        onCancel={() => setShowRevengeBlocker(false)}
      />
    </>
  );
}
