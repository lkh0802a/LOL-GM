// Current owned conditions, not deadlines or automatic manager decisions.
function clubActionsModel(db=DB){
  const ctx=clubBriefContext(db);if(!ctx)return null;
  const read=JSON.parse(JSON.stringify(db)),owned=clubBriefContext(read),pending=!!read.world.pendingOfficial?.queue?.length;
  const rows=[],manual=owned.w.manage==='manual';
  for(const tid of owned.teams){
    const entry=clubEntryModel(read,tid),medical=clubMedicalModel(read,tid);if(!entry)continue;
    const reasons=[...(entry.registration&&!entry.registration.ok?entry.registration.errors:[]),
      ...(entry.lineup&&!entry.lineup.ok?entry.lineup.errors:[])];
    rows.push({kind:'entry',id:tid,title:entry.team.name+' · 공식 명단·선발',reasons,
      detail:entry.checked.ok?'현재 경기뷰의 선발 검사 통과 · 저장된 수동 선발과 별개입니다':entry.checked.errors.join(' · '),
      available:entry.available,disabled:!manual||pending||!entry.enabled});
    if(medical){
      const out=medical.rows.filter(p=>p.out);
      rows.push({kind:'medical',id:tid,title:entry.team.name+' · 의료·회복',reasons:out.map(p=>p.name+' · '+p.summary),
        detail:out.length?'의료상 출전 불가 · 복귀일은 확정되지 않았습니다':'의료상 출전 불가 없음 · 등록·선발은 별도',
        disabled:pending});
    }
  }
  if(!owned.t.parent)rows.push({kind:'contract',id:owned.t.id,title:'선수 계약·현재 창구',reasons:[],
    detail:owned.w.phase==='offseason'&&owned.w.contractWindow?
      (owned.w.contractWindow.stage==='exclusive'?'원소속 독점 협상 중':'FA 시장 단계'):'개별 계약의 재계약·옵션 조건은 상세에서 현재 명령으로 검사합니다',
    disabled:pending});
  for(const n of clubBriefNegotiations(read,owned))rows.push({kind:'neg',id:n.id,title:read.players[n.pid].name+' · 진행 중 협상',
    reasons:[],detail:n.stage==='club'?'구단 이적료 협상 · 합의 전':'선수 개인조건 협상 · 합의 전',disabled:!manual||pending});
  const nx=clubBriefFixture(read,owned);
  if(nx)rows.unshift({kind:'schedule',id:nx.s.key,title:'다음 공식 일정',reasons:[],detail:read.competitions[nx.s.comp].name+' · '+nx.d.date+' UTC · '+fixtureTimeInfo(nx.m),disabled:pending});
  return {date:read.worldDate,manual,pending,rows};
}
function clubActionsStamp(db){
  const c=clubBriefContext(db);if(!c)return null;
  return JSON.stringify({date:db.worldDate,year:db.year,phase:c.w.phase,manage:c.w.manage,pending:c.w.pendingOfficial,
    window:c.w.contractWindow,fixture:clubBriefFixture(db)?.m,teams:c.teams.map(id=>db.teams[id]),
    players:c.teams.flatMap(id=>(db.teams[id].roster||[]).map(pid=>db.players[pid])),negotiations:c.w.negotiations});
}
function renderClubActions(){
  const m=clubActionsModel();if(!m)return '';
  const first=m.rows.find(r=>r.reasons.length)||m.rows[0],rest=m.rows.filter(r=>r!==first);
  const card=r=>`<li><b>${esc(r.title)}</b><p>${esc(r.detail)}${r.available!==undefined?' · 현재 가용 '+r.available+'명':''}</p>
    ${r.reasons.length?`<p class="warn">현재 검사 근거: ${r.reasons.map(esc).join(' · ')}</p>`:''}
    ${r.kind==='entry'&&r.disabled&&!m.pending?`<p>${m.manual?'구형 저장에서는 별도 공식 등록 규칙을 사용하지 않습니다':'AI 위임 중에는 수동 명단을 변경할 수 없습니다'}</p>`:''}
    <button data-club-action="${esc(r.kind)}" data-club-target="${esc(r.id)}"${r.disabled?' disabled':''}>${({entry:'명단·선발 확인',medical:'회복 계획 보기',contract:'계약 조건 보기',neg:'협상 이어가기',schedule:'일정 보기'})[r.kind]}</button></li>`;
  return `<section id="club-current-actions" class="cfgcard"><h4 tabindex="-1">지금 확인할 일</h4><p class="hint">기준일 ${esc(m.date||'날짜 미정')}</p>
    ${m.pending?'<p role="status">공식 경기 수동 선택 대기 · 선택·밴픽을 마치기 전까지 날짜 진행 잠김</p>':''}
    ${!m.manual?'<p>AI 위임 중 · 수동 명단·협상 잠김</p>':''}
    ${first?'<ul>'+card(first)+'</ul>':'<p>현재 확인 가능한 구단 조건이 없습니다.</p>'}
    ${rest.length?'<details><summary>다른 현재 조건 확인</summary><ul>'+rest.map(card).join('')+'</ul></details>':''}
    </section>`;
}
function bindClubActions(){
  const buttons=[...document.querySelectorAll('[data-club-action]')];if(!buttons.length)return;
  const c=clubBriefContext();if(!c)return;
  const db=DB,w=c.w,slot=SLOT,render=UI_RENDER_ID,manager=db.manager,stamp=clubActionsStamp(db);
  buttons.forEach(b=>b.onclick=()=>{
    if(!clubBriefCurrent(db,w,slot,render,c.t.id)||db.manager!==manager||UI_OVERLAY||clubActionsStamp(db)!==stamp)return;
    const row=clubActionsModel(db)?.rows.find(r=>r.kind===b.dataset.clubAction&&r.id===b.dataset.clubTarget&&!r.disabled);
    if(!row)return;
    const attr={entry:'briefEntry',medical:'briefMedical',contract:'briefContract',neg:'briefNeg',schedule:'briefSchedule'}[row.kind];
    const name=attr.replace(/[A-Z]/g,x=>'-'+x.toLowerCase());
    const target=[...document.querySelectorAll('[data-'+name+']')].find(x=>x.dataset[attr]===row.id);
    if(target&&!target.disabled){clubHomeRevealTarget(target);target.click()}
  });
}
