from pathlib import Path
from playwright.sync_api import sync_playwright
import ast,json,argparse,atexit
p=argparse.ArgumentParser(description='초기 후보 비교표의 실제 브라우저 수용');p.add_argument('--output',type=Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
r=Path(__file__).resolve().parents[1];html=(r/'index.html').read_text();rows=[]
audit=next(ast.literal_eval(n.value) for n in ast.parse((r/'scripts/startup-theme-browser.py').read_text()).body if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and n.targets[0].id=='AUDIT')
atexit.register(lambda:(a.output/'results-at-exit.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)))
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width in [1280,320]:
  page=b.new_page(viewport={'width':width,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.route('https://**/*',lambda route:route.abort())
  page.evaluate("()=>{const map=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)}})}")
  page.set_content(html,wait_until='load');page.wait_for_selector('#startup-new')
  page.evaluate("()=>{const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:3,div2:true}),regionCfg('NA',{teams:3,div2:true})];cfg.internationals=[];DB=buildWorld(cfg);const t=activeTeams(DB,'KR',1)[0];startCareer(DB,t.id,'candidate-table-browser');resetUiForWorld();VIEW='season';nav()}")
  before=page.evaluate('JSON.stringify(DB)');assert page.locator('.candidate-table table').count()==1
  assert page.locator('.candidate-table th[aria-sort]').inner_text().startswith('종합 기량 추정')
  assert not page.locator('#init-table-options').evaluate('e=>e.open')
  page.locator('#init-table-options > summary').click()
  page.locator('#init-column-region').check();page.locator('#init-column-reputation').check()
  assert page.locator('#init-column-region').is_checked() and page.locator('#init-column-reputation').is_checked()
  assert page.locator('.candidate-table th').filter(has_text='출신 지역').count()==1
  page.locator('#init-sort').select_option('role');page.locator('#init-direction').select_option('asc')
  page.locator('#init-secondary-0').select_option('salary');page.locator('#init-secondary-direction-0').select_option('asc')
  page.locator('#init-secondary-1').select_option('age');page.locator('#init-secondary-direction-1').select_option('asc')
  assert page.locator('#init-secondary-direction-1').evaluate('e=>e===document.activeElement')
  ordered=page.evaluate("()=>{const p=initialCandidatePage(DB,INITMK,DB.teams[INITMK.target]);return {orders:initialCandidateOrders(INITMK),rows:p.rows.map(x=>({id:x.p.id,role:ROLES.indexOf(x.p.role),salary:asking(p.view,x.p,DB.teams[INITMK.target].region),age:x.p.age}))}}")
  assert len(ordered['orders'])==3
  assert ordered['rows']==sorted(ordered['rows'],key=lambda x:(x['role'],x['salary'],x['age'],x['id']))
  page.locator('#init-table-options > summary').click()
  page.locator('#init-sort-column-age').focus();page.keyboard.press('Enter')
  assert page.locator('th[aria-sort]').get_attribute('aria-sort')=='ascending'
  assert page.locator('#init-sort-column-age').evaluate('e=>e===document.activeElement')
  page.keyboard.press('Enter');assert page.locator('th[aria-sort]').get_attribute('aria-sort')=='descending'
  first=page.locator('[data-init-detail]').first;pid=first.get_attribute('data-init-detail');first.click();page.locator('#init-detail-close').click()
  assert page.locator('[data-init-detail="'+pid+'"]').evaluate('e=>e===document.activeElement')
  assert page.evaluate('JSON.stringify(DB)')==before
  for theme in ['light','dark']:
   page.evaluate('t=>applyStartupTheme(t)',theme);result=page.evaluate(audit)
   assert not result['failed'] and not result['failedControls'],result
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   table=page.locator('.candidate-table');table.evaluate('e=>e.scrollLeft=e.scrollWidth')
   position=page.locator('.candidate-name').first.evaluate('e=>({left:e.getBoundingClientRect().left,parent:e.closest(".candidate-table").getBoundingClientRect().left,color:getComputedStyle(e).backgroundColor,scroll:e.closest(".candidate-table").scrollLeft})')
   assert position['color']!='rgba(0, 0, 0, 0)',position
   if width==320: assert position['scroll']>0 and abs(position['left']-position['parent'])<3,position
   table.evaluate('e=>e.scrollLeft=0');page.screenshot(path=str(a.output/('table-'+str(width)+'-'+theme+'.png')),full_page=True)
   rows.append({'width':width,'theme':theme,'order':ordered,'contrast':result,'sticky':position,'readOnly':True})
  page.evaluate('window.retainedSort=document.querySelector("[data-init-sort-column]").onclick;DB=unpackDB(packDB(DB))')
  stale=page.evaluate('JSON.stringify(INITMK)');page.evaluate('retainedSort()');assert page.evaluate('JSON.stringify(INITMK)')==stale
  page.evaluate('nav()');assert page.evaluate('INITMK.sort')=='ability' and page.evaluate('INITMK.scope')=='region'
  assert not errors,errors;page.close()
 b.close()
(a.output/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print(json.dumps({'contexts':len(rows),'multipleColumns':True,'threeOrderedKeys':True,'keyboard':True,'staleLoad':True,'readOnly':True},ensure_ascii=False))
