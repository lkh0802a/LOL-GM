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
let PSET={role:'ALL',q:'',region:'GLOBAL',patch:'ALL',comp:'ALL',period:'ALL',year:'',season:'ALL',split:'ALL',league:'ALL',scope:'ALL',position:'ALL',champ:null};
let DRAFT_UI=null;

// Keep the supported screen map and its binding ownership in one place.
const UI_ROUTES=Object.freeze({
  season:{render:viewSeason,bind:bindSeason},
  match:{render:viewMatch,bind:bindMatch},
  squad:{render:viewSquad,bind:bindSquad},
  patch:{render:viewPatch,bind:bindPatch},
  mc:{render:viewMC,bind:bindMC},
  data:{render:viewData,bind:bindData}
});
let UI_RENDER_ID=0;
function nav(){
  const route=UI_ROUTES[VIEW];
  if(!route)throw new Error('Unknown screen: '+VIEW);
  const main=document.querySelector('#main');
  if(!main)throw new Error('Main screen container missing');
  UI_RENDER_ID++;
  if(LIVE!==null)clearInterval(LIVE);
  document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.v===VIEW?'page':'false'));
  main.innerHTML=route.render();
  route.bind();
}
function navigateTo(view,options={}){
  if(!Object.prototype.hasOwnProperty.call(UI_ROUTES,view))return false;
  VIEW=view;
  nav();
  if(!options.keepScroll)window.scrollTo(0,0);
  return true;
}
function navKeepScroll(){
  const y=window.scrollY,view=VIEW;
  nav();
  const generation=UI_RENDER_ID;
  requestAnimationFrame(()=>{if(generation===UI_RENDER_ID&&VIEW===view)window.scrollTo(0,y)});
}
function resetUiForWorld(){
  LAST=null;LASTSER=null;OPEN_P=null;SQUAD_EDIT=null;MSG='';
  MC.res=null;SSET.view=null;
}
