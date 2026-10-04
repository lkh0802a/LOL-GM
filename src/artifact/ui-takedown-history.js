// Presentation of archived public payouts only. No current-state reward calculations.
function renderRecordedTakedowns(p){
  if(!p.takedowns)return '<p class="hint">당시 처치 보상 내역이 저장되지 않았습니다.</p>';
  const t=p.takedowns,names=Object.fromEntries(p.sides.flatMap(s=>s.players.map(x=>[x[0],x[1]])));
  return `<details><summary>처치·지원 보상 (${t.events.length}건 / ${t.count}건)</summary><p class="hint">당시 실제 지급 내역입니다. 지원 설정값과 선수별 반올림 후 지급 합계는 다를 수 있습니다. 퀘스트 추가 보상은 별도로 표시합니다. 정확한 기여 거리나 실서버 보상 규칙을 뜻하지 않습니다.${t.count>24?' 중간 사건은 저장 크기를 제한하기 위해 생략했습니다.':''}</p>${t.events.length?`<ol>${t.events.map(e=>`<li><time>${fmtTime(e.minute,e.second)}</time> ${esc(names[e.victim])} 처치 · 지원 설정 ${e.assistPool} / 지급 ${e.assistPaid} 골드<ul>${e.payouts.map(x=>`<li>${esc(names[x.player])} · ${x.kind==='kill'?'처치':'지원'} ${x.gold} 골드 · ${x.xp} 경험치${x.questGold||x.questXp?` · 퀘스트 추가 ${x.questGold} 골드 / ${x.questXp} 경험치`:''}</li>`).join('')}</ul></li>`).join('')}</ol>`:'<p class="empty">이 경기에서 판정된 처치 보상이 없습니다.</p>'}</details>`;
}
