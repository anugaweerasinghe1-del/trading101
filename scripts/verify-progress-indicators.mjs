import assert from 'node:assert/strict';

/** Read-only rendered indicator checks; no completion, order or account action. */
export async function verifyProgressIndicators({send, evaluate, waitUntil, origin, delay}) {
  let checked = 0;
  for (const path of ['/learn-trading-guide', '/portfolio']) {
    await send('Page.navigate', {url: origin + path});
    await waitUntil(`!!document.querySelector('main [role="progressbar"]') && !document.querySelector('#prerender-seo')`, path + ': progress content hydrates');
    for (const mode of ['light', 'dark']) {
      await evaluate(`(() => { if (document.documentElement.classList.contains('light') !== ${mode === 'light'}) [...document.querySelectorAll('button[aria-label*="theme"]')].find(b => b.getClientRects().length).click(); return true; })()`);
      await waitUntil(`document.documentElement.classList.contains('light') === ${mode === 'light'}`, 'Progress enters ' + mode + ' theme');
      for (const [width, height] of [[360,800], [390,844], [768,1024], [1280,800], [1440,900]]) {
        await send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile: width < 500});
        await delay(100);
        const bars = await evaluate(`[...document.querySelectorAll('main [role="progressbar"]')].map(e => ({name:e.getAttribute('aria-label'), value:Number(e.getAttribute('aria-valuenow')), min:e.getAttribute('aria-valuemin'), max:e.getAttribute('aria-valuemax')}))`);
        const names = path === '/learn-trading-guide' ? ['Experience Points'] : ['Cash Reserve', 'Cash Share of Account', 'Largest Position Share of Account'];
        assert.deepEqual(bars.map(b => b.name), names, path + ': meaningful names at ' + width + 'px/' + mode);
        assert.ok(bars.every(b => Number.isFinite(b.value) && b.value >= 0 && b.value <= 100 && b.min === '0' && b.max === '100'), 'Determinate values remain exposed');
        checked++;
      }
    }
  }
  console.log('PASS named progress indicators: ' + checked + ' rendered route/width/theme states; no completion or trade actions');
}
