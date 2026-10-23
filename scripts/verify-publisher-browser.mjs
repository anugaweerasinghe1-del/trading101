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
import { NICHE_SYMBOLS, getNicheAsset } from "../src/lib/nicheData.ts";
import { ASSETS } from "../src/lib/assets.ts";

const chrome = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"].find(name => spawnSync("which", [name]).status === 0);
assert.ok(chrome, "Chromium unavailable; this browser check has NOT passed");
const phase = process.env.TRADEHQ_BROWSER_PHASE === undefined ? null : Number(process.env.TRADEHQ_BROWSER_PHASE);
assert.ok(phase === null || (Number.isInteger(phase) && phase >= 0 && phase <= 6), "Invalid browser phase");
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
    if (method === "Page.navigate") console.log("BROWSER_NAVIGATE " + params.url);
    const id = ++sequence; const timer = setTimeout(() => { pending.delete(id); reject(Error("CDP timeout: " + method + (params.url ? " " + params.url : ""))); }, 10000);
    pending.set(id, { resolve: resolveTask, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => { const result = await send("Runtime.evaluate", { expression, returnByValue: true }); assert.ok(!result.exceptionDetails, "Browser evaluation failed"); return result.result?.value; };
  const runtimeErrors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') {
      const detail = message.params.exceptionDetails;
      runtimeErrors.push(JSON.stringify({
        description: detail.exception?.description || detail.text,
        page: 'visible-compiled-fixture',
        source: detail.url || detail.stackTrace?.callFrames?.[0]?.url || '',
        line: detail.lineNumber,
      }));
    }
  });
  await send("Page.enable"); await send("Network.enable"); await send("Runtime.enable");
  // Record transient head regressions as well as the settled metadata. A page
  // that temporarily changes its authored canonical or emits noindex while
  // quotes load must fail even if a later render repairs the tags.
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `
    window.__publisherAssetHeadErrors = [];
    new MutationObserver(() => {
      if (!location.pathname.startsWith('/trade/')) return;
      const canonical = document.querySelector('link[rel="canonical"]');
      const robots = document.querySelector('meta[name="robots"]');
      const expected = 'https://www.thetradehq.com' + location.pathname;
      const error = canonical && canonical.href !== expected ? 'canonical: ' + canonical.href
        : robots && /noindex/i.test(robots.content) ? 'robots: ' + robots.content : null;
      if (error && !window.__publisherAssetHeadErrors.includes(error)) window.__publisherAssetHeadErrors.push(error);
    }).observe(document, { subtree: true, childList: true, attributes: true });
  ` });
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
  const semanticFailures = new Map();
  // Fresh Chromium per phase prevents stale contexts from accumulating across
  // 620 separate navigations and isolates the trade, portfolio, and lesson interaction flows. Assertions remain unchanged for every visit.
  const phases = [[360, false], [360, true], [1280, false], [1280, true]];
  for (const [phaseNumber, [width, javaScript]] of phases.entries()) {
    if (phase !== null && phase !== phaseNumber) continue;
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width === 360 });
    await send("Emulation.setScriptExecutionDisabled", { value: !javaScript });
    for (const path of routes) {
      const bundled = !docs.some(row => path === "/courses/" + row.slug || path.startsWith("/courses/" + row.slug + "/"));
      console.log(`BROWSER_VISIT phase=${phaseNumber} path=${path}`);
      await send("Page.navigate", { url: origin + path });
      const expected = "https://www.thetradehq.com" + path;
      const deadline = Date.now() + 12000; let ready = false;
      while (Date.now() < deadline) {
        ready = await evaluate(`location.pathname === ${JSON.stringify(path)} && document.readyState === "complete" && document.querySelectorAll('h1').length === 1 && !document.querySelector('h1').textContent.includes('Loading your page') && document.querySelectorAll('link[rel="canonical"]').length === 1 && document.querySelector('link[rel="canonical"]').href === ${JSON.stringify(expected)} ${javaScript ? "&& !document.querySelector('#prerender-seo') && !!document.querySelector('button[aria-label*=\"theme\"]')" : ""} ${javaScript && bundled ? "&& !!document.querySelector('[data-publisher-notes]')" : ""}`);
        if (ready) break; await delay(50);
      }
      assert.ok(ready, `${path}: content/canonical readiness (${width}px, JS=${javaScript})`);
      if (javaScript && path.startsWith('/trade/')) {
        assert.deepEqual(await evaluate('window.__publisherAssetHeadErrors'), [], `${path}: stable metadata during hydration (${width}px)`);
      }
      const observation = await evaluate(`({main:document.querySelectorAll('main').length,h1:document.querySelectorAll('h1').length, overflow:document.documentElement.scrollWidth > innerWidth + 1, notes:document.querySelector('[data-publisher-notes]')?.getAttribute('data-publisher-notes')})`);
      assert.equal(observation.main, 1, `${path}: one main content landmark (${width}px, JS=${javaScript})`);
      assert.equal(observation.h1, 1, `${path}: one H1 (${width}px, JS=${javaScript})`);
      assert.equal(observation.overflow, false, `${path}: horizontal overflow (${width}px, JS=${javaScript})`);
      if (bundled) assert.equal(observation.notes, path, path + ": publisher content remains visible");
      const primaryCopy = /^\/(?:wiki|strategy)\/[^/]+$/.test(path) || /^\/learn\/article\/[^/]+$/.test(path);
      if (javaScript && bundled && primaryCopy) {
        const page = JSON.parse(readFileSync(join(dist, "publisher-notes", path, "index.json"), "utf8"));
        const normalizedMain = await evaluate(`document.querySelector('main').textContent.replace(/\\s+/g, ' ').trim().toLowerCase()`);
        const normalize = text => text.replace(/\s+/g, ' ').trim().toLowerCase();
        for (const section of page.sections) {
          if (["Publisher and editorial transparency", "Practise what you just read"].includes(section.h)) continue;
          for (const text of [...(section.p || []), ...(section.list || [])].filter(Boolean)) {
            assert.ok(normalizedMain.includes(normalize(text)), path + ": preserve substantive section " + section.h);
          }
        }
        const externalLinks = await evaluate(`Array.from(document.querySelectorAll('main a[href]')).map(a => a.href)`);
        for (const link of page.links.filter(link => /^https?:/.test(link.href))) {
          assert.ok(externalLinks.includes(link.href), path + ": preserve primary reference " + link.href);
        }
        assert.equal(await evaluate(`document.querySelectorAll('[data-publisher-notes]').length`), 1, path + ": one authored article");
        assert.equal(await evaluate(`document.querySelector('[data-publisher-notes]').tagName`), "MAIN", path + ": article precedes footer");
      }
      if (javaScript) {
        const issues = await evaluate(`(() => {
          const visible = e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
          const named = e => (e.getAttribute('aria-label') || e.getAttribute('aria-labelledby')?.split(/\\s+/).map(id=>document.getElementById(id)?.textContent || '').join(' ') || e.labels && Array.from(e.labels).map(l=>l.textContent).join(' ') || ((e.matches('button,a')) ? e.textContent : '') || e.getAttribute('title') || '').trim();
          return Array.from(document.querySelectorAll('button, a[href], input:not([type="hidden"]), textarea, [role="switch"], [role="slider"]')).filter(visible).flatMap(e => {
            const issues = [];
            if (!named(e) && !e.querySelector('img[alt]:not([alt=""])')) issues.push('Unnamed control: ' + e.outerHTML.slice(0,400));
            if (e.matches('button,a') && e.querySelector('button,a[href],input,select,textarea')) issues.push('Nested interactive: '+ e.outerHTML.slice(0,400));
            return issues;
          });
        })()`);
        for (const issue of issues) { if (!semanticFailures.has(issue)) semanticFailures.set(issue, []); semanticFailures.get(issue).push(path + '@' + width); }
      }
      checked++;
      if (checked % 50 === 0) console.log(`Verified ${checked} compiled browser visits`);
    }
  }
  assert.deepEqual(Object.fromEntries(semanticFailures), {}, 'Visible controls need accessible names and valid interaction nesting');
  if (phase === null || phase >= 4) {
  // Exercise keyboard navigation and the read-only selector/mentor in the isolated compiled build.
  await send("Emulation.setScriptExecutionDisabled", {value:false});
  await send("Emulation.setDeviceMetricsOverride", {width:360,height:900,deviceScaleFactor:1,mobile:true});
  const waitUntil = async (expression, label) => {
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) { if (await evaluate(expression)) return; await delay(50); }
    assert.fail(label);
  };
  if (phase === null || phase === 4) {
  await send('Page.navigate', {url:origin+'/trade'});
  await waitUntil(`!!document.querySelector('button[aria-label="Open portfolio educational mentor"]')`, 'Trade interface must mount');
  await evaluate(`document.querySelector('button[aria-controls="asset-search-panel"]').click()`);
  await waitUntil(`!!document.querySelector('#asset-search-panel input')`, 'Asset search must open');
  assert.equal(await evaluate(`!!document.querySelector('#asset-search-panel button button')`), false);
  await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Escape',code:'Escape'});
  await waitUntil(`!document.querySelector('#asset-search-panel') && document.activeElement?.getAttribute('aria-controls') === 'asset-search-panel'`, 'Escape must close asset search and restore focus');
  await evaluate(`document.querySelector('button[aria-label="Open portfolio educational mentor"]').click()`);
  await waitUntil(`document.activeElement?.getAttribute('aria-label') === 'Close portfolio educational mentor'`, 'Mentor close control receives focus');
  await waitUntil(`(() => { const r=document.querySelector('[role="dialog"][aria-label="Portfolio educational mentor"]').getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight; })()`, 'Mentor must settle inside mobile viewport');
  await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Escape',code:'Escape'});
  await waitUntil(`document.activeElement?.getAttribute('aria-label') === 'Open portfolio educational mentor'`, 'Mentor Escape restores launcher focus');
  await evaluate(`document.querySelector('button[aria-controls="site-menu"]').click()`);
  await waitUntil(`document.querySelector('#site-menu')?.contains(document.activeElement)`, 'Site menu receives focus');
  await evaluate(`Array.from(document.querySelectorAll('#site-menu a, #site-menu button')).at(-1).focus()`);
  await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Tab',code:'Tab'});
  assert.equal(await evaluate(`document.activeElement === document.querySelector('#site-menu button')`),true,'Menu focus must wrap');
  await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Escape',code:'Escape'});
  await waitUntil(`document.activeElement?.getAttribute('aria-controls') === 'site-menu' && getComputedStyle(document.querySelector('#site-menu')).visibility === 'hidden'`, 'Closed menu is hidden and focus returns');
  // Selecting an instrument on a dedicated route must update the route and
  // its publisher notes as well as the visible instrument; no order is placed.
  await send('Page.navigate', {url:origin+'/trade/btc'});
  await waitUntil(`document.querySelector('button[aria-label="Choose an asset, currently BTC"]') && document.querySelector('[data-publisher-notes]')?.textContent.includes('Paper Trade Bitcoin')`, 'Bitcoin route must mount before selection');
  await evaluate(`document.querySelector('button[aria-controls="asset-search-panel"]').click()`);
  await waitUntil(`!!document.querySelector('#asset-search-panel')`, 'Dedicated route asset search opens');
  await evaluate(`Array.from(document.querySelectorAll('#asset-search-panel button')).find(button => button.textContent.startsWith('ETHEthereum')).click()`);
  await waitUntil(`location.pathname === '/trade/eth' && document.querySelector('h1')?.textContent === 'Ethereum — Practice Trading Simulator' && document.querySelector('link[rel="canonical"]')?.href === 'https://www.thetradehq.com/trade/eth' && document.querySelector('[data-publisher-notes]')?.textContent.includes('Paper Trade Ethereum')`, 'Selection must align URL, heading, canonical and reference notes');
  await send('Page.reload');
  await waitUntil(`location.pathname === '/trade/eth' && document.querySelector('h1')?.textContent === 'Ethereum — Practice Trading Simulator' && document.querySelector('[data-publisher-notes]')?.textContent.includes('Paper Trade Ethereum')`, 'Reload must preserve selected instrument route');
  }
  if (phase === null || phase === 5) {
  await send('Page.navigate', {url:origin+'/portfolio'});
  await waitUntil(`!!document.querySelector('button[aria-label="Open portfolio review mentor"]')`, 'Portfolio mentor launcher mounts');
  await evaluate(`document.querySelector('button[aria-label="Open portfolio review mentor"]').click()`);
  await waitUntil(`document.activeElement?.getAttribute('aria-label') === 'Close portfolio review mentor'`, 'Portfolio mentor receives focus');
  await waitUntil(`(() => { const r=document.querySelector('[role="dialog"][aria-label="Portfolio review mentor"]').getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight; })()`, 'Portfolio mentor must settle inside mobile viewport');
  assert.ok(await evaluate(`!!document.querySelector('input[aria-label="Question for the portfolio review mentor"]') && !!document.querySelector('button[aria-label="Send portfolio review question"]')`), 'Open portfolio mentor controls have names');
  await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Escape',code:'Escape'});
  await waitUntil(`document.activeElement?.getAttribute('aria-label') === 'Open portfolio review mentor'`, 'Portfolio mentor restores focus');
  }
  if (phase === null || phase === 6) {
  // About's introductory icon previously started beneath the fixed site header.
  // Check the actual boxes rather than a particular padding class.
  for (const [width, height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    await send('Page.navigate',{url:origin+'/about'});
    await waitUntil(`location.pathname === '/about' && !!document.querySelector('main > header') && !document.querySelector('#prerender-seo')`, 'About introduction renders at '+width+'px');
    await evaluate(`scrollTo(0,0); window.__aboutFontsReady = false; document.fonts.ready.then(() => window.__aboutFontsReady = true); true`);
    await waitUntil(`window.__aboutFontsReady === true`, 'About fonts settle at '+width+'px');
    assert.equal(await evaluate(`document.querySelector('main > header').getBoundingClientRect().top >= document.querySelector('nav').getBoundingClientRect().bottom`),true,'About introduction clears fixed navigation at '+width+'px');
  }
  // The remaining phase-six assertions exercise mobile controls.
  await send('Emulation.setDeviceMetricsOverride',{width:360,height:900,deviceScaleFactor:1,mobile:true});
  for (let lesson=1; lesson<=6; lesson++) {
    await send('Page.navigate',{url:origin+'/learn/'+lesson});
    await waitUntil(`location.pathname === '/learn/${lesson}' && !!document.querySelector('aside a[href^="https://"]')`, 'Legacy lesson '+lesson+' renders sources');
    // Fallback-font measurements can fit before Inter finishes loading. The
    // production regression only appears once the navigation labels settle.
    await evaluate(`window.__lessonFontsReady = false; document.fonts.ready.then(() => window.__lessonFontsReady = true); true`);
    await waitUntil(`window.__lessonFontsReady === true`, 'Legacy lesson '+lesson+' fonts settle');
    assert.equal(await evaluate(`document.documentElement.scrollWidth > innerWidth+1`),false,'Legacy lesson '+lesson+' must fit mobile');
    assert.equal(await evaluate(`Array.from(document.querySelectorAll('main button')).filter(b => /^(Previous|Continue|Take Quiz)$/.test(b.textContent.trim())).every(b => { const r=b.getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth; })`),true,'Legacy lesson '+lesson+' navigation controls remain on screen');
  }
  // These 50 intentionally noindex guides are outside the sitemap matrix.
  // Commodity slugs are catalogue IDs, while forex slugs encode a slash.
  const nicheReferenceFailures = [];
  for (const symbol of NICHE_SYMBOLS) {
    const niche = getNicheAsset(symbol);
    assert.ok(niche, symbol + ': catalogue route must resolve');
    const path = '/niche/' + symbol.toLowerCase();
    await send('Page.navigate', {url:origin+path});
    await waitUntil(`location.pathname === ${JSON.stringify(path)} && document.querySelector('main h1')?.textContent.includes(${JSON.stringify(niche.name)}) && !document.querySelector('#prerender-seo')`, symbol + ': hydrated guide renders');
    assert.equal(await evaluate(`document.querySelector('meta[name="robots"]')?.content`), 'noindex, follow', symbol + ': retain noindex');
    assert.equal(await evaluate(`document.querySelector('link[rel="canonical"]')?.href`), 'https://www.thetradehq.com'+path, symbol + ': preserve route canonical');
    assert.ok(await evaluate(`!!document.querySelector('main a[href="/trade/${niche.assetId}"]')`), symbol + ': practice link uses catalogue ID');
    const reference = await evaluate(`Array.from(document.querySelectorAll('main tbody tr')).find(row => row.cells[0]?.textContent === 'Simulator Reference Price')?.cells[1]?.textContent`);
    const sourceAsset = ASSETS.find(asset => asset.id === niche.assetId);
    assert.ok(sourceAsset, symbol + ': reference asset exists');
    const displayedPrice = Number(reference?.replaceAll(',', ''));
    if (sourceAsset.price > 0 && !(displayedPrice > 0)) nicheReferenceFailures.push(symbol + ': a positive reference price must not display as zero');
    if (sourceAsset.price > 0 && sourceAsset.price < 0.0001) {
      if (!(Math.abs(displayedPrice - sourceAsset.price) <= sourceAsset.price * 0.00001)) nicheReferenceFailures.push(symbol + ': tiny reference prices retain meaningful precision');
    }
    if (symbol === 'BTC') {
      if (await evaluate(`/(correlation with Bitcoin|Bitcoin correlation)/i.test(document.querySelector('main').innerText)`)) nicheReferenceFailures.push('Bitcoin guide must not explain its price using correlation with itself');
    }

    assert.equal(await evaluate(`document.documentElement.scrollWidth > innerWidth+1`), false, symbol + ': guide fits mobile');
  }
  assert.deepEqual(nicheReferenceFailures, [], 'All niche reference-price and Bitcoin explanation checks pass');
  }
  }
  assert.deepEqual(runtimeErrors, [], 'No uncaught application JavaScript exceptions');
  if (phase === null || phase >= 4) console.log(`PASS isolated interaction checks for phase ${phase ?? 'all'}; all checks retain their original assertions.`);
  const phaseDescription = phase === null ? 'desktop/mobile × JS on/off' : phase >= 4 ? `fresh interaction phase ${phase}; no matrix repeated` : `matrix phase ${phase} only`;
  console.log(`PASS real Chromium: ${checked} compiled route visits (${routes.length} URLs × ${phaseDescription}), canonical/H1/content parity and overflow. Native courses use read-only published fixtures, not production services.`);
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
