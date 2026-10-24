// ===== LOL GM: Match / scrim / series result UI =====
// ---------- 경기 ----------
function viewMatch(){
  const act=activeTeams(DB), own=DB.world&&DB.teams[managedTeamId(DB)]?managedTeamId(DB):act[0].id;
  SEL.blue=own;
  if(!DB.teams[SEL.red]||DB.teams[SEL.red].active===false||SEL.red===own)SEL.red=(act.find(t=>t.id!==own)||act[0]).id;
  const oppOpts=Object.values(DB.regions).flatMap(r=>(r.div2?[1,2]:[1]).map(d=>`<optgroup label="${esc(d===2?divName(r):r.leagueName)}">${activeTeams(DB,r.id,d).filter(t=>t.id!==own).map(t=>`<option value="${t.id}"${t.id===SEL.red?' selected':''}>${esc(t.name)} · 연습가치 ${Math.round(scrimValue(DB,own,t.id)*100)}%</option>`).join('')}</optgroup>`)).join('');
  const ready=scrimReadiness(DB,DB.teams[own]),rec=trainingRecommendation(DB,DB.teams[own]);
  return `<section class="teamhead"><h2>스크림</h2><p>내 팀과 실제 구단을 골라 비공식 연습 경기를 진행합니다. 결과는 공식 전적·리그 순위에 반영되지 않습니다. 스크림은 선택한 세트 수를 전부 진행하며 양 팀의 잔여 연습 시간이 필요합니다.</p><p class="hint">현재 평균 피로 ${Math.round(ready.avgFatigue||0)} · 컨디션 ${Math.round(ready.avgCondition||0)} · 오늘 ${ready.games||0}게임 · ${ready.reason}</p><p class="hint">${rec.next?`다음 공식전까지 ${rec.days}일 · ${esc(DB.teams[rec.next.opponent]?.name||'상대 미정')}`:'예정된 공식전 없음'} · 스크림 추천 ${rec.scrim?'진행':'휴식'}</p></section>
  <section class="controls">
    <label>내 팀 <b>${esc(DB.teams[own].name)}</b></label>
    <label>상대팀<select id="red">${oppOpts}</select></label>
    <label>형식<select id="bo">${[1,3,5].map(n=>`<option value="${n}"${SEL.bo===n?' selected':''}>${n===1?'단판':n+'세트 전부'}</option>`).join('')}</select></label>
    <button class="ghost" id="draftpractice"${ready.ok?'':' disabled'}>밴픽 연습</button>
    <button class="primary" id="play"${ready.ok?'':' disabled'}>스크림 시작</button>
  </section>
  <div id="result">${LASTSER?renderSeries(LASTSER,true):LAST?renderResult(LAST):`<p class="empty">상대 팀과 형식을 고르고 스크림을 시작하세요. 같은 조건에서도 결과는 달라질 수 있습니다.</p>`}</div>`;
}
function bindMatch(){
  const db=DB,slot=SLOT,manager=DB.manager;
  $('#red').onchange=e=>SEL.red=e.target.value;
  $('#bo').onchange=e=>SEL.bo=+e.target.value;
  $('#draftpractice').onclick=()=>openDraftPractice(DB,SEL.blue,SEL.red);
  $('#play').onclick=()=>{if(DB!==db||SLOT!==slot||SLOT_SWITCHING||DB.manager!==manager||DB.world?.manage==='ai'||DB.world?.fired||!managerControlsSquad(DB,DB.teams[SEL.blue])||![1,3,5].includes(SEL.bo))return;const readiness=[SEL.blue,SEL.red].map(id=>scrimReadiness(DB,DB.teams[id])),blocked=readiness.find(r=>!r.ok||r.remaining<SEL.bo);if(blocked){MSG=blocked.ok?'선택한 스크림의 모든 세트를 진행할 연습 시간이 부족합니다. 단판 또는 더 짧은 형식을 선택하세요.':blocked.reason;nav();return}const seed=freshInternalSeed('scrim'),series=simulateSeries(DB,SEL.blue,SEL.red,SEL.bo,seed,{fearless:true,firstChoice:'coin',replay:true,practice:true,detailGame:SEL.bo===1?1:null});recordScrimPractice(DB,series.rec,series.lines);saveDB();if(SEL.bo===1){LASTSER=null;LAST=series.detail;$('#result').innerHTML=renderResult(LAST);bindResult()}
    else{LAST=null;LASTSER=series.rec;$('#result').innerHTML=renderSeries(LASTSER,true);bindSeries($('#result'),LASTSER)}};
  if(LASTSER)bindSeries($('#result'),LASTSER);else if(LAST)bindResult();
}
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
  <section><p class="hint">경기 판정은 집계 모델입니다. 공개 경기 사건과 자기 팀의 관측 근거를 구분하며, 내부 계산값을 상대의 관측된 능력으로 표시하지 않습니다.</p></section>`;
}
function safeDraftTeam(r,i){return r.sides[i].team.id}
function renderDraft(r){
  const d=r.draft;
  return `<section><h3>밴픽</h3><div class="draft">${[0,1].map(i=>`<div class="dside ${i?'red':'blue'}">
    <div class="bans">${d.bans[i].map(c=>`<span class="ban">${esc(championLabel(DB,c))}</span>`).join('')}</div>
    ${ROLES.map(role=>{const ps=r.sides[i].ps.find(p=>p.role===role);return `<div class="pick"><span class="role">${ROLE_KO[role]}</span><b>${esc(championDisplayName(ps.champ))}</b><span class="pn">${esc(ps.p.name)} ${!DB.world?.fired&&managerControlsSquad(DB,safeDraftTeam(r,i))?` · 현재 재생 숙련 ${ps.prof.mastery}`:''}</span></div>`}).join('')}
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
  return `<div class="scroll"><table class="pt ${i?'red':'blue'}"><thead><tr><th>${esc(s.team.short)}</th><th>챔피언</th><th>K/D/A</th><th>CS</th><th>골드</th><th>레벨</th><th>피해량</th><th>아이템</th><th>퀘스트</th></tr></thead><tbody>
  ${s.ps.map(p=>`<tr><td><span class="role">${ROLE_KO[p.role]}</span> ${esc(p.p.name)}</td><td>${esc(championDisplayName(p.champ))}</td><td class="num">${p.k}/${p.d}/${p.a}</td><td class="num">${Math.round(p.cs)}</td><td class="num">${(p.goldEarned/1000).toFixed(1)}k</td><td class="num">${p.lvl}</td><td class="num">${(p.dmg/1000).toFixed(1)}k</td><td class="items">${matchQuestItems(p).map(id=>esc(DB.patch.itemDefs?.[id]?.name||id)).join(', ')}</td><td>${p.quest?(p.quest.completed?`완료 · ${p.quest.completedAt}분`:`${Math.floor(p.quest.progress)} / ${p.quest.rules.threshold}`):'—'}</td></tr>`).join('')}
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

const tname=id=>DB.teams[id]?DB.teams[id].name:id, tshort=id=>DB.teams[id]?DB.teams[id].short:id;
const pnm=id=>DB.players[id]?DB.players[id].name:id;
function renderSeries(rec,big){
  if(rec.practiceModel&&(DB.world?.fired||!rec.games?.length||rec.games.some(g=>![g.blue,g.red].some(id=>managerControlsSquad(DB,id)))))return '<section><p>비공개 스크림 조회 권한이 없습니다.</p></section>';
  if(isDoubleDisqualification(rec))return `<section><h3>우승자 없음 · 결승 양 팀 실격</h3><p>${esc(recordedSeriesLabel(DB,rec))}</p><p>경기를 진행하지 않아 세트 점수와 선수 출전 기록이 없습니다.</p></section>`;
  const aw=rec.winner===rec.a,identity=recordedSeriesIdentity(DB,rec);
  return `<section class="board ser">
    <div class="side blue ${aw?'won':''}"><div class="tname">${esc(recordedTeamLabel(identity,rec.a))}</div><div class="res">${aw?'승리':'패배'}</div></div>
    <div class="score"><span>${rec.score[0]}</span><i>:</i><span>${rec.score[1]}</span><div class="dur">Bo${rec.bestOf}${rec.fearless?' · 하드 피어리스':''}${rec.patch?' · 패치 '+esc(rec.patch):''}</div></div>
    <div class="side red ${!aw?'won':''}"><div class="tname">${esc(recordedTeamLabel(identity,rec.b))}</div><div class="res">${!aw?'승리':'패배'}</div></div>
  </section>
  <section><h3>세트별 결과</h3><ol class="games">${rec.games.map((g,i)=>{const identity=recordedSeriesIdentity(DB,rec,g);return `<li><button class="game" data-g="${i}">
    <span class="gn">${g.n}세트</span>
    <span class="gside"><i class="dot blue"></i>${esc(recordedTeamLabel(identity,g.blue,true))} <b>${g.kills[0]}</b> : <b>${g.kills[1]}</b> ${esc(recordedTeamLabel(identity,g.red,true))}<i class="dot red"></i></span>
    <span class="gw">${esc(recordedTeamLabel(identity,g.winner,true))} 승 · ${g.dur}</span>
    ${g.picks?`<span class="gp">블루 ${g.picks[0].map(c=>esc(identity.champions[c]||c)).join(', ')}<br>레드 ${g.picks[1].map(c=>esc(identity.champions[c]||c)).join(', ')}</span>`:''}
    <span class="gm">${g.sideBy?`${esc(recordedTeamLabel(identity,g.sideBy,true))} 선택권: ${!DB.world?.fired&&managerControlsSquad(DB,g.sideBy)?esc(g.sideWhy||''):''} · 선픽 ${esc(recordedTeamLabel(identity,g.firstPick||g.blue,true))} · `:''}POG ${esc(recordedPlayerLabel(identity,g.mvp))}</span>
  </button>${renderRecordedDraftReview(DB,rec,g)}</li>`}).join('')}</ol><p class="hint">세트를 누르면 저장된 당시 경기 기록이 열립니다. 당시 명칭이 없으면 식별자를 표시하며 현재 상태로 재계산하지 않습니다.</p></section>
  <div class="gamedetail"></div>`;
}
function fmtMod(v){v=v||0;return (v>=0?'+':'')+(v*100).toFixed(1)+'%'}
function bindSeries(root,rec){
  bindRecordedDraftReview(root,rec);
  root.querySelectorAll('.game').forEach(b=>b.onclick=()=>{
    root.querySelectorAll('.game').forEach(x=>x.classList.toggle('sel',x===b));
    const d=root.querySelector('.gamedetail');d.innerHTML=renderPublicMatchReview(DB,rec,rec.games[+b.dataset.g]);uiEnhanceScrollRegions(d);d.scrollIntoView({behavior:'smooth',block:'start'});
  });
}
