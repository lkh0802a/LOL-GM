// Analysis-room presentation. Evidence and authority remain engine-owned;
// the screen keeps only transient filters and calls existing reports.
function analysisControlledTeams(db){
  return db.world?.fired?[]:activeTeams(db).filter(t=>managerControlsSquad(db,t));
}
function analysisSelectedTeam(db){
  const teams=analysisControlledTeams(db);
  return teams.find(t=>t.id===ANALYSIS_SET.team)||teams.find(t=>t.id===managedTeamId(db))||teams[0]||null;
}
function analysisFilter(db,team){
  const today=db.worldDate,validDate=/^\d{4}-\d{2}-\d{2}$/.test(today||''),
    period=['30','90'].includes(ANALYSIS_SET.period)?Number(ANALYSIS_SET.period):null;
  return {team:team?.id,patch:ANALYSIS_SET.patch==='CURRENT'?db.patch.id:
    ANALYSIS_SET.patch==='ALL'?undefined:ANALYSIS_SET.patch,
    position:ROLES.includes(ANALYSIS_SET.position)?ANALYSIS_SET.position:undefined,
    from:validDate&&period?addDays(today,-period):undefined,
    to:validDate&&period?today:undefined};
}
function analysisPatchChoices(db,team){
  // Public official facets plus the selected authorized squad's own practice.
  const patches=new Set(metaHistoryFacets(db).patches);
  for(const row of team.practiceEvidence||[])if(typeof row.patch==='string')patches.add(row.patch);
  return [...patches].sort();
}
function viewAnalysis(){
  const team=analysisSelectedTeam(DB),teams=analysisControlledTeams(DB);
  const header='<section><h2>분석실</h2><p class="hint">우리 팀의 관측 기록과 상대의 공개 자료를 확인합니다. 표본이 없는 정보는 추정값으로 채우지 않습니다.</p></section>';
  if(!team)return header+'<section><h3>분석할 관리 구단이 없습니다</h3><p>커리어를 시작하거나 새 구단에 취임하면 해당 구단의 분석을 이용할 수 있습니다.</p><button class="ghost" type="button" data-analysis-open="season">시즌 화면으로</button></section>';
  const filter=analysisFilter(DB,team),patches=analysisPatchChoices(DB,team),
    option=(value,label,selected)=>`<option value="${esc(value)}"${selected?' selected':''}>${esc(label)}</option>`,
    mode=ANALYSIS_SET.mode==='opponent'?'opponent':'own';
  const controls=`<section aria-label="분석 조건"><div class="seg tabs">
    <button type="button" data-analysis-mode="own" aria-pressed="${mode==='own'}">우리 팀</button>
    <button type="button" data-analysis-mode="opponent" aria-pressed="${mode==='opponent'}">상대 준비</button></div>
    <div class="controls analysis-controls"><label>관찰 구단<select id="analysis-team">${teams.map(t=>option(t.id,t.name,t.id===team.id)).join('')}</select></label>
    <label>기간<select id="analysis-period">${[['30','최근 30일'],['90','최근 90일'],['ALL','전체 기록']].map(([v,l])=>option(v,l,ANALYSIS_SET.period===v)).join('')}</select></label>
    <label>패치<select id="analysis-patch">${option('CURRENT','현재 패치 · '+DB.patch.id,ANALYSIS_SET.patch==='CURRENT')}${option('ALL','전체 패치',ANALYSIS_SET.patch==='ALL')}${patches.map(p=>option(p,p,ANALYSIS_SET.patch===p)).join('')}${!['CURRENT','ALL',...patches].includes(ANALYSIS_SET.patch)?option(ANALYSIS_SET.patch,ANALYSIS_SET.patch+' · 기록 없음',true):''}</select></label>
    <label>기록 역할<select id="analysis-position">${option('ALL','전체',ANALYSIS_SET.position==='ALL')}${ROLES.map(r=>option(r,ROLE_KO[r],ANALYSIS_SET.position===r)).join('')}</select></label></div>
    <p class="hint">${esc(team.name)} · ${filter.from?esc(filter.from)+' ~ '+esc(filter.to):'전체 기간'} · ${filter.patch?esc(filter.patch):'여러 패치 포함'}. 역할 조건은 기록된 출전에 적용합니다. 공개 원자료는 분석가가 없어도 확인할 수 있습니다.</p></section>`;
  const reports=mode==='opponent'?patchOpponentReport(DB,ANALYSIS_SET,filter):
    patchPracticeComparisonCard(DB,filter)+patchOwnTacticCard(DB,filter)+patchAnalystCard(DB,filter);
  const links='<section aria-label="관련 운영 화면"><h3>관련 화면</h3><div class="controls analysis-controls"><button class="ghost" type="button" data-analysis-open="squad">선수단·훈련·전술</button><button class="ghost" type="button" data-analysis-open="season">일정·경기 기록</button><button class="ghost" type="button" data-analysis-open="patch">패치·메타 자료</button></div><p class="hint">분석은 기록의 비교입니다. 승률만으로 원인을 단정하거나 설정을 자동 적용하지 않습니다.</p></section>';
  return '<div class="analysis-room">'+header+controls+reports+links+'</div>';
}
function analysisRefresh(){
  const active=document.activeElement,id=active?.id,mode=active?.dataset?.analysisMode;
  navKeepScroll();
  const replacement=id?$('#'+id):['own','opponent'].includes(mode)?document.querySelector('[data-analysis-mode="'+mode+'"]'):null;
  replacement?.focus?.({preventScroll:true});
}
function bindAnalysis(){
  document.querySelectorAll('[data-analysis-mode]').forEach(button=>button.onclick=()=>{
    if(!['own','opponent'].includes(button.dataset.analysisMode))return;
    ANALYSIS_SET.mode=button.dataset.analysisMode;analysisRefresh();
  });
  for(const [id,key] of [['analysis-team','team'],['analysis-period','period'],['analysis-patch','patch'],['analysis-position','position'],['pprepteam','prepTeam']]){
    const node=$('#'+id);if(!node)continue;
    node.onchange=e=>{ANALYSIS_SET[key]=e.target.value;analysisRefresh()};
  }
  document.querySelectorAll('[data-analysis-open]').forEach(button=>button.onclick=()=>{
    const view=button.dataset.analysisOpen;
    if(!['squad','season','patch'].includes(view))return;
    if(view==='squad')SQUAD=analysisSelectedTeam(DB)?.id||null;
    navigateTo(view);
  });
}
