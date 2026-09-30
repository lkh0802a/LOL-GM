// D03-B1/B2: persistent club scouting memory and founding-market dossiers.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';

const root=resolve(import.meta.dirname,'..','src','artifact');
let source='';
for(const file of ENGINE_MODULES)source+=await readFile(resolve(root,file),'utf8')+'\n';
source+=String.raw`(()=>{
  const assert=(x,m)=>{if(!x)throw new Error('D03_SCOUTING '+m)};
  const config=()=>{
    const cfg=defaultWorldConfig();
    cfg.regions=[
      regionCfg('NA',{teams:10,splits:1,legs:1,regularBo:1,playoffBo:1,
        playoffTake:4,format:'rr_po',div2:false,system:'franchise'}),
      regionCfg('EU',{teams:10,splits:1,legs:1,regularBo:1,playoffBo:1,
        playoffTake:4,format:'rr_po',div2:false,system:'franchise'})
    ];
    cfg.internationals=[];cfg.subs=1;cfg.changes='none';return cfg;
  };
  const legacyInitial=(db,p,t)=>{
    const perf=recentMarketPerformance(db,p),sample=Math.min(30,perf.games),
      foreign=!isLocalPlayer(p,t.region),
      uncertainty=(foreign?4.5:2.5)+(sample<6?3:sample<15?1.5:0),
      n=((hashStr(t.id+'|'+p.id+'|'+db.year+'|ability')%2001)/1000-1),
      ability=Math.round(clamp(playerOvr(p)+n*uncertainty,20,99)),
      n2=((hashStr(t.id+'|'+p.id+'|'+db.year+'|potential')%2001)/1000-1),
      ageUpside=p.age<=19?9:p.age<=21?6:p.age<=23?3:1,
      potential=Math.round(clamp(ability+ageUpside+n2*(foreign?5:3)+
        (p.reputation-ability)*.08,ability,99));
    return {ability,potential,uncertainty:Math.round(uncertainty*10)/10};
  };

  // B2: the founding auction must create a persistent dossier once while
  // reproducing the already-accepted initial market signal exactly.
  let founding=buildWorld(config());
  const foundingManager=activeTeams(founding,'EU',1)[0],
    foundingClubs=activeTeams(founding,'NA',1).slice(0,2);
  assert(foundingManager&&foundingClubs.length===2,'founding dossier fixture missing clubs');
  startCareer(founding,foundingManager.id,'d03-b2-founding');
  const foundingTarget=Object.values(founding.players)
    .find(p=>!p.retired&&!p.team&&p.region==='NA');
  assert(foundingTarget,'founding dossier fixture missing target');
  const [foundingA,foundingB]=foundingClubs,
    expectedA=legacyInitial(founding,foundingTarget,foundingA),
    firstA=aiMarketObservation(founding,foundingTarget,foundingA);
  assert(firstA.source==='founding_dossier'&&
    firstA.ability===expectedA.ability&&firstA.potential===expectedA.potential&&
    firstA.uncertainty===expectedA.uncertainty,
    'founding dossier changed the accepted initial-market signal');
  const reportA=foundingA.scoutingState?.reports?.[foundingTarget.id];
  assert(reportA&&reportA.source==='founding_dossier'&&
    reportA.observations===0&&reportA.dossierYear===founding.year,
    'initial market did not persist a one-time founding dossier');

  const valueBefore=aiMarketValue(founding,foundingTarget,foundingA),
    actualBefore=playerOvr(foundingTarget);
  for(const key of Object.keys(foundingTarget.attrs||{}))
    foundingTarget.attrs[key]=clamp(foundingTarget.attrs[key]+18,20,99);
  const actualAfter=playerOvr(foundingTarget),
    secondA=aiMarketObservation(founding,foundingTarget,foundingA),
    valueAfter=aiMarketValue(founding,foundingTarget,foundingA);
  assert(actualAfter!==actualBefore&&secondA.ability===firstA.ability&&
    secondA.potential===firstA.potential&&valueAfter===valueBefore,
    'initial auction re-read hidden current ability after dossier creation');

  const expectedB=legacyInitial(founding,foundingTarget,foundingB),
    firstB=aiMarketObservation(founding,foundingTarget,foundingB);
  assert(firstB.source==='founding_dossier'&&
    firstB.ability===expectedB.ability&&firstB.potential===expectedB.potential&&
    foundingB.scoutingState.reports[foundingTarget.id]!==reportA,
    'second club did not create its own baseline-compatible dossier');
  assert(!String(aiMarketObservation).includes('playerOvr')&&
    !String(aiMarketObservation).includes('.pot')&&
    typeof initialRosterMarketObservation==='undefined',
    'contracts market path still owns a hidden-ability initial exception');

  const foundingPacked=packDB(founding);
  founding=unpackDB(foundingPacked);
  const restoredFounding=aiMarketObservation(founding,
    founding.players[foundingTarget.id],founding.teams[foundingA.id]);
  assert(restoredFounding.source==='founding_dossier'&&
    restoredFounding.ability===firstA.ability&&
    restoredFounding.potential===firstA.potential,
    'founding dossier failed save/restore during initial roster phase');

  // B1: established clubs continue to accumulate distinct match observations.
  let db=buildWorld(config());
  const na=activeTeams(db,'NA',1).slice(0,3),manager=activeTeams(db,'EU',1)[0];
  assert(na.length===3&&manager,'two-region scouting fixture missing clubs');
  setManagedTeam(db,manager.id);
  db.world={year:db.year,seed:'d03-b1',manage:'manual',phase:'market',
    seasons:{},steps:[],step:0,report:null,offers:[],marketLog:[]};
  const target=Object.values(db.players).find(p=>!p.retired&&!p.team&&p.region==='NA');
  assert(target,'scouting fixture missing an NA target');
  const [strong,weak,unseen]=na;
  ensureFacilities(strong).scouting=5;ensureFacilities(weak).scouting=1;
  for(const s of staffByRole(strong,'scout'))s.rating=92;
  for(const s of staffByRole(weak,'scout'))s.rating=40;

  const publicView=aiMarketObservation(db,target,unseen);
  assert(publicView.source==='public'&&!unseen.scoutingState?.reports?.[target.id],
    'unobserved club received another club report');

  const firstStrong=observeAiPlayer(db,strong,target,5,{comp:'NA',games:2}),
    firstWeak=observeAiPlayer(db,weak,target,5,{comp:'NA',games:2});
  assert(firstStrong&&firstWeak&&firstStrong!==firstWeak,
    'two clubs did not create independent player reports');
  assert(firstStrong.knowledge>firstWeak.knowledge,
    'scouting staff/facility strength did not affect observation gain');
  const firstUncertainty=aiMarketObservation(db,target,strong).uncertainty,
    firstKnowledge=firstStrong.knowledge;
  for(let i=0;i<5;i++)observeAiPlayer(db,strong,target,5,{comp:'NA',games:2});
  const learned=aiMarketObservation(db,target,strong),
    weakView=aiMarketObservation(db,target,weak);
  assert(learned.source==='scouted'&&weakView.source==='scouted'&&
    learned.knowledge>firstKnowledge&&learned.uncertainty<firstUncertainty,
    'repeated observation did not accumulate knowledge and narrow uncertainty');
  assert(learned.knowledge!==weakView.knowledge||
    learned.ability!==weakView.ability||learned.potential!==weakView.potential,
    'same player collapsed to identical information at unrelated clubs');
  assert(aiMarketValue(db,target,strong)!==undefined&&
    aiMarketObservation(db,target,strong).source==='scouted',
    'market valuation did not consume the persistent scouting report');

  const beforeAge={knowledge:learned.knowledge,uncertainty:learned.uncertainty,
    ability:learned.ability,potential:learned.potential};
  db.year++;db.world.year=db.year;
  ageScoutReports(db);
  const stale=aiMarketObservation(db,target,strong);
  assert(stale.knowledge<beforeAge.knowledge&&stale.staleYears===1&&
    stale.uncertainty>beforeAge.uncertainty&&
    stale.ability===beforeAge.ability&&stale.potential===beforeAge.potential,
    'annual report ageing did not reduce confidence while preserving stale estimate');

  const state=strong.scoutingState;
  assert(state.homeRegion==='NA'&&state.competitions.NA&&
    state.reports[target.id].gamesSeen===12,
    'club scouting coverage/evidence metadata was not accumulated');
  const packed=packDB(db);db=unpackDB(packed);
  const restoredStrong=db.teams[strong.id],restoredTarget=db.players[target.id],
    restored=aiMarketObservation(db,restoredTarget,restoredStrong);
  assert(restored.source==='scouted'&&restored.knowledge===stale.knowledge&&
    restored.ability===stale.ability&&restored.potential===stale.potential&&
    restoredStrong.scoutingState.reports[target.id].observations===6,
    'club-specific scouting memory failed save/restore');
  assert(!db.teams[unseen.id].scoutingState?.reports?.[target.id],
    'save/restore leaked a report into an unobserving club');

  console.log('D03_SCOUTING_ACCEPTANCE '+JSON.stringify({
    founding:{target:foundingTarget.id,teamA:foundingA.id,teamB:foundingB.id,
      actualOvrShift:[actualBefore,actualAfter],ability:firstA.ability,
      potential:firstA.potential,persisted:true,baselineParity:true},
    target:target.id,
    strong:{knowledge:Math.round(firstStrong.knowledge),
      learnedKnowledge:learned.knowledge,staleKnowledge:stale.knowledge,
      uncertainty:[firstUncertainty,learned.uncertainty,stale.uncertainty]},
    weak:{knowledge:Math.round(firstWeak.knowledge),ability:weakView.ability,
      potential:weakView.potential},
    unseenSource:publicView.source,
    observations:restoredStrong.scoutingState.reports[target.id].observations,
    gamesSeen:restoredStrong.scoutingState.reports[target.id].gamesSeen,
    saveFormat:JSON.parse(packed).saveFormat
  }));
})();`;
vm.runInNewContext(source,{console,Date,Math,JSON,Set,Map,WeakMap,Object,
  Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},{timeout:30000});
