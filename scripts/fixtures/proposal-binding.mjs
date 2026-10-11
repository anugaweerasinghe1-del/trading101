// Test preload only. Every request is intercepted; no real key, API or issue is used.
import { readFileSync } from "node:fs";
let gemini = 0;
globalThis.fetch = async (url, options = {}) => {
  const method = options.method || "GET";
  let data;
  if (url.startsWith("https://generativelanguage.googleapis.com/")) {
    const value = ++gemini === 1 ? { paths: ["src/pages/About.tsx"] }
      : { changes: [{ path: "src/pages/About.tsx", content: readFileSync("src/pages/About.tsx", "utf8").replace("mb-4", "mb-3 sm:mb-4") }] };
    data = { candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(value) }] } }] };
  } else if (url.startsWith("https://api.github.com/repos/anugaweerasinghe1-del/trading101")) {
    if (url.endsWith("/issues/999")) data = { user: { login: "anugaweerasinghe1-del" }, title: "[TradeHQ Code Request]", state: "open", body: "Improve only the About heading spacing in this disposable offline fixture." };
    else if (url.endsWith("/git/ref/heads/main")) data = { object: { sha: "a".repeat(40) } };
    else if (url.includes("/git/ref/heads/ai/")) data = { object: { sha: (process.env.MOCK_MOVED === "1" ? "c" : "b").repeat(40) } };
    else if (method === "PUT") data = { commit: { sha: "b".repeat(40) } };
    else if (url.includes("/contents/")) data = { sha: "d".repeat(40) };
    else if (url.endsWith("/pulls")) data = { html_url: "https://github.com/anugaweerasinghe1-del/trading101/pull/999", head: { sha: "b".repeat(40) } };
    else if (url.endsWith("/git/refs") || url.endsWith("/comments")) data = {};
    else throw Error("Unexpected GitHub endpoint blocked by offline fixture");
  } else throw Error("Unexpected request blocked by offline fixture");
  return { ok: true, status: 200, json: async () => data };
};
