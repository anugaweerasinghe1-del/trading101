import assert from 'node:assert/strict';

/** Disposable compiled-page fixtures only. No real account or order action. */
export async function verifyProfileMetricAvailability({send, evaluate, waitUntil, origin}) {
  const key = 'tradehq_portfolio', migrationKey = 'tradehq:balance-migration:v2';
  await send('Page.navigate', {url: origin + '/trader/me'});
  await waitUntil(`document.querySelector('main h1')?.textContent === 'My TradeHQ profile'`, 'Local profile hydrates');
  const previous = await evaluate(`localStorage.getItem(${JSON.stringify(key)})`);
  const migration = await evaluate(`localStorage.getItem(${JSON.stringify(migrationKey)})`);
  const buy = {id:'fixture-buy', assetId:'btc', symbol:'BTC', type:'buy', quantity:1, price:100, total:100.1, timestamp:'2026-01-01T00:00:00.000Z'};
  const sale = price => ({...buy, id:'fixture-sell', type:'sell', price, total:price * 0.999, timestamp:'2026-01-02T00:00:00.000Z'});
  const cases = [
    {name:'empty', trades:[], value:'—', note:true},
    {name:'buy-only', trades:[buy], value:'—', note:true},
    {name:'losing completed sell', trades:[buy,sale(90)], value:'0%', note:false},
    {name:'winning completed sell', trades:[buy,sale(120)], value:'100%', note:false},
  ];
  try {
    for (const fixture of cases) {
      const stored = JSON.stringify({cash:100000,totalValue:100000,positions:[],trades:fixture.trades});
      await evaluate(`localStorage.setItem(${JSON.stringify(migrationKey)},'1'); localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(stored)}); true`);
      await send('Page.navigate', {url: origin + '/trader/me'});
      await waitUntil(`document.querySelector('main h1')?.textContent === 'My TradeHQ profile' && !document.querySelector('#prerender-seo')`, 'Fixture profile mounts');
      for (const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1440,900]]) {
        await send('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor:1,mobile:width<500});
        const card = await evaluate(`(() => {const label=[...document.querySelectorAll('main p')].find(e=>e.textContent==='Win rate');return {value:label?.nextElementSibling?.textContent,note:label?.parentElement.textContent.includes('No completed sells')};})()`);
        assert.equal(card.value, fixture.value, fixture.name + ': availability at ' + width);
        assert.equal(card.note, fixture.note, fixture.name + ': explanatory note');
        assert.equal(await evaluate(`localStorage.getItem(${JSON.stringify(key)})`), stored, 'Display preserves fixture portfolio');
      }
    }
  } finally {
    await evaluate(previous === null ? `localStorage.removeItem(${JSON.stringify(key)}); true` : `localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(previous)}); true`);
    await evaluate(migration === null ? `localStorage.removeItem(${JSON.stringify(migrationKey)}); true` : `localStorage.setItem(${JSON.stringify(migrationKey)},${JSON.stringify(migration)}); true`);
  }
  console.log('PASS local profile availability: 20 rendered empty/buy-only/losing/winning width states; valid zero retained; no order or account action');
}
