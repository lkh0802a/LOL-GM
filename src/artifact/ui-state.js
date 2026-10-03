// ===== LOL GM: transient UI state and screen routing =====
// View-local state is deliberately excluded from the persistent world DB.
// These globals retain their established names for the standalone classic-script build.
let LAST=null, LASTSER=null, VIEW='season', SQUAD=null, OPEN_P=null, LOGMODE='major', MSG='';
let SCOUTSET={region:'ALL',role:'ALL',contract:'all',competition:'ALL',undervalued:false,q:''}, SQUAD_EDIT=null;
let SSET={team:'HTG',region:null,division:null,seed:freshInternalSeed('world'),tab:'table',view:null};
let SEL={blue:'HTG',red:'SBZ',bo:1,fearless:true};
let LIVE=null;
let MK={role:'ALL',scope:'region',tab:'fa'};
let MC={blue:'HTG',red:'SBZ',n:300,res:null,running:false};
let PSET={role:'ALL',q:'',region:'GLOBAL',patch:'ALL',comp:'ALL',period:'ALL',year:'',season:'ALL',split:'ALL',league:'ALL',scope:'ALL',position:'ALL',team:'ALL',player:'ALL',opponent:'ALL',color:'ALL',playerSearch:'',prepTeam:'AUTO',champ:null};
let DRAFT_UI=null;

// Keep the supported screen map and its binding ownership in one place.
const UI_ROUTES=Object.freeze({
  season:{render:viewSeason,bind:bindSeason},
  match:{render:viewMatch,bind:bindMatch},
  squad:{render:viewSquad,bind:bindSquad},
  patch:{render:viewPatch,bind:bindPatch},
  data:{render:viewData,bind:bindData}
});
// Cooperative UI work is scoped to its world, save slot and render generation.
const UI_TASKS=new Map();
function cancelUiTask(kind){
  const task=UI_TASKS.get(kind);
  if(!task)return;
  UI_TASKS.delete(kind);task.active=false;
  if(task.onCancel)task.onCancel();
}
function cancelUiTasks(){for(const kind of [...UI_TASKS.keys()])cancelUiTask(kind)}
function beginUiTask(kind,onCancel=null){
  cancelUiTask(kind);
  const task={kind,db:DB,slot:SLOT,view:VIEW,renderId:UI_RENDER_ID,active:true,onCancel};
  UI_TASKS.set(kind,task);
  return task;
}
function isUiTaskCurrent(task){
  return !!task&&task.active&&UI_TASKS.get(task.kind)===task&&
    task.db===DB&&task.slot===SLOT&&task.view===VIEW&&task.renderId===UI_RENDER_ID;
}
function finishUiTask(task){
  if(!isUiTaskCurrent(task))return false;
  UI_TASKS.delete(task.kind);task.active=false;return true;
}
let UI_RENDER_ID=0;
// Only genuinely overflowing horizontal data regions become keyboard tab stops.
function uiEnhanceScrollRegions(root){
  if(!root||typeof root.querySelectorAll!=='function')return;
  root.querySelectorAll('.scroll').forEach(region=>{
    if(!Number.isFinite(region.scrollWidth)||!Number.isFinite(region.clientWidth))return;
    if(region.scrollWidth>region.clientWidth+1){
      region.tabIndex=0;
      region.setAttribute('role','region');
      region.setAttribute('aria-label','가로로 스크롤 가능한 표 또는 경기 기록');
      region.dataset.keyboardScroll='true';
    }else if(region.dataset.keyboardScroll==='true'){
      region.removeAttribute('tabindex');
      region.removeAttribute('role');
      region.removeAttribute('aria-label');
      delete region.dataset.keyboardScroll;
    }
  });
}
window.addEventListener?.('resize',()=>{
  uiEnhanceScrollRegions(document.querySelector('#main'));
  if(UI_OVERLAY)uiEnhanceScrollRegions(document.querySelector('#overlay'));
});
function nav(){
  const route=UI_ROUTES[VIEW];
  if(!route)throw new Error('Unknown screen: '+VIEW);
  const main=document.querySelector('#main');
  if(!main)throw new Error('Main screen container missing');
  cancelUiTasks();
  UI_RENDER_ID++;
  if(LIVE!==null)clearInterval(LIVE);
  document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.v===VIEW?'page':'false'));
  main.innerHTML=route.render();
  uiEnhanceScrollRegions(main);
  route.bind();
}
function navigateTo(view,options={}){
  if(!Object.prototype.hasOwnProperty.call(UI_ROUTES,view)||!DB||SLOT_SWITCHING)return false;
  if(UI_OVERLAY){
    if(!UI_OVERLAY.dismissible)return false;
    if(UI_OVERLAY.onDismiss)UI_OVERLAY.onDismiss();
    else closeUiOverlay();
  }
  VIEW=view;
  nav();
  if(!options.keepScroll)window.scrollTo(0,0);
  document.querySelector('#main')?.focus?.({preventScroll:true});
  return true;
}
function navKeepScroll(){
  const y=window.scrollY,view=VIEW;
  nav();
  const generation=UI_RENDER_ID;
  requestAnimationFrame(()=>{if(generation===UI_RENDER_ID&&VIEW===view)window.scrollTo(0,y)});
}
function resetUiForWorld(){
  cancelUiTasks();
  if(UI_OVERLAY)closeUiOverlay({force:true,restoreFocus:false});
  DRAFT_UI=null;
  LAST=null;LASTSER=null;OPEN_P=null;SQUAD_EDIT=null;MSG='';
  MC.res=null;MC.running=false;SSET.view=null;
  PSET.team='ALL';PSET.player='ALL';PSET.opponent='ALL';PSET.color='ALL';PSET.playerSearch='';PSET.prepTeam='AUTO';
}
