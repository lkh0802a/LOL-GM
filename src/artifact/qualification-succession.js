// A first domestic knockout round inherits the completed regular-season order.
// Planning is read-only: official callers commit before preparing a new game.
function qualificationSuccessionPlan(db,s,m){
  if(!officialRegistrationEnabled(db)||s.done||m.res||m.actualStart||m.clockGame||m.clockSession||s.qualificationSuccessions?.some(e=>e.matchId===m.id)||officialDisqualificationFinal(db,s,m))return null;
  const comp=db.competitions[s.comp],day=s.days[s.cur],index=comp.stages.findIndex(c=>c.id===day?.stage),cfg=comp.stages[index],sd=s.stageData[cfg?.id];
  if(!day.matches.includes(m)||comp.international||comp.stages.length!==2||index!==1||!['single_elim','double_elim'].includes(cfg?.type)||cfg.fixedBracket||sd?.seeds.length<=2||sd?.round!==1||sd.rounds.length!==1)return null;
  if(cfg.type==='double_elim'&&(sd.gf||sd.rounds[0].br!=='U'||sd.lb.length||sd.drop.length))return null;
  if(!sd.rounds[0].pairs.some(p=>p[0]===m.a&&p[1]===m.b))return null;
  const source=comp.stages[0],sourceData=s.stageData[source.id];
  if(source.type!=='round_robin'||source.groups>1||(cfg.from&&cfg.from!==source.id)||!sourceData||s.days.filter(d=>d.stage===source.id).some(d=>d.matches.some(x=>!x.res)))return null;
  const available=id=>medicalAvailable(db,{roster:officialSeasonRoster(db,db.teams[id],s).filter(pid=>officialPlayerCanRepresent(db,db.players[pid],db.teams[id]))})>=5;
  const eligible=id=>{const team=db.teams[id];return !!team&&team.active!==false&&team.region===comp.region&&(team.division||1)===(comp.div||1)&&available(id);};
  if([m.a,m.b].some(available))return null;
  const order=standings(db,s,source.id).map(r=>r.tid),excluded=new Set([...(s.qualificationSuccessions||[]).flatMap(e=>e.from),...sd.seeds]);
  const to=order.filter(id=>!excluded.has(id)&&eligible(id)).slice(0,2);
  if(to.length!==2)return null;
  return {kind:'qualification_succession',matchId:m.id,stage:cfg.id,sourceStage:source.id,from:[m.a,m.b],to,sourceOrder:order};
}
function pendingQualificationSuccession(db,refs,q){
  if(q.inflight||q.contact||q.session?.games?.length)return null;
  return qualificationSuccessionPlan(db,refs.s,refs.m);
}
function resolvePendingQualificationSuccession(db,refs,q,forcedDraft){
  const plan=pendingQualificationSuccession(db,refs,q);if(!plan)return null;
  if(forcedDraft!=null)throw Error('실격된 구단의 준비 입력으로 차순위 구단의 경기를 진행할 수 없습니다.');
  const undo=pendingOfficialUndo(db);try{
    const event=commitQualificationSuccession(db,refs.s,refs.m,plan);if(!Reflect.deleteProperty(q,'session'))throw Error('이전 경기 준비를 안전하게 해제할 수 없습니다.');
    return {done:false,score:null,succession:event,pending:db.world.pendingOfficial};
  }catch(error){undo();throw error;}
}
function qualificationTournamentPlacements(db,s){
  const read=historicalSeasonView(db,s);if(!read)return [];
  const excluded=seasonAdministrativeDisqualifications(s),stage=read.competitions[s.comp].stages[0].id;
  return [...new Set([s.champion,s.runnerUp,...standings(read,s,stage).map(r=>r.tid)])].filter(id=>id&&!excluded.has(id));
}
function qualificationCompetitionHistory(s){return s.qualificationSuccessions?.length?{qualificationSuccessions:JSON.parse(JSON.stringify(s.qualificationSuccessions))}:{};}
function assertStoredQualificationSuccessions(s){
  if(s.qualificationSuccessions===undefined)return;
  const events=s.qualificationSuccessions,comp=s.formatSnapshot,source=comp?.stages?.[0],cfg=comp?.stages?.[1],sd=s.stageData?.[cfg?.id];
  if(!Array.isArray(events)||!source||comp.international||comp.stages.length!==2||source.type!=='round_robin'||source.groups>1||!['single_elim','double_elim'].includes(cfg?.type)||!sd||sd.seeds.length<=2||(cfg.type==='double_elim'&&sd.rounds[0]?.br!=='U')||events.length>comp.teams.length||new Set(events.map(e=>e?.matchId)).size!==events.length)throw Error('차순위 승계 이력이 손상되었습니다.');
  for(const e of events){
    const day=s.days.find(d=>d.matches.some(m=>m.id===e?.matchId)),m=day?.matches.find(m=>m.id===e.matchId),ids=[...(e?.from||[]),...(e?.to||[])],order=e?.sourceOrder;
    if(e?.kind!=='qualification_succession'||e.stage!==cfg.id||e.sourceStage!==source.id||!Array.isArray(e.from)||e.from.length!==2||!Array.isArray(e.to)||e.to.length!==2||new Set(ids).size!==4||!Array.isArray(order)||order.length!==comp.teams.length||new Set(order).size!==order.length||order.some(id=>!comp.teams.includes(id))||e.from.some(id=>order.indexOf(id)<0||order.indexOf(id)>=cfg.take)||e.to.some(id=>order.indexOf(id)<cfg.take)||day?.stage!==cfg.id||m?.a!==e.to[0]||m?.b!==e.to[1]||!sd.rounds[0]?.pairs.some(p=>p[0]===e.to[0]&&p[1]===e.to[1])||e.from.some(id=>sd.seeds.includes(id))||e.to.some(id=>!sd.seeds.includes(id))||e.identity?.competition?.id!==s.comp||ids.some(id=>!e.identity?.teams?.[id]?.name)||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||typeof e.reason!=='string')throw Error('차순위 승계의 당시 경기·순위·구단 원본이 손상되었습니다.');
  }
}
function commitQualificationSuccession(db,s,m,plan){
  const current=qualificationSuccessionPlan(db,s,m);
  if(!current||JSON.stringify(current)!==JSON.stringify(plan))throw Error('차순위 승계의 순위·출전 자격·경기 상태가 바뀌었습니다.');
  const undo=pendingOfficialUndo(db);try{
    const sd=s.stageData[plan.stage],replace=id=>{const i=plan.from.indexOf(id);return i<0?id:plan.to[i];};
    const identity=emptyRecordedIdentity(),comp=db.competitions[s.comp];identity.competition={id:comp.id,name:comp.name};
    for(const id of [...plan.from,...plan.to]){const t=db.teams[id];identity.teams[id]={name:t.name,short:t.short||t.name,region:t.region,regionName:db.regions[t.region]?.name||null};}
    (s.qualificationSuccessions||(s.qualificationSuccessions=[])).push({...plan,date:db.worldDate,reason:'양 팀 실격으로 정규시즌 차순위 적격 구단이 경기 자리를 승계',identity});
    sd.seeds=sd.seeds.map(replace);for(const field of ['alive','ub'])if(Array.isArray(sd[field]))sd[field]=sd[field].map(replace);sd.rounds[0].pairs=sd.rounds[0].pairs.map(pair=>pair.map(replace));
    [m.a,m.b]=plan.to;
    return s.qualificationSuccessions.at(-1);
  }catch(error){undo();throw error;}
}
