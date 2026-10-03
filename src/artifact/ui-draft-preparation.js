// Live draft presentation owns no lineup, score coefficient or purchase/match writer.
function draftUiPreparationContent(){
  if(!DRAFT_UI)return '';
  const s=DRAFT_UI.state,report=draftPreparationReport(s,DRAFT_UI.playerSide,{role:DRAFT_UI.filter==='ALL'?null:DRAFT_UI.filter}),
    reasons={'no-authority':'이 구단의 내부 후보 비교를 볼 권한이 없습니다.',complete:'밴픽이 끝났습니다.',
      'other-turn':'우리 팀의 픽 차례에 후보를 비교할 수 있습니다.','ban-turn':'픽 단계에서 현재 조합에 맞는 후보를 비교합니다.',
      'invalid-role':'유효한 포지션을 선택하세요.','missing-lineup':'현재 밴픽의 우리 선수 배치를 확인할 수 없습니다.'};
  if(report.reason)return `<section class="du-preparation"><b>현재 조합 후보 비교</b><p>${reasons[report.reason]}</p></section>`;
  const rows=report.rows.filter(x=>draftUiMatch(s.db.patch.champions[x.champ])),visible=rows.slice(0,12),
    labels=xs=>xs.map(id=>esc(championLabel(s.db,id))).join(' · ')||'아직 공개된 픽 없음';
  return `<details class="du-preparation" id="du-preparation-details" ${DRAFT_UI.infoTab==='preparation'||DRAFT_UI.preparationOpen?'open':''}><summary>현재 조합 후보 비교 · ${rows.length}명</summary>
    <p>${report.practice?'연습':'공식'} · 패치 ${esc(report.patch)}<br>우리 픽: ${labels(report.ownPicks)}<br>상대 공개 픽: ${labels(report.opponentPicks)}</p>
    <small>기존 밴픽 효용의 높은 순서입니다. 승리 확률이나 스태프 추천이 아니며 AI의 후보 제한·선택 변동은 반영하지 않습니다. 역할은 가능한 배치이고 최종 확정이 아닙니다. 검색·포지션 조건 중 상위 12명을 표시합니다.</small>
    <div class="scroll du-preparation-scroll"><table><thead><tr><th>후보 · 가능 배치</th><th>밴픽 효용 · 실제 기여</th></tr></thead><tbody>${visible.map(x=>{
      const f=x.best.factors,points=v=>draftUiSigned(Math.round(v*1000)/10);
      return `<tr><td><button data-du-preparation="${esc(x.champ)}">${esc(championLabel(s.db,x.champ))}</button><small>${x.fits.map(y=>ROLE_KO[y.role]).join(' · ')}<br>비교 기준: ${ROLE_KO[x.best.role]}</small></td>
        <td><b>${(x.best.score*100).toFixed(1)}</b><small>메타 ${points(f.meta)} · 숙련 ${points(f.mastery)}<br>조합 ${points(f.comp)} · 상성 ${points(f.counter)}<br>플렉스 ${points(f.flex)} · 시리즈 ${points(f.series)}<br>상성 입력: ${labels(x.best.opponentPicks)}</small></td></tr>`;
    }).join('')}</tbody></table></div>${rows.length?'':'<p role="status">검색·포지션 조건에 맞는 합법적인 픽 후보가 없습니다.</p>'}
    <small>후보를 누르면 기존 상세 분석을 엽니다. 픽 확정을 눌러야 선택이 반영됩니다. 상대 비공개 숙련·전술은 사용하지 않습니다.</small></details>`;
}
function draftUiPreparationSelect(champ){
  if(!DRAFT_UI)return false;
  const s=DRAFT_UI.state,report=draftPreparationReport(s,DRAFT_UI.playerSide,{role:DRAFT_UI.filter==='ALL'?null:DRAFT_UI.filter});
  if(report.reason||!report.rows.some(x=>x.champ===champ)||!draftValidateChoice(s,{champ,side:DRAFT_UI.playerSide}).ok)return false;
  DRAFT_UI.selected=champ;DRAFT_UI.infoTab='analysis';draftUiRender();
  const panel=$('#du-analysis');if(panel){panel.tabIndex=-1;panel.focus()}
  return true;
}
function draftUiPreparationBind(){
  const details=$('#du-preparation-details');if(details)details.ontoggle=()=>{if(DRAFT_UI)DRAFT_UI.preparationOpen=details.open};
  document.querySelectorAll('[data-du-preparation]').forEach(b=>b.onclick=()=>draftUiPreparationSelect(b.dataset.duPreparation));
}
