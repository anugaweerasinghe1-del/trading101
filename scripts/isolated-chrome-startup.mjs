/** Bounded fixture-only Chrome startup. No retry of browser/UI assertions. */
import assert from "node:assert/strict";
export async function waitForChromePort({readPort,processState,launchError,
  now=Date.now,delay,timeoutMs=45000}) {
  assert.ok(typeof readPort==="function" && typeof processState==="function"
    && typeof launchError==="function" && typeof delay==="function"
    && Number.isFinite(timeoutMs) && timeoutMs>0 && timeoutMs<=45000,
    "Bounded isolated Chrome startup callbacks required");
  const deadline=now()+timeoutMs;
  while(now()<deadline){
    const error=launchError();
    assert.ok(!error,"Isolated Chrome launch failed: "+String(error?.code||"spawn error"));
    const state=processState();
    assert.ok(state.exitCode===null && state.signalCode===null,
      "Isolated Chrome exited before readiness: "+String(state.exitCode??state.signalCode));
    const port=readPort();
    if(port!==null && port!==""){
      assert.ok(/^[1-9][0-9]{0,4}$/.test(port) && Number(port)<=65535,
        "Invalid isolated Chrome debugging port");
      return port;
    }
    await delay(150);
  }
  throw Error("Isolated Chrome startup exceeded its 45-second bound");
}
