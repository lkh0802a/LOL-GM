// D02-B8: real calendar + scheduled scrim + official match multi-season audit.
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
  let totalPlayerDays=0,totalMatches=0,totalActiveDays=0,
    totalInjury=0,totalIllness=0,totalBurnout=0,totalAbsences=0,
    totalSaves=0,totalMedicalWages=0;
  for(const seed of seeds){
    const cfg=defaultWorldConfig();
    cfg.regions=[regionCfg('NA',{teams:10,splits:1,legs:1,regularBo:1,
      playoffBo:1,playoffTake:4,format:'rr_po',div2:false,system:'franchise'})];
    cfg.internationals=[];cfg.subs=1;cfg.changes='none';
    let db=buildWorld(cfg);
    const coach=activeTeams(db,null,1)[0],teamId=coach.id;
    startCareer(db,teamId,seed);
    autoBuildInitialSquad(db,coach,new RNG(seed,'initial-squad'),6);
    finalizeInitialRosters(db);
    const initialRoster=activeTeams(db).length;
    ok(db.world.phase==='season'&&initialRoster===10,
      'real season bootstrap failed for '+seed);
    for(let cycle=0;cycle<seasonsPerSeed;cycle++){
      const year=2027+cycle;
      ok(db.year===year&&db.world.year===year,
        'unexpected season year after offseason handoff');
      let days=0,official=0,playerDays=0,saved=false,maximumLoad=0;
      while(db.world.phase==='season'&&days<415){
        const date=nextCalendarDate(db);
        if(date===null){advanceStep(db);continue}
        ok(date.slice(0,4)===String(year),'calendar crossed seasons prematurely');
        ok(applyWorldDailyEffects(db,date),'duplicate daily effect on official day');
        days++;playerDays+=activeTeams(db).reduce((sum,t)=>sum+(t.roster||[]).length,0);
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
      ok(realScrims>0,'actual AI scrim booking never ran');
      ok(maximumLoad>0,'actual scheduled events never built medical exposure');
      const realMatches=Object.values(db.world.seasons)
        .reduce((sum,s)=>sum+s.days.reduce((v,d)=>v+d.matches.filter(m=>m.res).length,0),0);
      ok(realMatches===official,'medical calendar counted fictitious official games');
      totalMatches+=official;totalPlayerDays+=playerDays;totalActiveDays+=days;
      totalInjury+=injury;totalIllness+=illness;
      totalBurnout+=burnout;totalAbsences+=absences;
      runs.push({seed,year,days,official,aiScrims:realScrims,playerDays,
        injury,illness,burnout,absences,maxLoad:Math.round(maximumLoad*10)/10});
      const rep=runOffseason(db);
      ok(db.world.phase==='market'&&db.year===year+1&&rep.rookies.length===1,
        'offseason medical recovery or rookie market interrupted');
      ok(activeTeams(db).every(t=>medicalAvailable(db,t)>=5),
        'medical absences persisted after a full offseason calendar jump');
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
    totalMatches>=150&&totalActiveDays>=400&&totalPlayerDays>15000,
    'real medical sampling coverage too small');
  ok(totalIllness+totalInjury+totalBurnout>0,
    'medical engine generated no events during live full-calendar seasons');
  ok(totalAbsences<=totalInjury+totalIllness+totalBurnout,
    'absent athlete count exceeds recorded medical incidents');
  const rate=x=>Math.round(x/totalPlayerDays*365*1000)/10;
  const report={seeds:seeds.length,seasonsPerSeed,runs,
    totalMatches,totalActiveDays,registeredPlayerDays:totalPlayerDays,
    incidents:{injury:totalInjury,illness:totalIllness,burnout:totalBurnout,
      absences:totalAbsences},
    annualPer100:{injury:rate(totalInjury),illness:rate(totalIllness),
      burnout:rate(totalBurnout),all:rate(totalInjury+totalIllness+totalBurnout)},
    medicalWageExpense:Math.round(totalMedicalWages*1000)/1000,
    modernSaves:totalSaves,worldVersion:15,saveFormat:2};
  console.log('D02_MEDICAL_CALENDAR '+JSON.stringify(report));
})();`;
vm.runInNewContext(source,{console,Date,Math,JSON,Set,Map,WeakMap,Object,
  Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},{timeout:120000});
