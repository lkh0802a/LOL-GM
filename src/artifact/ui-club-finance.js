// Owned finance views use private copies; finance.js remains the sole sponsor writer.
function clubFinanceModel(db=DB,tid=managedTeamId(db)){
  const ctx=clubBriefContext(db),t=db?.teams?.[tid];
  if(!ctx||t?.active===false||!t?.finance||!managerControlsSquad(db,t))return null;
  const read=JSON.parse(JSON.stringify(db)),team=read.teams[tid],forecast=financeForecast(read,team),prepaid=financePrepaidSettlement(team),releases=financeReleaseObligations(team),transfer=transferPaymentExposure(team);
  return {read,team,forecast,prepaid,releases,transfer,committed:financeCommittedTransferCash(read,team),payroll:payroll(read,team),offers:tid===ctx.t.id&&!team.parent?(read.world.sponsorOffers||[]):[]};
}
function clubFinanceStamp(db){const t=managedTeam(db);return JSON.stringify([db.year,db.worldDate,db.world.phase,db.world.manage,db.world.sponsorOffers,t?.sponsor,t?.finance,t?.parent]);}
function sponsorUiCurrent(db,w,slot,render,tid,date,stamp){return DB===db&&db.world===w&&SLOT===slot&&UI_RENDER_ID===render&&managedTeamId(db)===tid&&!SLOT_SWITCHING&&!w.fired&&w.manage==='manual'&&!['pick','initial_roster'].includes(w.phase)&&managedTeam(db)?.active!==false&&!managedTeam(db)?.parent&&db.worldDate===date&&clubFinanceStamp(db)===stamp;}
function bindSponsorControls(act,allowed=()=>true,root=document){
  const buttons=[...root.querySelectorAll('[data-spon]')];if(!buttons.length)return;
  const db=DB,w=db.world,slot=SLOT,render=UI_RENDER_ID,tid=managedTeamId(db),date=db.worldDate,stamp=clubFinanceStamp(db),view=VIEW,overlay=UI_OVERLAY;
  buttons.forEach(b=>b.onclick=()=>{
    if(VIEW!==view||UI_OVERLAY!==overlay||!allowed()||!sponsorUiCurrent(db,w,slot,render,tid,date,stamp))return;
    const t=managedTeam(db),o=w.sponsorOffers?.find(x=>x.id===b.dataset.spon);
    if(t.sponsor?.until>=db.year){act('기존 스폰서 계약 기간이 남아 있습니다');return;}
    if(!o){act('제안이 만료되었습니다');return;}
    const before=t.sponsor;const msg=mSponsor(db,o.id);
    act(msg,t.sponsor!==before);
  });
}
function clubSponsorProjection(m,id){
  if(m.team.parent||m.team.id!==managedTeamId(m.read)||m.team.sponsor?.until>=m.read.year||!m.offers.some(o=>o.id===id))return null;
  const read=JSON.parse(JSON.stringify(m.read)),team=read.teams[m.team.id],before=team.sponsor;mSponsor(read,id);
  return team.sponsor!==before?{cash:team.finance.cash,forecast:financeForecast(read,team)}:null;
}
function clubSponsorTerms(m){
  const t=m.team,cur=t.sponsor?.until>=m.read.year?t.sponsor:null;
  const terms=o=>`기본 연간 ${money(o.base)}${o.perWin?' · 국내 1승당 '+money(o.perWin):''}${o.milestone?' · '+esc(sponsorGoalLabel(o.milestone))+' 달성 시 '+money(o.milestoneBonus):''}`;
  return `<h4>실제 후원 계약·현재 제안</h4>${cur?`<p>${esc(cur.name)} · ${esc(cur.type)} · ${terms(cur)} · ${cur.until}년까지</p>`:m.offers.length?m.offers.map(o=>{const projection=clubSponsorProjection(m,o.id);return `<div class="cfgcard"><b>${esc(o.name)} · ${esc(o.type)}</b><p>${terms(o)} · ${o.years}년</p><p class="hint">기존 모형의 예상 연간 ${money(sponsorExpectedValue(m.read,t,o))} · 성과를 보장하거나 현재 현금으로 지급한 값이 아닙니다.</p>${projection?`<p>선택 가정 · 현재 현금 ${money(projection.cash)} (변경 없음) · 예상 연간 수입 ${money(m.forecast.revenue)} → ${money(projection.forecast.revenue)} · 예상 결산 현금 ${money(m.forecast.closingCash)} → ${money(projection.forecast.closingCash)}</p>`:'<p>선택 가정의 근거를 확인할 수 없습니다.</p>'}<button data-spon="${esc(o.id)}"${m.read.world.manage!=='manual'?' disabled':''}>이 조건으로 계약</button></div>`;}).join(''):'<p class="hint">현재 저장된 후원 제안이 없습니다. 새 제안을 임의로 생성하지 않습니다.</p>'}<p class="hint">계약 체결은 현재 현금을 늘리지 않습니다. 기본액·이미 기록된 국내 승수는 기존 연간 결산 소비자에 반영되고 목표 달성 수당은 결산 시 실제 조건을 검사합니다. 제안에 개별 만료일·발행 구단 기록이 없으므로 이를 발명하지 않습니다.</p>`;
}
function clubFinanceSummary(m){
  const rows=[['현재 현금',m.team.finance.cash],['기록된 미지급 방출 보상',m.releases.amount],['확정 이적·의무 구매 예약액',m.committed],['미달성 이적 추가금 최대',m.transfer.contingent],['이미 현금에 반영된 지출',m.prepaid.expense],['이미 현금에 반영된 이적 수입',m.prepaid.income],['현재 연봉 연간 합계',m.payroll],['조건부 예상 결산 현금',m.forecast.closingCash]];
  return `<div class="fin">${rows.map(([k,v])=>`<div><span>${k}</span><b>${Number.isFinite(v)?money(v):'기록 확인 필요'}</b></div>`).join('')}</div><p class="hint">모든 금액은 가상 게임의 억 단위입니다. 현재 현금·확정 채무·조건부 예상은 합산 잔액으로 혼동하지 않습니다. 연봉은 연간 기준이며 즉시 일시 지급 채무가 아닙니다. 예상 결산은 현재 현금 + 예상 수입 − 예상 지출 − 이미 반영된 이적 수입 + 이미 반영된 지출입니다. 선지급 금액은 결산에서 중복 차감하지 않습니다. 예상 결산은 미확정 상금·향후 승리·성과급·거래·재분배를 보장하지 않습니다.</p>`;
}
function renderClubFinanceBriefing(){
  const m=clubFinanceModel();if(!m)return '';
  return `<div id="club-finance" class="cfgcard"><h4 tabindex="-1">현금 · 의무 · 후원</h4>${clubFinanceSummary(m)}<div class="controls"><button data-brief-finance="${esc(m.team.id)}">재정 근거·후원 확인</button>${clubBriefContext().teams.filter(id=>id!==m.team.id).map(id=>`<button data-brief-finance="${esc(id)}">${esc(DB.teams[id].name)} 재정 확인</button>`).join('')}</div></div>`;
}
function openClubFinance(tid){
  const ctx=clubBriefContext(),m=clubFinanceModel(DB,tid);if(!m||UI_OVERLAY)return false;
  const db=DB,w=db.world,slot=SLOT,render=UI_RENDER_ID,date=db.worldDate,stamp=clubFinanceStamp(db),root=document.querySelector('#overlay');let dialog=null;
  const current=()=>clubBriefCurrent(db,w,slot,render,ctx.t.id)&&UI_OVERLAY===dialog&&db.worldDate===date&&clubFinanceStamp(db)===stamp&&managerControlsSquad(db,db.teams[tid]);
  const close=()=>{if(UI_OVERLAY===dialog)closeUiOverlay();};
  openUiOverlay({kind:'club-finance',label:'구단 재정 근거·후원',dismissible:true,onDismiss:close,focusSelector:'#brief-finance-close',html:`<div class="ovin"><div class="ovhead"><b>${esc(m.team.name)} 재정 근거·후원</b><button id="brief-finance-close" class="ghost">브리핑으로 돌아가기</button></div>${clubFinanceSummary(m)}${financePanel(m.team,m.read)}${transferPaymentsPanel(m.team,m.read)}${tid===ctx.t.id&&!m.team.parent?clubSponsorTerms(m):'<p class="hint">소유 2군 재정은 확인할 수 있지만 이 화면에서 모구단 후원 계약을 대신 체결하지 않습니다.</p>'}</div>`});dialog=UI_OVERLAY;
  root.querySelector('#brief-finance-close').onclick=close;
  bindSponsorControls((msg,changed)=>{clubBriefState().message=String(msg);MSG=String(msg);if(changed)saveDB();closeUiOverlay({restoreFocus:false});navKeepScroll();document.querySelector('#club-finance h4')?.focus?.({preventScroll:true});},current,root);
  return true;
}
function bindClubFinanceBriefing(){
  const ctx=clubBriefContext();if(!ctx)return;const db=DB,w=ctx.w,slot=SLOT,render=UI_RENDER_ID,date=db.worldDate;
  document.querySelectorAll('[data-brief-finance]').forEach(b=>b.onclick=()=>{if(clubBriefCurrent(db,w,slot,render,ctx.t.id)&&db.worldDate===date&&!UI_OVERLAY)openClubFinance(b.dataset.briefFinance);});
}
