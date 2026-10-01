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
const FINANCE_PREPAID_KEYS=['facilityInvestment','signingBonus','transferPaid','transferReceived','staffSeverance','scoutingExpense','medicalReplacementWage'];
function financePrepaid(t){if(!t.finance)throw new Error('구단 재정 정보가 없습니다');const f=t.finance;f.prepaid=f.prepaid||{};return f.prepaid}
function recordFinancePrepaid(t,key,amount){
  if(!FINANCE_PREPAID_KEYS.includes(key)||!Number.isFinite(amount)||amount<0)throw new Error('잘못된 선지급 재정 항목');
  const p=financePrepaid(t),digits=key==='medicalReplacementWage'?1000:10;
  p[key]=Math.round(((p[key]||0)+amount)*digits)/digits;
}
function payFinancePrepaid(t,key,amount){
  if(!FINANCE_PREPAID_KEYS.includes(key)||key==='transferReceived'||!Number.isFinite(amount)||amount<0)
    throw new Error('잘못된 선지급 지출 항목');
  if(!t?.finance)throw new Error('구단 재정 정보가 없습니다');
  t.finance.cash=Math.round((t.finance.cash-amount)*10)/10;
  recordFinancePrepaid(t,key,amount);
}
function receiveFinancePrepaidTransfer(t,amount){
  if(!Number.isFinite(amount)||amount<0)throw new Error('잘못된 이적료 수입');
  if(!t?.finance)throw new Error('구단 재정 정보가 없습니다');
  t.finance.cash=Math.round((t.finance.cash+amount)*10)/10;
  recordFinancePrepaid(t,'transferReceived',amount);
}
function payMedicalReplacementWage(t,amount){
  if(!Number.isFinite(amount)||amount<0)throw new Error('잘못된 의료 대체 급여');
  if(!t?.finance)throw new Error('구단 재정 정보가 없습니다');
  t.finance.cash=Math.round((t.finance.cash-amount)*1000)/1000;
  recordFinancePrepaid(t,'medicalReplacementWage',amount);
}
// Release liability is accrued for season closeout, not paid from cash twice.
function recordContractReleaseObligation(t,amount){
  if(amount)t.finance.buyout=(t.finance.buyout||0)+amount;
}
function payroll(db,t){return t.roster.reduce((a,id)=>{const c=db.players[id]?.contract;return a+(c&&!c.medicalReplacement?c.salary:0)},0)}
function topFivePayroll(db,t){const top=[];for(const id of t.roster){const p=db.players[id];if(!p||!p.contract||p.contract.medicalReplacement)continue;const s=p.contract.salary;let i=0;while(i<top.length&&top[i]>=s)i++;top.splice(i,0,s);if(top.length>5)top.pop()}return top.reduce((a,b)=>a+b,0)}
function regulatedPayroll(db,t){const R=db.regions[t.region];return R&&R.spendingRule==='sfr_top5'?topFivePayroll(db,t):payroll(db,t)}
function spendingTaxForPayroll(db,t,spend){
  const R=db.regions[t.region];if(!R||R.spendingRule!=='sfr_top5'||!R.salaryCap||(t.division||1)!==1)return 0;
  const over=Math.max(0,spend-R.salaryCap);if(!over)return 0;
  if(R.sfrMode==='lec_50_100'){const first=Math.min(over,R.salaryCap*.5),rest=Math.max(0,over-first);return first*.5+rest}
  const a=Math.min(over,R.salaryCap*.1),b=Math.min(Math.max(0,over-a),R.salaryCap*.15),c=Math.max(0,over-a-b);
  return a*.25+b*.5+c*(R.luxuryTax||1);
}
function spendingTax(db,t){return spendingTaxForPayroll(db,t,regulatedPayroll(db,t))}
function sumFinanceRows(rows){return Object.values(rows).reduce((a,v)=>a+v,0)}
function financeSeasonWins(db,t,w=db.world){if(!w?.seasons)return 0;
  return Object.values(w.seasons).reduce((n,s)=>{
    if(!s.stageData?.regular||db.competitions[s.comp]?.international||s.region!==t.region)return n;
    const standing=standings(db,s,'regular').find(x=>x.tid===t.id);
    return n+(standing?.w||0);
  },0);
}
// One commercial forecast and annual settlement policy, shared by AI and human clubs.
function financeExposure(db,t){
  const hype=db.regions[t.region]?.metrics?.at(-1)?.hype??45;
  const fans=clamp(t.fans??30,3,100),starCount=(t.roster||[]).filter(id=>
    db.players[id]&&(db.players[id].reputation||0)>=78).length;
  return {hype,fans,stars:Math.min(5,starCount),
    broadcast:clamp(.85+(fans-35)/230,.72,1.19),
    merchandising:clamp(.85+starCount*.07+(fans-35)/350,.74,1.26)};
}
function financeCommercialIncome(db,t,w=db.world,forecast=false,prize=0){
  const exposure=financeExposure(db,t),ps=psTeam(db,t),
    seasonYear=w?.year??db.year,sp=t.sponsor?.until>=seasonYear?t.sponsor:null,
    pre=t.finance?.prepaid||{};
  const wins=financeSeasonWins(db,t,w);
  return {league:exposure.hype*.25*ps*exposure.broadcast,
    sponsor:sp?(sp.base+(sp.perWin||0)*wins):exposure.fans*.35*ps,
    merch:exposure.fans*.1*ps*exposure.merchandising,
    prize:forecast?0:prize,
    sponsorMilestone:forecast?0:sponsorAchievementBonus(db,t,w),
    owner:ownerSupport(db,t),
    transfer:pre.transferReceived||0};
}
function financeSeasonPayroll(db,t,w=db.world){
  const snap=w&&w.contractWindow?.seasonYear===w.year?
    w.contractWindow.financePayroll?.[t.id]:null;
  return snap||{salary:payroll(db,t),regulated:regulatedPayroll(db,t)};
}
function financeOperatingExpense(db,t,w=db.world){
  const pre=t.finance?.prepaid||{},ps=psTeam(db,t),
    seasonPayroll=financeSeasonPayroll(db,t,w);
  const international=w?.seasons?Object.values(w.seasons).filter(s=>
    db.competitions[s.comp]?.international&&s.teams?.includes(t.id)).length:0;
  return {salary:seasonPayroll.salary,medicalReplacementWage:pre.medicalReplacementWage||0,
    bonuses:w&&w.year<=db.year?contractBonusCost(db,t,w.year):0,
    staff:staffCost(db,t),ops:opsCost(db,t),facility:facilityUpkeep(db,t),
    travel:international*.55*ps,
    interest:Math.max(0,-(t.finance?.cash||0))*.06,
    buyout:t.finance?.buyout||0,tax:spendingTaxForPayroll(db,t,seasonPayroll.regulated),
    facilityInvestment:pre.facilityInvestment||0,signingBonus:pre.signingBonus||0,
    transfer:pre.transferPaid||0,staffSeverance:pre.staffSeverance||0,
    scouting:pre.scoutingExpense||0};
}
function financePrepaidSettlement(t){
  const p=t.finance?.prepaid||{};
  return {income:p.transferReceived||0,
    expense:(p.facilityInvestment||0)+(p.signingBonus||0)+(p.transferPaid||0)+
      (p.staffSeverance||0)+(p.scoutingExpense||0)+(p.medicalReplacementWage||0)};
}
function staffCost(db,t){const specialists=teamStaffMembers(t).reduce((sum,s)=>sum+staffSalary(s,1),0);return (2+specialists)*psTeam(db,t)}
function opsCost(db,t){return 8*psTeam(db,t)}
function ownerSupport(db,t){
  if(t.parent)return 4*psOf(db,t.region);
  const owner=t.owner||{wealth:50};
  return owner.wealth/100*(['win-now','superstar'].includes(t.philosophy)?12:6)*psTeam(db,t);
}
function estRevenue(db,t){
  const rev=financeCommercialIncome(db,t,null,true);
  return rev.league+rev.sponsor+rev.merch+rev.owner;
}
function financeRunway(db,t){
  const monthly=(payroll(db,t)+staffCost(db,t)+opsCost(db,t)+facilityUpkeep(db,t))/12;
  const cash=t.finance?.cash||0;
  const months=monthly>0?Math.max(0,cash)/monthly:99;
  const severity=cash<0?'critical':months<3?'strained':months<9?'watch':'stable';
  return {months:Math.round(months*10)/10,severity,monthly};
}
function salaryBudget(db,t){
  const liquid=Math.max(0,t.finance.cash),cashPressure=financeRunway(db,t);
  const b=estRevenue(db,t)*.95+liquid*.3-staffCost(db,t)-opsCost(db,t);
  const normal= ['win-now','superstar'].includes(t.philosophy)?1.15:t.philosophy==='cost'?.85:1;
  // A financially distressed board cannot promise next year's payroll from
  // cash it does not possess. Existing player contracts are still honoured.
  const cautious=cashPressure.severity==='critical'?.82:cashPressure.severity==='strained'?.91:1;
  return Math.max(0,b*normal*cautious);
}
// Conservative statement; only already-observed wins and committed expenses.
function financeForecast(db,t){
  const rev=financeCommercialIncome(db,t,db.world,true),
    exp=financeOperatingExpense(db,t,db.world),settled=financePrepaidSettlement(t);
  // Future contingent performance bonuses remain uncertain.
  exp.bonuses=0;
  const revenue=sumFinanceRows(rev),expense=sumFinanceRows(exp);
  return {rev,exp,revenue,expense,net:revenue-expense,
    closingCash:(t.finance?.cash||0)+revenue-expense-settled.income+settled.expense,
    runway:financeRunway(db,t),
    unknown:['미확정 상금','스폰서 목표 달성 수당','미지급 선수 성과급',
      '미확정 선수 거래','향후 공식 경기 승수','사치세 재분배']};
}

// 한 해 결산: 중계권 분배, 스폰서, 굿즈, 상금, 구단주 지원 − 연봉, 스태프, 운영비, 사치세
function closeFinances(db,w,rng,ev){
  const prize={};
  for(const season of Object.values(w.seasons||{})){
    if(!season.done)continue;
    const c=db.competitions[season.comp];
    if(!c)continue;
    const pool=c.international?(c.id==='WORLDS'?45:c.tier==='low'?5:18):9*psOf(db,c.region);
    const participants=(c.teams||[]).filter(id=>db.teams[id]);
    const weights=participants.map(id=>[id,1+elimReach(db,season,id)*3]);
    const total=weights.reduce((n,row)=>n+row[1],0);
    if(total)for(const [id,weight] of weights)prize[id]=(prize[id]||0)+pool*weight/total;
  }
  const taxPool={};
  const recs=activeTeams(db).map(t=>{
    const R=db.regions[t.region],payrollBasis=financeSeasonPayroll(db,t,w);
    const rev=financeCommercialIncome(db,t,w,false,prize[t.id]||0);
    const exp=financeOperatingExpense(db,t,w);
    if(exp.tax>0)taxPool[R.id]=(taxPool[R.id]||0)+exp.tax*(R.sfrTeamShare??1);
    return {t,R,rev,exp,payrollBasis,settled:financePrepaidSettlement(t)};
  });
  // Any tax redistribution is financed by collected liabilities in the same
  // regional office; it is not added to the league from nowhere.
  for(const R of Object.values(db.regions)){
    const share=taxPool[R.id]||0;if(!share)continue;
    const under=recs.filter(row=>row.R===R&&R.spendingRule==='sfr_top5'&&
      row.exp.tax===0&&(row.t.division||1)===1&&
      row.payrollBasis.regulated>=(R.salaryFloor||0)&&
      row.payrollBasis.regulated<=(R.salaryCap||Infinity));
    if(under.length)for(const row of under)row.rev.tax=share/under.length;
  }
  // An academy deficit is funded by its parent club, and both sides show that
  // internal cash transfer in their statements. No unmatched cash adjustments.
  const index=new Map(recs.map(row=>[row.t.id,row]));
  for(const row of recs){
    if(!row.t.parent)continue;
    const parent=index.get(row.t.parent);
    if(!parent)continue;
    const projected=row.t.finance.cash+sumFinanceRows(row.rev)-sumFinanceRows(row.exp)-
      row.settled.income+row.settled.expense;
    const funding=Math.round(Math.max(0,-projected)*10)/10;
    if(!funding)continue;
    row.rev.academyFunding=funding;
    parent.exp.academySupport=(parent.exp.academySupport||0)+funding;
  }
  const round=value=>Math.round(value*10)/10;
  const roundRows=rows=>Object.fromEntries(Object.entries(rows).map(([key,v])=>
    [key,key==='medicalReplacementWage'?Math.round(v*1000)/1000:round(v)]));
  for(const row of recs){
    const inc=sumFinanceRows(row.rev),out=sumFinanceRows(row.exp),f=row.t.finance;
    const net=inc-out;
    f.cash=round(f.cash+net-row.settled.income+row.settled.expense);
    f.buyout=0;f.prepaid={};
    f.history=[...f.history,{year:w.year,rev:roundRows(row.rev),
      exp:roundRows(row.exp),net:round(net),cash:f.cash}].slice(-10);
    if(row.exp.tax>0)ev(`${row.t.name} 균형지출 부담금 ${money(row.exp.tax)} 납부 (상위 5인 기준 ${money(row.payrollBasis.regulated)}, 기준선 ${money(row.R.salaryCap)})`);
    if(row.t.parent)continue;
    const losses=f.history.slice(-2).filter(y=>y.net<0).length;
    if(f.cash<-12*psTeam(db,row.t)&&losses>=2){
      const old=row.t.name,renamed=orgName(db,rng),before=f.cash;
      row.t.name=renamed.name;row.t.formerNames=[...(row.t.formerNames||[]),old];
      row.t.owner={wealth:Math.round(clamp(rng.normal(65,15),30,95))};
      f.cash=round(25*psTeam(db,row.t));row.t.fans=Math.round((row.t.fans||30)*.88);
      // Equity recapitalization is a capital movement, not an operating profit.
      const year=f.history.at(-1);
      year.capital={newOwner:f.cash-before};year.cash=f.cash;
      ev(`장기 재정난으로 구단 매각: ${old} → ${row.t.name} (연속 적자, 신규 구단주 자금 투입 ${money(f.cash-before)})`);
    }
  }
}

// 계약 만료 · 재계약 · FA 시장

function mSponsor(db,id){const t=myT(db);if(!t)return '구단을 찾을 수 없습니다';if(t.sponsor?.until>=db.year)return '기존 스폰서 계약 기간이 남아 있습니다';const offers=db.world?.sponsorOffers||[];const o=offers.find(x=>x.id===id);if(!o)return '제안이 만료되었습니다';t.sponsor={...o,until:db.year+o.years-1};return `${o.name} ${o.type} 스폰서 계약 (${o.years}년)`}
