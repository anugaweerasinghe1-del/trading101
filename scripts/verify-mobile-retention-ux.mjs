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
  // The same keys are used by TradeHQ's real guest resume component.
  await evaluate(`(()=>{
    const now=new Date().toISOString();
    const old=new Date(Date.now()-3*86400000).toISOString();
    localStorage.setItem("tradehq_course_progress_v1",JSON.stringify({
      v:1,tracks:{"options-trading-fundamentals":{lessons:{"what-is-an-option":{status:"in-progress"}}}},
      lastLesson:{track:"options-trading-fundamentals",lesson:"what-is-an-option",at:now},updatedAt:now
    }));
    localStorage.setItem("tradehq_last_visit_at",old);
    localStorage.setItem("tradehq_previous_visit_at",old);
    localStorage.removeItem("tradehq_continue_dismissed_at");
    localStorage.removeItem("tradehq_push_state");
    return true;
  })()`);
  await send("Page.reload");
  await waitUntil("!!document.querySelector('[data-testid=continue-banner]')",
    "Returning visitor resume banner appears without truncation");

  // The prompt appears only when browser notifications are supported and
  // permission has not previously been granted or declined.
  const canPrompt=await evaluate("typeof Notification !== 'undefined' && Notification.permission === 'default'");
  if (canPrompt) {
    await waitUntil("!!document.querySelector('[data-testid=notification-prompt]')",
      "Returning-visitor permission prompt opens above mobile bar");
  }
  for (const [width,height] of [[320,640],[360,780],[390,844]]) {
    await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:true});
    await evaluate("document.fonts.ready.then(()=>window.__retentionFonts=true);true");
    await waitUntil("window.__retentionFonts===true","Mobile retention fonts settle");
    await delay(80);
    const banner=await evaluate(`(()=>{
      const el=document.querySelector('[data-testid=continue-banner]');
      const text=el?.querySelector('p'), link=el?.querySelector('a[href^="/courses/"]');
      const close=el?.querySelector('button[aria-label="Dismiss"]');
      if(!text||!link||!close)return null;
      const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
      return {label:text.textContent,style:{overflow:getComputedStyle(text).overflow,textOverflow:getComputedStyle(text).textOverflow,whiteSpace:getComputedStyle(text).whiteSpace},
        text:rect(text),link:rect(link),close:rect(close),
        clipped:text.scrollWidth>text.clientWidth+1,hasOverflow:document.documentElement.scrollWidth>innerWidth+1,
        href:link.getAttribute('href')};
    })()`);
    assert.ok(banner,`Resume card and controls render at ${width}px`);
    assert.ok(banner.label.includes("What Is an Option? Calls & Puts Explained"),
      "Lesson name must remain readable, not cut off");
    assert.equal(banner.clipped,false,`Resume text fits at ${width}px`);
    assert.notEqual(banner.style.textOverflow,"ellipsis",`No ellipsis at ${width}px`);
    assert.notEqual(banner.style.whiteSpace,"nowrap",`Resume label wraps at ${width}px`);
    assert.ok(banner.text.left>=0&&banner.text.right<=width+1,`Resume label inside viewport at ${width}px`);
    assert.ok(banner.link.top>=banner.text.bottom-1,`Continue action has its own mobile row at ${width}px`);
    assert.ok(banner.link.height>=44&&banner.close.width>=44&&banner.close.height>=44,
      `Resume action and dismiss buttons have 44px touch targets at ${width}px`);
    assert.ok(banner.close.bottom<=banner.link.top||banner.close.top>=banner.link.bottom,
      `Dismiss and Continue do not overlap at ${width}px`);
    assert.equal(banner.hasOverflow,false,`No horizontal overflow at ${width}px`);
    if (canPrompt) {
      const overlay=await evaluate(`(()=>{
        const p=document.querySelector('[data-testid=notification-prompt]');
        const n=document.querySelector('nav[aria-label="Mobile navigation"]');
        if(!p||!n)return null;
        const box=x=>{const r=x.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
        const buttons=[...p.querySelectorAll('button')];
        return {prompt:box(p),navigation:box(n),
          overflow:getComputedStyle(p).overflowY,
          buttons:buttons.map(x=>({text:x.textContent,aria:x.getAttribute('aria-label'),rect:box(x)}))};
      })()`);
      assert.ok(overlay,`Permission prompt and mobile navigation present at ${width}px`);
      assert.ok(overlay.prompt.top>=0 && overlay.prompt.left>=0 &&
        overlay.prompt.right<=width+1 && overlay.prompt.bottom<=overlay.navigation.top-6,
        `Permission prompt must stay entirely above fixed mobile navigation at ${width}px`);
      assert.ok(["auto","scroll"].includes(overlay.overflow),
        "Prompt is independently scrollable on short displays");
      assert.ok(overlay.buttons.some(x=>x.text?.includes("Enable")) &&
        overlay.buttons.some(x=>x.text?.includes("Not now")), "Both permission decisions remain available");
      assert.ok(overlay.buttons.every(x=>x.rect.height>=44 && x.rect.width>=44),
        `Prompt decision and dismissal controls have 44px touch targets at ${width}px`);
    }
  }
  await evaluate(`(()=>{
    for (const key of ["tradehq_course_progress_v1","tradehq_previous_visit_at",
      "tradehq_last_visit_at","tradehq_continue_dismissed_at","tradehq_push_state"]) localStorage.removeItem(key);
    return true;
  })()`);
  console.log("PASS returning guest resume wraps, CTA and dismiss remain separate, prompt clears mobile nav at 320/360/390px");
}
