// ===== LOL GM: Player contract / FA market domain =====
// Owns market valuation, contract terms, options, signing and AI contract/FA market behavior.

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
  salary=Math.max(.1,Math.round(+salary*10)/10);years=clamp(Math.round(+years||1),1,3);
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
  const strength=(teamStrength(db,t.id)-db.regions[t.region].strength)/12,fac=((t.facility||2)-2)*.08,coach=(staffProfile(t).development-55)/160,intl=teamInternationalAppeal(db,t),stability=Math.min(3,offer.years||1)*.055;
  const home=db.worldConfig.universalLanguage?(p.region===t.region?.04:0):(p.region===t.region?.22:-.08),amb=p.personality.ambition/100,career=playerCareerGoal(p);
  let careerFit=0;if(career==='development')careerFit=fac+coach+(role==='prospect'||role==='competition'?.16:0);else if(career==='starter')careerFit=['core','starter'].includes(role)?.22:-.12;else if(career==='international')careerFit=intl*.18;else if(career==='titles')careerFit=Math.max(0,strength)*.16+intl*.1;else careerFit=stability;
  const option=offer.option?.type==='player'?.07:offer.option?.type==='team'?-.025:0,buyout=offer.buyout?clamp(offer.buyout/Math.max(.2,playerMarketValue(db,p)),.4,4)*-.018:0;
  const currentPenalty=opt.renewal?(p.satisfaction-50)/170+(p.managerTrust-50)/105+(p.managerRelationship-50)/190-(p.wantsOut?.4:0):0;
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
  if(offer.signingBonus&&t.finance){t.finance.cash=Math.round((t.finance.cash-offer.signingBonus)*10)/10;recordFinancePrepaid(t,'signingBonus',offer.signingBonus)}
  setRosterRole(db,p,offer.promisedRole,'contract',true);ensureSatisfaction(p);if(old!==t.id){p.satisfaction=clamp(Math.max(p.satisfaction,58),0,100);p.managerRelationship=55;p.managerTrust=52;p.concernStreak=0;p.wantsOut=false;p.wantsOutReason=null}else{p.managerRelationship=clamp(p.managerRelationship+2,0,100);p.managerTrust=clamp(p.managerTrust+3,0,100)}
  if(db.world)recordPlayerEvent(p,'contract',db.year,{team:t.id,salary:p.contract.salary,years:offer.years,until:p.contract.until,renewal:old===t.id,rosterRole:p.rosterRole,signingBonus:offer.signingBonus,buyout:offer.buyout,option:offer.option,date:db.worldDate});
  return p.contract;
}
function payroll(db,t){return t.roster.reduce((a,id)=>a+((db.players[id]&&db.players[id].contract)?db.players[id].contract.salary:0),0)}
function topFivePayroll(db,t){const top=[];for(const id of t.roster){const p=db.players[id];if(!p||!p.contract)continue;const s=p.contract.salary;let i=0;while(i<top.length&&top[i]>=s)i++;top.splice(i,0,s);if(top.length>5)top.pop()}return top.reduce((a,b)=>a+b,0)}
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

function eligibleFillFAs(db,t,role=null){
  const room=Math.max(0,nonLocalLimitForTeam(db,t)-teamNonLocalCount(db,t));
  return Object.values(db.players).filter(p=>!p.retired&&!p.team&&(!role||p.role===role)&&(isLocalPlayer(p,t.region)||room>0))
    .sort((a,b)=>(pFillScore(db,b,t)-pFillScore(db,a,t)));
}
function aiMarketObservation(db,p,t){
  const perf=recentMarketPerformance(db,p),sample=Math.min(30,perf.games),foreign=!isLocalPlayer(p,t.region),uncertainty=(foreign?4.5:2.5)+(sample<6?3:sample<15?1.5:0),n=((hashStr(t.id+'|'+p.id+'|'+db.year+'|ability')%2001)/1000-1);
  const ability=Math.round(clamp(playerOvr(p)+n*uncertainty,20,99)),n2=((hashStr(t.id+'|'+p.id+'|'+db.year+'|potential')%2001)/1000-1),ageUpside=p.age<=19?9:p.age<=21?6:p.age<=23?3:1;
  const potential=Math.round(clamp(ability+ageUpside+n2*(foreign?5:3)+(p.reputation-ability)*.08,ability,99));
  return {ability,potential,uncertainty:Math.round(uncertainty*10)/10};
}
function aiMarketValue(db,p,t){const est=aiMarketObservation(db,p,t),up=Math.max(0,est.potential-est.ability),w={'win-now':0.1,'youth':0.6,'balanced':0.3,'superstar':0.15,'cost':0.35}[t.philosophy]||0.3;return est.ability+up*w-(t.philosophy==='youth'&&p.age>26?2:0)}
function pFillScore(db,p,t){const domestic=isLocalPlayer(p,t.region)?2:0,age=p.age<=21?1:0,cost=Math.min(4,asking(db,p,t.region)/Math.max(.2,psOf(db,t.region)));return aiMarketValue(db,p,t)+domestic+age-cost*.15}
function optionDecision(db,p,t){
  const o=p.contract&&p.contract.option;if(!o||o.year!==db.year)return false;
  const next={...p.contract,salary:o.salary,years:1,signingBonus:0,bonuses:p.contract.bonuses||{},option:null,promisedRole:p.contract.promisedRole||p.rosterRole};
  if(o.type==='team')return contractExpectedValue(next)<=asking(db,p,t.region)*1.08||starterFor(db,t,p.role)===p;
  if(o.type==='player')return offerUtility(db,p,t,next,{renewal:true})>=offerAcceptanceThreshold(db,p)-.06;
  return false;
}
function shouldAutoExerciseOption(db,p,t,mine){
  const o=p.contract&&p.contract.option;if(!o||o.year!==db.year)return false;
  if(t.id===mine&&o.type==='team')return false;
  return optionDecision(db,p,t);
}
function exerciseContractOption(db,p,t,source='engine'){
  const o=p.contract&&p.contract.option;if(!o||o.year!==db.year)return false;p.contract.until=db.year;p.contract.salary=o.salary;p.contract.years=(p.contract.years||1)+1;p.contract.option=null;
  recordPlayerEvent(p,'contract_option',db.year,{team:t.id,type:o.type,salary:o.salary,source,date:db.worldDate});return true;
}
function commitMarketPlayerAction(db,command){
  const result=commitWorldAction(db,command);
  if(!result.ok)throw new Error('Market player transaction failed: '+(result.errors||[]).join(' · '));
  return result;
}
function signMarketContract(db,p,t,salary,years,terms={},kind='fa',actor='ai'){
  return commitMarketPlayerAction(db,{type:'player.sign',pid:p.id,teamId:t.id,salary,years,terms,kind,actor}).contract;
}
function contractMarket(db,rng,rep,ev){
  const year=db.year, size=5+(db.worldConfig.subs||0), w=db.world, mine=w&&w.manage==='manual'?managedTeamId(db):null;
  const imports=t=>teamNonLocalCount(db,t);
  const release=(t,p,why)=>commitMarketPlayerAction(db,{type:'player.release',pid:p.id,teamId:t.id,
    mode:t.id===mine&&(!p.contract||p.contract.until<year)?'expired':'market',actor:'system'});
  // 1) 옵션 및 만료 계약 처리
  for(const t of activeTeams(db))for(const id of t.roster.slice()){const p=db.players[id];if(!p||!p.contract||p.contract.until>=year)continue;const opt=p.contract.option;
    if(opt&&opt.year===year&&shouldAutoExerciseOption(db,p,t,mine))commitMarketPlayerAction(db,{type:'player.option',pid:p.id,teamId:t.id,actor:opt.type==='player'?'system':'ai'});
  }
  for(const t of activeTeams(db)) for(const id of t.roster.slice()){
    const p=db.players[id]; if(!p||p.retired)continue;
    if(!p.contract){release(t,p);rep.expired.push({pid:p.id,team:t.id,why:'무계약 상태 — FA 전환'});continue}
    if(p.contract.until>=year)continue;
    if(t.id===mine){release(t,p);rep.expired.push({pid:p.id,team:t.id,why:'재계약하지 않음'});continue}
    const isStarter=starterFor(db,t,p.role)===p,want=isStarter||p.rosterRole==='competition'||(p.age<=21&&p.pot-playerOvr(p)>=6)||(p.rosterRole==='backup'&&t.roster.length<7&&p.satisfaction>=50);
    const ask=asking(db,p,t.region),room=salaryBudget(db,t)-payroll(db,t)+p.contract.salary,yrs=contractYearsForPlayer(db,p,rng),proposal=normalizeContractTerms(db,p,t,ask*rng.range(.96,1.08),yrs,{promisedRole:recommendedRosterRole(db,p,t),option:rng.chance(.18)?{type:rng.chance(.55)?'team':'player'}:null});
    ensureSatisfaction(p);const stay=offerUtility(db,p,t,proposal,{renewal:true})+rng.normal(0,.06)>=offerAcceptanceThreshold(db,p);
    if(want&&proposal.salary<=room&&stay){signMarketContract(db,p,t,proposal.salary,yrs,proposal,'renewal','ai');rep.resign.push({pid:p.id,team:t.id,salary:proposal.salary,years:yrs,terms:proposal})}
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
        const cand=fas.filter(p=>p.role===role&&(isLocalPlayer(p,t.region)||(playerOvr(p)>=R.strength+importGap&&imports(t)<nonLocalLimitForTeam(db,t))))
          .map(p=>({p,v:aiMarketValue(db,p,t),ask:asking(db,p,t.region)})).filter(x=>x.ask<=budgetLeft[t.id]&&(!cur||cur.wantsOut||cur.contract.until<=year||x.v>cv+5)).sort((a,b)=>b.v-a.v);
        const c=cand[0]; if(!c)continue;
        const sal=Math.round(c.ask*(['win-now','superstar'].includes(t.philosophy)?rng.range(1,1.15):rng.range(0.95,1.05))*10)/10;
        (offers[c.p.id]=offers[c.p.id]||[]).push({t,sal,starter:true});
      }
    }
    for(const [pid,os] of Object.entries(offers)){
      const p=db.players[pid], ask=asking(db,p);
      const u=o=>o.sal/ask*1.2+(teamStrength(db,o.t.id)-db.regions[o.t.region].strength)/10*p.personality.ambition/100+(o.t.fans||30)/100*0.4+(o.starter?0.5:0)+(db.worldConfig.universalLanguage?(o.t.region===p.region?0.08:0):(o.t.region===p.region?0.4:-0.2))+(db.regions[o.t.region].slots||1)*0.05+rng.normal(0,0.1);
      const best=os.map(o=>({o,v:u(o)})).sort((a,b)=>b.v-a.v)
        .find(x=>budgetLeft[x.o.t.id]>=x.o.sal&&!localRegistrationError(db,x.o.t,p));
      if(!best)continue;
      const t=best.o.t,yrs=best.o.years?best.o.years:contractYearsForPlayer(db,p,rng);
      const prev=starterFor(db,t,p.role);
      // Multiple market offers can be based on the same earlier import count.
      // Recheck with the shared action validator and skip an obsolete offer.
      const signed=commitWorldAction(db,{type:'player.sign',pid:p.id,teamId:t.id,
        salary:best.o.sal,years:yrs,kind:'fa',actor:best.o.mine?'manager':'ai',terms:{}});
      if(!signed.ok)continue;
      if(best.o.mine)w.marketLog.push(`${p.name}: ${best.o.t.id===mine?'영입 성공':'다른 구단 선택'}`);
      budgetLeft[t.id]-=best.o.sal;
      rep.signings.push({pid:p.id,team:t.id,salary:best.o.sal,years:yrs,rookie:p.age<=19&&!p.career.length,import:!isLocalPlayer(p,t.region),offers:os.length,out:null});
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
    if(contractedMoveError(db,cur))continue;
    const cand=activeTeams(db,t.region,1).filter(o=>o.id!==t.id&&o.id!==mine).map(o=>starterFor(db,o,role)).filter(p=>p&&p.contract&&!contractedMoveError(db,p)&&aiMarketValue(db,p,t)>playerValue(db,cur,t)+5)
      .map(p=>({p,fee:transferFee(db,p)})).filter(x=>x.fee<=t.finance.cash*0.6&&x.p.contract.salary<=budgetLeft[t.id]+cur.contract.salary).sort((a,b)=>aiMarketValue(db,b.p,t)-aiMarketValue(db,a.p,t))[0];
    if(!cand)continue;
    const seller=db.teams[cand.p.team];
    if(localRegistrationError(db,t,cand.p)||localRegistrationError(db,seller,cur))continue;
    if(!(seller.finance.cash<10*psTeam(db,seller)||cand.p.wantsOut||rng.chance(.2)))continue;
    commitMarketPlayerAction(db,{type:'player.transfer',pid:cand.p.id,fromId:seller.id,teamId:t.id,fee:cand.fee,actor:'ai'});deals++;
    rep.transfers.push({pid:cand.p.id,from:seller.id,to:t.id,fee:cand.fee});
    if(t.roster.length>size){commitMarketPlayerAction(db,{type:'player.transfer',pid:cur.id,fromId:t.id,teamId:seller.id,fee:0,actor:'ai'});rep.transfers[rep.transfers.length-1].swap=cur.id}
  }
  // 3) 로스터 채우기 / 정리
  for(const t of activeTeams(db)){
    for(const role of ROLES) if(!starterFor(db,t,role)){
      const fa=eligibleFillFAs(db,t,role)[0];
      if(!fa)throw new Error('Talent supply invariant failed during market: '+t.id+' '+role+' has no eligible free agent');
      signMarketContract(db,fa,t,asking(db,fa,t.region),contractYearsForPlayer(db,fa,rng),{},'fa',t.id===mine?'system':'ai');rep.signings.push({pid:fa.id,team:t.id,salary:fa.contract.salary,years:fa.contract.until-year+1,rookie:fa.age<=19,fill:true});
    }
    while(t.roster.length<size){
      const fa=eligibleFillFAs(db,t)[0];
      if(!fa)throw new Error('Talent supply invariant failed during market: '+t.id+' has no eligible free agent for bench slot');
      signMarketContract(db,fa,t,asking(db,fa,t.region),contractYearsForPlayer(db,fa,rng),{},'fa',t.id===mine?'system':'ai');rep.signings.push({pid:fa.id,team:t.id,salary:fa.contract.salary,years:fa.contract.until-year+1,rookie:fa.age<=19,fill:true});
    }
    while(t.roster.length>size){const b=t.roster.map(id=>db.players[id]).filter(x=>starterFor(db,t,x.role)!==x).sort((a,b)=>playerValue(db,a,t)-playerValue(db,b,t))[0];if(!b)break;release(t,b)}
    // SFR 하한은 강제 연봉 인상이 아니라 분배 자격 기준으로만 사용한다.
  }
}
// 리그 팀 수를 짝수로 유지 (1부·2부 각각)
