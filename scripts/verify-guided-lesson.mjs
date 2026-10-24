import assert from 'node:assert/strict';
import { loadSiteData } from './loadData.ts';

/** Isolated progress fixtures exercise layout without touching real learners. */
export async function verifyGuidedLesson({send,evaluate,waitUntil,origin,delay}) {
  const {courseTracks}=await loadSiteData();
  const key='tradehq_course_progress_v1',at='2026-10-24T00:00:00.000Z';
  const longest=courseTracks.flatMap(track=>track.lessons.map(lesson=>({track,lesson}))).sort((a,b)=>b.lesson.title.length-a.lesson.title.length)[0];
  const beginner=courseTracks.find(t=>t.slug==='trading-psychology-mastery')??courseTracks[0];
  const track=courseTracks[0];
  const cases=[
    {name:'new learner',state:{v:1,tracks:{},updatedAt:at},track:beginner,lesson:beginner.lessons[0],cta:'Start your first lesson'},
    {name:'resume long lesson',state:{v:1,tracks:{},updatedAt:at,lastLesson:{track:longest.track.slug,lesson:longest.lesson.slug,at}},...longest,cta:'Continue lesson'},
    {name:'next lesson',state:{v:1,tracks:{[track.slug]:{lessons:{[track.lessons[0].slug]:{status:'completed'}}}},updatedAt:at},track,lesson:track.lessons[1],cta:'Take next lesson'},
  ];
  await send('Page.navigate',{url:origin+'/learn'});
  await waitUntil(`!!document.querySelector('main h3')&&!document.querySelector('#prerender-seo')`,'Learn hydrates');
  const previous=await evaluate(`localStorage.getItem(${JSON.stringify(key)})`);
  try {
    for(const c of cases)for(const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
      await evaluate(`localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(JSON.stringify(c.state))});true`);
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
      await send('Page.navigate',{url:'about:blank'});
      await waitUntil(`location.href==='about:blank'&&document.readyState==='complete'`,'Fresh guided context');
      await send('Page.navigate',{url:origin+'/learn'});
      const link=`/courses/${c.track.slug}/${c.lesson.slug}`;
      await waitUntil(`!!document.querySelector('main a[href="${link}"]')&&!document.querySelector('#prerender-seo')`,'Suggested lesson mounts');
      await evaluate(`window.__guidedFontsReady=false;document.fonts.ready.then(()=>window.__guidedFontsReady=true);true`);
      await waitUntil(`window.__guidedFontsReady===true`,'Guided fonts settle');await delay(600);
      const row=await evaluate(`(()=>{const a=document.querySelector('main a[href="${link}"]'),h=a.parentElement.querySelector('h3'),r=h.getBoundingClientRect(),b=a.getBoundingClientRect(),card=a.parentElement.getBoundingClientRect();return {title:h.textContent,clipped:h.scrollWidth>h.clientWidth+1,linkText:a.textContent.trim(),contained:r.left>=card.left-1&&r.right<=card.right+1&&b.left>=card.left-1&&b.right<=card.right+1,overlap:r.left<b.right&&r.right>b.left&&r.top<b.bottom&&r.bottom>b.top,overflow:document.documentElement.scrollWidth>innerWidth+1};})()`);
      assert.equal(row.title,c.lesson.title,'Retain recommendation for '+c.name);
      assert.equal(row.linkText,c.cta,'Retain action for '+c.name);
      assert.equal(row.clipped,false,'Complete guided title visible for '+c.name+' at '+width);
      assert.ok(row.contained&&!row.overlap&&!row.overflow,'Readable contained guided card at '+width);
    }
  } finally {
    await evaluate(previous===null?`localStorage.removeItem(${JSON.stringify(key)});true`:`localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(previous)});true`);
  }
  console.log('PASS full guided lesson titles and existing destinations/actions across15 isolated progress/width states');
}
