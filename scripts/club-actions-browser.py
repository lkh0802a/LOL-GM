from pathlib import Path
from playwright.sync_api import sync_playwright
import ast,json,argparse,atexit
p=argparse.ArgumentParser(description="현재 운영 조건과 기존 수동 행동의 브라우저 수용")
p.add_argument("--output",type=Path,required=True)
p.add_argument("--html",type=Path,default=Path(__file__).resolve().parents[1]/"index.html")
a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
old=ast.parse((Path(__file__).parent/"startup-theme-browser.py").read_text())
source={n.targets[0].id:ast.literal_eval(n.value) for n in old.body if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and n.targets[0].id in ["SETUP","AUDIT"]}
rows=[];atexit.register(lambda:(a.output/"results-at-exit.json").write_text(json.dumps(rows,ensure_ascii=False,indent=2)))
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path="/usr/bin/chromium",headless=True,args=["--no-sandbox"])
 for width in [1280,320]:
  page=browser.new_page(viewport={"width":width,"height":900});errors=[]
  page.on("pageerror",lambda e:errors.append(str(e)));page.route("https://**/*",lambda r:r.abort())
  page.evaluate("()=>{const map=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)}})}")
  page.set_content(a.html.read_text(),wait_until="load");page.wait_for_selector("#startup-new")
  page.evaluate(source["SETUP"])
  page.evaluate("""()=>{const t=managedTeam(DB),o=activeTeams(DB,'NA',1).find(x=>x.id!==t.id),cid='actions-cup';DB.competitions[cid]={id:cid,name:'운영 연결 검증 대회',region:'NA',teams:[t.id,o.id],rules:{fearless:true},stages:[{id:'regular',name:'정규',type:'round_robin',legs:1,bestOf:1}]};const s=newSeason(DB,cid,DB.year,'actions-official',addDays(DB.worldDate,1));s.key=cid;s.region='NA';s.div=1;DB.world.seasons[cid]=s;SSET.view=cid;window.pid=t.roster[0];nav()}""")
  before=page.evaluate("JSON.stringify(DB)")
  assert page.locator("#club-current-actions").count()==1
  assert not page.locator("#club-current-actions details").evaluate("e=>e.open")
  for theme in ["light","dark","auto"]:
   page.evaluate("v=>applyStartupTheme(v)",theme);audit=page.evaluate(source["AUDIT"])
   assert not audit["failed"] and not audit["failedControls"],audit
   assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
   rows.append({"width":width,"theme":theme,"audit":audit})
  assert page.evaluate("JSON.stringify(DB)")==before
  page.locator("#club-current-actions summary").click()
  button=page.locator('[data-club-action="medical"]').first
  button.focus();page.keyboard.press("Enter");assert page.evaluate("UI_OVERLAY.kind")=="club-medical"
  assert page.evaluate("JSON.stringify(DB)")==before
  page.keyboard.press("Escape");assert page.evaluate("UI_OVERLAY===null")
  assert page.locator('[data-club-action="medical"]').first.evaluate("e=>e===document.activeElement")
  # Actual existing manual writer, confirmation cancellation, duplicate and save.
  button.click();pid=page.evaluate("pid")
  page.locator('[data-medical-draft="'+pid+'"]').select_option("rest")
  page.once("dialog",lambda d:d.dismiss());page.locator('[data-medical-apply="'+pid+'"]').click()
  assert page.evaluate("JSON.stringify(DB)")==before
  page.once("dialog",lambda d:d.accept());page.locator('[data-medical-apply="'+pid+'"]').click()
  assert page.evaluate("DB.players[pid].medicalPlan")=="rest"
  page.wait_for_timeout(50);assert page.evaluate("unpackDB(localStorage.getItem(STORE)).players[pid].medicalPlan")=="rest"
  page.evaluate("""()=>{const t=managedTeam(DB);startMedicalEvent(DB,DB.players[pid],'injury','moderate',5,DB.worldDate,new RNG('actions-medical'));delete t.registration.depthChart.TOP;nav()}""")
  assert "현재 검사 근거" in page.locator("#club-current-actions").inner_text()
  page.evaluate("window.oldAction=document.querySelector('[data-club-action]').onclick;DB.worldDate=addDays(DB.worldDate,1)")
  stale=page.evaluate("JSON.stringify(DB)");page.evaluate("oldAction()")
  assert page.evaluate("UI_OVERLAY===null") and page.evaluate("JSON.stringify(DB)")==stale
  page.evaluate("nav();window.oldAction=document.querySelector('[data-club-action]').onclick;DB=unpackDB(packDB(DB));oldAction()")
  assert page.evaluate("UI_OVERLAY===null")
  page.evaluate("nav()")
  # Actual official view consumes the medical state; no forced winner.
  official=page.evaluate("""()=>{const t=managedTeam(DB),s=DB.world.seasons['actions-cup'],day=s.days[0],m=day.matches[0],extra=genPlayer(DB,new RNG('actions-substitute'),{region:'NA',role:'TOP',age:22,base:65});signContract(DB,extra,t,1,2,{});const r=commitWorldAction(DB,{type:'roster.register',actor:'manager',teamId:t.id,registrations:Object.fromEntries(organizationTeams(DB,t).map(x=>[x.id,x.roster.slice()]))});if(!r.ok)throw Error(r.errors.join(' · '));setWorldCalendarDate(DB,day.date);const series=simulateScheduledSeries(DB,s,day,m,DB.competitions[s.comp].stages[0]);commitScheduledSeries(DB,s,m,series);const snapshots=[false,true].map(compact=>{const loaded=unpackDB(packDB(DB,compact));return {compact,medical:loaded.players[pid].medical,plan:loaded.players[pid].medicalPlan,ending:loaded.world.seasons[s.key].days[0].matches[0].res.games.map(g=>g.publicRecord.ending),actions:clubActionsModel(loaded),history:loaded.players[pid].careerEvents}});nav();return {games:series.rec.games.map(g=>({ending:g.publicRecord.ending,players:g.publicRecord.sides.flatMap(x=>x.players.map(p=>p[0]))})),snapshots}}""")
  assert all(g["ending"]["kind"]=="nexus" and pid not in g["players"] for g in official["games"]),official
  assert all(s["medical"]["out"] and s["plan"]=="rest" and all(e["kind"]=="nexus" for e in s["ending"]) for s in official["snapshots"])
  rows.append({"width":width,"official":official})
  page.evaluate("DB.world.pendingOfficial={queue:[{}]};document.querySelector('#main').innerHTML=renderClubActions();bindClubActions()")
  assert "수동 선택" in page.locator("#club-current-actions").inner_text()
  assert page.locator("[data-club-action]:not([disabled])").count()==0
  page.screenshot(path=str(a.output/("pending-"+str(width)+".png")),full_page=True)
  assert not errors,errors
  page.close()
 browser.close()
(a.output/"results.json").write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print(json.dumps({"widths":[1280,320],"contexts":len(rows),"manualWriter":True,"officialNexus":True,"fullLite":True},ensure_ascii=False))
