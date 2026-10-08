// Initial recruitment presentation: observed filtering, paging and source detail.
// No recruitment, contracts or scouting mutation is owned here.
const INITIAL_CANDIDATE_PAGE_SIZE=25;
const INITIAL_CANDIDATE_SORTS={ability:'종합 기량 추정',name:'선수 이름',role:'포지션',region:'출신 지역',age:'나이',potential:'잠재력 추정',reputation:'명성',salary:'요구 연봉'};
function initialCandidateUiState(){return {impact:null,comparison:initialComparisonState(),role:'ALL',scope:'region',target:null,q:'',minimum:0,sort:'ability',direction:'desc',page:0,selected:[],columns:['age','ability','potential','salary'],secondary:[],detail:null,returnY:0}}
function initialCandidateView(db){const view=Object.create(db);view.scout=JSON.parse(JSON.stringify(db.scout||{}));view.world={...db.world,recruitment:JSON.parse(JSON.stringify(db.world?.recruitment||{})),negotiations:JSON.parse(JSON.stringify(db.world?.negotiations||{}))};view._marketDemandCache={...(db._marketDemandCache||{})};return view}
let INITIAL_CANDIDATE_CONTEXT=null;
function initialCandidateContext(db){
  const slot=typeof SLOT==='undefined'?null:SLOT;
  if(!INITIAL_CANDIDATE_CONTEXT||INITIAL_CANDIDATE_CONTEXT.db!==db||INITIAL_CANDIDATE_CONTEXT.slot!==slot||INITIAL_CANDIDATE_CONTEXT.world!==db.world||INITIAL_CANDIDATE_CONTEXT.owner!==managedTeamId(db)){
    INITMK=initialCandidateUiState();INITIAL_CANDIDATE_CONTEXT={db,slot,world:db.world,owner:managedTeamId(db)};
  }
}
function initialCandidateAllowed(db,target,p=null){return db.world?.phase==='initial_roster'&&!db.world.fired&&!managedTeam(db)?.parent&&setupTeamsForManager(db).some(t=>t===target)&&(!p||db.players[p.id]===p&&!p.retired&&!p.team)}
function initialCandidatePage(db,state,target){
  const allowed=initialCandidateAllowed(db,target);
  if(!allowed)return {allowed:false,rows:[],total:0,pages:0,page:0,view:null};
  const view=initialCandidateView(db),query=String(state.q||'').trim().toLocaleLowerCase('ko'),minimum=clamp(Number(state.minimum)||0,0,99),key=INITIAL_CANDIDATE_SORTS[state.sort]?state.sort:'ability',direction=state.direction==='asc'?1:-1;
  const rows=Object.values(db.players).filter(p=>!p.retired&&!p.team&&(state.role==='ALL'||p.role===state.role)&&(state.scope==='all'||(state.scope==='overseas'?p.region!==target.region:p.region===target.region))&&(!query||p.name.toLocaleLowerCase('ko').includes(query))).map(p=>({p,ability:obsOvr(view,p)})).filter(x=>minimum===0||Number.isFinite(x.ability)&&x.ability>=minimum);
  const orders=initialCandidateOrders(state),valued=rows.map(x=>({...x,value:initialCandidateSortValue(view,x,key,target)}));
  valued.sort((a,b)=>{for(const order of orders){const av=initialCandidateSortValue(view,a,order.key,target),bv=initialCandidateSortValue(view,b,order.key,target),missing=x=>typeof x!=='string'&&!Number.isFinite(x);if(missing(av)||missing(bv)){const cmp=Number(missing(av))-Number(missing(bv));if(cmp)return cmp;continue}const cmp=typeof av==='string'?av.localeCompare(bv,'ko'):av-bv;if(cmp)return (order.direction==='asc'?1:-1)*cmp}return a.p.id.localeCompare(b.p.id)});
  const pages=Math.ceil(valued.length/INITIAL_CANDIDATE_PAGE_SIZE),page=Math.max(0,Math.min(Math.floor(Number(state.page)||0),Math.max(0,pages-1)));
  return {allowed:true,rows:valued.slice(page*INITIAL_CANDIDATE_PAGE_SIZE,(page+1)*INITIAL_CANDIDATE_PAGE_SIZE),total:valued.length,pages,page,view};
}
function initialObservedRange(range){return range.every(Number.isFinite)?range.join('–'):'정보 부족'}
function initialCandidateControls(page){return initialCandidateTableControls(page)}
function initialCandidateDetail(page){
  if(!INITMK.detail)return '';
  if(!page.allowed)return '';
  const p=DB.players[INITMK.detail];
  if(!p||!initialCandidateAllowed(DB,DB.teams[INITMK.target],p))return '<p class="empty">이 선수는 더 이상 FA 후보가 아닙니다. 목록에서 현재 상태를 확인하세요.</p><button class="ghost" id="init-detail-close">후보 목록으로 돌아가기</button>';
  const r=scoutReport(page.view,p),metrics=observedPlayerCoreMetrics(page.view,p),labels=INITIAL_COMPARE_METRICS;
  return `<section id="init-candidate-detail" tabindex="-1" aria-labelledby="init-detail-title"><h3 id="init-detail-title">${esc(p.name)} · ${ROLE_KO[p.role]} · ${p.age}세</h3><button class="ghost sm2" id="init-detail-close">후보 목록으로 돌아가기</button><div class="fin"><div><span>기량 추정</span><b>${initialObservedRange(r.ability)}</b><small>종합 추정치 ${Number.isFinite(obsOvr(page.view,p))?obsOvr(page.view,p):'정보 부족'}</small></div><div><span>잠재 추정</span><b>${initialObservedRange(r.potential)}</b></div><div><span>확보한 정보</span><b>${r.knowledge}%</b><small>관찰 ${r.observations}회 · ${esc(r.lastSeenDate||'관찰 날짜 없음')}</small></div><div><span>현재 공개 경기 표본</span><b>${r.sample.g}경기</b><small>${r.sample.g?'실제 기록된 공식 경기':'공식 경기 기록이 없습니다.'}</small></div></div><h4>관측 기반 능력 지표</h4><p class="hint">${r.sample.g?'공식 기록과 기존 관측 평가를 함께 확인하세요.':'초기 평가 추정치이며 실제 경기 통계가 아닙니다.'} 아래 값은 기존 관측 평가에서 계산한 지표이며 잠재력·비공개 챔피언 숙련도와 다릅니다.</p><div class="scroll"><table><thead><tr><th>지표</th><th>현재 추정치 (1–99)</th></tr></thead><tbody>${Object.entries(labels).map(([k,v])=>`<tr><td>${v}</td><td class="num">${Number.isFinite(metrics[k])?metrics[k]:'정보 없음'}</td></tr>`).join('')}</tbody></table></div><h4>공개적으로 확인된 챔피언</h4>${r.champions.length?`<p>${r.champions.map(c=>`${esc(championLabel(page.view,c.id))} · ${c.g}경기 · ${esc(c.from)}–${esc(c.to)}`).join(' / ')}</p>`:'<p class="empty">공개 경기에서 확인된 챔피언 기록이 없습니다. 비공개 숙련도는 보여주지 않습니다.</p>'}${initialCandidateActions(page.view,p,DB.teams[INITMK.target])}<p class="hint">초기 지역 평가와 저장된 관측 보고서 · 공개 경기 출전 기록을 사용합니다. 현재 역할 ${ROLE_KO[p.role]}의 관측 지표이며 정보량은 정확도 보장이 아닙니다. 표본이 없는 것은 낮은 실력과 다릅니다. 열람은 관찰·계약을 자동 실행하지 않습니다.</p></section>`;
}
function bindInitialCandidateExplorer(){
  const db=DB,world=DB.world,target=INITMK.target;const current=()=>DB===db&&DB.world===world&&INITMK.target===target&&initialCandidateAllowed(DB,DB.teams[target]);
  const refresh=id=>{const open=document.getElementById('init-table-options')?.open,left=document.querySelector('.candidate-table')?.scrollLeft;navKeepScroll();const options=document.getElementById('init-table-options'),table=document.querySelector('.candidate-table');if(options)options.open=!!open;if(table)table.scrollLeft=left||0;document.getElementById(id)?.focus({preventScroll:true})};
  for(const [id,key] of [['init-query','q'],['init-minimum','minimum'],['init-sort','sort'],['init-direction','direction'],['init-role','role'],['init-scope','scope'],['init-target','target']]){
    const el=document.getElementById(id);if(!el)continue;
    const apply=()=>{if(!current())return;if(el.reportValidity&&!el.reportValidity())return;INITMK[key]=key==='minimum'?Number(el.value)||0:el.value;INITMK.page=0;if(key==='target'){INITMK.selected=[];INITMK.detail=null;INITMK.comparison=initialComparisonState()}refresh(id)};
    el.onchange=apply;if(id==='init-query')el.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();apply()}};
  }
  bindInitialCandidateTable(current,refresh);
  const reset=document.getElementById('init-filter-reset');if(reset)reset.onclick=()=>{if(!current())return;const target=INITMK.target;INITMK=initialCandidateUiState();INITMK.target=target;refresh('init-filter-reset')};
  for(const [id,delta] of [['init-prev',-1],['init-next',1]]){const el=document.getElementById(id);if(el)el.onclick=()=>{if(!current())return;INITMK.page+=delta;refresh(delta>0?'init-prev':'init-next')}}
  document.querySelectorAll('[data-init-detail]').forEach(b=>b.onclick=()=>{if(!current())return;const p=DB.players[b.dataset.initDetail];if(!p||!initialCandidateAllowed(DB,DB.teams[INITMK.target],p))return;INITMK.returnY=window.scrollY;INITMK.detail=p.id;navKeepScroll();requestAnimationFrame(()=>{if(current()){const detail=document.getElementById('init-candidate-detail');detail?.focus();detail?.scrollIntoView({block:'start'})}})});
  const close=document.getElementById('init-detail-close');if(close)close.onclick=()=>{if(!current())return;const id=INITMK.detail,y=INITMK.returnY;INITMK.detail=null;navKeepScroll();const b=[...document.querySelectorAll('[data-init-detail]')].find(x=>x.dataset.initDetail===id);(b||document.getElementById('init-result-count'))?.focus({preventScroll:true});requestAnimationFrame(()=>{if(current())window.scrollTo(0,y)})};
}
