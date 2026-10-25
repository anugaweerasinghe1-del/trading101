import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { PublisherNotes, type PublisherPage } from "./PublisherNotes";
import { hasIntegratedCourseOverview } from "@/lib/courseOverviewPresentation";

const initialPath = window.location.pathname.replace(/\/+$/, "") || "/";
let initialPage: PublisherPage | null = null;
try {
  const data = document.getElementById("publisher-notes-data")?.textContent;
  if (data) initialPage = JSON.parse(data);
} catch { /* A missing snapshot can still be fetched on navigation. */ }

export function RoutePublisherNotes() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  // These authored page components already render every substantive section
  // and reference in their main landmark; do not append a second full article.
  const hasPrimaryCopy = /^\/(?:wiki|strategy|compare)\/[^/]+$/.test(path) || /^\/learn\/article\/[^/]+$/.test(path) || hasIntegratedCourseOverview(path) || /^\/how-to-trade\/(?:btc|eth|nvda|sol|spy|tsla)$/.test(path);
  const [page, setPage] = useState<PublisherPage | null>(initialPage);
  useEffect(() => {
    if (hasPrimaryCopy) {
      setPage(null);
      return;
    }
    if (path === initialPath) {
      setPage(initialPage);
      return;
    }
    const controller = new AbortController();
    setPage(null);
    fetch(`/publisher-notes${path === "/" ? "" : path}/index.json`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!controller.signal.aborted) setPage(data?.path === path ? data : null); })
      .catch(() => { /* No notes for utility or unknown routes. */ });
    return () => controller.abort();
  }, [path, hasPrimaryCopy]);
  return !hasPrimaryCopy && page?.path === path ? <PublisherNotes page={page} /> : null;
}
