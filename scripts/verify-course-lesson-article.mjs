import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadSiteData} from './loadData.ts';

/** Preserve lesson text, public answer notes and navigation without duplicate articles. */
export async function verifyCourseLessonArticle({send,evaluate,waitUntil,origin,delay,dist}) {
  const {courseTracks}=await loadSiteData();
  const normalize=text=>text.replace(/\s+/g,' ').trim().toLowerCase();
  let count=0;
  for(const track of courseTracks)for(const lesson of track.lessons)for(const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
    const path='/courses/'+track.slug+'/'+lesson.slug,page=JSON.parse(readFileSync(join(dist,'publisher-notes',path,'index.json'),'utf8'));
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    await send('Page.navigate',{url:'about:blank'});
    await waitUntil(`location.href==='about:blank'&&document.readyState==='complete'`,'Fresh lesson document');
    await send('Page.navigate',{url:origin+path});
    await waitUntil(`document.querySelector('main h1')?.textContent===${JSON.stringify(lesson.title)}&&!document.querySelector('#prerender-seo')`,'Lesson hydrates');
    await delay(100);
    const row=await evaluate(`(()=>{const main=document.querySelector('main');return {path:location.pathname,text:main.textContent.replace(/\\s+/g,' ').trim().toLowerCase(),mainPath:main.getAttribute('data-publisher-notes'),articles:[...document.querySelectorAll('[data-publisher-notes]')].map(e=>e.tagName),links:[...main.querySelectorAll('a')].map(a=>a.href),quizButtons:main.querySelectorAll('[data-lesson-quiz] button').length,submitDisabled:[...main.querySelectorAll('button')].find(b=>b.textContent.trim()==='Submit & complete lesson')?.disabled,overflow:document.documentElement.scrollWidth>innerWidth+1};})()`);
    assert.deepEqual(row.articles,['MAIN'],'One complete lesson before footer '+path+' at '+width);
    assert.equal(row.mainPath,path);
    assert.ok(row.text.includes(normalize(lesson.summary)),'Keep lesson summary');
    for(const section of page.sections) {
      // Source URLs remain the actual anchor destinations, rather than repeated literal URLs.
      if(section.h==='Sources')continue;
      for(const text of [...(section.p||[]),...(section.list||[])].filter(Boolean))assert.ok(row.text.includes(normalize(text.replace(/^> /,''))),'Preserve '+section.h+' '+path);
    }
    for(const source of lesson.sources)assert.ok(row.text.includes(normalize(source.label))&&row.links.includes(new URL(source.url,origin).href),'Preserve source label and destination');
    for(const para of lesson.body.filter(p=>!p.startsWith('## ')&&!p.startsWith('> ')))assert.equal(row.text.split(normalize(para)).length-1,1,'Do not repeat body paragraph '+path);
    for(const link of page.links)assert.ok(row.links.includes(new URL(link.href,origin).href),'Preserve destination '+link.href);
    assert.equal(row.quizButtons,lesson.quiz.reduce((sum,q)=>sum+q.options.length,0),'Keep all unselected quiz controls');
    assert.equal(row.submitDisabled,true,'Completion still requires all answers');
    assert.ok(row.text.includes('published by tradehq')&&row.text.includes('no independent professional review is claimed'),'Keep publisher disclosure');
    assert.ok(row.text.includes('quotes may be delayed, cached, unavailable or fixed simulator values')&&row.text.includes('practice results do not predict investment outcomes'),'Keep simulator scope');
    assert.equal(row.overflow,false,'Lesson fits viewport');
    count++;
  }
  assert.equal(count,100);
  console.log('PASS100lesson-width states: all body/takeaway/source-check/answer explanations/practice scope/references preserved; quizzes unsubmitted');
}
