import assert from 'node:assert/strict';
import { loadSiteData } from './loadData.ts';

/** Isolated progress fixtures exercise layout without touching real learners. */
export async function verifyGuidedLesson({send,evaluate,waitUntil,origin,delay,publishedTracks}) {
  const {courseTracks}=await loadSiteData();
  const key='tradehq_course_progress_v1',at='2026-10-24T00:00:00.000Z';
  const journeyKey='tradehq:beginner-journey:v1',dailyKey='tradehq:daily-streak';
  const longest=courseTracks.flatMap(track=>track.lessons.map(lesson=>({track,lesson}))).sort((a,b)=>b.lesson.title.length-a.lesson.title.length)[0];
  const track=courseTracks[0];
  const completed=Object.fromEntries([...courseTracks,...publishedTracks].map(t=>[t.slug,{
    lessons:Object.fromEntries(t.lessons.map(l=>[l.slug,{status:'completed'}])),
  }]));
  const cases=[
    {name:'new learner',state:{v:1,tracks:{},updatedAt:at},href:'/start',title:'Start your learning journey',cta:'Start your learning journey'},
    {name:'resume long lesson',state:{v:1,tracks:{},updatedAt:at,lastLesson:{track:longest.track.slug,lesson:longest.lesson.slug,at}},...longest,cta:'Resume your saved lesson'},
    {name:'next lesson',state:{v:1,tracks:{[track.slug]:{lessons:{[track.lessons[0].slug]:{status:'completed'}}}},updatedAt:at},track,lesson:track.lessons[1],cta:'Continue to your next lesson'},
    {name:'courses complete',state:{v:1,tracks:completed,updatedAt:at},href:'/daily',title:"Try today's Daily Practice",cta:"Try today's Daily Practice"},
  ];
  await send('Page.navigate',{url:origin+'/learn'});
  await waitUntil(`!!document.querySelector('main h3')&&!document.querySelector('#prerender-seo')`,'Learn hydrates');
  const previous=await evaluate(`localStorage.getItem(${JSON.stringify(key)})`);
  const previousDaily=await evaluate(`localStorage.getItem(${JSON.stringify(dailyKey)})`);
  const previousJourney=await evaluate(`localStorage.getItem(${JSON.stringify(journeyKey)})`);
  try {
    await evaluate(`localStorage.removeItem(${JSON.stringify(journeyKey)});localStorage.removeItem(${JSON.stringify(dailyKey)});true`);
    for(const c of cases)for(const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
      await evaluate(`localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(JSON.stringify(c.state))});true`);
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
      await send('Page.navigate',{url:'about:blank'});
      await waitUntil(`location.href==='about:blank'&&document.readyState==='complete'`,'Fresh guided context');
      await send('Page.navigate',{url:origin+'/learn'});
      const link=c.href??`/courses/${c.track.slug}/${c.lesson.slug}`;
      const selector='[data-testid="learning-primary-next-step"]';
      await waitUntil(`document.querySelector('${selector} a')?.getAttribute('href')===${JSON.stringify(link)}&&!document.querySelector('#prerender-seo')`,'Primary learning action mounts for '+c.name);
      await evaluate(`window.__guidedFontsReady=false;document.fonts.ready.then(()=>window.__guidedFontsReady=true);true`);
      await waitUntil(`window.__guidedFontsReady===true`,'Guided fonts settle');await delay(600);
      const row=await evaluate(`(()=>{const section=document.querySelector('${selector}'),a=section.querySelector('a'),h=section.querySelector('h3'),r=h.getBoundingClientRect(),b=a.getBoundingClientRect(),card=section.getBoundingClientRect();return {actions:section.querySelectorAll('a').length,title:h.textContent,clipped:h.scrollWidth>h.clientWidth+1,linkText:a.textContent.trim(),contained:r.left>=card.left-1&&r.right<=card.right+1&&b.left>=card.left-1&&b.right<=card.right+1,overlap:r.left<b.right&&r.right>b.left&&r.top<b.bottom&&r.bottom>b.top,overflow:document.documentElement.scrollWidth>innerWidth+1};})()`);
      assert.equal(row.actions,1,'One primary action for '+c.name);
      assert.equal(row.title,c.title??c.lesson.title,'Retain recommendation for '+c.name);
      assert.equal(row.linkText,c.cta,'Retain action for '+c.name);
      assert.equal(row.clipped,false,'Complete guided title visible for '+c.name+' at '+width);
      assert.ok(row.contained&&!row.overlap&&!row.overflow,'Readable contained guided card at '+width);
    }
    const draft='I checked the simulated fill and fees before reviewing my practice order.';
    const unfinished={version:1,lessonCompleted:true,tradeId:'fixture-order',portfolioExplained:true,reflection:'',completedAt:null,updatedAt:at};
    await evaluate(`localStorage.setItem(${JSON.stringify(journeyKey)},${JSON.stringify(JSON.stringify(unfinished))});true`);
    await send('Page.navigate',{url:origin+'/start'});
    await waitUntil(`!!document.querySelector('#journey-reflection')`,'Reflection field renders for an unfinished journey');
    await evaluate(`(()=>{const field=document.querySelector('#journey-reflection');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(field,${JSON.stringify(draft)});field.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`);
    await waitUntil(`document.querySelector('#journey-reflection')?.value===${JSON.stringify(draft)} && JSON.parse(localStorage.getItem(${JSON.stringify(journeyKey)})).reflection===${JSON.stringify(draft)}`,'A full reflection remains editable after autosave');
    await send('Page.reload');
    await waitUntil(`document.querySelector('#journey-reflection')?.value===${JSON.stringify(draft)}&&!document.querySelector('#prerender-seo')`,'Draft resumes after reload');
    await evaluate(`[...document.querySelectorAll('main button')].find(button=>button.textContent.trim()==='Complete my first journey').click();true`);
    await waitUntil(`!document.querySelector('#journey-reflection') && document.querySelector('main')?.textContent.includes('5 of 5 steps completed')`,'Only explicit completion advances to the next step');
  } finally {
    await evaluate(previousDaily===null?`localStorage.removeItem(${JSON.stringify(dailyKey)});true`:`localStorage.setItem(${JSON.stringify(dailyKey)},${JSON.stringify(previousDaily)});true`);
    await evaluate(previous===null?`localStorage.removeItem(${JSON.stringify(key)});true`:`localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(previous)});true`);
    await evaluate(previousJourney===null?`localStorage.removeItem(${JSON.stringify(journeyKey)});true`:`localStorage.setItem(${JSON.stringify(journeyKey)},${JSON.stringify(previousJourney)});true`);
  }
  console.log('PASS one accessible next action across 20 isolated learning progress/width states');
}
