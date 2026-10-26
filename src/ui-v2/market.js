function v2DisplaySalaryBudget(db,t){return db.world?.phase==='initial_roster'?initialSalaryBudget(db,t):salaryBudget(db,t)}
function v2Target(){if(!V2.db||V2.db.world?.fired)return null;if(V2.db.world.phase!=='initial_roster')return v2Team();const teams=setupTeamsForManager(V2.db);return teams.find(t=>t.id===V2.target)||teams[0]||null;}
function v2OrganizationContext(){
 const db=V2.db;if(db.world.fired||db.world.phase!=='initial_roster')return '';const teams=setupTeamsForManager(db),current=v2Target();if(teams.length<2)return '';
 return `<section class="panel"><div class="panel-heading"><strong>구성할 선수단</strong></div><p class="hint">구성할 선수단을 선택하고 선수를 검토하세요. 계약은 조건 합의 후 직접 확정합니다.</p><div class="stack">${teams.map(t=>{const lim=initialSquadLimits(db,t);return `<button class="btn ${current?.id===t.id?'btn-primary':'btn-outline'}" data-squad-context="${v2Esc(t.id)}" aria-pressed="${current?.id===t.id}">${v2Esc(t.name)} · ${t.roster.length}명 / 최소 ${lim.min}명</button>`}).join('')}</div></section>`;
}
function v2ChooseSquad(id){
 const error=v2ManualError();if(error)return v2Tell(error);if(V2.db.world.phase!=='initial_roster'||!setupTeamsForManager(V2.db).some(t=>t.id===id))return v2Tell('현재 구성할 수 있는 선수단이 아닙니다');
 v2CaptureDrafts();V2.target=id;V2.review=null;V2.managementReview=null;V2.pid=null;V2.page=0;V2.returnScroll=0;v2Save();v2Tell('구성할 선수단 · '+v2Target().name);v2Render();
}
function v2Candidates(){
 const db=V2.db,t=v2Target(),view=v2ReadView(),query=V2.q.trim().toLocaleLowerCase('ko'),targets=db.world?.recruitment?.targets||{};
 const rows=Object.values(db.players).filter(p=>!p.retired&&(db.world.phase!=='initial_roster'||!p.team)&&(V2.role==='ALL'||p.role===V2.role)&&(!query||p.name.toLocaleLowerCase('ko').includes(query))&&(V2.tab!=='관심 선수'||targets[p.id]));
 rows.sort((a,b)=>a.name.localeCompare(b.name,'ko')||a.id.localeCompare(b.id));
 const pages=Math.max(1,Math.ceil(rows.length/V2_LIST_PAGE_SIZE));V2.page=Math.max(0,Math.min(V2.page,pages-1));return {view,rows:rows.slice(V2.page*V2_LIST_PAGE_SIZE,(V2.page+1)*V2_LIST_PAGE_SIZE),total:rows.length,pages};
}
function v2PlayerCard(p,view){
 const watched=!!view.world.recruitment?.targets?.[p.id],range=scoutAbilityRange(view,p);
 return `<article class="player-list-row"><button class="player-list-open" data-player="${v2Esc(p.id)}"><span class="player-avatar">${v2Esc(ROLE_KO[p.role])}</span><span class="grow"><strong>${v2Esc(p.name)}</strong><span class="player-meta">${p.age}세 · ${v2Esc(view.teams[p.team]?.name||'무소속')} · 기량 ${range.every(Number.isFinite)?range.join('–'):'정보 부족'}</span></span><span aria-hidden="true">›</span></button><button class="icon-button favorite ${watched?'on':''}" data-watch="${v2Esc(p.id)}" aria-pressed="${watched}" aria-label="${v2Esc(p.name)} 관심 ${watched?'해제':'등록'}">${v2Icon('star')}</button></article>`;
}
function v2Market(){
 const db=V2.db,t=v2Target();if(!t)return '<section class="panel empty">관리 구단이 없습니다.</section>';
 const comparison=v2CandidateComparisonContext(),candidateTab=['선수 검색','관심 선수'].includes(V2.tab);
 if(candidateTab&&comparison?.comparison.open)return v2InitialComparisonPanel(comparison);
 const comparisonBar=candidateTab?v2InitialComparisonBar(comparison):'';
 if(V2.pid)return comparisonBar+v2PlayerDetail();
 if(V2.tab==='진행 중인 협상')return v2NegotiationList();
 if(V2.tab==='시장 현황')return `<section class="panel"><div class="panel-heading"><strong>${db.world.phase==='initial_roster'?'첫 시즌 선수단 구성':'선수 영입·계약'}</strong></div><p class="section-lead">선수를 직접 검토하고 조건을 제안하세요. 조건 합의 뒤에도 최종 계약은 감독이 직접 확정합니다.</p><div class="statline"><span>현재 선수단</span><strong>${t.roster.length}명</strong></div><div class="statline"><span>연간 연봉 예산</span><strong>${v2Money(v2DisplaySalaryBudget(db,t))}</strong></div><div class="statline"><span>현재 연봉 합계 · 연간</span><strong>${v2Money(payroll(db,t))}</strong></div><div class="tag-flex"><button class="btn btn-primary" data-tab="선수 검색">선수 찾아보기</button><button class="btn btn-outline" data-tab="진행 중인 협상">협상 확인</button></div></section>`;
 const m=v2Candidates();
 return comparisonBar+`<section class="stack"><div class="search-wrap"><span class="search-icon">${v2Icon('search')}</span><input class="input" id="player-search" type="search" autocomplete="off" placeholder="선수 이름·닉네임 검색" aria-label="선수 검색" value="${v2Esc(V2.q)}"></div><div class="filter-row" aria-label="포지션 선택">${['ALL',...ROLES].map(r=>`<button class="chip ${V2.role===r?'selected':''}" aria-pressed="${V2.role===r}" data-role="${r}">${r==='ALL'?'전체':ROLE_KO[r]}</button>`).join('')}</div><div class="between small subtle"><span role="status">${m.total}명 · ${V2.page+1}/${m.pages}페이지</span></div>${m.rows.map(p=>v2PlayerCard(p,m.view)).join('')||'<div class="panel empty">조건에 맞는 선수가 없습니다.</div>'}<div class="between"><button class="btn btn-outline" data-page="-1"${!V2.page?' disabled':''}>이전</button><button class="btn btn-outline" data-page="1"${V2.page+1>=m.pages?' disabled':''}>다음</button></div></section>`;
}
function v2PlayerDetail(){
 const db=V2.db,p=db.players[V2.pid],t=v2Target();if(!p||p.retired)return '<section class="panel empty">현재 선수 정보를 확인할 수 없습니다.</section>';
 const view=v2ReadView(),range=scoutAbilityRange(view,p),potential=scoutPotentialRange(view,p),entry=view.world?.recruitment?.targets?.[p.id],checked=entry?.evaluation?.teamId===t?.id,eligible=t?v2PlayerEntryCheck(p,t):{ok:false,reason:'관리 선수단을 확인하세요'},n=Object.values(db.world?.negotiations||{}).find(n=>n.pid===p.id&&n.teamId===t?.id&&n.status==='open');
 return `<section class="panel" data-player-detail><button class="btn btn-outline btn-small" id="player-back">${V2.initialComparison?.detailReturn?'← 비교로 돌아가기':'← 목록으로'}</button><div class="content-head"><div><div class="eyebrow">선수 상세</div><h2>${v2Esc(p.name)}</h2><p class="small subtle">${v2Esc(ROLE_KO[p.role])} · ${p.age}세 · ${v2Esc(db.teams[p.team]?.name||'무소속')}</p></div><button class="icon-button favorite ${entry?'on':''}" data-watch="${p.id}" aria-pressed="${!!entry}" aria-label="관심 ${entry?'해제':'등록'}">${v2Icon('star')}</button></div><div class="detail-grid"><div class="stat"><span class="label">기량 추정</span><strong>${range.every(Number.isFinite)?range.join('–'):'정보 부족'}</strong></div><div class="stat"><span class="label">잠재력 추정</span><strong>${potential.every(Number.isFinite)?potential.join('–'):'정보 부족'}</strong></div></div><hr class="divider">${checked&&Number.isFinite(entry?.evaluation?.medicalRiskPct)?`<p class="hint">내부 평가 당시 계약 가용성 위험 ${entry.evaluation.medicalRiskPct}% · 부상 발생 확률이 아닙니다.</p>`:''}<p class="hint">관측한 정보로 표시합니다. 추정 범위는 실제 능력 확정값이 아닙니다. 현재 정보량 ${knowledge(view,p)}%.</p><div class="stack">${v2InitialComparisonButton(p)}<button class="btn btn-outline" id="scout-player">관찰 보고서 요청 · ${v2Money(.1*psOf(db,v2Team().region))}</button><button class="btn btn-outline" id="evaluate-player"${!entry||knowledge(view,p)<35?' disabled':''}>대상 선수단 내부 평가${checked?' · 완료':''}</button><button class="btn btn-primary" id="negotiate-player"${!checked||!eligible.ok?' disabled':''}>${n?'진행 중인 협상 확인':'계약 조건 제안'}</button></div>${!eligible.ok?`<p class="hint">${v2Esc(eligible.reason)}</p>`:''}<p class="hint">관심 등록 → 관찰 정보 확인 → 내부 평가 → 조건 제안 순서로 진행합니다.</p>${v2PlayerObservationReport(view,p,t)}</section>`+v2PlayerTransactions(p);
}
function v2RecruitAction(action){if(v2Team()?.parent)return v2Tell('산하 선수단의 영입 계약은 모구단이 담당합니다');return v2Mutate(action);}
function v2BindMarket(){
 v2BindInitialComparison();
 const current=v2Guard(),search=document.getElementById('player-search');
 document.querySelectorAll('[data-player-observation]').forEach(el=>el.ontoggle=()=>{if(!current()||!el.isConnected)return;V2.playerReport={db:V2.db,manager:V2.db.manager,owner:managedTeamId(V2.db),target:v2Target()?.id,pid:V2.pid,open:el.open};});
 if(search)search.oninput=()=>{if(!current())return;V2.q=search.value;V2.page=0;const start=search.selectionStart;v2Render();const next=document.getElementById('player-search');next?.focus({preventScroll:true});if(start!==null)next?.setSelectionRange(start,start)};
 v2Bind('[data-role]',el=>{V2.role=el.dataset.role;V2.page=0;v2Render()});
 v2Bind('[data-page]',el=>{V2.page+=Number(el.dataset.page);v2Render();window.scrollTo(0,0)});
 v2Bind('[data-player]',el=>v2Navigate(V2.section,V2.tab,el.dataset.player));
 v2Bind('#player-back',()=>{const c=v2CandidateComparisonContext();v2Navigate(V2.section,V2.tab,null,null,c?.detailReturn?'panel':null);});
 v2Bind('[data-squad-context]',el=>v2ChooseSquad(el.dataset.squadContext));
 v2Bind('[data-watch]',el=>v2RecruitAction(()=>{const id=el.dataset.watch;return V2.db.world?.recruitment?.targets?.[id]?mDropInterest(V2.db,id):mInterest(V2.db,id,'B')}));
 v2Bind('#scout-player',()=>v2RecruitAction(()=>scoutPlayers(V2.db,[V2.pid],40,.1*psOf(V2.db,v2Team().region))));
 v2Bind('#evaluate-player',()=>v2RecruitAction(()=>mEvaluateTarget(V2.db,V2.pid,v2Target().id)));
 v2Bind('#negotiate-player',()=>v2StartPlayerNegotiation());
}

function v2PlayerEntryCheck(p,t=v2Target()){
 if(V2.db.world.phase==='initial_roster')return initialSignCheck(V2.db,p,t);
 const error=v2ManualError()||(!t||t.active===false||t.parent?'현재 선수 계약은 활성 모구단에서 직접 검토하세요':!p||p.retired?'현재 협상 대상이 아닙니다':null);
 const reason=error||(p.team&&p.team!==t.id?permanentTransferWindowError(V2.db,p,t)||contractedMoveError(V2.db,p):null);return {ok:!reason,reason};
}
function v2StartPlayerNegotiation(){
 const db=V2.db,p=db.players[V2.pid],t=v2Target(),allowed=v2PlayerEntryCheck(p,t);if(!allowed.ok)return v2Tell(allowed.reason);
 if(v2Team()?.parent)return v2Tell('산하 선수단의 영입 계약은 모구단이 담당합니다');
 if(p.team===t.id)return v2StartRenewal(p.id);
 const kind=db.world.phase==='initial_roster'?'initial':p.team?'transfer':'fa',id=negotiationId(db,p.id,kind,kind==='initial'?t.id:null),undo=pendingOfficialUndo(db);
 try{const out=kind==='initial'?initialStartNegotiation(db,p.id,t.id):startNegotiation(db,p.id,kind);if(!out.ok){undo();return v2Tell(out.msg);}v2Save();v2OpenNegotiation(out.neg?.id||id);}catch(error){undo();v2Tell(error.message);}
}

// Comparison selection is transient UI state, scoped to the current owner and squad.
function v2CandidateComparisonContext(){
 const db=V2.db,t=v2Target(),initial=db?.world?.phase==='initial_roster';
 const allowed=initial?initialCandidateAllowed(db,t):!!t&&!db.world.fired&&!['pick','initial_roster'].includes(db.world.phase);
 if(!db||!allowed){V2.initialComparison=null;return null;}
 if(V2.section!=='market')return null;
 const kind=initial?'initial':'shortlist',c=V2.initialComparison;
 if(!c||c.db!==db||c.world!==db.world||c.manager!==db.manager||c.owner!==managedTeamId(db)||c.target!==t.id||c.kind!==kind)
  V2.initialComparison={db,world:db.world,manager:db.manager,owner:managedTeamId(db),target:t.id,kind,detailReturn:false,comparison:initialComparisonState()};
 return V2.initialComparison;
}
function v2ComparisonCandidate(c,p){return c.kind==='initial'?initialCandidateAllowed(V2.db,V2.db.teams[c.target],p):!!p&&!p.retired&&!!recruitmentTarget(V2.db,p.id);}
function v2ToggleInitialComparison(pid){
 const c=v2CandidateComparisonContext();if(!c)return v2Tell('현재 후보를 다시 확인하세요.');
 if(c.comparison.ids.includes(pid)){c.comparison.ids=c.comparison.ids.filter(id=>id!==pid);v2Tell('비교 제외');}
 else if(c.kind==='initial')v2Tell(initialComparisonToggle(V2.db,c,pid));
 else if(!v2ComparisonCandidate(c,V2.db.players[pid]))v2Tell('현재 관심 후보가 아닙니다');
 else if(c.comparison.ids.length>=3)v2Tell('비교는 최대 3명입니다');
 else {c.comparison.ids.push(pid);v2Tell('비교 추가');}
 v2Render();
}
function v2InitialComparisonButton(p){
 const c=v2CandidateComparisonContext();if(!c)return '';
 const selected=c.comparison.ids.includes(p.id);if(!selected&&!v2ComparisonCandidate(c,p))return '';
 return `<button class="btn btn-outline" data-initial-compare-toggle="${v2Esc(p.id)}" aria-pressed="${selected}">${selected?'후보 비교에서 제외':'후보 비교에 추가'}</button>`;
}
function v2InitialComparisonBar(c){
 if(!c)return '';const ids=c.comparison.ids;
 return `<section class="panel"><h2>${c.kind==='initial'?'창단':'관심'} 후보 비교 · ${ids.length}/3명</h2><p class="hint">선수 상세에서 최대 3명을 골라 관측한 정보와 같은 조건의 공개 자료를 비교하세요.</p><div class="tag-flex">${ids.map(id=>`<button class="btn btn-outline btn-small" data-initial-compare-toggle="${v2Esc(id)}" aria-label="${v2Esc(V2.db.players[id]?.name||id)} 비교 제외">${v2Esc(V2.db.players[id]?.name||id)} · 제외</button>`).join('')}<button class="btn btn-primary" id="initial-compare-open"${ids.length<2?' disabled':''}>선택한 후보 비교</button></div></section>`;
}
function v2InitialComparisonPanel(c){
 const db=V2.db,read=c.kind==='shortlist'?scoutingReadView(db):null,m=read?{...shortlistComparisonModel({read},c.comparison),allowed:true,view:read,context:c.comparison}:initialComparisonModel(db,c);if(!m.allowed)return '<section class="panel">현재 후보 비교를 다시 확인하세요.</section>';
 const rows=m.rows,context=m.context,visible=c.kind==='initial'?metaRowsFiltered(db).filter(r=>observedMetaDate(db,r)):[],patches=m.patches||[...new Set(visible.map(r=>r.patch).filter(Boolean))].sort(),comps=m.comps||[...new Set(visible.map(r=>r.comp).filter(Boolean))].sort(),title=c.kind==='initial'?'창단':'관심';
 const num=v=>Number.isFinite(v)?v:'정보 부족',range=v=>Array.isArray(v)&&v.every(Number.isFinite)?v.join('–'):'정보 부족';
 const cell=fn=>rows.map(r=>`<td>${r.p?fn(r):v2Esc(r.status)}</td>`).join('');
 return `<section class="panel" data-initial-comparison><button class="btn btn-outline" id="initial-compare-close">← 후보 검토로 돌아가기</button><h2 tabindex="-1" id="initial-comparison-title">${title} 후보 비교 · ${rows.length}/3명</h2><p>${v2Esc(db.teams[c.target].name)} · 조회 ${v2Esc(m.date)}</p><p class="hint">서로 다른 역할·겹친 추정 범위로 우열을 단정하지 않습니다. 표본 없음은 낮은 실력이 아닙니다. 현재 관측 능력은 과거 경기 당시 능력이 아닙니다.</p><div class="search-controls"><label class="field">공개 표본 패치<select class="input" data-initial-compare-filter="patch"><option value="ALL">전체 패치</option>${context.patch!=='ALL'&&!patches.includes(context.patch)?`<option value="${v2Esc(context.patch)}" selected>${v2Esc(context.patch)} · 현재 표본 없음</option>`:''}${patches.map(x=>`<option value="${v2Esc(x)}"${context.patch===x?' selected':''}>${v2Esc(x)}</option>`).join('')}</select></label><label class="field">대회<select class="input" data-initial-compare-filter="comp"><option value="ALL">전체 대회</option>${context.comp!=='ALL'&&!comps.includes(context.comp)?`<option value="${v2Esc(context.comp)}" selected>${v2Esc(db.competitions[context.comp]?.name||context.comp)} · 현재 표본 없음</option>`:''}${comps.map(x=>`<option value="${v2Esc(x)}"${context.comp===x?' selected':''}>${v2Esc(db.competitions[x]?.name||x)}</option>`).join('')}</select></label><label class="field">시작일<input class="input" type="date" data-initial-compare-filter="from" max="${v2Esc(m.date)}" value="${v2Esc(context.from)}"></label></div>${rows.length<2?'<p role="status">두 명 이상을 골라 비교하세요.</p>':''}<div class="table-scroll" tabindex="0" role="region" aria-label="선택한 후보 관측 정보 비교"><table><thead><tr><th scope="col">항목</th>${rows.map(r=>`<th scope="col">${v2Esc(r.name)}<br><button class="btn btn-outline btn-small" data-initial-compare-toggle="${v2Esc(r.id)}">비교 제외</button>${r.p?`<button class="btn btn-outline btn-small" data-initial-compare-player="${v2Esc(r.id)}">선수 상세</button>`:''}</th>`).join('')}</tr></thead><tbody><tr><th scope="row">역할·나이·출신·현재 소속</th>${cell(r=>`${v2Esc(ROLE_KO[r.p.role])} · ${v2Esc(r.p.age)}세 · ${v2Esc(db.regions[r.p.region]?.name||r.p.region)} · ${v2Esc(m.view.teams[r.p.team]?.name||'무소속')}`)}</tr>${c.kind==='initial'?`<tr><th scope="row">요구 연봉 추정</th>${cell(r=>v2Money(asking(m.view,r.p,db.teams[c.target].region)))}</tr>`:''}<tr><th scope="row">기량·잠재 추정 범위</th>${cell(r=>range(r.report.ability)+' · '+range(r.report.potential))}</tr><tr><th scope="row">정보·관찰 날짜</th>${cell(r=>`${v2Esc(r.report.knowledge)}% · ${v2Esc(r.report.observations)}회 · ${v2Esc(r.report.lastSeenDate||'관찰 날짜 없음')} · ${v2Esc(r.report.staleYears)}시즌 전`)}</tr>${c.kind==='shortlist'?`<tr><th scope="row">공식 집계 (표본 필터와 별개)</th>${cell(r=>`${v2Esc(r.report.sample.g)}경기 · ${Number.isFinite(r.report.sample.rating)?'평점 '+r.report.sample.rating.toFixed(2):'평점 없음'} · ${r.report.sample.min>0?'분당 피해 '+Math.round(r.report.sample.dpm):'출전 시간 없음'}`)}</tr>`:''}<tr><th scope="row">역할 핵심 관측값</th>${cell(r=>(ROLE_KEY_ATTRS[r.p.role]||[]).map(k=>v2Esc(ATTR_KO[k]||TEND_KO[k]||k)+' '+(Object.hasOwn(r.attrs,k)?num(r.attrs[k]):'능력 축 없음')).join(' · '))}</tr>${Object.entries(INITIAL_COMPARE_METRICS).map(([key,label])=>`<tr><th scope="row">${v2Esc(label)} 추정</th>${cell(r=>num(r.metrics[key]))}</tr>`).join('')}<tr><th scope="row">같은 조건의 공개 표본</th>${cell(r=>r.sources.rows.length+'건 · 제외 '+r.sources.excluded+'건')}</tr></tbody></table></div>${v2ObservedComparisonRadar(rows)}<p class="hint">${c.kind==='initial'?'요구 연봉 추정은 확정된 협상 조건이 아닙니다.':'공식 집계는 표본 필터와 별개이며 과거 기록·현재 관측 능력을 다시 계산하지 않습니다. 영입 가격·수락·등록을 보장하지 않습니다.'} 공개 표본은 출전 행 수이며 독립 경기 수로 중복 제거한 값은 아닙니다.</p>${rows.filter(r=>r.sources).map(r=>`<details><summary>${v2Esc(r.name)} 공개 출전 자료 ${r.sources.rows.length}건</summary>${r.sources.rows.length?`<div class="table-scroll" tabindex="0" role="region" aria-label="${v2Esc(r.name)} 공개 출전 자료"><table><thead><tr><th scope="col">날짜</th><th scope="col">대회·단계</th><th scope="col">패치</th><th scope="col">역할·진영</th><th scope="col">챔피언·결과</th></tr></thead><tbody>${r.sources.rows.map(x=>`<tr><td>${v2Esc(x.date)}</td><td>${v2Esc(db.competitions[x.comp]?.name||x.comp||'대회 미상')} · ${v2Esc(x.stage||'단계 미상')}</td><td>${v2Esc(x.patch||'패치 미상')}</td><td>${v2Esc(ROLE_KO[x.role])} · ${x.color==='BLUE'?'블루':x.color==='RED'?'레드':'진영 미상'}</td><td>${v2Esc(championLabel(db,x.champ))} · ${x.win===null?'결과 미상':x.win?'승':'패'}</td></tr>`).join('')}</tbody></table></div>`:'<p>같은 조건의 공개 출전 기록이 없습니다.</p>'}</details>`).join('')}</section>`;
}
function v2ComparisonGuard(c){
 const db=V2.db,current=v2Guard(),stamp=c&&scoutingReadStamp(db),patch=db?.patch,history=db?.metaHistory,length=history?.length,tail=history?.at(-1);
 return ()=>current()&&!!c&&v2CandidateComparisonContext()===c&&db.patch===patch&&db.metaHistory===history&&history?.length===length&&history?.at(-1)===tail&&scoutingReadStamp(db)===stamp;
}
function v2BindInitialComparison(){
 const c=v2CandidateComparisonContext(),current=v2ComparisonGuard(c),bind=(selector,fn)=>v2Bind(selector,(el,e)=>{if(current())fn(el,e);});
 bind('[data-initial-compare-toggle]',el=>v2ToggleInitialComparison(el.dataset.initialCompareToggle));
 bind('#initial-compare-open',()=>{if(c.comparison.ids.length<2)return;v2RememberSearch();c.comparison.returnY=window.scrollY;c.comparison.open=true;c.detailReturn=false;v2Render();document.getElementById('initial-comparison-title')?.focus();window.scrollTo(0,0);});
 bind('#initial-compare-close',()=>{c.comparison.open=false;c.detailReturn=false;v2Render();const b=document.getElementById('initial-compare-open');(b&&!b.disabled?b:document.getElementById('app-title'))?.focus({preventScroll:true});window.scrollTo(0,c.comparison.returnY||0);});
 bind('[data-initial-compare-player]',el=>v2Navigate('market',V2.tab,el.dataset.initialComparePlayer,null,c.kind==='shortlist'?'detail':null));
 document.querySelectorAll('[data-initial-compare-filter]').forEach(el=>el.onchange=()=>{
  if(!current()||el.reportValidity&&!el.reportValidity())return;const key=el.dataset.initialCompareFilter,value=el.value;
  if(key==='from'&&value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||value>V2.db.worldDate||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value))return v2Tell('유효한 기준일 이전 날짜를 선택하세요');
  if(key!=='from'&&value!=='ALL'){const rows=c.kind==='shortlist'?shortlistComparisonModel({read:scoutingReadView(V2.db)},c.comparison)[key==='patch'?'patches':'comps']:metaRowsFiltered(V2.db).filter(r=>observedMetaDate(V2.db,r)).map(r=>r[key]);if(!rows.includes(value))return v2Tell('현재 공개 표본에 없는 조건입니다');}
  c.comparison[key]=value;v2Render();document.querySelector('[data-initial-compare-filter="'+key+'"]')?.focus({preventScroll:true});
 });
}

// This chart presents the same canonical observed axes as the numeric table.
function v2ObservedComparisonRadar(rows){
 const keys=Object.keys(INITIAL_COMPARE_METRICS),cx=150,cy=125,r=80,point=(i,v)=>{const a=-Math.PI/2+i*Math.PI*2/keys.length;return [cx+Math.cos(a)*r*v/99,cy+Math.sin(a)*r*v/99]},xy=p=>p.map(x=>x.toFixed(2)).join(',');
 const complete=rows.filter(row=>row.metrics&&keys.every(k=>Number.isFinite(row.metrics[k])&&row.metrics[k]>=1&&row.metrics[k]<=99));
 if(!complete.length)return '<p class="empty">완전한 관측 축이 없어 차트를 그리지 않습니다. 누락은 아래 숫자 표에서 확인하세요.</p>';
 return `<svg viewBox="0 0 300 260" width="300" style="display:block;max-width:100%;height:auto" role="img" aria-label="관측 능력 비교 레이더. 아래 숫자 표와 같은 열 가지 추정 지표입니다."><title>관측 능력 추정치 · 축 0–99 · 실제 경기 통계 아님</title><polygon points="${keys.map((_,i)=>xy(point(i,99))).join(' ')}" fill="none" stroke="currentColor" opacity=".35"/>${keys.map((k,i)=>{const p=point(i,99),label=point(i,118);return `<line x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}" stroke="currentColor" opacity=".25"/><text x="${label[0]}" y="${label[1]}" fill="currentColor" font-size="9" text-anchor="middle">${INITIAL_COMPARE_METRICS[k]}</text>`}).join('')}${complete.map(row=>{const i=rows.indexOf(row);return `<polygon points="${keys.map((k,n)=>xy(point(n,row.metrics[k]))).join(' ')}" fill="none" stroke="${['#258fd2','#ba7515','#9c62cd'][i]}" stroke-width="2" stroke-dasharray="${['none','6 3','2 3'][i]}"><title>${v2Esc(row.name)}</title></polygon>`}).join('')}</svg><p>${rows.map((row,i)=>`${v2Esc(row.name)} · ${['실선','긴 점선','짧은 점선'][i]}${!complete.includes(row)?' (축 누락으로 차트 제외)':''}`).join(' / ')}</p><p class="hint">숫자 표의 기존 1–99 추정치를 0–99 축에 그대로 표시합니다. 면적은 종합 순위·승률이 아니며 역할마다 지표의 의미가 다릅니다.</p>`;
}

// Preserve the initial-only entry contract while the new internal controller serves both views.
function v2InitialComparisonContext(){const c=v2CandidateComparisonContext();return c?.kind==='initial'?c:null;}

// Existing observation/public-history readers own every displayed value.
function v2PlayerObservationReport(view,p,target){
 if(!view||view.world?.fired||!target||!managerControlsSquad(view,target)||!view.players[p?.id])return '';
 const player=view.players[p.id],r=scoutReport(view,player),metrics=observedPlayerCoreMetrics(view,player),pool=publicPlayerChampions(view,player),sample=r.sample,e=view.world.recruitment?.targets?.[p.id]?.evaluation;
 const remembered=V2.playerReport,opened=remembered?.db===V2.db&&remembered.manager===view.manager&&remembered.owner===managedTeamId(view)&&remembered.target===target.id&&remembered.pid===p.id&&remembered.open;
 const num=x=>Number.isFinite(x)?v2Esc(x):'정보 부족',range=x=>Array.isArray(x)&&x.length===2&&x.every(Number.isFinite)?x.join('–'):'범위 근거 없음',evaluation=e?.teamId===target.id?e:null;
 return `<details class="player-observation-report" data-player-observation${opened?' open':''}><summary>관측 보고서 · 공식 출전 근거</summary><div class="detail-grid"><div class="stat"><span class="label">관찰 횟수</span><strong data-observation-field="observations">${num(r.observations)}회</strong></div><div class="stat"><span class="label">최근 관찰 날짜</span><strong data-observation-field="last-date">${v2Esc(r.lastSeenDate||'관찰 날짜 없음')}</strong></div><div class="stat"><span class="label">관찰한 경기</span><strong data-observation-field="games-seen">${num(r.gamesSeen)}경기</strong></div><div class="stat"><span class="label">공식 집계 표본</span><strong data-observation-field="official-games">${num(sample.g)}경기</strong></div></div><p class="hint">${r.lastSeenDate?num(r.staleYears)+'시즌 경과한 관측입니다.':'관찰 날짜가 없어 최신성을 판단할 수 없습니다.'} 정보량은 정확도 보장이 아닙니다. 수동 관찰 횟수와 공식 경기 수는 별개이며, 관찰 요청으로 공식 경기 수를 추가하지 않습니다.</p><h3>현재 관측 지표</h3><div class="table-scroll" tabindex="0" role="region" aria-label="현재 관측 능력 추정치"><table><thead><tr><th scope="col">지표</th><th scope="col">추정값 (1–99)</th></tr></thead><tbody>${Object.entries(INITIAL_COMPARE_METRICS).map(([key,label])=>`<tr><th scope="row">${v2Esc(label)}</th><td data-observation-metric="${key}">${num(metrics[key])}</td></tr>`).join('')}</tbody></table></div><p class="hint">현재 관측 추정은 과거 경기 당시 능력이 아닙니다. 누락된 정보는 낮은 실력이나 0점으로 해석하지 않습니다.</p><h3>공식 집계</h3>${sample.g>0?`<p>평점 ${Number.isFinite(sample.rating)?sample.rating.toFixed(2):'정보 없음'} · 출전 시간 ${Number.isFinite(sample.min)?sample.min.toFixed(1)+'분':'정보 없음'} · ${sample.min>0&&Number.isFinite(sample.dpm)?'분당 피해 '+Math.round(sample.dpm):'분당 피해 정보 없음'}</p>`:'<p>공식 경기 기록 없음 · 관찰 횟수로 경기 통계를 만들지 않습니다.</p>'}<p class="hint">집계 대회: ${(sample.competitions||[]).map(id=>v2Esc(view.competitions[id]?.name||id)).join(' / ')||'대회 식별 기록 없음'}</p><h3>공개 출전 챔피언</h3><p class="hint">공식 집계와 공개 챔피언 원자료의 표본은 다를 수 있습니다. 비공개 숙련도는 표시하지 않습니다. 공개 근거 미확인 ${num(pool.unknown)}건.</p>${pool.champions.length?`<ul>${pool.champions.slice(0,5).map(c=>`<li data-observed-champion="${v2Esc(c.id)}">${v2Esc(championLabel(view,c.id))} · ${num(c.g)}경기 · ${v2Esc(c.from)}–${v2Esc(c.to)}</li>`).join('')}</ul>`:'<p>공개 출전 근거 없음 · 낮은 숙련도를 뜻하지 않습니다.</p>'}${evaluation?`<section data-observation-evaluation><h3>저장된 내부 평가</h3><p>${v2Esc(evaluation.date||'평가 날짜 미상')} · ${v2Esc(view.teams[target.id]?.name||target.id)} · 당시 정보 ${num(evaluation.knowledge)}% · 당시 기량 ${range(evaluation.ability)} · 잠재 ${range(evaluation.potential)} · 적합도 ${num(evaluation.fit)}/100</p><p class="hint">평가 당시 기록입니다. 현재 보고서·예산·등록 가능성이나 영입 성공을 보장하지 않습니다.</p></section>`:'<p class="hint">현재 선수단의 저장된 내부 평가가 없습니다.</p>'}</details>`;
}
