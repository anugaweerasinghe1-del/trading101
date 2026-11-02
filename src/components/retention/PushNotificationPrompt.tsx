import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import {
  dismissPushPrompt,
  requestPushPermission,
  shouldPromptForPush,
} from "@/lib/pushNotifications";
import { isReturningUser } from "@/lib/lastVisit";

/**
 * Subtle, dismissible notification-permission opt-in.
 * TradeHQ does not currently deliver scheduled background alerts.
 */
export function PushNotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Delay a beat so it doesn't compete with LCP.
    const t = setTimeout(() => {
      if (shouldPromptForPush(isReturningUser())) setShow(true);
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Enable notifications"
      data-testid="notification-prompt"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-40 max-h-[calc(100dvh-9rem)] overflow-y-auto overscroll-contain rounded-2xl border border-primary/35 bg-background/95 p-4 shadow-2xl backdrop-blur-xl md:bottom-6 md:left-auto md:right-6 md:max-h-[calc(100dvh-3rem)] md:max-w-sm"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Bell className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-snug text-foreground sm:text-base">Allow browser notifications?</div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            This only grants browser permission. TradeHQ does not currently send scheduled daily or watchlist alerts.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={async () => {
                await requestPushPermission();
                setShow(false);
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.97]"
            >
              Enable
            </button>
            <button
              onClick={() => {
                dismissPushPrompt();
                setShow(false);
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-medium text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={() => {
            dismissPushPrompt();
            setShow(false);
          }}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}