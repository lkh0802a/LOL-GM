"""기존 설치된 Playwright/Chromium으로 새 화면의 수동 시즌 전환을 검증한다."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--html',type=Path,required=True);parser.add_argument('--fixture',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
fixture=json.loads(args.fixture.read_text());html=args.html.read_text();rows=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height,insets in [(320,560,False),(1280,560,False),(320,320,False),(320,180,True)]:
  page=browser.new_page(viewport={'width':width,'height':height},has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/*',lambda r:r.fulfill(status=200,content_type='text/html',body=html) if r.request.url.startswith('https://lolgm.example/') else r.abort())
  page.goto('https://lolgm.example/');page.wait_for_function('typeof V2!=="undefined"')
  if insets:page.add_style_tag(content=':root{--safe-top:24px;--safe-right:20px;--safe-bottom:20px;--safe-left:28px}')
  page.evaluate("f=>{V2.db=unpackDB(f.initial);V2.target=managedTeamId(V2.db);v2Navigate('home');window.original=packDB(V2.db)}",fixture)
  # 실제 검색 입력 중 viewport 축소/복원: 실제 OS 키보드를 열었다는 주장은 하지 않는다.
  page.evaluate("()=>v2Navigate('market','선수 검색')");search=page.locator('#player-search');search.fill('a');search.focus();page.set_viewport_size({'width':width,'height':180});assert search.input_value()=='a';assert page.locator('#player-search').evaluate('e=>e===document.activeElement');page.set_viewport_size({'width':width,'height':height});assert search.input_value()=='a';page.evaluate("()=>v2Navigate('home')");assert page.evaluate('packDB(V2.db)===original')
  # 매일 검토/수동 확정. 원래 작성자와 전체 저장 값 비교.
  for day in range(14):
   page.locator('#continue').click();assert page.locator('dialog[open]').count()==1
   page.evaluate('()=>{window.expected=JSON.parse(JSON.stringify(V2.db));advanceOffseasonContractDay(expected)}');page.locator('#management-confirm').click();page.wait_for_function('!document.querySelector("#work-dialog").open&&!V2.taskBackPending');assert page.evaluate('packDB(V2.db)===packDB(expected)&&JSON.parse(localStorage.getItem(V2_STORE)).game===packDB(V2.db)')
  assert page.locator('#fa-day-review').is_enabled();before=page.evaluate('packDB(V2.db)');page.locator('#fa-day-review').click();page.go_back();page.wait_for_function('!document.querySelector("#work-dialog").open&&!V2.taskBackPending');assert page.evaluate('document.activeElement.id==="fa-day-review"');assert page.evaluate('packDB(V2.db)')==before
  page.locator('#fa-day-review').click();page.evaluate('()=>{window.expected=JSON.parse(JSON.stringify(V2.db));advanceOffseasonFreeAgencyDay(expected)}');page.locator('#management-confirm').click();page.wait_for_function('!document.querySelector("#work-dialog").open&&!V2.taskBackPending');assert page.evaluate('packDB(V2.db)===packDB(expected)')
  # 연간 결산은 하루 진행과 별도다. 취소·뒤로가기 무작성, 직접 확정 때 기존 결산만 호출.
  before=page.evaluate('packDB(V2.db)');page.locator('#annual-close-review').click();page.evaluate('document.querySelector("#work-dialog").scrollTop=10000');close=page.locator('#work-close').bounding_box();assert close['height']>=44 and close['width']>=44 and close['y']>=0 and close['y']+close['height']<=height
  if insets:
   d=page.locator('#work-dialog').bounding_box();assert d['x']>=28 and d['x']+d['width']<=width-20+1 and d['y']>=24 and d['y']+d['height']<=height-20+1
  page.screenshot(path=str(args.output/f'offseason-review-{width}x{height}.png'));page.locator('#work-close').click();page.wait_for_function('!document.querySelector("#work-dialog").open&&!V2.taskBackPending');assert page.evaluate('packDB(V2.db)')==before;assert page.evaluate('document.activeElement.id==="annual-close-review"')
  page.locator('#annual-close-review').click();page.evaluate('()=>{window.expected=JSON.parse(JSON.stringify(V2.db));runOffseason(expected)}');page.locator('#management-confirm').click();page.wait_for_function('!document.querySelector("#work-dialog").open&&!V2.taskBackPending');assert page.evaluate('packDB(V2.db)===packDB(expected)&&V2.db.world.phase==="market"&&document.activeElement.id==="continue"');assert page.evaluate('JSON.parse(localStorage.getItem(V2_STORE)).game===packDB(V2.db)')
  for phase in ['market','preseason']:
   page.locator('#continue').click();page.evaluate("p=>{window.expected=JSON.parse(JSON.stringify(V2.db));if(p==='market')closeMarket(expected);else startWorldSeason(expected,managedTeamId(expected),V2.managementReview.phaseSeed)}",phase);page.locator('#management-confirm').click();page.wait_for_function('!document.querySelector("#work-dialog").open&&!V2.taskBackPending');assert page.evaluate('packDB(V2.db)===packDB(expected)')
  assert page.evaluate('V2.db.world.phase==="season"');saved=page.evaluate('packDB(V2.db)');page.reload();page.wait_for_function('V2.db?.world.phase==="season"');assert page.evaluate('packDB(V2.db)===packDB(unpackDB(JSON.parse(localStorage.getItem(V2_STORE)).game))');assert page.evaluate('JSON.parse(localStorage.getItem(V2_STORE)).game')==saved
  assert page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+2');assert not errors,errors
  rows.append({'width':width,'height':height,'touchEmulated':True,'insetsSimulated':insets,'keyboardViewportResizeOnly':True,'exclusiveDays':14,'faDayWholeResult':True,'annualMarketSeasonWholeResult':True,'manualEveryAction':True,'cancelBackFocus':True,'actualLocalStorageReload':True,'noExternalResources':True,'errors':errors});page.close()
 browser.close()
(args.output/'browser-results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('UI_V2_OFFSEASON_BROWSER',json.dumps(rows,ensure_ascii=False))
