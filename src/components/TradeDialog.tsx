import { useState } from "react";
import { formatPrice } from "@/lib/assets";
import { Asset, JournalEntry } from "@/lib/types";
import { OrderType } from "@/lib/orderTypes";
import { AVAILABLE_EMOTIONS } from "@/lib/tradingJournal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { TrendingUp, TrendingDown, Zap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TradeDialogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTrade: (asset: Asset, type: 'buy' | 'sell', quantity: number, orderType?: OrderType, limitPrice?: number, journal?: JournalEntry) => void;
  availableCash: number;
}

export function TradeDialog({ asset, open, onOpenChange, onTrade, availableCash }: TradeDialogProps) {
  const [quantity, setQuantity] = useState("1");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [journalNotes, setJournalNotes] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [reasoning, setReasoning] = useState("");

  if (!asset) return null;

  const handleTrade = (type: 'buy' | 'sell') => {
    const qty = parseFloat(quantity);
    const price = orderType !== 'market' ? parseFloat(limitPrice) : undefined;
    
    if (qty > 0 && (orderType === 'market' || (price && price > 0))) {
      const journal: JournalEntry | undefined = journalNotes || selectedEmotions.length > 0 || reasoning
        ? {
            notes: journalNotes,
            emotions: selectedEmotions,
            reasoning: reasoning
          }
        : undefined;
      
      onTrade(asset, type, qty, orderType, price, journal);
      setQuantity("1");
      setLimitPrice("");
      setOrderType("market");
      setJournalNotes("");
      setSelectedEmotions([]);
      setReasoning("");
      onOpenChange(false);
    }
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const quickAmount = (amount: number) => {
    const shares = Math.floor(amount / asset.price);
    setQuantity(shares.toString());
  };

  const total = asset.price * parseFloat(quantity || "0");
  const fee = total * 0.001;
  const totalWithFee = total + fee;
  const maxShares = Math.floor(availableCash / asset.price);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Trade {asset.symbol}
          </DialogTitle>
          <DialogDescription>
            Place a {orderType} order for {asset.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{asset.name}</p>
              <p className="text-3xl font-bold">${formatPrice(asset.price, asset.type)}</p>
            </div>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              asset.change >= 0 ? "text-success" : "text-destructive"
            )}>
              {asset.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {asset.change >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Order Type</Label>
              <Select value={orderType} onValueChange={(value) => setOrderType(value as OrderType)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market Order</SelectItem>
                  <SelectItem value="limit">Limit Order</SelectItem>
                  <SelectItem value="stop-loss">Stop Loss</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {orderType === 'market' && "Execute immediately at current price"}
                {orderType === 'limit' && "Execute when price reaches your limit"}
                {orderType === 'stop-loss' && "Sell automatically if price drops to stop level"}
              </p>
            </div>

            {orderType !== 'market' && (
              <div>
                <Label htmlFor="limitPrice">
                  {orderType === 'limit' ? 'Limit Price' : 'Stop Price'}
                </Label>
                <Input
                  id="limitPrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder={`Enter ${orderType === 'limit' ? 'limit' : 'stop'} price`}
                  className="mt-2"
                />
              </div>
            )}

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => setQuantity(maxShares.toString())}
                >
                  Max
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => quickAmount(100)} className="flex-1">
                  <Zap className="w-3 h-3 mr-1" />
                  $100
                </Button>
                <Button size="sm" variant="outline" onClick={() => quickAmount(500)} className="flex-1">
                  <Zap className="w-3 h-3 mr-1" />
                  $500
                </Button>
                <Button size="sm" variant="outline" onClick={() => quickAmount(1000)} className="flex-1">
                  <Zap className="w-3 h-3 mr-1" />
                  $1K
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Max: {maxShares} shares with ${availableCash.toFixed(2)}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-card border border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fee (0.1%)</span>
                <span>${fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span>${totalWithFee.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Trading Journal */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">Trading Journal (Optional)</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>How are you feeling?</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {AVAILABLE_EMOTIONS.map((emotion) => (
                    <Button
                      key={emotion}
                      type="button"
                      size="sm"
                      variant={selectedEmotions.includes(emotion) ? "default" : "outline"}
                      onClick={() => toggleEmotion(emotion)}
                    >
                      {emotion}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="reasoning">Why are you making this trade?</Label>
                <Textarea
                  id="reasoning"
                  placeholder="Technical analysis, news, gut feeling..."
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  className="mt-2"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any other thoughts or observations..."
                  value={journalNotes}
                  onChange={(e) => setJournalNotes(e.target.value)}
                  className="mt-2"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              onClick={() => handleTrade('buy')}
              disabled={
                (orderType === 'market' && totalWithFee > availableCash) ||
                parseFloat(quantity) <= 0 ||
                (orderType !== 'market' && !limitPrice)
              }
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              {orderType === 'market' ? 'Buy Now' : 'Place Order'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleTrade('sell')}
              disabled={parseFloat(quantity) <= 0}
              className="border-destructive/30 hover:bg-destructive/10 text-destructive"
            >
              Sell
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
