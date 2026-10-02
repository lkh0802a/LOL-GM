function officeOpinionPanel(R){
  const t=managedTeam(DB);if(!t||t.parent||t.active===false||(t.division||1)!==1||t.region!==R.id)return '';
  const current=clubFormatPreferences(DB,t),label=(field,v)=>field==='splits'?v+'스플릿':
    field==='playoffBo'?'Bo'+v:SPLIT_STANDINGS_MODES[v];
  return `<details class="cfgcard"><summary>내 구단의 리그 운영 의견</summary><div class="controls">
    ${Object.entries(OFFICE_OPINION_FIELDS).map(([field,values])=>`<label>${OFFICE_OPINION_LABELS[field]}
      <select data-office-field="${field}" data-office-club="${t.id}" aria-label="${OFFICE_OPINION_LABELS[field]} 의견">
      <option value="">의견 없음</option>${values.map(v=>`<option value="${v}" ${current[field]===v?'selected':''}>${esc(label(field,v))}</option>`).join('')}</select></label>`).join('')}
    <button class="ghost" data-office-opinion="${t.id}">의견 제출</button></div>
    <p class="hint">다음 시즌 운영 논의에 반영됩니다. 최종 결정은 사무국이 내립니다.</p></details>`;
}
function bindOfficeOpinionControls(){
  document.querySelectorAll('[data-office-opinion]').forEach(b=>b.onclick=()=>{
    const values={};document.querySelectorAll(`[data-office-club="${b.dataset.officeOpinion}"]`).forEach(s=>{
      if(s.value)values[s.dataset.officeField]=s.dataset.officeField==='standingsMode'?s.value:Number(s.value);
    });
    const preview=previewWorldAction(DB,{type:'office.opinion',actor:'manager',teamId:b.dataset.officeOpinion,values});
    if(!preview.ok){MSG=(preview.errors||[]).join(' · ');navKeepScroll();return}
    if(!confirm('다음 시즌 리그 운영 의견을 제출할까요? 최종 결정은 사무국이 내립니다.'))return;
    const result=applyWorldAction(DB,preview);MSG=result.ok?'구단 운영 의견을 제출했습니다':(result.errors||[]).join(' · ');
    if(result.ok)saveDB();navKeepScroll();
  });
}
