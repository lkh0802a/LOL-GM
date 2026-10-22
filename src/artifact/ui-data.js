// ===== LOL GM: Save-slot / import-export UI =====
function saveStatusText(){
  const phase=typeof currentSaveStatus==='function'?currentSaveStatus():SAVEFAIL?'failed':'idle';
  return phase==='saved'?'마지막 저장 확인'+(SAVE_STATUS.date?' · '+SAVE_STATUS.date:''):phase==='saving'?'저장 중입니다. 완료를 확인한 뒤 종료하세요.':phase==='pending'?(SAVEFAIL?'저장 재시도 대기 중 · 원본을 내보내 보관하세요.':'변경 사항 저장 대기 중'):phase==='failed'?'현재 게임 저장을 확인하지 못했습니다. 원본을 내보내 보관하세요.':'자동 저장 사용';
}
function updateSaveStatus(){
  const text=DB?saveStatusText():'';
  for(const node of document.querySelectorAll?.('[data-save-status]')||[]){node.textContent=text;node.classList?.toggle('warn',SAVEFAIL);node.classList?.toggle('hint',!SAVEFAIL)}
}
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
  const recover=$('#save-recovery');if(recover)recover.onclick=()=>{if(current())void openSaveRecovery()};
  const save=$('#save-now');let saving=false;
  if(save)save.onclick=async()=>{if(saving||!current())return;saving=true;save.disabled=true;try{await saveNow()}catch(e){console.error('LOL GM manual save failed',e)}finally{saving=false;if(current())save.disabled=false}};
  $('#ddownload').onclick=()=>{if(!current())return;try{const raw=packDB(DB),url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=`LOL-GM-저장-${DB.worldDate||DB.year||'게임'}.json`;link.click();URL.revokeObjectURL(url);msg('게임 파일 내보내기를 요청했습니다. 내려받은 파일을 보관하세요.')}catch(e){console.error('LOL GM save export failed',e);msg('파일을 내보내지 못했습니다. 원본 직접 보기에서 복사해 보관하세요.')} };
  let fileRead=0;
  $('#dchoose').onclick=()=>{if(current())$('#dfile').click()};
  $('#dfile').onclick=()=>{if(current())$('#dfile').value=''};
  $('#dfile').onchange=async()=>{if(!current())return;const input=$('#dfile'),file=input.files?.[0],run=++fileRead;if(!file)return;try{const raw=await file.text();if(!current()||run!==fileRead||input.files?.[0]!==file)return;$('#djson').value=raw;msg('파일을 읽었습니다. 가져온 원본 적용을 누르면 현재 게임에 적용합니다.');$('#dapply').focus?.({preventScroll:true})}catch(e){console.error('LOL GM save file read failed',e);if(current()&&run===fileRead)msg('게임 파일을 읽지 못했습니다. 현재 게임과 원본은 유지됩니다.')} };
  $('#dshow').onclick=()=>{if(!current())return;$('#djson').value=packDB(DB);msg('저장 원본입니다. 그대로 복사해 보관하세요.')};
  $('#dapply').onclick=async()=>{
    if(!current())return;
    const raw=$('#djson').value,db=DB,slot=SLOT,key=STORE,unchanged=saveLibraryCurrent(true),button=$('#dapply');let generation=SAVE_STATUS,protectedCopy=false;
    const valid=()=>unchanged()&&STORE===key&&SAVE_STATUS===generation&&$('#djson').value===raw;
    try{
      const d=unpackDB(raw);if(!d.teams||!d.players||!d.patch||!d.regions||d.version!==SAVE_VERSION)throw Error('게임 저장 구조 또는 버전이 다릅니다.');
      const startup=typeof START_UI!=='undefined'&&START_UI.active;
      SLOT_SWITCHING=true;button.disabled=true;
      await protectSaveRecovery(key,raw);protectedCopy=true;if(!valid())throw Error('가져오기 문맥이 바뀌었습니다.');
      cancelUiTasks();clearTimeout(saveTimer);saveTimer=null;SAVE_PENDING=null;
      const outgoing=persistWorldSnapshot(db,slot,key);generation=SAVE_STATUS;
      if(!await outgoing)throw Error('현재 게임 저장을 확인하지 못했습니다.');
      if(!valid())throw Error('현재 게임 문맥이 바뀌었습니다.');
      if(!await persistWorldSnapshot(d,slot,key))throw Error('가져온 원본 저장을 확인하지 못했습니다.');
      if(!valid())throw Error('현재 게임 문맥이 바뀌었습니다.');
      await releaseSaveProtection(key,raw);if(!valid())throw Error('현재 게임 문맥이 바뀌었습니다.');
      DB=d;SLOT_SWITCHING=false;SAVEFAIL=false;const status=beginSaveStatus(DB,slot,key,'saved');status.date=DB.worldDate||String(DB.year||'');resetUiForWorld();if(startup)START_UI={active:true,page:'load',error:''};nav();publishSaveStatus();const output=$('#dmsg');if(output)output.textContent='저장 확인 후 적용했습니다.';$('#dapply')?.focus?.({preventScroll:true});
    }catch(e){console.error('LOL GM save import failed',e);if(unchanged()&&STORE===key){const output=$('#dmsg');if(output)output.textContent='원본을 적용하지 않았습니다. '+e.message+(protectedCopy?' 가져온 원본은 저장 원본 복구의 보호 보관본에서 확인하세요.':' 현재 게임과 원본은 유지됩니다.');}}
    finally{SLOT_SWITCHING=false;if(unchanged())button.disabled=false}
  };
  $('#dcopy').onclick=()=>{if(!current())return;const v=$('#djson').value||packDB(DB);navigator.clipboard&&navigator.clipboard.writeText(v).then(()=>msg('복사했습니다.'),()=>msg('복사 권한이 없습니다. 저장 원본 보기에서 직접 선택해 복사하세요.'))};
  $('#dreset').onclick=()=>{if(!current())return;if(!confirm('현재 게임의 커리어와 기록이 모두 지워집니다. 계속할까요?')||!current())return;DB=buildWorld();resetUiForWorld();saveDB();navigateTo('season')};
}
