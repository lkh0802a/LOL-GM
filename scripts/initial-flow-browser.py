from pathlib import Path
from playwright.sync_api import sync_playwright
import argparse,json,atexit
p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True);rows=[]
atexit.register(lambda:(a.output/'partial.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)))
html=(Path(__file__).resolve().parents[1]/'index.html').read_text()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in [1280,320]:
  page=b.new_page(viewport={'width':width,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.route('https://**/*',lambda r:r.abort());page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})}");page.set_content(html);page.wait_for_selector('#startup-new')
  page.evaluate("()=>{const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:3,div2:true}),regionCfg('NA',{teams:3,div2:true})];cfg.internationals=[];DB=buildWorld(cfg);startCareer(DB,activeTeams(DB,'KR',1)[0].id,'initial-flow-browser');resetUiForWorld();VIEW='season';nav()}")
  before=page.evaluate('JSON.stringify(DB)');assert page.locator('.candidate-table').count()==0
  page.locator('nav [data-v="transfer"]').click();assert page.locator('.candidate-table table').count()==1
  assert page.locator('#init-sort-column-role').count()==0
  assert page.locator('th button').first.evaluate("e=>getComputedStyle(e).borderStyle==='none'")
  assert not page.locator('#init-table-options').evaluate('e=>e.open') and not page.locator('#init-metric-filters').evaluate('e=>e.open')
  page.locator('#init-role-JGL').check();page.locator('#init-role-SUP').check();assert page.evaluate("initialCandidatePage(DB,INITMK,DB.teams[INITMK.target]).rows.every(x=>['JGL','SUP'].includes(x.p.role))")
  page.locator('#init-role-all').click();assert page.evaluate('INITMK.roles.length')==0
  source=page.evaluate("()=>{const x=initialCandidatePage(DB,INITMK,DB.teams[INITMK.target]).rows[0];return {id:x.p.id,name:x.p.name,metrics:observedPlayerCoreMetrics(initialCandidateView(DB),x.p)}}")
  page.locator('#init-query').fill(source['name']);page.locator('#init-query').press('Enter');page.locator('#init-metric-filters > summary').click()
  for k in ['laning','vision']:
   for bound in ['min','max']:page.locator('#init-metric-'+k+'-'+bound).fill(str(source['metrics'][k]))
  assert page.evaluate('Object.keys(INITMK.metricFilters).length')==0
  page.locator('#init-metric-apply').click();assert page.locator('[data-init-detail="'+source['id']+'"]').count()==1
  page.locator('#init-metric-laning-min').fill('99');page.locator('#init-metric-laning-max').fill('1');old=page.evaluate('JSON.stringify(INITMK.metricFilters)');page.locator('#init-metric-apply').click();assert page.evaluate('JSON.stringify(INITMK.metricFilters)')==old
  page.locator('#init-metric-cancel').click();assert page.locator('#init-metric-laning-min').input_value()==str(source['metrics']['laning'])
  page.locator('[data-init-detail="'+source['id']+'"]').click();assert page.locator('#init-candidate-detail').is_visible();page.locator('#init-detail-close').click();assert page.locator('[data-init-detail="'+source['id']+'"]').evaluate('e=>e===document.activeElement')
  assert page.evaluate('JSON.stringify(DB)')==before
  page.locator('#init-open-squad').click();assert page.locator('.candidate-table').count()==0 and '선수단 구성' in page.locator('#main').inner_text();assert page.evaluate('JSON.stringify(DB)')==before
  page.locator('#init-back-recruitment').click();assert page.evaluate('VIEW')=='transfer';assert page.locator('[data-init-detail="'+source['id']+'"]').count()==1
  # Retained real actions after loading, slot, view, date and manager replacement cannot consume a save or writer.
  for mode in ['load','slot','view','render','date','year','manager','team','fired','manage','overlay','switching','phase','target']:
   page.evaluate("()=>{window.startDB=JSON.stringify(DB);window.startSlot=SLOT;window.startView=VIEW;window.startRender=UI_RENDER_ID;window.startState=JSON.stringify(INITMK);window.retained=document.querySelector('[data-init-interest]').onclick;window.realSave=saveDB;window.savedCount=0;saveDB=()=>{savedCount++}}")
   changes={'load':'DB=unpackDB(packDB(DB))','slot':"SLOT='2'",'view':"VIEW='squad'",'render':'UI_RENDER_ID++','date':"DB.worldDate='2028-01-09'",'year':'DB.year++','manager':'DB.manager={...DB.manager}','team':'DB.manager.teamId=null','fired':'DB.world.fired=true','manage':"DB.world.manage='ai'",'overlay':'UI_OVERLAY={}', 'switching':'SLOT_SWITCHING=true','phase':"DB.world.phase='season'",'target':"INITMK.target='missing'"}
   page.evaluate(changes[mode]);snapshot=page.evaluate('JSON.stringify(DB)');page.evaluate('retained()');assert page.evaluate('JSON.stringify(DB)')==snapshot and page.evaluate('savedCount')==0,mode
   page.evaluate("()=>{DB=JSON.parse(startDB);SLOT=startSlot;VIEW=startView;UI_RENDER_ID=startRender;INITMK=JSON.parse(startState);UI_OVERLAY=null;SLOT_SWITCHING=false;saveDB=realSave;nav()}")
   rows.append({'width':width,'stale':mode,'dbSame':True,'save0':True})
  # Use the existing manual interest writer, then save and actual load.
  expected=page.evaluate("()=>{const copy=JSON.parse(JSON.stringify(DB));initialCandidateCommand(copy,INITMK,'"+source['id']+"','interest');return JSON.stringify(copy)}")
  page.locator('[data-init-interest="'+source['id']+'"]').locator('xpath=ancestor::details/summary').click();page.locator('[data-init-interest="'+source['id']+'"]').click();assert page.evaluate('JSON.stringify(DB)')==expected
  scoutExpected=page.evaluate("()=>{const copy=JSON.parse(JSON.stringify(DB));initialCandidateCommand(copy,INITMK,'"+source['id']+"','scout');return JSON.stringify(copy)}")
  page.evaluate("()=>{window.productionSave=saveDB;window.scoutSaves=0;saveDB=()=>{scoutSaves++;productionSave()}}")
  page.locator('[data-init-scout="'+source['id']+'"]').locator('xpath=ancestor::details/summary').click();page.locator('[data-init-scout="'+source['id']+'"]').click();assert page.evaluate('JSON.stringify(DB)')==scoutExpected and page.evaluate('scoutSaves')==1
  page.evaluate('saveDB=productionSave')
  loaded=page.evaluate("async()=>{saveDB();const ok=await persistWorldSnapshot(DB,SLOT,STORE);const loaded=await loadDB();const result={ok,interest:!!recruitmentTarget(loaded,'"+source['id']+"')};DB=loaded;resetUiForWorld();VIEW='transfer';nav();return result}");assert loaded['ok'] and loaded['interest'];assert page.evaluate("INITMK.scope==='region'&&INITMK.roles.length===0&&Object.keys(INITMK.metricFilters).length===0")
  assert not errors,errors;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path=str(a.output/('initial-'+str(width)+'.png')),full_page=True)
  # Same contextual route opens the existing off-season window with no view mutation.
  page.evaluate("()=>{DB.world.phase='offseason';DB.world.contractWindow={stage:'exclusive',startSeason:DB.year+1,seasonEndDate:DB.worldDate,startDate:DB.worldDate,exclusiveThrough:DB.worldDate,contractExpiryDate:DB.worldDate,outsideContactDate:DB.worldDate};VIEW='transfer';nav()}")
  current=page.evaluate('JSON.stringify(DB)');page.evaluate('nav()');assert page.evaluate('JSON.stringify(DB)')==current
  page.evaluate("()=>{DB.world.phase='season';VIEW='season';nav()}");assert page.locator('nav [data-v="transfer"]').is_hidden()
  rows.append({'width':width,'filters':True,'manualWriter':True,'load':True,'offseasonReadOnly':True,'errors':errors});page.close()
 b.close()
(a.output/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print(json.dumps({'contexts':len(rows),'complete':True},ensure_ascii=False))
