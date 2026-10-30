import { quoteDisplay } from "@/lib/quoteDisplay";
import { useState, useMemo } from "react";
import { Asset } from "@/lib/types";
import { formatPrice } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Star, 
  TrendingUp, 
  TrendingDown,
  ArrowUpDown,
  Sparkles
} from "lucide-react";
import { LineChart, Line } from "recharts";

interface AssetTableProps {
  assets: Asset[];
  favorites: string[];
  selectedAsset: Asset | null;
  onSelectAsset: (asset: Asset) => void;
  onToggleFavorite: (assetId: string) => void;
}

type AssetCategory = 'all' | 'crypto' | 'stocks' | 'etf' | 'forex' | 'commodity' | 'favorites';
type SortField = 'symbol' | 'price' | 'changePercent' | 'volume';
type SortDirection = 'asc' | 'desc';

// Generate mini sparkline data
function generateSparklineData(basePrice: number, isUp: boolean): { value: number }[] {
  const points = 20;
  const data = [];
  let price = basePrice * (isUp ? 0.97 : 1.03);
  
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - (isUp ? 0.4 : 0.6)) * 0.02;
    price = price * (1 + change);
    data.push({ value: price });
  }
  
  // Ensure last point matches trend
  data[points - 1].value = basePrice;
  
  return data;
}

function MiniSparkline({ data, isUp }: { data: { value: number }[]; isUp: boolean }) {
  return (
    <LineChart width={80} height={28} data={data}>
      <Line 
        type="monotone" 
        dataKey="value" 
        stroke={isUp ? 'hsl(var(--profit))' : 'hsl(var(--loss))'} 
        strokeWidth={1.5}
        dot={false}
      />
    </LineChart>
  );
}

export function AssetTable({ 
  assets, 
  favorites, 
  selectedAsset, 
  onSelectAsset, 
  onToggleFavorite 
}: AssetTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<AssetCategory>('all');
  const [sortField, setSortField] = useState<SortField>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filteredAssets = useMemo(() => {
    let filtered = assets;

    // Filter by category
    if (category === 'favorites') {
      filtered = filtered.filter(a => favorites.includes(a.id));
    } else if (category === 'stocks') {
      filtered = filtered.filter(a => a.type === 'stock');
    } else if (category !== 'all') {
      filtered = filtered.filter(a => a.type === category);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.symbol.toLowerCase().includes(query) ||
        a.name.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'changePercent':
          comparison = a.changePercent - b.changePercent;
          break;
        case 'volume':
          comparison = Math.random() - 0.5; // Simulated volume
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [assets, category, searchQuery, sortField, sortDirection, favorites]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filters */}
      <div className="p-3 border-b border-border space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-secondary border-0 focus-visible:ring-1"
          />
        </div>

        <Tabs value={category} onValueChange={(v) => setCategory(v as AssetCategory)}>
          <TabsList className="grid w-full grid-cols-7 h-8">
            <TabsTrigger value="all" className="text-xs px-2">All</TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs px-2">
              <Star className="w-3 h-3" />
            </TabsTrigger>
            <TabsTrigger value="crypto" className="text-xs px-2">Crypto</TabsTrigger>
            <TabsTrigger value="stocks" className="text-xs px-2">Stocks</TabsTrigger>
            <TabsTrigger value="etf" className="text-xs px-2">ETFs</TabsTrigger>
            <TabsTrigger value="forex" className="text-xs px-2">Forex</TabsTrigger>
            <TabsTrigger value="commodity" className="text-xs px-2">Comm.</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="w-8"></TableHead>
              <TableHead className="w-24">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 -ml-2 text-xs font-medium"
                  onClick={() => handleSort('symbol')}
                >
                  Pair
                  <ArrowUpDown className="w-3 h-3 ml-1" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs font-medium"
                  onClick={() => handleSort('price')}
                >
                  Price
                  <ArrowUpDown className="w-3 h-3 ml-1" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs font-medium"
                  onClick={() => handleSort('changePercent')}
                >
                  24h %
                  <ArrowUpDown className="w-3 h-3 ml-1" />
                </Button>
              </TableHead>
              <TableHead className="w-20 text-right">Chart</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.map((asset) => {
              const isUp = asset.changePercent >= 0;
              const isFavorite = favorites.includes(asset.id);
              const isSelected = selectedAsset?.id === asset.id;
              const sparklineData = generateSparklineData(asset.price, isUp);

              return (
                <TableRow 
                  key={asset.id}
                  className={cn(
                    "cursor-pointer transition-colors border-border",
                    isSelected ? "bg-primary/10" : "hover:bg-accent/50"
                  )}
                  onClick={() => onSelectAsset(asset)}
                >
                  <TableCell className="w-8 p-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(asset.id);
                      }}
                    >
                      <Star className={cn(
                        "w-3 h-3 transition-colors",
                        isFavorite ? "fill-warning text-warning" : "text-muted-foreground"
                      )} />
                    </Button>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-sm">{asset.symbol}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                          {asset.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <p className="font-medium tabular-nums text-sm">
                      {quoteDisplay(asset, formatPrice(asset.price, asset.type))}
                    </p>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <div className={cn(
                      "inline-flex items-center gap-1 text-sm font-medium tabular-nums",
                      isUp ? "text-profit" : "text-loss"
                    )}>
                      {isUp ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {isUp ? '+' : ''}{asset.changePercent.toFixed(2)}%
                    </div>
                  </TableCell>
                  <TableCell className="w-20 py-2">
                    <MiniSparkline data={sparklineData} isUp={isUp} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredAssets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Sparkles className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No assets found</p>
          </div>
        )}
      </div>
    </div>
  );
}
