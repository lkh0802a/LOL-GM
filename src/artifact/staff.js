// ===== LOL GM: Staff domain =====
// Owns staff departments, staffing limits, derived coaching profile, staff generation/AI management and manager staff actions.

const STAFF_SECONDARY_WEIGHT=.35; // Secondary expertise supplements, rather than replaces, the primary appointment.
function staffSecondaryRoles(s){return Object.keys(s.specialties||{}).filter(r=>r!==s.role&&Object.hasOwn(STAFF_ROLES,r)&&Number.isFinite(s.specialties[r])&&s.specialties[r]>0)}
function staffSpecialtyAllocation(s){return 1/(1+STAFF_SECONDARY_WEIGHT*staffSecondaryRoles(s).length)}
function staffRoleAbility(s,role){const raw=role===s.role?(s.rating||50):staffSecondaryRoles(s).includes(role)?s.specialties[role]*STAFF_SECONDARY_WEIGHT:0;return clamp(raw*staffSpecialtyAllocation(s),0,99)}
const ANALYSIS_CONTEXTS={opponent:'상대 분석',meta:'밴픽/메타',data:'데이터 분석'};
function staffAnalysisMultiplier(s,context){return s.analysisFocus===undefined?1:s.analysisFocus===context?1.2:.75}
function staffAnalysisAbility(s,context){return clamp(staffRoleAbility(s,'analyst')*staffAnalysisMultiplier(s,context),0,99)}
function staffAnalysisFor(t,context){const xs=staffByRole(t,'analyst').map(s=>staffAnalysisAbility(s,context)).sort((a,b)=>b-a);return clamp(42+staffWeightedValues(xs)*.52,35,96)}
function staffAnalysisHiringWeights(db,t){const members=teamStaffMembers(t).filter(s=>s.role==='analyst');return Object.fromEntries(Object.keys(ANALYSIS_CONTEXTS).map(k=>[k,1/(50+members.reduce((n,s)=>n+staffObservation(db,t,s).estimate*staffSpecialtyAllocation(s)*staffAnalysisMultiplier(s,k),0))]))}
function staffObservedPrimary(db,t,s){const base=staffObservation(db,t,s).estimate*staffSpecialtyAllocation(s);if(s.role!=='analyst')return base;const weights=staffAnalysisHiringWeights(db,t),total=Object.values(weights).reduce((n,v)=>n+v,0);return base*Object.entries(weights).reduce((n,[k,v])=>n+staffAnalysisMultiplier(s,k)*v,0)/total}
function staffWeightedValues(xs){const weights=[1,.28,.16,.1,.07,.05];return clamp(xs.reduce((n,v,i)=>n+v*(weights[i]||.03),0),0,99)}
function staffAggregate(ms,role){return staffWeightedValues((ms||[]).filter(Boolean).map(s=>role?staffRoleAbility(s,role):s.rating||50).sort((a,b)=>b-a))}
function staffByRole(t,role){return teamStaffMembers(t).filter(s=>s.role===role||s.specialties?.[role]>0)}
function positionCoachRole(role){return {TOP:'topCoach',JGL:'jglCoach',MID:'midCoach',ADC:'adcCoach',SUP:'supCoach'}[role]||null}
function roleCoachRating(t,role){const key=positionCoachRole(role);return key?staffAggregate(staffByRole(t,key),key):0}
// Fictional learning policy; appointment at practice time, not season-end staffing.
function positionPracticeBonus(db,p){const t=db.teams[p.team];return t?clamp(roleCoachRating(t,p.role)/99*.3,0,.3):0}
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
function genStaffMember(rng,role,base=60){const nm=rng.pick(NICK_A)+rng.pick(NICK_B),rating=Math.round(clamp(base+rng.normal(0,9),35,95)),secondary=rng.pick(Object.keys(STAFF_ROLES).filter(r=>r!==role)),s={id:'S'+hashStr(role+nm+rng.int(0,99999)),name:nm.charAt(0).toUpperCase()+nm.slice(1),role,department:staffDepartment(role),rating,publicEstimate:Math.round(clamp(rating+rng.range(-10,10),1,100)),age:rng.int(27,52),specialties:{[secondary]:Math.round(clamp(rating+rng.normal(-8,7),25,90))},ambition:rng.int(25,85),history:[]};if(role==='analyst')s.analysisFocus=Object.keys(ANALYSIS_CONTEXTS)[hashStr(s.id+'|analysis-focus')%3];return s}
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
  for(const s of cands){if(!STAFF_ROLES[s.role])continue;const same=teamStaffMembers(t).filter(x=>x.role===s.role).sort((a,b)=>staffObservedPrimary(db,t,a)-staffObservedPrimary(db,t,b)),replace=staffCanHire(t,s)?null:same[0];if(!staffCanHire(t,s)&&!replace)continue;const base=replace?staffObservedPrimary(db,t,replace):same.length?Math.max(...same.map(x=>staffObservedPrimary(db,t,x))):45,gain=(staffObservedPrimary(db,t,s)-base)*staffRoleWeight(t,s.role),annual=staffAskingSalary(db,t,s);if(gain>=6&&cash>annual+reserve&&(!best||gain>best.gain)&&previewWorldAction(db,{type:'staff.sign',actor:'ai',teamId:t.id,sid:s.id,replaceSid:replace?.id,years:2,salary:annual}).ok)best={s,gain,annual,replace}}
  if(!best)return false;return commitWorldAction(db,{type:'staff.sign',actor:'ai',teamId:t.id,sid:best.s.id,replaceSid:best.replace?.id,years:2,salary:best.annual}).ok;
}
function ageStaff(db,rng){
  const mine=managedTeamId(db);db.staffPool=db.staffPool||[];const freeAtStart=db.staffPool.slice();
  for(const t of activeTeams(db)){
    const roster=t.id===mine?ensureStaffRoster(t):ensureTeamStaff(db,t,rng);
    for(const s of roster.slice()){
      if(s.ageReviewYear===db.year)continue;s.ageReviewYear=db.year;s.age=(s.age||35)+1;
      const review=staffRetirementReview(db,s,t);s.retirementReview=review;
      if(rng.chance(review.probability)){
        const retired=commitWorldAction(db,{type:'staff.retire',actor:'system',teamId:t.id,sid:s.id});
        if(!retired.ok)throw Error(retired.errors.join(' · '));
        if(t.id===mine&&db.world){db.world.marketLog=db.world.marketLog||[];db.world.marketLog.push((STAFF_ROLES[s.role]||s.role)+' '+s.name+' 은퇴 · '+staffRetirementExplanation(review)+' · 후임을 직접 선임하세요')}
      }else if(s.contract?.until<db.year){if(t.id!==mine){const renewed=commitWorldAction(db,{type:'staff.renew',actor:'ai',teamId:t.id,sid:s.id,years:2,salary:staffAskingSalary(db,t,s)});if(renewed.ok)continue}commitWorldAction(db,{type:'staff.expire',actor:'system',teamId:t.id,sid:s.id})}
    }
  }
  for(const s of freeAtStart){
    if(s.ageReviewYear===db.year)continue;s.ageReviewYear=db.year;s.age=(s.age||35)+1;s.retirementReview=staffRetirementReview(db,s,null);
    if(rng.chance(s.retirementReview.probability)){const out=commitWorldAction(db,{type:'staff.retire',actor:'system',teamId:null,sid:s.id});if(!out.ok)throw Error(out.errors.join(' · '))}
  }
}

// These are explicit fictional simulation weights, not real staff retirement statistics.
const STAFF_RETIREMENT_MODEL={minimumAge:62,base:.12,ageStep:.04,careerCap:.08,motivationWeight:.002,unemployedYearWeight:.025};
function staffRetirementReview(db,s,t){
  const rows=(s.career||[]).filter(r=>r.year<db.year),recent=rows.filter(r=>r.year>=db.year-3),series=recent.reduce((v,r)=>v+r.series,0),wins=recent.reduce((v,r)=>v+r.wins,0);
  const exits=(s.history||[]).filter(h=>['release','expire','club_closure'].includes(h.type)),exit=exits.at(-1);
  const unemployedYears=t?0:exit?Math.max(0,db.year-exit.year):0;
  const spans=rows.map(r=>[r.year,r.year+1]);
  const addSpan=(from,to)=>{if(Number.isInteger(from)&&Number.isInteger(to)&&from<to)spans.push([from,Math.min(to,db.year)])};
  const start=Number.isInteger(s.since)?s.since:null,end=t?db.year:exit?.year;
  addSpan(start,end);
  let stint=null;
  for(const h of s.history||[]){
    if(h.from&&['release','expire','club_closure','retire'].includes(h.type))addSpan(h.fromYear,h.year);
    if(h.from&&h.type==='signing')addSpan(h.previousSince,h.year);
    if(['release','expire','club_closure','signing'].includes(h.type)&&stint!==null){addSpan(stint,h.year);stint=null}
    if(h.type==='signing')stint=h.year;
  }
  if(t)addSpan(stint,db.year);
  let careerYears=0,covered=-Infinity;
  for(const [from,to] of spans.sort((a,b)=>a[0]-b[0])){careerYears+=Math.max(0,to-Math.max(from,covered));covered=Math.max(covered,to)}
  const winRate=series?wins/series:null;
  const motivation=Math.round(clamp((s.ambition??50)+(winRate===null?0:(winRate-.5)*40)-unemployedYears*8,0,100));
  const m=STAFF_RETIREMENT_MODEL,probability=s.age<m.minimumAge?0:clamp(m.base+(s.age-m.minimumAge)*m.ageStep+Math.min(m.careerCap,careerYears*.004)+(50-motivation)*m.motivationWeight+unemployedYears*m.unemployedYearWeight,0,1);
  return {year:db.year,age:s.age,careerYears,series,wins,winRate,motivation,unemployedYears,probability};
}
function staffRetirementExplanation(r){return `확인 경력 ${r.careerYears}년 · 최근 현장 ${r.series}시리즈${r.series?' '+Math.round(r.winRate*100)+'% 승률':''} · 활동 동기 ${r.motivation}/100${r.unemployedYears?' · 미고용 '+r.unemployedYears+'년':''}`}
function officialStaffServiceSnapshot(db,a,b,opt){
  const s=opt.metaContext?.season&&staffRegistrationSeason(db,opt.metaContext.season);
  if(!s||opt.practice||opt.replay)return null;
  return Object.fromEntries([a,b].map(id=>[id,competitionStaffMatchRoster(db,s,db.teams[id]).map(x=>({id:x.id,role:x.role}))]));
}
function recordStaffMatchService(db,s,rec){
  // Only series captured by the new engine provide evidence. Never backfill
  // legacy matches using today's employees or infer individual causal credit.
  if(!rec.staffService)return;
  const people=new Map();for(const t of Object.values(db.teams))for(const person of t.staffRoster||[])people.set(person.id,person);
  for(const person of [...(db.staffPool||[]),...(db.staffRetired||[])])people.set(person.id,person);
  for(const [teamId,staff] of Object.entries(rec.staffService))for(const item of staff){
    const person=people.get(item.id);if(!person)continue;
    person.career=person.career||[];
    let row=person.career.find(r=>r.seasonId===s.id&&r.teamId===teamId&&r.role===item.role);
    if(!row){row={year:s.year,seasonId:s.id,compId:s.comp,teamId,role:item.role,series:0,wins:0};person.career.push(row)}
    row.series++;if(rec.winner===teamId)row.wins++;
  }
}

function mHireStaff(db,sid,terms={}){const t=myT(db),found=locateStaff(db,sid);if(!found)return '스태프를 찾을 수 없습니다';const out=commitWorldAction(db,{type:found.team?.id===t.id?'staff.renew':'staff.sign',actor:'manager',teamId:t.id,sid,replaceSid:terms.replaceSid,years:terms.years??2,salary:terms.salary??staffAskingSalary(db,t,found.staff)});return out.ok?found.staff.name+' 계약 완료':out.errors.join(' · ')}
function mReleaseStaff(db,sid){const out=commitWorldAction(db,{type:'staff.release',actor:'manager',teamId:myT(db).id,sid});return out.ok?'스태프 계약 해지 · 비용 '+money(out.fee):out.errors.join(' · ')}
