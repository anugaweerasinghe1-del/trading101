import { useState, useEffect, useMemo, useRef } from "react";
import { formatPrice } from "@/lib/assets";
import { Asset } from "@/lib/types";
import { useLiveMarketData, useLiveCandleData, CandleData } from "@/hooks/useLiveMarketData";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

interface MinimalistAreaChartProps {
  asset: Asset;
}

interface ChartDataPoint {
  time: string;
  price: number;
  timestamp: number;
}

// Convert candle data to chart points
function candlesToChartData(candles: CandleData[]): ChartDataPoint[] {
  return candles.map(candle => ({
    time: new Date(candle.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: candle.close,
    timestamp: new Date(candle.time).getTime(),
  }));
}

// Generate fallback simulated data
function generateChartData(basePrice: number, count: number = 50): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let price = basePrice * (0.95 + Math.random() * 0.1);
  const now = Date.now();

  for (let i = count; i >= 0; i--) {
    const change = (Math.random() - 0.48) * (basePrice * 0.008);
    price = Math.max(price + change, basePrice * 0.8);
    
    const timestamp = now - i * 60000;
    const date = new Date(timestamp);
    
    data.push({
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price, // Preserve small positive chart values; rounding belongs at display time.
      timestamp,
    });
  }
  return data;
}

export function MinimalistAreaChart({ asset }: MinimalistAreaChartProps) {
  const [timeframe, setTimeframe] = useState<'1H' | '4H' | '1D' | '1W'>('1H');
  const [fallbackData, setFallbackData] = useState<ChartDataPoint[]>([]);
  const simulationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Safe price - ensure we have a valid number
  const safePrice = typeof asset?.price === 'number' && !isNaN(asset.price) && asset.price > 0 
    ? asset.price 
    : 100;
  
  // Live market data hooks
  const { liveData, isLive, refetch: refetchQuote } = useLiveMarketData(asset, {
    refreshInterval: 30000, // 30 seconds
    enabled: !!asset,
  });
  
  const { candles, isLoading: candlesLoading, provenance: candleProvenance, refetch: refetchCandles } = useLiveCandleData(asset, {
    refreshInterval: 60000, // 1 minute for candle updates
    enabled: !!asset,
  });

  // Generate initial fallback data
  useEffect(() => {
    if (asset?.id) {
      setFallbackData(generateChartData(safePrice));
    }
  }, [asset?.id, safePrice]);

  // Synthetic chart updates when provider candles are unavailable
  useEffect(() => {
    if (candles.length === 0 && asset) {
      simulationInterval.current = setInterval(() => {
        setFallbackData(prev => {
          const newData = [...prev.slice(1)];
          const lastPrice = newData[newData.length - 1]?.price || safePrice;
          const change = (Math.random() - 0.48) * (safePrice * 0.005);
          const newPrice = Math.max(lastPrice + change, safePrice * 0.8);
          const now = Date.now();
          
          newData.push({
            time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            price: newPrice, // Keep tiny positive chart values through subsequent updates, too.
            timestamp: now,
          });
          return newData;
        });
      }, 3000);

      return () => {
        if (simulationInterval.current) {
          clearInterval(simulationInterval.current);
        }
      };
    } else {
      // Clear simulation when live data available
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }
    }
  }, [candles.length, safePrice, asset]);

  // Use live candles if available, otherwise fallback
  const chartData = useMemo(() => {
    if (candles.length > 0) {
      return candlesToChartData(candles);
    }
    return fallbackData;
  }, [candles, fallbackData]);

  // Select a display window from the returned history; never invent missing history
  // or alter the quote used by the order panel. Anchor delayed data at its latest point.
  const visibleChartData = useMemo(() => {
    const hours = { '1H': 1, '4H': 4, '1D': 24, '1W': 168 }[timeframe];
    const latest = Math.max(...chartData.map(point => point.timestamp));
    return chartData.filter(point => point.timestamp >= latest - hours * 3600000).map(point => ({
      ...point,
      time: timeframe === '1W'
        ? new Date(point.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : point.time,
    }));
  }, [chartData, timeframe]);

  // Calculate price metrics
  const { minPrice, maxPrice, priceChange, priceChangePercent, isPositive, currentPrice } = useMemo(() => {
    const prices = visibleChartData.map(d => d.price).filter(p => typeof p === 'number' && !isNaN(p));
    const min = prices.length > 0 ? Math.min(...prices) : safePrice * 0.95;
    const max = prices.length > 0 ? Math.max(...prices) : safePrice * 1.05;
    const first = chartData[0]?.price || safePrice;
    const last = chartData[chartData.length - 1]?.price || safePrice;
    
    // Use live data if available, otherwise calculate from chart
    const livePrice = (liveData?.price && typeof liveData.price === 'number') ? liveData.price : last;
    const change = liveData?.change24h ?? (last - first);
    const changePercent = liveData?.changePercent24h ?? (first > 0 ? (change / first) * 100 : 0);
    
    return {
      minPrice: min,
      maxPrice: max,
      priceChange: typeof change === 'number' ? change : 0,
      priceChangePercent: typeof changePercent === 'number' ? changePercent : 0,
      isPositive: change >= 0,
      currentPrice: livePrice,
    };
  }, [chartData, visibleChartData, liveData, safePrice]);

  const chartIsRealtime = isLive && candles.length > 0 && candleProvenance?.status === "realtime";
  const chartLabel =
    chartIsRealtime ? "LIVE" :
    candleProvenance?.status === "delayed" || candleProvenance?.status === "previous_close" ? "DELAYED" :
    candleProvenance?.status === "simulated" || candles.length === 0 ? "SIMULATED" :
    "MARKET DATA";

  const padding = (maxPrice - minPrice) * 0.1 || 1;
  // Reuse the quote formatter for tiny labels; retain other chart formatting.
  const formatChartPrice = (value: number) => typeof value === 'number' && !isNaN(value)
    ? `$${value !== 0 && Math.abs(value) < 0.0001 ? formatPrice(value, asset.type) : value.toLocaleString()}`
    : '$—';
  const chartAxisWidth = Math.max(safePrice < 0.0001 ? 84 : 60,
    (Math.max(formatChartPrice(minPrice - padding).length, formatChartPrice(maxPrice + padding).length) + 2) * 7 + 16);


  const handleRefresh = () => {
    refetchQuote();
    refetchCandles();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">{asset.symbol.charAt(0)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{asset.symbol}</h2>
              {/* Live indicator */}
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                chartIsRealtime
                  ? 'bg-profit/20 text-profit'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {chartIsRealtime ? (
                  <>
                    <Wifi className="w-3 h-3" />
                    {chartLabel}
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    {chartLabel}
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{asset.name}</p>
          </div>
        </div>
        
        <div className="text-right flex items-start gap-2">
          <div>
            <p className="text-2xl font-bold tabular-nums">
              ${typeof currentPrice === 'number' && !isNaN(currentPrice) 
                ? formatPrice(currentPrice, asset.type)
                : '—'}
            </p>
            <p className={`text-sm font-medium tabular-nums ${isPositive ? 'text-profit' : 'text-loss'}`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${candlesLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-1 px-4 pb-2">
        {(['1H', '4H', '1D', '1W'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            aria-pressed={timeframe === tf}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              timeframe === tf
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>
      <p className="px-4 pb-2 text-xs text-muted-foreground" aria-live="polite">
        {timeframe} window ending at the latest chart point. Available history may be shorter. Quote change may cover a different period.
      </p>

      {/* Chart */}
      <div className="flex-1 min-h-0 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visibleChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(152, 60%, 42%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(152, 60%, 42%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="priceGradientLoss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 70%, 50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(0, 70%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(210, 15%, 55%)', fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis 
              domain={[minPrice - padding, maxPrice + padding]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(210, 15%, 55%)', fontSize: 10 }}
              width={chartAxisWidth}
              tickFormatter={formatChartPrice}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 7%)',
                border: '1px solid hsl(220, 10%, 15%)',
                borderRadius: '12px',
                boxShadow: '0 4px 24px -6px hsl(0 0% 0% / 0.6)',
              }}
              labelStyle={{ color: 'hsl(210, 15%, 55%)' }}
              itemStyle={{ color: isPositive ? 'hsl(152, 60%, 42%)' : 'hsl(0, 70%, 50%)' }}
              formatter={(value: number) => [formatChartPrice(value), 'Price']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? 'hsl(152, 60%, 50%)' : 'hsl(0, 70%, 55%)'}
              strokeWidth={2}
              fill={isPositive ? 'url(#priceGradient)' : 'url(#priceGradientLoss)'}
              dot={false}
              activeDot={{
                r: 4,
                fill: isPositive ? 'hsl(152, 60%, 50%)' : 'hsl(0, 70%, 55%)',
                stroke: 'hsl(0, 0%, 7%)',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer with data source info */}
      <div className="px-4 pb-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {chartIsRealtime ? 'Realtime quote and chart data' : `Data status: ${chartLabel.toLowerCase()}`}
        </span>
        <span>
          Candle interval varies by provider • Quotes 30s • Candles 60s
        </span>
      </div>
    </div>
  );
}
