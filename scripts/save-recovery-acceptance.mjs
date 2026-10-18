import {artifactSources,runEngineFixture} from './test-harness.mjs';
const [app,data,library]=await artifactSources(['app.js','ui-data.js','ui-save-library.js']);
const end=app.indexOf('const $=s=>');if(end<0)throw Error('storage boundary missing');
await runEngineFixture(String.raw`(async()=>{
 const check=(v,m)=>{if(!v)throw Error('SAVE_RECOVERY '+m)};
 const settle=async()=>{for(let i=0;i<40;i++)await Promise.resolve()};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:2,div2:false})];cfg.internationals=[];
 const base=buildWorld(cfg);base.worldDate='2027-03-01';const original=packDB(base);
 const reset=()=>{DB=unpackDB(original);SLOT='1';STORE=STORE_BASE+SLOT;SAVEFAIL=false;SLOT_SWITCHING=false;SAVE_PENDING=null;SAVE_STATUS=null;saveTimer=null;SAVE_QUEUES.clear();local.clear();disk.clear();timers.clear();held.length=0;flags={};calls=0;local.set(STORE,original);disk.set(STORE,original)};
 const rows=[];
 for(const kind of ['normal','cleanup','cleanup-and-write','no-fallback','already-current','idb-fallback','both-backends','unreadable-fallback']){
  reset();DB.worldDate='2027-03-02';const expected=packDB(DB);
  if(kind==='cleanup'||kind==='cleanup-and-write'||kind==='no-fallback'||kind==='already-current'||kind==='unreadable-fallback')flags.remove=true;
  if(['cleanup-and-write','no-fallback','already-current','both-backends'].includes(kind))flags.write=true;
  if(kind==='idb-fallback'||kind==='both-backends')flags.idb=true;
  if(kind==='no-fallback')local.delete(STORE);if(kind==='already-current')local.set(STORE,expected);
  if(kind==='unreadable-fallback')flags.read=true;
  const ok=await persistWorldSnapshot(DB,SLOT,STORE);await settle();
  const denied=['cleanup-and-write','both-backends','unreadable-fallback'].includes(kind);
  check(ok===!denied&&SAVEFAIL===denied,'honest acknowledgement '+kind);
  check(currentSaveStatus()===(denied?'failed':'saved'),'status follows acknowledgement '+kind);
  check(statusNodes.every(n=>n.textContent===saveStatusText()),'live status without rerender '+kind);
  flags.read=false;
  const restored=await loadDB(STORE);check(restored.worldDate===(denied?'2027-03-01':'2027-03-02'),'restore uses acknowledged snapshot '+kind);
  if(denied){flags={};check(await persistWorldSnapshot(DB,SLOT,STORE),'explicit retry '+kind);check(!SAVEFAIL&&currentSaveStatus()==='saved','retry is acknowledged after commit');check((await loadDB(STORE)).worldDate==='2027-03-02','retry restores new world')}
  rows.push({kind,acknowledged:ok});
 }
 reset();flags.hold=true;DB.worldDate='2027-03-02';const first=persistWorldSnapshot(DB,SLOT,STORE);await settle();
 DB.worldDate='2027-03-03';saveDB();check(currentSaveStatus()==='pending','new changes wait for debounce');
 held.shift().finish();await first;await settle();check(currentSaveStatus()==='pending','old completion cannot announce new changes saved');
 fireTimers();await settle();check(held.length===1&&currentSaveStatus()==='saving','latest write starts after debounce');
 DB.worldDate='2027-03-04';saveDB();held.shift().finish();await settle();check(currentSaveStatus()==='pending','older queued success cannot hide a newer pending revision');
 fireTimers();await settle();held.shift().finish();await settle();check(currentSaveStatus()==='saved'&&!SAVEFAIL,'latest generation acknowledged');check((await loadDB(STORE)).worldDate==='2027-03-04','latest generation restores');
 reset();flags.hold=true;DB.worldDate='2027-03-02';const outgoing=persistWorldSnapshot(DB,SLOT,STORE);await settle();
 const oldDB=DB;DB=unpackDB(original);SLOT='2';STORE=STORE_BASE+SLOT;DB.worldDate='2027-04-01';saveDB();const pendingStatus=SAVE_STATUS;
 held.shift().finish();await outgoing;await settle();check(SAVE_STATUS===pendingStatus&&currentSaveStatus()==='pending'&&DB!==oldDB,'foreign-slot completion does not change current status/world');
 fireTimers();await settle();held.shift().finish();await settle();check((await loadDB(STORE)).worldDate==='2027-04-01','other slot remains independent');
 reset();flags.hold=true;saveDB();check(timers.size===1,'production debounce remains scheduled');saveBeforeBackground();saveBeforeBackground();await settle();check(timers.size===0&&held.length===1&&currentSaveStatus()==='saving','background flush is one best-effort actual write');held.shift().finish();await settle();check(currentSaveStatus()==='saved','background commit must actually complete');
 reset();flags.hold=true;const input=node('#djson');input.value='unapplied input';document.activeElement=input;
 saveDB();bindData();const button=node('#save-now');const click=button.onclick;const manual=click();click();await settle();check(button.disabled&&held.length===1,'manual retry prevents duplicate clicks and flushes pending write');check(document.activeElement===input&&input.value==='unapplied input'&&navs===0,'status updates retain focus/input/screen');held.shift().finish();await manual;await settle();check(!button.disabled&&currentSaveStatus()==='saved','manual confirmation after actual commit');
 reset();const pack=packDB;packDB=()=>{throw Error('injected serialization failure')};let failed=false;try{persistWorldSnapshot(DB,SLOT,STORE)}catch(e){failed=true}packDB=pack;check(failed&&SAVEFAIL&&currentSaveStatus()==='failed'&&disk.get(STORE)===original,'serialization failure preserves original and updates status');
 reset();let closed=0;const request={result:{close(){closed++},objectStoreNames:{contains:()=>true}}};indexedDB.open=()=>request;
 const opening=idb().then(()=>false,()=>true);fireTimers();check(await opening,'original open deadline rejects');request.onsuccess();check(closed===1,'late open connection is closed without changing timeout');
 reset();flags.idb=true;flags.write=true;DB.worldDate='2027-03-02';const source=DB,oldSlot=SLOT;const switchResult=await switchSaveSlot('2');check(!switchResult.ok&&DB===source&&SLOT===oldSlot&&currentSaveStatus()==='failed','failed outgoing save blocks slot switch');
 console.log('SAVE_RECOVERY_ACCEPTANCE '+JSON.stringify({rows,generationGuard:true,slotIsolation:true,backgroundBestEffort:true,manualRetry:true,focusPreserved:true,serializationFailure:true,switchGuard:true}));
})()`,{filename:'save-recovery.vm.js',timeout:120000,setupSources:[String.raw`
const local=new Map(),disk=new Map(),timers=new Map(),held=[],nodes=new Map();let flags={},calls=0,timerId=0,navs=0;
const location={protocol:'https:',origin:'https://fixture.invalid'},indexedDB={};
const localStorage={getItem:k=>{if(flags.read&&k===STORE)throw Error('injected read denial');return local.has(k)?local.get(k):null},setItem:(k,v)=>{if(flags.write&&k===STORE)throw Error('injected write denial');local.set(k,String(v))},removeItem:k=>{if(flags.remove)throw Error('injected cleanup denial');local.delete(k)}};
const statusNodes=[{textContent:'',classList:{toggle(){}}},{textContent:'',classList:{toggle(){}}}];
const node=k=>{if(!nodes.has(k))nodes.set(k,{textContent:'',innerHTML:'',value:'',disabled:false,focus(){document.activeElement=this},querySelectorAll(){return []}});return nodes.get(k)};
const document={activeElement:null,querySelector:s=>node(s),querySelectorAll:s=>s==='[data-save-status]'?statusNodes:[]};const $=s=>node(s);
let VIEW='data',UI_RENDER_ID=1,UI_OVERLAY=null,START_UI={active:false,page:'home'};const navigator={};
function setTimeout(fn){const id=++timerId;timers.set(id,fn);return id}function clearTimeout(id){timers.delete(id)}
function fireTimers(){const todo=[...timers.values()];timers.clear();for(const fn of todo)fn()}
function nav(){navs++}function cancelUiTasks(){}function resetUiForWorld(){}function navigateTo(){navs++;return true}
`,app.slice(0,end),String.raw`
idbSet=(k,v)=>{calls++;if(flags.hold)return new Promise((resolve,reject)=>held.push({finish(){disk.set(k,v);resolve()},fail(){reject(Error('injected IDB failure'))}}));if(flags.idb)return Promise.reject(Error('injected IDB failure'));disk.set(k,v);return Promise.resolve()};idbGet=async k=>disk.get(k);
`,library,data,`bindSavedGames=()=>{};`]});
