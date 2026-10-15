function v2Target(){if(!V2.db)return null;const teams=setupTeamsForManager(V2.db);return teams.find(t=>t.id===V2.target)||teams[0]||null;}
function v2OrganizationContext(){
 const db=V2.db;if(db.world.phase!=='initial_roster')return '';const teams=setupTeamsForManager(db),current=v2Target();if(teams.length<2)return '';
 return `<section class="panel"><div class="panel-heading"><strong>구성할 선수단</strong></div><p class="hint">구성할 선수단을 선택하고 선수를 검토하세요. 계약은 조건 합의 후 직접 확정합니다.</p><div class="stack">${teams.map(t=>{const lim=initialSquadLimits(db,t);return `<button class="btn ${current?.id===t.id?'btn-primary':'btn-outline'}" data-squad-context="${v2Esc(t.id)}" aria-pressed="${current?.id===t.id}">${v2Esc(t.name)} · ${t.roster.length}명 / 최소 ${lim.min}명</button>`}).join('')}</div></section>`;
}
function v2ChooseSquad(id){
 const error=v2ManualError();if(error)return v2Tell(error);if(V2.db.world.phase!=='initial_roster'||!setupTeamsForManager(V2.db).some(t=>t.id===id))return v2Tell('현재 구성할 수 있는 선수단이 아닙니다');
 v2CaptureDrafts();V2.target=id;V2.review=null;V2.managementReview=null;V2.pid=null;V2.page=0;V2.returnScroll=0;v2Save();v2Tell('구성할 선수단 · '+v2Target().name);v2Render();
}
function v2Candidates(){
 const db=V2.db,t=v2Target(),view=v2ReadView(),query=V2.q.trim().toLocaleLowerCase('ko'),targets=db.world?.recruitment?.targets||{};
 const rows=Object.values(db.players).filter(p=>!p.retired&&!p.team&&(V2.role==='ALL'||p.role===V2.role)&&(!query||p.name.toLocaleLowerCase('ko').includes(query))&&(V2.tab!=='관심 선수'||targets[p.id]));
 rows.sort((a,b)=>a.name.localeCompare(b.name,'ko')||a.id.localeCompare(b.id));
 const pages=Math.max(1,Math.ceil(rows.length/V2_LIST_PAGE_SIZE));V2.page=Math.max(0,Math.min(V2.page,pages-1));return {view,rows:rows.slice(V2.page*V2_LIST_PAGE_SIZE,(V2.page+1)*V2_LIST_PAGE_SIZE),total:rows.length,pages};
}
function v2PlayerCard(p,view){
 const watched=!!view.world.recruitment?.targets?.[p.id],range=scoutAbilityRange(view,p);
 return `<article class="player-list-row"><button class="player-list-open" data-player="${v2Esc(p.id)}"><span class="player-avatar">${v2Esc(ROLE_KO[p.role])}</span><span class="grow"><strong>${v2Esc(p.name)}</strong><span class="player-meta">${p.age}세 · 무소속 · 기량 ${range.every(Number.isFinite)?range.join('–'):'정보 부족'}</span></span><span aria-hidden="true">›</span></button><button class="icon-button favorite ${watched?'on':''}" data-watch="${v2Esc(p.id)}" aria-pressed="${watched}" aria-label="${v2Esc(p.name)} 관심 ${watched?'해제':'등록'}">${v2Icon('star')}</button></article>`;
}
function v2Market(){
 const db=V2.db,t=v2Target();if(!t)return '<section class="panel empty">관리 구단이 없습니다.</section>';
 if(V2.pid)return v2PlayerDetail();
 if(V2.tab==='진행 중인 협상')return v2NegotiationList();
 if(V2.tab==='시장 현황')return `<section class="panel"><div class="panel-heading"><strong>첫 시즌 선수단 구성</strong></div><p class="section-lead">선수를 직접 검토하고 조건을 제안하세요. 조건 합의 뒤에도 최종 계약은 감독이 직접 확정합니다.</p><div class="statline"><span>현재 선수단</span><strong>${t.roster.length}명</strong></div><div class="statline"><span>연간 연봉 예산</span><strong>${v2Money(initialSalaryBudget(db,t))}</strong></div><div class="statline"><span>현재 연봉 합계 · 연간</span><strong>${v2Money(payroll(db,t))}</strong></div><div class="tag-flex"><button class="btn btn-primary" data-tab="선수 검색">선수 찾아보기</button><button class="btn btn-outline" data-tab="진행 중인 협상">협상 확인</button></div></section>`;
 const m=v2Candidates();
 return `<section class="stack"><div class="search-wrap"><span class="search-icon">${v2Icon('search')}</span><input class="input" id="player-search" type="search" autocomplete="off" placeholder="선수 이름·닉네임 검색" aria-label="선수 검색" value="${v2Esc(V2.q)}"></div><div class="filter-row" aria-label="포지션 선택">${['ALL',...ROLES].map(r=>`<button class="chip ${V2.role===r?'selected':''}" aria-pressed="${V2.role===r}" data-role="${r}">${r==='ALL'?'전체':ROLE_KO[r]}</button>`).join('')}</div><div class="between small subtle"><span role="status">${m.total}명 · ${V2.page+1}/${m.pages}페이지</span></div>${m.rows.map(p=>v2PlayerCard(p,m.view)).join('')||'<div class="panel empty">조건에 맞는 선수가 없습니다.</div>'}<div class="between"><button class="btn btn-outline" data-page="-1"${!V2.page?' disabled':''}>이전</button><button class="btn btn-outline" data-page="1"${V2.page+1>=m.pages?' disabled':''}>다음</button></div></section>`;
}
function v2PlayerDetail(){
 const db=V2.db,p=db.players[V2.pid],t=v2Target();if(!p||p.retired)return '<section class="panel empty">현재 선수 정보를 확인할 수 없습니다.</section>';
 const view=v2ReadView(),range=scoutAbilityRange(view,p),potential=scoutPotentialRange(view,p),entry=view.world?.recruitment?.targets?.[p.id],checked=entry?.evaluation?.teamId===t?.id,eligible=t&&!p.team?initialSignCheck(db,p,t):{ok:false,reason:'현재 자유계약 대상이 아닙니다'},n=Object.values(db.world?.negotiations||{}).find(n=>n.pid===p.id&&n.teamId===t?.id&&n.status==='open');
 return `<section class="panel"><button class="btn btn-outline btn-small" id="player-back">← 목록으로</button><div class="content-head"><div><div class="eyebrow">선수 상세</div><h2>${v2Esc(p.name)}</h2><p class="small subtle">${v2Esc(ROLE_KO[p.role])} · ${p.age}세 · ${v2Esc(db.teams[p.team]?.name||'무소속')}</p></div><button class="icon-button favorite ${entry?'on':''}" data-watch="${p.id}" aria-pressed="${!!entry}" aria-label="관심 ${entry?'해제':'등록'}">${v2Icon('star')}</button></div><div class="detail-grid"><div class="stat"><span class="label">기량 추정</span><strong>${range.every(Number.isFinite)?range.join('–'):'정보 부족'}</strong></div><div class="stat"><span class="label">잠재력 추정</span><strong>${potential.every(Number.isFinite)?potential.join('–'):'정보 부족'}</strong></div></div><hr class="divider"><p class="hint">관측한 정보로 표시합니다. 추정 범위는 실제 능력 확정값이 아닙니다. 현재 정보량 ${knowledge(view,p)}%.</p><div class="stack"><button class="btn btn-outline" id="scout-player">관찰 보고서 요청 · ${v2Money(.1*psOf(db,v2Team().region))}</button><button class="btn btn-outline" id="evaluate-player"${!entry||knowledge(view,p)<35?' disabled':''}>대상 선수단 내부 평가${checked?' · 완료':''}</button><button class="btn btn-primary" id="negotiate-player"${!checked||!eligible.ok||db.world.phase!=='initial_roster'?' disabled':''}>${n?'진행 중인 협상 확인':'계약 조건 제안'}</button></div>${!eligible.ok?`<p class="hint">${v2Esc(eligible.reason)}</p>`:''}<p class="hint">관심 등록 → 관찰 정보 확인 → 내부 평가 → 조건 제안 순서로 진행합니다.</p></section>`;
}
function v2RecruitAction(action){if(v2Team()?.parent)return v2Tell('산하 선수단의 영입 계약은 모구단이 담당합니다');return v2Mutate(action);}
function v2BindMarket(){
 const current=v2Guard(),search=document.getElementById('player-search');
 if(search)search.oninput=()=>{if(!current())return;V2.q=search.value;V2.page=0;const start=search.selectionStart;v2Render();const next=document.getElementById('player-search');next?.focus({preventScroll:true});if(start!==null)next?.setSelectionRange(start,start)};
 v2Bind('[data-role]',el=>{V2.role=el.dataset.role;V2.page=0;v2Render()});
 v2Bind('[data-page]',el=>{V2.page+=Number(el.dataset.page);v2Render();window.scrollTo(0,0)});
 v2Bind('[data-player]',el=>v2Navigate(V2.section,V2.tab,el.dataset.player));
 v2Bind('#player-back',()=>v2Navigate(V2.section,V2.tab));
 v2Bind('[data-squad-context]',el=>v2ChooseSquad(el.dataset.squadContext));
 v2Bind('[data-watch]',el=>v2RecruitAction(()=>{const id=el.dataset.watch;return V2.db.world?.recruitment?.targets?.[id]?mDropInterest(V2.db,id):mInterest(V2.db,id,'B')}));
 v2Bind('#scout-player',()=>v2RecruitAction(()=>scoutPlayers(V2.db,[V2.pid],40,.1*psOf(V2.db,v2Team().region))));
 v2Bind('#evaluate-player',()=>v2RecruitAction(()=>mEvaluateTarget(V2.db,V2.pid,v2Target().id)));
 v2Bind('#negotiate-player',()=>{if(v2ManualError())return v2Tell(v2ManualError());if(v2Team()?.parent)return v2Tell('산하 선수단의 영입 계약은 모구단이 담당합니다');const db=V2.db,id=negotiationId(db,V2.pid,'initial',v2Target().id),n=db.world?.negotiations?.[id];if(!n||n.status!=='open')v2Mutate(()=>initialStartNegotiation(db,V2.pid,v2Target().id));v2OpenNegotiation(id);});
}
