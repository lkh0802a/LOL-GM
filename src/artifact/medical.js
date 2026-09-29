// ===== LOL GM: player medicine / rare absence and rehabilitation =====
// Medical state is persisted on each player (optional on legacy v15 saves).
// This is a game simulation, not a clinical diagnosis model.

const MEDICAL_LABELS={wrist:'손목',back:'허리',neck:'목',illness:'질병',burnout:'번아웃'};
const MEDICAL_PLAN_LABELS={auto:'자동',normal:'일반 훈련',light:'훈련 감량',rest:'완전 휴식',rehab:'재활'};
// Plans are per-player. The manager may override an owned player's plan;
// rival clubs decide independently, even after a player is transferred.
function medicalPlanFor(db,p){
  if(!p)return 'normal';
  const team=p.team&&db.teams[p.team],owned=team&&parentTeamOf(db,team)?.id===managedTeamId(db);
  const selected=owned?p.medicalPlan:'auto';
  if(['normal','light','rest'].includes(selected))return selected;
  if(selected==='rehab')return p.medical?.daysLeft>0||p.medicalResidual?.daysLeft>0?'rehab':'rest';
  if(p.medical?.daysLeft>0)return 'rehab';
  if(p.medicalPlanDate===db.worldDate&&p.medicalDayPlan)return p.medicalDayPlan;
  if(p.medicalResidual?.daysLeft>0)return 'light';
  if((p.fatigue||0)>=51||(p.condition??96)<74)return 'rest';
  if((p.fatigue||0)>=34||(p.condition??96)<85)return 'light';
  return 'normal';
}
function medicalScrimRest(db,p){const mode=medicalPlanFor(db,p);return mode==='rest'||mode==='rehab'}
function medicalOut(p){return !!(p?.medical&&p.medical.daysLeft>0&&p.medical.out)}
function medicalAvailable(db,t){return (t?.roster||[]).filter(id=>{const p=db.players[id];return p&&!p.retired&&!medicalOut(p)}).length}
function medicalPerformancePenalty(p){
  const m=p?.medical,r=p?.medicalResidual;
  return m?.daysLeft>0&&!m.out?m.penalty||0:r?.daysLeft>0?r.penalty||0:0;
}
// Club-side contract availability risk (0–0.17), NOT a clinical prognosis.
// Temporary absences matter while active; ordinary illness does not create a
// lasting stigma. Only recent physical injuries affect subsequent offers.
// Permanent attribute loss, if any, is already reflected in the player's OVR.
function medicalContractRisk(db,p){
  if(!p)return 0;
  const date=db.worldDate&&db.worldDate.slice(0,4)>=String(db.year)?
    db.worldDate:db.year+'-01-07';
  const now=Date.parse(date+'T00:00:00Z');
  const active=p.medical?.daysLeft>0?p.medical:null;
  let risk=0,severeHistory=0;
  if(active){
    if(active.kind==='injury')
      risk+=active.severity==='severe'?(active.out?.07:.016):
        active.severity==='moderate'?(active.out?.035:.012):.006;
    else risk+=active.kind==='burnout'?(active.out?.03:.012):.006;
    if(active.out)risk+=Math.min(.025,active.daysLeft*.00045);
  }else if(p.medicalResidual?.daysLeft>0)
    risk+=Math.min(.012,p.medicalResidual.daysLeft*.0004);
  for(const e of p.careerEvents||[]){
    if(e.type!=='medical_start'||e.kind!=='injury'||!e.date||
      !['severe','moderate'].includes(e.severity))continue;
    // The active incident is already represented above, not counted twice.
    if(active&&e.date===active.started&&e.kind===active.kind)continue;
    const elapsed=(now-Date.parse(e.date+'T00:00:00Z'))/86400000;
    if(!Number.isFinite(elapsed)||elapsed<0||elapsed>=730)continue;
    const weight=1-elapsed/730;
    if(e.severity==='severe'){risk+=.026*weight;severeHistory+=weight}
    else risk+=.008*weight;
  }
  // Repeated significant incidents in the same period concern clubs more
  // than a single recovered injury; their impact also expires with time.
  risk+=Math.max(0,severeHistory-1)*.035;
  return Math.round(clamp(risk,0,.17)*1000)/1000;
}
function medicalSummary(p){
  const m=p?.medical,r=p?.medicalResidual;
  if(m?.daysLeft>0)return (MEDICAL_LABELS[m.site]||MEDICAL_LABELS[m.kind]||'건강 문제')+
    ' · '+Math.ceil(m.daysLeft)+'일 예상'+(m.out?' · 출전 불가':' · 제한적 출전');
  if(r?.daysLeft>0)return '복귀 후 관리 · '+Math.ceil(r.daysLeft)+'일';
  return '정상';
}
function medicalCare(db,p){
  const t=p.team&&db.teams[p.team];
  if(!t)return 0.75;
  const recovery=staffProfile(t).recovery,fac=facilityRecoveryBonus(t),tr=trainingIntensity(t);
  const plan=medicalPlanFor(db,p);
  return clamp(.88+(recovery-50)/225+fac*.05+(tr.growth<1?.07:tr.growth>1?-.13:0)-Math.max(0,(p.fatigue||0)-45)/330+
    (plan==='rehab'?.12:plan==='rest'?.065:plan==='light'?.025:0),.65,1.42);
}
function medicalExposure(db,p,kind='scrim',games=1){
  if(!p||p.retired)return;
  p.medicalLoad=Math.round(clamp((p.medicalLoad||0)+games*(kind==='official'?1.55:.65),0,38)*100)/100;
}
// Use the existing atomic organization roster-plan command. A player can only
// be moved if the other active squad still fields five healthy competitors.
function medicalEmergencyCallup(db,t,injured){
  if(!t||medicalAvailable(db,t)!==5)return null;
  const rules=rosterRulesForTeam(db,t),cap=t.parent?rules.reserveTeamMax:rules.firstTeamMax;
  if((t.roster||[]).length>=cap)return null;
  const from=t.parent?[db.teams[t.parent]]:reserveTeamsOf(db,t);
  for(const source of from){
    if(!source||medicalAvailable(db,source)<=5)continue;
    const candidates=(source.roster||[]).map(id=>db.players[id])
      .filter(p=>p&&!p.retired&&!medicalOut(p)&&p.team===source.id&&
        !localRegistrationError(db,t,p))
      .sort((a,b)=>lineupRoleScore(b,injured.role)-lineupRoleScore(a,injured.role));
    for(const replacement of candidates){
      const plan=rosterPlanState(db,t);
      if(!plan)break;
      plan.assignments[replacement.id]=t.id;
      const result=commitWorldAction(db,{type:'roster.plan',parentId:plan.parentId,
        assignments:plan.assignments,actor:'system'});
      if(!result.ok)continue;
      recordPlayerEvent(replacement,'medical_callup',db.year,
        {date:db.worldDate,for:injured.id,from:source.id,to:t.id});
      if(t.id===managedTeamId(db))news(db,
        injured.name+' 건강 문제로 '+replacement.name+' 긴급 등록 ('+source.short+' → '+t.short+')');
      return replacement;
    }
  }
  return null;
}
// Reserve registration has priority. If a club has no spare academy player,
// try one legal season-long FA contract through the shared atomic transaction.
// A cash-strapped club or full roster cannot bypass its spending/slot limits.
function medicalEmergencyFASigning(db,t,injured){
  if(!t||medicalAvailable(db,t)!==5)return null;
  const rules=rosterRulesForTeam(db,t),cap=t.parent?rules.reserveTeamMax:rules.firstTeamMax;
  if((t.roster||[]).length>=cap||!t.finance||t.finance.cash<=0)return null;
  const parent=parentTeamOf(db,t);
  if(reserveTeamsOf(db,parent).length&&organizationRoster(db,parent).length>=rules.integratedMax)return null;
  const budget=salaryBudget(db,t)-payroll(db,t);
  if(!Number.isFinite(budget)||budget<=0)return null;
  const choices=Object.values(db.players).filter(p=>
    p&&!p.retired&&!p.team&&!medicalOut(p)&&!(p.medical?.daysLeft>0)&&
    !localRegistrationError(db,t,p))
    .map(p=>({p,salary:asking(db,p,t.region)}))
    .filter(x=>Number.isFinite(x.salary)&&x.salary<=budget+1e-8&&x.salary<=t.finance.cash*2)
    .sort((a,b)=>{
      const fit=x=>lineupRoleScore(x.p,injured.role)-
        Math.min(4,x.salary/Math.max(.1,psTeam(db,t)))*.12;
      return fit(b)-fit(a)||a.salary-b.salary||a.p.id.localeCompare(b.p.id);
    });
  for(const {p,salary} of choices){
    const result=commitWorldAction(db,{type:'player.sign',pid:p.id,teamId:t.id,
      salary,years:1,terms:{promisedRole:'competition'},kind:'fa',actor:'system'});
    if(!result.ok)continue;
    recordPlayerEvent(p,'medical_emergency_fa',db.year,
      {date:db.worldDate,for:injured.id,to:t.id,salary,until:p.contract.until});
    if(parentTeamOf(db,t)?.id===managedTeamId(db))news(db,
      injured.name+'의 결장에 대비해 FA '+p.name+' 긴급 영입 ('+t.short+')');
    return p;
  }
  return null;
}
// Explicit entry point allows deterministic validation of medical severity and
// the legal five-player floor, without rolling arbitrary real-world odds.
function startMedicalEvent(db,p,kind,level,days,date=db.worldDate,rng=null){
  if(!p||p.retired||p.medical?.daysLeft>0)return null;
  if(!['injury','illness','burnout'].includes(kind))return null;
  const roll=rng||new RNG((db.world?.seed||'world')+'|'+p.id+'|'+date,'medical-event');
  const site=kind==='injury'?roll.pick(['wrist','back','neck']):kind;
  const proposedOut=level!=='minor';
  const t=p.team&&db.teams[p.team];
  if(proposedOut&&t&&medicalAvailable(db,t)===5)
    medicalEmergencyCallup(db,t,p)||medicalEmergencyFASigning(db,t,p);
  const enough=t&&medicalAvailable(db,t)>5;
  const out=!!(proposedOut&&enough);
  const severity=out?level:'minor';
  const penalty=severity==='severe'?.14:severity==='moderate'?.09:kind==='illness'?.045:kind==='burnout'?.065:.055;
  const duration=Math.max(2,Math.round(days));
  p.medical={kind,site,severity,out,penalty,daysLeft:duration,
    started:date,lastTick:date,plannedDays:duration};
  // Registered emergencies and ordinary bench absences both need a usable
  // lineup immediately, not only when a match later calls starterFor().
  if(out&&t)initializeDepthChart(db,t,false);
  p.condition=clamp((p.condition??96)-(out?9:5),45,100);
  recordPlayerEvent(p,'medical_start',db.year,{kind,site,severity,out,date,days:duration,team:p.team||null});
  if(t?.id===managedTeamId(db))news(db,p.name+' · '+medicalSummary(p));
  return p.medical;
}
function medicalScar(db,p,m,date){
  if(m.kind!=='injury'||m.severity!=='severe')return;
  const t=p.team&&db.teams[p.team],care=t?staffProfile(t).recovery:45,age=Math.max(0,(p.age||22)-25);
  const chance=clamp(.018+age*.003+(60-care)*.0005,.006,.09);
  const rng=new RNG((db.world?.seed||'world')+'|'+p.id+'|'+m.started,'medical-scar');
  if(!rng.chance(chance))return;
  const key=m.site==='wrist'?'precision':m.site==='back'?'positioning':'reaction';
  if(!p.attrs||typeof p.attrs[key]!=='number')return;
  p.attrs[key]=Math.max(20,p.attrs[key]-1);
  recordPlayerEvent(p,'medical_scar',db.year,{kind:m.kind,site:m.site,attribute:key,date,loss:1});
}
function medicalHeal(db,p,elapsed,date){
  const m=p.medical;
  if(m?.daysLeft>0){
    const care=medicalCare(db,p),unused=Math.max(0,elapsed-m.daysLeft/care);
    m.daysLeft-=elapsed*care;
    m.lastTick=date;
    if(m.daysLeft<=0){
      medicalScar(db,p,m,date);
      p.medicalResidual={daysLeft:Math.max(0,(m.kind==='injury'?(m.severity==='severe'?24:12):m.kind==='burnout'?16:4)-unused),
        penalty:m.kind==='injury'?.026:m.kind==='burnout'?.018:.012,lastTick:date};
      p.medical=null;
      recordPlayerEvent(p,'medical_return',db.year,{kind:m.kind,site:m.site,date});
    }
  }else if(p.medicalResidual?.daysLeft>0){
    p.medicalResidual.daysLeft=Math.max(0,p.medicalResidual.daysLeft-elapsed);
    p.medicalResidual.lastTick=date;
    if(!p.medicalResidual.daysLeft)p.medicalResidual=null;
  }
}
// Daily event probabilities used by the live medical tick and multi-seed
// balance audit. These are per eligible player-day, NOT annual injury rates.
// Rest lowers overuse risk without changing ordinary infectious illness.
function medicalIncidentOdds(p,t,load,plan){
  const rest=plan==='rest'||plan==='rehab',high=t.training?.intensity==='high'&&!rest&&plan!=='light';
  const injury=clamp(.000065*(1+load/22)*(1+Math.max(0,p.age-28)*.035)*
    (high?1.25:1)*(1+Math.max(0,p.fatigue-45)/95)*
    (rest?.57:plan==='light'?.83:1),0,.00042);
  const illness=.00020*(1+((p.condition??96)<70?.32:0));
  const burnout=(p.medicalOverloadDays||0)>=14?
    clamp(.00008*((p.medicalOverloadDays||0)-12)/18*(rest?.45:1),0,.00032):0;
  return {injury,illness,burnout};
}
function medicalDailyTick(db,date){
  // Snapshot participants: an emergency organization callup can move a player
  // between the two squads while this day's health lottery is running.
  const participants=activeTeams(db).flatMap(t=>(t.roster||[]).map(id=>id));
  const seen=new Set();
  for(const id of participants){
      if(seen.has(id))continue;
      seen.add(id);
      const p=db.players[id];if(!p||p.retired)continue;
      const t=p.team&&db.teams[p.team];if(!t)continue;
      pState(p);
      const rng=new RNG((db.world?.seed||'world')+'|'+date+'|'+p.id,'medical');
      const load=p.medicalLoad||0;
      const plan=medicalPlanFor(db,p),rest=medicalScrimRest(db,p);
      p.medicalDayPlan=plan;p.medicalPlanDate=date;
      const high=t.training?.intensity==='high'&&!rest&&plan!=='light',care=medicalCare(db,p);
      p.medicalLoad=Math.round(clamp(load*(rest?.73:plan==='light'?.82:.86)+(rest?0:high?.35:plan==='light'?.02:.08),0,38)*100)/100;
      p.medicalOverloadDays=load>=9&&!rest&&(high||p.fatigue>=38)?
        Math.min(120,(p.medicalOverloadDays||0)+1):Math.max(0,(p.medicalOverloadDays||0)-(rest?4:2));
      if(rest)p.medicalRestDays=Math.min(366,(p.medicalRestDays||0)+1);
      if(p.medical?.daysLeft>0||p.medicalResidual?.daysLeft>0)medicalHeal(db,p,1,date);
      if(p.medical?.daysLeft>0)continue;
      if(p.medicalResidual?.daysLeft>0&&rng.chance(.98))continue;
      const {injury,illness,burnout}=medicalIncidentOdds(p,t,load,plan);
      const draw=rng.next();let kind;
      if(draw<injury)kind='injury';
      else if(draw<injury+illness)kind='illness';
      else if(draw<injury+illness+burnout)kind='burnout';
      if(!kind)continue;
      const severity=kind==='illness'?(rng.chance(.22)?'moderate':'minor'):
        kind==='burnout'?(rng.chance(.62)?'moderate':'minor'):
        rng.chance(.10)?'severe':rng.chance(.38)?'moderate':'minor';
      const duration=kind==='illness'?rng.int(3,7):
        kind==='burnout'?rng.int(14,28):
        severity==='severe'?rng.int(22,50):severity==='moderate'?rng.int(7,17):rng.int(3,8);
      startMedicalEvent(db,p,kind,severity,Math.ceil(duration/clamp(care,.85,1.18)),date,rng);
  }
}
function medicalOffseasonRecovery(db,date){
  // Season progression can jump across a real offseason. Existing absences
  // must not remain frozen until the next competitive fixture.
  for(const p of Object.values(db.players)){
    if(!p.medical?.daysLeft&&!p.medicalResidual?.daysLeft)continue;
    const from=p.medical?.lastTick||p.medicalResidual?.lastTick||db.worldDate;
    const elapsed=Math.max(0,Math.floor((Date.parse(date+'T00:00:00Z')-
      Date.parse(from+'T00:00:00Z'))/86400000));
    if(elapsed)medicalHeal(db,p,elapsed,date);
  }
}
