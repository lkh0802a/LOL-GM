// ===== LOL GM: Player lifecycle domain =====
// Owns player evaluation/identity, squad-role promises, champion-profile learning,
// generated players, rookie cohort supply and player-career event history.
// Match-slot legality is not owned here.

const NICK_A=['Ka','Zer','Lu','Vex','Mor','Ny','Ti','Rho','Sa','Quin','El','Dra','Fen','Jo','Kai','Mir','Oz','Pyr','Ren','Syl','Ul','Wyn','Xan','Yor','Bru','Cae','Del','Gor','Hex','Ish','Lor','Nim','Pax','Riv','Tor','Val','Zu','Aki','Bly','Cro'];
const NICK_B=['n','ra','x','lo','th','ne','ko','vy','dan','rin','zo','sk','mi','ro','ve','ly','ce','ta','ix','or','us','en','al','yx','e','o','ash','ek','im','ul'];
const STYLES=Object.keys(STYLE_BIAS);
// p.role is the player's current primary identity, not a match-eligibility gate.
// Any registered player may be assigned to any game role; suitability is derived from attributes and champion pool.

function playerGroupScore(p,g,role=p.role){const keys=ATTR_GROUPS[g].filter(a=>!(a==='smite_execution'&&role!=='JGL')&&!(a==='csing'&&role==='SUP'));return keys.length?avg(keys.map(a=>p.attrs[a])):50}
function playerRoleRating(p,role=p.role){
  if(!p||!p.attrs)return 0;const gw=ROLE_GROUP_WEIGHTS[role]||ROLE_GROUP_WEIGHTS[p.role]||ROLE_GROUP_WEIGHTS.MID;
  let base=0,w=0;for(const [g,x] of Object.entries(gw)){base+=playerGroupScore(p,g,role)*x;w+=x}base=w?base/w:50;
  const keys=ROLE_KEY_ATTRS[role]||[],key=keys.length?avg(keys.map(a=>p.attrs[a]??50)):base,raw=base*.82+key*.18;
  return Math.round(clamp(raw,20,99));
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
function recommendedRosterRole(db,p,t){
  const team=teamRef(db,t);if(!team)return p.age<=20?'prospect':'backup';
  const o=playerOvr(p),isStarter=Object.values(team.depthChart||{}).includes(p.id);
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
    ensureSatisfaction(player);player.satisfaction=clamp(player.satisfaction+(newRank>oldRank?1:-Math.min(5,(oldRank-newRank)*2)),0,100)
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
  const peakBase={TOP:24.5,JGL:24,MID:25,ADC:25,SUP:26}[role]||25;
  const originRegion=o.region,originLocalRegion=o.originLocalRegion||originRegion;
  const p={id:o.id||uniqId(db,(o.region||'X')+'_'),name:o.name||uniqNick(db,rng),role,age,team:null,region:originRegion,originRegion,nationality:o.nationality||originRegion,originLocalRegion,activeLocalRegion:o.activeLocalRegion||originLocalRegion,localEligibility:{origin:originLocalRegion,active:o.activeLocalRegion||originLocalRegion,qualifications:{}},contractedMoves:[],attrs,tend,pool,
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
  const facilities=teams.map(t=>ensureFacilities(t).youth),dev=teams.map(t=>staffProfile(t).development);
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
