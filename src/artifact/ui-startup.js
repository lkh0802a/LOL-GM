// Startup owns presentation only; existing storage and career writers own commits.
let START_UI={active:true,page:'home',error:''};
let START_BOOT_ERROR='';
function startupBootFailure(error){START_BOOT_ERROR=error.message||'저장 복원 오류';START_UI={active:true,page:'home',error:''};VIEW='season';nav()}

function startupMove(page){
  if(SLOT_SWITCHING||(!DB&&!START_BOOT_ERROR))return false;
  START_UI={active:true,page,error:''};VIEW='season';nav();window.scrollTo(0,0);
  document.querySelector('#main')?.focus?.({preventScroll:true});return true;
}
function startupCurrent(db,slot,render){return DB===db&&SLOT===slot&&UI_RENDER_ID===render&&!SLOT_SWITCHING}
function startupBack(){return '<button class="ghost" id="startup-back">처음 화면으로</button>'}
function viewStartup(){
  if(START_UI.page==='home')return `<section class="teamhead"><h2>LOL GM</h2></section>${START_BOOT_ERROR?`<p class="warn" role="status">${esc(START_BOOT_ERROR)} · 다른 슬롯을 선택할 수 있습니다. 원본은 유지됩니다.</p>`:''}<section class="controls startup-actions"><button class="primary" id="startup-new">새 시작</button><button class="ghost" id="startup-load">불러오기</button><button class="ghost" id="startup-settings">설정</button></section>`;
  if(START_UI.page==='settings')return `<section><h2>설정</h2><label>화면 색상<select id="startup-theme"><option value="auto">자동</option><option value="dark">어둡게</option><option value="light">밝게</option></select></label><p id="startup-theme-status" role="status"></p>${startupBack()}</section>`;
  if(START_UI.page==='new-slot'||(!DB&&START_UI.page==='load'))return `<section><h2>${START_UI.page==='load'?'저장 슬롯 복원':'새 커리어 저장 위치'}</h2><p>${START_UI.page==='load'?'복원할 슬롯을 선택하세요.':'빈 슬롯을 선택하세요. 모두 사용 중이면 불러오기에서 기존 커리어를 이어갈 수 있습니다.'} 기존 커리어와 손상된 저장 원본은 덮어쓰지 않습니다.</p>${startupBack()}<p class="warn" role="status">${esc(START_UI.error)}</p></section><section class="cfgs">${SAVE_SLOTS.filter(n=>n!==SLOT).map(n=>{const m=slotMeta(n);return `<div class="cfgcard compact"><h3>슬롯 ${n}</h3><p>${m?.team?esc(m.team)+' · '+esc(m.year):'저장 여부는 선택 시 확인합니다'}</p><button data-startup-slot="${n}">이 슬롯 확인</button></div>`}).join('')}</section>`;
  if(START_UI.page==='load')return `<section class="controls">${startupBack()}${DB.world?'<button class="primary" id="startup-resume">현재 커리어 계속</button>':''}</section>`+viewData();
  return seasonSetup();
}
function applyStartupTheme(value){
  if(!['auto','dark','light'].includes(value))return false;
  document.documentElement.setAttribute('data-theme',value);
  try{localStorage.setItem('lol-gm-theme',value);return true}catch(e){return false}
}
// Fail closed on unavailable storage: missing metadata never establishes emptiness.
async function startupSlotWorld(slot){
  if(!SAVE_SLOTS.includes(slot))throw Error('올바르지 않은 슬롯입니다.');
  const key=STORE_BASE+slot,local=localStorage.getItem(key);
  if(local!==null)return unpackDB(local);
  if(DIRECT_FILE_PREVIEW||typeof indexedDB==='undefined')return null;
  const stored=await idbGet(key);return stored==null?null:unpackDB(stored);
}
async function startupChooseSlot(slot,current){
  try{
    const stored=await startupSlotWorld(slot);
    if(!current())return false;
    if(START_UI.page!=='load'&&stored&&(stored.world||(stored.history||[]).length))throw Error('이미 커리어나 기록이 있는 슬롯입니다. 불러오기에서 이어가세요.');
    if(!DB)return await startupRecoverSlot(slot,current);
    const result=await switchSaveSlot(slot);
    if(!result.ok)throw Error(result.error);
    if(DB.world||(DB.history||[]).length)throw Error('슬롯 상태가 바뀌었습니다. 기존 저장은 유지됩니다.');
    startupMove('career');return true;
  }catch(e){if(current()){START_UI.error='새 시작을 진행하지 못했습니다 — '+e.message;nav()}return false}
}
async function startupCommitCareer(db,slot,team){
  if(DB!==db||SLOT!==slot||SLOT_SWITCHING||db.world||(db.history||[]).length||!isManagerSelectableTeam(db,team))return false;
  SLOT_SWITCHING=true;
  const main=$('#main');if(main)main.inert=true;
  try{
    const staged=JSON.parse(JSON.stringify(db));
    startCareer(staged,team,freshInternalSeed('world'));
    clearTimeout(saveTimer);saveTimer=null;
    if(!await persistWorldSnapshot(staged,slot,STORE))throw Error('저장에 실패했습니다. 현재 세계는 그대로 유지됩니다.');
    DB=staged;SAVEFAIL=false;resetUiForWorld();START_UI={active:false,page:'home',error:''};VIEW='season';
    return true;
  }catch(e){START_UI.error='커리어를 시작하지 못했습니다 — '+e.message;return false}
  finally{SLOT_SWITCHING=false;if(main)main.inert=false;nav();document.querySelector('#main')?.focus?.({preventScroll:true})}
}
async function startupRecoverSlot(slot,current){
  if(!current()||DB)return false;
  const page=START_UI.page;SLOT_SWITCHING=true;
  try{
    const loaded=await loadDB(STORE_BASE+slot);
    DB=loaded;SLOT=slot;STORE=STORE_BASE+slot;START_BOOT_ERROR='';
    try{localStorage.setItem(STORAGE_NS+'-slot',slot)}catch(e){}
    resetUiForWorld();START_UI={active:!loaded.world,page:page==='new-slot'?'career':'home',error:''};
    return true;
  }catch(e){START_UI.error='슬롯을 복원하지 못했습니다 — '+e.message;return false}
  finally{SLOT_SWITCHING=false;nav();document.querySelector('#main')?.focus?.({preventScroll:true})}
}
function bindStartup(){
  const db=DB,slot=SLOT,render=UI_RENDER_ID,current=()=>startupCurrent(db,slot,render);
  const bind=(id,action)=>{const b=$('#'+id);if(b)b.onclick=()=>{if(current())return action()}};
  bind('startup-back',()=>startupMove('home'));
  bind('startup-new',()=>startupMove(db&&!db.world&&!(db.history||[]).length?'career':'new-slot'));
  bind('startup-load',()=>startupMove('load'));
  bind('startup-settings',()=>startupMove('settings'));
  bind('startup-resume',()=>{START_UI.active=false;VIEW='season';nav();document.querySelector('#main')?.focus?.({preventScroll:true})});
  if(START_UI.page==='new-slot'||(!db&&START_UI.page==='load'))document.querySelectorAll('[data-startup-slot]').forEach(b=>b.onclick=()=>{if(current())return startupChooseSlot(b.dataset.startupSlot,current)});
  if(START_UI.page==='load'&&db){
    bindData();
    document.querySelectorAll('[data-slot]').forEach(b=>{const action=b.onclick;b.onclick=async()=>{if(!current())return;await action();if(DB!==db){START_UI.active=!!(!DB.world);nav()}}});
  }
  if(START_UI.page==='settings'){
    const select=$('#startup-theme');let theme='auto';try{theme=localStorage.getItem('lol-gm-theme')||'auto'}catch(e){}
    select.value=['auto','dark','light'].includes(theme)?theme:'auto';
    select.onchange=()=>{if(current())$('#startup-theme-status').textContent=applyStartupTheme(select.value)?'설정을 저장했습니다.':'현재 화면에 적용했습니다. 설정 저장은 실패했습니다.'};
  }
  if(START_UI.page==='career'){
    bindSetup();
    for(const id of ['steam-region','steam-division','steam']){const el=$('#'+id),change=el?.onchange;if(change)el.onchange=e=>{if(current())change(e)}}
    bind('startup-back',()=>startupMove('home'));
    bind('sstart',()=>startupCommitCareer(db,slot,SSET.team));
  }
}
