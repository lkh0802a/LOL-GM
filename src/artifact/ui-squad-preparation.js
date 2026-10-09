// ===== LOL GM: Authorized squad preparation UI =====
// Private training/tactics remain manager-only. Foreign views use public context.
function squadPublicPreparation(t){
  const next=nextTeamMatch(DB,t.id);
  return `<section><h3>공개 경기 준비 정보</h3><p class="hint">팀 전술·훈련 배분·팀 호흡·스크림 기록은 구단 내부 정보입니다. 공개 경기 기록과 선수 스카우팅 보고서로 상대를 분석하세요. 현재 공개 로스터는 다음 경기 확정 선발이 아닙니다.</p><p>다음 공식전: ${esc(next?.date||'미정')}</p></section>`;
}
function squadPreparationTactics(t,edit){
  if(!squadUiCanManage(t))return '';const tac=edit.tactics;
  return `  <section><h3>팀 전술</h3><div class="tac">
    ${Object.keys(TAC_KO).map(k=>`<label><span>${TAC_KO[k]}<output>${tac[k]}</output></span><input type="range" min="0" max="100" value="${tac[k]}" data-tac="${k}" aria-label="${TAC_KO[k]}"><span class="tactic-axis"><small>${TACTIC_AXES[k][0]}</small><small>${TACTIC_AXES[k][1]}</small></span></label>`).join('')}
  </div></section>
`;
}
function squadPreparationTraining(t,edit){
  if(!squadUiCanManage(t))return '';const tr=normalizeTraining(edit.training);
  return `  ${squadDraftReview(t,edit)}<p class="hint">해당 포지션 전문 코치는 실제 챔피언 훈련·스크림의 숙련 및 상성 학습을 보강합니다. 연습 시간은 늘어나지 않으며, 고용 변경은 이후 연습부터 반영됩니다.</p>
  ${(()=>{const r=trainingRecommendation(DB,t),ko={light:'가볍게',normal:'보통',high:'강하게'};return `<p class="hint">추천: ${ko[r.intensity]} 훈련 · ${r.next?`다음 공식전 ${r.days}일 전`:'공식전 일정 없음'} · 평균 피로 ${Math.round(r.fat)} / 컨디션 ${Math.round(r.cond)}</p>`})()}
  <section><h3>훈련 배분 <small class="hint" id="trleft">남은 포인트 ${TRAIN_POINTS-['mechanical','laning','combat','macro','mental'].reduce((x,k)=>x+(+tr[k]||0),0)} / ${TRAIN_POINTS}</small></h3><label>훈련 강도<select id="trint"><option value="light"${tr.intensity==='light'?' selected':''}>가볍게 · 회복 우선</option><option value="normal"${!tr.intensity||tr.intensity==='normal'?' selected':''}>보통 · 균형</option><option value="high"${tr.intensity==='high'?' selected':''}>강하게 · 성장 우선</option></select></label><label>연습 중점<select id="practicefocus">${Object.entries(PRACTICE_FOCUS_KO).map(([key,label])=>'<option value="'+key+'"'+((tr.focus||'balanced')===key?' selected':'')+'>'+label+'</option>').join('')}</select></label><p class="hint">하루 연습 시간 ${PRACTICE_POINTS}점 · 스크림 1세트당 ${SCRIM_PRACTICE_COST}점 · 개인 기량·챔피언·전술·팀 호흡이 남은 시간을 나눠 씁니다.</p><div class="tac training-grid">
    ${Object.keys(ATTR_GROUPS).map(g=>`<label><span>${GROUP_KO[g]}<output>${tr[g]}</output></span><input type="range" min="0" max="${TRAIN_POINTS}" value="${tr[g]}" data-tr="${g}"></label>`).join('')}
  </div><p class="hint">훈련 포인트는 총 ${TRAIN_POINTS}점입니다. 한 영역에 몰면 그 영역은 크게 오르지만 나머지는 덜 오르거나 떨어지고, 배분하지 않은 포인트는 버려집니다. 한 시즌에 영역별로 오를 수 있는 폭과, 잠재력보다 한참 높게 오르는 것에도 한계가 있습니다.</p>
  <div class="fin">${(()=>{const f=ensureFacilities(t),names={training:'훈련',analysis:'분석',recovery:'회복',youth:'유소년'};return Object.keys(names).map(k=>`<div><span>${names[k]} 시설</span><b>${f[k]} / 5</b><small>구단 자동 관리 </small></div>`).join('')})()}</div><p class="hint">훈련·유소년 시설은 성장, 분석 시설은 상대/메타 분석, 회복 시설은 피로 회복에 직접 적용됩니다. 연 유지비 ${money(facilityUpkeep(DB,t))}</p></section>
`;
}

// Compare only currently authorized preparation; never update the old baseline.
function squadDraftReviewModel(t,e){
  if(!e||e.world!==DB||!squadUiCanManage(t))return null;
  const rows=[],base=e.expected,read=JSON.parse(JSON.stringify(DB)),snap=squadPreparationSnapshot(read,{parentId:e.parentId});
  const add=(team,item,old,current,draft)=>{if(JSON.stringify(old)!==JSON.stringify(current)||JSON.stringify(current)!==JSON.stringify(draft))rows.push({team,item,old,current,draft})};
  const squads={...e.squads,[e.teamId]:{starters:e.starters,tactics:e.tactics,training:e.training,dirty:e.dirty}};
  const name=id=>read.players[id]?.name||'선수 없음',team=id=>read.teams[id]?.name||'배치 없음';
  for(const [id,x] of Object.entries(squads)){
    const now=read.teams[id],b=base.teams.find(x=>x.id===id);
    if(!now||!b||!managerControlsSquad(read,now))continue;
    for(const r of ROLES)add(now.name,ROLE_KO[r]+' 선발',name(b.starters[r]),name(now.depthChart?.[r]),name(x.starters[r]));
    for(const k of Object.keys(now.tactics||{}))add(now.name,TAC_KO[k]+' (0–100)',b.tactics[k],now.tactics[k],x.tactics[k]);
    const bt=normalizeTraining(b.training),nt=normalizeTraining(now.training),dt=normalizeTraining(x.training),labels={light:'가볍게',normal:'보통',high:'강하게'};
    for(const k of Object.keys(ATTR_GROUPS))add(now.name,GROUP_KO[k]+' 배분 (점)',bt[k],nt[k],dt[k]);
    add(now.name,'훈련 강도',labels[bt.intensity],labels[nt.intensity],labels[dt.intensity]);
    add(now.name,'연습 중점',PRACTICE_FOCUS_KO[bt.focus||'balanced'],PRACTICE_FOCUS_KO[nt.focus||'balanced'],PRACTICE_FOCUS_KO[dt.focus||'balanced']);
  }
  for(const pid of organizationRoster(read,e.parentId)){
    const p=read.players[pid];if(!managerControlsSquad(read,read.teams[p.team]))continue;
    const oldTeam=base.roster.teams.find(x=>x.roster.includes(pid))?.id;
    add(p.name,'스쿼드 배치',team(oldTeam),team(p.team),team(e.rosterPlan.assignments[pid]));
    const labels=SQUAD_ROLE_KO;
    const role=base.roles.find(x=>x.pid===pid)?.role;
    add(p.name,'로스터 역할',labels[role]||role||'미지정',labels[p.rosterRole]||p.rosterRole||'미지정',labels[e.roles[pid]]||e.roles[pid]||'미지정');
  }
  const command={type:'squad.preparation',actor:'manager',parentId:e.parentId,expected:base,assignments:e.rosterPlan.assignments,roles:e.roles,squads:Object.fromEntries(Object.entries(squads).filter(([id,x])=>{const b=base.teams.find(t=>t.id===id);return x.dirty||JSON.stringify([x.starters,x.tactics,x.training])!==JSON.stringify([b?.starters,b?.tactics,normalizeTraining(b?.training)])}).map(([id,x])=>[id,{starters:x.starters,tactics:x.tactics,training:x.training}]))};
  const preview=previewWorldAction(read,command);
  return {rows,date:base.roster.date,currentDate:read.worldDate,stale:JSON.stringify(base)!==JSON.stringify(snap),errors:preview.ok?[]:preview.errors,canAct:practiceUiAllowed(DB,t)};
}
function squadDraftReview(t,e){
  const m=squadDraftReviewModel(t,e);if(!m||!m.rows.length&&!m.stale&&!m.errors.length)return '';
  const cell=v=>esc(v===undefined?'기록 없음':String(v));
  return `<details${m.stale||m.errors.length?' open':''}><summary>미적용 변경 검토 · ${m.rows.length}개 항목</summary><p>편집 기준일 ${cell(m.date)} · 현재 ${cell(m.currentDate)}</p>${m.errors.length?`<p role="alert">${m.errors.map(esc).join(' · ')}</p>`:''}<div class="scroll" tabindex="0" aria-label="미적용 선수단 변경 비교"><table><thead><tr><th scope="col">구단·선수</th><th scope="col">항목</th><th scope="col">편집 시작</th><th scope="col">현재 적용</th><th scope="col">미적용 초안</th></tr></thead><tbody>${m.rows.map(x=>`<tr>${[x.team,x.item,x.old,x.current,x.draft].map(v=>`<td>${cell(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${m.stale?`<p>초안은 적용되지 않았습니다. 현재 상태에서 다시 편집하려면 모든 초안을 취소하세요.</p><button id="sqreviewreset"${m.canAct?'':' disabled'}>초안 취소 후 현재 상태로 다시 편집</button>`:''}</details>`;
}

function squadPreparationActions(t){
  return squadUiCanManage(t)?`<div class="controls"><button class="primary" id="sqapply">구단 변경사항 모두 적용</button><button class="ghost" id="sqdiscard">구단 변경사항 모두 취소</button><span class="hint">관리하는 1·2군의 코칭은 직접 결정하며 AI가 훈련을 자동 변경하지 않습니다. 임시 편집은 팀별로 보존됩니다. 로스터는 변경 후 배치를 미리 보여줍니다. 배치·역할과 각 팀의 주전·전술·훈련을 함께 적용하거나 모두 취소합니다.</span></div>`:"";
}
