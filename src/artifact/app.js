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
  <p class="hint">가상 프로씬 공용어가 정착된 세계이므로 국적에 따른 언어 장벽은 없습니다. 국적/지역은 외국인 등록 규정, 신인 생성, 스카우팅 범위 등에 주로 사용됩니다.</p>
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
function potLabel(p){const r=p.pot-playerOvr(p);return r>=8?'높음':r>=3?'보통':'낮음'}
function squadEditState(t){
  const root=parentTeamOf(DB,t)||t;
  if(!SQUAD_EDIT||SQUAD_EDIT.parentId!==root.id)SQUAD_EDIT={parentId:root.id,teamId:t.id,starters:{...(t.depth?.starters||{})},roles:Object.fromEntries(organizationRoster(DB,root).map(id=>[id,DB.players[id]?.rosterRole||recommendedRosterRole(DB,DB.players[id],DB.teams[DB.players[id].team])])),tactics:{...t.tactics},training:{...(t.training||defaultTraining())},rosterPlan:rosterPlanState(DB,root),dirty:false};
  SQUAD_EDIT.teamId=t.id;return SQUAD_EDIT;
}
function rosterPlanPanel(t){const root=parentTeamOf(DB,t),res=reserveTeamsOf(DB,root);if(!root||!res.length)return '';const e=squadEditState(t),v=validateRosterPlan(DB,root,e.rosterPlan),teams=organizationTeams(DB,root),counts=teams.map(x=>'<div><span>'+(x.parent?'2군':'1군')+'</span><b>'+(v.counts?.[x.id]??0)+'명</b><small>'+esc(x.name)+'</small></div>').join(''),rows=organizationRoster(DB,root).map(pid=>{const p=DB.players[pid],cur=DB.teams[p.team],dst=e.rosterPlan.assignments[pid]||p.team,opts=teams.map(x=>'<option value="'+x.id+'"'+(dst===x.id?' selected':'')+'>'+(x.parent?'2군':'1군')+' · '+esc(x.short)+'</option>').join('');return '<tr><td><b>'+esc(p.name)+'</b></td><td>'+ROLE_KO[p.role]+'</td><td>'+(cur.parent?'2군':'1군')+'</td><td><select data-squad-dst="'+p.id+'">'+opts+'</select></td></tr>'}).join('');return '<section><h3>1군 · 2군 배치</h3><p class="hint">바꾸고 싶은 선수만 선택하고 변경사항 적용을 누르면 최종 상태 전체를 한 번에 검증합니다.</p><div class="fin">'+counts+'</div>'+(v.ok?'':'<p class="lo">'+v.errors.map(esc).join(' · ')+'</p>')+'<div class="scroll"><table><thead><tr><th>선수</th><th>포지션</th><th>현재</th><th>변경 후</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>'}
function discardSquadEdit(){SQUAD_EDIT=null;nav()}
function applySquadEdit(){const t=DB.teams[SQUAD_EDIT?.teamId];if(!t)return;const e=SQUAD_EDIT,checked=validateRosterPlan(DB,e.parentId,e.rosterPlan);if(!checked.ok){MSG=checked.errors.join(' · ');navKeepScroll();return}applyRosterPlan(DB,e.parentId,e.rosterPlan);for(const r of ROLES){const p=DB.players[e.starters[r]];if(p&&p.team===t.id)setDepthStarter(DB,t,r,p,'manager',false)}for(const [id,role] of Object.entries(e.roles)){const p=DB.players[id];if(p&&p.rosterRole!==role)setRosterRole(DB,p,role,'manager',false)}t.tactics={...e.tactics};t.training={...e.training};SQUAD_EDIT=null;MSG='';saveDB();nav()}
function viewSquad(){
  SQUAD=SQUAD&&DB.teams[SQUAD]&&DB.teams[SQUAD].active!==false?SQUAD:(DB.world?managedTeamId(DB):activeTeams(DB)[0].id);
  const t=DB.teams[SQUAD], ps=t.roster.map(id=>DB.players[id]).sort((a,b)=>ROLES.indexOf(a.role)-ROLES.indexOf(b.role)||playerOvr(b)-playerOvr(a));
  const mineOrg=DB.world&&(t.id===managedTeamId(DB)||t.parent===managedTeamId(DB)), kAvg=Math.round(avg(ps.map(p=>knowledge(DB,p))));
  const edit=mineOrg?squadEditState(t):null,tr=edit?edit.training:(t.training||defaultTraining()),tac=edit?edit.tactics:t.tactics;
  return `<section class="controls"><label>팀<select id="sq">${teamOpts(SQUAD)}</select></label></section>
  <section class="teamhead"><h2>${esc(t.name)}</h2><p>${t.formerNames&&t.formerNames.length?'전신 '+t.formerNames.map(esc).join(', ')+' · ':''}${esc(DB.regions[t.region].leagueName)} · 감독 ${esc(t.coach.name)} (밴픽 ${t.coach.draft} · 분석 ${t.coach.analysis} · 육성 ${t.coach.development}) · 운영 철학 ${PHIL_KO[t.philosophy]||'균형'} · 팬덤 ${t.fans??'—'} · 팀 호흡 ${Math.round(teamSynergy(t))}${t.goal?` · 구단주 목표: ${GOAL_KO[t.goal]}`:''}</p><p class="hint">훈련은 한정된 포인트를 어디에 배분할지 선택합니다. 주전을 자주 바꾸면 팀 호흡이 떨어집니다.</p></section>
  <section><h3>팀 전술</h3><div class="tac">
    ${Object.keys(TAC_KO).map(k=>`<label><span>${TAC_KO[k]}<output>${tac[k]}</output></span><input type="range" min="0" max="100" value="${tac[k]}" data-tac="${k}"></label>`).join('')}
  </div></section>
  ${financePanel(t)}
  ${mineOrg?rosterPlanPanel(t):''}
  ${(()=>{const r=trainingRecommendation(DB,t),ko={light:'가볍게',normal:'보통',high:'강하게'};return `<p class="hint">추천: ${ko[r.intensity]} 훈련 · ${r.next?`다음 공식전 ${r.days}일 전`:'공식전 일정 없음'} · 평균 피로 ${Math.round(r.fat)} / 컨디션 ${Math.round(r.cond)}</p>`})()}
  <section><h3>훈련 배분 <small class="hint" id="trleft">남은 포인트 ${TRAIN_POINTS-['mechanical','laning','combat','macro','mental'].reduce((x,k)=>x+(+tr[k]||0),0)} / ${TRAIN_POINTS}</small></h3>${mineOrg?`<label>훈련 강도<select id="trint"><option value="light"${tr.intensity==='light'?' selected':''}>가볍게 · 회복 우선</option><option value="normal"${!tr.intensity||tr.intensity==='normal'?' selected':''}>보통 · 균형</option><option value="high"${tr.intensity==='high'?' selected':''}>강하게 · 성장 우선</option></select></label>`:`<p class="hint">훈련 강도: ${tr.intensity==='high'?'강하게':tr.intensity==='light'?'가볍게':'보통'}</p>`}<div class="tac">
    ${Object.keys(ATTR_GROUPS).map(g=>`<label><span>${GROUP_KO[g]}<output>${tr[g]}</output></span><input type="range" min="0" max="${TRAIN_POINTS}" value="${tr[g]}" data-tr="${g}"></label>`).join('')}
  </div>${mineOrg?'<div class="controls"><button class="primary" id="sqapply">변경사항 적용</button><button class="ghost" id="sqdiscard">변경 취소</button><span class="hint">주전·역할·전술·훈련을 여러 개 조정한 뒤 한 번에 적용합니다.</span></div>':''}<p class="hint">훈련 포인트는 총 ${TRAIN_POINTS}점입니다. 한 영역에 몰면 그 영역은 크게 오르지만 나머지는 덜 오르거나 떨어지고, 배분하지 않은 포인트는 버려집니다. 한 시즌에 영역별로 오를 수 있는 폭과, 잠재력보다 한참 높게 오르는 것에도 한계가 있습니다.</p>
  <div class="fin">${(()=>{const f=ensureFacilities(t),names={training:'훈련',analysis:'분석',recovery:'회복',youth:'유소년'};return Object.keys(names).map(k=>`<div><span>${names[k]} 시설</span><b>${f[k]} / 5</b><small>구단 자동 관리 </small></div>`).join('')})()}</div><p class="hint">훈련·유소년 시설은 성장, 분석 시설은 상대/메타 분석, 회복 시설은 피로 회복에 직접 적용됩니다. 연 유지비 ${money(facilityUpkeep(DB,t))}</p></section>
  <section><h3>로스터</h3><div class="scroll"><table class="roster"><thead><tr><th>포지션</th><th>선수</th><th>선발</th><th>역할</th><th>만족도</th><th>나이</th><th>종합</th><th>성장 여지</th><th>명성</th><th>시장가치</th><th>폼</th><th>컨디션</th><th>경기 감각</th><th>피로</th><th>사기</th><th>연봉</th><th>계약</th>${Object.keys(ATTR_GROUPS).map(g=>`<th>${GROUP_KO[g]}</th>`).join('')}</tr></thead><tbody>
    ${ps.map(p=>{const st=pState(p);ensureSatisfaction(p);const shownRole=edit?.roles[p.id]||p.rosterRole||recommendedRosterRole(DB,p,t),shownStarter=edit?.starters[p.role]===p.id;const roleCtl=mineOrg?`<select data-srole="${p.id}" aria-label="${esc(p.name)} 로스터 역할">${SQUAD_ROLES.map(r=>`<option value="${r}"${shownRole===r?' selected':''}>${SQUAD_ROLE_KO[r]}</option>`).join('')}</select>`:SQUAD_ROLE_KO[p.rosterRole||recommendedRosterRole(DB,p,t)];return `<tr data-p="${p.id}" tabindex="0" class="${OPEN_P===p.id?'open':''}"><td><span class="role">${ROLE_KO[p.role]}</span></td><td><b>${esc(p.name)}</b>${(edit?shownStarter:starterFor(DB,t,p.role)===p)?'':' <small class="hint">후보</small>'}</td><td>${mineOrg?(shownStarter?'<b class="hi">선발</b>':`<button class="ghost sm2" data-starter="${p.id}" data-role="${p.role}">주전 지정</button>`):(starterFor(DB,t,p.role)===p?'선발':'후보')}</td><td>${roleCtl}</td><td class="num ${p.satisfaction<35?'lo':p.satisfaction>=70?'hi':''}">${Math.round(p.satisfaction)}<small class="hint"> ${satisfactionLabel(p.satisfaction)}</small>${p.wantsOut?' <span class="lo">이적요청</span>':''}</td><td class="num">${p.age}</td><td>${ovrTag(obsOvr(DB,p))}${knowledge(DB,p)<100?'<small class="hint">?</small>':''}</td><td>${potText(p)}</td><td class="num">${p.reputation??'—'}</td><td class="num">${money(playerMarketValue(DB,p))}</td><td class="num">${st.form>=3?'<span class="hi">▲</span>':st.form<=-3?'<span class="lo">▼</span>':'–'}</td><td class="num">${Math.round(st.condition)}</td><td class="num">${Math.round(st.sharpness)}</td><td class="num">${Math.round(st.fatigue)}</td><td class="num ${st.morale<35?'lo':''}">${Math.round(st.morale)}${p.wantsOut?' 이적요청':''}</td><td class="num">${p.contract?money(p.contract.salary):'—'}</td><td class="num">${p.contract?'~'+p.contract.until:'—'}</td>${Object.keys(ATTR_GROUPS).map(g=>`<td>${ovrTag(grpAvg(p,g,knowledge(DB,p)))}</td>`).join('')}</tr>`}).join('')}
  </tbody></table></div><p class="hint">선수를 누르면 세부 능력치, 챔피언 폭, 커리어가 열립니다.${mineOrg?'':` 스카우팅 정보 ${kAvg}% — 정보가 적을수록 실제와 다르게 보입니다.`}</p>${DB.world&&!mineOrg?`<div class="controls"><button class="ghost" id="scoutT">이 팀 집중 스카우팅 (${money(0.5*psOf(DB,DB.teams[managedTeamId(DB)].region))})</button><span id="scmsg" class="hint"></span></div>`:''}</section>
  <div id="pdetail">${OPEN_P&&DB.players[OPEN_P]&&DB.players[OPEN_P].team===SQUAD?playerDetail(DB.players[OPEN_P]):''}</div>${mineOrg?scoutingSearchBlock():''}`;
}
function potText(p){const r=scoutPotentialRange(DB,p);return r[0]===r[1]?String(r[0]):`${r[0]}~${r[1]}`}
function playerCompetitionIds(p){const ids=new Set();if(DB.world)for(const s of Object.values(DB.world.seasons)){if(s.pstats&&s.pstats[p.id]&&s.pstats[p.id].g)ids.add(s.comp)}for(const c of p.career||[])if(c.comp)ids.add(c.comp);return [...ids]}
function undervaluedProspect(p){const a=scoutAbilityRange(DB,p),pot=scoutPotentialRange(DB,p),mv=playerMarketValue(DB,p)/Math.max(.2,psOf(DB,p.team&&DB.teams[p.team]?DB.teams[p.team].region:p.region));return p.age<=22&&pot[1]>=a[1]+6&&mv<Math.max(3,(a[1]-58)*1.25)}
function scoutReportSummary(p){const r=scoutReport(DB,p),s=r.sample,ch=r.champions.map(x=>championLabel(DB,x.id)+' '+x.mastery).join(' · ')||'표본 없음',fresh=r.lastSeenDate?(r.staleYears?`${r.staleYears}시즌 전`:r.lastSeenDate):'미관찰';return `<div class="fin"><div><span>보고서 신뢰도</span><b>${r.knowledge}%</b><small>${fresh} · 관찰 ${r.observations}회</small></div><div><span>현재 기량 추정</span><b>${r.ability[0]}~${r.ability[1]}</b><small>어린/해외/2부/저표본일수록 범위 확대</small></div><div><span>잠재 범위</span><b>${r.potential[0]}~${r.potential[1]}</b><small>완전 관찰 후에도 오차 유지</small></div><div><span>성장 추세</span><b>${r.growth.label}</b><small>${r.growth.delta===null?'시즌 표본 필요':(r.growth.delta>=0?'+':'')+r.growth.delta}</small></div></div><p class="hint">공식 표본 ${s.g}G${s.rating!==null?` · 평점 ${s.rating.toFixed(2)} · KDA ${s.kda.toFixed(2)} · DPM ${Math.round(s.dpm)}`:''} · 주요 챔피언 ${esc(ch)}</p>`}
function scoutingSearchBlock(){
  if(!DB.world)return '';const me=managedTeam(DB),compIds=[...new Set(Object.values(DB.competitions).map(c=>c.id))];let ps=Object.values(DB.players).filter(p=>!p.retired&&p.team!==me.id&&!(p.team&&DB.teams[p.team]&&DB.teams[p.team].parent===me.id));
  if(SCOUTSET.region!=='ALL')ps=ps.filter(p=>p.region===SCOUTSET.region);if(SCOUTSET.role!=='ALL')ps=ps.filter(p=>p.role===SCOUTSET.role);if(SCOUTSET.contract==='fa')ps=ps.filter(p=>!p.contract);else if(SCOUTSET.contract==='contracted')ps=ps.filter(p=>!!p.contract);else if(SCOUTSET.contract==='rookie')ps=ps.filter(p=>p.age<=20&&(p.proSeasons||0)<=1);
  if(SCOUTSET.competition!=='ALL')ps=ps.filter(p=>playerCompetitionIds(p).includes(SCOUTSET.competition));if(SCOUTSET.undervalued)ps=ps.filter(undervaluedProspect);if(SCOUTSET.q)ps=ps.filter(p=>p.name.toLowerCase().includes(SCOUTSET.q.toLowerCase()));
  ps=ps.sort((a,b)=>{const ap=scoutPotentialRange(DB,a)[1]+obsOvr(DB,a)*.5-a.age*.12,bp=scoutPotentialRange(DB,b)[1]+obsOvr(DB,b)*.5-b.age*.12;return bp-ap}).slice(0,40);
  return `<section><h3>스카우팅 센터</h3><p class="hint">검색 결과는 현재 보고서와 공식 경기 표본만 사용합니다. 잠재력은 끝까지 범위로 남습니다.</p><div class="controls"><label>지역<select id="screg"><option value="ALL">전체</option>${Object.values(DB.regions).map(r=>`<option value="${r.id}"${SCOUTSET.region===r.id?' selected':''}>${esc(r.name)}</option>`).join('')}</select></label><label>포지션<select id="scrole"><option value="ALL">전체</option>${ROLES.map(r=>`<option value="${r}"${SCOUTSET.role===r?' selected':''}>${ROLE_KO[r]}</option>`).join('')}</select></label><label>계약<select id="sccontract">${[['all','전체'],['fa','FA'],['contracted','계약 중'],['rookie','신인/유망주']].map(([v,l])=>`<option value="${v}"${SCOUTSET.contract===v?' selected':''}>${l}</option>`).join('')}</select></label><label>대회<select id="sccomp"><option value="ALL">전체</option>${compIds.map(id=>`<option value="${id}"${SCOUTSET.competition===id?' selected':''}>${esc((DB.competitions[id]||{name:id}).name)}</option>`).join('')}</select></label><label><input type="checkbox" id="scunder"${SCOUTSET.undervalued?' checked':''}> 저평가 유망주</label><label>선수<input id="scq" value="${esc(SCOUTSET.q)}" placeholder="이름 검색"></label></div><div class="scroll"><table><thead><tr><th><input type="checkbox" id="scall" aria-label="전체 선택"></th><th>선수</th><th>지역</th><th>나이</th><th>포지션</th><th>소속</th><th>기량 추정</th><th>잠재</th><th>공식 표본</th><th>성장</th><th>보고서</th><th></th></tr></thead><tbody>${ps.map(p=>{const r=scoutReport(DB,p),tm=p.team&&DB.teams[p.team];return `<tr><td><input type="checkbox" data-scout-select="${p.id}" aria-label="${esc(p.name)} 선택"></td><td><b>${esc(p.name)}</b></td><td>${esc((DB.regions[p.region]||{name:p.region}).name)}</td><td class="num">${p.age}</td><td>${ROLE_KO[p.role]}</td><td>${tm?esc(tm.short):'FA'}</td><td class="num">${r.ability[0]}~${r.ability[1]}</td><td class="num">${r.potential[0]}~${r.potential[1]}</td><td class="num">${r.sample.g}G${r.sample.rating!==null?' · '+r.sample.rating.toFixed(2):''}</td><td>${esc(r.growth.label)}</td><td class="num">${r.knowledge}%</td><td><button class="ghost sm2" data-scout="${p.id}">관찰</button></td></tr>`}).join('')||'<tr><td colspan="11" class="empty">조건에 맞는 선수가 없습니다.</td></tr>'}</tbody></table></div><div class="controls"><button class="primary" id="scbatch">선택 선수 일괄 관찰</button><span class="hint">최대 10명을 한 번에 관찰합니다.</span></div></section>`;
}
function playerDetail(p){
  const k=knowledge(DB,p),team=p.team&&DB.teams[p.team],st=pState(p),nat=DB.regions[p.nationality||p.region],secondary=(p.secondaryRoles||[]).map(r=>ROLE_KO[r]+' '+roleFamiliarity(p,r)).join(' · '),ev=(p.careerEvents||[]).slice().reverse().slice(0,16);
  return `<section class="pdet"><h3>${esc(p.name)} <small>${ROLE_KO[p.role]} · ${p.age}세 · ${careerStage(p)} · 종합 ${obsOvr(DB,p)}${k<100?` (스카우팅 ${k}%)`:''} · 잠재 ${potText(p)}</small></h3>
  <div class="fin"><div><span>국적</span><b>${esc(nat?nat.name:(p.nationality||p.region||'—'))}</b><small>${playerSquadLabel(DB,p)}${team?` · ${esc(team.name)}`:''}</small></div><div><span>주포지션</span><b>${ROLE_KO[p.role]}</b><small>${secondary?'전향 숙련 '+esc(secondary)+' · 공식전 자격 아님':'전향 숙련 없음'}</small></div><div><span>명성</span><b>${p.reputation??'—'}</b><small>실력과 별도 · 성과 기반</small></div><div><span>시장가치</span><b>${money(playerMarketValue(DB,p))}</b><small>${p.contract?`연봉 ${money(p.contract.salary)} · ~${p.contract.until}`:'FA'}</small></div></div>
  ${scoutReportSummary(p)}
  <div class="fin"><div><span>폼</span><b>${st.form>0?'+':''}${st.form.toFixed(1)}</b></div><div><span>컨디션</span><b>${Math.round(st.condition)}</b></div><div><span>경기 감각</span><b>${Math.round(st.sharpness)}</b></div><div><span>피로</span><b>${Math.round(st.fatigue)}</b></div><div><span>사기</span><b>${Math.round(st.morale)}</b></div><div><span>팀 적응</span><b>${Math.round(st.teamAdaptation)}</b><small>전술 ${Math.round(st.tacticalAdaptation)}</small></div></div>
  ${(()=>{ensureSatisfaction(p);const u=p.usage&&p.usage.year===DB.year?p.usage:null,actual=u&&u.teamGames?Math.round(actualPlayShare(p)*100):0,exp=Math.round(expectedPlayShare(p,team)*100),reasons=p.satisfactionReasons.map(x=>SAT_REASON_KO[x]||x);return `<h4>역할 / 만족도</h4><div class="fin"><div><span>현재 선발</span><b>${team&&starterFor(DB,team,p.role)===p?'선발':'후보'}</b><small>Depth Chart 고정</small></div><div><span>약속된 역할</span><b>${SQUAD_ROLE_KO[p.rosterRole]||'—'}</b><small>기대 출전 ${exp}%</small></div><div><span>실제 기용</span><b>${u?`${actual}%`:'기록 없음'}</b><small>${u?`${u.games}/${u.teamGames}게임`:'시즌 시작 전'}</small></div><div><span>만족도</span><b class="${p.satisfaction<35?'lo':p.satisfaction>=70?'hi':''}">${Math.round(p.satisfaction)} · ${satisfactionLabel(p.satisfaction)}</b><small>${reasons.length?reasons.map(esc).join(' · '):'주요 불만 없음'}</small></div><div><span>커리어 목표</span><b>${CAREER_GOAL_KO[playerCareerGoal(p)]}</b><small>${p.wantsOut?`이적 요청 · ${SAT_REASON_KO[p.wantsOutReason]||'불만'}`:'잔류 상태'}</small></div></div>`})()}
  ${p.titles&&p.titles.length?`<p class="titles">${p.titles.map(esc).join(' · ')}</p>`:''}
  ${(()=>{const q=playerCoreMetrics(p),labels={laning:'라인전',skirmish:'교전',teamfight:'한타',positioning:'포지셔닝',damage:'딜링',survival:'생존',vision:'시야',objective:'오브젝트 판단',roaming:'로밍',macro:'운영',sidelane:'사이드',decision:'판단',stability:'안정성',aggression:'공격성',concentration:'집중력',adaptability:'적응력',volatility:'기복',championLearning:'챔피언 학습',metaAdaptation:'메타 적응'};return `<h4>핵심 선수 지표 <small class="hint">세부 능력치·성향에서 파생</small></h4><div class="agrid">${Object.entries(labels).map(([x,l])=>`<div class="arow"><span>${l}${x==='volatility'?' (낮을수록 안정)':''}</span>${ovrTag(q[x])}</div>`).join('')}</div>`})()}
  <div class="agrid">${Object.keys(ATTR_GROUPS).map(g=>`<div class="agroup"><h4>${GROUP_KO[g]}</h4>${ATTR_GROUPS[g].map(x=>`<div class="arow"><span>${ATTR_KO[x]}</span>${ovrTag(obsAttr(DB,p,x,k))}</div>`).join('')}</div>`).join('')}
  <div class="agroup"><h4>플레이 성향</h4>${TENDENCIES.map(x=>`<div class="arow"><span>${TEND_KO[x]}</span><span class="bar"><i style="width:${p.tend[x]}%"></i></span></div>`).join('')}<h4 style="margin-top:12px">성격 / 성장</h4><div class="arow"><span>프로의식</span>${ovrTag(p.personality.professionalism)}</div><div class="arow"><span>야망</span>${ovrTag(p.personality.ambition)}</div><div class="arow"><span>전성기 예상</span><b>${Math.round(ensurePlayerDevelopment(p).peakAge-1)}~${Math.round(ensurePlayerDevelopment(p).peakAge+1)}세</b></div></div></div>
  <h4>챔피언 폭</h4><div class="scroll"><table class="pool"><thead><tr><th>챔피언</th><th>숙련도</th><th>공식 경험</th><th>스크림</th><th>훈련</th><th>상성 이해</th><th>자신감</th></tr></thead><tbody>${Object.entries(p.pool||{}).sort((x,y)=>y[1].mastery-x[1].mastery).map(([c,v])=>`<tr><td>${esc(championLabel(DB,c))}</td><td>${ovrTag(v.mastery)}</td><td class="num">${Math.round(v.experience||0)}</td><td class="num">${Math.round(v.scrimExperience||0)}</td><td class="num">${Math.round(v.trainingExperience||0)}</td><td class="num">${v.matchup_knowledge}</td><td class="num">${v.confidence}</td></tr>`).join('')}</tbody></table></div>
  ${p.career.length?`<h4 style="margin-top:14px">커리어</h4><div class="scroll"><table class="pool"><thead><tr><th>시즌</th><th>대회</th><th>팀</th><th>구분</th><th>종합</th><th>경기</th><th>평점</th><th>KDA</th><th>KP</th><th>GPM</th><th>DPM</th><th>CS차</th><th>골드차</th><th>받은 피해</th><th>시야</th><th>옵젝</th><th>라인 우위</th><th>한타 기여</th><th>POG</th><th>당시 계약</th></tr></thead><tbody>${p.career.slice().reverse().map(c=>`<tr><td class="num">${c.year}</td><td>${esc(c.cname||c.comp)}${c.international?' · 국제':''}</td><td>${esc(c.team?tshort(c.team):'FA')}</td><td>${c.squad||''}${c.division?` · ${c.division}부`:''}</td><td class="num">${c.ovr||''}</td><td class="num">${c.g}</td><td class="num">${c.rating?c.rating.toFixed(2):'—'}</td><td class="num">${((c.k+c.a)/Math.max(1,c.d)).toFixed(2)}</td><td class="num">${c.kp!==undefined?Math.round(c.kp*100)+'%':'—'}</td><td class="num">${c.min&&c.gold?(c.gold/c.min).toFixed(0):'—'}</td><td class="num">${c.min&&c.dmg?(c.dmg/c.min).toFixed(0):'—'}</td><td class="num">${c.g?Math.round((c.csDiff||0)/c.g):'—'}</td><td class="num">${c.g?Math.round((c.goldDiff||0)/c.g):'—'}</td><td class="num">${c.g?Math.round((c.dmgTaken||0)/c.g):'—'}</td><td class="num">${c.g?((c.vision||0)/c.g).toFixed(1):'—'}</td><td class="num">${c.objectives||0}</td><td class="num">${c.laneAdv!==undefined?c.laneAdv.toFixed(2):'—'}</td><td class="num">${c.teamfights?Math.round((c.teamfightWins||0)/c.teamfights*100)+'% · '+Math.round(c.teamfightShare*100)+'%':'—'}</td><td class="num">${c.mvp}</td><td class="num">${c.salary!==null&&c.salary!==undefined?`${money(c.salary)} ~${c.contractUntil}`:'—'}</td></tr>`).join('')}</tbody></table></div>`:''}
  ${ev.length?`<h4 style="margin-top:14px">커리어 이벤트</h4><div class="scroll"><table class="pool"><thead><tr><th>시즌</th><th>유형</th><th>내용</th></tr></thead><tbody>${ev.map(e=>{const detail=e.type==='contract'?`${esc(tshort(e.team))} · ${money(e.salary)} · ~${e.until}`:e.type==='transfer'?`${esc(tshort(e.from))} → ${esc(tshort(e.to))} · ${money(e.fee)}`:e.type==='award'?`${esc(e.competition)} · ${esc(e.award)}`:e.type==='title'?`${esc(e.competition)} 우승`:e.type==='squad_move'?`${esc(tshort(e.from))} → ${esc(tshort(e.to))}`:e.type==='retirement'?`${e.age}세 은퇴 · 전성기 종합 ${e.peak}`:e.type==='release'?`${esc(tshort(e.team))} 방출`:e.type==='roster_role'?`${SQUAD_ROLE_KO[e.from]||e.from} → ${SQUAD_ROLE_KO[e.to]||e.to}`:e.type==='transfer_request'?`${SAT_REASON_KO[e.reason]||e.reason} · 이적 요청`:e.type==='transfer_request_withdrawn'?'이적 요청 철회':'—';return `<tr><td class="num">${e.year}</td><td>${({contract:'계약',transfer:'이적',award:'개인상',title:'우승',squad_move:'1·2군 이동',retirement:'은퇴',release:'방출',roster_role:'역할 변경',transfer_request:'이적 요청',transfer_request_withdrawn:'요청 철회'}[e.type]||e.type)}</td><td>${detail}</td></tr>`}).join('')}</tbody></table></div>`:''}</section>`;
}
function bindSquad(){
  const ti=$('#trint');if(ti)ti.onchange=e=>{const d=squadEditState(DB.teams[SQUAD_EDIT.teamId]);d.training.intensity=e.target.value;d.dirty=true};
  $('#sq').onchange=e=>{const next=DB.teams[e.target.value],same=SQUAD_EDIT&&parentTeamOf(DB,next)?.id===SQUAD_EDIT.parentId;if(!same)SQUAD_EDIT=null;SQUAD=e.target.value;OPEN_P=null;nav()};
  if($('#sqapply'))$('#sqapply').onclick=applySquadEdit;if($('#sqdiscard'))$('#sqdiscard').onclick=discardSquadEdit;
  document.querySelectorAll('[data-squad-dst]').forEach(el=>el.onchange=e=>{e.stopPropagation();const d=squadEditState(DB.teams[SQUAD]);d.rosterPlan.assignments[el.dataset.squadDst]=el.value;d.dirty=true;navKeepScroll()});
  if($('#scoutT'))$('#scoutT').onclick=()=>{const m=scoutPlayers(DB,DB.teams[SQUAD].roster,35,0.5*psOf(DB,DB.teams[managedTeamId(DB)].region));saveDB();nav();$('#scmsg')&&($('#scmsg').textContent=m)};
  document.querySelectorAll('[data-starter]').forEach(el=>{el.onclick=e=>{e.stopPropagation();const p=DB.players[el.dataset.starter];if(p){const d=squadEditState(DB.teams[SQUAD]);d.starters[el.dataset.role]=p.id;d.dirty=true}nav()}});
  document.querySelectorAll('[data-srole]').forEach(el=>{el.onclick=e=>e.stopPropagation();el.onchange=e=>{e.stopPropagation();const p=DB.players[el.dataset.srole];if(p){const d=squadEditState(DB.teams[SQUAD]);d.roles[p.id]=el.value;d.dirty=true}}});
  document.querySelectorAll('[data-tac]').forEach(el=>el.oninput=el.onchange=e=>{const k=el.dataset.tac;const d=squadEditState(DB.teams[SQUAD]);d.tactics[k]=+el.value;d.dirty=true;if(el.previousElementSibling)el.previousElementSibling.querySelector('output').textContent=el.value});
  document.querySelectorAll('[data-tr]').forEach(el=>el.oninput=()=>{const t=DB.teams[SQUAD],d=squadEditState(t);const k=el.dataset.tr;
    const others=Object.entries(d.training).filter(([g])=>g!==k).reduce((s,[,v])=>s+v,0), v=Math.min(+el.value,TRAIN_POINTS-others);
    el.value=v;d.training[k]=v;d.dirty=true;el.previousElementSibling.querySelector('output').textContent=v;$('#trleft').textContent=`남은 포인트 ${TRAIN_POINTS-others-v} / ${TRAIN_POINTS}`});
  const scRefresh=()=>{SCOUTSET.region=$('#screg')?.value||SCOUTSET.region;SCOUTSET.role=$('#scrole')?.value||SCOUTSET.role;SCOUTSET.contract=$('#sccontract')?.value||SCOUTSET.contract;SCOUTSET.competition=$('#sccomp')?.value||SCOUTSET.competition;SCOUTSET.undervalued=!!$('#scunder')?.checked;SCOUTSET.q=$('#scq')?.value||'';nav()};
  for(const id of ['#screg','#scrole','#sccontract','#sccomp','#scunder','#scq'])if($(id))$(id).onchange=scRefresh;
  document.querySelectorAll('[data-scout]').forEach(b=>b.onclick=e=>{e.stopPropagation();MSG=scoutPlayers(DB,[b.dataset.scout],20,.1*psOf(DB,managedTeam(DB).region));saveDB();navKeepScroll()});
  if($('#scall'))$('#scall').onchange=e=>document.querySelectorAll('[data-scout-select]').forEach(x=>x.checked=e.target.checked);
  if($('#scbatch'))$('#scbatch').onclick=()=>{const ids=[...document.querySelectorAll('[data-scout-select]:checked')].slice(0,10).map(x=>x.dataset.scoutSelect);if(!ids.length){MSG='관찰할 선수를 선택하세요';navKeepScroll();return}MSG=scoutPlayers(DB,ids,20,.1*psOf(DB,managedTeam(DB).region)*ids.length);saveDB();navKeepScroll()};
  document.querySelectorAll('tr[data-p]').forEach(tr=>{const open=()=>{OPEN_P=OPEN_P===tr.dataset.p?null:tr.dataset.p;nav();const d=$('#pdetail');if(OPEN_P&&d)d.scrollIntoView({behavior:'smooth',block:'start'})};tr.onclick=open;tr.onkeydown=e=>{if(e.key==='Enter')open()}});
}
// ---------- 몬테카를로 ----------
let MC={blue:'HTG',red:'SBZ',n:300,res:null,running:false};
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
   ${(r.coaches||[]).length?`<div class="rx"><h4>감독 교체</h4>${r.coaches.map(c=>`<p>${esc(tshort(c.team))}: ${esc(c.out)} → ${esc(c.in)}</p>`).join('')}</div>`:''}
   ${r.events.length?`<div class="rx"><h4>세계 변화</h4>${r.events.map(e=>`<p>${esc(e)}</p>`).join('')}</div>`:''}
   <div class="rgrid">
    <div><h4>가장 크게 성장</h4>${r.growth.slice(0,8).map(g=>`<div class="arow"><span>${esc(nm(g.pid))} <small>${esc(tshort(DB.players[g.pid]&&DB.players[g.pid].team))} · ${DB.players[g.pid]?DB.players[g.pid].age:''}세</small></span><span class="num hi">+${g.d} → ${g.ovr}</span></div>`).join('')}</div>
    <div><h4>하락세</h4>${r.growth.slice(-6).reverse().map(g=>`<div class="arow"><span>${esc(nm(g.pid))} <small>${DB.players[g.pid]?DB.players[g.pid].age:''}세</small></span><span class="num lo">${g.d} → ${g.ovr}</span></div>`).join('')}</div>
    ${(r.transfers||[]).length?`<div><h4>이적 (${r.transfers.length})</h4>${r.transfers.map(x=>`<div class="arow ${x.to===mineT||x.from===mineT?'minea':''}"><span>${esc(nm(x.pid))} <small>${esc(tshort(x.from))} → ${esc(tshort(x.to))}</small></span><span class="num">${money(x.fee)}</span></div>`).join('')}</div>`:''}
    <div><h4>은퇴 (${r.retired.length})</h4>${r.retired.slice(0,8).map(x=>`<div class="arow"><span>${esc(nm(x.pid))} <small>${esc(tshort(x.team))}</small></span><span class="num">${x.age}세</span></div>`).join('')||'<p class="hint">없음</p>'}</div>
    <div><h4>FA 영입 (${r.signings.length})</h4>${sig.filter(x=>!x.fill).sort((a,b)=>(b.team===mineT)-(a.team===mineT)||b.salary-a.salary).slice(0,10).map(x=>`<div class="arow ${x.team===mineT?'minea':''}"><span>${esc(tshort(x.team))} ← ${esc(nm(x.pid))}${x.import?' <small>외국인</small>':''}${x.rookie?' <small>신인</small>':''}</span><span class="num">${money(x.salary)} · ${x.years}년${x.offers>1?` <small>(${x.offers}팀 경쟁)</small>`:''}</span></div>`).join('')}</div>
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