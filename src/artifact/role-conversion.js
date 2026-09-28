// ===== LOL GM: Long-term role conversion =====
// p.role is specialization/identity, never a match-eligibility permission.
// Conversion changes specialization over time; one-off off-role lineups remain legal regardless.

function ensureRoleConversionState(p){
  if(!p)return null;
  if(!Array.isArray(p.roleHistory))p.roleHistory=[];
  if(!Number.isFinite(p.roleConversionCount))p.roleConversionCount=p.roleHistory.filter(x=>x&&x.type==='conversion').length;
  if(!Number.isFinite(p.roleConversionTrainingDaysYear))p.roleConversionTrainingDaysYear=0;
  if(!Number.isFinite(p.roleProposalCount))p.roleProposalCount=0;
  return p.roleConversion||null;
}
function roleConversionLabel(p){
  ensureRoleConversionState(p);const x=p.roleConversion;if(!x)return null;
  return {from:x.fromRole,target:x.targetRole,progress:Math.round(x.progress||0),trainingDays:x.trainingDays||0,officialGames:x.officialGames||0,scrimGames:x.scrimGames||0};
}
function roleHistoryBonus(p,role){return (p.roleHistory||[]).some(x=>x&&(x.to===role||x.role===role))?1:0}
function roleChampionReadiness(db,p,role){
  const ids=Object.values(db.patch?.champions||{}).filter(c=>(c.roles||[]).includes(role)).map(c=>c.id),vals=ids.map(id=>p.pool?.[id]?.mastery||0).filter(Boolean).sort((a,b)=>b-a).slice(0,5);
  if(!vals.length)return 20;return clamp(avg(vals),20,99);
}
function roleConversionFit(db,p,role){return playerRoleRating(p,role)*.76+roleChampionReadiness(db,p,role)*.24}
function roleConversionAcceptance(db,p,targetRole,source='manager'){
  ensureSatisfaction(p);ensureRoleConversionState(p);
  if(!ROLES.includes(targetRole))return {ok:false,accepted:false,reason:'유효하지 않은 포지션입니다'};
  if(targetRole===p.role)return {ok:false,accepted:false,reason:'이미 현재 주포지션입니다'};
  const team=p.team&&db.teams[p.team],adapt=p.attrs?.adaptability??50,prof=p.personality?.professionalism??50,trust=p.managerTrust??60,relation=p.managerRelationship??60;
  const currentFit=roleConversionFit(db,p,p.role),targetFit=roleConversionFit(db,p,targetRole),fitDelta=targetFit-currentFit,agePenalty=Math.max(0,p.age-25)*1.6;
  const assigned=team&&ROLES.find(r=>team.depthChart?.[r]===p.id),opportunity=assigned===targetRole?10:assigned&&assigned!==p.role?3:0;
  const history=roleHistoryBonus(p,targetRole)?9:0,activePenalty=p.roleConversion&&p.roleConversion.targetRole!==targetRole?Math.min(14,(p.roleConversion.progress||0)*.14):0;
  const repeated=Math.min(14,Math.max(0,(p.roleProposalCount||0)-2)*2.5),score=38+adapt*.22+prof*.1+(trust-50)*.18+(relation-50)*.08+fitDelta*.6+opportunity+history-agePenalty-activePenalty-repeated;
  const threshold=58+((hashStr((db.world?.seed||db.saveId)+'|role-proposal|'+p.id+'|'+targetRole+'|'+(db.worldDate||db.year)+'|'+p.roleProposalCount)%1001)/1000-0.5)*12;
  return {ok:true,accepted:score>=threshold,score,threshold,targetFit,currentFit,reason:score>=threshold?'선수가 전향 계획을 수락했습니다':'선수가 현재 커리어 계획과 맞지 않는다며 전향을 거절했습니다'};
}
function proposeRoleConversion(db,pid,targetRole,source='manager'){
  const p=playerRef(db,pid);if(!p||p.retired)return {ok:false,accepted:false,reason:'전향을 제안할 수 없는 선수입니다'};
  if(source==='manager'&&p.team&&!organizationTeams(db,managedTeam(db)).some(t=>t.id===p.team))return {ok:false,accepted:false,reason:'내 구단 선수에게만 전향을 제안할 수 있습니다'};
  ensureRoleConversionState(p);if(p.roleConversion?.targetRole===targetRole)return {ok:true,accepted:true,reason:'이미 해당 포지션 전향을 진행 중입니다',conversion:p.roleConversion};
  p.roleProposalCount=(p.roleProposalCount||0)+1;const res=roleConversionAcceptance(db,p,targetRole,source);if(!res.ok)return res;
  if(!res.accepted){
    ensureSatisfaction(p);p.managerRelationship=clamp(p.managerRelationship-Math.min(2,Math.max(0,p.roleProposalCount-2)*.35),0,100);
    recordPlayerEvent(p,'role_conversion_rejected',db.year,{from:p.role,to:targetRole,team:p.team,date:db.worldDate,source});return res;
  }
  if(p.roleConversion&&p.roleConversion.targetRole!==targetRole){
    const sunk=Math.min(6,(p.roleConversion.progress||0)*.05);p.managerTrust=clamp((p.managerTrust??60)-sunk,0,100);
    recordPlayerEvent(p,'role_conversion_redirected',db.year,{from:p.roleConversion.targetRole,to:targetRole,progress:Math.round(p.roleConversion.progress||0),team:p.team,date:db.worldDate,source});
  }
  p.roleConversion={fromRole:p.role,targetRole,progress:0,startedYear:db.year,startedDate:db.worldDate,trainingDays:0,officialGames:0,scrimGames:0,source};
  recordPlayerEvent(p,'role_conversion_started',db.year,{from:p.role,to:targetRole,team:p.team,date:db.worldDate,source});return {...res,conversion:p.roleConversion};
}
function cancelRoleConversion(db,pid,source='manager'){
  const p=playerRef(db,pid);if(!p||!p.roleConversion)return {ok:false,reason:'진행 중인 포지션 전향이 없습니다'};
  const x=p.roleConversion,progress=x.progress||0;ensureSatisfaction(p);if(progress>=20)p.managerTrust=clamp(p.managerTrust-Math.min(5,1+progress*.035),0,100);
  recordPlayerEvent(p,'role_conversion_cancelled',db.year,{from:x.fromRole,to:x.targetRole,progress:Math.round(progress),team:p.team,date:db.worldDate,source});p.roleConversion=null;
  return {ok:true,reason:'포지션 전향 계획을 중단했습니다'};
}
function roleConversionEffectiveness(db,p){
  const x=p.roleConversion;if(!x)return 0;const team=p.team&&db.teams[p.team],adapt=p.attrs?.adaptability??50,prof=p.personality?.professionalism??50,coach=team?staffDevelopmentFor(team,x.targetRole):50;
  const age=clamp(1.12-Math.max(0,p.age-20)*.018,.72,1.12),repeat=clamp(1-(p.roleConversionCount||0)*.07,.64,1),history=roleHistoryBonus(p,x.targetRole)?1.14:1;
  return (.72+adapt/250+prof/500+coach/650)*age*repeat*history;
}
function roleConversionPracticeChampion(db,p,x){
  const pool=Object.values(db.patch?.champions||{}).filter(c=>(c.roles||[]).includes(x.targetRole));if(!pool.length)return;
  pool.sort((a,b)=>(p.pool?.[b.id]?.mastery||0)-(p.pool?.[a.id]?.mastery||0)||String(a.id).localeCompare(String(b.id)));
  const c=pool[Math.floor((x.trainingDays||0)/14)%Math.min(4,pool.length)];if(c)practiceChampion(db,p,c.id,'training',.55);
}
function completeRoleConversion(db,p){
  const x=p.roleConversion;if(!x)return null;const old=p.role,target=x.targetRole;
  p.role=target;p.roleConversionCount=(p.roleConversionCount||0)+1;p.roleHistory=p.roleHistory||[];p.roleHistory.push({type:'conversion',from:old,to:target,year:db.year,date:db.worldDate,trainingDays:x.trainingDays||0,officialGames:x.officialGames||0,scrimGames:x.scrimGames||0});p.roleHistory=p.roleHistory.slice(-12);
  p.roleConversion=null;ensureSatisfaction(p);p.satisfaction=clamp(p.satisfaction+2,0,100);p.managerTrust=clamp(p.managerTrust+1,0,100);
  recordPlayerEvent(p,'role_conversion_completed',db.year,{from:old,to:target,team:p.team,date:db.worldDate,trainingDays:x.trainingDays||0,officialGames:x.officialGames||0,scrimGames:x.scrimGames||0});
  return {from:old,to:target};
}
function advanceRoleConversionPlayer(db,p){
  const x=ensureRoleConversionState(p);if(!x||p.retired||!p.team)return null;const eff=roleConversionEffectiveness(db,p);
  x.trainingDays=(x.trainingDays||0)+1;p.roleConversionTrainingDaysYear=(p.roleConversionTrainingDaysYear||0)+1;x.progress=clamp((x.progress||0)+.42*eff,0,100);
  const keys=ROLE_KEY_ATTRS[x.targetRole]||[];for(const a of keys.slice(0,4))if(p.attrs?.[a]!=null)p.attrs[a]=Math.round(clamp(p.attrs[a]+.008*eff,20,99)*100)/100;
  if(x.trainingDays%7===0)roleConversionPracticeChampion(db,p,x);if(x.progress>=100)return completeRoleConversion(db,p);return null;
}
function advanceRoleConversionsDay(db){const done=[];for(const p of Object.values(db.players||{})){const r=advanceRoleConversionPlayer(db,p);if(r)done.push({pid:p.id,...r})}return done}
function recordRoleConversionUsage(db,lines,kind='official'){
  const seen={};for(const l of lines||[]){const p=db.players[l.pid],x=p&&p.roleConversion;if(!x||l.role!==x.targetRole)continue;const k=p.id+'|'+kind;seen[k]=(seen[k]||0)+1}
  for(const [key,n] of Object.entries(seen)){const pid=key.split('|')[0],p=db.players[pid],x=p&&p.roleConversion;if(!x)continue;if(kind==='scrim'){x.scrimGames=(x.scrimGames||0)+n;x.progress=clamp((x.progress||0)+n*.32,0,100)}else{x.officialGames=(x.officialGames||0)+n;x.progress=clamp((x.progress||0)+n*1.05,0,100)}if(x.progress>=100)completeRoleConversion(db,p)}
}
function roleConversionGrowthMultiplier(p){const days=p.roleConversionTrainingDaysYear||0;return clamp(1-Math.min(.12,days/220*.12),.88,1)}
function aiReviewRoleConversions(db,t){
  const team=teamRef(db,t);if(!team||team.id===managedTeamId(db)||hashStr((db.worldDate||db.year)+'|role-review|'+team.id)%24!==0)return null;
  for(const role of ROLES){const p=team.depthChart?.[role]&&db.players[team.depthChart[role]];if(!p||p.role===role||p.roleConversion)continue;const fit=roleConversionFit(db,p,role),natural=roleConversionFit(db,p,p.role);if(p.age<=29&&fit>=natural-7)return proposeRoleConversion(db,p.id,role,'ai')}
  return null;
}
