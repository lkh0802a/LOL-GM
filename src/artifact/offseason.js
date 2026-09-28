// ===== LOL GM: Offseason orchestration =====
// Owns season closeout, retirement/growth handoff, market-close transition,
// promotion/relegation and next-season organizational reset.

// ---------- 오프시즌 1단계: 기록·성장·은퇴·승강·흥행·재정·사무국 ----------
function runOffseason(db){
  const w=db.world, rng=new RNG(w.seed+'/'+w.year,'offseason'), f=CHANGE_F[db.worldConfig.changes]??1;
  const rep={year:w.year,growth:[],retired:[],signings:[],resign:[],expired:[],transfers:[],events:[]};
  const ev=t=>{rep.events.push(t);news(db,t)};
  const games={}, champGames={};
  for(const s of Object.values(w.seasons)){
    const cname=db.competitions[s.comp].name+(s.label?' '+s.label:'');
    for(const [pid,st] of Object.entries(s.pstats)){const p=db.players[pid];if(!p||p.retired)continue;
      games[pid]=(games[pid]||0)+st.g;champGames[pid]=champGames[pid]||{};
      for(const [c,[n]] of Object.entries(st.champs))champGames[pid][c]=(champGames[pid][c]||0)+n;
      const tm=p.team&&db.teams[p.team],value=typeof playerMarketValue==='function'?playerMarketValue(db,p):0;
      p.career.push({year:w.year,seasonId:s.id,comp:s.comp,cname,team:p.team,region:tm?tm.region:playerActiveLocalRegion(p),division:tm?(tm.division||1):null,squad:playerSquadLabel(db,p),international:!!db.competitions[s.comp].international,ovr:playerOvr(p),reputation:p.reputation||0,marketValue:value,salary:p.contract?p.contract.salary:null,contractUntil:p.contract?p.contract.until:null,g:st.g,w:st.w,k:st.k,d:st.d,a:st.a,cs:st.cs,dmg:st.dmg,gold:st.gold||0,dmgTaken:st.dmgTaken||0,vision:st.vision||0,objectives:st.objectives||0,csDiff:st.csDiff||0,goldDiff:st.goldDiff||0,laneAdv:st.laneAdvGames?st.laneAdvSum/st.laneAdvGames:0,teamfightDmg:st.teamfightDmg||0,teamfights:st.teamfights||0,teamfightWins:st.teamfightWins||0,teamfightShare:st.g?st.teamfightShareSum/st.g:0,kp:st.g?st.kpSum/st.g:0,min:st.min,mvp:st.mvp,rating:st.g&&st.ratingSum?st.ratingSum/st.g:null});}
    if(s.champion)db.teams[s.champion].roster.forEach(pid=>{const p=db.players[pid];if(p){p.titles.push(`${w.year} ${cname}`);p.reputation=Math.round(clamp((p.reputation||playerOvr(p))+2,20,99));recordPlayerEvent(p,'title',w.year,{competition:cname,team:s.champion,international:!!db.competitions[s.comp].international})}});
  }
  rep.awards=[];rep.coaches=[];rep.hof=[];
  seasonAwards(db,w,rep);
  for(const p of Object.values(db.players)){const rows=(p.career||[]).filter(c=>c.year===w.year);if(!rows.length)continue;const gamesN=rows.reduce((a,c)=>a+c.g,0),rating=gamesN?rows.reduce((a,c)=>a+(c.rating||6.5)*c.g,0)/gamesN:6.5,intl=rows.some(c=>c.international),awardN=rep.awards.filter(a=>a.pid===p.id).length,target=clamp(playerOvr(p)*.72+rating*3.2+(intl?2:0)+awardN*2,20,99);p.reputation=Math.round(clamp((p.reputation||playerOvr(p))*.72+target*.28,20,99))}
  evalGoals(db,w,rep,ev);
  for(const R of Object.values(db.regions)){const s=finalSeason(w,R);if(s&&s.done)R.lastPlacement=placements(db,s)}
  for(const p of Object.values(db.players)){if(p.retired)continue;const d=growPlayer(db,p,rng,games[p.id]||0,champGames[p.id]||{});p.developmentTrail=p.developmentTrail||[];p.developmentTrail.push({year:w.year,ovr:playerOvr(p)});p.developmentTrail=p.developmentTrail.slice(-6);if(p.team)rep.growth.push({pid:p.id,d,ovr:playerOvr(p)})}
  rep.growth.sort((a,b)=>b.d-a.d);
  for(const p of Object.values(db.players)){ if(p.retired)continue;
    const o=playerOvr(p), R=db.regions[p.region],dev=ensurePlayerDevelopment(p),declineYears=p.age-(dev.peakAge+1);
    let pr=declineYears<=0?0:declineYears*.06*dev.declineRate+(p.age>=31?.18:0)+(R&&o<R.strength-8?.12:0);
    if(R&&o>=R.strength+5)pr*=.4;
    if(!p.team){p.faYears++;if(p.age>=23&&p.faYears>=2)pr+=0.5;if(p.faYears>=3)pr+=0.6;if(p.faYears>=2&&!p.career.length){delete db.players[p.id];continue}}
    if(rng.chance(pr)){p.retired=true;p.retiredYear=w.year;p.peak=Math.max(o,...p.career.map(c=>c.ovr||0));
      const wasTeam=p.team;
      if(p.team){const oldTeam=p.team;removePlayerFromTeam(db,p);rep.retired.push({pid:p.id,team:oldTeam,age:p.age,ovr:o})}
      if(!p.career.length&&!wasTeam){delete db.players[p.id];continue}
      recordPlayerEvent(p,'retirement',w.year,{team:wasTeam,age:p.age,peak:p.peak});if(hallOfFame(db,p))rep.hof.push(p.id);
      delete p.pool;delete p.tend;delete p.attrs;}
  }
  db.year=w.year+1;
  promotionRelegation(db,w,rng,ev);
  updateHype(db,w);
  closeFinances(db,w,rng,ev);
  if(f>0){
    officeDecisions(db,rng,f,ev);
    globalOffice(db,w,rng,f,ev);
  }
  ensureEven(db,rng,ev);
  rep.rookies=[];rep.rookieGlobal=rookieGlobalCohort(db);
  for(const R of Object.values(db.regions)){const cls=generateRookieClass(db,R,rng),ri=R.rookieIntake[R.rookieIntake.length-1];rep.rookies.push({region:R.id,count:cls.length,ids:cls.map(p=>p.id),label:ri.label,tiers:ri.tiers,profile:ri.profile})}
  const supplyErrs=talentSupplyErrors(db);if(supplyErrs.length)throw new Error('Talent supply invariant failed before market: '+supplyErrs.slice(0,8).join(' | '));
  for(const t of activeTeams(db)){if(t.id===managedTeamId(db))ensureStaffRoster(t);else ensureTeamStaff(db,t,rng)}ageStaff(db,rng);genStaffPool(db,rng);
  if(typeof ageScoutReports==='function')ageScoutReports(db);
  for(const t of activeTeams(db,null,1))aiManageStaff(db,t,rng);
  for(const t of activeTeams(db))aiManageTraining(db,t);
  // 시설은 플레이어/AI 공통으로 구단 경영진이 자동 관리한다. 전략적 선택이 아닌 유지·증설 행정은 직접 조작하지 않는다.
  for(const t of activeTeams(db,null,1)){const f=ensureFacilities(t),weights=t.philosophy==='youth'?{youth:1,training:.9,recovery:.45,analysis:.5}:t.philosophy==='win-now'?{analysis:1,recovery:.9,training:.55,youth:.3}:t.philosophy==='cost'?{training:.45,analysis:.4,recovery:.4,youth:.35}:{training:.75,analysis:.7,recovery:.65,youth:.6};
    const choices=Object.keys(weights).filter(k=>f[k]<5).sort((a,b)=>weights[b]-weights[a]);for(const k of choices){const cost=facilityCost(db,t,k),reserve=cost*(t.philosophy==='cost'?5:3);if(t.finance.cash>reserve&&rng.chance(.12+.22*weights[k])){upgradeFacility(db,t,k);break}}}
  // 선수 만족도: 한 시즌 누적 출전/역할/계약/성적/국제전/커리어 목표를 결산한다.
  for(const t of activeTeams(db)){t._pre=t.roster.slice();for(const id of t.roster){const p=db.players[id];if(!p||!p.contract)continue;pState(p);p.form=0;p.fatigue=5;}}
  if(typeof offseasonPlayerSatisfaction==='function')offseasonPlayerSatisfaction(db,w,rep,ev);
  w.sponsorOffers=sponsorOffers(db,db.teams[managedTeamId(db)]);
  w.report=rep; w.phase='market'; w.offers=[]; w.negotiations={}; w.marketLog=[];
  return rep;
}
// ---------- 오프시즌 2단계: 이적 시장 마감 ----------
function closeMarket(db){
  const w=db.world, rng=new RNG(w.seed+'/'+w.year,'market'), rep=w.report;
  const ev=t=>{rep.events.push(t);news(db,t)};
  if(typeof closeOpenNegotiationsForDeadline==='function')closeOpenNegotiationsForDeadline(db);
  contractMarket(db,rng,rep,ev);
  ensureEven(db,rng,ev);
  for(const t of activeTeams(db,null,1))aiManageOwnedReserve(db,t);
  for(const t of activeTeams(db)){aiReviewDepthChart(db,t);rebalanceAiRosterRoles(db,t)}
  for(const t of activeTeams(db)){const pre=t._pre||[];const now=ROLES.map(r=>starterFor(db,t,r)).filter(Boolean).map(p=>p.id);const changed=now.filter(id=>!pre.includes(id)).length;
    t.synergy=clamp(teamSynergy(t)*0.85+15-changed*8,10,100);delete t._pre;
    if(!t.sponsor&&t.id!==managedTeamId(db)&&rng.chance(0.5)){const o=sponsorOffers(db,t);t.sponsor={...rng.pick(o),until:db.year+0}}}
  for(const R of Object.values(db.regions)){const ts=activeTeams(db,R.id,1);R.teams=ts.length;if(ts.length)R.strength=Math.round(avg(ts.map(t=>teamStrength(db,t.id))))}
  rep.retired.slice(0,3).forEach(r=>news(db,`${db.players[r.pid].name} 은퇴 (${r.age}세)`));
  w.phase='preseason';
}
// 승강: 승강제는 1부 하위 ↔ 2부 상위 교체, 혼합은 프랜차이즈 보호 구단 제외
function promotionRelegation(db,w,rng,ev){
  for(const R of Object.values(db.regions)){
    if(R.system!=='relegation'&&R.system!=='mixed')continue;
    const s=finalSeason(w,R); if(!s||!s.done)continue;
    const k=Math.max(1,R.relegate||1);
    const down=standings(db,s,'regular').map(x=>x.tid).filter(t=>!(R.system==='mixed'&&db.teams[t].franchised)).slice(-k);
    const s2=finalSeason(w,R,2);
    const up=R.div2&&s2&&s2.done?placements(db,s2).filter(t=>promotionEligible(db,t)).slice(0,k):[];
    down.forEach((tid,i)=>{
      const t=db.teams[tid];
      if(up[i]){const u=db.teams[up[i]];t.division=2;u.division=1;u.franchised=false;u.license='open';t.fans=Math.round((t.fans||20)*0.8);u.fans=Math.round((u.fans||10)+8);ev(`${R.leagueName} 승강: ${u.name} 승격 ↔ ${t.name} 강등`)}
      else{foldTeam(db,t);const nt=genTeam(db,rng,R.id,R.strength-3);if(R.system==='mixed'){nt.franchised=false;nt.license='open'}ev(`${R.leagueName} 강등: ${t.name} → 신생팀 ${nt.name} 합류`)}
    });
    reconcileTier2Structure(db,rng,R,ev);
    inferRegionPolicy(db,R);
  }
}
