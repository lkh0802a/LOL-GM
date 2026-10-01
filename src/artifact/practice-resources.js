// Daily time is shared by scrims and drills. Attribute allocations subdivide
// individual drills, rather than providing another independent time budget.
const PRACTICE_POINTS=100,SCRIM_PRACTICE_COST=10;
const PRACTICE_FOCUS={
  balanced:{individual:.5,champions:.2,tactics:.15,teamwork:.15},
  individual:{individual:.8,champions:.1,tactics:.05,teamwork:.05},
  champions:{individual:.3,champions:.5,tactics:.1,teamwork:.1},
  tactics:{individual:.3,champions:.15,tactics:.45,teamwork:.1},
  teamwork:{individual:.3,champions:.1,tactics:.15,teamwork:.45}
};
const PRACTICE_FOCUS_KO={balanced:'균형',individual:'개인 기량',champions:'챔피언 폭',tactics:'전술 숙련',teamwork:'팀 호흡'};
function practiceDay(db,t){
  if(t.practiceDay?.date===db.worldDate)return t.practiceDay;
  // Old saves already consumed their recorded scrims on the current date.
  const scrim=Math.min(PRACTICE_POINTS,(t.scrimLog||[])
    .filter(x=>x.date===db.worldDate).reduce((n,x)=>n+(x.games||0)*SCRIM_PRACTICE_COST,0));
  return {date:db.worldDate,scrim,drills:0,remaining:PRACTICE_POINTS-scrim};
}
function consumeScrimPractice(db,t,games){
  const day=practiceDay(db,t),cost=games*SCRIM_PRACTICE_COST;
  if(!Number.isInteger(games)||games<1||cost>day.remaining)throw Error('오늘 남은 연습 시간이 부족합니다');
  t.practiceDay={...day,scrim:day.scrim+cost,remaining:day.remaining-cost};
}
function trainingTimeMultiplier(t,year,p=null){
  const usage=p?.practiceUsage?.year===year?p.practiceUsage:t?.practiceUsage;
  if(!usage||usage.year!==year||!usage.days)return 1; // legacy seasonal saves
  return clamp(.8+usage.individual/(usage.days*PRACTICE_POINTS)*.4,.8,1.12);
}
function runDailyPractice(db){
  const booked=officialBookedTeams(db);
  for(const t of activeTeams(db)){
    const day=practiceDay(db,t);
    if(day.completed)continue;
    const focus=Object.hasOwn(PRACTICE_FOCUS,t.training?.focus)?t.training.focus:'balanced',
      shares=PRACTICE_FOCUS[focus],points=booked.has(t.id)?0:day.remaining;
    t.practiceDay={...day,drills:points,remaining:0,completed:true,focus};
    let u=t.practiceUsage;
    if(!u||u.year!==db.year)u=t.practiceUsage={year:db.year,days:0,individual:0,champions:0,tactics:0,teamwork:0,scrim:0};
    if(!booked.has(t.id)){u.days++;for(const key of Object.keys(shares))u[key]+=points*shares[key];u.scrim+=day.scrim}
    const players=t.roster.map(id=>db.players[id]).filter(p=>p&&!p.retired&&!medicalOut(p)&&
      !['rest','rehab'].includes(medicalPlanFor(db,p)));
    for(const p of players){
      pState(p);
      const light=medicalPlanFor(db,p)==='light'?.4:1;
      const individual=points*shares.individual*light,
        conversion=p.roleConversion?individual*.25:0;
      p.practiceDay={date:db.worldDate,individual:individual-conversion,conversion,
        champions:points*shares.champions*light,tactics:points*shares.tactics*light,
        teamwork:points*shares.teamwork*light};
      if(!p.practiceUsage||p.practiceUsage.year!==db.year)p.practiceUsage={year:db.year,days:0,individual:0,conversion:0};
      if(points){p.practiceUsage.days++;p.practiceUsage.individual+=individual-conversion;p.practiceUsage.conversion+=conversion}
      if(conversion){p.roleConversionCostYear=db.year;advanceRoleConversionPlayer(db,p,conversion/12.5)}
      p.teamAdaptation=clamp(p.teamAdaptation+points*shares.teamwork*.008*light,0,100);
      p.tacticalAdaptation=clamp(p.tacticalAdaptation+points*shares.tactics*.01*light,0,100);
      if(points){
        const pool=Object.entries(p.pool||{}).sort((a,b)=>b[1].mastery-a[1].mastery).slice(0,3);
        for(const [champ] of pool)practiceChampion(db,p,champ,'training',points*shares.champions/300*light);
      }
    }
    const ids=ROLES.map(r=>starterFor(db,t,r)?.id).filter(id=>players.some(p=>p.id===id));
    for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
      const a=db.players[ids[i]],b=db.players[ids[j]],bond=playerRelationship(db,a,b),
        target=clamp(50+((a.managerTrust??60)+(b.managerTrust??60)-120)*.15,35,65),
        next=bond+(target-bond)*points*shares.teamwork/15000;
      if(points&&Math.abs(target-bond)>=.1)adjustPlayerRelationship(db,a,b,
        Math.sign(next-bond)*Math.max(.1,Math.abs(next-bond)));
    }
    recoverTeamCohesion(db,t,null,.008+points*shares.teamwork/10000);
  }
}

function scrimDailyCapacity(db,t,booked=null){
  if(!t||t.active===false)return 0;
  // Check the complete official calendar, not merely the next *unplayed*
  // match: an already completed televised series still books the full day.
  if((booked||officialBookedTeams(db)).has(t.id))return 0;
  const days=daysUntil(db,nextTeamMatch(db,t.id)?.date);
  if(days===0)return 0; // No practice blocks on an official fixture day.
  const roster=(t.roster||[]).map(id=>db.players[id]).filter(p=>p&&!p.retired&&!medicalOut(p)&&!medicalScrimRest(db,p));
  if(roster.length<5)return 0;
  const fatigue=avg(roster.map(p=>p.fatigue||0));
  const condition=avg(roster.map(p=>p.condition??96));
  if(fatigue>=60||condition<=67)return 0;
  // Weekly double-header: lighter taper the night before, two blocks otherwise.
  const scheduleCap=days===1?2:days===2?4:6;
  const fatigueCap=fatigue>=49?2:fatigue>=38?4:6;
  const conditionCap=condition<=77?2:condition<=85?4:6;
  const day=practiceDay(db,t),spent=(t.scrimLog||[]).filter(x=>x.date===db.worldDate).reduce((n,x)=>n+(x.games||0),0);
  return Math.min(scheduleCap,fatigueCap,conditionCap,spent+Math.floor(day.remaining/SCRIM_PRACTICE_COST));
}
function scrimReadiness(db,t,booked=null){
  if(!t)return {ok:false,reason:'팀 없음'};
  const roster=(t.roster||[]).map(id=>db.players[id]).filter(p=>p&&!p.retired&&!medicalOut(p)&&!medicalScrimRest(db,p));
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
