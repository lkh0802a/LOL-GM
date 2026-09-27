// ===== LOL GM: 인터랙티브 밴픽 UI =====
// 드래프트 규칙은 draft.js의 단계형 코어를 사용한다. 이 파일은 화면 상태와 입력만 담당한다.

const DRAFT_UI_FILTERS=['ALL',...ROLES];
let DRAFT_UI=null;

function openInteractiveDraft(db,teamIds,playerTeamId,opt={}){
  const playerSide=teamIds.indexOf(playerTeamId);if(playerSide<0)throw new Error('Managed team is not part of draft');
  const seed=opt.seed||freshInternalSeed('draft-ui'),ctx=opt.ctx||{used:[],byTeam:{},fearless:true,practice:true,firstPick:0};
  for(const tid of teamIds)if(!ctx.byTeam[tid])ctx.byTeam[tid]={won:[],lost:[]};
  const state=createDraftSession(db,teamIds,new RNG(seed,'draft'),ctx);
  DRAFT_UI={db,state,playerSide,seed,title:opt.title||'밴픽',filter:'ALL',query:'',selected:null,onComplete:typeof opt.onComplete==='function'?opt.onComplete:null};
  const ov=$('#overlay');ov.hidden=false;ov.setAttribute('aria-label',DRAFT_UI.title);document.body.classList.add('lock');
  draftUiAdvanceAi();draftUiRender();
}
function openDraftPractice(db,playerTeamId,opponentTeamId){
  const seed=freshInternalSeed('draft-practice'),sideRng=new RNG(seed,'side'),firstPick=sideRng.chance(.5)?0:1;
  openInteractiveDraft(db,[playerTeamId,opponentTeamId],playerTeamId,{seed,title:'밴픽 연습',ctx:{used:[],byTeam:{},fearless:true,practice:true,firstPick}});
}
function draftUiClose(){
  DRAFT_UI=null;const ov=$('#overlay');if(!ov)return;ov.hidden=true;ov.innerHTML='';ov.setAttribute('aria-label','시리즈 상세');document.body.classList.remove('lock');
}
function draftUiAdvanceAi(){
  if(!DRAFT_UI)return;const s=DRAFT_UI.state;
  while(draftTurn(s)&&draftTurn(s).side!==DRAFT_UI.playerSide){const choice=draftAiChoice(s);if(choice)draftApplyChoice(s,choice);else draftSkipTurn(s)}
}
function draftUiPlayerRole(state,champId){
  const turn=draftTurn(state);if(!turn||turn.kind!=='P')return null;
  const c=state.db.patch.champions[champId],open=ROLES.filter(r=>!state.picks[turn.side][r]&&c.roles.includes(r));if(!open.length)return null;
  const mine=Object.values(state.picks[turn.side]).map(id=>state.db.patch.champions[id]);
  return open.map(role=>({role,v:draftPickValue(state,turn.side,role,champId,mine).total})).sort((a,b)=>b.v-a.v)[0].role;
}
function draftUiChampionState(c){
  const s=DRAFT_UI.state,turn=draftTurn(s),inPool=s.champs.some(x=>x.id===c.id);
  if(!inPool)return {disabled:true,reason:'사용 불가'};
  if(s.taken.has(c.id))return {disabled:true,reason:'선택됨'};
  if(turn&&turn.kind==='P'&&!ROLES.some(r=>!s.picks[turn.side][r]&&c.roles.includes(r)))return {disabled:true,reason:'포지션 완료'};
  return {disabled:false,reason:''};
}
function draftUiMatch(c){
  const q=DRAFT_UI.query.trim().toLowerCase(),f=DRAFT_UI.filter;
  if(f!=='ALL'&&!c.roles.includes(f))return false;
  if(!q)return true;
  return championDisplayName(c).toLowerCase().includes(q)||String(c.name||'').toLowerCase().includes(q)||c.roles.some(r=>String(ROLE_KO[r]||r).toLowerCase().includes(q));
}
function draftUiSlot(side,role){
  const s=DRAFT_UI.state,id=s.picks[side][role],c=id&&s.db.patch.champions[id],p=s.roster[side][role];
  return `<div class="du-pick ${id?'filled':''}"><span class="du-role">${ROLE_KO[role]}</span><div><b>${id?esc(championDisplayName(c)):'—'}</b><small>${esc(p?.name||'주전 미정')}</small></div></div>`;
}
function draftUiSidePanel(side){
  const s=DRAFT_UI.state,t=s.db.teams[s.teamIds[side]],turn=draftTurn(s),active=turn&&turn.side===side;
  return `<section class="du-side ${side?'red':'blue'} ${active?'active':''}">
    <div class="du-team"><div><small>${side?'RED':'BLUE'} SIDE</small><h3>${esc(t.name)}</h3></div><b>${s.firstPick===side?'선픽':'후픽'}</b></div>
    <div class="du-bans">${Array.from({length:5},(_,i)=>{const id=s.bans[side][i];return `<span class="${id?'filled':''}">${id?esc(championLabel(s.db,id)):'BAN'}</span>`}).join('')}</div>
    <div class="du-picks">${ROLES.map(r=>draftUiSlot(side,r)).join('')}</div>
  </section>`;
}
function draftUiGrid(){
  const s=DRAFT_UI.state,rows=Object.values(s.db.patch.champions).filter(draftUiMatch).sort((a,b)=>championDisplayName(a).localeCompare(championDisplayName(b),'ko'));
  return `<div class="du-grid">${rows.map(c=>{const st=draftUiChampionState(c),sel=DRAFT_UI.selected===c.id;
    return `<button class="du-champ ${sel?'sel':''}" data-du-champ="${c.id}" ${st.disabled?'disabled':''} title="${esc(st.reason||c.roles.map(r=>ROLE_KO[r]).join(' · '))}">
      <b>${esc(championDisplayName(c))}</b><small>${c.roles.map(r=>ROLE_KO[r]).join(' · ')}</small>${st.reason?`<em>${esc(st.reason)}</em>`:''}
    </button>`}).join('')}</div>`;
}
function draftUiRender(){
  if(!DRAFT_UI)return;const s=DRAFT_UI.state,turn=draftTurn(s),done=!turn,ov=$('#overlay');
  const phase=done?'드래프트 완료':`${turn.index+1} / ${DRAFT_ORDER.length} · ${turn.kind==='B'?'밴':'픽'} · ${esc(s.db.teams[s.teamIds[turn.side]].short)} 차례`;
  const mine=!done&&turn.side===DRAFT_UI.playerSide;
  ov.innerHTML=`<div class="ovin du-wrap">
    <div class="ovhead"><div><b>${esc(DRAFT_UI.title)}</b><small class="du-phase">${phase}</small></div><button class="ghost" id="du-close">닫기</button></div>
    <div class="du-board">${draftUiSidePanel(0)}<div class="du-center"><strong>${done?'완료':mine?'YOUR TURN':'AI'}</strong><span>${done?'10밴 · 10픽 완료':turn.kind==='B'?'BAN':'PICK'}</span></div>${draftUiSidePanel(1)}</div>
    ${done?`<section class="du-done"><h3>드래프트 완료</h3><p>단계형 밴픽 코어와 동일한 결과입니다. 공식 경기 연결 단계에서 이 결과를 경기 엔진에 그대로 전달합니다.</p><button class="primary" id="du-finish">${DRAFT_UI.onComplete?'드래프트 확정':'연습 종료'}</button></section>`:
    `<section class="du-pool">
      <div class="du-tools"><input id="du-search" type="search" autocomplete="off" placeholder="챔피언 검색" value="${esc(DRAFT_UI.query)}"><div class="chips">${DRAFT_UI_FILTERS.map(r=>`<button data-du-role="${r}" aria-pressed="${DRAFT_UI.filter===r}">${r==='ALL'?'전체':ROLE_KO[r]}</button>`).join('')}</div></div>
      <div id="du-grid">${draftUiGrid()}</div>
      <div class="du-lock"><div><b>${mine?(DRAFT_UI.selected?esc(championLabel(s.db,DRAFT_UI.selected)):'챔피언을 선택하세요'):'상대 팀이 선택 중입니다'}</b><small>${mine?(turn.kind==='P'?'챔피언만 선택하면 포지션은 현재 조합과 주전 숙련도를 기준으로 내부 배정됩니다.':'선택 후 확정해야 밴됩니다.'):'AI 판단을 처리하고 있습니다.'}</small></div><button class="primary" id="du-lock" ${mine&&DRAFT_UI.selected?'':'disabled'}>${turn.kind==='B'?'밴 확정':'픽 확정'}</button></div>
    </section>`}
  </div>`;
  draftUiBind();
}
function draftUiBind(){
  if(!DRAFT_UI)return;
  $('#du-close').onclick=draftUiClose;
  const finish=$('#du-finish');if(finish)finish.onclick=()=>{const result=draftResult(DRAFT_UI.state),cb=DRAFT_UI.onComplete;if(cb){DRAFT_UI=null;const ov=$('#overlay');ov.hidden=true;ov.innerHTML='';document.body.classList.remove('lock');cb(result)}else draftUiClose()};
  const search=$('#du-search');if(search)search.oninput=e=>{DRAFT_UI.query=e.target.value;const box=$('#du-grid');if(box)box.innerHTML=draftUiGrid();draftUiBindGrid()};
  document.querySelectorAll('[data-du-role]').forEach(b=>b.onclick=()=>{DRAFT_UI.filter=b.dataset.duRole;DRAFT_UI.selected=null;draftUiRender()});
  draftUiBindGrid();
  const lock=$('#du-lock');if(lock)lock.onclick=()=>draftUiLock();
}
function draftUiBindGrid(){
  document.querySelectorAll('[data-du-champ]').forEach(b=>b.onclick=()=>{DRAFT_UI.selected=b.dataset.duChamp;document.querySelectorAll('[data-du-champ]').forEach(x=>x.classList.toggle('sel',x===b));const lock=$('#du-lock');if(lock)lock.disabled=false;const name=lock?.previousElementSibling?.querySelector('b');if(name)name.textContent=championLabel(DRAFT_UI.state.db,DRAFT_UI.selected)});
}
function draftUiLock(){
  if(!DRAFT_UI||!DRAFT_UI.selected)return;const s=DRAFT_UI.state,turn=draftTurn(s);if(!turn||turn.side!==DRAFT_UI.playerSide)return;
  const role=turn.kind==='P'?draftUiPlayerRole(s,DRAFT_UI.selected):null,choice={champ:DRAFT_UI.selected,side:turn.side,source:'player'};if(role)choice.role=role;
  const valid=draftValidateChoice(s,choice);if(!valid.ok){DRAFT_UI.selected=null;draftUiRender();return}
  draftApplyChoice(s,choice);DRAFT_UI.selected=null;draftUiAdvanceAi();draftUiRender();
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&DRAFT_UI)draftUiClose()});
