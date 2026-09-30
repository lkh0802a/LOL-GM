// D03-B1: persistent, club-specific AI scouting memory consumed by market AI.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';

const root=resolve(import.meta.dirname,'..','src','artifact');
let source='';
for(const file of ENGINE_MODULES)source+=await readFile(resolve(root,file),'utf8')+'\n';
source+=String.raw`(()=>{
  const assert=(x,m)=>{if(!x)throw new Error('D03_SCOUTING '+m)};
  const cfg=defaultWorldConfig();
  cfg.regions=[
    regionCfg('NA',{teams:10,splits:1,legs:1,regularBo:1,playoffBo:1,
      playoffTake:4,format:'rr_po',div2:false,system:'franchise'}),
    regionCfg('EU',{teams:10,splits:1,legs:1,regularBo:1,playoffBo:1,
      playoffTake:4,format:'rr_po',div2:false,system:'franchise'})
  ];
  cfg.internationals=[];cfg.subs=1;cfg.changes='none';
  let db=buildWorld(cfg);
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
  assert(!String(aiMarketObservation).includes('playerOvr')&&
    !String(aiMarketObservation).includes('.pot'),
    'AI market observation still reads hidden current ability/potential directly');

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
