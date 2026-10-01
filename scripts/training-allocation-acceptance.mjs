import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(x,m)=>{if(!x)throw Error('TRAINING_ALLOCATION '+m)};
  for(const intensity of ['normal','light','high']){
    let plan={...defaultTraining(),intensity};
    for(const k of Object.keys(ATTR_GROUPS)){
      plan=setTrainingAllocation(plan,k,100);
      check(Object.keys(ATTR_GROUPS).every(g=>Number.isFinite(plan[g])),'slider produced NaN');
      check(Object.keys(ATTR_GROUPS).reduce((s,g)=>s+plan[g],0)<=100,'point budget exceeded');
      check(plan.intensity===intensity,'allocation changed intensity');
    }
  }
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),t=activeTeams(db)[0],p=Object.values(db.players).find(p=>!p.team&&!p.retired);
  signContract(db,p,t,1,3);
  t.training={mechanical:NaN,laning:null,combat:'NaN',macro:Infinity,mental:20,intensity:'high'};
  const restored=unpackDB(packDB(db)),rt=restored.teams[t.id];
  check(Object.keys(ATTR_GROUPS).every(k=>rt.training[k]===20)&&rt.training.intensity==='high','damaged saved plan not repaired');
  growPlayer(db,p,new RNG('training-invalid','growth'),0,{});
  check(Object.values(p.attrs).every(Number.isFinite),'invalid plan poisoned player growth');
  const zero={mechanical:0,laning:0,combat:0,macro:0,mental:0,intensity:'light'};
  check(JSON.stringify(normalizeTraining(zero))===JSON.stringify(zero),'valid zero allocation changed');
  check(JSON.stringify(normalizeTraining(defaultTraining()))===JSON.stringify(defaultTraining()),'valid default changed');
  console.log('TRAINING_ALLOCATION_ACCEPTANCE: PASS (all intensities, point limits, old-save recovery, real growth, zero allocation)');
})();`);
