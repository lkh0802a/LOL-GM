// ===== LOL GM: Authorized squad preparation UI =====
// Private tactics and scrim preparation remain manager-only. Foreign views use public context.
function squadPublicPreparation(t){
  const next=nextTeamMatch(DB,t.id);
  return `<section><h3>공개 경기 준비 정보</h3><p class="hint">팀 전술·팀 호흡·스크림 기록은 구단 내부 정보입니다. 공개 경기 기록과 선수 스카우팅 보고서로 상대를 분석하세요. 현재 공개 로스터는 다음 경기 확정 선발이 아닙니다.</p><p>다음 공식전: ${esc(next?.date||'미정')}</p></section>`;
}
function squadPreparationTactics(t,edit){
  if(!squadUiCanManage(t))return '';const tac=edit.tactics;
  return `  <section><h3>팀 전술</h3><div class="tac">
    ${Object.keys(TAC_KO).map(k=>`<label><span>${TAC_KO[k]}<output>${tac[k]}</output></span><input type="range" min="0" max="100" value="${tac[k]}" data-tac="${k}" aria-label="${TAC_KO[k]}"><span class="tactic-axis"><small>${TACTIC_AXES[k][0]}</small><small>${TACTIC_AXES[k][1]}</small></span></label>`).join('')}
  </div></section>
`;
}
function squadPreparationTraining(t,edit){
  if(!squadUiCanManage(t))return '';
  return `${squadDraftReview(t,edit)}<section><h3>스크림·실전 기반 육성</h3><p class="hint">선수 성장은 공식 경기·스크림에서 확인된 활동과 출전 경험, 코칭스태프·시설, 회복 상태에 따라 결정됩니다. 수동 능력치 포인트 배분과 훈련 강도 설정은 사용하지 않습니다.</p><div class="fin">${(()=>{const f=ensureFacilities(t),names={training:'훈련',analysis:'분석',recovery:'회복',youth:'유소년'};return Object.keys(names).map(k=>`<div><span>${names[k]} 시설</span><b>${f[k]} / 5</b></div>`).join('')})()}</div><p class="hint">시설은 실제 활동의 학습 환경과 회복을 지원합니다. 연간 유지비 ${money(facilityUpkeep(DB,t))}</p></section>`;
}

// Compare only currently authorized preparation; never update the old baseline.
function squadDraftReviewModel(t,e){
  if(!e||e.world!==DB||!squadUiCanManage(t))return null;
  const rows=[],base=e.expected,read=JSON.parse(JSON.stringify(DB)),snap=squadPreparationSnapshot(read,{parentId:e.parentId});
  const add=(team,item,old,current,draft)=>{if(JSON.stringify(old)!==JSON.stringify(current)||JSON.stringify(current)!==JSON.stringify(draft))rows.push({team,item,old,current,draft})};
  const squads={...e.squads,[e.teamId]:{starters:e.starters,tactics:e.tactics,dirty:e.dirty}};
  const name=id=>read.players[id]?.name||'선수 없음',team=id=>read.teams[id]?.name||'배치 없음';
  for(const [id,x] of Object.entries(squads)){
    const now=read.teams[id],b=base.teams.find(x=>x.id===id);
    if(!now||!b||!managerControlsSquad(read,now))continue;
    for(const r of ROLES)add(now.name,ROLE_KO[r]+' 선발',name(b.starters[r]),name(now.depthChart?.[r]),name(x.starters[r]));
    for(const k of Object.keys(now.tactics||{}))add(now.name,TAC_KO[k]+' (0–100)',b.tactics[k],now.tactics[k],x.tactics[k]);
  }
  for(const pid of organizationRoster(read,e.parentId)){
    const p=read.players[pid];if(!managerControlsSquad(read,read.teams[p.team]))continue;
    const oldTeam=base.roster.teams.find(x=>x.roster.includes(pid))?.id;
    add(p.name,'스쿼드 배치',team(oldTeam),team(p.team),team(e.rosterPlan.assignments[pid]));
    const labels=SQUAD_ROLE_KO;
    const role=base.roles.find(x=>x.pid===pid)?.role;
    add(p.name,'로스터 역할',labels[role]||role||'미지정',labels[p.rosterRole]||p.rosterRole||'미지정',labels[e.roles[pid]]||e.roles[pid]||'미지정');
  }
  const command={type:'squad.preparation',actor:'manager',parentId:e.parentId,expected:base,assignments:e.rosterPlan.assignments,roles:e.roles,squads:Object.fromEntries(Object.entries(squads).filter(([id,x])=>{const b=base.teams.find(t=>t.id===id);return x.dirty||JSON.stringify([x.starters,x.tactics])!==JSON.stringify([b?.starters,b?.tactics])}).map(([id,x])=>[id,{starters:x.starters,tactics:x.tactics}]))};
  const preview=previewWorldAction(read,command);
  return {rows,date:base.roster.date,currentDate:read.worldDate,stale:JSON.stringify(base)!==JSON.stringify(snap),errors:preview.ok?[]:preview.errors,canAct:practiceUiAllowed(DB,t)};
}
function squadDraftReview(t,e){
  const m=squadDraftReviewModel(t,e);if(!m||!m.rows.length&&!m.stale&&!m.errors.length)return '';
  const cell=v=>esc(v===undefined?'기록 없음':String(v));
  return `<details${m.stale||m.errors.length?' open':''}><summary>미적용 변경 검토 · ${m.rows.length}개 항목</summary><p>편집 기준일 ${cell(m.date)} · 현재 ${cell(m.currentDate)}</p>${m.errors.length?`<p role="alert">${m.errors.map(esc).join(' · ')}</p>`:''}<div class="scroll" tabindex="0" aria-label="미적용 선수단 변경 비교"><table><thead><tr><th scope="col">구단·선수</th><th scope="col">항목</th><th scope="col">편집 시작</th><th scope="col">현재 적용</th><th scope="col">미적용 초안</th></tr></thead><tbody>${m.rows.map(x=>`<tr>${[x.team,x.item,x.old,x.current,x.draft].map(v=>`<td>${cell(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${m.stale?`<p>초안은 적용되지 않았습니다. 현재 상태에서 다시 편집하려면 모든 초안을 취소하세요.</p><button id="sqreviewreset"${m.canAct?'':' disabled'}>초안 취소 후 현재 상태로 다시 편집</button>`:''}</details>`;
}

function squadPreparationActions(t){
  return squadUiCanManage(t)?`<div class="controls"><button class="primary" id="sqapply">구단 변경사항 모두 적용</button><button class="ghost" id="sqdiscard">구단 변경사항 모두 취소</button><span class="hint">관리하는 1·2군의 선발과 전술은 직접 결정하며 선수 성장은 실제 경기 활동을 따릅니다. 임시 편집은 팀별로 보존됩니다. 로스터는 변경 후 배치를 미리 보여줍니다. 배치·역할과 각 팀의 주전·전술을 함께 적용하거나 모두 취소합니다.</span></div>`:"";
}
