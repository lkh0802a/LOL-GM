import {artifactSources,runEngineFixture} from './test-harness.mjs';
const [app,startupSource,startupStorage,library]=await artifactSources(['app.js','ui-startup.js','ui-startup-storage.js','ui-save-library.js']);
const startup=startupSource+'\n'+startupStorage;
const storage=app.slice(app.indexOf('async function loadDB('),app.indexOf('const $=s=>'));
await runEngineFixture(String.raw`(async()=>{
 const check=(x,m)=>{if(!x)throw Error('STARTUP_SAVE '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:2,div2:false})];cfg.internationals=[];
 const saved=buildWorld(cfg);startCareer(saved,managerSelectableTeams(saved)[0].id,'startup-save');const bytes=packDB(saved);
 const reset=(page='load')=>{DB=null;SLOT='1';STORE='base-1';SLOT_SWITCHING=false;VIEW='season';UI_RENDER_ID++;START_BOOT_ERROR='복원 실패';START_UI={active:true,page,error:''};local.clear();mem.clear();nodes.clear();hold=null};
 reset();check(saveLibraryCurrent()(),'null world safe read');
 local.set('base-1','damaged');local.set('base-2',bytes);mem.set('base-3',bytes);
 const originals=[...local];check(!viewStartup().includes('슬롯')&&viewStartup().includes('저장된 게임'),'Korean saved game heading');bindStartup();await flush();
 const box=$('#startup-saves-list');check(box.innerHTML.includes(savedGameLabel(savedGameSummary(saved)))&&box.innerHTML.includes('복원할 수 없습니다'),'actual game summary and damaged source');check(JSON.stringify([...local])===JSON.stringify(originals)&&DB===null,'discovery does not write');
 const held=box.querySelectorAll('[data-slot]')[0].onclick;START_UI.page='home';held();await flush();check(DB===null,'cancel retained callback inert');
 START_UI.page='load';UI_RENDER_ID++;bindStartup();await flush();await $('#startup-saves-list').querySelectorAll('[data-slot]')[0].onclick();check(DB.world.phase==='initial_roster'&&SLOT==='2'&&!START_BOOT_ERROR&&!START_UI.active,'actual existing loader recovery');check(packDB(DB)===packDB(unpackDB(bytes)),'full saved world preserved');
 reset('new-slot');local.set('base-1','damaged');local.set('base-2',bytes);mem.set('base-3',bytes);bindStartup();await flush();
 const fresh=$('#startup-saves-list').querySelectorAll('[data-startup-slot]');check(fresh.length===1&&fresh[0].dataset.startupSlot==='4','one genuinely empty choice skips unknown and existing');await fresh[0].onclick();check(SLOT==='4'&&!DB.world&&START_UI.page==='career','existing empty loader to manual career');
 const waiting=DB;local.set('base-4',bytes);check(!await startupCommitCareer(waiting,'4',managerSelectableTeams(waiting)[0].id)&&DB===waiting&&local.get('base-4')===bytes,'changed stored game refuses overwrite');
 reset('new-slot');local.set('base-4',packDB(buildWorld(cfg)));check(!await startupChooseSlot('4',()=>true)&&DB===null,'saved pre-career world is not empty');
 reset();check(!await startupChooseSlot('8',()=>true)&&DB===null,'deleted game does not manufacture replacement during load');
 let stale=0;for(const mode of ['world','slot','render','view','page','boot']){
  reset();let release;hold=new Promise(r=>release=r);const pending=startupRecoverSlot('2',()=>true);await flush();
  if(mode==='world')DB=unpackDB(bytes);if(mode==='slot')SLOT='3';if(mode==='render')UI_RENDER_ID++;if(mode==='view')VIEW='data';if(mode==='page')START_UI.page='settings';if(mode==='boot')START_BOOT_ERROR='changed';
  const before=JSON.stringify(DB),slot=SLOT;release(bytes);check(!await pending&&JSON.stringify(DB)===before&&SLOT===slot,'late recovery refuses '+mode);stale++;
 }
 reset('new-slot');let release;hold=new Promise(r=>release=r);const pending=startupRecoverSlot('4',()=>true);await flush();local.set('base-4',bytes);release(null);check(!await pending&&DB===null&&local.get('base-4')===bytes,'empty changes during recovery original preserved');
 reset('new-slot');const scratch=buildWorld(cfg);DB=unpackDB(bytes);START_BOOT_ERROR='';local.set('base-1',bytes);const switched=await startupChooseSlot('4',()=>true);check(switched&&!DB.world&&SLOT==='4','existing current game uses original switch writer '+START_UI.error);
 await persistWorldSnapshot(DB,SLOT,STORE);check(await startupCommitCareer(DB,SLOT,managerSelectableTeams(DB)[0].id),'own automatic scratch save remains usable');check(unpackDB(await idbGet('base-1')).world.phase==='initial_roster','outgoing current game saved');
 reset();local.set('base-2','damaged');mem.set('base-2',bytes);check(await startupChooseSlot('2',()=>true)&&DB.world&&local.get('base-2')==='damaged','valid database fallback restores without overwriting damaged local source');
 reset();local.set('base-2',bytes);const originalLoad=loadDB;let unlock;const wait=new Promise(r=>unlock=r);loadDB=async key=>{const result=await originalLoad(key);await wait;return result};const deleted=startupRecoverSlot('2',()=>true);await flush();local.delete('base-2');mem.delete('base-2');unlock();check(!await deleted&&DB===null,'game removed during actual loader refuses commit');loadDB=originalLoad;
 reset('new-slot');DB=unpackDB(bytes);let acceptRelease;const acceptWait=new Promise(r=>acceptRelease=r);const interrupted=switchSaveSlot('4',async()=>{await acceptWait;return true});await flush();const replacement=unpackDB(bytes);DB=replacement;acceptRelease();check(!(await interrupted).ok&&DB===replacement&&SLOT==='1','context change while asynchronous source check refuses old commit');
 for(const mode of ['page','render']){
  reset('new-slot');DB=unpackDB(bytes);const source=DB,slot=SLOT,actualRead=startupSlotWorld;let queries=0,scanRelease;const scanWait=new Promise(r=>scanRelease=r);startupSlotWorld=async s=>{if(++queries===2)await scanWait;return actualRead(s)};const oldChoice=startupChooseSlot('4',()=>true);await flush();check(queries===2,'actual asynchronous empty source check reached');if(mode==='page')START_UI.page='settings';else UI_RENDER_ID++;scanRelease();check(!await oldChoice&&DB===source&&SLOT===slot,'changed '+mode+' during empty verification refuses commit');startupSlotWorld=actualRead;
 }
 console.log('STARTUP_SAVE_ACCEPTANCE '+JSON.stringify({actualReaders:true,emptyOnly:true,sourcePreserved:true,manualRecovery:true,stale,cancel:true,actualSwitch:true,actualCareer:true}));
})()`,{timeout:30000,setupSources:[String.raw`
const indexedDB={};let DB=null,SLOT='1',STORE='base-1',SAVEFAIL=false,SLOT_SWITCHING=false,VIEW='season',UI_RENDER_ID=0,UI_OVERLAY=null;
const STORE_BASE='base-',STORAGE_NS='storage',DIRECT_FILE_PREVIEW=false,SAVE_SLOTS=Array.from({length:10},(_,i)=>String(i+1));
const local=new Map(),mem=new Map(),nodes=new Map();let hold=null;
const localStorage={getItem:k=>local.has(k)?local.get(k):null,setItem:(k,v)=>local.set(k,String(v)),removeItem:k=>local.delete(k)};
async function idbGet(k){if(hold)return await hold;return mem.get(k)}async function idbSet(k,v){mem.set(k,v)}
const makeNode=()=>({innerHTML:'',dataset:{},focus(){},addEventListener(){},querySelector(){return null},querySelectorAll(selector){if(this.cacheHTML===this.innerHTML)return this.buttons.filter(b=>selector.includes(b.dataset.slot?'data-slot':'data-startup-slot'));const result=[];for(const match of this.innerHTML.matchAll(/data-(startup-slot|slot)="(\d+)"/g)){const key=match[1]==='slot'?'slot':'startupSlot';if(selector.includes(match[1]))result.push({dataset:{[key]:match[2]}})}this.cacheHTML=this.innerHTML;this.buttons=result;return result}});
const document={querySelector:s=>{if(!nodes.has(s))nodes.set(s,makeNode());return nodes.get(s)},querySelectorAll:()=>[]};const $=s=>document.querySelector(s);
const window={scrollTo(){}};function nav(){UI_RENDER_ID++}function navigateTo(v){VIEW=v;nav();return true}function cancelUiTasks(){}function clearTimeout(){}function setTimeout(){return 1}function freshInternalSeed(){return 'startup-manual'}
function resetUiForWorld(){START_UI={active:!DB.world,page:'home',error:''}}function bindSetup(){}function bindData(){}function seasonSetup(){return 'career'}const SSET={};function esc(s){return String(s??'')}
const flush=async()=>{for(let i=0;i<70;i++)await Promise.resolve()};
`,storage,library,startup]});
