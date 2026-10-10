function freeAgencyUiAllowed(){const t=managedTeam(DB);return !!(t&&t.active!==false&&!t.parent&&DB.world?.manage==='manual'&&!DB.world.fired&&!DB.world.pendingOfficial?.queue?.length)}
// 현재 구단이 가진 합의된 정산 날짜만 읽는다. 상대 구단의 비공개 재정은 표시하지 않는다.
function renderFreeAgencyDays(){
 const state=freeAgencyDayState(DB),team=managedTeam(DB),manual=team&&team.active!==false&&!team.parent&&DB.world.manage==='manual'&&!DB.world.fired;
 const dates=Array.from(new Set(transferDealRows(team).flatMap(d=>d.rows.filter(r=>r.kind==='installment'&&['pending','earned'].includes(r.status)&&freeAgencyDateValid(r.date)).map(r=>r.date)))).sort();
 return `<div class="controls"><button type="button" class="primary" data-stove-day${state.ready&&manual&&freeAgencyUiAllowed()?'':' disabled'}>하루 진행${state.ready?' · '+esc(state.next):''}</button><button type="button" class="linklike" data-stove-market>협상 확인</button></div><p class="hint">${esc(state.reason||'합의된 정산과 등록 자격의 날짜 소비를 처리합니다. 제안 제출과 연간 결산은 직접 선택합니다.')}</p>${state.through?`<p>기존 연간 결산 기준 ${esc(state.through)}</p>`:''}<details><summary>합의된 이적료 일정</summary>${dates.length?dates.map(d=>`<p>${esc(d)}</p>`).join(''):'<p>현재 구단의 미정산 분할금 날짜가 없습니다.</p>'}<p class="hint">실제 합의 기록의 날짜입니다. 날짜가 지나도 지급 상태와 현금에 따라 미정산일 수 있습니다.</p></details>`;
}
function freeAgencyUiStamp(db){return JSON.stringify([db.worldDate,db.year,db.world?.contractWindow,db.world?.negotiations,Object.values(db.teams).map(t=>[t.id,t.finance?.transferDeals,t.finance?.cash]),Object.values(db.players).map(p=>[p.id,p.team,p.localEligibility])])}
