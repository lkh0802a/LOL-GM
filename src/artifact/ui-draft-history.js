// Archived evidence rendering never recalculates today's private draft scores.
function renderRecordedDraftReview(db,rec,game){
  const clubs=[game.blue,game.red].filter(id=>managerControlsSquad(db,db.teams[id])),sections=[];
  for(const team of clubs){
    const report=recordedDraftReview(db,rec,game,team);if(!report.allowed)continue;
    if(report.reason){sections.push(`<p class="hint">${esc(db.teams[team].short)} · ${report.reason==='not-recorded'?'당시 수동 밴픽 평가 기록이 없습니다. 현재 상태로 소급 계산하지 않습니다.':'평가 출처를 확인할 수 없습니다.'}</p>`);continue}
    const names=xs=>xs.map(id=>esc(championLabel(db,id))).join(' · ')||'없음';
    sections.push(`<details class="draft-history"><summary>${esc(db.teams[team].short)} · 당시 수동 밴픽 검토 ${report.rows.length}건</summary><p class="hint">선택 당시의 팀 내부 검토 기록입니다. 효용은 승리 확률이나 경기 결과의 인과 증명이 아니며 상대 비공개 자료를 사용하지 않습니다.</p>${report.rows.map(e=>`<article><h4>${e.turn+1}번째 선택 · ${esc(e.champName)}</h4><p>${esc(e.playerName)} · ${esc(e.date)} · 패치 ${esc(e.patch)} · 검토 역할 ${ROLE_KO[e.role]} · 최종 역할 ${e.finalRole?ROLE_KO[e.finalRole]:'기록 없음'}</p><p>우리 공개 픽: ${names(e.ownPicks)}<br>상대 공개 픽: ${names(e.opponentPicks)}<br>상성 입력: ${names(e.opponentRoles)}</p><p>${e.reasons.map(esc).join(' · ')}</p><p>당시 공식 표본 글로벌 ${e.meta.globalSample} · 지역 ${e.meta.regionalSample} · 메타 판단 신뢰 ${e.meta.confidence} (게임 지표)</p><div class="xf">${['meta','mastery','comp','counter','flex','series'].map((k,i)=>`<span>${['메타','숙련','조합','상성','플렉스','시리즈'][i]} ${e.factors[k].toFixed(3)}</span>`).join('')}<b>효용 ${e.factors.total.toFixed(3)}</b></div><button class="linklike" data-draft-history-team="${esc(team)}" data-draft-history-game="${game.n}" data-draft-history-turn="${e.turn}" data-draft-history-kind="champ">현재 챔피언 정보</button>${db.players[e.player]?.team===team?`<button class="linklike" data-draft-history-team="${esc(team)}" data-draft-history-game="${game.n}" data-draft-history-turn="${e.turn}" data-draft-history-kind="player">선수 정보</button>`:''}</article>`).join('')}</details>`);
  }
  return sections.length?`<section class="draft-history-review"><h3>기록된 밴픽 근거</h3>${sections.join('')}</section>`:'';
}

function bindRecordedDraftReview(root,rec){
  root.querySelectorAll('[data-draft-history-team]').forEach(b=>b.onclick=()=>{
    const d=b.dataset,game=rec.games.find(g=>g.n===Number(d.draftHistoryGame));
    const report=recordedDraftReview(DB,rec,game,d.draftHistoryTeam),e=report.rows.find(x=>x.turn===Number(d.draftHistoryTurn));
    if(!e)return;
    if(d.draftHistoryKind==='champ'&&DB.patch.champions[e.champ]){PSET.champ=e.champ;navigateTo('patch')}
    if(d.draftHistoryKind==='player'&&DB.players[e.player]?.team===report.team){SQUAD=report.team;OPEN_P=e.player;navigateTo('squad')}
  });
}
