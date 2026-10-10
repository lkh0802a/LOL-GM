// Save discovery reads actual persisted bytes; metadata never proves emptiness.
let SAVE_LIBRARY_RUN=0;
function savedGameSummary(db){
 const id=managedTeamId(db),team=id&&db.teams?.[id];
 return {name:team?.name||(db.world?'무소속 감독':'커리어 선택 전'),year:db.world?.year??db.year,date:db.worldDate||'',started:!!db.world};
}
function savedGameLabel(s){return `${esc(s.name)}${s.year?` · ${esc(s.year)} 시즌`:''}`}
function saveLibraryCurrent(){
 const db=DB,world=DB?.world,manager=DB?.manager,slot=SLOT,view=VIEW,render=UI_RENDER_ID,date=DB?.worldDate,year=DB?.year,team=managedTeamId(DB),policy=JSON.stringify([DB?.world?.manage,DB?.world?.fired,DB?.world?.phase]),page=typeof START_UI==='undefined'?null:START_UI.page,active=typeof START_UI==='undefined'?null:START_UI.active;
 return ()=>DB===db&&DB?.world===world&&DB?.manager===manager&&SLOT===slot&&VIEW===view&&UI_RENDER_ID===render&&DB?.worldDate===date&&DB?.year===year&&managedTeamId(DB)===team&&JSON.stringify([DB?.world?.manage,DB?.world?.fired,DB?.world?.phase])===policy&&!SLOT_SWITCHING&&(typeof UI_OVERLAY==='undefined'||!UI_OVERLAY)&&(typeof START_UI==='undefined'||START_UI.page===page&&START_UI.active===active);
}
async function readSavedGame(slot){
 if(!SAVE_SLOTS.includes(slot))throw Error('올바르지 않은 저장 위치입니다.');
 const key=STORE_BASE+slot,errors=[];let invalid=false,raw=null;
 try{raw=localStorage.getItem(key)}catch(e){errors.push(e);console.error('LOL GM saved game read failed',slot,e)}
 if(raw!==null&&raw!==undefined){try{return {slot,state:'saved',summary:savedGameSummary(unpackDB(raw))}}catch(e){invalid=true;errors.push(e);console.error('LOL GM saved game read failed',slot,e)}}
 if(!DIRECT_FILE_PREVIEW&&typeof indexedDB!=='undefined'){
  try{raw=await idbGet(key);if(raw!==null&&raw!==undefined){try{return {slot,state:'saved',summary:savedGameSummary(unpackDB(raw))}}catch(e){invalid=true;errors.push(e);console.error('LOL GM saved game read failed',slot,e)}}}catch(e){errors.push(e);console.error('LOL GM saved game read failed',slot,e)}
 }
 if(errors.length)return {slot,state:invalid?'damaged':'unavailable'};
 return {slot,state:'empty'};
}
function renderSavedGames(){
 const s=savedGameSummary(DB);
 return `<section class="teamhead"><h2>저장된 게임</h2><p>진행 상황은 자동 저장됩니다. 다른 게임을 불러와도 현재 게임을 먼저 저장합니다.</p></section><section class="cfgcard cur"><h3>현재 게임</h3><p><b>${savedGameLabel(s)}</b></p>${s.date?`<p>게임 날짜 ${esc(s.date)}</p>`:''}<p class="${SAVEFAIL?'warn':'hint'}" role="status">${SAVEFAIL?'현재 게임을 저장하지 못했습니다. 원본을 내보내 보관하세요.':'자동 저장 사용'}</p></section><section><p id="save-load-status" class="warn" role="status"></p><div class="cfghead"><h3>다른 게임 불러오기</h3><button id="save-games-refresh" class="linklike" type="button">목록 다시 확인</button></div><div id="save-games-list" aria-live="polite"><p>저장된 게임을 확인하고 있습니다.</p></div></section>`;
}
function savedGamesRows(rows){
 const present=rows.filter(r=>r.state!=='empty');
 if(!present.length)return '<p class="hint">다른 저장된 게임이 없습니다.</p>';
 return present.map((r,i)=>r.state==='saved'?`<article class="cfgcard compact"><div class="cfghead"><h3>${savedGameLabel(r.summary)}</h3><button class="ghost" type="button" data-slot="${r.slot}">불러오기</button></div>${r.summary.date?`<p>게임 날짜 ${esc(r.summary.date)}</p>`:''}${!r.summary.started?'<p class="hint">커리어 선택 전</p>':''}</article>`:`<article class="cfgcard compact"><h3>확인하지 못한 저장 ${i+1}</h3><p class="warn">${r.state==='damaged'?'저장 데이터를 복원할 수 없습니다.':'저장소를 읽을 수 없습니다.'} 원본은 유지됩니다. 목록을 다시 확인하거나 원본 관리에서 보관한 파일을 가져오세요.</p></article>`).join('');
}
function bindSavedGames(current,onLoad){
 const run=++SAVE_LIBRARY_RUN,box=$('#save-games-list'),refresh=$('#save-games-refresh');
 const valid=()=>current()&&SAVE_LIBRARY_RUN===run;
 if(refresh)refresh.onclick=()=>{if(!valid())return;bindSavedGames(current,onLoad)};
 if(!box)return;
 box.innerHTML='<p>저장된 게임을 확인하고 있습니다.</p>';
 void (async()=>{
  const rows=[];
  for(const slot of SAVE_SLOTS){if(!valid())return;if(slot!==SLOT)rows.push(await readSavedGame(slot));}
  if(!valid())return;box.innerHTML=savedGamesRows(rows);
  box.querySelectorAll('[data-slot]').forEach(b=>b.onclick=async()=>{if(!valid())return;await onLoad(b);});
 })().catch(e=>{console.error('LOL GM save discovery failed',e);if(valid())box.innerHTML='<p class="warn">저장 목록을 확인하지 못했습니다. 원본은 유지됩니다. 목록을 다시 확인하세요.</p>'});
}
