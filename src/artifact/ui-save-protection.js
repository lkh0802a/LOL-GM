// Preserve the selected recovery source before any rotating checkpoint writes.
function saveProtectionKey(key){if(!key.startsWith(STORE_BASE)||!SAVE_SLOTS.includes(key.slice(STORE_BASE.length)))throw Error('올바르지 않은 저장 위치입니다.');return key+'-restore'}
async function saveProtectionIDB(key,raw,remove=false){
  const db=await idb();return new Promise((resolve,reject)=>{
    let done=false,tx,changed=false;
    const finish=(ok,value)=>{if(done)return;done=true;clearTimeout(timer);try{db.close()}catch(e){}ok?resolve(value):reject(value)};
    const fail=error=>{try{tx?.abort()}catch(e){}finish(false,error)};
    const timer=setTimeout(()=>fail(Error('복구 보관소 응답을 확인하지 못했습니다.')),800);
    try{
      tx=db.transaction('kv','readwrite');const store=tx.objectStore('kv'),read=store.get(key);
      read.onerror=()=>fail(read.error||Error('복구 원본을 읽지 못했습니다.'));
      read.onsuccess=()=>{try{
        if(remove){if(read.result===raw){store.delete(key);changed=true}}
        else if(read.result!==null&&read.result!==undefined&&read.result!==raw){const error=Error('다른 보호 보관 원본이 있습니다. 해당 원본을 먼저 확인하거나 파일로 보관한 뒤 보호를 해제하세요.');error.recoveryConflict=true;fail(error)}
        else{store.put(raw,key);changed=true}
      }catch(e){fail(e)}};
      tx.oncomplete=()=>finish(true,changed);tx.onabort=()=>finish(false,tx.error||Error('복구 원본 보관이 중단됐습니다.'));tx.onerror=()=>finish(false,tx.error||Error('복구 원본을 보관하지 못했습니다.'));
    }catch(e){fail(e)}
  });
}
async function protectSaveRecovery(key,raw){
  const target=saveProtectionKey(key);let readable=true,local=null;
  try{local=localStorage.getItem(target)}catch(e){readable=false}
  if(readable&&local!==null&&local!==raw)throw Error('다른 보호 보관 원본이 있습니다. 먼저 파일로 보관한 뒤 보호를 해제하세요.');
  try{await saveProtectionIDB(target,raw);return {key,raw}}
  catch(e){if(e.recoveryConflict)throw e;if(!readable)throw e;const current=localStorage.getItem(target);if(current!==null&&current!==raw)throw Error('보호 보관 원본이 바뀌었습니다. 다시 확인하세요.');localStorage.setItem(target,raw);return {key,raw}}
}
async function releaseSaveProtection(key,raw){
  const target=saveProtectionKey(key);let removed=0,errors=0;
  try{if(localStorage.getItem(target)===raw){localStorage.removeItem(target);removed++}}catch(e){errors++}
  if(!DIRECT_FILE_PREVIEW&&typeof indexedDB!=='undefined')try{if(await saveProtectionIDB(target,raw,true))removed++}catch(e){errors++}
  return {removed,errors};
}

function showSaveProtectionRelease({row,key,root,show,frame,message,back,refresh,setBusy}){
    show('<h3>보호 보관본 해제</h3><p>이 보호용 추가 사본만 지웁니다. 현재 게임과 일반 보관 원본은 유지됩니다. 먼저 이 원본을 파일로 보관하고 확인하세요.</p><button id="save-protection-export" type="button">이 원본 파일로 보관</button><label><input id="save-protection-confirm" type="checkbox">내보낸 원본 파일을 확인했습니다.</label><button id="save-protection-release" type="button">보호용 추가 사본 해제</button><button id="save-protection-back" type="button">목록으로 돌아가기</button>');
    const current=frame();
    root.querySelector('#save-protection-export').onclick=()=>{if(current())try{exportSaveRecovery(row);message('내려받은 파일을 확인하세요.')}catch(e){message('파일을 내보내지 못했습니다.')}};
    root.querySelector('#save-protection-back').onclick=()=>{if(current())back()};
    root.querySelector('#save-protection-release').onclick=async()=>{if(!current()||!root.querySelector('#save-protection-confirm').checked)return;setBusy(true);try{const result=await releaseSaveProtection(key,row.raw);if(result.errors)message('해제 상태를 확인하지 못했습니다. 다시 확인하세요.');else{setBusy(false);if(current())await refresh()}}finally{setBusy(false)}};
}
