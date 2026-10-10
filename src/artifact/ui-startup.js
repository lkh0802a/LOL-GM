// Startup owns presentation only; existing storage and career writers own commits.
let START_UI={active:true,page:'home',error:''};
let START_BOOT_ERROR='';
let START_EMPTY_SAVE=null;
function startupBootFailure(error){console.error(error);START_BOOT_ERROR='저장된 게임을 복원하지 못했습니다';START_UI={active:true,page:'home',error:''};VIEW='season';nav()}

function startupMove(page){
  if(SLOT_SWITCHING||(!DB&&!START_BOOT_ERROR))return false;
  START_UI={active:true,page,error:''};VIEW='season';nav();window.scrollTo(0,0);
  document.querySelector('#main')?.focus?.({preventScroll:true});return true;
}
function startupCurrent(db,slot,render){return DB===db&&SLOT===slot&&UI_RENDER_ID===render&&!SLOT_SWITCHING}
function startupBack(){return '<button class="ghost" id="startup-back">처음 화면으로</button>'}
function viewStartup(){
  if(START_UI.page==='home')return `<section class="teamhead"><h2>LOL GM</h2></section>${START_BOOT_ERROR?`<p class="warn" role="status">${esc(START_BOOT_ERROR)} · 저장된 게임 목록에서 복원을 확인하세요. 원본은 유지됩니다.</p>`:''}<section class="controls startup-actions"><button class="primary" id="startup-new">새 게임</button><button class="ghost" id="startup-load">불러오기</button><button class="ghost" id="startup-settings">설정</button></section>`;
  if(START_UI.page==='settings')return `<section class="startup-settings"><h2>설정</h2><label>화면 색상<select id="startup-theme"><option value="auto">자동</option><option value="dark">어둡게</option><option value="light">밝게</option></select></label><p id="startup-theme-status" role="status"></p>${startupBack()}</section>`;
  if(START_UI.page==='new-slot'||(!DB&&START_UI.page==='load'))return renderStartupSavedGames();
  if(START_UI.page==='load')return `<section class="controls">${startupBack()}${DB.world?'<button class="primary" id="startup-resume">현재 커리어 계속</button>':''}</section>`+viewData();
  return seasonSetup();
}

function bindStartup(){
  const db=DB,slot=SLOT,render=UI_RENDER_ID,current=()=>startupCurrent(db,slot,render);
  const bind=(id,action)=>{const b=$('#'+id);if(b)b.onclick=()=>{if(current())return action()}};
  bind('startup-back',()=>startupMove('home'));
  bind('startup-new',()=>startupMove(db&&!db.world&&!(db.history||[]).length?'career':'new-slot'));
  bind('startup-load',()=>startupMove('load'));
  bind('startup-settings',()=>startupMove('settings'));
  bind('startup-resume',()=>{START_UI.active=false;VIEW='season';nav();document.querySelector('#main')?.focus?.({preventScroll:true})});
  if(START_UI.page==='new-slot'||(!db&&START_UI.page==='load'))bindStartupSavedGames();
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
