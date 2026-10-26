import assert from 'node:assert/strict';

/** Exercise authored replies through both plain-text chat renderers. */
export async function verifyMentorCopy({send,evaluate,waitUntil,origin,delay}) {
  let checked=0;
  for (const path of ['/ai-mentor','/trade/btc']) {
    await send('Page.navigate',{url:origin+path});
    const scope=path==='/ai-mentor'?'main':'[role="dialog"][aria-label="Portfolio educational mentor"]';
    if (path==='/ai-mentor') {
      await waitUntil(`!!document.querySelector('input[aria-label="Trading concept question"]') && !document.querySelector('#prerender-seo')`,'Public mentor hydrates');
      await evaluate(`[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()==='Explain RSI').click();true`);
      await waitUntil(`document.querySelector('main')?.innerText.includes('RSI alone is not a buy/sell signal')`,'Authored RSI answer renders');
    } else {
      await waitUntil(`!!document.querySelector('button[aria-label="Open portfolio educational mentor"]')`,'Portfolio mentor launcher renders');
    }
    for (const mode of ['light','dark']) {
      await evaluate(`(()=>{if(document.documentElement.classList.contains('light')!==${mode==='light'}) [...document.querySelectorAll('button[aria-label*="theme"]')].find(b=>b.getClientRects().length).click();return true;})()`);
      await waitUntil(`document.documentElement.classList.contains('light')===${mode==='light'}`,'Mentor enters '+mode+' theme');
      if(path==='/trade/btc') {
        await evaluate(`document.querySelector('button[aria-label="Open portfolio educational mentor"]').click();true`);
        await waitUntil(`!!document.querySelector(${JSON.stringify(scope)})`,'Portfolio mentor opens');
        await evaluate(`(()=>{const prompt=[...document.querySelectorAll(${JSON.stringify(scope+' button')})].find(b=>b.textContent.trim()==='My portfolio');if(prompt)prompt.click();return true;})()`);
        await waitUntil(`document.querySelector(${JSON.stringify(scope)})?.innerText.includes('Your portfolio at a glance:')`,'Snapshot answer renders');
      }
      for (const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1440,900]]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
        await delay(100);
        if(path==='/trade/btc') await waitUntil(`(()=>{const dialog=document.querySelector(${JSON.stringify(scope)}),r=dialog.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&!dialog.getAnimations().some(animation=>animation.playState==='running');})()`,'Mentor opening animation finishes inside '+width+'px');
        const text=await evaluate(`document.querySelector(${JSON.stringify(scope)}).innerText`);
        assert.doesNotMatch(text,/\*\*|_\(Educational/,'No literal authored emphasis delimiters at '+path+'/'+width+'/'+mode);
        assert.ok(text.includes('(Educational simulation only — not financial advice.)'),'Disclaimer remains present');
        if(path==='/ai-mentor') {
          assert.ok(text.includes('RSI is a momentum oscillator scaled 0–100'));
          assert.ok(text.includes('>70')&&text.includes('<30'),'Comparison symbols remain text');
        } else assert.ok(text.includes('Total value:')&&text.includes('Cash:')&&text.includes('Realized win rate:'));
        assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth+1`),false,'Mentor page fits '+width+'px');
        if(path==='/trade/btc') assert.equal(await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(scope)}).getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})()`),true,'Mentor dialog fits '+width+'px');
        checked++;
      }
      if(path==='/trade/btc') await evaluate(`document.querySelector('button[aria-label="Close portfolio educational mentor"]').click();true`);
    }
  }
  console.log('PASS mentor plain-text copy: '+checked+' public/portfolio width/theme states; disclaimers and numeric labels preserved; no trade/account action');
}
