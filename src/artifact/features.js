// ===== LOL GM: Club goals / sponsorship / awards domain =====
const GOAL_KO={title:'리그 우승',final:'결승 진출',playoffs:'플레이오프 진출',top_half:'상위권 (중위 이상)',survive:'강등 피하기'};

// ---- 구단주 목표 ----
function setGoals(db){
  for(const R of Object.values(db.regions)){
    const ts=activeTeams(db,R.id,1).sort((a,b)=>teamStrength(db,b.id)-teamStrength(db,a.id)), n=ts.length;
    ts.forEach((t,i)=>{t.goal=i<1?'title':i<2?'final':i<Math.min(R.playoffTake||4,n)-1?'playoffs':i<n/2?'top_half':'survive'});
  }
}
function evalGoals(db,w,rep,ev){
  for(const R of Object.values(db.regions)){
    const s=finalSeason(w,R); if(!s||!s.done)continue;
    const reg=standings(db,s,'regular').map(x=>x.tid), po=s.stageData.playoffs, inPO=po?(po.seeds||[]):reg.slice(0,4);
    for(const t of activeTeams(db,R.id,1)){ if(!t.goal)continue;
      const rank=reg.indexOf(t.id), n=reg.length;
      const ok={title:s.champion===t.id,final:s.champion===t.id||s.runnerUp===t.id,playoffs:inPO.includes(t.id),top_half:rank>=0&&rank<n/2,survive:rank>=0&&rank<n-(R.relegate||1)}[t.goal];
      t.goalLog=[...(t.goalLog||[]),{year:w.year,goal:t.goal,ok}].slice(-6);
      if(ok){t.owner.patience=Math.min(3,(t.owner.patience??2)+1);t.owner.wealth=Math.min(99,t.owner.wealth+2)}
      else t.owner.patience=(t.owner.patience??2)-1;
      if(t.id===managedTeamId(db)){rep.myGoal={goal:t.goal,ok};if(!ok&&t.owner.patience<=0){w.fired=true;ev(`${t.name} 구단주, 헤드코치(플레이어) 해임 — 목표 "${GOAL_KO[t.goal]}" 연속 미달`)}}
      else if(!ok&&t.owner.patience<=0){const changed=aiManageStaff(db,t,new RNG((w.seed||'world')+'/'+w.year+'/'+t.id,'staff-review'));t.owner.patience=1;if(changed)ev(`${t.name}, 성적 부진 후 전문 코칭스태프 보강`)}
    }
  }
}

// ---- 스폰서 계약 ----
function sponsorMarketStrength(db,t){
  const R=db.regions[t.region],hype=R.metrics?.at(-1)?.hype??45;
  const reputation=clamp((t.fans||30)*.72+(t.reputation||R.strength||60)*.28,8,99);
  return {hype,reputation,base:psTeam(db,t)*(.16*hype+.32*reputation)};
}
function sponsorGoalFor(t){
  if(['title','final'].includes(t.goal))return 'final';
  if(['playoffs','top_half'].includes(t.goal))return 'playoffs';
  return 'survive';
}
function sponsorGoalLabel(goal){
  return {final:'국내 결승 진출',playoffs:'국내 플레이오프 진출',survive:'국내 리그 잔류'}[goal]||'국내 성적 목표';
}
function sponsorGoalReached(db,t,w,goal){
  if(!goal)return false;
  const ss=Object.values(w.seasons||{}).filter(s=>
    s.done&&s.region===t.region&&(s.div||1)===(t.division||1)&&
    !db.competitions[s.comp]?.international);
  if(!ss.length)return false;
  if(goal==='final')return ss.some(s=>s.champion===t.id||s.runnerUp===t.id);
  if(goal==='playoffs')return ss.some(s=>s.champion===t.id||s.runnerUp===t.id||
    (s.stageData?.playoffs?.seeds||[]).includes(t.id));
  return ss.some(s=>{
    const results=standings(db,s,'regular');const pos=results.findIndex(row=>row.tid===t.id);
    return pos>=0&&pos<results.length-Math.max(1,db.regions[t.region].relegate||1);
  });
}
function sponsorAchievementBonus(db,t,w){
  const sp=t.sponsor;
  return sp&&sp.until>=w.year&&sp.milestone&&sponsorGoalReached(db,t,w,sp.milestone)
    ?sp.milestoneBonus||0:0;
}
function sponsorOffers(db,t){
  const scale=sponsorMarketStrength(db,t),seed=hashStr(t.id+'|'+db.year+'|sponsor');
  const brands=['Hangyeol Electronics','Nuri Telecom','Gaon Energy','Mir Foods','Raon Motors','Sejin Life','Yunseul Beauty','Dodam Games'];
  const base=scale.base,ps=psTeam(db,t),goal=sponsorGoalFor(t);
  const moneyRound=value=>Math.round(value*10)/10;
  return [
    {id:'fixed',name:brands[seed%brands.length],type:'안정형',base:moneyRound(base),
      perWin:0,years:1,milestone:null,milestoneBonus:0},
    {id:'perf',name:brands[(seed>>>3)%brands.length],type:'성과형',base:moneyRound(base*.68),
      perWin:moneyRound(.23*ps),years:1,milestone:goal,milestoneBonus:moneyRound(base*.28)},
    {id:'long',name:brands[(seed>>>6)%brands.length],type:'장기형',base:moneyRound(base*.91),
      perWin:0,years:3,milestone:null,milestoneBonus:0}
  ];
}
function sponsorExpectedValue(db,t,sp){
  // Club directors can know the size of their previous regular-season slate,
  // not the private outcome of next year's matches.
  const previous=t.goalLog?.at(-1),success=previous?.ok?0.8:0.35;
  const R=db.regions[t.region],schedule=Math.max(10,(R.teams||10)*2-2);
  const estimatedWins=schedule*(t.goal==='title'||t.goal==='final'?.66:
    t.goal==='playoffs'?.55:t.goal==='survive'?.37:.48);
  return sp.base+(sp.perWin||0)*estimatedWins+
    (sp.milestoneBonus||0)*success;
}
function aiSelectSponsor(db,t){
  if(t.sponsor?.until>=db.year)return null;
  const offers=sponsorOffers(db,t),ps=psTeam(db,t),stressed=(t.finance?.cash||0)<10*ps;
  const selected=offers.map(sp=>{
    const expected=sponsorExpectedValue(db,t,sp);
    // A cash-strapped board values guaranteed revenue and contract length.
    const score=expected+(stressed?(sp.base*.35+(sp.years-1)*.18*ps):0)+
      (t.philosophy==='cost'?(sp.base*.13):0);
    return {sp,score};
  }).sort((a,b)=>b.score-a.score)[0].sp;
  t.sponsor={...selected,until:db.year+selected.years-1};
  return selected;
}

// ---- 시상 · 명예의 전당 ----
function seasonAwards(db,w,rep){
  db.awards=db.awards||[];
  const give=(type,pid,comp)=>{if(!pid)return;db.awards.push({year:w.year,type,pid,comp});const p=db.players[pid];if(p){p.titles.push(`${w.year} ${comp} ${type}`);p.reputation=Math.round(clamp((p.reputation||playerOvr(p))+(type==='MVP'||type==='대회 MVP'?3:1),20,99));recordPlayerEvent(p,'award',w.year,{award:type,competition:comp})}rep.awards.push({type,pid,comp})};
  for(const R of Object.values(db.regions)){
    const ss=Object.values(w.seasons).filter(s=>s.region===R.id&&(s.div||1)===1&&s.split&&s.done); if(!ss.length)continue;
    const agg={};for(const s of ss)for(const [pid,st] of Object.entries(s.pstats)){const a=agg[pid]||(agg[pid]={g:0,w:0,k:0,d:0,a:0,mvp:0});for(const k of ['g','w','k','d','a','mvp'])a[k]+=st[k]}
    const rows=Object.entries(agg).filter(([,a])=>a.g>=10).map(([pid,a])=>({pid,a,sc:a.mvp*2+(a.k+a.a)/Math.max(1,a.d)+a.w/a.g*4}));
    if(!rows.length)continue;
    rows.sort((x,y)=>y.sc-x.sc); give('MVP',rows[0].pid,R.leagueName);
    for(const role of ROLES){const r=rows.find(x=>db.players[x.pid]&&db.players[x.pid].role===role);if(r)give(`올프로 ${ROLE_KO[role]}`,r.pid,R.leagueName)}
    const rook=rows.find(x=>{const p=db.players[x.pid];return p&&!p.career.some(c=>c.year<w.year)});if(rook)give('신인상',rook.pid,R.leagueName);
  }
  for(const s of Object.values(w.seasons)){const c=db.competitions[s.comp];if(!c.international||!s.done||!s.champion)continue;
    const best=db.teams[s.champion].roster.map(id=>[id,s.pstats[id]]).filter(x=>x[1]).sort((a,b)=>b[1].mvp-a[1].mvp||((b[1].k+b[1].a)/Math.max(1,b[1].d))-((a[1].k+a[1].a)/Math.max(1,a[1].d)))[0];
    if(best)give('대회 MVP',best[0],c.name)}
  db.awards=db.awards.slice(-400);
}
function hallOfFame(db,p){
  db.hof=db.hof||[];
  const intl=p.titles.filter(x=>/월드|MSI|미드 시즌|퍼스트 스탠드/.test(x)&&!/MVP|올프로|신인/.test(x)).length, champs=p.titles.filter(x=>!/MVP|올프로|신인/.test(x)).length, mvps=p.titles.filter(x=>/MVP/.test(x)).length;
  if(intl>=2||champs>=5||mvps>=3||(p.peak||0)>=90){db.hof.push({pid:p.id,name:p.name,role:p.role,year:p.retiredYear,titles:champs,intl,mvps,peak:p.peak});return true}
  return false;
}
