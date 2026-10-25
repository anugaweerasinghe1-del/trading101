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
import { lessonData } from "../src/lib/lessonData.ts";
import { verifyChartWindows } from "./verify-chart-windows.mjs";
import { verifyMobileNavigation } from "./verify-mobile-navigation.mjs";
import { verifyGuidedLesson } from "./verify-guided-lesson.mjs";
import { verifyComparisonArticle } from "./verify-comparison-article.mjs";
import { verifyCourseOverviewArticle } from "./verify-course-overview-article.mjs";
import { verifyWikiShareContrast } from "./verify-wiki-share-contrast.mjs";
import { verifyWikiDifficultyContrast } from "./verify-wiki-difficulty-contrast.mjs";
import { hasIntegratedCourseOverview } from "../src/lib/courseOverviewPresentation.ts";
import { verifyBeginnerGuide } from "./verify-beginner-guide.mjs";
import { verifyMarketsSidebar } from "./verify-markets-sidebar.mjs";
import { verifyProgressIndicators } from "./verify-progress-indicators.mjs";
import { verifyProfileMetricAvailability } from "./verify-profile-metric-availability.mjs";
import { verifyMentorCopy } from "./verify-mentor-copy.mjs";

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
  if (['/trader/me','/auth'].includes(path)) {
    // These guest utility routes use the production SPA shell.
    response.writeHead(200, {'Content-Type':'text/html','X-Robots-Tag':'noindex, follow'});
    response.end(readFileSync(join(dist,'app-shell.html'))); return;
  }
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
  let chartPriceFixture = false;
  let chartWindowFixture = false;
  let catalogAvailable = true;
  // Fulfil HTTPS requests inside the fixture. Published-course reads use the
  // same recorded anonymous documents; no real account or service is touched.
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.method !== "Fetch.requestPaused") return;
    const {requestId, request} = message.params;
    const url = new URL(request.url); let payload = [];
    if (chartWindowFixture && url.pathname.endsWith('/live-market-data') && url.searchParams.get('assetId') === 'btc') {
      const provenance = {status:'simulated',provider:'isolated-window-fixture',fetchedAt:new Date().toISOString()};
      const data = url.searchParams.get('dataType') === 'candles'
        ? Array.from({length:193},(_,i)=>({time:new Date(Date.UTC(2026,0,1,i)).toISOString(),open:100000+i,high:100001+i,low:99999+i,close:100000+i,volume:100}))
        : {price:100192,change24h:24,changePercent24h:0.02,high24h:null,low24h:null,volume24h:null,lastUpdated:null,source:'simulated',...(chartWindowFixture==='cap'?{marketCap:1230000000}:{})};
      payload = {success:true,assetId:'btc',data,provenance};
    }
    else if (chartPriceFixture && url.pathname.endsWith('/live-market-data') && url.searchParams.get('assetId') === 'shib') {
      const provenance = {status:'simulated',provider:'isolated-fixed-fixture',fetchedAt:new Date().toISOString()};
      const data = url.searchParams.get('dataType') === 'candles'
        ? Array.from({length:51},(_,i)=>({time:new Date(Date.UTC(2026,0,1,0,i)).toISOString(),open:0.00000520185,high:0.0000055,low:0.000005,close:0.00000520185*(0.99+i*0.0005),volume:100}))
        : {price:0.00000520185,change24h:chartPriceFixture==='zero'?0:chartPriceFixture==='negative'?-0.00000026:0.00000026,changePercent24h:chartPriceFixture==='zero'?0:chartPriceFixture==='negative'?-5:5,high24h:null,low24h:null,volume24h:null,lastUpdated:null,source:'simulated'};
      payload = {success:true,assetId:'shib',data,provenance};
    }
    else if (url.pathname.endsWith("/get_published_course_catalog")) payload = catalogAvailable ? docs.map(row => row.document) : [];
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
      const primaryCopy = /^\/(?:wiki|strategy|compare)\/[^/]+$/.test(path) || /^\/learn\/article\/[^/]+$/.test(path) || hasIntegratedCourseOverview(path);
      if (javaScript && bundled && primaryCopy) {
        const page = JSON.parse(readFileSync(join(dist, "publisher-notes", path, "index.json"), "utf8"));
        const normalizedMain = await evaluate(`document.querySelector('main').textContent.replace(/\\s+/g, ' ').trim().toLowerCase()`);
        const normalize = text => text.replace(/\s+/g, ' ').trim().toLowerCase();
        for (const section of page.sections) {
          if (hasIntegratedCourseOverview(path) && section.h === "Lessons in this track") continue;
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
  await verifyProgressIndicators({send,evaluate,waitUntil,origin,delay});
  await verifyProfileMetricAvailability({send,evaluate,waitUntil,origin});
  await verifyMentorCopy({send,evaluate,waitUntil,origin,delay});
  await verifyComparisonArticle({send,evaluate,waitUntil,origin,delay,dist});
  await verifyCourseOverviewArticle({send,evaluate,waitUntil,origin,delay,dist});
  await verifyWikiShareContrast({send,evaluate,waitUntil,origin,delay});
  await verifyWikiDifficultyContrast({send,evaluate,waitUntil,origin,delay});
  await verifyBeginnerGuide({send,evaluate,waitUntil,origin,delay});
  await verifyGuidedLesson({send,evaluate,waitUntil,origin,delay});
  await verifyMarketsSidebar({send,evaluate,waitUntil,origin,delay});
  await verifyMobileNavigation({send,evaluate,waitUntil,origin,delay});
  // Fixed positive chart candles isolate display precision from live providers
  // and from synthetic chart-data generation. Never submit an order.
  chartPriceFixture = true;
  const tinyHeaderLayoutFailures = [];
  for (const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    await send('Page.navigate',{url:origin+'/trade/shib'});
    try {
    await waitUntil(`location.pathname === '/trade/shib' && !!document.querySelector('main .recharts-yAxis .recharts-cartesian-axis-tick-value') && !document.querySelector('#prerender-seo')`, 'SHIB chart axis renders at '+width+'px');
    } catch (error) { console.error('CHART_STARTUP_STATE', JSON.stringify(await evaluate(`({state:document.readyState,h1:document.querySelector('main h1')?.textContent,main:document.querySelector('main')?.innerText.slice(0,500),chart:!!document.querySelector('.recharts-wrapper')})`))); throw error; }
    await evaluate(`window.__chartFontsReady=false; document.fonts.ready.then(()=>window.__chartFontsReady=true); true`);
    await waitUntil(`window.__chartFontsReady===true`, 'SHIB chart fonts settle');
    await delay(600);
    const ticks = await evaluate(`Array.from(document.querySelectorAll('main .recharts-yAxis .recharts-cartesian-axis-tick-value')).map(t=>t.textContent)`);
    assert.ok(ticks.length >= 2 && ticks.every(t=>Number(t.replace(/[$,]/g,''))>0), 'Positive tiny SHIB axis prices must not display as zero at '+width+'px');
    assert.ok(new Set(ticks).size>=2,'SHIB axis labels retain distinct prices at '+width+'px');
    assert.equal(await evaluate(`document.querySelector('main .recharts-wrapper').closest('.h-full.flex.flex-col').querySelector('p.text-sm.font-medium.tabular-nums')?.textContent`), '+0.00000026 (+5.00%)', 'Tiny positive quote change must not round to zero');
    if (!(await evaluate(`(()=>{const root=document.querySelector('main .recharts-wrapper').closest('.h-full.flex.flex-col'),card=root.getBoundingClientRect();return Array.from(root.firstElementChild.children).every(e=>{const r=e.getBoundingClientRect();return r.left>=card.left-1&&r.right<=card.right+1})})()`))) tinyHeaderLayoutFailures.push('Chart symbol/quote/refresh clips at '+width+'px');
    if (!(await evaluate(`(()=>{const labels=['Total Value','Available Cash'];const groups=labels.map(label=>Array.from(document.querySelectorAll('main p')).find(p=>p.textContent===label)?.parentElement?.parentElement);const button=Array.from(document.querySelectorAll('main button')).find(b=>b.textContent.trim()==='Details');if(groups.some(g=>!g)||!button)return false;const card=groups[0].closest('.glass-panel').getBoundingClientRect();return [...groups,button].every(e=>{const r=e.getBoundingClientRect();return r.left>=card.left-1&&r.right<=card.right+1})})()`))) tinyHeaderLayoutFailures.push('Portfolio summary/cash/details clips at '+width+'px');
    assert.equal(await evaluate(`(()=>{const c=document.querySelector('main .recharts-wrapper').getBoundingClientRect();return Array.from(document.querySelectorAll('main .recharts-yAxis .recharts-cartesian-axis-tick-value')).every(t=>{const r=t.getBoundingClientRect();return r.left>=c.left-1&&r.right<=c.right+1})})()`),true,'SHIB axis labels remain inside chart at '+width+'px');
    assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth+1`),false,'Tiny-price chart fits at '+width+'px');
    await evaluate(`document.querySelector('main .recharts-wrapper').scrollIntoView({block:'center'}); true`);
    await delay(150);
    const box = await evaluate(`(()=>{const r=document.querySelector('main .recharts-wrapper').getBoundingClientRect();return {x:r.left+r.width*0.65,y:r.top+r.height*0.5}})()`);
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:box.x,y:box.y});
    await waitUntil(`!!document.querySelector('main .recharts-tooltip-item-value')`, 'SHIB price tooltip opens at '+width+'px');
    const tooltip = await evaluate(`document.querySelector('main .recharts-tooltip-item-value').textContent`);
    assert.ok(Number(tooltip.replace(/[$,]/g,''))>0,'Positive tiny SHIB tooltip retains price precision at '+width+'px');
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
    const portfolioBeforeDetails = await evaluate(`localStorage.getItem('tradehq_portfolio')`);
    await evaluate(`Array.from(document.querySelectorAll('main button')).find(b=>b.textContent.trim()==='Details').click();true`);
    await waitUntil(`document.querySelector('main').innerText.includes('Active holdings') && document.querySelector('main').innerText.includes('Total executed')`, 'Portfolio details remain usable at '+width+'px');
    assert.equal(await evaluate(`localStorage.getItem('tradehq_portfolio')`),portfolioBeforeDetails,'Details preserves guest portfolio record at '+width+'px');
    await evaluate(`Array.from(document.querySelectorAll('main button')).find(b=>b.textContent.trim()==='Details').click();true`);
  }
  assert.deepEqual(tinyHeaderLayoutFailures, [], 'Trading chart and portfolio headers fit all target widths');
  for (const [mode,expected] of [['negative','-0.00000026 (-5.00%)'],['zero','+0.00 (+0.00%)']]) {
    chartPriceFixture = mode;
    for (const width of [360,1440]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
      await send('Page.navigate',{url:origin+'/trade/shib'});
      await waitUntil(`document.querySelector('main .recharts-wrapper')?.closest('.h-full.flex.flex-col').querySelector('p.text-sm.font-medium.tabular-nums')?.textContent === ${JSON.stringify(expected)}`, 'Exact '+mode+' quote change at '+width+'px');
    }
  }
  console.log('PASS tiny quote-change signs/precision and genuine zero; five-width positive and mobile/desktop negative/zero fixtures');
  chartPriceFixture = false;
  await verifyChartWindows({send,evaluate,waitUntil,origin,delay,setWindowFixture:value=>{chartWindowFixture=value;}});
  // A no-real-money answer must not misrepresent optional account storage.
  // Expand only the FAQ; no authentication, portfolio mutation or order.
  for (const id of ['sui','abbv','agg','eurjpy','wheat']) {
    for (const width of [360,1280]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:width<500});
      await send('Page.navigate',{url:origin+'/trade/'+id});
      await waitUntil(`location.pathname === '/trade/${id}' && Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.includes('Can I lose real money trading')) && !document.querySelector('#prerender-seo')`, 'Asset money FAQ renders for '+id);
      await evaluate(`(()=>{const b=Array.from(document.querySelectorAll('main button')).find(b=>b.textContent.includes('Can I lose real money trading'));b.scrollIntoView({block:'center'});b.click();return true})()`);
      await waitUntil(`Array.from(document.querySelectorAll('main [role="region"]')).some(e=>e.innerText.includes('No. Every'))`, 'Money FAQ opens for '+id);
      const answer = await evaluate(`Array.from(document.querySelectorAll('main [role="region"]')).find(e=>e.innerText.includes('No. Every')).innerText`);
      assert.ok(answer.includes('virtual currency only') && answer.includes('no real funds'), id+': preserve virtual-only scope');
      assert.equal(answer.includes('your portfolio is stored in your browser'),false,id+': do not claim all signed-in portfolio records remain browser-only');
      assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth+1`),false,id+': expanded FAQ fits '+width+'px');
    }
  }
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
  // Course title/accent colors must remain readable after the real theme switch.
  for (const [width, height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    await send('Page.navigate',{url:origin+'/courses'});
    await waitUntil(`location.pathname === '/courses' && !!document.querySelector('main header h1') && !!document.querySelector('button[aria-label*="theme"]') && !document.querySelector('#prerender-seo')`, 'Course catalog theme controls render');
    await evaluate(`window.__catalogFontsReady = false; document.fonts.ready.then(() => window.__catalogFontsReady = true); true`);
    await waitUntil(`window.__catalogFontsReady === true`, 'Course catalog fonts settle');
    for (const mode of ['light','dark']) {
      await evaluate(`(() => { if (document.documentElement.classList.contains('light') !== ${mode === 'light'}) [...document.querySelectorAll('button[aria-label*="theme"]')].find(b => b.getClientRects().length).click(); return true; })()`);
      await waitUntil(`document.documentElement.classList.contains('light') === ${mode === 'light'}`, 'Course catalog enters '+mode+' theme');
      // Wait for the inherited color transition as well as the theme class.
      await delay(600);
      const contrast = await evaluate(`(() => {
        const rgb = s => s.match(/rgba?\\(([^)]+)\\)/)?.[1].split(',').slice(0,3).map(Number);
        const luminance = channels => channels.map(c => c/255).map(c => c<=0.04045 ? c/12.92 : ((c+0.055)/1.055)**2.4).reduce((sum,c,i) => sum+c*[0.2126,0.7152,0.0722][i],0);
        const background = luminance(rgb(getComputedStyle(document.body).backgroundColor));
        const ratio = channels => {const value=luminance(channels);return (Math.max(value,background)+0.05)/(Math.min(value,background)+0.05);};
        const title = document.querySelector('main header h1');
        const gradient = getComputedStyle(title).backgroundImage;
        const stops = [...gradient.matchAll(/rgba?\\([^)]+\\)/g)].map(m => rgb(m[0]));
        const accent = document.querySelector('main header p span');
        return {titleSize:parseFloat(getComputedStyle(title).fontSize),stops:stops.length,title:stops.map(ratio),accent:ratio(rgb(getComputedStyle(accent).color))};
      })()`);
      assert.ok(contrast.titleSize>=24 && contrast.stops>=2, 'Measure actual large gradient title');
      assert.ok(contrast.title.every(r=>r>=3), 'Course title contrast at '+width+'px ('+mode+'): '+JSON.stringify(contrast));
      assert.ok(contrast.accent>=4.5, 'Course accent text contrast at '+width+'px ('+mode+'): '+JSON.stringify(contrast));
    }
  }
  // Profile badges must include completed published courses and retain earlier
  // records when the current catalog cannot supply their display names.
  await send('Emulation.setDeviceMetricsOverride',{width:360,height:900,deviceScaleFactor:1,mobile:true});
  await send('Page.navigate',{url:origin+'/trader/me'});
  await waitUntil(`document.querySelector('main')?.innerText.includes('Course badges earned')`, 'Own fixture profile renders');
  const financialTiles = await evaluate(`[...document.querySelectorAll('main section')].find(s=>s.innerText.includes('PORTFOLIO VALUE'))?.innerText`);
  assert.ok(financialTiles?.includes('$100,000'), 'Fresh fixture has its original virtual balance');
  const badgeSeed = {v:1,tracks:{
    'options-trading-fundamentals':{lessons:{},badgeEarnedAt:'2026-10-01T00:00:00.000Z'},
    'retired-study-track':{lessons:{},badgeEarnedAt:'2026-10-02T00:00:00.000Z'},
  }};
  await evaluate(`localStorage.setItem('tradehq_course_progress_v1',${JSON.stringify(JSON.stringify(badgeSeed))}); true`);
  for (const {document:track} of docs) {
    for (const lesson of track.lessons) {
      const path='/courses/'+track.slug+'/'+lesson.slug;
      await send('Page.navigate',{url:origin+path});
      await waitUntil(`location.pathname===${JSON.stringify(path)} && !document.querySelector('#prerender-seo') && [...document.querySelectorAll('main button')].some(b=>b.innerText.trim()==='Submit & complete lesson')`, 'Published quiz renders '+path);
      const count = await evaluate(`(()=>{const h=[...document.querySelectorAll('main h2')].find(h=>h.innerText==='Check Your Understanding');const list=h.parentElement.querySelector('.space-y-5');list.setAttribute('data-fixture-quiz','true');return list.children.length})()`);
      for (let q=0;q<count;q++) {
        await evaluate(`document.querySelector('[data-fixture-quiz]').children[${q}].querySelector('button').click()`);
        await delay(50);
      }
      await waitUntil(`![...document.querySelectorAll('main button')].find(b=>b.innerText.trim()==='Submit & complete lesson').disabled`, 'Quiz answers enable completion');
      await evaluate(`[...document.querySelectorAll('main button')].find(b=>b.innerText.trim()==='Submit & complete lesson').click()`);
      await waitUntil(`document.querySelector('main')?.innerText.includes('Progress saved to your browser.')`, 'Quiz records local completion');
    }
  }
  const completedProgress = await evaluate(`localStorage.getItem('tradehq_course_progress_v1')`);
  for (const slug of Object.keys(badgeSeed.tracks)) assert.deepEqual(JSON.parse(completedProgress).tracks[slug],badgeSeed.tracks[slug],'Existing badge record remains intact');
  await send('Page.navigate',{url:origin+'/trader/me'});
  await waitUntil(`document.querySelector('main')?.innerText.includes(${JSON.stringify(docs[0].document.badge.name)}) && document.querySelector('main')?.innerText.includes(${JSON.stringify(docs[1].document.badge.name)})`, 'Own profile displays both published-course badges');
  assert.ok(await evaluate(`document.querySelector('main').innerText.includes('Options Fundamentals Completion') && document.querySelector('main').innerText.includes('Course completion: retired study track')`), 'Native and retired completion records remain visible');
  assert.equal(await evaluate(`[...document.querySelectorAll('main section')].find(s=>s.innerText.includes('PORTFOLIO VALUE'))?.innerText`),financialTiles,'Badge display does not change financial tiles');
  catalogAvailable = false;
  await send('Page.navigate',{url:origin+'/trader/me'});
  await waitUntil(`document.querySelector('main')?.innerText.includes('Course completion: cryptocurrency price feeds and valuation') && document.querySelector('main')?.innerText.includes('Course completion: diversification and position sizing')`, 'Stored badges remain visible without catalog names');
  assert.equal(await evaluate(`localStorage.getItem('tradehq_course_progress_v1')`),completedProgress,'Profile display does not rewrite progress');
  for (const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth+1`),false,'Completion badges fit profile at '+width+'px');
  }
  catalogAvailable = true;
  // A fixed-aspect cover previously clipped long course headings on mobile.
  // Exercise every bundled/published track and measure all of its cover text.
  const trackPaths = routes.filter(path => /^\/courses\/[^/]+$/.test(path));
  for (const path of trackPaths) {
    for (const [width, height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
      await send('Page.navigate',{url:origin+path});
      await waitUntil(`location.pathname === ${JSON.stringify(path)} && !!document.querySelector('button[aria-label*="theme"]') && !!document.querySelector('main h1')?.previousElementSibling && !!document.querySelector('main h1')?.nextElementSibling && !document.querySelector('#prerender-seo')`, path+' hydrated cover renders at '+width+'px');
      await evaluate(`window.__coverFontsReady = false; document.fonts.ready.then(() => window.__coverFontsReady = true); true`);
      await waitUntil(`window.__coverFontsReady === true`, path+' cover fonts settle');
      assert.equal(await evaluate(`(() => {
        const heading = document.querySelector('main h1');
        const text = heading.parentElement;
        const cover = text.parentElement.getBoundingClientRect();
        return [heading.previousElementSibling, heading, heading.nextElementSibling].every(element => {
          const rect = element.getBoundingClientRect();
          return rect.top >= cover.top - 1 && rect.bottom <= cover.bottom + 1
            && rect.left >= cover.left - 1 && rect.right <= cover.right + 1;
        });
      })()`), true, path+' badge, title and description stay inside cover at '+width+'px');
    }
  }
  // The learning hub must discover the same published courses as the catalog.
  await send('Page.navigate', {url:origin+'/learn'});
  await waitUntil(`document.querySelector('[aria-label="Structured Courses"]')?.querySelectorAll('a[href^="/courses/"]').length === 6`, 'Learning hub includes both published tracks alongside four bundled courses');
  assert.ok(await evaluate(`document.querySelector('[aria-label="Structured Courses"]').innerText.includes('26 lessons')`), 'Learning hub counts published lessons');
  for (const {document:track} of docs) assert.ok(await evaluate(`!!document.querySelector('[aria-label="Structured Courses"] a[href="/courses/${track.slug}"]')`), 'Learning hub links published course '+track.slug);
  for (const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth+1`),false,'Learning hub fits '+width+'px');
  }
  catalogAvailable = false;
  await send('Page.navigate', {url:origin+'/learn'});
  await waitUntil(`document.querySelector('[aria-label="Structured Courses"]')?.innerText.includes('4 available structured tracks and 20 lessons')`, 'Bundled learning catalog remains usable without published entries');
  assert.equal(await evaluate(`document.querySelector('[aria-label="Structured Courses"]').querySelectorAll('a[href^="/courses/"]').length`),4,'Fallback retains all bundled course links');
  catalogAvailable = true;
  for (const sector of ['ai-tech','crypto-defi','mega-cap','tech-giants','etf-indices','forex-currencies','commodities']) {
    for (const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
      await send('Page.navigate',{url:origin+'/sectors/'+sector});
      await waitUntil(`!!document.querySelector('button[aria-label*="theme"]') && getComputedStyle(document.querySelector('nav')).position==='fixed' && !!document.querySelector('main nav[aria-label="Breadcrumb"]') && !document.querySelector('#prerender-seo')`,'Hydrated sector breadcrumb renders');
      await evaluate(`window.__sectorFontsReady=false;document.fonts.ready.then(()=>window.__sectorFontsReady=true);true`);
      await waitUntil(`window.__sectorFontsReady===true`,'Sector fonts settle');
      assert.equal(await evaluate(`(()=>{const nav=document.querySelector('nav');return document.querySelector('main nav[aria-label="Breadcrumb"]').getBoundingClientRect().top>=nav.getBoundingClientRect().bottom})()`),true,'Sector '+sector+' breadcrumb clears navigation at '+width+'px');
      assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth+1`),false,'Sector '+sector+' fits '+width+'px');
    }
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
    const authored = lessonData.find(row=>row.id===lesson);
    for (let topic=0;topic<authored.subtopics.length;topic++) {
      const label=topic===authored.subtopics.length-1?'Take Quiz':'Continue';
      await evaluate(`[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}).click();true`);
      if (label==='Continue') await waitUntil(`document.querySelector('main')?.innerText.includes('Subtopic ${topic+2} of ${authored.subtopics.length}')`,'Next legacy subtopic renders');
    }
    await waitUntil(`document.querySelector('main')?.innerText.includes('Quiz Time!')`,'Legacy quiz opens');
    for (const [index,question] of authored.quiz.entries()) {
      await waitUntil(`document.querySelector('main')?.innerText.includes(${JSON.stringify(question.question)})`,'Authored legacy question appears');
      assert.equal(await evaluate(`[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()==='Submit Answer').disabled`),true,'An unanswered quiz requires a selection');
      // Exercise an incorrect first response and correct subsequent responses.
      const choice=index===0?(question.correctAnswer+1)%question.options.length:question.correctAnswer;
      await evaluate(`document.querySelectorAll('main .space-y-3 button')[${choice}].click();true`);
      await waitUntil(`![...document.querySelectorAll('main button')].find(b=>b.textContent.trim()==='Submit Answer').disabled`,'Selected answer enables submit');
      await evaluate(`[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()==='Submit Answer').click();true`);
      await waitUntil(`document.querySelector('main')?.innerText.includes(${JSON.stringify(question.explanation)})`,'Every answer, including the final question, shows its explanation');
      assert.equal(await evaluate(`document.querySelector('main').innerText.includes('Quiz Complete!')`),false,'Feedback stays visible before summary');
      assert.ok(await evaluate(`[...document.querySelectorAll('main .space-y-3 button')].every(b=>b.disabled)`),'Submitted choices cannot be changed');
      const next=index===authored.quiz.length-1?'See Results':'Next Question';
      await evaluate(`[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()===${JSON.stringify(next)}).click();true`);
    }
    await waitUntil(`document.querySelector('main')?.innerText.includes('Quiz Complete!')`,'Explicit final action opens score summary');
    assert.ok(await evaluate(`document.querySelector('main').innerText.includes('You scored ${authored.quiz.length-1} out of ${authored.quiz.length}')`),'Final correct answer is included and incorrect response is preserved');
  }
  // These 50 intentionally noindex guides are outside the sitemap matrix.
  // Commodity slugs are catalogue IDs, while forex slugs encode a slash.
  const nicheReferenceFailures = [];
  for (const symbol of NICHE_SYMBOLS) {
    const niche = getNicheAsset(symbol);
    assert.ok(niche, symbol + ': catalogue route must resolve');
    const path = '/niche/' + symbol.toLowerCase();
    await send('Page.navigate', {url:origin+path});
    // Helmet can commit head nodes just after the hydrated heading. Wait for
    // their presence, then retain the independent exact-value assertions below.
    await waitUntil(`location.pathname === ${JSON.stringify(path)} && document.querySelector('main h1')?.textContent.includes(${JSON.stringify(niche.name)}) && !document.querySelector('#prerender-seo') && !!document.querySelector('meta[name="robots"]') && !!document.querySelector('link[rel="canonical"]')`, symbol + ': hydrated guide and head render');
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
