import {readFile} from 'node:fs/promises';
import {runEngineFixture,artifactSources} from './test-harness.mjs';
const fixture=JSON.parse(await readFile(new URL('../docs/evidence/unemployed-season-fixture-2026-10-08.json',import.meta.url)));
const original=await readFile(new URL('../docs/evidence/pending-handoff-original-season-2026-10-09.js',import.meta.url),'utf8');
const [ui,state,guard]=await artifactSources(['ui-season.js','ui-state.js','ui-official-context.js']);
await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('HANDOFF '+m)},copy=x=>unpackDB(JSON.stringify(x));
 let db=copy(FIXTURE),team=managedTeamId(db);runOffseason(db);closeMarket(db);startWorldSeason(db,team,'pending-frame-authority-proof');
 let bound=0;while(!db.world.pendingOfficial?.queue?.length&&++bound<60)playWorldDay(db);check(bound<60,'actual pending fixture');
 const prepared=JSON.stringify(db),reset=()=>copy(JSON.parse(prepared));
 for(const mode of ['unemployed','fired','ai','otherTeam']){
  db=reset();if(mode==='unemployed')setManagedTeam(db,null);if(mode==='fired')db.world.fired=true;if(mode==='ai')db.world.manage='ai';if(mode==='otherTeam')setManagedTeam(db,Object.values(db.teams).find(t=>t.active!==false&&t.id!==team&&!db.world.pendingOfficial.queue.some(q=>{const r=pendingOfficialRefs(db,q);return r.m.a===t.id||r.m.b===t.id})).id);
  const before=JSON.stringify(db);originalPlayWorldDay(db);originalPlayWorldDay(db);check(JSON.stringify(db)===before,'exact main owner-loss stall '+mode);
  const expected=copy(db),q=db.world.pendingOfficial.queue[0],refs=pendingOfficialRefs(db,q),date=db.worldDate,lastTick=db.world.lastDailyTick,manager=db.manager,world=db.world;
  const expectedResult=resolvePendingOfficialMatch(expected,null),r=playWorldDay(db);
  check(JSON.stringify(db)===JSON.stringify(expected),'existing automatic writer whole DB/seed '+mode);check(db.worldDate===date&&db.world.lastDailyTick===lastTick&&!r.advanced,'no repeated daily effects '+mode);check(db.manager===manager&&db.world===world,'successful handoff keeps manager/world identity');check(expectedResult.game.ending.kind==='nexus','actual nexus '+mode);
  check(JSON.stringify(unpackDB(packDB(db)))===JSON.stringify(unpackDB(packDB(expected))),'actual compact save parity '+mode);
  console.log('HANDOFF_RAW '+JSON.stringify({mode,before:JSON.parse(before),after:db,expectedEqual:true,game:publicMatchRecord(expectedResult.game,db.patch.id)}));
 }
 db=reset();const beforeManual=JSON.stringify(db);playWorldDay(db);check(JSON.stringify(db)===beforeManual&&pendingOfficialControl(db).manual,'manual pending never chooses or plays');
 // A completed first set and applied First Selection remain the actual session.
 db=reset();const selection=pendingOfficialSelectionSetup(db);if(selection)applyPendingOfficialSelection(db,selection.prompt.mode==='first'?{kind:'side',value:'blue'}:{kind:selection.prompt.remaining,value:selection.prompt.remaining==='side'?'blue':'first'});pendingOfficialDraftSetup(db);resolvePendingOfficialMatch(db,null);
 check(db.world.pendingOfficial?.queue?.length,'actual Bo3 continues');const q=db.world.pendingOfficial.queue[0],doneGames=JSON.stringify(q.session.games),seed=q.session.seed;
 db.world.fired=true;const expected=copy(db);resolvePendingOfficialMatch(expected,null);playWorldDay(db);check(JSON.stringify(db)===JSON.stringify(expected),'partly completed session writer parity');
 const result=db.world.pendingOfficial?.queue?.[0]?.session||Object.values(db.world.seasons).flatMap(s=>s.days.flatMap(d=>d.matches)).find(m=>m.id===q.matchId).res;
 check(JSON.stringify(result.games.slice(0,1))===doneGames&&result.seed===seed,'first completed set and seed retained');
 for(const mode of ['date','year','queueDate','dayDate','competition','stage','region','session','sessionSeed','sessionSeason','manage','inactive','regionsMissing','teamsMissing','stagesShape']){
  db=reset();db.world.fired=true;const q=db.world.pendingOfficial.queue[0],refs=pendingOfficialRefs(db,q);
  if(mode==='date')db.worldDate='2099-01-01';if(mode==='year')db.year++;if(mode==='queueDate')q.date='2099-01-01';if(mode==='dayDate')refs.day.date='2099-01-01';if(mode==='competition')delete db.competitions[refs.s.comp];if(mode==='stage')refs.day.stage='missing';if(mode==='region')delete db.regions[db.teams[refs.m.a].region];if(mode==='session'){pendingOfficialSession(db);q.session.a='wrong';}if(mode==='sessionSeed'){pendingOfficialSession(db);q.session.seed='wrong';}if(mode==='sessionSeason'){pendingOfficialSession(db);q.session.opt.metaContext.season='wrong';}if(mode==='manage')db.world.manage='unknown';if(mode==='inactive')db.teams[refs.m.a].active=false;if(mode==='regionsMissing')delete db.regions;if(mode==='teamsMissing')delete db.teams;if(mode==='stagesShape')db.competitions[refs.s.comp].stages={};
  const before=JSON.stringify(db);let rejected=false;try{playWorldDay(db)}catch(e){rejected=true;check(/[가-힣]/.test(e.message),'Korean metadata failure')};check(rejected&&JSON.stringify(db)===before,'missing/stale metadata has no writer '+mode);
 }
 // Late failures must restore every captured persistent value and object identity.
 for(const where of ['simulation','meta','commit','finalize']){
  db=reset();pendingOfficialSelectionSetup(db);db.world.fired=true;
  if(where==='commit'||where==='finalize'){let near=0;const limit=db.world.pendingOfficial.queue[0].session.bestOf;while(++near<=limit){const probe=copy(db),r=resolvePendingOfficialMatch(probe,null);if(r.done)break;db=probe}check(near<=limit,'naturally reached final set');}
  const before=JSON.stringify(db),world=db.world,manager=db.manager,pending=db.world.pendingOfficial,session=pending.queue[0].session,meta=db.metaHistory,teams=db.teams;
  const actualSim=simulateMatch,actualMeta=recordMeta,actualCommit=commitScheduledSeries,actualFinal=finalizeCompetitionDay;
  const fail=()=>{throw Error('controlled '+where)};
  if(where==='simulation')simulateMatch=(...args)=>{const r=actualSim(...args);args[0].teams[team].cash=123;fail();return r};
  if(where==='meta')recordMeta=(...args)=>{actualMeta(...args);fail()};if(where==='commit')commitScheduledSeries=(...args)=>{actualCommit(...args);fail()};if(where==='finalize')finalizeCompetitionDay=(...args)=>{actualFinal(...args);fail()};
  let rejected=false;try{playWorldDay(db)}catch(e){rejected=e.message==='controlled '+where};simulateMatch=actualSim;recordMeta=actualMeta;commitScheduledSeries=actualCommit;finalizeCompetitionDay=actualFinal;
  check(rejected&&JSON.stringify(db)===before,'late whole DB rollback '+where);check(db.world===world&&db.manager===manager&&db.world.pendingOfficial===pending&&pending.queue[0].session===session&&db.metaHistory===meta&&db.teams===teams,'rollback original identities '+where);
  console.log('HANDOFF_ROLLBACK '+JSON.stringify({where,before:JSON.parse(before),after:db}));
  const retry=copy(db);resolvePendingOfficialMatch(retry,null);playWorldDay(db);check(JSON.stringify(db)===JSON.stringify(retry),'rollback retry existing writer/cache parity '+where);
 }
 // Future fired/AI fixtures use the existing automatic day writer without manual deferral.
 for(const mode of ['fired','ai']){db=reset();delete db.world.pendingOfficial;if(mode==='fired')db.world.fired=true;else db.world.manage='ai';const expected=copy(db);originalAutomaticWorldDay(expected);playWorldDay(db);check(JSON.stringify(db)===JSON.stringify(expected),'new day existing AI writer parity '+mode)}
 // Real season buttons reach the same one-set writer; held callbacks remain guarded.
 const resetUi=()=>{DB=reset();DB.world.fired=true;VIEW='season';SLOT='1';UI_RENDER_ID++;UI_OVERLAY=null;SLOT_SWITCHING=false;saves.length=0;callbacks.length=0;nodes.clear();for(const id of ['sday','sfixture','smine','sstep','send','spause','sprog'])nodes.set('#'+id,{disabled:false,textContent:'',focus(){},setAttribute(){}});bindSeason()};
 resetUi();check(nodes.get('#sday').textContent==='대기 세트 진행','actual UI action label');const expectedUi=copy(DB);playWorldDay(expectedUi);nodes.get('#sday').onclick();check(JSON.stringify(DB)===JSON.stringify(expectedUi)&&saves.length===1,'actual UI writer/save parity');
 resetUi();const old=nodes.get('#sday').onclick;DB=copy(DB);const loadedBefore=JSON.stringify(DB);old();check(JSON.stringify(DB)===loadedBefore&&saves.length===0,'retained progression after load inert');
 resetUi();const saved=packDB(DB);DB=unpackDB(saved);const expectedLoaded=copy(DB);playWorldDay(expectedLoaded);bindSeason();nodes.get('#sday').onclick();check(saves.length===1&&JSON.stringify(DB)===JSON.stringify(expectedLoaded),'loaded actual pending can continue');
 console.log('대기 공식 경기 인계 수용 통과: 원본 진행 불능·수동 권한 유지·기존 AI writer/seed·완료 기록·저장·metadata 거절·late rollback·실제 UI 진행');
})()`,{timeout:180000,setupSources:[
 original.slice(original.indexOf('function playWorldDay(db){'),original.indexOf('function news(db,text){')).replace('function playWorldDay(db){','function originalPlayWorldDay(db){'),
 original.slice(original.indexOf('function playWorldDay(db){'),original.indexOf('function news(db,text){')).replace('function playWorldDay(db){','function originalAutomaticWorldDay(db){').replace('queue=[],me=managedTeamId(db);','queue=[],me=null;'),
 `let DB,VIEW='season',SLOT='1',SLOT_SWITCHING=false,UI_RENDER_ID=1,UI_OVERLAY=null,MSG='',SEASON_PROGRESS_NOTICE=null;const SSET={};const callbacks=[],saves=[],nodes=new Map();const $=s=>nodes.get(s)||null;const document={querySelector:s=>s==='.controls'?{insertAdjacentHTML(){}}:$(s),querySelectorAll:()=>[]};function nav(){UI_RENDER_ID++}function saveDB(){saves.push(packDB(DB))}function setTimeout(f){callbacks.push(f)}function bindClubBriefing(){}function bindSeasonTab(){}function bindOfficeOpinionControls(){}function seasonManagedTeam(){return null}function seasonManagedRegion(){return null}function seasonUiGuard(){const db=DB,w=db.world,m=db.manager,r=UI_RENDER_ID,s=SLOT,v=VIEW;return ()=>DB===db&&DB.world===w&&DB.manager===m&&UI_RENDER_ID===r&&SLOT===s&&VIEW===v&&!UI_OVERLAY&&!SLOT_SWITCHING}`,
 state.slice(state.indexOf('const UI_TASKS='),state.indexOf('let UI_RENDER_ID=')),
 ui.slice(ui.indexOf('function bindSeason(){'),ui.indexOf('// 시즌 조회')),guard,'const FIXTURE='+JSON.stringify(fixture)+';'
 ]});
