import { Asset } from "@/lib/types";
import { getAssetContent } from "@/lib/assetContent";
import { Lightbulb, Zap } from "lucide-react";

interface GEOKeyTakeawaysProps {
  asset: Asset;
}

/**
 * GEO Key Takeaways - Premium glassmorphism card for AI Overviews.
 */
export function GEOKeyTakeaways({ asset }: GEOKeyTakeawaysProps) {
  const content = getAssetContent(asset.id);

  const definition = getDefinitionBullet(asset, content);
  const influencers = getInfluencersBullet(asset, content);
  const simulatorValue = getSimulatorBullet(asset);
  const studentPerspective = getStudentPerspective(asset);

  return (
    <section
      className="rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl p-5 mb-4"
      style={{ boxShadow: '0 8px 32px -8px hsl(0 0% 0% / 0.3)' }}
      aria-label={`Key takeaways about ${asset.name}`}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-bold text-foreground tracking-tight">
          Key Takeaways — {asset.symbol}
        </h2>
      </div>

      <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed list-none">
        {[definition, influencers, simulatorValue].map((text, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Zap className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{text}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground/70 mt-4 italic pl-6">
        {studentPerspective}
      </p>

      <p className="text-[10px] text-muted-foreground/40 mt-2 italic pl-6">
        (Educational simulation only — not financial advice.)
      </p>
    </section>
  );
}

function getDefinitionBullet(asset: Asset, content: ReturnType<typeof getAssetContent>): string {
  return `${asset.name} (${asset.symbol}) — ${content.whatIs}`;
}

function getInfluencersBullet(asset: Asset, content: ReturnType<typeof getAssetContent>): string {
  const driver = content.stats?.primaryDriver;
  const sector = content.stats?.sector;

  if (driver) {
    return `Primary market driver: ${driver}. ${sector ? `Sector: ${sector}.` : ''} Price influenced by macroeconomic conditions and sector-specific catalysts.`;
  }
  if (asset.type === 'crypto') {
    return `Cryptocurrency influenced by network adoption, regulatory developments, and broader digital asset sentiment.`;
  }
  if (asset.type === 'forex') {
    return `Currency pair driven by central bank policy divergence, interest rate differentials, and macroeconomic data.`;
  }
  return `Price influenced by sector-specific catalysts and broader market conditions.`;
}

function getSimulatorBullet(asset: Asset): string {
  return `TradeHQ lets you practice ${asset.symbol} trading with $100,000 virtual capital, simulated charts, and educational mentor explanations — no signup or real money required.`;
}

function getStudentPerspective(asset: Asset): string {
  const assetLabel = asset.type === 'etf' ? 'ETF' : asset.type;
  return `Student perspective: Practice ${asset.symbol} ${assetLabel} trading as a beginner in Colombo or anywhere — study order mechanics with virtual cash. Practice results do not establish readiness for real trading.`;
}
