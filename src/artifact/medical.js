// ===== LOL GM: player medicine / rare absence and rehabilitation =====
// Medical state is persisted on each player (optional on legacy v15 saves).
// This is a game simulation, not a clinical diagnosis model.

const MEDICAL_LABELS={wrist:'손목',back:'허리',neck:'목',illness:'질병',burnout:'번아웃'};
function medicalOut(p){return !!(p?.medical&&p.medical.daysLeft>0&&p.medical.out)}
function medicalAvailable(db,t){return (t?.roster||[]).filter(id=>{const p=db.players[id];return p&&!p.retired&&!medicalOut(p)}).length}
function medicalPerformancePenalty(p){
  const m=p?.medical,r=p?.medicalResidual;
  return m?.daysLeft>0&&!m.out?m.penalty||0:r?.daysLeft>0?r.penalty||0:0;
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
  return clamp(.88+(recovery-50)/225+fac*.05+(tr.growth<1?.07:tr.growth>1?-.13:0)-Math.max(0,(p.fatigue||0)-45)/330,.65,1.32);
}
function medicalExposure(db,p,kind='scrim',games=1){
  if(!p||p.retired)return;
  p.medicalLoad=Math.round(clamp((p.medicalLoad||0)+games*(kind==='official'?1.55:.65),0,38)*100)/100;
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
  const enough=t&&medicalAvailable(db,t)>5;
  const out=!!(proposedOut&&enough);
  const severity=out?level:'minor';
  const penalty=severity==='severe'?.14:severity==='moderate'?.09:kind==='illness'?.045:kind==='burnout'?.065:.055;
  const duration=Math.max(2,Math.round(days));
  p.medical={kind,site,severity,out,penalty,daysLeft:duration,
    started:date,lastTick:date,plannedDays:duration};
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
function medicalDailyTick(db,date){
  for(const t of activeTeams(db)){
    for(const id of t.roster||[]){
      const p=db.players[id];if(!p||p.retired)continue;
      pState(p);
      const rng=new RNG((db.world?.seed||'world')+'|'+date+'|'+p.id,'medical');
      const load=p.medicalLoad||0;
      const high=t.training?.intensity==='high',care=medicalCare(db,p);
      p.medicalLoad=Math.round(clamp(load*.86+(high?.35:.08),0,38)*100)/100;
      p.medicalOverloadDays=load>=9&&(high||p.fatigue>=38)?
        Math.min(120,(p.medicalOverloadDays||0)+1):Math.max(0,(p.medicalOverloadDays||0)-2);
      if(p.medical?.daysLeft>0||p.medicalResidual?.daysLeft>0)medicalHeal(db,p,1,date);
      if(p.medical?.daysLeft>0)continue;
      if(p.medicalResidual?.daysLeft>0&&rng.chance(.98))continue;
      const injury=clamp(.000065*(1+load/22)*(1+Math.max(0,p.age-28)*.035)*
        (high?1.25:1)*(1+Math.max(0,p.fatigue-45)/95),0,.00042);
      const illness=.00020*(1+(p.condition<70?.32:0));
      const burnout=(p.medicalOverloadDays||0)>=14?
        clamp(.00008*((p.medicalOverloadDays||0)-12)/18,0,.00032):0;
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
