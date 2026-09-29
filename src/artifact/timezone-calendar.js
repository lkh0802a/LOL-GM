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

// Group by *actual* UTC date, not the venue calendar day. A multi-series
// broadcast can cross midnight UTC; two consecutive local days can even
// share one UTC date. Preserve a single world-day tick and unique match IDs.
function appendUtcFixtureDay(s,localDate,stage,label,pairs,bo,timeSlots){
  let nextId=s.days.reduce((n,d)=>n+d.matches.length,0);
  const touched=new Set(),zone=s.venueTimeZone||'UTC';
  for(let i=0;i<pairs.length;i++){
    const [a,b]=pairs[i],time=timeSlots?.[i]||'17:00',
      utcAt=venueToUtc(localDate,time,zone),utcDay=utcAt.slice(0,10);
    let day=s.days.find(d=>d.date===utcDay&&d.stage===stage);
    if(!day){
      day={date:utcDay,stage,label,localDate,matches:[]};
      s.days.push(day);
    }
    day.matches.push({id:`${s.id}_match_${nextId++}`,a,b,bo,res:null,
      time,localDate,timeZone:zone,utcAt,roundLabel:label,
      broadcastSlot:timeSlots?i+1:null});
    touched.add(day);
  }
  for(const day of touched){
    day.matches.sort((a,b)=>a.utcAt.localeCompare(b.utcAt));
    day.label=[...new Set(day.matches.map(m=>m.roundLabel))].join(' · ');
    day.localDate=day.matches.at(-1).localDate;
  }
  s.days.sort((a,b)=>a.date.localeCompare(b.date));
}
function pushVenueRound(s,localDate,stage,label,pairs,bo){
  const perDay=s.venueTimeZone?3:Math.max(1,pairs.length);
  for(let i=0;i<pairs.length;i+=perDay)
    pushDay(s,addDays(localDate,Math.floor(i/perDay)),stage,label,
      pairs.slice(i,i+perDay),bo);
}
function venueRoundGap(s,games,normalGap){
  return s.venueTimeZone?
    Math.max(normalGap,Math.ceil(games/3)+1):normalGap;
}

// A three-game block needs roughly three hours. A two-hour overlap cannot
// legitimately host all three games merely because 90 minutes intersect.
function scrimOverlapGames(overlap){
  return overlap?Math.floor((Date.parse(overlap.endsAt)-
    Date.parse(overlap.startsAt))/3600000):0;
}
