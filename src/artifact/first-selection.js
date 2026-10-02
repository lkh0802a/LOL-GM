// First Selection uses the available patch and bounded opponent scouting.
function selectionLineup(db,tid){
  const t=db.teams[tid],copy={...t,roster:(t.roster||[]).slice(),depthChart:{...(t.depthChart||{})}};
  return Object.fromEntries(ROLES.map(r=>[r,starterFor(db,copy,r)]));
}
function selectionPatchValues(db,tid,pool){
  const t=db.teams[tid],samples=currentPatchMetaSamples(db),data=staffAnalysisFor(t,'data')/100,st=samples.stats,regional=samples.regional[t.region]||{};
  return Object.fromEntries(pool.champs.map(c=>{
    let v=(pool.strengths[c.id]-pool.mn)/(pool.mx-pool.mn||1);
    for(const [sample,games,weight] of [[st[c.id],samples.games,.45],[regional[c.id],samples.regionGames[t.region],.75]]){
      if(!sample||!games)continue;
      const n=(sample.p||0)+(sample.b||0),confidence=n/(n+18*(1.35-data)),wr=((sample.w||0)+2)/((sample.p||0)+4);
      v+=(clamp(.5+(wr-.5)*2+(n/games-.1)*.3,0,1)-v)*confidence*weight;
    }
    return [c.id,clamp(v+(t.metaKnowledge?.[c.id]||0)*.08-(t.metaCounter?.[c.id]||0)*.035,0,1)];
  }));
}
function firstSelectionEvidence(db,tid,opp,ctx={}){
  const pool=draftPoolSnapshot(db,ctx),used=new Set(ctx.fearless?ctx.used||[]:[]),mine=selectionLineup(db,tid),enemy=selectionLineup(db,opp||tid),meta=selectionPatchValues(db,tid,pool),state={db,ctx,teamIds:[tid,opp||tid],roster:[mine,enemy]};
  const roles=ROLES.map(role=>{
    const rows=(pool.byRole[role]||[]).filter(c=>!used.has(c.id)).map(c=>{
      const mastery=draftMasteryObservation(state,0,0,mine[role],c.id).value,
        opponent=draftMasteryObservation(state,0,1,enemy[role],c.id),
        fit=(meta[c.id]||0)*.35+mastery/100*.5;
      return {id:c.id,fit,mastery,opponent:opponent.value,confidence:opponent.confidence,meta:meta[c.id]||0,c};
    }).sort((a,b)=>b.fit-a.fit||a.id.localeCompare(b.id));
    const best=rows[0],second=rows[1],viable=rows.filter(x=>x.mastery>=65);
    if(!best)return {role,available:0,scarcity:0,contested:0,counter:0,breadth:0,flex:0};
    const opponentBest=rows.slice().sort((a,b)=>b.opponent-a.opponent||b.meta-a.meta)[0];
    const laneExposure=opponentBest?Math.max(0,(opponentBest.c.kit.early-best.c.kit.early+(opponentBest.c.kit.poke-best.c.kit.poke)*.5)/15):0;
    return {role,available:rows.length,priority:best.id,
      scarcity:clamp((best.fit-(second?.fit??best.fit))/.25,0,1),
      contested:clamp((best.opponent-65)/34,0,1)*best.meta,
      counter:laneExposure*clamp(viable.length/3,0,1),
      breadth:clamp(viable.length/6,0,1),flex:Math.min(1,(best.c.roles.length-1)/2),
      confidence:best.confidence};
  });
  const active=roles.filter(r=>r.available),average=key=>active.length?avg(active.map(r=>r[key])):0;
  return {version:1,available:pool.champs.filter(c=>!used.has(c.id)).length,roles,
    scarcity:Math.max(0,...roles.map(r=>r.scarcity)),contested:Math.max(0,...roles.map(r=>r.contested)),
    counter:average('counter'),breadth:average('breadth'),flex:average('flex'),
    exhausted:pool.champs.length?used.size/Math.max(1,pool.champs.length):0};
}
function draftPrefs(db,tid,ctx,g,bestOf,rng,opp=null){
  const t=db.teams[tid],prof=staffProfile(t),an=staffAnalysisFor(t,'meta')/100,noise=()=>rng.normal(0,.03*(1.1-an)),e=firstSelectionEvidence(db,tid,opp,ctx),fl=ctx.fearless?Math.min(1,(ctx.used||[]).length/40):0;
  return {blue:BAL.blue+noise(),red:noise(),
    first:BAL.first+e.scarcity*.09+e.contested*.05+e.flex*.025+noise(),
    last:.02+prof.draft/100*.03+e.counter*.09+e.breadth*.025+fl*e.breadth*.025+noise(),fl,evidence:e};
}
function selectionDecisionReason(prefs,order){
  const e=prefs.evidence;
  if(order==='first')return e.scarcity>=e.contested?'대체하기 어려운 주력 픽 선점':'상대 핵심 픽 견제';
  return e.counter>.1?'상대 라인전 조합에 후픽 대응':'남은 챔피언 폭을 활용한 후픽 대응';
}
function selectionDecisionSummary(me,op,options){
  const compact=p=>({first:p.first,last:p.last,blue:p.blue,red:p.red,
    scarcity:p.evidence.scarcity,contested:p.evidence.contested,
    counter:p.evidence.counter,breadth:p.evidence.breadth,
    priority:p.evidence.roles.filter(r=>r.priority).map(r=>({role:r.role,champ:r.priority,confidence:r.confidence}))});
  return {version:1,self:compact(me),opponent:compact(op),options};
}
function recordedSelectionEvidence(e){
  if(!e)return null;
  const compact=p=>Object.fromEntries(['first','last','scarcity','contested','counter','breadth']
    .map(k=>[k,Math.round((p[k]||0)*1000)/1000]));
  return {version:e.version,self:compact(e.self),opponent:compact(e.opponent)};
}
