function officialEditGuard(ok,root,onReject){
  const sq=()=>typeof SQUAD==='undefined'?null:SQUAD;
  const db=DB,w=db.world,slot=SLOT,rid=UI_RENDER_ID,oid=managedTeamId(db),view=VIEW,overlay=UI_OVERLAY,mgr=db.manager,squad=sq(),date=db.worldDate,year=db.year,ph=w.phase,team=db.teams[oid];
  const stamp=()=>JSON.stringify([w.year,w.manage,w.fired,w.registrationVersion,w.pendingOfficial,
    Object.values(db.teams).map(t=>[t.id,t.roster]),officialRegistrationSnapshot(db,{teamId:oid,players:Object.keys(db.players)}),officialStaffEditStamp(db,oid)]);
  const start=stamp(),identity=()=>DB===db&&DB.world===w&&db.manager===mgr&&db.teams[oid]===team&&sq()===squad&&db.worldDate===date&&db.year===year&&w.phase===ph&&SLOT===slot&&VIEW===view&&UI_RENDER_ID===rid&&UI_OVERLAY===overlay&&!SLOT_SWITCHING&&!w.fired&&w.manage==='manual'&&managedTeamId(db)===oid;
  return ()=>{if(ok()&&identity()&&stamp()===start)return true;
    if(identity()){MSG='상태 변경: 초안을 취소하고 다시 확인하세요';const n=root.querySelector('[data-official-status]');if(n)n.textContent=MSG;onReject?.('stale')}
    return false;
  };
}
function clubOfficialEditState(db,tid){
  const read=JSON.parse(JSON.stringify(db)),t=read.teams[tid];
  if(!t||read.world?.fired||read.world?.manage!=='manual'||!managerControlsSquad(read,t))return null;
  const teams=managedTeam(read)?.parent?[t]:organizationTeams(read,parentTeamOf(read,t)),values={},fields={},players={},staff={};
  const ids=Array.from(new Set(teams.flatMap(x=>[...x.roster,...(x.registration?.players||[])])));
  for(const id of ids){const p=read.players[id];if(!p)continue;players[id]=p.name;
    const key='player:'+id;values[key]=teams.find(x=>x.registration?.players.includes(id))?.id||'';
    fields[key]={kind:'player',id,label:p.name+' · 공식 등록'};
  }
  for(const role of ROLES){const key='role:'+role;values[key]=t.registration?.depthChart?.[role]||'';fields[key]={kind:'role',role,label:ROLE_KO[role]+' · 공식 선발'}}
  for(const s of Object.values(read.world.seasons||{})){
    if(!read.competitions[s.comp]?.teams.includes(tid)||!competitionStaffPolicy(read,s))continue;
    const selected=competitionStaffEntry(read,s,tid),members=teamStaffMembers(t),records=s.staffEntryRecords?.[tid]?.staff||[];
    for(const id of new Set([...members.map(x=>x.id),...selected])){
      const name=members.find(x=>x.id===id)?.name||records.find(x=>x.id===id)?.name||'직원 기록 없음',key='staff:'+s.id+':'+id;
      staff[id]=name;values[key]=selected.includes(id);fields[key]={kind:'staff',seasonId:s.id,id,label:read.competitions[s.comp].name+' · '+name};
    }
  }
  return {date:read.worldDate,values,fields,players,staff,teams:Object.fromEntries(teams.map(x=>[x.id,x.short])),read};
}
function clubOfficialEditReview(db,tid,start,draft){
  const current=clubOfficialEditState(db,tid);if(!current)return null;
  const fields={...start.fields,...current.fields},name=id=>current.players[id]||start.players[id]||'대상 없음';
  const cell=(key,value)=>{const f=fields[key];if(value===undefined)return '표시 입력 없음';
    if(f.kind==='player')return value?current.teams[value]||start.teams[value]||'대상 없음':'미등록';
    if(f.kind==='role')return value?name(value):'미지정';return value?'등록':'미등록';};
  const rows=Object.keys(fields).map(key=>({key,label:fields[key].label,start:cell(key,start.values[key]),current:cell(key,current.values[key]),draft:cell(key,draft[key]),changed:JSON.stringify(current.values[key])!==JSON.stringify(draft[key])}));
  const errors=[],read=current.read,rosterFields=Object.entries(fields).filter(([k,f])=>f.kind==='player'&&k in draft);
  const check=(label,command)=>{const p=previewWorldAction(read,command);if(!p.ok)errors.push(label+': '+p.errors.join(' · '))};
  if(rosterFields.length){const registrations=Object.fromEntries(Object.keys(current.teams).map(id=>[id,[]]));for(const [key,f] of rosterFields)if(Object.hasOwn(registrations,draft[key]))registrations[draft[key]].push(f.id);check('공식 등록',{type:'roster.register',actor:'manager',teamId:tid,registrations})}
  if(ROLES.every(r=>'role:'+r in draft))check('공식 선발',{type:'roster.official-lineup',actor:'manager',teamId:tid,lineup:Object.fromEntries(ROLES.map(r=>[r,draft['role:'+r]]))});
  const seasons=new Set(Object.entries(fields).filter(([key,f])=>f.kind==='staff'&&key in draft).map(([,f])=>f.seasonId));
  for(const seasonId of seasons)check('현장 스태프',{type:'competition.staff-register',actor:'manager',seasonId,teamId:tid,staffIds:Object.entries(fields).filter(([key,f])=>f.kind==='staff'&&f.seasonId===seasonId&&draft[key]).map(([,f])=>f.id)});
  return {rows,errors,date:start.date,currentDate:current.date};
}
function clubOfficialEditStart(db,tid,root,cached){
  const start=clubOfficialEditState(db,tid);start.values=clubEntryDraft(root);delete start.read;
  if(cached){clubEntryDraft(root,cached.values);return cached.start||start}return start;
}
function bindClubOfficialComparison(root,tid,canRead,start){
  const update=()=>{if(!canRead())return;const target=root.querySelector('[data-official-comparison]');if(!target)return;
    const m=clubOfficialEditReview(DB,tid,start,clubEntryDraft(root));if(!m)return;
    target.innerHTML=`<h3>공식 편집 비교표</h3><p class="hint">편집 시작 ${esc(m.date)} · 현재 ${esc(m.currentDate)} · 시작 입력은 당시 화면의 선택값입니다. 현재 적용은 저장된 공식 값이며 초안은 제출 전까지 적용되지 않습니다.</p>${m.errors.map(x=>`<p role="status">${esc(x)}</p>`).join('')}<div class="scroll" tabindex="0" aria-label="공식 등록과 선발 초안 비교"><table><thead><tr>${['항목','편집 시작 입력','현재 적용','미적용 입력'].map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${m.rows.map(x=>`<tr><th scope="row">${esc(x.label)}</th><td>${esc(x.start)}</td><td>${esc(x.current)}</td><td>${esc(x.draft)}${x.changed?' · 미적용':''}</td></tr>`).join('')}</tbody></table></div>`;
  };
  for(const el of [...root.querySelectorAll('[data-official-destination]'),...root.querySelectorAll('[data-official-role]'),...root.querySelectorAll('[data-competition-staff]')]){el.oninput=update;el.onchange=update}
  update();return update;
}

function clubOfficialEditRejected(root,readable,review){if(!readable())return;const n=root.querySelector('[data-official-status]');if(n)n.textContent=MSG;review()}

function officialStaffEditStamp(db,tid){
 const t=db.teams[tid],teams=managedTeam(db)?.parent?[t]:organizationTeams(db,parentTeamOf(db,t));
 return JSON.stringify(Object.values(db.world.seasons||{}).flatMap(s=>teams.filter(x=>db.competitions[s.comp]?.teams.includes(x.id)).map(x=>staffRegistrationSnapshot(db,{actor:'manager',seasonId:s.id,teamId:x.id}))));
}
