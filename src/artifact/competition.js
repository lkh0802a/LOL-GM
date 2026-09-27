// ===== LOL GM: Series (Phase 3) =====
function teamComposure(db,tid){return avg(db.teams[tid].roster.map(id=>db.players[id].attrs.composure))/100}
function gameMVP(r){
  const w=r.sides[r.winner], tot=w.ps.reduce((s,p)=>s+p.dmg,0)||1;
  return w.ps.reduce((b,p)=>{const v=(p.k*3+p.a*1.5)/(p.d+1)+p.dmg/tot*10+(p.role==='SUP'?1:0);return !b||v>b.v?{p,v}:b},null).p.p.id;
}
function playerGameRating(ps,side,win,mvp,duration){const min=Math.max(1,duration),kp=(ps.k+ps.a)/Math.max(1,side.kills),kda=(ps.k+ps.a)/Math.max(1,ps.d),csm=ps.cs/min,dpm=ps.dmg/min,vis=ps.vision/min,obj=ps.objectives||0,lane=ps.laneSamples?ps.laneAdv/ps.laneSamples:0,tf=ps.teamfights?ps.teamfightDmg/ps.teamfights/1000:0,role=ps.role;let v=4.55+(win?.42:0)+(mvp?.55:0)-ps.d*.08;if(role==='TOP')v+=kda*.35+csm*.105+dpm*.00068+kp*.4+lane*.18+tf*.12;else if(role==='JGL')v+=kda*.36+csm*.045+dpm*.00048+kp*.64+vis*.08+obj*.12+tf*.1;else if(role==='MID')v+=kda*.37+csm*.1+dpm*.00074+kp*.46+lane*.16+tf*.13;else if(role==='ADC')v+=kda*.33+csm*.12+dpm*.00084+kp*.44+lane*.12+tf*.15;else v+=kda*.3+csm*.02+dpm*.00036+kp*.78+vis*.14+obj*.1+tf*.1;return Math.round(clamp(v,3,10)*100)/100}
// 선택권(진영 vs 픽 순서): 선택권을 가진 팀이 '진영'이나 '픽 순서' 중 하나를 고르면, 상대가 나머지를 고른다
// 진영 가치: 블루 = 맵 이점(시야·오브젝트 동선). 순서 가치: 선픽 = 최고 챔피언 선점, 후픽 = 마지막 카운터픽(피어리스 후반 세트일수록 커짐)
function draftPrefs(db,tid,ctx,g,bestOf,rng){
  const t=db.teams[tid], an=t.coach.analysis/100, noise=()=>rng.normal(0,0.03*(1.1-an));
  const fl=ctx.fearless?Math.min(1,ctx.used.length/40):0;
  return {blue:0.03+noise(),red:noise(),first:0.05+noise(),last:0.02+0.03*t.coach.draft/100+0.05*fl+(g===bestOf?0.02:0)+noise(),fl};
}
function chooseSide(db,tid,opp,ctx,g,bestOf,rng){
  const me=draftPrefs(db,tid,ctx,g,bestOf,rng), op=draftPrefs(db,opp,ctx,g,bestOf,rng);
  const bestSide=v=>v.blue>=v.red?'blue':'red', bestOrd=v=>v.first>=v.last?'first':'last', flip={blue:'red',red:'blue',first:'last',last:'first'};
  // 선택권을 가진 팀은 현재 패치·코치·피어리스 상황을 보고 진영 또는 픽 순서 중 가치가 높은 쪽을 고른다.
  const sA=bestSide(me), oA=flip[bestOrd(op)], vA=me[sA]+me[oA];
  const oB=bestOrd(me), sB=flip[bestSide(op)], vB=me[sB]+me[oB];
  let side,order,chose;
  if(vA>=vB){side=sA;order=oA;chose='side'}else{side=sB;order=oB;chose='order'}
  const why=chose==='side'?`진영 선택 → ${side==='blue'?'블루':'레드'} (상대가 ${order==='first'?'후픽':'선픽'} 선택)`:`픽 순서 선택 → ${order==='first'?'선픽':'후픽'}${order==='last'&&me.fl>0.3?' (피어리스로 줄어든 챔피언 폭 — 마지막 카운터픽)':''} (상대가 ${side==='blue'?'레드':'블루'} 선택)`;
  return {side,order,chose,why};
}
// a = 상위 시드
function simulateSeries(db,aId,bId,bestOf,seed,opt={}){
  const need=Math.ceil(bestOf/2), wins={[aId]:0,[bId]:0}, games=[], lines=[];
  const ctx={used:[],byTeam:{[aId]:{won:[],lost:[]},[bId]:{won:[],lost:[]}},fearless:!!opt.fearless,mods:{[aId]:0,[bId]:0},practice:!!opt.practice,championPool:opt.championPool||null};
  const srng=new RNG(seed,'side');
  // 1세트 진영 선택권: 토너먼트는 상위 시드, 풀리그는 코인 토스
  let chooser=opt.firstChoice==='coin'?(srng.chance(0.5)?aId:bId):aId;
  for(let g=1;wins[aId]<need&&wins[bId]<need;g++){
    const other=chooser===aId?bId:aId;
    const sc=chooseSide(db,chooser,other,ctx,g,bestOf,srng);
    const blue=sc.side==='blue'?chooser:other, red=blue===aId?bId:aId, gseed=seed+'/g'+g;
    let fpTeam=sc.order==='first'?chooser:other;
    if(BAL.randomTest){fpTeam=srng.chance(0.5)?aId:bId}
    const snap=JSON.parse(JSON.stringify(ctx)); snap.firstPick=fpTeam===blue?0:1;
    if(opt.forced&&opt.forced[g-1])snap.forced=opt.forced[g-1];
    const r=simulateMatch(db,blue,red,gseed,snap,opt.capture!==g);r.comp=opt.compId||null;r.date=db.worldDate;
    if(!opt.replay&&!opt.practice)recordMeta(db,r);
    if(opt.capture===g)return {captured:r};
    const wId=r.winner===0?blue:red, lId=wId===blue?red:blue;
    wins[wId]++;
    const pk=[0,1].map(i=>ROLES.map(x=>r.draft.picks[i][x]));
    ctx.used.push(...pk[0],...pk[1]);
    ctx.byTeam[wId].won.push(...pk[r.winner]); ctx.byTeam[lId].lost.push(...pk[1-r.winner]);
    // 세트 간 멘탈: 침착함이 낮을수록 패배 여파가 크다
    ctx.mods[lId]=clamp(ctx.mods[lId]-0.035*(1.2-teamComposure(db,lId)),-0.08,0.05);
    ctx.mods[wId]=clamp(ctx.mods[wId]+0.015,-0.08,0.05);
    const mvp=gameMVP(r);
    games.push({n:g,blue,red,seed:gseed,mods:snap.mods,winner:wId,bans:r.draft.bans,sideBy:chooser,sideWhy:sc.why,firstPick:fpTeam,kills:[r.sides[0].kills,r.sides[1].kills],dur:r.durationStr,duration:r.duration,picks:pk,mvp});
    for(let si=0;si<r.sides.length;si++){const s=r.sides[si],oppSide=r.sides[1-si],teamTf=s.ps.reduce((z,x)=>z+(x.teamfightDmg||0),0);
      for(const p of s.ps){const opp=oppSide.ps.find(x=>x.role===p.role),win=s.team.id===wId,isMvp=p.p.id===mvp;
        lines.push({pid:p.p.id,tid:s.team.id,champ:p.champ.id,k:p.k,d:p.d,a:p.a,cs:Math.round(p.cs),gold:Math.round(p.goldEarned),dmg:Math.round(p.dmg),dmgTaken:Math.round(p.dmgTaken||0),vision:Math.round((p.vision||0)*10)/10,objectives:p.objectives||0,laneAdv:Math.round((p.laneSamples?p.laneAdv/p.laneSamples:0)*100)/100,teamfightDmg:Math.round(p.teamfightDmg||0),teamfights:p.teamfights||0,teamfightWins:p.teamfightWins||0,teamfightShare:teamTf?(p.teamfightDmg||0)/teamTf:0,csDiff:Math.round(p.cs-(opp?opp.cs:0)),goldDiff:Math.round(p.goldEarned-(opp?opp.goldEarned:0)),dur:r.duration,kp:(p.k+p.a)/Math.max(1,s.kills),csm:p.cs/Math.max(1,r.duration),dpm:p.dmg/Math.max(1,r.duration),rating:playerGameRating(p,s,win,isMvp,r.duration),win,mvp:isMvp});
      }}
    chooser=lId; // 패배 팀이 다음 세트 진영 선택 (블루 선호)
  }
  const tac={[aId]:{...db.teams[aId].tactics},[bId]:{...db.teams[bId].tactics}};
  return {rec:{a:aId,b:bId,bestOf,seed,patch:db.patch.id,fearless:!!opt.fearless,firstChoice:opt.firstChoice||'seed',score:[wins[aId],wins[bId]],winner:wins[aId]>wins[bId]?aId:bId,games,tac},lines};
}
// 저장된 세트를 당시 전술로 다시 재생
function replayGame(db,rec,g){
  const keep={};for(const t in rec.tac){keep[t]=db.teams[t].tactics;db.teams[t].tactics=rec.tac[t]}
  const cur=db.patch; if(rec.patch&&rec.patch!==cur.id)db.patch=getPatch(db,rec.patch);
  const forced=rec.games.map(x=>({picks:[0,1].map(i=>Object.fromEntries(ROLES.map((r,j)=>[r,x.picks[i][j]]))),bans:x.bans||[[],[]]}));
  try{return simulateSeries(db,rec.a,rec.b,rec.bestOf,rec.seed,{fearless:rec.fearless,firstChoice:rec.firstChoice,capture:g.n,forced,replay:true}).captured}
  finally{for(const t in keep)db.teams[t].tactics=keep[t];db.patch=cur}
}

// ===== LOL GM: Competition / Stage 엔진 =====
// 지원 스테이지: round_robin(그룹 가능) · swiss · single_elim · double_elim
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
  const s={id,comp:compId,year,seed,days:[],cur:0,stage:0,stageData:{},pstats:{},done:false,champion:null,runnerUp:null};
  comp.championPool=Object.values(db.patch.champions).filter(c=>championProEligible(db,c,start||db.worldDate)).map(c=>c.id);comp.championPoolLockedAt=start||db.worldDate;
  const rng=new RNG(seed,'schedule');
  let order=st0.type==='round_robin'&&!st0.groups?comp.teams.slice().sort(()=>rng.next()-0.5):comp.teams.slice();
  if(st0.id==='playin'){const nx=comp.stages[1];order=comp.teams.filter(t=>!(nx.direct||[]).includes(t))}
  else if(st0.type!=='round_robin'&&st0.take)order=order.slice(0,st0.take);
  addStageDays(db,s,0,order,start||`${year}-01-14`);
  return s;
}
function nextMid(s){return `${s.id}_match_${s.days.reduce((n,d)=>n+d.matches.length,0)}`}
function pushDay(s,date,stage,label,pairs,bo){let n=s.days.reduce((a,d)=>a+d.matches.length,0);s.days.push({date,stage,label,matches:pairs.map(([a,b])=>({id:`${s.id}_match_${n++}`,a,b,bo,res:null}))})}
function addStageDays(db,s,idx,teams,date){
  const cfg=db.competitions[s.comp].stages[idx], gap=i=>cfg.dayGap?cfg.dayGap[i%cfg.dayGap.length]:3;
  if(cfg.type==='round_robin'){
    let groups=[teams];
    if(cfg.groups>1){groups=Array.from({length:cfg.groups},()=>[]);teams.forEach((t,i)=>{const r=Math.floor(i/cfg.groups),k=i%cfg.groups;groups[r%2?cfg.groups-1-k:k].push(t)})}
    const sched=groups.map(g=>roundRobin(g,cfg.legs||1)), R=Math.max(...sched.map(x=>x.length));
    for(let r=0;r<R;r++){pushDay(s,date,cfg.id,`${cfg.name} ${r+1}라운드`,sched.flatMap(x=>x[r]||[]),cfg.bestOf);date=addDays(date,gap(r))}
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
  pushDay(s,date,cfg.id,label,pairs,bo);
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
function rrTable(db,s,stageId,teams){
  const tb={};teams.forEach(t=>tb[t]={tid:t,w:0,l:0,gw:0,gl:0,h2h:{},form:[]});
  for(const d of s.days) if(d.stage===stageId) for(const m of d.matches) if(m.res&&tb[m.a]&&tb[m.b]){
    const [sa,sb]=m.res.score, wa=m.res.winner===m.a;
    tb[m.a].gw+=sa;tb[m.a].gl+=sb;tb[m.b].gw+=sb;tb[m.b].gl+=sa;
    tb[wa?m.a:m.b].w++;tb[wa?m.b:m.a].l++;
    tb[m.a].h2h[m.b]=(tb[m.a].h2h[m.b]||0)+(wa?1:-1);tb[m.b].h2h[m.a]=(tb[m.b].h2h[m.a]||0)+(wa?-1:1);
    tb[m.a].form.push(wa?'W':'L');tb[m.b].form.push(wa?'L':'W');
  }
  return Object.values(tb).sort((x,y)=>(y.w-x.w)||((y.gw-y.gl)-(x.gw-x.gl))||((y.h2h[x.tid]||0)-(x.h2h[y.tid]||0))||(hashStr(s.seed+x.tid)-hashStr(s.seed+y.tid)));
}
function recordLines(s,lines){
  for(const l of lines){
    const p=s.pstats[l.pid]||(s.pstats[l.pid]={g:0,w:0,k:0,d:0,a:0,cs:0,gold:0,dmg:0,dmgTaken:0,vision:0,objectives:0,csDiff:0,goldDiff:0,laneAdvSum:0,laneAdvGames:0,teamfightDmg:0,teamfights:0,teamfightWins:0,teamfightShareSum:0,kpSum:0,min:0,mvp:0,ratingSum:0,champs:{}});
    p.g++;p.w+=l.win?1:0;p.k+=l.k;p.d+=l.d;p.a+=l.a;p.cs+=l.cs;p.gold+=l.gold||0;p.dmg+=l.dmg;p.dmgTaken+=l.dmgTaken||0;p.vision+=l.vision||0;p.objectives+=l.objectives||0;p.csDiff+=l.csDiff||0;p.goldDiff+=l.goldDiff||0;p.laneAdvSum+=l.laneAdv||0;p.laneAdvGames++;p.teamfightDmg+=l.teamfightDmg||0;p.teamfights+=l.teamfights||0;p.teamfightWins+=l.teamfightWins||0;p.teamfightShareSum+=l.teamfightShare||0;p.kpSum+=l.kp||0;p.min+=l.dur;p.mvp+=l.mvp?1:0;p.ratingSum+=l.rating||0;
    const c=p.champs[l.champ]||(p.champs[l.champ]=[0,0]);c[0]++;if(l.win)c[1]++;
  }
}
function playDay(db,s){
  if(!s||s.done)return null;
  const day=s.days[s.cur], comp=db.competitions[s.comp];
  const cfgIdx=comp.stages.findIndex(x=>x.id===day.stage), cfg=comp.stages[cfgIdx];
  for(const m of day.matches){
    const firstChoice=cfg.type==='round_robin'||cfg.type==='swiss'?'coin':'seed';
    const {rec,lines}=simulateSeries(db,m.a,m.b,m.bo,`${s.seed}/${s.year}/${m.id}`,{fearless:comp.rules&&comp.rules.fearless,firstChoice,compId:s.comp,championPool:comp.championPool});
    m.res=rec; recordLines(s,lines); afterSeries(db,lines,rec); updatePlayerUsage(db,s,rec,lines);
  }
  s.cur++;
  const sd=s.stageData[cfg.id], roundDays=s.days.filter(d=>d.stage===cfg.id&&d.label===day.label), roundDone=roundDays.every(d=>d.matches.every(m=>m.res));
  const nd=addDays(day.date,cfg.dayGap?cfg.dayGap[0]:5);
  if(cfg.type==='single_elim'&&roundDone){
    const r=sd.rounds[sd.rounds.length-1], ms=roundDays.flatMap(d=>d.matches);
    sd.elim.push(...ms.map(m=>m.a===m.res.winner?m.b:m.a));
    sd.alive=[...r.byes,...ms.map(m=>m.res.winner)];
    if(sd.alive.length===1) finishStage(db,s,cfgIdx,day.date); else addElimRound(db,s,cfgIdx,nd);
  } else if(cfg.type==='double_elim'&&roundDone){
    deAfter(sd,sd.rounds[sd.rounds.length-1],roundDays.flatMap(d=>d.matches));
    if(sd.alive&&sd.alive.length===1&&sd.gf) finishStage(db,s,cfgIdx,day.date); else deRound(db,s,cfgIdx,nd);
  } else if(cfg.type==='swiss'&&roundDone){
    for(const m of day.matches){const w=m.res.winner,l=m.a===w?m.b:m.a;sd.rec[w].w++;sd.rec[l].l++;sd.rec[m.a].opp.push(m.b);sd.rec[m.b].opp.push(m.a);
      if(sd.rec[w].w>=sd.W)sd.advanced.push(w);if(sd.rec[l].l>=sd.L)sd.out.push(l);}
    const act=sd.teams.filter(t=>!sd.advanced.includes(t)&&!sd.out.includes(t));
    const want=(comp.stages[cfgIdx+1]||{}).take||Math.floor(sd.teams.length/2);
    if(act.length>=2&&sd.advanced.length<want) swissRound(db,s,cfgIdx,addDays(day.date,1)); else finishStage(db,s,cfgIdx,day.date);
  } else if(cfg.type==='round_robin'&&!s.days.slice(s.cur).some(d=>d.stage===cfg.id)) finishStage(db,s,cfgIdx,day.date);
  return day;
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
  const rr={id:'regular',name:'정규 시즌',type:'round_robin',legs:Math.max(2,R.legs||2),bestOf:bo,dayGap:[3,4]};
  const po=t=>({id:'playoffs',name:'플레이오프',type:'single_elim',from:'regular',take:t,bestOf:pbo,dayGap:[6,6]});
  if(div===2)return [rr,po(take)];
  if(fmt==='rr_de')return [rr,{id:'playoffs',name:'플레이오프',type:'double_elim',from:'regular',take:take>=8&&n>=8?8:take>=6&&n>=8?8:4,bestOf:pbo,dayGap:[4,4]}];
  if(fmt==='groups_po'&&n>=10)return [{...rr,name:'그룹 스테이지',groups:2},po(take)];
  return [rr,po(take)];
}
// 국제대회: 팀 목록은 시드 순서(지역 1번 시드 → 2번 시드 …)
function intlStages(fmt,teams,bo){
  const n=teams.length, B=Math.max(3,bo||5);
  const ko=(from,t)=>({id:'knockout',name:'녹아웃',type:'single_elim',from,take:t,bestOf:B,dayGap:[5,5]});
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