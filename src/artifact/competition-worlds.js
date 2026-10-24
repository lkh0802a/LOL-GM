// ===== LOL GM: Worlds constrained draw and boundary tiebreaks (D-032) =====
function worldsDrawSchedule(teams,regions,rng){
  if(teams.length!==24||new Set(teams).size!==24)throw Error('월즈 리그 페이즈는 서로 다른 24팀이 필요합니다.');
  const counts={};for(const t of teams){if(!regions[t])throw Error('월즈 참가팀의 당시 리그가 필요합니다.');counts[regions[t]]=(counts[regions[t]]||0)+1;}
  if(Object.values(counts).some(n=>n>4))throw Error('월즈는 리그당 최대 4팀입니다.');
  const pots=[teams.slice(0,8),teams.slice(8,16),teams.slice(16,24)],key=(a,b)=>[a,b].sort().join('|');
  function matchings(left,right=null){
    if(!left.length)return [[]];
    const a=left[0],pool=right||left.slice(1),out=[];
    for(let i=0;i<pool.length;i++)if(regions[a]!==regions[pool[i]]){
      const rest=pool.filter((_,j)=>j!==i),tails=right?matchings(left.slice(1),rest):matchings(rest);
      for(const tail of tails)out.push([[a,pool[i]],...tail]);
    }
    return out;
  }
  function twice(left,right=null){
    const options=matchings(shuffleWithRng(left,rng),right&&shuffleWithRng(right,rng));
    for(const first of options){const used=new Set(first.map(([a,b])=>key(a,b)));const second=options.find(ms=>ms.every(([a,b])=>!used.has(key(a,b))));if(second)return [first,second];}
    throw Error('월즈 대진 제약을 만족하는 추첨을 구성할 수 없습니다.');
  }
  function halves(pot){
    const order=shuffleWithRng(pot,rng);
    for(let mask=0;mask<256;mask++){
      const a=order.filter((_,i)=>mask&(1<<i));if(a.length!==4)continue;
      const b=order.filter((_,i)=>!(mask&(1<<i)));
      if([a,b].every(ids=>Object.values(ids.reduce((o,t)=>(o[regions[t]]=(o[regions[t]]||0)+1,o),{})).every(n=>n<=2)))return [a,b];
    }
    throw Error('월즈 포트 분할 제약을 만족하지 못했습니다.');
  }
  const own=pots.map(p=>twice(p)),h=pots.map(halves),rounds=[own.flatMap(x=>x[0]),own.flatMap(x=>x[1]),[],[],[],[]];
  for(const [start,pairs] of [[2,[[h[0][0],h[1][0]],[h[1][1],h[2][0]],[h[2][1],h[0][1]]]], [4,[[h[0][1],h[1][1]],[h[1][0],h[2][1]],[h[2][0],h[0][0]]]]])
    for(const [a,b] of pairs){const two=twice(a,b);rounds[start].push(...two[0]);rounds[start+1].push(...two[1]);}
  return {pots,rounds};
}
function startWorldsLeague(db,s,idx,teams,date){
  const cfg=db.competitions[s.comp].stages[idx],regions=Object.fromEntries(teams.map(t=>[t,db.teams[t]?.region]));
  const draw=worldsDrawSchedule(teams,regions,new RNG(s.seed,'worlds-league-draw'));
  s.stageData[cfg.id]={type:'league_phase',teams:teams.slice(),pots:draw.pots,tiebreaks:[]};
  draw.rounds.forEach((pairs,r)=>{pushVenueRound(s,date,cfg.id,`${cfg.name} ${r+1}라운드`,pairs,3);date=addDays(date,venueRoundGap(s,pairs.length,1));});
}
function worldsLeagueRows(db,s,stageId){
  const sd=s.stageData[stageId],days=s.days.filter(d=>d.stage===stageId).map(d=>({...d,matches:d.matches.filter(m=>!m.worldsTiebreak)}));
  const rows=rrTable(db,{...s,days},stageId,sd.teams),byId=new Map(rows.map(r=>[r.tid,r]));
  for(const row of rows){const opponents=days.flatMap(d=>d.matches).filter(m=>m.res&&(m.a===row.tid||m.b===row.tid)).map(m=>m.a===row.tid?m.b:m.a);row.sos=opponents.reduce((n,t)=>n+byId.get(t).w,0);row.opponentSetDiff=opponents.reduce((n,t)=>n+byId.get(t).gw-byId.get(t).gl,0);}
  const compare=(a,b)=>b.w-a.w||b.sos-a.sos||(b.gw-b.gl)-(a.gw-a.gl)||b.opponentSetDiff-a.opponentSetDiff||b.gw-a.gw;
  // Seed order is a stable display order only. Boundary ties remain grouped.
  rows.sort((a,b)=>compare(a,b)||sd.teams.indexOf(a.tid)-sd.teams.indexOf(b.tid));
  return {rows,compare};
}
function worldsSplitRankGroup(group,value){const ranked=group.slice().sort((a,b)=>value(b)-value(a)),out=[];for(const row of ranked){const last=out.at(-1);if(last&&value(last[0])===value(row))last.push(row);else out.push([row]);}return out;}
function worldsHeadToHeadGroups(groups){
  // A partial mini-league cannot rank three or more teams fairly.
  return groups.flatMap(g=>g.length>1&&g.every(a=>g.every(b=>a===b||Object.hasOwn(a.h2h,b.tid)))?worldsSplitRankGroup(g,a=>g.reduce((n,b)=>n+(a.h2h[b.tid]||0),0)):[g]);
}
function worldsRankGroups(db,s,stageId){
  const sd=s.stageData[stageId],{rows,compare}=worldsLeagueRows(db,s,stageId),groups=[];
  for(const row of rows){const last=groups.at(-1);if(last&&!compare(last[0],row))last.push(row);else groups.push([row]);}
  const ranked=worldsHeadToHeadGroups(groups);
  const matches=new Map(s.days.flatMap(d=>d.matches).map(m=>[m.id,m]));
  for(const tb of sd.tiebreaks){const ms=tb.matches.map(id=>matches.get(id));if(!ms.length||ms.some(m=>!m?.res))continue;
    const at=ranked.findIndex(g=>g.length===tb.teams.length&&g.every(r=>tb.teams.includes(r.tid)));if(at<0)throw Error('월즈 결정전 순위 그룹이 일치하지 않습니다.');
    const wins=Object.fromEntries(tb.teams.map(t=>[t,0]));for(const m of ms){if(!Object.hasOwn(wins,m.res.winner))throw Error('월즈 결정전 승자가 확정되지 않았습니다.');wins[m.res.winner]++;}
    ranked.splice(at,1,...worldsSplitRankGroup(ranked[at],r=>wins[r.tid]));
  }
  return ranked;
}
function worldsStandings(db,s,stageId){
  let rank=1;return worldsRankGroups(db,s,stageId).flatMap(g=>{const rows=g.map(r=>({...r,rank,tied:g.length>1}));rank+=g.length;return rows;});
}
function continueWorldsLeague(db,s,idx,date){
  const cfg=db.competitions[s.comp].stages[idx],sd=s.stageData[cfg.id];
  if(s.days.slice(s.cur).some(d=>d.stage===cfg.id))return;
  let start=0;const unresolved=[];
  for(const g of worldsRankGroups(db,s,cfg.id)){const end=start+g.length;if([8,16].some(c=>start<c&&c<end))unresolved.push(g.map(r=>r.tid));start=end;}
  if(!unresolved.length){finishStage(db,s,idx,date);return;}
  date=addDays(date,1);
  for(const teams of unresolved){const index=sd.tiebreaks.length+1,tb={teams,matches:[]};sd.tiebreaks.push(tb);
    for(const pairs of roundRobin(teams,1)){const before=new Set(s.days.flatMap(d=>d.matches).map(m=>m.id));pushVenueRound(s,date,cfg.id,`${cfg.name} 경계 결정전 ${index}`,pairs,1);
      for(const m of s.days.flatMap(d=>d.matches))if(!before.has(m.id)){m.worldsTiebreak=index;tb.matches.push(m.id);}
      date=addDays(date,venueRoundGap(s,pairs.length,1));
    }
  }
}
function worldsElimRound(db,s,idx,date){
  const cfg=db.competitions[s.comp].stages[idx],sd=s.stageData[cfg.id];
  if(sd.round===0){if(sd.alive.length!==16)throw Error('월즈 녹아웃은 확정된 16팀이 필요합니다.');const lower=shuffleWithRng(sd.alive.slice(8),new RNG(s.seed,'worlds-r16-draw'));sd.alive=sd.alive.slice(0,8).flatMap((t,i)=>[t,lower[i]]);}
  const pairs=[];for(let i=0;i<sd.alive.length;i+=2)pairs.push(sd.alive.slice(i,i+2));
  const name=elimName(sd.alive.length),label=`${cfg.name} ${name}`;
  pairs.slice().reverse().forEach((pr,i)=>pushDay(s,addDays(date,i),cfg.id,label,[pr],cfg.bestOf));
  sd.rounds.push({name,label,byes:[],pairs});sd.round++;
}
function worldsBracketWinners(round,matches){
  return round.pairs.map(([a,b])=>{const m=matches.find(m=>m.a===a&&m.b===b);if(!m?.res||![a,b].includes(m.res.winner))throw Error('월즈 대진의 실제 승자가 필요합니다.');return m.res.winner;});
}
