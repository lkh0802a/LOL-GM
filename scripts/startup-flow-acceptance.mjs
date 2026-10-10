import assert from 'node:assert/strict';
import {artifactSources,runEngineFixture} from './test-harness.mjs';
import {readFile} from 'node:fs/promises';
const [startupSource,startupStorage,app,data,setup,themeSource,saveLibrary]=await artifactSources(['ui-startup.js','ui-startup-storage.js','app.js','ui-data.js','ui-setup.js','ui-theme.js','ui-save-library.js']);
const startup=startupSource+'\n'+startupStorage;
const storage=app.slice(app.indexOf('async function loadDB('),app.indexOf('const $=s=>'));
const esc=app.match(/^const esc=.*$/m)[0];
await runEngineFixture(String.raw`(async()=>{
 const check=(x,m)=>{if(!x)throw Error('STARTUP '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:4,div2:true})];cfg.internationals=[];
 DB=buildWorld(cfg);const original=JSON.stringify(DB),db=DB;
 let home=viewStartup();check((home.match(/<button/g)||[]).length===3&&['새 게임','불러오기','설정'].every(x=>home.includes(x))&&!home.includes('steam'),'three actions only');
 bindStartup();const oldNew=$('#startup-new').onclick;oldNew();check(START_UI.page==='career'&&JSON.stringify(DB)===original,'new start then career no mutation');
 bindStartup();$('#startup-back').onclick();check(START_UI.page==='home'&&JSON.stringify(DB)===original,'cancel keeps world');
 bindStartup();$('#startup-settings').onclick();bindStartup();$('#startup-theme').value='dark';$('#startup-theme').onchange();check(localStorage.getItem('lol-gm-theme')==='dark'&&theme==='dark','actual settings');
 const oldTheme=$('#startup-theme').onchange;startupMove('home');oldTheme();check(localStorage.getItem('lol-gm-theme')==='dark','stale setting inert');
 // Real storage readers preserve invalid bytes; metadata alone is not an empty-slot claim.
 local.set('base-3','invalid JSON');let invalid=false;try{await startupSlotWorld('3')}catch(e){invalid=true}check(invalid&&local.get('base-3')==='invalid JSON','invalid original retained');
 failReads=true;let readRejected=false;try{await loadDB('base-6')}catch(e){readRejected=true}check(readRejected&&DB===db,'unreadable save is not empty');failReads=false;
 local.set('base-4',packDB(db));check(!(await startupSlotWorld('4')).world,'actual pre-career save');
 const t=managerSelectableTeams(DB)[0];SSET.team=t.id;
 failWrites=true;const failed=await startupCommitCareer(db,'1',t.id);check(!failed&&DB===db&&JSON.stringify(DB)===original&&!SLOT_SWITCHING,'failed writes rollback identity/world');failWrites=false;
 START_UI={active:true,page:'career',error:''};
 SAVEFAIL=true;const pending=startupCommitCareer(db,'1',t.id);check(!await startupCommitCareer(db,'1',t.id),'duplicate locked');check(await pending,'actual career saved');
 check(DB!==db&&DB.world.phase==='initial_roster'&&DB.world.manage==='manual'&&!START_UI.active&&!SAVEFAIL,'real career initial/manual/saved');
 const actual=JSON.stringify(DB);check(unpackDB(await idbGet('base-1')).world.phase==='initial_roster','actual committed save');
 check(!await startupCommitCareer(db,'1',t.id)&&JSON.stringify(DB)===actual,'stale career inert');
 START_UI={active:true,page:'home',error:''};bindStartup();$('#startup-new').onclick();check(START_UI.page==='new-slot','occupied current uses another slot');
 const careerDB=DB;for(const slot of SAVE_SLOTS){local.set('base-'+slot,packDB(careerDB))}
 const current=()=>true;for(const slot of SAVE_SLOTS.filter(x=>x!=='1'))check(!await startupChooseSlot(slot,current)&&DB===careerDB&&SLOT==='1','full slots no overwrite');
 local.delete('base-2');mem.delete('base-2');START_UI={active:true,page:'new-slot',error:''};
 const fresh=()=>DB===careerDB&&SLOT==='1';check(await startupChooseSlot('2',fresh),'real empty-slot switch');check(SLOT==='2'&&!DB.world&&START_UI.page==='career','slot then career');
 check(unpackDB(await idbGet('base-1')).world.phase==='initial_roster','prior career retained');
 const empty=DB;START_UI.page='load';bindStartup();const oldShow=$('#dshow').onclick;DB=unpackDB(packDB(careerDB));const after=JSON.stringify(DB);oldShow();check(JSON.stringify(DB)===after&&$('#djson').value==='','actual stale utility handler inert');
 START_UI={active:true,page:'load',error:''};bindStartup();$('#startup-resume').onclick();check(!START_UI.active&&DB.world.phase==='initial_roster','current loaded resume');
 DB=empty;START_UI={active:true,page:'new-slot',error:''};local.set('base-5',packDB(careerDB));const stale=()=>false;check(!await startupChooseSlot('5',stale)&&START_UI.error==='','stale async slot observer inert');
 check(local.get('base-3')!==null,'old slot untouched');
 DB=null;startupBootFailure(Error('controlled invalid boot'));check((viewStartup().match(/<button/g)||[]).length===3,'invalid boot keeps three actions');
 bindStartup();$('#startup-load').onclick();check(viewStartup().includes('저장된 게임'),'boot load reachable');
 failReads=true;local.delete('base-7');const bootSlot=SLOT;check(!await startupChooseSlot('7',()=>true)&&DB===null&&SLOT===bootSlot,'boot I/O failure identity preserved');failReads=false;
 check(await startupChooseSlot('1',()=>true)&&DB.world.phase==='initial_roster'&&!START_UI.active&&!START_BOOT_ERROR,'actual other slot boot recovery');
 DB=null;START_BOOT_ERROR='bad original';START_UI={active:true,page:'new-slot',error:''};local.delete('base-8');mem.delete('base-8');check(await startupChooseSlot('8',()=>true)&&!DB.world&&START_UI.page==='career','boot new uses genuine empty slot');
 
 const preferenceWorld=JSON.stringify(DB),activeTheme=$('#app-theme'),themeStatus=$('#app-theme-status');
 bindAppThemePreference(activeTheme,UI_RENDER_ID);activeTheme.value='dark';activeTheme.onchange();check(localStorage.getItem('lol-gm-theme')==='dark'&&theme==='dark'&&themeStatus.hidden,'active theme actual preference writer');
 failWrites=true;activeTheme.value='light';activeTheme.onchange();check(theme==='light'&&localStorage.getItem('lol-gm-theme')==='dark'&&!themeStatus.hidden&&themeStatus.textContent.includes('설정 저장은 실패'),'active theme I/O failure visible');failWrites=false;
 const staleActiveTheme=activeTheme.onchange;UI_RENDER_ID++;activeTheme.value='auto';staleActiveTheme();check(localStorage.getItem('lol-gm-theme')==='dark','active theme stale render inert');
 bindAppThemePreference(activeTheme,UI_RENDER_ID);activeTheme.value='auto';activeTheme.onchange();check(localStorage.getItem('lol-gm-theme')==='auto'&&themeStatus.hidden&&JSON.stringify(DB)===preferenceWorld,'active theme successful recovery game pure');
 console.log('STARTUP_FLOW_ACCEPTANCE '+JSON.stringify({threeActions:true,careerAfterNew:true,cancelPure:true,theme:true,invalidPreserved:true,failedWritesRollback:true,actualManualCareer:true,duplicateStale:true,fullSlotsProtected:true,emptySlot:true,previousCareerSaved:true,staleUtility:true,save:true}));
})()`,{timeout:30000,setupSources:[String.raw`
const indexedDB={};let failReads=false;
let DB,SLOT='1',STORE='base-1',SAVEFAIL=false,SLOT_SWITCHING=false,VIEW='season',UI_RENDER_ID=0,theme='auto',failWrites=false;
const STORE_BASE='base-',STORAGE_NS='storage',SAVE_VERSION=15,DIRECT_FILE_PREVIEW=false;
const SAVE_SLOTS=Array.from({length:10},(_,i)=>String(i+1));
const local=new Map(),mem=new Map(),nodes=new Map();
const localStorage={getItem:k=>local.has(k)?local.get(k):null,setItem:(k,v)=>{if(failWrites)throw Error('controlled write failure');local.set(k,v)},removeItem:k=>local.delete(k)};
async function idbGet(k){if(failReads)throw Error('controlled read failure');return mem.get(k)}async function idbSet(k,v){if(failWrites)throw Error('controlled write failure');mem.set(k,v)}
const document={querySelector:s=>{if(!nodes.has(s))nodes.set(s,{value:'',innerHTML:'',querySelectorAll:()=>[],focus(){}});return nodes.get(s)},querySelectorAll:()=>[],documentElement:{setAttribute:(k,v)=>{theme=v}}};const $=s=>document.querySelector(s);
const window={scrollTo(){}};const navigator={};function clearTimeout(){}function setTimeout(){return 1}function cancelUiTasks(){}function freshInternalSeed(){return 'startup-actual'}
function nav(){UI_RENDER_ID++}function navigateTo(v){VIEW=v;nav();return true}function resetUiForWorld(){START_UI={active:!DB.world,page:'home',error:''}}function bindSetup(){}function seasonSetup(){return 'career choices'}const SSET={};
`,esc,storage,saveLibrary,data,themeSource,startup]});
// Retain the old utility counterexample using original source, without archived save mutation.
const old=await readFile(new URL('../src/artifact/ui-data.js',import.meta.url),'utf8');
assert(old.includes('if(!current())return'),'all utility action callbacks must check identity');
