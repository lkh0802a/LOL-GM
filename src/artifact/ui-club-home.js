// Transient presentation context; all domain actions keep their existing writers.
let CLUB_HOME_UI=null;
function clubHomeUiState(){
  const c=clubBriefContext();if(!c)return null;
  if(!CLUB_HOME_UI||CLUB_HOME_UI.db!==DB||CLUB_HOME_UI.w!==DB.world||CLUB_HOME_UI.slot!==SLOT||CLUB_HOME_UI.manager!==DB.manager||CLUB_HOME_UI.team!==c.t||CLUB_HOME_UI.date!==DB.worldDate)
    CLUB_HOME_UI={db:DB,w:DB.world,slot:SLOT,manager:DB.manager,team:c.t,date:DB.worldDate,open:false};
  return CLUB_HOME_UI;
}
function renderClubHomeDetails(html){
  const state=clubHomeUiState();
  return `<details class="club-home-details" data-club-home-detail${state?.open?' open':''}><summary>구단 상세 · 등록·재정·직원·의료·계약·훈련·영입</summary>${html}</details>`;
}
function renderClubHomeSquadControls(options){return `<section class="controls">${renderClubHomeReturn()}<label>팀<select id="sq">${options}</select></label></section>`}
function renderClubHomeReturn(){return clubBriefContext()?'<button class="ghost" data-club-home-return>운영 홈으로</button>':''}
function clubHomeRevealTarget(target){
  const detail=target?.closest?.('[data-club-home-detail]');if(!detail)return;
  detail.open=true;const state=clubHomeUiState();if(state)state.open=true;
}
function bindClubHome(){
  document.querySelectorAll('.season-tabs [data-st]').forEach(b=>b.onfocus=()=>b.scrollIntoView?.({block:'nearest',inline:'nearest'}));
  const c=clubBriefContext();if(!c)return;
  const db=DB,w=db.world,manager=db.manager,slot=SLOT,view=VIEW,render=UI_RENDER_ID,date=db.worldDate,team=c.t,state=clubHomeUiState(),phase=w.phase,mode=w.manage,year=db.year,pending=JSON.stringify(w.pendingOfficial);
  const current=()=>DB===db&&DB.world===w&&DB.manager===manager&&SLOT===slot&&!SLOT_SWITCHING&&VIEW===view&&UI_RENDER_ID===render&&db.worldDate===date&&db.year===year&&w.phase===phase&&w.manage===mode&&JSON.stringify(w.pendingOfficial)===pending&&managedTeam(db)===team&&team.active!==false&&!w.fired&&!UI_OVERLAY;
  document.querySelectorAll('[data-club-home-detail]').forEach(d=>d.ontoggle=()=>{if(current()&&CLUB_HOME_UI===state)state.open=d.open});
  const squad=document.querySelector('[data-club-home-squad]');if(squad)squad.onclick=()=>{if(!current())return;SQUAD=team.id;navigateTo('squad')};
  const back=document.querySelector('[data-club-home-return]');if(back)back.onclick=()=>{if(current())navigateTo('season')};
}
