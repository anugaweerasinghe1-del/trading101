import type { PortfolioSnapshot } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { portfolioChartPoints } from "@/lib/portfolioChartPoints";
import { Button } from "@/components/ui/button";

export function PortfolioChart({ currentValue, history, account, receivedAt }: {
  currentValue: number; history: PortfolioSnapshot[]; account: boolean; receivedAt?: number;
}) {
  const stopLossPercent = 10;
  const [showStopLoss, setShowStopLoss] = useState(true);
  const data = portfolioChartPoints(history, currentValue, account, receivedAt);
  const hasHistory = data.length >= 2;
  const hasCurrentObservation = data.length === 1;
  const initialValue = data[0]?.value ?? currentValue;
  const change = currentValue - initialValue;
  const changePercent = initialValue > 0 ? ((change / initialValue) * 100).toFixed(2) : null;
  const isPositive = change >= 0;
  const stopLossValue = initialValue * (1 - stopLossPercent / 100);
  const stopLossBreached = hasHistory && currentValue < stopLossValue;

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h3 className="text-lg font-semibold">Practice Portfolio History</h3>
          {hasHistory && <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStopLoss(!showStopLoss)}
            className="gap-2"
          >
            <Shield className="w-4 h-4" />
            Reference line: {stopLossPercent}%
          </Button>}
        </div>
        <p className="text-xs text-muted-foreground mb-3">{account
          ? "Account snapshots are recorded on this device when TradeHQ receives them. The reference line is for comparison."
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
        <LineChart data={data}>
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            domain={['auto', 'auto']}
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
          {hasHistory && showStopLoss && (
            <ReferenceLine
              y={stopLossValue}
              stroke="hsl(var(--destructive))"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `Reference: $${stopLossValue.toFixed(0)}`,
                position: 'right',
                fill: 'hsl(var(--destructive))',
                fontSize: 12,
              }}
            />
          )}
          
          {/* Initial Value Line */}
          {hasHistory && <ReferenceLine
            y={initialValue}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{
              value: `First snapshot: $${initialValue.toFixed(0)}`,
              position: 'left',
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 12,
            }}
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
      </div>}
    </Card>
  );
}
