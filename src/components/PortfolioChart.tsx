import { getPortfolioHistory } from "@/lib/portfolioHistory";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { INITIAL_CASH } from "@/lib/assets";

export function PortfolioChart() {
  const history = getPortfolioHistory();
  const [stopLossPercent, setStopLossPercent] = useState(10);
  const [showStopLoss, setShowStopLoss] = useState(true);

  // Add initial point if no history
  const data = history.length > 0 
    ? history.map(snapshot => ({
        time: new Date(snapshot.timestamp).toLocaleDateString(),
        value: snapshot.totalValue,
      }))
    : [
        { time: 'Start', value: INITIAL_CASH }
      ];

  const initialValue = data[0]?.value || INITIAL_CASH;
  const currentValue = data[data.length - 1]?.value || INITIAL_CASH;
  const change = currentValue - initialValue;
  const changePercent = ((change / initialValue) * 100).toFixed(2);
  const isPositive = change >= 0;
  
  // Calculate stop-loss line (below initial value)
  const stopLossValue = initialValue * (1 - stopLossPercent / 100);
  const stopLossBreached = currentValue < stopLossValue;

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h3 className="text-lg font-semibold">Practice Portfolio History</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStopLoss(!showStopLoss)}
            className="gap-2"
          >
            <Shield className="w-4 h-4" />
            Reference line: {stopLossPercent}%
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Local practice snapshots may include generated hourly backfill between visits. This is not observed market history; the reference line does not execute a stop order.</p>
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-bold">${currentValue.toFixed(2)}</span>
          <span className={cn(
            "font-semibold flex items-center gap-1",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isPositive ? '+' : ''}${change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent}%)
          </span>
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

      <ResponsiveContainer width="100%" height={300}>
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
          {showStopLoss && (
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
          <ReferenceLine
            y={initialValue}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{
              value: `Break Even: $${initialValue.toFixed(0)}`,
              position: 'left',
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 12,
            }}
          />
          
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
    </Card>
  );
}
