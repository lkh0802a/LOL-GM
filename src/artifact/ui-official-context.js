// Official UI lifecycle only; series, seed and history writers stay in the engine.
let OFFICIAL_UI_PAUSED=null;
function officialUiContext(db){
  const world=db?.world,team=db?managedTeamId(db):null,club=db?.teams?.[team],pending=world?.pendingOfficial,q=pending?.queue?.[0];
  const stamp=()=>JSON.stringify([db?.worldDate,db?.year,world?.phase,world?.step,world?.manage,world?.fired,club,db?.regions?.[club?.region],pending]);
  return {db,world,manager:db?.manager,team,club,pending,q,session:q?.session,slot:SLOT,view:VIEW,render:UI_RENDER_ID,stamp:stamp(),read:stamp};
}
function officialUiAuthority(c){
  if(!c||c.db!==DB||c.world!==DB?.world||c.manager!==DB.manager||c.slot!==SLOT||SLOT_SWITCHING||c.team!==managedTeamId(DB)||c.club!==DB.teams?.[c.team])return false;
  const w=c.world,t=c.club,q=w?.pendingOfficial?.queue?.[0];
  if(!t||t.active===false||!DB.regions?.[t.region]||w?.phase!=='season'||w.manage!=='manual'||w.fired||!managerControlsSquad(DB,t)||c.pending!==w.pendingOfficial||c.q!==q||c.session!==q?.session||!q)return false;
  const refs=pendingOfficialRefs(DB,q);
  return !!refs&&(refs.m.a===c.team||refs.m.b===c.team)&&c.pending.date===DB.worldDate&&refs.day.date===c.pending.date&&q.date===c.pending.date&&w.year===DB.year&&c.stamp===c.read();
}
function officialUiCurrent(c){return officialUiAuthority(c)&&c.view===VIEW&&c.render===UI_RENDER_ID}
function officialUiReason(c){
  const t=c.club,w=c.world;
  if(!t||t.active===false)return '현재 맡은 활성 구단이 없습니다.';
  if(!w||w.phase!=='season')return '현재 시즌의 공식 경기 준비 상태가 아닙니다.';
  if(w.fired)return '해임 상태에서는 수동 경기 준비를 진행할 수 없습니다.';
  if(w.manage!=='manual')return '수동 운영 상태에서 경기 준비를 진행할 수 있습니다.';
  if(!DB.regions?.[t.region])return '현재 구단의 지역 정보를 확인할 수 없습니다.';
  const refs=c.q&&pendingOfficialRefs(DB,c.q);
  if(!refs)return '진행 중인 공식 경기 정보를 확인할 수 없습니다.';
  if(refs.m.a!==c.team&&refs.m.b!==c.team)return '현재 맡은 구단의 경기가 아닙니다.';
  if(c.pending.date!==DB.worldDate||w.year!==DB.year)return '공식 경기의 날짜와 현재 시즌 날짜가 다릅니다.';
  return '경기 준비 문맥이 바뀌었습니다. 중단한 뒤 현재 상태를 검토하세요.';
}
function officialUiReject(overlay){
  if(overlay!==UI_OVERLAY)return false;
  const note=$('#official-context-status');if(note)note.textContent=officialUiReason(officialUiContext(DB));
  return false;
}
function officialUiPause(c,overlay,draft=null){
  if(UI_OVERLAY!==overlay)return false;
  const same=c.db===DB&&c.world===DB?.world&&c.slot===SLOT&&!SLOT_SWITCHING;
  OFFICIAL_UI_PAUSED=same?{context:c,draft}:null;
  if(DRAFT_UI===draft)DRAFT_UI=null;
  closeUiOverlay({force:true,restoreFocus:false});
  if(same)saveDB();
  nav();$('#official-open')?.focus?.();return true;
}
function officialUiPauseMarkup(){return '<button class="ghost" id="official-pause">준비 중단</button><span id="official-context-status" role="status" aria-live="polite"></span>'}
function officialUiBindPending(staleFrame=()=>false){
  const c=officialUiContext(DB),paused=OFFICIAL_UI_PAUSED?.context.db===DB&&OFFICIAL_UI_PAUSED.context.world===DB.world?OFFICIAL_UI_PAUSED:null;
  if(!paused)OFFICIAL_UI_PAUSED=null;
  document.querySelectorAll('.controls button').forEach(b=>b.disabled=true);
  const controls=document.querySelector('.controls');
  controls?.insertAdjacentHTML('beforeend','<button class="primary" id="official-open">현재 경기 준비 검토</button>'+(!officialUiCurrent(c)?'<span role="status">'+esc(officialUiReason(c))+'</span>':'')+(paused?.draft?'<button class="ghost" id="official-discard">미완료 밴픽 입력 취소</button><span role="status">미완료 챔피언 입력은 저장에 포함되지 않습니다.</span>':''));
  const open=$('#official-open');if(open){open.disabled=!officialUiCurrent(c);open.onclick=()=>{
    if(c.db!==DB||c.world!==DB.world||c.slot!==SLOT||c.view!==VIEW||c.render!==UI_RENDER_ID||UI_OVERLAY||SLOT_SWITCHING)return;
    const current=officialUiContext(DB);if(!officialUiCurrent(current))return;
    OFFICIAL_UI_PAUSED=null;
    if(paused?.draft&&officialUiAuthority(paused.context)){
      DRAFT_UI=paused.draft;DRAFT_UI.officialContext=current;
      openUiOverlay({kind:'draft',label:DRAFT_UI.title,html:'',dismissible:false});draftUiRender();
    }else openPendingOfficialDraft(current.db);
  }}
  const discard=$('#official-discard');if(discard)discard.onclick=()=>{
    if(discard.isConnected===false||OFFICIAL_UI_PAUSED!==paused||!officialUiCurrent(c)||UI_OVERLAY)return;
    OFFICIAL_UI_PAUSED={context:c,draft:null};nav();$('#official-open')?.focus?.();
  };
  if(paused)return;
  requestAnimationFrame(()=>{if(!staleFrame()&&officialUiCurrent(c)&&!UI_OVERLAY)openPendingOfficialDraft(c.db)});
}
function draftUiActionCurrent(s,overlay,node){
  if(!s||DRAFT_UI!==s||UI_OVERLAY!==overlay||node?.isConnected===false)return false;
  return !s.officialContext||officialUiCurrent(s.officialContext)||officialUiReject(overlay);
}
