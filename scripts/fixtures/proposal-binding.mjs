// Test preload only. Every request is intercepted; no real key, API or issue is used.
import { readFileSync } from "node:fs";
let gemini = 0;
let issueReads = 0;
const snapshot = () => JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,"utf8"));
globalThis.fetch = async (url, options = {}) => {
  const method = options.method || "GET";
  let data;
  if (url.startsWith("https://generativelanguage.googleapis.com/")) {
    if (options.redirect !== 'error') throw Error('Offline proposal must reject provider redirects');
    const value = ++gemini === 1 ? { paths: ["src/pages/About.tsx"] }
      : { changes: [{ path: "src/pages/About.tsx", content: readFileSync("src/pages/About.tsx", "utf8").replace("mb-4", "mb-3 sm:mb-4") }] };
    data = { candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(value) }] } }] };
    return new Response(JSON.stringify(data), { status: 200 });
  } else if (url.startsWith("https://api.github.com/repos/anugaweerasinghe1-del/trading101")) {
    if (url.endsWith("/issues/999")) {
      data = {...snapshot().issue};
      if (++issueReads>1 && process.env.MOCK_ISSUE_CHANGED==="1") data.body+=" unauthorized edit";
    }
    else if (url.endsWith("/trading101")) data = snapshot().repository;
    else if (url.includes("/issues?state=all&per_page=100&page=1")) data = [snapshot().issue];
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
