import { Card } from "@/components/ui/card";
import { Shield, TrendingUp, Activity } from "lucide-react";
import { Portfolio } from "@/lib/types";
import { Progress } from "@/components/ui/progress";

interface RiskManagementProps {
  portfolio: Portfolio;
}

export function RiskManagement({ portfolio }: RiskManagementProps) {
  const totalValue = portfolio.totalValue;
  const cashPercent = totalValue > 0 ? (portfolio.cash / totalValue) * 100 : 0;
  const positionsValue = portfolio.positions.reduce((sum, p) => sum + p.currentValue, 0);
  const largestPositionPercent = totalValue > 0 && portfolio.positions.length > 0
    ? Math.max(...portfolio.positions.map(p => (p.currentValue / totalValue) * 100))
    : 0;
  const cryptoExposure = portfolio.positions
    .filter(p => p.asset.type === "crypto")
    .reduce((sum, p) => sum + p.currentValue, 0);
  const cryptoPercent = positionsValue > 0 ? (cryptoExposure / positionsValue) * 100 : 0;

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-primary" />
        Portfolio Exposure Snapshot
      </h3>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />Cash Share of Account
            </span>
            <span className="font-medium">{cashPercent.toFixed(1)}%</span>
          </div>
          <Progress value={cashPercent} aria-label="Cash Share of Account" className="h-2" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />Largest Position Share of Account
            </span>
            <span className="font-medium">{largestPositionPercent.toFixed(1)}%</span>
          </div>
          <Progress value={largestPositionPercent} aria-label="Largest Position Share of Account" className="h-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Open Positions</p>
            <p className="text-2xl font-bold">{portfolio.positions.length}</p>
          </div>
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Crypto Share of Invested Value</p>
            <p className="text-2xl font-bold">{cryptoPercent.toFixed(1)}%</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          These figures describe current practice allocations. Position count and asset labels do not measure
          correlation, future loss or whether an allocation suits a person. With no invested value, the crypto
          share is shown as zero. Compare hypothetical price shocks in the Scenario Builder to explore exposure.
        </p>
      </div>
    </Card>
  );
}
