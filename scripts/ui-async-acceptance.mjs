// Stage 11.5/6-3: asynchronous UI, slot and task collision acceptance.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dir=resolve(import.meta.dirname,'..','src','artifact');
const get=async p=>readFile(resolve(dir,p),'utf8');
const [app,state,season,manager,data,briefing,eligibility,clubFinance,clubStaff,staffControls,registration,clubMedical,clubContracts,clubPractice,clubScrim,clubRecruitment,themeSource,actionsSource]=await Promise.all(
  ['app.js','ui-state.js','ui-season.js','ui-manager.js','ui-data.js','ui-club-briefing.js','ui-club-eligibility.js','ui-club-finance.js','ui-club-staff.js','ui-staff-controls.js','ui-registration.js','ui-club-medical.js','ui-club-contracts.js','ui-club-practice.js','ui-club-scrim.js','ui-club-recruitment.js','ui-theme.js','ui-club-actions.js'].map(get));
const later=()=>new Promise(resolve=>setImmediate(resolve));

{
  // Execute real app storage functions with controlled asynchronous IndexedDB.
  const timers=new Map(),local=new Map(),idb=new Map(),pending=[];
  let timerId=0,cancelCount=0,resets=0;
  const localStorage={
    getItem:key=>local.has(key)?local.get(key):null,
    setItem:(key,value)=>local.set(key,value),
    removeItem:key=>local.delete(key)
  };
  const idbSet=(key,str)=>new Promise((resolve,reject)=>{
    pending.push({key,str,finish(){idb.set(key,str);resolve()},fail(){reject(new Error('write failed'))}});
  });
  const context=vm.createContext({
    localStorage,idbGet:async key=>idb.has(key)?idb.get(key):null,idbSet,
    packDB:db=>JSON.stringify(db),unpackDB:str=>JSON.parse(str),
    buildWorld:()=>({world:{year:2027},teams:{T:{name:'new'}},players:{},version:15}),
    managedTeamId:()=> 'T',
    cancelUiTasks:()=>{cancelCount++},
    resetUiForWorld:()=>{resets++},
    navigateTo:view=>{context.routed=view;return true},
    document:{querySelector:()=>({inert:false})},
    console,
    setTimeout:fn=>{const id=++timerId;timers.set(id,fn);return id},
    clearTimeout:id=>timers.delete(id)
  });
  vm.runInContext("let DB={version:15,world:{year:2027},teams:{T:{name:'old'}},players:{}};let SLOT='1';const STORE_BASE='base-';let STORE='base-1';const STORAGE_NS='storage';const SAVE_SLOTS=Array.from({length:10},(_,i)=>String(i+1));let SAVEFAIL=false,SLOT_SWITCHING=false;",context);
  const start=app.indexOf('async function loadDB('),end=app.indexOf('const $=s=>',start);
  assert(start>0&&end>start,'storage controller was not found');
  vm.runInContext(app.slice(start,end),context,{filename:'app storage functions'});
  const run=js=>vm.runInContext(js,context);
  const flush=()=>{const jobs=[...timers.values()];timers.clear();jobs.forEach(fn=>fn())};
  const settle=async()=>{await later();await later()};
  run('saveDB()');flush();await settle();
  assert.equal(pending.length,1);
  run('DB.world.year=2028;saveDB()');flush();await settle();
  assert.equal(pending.length,1,'newer save must wait for an older in-flight IndexedDB write');
  pending[0].finish();await settle();
  assert.equal(pending.length,2);
  pending[1].finish();await settle();
  assert.equal(JSON.parse(idb.get('base-1')).world.year,2028,'latest save wins for the same slot');
  assert.equal(local.get('storage-meta-1'),JSON.stringify({team:'old',year:2028}));
  run('DB.world.year=2029');
  const fallback=run('persistWorldSnapshot(DB,SLOT,STORE)');await settle();
  pending[2].fail();assert.equal(await fallback,true,'local fallback must recover an IndexedDB failure');
  assert.equal(JSON.parse(idb.get('base-1')).world.year,2028);
  assert.equal(JSON.parse(local.get('base-1')).world.year,2029);
  assert.equal((await run("loadDB('base-1')")).world.year,2029,'fallback must supersede stale IndexedDB data');
  idb.set('base-2',JSON.stringify({version:15,world:{year:2030},teams:{T:{name:'second'}},players:{}}));
  const switching=run("switchSaveSlot('2')");
  assert.equal(run('SLOT_SWITCHING'),true);
  assert.equal((await run("switchSaveSlot('3')")).ok,false,'parallel slot switches must be rejected');
  await settle();
  assert.equal(pending.length,4,'outgoing slot must be saved before loading the incoming world');
  pending[3].finish();
  const switched=await switching;
  assert.equal(switched.ok,true);
  assert.equal(run('SLOT'),'2');assert.equal(run('STORE'),'base-2');
  assert.equal(run('DB.world.year'),2030);assert.equal(local.get('storage-slot'),'2');
  assert.equal(context.routed,'season');assert.equal(resets,1);assert.equal(cancelCount,1);
  assert.equal(run('SLOT_SWITCHING'),false);
  idb.set('base-3','invalid JSON');
  const broken=run("switchSaveSlot('3')");
  await settle();
  pending[4].finish();
  const rejected=await broken;
  assert.equal(rejected.ok,false,'corrupt target save must abort');
  assert.equal(run('SLOT'),'2');assert.equal(run('DB.world.year'),2030);
  assert.equal(local.get('storage-slot'),'2','failed switch must not change the persisted active slot');
  assert(!timers.has(0));
}
{
  // Execute real navigation and scheduled work against a minimal DOM + engine fixture.
  let saves=0,days=0,matches=0,official=0;const unexpected=[];
  const callbacks=[],frames=[],nodes=new Map();
  const node=id=>{if(!nodes.has(id))nodes.set(id,{id,textContent:'',innerHTML:'',disabled:false,inert:false});return nodes.get(id)};
  const tabs=['season','match','squad','patch','mc','data'].map(v=>({
    dataset:{v},setAttribute(k,n){this[k]=n}
  }));
  const document={
    querySelector:s=>s==='#main'?node('main'):s.startsWith('#')?node(s.slice(1)):null,
    querySelectorAll:s=>s==='nav button'?tabs:[],
  };
  const db={world:{phase:'season',step:0,pendingOfficial:null,count:0},manager:{teamId:'T'},regions:{R:{id:'R'}},teams:{T:{id:'T',region:'R',short:'T',name:'Team'},U:{id:'U',region:'R',short:'U',name:'Other'}}};
  const context=vm.createContext({
    DB:db,SLOT:'1',SLOT_SWITCHING:false,UI_OVERLAY:null,
    document,window:{scrollY:0,scrollTo(){}},
    freshInternalSeed:()=> 'test',
    clearInterval:()=>{},requestAnimationFrame:f=>frames.push(f),
    setTimeout:f=>{callbacks.push(f);return callbacks.length},
    saveDB:()=>{saves++},
    nextDate:()=> '2030-02-01',
    managedTeamId:()=> 'T',managedTeam:()=>db.teams.T,setupTeamsForManager:()=>[db.teams.T],
    isManagerSelectableTeam:(_db,t)=>!!t&&t.active!==false,managerSelectableTeams:_db=>Object.values(_db.teams).filter(t=>t.active!==false),
    bindSeasonTab:()=>{},
    bindOfficeOpinionControls:()=>{},
    playWorldDay:world=>{world.world.count++;days++;return {played:[],pending:false}},
    openPendingOfficialDraft:()=>{official++},
    simulateMatch:()=>{matches++;return {winner:0,duration:30,goldHist:[0],firsts:{dragon:0,tower:0,blood:0},sides:[{barons:0,kills:4,towersTaken:3,dragons:[]},{barons:0,kills:3,towersTaken:1,dragons:[]}],log:[]}},
    viewSeason:()=>'<section>season</section>',viewMatch:()=>'<section>match</section>',
    viewSquad:()=>'<section>squad</section>',viewPatch:()=>'<section>patch</section>',
    viewAnalysis:()=>'<section>analysis</section>',viewMC:()=>'<section>mc</section>',viewData:()=>'<section>data</section>',
    renderMC:acc=>'<section>completed '+acc.n+'</section>',
    bindMatch:()=>{},bindSquad:()=>{},bindPatch:()=>{},bindAnalysis:()=>{},bindData:()=>{},
    closeUiOverlay:()=>{},console:{error:(...args)=>unexpected.push(args)}
  });
  context.$=selector=>node(selector.slice(1));
  vm.runInContext(clubFinance,context,{filename:'ui-club-finance.js'});
  vm.runInContext(clubMedical,context);vm.runInContext(clubContracts,context);vm.runInContext(clubPractice,context);vm.runInContext(clubScrim,context);vm.runInContext(clubRecruitment,context);vm.runInContext(clubStaff,context);vm.runInContext(staffControls,context);vm.runInContext(registration,context);
  vm.runInContext(eligibility,context,{filename:'ui-club-eligibility.js'});
  vm.runInContext(briefing,context,{filename:'ui-club-briefing.js'});
  vm.runInContext(actionsSource,context,{filename:'ui-club-actions.js'});
  vm.runInContext(season.slice(season.lastIndexOf('function bindSeason(){')),context,{filename:'bindSeason()'});
  vm.runInContext(themeSource,context,{filename:'ui-theme.js'});
  vm.runInContext(state,context,{filename:'ui-state.js'});
  const run=js=>vm.runInContext(js,context);
  const flush=()=>{const work=callbacks.splice(0);work.forEach(fn=>fn())};
  run('nav()');
  run("document.querySelector('#send').onclick()");
  assert.equal(days,2);
  assert.equal(callbacks.length,1,'long run should yield after each batch');
  assert.equal(run("navigateTo('data')"),true);
  assert.equal(saves,1,'canceling a date run after navigation must save its completed days');
  flush();assert.equal(days,2,'stale date callback must never keep simulating');
  assert.equal(run('UI_TASKS.size'),0);
  run("navigateTo('season')");
  run("DB.world.pendingOfficial={queue:[1]};nav()");
  assert.equal(frames.length,1);
  run("navigateTo('data')");frames.shift()();
  assert.equal(official,0,'stale official-draft frame must never reopen a different screen');
  run('DB.world.pendingOfficial=null');
  assert.equal(run("navigateTo('mc')"),false,'removed simulation route must be inaccessible');
  assert.equal(unexpected.length,0,'an acceptance case must not hide an exception');
  run("UI_OVERLAY={dismissible:false}");
  assert.equal(run("navigateTo('season')"),false,'locked official draft must block route changes');
  run('UI_OVERLAY=null;SLOT_SWITCHING=true');
  assert.equal(run("navigateTo('season')"),false,'in-progress slot switch must block route changes');
}
for(const [name,fragment] of [
  ['app.js','const SAVE_QUEUES=new Map()'],
  ['app.js','async function switchSaveSlot('],
  ['ui-data.js','await switchSaveSlot(b.dataset.slot)'],
  ['ui-state.js','cancelUiTasks();'],
  ['ui-season.js',"beginUiTask('season-days'"],
  ['ui-season.js','UI_RENDER_ID!==renderId'],
])assert(({ 'app.js':app,'ui-data.js':data,'ui-state.js':state,'ui-season.js':season,'ui-manager.js':manager})[name].includes(fragment),
  'missing active async guard '+name+' '+fragment);
console.log('Stage 11.5/6-3 async acceptance: PASS (slot sequencing/fallback, load rollback, date batch cancel, stale draft frame, route locks)');
