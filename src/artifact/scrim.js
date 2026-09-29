// ===== LOL GM: Scrim domain =====
// Owns scrim readiness, AI scrim scheduling/value and scrim practice effects.

function scrimAnalysisBonus(t){const p=staffProfile(t);return clamp((p.analysis-50)/500+facilityAnalysisBonus(t),0,.14)}
function scrimReadiness(db,t){
  if(!t)return {ok:false,reason:'팀 없음'};
  const roster=t.roster.map(id=>db.players[id]).filter(Boolean),avgFatigue=avg(roster.map(p=>p.fatigue||0)),avgCondition=avg(roster.map(p=>p.condition??96));
  const today=db.worldDate||'',log=(t.scrimLog||[]).filter(x=>x.date===today),games=log.reduce((a,x)=>a+(x.games||0),0);
  if(games>=5)return {ok:false,reason:'오늘 스크림 한도 도달',avgFatigue,avgCondition,games};
  if(avgFatigue>=58||avgCondition<=70)return {ok:false,reason:'선수단 회복 필요',avgFatigue,avgCondition,games};
  return {ok:true,reason:'가능',avgFatigue,avgCondition,games};
}
function aiScrimCooldownReady(db,t){
  const recent=(t.scrimLog||[]).filter(x=>x.date&&x.date<=db.worldDate)
    .sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
  return !recent||(new Date(db.worldDate+'T00:00:00Z')-new Date(recent.date+'T00:00:00Z'))/86400000>=6;
}
function aiRunScrims(db,rng){
  const teams=activeTeams(db,null,1).filter(t=>t.id!==managedTeamId(db)&&
    trainingRecommendation(db,t).scrim&&scrimReadiness(db,t).ok&&aiScrimCooldownReady(db,t));
  const used=new Set();for(const t of teams){if(used.has(t.id)||!rng.chance(.16))continue;const candidates=teams.filter(o=>o.id!==t.id&&!used.has(o.id)&&o.region===t.region&&scrimReadiness(db,o).ok);if(!candidates.length)continue;const weighted=candidates.map(o=>[o,Math.max(.1,scrimValue(db,t.id,o.id))]),sum=weighted.reduce((a,x)=>a+x[1],0);let roll=rng.next()*sum,opp=weighted[0][0];for(const [o,v] of weighted){roll-=v;if(roll<=0){opp=o;break}}const bo=rng.chance(.28)?3:1,s=simulateSeries(db,t.id,opp.id,bo,'ai-scrim/'+db.worldDate+'/'+t.id+'/'+opp.id,{fearless:true,firstChoice:'coin',replay:true,practice:true});recordScrimPractice(db,s.rec,s.lines);used.add(t.id);used.add(opp.id)}
}
function scrimValue(db,tid,oppId){
  const t=db.teams[tid],opp=db.teams[oppId];if(!t||!opp)return .5;const gap=teamStrength(db,oppId)-teamStrength(db,tid),quality=clamp(1+gap/35,.65,1.3),recent=(t.scrimLog||[]).filter(x=>x.opponent===oppId).slice(-3).length,novelty=[1,.82,.68,.58][Math.min(3,recent)];return quality*novelty;
}
function recordScrimPractice(db,rec,lines){
  if(!rec||!lines)return {players:0,games:0};const teams=new Set([rec.a,rec.b]),seen=new Set(),games=(rec.games||[]).length;
  for(const l of lines){const p=db.players[l.pid];if(!p||!teams.has(l.tid))continue;const opp=l.tid===rec.a?rec.b:rec.a,value=scrimValue(db,l.tid,opp);practiceChampion(db,p,l.champ,'scrim',value);pState(p);p.fatigue=clamp(p.fatigue+1.2,0,100);p.condition=clamp(p.condition-.45,45,100);seen.add(p.id)}
  for(const tid of teams){const t=db.teams[tid];if(!t)continue;const opp=tid===rec.a?rec.b:rec.a,value=scrimValue(db,tid,opp),bonus=scrimAnalysisBonus(t);t.scrimIntel=clamp((t.scrimIntel||0)+(.8+bonus*12)*value,0,12);// Preserve recent *multi-day* partner memory for cooldown and novelty.
    t.scrimLog=(t.scrimLog||[]).slice(-39);t.scrimLog.push({date:db.worldDate,games,opponent:tid===rec.a?rec.b:rec.a})}
  recordRoleConversionUsage(db,lines,'scrim');
  return {players:seen.size,games};
}
