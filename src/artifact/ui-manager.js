// ===== LOL GM: Finance / Monte Carlo manager UI =====
function releaseObligationsPanel(releases,title){
  if(!releases?.amount)return '';
  return `<details class="cfgcard release-settlements"><summary>${esc(title)} · ${money(releases.amount)}</summary>
    <p class="hint">연봉·잔여 연수·보상 비율은 방출 당시 계약 기준입니다.</p>
    ${releases.items.map(row=>`<div class="cfgcard"><b>${esc(row.staffName||row.playerName||row.sid||row.pid)}</b>
      <p>${money(row.amount)} · ${esc(row.date||String(row.year))}</p>
      <p class="hint">연봉 ${money(row.salary)} · 잔여 ${row.remainingYears}년 · 보상 ${Math.round(row.guaranteeRate*100)}%</p></div>`).join('')}
    ${releases.unattributedAmount>0?`<p class="hint">기존 기록의 상세 미기록 채무 ${money(releases.unattributedAmount)}</p>`:''}
  </details>`;
}
function financePanel(t){
  const f=t.finance; if(!f)return '';
  if(t.active===false&&f.closureSettlement){
    const closure=f.closureSettlement,recovery=f.estateRecovery;
    return `<section><h3>해체 구단 계약 정산 · ${esc(t.name)}</h3>
      <div class="fin"><div><span>계약 보상 청구</span><b>${money(closure.amount)}</b></div>
      <div><span>지급 완료</span><b>${money(closure.paidAmount+(recovery?.paidAmount||0))}</b></div>
      <div><span>미지급</span><b>${money(f.buyout)}</b></div></div>
      <p class="hint">${esc(closure.date||String(closure.year))} 해체 시 가용 현금을 청구액 비율로 배분했습니다. 미지급 채무는 기록에 보존되며 다음 시즌 운영비로 중복 청구하지 않습니다.</p>
      ${(closure.funding?.transfers||[]).map(row=>`<p>${row.kind==='cash_recovery'?
        row.toId===t.id?'2군 잔여 자금 회수':'모구단에 잔여 자금 반환':
        row.toId===t.id?'모구단 정산 지원':'소유 2군 정산 지원'} ${money(row.amount)}</p>`).join('')}
      ${transferDealRows(t).length?transferPaymentsPanel(t):''}
      ${recovery?.distributions?`<details class="cfgcard"><summary>해체 후 추가 지급 · ${money(recovery.paidAmount)}</summary>
        ${recovery.history.map(row=>`<p>${esc(row.date)} · ${money(row.paidAmount)} 지급</p>`).join('')}</details>`:''}
  ${releaseObligationsPanel(financeReleaseObligations(t),'해체 구단 미지급 보상')}
      <details class="cfgcard release-settlements"><summary>해체 당시 ${closure.items.some(r=>r.claimantKind==='staff')?'선수·스태프별 지급 내역':'선수별 지급 내역'}</summary>
      ${closure.items.map(row=>`<div class="cfgcard"><b>${esc(row.staffName||row.playerName||row.sid||row.pid)}</b>
        <p>청구 ${money(row.amount)} · 지급 ${money(row.paidAmount)} · 미지급 ${money(row.unpaidAmount)}</p></div>`).join('')}
      ${closure.unattributedAmount?`<p class="hint">상세 미기록 청구 ${money(closure.unattributedAmount)} · 지급 ${money(closure.unattributedPaid)} · 미지급 ${money(closure.unattributedUnpaid)}</p>`:''}
      </details></section>`;
  }
  const R=DB.regions[t.region], last=f.history.slice(-1)[0], pay=payroll(DB,t), outlook=financeForecast(DB,t);
  const RK={league:'중계권 분배',sponsor:'스폰서',merch:'굿즈',prize:'상금',owner:'구단주 지원',tax:'사치세 분배',transfer:'이적료 수입',sponsorMilestone:'스폰서 목표 달성',academyFunding:'모구단 지원금'}, EK={salary:'연봉',loanWages:'임대 급여 분담',loanConversion:'계약 소유권 급여 정산',staff:'코칭 스태프',ops:'운영비',facility:'훈련 시설',floor:'플로어 부담금',buyout:'선수 방출 비용',tax:'사치세',facilityInvestment:'시설 증설비',signingBonus:'계약금',transfer:'이적료 지출',staffSeverance:'스태프 해지금',travel:'해외 대회 출장비',interest:'재정 부족 부담금',scouting:'스카우팅 비용',academySupport:'2군 운영 지원'};
  return `<section><h3>재정</h3><div class="fin">
    <div><span>보유 자금</span><b class="${f.cash<0?'neg':''}">${money(f.cash)}</b></div>
    <div><span>연봉 총액</span><b>${money(pay)}</b><small>${R.spendingRule==='sfr_top5'?`SFR 상위 5인 ${money(regulatedPayroll(DB,t))} · 기준 ${money(R.salaryCap)}${R.salaryCap?' · '+Math.round(regulatedPayroll(DB,t)/R.salaryCap*100)+'% 사용':''}${regulatedPayroll(DB,t)>R.salaryCap?' 초과':''}`:'구단 자체 예산'}</small></div>
    <div><span>영입 예산</span><b>${money(Math.max(0,salaryBudget(DB,t)-pay))}</b></div>
    <div><span>구단주 재력</span><b>${t.owner?t.owner.wealth:'—'}</b></div>
    <div><span>운영 여유</span><b>${outlook.runway.months}개월</b><small>${({stable:'안정',watch:'유의',strained:'긴축',critical:'위기'})[outlook.runway.severity]}</small></div>
    <div><span>예상 수입</span><b>${money(outlook.revenue)}</b></div>
    <div><span>예상 지출</span><b>${money(outlook.expense)}</b></div>
    <div><span>예상 손익</span><b class="${outlook.net<0?'neg':''}">${money(outlook.net)}</b></div>
    <div><span>예상 결산 현금</span><b class="${outlook.closingCash<0?'neg':''}">${money(outlook.closingCash)}</b></div>
  </div><div class="rgrid"><div><h4>예상 수입 내역</h4>${Object.entries(outlook.rev).filter(([,v])=>v>0).map(([k,v])=>`<div class="arow"><span>${RK[k]||k}</span><b>${money(v)}</b></div>`).join('')}</div><div><h4>예상 지출 내역</h4>${Object.entries(outlook.exp).filter(([,v])=>v>0).map(([k,v])=>`<div class="arow"><span>${EK[k]||k}</span><b>${money(v)}</b></div>`).join('')}</div></div>
  <p class="hint">현재 시즌 출전·팬덤·지역 흥행·스폰서 조건을 기준으로 한 추정치입니다. 확정되지 않은 상금·추가 승리 수당·성과급·스폰서 목표 보너스·향후 거래·지출부담금 재분배는 미포함입니다. 이미 지급한 비용은 중복 차감하지 않습니다.</p>
  ${outlook.closingCash<0?'<p class="warn">예상 결산 현금이 적자입니다. 추가 지출에 주의하세요.</p>':''}
  ${releaseObligationsPanel(financeReleaseObligations(t),'결산 예정 선수 방출 보상')}
  ${releaseObligationsPanel(last?.releaseSettlement,'지난 결산 선수 방출 보상')}
  ${f.closureSupportHistory?.length?`<details class="cfgcard release-settlements"><summary>2군 종료 정산 지원 내역</summary>
    <p class="hint">이미 현금에 반영된 내부 지원금입니다. 다음 결산에서 다시 차감하지 않습니다.</p>
    ${f.closureSupportHistory.map(row=>`<p>${esc(row.date||String(row.year))} · ${esc(DB.teams[row.toId]?.name||row.toId)} · ${money(row.amount)}</p>`).join('')}</details>`:''}
  ${f.closureCashRecoveryHistory?.length?`<details class="cfgcard release-settlements"><summary>2군 종료 잔여 자금 회수</summary>
    <p class="hint">2군의 선수 보상 채무를 보호한 뒤 반환받은 현금입니다. 다음 결산 수입으로 중복 반영하지 않습니다.</p>
    ${f.closureCashRecoveryHistory.map(row=>`<p>${esc(row.date||String(row.year))} · ${esc(DB.teams[row.fromId]?.name||row.fromId)} · ${money(row.amount)}</p>`).join('')}</details>`:''}
  ${last?.capital?`<p class="hint">${last.year}년 구단 매각/외부 자본 투입: ${money(last.capital.newOwner||0)} (영업손익과 구분)</p>`:''}
  ${last?`<div class="rgrid"><div><h4>${last.year} 수입 ${money(Object.values(last.rev).reduce((a,b)=>a+b,0))}</h4>${Object.entries(last.rev).filter(([,v])=>v).map(([k,v])=>`<div class="arow"><span>${RK[k]||k}</span><span class="num">${money(v)}</span></div>`).join('')}</div>
  <div><h4>${last.year} 지출 ${money(Object.values(last.exp).reduce((a,b)=>a+b,0))}</h4>${Object.entries(last.exp).filter(([,v])=>v).map(([k,v])=>`<div class="arow"><span>${EK[k]||k}</span><span class="num">${money(v)}</span></div>`).join('')}<div class="arow"><span><b>순이익</b></span><span class="num ${last.net<0?'lo':'hi'}"><b>${money(last.net)}</b></span></div></div></div>`:'<p class="hint">첫 시즌이 끝나면 결산이 나옵니다.</p>'}</section>`;
}
function financeTable(rid){
  const ts=activeTeams(DB,rid).sort((a,b)=>b.finance.cash-a.finance.cash);
  return `<div class="scroll"><table><thead><tr><th>구단</th><th>팬덤</th><th>보유 자금</th><th>연봉 총액</th><th>지난 시즌 순이익</th></tr></thead><tbody>
  ${ts.map(t=>{const l=t.finance.history.slice(-1)[0];return `<tr class="${t.id===managedTeamId(DB)?'mine':''}"><td><b>${esc(t.name)}</b></td><td class="num">${t.fans??'—'}</td><td class="num">${money(t.finance.cash)}</td><td class="num">${money(payroll(DB,t))}</td><td class="num ${l&&l.net<0?'lo':''}">${l?money(l.net):'—'}</td></tr>`}).join('')}
  </tbody></table></div>`;
}
