// ===== LOL GM: broadcast-week and team booking calendar =====
// Official domestic rounds are broadcast across Tuesday–Sunday. The private
// scrim calendar reads the same actual fixture dates, even after a match ends.

function nextBroadcastTuesday(start){
  const day=new Date(start+'T00:00:00Z').getUTCDay();
  return addDays(start,(2-day+7)%7);
}
function broadcastSlotTime(slot,total){
  if(total===1)return '17:00';
  if(total===2)return ['17:00','20:00'][slot];
  if(total===3)return ['13:00','16:30','20:00'][slot];
  if(total===4)return ['11:00','14:00','17:00','20:00'][slot];
  // Additional concurrent broadcast feeds can be implemented separately;
  // these starts describe the main production window, not series end times.
  return String(9+Math.floor(slot*13/Math.max(1,total-1))).padStart(2,'0')+':00';
}
// A round-robin broadcast week contains two opponent rounds. Each side may
// play only once per round; a full rest day is guaranteed between series.
function allocateBroadcastWeek(first,second,week){
  const buckets=Array.from({length:6},()=>[]);
  const firstDate={},limit=Math.max(2,Math.ceil((first.length+second.length)/6));
  const rotate=(pairs,n)=>pairs.length?
    pairs.slice(n%pairs.length).concat(pairs.slice(0,n%pairs.length)):[];
  for(const pair of rotate(first,week)){
    let day=0;
    for(let i=1;i<3;i++)if(buckets[i].length<buckets[day].length)day=i;
    buckets[day].push({pair,round:0});
    firstDate[pair[0]]=firstDate[pair[1]]=day;
  }
  const matches=rotate(second,week);
  // Date-constrained matches go first so late first-round competitors are
  // never forced to play back-to-back days merely to fill a TV slot.
  matches.sort((a,b)=>
    Math.max(firstDate[b[0]]??-1,firstDate[b[1]]??-1)-
    Math.max(firstDate[a[0]]??-1,firstDate[a[1]]??-1));
  for(const pair of matches){
    const minDay=Math.max(3,(firstDate[pair[0]]??-2)+2,(firstDate[pair[1]]??-2)+2);
    let day=-1;
    for(let d=minDay;d<6;d++){
      if(day<0||(buckets[d].length<limit&&buckets[day].length>=limit)||
        ((buckets[d].length<limit)===(buckets[day].length<limit)&&buckets[d].length<buckets[day].length))
        day=d;
    }
    if(day<0)throw new Error('Cannot fit two domestic series with a full rest day');
    buckets[day].push({pair,round:1});
  }
  return buckets;
}
function officialBookedTeams(db,date=db.worldDate){
  const busy=new Set(),from=addDays(date,-1),to=addDays(date,1);
  for(const season of Object.values(db.world?.seasons||{})){
    const days=season.days;if(!days?.length)continue;
    let lo=0,hi=days.length;
    while(lo<hi){const mid=(lo+hi)>>1;if(days[mid].date<from)lo=mid+1;else hi=mid}
    for(let i=lo;i<days.length&&days[i].date<=to;i++){
      const day=days[i];
      for(const match of day.matches){
        // Legacy saves without real kickoff timestamps still use their old
        // world-day bookings. New saves block the true UTC game day and the
        // local match day for *both* teams, including midnight overrun.
        if(!match.startsAt){
          if(day.date===date){busy.add(match.a);busy.add(match.b)}
          continue;
        }
        const end=new Date(Date.parse(match.startsAt)+
          (match.bo>=5?8:6)*3600000).toISOString();
        for(const tid of [match.a,match.b]){
          const zone=teamTimeZone(db,tid);
          if(day.date===date||zonedClock(match.startsAt,zone).date===date||
            zonedClock(end,zone).date===date)busy.add(tid);
        }
      }
    }
  }
  return busy;
}
