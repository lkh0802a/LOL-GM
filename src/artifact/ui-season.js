// ===== LOL GM: 시즌 / 세계 / 진행 UI =====
// 시즌 현황, 세계/사무국 표시, 새 게임 설정과 시즌 진행 바인딩.
// 시뮬레이션 규칙은 competition.js / world.js에 유지한다.

function spark(vals){if(vals.length<2)return '';const W=90,H=24,mx=100,x=i=>i/(vals.length-1)*W,y=v=>H-v/mx*H;return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${vals.map((v,i)=>x(i).toFixed(1)+','+y(v).toFixed(1)).join(' ')}"/></svg>`}
function officeCard(r){const M=r.metrics||[],m=M.slice(-1)[0];
  return `<div class="cfgcard"><div class="cfghead"><b>${esc(r.leagueName)}</b><span class="hint">${esc((OFFICE_STYLES[r.office]||{}).label||'')}</span></div>
  ${m?`<div class="arow"><span>흥행 ${m.hype} (${hypeLabel(m.hype)}) · 균형 ${m.balance.toFixed(2)} · 스타 ${m.stars}명</span>${spark(M.map(x=>x.hype))}</div>`:'<p class="hint">첫 시즌이 끝나면 지표가 집계됩니다.</p>'}
  ${(r.decisions||[]).slice().reverse().slice(0,4).map(d=>`<div class="dec"><time>${d.year}</time> <b>${esc(d.what)}</b><br><small>${esc(d.why)}</small></div>`).join('')||'<p class="hint">아직 결정한 안건이 없습니다.</p>'}</div>`}
function globalCard(){const g=DB.global||{decisions:[],power:{}};const P=Object.values(DB.regions).map(R=>[R,g.power[R.id]]).filter(x=>x[1]!==undefined).sort((a,b)=>b[1]-a[1]);
  return `<div class="cfgcard"><div class="cfghead"><b>국제대회 · 진출권 · 패치 주기 · 지역 승인</b><span class="hint">패치 주기 ${DB.patches.cadence||14}일</span></div>
  ${P.length?`<div class="arow"><span>국제 경쟁력 지수</span><span class="hint">${P.map(([R,v])=>`${esc(R.name)} ${v}`).join(' · ')}</span></div>`:''}
  ${g.decisions.slice().reverse().slice(0,6).map(d=>`<div class="dec"><time>${d.year}</time> <b>${esc(d.what)}</b><br><small>${esc(d.why)}</small></div>`).join('')||'<p class="hint">첫 시즌이 끝나면 국제대회 성적을 보고 결정합니다.</p>'}</div>`}
function fmtRegion(r){const fin=r.spendingRule==='sfr_top5'?` · 엔진 SFR 상위5 ${r.salaryCap}억`:' · 균형지출 규제 없음',p=r.policyBasis,pol=p?.source==='engine'?` · 정책엔진(팬 ${p.fanAvg??'-'}·자금 ${p.ownerAvg??'-'}·인재 ${p.localDepth??'-'})`:'';return `${LEAGUE_FORMATS[r.format||'rr_po']} · ${SEL_KO.splits[r.splits]} · ${SPLIT_STANDINGS_MODES[r.standingsMode||'independent']||SPLIT_STANDINGS_MODES.independent} · 정규 Bo${Math.max(3,r.regularBo)} · PO ${r.playoffTake}팀 Bo${r.playoffBo} · ${SEL_KO.system[r.system]}${r.div2?' · 하부 리그':''}${fin}${pol}`}
function worldTable(){
  return `<div class="scroll"><table><thead><tr><th>지역</th><th>리그</th><th>구분</th><th>팀</th><th>수준</th><th>흥행</th><th>균형</th><th>사무국</th><th>진출권</th><th>방식</th></tr></thead><tbody>
  ${Object.values(DB.regions).map(r=>{const ts=activeTeams(DB,r.id,1),m=(r.metrics||[]).slice(-1)[0];return `<tr><td><b>${esc(r.name)}</b></td><td>${esc(r.leagueName)}</td><td>${r.tier==='major'?'메이저':'신흥'}${r.parent&&DB.regions[r.parent]?`<small class="hint"> (${esc(DB.regions[r.parent].leagueName)} 권역)</small>`:''}</td><td class="num">${ts.length}</td><td class="num">${Math.round(avg(ts.map(t=>teamStrength(DB,t.id))))}</td><td class="num">${m?m.hype+' <small class="hint">'+hypeLabel(m.hype)+'</small>':'—'}</td><td class="num">${m?m.balance.toFixed(2):'—'}</td><td>${esc((OFFICE_STYLES[r.office]||{}).label||'')}</td><td class="num">${r.slots}</td><td class="fmt">${fmtRegion(r)}</td></tr>`}).join('')}
  </tbody></table></div><p class="hint">국제대회: ${DB.worldConfig.internationals.map(i=>`${esc(i.name)} (${ISEL_KO.timing[i.timing]}, ${ISEL_KO.entry[i.entry]}, ${ISEL_KO.format[i.format]})`).join(' · ')||'없음'}</p>`;
}
function seasonTab(){
  const s=curS(); if(!s)return '<p class="empty">진행 중인 대회가 없습니다.</p>';
  const comp=DB.competitions[s.comp], me=managedTeamId(DB);
  if(SSET.tab==='table'){
    const region=comp.region&&DB.regions[comp.region],mode=s.standingsMode||region?.standingsMode||'independent';
    const doneSplits=region?Object.values(DB.world.seasons).filter(x=>
      x.done&&x.year===DB.world.year&&x.region===region.id&&
      (x.div||1)===(comp.div||1)&&x.split).length:0;
    const pointRows=region&&mode==='points'&&doneSplits?
      championshipStandings(DB,region,comp.div||1):[];
    const annualPoints=region&&mode==='points'?
      `<section><h3>${esc(region.leagueName)} · 연간 챔피언십 포인트</h3>
      <p class="hint">완료된 ${doneSplits}개 스플릿만 합산 · 우승 100 / 준우승 70 / 4강 45 / 플레이오프 진출 20점. 동점은 최근 완료 스플릿 순위로 정합니다. 현재 스플릿 승패/플레이오프는 별도 진행합니다.</p>
      ${pointRows.length?`<div class="scroll"><table class="stand"><thead><tr><th>순위</th><th>팀</th><th>총점</th><th>스플릿별</th></tr></thead><tbody>
      ${pointRows.map((r,i)=>`<tr class="${r.tid===me?'mine':''}"><td class="num">${i+1}</td><td><b>${esc(tname(r.tid))}</b></td><td class="num">${r.points}</td><td>${Object.entries(r.bySplit).map(([sp,pt])=>`${SPLIT_NAME[sp]||sp} ${pt}점`).join(' · ')}</td></tr>`).join('')}
      </tbody></table></div>`:'<p class="empty">첫 스플릿 종료 후 누적 포인트가 표시됩니다.</p>'}</section>`:'';
    const sw=comp.stages.filter(x=>x.type==='swiss'&&s.stageData[x.id]).map(cfg=>{const sd=s.stageData[cfg.id];const rows=standings(DB,s,cfg.id);
      return `<section><h3>${esc(sName(s))} · ${esc(cfg.name)} <small class="hint">${sd.W}승 진출 · ${sd.L}패 탈락</small></h3><div class="scroll"><table class="stand"><thead><tr><th>팀</th><th>전적</th><th>상태</th></tr></thead><tbody>
      ${rows.map(r=>`<tr class="${r.tid===me?'mine':''}"><td><b>${esc(tname(r.tid))}</b></td><td class="num">${r.w}-${r.l}</td><td>${sd.advanced.includes(r.tid)?'진출':sd.out.includes(r.tid)?'탈락':'진행 중'}</td></tr>`).join('')}</tbody></table></div></section>`}).join('');
    const grp=comp.stages.filter(x=>x.type==='round_robin'&&x.groups>1&&s.stageData[x.id]).map(cfg=>groupStandings(DB,s,cfg.id).map((rows,gi)=>`<section><h3>${esc(sName(s))} · ${esc(cfg.name)} ${String.fromCharCode(65+gi)}조</h3><div class="scroll"><table class="stand"><thead><tr><th>순위</th><th>팀</th><th>승</th><th>패</th><th>득실</th></tr></thead><tbody>${rows.map((r,i)=>`<tr class="${r.tid===me?'mine':''}"><td class="num">${i+1}</td><td><b>${esc(tname(r.tid))}</b></td><td class="num">${r.w}</td><td class="num">${r.l}</td><td class="num">${r.gw-r.gl}</td></tr>`).join('')}</tbody></table></div></section>`).join('')).join('');
    if(sw||grp)return annualPoints+sw+grp;
    return annualPoints+comp.stages.filter(x=>x.type==='round_robin').map(cfg=>{if(!s.stageData[cfg.id])return '';const rows=standings(DB,s,cfg.id), take=(comp.stages.find(x=>x.from===cfg.id)||{}).take;
      return `<section><h3>${esc(sName(s))} · ${esc(cfg.name)}${mode==='cumulative'&&s.split?' · 연간 누적 전적':''}</h3><div class="scroll"><table class="stand"><thead><tr><th>순위</th><th>팀</th>${comp.international?'<th>지역</th>':''}<th>승</th><th>패</th><th>세트</th><th>득실</th><th>최근 5</th></tr></thead><tbody>
      ${rows.map((r,i)=>`<tr class="${r.tid===me?'mine':''} ${take&&i===take-1?'cut':''} ${(!comp.international&&comp.div===1&&mode!=='points'&&s===finalSeason(DB.world,DB.regions[comp.region]||{},1)&&['relegation','mixed'].includes((DB.regions[comp.region]||{}).system)&&i>=rows.length-((DB.regions[comp.region]||{}).relegate||1)&&!(DB.teams[r.tid].franchised&&DB.regions[comp.region].system==='mixed'))?'danger':''}"><td class="num">${i+1}</td><td><b>${esc(tname(r.tid))}</b>${DB.teams[r.tid].franchised&&(DB.regions[comp.region]||{}).system==='mixed'?' <small class="hint">보호</small>':''}</td>${comp.international?`<td>${esc((DB.regions[DB.teams[r.tid].region]||{name:''}).name)}</td>`:''}<td class="num">${r.w}</td><td class="num">${r.l}</td><td class="num">${r.gw}-${r.gl}</td><td class="num">${r.gw-r.gl>0?'+':''}${r.gw-r.gl}</td><td class="form">${r.form.slice(-5).map(f=>`<i class="${f}">${f==='W'?'승':'패'}</i>`).join('')}</td></tr>`).join('')}
      </tbody></table></div>${take?`<p class="hint">선 위 ${take}팀이 다음 스테이지에 진출합니다.</p>`:''}</section>`}).join('')||'<p class="empty">이 대회는 순위표 없이 토너먼트로만 진행됩니다.</p>';
  }
  if(SSET.tab==='sched'){
    return `<section><ol class="sched">${s.days.map((d,i)=>`<li class="${i===s.cur?'today':''}"><div class="sd"><time>${esc(d.date)} UTC</time><span>${esc(d.label)} · 현지 ${esc([...new Set(d.matches.map(m=>m.localDate||d.date))].join(' / '))} · ${esc(d.matches[0]?.timeZone||'UTC')}</span></div>
      ${d.matches.map(m=>`<button class="sm ${m.a===me||m.b===me?'mine':''}" data-m="${m.id}"${m.res?'':' disabled'}>
        ${m.time?`<small>${esc(fixtureTimeInfo(m))}${m.broadcastSlot?' · '+m.broadcastSlot+'경기':''}</small>`:''}
        <span class="${m.res&&m.res.winner===m.a?'w':''}">${esc(tshort(m.a))}</span><b>${m.res?m.res.score.join(' : '):'vs'}</b><span class="${m.res&&m.res.winner===m.b?'w':''}">${esc(tshort(m.b))}</span></button>`).join('')}</li>`).join('')}</ol></section>`;
  }
  if(SSET.tab==='bracket'){
    const el=comp.stages.filter(x=>x.type==='single_elim').map(cfg=>{const sd=s.stageData[cfg.id]; if(!sd) return `<p class="empty">${esc(cfg.name)} 대진은 앞 스테이지가 끝나면 정해집니다.</p>`;
      const found=pr=>{for(const d of s.days)for(const m of d.matches)if(d.stage===cfg.id&&m.a===pr[0]&&m.b===pr[1])return m;return null};
      return `<section><h3>${esc(sName(s))} · ${esc(cfg.name)}</h3><div class="scroll"><div class="bracket">${sd.rounds.map(r=>`<div class="bcol"><h4>${esc(r.name)}</h4>
        ${r.byes.map(t=>`<div class="bm bye"><span>${esc(tshort(t))}</span><small>부전승</small></div>`).join('')}
        ${r.pairs.map(pr=>{const m=found(pr);return `<button class="bm" ${m&&m.res?`data-m="${m.id}"`:'disabled'}><span class="${m&&m.res&&m.res.winner===pr[0]?'w':''}">${esc(tshort(pr[0]))} <b>${m&&m.res?m.res.score[0]:''}</b></span><span class="${m&&m.res&&m.res.winner===pr[1]?'w':''}">${esc(tshort(pr[1]))} <b>${m&&m.res?m.res.score[1]:''}</b></span></button>`}).join('')}
      </div>`).join('')}${s.done&&s.champion?`<div class="bcol"><h4>우승</h4><div class="bm champ1"><span class="w">${esc(tname(s.champion))}</span></div></div>`:''}</div></div></section>`}).join('');
    return el||'<p class="empty">이 대회에는 토너먼트 스테이지가 없습니다. 정규 시즌 1위가 우승합니다.</p>';
  }
  if(SSET.tab==='stats'){
    const rows=Object.entries(s.pstats).map(([pid,p])=>({pid,...p,kda:(p.k+p.a)/Math.max(1,p.d)}));
    if(!rows.length)return '<p class="empty">경기를 진행하면 선수 기록이 쌓입니다.</p>';
    const minG=comp.international?2:3;
    const top=rows.filter(r=>r.g>=minG).sort((a,b)=>b.kda-a.kda).slice(0,12);
    const champs={};for(const r of rows)for(const [c,[n,w]] of Object.entries(r.champs)){champs[c]=champs[c]||[0,0];champs[c][0]+=n;champs[c][1]+=w}
    const ctop=Object.entries(champs).sort((a,b)=>b[1][0]-a[1][0]).slice(0,12);
    return `<section><h3>KDA 순위 (${minG}경기 이상)</h3><div class="scroll"><table><thead><tr><th>#</th><th>선수</th><th>팀</th><th>경기</th><th>KDA</th><th>평균 K/D/A</th><th>분당 CS</th><th>POG</th></tr></thead><tbody>
      ${top.map((r,i)=>{const p=DB.players[r.pid];return `<tr class="${p&&p.team===me?'mine':''}"><td class="num">${i+1}</td><td><span class="role">${p?ROLE_KO[p.role]:''}</span> <b>${esc(pnm(r.pid))}</b></td><td>${esc(p?tshort(p.team):'')}</td><td class="num">${r.g}</td><td class="num"><b>${r.kda.toFixed(2)}</b></td><td class="num">${(r.k/r.g).toFixed(1)}/${(r.d/r.g).toFixed(1)}/${(r.a/r.g).toFixed(1)}</td><td class="num">${(r.cs/r.min).toFixed(1)}</td><td class="num">${r.mvp}</td></tr>`}).join('')}
    </tbody></table></div></section>
    <section><h3>챔피언 픽 순위</h3><div class="scroll"><table><thead><tr><th>챔피언</th><th>픽</th><th>승률</th></tr></thead><tbody>
      ${ctop.map(([c,[n,w]])=>`<tr><td><b>${esc(c)}</b></td><td class="num">${n}</td><td class="num">${(w/n*100).toFixed(0)}%</td></tr>`).join('')}
    </tbody></table></div></section>`;
  }
  return `${financePanel(DB.teams[me])}<section><h3>세계 현황</h3>${worldTable()}${DB.worldHype?`<p class="hint">세계 흥행 합계 ${DB.worldHype}. 지역 평균 흥행이 높을수록 새 지역 합류와 국제대회 신설 가능성이 올라갑니다.</p>`:''}</section>
  <section><h3>구단 재정 · ${esc(DB.regions[DB.teams[me].region].leagueName)}</h3>${financeTable(DB.teams[me].region)}</section>
  <section><h3>국제 e스포츠 사무국</h3>${globalCard()}</section>
  <section><h3>리그 사무국</h3><div class="cfgs">${Object.values(DB.regions).map(officeCard).join('')}</div></section>
  ${DB.news.length?`<section><h3>뉴스</h3><ol class="news">${DB.news.slice(0,20).map(n=>`<li><time>${n.year}</time><span>${esc(n.text)}</span></li>`).join('')}</ol></section>`:''}
  <section><h3>역대 기록</h3>${DB.history.length?histTable():'<p class="empty">시즌을 끝내면 우승 기록이 여기에 쌓입니다.</p>'}</section>
  ${(DB.awards||[]).length?`<section><h3>최근 시상</h3><div class="scroll"><table><thead><tr><th>시즌</th><th>대회</th><th>부문</th><th>선수</th></tr></thead><tbody>${DB.awards.slice(-24).reverse().map(a=>`<tr><td class="num">${a.year}</td><td>${esc(a.comp)}</td><td>${esc(a.type)}</td><td><b>${esc(pnm(a.pid))}</b></td></tr>`).join('')}</tbody></table></div></section>`:''}
  <section><h3>명예의 전당</h3>${(DB.hof||[]).length?`<div class="scroll"><table><thead><tr><th>선수</th><th>포지션</th><th>은퇴</th><th>우승</th><th>국제</th><th>MVP</th><th>전성기</th></tr></thead><tbody>${DB.hof.slice().reverse().map(h=>`<tr><td><b>${esc(h.name)}</b></td><td>${ROLE_KO[h.role]}</td><td class="num">${h.year}</td><td class="num">${h.titles}</td><td class="num">${h.intl}</td><td class="num">${h.mvps}</td><td class="num">${h.peak}</td></tr>`).join('')}</tbody></table></div>`:'<p class="hint">국제대회 2회 우승, 우승 5회, MVP 3회, 전성기 종합 90 중 하나를 달성하고 은퇴한 선수가 헌액됩니다.</p>'}</section>`;
}
function histTable(){
  const groups={};DB.history.forEach(h=>{const k=h.compName||h.comp;(groups[k]=groups[k]||[]).push(h)});
  const keys=Object.keys(groups).sort((a,b)=>(groups[b][0].intl-groups[a][0].intl));
  const titles={};DB.history.forEach(h=>{const k=h.champion;titles[k]=titles[k]||{n:0,w:0};titles[k].n++;if(h.intl)titles[k].w++});
  return keys.map(k=>{const H=groups[k].slice().reverse();return `<h4>${esc(k)}</h4><div class="scroll"><table><thead><tr><th>시즌</th><th>우승</th><th>준우승</th><th>결승</th><th>MVP</th></tr></thead><tbody>
  ${H.map(h=>`<tr><td class="num">${h.year}</td><td><b>${esc(tname(h.champion))}</b></td><td>${esc(tname(h.runnerUp))}</td><td class="num">${h.final?h.final.join(':'):'—'}</td><td>${h.mvp?esc(pnm(h.mvp)):'—'}</td></tr>`).join('')}
  </tbody></table></div>`}).join('')+`<p class="hint">통산 우승: ${Object.entries(titles).sort((a,b)=>b[1].w-a[1].w||b[1].n-a[1].n).slice(0,12).map(([t,v])=>`${esc(tshort(t))} ${v.n}회${v.w?` (국제 ${v.w})`:''}`).join(', ')}</p>`;
}
function findMatch(id){const s=curS();for(const d of s.days)for(const m of d.matches)if(m.id===id)return m}
function openSeries(m){
  const title=`${tname(m.a)} vs ${tname(m.b)}`;
  const markup=`<div class="ovin"><div class="ovhead"><b>${esc(title)}</b><button class="ghost" id="ovclose">닫기</button></div><div id="ovbody">${renderSeries(m.res)}</div></div>`;
  openUiOverlay({kind:'series',label:title,html:markup,dismissible:true,onDismiss:closeOv,focusSelector:'#ovclose'});
  $('#ovclose').onclick=closeOv;bindSeries($('#ovbody'),m.res);
}
function closeOv(){closeUiOverlay()}
function bindSeasonTab(){document.querySelectorAll('#stab [data-m]').forEach(b=>b.onclick=()=>{const m=findMatch(b.dataset.m);if(m&&m.res)openSeries(m)})}
function bindSetup(){
  const cfg=DB.worldConfig, dirty=()=>{DB.configDirty=true;saveDB();nav()};
  document.querySelectorAll('[data-cfg]').forEach(el=>el.onchange=()=>{
    const [kind,a,b]=el.dataset.cfg.split('.'); let v=el.value; if(el.type==='number'||/^\d+$/.test(v)&&!['name','leagueName','short'].includes(b||a))v=+v;
    if(b==='fearless'||b==='div2')v=el.value==='1';
    if(kind==='r'){cfg.regions[+a][b]=b==='short'?String(v).toUpperCase():v}
    else if(kind==='i'){cfg.internationals[+a][b]=v}
    else cfg[a]=v;
    dirty();
  });
  $('#cfgdef').onclick=()=>{DB.worldConfig=defaultWorldConfig();dirty()};
  $('#regen').onclick=()=>{const errs=validateConfig(cfg);if(errs.length){$('#cfgmsg').className='warn';$('#cfgmsg').textContent=errs.join(' / ');return}
    resetUiForWorld();DB=buildWorld(cfg);const first=managerSelectableTeams(DB)[0];SSET.team=first?first.id:null;SSET.region=first?first.region:null;SSET.division=first?(first.division||1):1;LAST=null;LASTSER=null;MC.res=null;saveDB();nav()};
  bindManagerTeamPicker();
  $('#sstart').onclick=()=>{if(!isManagerSelectableTeam(DB,SSET.team)){const first=managerSelectableTeams(DB)[0];SSET.team=first?first.id:null}if(!SSET.team)return;SSET.view=null;startCareer(DB,SSET.team,freshInternalSeed('world'));saveDB();nav()};
}
function bindSeason(){
  const w=DB.world;
  if(!w)return bindSetup();
  if(w.phase==='pick'){$('#pickgo').onclick=()=>{setManagedTeam(DB,$('#pickteam').value);w.fired=false;const t=DB.teams[managedTeamId(DB)];t.owner.patience=2;w.phase='preseason';SSET.view=null;saveDB();nav()};return}
  if(w.phase==='initial_roster'){bindInitialRosterMarket();return}
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{SSET.view=b.dataset.view;nav()});
  document.querySelectorAll('[data-chap]').forEach(b=>b.onclick=()=>{const i=+b.dataset.chap;SSET.chap=(SSET.chap??w.step)===i?-1:i;const s=Object.values(w.seasons).find(x=>stepOf(DB,x)===i&&(x.region===DB.teams[managedTeamId(DB)].region||DB.competitions[x.comp].international));if(s)SSET.view=s.key;nav()});
  document.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{SSET.tab=b.dataset.st;$('#stab').innerHTML=seasonTab();document.querySelectorAll('[data-st]').forEach(x=>x.setAttribute('aria-pressed',x===b));bindSeasonTab()});
  bindSeasonTab();
  if(w.phase==='offseason'){
    if(!w.contractWindow){
      $('#soff').onclick=()=>{initOffseasonContractWindow(DB);saveDB();nav();window.scrollTo(0,0)};
    }else if(w.contractWindow.stage==='exclusive'){
      $('#scontractday').onclick=()=>{advanceOffseasonContractDay(DB);saveDB();nav()};
      $('#scontractopen').onclick=()=>{advanceOffseasonContractWindow(DB);saveDB();nav();window.scrollTo(0,0)};
    }else{
      $('#soff').onclick=()=>{runOffseason(DB);saveDB();nav();window.scrollTo(0,0)};
    }
    if(w.manage==='manual'&&w.contractWindow)bindContractWindow();
    return;
  }
  if(w.phase==='market'){
    $('#smkt').onclick=()=>{closeMarket(DB);MSG='';saveDB();nav();window.scrollTo(0,0)};
    $('#smanage').onchange=e=>{w.manage=e.target.value;saveDB();nav()};
    if(w.manage==='manual')bindMarket();return;
  }
  if(w.phase==='preseason'){
    if($('#snew'))$('#snew').onclick=()=>{SSET.view=null;const current=managedTeamId(DB);if(DB.teams[current].active===false)setManagedTeam(DB,activeTeams(DB,DB.teams[current].region)[0].id);startWorldSeason(DB,managedTeamId(DB),freshInternalSeed('world'));saveDB();nav()};
    $('#sreset').onclick=()=>{SSET.team=managedTeamId(DB);w.picking=true;w.phase='pick';saveDB();nav()};
    return;
  }
  if(w.pendingOfficial&&w.pendingOfficial.queue?.length){
    document.querySelectorAll('.controls button').forEach(b=>b.disabled=true);
    const db=DB,renderId=UI_RENDER_ID;
    requestAnimationFrame(()=>{
      if(db!==DB||VIEW!=='season'||UI_RENDER_ID!==renderId||UI_OVERLAY||
        !db.world?.pendingOfficial?.queue?.length)return;
      openPendingOfficialDraft(db);
    });
    return;
  }
  const run=(stop)=>{
    document.querySelectorAll('.controls button').forEach(b=>b.disabled=true);
    const db=DB;let n=0;
    const task=beginUiTask('season-days',()=>{if(n)saveDB()});
    const fin=()=>{if(!finishUiTask(task))return;saveDB();nav()};
    const step=()=>{
      if(!isUiTaskCurrent(task))return;
      try{
        for(let i=0;i<2;i++){
          const result=playWorldDay(db);n++;
          if(!result||db.world.phase!=='season'||result.pending||stop(result))return fin();
        }
        const progress=$('#sprog');
        if(progress)progress.textContent=`${n}일 진행 · 현재 ${db.worldDate} · 다음 경기 ${nextDate(db)||'일정 없음'}`;
        setTimeout(step,0);
      }catch(e){
        finishUiTask(task);if(n)saveDB();
        console.error('LOL GM date progression failed',e);
        MSG='날짜 진행 중 오류: '+e.message;nav();
      }
    };
    step();
  };
  const me=managedTeamId(DB), st0=w.step;
  $('#sday').onclick=()=>run(()=>true);
  $('#sfixture').onclick=()=>run(r=>r.played.length>0);
  $('#smine').onclick=()=>run(r=>r.played.some(x=>x.day.matches.some(m=>m.a===me||m.b===me)));
  $('#sstep').onclick=()=>run(()=>DB.world.step!==st0);
  $('#send').onclick=()=>run(()=>false);
}
