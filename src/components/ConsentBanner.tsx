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

  useEffect(() => {
    if (choice === "accepted") loadConsentedAnalytics();
  }, [choice]);

  useEffect(() => {
    const reopen = () => setChoice(null);
    window.addEventListener("tradehq:open-consent", reopen);
    return () => window.removeEventListener("tradehq:open-consent", reopen);
  }, []);

  // The accept button explicitly confirms adulthood and optional analytics
  // consent in one action; Reject never asks for an age declaration.
  const save = (next: ConsentChoice, adultConfirmed = false) => {
    if (next === "accepted" && !adultConfirmed) return;
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
    if (next === "rejected" && previous === "accepted") {
      (window as any).amplitude?.setOptOut?.(true);
      // Unload initialized SDK listeners; deleting its script would not stop it.
      window.location.reload();
    }
  };

  if (choice) return null;

  return (
    <section role="region" aria-label="Optional analytics choices"
      className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-[120] mx-auto max-w-[22rem] rounded-xl border border-border bg-background/95 p-2.5 shadow-lg backdrop-blur-xl md:inset-x-auto md:bottom-4 md:right-4 md:mx-0 md:w-[22rem]">
      <p className="text-[11px] leading-4 text-muted-foreground">
        <strong className="font-semibold text-foreground">Optional analytics.</strong>{" "}
        Help improve practice and sign-ups using a browser ID. No answers or trades.{" "}
        <Link to="/privacy" className="font-medium text-primary underline underline-offset-2">Details</Link>
      </p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => save("rejected")}
          className="min-h-10 flex-1 rounded-lg border border-border px-2 text-xs font-semibold text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          Reject
        </button>
        <button type="button" onClick={() => save("accepted", true)}
          aria-label="I confirm I am 18 or older and consent to optional analytics"
          className="min-h-10 flex-[2] rounded-lg bg-primary px-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          I'm 18+ · Accept analytics
        </button>
      </div>
    </section>
  );
}
