import asyncio,datetime,json,math,sys
from pathlib import Path
from playwright.async_api import async_playwright
origin,prefix=sys.argv[1:3]
after=len(sys.argv)>3 and sys.argv[3]=='after'
async def case(browser,width,all_gain):
    ctx=await browser.new_context(viewport={'width':width,'height':900})
    quotes={}
    async def route(r):
        req=r.request
        if req.url.startswith(origin+'/') and req.method=='GET':
            return await r.continue_()
        if '/rest/v1/market_prices?' in req.url and quotes:
            now=datetime.datetime.now(datetime.timezone.utc).isoformat()
            rows=[dict(asset_id=key,price=value,source='controlled fixture',updated_at=now,observed_at=now,quote_status='provider') for key,value in quotes.items()]
            return await r.fulfill(status=200,json=rows,headers={'access-control-allow-origin':'*'})
        return await r.abort()
    await ctx.route('**/*',route)
    page=await ctx.new_page()
    async def buy(url,symbol,amount):
        res=await page.goto(origin+url,wait_until='domcontentloaded')
        assert res.status==200
        reject=page.get_by_role('button',name='Reject',exact=True)
        if await reject.count(): await reject.click()
        if width<1024: await page.get_by_role('button',name=f'Trade {symbol}',exact=True).click()
        await page.get_by_role('spinbutton',name=f'Amount in {symbol}').fill(amount)
        await page.get_by_role('button',name=f'Buy {symbol}',exact=True).click()
        await page.get_by_text(f'Bought {amount} {symbol}',exact=True).wait_for()
    await buy('/trade?journey=1','AAPL','2')
    await buy('/trade/btc','BTC','0.1')
    raw=await page.evaluate("JSON.parse(localStorage.getItem('tradehq_portfolio'))")
    assert {x['asset']['id'] for x in raw['positions']}=={'aapl','btc'}
    cost={x['asset']['id']:x['avgPrice'] for x in raw['positions']}
    quotes.update(aapl=cost['aapl']*1.1,btc=cost['btc']*(1.2 if all_gain else 0.8))
    res=await page.goto(origin+'/portfolio',wait_until='domcontentloaded')
    assert res.status==200
    combined=raw['cash']+2*quotes['aapl']+0.1*quotes['btc']
    await page.wait_for_function("(v)=>Math.abs(Number(document.querySelector('[data-portfolio-total-value]')?.textContent.replace('$',''))-v)<0.006",arg=combined)
    section=page.get_by_role('heading',name='Scenario Builder',exact=False).locator("xpath=ancestor::div[contains(@class,'backdrop-blur-xl')][1]")
    examples=[]
    prompts = [('Stocks fall 20%', [-20,0]), ('Crypto rallies 40% over 60 days',[0,40]), ('AAPL and BTC rise 10%',[10,10]), ('All holdings fall 15%',[-15,-15]), ('ETH gains 50% in 30 days',None), ('Tech stocks crash 20%',None), ('Unrecognized asset rises 10%',None)] if after else [('Tech stocks crash 20%',[-20,-20]),('Crypto rallies 40% over 60 days',[40,40]),('ETH gains 50% in 30 days',[50,50])]
    for label,expected in prompts:
        await section.get_by_placeholder('e.g. What if BTC drops 30% in 30 days?').fill(label)
        await section.get_by_role('button',name='Run Scenario',exact=True).click()
        if expected is None:
            await page.get_by_text('Scenario error',exact=True).last.wait_for()
            assert await section.get_by_text('Model Mean',exact=True).count()==0
            error = 'Sector targets are unavailable. Name a held stock or use all stocks.' if label.startswith('Tech') else 'No held assets match this scenario. Use a held asset symbol, an asset class, or all holdings.'
            await page.get_by_text(error,exact=True).last.wait_for()
            examples.append(dict(prompt=label,error=error,previousResultCleared=True))
        else:
            await section.get_by_text('Model Mean',exact=True).wait_for()
            table=section.get_by_text('Expected',exact=True).locator('../..')
            rows=await table.locator(':scope > div').all_text_contents()
            for symbol,shock in zip(['AAPL','BTC'],expected):
                row=next(r for r in rows if symbol in r)
                assert f'{"+" if shock >= 0 else ""}{shock:.1f}%' in row,(symbol,shock,row)
            examples.append(dict(prompt=label,narrative=await section.get_by_text('Modeled a ',exact=False).inner_text(),table=await table.inner_text(),expectedShockBySymbol=dict(zip(['AAPL','BTC'],expected))))
    output=dict(width=width,atUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),held=['AAPL','BTC'],examples=examples)
    await ctx.close()
    return output
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        data=await asyncio.gather(case(b,390,False),case(b,1440,False))
        await b.close()
    p=Path('/tmp/tradehq-audit-1118/portfolio')/(prefix+'-scenario-targets.json')
    p.write_text(json.dumps(dict(scope='Guest AAPL/BTC practice orders with both market prices intercepted. No real provider call or account operation.',rows=data),ensure_ascii=False,indent=2)+'\n')
    print(p)
asyncio.run(main())
