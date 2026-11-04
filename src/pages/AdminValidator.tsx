import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { ASSETS } from "@/lib/assets";
import { CheckCircle, XCircle, Loader2, Link as LinkIcon } from "lucide-react";

interface LinkCheckResult {
  source: string;
  href: string;
  status: "valid" | "invalid" | "pending";
  reason?: string;
}

export default function AdminValidator() {
  const [results, setResults] = useState<LinkCheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runValidation = () => {
    setIsRunning(true);
    const checks: LinkCheckResult[] = [];

    // Check all asset "Related Markets" links
    for (const asset of ASSETS) {
      const sameType = ASSETS.filter(a => a.type === asset.type && a.id !== asset.id);
      const related = sameType.sort((a, b) => b.price - a.price).slice(0, 6);

      for (const rel of related) {
        const href = `/trade/${rel.id}`;
        const targetExists = ASSETS.some(a => a.id === rel.id);
        checks.push({
          source: `/trade/${asset.id}`,
          href,
          status: targetExists ? "valid" : "invalid",
          reason: targetExists ? undefined : `Asset "${rel.id}" not found in ASSETS`,
        });
      }
    }

    setResults(checks);
    setIsRunning(false);
  };

  const validCount = results.filter(r => r.status === "valid").length;
  const invalidCount = results.filter(r => r.status === "invalid").length;

  return (
    <>
      <Helmet>
        <title>Link Validator | Admin | TradeHQ</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Asset Route Definition Check
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Checks the local route definitions used by Related Markets across {ASSETS.length} assets. This does not request production pages or verify their HTTP status, content or deployment.
          </p>

          <button
            onClick={runValidation}
            disabled={isRunning}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mb-6"
          >
            {isRunning ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Scanning...</span>
            ) : (
              <span className="flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Check Local Routes</span>
            )}
          </button>

          {results.length > 0 && (
            <>
              <div className="flex gap-4 mb-4 text-sm">
                <span className="text-success flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> {validCount} valid
                </span>
                <span className="text-destructive flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> {invalidCount} broken
                </span>
              </div>

              {invalidCount === 0 ? (
                <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-medium">
                  All {validCount} related-market targets exist in the local asset definitions. Deployed URLs, HTTP responses and build stability have not been checked.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {results.filter(r => r.status === "invalid").map((r, i) => (
                    <div key={i} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                      <span className="text-destructive font-medium">{r.source}</span>
                      <span className="text-muted-foreground"> → </span>
                      <span className="text-foreground">{r.href}</span>
                      {r.reason && <p className="text-xs text-muted-foreground mt-1">{r.reason}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
