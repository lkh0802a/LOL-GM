// Two evidence scopes; screen code never owns ranking weights or game writes.
function analysisTiersPanel(db,team,filter){
  const internal=ANALYSIS_SET.tierView==='internal',compare=ANALYSIS_SET.tierView==='compare',role=filter.position||null,
    query=String(ANALYSIS_SET.tierQ||'').trim().toLowerCase(),
    tabs=`<div class="seg tabs"><button type="button" data-analysis-tier="public" aria-pressed="${!internal&&!compare}">대중 티어</button><button type="button" data-analysis-tier="internal" aria-pressed="${internal}">팀 내부 티어</button><button type="button" data-analysis-tier="compare" aria-pressed="${compare}">나란히 비교</button></div>`,
    search=`<div class="controls"><label>챔피언 검색<input id="analysis-tier-search" value="${esc(ANALYSIS_SET.tierQ||'')}" placeholder="챔피언 이름"></label></div>`,
    name=id=>championLabel(db,id),matches=row=>!query||name(row.champ).toLowerCase().includes(query),
    champion=row=>`<button type="button" class="linklike" data-analysis-champion="${esc(row.champ)}">${esc(name(row.champ))}</button>`;
  if(compare)return analysisTierComparisonPanel(db,team,filter,{tabs,search,query,role,champion});
  if(!internal){
    const report=publicChampionTiers(db,filter,role),rows=report.rows.filter(matches),visible=rows.slice(0,40);
    return `<section id="analysis-tiers"><h3>밴픽·메타</h3>${tabs}${search}<p>${esc(report.source)} · 공식 경기 ${report.sample}전 · 규칙 패치 ${esc(report.patch)}</p><p class="hint">대중 티어에는 구단의 비공개 훈련·숙련·전술을 사용하지 않습니다. 역할은 현재 챔피언 설정의 후보군을 좁힙니다. 픽·밴은 경기 전체 기록이며 밴을 특정 역할에 귀속하지 않습니다.</p>${report.observed&&report.sample<10?'<p>공식 표본이 10전 미만입니다. 현재 관측 빈도 등급을 안정적인 강함으로 단정하지 마세요.</p>':''}${!report.observed?'<p>조건에 맞는 대회 표본이 없어 기존 패치 예상 순위를 표시합니다. 대회 성적이나 검증된 승률 예측이 아닙니다.</p>':''}<div class="scroll"><table><thead><tr><th>티어</th><th>챔피언</th><th>역할</th><th>픽</th><th>밴</th><th>밴픽률</th><th>승률</th></tr></thead><tbody>${visible.map(row=>`<tr><td>${esc(row.tier)}</td><td>${champion(row)}</td><td>${row.roles.map(r=>esc(ROLE_KO[r])).join('/')}</td><td>${row.picks}</td><td>${row.bans}</td><td>${Math.round(row.presence*100)}%</td><td>${row.winRate===null?'표본 없음':Math.round(row.winRate*100)+'%'}</td></tr>`).join('')}</tbody></table></div>${!rows.length?'<p>검색·역할 조건에 맞는 챔피언이 없습니다.</p>':''}<p class="hint">${rows.length}명 중 ${visible.length}명 표시 · 날짜 미확인·미도래 제외 ${report.excluded}건. 자료 출처는 게임 내 공식 기록과 공개 패치 규칙입니다. 외부 대회 보정 자료 수집은 아직 검증되지 않았습니다.</p></section>`;
  }
  const report=internalChampionTiers(db,{team:team.id,role,patch:filter.patch}),
    reasons={'no-authority':'현재 구단의 내부 자료를 조회할 권한이 없습니다.','historical-state-unavailable':'과거 패치 당시의 내부 상태를 복원한 티어가 없습니다. 현재 패치를 선택해 주세요.','unverified-current-evidence':'현재 패치의 날짜 미확인 기록을 먼저 검토해야 합니다.','no-valid-lineup':'평가할 유효한 주전 배치가 없습니다. 선수단 화면에서 배치를 확인하세요.'};
  if(report.reason)return `<section id="analysis-tiers"><h3>밴픽·메타</h3>${tabs}<p>${reasons[report.reason]}</p></section>`;
  const rows=report.rows.filter(matches),visible=rows.slice(0,40),point=n=>(n*100).toFixed(1);
  return `<section id="analysis-tiers"><h3>밴픽·메타</h3>${tabs}${search}<p>${esc(team.name)} 내부 준비도 · ${esc(report.patch)} · ${esc(report.date)}</p><p class="hint">현재 확정 주전·숙련 기록·구단 연구·분석 지원·전술을 실제 밴픽 평가로 비교합니다. 등급은 후보 간 상대 순위이며 점수는 밴픽 효용 × 100입니다. 승리 확률이 아닙니다. 상대 픽·현재 조합·Fearless 제외·시리즈 경험은 이 사전 표에 반영하지 않습니다.</p>${report.missingRoles.length?'<p>유효 배치 없음: '+report.missingRoles.map(r=>esc(ROLE_KO[r])).join(' · ')+'</p>':''}<div class="scroll"><table><thead><tr><th>순위·티어</th><th>챔피언</th><th>준비 선수·역할</th><th>숙련</th><th>평가 점수</th><th>근거</th></tr></thead><tbody>${visible.map(row=>{const fit=row.best,f=fit.factors;return `<tr><td>${row.rank} · ${row.tier}</td><td>${champion(row)}</td><td><button type="button" class="linklike" data-analysis-player="${esc(fit.player)}">${esc(db.players[fit.player].name)}</button> · ${esc(ROLE_KO[fit.role])}</td><td>${fit.trained?Math.round(fit.mastery):'미훈련 · 기본 평가값 '+fit.mastery}</td><td>${point(fit.score)}</td><td><details><summary>평가 근거</summary><p>메타 ${point(f.meta)} · 숙련 ${point(f.mastery)} · 조합·전술 ${point(f.comp)} · 유연성 ${point(f.flex)}</p><p>${row.meta.sources.map(esc).join(' · ')}</p><small>현재 패치 공개 표본 ${row.meta.globalSample}건 / 지역 ${row.meta.regionalSample}건 · 구단 연구 ${row.meta.teamStudy}. 연습 기록은 기존 구단 준비·연구 경로를 통해 평가에 연결됩니다. 연습 승률을 별도 보너스로 더하지 않습니다.</small></details></td></tr>`}).join('')}</tbody></table></div>${!rows.length?'<p>검색 조건에 맞는 챔피언이 없습니다.</p>':''}<p class="hint">${rows.length}명 중 ${visible.length}명 표시 · 현재 평가에 기간 필터를 과거 상태로 적용하지 않습니다. 공식·연습 표본을 비교하려면 우리 팀 보고서를 이용하세요.</p></section>`;
}
function bindAnalysisTiers(){
  document.querySelectorAll('[data-analysis-tier]').forEach(button=>button.onclick=()=>{
    if(!['public','internal','compare'].includes(button.dataset.analysisTier))return;
    ANALYSIS_SET.tierView=button.dataset.analysisTier;analysisRefresh();
  });
  bindAnalysisTierSources();
  const search=$('#analysis-tier-search');if(search)search.onchange=e=>{ANALYSIS_SET.tierQ=e.target.value;analysisRefresh()};
  document.querySelectorAll('[data-analysis-champion]').forEach(button=>button.onclick=()=>{
    const id=button.dataset.analysisChampion;if(!DB.patch.champions[id])return;
    PSET.champ=id;navigateTo('patch');
  });
  document.querySelectorAll('[data-analysis-player]').forEach(button=>button.onclick=()=>{
    const team=analysisSelectedTeam(DB),p=DB.players[button.dataset.analysisPlayer];
    if(!p||p.team!==team?.id||DB.world?.fired)return;
    SQUAD=team.id;OPEN_P=p.id;navigateTo('squad');
  });
}
