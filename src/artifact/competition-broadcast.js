// Dedicated television fixture scheduler; domain rules live in competition.js.
function broadcastKickoffs(n){
  if(n===1)return ['17:00'];if(n===2)return ['17:00','19:30'];
  if(n===3)return ['14:00','17:00','20:00'];
  return ['11:00','14:00','17:00','20:00','22:30','23:30'].slice(0,n);
}
function pushDay(s,date,stage,label,pairs,bo,broadcast=false){
  let n=s.days.reduce((a,d)=>a+d.matches.length,0),times=broadcast?broadcastKickoffs(pairs.length):[];
  s.days.push({date,stage,label,matches:pairs.map(([a,b],i)=>({
    id:`${s.id}_match_${n++}`,a,b,bo,res:null,...(broadcast?{broadcastTime:times[i]||'20:00'}:{})
  }))});
}
function broadcastWeekStart(date){
  const d=new Date(date+'T00:00:00Z'),day=d.getUTCDay();
  return addDays(date,(3-day+7)%7); // Wed-Sun broadcast window
}
function assignBroadcastWeek(rounds){
  const matches=rounds.flatMap((pairs,round)=>pairs.map(pair=>({pair,round})));
  const total=matches.length,minimum=Math.max(2,Math.ceil(total/5));
  for(let cap=minimum;cap<=minimum+2;cap++){
    const days=Array.from({length:5},()=>[]),assigned=new Map();
    let attempts=0;
    const fill=i=>{
      if(i===matches.length)return true;
      if(++attempts>250000)return false;
      const m=matches[i],opts=m.round===0?[0,1,2]:[2,3,4];
      const sorted=opts.slice().sort((a,b)=>days[a].length-days[b].length||a-b);
      for(const d of sorted){
        if(days[d].length>=cap)continue;
        if(m.pair.some(t=>(assigned.get(t)||[]).some(prev=>Math.abs(prev-d)<2)))continue;
        days[d].push(m.pair);
        for(const t of m.pair){const v=assigned.get(t)||[];v.push(d);assigned.set(t,v)}
        if(fill(i+1))return true;
        for(const t of m.pair){const v=assigned.get(t);v.pop();if(!v.length)assigned.delete(t)}
        days[d].pop();
      }
      return false;
    };
    if(fill(0))return days;
  }
  throw new Error('방송 일정의 팀별 휴식일과 중계 슬롯을 동시에 만족하지 못했습니다');
}
function addBroadcastLeagueDays(s,cfg,sched,start){
  const opening=broadcastWeekStart(start);
  for(let round=0;round<sched.length;round+=2){
    const week=Math.floor(round/2),weekStart=addDays(opening,week*7),
      allocation=assignBroadcastWeek(sched.slice(round,round+2));
    for(let day=0;day<allocation.length;day++)if(allocation[day].length){
      const label=`${cfg.name} ${round+1}${round+1<sched.length?'–'+(round+2):''}라운드 · 중계 ${day+1}/5`;
      pushDay(s,addDays(weekStart,day),cfg.id,label,allocation[day],cfg.bestOf,true);
    }
  }
}

