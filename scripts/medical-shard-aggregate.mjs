import {readFile} from 'node:fs/promises';

const type=process.argv[2],files=process.argv.slice(3);
const assert=(test,message)=>{if(!test)throw new Error('MEDICAL_SHARD_AGGREGATE '+message)};
assert(['regional','calendar'].includes(type),'type must be regional or calendar');
assert(files.length===2,'exactly two shard reports are required');

const reports=await Promise.all(files.map(async path=>
  JSON.parse(await readFile(path,'utf8'))));
reports.sort((a,b)=>a.shardIndex-b.shardIndex);
assert(reports.every((r,i)=>r.shardIndex===i&&r.seeds===1),
  'missing, duplicate or malformed shard indexes');

const sum=(xs,key)=>xs.reduce((n,x)=>n+(x?.[key]||0),0);
const sumFields=(xs,fields)=>Object.fromEntries(fields.map(key=>[key,sum(xs,key)]));
const sameSet=(a,b)=>{
  const left=[...a].sort(),right=[...b].sort();
  return left.length===right.length&&left.every((x,i)=>x===right[i]);
};

if(type==='regional'){
  const expectedSeeds=['d02-b9-calendar-NA','d02-b9-calendar-EU'],
    rows=reports.flatMap(r=>r.runs||[]),
    raws=reports.map(r=>r.aggregateRaw);
  assert(rows.length===2&&sameSet(rows.map(x=>x.seed),expectedSeeds),
    'regional shard seed coverage changed');
  assert(rows.find(x=>x.seed===expectedSeeds[0])?.managedIntensity==='high'&&
    rows.find(x=>x.seed===expectedSeeds[1])?.managedIntensity==='light',
    'regional shard changed original seed identity/training policy');

  const events=sumFields(raws.map(x=>x.events),
    ['days','injury','illness','burnout','unavailableDays']);
  const byCare=Object.fromEntries(['supported','basic'].map(key=>[
    key,sumFields(raws.map(x=>x.byCare[key]),
      ['days','injury','illness','burnout','unavailableDays'])
  ]));
  const byAge=Object.fromEntries(['young','prime','veteran'].map(key=>[
    key,sumFields(raws.map(x=>x.byAge[key]),
      ['days','injury','illness','burnout','unavailableDays'])
  ]));
  const byIntensity=Object.fromEntries(['light','normal','high'].map(key=>[
    key,sumFields(raws.map(x=>x.byIntensity[key]),
      ['days','injury','illness','burnout','unavailableDays'])
  ]));
  const planFields=['normal','light','rest','rehab'],
    exposureSumFields=['playerDays','healthyDays','sameDayRegistrations','load9Days',
      'overload14Days','overload20Days','overload45Days','eligibleBurnoutDays',
      'modeledBurnoutEvents',...planFields],
    observed=sumFields(raws.map(x=>x.burnoutExposure),exposureSumFields);
  observed.peakLoad=Math.max(...raws.map(x=>x.burnoutExposure.peakLoad||0));
  observed.peakOverloadDays=Math.max(...raws.map(x=>x.burnoutExposure.peakOverloadDays||0));
  const planDays=sumFields(raws.map(x=>x.planDays),planFields),
    managerDays=sum(raws.map(x=>x.byOperator.manager),'playerDays'),
    aiDays=sum(raws.map(x=>x.byOperator.ai),'playerDays'),
    official=sum(raws,'official'),
    internationalMatches=sum(raws,'internationalMatches');

  assert(rows.length===2&&official>800&&internationalMatches>=10&&events.days>=35000,
    'regional full-season sample too small');
  assert(byCare.supported.days>5000&&byCare.basic.days>5000,
    'did not cover both medical support levels');
  assert(byAge.veteran.days>1500&&byAge.young.days>2000&&byAge.prime.days>2000,
    'veteran/prime/youth age cohorts not all represented');
  assert(byIntensity.light.days>0&&byIntensity.normal.days>0&&byIntensity.high.days>0,
    'training intensity distribution did not span all three modes');
  assert(events.injury+events.illness+events.burnout>=1,
    'no medical incidents in a substantial observed real-calendar sample');
  assert(observed.playerDays===events.days&&
    observed.peakOverloadDays>=0&&observed.peakOverloadDays<=120&&
    observed.healthyDays<=observed.playerDays&&
    observed.sameDayRegistrations<=observed.playerDays&&
    observed.eligibleBurnoutDays<=observed.healthyDays&&
    observed.modeledBurnoutEvents>=0&&
    observed.modeledBurnoutEvents<=observed.eligibleBurnoutDays*.00032+1e-8,
    'risk exposure totals or per-eligible-day upper bound are invalid');
  assert(managerDays+aiDays===observed.playerDays&&managerDays>0&&aiDays>0,
    'manager/AI medical workload exposure is not partitioned correctly');
  assert(planFields.every(plan=>planDays[plan]===observed[plan]),
    'medical plan exposure counts contradict measured plans');

  const eventRate=row=>Math.round((row.injury+row.illness+row.burnout)/
    Math.max(1,row.days)*365*1000)/10,
    combinedRate=eventRate(events);
  assert(combinedRate>=0&&combinedRate<50,
    'medical incidence in realistic schedule exceeded sanity bound');

  console.log('D02_REGIONAL_MEDICAL_AGGREGATE '+JSON.stringify({
    seeds:2,officialMatches:official,internationalMatches,
    rosteredPlayerDays:events.days,medicalEvents:{
      injury:events.injury,illness:events.illness,burnout:events.burnout,
      unavailableDays:events.unavailableDays
    },eventsPer100PlayerYears:combinedRate,
    burnoutExposure:{athleteDays:observed.playerDays,
      eligibleBurnoutDays:observed.eligibleBurnoutDays,
      modeledBurnoutEvents:+observed.modeledBurnoutEvents.toFixed(4),
      peakOverloadDays:observed.peakOverloadDays},
    runs:rows.map(x=>({seed:x.seed,officialMatches:x.officialMatches,
      scrimBlocks:x.scrimBlocks,managedIntensity:x.managedIntensity}))
  }));
}else{
  const expectedSeeds=['medical-real-calendar-A','medical-real-calendar-B'],
    runs=reports.flatMap(r=>r.runs||[]),
    raws=reports.map(r=>r.aggregateRaw),
    seasonsPerSeed=2;
  assert(runs.length===expectedSeeds.length*seasonsPerSeed&&
    sameSet([...new Set(runs.map(x=>x.seed))],expectedSeeds),
    'calendar shard seed/season coverage changed');
  assert(runs.filter(x=>x.seed===expectedSeeds[0]).every(x=>x.managedIntensity==='high')&&
    runs.filter(x=>x.seed===expectedSeeds[1]).every(x=>x.managedIntensity==='light'),
    'calendar shard changed original seed identity/training policy');

  const totalMatches=sum(raws,'totalMatches'),
    totalActiveDays=sum(raws,'totalActiveDays'),
    totalPlayerDays=sum(raws,'totalPlayerDays'),
    totalInjury=sum(raws,'totalInjury'),
    totalIllness=sum(raws,'totalIllness'),
    totalBurnout=sum(raws,'totalBurnout'),
    totalAbsences=sum(raws,'totalAbsences'),
    totalSaves=sum(raws,'totalSaves'),
    totalMedicalWages=sum(raws,'totalMedicalWages');
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

  assert(totalMatches>=150&&totalActiveDays>=240&&totalPlayerDays>12000,
    'real medical sampling coverage too small');
  assert(totalIllness+totalInjury+totalBurnout>0,
    'medical engine generated no events during live full-calendar seasons');
  assert(runs.filter(x=>x.managedIntensity==='high').length===seasonsPerSeed&&
    runs.filter(x=>x.managedIntensity==='light').length===seasonsPerSeed,
    'multi-season audit did not preserve both manager training policies');
  assert(runs.every(x=>exposureOk(x.burnoutExposure)&&
    x.actualScrimBlocks>0&&x.managedScrimSets>0),
    'multi-season burnout/scrim exposure did not survive every season');
  assert(totalAbsences<=totalInjury+totalIllness+totalBurnout,
    'absent athlete count exceeds recorded medical incidents');

  const rate=x=>Math.round(x/totalPlayerDays*365*1000)/10;
  console.log('D02_MEDICAL_CALENDAR_AGGREGATE '+JSON.stringify({
    seeds:2,seasonsPerSeed,totalMatches,totalActiveDays,
    registeredPlayerDays:totalPlayerDays,
    incidents:{injury:totalInjury,illness:totalIllness,burnout:totalBurnout,
      absences:totalAbsences},
    annualPer100:{injury:rate(totalInjury),illness:rate(totalIllness),
      burnout:rate(totalBurnout),all:rate(totalInjury+totalIllness+totalBurnout)},
    modernSaves:totalSaves,
    medicalWageExpense:Math.round(totalMedicalWages*1000)/1000,
    runs:runs.map(x=>({seed:x.seed,year:x.year,official:x.official,
      managedIntensity:x.managedIntensity}))
  }));
}
