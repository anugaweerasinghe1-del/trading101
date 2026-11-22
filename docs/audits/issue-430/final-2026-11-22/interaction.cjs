const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const records=[];
try{for(const width of [1280,360]){
const c=await b.newContext({viewport:{width,height:900}}),p=await c.newPage();const adAttempts=[];
await c.route('**/*',r=>{let q=r.request();if(/googlesyndication|doubleclick|amplitude/.test(q.url())){adAttempts.push(q.url().split('?')[0]);return r.abort()}if(!['GET','HEAD','OPTIONS'].includes(q.method()))return r.abort();return r.continue()});
await p.goto('https://www.thetradehq.com/');await p.getByRole('region',{name:'Optional analytics choices'}).waitFor();
await p.getByRole('button',{name:'Reject',exact:true}).click();
records.push({case:'Optional analytics rejection',width,result:await p.evaluate(()=>localStorage.getItem('tradehq_consent_v3')==='rejected')?'PASS':'FAIL',adAttempts});
const focus=[];for(let i=0;i<12;i++){await p.keyboard.press('Tab');focus.push(await p.evaluate(()=>({tag:document.activeElement.tagName,text:(document.activeElement.getAttribute('aria-label')||document.activeElement.textContent||'').trim().slice(0,80)})))}
records.push({case:'Keyboard Tab sample (12 steps; no full accessibility certification)',width,focus,result:focus.some(x=>['A','BUTTON','INPUT'].includes(x.tag))?'PASS':'FAIL'});
if(width===360){await p.getByRole('button',{name:'Open menu',exact:true}).click();const more=p.getByRole('button',{name:'More',exact:true});await more.click();records.push({case:'Mobile navigation menu and More disclosure',width,result:await more.getAttribute('aria-expanded')==='true'?'PASS':'FAIL',accessibleSnapshot:await p.getByRole('navigation',{name:'Site menu'}).ariaSnapshot().catch(()=> 'Menu role snapshot not available; expansion attribute checked')});await p.getByRole('button',{name:'Close menu',exact:true}).last().click();}
const links=await p.locator('a[href^="http"]').evaluateAll(a=>a.map(x=>({url:x.href,label:x.textContent.trim()})).filter(x=>!x.url.includes('thetradehq.com')));
records.push({case:'Hydrated shared footer external links',width,links});
await c.close();
}}finally{await b.close()}
fs.writeFileSync(path.join(__dirname,'evidence/interaction.json'),JSON.stringify(records,null,2)+'\n');console.log(JSON.stringify(records.map(({case:label,result,width})=>({label,result,width}))));
})().catch(e=>{console.error(e);process.exitCode=1});
