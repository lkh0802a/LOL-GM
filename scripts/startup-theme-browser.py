from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import argparse
args=argparse.ArgumentParser(description="시작 화면·테마의 실제 브라우저 수용 검사")
args.add_argument("--html",type=Path,default=Path(__file__).resolve().parents[1]/"index.html")
args.add_argument("--output",type=Path,required=True)
args.add_argument("--chromium",default="/usr/bin/chromium")
args=args.parse_args();args.output.mkdir(parents=True,exist_ok=True)
AUDIT="""()=>{
const rgba=s=>{const a=(s.match(/[\\d.]+/g)||[]).map(Number);return s.startsWith('color(srgb')?a.map((v,i)=>i<3?v*255:v):a},mix=(a,b)=>a.slice(0,3).map((v,i)=>v*(a[3]??1)+b[i]*(1-(a[3]??1))),lum=a=>a.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
function bg(e){let chain=[];for(let n=e;n;n=n.parentElement)chain.unshift(n);return chain.reduce((b,n)=>mix(rgba(getComputedStyle(n).backgroundColor),b),[255,255,255])}
let rows=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),n;
while(n=walker.nextNode()){
 const e=n.parentElement, text=n.textContent.trim();if(!text||!e||!e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})||e.closest('script,style,option,[disabled],[inert]'))continue;
 const c=getComputedStyle(e),background=bg(e),color=rgba(e.tagName.toLowerCase()==='text'?c.fill:c.color),foreground=mix(color,background),large=parseFloat(c.fontSize)>=24||parseFloat(c.fontSize)>=18.666&&Number(c.fontWeight)>=700;
 if(color.length>=3)rows.push({tag:e.tagName,id:e.id,text:text.slice(0,90),color:c.color,background,ratio:ratio(foreground,background),minimum:large?3:4.5});
}
const controls=[...document.querySelectorAll('select,input,textarea,button')].filter(e=>e.checkVisibility()&&!e.disabled&&!e.closest('[inert]')&&parseFloat(getComputedStyle(e).borderTopWidth)>0&&getComputedStyle(e).borderTopStyle!=='none').map(e=>{const c=getComputedStyle(e),b=bg(e);return {tag:e.tagName,id:e.id,border:c.borderTopColor,bg:b,ratio:ratio(rgba(c.borderTopColor),b),colorScheme:c.colorScheme}});
const radar=[...document.querySelectorAll('svg polygon[stroke-width=\"2\"]')].filter(e=>e.checkVisibility()).map(e=>({stroke:getComputedStyle(e).stroke,ratio:ratio(rgba(getComputedStyle(e).stroke),bg(e))}));
return {rows,controls,radar,failedRadar:radar.filter(x=>x.ratio<3),failed:rows.filter(x=>x.ratio+1e-6<x.minimum),failedControls:controls.filter(x=>x.ratio+1e-6<3)};
}"""
results=[]
import atexit
atexit.register(lambda: (args.output/"browser-results-at-exit.json").write_text(json.dumps(results,ensure_ascii=False,indent=2)))
SETUP="()=>{const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:true,system:'franchise'})];cfg.internationals=[];DB=buildWorld(cfg);const [t,o]=activeTeams(DB,'NA',1);setManagedTeam(DB,t.id);DB.world={phase:'season',year:DB.year,seed:'contract-browser',manage:'manual',registrationVersion:1,seasons:{},steps:[],step:0,offers:[],marketLog:[],pendingOfficial:null};setWorldCalendarDate(DB,DB.year+'-01-10');for(const team of activeTeams(DB)){for(const r of ROLES){const p=genPlayer(DB,new RNG('contract-browser|'+team.id+r),{region:'NA',role:r,age:22,base:65});signContract(DB,p,team,1,2,{})}if(!team.parent&&reserveTeamsOf(DB,team).length){const p=genPlayer(DB,new RNG('practice-browser-extra|'+team.id),{region:'NA',role:'TOP',age:22,base:65});signContract(DB,p,team,1,2,{})}initializeDepthChart(DB,team,true);team.finance.cash=1000}initializeOfficialRegistrations(DB);resetUiForWorld();VIEW='season';nav();}"
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox'])
 for width in [1280,320]:
  page=browser.new_page(viewport={'width':width,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.route('https://**/*',lambda route:route.abort())
  page.evaluate("""()=>{const map=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>{if(window.failWrites)throw Error('controlled write denied');map.set(k,String(v))},removeItem:k=>map.delete(k)}})}""")
  page.set_content(args.html.read_text(),wait_until='load');page.wait_for_selector('#startup-new');original=page.evaluate('JSON.stringify(DB)')
  for system in ['light','dark']:
   page.emulate_media(color_scheme=system)
   for theme in ['auto','light','dark']:
    page.locator('#startup-settings').click();page.locator('#startup-theme').select_option(theme)
    a=page.evaluate(AUDIT);results.append({'width':width,'system':system,'theme':theme,'screen':'settings','audit':a});assert not a['failed'] and not a['failedControls'] and not a['failedRadar'],a
    expected=system if theme=='auto' else theme;assert page.locator('#startup-theme').evaluate('e=>getComputedStyle(e).colorScheme')==expected
    page.locator('#startup-theme').focus();assert page.locator('#startup-theme').evaluate("e=>e.matches(':focus-visible')")
    page.locator('#startup-back').click();buttons=page.locator('.startup-actions button').evaluate_all('els=>els.map(e=>e.getBoundingClientRect().toJSON())');assert len(buttons)==3 and all(abs(b['width']-buttons[0]['width'])<1 and abs(b['left']-buttons[0]['left'])<1 and b['height']>=48 for b in buttons)
    assert page.locator('#startup-new').inner_text()=='새 게임';assert not page.locator('#app-nav').is_visible();assert not page.locator('#app-save').is_visible()
    a=page.evaluate(AUDIT);results.append({'width':width,'system':system,'theme':theme,'screen':'home','audit':a});assert not a['failed'] and not a['failedControls'] and not a['failedRadar'],a
    page.locator('#startup-new').focus();page.keyboard.press('Enter');assert page.locator('#main h2').inner_text()=='감독 커리어 시작';assert page.locator('#steam').is_visible() and page.locator('#steam').bounding_box()['y']<900;assert page.locator('#sstart').bounding_box()['y']+page.locator('#sstart').bounding_box()['height']<900
    assert not page.locator('.career-world-details').evaluate('e=>e.open');assert not page.locator('.career-world-details .cfgs').first.is_visible();assert not page.locator('.career-club-details').evaluate('e=>e.open')
    a=page.evaluate(AUDIT);results.append({'width':width,'system':system,'theme':theme,'screen':'career','pickerY':page.locator('#steam').bounding_box()['y'],'audit':a});assert not a['failed'] and not a['failedControls'] and not a['failedRadar'],a
    page.locator('.career-world-details>summary').focus();page.keyboard.press('Enter');assert page.locator('.career-world-details').evaluate('e=>e.open');assert page.locator('.career-world-details').inner_text().find('LSA')>=0
    a=page.evaluate(AUDIT);results.append({'width':width,'system':system,'theme':theme,'screen':'details','audit':a});assert not a['failed'],a
    page.keyboard.press('Enter');assert not page.locator('.career-world-details').evaluate('e=>e.open')
    page.locator('.career-club-details>summary').focus();page.keyboard.press('Enter');assert page.locator('.career-club-details').evaluate('e=>e.open');assert '모구단' in page.locator('.career-club-details').inner_text();a=page.evaluate(AUDIT);results.append({'width':width,'system':system,'theme':theme,'screen':'club-details','audit':a});assert not a['failed'] and not a['failedControls'],a
    page.keyboard.press('Enter');assert not page.locator('.career-club-details').evaluate('e=>e.open');page.locator('#startup-back').click();assert page.evaluate('JSON.stringify(DB)')==original
  page.screenshot(path=str(args.output/f'home-{width}.png'),full_page=True)
  page.locator('#startup-new').click();page.screenshot(path=str(args.output/f'career-{width}.png'),full_page=True)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  # Existing manual career/save writers, settings I/O failure and stale callback.
  page.locator('#sstart').click();page.wait_for_function('DB.world?.phase==="initial_roster"&&!SLOT_SWITCHING');assert page.evaluate('DB.world.manage')=='manual'
  saved=page.evaluate('localStorage.getItem(STORE)');assert page.evaluate('unpackDB(localStorage.getItem(STORE)).world.phase')=='initial_roster'
  page.evaluate('START_UI={active:true,page:"home",error:""};nav()');page.locator('#startup-settings').click()
  old=page.evaluate('localStorage.getItem("lol-gm-theme")');page.evaluate('window.failWrites=true');page.locator('#startup-theme').select_option('light')
  assert '設定' not in page.locator('#startup-theme-status').inner_text();assert '설정 저장은 실패' in page.locator('#startup-theme-status').inner_text();assert page.evaluate('localStorage.getItem("lol-gm-theme")')==old
  page.evaluate('window.retainedTheme=document.querySelector("#startup-theme").onchange;window.failWrites=false');page.locator('#startup-back').click();page.evaluate('retainedTheme()');assert page.evaluate('localStorage.getItem("lol-gm-theme")')==old
  page.locator('#startup-load').click();page.locator('#startup-resume').click();assert page.locator('#app-nav').is_visible() and page.locator('#app-save').is_visible()
  for theme in ['light','dark','auto']:
   page.locator('#app-theme').select_option(theme);a=page.evaluate(AUDIT);results.append({'width':width,'screen':'initial-career','theme':theme,'audit':a});assert not a['failed'] and not a['failedControls'] and not a['failedRadar'],a
  old=page.evaluate('localStorage.getItem("lol-gm-theme")');page.evaluate('window.failWrites=true');page.locator('#app-theme').select_option('light');assert '설정 저장은 실패' in page.locator('#app-theme-status').inner_text();assert page.locator('#app-theme-status').is_visible();assert page.evaluate('localStorage.getItem("lol-gm-theme")')==old
  a=page.evaluate(AUDIT);results.append({'width':width,'screen':'active-theme-save-failure','audit':a});assert not a['failed'] and not a['failedControls'],a;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.evaluate('window.retainedActiveTheme=document.querySelector("#app-theme").onchange;window.failWrites=false;nav()');beforeTheme=page.evaluate('localStorage.getItem("lol-gm-theme")');page.evaluate('document.querySelector("#app-theme").value="dark";retainedActiveTheme()');assert page.evaluate('localStorage.getItem("lol-gm-theme")')==beforeTheme
  page.locator('#app-theme').select_option('dark');assert not page.locator('#app-theme-status').is_visible();assert page.evaluate('localStorage.getItem("lol-gm-theme")')=='dark'
  assert page.evaluate('localStorage.getItem(STORE)')==saved
  # Same real save, restored through existing pack/unpack boundary; no new UI state schema.
  page.evaluate('DB=unpackDB(localStorage.getItem(STORE));resetUiForWorld();VIEW="season";nav()');assert page.evaluate('DB.world.phase')=='initial_roster' and page.locator('#app-nav').is_visible()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  # Real owned-club briefing, authorized paid report consumers and observed radar.
  page.evaluate(SETUP);page.evaluate("()=>{const o=activeTeams(DB,'NA',1).find(t=>t.id!==managedTeamId(DB));window.ids=o.roster.slice(0,3);ids.forEach(id=>{mInterest(DB,id,'A');scoutPlayers(DB,[id],40,.1*psOf(DB,managedTeam(DB).region))});nav()}")
  page.locator('[data-brief-recruit]').click()
  for pid in page.evaluate('ids'):page.locator('[data-shortlist-select="'+pid+'"]').click()
  page.locator('#shortlist-compare-open').click();assert page.locator('#shortlist-comparison svg').count()==1
  before=page.evaluate('JSON.stringify(DB)')
  for theme in ['light','dark','auto']:
   page.evaluate('v=>{applyStartupTheme(v)}',theme);a=page.evaluate(AUDIT);results.append({'width':width,'screen':'observed-comparison','theme':theme,'audit':a});assert not a['failed'] and not a['failedControls'] and not a['failedRadar'],a
  assert page.evaluate('JSON.stringify(DB)')==before
  page.locator('#brief-recruit-close').click()
  for view in ['season','squad','match','patch','analysis','data']:
   page.evaluate("v=>{SQUAD=managedTeamId(DB);const teams=activeTeams(DB,'NA',1);SEL.blue=teams[0].id;SEL.red=teams[1].id;VIEW=v;nav()}",view)
   for theme in ['light','dark','auto']:
    page.locator('#app-theme').select_option(theme);a=page.evaluate(AUDIT);results.append({'width':width,'screen':view,'theme':theme,'audit':a});assert not a['failed'] and not a['failedControls'] and not a['failedRadar'],a
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),view
  page.evaluate("()=>{VIEW='season';nav()}")
  for kind in ['entry','finance','staff','medical','contract','practice','scrim','recruit']:
   button=page.locator('[data-brief-'+kind+']').first;assert button.count(),kind
   pristine=page.evaluate('JSON.stringify(DB)');button.click()
   for theme in ['light','dark','auto']:
    page.evaluate('v=>applyStartupTheme(v)',theme);a=page.evaluate(AUDIT);results.append({'width':width,'screen':'club-'+kind,'theme':theme,'audit':a});assert not a['failed'] and not a['failedControls'] and not a['failedRadar'],a
   page.keyboard.press('Escape');assert page.evaluate('UI_OVERLAY===null')
   assert page.evaluate('JSON.stringify(DB)')==pristine,kind
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),kind
  assert not errors,errors;page.close()
 for stored in ['auto','light','dark']:
  cold=browser.new_page(viewport={'width':320,'height':900});cold.route('https://**/*',lambda route:route.abort())
  cold.emulate_media(color_scheme='light')
  cold.evaluate("v=>{const map=new Map([['lol-gm-theme',v]]);Object.defineProperty(window,'localStorage',{value:{getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)}})}",stored)
  cold.set_content(args.html.read_text(),wait_until='load');cold.wait_for_selector('#startup-new')
  cold.locator('#startup-settings').click();assert cold.locator('#startup-theme').input_value()==stored
  for system in ['light','dark']:
   cold.emulate_media(color_scheme=system);expected=system if stored=='auto' else stored
   assert cold.locator('#startup-theme').evaluate('e=>getComputedStyle(e).colorScheme')==expected
   a=cold.evaluate(AUDIT);results.append({'width':320,'screen':'cold-preference','theme':stored,'system':system,'audit':a});assert not a['failed'] and not a['failedControls'],a
  cold.close()
 browser.close()
(args.output/'browser-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print(json.dumps({'cases':len(results),'minText':min(x['ratio'] for r in results for x in r['audit']['rows']),'minControl':min(x['ratio'] for r in results for x in r['audit']['controls']),'widths':[1280,320]},ensure_ascii=False))
