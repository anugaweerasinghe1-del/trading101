import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type ConsentChoice = "accepted" | "rejected";
const STORAGE_KEY = "tradehq_consent_v1";
const AMPLITUDE_API_KEY = "44108a3c4bd34ff14004fa66198d9f20";

function appendScript(id: string, src: string, onload?: () => void) {
  if (document.getElementById(id)) {
    onload?.();
    return;
  }
  const script = document.createElement("script");
  script.id = id;
  script.src = src;
  script.async = true;
  if (onload) script.onload = onload;
  document.head.appendChild(script);
}

function loadConsentedAnalytics() {
  appendScript(
    "tradehq-amplitude",
    `https://cdn.amplitude.com/script/${AMPLITUDE_API_KEY}.js`,
    () => {
      appendScript(
        "tradehq-amplitude-engagement",
        `https://cdn.amplitude.com/script/${AMPLITUDE_API_KEY}.engagement.js`,
        () => {
          const w = window as any;
          if (!w.amplitude || w.__tradehqAmplitudeStarted) return;
          w.__tradehqAmplitudeStarted = true;
          if (w.engagement?.plugin) w.amplitude.add(w.engagement.plugin());
          if (w.sessionReplay?.plugin) w.amplitude.add(w.sessionReplay.plugin({ sampleRate: 1 }));
          w.amplitude.init(AMPLITUDE_API_KEY, { fetchRemoteConfig: true, autocapture: true });
        },
      );
    },
  );
}

export function ConsentBanner() {
  const [choice, setChoice] = useState<ConsentChoice | null>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "accepted" || stored === "rejected" ? stored : null;
  });

  useEffect(() => {
    if (choice === "accepted") loadConsentedAnalytics();
  }, [choice]);

  useEffect(() => {
    const reopen = () => setChoice(null);
    window.addEventListener("tradehq:open-consent", reopen);
    return () => window.removeEventListener("tradehq:open-consent", reopen);
  }, []);

  const save = (next: ConsentChoice) => {
    const previous = window.localStorage.getItem(STORAGE_KEY);
    window.localStorage.setItem(STORAGE_KEY, next);
    setChoice(next);
    // An already initialized SDK keeps running when its script tag is removed.
    // Reload with the stored rejection so no optional SDK is initialized again.
    if (next === "rejected" && previous === "accepted") {
      (window as any).amplitude?.setOptOut?.(true);
      window.location.reload();
    }
  };

  if (choice) return null;

  return (
    <div
      role="dialog"
      aria-label="Analytics choices"
      className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-[120] mx-auto max-h-[65dvh] overflow-y-auto rounded-2xl border border-border bg-background/95 p-3 shadow-2xl backdrop-blur-xl md:inset-x-auto md:bottom-5 md:right-5 md:mx-0 md:w-[min(25rem,calc(100vw-2.5rem))] md:p-4"
    >
      <p className="text-sm font-semibold text-foreground">Analytics choices</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        TradeHQ uses essential browser storage for the simulator. Optional analytics are blocked
        until you accept them. You can reject analytics and still use the core site.
        See the <Link to="/privacy" className="text-primary hover:underline">privacy policy</Link>.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => save("rejected")}
          className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
        >
          Reject analytics
        </button>
        <button
          type="button"
          onClick={() => save("accepted")}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Accept analytics
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
        This choice controls Amplitude analytics. Google provides separate advertising privacy
        choices where they apply.
      </p>
    </div>
  );
}
