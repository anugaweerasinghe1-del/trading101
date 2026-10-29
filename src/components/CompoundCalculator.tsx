import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, DollarSign, Percent, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalculatorResult {
  finalValue: number;
  totalProfit: number;
  totalFees: number;
  netProfit: number;
  yearlyBreakdown: { year: number; value: number; profit: number }[];
}

export function CompoundCalculator() {
  const [initialInvestment, setInitialInvestment] = useState(100000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [tradingFeePct, setTradingFeePct] = useState(0.1);
  const [years, setYears] = useState(10);

  const result = useMemo<CalculatorResult>(() => {
    const monthlyRate = annualReturn / 100 / 12;
    const feeRate = tradingFeePct / 100;
    const months = years * 12;
    
    let balance = initialInvestment;
    let totalContributions = initialInvestment;
    let totalFees = 0;
    const yearlyBreakdown: { year: number; value: number; profit: number }[] = [];

    for (let month = 1; month <= months; month++) {
      balance += monthlyContribution;
      totalContributions += monthlyContribution;
      const growth = balance * monthlyRate;
      balance += growth;
      const fee = Math.abs(growth) * feeRate;
      balance -= fee;
      totalFees += fee;

      if (month % 12 === 0) {
        yearlyBreakdown.push({
          year: month / 12,
          value: balance,
          profit: balance - totalContributions
        });
      }
    }

    return {
      finalValue: balance,
      totalProfit: balance - totalContributions,
      totalFees,
      netProfit: balance - totalContributions,
      yearlyBreakdown
    };
  }, [initialInvestment, monthlyContribution, annualReturn, tradingFeePct, years]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card className="p-4 bg-[#030506] border-white/10 rounded-xl shadow-2xl overflow-hidden h-full flex flex-col">
      {/* Header - Micro Size */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-2">
        <Calculator className="w-3.5 h-3.5 text-emerald-500" />
        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Illustrative Growth</h3>
      </div>

      <div className="flex flex-col gap-5 flex-1">
        <p className="text-xs leading-relaxed text-slate-400">
          {years}-year calculation using your assumptions, not live data or a forecast.
          Contributions are added at the start of each month; growth uses a nominal annual rate divided by 12. A 12% nominal input compounds to about 12.68% effective annual growth before deductions.
          The selected deduction is a percentage of absolute monthly growth, not a broker commission model.
          Actual returns vary; taxes and inflation are excluded.
        </p>
        {/* Inputs - stacked vertically */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="compound-initial-capital" className="text-[9px] uppercase font-bold text-slate-500">Initial Capital</Label>
            <Input
              type="number"
              id="compound-initial-capital"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(Number(e.target.value))}
              className="h-8 bg-white/5 border-white/10 text-[11px] font-bold text-foreground [.light_&]:text-[hsl(220_15%_93%)]"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="compound-monthly-add" className="text-[9px] uppercase font-bold text-slate-500">Monthly Add</Label>
            <Input
              type="number"
              id="compound-monthly-add"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              className="h-8 bg-white/5 border-white/10 text-[11px] font-bold text-foreground [.light_&]:text-[hsl(220_15%_93%)]"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap justify-between gap-2 text-[9px] font-black text-emerald-500/80 uppercase">
            <span>Assumed nominal annual rate: {annualReturn}%</span>
            <span>Growth deduction: {tradingFeePct}%</span>
          </div>
          <Slider aria-label="Assumed nominal annual rate" value={[annualReturn]} onValueChange={([v]) => setAnnualReturn(v)} max={30} step={0.5} className="py-1" />
          <Slider aria-label="Illustrative deduction as a percentage of monthly growth" value={[tradingFeePct]} onValueChange={([v]) => setTradingFeePct(v)} max={1} step={0.01} className="py-1" />
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <p className="text-[8px] uppercase font-bold text-slate-500 mb-1">Final Value</p>
            <p className="text-[13px] font-black text-emerald-400 tabular-nums tracking-tighter truncate">
              {formatCurrency(result.finalValue)}
            </p>
          </div>
          <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <p className="text-[8px] uppercase font-bold text-slate-500 mb-1">Illustrative net gain</p>
            <p className="text-[13px] font-black text-emerald-500 tabular-nums tracking-tighter truncate">
              +{formatCurrency(result.netProfit)}
            </p>
          </div>
        </div>

        {/* Broker Fees */}
        <div className="px-2.5 py-1.5 bg-red-500/5 border border-red-500/10 rounded-lg flex justify-between items-center">
          <span className="text-[8px] uppercase font-bold text-slate-500">Illustrative deductions:</span>
          <span className="text-[10px] font-black text-red-400">-{formatCurrency(result.totalFees)}</span>
        </div>

        {/* Growth Chart - expands to fill remaining space */}
        <div className="flex-1 min-h-[80px] flex items-end gap-[1px] px-1">
          {result.yearlyBreakdown.map((data, i) => (
            <div
              key={i}
              className="flex-1 bg-emerald-500/20 rounded-t-[1px]"
              style={{ height: `${(data.value / result.finalValue) * 100}%` }}
            />
          ))}
        </div>

        <Button 
          className="w-full h-8 bg-emerald-500 hover:bg-emerald-400 text-black text-[9px] font-black uppercase tracking-[0.15em]" 
          asChild
        >
          <a href="/trade">START SIMULATOR</a>
        </Button>
      </div>
    </Card>
  );
}
