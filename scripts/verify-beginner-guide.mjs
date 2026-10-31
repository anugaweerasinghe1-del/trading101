import assert from 'node:assert/strict';

/** Disposable local module states; never changes a real learner's progress. */
export async function verifyBeginnerGuide({send,evaluate,waitUntil,origin,delay}) {
  const key='tradinghq_learning_progress_v2',ids=['basics','markets','risk','psychology','ai-bots','practice'];
  await send('Page.navigate',{url:origin+'/learn-trading-guide'});
  await waitUntil(`!![...document.querySelectorAll('main h4')].find(h=>h.textContent==='Trading Basics')&&!document.querySelector('#prerender-seo')`,'Beginner guide hydrates');
  const previous=await evaluate(`localStorage.getItem(${JSON.stringify(key)})`);
  try {
    for(const completed of [0,3,6])for(const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
      const state=ids.map((id,i)=>({id,completed:i<completed,locked:i>completed}));
      await evaluate(`localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(JSON.stringify(state))});true`);
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
      await send('Page.navigate',{url:'about:blank'});
      await waitUntil(`location.href==='about:blank'&&document.readyState==='complete'`,'Fresh beginner guide context');
      await send('Page.navigate',{url:origin+'/learn-trading-guide'});
      await waitUntil(`!![...document.querySelectorAll('main h4')].find(h=>h.textContent==='Trading Basics')&&!document.querySelector('#prerender-seo')`,'Module rows hydrate');
      await evaluate(`window.__beginnerFontsReady=false;document.fonts.ready.then(()=>window.__beginnerFontsReady=true);true`);
      await waitUntil(`window.__beginnerFontsReady===true`,'Module fonts settle');await delay(600);
      const rows=await evaluate(`[...document.querySelectorAll('main h4')].filter(h=>h.parentElement.nextElementSibling?.innerText.includes('XP')).map(h=>{const b=h.parentElement.getBoundingClientRect(),meta=h.parentElement.nextElementSibling.getBoundingClientRect(),root=h.parentElement.parentElement.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(h);const ink=[...range.getClientRects()];return {title:h.textContent,inkFits:ink.every(r=>r.left>=b.left-1&&r.right<=b.right+1),overlap:ink.some(r=>r.left<meta.right&&r.right>meta.left&&r.top<meta.bottom&&r.bottom>meta.top),actionsFit:meta.left>=root.left&&meta.right<=root.right,descriptionClipped:h.nextElementSibling.scrollWidth>h.nextElementSibling.clientWidth+1};})`);
      assert.equal(rows.length,6,'All existing module labels remain');
      assert.ok(rows.every(r=>r.inkFits&&!r.overlap&&r.actionsFit&&!r.descriptionClipped),'Module text and controls remain readable at '+width+' with '+completed+' completed');
      assert.deepEqual(JSON.parse(await evaluate(`localStorage.getItem(${JSON.stringify(key)})`)),state,'Layout does not alter stored module progress');
      assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth+1`),false,'Beginner guide fits viewport');
      assert.equal(await evaluate(`[...document.querySelectorAll('main button')].filter(b=>b.textContent.trim()==='Complete').length`),completed===6?0:1,'Retain available completion action');
      assert.equal(await evaluate(`[...document.querySelectorAll('footer p')].find(p=>p.textContent==='Trading Courses')?.previousElementSibling.textContent`),'Guided','Describe courses without unsupported numeric promise');
    }
    // Deep link must focus the real, hydrated calculator input, not the page top.
    await send('Page.navigate',{url:origin+'/learn-trading-guide#compound-initial-capital'});
    await waitUntil(`document.activeElement?.id==='compound-initial-capital'`,'Compound calculator anchor focuses after hydration');
    await waitUntil(`(()=>{const r=document.getElementById('compound-initial-capital')?.getBoundingClientRect();return !!r&&r.top>=0&&r.top<innerHeight;})()`,'Focused calculator input scrolls into the viewport');
    const calculator = await evaluate(`(()=>{
      const input=document.getElementById('compound-initial-capital');
      const a=input.getBoundingClientRect();
      return {hash:location.hash,value:Number(input.value),visible:a.top>=0&&a.top<innerHeight,typed:input.type};
    })()`);
    assert.equal(calculator.hash,'#compound-initial-capital');
    assert.equal(calculator.typed,'number');
    assert.equal(calculator.value,1000,'Beginner-friendly initial capital assumption');
    assert.equal(calculator.visible,true,'Calculator deep link must be in the visible viewport');
    // Verify an ordinary local completion still unlocks the following module.
    await evaluate(`localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(JSON.stringify(ids.map((id,i)=>({id,completed:false,locked:i>0}))))});true`);
    await send('Page.navigate',{url:origin+'/learn-trading-guide'});
    await waitUntil(`!![...document.querySelectorAll('main button')].find(b=>b.textContent.trim()==='Complete')&&!document.querySelector('#prerender-seo')`,'Fresh local completion state');
    await evaluate(`[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()==='Complete').click();true`);
    await waitUntil(`JSON.parse(localStorage.getItem(${JSON.stringify(key)}))[0].completed===true`,'Local completion persists');
    const stored=JSON.parse(await evaluate(`localStorage.getItem(${JSON.stringify(key)})`));
    assert.equal(stored[1].locked,false,'Next local module still unlocks');
    assert.ok(stored.slice(2).every(x=>!x.completed&&x.locked),'Other local modules remain intact');
  } finally {
    await evaluate(previous===null?`localStorage.removeItem(${JSON.stringify(key)});true`:`localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(previous)});true`);
  }
  console.log('PASS90 beginner-guide module rows across15 isolated progress/width states, unchanged storage and local completion/unlock');
}
