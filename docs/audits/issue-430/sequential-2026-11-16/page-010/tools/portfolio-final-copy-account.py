import asyncio,datetime,json,sys,time
from pathlib import Path
from urllib.parse import urlsplit
from playwright.async_api import async_playwright
origin=sys.argv[1]
assert origin.startswith('http://127.0.0.1:')
USER='bd1ca419-139b-4170-ac64-a99e0076f123'
UTC=datetime.timezone.utc
def now(): return datetime.datetime.now(UTC).isoformat()
async def check(browser,width):
    c=await browser.new_context(viewport={'width':width,'height':900},accept_downloads=True)
    test_user=dict(id=USER,aud='authenticated',role='authenticated',email='audit-fixture@example.invalid',app_metadata={},user_metadata={},created_at='2026-01-01T00:00:00Z')
    session=dict(access_token='local-only-test-session',refresh_token='local-only-test-refresh',expires_at=int(time.time())+3600,expires_in=3600,token_type='bearer',user=test_user)
    pos=dict(asset_id='aapl',symbol='AAPL',asset_type='stock',quantity=2,avg_price=256.256,last_price=260,priced_at=now(),observed_at=now(),quote_status='provider')
    trade=dict(id='isolated-fixture-trade',asset_id='aapl',side='buy',quantity=2,price=256,total=512.512,created_at=now(),price_source='Fixture quote')
    snapshot=dict(cash=99487.488,ranked=False,cycle_id='fixture-cycle',updated_at=now(),positions=[pos],trades=[trade])
    gate=asyncio.Event()
    fail=False
    verify=True
    records=[]
    async def route(r):
        url=urlsplit(r.request.url)
        if r.request.url.startswith(origin+'/') and r.request.method=='GET':
            return await r.continue_()
        headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET, POST, OPTIONS'}
        if r.request.method=='OPTIONS':return await r.fulfill(status=204,headers=headers)
        if url.path=='/auth/v1/user':return await r.fulfill(status=200,headers=headers,json=test_user)
        if url.path=='/rest/v1/rpc/get_my_account_practice_snapshot':
            await gate.wait()
            records.append({'result':'unavailable' if fail else 'fixture snapshot'})
            if fail:return await r.fulfill(status=503,headers=headers,json={'message':'Controlled account service outage'})
            return await r.fulfill(status=200,headers=headers,json=snapshot)
        if url.path=='/rest/v1/rpc/export_my_verified_practice_history':
            records.append({'result':'synthetic export'})
            return await r.fulfill(status=200,headers=headers,json={'key_id':'v1','signature':'synthetic-test-data','payload':{'rows':1}})
        if url.path=='/rest/v1/rpc/verify_my_practice_history_export':
            records.append({'result':'synthetic verification verdict','verifiedResponse':verify})
            return await r.fulfill(status=200,headers=headers,json={'verified':verify})
        if url.path.startswith('/rest/v1/'):
            return await r.fulfill(status=200,headers=headers,json=[])
        return await r.abort()
    await c.route('**/*',route)
    await c.add_init_script(f"localStorage.setItem('sb-cbdktpjgczhthflspqjb-auth-token', {json.dumps(json.dumps(session))});")
    page=await c.new_page()
    response=await page.goto(origin+'/portfolio',wait_until='domcontentloaded')
    assert response.status==200
    await page.get_by_role('button',name='Reject',exact=True).click()
    await page.get_by_text('Account snapshot pending',exact=True).wait_for()
    loading={'copy':await page.get_by_text('Loading your portfolio…',exact=True).inner_text(),'valueCount':await page.locator('[data-portfolio-total-value]').count()}
    assert loading['valueCount']==0
    gate.set()
    await page.get_by_role('heading',name='Portfolio Dashboard',exact=True).wait_for()
    value=page.locator('[data-portfolio-total-value]')
    await value.wait_for()
    before=await value.inner_text()
    panel=page.get_by_role('region',name='Backup and restore your virtual portfolio')
    dialogs=[]
    async def accept(dialog):
        dialogs.append(dialog.message)
        await dialog.accept()
    page.once('dialog',accept)
    await panel.get_by_role('button',name='Recover account portfolio',exact=True).click()
    recovery=panel.get_by_text("Recovered your current server snapshot:",exact=False)
    await recovery.wait_for()
    recovered=await recovery.inner_text()
    assert await value.inner_text()==before
    assert '1 recorded order, 1 open position.' in recovered
    async with page.expect_download() as download:
        await panel.get_by_role('button',name='Download signed export',exact=True).click()
    file=await download.value
    assert file.suggested_filename=='tradehq-verified-account-practice.json'
    data=(await file.path()).read_bytes()
    export=await panel.get_by_text('Signed historical export downloaded.',exact=False).inner_text()
    upload=panel.get_by_label('Choose signed TradeHQ history JSON to verify',exact=True)
    await upload.set_input_files({'name':'fixture.json','mimeType':'application/json','buffer':data})
    valid_status=panel.get_by_text('Signature valid:',exact=False)
    await valid_status.wait_for()
    valid=await valid_status.inner_text()
    verify=False
    await upload.set_input_files({'name':'fixture.json','mimeType':'application/json','buffer':data})
    invalid_status=panel.get_by_text('Signature NOT verified.',exact=False)
    await invalid_status.wait_for()
    invalid=await invalid_status.inner_text()
    await upload.set_input_files({'name':'fixture.txt','mimeType':'text/plain','buffer':data})
    wrong_format=panel.get_by_text('under 2.1 MB.',exact=False)
    await wrong_format.wait_for()
    assert await value.inner_text()==before
    result=dict(width=width,atUTC=now(),scope='synthetic verdict only and no actual cryptographic verification',recovered=recovered,export=export,valid=valid,invalid=invalid,wrongFormat=await wrong_format.inner_text(),confirmation=dialogs,requests=records,totalBeforeAndAfter=before)
    await c.close()
    return result

async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        results=await asyncio.gather(*(check(browser,w) for w in (390,1440)))
        await browser.close()
    dest=Path('/tmp/tradehq-audit-1118/portfolio/local-final-copy-account.json')
    dest.write_text(json.dumps(dict(scope='Loopback and synthetic read-only account snapshots only. No actual account or provider requests.',rows=results),ensure_ascii=False,indent=2)+'\n')
    print(dest)
asyncio.run(main())
