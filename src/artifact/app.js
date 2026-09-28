// ===== LOL GM: UI =====
const SAVE_VERSION=15;
const STORAGE_NS='lol-gm-v15';
const LEGACY_STORAGE_PREFIXES=['lol-gm'];
const LEGACY_DB_NAMES=['lol-gm','lol-gm-v10','lol-gm-v11','lol-gm-v12','lol-gm-v13','lol-gm-v14'];
const DIRECT_FILE_PREVIEW=location.protocol==='file:'||location.origin==='null';
let SLOT=(()=>{try{return localStorage.getItem(STORAGE_NS+'-slot')||'1'}catch(e){return '1'}})();
const STORE_BASE=STORAGE_NS+'-db-v'+SAVE_VERSION+'-';
let STORE=STORE_BASE+SLOT;
let DB=null, LAST=null, LASTSER=null, VIEW='season', SQUAD=null, OPEN_P=null, LOGMODE='major', SAVEFAIL=false, MSG='';
let SCOUTSET={region:'ALL',role:'ALL',contract:'all',competition:'ALL',undervalued:false,q:''}, SQUAD_EDIT=null;
// 기존 개발 세이브는 호환하지 않는다. 현재 namespace 이전의 LOL GM 개발 저장소를 폐기한다.
function purgeLegacySaves(){
  try{
    for(let i=localStorage.length-1;i>=0;i--){
      const k=localStorage.key(i);
      if(!k||k.startsWith(STORAGE_NS+'-'))continue;
      if(LEGACY_STORAGE_PREFIXES.some(p=>k===p||k.startsWith(p+'-')))localStorage.removeItem(k);
    }
  }catch(e){}
  if(!DIRECT_FILE_PREVIEW&&typeof indexedDB!=='undefined'){
    for(const name of LEGACY_DB_NAMES)try{indexedDB.deleteDatabase(name)}catch(e){}
  }
}
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
async function loadDB(){
  purgeLegacySaves();
  try{const s=await idbGet(STORE);if(s){const d=unpackDB(s);if(d.version===SAVE_VERSION)return d}}catch(e){}
  try{const s=localStorage.getItem(STORE);if(s){const d=unpackDB(s);if(d.version===SAVE_VERSION)return d}}catch(e){}
  return buildWorld();
}
let saveTimer=null;
function saveDB(){clearTimeout(saveTimer);saveTimer=setTimeout(async()=>{const str=packDB(DB),teamId=managedTeamId(DB);
  try{localStorage.setItem(STORAGE_NS+'-meta-'+SLOT,JSON.stringify({team:teamId&&DB.teams[teamId]?DB.teams[teamId].name:'',year:DB.world?DB.world.year:''}))}catch(e){}
  try{await idbSet(STORE,str);SAVEFAIL=false;try{localStorage.removeItem(STORE)}catch(e){}}catch(e){try{localStorage.setItem(STORE,str);SAVEFAIL=false}catch(e2){SAVEFAIL=true}}},150)}
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const teamOpts=(sel,div1)=>Object.values(DB.regions).map(r=>{
  const divs=r.div2&&!div1?[1,2]:[1];
  return divs.map(d=>{const ts=managerSelectableTeams(DB,r.id,d);return ts.length?`<optgroup label="${esc(d===2?divName(r):r.leagueName)}">${ts.map(t=>`<option value="${t.id}"${t.id===sel?' selected':''}>${esc(t.name)}</option>`).join('')}</optgroup>`:''}).join('');
}).join('');
function normalizeManagerTeamSelection(){
  const all=managerSelectableTeams(DB);
  let team=isManagerSelectableTeam(DB,SSET.team)?DB.teams[SSET.team]:all[0];
  let rid=SSET.region&&DB.regions[SSET.region]&&managerSelectableTeams(DB,SSET.region).length?SSET.region:(team&&team.region)||(all[0]&&all[0].region);
  const divs=[1,2].filter(d=>managerSelectableTeams(DB,rid,d).length);
  let div=+SSET.division;
  if(!divs.includes(div))div=team&&team.region===rid&&divs.includes(team.division||1)?(team.division||1):divs[0];
  const teams=managerSelectableTeams(DB,rid,div);
  if(!teams.some(t=>t.id===SSET.team))SSET.team=(teams[0]||all[0]||{}).id||null;
  SSET.region=rid||null;SSET.division=div||1;
  return {rid:SSET.region,div:SSET.division,team:SSET.team,teams,divs,region:DB.regions[SSET.region]};
}
function managerTeamPicker(disabled=false){
  const st=normalizeManagerTeamSelection(),team=st.team&&DB.teams[st.team];
  const regions=Object.values(DB.regions).filter(r=>managerSelectableTeams(DB,r.id).length);
  const pay=team?payroll(DB,team):0,budget=team?initialSalaryBudget(DB,team):0;
  const recent=team&&team.goalLog&&team.goalLog.length?team.goalLog.slice(-1)[0]:'첫 시즌 · 공식 기록 없음';
  const recentText=typeof recent==='string'?recent:(recent.year+' · '+(recent.ok?'목표 달성':'목표 미달'));
  return `<div class="cfgcard compact"><div class="cfghead"><b>감독할 구단 선택</b><span class="hint">지역 → 리그 → 디비전 → 팀</span></div><div class="controls">
    <label>지역<select id="steam-region"${disabled?' disabled':''}>${regions.map(r=>`<option value="${r.id}"${r.id===st.rid?' selected':''}>${esc(r.name)}</option>`).join('')}</select></label>
    <label>리그<span class="static-field">${st.region?esc(st.region.leagueName):'—'}</span></label>
    <label>디비전<select id="steam-division"${disabled?' disabled':''}>${st.divs.map(d=>`<option value="${d}"${d===st.div?' selected':''}>${d===1?'1부':esc(divName(st.region))}</option>`).join('')}</select></label>
    <label>팀<select id="steam"${disabled?' disabled':''}>${st.teams.map(t=>`<option value="${t.id}"${t.id===st.team?' selected':''}>${esc(t.name)}</option>`).join('')}</select></label>
  </div>${team?`<div class="fin">
    <div><span>재정</span><b>${money(team.finance.cash)}</b><small>초기 연봉 예산 ${money(budget)} · 현재 ${money(pay)}</small></div>
    <div><span>선수단</span><b>${(team.roster||[]).length}명</b><small>첫 시즌은 전 구단 0명에서 시작</small></div>
    <div><span>시설</span><b>${Math.round(avg(Object.values(ensureFacilities(team)))*10)/10} / 5</b><small>4종 인프라 평균</small></div>
    <div><span>명성</span><b>${team.reputation??'—'}</b><small>초기 상태에서 파생</small></div>
    <div><span>최근 성적</span><b>${esc(recentText)}</b></div>
    <div><span>구단 목표</span><b>${esc(initialGoalLabel(team))}</b></div>
    <div><span>승강</span><b>${esc(promotionStatus(DB,team))}</b></div>
  </div>`:''}
  <p class="hint">첫 시즌은 모든 구단이 백지 로스터로 시작합니다. 팀을 고른 뒤 전 세계 FA 풀에서 예산과 등록 규정에 맞춰 직접 선수단을 구성합니다.</p>
  <p class="hint">가상 프로씬 공용어가 정착된 세계이므로 국적에 따른 언어 장벽은 없습니다. 국적/출신지역은 신인 생성·스카우팅 정체성에 사용되고, 공식 등록의 비로컬 판정은 별도 활성 로컬 자격을 사용합니다.</p>
  <p class="hint">Academy/Challengers 등 모구단 소속 2군은 감독 시작 팀으로 선택할 수 없습니다.</p></div>`;
}
function bindManagerTeamPicker(){
  const r=$('#steam-region'),d=$('#steam-division'),t=$('#steam');
  if(r)r.onchange=e=>{SSET.region=e.target.value;SSET.division=null;SSET.team=null;normalizeManagerTeamSelection();nav()};
  if(d)d.onchange=e=>{SSET.division=+e.target.value;SSET.team=null;normalizeManagerTeamSelection();nav()};
  if(t)t.onchange=e=>{SSET.team=e.target.value;nav()};
}

const n1=v=>Number.isInteger(v)?v:v.toFixed(2);
function freshInternalSeed(prefix='rng'){
  const a=new Uint32Array(2);try{crypto.getRandomValues(a);return `${prefix}-${a[0].toString(36)}${a[1].toString(36)}`}catch(e){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}
}
function grpAvg(p,g,k=100){return Math.round(avg(ATTR_GROUPS[g].map(a=>obsAttr(DB,p,a,k))))}
function ovrTag(v){return `<span class="num ${v>=80?'hi':v>=70?'mid':'lo'}">${v}</span>`}

function navKeepScroll(){const y=window.scrollY;nav();requestAnimationFrame(()=>window.scrollTo(0,y))}
function nav(){
  if(typeof LIVE!=='undefined')clearInterval(LIVE);
  document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.v===VIEW?'page':'false'));
  const m=$('#main');
  m.innerHTML={season:viewSeason,match:viewMatch,squad:viewSquad,patch:viewPatch,mc:viewMC,data:viewData}[VIEW]();
  ({season:bindSeason,match:bindMatch,patch:bindPatch,squad:bindSquad,champs:()=>{},mc:bindMC,data:bindData})[VIEW]();
}

// ---------- 경기 ----------
let SEL={blue:'HTG',red:'SBZ',bo:1,fearless:true};
function viewMatch(){
  const act=activeTeams(DB), own=DB.world&&DB.teams[managedTeamId(DB)]?managedTeamId(DB):act[0].id;
  SEL.blue=own;
  if(!DB.teams[SEL.red]||DB.teams[SEL.red].active===false||SEL.red===own)SEL.red=(act.find(t=>t.id!==own)||act[0]).id;
  const oppOpts=Object.values(DB.regions).flatMap(r=>(r.div2?[1,2]:[1]).map(d=>`<optgroup label="${esc(d===2?divName(r):r.leagueName)}">${activeTeams(DB,r.id,d).filter(t=>t.id!==own).map(t=>`<option value="${t.id}"${t.id===SEL.red?' selected':''}>${esc(t.name)} · 연습가치 ${Math.round(scrimValue(DB,own,t.id)*100)}%</option>`).join('')}</optgroup>`)).join('');
  const ready=scrimReadiness(DB,DB.teams[own]),rec=trainingRecommendation(DB,DB.teams[own]);
  return `${detail}<section class="teamhead"><h2>스크림</h2><p>내 팀과 실제 구단을 골라 비공식 연습 경기를 진행합니다. 결과는 공식 전적·리그 순위에 반영되지 않습니다.</p><p class="hint">현재 평균 피로 ${Math.round(ready.avgFatigue||0)} · 컨디션 ${Math.round(ready.avgCondition||0)} · 오늘 ${ready.games||0}게임 · ${ready.reason}</p><p class="hint">${rec.next?`다음 공식전까지 ${rec.days}일 · ${esc(DB.teams[rec.next.opponent]?.name||'상대 미정')}`:'예정된 공식전 없음'} · 스크림 추천 ${rec.scrim?'진행':'휴식'}</p></section>
  <section class="controls">
    <label>내 팀 <b>${esc(DB.teams[own].name)}</b></label>
    <label>상대팀<select id="red">${oppOpts}</select></label>
    <label>형식<select id="bo">${[1,3,5].map(n=>`<option value="${n}"${SEL.bo===n?' selected':''}>${n===1?'단판':'Bo'+n}</option>`).join('')}</select></label>
    <button class="ghost" id="draftpractice"${ready.ok?'':' disabled'}>밴픽 연습</button>
    <button class="primary" id="play"${ready.ok?'':' disabled'}>스크림 시작</button>
  </section>
  <div id="result">${LASTSER?renderSeries(LASTSER,true):LAST?renderResult(LAST):`<p class="empty">상대 팀과 형식을 고르고 스크림을 시작하세요. 같은 조건에서도 결과는 달라질 수 있습니다.</p>`}</div>`;
}
function bindMatch(){
  $('#red').onchange=e=>SEL.red=e.target.value;
  $('#bo').onchange=e=>SEL.bo=+e.target.value;
  $('#draftpractice').onclick=()=>openDraftPractice(DB,SEL.blue,SEL.red);
  $('#play').onclick=()=>{const readiness=scrimReadiness(DB,DB.teams[SEL.blue]);if(!readiness.ok){MSG=readiness.reason;nav();return}const seed=freshInternalSeed('scrim'),series=simulateSeries(DB,SEL.blue,SEL.red,SEL.bo,seed,{fearless:true,firstChoice:'coin',replay:true,practice:true});recordScrimPractice(DB,series.rec,series.lines);saveDB();if(SEL.bo===1){LASTSER=null;LAST=simulateMatch(DB,SEL.blue,SEL.red,seed);$('#result').innerHTML=renderResult(LAST);bindResult()}
    else{LAST=null;LASTSER=series.rec;$('#result').innerHTML=renderSeries(LASTSER,true);bindSeries($('#result'),LASTSER)}};
  if(LASTSER)bindSeries($('#result'),LASTSER);else if(LAST)bindResult();
}
let LIVE=null;
function bindResult(){
  const wb=$('#watch'); if(wb)wb.onclick=()=>{clearInterval(LIVE);const r=LAST,L=r.log.filter(l=>l.major||l.kind==='gank');let i=0,k=[0,0];
    const box=$('#live');box.innerHTML=`<div class="livebox"><div class="livesc"><span class="bl">${esc(r.sides[0].team.short)}</span> <b id="lk">0 : 0</b> <span class="rd">${esc(r.sides[1].team.short)}</span> <time id="lt">00:00</time></div><ol id="ll"></ol></div>`;
    LIVE=setInterval(()=>{if(i>=L.length||!$('#lk')){clearInterval(LIVE);return}const l=L[i++];if(l.kind==='kill')k[l.side]++;
      $('#lk').textContent=`${k[0]} : ${k[1]}`;$('#lt').textContent=fmtTime(l.t,l.sec);
      const li=document.createElement('li');li.className=l.side===0?'blue':l.side===1?'red':'';li.innerHTML=`<time>${fmtTime(l.t,l.sec)}</time><span>${esc(l.text)}</span>`;const ol=$('#ll');ol.prepend(li)},matchMedia('(prefers-reduced-motion: reduce)').matches?60:420)};
  document.querySelectorAll('[data-logmode]').forEach(b=>b.onclick=()=>{LOGMODE=b.dataset.logmode;$('#logbox').innerHTML=renderLog(LAST);document.querySelectorAll('[data-logmode]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.logmode===LOGMODE))});
}
function renderResult(r){
  const [B,Rd]=r.sides, gold=r.sides.map(s=>s.ps.reduce((a,p)=>a+p.goldEarned,0));
  const stat=(s,i)=>`<div class="tstat ${i?'red':'blue'}"><span><b>${(gold[i]/1000).toFixed(1)}k</b>골드</span><span><b>${s.towersTaken}</b>포탑</span><span><b>${s.dragons.length}</b>드래곤</span><span><b>${s.barons}</b>바론</span><span><b>${s.herald}</b>전령</span></div>`;
  return `<section class="board">
    <div class="side blue ${r.winner===0?'won':''}"><div class="tname">${esc(B.team.name)}</div><div class="res">${r.winner===0?'승리':'패배'}</div></div>
    <div class="score"><span>${B.kills}</span><i>:</i><span>${Rd.kills}</span><div class="dur">${r.durationStr}</div></div>
    <div class="side red ${r.winner===1?'won':''}"><div class="tname">${esc(Rd.team.name)}</div><div class="res">${r.winner===1?'승리':'패배'}</div></div>
  </section>
  <div class="tstats">${stat(B,0)}${stat(Rd,1)}</div>
  ${renderDraft(r)}
  <section><h3>골드 격차</h3>${goldChart(r)}</section>
  <section><h3>선수 기록</h3>${r.sides.map((s,i)=>playerTable(s,i)).join('')}</section>
  <section><button class="primary" id="watch">중계 보기</button><div id="live"></div></section>
  <section><div class="loghead"><h3>경기 로그</h3><div class="seg"><button data-logmode="major" aria-pressed="${LOGMODE==='major'}">주요</button><button data-logmode="all" aria-pressed="${LOGMODE==='all'}">전체</button></div></div><div id="logbox">${renderLog(r)}</div></section>
  <section><details class="expl"><summary>개발자 로그 (판단 근거 ${r.expl.length}건)</summary>${renderExpl(r)}</details></section>`;
}
function renderDraft(r){
  const d=r.draft;
  return `<section><h3>밴픽</h3><div class="draft">${[0,1].map(i=>`<div class="dside ${i?'red':'blue'}">
    <div class="bans">${d.bans[i].map(c=>`<span class="ban">${esc(championLabel(DB,c))}</span>`).join('')}</div>
    ${ROLES.map(role=>{const ps=r.sides[i].ps.find(p=>p.role===role);return `<div class="pick"><span class="role">${ROLE_KO[role]}</span><b>${esc(championDisplayName(ps.champ))}</b><span class="pn">${esc(ps.p.name)} · 숙련 ${ps.prof.mastery}</span></div>`}).join('')}
  </div>`).join('')}</div></section>`;
}
function goldChart(r){
  const h=r.goldHist, W=640, H=170, pad=26, max=Math.max(3000,...h.map(Math.abs));
  const x=i=>pad+(W-pad*2)*(i/(Math.max(1,h.length-1))), y=v=>H/2-(v/max)*(H/2-14);
  const pts=h.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area=`${x(0)},${H/2} ${pts} ${x(h.length-1)},${H/2}`;
  const ticks=[];for(let m=5;m<h.length;m+=5)ticks.push(`<text x="${x(m-1)}" y="${H-2}" class="tick">${m}분</text>`);
  return `<div class="scroll"><svg viewBox="0 0 ${W} ${H}" class="gold" role="img" aria-label="분당 골드 격차 그래프">
    <defs><clipPath id="up"><rect x="0" y="0" width="${W}" height="${H/2}"/></clipPath><clipPath id="dn"><rect x="0" y="${H/2}" width="${W}" height="${H/2}"/></clipPath></defs>
    <polygon points="${area}" clip-path="url(#up)" class="ga-blue"/><polygon points="${area}" clip-path="url(#dn)" class="ga-red"/>
    <line x1="${pad}" x2="${W-pad}" y1="${H/2}" y2="${H/2}" class="axis"/>
    <polyline points="${pts}" class="gl"/>
    <text x="${W-pad}" y="12" text-anchor="end" class="tick">블루 +${(max/1000).toFixed(1)}k</text><text x="${W-pad}" y="${H-14}" text-anchor="end" class="tick">레드 +${(max/1000).toFixed(1)}k</text>${ticks.join('')}
  </svg></div>`;
}
function playerTable(s,i){
  return `<div class="scroll"><table class="pt ${i?'red':'blue'}"><thead><tr><th>${esc(s.team.short)}</th><th>챔피언</th><th>K/D/A</th><th>CS</th><th>골드</th><th>레벨</th><th>피해량</th><th>아이템</th></tr></thead><tbody>
  ${s.ps.map(p=>`<tr><td><span class="role">${ROLE_KO[p.role]}</span> ${esc(p.p.name)}</td><td>${esc(championDisplayName(p.champ))}</td><td class="num">${p.k}/${p.d}/${p.a}</td><td class="num">${Math.round(p.cs)}</td><td class="num">${(p.goldEarned/1000).toFixed(1)}k</td><td class="num">${p.lvl}</td><td class="num">${(p.dmg/1000).toFixed(1)}k</td><td class="items">${p.items.map(esc).join(', ')}</td></tr>`).join('')}
  </tbody></table></div>`;
}
function renderLog(r){
  const L=r.log.filter(l=>LOGMODE==='all'||l.major);
  return `<ol class="log">${L.map(l=>`<li class="${l.side===0?'blue':l.side===1?'red':''} k-${l.kind}"><time>${fmtTime(l.t,l.sec)}</time><span>${esc(l.text)}</span></li>`).join('')}</ol>`;
}
function renderExpl(r){
  return `<ol class="xl">${r.expl.map(e=>`<li><div class="xh"><time>${e.t?String(e.t).padStart(2,'0')+'분':'밴픽'}</time><b>${esc(e.title)}</b></div>
    <div class="xf">${(e.factors||[]).map(([k,v])=>`<span>${esc(k)} <em class="${v>=0?'pos':'neg'}">${v>=0?'+':''}${Number(v).toFixed(2)}</em></span>`).join('')}</div>
    <div class="xr">${e.utility!==undefined?`효용 ${e.utility.toFixed(2)}`:''}${e.perceived!==undefined?` · 인식 효용 ${e.perceived.toFixed(2)}`:''}${e.prob!==undefined?` · 성공확률 ${(e.prob*100).toFixed(1)}%`:''}${e.counter?` · 카정 위험 ${(e.counter*100).toFixed(0)}%`:''}${e.result?` → <b>${esc(e.result)}</b>`:''}</div></li>`).join('')}</ol>`;
}

// ---------- 선수단 ----------
const TAC_KO={aggression:'공격성',risk_tolerance:'위험 감수',objective_priority:'오브젝트 우선도',vision_investment:'시야 투자',scaling_preference:'후반 지향'};
function financePanel(t){
  const f=t.finance; if(!f)return '';
  const R=DB.regions[t.region], last=f.history.slice(-1)[0], pay=payroll(DB,t);
  const RK={league:'중계권 분배',sponsor:'스폰서',merch:'굿즈',prize:'상금',owner:'구단주 지원',tax:'사치세 분배'}, EK={salary:'연봉',staff:'코칭 스태프',ops:'운영비',facility:'훈련 시설',floor:'플로어 부담금',buyout:'계약 해지금',tax:'사치세'};
  return `<section><h3>재정</h3><div class="fin">
    <div><span>보유 자금</span><b class="${f.cash<0?'neg':''}">${money(f.cash)}</b></div>
    <div><span>연봉 총액</span><b>${money(pay)}</b><small>${R.spendingRule==='sfr_top5'?`SFR 상위 5인 ${money(regulatedPayroll(DB,t))} · 기준 ${money(R.salaryCap)}${regulatedPayroll(DB,t)>R.salaryCap?' 초과':''}`:'구단 자체 예산'}</small></div>
    <div><span>영입 예산</span><b>${money(Math.max(0,salaryBudget(DB,t)-pay))}</b></div>
    <div><span>구단주 재력</span><b>${t.owner?t.owner.wealth:'—'}</b></div>
  </div>
  ${last?`<div class="rgrid"><div><h4>${last.year} 수입 ${money(Object.values(last.rev).reduce((a,b)=>a+b,0))}</h4>${Object.entries(last.rev).filter(([,v])=>v).map(([k,v])=>`<div class="arow"><span>${RK[k]||k}</span><span class="num">${money(v)}</span></div>`).join('')}</div>
  <div><h4>${last.year} 지출 ${money(Object.values(last.exp).reduce((a,b)=>a+b,0))}</h4>${Object.entries(last.exp).filter(([,v])=>v).map(([k,v])=>`<div class="arow"><span>${EK[k]||k}</span><span class="num">${money(v)}</span></div>`).join('')}<div class="arow"><span><b>순이익</b></span><span class="num ${last.net<0?'lo':'hi'}"><b>${money(last.net)}</b></span></div></div></div>`:'<p class="hint">첫 시즌이 끝나면 결산이 나옵니다.</p>'}</section>`;
}
function financeTable(rid){
  const ts=activeTeams(DB,rid).sort((a,b)=>b.finance.cash-a.finance.cash);
  return `<div class="scroll"><table><thead><tr><th>구단</th><th>팬덤</th><th>보유 자금</th><th>연봉 총액</th><th>지난 시즌 순이익</th></tr></thead><tbody>
  ${ts.map(t=>{const l=t.finance.history.slice(-1)[0];return `<tr class="${t.id===managedTeamId(DB)?'mine':''}"><td><b>${esc(t.name)}</b></td><td class="num">${t.fans??'—'}</td><td class="num">${money(t.finance.cash)}</td><td class="num">${money(payroll(DB,t))}</td><td class="num ${l&&l.net<0?'lo':''}">${l?money(l.net):'—'}</td></tr>`}).join('')}
  </tbody></table></div>`;
}
function viewMC(){
  const act=activeTeams(DB);if(!DB.teams[MC.blue]||DB.teams[MC.blue].active===false)MC.blue=act[0].id;if(!DB.teams[MC.red]||DB.teams[MC.red].active===false)MC.red=act[1].id;
  return `<section class="controls">
    <label>블루<select id="mb">${teamOpts(MC.blue)}</select></label>
    <label>레드<select id="mr">${teamOpts(MC.red)}</select></label>
    <label>반복<select id="mn">${[100,300,1000].map(n=>`<option${n===MC.n?' selected':''}>${n}</option>`).join('')}</select></label>
    <button class="primary" id="mrun">시뮬레이션 실행</button>
  </section>
  <div id="mcout">${MC.res?renderMC(MC.res):'<p class="empty">같은 대진을 여러 번 돌려 승률과 경기 지표의 분포를 확인합니다. 전술이나 능력치를 바꾼 뒤 다시 돌려 비교해 보세요.</p>'}</div>`;
}
function renderMC(a){
  const n=a.n,pct=v=>(v/n*100).toFixed(1)+'%',per=v=>(v/n).toFixed(1);
  const bt=DB.teams[a.blue].short, rt=DB.teams[a.red].short;
  const rows=[['승률',pct(a.wins),pct(n-a.wins)],['평균 킬',per(a.kills[0]),per(a.kills[1])],['평균 포탑',per(a.towers[0]),per(a.towers[1])],['평균 드래곤',per(a.dragons[0]),per(a.dragons[1])],['바론 획득률',pct(a.baron[0]),pct(a.baron[1])],['첫 드래곤',pct(a.fd),pct(n-a.fd)],['첫 포탑',pct(a.ft),pct(n-a.ft)],['퍼스트 블러드',pct(a.fb),pct(n-a.fb)],['한타 승리 (합계)',a.fights[0],a.fights[1]]];
  const bins=new Array(8).fill(0);a.times.forEach(t=>bins[Math.min(7,Math.max(0,Math.floor((t-15)/5)))]++);const bm=Math.max(...bins);
  return `<section class="board mcb"><div class="side blue"><div class="tname">${esc(DB.teams[a.blue].name)}</div></div><div class="score"><span>${(a.wins/n*100).toFixed(0)}</span><i>%</i><div class="dur">${n}경기 · 평균 ${Math.floor(a.time/n)}분 · GD@15 ${a.gd15/n>=0?'+':''}${Math.round(a.gd15/n)}</div></div><div class="side red"><div class="tname">${esc(DB.teams[a.red].name)}</div></div></section>
  <section><div class="scroll"><table class="mct"><thead><tr><th>지표</th><th class="bh">${esc(bt)}</th><th class="rh">${esc(rt)}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td></tr>`).join('')}</tbody></table></div></section>
  <section><h3>경기 시간 분포</h3><div class="hist">${bins.map((b,i)=>`<div><i style="height:${bm?b/bm*100:0}%"></i><span>${15+i*5}${i===7?'+':''}</span></div>`).join('')}</div></section>`;
}
function bindMC(){
  $('#mb').onchange=e=>MC.blue=e.target.value;$('#mr').onchange=e=>MC.red=e.target.value;$('#mn').onchange=e=>MC.n=+e.target.value;
  $('#mrun').onclick=()=>{
    if(MC.running)return;MC.running=true;const btn=$('#mrun');
    const baseSeed=freshInternalSeed('mc'), acc={wins:0,time:0,gd15:0,fd:0,ft:0,fb:0,baron:[0,0],kills:[0,0],towers:[0,0],dragons:[0,0],fights:[0,0],n:0,times:[],blue:MC.blue,red:MC.red};
    let i=0;const N=MC.n;
    const step=()=>{const end=Math.min(N,i+25);
      for(;i<end;i++){const r=simulateMatch(DB,MC.blue,MC.red,baseSeed+'#'+i);acc.n++;if(r.winner===0)acc.wins++;acc.time+=r.duration;acc.times.push(r.duration);acc.gd15+=r.goldHist[14]??r.goldHist[r.goldHist.length-1];
        if(r.firsts.dragon===0)acc.fd++;if(r.firsts.tower===0)acc.ft++;if(r.firsts.blood===0)acc.fb++;
        for(const s of [0,1]){acc.baron[s]+=r.sides[s].barons>0?1:0;acc.kills[s]+=r.sides[s].kills;acc.towers[s]+=r.sides[s].towersTaken;acc.dragons[s]+=r.sides[s].dragons.length}
        for(const l of r.log)if(l.kind==='fight')acc.fights[l.side]++;}
      btn.textContent=`실행 중 ${i}/${N}`;
      if(i<N)setTimeout(step,0);else{MC.res=acc;MC.running=false;btn.textContent='시뮬레이션 실행';$('#mcout').innerHTML=renderMC(acc)}};
    step();
  };
}

// ---------- 데이터 ----------
function slotMeta(n){try{return JSON.parse(localStorage.getItem(STORAGE_NS+'-meta-'+n)||'null')}catch(e){return null}}
function viewData(){
  return `<section class="teamhead"><h2>저장 슬롯</h2><p>커리어를 3개까지 따로 저장할 수 있습니다. 진행 상황은 자동 저장됩니다.</p></section>
  <section class="cfgs">${['1','2','3'].map(n=>{const m=slotMeta(n);return `<div class="cfgcard compact ${n===SLOT?'cur':''}"><div class="cfghead"><b>슬롯 ${n}${n===SLOT?' · 사용 중':''}</b>${n===SLOT?'':`<button class="ghost sm2" data-slot="${n}">불러오기</button>`}</div><p class="hint">${m&&m.team?`${esc(m.team)} · ${m.year} 시즌`:'비어 있음 — 불러오면 새 세계를 만듭니다'}</p></div>`}).join('')}</section>
  <section class="teamhead"><h2>데이터 내보내기·가져오기</h2><p>선수, 팀, 챔피언, 패치, 기록이 모두 들어 있는 JSON입니다. 복사해 두었다가 다른 기기나 슬롯에 붙여 넣을 수 있습니다.</p></section>
  <section class="controls"><button class="ghost" id="dshow">JSON 열기</button><button class="primary" id="dapply">붙여 넣은 JSON 적용</button><button class="ghost" id="dcopy">복사</button><button class="ghost" id="dreset">이 슬롯 초기화</button></section>
  <p id="dmsg" class="hint" role="status"></p>
  <textarea id="djson" spellcheck="false" aria-label="월드 데이터 JSON" placeholder="JSON 열기를 누르거나 여기에 붙여 넣으세요"></textarea>`;
}
function bindData(){
  const msg=t=>$('#dmsg').textContent=t;
  document.querySelectorAll('[data-slot]').forEach(b=>b.onclick=async()=>{const str=packDB(DB);try{await idbSet(STORE,str)}catch(e){}
    SLOT=b.dataset.slot;try{localStorage.setItem(STORAGE_NS+'-slot',SLOT)}catch(e){};STORE=STORE_BASE+SLOT;DB=await loadDB();LAST=null;LASTSER=null;MC.res=null;SSET.view=null;saveDB();VIEW='season';nav()});
  $('#dshow').onclick=()=>{$('#djson').value=packDB(DB);msg('압축된 JSON입니다. 그대로 복사해 두면 됩니다.')};
  $('#dapply').onclick=()=>{try{const d=unpackDB($('#djson').value);if(!d.teams||!d.players||!d.patch||!d.regions)throw new Error('teams, players, patch, regions 항목이 필요합니다');
    if(d.version!==SAVE_VERSION)throw new Error(`이 세이브는 현재 버전(${SAVE_VERSION})과 호환되지 않습니다`);DB=d;saveDB();LAST=null;LASTSER=null;MC.res=null;msg('적용했습니다.')}catch(e){msg('적용하지 못했습니다 — '+e.message)}};
  $('#dcopy').onclick=()=>{const v=$('#djson').value||packDB(DB);navigator.clipboard&&navigator.clipboard.writeText(v).then(()=>msg('복사했습니다.'),()=>msg('복사 권한이 없습니다. JSON 열기 후 직접 선택해서 복사하세요.'))};
  $('#dreset').onclick=()=>{if(!confirm('이 슬롯의 커리어가 모두 지워집니다. 계속할까요?'))return;DB=buildWorld();saveDB();LAST=null;LASTSER=null;MC.res=null;VIEW='season';nav()};
}


// ---------- 시리즈 ----------
const tname=id=>DB.teams[id]?DB.teams[id].name:id, tshort=id=>DB.teams[id]?DB.teams[id].short:id;
const pnm=id=>DB.players[id]?DB.players[id].name:id;
function renderSeries(rec,big){
  const aw=rec.winner===rec.a;
  return `<section class="board ser">
    <div class="side blue ${aw?'won':''}"><div class="tname">${esc(tname(rec.a))}</div><div class="res">${aw?'승리':'패배'}</div></div>
    <div class="score"><span>${rec.score[0]}</span><i>:</i><span>${rec.score[1]}</span><div class="dur">Bo${rec.bestOf}${rec.fearless?' · 하드 피어리스':''}${rec.patch?' · 패치 '+esc(rec.patch):''}</div></div>
    <div class="side red ${!aw?'won':''}"><div class="tname">${esc(tname(rec.b))}</div><div class="res">${!aw?'승리':'패배'}</div></div>
  </section>
  <section><h3>세트별 결과</h3><ol class="games">${rec.games.map((g,i)=>`<li><button class="game" data-g="${i}">
    <span class="gn">${g.n}세트</span>
    <span class="gside"><i class="dot blue"></i>${esc(tshort(g.blue))} <b>${g.kills[0]}</b> : <b>${g.kills[1]}</b> ${esc(tshort(g.red))}<i class="dot red"></i></span>
    <span class="gw">${esc(tshort(g.winner))} 승 · ${g.dur}</span>
    ${g.picks?`<span class="gp">블루 ${g.picks[0].map(c=>esc(championLabel(DB,c))).join(', ')}<br>레드 ${g.picks[1].map(c=>esc(championLabel(DB,c))).join(', ')}</span>`:''}
    <span class="gm">${g.sideBy?`${esc(tshort(g.sideBy))} 선택권: ${esc(g.sideWhy||'')} · 선픽 ${esc(tshort(g.firstPick||g.blue))} · `:''}POG ${esc(pnm(g.mvp))}${g.mods&&(Math.abs(g.mods[g.blue]||0)+Math.abs(g.mods[g.red]||0))>0?` · 멘탈 보정 ${esc(tshort(g.blue))} ${fmtMod(g.mods[g.blue])} / ${esc(tshort(g.red))} ${fmtMod(g.mods[g.red])}`:''}</span>
  </button></li>`).join('')}</ol><p class="hint">세트를 누르면 전체 경기 기록이 열립니다.</p></section>
  <div class="gamedetail"></div>`;
}
function fmtMod(v){v=v||0;return (v>=0?'+':'')+(v*100).toFixed(1)+'%'}
function bindSeries(root,rec){
  root.querySelectorAll('.game').forEach(b=>b.onclick=()=>{
    if(rec.lite){root.querySelector('.gamedetail').innerHTML='<p class="hint">저장 공간을 아끼려고 다른 지역 리그 경기는 세트 요약만 보관합니다. 전체 기록은 내 지역 리그와 국제대회에서 볼 수 있습니다.</p>';return}
    root.querySelectorAll('.game').forEach(x=>x.classList.toggle('sel',x===b));
    LAST=replayGame(DB,rec,rec.games[+b.dataset.g]);
    const d=root.querySelector('.gamedetail'); d.innerHTML=renderResult(LAST); bindResult(); d.scrollIntoView({behavior:'smooth',block:'start'});
  });
}

// ---------- 시즌 (월드) ----------
let SSET={team:'HTG',region:null,division:null,seed:freshInternalSeed('world'),tab:'table',view:null};
function mySeasonKey(){const w=DB.world,rid=DB.teams[managedTeamId(DB)].region;const ks=Object.values(w.seasons).filter(s=>s.region===rid).sort((a,b)=>(b.split||0)-(a.split||0));return ks.length?ks[0].key:null}
function curS(){const w=DB.world;if(!SSET.view||!w.seasons[SSET.view])SSET.view=mySeasonKey()||Object.keys(w.seasons)[0];return w.seasons[SSET.view]}
function sName(s){return DB.competitions[s.comp].name+(s.label?' '+s.label:'')}
function nextMine(){
  const w=DB.world,me=managedTeamId(DB);let best=null;
  for(const s of Object.values(w.seasons)){if(s.done)continue;for(const d of s.days.slice(s.cur)){const m=d.matches.find(m=>m.a===me||m.b===me);if(m){if(!best||d.date<best.d.date)best={s,d,m};break}}}
  return best;
}
function phaseText(w){if(w.phase==='season'){const st=w.steps[w.step];return (st?st.label+' 진행 중':'')+` · 패치 ${DB.patch.id}`}return w.phase==='offseason'?'시즌 종료':w.phase==='market'?'이적 시장':'오프시즌'}
function viewSeason(){
  const w=DB.world;
  if(!w) return seasonSetup();
  if(w.phase==='pick') return `<section class="teamhead"><h2>팀 선택</h2><p>${w.fired?'해임되었습니다. ':''}새로 맡을 팀을 고르세요. 세계와 기록은 그대로 이어집니다.</p></section><section class="controls"><label>팀<select id="pickteam">${teamOpts(managedTeamId(DB))}</select></label><button class="primary" id="pickgo">이 팀으로 계속</button></section>`;
  if(w.phase==='initial_roster') return renderInitialRosterMarket();
  const me=managedTeamId(DB), T=DB.teams[me], k=mySeasonKey(), lgS=k&&w.seasons[k];
  const reg=lgS?standings(DB,lgS,'regular'):[], mine=reg.find(x=>x.tid===me), rank=reg.indexOf(mine)+1;
  const nx=nextMine(), nd=nextDate(DB);
  let right='';
  if(w.phase==='season') right=`<div class="nextm"><span>${nd?esc(nd)+' 진행 예정':''}</span><b>${nx?`다음 경기 ${esc(nx.d.date)} — vs ${esc(tname(nx.m.a===me?nx.m.b:nx.m.a))} (${esc(sName(nx.s))} · Bo${nx.m.bo})`:'이번 단계에 남은 경기가 없습니다'}</b></div>`;
  else{const last=DB.history.filter(h=>h.year===w.year&&h.intl).slice(-1)[0];right=`<div class="champ"><span>${w.year} ${last?esc(last.compName):''} 우승</span><b>${last?esc(tname(last.champion)):'—'}</b></div>`}
  return `<section class="seasonhead">
    <div><h2>${w.year} 시즌</h2><p>${esc(T.name)} · ${esc(DB.regions[T.region].leagueName)}${lgS?' '+esc(lgS.label):''} ${mine&&(mine.w+mine.l)?`${rank}위 (${mine.w}승 ${mine.l}패)`:''} · ${esc(phaseText(w))}</p></div>${right}
  </section>
  ${SAVEFAIL?'<p class="warn">브라우저 저장 공간이 부족해 진행 상황을 저장하지 못했습니다. 데이터 탭에서 JSON을 복사해 두세요.</p>':''}
  <section class="controls">${controlsFor(w)}<span id="sprog" class="hint" role="status"></span></section>
  ${w.phase==='market'&&w.manage==='manual'?renderMarket():''}
  ${(w.phase==='preseason'||w.phase==='market')&&w.report?renderReport(w.report):''}
  ${chapters(w)}
  <div class="seg tabs">${[['table','순위'],['sched','일정·결과'],['bracket','토너먼트'],['stats','기록'],['hist','세계·역대']].map(([k,l])=>`<button data-st="${k}" aria-pressed="${SSET.tab===k}">${l}</button>`).join('')}</div>
  <div id="stab">${seasonTab()}</div>`;
}
// 시즌을 챕터(단계)별로 묶어 보여준다: 1장 스프링 → 2장 퍼스트 스탠드 → 3장 MSI 기간 → …
function chapters(w){
  const cur=curS(), myR=DB.teams[managedTeamId(DB)].region, open=SSET.chap??w.step;
  return `<div class="chapters">${w.steps.map((st,i)=>{
    const ss=Object.values(w.seasons).filter(s=>stepOf(DB,s)===i).sort((a,b)=>(b.region===myR)-(a.region===myR)||(a.div||1)-(b.div||1)||(DB.competitions[a.comp].tier==='low')-(DB.competitions[b.comp].tier==='low'));
    const state=i<w.step||w.phase!=='season'?'done':i===w.step?'now':'next';
    const title=st.kind==='intl'?(DB.worldConfig.internationals.find(x=>x.id===(st.ids||[st.id])[0])||{name:st.label}).name+((st.ids||[]).length>1?' 기간':''):st.label+' 리그';
    const isOpen=i===open;
    return `<section class="chap ${state} ${isOpen?'open':''}"><button class="chaphead" data-chap="${i}" aria-expanded="${isOpen}"><span class="cn">${i+1}장</span><b>${esc(title)}</b><small>${state==='done'?'완료':state==='now'?'진행 중':'예정'}${ss.length?` · 대회 ${ss.length}개`:''}</small></button>
      ${isOpen&&ss.length?`<div class="chips">${ss.map(s=>{const c=DB.competitions[s.comp];return `<button data-view="${s.key}" aria-pressed="${cur===s}">${esc(c.short)}${s.div===2?' 2부':''}${c.tier==='low'?' <small>중하위</small>':''}${s.done?' ✓':''}</button>`}).join('')}</div>`:''}
      ${isOpen&&!ss.length?'<p class="hint">아직 시작 전입니다.</p>':''}</section>`}).join('')}</div>`;
}
function controlsFor(w){
  if(w.phase==='offseason') return `<button class="primary" id="soff">오프시즌 진행</button><span class="hint">성장·노쇠, 은퇴, 승강, 세계 변화, 신인, 로스터 정비가 처리됩니다.</span>`;
  if(w.phase==='market') return `<button class="primary" id="smkt">이적 시장 마감</button><label class="inl">내 팀 운영 <select id="smanage">${[['manual','직접'],['ai','AI 위임']].map(([k,l])=>`<option value="${k}"${w.manage===k?' selected':''}>${l}</option>`).join('')}</select></label><span class="hint">${w.manage==='manual'?'재계약·방출·FA 제안·이적 제안을 마친 뒤 마감하세요.':'AI가 내 팀 계약을 처리합니다.'}</span>`;
  if(w.phase==='preseason') return w.fired?`<button class="primary" id="sreset">새 팀 고르기</button>`:`<button class="primary" id="snew">${DB.year} 시즌 시작</button><button class="ghost" id="sreset">맡을 팀 바꾸기</button>`;
  return `<button class="primary" id="sday">다음 경기일 진행</button><button class="ghost" id="smine"${nextMine()?'':' disabled'}>내 경기까지</button><button class="ghost" id="sstep">이번 단계 끝까지</button><button class="ghost" id="send">시즌 끝까지</button>`;
}
function renderReport(r){
  const nm=id=>DB.players[id]?DB.players[id].name:'?';
  const mineT=managedTeamId(DB);
  const sig=r.signings.slice().sort((a,b)=>(b.team===mineT)-(a.team===mineT));
  return `<section class="report"><h3>${r.year} 오프시즌 리포트</h3>
   ${r.myGoal?`<p class="${r.myGoal.ok?'hi':'lo'}"><b>구단주 목표 "${GOAL_KO[r.myGoal.goal]}" ${r.myGoal.ok?'달성':'미달'}</b>${!r.myGoal.ok?` — 구단주 인내심 ${DB.teams[managedTeamId(DB)].owner.patience??0}`:''}</p>`:''}
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

// ----- 세계 만들기 (커리어 시작 전에만) -----
const SEL_KO={splits:{1:'단일 시즌',2:'2스플릿',3:'3스플릿'},legs:{1:'싱글',2:'더블'},regularBo:{3:'Bo3',5:'Bo5'},playoffTake:{4:'4팀',6:'6팀',8:'8팀'},playoffBo:{3:'Bo3',5:'Bo5'},system:{franchise:'프랜차이즈',relegation:'승강제',mixed:'혼합 (상위 절반 보호)'},slots:{1:'1장',2:'2장',3:'3장',4:'4장',5:'5장'},relegate:{1:'1팀',2:'2팀'},div2:{0:'없음',1:'있음'},div2Teams:{4:'4팀',6:'6팀',8:'8팀',10:'10팀'}};
const ISEL_KO={timing:{early:'윈터 이후',mid:'스프링 이후',end:'서머 이후'},entry:{champions:'직전 스플릿 우승팀',slots:'지역별 진출권',next:'상위 대회 진출권 다음 순위 팀',div2:'하부 리그 상위 팀'},format:INTL_FORMATS,bo:{3:'Bo3',5:'Bo5'}};
function sel(path,val,opts){return `<select data-cfg="${path}">${Object.entries(opts).map(([k,l])=>`<option value="${k}"${String(val)===k?' selected':''}>${l}</option>`).join('')}</select>`}
function regionCard(r,i){
  return `<div class="cfgcard compact"><div class="cfghead"><b>${esc(r.leagueName)} <small class="hint">${esc(r.name)}</small></b></div>
    <p class="hint">${r.teams}팀 · ${fmtRegion(r)} · 월즈 ${r.slots}장</p></div>`;
}
function intlCard(it,i){
  return `<div class="cfgcard compact"><div class="cfghead"><b>${esc(it.name)}</b></div>
    <p class="hint">${it.tier==='low'?'중하위권 대회 · ':''}${it.zone?ZONE_KO[it.zone]+' · ':''}${ISEL_KO.timing[it.timing]} · ${ISEL_KO.entry[it.entry]||''} · ${INTL_FORMATS[it.format]||it.format}</p></div>`;
}
function seasonSetup(){
  const cfg=DB.worldConfig, dirty=DB.configDirty;
  return `<section class="teamhead"><h2>세계 만들기</h2><p>LOL GM은 고정된 글로벌 프로 생태계에서 시작합니다. 리그와 국제대회는 새 게임에서 임의로 추가·삭제하지 않으며, 이후 구조 변화는 게임 내 사무국과 세계 변화 시스템이 처리합니다.</p></section>
  <section><h3>리그 구조</h3><div class="cfgs">${cfg.regions.map(regionCard).join('')}</div></section>
  <section><h3>국제대회</h3><div class="cfgs">${cfg.internationals.map(intlCard).join('')}</div><p class="hint">퍼스트 스탠드 · MSI · 월드 챔피언십과 권역별 마스터즈/챌린저급 국제대회가 세계 일정에 포함됩니다.</p></section>
  <section><h3>세계 변화와 운영</h3><div class="controls">
    <label>세계 변화 빈도${sel('g.changes',cfg.changes,{none:'없음',low:'낮음',normal:'보통',high:'높음'})}</label>
    <label>내 팀 운영${sel('g.manage',cfg.manage||'manual',{manual:'직접 (계약·영입)',ai:'AI 위임'})}</label>
  </div></section>
  <section class="controls"><button class="primary" id="regen">이 설정으로 세계 생성</button><button class="ghost" id="cfgdef">기본 설정으로</button>
    <span id="cfgmsg" class="${dirty?'warn':'hint'}" role="status">${dirty?'설정이 바뀌었습니다. 세계를 다시 생성해야 반영됩니다.':'현재 세계가 설정과 일치합니다.'}</span></section>
  <section><h3>생성된 세계</h3>${worldTable()}</section>
  <section><h3>팀 선택</h3>${managerTeamPicker(dirty)}<div class="controls"><button class="primary" id="sstart"${dirty?' disabled':''}>이 팀으로 로스터 구성 시작</button></div></section>
  ${DB.history.length?`<section><h3>역대 기록</h3>${histTable()}</section>`:''}`;
}
// 시즌/세계/진행 UI는 ui-season.js에 분리되어 있다.
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{VIEW=b.dataset.v;nav();window.scrollTo(0,0)});
$('#main').innerHTML='<p class="empty">세계를 불러오는 중…</p>';
loadDB().then(d=>{DB=d;nav()}).catch(e=>{
  console.error('LOL GM initialization failed',e);
  $('#main').innerHTML=`<section><h2>게임을 시작하지 못했습니다</h2><p class="warn">${esc(e&&e.message?e.message:'초기화 오류')}</p><p class="hint">파일로 직접 연 HTML에서 저장소 접근이 차단된 경우 자동으로 우회합니다. 새로고침해도 계속되면 최신 HTML 미리보기를 다시 받아 주세요.</p><button class="primary" id="retryboot">다시 시도</button></section>`;
  const b=$('#retryboot');if(b)b.onclick=()=>location.reload();
});