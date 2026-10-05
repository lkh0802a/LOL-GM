// ===== LOL GM: Save-slot / import-export UI =====
function slotMeta(n){try{return JSON.parse(localStorage.getItem(STORAGE_NS+'-meta-'+n)||'null')}catch(e){return null}}
function viewData(){
  return `<section class="teamhead"><h2>저장 슬롯</h2><p>커리어를 10개까지 따로 저장할 수 있습니다. 진행 상황은 자동 저장됩니다.</p></section>
  <section class="cfgs">${SAVE_SLOTS.map(n=>{const m=slotMeta(n);return `<div class="cfgcard compact ${n===SLOT?'cur':''}"><div class="cfghead"><b>슬롯 ${n}${n===SLOT?' · 사용 중':''}</b>${n===SLOT?'':`<button class="ghost sm2" data-slot="${n}">불러오기</button>`}</div><p class="hint">${m&&m.team?`${esc(m.team)} · ${m.year} 시즌`:'슬롯 정보 없음 — 불러올 때 저장 데이터를 확인합니다'}</p></div>`}).join('')}</section>
  <section class="teamhead"><h2>데이터 내보내기·가져오기</h2><p>선수, 팀, 챔피언, 패치, 기록이 모두 들어 있는 JSON입니다. 복사해 두었다가 다른 기기나 슬롯에 붙여 넣을 수 있습니다.</p></section>
  <section class="controls"><button class="ghost" id="dshow">JSON 열기</button><button class="primary" id="dapply">붙여 넣은 JSON 적용</button><button class="ghost" id="dcopy">복사</button><button class="ghost" id="dreset">이 슬롯 초기화</button></section>
  <p id="dmsg" class="hint" role="status"></p>
  <textarea id="djson" spellcheck="false" aria-label="월드 데이터 JSON" placeholder="JSON 열기를 누르거나 여기에 붙여 넣으세요"></textarea>`;
}
function bindData(){
  const renderId=UI_RENDER_ID,db=DB,slot=SLOT;
  const current=()=>DB===db&&SLOT===slot&&UI_RENDER_ID===renderId&&!SLOT_SWITCHING;
  const msg=t=>{if(!current())return;const output=$('#dmsg');if(output)output.textContent=t};
  document.querySelectorAll('[data-slot]').forEach(b=>b.onclick=async()=>{
    if(!current())return;
    const result=await switchSaveSlot(b.dataset.slot);
    if(!result.ok&&result.error)msg(result.error);
  });
  $('#dshow').onclick=()=>{if(!current())return;$('#djson').value=packDB(DB);msg('압축된 JSON입니다. 그대로 복사해 두면 됩니다.')};
  $('#dapply').onclick=()=>{if(!current())return;try{const d=unpackDB($('#djson').value);if(!d.teams||!d.players||!d.patch||!d.regions)throw new Error('teams, players, patch, regions 항목이 필요합니다');
    if(d.version!==SAVE_VERSION)throw new Error(`이 세이브는 현재 버전(${SAVE_VERSION})과 호환되지 않습니다`);const startup=typeof START_UI!=='undefined'&&START_UI.active;DB=d;resetUiForWorld();if(startup)START_UI={active:true,page:'load',error:''};saveDB();nav();const output=$('#dmsg');if(output)output.textContent='적용했습니다.';$('#dapply')?.focus?.({preventScroll:true})}catch(e){msg('적용하지 못했습니다 — '+e.message)}};
  $('#dcopy').onclick=()=>{if(!current())return;const v=$('#djson').value||packDB(DB);navigator.clipboard&&navigator.clipboard.writeText(v).then(()=>msg('복사했습니다.'),()=>msg('복사 권한이 없습니다. JSON 열기 후 직접 선택해서 복사하세요.'))};
  $('#dreset').onclick=()=>{if(!current())return;if(!confirm('이 슬롯의 커리어가 모두 지워집니다. 계속할까요?'))return;DB=buildWorld();resetUiForWorld();saveDB();navigateTo('season')};
}
