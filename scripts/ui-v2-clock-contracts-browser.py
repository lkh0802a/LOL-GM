"""실제 HTML의 계약 시간/받은편지함/수동 확정과 모바일 복귀 검증."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--html',type=Path,required=True);p.add_argument('--fixture',type=Path,required=True);p.add_argument('--official',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
f=json.loads(a.fixture.read_text());official=json.loads(a.official.read_text());html=a.html.read_text();rows=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for theme in ['dark','light']:
  for width,height in [(320,560),(1280,560),(320,260)]:
   page=b.new_page(viewport={'width':width,'height':height},has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.route('**/*',lambda r:r.fulfill(status=200,content_type='text/html',body=html) if r.request.url.startswith('https://lolgm.example/') else r.abort())
   page.goto('https://lolgm.example/');page.wait_for_function('typeof V2!=="undefined"')
   page.evaluate('f=>{V2.db=unpackDB(packDB(f.game));V2.target=managedTeamId(V2.db);V2.mode=f.theme;V2.nid=f.nid;v2OpenNegotiation(f.nid);window.testNid=f.nid;window.testPid=f.pid}',{**f,'theme':theme})
   # Actual form and single review; shrinking viewport models layout, not a real OS keyboard.
   for key in ['salary','years','signingBonus']:
    if key in f['input']:page.locator(f'[data-term="{key}"]').fill(str(f['input'][key]))
   salary=page.locator('[data-term="salary"]');salary.focus();value=salary.input_value();page.set_viewport_size({'width':width,'height':180});assert salary.input_value()==value;page.set_viewport_size({'width':width,'height':height})
   before=page.evaluate('packDB(V2.db)');page.locator('[data-offer-review]').click();assert page.locator('dialog[open]').count()==1
   page.go_back();page.wait_for_function('!V2.review&&!V2.taskBackPending');assert page.evaluate('packDB(V2.db)')==before;assert page.locator('[data-term="salary"]').input_value()==value
   page.locator('[data-offer-review]').click();page.evaluate('()=>{window.expected=JSON.parse(JSON.stringify(V2.db));stageNegotiationOffer(expected,testNid,V2.review.terms)}');page.locator('#confirm-contract').click();page.wait_for_function('!V2.review&&!V2.taskBackPending');assert page.evaluate('packDB(V2.db)===packDB(expected)&&v2OwnedNegotiation(testNid).stage==="waiting"&&!V2.db.players[testPid].team')
   assert page.locator('[data-neg-form]').count()==0
   # Real waiting cancellation and manual reoffer; no changed response policies.
   page.locator('[data-end-neg]').click();assert page.evaluate('v2OwnedNegotiation(testNid).status==="cancelled"')
   page.evaluate('()=>{V2.pid=testPid;v2StartPlayerNegotiation();const n=v2OwnedNegotiation(V2.nid);n.maxRounds=3;n.competitors=[];testNid=n.id;Object.assign(v2Draft(n),n.demand);v2Render()}')
   page.locator('[data-offer-review]').click();page.locator('#confirm-contract').click();page.wait_for_function('!V2.review&&!V2.taskBackPending');assert page.evaluate('v2OwnedNegotiation(testNid).stage==="waiting"');queued=page.evaluate('packDB(V2.db)');assert page.evaluate('JSON.parse(localStorage.getItem(V2_STORE)).game')==queued
   page.reload();page.wait_for_function('!!V2.db');assert page.evaluate('packDB(V2.db)')==queued;page.evaluate('f=>{testNid=f.nid;testPid=f.pid;v2OpenNegotiation(testNid)}',f)
   page.evaluate('()=>{window.expected=JSON.parse(JSON.stringify(V2.db));advanceToNegotiationResponse(expected)}');page.locator('#contracts-advance').click();assert page.evaluate('packDB(V2.db)===packDB(expected)&&v2OwnedNegotiation(testNid).stage==="agreement"&&!V2.db.players[testPid].team')
   page.evaluate('()=>v2Navigate("inbox")');page.locator('[data-mail]').first.click();assert page.locator('[data-final-review]').count()==1
   before=page.evaluate('packDB(V2.db)');page.locator('[data-final-review]').click();assert page.locator('dialog[open]').count()==1;assert page.evaluate('packDB(V2.db)')==before
   page.screenshot(path=str(a.output/f'contract-{theme}-{width}x{height}.png'));page.evaluate('()=>{window.expected=JSON.parse(JSON.stringify(V2.db));finalizeStagedNegotiation(expected,testNid)}');page.locator('#confirm-contract').click();page.wait_for_function('!V2.review&&!V2.taskBackPending');assert page.evaluate('packDB(V2.db)===packDB(expected)&&V2.db.players[testPid].team===managedTeamId(V2.db)');saved=page.evaluate('packDB(V2.db)');page.reload();page.wait_for_function('!!V2.db');assert page.evaluate('packDB(V2.db)')==saved
   # Actual saved mid-game contact, final contract, explicit resume and public Nexus result.
   page.evaluate('db=>{V2.db=unpackDB(packDB(db));V2.target=managedTeamId(V2.db);V2.official=null;v2Navigate("schedule","경기 일정")}',official)
   page.locator('#official-contact').click();page.locator('[data-final-review]').click();page.locator('#confirm-contract').click();page.wait_for_function('!V2.review&&!V2.taskBackPending');page.locator('#contract-match-resume').click();assert page.evaluate('!!V2.officialResult&&V2.officialResult.game.ending.kind==="nexus"&&!v2CurrentContact()');assert page.evaluate('JSON.parse(localStorage.getItem(V2_STORE)).game===packDB(V2.db)')
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors
   rows.append({'theme':theme,'width':width,'height':height,'touch':True,'waitingCancelReoffer':True,'reload':True,'actualResponse':True,'inbox':True,'manualFinal':True,'officialContactResume':True,'singleDialog':True,'errors':errors});page.close()
 b.close()
(a.output/'browser-results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('UI_V2_CLOCK_BROWSER '+json.dumps({'cases':len(rows),'rows':rows},ensure_ascii=False))
