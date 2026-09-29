// ===== LOL GM: World setup / manager team selection UI =====
function normalizeManagerTeamSelection(){
  const all=managerSelectableTeams(DB);
  let team=isManagerSelectableTeam(DB,SSET.team)?DB.teams[SSET.team]:all[0];
  let rid=SSET.region&&DB.regions[SSET.region]&&managerSelectableTeams(DB,SSET.region).length?SSET.region:(team&&team.region)||(all[0]&&all[0].region);
  const divs=[1,2].filter(d=>managerSelectableTeams(DB,rid,d).length);
  let div=+SSET.division;
  if(!divs.includes(div))div=team&&team.region===rid&&divs.includes(team.division||1)?(team.division||1):divs[0];
  const teams=managerSelectableTeams(DB,rid,div);
  if(!teams.some(t=>t.id===SSET.team))SSET.team=(teams[0]||all[0]||{}).id||null;
  SSET.region=rid||null;SSET.division=div||1;
  return {rid:SSET.region,div:SSET.division,team:SSET.team,teams,divs,region:DB.regions[SSET.region]};
}
function managerTeamPicker(disabled=false){
  const st=normalizeManagerTeamSelection(),team=st.team&&DB.teams[st.team];
  const regions=Object.values(DB.regions).filter(r=>managerSelectableTeams(DB,r.id).length);
  const pay=team?payroll(DB,team):0,budget=team?initialSalaryBudget(DB,team):0;
  const recent=team&&team.goalLog&&team.goalLog.length?team.goalLog.slice(-1)[0]:'첫 시즌 · 공식 기록 없음';
  const recentText=typeof recent==='string'?recent:(recent.year+' · '+(recent.ok?'목표 달성':'목표 미달'));
  return `<div class="cfgcard compact"><div class="cfghead"><b>감독할 구단 선택</b><span class="hint">지역 → 리그 → 디비전 → 팀</span></div><div class="controls">
    <label>지역<select id="steam-region"${disabled?' disabled':''}>${regions.map(r=>`<option value="${r.id}"${r.id===st.rid?' selected':''}>${esc(r.name)}</option>`).join('')}</select></label>
    <label>리그<span class="static-field">${st.region?esc(st.region.leagueName):'—'}</span></label>
    <label>디비전<select id="steam-division"${disabled?' disabled':''}>${st.divs.map(d=>`<option value="${d}"${d===st.div?' selected':''}>${d===1?'1부':esc(divName(st.region))}</option>`).join('')}</select></label>
    <label>팀<select id="steam"${disabled?' disabled':''}>${st.teams.map(t=>`<option value="${t.id}"${t.id===st.team?' selected':''}>${esc(t.name)}</option>`).join('')}</select></label>
  </div>${team?`<div class="fin">
    <div><span>재정</span><b>${money(team.finance.cash)}</b><small>초기 연봉 예산 ${money(budget)} · 현재 ${money(pay)}</small></div>
    <div><span>선수단</span><b>${(team.roster||[]).length}명</b><small>첫 시즌은 전 구단 0명에서 시작</small></div>
    <div><span>시설</span><b>${Math.round(avg(Object.values(ensureFacilities(team)))*10)/10} / 5</b><small>4종 인프라 평균</small></div>
    <div><span>명성</span><b>${team.reputation??'—'}</b><small>초기 상태에서 파생</small></div>
    <div><span>최근 성적</span><b>${esc(recentText)}</b></div>
    <div><span>구단 목표</span><b>${esc(initialGoalLabel(team))}</b></div>
    <div><span>승강</span><b>${esc(promotionStatus(DB,team))}</b></div>
  </div>`:''}
  <p class="hint">첫 시즌은 모든 구단이 백지 로스터로 시작합니다. 팀을 고른 뒤 전 세계 FA 풀에서 예산과 등록 규정에 맞춰 직접 선수단을 구성합니다.</p>
  <p class="hint">가상 프로씬 공용어가 정착된 세계이므로 국적에 따른 언어 장벽은 없습니다. 국적/출신지역은 신인 생성·스카우팅 정체성에 사용되고, 공식 등록의 비로컬 판정은 별도 활성 로컬 자격을 사용합니다.</p>
  <p class="hint">Academy/Challengers 등 모구단 소속 2군은 감독 시작 팀으로 선택할 수 없습니다.</p></div>`;
}
function bindManagerTeamPicker(){
  const r=$('#steam-region'),d=$('#steam-division'),t=$('#steam');
  if(r)r.onchange=e=>{SSET.region=e.target.value;SSET.division=null;SSET.team=null;normalizeManagerTeamSelection();nav()};
  if(d)d.onchange=e=>{SSET.division=+e.target.value;SSET.team=null;normalizeManagerTeamSelection();nav()};
  if(t)t.onchange=e=>{SSET.team=e.target.value;nav()};
}

// ----- 세계 만들기 (커리어 시작 전에만) -----
const SEL_KO={splits:{1:'단일 시즌',2:'2스플릿',3:'3스플릿'},standingsMode:SPLIT_STANDINGS_MODES,legs:{1:'싱글',2:'더블'},regularBo:{3:'Bo3',5:'Bo5'},playoffTake:{4:'4팀',6:'6팀',8:'8팀'},playoffBo:{3:'Bo3',5:'Bo5'},system:{franchise:'프랜차이즈',relegation:'승강제',mixed:'혼합 (상위 절반 보호)'},slots:{1:'1장',2:'2장',3:'3장',4:'4장',5:'5장'},relegate:{1:'1팀',2:'2팀'},div2:{0:'없음',1:'있음'},div2Teams:{4:'4팀',6:'6팀',8:'8팀',10:'10팀'}};
const ISEL_KO={timing:{early:'윈터 이후',mid:'스프링 이후',end:'서머 이후'},entry:{champions:'직전 스플릿 우승팀',slots:'지역별 진출권',next:'상위 대회 진출권 다음 순위 팀',div2:'하부 리그 상위 팀'},format:INTL_FORMATS,bo:{3:'Bo3',5:'Bo5'}};
function sel(path,val,opts){return `<select data-cfg="${path}">${Object.entries(opts).map(([k,l])=>`<option value="${k}"${String(val)===k?' selected':''}>${l}</option>`).join('')}</select>`}
function regionCard(r,i){
  return `<div class="cfgcard compact"><div class="cfghead"><b>${esc(r.leagueName)} <small class="hint">${esc(r.name)}</small></b></div>
    <div class="controls">
      <label>스플릿 수${sel('r.'+i+'.splits',r.splits,SEL_KO.splits)}</label>
      <label>성적 집계 방식${sel('r.'+i+'.standingsMode',r.standingsMode||'independent',SEL_KO.standingsMode)}</label>
    </div>
    <p class="hint">${r.teams}팀 · ${fmtRegion(r)} · 월즈 ${r.slots}장</p></div>`;
}
function intlCard(it,i){
  return `<div class="cfgcard compact"><div class="cfghead"><b>${esc(it.name)}</b></div>
    <p class="hint">${it.tier==='low'?'중하위권 대회 · ':''}${it.zone?ZONE_KO[it.zone]+' · ':''}${ISEL_KO.timing[it.timing]} · ${ISEL_KO.entry[it.entry]||''} · ${INTL_FORMATS[it.format]||it.format}</p></div>`;
}
function seasonSetup(){
  const cfg=DB.worldConfig, dirty=DB.configDirty;
  return `<section class="teamhead"><h2>세계 만들기</h2><p>LOL GM은 고정된 글로벌 프로 생태계에서 시작합니다. 리그와 국제대회는 새 게임에서 임의로 추가·삭제하지 않으며, 이후 구조 변화는 게임 내 사무국과 세계 변화 시스템이 처리합니다.</p></section>
  <section><h3>리그 구조</h3><p class="hint">스플릿 기간과 성적 집계는 각 리그에서 따로 선택합니다. 독립: 매 스플릿 순위 초기화 · 전적 누적: 정규 시즌 승패를 다음 기간으로 승계 · 포인트 누적: 각 스플릿 승패는 초기화하고 플레이오프 최종 성적 점수를 연간 합산합니다. 국제대회 직전 우승팀 자격은 어느 방식이든 해당 스플릿 챔피언에게 있습니다.</p><div class="cfgs">${cfg.regions.map(regionCard).join('')}</div></section>
  <section><h3>국제대회</h3><div class="cfgs">${cfg.internationals.map(intlCard).join('')}</div><p class="hint">퍼스트 스탠드 · MSI · 월드 챔피언십과 권역별 마스터즈/챌린저급 국제대회가 세계 일정에 포함됩니다.</p></section>
  <section><h3>세계 변화와 운영</h3><div class="controls">
    <label>세계 변화 빈도${sel('g.changes',cfg.changes,{none:'없음',low:'낮음',normal:'보통',high:'높음'})}</label>
    <label>내 팀 운영${sel('g.manage',cfg.manage||'manual',{manual:'직접 (계약·영입)',ai:'AI 위임'})}</label>
  </div></section>
  <section class="controls"><button class="primary" id="regen">이 설정으로 세계 생성</button><button class="ghost" id="cfgdef">기본 설정으로</button>
    <span id="cfgmsg" class="${dirty?'warn':'hint'}" role="status">${dirty?'설정이 바뀌었습니다. 세계를 다시 생성해야 반영됩니다.':'현재 세계가 설정과 일치합니다.'}</span></section>
  <section><h3>생성된 세계</h3>${worldTable()}</section>
  <section><h3>팀 선택</h3>${managerTeamPicker(dirty)}<div class="controls"><button class="primary" id="sstart"${dirty?' disabled':''}>이 팀으로 로스터 구성 시작</button></div></section>
  ${DB.history.length?`<section><h3>역대 기록</h3>${histTable()}</section>`:''}`;
}
// 시즌/세계/진행 UI는 ui-season.js에 분리되어 있다.
