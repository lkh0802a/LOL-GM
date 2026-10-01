// ===== LOL GM: Staff domain =====
// Owns staff departments, staffing limits, derived coaching profile, staff generation/AI management and manager staff actions.

const STAFF_SECONDARY_WEIGHT=.35; // Secondary expertise supplements, rather than replaces, the primary appointment.
function staffRoleAbility(s,role){return role===s.role?(s.rating||50):Math.max(0,Number(s.specialties?.[role]||0))*STAFF_SECONDARY_WEIGHT}
function staffAggregate(ms,role){const xs=(ms||[]).filter(Boolean).map(s=>role?staffRoleAbility(s,role):s.rating||50).sort((a,b)=>b-a);if(!xs.length)return 0;const weights=[1,.28,.16,.1,.07,.05];let v=0;for(let i=0;i<xs.length;i++)v+=xs[i]*(weights[i]||.03);return clamp(v,0,99)}
function staffByRole(t,role){return teamStaffMembers(t).filter(s=>s.role===role||s.specialties?.[role]>0)}
function positionCoachRole(role){return {TOP:'topCoach',JGL:'jglCoach',MID:'midCoach',ADC:'adcCoach',SUP:'supCoach'}[role]||null}
function roleCoachRating(t,role){const key=positionCoachRole(role);return key?staffAggregate(staffByRole(t,key),key):0}
function staffProfile(t){
  const strategic=staffAggregate(staffByRole(t,'strategicCoach'),'strategicCoach'),analysis=staffAggregate(staffByRole(t,'analyst'),'analyst'),development=staffAggregate(staffByRole(t,'developmentCoach'),'developmentCoach'),performance=staffAggregate(staffByRole(t,'performanceCoach'),'performanceCoach'),scouting=staffAggregate(staffByRole(t,'scout'),'scout');
  return {draft:clamp(42+strategic*.52,35,96),analysis:clamp(42+analysis*.52,35,96),development:clamp(42+development*.52,35,96),recovery:clamp(45+performance*.5,40,93),scouting:clamp(40+scouting*.5,35,96)};
}
function staffDevelopmentFor(t,role){const p=staffProfile(t),pos=roleCoachRating(t,role);return clamp(p.development+(pos?Math.max(0,pos-45)*.16:0),35,99)}
function trainingGrowthMul(t){const p=staffProfile(t);return clamp(.88+(p.development-45)/220,0.88,1.13)}

function staffSalary(s,ps){return Number.isFinite(s.contract?.salary)?s.contract.salary:Math.max(.1,Math.round((.35+((s.rating||50)-40)/35)*ps*10)/10)}
const STAFF_ROLES={
  strategicCoach:'전략 코치',developmentCoach:'육성 코치',performanceCoach:'퍼포먼스 코치',
  topCoach:'TOP 포지션 코치',jglCoach:'JGL 포지션 코치',midCoach:'MID 포지션 코치',adcCoach:'ADC 포지션 코치',supCoach:'SUP 포지션 코치',
  analyst:'분석가',scout:'스카우터'
};
const STAFF_DEPARTMENT={strategicCoach:'coach',developmentCoach:'coach',performanceCoach:'coach',topCoach:'coach',jglCoach:'coach',midCoach:'coach',adcCoach:'coach',supCoach:'coach',analyst:'analyst',scout:'scout'};
const STAFF_DEPT_LABEL={coach:'코칭팀',analyst:'분석팀',scout:'스카우팅팀'},STAFF_DEPT_LIMITS={coach:9,analyst:4,scout:6};
function staffDepartment(role){return STAFF_DEPARTMENT[role]||'coach'}
function ensureStaffRoster(t){
  if(!t)return [];
  if(Array.isArray(t.staffRoster)){delete t.staff;return t.staffRoster}
  const old=t.staff&&typeof t.staff==='object'?Object.values(t.staff).filter(Boolean):[];
  t.staffRoster=old.map(s=>({...s,department:staffDepartment(s.role)}));delete t.staff;return t.staffRoster;
}
function migrateLegacyStaffState(db){
  if(!db)return db;
  for(const t of Object.values(db.teams||{})){
    ensureStaffRoster(t);
    t.staffInitialized=true;
    if(t.active===false){db.staffPool=db.staffPool||[];for(const s of t.staffRoster){delete s.contract;db.staffPool.push(s)}t.staffRoster=[]}
    else for(const s of t.staffRoster)initializeStaffContract(db,t,s);
    if(Object.prototype.hasOwnProperty.call(t,'coach'))delete t.coach;
  }
  if(Object.prototype.hasOwnProperty.call(db,'coachPool'))delete db.coachPool;
  for(const s of db.staffPool||[])if(!Number.isFinite(s.publicEstimate))s.publicEstimate=Math.round(clamp((s.rating||50)+new RNG(s.id,'staff-public').range(-10,10),1,100));
  return db;
}
function teamStaffMembers(t,dept=null){const xs=ensureStaffRoster(t);return dept?xs.filter(s=>staffDepartment(s.role)===dept):xs}
function staffDeptCount(t,dept){return teamStaffMembers(t,dept).length}
function staffCanHire(t,s){const d=staffDepartment(s.role);return staffDeptCount(t,d)<(STAFF_DEPT_LIMITS[d]||0)}
function genStaffMember(rng,role,base=60){const nm=rng.pick(NICK_A)+rng.pick(NICK_B),rating=Math.round(clamp(base+rng.normal(0,9),35,95)),secondary=rng.pick(Object.keys(STAFF_ROLES).filter(r=>r!==role));return {id:'S'+hashStr(role+nm+rng.int(0,99999)),name:nm.charAt(0).toUpperCase()+nm.slice(1),role,department:staffDepartment(role),rating,publicEstimate:Math.round(clamp(rating+rng.range(-10,10),1,100)),age:rng.int(27,52),specialties:{[secondary]:Math.round(clamp(rating+rng.normal(-8,7),25,90))},ambition:rng.int(25,85),history:[]}}
function ensureTeamStaff(db,t,rng){
  const roster=ensureStaffRoster(t),base=clamp((db.regions[t.region]?.strength||62)-4,50,72),need={strategicCoach:1,developmentCoach:1,performanceCoach:1,analyst:1,scout:2};
  if(t.staffInitialized)return roster;
  for(const [role,n] of Object.entries(need))while(roster.filter(s=>s.role===role).length<n)roster.push(genStaffMember(rng,role,base));
  t.staffInitialized=true;for(const s of roster)initializeStaffContract(db,t,s);
  db.staffPool=db.staffPool||[];return roster;
}
function genStaffPool(db,rng){
  db.staffPool=db.staffPool||[];const counts=Object.fromEntries(Object.keys(STAFF_ROLES).map(r=>[r,0]));
  for(const s of db.staffPool)if(counts[s.role]!==undefined)counts[s.role]++;
  for(const role of Object.keys(STAFF_ROLES))while(counts[role]<6){db.staffPool.push(genStaffMember(rng,role,60+rng.normal(0,6)));counts[role]++}
  // Preserve released people and their careers; replenishment is a minimum,
  // not a destructive last-100 slice of the labour market.
}
function hireStaff(db,t,s){
  const out=commitWorldAction(db,{type:'staff.sign',actor:'system',teamId:t.id,sid:s.id,years:2,salary:staffAskingSalary(db,t,s)});
  if(!out.ok)throw new Error(out.errors.join(' · '));return s;
}
function releaseStaff(db,t,sid){
  const s=teamStaffMembers(t).find(x=>x.id===sid);if(!s)return null;
  const out=commitWorldAction(db,{type:'staff.release',actor:'system',teamId:t.id,sid});if(!out.ok)throw new Error(out.errors.join(' · '));return s;
}
function staffRoleWeight(t,role){
  const p=t.philosophy||'balanced',dept=staffDepartment(role),pos=role.endsWith('Coach')&&!['strategicCoach','developmentCoach','performanceCoach'].includes(role);
  const base={youth:{coach:1.12,analyst:.9,scout:1.15},'win-now':{coach:1.12,analyst:1.2,scout:.85},superstar:{coach:1.05,analyst:1,scout:1.05},cost:{coach:.82,analyst:.8,scout:.9},balanced:{coach:1,analyst:1,scout:1}}[p]||{coach:1,analyst:1,scout:1};
  return (base[dept]||1)*(role==='developmentCoach'&&p==='youth'?1.15:role==='strategicCoach'&&p==='win-now'?1.1:pos&&p==='youth'?1.08:1);
}
function aiManageStaff(db,t,rng){
  if(!t||t.id===managedTeamId(db)||!t.finance)return false;ensureTeamStaff(db,t,rng);
  const ps=psOf(db,t.region),cash=t.finance.cash||0,reserve=(t.philosophy==='cost'?8:5)*ps,cands=staffMarketCandidates(db,t),liquidity=financeRunway(db,t);if(['critical','strained'].includes(liquidity.severity)||financeForecast(db,t).closingCash<reserve*2)return false;let best=null;
  for(const s of cands){if(!STAFF_ROLES[s.role])continue;const same=teamStaffMembers(t).filter(x=>x.role===s.role).sort((a,b)=>staffObservation(db,t,a).estimate-staffObservation(db,t,b).estimate),replace=staffCanHire(t,s)?null:same[0];if(!staffCanHire(t,s)&&!replace)continue;const base=replace?staffObservation(db,t,replace).estimate:same.length?Math.max(...same.map(x=>staffObservation(db,t,x).estimate)):45,gain=(staffObservation(db,t,s).estimate-base)*staffRoleWeight(t,s.role),annual=staffAskingSalary(db,t,s);if(gain>=6&&cash>annual+reserve&&(!best||gain>best.gain)&&previewWorldAction(db,{type:'staff.sign',actor:'ai',teamId:t.id,sid:s.id,replaceSid:replace?.id,years:2,salary:annual}).ok)best={s,gain,annual,replace}}
  if(!best)return false;return commitWorldAction(db,{type:'staff.sign',actor:'ai',teamId:t.id,sid:best.s.id,replaceSid:best.replace?.id,years:2,salary:best.annual}).ok;
}
function ageStaff(db,rng){
  const mine=managedTeamId(db);db.staffPool=db.staffPool||[];const freeAtStart=db.staffPool.slice();
  for(const t of activeTeams(db)){
    const roster=t.id===mine?ensureStaffRoster(t):ensureTeamStaff(db,t,rng);
    for(const s of roster.slice()){s.age=(s.age||35)+1;if(s.age>=62&&rng.chance(.12+(s.age-62)*.04)){commitWorldAction(db,{type:'staff.retire',actor:'system',teamId:t.id,sid:s.id});if(t.id===mine&&db.world){db.world.marketLog=db.world.marketLog||[];db.world.marketLog.push((STAFF_ROLES[s.role]||s.role)+' '+s.name+' 은퇴 · 후임을 직접 선임하세요')}}else if(s.contract?.until<db.year){if(t.id!==mine){const renewed=commitWorldAction(db,{type:'staff.renew',actor:'ai',teamId:t.id,sid:s.id,years:2,salary:staffAskingSalary(db,t,s)});if(renewed.ok)continue}commitWorldAction(db,{type:'staff.expire',actor:'system',teamId:t.id,sid:s.id})}}
  }
  for(const s of freeAtStart){s.age=(s.age||35)+1;if(s.age>=68){s.retired=true;recordStaffEvent(db,s,'retire');db.staffRetired=db.staffRetired||[];db.staffRetired.push(s)}}db.staffPool=db.staffPool.filter(s=>!s.retired);
}

function mHireStaff(db,sid,terms={}){const t=myT(db),found=locateStaff(db,sid);if(!found)return '스태프를 찾을 수 없습니다';const out=commitWorldAction(db,{type:found.team?.id===t.id?'staff.renew':'staff.sign',actor:'manager',teamId:t.id,sid,replaceSid:terms.replaceSid,years:terms.years??2,salary:terms.salary??staffAskingSalary(db,t,found.staff)});return out.ok?found.staff.name+' 계약 완료':out.errors.join(' · ')}
function mReleaseStaff(db,sid){const out=commitWorldAction(db,{type:'staff.release',actor:'manager',teamId:myT(db).id,sid});return out.ok?'스태프 계약 해지 · 비용 '+money(out.fee):out.errors.join(' · ')}
