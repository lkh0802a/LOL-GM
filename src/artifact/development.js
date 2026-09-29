// ===== LOL GM: Player development / training domain =====
// Owns training intensity, facilities, age curves, seasonal growth and development valuation.
// Long-term role conversion remains isolated in role-conversion.js.

const TRAIN_POINTS=100;

// 나이가 어릴수록 더 많이, 더 빠르게 오른다
function youthMul(age){return age<=18?1.4:age<=20?1.25:age<=22?1.1:age<=24?1:0.85}
function growthCap(age){return age<=18?4.2:age<=20?3.5:age<=22?2.8:age<=24?2.1:age<=26?1.5:1.0}
function defaultTraining(){return {mechanical:20,laning:20,combat:20,macro:20,mental:20,intensity:'normal'}}
function trainingIntensity(t){const x=t?.training?.intensity||'normal';return x==='light'?{growth:.9,fatigue:.45,condition:.25}:x==='high'?{growth:1.08,fatigue:1.35,condition:-.35}:{growth:1,fatigue:.8,condition:0}}
function aiManageTraining(db,t){if(!t||t.id===managedTeamId(db))return;t.training=t.training||defaultTraining();t.training.intensity=trainingRecommendation(db,t).intensity}
function ensureFacilities(t){const legacy=clamp(t.facility||2,1,5);t.facilities=t.facilities||{training:legacy,analysis:legacy,recovery:legacy,youth:legacy};for(const k of ['training','analysis','recovery','youth'])t.facilities[k]=clamp(t.facilities[k]||legacy,1,5);t.facility=Math.round((t.facilities.training+t.facilities.analysis+t.facilities.recovery+t.facilities.youth)/4);return t.facilities}
function facilityMul(t){if(!t)return 1;const f=ensureFacilities(t);return .9+.055*(f.training-1)+.02*(f.youth-1)}
function facilityAnalysisBonus(t){if(!t)return 0;return (ensureFacilities(t).analysis-1)*.012}
function facilityRecoveryBonus(t){if(!t)return 0;return (ensureFacilities(t).recovery-1)*.7}
function facilityCost(db,t,key='training'){const f=ensureFacilities(t),lv=f[key]||1;return Math.round((lv+1)*5*psOf(db,t.region)*10)/10}
function facilityUpkeep(db,t){const f=ensureFacilities(t),sum=Object.values(f).reduce((a,b)=>a+b,0);return Math.round(sum*.32*psTeam(db,t)*10)/10}
function facilityBuildDays(level){return 18+level*12}
function facilityReadyDate(start,days){
  const d=new Date((start||'2027-01-01')+'T00:00:00Z');
  d.setUTCDate(d.getUTCDate()+days);
  return d.toISOString().slice(0,10);
}
function upgradeFacility(db,t,key,opt={}){
  if(!['training','analysis','recovery','youth'].includes(key))throw new Error('유효하지 않은 시설입니다');
  const f=ensureFacilities(t);
  if(f[key]>=5)throw new Error('이미 최고 단계입니다');
  if((t.facilityProjects||[]).some(p=>p.key===key))throw new Error('이미 증설 중인 시설입니다');
  const cost=facilityCost(db,t,key);
  if(!t.finance||t.finance.cash<cost)throw new Error('시설 증설 자금이 부족합니다');
  t.finance.cash=Math.round((t.finance.cash-cost)*10)/10;
  recordFinancePrepaid(t,'facilityInvestment',cost);
  if(opt.deferDays>0){
    t.facilityProjects=t.facilityProjects||[];
    t.facilityProjects.push({key,from:f[key],to:f[key]+1,cost,started:db.worldDate,
      ready:facilityReadyDate(db.worldDate,opt.deferDays)});
  }else{
    f[key]++;
    t.facility=Math.round(Object.values(f).reduce((a,b)=>a+b,0)/4);
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
    t.facility=Math.round(Object.values(f).reduce((a,b)=>a+b,0)/4);
  }
  return completed;
}

function ageCurve(age,g){
  const T={mechanical:[[19,3],[21,2],[23,0.8],[25,0],[27,-1],[99,-2.2]],laning:[[19,2.5],[22,1.8],[24,0.6],[26,0],[28,-0.8],[99,-1.8]],combat:[[19,2.5],[22,1.8],[24,0.6],[26,0],[28,-0.8],[99,-1.8]],
    macro:[[19,2.5],[23,2],[26,1],[28,0.3],[30,-0.3],[99,-1]],mental:[[19,2.5],[23,2],[26,1],[28,0.3],[30,-0.3],[99,-1]]}[g];
  for(const [a,v] of T)if(age<=a)return v;return -1;
}
function growPlayer(db,p,rng,games,champGames){
  const team=p.team?db.teams[p.team]:null, before=playerOvr(p),dev=ensurePlayerDevelopment(p);
  const room=clamp((p.pot-before)/10,-0.5,1.5), prof=p.personality.professionalism/100,ageShift=dev.peakAge-25;
  const coach=team?staffDevelopmentFor(team,p.role)/100:0.45, play=clamp(games/30,0,1);
  const tr=team?team.training:defaultTraining(), intensity=trainingIntensity(team),conversionMul=roleConversionGrowthMultiplier(p),tsum=['mechanical','laning','combat','macro','mental'].reduce((a,k)=>a+(+tr[k]||0),0)||1;
  for(const g in ATTR_GROUPS){
    // 훈련 포인트는 총 100점 한도: 배분하지 않은 포인트는 버려진다 (나눠 쓰는 만큼만 효과)
    const base=ageCurve(p.age-ageShift,g), train=team?(Math.min(TRAIN_POINTS,tr[g])/TRAIN_POINTS*5-1)*0.9:-0.3;
    pState(p);
    let d=base>0?base*dev.growthRate*(0.45+room*0.6)*(0.7+0.6*prof)*(0.8+0.4*coach)*(0.65+0.55*play)*trainingGrowthMul(team)*facilityMul(team)*intensity.growth*(0.9+0.2*p.morale/100):base*dev.declineRate*(1.3-0.6*prof);
    d+=train*(base>0?1:0.5);
    if(d>0)d*=youthMul(p.age)*conversionMul;
    d=Math.min(d,growthCap(p.age)); // 한 시즌 영역별 성장 상한 (어릴수록 높음)
    const ceil=Math.min(99,p.pot+6); // 잠재력 + 6을 넘는 능력치는 더 오르지 않음
    for(const a of ATTR_GROUPS[g]){const v=p.attrs[a]+d+rng.normal(0,1.3);p.attrs[a]=Math.round(clamp(d>0&&p.attrs[a]>=ceil?Math.min(v,p.attrs[a]):d>0?Math.min(v,Math.max(ceil,p.attrs[a])):v,20,99))}
  }
  // 챔피언 폭: 공식전 + 스크림 + 훈련 + 난이도 + 학습 능력을 함께 반영
  for(const c in champGames)ensureChampionProfile(db,p,c);
  if(team&&p.pool){const practice=Math.max(2,Math.round((tr.combat+tr.mental)/12*(.7+coach*.5)));Object.entries(p.pool).sort((a,b)=>b[1].mastery-a[1].mastery).slice(0,6).forEach(([c])=>practiceChampion(db,p,c,'training',practice))}
  for(const c of Object.keys(p.pool||{})){const n=champGames[c]||0,pr=ensureChampionProfile(db,p,c),learn=championLearningMultiplier(db,p,c),practiceGain=(pr.scrimSeason||0)*.16+(pr.trainingSeason||0)*.09,officialGain=Math.min(7,n*.42),gain=Math.min(8,(officialGain+practiceGain)*learn*(p.age<22?1.12:1));
    if(n||practiceGain){pr.mastery=Math.round(clamp(pr.mastery+gain,20,99));pr.experience=Math.round(clamp(pr.experience+n*1.5,0,999));pr.confidence=Math.round(clamp(pr.confidence+rng.normal(n?2:1,3),10,99))}
    else {pr.mastery=Math.round(clamp(pr.mastery-rng.range(0,1.8)*(1-(p.attrs.meta_adaptation||50)/180),20,99));if(pr.mastery<36&&Object.keys(p.pool).length>12)delete p.pool[c]}
    if(p.pool[c]){pr.matchup_knowledge=Math.round(clamp(pr.matchup_knowledge+(n?1.5:.35),20,99));pr.scrimSeason=0;pr.trainingSeason=0}}
  if(games>0)p.proSeasons=(p.proSeasons||0)+1;p.age++;
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
    const ti=trainingIntensity(t);for(const id of t.roster){const p=db.players[id];if(!p)continue;pState(p);p.fatigue=clamp(p.fatigue-rec+ti.fatigue,0,100);p.condition=clamp(p.condition+2.5+ti.condition,0,100);p.form*=.98}
  }
}
