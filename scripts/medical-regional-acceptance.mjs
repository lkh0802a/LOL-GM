// D02-B9/B10.1: complete multi-region (2/3 split) calendar and cross-region
// cup medical audit. B10.1 measures actual overload/auto-rest exposure without
// manufacturing medical incidents or tuning their odds.
// Do not interpret rare simulated clinical events as population prevalence.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';

const root=resolve(import.meta.dirname,'..','src','artifact');
let source='';
for(const file of ENGINE_MODULES)source+=await readFile(resolve(root,file),'utf8')+'\n';
source+=String.raw`(()=>{
  const assert=(test,message)=>{if(!test)throw new Error('D02_REGIONAL_MEDICAL '+message)};
  const cases=['injury','illness','burnout'],seedNames=[
    'd02-b9-calendar-NA','d02-b9-calendar-EU'
  ],rows=[];
  const inc=()=>({days:0,injury:0,illness:0,burnout:0,unavailableDays:0});
  // Test-only observer: intercept the real lottery's exact numeric odds after
  // dailyRecovery but before scrims. Preserve the same probability object and
  // RNG calls; a post-day recomputation would use changed player fatigue.
  const realIncidentOdds=medicalIncidentOdds;
  let sampledOdds=null;
  medicalIncidentOdds=(...args)=>{
    const odds=realIncidentOdds(...args);
    if(sampledOdds)sampledOdds.set(args[0].id,odds.burnout);
    return odds;
  };
  const exposure=()=>({playerDays:0,healthyDays:0,load9Days:0,
    overload14Days:0,overload20Days:0,overload45Days:0,
    sameDayRegistrations:0,eligibleBurnoutDays:0,modeledBurnoutEvents:0,peakLoad:0,
    peakOverloadDays:0,normal:0,light:0,rest:0,rehab:0});
  // Probabilities here are sums of the *same* live model's per-player daily
  // odds among players healthy before the day's tick (no ongoing rehab).
  // They are risk exposure diagnostics, not a prediction of observed cases.
  const trackExposure=(row,p,prior,date,burnoutOdds)=>{
    row.playerDays++;
    const load=p.medicalLoad||0,overload=p.medicalOverloadDays||0,
      plan=p.medicalPlanDate===date?p.medicalDayPlan:medicalPlanFor(db,p);
    assert(['normal','light','rest','rehab'].includes(plan),
      'live medical daily plan was not recorded '+date+' '+p.id);
    row[plan]++;
    if(prior.sameDayRegistration)row.sameDayRegistrations++;
    row.peakLoad=Math.max(row.peakLoad,load);
    row.peakOverloadDays=Math.max(row.peakOverloadDays,overload);
    if(prior.load>=9)row.load9Days++;
    if(overload>=14)row.overload14Days++;
    if(overload>=20)row.overload20Days++;
    if(overload>=45)row.overload45Days++;
    if(!prior.healthy)return;
    row.healthyDays++;
    // This is the genuine eligibility-gated odds from the live day's
    // medical lottery, not a replay or a post-scrim approximation.
    assert(Number.isFinite(burnoutOdds)&&burnoutOdds>=0&&burnoutOdds<=.00032,
      'captured live burnout probability is out of range');
    if(burnoutOdds>0)row.eligibleBurnoutDays++;
    row.modeledBurnoutEvents+=burnoutOdds;
  };
  const grand={days:0,official:0,scrimBlocks:0,internationalMatches:0,
    events:inc(),byRegion:{NA:inc(),EU:inc()},
    byCare:{supported:inc(),basic:inc()},
    byAge:{young:inc(),prime:inc(),veteran:inc()},
    byIntensity:{light:inc(),normal:inc(),high:inc()},
    planDays:{normal:0,light:0,rest:0,rehab:0},
    burnoutExposure:exposure(),byOperator:{manager:exposure(),ai:exposure()},
    peakLoad:0,saves:0};
  const add=(row,p,evt)=>{
    row.days++;
    if(medicalOut(p))row.unavailableDays++;
    if(evt&&cases.includes(evt.kind))row[evt.kind]++;
  };
  const ageGroup=p=>p.age>=29?'veteran':p.age>=23?'prime':'young';
  for(let k=0;k<seedNames.length;k++){
    const seed=seedNames[k],cfg=defaultWorldConfig();
    cfg.regions=[
      regionCfg('NA',{teams:10,splits:3,legs:2,regularBo:1,
        playoffBo:1,playoffTake:4,format:'rr_po',
        div2:false,system:'franchise'}),
      regionCfg('EU',{teams:10,splits:2,legs:2,regularBo:1,
        playoffBo:1,playoffTake:4,format:'rr_po',
        div2:false,system:'franchise'})
    ];
    // An actual tournament format and selection policy. Its roster comprises
    // clubs from BOTH regions; no manually fabricated finalist or match.
    const cup=INTL_PRESETS.find(x=>x.id==='WESTERN_CUP');
    assert(!!cup,'cross-region competition preset missing');
    cfg.internationals=[{...cup,entry:'slots',ratio:1}];
    cfg.subs=1;cfg.changes='none';
    let db=buildWorld(cfg);
    const owner=activeTeams(db,k===0?'NA':'EU',1)[0];
    startCareer(db,owner.id,seed);
    autoBuildInitialSquad(db,owner,new RNG(seed+'-manager','initial'),6);
    finalizeInitialRosters(db);
    assert(db.world.phase==='season'&&activeTeams(db).length===20,
      'initial two-region roster construction failed');
    // Deterministic cohort design: both regions contain supported and basic
    // medical facilities, and a small legitimate veteran population. This is
    // not a claim that facilities and age are causally comparable here.
    for(const region of ['NA','EU']){
      const clubs=activeTeams(db,region,1).sort((a,b)=>a.id.localeCompare(b.id));
      for(let j=0;j<clubs.length;j++){
        const t=clubs[j],supported=j%2===0,f=ensureFacilities(t);
        f.recovery=supported?5:1;
        const med=staffByRole(t,'performanceCoach')[0];
        if(med)med.rating=supported?88:42;
        if(j%3===0){
          const veteran=db.players[t.roster[0]];
          veteran.age=Math.max(29,veteran.age);
        }
      }
    }
    // Only the owned club's explicitly selected training intensity can be
    // pinned; rival clubs retain the live AI recommendation each day.
    const managedIntensity=k===0?'high':'light';
    db.teams[owner.id].training.intensity=managedIntensity;
    const started=db.worldDate;
    let lastDate=started,days=0,official=0,blocks=0,ints=0,saves=0,
      dailyRegions={NA:0,EU:0},maxLoad=0,seasonEvents=inc(),
      seasonExposure=exposure(),scheduledIntervals=0,
      sawCup=false,regionSplits={NA:0,EU:0};
    let savedDuringLeague=false,savedDuringInternational=false;
    while(db.world.phase==='season'&&days<520){
      const date=nextCalendarDate(db);
      if(date===null){advanceStep(db);continue}
      assert(!lastDate||date>=lastDate,
        'calendar moved backwards within a multistage season');
      // One pre-tick snapshot, taken before recovery, AI rest decisions and
      // the medical lottery. A player is counted exactly once per roster-day.
      const before=new Map();
      for(const t of activeTeams(db))for(const id of t.roster){
        const p=db.players[id];
        if(!p||p.retired)continue;
        assert(!before.has(id),'the same player is registered in two squads');
        before.set(id,{load:p.medicalLoad||0,
          healthy:!(p.medical?.daysLeft>0||p.medicalResidual?.daysLeft>0)});
      }
      sampledOdds=new Map();
      const played=applyWorldDailyEffects(db,date);
      const dailyOdds=sampledOdds;
      sampledOdds=null;
      assert(played&&db.world.lastDailyTick===date,
        'real daily medical and scrim tick duplicated or skipped');
      lastDate=date;days++;
      const participants=activeTeams(db);
      for(const t of participants){
        const eligibleCare=ensureFacilities(t).recovery>=4?'supported':'basic',
          intensity=t.training?.intensity||'normal';
        assert(['normal','high','light'].includes(intensity),'invalid actual training mode');
        dailyRegions[t.region]++;
        for(const id of t.roster){
          const p=db.players[id];
          if(!p||p.retired)continue;
          const event=(p.careerEvents||[]).at(-1);
          const evt=event?.type==='medical_start'&&event.date===date?event:null;
          const careRow=grand.byCare[eligibleCare],
            ageRow=grand.byAge[ageGroup(p)],
            trainRow=grand.byIntensity[intensity];
          for(const row of [grand.events,grand.byRegion[t.region],
            careRow,ageRow,trainRow,seasonEvents])add(row,p,evt);
          const plan=p.medicalPlanDate===date?p.medicalDayPlan:medicalPlanFor(db,p);
          if(grand.planDays[plan]!==undefined)grand.planDays[plan]++;
          // An emergency FA may be legally registered during this very tick.
          // Count the athlete-day, but never invent a preceding lottery draw.
          const prior=before.get(p.id)||{load:0,healthy:false,sameDayRegistration:true};
          for(const row of [grand.burnoutExposure,seasonExposure,
            grand.byOperator[parentTeamOf(db,t)?.id===owner.id?'manager':'ai']])
            trackExposure(row,p,prior,date,dailyOdds.get(p.id)||0);
          if(p.medicalLoad>maxLoad)maxLoad=p.medicalLoad;
          if(p.medicalLoad>grand.peakLoad)grand.peakLoad=p.medicalLoad;
        }
        // Actual scrim data contains daily blocks, unlike injected synthetic
        // risk exposure in the D02-B6 scenario.
        blocks+=(t.scrimLog||[]).filter(x=>x.date===date).length;
      }
      if(date===nextDate(db)){
        for(const s of activeSeasons(db).filter(s=>s.days[s.cur].date===date)){
          const current=s.days[s.cur],count=current.matches.filter(m=>!m.res).length,
            intl=!!db.competitions[s.comp]?.international;
          const played=playDay(db,s);
          assert(played?.day===current,'real competition writer did not advance');
          official+=count;
          if(intl){ints+=count;sawCup=true}
        }
        if(!activeSeasons(db).length)advanceStep(db);
      }
      if(days%27===0){
        assert(participants.every(t=>medicalAvailable(db,t)>=5),
          'multi-region club lacks five eligible players');
        assert(!rosterIntegrityErrors(db).length,
          'real calendar violated team/player registration integrity');
        scheduledIntervals++;
      }
      const activeCup=activeSeasons(db).some(s=>
        db.competitions[s.comp]?.international);
      const shouldSave=(!savedDuringLeague&&days>=32)||
        (!savedDuringInternational&&activeCup);
      if(shouldSave){
        const before=db.world.lastDailyTick,packed=packDB(db);
        db=unpackDB(packed);
        assert(before===db.world.lastDailyTick&&
          !applyWorldDailyEffects(db,date),
          'save roundtrip replayed a real calendar medical draw');
        if(activeCup)savedDuringInternational=true;
        else savedDuringLeague=true;
        saves++;
      }
    }
    console.log('D02_REGIONAL_SAMPLE '+JSON.stringify({seed,days,official,internationalMatches:ints,scrimBlocks:blocks,rosteredPlayerDays:seasonEvents.days,incidents:{injury:seasonEvents.injury,illness:seasonEvents.illness,burnout:seasonEvents.burnout},overloadDays:seasonExposure.overload14Days,restDays:seasonExposure.rest,healthyBurnoutRiskDays:seasonExposure.eligibleBurnoutDays,modeledBurnoutEvents:+seasonExposure.modeledBurnoutEvents.toFixed(4),lastDate,saves}));
    assert(db.world.phase==='offseason'&&days>150&&days<520,
      'long realistic league/calendar failed to terminate '+JSON.stringify({seed,days,date:lastDate}));
    const seasons=Object.values(db.world.seasons);
    for(const region of ['NA','EU']){
      regionSplits[region]=seasons.filter(s=>
        s.region===region&&s.div===1&&s.split).length;
    }
    const completedCups=seasons.filter(s=>
      db.competitions[s.comp]?.international);
    assert(regionSplits.NA===3&&regionSplits.EU===2,
      'multi-split league calendar omitted domestic brackets '+JSON.stringify(regionSplits));
    assert(completedCups.length===1&&sawCup&&
      completedCups.every(s=>s.done)&&ints>0,
      'cross-region cup had no completed real matches');
    assert(completedCups.some(s=>
      new Set((db.competitions[s.comp]?.teams||[]).map(id=>db.teams[id]?.region)).size===2),
      'international tournament did not involve both regions');
    assert(official>400&&blocks>0&&scheduledIntervals>=5,
      'too few verified real fixture/scrim exposure days');
    assert(saves>=2&&savedDuringLeague&&savedDuringInternational,
      'save was not verified during domestic play and international play');
    assert(maxLoad>2&&seasonEvents.days>=days*100,
      'medical athletes received no substantial live calendar exposure');
    assert(seasonExposure.playerDays===seasonEvents.days&&
      seasonExposure.healthyDays<=seasonExposure.playerDays&&
      seasonExposure.overload45Days<=seasonExposure.overload20Days&&
      seasonExposure.overload20Days<=seasonExposure.overload14Days&&
      seasonExposure.eligibleBurnoutDays<=seasonExposure.healthyDays&&
      ['normal','light','rest','rehab'].reduce((n,p)=>n+seasonExposure[p],0)===
        seasonExposure.playerDays,
      'real-calendar burnout exposure accounting is inconsistent');
    for(const k of cases)assert(seasonEvents[k]>=0,'negative case count');
    assert(seasonEvents.unavailableDays<=seasonEvents.days,
      'medical availability tally exceeded registered athlete-days');
    assert(!rosterIntegrityErrors(db).length,'full-season roster integrity lost');
    const report=runOffseason(db);
    assert(db.world.phase==='market'&&report.rookies?.length===2,
      'medical gap crossed a market/year boundary without rookie intake');
    assert(activeTeams(db).every(t=>medicalAvailable(db,t)>=5),
      'offseason reconciliation left the active squad short of five');
    assert(db.worldDate>=lastDate,'offseason moved calendar time backwards');
    const medicalExpenses=activeTeams(db).reduce((sum,t)=>sum+
      (t.finance.history||[]).reduce((v,h)=>v+(h.exp?.medicalReplacementWage||0),0),0);
    assert(medicalExpenses>=0,'invalid medical guarantee wages at year rollover');
    grand.days+=days;grand.official+=official;grand.scrimBlocks+=blocks;
    grand.internationalMatches+=ints;grand.saves+=saves;
    rows.push({seed,started,ended:lastDate,calendarDays:days,
      splits:regionSplits,officialMatches:official,
      internationalMatches:ints,scrimBlocks:blocks,
      rosteredPlayerDays:seasonEvents.days,
      illnesses:seasonEvents.illness,injuries:seasonEvents.injury,
      burnout:seasonEvents.burnout,
      healthyBurnoutRiskDays:seasonExposure.eligibleBurnoutDays,
      modeledBurnoutEvents:+seasonExposure.modeledBurnoutEvents.toFixed(4),
      peakOverloadDays:seasonExposure.peakOverloadDays,
      overload14Days:seasonExposure.overload14Days,
      unavailablePlayerDays:seasonEvents.unavailableDays,
      maxMedicalLoad:Math.round(maxLoad*10)/10,
      medicalExpenses:Math.round(medicalExpenses*1000)/1000,
      saves,yearAfterOffseason:db.year,managedIntensity,
      weightedFacilityBands:['basic','supported']});
  }
  assert(rows.length===seedNames.length&&grand.official>800&&
    grand.internationalMatches>=10&&grand.events.days>=35000,
    'regional full-season sample too small');
  assert(grand.byCare.supported.days>5000&&grand.byCare.basic.days>5000,
    'did not cover both medical support levels');
  assert(grand.byAge.veteran.days>1500&&
    grand.byAge.young.days>2000&&grand.byAge.prime.days>2000,
    'veteran/prime/youth age cohorts not all represented');
  assert(grand.byIntensity.light.days>0&&
    grand.byIntensity.normal.days>0&&grand.byIntensity.high.days>0,
    'training intensity distribution did not span all three modes');
  assert(grand.events.injury+grand.events.illness+grand.events.burnout>=1,
    'no medical incidents in a substantial observed real-calendar sample');
  const observed=grand.burnoutExposure;
  assert(observed.playerDays===grand.events.days&&
    observed.peakOverloadDays>=0&&observed.peakOverloadDays<=120&&
    observed.healthyDays<=observed.playerDays&&
    observed.sameDayRegistrations<=observed.playerDays&&
    observed.eligibleBurnoutDays<=observed.healthyDays&&
    observed.modeledBurnoutEvents>=0&&
    observed.modeledBurnoutEvents<=observed.eligibleBurnoutDays*.00032+1e-8,
    'risk exposure totals or per-eligible-day upper bound are invalid');
  assert(grand.byOperator.manager.playerDays+
    grand.byOperator.ai.playerDays===observed.playerDays&&
    grand.byOperator.manager.playerDays>0&&
    grand.byOperator.ai.playerDays>0,
    'manager/AI medical workload exposure is not partitioned correctly');
  assert(['normal','light','rest','rehab'].every(plan=>
    grand.planDays[plan]===observed[plan]),
    'medical plan exposure counts contradict the previously measured plans');
  const eventRate=row=>Math.round((row.injury+row.illness+row.burnout)/
    Math.max(1,row.days)*365*1000)/10;
  const combinedRate=eventRate(grand.events);
  assert(combinedRate>=0&&combinedRate<50,
    'medical incidence in realistic schedule exceeded sanity bound');
  const buckets=xs=>Object.fromEntries(Object.entries(xs).map(([key,row])=>[
    key,{playerDays:row.days,injuries:row.injury,illnesses:row.illness,
      burnout:row.burnout,unavailableDays:row.unavailableDays,
      eventsPer100Year:eventRate(row)}
  ]));
  console.log('D02_REGIONAL_MEDICAL '+JSON.stringify({
    seeds:seedNames.length,worldVersion:15,saveFormat:2,
    actualCalendarDays:grand.days,officialMatches:grand.official,
    internationalMatches:grand.internationalMatches,scrimBlocks:grand.scrimBlocks,
    rosteredPlayerDays:grand.events.days,medicalEvents:{
      injury:grand.events.injury,illness:grand.events.illness,
      burnout:grand.events.burnout,unavailableDays:grand.events.unavailableDays
    },eventsPer100PlayerYears:combinedRate,
    byRegion:buckets(grand.byRegion),byFacility:buckets(grand.byCare),
    byAge:buckets(grand.byAge),byIntensity:buckets(grand.byIntensity),
    recoveryPlans:grand.planDays,maxMedicalLoad:grand.peakLoad,
    burnoutExposure:{athleteDays:observed.playerDays,
      healthyDays:observed.healthyDays,sameDayRegistrations:observed.sameDayRegistrations,
      load9Days:observed.load9Days,
      overload14Days:observed.overload14Days,
      overload20Days:observed.overload20Days,
      overload45Days:observed.overload45Days,
      eligibleBurnoutDays:observed.eligibleBurnoutDays,
      modeledBurnoutEvents:+observed.modeledBurnoutEvents.toFixed(4),
      peakOverloadDays:observed.peakOverloadDays,
      manager:{athleteDays:grand.byOperator.manager.playerDays,
        burnoutRiskDays:grand.byOperator.manager.eligibleBurnoutDays,
        recoveryDays:grand.byOperator.manager.light+
          grand.byOperator.manager.rest},
      ai:{athleteDays:grand.byOperator.ai.playerDays,
        burnoutRiskDays:grand.byOperator.ai.eligibleBurnoutDays,
        recoveryDays:grand.byOperator.ai.light+grand.byOperator.ai.rest}},
    saveRestores:grand.saves,runs:rows
  }));
})();`;
vm.runInNewContext(source,{console,Date,Math,JSON,Set,Map,WeakMap,Object,
  Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},{timeout:330000});
