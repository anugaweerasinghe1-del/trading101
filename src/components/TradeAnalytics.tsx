import { getRealizedTradeResults } from '@/lib/realizedTrades';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Trophy, AlertTriangle, BarChart3 } from 'lucide-react';
import { Portfolio } from '@/lib/types';
import { format } from 'date-fns';

interface TradeAnalyticsProps {
  portfolio: Portfolio;
}

interface TradePerformance {
  symbol: string;
  profit: number;
  profitPercent: number;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  timestamp: Date;
}

export function TradeAnalytics({ portfolio }: TradeAnalyticsProps) {
  const analytics = useMemo(() => {
    const completedTrades = getRealizedTradeResults(portfolio.trades);

    // Calculate metrics
    const winningTrades = completedTrades.filter(t => t.profit > 0);
    const losingTrades = completedTrades.filter(t => t.profit < 0);
    const winRate = completedTrades.length > 0 
      ? (winningTrades.length / completedTrades.length) * 100 
      : 0;
    
    const totalProfit = completedTrades.reduce((sum, t) => sum + t.profit, 0);
    const avgProfitPerTrade = completedTrades.length > 0 
      ? totalProfit / completedTrades.length 
      : 0;
    
    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + t.profit, 0) / winningTrades.length
      : 0;
    
    const avgLoss = losingTrades.length > 0
      ? losingTrades.reduce((sum, t) => sum + t.profit, 0) / losingTrades.length
      : 0;
    
    const grossProfit = winningTrades.reduce((sum, trade) => sum + trade.profit, 0);
    const grossLoss = -losingTrades.reduce((sum, trade) => sum + trade.profit, 0);
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    
    const sortedByProfit = [...completedTrades].sort((a, b) => b.profit - a.profit);
    const bestTrades = sortedByProfit.slice(0, 3);
    const worstTrades = sortedByProfit.slice(-3).reverse();

    return {
      completedTrades,
      winRate,
      avgProfitPerTrade,
      totalProfit,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      avgWin,
      avgLoss,
      profitFactor,
      bestTrades,
      worstTrades,
    };
  }, [portfolio.trades]);

  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
    return value < 0 ? `-${formatted}` : formatted;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Target className="h-4 w-4" />
              Closed-Sell Win Rate
            </div>
            <div className={`text-2xl font-bold ${analytics.winRate >= 50 ? 'text-success' : 'text-destructive'}`}>
              {analytics.winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {analytics.winningTrades}W / {analytics.losingTrades}L
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <BarChart3 className="h-4 w-4" />
              Avg Profit/Trade
            </div>
            <div className={`text-2xl font-bold ${analytics.avgProfitPerTrade >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(analytics.avgProfitPerTrade)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {analytics.completedTrades.length} completed trades
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Total Realized P&L
            </div>
            <div className={`text-2xl font-bold ${analytics.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(analytics.totalProfit)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Net of recorded simulator fees
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingDown className="h-4 w-4" />
              Profit Factor
            </div>
            <div className={`text-2xl font-bold ${analytics.profitFactor >= 1 ? 'text-success' : 'text-destructive'}`}>
              {analytics.profitFactor.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total gains / absolute total losses
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Avg Win/Loss */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Average Win</div>
                <div className="text-xl font-bold text-success">
                  {formatCurrency(analytics.avgWin)}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Average Loss</div>
                <div className="text-xl font-bold text-destructive">
                  {formatCurrency(analytics.avgLoss)}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best & Worst Trades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-success" />
              Best Trades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.bestTrades.length > 0 ? (
              analytics.bestTrades.map((trade, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/10">
                  <div>
                    <div className="font-medium">{trade.symbol}</div>
                    <div className="text-xs text-muted-foreground">
                      {trade.quantity} shares @ ${trade.sellPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(trade.timestamp), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-success">{formatCurrency(trade.profit)}</div>
                    <Badge variant="outline" className="text-success border-success/30">
                      +{trade.profitPercent.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No completed trades yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Worst Trades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.worstTrades.filter(t => t.profit < 0).length > 0 ? (
              analytics.worstTrades.filter(t => t.profit < 0).map((trade, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                  <div>
                    <div className="font-medium">{trade.symbol}</div>
                    <div className="text-xs text-muted-foreground">
                      {trade.quantity} shares @ ${trade.sellPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(trade.timestamp), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-destructive">{formatCurrency(trade.profit)}</div>
                    <Badge variant="outline" className="text-destructive border-destructive/30">
                      {trade.profitPercent.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No losing trades yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
