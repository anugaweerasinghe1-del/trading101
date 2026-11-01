import { useCallback, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { NICHE_SYMBOLS } from "@/lib/nicheData";
import { CheckCircle, XCircle, Loader2, ShieldAlert } from "lucide-react";

interface AuditResult {
  route: string;
  status: "pass" | "fail";
  httpStatus: number;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  errors: string[];
}

const ALL_ROUTES = [
  "/", "/trade", "/markets", "/portfolio", "/learn", "/learn-trading-guide",
  "/ai-mentor", "/privacy", "/terms", "/about", "/contact", "/courses",
  "/wiki/short-squeeze", "/wiki/rsi-divergence",
  ...NICHE_SYMBOLS.map((symbol) => `/niche/${symbol.toLowerCase().replace("/", "-")}`),
];
const ROUTES = [...new Set(ALL_ROUTES)];

/**
 * Read actual same-origin production-style HTML, not a hard-coded metadata
 * table. This is a limited HTTP/HTML check; it is NOT a Google AdSense policy
 * review, Search Console coverage report, JS UX audit, or CMP certification.
 */
async function inspect(route: string): Promise<AuditResult> {
  const errors: string[] = [];
  const base: AuditResult = {
    route, status: "fail", httpStatus: 0, title: "", description: "",
    canonical: "", robots: "", errors,
  };
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(route, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    });
    base.httpStatus = response.status;
    const finalUrl = new URL(response.url, window.location.origin);
    if (!response.ok) errors.push(`HTTP ${response.status}`);
    if (!response.headers.get("Content-Type")?.includes("text/html")) {
      errors.push("Response did not declare HTML content");
      return { ...base, status: "fail" };
    }
    const html = await response.text();
    const page = new DOMParser().parseFromString(html, "text/html");
    base.title = page.querySelector("head title")?.textContent?.trim() || "";
    base.description = page.querySelector('head meta[name="description"]')?.getAttribute("content")?.trim() || "";
    base.canonical = page.querySelector('head link[rel="canonical"]')?.getAttribute("href")?.trim() || "";
    base.robots = page.querySelector('head meta[name="robots"]')?.getAttribute("content")?.trim() || "";
    if (!base.title) errors.push("Missing HTML title");
    if (!base.description) errors.push("Missing HTML meta description");
    if (!base.robots) errors.push("No explicit robots meta; inspect default indexing");
    // Non-indexable dynamic asset pages may intentionally lack a canonical.
    // Report missing canonicals only when the response explicitly requests indexing.
    if (base.robots.toLowerCase().includes("index") &&
        !base.robots.toLowerCase().includes("noindex")) {
      if (!base.canonical) {
        errors.push("Indexed page missing canonical URL");
      } else {
        try {
          const canonicalUrl = new URL(base.canonical, window.location.origin);
          if (canonicalUrl.origin !== window.location.origin ||
              canonicalUrl.pathname.replace(/\\/+$/, "") !== finalUrl.pathname.replace(/\\/+$/, "")) {
            errors.push("Canonical differs from fetched URL: " + base.canonical);
          }
        } catch { errors.push("Invalid canonical URL"); }
      }
    }
    // The fetch may have been redirected. That fact alone is not a failure.
    return { ...base, status: errors.length ? "fail" : "pass" };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Could not retrieve route");
    return base;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function SEOAudit() {
  const [results, setResults] = useState<AuditResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [ran, setRan] = useState(false);

  const runAudit = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setResults([]);
    setCompleted(0);
    setRan(false);
    const checked: AuditResult[] = [];
    // Bounded parallel requests avoid hammering the production host.
    for (let offset = 0; offset < ROUTES.length; offset += 4) {
      const batch = await Promise.all(ROUTES.slice(offset, offset + 4).map(inspect));
      checked.push(...batch);
      setResults([...checked]);
      setCompleted(checked.length);
    }
    setIsRunning(false);
    setRan(true);
  }, [isRunning]);

  const passing = results.filter(result => result.status === "pass").length;
  const failing = results.length - passing;

  return (
    <>
      <Helmet>
        <title>Live HTML Metadata Check — Admin | TradeHQ</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 pt-24 pb-12 max-w-5xl space-y-6">
          <header>
            <h1 className="text-2xl font-bold">Live HTML metadata check</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Reads initial same-origin HTML of {ROUTES.length} routes and reports
              HTTP status, title, description, canonical, and robots directives.
              This is not an AdSense clearance certificate or a full rendered-page audit.
            </p>
          </header>
          <button
            type="button"
            onClick={() => void runAudit()}
            disabled={isRunning}
            className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {isRunning ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Checking {completed}/{ROUTES.length}</span> : "Check live page HTML"}
          </button>
          {results.length > 0 && (
            <p className="text-sm text-muted-foreground" role="status">
              {completed}/{ROUTES.length} checked · {passing} without detected metadata issues · {failing} requiring inspection
            </p>
          )}
          {ran && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm" role="note">
              <div className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4" /> Limited evidence only</div>
              <p className="mt-2 text-muted-foreground">
                {failing ? `${failing} routes need technical review.` : "No metadata errors detected among the inspected responses."}
                {" "}A successful check does not verify Google indexing, original content,
                consent messages, financial accuracy, browser hydration, all routes,
                account status, or AdSense programme policies. Do not resubmit on this result alone.
              </p>
            </div>
          )}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[740px] text-xs">
              <thead className="bg-muted/50">
                <tr>
                  {["Route", "HTTP", "Result", "Title", "Description", "Robots", "Findings"].map(h => (
                    <th key={h} className="px-3 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map(result => (
                  <tr key={result.route} className="border-t border-border align-top">
                    <td className="px-3 py-3 font-mono">{result.route}</td>
                    <td className="px-3 py-3">{result.httpStatus || "—"}</td>
                    <td className="px-3 py-3">
                      {result.status === "pass"
                        ? <CheckCircle className="h-4 w-4 text-emerald-500" aria-label="No detected metadata issue" />
                        : <XCircle className="h-4 w-4 text-red-500" aria-label="Needs review" />}
                    </td>
                    <td className="px-3 py-3">{result.title || "—"}</td>
                    <td className="px-3 py-3">{result.description.slice(0, 130) || "—"}</td>
                    <td className="px-3 py-3">{result.robots || "Unspecified"}</td>
                    <td className="px-3 py-3">{result.errors.join("; ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </>
  );
}
