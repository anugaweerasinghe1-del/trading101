import { useState, useCallback, useEffect, useRef } from "react";
import { Asset, Portfolio } from "@/lib/types";
import { formatPrice } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { DollarSign, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import {
  Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";
import { GhostJournalToggle } from "./GhostJournalToggle";
import { trackLearningMilestone } from "@/lib/learningTelemetry";
import { RevengeTradingBlocker, isRevengeTrade } from "./RevengeTradingBlocker";

interface MobileOrderDrawerProps {
  asset: Asset | null;
  availableCash: number;
  portfolio?: Portfolio;
  onTrade: (
    asset: Asset,
    type: 'buy' | 'sell',
    quantity: number,
    orderType?: 'market' | 'limit',
    limitPrice?: number,
    rationale?: string
  ) => Promise<boolean | void> | boolean | void;
}

export function MobileOrderDrawer({ asset, availableCash, portfolio, onTrade }: MobileOrderDrawerProps) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState("");
  const [sliderValue, setSliderValue] = useState([0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [journalEnabled, setJournalEnabled] = useState(false);
  const [rationale, setRationale] = useState("");
  const [showRevengeBlocker, setShowRevengeBlocker] = useState(false);
  const [confirmationFailed, setConfirmationFailed] = useState(false);
  const submittingRef = useRef(false);
  useEffect(() => {
    // Never carry a quantity or pending confirmation into a different asset.
    setSide("buy");
    setAmount("");
    setSliderValue([0]);
    setRationale("");
    setIsOpen(false);
    setConfirmationFailed(false);
  }, [asset?.id]);

  const lastSubmitTime = useRef<number>(0);
  const DEBOUNCE_MS = 1000;

  const price = asset?.price ?? 0;
  const quantity = amount ? parseFloat(amount) : 0;
  const total = quantity * price;
  const fee = total * 0.001;
  const totalWithFee = side === 'buy' ? total + fee : total - fee;
  const maxBuyQuantity = price > 0 ? availableCash / (price * 1.001) : 0;
  const maxBuyAmount = Math.floor(maxBuyQuantity * 10000) / 10000;
  const maxSellAmount = portfolio?.positions.find((p) => p.asset.id === asset?.id)?.quantity ?? 0;

  const handleSliderChange = useCallback((value: number[]) => {
    setSliderValue(value);
    const percentage = value[0] / 100;
    setAmount(side === 'sell'
      ? String(maxSellAmount * percentage)
      : (maxBuyAmount * percentage).toFixed(4));
  }, [side, maxBuyAmount, maxSellAmount]);

  const handleQuickAmount = useCallback((percentage: number) => {
    handleSliderChange([percentage * 100]);
  }, [handleSliderChange]);

  const executeTrade = useCallback(async () => {
    if (!asset || !Number.isFinite(quantity) || quantity <= 0 || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setConfirmationFailed(false);
    try {
      // A rejected order must leave the drawer open and preserve the user's
      // quantity and journal entry so they can review or correct the input.
      const confirmed = await onTrade(asset, side, quantity, 'market', undefined, journalEnabled ? rationale : undefined);
      if (confirmed === false) {
        setConfirmationFailed(true);
        return;
      }
      setAmount("");
      setSliderValue([0]);
      setRationale("");
      setIsOpen(false);
    } catch {
      setConfirmationFailed(true);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [asset, side, quantity, onTrade, journalEnabled, rationale]);

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
  }, [asset, quantity, journalEnabled, rationale, portfolio, availableCash, total, executeTrade]);

  if (!asset) return null;

  const isValid = quantity > 0
    && (side === 'buy' ? totalWithFee <= availableCash : quantity <= maxSellAmount)
    && !isSubmitting
    && (!journalEnabled || rationale.trim().length > 0);

  return (
    <>
      <Drawer autoFocus open={isOpen} onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen);
        if (nextOpen) {
          setConfirmationFailed(false);
          trackLearningMilestone("Mobile Order Panel Opened");
        }
      }}>
        <DrawerTrigger asChild>
          <Button aria-label={`Practice ${asset.symbol} (virtual): open order panel`} className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
            <span>Practice ${asset.symbol} (virtual)</span>
            <ChevronUp className="w-5 h-5 ml-2" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="flex items-center justify-between pb-2">
            <DrawerTitle className="text-left">
              <span className="text-xl">{asset.symbol}</span>{" "}
              <span className="text-sm text-muted-foreground ml-2">${formatPrice(asset.price, asset.type)} USD/unit</span>
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" aria-label="Close order panel">
                <ChevronDown aria-hidden="true" className="w-5 h-5" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <DrawerDescription className="px-4 pb-2 text-xs text-muted-foreground">
            Virtual execution input in USD per simulator unit. Chart inputs update separately; this execution input has no observation timestamp.
            {asset.type === "forex" && " The numeric pair rate is used as a USD cost per virtual unit; no currency conversion, delivery or leveraged FX contract is modeled."}
          </DrawerDescription>
          <div className="px-4 pb-6 space-y-4 overflow-auto">
            <div className="grid grid-cols-2 gap-2">
              <Button
                className={cn("h-14 text-lg font-semibold rounded-xl transition-all", side === 'buy' ? "bg-profit text-profit-foreground hover:bg-profit/90" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                onClick={() => setSide('buy')}
                aria-pressed={side === 'buy'}
              >Buy</Button>
              <Button
                className={cn("h-14 text-lg font-semibold rounded-xl transition-all", side === 'sell' ? "bg-loss text-loss-foreground hover:bg-loss/90" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                onClick={() => setSide('sell')}
                aria-pressed={side === 'sell'}
              >Sell</Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Market practice order. The shown price is an estimate. For signed-in orders, the price may change or the order may pause if the quote is unavailable.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Amount ({asset.symbol})</Label>
                <span className="text-sm text-muted-foreground">
                  {side === 'sell'
                    ? `Holdings: ${maxSellAmount} ${asset.symbol}`
                    : `Available: $${availableCash.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
                </span>
              </div>
              <Input aria-label={`Amount in ${asset.symbol}`} type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-14 text-lg bg-muted/50 border-0 tabular-nums rounded-xl" />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((pct) => (
                <Button key={pct} variant="outline" className="h-12 text-base rounded-xl border-border/50" onClick={() => handleQuickAmount(pct / 100)}>{pct}%</Button>
              ))}
            </div>

            <div className="py-3">
              <Slider
                aria-label={side === 'buy' ? "Order size as a percentage of available cash" : "Order size as a percentage of holdings"}
                value={sliderValue}
                onValueChange={handleSliderChange}
                max={100}
                step={1}
                className={cn("[&_[role=slider]]:h-6 [&_[role=slider]]:w-6", side === 'buy' ? "[&_.bg-primary]:bg-profit" : "[&_.bg-primary]:bg-loss")}
              />
            </div>

            <GhostJournalToggle journalEnabled={journalEnabled} onToggle={setJournalEnabled} rationale={rationale} onRationaleChange={setRationale} />

            <div className="space-y-2 py-3 border-t border-border/30">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Total (USD)</span>
                <span className="tabular-nums font-semibold">${totalWithFee.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className={cn("w-full h-14 text-lg font-semibold rounded-xl transition-all", side === 'buy' ? "bg-profit text-profit-foreground hover:bg-profit/90" : "bg-loss text-loss-foreground hover:bg-loss/90")}
              disabled={!isValid}
              onClick={handleSubmit}
            >
              {isSubmitting ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing...</>) : (<>{side === 'buy' ? 'Buy' : 'Sell'} {asset.symbol}</>)}
            </Button>
            {confirmationFailed && (
              <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground">
                This virtual order was not confirmed in this view. Your inputs are preserved. Check your portfolio before trying again, especially after a connection error.
              </p>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <RevengeTradingBlocker
        isOpen={showRevengeBlocker}
        onComplete={() => { setShowRevengeBlocker(false); executeTrade(); }}
        onCancel={() => setShowRevengeBlocker(false)}
      />
    </>
  );
}
