from pathlib import Path
from playwright.sync_api import sync_playwright
import ast,json,argparse,atexit
p=argparse.ArgumentParser(description='관찰 후보 이동·선택·수동 관찰의 실제 브라우저 수용')
p.add_argument('--output',type=Path,required=True);p.add_argument('--html',type=Path,default=Path(__file__).resolve().parents[1]/'index.html')
a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
old=ast.parse((Path(__file__).parent/'startup-theme-browser.py').read_text())
setup=next(ast.literal_eval(n.value) for n in old.body if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and n.targets[0].id=='SETUP')
rows=[];atexit.register(lambda:(a.output/'results-at-exit.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)))
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width in [1280,320]:
  page=browser.new_page(viewport={'width':width,'height':900});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.route('https://**/*',lambda r:r.abort())
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})}")
  page.set_content(a.html.read_text(),wait_until='load');page.wait_for_selector('#startup-new');page.evaluate(setup)
  page.evaluate("()=>{for(let i=0;i<50;i++){const p=genPlayer(DB,new RNG('return-fa-'+i),{region:'NA',role:ROLES[i%5],age:22,base:65});p.name='복귀후보'+i;}window.originalSave=saveDB;window.returnSaves=0;saveDB=()=>{returnSaves++;return originalSave()};navigateTo('squad')}")
  before=page.evaluate('JSON.stringify(DB)');page.evaluate('scoutingSearchBlock()');assert page.evaluate('JSON.stringify(DB)')==before
  assert page.locator('[data-scout-select]').count()==20
  ids=page.locator('[data-scout-select]').evaluate_all('els=>els.slice(0,2).map(e=>e.dataset.scoutSelect)')
  for pid in ids:page.locator('[data-scout-select="'+pid+'"]').check()
  page.locator('#scnext').click();assert page.locator('#sccount').inner_text().startswith('선택 2명')
  third=page.locator('[data-scout-select]').first.get_attribute('data-scout-select');page.locator('[data-scout-select]').first.check();ids.append(third)
  selected=page.evaluate('scoutReturnState().selected.slice()');assert selected==ids
  button=page.locator('[data-scout-detail]').first;pid=button.get_attribute('data-scout-detail');button.focus();page.keyboard.press('Enter')
  assert page.locator('#scback').count()==1;assert page.evaluate('JSON.stringify(DB)')==before
  page.keyboard.press('Enter');assert page.evaluate('scoutReturnState().page')==1
  assert page.locator('[data-scout-detail="'+pid+'"]').evaluate('e=>e===document.activeElement')
  y=page.evaluate('scrollY');page.evaluate("navigateTo('season');navigateTo('squad')");page.wait_for_timeout(50)
  assert page.evaluate('scoutReturnState().selected')==ids and page.evaluate('scoutReturnState().page')==1
  assert abs(page.evaluate('scrollY')-y)<=1
  # Unfinished typed input survives route changes without a change/blur event.
  page.locator('#scq').fill('복귀후보');page.evaluate("navigateTo('season');navigateTo('squad')");page.wait_for_timeout(50)
  assert page.locator('#scq').input_value()=='복귀후보' and page.evaluate('scoutReturnState().page')==0
  assert page.evaluate('scoutReturnState().selected')==ids
  for theme in ['light','dark']:
   page.evaluate('v=>applyStartupTheme(v)',theme);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.screenshot(path=str(a.output/f'table-{width}-{theme}.png'),full_page=True)
  page.locator('#scq').fill('존재하지않는후보검색');page.locator('#scq').dispatch_event('change');assert page.locator('[data-scout-select]').count()==0
  page.locator('#scq').fill('복귀후보');page.locator('#scq').dispatch_event('change');assert page.locator('[data-scout-select]').count()==20
  # Real writer parity, cancellation, changed-state confirmation and duplicate callback.
  candidate=page.locator('[data-scout]').first;pid=candidate.get_attribute('data-scout')
  page.evaluate("window.oldScout=document.querySelector('[data-scout]').onclick;window.confirm=()=>false")
  before=page.evaluate('JSON.stringify(DB)');candidate.click();assert page.evaluate('JSON.stringify(DB)')==before and page.evaluate('returnSaves')==0
  page.evaluate("window.confirm=()=>{DB.worldDate=addDays(DB.worldDate,1);return true};oldScout({stopPropagation(){}})")
  changed=page.evaluate('JSON.stringify(DB)');page.evaluate('oldScout({stopPropagation(){}})');assert page.evaluate('JSON.stringify(DB)')==changed and page.evaluate('returnSaves')==0
  page.evaluate('confirm=()=>true;nav()');candidate=page.locator('[data-scout]').first;pid=candidate.get_attribute('data-scout')
  expected=page.evaluate("id=>{const d=JSON.parse(JSON.stringify(DB));scoutPlayers(d,[id],20,.1*psOf(d,managedTeam(d).region));return JSON.stringify(d)}",pid)
  page.evaluate("()=>{window.oldScout=document.querySelector('[data-scout]').onclick}");candidate.click()
  assert page.evaluate('JSON.stringify(DB)')==expected and page.evaluate('returnSaves')==1
  page.evaluate('oldScout({stopPropagation(){}})');assert page.evaluate('JSON.stringify(DB)')==expected and page.evaluate('returnSaves')==1
  page.locator('#scclear').click();page.locator('#scall').click()
  chosen=page.evaluate('scoutReturnState().selected');assert len(chosen)==10 and page.locator('[data-scout-select]:checked').count()==10
  assert page.locator('#scall').evaluate('e=>e.indeterminate')
  expectedBatch=page.evaluate("ids=>{const d=JSON.parse(JSON.stringify(DB));scoutPlayers(d,ids,20,.1*psOf(d,managedTeam(d).region)*ids.length);return JSON.stringify(d)}",chosen)
  page.evaluate("()=>{window.oldBatch=document.querySelector('#scbatch').onclick}");page.locator('#scbatch').click()
  assert page.evaluate('JSON.stringify(DB)')==expectedBatch and page.evaluate('returnSaves')==2
  page.evaluate('oldBatch()');assert page.evaluate('JSON.stringify(DB)')==expectedBatch and page.evaluate('returnSaves')==2
  assert '보고서 갱신' in page.locator('#main [role="status"]').first.inner_text()
  # Existing unfinished squad preparation survives the same route return, and applies through the original writer.
  draft=page.evaluate("()=>{SQUAD_EDIT=null;nav();const t=managedTeam(DB);return {old:JSON.stringify(DB),tac:(t.tactics.aggression+1)%101,tid:t.id}}")
  page.locator('#trint').select_option('light')
  page.locator('[data-tac="aggression"]').evaluate('(e,v)=>{e.value=v;e.dispatchEvent(new Event("input",{bubbles:true}))}',draft['tac'])
  assert page.evaluate('JSON.stringify(DB)')==draft['old']
  page.evaluate("navigateTo('season');navigateTo('squad')");page.wait_for_timeout(50)
  assert page.locator('#trint').input_value()=='light' and int(page.locator('[data-tac="aggression"]').input_value())==draft['tac']
  page.locator('#sqapply').click();assert page.evaluate('managedTeam(DB).training.intensity')=='light' and page.evaluate('managedTeam(DB).tactics.aggression')==draft['tac']
  page.evaluate("()=>{const t=managedTeam(DB);delete t.practiceDay;for(const id of t.roster)delete DB.players[id].practiceDay;runDailyPractice(DB)}")
  assert page.evaluate('managedTeam(DB).practiceDay.drills')>0
  # Actual professional fictional competition, public observation consumer and saved history.
  official=page.evaluate("""()=>{const teams=activeTeams(DB,'NA',1).filter(t=>t.id!==managedTeamId(DB)).slice(0,2),cid='scout-return-cup';DB.competitions[cid]={id:cid,name:'관찰 복귀 공식 수용',region:'NA',teams:teams.map(t=>t.id),rules:{fearless:true},stages:[{id:'regular',name:'정규',type:'round_robin',legs:1,bestOf:1}]};const s=newSeason(DB,cid,DB.year,'scout-return-official',addDays(DB.worldDate,1));s.key=cid;s.region='NA';s.div=1;DB.world.seasons[cid]=s;const day=s.days[0],m=day.matches[0];setWorldCalendarDate(DB,day.date);const result=simulateScheduledSeries(DB,s,day,m,DB.competitions[cid].stages[0]);commitScheduledSeries(DB,s,m,result);const pid=teams[0].roster[0];scoutPlayers(DB,[pid],20,.1*psOf(DB,managedTeam(DB).region));const original=JSON.stringify(DB),copies=[false,true].map(lite=>{const d=unpackDB(packDB(DB,lite)),read=JSON.parse(JSON.stringify(d));return {lite,report:scoutReport(read,read.players[pid]),finance:d.teams[managedTeamId(d)].finance.cash,preparation:{training:d.teams[managedTeamId(d)].training,tactics:d.teams[managedTeamId(d)].tactics,usage:d.teams[managedTeamId(d)].practiceUsage},endings:d.world.seasons[cid].days[0].matches[0].res.games.map(g=>g.publicRecord.ending),scout:d.scout[pid]}});if(JSON.stringify(DB)!==original)throw Error('save/read mutation');nav();return {pid,cid,games:result.rec.games.map(g=>g.publicRecord.ending),copies}}""")
  assert all(x['kind']=='nexus' for x in official['games']),official
  assert all(x['report']['sample']['g']>0 and all(e['kind']=='nexus' for e in x['endings']) for x in official['copies']),official
  assert official['copies'][0]['preparation']==official['copies'][1]['preparation'] and official['copies'][0]['scout']==official['copies'][1]['scout'] and official['copies'][0]['finance']==official['copies'][1]['finance']
  page.evaluate("v=>{SCOUTSET.q=DB.players[v.pid].name;SCOUTSET.competition=v.cid;scoutReturnState().page=0;nav()}",official)
  assert page.locator('[data-scout-detail="'+official['pid']+'"]').count()==1
  original=page.evaluate('JSON.stringify(DB)');page.locator('[data-scout-detail="'+official['pid']+'"]').click();assert page.evaluate('JSON.stringify(DB)')==original;page.locator('#scback').click()
  foreignTeam=page.evaluate("activeTeams(DB,'NA',1).find(t=>t.id!==managedTeamId(DB)).id")
  page.locator('#sq').select_option(foreignTeam)
  groupBefore=page.evaluate('JSON.stringify(DB)');page.evaluate('confirm=()=>false');page.locator('#scoutT').click();assert page.evaluate('JSON.stringify(DB)')==groupBefore
  groupExpected=page.evaluate("()=>{const d=JSON.parse(JSON.stringify(DB));scoutPlayers(d,d.teams[SQUAD].roster,35,.5*psOf(d,managedTeam(d).region));return JSON.stringify(d)}")
  page.evaluate("()=>{confirm=()=>true;window.oldTeamScout=document.querySelector('#scoutT').onclick}");page.locator('#scoutT').click();assert page.evaluate('JSON.stringify(DB)')==groupExpected
  saved=page.evaluate('returnSaves');page.evaluate('oldTeamScout()');assert page.evaluate('JSON.stringify(DB)')==groupExpected and page.evaluate('returnSaves')==saved
  page.locator('#sq').select_option(page.evaluate('managedTeamId(DB)'))
  # Pending, AI, fired and academy manager never gain recruitment control.
  base=page.evaluate('JSON.stringify(DB)');statechecks=[]
  for kind,code in [('pending','DB.world.pendingOfficial={queue:[{}]}'),('ai',"DB.world.manage='ai'"),('fired','DB.world.fired=true'),('reserve','setManagedTeam(DB,reserveTeamsOf(DB,managedTeam(DB))[0].id)')]:
   page.evaluate('(b)=>{DB=JSON.parse(b);resetUiForWorld();VIEW="squad";SQUAD=managedTeamId(DB);nav()}',base)
   page.evaluate(code+';nav()');now=page.evaluate('JSON.stringify(DB)')
   assert page.locator('[data-scout]:not([disabled])').count()==0
   assert page.evaluate('JSON.stringify(DB)')==now;statechecks.append(kind)
  page.evaluate('(b)=>{DB=JSON.parse(b);resetUiForWorld();VIEW="squad";SQUAD=managedTeamId(DB);nav()}',base)
  page.evaluate("SCOUTSET.q='';SCOUTSET.competition='ALL';nav()");page.locator('[data-scout-select]').first.check();page.locator('#scq').fill('복귀후보')
  page.evaluate("window.oldScout=document.querySelector('[data-scout]').onclick;DB=unpackDB(packDB(DB));resetUiForWorld();nav()")
  loaded=page.evaluate('JSON.stringify(DB)');page.evaluate('oldScout({stopPropagation(){}})')
  assert page.evaluate('JSON.stringify(DB)')==loaded and page.locator('#scq').input_value()=='' and page.evaluate('scoutReturnState().selected.length')==0
  assert not errors,errors
  rows.append({'width':width,'pureRead':True,'pages':True,'detailReturn':True,'unfinishedQuery':True,'writerWholeEquality':True,'batch10Equality':True,'team35Equality':True,'squadDraftReturnWriterDailyConsumer':True,'staleLoadDateConfirmDuplicate':True,'authority':statechecks,'ids':ids,'pid':pid,'official':official})
 browser.close()
(a.output/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print('관찰 후보 복귀 브라우저 수용 통과',len(rows))
