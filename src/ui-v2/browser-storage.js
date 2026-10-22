// 현재 운영 게임과 동일한 슬롯·저장 writer. 화면 상태는 별도 작은 메타데이터다.
const SAVE_VERSION=15,STORAGE_NS='lol-gm-v15',STORE_BASE=STORAGE_NS+'-db-v'+SAVE_VERSION+'-';
const SAVE_SLOTS=Object.freeze(Array.from({length:10},(_,i)=>String(i+1)));
const DIRECT_FILE_PREVIEW=typeof location!=='undefined'&&(location.protocol==='file:'||location.origin==='null');
let SAVE_STATUS=null,SAVE_LAST_ACK=null;
const SAVE_QUEUES=new Map();
function beginSaveStatus(db,slot,key,phase){const status={db,slot,key,phase};SAVE_STATUS=status;publishSaveStatus();return status;}
function publishSaveStatus(){const status=SAVE_STATUS;if(!status||status.db!==V2.db||status.slot!==V2.nativeSlot)return;V2.saved=status.phase==='saved';const el=document.getElementById('save-status');if(el)el.textContent=V2.saved?'현재 게임 저장 완료':status.phase==='failed'?'저장하지 못했습니다 · 파일로 보관하세요':'현재 게임 저장 중';}
function finishSaveStatus(status,ok){if(SAVE_STATUS!==status)return;status.phase=ok?'saved':'failed';publishSaveStatus();}
/*NATIVE_STORAGE*/
async function v2RefreshNativeSaves(){
 const run=(V2.nativeScan||0)+1;V2.nativeScan=run;
 const rows=[];for(const slot of SAVE_SLOTS)rows.push(await readSavedGame(slot));
 if(V2.nativeScan!==run)return false;V2.nativeRows=rows;return true;
}
function v2NativeLibrary(){
 const rows=V2.nativeRows;
 return `<section class="panel"><h2>기기에 저장된 게임</h2><p>기존 게임의 구단과 날짜를 확인한 뒤 불러오세요. 새 게임은 빈 저장 위치를 사용합니다.</p><button class="btn btn-outline" id="native-refresh">저장 목록 다시 확인</button>${!rows?'<p>저장소 확인 중</p>':rows.filter(r=>r.state!=='empty').map(r=>`<article class="player-row"><div><strong>저장 ${r.slot} · ${r.state==='saved'?v2Esc(r.summary.name):'확인 필요'}</strong><p>${r.state==='saved'?v2Esc(r.summary.date):'원본을 읽지 못했습니다. 삭제하거나 덮어쓰지 않습니다.'}</p></div>${r.state==='saved'?`<button class="btn btn-outline" data-native-slot="${r.slot}">불러오기</button>`:''}</article>`).join('')||'<p>저장된 게임이 없습니다.</p>'}</section>`;
}
async function v2ChooseEmptyNative(){
 if(!V2.nativeRows)await v2RefreshNativeSaves();
 const empty=V2.nativeRows?.find(r=>r.state==='empty');
 if(!empty)throw Error('확인된 빈 저장 위치가 없습니다. 기존 게임을 불러오거나 파일로 보관하세요.');
 const row=await readSavedGame(empty.slot);if(row.state!=='empty')throw Error('저장 위치가 변경됐습니다. 목록을 다시 확인하세요.');
 return empty.slot;
}
async function v2PersistNative(){
 const db=V2.db;if(!db)return false;V2.saved=false;
 try{
  if(!V2.nativeSlot){const slot=await v2ChooseEmptyNative();if(V2.db!==db)return false;V2.nativeSlot=slot;}
  const slot=V2.nativeSlot,key=STORE_BASE+slot,status=beginSaveStatus(db,slot,key,'saving');
  // freeze UI metadata before queued persistence, just as the native writer freezes the game.
  const meta=JSON.stringify({read:V2.read,view:{target:v2Target()?.id||null}});
  const ok=await persistWorldSnapshot(db,slot,key,status);
  if(ok&&V2.db===db&&V2.nativeSlot===slot){try{localStorage.setItem(V2_STORE+'-view-'+slot,meta);localStorage.setItem(STORAGE_NS+'-slot',slot)}catch{}}
  return ok;
 }catch(error){V2.saved=false;const el=document.getElementById('save-status');if(el)el.textContent='저장하지 못했습니다 · '+error.message;return false;}
}
async function v2LoadNative(slot){
 if(V2.busy||!SAVE_SLOTS.includes(slot))return false;
 const db=V2.db;V2.busy=true;
 try{
  if(db&&!await v2PersistNative())throw Error('현재 게임을 먼저 저장하거나 파일로 보관하세요.');
  const row=await readSavedGame(slot);if(row.state!=='saved')throw Error('저장된 게임을 확인할 수 없습니다. 원본은 유지됩니다.');
  const loaded=await loadDB(STORE_BASE+slot);if(V2.db!==db)return false;
  // Validate the exact restored graph through the same import gate; no clock or engine writer runs.
  let meta={};try{meta=JSON.parse(localStorage.getItem(V2_STORE+'-view-'+slot)||'{}')}catch{}
  const saved=v2ReadSavedGame(JSON.stringify({...meta,game:packDB(loaded)}));
  const before={...V2},url=location.href,routeState=history.state;
  try{v2InstallSavedGame(saved);V2.nativeSlot=slot;V2.saved=true;V2.busy=false;v2Navigate('home')}catch(error){for(const key of Object.keys(V2))delete V2[key];Object.assign(V2,before);history.replaceState(routeState,'',url);v2Render();throw error}
  v2Tell('저장 '+slot+'의 게임을 불러왔습니다');return true;
 }catch(error){v2Tell('불러오기 실패 · '+error.message);return false;}finally{V2.busy=false;}
}
function v2BindNativeStorage(){
 v2Bind('[data-native-slot]',el=>{void v2LoadNative(el.dataset.nativeSlot)});
 v2Bind('#native-refresh',()=>{void v2RefreshNativeSaves().then(ok=>{if(ok)v2Render()}).catch(error=>v2Tell(error.message))});
}
