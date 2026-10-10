// 기존 계약 달력의 실제 날짜 진행과 수동 확인 화면.
function stoveModel(){
 const db=DB,w=db.world,cw=w?.contractWindow,team=managedTeamId(db);if(!w||w.phase!=='offseason'||!cw)return null;
 const copy=JSON.parse(JSON.stringify(db)),valid=d=>{try{return typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&addDays(d,0)===d}catch{return false}};
 const ready=cw.stage==='exclusive'&&[db.worldDate,cw.startDate,cw.exclusiveThrough,cw.contractExpiryDate,cw.outsideContactDate].every(valid)&&cw.startDate<=db.worldDate&&db.worldDate<=cw.exclusiveThrough&&cw.exclusiveThrough===cw.contractExpiryDate&&addDays(cw.exclusiveThrough,1)===cw.outsideContactDate;
 const rows=Object.values(copy.world.negotiations||{}).filter(n=>n.teamId===team&&n.status==='open').map(n=>({name:copy.players[n.pid]?.name||'선수 정보 없음',round:n.round,maxRounds:n.maxRounds,created:n.createdDate}));
 return {date:db.worldDate,cw:copy.world.contractWindow,rows,ready:ready||freeAgencyDayState(db).ready&&freeAgencyUiAllowed(),next:ready?addDays(db.worldDate,1):null};
}
function renderStove(){
 const m=stoveModel();if(!m)return '';
 return `<section class="cfgcard" id="stove-summary"><h3>스토브리그 · ${esc(m.date||'날짜 확인 필요')}</h3><p>${m.cw.stage==='exclusive'?'원소속 재계약 기간':'자유계약 영입 기간'} · 진행 협상 ${m.rows.length}건</p><p class="hint">기존 계약 만료 ${esc(m.cw.contractExpiryDate||'정보 없음')} · 자유계약 접촉 ${esc(m.cw.outsideContactDate||'정보 없음')}부터</p>${m.cw.stage==='exclusive'?`<div class="controls"><button type="button" class="primary" id="scontractday" data-stove-day${m.ready?'':' disabled'}>하루 진행${m.next?' · '+esc(m.next):''}</button><button type="button" id="scontractopen" data-stove-end${m.ready?'':' disabled'}>독점 기간 끝까지</button><button type="button" class="linklike" data-stove-market>협상 확인</button></div>${m.ready?'':'<p class="warn">계약 날짜 정보를 확인할 수 없어 진행하지 않았습니다. 저장된 게임과 현재 계약을 확인하세요.</p>'}`:renderFreeAgencyDays()}<p role="status" id="stove-status">${esc(MSG||'')}</p><details><summary>협상·계약 일정 상세</summary><p class="hint">게임 규칙의 계약 일정입니다. 합의와 실제 계약 시작은 구분됩니다.</p><p>${esc(m.cw.startDate||'정보 없음')}~${esc(m.cw.exclusiveThrough||'정보 없음')} 원소속 재계약</p>${m.rows.length?`<div class="scroll"><table><thead><tr><th>선수</th><th>협상 시작</th><th>진행</th></tr></thead><tbody>${m.rows.map(n=>`<tr><td>${esc(n.name)}</td><td>${esc(n.created||'기록 없음')}</td><td>${n.round??0}/${n.maxRounds??'—'}회</td></tr>`).join('')}</tbody></table></div>`:'<p>진행 중인 협상이 없습니다.</p>'}</details></section>`;
}
function stoveGuard(allowed){
 const db=DB,w=db.world,manager=db.manager,stamp=()=>JSON.stringify([w.contractWindow,w.contractAgreements,w.negotiations]);const initial=stamp(),fa=w.contractWindow?.stage==='fa'?freeAgencyUiStamp(db):null;
 return ()=>DB===db&&db.world===w&&db.manager===manager&&allowed()&&stamp()===initial&&(fa===null||freeAgencyUiStamp(db)===fa);
}
function bindStove(allowed){
 const current=stoveGuard(allowed);let used=false;
 const progress=end=>{
  if(used||!current()||!stoveModel()?.ready||end&&DB.world.contractWindow.stage!=='exclusive')return;
  const text=end?'독점 기간을 끝까지 진행합니다. 기존 계약 만료와 선수 측 결정이 처리됩니다. 계속할까요?':'작성 중인 제안은 보내지 않으며 화면 입력은 다시 확인해야 합니다. 기존 계약 일정에 따른 변화를 처리하고 하루를 진행할까요?';
  if(!confirm(text)||!current()||!stoveModel()?.ready)return;
  used=true;const db=DB,before=JSON.parse(JSON.stringify(db));let result;
  try{result=db.world.contractWindow.stage==='fa'?advanceOffseasonFreeAgencyDay(db):end?advanceOffseasonContractWindow(db):advanceOffseasonContractDay(db);if(!result?.ok)throw Error(result?.msg||'계약 날짜 진행 실패')}
  catch(error){console.error(error);if(DB===db){DB=before;MSG='계약 날짜를 진행하지 못했습니다. 진행 전 기록을 유지했습니다. 현재 상황을 확인한 뒤 다시 시도하세요.';nav()}return}
  MSG=result.msg;try{saveDB()}catch(error){console.error(error);MSG='날짜는 진행됐지만 저장하지 못했습니다. 저장·불러오기에서 게임 파일을 보관하세요.'}
  nav();const summary=document.querySelector('#stove-summary');if(summary){summary.style.scrollMarginTop=(document.querySelector('#app-nav')?.getBoundingClientRect?.().bottom||0)+'px';summary.scrollIntoView({block:'start'})}document.querySelector('[data-stove-day], [data-stove-market]')?.focus?.({preventScroll:true});
 };
 document.querySelectorAll('[data-stove-day]').forEach(b=>b.onclick=()=>progress(false));
 document.querySelectorAll('[data-stove-end]').forEach(b=>b.onclick=()=>progress(true));
 document.querySelectorAll('[data-stove-market]').forEach(b=>b.onclick=()=>{if(current()&&transferTabAllowed())navigateTo('transfer')});
}
