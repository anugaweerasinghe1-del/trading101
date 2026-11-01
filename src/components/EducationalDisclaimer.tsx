import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "footer" | "inline" | "compact";

interface Props {
  variant?: Variant;
  className?: string;
}

/**
 * Global educational-use disclaimer. Reused across the site so wording
 * stays consistent. Uses existing design tokens only — no new colors.
 */
export function EducationalDisclaimer({ variant = "inline", className }: Props) {
  const text = (
    <>
      <strong className="text-foreground font-semibold">TradeHQ is an educational paper trading simulator.</strong>{" "}
      No real money is traded. Nothing on this website constitutes investment, financial, legal or tax advice.
      Past simulated performance does not predict future real-world performance.
    </>
  );

  if (variant === "compact") {
    return (
      <p
        role="note"
        aria-label="Educational disclaimer"
        className={cn(
          "text-[11px] leading-relaxed text-muted-foreground text-center",
          className
        )}
      >
        {text}
      </p>
    );
  }

  if (variant === "footer") {
    return (
      <div
        role="note"
        aria-label="Educational disclaimer"
        className={cn(
          "p-4 rounded-xl bg-muted/60 border border-border/80 max-w-4xl mx-auto",
          className
        )}
      >
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          {text}
        </p>
      </div>
    );
  }

  return (
    <aside
      role="note"
      aria-label="Educational disclaimer"
      className={cn(
        "container mx-auto px-4 my-8 max-w-4xl",
        className
      )}
    >
      <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/20 p-4">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
      </div>
    </aside>
  );
}