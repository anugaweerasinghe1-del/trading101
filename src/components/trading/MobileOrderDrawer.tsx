import { useState, useCallback, useRef } from "react";
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
  Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";
import { GhostJournalToggle } from "./GhostJournalToggle";
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
  ) => void;
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
    const maxAmount = side === 'buy' ? maxBuyAmount : maxSellAmount;
    setAmount((maxAmount * percentage).toFixed(4));
  }, [side, maxBuyAmount, maxSellAmount]);

  const handleQuickAmount = useCallback((percentage: number) => {
    const maxAmount = side === 'buy' ? maxBuyAmount : maxSellAmount;
    setAmount((maxAmount * percentage).toFixed(4));
    setSliderValue([percentage * 100]);
  }, [side, maxBuyAmount, maxSellAmount]);

  const executeTrade = useCallback(async () => {
    if (!asset || !quantity || quantity <= 0) return;
    setIsSubmitting(true);
    try {
      await onTrade(asset, side, quantity, 'market', undefined, journalEnabled ? rationale : undefined);
      setAmount("");
      setSliderValue([0]);
      setRationale("");
      setIsOpen(false);
    } finally {
      setTimeout(() => setIsSubmitting(false), 300);
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
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
            <span>Trade {asset.symbol}</span>
            <ChevronUp className="w-5 h-5 ml-2" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center justify-between">
              <div>
                <span className="text-xl">{asset.symbol}</span>
                <span className="text-sm text-muted-foreground ml-2">${formatPrice(asset.price, asset.type)}</span>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon"><ChevronDown className="w-5 h-5" /></Button>
              </DrawerClose>
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4 overflow-auto">
            <div className="grid grid-cols-2 gap-2">
              <Button
                className={cn("h-14 text-lg font-semibold rounded-xl transition-all", side === 'buy' ? "bg-profit text-profit-foreground hover:bg-profit/90" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                onClick={() => setSide('buy')}
              >Buy</Button>
              <Button
                className={cn("h-14 text-lg font-semibold rounded-xl transition-all", side === 'sell' ? "bg-loss text-loss-foreground hover:bg-loss/90" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                onClick={() => setSide('sell')}
              >Sell</Button>
            </div>

            <p className="text-sm text-muted-foreground">Market order — fills immediately at the shown simulator price.</p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Amount ({asset.symbol})</Label>
                <span className="text-sm text-muted-foreground">Available: ${availableCash.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
              </div>
              <Input aria-label={`Amount in ${asset.symbol}`} type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-14 text-lg bg-muted/50 border-0 tabular-nums rounded-xl" />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((pct) => (
                <Button key={pct} variant="outline" className="h-12 text-base rounded-xl border-border/50" onClick={() => handleQuickAmount(pct / 100)}>{pct}%</Button>
              ))}
            </div>

            <div className="py-3">
              <Slider value={sliderValue} onValueChange={handleSliderChange} max={100} step={1} className={cn("[&_[role=slider]]:h-6 [&_[role=slider]]:w-6", side === 'buy' ? "[&_.bg-primary]:bg-profit" : "[&_.bg-primary]:bg-loss")} />
            </div>

            <GhostJournalToggle journalEnabled={journalEnabled} onToggle={setJournalEnabled} rationale={rationale} onRationaleChange={setRationale} />

            <div className="space-y-2 py-3 border-t border-border/30">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Total</span>
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
