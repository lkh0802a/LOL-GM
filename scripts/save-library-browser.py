from pathlib import Path
from playwright.sync_api import sync_playwright
import argparse, json, atexit
p=argparse.ArgumentParser(description='저장된 게임 목록의 실제 브라우저 수용')
p.add_argument('--output',type=Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
root=Path(__file__).resolve().parents[1];html=(root/'index.html').read_text();results=[]
atexit.register(lambda:(a.output/'results-at-exit.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)))
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width in [1280,320]:
  page=browser.new_page(viewport={'width':width,'height':900});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/*',lambda route:route.fulfill(status=200,content_type='text/html',body=html) if route.request.url=='http://127.0.0.1:8765/' else route.abort())
  page.goto('http://127.0.0.1:8765/');page.wait_for_selector('#startup-new')
  setup=page.evaluate('''async()=>{
   const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:2,div2:false})];cfg.internationals=[];
   DB=buildWorld(cfg);startCareer(DB,managerSelectableTeams(DB,'KR',1)[0].id,'save-browser-current');resetUiForWorld();
   const other=buildWorld(cfg);startCareer(other,managerSelectableTeams(other,'KR',1)[1].id,'save-browser-other');
   await persistWorldSnapshot(DB,'1',STORE_BASE+'1');await persistWorldSnapshot(other,'2',STORE_BASE+'2');
   localStorage.removeItem(STORAGE_NS+'-meta-2');await idbSet(STORE_BASE+'4','invalid controlled original');
   window.saveBrowserOther=managedTeamId(other);window.saveBrowserCurrent=managedTeamId(DB);
   navigateTo('data');return {current:managedTeam(DB).name,other:managedTeam(other).name};
  }''')
  page.wait_for_selector('[data-slot="2"]');assert page.locator('[data-slot]').count()==1
  text=page.locator('#main').inner_text();assert setup['current'] in text and setup['other'] in text
  assert '현재 게임' in text and '슬롯 정보 없음' not in text and '슬롯 1' not in text
  assert '저장 데이터를 복원할 수 없습니다' in text
  before=page.evaluate('JSON.stringify(DB)');assert not page.locator('#dshow').is_visible()
  page.get_by_text('저장 원본 관리',exact=True).focus();page.keyboard.press('Enter');assert page.locator('#ddownload').is_visible()
  with page.expect_download() as dl:page.locator('#ddownload').click()
  download=dl.value;dest=a.output/f'export-{width}.json';download.save_as(dest)
  assert page.evaluate('s=>JSON.stringify(unpackDB(s))===JSON.stringify(unpackDB(packDB(DB)))',dest.read_text())
  page.locator('#dfile').set_input_files(dest)
  page.wait_for_function('document.querySelector("#djson").value.length>100')
  assert page.evaluate('JSON.stringify(DB)')==before
  assert '파일을 읽었습니다' in page.locator('#dmsg').inner_text()
  page.get_by_text('원본 직접 보기·편집',exact=True).click();assert page.locator('#dshow').is_visible()
  page.locator('#dshow').click();assert page.evaluate("JSON.stringify(unpackDB(document.querySelector('#djson').value))===JSON.stringify(unpackDB(packDB(DB)))")
  page.locator('#djson').fill('invalid controlled import');page.locator('#dapply').click()
  assert page.evaluate('JSON.stringify(DB)')==before
  assert '현재 게임은 유지됩니다' in page.locator('#dmsg').inner_text()
  page.get_by_text('현재 게임 초기화',exact=True).first.click()
  page.once('dialog',lambda dialog:dialog.dismiss());page.locator('#dreset').click()
  assert page.evaluate('JSON.stringify(DB)')==before
  for theme in ['light','dark']:
   page.evaluate('t=>applyStartupTheme(t)',theme)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.screenshot(path=str(a.output/f'games-{width}-{theme}.png'),full_page=True)
  with page.expect_file_chooser() as chooser:
   page.locator('#dchoose').focus();page.keyboard.press('Enter')
  chooser.value.set_files(dest)
  page.wait_for_function('document.querySelector("#djson").value.length>100')
  page.locator('#dapply').click()
  assert page.evaluate('s=>JSON.stringify(unpackDB(s))===JSON.stringify(unpackDB(packDB(DB)))',dest.read_text())
  page.evaluate("()=>{window.saveOriginalIdbSet=idbSet;window.saveOriginalSetItem=Storage.prototype.setItem;idbSet=async()=>{throw Error('controlled browser write failure')};Storage.prototype.setItem=function(k,v){if(k.startsWith(STORE_BASE))throw Error('controlled browser fallback failure');return saveOriginalSetItem.call(this,k,v)};window.saveBeforeFailure=JSON.stringify(DB)}")
  page.locator('[data-slot="2"]').click()
  page.wait_for_function('document.querySelector("#save-load-status").textContent.length>0')
  assert page.locator('#save-load-status').is_visible()
  assert page.evaluate('SLOT==="1"&&JSON.stringify(DB)===saveBeforeFailure')
  page.evaluate('()=>{idbSet=saveOriginalIdbSet;Storage.prototype.setItem=saveOriginalSetItem}')
  page.locator('[data-slot="2"]').click()
  page.wait_for_function('SLOT==="2"&&!SLOT_SWITCHING')
  assert page.evaluate('managedTeamId(DB)===saveBrowserOther')
  assert page.evaluate('async()=>managedTeamId(unpackDB(await idbGet(STORE_BASE+"1")))===saveBrowserCurrent')
  page.evaluate("navigateTo('data')");page.wait_for_selector('[data-slot="1"]')
  page.evaluate('window.saveOldShow=document.querySelector("#dshow").onclick;DB=unpackDB(packDB(DB))')
  page.evaluate('saveOldShow()');assert page.locator('#djson').input_value()==''
  assert not errors,errors
  results.append({'width':width,'actualIndexedDB':True,'missingMetadataRestored':True,'damagedPreserved':True,'collapsedOriginal':True,'keyboard':True,'invalidImportPreserved':True,'cancelPure':True,'realLoad':True,'priorGamePreserved':True,'staleInert':True,'noOverflow':True,'errors':errors})
  page.close()
 browser.close()
(a.output/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps({'contexts':len(results),'passed':True},ensure_ascii=False))
