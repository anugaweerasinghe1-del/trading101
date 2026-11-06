import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FX_REFERENCE_PAIRS, buildFxReferenceBatch, referenceRequestDate, validateFxReferenceBatch } from '../src/lib/fxReference';
import { createFxReferenceHandler, type ReferenceCache } from '../src/server/fxReference';
import { ASSETS } from '../src/lib/assets';
import { onRequest } from '../functions/api/fx-reference';
import vercel from '../api/fx-reference';
const now = Date.parse('2026-11-06T14:00:00Z'), date = '2026-11-05';
const currencies = ['EUR','GBP','JPY','CHF','AUD','CAD','NZD','HKD','SGD','MXN','ZAR','TRY'];
const rows = currencies.map((quote,i) => ({ base:'USD',quote,date,rate:(i+1)/2 }));
assert.equal(referenceRequestDate(now),date);
assert.equal(referenceRequestDate(Date.parse('2026-11-06T18:31:00Z')),'2026-11-06','Colombo day boundary');
assert.equal(referenceRequestDate(Date.parse('2026-11-09T04:00:00Z')),'2026-11-06','Weekend uses preceding weekday');
assert.deepEqual(Object.keys(FX_REFERENCE_PAIRS).sort(),ASSETS.filter(asset=>asset.type==='forex').map(asset=>asset.id).sort());
const batch = buildFxReferenceBatch(rows,date)!;
assert.equal(Object.values(batch.rates).filter(Boolean).length,15);
assert.equal(batch.rates.eurusd?.rate,2);
assert.equal(batch.rates.usdjpy?.rate,1.5);
assert.equal(batch.rates.eurjpy?.rate,batch.rates.eurusd!.rate*batch.rates.usdjpy!.rate);
assert.deepEqual(validateFxReferenceBatch(batch,now),batch);
for (const invalid of [null,{},[],Array(101).fill(rows[0])]) assert.equal(buildFxReferenceBatch(invalid,date),null);
for (const rate of [0,-1,NaN,Infinity,'1',1e12]) {
  const result=buildFxReferenceBatch(rows.map(row=>row.quote==='CHF'?{...row,rate}:row),date)!;
  assert.equal(result.rates.usdchf,null);assert.ok(result.rates.eurusd,'One invalid currency cannot erase others');
}
for (const date of ['2026-11-07','2026-11-06','2026-10-01','2026-02-30','not-date']) {
  assert.equal(buildFxReferenceBatch(rows.map(row=>({...row,date})),'2026-11-05'),null);
}
const mixed=buildFxReferenceBatch(rows.map(row=>row.quote==='GBP'?{...row,date:'2026-11-04'}:row),date)!;
assert.equal(mixed.rates.eurgbp,null,'Cross rates require matching source dates');
assert.equal(mixed.rates.gbpusd?.date,'2026-11-04');assert.ok(mixed.rates.eurusd);
assert.equal(buildFxReferenceBatch([...rows,rows[0]],date)!.rates.eurusd,null,'Duplicate currency rows cannot choose an arbitrary rate');
assert.equal(validateFxReferenceBatch({...batch,kind:'realtime'},now),null);
assert.equal(validateFxReferenceBatch({...batch,requestedDate:'2026-11-07'},now),null);
const future=validateFxReferenceBatch({...batch,rates:{...batch.rates,eurusd:{rate:1,date:'2026-11-07'}}},now)!;
assert.equal(future.rates.eurusd,null);assert.ok(future.rates.usdjpy);
let calls=0;
const fetcher: typeof fetch=async(input,init)=>{
  calls++;assert.equal(String(input),'https://api.frankfurter.dev/v2/rates?date=2026-11-05&base=USD&quotes=EUR,GBP,JPY,CHF,AUD,CAD,NZD,HKD,SGD,MXN,ZAR,TRY');
  assert.equal(init?.method,'GET');assert.equal(init?.redirect,'error');assert.equal(init?.credentials,'omit');
  assert.deepEqual(init?.headers,{Accept:'application/json'});
  return new Response(JSON.stringify(rows),{headers:{'Content-Type':'application/json'}});
};
const req=()=>new Request('https://www.thetradehq.com/api/fx-reference',{headers:{Cookie:'PRIVATE_COOKIE_SENTINEL',Authorization:'PRIVATE_AUTH_SENTINEL','X-Forwarded-For':'PRIVATE_IP_SENTINEL'}});
const stored=new Map<string,Response>();let puts=0;
const cache: ReferenceCache={match:async request=>stored.get(request.url)?.clone(),put:async(request,response)=>{puts++;stored.set(request.url,response.clone());}};
const handle=createFxReferenceHandler({fetchImpl:fetcher,now:()=>now});
assert.equal((await handle(new Request(req().url,{method:'POST'}))).status,405);
assert.equal((await handle(new Request(req().url+'?date=2099-01-01'))).status,400);
assert.equal(calls,0);
const results=await Promise.all(Array.from({length:12},()=>handle(req(),cache)));
assert.equal(calls,1,'Concurrent reads coalesce without retries');assert.equal(puts,1);
for(const response of results){assert.equal(response.status,200);assert.match(response.headers.get('X-Robots-Tag')!, /noindex/);assert.deepEqual(await response.json(),batch);}
assert.equal((await handle(req(),cache)).status,200);assert.equal(calls,1);
const cold=createFxReferenceHandler({fetchImpl:fetcher,now:()=>now});
assert.deepEqual(await (await cold(req(),cache)).json(),batch);assert.equal(calls,1,'Cold edge uses stored dated batch');
let failCalls=0;
for (const failure of [()=>new Response('{}',{status:429}),()=>new Response('HTML',{headers:{'Content-Type':'text/html'}}),()=>new Response('x'.repeat(40000),{headers:{'Content-Type':'application/json'}}),()=>new Response(JSON.stringify(rows.map(row=>({...row,date:'2099-01-01'}))),{headers:{'Content-Type':'application/json'}}),()=>{throw Error('PRIVATE_UPSTREAM_ERROR_SENTINEL');}]) {
  const failed=createFxReferenceHandler({now:()=>now,fetchImpl:async()=>{failCalls++;return failure();}});
  const before=failCalls;const response=await failed(req());
  assert.equal(response.status,503);assert.match(response.headers.get('Retry-After')!,/60/);
  assert.doesNotMatch(await response.text(),/PRIVATE_|2099|HTML/);
  assert.equal((await failed(req())).status,503);assert.equal(failCalls,before+1,'Failure cooldown prevents immediate upstream repetition');
}
const brokenCache: ReferenceCache={match:async()=>{throw Error('cache down');},put:async()=>{throw Error('cache down');}};
assert.equal((await createFxReferenceHandler({fetchImpl:fetcher,now:()=>now})(req(),brokenCache)).status,200);
// Exercise both hosting adapters with fake public data, never an external request.
const originalFetch=globalThis.fetch;let adapterCalls=0;
globalThis.fetch=async()=>{adapterCalls++;return new Response(JSON.stringify(rows.map(row=>({...row,date:referenceRequestDate()}))),{headers:{'Content-Type':'application/json'}});};
try {
  assert.equal((await onRequest({request:req()})).status,200);
  let status=0,body='';const res={writeHead:(value:number)=>{status=value;},end:(value:string)=>{body=value;}};
  await vercel({method:'GET',url:'/api/fx-reference'} as never,res as never);
  assert.equal(status,200);assert.equal(JSON.parse(body).kind,'daily_fx_reference');assert.equal(adapterCalls,2);
} finally {globalThis.fetch=originalFetch;}
const routing=readFileSync('scripts/prepare-cloudflare.mjs','utf8');assert.ok(routing.includes('"/api/fx-reference"'));
console.log('PASS daily FX reference: all 15 pairs, date/future/mixed/partial/duplicate validation, fixed private-header-free GET, cache/coalescing/cooldown, both hosting adapters; no trade-price writes or real provider calls.');
