import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadSiteData} from './loadData.ts';

/** Preserve all authored overview information while removing its second article. */
export async function verifyCourseOverviewArticle({send,evaluate,waitUntil,origin,delay,dist}) {
  const {courseTracks}=await loadSiteData();
  const normalize=text=>text.replace(/\s+/g,' ').trim().toLowerCase();
  for(const track of courseTracks)for(const [width,height]of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
    const path='/courses/'+track.slug,page=JSON.parse(readFileSync(join(dist,'publisher-notes',path,'index.json'),'utf8'));
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    await send('Page.navigate',{url:'about:blank'});
    await waitUntil(`location.href==='about:blank'&&document.readyState==='complete'`,'Fresh course overview context');
    await send('Page.navigate',{url:origin+path});
    await waitUntil(`location.pathname===${JSON.stringify(path)}&&document.querySelector('main h1')?.textContent===${JSON.stringify(track.title)}&&!document.querySelector('#prerender-seo')`,'Course overview hydrates');
    await delay(100);
    const row=await evaluate(`(()=>{const main=document.querySelector('main');return {text:main.textContent.replace(/\\s+/g,' ').trim().toLowerCase(),path:main.getAttribute('data-publisher-notes'),articles:[...document.querySelectorAll('[data-publisher-notes]')].map(e=>e.tagName),links:[...main.querySelectorAll('a')].map(a=>a.href),overflow:document.documentElement.scrollWidth>innerWidth+1};})()`);
    assert.deepEqual(row.articles,['MAIN'],'One course overview in main '+path+' at '+width);
    assert.equal(row.path,path);
    for(const section of page.sections) {
      // The authored cards separate title, summary and duration, preserving their relationship.
      if(section.h==='Lessons in this track')continue;
      for(const text of [...(section.p||[]),...(section.list||[])].filter(Boolean)) {
        const paragraph=normalize(text);
        assert.ok(row.text.includes(paragraph),'Preserve '+section.h+' '+path);
        assert.equal(row.text.split(paragraph).length-1,1,'Do not repeat '+section.h+' '+path);
      }
    }
    for(const lesson of track.lessons) {
      const card=await evaluate(`document.querySelector('main a[href="${path+'/'+lesson.slug}"]')?.textContent`);
      assert.ok(card&&normalize(card).includes(normalize(lesson.title))&&normalize(card).includes(normalize(lesson.summary))&&card.includes(lesson.readingMinutes+' min'),'Preserve complete lesson card '+lesson.slug);
    }
    for(const link of page.links)assert.ok(row.links.includes(new URL(link.href,origin).href),'Preserve destination '+link.href);
    assert.ok(row.text.includes('published by tradehq')&&row.text.includes('no independent professional review is claimed'));
    assert.ok(row.text.includes('includes '+track.lessons.length+' lessons, quizzes, sources, and a completion badge.'));
    assert.ok(row.text.includes('options and futures contract mechanics are worksheet exercises.'));
    assert.ok(row.text.includes('quotes may be delayed, cached, unavailable or fixed simulator values')&&row.text.includes('practice results do not predict investment outcomes'));
    assert.equal(row.overflow,false);
  }
  // Suppression is deliberately limited to overview routes. Lesson notes stay intact.
  const first=courseTracks[0],path='/courses/'+first.slug;
  await send('Page.navigate',{url:origin+path});
  await waitUntil(`!!document.querySelector('main[data-publisher-notes="${path}"]')&&!document.querySelector('#prerender-seo')`,'Start overview navigation fixture');
  await evaluate(`document.querySelector('main a[href="${path+'/'+first.lessons[0].slug}"]').click();true`);
  await waitUntil(`location.pathname==='${path+'/'+first.lessons[0].slug}'&&!!document.querySelector('article[data-publisher-notes]')`,'Individual lesson notes remain available');
  await evaluate(`document.querySelector('main a[href="${path}"]').click();true`);
  await waitUntil(`location.pathname==='${path}'&&!!document.querySelector('main[data-publisher-notes]')`,'Return to integrated overview');
  assert.equal(await evaluate(`document.querySelectorAll('[data-publisher-notes]').length`),1);
  await evaluate(`document.querySelector('main a[href="/courses"]').click();true`);
  await waitUntil(`location.pathname==='/courses'&&!!document.querySelector('article[data-publisher-notes="/courses"]')`,'Restore catalog notes');
  assert.equal(await evaluate(`document.querySelectorAll('[data-publisher-notes]').length`),1);
  console.log('PASS20course-overview width states: single article, all substantive copy/badge criteria/lesson cards/references preserved; individual lesson and catalog notes restored on navigation');
}
