// ===== 롤FM: 컨디션·폼·사기·팀 호흡 / 코칭스태프 / 시상·명예의 전당 / 구단주 목표 / 스폰서 =====
const GOAL_KO={title:'리그 우승',final:'결승 진출',playoffs:'플레이오프 진출',top_half:'상위권 (중위 이상)',survive:'강등 피하기'};
function pState(p){if(p.form===undefined){p.form=0;p.fatigue=10;p.morale=65}return p}
// 경기력 보정: 폼(±), 피로(−), 사기(±)
function playerMod(p){pState(p);return p.form/150-p.fatigue/600+(p.morale-65)/1000}
function teamSynergy(t){return t.synergy??50}
// 시리즈 후: 폼·피로·사기 갱신
function afterSeries(db,lines,rec){
  const by={};for(const l of lines)(by[l.pid]=by[l.pid]||[]).push(l);
  for(const [pid,ls] of Object.entries(by)){
    const p=db.players[pid]; if(!p)continue; pState(p);
    const k=ls.reduce((a,l)=>a+l.k+l.a*0.7,0), d=ls.reduce((a,l)=>a+l.d,0), w=ls.filter(l=>l.win).length, mv=ls.filter(l=>l.mvp).length;
    const perf=(k/Math.max(1,d)-2.2)*0.8+(w-(ls.length-w))*0.8+mv*1.5;
    p.form=clamp(p.form*0.7+perf+(hashStr(pid+rec.seed)%3-1),-10,10);
    p.fatigue=clamp(p.fatigue+ls.length*4,0,100);
    p.morale=clamp(p.morale+(w>ls.length/2?2:-2)+mv,0,100);
  }
  // 벤치 선수 사기 하락
  for(const tid of [rec.a,rec.b]){const t=db.teams[tid];if(!t)continue;
    for(const id of t.roster){if(by[id])continue;const p=db.players[id];if(p){pState(p);p.morale=clamp(p.morale-1,0,100)}}
    t.synergy=clamp(teamSynergy(t)+0.4,0,100);}
}
// 매 경기일: 기본 피로 회복. 훈련은 아래의 희소 포인트 배분으로만 관리한다
function dailyRecovery(db){
  for(const t of Object.values(db.teams)){ if(t.active===false)continue;
    const rec=4;
    for(const id of t.roster){const p=db.players[id];if(!p)continue;pState(p);p.fatigue=Math.max(0,p.fatigue-rec);p.form*=0.98}
  }
}
function trainingGrowthMul(t){return 1}
function scrimAnalysisBonus(t){return 0}

// ---- 코칭스태프 시장 ----
function coachSalary(c,ps){return Math.round((1+((c.draft+c.analysis+c.development)/3-50)/12)*ps*10)/10}
function ensureCoach(db,t,rng){if(!t.coach.id){t.coach.id='C'+hashStr(t.id+t.coach.name);t.coach.age=t.coach.age||40;t.coach.since=db.year}}
function genCoachPool(db,rng){
  db.coachPool=db.coachPool||[];
  // 은퇴 선수 중 판단력 좋은 선수는 코치로 전향
  for(const p of Object.values(db.players)){ if(!p.retired||p.retiredYear!==db.year-1||p.coachDone)continue;p.coachDone=true;
    if((p.peak||0)>=70&&rng.chance(0.35))db.coachPool.push({id:'C'+p.id,name:p.name,draft:Math.round(clamp((p.peak||70)-8+rng.normal(0,6),40,95)),analysis:Math.round(clamp((p.peak||70)-6+rng.normal(0,6),40,95)),development:Math.round(clamp(60+rng.normal(0,10),35,95)),age:p.age+1,exPlayer:true})}
  while(db.coachPool.length<12)db.coachPool.push({...genCoach(rng,62+rng.normal(0,6)),id:'C'+db.year+'_'+db.coachPool.length+rng.int(0,999),age:rng.int(30,50)});
  db.coachPool=db.coachPool.slice(-30);
}
function hireCoach(db,t,c){if(t.coach&&t.coach.id)db.coachPool.push({...t.coach});db.coachPool=db.coachPool.filter(x=>x.id!==c.id);t.coach={...c,since:db.year}}

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
      if(t.id===w.myTeam){rep.myGoal={goal:t.goal,ok};if(!ok&&t.owner.patience<=0){w.fired=true;ev(`${t.name} 구단주, 감독(플레이어) 해임 — 목표 "${GOAL_KO[t.goal]}" 연속 미달`)}}
      else if(!ok&&t.owner.patience<=0&&db.coachPool&&db.coachPool.length){
        const ps=psOf(db,t.region), best=db.coachPool.filter(c=>coachSalary(c,ps)<=t.finance.cash*0.2+3*ps).sort((a,b)=>(b.draft+b.analysis+b.development)-(a.draft+a.analysis+a.development))[0];
        if(best){const old=t.coach.name;hireCoach(db,t,best);t.owner.patience=2;rep.coaches.push({team:t.id,out:old,in:best.name})}}
    }
  }
}

// ---- 스폰서 계약 ----
function sponsorOffers(db,t){
  const ps=psOf(db,t.region), base=(t.fans||30)*0.35*ps, seed=hashStr(t.id+db.year);
  const brands=['Hangyeol Electronics','Nuri Telecom','Gaon Energy','Mir Foods','Raon Motors','Sejin Life','Yunseul Beauty','Dodam Games'];
  return [
    {id:'fixed',name:brands[seed%brands.length],type:'고정형',base:Math.round(base*1.0*10)/10,perWin:0,years:1},
    {id:'perf',name:brands[(seed>>3)%brands.length],type:'성과형',base:Math.round(base*0.6*10)/10,perWin:Math.round(0.9*ps*10)/10,years:1},
    {id:'long',name:brands[(seed>>6)%brands.length],type:'장기형',base:Math.round(base*0.9*10)/10,perWin:0,years:3}
  ];
}

// ---- 시상 · 명예의 전당 ----
function seasonAwards(db,w,rep){
  db.awards=db.awards||[];
  const give=(type,pid,comp)=>{if(!pid)return;db.awards.push({year:w.year,type,pid,comp});const p=db.players[pid];if(p)p.titles.push(`${w.year} ${comp} ${type}`);rep.awards.push({type,pid,comp})};
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