// ===== LOL GM: 월드 (Phase 5 성장 + 월드 확장) =====
const NICK_A=['Ka','Zer','Lu','Vex','Mor','Ny','Ti','Rho','Sa','Quin','El','Dra','Fen','Jo','Kai','Mir','Oz','Pyr','Ren','Syl','Ul','Wyn','Xan','Yor','Bru','Cae','Del','Gor','Hex','Ish','Lor','Nim','Pax','Riv','Tor','Val','Zu','Aki','Bly','Cro'];
const NICK_B=['n','ra','x','lo','th','ne','ko','vy','dan','rin','zo','sk','mi','ro','ve','ly','ce','ta','ix','or','us','en','al','yx','e','o','ash','ek','im','ul'];
const STYLES=Object.keys(STYLE_BIAS);
// 의미 있는 오프롤 경험은 드물게 생성한다. 공식전 포지션 자격은 항상 p.role 하나뿐이다.
const GENERATED_SECONDARY_ROLE_RATE=.08;
function officialRoleEligible(p,role){return !!p&&p.role===role}
function roleFamiliarity(p,role){if(role===p.role)return 100;return (p.roleFamiliarity&&p.roleFamiliarity[role])||0}

// 등록 자격은 선수의 출신/국적과 분리한다. region은 레거시 출신 생태계 키로만 유지한다.
const FIRST_TEAM_NON_LOCAL_LIMIT=2, CONTRACTED_MOVE_LIMIT_PER_SEASON=2;
function ensurePlayerEligibility(p){
  if(!p)return null;
  const origin=p.originRegion||p.region||p.nationality||null;
  if(!p.originRegion)p.originRegion=origin;
  if(!p.originLocalRegion)p.originLocalRegion=p.originRegion||origin;
  if(!p.activeLocalRegion)p.activeLocalRegion=p.originLocalRegion||origin;
  p.localEligibility=p.localEligibility||{};
  if(!p.localEligibility.origin)p.localEligibility.origin=p.originLocalRegion;
  p.localEligibility.active=p.activeLocalRegion;
  p.localEligibility.qualifications=p.localEligibility.qualifications||{};
  if(!Array.isArray(p.contractedMoves))p.contractedMoves=[];
  return p;
}
function playerOriginRegion(p){return ensurePlayerEligibility(p)?.originRegion||null}
function playerActiveLocalRegion(p){return ensurePlayerEligibility(p)?.activeLocalRegion||null}
function isLocalPlayer(p,regionId){return !!p&&!!regionId&&playerActiveLocalRegion(p)===regionId}
function nonLocalLimitForTeam(db,t){
  const team=teamRef(db,t);if(!team)return FIRST_TEAM_NON_LOCAL_LIMIT;
  if((team.division||1)===1)return FIRST_TEAM_NON_LOCAL_LIMIT;
  const R=db.regions[team.region];return Math.max(0,R?.reserveImportLimit??FIRST_TEAM_NON_LOCAL_LIMIT);
}
function teamNonLocalCount(db,t,excludePid=null){
  const team=teamRef(db,t);if(!team)return 0;
  return (team.roster||[]).reduce((n,id)=>{if(id===excludePid)return n;const p=db.players[id];return n+(p&&!isLocalPlayer(p,team.region)?1:0)},0);
}
function localRegistrationError(db,t,p){
  const team=teamRef(db,t),player=playerRef(db,p);if(!team||!player)return '등록 대상을 찾을 수 없습니다';
  if(isLocalPlayer(player,team.region))return null;
  if((team.roster||[]).includes(player.id))return null;
  return teamNonLocalCount(db,team)>=nonLocalLimitForTeam(db,team)?'비로컬 선수 등록 상한을 넘습니다':null;
}
function contractedMoveSeason(db){return db?.world?.year??db?.year}
function contractedMoveCount(db,p){ensurePlayerEligibility(p);const y=contractedMoveSeason(db);return (p?.contractedMoves||[]).filter(x=>x.season===y&&x.counts!==false).length}
function contractedMoveError(db,p){return contractedMoveCount(db,p)>=CONTRACTED_MOVE_LIMIT_PER_SEASON?'한 시즌 계약 구단 이동은 최대 2회까지 가능합니다':null}
function recordContractedMove(db,p,kind,from,to,extra={}){
  ensurePlayerEligibility(p);const season=contractedMoveSeason(db);
  if(kind==='loan_return'||kind==='loan_purchase_conversion'||kind==='restructure')return null;
  if(contractedMoveError(db,p))throw new Error('Contracted move limit exceeded: '+p.id);
  const row={season,kind,from:from?.id||from||null,to:to?.id||to||null,date:db.worldDate||null,counts:true,...extra};
  p.contractedMoves.push(row);return row;
}
function playerGroupScore(p,g,role=p.role){const keys=ATTR_GROUPS[g].filter(a=>!(a==='smite_execution'&&role!=='JGL')&&!(a==='csing'&&role==='SUP'));return keys.length?avg(keys.map(a=>p.attrs[a])):50}
function playerRoleRating(p,role=p.role){
  if(!p||!p.attrs)return 0;const gw=ROLE_GROUP_WEIGHTS[role]||ROLE_GROUP_WEIGHTS[p.role]||ROLE_GROUP_WEIGHTS.MID;
  let base=0,w=0;for(const [g,x] of Object.entries(gw)){base+=playerGroupScore(p,g,role)*x;w+=x}base=w?base/w:50;
  const keys=ROLE_KEY_ATTRS[role]||[],key=keys.length?avg(keys.map(a=>p.attrs[a]??50)):base,raw=base*.82+key*.18,fam=roleFamiliarity(p,role);
  return Math.round(clamp(raw*(role===p.role?1:.82+.18*fam/100),20,99));
}
function playerOvr(p){return playerRoleRating(p,p.role)}
function ensurePlayerDevelopment(p){
  if(p.development)return p.development;const h=Math.abs(hashStr(p.id||p.name||'player')),base={TOP:24.5,JGL:24,MID:25,ADC:25,SUP:26}[p.role]||25;
  p.development={growthRate:.88+(h%29)/100,peakAge:Math.round((base+((h>>4)%31-15)/10)*10)/10,declineRate:.85+((h>>9)%36)/100};return p.development;
}
function careerStage(p){if(p.retired)return '은퇴';const d=ensurePlayerDevelopment(p),seasons=p.proSeasons||0;if(p.age<=19||(seasons<=1&&p.age<=21))return '신인';if(p.age<d.peakAge-1)return '성장';if(p.age<=d.peakAge+1)return '전성기';return '쇠퇴'}
const SQUAD_ROLES=['core','starter','competition','backup','prospect'];
const SQUAD_ROLE_KO={core:'핵심 주전',starter:'주전',competition:'경쟁',backup:'후보',prospect:'유망주'};
const SQUAD_ROLE_EXPECTED={core:.98,starter:.94,competition:.12,backup:.02,prospect:.02};
const SQUAD_ROLE_ORDER={prospect:0,backup:1,competition:2,starter:3,core:4};
function expectedPlayShare(p,t){if(t&&t.parent&&p.rosterRole==='prospect')return .78;return SQUAD_ROLE_EXPECTED[p.rosterRole]??.45}
function playerCareerGoal(p){
  if(p.careerGoal)return p.careerGoal;
  if(p.age<=20&&p.pot-playerOvr(p)>=6)p.careerGoal='development';
  else if(p.personality.ambition>=78&&(p.reputation||0)>=78)p.careerGoal='titles';
  else if(p.personality.ambition>=68&&(p.reputation||0)>=68)p.careerGoal='international';
  else if(p.age<=24&&p.personality.ambition>=60)p.careerGoal='starter';
  else p.careerGoal='stability';
  return p.careerGoal;
}
function setDepthStarter(db,t,role,p,source='manager',silent=false){
  const team=teamRef(db,t),player=playerRef(db,p);if(!team||!player)return {ok:false,reason:'팀 또는 선수를 찾을 수 없습니다'};
  if(player.team!==team.id||!(team.roster||[]).includes(player.id))return {ok:false,reason:'해당 스쿼드 소속 선수가 아닙니다'};
  if(!officialRoleEligible(player,role))return {ok:false,reason:'공식전은 등록된 주 포지션으로만 선발 지정할 수 있습니다'};
  team.depthChart=team.depthChart||{};const old=team.depthChart[role]||null;team.depthChart[role]=player.id;
  if(!silent&&old!==player.id)recordPlayerEvent(player,'starter_change',db.year,{team:team.id,role,from:old,to:player.id,date:db.worldDate,source});
  return {ok:true,old,to:player.id};
}
function initializeDepthChart(db,t,force=false){
  const team=teamRef(db,t);if(!team)return;team.depthChart=team.depthChart||{};
  for(const role of ROLES){const cur=team.depthChart[role]&&db.players[team.depthChart[role]];if(!force&&cur&&cur.team===team.id&&officialRoleEligible(cur,role))continue;
    let best=null,bo=-1;for(const id of team.roster||[]){const p=db.players[id];if(!officialRoleEligible(p,role))continue;const o=playerOvr(p);if(o>bo){bo=o;best=p}}
    if(best)team.depthChart[role]=best.id;else delete team.depthChart[role];
  }
}
function aiReviewDepthChart(db,t){
  const team=teamRef(db,t);if(!team||team.id===managedTeamId(db))return;initializeDepthChart(db,team,false);
  for(const role of ROLES){const cur=starterFor(db,team,role);if(!cur)continue;
    const challengers=(team.roster||[]).map(id=>db.players[id]).filter(p=>officialRoleEligible(p,role)&&p.id!==cur.id).sort((a,b)=>playerOvr(b)-playerOvr(a));
    const ch=challengers[0];if(!ch)continue;
    const gap=playerOvr(ch)-playerOvr(cur),curBad=(cur.form??0)<=-6||cur.condition<60||cur.wantsOut;
    if(gap>=5||(gap>=3&&curBad))setDepthStarter(db,team,role,ch,'ai',false);
  }
}
function recommendedRosterRole(db,p,t){
  const team=teamRef(db,t);if(!team)return p.age<=20?'prospect':'backup';
  const o=playerOvr(p),isStarter=starterFor(db,team,p.role)===p;
  const same=(team.roster||[]).map(id=>db.players[id]).filter(x=>x&&x.role===p.role).sort((a,b)=>playerOvr(b)-playerOvr(a)),best=same[0]?playerOvr(same[0]):o;
  if(isStarter&&o>=best-1&&(p.reputation||o)>=82)return 'core';
  if(isStarter)return 'starter';
  if(team.parent&&p.age<=21&&p.pot-o>=4)return 'prospect';
  if(o>=best-3)return 'competition';
  if(p.age<=21&&p.pot-o>=5)return 'prospect';
  return 'backup';
}
function setRosterRole(db,p,role,source='club',silent=false){
  const player=playerRef(db,p);if(!player||!SQUAD_ROLES.includes(role))return {ok:false,reason:'유효하지 않은 선수 역할입니다'};
  const old=player.rosterRole||recommendedRosterRole(db,player,player.team),oldRank=SQUAD_ROLE_ORDER[old]??2,newRank=SQUAD_ROLE_ORDER[role]??2;
  player.rosterRole=role;player.roleAssignedYear=db.year;player.roleAssignedBy=source;
  if(!silent&&old!==role){
    if(typeof ensureSatisfaction==='function'){ensureSatisfaction(player);player.satisfaction=clamp(player.satisfaction+(newRank>oldRank?1:-Math.min(5,(oldRank-newRank)*2)),0,100)}
    recordPlayerEvent(player,'roster_role',db.year,{from:old,to:role,team:player.team,date:db.worldDate,source});
  }
  return {ok:true,old,role};
}
function initializeTeamRosterRoles(db,t,force=false){const team=teamRef(db,t);if(!team)return;initializeDepthChart(db,team,force);for(const id of team.roster||[]){const p=db.players[id];if(p&&(force||!SQUAD_ROLES.includes(p.rosterRole)))setRosterRole(db,p,recommendedRosterRole(db,p,team),'club',true)}}
function rebalanceAiRosterRoles(db,t){
  const team=teamRef(db,t);if(!team||team.id===managedTeamId(db))return;
  for(const id of team.roster||[]){const p=db.players[id];if(!p)continue;const r=recommendedRosterRole(db,p,team);if(r!==p.rosterRole)setRosterRole(db,p,r,'club',false)}
}
function playerCoreMetrics(p){
  const A=p.attrs,T=p.tend||{},m=(...xs)=>Math.round(avg(xs.map(x=>typeof x==='string'?(A[x]??50):x)));
  return {
    laning:m('trading',p.role==='SUP'?'harass':'csing','wave_control','pressure','lane_adaptation'),
    skirmish:m('reaction','precision','all_in','positioning','extended_fight'),
    teamfight:m('teamfight_awareness','positioning','target_selection','engage','disengage','peeling'),
    positioning:Math.round(A.positioning||50),
    damage:m('precision','kiting','target_selection','burst_execution','extended_fight'),
    survival:m('dodging','spacing','gank_avoidance','disengage','composure'),
    vision:m('vision_understanding','map_awareness'),
    objective:m('objective_setup','decision_making',p.role==='JGL'?(A.smite_execution||50):(A.tempo||50)),
    roaming:m('rotation','map_awareness','tempo'),
    macro:m('map_awareness','rotation','tempo','resource_allocation','crossmap_decision'),
    sidelane:m('sidelane','wave_control','map_awareness'),
    decision:Math.round(A.decision_making||50),
    stability:m('consistency','composure','pressure_handling'),
    aggression:Math.round(T.aggression??50),
    concentration:Math.round(A.concentration||50),
    adaptability:Math.round(A.adaptability||50),
    volatility:Math.round(clamp(100-(A.consistency||50),1,99)),
    championLearning:Math.round(A.champion_learning||50),
    metaAdaptation:Math.round(A.meta_adaptation||50)
  };
}
function playerSquadLabel(db,p){if(!p.team||!db.teams[p.team])return 'FA';return db.teams[p.team].parent?'2군':'1군'}
function recordPlayerEvent(p,type,year,data={}){p.careerEvents=p.careerEvents||[];p.careerEvents.push({type,year,...data});if(p.careerEvents.length>120)p.careerEvents=p.careerEvents.slice(-120)}
function trainSecondaryRole(p,role,amount=1){if(!ROLES.includes(role)||role===p.role)return roleFamiliarity(p,role);p.roleFamiliarity=p.roleFamiliarity||{[p.role]:100};const gain=Math.max(.2,amount)*(.55+(p.attrs.adaptability||50)/100*.55);p.roleFamiliarity[role]=Math.round(clamp((p.roleFamiliarity[role]||25)+gain,0,90));p.secondaryRoles=p.secondaryRoles||[];if(p.roleFamiliarity[role]>=55&&!p.secondaryRoles.includes(role))p.secondaryRoles.push(role);return p.roleFamiliarity[role]}
function ensureChampionProfile(db,p,cid){if(!p.pool)p.pool={};if(!p.pool[cid])p.pool[cid]={mastery:25,experience:0,matchup_knowledge:35,confidence:40,scrimExperience:0,trainingExperience:0,scrimSeason:0,trainingSeason:0};const pr=p.pool[cid];pr.scrimExperience=pr.scrimExperience||0;pr.trainingExperience=pr.trainingExperience||0;pr.scrimSeason=pr.scrimSeason||0;pr.trainingSeason=pr.trainingSeason||0;return pr}
function practiceChampion(db,p,cid,kind='training',amount=1){const pr=ensureChampionProfile(db,p,cid),n=Math.max(0,amount);if(kind==='scrim'){pr.scrimExperience+=n;pr.scrimSeason+=n;pr.confidence=Math.round(clamp(pr.confidence+n*.08,10,99))}else{pr.trainingExperience+=n;pr.trainingSeason+=n}return pr}
function championLearningMultiplier(db,p,cid){const c=db.patch.champions[cid],diff=c&&c.kit?c.kit.difficulty||5:5;return (.65+.7*(p.attrs.champion_learning||50)/100)*(.92+.2*(p.attrs.adaptability||50)/100)/(1+Math.max(0,diff-5)*.045)}
function adaptPlayerPoolsToPatch(db,notes,major=false){const changed={};for(const n of notes||[]){if(['kit','base','skill'].includes(n.type)&&n.c)changed[n.c]=(changed[n.c]||0)+1;else if(n.type==='rework'&&n.c)changed[n.c]=(changed[n.c]||0)+(n.scope==='major'?3:2)}for(const p of Object.values(db.players))if(!p.retired&&p.pool)for(const [cid,count] of Object.entries(changed)){const pr=p.pool[cid];if(!pr)continue;const adapt=(p.attrs.meta_adaptation||p.attrs.adaptability||50)/100,loss=Math.min(5,Math.max(0,Math.round(count*(major?1.25:.55)*(1.25-adapt))));pr.mastery=Math.round(clamp(pr.mastery-loss,20,99));pr.confidence=Math.round(clamp(pr.confidence-Math.ceil(loss/2),10,99))}}
function uniqNick(db,rng){for(let i=0;i<200;i++){let n=rng.pick(NICK_A)+rng.pick(NICK_B);if(rng.chance(0.2))n+=rng.pick(['','x','z','9','7']);const taken=Object.values(db.players).some(p=>p.name===n);if(!taken)return n}return 'P'+rng.int(100,999)}
function uniqId(db,prefix){let i=Object.keys(db.players).length;while(db.players[prefix+i])i++;return prefix+i}

function genPlayer(db,rng,o){
  const {role,age,base}=o, style=o.style||rng.pick(STYLES), bias=STYLE_BIAS[style], sig=o.sig||[];
  const attrs={};
  for(const g in ATTR_GROUPS)for(const a of ATTR_GROUPS[g]){
    let v=base+(bias.g[g]||0)+rng.normal(0,6);
    if(a==='smite_execution')v+=role==='JGL'?6:-30;
    if(a==='csing'&&role==='SUP')v-=18;
    if((a==='shotcalling'||a==='vision_understanding')&&(role==='SUP'||role==='JGL'))v+=6;
    if(a==='consistency'&&age<21)v-=6;
    if(ATTR_GROUPS.mental.includes(a)||ATTR_GROUPS.macro.includes(a))v-=Math.max(0,22-age)*1.2; // 어린 선수는 운영/멘탈이 덜 여묾
    attrs[a]=Math.round(clamp(v,20,99));
  }
  if(style==='caller')attrs.shotcalling=Math.max(attrs.shotcalling,Math.round(base+8));
  const tend={};for(const t of TENDENCIES)tend[t]=Math.round(clamp(50+(bias.t[t]||0)+rng.normal(0,12),5,95));
  if(role==='TOP')tend.split_preference=Math.min(95,tend.split_preference+15);
  const champs=Object.values(db.patch.champions).filter(c=>c.roles.includes(role)).map(c=>c.id);
  const sigIds=sig.map(x=>db.patch.champions[x]?x:(championByName(db,x)?.id)).filter(Boolean);
  const mySig=sigIds.length?sigIds:champs.slice().sort(()=>rng.next()-0.5).slice(0,2);
  const pool={};
  const n=clamp(Math.round(9+(age-17)*0.7+rng.normal(0,2)),7,18), picks=[...mySig,...champs.filter(c=>!mySig.includes(c)).sort(()=>rng.next()-0.5).slice(0,n)];
  for(const c of picks){const s=mySig.includes(c);
    pool[c]={mastery:Math.round(clamp(s?80+rng.normal(0,6)+(age-20):55+rng.normal(0,12),20,99)),experience:Math.round(clamp(s?70+rng.normal(0,10)+(age-20)*2:40+rng.normal(0,15),5,99)),
      matchup_knowledge:Math.round(clamp(base-10+rng.normal(0,10)+(age-20),20,99)),confidence:Math.round(clamp(s?72+rng.normal(0,8):50+rng.normal(0,10),10,99)),scrimExperience:0,trainingExperience:0,scrimSeason:0,trainingSeason:0};}
  const secondaryRoles=[],flex=SECONDARY_ROLE_OPTIONS[role]||[];if(flex.length&&rng.chance(GENERATED_SECONDARY_ROLE_RATE))secondaryRoles.push(rng.pick(flex));
  const roleFamiliarityMap={[role]:100};for(const r of secondaryRoles)roleFamiliarityMap[r]=rng.int(55,68);const peakBase={TOP:24.5,JGL:24,MID:25,ADC:25,SUP:26}[role]||25;
  const originRegion=o.region,originLocalRegion=o.originLocalRegion||originRegion;
  const p={id:o.id||uniqId(db,(o.region||'X')+'_'),name:o.name||uniqNick(db,rng),role,secondaryRoles,roleFamiliarity:roleFamiliarityMap,age,team:null,region:originRegion,originRegion,nationality:o.nationality||originRegion,originLocalRegion,activeLocalRegion:o.activeLocalRegion||originLocalRegion,localEligibility:{origin:originLocalRegion,active:o.activeLocalRegion||originLocalRegion,qualifications:{}},contractedMoves:[],attrs,tend,pool,
    pot:0,reputation:0,personality:{professionalism:Math.round(clamp(rng.normal(60,15),10,99)),ambition:Math.round(clamp(rng.normal(60,15),10,99))},
    development:{growthRate:Math.round(clamp(rng.normal(1,.1),.78,1.22)*100)/100,peakAge:Math.round(clamp(rng.normal(peakBase,1.15),21.5,29)*10)/10,declineRate:Math.round(clamp(rng.normal(1,.12),.72,1.35)*100)/100},
    career:[],careerEvents:[],titles:[],proSeasons:0,rosterRole:null,careerGoal:null,satisfaction:70,satisfactionReasons:[],concernStreak:0,wantsOut:false,wantsOutReason:null,retired:false,faYears:0,entryYear:o.entryYear??db.year,entryPath:o.entryPath||'generated',rookieClass:o.rookieClass||null,rookieTier:o.rookieTier||null,developmentTrail:[]};
  const ovr=playerOvr(p);p.pot=Math.round(clamp(o.pot!==undefined?o.pot:ovr+Math.max(0,24-age)*rng.range(0.8,2.4)+rng.normal(2,3),ovr,99));
  p.reputation=Math.round(clamp(ovr*.82+Math.max(0,age-19)*.65+rng.normal(0,3),20,95));
  p.developmentTrail=[{year:db.year,ovr}];
  db.players[p.id]=p;
  if(o.team)assignPlayerToTeam(db,p,o.team);
  return p;
}
const ROOKIE_TIER_WEIGHT={ordinary:.69,solid:.22,good:.075,elite:.015};
function rookieRoleWeights(db,R){
  const young=Object.values(db.players).filter(p=>!p.retired&&p.region===R.id&&p.age<=22),counts=Object.fromEntries(ROLES.map(r=>[r,young.filter(p=>p.role===r).length]));
  const mean=avg(Object.values(counts))||1;return Object.fromEntries(ROLES.map(r=>[r,clamp(1+(mean-counts[r])/Math.max(2,mean),.35,2.4)]));
}
function weightedRole(rng,w){const rows=ROLES.map(r=>[r,w[r]||1]),sum=rows.reduce((a,x)=>a+x[1],0);let x=rng.next()*sum;for(const [r,v] of rows){x-=v;if(x<=0)return r}return ROLES[ROLES.length-1]}
function rookieIntakeProfile(db,R){
  const first=activeTeams(db,R.id,1).length,second=R.div2?activeTeams(db,R.id,2).length:0,teams=activeTeams(db,R.id),teamN=teams.length,players=Object.values(db.players),young=players.filter(p=>!p.retired&&p.region===R.id&&p.age<=21).length;
  const desiredPipeline=first*2.05+second*1.05,shortage=clamp((desiredPipeline-young)/Math.max(4,first),-.3,1.35);
  const facilities=teams.map(t=>ensureFacilities(t).youth),dev=teams.map(t=>typeof staffProfile==='function'?staffProfile(t).development:55);
  const ecosystem=clamp((R.strength-58)/18+second/Math.max(1,first)*.35+(avg(facilities)-2)*.08+(avg(dev)-55)/180,.25,1.55);
  const rosterSize=5+(db.worldConfig.subs||0),targetSlots=teamN*rosterSize;
  const ecosystemPlayers=players.filter(p=>!p.retired&&((p.team&&db.teams[p.team]&&db.teams[p.team].region===R.id)||(!p.team&&p.region===R.id)));
  const expiring=ecosystemPlayers.filter(p=>p.team&&p.contract&&p.contract.until<=db.year).length;
  const veteranRisk=ecosystemPlayers.filter(p=>p.age>=29).length;
  const recentRetire=(R.rookieIntake||[]).slice(-3).length?Math.round((R.rookieIntake||[]).slice(-3).reduce((a,x)=>a+(x.retireReplacement||0),0)/Math.min(3,R.rookieIntake.length)):0;
  const turnoverReserve=Math.ceil(expiring*.55+veteranRisk*.16+recentRetire*.35);
  const liquidityBase=Math.ceil(teamN*(.85+(second? .12:0)));
  const freeBuffer=Math.max(ROLES.length*2,liquidityBase+turnoverReserve);
  const totalGap=Math.max(0,targetSlots+freeBuffer-ecosystemPlayers.length);
  const roleNeeds={};for(const role of ROLES){const target=teamN+Math.max(2,Math.ceil(teamN*.32)),have=ecosystemPlayers.filter(p=>p.role===role).length;roleNeeds[role]=Math.max(0,target-have)}
  const roleGap=Object.values(roleNeeds).reduce((a,b)=>a+b,0);
  const natural=Math.round(first*.86+second*.30+shortage*first*.34+turnoverReserve*.38),minimum=Math.max(5,Math.round(first*.55));
  const count=Math.max(minimum,natural,totalGap,roleGap);
  return {first,second,teams:teamN,young,desiredPipeline:Math.round(desiredPipeline*10)/10,shortage:Math.round(shortage*100)/100,ecosystem:Math.round(ecosystem*100)/100,count,targetSlots,freeBuffer,totalGap,roleNeeds,expiring,veteranRisk,turnoverReserve,liquidityBase};
}
function rookieClassLabel(w){
  if(w<.72)return '흉작';if(w<.9)return '약한 세대';if(w<1.13)return '평년';if(w<1.38)return '풍년';return '황금세대';
}
function rookieGlobalCohort(db){
  db.global=db.global||{};db.global.rookieCycles=db.global.rookieCycles||{};
  if(db.global.rookieCycles[db.year])return db.global.rookieCycles[db.year];
  const rng=new RNG((db.world?.seed||db.saveId||'world')+'/'+db.year,'rookie-global');
  let quality=Math.exp(rng.normal(0,.14)),volume=Math.exp(rng.normal(0,.07));
  const shock=rng.next();if(shock<.045)quality*=rng.range(1.22,1.48);else if(shock>.955)quality*=rng.range(.68,.84);
  quality=clamp(quality,.58,1.62);volume=clamp(volume,.86,1.16);
  return db.global.rookieCycles[db.year]={year:db.year,quality:Math.round(quality*100)/100,volume:Math.round(volume*100)/100};
}
function rookieCohortState(db,R,rng,profile){
  const global=rookieGlobalCohort(db),prev=(R.rookieIntake||[]).slice(-1)[0]?.profile?.classWave||1;
  // 직전 세대가 극단적이면 다음 해는 평균으로 돌아오려는 약한 평균회귀가 걸린다.
  const meanRevert=(1-prev)*.16,regional=Math.exp(rng.normal(meanRevert,.22));
  const classWave=clamp(global.quality*regional,.48,1.85),volumeWave=clamp(global.volume*Math.exp(rng.normal(0,.06)),.78,1.25);
  const roleWaves={};for(const role of ROLES)roleWaves[role]=Math.round(clamp(classWave*Math.exp(rng.normal(0,.16)),.42,2.15)*100)/100;
  return {globalQuality:global.quality,globalVolume:global.volume,classWave:Math.round(classWave*100)/100,volumeWave:Math.round(volumeWave*100)/100,label:rookieClassLabel(classWave),roleWaves};
}
function rookieTier(rng,profile,classWave=1){
  const eco=clamp(profile.ecosystem,.55,1.45),eliteP=clamp(ROOKIE_TIER_WEIGHT.elite*eco*classWave,.003,.07),goodP=clamp(ROOKIE_TIER_WEIGHT.good*(.72+eco*.28)*Math.sqrt(classWave),.028,.19),solidP=clamp(ROOKIE_TIER_WEIGHT.solid*(.9+eco*.1)*Math.pow(classWave,.18),.13,.32),x=rng.next();
  if(x<eliteP)return 'elite';if(x<eliteP+goodP)return 'good';if(x<eliteP+goodP+solidP)return 'solid';return 'ordinary';
}
function generateRookieClass(db,R,rng){
  const profile=rookieIntakeProfile(db,R),weights=rookieRoleWeights(db,R),out=[],forcedRoles=[],cohort=rookieCohortState(db,R,rng,profile);
  for(const role of ROLES)for(let i=0;i<(profile.roleNeeds[role]||0);i++)forcedRoles.push(role);
  // 수량은 노동시장, 질은 코호트 엔진이 별도로 결정한다. 수량 파동은 여유분에만 적용하며 공급 하한은 깨지지 않는다.
  const baseCount=profile.count,marketFloor=Math.max(profile.totalGap,Object.values(profile.roleNeeds).reduce((a,b)=>a+b,0),Math.max(5,Math.round(profile.first*.55)));
  profile.count=Math.max(marketFloor,Math.round(baseCount*cohort.volumeWave));
  Object.assign(profile,cohort);
  for(let i=0;i<profile.count;i++){
    const role=forcedRoles[i]||weightedRole(rng,weights),roleWave=cohort.roleWaves[role]||cohort.classWave,tier=rookieTier(rng,profile,roleWave),age=rng.chance(.62)?17:rng.chance(.72)?18:19;
    const tierBase={ordinary:-2,solid:0,good:2.5,elite:5}[tier],cohortEdge=clamp((roleWave-1)*1.35,-1.4,1.8),base=(R.talent||R.strength)-13+tierBase+cohortEdge+rng.normal(0,3.2),entryPath=R.div2?'tier2_pipeline':'open_qualifier';
    const p=genPlayer(db,rng,{role,age,base,region:R.id,entryYear:db.year,entryPath,rookieClass:db.year,rookieTier:tier}),o=playerOvr(p),up={ordinary:[2,7],solid:[5,10],good:[8,14],elite:[12,19]}[tier];
    p.pot=Math.round(clamp(o+rng.range(up[0],up[1])+Math.max(0,profile.ecosystem-1)*2+clamp((roleWave-1)*1.6,-1.2,2.2),o,99));p.reputation=Math.round(clamp(o*.7+rng.normal(-4,2),20,78));out.push(p);
  }
  const tiers=Object.fromEntries(['ordinary','solid','good','elite'].map(k=>[k,out.filter(p=>p.rookieTier===k).length]));
  R.rookieIntake=R.rookieIntake||[];R.rookieIntake.push({year:db.year,count:out.length,retireReplacement:profile.turnoverReserve||0,label:cohort.label,tiers,profile,roles:Object.fromEntries(ROLES.map(r=>[r,out.filter(p=>p.role===r).length]))});R.rookieIntake=R.rookieIntake.slice(-10);return out;
}
function talentSupplyErrors(db){
  const errs=[],size=5+(db.worldConfig.subs||0);
  for(const R of Object.values(db.regions)){
    const teams=activeTeams(db,R.id),ecosystem=Object.values(db.players).filter(p=>!p.retired&&((p.team&&db.teams[p.team]&&db.teams[p.team].region===R.id)||(!p.team&&p.region===R.id))),need=teams.length*size;
    if(ecosystem.length<need)errs.push(R.id+': player supply '+ecosystem.length+'/'+need);
    for(const role of ROLES){const have=ecosystem.filter(p=>p.role===role).length;if(have<teams.length)errs.push(R.id+' '+role+': role supply '+have+'/'+teams.length)}
  }
  return errs;
}
function genTactics(rng){return {aggression:rng.int(35,80),risk_tolerance:rng.int(30,75),objective_priority:rng.int(45,80),vision_investment:rng.int(45,80),scaling_preference:rng.int(30,75)}}
const PHILOSOPHIES=['win-now','youth','balanced','superstar','cost'];
const PHIL_KO={'win-now':'즉시 전력','youth':'유망주 육성','balanced':'균형','superstar':'스타 영입','cost':'효율 중시'};
const TRAIN_POINTS=100;
const SPLIT_NAME={1:'윈터',2:'스프링',3:'서머'};
// 그 해 마지막 스플릿 시즌 (승강·시상·목표 판정 기준)
function finalSeason(w,R,div=1){let best=null;for(const s of Object.values(w.seasons))if(s.region===R.id&&(s.div||1)===div&&s.split&&(!best||s.split>best.split))best=s;return best}
// 나이가 어릴수록 더 많이, 더 빠르게 오른다
function youthMul(age){return age<=18?1.4:age<=20?1.25:age<=22?1.1:age<=24?1:0.85}
function growthCap(age){return age<=18?4.2:age<=20?3.5:age<=22?2.8:age<=24?2.1:age<=26?1.5:1.0}
function defaultTraining(){return {mechanical:20,laning:20,combat:20,macro:20,mental:20,intensity:'normal'}}
function trainingIntensity(t){const x=t?.training?.intensity||'normal';return x==='light'?{growth:.9,fatigue:.45,condition:.25}:x==='high'?{growth:1.08,fatigue:1.35,condition:-.35}:{growth:1,fatigue:.8,condition:0}}
function aiManageTraining(db,t){if(!t||t.id===managedTeamId(db))return;t.training=t.training||defaultTraining();t.training.intensity=trainingRecommendation(db,t).intensity}
function ensureFacilities(t){const legacy=clamp(t.facility||2,1,5);t.facilities=t.facilities||{training:legacy,analysis:legacy,recovery:legacy,youth:legacy};for(const k of ['training','analysis','recovery','youth'])t.facilities[k]=clamp(t.facilities[k]||legacy,1,5);t.facility=Math.round((t.facilities.training+t.facilities.analysis+t.facilities.recovery+t.facilities.youth)/4);return t.facilities}
function facilityMul(t){if(!t)return 1;const f=ensureFacilities(t);return .9+.055*(f.training-1)+.02*(f.youth-1)}
function facilityAnalysisBonus(t){if(!t)return 0;return (ensureFacilities(t).analysis-1)*.012}
function facilityRecoveryBonus(t){if(!t)return 0;return (ensureFacilities(t).recovery-1)*.7}
function facilityCost(db,t,key='training'){const f=ensureFacilities(t),lv=f[key]||1;return Math.round((lv+1)*5*psOf(db,t.region)*10)/10}
function facilityUpkeep(db,t){const f=ensureFacilities(t),sum=Object.values(f).reduce((a,b)=>a+b,0);return Math.round(sum*.32*psTeam(db,t)*10)/10}
function upgradeFacility(db,t,key){if(!['training','analysis','recovery','youth'].includes(key))throw new Error('유효하지 않은 시설입니다');const f=ensureFacilities(t);if(f[key]>=5)throw new Error('이미 최고 단계입니다');const cost=facilityCost(db,t,key);if(!t.finance||t.finance.cash<cost)throw new Error('시설 증설 자금이 부족합니다');t.finance.cash=Math.round((t.finance.cash-cost)*10)/10;f[key]++;t.facility=Math.round(Object.values(f).reduce((a,b)=>a+b,0)/4);return cost}

// ---------- 지역 프리셋 / 월드 설정 ----------
// 실제 LoL e스포츠 구조를 본뜬 기본 리그 (리그 수준·시장 규모는 고정, 구조만 편집 가능)
const ROSTER_RULE_PROFILES={
  STANDARD_TIER1_2026:{id:'STANDARD_TIER1_2026',source:'GLOBAL_2026',integratedMin:5,integratedMax:10,firstTeamMin:5,firstTeamMax:10,reserveTeamMin:5,reserveTeamMax:10,reserveSubMax:5},
  ENGINE_OWNED_RESERVE:{id:'ENGINE_OWNED_RESERVE',source:'POLICY_ENGINE',integratedMin:10,integratedMax:20,firstTeamMin:5,firstTeamMax:10,reserveTeamMin:5,reserveTeamMax:10,reserveSubMax:5},
  OWNED_RESERVE_LCK_STYLE_2026:{id:'OWNED_RESERVE_LCK_STYLE_2026',source:'LCK_2026',integratedMin:11,integratedMax:20,firstTeamMin:5,firstTeamMax:10,reserveTeamMin:5,reserveTeamMax:10,reserveSubMax:5},
  LCS_2026:{id:'LCS_2026',source:'LCS_2026',integratedMin:5,integratedMax:12,firstTeamMin:5,firstTeamMax:12,reserveTeamMin:5,reserveTeamMax:10,reserveSubMax:7},
  LCP_2026:{id:'LCP_2026',source:'LCP_2026',integratedMin:5,integratedMax:10,firstTeamMin:5,firstTeamMax:10,reserveTeamMin:5,reserveTeamMax:10,reserveSubMax:5},
  LEC_2026:{id:'LEC_2026',source:'LEC_2026',integratedMin:5,integratedMax:10,firstTeamMin:5,firstTeamMax:10,reserveTeamMin:5,reserveTeamMax:10,reserveSubMax:5},
  LPL_2026:{id:'LPL_2026',source:'LPL_2026',integratedMin:5,integratedMax:10,firstTeamMin:5,firstTeamMax:10,reserveTeamMin:5,reserveTeamMax:10,reserveSubMax:5},
  CBLOL_2026:{id:'CBLOL_2026',source:'CBLOL_2026',integratedMin:5,integratedMax:10,firstTeamMin:5,firstTeamMax:10,reserveTeamMin:5,reserveTeamMax:10,reserveSubMax:5}
};
function rosterRuleProfile(id='STANDARD_TIER1_2026'){return ROSTER_RULE_PROFILES[id]||ROSTER_RULE_PROFILES.STANDARD_TIER1_2026}

const REGION_PRESETS = {
  KR:{name:'한국',leagueName:'LCK',short:'LCK',strength:75,templates:true,tier:'major',d:{teams:12,splits:3,format:'rr_de',playoffTake:6,div2:true,system:'franchise',slots:4}},
  CN:{name:'중국',leagueName:'LPL',short:'LPL',strength:74,tier:'major',d:{teams:16,splits:3,format:'groups_po',playoffTake:8,div2:true,system:'franchise',slots:4}},
  EU:{name:'유럽',leagueName:'LEC',short:'LEC',strength:71,tier:'major',d:{teams:12,splits:3,format:'rr_de',playoffTake:8,system:'franchise',slots:3}},
  NA:{name:'북미',leagueName:'LCS',short:'LCS',strength:68,tier:'major',d:{teams:10,splits:3,format:'rr_de',playoffTake:6,system:'franchise',slots:3}},
  AP:{name:'아시아태평양',leagueName:'LCP',short:'LCP',strength:67,tier:'major',d:{teams:12,splits:3,format:'rr_po',playoffTake:6,system:'mixed',slots:3}},
  BR:{name:'브라질',leagueName:'CBLOL',short:'CBLOL',strength:65,tier:'major',d:{teams:10,splits:3,format:'rr_po',playoffTake:6,system:'franchise',slots:3}},
  VN:{name:'베트남',leagueName:'VCS',short:'VCS',strength:66,tier:'emerging',parent:'AP',d:{teams:10,splits:2,format:'rr_po',playoffTake:6,system:'relegation',slots:3}},
  JP:{name:'일본',leagueName:'LJL',short:'LJL',strength:62,tier:'emerging',parent:'AP',d:{teams:10,splits:2,format:'rr_po',playoffTake:4,system:'franchise',slots:3}},
  TW:{name:'대만·홍콩·마카오',leagueName:'PCS',short:'PCS',strength:64,tier:'emerging',parent:'AP',d:{teams:10,splits:2,format:'rr_po',playoffTake:6,system:'relegation',slots:3}},
  OC:{name:'오세아니아',leagueName:'LCO',short:'LCO',strength:60,tier:'emerging',parent:'AP',d:{teams:10,splits:2,format:'rr_po',playoffTake:4,system:'relegation',slots:3}},
  SEA:{name:'동남아시아',leagueName:'SEA League',short:'SEAL',strength:61,tier:'emerging',parent:'AP',d:{teams:10,splits:2,format:'rr_po',playoffTake:6,system:'relegation',slots:3}},
  TR:{name:'튀르키예',leagueName:'TCL',short:'TCL',strength:62,tier:'emerging',parent:'EU',d:{teams:10,splits:2,format:'rr_po',playoffTake:6,system:'relegation',slots:3}},
  ME:{name:'중동·북아프리카',leagueName:'Arabian League',short:'AL',strength:60,tier:'emerging',parent:'EU',d:{teams:10,splits:2,format:'rr_po',playoffTake:6,system:'franchise',slots:3}},
  CIS:{name:'독립국가연합',leagueName:'LCL',short:'LCL',strength:63,tier:'emerging',parent:'EU',d:{teams:10,splits:2,format:'rr_po',playoffTake:6,system:'relegation',slots:3}},
  LA:{name:'라틴 아메리카',leagueName:'LLA',short:'LLA',strength:62,tier:'emerging',parent:'BR',d:{teams:10,splits:2,format:'rr_po',playoffTake:6,system:'franchise',slots:3}}
};
const INTL_PRESETS=[
  // 국제대회는 1부 프로팀 전용이다. 내부 ID는 공식 명칭을 사용하고 표시 약칭은 별도 보관한다.
  {id:'FIRST_STAND',name:'First Stand',short:'FS',phase:1,tier:1,timing:'early',teams:12,baseSlots:2,format:'first_stand',groupBo:3,knockoutBo:5,prestige:1},
  {id:'MID_SEASON_INVITATIONAL',name:'Mid-Season Invitational',short:'MSI',phase:2,tier:1,timing:'mid',teams:16,baseSlots:2,extraSlots:4,format:'msi_swiss_de',knockoutBo:5,prestige:2},
  {id:'EASTERN_CUP',name:'Eastern Cup',short:'EC',phase:2,tier:2,timing:'mid',zone:'east',teams:8,format:'regional_cup',groupBo:3,knockoutBo:5,prestige:1},
  {id:'WESTERN_CUP',name:'Western Cup',short:'WEC',phase:2,tier:2,timing:'mid',zone:'west',teams:8,format:'regional_cup',groupBo:3,knockoutBo:5,prestige:1},
  {id:'WORLD_CHAMPIONSHIP',name:'World Championship',short:'Worlds',phase:3,tier:1,timing:'end',teams:24,baseSlots:4,maxSlots:4,format:'worlds_league_phase',pots:3,potSize:8,leagueMatches:6,leagueBo:3,knockoutTake:16,knockoutBo:5,prestige:3},
  {id:'MASTERS',name:'Masters',short:'Masters',phase:3,tier:2,timing:'end',teams:16,baseSlots:2,maxSlots:3,extraSlots:4,format:'masters_groups',groupBo:3,groupLegs:2,knockoutBo:5,prestige:2},
  {id:'OPEN',name:'Open',short:'Open',phase:3,tier:3,timing:'end',teams:12,baseSlots:2,maxSlots:2,format:'open_groups',groupBo:3,groupLegs:1,knockoutBo:5,prestige:1},
];
const INTL_ZONES={east:['KR','CN','AP','VN','JP','TW','OC','SEA'],west:['EU','NA','BR','TR','ME','CIS','LA']};
const ZONE_KO={east:'Eastern',west:'Western'};

function regionCfg(id,over={}){
  const P=REGION_PRESETS[id]||{name:'새 지역',leagueName:'새 리그',short:'NEW',strength:63,d:{}},d=P.d||{};
  return {id,name:P.name,leagueName:P.leagueName,short:P.short,strength:P.strength,templates:!!P.templates,tier:P.tier||'emerging',parent:P.parent||null,
    format:'rr_po',div2:false,div2Teams:8,teams:10,splits:2,legs:2,regularBo:3,playoffTake:6,playoffBo:5,system:'franchise',relegate:1,slots:3,office:null,
    fearless:true,payScale:null,spendingRule:null,sfrMode:null,sfrTeamShare:0,salaryCap:0,salaryFloor:0,luxuryTax:.5,importLimit:null,importRecruitMinGap:null,rosterRuleProfile:null,marketProfile:null,policyMode:'engine',policyLocks:{},...d,...over,
    spendingRule:null,sfrMode:null,sfrTeamShare:0,salaryCap:0,salaryFloor:0,importLimit:null,importRecruitMinGap:null,rosterRuleProfile:null,marketProfile:null,office:null,payScale:null};
}
function defaultWorldConfig(){return {
  regions:['KR','CN','EU','NA','AP','BR'].map(id=>regionCfg(id)),
  internationals:INTL_PRESETS.map(x=>({...x})),
  subs:1, changes:'normal', startYear:2027, manage:'manual', universalLanguage:true
}}
const CHANGE_F={none:0,low:0.5,normal:1,high:1.8};

// ---------- 프로게임단 이름 ----------
const ORG_BRANDS=[['넥서스','Nexus','NX'],['반타','Vanta','VT'],['오닉스','Onyx','OX'],['크림슨','Crimson','CR'],['오로라','Aurora','AU'],['제니스','Zenith','ZN'],['헬릭스','Helix','HX'],['솔스티스','Solstice','SL'],['패러곤','Paragon','PG'],['버텍스','Vertex','VX'],['이클립스','Eclipse','EC'],['아펙스','Apex','AP'],['레디언트','Radiant','RD'],['보텍스','Vortex','VO'],['세이블','Sable','SB'],['템페스트','Tempest','TP'],['루멘','Lumen','LU'],['스펙터','Specter','SP'],['코발트','Cobalt','CB'],['아르고스','Argos','AR'],['미라지','Mirage','MR'],['케스트럴','Kestrel','KS'],['오블리비언','Oblivion','OB'],['인피니티','Infinity','IF'],['퀘이사','Quasar','QS'],['블랙쏜','Blackthorn','BT'],['하이드라','Hydra','HY'],['세라프','Seraph','SR'],['엠버','Ember','EM'],['글레이셔','Glacier','GL'],['노스타','Northstar','NS'],['프리즘','Prism','PZ']];
const ORG_SUFFIX=[['e스포츠 클럽','Esports Club','C'],['게이밍 클럽','Gaming Club','C'],['e스포츠','Esports','E'],['게이밍','Gaming','G'],['','','']];
const CORPS=[['온누리','Onnuri','O'],['한결','Hangyeol','H'],['누리','Nuri','N'],['세진','Sejin','S'],['가온','Gaon','G'],['청운','Cheongun','C'],['다온','Daon','D'],['라온','Raon','L'],['미르','Mir','M'],['아름','Areum','A'],['해솔','Haesol','Y'],['도담','Dodam','B'],['윤슬','Yunseul','U'],['한별','Hanbyeol','J']];
const CORP_BIZ=[['텔레콤','Telecom','T'],['생명','Life','L'],['모터스','Motors','M'],['에너지','Energy','E'],['전자','Electronics','D'],['증권','Securities','S'],['건설','E&C','C'],['식품','Foods','F'],['캐피탈','Capital','K']];
const MASCOTS=[['라이온즈','Lions','L'],['레드윙스','Red Wings','R'],['블리츠','Blitz','B'],['팔콘스','Falcons','F'],['레이더스','Raiders','D'],['샤크스','Sharks','S'],['나이츠','Knights','K'],['워리어스','Warriors','W'],['타이거즈','Tigers','T'],['피닉스','Phoenix','P'],['울브스','Wolves','V'],['드래곤즈','Dragons','G'],['호크스','Hawks','H'],['스팅어스','Stingers','N']];
function orgName(db,rng){
  const used=new Set(Object.values(db.teams).map(t=>t.name)), shorts=new Set(Object.keys(db.teams));
  for(let i=0;i<300;i++){
    const r=rng.next(); let name,short;
    if(r<0.45){const b=rng.pick(ORG_BRANDS),x=rng.pick(ORG_SUFFIX);name=(b[1]+' '+x[1]).trim();short=b[2]+(x[2]||'')}
    else if(r<0.8){const c=rng.pick(CORPS),z=rng.pick(CORP_BIZ),m=rng.pick(MASCOTS);name=rng.chance(0.5)?`${c[1]} ${z[1]} ${m[1]}`:`${c[1]} ${m[1]}`;short=c[2]+z[2]+m[2]}
    else{const L='ABCDEFGHJKLMNPRSTVWXZ';short=L[rng.int(0,L.length-1)]+L[rng.int(0,L.length-1)]+L[rng.int(0,L.length-1)];name=short+' '+rng.pick(['Gaming','Esports','Gaming Club'])}
    const head=name.split(' ')[0];
    const clash=Object.values(db.teams).some(t=>t.active!==false&&t.name.split(' ')[0]===head);
    if(!used.has(name)&&!shorts.has(short)&&(!clash||i>150))return {name,short};
  }
  const n='T'+rng.int(100,999);return {name:n+' Gaming',short:n};
}
function activeTeams(db,rid,div){return Object.values(db.teams).filter(t=>t.active!==false&&(!rid||t.region===rid)&&(!div||(t.division||1)===div))}
function isManagerSelectableTeam(db,t){
  const team=typeof t==='string'?db.teams[t]:t;
  return !!team&&team.active!==false&&!team.parent;
}
function managerSelectableTeams(db,rid,div){return activeTeams(db,rid,div).filter(t=>isManagerSelectableTeam(db,t))}
function engineRosterRuleProfile(region){
  if(region&&region.div2&&region.system==='franchise')return ROSTER_RULE_PROFILES.ENGINE_OWNED_RESERVE;
  return ROSTER_RULE_PROFILES.STANDARD_TIER1_2026;
}
function rosterRulesForTeam(db,t){
  const team=teamRef(db,t);if(!team)return ROSTER_RULE_PROFILES.STANDARD_TIER1_2026;
  const region=db.regions[team.region];return region&&region.rosterRuleProfile?rosterRuleProfile(region.rosterRuleProfile):engineRosterRuleProfile(region);
}
function parentTeamOf(db,t){const team=teamRef(db,t);if(!team)return null;return team.parent?db.teams[team.parent]||null:team}
function reserveTeamsOf(db,t){const parent=parentTeamOf(db,t);if(!parent)return [];return activeTeams(db,parent.region,2).filter(x=>x.parent===parent.id)}
function organizationTeams(db,t){const parent=parentTeamOf(db,t);if(!parent)return [];return [parent,...reserveTeamsOf(db,parent)]}
function organizationRoster(db,t){return Array.from(new Set(organizationTeams(db,t).flatMap(x=>x.roster||[])))}
function rosterPlanState(db,t){
  const parent=parentTeamOf(db,t);if(!parent)return null;
  const teams=organizationTeams(db,parent),assignments={};
  for(const team of teams)for(const pid of (team.roster||[]))assignments[pid]=team.id;
  return {parentId:parent.id,teamIds:teams.map(x=>x.id),assignments};
}
function validateRosterPlan(db,t,plan){
  const parent=parentTeamOf(db,t),errors=[];if(!parent)return {ok:false,errors:['구단을 찾을 수 없습니다']};
  const teams=organizationTeams(db,parent),teamIds=new Set(teams.map(x=>x.id)),rules=rosterRulesForTeam(db,parent);
  if(!reserveTeamsOf(db,parent).length)errors.push('이 구단은 산하 2군을 운영하지 않습니다');
  const base=organizationRoster(db,parent),baseSet=new Set(base),assign=plan&&plan.assignments||{},counts=Object.fromEntries(teams.map(x=>[x.id,0]));
  for(const pid of base){
    const p=db.players[pid],dst=assign[pid]||p?.team;
    if(!p){errors.push('존재하지 않는 선수가 로스터에 포함되어 있습니다: '+pid);continue}
    if(!teamIds.has(dst)){errors.push(p.name+': 같은 구단의 1군/2군에만 배치할 수 있습니다');continue}
    counts[dst]=(counts[dst]||0)+1;
  }
  for(const pid of Object.keys(assign))if(!baseSet.has(pid))errors.push('구단 통합 로스터 밖의 선수를 이동할 수 없습니다: '+pid);
  const first=parent,firstN=counts[first.id]||0;
  if(firstN<rules.firstTeamMin)errors.push('1군은 최소 '+rules.firstTeamMin+'명이어야 합니다 (현재 계획 '+firstN+'명)');
  if(firstN>rules.firstTeamMax)errors.push('1군은 최대 '+rules.firstTeamMax+'명까지 가능합니다 (현재 계획 '+firstN+'명)');
  for(const reserve of teams.filter(x=>x.parent)){
    const n=counts[reserve.id]||0;
    if(n<rules.reserveTeamMin)errors.push(reserve.name+'은 최소 '+rules.reserveTeamMin+'명이어야 합니다 (현재 계획 '+n+'명)');
    if(n>rules.reserveTeamMax)errors.push(reserve.name+'은 최대 '+rules.reserveTeamMax+'명까지 가능합니다 (현재 계획 '+n+'명)');
  }
  const total=Object.values(counts).reduce((x,y)=>x+y,0);
  if(total<rules.integratedMin||total>rules.integratedMax)errors.push('통합 로스터는 '+rules.integratedMin+'~'+rules.integratedMax+'명이어야 합니다 (현재 '+total+'명)');
  return {ok:errors.length===0,errors,counts,total,parentId:parent.id,assignments:Object.fromEntries(base.map(pid=>[pid,assign[pid]||db.players[pid].team]))};
}
function applyRosterPlan(db,t,plan,source='manager'){
  const checked=validateRosterPlan(db,t,plan);if(!checked.ok)throw new Error(checked.errors.join('\n'));
  const parent=db.teams[checked.parentId],before=Object.fromEntries(Object.keys(checked.assignments).map(pid=>[pid,db.players[pid].team])),moves=[];
  for(const [pid,dst] of Object.entries(checked.assignments))if(before[pid]!==dst)moves.push({pid,from:before[pid],to:dst,kind:dst===parent.id?'callup':'senddown'});
  for(const team of organizationTeams(db,parent))team.roster=(team.roster||[]).filter(pid=>!moves.some(m=>m.pid===pid));
  for(const m of moves){const p=db.players[m.pid],dst=db.teams[m.to];dst.roster.push(p.id);p.team=dst.id}
  if(db.world)for(const m of moves){const p=db.players[m.pid];recordPlayerEvent(p,'squad_move',db.year,{from:m.from,to:m.to,kind:m.kind,date:db.worldDate,source});if(typeof onSquadMoveSatisfaction==='function')onSquadMoveSatisfaction(db,p,m)}
  for(const team of organizationTeams(db,parent))initializeDepthChart(db,team,true);
  return {...checked,moves};
}
function rosterMoveCheck(db,p,target){
  const player=playerRef(db,p),dst=teamRef(db,target);
  if(!player)return {ok:false,reason:'선수를 찾을 수 없습니다'};
  if(!dst||dst.active===false)return {ok:false,reason:'이동할 팀을 찾을 수 없습니다'};
  const src=player.team&&db.teams[player.team];if(!src||src.active===false)return {ok:false,reason:'현재 소속팀이 없습니다'};
  if(src.id===dst.id)return {ok:false,reason:'이미 해당 스쿼드 소속입니다'};
  const plan=rosterPlanState(db,src);if(!plan)return {ok:false,reason:'구단을 찾을 수 없습니다'};
  plan.assignments[player.id]=dst.id;
  const checked=validateRosterPlan(db,src,plan);
  return checked.ok?{ok:true,kind:dst.parent?'senddown':'callup',from:src.id,to:dst.id,parent:checked.parentId}:{ok:false,reason:checked.errors[0],errors:checked.errors};
}
function movePlayerBetweenSquads(db,p,target){const player=playerRef(db,p),src=player&&player.team&&db.teams[player.team];if(!src)throw new Error('현재 소속팀이 없습니다');const plan=rosterPlanState(db,src);plan.assignments[player.id]=teamRef(db,target)?.id;const result=applyRosterPlan(db,src,plan);return result.moves[0]}
function aiManageOwnedReserve(db,t){
  const parent=teamRef(db,t);if(!parent||parent.parent||parent.id===managedTeamId(db))return [];
  const reserve=reserveTeamsOf(db,parent)[0];if(!reserve)return [];
  const last=parent.reserveReviewDate;if(last&&Math.abs((new Date(db.worldDate)-new Date(last))/86400000)<7)return [];
  parent.reserveReviewDate=db.worldDate;
  initializeDepthChart(db,parent,false);initializeDepthChart(db,reserve,false);
  const plan=rosterPlanState(db,parent),moves=[];
  for(const role of ROLES){
    const first=(parent.roster||[]).map(id=>db.players[id]).filter(p=>p&&p.role===role).sort((x,y)=>playerOvr(y)-playerOvr(x));
    const second=(reserve.roster||[]).map(id=>db.players[id]).filter(p=>p&&p.role===role).sort((x,y)=>playerOvr(y)-playerOvr(x));
    if(!first.length||!second.length)continue;
    const up=second[0],down=first.slice().sort((x,y)=>playerOvr(x)-playerOvr(y))[0],starter=starterFor(db,parent,role);
    const performanceGap=playerOvr(up)-playerOvr(down),starterTrouble=starter&&((starter.form??0)<=-7||starter.condition<55);
    if(performanceGap<2&&!(performanceGap>=0&&starterTrouble))continue;
    plan.assignments[up.id]=parent.id;plan.assignments[down.id]=reserve.id;
    moves.push({pid:up.id,kind:'callup',role,swap:down.id},{pid:down.id,kind:'senddown',role,swap:up.id});
  }
  if(!moves.length)return [];
  const checked=validateRosterPlan(db,parent,plan);if(!checked.ok)return [];
  applyRosterPlan(db,parent,plan,'ai');
  rebalanceAiRosterRoles(db,parent);rebalanceAiRosterRoles(db,reserve);
  return moves;
}
function playerRef(db,p){return typeof p==='string'?db.players[p]:p}
function teamRef(db,t){return typeof t==='string'?db.teams[t]:t}
function removePlayerFromTeam(db,p){
  const player=playerRef(db,p);if(!player)return null;
  const oldId=player.team;
  for(const t of Object.values(db.teams))if(t.roster&&t.roster.includes(player.id))t.roster=t.roster.filter(id=>id!==player.id);
  player.team=null;
  return oldId;
}
function assignPlayerToTeam(db,p,t){
  const player=playerRef(db,p),team=teamRef(db,t);
  if(!player)throw new Error('Unknown player');
  if(!team)throw new Error(`Unknown team: ${typeof t==='string'?t:'?'}`);
  const oldTeam=player.team&&db.teams[player.team],oldOrg=oldTeam?(oldTeam.parent||oldTeam.id):null,newOrg=team.parent||team.id;
  for(const other of Object.values(db.teams))if(other.id!==team.id&&other.roster&&other.roster.includes(player.id))other.roster=other.roster.filter(id=>id!==player.id);
  team.roster=Array.from(new Set([...(team.roster||[]),player.id]));player.team=team.id;
  if(typeof pState==='function'){pState(player);if(oldOrg!==newOrg){player.teamAdaptation=oldOrg?45:55;player.tacticalAdaptation=oldOrg?48:58}}
  return player;
}
function rosterIntegrityErrors(db){
  const errors=[],seen=new Map();
  for(const t of Object.values(db.teams)){
    const roster=t.roster||[];
    const local=new Set();
    for(const pid of roster){
      if(local.has(pid))errors.push(`duplicate roster entry ${t.id}:${pid}`);else local.add(pid);
      const p=db.players[pid];
      if(!p){errors.push(`missing player ${pid} in ${t.id}`);continue}
      if(p.team!==t.id)errors.push(`team mismatch ${pid}: player=${p.team||'FA'}, roster=${t.id}`);
      const prev=seen.get(pid);if(prev&&prev!==t.id)errors.push(`player ${pid} listed by ${prev} and ${t.id}`);else seen.set(pid,t.id);
    }
  }
  if(db.metaHistoryPacked){db.metaHistory=unpackMetaHistory(db.metaHistory||[]);delete db.metaHistoryPacked}
  for(const p of Object.values(db.players)){
    if(!p.team)continue;
    const t=db.teams[p.team];
    if(!t)errors.push(`player ${p.id} references missing team ${p.team}`);
    else if(!(t.roster||[]).includes(p.id))errors.push(`player ${p.id} references ${p.team} but is absent from roster`);
  }
  return errors;
}

function genTeam(db,rng,regionId,strength,o={}){
  const on=o.name?{name:o.name,short:o.short}:orgName(db,rng), subs=db.worldConfig.subs||0;
  const t={id:on.short,name:on.name,short:on.short,region:regionId,division:o.div||1,parent:o.parent||null,active:true,fans:baseFans(strength-4-(o.div===2?15:0),rng),tactics:genTactics(rng),training:defaultTraining(),philosophy:o.parent?'youth':rng.pick(PHILOSOPHIES),roster:[],founded:db.year};
  db.teams[t.id]=t;
  const tb=strength+rng.normal(0,3);
  for(const role of ROLES){const age=o.parent?rng.int(17,20):rng.int(18,27);genPlayer(db,rng,{role,age,base:tb+(age<20?-4:0),region:regionId,team:t.id})}
  for(let i=0;i<subs;i++){const age=rng.int(17,20);genPlayer(db,rng,{role:rng.pick(ROLES),age,base:tb-7,region:regionId,team:t.id})}
  initFinance(db,t,rng);t.roster.forEach(id=>signContract(db,db.players[id],t,marketSalary(db,db.players[id],regionId),rng.int(1,3)));
  return t;
}
function makeAcademy(db,rng,parent){
  const R=db.regions[parent.region];let short=parent.short+'C';while(db.teams[short])short=parent.short+String.fromCharCode(65+rng.int(0,25));
  return genTeam(db,rng,R.id,R.strength-9,{div:2,parent:parent.id,name:parent.name+' Challengers',short});
}
function reserveRequirement(db,t){
  const team=teamRef(db,t);if(!team||team.parent||(team.division||1)!==1)return 'none';
  const R=db.regions[team.region];if(!R||!R.div2)return 'none';
  if(R.system==='franchise')return 'required';
  if(R.system==='mixed')return team.franchised?'required':'optional';
  return 'optional';
}
function promotionEligible(db,t){
  const team=teamRef(db,t);if(!team||team.active===false||(team.division||1)!==2)return false;
  if(team.parent)return false;
  const R=db.regions[team.region];return !!R&&(R.system==='relegation'||R.system==='mixed');
}
function createDiv2(db,rng,R){
  R.div2=true;
  const first=activeTeams(db,R.id,1);
  if(R.system==='franchise'){
    first.forEach(t=>{t.franchised=true;t.license='franchise';if(!reserveTeamsOf(db,t).length)makeAcademy(db,rng,t)});
  }else if(R.system==='mixed'){
    markFranchised(db,R);
    first.forEach(t=>{t.license=t.franchised?'certified':'open';if(reserveRequirement(db,t)==='required'&&!reserveTeamsOf(db,t).length)makeAcademy(db,rng,t)});
    const target=R.div2Teams||Math.max(8,Math.min(12,first.length));
    const independent=Math.max(4,target-activeTeams(db,R.id,2).length);
    for(let i=0;i<independent;i++)genTeam(db,rng,R.id,R.strength-8,{div:2});
  }else{
    first.forEach(t=>{t.franchised=false;t.license='open'});
    const n=R.div2Teams||Math.max(6,Math.min(10,first.length));
    for(let i=0;i<n;i++)genTeam(db,rng,R.id,R.strength-8,{div:2});
  }
  if(R.policyMode==='engine'&&!R.policyLocks?.rosterRuleProfile)R.rosterRuleProfile=activeTeams(db,R.id,2).some(t=>t.parent)?'ENGINE_OWNED_RESERVE':'STANDARD_TIER1_2026';
}
function abolishDiv2(db,R){R.div2=false;for(const t of activeTeams(db,R.id,2))foldTeam(db,t);if(R.policyMode==='engine'&&!R.policyLocks?.rosterRuleProfile)R.rosterRuleProfile='STANDARD_TIER1_2026'}
function reconcileTier2Structure(db,rng,R,ev=()=>{}){
  if(!R||!R.div2)return;
  const first=activeTeams(db,R.id,1);
  if(R.system==='franchise'){
    first.forEach(t=>{t.franchised=true;t.license='franchise';if(!reserveTeamsOf(db,t).length){const a=makeAcademy(db,rng,t);ev(`${t.name} 산하 2군 창단: ${a.name}`)}});
  }else if(R.system==='mixed'){
    first.forEach(t=>{
      t.license=t.franchised?'certified':'open';
      if(t.franchised&&!reserveTeamsOf(db,t).length){const a=makeAcademy(db,rng,t);ev(`${t.name} 인증 유지용 산하 2군 창단: ${a.name}`)}
    });
  }
  for(const a of activeTeams(db,R.id,2).filter(t=>t.parent)){
    const parent=db.teams[a.parent];
    if(!parent||parent.active===false||parent.region!==R.id||(parent.division||1)!==1||reserveRequirement(db,parent)!=='required'){
      foldTeam(db,a);ev(`${a.name} 산하 2군 운영 종료`);
    }
  }
  if(R.policyMode==='engine'&&!R.policyLocks?.rosterRuleProfile)R.rosterRuleProfile=activeTeams(db,R.id,2).some(t=>t.parent)?'ENGINE_OWNED_RESERVE':'STANDARD_TIER1_2026';
}
function markFranchised(db,R){const ts=activeTeams(db,R.id,1).sort((a,b)=>(b.fans||0)-(a.fans||0));ts.forEach((t,i)=>t.franchised=i<Math.ceil(ts.length/2))}
function deriveRegionPayScale(R){
  const strength=R.strength||63,teams=R.teams||8,tierBoost=R.tier==='major'?.12:0,parentAdj=R.parent?-.08:0;
  return Math.round(clamp(.28+(strength-58)*.045+Math.log2(Math.max(4,teams)/8)*.08+tierBoost+parentAdj,.22,1.35)*100)/100;
}
function inferRegionPolicy(db,R){
  if(!R||R.policyMode!=='engine')return R;
  const teams=activeTeams(db,R.id,1),n=Math.max(1,teams.length);
  const owners=teams.map(t=>t.owner&&t.owner.wealth||50),ownerAvg=avg(owners),fans=teams.map(t=>t.fans||30),fanAvg=avg(fans);
  const pays=teams.map(t=>topFivePayroll(db,t)).filter(x=>x>0).sort((a,b)=>a-b),med=pays.length?pays[Math.floor(pays.length/2)]:Math.max(1,8*psOf(db,R.id)),disp=pays.length>1?pays[pays.length-1]/Math.max(.1,pays[0]):1;
  const locals=Object.values(db.players).filter(p=>!p.retired&&isLocalPlayer(p,R.id)&&playerOvr(p)>=R.strength-10).length/n,reserveOwned=R.div2&&activeTeams(db,R.id,2).some(t=>t.parent);
  R.rosterRuleProfile=reserveOwned?'ENGINE_OWNED_RESERVE':'STANDARD_TIER1_2026';
  const importNeed=clamp((6-locals)/4+(R.strength<66?.25:0)+(fanAvg>50?.15:0),0,1.5),spendPower=clamp((ownerAvg-45)/35+(R.payScale-.55),0,2);
  R.marketProfile=spendPower>=1.15?'high_spend':importNeed>=.75?'open_market':locals>=7?'domestic_development':'balanced';
  R.importLimit=FIRST_TEAM_NON_LOCAL_LIMIT; // legacy field: 1군 비로컬 상한은 글로벌 2명 고정
  R.reserveImportLimit=clamp(Math.round(1+importNeed+(R.marketProfile==='open_market'?.7:0)),1,4);
  R.importRecruitMinGap=clamp(Math.round(3-importNeed*2-spendPower*.45),0,4);
  const pressure=n>=8&&disp>=2.65&&ownerAvg>=52;
  R.spendingRule=pressure?'sfr_top5':'none';
  if(pressure){R.sfrMode='engine_progressive';R.sfrTeamShare=clamp(Math.round((.6+(fanAvg/100)*.25)*100)/100,.6,.85);R.salaryCap=Math.max(1,Math.round(med*(1.35+Math.min(.2,disp/20))));R.salaryFloor=Math.max(0,Math.round(R.salaryCap*clamp(.42+(locals/20),.42,.58)));R.luxuryTax=clamp(Math.round((.55+(disp-2.5)*.18)*100)/100,.5,1.15)}
  else{R.sfrMode=null;R.sfrTeamShare=0;R.salaryCap=0;R.salaryFloor=0;R.luxuryTax=.5}
  const expansionPressure=fanAvg>=52&&locals>=5&&ownerAvg>=55,costPressure=fanAvg<30||ownerAvg<38;
  R.office=costPressure?'conservative':expansionPressure?'expansion':disp>2.4?'balance':spendPower>1?'revenue':'conservative';
  R.policyBasis={year:db.year,teams:n,ownerAvg:Math.round(ownerAvg),fanAvg:Math.round(fanAvg),payDisp:Math.round(disp*100)/100,localDepth:Math.round(locals*10)/10,importNeed:Math.round(importNeed*100)/100,spendPower:Math.round(spendPower*100)/100,reserveOwned,source:'engine'};
  return R;
}

function addRegion(db,rng,cfg){
  const R={...cfg,talent:cfg.strength,joined:db.year,lastPlacement:null,metrics:[],decisions:[]};
  R.payScale=deriveRegionPayScale(R);
  db.regions[R.id]=R;
  let made=0;
  if(R.templates) for(const tt of TEAM_TEMPLATES.slice(0,R.teams)){
    const t={id:tt.id,name:tt.name,short:tt.short,region:R.id,division:1,active:true,fans:baseFans(tt.base,rng),tactics:{...tt.tactics},training:defaultTraining(),philosophy:rng.pick(PHILOSOPHIES),roster:[],founded:db.year};
    db.teams[tt.id]=t;
    for(const [nick,role,age,style,sig] of tt.players)genPlayer(db,rng,{id:tt.id+'_'+role,name:nick,role,age,style,sig,base:tt.base,region:R.id,team:tt.id});
    for(let i=0;i<(db.worldConfig.subs||0);i++)genPlayer(db,rng,{role:rng.pick(ROLES),age:rng.int(17,20),base:tt.base-8,region:R.id,team:tt.id});
    initFinance(db,t,rng);t.roster.forEach(id=>signContract(db,db.players[id],t,marketSalary(db,db.players[id],R.id),rng.int(1,3)));
    made++;
  }
  for(let i=made;i<R.teams;i++) genTeam(db,rng,R.id,R.strength+rng.normal(0,3.5));
  if(R.system==='mixed')markFranchised(db,R);
  if(R.div2){R.div2=false;createDiv2(db,rng,R)}
  R.baseSlots=R.slots;
  for(let i=0;i<Math.ceil(R.teams*0.6);i++) genPlayer(db,rng,{role:rng.pick(ROLES),age:rng.int(17,19),base:R.strength-11+rng.normal(0,5),region:R.id});
  inferRegionPolicy(db,R);
  return R;
}
function buildWorld(cfg){
  cfg=JSON.parse(JSON.stringify(cfg||defaultWorldConfig()));
  const db={version:15,saveId:'save-'+Date.now().toString(36),manager:{id:'manager-human',teamId:null,startMode:null,careerStartedAt:null},worldDate:`${cfg.startYear||2027}-01-01`,awards:[],hof:[],global:{decisions:[],power:{}},patch:buildPatch(),teams:{},players:{},regions:{},competitions:{},worldConfig:cfg,world:null,history:[],news:[],year:cfg.startYear||2027,configDirty:false,scout:{}};
  const rng=new RNG('world-v7','gen');
  initPatches(db);
  for(const r of cfg.regions) addRegion(db,rng,r);
  if(typeof ensureTeamStaff==='function'){for(const t of activeTeams(db))ensureTeamStaff(db,t,rng);genStaffPool(db,rng)}
  prepareFirstSeasonFreeAgency(db);
  return db;
}
function managedTeamId(db){return db.manager&&db.manager.teamId||null}
function managedTeam(db){const id=managedTeamId(db);return id&&db.teams[id]?db.teams[id]:null}
function setManagedTeam(db,teamId){
  if(teamId!==null&&(!db.teams[teamId]||db.teams[teamId].active===false))throw new Error('관리할 수 없는 팀입니다');
  db.manager.teamId=teamId;return teamId;
}
function startCareer(db,teamId,seed){
  if(!db.firstSeasonSetup||!db.firstSeasonSetup.blankRosters)throw new Error('첫 시즌 백지 로스터 세계가 준비되지 않았습니다');
  return beginInitialRosterPhase(db,teamId,seed);
}

function validateConfig(cfg){
  const errs=[], shorts=new Set();
  if(!cfg.regions.length)errs.push('리그가 하나 이상 있어야 합니다');
  for(const r of cfg.regions){
    if(!r.short||shorts.has(r.short))errs.push(`리그 약칭 "${r.short}"이 비었거나 겹칩니다`);shorts.add(r.short);shorts.add(r.short+'2');
    if(r.teams<10||r.teams%2)errs.push(`${r.leagueName}: 1부 팀 수는 최소 10팀이며 짝수여야 합니다`);
    if(r.playoffTake>r.teams)errs.push(`${r.leagueName}: 플레이오프 진출 팀이 전체 팀보다 많습니다`);
    if(r.format==='groups_po'&&r.teams<10)errs.push(`${r.leagueName}: 그룹 스테이지 방식은 10팀 이상에서 쓸 수 있습니다`);
    if(r.div2&&r.system!=='franchise'&&(r.div2Teams||6)%2)errs.push(`${r.leagueName}: 하부 리그 팀 수는 짝수여야 합니다`);
  }
  for(const it of cfg.internationals) if(shorts.has(it.id)||shorts.has(it.short))errs.push(`${it.name}: 리그 약칭과 겹칩니다`);
  return errs;
}

// ---------- 리그/시즌 구성 ----------
function divName(R){return R.system==='franchise'?`${R.leagueName} 챌린저스`:`${R.leagueName} 2부`}
function leagueComp(db,rid,div=1){
  const R=db.regions[rid], teams=activeTeams(db,rid,div).filter(t=>div===1||true).map(t=>t.id);
  return {id:div===2?R.short+'2':R.short,name:div===2?divName(R):R.leagueName,short:div===2?R.short+'2':R.short,region:rid,div,teams,rules:{fearless:true},stages:leagueStages(R,teams.length,div)};
}
function startWorldSeason(db,myTeam,seed){
  setManagedTeam(db,myTeam);
  const regs=Object.values(db.regions), I=db.worldConfig.internationals, maxK=Math.max(...regs.map(r=>r.splits||1));
  const steps=[];
  const intlSteps=tm=>{const tops=I.filter(i=>i.timing===tm&&i.tier!=='low').sort((a,b)=>(a.prestige||1)-(b.prestige||1)),lows=I.filter(i=>i.timing===tm&&i.tier==='low');
    const out=tops.map(i=>({kind:'intl',ids:[i.id],label:i.name}));
    if(lows.length){if(out.length){const L=out[out.length-1];L.ids.push(...lows.map(i=>i.id));L.label+=` · ${lows.map(i=>i.name).join(' · ')}`}else out.push({kind:'intl',ids:lows.map(i=>i.id),label:lows.map(i=>i.name).join(' · ')})}
    return out};
  // 3스플릿제: 스플릿1(윈터) → 퍼스트 스탠드 → 스플릿2(스프링) → MSI → 스플릿3(서머) → 월즈. 스플릿이 적은 리그는 뒤쪽 스플릿만 치른다
  const tim={1:'early',2:'mid',3:'end'};
  for(let sp=1;sp<=3;sp++){
    if(regs.some(r=>(r.splits||1)>=4-sp))steps.push({kind:'league',split:sp,label:maxK===1?'정규 시즌':SPLIT_NAME[sp]});
    steps.push(...intlSteps(tim[sp]));
  }
  const manage=db.world?db.world.manage:(db.worldConfig.manage||'manual');
  db.world={year:db.year,seed,manage,phase:'season',seasons:{},steps,step:-1,report:null,pendingOfficial:null,lastDate:`${db.year}-01-07`,offers:[],marketLog:[]};
  seasonPatch(db,`${db.year}-01-02`,new RNG(seed+db.year,'patch'));
  setGoals(db);
  advanceStep(db);
}
function seasonLastDate(s){return s.days[s.days.length-1].date}
// 저장 공간 절약: 내 지역이 아닌 리그 경기는 세트 요약만 남긴다
function compactSeason(db,s){
  if(s.compact)return; const my=db.teams[managedTeamId(db)].region; if(s.region===my||db.competitions[s.comp].international)return;
  for(const d of s.days)for(const m of d.matches)if(m.res){const r=m.res;r.games=r.games.map(g=>({n:g.n,blue:g.blue,red:g.red,winner:g.winner,kills:g.kills,dur:g.dur,mvp:g.mvp}));delete r.tac;r.lite=true}
  s.compact=true;
}
function advanceStep(db){
  const w=db.world;
  for(const s of Object.values(w.seasons))if(s.done)compactSeason(db,s);
  for(const s of Object.values(w.seasons)){const d=seasonLastDate(s);if(d>w.lastDate)w.lastDate=d}
  while(true){
    w.step++;
    if(w.step>=w.steps.length){w.phase='offseason';news(db,`${w.year} 시즌 일정이 모두 끝났습니다`);return}
    const st=w.steps[w.step], start=addDays(w.lastDate,st.kind==='intl'?18:(w.step===0?7:14));
    if(st.kind==='league'){
      if(st.split>1&&w.step>0){ // 스플릿 개막: 대형 패치 + 사무국 중간 점검
        const rng=new RNG(w.seed+w.year,'mid');
        const p=newPatch(db,start,true,rng);db.patches.nextDate=addDays(start,db.patches.cadence||14);
        const nc=p.notes.find(n=>n.type==='new');news(db,`${SPLIT_NAME[st.split]} 개막 패치 ${p.id}${nc?` — 신규 챔피언 ${nc.def.name} 출시`:''}`);
        officeMidSeason(db,rng,CHANGE_F[db.worldConfig.changes]??1);
      }
      let any=false;
      for(const R of Object.values(db.regions)){
        if((R.splits||1)<4-st.split)continue;
        for(const div of R.div2?[1,2]:[1]){
          if(activeTeams(db,R.id,div).length<2)continue;
          const comp=leagueComp(db,R.id,div); db.competitions[comp.id]=comp;
          const key=comp.id+'-'+st.split, s=newSeason(db,comp.id,w.year,`${w.seed}/${w.year}/${key}`,start,key);
          s.key=key;s.split=st.split;s.region=R.id;s.div=div;s.step=w.step;s.label=(R.splits||1)>1?SPLIT_NAME[st.split]:'';
          w.seasons[key]=s;any=true;
        }
      }
      if(any)return;
    } else {let any=false;const taken=new Set();for(const id of (st.ids||[st.id]))if(startInternational(db,id,start,taken))any=true;if(any)return}
  }
}
function placements(db,s){
  const comp=db.competitions[s.comp];const reg=standings(db,s,comp.stages[0].id).map(x=>x.tid);
  const out=[s.champion,s.runnerUp].filter(Boolean);for(const t of reg)if(!out.includes(t))out.push(t);return out;
}
function regionPlacements(db,R){
  const w=db.world, act=activeTeams(db,R.id,1).map(t=>t.id);
  const done=[3,2,1].map(sp=>w.seasons[R.short+'-'+sp]).find(s=>s&&s.done);
  let base=done?placements(db,done):(R.lastPlacement||[]);
  base=base.filter(t=>act.includes(t));
  const rest=act.filter(t=>!base.includes(t)).sort((a,b)=>teamStrength(db,b)-teamStrength(db,a));
  return [...base,...rest];
}
function regionPower(db,R){const h=(db.global&&db.global.power||{})[R.id];return h!==undefined?h:R.strength}
function teamStrength(db,tid){const t=db.teams[tid];return avg(ROLES.map(r=>{const p=starterFor(db,t,r);return p?playerOvr(p):40}))}
function startInternational(db,id,start,taken=new Set()){
  const w=db.world, it=db.worldConfig.internationals.find(x=>x.id===id); if(!it)return false;
  const regs=Object.values(db.regions).filter(R=>!it.zone||(INTL_ZONES[it.zone]||[]).includes(R.id)).sort((a,b)=>regionPower(db,b)-regionPower(db,a));
  const topSlots=R=>{const top=db.worldConfig.internationals.find(x=>x.tier!=='low'&&x.timing===it.timing&&x.entry==='slots');return top?Math.max(1,Math.ceil(R.slots*(top.ratio||1))):R.slots};
  const lists=regs.map(R=>{
    if(it.entry==='champions')return regionPlacements(db,R).slice(0,1);
    if(it.entry==='slots')return regionPlacements(db,R).slice(0,Math.max(1,Math.ceil(R.slots*(it.ratio||1))));
    const per=(it.per||2)*(regs.length<=2?2:1);
    if(it.entry==='div2'&&R.div2){const s=[3,2,1].map(sp=>w.seasons[R.short+'2-'+sp]).find(s=>s&&s.done);if(s)return placements(db,s).filter(t=>!taken.has(t)).slice(0,per)}
    // 'next' (또는 하부 리그 없는 지역): 상위 대회 진출권 바로 다음 순위부터, 같은 기간 다른 대회에 이미 나간 팀은 건너뜀
    return regionPlacements(db,R).slice(topSlots(R)).filter(t=>!taken.has(t)).slice(0,per);
  }).map(l=>l.filter(t=>!taken.has(t)));
  const teams=[];for(let k=0;k<6;k++)for(const l of lists)if(l[k])teams.push(l[k]);
  if(teams.length<4)return false;
  teams.forEach(t=>taken.add(t));
  db.competitions[id]={id,name:it.name,short:it.short||id,teams,rules:{fearless:true},international:true,tier:it.tier||'top',stages:intlStages(it.format,teams,it.bo)};
  const s=newSeason(db,id,w.year,`${w.seed}/${w.year}/${id}`,start,id);
  s.key=id;s.label='';s.step=w.step;w.seasons[id]=s;
  s.stagesInfo=db.competitions[id].stages.map(x=>x.name).join(' → ');
  news(db,`${it.name} 개막 — ${teams.length}팀 참가 (${INTL_FORMATS[it.format]||it.format})`);
  return true;
}
function activeSeasons(db){return Object.values(db.world.seasons).filter(s=>!s.done)}
function nextDate(db){let next=null;for(const s of Object.values(db.world.seasons)){if(s.done)continue;const d=s.days[s.cur].date;if(next===null||d<next)next=d}return next}
function nextTeamMatch(db,tid){
  let best=null;for(const s of Object.values(db.world?.seasons||{})){if(s.done)continue;for(let i=s.cur;i<s.days.length;i++){const d=s.days[i],m=d.matches.find(x=>!x.res&&(x.a===tid||x.b===tid));if(m&&(!best||d.date<best.date)){best={date:d.date,opponent:m.a===tid?m.b:m.a,comp:s.comp};break}}}return best;
}
function daysUntil(db,date){return date?Math.max(0,Math.ceil((new Date(date)-new Date(db.worldDate))/86400000)):99}
function trainingRecommendation(db,t){
  const next=nextTeamMatch(db,t.id),days=daysUntil(db,next?.date),roster=t.roster.map(id=>db.players[id]).filter(Boolean),fat=avg(roster.map(p=>p.fatigue||0)),cond=avg(roster.map(p=>p.condition??96));
  const intensity=fat>38||cond<84||days<=1?'light':days>=5&&fat<20&&cond>91?'high':'normal';
  const scrim=days>=2&&fat<42&&cond>80;return {intensity,scrim,next,days,fat,cond};
}
function pendingOfficialRefs(db,q){
  const s=db.world.seasons[q.seasonKey],day=s&&s.days[s.cur],m=day&&day.matches.find(x=>x.id===q.matchId);
  if(!s||!m||m.res)return null;const comp=db.competitions[s.comp],cfgIdx=comp.stages.findIndex(x=>x.id===day.stage),cfg=comp.stages[cfgIdx];
  return {s,day,m,comp,cfg,cfgIdx};
}
function pendingOfficialSession(db){
  const p=db.world&&db.world.pendingOfficial,q=p&&p.queue&&p.queue[0];if(!q)return null;
  const refs=pendingOfficialRefs(db,q);if(!refs)return null;
  if(!q.session)q.session=scheduledSeriesSession(db,refs.s,refs.m).session;
  return {p,q,refs,session:q.session};
}
function pendingOfficialSelectionSetup(db){
  const x=pendingOfficialSession(db);if(!x)return null;
  const me=managedTeamId(db),prompt=seriesSelectionPrompt(db,x.session,me);if(!prompt)return null;
  const last=x.session.games[x.session.games.length-1]||null,score=[x.session.wins[x.session.a],x.session.wins[x.session.b]];
  return {...x.refs,prompt,session:x.session,game:x.session.g,score,lastGame:last,homeTeam:x.refs.m.a};
}
function applyPendingOfficialSelection(db,choice){
  const x=pendingOfficialSession(db);if(!x)throw new Error('No pending official selection');
  return seriesApplyManagedSelection(db,x.session,managedTeamId(db),choice);
}
function pendingOfficialDraftSetup(db){
  const x=pendingOfficialSession(db);if(!x)return null;
  if(!x.session.current&&!x.session.selectionResolved)return null;
  const cur=seriesSessionPrepareGame(db,x.session);if(!cur)return null;
  return {...x.refs,...cur,draftCtx:cur.snap,session:x.session,seasonKey:x.q.seasonKey,pendingDate:x.p.date,game:x.session.g,score:[x.session.wins[x.session.a],x.session.wins[x.session.b]],fearlessUsed:x.session.ctx.used.slice(),homeTeam:x.refs.m.a};
}
function resolvePendingOfficialMatch(db,forcedDraft){
  const w=db.world,p=w&&w.pendingOfficial,q=p&&p.queue&&p.queue[0];if(!q)throw new Error('No pending official match');
  const refs=pendingOfficialRefs(db,q);if(!refs)throw new Error('Pending official match is stale');
  if(!q.session)q.session=scheduledSeriesSession(db,refs.s,refs.m).session;
  const played=playSeriesSessionGame(db,q.session,{bans:forcedDraft.bans,picks:forcedDraft.picks},false);
  if(!played.done)return {game:played.game,done:false,score:played.score,pending:w.pendingOfficial};
  const series=seriesSessionResult(db,q.session);commitScheduledSeries(db,refs.s,refs.m,series);
  const finalized=finalizeCompetitionDay(db,refs.s,refs.day,refs.cfgIdx,refs.cfg);if(finalized)scoutFromDay(db,refs.s,refs.day);
  p.queue.shift();if(!p.queue.length){w.pendingOfficial=null;if(!activeSeasons(db).length)advanceStep(db)}
  return {game:played.game,done:true,score:played.score,rec:series.rec,lines:series.lines,finalized,pending:w.pendingOfficial};
}
function playWorldDay(db){
  const w=db.world;if(w.phase!=='season')return null;
  if(w.pendingOfficial&&w.pendingOfficial.queue&&w.pendingOfficial.queue.length)return {date:w.pendingOfficial.date,played:[],pending:w.pendingOfficial};
  const d=nextDate(db);if(!d){advanceStep(db);return {date:null,played:[],pending:null}}
  db.worldDate=d;patchTick(db,d,new RNG(w.seed+d,'patch'));dailyRecovery(db);
  for(const t of activeTeams(db))aiManageTraining(db,t);
  if(typeof aiRunScrims==='function')aiRunScrims(db,new RNG(w.seed+d,'scrim'));
  for(const t of activeTeams(db,null,1))aiManageOwnedReserve(db,t);
  const played=[],queue=[],me=managedTeamId(db);
  for(const [seasonKey,s] of Object.entries(w.seasons))if(!s.done&&s.days[s.cur].date===d){
    const r=playDay(db,s,{deferTeam:me});played.push({s,day:r.day});
    if(r.finalized)scoutFromDay(db,s,r.day);
    for(const x of r.pending)queue.push({seasonKey,matchId:x.matchId,date:d});
  }
  if(queue.length)w.pendingOfficial={date:d,queue};
  else if(!activeSeasons(db).length)advanceStep(db);
  return {date:d,played,pending:w.pendingOfficial};
}
function news(db,text){db.news.unshift({year:db.world?db.world.year:db.year,text});if(db.news.length>250)db.news.length=250}

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

function ageCurve(age,g){
  const T={mechanical:[[19,3],[21,2],[23,0.8],[25,0],[27,-1],[99,-2.2]],laning:[[19,2.5],[22,1.8],[24,0.6],[26,0],[28,-0.8],[99,-1.8]],combat:[[19,2.5],[22,1.8],[24,0.6],[26,0],[28,-0.8],[99,-1.8]],
    macro:[[19,2.5],[23,2],[26,1],[28,0.3],[30,-0.3],[99,-1]],mental:[[19,2.5],[23,2],[26,1],[28,0.3],[30,-0.3],[99,-1]]}[g];
  for(const [a,v] of T)if(age<=a)return v;return -1;
}
function growPlayer(db,p,rng,games,champGames){
  const team=p.team?db.teams[p.team]:null, before=playerOvr(p),dev=ensurePlayerDevelopment(p);
  const room=clamp((p.pot-before)/10,-0.5,1.5), prof=p.personality.professionalism/100,ageShift=dev.peakAge-25;
  const coach=team?staffDevelopmentFor(team,p.role)/100:0.45, play=clamp(games/30,0,1);
  const tr=team?team.training:defaultTraining(), intensity=trainingIntensity(team),tsum=['mechanical','laning','combat','macro','mental'].reduce((a,k)=>a+(+tr[k]||0),0)||1;
  for(const g in ATTR_GROUPS){
    // 훈련 포인트는 총 100점 한도: 배분하지 않은 포인트는 버려진다 (나눠 쓰는 만큼만 효과)
    const base=ageCurve(p.age-ageShift,g), train=team?(Math.min(TRAIN_POINTS,tr[g])/TRAIN_POINTS*5-1)*0.9:-0.3;
    pState(p);
    let d=base>0?base*dev.growthRate*(0.45+room*0.6)*(0.7+0.6*prof)*(0.8+0.4*coach)*(0.65+0.55*play)*trainingGrowthMul(team)*facilityMul(team)*intensity.growth*(0.9+0.2*p.morale/100):base*dev.declineRate*(1.3-0.6*prof);
    d+=train*(base>0?1:0.5);
    if(d>0)d*=youthMul(p.age);
    d=Math.min(d,growthCap(p.age)); // 한 시즌 영역별 성장 상한 (어릴수록 높음)
    const ceil=Math.min(99,p.pot+6); // 잠재력 + 6을 넘는 능력치는 더 오르지 않음
    for(const a of ATTR_GROUPS[g]){const v=p.attrs[a]+d+rng.normal(0,1.3);p.attrs[a]=Math.round(clamp(d>0&&p.attrs[a]>=ceil?Math.min(v,p.attrs[a]):d>0?Math.min(v,Math.max(ceil,p.attrs[a])):v,20,99))}
  }
  // 챔피언 폭: 공식전 + 스크림 + 훈련 + 난이도 + 학습 능력을 함께 반영
  for(const c in champGames)ensureChampionProfile(db,p,c);
  if(team&&p.pool){const practice=Math.max(2,Math.round((tr.combat+tr.mental)/12*(.7+coach*.5)));Object.entries(p.pool).sort((a,b)=>b[1].mastery-a[1].mastery).slice(0,6).forEach(([c])=>practiceChampion(db,p,c,'training',practice))}
  for(const c of Object.keys(p.pool||{})){const n=champGames[c]||0,pr=ensureChampionProfile(db,p,c),learn=championLearningMultiplier(db,p,c),practiceGain=(pr.scrimSeason||0)*.16+(pr.trainingSeason||0)*.09,officialGain=Math.min(7,n*.42),gain=Math.min(8,(officialGain+practiceGain)*learn*(p.age<22?1.12:1));
    if(n||practiceGain){pr.mastery=Math.round(clamp(pr.mastery+gain,20,99));pr.experience=Math.round(clamp(pr.experience+n*1.5,0,999));pr.confidence=Math.round(clamp(pr.confidence+rng.normal(n?2:1,3),10,99))}
    else {pr.mastery=Math.round(clamp(pr.mastery-rng.range(0,1.8)*(1-(p.attrs.meta_adaptation||50)/180),20,99));if(pr.mastery<36&&Object.keys(p.pool).length>12)delete p.pool[c]}
    if(p.pool[c]){pr.matchup_knowledge=Math.round(clamp(pr.matchup_knowledge+(n?1.5:.35),20,99));pr.scrimSeason=0;pr.trainingSeason=0}}
  if(games>0)p.proSeasons=(p.proSeasons||0)+1;p.age++;
  return playerOvr(p)-before;
}
function playerValue(db,p,team){
  const o=playerOvr(p), up=Math.max(0,p.pot-o);
  const w={'win-now':0.1,'youth':0.6,'balanced':0.3,'superstar':0.15,'cost':0.35}[team.philosophy]||0.3;
  return o+up*w-(team.philosophy==='youth'&&p.age>26?2:0);
}

// ---- 저장용 압축: 능력치·성향·챔피언 폭을 배열로 ----
function packMetaHistory(rows){
  return (rows||[]).map(r=>[
    r.date,r.patch,r.comp,r.season,r.year,r.split,r.stage,r.league,r.international?1:0,r.regions||[],
    (r.sides||[]).map(s=>[s.team,s.region,s.win?1:0,(s.picks||[]).map(p=>{const x=typeof p==='string'?{champ:p}:p;return [x.champ,x.role||null,x.player||null,x.items||[],x.runes||[]]})]),
    r.bans||[]
  ]);
}
function unpackMetaHistory(rows){
  return (rows||[]).map(r=>Array.isArray(r)?{date:r[0],patch:r[1],comp:r[2],season:r[3],year:r[4],split:r[5],stage:r[6],league:r[7],international:!!r[8],regions:r[9]||[],sides:(r[10]||[]).map(s=>({team:s[0],region:s[1],win:!!s[2],picks:(s[3]||[]).map(p=>({champ:p[0],role:p[1],player:p[2],items:p[3]||[],runes:p[4]||[]}))})),bans:r[11]||[]}:r);
}
const ALL_ATTRS=Object.values(ATTR_GROUPS).flat();
function seriesResultForSave(r,lite){
  const q={...r};delete q.seed;delete q.firstChoice;
  if(lite&&!q.lite){q.games=(q.games||[]).map(g=>({n:g.n,blue:g.blue,red:g.red,winner:g.winner,kills:g.kills,dur:g.dur,mvp:g.mvp}));delete q.tac;q.lite=true}
  return q;
}
function worldForSave(db){
  const w=db.world;if(!w)return w;const managed=db.teams&&db.teams[managedTeamId(db)],my=managed&&managed.region,seasons={};
  for(const [id,s] of Object.entries(w.seasons||{})){
    if(!s.done){seasons[id]=s;continue}
    const lite=!!(my&&s.region&&s.region!==my&&!db.competitions?.[s.comp]?.international);
    const days=(s.days||[]).map(d=>({...d,matches:(d.matches||[]).map(m=>m.res?{...m,res:seriesResultForSave(m.res,lite)}:m)}));
    seasons[id]={...s,days};if(lite)seasons[id].compact=true;
  }
  return {...w,seasons};
}
function packDB(db){
  const world=worldForSave(db);
  const players={};
  for(const [id,p] of Object.entries(db.players)){
    const q={...p};
    if(p.attrs)q.attrs=ALL_ATTRS.map(a=>p.attrs[a]);
    if(p.tend)q.tend=TENDENCIES.map(t=>p.tend[t]);
    if(p.pool)q.pool=Object.fromEntries(Object.entries(p.pool).map(([c,v])=>[c,[v.mastery,v.experience,v.matchup_knowledge,v.confidence,v.scrimExperience||0,v.trainingExperience||0,v.scrimSeason||0,v.trainingSeason||0]]));
    players[id]=q;
  }
  const scout=Object.fromEntries(Object.entries(db.scout||{}).filter(([id,r])=>db.players[id]&&!db.players[id].retired&&(typeof r==='number'||(r.knowledge||0)>baseScoutKnowledge(db,db.players[id])||(r.observations||0)>0)));
  const teams=Object.fromEntries(Object.entries(db.teams).map(([id,t])=>{const q={...t};delete q._pre;delete q.coach;delete q.staff;if(q.facilities)delete q.facility;return [id,q]}));
  const patches={...(db.patches||{})};delete patches.base;delete patches.initialBase;const metaHistory=packMetaHistory(db.metaHistory||[]);
  return JSON.stringify({...db,world,teams,players,scout,patches,metaHistory,metaHistoryPacked:1,packed:1});
}
function unpackDB(str){
  const db=JSON.parse(str);
  if(!db.packed)return typeof migrateLegacyStaffState==='function'?migrateLegacyStaffState(db):db;
  if(db.metaHistoryPacked){db.metaHistory=unpackMetaHistory(db.metaHistory||[]);delete db.metaHistoryPacked}
  for(const t of Object.values(db.teams||{}))ensureFacilities(t);
  for(const p of Object.values(db.players)){
    if(Array.isArray(p.attrs))p.attrs=Object.fromEntries(ALL_ATTRS.map((a,i)=>[a,p.attrs[i]]));
    if(Array.isArray(p.tend))p.tend=Object.fromEntries(TENDENCIES.map((t,i)=>[t,p.tend[i]]));
    if(p.pool)for(const c in p.pool){const v=p.pool[c];if(Array.isArray(v))p.pool[c]={mastery:v[0],experience:v[1],matchup_knowledge:v[2],confidence:v[3],scrimExperience:v[4]||0,trainingExperience:v[5]||0,scrimSeason:v[6]||0,trainingSeason:v[7]||0}}
  }
  delete db.packed;
  return typeof migrateLegacyStaffState==='function'?migrateLegacyStaffState(db):db;
}

function stepOf(db,s){
  if(s.step!==undefined)return s.step;
  const w=db.world;
  return w.steps.findIndex(st=>st.kind==='league'?st.split===s.split:(st.ids||[st.id]).includes(s.comp));
}