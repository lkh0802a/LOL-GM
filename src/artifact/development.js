// ===== LOL GM: Player development / training domain =====
// Owns facilities, age curves, match-based seasonal growth and development valuation.
// Long-term role conversion remains isolated in role-conversion.js.

// 나이가 어릴수록 더 많이, 더 빠르게 오른다
function youthMul(age){return age<=18?1.4:age<=20?1.25:age<=22?1.1:age<=24?1:0.85}
function growthCap(age){return age<=18?4.2:age<=20?3.5:age<=22?2.8:age<=24?2.1:age<=26?1.5:1.0}
const FACILITY_TYPES=['training','analysis','recovery','youth','scouting'];
const FACILITY_LABELS={training:'훈련',analysis:'데이터 분석',recovery:'회복',youth:'유소년 육성',scouting:'스카우팅'};
function ensureFacilities(t){
  const legacy=clamp(t.facility||2,1,5),raw=t.facilities||{};
  for(const k of FACILITY_TYPES){
    const fallback=k==='scouting'?1:legacy;
    raw[k]=clamp(raw[k]||fallback,1,5);
  }
  t.facilities=raw;
  t.facility=Math.round(FACILITY_TYPES.reduce((v,k)=>v+raw[k],0)/FACILITY_TYPES.length);
  return raw;
}
function facilityMul(t,age=null){
  if(!t)return 1;
  const f=ensureFacilities(t),young=age==null?1:age<=20?1:age<=23?.6:.14;
  return .9+.055*(f.training-1)+.04*(f.youth-1)*young;
}
function facilityScoutingBonus(t){if(!t)return 0;return (ensureFacilities(t).scouting-1)*.065}
function facilityInvestmentScore(db,t,key){
  const f=ensureFacilities(t),roster=(t.roster||[]).map(id=>db.players[id]).filter(Boolean);
  const kids=roster.length?roster.filter(p=>p.age<=22).length/roster.length:.35;
  const old=roster.length?roster.filter(p=>p.age>=27).length/roster.length:.25;
  const p=t.philosophy||'balanced';
  const fit={training:1+.25*(p==='win-now')+.15*roster.length/8,
    analysis:.85+(p==='win-now'?.4:0)+(p==='superstar'?.15:0),
    recovery:.7+old*.65,
    youth:.7+kids*.95+(p==='youth'?.45:0),
    scouting:.75+(p==='youth'?.35:0)+(p==='cost'?.2:0)}[key]||0;
  const cost=facilityCost(db,t,key);
  return Math.round((fit/(1+.23*(f[key]-1)))/(1+cost/Math.max(5,estRevenue(db,t))*.38)*100)/100;
}
function facilityAnalysisBonus(t){if(!t)return 0;return (ensureFacilities(t).analysis-1)*.012}
function facilityRecoveryBonus(t){if(!t)return 0;return (ensureFacilities(t).recovery-1)*.7}
function facilityCost(db,t,key='training'){const f=ensureFacilities(t),lv=f[key]||1;return Math.round((lv+1)*5*psOf(db,t.region)*(key==='scouting'?.9:key==='youth'?1.12:1)*10)/10}
function facilityUpkeep(db,t){const f=ensureFacilities(t),sum=FACILITY_TYPES.reduce((a,k)=>a+f[k],0);return Math.round(sum*.32*psTeam(db,t)*10)/10}
function facilityBuildDays(level){return 18+level*12}
function facilityReadyDate(start,days){
  const d=new Date((start||'2027-01-01')+'T00:00:00Z');
  d.setUTCDate(d.getUTCDate()+days);
  return d.toISOString().slice(0,10);
}
function upgradeFacility(db,t,key,opt={}){
  if(!FACILITY_TYPES.includes(key))throw new Error('유효하지 않은 시설입니다');
  const f=ensureFacilities(t);
  if(f[key]>=5)throw new Error('이미 최고 단계입니다');
  if((t.facilityProjects||[]).some(p=>p.key===key))throw new Error('이미 증설 중인 시설입니다');
  const cost=facilityCost(db,t,key);
  if(!t.finance||t.finance.cash<cost)throw new Error('시설 증설 자금이 부족합니다');
  payFinancePrepaid(t,'facilityInvestment',cost);
  if(opt.deferDays>0){
    t.facilityProjects=t.facilityProjects||[];
    t.facilityProjects.push({key,from:f[key],to:f[key]+1,cost,started:db.worldDate,
      ready:facilityReadyDate(db.worldDate,opt.deferDays)});
  }else{
    f[key]++;
    t.facility=Math.round(FACILITY_TYPES.reduce((a,k)=>a+f[k],0)/FACILITY_TYPES.length);
  }
  return cost;
}
function advanceFacilityConstruction(db,date=db.worldDate){
  let completed=0;
  for(const t of activeTeams(db)){
    if(!t.facilityProjects?.length)continue;
    const f=ensureFacilities(t),remaining=[];
    for(const p of t.facilityProjects){
      if(!date||date<p.ready){remaining.push(p);continue}
      if(f[p.key]===p.from){f[p.key]=p.to;completed++}
    }
    t.facilityProjects=remaining;
    t.facility=Math.round(FACILITY_TYPES.reduce((a,k)=>a+f[k],0)/FACILITY_TYPES.length);
  }
  return completed;
}

function ageCurve(age,g){
  const T={mechanical:[[19,3],[21,2],[23,0.8],[25,0],[27,-1],[99,-2.2]],laning:[[19,2.5],[22,1.8],[24,0.6],[26,0],[28,-0.8],[99,-1.8]],combat:[[19,2.5],[22,1.8],[24,0.6],[26,0],[28,-0.8],[99,-1.8]],
    macro:[[19,2.5],[23,2],[26,1],[28,0.3],[30,-0.3],[99,-1]],mental:[[19,2.5],[23,2],[26,1],[28,0.3],[30,-0.3],[99,-1]]}[g];
  for(const [a,v] of T)if(age<=a)return v;return -1;
}
function growPlayer(db,p,rng,games,champGames){
  const team=p.team?db.teams[p.team]:null, before=playerOvr(p),dev=ensurePlayerDevelopment(p),
    practiceFactor=Math.max(.82,1-Math.min(280,p.medicalRestDays||0)*.00065);
  const room=clamp((p.pot-before)/10,-0.5,1.5), prof=p.personality.professionalism/100,ageShift=dev.peakAge-25;
  const coach=team?staffDevelopmentFor(team,p.role)/100:0.45, play=clamp(games/30,0,1),
    participated=games>0||Object.values(p.pool||{}).some(pr=>(pr.scrimSeason||0)>0);
  for(const g in ATTR_GROUPS){
    // Base growth depends on age, actual official appearances, staff and facilities.
    const base=ageCurve(p.age-ageShift,g);
    pState(p);
    let d=base>0?base*dev.growthRate*(0.45+room*0.6)*(0.7+0.6*prof)*(0.8+0.4*coach)*(0.65+0.55*play)*trainingGrowthMul(team)*facilityMul(team,p.age)*(0.9+0.2*p.morale/100):base*dev.declineRate*(1.3-0.6*prof);
    if(d>0)d=participated?d*youthMul(p.age)*practiceFactor:0;
    d=Math.min(d,growthCap(p.age)); // 한 시즌 영역별 성장 상한 (어릴수록 높음)
    const ceil=Math.min(99,p.pot+6); // 잠재력 + 6을 넘는 능력치는 더 오르지 않음
    for(const a of ATTR_GROUPS[g]){const noise=rng.normal(0,1.3),v=!participated?(base>=0?p.attrs[a]:Math.min(p.attrs[a],p.attrs[a]+d+noise)):p.attrs[a]+d+noise;p.attrs[a]=Math.round(clamp(d>0&&p.attrs[a]>=ceil?Math.min(v,p.attrs[a]):d>0?Math.min(v,Math.max(ceil,p.attrs[a])):v,20,99))}
  }
  // 실제 공식전·스크림·코칭 근거만 소비한다. 퇴역한 가상 드릴은 새 성장을 만들지 않는다.
  for(const c in champGames)ensureChampionProfile(db,p,c);
  for(const c of Object.keys(p.pool||{})){const n=champGames[c]||0,pr=ensureChampionProfile(db,p,c),learn=championLearningMultiplier(db,p,c),practiceGain=(pr.scrimSeason||0)*.16+(pr.coachingMastery||0),officialGain=Math.min(7,n*.42),gain=Math.min(8,(officialGain+practiceGain)*learn*(p.age<22?1.12:1));
    if(n||practiceGain){pr.mastery=Math.round(clamp(pr.mastery+gain,20,99));pr.experience=Math.round(clamp(pr.experience+n*1.5,0,999));pr.confidence=Math.round(clamp(pr.confidence+rng.normal(n?2:1,3),10,99))}
    else {pr.mastery=Math.round(clamp(pr.mastery-rng.range(0,1.8)*(1-(p.attrs.meta_adaptation||50)/180),20,99));if(pr.mastery<36&&Object.keys(p.pool).length>12)delete p.pool[c]}
    if(p.pool[c]){pr.matchup_knowledge=Math.round(clamp(pr.matchup_knowledge+(n?1.5:practiceGain>0?.35:0)+(pr.coachingResearch||0)*learn,20,99));pr.scrimSeason=0;pr.trainingSeason=0;pr.coachingMastery=0;pr.coachingResearch=0}}
  if(games>0)p.proSeasons=(p.proSeasons||0)+1;p.age++;p.medicalRestDays=0;
  return playerOvr(p)-before;
}
function playerValue(db,p,team){
  const o=playerOvr(p), up=Math.max(0,p.pot-o);
  const w={'win-now':0.1,'youth':0.6,'balanced':0.3,'superstar':0.15,'cost':0.35}[team.philosophy]||0.3;
  return o+up*w-(team.philosophy==='youth'&&p.age>26?2:0);
}

// Daily recovery belongs to the training/development domain.
function dailyRecovery(db){
  for(const t of Object.values(db.teams)){ if(t.active===false)continue;
    const prof=staffProfile(t),rec=4+(prof.recovery-50)/45+facilityRecoveryBonus(t);
    for(const id of t.roster){const p=db.players[id];if(!p)continue;pState(p);
      const plan=medicalPlanFor(db,p),off=plan==='rest'||plan==='rehab';
      p.fatigue=clamp(p.fatigue-rec+(off?0:plan==='light'?.8*.4:.8)-(plan==='rest'?3:plan==='rehab'?1.7:plan==='light'?.9:0),0,100);
      p.condition=clamp(p.condition+2.5+(off?.8:plan==='light'?.1:0),0,100);
      if(off)p.sharpness=clamp(p.sharpness-.28,0,100);
      p.form*=.98}
  }
}
