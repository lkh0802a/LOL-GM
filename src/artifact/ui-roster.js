const TACTIC_AXES={aggression:['교전 회피','교전 주도'],risk_tolerance:['안정 지향','위험 감수'],objective_priority:['킬·교전 지향','오브젝트 지향'],vision_investment:['성장 투자','시야 투자'],scaling_preference:['초반 지향','후반 지향']};

function squadUiCanManage(t){return !!DB.world&&!DB.world.fired&&managerControlsSquad(DB,t)}
function squadObservationDb(t){
  const view=Object.create(DB);view.scout={};view._marketDemandCache={...(DB._marketDemandCache||{})};
for(const id of t.roster||[]){const r=DB.scout?.[id];if(r!==undefined)view.scout[id]=r&&typeof r==='object'?{...r}:r}
return view;
}
function squadObservedDetail(p,view){
  const live=DB;try{DB=view;const copy=playerChampionInternalAccess(view,p)?JSON.parse(JSON.stringify(p)):p;view.players={...view.players,[p.id]:copy};if(copy!==p&&view.teams?.[p.team])view.teams={...view.teams,[p.team]:JSON.parse(JSON.stringify(view.teams[p.team]))};return squadTableBack()+playerDetail(copy)}finally{DB=live}
}
function squadEditState(t){
if(!squadUiCanManage(t))return null;
  const root=parentTeamOf(DB,t)||t;
if(!SQUAD_EDIT||SQUAD_EDIT.parentId!==root.id||SQUAD_EDIT.world!==DB){
SQUAD_EDIT={parentId:root.id,teamId:null,world:DB,squads:{},
expected:squadPreparationSnapshot(DB,{parentId:root.id}),
roles:Object.fromEntries((managedTeam(DB)?.parent?t.roster:organizationRoster(DB,root)).map(id=>[id,DB.players[id]?.rosterRole||recommendedRosterRole(DB,DB.players[id],DB.teams[DB.players[id].team])])),
rosterPlan:rosterPlanState(DB,root)};
}
  const e=SQUAD_EDIT;
if(e.teamId) e.squads[e.teamId]={starters:e.starters,tactics:e.tactics,training:e.training,dirty:e.dirty};
  const next=e.squads[t.id]||{starters:{...(t.depthChart||{})},tactics:{...t.tactics},training:normalizeTraining(t.training),dirty:false};
Object.assign(e,next,{teamId:t.id});return e;
}
function rosterPlanPanel(t){const root=parentTeamOf(DB,t),res=reserveTeamsOf(DB,root);if(!root||!res.length)return '';if(managedTeam(DB)?.parent)return '<section><h3>모구단 선수 배치</h3><p class="hint">1·2군 이동과 선수 영입·계약은 모구단이 결정합니다. 현재 배정된 선수의 경기·훈련을 관리하세요.</p></section>';const e=squadEditState(t),v=validateRosterPlan(DB,root,e.rosterPlan),teams=organizationTeams(DB,root),counts=teams.map(x=>'<div><span>'+(x.parent?'2군':'1군')+'</span><b>'+(v.counts?.[x.id]??0)+'명</b><small>'+esc(x.name)+'</small></div>').join(''),rows=organizationRoster(DB,root).map(pid=>{const p=DB.players[pid],cur=DB.teams[p.team],dst=e.rosterPlan.assignments[pid]||p.team,opts=teams.map(x=>'<option value="'+x.id+'"'+(dst===x.id?' selected':'')+'>'+(x.parent?'2군':'1군')+' · '+esc(x.short)+'</option>').join('');return '<tr><td><b>'+esc(p.name)+'</b></td><td>'+ROLE_KO[p.role]+'</td><td>'+(cur.parent?'2군':'1군')+'</td><td><select data-squad-dst="'+p.id+'">'+opts+'</select></td></tr>'}).join('');return '<section><h3>1군 · 2군 배치</h3><p class="hint">바꾸고 싶은 선수만 선택하고 변경사항 적용을 누르면 최종 상태 전체를 한 번에 검증합니다.</p><div class="fin">'+counts+'</div>'+(v.ok?'':'<p class="lo">'+v.errors.map(esc).join(' · ')+'</p>')+'<div class="scroll"><table><thead><tr><th>선수</th><th>포지션</th><th>현재</th><th>변경 후</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>'}
function discardSquadEdit(){SQUAD_EDIT=null;MSG='관리 구단의 모든 임시 변경을 취소했습니다';nav()}
function applySquadEdit(){
  const t=DB.teams[SQUAD_EDIT?.teamId];if(!t||!squadUiCanManage(t))return;
  const e=squadEditState(t),preview=previewWorldAction(DB,{type:'squad.preparation',actor:'manager',parentId:e.parentId,
expected:e.expected,assignments:e.rosterPlan.assignments,roles:e.roles,
squads:Object.fromEntries(Object.entries(e.squads).filter(([id,x])=>{const base=e.expected.teams.find(t=>t.id===id);return x.dirty||JSON.stringify([x.starters,x.tactics,x.training])!==JSON.stringify([base?.starters,base?.tactics,normalizeTraining(base?.training)])}).map(([id,x])=>[id,{starters:x.starters,tactics:x.tactics,training:x.training}]))});
if(!preview.ok){MSG=preview.errors.join(' · ');navKeepScroll();return}
  const applied=applyWorldAction(DB,preview);
if(!applied.ok){MSG=applied.errors.join(' · ');navKeepScroll();return}
SQUAD_EDIT=null;MSG='관리 구단의 변경사항을 함께 적용했습니다';saveDB();nav();
}
function viewSquad(){
  SQUAD=SQUAD&&DB.teams[SQUAD]&&DB.teams[SQUAD].active!==false?SQUAD:(DB.world?managedTeamId(DB):activeTeams(DB)[0]?.id);
  const t=DB.teams[SQUAD];if(!t)return renderSquadEmpty();
  const mineOrg=squadUiCanManage(t),edit=mineOrg?squadEditState(t):null,observationDb=squadObservationDb(t),
    roster=edit?Object.entries(edit.rosterPlan.assignments).filter(([,dst])=>dst===t.id).map(([pid])=>pid):t.roster,
    allPs=roster.map(id=>DB.players[id]).filter(Boolean).sort((a,b)=>ROLES.indexOf(a.role)-ROLES.indexOf(b.role)||obsOvr(observationDb,b)-obsOvr(observationDb,a)||a.id.localeCompare(b.id)),
    status=squadStatusModel(t,edit),ps=squadTableRows(allPs,status),kAvg=Math.round(avg(allPs.map(p=>knowledge(observationDb,p))));
  return `${renderClubHomeSquadControls(teamOpts(SQUAD))}
  ${MSG?`<section role="status"><p>${esc(MSG)}</p></section>`:''}<section class="teamhead"><h2>${esc(t.name)}</h2><p>${t.formerNames&&t.formerNames.length?'전신 '+t.formerNames.map(esc).join(', ')+' · ':''}${esc(DB.regions[t.region].leagueName)} · 감독 ${mineOrg?'플레이어':'구단 AI'} · 운영 철학 ${PHIL_KO[t.philosophy]||'균형'} · 팬덤 ${t.fans??'—'}${mineOrg?' · 팀 호흡 '+Math.round(teamSynergy(t)):''}${t.goal?` · 구단주 목표: ${GOAL_KO[t.goal]}`:''}</p></section>
  ${squadPreparationActions(t)}<section><h3>${mineOrg?'변경 후 로스터':'공개 로스터'}</h3>${renderSquadTableControls(mineOrg,status)}${squadStatusSources(status)}<div class="scroll"><table class="roster" data-squad-roster><thead><tr><th>포지션</th><th>선수</th>${squadStatusHead(status)}${mineOrg?'<th>훈련 선발 초안</th><th>역할</th><th>회복 계획</th><th>만족도</th>':''}<th>나이</th><th>${mineOrg?'종합':'종합 추정'}</th><th>${mineOrg?'성장 여지':'잠재 추정'}</th><th>명성</th><th>${mineOrg?'시장가치':'시장가치 추정'}</th>${mineOrg?'<th>폼</th><th>컨디션</th><th>경기 감각</th><th>피로</th><th>사기</th>':''}<th>연봉</th><th>계약</th>${Object.keys(ATTR_GROUPS).map(g=>`<th>${GROUP_KO[g]}</th>`).join('')}</tr></thead><tbody>
    ${ps.map(p=>{const st=mineOrg?pState({...p}):null,shown=mineOrg?ensureSatisfaction({...p}):null,potential=scoutPotentialRange(observationDb,p);const shownRole=mineOrg?(edit.roles[p.id]||p.rosterRole||recommendedRosterRole(DB,p,t)):null,lineupMap=mineOrg?edit.starters:{},assignedRole=ROLES.find(r=>lineupMap[r]===p.id)||'',roleCtl=mineOrg?`<select data-srole="${p.id}" aria-label="${esc(p.name)} 로스터 역할">${SQUAD_ROLES.map(r=>`<option value="${r}"${shownRole===r?' selected':''}>${SQUAD_ROLE_KO[r]}</option>`).join('')}</select>`:'비공개',starterCtl=mineOrg?`<select data-lineup-player="${p.id}" aria-label="${esc(p.name)} 경기 포지션"><option value="">후보</option>${ROLES.map(r=>`<option value="${r}"${assignedRole===r?' selected':''}>${ROLE_KO[r]} · 적합 ${playerRoleRating(p,r)}</option>`).join('')}</select>`:'미공개';const healthCtl=mineOrg?`<select data-medical-plan="${esc(p.id)}" aria-label="${esc(p.name)} 회복 계획"${medicalUiAllowed(DB,t)?'':' disabled'}>${Object.entries(MEDICAL_PLAN_LABELS).map(([mode,label])=>`<option value="${mode}"${(p.medicalPlan||'auto')===mode?' selected':''}>${mode==='auto'?'자동 · '+MEDICAL_PLAN_LABELS[medicalPlanFor(DB,p)]:label}</option>`).join('')}</select>`:'비공개';return `<tr data-p="${p.id}" class="${OPEN_P===p.id?'open':''}"><td><span class="role">${ROLE_KO[p.role]}</span></td><td><button type="button" class="roster-open" data-p-open="${esc(p.id)}" aria-expanded="${OPEN_P===p.id}" aria-controls="pdetail">${esc(p.name)}</button>${medicalSummary(p)==='정상'?'':' <small class="lo">'+esc(medicalSummary(p))+'</small>'}${mineOrg&&!assignedRole?' <small class="hint">후보</small>':''}</td>${squadStatusCells(status,p)}${mineOrg?`<td>${starterCtl}</td><td>${roleCtl}</td><td>${healthCtl}</td>`:''}${mineOrg?`<td class="num ${shown.satisfaction<35?'lo':shown.satisfaction>=70?'hi':''}">${Math.round(shown.satisfaction)}<small class="hint"> ${satisfactionLabel(shown.satisfaction)}</small>${shown.wantsOut?' <span class="lo">이적요청</span>':''}</td>`:''}<td class="num">${p.age}</td><td>${ovrTag(obsOvr(observationDb,p))}${knowledge(observationDb,p)<100?'<small class="hint">?</small>':''}</td><td>${potential[0]===potential[1]?potential[0]:potential.join('~')}</td><td class="num">${p.reputation??'—'}</td><td class="num">${money(observedPlayerMarketValue(observationDb,p))}</td>${mineOrg?`<td class="num">${st.form>=3?'<span class="hi">▲</span>':st.form<=-3?'<span class="lo">▼</span>':'–'}</td><td class="num">${Math.round(st.condition)}</td><td class="num">${Math.round(st.sharpness)}</td><td class="num">${Math.round(st.fatigue)}</td><td class="num ${st.morale<35?'lo':''}">${Math.round(st.morale)}${p.wantsOut?' 이적요청':''}</td>`:''}<td class="num">${p.contract?money(p.contract.salary)+(p.contract.medicalReplacement?' (연 환산)':''):'—'}</td><td class="num">${p.contract?.medicalReplacement?'대체 · '+p.contract.medicalReplacement.guaranteedThrough+' 보장 / '+p.contract.medicalReplacement.expiresOn+' 조건 종료':p.contract?'~'+p.contract.until:'—'}</td>${Object.keys(ATTR_GROUPS).map(g=>`<td>${ovrTag(Math.round(avg(ATTR_GROUPS[g].map(a=>obsAttr(observationDb,p,a)))))}</td>`).join('')}</tr>`}).join('')}
  </tbody></table></div>${renderSquadTablePager()}<p class="hint">주포지션과 경기 슬롯은 별개입니다. 선수 이름으로 상세를 엽니다.${mineOrg?'':` 스카우팅 정보 ${kAvg}% — 정보가 적을수록 실제와 다르게 보입니다.`}</p>${DB.world&&!DB.world.fired&&managedTeam(DB)&&!mineOrg?`<div class="controls"><button class="ghost" id="scoutT"${recruitUiAllowed(DB)?'':' disabled'}>이 팀 집중 스카우팅 (${money(0.5*psOf(DB,DB.teams[managedTeamId(DB)].region))})</button><span id="scmsg" class="hint"></span></div>`:''}</section>
  <div id="pdetail">${OPEN_P&&DB.players[OPEN_P]&&(edit?edit.rosterPlan.assignments[OPEN_P]===SQUAD:DB.players[OPEN_P].team===SQUAD)?squadObservedDetail(DB.players[OPEN_P],observationDb):''}</div><details data-squad-management${edit?.dirty?' open':''}><summary>등록·전술·훈련·구단 상세</summary>
  ${officialRegistrationPanel(t)}
  ${mineOrg?squadPreparationTactics(t,edit):squadPublicPreparation(t)}
  ${financePanel(t)}
  ${squadLoanPanel(t)}
  ${mineOrg?scrimPlansPanel(t):''}
  ${mineOrg&&DB.world?.phase==='season'?`<section><h3>공식전·스크림 일정</h3><p class="hint">오늘 ${esc(DB.worldDate)} · ${officialBookedTeams(DB).has(t.id)?'공식 경기 예정/진행 · 스크림 불가':scrimReadiness(DB,t).ok?'스크림 가능 ('+scrimReadiness(DB,t).availableSlots.map(x=>x==='afternoon'?'오후':'저녁').join('·')+') · 잔여 '+scrimReadiness(DB,t).remaining+'세트':esc(scrimReadiness(DB,t).reason)} · 양팀 모두 같은 연습 시간이 비어야 하며, 7일 내 공식전 상대는 피하고 전력 격차·연패·자신감 회복 목적을 반영해 상호 수락해야 편성됩니다.</p><p class="hint">다음 공식전: ${esc(nextTeamMatch(DB,t.id)?.date||'미정')} / 최근 스크림: ${(t.scrimLog||[]).slice(-4).reverse().map(x=>esc(x.date)+' '+(x.slot==='afternoon'?'오후':x.slot==='evening'?'저녁':'연습')+' '+esc(DB.teams[x.opponent]?.short||x.opponent)+' '+x.games+'세트'+(x.purpose?' · '+esc(x.purpose):'')).join(' · ')||'없음'}</p></section>`:''}
  ${mineOrg?rosterPlanPanel(t):''}
  ${mineOrg?squadPreparationTraining(t,edit):''}
</details>${mineOrg?scoutingSearchBlock():''}`;
}
function bindSquad(){
  bindSquadTeamSelection();if(!DB.teams[SQUAD])return;
  bindSquadTableControls();bindClubHome();bindScrimPlans();
  bindSquadPracticeControls();bindSquadDraftControls();
  bindMedicalPlanControls();
  const teamScout=$('#scoutT');if(teamScout){const current=recruitUiGuard(()=>SQUAD===tId&&VIEW==='squad'&&!UI_OVERLAY),tId=SQUAD;teamScout.onclick=()=>{if(!current())return;runScoutReturn(DB.teams[tId].roster,35,.5*psOf(DB,managedTeam(DB).region),current,Infinity)}};
  bindRolePromiseControls();
  bindLoanControls();
  bindLoanPurchaseControls();
  bindLocalServiceControls();
  if(managedTeam(DB))bindOfficialRegistrationControls();
  document.querySelectorAll('[data-role-convert]').forEach(b=>{const t=DB.teams[SQUAD],current=practiceUiAllowed(DB,t)?practiceUiGuard(t,()=>SQUAD===t.id&&t.roster.includes(b.dataset.roleConvert)):()=>false;b.onclick=e=>{e.stopPropagation();if(!current())return;const r=proposeRoleConversion(DB,b.dataset.roleConvert,b.dataset.targetRole,'manager');MSG=r.reason;saveDB();navKeepScroll()}});
  document.querySelectorAll('[data-role-convert-cancel]').forEach(b=>{const t=DB.teams[SQUAD],current=practiceUiAllowed(DB,t)?practiceUiGuard(t,()=>SQUAD===t.id&&t.roster.includes(b.dataset.roleConvert)):()=>false;b.onclick=e=>{e.stopPropagation();if(!current())return;const r=cancelRoleConversion(DB,b.dataset.roleConvert,'manager');MSG=r.reason;saveDB();navKeepScroll()}});
  bindScoutReturnControls();
  const detailCurrent=squadTableGuard();
  document.querySelectorAll('[data-p-open]').forEach(button=>button.onclick=()=>{
    if(!detailCurrent())return;
    const playerId=button.dataset.pOpen;
    OPEN_P=OPEN_P===playerId?null:playerId;
    nav();
    const restored=[...document.querySelectorAll('[data-p-open]')].find(el=>el.dataset.pOpen===playerId);
    restored?.focus();
    const detail=$('#pdetail');
    if(OPEN_P&&detail)detail.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  });
}

let SCOUT_RETURN={};
function scoutReturnState(){
  const s=SCOUT_RETURN;if(s.db!==DB||s.world!==DB.world||s.slot!==SLOT||s.manager!==DB.manager||s.team!==managedTeamId(DB)){
    SCOUTSET={region:'ALL',role:'ALL',contract:'all',competition:'ALL',undervalued:false,q:''};
    SCOUT_RETURN={db:DB,world:DB.world,slot:SLOT,manager:DB.manager,team:managedTeamId(DB),page:0,selected:[],pid:null,visible:[]};
  }SCOUT_RETURN.selected=SCOUT_RETURN.selected.filter(id=>recruitUiExternal(DB,DB.players[id]));if(SCOUT_RETURN.pid&&!recruitUiExternal(DB,DB.players[SCOUT_RETURN.pid]))SCOUT_RETURN.pid=null;return SCOUT_RETURN;
}
function scoutReturnRefresh(selector){const y=window.scrollY;nav();window.scrollTo(0,y);document.querySelector(selector)?.focus?.({preventScroll:true})}
function runScoutReturn(ids,amount,cost,current,limit=10){
  if(!current())return;if(!ids.length){MSG='관찰할 선수를 선택하세요';navKeepScroll();return}if(ids.length>limit)return;
  const read=JSON.parse(JSON.stringify(DB)),before=JSON.stringify(read);let message;
  try{message=scoutPlayers(read,ids,amount,cost)}catch(e){MSG='처리하지 못했습니다 · '+e.message;return}
  if(JSON.stringify(read)===before){MSG=message;navKeepScroll();return}
  if(!confirm(`선수 ${ids.length}명 관찰 · 비용 ${money(cost)}\n보고서를 갱신할까요?`)||!current())return;
  const old=JSON.stringify(DB);MSG=scoutPlayers(DB,ids,amount,cost);if(JSON.stringify(DB)!==old)saveDB();navKeepScroll();
}
function bindScoutReturnControls(root=document){
  const nodes=root.querySelectorAll('[data-scout], [data-scout-select], [data-scout-detail]');if(!nodes.length&&!root.querySelector('#scq')&&!root.querySelector('#scback'))return;
  const state=scoutReturnState(),tid=SQUAD,current=recruitUiGuard(()=>VIEW==='squad'&&SQUAD===tid&&!UI_OVERLAY,false),write=()=>current()&&recruitUiAllowed(DB);
  const refresh=s=>scoutReturnRefresh(s),count=()=>{const el=root.querySelector('#sccount');if(el)el.textContent=`선택 ${state.selected.length}명 · 한 번에 최대 10명`;const all=root.querySelector('#scall'),visible=[...root.querySelectorAll('[data-scout-select]')];if(all){all.checked=visible.length>0&&visible.every(x=>x.checked);all.indeterminate=visible.some(x=>x.checked)&&!all.checked}};
  const query=root.querySelector('#scq');if(query)query.oninput=()=>{if(current()){SCOUTSET.q=query.value;state.page=0}};
  for(const [id,key] of [['screg','region'],['scrole','role'],['sccontract','contract'],['sccomp','competition'],['scunder','undervalued'],['scq','q']]){
    const el=root.querySelector('#'+id);if(el)el.onchange=()=>{if(!current())return;SCOUTSET[key]=key==='undervalued'?el.checked:el.value;state.page=0;refresh('#'+id)};
  }
  root.querySelectorAll('[data-scout-select]').forEach(el=>el.onchange=()=>{if(!current())return;const pid=el.dataset.scoutSelect;if(el.checked&&!state.selected.includes(pid)){if(state.selected.length>=10){el.checked=false;const elCount=root.querySelector('#sccount');if(elCount)elCount.textContent='한 번에 최대 10명까지 선택하세요';return}state.selected.push(pid)}if(!el.checked)state.selected=state.selected.filter(x=>x!==pid);count()});
  const all=root.querySelector('#scall');if(all)all.onchange=()=>{if(!current())return;const selected=all.checked;root.querySelectorAll('[data-scout-select]').forEach(el=>{el.checked=selected;el.onchange()})};
  root.querySelectorAll('[data-scout]').forEach(el=>el.onclick=e=>{e.stopPropagation();if(!write())return;runScoutReturn([el.dataset.scout],20,.1*psOf(DB,managedTeam(DB).region),write)});
  const batch=root.querySelector('#scbatch');if(batch)batch.onclick=()=>{if(write())runScoutReturn(state.selected.slice(0,10),20,.1*psOf(DB,managedTeam(DB).region)*Math.min(10,state.selected.length),write)};
  for(const [id,delta] of [['scprev',-1],['scnext',1]]){const el=root.querySelector('#'+id);if(el)el.onclick=()=>{if(!current()||el.disabled)return;state.page+=delta;refresh('#'+id)}}
  const clear=root.querySelector('#scclear');if(clear)clear.onclick=()=>{if(!current())return;state.selected=[];refresh('#scclear')};
  root.querySelectorAll('[data-scout-detail]').forEach(el=>el.onclick=()=>{if(!current())return;state.pid=el.dataset.scoutDetail;refresh('#scback')});
  const back=root.querySelector('#scback');if(back)back.onclick=()=>{if(!current())return;const pid=state.pid;state.pid=null;refresh(`[data-scout-detail="${pid}"]`)};count();
}
function captureScoutReturn(){
  const s=scoutReturnState(),el=document.activeElement;s.y=window.scrollY;
  const attr=['data-scout-select','data-scout-detail'].find(k=>el?.hasAttribute?.(k));
  s.focus=el?.id?'#'+el.id:attr?`[${attr}="${el.getAttribute(attr)}"]`:null;
}
function restoreScoutReturn(){
  const s=scoutReturnState(),db=DB,slot=SLOT,render=UI_RENDER_ID;
  if(!Number.isFinite(s.y))return;
  requestAnimationFrame(()=>{if(DB===db&&SLOT===slot&&UI_RENDER_ID===render&&VIEW==='squad'&&!UI_OVERLAY&&!SLOT_SWITCHING&&DB.manager===s.manager&&DB.world===s.world){window.scrollTo(0,s.y);document.querySelector(s.focus||'#scq')?.focus?.({preventScroll:true})}});
}

function clearScoutReturn(){SCOUT_RETURN={}}
