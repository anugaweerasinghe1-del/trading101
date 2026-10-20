import { useState } from "react";
import { formatPrice } from "@/lib/assets";
import { Trade } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TradeHistoryProps {
  trades: Trade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "buy" | "sell">("all");

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || trade.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const sortedTrades = [...filteredTrades].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const totalBuys = trades.filter(t => t.type === 'buy').length;
  const totalSells = trades.filter(t => t.type === 'sell').length;
  const totalVolume = trades.reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Trade History</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4 text-success" />
              {totalBuys} Buys
            </span>
            <span className="flex items-center gap-1">
              <ArrowDownLeft className="w-4 h-4 text-destructive" />
              {totalSells} Sells
            </span>
            <span>Total Volume: ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            aria-label="Filter trade history by symbol"
            placeholder="Search by symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="buy">Buys</TabsTrigger>
            <TabsTrigger value="sell">Sells</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {sortedTrades.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl text-muted-foreground">
            {searchQuery ? "No trades found matching your search" : "No trades yet"}
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Date & Time</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTrades.map((trade) => (
                <TableRow key={trade.id} className="group">
                  <TableCell>
                    <Badge
                      variant={trade.type === 'buy' ? 'default' : 'outline'}
                      className={cn(
                        "font-semibold flex items-center gap-1 w-fit",
                        trade.type === 'buy' 
                          ? "bg-success/10 text-success hover:bg-success/20 border-success/20" 
                          : "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"
                      )}
                    >
                      {trade.type === 'buy' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownLeft className="w-3 h-3" />
                      )}
                      {trade.type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-base">{trade.symbol}</span>
                      {trade.journal && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          📝 Has notes
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono">{trade.quantity.toFixed(4)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono">${formatPrice(trade.price, "stock")}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        "font-mono font-semibold",
                        trade.type === 'buy' ? "text-destructive" : "text-success"
                      )}>
                        {trade.type === 'buy' ? '-' : '+'}${trade.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-medium">
                        {format(new Date(trade.timestamp), 'MMM d, yyyy')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(trade.timestamp), 'h:mm a')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-success/5 text-success border-success/20">
                      ✓ Filled
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {sortedTrades.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {sortedTrades.length} of {trades.length} trades
        </div>
      )}
    </div>
  );
}
