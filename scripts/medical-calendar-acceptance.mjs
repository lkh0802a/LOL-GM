// D02-B8 + post-B10.1: real calendar, scheduled scrim and official-match
// multi-season audit. B10.1 already measures dense 2/3-split single-season
// burnout exposure; this file verifies the same live odds across consecutive
// seasons and deliberately different manager training policies.
// Distinct from synthetic daily exposure in medical-balance-acceptance.mjs.
// Full engine dates and matches are advanced without interactive coach draft UI.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';

const dir=resolve(import.meta.dirname,'..','src','artifact');
let source='';
for(const file of ENGINE_MODULES)source+=await readFile(resolve(dir,file),'utf8')+'\n';
source+=String.raw`(()=>{
  const ok=(test,msg)=>{if(!test)throw new Error('D02_MEDICAL_CALENDAR '+msg)};
  const runs=[],seeds=['medical-real-calendar-A','medical-real-calendar-B'],
    seasonsPerSeed=2;
  // Observe the exact live burnout odds used by medicalDailyTick. The observer
  // never substitutes a formula, changes RNG calls, or feeds results back into
  // training, scrim or medical decisions.
  const liveIncidentOdds=medicalIncidentOdds;
  let sampledBurnoutOdds=null;
  medicalIncidentOdds=(...args)=>{
    const odds=liveIncidentOdds(...args);
    if(sampledBurnoutOdds)sampledBurnoutOdds.set(args[0].id,odds.burnout);
    return odds;
  };
  const exposure=()=>({playerDays:0,healthyDays:0,load9Days:0,
    overload14Days:0,overload20Days:0,overload45Days:0,
    eligibleBurnoutDays:0,modeledBurnoutEvents:0,peakLoad:0,
    peakOverloadDays:0,normal:0,light:0,rest:0,rehab:0,
    managerDays:0,aiDays:0,managerRiskDays:0,aiRiskDays:0});
  const exposureOk=row=>row.playerDays>0&&
    row.healthyDays<=row.playerDays&&
    row.overload45Days<=row.overload20Days&&
    row.overload20Days<=row.overload14Days&&
    row.eligibleBurnoutDays<=row.healthyDays&&
    row.modeledBurnoutEvents>=0&&
    row.modeledBurnoutEvents<=row.eligibleBurnoutDays*.00032+1e-8&&
    ['normal','light','rest','rehab'].reduce((n,k)=>n+row[k],0)===row.playerDays&&
    row.managerDays+row.aiDays===row.playerDays&&
    row.managerRiskDays+row.aiRiskDays===row.eligibleBurnoutDays;
  let totalPlayerDays=0,totalMatches=0,totalActiveDays=0,
    totalInjury=0,totalIllness=0,totalBurnout=0,totalAbsences=0,
    totalSaves=0,totalMedicalWages=0;
  for(const seed of seeds){
    const managedIntensity=seed===seeds[0]?'high':'light';
    const cfg=defaultWorldConfig();
    cfg.regions=[regionCfg('NA',{teams:10,splits:1,legs:1,regularBo:1,
      playoffBo:1,playoffTake:4,format:'rr_po',div2:false,system:'franchise'})];
    cfg.internationals=[];cfg.subs=1;cfg.changes='none';
    let db=buildWorld(cfg);
    const coach=activeTeams(db,null,1)[0],teamId=coach.id;
    startCareer(db,teamId,seed);
    autoBuildInitialSquad(db,coach,new RNG(seed,'initial-squad'),6);
    finalizeInitialRosters(db);
    db.teams[teamId].training.intensity=managedIntensity;
    const initialRoster=activeTeams(db).length;
    ok(db.world.phase==='season'&&initialRoster===10,
      'real season bootstrap failed for '+seed);
    for(let cycle=0;cycle<seasonsPerSeed;cycle++){
      const year=2027+cycle;
      ok(db.year===year&&db.world.year===year,
        'unexpected season year after offseason handoff');
      db.teams[teamId].training.intensity=managedIntensity;
      const seasonExposure=exposure();
      const carryIn=Object.values(db.players).filter(p=>p.team&&!p.retired);
      const carryInLoad9=carryIn.filter(p=>(p.medicalLoad||0)>=9).length;
      const carryInOverload14=carryIn.filter(p=>(p.medicalOverloadDays||0)>=14).length;
      if(cycle>0)ok(carryInLoad9===0&&carryInOverload14===0,
        'offseason calendar gap failed to dissipate prior-season workload '+
        JSON.stringify({seed,year,carryInLoad9,carryInOverload14}));
      let days=0,official=0,playerDays=0,saved=false,maximumLoad=0,
        scrimBlocks=0,managedScrimBlocks=0,managedScrimSets=0;
      while(db.world.phase==='season'&&days<415){
        const date=nextCalendarDate(db);
        if(date===null){advanceStep(db);continue}
        ok(date.slice(0,4)===String(year),'calendar crossed seasons prematurely');
        const before=new Map();
        for(const t of activeTeams(db))for(const id of t.roster||[]){
          const p=db.players[id];if(!p||p.retired)continue;
          ok(!before.has(id),'player registered twice before medical tick '+id);
          before.set(id,{load:p.medicalLoad||0,
            healthy:!(p.medical?.daysLeft>0||p.medicalResidual?.daysLeft>0),
            manager:parentTeamOf(db,t)?.id===teamId});
        }
        sampledBurnoutOdds=new Map();
        ok(applyWorldDailyEffects(db,date),'duplicate daily effect on official day');
        const dailyOdds=sampledBurnoutOdds;
        sampledBurnoutOdds=null;
        for(const [id,prior] of before){
          const p=db.players[id];if(!p||p.retired)continue;
          const plan=p.medicalPlanDate===date?p.medicalDayPlan:medicalPlanFor(db,p),
            load=p.medicalLoad||0,overload=p.medicalOverloadDays||0;
          ok(['normal','light','rest','rehab'].includes(plan),
            'missing live medical plan '+date+' '+id);
          seasonExposure.playerDays++;seasonExposure[plan]++;
          if(prior.manager)seasonExposure.managerDays++;
          else seasonExposure.aiDays++;
          seasonExposure.peakLoad=Math.max(seasonExposure.peakLoad,load);
          seasonExposure.peakOverloadDays=Math.max(seasonExposure.peakOverloadDays,overload);
          if(prior.load>=9)seasonExposure.load9Days++;
          if(overload>=14)seasonExposure.overload14Days++;
          if(overload>=20)seasonExposure.overload20Days++;
          if(overload>=45)seasonExposure.overload45Days++;
          if(!prior.healthy)continue;
          seasonExposure.healthyDays++;
          const burnout=dailyOdds.get(id);
          if(!Number.isFinite(burnout))continue;
          ok(burnout>=0&&burnout<=.00032,'captured live burnout probability out of range');
          if(burnout>0){
            seasonExposure.eligibleBurnoutDays++;
            if(prior.manager)seasonExposure.managerRiskDays++;
            else seasonExposure.aiRiskDays++;
          }
          seasonExposure.modeledBurnoutEvents+=burnout;
        }
        days++;playerDays+=activeTeams(db).reduce((sum,t)=>sum+(t.roster||[]).length,0);
        for(const t of activeTeams(db)){
          const today=(t.scrimLog||[]).filter(x=>x.date===date);
          scrimBlocks+=today.length;
          if(parentTeamOf(db,t)?.id===teamId){
            managedScrimBlocks+=today.length;
            managedScrimSets+=today.reduce((sum,x)=>sum+(x.games||0),0);
          }
        }
        // This is the real scrim booking, load, recovery, and medical lottery,
        // not a hand-written injury sampler or fabricated league champion.
        if(date===nextDate(db)){
          for(const s of activeSeasons(db).filter(s=>s.days[s.cur].date===date)){
            const round=s.days[s.cur],count=round.matches.filter(m=>!m.res).length;
            const result=playDay(db,s);
            ok(result?.day===round,'real scheduled match engine did not advance');
            official+=count;
          }
          if(!activeSeasons(db).length)advanceStep(db);
        }
        if(days%30===0){
          const all=activeTeams(db);
          ok(all.every(t=>medicalAvailable(db,t)>=5),
            'club fell below five healthy players on calendar day '+date);
          ok(rosterIntegrityErrors(db).length===0,
            'roster duplicate/mismatched registration on '+date);
        }
        if(days%15===0)
          maximumLoad=Math.max(maximumLoad,...Object.values(db.players)
            .filter(p=>p.team).map(p=>p.medicalLoad||0));
        if(!saved&&days>=37&&official>0){
          const beforeTick=db.world.lastDailyTick,packed=packDB(db);
          db=unpackDB(packed);totalSaves++;
          ok(db.world.lastDailyTick===beforeTick&&
            !applyWorldDailyEffects(db,date),
            'save/restore replayed already processed medical day');
          saved=true;
        }
      }
      ok(db.world.phase==='offseason'&&days>65&&days<415&&official>=35&&saved,
        'multi-season fixture calendar failed to close: '+JSON.stringify({seed,year,days,official}));
      const physical=Object.values(db.players)
        .flatMap(p=>(p.careerEvents||[]).filter(e=>
          e.type==='medical_start'&&e.date?.startsWith(String(year))));
      const injury=physical.filter(x=>x.kind==='injury').length,
        illness=physical.filter(x=>x.kind==='illness').length,
        burnout=physical.filter(x=>x.kind==='burnout').length,
        absences=physical.filter(x=>x.out).length;
      const realScrims=activeTeams(db).reduce((v,t)=>v+
        (t.scrimLog||[]).filter(x=>x.date?.startsWith(String(year))).length,0);
      ok(exposureOk(seasonExposure),
        'longitudinal burnout exposure accounting failed '+JSON.stringify({seed,year,seasonExposure}));
      ok(scrimBlocks>0&&managedScrimBlocks>0&&managedScrimSets>0,
        'longitudinal actual scrim exposure missing '+JSON.stringify({seed,year,scrimBlocks,managedScrimBlocks,managedScrimSets}));
      ok(realScrims>0,'actual AI scrim booking never ran');
      ok(maximumLoad>0,'actual scheduled events never built medical exposure');
      const realMatches=Object.values(db.world.seasons)
        .reduce((sum,s)=>sum+s.days.reduce((v,d)=>v+d.matches.filter(m=>m.res).length,0),0);
      ok(realMatches===official,'medical calendar counted fictitious official games');
      totalMatches+=official;totalPlayerDays+=playerDays;totalActiveDays+=days;
      totalInjury+=injury;totalIllness+=illness;
      totalBurnout+=burnout;totalAbsences+=absences;
      runs.push({seed,year,days,official,aiScrims:realScrims,
        actualScrimBlocks:scrimBlocks,managedScrimBlocks,managedScrimSets,
        managedIntensity,playerDays,injury,illness,burnout,absences,
        maxLoad:Math.round(maximumLoad*10)/10,
        carryIn:{load9Players:carryInLoad9,overload14Players:carryInOverload14},
        burnoutExposure:{...seasonExposure,
          modeledBurnoutEvents:+seasonExposure.modeledBurnoutEvents.toFixed(5)}});
      const rep=runOffseason(db);
      ok(db.world.phase==='market'&&db.year===year+1&&rep.rookies.length===1,
        'offseason medical recovery or rookie market interrupted');
      const offseasonShort=activeTeams(db).filter(t=>medicalAvailable(db,t)<5)
        .map(t=>({team:t.id,roster:t.roster.length,available:medicalAvailable(db,t),
          out:t.roster.map(id=>db.players[id]).filter(p=>p&&medicalOut(p))
            .map(p=>({id:p.id,kind:p.medical?.kind,daysLeft:p.medical?.daysLeft}))}));
      ok(!offseasonShort.length,
        'medical absences persisted after a full offseason calendar jump '+
        JSON.stringify({seed,year,offseasonShort}));
      // Regular wages and short cover are distinct in statements; settlement
      // cannot double-debit already-paid short cover.
      totalMedicalWages+=activeTeams(db).reduce((v,t)=>v+
        (t.finance.history||[]).filter(y=>y.year===year)
          .reduce((a,h)=>a+(h.exp.medicalReplacementWage||0),0),0);
      closeMarket(db);
      ok(!rosterIntegrityErrors(db).length,'market resulted in duplicate registrations');
      if(cycle+1<seasonsPerSeed)startWorldSeason(db,teamId,seed);
    }
  }
  ok(runs.length===seeds.length*seasonsPerSeed&&
    totalMatches>=150&&totalActiveDays>=240&&totalPlayerDays>12000,
    'real medical sampling coverage too small: '+JSON.stringify({
      runs:runs.length,totalMatches,totalActiveDays,totalPlayerDays
    }));
  ok(totalIllness+totalInjury+totalBurnout>0,
    'medical engine generated no events during live full-calendar seasons');
  ok(runs.filter(x=>x.managedIntensity==='high').length===seasonsPerSeed&&
    runs.filter(x=>x.managedIntensity==='light').length===seasonsPerSeed,
    'multi-season audit did not preserve both manager training policies');
  ok(runs.every(x=>exposureOk(x.burnoutExposure)&&
    x.actualScrimBlocks>0&&x.managedScrimSets>0),
    'multi-season burnout/scrim exposure did not survive every season');
  ok(totalAbsences<=totalInjury+totalIllness+totalBurnout,
    'absent athlete count exceeds recorded medical incidents');
  const rate=x=>Math.round(x/totalPlayerDays*365*1000)/10;
  const byPolicy=Object.fromEntries(['high','light'].map(policy=>{
    const rs=runs.filter(x=>x.managedIntensity===policy);
    return [policy,{seasons:rs.length,
      athleteDays:rs.reduce((n,x)=>n+x.burnoutExposure.playerDays,0),
      scrimBlocks:rs.reduce((n,x)=>n+x.actualScrimBlocks,0),
      managedScrimSets:rs.reduce((n,x)=>n+x.managedScrimSets,0),
      load9Days:rs.reduce((n,x)=>n+x.burnoutExposure.load9Days,0),
      overload14Days:rs.reduce((n,x)=>n+x.burnoutExposure.overload14Days,0),
      overload20Days:rs.reduce((n,x)=>n+x.burnoutExposure.overload20Days,0),
      overload45Days:rs.reduce((n,x)=>n+x.burnoutExposure.overload45Days,0),
      burnoutRiskDays:rs.reduce((n,x)=>n+x.burnoutExposure.eligibleBurnoutDays,0),
      modeledBurnoutEvents:+rs.reduce((n,x)=>n+x.burnoutExposure.modeledBurnoutEvents,0).toFixed(5),
      restDays:rs.reduce((n,x)=>n+x.burnoutExposure.rest,0),
      lightDays:rs.reduce((n,x)=>n+x.burnoutExposure.light,0)}];
  }));
  const report={seeds:seeds.length,seasonsPerSeed,runs,
    totalMatches,totalActiveDays,registeredPlayerDays:totalPlayerDays,
    incidents:{injury:totalInjury,illness:totalIllness,burnout:totalBurnout,
      absences:totalAbsences},
    annualPer100:{injury:rate(totalInjury),illness:rate(totalIllness),
      burnout:rate(totalBurnout),all:rate(totalInjury+totalIllness+totalBurnout)},
    longitudinalBurnoutExposure:byPolicy,
    medicalWageExpense:Math.round(totalMedicalWages*1000)/1000,
    modernSaves:totalSaves,worldVersion:15,saveFormat:2};
  console.log('D02_MEDICAL_CALENDAR '+JSON.stringify(report));
})();`;
vm.runInNewContext(source,{console,Date,Math,JSON,Set,Map,WeakMap,Object,
  Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},{timeout:150000});
