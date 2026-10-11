import assert from "node:assert/strict";

export const EVIDENCE_REPOSITORY = "anugaweerasinghe1-del/trading101";
export const EVIDENCE_REPOSITORY_ID = 1130435580;
const root = "https://api.github.com/repos/" + EVIDENCE_REPOSITORY;
const pageSize = 100, maxPages = 5;

async function boundedText(response, limit) {
  const advertised = response.headers.get("content-length");
  assert.ok(!advertised || (/^[0-9]+$/.test(advertised) && Number(advertised) <= limit), "Evidence response exceeds size limit.");
  assert.ok(response.body, "Missing evidence response body.");
  let bytes = 0;
  const chunks = [];
  const reader = response.body.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      assert.ok(bytes <= limit, "Evidence response exceeds size limit.");
      chunks.push(Buffer.from(value));
    }
  } finally { await reader.cancel(); }
  return Buffer.concat(chunks).toString("utf8");
}

export function createGithubEvidenceReader({ fetchImpl = fetch, token = process.env.GITHUB_TOKEN, now = Date.now } = {}) {
  let requests = 0;
  const deadline = now() + 120_000;
  async function request(url, authenticated = true) {
    assert.ok(++requests <= 50 && now() <= deadline, "Evidence request/time budget exhausted.");
    const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (authenticated && token) headers.Authorization = "Bearer " + token;
    // Credentials never follow redirects or appear in URLs, errors or packets.
    return fetchImpl(url, { method: "GET", redirect: "manual", headers, signal: AbortSignal.timeout(15_000) });
  }
  function apiUrl(path) {
    assert.ok(typeof path === "string" && (path === "" || path.startsWith("/"))
      && !path.split("/").some(x => x === "." || x === "..") && !/[\\#\r\n]/.test(path), "Invalid repository evidence path.");
    const url = new URL(root + path);
    assert.equal(url.origin, "https://api.github.com");
    assert.ok(url.pathname === new URL(root).pathname || url.pathname.startsWith(new URL(root).pathname + "/"));
    return url;
  }
  async function jsonResponse(path) {
    const response = await request(apiUrl(path).href);
    assert.equal(response.status, 200, "GitHub evidence unavailable (HTTP " + response.status + "); no retries or permission expansion.");
    let data;
    try { data = JSON.parse(await boundedText(response, 2_000_000)); } catch { throw Error("Malformed or oversized GitHub evidence."); }
    assert.ok(now() <= deadline, "Evidence time budget exhausted.");
    return { data, link: response.headers.get("link") };
  }
  async function get(path) { return (await jsonResponse(path)).data; }
  async function list(path, key) {
    const base = apiUrl(path);
    assert.ok(!base.searchParams.has("page") && !base.searchParams.has("per_page"), "Pagination must be controlled by the reader.");
    const all = [], ids = new Set();
    let total;
    for (let page = 1; page <= maxPages; page++) {
      const current = new URL(base); current.searchParams.set("per_page", String(pageSize)); current.searchParams.set("page", String(page));
      const { data, link } = await jsonResponse(current.href.slice(root.length));
      const items = key ? data?.[key] : data;
      assert.ok(Array.isArray(items) && items.length <= pageSize, "Malformed evidence page.");
      if (key) {
        assert.ok(Number.isSafeInteger(data.total_count) && data.total_count >= 0 && data.total_count <= pageSize * maxPages, "Missing or excessive pagination total.");
        if (total === undefined) total = data.total_count;
        assert.equal(data.total_count, total, "Pagination total changed during collection.");
      }
      for (const item of items) {
        assert.ok(Number.isSafeInteger(item?.id) && item.id > 0 && !ids.has(item.id), "Duplicate or malformed paginated evidence ID.");
        ids.add(item.id); all.push(item);
      }
      const links = new Map();
      if (link) {
        for (const part of link.split(",")) {
          const match = part.trim().match(/^<([^>]+)>;\s*rel="(next|prev|first|last)"$/);
          assert.ok(match && !links.has(match[2]), "Ambiguous pagination links.");
          const url = new URL(match[1]);
          assert.equal(url.origin, base.origin, "Pagination changed evidence origin.");
          assert.equal(url.pathname, base.pathname, "Pagination changed evidence resource.");
          const n = Number(url.searchParams.get("page"));
          assert.ok(Number.isSafeInteger(n) && n >= 1 && n <= maxPages, "Pagination gap or budget exceeded.");
          if (match[2] === "prev") assert.equal(n, page - 1, "Invalid previous pagination link.");
          if (match[2] === "first") assert.equal(n, 1, "Invalid first pagination link.");
          if (match[2] === "last") assert.ok(n >= page, "Invalid last pagination link.");
          url.searchParams.delete("page"); url.searchParams.delete("per_page");
          assert.equal(url.searchParams.toString(), base.searchParams.toString(), "Pagination changed evidence query.");
          assert.equal(new URL(match[1]).searchParams.get("per_page"), String(pageSize), "Pagination page size changed.");
          links.set(match[2], n);
        }
      }
      const next = links.get("next");
      if (next !== undefined) {
        assert.equal(next, page + 1, "Pagination gap.");
        assert.equal(items.length, pageSize, "Incomplete intermediate page.");
        assert.ok(page < maxPages, "Pagination budget exceeded.");
      } else {
        assert.ok(!links.has("last") || links.get("last") <= page, "Missing next pagination link.");
        if (key) assert.equal(all.length, total, "Missing paginated evidence.");
        else assert.ok(items.length < pageSize, "Full terminal page without total is ambiguous.");
        return all;
      }
    }
    throw Error("Incomplete pagination.");
  }
  async function logs(jobId) {
    assert.ok(Number.isSafeInteger(jobId) && jobId > 0, "Invalid evidence job.");
    let response = await request(root + "/actions/jobs/" + jobId + "/logs");
    if (response.status === 302) {
      const url = new URL(response.headers.get("location") || "");
      assert.ok(url.protocol === "https:" && !url.username && !url.password && !url.hash
        && /^[a-z0-9-]+\.blob\.core\.windows\.net$/.test(url.hostname), "Untrusted job-log redirect.");
      // Only the trusted API's one-time log location is used; it is never persisted.
      response = await request(url.href, false);
    }
    assert.equal(response.status, 200, "Trusted job logs unavailable; evidence blocked.");
    const text = await boundedText(response, 4_000_000);
    assert.ok(now() <= deadline, "Evidence time budget exhausted.");
    return text;
  }
  return { get, list, logs, requestCount: () => requests };
}
