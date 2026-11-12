import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LEADERBOARD_FUNNEL_MARKER_KEY } from "@/lib/leaderboardFunnelTelemetry";

/**
 * Privacy-first optional measurement. Legacy v1 acceptances are deliberately
 * NOT grandfathered in: the renewed consent covers narrowly defined
 * Arena and leaderboard-registration events, not replay/autocapture.
 */
type ConsentChoice = "accepted" | "rejected";
const STORAGE_KEY = "tradehq_consent_v3";
const ARENA_VISIT_KEY = "tradehq:arena-analytics-last-seen:v1";
const AMPLITUDE_API_KEY = "44108a3c4bd34ff14004fa66198d9f20";

function readChoice(): ConsentChoice | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "accepted" || stored === "rejected" ? stored : null;
  } catch { return null; }
}

function loadConsentedAnalytics() {
  if (readChoice() !== "accepted") return;
  const initialize = () => {
    if (readChoice() !== "accepted") return;
    const w = window as any;
    if (!w.amplitude || w.__tradehqAmplitudeStarted) return;
    // No session replay, no user-interaction recording, no background pageview
    // or form capture, and no remotely enabled autocapture on this site.
    w.amplitude.init(AMPLITUDE_API_KEY, {
      fetchRemoteConfig: false,
      autocapture: false,
      trackingOptions: { ipAddress: false, language: false, platform: false },
      identityStorage: "localStorage",
    });
    w.amplitude.setOptOut?.(false);
    w.__tradehqAmplitudeStarted = true;
    window.dispatchEvent(new Event("tradehq:analytics-ready"));
  };
  if (document.getElementById("tradehq-amplitude")) { initialize(); return; }
  const script = document.createElement("script");
  script.id = "tradehq-amplitude";
  script.src = `https://cdn.amplitude.com/script/${AMPLITUDE_API_KEY}.js`;
  script.async = true;
  script.onload = initialize;
  document.head.appendChild(script);
}

export function ConsentBanner() {
  const [choice, setChoice] = useState<ConsentChoice | null>(readChoice);
  const [isAdult, setIsAdult] = useState(false);

  useEffect(() => {
    if (choice === "accepted") loadConsentedAnalytics();
  }, [choice]);

  useEffect(() => {
    const reopen = () => { setIsAdult(false); setChoice(null); };
    window.addEventListener("tradehq:open-consent", reopen);
    return () => window.removeEventListener("tradehq:open-consent", reopen);
  }, []);

  const save = (next: ConsentChoice) => {
    if (next === "accepted" && !isAdult) return;
    const previous = readChoice();
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      if (next === "rejected") {
        window.localStorage.removeItem(ARENA_VISIT_KEY);
        window.localStorage.removeItem(LEADERBOARD_FUNNEL_MARKER_KEY);
      }
    } catch {
      // If consent cannot be persisted, optional tracking must remain off.
      if (next === "accepted") return;
    }
    setChoice(next);
    setIsAdult(false);
    if (next === "rejected" && previous === "accepted") {
      (window as any).amplitude?.setOptOut?.(true);
      // Unload initialized SDK listeners; deleting its script would not stop it.
      window.location.reload();
    }
  };

  if (choice) return null;

  return (
    <div role="dialog" aria-label="Optional analytics choices"
      className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-[120] mx-auto max-h-[65dvh] overflow-y-auto rounded-2xl border border-border bg-background/95 p-3 shadow-2xl backdrop-blur-xl md:inset-x-auto md:bottom-5 md:right-5 md:mx-0 md:w-[min(25rem,calc(100vw-2.5rem))] md:p-4">
      <p className="text-sm font-semibold text-foreground">Help improve TradeHQ? (optional)</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        If you opt in, Amplitude measures limited Practice Arena activity and whether a
        leaderboard visit leads to a new account within seven days. It uses a browser
        identifier and network metadata, but receives no answers, portfolio data,
        names or emails from our events. There is no session replay or automatic
        click recording. You can decline without losing any features.
        {" "}<Link to="/privacy" className="text-primary underline">Privacy details</Link>.
      </p>
      <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3 text-xs leading-relaxed">
        <input type="checkbox" checked={isAdult} onChange={e => setIsAdult(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-primary" />
        <span>I am 18 or older and agree to this optional analytics. Under 18? Choose Reject; TradeHQ still works.</span>
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => save("rejected")}
          className="min-h-11 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted">
          Reject analytics
        </button>
        <button type="button" disabled={!isAdult} onClick={() => save("accepted")}
          className="min-h-11 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40">
          Accept optional analytics
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
        Your choice is saved in this browser. Change it later from the footer.
        Advertising privacy choices are separate where legally required.
      </p>
    </div>
  );
}
