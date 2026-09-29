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
