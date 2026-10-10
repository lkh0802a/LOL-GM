// ===== LOL GM: transient UI state and screen routing =====
// UI state stays outside the saved DB.
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
let ANALYSIS_SET={mode:'own',team:'AUTO',period:'90',patch:'CURRENT',position:'ALL',prepTeam:'AUTO',review:'',reviewTab:'records',tierView:'public',tierQ:'',comp:'ALL'};

const UI_ROUTES=Object.freeze({
  season:{render:viewSeason,bind:bindSeason},
  match:{render:viewMatch,bind:bindMatch},
  squad:{render:()=>initialSquadRoute(viewSquad),bind:()=>initialSquadRoute(bindSquad,true)},
  patch:{render:viewPatch,bind:bindPatch},
  analysis:{render:viewAnalysis,bind:bindAnalysis},
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
function updateAppNavigation(){
  const started=!!DB?.world,names={season:started?'일정·대회':'새 게임',squad:'선수단',match:'경기·스크림',analysis:'분석실',patch:'패치·메타',data:started?'저장·불러오기':'불러오기'};
  document.body?.setAttribute('data-career',String(started));
  document.querySelectorAll('nav button').forEach(b=>{if(names[b.dataset.v])b.textContent=names[b.dataset.v]});
  const save=document.querySelector('#app-save');if(save){save.textContent=names.data;save.setAttribute?.('aria-current',VIEW==='data'?'page':'false');save.onclick=()=>navigateTo('data')};
  const screen=document.querySelector('#app-screen'),club=document.querySelector('#app-club');
  if(screen)screen.textContent=typeof START_UI!=='undefined'&&START_UI.active?'시작':VIEW==='transfer'?'이적시장':names[VIEW];
  if(club){const t=started&&DB.teams&&typeof managedTeamId==='function'&&DB.teams[managedTeamId(DB)];club.textContent=t?`${t.name} · ${DB.worldDate||DB.year}`:started?`무소속 · ${DB.worldDate||DB.year}`:'커리어 시작 전'}
  const theme=document.querySelector('#app-theme');if(theme)bindAppThemePreference(theme,UI_RENDER_ID+1);
}
function nav(){
  const route=initialScreenRoute();
  if(!route)throw new Error('Unknown screen: '+VIEW);
  const main=document.querySelector('#main');
  if(!main)throw new Error('Main screen container missing');
  updateAppNavigation();
  document.body?.setAttribute('data-startup',String(typeof START_UI!=='undefined'&&START_UI.active));
  cancelUiTasks();
  UI_RENDER_ID++;
  if(LIVE!==null)clearInterval(LIVE);
  document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.v===VIEW?'page':'false'));
  main.innerHTML=route.render();
  uiEnhanceScrollRegions(main);
  route.bind();
}
function navigateTo(view,options={}){
  if(!(Object.hasOwn(UI_ROUTES,view)||view==='transfer'&&transferTabAllowed())||!DB||SLOT_SWITCHING)return false;
  if(UI_OVERLAY){
    if(!UI_OVERLAY.dismissible)return false;
    if(UI_OVERLAY.onDismiss)UI_OVERLAY.onDismiss();
    else closeUiOverlay();
  }
  if(VIEW==='squad'&&(document.querySelector('#scq')||document.querySelector('#scback')))captureScoutReturn();
  VIEW=view;
  nav();
  if(!options.keepScroll)window.scrollTo(0,0);
  document.querySelector('#main')?.focus?.({preventScroll:true});
  if(view==='squad'&&(document.querySelector('#scq')||document.querySelector('#scback')))restoreScoutReturn();
  return true;
}
function navKeepScroll(){
  const y=window.scrollY,view=VIEW;
  nav();
  const generation=UI_RENDER_ID;
  requestAnimationFrame(()=>{if(generation===UI_RENDER_ID&&VIEW===view)window.scrollTo(0,y)});
}
function resetUiForWorld(){
  cancelUiTasks();clearScoutReturn();
  if(typeof START_UI!=='undefined')START_UI={active:!DB.world,page:'home',error:''};
  if(UI_OVERLAY)closeUiOverlay({force:true,restoreFocus:false});
  DRAFT_UI=null;
  LAST=LASTSER=OPEN_P=SQUAD_EDIT=null;MSG='';CLUB_ENTRY_DRAFT=null;
  MC.res=null;MC.running=false;SSET.view=null;
  PSET.team='ALL';PSET.player='ALL';PSET.opponent='ALL';PSET.color='ALL';PSET.playerSearch='';PSET.prepTeam='AUTO';
  ANALYSIS_SET={mode:'own',team:'AUTO',period:'90',patch:'CURRENT',position:'ALL',prepTeam:'AUTO',review:'',reviewTab:'records',tierView:'public',tierQ:'',comp:'ALL'};
}
