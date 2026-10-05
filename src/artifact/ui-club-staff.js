// Staff presentation is a private snapshot; shared employment/registration writers own rules.
let CLUB_STAFF={db:null,slot:null,manager:null,tid:null,role:'ALL',page:0,draft:null};
function clubStaffState(tid){
  if(CLUB_STAFF.db!==DB||CLUB_STAFF.slot!==SLOT||CLUB_STAFF.manager!==managedTeamId(DB)||CLUB_STAFF.tid!==tid)CLUB_STAFF={db:DB,slot:SLOT,manager:managedTeamId(DB),tid,role:'ALL',page:0,draft:null};
  return CLUB_STAFF;
}
function clubStaffStamp(db){return JSON.stringify([db.year,db.worldDate,db.world.phase,db.world.manage,db.world.fired,db.world.pendingOfficial,db.world.seasons,db.staffPool,Object.values(db.teams).map(t=>[t.id,t.active,t.staffRoster,t.staffReports,t.finance])]);}
function clubStaffModel(db=DB,tid=managedTeamId(db)){
  if(!clubBriefContext(db)||!managerControlsSquad(db,db.teams[tid])||db.teams[tid]?.active===false)return null;
  const read=JSON.parse(JSON.stringify(db)),t=read.teams[tid],members=teamStaffMembers(t),profile=staffProfile(t);
  const seasons=Object.values(read.world.seasons||{}).filter(s=>!s.done&&read.competitions[s.comp]?.teams.includes(tid));
  return {read,t,members,profile,seasons,canContract:tid===managedTeamId(read)&&read.world.manage==='manual',candidates:tid===managedTeamId(read)?staffMarketCandidates(read,t):[]};
}
function clubStaffSummary(m){
  return `<p>${Object.entries(STAFF_DEPT_LIMITS).map(([d,max])=>`${STAFF_DEPT_LABEL[d]} ${m.members.filter(s=>staffDepartment(s.role)===d).length}/${max}`).join(' · ')}</p><p class="hint">직무별 의무 인원은 없습니다. 고용 상한의 남은 자리와 반드시 채워야 할 공석은 다릅니다. 전략·분석·육성·회복·조사는 현재 고용 전문성과 기존 중복·분산 규칙을 소비합니다.</p>`;
}
function renderClubStaffBriefing(){const m=clubStaffModel();if(!m)return '';return `<div id="club-staff" class="cfgcard"><h4 tabindex="-1">고용 · 현장 스태프</h4>${clubStaffSummary(m)}<div class="controls">${clubBriefContext().teams.map(id=>`<button data-brief-staff="${esc(id)}">${esc(DB.teams[id].name)} 직원·현장 확인</button>`).join('')}</div></div>`;}
function clubStaffEffects(m){
  const explain=(p,onsite=false)=>`전략 ${Math.round(p.draft)} · 분석 ${Math.round(p.analysis)} ${onsite?'':` · 육성 ${Math.round(p.development)} · 회복 ${Math.round(p.recovery)}`} · 조사 ${Math.round(p.scouting)}`;
  return `<p>현재 고용 지원: ${explain(m.profile)}</p><p class="hint">자기 구단의 기존 집계 모형 값이며 직원 개인의 실제 능력이나 승리 확률이 아닙니다. 훈련·회복은 전체 고용 명단을 사용합니다.</p>${m.seasons.map(s=>{const policy=competitionStaffPolicy(m.read,s),roster=competitionStaffMatchRoster(m.read,s,m.t)||[],profile=staffProfile({...m.t,staffRoster:roster});return `<p>${esc(m.read.competitions[s.comp].name)} · ${policy?`공표 상한 ${policy.max}명 · 현재 유효 현장 ${roster.length}명 · 마감 ${esc(policy.lockAt||'미상')}`:'공표된 현장 등록 제한 없음 · 임의 정원을 만들지 않습니다.'}<br>공식 현장 지원: ${explain(profile,true)}</p>`;}).join('')}${m.seasons.length?'':'<p class="hint">현재 생성된 진행 대회가 없습니다. 미래 현장 지원·등록 마감을 예측하지 않습니다.</p>'}`;
}
function clubStaffFields(root,values=null){const out={};root.querySelectorAll('[data-staff-salary], [data-staff-years], [data-staff-replace], [data-competition-staff]').forEach(el=>{const key=JSON.stringify([el.dataset.staffSalary?'salary':el.dataset.staffYears?'years':el.dataset.staffReplace?'replace':'entry',el.dataset.staffSalary||el.dataset.staffYears||el.dataset.staffReplace||el.dataset.competitionStaff,el.type==='checkbox'?el.value:'']);if(values&&key in values){if(el.type==='checkbox')el.checked=values[key];else el.value=values[key];}out[key]=el.type==='checkbox'?el.checked:el.value;});return out;}
function openClubStaff(tid){
  const m=clubStaffModel(DB,tid);if(!m||UI_OVERLAY)return false;
  const state=clubStaffState(tid),db=DB,w=db.world,slot=SLOT,render=UI_RENDER_ID,manager=managedTeamId(db),stamp=clubStaffStamp(db),root=document.querySelector('#overlay');let dialog=null;
  const current=()=>clubBriefCurrent(db,w,slot,render,manager)&&UI_OVERLAY===dialog&&clubStaffStamp(db)===stamp&&managerControlsSquad(db,db.teams[tid]);
  const close=()=>{if(UI_OVERLAY!==dialog)return;if(current())state.draft={stamp,values:clubStaffFields(root)};closeUiOverlay({restoreFocus:false});document.querySelector(`[data-brief-staff="${tid}"]`)?.focus?.({preventScroll:true});};
  const candidates=m.candidates.filter(s=>state.role==='ALL'||s.role===state.role).sort((a,b)=>staffObservation(m.read,m.t,b).estimate-staffObservation(m.read,m.t,a).estimate||a.id.localeCompare(b.id));state.page=Math.max(0,Math.min(state.page,Math.max(0,Math.ceil(candidates.length/20)-1)));
  openUiOverlay({kind:'club-staff',label:'구단 직원·공식 현장',dismissible:true,onDismiss:close,focusSelector:'#brief-staff-close',html:`<div class="ovin"><div class="ovhead"><b>${esc(m.t.name)} 직원·공식 현장</b><button id="brief-staff-close">브리핑으로 돌아가기</button></div>${clubStaffSummary(m)}${clubStaffEffects(m)}${competitionStaffRegistrationPanel(m.t,m.read)}<h4>현재 고용</h4>${m.members.map(s=>staffEmploymentCard(m.t,s,true,m.read,m.canContract)).join('')||'<p>현재 고용 직원 없음</p>'}${m.canContract?`<h4>관측 직원·수동 계약</h4><label>전문 직무<select id="brief-staff-role"><option value="ALL">전체</option>${Object.entries(STAFF_ROLES).map(([r,k])=>`<option value="${r}"${state.role===r?' selected':''}>${k}</option>`).join('')}</select></label><p>${candidates.length}명 · ${state.page+1}/${Math.max(1,Math.ceil(candidates.length/20))}페이지</p><button data-staff-next="-1"${state.page===0?' disabled':''}>이전</button><button data-staff-next="1"${(state.page+1)*20>=candidates.length?' disabled':''}>다음</button>${candidates.slice(state.page*20,(state.page+1)*20).map(s=>staffEmploymentCard(m.t,s,false,m.read)).join('')}`:'<p class="hint">직원 계약은 현재 관리 구단의 수동 권한만 사용합니다. 소유 2군 조회·현장 등록이 계약 대행 권한을 만들지 않습니다.</p>'}</div>`});dialog=UI_OVERLAY;
  if(state.draft?.stamp===stamp)clubStaffFields(root,state.draft.values);root.querySelector('#brief-staff-close').onclick=close;
  const after=(msg,changed)=>{clubBriefState().message=String(msg||MSG);if(changed)saveDB();state.draft=changed?null:{stamp,values:clubStaffFields(root)};closeUiOverlay({restoreFocus:false});navKeepScroll();document.querySelector('#club-staff h4')?.focus?.({preventScroll:true});};
  if(m.canContract)bindStaffEmploymentControls(after,current,root,tid);
  bindOfficialRegistrationControls(()=>current()&&w.manage==='manual',root,()=>after(MSG,false));
  const refresh=()=>{state.draft={stamp,values:clubStaffFields(root)};closeUiOverlay({restoreFocus:false});openClubStaff(tid);root.querySelector('#brief-staff-role')?.focus?.({preventScroll:true});};
  const role=root.querySelector('#brief-staff-role');if(role)role.onchange=()=>{if(current()){state.role=role.value;state.page=0;refresh();}};
  root.querySelectorAll('[data-staff-next]').forEach(b=>b.onclick=()=>{if(current()){state.page+=Number(b.dataset.staffNext);refresh();}});return true;
}
function bindClubStaffBriefing(){const ctx=clubBriefContext();if(!ctx){CLUB_STAFF.db=null;return;}const db=DB,w=ctx.w,slot=SLOT,render=UI_RENDER_ID;document.querySelectorAll('[data-brief-staff]').forEach(b=>b.onclick=()=>{if(clubBriefCurrent(db,w,slot,render,ctx.t.id)&&!UI_OVERLAY)openClubStaff(b.dataset.briefStaff);});}
