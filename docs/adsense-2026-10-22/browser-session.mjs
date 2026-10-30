// Internal, disposable audit browser client. Not application code.
import {writeFileSync} from 'node:fs';
export const pause=ms=>new Promise(r=>setTimeout(r,ms));
export async function openAuditPage(url='about:blank',port=9223){
 const target=await(await fetch('http://127.0.0.1:'+port+'/json/new?'+encodeURIComponent('about:blank'),{method:'PUT'})).json();
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 let sequence=0;const pending=new Map(),listeners=new Set();
 ws.addEventListener('message',event=>{const message=JSON.parse(event.data),p=pending.get(message.id);if(p){pending.delete(message.id);clearTimeout(p.timer);message.error?p.reject(Error(message.error.message)):p.resolve(message.result);}else if(message.method){for(const listener of listeners)listener(message);}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},15000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async(expression,awaitPromise=false)=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
 const wait=async(expression,ms=25000)=>{const deadline=Date.now()+ms;while(Date.now()<deadline){if(await evaluate(expression))return true;await pause(150);}throw Error('Page readiness deadline');};
 await send('Page.enable');
 await send('Page.bringToFront');
 // Truthful automation identifier: Cloudflare Pages rejects default library/headless signatures.
 // Official resolution: cloudflare-docs/support/.../cloudflare-1xxx-errors/error-1010.mdx.
 await send('Network.setUserAgentOverride',{userAgent:'TradeHQ-Audit/1.0 (+https://github.com/anugaweerasinghe1-del/trading101)'});
 if(url!=='about:blank')await send('Page.navigate',{url});
 return {send,evaluate,wait,onEvent(listener){listeners.add(listener);return()=>listeners.delete(listener);},async screenshot(path){const p=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path,Buffer.from(p.data,'base64'));},async close(){for(const p of pending.values())clearTimeout(p.timer);ws.close();await fetch('http://127.0.0.1:'+port+'/json/close/'+target.id);}};
}
