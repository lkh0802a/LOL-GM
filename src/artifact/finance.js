// ===== LOL GM: 계약 / 재정 / FA 시장 (단위: 억 원) =====
const PAY_SCALE={}; // legacy compatibility only; new worlds derive pay scale in the policy engine.
const money=v=>(Math.round(v*10)/10).toFixed(1)+'억';
function psOf(db,rid){const R=db.regions[rid];return R?(R.payScale??.5):.5}
function psTeam(db,t){return psOf(db,t.region)*((t.division||1)===2?0.35:1)}
function recentMarketPerformance(db,p){
  const rows=(p.career||[]).slice(-6),g=rows.reduce((a,c)=>a+(c.g||0),0);if(!g)return {games:0,rating:6.5,intl:0,titles:0};
  const rating=rows.reduce((a,c)=>a+(c.rating||6.5)*(c.g||0),0)/g,intl=rows.filter(c=>c.international).reduce((a,c)=>a+(c.g||0),0),titles=(p.careerEvents||[]).filter(e=>e.type==='title'&&e.year>=db.year-2).length;
  return {games:g,rating,intl,titles};
}
function marketDemandSnapshot(db,rid){
  db._marketDemandCache=db._marketDemandCache||{};
  const teams=activeTeams(db,rid,1),key=[db.year,rid||'ALL',Object.keys(db.players).length,teams.length].join('|'),slot=rid||'ALL',cached=db._marketDemandCache[slot];
  if(cached&&cached.key===key)return cached.values;
  const counts=Object.fromEntries(ROLES.map(r=>[r,0]));
  for(const p of Object.values(db.players))if(!p.retired&&(!rid||p.region===rid)&&(p.age<=30||p.team))counts[p.role]=(counts[p.role]||0)+1;
  const values=Object.fromEntries(ROLES.map(role=>[role,clamp(Math.max(1,teams.length*1.35)/Math.max(1,counts[role]||0),.72,1.38)]));
  db._marketDemandCache[slot]={key,values};return values;
}
function invalidateMarketDemand(db){if(db)db._marketDemandCache={}}
function roleMarketDemand(db,role,rid){return marketDemandSnapshot(db,rid)[role]??1}
function marketSalary(db,p,rid){
  const o=playerOvr(p),region=rid||p.region,ps=psOf(db,region),up=Math.max(0,p.pot-o),perf=recentMarketPerformance(db,p),demand=roleMarketDemand(db,p.role,region);
  const repMul=.82+(p.reputation??o)/220,perfMul=clamp(1+(perf.rating-6.5)*.08+Math.min(.1,perf.intl*.004)+Math.min(.08,perf.titles*.035),.82,1.28),ageMul=p.age<=21?1.02:p.age>=29?.88:1;
  return Math.max(.3*ps,Math.round(.41*Math.exp((o-60)*.13)*(1+up*(p.age<=21?.035:.008))*ps*repMul*perfMul*demand*ageMul*10)/10);
}
function playerMarketValue(db,p){
  const o=playerOvr(p),rep=p.reputation??o,up=Math.max(0,p.pot-o),rid=p.team&&db.teams[p.team]?db.teams[p.team].region:p.region,ps=psOf(db,rid),perf=recentMarketPerformance(db,p),demand=roleMarketDemand(db,p.role,rid);
  const ageMul=p.age<=20?1.25:p.age<=23?1.16:p.age<=26?1:p.age<=29?.82:.58,left=p.contract?Math.max(0,p.contract.until-db.year+1):0,contractMul=p.contract?1+Math.min(3,left)*.14:.68;
  const perfMul=clamp(1+(perf.rating-6.5)*.09+Math.min(.13,perf.intl*.004)+Math.min(.12,perf.titles*.045)+(p.form||0)*.008,.75,1.35);
  const raw=.62*Math.exp((o-60)*.115)*ps*(.76+rep/175)*(1+up*(p.age<=22?.047:.018))*ageMul*contractMul*perfMul*demand;
  return Math.round(Math.max(.2*ps,raw)*10)/10;
}
function asking(db,p,rid){return Math.round(marketSalary(db,p,rid)*(1+p.personality.ambition/420)*(.95+(p.reputation??playerOvr(p))/1700)*10)/10}
function defaultPromisedRole(db,p,t){const cur=starterFor(db,t,p.role);if(!cur)return 'starter';const gap=playerOvr(p)-playerOvr(cur);return gap>=3?'starter':gap>=-2?'competition':p.age<=21?'prospect':'backup'}
function normalizeContractTerms(db,p,t,salary,years,terms={}){
  salary=Math.max(.1,Math.round(+salary*10)/10);years=clamp(Math.round(+years||1),1,4);
  const sign=Math.max(0,Math.round((terms.signingBonus??0)*10)/10);
  const bonuses={performance:Math.max(0,Math.round((terms.bonuses?.performance??0)*10)/10),title:Math.max(0,Math.round((terms.bonuses?.title??0)*10)/10),international:Math.max(0,Math.round((terms.bonuses?.international??0)*10)/10)};
  const optionType=['team','player'].includes(terms.option?.type)?terms.option.type:'none',until=db.year+years-1;
  const option=optionType==='none'?null:{type:optionType,year:until+1,salary:Math.round((terms.option?.salary??salary)*10)/10};
  const buyout=terms.buyout==null||+terms.buyout<=0?null:Math.round(+terms.buyout*10)/10;
  return {salary,years,signingBonus:sign,bonuses,buyout,option,promisedRole:SQUAD_ROLES.includes(terms.promisedRole)?terms.promisedRole:defaultPromisedRole(db,p,t)};
}
function contractExpectedValue(c){if(!c)return 0;const b=c.bonuses||{};return c.salary+(c.signingBonus||0)/Math.max(1,c.years||1)+(b.performance||0)*.35+(b.title||0)*.14+(b.international||0)*.2}
function teamInternationalAppeal(db,t){const R=db.regions[t.region],power=db.global?.power?.[R.id]||1;return clamp((R.slots||1)/4*.55+(teamStrength(db,t.id)-R.strength)/18*.3+(t.fans||30)/180+power*.08,0,1.25)}
function offerUtility(db,p,t,offer,opt={}){
  ensureSatisfaction(p);const ask=Math.max(.1,asking(db,p,t.region)),moneyScore=contractExpectedValue(offer)/ask,role=offer.promisedRole||defaultPromisedRole(db,p,t),roleScore={core:.72,starter:.62,competition:.24,backup:.02,prospect:p.age<=21?.38:-.08}[role]??0;
  const strength=(teamStrength(db,t.id)-db.regions[t.region].strength)/12,fac=((t.facility||2)-2)*.08,coach=((t.coach?.development||55)-55)/160,intl=teamInternationalAppeal(db,t),stability=Math.min(3,offer.years||1)*.055;
  const home=db.worldConfig.universalLanguage?(p.region===t.region?.04:0):(p.region===t.region?.22:-.08),amb=p.personality.ambition/100,career=playerCareerGoal(p);
  let careerFit=0;if(career==='development')careerFit=fac+coach+(role==='prospect'||role==='competition'?.16:0);else if(career==='starter')careerFit=['core','starter'].includes(role)?.22:-.12;else if(career==='international')careerFit=intl*.18;else if(career==='titles')careerFit=Math.max(0,strength)*.16+intl*.1;else careerFit=stability;
  const option=offer.option?.type==='player'?.07:offer.option?.type==='team'?-.025:0,buyout=offer.buyout?clamp(offer.buyout/Math.max(.2,playerMarketValue(db,p)),.4,4)*-.018:0;
  const currentPenalty=opt.renewal?(p.satisfaction-50)/140-(p.wantsOut?.28:0):0;
  return moneyScore*1.05+roleScore+strength*amb*.18+intl*amb*.22+(t.fans||30)/250+fac+coach+careerFit+stability+home+option+buyout+currentPenalty;
}
function offerAcceptanceThreshold(db,p){const rep=(p.reputation||playerOvr(p)),amb=p.personality.ambition/100;return 1.04+rep/520+amb*.12+(p.age<=20?.04:0)}
function contractBonusCost(db,t,year){
  let sum=0;for(const id of t.roster){const p=db.players[id],c=p&&p.contract;if(!c||!c.bonuses)continue;const rows=(p.career||[]).filter(x=>x.year===year),g=rows.reduce((a,x)=>a+(x.g||0),0),rating=g?rows.reduce((a,x)=>a+(x.rating||6.5)*(x.g||0),0)/g:0;
    if(g>=10&&rating>=7.2)sum+=c.bonuses.performance||0;if(rows.some(x=>x.international&&x.g>=3))sum+=c.bonuses.international||0;if((p.careerEvents||[]).some(e=>e.year===year&&e.type==='title'))sum+=c.bonuses.title||0}
  return Math.round(sum*10)/10;
}
function signContract(db,p,t,salary,years,terms={}){
  const old=p.team,offer=normalizeContractTerms(db,p,t,salary,years,terms);assignPlayerToTeam(db,p,t);invalidateMarketDemand(db);p.faYears=0;
  p.contract={salary:offer.salary,until:db.year+offer.years-1,signed:db.year,years:offer.years,signingBonus:offer.signingBonus,bonuses:offer.bonuses,buyout:offer.buyout,option:offer.option,promisedRole:offer.promisedRole};
  if(offer.signingBonus&&t.finance)t.finance.cash=Math.round((t.finance.cash-offer.signingBonus)*10)/10;
  setRosterRole(db,p,offer.promisedRole,'contract',true);ensureSatisfaction(p);if(old&&old!==t.id){p.satisfaction=clamp(Math.max(p.satisfaction,58),0,100);p.concernStreak=0;p.wantsOut=false;p.wantsOutReason=null}
  if(db.world)recordPlayerEvent(p,'contract',db.year,{team:t.id,salary:p.contract.salary,years:offer.years,until:p.contract.until,renewal:old===t.id,rosterRole:p.rosterRole,signingBonus:offer.signingBonus,buyout:offer.buyout,option:offer.option,date:db.worldDate});
  return p.contract;
}
function payroll(db,t){return t.roster.reduce((a,id)=>a+((db.players[id]&&db.players[id].contract)?db.players[id].contract.salary:0),0)}
function topFivePayroll(db,t){return t.roster.map(id=>db.players[id]).filter(p=>p&&p.contract).map(p=>p.contract.salary).sort((a,b)=>b-a).slice(0,5).reduce((a,b)=>a+b,0)}
function regulatedPayroll(db,t){const R=db.regions[t.region];return R&&R.spendingRule==='sfr_top5'?topFivePayroll(db,t):payroll(db,t)}
function spendingTax(db,t){
  const R=db.regions[t.region];if(!R||R.spendingRule!=='sfr_top5'||!R.salaryCap||(t.division||1)!==1)return 0;
  const spend=regulatedPayroll(db,t),over=Math.max(0,spend-R.salaryCap);if(!over)return 0;
  if(R.sfrMode==='lec_50_100'){const first=Math.min(over,R.salaryCap*.5),rest=Math.max(0,over-first);return first*.5+rest}
  const a=Math.min(over,R.salaryCap*.1),b=Math.min(Math.max(0,over-a),R.salaryCap*.15),c=Math.max(0,over-a-b);
  return a*.25+b*.5+c*(R.luxuryTax||1);
}
function contractYearsForPlayer(db,p,rng){
  const elite=(p.reputation||playerOvr(p))>=85;
  if(p.age<=20){const x=rng.next();return x<(elite?.1:.15)?1:x<(elite?.62:.72)?2:3}
  if(p.age<=25){const x=rng.next();return x<(elite?.25:.45)?1:x<(elite?.78:.9)?2:3}
  if(p.age<=28)return rng.chance(elite?.42:.7)?1:2;
  return rng.chance(.88)?1:2;
}
function initFinance(db,t,rng){
  const ps=psTeam(db,t);
  t.owner=t.owner||{wealth:Math.round(clamp(rng.normal(55,18),10,95))};
  t.facility=t.facility||clamp(Math.round(1+t.owner.wealth/30),1,4);ensureFacilities(t);
  t.finance=t.finance||{cash:Math.round((25+rng.range(0,35))*ps*10)/10,history:[],buyout:0};
}
function staffCost(db,t){const assistants=Object.values(t.staff||{}).reduce((sum,s)=>sum+staffSalary(s,1),0);return (2+coachSalary(t.coach,1)+assistants)*psTeam(db,t)}
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
    const rev={league:hype*0.25*ps,sponsor:sp?sp.base+sp.perWin*wins:(t.fans||30)*0.35*ps,merch:(t.fans||30)*0.1*ps,prize:prize[t.id]||0,owner:ownerSupport(db,t)};
    const pay=payroll(db,t),regulated=regulatedPayroll(db,t);
    const exp={salary:pay,bonuses:contractBonusCost(db,t,w.year),staff:staffCost(db,t),ops:opsCost(db,t),facility:facilityUpkeep(db,t),buyout:t.finance.buyout||0,tax:spendingTax(db,t)};
    if(exp.tax>0)taxPool[R.id]=(taxPool[R.id]||0)+exp.tax*(R.sfrTeamShare??1)
    return {t,R,rev,exp};
  });
  for(const r of recs){
    if(taxPool[r.R.id]){const under=recs.filter(x=>x.R===r.R&&x.R.spendingRule==='sfr_top5'&&x.exp.tax===0&&regulatedPayroll(db,x.t)>=(x.R.salaryFloor||0)&&regulatedPayroll(db,x.t)<=(x.R.salaryCap||Infinity)&&(x.t.division||1)===1);if(under.includes(r))r.rev.tax=taxPool[r.R.id]/under.length}
    const inc=Object.values(r.rev).reduce((a,b)=>a+b,0), out=Object.values(r.exp).reduce((a,b)=>a+b,0);
    const f=r.t.finance; f.buyout=0; f.cash=Math.round((f.cash+inc-out)*10)/10;
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
function eligibleFillFAs(db,t,role=null){
  const R=db.regions[t.region],imports=t.roster.filter(id=>db.players[id]&&db.players[id].region!==t.region).length,room=Math.max(0,(R.importLimit??2)-imports);
  return Object.values(db.players).filter(p=>!p.retired&&!p.team&&(!role||p.role===role)&&(p.region===t.region||room>0))
    .sort((a,b)=>(pFillScore(db,b,t)-pFillScore(db,a,t)));
}
function aiMarketObservation(db,p,t){
  const perf=recentMarketPerformance(db,p),sample=Math.min(30,perf.games),foreign=p.region!==t.region,uncertainty=(foreign?4.5:2.5)+(sample<6?3:sample<15?1.5:0),n=((hashStr(t.id+'|'+p.id+'|'+db.year+'|ability')%2001)/1000-1);
  const ability=Math.round(clamp(playerOvr(p)+n*uncertainty,20,99)),n2=((hashStr(t.id+'|'+p.id+'|'+db.year+'|potential')%2001)/1000-1),ageUpside=p.age<=19?9:p.age<=21?6:p.age<=23?3:1;
  const potential=Math.round(clamp(ability+ageUpside+n2*(foreign?5:3)+(p.reputation-ability)*.08,ability,99));
  return {ability,potential,uncertainty:Math.round(uncertainty*10)/10};
}
function aiMarketValue(db,p,t){const est=aiMarketObservation(db,p,t),up=Math.max(0,est.potential-est.ability),w={'win-now':0.1,'youth':0.6,'balanced':0.3,'superstar':0.15,'cost':0.35}[t.philosophy]||0.3;return est.ability+up*w-(t.philosophy==='youth'&&p.age>26?2:0)}
function pFillScore(db,p,t){const domestic=p.region===t.region?2:0,age=p.age<=21?1:0,cost=Math.min(4,asking(db,p,t.region)/Math.max(.2,psOf(db,t.region)));return aiMarketValue(db,p,t)+domestic+age-cost*.15}
function optionDecision(db,p,t){
  const o=p.contract&&p.contract.option;if(!o||o.year!==db.year)return false;
  const next={...p.contract,salary:o.salary,years:1,signingBonus:0,bonuses:p.contract.bonuses||{},option:null,promisedRole:p.contract.promisedRole||p.rosterRole};
  if(o.type==='team')return contractExpectedValue(next)<=asking(db,p,t.region)*1.08||starterFor(db,t,p.role)===p;
  if(o.type==='player')return offerUtility(db,p,t,next,{renewal:true})>=offerAcceptanceThreshold(db,p)-.06;
  return false;
}
function exerciseContractOption(db,p,t,source='engine'){
  const o=p.contract&&p.contract.option;if(!o||o.year!==db.year)return false;p.contract.until=db.year;p.contract.salary=o.salary;p.contract.years=(p.contract.years||1)+1;p.contract.option=null;
  recordPlayerEvent(p,'contract_option',db.year,{team:t.id,type:o.type,salary:o.salary,source,date:db.worldDate});return true;
}
function contractMarket(db,rng,rep,ev){
  const year=db.year, size=5+(db.worldConfig.subs||0), w=db.world, mine=w&&w.manage==='manual'?managedTeamId(db):null;
  const imports=t=>t.roster.filter(id=>db.players[id]&&db.players[id].region!==t.region).length;
  const release=(t,p,why)=>{ if(p.contract&&p.contract.until>=year){t.finance.buyout=(t.finance.buyout||0)+p.contract.salary*(p.contract.until-year+1)*0.5}
    removePlayerFromTeam(db,p);p.contract=null;p.faYears=0;};
  // 1) 옵션 및 만료 계약 처리
  for(const t of activeTeams(db))for(const id of t.roster.slice()){const p=db.players[id];if(!p||!p.contract||p.contract.until>=year)continue;const opt=p.contract.option;
    if(opt&&opt.year===year&&t.id!==mine&&optionDecision(db,p,t))exerciseContractOption(db,p,t,'ai');
  }
  for(const t of activeTeams(db)) for(const id of t.roster.slice()){
    const p=db.players[id]; if(!p||p.retired)continue;
    if(!p.contract){signContract(db,p,t,marketSalary(db,p,t.region),1);continue}
    if(p.contract.until>=year)continue;
    if(t.id===mine){release(t,p);rep.expired.push({pid:p.id,team:t.id,why:'재계약하지 않음'});continue}
    const isStarter=starterFor(db,t,p.role)===p,want=isStarter||p.rosterRole==='competition'||(p.age<=21&&p.pot-playerOvr(p)>=6)||(p.rosterRole==='backup'&&t.roster.length<7&&p.satisfaction>=50);
    const ask=asking(db,p,t.region),room=salaryBudget(db,t)-payroll(db,t)+p.contract.salary,yrs=contractYearsForPlayer(db,p,rng),proposal=normalizeContractTerms(db,p,t,ask*rng.range(.96,1.08),yrs,{promisedRole:recommendedRosterRole(db,p,t),option:rng.chance(.18)?{type:rng.chance(.55)?'team':'player'}:null});
    ensureSatisfaction(p);const stay=offerUtility(db,p,t,proposal,{renewal:true})+rng.normal(0,.06)>=offerAcceptanceThreshold(db,p);
    if(want&&proposal.salary<=room&&stay){signContract(db,p,t,proposal.salary,yrs,proposal);rep.resign.push({pid:p.id,team:t.id,salary:proposal.salary,years:yrs,terms:proposal})}
    else {release(t,p);rep.expired.push({pid:p.id,team:t.id,why:!want?'재계약 제안 없음':proposal.salary>room?'연봉 이견':'FA 시장 도전'})}
  }
  // 2) FA 시장 (3라운드: 제안 → 선수 선택)
  // 2군 콜업: 프랜차이즈 구단은 자기 2군에서 먼저 올린다
  for(const a of activeTeams(db).filter(t=>t.parent)){const t=db.teams[a.parent];if(!t||t.active===false||t.id===mine)continue;
    for(const role of ROLES){const cur=starterFor(db,t,role),cand=a.roster.map(id=>db.players[id]).filter(p=>p.role===role).sort((x,y)=>playerOvr(y)-playerOvr(x))[0];
      if(cand&&(!cur||playerOvr(cand)>=playerOvr(cur)+5||(playerOvr(cand)>=playerOvr(cur)+3&&((cur.form??0)<=-6||cur.wantsOut)))){assignPlayerToTeam(db,cand,t);
        if(cur&&t.roster.length>size)assignPlayerToTeam(db,cur,a)
        rep.signings.push({pid:cand.id,team:t.id,salary:cand.contract?cand.contract.salary:0,years:cand.contract?cand.contract.until-year+1:1,callup:true});}}}
  const budgetLeft={};activeTeams(db).forEach(t=>budgetLeft[t.id]=salaryBudget(db,t)-payroll(db,t));
  for(let round=0;round<3;round++){
    const fas=Object.values(db.players).filter(p=>!p.retired&&!p.team);
    const offers={};
    if(round===0&&mine)for(const o of w.offers||[]){const p=db.players[o.pid];if(p&&!p.team)(offers[p.id]=offers[p.id]||[]).push({t:db.teams[mine],sal:o.salary,years:o.years,starter:starterFor(db,db.teams[mine],p.role)?playerOvr(p)>playerOvr(starterFor(db,db.teams[mine],p.role)):true,mine:true})}
    for(const t of activeTeams(db).filter(t=>t.id!==mine&&!t.parent).sort(()=>rng.next()-0.5)){
      const R=db.regions[t.region];
      for(const role of ROLES){
        const cur=starterFor(db,t,role), cv=cur?playerValue(db,cur,t):-99;
        const importGap=R.importRecruitMinGap??3;
        const cand=fas.filter(p=>p.role===role&&(p.region===t.region||(playerOvr(p)>=R.strength+importGap&&imports(t)<(R.importLimit??2))))
          .map(p=>({p,v:aiMarketValue(db,p,t),ask:asking(db,p,t.region)})).filter(x=>x.ask<=budgetLeft[t.id]&&(!cur||cur.wantsOut||cur.contract.until<=year||x.v>cv+5)).sort((a,b)=>b.v-a.v);
        const c=cand[0]; if(!c)continue;
        const sal=Math.round(c.ask*(['win-now','superstar'].includes(t.philosophy)?rng.range(1,1.15):rng.range(0.95,1.05))*10)/10;
        (offers[c.p.id]=offers[c.p.id]||[]).push({t,sal,starter:true});
      }
    }
    for(const [pid,os] of Object.entries(offers)){
      const p=db.players[pid], ask=asking(db,p);
      const u=o=>o.sal/ask*1.2+(teamStrength(db,o.t.id)-db.regions[o.t.region].strength)/10*p.personality.ambition/100+(o.t.fans||30)/100*0.4+(o.starter?0.5:0)+(db.worldConfig.universalLanguage?(o.t.region===p.region?0.08:0):(o.t.region===p.region?0.4:-0.2))+(db.regions[o.t.region].slots||1)*0.05+rng.normal(0,0.1);
      const best=os.map(o=>({o,v:u(o)})).sort((a,b)=>b.v-a.v).find(x=>budgetLeft[x.o.t.id]>=x.o.sal);
      if(!best)continue;
      if(best.o.mine)w.marketLog.push(`${p.name}: ${best.o.t.id===mine?'영입 성공':'다른 구단 선택'}`);
      const t=best.o.t,yrs=best.o.years?best.o.years:contractYearsForPlayer(db,p,rng);
      const prev=starterFor(db,t,p.role);
      signContract(db,p,t,best.o.sal,yrs); budgetLeft[t.id]-=best.o.sal;
      rep.signings.push({pid:p.id,team:t.id,salary:best.o.sal,years:yrs,rookie:p.age<=19&&!p.career.length,import:p.region!==t.region,offers:os.length,out:null});
      if(t.roster.length>size+1){const bench=t.roster.map(id=>db.players[id]).filter(x=>x!==p&&starterFor(db,t,x.role)!==x).sort((a,b)=>playerValue(db,a,t)-playerValue(db,b,t))[0];
        if(bench){release(t,bench);rep.signings[rep.signings.length-1].out=bench.id}}
      else if(prev)rep.signings[rep.signings.length-1].out=null;
    }
  }
  // 이적료 거래: 예산이 넉넉한 구단이 다른 구단 주전을 사 온다
  let deals=0;
  for(const t of activeTeams(db,null,1).filter(t=>t.id!==mine&&t.finance.cash>20*psTeam(db,t)).sort(()=>rng.next()-0.5)){
    if(deals>=Math.max(2,Math.ceil(activeTeams(db,null,1).length/10)))break;
    const role=rng.pick(ROLES), cur=starterFor(db,t,role); if(!cur)continue;
    const cand=activeTeams(db,t.region,1).filter(o=>o.id!==t.id&&o.id!==mine).map(o=>starterFor(db,o,role)).filter(p=>p&&p.contract&&aiMarketValue(db,p,t)>playerValue(db,cur,t)+5)
      .map(p=>({p,fee:transferFee(db,p)})).filter(x=>x.fee<=t.finance.cash*0.6&&x.p.contract.salary<=budgetLeft[t.id]+cur.contract.salary).sort((a,b)=>aiMarketValue(db,b.p,t)-aiMarketValue(db,a.p,t))[0];
    if(!cand)continue;
    const seller=db.teams[cand.p.team];
    if(!(seller.finance.cash<10*psTeam(db,seller)||cand.p.wantsOut||rng.chance(.2)))continue;
    doTransfer(db,cand.p,seller,t,cand.fee);deals++;
    rep.transfers.push({pid:cand.p.id,from:seller.id,to:t.id,fee:cand.fee});
    if(t.roster.length>size){assignPlayerToTeam(db,cur,seller);rep.transfers[rep.transfers.length-1].swap=cur.id}
  }
  // 3) 로스터 채우기 / 정리
  for(const t of activeTeams(db)){
    for(const role of ROLES) if(!starterFor(db,t,role)){
      const fa=eligibleFillFAs(db,t,role)[0];
      if(!fa)throw new Error('Talent supply invariant failed during market: '+t.id+' '+role+' has no eligible free agent');
      signContract(db,fa,t,asking(db,fa,t.region),contractYearsForPlayer(db,fa,rng));rep.signings.push({pid:fa.id,team:t.id,salary:fa.contract.salary,years:fa.contract.until-year+1,rookie:fa.age<=19,fill:true});
    }
    while(t.roster.length<size){
      const fa=eligibleFillFAs(db,t)[0];
      if(!fa)throw new Error('Talent supply invariant failed during market: '+t.id+' has no eligible free agent for bench slot');
      signContract(db,fa,t,asking(db,fa,t.region),contractYearsForPlayer(db,fa,rng));rep.signings.push({pid:fa.id,team:t.id,salary:fa.contract.salary,years:fa.contract.until-year+1,rookie:fa.age<=19,fill:true});
    }
    while(t.roster.length>size){const b=t.roster.map(id=>db.players[id]).filter(x=>starterFor(db,t,x.role)!==x).sort((a,b)=>playerValue(db,a,t)-playerValue(db,b,t))[0];if(!b)break;release(t,b)}
    // SFR 하한은 강제 연봉 인상이 아니라 분배 자격 기준으로만 사용한다.
  }
}
// 리그 팀 수를 짝수로 유지 (1부·2부 각각)
function ensureEven(db,rng,ev){
  for(const R of Object.values(db.regions)){
    for(const div of R.div2?[1,2]:[1]){
      const n=activeTeams(db,R.id,div).length;
      if(n%2){const t=div===1?genTeam(db,rng,R.id,R.strength-3):genTeam(db,rng,R.id,R.strength-8,{div:2});if(R.system==='mixed'&&div===1)t.franchised=false;
        if(div===1&&R.div2&&R.system==='franchise')makeAcademy(db,rng,t);
        ev(`${div===1?R.leagueName:divName(R)} 신규 창단 승인: ${t.name} (${n+1}팀 체제)`)}
    }
    // 프랜차이즈 2군 리그는 모구단 수와 맞춘다
    if(R.div2&&R.system==='franchise'){for(const t of activeTeams(db,R.id,1))if(!activeTeams(db,R.id,2).some(a=>a.parent===t.id))makeAcademy(db,rng,t)}
    R.teams=activeTeams(db,R.id,1).length;
  }
}

// ---- 영입 후보 / 관심 → 관찰 → 내부평가 ----
const RECRUIT_PRIORITY=['A','B','C'];
function recruitmentStore(db){const w=db.world;if(!w)return {};w.recruitment=w.recruitment||{};w.recruitment.targets=w.recruitment.targets||{};return w.recruitment.targets}
function recruitmentTarget(db,pid){return recruitmentStore(db)[pid]||null}
function setRecruitmentPriority(db,pid,priority='B'){
  const p=db.players[pid];if(!p||p.retired)return {ok:false,msg:'영입 대상을 찾을 수 없습니다'};
  priority=RECRUIT_PRIORITY.includes(priority)?priority:'B';const store=recruitmentStore(db),prev=store[pid];
  store[pid]={pid,priority,stage:prev?.stage||'interest',addedDate:prev?.addedDate||db.worldDate,knowledge:knowledge(db,p),evaluation:prev?.evaluation||null,negotiationId:prev?.negotiationId||null,result:prev?.result||null};
  syncRecruitmentObservation(db,pid);return {ok:true,target:store[pid],msg:`${p.name} 영입 후보 ${priority}로 등록했습니다`};
}
function removeRecruitmentTarget(db,pid){const store=recruitmentStore(db),e=store[pid];if(!e)return '영입 후보에 없는 선수입니다';const n=e.negotiationId&&negotiationStore(db)[e.negotiationId];if(n&&n.status==='open')return '진행 중인 협상을 먼저 종료해야 합니다';const name=db.players[pid]?.name||pid;delete store[pid];return name+' 영입 후보 등록을 해제했습니다'}
function syncRecruitmentObservation(db,pid){
  const e=recruitmentTarget(db,pid),p=db.players[pid];if(!e||!p)return e;const k=knowledge(db,p);e.knowledge=k;
  if(e.stage==='interest'&&k>=35)e.stage='observed';return e;
}
function recruitmentEvaluation(db,pid,teamId=null){
  const t=teamId?db.teams[teamId]:myT(db),p=db.players[pid],e=recruitmentTarget(db,pid);if(!t||!p)return {ok:false,msg:'영입 대상을 찾을 수 없습니다'};if(!e)return {ok:false,msg:'먼저 관심목록에 등록해야 합니다'};
  syncRecruitmentObservation(db,pid);const k=knowledge(db,p);if(k<35)return {ok:false,msg:`관찰 정보가 부족합니다 (현재 ${k}%, 내부 평가에는 35% 이상 필요)`};
  const r=scoutReport(db,p),ability=Math.round(avg(r.ability)),potential=Math.round(avg(r.potential)),cur=starterFor(db,t,p.role),gap=cur?ability-playerOvr(cur):8,baseBudget=(db.world?.phase==='initial_roster'&&typeof initialSalaryBudget==='function')?initialSalaryBudget(db,t):salaryBudget(db,t),room=Math.max(.1,baseBudget-payroll(db,t)),cost=asking(db,p,t.region)/room;
  const fit=Math.round(clamp(50+gap*4+(potential-ability)*.9+(p.age<=21?5:0)+teamInternationalAppeal(db,t)*5-Math.max(0,cost-1)*18,0,100));
  e.stage='evaluated';e.knowledge=k;e.evaluation={teamId:t.id,date:db.worldDate,knowledge:k,ability:r.ability,potential:r.potential,fit,expectedRole:defaultPromisedRole(db,p,t),salaryAsk:asking(db,p,t.region),marketValue:playerMarketValue(db,p),risk:Math.round(scoutingRisk(db,p)*10)/10};
  return {ok:true,target:e,msg:`${p.name} 내부 평가 완료 · 적합도 ${fit}/100`};
}
function recruitmentReady(db,pid,teamId=null){const e=syncRecruitmentObservation(db,pid);return !!(e&&['evaluated','negotiating'].includes(e.stage)&&(!teamId||!e.evaluation?.teamId||e.evaluation.teamId===teamId))}
function recruitmentBoard(db){const rank={A:0,B:1,C:2};return Object.values(recruitmentStore(db)).sort((a,b)=>(rank[a.priority]??9)-(rank[b.priority]??9)||String(a.addedDate||'').localeCompare(String(b.addedDate||'')))}
function mInterest(db,pid,priority='B'){return setRecruitmentPriority(db,pid,priority).msg}
function mEvaluateTarget(db,pid,teamId=null){return recruitmentEvaluation(db,pid,teamId).msg}
function mDropInterest(db,pid){return removeRecruitmentTarget(db,pid)}

// ---- 선수 계약 협상 엔진 ----
function negotiationStore(db){const w=db.world;if(!w)return {};w.negotiations=w.negotiations||{};return w.negotiations}
function negotiationId(db,pid,kind,teamId=null){return 'NEG_'+db.year+'_'+pid+'_'+kind+(teamId?'_'+teamId:'')}
function negotiationRoundLimit(p){return clamp(3+Math.round((p.personality.professionalism-50)/35)-(p.personality.ambition>=82?1:0),2,5)}
function negotiationPreferredYears(p){const goal=playerCareerGoal(p);if(p.age>=29)return 1;if(p.age<=21&&goal==='development')return 3;if(goal==='stability')return 3;if(p.personality.ambition>=82&&p.age>=23)return 1;return 2}
function negotiationCompetition(db,p,t,rng,kind){
  if(kind==='renewal')return [];
  return activeTeams(db,null,1).filter(x=>x.id!==t.id&&!x.parent).map(team=>{
    const R=db.regions[team.region],imports=team.roster.filter(id=>db.players[id]&&db.players[id].region!==team.region).length;
    if(p.region!==team.region&&imports>=(R.importLimit??2))return null;
    const cur=starterFor(db,team,p.role),need=!cur?8:aiMarketObservation(db,p,team).ability-playerOvr(cur),baseBudget=(kind==='initial'&&typeof initialSalaryBudget==='function')?initialSalaryBudget(db,team):salaryBudget(db,team),room=baseBudget-payroll(db,team),ask=asking(db,p,team.region);
    if(room<ask*.82||need<-4)return null;
    const years=contractYearsForPlayer(db,p,rng),terms=normalizeContractTerms(db,p,team,ask*rng.range(.94,1.12),years,{promisedRole:defaultPromisedRole(db,p,team),option:rng.chance(.14)?{type:'player'}:null});
    return {teamId:team.id,terms,utility:offerUtility(db,p,team,terms),need};
  }).filter(Boolean).sort((a,b)=>b.utility-a.utility).slice(0,2);
}
function negotiationDemand(db,p,t,kind,rng,competitors=[]){
  const ask=asking(db,p,t.region),best=competitors.length?Math.max(...competitors.map(x=>x.utility)):0,goal=playerCareerGoal(p),years=negotiationPreferredYears(p);
  let premium=1+(p.personality.ambition-50)/500+(p.wantsOut&&kind==='renewal'?.08:0)+(best>offerAcceptanceThreshold(db,p)?.06:0);
  if(kind==='renewal'&&p.satisfaction>=75)premium-=.035;
  const role=goal==='starter'?'starter':defaultPromisedRole(db,p,t),sign=ask*(p.reputation>=82?.18:p.personality.ambition>=75?.14:.09);
  const option=p.personality.ambition>=78&&p.age<=27?{type:'player'}:null,buyout=p.personality.ambition>=82?Math.round(playerMarketValue(db,p)*1.8*10)/10:null;
  return normalizeContractTerms(db,p,t,ask*premium,years,{signingBonus:sign,bonuses:{performance:ask*.07,title:ask*.12,international:ask*.07},promisedRole:role,option,buyout});
}
function startNegotiation(db,pid,kind='fa',extra={}){
  const w=db.world,t=extra.teamId?db.teams[extra.teamId]:myT(db),p=db.players[pid];if(!w||!t||!p)return {ok:false,msg:'협상 대상을 찾을 수 없습니다'};
  if((kind==='fa'||kind==='initial')&&p.team)return {ok:false,msg:'FA 선수가 아닙니다'};if(kind==='renewal'&&p.team!==t.id)return {ok:false,msg:'우리 팀 선수가 아닙니다'};
  if(kind==='initial'){const allowed=typeof setupTeamsForManager==='function'?new Set(setupTeamsForManager(db).map(x=>x.id)):new Set([managedTeamId(db)]);if(!allowed.has(t.id))return {ok:false,msg:'내 구단 조직의 스쿼드만 계약 대상이 될 수 있습니다'}}
  if((kind==='fa'||kind==='transfer'||kind==='initial')&&!recruitmentReady(db,pid,t.id))return {ok:false,msg:'관심 등록 → 관찰 → 내부 평가를 완료한 뒤 공식 협상을 시작할 수 있습니다'};
  const id=negotiationId(db,pid,kind,kind==='initial'?t.id:null),store=negotiationStore(db);if(store[id]&&store[id].status==='open')return {ok:true,neg:store[id],msg:p.name+' 협상이 이미 진행 중입니다'};
  const rng=new RNG(w.seed+'/'+db.year+'/'+pid+'/'+kind+'/'+t.id,'negotiation'),competitors=negotiationCompetition(db,p,t,rng,kind),demand=negotiationDemand(db,p,t,kind,rng,competitors),rounds=negotiationRoundLimit(p);
  const neg={id,pid,teamId:t.id,kind,status:'open',stage:kind==='transfer'?'club':'player',sellerId:extra.sellerId||p.team||null,fee:extra.fee||0,clubCounter:null,round:0,maxRounds:rounds,patience:rounds,competitors,demand,counter:demand,lastOffer:null,lastUtility:null,history:[],createdDate:db.worldDate};
  store[id]=neg;const target=recruitmentTarget(db,pid);if(target){target.stage='negotiating';target.negotiationId=id}
  return {ok:true,neg,msg:p.name+' 측과 협상을 시작했습니다'};
}
function negotiationBudgetError(db,p,t,terms,kind){
  const current=kind==='renewal'&&p.contract?p.contract.salary:0,projected=payroll(db,t)-current+terms.salary,baseBudget=kind==='initial'&&typeof initialSalaryBudget==='function'?initialSalaryBudget(db,t):salaryBudget(db,t);
  if(kind==='initial'&&typeof initialOfferCheck==='function'){const x=initialOfferCheck(db,p,t,terms);if(!x.ok)return x.reason}
  else if(projected>baseBudget*1.2)return '연봉 예산을 크게 초과합니다';
  if((terms.signingBonus||0)>t.finance.cash)return '계약금을 지급할 현금이 부족합니다';
  const R=db.regions[t.region],imports=t.roster.filter(id=>db.players[id]&&db.players[id].region!==t.region).length;
  if(kind!=='renewal'&&p.region!==t.region&&imports>=(R.importLimit??2))return '외국인 선수 한도를 넘습니다';
  return null;
}
function negotiationCounter(db,neg,offer){
  const p=db.players[neg.pid],t=db.teams[neg.teamId],d=neg.demand,blend=(a,b,w)=>Math.round((a+(b-a)*w)*10)/10,rank={backup:0,prospect:1,competition:2,starter:3,core:4};
  const role=(rank[offer.promisedRole]||0)>=(rank[d.promisedRole]||0)?offer.promisedRole:d.promisedRole,years=offer.years===d.years?offer.years:(Math.abs(offer.years-d.years)<=1?d.years:Math.round((offer.years+d.years)/2));
  const option=d.option?.type==='player'?{type:'player',salary:blend(offer.salary,d.salary,.55)}:(offer.option?.type==='team'&&p.personality.ambition>=72?null:offer.option),buyout=d.buyout?Math.min(offer.buyout||d.buyout,d.buyout):offer.buyout;
  return normalizeContractTerms(db,p,t,Math.max(offer.salary*1.025,blend(offer.salary,d.salary,.68)),years,{signingBonus:Math.max(offer.signingBonus||0,blend(offer.signingBonus||0,d.signingBonus||0,.72)),bonuses:{performance:Math.max(offer.bonuses?.performance||0,(d.bonuses?.performance||0)*.78),title:Math.max(offer.bonuses?.title||0,(d.bonuses?.title||0)*.78),international:Math.max(offer.bonuses?.international||0,(d.bonuses?.international||0)*.78)},promisedRole:role,option,buyout});
}
function finalizeNegotiation(db,neg,terms){
  const p=db.players[neg.pid],t=db.teams[neg.teamId];
  if(neg.kind==='transfer'){const from=db.teams[neg.sellerId];if(!from||p.team!==from.id)return {ok:false,msg:'원소속 구단 상태가 변경되어 협상이 종료되었습니다'};doTransfer(db,p,from,t,neg.fee)}
  signContract(db,p,t,terms.salary,terms.years,terms);neg.status='accepted';neg.counter=null;neg.acceptedTerms=terms;neg.closedDate=db.worldDate;
  const target=recruitmentTarget(db,neg.pid);if(target){target.stage='closed';target.result='signed';target.negotiationId=neg.id}
  return {ok:true,msg:p.name+' 계약 합의 · '+money(terms.salary)+' · '+terms.years+'년'};
}
function submitNegotiationOffer(db,nid,terms){
  const neg=negotiationStore(db)[nid];if(!neg||neg.status!=='open'||neg.stage!=='player')return {ok:false,msg:'진행 중인 선수 협상이 아닙니다'};
  const p=db.players[neg.pid],t=db.teams[neg.teamId],offer=normalizeContractTerms(db,p,t,terms.salary,terms.years,terms),err=negotiationBudgetError(db,p,t,offer,neg.kind);if(err)return {ok:false,msg:err};if(neg.kind==='transfer'&&(offer.signingBonus||0)>Math.max(0,t.finance.cash-(neg.fee||0)))return {ok:false,msg:'이적료 지급 후 계약금을 지급할 현금이 부족합니다'};
  const util=offerUtility(db,p,t,offer,{renewal:neg.kind==='renewal'}),comp=neg.competitors.length?Math.max(...neg.competitors.map(x=>x.utility)):0,threshold=Math.max(offerAcceptanceThreshold(db,p),comp-.035);
  neg.round++;if(neg.lastUtility!=null&&util<neg.lastUtility-.03)neg.patience--;if(util<threshold-.22)neg.patience--;neg.lastOffer=offer;neg.lastUtility=util;neg.history.push({round:neg.round,side:'club',terms:offer,utility:Math.round(util*1000)/1000});
  if(util>=threshold){const r=finalizeNegotiation(db,neg,offer);neg.history.push({round:neg.round,side:'player',result:'accept'});return r}
  if(neg.round>=neg.maxRounds||neg.patience<=0||util<threshold-.62){neg.status='withdrawn';neg.reason='조건 차이가 커 협상 결렬';neg.closedDate=db.worldDate;const target=recruitmentTarget(db,neg.pid);if(target){target.stage='evaluated';target.result='negotiation_failed';target.negotiationId=null}return {ok:false,msg:p.name+' 측이 협상에서 철수했습니다'}}
  if((neg.kind==='fa'||neg.kind==='initial')&&neg.round>=2&&neg.competitors.length){
    const rival=neg.competitors[0],rt=db.teams[rival.teamId],gap=rival.utility-util,rrng=new RNG(db.world.seed+'/'+neg.id+'/'+neg.round,'negotiation-rival');
    if(rt&&!p.team&&!negotiationBudgetError(db,p,rt,rival.terms,'fa')&&rival.utility>=offerAcceptanceThreshold(db,p)-.02&&(gap>.08||rrng.chance(clamp(.16+Math.max(0,gap)*1.8,.12,.72)))){
      signContract(db,p,rt,rival.terms.salary,rival.terms.years,rival.terms);neg.status='lost';neg.reason='경쟁 구단 선택';neg.closedDate=db.worldDate;neg.history.push({round:neg.round,side:'player',result:'rival',teamId:rt.id});
      const target=recruitmentTarget(db,neg.pid);if(target){target.stage='closed';target.result='lost_to_rival';target.negotiationId=neg.id}
      return {ok:false,msg:p.name+' 선수가 협상 중 '+rt.name+'의 제안을 선택했습니다'};
    }
  }
  neg.counter=negotiationCounter(db,neg,offer);neg.history.push({round:neg.round,side:'player',result:'counter',terms:neg.counter});return {ok:true,counter:neg.counter,msg:p.name+' 측이 역제안했습니다'};
}
function acceptNegotiationCounter(db,nid){const neg=negotiationStore(db)[nid];if(!neg||neg.status!=='open'||!neg.counter)return {ok:false,msg:'수락할 역제안이 없습니다'};return submitNegotiationOffer(db,nid,neg.counter)}
function cancelNegotiation(db,nid){const neg=negotiationStore(db)[nid];if(!neg||neg.status!=='open')return '진행 중인 협상이 아닙니다';neg.status='cancelled';neg.closedDate=db.worldDate;const target=recruitmentTarget(db,neg.pid);if(target){target.stage='evaluated';target.result='cancelled';target.negotiationId=null}return db.players[neg.pid].name+' 협상을 종료했습니다'}
function sellerTransferAsk(db,p,from){if(p.contract?.buyout)return p.contract.buyout;const base=transferFee(db,p),starter=starterFor(db,from,p.role)===p,financeNeed=from.finance.cash<0?.88:1,exit=p.wantsOut?.82:1;return Math.round(base*(starter?1.12:.96)*financeNeed*exit*10)/10}
function mTransferBid(db,pid,fee){
  const t=myT(db),p=db.players[pid],from=p&&db.teams[p.team];if(!p||!from||from.id===t.id)return '이적 대상을 찾을 수 없습니다';if(fee>t.finance.cash)return '보유 자금이 부족합니다';
  const R=db.regions[t.region];if(p.region!==t.region&&t.roster.filter(id=>db.players[id]&&db.players[id].region!==t.region).length>=(R.importLimit??2))return '외국인 선수 한도를 넘습니다';
  const id=negotiationId(db,pid,'transfer'),store=negotiationStore(db),ask=sellerTransferAsk(db,p,from);let neg=store[id];
  if(!neg||neg.status!=='open'){const st=startNegotiation(db,pid,'transfer',{sellerId:from.id});if(!st.ok)return st.msg;neg=st.neg;neg.stage='club';neg.clubRounds=0}
  neg.clubRounds=(neg.clubRounds||0)+1;neg.history.push({round:neg.clubRounds,stage:'club',side:'buyer',fee});
  const acceptAt=ask*(from.finance.cash<0?.9:1);
  if(fee>=acceptAt){neg.fee=Math.round(fee*10)/10;neg.stage='player';neg.clubCounter=null;neg.history.push({round:neg.clubRounds,stage:'club',side:'seller',result:'accept',fee:neg.fee});return from.name+'과 이적료 '+money(neg.fee)+' 합의 · 이제 '+p.name+' 측과 개인조건을 협상하세요'}
  if(neg.clubRounds>=3&&fee<ask*.82){neg.status='withdrawn';neg.reason='이적료 협상 결렬';return from.name+': 이적료 협상 종료'}
  neg.clubCounter=Math.round(Math.max(fee*1.06,(fee+ask)/2)*10)/10;neg.history.push({round:neg.clubRounds,stage:'club',side:'seller',result:'counter',fee:neg.clubCounter});return from.name+' 역제안: '+money(neg.clubCounter);
}
function acceptSellerCounter(db,nid){const neg=negotiationStore(db)[nid];if(!neg||neg.status!=='open'||neg.stage!=='club'||!neg.clubCounter)return '수락할 구단 역제안이 없습니다';return mTransferBid(db,neg.pid,neg.clubCounter)}
function closeOpenNegotiationsForDeadline(db){
  for(const neg of Object.values(negotiationStore(db))){if(neg.status!=='open')continue;neg.status='expired';neg.reason='이적시장 마감';neg.closedDate=db.worldDate;const target=recruitmentTarget(db,neg.pid);if(target){target.stage='closed';target.result='deadline';target.negotiationId=neg.id}}
}
// ---- 이적료 / 직접 운영 ----
function transferFee(db,p){const left=p.contract?Math.max(1,p.contract.until-db.year+1):1;return Math.round(playerMarketValue(db,p)*(.62+.18*Math.min(3,left))*(p.wantsOut?.75:1)*10)/10}
function doTransfer(db,p,from,to,fee){
  assignPlayerToTeam(db,p,to);
  from.finance.cash=Math.round((from.finance.cash+fee)*10)/10;to.finance.cash=Math.round((to.finance.cash-fee)*10)/10;
  recordPlayerEvent(p,'transfer',db.year,{from:from.id,to:to.id,fee,date:db.worldDate});
  news(db,`이적: ${p.name} ${from.name} → ${to.name} (이적료 ${money(fee)})`);
}
function myT(db){return managedTeam(db)}
function mResign(db,pid,years){const r=startNegotiation(db,pid,'renewal');return r.msg}
function mRelease(db,pid){const t=myT(db),p=db.players[pid];const cost=p.contract&&p.contract.until>=db.year?p.contract.salary*(p.contract.until-db.year+1)*0.5:0;t.finance.buyout=(t.finance.buyout||0)+cost;removePlayerFromTeam(db,p);invalidateMarketDemand(db);p.contract=null;p.faYears=0;recordPlayerEvent(p,'release',db.year,{team:t.id,cost,date:db.worldDate});return p.name+' 방출'+(cost?' (해지금 '+money(cost)+')':'')}
function mOffer(db,pid,salary,years){const st=startNegotiation(db,pid,'fa');if(!st.ok)return st.msg;return submitNegotiationOffer(db,st.neg.id,{salary,years}).msg}
function mTransfer(db,pid,fee){return mTransferBid(db,pid,fee)}
// ---- 스카우팅: 관찰·경기 표본·보고서 노후화를 함께 추적한다 ----
function sameScoutZone(a,b){if(a===b)return true;return Object.values(INTL_ZONES).some(z=>z.includes(a)&&z.includes(b))}
function scoutingPower(db){const t=managedTeam(db);if(!t)return 1;return clamp(.78+(t.facility||2)*.06+((t.coach&&t.coach.analysis)||55)/250,.8,1.38)}
function baseScoutKnowledge(db,p){const me=managedTeam(db);if(!me)return 0;if(p.team===me.id||(p.team&&db.teams[p.team]&&db.teams[p.team].parent===me.id))return 100;if(p.region===me.region)return 22;return sameScoutZone(p.region,me.region)?10:4}
function ensureScoutReport(db,p){db.scout=db.scout||{};let r=db.scout[p.id];if(typeof r==='number')r=db.scout[p.id]={knowledge:r,lastSeenYear:db.year-1,lastSeenDate:null,observations:0,gamesSeen:0,competitions:{},snapshots:[]};if(!r)r=db.scout[p.id]={knowledge:baseScoutKnowledge(db,p),lastSeenYear:null,lastSeenDate:null,observations:0,gamesSeen:0,competitions:{},snapshots:[]};r.competitions=r.competitions||{};r.snapshots=r.snapshots||[];return r}
function knowledge(db,p){if(!db.world)return 100;const base=baseScoutKnowledge(db,p);if(base>=100)return 100;const r=ensureScoutReport(db,p);return Math.round(clamp(Math.max(base,r.knowledge||0),0,98))}
function scoutSample(db,p){let g=0,k=0,d=0,a=0,min=0,dmg=0,rating=0,csd=0,gd=0;const comps=new Set(),seasons=db.world?Object.values(db.world.seasons):[];for(const s of seasons){const st=s.pstats&&s.pstats[p.id];if(!st||!st.g)continue;g+=st.g;k+=st.k;d+=st.d;a+=st.a;min+=st.min||0;dmg+=st.dmg||0;rating+=st.ratingSum||0;csd+=st.csDiff||0;gd+=st.goldDiff||0;comps.add(s.comp)}if(!g&&p.career&&p.career.length){for(const st of p.career.slice(-3)){g+=st.g||0;k+=st.k||0;d+=st.d||0;a+=st.a||0;min+=st.min||0;dmg+=st.dmg||0;rating+=(st.rating||0)*(st.g||0);csd+=st.csDiff||0;gd+=st.goldDiff||0;if(st.comp)comps.add(st.comp)}}return {g,k,d,a,min,dmg,rating:g?rating/g:null,kda:(k+a)/Math.max(1,d),dpm:min?dmg/min:0,csDiff:g?csd/g:0,goldDiff:g?gd/g:0,competitions:[...comps]}}
function scoutingRisk(db,p){const me=managedTeam(db),k=knowledge(db,p),sample=scoutSample(db,p),tm=p.team&&db.teams[p.team];return (p.age<=20?2.5:0)+(me&&p.region!==me.region?2:0)+(tm&&(tm.division||1)===2?2:0)+(sample.g<8?3:sample.g<20?1.5:0)+(100-k)/20}
function obsAttr(db,p,a,k=knowledge(db,p)){if(k>=99)return p.attrs[a];const risk=scoutingRisk(db,p),n=((hashStr(p.id+a)%2001)/1000-1)*((1-k/100)*11+risk*.3);return Math.round(clamp(p.attrs[a]+n,20,99))}
function obsOvr(db,p,raw=false){const k=raw?Math.min(98,Math.max(knowledge(db,p),30)):knowledge(db,p);if(k>=99)return playerOvr(p);const role=p.role,gw=ROLE_GROUP_WEIGHTS[role]||ROLE_GROUP_WEIGHTS.MID,gs=g=>{const keys=ATTR_GROUPS[g].filter(a=>!(a==='smite_execution'&&role!=='JGL')&&!(a==='csing'&&role==='SUP'));return avg(keys.map(a=>obsAttr(db,p,a,k)))};let base=0,w=0;for(const [g,x] of Object.entries(gw)){base+=gs(g)*x;w+=x}base/=w||1;const keys=ROLE_KEY_ATTRS[role]||[],key=keys.length?avg(keys.map(a=>obsAttr(db,p,a,k))):base;return Math.round(clamp(base*.82+key*.18,20,99))}
function observePlayer(db,p,gain,opt={}){if(!p||p.retired)return;const r=ensureScoutReport(db,p),power=scoutingPower(db),diminish=.55+.45*(1-(r.knowledge||0)/100);r.knowledge=clamp((r.knowledge||0)+gain*power*diminish,0,98);r.observations=(r.observations||0)+1;r.gamesSeen=(r.gamesSeen||0)+(opt.games||0);if(opt.comp)r.competitions[opt.comp]=(r.competitions[opt.comp]||0)+(opt.games||1);r.lastSeenDate=db.worldDate;r.lastSeenYear=db.year;r.snapshots.push({year:db.year,date:db.worldDate,estimate:obsOvr(db,p,true),games:scoutSample(db,p).g});r.snapshots=r.snapshots.slice(-8)}
function ageScoutReports(db){for(const [id,r0] of Object.entries(db.scout||{})){const p=db.players[id];if(!p||p.retired){delete db.scout[id];continue}const r=typeof r0==='number'?ensureScoutReport(db,p):r0,base=baseScoutKnowledge(db,p),young=p.age<=20?1.12:1,me=managedTeam(db),decay=8*young+(me&&p.region===me.region?0:3);r.knowledge=Math.max(base,Math.round((r.knowledge||base)-decay));r.staleYears=Math.max(0,db.year-(r.lastSeenYear??db.year))}}
function scoutFromDay(db,s,day){const me=managedTeamId(db);if(!me)return;const myR=db.teams[me].region,comp=db.competitions[s.comp],visible=comp.international||s.region===myR;if(!visible)return;for(const m of day.matches){const involved=m.a===me||m.b===me,gain=involved?9:comp.international?4.5:(s.div===2?2.5:3.2);for(const tid of [m.a,m.b])for(const role of ROLES){const p=starterFor(db,db.teams[tid],role);if(p)observePlayer(db,p,gain,{comp:s.comp,games:m.res?m.res.games.length:1})}}}
function scoutAbilityRange(db,p){const k=knowledge(db,p),c=obsOvr(db,p),w=Math.max(1,Math.ceil((100-k)/10+scoutingRisk(db,p)*.35));return [Math.max(20,c-w),Math.min(99,c+w)]}
function scoutPotentialRange(db,p){const k=knowledge(db,p),risk=scoutingRisk(db,p),noise=((hashStr(p.id+'pot')%2001)/1000-1)*Math.max(1,(100-k)/13),center=clamp(p.pot+noise,playerOvr(p),99),w=Math.max(3,Math.ceil((100-k)/8+risk*.45));return [Math.max(playerOvr(p),Math.round(center-w)),Math.min(99,Math.round(center+w))]}
function scoutGrowthTrend(p){const a=(p.developmentTrail||[]).slice(-3);if(a.length<2)return {delta:null,label:'표본 부족'};const d=a[a.length-1].ovr-a[0].ovr;return {delta:d,label:d>=3?'빠른 상승':d>=1?'상승':d<=-2?'하락':d<0?'소폭 하락':'정체'}}
function scoutReport(db,p){const r=ensureScoutReport(db,p),sample=scoutSample(db,p),ability=scoutAbilityRange(db,p),potential=scoutPotentialRange(db,p),growth=scoutGrowthTrend(p),champions=Object.entries(p.pool||{}).sort((a,b)=>b[1].mastery-a[1].mastery).slice(0,5).map(([id,v])=>({id,mastery:Math.round(clamp(v.mastery+((hashStr(p.id+id)%1001)/1000-.5)*(100-knowledge(db,p))*.12,20,99))}));return {knowledge:knowledge(db,p),ability,potential,sample,growth,champions,lastSeenDate:r.lastSeenDate,staleYears:r.staleYears||0,observations:r.observations||0,gamesSeen:r.gamesSeen||0}}
function scoutPlayers(db,ids,amt,cost){const t=myT(db);if(t.finance.cash<cost)return '보유 자금이 부족합니다';t.finance.cash=Math.round((t.finance.cash-cost)*10)/10;for(const id of ids){const p=db.players[id];if(p){observePlayer(db,p,Math.min(24,amt*.55),{games:0,comp:'manual'});syncRecruitmentObservation(db,id)}}return `스카우팅 보고서 갱신 (${money(cost)})`}
function mHireCoach(db,cid){const t=myT(db),c=db.coachPool.find(x=>x.id===cid);if(!c)return '';const ps=psOf(db,t.region),fee=coachSalary(t.coach,ps);
  if(t.finance.cash<fee)return '보유 자금이 부족합니다 (기존 감독 위약금 '+money(fee)+')';t.finance.cash=Math.round((t.finance.cash-fee)*10)/10;const old=t.coach.name;hireCoach(db,t,c);return `${c.name} 감독 선임 (${old} 계약 해지, 위약금 ${money(fee)})`}
function mSponsor(db,id){const t=myT(db),o=(db.world.sponsorOffers||[]).find(x=>x.id===id);if(!o)return '';t.sponsor={...o,until:db.year+o.years-1};return `${o.name} ${o.type} 스폰서 계약 (${o.years}년)`}

function mFacility(db,key='training'){const t=myT(db);try{const c=upgradeFacility(db,t,key),f=ensureFacilities(t);return `시설 증설 완료: ${key} ${f[key]}단계 (${money(c)})`}catch(e){return e.message}}
function mHireStaff(db,sid){const t=myT(db),s=(db.staffPool||[]).find(x=>x.id===sid);if(!s)return '스태프를 찾을 수 없습니다';const ps=psOf(db,t.region),old=t.staff&&t.staff[s.role],fee=old?staffSalary(old,ps):0;if(t.finance.cash<fee)return `교체 위약금 ${money(fee)}이 부족합니다`;t.finance.cash=Math.round((t.finance.cash-fee)*10)/10;hireStaff(db,t,s);return `${STAFF_ROLES[s.role]} ${s.name} 선임${fee?` · 위약금 ${money(fee)}`:''}`}