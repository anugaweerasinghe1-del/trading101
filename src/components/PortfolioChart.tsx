import type { PortfolioSnapshot } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { portfolioChartPoints } from "@/lib/portfolioChartPoints";
import { portfolioChartDomain, formatPortfolioChartTick, isPortfolioReferenceVisible } from "@/lib/portfolioChartDisplay";
import { Button } from "@/components/ui/button";

export function PortfolioChart({ currentValue, history, account, receivedAt }: {
  currentValue: number; history: PortfolioSnapshot[]; account: boolean; receivedAt?: number;
}) {
  const stopLossPercent = 10;
  const [showStopLoss, setShowStopLoss] = useState(true);
  const data = portfolioChartPoints(history, currentValue, account, receivedAt);
  const hasHistory = data.length >= 2;
  const hasCurrentObservation = data.length === 1;
  // Scale the plotted observations, not the much lower 10% reference threshold.
  const chartDomain = portfolioChartDomain(data);
  const initialValue = data[0]?.value ?? currentValue;
  const change = currentValue - initialValue;
  const changePercent = initialValue > 0 ? ((change / initialValue) * 100).toFixed(2) : null;
  const isPositive = change >= 0;
  const stopLossValue = initialValue * (1 - stopLossPercent / 100);
  const stopLossBreached = hasHistory && currentValue < stopLossValue;
  const referenceInView = hasHistory && isPortfolioReferenceVisible(stopLossValue, chartDomain);

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h3 className="text-lg font-semibold">Practice Portfolio History</h3>
          {hasHistory && <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStopLoss(visible => !visible)}
            aria-pressed={showStopLoss}
            aria-label="Toggle 10% downside reference"
            className="gap-2"
          >
            <Shield className="w-4 h-4" />
            {showStopLoss ? "Hide" : "Show"} {stopLossPercent}% downside reference
          </Button>}
        </div>
        <p className="text-xs text-muted-foreground mb-3">{account
          ? "Account snapshots are recorded on this device when TradeHQ receives them. With multiple observations, the reference line provides a comparison."
          : "Earlier local practice snapshots may include simulated backfill. The reference line is for comparison."}</p>
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-bold" data-portfolio-chart-value>${currentValue.toFixed(2)}</span>
          {hasHistory && <span className={cn(
            "font-semibold flex items-center gap-1",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isPositive ? '+' : ''}${change.toFixed(2)}{changePercent !== null && ` (${isPositive ? '+' : ''}${changePercent}%)`} since first saved snapshot
          </span>}
        </div>
        {showStopLoss && stopLossBreached && (
          <div className="mt-2 px-3 py-2 bg-destructive/20 border border-destructive/50 rounded-lg">
            <p className="text-sm font-medium text-destructive flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Reference threshold crossed. Portfolio dropped below ${stopLossValue.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {!hasHistory && <p className="text-sm text-muted-foreground mb-4" role="status">
        {hasCurrentObservation
          ? "One real portfolio observation is available. The point below shows the current snapshot, not a historical trend. Later observations on this device will build the chart."
          : "History is unavailable on this device until at least two snapshots are recorded. Your account portfolio value and recorded trades are separate from this optional local chart."}
      </p>}
      {data.length > 0 && <div className="min-w-0" data-portfolio-chart-state={hasHistory ? "trend" : "single-observation"}>
        <ResponsiveContainer width="100%" height={hasHistory ? 300 : 210}>
        <LineChart data={data} margin={{ top: 12, right: 18, bottom: 10, left: 10 }}>
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            minTickGap={16}
          />
          <YAxis
            width={108}
            tickMargin={10}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            domain={chartDomain}
            tickFormatter={(value: number) => formatPortfolioChartTick(value, chartDomain[1] - chartDomain[0])}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          
          {/* Stop Loss Line */}
          {hasHistory && showStopLoss && referenceInView && (
            <ReferenceLine
              y={stopLossValue}
              stroke="hsl(var(--destructive))"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
          )}
          
          {/* Initial Value Line */}
          {hasHistory && <ReferenceLine
            y={initialValue}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            strokeWidth={1}
          />}
          
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={stopLossBreached ? "hsl(var(--destructive))" : "hsl(var(--primary))"} 
            strokeWidth={3}
            dot={{ fill: stopLossBreached ? 'hsl(var(--destructive))' : 'hsl(var(--primary))', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
        </ResponsiveContainer>
        {hasHistory && <div className="mt-4 space-y-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
          <p>First saved observation: <strong className="font-medium text-foreground">${initialValue.toLocaleString("en-US", { style: "currency", currency: "USD" })}</strong></p>
          <p role="status" aria-live="polite" data-portfolio-reference-status>
            {showStopLoss
              ? <>10% downside reference: <strong className="font-medium text-foreground">${stopLossValue.toLocaleString("en-US", { style: "currency", currency: "USD" })}</strong>. {referenceInView
                  ? "The dashed reference line is visible on the chart."
                  : "The reference is below this chart's visible scale; it is shown here without flattening your actual portfolio changes."}</>
              : "10% downside reference hidden."}
          </p>
          <p>This is an educational comparison, not a stop-loss order.</p>
        </div>}
      </div>}
    </Card>
  );
}
