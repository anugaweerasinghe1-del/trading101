import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/**
 * index.html ships sitewide fallback meta tags (description, robots, og:*,
 * twitter:*) so non-JS crawlers always see something. react-helmet-async
 * appends its own per-route tags instead of replacing those, which left two
 * competing descriptions in the DOM on every page. Once Helmet has painted
 * the per-route head, drop the static fallbacks.
 */
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.head
      .querySelectorAll("meta[data-static-head], link[data-static-head]")
      .forEach((el) => el.remove());
  });
});
