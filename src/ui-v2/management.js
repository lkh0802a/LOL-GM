// 새 선수단·훈련·직원 화면. 실제 상태 작성과 검사는 기존 엔진이 소유한다.
const V2_TACTICS={aggression:'공격성',risk_tolerance:'위험 감수',objective_priority:'주요 목표 우선도',vision_investment:'시야 투자',scaling_preference:'후반 지향'};
const v2Copy=x=>JSON.parse(JSON.stringify(x));
function v2ManagementError(){return v2ManualError()||(['pick','initial_roster'].includes(V2.db.world.phase)?'개막 선수단 구성을 먼저 확정하세요':null)}
function v2ManagementStamp(){const db=V2.db;return JSON.stringify([db.worldDate,db.year,managedTeamId(db),db.world.phase,db.world.manage,db.world.fired,db.world.pendingOfficial]);}
function v2Preparation(){
 const db=V2.db,t=v2Team(),parent=parentTeamOf(db,t);if(!t||!parent)return null;
 if(!V2.preparation||V2.preparation.db!==db||V2.preparation.tid!==t.id){
  V2.preparation={db,tid:t.id,stamp:v2ManagementStamp(),command:{type:'squad.preparation',actor:'manager',parentId:parent.id,expected:squadPreparationSnapshot(db,{parentId:parent.id}),assignments:{...rosterPlanState(db,parent).assignments},roles:{},squads:{[t.id]:{starters:{...t.depthChart},tactics:{...t.tactics},training:normalizeTraining(t.training)}}}};
 }return V2.preparation;
}
function v2PreparationCurrent(d=V2.preparation){return !!d&&d.db===V2.db&&d.tid===managedTeamId(V2.db)&&d.stamp===v2ManagementStamp()&&JSON.stringify(d.command.expected)===JSON.stringify(squadPreparationSnapshot(V2.db,d.command));}
function v2PreparationLines(command){
 const db=V2.db,lines=[];
 for(const [tid,x] of Object.entries(command.squads)){const t=db.teams[tid],name=t.name+' · ';
  for(const role of ROLES)if(x.starters[role]!==t.depthChart[role])lines.push(name+ROLE_KO[role]+' 선발: '+(db.players[t.depthChart[role]]?.name||'미선택')+' → '+(db.players[x.starters[role]]?.name||'미선택'));
  for(const [key,value] of Object.entries(x.tactics))if(value!==t.tactics[key])lines.push(name+(V2_TACTICS[key]||key)+': '+t.tactics[key]+' → '+value);
  const old=normalizeTraining(t.training),labels={light:'가볍게',normal:'보통',high:'강하게'};
  if(old.intensity!==x.training.intensity)lines.push(name+'훈련 강도: '+labels[old.intensity]+' → '+labels[x.training.intensity]);
  if((old.focus||'balanced')!==(x.training.focus||'balanced'))lines.push(name+'연습 중점: '+PRACTICE_FOCUS_KO[old.focus||'balanced']+' → '+PRACTICE_FOCUS_KO[x.training.focus||'balanced']);
  for(const key of Object.keys(ATTR_GROUPS))if(old[key]!==x.training[key])lines.push(name+GROUP_KO[key]+' 배분: '+old[key]+'점 → '+x.training[key]+'점');
 }
 for(const [pid,role] of Object.entries(command.roles))if(db.players[pid].rosterRole!==role)lines.push(db.players[pid].name+' 역할: '+SQUAD_ROLE_KO[db.players[pid].rosterRole]+' → '+SQUAD_ROLE_KO[role]);
 return lines.length?[...lines,'오늘 이미 소비한 훈련 시간과 결과는 다시 작성하지 않습니다.']:['현재 적용된 설정과 같습니다.'];
}
function v2ReviewManagement(command,title,lines){
 const error=v2ManagementError();if(error)return v2Tell(error);
 const preview=previewWorldAction(v2Copy(V2.db),v2Copy(command));if(!preview.ok)return v2Tell(preview.errors.join(' · '));
 if(V2.review||V2.managementReview||V2.advice||V2.roleReview||V2.official?.open)return v2Tell('현재 작업 창을 먼저 닫으세요');
 V2.managementReview={db:V2.db,world:V2.db.world,manager:V2.db.manager,stamp:v2ManagementStamp(),preview,title,lines};v2Render();
}
function v2CommitManagement(review){
 if(!review||review!==V2.managementReview||review.db!==V2.db||review.world!==V2.db.world||review.manager!==V2.db.manager||review.stamp!==v2ManagementStamp())return {ok:false,errors:['현재 검토가 아닙니다. 다시 확인하세요']};
 const error=v2ManagementError();if(error)return {ok:false,errors:[error]};
 if(review.contractDay)return v2CommitContractDay(review);
 if(review.freeAgencyDay||review.annualClose)return v2CommitOffseasonAction(review);
 if(review.phaseAction)return v2CommitSeasonTransition(review);
 return applyWorldAction(V2.db,review.preview);
}

function v2SeasonTransitionError(){
 const error=v2ManagementError();if(error)return error;
 const db=V2.db,t=v2Team(),phase=db.world.phase;
 if(!['market','preseason'].includes(phase))return '현재는 시장 마감 또는 다음 시즌 시작 단계가 아닙니다';
 if(phase==='market'&&!db.world.report)return '현재 시장의 결산 기록을 확인할 수 없습니다';
 if(phase==='preseason'&&(!isManagerSelectableTeam(db,t)||!db.regions[t.region]))return '현재 구단은 다음 시즌 참가 조건을 확인해야 합니다';
 return null;
}
function v2SeasonSeed(){const a=new Uint32Array(2);try{crypto.getRandomValues(a);return `world-${a[0].toString(36)}${a[1].toString(36)}`}catch{return `world-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}}
function v2ReviewSeasonTransition(){
 const error=v2SeasonTransitionError();if(error)return v2Tell(error);if(waitingNegotiationResponses(V2.db,true).length)return v2Tell('응답 대기 중인 제안을 직접 취소하거나 연락을 확인한 뒤 진행하세요');
 if(V2.review||V2.managementReview||V2.roleReview||V2.advice||V2.official?.open)return v2Tell('현재 작업 창을 먼저 닫으세요');
 const phase=V2.db.world.phase,seed=phase==='preseason'?v2SeasonSeed():null;
 V2.managementReview={db:V2.db,world:V2.db.world,manager:V2.db.manager,stamp:v2ManagementStamp(),phaseAction:phase,phaseSeed:seed,phaseTerms:JSON.stringify([phase,seed]),phaseBasis:JSON.stringify(V2.db),preview:{command:{type:'season.transition'}},title:phase==='market'?'이적시장 마감 검토':'다음 시즌 시작 검토',lines:phase==='market'?['현재 이적시장을 마감하고 프리시즌으로 이동합니다.','진행 중인 협상은 기존 마감 규칙에 따라 종료됩니다. 합의만으로 최종 계약을 대신 체결하지 않습니다.','다른 구단의 영입·등록/선발·재정 처리는 기존 엔진이 독립적으로 수행합니다.']:['현재 '+V2.db.year+'시즌의 구단과 선수 계약·재정·기록을 이어 새 시즌 일정을 시작합니다.','기존 시즌 시작 작성자가 등록·패치·목표·일정을 구성합니다. 경기 결과를 미리 작성하지 않습니다.']};v2Render();
}
function v2CommitSeasonTransition(r){
 const error=v2SeasonTransitionError();if(error)return {ok:false,errors:[error]};
 if(r.phaseAction!==V2.db.world.phase||r.phaseTerms!==JSON.stringify([r.phaseAction,r.phaseSeed])||r.phaseBasis!==JSON.stringify(V2.db))return {ok:false,errors:['현재 시즌 상태가 바뀌었습니다. 다시 검토하세요']};
 const undo=pendingOfficialUndo(V2.db);
 try{if(r.phaseAction==='market')closeMarket(V2.db);else startWorldSeason(V2.db,managedTeamId(V2.db),r.phaseSeed);return {ok:true};}
 catch(error){undo();return {ok:false,errors:[error.message]};}
}
function v2Continue(){
 if(manualContactPending(V2.db))return v2OpenNegotiation(v2CurrentContact().id);
 if(V2.db.world.pendingOfficial)return v2OfficialOpen();
 if(waitingNegotiationResponses(V2.db,true).length)return v2ContractAction(()=>advanceToNegotiationResponse(V2.db));
 if(['market','preseason'].includes(V2.db.world.phase))return v2ReviewSeasonTransition();
 if(V2.db.world.phase==='offseason')return v2ReviewContractDay();
 if(V2.db.world.phase==='initial_roster'){const errors=initialOrganizationErrors(V2.db,v2Team());if(errors.length)return v2Tell(errors.join(' · '));return v2Mutate(()=>{finalizeInitialRosters(V2.db);return '선수단을 확정했습니다'});}
 if(V2.db.world.phase!=='season')return v2Tell('현재 단계의 계약 기간·결산 절차를 먼저 확인하세요');
 return v2ContractAction(()=>{const out=playWorldDay(V2.db);return {...out,ok:!!out,msg:out?.msg||(V2.db.world.pendingOfficial?'공식 경기 준비가 필요합니다. 진행을 멈췄습니다.':'현재 날짜까지 진행했습니다')}});
}
function v2ContractCalendar(){
 const db=V2.db,w=db?.world,cw=w?.contractWindow;if(w?.phase!=='offseason'||!cw)return null;
 const valid=d=>{try{return typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&addDays(d,0)===d}catch{return false}};
 const ready=cw.stage==='exclusive'&&[db.worldDate,cw.startDate,cw.exclusiveThrough,cw.contractExpiryDate,cw.outsideContactDate].every(valid)&&cw.startDate<=db.worldDate&&db.worldDate<=cw.exclusiveThrough&&cw.exclusiveThrough===cw.contractExpiryDate&&addDays(cw.exclusiveThrough,1)===cw.outsideContactDate;
 return {ready,stage:cw.stage,start:cw.startDate,through:cw.exclusiveThrough,expiry:cw.contractExpiryDate,outside:cw.outsideContactDate,next:ready?addDays(db.worldDate,1):null};
}
function v2ContractCalendarView(){
 const m=v2ContractCalendar();if(!m)return '';const fa=m.stage==='fa'?freeAgencyDayState(V2.db):null,blocked=v2OffseasonActionError();
 return `<section class="panel"><h3>${m.stage==='exclusive'?'원소속 독점 재계약 기간':'자유계약 기간'}</h3><p>기존 계약 만료 ${v2Esc(m.expiry||'확인 필요')} · 외부 접촉 ${v2Esc(m.outside||'확인 필요')}부터</p><p class="hint">${m.ready?'계속 진행에서 다음 하루를 검토합니다. 작성 중인 제안은 자동 제출하지 않습니다.':v2Esc(fa?.reason||'현재 계약 날짜·단계의 진행 조건을 확인하세요.')}</p>${fa?`<p>연간 결산 기준 ${v2Esc(fa.through||'확인 필요')}</p><div class="tag-flex"><button class="btn btn-outline" id="fa-day-review"${blocked||!fa.ready?' disabled':''}>FA 하루 진행 검토${fa.ready?' · '+v2Esc(fa.next):''}</button><button class="btn btn-primary" id="annual-close-review"${blocked?' disabled':''}>연간 결산 검토</button></div><p class="hint">하루 진행은 합의된 지급·등록 자격의 날짜만 소비합니다. 제안 제출과 연간 결산은 각각 직접 결정합니다.</p>`:''}<button class="btn btn-outline" data-go="market" data-to="진행 중인 협상">계약 협상 확인</button></section>`;
}
function v2OffseasonActionError(){
 const error=v2ManagementError();if(error)return error;const t=v2Team(),s=freeAgencyDayState(V2.db);
 if(t.active===false||t.parent)return '현재 구단에서 날짜·결산을 직접 진행할 권한이 없습니다';
 if(s.stage!=='fa'||s.date>s.through)return s.reason||'현재 자유계약 날짜를 확인하세요';
 return null;
}
function v2ReviewOffseasonAction(kind){
 const error=v2OffseasonActionError();if(error)return v2Tell(error);const s=freeAgencyDayState(V2.db),annual=kind==='annual';if(annual&&waitingNegotiationResponses(V2.db,true).length)return v2Tell('응답 대기 중인 제안을 직접 취소하거나 연락을 확인한 뒤 결산하세요');
 if(!annual&&(!s.ready||kind!=='day'))return v2Tell(s.reason||'현재 자유계약 날짜를 확인하세요');
 if(V2.review||V2.managementReview||V2.roleReview||V2.advice||V2.official?.open)return v2Tell('현재 작업 창을 먼저 닫으세요');
 V2.managementReview={db:V2.db,world:V2.db.world,manager:V2.db.manager,stamp:v2ManagementStamp(),freeAgencyDay:!annual,annualClose:annual,offseasonTerms:JSON.stringify([!annual,annual]),offseasonBasis:JSON.stringify(V2.db),preview:{command:{type:annual?'season.close':'fa.day'}},title:annual?'연간 결산 검토':'자유계약 기간 · 하루 진행 검토',lines:annual?['현재 '+V2.db.worldDate+' → 기존 결산 기준 '+s.through,'기존 시즌 기록·성장·은퇴·승강·연간 재정과 계약 처리를 결산하고 이적시장으로 이동합니다.','남은 FA 날짜를 하루씩 검토하려면 취소하세요. 결산은 날짜를 기준일까지 이동합니다.','기존 최소 가용 인원 보정 계약과 다른 구단·경영진의 독립 결정을 포함한 연간 처리를 실행합니다. 현재 감독이 작성 중인 제안은 제출하지 않으며 합의를 최종 계약으로 대신 확정하지 않습니다.']:['현재 '+s.date+' → '+s.next+' · 그 전에 판단 연락이 오면 해당 시각에 멈춥니다.','기존 합의된 이적료 정산과 지역 등록 자격의 날짜 소비를 처리합니다.','경기·훈련·의료의 일일 처리를 추가하지 않습니다. 협상 제안과 연간 결산은 자동으로 실행하지 않습니다.']};v2Render();
}
function v2CommitOffseasonAction(r){
 const error=v2OffseasonActionError();if(error)return {ok:false,errors:[error]};
 if(r.offseasonBasis!==JSON.stringify(V2.db)||r.offseasonTerms!==JSON.stringify([r.freeAgencyDay,r.annualClose])||[r.freeAgencyDay,r.annualClose].filter(Boolean).length!==1||r.freeAgencyDay&&!freeAgencyDayState(V2.db).ready)return {ok:false,errors:['현재 자유계약·결산 조건이 바뀌었습니다. 다시 검토하세요']};
 const undo=pendingOfficialUndo(V2.db);
 try{if(r.annualClose){runOffseason(V2.db);return {ok:true};}const out=advanceOffseasonFreeAgencyDay(V2.db);if(!out?.ok)throw Error(out?.msg||'FA 날짜 진행 실패');return out;}
 catch(error){undo();return {ok:false,errors:[error.message]};}
}
function v2ReviewContractDay(){
 const error=v2ManagementError();if(error)return v2Tell(error);const m=v2ContractCalendar();
 if(!m?.ready)return v2Tell('현재 계약 날짜·단계의 진행 조건을 확인하세요');
 if(V2.review||V2.managementReview||V2.roleReview||V2.advice||V2.official?.open)return v2Tell('현재 작업 창을 먼저 닫으세요');
 V2.managementReview={db:V2.db,world:V2.db.world,manager:V2.db.manager,stamp:v2ManagementStamp(),contractDay:true,contractBasis:JSON.stringify(V2.db),preview:{command:{type:'contract.day'}},title:'독점 재계약 기간 · 하루 진행 검토',lines:['현재 '+V2.db.worldDate+' → '+m.next+' · 그 전에 판단 연락이 오면 해당 시각에 멈춥니다.','작성 중인 제안은 보내지 않습니다. 현재 협상과 선수 측 결정·실제 지급/계약 만료는 기존 날짜 규칙에 따라 처리합니다.',m.next===m.outside?'다음 날짜에 기존 계약 만료와 FA 접촉 개방을 처리합니다. 합의와 최종 계약은 별개입니다.':'경기·훈련 일일 처리를 실행하지 않고 기존 계약 달력의 하루만 진행합니다.']};v2Render();
}
function v2CommitContractDay(r){
 if(!v2ContractCalendar()?.ready||r.contractBasis!==JSON.stringify(V2.db))return {ok:false,errors:['현재 계약 날짜·조건이 바뀌었습니다. 다시 검토하세요']};
 const undo=pendingOfficialUndo(V2.db);try{const out=advanceOffseasonContractDay(V2.db);if(!out?.ok)throw Error(out?.msg||'계약 날짜 진행 실패');return out}catch(error){undo();return {ok:false,errors:[error.message]};}
}
function v2ManagementReview(){const r=V2.managementReview;return r?`<section class="panel" role="region" aria-label="변경 최종 검토"><div class="panel-heading"><strong>${v2Esc(r.title)}</strong></div>${r.lines.map(x=>`<p>${v2Esc(x)}</p>`).join('')}<p class="hint">현재 상태를 다시 확인한 뒤 직접 확정합니다. 취소하면 게임에는 적용되지 않습니다.</p><div class="tag-flex"><button class="btn btn-outline" id="management-cancel">편집으로 돌아가기</button><button class="btn btn-primary" id="management-confirm">확인하고 적용</button></div></section>`:'';}
function v2PreparationView(){
 const d=v2Preparation();if(!d)return '';const db=V2.db,t=v2Team(),x=d.command.squads[t.id],blocked=v2ManagementError(),day=practiceDay(db,t),booked=officialBookedTeams(db).has(t.id),stale=!v2PreparationCurrent(d),disabled=blocked||stale?' disabled':'';
 const select=(label,key,options,value)=>`<label class="field">${v2Esc(label)}<select class="input" data-prep="${key}"${disabled}>${options.map(([k,v])=>`<option value="${v2Esc(k)}"${value===k?' selected':''}>${v2Esc(v)}</option>`).join('')}</select></label>`;
 return `<section class="panel"><div class="panel-heading"><strong>${V2.tab==='훈련'?'훈련과 오늘의 가용 시간':'선발과 경기 준비'}</strong></div>${blocked?`<p class="hint">${v2Esc(blocked)}</p>`:''}${stale?'<p role="alert">현재 게임 상태가 바뀌었습니다. 초안을 취소하고 다시 편집하세요.</p>':''}${V2.tab==='훈련'?`<div class="grid-2"><div class="stat"><span class="label">오늘 남은 연습</span><strong>${day.remaining}점</strong></div><div class="stat"><span class="label">오늘 훈련 소비</span><strong>${day.drills}점</strong></div></div><p class="hint">${booked?'공식 경기일에는 일일 훈련 시간이 없습니다.':'스크림과 일일 훈련이 같은 하루 자원을 사용합니다.'} 설정을 바꿔도 이미 처리한 훈련을 다시 소비하지 않습니다.</p>${select('훈련 강도','intensity',Object.entries({light:'가볍게',normal:'보통',high:'강하게'}),x.training.intensity)}${select('연습 중점','focus',Object.entries(PRACTICE_FOCUS_KO),x.training.focus||'balanced')}<p class="hint">아래 능력 영역 배분은 총 ${TRAIN_POINTS}점 이내입니다. 하루 가용 시간에 더해지는 자원이 아닙니다.</p>${Object.keys(ATTR_GROUPS).map(k=>`<label class="field">${v2Esc(GROUP_KO[k])}<input class="input" type="number" min="0" max="${TRAIN_POINTS}" step="1" data-allocation="${k}" value="${x.training[k]}"${disabled}></label>`).join('')}<p id="allocation-left">남은 배분 ${TRAIN_POINTS-Object.keys(ATTR_GROUPS).reduce((n,k)=>n+x.training[k],0)}점</p>`:`${ROLES.map(r=>select(ROLE_KO[r]+' 선발','starter:'+r,[['','선수 선택'],...t.roster.map(id=>[id,db.players[id].name+' · '+ROLE_KO[db.players[id].role]])],x.starters[r])).join('')}<details><summary>선수단 역할과 전술</summary>${t.roster.map(id=>select(db.players[id].name+' 역할','role:'+id,SQUAD_ROLES.map(k=>[k,SQUAD_ROLE_KO[k]]),d.command.roles[id]||db.players[id].rosterRole)).join('')}${Object.keys(x.tactics).map(k=>`<label class="field">${v2Esc(V2_TACTICS[k]||k)}<input class="input" type="number" min="0" max="100" data-tactic="${v2Esc(k)}" value="${x.tactics[k]}"${disabled}></label>`).join('')}</details>`}<hr class="divider"><div class="tag-flex"><button class="btn btn-outline" id="preparation-discard">미적용 변경 취소</button><button class="btn btn-primary" id="preparation-review"${disabled}>변경 내용 검토</button></div><p class="hint">선발·전술·역할·훈련의 미적용 초안을 함께 검토합니다. 화면을 이동해도 현재 게임의 초안은 유지됩니다.</p></section>`;
}
function v2StaffCard(read,t,s,own){
 const seen=staffObservation(read,t,s),found=locateStaff(read,s.id),disabled=v2ManagementError()?' disabled':'',draft=V2.staffDrafts?.[s.id]||{},salary=draft.salary??staffAskingSalary(read,t,s),years=draft.years??2;
 return `<article class="panel"><div class="panel-heading"><strong>${v2Esc(s.name)}</strong><span class="state-tag">${v2Esc(STAFF_ROLES[s.role])}</span></div><p class="small subtle">${s.age}세 · ${v2Esc(found?.team?.name||'자유 계약')} · 관측 ${seen.min}~${seen.max}</p><p class="hint">${seen.interviewed?'현재 연도 면접 기록':'공개 평판 추정'} · 실제 개인 능력을 공개한 값이 아닙니다.</p>${own?`<p>현재 연봉 ${v2Money(s.contract?.salary)} / 년 · ${s.contract?.until||'정보 없음'}시즌까지</p>`:''}<details><summary>계약·검토</summary>${!own?`<button class="btn btn-outline" data-staff-interview="${v2Esc(s.id)}"${seen.interviewed||disabled?' disabled':''}>면접 기록 갱신</button>`:''}${!own||s.contract?.until<=read.year?`<label class="field">연봉 · 억 원 / 년<input class="input" type="number" min="0.1" max="10000" step="0.1" data-staff-input="salary" data-sid="${v2Esc(s.id)}" value="${v2Esc(salary)}"${disabled}></label><label class="field">계약 기간 · 년<input class="input" type="number" min="1" step="1" data-staff-input="years" data-sid="${v2Esc(s.id)}" value="${v2Esc(years)}"${disabled}></label>${!own&&!staffCanHire(t,s)?`<label class="field">같은 부서 교체 대상<select class="input" data-staff-input="replaceSid" data-sid="${v2Esc(s.id)}"${disabled}><option value="">직접 선택</option>${teamStaffMembers(t,staffDepartment(s.role)).map(p=>`<option value="${v2Esc(p.id)}"${draft.replaceSid===p.id?' selected':''}>${v2Esc(p.name)}</option>`).join('')}</select></label>`:''}<button class="btn btn-primary" data-staff-offer="${v2Esc(s.id)}"${disabled}>${own?'재계약':'계약'} 검토</button>`:''}${own?`<button class="btn btn-outline" data-staff-release="${v2Esc(s.id)}"${disabled}>계약 해지 검토 · ${v2Money(staffExitFee(read,s))}</button>`:''}<p class="hint">계약 기간의 연봉은 일시 선납이 아닙니다. 위약금·해지 보상과 현재 예산은 검토에서 별도로 확인합니다.</p>${(s.history||[]).slice(-3).map(h=>`<p class="small subtle">${h.year} · ${v2Esc(({signing:'계약',renewal:'재계약',release:'해지',expire:'만료',retire:'은퇴'})[h.type]||'직원 기록')}</p>`).join('')}</details></article>`;
}
function v2Staff(){
 const read=v2Copy(V2.db),t=managedTeam(read),own=teamStaffMembers(t),rows=V2.tab==='직원 채용'?staffMarketCandidates(read,t).filter(s=>!V2.staffRole||V2.staffRole==='ALL'||s.role===V2.staffRole):own;
 V2.staffPage=Math.max(0,Math.min(V2.staffPage||0,Math.max(0,Math.ceil(rows.length/V2_LIST_PAGE_SIZE)-1)));
 return `<section class="panel"><div class="panel-heading"><strong>${V2.tab}</strong></div><p>${Object.entries(STAFF_DEPT_LIMITS).map(([d,max])=>v2Esc(STAFF_DEPT_LABEL[d])+' '+own.filter(s=>staffDepartment(s.role)===d).length+'/'+max+'명').join(' · ')}</p><p class="hint">부서 정원은 의무 채용 인원이 아닙니다. 실제 고용 직원과 관측 자료를 바탕으로 검토합니다.</p>${V2.tab==='직원 채용'?`<label class="field">직무<select class="input" id="staff-role"><option value="ALL">전체 직무</option>${Object.entries(STAFF_ROLES).map(([k,v])=>`<option value="${k}"${V2.staffRole===k?' selected':''}>${v2Esc(v)}</option>`).join('')}</select></label>`:''}<div class="tag-flex"><button class="btn btn-outline" data-staff-page="-1"${V2.staffPage===0?' disabled':''}>이전</button><span>${V2.staffPage+1} / ${Math.max(1,Math.ceil(rows.length/V2_LIST_PAGE_SIZE))}</span><button class="btn btn-outline" data-staff-page="1"${(V2.staffPage+1)*V2_LIST_PAGE_SIZE>=rows.length?' disabled':''}>다음</button></div></section><section class="stack">${rows.slice(V2.staffPage*V2_LIST_PAGE_SIZE,(V2.staffPage+1)*V2_LIST_PAGE_SIZE).map(s=>v2StaffCard(read,t,s,V2.tab!=='직원 채용')).join('')||'<div class="panel empty">해당 직원이 없습니다.</div>'}</section>`;
}
function v2BindManagement(){
 v2Bind('#fa-day-review',()=>v2ReviewOffseasonAction('day'));
 v2Bind('#annual-close-review',()=>v2ReviewOffseasonAction('annual'));
 v2BindRoleConversion();v2BindMedical();
 const current=v2Guard();
 document.querySelectorAll('[data-prep],[data-allocation],[data-tactic]').forEach(el=>el.onchange=()=>{if(!current()||v2ManagementError())return;const d=v2Preparation();if(!v2PreparationCurrent(d))return v2Tell('현재 상태가 바뀌었습니다. 초안을 취소하세요');const x=d.command.squads[d.tid];if(el.dataset.prep){const [kind,id]=el.dataset.prep.split(':');if(kind==='starter'){for(const r of ROLES)if(x.starters[r]===el.value&&r!==id)delete x.starters[r];x.starters[id]=el.value;v2Render();}else if(kind==='role')d.command.roles[id]=el.value;else x.training[kind]=el.value;}else if(el.dataset.allocation){x.training=setTrainingAllocation(x.training,el.dataset.allocation,el.value);el.value=x.training[el.dataset.allocation];document.getElementById('allocation-left').textContent='남은 배분 '+(TRAIN_POINTS-Object.keys(ATTR_GROUPS).reduce((n,k)=>n+x.training[k],0))+'점';}else x.tactics[el.dataset.tactic]=Number(el.value);});
 v2Bind('#preparation-discard',()=>{V2.preparation=null;V2.managementReview=null;v2Render()});
 v2Bind('#preparation-review',()=>{const d=v2Preparation();if(!v2PreparationCurrent(d))return v2Tell('현재 상태가 바뀌었습니다. 초안을 취소하세요');v2ReviewManagement(d.command,'선수단 준비 변경 검토',v2PreparationLines(d.command));});
 document.querySelectorAll('[data-staff-input]').forEach(el=>{el.oninput=el.onchange=()=>{if(!current())return;V2.staffDrafts??={};const d=V2.staffDrafts[el.dataset.sid]??={};d[el.dataset.staffInput]=el.dataset.staffInput==='replaceSid'?el.value:Number(el.value);};});
 const filter=document.getElementById('staff-role');if(filter)filter.onchange=()=>{if(current()){V2.staffRole=filter.value;V2.staffPage=0;v2Render()}};
 v2Bind('[data-staff-page]',el=>{V2.staffPage+=Number(el.dataset.staffPage);v2Render()});
 for(const [attr,type] of [['offer','staff.sign'],['release','staff.release'],['interview','staff.interview']])v2Bind('[data-staff-'+attr+']',el=>{const sid=el.dataset['staff'+attr[0].toUpperCase()+attr.slice(1)],found=locateStaff(V2.db,sid);if(!found)return;const t=v2Team(),d=V2.staffDrafts?.[sid]||{},command={type:type==='staff.sign'&&found.team?.id===t.id?'staff.renew':type,actor:'manager',teamId:t.id,sid,salary:d.salary??staffAskingSalary(V2.db,t,found.staff),years:d.years??2,replaceSid:d.replaceSid||undefined};const preview=previewWorldAction(v2Copy(V2.db),command);if(!preview.ok)return v2Tell(preview.errors.join(' · '));const c=preview.command;v2ReviewManagement(command,found.staff.name+' · '+({offer:'계약',release:'해지',interview:'면접'})[attr]+' 검토',attr==='offer'?['연봉 '+v2Money(c.salary)+' / 년 · '+c.years+'년','위약금·해지 보상 '+v2Money(c.fee),'총 약정 연봉 '+v2Money(c.salary*c.years)+' · 일시 선납 아님']:['처리 비용 '+v2Money(c.fee||0)]);});
 v2Bind('#management-cancel',()=>v2CloseTask());
 v2Bind('#management-confirm',()=>{const r=V2.managementReview,out=v2CommitManagement(r);if(!out.ok)return v2Tell(out.errors.join(' · '));V2.managementReview=null;V2.preparation=null;if(r.phaseAction||r.annualClose){V2.official=null;V2.officialResult=null;}v2Tell(r.title+' · 적용했습니다');v2Save();if(!v2ShowContractResponse(out))v2Render()});
}

// 기존 전향 작성자를 새 선수 상세/단일 검토 창에 연결한다. 판정은 직접 확정할 때만 호출한다.
function v2RolePlayer(pid=V2.pid){const db=V2.db,p=db?.players[pid],t=p&&db.teams[p.team];return p&&!p.retired&&t?.active!==false&&t?.roster?.includes(p.id)&&managerControlsSquad(db,t)?p:null;}
function v2RoleError(pid){return v2ManagementError()||(!v2RolePlayer(pid)?'현재 관리 선수단의 선수가 아닙니다':null);}
function v2RoleStamp(){return JSON.stringify([V2.db,V2.target]);}
function v2RoleDraft(p){V2.roleDrafts??={};let d=V2.roleDrafts[p.id];if(!d||d.db!==V2.db)d=V2.roleDrafts[p.id]={db:V2.db,target:ROLES.find(r=>r!==p.role&&r!==p.roleConversion?.targetRole)||ROLES.find(r=>r!==p.role)};return d;}
function v2RosterDetail(){
 const p=v2RolePlayer();if(!p)return '<section class="panel"><button class="btn btn-outline" id="roster-back">← 선수 목록</button><p>현재 관리 선수 정보를 확인할 수 없습니다.</p></section>';
 const x=p.roleConversion,d=v2RoleDraft(p),error=v2RoleError(p.id),disabled=error?' disabled':'',events=(p.careerEvents||[]).filter(e=>String(e.type).startsWith('role_conversion_')).slice(-12).reverse(),labels={role_conversion_started:'전향 시작',role_conversion_rejected:'제안 거절',role_conversion_redirected:'전향 목표 변경',role_conversion_cancelled:'전향 중단',role_conversion_completed:'전향 완료'};
 return `<section class="panel"><button class="btn btn-outline" id="roster-back">← 선수 목록</button><h2>${v2Esc(p.name)}</h2><p>${v2Esc(V2.db.teams[p.team].name)} · 주 포지션 ${v2Esc(ROLE_KO[p.role])}</p><p class="hint">전향은 기존 포지션 경험과 별개의 장기 계획입니다. 제안만으로 주 포지션이나 선발 명단이 바뀌지 않으며 선수는 거절할 수 있습니다.</p>${v2MedicalDetails(p)}<h3>포지션 전향</h3>${x?`<p>${v2Esc(ROLE_KO[x.fromRole])} → ${v2Esc(ROLE_KO[x.targetRole])} · 진행 ${Math.round(x.progress||0)}%</p><p>기존 연습 누적 ${v2Esc(x.trainingDays||0)}회 · 스크림 ${v2Esc(x.scrimGames||0)}경기 · 공식전 ${v2Esc(x.officialGames||0)}경기</p><button class="btn btn-outline" id="role-cancel"${disabled}>현재 전향 중단 검토</button>`:'<p>진행 중인 전향이 없습니다.</p>'}<label class="field">제안할 포지션<select class="input" id="role-target"${disabled}>${ROLES.filter(r=>r!==p.role).map(r=>`<option value="${r}"${d.target===r?' selected':''}>${v2Esc(ROLE_KO[r])}${x?.targetRole===r?' · 진행 중':''}</option>`).join('')}</select></label><button class="btn btn-primary" id="role-propose"${disabled}>전향 제안 검토</button>${error?`<p class="hint">${v2Esc(error)}</p>`:''}<h3>당시 전향 기록</h3>${events.map(e=>`<p>${v2Esc(e.date||e.year)} · ${v2Esc(labels[e.type]||'전향 기록')} · ${v2Esc(ROLE_KO[e.from]||e.from||'')} → ${v2Esc(ROLE_KO[e.to]||e.to||'')}</p>`).join('')||'<p class="hint">저장된 전향 기록이 없습니다.</p>'}</section>`;
}
function v2ReviewRole(kind,pid=V2.pid,target=null){
 const error=v2RoleError(pid);if(error)return v2Tell(error);
 if(V2.review||V2.managementReview||V2.roleReview||V2.advice||V2.official?.open)return v2Tell('현재 작업 창을 먼저 닫으세요');
 const p=v2RolePlayer(pid);if(!['propose','cancel'].includes(kind)||kind==='cancel'&&!p.roleConversion||kind==='propose'&&(!ROLES.includes(target)||target===p.role))return v2Tell('현재 포지션과 제안 조건을 다시 확인하세요');
 V2.roleReview={db:V2.db,world:V2.db.world,manager:V2.db.manager,stamp:v2RoleStamp(),pid,kind,target,terms:JSON.stringify([pid,kind,target]),used:false};v2Render();
}
function v2RoleReviewView(){const r=V2.roleReview,p=r&&v2RolePlayer(r.pid);if(!p)return '<p>현재 선수와 수동 권한을 다시 확인하세요.</p>';return `<section class="panel"><h3>${v2Esc(p.name)} · ${r.kind==='cancel'?'전향 중단':'전향 제안'}</h3><p>${v2Esc(ROLE_KO[p.role])} → ${v2Esc(ROLE_KO[r.kind==='cancel'?p.roleConversion?.targetRole:r.target]||'현재 목표 확인')}</p><p class="hint">${r.kind==='cancel'?'중단 시 기존 엔진이 진행 정도에 따른 선수 반응과 당시 기록을 반영합니다.':'직접 제안한 뒤 선수의 기존 독립 판단 결과를 확인합니다. 수락이나 완료 날짜를 보장하지 않습니다.'}</p><div class="tag-flex"><button class="btn btn-outline" id="role-review-back">조건으로 돌아가기</button><button class="btn btn-primary" id="role-review-confirm">${r.kind==='cancel'?'전향 중단 확정':'선수에게 제안'}</button></div></section>`;}
function v2CommitRole(r){
 if(!r||r!==V2.roleReview||r.used||r.terms!==JSON.stringify([r.pid,r.kind,r.target])||r.db!==V2.db||r.world!==V2.db.world||r.manager!==V2.db.manager||r.stamp!==v2RoleStamp())return {ok:false,reason:'현재 검토가 아닙니다. 다시 확인하세요'};
 const error=v2RoleError(r.pid);if(error)return {ok:false,reason:error};const undo=pendingOfficialUndo(V2.db);
 try{const result=r.kind==='cancel'?cancelRoleConversion(V2.db,r.pid,'manager'):proposeRoleConversion(V2.db,r.pid,r.target,'manager');if(!result.ok){undo();return result;}r.used=true;return result;}catch(error){undo();return {ok:false,reason:error.message};}
}
function v2BindRoleConversion(){
 v2Bind('[data-squad-player]',el=>v2Navigate('squad','선수 목록',el.dataset.squadPlayer));v2Bind('#roster-back',()=>v2Navigate('squad','선수 목록'));
 const field=document.getElementById('role-target'),current=v2Guard();if(field)field.onchange=()=>{const p=v2RolePlayer();if(current()&&p&&!v2RoleError(p.id))v2RoleDraft(p).target=field.value;};
 v2Bind('#role-propose',()=>{const p=v2RolePlayer();if(p)v2ReviewRole('propose',p.id,v2RoleDraft(p).target)});v2Bind('#role-cancel',()=>v2ReviewRole('cancel'));
 v2Bind('#role-review-back',()=>v2CloseTask());v2Bind('#role-review-confirm',()=>{const r=V2.roleReview,result=v2CommitRole(r);v2Tell(result.reason);if(result.ok){V2.roleReview=null;v2Save();v2Render();}});
}

function v2MedicalDraft(p){V2.medicalDrafts??={};let d=V2.medicalDrafts[p.id];if(!d||d.db!==V2.db)d=V2.medicalDrafts[p.id]={db:V2.db,mode:p.medicalPlan||'auto'};return d;}
function v2MedicalDetails(player){
 if(!player||!v2RolePlayer(player.id))return '<p>현재 관리 선수의 의료 정보만 확인할 수 있습니다.</p>';
 const db=v2Copy(V2.db),p=db.players[player.id],error=v2RoleError(player.id),d=v2MedicalDraft(player),mode=medicalPlanFor(db,p),out=medicalOut(p),rest=medicalScrimRest(db,p),events=(p.careerEvents||[]).filter(e=>['medical_start','medical_return','medical_scar','medical_callup','medical_emergency_fa','medical_replacement_end'].includes(e.type)).slice(-8).reverse(),labels={medical_start:'의료 관리 시작',medical_return:'치료 후 복귀',medical_scar:'중증 부상 후유증',medical_callup:'의료 대체 조직 이동',medical_emergency_fa:'의료 대체 계약',medical_replacement_end:'의료 대체 계약 종료'};
 return `<section aria-label="의료·회복 계획"><h3>의료·회복 계획</h3><p>${v2Esc(medicalSummary(p))} · ${out?'의료상 출전 불가':'의료상 출전 불가 아님'}</p><p>컨디션 ${Number.isFinite(p.condition)?Math.round(p.condition):'기록 없음'} · 피로 ${Number.isFinite(p.fatigue)?Math.round(p.fatigue):'기록 없음'}</p><p>저장 계획 ${v2Esc(MEDICAL_PLAN_LABELS[p.medicalPlan||'auto']||'미확인')} · 현재 적용 ${v2Esc(MEDICAL_PLAN_LABELS[mode]||'미확인')}</p><p>연습·스크림: ${out||rest?'의료 조건으로 제외':'의료 조건 충족, 다른 조건 별도'}</p><p class="hint">휴식·재활 선택 자체가 공식 출전 금지는 아닙니다. 실제 의료 상태와 등록·명단 조건을 따로 확인하세요. 예상 일수는 복귀 보장이 아니며 계획만 저장해 회복이나 참가를 앞당기지 않습니다.</p><p class="hint">마지막 일일 계획 ${v2Esc(p.medicalPlanDate||'기록 없음')} · ${v2Esc(MEDICAL_PLAN_LABELS[p.medicalDayPlan]||'기록 없음')}</p><label class="field">저장할 회복 계획<select class="input" id="medical-mode"${error?' disabled':''}>${Object.entries(MEDICAL_PLAN_LABELS).map(([key,label])=>`<option value="${key}"${d.mode===key?' selected':''}>${v2Esc(label)}</option>`).join('')}</select></label><button class="btn btn-primary" id="medical-review"${error?' disabled':''}>회복 계획 검토</button><h4>당시 의료 기록</h4>${events.map(e=>`<p>${v2Esc(e.date||e.year||'날짜 기록 없음')} · ${v2Esc(labels[e.type])}${e.type==='medical_start'?' · '+v2Esc(MEDICAL_LABELS[e.site]||MEDICAL_LABELS[e.kind]||'건강 문제')+(Number.isFinite(e.days)?' · 당시 예상 '+e.days+'일':' · 당시 기간 기록 없음'):''}</p>`).join('')||'<p class="hint">저장된 의료 기록이 없습니다.</p>'}</section>`;
}
function v2ReviewMedical(pid,mode){
 const error=v2RoleError(pid);if(error)return v2Tell(error);const p=v2RolePlayer(pid);
 if(!Object.hasOwn(MEDICAL_PLAN_LABELS,mode))return v2Tell('기존 회복 계획 중 하나를 선택하세요');
 v2ReviewManagement({type:'medical.plan',actor:'manager',pid,mode},p.name+' · 회복 계획 검토',['현재 저장 '+(MEDICAL_PLAN_LABELS[p.medicalPlan||'auto']||'미확인')+' → '+MEDICAL_PLAN_LABELS[mode],'계획만 변경합니다. 회복·연습·공식 출전 판정과 당시 기록은 기존 실제 소비 시점에 반영됩니다.']);
}
function v2BindMedical(){
 const field=document.getElementById('medical-mode'),current=v2Guard();if(field)field.onchange=()=>{const p=v2RolePlayer();if(current()&&p&&!v2RoleError(p.id))v2MedicalDraft(p).mode=field.value;};
 v2Bind('#medical-review',()=>{const p=v2RolePlayer();if(p)v2ReviewMedical(p.id,v2MedicalDraft(p).mode)});
}
