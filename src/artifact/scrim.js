// ===== LOL GM: Scrim domain =====
// Owns daily practice blocks, non-official practice results and accumulated intel.
// Background blocks are lightweight to keep long multi-region careers responsive;
// official fixtures continue to use the full match/series engine.

function scrimAnalysisBonus(t){
  const p=staffProfile(t);
  return clamp((p.analysis-50)/500+facilityAnalysisBonus(t),0,.14);
}
function scrimDailyCapacity(db,t,booked=null){
  if(!t||t.active===false)return 0;
  // Check the complete official calendar, not merely the next *unplayed*
  // match: an already completed televised series still books the full day.
  if((booked||officialBookedTeams(db)).has(t.id))return 0;
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
function scrimReadiness(db,t,booked=null){
  if(!t)return {ok:false,reason:'팀 없음'};
  const roster=(t.roster||[]).map(id=>db.players[id]).filter(Boolean);
  const avgFatigue=avg(roster.map(p=>p.fatigue||0));
  const avgCondition=avg(roster.map(p=>p.condition??96));
  const capacity=scrimDailyCapacity(db,t,booked),today=db.worldDate||'';
  const log=(t.scrimLog||[]).filter(x=>x.date===today);
  const games=log.reduce((a,x)=>a+(x.games||0),0);
  // Two distinct booking blocks. Old saved scrims did not have a block field;
  // retain their occupied sessions in recorded order.
  const occupied=new Set(log.map((x,i)=>x.slot||(['afternoon','evening'][Math.min(1,i)])));
  const availableSlots=['afternoon','evening'].filter(slot=>!occupied.has(slot));
  if(capacity===0)return {ok:false,reason:'공식 경기 또는 회복 우선',avgFatigue,avgCondition,games,capacity,availableSlots:[]};
  if(games>=capacity||!availableSlots.length)
    return {ok:false,reason:'오늘 스크림 연습량 완료',avgFatigue,avgCondition,games,capacity,availableSlots:[]};
  return {ok:true,reason:'가능',avgFatigue,avgCondition,games,capacity,remaining:capacity-games,availableSlots};
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
function simulateBackgroundScrim(db,t,opp,games,rng,slot,booked=null,proposal=null,bookings=null){
  const assessment=scrimPartnerAssessment(db,t,opp);
  if(!assessment.allowed)return null;
  const shared=scrimSharedWorkHours(db,t,opp,slot,db.worldDate,bookings);
  if(!shared)return null;
  const first=scrimReadiness(db,t,booked),second=scrimReadiness(db,opp,booked);
  if(!first.ok||!second.ok||!first.availableSlots.includes(slot)||
    !second.availableSlots.includes(shared.slots[opp.id])||
    games>first.remaining||games>second.remaining)return null;
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
  const plan=proposal?.allowed?proposal:assessment;
  const rec={a:t.id,b:opp.id,games:results,wins,practice:true,patch:db.patch.id,
    date:db.worldDate,slot,startsAt:shared.startsAt,
    localDates:shared.localDates,slots:shared.slots,timeZones:shared.timeZones,
    goals:{[t.id]:plan.left.reason,[opp.id]:plan.right.reason}};
  recordScrimPractice(db,rec,lines);
  return rec;
}
function aiRunScrims(db,rng){
  const booked=officialBookedTeams(db),rivals=scrimRivalCalendar(db),
    bookings={[db.worldDate]:booked,
      [addDays(db.worldDate,-1)]:officialBookedTeams(db,addDays(db.worldDate,-1)),
      [addDays(db.worldDate,1)]:officialBookedTeams(db,addDays(db.worldDate,1))};
  const eligible=activeTeams(db,null,1).filter(t=>trainingRecommendation(db,t).scrim&&
    scrimReadiness(db,t,booked).ok);
  const intents=Object.fromEntries(eligible.map(t=>[t.id,scrimClubIntent(db,t)])),
    strengths=Object.fromEntries(eligible.map(t=>[t.id,teamStrength(db,t.id)]));
  let blocks=0,sets=0;
  for(const slot of ['afternoon','evening']){
    const busy=new Set();
    const order=eligible.slice().sort((a,b)=>String(a.id).localeCompare(String(b.id)));
    for(const t of order){
      const first=scrimReadiness(db,t,booked);
      if(busy.has(t.id)||!first.ok||!first.availableSlots.includes(slot)||!rng.chance(.84))continue;
      const candidates=order.filter(o=>o.id!==t.id&&!busy.has(o.id)&&
        o.region===t.region&&
        scrimReadiness(db,o,booked).ok&&
        scrimSharedWorkHours(db,t,o,slot,db.worldDate,bookings)&&
        scrimReadiness(db,o,booked).availableSlots.includes(
          scrimSharedWorkHours(db,t,o,slot,db.worldDate,bookings).slots[o.id]));
      if(!candidates.length)continue;
      const ranked=candidates.map(o=>({team:o,
        offer:scrimPartnerAssessment(db,t,o,intents,strengths,rivals)}))
        .filter(x=>x.offer.allowed).map(x=>({...x,
          weight:x.offer.weight*Math.max(.2,scrimValue(db,t.id,x.team.id))}));
      let attempts=0;
      while(ranked.length&&attempts++<4){
        const total=ranked.reduce((sum,row)=>sum+row.weight,0);
        let roll=rng.next()*total,chosen=ranked[ranked.length-1],at=ranked.length-1;
        for(let i=0;i<ranked.length;i++){
          roll-=ranked[i].weight;
          if(roll<=0){chosen=ranked[i];at=i;break}
        }
        ranked.splice(at,1);
        const opponent=chosen.team;
        const second=scrimReadiness(db,opponent,booked),
          games=Math.min(3,first.remaining,second.remaining);
        if(games<1||!rng.chance(chosen.offer.acceptance))continue;
        const rec=simulateBackgroundScrim(db,t,opponent,games,rng,
          slot,booked,chosen.offer,bookings);
        if(!rec)continue;
        busy.add(t.id);busy.add(opponent.id);
        blocks++;sets+=rec.games.length;
        break;
      }
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
      patch:rec.patch||db.patch.id,slot:rec.slots?.[tid]||rec.slot||null,
      localDate:rec.localDates?.[tid]||db.worldDate,
      startsAt:rec.startsAt||null,timeZone:rec.timeZones?.[tid]||null,
      purpose:rec.goals?.[tid]||'팀 연습'});
  }
  recordRoleConversionUsage(db,lines,'scrim');
  return {players:seen.size,games};
}
