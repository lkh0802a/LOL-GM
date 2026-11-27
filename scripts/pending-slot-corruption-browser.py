from pathlib import Path
from playwright.sync_api import sync_playwright
import json, subprocess
root=Path(__file__).resolve().parents[1]
html='<!doctype html><html><body></body></html>'
source=subprocess.check_output(['node','--input-type=module','-e',"import {engineSource,artifactSource} from './scripts/test-harness.mjs';const a=await artifactSource('app.js');process.stdout.write(await engineSource()+'\\nfunction cancelUiTasks(){}function resetUiForWorld(){}function navigateTo(){}\\n'+a.slice(0,a.indexOf('const $=s=>')));"],cwd=root,text=True)
fixture=json.loads((root/'docs/evidence/unemployed-season-fixture-2026-10-08.json').read_text())
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page()
 page.route('**/*',lambda route: route.fulfill(status=200,content_type='text/html',body=html) if route.request.url=='http://127.0.0.1:8765/' else route.abort())
 page.goto('http://127.0.0.1:8765/')
 page.add_script_tag(content=source)
 out=page.evaluate('''async fixture=>{
 const db=unpackDB(JSON.stringify(fixture)),team=managedTeamId(db);runOffseason(db);closeMarket(db);startWorldSeason(db,team,'pending-frame-authority-proof');
 let days=0;while(!db.world.pendingOfficial?.queue?.length&&++days<60)playWorldDay(db);
 if(days>=60)throw Error('no pending match');
 const selection=pendingOfficialSelectionSetup(db);if(selection)applyPendingOfficialSelection(db,selection.prompt.mode==='first'?{kind:'side',value:'blue'}:{kind:selection.prompt.remaining,value:selection.prompt.remaining==='side'?'blue':'first'});
 pendingOfficialDraftSetup(db);resolvePendingOfficialMatch(db,null);DB=unpackDB(packDB(db));SLOT='1';STORE=STORE_BASE+SLOT;
 const original=packDB(DB),bad=JSON.parse(original);bad.world.pendingOfficial.queue[0].session.seed='synthetic-invalid-seed';const badBytes=JSON.stringify(bad),third='synthetic-third-slot';
 await idbSet(STORE_BASE+'1',original);await idbSet(STORE_BASE+'2',badBytes);await idbSet(STORE_BASE+'3',third);
 const switched=await switchSaveSlot('2');let error=null;const before=packDB(DB);try{resolvePendingOfficialMatch(DB,null)}catch(e){error=e.message}const same=before===packDB(DB);
 await new Promise(resolve=>setTimeout(resolve,500)); if(SAVE_QUEUES.get(STORE_BASE+'2')) await SAVE_QUEUES.get(STORE_BASE+'2');
 const slot1=await idbGet(STORE_BASE+'1'),slot2=await idbGet(STORE_BASE+'2'),slot3=await idbGet(STORE_BASE+'3');
 return {days,switched:switched.ok,error,rejectedResumeUnchanged:same,slot1Unchanged:slot1===original,slot2Unchanged:slot2===badBytes,slot3Unchanged:slot3===third,pending:!!SAVE_PENDING,status:currentSaveStatus(),localFallback:localStorage.getItem(STORE_BASE+'2')!==null};
 }''',fixture)
 print(json.dumps(out,ensure_ascii=False)); assert out['switched'] and out['error'] and all(out[k] for k in ('rejectedResumeUnchanged','slot1Unchanged','slot2Unchanged','slot3Unchanged')) and not out['pending'] and out['status']=='saved' and not out['localFallback']
 browser.close()
