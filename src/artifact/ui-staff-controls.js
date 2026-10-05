// Current-context staff commands share scoped inputs across market and club briefing.
function staffUiGuard(tid,allowed=()=>true){
  const db=DB,w=db.world,slot=SLOT,render=UI_RENDER_ID,manager=managedTeamId(db),view=VIEW,dialog=UI_OVERLAY,stamp=clubStaffStamp(db);
  return ()=>allowed()&&DB===db&&db.world===w&&SLOT===slot&&!SLOT_SWITCHING&&UI_RENDER_ID===render&&VIEW===view&&UI_OVERLAY===dialog&&managedTeamId(db)===manager&&tid===manager&&!w.fired&&w.manage==='manual'&&!['pick','initial_roster'].includes(w.phase)&&db.teams[tid]?.active!==false&&clubStaffStamp(db)===stamp;
}
function bindStaffEmploymentControls(act,allowed=()=>true,root=document,tid=managedTeamId(DB)){
  const buttons=['[data-interview-staff]','[data-hire-staff]','[data-fire-staff]'].flatMap(s=>[...root.querySelectorAll(s)]);if(!buttons.length)return;
  const current=staffUiGuard(tid,allowed),db=DB;
  buttons.forEach(b=>b.onclick=()=>{
    if(!current())return;
    const sid=b.dataset.interviewStaff||b.dataset.hireStaff||b.dataset.fireStaff,t=db.teams[tid],f=locateStaff(db,sid);if(!f)return;
    if(b.dataset.interviewStaff){const out=commitWorldAction(db,{type:'staff.interview',actor:'manager',teamId:tid,sid});act(out.ok?'면접 완료 · 추정 범위가 좁아졌습니다':out.errors.join(' · '),out.ok);return;}
    const c=b.dataset.fireStaff?{type:'staff.release',actor:'manager',teamId:tid,sid}:{type:f.team?.id===tid?'staff.renew':'staff.sign',actor:'manager',teamId:tid,sid,replaceSid:root.querySelector(`[data-staff-replace="${sid}"]`)?.value||undefined,years:Number(root.querySelector(`[data-staff-years="${sid}"]`)?.value),salary:Number(root.querySelector(`[data-staff-salary="${sid}"]`)?.value)};
    const read=JSON.parse(JSON.stringify(db)),preview=previewWorldAction(read,c);
    if(!preview.ok){act(preview.errors.join(' · '),false);return;}
    const terms=preview.command,msg=c.type==='staff.release'?`${f.staff.name} 계약 해지\n보상 ${money(terms.fee)}`:`${f.staff.name} 계약\n연봉 ${money(terms.salary)} · ${terms.years}년 · ${staffTermUntil(db.year,terms.years)}년까지\n총 약정 연봉 ${money(terms.salary*terms.years)} (일시 선납 아님)\n위약금·해지 보상 ${money(terms.fee)}${terms.replaceSid?'\n교체: '+locateStaff(db,terms.replaceSid).staff.name:''}\n해지 시 남은 연봉의 ${Math.round(STAFF_EXIT_GUARANTEE*100)}% 보상`;
    if(!confirm(msg+'\n확정할까요?')||!current())return;
    const out=commitWorldAction(db,c);act(out.ok?(c.type==='staff.release'?'스태프 계약 해지 완료':'스태프 계약 완료'):out.errors.join(' · '),out.ok);
  });
}
