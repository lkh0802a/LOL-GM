// Shared observed-only initial candidate comparison; no world-state writer.
const INITIAL_COMPARE_METRICS={laning:'라인전',skirmish:'소규모 교전',teamfight:'한타',survival:'생존',vision:'시야',objective:'목표물 준비',macro:'운영',decision:'판단',stability:'안정성',adaptability:'적응력'};
function initialComparisonState(){return {ids:[],open:false,patch:'ALL',comp:'ALL',from:'',returnY:0}}
function initialComparisonToggle(db,state,pid){
 const p=db.players[pid];if(!p||!initialCandidateAllowed(db,db.teams[state.target],p))return '비교 가능한 FA가 아닙니다';
 const c=state.comparison||(state.comparison=initialComparisonState());
 if(c.ids.includes(pid)){c.ids=c.ids.filter(id=>id!==pid);return '비교 제외'}
 if(c.ids.length>=3)return '비교는 최대 3명입니다';
 c.ids.push(pid);return '비교 추가';
}
function initialComparisonSources(db,p,context){
 const rows=metaRowsFiltered(db,{player:p.id,...(context.patch!=='ALL'?{patch:context.patch}:{}),...(context.comp!=='ALL'?{comp:context.comp}:{}),...(context.from?{from:context.from}:{})}),valid=[];let excluded=0;
 for(const row of rows){const hits=(row.sides||[]).flatMap(side=>(side.picks||[]).filter(x=>x&&typeof x==='object'&&x.player===p.id).map(pick=>({side,pick})));
  if(!observedMetaDate(db,row)||hits.length!==1||!ROLES.includes(hits[0].pick.role)||typeof hits[0].pick.champ!=='string'||!hits[0].pick.champ){excluded++;continue}
  const {side,pick}=hits[0];valid.push({date:row.date,patch:row.patch||null,comp:row.comp||null,stage:row.stage||null,role:pick.role,champ:pick.champ,color:metaSideColor(row,side),win:typeof side.win==='boolean'?side.win:null});
 }
 return {rows:valid,excluded};
}
function initialComparisonModel(db,state){
 const target=db.teams[state.target],c=state.comparison||initialComparisonState();
 if(!initialCandidateAllowed(db,target))return {allowed:false,rows:[],context:c};
 const view=initialCandidateView(db),rows=[...new Set(c.ids)].slice(0,3).map(id=>{const p=db.players[id];if(!p)return {id,name:id,status:'선수 정보 없음'};
  if(!initialCandidateAllowed(db,target,p))return {id,name:p.name,status:p.retired?'은퇴한 선수':p.team?'이미 소속된 선수':'영입 권한 없음'};
  return {id,name:p.name,p,report:scoutReport(view,p),metrics:observedPlayerCoreMetrics(view,p),attrs:observedPlayerAttributes(view,p),sources:initialComparisonSources(db,p,c)};
 });return {allowed:true,rows,view,context:c,date:db.worldDate};
}
