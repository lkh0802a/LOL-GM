// ===== LOL GM: 계약 / 재정 / FA 시장 (단위: 억 원) =====
const PAY_SCALE={}; // legacy compatibility only; new worlds derive pay scale in the policy engine.
const money=v=>(Math.round(v*10)/10).toFixed(1)+'억';
function psOf(db,rid){const R=db.regions[rid];return R?(R.payScale??.5):.5}
function psTeam(db,t){return psOf(db,t.region)*((t.division||1)===2?0.35:1)}
function marketSalary(db,p,rid){const o=playerOvr(p),ps=psOf(db,rid||p.region),up=Math.max(0,p.pot-o)*(p.age<=21?.04:.01);return Math.max(.3*ps,Math.round(.5*Math.exp((o-60)*.13)*(1+up)*ps*10)/10)}
function playerMarketValue(db,p){const o=playerOvr(p),rep=p.reputation??o,up=Math.max(0,p.pot-o),rid=p.team&&db.teams[p.team]?db.teams[p.team].region:p.region,ps=psOf(db,rid),ageMul=p.age<=20?1.2:p.age<=23?1.12:p.age<=26?1:p.age<=29?.82:.62,left=p.contract?Math.max(0,p.contract.until-db.year+1):0,contractMul=p.contract?1+Math.min(3,left)*.12:.72,raw=.65*Math.exp((o-60)*.115)*ps*(.78+rep/180)*(1+up*(p.age<=22?.045:.018))*ageMul*contractMul;return Math.round(Math.max(.2*ps,raw)*10)/10}
function asking(db,p,rid){return Math.round(marketSalary(db,p,rid)*(1+p.personality.ambition/400)*(.96+(p.reputation??playerOvr(p))/1800)*10)/10}
function signContract(db,p,t,salary,years){const old=p.team;assignPlayerToTeam(db,p,t);p.faYears=0;p.contract={salary:Math.round(salary*10)/10,until:db.year+years-1,signed:db.year};setRosterRole(db,p,recommendedRosterRole(db,p,t),'contract',true);ensureSatisfaction(p);if(old&&old!==t.id){p.satisfaction=clamp(Math.max(p.satisfaction,58),0,100);p.concernStreak=0;p.wantsOut=false;p.wantsOutReason=null}if(db.world)recordPlayerEvent(p,'contract',db.year,{team:t.id,salary:p.contract.salary,years,until:p.contract.until,renewal:old===t.id,rosterRole:p.rosterRole,date:db.worldDate})}
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
  t.facility=t.facility||clamp(Math.round(1+t.owner.wealth/30),1,4);
  t.finance=t.finance||{cash:Math.round((25+rng.range(0,35))*ps*10)/10,history:[],buyout:0};
}
function staffCost(db,t){return (2+coachSalary(t.coach,1))*psTeam(db,t)}
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
    const exp={salary:pay,staff:staffCost(db,t),ops:opsCost(db,t),facility:facilityUpkeep(db,t),buyout:t.finance.buyout||0,tax:spendingTax(db,t)};
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
function pFillScore(db,p,t){const domestic=p.region===t.region?2:0,age=p.age<=21?1:0,cost=Math.min(4,asking(db,p,t.region)/Math.max(.2,psOf(db,t.region)));return playerValue(db,p,t)+domestic+age-cost*.15}
function contractMarket(db,rng,rep,ev){
  const year=db.year, size=5+(db.worldConfig.subs||0), w=db.world, mine=w&&w.manage==='manual'?managedTeamId(db):null;
  const imports=t=>t.roster.filter(id=>db.players[id]&&db.players[id].region!==t.region).length;
  const release=(t,p,why)=>{ if(p.contract&&p.contract.until>=year){t.finance.buyout=(t.finance.buyout||0)+p.contract.salary*(p.contract.until-year+1)*0.5}
    removePlayerFromTeam(db,p);p.contract=null;p.faYears=0;};
  // 1) 만료 계약 처리
  for(const t of activeTeams(db)) for(const id of t.roster.slice()){
    const p=db.players[id]; if(!p||p.retired)continue;
    if(!p.contract){signContract(db,p,t,marketSalary(db,p,t.region),1);continue}
    if(p.contract.until>=year)continue;
    if(t.id===mine){release(t,p);rep.expired.push({pid:p.id,team:t.id,why:'재계약하지 않음'});continue}
    const isStarter=starterFor(db,t,p.role)===p,want=isStarter||p.rosterRole==='competition'||(p.age<=21&&p.pot-playerOvr(p)>=6)||(p.rosterRole==='backup'&&t.roster.length<7&&p.satisfaction>=50);
    const ask=asking(db,p,t.region), room=salaryBudget(db,t)-payroll(db,t)+p.contract.salary;
    ensureSatisfaction(p);const stay=rng.chance(clamp(0.42+0.3*(1-p.personality.ambition/100)+(teamStrength(db,t.id)>=db.regions[t.region].strength?0.1:-0.1)+(p.satisfaction-50)/125-(p.wantsOut?.22:0),.08,.92));
    if(want&&ask<=room&&stay){const yrs=contractYearsForPlayer(db,p,rng);signContract(db,p,t,ask,yrs);rep.resign.push({pid:p.id,team:t.id,salary:ask,years:yrs})}
    else {release(t,p);rep.expired.push({pid:p.id,team:t.id,why:!want?'재계약 제안 없음':ask>room?'연봉 이견':'FA 시장 도전'})}
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
          .map(p=>({p,v:playerValue(db,p,t),ask:asking(db,p,t.region)})).filter(x=>x.ask<=budgetLeft[t.id]&&(!cur||cur.wantsOut||cur.contract.until<=year||x.v>cv+5)).sort((a,b)=>b.v-a.v);
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
    const cand=activeTeams(db,t.region,1).filter(o=>o.id!==t.id&&o.id!==mine).map(o=>starterFor(db,o,role)).filter(p=>p&&p.contract&&playerValue(db,p,t)>playerValue(db,cur,t)+5)
      .map(p=>({p,fee:transferFee(db,p)})).filter(x=>x.fee<=t.finance.cash*0.6&&x.p.contract.salary<=budgetLeft[t.id]+cur.contract.salary).sort((a,b)=>playerValue(db,b.p,t)-playerValue(db,a.p,t))[0];
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

// ---- 이적료 / 직접 운영 ----
function transferFee(db,p){const left=p.contract?Math.max(1,p.contract.until-db.year+1):1;return Math.round(playerMarketValue(db,p)*(.62+.18*Math.min(3,left))*(p.wantsOut?.75:1)*10)/10}
function doTransfer(db,p,from,to,fee){
  assignPlayerToTeam(db,p,to);
  from.finance.cash=Math.round((from.finance.cash+fee)*10)/10;to.finance.cash=Math.round((to.finance.cash-fee)*10)/10;
  recordPlayerEvent(p,'transfer',db.year,{from:from.id,to:to.id,fee,date:db.worldDate});
  news(db,`이적: ${p.name} ${from.name} → ${to.name} (이적료 ${money(fee)})`);
}
function myT(db){return managedTeam(db)}
function mResign(db,pid,years){
  const t=myT(db),p=db.players[pid],ask=asking(db,p,t.region),rng=new RNG(db.world.seed+pid+db.year,'resign');
  if(payroll(db,t)-p.contract.salary+ask>salaryBudget(db,t)*1.2)return `${p.name}: 예산이 부족합니다 (요구 연봉 ${money(ask)})`;
  ensureSatisfaction(p);const ok=rng.chance(clamp(0.48+0.28*(1-p.personality.ambition/100)+(teamStrength(db,t.id)>=db.regions[t.region].strength?0.1:-0.1)+(years>=2?0.05:0)+(p.satisfaction-50)/120-(p.wantsOut?.25:0),.05,.95));
  if(!ok){p.contract.declined=true;return `${p.name}: 재계약 거절 — FA 시장에 나갑니다`}
  signContract(db,p,t,ask,years);return `${p.name}: 재계약 완료 (${money(ask)} · ${years}년)`;
}
function mRelease(db,pid){const t=myT(db),p=db.players[pid];const cost=p.contract&&p.contract.until>=db.year?p.contract.salary*(p.contract.until-db.year+1)*0.5:0;
  t.finance.buyout=(t.finance.buyout||0)+cost;removePlayerFromTeam(db,p);p.contract=null;p.faYears=0;recordPlayerEvent(p,'release',db.year,{team:t.id,cost,date:db.worldDate});return `${p.name} 방출${cost?` (해지금 ${money(cost)})`:''}`}
function mOffer(db,pid,salary,years){const w=db.world;w.offers=w.offers.filter(o=>o.pid!==pid);w.offers.push({pid,salary,years});return `${db.players[pid].name}에게 ${money(salary)} · ${years}년 제안 — 시장 마감 때 선수가 결정합니다`}
function mTransfer(db,pid,fee){
  const t=myT(db),p=db.players[pid],from=db.teams[p.team],ask=transferFee(db,p),rng=new RNG(db.world.seed+pid+fee,'bid');
  if(fee>t.finance.cash)return '보유 자금이 부족합니다';
  const R=db.regions[t.region];
  if(p.region!==t.region&&t.roster.filter(id=>db.players[id]&&db.players[id].region!==t.region).length>=(R.importLimit??2))return '외국인 선수 한도를 넘습니다';
  const starter=starterFor(db,from,p.role)===p;
  if(fee<ask*(starter?1.15:0.9)&&!(from.finance.cash<0&&fee>=ask*0.8))return `${from.name}: 거절 (${p.name} 이적료로 약 ${money(ask*(starter?1.15:0.9))} 이상을 원합니다)`;
  ensureSatisfaction(p);if(!p.wantsOut&&!rng.chance(clamp(.7+(55-p.satisfaction)/120,.35,.92)))return `${p.name}: 이적 거부 — 현 소속팀 잔류를 원합니다`;
  doTransfer(db,p,from,t,fee);return `${p.name} 영입 완료 (이적료 ${money(fee)}, 연봉 ${money(p.contract.salary)} 승계)`;
}
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
function scoutPlayers(db,ids,amt,cost){const t=myT(db);if(t.finance.cash<cost)return '보유 자금이 부족합니다';t.finance.cash=Math.round((t.finance.cash-cost)*10)/10;for(const id of ids){const p=db.players[id];if(p)observePlayer(db,p,Math.min(24,amt*.55),{games:0,comp:'manual'})}return `스카우팅 보고서 갱신 (${money(cost)})`}
function mHireCoach(db,cid){const t=myT(db),c=db.coachPool.find(x=>x.id===cid);if(!c)return '';const ps=psOf(db,t.region),fee=coachSalary(t.coach,ps);
  if(t.finance.cash<fee)return '보유 자금이 부족합니다 (기존 감독 위약금 '+money(fee)+')';t.finance.cash=Math.round((t.finance.cash-fee)*10)/10;const old=t.coach.name;hireCoach(db,t,c);return `${c.name} 감독 선임 (${old} 계약 해지, 위약금 ${money(fee)})`}
function mSponsor(db,id){const t=myT(db),o=(db.world.sponsorOffers||[]).find(x=>x.id===id);if(!o)return '';t.sponsor={...o,until:db.year+o.years-1};return `${o.name} ${o.type} 스폰서 계약 (${o.years}년)`}

function mFacility(db){const t=myT(db);if((t.facility||2)>=5)return '이미 최고 단계입니다';const c=facilityCost(db,t);if(t.finance.cash<c)return `보유 자금이 부족합니다 (${money(c)} 필요)`;t.finance.cash=Math.round((t.finance.cash-c)*10)/10;t.facility=(t.facility||2)+1;return `훈련 시설 ${t.facility}단계로 증설 (${money(c)})`}