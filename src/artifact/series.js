// ===== LOL GM: Series / First Selection / Fearless domain =====
// Owns best-of session state, side/order selection, series-level Fearless context and replay.

// ===== LOL GM: Series (Phase 3) =====
function teamComposure(db,tid){return avg(db.teams[tid].roster.map(id=>db.players[id].attrs.composure))/100}
function gameMVP(r){
  const w=r.sides[r.winner], tot=w.ps.reduce((s,p)=>s+p.dmg,0)||1;
  return w.ps.reduce((b,p)=>{const v=(p.k*3+p.a*1.5)/(p.d+1)+p.dmg/tot*10+(p.role==='SUP'?1:0);return !b||v>b.v?{p,v}:b},null).p.p.id;
}
function playerGameRating(ps,side,win,mvp,duration){const min=Math.max(1,duration),kp=(ps.k+ps.a)/Math.max(1,side.kills),kda=(ps.k+ps.a)/Math.max(1,ps.d),csm=ps.cs/min,dpm=ps.dmg/min,vis=ps.vision/min,obj=ps.objectives||0,lane=ps.laneSamples?ps.laneAdv/ps.laneSamples:0,tf=ps.teamfights?ps.teamfightDmg/ps.teamfights/1000:0,role=ps.role;let v=4.55+(win?.42:0)+(mvp?.55:0)-ps.d*.08;if(role==='TOP')v+=kda*.35+csm*.105+dpm*.00068+kp*.4+lane*.18+tf*.12;else if(role==='JGL')v+=kda*.36+csm*.045+dpm*.00048+kp*.64+vis*.08+obj*.12+tf*.1;else if(role==='MID')v+=kda*.37+csm*.1+dpm*.00074+kp*.46+lane*.16+tf*.13;else if(role==='ADC')v+=kda*.33+csm*.12+dpm*.00084+kp*.44+lane*.12+tf*.15;else v+=kda*.3+csm*.02+dpm*.00036+kp*.78+vis*.14+obj*.1+tf*.1;return Math.round(clamp(v,3,10)*100)/100}
// 선택권(진영 vs 픽 순서): 선택권을 가진 팀이 '진영'이나 '픽 순서' 중 하나를 고르면, 상대가 나머지를 고른다
// 진영 가치: 블루 = 맵 이점(시야·오브젝트 동선). 순서 가치: 선픽 = 최고 챔피언 선점, 후픽 = 마지막 카운터픽(피어리스 후반 세트일수록 커짐)
function chooseSide(db,tid,opp,ctx,g,bestOf,rng){
  const me=draftPrefs(db,tid,ctx,g,bestOf,rng,opp), op=draftPrefs(db,opp,ctx,g,bestOf,rng,tid);
  const bestSide=v=>v.blue>=v.red?'blue':'red', bestOrd=v=>v.first>=v.last?'first':'last', flip={blue:'red',red:'blue',first:'last',last:'first'};
  // 선택권을 가진 팀은 현재 패치·코치·피어리스 상황을 보고 진영 또는 픽 순서 중 가치가 높은 쪽을 고른다.
  const sA=bestSide(me), oA=flip[bestOrd(op)], vA=me[sA]+me[oA];
  const oB=bestOrd(me), sB=flip[bestSide(op)], vB=me[sB]+me[oB];
  let side,order,chose;
  if(vA>=vB){side=sA;order=oA;chose='side'}else{side=sB;order=oB;chose='order'}
  const why=chose==='side'?`진영 선택 → ${side==='blue'?'블루':'레드'} (상대가 ${order==='first'?'후픽':'선픽'} 선택)`:`픽 순서 선택 → ${order==='first'?'선픽':'후픽'}${order==='last'&&me.fl>0.3?' (피어리스로 줄어든 챔피언 폭 — 마지막 카운터픽)':''} (상대가 ${side==='blue'?'레드':'블루'} 선택)`;
  return {side,order,chose,why:why+" · "+selectionDecisionReason(me,order),evidence:selectionDecisionSummary(me,op,{side:vA,order:vB})};
}
function resolveFirstSelection(db,chooser,other,ctx,g,bestOf,rng,choice){
  if(!choice)return chooseSide(db,chooser,other,ctx,g,bestOf,rng);
  const me=draftPrefs(db,chooser,ctx,g,bestOf,rng,other),op=draftPrefs(db,other,ctx,g,bestOf,rng,chooser),bestSide=v=>v.blue>=v.red?'blue':'red',bestOrd=v=>v.first>=v.last?'first':'last',flip={blue:'red',red:'blue',first:'last',last:'first'};
  if(choice.kind==='side'){
    if(!['blue','red'].includes(choice.value))throw new Error('Invalid First Selection side');
    const side=choice.value,order=flip[bestOrd(op)];
    return {side,order,chose:'side',evidence:selectionDecisionSummary(me,op,{manual:true}),why:`첫 번째 선택권 → ${side==='blue'?'블루':'레드'} · 상대가 ${order==='first'?'후픽':'선픽'} 선택`};
  }
  if(choice.kind==='order'){
    if(!['first','last'].includes(choice.value))throw new Error('Invalid First Selection order');
    const order=choice.value,side=flip[bestSide(op)];
    return {side,order,chose:'order',evidence:selectionDecisionSummary(me,op,{manual:true}),why:`첫 번째 선택권 → ${order==='first'?'선픽':'후픽'} · 상대가 ${side==='blue'?'레드':'블루'} 선택`};
  }
  throw new Error('Invalid First Selection choice');
}
function seriesSelectionPrompt(db,sess,managedId){
  if(seriesSessionDone(sess)||sess.current||sess.selectionResolved)return null;
  const chooser=sess.chooser,other=chooser===sess.a?sess.b:sess.a;
  if(chooser===managedId)return {mode:'first',game:sess.g,chooser,other,team:managedId};
  if(!sess.selectionLead){
    const rng=seriesSessionRng(sess),sc=chooseSide(seriesOfficialView(db,sess),chooser,other,sess.ctx,sess.g,sess.bestOf,rng);
    sess.sideRng={a:rng.a,sp:rng.sp};sess.selectionLead={chooser,other,chose:sc.chose,side:sc.side,order:sc.order,why:sc.why,evidence:sc.evidence};
  }
  const lead=sess.selectionLead,remaining=lead.chose==='side'?'order':'side';
  return {mode:'remaining',game:sess.g,chooser,other,team:managedId,remaining,lead:{chose:lead.chose,value:lead.chose==='side'?lead.side:lead.order,why:lead.why}};
}
function seriesApplyManagedSelection(db,sess,managedId,choice){
  const chooser=sess.chooser,other=chooser===sess.a?sess.b:sess.a;
  if(chooser===managedId){
    const rng=seriesSessionRng(sess),sc=resolveFirstSelection(seriesOfficialView(db,sess),chooser,other,sess.ctx,sess.g,sess.bestOf,rng,choice);
    sess.sideRng={a:rng.a,sp:rng.sp};sess.selectionResolved=sc;sess.selectionLead=null;return sc;
  }
  const prompt=seriesSelectionPrompt(db,sess,managedId),lead=sess.selectionLead;if(!prompt||prompt.mode!=='remaining'||!lead)throw new Error('No remaining First Selection choice');
  const flip={blue:'red',red:'blue',first:'last',last:'first'};let side=lead.side,order=lead.order;
  if(prompt.remaining==='order'){
    if(choice.kind!=='order'||!['first','last'].includes(choice.value))throw new Error('Invalid remaining order choice');
    order=flip[choice.value];
  }else{
    if(choice.kind!=='side'||!['blue','red'].includes(choice.value))throw new Error('Invalid remaining side choice');
    side=flip[choice.value];
  }
  const sc={side,order,chose:lead.chose,evidence:lead.evidence,why:`${lead.why} · 상대 선택 반영`};sess.selectionResolved=sc;sess.selectionLead=null;return sc;
}

// a = 상위 시드
function seriesDraftSnapshot(ctx){
  return {used:ctx.used.slice(),byTeam:Object.fromEntries(Object.entries(ctx.byTeam).map(([id,h])=>[id,{won:h.won.slice(),lost:h.lost.slice()}])),fearless:ctx.fearless,mods:{...ctx.mods},practice:ctx.practice,championPool:ctx.championPool};
}
function seriesGameSetup(db,aId,bId,bestOf,seed,ctx,g,chooser,srng,resolved=null){
  const other=chooser===aId?bId:aId,sc=resolved||chooseSide(db,chooser,other,ctx,g,bestOf,srng);
  const blue=sc.side==='blue'?chooser:other,red=blue===aId?bId:aId,gseed=seed+'/g'+g;
  let fpTeam=sc.order==='first'?chooser:other;if(BAL.randomTest)fpTeam=srng.chance(.5)?aId:bId;
  const snap=seriesDraftSnapshot(ctx);snap.firstPick=fpTeam===blue?0:1;
  return {other,sc,blue,red,gseed,fpTeam,snap};
}
function createSeriesSession(db,aId,bId,bestOf,seed,opt={}){
  const srng=new RNG(seed,'side'),firstChoice=opt.firstChoice||'seed';
  const chooser=firstChoice==='coin'?(srng.chance(.5)?aId:bId):aId;
  return {a:aId,b:bId,bestOf,seed,need:Math.ceil(bestOf/2),g:1,chooser,wins:{[aId]:0,[bId]:0},games:[],lines:[],
    ctx:{used:[],byTeam:{[aId]:{won:[],lost:[]},[bId]:{won:[],lost:[]}},fearless:!!opt.fearless,mods:{[aId]:0,[bId]:0},practice:!!opt.practice,championPool:opt.championPool||null},
    opt:{fearless:!!opt.fearless,firstChoice,compId:opt.compId||null,metaContext:opt.metaContext||null,replay:!!opt.replay,practice:!!opt.practice,selections:opt.replay?opt.selections||null:null},
    staffService:officialStaffServiceSnapshot(db,aId,bId,opt),
    sideRng:{a:srng.a,sp:srng.sp},selectionLead:null,selectionResolved:null,current:null};
}
function seriesSessionRng(sess){const r=new RNG(sess.seed,'side');r.a=sess.sideRng.a;r.sp=sess.sideRng.sp;return r}
function seriesSessionDone(sess){return sess.wins[sess.a]>=sess.need||sess.wins[sess.b]>=sess.need}
function seriesSessionPrepareGame(db,sess){
  if(seriesSessionDone(sess))return null;if(sess.current)return sess.current;
  const recorded=sess.opt.replay&&sess.opt.selections?.[sess.g-1];
  if(recorded&&[sess.a,sess.b].includes(recorded.blue)&&[sess.a,sess.b].includes(recorded.firstPick)){
    sess.chooser=[sess.a,sess.b].includes(recorded.sideBy)?recorded.sideBy:sess.chooser;
    sess.selectionResolved={side:recorded.blue===sess.chooser?'blue':'red',order:recorded.firstPick===sess.chooser?'first':'last',chose:'replay',why:recorded.sideWhy||'당시 선택권 재현',evidence:recorded.selectionEvidence||null};
  }
  const srng=seriesSessionRng(sess),x=seriesGameSetup(seriesOfficialView(db,sess),sess.a,sess.b,sess.bestOf,sess.seed,sess.ctx,sess.g,sess.chooser,srng,sess.selectionResolved);
  sess.sideRng={a:srng.a,sp:srng.sp};sess.selectionResolved=null;sess.selectionLead=null;
  sess.current={g:sess.g,chooser:sess.chooser,blue:x.blue,red:x.red,gseed:x.gseed,fpTeam:x.fpTeam,sc:x.sc,snap:x.snap};
  return sess.current;
}
function seriesResultLines(r,wId,mvp){
  const lines=[];
  for(let si=0;si<r.sides.length;si++){const s=r.sides[si],oppSide=r.sides[1-si],teamTf=s.ps.reduce((z,x)=>z+(x.teamfightDmg||0),0);
    for(const p of s.ps){const opp=oppSide.ps.find(x=>x.role===p.role),win=s.team.id===wId,isMvp=p.p.id===mvp;
      lines.push({pid:p.p.id,tid:s.team.id,role:p.role,champ:p.champ.id,k:p.k,d:p.d,a:p.a,cs:Math.round(p.cs),gold:Math.round(p.goldEarned),dmg:Math.round(p.dmg),dmgTaken:Math.round(p.dmgTaken||0),vision:Math.round((p.vision||0)*10)/10,objectives:p.objectives||0,laneAdv:Math.round((p.laneSamples?p.laneAdv/p.laneSamples:0)*100)/100,teamfightDmg:Math.round(p.teamfightDmg||0),teamfights:p.teamfights||0,teamfightWins:p.teamfightWins||0,teamfightShare:teamTf?(p.teamfightDmg||0)/teamTf:0,csDiff:Math.round(p.cs-(opp?opp.cs:0)),goldDiff:Math.round(p.goldEarned-(opp?opp.goldEarned:0)),dur:r.duration,kp:(p.k+p.a)/Math.max(1,s.kills),csm:p.cs/Math.max(1,r.duration),dpm:p.dmg/Math.max(1,r.duration),rating:playerGameRating(p,s,win,isMvp,r.duration),win,mvp:isMvp});
    }}
  return lines;
}
function playSeriesSessionGame(db,sess,forcedDraft=null,quiet=true){
  const cur=seriesSessionPrepareGame(db,sess);if(!cur)throw new Error('Series already complete');
  const snap=seriesDraftSnapshot(sess.ctx);snap.firstPick=cur.fpTeam===cur.blue?0:1;if(forcedDraft)snap.forced=forcedDraft;
  const matchDb=seriesOfficialView(db,sess),r=simulateMatch(matchDb,cur.blue,cur.red,cur.gseed,snap,quiet);r.comp=sess.opt.compId||null;r.date=db.worldDate;r.metaContext=sess.opt.metaContext||null;
  if(!sess.opt.replay&&!sess.opt.practice)recordMeta(db,r);
  const wId=r.winner===0?cur.blue:cur.red,lId=wId===cur.blue?cur.red:cur.blue;sess.wins[wId]++;
  const pk=[0,1].map(i=>ROLES.map(x=>r.draft.picks[i][x]));
  sess.ctx.used.push(...pk[0],...pk[1]);sess.ctx.byTeam[wId].won.push(...pk[r.winner]);sess.ctx.byTeam[lId].lost.push(...pk[1-r.winner]);
  sess.ctx.mods[lId]=clamp(sess.ctx.mods[lId]-0.035*(1.2-teamComposure(matchDb,lId)),-0.08,0.05);sess.ctx.mods[wId]=clamp(sess.ctx.mods[wId]+0.015,-0.08,0.05);
  const mvp=gameMVP(r);
  sess.games.push({n:sess.g,blue:cur.blue,red:cur.red,seed:cur.gseed,mods:cur.snap.mods,winner:wId,bans:r.draft.bans,sideBy:cur.chooser,sideWhy:cur.sc.why,selectionEvidence:recordedSelectionEvidence(cur.sc.evidence),firstPick:cur.fpTeam,kills:[r.sides[0].kills,r.sides[1].kills],dur:r.durationStr,duration:r.duration,picks:pk,mvp});
  const recordedGame=sess.games[sess.games.length-1];recordedGame.date=r.date;recordedGame.patch=matchDb.patch.id;
  if(r.draft.sequence)recordedGame.draftSequence=copyDraftSequence(r.draft.sequence);
  const manualEvidence=(Array.isArray(forcedDraft?.manualEvidence)?forcedDraft.manualEvidence:[]).filter(e=>!db.world?.fired&&managerControlsSquad(db,db.teams[e?.team]));
  const evidence=recordedManualDraftEvidence({manualEvidence},recordedGame);
  if(evidence)recordedGame.draftEvidence=evidence;
  sess.lines.push(...seriesResultLines(r,wId,mvp).map(l=>sess.opt.practice?{...l,practiceGame:sess.g}:l));sess.chooser=lId;sess.g++;sess.current=null;
  return {game:r,winner:wId,loser:lId,done:seriesSessionDone(sess),score:[sess.wins[sess.a],sess.wins[sess.b]]};
}
function seriesSessionResult(db,sess){
  if(!seriesSessionDone(sess))return null;const tac={[sess.a]:{...db.teams[sess.a].tactics},[sess.b]:{...db.teams[sess.b].tactics}};
  return {rec:{a:sess.a,b:sess.b,bestOf:sess.bestOf,seed:sess.seed,patch:db.patch.id,fearless:!!sess.opt.fearless,firstChoice:sess.opt.firstChoice,score:[sess.wins[sess.a],sess.wins[sess.b]],winner:sess.wins[sess.a]>sess.wins[sess.b]?sess.a:sess.b,games:sess.games,tac,...(sess.opt.practice?{practiceModel:'engine'}:{}),...(sess.staffService?{staffService:sess.staffService}:{})},lines:sess.lines};
}
function simulateSeries(db,aId,bId,bestOf,seed,opt={}){
  const sess=createSeriesSession(db,aId,bId,bestOf,seed,opt);
  while(!seriesSessionDone(sess)){
    const cur=seriesSessionPrepareGame(db,sess),forced=opt.forced&&opt.forced[sess.g-1]||null;
    if(opt.capture===sess.g){const snap=seriesDraftSnapshot(sess.ctx);snap.firstPick=cur.fpTeam===cur.blue?0:1;if(forced)snap.forced=forced;const r=simulateMatch(seriesOfficialView(db,sess),cur.blue,cur.red,cur.gseed,snap,false);r.comp=opt.compId||null;r.date=db.worldDate;r.metaContext=opt.metaContext||null;return {captured:r}}
    playSeriesSessionGame(db,sess,forced,true);
  }
  return seriesSessionResult(db,sess);
}
// 저장된 세트를 당시 전술로 다시 재생
function replayGame(db,rec,g){
  const keep={};for(const t in rec.tac){keep[t]=db.teams[t].tactics;db.teams[t].tactics=rec.tac[t]}
  const cur=db.patch; if(rec.patch&&rec.patch!==cur.id)db.patch=getPatch(db,rec.patch);
  const forced=rec.games.map(x=>({picks:[0,1].map(i=>Object.fromEntries(ROLES.map((r,j)=>[r,x.picks[i][j]]))),bans:x.bans||[[],[]]}));
  try{return simulateSeries(db,rec.a,rec.b,rec.bestOf,rec.seed,{fearless:rec.fearless,firstChoice:rec.firstChoice,capture:g.n,forced,selections:rec.games,replay:true}).captured}
  finally{for(const t in keep)db.teams[t].tactics=keep[t];db.patch=cur}
}

// ===== LOL GM: Competition / Stage 엔진 =====
// 지원 스테이지: round_robin(그룹 가능) · swiss · single_elim · double_elim
