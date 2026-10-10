// 시작 화면 저장 전달. 실제 저장/커리어 작성자와 현재 원본 검사만 사용한다.
// 저장 읽기 실패는 빈 저장이 아니다. 요약 정보만으로 원본 유무를 판단하지 않는다.
async function startupSlotWorld(slot){
  if(!SAVE_SLOTS.includes(slot))throw Error('올바르지 않은 슬롯입니다.');
  const key=STORE_BASE+slot,local=localStorage.getItem(key);
  if(local!==null)return unpackDB(local);
  if(DIRECT_FILE_PREVIEW||typeof indexedDB==='undefined')return null;
  const stored=await idbGet(key);return stored==null?null:unpackDB(stored);
}
async function startupChooseSlot(slot,current){
  try{
    const stored=START_UI.page==='load'?await readSavedGame(slot):await startupSlotWorld(slot);
    if(!current())return false;
    if(START_UI.page!=='load'&&stored)throw Error('이미 커리어나 기록이 있는 슬롯입니다. 불러오기에서 이어가세요.');
    if(START_UI.page==='load'&&stored.state!=='saved')throw Error('저장된 게임이 없습니다. 목록을 다시 확인하세요.');
    if(!DB)return await startupRecoverSlot(slot,current);
    const page=START_UI.page,render=UI_RENDER_ID,source=DB;
    const same=()=>START_UI.page===page&&UI_RENDER_ID===render&&DB===source;
    const result=await switchSaveSlot(slot,async loaded=>{
      if(!same()||loaded.world||(loaded.history||[]).length)return false;
      const stored=await startupSlotWorld(slot);return !stored&&same();
    });
    if(!result.ok)throw Error(result.error);
    if(DB.world||(DB.history||[]).length)throw Error('슬롯 상태가 바뀌었습니다. 기존 저장은 유지됩니다.');
    START_EMPTY_SAVE={db:DB,slot,snapshot:packDB(DB)};startupMove('career');return true;
  }catch(e){if(current()){console.error(e);START_UI.error='저장 상태를 확인하지 못했습니다. 기존 원본을 유지합니다. 목록을 다시 확인하세요.';nav()}return false}
}
async function startupCommitCareer(db,slot,team){
  if(DB!==db||SLOT!==slot||SLOT_SWITCHING||db.world||(db.history||[]).length||!isManagerSelectableTeam(db,team))return false;
  SLOT_SWITCHING=true;
  const main=$('#main');if(main)main.inert=true;
  try{
    if(START_EMPTY_SAVE?.db===db&&START_EMPTY_SAVE.slot===slot){const stored=await startupSlotWorld(slot);if(stored&&packDB(stored)!==START_EMPTY_SAVE.snapshot)throw Error('빈 저장 위치의 상태가 바뀌었습니다. 기존 원본을 유지합니다.');}
    if(DB!==db||SLOT!==slot||db.world||(db.history||[]).length||!isManagerSelectableTeam(db,team))return false;
    const staged=JSON.parse(JSON.stringify(db));
    startCareer(staged,team,freshInternalSeed('world'));
    clearTimeout(saveTimer);saveTimer=null;
    if(!await persistWorldSnapshot(staged,slot,STORE))throw Error('저장에 실패했습니다. 현재 세계는 그대로 유지됩니다.');
    DB=staged;START_EMPTY_SAVE=null;SAVEFAIL=false;resetUiForWorld();START_UI={active:false,page:'home',error:''};VIEW='season';
    return true;
  }catch(e){console.error(e);START_UI.error='커리어를 시작하지 못했습니다. 저장 상태와 현재 선택을 다시 확인하세요. 기존 원본은 유지합니다.';return false}
  finally{SLOT_SWITCHING=false;if(main)main.inert=false;nav();document.querySelector('#main')?.focus?.({preventScroll:true})}
}
async function startupRecoverSlot(slot,current){
  if(!current()||DB)return false;
  const page=START_UI.page,render=UI_RENDER_ID,previousSlot=SLOT,view=VIEW,boot=START_BOOT_ERROR;SLOT_SWITCHING=true;
  try{
    const loaded=await loadDB(STORE_BASE+slot);
    if(DB||SLOT!==previousSlot||UI_RENDER_ID!==render||VIEW!==view||START_UI.page!==page||START_BOOT_ERROR!==boot)return false;
    if(page==='load'&&(await readSavedGame(slot)).state!=='saved')throw Error('저장 상태가 바뀌었습니다. 목록을 다시 확인하세요.');
    if(page==='new-slot'&&await startupSlotWorld(slot))throw Error('저장 상태가 바뀌었습니다. 원본은 유지됩니다.');
    if(DB||SLOT!==previousSlot||UI_RENDER_ID!==render||VIEW!==view||START_UI.page!==page||START_BOOT_ERROR!==boot)return false;
    DB=loaded;SLOT=slot;STORE=STORE_BASE+slot;START_BOOT_ERROR='';
    if(page==='new-slot')START_EMPTY_SAVE={db:loaded,slot,snapshot:packDB(loaded)};
    try{localStorage.setItem(STORAGE_NS+'-slot',slot)}catch(e){}
    resetUiForWorld();START_UI={active:!loaded.world,page:page==='new-slot'?'career':'home',error:''};
    return true;
  }catch(e){console.error(e);if(!DB&&SLOT===previousSlot&&UI_RENDER_ID===render&&VIEW===view&&START_UI.page===page)START_UI.error='저장된 게임을 불러오지 못했습니다. 원본은 유지합니다.';return false}
  finally{SLOT_SWITCHING=false;nav();document.querySelector('#main')?.focus?.({preventScroll:true})}
}
