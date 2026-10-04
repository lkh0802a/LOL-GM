// Presentation of archived public payouts only. No current-state reward calculations.
function renderRecordedTakedowns(p){
  if(!p.takedowns)return '<p class="hint">당시 처치 보상 내역이 저장되지 않았습니다.</p>';
  const t=p.takedowns,names=Object.fromEntries(p.sides.flatMap(s=>s.players.map(x=>[x[0],x[1]])));
  return `<details><summary>처치·지원 보상 (${t.events.length}건 / ${t.count}건)</summary><p class="hint">당시 실제 지급 내역입니다. 지원 설정값과 선수별 반올림 후 지급 합계는 다를 수 있습니다. 퀘스트 추가 보상은 별도로 표시합니다. 정확한 기여 거리나 실서버 보상 규칙을 뜻하지 않습니다.${t.count>24?' 중간 사건은 저장 크기를 제한하기 위해 생략했습니다.':''}</p>${t.events.length?`<ol>${t.events.map(e=>`<li><time>${fmtTime(e.minute,e.second)}</time> ${esc(names[e.victim])} 처치 · 지원 설정 ${e.assistPool} / 지급 ${e.assistPaid} 골드<ul>${e.payouts.map(x=>`<li>${esc(names[x.player])} · ${x.kind==='kill'?'처치':'지원'} ${x.gold} 골드 · ${x.xp} 경험치${x.questGold||x.questXp?` · 퀘스트 추가 ${x.questGold} 골드 / ${x.questXp} 경험치`:''}</li>`).join('')}</ul></li>`).join('')}</ol>`:'<p class="empty">이 경기에서 판정된 처치 보상이 없습니다.</p>'}</details>`;
}

// Archived reward interpretation; no present-state adjudication or mutation.
function renderRecordedAdjudicationBasis(p){
  return `${p.combatRoundBasis==='prepared-round-budget-v1'?'<p class="hint">교전은 라운드별로 피해를 준비해 순서대로 처리합니다. 같은 라운드에서 체력이 소진돼도 이미 준비된 피해는 남고, 다음 라운드의 새 공격에는 참여하지 않습니다. 정확한 스킬 시전·물리적 동시 판정은 아닙니다.</p>':''}<p class="hint">${p.damageBasis==='effective-aggregate-v1'?'피해량은 남은 체력 예산 안에서 집계한 값이며, 실제 스킬별 피해 판정은 아닙니다.':'이전 기록의 피해 집계 방식은 저장되지 않았습니다. 현재 계산으로 바꾸지 않습니다.'}</p>${p.structureSelectionBasis==='progress-seeded-ties-v1'?'<p class="hint">구조물 대상은 공격이 허용된 라인의 진행도를 우선하고, 동률은 당시 시드로 선택했습니다. 정확한 이동·거리 판정은 아닙니다.</p>':''}`;
}

// Actual archived macro participants, never current ability/private evidence.
function renderRecordedMacroPicks(p){
  if(!p.macroPicks)return '<p class="hint">당시 끊기 참여 기록이 저장되지 않았습니다.</p>';
  const m=p.macroPicks,names=Object.fromEntries(p.sides.flatMap(s=>s.players.map(x=>[x[0],x[1]])));
  return `<details><summary>끊기 교전 참여 (${m.events.length}건 / ${m.count}건)</summary><p class="hint">실제 끊기 교전의 선택·합류 기록입니다. 공격 측은 살아 있는 후보에서 시드로 최대 3명을 선택했습니다. 실패한 끊기 시도·정확한 이동 거리·개별 스킬 도달 여부를 뜻하지 않습니다.${m.count>24?' 중간 사건은 저장 크기를 제한하기 위해 생략했습니다.':''}</p>${m.events.length?`<ol>${m.events.map(e=>`<li><time>${fmtTime(e.minute,e.second)}</time> ${LANE_KO[e.lane]} · 대상 ${esc(names[e.target])} · 공격 참여 ${e.hunters.map(id=>esc(names[id])).join(', ')} · 방어 참여 ${e.defenders.map(id=>esc(names[id])).join(', ')} · 교전 승리 ${esc(p.sides[e.winner].name)}</li>`).join('')}</ol>`:'<p class="empty">판정된 끊기 교전이 없습니다.</p>'}</details>`;
}
