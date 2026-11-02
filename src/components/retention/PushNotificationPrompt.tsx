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
          <div className="text-sm font-bold text-foreground">Allow browser notifications?</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            This only grants browser permission. TradeHQ does not currently send scheduled daily or watchlist alerts.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={async () => {
                await requestPushPermission();
                setShow(false);
              }}
              className="inline-flex items-center px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 active:scale-[0.97] transition"
            >
              Enable
            </button>
            <button
              onClick={() => {
                dismissPushPrompt();
                setShow(false);
              }}
              className="inline-flex items-center px-3 h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
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
          className="p-1 rounded hover:bg-white/[0.05]"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}