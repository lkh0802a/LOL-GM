// Daily time is shared by scrims and drills. Attribute allocations subdivide
// individual drills, rather than providing another independent time budget.
const PRACTICE_POINTS=100,SCRIM_PRACTICE_COST=10;
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
// Close the unused daily scrim-time window; do not allocate leftover time to
// fabricated drills or permanent player growth. Actual games own experience.
function runDailyPractice(db){
  for(const t of activeTeams(db)){
    const day=practiceDay(db,t);
    if(!day.completed)t.practiceDay={...day,drills:0,remaining:0,completed:true};
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
