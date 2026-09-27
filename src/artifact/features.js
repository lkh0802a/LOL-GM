// ===== LOL GM: 컨디션·폼·사기·팀 호흡 / 코칭스태프 / 시상·명예의 전당 / 구단주 목표 / 스폰서 =====
const GOAL_KO={title:'리그 우승',final:'결승 진출',playoffs:'플레이오프 진출',top_half:'상위권 (중위 이상)',survive:'강등 피하기'};
function pState(p){if(p.form===undefined)p.form=0;if(p.fatigue===undefined)p.fatigue=10;if(p.morale===undefined)p.morale=65;if(p.condition===undefined)p.condition=96;if(p.sharpness===undefined)p.sharpness=55;if(p.teamAdaptation===undefined)p.teamAdaptation=p.team?60:50;if(p.tacticalAdaptation===undefined)p.tacticalAdaptation=p.team?60:50;return p}
// 상태는 기본 실력을 보정하지만 압도하지 않도록 총합을 제한한다.
function playerMod(p){pState(p);const v=p.form/250-p.fatigue/900+(p.condition-92)/1200+(p.morale-65)/1800+(p.sharpness-60)/1700+((p.teamAdaptation+p.tacticalAdaptation)/2-60)/2200;return clamp(v,-.11,.09)}
function teamSynergy(t){return t.synergy??50}
const CAREER_GOAL_KO={development:'성장 기회',starter:'주전 정착',international:'국제대회 출전',titles:'우승 경쟁',stability:'안정적인 커리어'};
const SAT_REASON_KO={playing_time:'출전 시간 부족',reserve:'2군 배치',contract:'계약/연봉 불만',team_results:'팀 성적 불만',role:'역할 불만',international:'국제대회 기회 부족',career_goal:'커리어 목표 불일치'};
function ensureSatisfaction(p){
  pState(p);if(p.satisfaction===undefined)p.satisfaction=70;if(!Array.isArray(p.satisfactionReasons))p.satisfactionReasons=[];
  if(p.concernStreak===undefined)p.concernStreak=0;if(p.wantsOut===undefined)p.wantsOut=false;if(p.wantsOutReason===undefined)p.wantsOutReason=null;
  playerCareerGoal(p);return p;
}
function usageFor(p,year){
  p.usage=p.usage&&p.usage.year===year?p.usage:{year,teamGames:0,games:0,series:0,wins:0,teamWins:0,intlGames:0,teamIntlGames:0,firstTeamGames:0,reserveGames:0};
  return p.usage;
}
function actualPlayShare(p){const u=p.usage;return u&&u.teamGames?u.games/u.teamGames:0}
function satisfactionLabel(v){return v>=80?'매우 만족':v>=65?'만족':v>=48?'보통':v>=32?'불만':'매우 불만'}
function satisfactionIssues(db,p,opt={}){
  ensureSatisfaction(p);const t=p.team&&db.teams[p.team],usageYear=opt.year??db.year,u=p.usage&&p.usage.year===usageYear?p.usage:null,out=[];
  if(!t)return out;
  const exp=expectedPlayShare(p,t),actual=u&&u.teamGames>=8?actualPlayShare(p):null;
  if(actual!==null&&u.teamGames>=14&&p.rosterRole==='core'&&exp-actual>.28)out.push({code:'playing_time',severity:clamp((exp-actual)*24,3,10)});
  else if(actual!==null&&u.teamGames>=16&&p.rosterRole==='starter'&&exp-actual>.32)out.push({code:'playing_time',severity:clamp((exp-actual)*20,3,9)});
  else if(actual!==null&&u.teamGames>=24&&p.rosterRole==='competition'&&actual<.03&&p.personality.ambition>=80)out.push({code:'playing_time',severity:3});
  if(t.parent&&p.rosterRole!=='prospect'&&(p.age>=23||(p.reputation||0)>=74)&&p.personality.ambition>=62)out.push({code:'reserve',severity:3+Math.max(0,(p.reputation||60)-72)/8});
  if(p.contract){const fair=marketSalary(db,p,t.region);if(fair>0&&p.contract.salary/fair<.62&&p.personality.ambition>=60)out.push({code:'contract',severity:clamp((.62-p.contract.salary/fair)*20,2,7)})}
  if(u&&u.teamGames>=18&&u.teamWins/u.teamGames<.35&&p.personality.ambition>=76)out.push({code:'team_results',severity:clamp((.35-u.teamWins/u.teamGames)*20+2,2,6)});
  const rec=recommendedRosterRole(db,p,t),rr=(SQUAD_ROLE_ORDER[rec]??2)-(SQUAD_ROLE_ORDER[p.rosterRole]??2);
  if(rr>=2&&['core','starter'].includes(rec)&&p.personality.ambition>=68)out.push({code:'role',severity:Math.min(6,rr*2)});
  if(opt.offseason){
    const goal=playerCareerGoal(p),rows=(p.career||[]).filter(c=>c.year===opt.year),intl=rows.some(c=>c.international&&c.g>0),titles=(p.careerEvents||[]).some(e=>e.year===opt.year&&e.type==='title'),firstGames=rows.filter(c=>c.squad==='1군').reduce((a,c)=>a+c.g,0);
    if(goal==='international'&&!intl&&(p.reputation||0)>=76&&p.personality.ambition>=72)out.push({code:'international',severity:4});
    if(goal==='titles'&&!titles&&p.personality.ambition>=82)out.push({code:'career_goal',severity:3});
    if(goal==='starter'&&['core','starter'].includes(p.rosterRole)&&firstGames<Math.max(5,(u?u.teamGames:0)*.4))out.push({code:'career_goal',severity:3});
    if(goal==='development'&&p.age<=21&&rows.length&&rows.reduce((a,c)=>a+c.g,0)<4&&p.rosterRole!=='prospect')out.push({code:'career_goal',severity:2});
  }
  return out.sort((a,b)=>b.severity-a.severity);
}
function applySatisfaction(db,p,opt={}){
  ensureSatisfaction(p);const issues=satisfactionIssues(db,p,opt),usageYear=opt.year??db.year,u=p.usage&&p.usage.year===usageYear?p.usage:null;
  let delta=issues.length?-Math.min(opt.offseason?7:1.4,issues.reduce((a,x)=>a+x.severity,0)*(opt.offseason?.16:.035)):0;
  if(!issues.length&&u&&u.teamGames>=4){const actual=actualPlayShare(p),exp=expectedPlayShare(p);delta=Math.min(opt.offseason?5:1.2,1+(actual-exp)*3)}
  p.satisfaction=clamp(p.satisfaction+delta,0,100);p.satisfactionReasons=issues.map(x=>x.code);
  if(p.satisfaction<28&&issues.length&&['core','starter'].includes(p.rosterRole))p.concernStreak=(p.concernStreak||0)+1;else p.concernStreak=Math.max(0,(p.concernStreak||0)-1);
  if(!p.wantsOut&&p.satisfaction<=15&&p.concernStreak>=10&&issues.length&&['core','starter'].includes(p.rosterRole)){p.wantsOut=true;p.wantsOutReason=issues[0].code;recordPlayerEvent(p,'transfer_request',db.year,{reason:p.wantsOutReason,team:p.team,date:db.worldDate})}
  else if(p.wantsOut&&p.satisfaction>=50){p.wantsOut=false;const why=p.wantsOutReason;p.wantsOutReason=null;p.concernStreak=0;recordPlayerEvent(p,'transfer_request_withdrawn',db.year,{reason:why,team:p.team,date:db.worldDate})}
  const target=52+p.satisfaction*.2;p.morale=clamp(p.morale+(target-p.morale)*.05,0,100);
  return {delta,issues};
}
function updatePlayerUsage(db,s,rec,lines){
  const comp=db.competitions[s.comp],n=rec.games.length,by={};for(const l of lines)(by[l.pid]=by[l.pid]||[]).push(l);
  for(const tid of [rec.a,rec.b]){const t=db.teams[tid];if(!t)continue;const teamWins=rec.games.filter(g=>g.winner===tid).length;
    for(const id of t.roster){const p=db.players[id];if(!p)continue;ensureSatisfaction(p);const u=usageFor(p,s.year);u.teamGames+=n;u.teamWins+=teamWins;if(comp.international)u.teamIntlGames+=n;
      const ls=by[id]||[];u.games+=ls.length;u.series++;u.wins+=ls.filter(x=>x.win).length;if(comp.international)u.intlGames+=ls.length;if(t.parent)u.reserveGames+=ls.length;else u.firstTeamGames+=ls.length;
      if(u.teamGames>=16&&u.series%6===0)applySatisfaction(db,p);
    }
  }
}
function onSquadMoveSatisfaction(db,p,check){
  ensureSatisfaction(p);if(check.kind==='senddown'){const pen=p.rosterRole==='prospect'?1:p.rosterRole==='backup'?2:p.rosterRole==='competition'?3:6;p.satisfaction=clamp(p.satisfaction-pen,0,100);p.satisfactionReasons=Array.from(new Set([...p.satisfactionReasons,'reserve']));p.concernStreak+=p.rosterRole==='core'||p.rosterRole==='starter'?1:0}
  else {p.satisfaction=clamp(p.satisfaction+3,0,100);p.satisfactionReasons=p.satisfactionReasons.filter(x=>x!=='reserve')}
  applySatisfaction(db,p);
}
function offseasonPlayerSatisfaction(db,w,rep,ev){
  for(const t of activeTeams(db))for(const id of t.roster){const p=db.players[id];if(!p||p.retired)continue;const was=p.wantsOut,res=applySatisfaction(db,p,{offseason:true,year:w.year});
    if(!was&&p.wantsOut&&t.id===managedTeamId(db))ev(`${p.name} 이적 요청 — ${SAT_REASON_KO[p.wantsOutReason]||'커리어 불만'} (만족도 ${Math.round(p.satisfaction)})`);
    if(was&&!p.wantsOut&&t.id===managedTeamId(db))ev(`${p.name} 이적 요청 철회 — 만족도 ${Math.round(p.satisfaction)}`);
  }
}
// 시리즈 후: 폼·피로·사기 갱신
function afterSeries(db,lines,rec){
  const by={};for(const l of lines)(by[l.pid]=by[l.pid]||[]).push(l);
  for(const [pid,ls] of Object.entries(by)){
    const p=db.players[pid]; if(!p)continue; pState(p);
    const k=ls.reduce((a,l)=>a+l.k+l.a*0.7,0), d=ls.reduce((a,l)=>a+l.d,0), w=ls.filter(l=>l.win).length, mv=ls.filter(l=>l.mvp).length;
    const perf=(k/Math.max(1,d)-2.2)*0.8+(w-(ls.length-w))*0.8+mv*1.5;
    p.form=clamp(p.form*.7+perf+(hashStr(pid+rec.seed)%3-1),-10,10);
    p.fatigue=clamp(p.fatigue+ls.length*4,0,100);p.condition=clamp(p.condition-ls.length*1.6,45,100);
    p.sharpness=clamp(p.sharpness+ls.length*3.2,0,100);p.teamAdaptation=clamp(p.teamAdaptation+ls.length*.7,0,100);p.tacticalAdaptation=clamp(p.tacticalAdaptation+ls.length*.55,0,100);
    p.morale=clamp(p.morale+(w>ls.length/2?2:-2)+mv,0,100);
  }
  // 벤치 선수 사기 하락
  for(const tid of [rec.a,rec.b]){const t=db.teams[tid];if(!t)continue;
    for(const id of t.roster){if(by[id])continue;const p=db.players[id];if(p){pState(p);p.morale=clamp(p.morale-1,0,100);p.sharpness=clamp(p.sharpness-.8,0,100);p.teamAdaptation=clamp(p.teamAdaptation+.18,0,100);p.tacticalAdaptation=clamp(p.tacticalAdaptation+.12,0,100)}}
    t.synergy=clamp(teamSynergy(t)+0.4,0,100);}
}
// 매 경기일: 기본 피로 회복. 훈련은 아래의 희소 포인트 배분으로만 관리한다
function dailyRecovery(db){
  for(const t of Object.values(db.teams)){ if(t.active===false)continue;
    const prof=staffProfile(t),rec=4+(prof.recovery-50)/45+facilityRecoveryBonus(t);
    const ti=trainingIntensity(t);for(const id of t.roster){const p=db.players[id];if(!p)continue;pState(p);p.fatigue=clamp(p.fatigue-rec+ti.fatigue,0,100);p.condition=clamp(p.condition+2.5+ti.condition,0,100);p.form*=.98}
  }
}
function staffProfile(t){const c=t?.coach||{},s=t?.staff||{};return {draft:clamp((c.draft||55)+(s.strategicCoach?.rating||0)*.18,35,99),analysis:clamp((c.analysis||55)+(s.analyst?.rating||0)*.22,35,99),development:clamp((c.development||55)+(s.developmentCoach?.rating||0)*.22,35,99),recovery:clamp(50+(s.performanceCoach?.rating||0)*.45,50,95)}}
function trainingGrowthMul(t){const p=staffProfile(t);return clamp(.88+(p.development-45)/220,0.88,1.13)}
function scrimAnalysisBonus(t){const p=staffProfile(t);return clamp((p.analysis-50)/500+facilityAnalysisBonus(t),0,.14)}
function scrimReadiness(db,t){
  if(!t)return {ok:false,reason:'팀 없음'};
  const roster=t.roster.map(id=>db.players[id]).filter(Boolean),avgFatigue=avg(roster.map(p=>p.fatigue||0)),avgCondition=avg(roster.map(p=>p.condition??96));
  const today=db.worldDate||'',log=(t.scrimLog||[]).filter(x=>x.date===today),games=log.reduce((a,x)=>a+(x.games||0),0);
  if(games>=5)return {ok:false,reason:'오늘 스크림 한도 도달',avgFatigue,avgCondition,games};
  if(avgFatigue>=58||avgCondition<=70)return {ok:false,reason:'선수단 회복 필요',avgFatigue,avgCondition,games};
  return {ok:true,reason:'가능',avgFatigue,avgCondition,games};
}
function aiRunScrims(db,rng){
  const teams=activeTeams(db,null,1).filter(t=>t.id!==managedTeamId(db)&&trainingRecommendation(db,t).scrim&&scrimReadiness(db,t).ok);
  const used=new Set();for(const t of teams){if(used.has(t.id)||!rng.chance(.22))continue;const candidates=teams.filter(o=>o.id!==t.id&&!used.has(o.id)&&o.region===t.region&&scrimReadiness(db,o).ok);if(!candidates.length)continue;const weighted=candidates.map(o=>[o,Math.max(.1,scrimValue(db,t.id,o.id))]),sum=weighted.reduce((a,x)=>a+x[1],0);let roll=rng.next()*sum,opp=weighted[0][0];for(const [o,v] of weighted){roll-=v;if(roll<=0){opp=o;break}}const bo=rng.chance(.28)?3:1,s=simulateSeries(db,t.id,opp.id,bo,'ai-scrim/'+db.worldDate+'/'+t.id+'/'+opp.id,{fearless:true,firstChoice:'coin',replay:true,practice:true});recordScrimPractice(db,s.rec,s.lines);used.add(t.id);used.add(opp.id)}
}
function scrimValue(db,tid,oppId){
  const t=db.teams[tid],opp=db.teams[oppId];if(!t||!opp)return .5;const gap=teamStrength(db,oppId)-teamStrength(db,tid),quality=clamp(1+gap/35,.65,1.3),recent=(t.scrimLog||[]).filter(x=>x.opponent===oppId).slice(-3).length,novelty=[1,.82,.68,.58][Math.min(3,recent)];return quality*novelty;
}
function recordScrimPractice(db,rec,lines){
  if(!rec||!lines)return {players:0,games:0};const teams=new Set([rec.a,rec.b]),seen=new Set(),games=(rec.games||[]).length;
  for(const l of lines){const p=db.players[l.pid];if(!p||!teams.has(l.tid))continue;const opp=l.tid===rec.a?rec.b:rec.a,value=scrimValue(db,l.tid,opp);practiceChampion(db,p,l.champ,'scrim',value);pState(p);p.fatigue=clamp(p.fatigue+1.2,0,100);p.condition=clamp(p.condition-.45,45,100);seen.add(p.id)}
  for(const tid of teams){const t=db.teams[tid];if(!t)continue;const opp=tid===rec.a?rec.b:rec.a,value=scrimValue(db,tid,opp),bonus=scrimAnalysisBonus(t);t.scrimIntel=clamp((t.scrimIntel||0)+(.8+bonus*12)*value,0,12);t.scrimLog=(t.scrimLog||[]).filter(x=>x.date===db.worldDate).slice(-5);t.scrimLog.push({date:db.worldDate,games,opponent:tid===rec.a?rec.b:rec.a})}
  return {players:seen.size,games};
}
function staffSalary(s,ps){return Math.round((.35+((s.rating||50)-40)/35)*ps*10)/10}
const STAFF_ROLES={strategicCoach:'전략 코치',analyst:'분석가',developmentCoach:'육성 코치',performanceCoach:'퍼포먼스 코치'};
function genStaffMember(rng,role,base=60){const nm=rng.pick(NICK_A)+rng.pick(NICK_B);return {id:'S'+hashStr(role+nm+rng.int(0,99999)),name:nm.charAt(0).toUpperCase()+nm.slice(1),role,rating:Math.round(clamp(base+rng.normal(0,9),35,95)),age:rng.int(27,52)}}
function ensureTeamStaff(db,t,rng){t.staff=t.staff||{};for(const role of Object.keys(STAFF_ROLES))if(!t.staff[role])t.staff[role]=genStaffMember(rng,role,(t.coach?.analysis||60)-3);db.staffPool=db.staffPool||[]}
function genStaffPool(db,rng){db.staffPool=db.staffPool||[];const counts=Object.fromEntries(Object.keys(STAFF_ROLES).map(r=>[r,0]));for(const s of db.staffPool)if(counts[s.role]!==undefined)counts[s.role]++;for(const role of Object.keys(STAFF_ROLES))while(counts[role]<6){db.staffPool.push(genStaffMember(rng,role,60+rng.normal(0,6)));counts[role]++}db.staffPool=db.staffPool.slice(-48)}
function hireStaff(db,t,s){if(!s||!STAFF_ROLES[s.role])throw new Error('유효하지 않은 스태프입니다');t.staff=t.staff||{};const old=t.staff[s.role];if(old)db.staffPool.push(old);db.staffPool=db.staffPool.filter(x=>x.id!==s.id);t.staff[s.role]={...s,since:db.year}}
function staffRoleWeight(t,role){const p=t.philosophy||'balanced';return ({youth:{developmentCoach:1.25,strategicCoach:.8,analyst:.85,performanceCoach:.8},'win-now':{strategicCoach:1.2,analyst:1.2,performanceCoach:1.05,developmentCoach:.7},superstar:{strategicCoach:1.1,analyst:1.05,performanceCoach:1,developmentCoach:.8},cost:{strategicCoach:.8,analyst:.8,performanceCoach:.8,developmentCoach:.85},balanced:{strategicCoach:1,analyst:1,performanceCoach:1,developmentCoach:1}}[p]||{})[role]||1}
function aiManageStaff(db,t,rng){if(!t||t.id===managedTeamId(db)||!t.finance)return false;ensureTeamStaff(db,t,rng);const ps=psOf(db,t.region),cash=t.finance.cash||0,cands=db.staffPool||[];let best=null;for(const role of Object.keys(STAFF_ROLES)){const cur=t.staff[role],w=staffRoleWeight(t,role);for(const s of cands){if(s.role!==role)continue;const gain=(s.rating-cur.rating)*w,fee=staffSalary(cur,ps),annual=staffSalary(s,ps);const reserve=(t.philosophy==='cost'?8:5)*ps;if(gain>=6&&cash>fee+annual+reserve&&(!best||gain>best.gain))best={s,gain,fee}}}if(!best)return false;t.finance.cash=Math.round((t.finance.cash-best.fee)*10)/10;hireStaff(db,t,best.s);return true}
function ageStaff(db,rng){
  const mine=managedTeamId(db);db.staffPool=db.staffPool||[];
  for(const t of activeTeams(db)){
    if(t.id!==mine)ensureTeamStaff(db,t,rng);else t.staff=t.staff||{};
    for(const [role,s] of Object.entries(t.staff||{})){if(!s)continue;s.age=(s.age||35)+1;
      if(s.age>=62&&rng.chance(.12+(s.age-62)*.04)){
        if(t.id===mine){delete t.staff[role];if(db.world){db.world.marketLog=db.world.marketLog||[];db.world.marketLog.push((STAFF_ROLES[role]||role)+' '+s.name+' 은퇴 · 후임을 직접 선임하세요')}}
        else t.staff[role]=genStaffMember(rng,role,55+(t.coach?.analysis||55)*.08);
      }}
  }
  for(const s of db.staffPool)s.age=(s.age||35)+1;db.staffPool=db.staffPool.filter(s=>s.age<68);
}


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
      if(t.id===managedTeamId(db)){rep.myGoal={goal:t.goal,ok};if(!ok&&t.owner.patience<=0){w.fired=true;ev(`${t.name} 구단주, 헤드코치(플레이어) 해임 — 목표 "${GOAL_KO[t.goal]}" 연속 미달`)}}
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