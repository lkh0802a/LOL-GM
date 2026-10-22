import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runEngineFixture} from './test-harness.mjs';
import {uiV2BrowserStorageSource} from './ui-v2-browser-storage.mjs';
const state=await readFile(new URL('../src/ui-v2/state.js',import.meta.url),'utf8');
const native=await uiV2BrowserStorageSource();
const result=await runEngineFixture(String.raw`(async()=>{
 const check=(x,m)=>{if(!x)throw Error('UI_V2_NATIVE_STORAGE '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),team=activeTeams(db,'NA',1)[0];startCareer(db,team.id,'native-bridge');
 for(const t of setupTeamsForManager(db))autoBuildInitialSquad(db,t,new RNG('native/'+t.id));finalizeInitialRosters(db);
 V2.db=db;V2.target=team.id;const raw=packDB(db),key=STORE_BASE+'1';disk.set(key,raw);disk.set(STORE_BASE+'2','{damaged');disk.set(V2_STORE,'old-v2-backup');
 await v2RefreshNativeSaves();check(V2.nativeRows[0].state==='saved'&&V2.nativeRows[1].state==='damaged'&&V2.nativeRows[2].state==='empty','실제 원본 바이트로 저장 상태 판정');
 check(await v2ChooseEmptyNative()==='3','기존·손상 저장을 피해 빈 슬롯 선택');
 V2.db=null;check(await v2LoadNative('1'),'기존 게임 복원');check(packDB(V2.db)===packDB(unpackDB(raw))&&V2.nativeSlot==='1'&&V2.saved,'기존 복원 엔진과 전체 상태 동일·시간 미진행');
 const loaded=V2.db;V2.db.worldDate=addDays(V2.db.worldDate,1);const expected=packDB(V2.db);check(await v2Save(),'실제 writer 확인 뒤 성공');
 check(disk.get(key)===expected&&disk.get(key+'-checkpoint')===raw&&disk.get(STORE_BASE+'2')==='{damaged'&&disk.get(V2_STORE)==='old-v2-backup','기존 형식·복구 지점·원본 보존');
 failWrites=true;V2.db.worldDate=addDays(V2.db.worldDate,1);check(!await v2Save()&&!V2.saved&&disk.get(key)===expected,'저장 거절은 성공으로 보고하지 않음');failWrites=false;
 const before=V2.db;check(!await v2LoadNative('2')&&V2.db===before&&disk.get(STORE_BASE+'2')==='{damaged','손상 게임은 현재 참조를 교체하지 않음');
 // A completed background scan must not invalidate a real asynchronous file import.
 V2.nativeSlot='1';const originalRender=v2Render;let renders=0;v2Render=()=>{renders++;V2.revision++};
 let releaseFile;const delayed=v2LoadFile({text:()=>new Promise(resolve=>{releaseFile=resolve})},v2Guard());
 const rev=V2.revision;await v2RefreshNativeSaves();v2RenderNativeSaves();check(V2.revision===rev&&V2.nativeRenderPending,'저장 목록 완료는 읽는 파일을 무효화하지 않음');
 releaseFile(raw);await delayed;check(packDB(V2.db)===packDB(unpackDB(raw))&&renders===1&&!V2.nativeRenderPending&&!V2.loadRequest,'파일 복원·저장 완료 후 지연 목록 갱신');
 const stable=V2.db;let releaseBad;const bad=v2LoadFile({text:()=>new Promise(resolve=>{releaseBad=resolve})},v2Guard());v2RenderNativeSaves();releaseBad('{bad');await bad;
 check(V2.db===stable&&V2.message.includes('불러오기 실패')&&renders===2&&!V2.loadRequest,'실패한 파일도 현재 게임·오류를 유지하며 지연 목록 갱신');v2Render=originalRender;
 // Native writer serializes frozen snapshots even when IDB finishes late.
 const releases=[];idbSet=(k,v)=>new Promise(resolve=>releases.push(()=>{idbDisk.set(k,v);resolve()}));
 V2.nativeSlot='4';const first=packDB(V2.db),a=v2Save();V2.db.worldDate=addDays(V2.db.worldDate,1);const last=packDB(V2.db),b=v2Save();
 await Promise.resolve();check(releases.length===1&&!V2.saved,'대기 중 저장 완료 표시 금지');releases.shift()();await a;await Promise.resolve();check(releases.length===1,'슬롯별 writer 순차 실행');releases.shift()();await b;
 check(idbDisk.get(STORE_BASE+'4')===last&&first!==last&&V2.saved,'마지막 호출 스냅샷 실제 저장');
 return {fileImportSurvivesDiscovery:true,invalidFilePreservesGame:true,nativeDiscovery:true,damagedAndOldBackupsPreserved:true,existingGameRestoredWithoutProgress:true,canonicalWriterAndCheckpoint:true,failureHonest:true,queuedFrozenSnapshots:true};
})()`,{setupSources:[state,native,`const location={href:'https://lolgm.example/'},history={state:null,replaceState(s,t,u){location.href=u}};const disk=new Map(),idbDisk=new Map();let failWrites=false;const localStorage={getItem:k=>disk.get(k)??null,setItem(k,v){if(failWrites)throw Error('controlled storage refusal');disk.set(k,v)},removeItem:k=>disk.delete(k)};const document={getElementById:()=>({textContent:''})};function v2Target(){return {id:V2.target}}function v2Navigate(){}function v2Render(){}`],timeout:120000});
assert(result.canonicalWriterAndCheckpoint&&result.queuedFrozenSnapshots);console.log('UI_V2_NATIVE_STORAGE_ACCEPTANCE',JSON.stringify(result));
