// ===== LOL GM: 인터랙티브 밴픽 UI =====
// 드래프트 규칙은 draft.js의 단계형 코어를 사용한다. 이 파일은 화면 상태와 입력만 담당한다.

const DRAFT_UI_FILTERS=['ALL',...ROLES];
let DRAFT_UI=null;

function openInteractiveDraft(db,teamIds,playerTeamId,opt={}){
  const playerSide=teamIds.indexOf(playerTeamId);if(playerSide<0)throw new Error('Managed team is not part of draft');
  const seed=opt.seed||freshInternalSeed('draft-ui'),ctx=opt.ctx||{used:[],byTeam:{},fearless:true,practice:true,firstPick:0};
  for(const tid of teamIds)if(!ctx.byTeam[tid])ctx.byTeam[tid]={won:[],lost:[]};
  const state=createDraftSession(db,teamIds,new RNG(seed,'draft'),ctx);
  DRAFT_UI={db,state,playerSide,seed,title:opt.title||'밴픽',filter:'ALL',query:'',selected:null,locked:!!opt.locked,finishLabel:opt.finishLabel||null,doneText:opt.doneText||null,onComplete:typeof opt.onComplete==='function'?opt.onComplete:null};
  const ov=$('#overlay');ov.hidden=false;ov.setAttribute('aria-label',DRAFT_UI.title);document.body.classList.add('lock');
  draftUiAdvanceAi();draftUiRender();
}
function openDraftPractice(db,playerTeamId,opponentTeamId){
  const seed=freshInternalSeed('draft-practice'),sideRng=new RNG(seed,'side'),firstPick=sideRng.chance(.5)?0:1;
  openInteractiveDraft(db,[playerTeamId,opponentTeamId],playerTeamId,{seed,title:'밴픽 연습',ctx:{used:[],byTeam:{},fearless:true,practice:true,firstPick}});
}
function officialSelectionText(setup){
  const p=setup.prompt,lead=p.lead;
  if(p.mode==='first')return setup.game===1&&setup.homeTeam===p.team?'홈 경기 1세트 첫 번째 선택권':'직전 세트 패배팀 첫 번째 선택권';
  if(lead.chose==='side')return `상대가 ${lead.value==='blue'?'블루':'레드'} 진영을 먼저 선택했습니다`;
  return `상대가 ${lead.value==='first'?'선픽':'후픽'}을 먼저 선택했습니다`;
}
function openPendingOfficialSelection(db,setup){
  const me=managedTeamId(db),mine=db.teams[me],oppId=setup.m.a===me?setup.m.b:setup.m.a,opp=db.teams[oppId],score=setup.score||[0,0],meScore=setup.m.a===me?score[0]:score[1],oppScore=setup.m.a===me?score[1]:score[0],p=setup.prompt,last=setup.lastGame;
  const ov=$('#overlay');ov.hidden=false;ov.setAttribute('aria-label','세트 선택권');document.body.classList.add('lock');
  const choices=p.mode==='first'
    ?[{kind:'side',value:'blue',title:'블루 진영',sub:'진영을 먼저 선택'},{kind:'side',value:'red',title:'레드 진영',sub:'진영을 먼저 선택'},{kind:'order',value:'first',title:'선픽',sub:'픽 순서를 먼저 선택'},{kind:'order',value:'last',title:'후픽',sub:'픽 순서를 먼저 선택'}]
    :(p.remaining==='side'
      ?[{kind:'side',value:'blue',title:'블루 진영',sub:'남은 진영 선택'},{kind:'side',value:'red',title:'레드 진영',sub:'남은 진영 선택'}]
      :[{kind:'order',value:'first',title:'선픽',sub:'남은 픽 순서 선택'},{kind:'order',value:'last',title:'후픽',sub:'남은 픽 순서 선택'}]);
  const holder=db.teams[p.chooser],home=setup.homeTeam&&db.teams[setup.homeTeam];
  ov.innerHTML=`<div class="ovin du-choice-wrap">
    <div class="ovhead"><div><b>${esc(setup.comp.name)} · ${esc(mine.short)} ${meScore} : ${oppScore} ${esc(opp.short)}</b><small class="du-phase">${setup.game}세트 First Selection</small></div></div>
    ${last?`<div class="du-last"><span>직전 ${last.n}세트</span><b>${esc(db.teams[last.winner].short)} 승</b><small>${last.kills[0]} : ${last.kills[1]} · ${esc(last.dur)}</small></div>`:''}
    <section class="du-choice-card">
      <small>${esc(officialSelectionText(setup))}</small>
      <h3>${esc(holder.short)}가 첫 번째 선택권 보유</h3>
      <p>${home&&setup.game===1?`홈팀: ${esc(home.short)} · `:''}${p.mode==='first'?'진영 또는 픽 순서 중 하나를 먼저 고르세요. 상대가 나머지를 선택합니다.':'상대가 한 항목을 먼저 골랐습니다. 남은 항목을 선택하세요.'}</p>
      <div class="du-choice-grid">${choices.map(c=>`<button class="du-choice" data-choice-kind="${c.kind}" data-choice-value="${c.value}"><b>${c.title}</b><span>${c.sub}</span></button>`).join('')}</div>
    </section>
  </div>`;
  document.querySelectorAll('[data-choice-kind]').forEach(b=>b.onclick=()=>{applyPendingOfficialSelection(DB,{kind:b.dataset.choiceKind,value:b.dataset.choiceValue});saveDB();openPendingOfficialDraft(DB)});
}
function openPendingOfficialDraft(db){
  const selection=pendingOfficialSelectionSetup(db);if(selection){openPendingOfficialSelection(db,selection);return true}
  const setup=pendingOfficialDraftSetup(db);if(!setup)return false;
  const me=managedTeamId(db),mine=db.teams[me],oppId=setup.m.a===me?setup.m.b:setup.m.a,opp=db.teams[oppId],score=setup.score||[0,0];
  const aScore=score[0],bScore=score[1],meScore=setup.m.a===me?aScore:bScore,oppScore=setup.m.a===me?bScore:aScore;
  const locked=setup.fearlessUsed?.length||0,title=`${setup.comp.name} · ${mine.short} ${meScore} : ${oppScore} ${opp.short} · ${setup.game}세트 밴픽`;
  const fearlessText=locked?` · Fearless 잠금 ${locked}개`:'';
  openInteractiveDraft(db,[setup.blue,setup.red],me,{seed:setup.gseed,title,locked:true,finishLabel:`${setup.game}세트 진행`,doneText:`${setup.game}세트 밴픽이 확정되었습니다${fearlessText}. 경기 결과에 따라 다음 세트 선택권과 Fearless 잠금이 갱신됩니다.`,ctx:setup.draftCtx,onComplete:result=>{
    const out=resolvePendingOfficialMatch(DB,result);LAST=out.game||null;LASTSER=out.done?out.rec:null;saveDB();nav();
  }});
  return true;
}
function draftUiClose(){
  if(DRAFT_UI?.locked)return;
  DRAFT_UI=null;const ov=$('#overlay');if(!ov)return;ov.hidden=true;ov.innerHTML='';ov.setAttribute('aria-label','시리즈 상세');document.body.classList.remove('lock');
}
function draftUiAdvanceAi(){
  if(!DRAFT_UI)return;const s=DRAFT_UI.state;
  while(draftTurn(s)&&draftTurn(s).side!==DRAFT_UI.playerSide){const choice=draftAiChoice(s);if(choice)draftApplyChoice(s,choice);else draftSkipTurn(s)}
}
function draftUiChampionState(c){
  const s=DRAFT_UI.state,turn=draftTurn(s),inPool=s.champs.some(x=>x.id===c.id);
  if(!inPool)return {disabled:true,reason:'사용 불가'};
  if(s.taken.has(c.id))return {disabled:true,reason:'선택됨'};
  if(turn&&turn.kind==='P'&&!draftCanPick(s,turn.side,c.id))return {disabled:true,reason:'조합 불가'};
  return {disabled:false,reason:''};
}
function draftUiMatch(c){
  const q=DRAFT_UI.query.trim().toLowerCase(),f=DRAFT_UI.filter;
  if(f!=='ALL'&&!c.roles.includes(f))return false;
  if(!q)return true;
  return championDisplayName(c).toLowerCase().includes(q)||String(c.name||'').toLowerCase().includes(q)||c.roles.some(r=>String(ROLE_KO[r]||r).toLowerCase().includes(q));
}
function draftUiPickSlot(side,index){
  const s=DRAFT_UI.state,id=s.pickList[side][index],c=id&&s.db.patch.champions[id];
  return `<div class="du-pick ${id?'filled':''}"><span class="du-role">P${index+1}</span>${id?championPortraitMarkup(c,{className:'du-pick-img',alt:false}):'<span class="du-pick-empty"></span>'}<div><b>${id?esc(championDisplayName(c)):'—'}</b><small>${id?(c.roles||[]).map(r=>ROLE_KO[r]).join(' · '):'픽 대기'}</small></div></div>`;
}
function draftUiSidePanel(side){
  const s=DRAFT_UI.state,t=s.db.teams[s.teamIds[side]],turn=draftTurn(s),active=turn&&turn.side===side;
  return `<section class="du-side ${side?'red':'blue'} ${active?'active':''}">
    <div class="du-team"><div><small>${side?'RED':'BLUE'} SIDE</small><h3>${esc(t.name)}</h3></div><b>${s.firstPick===side?'선픽':'후픽'}</b></div>
    <div class="du-bans">${Array.from({length:5},(_,i)=>{const id=s.bans[side][i];return `<span class="${id?'filled':''}">${id?esc(championLabel(s.db,id)):'BAN'}</span>`}).join('')}</div>
    <div class="du-picks">${Array.from({length:5},(_,i)=>draftUiPickSlot(side,i)).join('')}</div>
  </section>`;
}

function draftUiGrid(){
  const s=DRAFT_UI.state,rows=Object.values(s.db.patch.champions).filter(draftUiMatch).sort((a,b)=>championDisplayName(a).localeCompare(championDisplayName(b),'ko'));
  return `<div class="du-grid">${rows.map(c=>{const st=draftUiChampionState(c),sel=DRAFT_UI.selected===c.id;
    return `<button class="du-champ ${sel?'sel':''}" data-du-champ="${c.id}" ${st.disabled?'disabled':''} title="${esc(st.reason||c.roles.map(r=>ROLE_KO[r]).join(' · '))}">
      ${championPortraitMarkup(c,{className:'du-champ-img',alt:false})}<span class="du-champ-meta"><b>${esc(championDisplayName(c))}</b><small>${c.roles.map(r=>ROLE_KO[r]).join(' · ')}</small></span>${st.reason?`<em>${esc(st.reason)}</em>`:''}
    </button>`}).join('')}</div>`;
}
function draftUiRender(){
  if(!DRAFT_UI)return;const s=DRAFT_UI.state,turn=draftTurn(s),done=!turn,ov=$('#overlay');
  const phase=done?'드래프트 완료':`${turn.index+1} / ${DRAFT_ORDER.length} · ${turn.kind==='B'?'밴':'픽'} · ${esc(s.db.teams[s.teamIds[turn.side]].short)} 차례`;
  const mine=!done&&turn.side===DRAFT_UI.playerSide;
  ov.innerHTML=`<div class="ovin du-wrap">
    <div class="ovhead"><div><b>${esc(DRAFT_UI.title)}</b><small class="du-phase">${phase}</small></div>${DRAFT_UI.locked?'':'<button class="ghost" id="du-close">닫기</button>'}</div>
    <div class="du-board">${draftUiSidePanel(0)}<div class="du-center"><strong>${done?'완료':mine?'YOUR TURN':'AI'}</strong><span>${done?'10밴 · 10픽 완료':turn.kind==='B'?'BAN':'PICK'}</span></div>${draftUiSidePanel(1)}</div>
    ${done?`<section class="du-done"><h3>드래프트 완료</h3><p>${esc(DRAFT_UI.doneText||'단계형 밴픽 코어와 동일한 결과입니다.')}</p><button class="primary" id="du-finish">${esc(DRAFT_UI.finishLabel||(DRAFT_UI.onComplete?'드래프트 확정':'연습 종료'))}</button></section>`:
    `<section class="du-pool">
      <div class="du-tools"><input id="du-search" type="search" autocomplete="off" placeholder="챔피언 검색" value="${esc(DRAFT_UI.query)}"><div class="chips">${DRAFT_UI_FILTERS.map(r=>`<button data-du-role="${r}" aria-pressed="${DRAFT_UI.filter===r}">${r==='ALL'?'전체':ROLE_KO[r]}</button>`).join('')}</div></div>
      <div id="du-grid">${draftUiGrid()}</div>
      <div class="du-lock"><div><b>${mine?(DRAFT_UI.selected?esc(championLabel(s.db,DRAFT_UI.selected)):'챔피언을 선택하세요'):'상대 팀이 선택 중입니다'}</b><small>${mine?(turn.kind==='P'?'픽 단계에서는 포지션을 공개하지 않습니다. 드래프트 종료 후 합법적인 5포지션 배치를 확정합니다.':'선택 후 확정해야 밴됩니다.'):'AI는 공개된 챔피언과 가능한 포지션만 보고 판단합니다.'}</small></div><button class="primary" id="du-lock" ${mine&&DRAFT_UI.selected?'':'disabled'}>${turn.kind==='B'?'밴 확정':'픽 확정'}</button></div>
    </section>`}
  </div>`;
  draftUiBind();
}
function draftUiBind(){
  if(!DRAFT_UI)return;
  const close=$('#du-close');if(close)close.onclick=draftUiClose;
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
  const choice={champ:DRAFT_UI.selected,side:turn.side,source:'player'};
  const valid=draftValidateChoice(s,choice);if(!valid.ok){DRAFT_UI.selected=null;draftUiRender();return}
  draftApplyChoice(s,choice);DRAFT_UI.selected=null;draftUiAdvanceAi();draftUiRender();
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&DRAFT_UI&&!DRAFT_UI.locked)draftUiClose()});
