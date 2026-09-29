// ===== LOL GM: Staff domain =====
// Owns staff departments, staffing limits, derived coaching profile, staff generation/AI management and manager staff actions.

function staffAggregate(ms){const xs=(ms||[]).filter(Boolean).map(s=>s.rating||50).sort((a,b)=>b-a);if(!xs.length)return 0;const weights=[1,.28,.16,.1,.07,.05];let v=0;for(let i=0;i<xs.length;i++)v+=xs[i]*(weights[i]||.03);return clamp(v,0,99)}
function staffByRole(t,role){return teamStaffMembers(t).filter(s=>s.role===role)}
function positionCoachRole(role){return {TOP:'topCoach',JGL:'jglCoach',MID:'midCoach',ADC:'adcCoach',SUP:'supCoach'}[role]||null}
function roleCoachRating(t,role){const key=positionCoachRole(role);return key?staffAggregate(staffByRole(t,key)):0}
function staffProfile(t){
  const strategic=staffAggregate(staffByRole(t,'strategicCoach')),analysis=staffAggregate(staffByRole(t,'analyst')),development=staffAggregate(staffByRole(t,'developmentCoach')),performance=staffAggregate(staffByRole(t,'performanceCoach')),scouting=staffAggregate(staffByRole(t,'scout'));
  return {draft:clamp(42+strategic*.52,35,96),analysis:clamp(42+analysis*.52,35,96),development:clamp(42+development*.52,35,96),recovery:clamp(45+performance*.5,40,93),scouting:clamp(40+scouting*.5,35,96)};
}
function staffDevelopmentFor(t,role){const p=staffProfile(t),pos=roleCoachRating(t,role);return clamp(p.development+(pos?Math.max(0,pos-45)*.16:0),35,99)}
function trainingGrowthMul(t){const p=staffProfile(t);return clamp(.88+(p.development-45)/220,0.88,1.13)}

function staffSalary(s,ps){return Math.round((.35+((s.rating||50)-40)/35)*ps*10)/10}
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
    if(Object.prototype.hasOwnProperty.call(t,'coach'))delete t.coach;
  }
  if(Object.prototype.hasOwnProperty.call(db,'coachPool'))delete db.coachPool;
  return db;
}
function teamStaffMembers(t,dept=null){const xs=ensureStaffRoster(t);return dept?xs.filter(s=>staffDepartment(s.role)===dept):xs}
function staffDeptCount(t,dept){return teamStaffMembers(t,dept).length}
function staffCanHire(t,s){const d=staffDepartment(s.role);return staffDeptCount(t,d)<(STAFF_DEPT_LIMITS[d]||0)}
function genStaffMember(rng,role,base=60){const nm=rng.pick(NICK_A)+rng.pick(NICK_B);return {id:'S'+hashStr(role+nm+rng.int(0,99999)),name:nm.charAt(0).toUpperCase()+nm.slice(1),role,department:staffDepartment(role),rating:Math.round(clamp(base+rng.normal(0,9),35,95)),age:rng.int(27,52)}}
function ensureTeamStaff(db,t,rng){
  const roster=ensureStaffRoster(t),base=clamp((db.regions[t.region]?.strength||62)-4,50,72),need={strategicCoach:1,developmentCoach:1,performanceCoach:1,analyst:1,scout:2};
  for(const [role,n] of Object.entries(need))while(roster.filter(s=>s.role===role).length<n)roster.push(genStaffMember(rng,role,base));
  db.staffPool=db.staffPool||[];return roster;
}
function genStaffPool(db,rng){
  db.staffPool=db.staffPool||[];const counts=Object.fromEntries(Object.keys(STAFF_ROLES).map(r=>[r,0]));
  for(const s of db.staffPool)if(counts[s.role]!==undefined)counts[s.role]++;
  for(const role of Object.keys(STAFF_ROLES))while(counts[role]<6){db.staffPool.push(genStaffMember(rng,role,60+rng.normal(0,6)));counts[role]++}
  db.staffPool=db.staffPool.slice(-100);
}
function hireStaff(db,t,s){
  if(!s||!STAFF_ROLES[s.role])throw new Error('유효하지 않은 스태프입니다');
  if(!staffCanHire(t,s))throw new Error((STAFF_DEPT_LABEL[staffDepartment(s.role)]||'스태프')+' 고용 상한에 도달했습니다');
  db.staffPool=db.staffPool||[];db.staffPool=db.staffPool.filter(x=>x.id!==s.id);ensureStaffRoster(t).push({...s,department:staffDepartment(s.role),since:db.year});return s;
}
function releaseStaff(db,t,sid){
  const roster=ensureStaffRoster(t),i=roster.findIndex(s=>s.id===sid);if(i<0)return null;const [s]=roster.splice(i,1);db.staffPool=db.staffPool||[];db.staffPool.push(s);return s;
}
function staffRoleWeight(t,role){
  const p=t.philosophy||'balanced',dept=staffDepartment(role),pos=role.endsWith('Coach')&&!['strategicCoach','developmentCoach','performanceCoach'].includes(role);
  const base={youth:{coach:1.12,analyst:.9,scout:1.15},'win-now':{coach:1.12,analyst:1.2,scout:.85},superstar:{coach:1.05,analyst:1,scout:1.05},cost:{coach:.82,analyst:.8,scout:.9},balanced:{coach:1,analyst:1,scout:1}}[p]||{coach:1,analyst:1,scout:1};
  return (base[dept]||1)*(role==='developmentCoach'&&p==='youth'?1.15:role==='strategicCoach'&&p==='win-now'?1.1:pos&&p==='youth'?1.08:1);
}
function aiManageStaff(db,t,rng){
  if(!t||t.id===managedTeamId(db)||!t.finance)return false;ensureTeamStaff(db,t,rng);
  const ps=psOf(db,t.region),cash=t.finance.cash||0,reserve=(t.philosophy==='cost'?8:5)*ps,cands=db.staffPool||[],liquidity=financeRunway(db,t);if(['critical','strained'].includes(liquidity.severity)||financeForecast(db,t).closingCash<reserve*2)return false;let best=null;
  for(const s of cands){if(!STAFF_ROLES[s.role])continue;const dept=staffDepartment(s.role),members=teamStaffMembers(t,dept),same=members.filter(x=>x.role===s.role).sort((a,b)=>a.rating-b.rating),room=members.length<(STAFF_DEPT_LIMITS[dept]||0),replace=room?null:(same[0]||members.slice().sort((a,b)=>a.rating-b.rating)[0]);const base=replace?.rating||(same.length?Math.max(...same.map(x=>x.rating)):45),gain=(s.rating-base)*staffRoleWeight(t,s.role),fee=replace?staffSalary(replace,ps):0,annual=staffSalary(s,ps);if(gain>=6&&cash>fee+annual+reserve&&(!best||gain>best.gain))best={s,gain,fee,replace}}
  if(!best)return false;t.finance.cash=Math.round((t.finance.cash-best.fee)*10)/10;if(best.fee)recordFinancePrepaid(t,'staffSeverance',best.fee);if(best.replace)releaseStaff(db,t,best.replace.id);hireStaff(db,t,best.s);return true;
}
function ageStaff(db,rng){
  const mine=managedTeamId(db);db.staffPool=db.staffPool||[];
  for(const t of activeTeams(db)){
    const roster=t.id===mine?ensureStaffRoster(t):ensureTeamStaff(db,t,rng);
    for(let i=roster.length-1;i>=0;i--){const s=roster[i];s.age=(s.age||35)+1;if(s.age>=62&&rng.chance(.12+(s.age-62)*.04)){roster.splice(i,1);if(t.id===mine&&db.world){db.world.marketLog=db.world.marketLog||[];db.world.marketLog.push((STAFF_ROLES[s.role]||s.role)+' '+s.name+' 은퇴 · 후임을 직접 선임하세요')}}}
  }
  for(const s of db.staffPool)s.age=(s.age||35)+1;db.staffPool=db.staffPool.filter(s=>s.age<68);
}

function mHireStaff(db,sid){const t=myT(db),s=(db.staffPool||[]).find(x=>x.id===sid);if(!s)return '스태프를 찾을 수 없습니다';if(!staffCanHire(t,s))return (STAFF_DEPT_LABEL[staffDepartment(s.role)]||'스태프')+' 고용 상한에 도달했습니다';const annual=staffSalary(s,psOf(db,t.region));if(t.finance.cash<annual)return '보유 자금이 부족합니다';hireStaff(db,t,s);return `${STAFF_ROLES[s.role]} ${s.name} 선임 · ${STAFF_DEPT_LABEL[staffDepartment(s.role)]} ${staffDeptCount(t,staffDepartment(s.role))}/${STAFF_DEPT_LIMITS[staffDepartment(s.role)]}`}
function mReleaseStaff(db,sid){const t=myT(db),s=teamStaffMembers(t).find(x=>x.id===sid);if(!s)return '스태프를 찾을 수 없습니다';const fee=staffSalary(s,psOf(db,t.region));if(t.finance.cash<fee)return '계약 해지 비용이 부족합니다';t.finance.cash=Math.round((t.finance.cash-fee)*10)/10;recordFinancePrepaid(t,'staffSeverance',fee);releaseStaff(db,t,sid);return `${STAFF_ROLES[s.role]} ${s.name} 계약 해지 · 비용 ${money(fee)}`}
