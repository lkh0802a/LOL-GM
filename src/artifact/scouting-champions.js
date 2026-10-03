// ===== LOL GM: Saved champion scouting signals =====
// Actual observation writers may sample latent mastery. Readers only consume
// dated observer-owned snapshots; public appearances never imply mastery.
function championScoutReport(db,t,p){
  if(!t||!p)return null;
  if(t.id===managedTeamId(db))return !db.world?.fired?db.scout?.[p.id]:null;
  const owner=aiScoutingOwner(db,t);
  if(!owner||owner.id===managedTeamId(db))return null;
  return owner.scoutingState?.reports?.[p.id]||null;
}
function championScoutObserver(db,t){return t.id===managedTeamId(db)?t.id:aiScoutingOwner(db,t)?.id}
function recordChampionScoutObservation(db,t,p,r,opt={}){
  if(!t||!observedMetaDate(db,{date:db.worldDate}))return;
  const observer=championScoutObserver(db,t),publicPool=publicPlayerChampions(db,p),
    investigation=opt.comp==='manual'||String(opt.comp||'').startsWith('SCOUT:'),
    candidates=publicPool.champions.filter(x=>investigation||opt.games>0&&x.to===db.worldDate),
    uncertainty=aiScoutUncertainty(db,t,p,r.knowledge,0);
  for(const x of candidates){
    // Never enumerate private pool identities or invent a missing mastery value.
    const actual=p.pool?.[x.id]?.mastery;if(!Number.isFinite(actual))continue;
    const noise=((hashStr(observer+'|'+p.id+'|'+x.id+'|'+db.worldDate+'|'+r.observations)%2001)/1000-1),
      estimate=Math.round(clamp(actual+noise*uncertainty,20,99));
    r.championObservations=r.championObservations||{};
    r.championObservations[x.id]={observer,player:p.id,champ:x.id,date:db.worldDate,
      source:investigation?'investigation':'official',competition:opt.comp,
      evidenceFrom:x.from,evidenceTo:x.to,appearances:x.g,
      estimate,uncertainty,knowledge:Math.round(r.knowledge)};
  }
}
function championScoutObservation(db,t,p,cid){
  const unknown={value:25,known:false,range:[20,99],confidence:0,date:null,staleYears:0,sources:['숙련도 수치 미관측 · 공개 출전은 숙련도와 다름']},
    r=championScoutReport(db,t,p),s=r&&typeof r==='object'?r.championObservations?.[cid]:null;
  // Legacy counters and invalid/unattributed/future snapshots stay unknown.
  if(!observedMetaDate(db,{date:db.worldDate})||!s||s.observer!==championScoutObserver(db,t)||s.player!==p.id||s.champ!==cid||
    !['investigation','official'].includes(s.source)||typeof s.competition!=='string'||!s.competition||
    !observedMetaDate(db,s)||!observedMetaDate(db,{date:s.evidenceFrom})||!observedMetaDate(db,{date:s.evidenceTo})||
    s.evidenceFrom>s.evidenceTo||s.evidenceTo>s.date||!Number.isSafeInteger(s.appearances)||s.appearances<1||
    !Number.isFinite(s.estimate)||s.estimate<20||s.estimate>99||
    !Number.isFinite(s.uncertainty)||s.uncertainty<1||s.uncertainty>12||
    !Number.isFinite(s.knowledge)||s.knowledge<0||s.knowledge>98)return unknown;
  const staleYears=Math.max(0,(Date.parse(db.worldDate)-Date.parse(s.date))/(365*86400000)),
    width=Math.ceil(s.uncertainty+staleYears*1.25),range=[Math.max(20,s.estimate-width),Math.min(99,s.estimate+width)],
    confidence=Math.round(clamp(s.knowledge-staleYears*8,0,98));
  return {value:s.estimate,known:true,range,confidence,date:s.date,staleYears,
    sources:[(s.source==='official'?'공식 경기 관찰':'스카우팅 조사')+' · '+s.date,
      '챔피언별 저장 추정 · 실제 숙련 확정값 아님',...(staleYears>=1?['오래된 관찰 · 오차 범위 확대']:[])]};
}
