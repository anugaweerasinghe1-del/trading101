import asyncio,datetime,json,sys
from pathlib import Path
from playwright.async_api import async_playwright
origin,prefix=sys.argv[1:3]
note='Compare the fixture position value and fixed fee before changing size.'
async def run(browser,width):
    context=await browser.new_context(viewport={'width':width,'height':900},accept_downloads=True)
    await context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') and r.request.method=='GET' else r.abort())
    page=await context.new_page()
    async def order(side,amount,with_note=False):
        resp=await page.goto(origin+'/trade?journey=1',wait_until='domcontentloaded')
        assert resp.status==200
        reject=page.get_by_role('button',name='Reject',exact=True)
        if await reject.count():
            await reject.click()
        if width<1024:
            await page.get_by_role('button',name='Trade AAPL',exact=True).click()
            panel=page.get_by_role('dialog')
        else:
            panel=page.get_by_role('spinbutton',name='Amount in AAPL').locator("xpath=ancestor::div[contains(@class,'space-y-5')][1]")
        if side=='Sell':
            await panel.get_by_role('button',name='Sell',exact=True).click()
        await panel.get_by_role('spinbutton',name='Amount in AAPL').fill(str(amount))
        if with_note:
            await panel.get_by_role('switch',name='Enable Ghost Journal').click()
            await panel.get_by_role('textbox',name='Trade rationale').fill(note)
        await panel.get_by_role('button',name=side+' AAPL',exact=True).click()
        await page.get_by_text(('Bought ' if side=='Buy' else 'Sold ')+f'{amount} AAPL',exact=True).wait_for()
    async def main_snapshot():
        return await page.locator('main').aria_snapshot()
    async def state():
        return await page.evaluate("JSON.parse(localStorage.getItem('tradehq_portfolio'))")
    await order('Buy',2,True)
    await page.goto(origin+'/portfolio',wait_until='domcontentloaded')
    recovery=page.get_by_role('region',name='Backup and restore your virtual portfolio')
    await recovery.get_by_role('button',name='Download .json backup',exact=True).wait_for()
    async with page.expect_download() as download_event:
        await recovery.get_by_role('button',name='Download .json backup',exact=True).click()
    download=await download_event.value
    data=(await download.path()).read_bytes()
    bought=await state()
    assert len(bought['positions'])==len(bought['trades'])==1 and bought['positions'][0]['quantity']==2
    assert bought['trades'][0]['journal']['reasoning']==note
    await page.evaluate('''()=>{
      const p=JSON.parse(localStorage.getItem('tradehq_portfolio'));
      p.trades[0].journal.notes='Synthetic private review note.';
      p.trades[0].journal.emotions=['Calm','Anxious'];
      localStorage.setItem('tradehq_portfolio',JSON.stringify(p));
    }''')
    await page.reload(wait_until='domcontentloaded')
    journal=page.get_by_role('heading',name='Trading Journal',exact=True).locator("xpath=ancestor::div[contains(@class,'space-y-6')][1]")
    entries=await journal.aria_snapshot()
    await journal.get_by_role('tab',name='Emotions',exact=True).click()
    emotions=await journal.aria_snapshot()
    assert 'Calm' in entries and 'Anxious' in entries and 'Synthetic private review note.' in entries
    assert 'calm' in emotions and 'anxious' in emotions
    before=await main_snapshot()
    await order('Sell',1)
    await page.goto(origin+'/portfolio',wait_until='domcontentloaded')
    await page.get_by_role('heading',name='Trade History',exact=True).wait_for()
    sold=await state()
    assert len(sold['trades'])==2 and sold['positions'][0]['quantity']==1
    assert abs(sold['cash']-99743.98425)<1e-8
    after=await main_snapshot()
    history=page.get_by_role('heading',name='Trade History',exact=True).locator("xpath=ancestor::div[contains(@class,'space-y-6')][1]")
    await history.get_by_role('tab',name='Sells',exact=True).click()
    sells=await history.aria_snapshot()
    await history.get_by_role('tab',name='Buys',exact=True).click()
    buys=await history.aria_snapshot()
    assert 'Sell' in sells and 'Buy' in buys
    search=history.get_by_role('textbox',name='Filter trade history by symbol',exact=True)
    await search.fill('NO_SUCH_SYMBOL')
    await history.get_by_text('No trades found matching your search',exact=True).wait_for()
    no_match=await history.aria_snapshot()
    await search.fill('aapl')
    await history.get_by_text('Showing 1 of 2 trades',exact=True).wait_for()
    matching=await history.aria_snapshot()
    await search.fill('')
    await history.get_by_role('tab',name='All',exact=True).click()
    await history.get_by_text('Showing 2 of 2 trades',exact=True).wait_for()
    all_history=await history.aria_snapshot()
    journal=page.get_by_role('heading',name='Trading Journal',exact=True).locator("xpath=ancestor::div[contains(@class,'space-y-6')][1]")
    for tab in ('Emotions','Summary'):
        await journal.get_by_role('tab',name=tab,exact=True).click()
    journal_summary=await journal.aria_snapshot()
    file_=recovery.locator('input[type=file]')
    await file_.set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':b'{"invalid": true}'})
    await recovery.get_by_role('status').wait_for()
    invalid=await recovery.aria_snapshot()
    await file_.set_input_files({'name':'guest-backup.json','mimeType':'application/json','buffer':data})
    await recovery.get_by_role('heading',name='Preview backup before restoring',exact=True).wait_for()
    preview=await recovery.aria_snapshot()
    await recovery.get_by_role('button',name='Cancel',exact=True).click()
    assert len((await state())['trades'])==2
    await file_.set_input_files({'name':'guest-backup.json','mimeType':'application/json','buffer':data})
    dialogs=[]
    async def accept(dialog):
        dialogs.append(dialog.message)
        await dialog.accept()
    page.once('dialog',accept)
    await recovery.get_by_role('button',name='Confirm guest restore',exact=True).click()
    await recovery.get_by_text('This guest portfolio contains unverified file-imported data',exact=False).wait_for()
    restored=await state()
    assert restored['positions'][0]['quantity']==2 and len(restored['trades'])==1
    restored_panel=await recovery.aria_snapshot()
    page.once('dialog',accept)
    await recovery.get_by_role('button',name='Undo my last restore',exact=True).click()
    undone=await state()
    assert len(undone['trades'])==2 and undone['positions'][0]['quantity']==1
    undo=await recovery.aria_snapshot()
    assert '1 trade with journal entries' in journal_summary
    assert '1 journal entry; 1 includes emotion tags.' in journal_summary
    assert '1 of 1 entry' in journal_summary
    assert '1 completed trade' in after
    notes=await page.locator('[data-publisher-notes="/portfolio"]').inner_text()
    assert 'These summarize recorded outcomes and exposures' in notes
    assert 'All balances and results here remain virtual.' in notes
    await context.close()
    return dict(width=width,atUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),before=before,after=after,historyBuys=buys,historySells=sells,historySearchNoMatch=no_match,historySearchMatch=matching,historyAll=all_history,journalSummary=journal_summary,recoveryInvalid=invalid,recoveryPreview=preview,recoverySuccessful=restored_panel,recoveryUndo=undo,cashAfterSell=sold['cash'],confirmationDialogs=dialogs,entriesWithTags=entries,emotions=emotions)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        rows=await asyncio.gather(*(run(b,w) for w in (390,1440)))
        await b.close()
    path=Path('/tmp/tradehq-audit-1118/portfolio')/(prefix+'-final-copy-journal.json')
    path.write_text(json.dumps(dict(origin=origin,scope='Disposable guest Chromium against the stated origin. All holdings, trade notes and backup data here are disposable on-device fixtures. Only same-origin GET requests are allowed.',rows=rows),ensure_ascii=False,indent=2)+'\n')
    print(path)
asyncio.run(main())
