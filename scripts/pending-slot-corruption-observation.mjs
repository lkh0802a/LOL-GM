// Isolated in-memory storage double; no browser or real user slots are accessed.
import {readFile} from 'node:fs/promises';
import {artifactSources,runEngineFixture} from './test-harness.mjs';
const timerMode=process.argv.includes('--timer');
const fixture=JSON.parse(await readFile(new URL('../docs/evidence/unemployed-season-fixture-2026-10-08.json',import.meta.url)));
const [app]=await artifactSources(['app.js']);const end=app.indexOf('const $=s=>');if(end<0)throw Error('storage boundary unavailable');
await runEngineFixture(String.raw`(async()=>{
 const db=unpackDB(JSON.stringify(FIXTURE)),team=managedTeamId(db);runOffseason(db);closeMarket(db);startWorldSeason(db,team,'pending-frame-authority-proof');
 let days=0;while(!db.world.pendingOfficial?.queue?.length&&++days<60)playWorldDay(db);
 if(days>=60)throw Error('synthetic pending match unavailable');
 const selection=pendingOfficialSelectionSetup(db);if(selection)applyPendingOfficialSelection(db,selection.prompt.mode==='first'?{kind:'side',value:'blue'}:{kind:selection.prompt.remaining,value:selection.prompt.remaining==='side'?'blue':'first'});
 pendingOfficialDraftSetup(db);resolvePendingOfficialMatch(db,null);
 DB=unpackDB(packDB(db));SLOT='1';STORE=STORE_BASE+SLOT;
 const original=packDB(DB),otherKey=STORE_BASE+'3',targetKey=STORE_BASE+'2',sourceKey=STORE;
 const damaged=JSON.parse(original);damaged.world.pendingOfficial.queue[0].session.seed='synthetic-invalid-seed';const damagedBytes=JSON.stringify(damaged),third='synthetic-untouched-slot';
 local.set(sourceKey,original);local.set(targetKey,damagedBytes);local.set(otherKey,third);
 const switched=await switchSaveSlot('2');let resumeError=null,beforeResume=null,afterResume=null;
 if(switched.ok){beforeResume=packDB(DB);try{resolvePendingOfficialMatch(DB,null)}catch(e){resumeError=e.message}afterResume=packDB(DB)}
 const sourceBytes=disk.get(sourceKey)??local.get(sourceKey),pendingSaveScheduled=!!SAVE_PENDING;
 const timerCallback=timers.get(saveTimer);
 const writeAcknowledged=TIMER_MODE?(timerCallback?await timerCallback():null):await flushPendingSave(),written=local.get(targetKey),checkpoint=local.get(targetKey+'-checkpoint');
 let persistedSeed=null,persistedResumeError=null;
 try{const persisted=await loadDB(targetKey);persistedSeed=persisted.world.pendingOfficial.queue[0].session.seed;try{resolvePendingOfficialMatch(persisted,null)}catch(e){persistedResumeError=e.message}}catch(e){persistedResumeError=e.message}
 console.log('PENDING_SLOT_CORRUPTION_OBSERVATION '+JSON.stringify({synthetic:true,days,switched:switched.ok,switchError:switched.error||null,resumeError,
  rejectedResumeUnchanged:beforeResume!==null?beforeResume===afterResume:null,sourceSlotUnchanged:sourceBytes===original,
  writeAcknowledged,targetBytesUnchanged:written===damagedBytes,checkpointRetainsOriginal:checkpoint===damagedBytes,persistedSeed,persistedResumeError,thirdSlotUnchanged:local.get(otherKey)===third,
  sourceSlotAfterWriteUnchanged:local.get(sourceKey)===original,pendingSaveScheduled,automaticTimerExecuted:TIMER_MODE&&!!timerCallback}));
})();`,{timeout:180000,setupSources:[String.raw`
const local=new Map(),disk=new Map(),timers=new Map();let nextTimer=0;
const location={protocol:'https:',origin:'https://fixture.invalid'},indexedDB={};
const localStorage={getItem:k=>local.has(k)?local.get(k):null,setItem:(k,v)=>local.set(k,String(v)),removeItem:k=>local.delete(k)};
const document={querySelector:()=>null,querySelectorAll:()=>[]};
function setTimeout(fn){const id=++nextTimer;timers.set(id,fn);return id}function clearTimeout(id){timers.delete(id)}
function cancelUiTasks(){}function resetUiForWorld(){}function navigateTo(){}
`,app.slice(0,end),String.raw`idbSet=async()=>{throw Error('synthetic IndexedDB unavailable')};idbGet=async k=>disk.get(k);`, 'const TIMER_MODE='+JSON.stringify(timerMode)+';const FIXTURE='+JSON.stringify(fixture)+';']});
