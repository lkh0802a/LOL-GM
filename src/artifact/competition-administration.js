// Official administrative outcomes reuse the scheduled match/history writers.
function isDoubleDisqualification(rec){return rec?.administrative?.kind==='double_disqualification';}
function assertDoubleDisqualification(rec){
  const identity=rec?.administrative?.identity;
  if(!identity?.players||!identity.champions||Object.keys(identity.players).length||Object.keys(identity.champions).length||typeof rec.reason!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(rec.administrative.date))throw Error('양측 실격 공시 원본이 손상되었습니다.');
  if(!isDoubleDisqualification(rec)||rec.winner!==null||rec.score!==null||!rec.forfeit||!rec.doubleForfeit||!Array.isArray(rec.games)||rec.games.length||rec.a===rec.b||![rec.a,rec.b].every(id=>typeof id==='string'&&rec.administrative.identity?.teams?.[id]?.name)||!rec.administrative.identity?.competition?.id)throw Error('양측 실격 경기 원본이 손상되었습니다.');
}
function assertScheduledDisqualification(db,s,m,series){
  const rec=series.rec;assertDoubleDisqualification(rec);
  const view=officialMatchView(db,s,m.a,m.b);
  if(series.lines.length||rec.a!==m.a||rec.b!==m.b||rec.bestOf!==m.bo||rec.administrative.identity.competition.id!==s.comp||!officialDisqualificationFinal(db,s,m)||m.clockGame||m.clockSession||[m.a,m.b].some(id=>medicalAvailable(view,view.teams[id])>=5))throw Error('현재 공식 결승의 양측 실격 조건과 다릅니다.');
}
function assertStoredDisqualification(s,day,m){
  const rec=m.res;assertDoubleDisqualification(rec);const cfg=s.formatSnapshot?.stages?.at(-1),rd=cfg&&s.stageData?.[cfg.id]?.rounds?.at(-1);
  if(day!==s.days.at(-1)||day.stage!==cfg?.id||day.matches.length!==1||rec.a!==m.a||rec.b!==m.b||rec.bestOf!==m.bo||rec.administrative.identity.competition.id!==s.comp||rd?.pairs?.length!==1||!(cfg.type==='single_elim'&&rd.name==='결승'||cfg.type==='double_elim'&&rd.br==='GF'))throw Error('저장된 양측 실격 결과가 당시 공식 결승과 다릅니다.');
}
function officialDisqualificationFinal(db,s,m){
  const comp=db.competitions[s.comp],day=s.days[s.cur],cfg=comp?.stages.find(c=>c.id===day?.stage),sd=cfg&&s.stageData[cfg.id];
  return !!(cfg&&comp.stages.at(-1)===cfg&&day.matches.length===1&&day.matches[0].id===m.id&&
    (cfg.type==='single_elim'&&sd.alive.length===2||cfg.type==='double_elim'&&sd.gf&&sd.rounds.at(-1)?.br==='GF'));
}
function finishDisqualifiedFinal(db,s,day,cfgIdx){
  const m=day.matches.find(m=>isDoubleDisqualification(m.res));if(!m)return false;
  assertDoubleDisqualification(m.res);
  // Consume this day without adding an invented match loss to earlier rounds.
  const cfg=db.competitions[s.comp].stages[cfgIdx],sd=s.stageData[cfg.id];
  if(cfgIdx!==db.competitions[s.comp].stages.length-1||!['single_elim','double_elim'].includes(cfg.type)||day.matches.length!==1)throw Error('결승이 아닌 양측 실격 결과는 승계 절차가 필요합니다.');
  s.cur++;
  sd.alive=[];
  if(cfg.type==='double_elim'){sd.ub=[];sd.lb=[];sd.drop=[];}
  finishStage(db,s,cfgIdx,day.matches.at(-1).localDate||day.date);return true;
}
function disqualifiedFinalResult(s){const m=s.days.at(-1)?.matches?.find(m=>isDoubleDisqualification(m.res));return m?.res||null;}
function administrativeCompetitionHistory(s){const rec=disqualifiedFinalResult(s);return rec?{completionReason:'double_disqualification',reason:rec.reason}:{};}
function seasonAdministrativeDisqualifications(s){const rec=disqualifiedFinalResult(s);return new Set(rec?[rec.a,rec.b]:[]);}
function administrativeElimReach(s,tid){
  if(!seasonAdministrativeDisqualifications(s).has(tid))return null;
  const stage=s.formatSnapshot?.stages?.at(-1)?.id;
  return s.days.filter(d=>d.stage===stage).some(d=>d.matches.some(m=>m.res&&!isDoubleDisqualification(m.res)&&[m.a,m.b].includes(tid)))?2:0;
}
function administrativeTournamentPlacements(db,s){
  const view=historicalSeasonView(db,s);if(!view||!disqualifiedFinalResult(s))return [];
  const comp=view.competitions[s.comp],cfg=comp.stages.at(-1),sd=s.stageData[cfg.id],excluded=seasonAdministrativeDisqualifications(s),exits=new Map();
  const order=['round_robin','swiss','league_phase'].includes(comp.stages[0].type)?standings(view,s,comp.stages[0].id).map(r=>r.tid):sd.seeds;
  for(const [index,rd] of sd.rounds.entries()){
    if(cfg.type==='double_elim'&&!['L','LX','GF'].includes(rd.br))continue;
    for(const day of s.days.filter(d=>d.stage===cfg.id&&d.label===rd.label))for(const m of day.matches)if(m.res&&!isDoubleDisqualification(m.res))exits.set(m.res.winner===m.a?m.b:m.a,index);
  }
  return [...new Set([...sd.seeds,...order])].filter(t=>!excluded.has(t)).sort((a,b)=>(exits.get(b)??-1)-(exits.get(a)??-1)||order.indexOf(a)-order.indexOf(b));
}
// Only the new no-game final outcome needs this additional transactional path.
// Keep normal games and established single-sided forfeits on their old writer.
const officialPlayDayBeforeDisqualification=playDay;
playDay=function(db,s,opt={}){
  const day=s&&!s.done&&s.days[s.cur];
  if(!day||day.matches.length!==1||day.matches[0].res||day.matches[0].clockGame||day.matches[0].clockSession)return officialPlayDayBeforeDisqualification(db,s,opt);
  const outcome=scheduledRegistrationForfeit(db,s,day.matches[0]);
  if(!isDoubleDisqualification(outcome?.rec))return officialPlayDayBeforeDisqualification(db,s,opt);
  const undo=pendingOfficialUndo(db);try{return officialPlayDayBeforeDisqualification(db,s,opt);}catch(error){undo();throw error;}
};
function pendingDisqualifiedFinalSeries(db,refs,q){
  if(q.inflight||q.contact||q.session?.games?.length||refs.m.clockGame||refs.m.clockSession)return null;
  const series=scheduledRegistrationForfeit(db,refs.s,refs.m);if(!isDoubleDisqualification(series?.rec))return null;
  return series;
}
function resolvePendingDisqualifiedFinal(db,refs,q){
  const series=pendingDisqualifiedFinalSeries(db,refs,q);if(!series)return null;
  const undo=pendingOfficialUndo(db);try{
  const w=db.world,p=w.pendingOfficial;commitScheduledSeries(db,refs.s,refs.m,series);
  const finalized=finalizeCompetitionDay(db,refs.s,refs.day,refs.cfgIdx,refs.cfg);if(finalized)scoutFromDay(db,refs.s,refs.day);
  p.queue.shift();if(!p.queue.length){w.pendingOfficial=null;if(!activeSeasons(db).length)advanceStep(db);}
  return {done:true,score:null,rec:series.rec,lines:[],finalized,pending:w.pendingOfficial,msg:series.rec.reason};
  }catch(error){undo();throw error;}
}
