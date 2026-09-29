// ===== LOL GM: Scrim domain =====
// Owns daily practice blocks, non-official practice results and accumulated intel.
// Background blocks are lightweight to keep long multi-region careers responsive;
// official fixtures continue to use the full match/series engine.

function scrimAnalysisBonus(t){
  const p=staffProfile(t);
  return clamp((p.analysis-50)/500+facilityAnalysisBonus(t),0,.14);
}
function scrimDailyCapacity(db,t){
  if(!t||t.active===false)return 0;
  const days=daysUntil(db,nextTeamMatch(db,t.id)?.date);
  if(days===0)return 0; // No practice blocks on an official fixture day.
  const roster=(t.roster||[]).map(id=>db.players[id]).filter(p=>p&&!p.retired);
  if(roster.length<5)return 0;
  const fatigue=avg(roster.map(p=>p.fatigue||0));
  const condition=avg(roster.map(p=>p.condition??96));
  if(fatigue>=60||condition<=67)return 0;
  // Weekly double-header: lighter taper the night before, two blocks otherwise.
  const scheduleCap=days===1?2:days===2?4:6;
  const fatigueCap=fatigue>=49?2:fatigue>=38?4:6;
  const conditionCap=condition<=77?2:condition<=85?4:6;
  return Math.min(scheduleCap,fatigueCap,conditionCap);
}
function scrimReadiness(db,t){
  if(!t)return {ok:false,reason:'팀 없음'};
  const roster=(t.roster||[]).map(id=>db.players[id]).filter(Boolean);
  const avgFatigue=avg(roster.map(p=>p.fatigue||0));
  const avgCondition=avg(roster.map(p=>p.condition??96));
  const capacity=scrimDailyCapacity(db,t),today=db.worldDate||'';
  const log=(t.scrimLog||[]).filter(x=>x.date===today);
  const games=log.reduce((a,x)=>a+(x.games||0),0);
  if(capacity===0)return {ok:false,reason:'공식 경기 또는 회복 우선',avgFatigue,avgCondition,games,capacity};
  if(games>=capacity)return {ok:false,reason:'오늘 스크림 연습량 완료',avgFatigue,avgCondition,games,capacity};
  return {ok:true,reason:'가능',avgFatigue,avgCondition,games,capacity,remaining:capacity-games};
}
function scrimValue(db,tid,oppId){
  const t=db.teams[tid],opp=db.teams[oppId];if(!t||!opp)return .5;
  const gap=teamStrength(db,oppId)-teamStrength(db,tid);
  const quality=clamp(1+gap/35,.65,1.3);
  const recent=(t.scrimLog||[]).filter(x=>x.opponent===oppId).slice(-3).length;
  const novelty=[1,.82,.68,.58][Math.min(3,recent)];
  return quality*novelty;
}
function backgroundScrimChampion(db,p,role,rng){
  const pool=Object.entries(p?.pool||{}).map(([id,profile])=>({
    c:db.patch.champions[id],profile
  })).filter(x=>x.c&&(x.c.roles||[]).includes(role))
    .sort((a,b)=>(b.profile.mastery||25)-(a.profile.mastery||25));
  const shortlist=pool.length?pool.slice(0,Math.min(4,pool.length)):
    Object.values(db.patch.champions).filter(c=>(c.roles||[]).includes(role))
      .slice(0,4).map(c=>({c,profile:{mastery:25}}));
  if(!shortlist.length)return null;
  const item=shortlist[Math.floor(rng.next()*Math.min(3,shortlist.length))];
  return {champ:item.c,mastery:item.profile.mastery||25};
}
// Automatic background practice uses the current player/role/patch/mastery
// inputs to resolve each private set. It does not forge official match rows,
// meta sample counts, or public statistics. Interactive scrims (D09) can still
// use simulateSeries to generate full draft/match replays.
function simulateBackgroundScrim(db,t,opp,games,rng){
  const participants=[t,opp],lines=[],results=[],wins={[t.id]:0,[opp.id]:0};
  for(let g=0;g<games;g++){
    const selections=participants.map(team=>ROLES.map(role=>{
      const player=starterFor(db,team,role);
      if(!player||player.retired)return null;
      const selected=backgroundScrimChampion(db,player,role,rng);
      return selected?{player,role,...selected}:null;
    }));
    if(selections.some(side=>side.some(entry=>!entry)))break;
    const values=selections.map((side,i)=>{
      const club=participants[i];
      const effective=side.reduce((score,x)=>
        score+playerRoleRating(x.player,x.role)*.82+
        x.mastery*.095+champStrength(x.champ,db.patch)*4.1-
        (x.player.fatigue||0)*.13+
        (x.player.condition??96)*.035,0)/5;
      return effective+teamSynergy(club)*.035+scrimAnalysisBonus(club)*14;
    });
    const winner=(values[0]-values[1]+rng.normal(0,8.5))>=0?t.id:opp.id;
    wins[winner]++;
    const picks={};
    for(let i=0;i<2;i++){
      picks[participants[i].id]=selections[i].map(x=>x.champ.id);
      for(const x of selections[i])lines.push({
        tid:participants[i].id,pid:x.player.id,role:x.role,
        champ:x.champ.id,win:participants[i].id===winner
      });
    }
    results.push({n:g+1,winner,picks});
  }
  if(!results.length)return null;
  const rec={a:t.id,b:opp.id,games:results,wins,practice:true,patch:db.patch.id,date:db.worldDate};
  recordScrimPractice(db,rec,lines);
  return rec;
}
function aiRunScrims(db,rng){
  // A manager's club also receives routine practice. Choosing a specific
  // opponent or requesting an interactive full scrim belongs to D09.
  const eligible=activeTeams(db,null,1).filter(t=>trainingRecommendation(db,t).scrim&&
    scrimReadiness(db,t).ok);
  let blocks=0,sets=0;
  // Two scheduled daily blocks, with 2-3 sets each; matches and recovery
  // automatically narrow the daily allowance to 0-2 or 0-4 sets.
  for(let round=0;round<2;round++){
    const busy=new Set();
    const order=eligible.slice().sort((a,b)=>String(a.id).localeCompare(String(b.id)));
    for(const t of order){
      if(busy.has(t.id)||!scrimReadiness(db,t).ok||!rng.chance(.84))continue;
      const candidates=order.filter(o=>o.id!==t.id&&!busy.has(o.id)&&
        o.region===t.region&&scrimReadiness(db,o).ok);
      if(!candidates.length)continue;
      const ranked=candidates.map(o=>({team:o,weight:Math.max(.1,scrimValue(db,t.id,o.id))}));
      const total=ranked.reduce((sum,row)=>sum+row.weight,0);
      let roll=rng.next()*total,opponent=ranked[0].team;
      for(const row of ranked){roll-=row.weight;if(roll<=0){opponent=row.team;break}}
      const games=Math.min(round===0?3:3,scrimReadiness(db,t).remaining,
        scrimReadiness(db,opponent).remaining);
      if(games<1)continue;
      const rec=simulateBackgroundScrim(db,t,opponent,games,rng);
      if(!rec)continue;
      busy.add(t.id);busy.add(opponent.id);
      blocks++;sets+=rec.games.length;
    }
  }
  return {blocks,sets};
}
function recordScrimPractice(db,rec,lines){
  if(!rec||!lines)return {players:0,games:0};
  const teams=new Set([rec.a,rec.b]),seen=new Set(),games=(rec.games||[]).length;
  for(const l of lines){
    const p=db.players[l.pid];if(!p||!teams.has(l.tid))continue;
    const opp=l.tid===rec.a?rec.b:rec.a,value=scrimValue(db,l.tid,opp);
    practiceChampion(db,p,l.champ,'scrim',value);
    pState(p);p.fatigue=clamp(p.fatigue+1.2,0,100);
    p.condition=clamp(p.condition-.45,45,100);seen.add(p.id);
  }
  for(const tid of teams){
    const team=db.teams[tid];if(!team)continue;
    const opp=tid===rec.a?rec.b:rec.a,value=scrimValue(db,tid,opp);
    team.scrimIntel=clamp((team.scrimIntel||0)+(.8+scrimAnalysisBonus(team)*12)*value,0,12);
    team.scrimLog=(team.scrimLog||[]).slice(-39);
    team.scrimLog.push({date:db.worldDate,games,opponent:opp,
      wins:rec.wins?.[tid]??null,losses:rec.wins?games-(rec.wins[tid]||0):null,
      patch:rec.patch||db.patch.id});
  }
  recordRoleConversionUsage(db,lines,'scrim');
  return {players:seen.size,games};
}
