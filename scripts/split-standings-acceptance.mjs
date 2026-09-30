// Standings aggregation and schedule-period selection are orthogonal.
// Regression fixtures use canonical generated bracket schedules, and change
// a small number of match outcomes to make exact standings assertions.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';

const root=resolve(import.meta.dirname,'..','src','artifact');
let source='';
for(const file of [...ENGINE_MODULES,'ui-season.js','ui-setup.js'])
  source+=await readFile(resolve(root,file),'utf8')+'\n';
source+='function esc(x){return String(x)}\n';
source+=String.raw`(()=>{
  const check=(yes,message)=>{if(!yes)throw new Error('SPLIT_AGGREGATION '+message)};
  const cfg=defaultWorldConfig();
  cfg.regions=[regionCfg('NA',{teams:10,splits:3,legs:1,
    regularBo:1,playoffBo:1,playoffTake:4,div2:false,
    format:'rr_po',standingsMode:'independent'})];
  cfg.internationals=[];cfg.subs=1;cfg.changes='none';
  check(cfg.regions[0].splits===3&&
    cfg.regions[0].standingsMode==='independent',
    'split count unexpectedly coupled to aggregation');
  check(regionCfg('EU',{splits:2,standingsMode:'points'}).splits===2&&
    regionCfg('EU',{splits:2,standingsMode:'points'}).standingsMode==='points',
    'independent region-specific period/aggregation configuration ignored');
  const card=regionCard(cfg.regions[0],0);
  check(card.includes('data-cfg="r.0.splits"')&&
    card.includes('data-cfg="r.0.standingsMode"')&&
    card.includes('성적 집계 방식')&&card.includes('value="cumulative"'),
    'new-game setup omitted distinct aggregation and split selectors');
  cfg.regions[0].standingsMode='missing_mode';
  check(validateConfig(cfg).some(msg=>msg.includes('성적 집계')),
    'unknown aggregation mode passed world-config validation');
  cfg.regions[0].standingsMode='independent';
  const db=buildWorld(cfg),R=db.regions.NA,owner=activeTeams(db,'NA',1)[0];
  startCareer(db,owner.id,'split-aggregate-testing');
  autoBuildInitialSquad(db,owner,new RNG('split-aggregate-roster','manager'),6);
  finalizeInitialRosters(db);
  check(db.world.phase==='season'&&db.world.seasons['LCS-1'],
    'actual region season schedule was not constructed');
  const one=db.world.seasons['LCS-1'],
    regular=db.competitions[one.comp].stages[0].id,
    contestants=db.competitions[one.comp].teams;
  check(one.split===1&&contestants.length===10,
    'fixture is not the real generated ten-team domestic tournament');
  // Score exactly one real scheduled regular series. All the other scheduled
  // fixtures remain unplayed; no fabricated extra matches are added.
  const scored=one.days.flatMap(d=>d.stage===regular?d.matches:[])[0];
  const A=scored.a,B=scored.b,
    C=contestants.find(id=>id!==A&&id!==B),
    remaining=contestants.filter(id=>![A,B,C].includes(id));
  scored.res={winner:A,score:[2,0]};
  one.done=true;one.champion=A;one.runnerUp=C;
  one.stageData.playoffs={type:'single_elim',elim:[...remaining.slice(0,2),C]};
  // Prove each later season has a distinct fixture list and championship.
  const makeSplit=split=>{
    const key='LCS-'+split,s=newSeason(db,one.comp,db.year,
      'split-aggregate/'+split,'2027-05-01',key);
    s.key=key;s.split=split;s.region=R.id;s.div=1;
    db.world.seasons[key]=s;return s;
  };
  const two=makeSplit(2);
  check(two.days.length>0&&
    two.days.every(d=>d.matches.every(m=>!m.res))&&
    two.id!==one.id,'previous split match results leaked into new fixtures');
  const beforeIndependent=standings(db,two,regular),
    firstIndependent=beforeIndependent.find(row=>row.tid===A);
  check(firstIndependent.w===0&&firstIndependent.gw===0,
    'independent split did not reset regular results');
  R.standingsMode='cumulative';db.worldConfig.regions[0].standingsMode='cumulative';
  const secondCumulative=standings(db,two,regular),
    carriedA=secondCumulative.find(row=>row.tid===A),
    carriedB=secondCumulative.find(row=>row.tid===B);
  check(carriedA.w===1&&carriedA.l===0&&carriedA.gw===2&&
    carriedB.l===1&&carriedB.gl===2&&
    secondCumulative[0].tid===A,
    'previous completed domestic regular records did not carry');
  check(rrTable(db,two,regular,[A])[0].w===1,
    'group standings discarded carried games against external opponents');
  const opposed=two.days.flatMap(d=>d.stage===regular?d.matches:[])
    .find(m=>(m.a===A&&m.b===B)||(m.a===B&&m.b===A));
  check(!!opposed,'second split fixture set dropped repeated regular opponent');
  opposed.res={winner:B,score:opposed.a===B?[2,1]:[1,2]};
  const both=standings(db,two,regular);
  check(both.find(x=>x.tid===A).w===1&&
    both.find(x=>x.tid===A).l===1&&
    both.find(x=>x.tid===B).w===1&&
    both.find(x=>x.tid===B).l===1,
    'current and prior split wins/losses were not tallied together');
  two.done=true;two.champion=B;two.runnerUp=A;
  two.stageData.playoffs={type:'single_elim',
    elim:[...remaining.slice(0,2),A]};
  const three=makeSplit(3);
  const prior=standings(db,three,regular);
  check(prior.find(x=>x.tid===A).w===1&&prior.find(x=>x.tid===A).l===1&&
    prior.find(x=>x.tid===B).w===1&&prior.find(x=>x.tid===B).l===1,
    'three-split carry did not include all earlier finished splits');
  check(three.days.every(d=>d.matches.every(m=>!m.res)),
    'cumulative points inadvertently pre-resolved official fixtures');
  R.standingsMode='points';db.worldConfig.regions[0].standingsMode='points';
  const now=standings(db,three,regular);
  check(now.every(x=>x.w===0&&x.l===0),
    'championship points mode must reset match results per split');
  const ranked=championshipStandings(db,R,1),record=ranked.find(x=>x.tid===A);
  check(record.points===170&&record.bySplit[1]===100&&
    record.bySplit[2]===70&&ranked[0].tid===A,
    'points not accumulated from two completed playoff placements');
  check(ranked.find(x=>x.tid===B).points===100&&
    ranked.find(x=>x.tid===C).points===70,
    'championship point awards or runner-up weights drifted');
  check(recentSplitChampion(db,R)===B&&regionPlacements(db,R)[0]===A,
    'international split champion and annual points qualifier were conflated');
  const before=JSON.stringify(three.days),
    saved=unpackDB(packDB(db));
  check(saved.regions.NA.standingsMode==='points'&&
    saved.worldConfig.regions[0].standingsMode==='points'&&
    saved.world.seasons['LCS-2'].champion===B&&
    championshipStandings(saved,saved.regions.NA)[0].points===170&&
    JSON.stringify(saved.world.seasons['LCS-3'].days)===before,
    'save/restore changed annual scoring, mode, split champions or fixtures');
  const legacy=JSON.parse(packDB(db));
  delete legacy.regions.NA.standingsMode;
  delete legacy.worldConfig.regions[0].standingsMode;
  const old=unpackDB(JSON.stringify(legacy));
  check(regionPlacements(old,old.regions.NA)[0]===B&&
    standings(old,old.world.seasons['LCS-3'],regular).every(x=>x.w===0),
    'old saves without an aggregation mode did not default to independent');
  const reset=unpackDB(packDB(db));
  reset.year++;reset.world={...reset.world,year:reset.year,seasons:{}};
  check(championshipStandings(reset,reset.regions.NA).every(x=>x.points===0),
    'championship points leaked between years');
  // A single-split region may select points without changing its schedule.
  check(regionCfg('JP',{splits:1,standingsMode:'points'}).standingsMode==='points',
    'single-season schedule disallowed independent aggregation selection');
  console.log('SPLIT_AGGREGATION '+JSON.stringify({
    allowedModes:Object.keys(SPLIT_STANDINGS_MODES),
    twoAndThreeSplits:true,firstSplitWins:carriedA.w,
    thirdSplitCarriedMatches:prior.find(x=>x.tid===A).w+
      prior.find(x=>x.tid===A).l,
    annualPointsLeader:record.points,latestSplitChampion:B,
    winnerOfAnnualRank:A,oldSaveCompatibility:true,
    newYearReset:true,saveFormat:2
  }));
})();`;
vm.runInNewContext(source,{console,Date,Math,JSON,Set,Map,WeakMap,Object,
  Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},{timeout:120000});
