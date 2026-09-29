// ===== LOL GM: absolute UTC event clock and actual venue time zones =====
// Competition date grouping stays one simulated UTC day. Published TV hours
// belong to the hosting region, including its daylight-saving transitions.
const REGION_VENUE_ZONES={
  KR:'Asia/Seoul',CN:'Asia/Shanghai',EU:'Europe/Berlin',
  NA:'America/Los_Angeles',AP:'Asia/Taipei',BR:'America/Sao_Paulo',
  VN:'Asia/Ho_Chi_Minh',JP:'Asia/Tokyo',TW:'Asia/Taipei',
  OC:'Australia/Sydney',SEA:'Asia/Singapore',
  TR:'Europe/Istanbul',ME:'Asia/Riyadh',CIS:'Europe/Moscow',
  LA:'America/Mexico_City'
};
const VENUE_FORMATTERS=new Map();
function venueZone(db,regionId){
  const R=db.regions?.[regionId],configured=R?.timeZone,
    inherited=R?.parent&&REGION_VENUE_ZONES[R.parent];
  const zone=configured||REGION_VENUE_ZONES[regionId]||inherited||'UTC';
  try{new Intl.DateTimeFormat('en-GB',{timeZone:zone}).format(new Date(0))}
  catch{throw new Error('Invalid venue IANA time zone: '+zone)}
  return zone;
}
function competitionVenue(db,comp){
  if(comp.timeZone)return {region:comp.venueRegion||comp.region||null,
    timeZone:comp.timeZone};
  if(!comp.international)return {region:comp.region||null,
    timeZone:venueZone(db,comp.region)};
  // Neutral international competitions use a rotating participant region
  // host for the entire tournament (not each visitor's home time).
  const hosts=[...new Set((comp.teams||[])
    .map(id=>db.teams[id]?.region).filter(id=>db.regions[id]))].sort();
  const index=hosts.length?hashStr(String(db.year)+':'+comp.id)%hosts.length:0,
    region=hosts[index]||Object.keys(db.regions||{})[0]||null;
  return {region,timeZone:venueZone(db,region)};
}
function venueClockParts(at,timeZone){
  let fmt=VENUE_FORMATTERS.get(timeZone);
  if(!fmt){
    fmt=new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',
      month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',
      hourCycle:'h23'});
    VENUE_FORMATTERS.set(timeZone,fmt);
  }
  const obj=Object.fromEntries(fmt.formatToParts(new Date(at))
    .filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return {date:obj.year+'-'+obj.month+'-'+obj.day,
    time:obj.hour+':'+obj.minute};
}
function venueToUtc(localDate,localTime,timeZone){
  const wanted=Date.parse(localDate+'T'+localTime+':00Z');
  if(!Number.isFinite(wanted))throw new Error('Invalid match local date/time');
  let instant=wanted;
  for(let tries=0;tries<4;tries++){
    const shown=venueClockParts(instant,timeZone),
      asUtc=Date.parse(shown.date+'T'+shown.time+':00Z');
    if(asUtc===wanted)return new Date(instant).toISOString();
    instant+=wanted-asUtc;
  }
  // Avoid silently assigning a nonexistent clock hour during a DST jump.
  throw new Error('Unresolvable venue-local time '+localDate+' '+localTime+' '+timeZone);
}
function fixtureTimeInfo(match){
  if(!match?.utcAt)return match?.time||'';
  const kst=venueClockParts(match.utcAt,'Asia/Seoul'),
    local=match.localDate||venueClockParts(match.utcAt,match.timeZone).date;
  return local+' '+(match.time||venueClockParts(match.utcAt,match.timeZone).time)+
    ' '+match.timeZone+' · 한국 '+kst.date+' '+kst.time+' KST';
}
function scrimUtcRange(db,team,date,slot){
  const zone=team.practiceTimeZone||venueZone(db,team.region),
    localTime=slot==='afternoon'?'14:00':slot==='evening'?'19:00':null;
  if(!localTime)return null;
  const startsAt=venueToUtc(date,localTime,zone),
    endsAt=new Date(Date.parse(startsAt)+3*3600000).toISOString();
  return {startsAt,endsAt,timeZone:zone};
}
function scrimTimeOverlap(db,first,second,date,slot){
  const a=scrimUtcRange(db,first,date,slot),
    b=scrimUtcRange(db,second,date,slot);
  if(!a||!b)return null;
  const start=Math.max(Date.parse(a.startsAt),Date.parse(b.startsAt)),
    end=Math.min(Date.parse(a.endsAt),Date.parse(b.endsAt));
  if(end-start<90*60000)return null;
  return {startsAt:new Date(start).toISOString(),
    endsAt:new Date(end).toISOString(),
    firstTimeZone:a.timeZone,secondTimeZone:b.timeZone};
}
