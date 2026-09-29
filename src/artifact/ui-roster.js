// ===== LOL GM: Roster / player management UI =====
// Squad editing, free match-role assignment, player detail and scouting surfaces.

function potLabel(p){const r=p.pot-playerOvr(p);return r>=8?'높음':r>=3?'보통':'낮음'}
function squadEditState(t){
  const root=parentTeamOf(DB,t)||t;
  if(!SQUAD_EDIT||SQUAD_EDIT.parentId!==root.id)SQUAD_EDIT={parentId:root.id,teamId:t.id,starters:{...(t.depthChart||{})},roles:Object.fromEntries(organizationRoster(DB,root).map(id=>[id,DB.players[id]?.rosterRole||recommendedRosterRole(DB,DB.players[id],DB.teams[DB.players[id].team])])),tactics:{...t.tactics},training:{...(t.training||defaultTraining())},rosterPlan:rosterPlanState(DB,root),dirty:false};
  SQUAD_EDIT.teamId=t.id;return SQUAD_EDIT;
}
function rosterPlanPanel(t){const root=parentTeamOf(DB,t),res=reserveTeamsOf(DB,root);if(!root||!res.length)return '';const e=squadEditState(t),v=validateRosterPlan(DB,root,e.rosterPlan),teams=organizationTeams(DB,root),counts=teams.map(x=>'<div><span>'+(x.parent?'2군':'1군')+'</span><b>'+(v.counts?.[x.id]??0)+'명</b><small>'+esc(x.name)+'</small></div>').join(''),rows=organizationRoster(DB,root).map(pid=>{const p=DB.players[pid],cur=DB.teams[p.team],dst=e.rosterPlan.assignments[pid]||p.team,opts=teams.map(x=>'<option value="'+x.id+'"'+(dst===x.id?' selected':'')+'>'+(x.parent?'2군':'1군')+' · '+esc(x.short)+'</option>').join('');return '<tr><td><b>'+esc(p.name)+'</b></td><td>'+ROLE_KO[p.role]+'</td><td>'+(cur.parent?'2군':'1군')+'</td><td><select data-squad-dst="'+p.id+'">'+opts+'</select></td></tr>'}).join('');return '<section><h3>1군 · 2군 배치</h3><p class="hint">바꾸고 싶은 선수만 선택하고 변경사항 적용을 누르면 최종 상태 전체를 한 번에 검증합니다.</p><div class="fin">'+counts+'</div>'+(v.ok?'':'<p class="lo">'+v.errors.map(esc).join(' · ')+'</p>')+'<div class="scroll"><table><thead><tr><th>선수</th><th>포지션</th><th>현재</th><th>변경 후</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>'}
function discardSquadEdit(){SQUAD_EDIT=null;nav()}
function applySquadEdit(){
  const t=DB.teams[SQUAD_EDIT?.teamId];if(!t)return;const e=SQUAD_EDIT,root=parentTeamOf(DB,t)||t,hasReserve=reserveTeamsOf(DB,root).length>0;
  const preview=hasReserve?previewWorldAction(DB,{type:'roster.plan',parentId:e.parentId,assignments:e.rosterPlan.assignments,actor:'manager'}):null;
  if(hasReserve&&!preview.ok){MSG=preview.errors.join(' · ');navKeepScroll();return}
  const planned=hasReserve?Object.entries(preview.command.assignments).filter(([,dst])=>dst===t.id).map(([pid])=>pid):(t.roster||[]).slice(),lineup=validateStartingLineup(DB,t,e.starters,planned);
  if(!lineup.ok){MSG=lineup.errors.join(' · ');navKeepScroll();return}
  if(hasReserve){const applied=applyWorldAction(DB,preview);if(!applied.ok){MSG=applied.errors.join(' · ');navKeepScroll();return}}
  t.depthChart={};
  for(const r of ROLES){const p=DB.players[e.starters[r]];if(p&&p.team===t.id)setDepthStarter(DB,t,r,p,'manager',false)}
  for(const [id,role] of Object.entries(e.roles)){const p=DB.players[id];if(p&&p.rosterRole!==role)setRosterRole(DB,p,role,'manager',false)}
  t.tactics={...e.tactics};t.training={...e.training};SQUAD_EDIT=null;MSG='';saveDB();nav();
}
function viewSquad(){
  SQUAD=SQUAD&&DB.teams[SQUAD]&&DB.teams[SQUAD].active!==false?SQUAD:(DB.world?managedTeamId(DB):activeTeams(DB)[0].id);
  const t=DB.teams[SQUAD], ps=t.roster.map(id=>DB.players[id]).sort((a,b)=>ROLES.indexOf(a.role)-ROLES.indexOf(b.role)||playerOvr(b)-playerOvr(a));
  const mineOrg=DB.world&&(t.id===managedTeamId(DB)||t.parent===managedTeamId(DB)), kAvg=Math.round(avg(ps.map(p=>knowledge(DB,p))));
  const edit=mineOrg?squadEditState(t):null,tr=edit?edit.training:(t.training||defaultTraining()),tac=edit?edit.tactics:t.tactics;
  return `<section class="controls"><label>팀<select id="sq">${teamOpts(SQUAD)}</select></label></section>
  <section class="teamhead"><h2>${esc(t.name)}</h2><p>${t.formerNames&&t.formerNames.length?'전신 '+t.formerNames.map(esc).join(', ')+' · ':''}${esc(DB.regions[t.region].leagueName)} · 감독 ${t.id===managedTeamId(DB)?'플레이어':'구단 AI'} · 운영 철학 ${PHIL_KO[t.philosophy]||'균형'} · 팬덤 ${t.fans??'—'} · 팀 호흡 ${Math.round(teamSynergy(t))}${t.goal?` · 구단주 목표: ${GOAL_KO[t.goal]}`:''}</p><p class="hint">전문 스태프가 밴픽·분석·육성·회복을 지원하며, 관리 구단의 최종 스포츠 결정은 플레이어가 내립니다.</p></section>
  <section><h3>팀 전술</h3><div class="tac">
    ${Object.keys(TAC_KO).map(k=>`<label><span>${TAC_KO[k]}<output>${tac[k]}</output></span><input type="range" min="0" max="100" value="${tac[k]}" data-tac="${k}"></label>`).join('')}
  </div></section>
  ${financePanel(t)}
  ${DB.world?.phase==='season'?`<section><h3>공식전·스크림 일정</h3><p class="hint">오늘 ${esc(DB.worldDate)} · ${officialBookedTeams(DB).has(t.id)?'공식 경기 예정/진행 · 스크림 불가':scrimReadiness(DB,t).ok?'스크림 가능 ('+scrimReadiness(DB,t).availableSlots.map(x=>x==='afternoon'?'오후':'저녁').join('·')+') · 잔여 '+scrimReadiness(DB,t).remaining+'세트':esc(scrimReadiness(DB,t).reason)} · 양팀 모두 같은 연습 시간이 비어야 하며, 7일 내 공식전 상대는 피하고 전력 격차·연패·자신감 회복 목적을 반영해 상호 수락해야 편성됩니다.</p><p class="hint">다음 공식전: ${esc(nextTeamMatch(DB,t.id)?.date||'미정')} / 최근 스크림: ${(t.scrimLog||[]).slice(-4).reverse().map(x=>esc(x.date)+' '+(x.slot==='afternoon'?'오후':x.slot==='evening'?'저녁':'연습')+' '+esc(DB.teams[x.opponent]?.short||x.opponent)+' '+x.games+'세트'+(x.purpose?' · '+esc(x.purpose):'')).join(' · ')||'없음'}</p></section>`:''}
  ${mineOrg?rosterPlanPanel(t):''}
  ${(()=>{const r=trainingRecommendation(DB,t),ko={light:'가볍게',normal:'보통',high:'강하게'};return `<p class="hint">추천: ${ko[r.intensity]} 훈련 · ${r.next?`다음 공식전 ${r.days}일 전`:'공식전 일정 없음'} · 평균 피로 ${Math.round(r.fat)} / 컨디션 ${Math.round(r.cond)}</p>`})()}
  <section><h3>훈련 배분 <small class="hint" id="trleft">남은 포인트 ${TRAIN_POINTS-['mechanical','laning','combat','macro','mental'].reduce((x,k)=>x+(+tr[k]||0),0)} / ${TRAIN_POINTS}</small></h3>${mineOrg?`<label>훈련 강도<select id="trint"><option value="light"${tr.intensity==='light'?' selected':''}>가볍게 · 회복 우선</option><option value="normal"${!tr.intensity||tr.intensity==='normal'?' selected':''}>보통 · 균형</option><option value="high"${tr.intensity==='high'?' selected':''}>강하게 · 성장 우선</option></select></label>`:`<p class="hint">훈련 강도: ${tr.intensity==='high'?'강하게':tr.intensity==='light'?'가볍게':'보통'}</p>`}<div class="tac">
    ${Object.keys(ATTR_GROUPS).map(g=>`<label><span>${GROUP_KO[g]}<output>${tr[g]}</output></span><input type="range" min="0" max="${TRAIN_POINTS}" value="${tr[g]}" data-tr="${g}"></label>`).join('')}
  </div>${mineOrg?'<div class="controls"><button class="primary" id="sqapply">변경사항 적용</button><button class="ghost" id="sqdiscard">변경 취소</button><span class="hint">주전·역할·전술·훈련을 여러 개 조정한 뒤 한 번에 적용합니다.</span></div>':''}<p class="hint">훈련 포인트는 총 ${TRAIN_POINTS}점입니다. 한 영역에 몰면 그 영역은 크게 오르지만 나머지는 덜 오르거나 떨어지고, 배분하지 않은 포인트는 버려집니다. 한 시즌에 영역별로 오를 수 있는 폭과, 잠재력보다 한참 높게 오르는 것에도 한계가 있습니다.</p>
  <div class="fin">${(()=>{const f=ensureFacilities(t),names={training:'훈련',analysis:'분석',recovery:'회복',youth:'유소년'};return Object.keys(names).map(k=>`<div><span>${names[k]} 시설</span><b>${f[k]} / 5</b><small>구단 자동 관리 </small></div>`).join('')})()}</div><p class="hint">훈련·유소년 시설은 성장, 분석 시설은 상대/메타 분석, 회복 시설은 피로 회복에 직접 적용됩니다. 연 유지비 ${money(facilityUpkeep(DB,t))}</p></section>
  <section><h3>로스터</h3><div class="scroll"><table class="roster"><thead><tr><th>포지션</th><th>선수</th><th>경기 슬롯</th><th>역할</th><th>만족도</th><th>나이</th><th>종합</th><th>성장 여지</th><th>명성</th><th>시장가치</th><th>폼</th><th>컨디션</th><th>경기 감각</th><th>피로</th><th>사기</th><th>연봉</th><th>계약</th>${Object.keys(ATTR_GROUPS).map(g=>`<th>${GROUP_KO[g]}</th>`).join('')}</tr></thead><tbody>
    ${ps.map(p=>{const st=pState(p);ensureSatisfaction(p);const shownRole=edit?.roles[p.id]||p.rosterRole||recommendedRosterRole(DB,p,t),lineupMap=edit?.starters||t.depthChart||{},assignedRole=ROLES.find(r=>lineupMap[r]===p.id)||'',roleCtl=mineOrg?`<select data-srole="${p.id}" aria-label="${esc(p.name)} 로스터 역할">${SQUAD_ROLES.map(r=>`<option value="${r}"${shownRole===r?' selected':''}>${SQUAD_ROLE_KO[r]}</option>`).join('')}</select>`:SQUAD_ROLE_KO[p.rosterRole||recommendedRosterRole(DB,p,t)],starterCtl=mineOrg?`<select data-lineup-player="${p.id}" aria-label="${esc(p.name)} 경기 포지션"><option value="">후보</option>${ROLES.map(r=>`<option value="${r}"${assignedRole===r?' selected':''}>${ROLE_KO[r]} · 적합 ${playerRoleRating(p,r)}</option>`).join('')}</select>`:(assignedRole?ROLE_KO[assignedRole]:'후보');return `<tr data-p="${p.id}" class="${OPEN_P===p.id?'open':''}"><td><span class="role">${ROLE_KO[p.role]}</span></td><td><button type="button" class="roster-open" data-p-open="${esc(p.id)}" aria-expanded="${OPEN_P===p.id}" aria-controls="pdetail">${esc(p.name)}</button>${assignedRole?'':' <small class="hint">후보</small>'}</td><td>${starterCtl}</td><td>${roleCtl}</td><td class="num ${p.satisfaction<35?'lo':p.satisfaction>=70?'hi':''}">${Math.round(p.satisfaction)}<small class="hint"> ${satisfactionLabel(p.satisfaction)}</small>${p.wantsOut?' <span class="lo">이적요청</span>':''}</td><td class="num">${p.age}</td><td>${ovrTag(obsOvr(DB,p))}${knowledge(DB,p)<100?'<small class="hint">?</small>':''}</td><td>${potText(p)}</td><td class="num">${p.reputation??'—'}</td><td class="num">${money(playerMarketValue(DB,p))}</td><td class="num">${st.form>=3?'<span class="hi">▲</span>':st.form<=-3?'<span class="lo">▼</span>':'–'}</td><td class="num">${Math.round(st.condition)}</td><td class="num">${Math.round(st.sharpness)}</td><td class="num">${Math.round(st.fatigue)}</td><td class="num ${st.morale<35?'lo':''}">${Math.round(st.morale)}${p.wantsOut?' 이적요청':''}</td><td class="num">${p.contract?money(p.contract.salary):'—'}</td><td class="num">${p.contract?'~'+p.contract.until:'—'}</td>${Object.keys(ATTR_GROUPS).map(g=>`<td>${ovrTag(grpAvg(p,g,knowledge(DB,p)))}</td>`).join('')}</tr>`}).join('')}
  </tbody></table></div><p class="hint">주포지션은 선수의 전문 역할 표시이며 출전 자격 제한이 아닙니다. 등록 선수 5명을 TOP/JGL/MID/ADC/SUP 경기 슬롯에 자유롭게 배치할 수 있습니다. 선수를 누르면 세부 능력치, 챔피언 폭, 커리어가 열립니다.${mineOrg?'':` 스카우팅 정보 ${kAvg}% — 정보가 적을수록 실제와 다르게 보입니다.`}</p>${DB.world&&!mineOrg?`<div class="controls"><button class="ghost" id="scoutT">이 팀 집중 스카우팅 (${money(0.5*psOf(DB,DB.teams[managedTeamId(DB)].region))})</button><span id="scmsg" class="hint"></span></div>`:''}</section>
  <div id="pdetail">${OPEN_P&&DB.players[OPEN_P]&&DB.players[OPEN_P].team===SQUAD?playerDetail(DB.players[OPEN_P]):''}</div>${mineOrg?scoutingSearchBlock():''}`;
}
function bindSquad(){
  const ti=$('#trint');if(ti)ti.onchange=e=>{const d=squadEditState(DB.teams[SQUAD_EDIT.teamId]);d.training.intensity=e.target.value;d.dirty=true};
  $('#sq').onchange=e=>{const next=DB.teams[e.target.value],same=SQUAD_EDIT&&parentTeamOf(DB,next)?.id===SQUAD_EDIT.parentId;if(!same)SQUAD_EDIT=null;SQUAD=e.target.value;OPEN_P=null;nav()};
  if($('#sqapply'))$('#sqapply').onclick=applySquadEdit;if($('#sqdiscard'))$('#sqdiscard').onclick=discardSquadEdit;
  document.querySelectorAll('[data-squad-dst]').forEach(el=>el.onchange=e=>{e.stopPropagation();const d=squadEditState(DB.teams[SQUAD]);d.rosterPlan.assignments[el.dataset.squadDst]=el.value;d.dirty=true;navKeepScroll()});
  if($('#scoutT'))$('#scoutT').onclick=()=>{const m=scoutPlayers(DB,DB.teams[SQUAD].roster,35,0.5*psOf(DB,DB.teams[managedTeamId(DB)].region));saveDB();nav();$('#scmsg')&&($('#scmsg').textContent=m)};
  document.querySelectorAll('[data-lineup-player]').forEach(el=>{el.onclick=e=>e.stopPropagation();el.onchange=e=>{e.stopPropagation();const d=squadEditState(DB.teams[SQUAD]),pid=el.dataset.lineupPlayer,next=el.value;for(const r of ROLES)if(d.starters[r]===pid)delete d.starters[r];if(next)d.starters[next]=pid;d.dirty=true;navKeepScroll()}});
  document.querySelectorAll('[data-srole]').forEach(el=>{el.onclick=e=>e.stopPropagation();el.onchange=e=>{e.stopPropagation();const p=DB.players[el.dataset.srole];if(p){const d=squadEditState(DB.teams[SQUAD]);d.roles[p.id]=el.value;d.dirty=true}}});
  document.querySelectorAll('[data-role-convert]').forEach(b=>b.onclick=e=>{e.stopPropagation();const r=proposeRoleConversion(DB,b.dataset.roleConvert,b.dataset.targetRole,'manager');MSG=r.reason;saveDB();navKeepScroll()});
  document.querySelectorAll('[data-role-convert-cancel]').forEach(b=>b.onclick=e=>{e.stopPropagation();const r=cancelRoleConversion(DB,b.dataset.roleConvert,'manager');MSG=r.reason;saveDB();navKeepScroll()});
  document.querySelectorAll('[data-tac]').forEach(el=>el.oninput=el.onchange=e=>{const k=el.dataset.tac;const d=squadEditState(DB.teams[SQUAD]);d.tactics[k]=+el.value;d.dirty=true;if(el.previousElementSibling)el.previousElementSibling.querySelector('output').textContent=el.value});
  document.querySelectorAll('[data-tr]').forEach(el=>el.oninput=()=>{const t=DB.teams[SQUAD],d=squadEditState(t);const k=el.dataset.tr;
    const others=Object.entries(d.training).filter(([g])=>g!==k).reduce((s,[,v])=>s+v,0), v=Math.min(+el.value,TRAIN_POINTS-others);
    el.value=v;d.training[k]=v;d.dirty=true;el.previousElementSibling.querySelector('output').textContent=v;$('#trleft').textContent=`남은 포인트 ${TRAIN_POINTS-others-v} / ${TRAIN_POINTS}`});
  const scRefresh=()=>{SCOUTSET.region=$('#screg')?.value||SCOUTSET.region;SCOUTSET.role=$('#scrole')?.value||SCOUTSET.role;SCOUTSET.contract=$('#sccontract')?.value||SCOUTSET.contract;SCOUTSET.competition=$('#sccomp')?.value||SCOUTSET.competition;SCOUTSET.undervalued=!!$('#scunder')?.checked;SCOUTSET.q=$('#scq')?.value||'';nav()};
  for(const id of ['#screg','#scrole','#sccontract','#sccomp','#scunder','#scq'])if($(id))$(id).onchange=scRefresh;
  document.querySelectorAll('[data-scout]').forEach(b=>b.onclick=e=>{e.stopPropagation();MSG=scoutPlayers(DB,[b.dataset.scout],20,.1*psOf(DB,managedTeam(DB).region));saveDB();navKeepScroll()});
  if($('#scall'))$('#scall').onchange=e=>document.querySelectorAll('[data-scout-select]').forEach(x=>x.checked=e.target.checked);
  if($('#scbatch'))$('#scbatch').onclick=()=>{const ids=[...document.querySelectorAll('[data-scout-select]:checked')].slice(0,10).map(x=>x.dataset.scoutSelect);if(!ids.length){MSG='관찰할 선수를 선택하세요';navKeepScroll();return}MSG=scoutPlayers(DB,ids,20,.1*psOf(DB,managedTeam(DB).region)*ids.length);saveDB();navKeepScroll()};
  document.querySelectorAll('[data-p-open]').forEach(button=>button.onclick=()=>{
    const playerId=button.dataset.pOpen;
    OPEN_P=OPEN_P===playerId?null:playerId;
    nav();
    const restored=[...document.querySelectorAll('[data-p-open]')].find(el=>el.dataset.pOpen===playerId);
    restored?.focus();
    const detail=$('#pdetail');
    if(OPEN_P&&detail)detail.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  });
}
// ---------- 몬테카를로 ----------
