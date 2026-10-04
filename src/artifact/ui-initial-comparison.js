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
function initialComparisonSourceDetails(db,row){
 const s=row.sources;if(!s)return '';
 return `<details id="init-compare-source-${esc(row.id)}"><summary>${esc(row.name)} 공개 자료 ${s.rows.length}건 · 제외 ${s.excluded}건</summary><p class="hint">공개 출전 행입니다. 날짜·역할·귀속 불명 제외. 게임 ID 미보관: 독립 경기 중복 제거·외부 프로 검증 자료가 아닙니다.</p>${s.rows.length?`<div class="scroll"><table><thead><tr><th>날짜</th><th>대회·단계</th><th>패치</th><th>역할·진영</th><th>챔피언·결과</th></tr></thead><tbody>${s.rows.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(db.competitions[x.comp]?.name||x.comp||'대회 미상')} · ${esc(x.stage||'단계 미상')}</td><td>${esc(x.patch||'패치 미상')}</td><td>${ROLE_KO[x.role]} · ${x.color==='BLUE'?'블루':x.color==='RED'?'레드':'진영 미상'}</td><td>${esc(championLabel(db,x.champ))} · ${x.win===null?'결과 미상':x.win?'승':'패'}</td></tr>`).join('')}</tbody></table></div>`:'<p>같은 조건의 공개 출전 기록이 없습니다.</p>'}</details>`;
}
function initialComparisonPanel(db,state){
 const model=initialComparisonModel(db,state),c=model.context;if(!model.allowed||!c.open)return '';
 const rows=model.rows,visible=metaRowsFiltered(db).filter(r=>observedMetaDate(db,r)),facets={patches:[...new Set(visible.map(r=>r.patch).filter(Boolean))].sort(),comps:[...new Set(visible.map(r=>r.comp).filter(Boolean))].sort()},cell=fn=>rows.map(row=>`<td>${row.p?fn(row):esc(row.status)}</td>`).join(''),num=v=>Number.isFinite(v)?v:'정보 없음';
 return `<section id="init-candidate-comparison" tabindex="-1" aria-labelledby="init-compare-title"><h3 id="init-compare-title">후보 비교 · ${rows.length}/3명</h3><button class="ghost" id="init-compare-close">후보 목록으로 돌아가기</button><p>조회 ${esc(model.date)} · 대상 ${esc(db.teams[state.target].name)} · 관찰 날짜는 선수별 상이.</p><div class="controls"><label>패치<select id="init-compare-patch"><option value="ALL">전체 패치</option>${facets.patches.map(x=>`<option value="${esc(x)}"${c.patch===x?' selected':''}>${esc(x)}</option>`).join('')}</select></label><label>대회<select id="init-compare-comp"><option value="ALL">전체 대회</option>${facets.comps.map(x=>`<option value="${esc(x)}"${c.comp===x?' selected':''}>${esc(db.competitions[x]?.name||x)}</option>`).join('')}</select></label><label>시작일<input type="date" id="init-compare-from" max="${esc(model.date)}" value="${esc(c.from)}"></label></div><p class="hint">공개 표본에 같은 조건을 적용합니다. 현재 능력은 과거 값이 아닙니다. 표본 없음은 낮은 실력이 아닙니다. 서로 다른 역할·겹친 추정 범위로 우열을 단정하지 않습니다.</p>${rows.length<2?'<p class="empty">목록 또는 상세에서 두 명 이상을 비교에 추가하세요.</p>':''}<div class="scroll"><table><thead><tr><th>항목</th>${rows.map(row=>`<th scope="col">${esc(row.name)}<br><button class="ghost sm2" data-init-compare="${esc(row.id)}">비교 제외</button></th>`).join('')}</tr></thead><tbody><tr><th scope="row">역할 · 나이 · 출신</th>${cell(row=>`${ROLE_KO[row.p.role]} · ${row.p.age}세 · ${esc(db.regions[row.p.region]?.name||row.p.region)}<br>요구 연봉 ${money(asking(model.view,row.p,db.teams[state.target].region))}`)}</tr><tr><th scope="row">기량 추정 범위 · 잠재 범위</th>${cell(row=>initialObservedRange(row.report.ability)+' · '+initialObservedRange(row.report.potential))}</tr><tr><th scope="row">정보 · 관찰 날짜</th>${cell(row=>`${row.report.knowledge}% · ${row.report.observations}회 · ${esc(row.report.lastSeenDate||'관찰 날짜 없음')} · 오래된 보고서 ${row.report.staleYears}년`)}</tr><tr><th scope="row">역할 핵심 관측값 (1–99)</th>${cell(row=>(ROLE_KEY_ATTRS[row.p.role]||[]).map(k=>`${esc(ATTR_KO[k]||TEND_KO[k]||k)} ${Object.hasOwn(row.attrs,k)?num(row.attrs[k]):'능력 축 없음'}`).join(' · '))}</tr>${Object.entries(INITIAL_COMPARE_METRICS).map(([key,label])=>`<tr><th scope="row">${label} 추정 (1–99)</th>${cell(row=>num(row.metrics[key]))}</tr>`).join('')}<tr><th scope="row">같은 조건의 공개 표본</th>${cell(row=>`${row.sources.rows.length}건 · 제외 ${row.sources.excluded}건 <button class="linklike" data-init-compare-source="${esc(row.id)}">원자료</button>`)}</tr><tr><th scope="row">영입 절차</th>${cell(row=>initialCandidateActions(model.view,row.p,db.teams[state.target],false))}</tr></tbody></table></div>${rows.some(x=>x.p)?initialComparisonRadar(rows):''}${rows.map(row=>initialComparisonSourceDetails(db,row)).join('')}</section>`;
}
function bindInitialComparison(current){
 const c=INITMK.comparison||(INITMK.comparison=initialComparisonState()),refresh=id=>{navKeepScroll();requestAnimationFrame(()=>{if(current())document.getElementById(id)?.focus({preventScroll:true})})};
 document.querySelectorAll('[data-init-compare]').forEach(b=>b.onclick=()=>{if(!current())return;const id=b.dataset.initCompare;if(c.ids.includes(id)){c.ids=c.ids.filter(x=>x!==id);MSG='비교 제외'}else MSG=initialComparisonToggle(DB,INITMK,id);refresh(c.open?'init-candidate-comparison':'init-compare-open')});
 document.querySelectorAll('[data-init-compare-source]').forEach(b=>b.onclick=()=>{if(!current())return;const el=document.getElementById('init-compare-source-'+b.dataset.initCompareSource);if(el){el.open=true;el.querySelector('summary')?.focus();el.scrollIntoView({block:'start'})}});
 const open=document.getElementById('init-compare-open');if(open)open.onclick=()=>{if(!current())return;c.returnY=window.scrollY;c.open=true;navKeepScroll();requestAnimationFrame(()=>{if(current()){const el=document.getElementById('init-candidate-comparison');el?.focus();el?.scrollIntoView({block:'start'})}})};
 const close=document.getElementById('init-compare-close');if(close)close.onclick=()=>{if(!current())return;c.open=false;navKeepScroll();requestAnimationFrame(()=>{if(current()){document.getElementById('init-compare-open')?.focus({preventScroll:true});window.scrollTo(0,c.returnY)}})};
 for(const [id,key] of [['init-compare-patch','patch'],['init-compare-comp','comp'],['init-compare-from','from']]){const el=document.getElementById(id);if(el)el.onchange=()=>{if(!current()||el.reportValidity&&!el.reportValidity())return;c[key]=el.value;refresh(id)}}
}
