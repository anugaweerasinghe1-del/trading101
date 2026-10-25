import { useMemo } from "react";
import { Portfolio } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, Target, Shield, Award, TrendingDown } from "lucide-react";
import { calculateMaxDrawdown, calculateRealizedPnL } from "@/lib/portfolio";

interface PortfolioAnalyticsProps {
  portfolio: Portfolio;
}

const COLORS = ['hsl(45 100% 51%)', 'hsl(142 71% 45%)', 'hsl(217 91% 60%)', 'hsl(0 72% 51%)', 'hsl(280 100% 70%)'];

export function PortfolioAnalytics({ portfolio }: PortfolioAnalyticsProps) {
  const analytics = useMemo(() => {
    const totalInvested = portfolio.positions.reduce((sum, p) => sum + (p.avgPrice * p.quantity), 0);
    const currentValue = portfolio.positions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalReturn = currentValue - totalInvested;
    const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    // Cross-sectional snapshot of current open-position P&L. This is not a
    // time-series Sharpe ratio and is intentionally labelled as dispersion.
    const openReturns = portfolio.positions.map(p => p.profitLossPercent);
    const avgOpenReturn = openReturns.reduce((a, b) => a + b, 0) / (openReturns.length || 1);
    const openReturnDispersion = Math.sqrt(
      openReturns.reduce((sum, r) => sum + Math.pow(r - avgOpenReturn, 2), 0) / (openReturns.length || 1)
    );

    // Current open-position status — not a closed-trade win rate.
    const winners = portfolio.positions.filter(p => p.profitLoss > 0).length;
    const losers = portfolio.positions.filter(p => p.profitLoss < 0).length;
    const openPositionsInProfit = portfolio.positions.length > 0 ? (winners / portfolio.positions.length) * 100 : 0;

    // Sector allocation
    const allocation = portfolio.positions.reduce((acc, p) => {
      const type = p.asset.type;
      acc[type] = (acc[type] || 0) + p.currentValue;
      return acc;
    }, {} as Record<string, number>);

    const allocationData = Object.entries(allocation).map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
      percentage: (value / currentValue) * 100
    }));

    // Simple practice-only breadth score based on asset-class count and number
    // of open positions. It does not measure correlation or diversification quality.
    const allocationBreadthScore = Math.min(
      100,
      (Object.keys(allocation).length * 20) +
      (portfolio.positions.length * 5)
    );

    const maxDrawdown = calculateMaxDrawdown();
    const realizedPnL = calculateRealizedPnL(portfolio);

    return {
      totalInvested,
      currentValue,
      totalReturn,
      returnPercent,
      openReturnDispersion,
      openPositionsInProfit,
      winners,
      losers,
      allocationData,
      allocationBreadthScore,
      maxDrawdown,
      realizedPnL,
    };
  }, [portfolio]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Performance Metrics */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Performance Metrics
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Open Position P&amp;L</span>
            <span className={`text-xl font-bold ${analytics.totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
              {analytics.totalReturn >= 0 ? '+' : ''}${analytics.totalReturn.toFixed(2)} ({analytics.returnPercent.toFixed(2)}%)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Open P&amp;L Dispersion</span>
            <span className="text-xl font-bold">{analytics.openReturnDispersion.toFixed(2)} pp</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Open Positions in Profit</span>
            <span className="text-xl font-bold text-success">{analytics.openPositionsInProfit.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Open Profit / Loss Positions</span>
            <span className="font-medium">
              <span className="text-success">{analytics.winners}</span> / <span className="text-destructive">{analytics.losers}</span>
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" /> Practice Max Drawdown
            </span>
            <span className="text-base font-semibold text-destructive tabular-nums">
              -{analytics.maxDrawdown.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Realized P&amp;L (Lifetime)</span>
            <span
              className={`text-base font-semibold tabular-nums ${
                analytics.realizedPnL >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {analytics.realizedPnL >= 0 ? "+" : ""}${analytics.realizedPnL.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      {/* Portfolio Allocation */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Asset Allocation
        </h3>
        {analytics.allocationData.length > 0 ? (
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={analytics.allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.allocationData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 20%)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {analytics.allocationData.map((item, index) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      {item.name}
                    </span>
                    <span className="font-medium">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={item.percentage} aria-label={`${item.name} allocation`} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No positions yet</p>
        )}
      </Card>

      {/* Allocation breadth snapshot */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Allocation Breadth (Practice)
        </h3>
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <div className="text-6xl font-bold text-gradient-gold">{analytics.allocationBreadthScore}</div>
            <span className="absolute -bottom-2 text-sm text-muted-foreground">/100</span>
          </div>
          <p className="mt-6 text-muted-foreground">
            Practice-only breadth score based on {Object.keys(portfolio.positions.reduce((acc, pos) => {
              acc[pos.asset.type] = true;
              return acc;
            }, {} as Record<string, boolean>)).length} asset class(es) across {portfolio.positions.length} open position(s). It does not measure correlation or guarantee diversification.
          </p>
        </div>
      </Card>

      {/* Risk Assessment */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Risk Assessment
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Open P&amp;L Dispersion</span>
              <span className="font-medium">{analytics.openReturnDispersion.toFixed(2)} percentage points</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Spread of current open-position returns around their average; this is not time-series volatility or a Sharpe ratio.
            </p>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Cash Reserve</span>
              <span className="font-medium">{((portfolio.cash / portfolio.totalValue) * 100).toFixed(1)}%</span>
            </div>
            <Progress 
              value={(portfolio.cash / portfolio.totalValue) * 100} 
              aria-label="Cash Reserve"
              className="h-2"
            />
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Cash reserve is shown descriptively only; TradeHQ does not prescribe a target cash percentage.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
