import assert from 'node:assert/strict';

// Runs inside the existing isolated browser harness. Every HTTPS request is
// fulfilled by fixtures; this never reaches production quotes or portfolios.
export async function verifyChartWindows({send,evaluate,waitUntil,origin,delay,setWindowFixture}) {
  const navigate = async path => {
    await send('Page.navigate',{url:'about:blank'});
    await waitUntil(`location.href==='about:blank' && document.readyState==='complete'`,'Fresh chart document');
    await send('Page.navigate',{url:origin+path});
    await waitUntil(`location.pathname===${JSON.stringify(path)} && !!document.querySelector('main .recharts-wrapper') && !document.querySelector('#prerender-seo')`,'Hydrated chart');
  };
  for (const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    setWindowFixture(true);
    await navigate('/trade/btc');
    await waitUntil(`document.querySelector('main')?.innerText.includes('$292.00')`,'Fixed quote loaded');
    const portfolio = await evaluate(`localStorage.getItem('tradehq_portfolio')`);
    for (const [label,hours] of [['1H',1],['4H',4],['1D',24],['1W',168]]) {
      await evaluate(`[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}).click();true`);
      // 193 hourly observations end on Jan 9, 2026. Check the actual rendered
      // first axis label, not component state or an implementation class.
      const expected = await evaluate(`new Date(Date.UTC(2026,0,9)-${hours}*3600000).${label==='1W' ? "toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})" : "toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})"}`);
      await waitUntil(`document.querySelector('main .recharts-xAxis .recharts-cartesian-axis-tick-value')?.textContent===${JSON.stringify(expected)}`,label+' displays its actual history window at '+width);
      assert.equal(await evaluate(`[...document.querySelectorAll('main button[aria-pressed=true]')].filter(b=>b.textContent.trim()===${JSON.stringify(label)}).length`),1,'Selected chart window is accessible');
      assert.ok(await evaluate(`document.querySelector('main').innerText.includes(${JSON.stringify(label+' window ending at the latest chart point. Available history may be shorter. Quote change may cover a different period.')})`),'History and quote-period limitations are disclosed');
      assert.equal(await evaluate(`localStorage.getItem('tradehq_portfolio')`),portfolio,'Window selection preserves guest holdings');
    }
    assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth+1`),false,'Window controls fit '+width);
    setWindowFixture(false);
    await navigate('/trade/shib'); // Empty fixture responses force the local fallback.
    await waitUntil(`document.querySelectorAll('main .recharts-yAxis text').length>0`,'Fallback axis appears');
    await delay(6500); // Exercise two updates, not just the initial chart seed.
    const ticks = await evaluate(`[...document.querySelectorAll('main .recharts-yAxis text')].map(e=>Number(e.textContent.replace(/[$,]/g,'')))`);
    assert.ok(ticks.length>0 && ticks.every(value=>value>0),'Tiny fallback stays positive through later updates at '+width);
    assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth+1`),false,'Tiny fallback fits '+width);
  }
  // The generated FAQ applies to all five asset types. Expand the rendered
  // answers and require the same limitations shown by the Markets page.
  for (const id of ['apt','avgo','arkk','audusd','brent']) {
    await navigate('/trade/'+id);
    for (const fragment of ['What drives','for beginner traders to study','compare to other']) {
      await evaluate(`[...document.querySelectorAll('section[aria-label="Frequently Asked Questions"] button')].find(b=>b.textContent.includes(${JSON.stringify(fragment)})).click();true`);
      await waitUntil(`!!document.querySelector('section[aria-label="Frequently Asked Questions"] [role=region][data-state=open] p')`,'Generated FAQ expands');
      const answer = await evaluate(`document.querySelector('section[aria-label="Frequently Asked Questions"] [role=region][data-state=open]').innerText`);
      if (fragment==='What drives') assert.ok(answer.includes('do not model those events'),'Generated charts do not imply catalyst modelling');
      else if (fragment==='for beginner traders to study') assert.ok(answer.includes('does not establish suitability') && !answer.includes('widely-followed'),'No unsupported universal popularity/suitability claim');
      else assert.ok(answer.includes('not a measured 24-hour return') && answer.includes('not traded volume') && answer.includes('cannot establish real-market correlations'),'Comparison guidance matches practice data');
    }
  }
  console.log('PASS chart windows, five-width tiny-price updates, immutable guest holdings and five asset-type FAQ limitations');
}
