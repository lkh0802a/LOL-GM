import assert from 'node:assert/strict';
import {artifactSources,compiledEngine} from './test-harness.mjs';
import vm from 'node:vm';
async function runEngineFixture(fixture,{timeout,setupSources}){const context=vm.createContext({console,Date,Math,JSON,Set,Map,WeakMap,Object,Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto});(await compiledEngine()).runInContext(context,{timeout});for(const source of setupSources)new vm.Script(source).runInContext(context,{timeout});return new vm.Script(fixture).runInContext(context,{timeout})}
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
const [app,data,library]=await artifactSources(['app.js','ui-data.js','ui-save-library.js']);
const storage=app.slice(app.indexOf('async function loadDB('),app.indexOf('const $=s=>'));
const esc=app.match(/^const esc=.*$/m)[0];
const archive=JSON.parse(gunzipSync(await readFile(new URL('../docs/evidence/save-library-2026-10-10.raw.json.gz',import.meta.url))));
const originalData=Buffer.from(archive.find(r=>r.path==='original/src/artifact/ui-data.js').base64,'base64').toString();
await runEngineFixture(String.raw`(async()=>{
 const check=(x,m)=>{if(!x)throw Error('SAVE_LIBRARY '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:2,div2:false})];cfg.internationals=[];
 DB=buildWorld(cfg);startCareer(DB,managerSelectableTeams(DB,'KR',1)[0].id,'library-current');
 const original=JSON.stringify(DB),current=DB,other=buildWorld(cfg);startCareer(other,managerSelectableTeams(other,'KR',1)[1].id,'library-other');
 const packed=packDB(other);mem.set('base-2',packed);local.set('base-3','invalid original');mem.set('base-3',packed);mem.set('base-4','invalid IDB original');local.set('storage-meta-7','{"team":"stale metadata"}');
 let row=await readSavedGame('2');check(row.state==='saved'&&row.summary.name===managedTeam(other).name,'actual IDB save without metadata');
 row=await readSavedGame('3');check(row.state==='saved'&&local.get('base-3')==='invalid original','actual restoration fallback and original retained');
 check((await readSavedGame('4')).state==='damaged'&&mem.get('base-4')==='invalid IDB original','invalid preserved');
 check((await readSavedGame('5')).state==='empty','genuine missing');
 readFail.add('base-6');check((await readSavedGame('6')).state==='unavailable','failed storage not empty');
 check((await readSavedGame('7')).state==='empty','metadata never establishes save');
 localFail.add('base-8');mem.set('base-8',packed);check((await readSavedGame('8')).state==='saved','same reader fallback after local failure');
 localFail.add('base-9');check((await readSavedGame('9')).state==='unavailable','unreadable local not empty');
 check(JSON.stringify(DB)===original&&DB===current&&writes===0&&mem.get('base-2')===packed,'all discovery reads preserve live world and raw storage');
 const html=viewData();check(html.includes('저장된 게임')&&html.includes('현재 게임')&&html.includes('저장 원본 관리')&&!html.includes('슬롯 1')&&!html.includes('슬롯 정보 없음'),'game list hierarchy');
 const listed=savedGamesRows([{slot:'2',state:'saved',summary:savedGameSummary(other)},{slot:'4',state:'damaged'},{slot:'5',state:'empty'}]);check(listed.includes(managedTeam(other).name)&&listed.includes('data-slot="2"')&&!listed.includes('data-slot="4"')&&!listed.includes('data-slot="5"'),'only restored games loadable');
 let cases=0;
 for(const mode of ['loaded','world','manager','team','slot','view','render','date','year','manage','fired','phase','overlay','switching','startup-page']){
  DB=unpackDB(packDB(current));SLOT='1';STORE='base-1';VIEW='data';UI_RENDER_ID++;UI_OVERLAY=null;SLOT_SWITCHING=false;START_UI={active:false,page:'home'};
  const g=saveLibraryCurrent();check(g(),'fresh context');
  if(mode==='loaded')DB=unpackDB(packDB(DB));if(mode==='world')DB.world={...DB.world};if(mode==='manager')DB.manager={...DB.manager};if(mode==='team')DB.manager.teamId=null;
  if(mode==='slot')SLOT='2';if(mode==='view')VIEW='season';if(mode==='render')UI_RENDER_ID++;if(mode==='date')DB.worldDate='2030-01-01';if(mode==='year')DB.year++;
  if(mode==='manage')DB.world.manage='ai';if(mode==='fired')DB.world.fired=true;if(mode==='phase')DB.world.phase='offseason';if(mode==='overlay')UI_OVERLAY={};if(mode==='switching')SLOT_SWITCHING=true;if(mode==='startup-page')START_UI.page='settings';
  const before=JSON.stringify(DB);check(!g()&&JSON.stringify(DB)===before,'changed '+mode);cases++;
 }
 DB=current;SLOT='1';STORE='base-1';VIEW='data';UI_RENDER_ID++;UI_OVERLAY=null;SLOT_SWITCHING=false;START_UI={active:false,page:'home'};
 const dom=$('#save-games-list');heldKey='base-2';bindData();const captured=dom.innerHTML;await Promise.resolve();const pending=heldResolve;check(typeof pending==='function','actual pending storage read');
 DB=unpackDB(packDB(current));const after=JSON.stringify(DB);pending(packed);for(let i=0;i<12;i++)await Promise.resolve();check(dom.innerHTML===captured&&JSON.stringify(DB)===after,'late read after world replacement cannot publish or write');heldKey='';
 DB=current;UI_RENDER_ID++;originalBindData();confirmAction=()=>{DB=unpackDB(packDB(other));return true};$('#dreset').onclick();check(!DB.world,'original confirmation callback overwrites replacement world');
 DB=current;UI_RENDER_ID++;bindData();const reset=$('#dreset').onclick;confirmAction=()=>{DB=unpackDB(packDB(other));return true};writes=0;reset();check(managedTeamId(DB)===managedTeamId(other)&&writes===0,'confirm world replacement inert');
 DB=current;UI_RENDER_ID++;bindData();confirmAction=()=>false;const cancel=JSON.stringify(DB);$('#dreset').onclick();check(JSON.stringify(DB)===cancel&&writes===0,'manual cancel pure');
 DB=current;confirmAction=()=>true;UI_RENDER_ID++;bindData();const oldShow=$('#dshow').onclick;DB=other;oldShow();check($('#djson').value===''&&writes===0,'retained export inert');
 DB=current;SLOT='1';STORE='base-1';UI_RENDER_ID++;bindData();$('#dshow').onclick();check(unpackDB($('#djson').value).world.phase===current.world.phase,'actual export restoration');
 const beforeStored=JSON.stringify(DB);check(await persistWorldSnapshot(DB,SLOT,STORE),'actual save');check(unpackDB(mem.get('base-1')).world.phase===DB.world.phase&&JSON.stringify(DB)===beforeStored,'actual save history contract');
 const loaded=await switchSaveSlot('2');check(loaded.ok&&SLOT==='2'&&managedTeamId(DB)===managedTeamId(other)&&unpackDB(mem.get('base-1')).world.phase===current.world.phase,'actual existing slot writer preserves previous career');
 DB=current;SLOT='1';STORE='base-1';UI_RENDER_ID++;bindData();const input=$('#dfile');let firstResolve;const first={text:()=>new Promise(r=>firstResolve=r)};input.files=[first];const oldRead=input.onchange();input.files=[{text:async()=>packed}];await input.onchange();firstResolve('obsolete original');await oldRead;check($('#djson').value===packed&&JSON.stringify(DB)===beforeStored,'latest file selection read only');
 let lateResolve;const late={text:()=>new Promise(r=>lateResolve=r)};input.files=[late];const pendingFile=input.onchange();DB=other;const priorText=$('#djson').value;lateResolve('obsolete world file');await pendingFile;check($('#djson').value===priorText&&DB===other,'file read after world replacement inert');
 DB=current;UI_RENDER_ID++;bindData();$('#dfile').files=[];const cancelFile=$('#djson').value;await $('#dfile').onchange();check($('#djson').value===cancelFile,'file picker cancel pure');
 console.log('SAVE_LIBRARY_ACCEPTANCE '+JSON.stringify({discoveryCases:8,contextCases:cases,lateReadInert:true,confirmReplacementInert:true,cancelPure:true,realExport:true,actualSaveLoad:true,existingWorldPreserved:true}));
})()`,{timeout:30000,setupSources:[String.raw`
let DB,SLOT='1',STORE='base-1',SAVEFAIL=false,SLOT_SWITCHING=false,VIEW='data',UI_RENDER_ID=1,UI_OVERLAY=null,START_UI={active:false,page:'home'};
const STORE_BASE='base-',STORAGE_NS='storage',SAVE_VERSION=15,DIRECT_FILE_PREVIEW=false,indexedDB={};
const SAVE_SLOTS=Array.from({length:10},(_,i)=>String(i+1)),local=new Map(),mem=new Map(),nodes=new Map(),readFail=new Set(),localFail=new Set();let writes=0,heldKey='',heldResolve,confirmAction=()=>true;
const localStorage={getItem:k=>{if(localFail.has(k))throw Error('controlled local read failure');return local.get(k)??null},setItem:(k,v)=>{local.set(k,v)},removeItem:k=>local.delete(k)};
async function idbGet(k){if(readFail.has(k))throw Error('controlled IDB read failure');if(k===heldKey)return new Promise(r=>heldResolve=r);return mem.get(k)}async function idbSet(k,v){mem.set(k,v);writes++}
const document={querySelector:s=>{if(!nodes.has(s))nodes.set(s,{value:'',innerHTML:'',querySelectorAll:()=>[],focus(){}});return nodes.get(s)},querySelectorAll:()=>[]},$=s=>document.querySelector(s);
const navigator={};function clearTimeout(){}function setTimeout(){return 1}function cancelUiTasks(){}function resetUiForWorld(){START_UI={active:!DB.world,page:'home'}}function nav(){UI_RENDER_ID++}function navigateTo(v){VIEW=v;nav()}function confirm(){return confirmAction()}
`,esc,storage,originalData.slice(originalData.indexOf('function bindData(){')).replace('function bindData(){','function originalBindData(){'),library,data]});
assert(originalData.includes("if(!confirm('이 슬롯의 커리어가 모두 지워집니다. 계속할까요?'))return;DB=buildWorld()"),'원본 확인창 이후 문맥 재검사 공백 보존');
