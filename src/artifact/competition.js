// ===== LOL GM: Competition scheduling / standings domain =====
// Owns schedules, stages, standings and scheduled-series orchestration.

function addDays(iso,n){const d=new Date(iso+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function roundRobin(ids,legs){
  const t=ids.slice(); if(t.length%2)t.push(null);
  const n=t.length, rounds=[];
  for(let r=0;r<n-1;r++){
    const m=[];for(let i=0;i<n/2;i++){const a=t[i],b=t[n-1-i];if(a&&b)m.push(r%2?[b,a]:[a,b])}
    rounds.push(m); t.splice(1,0,t.pop());
  }
  const out=rounds.slice(); for(let l=1;l<legs;l++) out.push(...rounds.map(m=>m.map(([a,b])=>[b,a])));
  return out;
}
const STAGE_KO={round_robin:'풀리그',swiss:'스위스',single_elim:'싱글 엘리미네이션',double_elim:'더블 엘리미네이션'};
function newSeason(db,compId,year,seed,start,instanceKey=compId){
  const comp=db.competitions[compId], st0=comp.stages[0], id=`season_${year}_${instanceKey}`;
  const venue=competitionVenue(db,comp);
  comp.timeZone=venue.timeZone;comp.venueRegion=venue.region;
  const s={id,comp:compId,year,seed,days:[],cur:0,stage:0,stageData:{},pstats:{},done:false,champion:null,runnerUp:null,standingsMode:comp.region?(db.regions[comp.region]?.standingsMode||'independent'):null,venueTimeZone:venue.timeZone,venueRegion:venue.region};
  comp.championPool=Object.values(db.patch.champions).filter(c=>championProEligible(db,c,start||db.worldDate)).map(c=>c.id);comp.championPoolLockedAt=start||db.worldDate;
  const rng=new RNG(seed,'schedule');
  let order=st0.type==='round_robin'&&!st0.groups?comp.teams.slice().sort(()=>rng.next()-0.5):comp.teams.slice();
  if(st0.id==='playin'){const nx=comp.stages[1];order=comp.teams.filter(t=>!(nx.direct||[]).includes(t))}
  else if(st0.type!=='round_robin'&&st0.take)order=order.slice(0,st0.take);
  addStageDays(db,s,0,order,start||`${year}-01-14`);
  return s;
}
function pushDay(s,date,stage,label,pairs,bo,timeSlots=null){
  appendUtcFixtureDay(s,date,stage,label,pairs,bo,timeSlots);
}
function addStageDays(db,s,idx,teams,date){
  const cfg=db.competitions[s.comp].stages[idx], gap=i=>cfg.dayGap?cfg.dayGap[i%cfg.dayGap.length]:3;
  if(cfg.type==='round_robin'){
    let groups=[teams];
    if(cfg.groups>1){groups=Array.from({length:cfg.groups},()=>[]);teams.forEach((t,i)=>{const r=Math.floor(i/cfg.groups),k=i%cfg.groups;groups[r%2?cfg.groups-1-k:k].push(t)})}
    const sched=groups.map(g=>roundRobin(g,cfg.legs||1)),R=Math.max(...sched.map(x=>x.length));
    if(cfg.broadcastWeek){
      scheduleBroadcastRoundRobin(s,cfg,sched,R,date);
    }else{
      for(let r=0;r<R;r++){
        const pairs=sched.flatMap(x=>x[r]||[]);
        pushVenueRound(s,date,cfg.id,`${cfg.name} ${r+1}라운드`,pairs,cfg.bestOf);
        date=addDays(date,venueRoundGap(s,pairs.length,gap(r)));
      }
    }
    s.stageData[cfg.id]={type:cfg.type,teams,groups:cfg.groups>1?groups:null};
  } else if(cfg.type==='swiss'){
    const sd=s.stageData[cfg.id]={type:'swiss',teams,rec:Object.fromEntries(teams.map(t=>[t,{w:0,l:0,opp:[]}])),round:0,advanced:[],out:[],W:cfg.wins||3,L:cfg.losses||3};
    swissRound(db,s,idx,date);
  } else if(cfg.type==='single_elim'){
    s.stageData[cfg.id]={type:cfg.type,seeds:teams,alive:teams.slice(),round:0,rounds:[],elim:[]};
    addElimRound(db,s,idx,date);
  } else if(cfg.type==='double_elim'){
    s.stageData[cfg.id]={type:cfg.type,seeds:teams,ub:teams.slice(),lb:[],drop:[],round:0,rounds:[],elim:[],gf:false};
    deRound(db,s,idx,date);
  }
}
function seedSort(sd,arr){return arr.slice().sort((a,b)=>sd.seeds.indexOf(a)-sd.seeds.indexOf(b))}
function hiLo(arr){const p=[];for(let i=0;i<arr.length/2;i++)p.push([arr[i],arr[arr.length-1-i]]);return p}
function elimName(n){return n===2?'결승':n===4?'4강':n+'강'}
function addElimRound(db,s,idx,date){
  const cfg=db.competitions[s.comp].stages[idx], sd=s.stageData[cfg.id];
  const alive=seedSort(sd,sd.alive);let P=1;while(P<alive.length)P*=2;
  const byes=sd.round===0?P-alive.length:0, pairs=hiLo(alive.slice(byes));
  const label=`${cfg.name} ${elimName(alive.length)}`;
  pairs.slice().reverse().forEach((pr,i)=>pushDay(s,addDays(date,i),cfg.id,label,[pr],cfg.bestOf));
  sd.rounds.push({name:elimName(alive.length),label,byes:alive.slice(0,byes),pairs});sd.round++;
}
// 더블 엘리미네이션: 승자조 → (패자조 교차) → 패자조 → … → 최종 결승
function deRound(db,s,idx,date){
  const cfg=db.competitions[s.comp].stages[idx], sd=s.stageData[cfg.id]; let pairs,name,br;
  if(sd.ub.length===1&&sd.lb.length===1&&!sd.drop.length){pairs=[[sd.ub[0],sd.lb[0]]];name='최종 결승';br='GF';sd.gf=true}
  else if(sd.drop.length&&sd.lb.length){pairs=sd.lb.map((t,i)=>[t,sd.drop[i]]).filter(p=>p[1]);name=`패자조 ${sd.round+1}R`;br='LX'}
  else if(sd.drop.length&&!sd.lb.length){sd.lb=seedSort(sd,sd.drop);sd.drop=[];if(sd.lb.length>=2){pairs=hiLo(sd.lb);name=`패자조 ${sd.round+1}R`;br='L'}else return deRound(db,s,idx,date)}
  else if(sd.lb.length>=2&&(sd.ub.length<=1||sd.lb.length>sd.ub.length)){pairs=hiLo(seedSort(sd,sd.lb));name=`패자조 ${sd.round+1}R`;br='L'}
  else {pairs=hiLo(seedSort(sd,sd.ub));name=sd.ub.length===2?'승자조 결승':`승자조 ${sd.round+1}R`;br='U'}
  const label=`${cfg.name} ${name}`;
  pairs.forEach((pr,i)=>pushDay(s,addDays(date,i),cfg.id,label,[pr],cfg.bestOf));
  sd.rounds.push({name,label,br,byes:[],pairs});sd.round++;
}
function deAfter(sd,rd,res){
  const W=res.map(m=>m.res.winner), L=res.map(m=>m.a===m.res.winner?m.b:m.a);
  if(rd.br==='U'){sd.ub=W;sd.drop=L}
  else if(rd.br==='LX'){sd.lb=W;sd.drop=[];sd.elim.push(...L)}
  else if(rd.br==='L'){sd.lb=W;sd.elim.push(...L)}
  else if(rd.br==='GF'){sd.alive=[W[0]];sd.elim.push(L[0])}
}
// 스위스: 같은 전적끼리, 재대결 회피
function swissRound(db,s,idx,date){
  const cfg=db.competitions[s.comp].stages[idx], sd=s.stageData[cfg.id];
  const act=sd.teams.filter(t=>!sd.advanced.includes(t)&&!sd.out.includes(t));
  const bucket={};act.forEach(t=>{const r=sd.rec[t],k=r.w+'-'+r.l;(bucket[k]=bucket[k]||[]).push(t)});
  const keys=Object.keys(bucket).sort((a,b)=>{const [aw,al]=a.split('-').map(Number),[bw,bl]=b.split('-').map(Number);return (bw-bl)-(aw-al)});
  const pairs=[];let carry=[];
  for(const k of keys){let pool=[...carry,...seedSort({seeds:sd.teams},bucket[k])];carry=[];
    while(pool.length>=2){const a=pool.shift();let j=pool.findIndex(b=>!sd.rec[a].opp.includes(b));if(j<0)j=0;pairs.push([a,pool.splice(j,1)[0]])}
    carry=pool;}
  if(!pairs.length)return;
  const bo=cfg.bestOf; const label=`${cfg.name} ${sd.round+1}라운드`;
  pushVenueRound(s,date,cfg.id,label,pairs,bo);
  sd.round++;sd.lastLabel=label;
}
function standings(db,s,stageId){
  const sd=s.stageData[stageId];
  if(sd&&sd.type==='swiss'){
    const ord=[...sd.advanced,...sd.teams.filter(t=>!sd.advanced.includes(t)&&!sd.out.includes(t)),...sd.out.slice().reverse()];
    return ord.map(t=>({tid:t,w:sd.rec[t].w,l:sd.rec[t].l,gw:sd.rec[t].w,gl:sd.rec[t].l,h2h:{},form:[]}));
  }
  if(sd&&sd.groups){const gs=groupStandings(db,s,stageId);const out=[];const mx=Math.max(...gs.map(g=>g.length));for(let i=0;i<mx;i++)gs.forEach(g=>g[i]&&out.push(g[i]));return out}
  return rrTable(db,s,stageId,sd?sd.teams:[]);
}
function groupStandings(db,s,stageId){const sd=s.stageData[stageId];return sd.groups.map(g=>rrTable(db,s,stageId,g))}
function recordLines(s,lines){
  for(const l of lines){
    const p=s.pstats[l.pid]||(s.pstats[l.pid]={g:0,w:0,k:0,d:0,a:0,cs:0,gold:0,dmg:0,dmgTaken:0,vision:0,objectives:0,csDiff:0,goldDiff:0,laneAdvSum:0,laneAdvGames:0,teamfightDmg:0,teamfights:0,teamfightWins:0,teamfightShareSum:0,kpSum:0,min:0,mvp:0,ratingSum:0,champs:{}});
    p.g++;p.w+=l.win?1:0;p.k+=l.k;p.d+=l.d;p.a+=l.a;p.cs+=l.cs;p.gold+=l.gold||0;p.dmg+=l.dmg;p.dmgTaken+=l.dmgTaken||0;p.vision+=l.vision||0;p.objectives+=l.objectives||0;p.csDiff+=l.csDiff||0;p.goldDiff+=l.goldDiff||0;p.laneAdvSum+=l.laneAdv||0;p.laneAdvGames++;p.teamfightDmg+=l.teamfightDmg||0;p.teamfights+=l.teamfights||0;p.teamfightWins+=l.teamfightWins||0;p.teamfightShareSum+=l.teamfightShare||0;p.kpSum+=l.kp||0;p.min+=l.dur;p.mvp+=l.mvp?1:0;p.ratingSum+=l.rating||0;
    const c=p.champs[l.champ]||(p.champs[l.champ]=[0,0]);c[0]++;if(l.win)c[1]++;
  }
}
function scheduledSeriesOptions(db,s,day,cfg){
  const comp=db.competitions[s.comp],neutralIntlBracket=!!comp.international&&['single_elim','double_elim'].includes(cfg.type),firstChoice=neutralIntlBracket?'coin':(cfg.firstChoice||(cfg.type==='round_robin'&&!comp.international?'home':(['round_robin','swiss','single_elim'].includes(cfg.type)?'coin':'seed')));
  return {fearless:comp.rules&&comp.rules.fearless,firstChoice,compId:s.comp,championPool:comp.championPool,metaContext:{season:s.id,year:s.year,split:s.split||null,stage:day.stage,league:comp.region||s.comp,international:!!comp.international}};
}
function simulateScheduledSeries(db,s,day,m,cfg,extra={}){
  return simulateSeries(db,m.a,m.b,m.bo,`${s.seed}/${s.year}/${m.id}`,{...scheduledSeriesOptions(db,s,day,cfg),...extra});
}
function commitScheduledSeries(db,s,m,series){
  if(m.res)throw new Error('Scheduled match already resolved: '+m.id);
  m.res=series.rec;recordLines(s,series.lines);afterSeries(db,series.lines,series.rec);updatePlayerUsage(db,s,series.rec,series.lines);return m.res;
}
function finalizeCompetitionDay(db,s,day,cfgIdx,cfg){
  if(day.matches.some(m=>!m.res))return false;
  s.cur++;
  const comp=db.competitions[s.comp],sd=s.stageData[cfg.id],roundDays=s.days.filter(d=>d.stage===cfg.id&&d.label===day.label),roundDone=roundDays.every(d=>d.matches.every(m=>m.res));
  const localDate=day.matches.at(-1)?.localDate||day.date,nd=addDays(localDate,cfg.dayGap?cfg.dayGap[0]:5);
  if(cfg.type==='single_elim'&&roundDone){
    const r=sd.rounds[sd.rounds.length-1],ms=roundDays.flatMap(d=>d.matches);
    sd.elim.push(...ms.map(m=>m.a===m.res.winner?m.b:m.a));sd.alive=[...r.byes,...ms.map(m=>m.res.winner)];
    if(sd.alive.length===1)finishStage(db,s,cfgIdx,localDate);else addElimRound(db,s,cfgIdx,nd);
  }else if(cfg.type==='double_elim'&&roundDone){
    deAfter(sd,sd.rounds[sd.rounds.length-1],roundDays.flatMap(d=>d.matches));
    if(sd.alive&&sd.alive.length===1&&sd.gf)finishStage(db,s,cfgIdx,localDate);else deRound(db,s,cfgIdx,nd);
  }else if(cfg.type==='swiss'&&roundDone){
    for(const m of roundDays.flatMap(d=>d.matches)){const w=m.res.winner,l=m.a===w?m.b:m.a;sd.rec[w].w++;sd.rec[l].l++;sd.rec[m.a].opp.push(m.b);sd.rec[m.b].opp.push(m.a);if(sd.rec[w].w>=sd.W)sd.advanced.push(w);if(sd.rec[l].l>=sd.L)sd.out.push(l)}
    const act=sd.teams.filter(t=>!sd.advanced.includes(t)&&!sd.out.includes(t)),want=(comp.stages[cfgIdx+1]||{}).take||Math.floor(sd.teams.length/2);
    if(act.length>=2&&sd.advanced.length<want)swissRound(db,s,cfgIdx,addDays(localDate,2));else finishStage(db,s,cfgIdx,localDate);
  }else if(cfg.type==='round_robin'&&!s.days.slice(s.cur).some(d=>d.stage===cfg.id))finishStage(db,s,cfgIdx,localDate);
  return true;
}
function scheduledSeriesSession(db,s,m){
  const day=s.days[s.cur],comp=db.competitions[s.comp],cfgIdx=comp.stages.findIndex(x=>x.id===day.stage),cfg=comp.stages[cfgIdx],opt=scheduledSeriesOptions(db,s,day,cfg),seed=`${s.seed}/${s.year}/${m.id}`;
  const session=createSeriesSession(db,m.a,m.b,m.bo,seed,opt);return {session,day,comp,cfg,cfgIdx,opt,seed};
}
function playDay(db,s,opt={}){
  if(!s||s.done)return null;
  const day=s.days[s.cur],comp=db.competitions[s.comp],cfgIdx=comp.stages.findIndex(x=>x.id===day.stage),cfg=comp.stages[cfgIdx],pending=[];
  for(const m of day.matches){if(m.res)continue;
    if(opt.deferTeam&&(m.a===opt.deferTeam||m.b===opt.deferTeam)){pending.push({matchId:m.id});continue}
    commitScheduledSeries(db,s,m,simulateScheduledSeries(db,s,day,m,cfg));
  }
  const finalized=finalizeCompetitionDay(db,s,day,cfgIdx,cfg);
  return {day,pending,finalized};
}

function finishStage(db,s,idx,date){
  const comp=db.competitions[s.comp], cfg=comp.stages[idx], next=comp.stages[idx+1];
  if(next){
    const adv=standings(db,s,next.from||cfg.id).map(x=>x.tid).slice(0,next.take||undefined);
    const seeds=next.direct?[...next.direct,...adv]:adv;
    s.stage=idx+1; addStageDays(db,s,idx+1,seeds,addDays(date,next.type==='round_robin'?5:8));
    return;
  }
  s.done=true;
  const sd=s.stageData[cfg.id];
  if(cfg.type==='single_elim'||cfg.type==='double_elim'){
    s.champion=sd.alive[0]; s.runnerUp=sd.elim[sd.elim.length-1];
    const fin=s.days[s.days.length-1].matches[0]; s.finalScore=fin.res.winner===fin.a?fin.res.score:fin.res.score.slice().reverse();
  } else { const st=standings(db,s,cfg.id); s.champion=st[0].tid; s.runnerUp=st[1].tid; }
  const first=comp.stages[0].type==='round_robin'?standings(db,s,comp.stages[0].id)[0].tid:null;
  const mvp=Object.entries(s.pstats).filter(([,p])=>p.g>=6).sort((x,y)=>y[1].mvp-x[1].mvp||((y[1].k+y[1].a)/(y[1].d||1))-((x[1].k+x[1].a)/(x[1].d||1)))[0];
  db.history.push({year:s.year,comp:s.comp,compName:comp.name+(s.label?' '+s.label:''),region:comp.region||null,div:comp.div||1,intl:!!comp.international,champion:s.champion,runnerUp:s.runnerUp,regularFirst:first,mvp:mvp?mvp[0]:null,final:s.finalScore||null});
}
// 토너먼트 도달 점수: 우승 4, 준우승 3, 4강 2, 녹아웃 진출 1
function elimReach(db,s,tid){
  if(s.champion===tid)return 4; if(s.runnerUp===tid)return 3;
  const ko=Object.values(s.stageData).find(x=>x.type==='single_elim'||x.type==='double_elim'); if(!ko)return 0;
  const i=ko.elim.lastIndexOf(tid); if(i<0)return 0;
  return ko.elim.length-i<=3?2:1;
}
// ---- 진행 방식 프리셋 (리그: 항상 더블 라운드로빈 이상 · Bo3 이상) ----
const LEAGUE_FORMATS={rr_po:'더블 라운드로빈 + 플레이오프',rr_de:'더블 라운드로빈 + 더블 엘리미네이션',groups_po:'그룹 더블 라운드로빈 + 플레이오프'};
const INTL_FORMATS={playin_swiss_ko:'플레이인 + 스위스 + 녹아웃',swiss_ko:'스위스 + 녹아웃',playin_groups_ko:'플레이인 + 그룹 + 녹아웃',playin_de:'플레이인 + 더블 엘리미네이션',groups_ko:'그룹 + 녹아웃',groups_de:'그룹 + 더블 엘리미네이션',ko:'녹아웃'};
function leagueStages(R,n,div){
  const fmt=R.format||'rr_po', bo=Math.max(3,R.regularBo||3), pbo=div===2?3:Math.max(3,R.playoffBo||5);
  const take=div===2?Math.min(4,n):Math.min(Math.max(4,R.playoffTake||4),n);
  const rr={id:'regular',name:'정규 시즌',type:'round_robin',legs:Math.max(2,R.legs||2),bestOf:bo,dayGap:[3,4],broadcastWeek:true};
  const po=t=>({id:'playoffs',name:'플레이오프',type:'single_elim',from:'regular',take:t,bestOf:pbo,dayGap:[6,6],firstChoice:'seed'});
  if(div===2)return [rr,po(take)];
  if(fmt==='rr_de')return [rr,{id:'playoffs',name:'플레이오프',type:'double_elim',from:'regular',take:take>=8&&n>=8?8:take>=6&&n>=8?8:4,bestOf:pbo,dayGap:[4,4]}];
  if(fmt==='groups_po'&&n>=10)return [{...rr,name:'그룹 스테이지',groups:2},po(take)];
  return [rr,po(take)];
}
// 국제대회: 팀 목록은 시드 순서(지역 1번 시드 → 2번 시드 …)
function intlStages(fmt,teams,bo){
  const n=teams.length, B=Math.max(3,bo||5);
  const ko=(from,t)=>({id:'knockout',name:'녹아웃',type:'single_elim',from,take:t,bestOf:B,dayGap:[5,5],firstChoice:'coin'});
  const de=(from,t)=>({id:'knockout',name:'브래킷 스테이지',type:'double_elim',from,take:t,bestOf:B,dayGap:[3,3]});
  const grp=(g,extra={})=>({id:'groups',name:'그룹 스테이지',type:'round_robin',legs:1,bestOf:3,groups:g,dayGap:[1,1,2],...extra});
  const sw=(extra={})=>({id:'groups',name:'스위스 스테이지',type:'swiss',bestOf:3,wins:3,losses:3,dayGap:[2],...extra});
  if((fmt==='playin_swiss_ko'||fmt==='swiss_ko')&&n>=12){
    if(n<=16&&fmt==='swiss_ko'&&n===16)return [sw(),ko('groups',8)];
    const adv=Math.max(2,Math.min(8,Math.round((n-16)/3)+2)), direct=teams.slice(0,16-adv), pin=teams.slice(16-adv);
    if(n===16)return [sw(),ko('groups',8)];
    if(pin.length>adv)return [{id:'playin',name:'플레이인',type:'round_robin',legs:1,bestOf:3,groups:Math.max(1,Math.min(adv,Math.ceil(pin.length/6))),dayGap:[1,1]},sw({from:'playin',take:adv,direct}),ko('groups',8)];
  }
  if((fmt==='swiss_ko'||fmt==='playin_swiss_ko')&&n===8)return [sw({wins:2,losses:2}),ko('groups',4)];
  if(fmt==='playin_groups_ko'&&n>=10){
    const size=n>=16?16:8, adv=size===16?4:2, direct=teams.slice(0,size-adv), pin=teams.slice(size-adv);
    if(pin.length>adv)return [{id:'playin',name:'플레이인',type:'round_robin',legs:1,bestOf:3,groups:pin.length>=8?2:1,dayGap:[1,1]},grp(size/4,{from:'playin',take:adv,direct}),ko('groups',size/2)];
  }
  if(fmt==='playin_de'&&n>=6){
    const size=n>=8?8:4, adv=n>8?Math.min(4,Math.max(2,n-size+2)):0;
    if(adv){const direct=teams.slice(0,size-adv), pin=teams.slice(size-adv);
      if(pin.length>adv)return [{id:'playin',name:'플레이인',type:'round_robin',legs:1,bestOf:3,groups:Math.max(1,Math.min(adv,Math.ceil(pin.length/6))),dayGap:[1,1]},{...de('playin',adv),direct}];}
    return [{...de(undefined,size)}];
  }
  if(fmt==='ko'||n<6){let P=4;while(P*2<=n)P*=2;return [{...ko(undefined,P)}]}
  if(fmt==='groups_de'&&n>=8)return [grp(n>=12?4:2),de('groups',8)];
  return [grp(n>=12?4:2),ko('groups',n>=12?8:4)];
}
