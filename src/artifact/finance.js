// ===== LOL GM: Club finance / economy domain (unit: 100M KRW) =====
const money=v=>(Math.round(v*10)/10).toFixed(1)+'억';
function psOf(db,rid){const R=db.regions[rid];return R?(R.payScale??.5):.5}
function psTeam(db,t){return psOf(db,t.region)*((t.division||1)===2?0.35:1)}

function initFinance(db,t,rng){
  const ps=psTeam(db,t);
  t.owner=t.owner||{wealth:Math.round(clamp(rng.normal(55,18),10,95))};
  t.facility=t.facility||clamp(Math.round(1+t.owner.wealth/30),1,4);ensureFacilities(t);
  t.finance=t.finance||{cash:Math.round((25+rng.range(0,35))*ps*10)/10,history:[],buyout:0};
}
// Prepaid transfer fees, signing bonuses and board infrastructure investments
// have already affected cash. Recording them again at close would double charge.
const FINANCE_PREPAID_KEYS=['facilityInvestment','signingBonus','transferPaid','transferReceived','staffSeverance'];
function financePrepaid(t){if(!t.finance)throw new Error('구단 재정 정보가 없습니다');const f=t.finance;f.prepaid=f.prepaid||{};return f.prepaid}
function recordFinancePrepaid(t,key,amount){
  if(!FINANCE_PREPAID_KEYS.includes(key)||!Number.isFinite(amount)||amount<0)throw new Error('잘못된 선지급 재정 항목');
  const p=financePrepaid(t);p[key]=Math.round(((p[key]||0)+amount)*10)/10;
}
function sumFinanceRows(rows){return Object.values(rows).reduce((a,v)=>a+v,0)}
function financeSeasonWins(db,t){
  const w=db.world;if(!w?.seasons)return 0;
  return Object.values(w.seasons).reduce((n,s)=>{
    if(!s.stageData?.regular)return n;
    const standing=standings(db,s,'regular').find(x=>x.tid===t.id);
    return n+(standing?.w||0);
  },0);
}
// Conservative same-year budget outlook; no speculative prizes or future wins.
// Prepaid activity is shown in P&L but not removed from cash a second time.
function financeForecast(db,t){
  const R=db.regions[t.region],ps=psTeam(db,t),last=(R.metrics||[]).slice(-1)[0],hype=last?last.hype:45;
  const sponsor=t.sponsor?.until>=db.year?t.sponsor:null,pre=t.finance?.prepaid||{};
  const rev={league:hype*.25*ps,sponsor:sponsor?sponsor.base+(sponsor.perWin||0)*financeSeasonWins(db,t):(t.fans||30)*.35*ps,
    merch:(t.fans||30)*.1*ps,owner:ownerSupport(db,t),transfer:pre.transferReceived||0};
  const exp={salary:payroll(db,t),staff:staffCost(db,t),ops:opsCost(db,t),facility:facilityUpkeep(db,t),
    tax:spendingTax(db,t),buyout:t.finance?.buyout||0,
    facilityInvestment:pre.facilityInvestment||0,signingBonus:pre.signingBonus||0,
    transfer:pre.transferPaid||0,staffSeverance:pre.staffSeverance||0};
  const prepaidIn=pre.transferReceived||0,prepaidOut=(pre.facilityInvestment||0)+(pre.signingBonus||0)+(pre.transferPaid||0)+(pre.staffSeverance||0);
  const revenue=sumFinanceRows(rev),expense=sumFinanceRows(exp);
  return {rev,exp,revenue,expense,net:revenue-expense,
    // The current cash balance already includes prepaid receipts/payments.
    closingCash:(t.finance?.cash||0)+(revenue-prepaidIn)-(expense-prepaidOut),
    unknown:['국내·국제 상금','추가 성과급','미확정 이적료','향후 스폰서 승리 수당','사치세 재분배']};
}
function staffCost(db,t){const specialists=teamStaffMembers(t).reduce((sum,s)=>sum+staffSalary(s,1),0);return (2+specialists)*psTeam(db,t)}
function opsCost(db,t){return 8*psTeam(db,t)}
function ownerSupport(db,t){if(t.parent)return 4*psOf(db,t.region);return t.owner.wealth/100*(['win-now','superstar'].includes(t.philosophy)?12:6)*psTeam(db,t)}
function estRevenue(db,t){
  const R=db.regions[t.region], ps=psTeam(db,t), m=(R.metrics||[]).slice(-1)[0], hype=m?m.hype:45;
  return hype*0.25*ps+(t.fans||30)*0.45*ps+ownerSupport(db,t);
}
function salaryBudget(db,t){
  const b=estRevenue(db,t)*0.95+Math.max(0,t.finance.cash)*0.3-staffCost(db,t)-opsCost(db,t);
  return b*(['win-now','superstar'].includes(t.philosophy)?1.15:t.philosophy==='cost'?0.85:1);
}

// 한 해 결산: 중계권 분배, 스폰서, 굿즈, 상금, 구단주 지원 − 연봉, 스태프, 운영비, 사치세
function closeFinances(db,w,rng,ev){
  const prize={};
  for(const s of Object.values(w.seasons)){ if(!s.done)continue;
    const c=db.competitions[s.comp], ps=c.international?1:psOf(db,c.region);
    const pool=c.international?(c.id==='WORLDS'?45:c.tier==='low'?5:18):9*ps;
    const wts=c.teams.map(t=>[t,1+elimReach(db,s,t)*3]), sum=wts.reduce((a,x)=>a+x[1],0);
    wts.forEach(([t,x])=>prize[t]=(prize[t]||0)+pool*x/sum);
  }
  const taxPool={};
  const recs=activeTeams(db).map(t=>{
    const R=db.regions[t.region], ps=psTeam(db,t), m=(R.metrics||[]).slice(-1)[0], hype=m?m.hype:45;
    const wins=Object.values(w.seasons).reduce((a,s)=>{const r=(s.stageData.regular&&standings(db,s,'regular').find(x=>x.tid===t.id));return a+(r?r.w:0)},0);
    const sp=t.sponsor&&t.sponsor.until>=w.year?t.sponsor:null;
    const pre=t.finance.prepaid||{};
    const rev={league:hype*0.25*ps,sponsor:sp?sp.base+(sp.perWin||0)*wins:(t.fans||30)*0.35*ps,merch:(t.fans||30)*0.1*ps,prize:prize[t.id]||0,owner:ownerSupport(db,t),transfer:pre.transferReceived||0};
    const pay=payroll(db,t),regulated=regulatedPayroll(db,t);
    const exp={salary:pay,bonuses:contractBonusCost(db,t,w.year),staff:staffCost(db,t),ops:opsCost(db,t),facility:facilityUpkeep(db,t),buyout:t.finance.buyout||0,tax:spendingTax(db,t),facilityInvestment:pre.facilityInvestment||0,signingBonus:pre.signingBonus||0,transfer:pre.transferPaid||0,staffSeverance:pre.staffSeverance||0};
    if(exp.tax>0)taxPool[R.id]=(taxPool[R.id]||0)+exp.tax*(R.sfrTeamShare??1)
    const prepaidIn=pre.transferReceived||0,prepaidOut=(pre.facilityInvestment||0)+(pre.signingBonus||0)+(pre.transferPaid||0)+(pre.staffSeverance||0);
    return {t,R,rev,exp,prepaidIn,prepaidOut};
  });
  for(const r of recs){
    if(taxPool[r.R.id]){const under=recs.filter(x=>x.R===r.R&&x.R.spendingRule==='sfr_top5'&&x.exp.tax===0&&regulatedPayroll(db,x.t)>=(x.R.salaryFloor||0)&&regulatedPayroll(db,x.t)<=(x.R.salaryCap||Infinity)&&(x.t.division||1)===1);if(under.includes(r))r.rev.tax=taxPool[r.R.id]/under.length}
    const inc=sumFinanceRows(r.rev),out=sumFinanceRows(r.exp);
    const f=r.t.finance;f.buyout=0;f.prepaid={};f.cash=Math.round((f.cash+inc-out-r.prepaidIn+r.prepaidOut)*10)/10;
    const round=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,Math.round(v*10)/10]));
    f.history=[...f.history,{year:w.year,rev:round(r.rev),exp:round(r.exp),net:Math.round((inc-out)*10)/10,cash:f.cash}].slice(-10);
    if(r.exp.tax>0)ev(`${r.t.name} 균형지출 부담금 ${money(r.exp.tax)} 납부 (상위 5인 기준 ${money(regulatedPayroll(db,r.t))}, 기준선 ${money(r.R.salaryCap)})`);
    // 누적 적자 → 구단 매각 (새 구단주가 자금 투입, 리그 팀 수는 유지)
    if(r.t.parent){const pt=db.teams[r.t.parent];if(pt&&f.cash<0){pt.finance.cash=Math.round((pt.finance.cash+f.cash)*10)/10;f.cash=0}continue} // 2군 적자는 모구단이 부담
    const recentLosses=f.history.slice(-2).filter(x=>x.net<0).length;
    if(f.cash<-12*psTeam(db,r.t)&&recentLosses>=2){
      const old=r.t.name,on=orgName(db,rng);r.t.name=on.name;r.t.formerNames=[...(r.t.formerNames||[]),old];
      r.t.owner={wealth:Math.round(clamp(rng.normal(65,15),30,95))};f.cash=Math.round(25*psTeam(db,r.t)*10)/10;r.t.fans=Math.round((r.t.fans||30)*.88);
      ev(`장기 재정난으로 구단 매각: ${old} → ${r.t.name} (연속 적자, 신규 구단주 자금 투입)`);
    }
  }
}

// 계약 만료 · 재계약 · FA 시장

function mSponsor(db,id){const t=myT(db),o=(db.world.sponsorOffers||[]).find(x=>x.id===id);if(!o)return '';t.sponsor={...o,until:db.year+o.years-1};return `${o.name} ${o.type} 스폰서 계약 (${o.years}년)`}
