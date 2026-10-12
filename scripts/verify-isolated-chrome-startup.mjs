import assert from "node:assert/strict";
import {waitForChromePort} from "./isolated-chrome-startup.mjs";
function fixture(readyAt=0){
  let time=0;
  const state={exitCode:null,signalCode:null};
  return {readPort:()=>time>=readyAt?"54321":null,
    processState:()=>state,launchError:()=>null,now:()=>time,
    delay:async ms=>{time+=ms;},state};
}
assert.equal(await waitForChromePort(fixture()),"54321");
// A cold runner may take longer than the old generic 14-second UI wait.
assert.equal(await waitForChromePort(fixture(16000)),"54321");
const never=fixture(Infinity);
await assert.rejects(()=>waitForChromePort(never),/45-second bound/);
assert.ok(never.now()<=45150);
for(const state of [{exitCode:1,signalCode:null},{exitCode:0,signalCode:null},
  {exitCode:null,signalCode:"SIGKILL"}]){
  const input=fixture();input.processState=()=>state;
  await assert.rejects(()=>waitForChromePort(input),/exited before readiness/);
}
await assert.rejects(()=>waitForChromePort({...fixture(),launchError:()=>({code:"ENOENT"})}),/ENOENT/);
for(const port of ["0","65536","not-a-port","54321/path","54321\n"])
  await assert.rejects(()=>waitForChromePort({...fixture(),readPort:()=>port}),/Invalid/);
await assert.rejects(()=>waitForChromePort({...fixture(),timeoutMs:45001}),/Bounded/);
console.log("ISOLATED_CHROME_STARTUP_PASS: delayed readiness bounded at 45 seconds; launch/exit/signal/invalid-port failures never retried or hidden.");
