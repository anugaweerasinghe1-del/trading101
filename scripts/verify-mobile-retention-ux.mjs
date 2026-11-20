import assert from "node:assert/strict";

/**
 * Browser-only guest regression for mobile return visitors.
 * Deliberately creates browser-local lesson progress; never uses accounts,
 * touches production APIs or requests actual notification permission.
 */
export async function verifyMobileRetentionUx({send,evaluate,waitUntil,origin,delay}) {
  await send("Emulation.setDeviceMetricsOverride",{width:360,height:780,deviceScaleFactor:1,mobile:true});
  await send("Page.navigate",{url:origin+"/"});
  await waitUntil("!!document.querySelector('main h1') && !document.querySelector('#prerender-seo')",
    "Guest homepage hydrates for returning-visitor test");

  // An actual in-progress lesson takes priority over last-route history.
  // The activation card uses the same saved course and journey keys.
  await evaluate(`(()=>{
    const now=new Date().toISOString();
    const old=new Date(Date.now()-3*86400000).toISOString();
    localStorage.setItem("tradehq_course_progress_v1",JSON.stringify({
      v:1,tracks:{"options-trading-fundamentals":{lessons:{"what-is-an-option":{status:"in-progress"}}}},
      lastLesson:{track:"options-trading-fundamentals",lesson:"what-is-an-option",at:now},updatedAt:now
    }));
    localStorage.setItem("tradehq_last_visit_at",old);
    localStorage.setItem("tradehq_previous_visit_at",old);
    localStorage.setItem("tradehq_last_route","/portfolio");
    localStorage.removeItem("tradehq_push_state");
    return true;
  })()`);
  await send("Page.reload");
  await waitUntil("!!document.querySelector('[data-testid=learning-activation-card] a[href^=\"/courses/\"]')",
    "Returning visitor sees an approved unfinished lesson on the new learning activation card");

  // Priority 1: never interrupt a visitor with permission for alerts
  // that TradeHQ does not currently deliver.
  assert.equal(await evaluate("!!document.querySelector('[data-testid=notification-prompt]')"),false,
    "Unsolicited browser permission prompt is not mounted");
  for (const [width,height] of [[320,640],[360,780],[390,844]]) {
    await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:true});
    await evaluate("document.fonts.ready.then(()=>window.__retentionFonts=true);true");
    await waitUntil("window.__retentionFonts===true","Mobile retention fonts settle");
    await delay(80);
    const card=await evaluate(`(()=>{
      const el=document.querySelector('[data-testid=learning-activation-card]');
      const heading=el?.querySelector('h2'), description=el?.querySelector('p.text-muted-foreground');
      const link=el?.querySelector('a[href^="/courses/"]');
      const resume=Array.from(el?.querySelectorAll('a[href="/portfolio"]') || [])[0];
      if(!heading||!description||!link||!resume)return null;
      const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
      return {label:heading.textContent,heading:rect(heading),link:rect(link),resume:rect(resume),
        clipped:heading.scrollWidth>heading.clientWidth+1,
        hasOverflow:document.documentElement.scrollWidth>innerWidth+1,href:link.getAttribute('href')};
    })()`);
    assert.ok(card,`Activation card, lesson CTA and non-competing previous activity link render at ${width}px`);
    assert.ok(card.label.includes("What Is an Option? Calls & Puts Explained"),
      "Saved approved lesson must remain readable, not cut off");
    assert.equal(card.clipped,false,`Resume lesson heading fits at ${width}px`);
    assert.ok(card.heading.left>=0&&card.heading.right<=width+1,`Lesson title inside viewport at ${width}px`);
    assert.ok(card.link.left>=0&&card.link.right<=width+1,`Lesson action inside viewport at ${width}px`);
    assert.ok(card.link.height>=44,`Lesson CTA maintains 44px touch target at ${width}px`);
    assert.equal(card.href,"/courses/options-trading-fundamentals/what-is-an-option");
    assert.equal(card.hasOverflow,false,`No horizontal overflow at ${width}px`);
    assert.equal(await evaluate("!!document.querySelector('[data-testid=notification-prompt]')"),false,
      `No permission prompt interrupts the journey at ${width}px`);
  }
  await evaluate(`(()=>{
    for (const key of ["tradehq_course_progress_v1","tradehq_previous_visit_at",
      "tradehq_last_visit_at","tradehq_last_route","tradehq_push_state"]) localStorage.removeItem(key);
    return true;
  })()`);
  console.log("PASS returning guest activation heading, lesson CTA, quiet previous activity link, mobile touch targets and no unsolicited permission at 320/360/390px");
}
