/** Isolated compiled-content/browser regression. No production accounts or writes. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, existsSync, mkdtempSync } from "node:fs";
import { rm } from "node:fs/promises";
import { resolve, join, extname } from "node:path";
import { tmpdir } from "node:os";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { renderApprovedCourse } from "../src/lib/courseHtml.ts";
import { waitForChromePort } from "./isolated-chrome-startup.mjs";

const chrome = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"].find(name => spawnSync("which", [name]).status === 0);
assert.ok(chrome, "Chromium unavailable; this browser check has NOT passed");
const temp = mkdtempSync(join(tmpdir(), "tradehq-publisher-browser-"));
const dist = resolve("dist");
const docs = JSON.parse(readFileSync("scripts/fixtures/published-course-editorial.json", "utf8"));
const routes = [...readFileSync("dist/sitemap.xml", "utf8").matchAll(/<loc>https:\/\/www.thetradehq.com([^<]*)<\/loc>/g)].map(match => match[1] || "/");
for (const { document: doc } of docs) routes.push("/courses/" + doc.slug, ...doc.lessons.map(lesson => "/courses/" + doc.slug + "/" + lesson.slug));
assert.equal(new Set(routes).size, routes.length);
const mime = { ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".html": "text/html" };
const server = createServer((request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  const doc = docs.find(row => path === "/courses/" + row.slug || path.startsWith("/courses/" + row.slug + "/"))?.document;
  if (doc) {
    const html = renderApprovedCourse(readFileSync(join(dist, "app-shell.html"), "utf8"), doc, path.split("/")[3]);
    response.writeHead(html ? 200 : 404, { "Content-Type": "text/html" }); response.end(html || "Missing"); return;
  }
  let file = resolve(dist, "." + (path === "/" ? "/index.html" : path));
  if (!file.startsWith(dist + "/")) { response.writeHead(404); response.end(); return; }
  if (existsSync(file + ".html")) file += ".html";
  else if (existsSync(join(file, "index.html"))) file = join(file, "index.html");
  try { response.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" }); response.end(readFileSync(file)); }
  catch { response.writeHead(404); response.end("Missing"); }
});
let browser, socket;
try {
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const origin = "http://127.0.0.1:" + server.address().port;
  browser = spawn(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--no-first-run", "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0", "--user-data-dir=" + temp, "about:blank"], { stdio: "ignore", detached: process.platform !== "win32" });
  let launchError; browser.on("error", error => { launchError = error; });
  const port = await waitForChromePort({ readPort: () => { try { return readFileSync(join(temp, "DevToolsActivePort"), "utf8").split("\n")[0]; } catch { return null; } }, processState: () => browser, launchError: () => launchError, delay });
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(pages.find(page => page.type === "page").webSocketDebuggerUrl); await once(socket, "open");
  const pending = new Map(); let sequence = 0;
  socket.addEventListener("message", event => {
    const reply = JSON.parse(event.data); const task = pending.get(reply.id); if (!task) return;
    pending.delete(reply.id); clearTimeout(task.timer); if (reply.error) task.reject(Error(reply.error.message)); else task.resolve(reply.result);
  });
  const send = (method, params = {}) => new Promise((resolveTask, reject) => {
    const id = ++sequence; const timer = setTimeout(() => { pending.delete(id); reject(Error("CDP timeout: " + method)); }, 10000);
    pending.set(id, { resolve: resolveTask, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => { const result = await send("Runtime.evaluate", { expression, returnByValue: true }); assert.ok(!result.exceptionDetails, "Browser evaluation failed"); return result.result?.value; };
  await send("Page.enable"); await send("Network.enable");
  // Fulfil HTTPS requests inside the fixture. Published-course reads use the
  // same recorded anonymous documents; no real account or service is touched.
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.method !== "Fetch.requestPaused") return;
    const {requestId, request} = message.params;
    const url = new URL(request.url); let payload = [];
    if (url.pathname.endsWith("/get_published_course_catalog")) payload = docs.map(row => row.document);
    else if (url.pathname.endsWith("/published_courses")) {
      const slug = url.searchParams.get("slug")?.replace(/^eq\./, "");
      const doc = docs.find(row => row.slug === slug)?.document;
      const object = Object.entries(request.headers).some(([key,value]) => key.toLowerCase() === "accept" && String(value).includes("vnd.pgrst.object"));
      payload = doc ? (object ? {document:doc} : [{document:doc}]) : (object ? null : []);
    }
    send("Fetch.fulfillRequest", {requestId, responseCode: request.method === "OPTIONS" ? 204 : 200,
      responseHeaders: [{name:"Content-Type",value:"application/json"},{name:"Access-Control-Allow-Origin",value:"*"},{name:"Access-Control-Allow-Headers",value:request.headers["Access-Control-Request-Headers"] || request.headers["access-control-request-headers"] || "apikey,authorization,x-client-info,content-type,accept,accept-profile,prefer"},{name:"Access-Control-Allow-Methods",value:"GET,POST,OPTIONS"}],
      body: request.method === "OPTIONS" ? "" : Buffer.from(JSON.stringify(payload)).toString("base64")}).catch(error => console.error("Fixture HTTPS fulfilment:", error.message));
  });
  await send("Fetch.enable", {patterns:[{urlPattern:"https://*"}]});
  let checked = 0;
  for (const width of [360, 1280]) for (const javaScript of [false, true]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width === 360 });
    await send("Emulation.setScriptExecutionDisabled", { value: !javaScript });
    for (const path of routes) {
      const bundled = !docs.some(row => path === "/courses/" + row.slug || path.startsWith("/courses/" + row.slug + "/"));
      await send("Page.navigate", { url: origin + path });
      const expected = "https://www.thetradehq.com" + path;
      const deadline = Date.now() + 12000; let ready = false;
      while (Date.now() < deadline) {
        ready = await evaluate(`location.pathname === ${JSON.stringify(path)} && document.readyState === "complete" && document.querySelectorAll('link[rel="canonical"]').length === 1 && document.querySelector('link[rel="canonical"]').href === ${JSON.stringify(expected)} ${javaScript ? "&& !document.querySelector('#prerender-seo') && !!document.querySelector('button[aria-label*=\"theme\"]')" : ""} ${javaScript && bundled ? "&& !!document.querySelector('[data-publisher-notes]')" : ""}`);
        if (ready) break; await delay(50);
      }
      assert.ok(ready, `${path}: content/canonical readiness (${width}px, JS=${javaScript})`);
      const observation = await evaluate(`({h1:document.querySelectorAll('h1').length, overflow:document.documentElement.scrollWidth > innerWidth + 1, notes:document.querySelector('[data-publisher-notes]')?.getAttribute('data-publisher-notes')})`);
      assert.equal(observation.h1, 1, `${path}: one H1 (${width}px, JS=${javaScript})`);
      assert.equal(observation.overflow, false, `${path}: horizontal overflow (${width}px, JS=${javaScript})`);
      if (bundled) assert.equal(observation.notes, path, path + ": publisher content remains visible");
      checked++;
      if (checked % 50 === 0) console.log(`Verified ${checked} compiled browser visits`);
    }
  }
  console.log(`PASS real Chromium: ${checked} compiled route visits (${routes.length} URLs × desktop/mobile × JS on/off), canonical/H1/content parity and overflow. Native courses use read-only published fixtures, not production services.`);
} finally {
  socket?.close();
  // Chromium forks subprocesses; waiting only for its parent can leave a child
  // writing into Default/ while fs.rmdir traverses the temporary profile.
  // A detached POSIX process group allows us to stop all isolated Chromium
  // children, even if the initial browser process has already exited.
  const waitForExit = browser && browser.exitCode === null && browser.signalCode === null
    ? once(browser, "exit") : null;
  if (browser?.pid && process.platform !== "win32") {
    try { process.kill(-browser.pid, "SIGKILL"); }
    catch (error) { if (error.code !== "ESRCH") throw error; }
  } else if (waitForExit) {
    browser.kill("SIGKILL");
  }
  if (waitForExit) await waitForExit;
  server.closeAllConnections(); await new Promise(resolveDone => server.close(resolveDone));
  // Give platform-specific shutdown helpers a bounded settling window and
  // preserve cleanup as a real failing check if deletion remains impossible.
  await delay(250);
  await rm(temp, { recursive: true, force: true, maxRetries: 20, retryDelay: 200 });
}
