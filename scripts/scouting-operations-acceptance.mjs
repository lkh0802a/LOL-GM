// D03-B3: finance-backed AI scouting target allocation and coverage.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';

const root=resolve(import.meta.dirname,'..','src','artifact');
let source='';
for(const file of ENGINE_MODULES)source+=await readFile(resolve(root,file),'utf8')+'\n';
source+=String.raw`(()=>{
  const assert=(x,m)=>{if(!x)throw new Error('D03_SCOUT_OPS '+m)};
  const near=(a,b)=>Math.abs(a-b)<.001;
  const cfg=defaultWorldConfig();
  cfg.regions=[
    regionCfg('NA',{teams:10,splits:1,legs:1,regularBo:1,playoffBo:1,
      playoffTake:4,format:'rr_po',div2:false,system:'franchise'}),
    regionCfg('EU',{teams:10,splits:1,legs:1,regularBo:1,playoffBo:1,
      playoffTake:4,format:'rr_po',div2:false,system:'franchise'})
  ];
  cfg.internationals=[];cfg.subs=1;cfg.changes='none';
  let db=buildWorld(cfg);
  const na=activeTeams(db,'NA',1).slice(0,3),
    manager=activeTeams(db,'EU',1)[0];
  assert(na.length===3&&manager,'fixture missing clubs');
  setManagedTeam(db,manager.id);
  db.world={year:db.year,seed:'d03-b3',manage:'manual',phase:'market',
    seasons:{},steps:[],step:0,report:null,offers:[],marketLog:[]};
  const [strong,weak,poor]=na;
  ensureFacilities(strong).scouting=5;
  ensureFacilities(weak).scouting=1;
  ensureFacilities(poor).scouting=1;
  for(const s of staffByRole(strong,'scout'))s.rating=94;
  for(const s of staffByRole(weak,'scout'))s.rating=42;
  for(let i=0;i<2;i++)ensureStaffRoster(strong).push({
    id:'D03_EXTRA_SCOUT_'+i,name:'Ops Scout '+i,role:'scout',department:'scout',
    rating:90-i,age:35
  });
  strong.finance.cash=100;weak.finance.cash=100;poor.finance.cash=0;

  const strongCash=strong.finance.cash,weakCash=weak.finance.cash,
    strongOp=aiRunScoutingOperation(db,strong),
    weakOp=aiRunScoutingOperation(db,weak),
    poorOp=aiRunScoutingOperation(db,poor);
  assert(strongOp&&weakOp&&poorOp,'operation did not return audit state');
  assert(strongOp.capacity>weakOp.capacity&&strongOp.targets.length>weakOp.targets.length,
    'staff/facility resources did not expand target capacity');
  assert(strongOp.assignments.length>weakOp.assignments.length&&
    strongOp.assignments.some(a=>a.region!=='NA'),
    'strong department did not expand regional coverage');
  assert(weakOp.assignments.length===1&&weakOp.assignments[0].region==='NA',
    'basic department escaped its bounded home-region coverage');
  assert(strongOp.assignments.every(a=>Array.isArray(a.leagues)&&
    Array.isArray(a.scoutIds))&&strongOp.assignments.some(a=>a.leagues.length>0),
    'coverage plan did not persist league/staff assignments');

  assert(strongOp.targets.length===strongOp.targetLimit&&
    weakOp.targets.length===weakOp.targetLimit,
    'funded operation did not use its bounded target allocation');
  assert(near(strongOp.spent,strongOp.unitCost*strongOp.targets.length)&&
    near(weakOp.spent,weakOp.unitCost*weakOp.targets.length),
    'operation spending diverged from manager-equivalent unit cost');
  assert(near(strongCash-strong.finance.cash,strongOp.spent)&&
    near(weakCash-weak.finance.cash,weakOp.spent),
    'scouting did not deduct real club cash');
  assert(near(strong.finance.prepaid.scoutingExpense,strongOp.spent)&&
    near(weak.finance.prepaid.scoutingExpense,weakOp.spent),
    'scouting spend was not recorded in prepaid finance statements');
  assert(poorOp.targetLimit===0&&poorOp.targets.length===0&&poorOp.spent===0&&
    poorOp.reason==='liquidity',
    'liquidity-constrained club spent scouting cash without reserve');

  const covered=new Set(strongOp.assignments.map(a=>a.region));
  assert(strongOp.targets.every(x=>covered.has(x.region)&&x.afterKnowledge>x.beforeKnowledge&&
    x.sourceAfter==='scouted'),
    'target observations escaped assigned coverage or failed to improve reports');
  const targeted=db.players[strongOp.targets[0].pid],
    targetedView=aiMarketObservation(db,targeted,strong);
  assert(targetedView.source==='scouted',
    'market AI did not consume the active scouting report');
  const targetIds=new Set(strongOp.targets.map(x=>x.pid)),
    untouched=Object.values(db.players).find(p=>!p.retired&&!p.team&&
      !targetIds.has(p.id)&&covered.has(aiScoutingTargetRegion(db,p)));
  assert(untouched&&aiMarketObservation(db,untouched,strong).source==='public',
    'active operation refreshed the whole covered region instead of selected targets');

  const state=strong.scoutingState;
  assert(state.lastOperation===strongOp&&state.operations.at(-1)===strongOp,
    'operation audit trail was not retained by the club scouting state');
  const packed=packDB(db);
  db=unpackDB(packed);
  const restored=db.teams[strong.id],restoredOp=restored.scoutingState.lastOperation,
    restoredTarget=db.players[strongOp.targets[0].pid];
  assert(restoredOp.targets.length===strongOp.targets.length&&
    near(restored.finance.prepaid.scoutingExpense,strongOp.spent)&&
    aiMarketObservation(db,restoredTarget,restored).source==='scouted',
    'active scouting operation failed save/restore');

  console.log('D03_SCOUTING_OPS_ACCEPTANCE '+JSON.stringify({
    strong:{capacity:strongOp.capacity,targets:strongOp.targets.length,
      regions:strongOp.assignments.map(a=>a.region),spent:strongOp.spent,
      scouts:staffByRole(restored,'scout').length,
      knowledgeGain:strongOp.targets.map(x=>x.afterKnowledge-x.beforeKnowledge)},
    weak:{capacity:weakOp.capacity,targets:weakOp.targets.length,
      regions:weakOp.assignments.map(a=>a.region),spent:weakOp.spent},
    poor:{runway:poorOp.runway,targetLimit:poorOp.targetLimit,spent:poorOp.spent},
    unitCost:strongOp.unitCost,visitGain:aiScoutingVisitGain(),
    saveFormat:JSON.parse(packed).saveFormat
  }));
})();`;
vm.runInNewContext(source,{console,Date,Math,JSON,Set,Map,WeakMap,Object,
  Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},{timeout:30000});
