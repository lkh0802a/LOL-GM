// ===== LOL GM: UI =====
const SAVE_VERSION=15;
const SAVE_SLOTS=Object.freeze(Array.from({length:10},(_,i)=>String(i+1)));
const STORAGE_NS='lol-gm-v15';
const DIRECT_FILE_PREVIEW=location.protocol==='file:'||location.origin==='null';
let SLOT=(()=>{try{return localStorage.getItem(STORAGE_NS+'-slot')||'1'}catch(e){return '1'}})();
const STORE_BASE=STORAGE_NS+'-db-v'+SAVE_VERSION+'-';
let STORE=STORE_BASE+SLOT;
let DB=null, SAVEFAIL=false, SLOT_SWITCHING=false;
// Older namespaces are left intact as user backups. Unsupported world versions
// are never silently replaced or deleted during boot.
// 저장: IndexedDB(용량 큼) 우선, 안 되면 localStorage
function idb(){return new Promise((res,rej)=>{
  if(DIRECT_FILE_PREVIEW||typeof indexedDB==='undefined')return rej(new Error('IndexedDB unavailable in direct-file preview'));
  let done=false;
  const finish=(ok,v)=>{if(done)return;done=true;clearTimeout(timer);ok?res(v):rej(v)};
  const timer=setTimeout(()=>finish(false,new Error('IndexedDB timeout')),800);
  try{
    const r=indexedDB.open(STORAGE_NS,1);
    r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('kv'))r.result.createObjectStore('kv')};
    r.onsuccess=()=>finish(true,r.result);
    r.onerror=()=>finish(false,r.error||new Error('IndexedDB open failed'));
    r.onblocked=()=>finish(false,new Error('IndexedDB blocked'));
  }catch(e){finish(false,e)}
})}
async function idbGet(k){const d=await idb();return new Promise((res,rej)=>{
  let done=false;const finish=(ok,v)=>{if(done)return;done=true;clearTimeout(timer);try{d.close()}catch(e){}ok?res(v):rej(v)};
  const timer=setTimeout(()=>finish(false,new Error('IndexedDB read timeout')),800);
  try{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>finish(true,q.result);q.onerror=()=>finish(false,q.error||new Error('IndexedDB read failed'))}catch(e){finish(false,e)}
})}
async function idbSet(k,v){const d=await idb();return new Promise((res,rej)=>{
  let done=false;const finish=(ok,v)=>{if(done)return;done=true;clearTimeout(timer);try{d.close()}catch(e){}ok?res(v):rej(v)};
  const timer=setTimeout(()=>finish(false,new Error('IndexedDB write timeout')),800);
  try{const tx=d.transaction('kv','readwrite');tx.objectStore('kv').put(v,k);tx.oncomplete=()=>finish(true);tx.onerror=()=>finish(false,tx.error||new Error('IndexedDB write failed'));tx.onabort=()=>finish(false,tx.error||new Error('IndexedDB write aborted'))}catch(e){finish(false,e)}
})}
async function loadDB(key=STORE){
  const invalid=[];
  // A local fallback is newer than a failed IndexedDB update for this key.
  // A successful IndexedDB write removes the local fallback.
  let stored=null;
  try{stored=localStorage.getItem(key)}catch(e){invalid.push('로컬 저장소 읽기 실패: '+e.message)}
  if(stored!==null&&stored!==undefined){
    try{return unpackDB(stored)}
    catch(e){invalid.push('로컬 저장소: '+e.message)}
  }
  stored=null;
  try{stored=await idbGet(key)}catch(e){if(!(typeof DIRECT_FILE_PREVIEW!=='undefined'&&DIRECT_FILE_PREVIEW)&&typeof indexedDB!=='undefined')invalid.push('IndexedDB 읽기 실패: '+e.message)}
  if(stored!==null&&stored!==undefined){
    try{return unpackDB(stored)}
    catch(e){invalid.push('IndexedDB: '+e.message)}
  }
  if(invalid.length)
    throw new Error('저장 데이터를 복원할 수 없습니다. 원본은 삭제하거나 덮어쓰지 않았습니다. '+invalid.join(' / '));
  return buildWorld();
}
let saveTimer=null;
// Per-slot write queues keep late IndexedDB completions from overwriting a
// newer snapshot. All bytes and metadata are frozen before joining the queue.
const SAVE_QUEUES=new Map();
function persistWorldSnapshot(db,slot,key){
  const str=packDB(db),teamId=managedTeamId(db);
  const meta=JSON.stringify({team:teamId&&db.teams[teamId]?db.teams[teamId].name:'',year:db.world?db.world.year:''});
  const prior=SAVE_QUEUES.get(key)||Promise.resolve(true);
  const next=prior.then(async()=>{
    try{
      await idbSet(key,str);
      try{localStorage.removeItem(key)}catch(e){}
    }catch(e){
      try{localStorage.setItem(key,str)}catch(e2){return false}
    }
    try{localStorage.setItem(STORAGE_NS+'-meta-'+slot,meta)}catch(e){}
    return true;
  });
  SAVE_QUEUES.set(key,next);
  next.then(ok=>{if(DB===db&&SLOT===slot)SAVEFAIL=!ok});
  return next;
}
function saveDB(){
  const db=DB,slot=SLOT,key=STORE;
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{
    saveTimer=null;
    try{void persistWorldSnapshot(db,slot,key)}
    catch(e){if(DB===db&&SLOT===slot)SAVEFAIL=true;console.error('LOL GM save failed',e)}
  },150);
}
async function switchSaveSlot(nextSlot){
  if(SLOT_SWITCHING||nextSlot===SLOT||!SAVE_SLOTS.includes(nextSlot))
    return {ok:false,error:'이미 슬롯을 전환 중이거나 올바르지 않은 슬롯입니다.'};
  SLOT_SWITCHING=true;
  cancelUiTasks();
  const main=document.querySelector('#main'),navigation=document.querySelector('nav');
  if(main)main.inert=true;
  if(navigation)navigation.inert=true;
  let switched=false,error='';
  try{
    clearTimeout(saveTimer);saveTimer=null;
    const saved=await persistWorldSnapshot(DB,SLOT,STORE);
    if(!saved)throw new Error('현재 슬롯 저장에 실패했습니다. 슬롯 전환을 중단했습니다.');
    const key=STORE_BASE+nextSlot;
    const loaded=await loadDB(key);
    // Commit the slot identity and world only after both I/O operations finish.
    SLOT=nextSlot;STORE=key;DB=loaded;
    try{localStorage.setItem(STORAGE_NS+'-slot',SLOT)}catch(e){}
    resetUiForWorld();
    saveDB();
    switched=true;
  }catch(e){error='슬롯을 불러오지 못했습니다. 원본은 보존됩니다 — '+e.message}
  finally{
    SLOT_SWITCHING=false;
    if(main)main.inert=false;
    if(navigation)navigation.inert=false;
  }
  if(switched)navigateTo('season');
  return {ok:switched,error};
}
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const teamOpts=(sel,div1)=>Object.values(DB.regions).map(r=>{
  const divs=r.div2&&!div1?[1,2]:[1];
  return divs.map(d=>{const ts=managerSelectableTeams(DB,r.id,d);return ts.length?`<optgroup label="${esc(d===2?divName(r):r.leagueName)}">${ts.map(t=>`<option value="${t.id}"${t.id===sel?' selected':''}>${esc(t.name)}</option>`).join('')}</optgroup>`:''}).join('');
}).join('');
const n1=v=>Number.isInteger(v)?v:v.toFixed(2);
function freshInternalSeed(prefix='rng'){
  const a=new Uint32Array(2);try{crypto.getRandomValues(a);return `${prefix}-${a[0].toString(36)}${a[1].toString(36)}`}catch(e){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}
}
function grpAvg(p,g,k=100){return Math.round(avg(ATTR_GROUPS[g].map(a=>obsAttr(DB,p,a,k))))}
function ovrTag(v){return `<span class="num ${v>=80?'hi':v>=70?'mid':'lo'}">${v}</span>`}

// ---------- 선수단 ----------
const TAC_KO={aggression:'공격성',risk_tolerance:'위험 감수',objective_priority:'오브젝트 우선도',vision_investment:'시야 투자',scaling_preference:'후반 지향'};
// ---------- 데이터 ----------
// ---------- 시리즈 ----------
// ---------- 시즌 (월드) ----------
function mySeasonKey(){const w=DB.world,rid=seasonManagedRegion();if(!rid)return null;const ks=Object.values(w.seasons).filter(s=>s.region===rid).sort((a,b)=>(b.split||0)-(a.split||0));return ks.length?ks[0].key:null}
function curS(){const w=DB.world;if(!SSET.view||!w.seasons[SSET.view])SSET.view=mySeasonKey()||Object.keys(w.seasons)[0];return w.seasons[SSET.view]}
function sName(s){return DB.competitions[s.comp].name+(s.label?' '+s.label:'')}
function nextMine(){
  const w=DB.world,me=managedTeamId(DB);let best=null;
  for(const s of Object.values(w.seasons)){if(s.done)continue;for(const d of s.days.slice(s.cur)){const m=d.matches.find(m=>m.a===me||m.b===me);if(m){if(!best||d.date<best.d.date)best={s,d,m};break}}}
  return best;
}
function phaseText(w){
  if(w.phase==='season'){const st=w.steps[w.step];return (st?st.label+' 진행 중':'')+` · 패치 ${DB.patch.id}`}
  if(w.phase==='offseason'&&w.contractWindow)
    return w.contractWindow.stage==='exclusive'?'원소속 독점 재계약':'FA 시장';
  return w.phase==='offseason'?'시즌 종료':w.phase==='market'?'이적 시장':'오프시즌';
}
function viewSeason(){
  const w=DB.world;
  if(!w) return seasonSetup();
  if(w.phase==='pick') return renderSeasonTeamChoice();
  if(w.phase==='initial_roster') return renderInitialSetupHome();
  const me=managedTeamId(DB), T=seasonManagedTeam(), k=mySeasonKey(), lgS=k&&w.seasons[k];
  const reg=lgS?standings(DB,lgS,'regular'):[], mine=reg.find(x=>x.tid===me), rank=reg.indexOf(mine)+1;
  const nx=nextMine(), nd=nextDate(DB);
  let right='';
  if(w.phase==='season') right=`<div class="nextm"><span>현재 ${esc(DB.worldDate||'날짜 미정')} · 다음 경기 ${nd?esc(nd):'일정 없음'}</span><b>${T&&nx?`다음 경기 ${esc(nx.d.date)} — vs ${esc(tname(nx.m.a===me?nx.m.b:nx.m.a))} (${esc(sName(nx.s))} · Bo${nx.m.bo})`:T?'내 구단의 예정 경기가 없습니다':nd?`다음 공개 경기 ${esc(nd)}`:'공개 예정 경기가 없습니다'}</b></div>`;
  else{const last=DB.history.filter(h=>h.year===w.year&&h.intl).slice(-1)[0];right=`<div class="champ"><span>${w.year} ${last?esc(last.compName):''} 우승</span><b>${last?esc(tname(last.champion)):'—'}</b></div>`}
  return `<section class="seasonhead">
    <div><h2>${w.year} 시즌</h2><p>${T?esc(T.name):managedTeamId(DB)?'관리 구단 확인 필요':'무소속 감독'} · ${seasonManagedRegion()?esc(DB.regions[T.region].leagueName):'지역 정보 없음'}${lgS?' '+esc(lgS.label):''} ${mine&&(mine.w+mine.l)?`${rank}위 (${mine.w}승 ${mine.l}패)`:''} · ${esc(phaseText(w))}</p></div>${right}
  </section>
  ${SAVEFAIL?'<p class="warn">브라우저 저장 공간이 부족해 진행 상황을 저장하지 못했습니다. 데이터 탭에서 JSON을 복사해 두세요.</p>':''}
  <section class="controls">${controlsFor(w)}<span id="sprog" class="hint" role="status">${esc(seasonProgressNotice())}</span></section>
  ${T?renderClubBriefing():''}
  ${renderTransferEntry()}
  ${(w.phase==='preseason'||w.phase==='market')&&w.report?renderReport(w.report):''}
  ${chapters(w)}
  <div class="seg tabs season-tabs" role="group" aria-label="대회 정보 선택">${[['table','순위'],['sched','일정·결과'],['bracket','토너먼트'],['stats','기록'],['hist','세계·역대']].map(([k,l])=>`<button data-st="${k}" aria-pressed="${SSET.tab===k}">${l}</button>`).join('')}</div>
  <div id="stab">${seasonTab()}</div>`;
}
// 시즌을 챕터(단계)별로 묶어 보여준다: 1장 스프링 → 2장 퍼스트 스탠드 → 3장 MSI 기간 → …
function chapters(w){
  const cur=curS(), myR=seasonManagedRegion(), open=SSET.chap??w.step;
  return `<div class="chapters">${w.steps.map((st,i)=>{
    const ss=Object.values(w.seasons).filter(s=>stepOf(DB,s)===i).sort((a,b)=>(b.region===myR)-(a.region===myR)||(a.div||1)-(b.div||1)||(DB.competitions[a.comp].tier==='low')-(DB.competitions[b.comp].tier==='low'));
    const state=i<w.step||w.phase!=='season'?'done':i===w.step?'now':'next';
    const title=st.kind==='intl'?(DB.worldConfig.internationals.find(x=>x.id===(st.ids||[st.id])[0])||{name:st.label}).name+((st.ids||[]).length>1?' 기간':''):st.label+' 리그';
    const isOpen=i===open;
    return `<section class="chap ${state} ${isOpen?'open':''}"><button class="chaphead" data-chap="${i}" aria-expanded="${isOpen}"><span class="cn">${i+1}장</span><b>${esc(title)}</b><small>${state==='done'?'완료':state==='now'?'진행 중':'예정'}${ss.length?` · 대회 ${ss.length}개`:''}</small></button>
      ${isOpen&&ss.length?`<div class="chips">${ss.map(s=>{const c=DB.competitions[s.comp];return `<button data-view="${s.key}" aria-pressed="${cur===s}">${esc(c.short)}${c.tier==='low'?' <small>중하위</small>':''}${s.done?' ✓':''}</button>`}).join('')}</div>`:''}
      ${isOpen&&!ss.length?'<p class="hint">아직 시작 전입니다.</p>':''}</section>`}).join('')}</div>`;
}
function controlsFor(w){
  if(w.phase==='offseason'){
    const cw=w.contractWindow;
    if(!cw)return `<button class="primary" id="soff">계약 협상 기간 열기</button><span class="hint">시즌 종료 후 원소속 구단 14일 독점 재계약 기간을 시작합니다.</span>`;
    if(cw.stage==='exclusive')return renderStove();
    return `<button class="primary" id="soff">오프시즌 진행</button><span class="hint">${cw.contractExpiryDate}에 기존 계약이 끝났고 ${cw.outsideContactDate}부터 FA 시장이 열렸습니다. 영입을 마친 뒤 다음 시즌 시장 단계로 진행합니다.</span>`;
  }
  if(w.phase==='market') return `<button class="primary" id="smkt">이적 시장 마감</button>${seasonManagedTeam()?`<label class="inl">내 팀 운영 <select id="smanage">${[['manual','직접'],['ai','AI 위임']].map(([k,l])=>`<option value="${k}"${w.manage===k?' selected':''}>${l}</option>`).join('')}</select></label>`:''}<span class="hint">${w.manage==='manual'?'재계약·방출·FA 제안·이적 제안을 마친 뒤 마감하세요.':'AI가 내 팀 계약을 처리합니다.'}</span>`;
  if(w.phase==='preseason') return w.fired?`<button class="primary" id="sreset">새 팀 고르기</button>`:`<button class="primary" id="snew"${managedTeamId(DB)&&!seasonManagedTeam()?' disabled':''}>${DB.year} 시즌 시작</button><button class="ghost" id="sreset">맡을 팀 바꾸기</button>`;
  return `<button class="primary" id="sday">하루 진행</button><button class="ghost" id="sfixture">다음 경기일</button><button class="ghost" id="smine"${nextMine()?'':' disabled'}>내 경기까지</button><button class="ghost" id="sstep">이번 단계 끝까지</button><button class="ghost" id="send">시즌 끝까지</button><button class="ghost" id="spause" disabled>진행 중단</button>`;
}
function renderReport(r){
  const nm=id=>DB.players[id]?DB.players[id].name:'?';
  const mineT=managedTeamId(DB);
  const sig=r.signings.slice().sort((a,b)=>(b.team===mineT)-(a.team===mineT));
  return `<section class="report"><h3>${r.year} 오프시즌 리포트</h3>
   ${r.myGoal?`<p class="${r.myGoal.ok?'hi':'lo'}"><b>구단주 목표 "${GOAL_KO[r.myGoal.goal]}" ${r.myGoal.ok?'달성':'미달'}</b>${!r.myGoal.ok?` — 구단주 인내심 ${managedTeam(DB)?.owner?.patience??'—'}`:''}</p>`:''}
   ${DB.world.fired?'<p class="warn">해임되었습니다. 다른 팀을 골라 커리어를 이어가세요.</p>':''}
   ${(r.awards||[]).length?`<div class="rx"><h4>시상</h4>${r.awards.map(a=>`<p><b>${esc(a.comp)} ${esc(a.type)}</b> ${esc(nm(a.pid))} <small>${esc(tshort(DB.players[a.pid]&&DB.players[a.pid].team))}</small></p>`).join('')}</div>`:''}
   ${(r.hof||[]).length?`<div class="rx"><h4>명예의 전당 헌액</h4><p>${r.hof.map(id=>esc(nm(id))).join(', ')}</p></div>`:''}

   ${r.events.length?`<div class="rx"><h4>세계 변화</h4>${r.events.map(e=>`<p>${esc(e)}</p>`).join('')}</div>`:''}
   <div class="rgrid">
    <div><h4>가장 크게 성장</h4>${r.growth.slice(0,8).map(g=>`<div class="arow"><span>${esc(nm(g.pid))} <small>${esc(tshort(DB.players[g.pid]&&DB.players[g.pid].team))} · ${DB.players[g.pid]?DB.players[g.pid].age:''}세</small></span><span class="num hi">+${g.d} → ${g.ovr}</span></div>`).join('')}</div>
    <div><h4>하락세</h4>${r.growth.slice(-6).reverse().map(g=>`<div class="arow"><span>${esc(nm(g.pid))} <small>${DB.players[g.pid]?DB.players[g.pid].age:''}세</small></span><span class="num lo">${g.d} → ${g.ovr}</span></div>`).join('')}</div>
    ${(r.transfers||[]).length?`<div><h4>이적 (${r.transfers.length})</h4>${r.transfers.map(x=>`<div class="arow ${x.to===mineT||x.from===mineT?'minea':''}"><span>${esc(nm(x.pid))} <small>${esc(tshort(x.from))} → ${esc(tshort(x.to))}</small></span><span class="num">${money(x.fee)}</span></div>`).join('')}</div>`:''}
    <div><h4>은퇴 (${r.retired.length})</h4>${r.retired.slice(0,8).map(x=>`<div class="arow"><span>${esc(nm(x.pid))} <small>${esc(tshort(x.team))}</small></span><span class="num">${x.age}세</span></div>`).join('')||'<p class="hint">없음</p>'}</div>
    <div><h4>FA 영입 (${r.signings.length})</h4>${sig.filter(x=>!x.fill).sort((a,b)=>(b.team===mineT)-(a.team===mineT)||b.salary-a.salary).slice(0,10).map(x=>`<div class="arow ${x.team===mineT?'minea':''}"><span>${esc(tshort(x.team))} ← ${esc(nm(x.pid))}${x.import?' <small>비로컬</small>':''}${x.rookie?' <small>신인</small>':''}</span><span class="num">${money(x.salary)} · ${x.years}년${x.offers>1?` <small>(${x.offers}팀 경쟁)</small>`:''}</span></div>`).join('')}</div>
    <div><h4>재계약 (${(r.resign||[]).length}) · 계약 만료 (${(r.expired||[]).length})</h4>${(r.resign||[]).filter(x=>x.team===mineT).concat((r.resign||[]).filter(x=>x.team!==mineT).sort((a,b)=>b.salary-a.salary)).slice(0,5).map(x=>`<div class="arow ${x.team===mineT?'minea':''}"><span>${esc(tshort(x.team))} ${esc(nm(x.pid))}</span><span class="num">${money(x.salary)} · ${x.years}년</span></div>`).join('')}${(r.expired||[]).filter(x=>x.team===mineT).map(x=>`<div class="arow minea"><span>${esc(nm(x.pid))} 이탈</span><span class="hint">${esc(x.why)}</span></div>`).join('')}</div>
   </div></section>`;
}

document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>navigateTo(b.dataset.v));
$('#main').innerHTML='<p class="empty">세계를 불러오는 중…</p>';
loadDB().then(d=>{DB=d;nav()}).catch(e=>{
  console.error('LOL GM initialization failed',e);
  if(typeof startupBootFailure==='function'){startupBootFailure(e);return}
  $('#main').innerHTML=`<section><h2>게임을 시작하지 못했습니다</h2><p class="warn">${esc(e&&e.message?e.message:'초기화 오류')}</p><p class="hint">저장 데이터 오류가 발생한 경우 원본은 보존됩니다. 브라우저 저장소를 지우지 말고 JSON 백업을 확인해 주세요. 파일 미리보기 접근 오류라면 최신 HTML을 다시 열어 보세요.</p><button class="primary" id="retryboot">다시 시도</button></section>`;
  const b=$('#retryboot');if(b)b.onclick=()=>location.reload();
});
