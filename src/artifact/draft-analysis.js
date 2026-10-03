// ===== LOL GM: Draft analysis / scouting evidence =====
// Draft legality and selection live in draft.js. This module owns bounded information,
// scouting provenance, composition evidence and opponent-intent explanations used by draft UX.

function draftMasteryObservation(state,observerSide,targetSide,p,cid){
  if(!p)return {value:25,confidence:0,sources:['선수 정보 없음']};
  const actual=draftMastery(p,cid);if(observerSide===targetSide)return {value:actual,confidence:100,sources:['구단 내부 훈련·스크림 데이터']};
  const db=state.db,observer=db.teams[state.teamIds[observerSide]],target=db.teams[state.teamIds[targetSide]],managed=managedTeamId(db)===observer?.id;
  if(managed){
    const base=baseScoutKnowledge(db,p),raw=(db.scout||{})[p.id],stored=typeof raw==='number'?raw:(raw?.knowledge||0),knowledge=Math.round(clamp(Math.max(base,stored),0,98));
    const noise=((hashStr(observer.id+'|draft-scout|'+p.id+'|'+cid)%2001)/1000-1)*(100-knowledge)*.12,value=Math.round(clamp(actual+noise,20,99)),sources=[];
    if(raw&&typeof raw==='object'&&(raw.gamesSeen||0)>0)sources.push('공식 경기 관찰 '+raw.gamesSeen+'G');
    if(raw&&typeof raw==='object'&&(raw.observations||0)>0)sources.push('스카우팅 관찰 '+raw.observations+'회');
    if(!sources.length)sources.push(p.region===observer.region?'동일 지역 기본 정보':sameScoutZone(p.region,observer.region)?'동일 권역 기본 정보':'해외 기본 정보');
    sources.push('스카우팅팀 '+Math.round(staffProfile(observer).scouting));
    return {value,confidence:knowledge,sources};
  }
  const prof=staffProfile(observer),sameRegion=observer?.region===target?.region,sameZone=!sameRegion&&sameScoutZone(observer?.region,target?.region),hist=state.ctx.byTeam[state.teamIds[targetSide]]||{won:[],lost:[]},revealed=hist.won.includes(cid)||hist.lost.includes(cid);
  const confidence=Math.round(clamp(18+prof.scouting*.34+prof.analysis*.23+(sameRegion?15:sameZone?7:0)+(revealed?12:0),25,92)),noise=((hashStr((observer?.id||'AI')+'|opp-mastery|'+p.id+'|'+cid)%2001)/1000-1)*(100-confidence)*.16,value=Math.round(clamp(actual+noise,20,99));
  const sources=['스카우팅팀 '+Math.round(prof.scouting),'분석팀 '+Math.round(prof.analysis)];if(sameRegion)sources.push('동일 지역 관찰');else if(sameZone)sources.push('동일 권역 관찰');if(revealed)sources.push('이번 시리즈 공개 픽');
  return {value,confidence,sources};
}
function draftMetaEvidence(state,side,cid){
  const db=state.db,team=db.teams[state.teamIds[side]],rid=team.region,samples=currentPatchMetaSamples(db),gst=samples.stats[cid],rst=samples.regional[rid]?.[cid],globalSample=gst?(gst.p||0)+(gst.b||0):0,regionalSample=rst?(rst.p||0)+(rst.b||0):0,study=clamp(((team.metaKnowledge||{})[cid]||0),0,1),analysis=staffAnalysisFor(team,'data'),sources=['현재 패치 '+samples.patch];
  if(regionalSample)sources.push((db.regions[rid]?.short||rid)+' 현재 패치 프로 표본 '+regionalSample);
  if(globalSample)sources.push('글로벌 현재 패치 프로 표본 '+globalSample);else sources.push('현재 패치 표본 없음');
  const mixed=db.metaStats?.[cid],historicalEffectiveSample=(mixed?.p||0)+(mixed?.b||0);
  if(historicalEffectiveSample)sources.push('누적/감쇠 참고 '+historicalEffectiveSample+' · 현재 패치 신뢰도에 미반영');
  if(study>.01)sources.push('구단 챔피언 연구 '+Math.round(study*100));
  sources.push('분석팀 '+Math.round(analysis));
  const confidence=Math.round(clamp(analysis*.55+Math.min(34,Math.sqrt(globalSample+regionalSample*1.35)*5)+(study*12),20,98));
  return {score:Math.round(clamp(state.vhat[side]?.[cid]||0,0,1)*100),confidence,patch:samples.patch,globalSample,regionalSample,historicalEffectiveSample,teamStudy:Math.round(study*100),sources};
}
function draftManagedChampionPoolEvidence(db,p,cid){
  const me=managedTeam(db),base=baseScoutKnowledge(db,p),raw=(db.scout||{})[p.id],stored=typeof raw==='number'?raw:(raw?.knowledge||0),knowledge=Math.round(clamp(Math.max(base,stored),0,98)),estimate=id=>Math.round(clamp(draftMastery(p,id)+((hashStr((me?.id||'M')+'|pool|'+p.id+'|'+id)%2001)/1000-1)*(100-knowledge)*.12,20,99)),width=Math.max(2,Math.ceil((100-knowledge)/12)),range=id=>{const v=estimate(id);return [Math.max(20,v-width),Math.min(99,v+width)]},sources=[];
  if(raw&&typeof raw==='object'&&(raw.gamesSeen||0)>0)sources.push('공식 경기 관찰 '+raw.gamesSeen+'G');
  if(raw&&typeof raw==='object'&&(raw.observations||0)>0)sources.push('스카우팅 관찰 '+raw.observations+'회');
  if(!sources.length)sources.push(p.region===me?.region?'동일 지역 기본 정보':sameScoutZone(p.region,me?.region)?'동일 권역 기본 정보':'해외 기본 정보');
  const top=Object.keys(p.pool||{}).map(id=>({champ:id,estimate:estimate(id),range:range(id)})).sort((a,b)=>b.estimate-a.estimate).slice(0,4).map(x=>({champ:x.champ,range:x.range}));
  return {knowledge,selectedRange:range(cid),top,sources,lastSeenDate:typeof raw==='object'?raw.lastSeenDate||null:null};
}
function draftOwnChampionPoolEvidence(state,side,role,cid){
  const p=state.roster[side][role];if(!p)return null;const rows=Object.entries(p.pool||{}).map(([id,v])=>({champ:id,mastery:Math.round(v.mastery||25)})).sort((a,b)=>b.mastery-a.mastery),idx=rows.findIndex(x=>x.champ===cid);
  return {rank:idx>=0?idx+1:null,total:rows.length,trained:idx>=0,top:rows.slice(0,4),source:'팀 내부 훈련·스크림 데이터',confidence:100};
}
function draftCompositionEvidence(state,side,cid,score){
  const c=state.db.patch.champions[cid],mine=state.pickList[side].map(id=>state.db.patch.champions[id]).filter(Boolean),t=state.tacs[side],reasons=[],maxEng=mine.reduce((m,x)=>Math.max(m,x.kit.engage),0);
  if(maxEng<7&&c.kit.engage>=5)reasons.push('현재 이니시에이팅 부족 보완');
  if(!mine.some(x=>x.cls==='tank')&&c.cls==='tank')reasons.push('전방 탱커 부재 보완');
  if(mine.length>=2){const ap=mine.filter(x=>x.dmg==='AP').length,ad=mine.length-ap;if(ap===0&&c.dmg==='AP')reasons.push('AP 피해 비중 보완');if(ad===0&&c.dmg==='AD')reasons.push('AD 피해 비중 보완')}
  const scaling=(t.scaling_preference-50)/50*(c.kit.late-c.kit.early);if(Math.abs(scaling)>=.8)reasons.push(scaling>0?'팀 시간대 선호와 부합':'팀 시간대 선호와 충돌');
  if(!reasons.length)reasons.push('현재 조합에서 뚜렷한 구조 보정 없음');
  const history=championCompositionInsights(state.db,cid,{team:state.teamIds[side],patch:state.db.patch.id});
  return {score,currentPicks:mine.map(x=>x.id),reasons,source:'현재 우리 공개 픽 + 팀 전술',observed:{sample:history.sample,complete:history.complete,partial:history.partial,pairs:history.pairs.filter(x=>mine.some(c=>c.id===x.champ))}};
}
function draftCandidateEvidence(state,side,cid,out){
  out.metaEvidence=draftMetaEvidence(state,side,cid);
  if(out.kind==='P'){
    out.compositionEvidence=draftCompositionEvidence(state,side,cid,out.comp);
    for(const fit of out.roleFits||[]){
      const p=state.roster[side][fit.role],enemy=draftRolePossibilities(state,1-side,fit.role);
      fit.pool=draftOwnChampionPoolEvidence(state,side,fit.role,cid);
      fit.matchups=enemy.map(id=>({champ:id,name:championDisplayName(state.db.patch.champions[id])}));
      fit.matchupSource=enemy.length?'상대 공개 픽에서 가능한 '+ROLE_KO[fit.role]+' 배치':'상대 해당 포지션 픽 미공개';
      fit.playerId=p?.id||null;
    }
  }else{
    const opp=1-side;
    out.opponentPool=(out.roles||[]).map(role=>{const p=state.roster[opp][role];if(!p)return null;const managed=managedTeamId(state.db)===state.teamIds[side],pool=managed?draftManagedChampionPoolEvidence(state.db,p,cid):null,obs=draftMasteryObservation(state,side,opp,p,cid);return {role,player:p.name,knowledge:pool?.knowledge??obs.confidence,selectedRange:pool?.selectedRange||[Math.max(20,obs.value-6),Math.min(99,obs.value+6)],top:pool?.top||[],sources:pool?.sources||obs.sources,lastSeenDate:pool?.lastSeenDate||null}}).filter(Boolean);
  }
  return out;
}
function draftOpponentIntent(state,observerSide,limit=3){
  if(!state||![0,1].includes(observerSide)||!Number.isSafeInteger(limit)||limit<=0)return [];
  const db=state.db,opp=1-observerSide,observer=db.teams[state.teamIds[observerSide]],analysis=staffAnalysisFor(observer,'opponent'),hist=state.ctx.byTeam?.[state.teamIds[observerSide]]||{won:[],lost:[]},opponentHistory=state.ctx.byTeam?.[state.teamIds[opp]]||{won:[],lost:[]};
  return state.log.filter(x=>x.side===opp).slice(-limit).reverse().map(x=>{
    const c=db.patch.champions[x.champ],evidence=draftMetaEvidence(state,observerSide,x.champ),patchStats=currentPatchMetaSamples(db).stats[x.champ],patchPicks=patchStats?.p||0,patchBans=patchStats?.b||0,meta=evidence.score,roles=(c?.roles||[]).filter(r=>ROLES.includes(r)),reasons=[],sources=['공개 밴픽','상대 분석팀 '+Math.round(analysis),...evidence.sources];let info=analysis,confidence=analysis,observations=[];
    if(evidence.globalSample)sources.push('현재 패치 공개 기록 '+patchPicks+'픽 · '+patchBans+'밴');
    if(x.kind==='P'){
      observations=roles.filter(role=>state.roster[opp][role]).map(role=>{
        const obs=draftMasteryObservation(state,observerSide,opp,state.roster[opp][role],x.champ),width=Math.max(2,Math.ceil((100-obs.confidence)/12));
        return {role,confidence:obs.confidence,range:[Math.max(20,obs.value-width),Math.min(99,obs.value+width)],sources:obs.sources};
      });
      info=observations.length?Math.round(avg(observations.map(r=>r.confidence))):0;confidence=Math.round(clamp(analysis*.55+info*.45,20,95));
      if(meta>=65)reasons.push('현재 패치 평가에서 우선도가 높은 픽');if(roles.length>1)reasons.push('복수 포지션 가능성을 남기는 픽');if(observations.some(r=>r.range[0]>=65))reasons.push('관찰 숙련 범위가 높은 챔피언 선택');
      if(opponentHistory.won.includes(x.champ)||opponentHistory.lost.includes(x.champ)){reasons.unshift('이번 시리즈에서 공개된 상대 픽 재선택');sources.push('이번 시리즈 상대 공개 픽')}
      if(!reasons.length)reasons.push('공개 정보만으로 선택 의도 구분 어려움');
    }else{
      const ownMastery=roles.map(role=>draftMastery(state.roster[observerSide][role],x.champ));if(ownMastery.some(v=>v>=70)){reasons.push('우리 선수의 높은 숙련 챔피언 견제 가능성');sources.push('구단 내부 훈련·스크림 데이터')}
      if(hist.won.includes(x.champ)){reasons.push('이전 세트 승리 픽 재사용 차단 가능성');sources.push('이번 시리즈 우리 승리 픽')}
      if(meta>=65)reasons.push('현재 패치 우선 챔피언 제거 가능성');if(roles.length>1)reasons.push('플렉스 선택지 차단 가능성');if(!reasons.length)reasons.push('일반적인 밴 우선순위에 따른 견제 가능성');
      confidence=Math.round(clamp(analysis+(hist.won.includes(x.champ)?8:0),20,96));
    }
    if(!evidence.globalSample)reasons.push('현재 패치 표본 부족 · 패치 평가와 관찰 기반 추정');
    return {kind:x.kind,champ:x.champ,meta,roles,confidence,information:Math.round(info),analysis:Math.round(analysis),observations,patch:evidence.patch,patchPicks,patchBans,globalSample:evidence.globalSample,regionalSample:evidence.regionalSample,sources:[...new Set(sources)],reasons:reasons.slice(0,3)};
  });
}
