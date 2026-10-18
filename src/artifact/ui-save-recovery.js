// One focused recovery window; a candidate is never applied by selecting it.
async function openSaveRecovery(){
  if(!DB||SLOT_SWITCHING||UI_OVERLAY)return false;
  const db=DB,world=DB.world,manager=DB.manager,slot=SLOT,key=STORE,date=DB.worldDate,year=DB.year,team=managedTeamId(DB),view=VIEW,render=UI_RENDER_ID,startup=typeof START_UI!=='undefined'&&START_UI.active;
  let generation=SAVE_STATUS,dialog=null,busy=false,model=null,screen=0,reads=0;
  const base=()=>DB===db&&DB.world===world&&DB.manager===manager&&SLOT===slot&&STORE===key&&DB.worldDate===date&&DB.year===year&&managedTeamId(DB)===team&&VIEW===view&&UI_RENDER_ID===render&&UI_OVERLAY===dialog;
  const valid=()=>base()&&SAVE_STATUS===generation;
  const current=()=>valid()&&!SLOT_SWITCHING&&!busy;
  const frame=()=>{const n=screen;return ()=>current()&&screen===n};
  const root=uiOverlayRoot();
  const message=text=>{if(UI_OVERLAY===dialog){const el=root.querySelector('#save-recovery-message');if(el)el.textContent=text}};
  const close=()=>{if(!busy&&UI_OVERLAY===dialog)closeUiOverlay()};
  const shell=body=>`<div class="ovin"><div class="ovhead"><b>저장 원본 복구</b><button id="save-recovery-close" type="button">닫기</button></div><p id="save-recovery-message" role="status"></p>${body}</div>`;
  const show=(body,focus='#save-recovery-close')=>{if(UI_OVERLAY!==dialog)return;screen++;refreshUiOverlay(shell(body),{focusSelector:focus});root.querySelector('#save-recovery-close').onclick=close};
  openUiOverlay({kind:'save-recovery',label:'저장 원본 확인·수동 복구',html:shell('<p>저장된 원본을 확인하고 있습니다.</p>'),dismissible:true,onDismiss:close,focusSelector:'#save-recovery-close'});dialog=UI_OVERLAY;root.querySelector('#save-recovery-close').onclick=close;
  const renderList=()=>{
    show(`<p>현재 게임 ${savedGameLabel(savedGameSummary(db))} · ${esc(date||'날짜 미상')}</p><p>날짜와 구단을 확인하고 직접 선택하세요. 선택만으로 게임을 바꾸지 않습니다. 미저장 변경은 원본 관리에서 파일로 보관할 수 있습니다.</p>${model.errors?'<p class="warn">일부 원본을 읽지 못했습니다. 확인된 원본만 표시합니다.</p>':''}${model.rows.map((row,i)=>`<section class="cfgcard compact"><h3>${esc(row.label)} ${i+1}</h3>${row.valid?`<p>${savedGameLabel(row.summary)} · ${esc(row.summary.date||'날짜 미상')}</p><button type="button" data-recovery-select="${i}">이 원본 검토</button>`:'<p class="warn">읽을 수 없는 원본입니다. 자동으로 삭제하거나 적용하지 않습니다.</p>'}<button type="button" data-recovery-export="${i}">이 원본 파일로 보관</button>${row.protected?`<button type="button" data-recovery-release="${i}">보호 보관본 해제 검토</button>`:''}</section>`).join('')||'<p>확인된 보관 원본이 없습니다.</p>'}<button id="save-recovery-refresh" type="button">다시 확인</button>`);
    const here=frame(),snapshot=model,version=screen;
    root.querySelectorAll('[data-recovery-select]').forEach(b=>b.onclick=()=>{const row=snapshot.rows[+b.dataset.recoverySelect];if(here()&&row?.valid)preview(row)});
    root.querySelectorAll('[data-recovery-export]').forEach(b=>b.onclick=()=>{if(!here())return;const row=snapshot.rows[+b.dataset.recoveryExport];if(!row)return;try{exportSaveRecovery(row);message('파일 내보내기를 요청했습니다. 내려받은 파일을 확인하세요.')}catch(e){message('원본 파일을 내보내지 못했습니다. 저장 원본은 유지됩니다.')}});
    root.querySelectorAll('[data-recovery-release]').forEach(b=>b.onclick=()=>{const row=snapshot.rows[+b.dataset.recoveryRelease];if(here()&&row?.protected)releasePreview(row)});
    root.querySelector('#save-recovery-refresh').onclick=()=>{if(base()&&!busy&&!SLOT_SWITCHING&&screen===version){generation=SAVE_STATUS;void load()}};
  };
  const apply=async row=>{
    if(!current()||busy)return;busy=true;dialog.dismissible=false;SLOT_SWITCHING=true;
    root.querySelectorAll('button').forEach(b=>b.disabled=true);message('현재 게임을 보관하고 선택한 원본을 저장하고 있습니다.');
    let protection=null;
    try{
      const raw=await saveRecoveryRaw(row);if(!valid()||raw!==row.raw)throw Error('원본 또는 화면 문맥이 바뀌었습니다. 다시 확인하세요.');
      const staged=unpackDB(raw);protection=await protectSaveRecovery(key,raw);if(!valid())throw Error('게임 문맥이 바뀌었습니다.');cancelUiTasks();clearTimeout(saveTimer);saveTimer=null;SAVE_PENDING=null;
      const outgoing=persistWorldSnapshot(db,slot,key);generation=SAVE_STATUS;
      if(!await outgoing)throw Error('현재 게임 저장을 확인하지 못해 복원을 중단했습니다. 원본을 파일로 보관하세요.');
      if(!valid())throw Error('게임 문맥이 바뀌어 복원을 중단했습니다.');
      if(!await persistWorldSnapshot(staged,slot,key))throw Error('복원 저장을 확인하지 못해 활성 게임을 교체하지 않았습니다.');
      if(!valid())throw Error('게임 문맥이 바뀌어 활성 게임을 교체하지 않았습니다.');
      await releaseSaveProtection(key,raw);protection=null;if(!valid())throw Error('게임 문맥이 바뀌었습니다.');
      DB=staged;SLOT_SWITCHING=false;SAVEFAIL=false;const status=beginSaveStatus(DB,slot,key,'saved');status.date=DB.worldDate||String(DB.year||'');
      resetUiForWorld();if(startup)START_UI={active:true,page:'load',error:''};nav();publishSaveStatus();
    }catch(e){message((e.message||'복구하지 못했습니다.')+(protection?' 선택한 원본은 보호 보관본에 남아 있습니다.':''))}
    finally{SLOT_SWITCHING=false;busy=false;if(UI_OVERLAY===dialog){dialog.dismissible=true;root.querySelectorAll('button').forEach(b=>b.disabled=false)}}
  };
  const releasePreview=row=>showSaveProtectionRelease({row,key,root,show,frame,message,back:renderList,refresh:load,setBusy:value=>{busy=value;if(UI_OVERLAY===dialog)dialog.dismissible=!value}});
  const preview=row=>{
    show(`<h3>복원할 게임</h3><p>${savedGameLabel(row.summary)} · ${esc(row.summary.date||'날짜 미상')}</p><p>현재 게임을 저장한 뒤 이 원본으로 바꿉니다. 저장에 실패하면 활성 게임을 교체하지 않습니다. 저장된 경기·계약·재정·역사를 다시 계산하지 않습니다.</p><button id="save-recovery-apply" class="primary" type="button">이 원본 적용</button><button id="save-recovery-back" type="button">목록으로 돌아가기</button>`,'#save-recovery-apply');
    const here=frame();root.querySelector('#save-recovery-apply').onclick=()=>{if(here())return apply(row)};root.querySelector('#save-recovery-back').onclick=()=>{if(here())renderList()};
  };
  const load=async()=>{const request=++reads;try{const result=await readSaveRecovery(key);if(!current()||request!==reads)return;model=result;renderList()}catch(e){message('저장 원본을 확인하지 못했습니다. 현재 게임과 원본은 유지됩니다.')}};
  await load();return true;
}
