// ===== LOL GM: 인터랙티브 밴픽 UI =====
// 드래프트 규칙은 draft.js의 단계형 코어를 사용한다. 이 파일은 화면 상태와 입력만 담당한다.

const DRAFT_UI_FILTERS=['ALL',...ROLES];

function openInteractiveDraft(db,teamIds,playerTeamId,opt={}){
  const playerSide=teamIds.indexOf(playerTeamId);if(playerSide<0)throw new Error('Managed team is not part of draft');
  const seed=opt.seed||freshInternalSeed('draft-ui'),ctx=opt.ctx||{used:[],byTeam:{},fearless:true,practice:true,firstPick:0};
  for(const tid of teamIds)if(!ctx.byTeam[tid])ctx.byTeam[tid]={won:[],lost:[]};
  const matchDb=opt.officialSession?seriesOfficialView(db,opt.officialSession):db,
    state=createDraftSession(matchDb,teamIds,new RNG(seed,'draft'),ctx);
  DRAFT_UI={db,state,playerSide,seed,title:opt.title||'밴픽',filter:'ALL',query:'',selected:null,infoTab:'analysis',locked:!!opt.locked,finishLabel:opt.finishLabel||null,doneText:opt.doneText||null,meta:opt.meta||null,onComplete:typeof opt.onComplete==='function'?opt.onComplete:null};
  openUiOverlay({kind:'draft',label:DRAFT_UI.title,html:'',dismissible:!DRAFT_UI.locked,onDismiss:draftUiClose});
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
function officialLastGameRow(db,last,side){
  const tid=side===0?last.blue:last.red,ids=last.picks?.[side]||[],win=last.winner===tid;
  return `<div class="du-last-team ${win?'win':''}"><b>${esc(db.teams[tid]?.short||tid)}</b><div class="du-last-picks">${ids.map(id=>{const c=db.patch.champions[id];return c?championPortraitMarkup(c,{className:'du-last-pick',alt:false}):''}).join('')}</div><span>${win?'승':'패'}</span></div>`;
}
function officialLastGameCard(db,last){
  if(!last)return '';
  return `<section class="du-last-card"><div class="du-last-head"><span>직전 ${last.n}세트</span><b>${esc(db.teams[last.winner]?.short||last.winner)} 승</b><small>${last.kills[0]} : ${last.kills[1]} · ${esc(last.dur)}</small></div>${officialLastGameRow(db,last,0)}${officialLastGameRow(db,last,1)}</section>`;
}
function openPendingOfficialSelection(db,setup){
  const me=managedTeamId(db),mine=db.teams[me],oppId=setup.m.a===me?setup.m.b:setup.m.a,opp=db.teams[oppId],score=setup.score||[0,0],meScore=setup.m.a===me?score[0]:score[1],oppScore=setup.m.a===me?score[1]:score[0],p=setup.prompt,last=setup.lastGame;
  
  const choices=p.mode==='first'
    ?[{kind:'side',value:'blue',title:'블루 진영',sub:'진영을 먼저 선택'},{kind:'side',value:'red',title:'레드 진영',sub:'진영을 먼저 선택'},{kind:'order',value:'first',title:'선픽',sub:'픽 순서를 먼저 선택'},{kind:'order',value:'last',title:'후픽',sub:'픽 순서를 먼저 선택'}]
    :(p.remaining==='side'
      ?[{kind:'side',value:'blue',title:'블루 진영',sub:'남은 진영 선택'},{kind:'side',value:'red',title:'레드 진영',sub:'남은 진영 선택'}]
      :[{kind:'order',value:'first',title:'선픽',sub:'남은 픽 순서 선택'},{kind:'order',value:'last',title:'후픽',sub:'남은 픽 순서 선택'}]);
  const holder=db.teams[p.chooser],home=setup.homeTeam&&db.teams[setup.homeTeam];
  const markup=`<div class="ovin du-choice-wrap">
    <div class="ovhead"><div><b>${esc(setup.comp.name)} · ${esc(mine.short)} ${meScore} : ${oppScore} ${esc(opp.short)}</b><small class="du-phase">${setup.game}세트 First Selection</small></div></div>
    ${officialLastGameCard(db,last)}
    <section class="du-choice-card">
      <small>${esc(officialSelectionText(setup))}</small>
      <h3>${esc(holder.short)}가 첫 번째 선택권 보유</h3>
      <p>${home&&setup.game===1?`홈팀: ${esc(home.short)} · `:''}${p.mode==='first'?'진영 또는 픽 순서 중 하나를 먼저 고르세요. 상대가 나머지를 선택합니다.':'상대가 한 항목을 먼저 골랐습니다. 남은 항목을 선택하세요.'}</p>
      <div class="du-choice-grid">${choices.map(c=>`<button class="du-choice" data-choice-kind="${c.kind}" data-choice-value="${c.value}"><b>${c.title}</b><span>${c.sub}</span></button>`).join('')}</div>
    </section>
  </div>`;
  openUiOverlay({kind:'selection',label:'세트 선택권',html:markup,dismissible:false,focusSelector:'[data-choice-kind]'});
  document.querySelectorAll('[data-choice-kind]').forEach(b=>b.onclick=()=>{applyPendingOfficialSelection(DB,{kind:b.dataset.choiceKind,value:b.dataset.choiceValue});saveDB();openPendingOfficialDraft(DB)});
}
function openPendingOfficialDraft(db){
  const selection=pendingOfficialSelectionSetup(db);if(selection){openPendingOfficialSelection(db,selection);return true}
  const setup=pendingOfficialDraftSetup(db);if(!setup)return false;
  const me=managedTeamId(db),mine=db.teams[me],oppId=setup.m.a===me?setup.m.b:setup.m.a,opp=db.teams[oppId],score=setup.score||[0,0];
  const aScore=score[0],bScore=score[1],meScore=setup.m.a===me?aScore:bScore,oppScore=setup.m.a===me?bScore:aScore;
  const locked=setup.fearlessUsed?.length||0,title=`${setup.comp.name} · ${mine.short} ${meScore} : ${oppScore} ${opp.short} · ${setup.game}세트 밴픽`;
  const fearlessText=locked?` · Fearless 잠금 ${locked}개`:'';
  openInteractiveDraft(db,[setup.blue,setup.red],me,{officialSession:setup.session,seed:setup.gseed,title,locked:true,finishLabel:`${setup.game}세트 진행`,doneText:`${setup.game}세트 밴픽이 확정되었습니다${fearlessText}. 경기 결과에 따라 다음 세트 선택권과 Fearless 잠금이 갱신됩니다.`,ctx:setup.draftCtx,meta:{official:true,game:setup.game,competition:setup.comp.name,score:[meScore,oppScore],me:mine.short,opp:opp.short,firstSelectionTeam:db.teams[setup.chooser]?.short||setup.chooser,firstSelectionWhy:setup.sc?.why||'',fearlessUsed:setup.fearlessUsed||[]},onComplete:result=>{
    const out=resolvePendingOfficialMatch(DB,result);LAST=out.game||null;LASTSER=out.done?out.rec:null;saveDB();nav();
  }});
  return true;
}
function draftUiClose(){
  if(!DRAFT_UI||DRAFT_UI.locked)return;
  DRAFT_UI=null;closeUiOverlay();
}
function draftUiAdvanceAi(){
  if(!DRAFT_UI)return;const s=DRAFT_UI.state;
  while(draftTurn(s)&&draftTurn(s).side!==DRAFT_UI.playerSide){const choice=draftAiChoice(s);if(choice)draftApplyChoice(s,choice);else draftSkipTurn(s)}
}
function draftUiChampionState(c){
  const s=DRAFT_UI.state,turn=draftTurn(s),inPool=s.champs.some(x=>x.id===c.id);
  if(!inPool)return {disabled:true,reason:'사용 불가'};
  if(s.ctx.fearless&&s.ctx.used?.includes(c.id))return {disabled:true,reason:'Fearless'};
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
function draftUiBanSlot(side,index){
  const s=DRAFT_UI.state,id=s.bans[side][index],c=id&&s.db.patch.champions[id];
  return `<span class="${id?'filled':''}" title="${id?esc(championLabel(s.db,id)):'BAN'}">${id?championPortraitMarkup(c,{className:'du-ban-img',alt:false}):'<i>BAN</i>'}</span>`;
}
function draftUiSidePanel(side){
  const s=DRAFT_UI.state,t=s.db.teams[s.teamIds[side]],turn=draftTurn(s),active=turn&&turn.side===side;
  return `<section class="du-side ${side?'red':'blue'} ${active?'active':''}">
    <div class="du-team"><div><small>${side?'RED':'BLUE'} SIDE</small><h3>${esc(t.name)}</h3></div><b>${s.firstPick===side?'선픽':'후픽'}</b></div>
    <div class="du-bans">${Array.from({length:5},(_,i)=>draftUiBanSlot(side,i)).join('')}</div>
    <div class="du-picks">${Array.from({length:5},(_,i)=>draftUiPickSlot(side,i)).join('')}</div>
  </section>`;
}

function draftUiFearlessStrip(){
  const m=DRAFT_UI.meta,ids=m?.fearlessUsed||[];if(!ids.length)return '';
  return `<div class="du-fearless"><b>FEARLESS · ${ids.length} 잠금</b><div>${ids.map(id=>{const c=DRAFT_UI.db.patch.champions[id];return c?championPortraitMarkup(c,{className:'du-fearless-img',alt:false}):''}).join('')}</div></div>`;
}
function draftUiSeriesMeta(){
  const m=DRAFT_UI.meta;if(!m?.official)return '';
  return `<section class="du-series-meta"><div><small>${esc(m.competition)} · ${m.game}세트</small><strong>${esc(m.me)} ${m.score[0]} : ${m.score[1]} ${esc(m.opp)}</strong></div><div><small>FIRST SELECTION</small><b>${esc(m.firstSelectionTeam)}</b><span>${esc(m.firstSelectionWhy)}</span></div></section>${draftUiFearlessStrip()}`;
}
function draftUiSigned(v){return (v>0?'+':'')+v}
function draftUiEvidenceSources(xs){return (xs||[]).map(x=>`<span>${esc(x)}</span>`).join('')}
function draftUiPoolTop(xs,scouted=false){return (xs||[]).map(x=>{const c=DRAFT_UI.state.db.patch.champions[x.champ];if(!c)return '';const v=scouted?`${x.range[0]}–${x.range[1]}`:`${x.mastery}`;return `${esc(championDisplayName(c))} ${v}`}).filter(Boolean).join(' · ')}
function draftUiAnalysisContent(){
  if(!DRAFT_UI?.selected)return '<div class="du-analysis-empty"><b>후보 분석</b><span>챔피언을 선택하면 현재 팀 기준 평가와 정보 출처를 표시합니다.</span></div>';
  const s=DRAFT_UI.state,turn=draftTurn(s),a=turn&&draftCandidateAnalysis(s,DRAFT_UI.playerSide,DRAFT_UI.selected),c=s.db.patch.champions[DRAFT_UI.selected];if(!a||!c)return '';
  const roles=a.roles.map(r=>ROLE_KO[r]||r).join(' · ')||'—',meta=a.metaEvidence||{};
  const metaBlock=`<div class="du-evidence-block"><div class="du-evidence-title"><b>메타 판단</b><span>신뢰 ${meta.confidence??'—'} · 평가 ${a.meta}</span></div><div class="du-source-chips">${draftUiEvidenceSources(meta.sources)}</div></div>`;
  if(a.kind==='B'){
    const targets=(a.opponentPool||[]).map(x=>`<div class="du-player-evidence"><div><b>${ROLE_KO[x.role]||x.role} · ${esc(x.player)}</b><span>정보 ${x.knowledge}% · 숙련 추정 ${x.selectedRange[0]}–${x.selectedRange[1]}</span></div><small>확인 챔프폭: ${draftUiPoolTop(x.top,true)||'표본 부족'}</small><div class="du-source-chips">${draftUiEvidenceSources(x.sources)}</div></div>`).join('');
    return `<div class="du-analysis-head"><div><b>${esc(championDisplayName(c))}</b><span>${esc(roles)}</span></div><small>밴 후보 · 숨은 역할/실제 숙련도는 사용하지 않음</small></div><div class="du-analysis-metrics"><div><span>메타 인식</span><b>${a.meta}</b></div><div><span>초반</span><b>${a.early}/10</b></div><div><span>중반</span><b>${a.mid}/10</b></div><div><span>후반</span><b>${a.late}/10</b></div></div><div class="du-evidence-grid">${metaBlock}<div class="du-evidence-block"><div class="du-evidence-title"><b>상대 챔피언 폭</b><span>공개 라인업 + 스카우팅</span></div>${targets||'<small>확인 가능한 상대 선수 정보가 없습니다.</small>'}</div></div>`;
  }
  const comp=a.compositionEvidence||{},roleRows=(a.roleFits||[]).map(x=>`<div class="du-player-evidence"><div><b>${ROLE_KO[x.role]||x.role} · ${esc(x.player||'—')}</b><span>숙련 ${x.mastery}${x.pool?.rank?` · 챔프폭 ${x.pool.rank}/${x.pool.total}`:' · 비주력'}</span></div><small>상위 챔프: ${draftUiPoolTop(x.pool?.top)||'기록 없음'}</small><small>상성 기준: ${x.matchups?.length?x.matchups.map(m=>esc(m.name)).join(' · '):'상대 픽 미공개'} · ${esc(x.matchupSource||'')}</small><div class="du-source-chips"><span>${esc(x.pool?.source||'팀 내부 데이터')}</span><span>조합 ${draftUiSigned(x.comp)}</span><span>상성 ${draftUiSigned(x.counter)}</span></div></div>`).join('');
  return `<div class="du-analysis-head"><div><b>${esc(championDisplayName(c))}</b><span>${esc(roles)}</span></div><small>우리 팀 기준 · 최종 포지션은 드래프트 종료 후 확정</small></div><div class="du-analysis-metrics"><div><span>메타 인식</span><b>${a.meta}</b></div><div><span>최고 숙련</span><b>${a.mastery}</b></div><div><span>조합 보정</span><b>${draftUiSigned(a.comp)}</b></div><div><span>상성 보정</span><b>${draftUiSigned(a.counter)}</b></div></div><div class="du-evidence-grid">${metaBlock}<div class="du-evidence-block"><div class="du-evidence-title"><b>조합 분석</b><span>${esc(comp.source||'')}</span></div><p>${(comp.reasons||[]).map(esc).join(' · ')}</p></div><div class="du-evidence-block du-evidence-wide"><div class="du-evidence-title"><b>선수 챔피언 폭 · 상성</b><span>팀 내부 데이터 + 상대 공개 픽</span></div><div class="du-player-grid">${roleRows}</div></div></div>`;
}
function draftUiAnalysisPanel(){return `<aside class="du-analysis" id="du-analysis">${draftUiAnalysisContent()}</aside>`}
function draftUiStaffAdvice(){
  if(!DRAFT_UI)return '';const a=draftStaffAdvice(DRAFT_UI.state,DRAFT_UI.playerSide);if(!a)return '';
  if(!a.available)return '<section class="du-advice"><div class="du-advice-head"><b>스태프 조언</b><span>전략 코치/분석가 없음</span></div><p>전문 스태프를 선임하면 현재 밴픽 후보에 대한 조언을 받을 수 있습니다.</p></section>';
  const staff=[a.strategic&&`전략 코치 ${esc(a.strategic.name)}`,a.analyst&&`분석가 ${esc(a.analyst.name)}`].filter(Boolean).join(' · ');
  const cards=a.suggestions.map((x,i)=>{const c=DRAFT_UI.state.db.patch.champions[x.champ],f=x.factors,why=a.kind==='P'?`메타 ${f.meta} · 숙련 ${f.mastery} · 조합 ${draftUiSigned(f.comp)} · 상성 ${draftUiSigned(f.counter)}`:`메타 ${f.meta}${f.revealed?' · 이번 시리즈 공개 정보 반영':''}`;return `<button data-du-advice="${x.champ}"><small>${i+1}순위 검토</small><b>${esc(championDisplayName(c))}</b><span>${why}</span></button>`}).join('');
  return `<section class="du-advice"><div class="du-advice-head"><b>스태프 조언</b><span>${staff} · 신뢰 ${a.confidence}</span></div><div class="du-advice-grid">${cards}</div><p>조언은 현재 공개 정보와 우리 팀 데이터만 사용하며 선택을 자동 실행하지 않습니다.</p></section>`;
}
function draftUiOpponentIntent(){
  if(!DRAFT_UI)return '';const rows=draftOpponentIntent(DRAFT_UI.state,DRAFT_UI.playerSide,3);if(!rows.length)return '';
  return `<section class="du-intent"><div class="du-intent-head"><b>상대 의도 추정</b><span>공개 밴픽 + 우리 상대 분석/스카우팅 기준</span></div><div class="du-intent-list">${rows.map(x=>{const c=DRAFT_UI.state.db.patch.champions[x.champ],roles=x.roles.map(r=>ROLE_KO[r]||r).join(' · '),ranges=x.observations.map(o=>(ROLE_KO[o.role]||o.role)+' 관찰 숙련 '+o.range.join('~')).join(' · ');return `<div class="du-intent-row"><div><small>${x.kind==='P'?'PICK':'BAN'} · 해석 신뢰 ${x.confidence}</small><b>${esc(championDisplayName(c))}</b><span>${esc(roles)}</span></div><p>${x.reasons.map(esc).join(' · ')}${ranges?'<br>'+esc(ranges):''}<br><small>${x.sources.map(esc).join(' · ')}</small></p></div>`}).join('')}</div><small class="du-intent-note">공개 역할 후보와 관찰 범위에 따른 추정입니다. 해석 신뢰는 분석 능력·정보량을 반영한 게임 지표이며 통계적 확률이나 실제 상대 의도는 아닙니다.</small></section>`;
}
function draftUiGrid(){
  const s=DRAFT_UI.state,rows=Object.values(s.db.patch.champions).filter(draftUiMatch).sort((a,b)=>championDisplayName(a).localeCompare(championDisplayName(b),'ko'));
  return `<div class="du-grid">${rows.map(c=>{const st=draftUiChampionState(c),sel=DRAFT_UI.selected===c.id;
    return `<button class="du-champ ${sel?'sel':''}" data-du-champ="${c.id}" aria-pressed="${sel}" aria-label="${esc(championDisplayName(c))} · ${esc(c.roles.map(r=>ROLE_KO[r]).join(' · '))}${st.reason?' · '+esc(st.reason):''}" ${st.disabled?'disabled':''} title="${esc(st.reason||c.roles.map(r=>ROLE_KO[r]).join(' · '))}">
      ${championPortraitMarkup(c,{className:'du-champ-img',alt:false})}<span class="du-champ-meta"><b>${esc(championDisplayName(c))}</b><small>${c.roles.map(r=>ROLE_KO[r]).join(' · ')}</small></span>${st.reason?`<em>${esc(st.reason)}</em>`:''}
    </button>`}).join('')}</div>`;
}
function draftUiRender(){
  if(!DRAFT_UI)return;const s=DRAFT_UI.state,turn=draftTurn(s),done=!turn;
  const phase=done?'드래프트 완료':`${turn.index+1} / ${DRAFT_ORDER.length} · ${turn.kind==='B'?'밴':'픽'} · ${esc(s.db.teams[s.teamIds[turn.side]].short)} 차례`;
  const mine=!done&&turn.side===DRAFT_UI.playerSide;
  const markup=`<div class="ovin du-wrap">
    <div class="ovhead"><div><b>${esc(DRAFT_UI.title)}</b><small class="du-phase" role="status" aria-live="polite">${phase}</small></div>${DRAFT_UI.locked?'':'<button class="ghost" id="du-close">닫기</button>'}</div>
    ${draftUiSeriesMeta()}<div class="du-board">${draftUiSidePanel(0)}<div class="du-center"><strong>${done?'완료':mine?'YOUR TURN':'AI'}</strong><span>${done?'10밴 · 10픽 완료':turn.kind==='B'?'BAN':'PICK'}</span></div>${draftUiSidePanel(1)}</div>
    ${done?`<section class="du-done"><h3>드래프트 완료</h3><p>${esc(DRAFT_UI.doneText||'단계형 밴픽 코어와 동일한 결과입니다.')}</p><button class="primary" id="du-finish">${esc(DRAFT_UI.finishLabel||(DRAFT_UI.onComplete?'드래프트 확정':'연습 종료'))}</button></section>`:
    `<section class="du-pool">
      <div class="du-tools"><input id="du-search" aria-label="챔피언 검색" type="search" autocomplete="off" placeholder="챔피언 검색" value="${esc(DRAFT_UI.query)}"><div class="chips">${DRAFT_UI_FILTERS.map(r=>`<button data-du-role="${r}" aria-pressed="${DRAFT_UI.filter===r}">${r==='ALL'?'전체':ROLE_KO[r]}</button>`).join('')}</div></div>
      <div class="du-mobile-tabs" role="group" aria-label="밴픽 정보">
        <button data-du-info="analysis" aria-controls="du-info-analysis" aria-pressed="${DRAFT_UI.infoTab==='analysis'}">후보 분석</button>
        <button data-du-info="advice" aria-controls="du-info-advice" aria-pressed="${DRAFT_UI.infoTab==='advice'}">스태프 조언</button>
        <button data-du-info="intent" aria-controls="du-info-intent" aria-pressed="${DRAFT_UI.infoTab==='intent'}">상대 의도</button>
      </div>
      <div class="du-info-panel ${DRAFT_UI.infoTab==='advice'?'active':''}" id="du-info-advice" data-du-panel="advice">${draftUiStaffAdvice()}</div>
      <div class="du-info-panel ${DRAFT_UI.infoTab==='intent'?'active':''}" id="du-info-intent" data-du-panel="intent">${draftUiOpponentIntent()}</div>
      <div class="du-info-panel ${DRAFT_UI.infoTab==='analysis'?'active':''}" id="du-info-analysis" data-du-panel="analysis">${draftUiAnalysisPanel()}</div>
      <div id="du-grid">${draftUiGrid()}</div>
      <div class="du-lock"><div><b>${mine?(DRAFT_UI.selected?esc(championLabel(s.db,DRAFT_UI.selected)):'챔피언을 선택하세요'):'상대 팀이 선택 중입니다'}</b><small>${mine?(turn.kind==='P'?'픽 단계에서는 포지션을 공개하지 않습니다. 드래프트 종료 후 합법적인 5포지션 배치를 확정합니다.':'선택 후 확정해야 밴됩니다.'):'AI는 공개된 챔피언과 가능한 포지션만 보고 판단합니다.'}</small></div><button class="primary" id="du-lock" ${mine&&DRAFT_UI.selected?'':'disabled'}>${turn.kind==='B'?'밴 확정':'픽 확정'}</button></div>
    </section>`}
  </div>`;
  refreshUiOverlay(markup,{focusSelector:done?'#du-finish':DRAFT_UI.locked?'#du-search':'#du-close'});
  draftUiBind();
}
function draftUiBind(){
  if(!DRAFT_UI)return;
  const close=$('#du-close');if(close)close.onclick=draftUiClose;
  const finish=$('#du-finish');if(finish)finish.onclick=()=>{const result=draftResult(DRAFT_UI.state),cb=DRAFT_UI.onComplete;if(cb){DRAFT_UI=null;closeUiOverlay({force:true,restoreFocus:false});cb(result)}else draftUiClose()};
  const search=$('#du-search');if(search)search.oninput=e=>{DRAFT_UI.query=e.target.value;const box=$('#du-grid');if(box)box.innerHTML=draftUiGrid();draftUiBindGrid()};
  document.querySelectorAll('[data-du-role]').forEach(b=>b.onclick=()=>{DRAFT_UI.filter=b.dataset.duRole;DRAFT_UI.selected=null;draftUiRender()});
  document.querySelectorAll('[data-du-info]').forEach(b=>b.onclick=()=>{DRAFT_UI.infoTab=b.dataset.duInfo;draftUiRender()});
  document.querySelectorAll('[data-du-advice]').forEach(b=>b.onclick=()=>{DRAFT_UI.selected=b.dataset.duAdvice;DRAFT_UI.infoTab='analysis';draftUiRender()});
  draftUiBindGrid();
  const lock=$('#du-lock');if(lock)lock.onclick=()=>draftUiLock();
}
function draftUiBindGrid(){
  document.querySelectorAll('[data-du-champ]').forEach(b=>b.onclick=()=>{DRAFT_UI.selected=b.dataset.duChamp;DRAFT_UI.infoTab='analysis';document.querySelectorAll('[data-du-champ]').forEach(x=>{x.classList.toggle('sel',x===b);x.setAttribute('aria-pressed',String(x===b))});document.querySelectorAll('[data-du-info]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.duInfo==='analysis')));document.querySelectorAll('.du-info-panel').forEach(x=>x.classList.toggle('active',x.dataset.duPanel==='analysis'));const lock=$('#du-lock');if(lock)lock.disabled=false;const name=lock?.previousElementSibling?.querySelector('b');if(name)name.textContent=championLabel(DRAFT_UI.state.db,DRAFT_UI.selected);const analysis=$('#du-analysis');if(analysis)analysis.innerHTML=draftUiAnalysisContent()});
}
function draftUiLock(){
  if(!DRAFT_UI||!DRAFT_UI.selected)return;const s=DRAFT_UI.state,turn=draftTurn(s);if(!turn||turn.side!==DRAFT_UI.playerSide)return;
  const choice={champ:DRAFT_UI.selected,side:turn.side,source:'player'};
  const valid=draftValidateChoice(s,choice);if(!valid.ok){DRAFT_UI.selected=null;draftUiRender();return}
  draftApplyChoice(s,choice);DRAFT_UI.selected=null;draftUiAdvanceAi();draftUiRender();
}
