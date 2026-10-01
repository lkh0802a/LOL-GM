// ===== LOL GM: Player state / relationships / satisfaction domain =====
// Owns condition modifiers, player relationships, playing-time usage and satisfaction lifecycle.

function pState(p){if(p.form===undefined)p.form=0;if(p.fatigue===undefined)p.fatigue=10;if(p.morale===undefined)p.morale=65;if(p.condition===undefined)p.condition=96;if(p.sharpness===undefined)p.sharpness=55;if(p.teamAdaptation===undefined)p.teamAdaptation=p.team?60:50;if(p.tacticalAdaptation===undefined)p.tacticalAdaptation=p.team?60:50;return p}
// 상태는 기본 실력을 보정하지만 압도하지 않도록 총합을 제한한다.
function playerMod(p){pState(p);const v=p.form/250-p.fatigue/900+(p.condition-92)/1200+(p.morale-65)/1800+(p.sharpness-60)/1700+((p.teamAdaptation+p.tacticalAdaptation)/2-60)/2200;return clamp(v,-.11,.09)-medicalPerformancePenalty(p)}
function teamSynergy(t){return Number.isFinite(t?.synergy)?clamp(t.synergy,0,100):50}
function lineupCohesion(db,t,ids=null){
  const players=[...new Set(ids||ROLES.map(r=>starterFor(db,t,r)?.id))]
    .map(id=>db.players[id]).filter(p=>p&&p.team===t.id&&!p.retired);
  if(players.length<2)return {target:50,relationship:50,adaptation:50,trust:60};
  let sum=0,count=0;
  for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){
    sum+=playerRelationship(db,players[i],players[j]);count++;
  }
  const relationship=sum/count,adaptation=avg(players.map(p=>p.teamAdaptation??60)),
    trust=avg(players.map(p=>p.managerTrust??60));
  return {relationship,adaptation,trust,
    target:clamp(50+(relationship-50)*.55+(adaptation-60)*.25+(trust-60)*.15,15,85)};
}
function lineupSynergy(db,t,ids=null){
  // The current five cannot inherit all the cohesion of a departed lineup.
  return clamp(teamSynergy(t)*.4+lineupCohesion(db,t,ids).target*.6,15,85);
}
function recoverTeamCohesion(db,t,ids=null,rate=.015){
  const target=lineupCohesion(db,t,ids).target;
  t.synergy=clamp(teamSynergy(t)+(target-teamSynergy(t))*rate,15,85);
  return t.synergy;
}
function playerRelationKey(a,b){const x=typeof a==='string'?a:a?.id,y=typeof b==='string'?b:b?.id;if(!x||!y||x===y)return null;return x<y?x+'|'+y:y+'|'+x}
function playerRelationship(db,a,b){const k=playerRelationKey(a,b);if(!k)return 50;return db.playerRelations?.[k]??50}
function adjustPlayerRelationship(db,a,b,delta){const k=playerRelationKey(a,b);if(!k)return 50;db.playerRelations=db.playerRelations||{};const v=clamp((db.playerRelations[k]??50)+delta,0,100);db.playerRelations[k]=Math.round(v*10)/10;return db.playerRelations[k]}
function teamRelationshipScore(db,t){const ids=(t?.roster||[]).filter(id=>db.players[id]&&!db.players[id].retired);if(ids.length<2)return 50;let sum=0,n=0;for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){sum+=playerRelationship(db,ids[i],ids[j]);n++}return n?sum/n:50}
const CAREER_GOAL_KO={development:'성장 기회',starter:'주전 정착',international:'국제대회 출전',titles:'우승 경쟁',stability:'안정적인 커리어'};
const SAT_REASON_KO={teammates:'동료와의 불화',playing_time:'출전 시간 부족',promise_role:'역할 약속 불이행',reserve:'2군 배치',contract:'계약/연봉 불만',team_results:'팀 성적 불만',role:'역할 불만',international:'국제대회 기회 부족',career_goal:'커리어 목표 불일치'};
function startContractRolePromise(db,p,t){
  if(!p.contract)return;
  closeOralRolePromise(db,p,'new_contract_or_transfer');
  const u=p.usage?.year===db.year?p.usage:null;
  p.contract.rolePromiseStart={year:db.year,teamId:t.id,date:db.worldDate||null,
    games:u?.games||0,teamGames:u?.teamGames||0,
    unavailableTeamGames:u?.unavailableTeamGames||0};
}
function contractRolePromiseStatus(db,p,year=db.year){
  if(p.loan)return {...rolePromiseUsageStatus(db,p,p.loan.promisedRole,p.loan.promiseStart,year),source:'loan'};
  const role=p.contract?.promisedRole;
  if(!SQUAD_ROLES.includes(role)||p.contract.until<year)return null;
  return {...rolePromiseUsageStatus(db,p,role,p.contract.rolePromiseStart,year),source:'contract'};
}
function rolePromiseUsageStatus(db,p,role,baseline,year){
  const t=p.team&&db.teams[p.team],u=p.usage?.year===year?p.usage:null,
    sameYear=baseline?.year===year,
    games=Math.max(0,(u?.games||0)-(sameYear?baseline.games:0)),
    unavailable=Math.max(0,(u?.unavailableTeamGames||0)-
      (sameYear?baseline.unavailableTeamGames||0:0)),
    teamGames=Math.max(0,(u?.teamGames||0)-(sameYear?baseline.teamGames:0)-unavailable);
  return {role,expected:expectedPlayShare({rosterRole:role},t),games,teamGames,
    actual:teamGames?games/teamGames:0,start:baseline?.date||null,
    downgraded:(SQUAD_ROLE_ORDER[role]??0)>(SQUAD_ROLE_ORDER[p.rosterRole]??0)};
}
function ensureSatisfaction(p){
  pState(p);if(p.satisfaction===undefined)p.satisfaction=70;if(!Array.isArray(p.satisfactionReasons))p.satisfactionReasons=[];
  if(p.managerRelationship===undefined)p.managerRelationship=60;if(p.managerTrust===undefined)p.managerTrust=60;
  if(p.concernStreak===undefined)p.concernStreak=0;if(p.wantsOut===undefined)p.wantsOut=false;if(p.wantsOutReason===undefined)p.wantsOutReason=null;
  playerCareerGoal(p);return p;
}
function renewalDisposition(p){ensureSatisfaction(p);return clamp(.5+(p.satisfaction-50)/115+(p.managerTrust-50)/90+(p.managerRelationship-50)/170-(p.wantsOut?.42:0),0,1)}
function usageFor(p,year){
  p.usage=p.usage&&p.usage.year===year?p.usage:{year,teamGames:0,games:0,series:0,wins:0,teamWins:0,intlGames:0,teamIntlGames:0,firstTeamGames:0,reserveGames:0};
  return p.usage;
}
function actualPlayShare(p){const u=p.usage;return u&&u.teamGames?u.games/u.teamGames:0}
function satisfactionLabel(v){return v>=80?'매우 만족':v>=65?'만족':v>=48?'보통':v>=32?'불만':'매우 불만'}
function satisfactionIssues(db,p,opt={}){
  ensureSatisfaction(p);const t=p.team&&db.teams[p.team],usageYear=opt.year??db.year,u=p.usage&&p.usage.year===usageYear?p.usage:null,out=[];
  if(!t)return out;
  const teammates=t.roster.filter(id=>id!==p.id&&db.players[id]&&!db.players[id].retired);
  const bonds=teammates.map(id=>playerRelationship(db,p,id));
  if(bonds.length&&avg(bonds)<30)out.push({code:'teammates',severity:clamp((30-avg(bonds))/5,2,6)});
  const promise=effectiveRolePromiseStatus(db,p,usageYear),role=promise?.role||p.rosterRole,
    games=promise?.teamGames??u?.teamGames??0,
    exp=promise?.expected??expectedPlayShare(p,t),
    actual=games>=8?(promise?.actual??actualPlayShare(p)):null;
  if(actual!==null&&games>=14&&role==='core'&&exp-actual>.28)out.push({code:'playing_time',severity:clamp((exp-actual)*24,3,10)});
  else if(actual!==null&&games>=16&&role==='starter'&&exp-actual>.32)out.push({code:'playing_time',severity:clamp((exp-actual)*20,3,9)});
  else if(actual!==null&&games>=24&&role==='competition'&&actual<.03&&p.personality.ambition>=80)out.push({code:'playing_time',severity:3});
  if(promise?.downgraded)out.push({code:'promise_role',severity:Math.min(6,
    ((SQUAD_ROLE_ORDER[role]??0)-(SQUAD_ROLE_ORDER[p.rosterRole]??0))*2)});
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
  const severity=issues.reduce((a,x)=>a+x.severity,0),trustSeverity=issues.filter(x=>['playing_time','promise_role','reserve','contract','role','career_goal'].includes(x.code)).reduce((a,x)=>a+x.severity,0);
  if(issues.length){
    p.managerRelationship=clamp(p.managerRelationship-Math.min(opt.offseason?5:1.1,severity*(opt.offseason?.12:.025)),0,100);
    p.managerTrust=clamp(p.managerTrust-Math.min(opt.offseason?7:1.4,trustSeverity*(opt.offseason?.16:.035)),0,100);
  }else if(u&&u.teamGames>=4){
    p.managerRelationship=clamp(p.managerRelationship+(60-p.managerRelationship)*.025,0,100);
    p.managerTrust=clamp(p.managerTrust+(60-p.managerTrust)*.02,0,100);
  }
  const promisedRole=effectiveRolePromiseStatus(db,p,usageYear)?.role||p.rosterRole;
  if(p.satisfaction<24&&issues.length&&['core','starter'].includes(promisedRole))p.concernStreak=(p.concernStreak||0)+1;else p.concernStreak=Math.max(0,(p.concernStreak||0)-1);
  const severeBreakdown=p.satisfaction<=8&&p.concernStreak>=18&&p.managerRelationship<=25&&p.managerTrust<=20&&p.personality.ambition>=70;
  if(!p.wantsOut&&(severeBreakdown||(p.satisfaction<=16&&p.concernStreak>=18&&p.personality.ambition>=70&&issues.some(x=>x.code==='teammates'&&x.severity>=5)))&&issues.length){p.wantsOut=true;p.wantsOutReason=issues[0].code;recordPlayerEvent(p,'transfer_request',db.year,{reason:p.wantsOutReason,team:p.team,date:db.worldDate})}
  else if(p.wantsOut&&(p.satisfaction>=50||p.managerTrust>=52)){p.wantsOut=false;const why=p.wantsOutReason;p.wantsOutReason=null;p.concernStreak=0;recordPlayerEvent(p,'transfer_request_withdrawn',db.year,{reason:why,team:p.team,date:db.worldDate})}
  const target=52+p.satisfaction*.2;p.morale=clamp(p.morale+(target-p.morale)*.05,0,100);
  return {delta,issues};
}
function updatePlayerUsage(db,s,rec,lines){
  const comp=db.competitions[s.comp],n=rec.games.length,by={};for(const l of lines)(by[l.pid]=by[l.pid]||[]).push(l);
  for(const tid of [rec.a,rec.b]){const t=db.teams[tid];if(!t)continue;const teamWins=rec.games.filter(g=>g.winner===tid).length;
    for(const id of t.roster){const p=db.players[id];if(!p)continue;ensureSatisfaction(p);const u=usageFor(p,s.year);u.teamGames+=n;u.teamWins+=teamWins;if(comp.international)u.teamIntlGames+=n;
      const ls=by[id]||[];
      recordTransferAppearances(p,tid,ls.length,comp.international);
      if(medicalOut(p)&&!ls.length)u.unavailableTeamGames=(u.unavailableTeamGames||0)+n;
      u.games+=ls.length;u.series++;u.wins+=ls.filter(x=>x.win).length;if(comp.international)u.intlGames+=ls.length;if(t.parent)u.reserveGames+=ls.length;else u.firstTeamGames+=ls.length;
      if(u.teamGames>=16&&u.series%6===0)applySatisfaction(db,p);
    }
  }
  recordRoleConversionUsage(db,lines,'official');
  processTransferPayments(db);
}
function onSquadMoveSatisfaction(db,p,check){
  ensureSatisfaction(p);if(check.kind==='senddown'){const pen=p.rosterRole==='prospect'?1:p.rosterRole==='backup'?2:p.rosterRole==='competition'?3:6;p.satisfaction=clamp(p.satisfaction-pen,0,100);p.satisfactionReasons=Array.from(new Set([...p.satisfactionReasons,'reserve']));p.concernStreak+=p.rosterRole==='core'||p.rosterRole==='starter'?1:0;p.managerTrust=clamp(p.managerTrust-(p.rosterRole==='core'||p.rosterRole==='starter'?4:1),0,100)}
  else {p.satisfaction=clamp(p.satisfaction+3,0,100);p.satisfactionReasons=p.satisfactionReasons.filter(x=>x!=='reserve');p.managerTrust=clamp(p.managerTrust+1,0,100)}
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
    medicalExposure(db,p,'official',ls.length);
    p.fatigue=clamp(p.fatigue+ls.length*4,0,100);p.condition=clamp(p.condition-ls.length*1.6,45,100);
    p.sharpness=clamp(p.sharpness+ls.length*3.2,0,100);p.teamAdaptation=clamp(p.teamAdaptation+ls.length*.7,0,100);p.tacticalAdaptation=clamp(p.tacticalAdaptation+ls.length*.55,0,100);
    p.morale=clamp(p.morale+(w>ls.length/2?2:-2)+mv,0,100);
  }
  // 벤치 선수 사기 하락
  for(const tid of [rec.a,rec.b]){const t=db.teams[tid];if(!t)continue;
    for(const id of t.roster){if(by[id])continue;const p=db.players[id];if(p){pState(p);p.morale=clamp(p.morale-1,0,100);p.sharpness=clamp(p.sharpness-.8,0,100);p.teamAdaptation=clamp(p.teamAdaptation+.18,0,100);p.tacticalAdaptation=clamp(p.tacticalAdaptation+.12,0,100)}}
    const active=Object.keys(by).filter(id=>db.players[id]?.team===tid),relDelta=rec.winner===tid?.18:-.08;
    for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++)adjustPlayerRelationship(db,active[i],active[j],relDelta);
    recoverTeamCohesion(db,t,active,.025);}
}
// 매 경기일: 기본 피로 회복. 훈련은 아래의 희소 포인트 배분으로만 관리한다
