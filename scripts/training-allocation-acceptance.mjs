import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(x,m)=>{if(!x)throw Error('TRAINING_RETIREMENT '+m)};
  check(typeof defaultTraining==='undefined'&&typeof normalizeTraining==='undefined'&&
    typeof setTrainingAllocation==='undefined'&&typeof trainingIntensity==='undefined',
    'legacy manual training functions still exposed');
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),t=activeTeams(db)[0],p=Object.values(db.players).find(p=>!p.team&&!p.retired);
  check(p&&t&&!Object.hasOwn(t,'training'),'new teams still carry manual training sliders');
  signContract(db,p,t,1,3);
  p.age=19;p.pot=99;for(const key of Object.keys(p.attrs))p.attrs[key]=50;
  const before=JSON.parse(JSON.stringify(db));
  const legacy=JSON.parse(JSON.stringify(before)),lt=legacy.teams[t.id],lp=legacy.players[p.id];
  lt.training={mechanical:NaN,laning:null,combat:'NaN',macro:Infinity,mental:20,intensity:'high',focus:'champions'};
  lt.practiceUsage={year:legacy.year,days:365,individual:99999};
  lp.practiceUsage={year:legacy.year,days:365,individual:99999};
  lp.practiceDay={date:legacy.worldDate,individual:99999};
  const normalized=unpackDB(packDB(legacy));
  check(!Object.hasOwn(normalized.teams[t.id],'training')&&!Object.hasOwn(normalized.teams[t.id],'practiceUsage')&&
    !Object.hasOwn(normalized.players[p.id],'practiceUsage')&&!Object.hasOwn(normalized.players[p.id],'practiceDay'),
    'legacy save training fields survived migration');
  const a=JSON.parse(JSON.stringify(before)),b=JSON.parse(JSON.stringify(before));
  b.teams[t.id].training={mechanical:0,laning:100,combat:0,macro:0,mental:0,intensity:'high'};
  growPlayer(a,a.players[p.id],new RNG('retired-training','growth'),0,{});
  growPlayer(b,b.players[p.id],new RNG('retired-training','growth'),0,{});
  check(JSON.stringify(a.players[p.id].attrs)===JSON.stringify(b.players[p.id].attrs),
    'retired manual training fields still change attributes');
  check(Object.values(a.players[p.id].attrs).every(Number.isFinite),'growth became nonfinite');
  const official=JSON.parse(JSON.stringify(before));
  growPlayer(official,official.players[p.id],new RNG('retired-training','growth'),30,{});
  check(JSON.stringify(official.players[p.id].attrs)!==JSON.stringify(a.players[p.id].attrs),
    'actual official appearances no longer affect growth');
  console.log('TRAINING_RETIREMENT_ACCEPTANCE PASS (new teams, legacy save, invariance, appearance-based growth)');
})();`);
