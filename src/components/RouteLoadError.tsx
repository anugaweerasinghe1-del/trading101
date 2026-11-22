import { useEffect, useState } from "react";
import { useRouteError } from "react-router-dom";
import { claimRouteReload, isRouteModuleLoadError } from "@/lib/routeLoadRecovery";

/** Eagerly bundled so recovery never depends on the missing route module. */
export function RouteLoadError() {
  const error = useRouteError();
  const moduleFailure = isRouteModuleLoadError(error);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    try {
      if (claimRouteReload(error, window.location, navigator.onLine, window.sessionStorage)) {
        setRefreshing(true);
        window.location.reload();
      }
    } catch {
      // Browser storage/access can be restricted; leave manual recovery available.
    }
  }, [error]);

  return (
    <main data-route-recovery className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">{moduleFailure ? "This page needs a refresh" : "Something went wrong"}</h1>
        <p className="mt-3 text-muted-foreground" role="status" aria-live="polite">
          {refreshing ? "Loading the latest version of TradeHQ." : moduleFailure
            ? "A page file could not be loaded. TradeHQ may have updated, or your connection may have been interrupted. Refresh to try again."
            : "TradeHQ could not display this page. Try refreshing, or return to the home page."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center items-center gap-4">
          <button type="button" className="rounded-lg bg-primary text-primary-foreground px-5 py-3 font-semibold" onClick={() => window.location.reload()}>Refresh page</button>
          <a href="/" className="text-primary underline underline-offset-4">Return home</a>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Refreshing does not clear saved browser data, but unsaved changes may be lost.</p>
      </div>
    </main>
  );
}
