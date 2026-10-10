// ===== LOL GM: Save-slot / import-export UI =====
function slotMeta(n){try{return JSON.parse(localStorage.getItem(STORAGE_NS+'-meta-'+n)||'null')}catch(e){return null}}
function viewData(){
  return renderSavedGames()+`<details class="cfgcard"><summary>저장 원본 관리</summary>
  <p>게임 전체를 파일로 보관하거나 다른 기기에서 가져올 수 있습니다. 기존 원본을 보관한 뒤 적용하세요.</p>
  <section class="controls"><button class="ghost" id="ddownload">게임 파일 내보내기</button><button class="ghost" id="dchoose">게임 파일 선택</button><input id="dfile" type="file" accept="application/json,.json" hidden></section>
  <p id="dmsg" class="hint" role="status"></p>
  <button class="primary" id="dapply">가져온 원본 적용</button>
  <details><summary>원본 직접 보기·편집</summary>
  <section class="controls"><button class="ghost" id="dshow">저장 원본 보기</button><button class="ghost" id="dcopy">원본 복사</button></section>
  <textarea id="djson" spellcheck="false" aria-label="게임 저장 원본" placeholder="저장 원본 보기를 누르거나 가져온 원본을 붙여 넣으세요"></textarea>
  </details>
  <details><summary>현재 게임 초기화</summary><p class="warn">현재 게임의 커리어와 기록을 지웁니다. 원본을 먼저 내보내 보관하세요.</p><button class="ghost" id="dreset">현재 게임 초기화</button></details></details>`;
}
function bindData(){
  const current=saveLibraryCurrent();
  const msg=t=>{if(!current())return;const output=$('#dmsg');if(output)output.textContent=t};
  const loadSavedGame=async b=>{
    if(!current())return;
    const result=await switchSaveSlot(b.dataset.slot);
    if(!result.ok&&result.error){console.error('LOL GM save load failed',result.error);const text='저장된 게임을 불러오지 못했습니다. 현재 게임과 원본은 유지됩니다. 저장 목록을 다시 확인하세요.';if(current()){const output=$('#save-load-status');if(output)output.textContent=text;}msg(text);}
  };
  document.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>loadSavedGame(b));
  bindSavedGames(current,loadSavedGame);
  $('#ddownload').onclick=()=>{if(!current())return;try{const raw=packDB(DB),url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=`LOL-GM-저장-${DB.worldDate||DB.year||'게임'}.json`;link.click();URL.revokeObjectURL(url);msg('게임 파일 내보내기를 요청했습니다. 내려받은 파일을 보관하세요.')}catch(e){console.error('LOL GM save export failed',e);msg('파일을 내보내지 못했습니다. 원본 직접 보기에서 복사해 보관하세요.')} };
  let fileRead=0;
  $('#dchoose').onclick=()=>{if(current())$('#dfile').click()};
  $('#dfile').onclick=()=>{if(current())$('#dfile').value=''};
  $('#dfile').onchange=async()=>{if(!current())return;const input=$('#dfile'),file=input.files?.[0],run=++fileRead;if(!file)return;try{const raw=await file.text();if(!current()||run!==fileRead||input.files?.[0]!==file)return;$('#djson').value=raw;msg('파일을 읽었습니다. 가져온 원본 적용을 누르면 현재 게임에 적용합니다.');$('#dapply').focus?.({preventScroll:true})}catch(e){console.error('LOL GM save file read failed',e);if(current()&&run===fileRead)msg('게임 파일을 읽지 못했습니다. 현재 게임과 원본은 유지됩니다.')} };
  $('#dshow').onclick=()=>{if(!current())return;$('#djson').value=packDB(DB);msg('저장 원본입니다. 그대로 복사해 보관하세요.')};
  $('#dapply').onclick=()=>{if(!current())return;try{const d=unpackDB($('#djson').value);if(!d.teams||!d.players||!d.patch||!d.regions)throw new Error('teams, players, patch, regions 항목이 필요합니다');
    if(d.version!==SAVE_VERSION)throw new Error(`이 세이브는 현재 버전(${SAVE_VERSION})과 호환되지 않습니다`);const startup=typeof START_UI!=='undefined'&&START_UI.active;DB=d;resetUiForWorld();if(startup)START_UI={active:true,page:'load',error:''};saveDB();nav();const output=$('#dmsg');if(output)output.textContent='적용했습니다.';$('#dapply')?.focus?.({preventScroll:true})}catch(e){console.error('LOL GM save import failed',e);msg('저장 원본을 적용하지 못했습니다. 현재 게임은 유지됩니다. 원본 내용과 게임 버전을 확인하세요.');}};
  $('#dcopy').onclick=()=>{if(!current())return;const v=$('#djson').value||packDB(DB);navigator.clipboard&&navigator.clipboard.writeText(v).then(()=>msg('복사했습니다.'),()=>msg('복사 권한이 없습니다. 저장 원본 보기에서 직접 선택해 복사하세요.'))};
  $('#dreset').onclick=()=>{if(!current())return;if(!confirm('현재 게임의 커리어와 기록이 모두 지워집니다. 계속할까요?')||!current())return;DB=buildWorld();resetUiForWorld();saveDB();navigateTo('season')};
}
