// ===== LOL GM: deterministic venue clocks =====
// Store every scheduled kickoff as an absolute UTC instant. World ticks use
// UTC dates; televised date/time and training hours use IANA venue clocks.
const REGION_ZONE_NAMES={
  KR:'Asia/Seoul',CN:'Asia/Shanghai',EU:'Europe/Berlin',
  NA:'America/Los_Angeles',AP:'Asia/Singapore',BR:'America/Sao_Paulo',
  VN:'Asia/Ho_Chi_Minh',JP:'Asia/Tokyo',TW:'Asia/Taipei',
  OC:'Australia/Sydney',SEA:'Asia/Singapore',TR:'Europe/Istanbul',
  ME:'Asia/Dubai',CIS:'Europe/Moscow',LA:'America/Mexico_City'
};
const zoneClockFormatters=new Map();
function regionTimeZone(db,region){
  return db.regions?.[region]?.timeZone||REGION_ZONE_NAMES[region]||'UTC';
}
function teamTimeZone(db,tid){
  const t=db.teams?.[tid];
  return t?.timeZone||regionTimeZone(db,t?.region);
}
function zonedClock(iso,zone){
  if(!zoneClockFormatters.has(zone)){
    zoneClockFormatters.set(zone,new Intl.DateTimeFormat('en-GB',{
      timeZone:zone,hourCycle:'h23',year:'numeric',month:'2-digit',
      day:'2-digit',hour:'2-digit',minute:'2-digit'
    }));
  }
  const parts=Object.fromEntries(zoneClockFormatters.get(zone)
    .formatToParts(new Date(iso)).filter(x=>x.type!=='literal')
    .map(x=>[x.type,x.value]));
  const date=[parts.year,parts.month,parts.day].join('-'),
    time=parts.hour+':'+parts.minute;
  return {date,time,hour:+parts.hour,minute:+parts.minute,zone};
}
function zonedKickoffUTC(localDate,localTime,zone){
  const target=Date.parse(localDate+'T'+localTime+':00Z');
  if(!Number.isFinite(target))throw new Error('Invalid event clock');
  let instant=target;
  // A daylight-saving zone is not a fixed UTC offset. Iterate the offset
  // at the *event's own date*, not at the current user's machine date.
  for(let i=0;i<4;i++){
    const p=zonedClock(new Date(instant).toISOString(),zone),
      shown=Date.parse(p.date+'T'+p.time+':00Z'),
      delta=target-shown;
    if(delta===0)return new Date(instant).toISOString();
    instant+=delta;
  }
  const check=zonedClock(new Date(instant).toISOString(),zone);
  if(check.date!==localDate||check.time!==localTime)
    throw new Error('Nonexistent local wall time: '+localDate+' '+localTime+' '+zone);
  return new Date(instant).toISOString();
}
function eventZone(db,comp){
  return comp.timeZone||regionTimeZone(db,comp.region);
}
function venueTimeLabel(m){
  if(!m.startsAt)return m.time||'';
  return (m.localDate||m.startsAt.slice(0,10))+' '+m.time+
    ' ('+(m.timeZone||'UTC')+')';
}
function viewerTimeLabel(m,zone='Asia/Seoul'){
  if(!m.startsAt)return '';
  const clock=zonedClock(m.startsAt,zone);
  return clock.date+' '+clock.time+' ('+zone+')';
}

// Build the fixture matrix by the actual UTC date on which each game begins.
// One local broadcast day can cross UTC midnight, and adjacent local days can
// share a UTC date; the world should tick that date exactly once.
function pushTimedEventDay(s,localDate,stage,label,pairs,bo){
  let n=s.days.reduce((a,d)=>a+d.matches.length,0),changed=new Set();
  const total=pairs.length;
  for(let index=0;index<total;index++){
    const [a,b]=pairs[index],time=broadcastSlotTime(index,total),
      startsAt=zonedKickoffUTC(localDate,time,s.timeZone),
      utcDate=startsAt.slice(0,10);
    let day=s.days.find(d=>d.date===utcDate&&d.stage===stage);
    if(!day){
      day={date:utcDate,localDate,stage,label,matches:[]};
      s.days.push(day);
    }
    day.matches.push({id:`${s.id}_match_${n++}`,a,b,bo,res:null,
      time,broadcastSlot:index+1,localDate,timeZone:s.timeZone,
      startsAt,roundLabel:label});
    changed.add(day);
  }
  for(const day of changed){
    day.matches.sort((a,b)=>(a.startsAt||'').localeCompare(b.startsAt||''));
    day.label=[...new Set(day.matches.map(m=>m.roundLabel))].join(' · ');
    day.localDate=day.matches[day.matches.length-1].localDate;
  }
  s.days.sort((a,b)=>a.date.localeCompare(b.date));
}
