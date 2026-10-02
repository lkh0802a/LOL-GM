// Staff employment uses the same preview, finance and rollback gate as players.
const STAFF_EXIT_GUARANTEE=.5; // One common staff compensation policy; not an individually negotiated clause.
function initializeStaffContract(db,t,s){
  if(!s.contract)s.contract={salary:staffSalary(s,psTeam(db,t)),from:db.year,until:db.year+1,years:2};
  s.history=s.history||[];s.since=s.since??db.year;
  if(!Number.isFinite(s.publicEstimate))s.publicEstimate=Math.round(clamp((s.rating||50)+new RNG(s.id,'staff-public').range(-10,10),1,100));
}
function locateStaff(db,sid){
  const found=[];
  for(const t of Object.values(db.teams))for(const s of t.staffRoster||[])if(s.id===sid)found.push({staff:s,team:t});
  for(const s of db.staffPool||[])if(s.id===sid)found.push({staff:s,team:null});
  return found.length===1?found[0]:null;
}
function staffMarketCandidates(db,t){return [...(db.staffPool||[]),...activeTeams(db).filter(x=>x.id!==t.id).flatMap(x=>x.staffRoster||[])].filter(s=>!s.retired)}
function staffAskingSalary(db,t,s){
  const base=staffSalary({...s,contract:null},psTeam(db,t));
  return Math.max(.1,Math.round(Math.max(base,s.contract?.salary||0)*10)/10);
}
function staffExitFee(db,s){return s.contract?Math.round(s.contract.salary*Math.max(0,s.contract.until-db.year+1)*STAFF_EXIT_GUARANTEE*10)/10:0}
function staffClosureClaims(db,t){return (t.staffRoster||[]).map(s=>({claimantKind:'staff',sid:s.id,staffName:s.name,amount:staffExitFee(db,s),salary:s.contract?.salary||0,remainingYears:Math.max(0,(s.contract?.until??db.year-1)-db.year+1),guaranteeRate:STAFF_EXIT_GUARANTEE,year:db.year,date:db.worldDate||null,reason:'club_closure'})).filter(r=>r.amount>0)}
function releaseClosingStaff(db,t){
  for(const claim of staffClosureClaims(db,t))recordContractReleaseObligation(t,claim.amount,claim);
  db.staffPool=db.staffPool||[];
  for(const s of t.staffRoster||[]){const fromYear=s.since??s.contract?.from;s.contract=null;recordStaffEvent(db,s,'club_closure',{from:t.id,fromYear});db.staffPool.push(s)}
  t.staffRoster=[];
}
function staffObservation(db,t,s){
  const report=t.staffReports?.[s.id],fresh=report&&report.year===db.year&&[report.estimate,report.min,report.max].every(Number.isFinite);
  if(fresh)return {estimate:report.estimate,min:report.min,max:report.max,interviewed:true};
  const estimate=s.publicEstimate??50,width=12;
  return {estimate,min:Math.max(1,estimate-width),max:Math.min(100,estimate+width),interviewed:false};
}
function staffConsent(db,t,s,salary){
  const asking=staffAskingSalary(db,t,s),old=locateStaff(db,s.id)?.team;
  if(salary+1e-8<asking)return {ok:false,reason:'salary_refused',errors:['요구 연봉 '+money(asking)+' 이상을 제안해야 합니다']};
  if(old&&old.id!==t.id&&s.contract?.until>=db.year){
    const ambition=(s.ambition??50)/100;
    const prestige=(t.reputation||50)-(old.reputation||50);
    const payGain=(salary-Math.max(.1,s.contract.salary))/Math.max(.1,s.contract.salary);
    if(prestige*ambition+payGain*35<5)return {ok:false,reason:'move_refused',errors:['스태프가 현재 구단에 남기를 원합니다']};
  }
  return {ok:true};
}
function validateStaffAction(db,a){
  const t=db.teams[a.teamId],found=locateStaff(db,a.sid),system=a.actor==='system';
  const freeRetirement=a.type==='staff.retire'&&system&&!a.teamId&&found&&!found.team;
  if((!t||t.active===false)&&!freeRetirement||!found||found.staff.retired)return worldActionError('missing_staff','구단 또는 스태프를 찾을 수 없습니다');
  const mine=managedTeamId(db);
  if(a.actor==='manager'&&mine!==t?.id||a.actor==='ai'&&mine===t?.id)return worldActionError('unauthorized','관리 권한이 없는 스태프 계약입니다');
  const s=found.staff,own=!!t&&found.team?.id===t.id;
  if(!STAFF_ROLES[s.role])return worldActionError('invalid_staff','유효하지 않은 스태프 직무입니다');
  if(a.type==='staff.sign'&&found.team&&found.team.id===mine&&a.actor==='ai')return worldActionError('protected_staff','관리 구단 스태프는 AI가 데려갈 수 없습니다');
  if(['staff.renew','staff.release','staff.expire','staff.retire'].includes(a.type)&&!own&&!freeRetirement)return worldActionError('not_employer','현재 고용 구단만 처리할 수 있습니다');
  if(['staff.expire','staff.retire'].includes(a.type)&&!system)return worldActionError('system_only','시스템 처리만 허용됩니다');
  if(a.type==='staff.expire'&&(!s.contract||s.contract.until>=db.year))return worldActionError('not_expired','아직 계약이 만료되지 않았습니다');
  if(a.type==='staff.retire'&&(!Number.isFinite(s.age)||s.age<STAFF_RETIREMENT_MODEL.minimumAge))return worldActionError('not_retiring','은퇴 연령이 아닙니다');
  if(a.type==='staff.sign'&&own)return worldActionError('already_employed','재계약을 사용하세요');
  if(a.type==='staff.renew'&&s.contract?.until>db.year)return worldActionError('renewal_window','계약 마지막 연도부터 재계약할 수 있습니다');
  const replacement=a.replaceSid?(t?.staffRoster||[]).find(x=>x.id===a.replaceSid):null;
  if(a.replaceSid&&(a.type!=='staff.sign'||!replacement||replacement.id===s.id||staffDepartment(replacement.role)!==staffDepartment(s.role)))return worldActionError('invalid_replacement','같은 부서의 현재 스태프만 교체할 수 있습니다');
  if(a.type==='staff.sign'&&!replacement&&!staffCanHire(t,s))return worldActionError('staff_cap','해당 부서 정원에 도달했습니다');
  let salary=null,years=null,fee=0,poachFee=0,releaseFee=0;
  if(a.type==='staff.sign'||a.type==='staff.renew'){
    salary=Number(a.salary);years=Number(a.years);
    if(!Number.isInteger(years)||years<1||years>3||!Number.isFinite(salary)||salary<=0||salary>10000)return worldActionError('invalid_terms','계약 기간은 1~3년, 연봉은 양수여야 합니다');
    salary=Math.round(salary*10)/10;
    const consent=staffConsent(db,t,s,salary);if(!consent.ok)return consent;
    poachFee=a.type==='staff.sign'&&found.team?staffExitFee(db,s):0;releaseFee=replacement?staffExitFee(db,replacement):0;fee=poachFee+releaseFee;
    if(!Number.isFinite(t.finance?.cash)||t.finance.cash<fee+salary)return worldActionError('insufficient_cash','위약금과 1년 연봉을 감당할 자금이 부족합니다');
    // Compare the final payroll, replacing the existing wage on renewal.
    const forecast=financeForecast(db,t),increase=salary-(own?staffSalary(s,psTeam(db,t)):replacement?staffSalary(replacement,psTeam(db,t)):0);
    if(a.actor!=='system'&&forecast.closingCash-increase-fee<0)return worldActionError('staff_budget','예상 결산 잔고가 새 스태프 계약을 감당하지 못합니다');
  }else if(a.type==='staff.release'){
    fee=staffExitFee(db,s);if(!Number.isFinite(t.finance?.cash)||t.finance.cash<fee)return worldActionError('insufficient_cash','스태프 해지 보상 자금이 부족합니다');
  }
  return {ok:true,teamId:t?.id||null,sid:s.id,fromId:found.team?.id||null,replaceSid:replacement?.id||null,salary,years,fee,poachFee,releaseFee};
}
function staffActionSnapshot(db,c){
  const f=locateStaff(db,c.sid),teams=[...new Set([c.teamId,f?.team?.id].filter(Boolean))];
  return JSON.parse(JSON.stringify({date:db.worldDate,year:db.year,manager:managedTeamId(db),staff:f?.staff,
    owner:f?.team?.id||null,poolIds:(db.staffPool||[]).map(s=>s.id),
    teams:teams.map(id=>({id,active:db.teams[id].active,finance:db.teams[id].finance,roster:db.teams[id].staffRoster,reports:db.teams[id].staffReports}))}));
}
function recordStaffEvent(db,s,type,details={}){s.history=s.history||[];s.history.push({date:db.worldDate||null,year:db.year,type,...details})}
function applyStaffAction(db,c){
  const t=db.teams[c.teamId],f=locateStaff(db,c.sid),s=f.staff;
  if(c.type==='staff.interview'){
    const rng=new RNG(t.id+'/'+s.id+'/'+db.year,'staff-interview'),estimate=Math.round(clamp((s.rating||50)+rng.range(-4,4),1,100));
    t.staffReports=t.staffReports||{};t.staffReports[s.id]={year:db.year,date:db.worldDate,estimate,min:Math.max(1,estimate-4),max:Math.min(100,estimate+4)};
    return {sid:s.id,observation:staffObservation(db,t,s)};
  }
  if(c.type==='staff.sign'||c.type==='staff.renew'){
    const previousSince=f.team?s.since??s.contract?.from:null;
    if(c.type==='staff.sign'){
      if(c.replaceSid){const replaced=t.staffRoster.find(x=>x.id===c.replaceSid);if(c.releaseFee)payFinancePrepaid(t,'staffSeverance',c.releaseFee);t.staffRoster.splice(t.staffRoster.indexOf(replaced),1);const fromYear=replaced.since??replaced.contract?.from;replaced.contract=null;recordStaffEvent(db,replaced,'release',{from:t.id,fromYear,fee:c.releaseFee});db.staffPool=db.staffPool||[];db.staffPool.push(replaced)}
      if(f.team){payFinancePrepaid(t,'transferPaid',c.poachFee);receiveFinancePrepaidTransfer(f.team,c.poachFee);f.team.staffRoster.splice(f.team.staffRoster.indexOf(s),1)}
      else db.staffPool.splice(db.staffPool.indexOf(s),1);
      ensureStaffRoster(t).push(s);s.since=db.year;
    }
    s.contract={salary:c.salary,years:c.years,from:db.year,until:db.year+c.years-1};
    recordStaffEvent(db,s,c.type==='staff.renew'?'renewal':'signing',{from:c.fromId,to:t.id,previousSince,salary:c.salary,until:s.contract.until,fee:c.fee,poachFee:c.poachFee,releaseFee:c.releaseFee,replaceSid:c.replaceSid});
  }else{
    if(c.fee)payFinancePrepaid(t,'staffSeverance',c.fee);
    const fromYear=t?s.since??s.contract?.from:null;
    if(t)t.staffRoster.splice(t.staffRoster.indexOf(s),1);else db.staffPool.splice(db.staffPool.indexOf(s),1);s.contract=null;
    recordStaffEvent(db,s,c.type.slice(6),{from:t?.id||null,fromYear,fee:c.fee,...(c.type==='staff.retire'?{review:staffRetirementReview(db,s,t)}:{})});
    if(c.type==='staff.retire'){s.retired=true;s.retiredYear=db.year;db.staffRetired=db.staffRetired||[];db.staffRetired.push(s)}
    else{db.staffPool=db.staffPool||[];db.staffPool.push(s)}
  }
  return {sid:s.id,fee:c.fee};
}
function staffStateErrors(db){
  const ids=new Set(),errors=[];
  for(const t of Object.values(db.teams))for(const [dept,limit] of Object.entries(STAFF_DEPT_LIMITS))if((t.staffRoster||[]).filter(s=>staffDepartment(s.role)===dept).length>limit)errors.push('스태프 부서 정원 초과: '+t.id+'/'+dept);
  for(const t of Object.values(db.teams))for(const s of t.staffRoster||[]){
    if(t.active===false)errors.push('해체 구단의 고용 스태프: '+s.id);
    if(ids.has(s.id))errors.push('중복 스태프 소속: '+s.id);ids.add(s.id);
    if(!STAFF_ROLES[s.role]||s.retired||!s.contract||!Number.isFinite(s.contract.salary)||s.contract.salary<=0||!Number.isInteger(s.contract.until)||!Number.isInteger(s.contract.years)||s.contract.years<1||s.contract.years>3)errors.push('잘못된 스태프 계약: '+s.id);
  }
  for(const s of db.staffPool||[]){if(ids.has(s.id)||s.contract||s.retired)errors.push('잘못된 자유 스태프: '+s.id);ids.add(s.id)}
  for(const s of db.staffRetired||[]){if(ids.has(s.id)||s.contract||!s.retired)errors.push('잘못된 은퇴 스태프: '+s.id);ids.add(s.id)}
  const all=[...Object.values(db.teams).flatMap(t=>t.staffRoster||[]),...(db.staffPool||[]),...(db.staffRetired||[])];
  for(const s of all){
    if(s.specialties!==undefined&&(!s.specialties||typeof s.specialties!=='object'||Array.isArray(s.specialties)||Object.entries(s.specialties).some(([r,v])=>Object.hasOwn(STAFF_ROLES,r)&&(!Number.isFinite(v)||v<0||v>100))))errors.push('잘못된 스태프 전문분야: '+s.id);
    if(s.scoutRegions!==undefined&&(!s.scoutRegions||typeof s.scoutRegions!=='object'||Array.isArray(s.scoutRegions)||Object.values(s.scoutRegions).some(r=>!r||!Number.isFinite(r.knowledge)||r.knowledge<0||r.knowledge>100||!Number.isInteger(r.observations)||r.observations<1||!Number.isInteger(r.lastYear)||r.lastDate!==null&&typeof r.lastDate!=='string')))errors.push('잘못된 스카우터 지역 경험: '+s.id);
    if(s.career!==undefined&&(!Array.isArray(s.career)||s.career.some(r=>!r||!Number.isInteger(r.year)||typeof r.seasonId!=='string'||typeof r.teamId!=='string'||!STAFF_ROLES[r.role]||!Number.isInteger(r.series)||r.series<0||!Number.isInteger(r.wins)||r.wins<0||r.wins>r.series)))errors.push('잘못된 스태프 경기 경력: '+s.id);
    if(Array.isArray(s.career)&&new Set(s.career.map(r=>r&&JSON.stringify([r.seasonId,r.teamId,r.role]))).size!==s.career.length)errors.push('중복 스태프 경기 경력: '+s.id);
    const r=s.retirementReview;
    if(r!==undefined&&(!r||!Number.isInteger(r.year)||!Number.isFinite(r.age)||!Number.isInteger(r.careerYears)||r.careerYears<0||!Number.isInteger(r.series)||r.series<0||!Number.isInteger(r.wins)||r.wins<0||r.wins>r.series||!Number.isFinite(r.motivation)||r.motivation<0||r.motivation>100||!Number.isFinite(r.probability)||r.probability<0||r.probability>1))errors.push('잘못된 스태프 활동 검토: '+s.id);
    if(r&&(r.winRate!==(r.series?r.wins/r.series:null)||!Number.isInteger(r.unemployedYears)||r.unemployedYears<0))errors.push('잘못된 스태프 활동 근거: '+s.id);
    if(s.ageReviewYear!==undefined&&!Number.isInteger(s.ageReviewYear))errors.push('잘못된 스태프 검토 연도: '+s.id);
  }
  return errors;
}
function captureStaffActionJournal(db,c){
  const located=locateStaff(db,c.sid),teams=[...new Set(c.teamIds||[c.teamId,located?.team?.id].filter(Boolean))].map(id=>db.teams[id]);
  const teamRows=teams.map(t=>({t,finance:actionJournalClone(t.finance),reports:t.staffReports? actionJournalClone(t.staffReports):null}));
  const arrays=[...teams.map(t=>[t,'staffRoster']),[db,'staffPool'],[db,'staffRetired']].map(([owner,key])=>({owner,key,present:Object.hasOwn(owner,key),ref:owner[key],entries:(owner[key]||[]).map(s=>({s,record:actionJournalClone(s)}))}));
  return {playerIds:new Set(),rollback(){
    for(const row of teamRows){actionJournalRestoreObject(row.t.finance,row.finance);if(row.reports)row.t.staffReports=row.reports;else delete row.t.staffReports}
    for(const row of arrays){if(!row.present){delete row.owner[row.key];continue}for(const {s,record} of row.entries)actionJournalRestoreObject(s,record);row.ref.splice(0,row.ref.length,...row.entries.map(x=>x.s));row.owner[row.key]=row.ref}
  }};
}
for(const type of ['staff.sign','staff.renew','staff.release','staff.expire','staff.retire','staff.interview'])WORLD_ACTION_HANDLERS[type]={
  validate:validateStaffAction,
  canonical(db,a,v){return {type:a.type,actor:a.actor,teamId:v.teamId,sid:v.sid,fromId:v.fromId,replaceSid:v.replaceSid,salary:v.salary,years:v.years,fee:v.fee,poachFee:v.poachFee,releaseFee:v.releaseFee}},
  snapshot:staffActionSnapshot,changes(db,c){return [{sid:c.sid,from:c.fromId,to:c.teamId,replaceSid:c.replaceSid,salary:c.salary,years:c.years,fee:c.fee}]},apply:applyStaffAction
};
