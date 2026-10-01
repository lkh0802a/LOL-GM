function localServicePanel(p){
  const e=p.localEligibility||{},s=e.service,options=localChoiceOptions(DB,p),
    allowed=['offseason','market'].includes(DB.world?.phase)&&p.team&&
      !playerActionAuthority(DB,'manager',DB.teams[p.team]);
  return `<details class="cfgcard"><summary>로컬 자격 · ${esc(DB.regions[playerActiveLocalRegion(p)]?.name||playerActiveLocalRegion(p))}</summary>
    <p>출신 로컬 ${esc(DB.regions[p.originLocalRegion]?.name||p.originLocalRegion)}</p>
    ${s?`<p>${esc(DB.regions[s.region]?.name||s.region)} 근속 ${s.seasons.length}/${s.rule.seasons}시즌 · ${s.days}/${s.rule.days}일 ${s.paused?'(정지)':''}</p>`:'<p class="hint">기록된 근속 진행도가 없습니다. 과거 근속을 추정해 추가하지 않습니다.</p>'}
    <p class="hint">FA는 진행도 보존·누적 정지, 같은 지역 임대는 누적, 다른 지역 임대는 양 지역 누적 정지입니다. 취득 자격은 자동 활성화하지 않습니다.</p>
    ${e.pending?`<p>다음 ${e.pending.season}시즌 선택 · ${esc(DB.regions[e.pending.region]?.name||e.pending.region)}</p>`:''}
    ${allowed&&options.length?`<div class="controls"><label>다음 시즌 로컬<select data-local-region="${p.id}">${options.map(rid=>`<option value="${rid}">${esc(DB.regions[rid]?.name||rid)}</option>`).join('')}</select></label><button class="ghost" data-local-choice="${p.id}">선수 전환 의향 확인</button></div>`:''}</details>`;
}
function bindLocalServiceControls(){
  document.querySelectorAll('[data-local-choice]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();const p=DB.players[b.dataset.localChoice],region=document.querySelector(`[data-local-region="${p.id}"]`).value,
      preview=previewWorldAction(DB,{type:'player.local-choice',actor:'manager',pid:p.id,region});
    if(!preview.ok){MSG=preview.errors.join(' · ');navKeepScroll();return}
    if(!confirm(p.name+' · '+(DB.regions[region]?.name||region)+' 로컬을 '+preview.command.season+
      '시즌부터 선택할까요?\n현재 시즌 자격은 유지됩니다. 포기한 취득 로컬은 다시 근속해야 합니다.'))return;
    const result=applyWorldAction(DB,preview);MSG=result.ok?'다음 시즌 로컬 선택을 기록했습니다':result.errors.join(' · ');
    if(result.ok)saveDB();navKeepScroll();
  });
}
