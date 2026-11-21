// Synthetic legacy split transition observation; not an approved closure or season format.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(v,msg)=>{if(!v)throw Error('PRIZE_SPLIT_TRANSITION_OBSERVATION '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:false,splits:3})];cfg.internationals=[];
  const db=buildWorld(cfg),clubs=activeTeams(db,'NA',1).slice(0,3),R=db.regions.NA,id=R.short;
  check(clubs.length===3,'missing synthetic clubs');
  db.world={year:db.year,seed:'split-prize',phase:'season',manage:'manual',seasons:{},
    steps:[{kind:'league',split:1},{kind:'league',split:2}],step:0,lastDate:db.worldDate,majorPatchEvents:[]};
  for(const t of clubs.slice(0,2))for(const role of ROLES){
    const p=genPlayer(db,new RNG('split-prize|'+t.id+role),{region:t.region,role,age:22,base:65});
    signContract(db,p,t,1,3);t.depthChart[role]=p.id;
  }
  db.competitions[id]={id,name:'Synthetic split prize',short:id,region:'NA',teams:clubs.slice(0,2).map(t=>t.id),rules:{fearless:true},
    stages:[{id:'regular',name:'Regular',type:'round_robin',legs:1,bestOf:1}]};
  const key=id+'-1',s=newSeason(db,id,db.year,'split-prize-1',db.worldDate,key);
  s.key=key;s.region='NA';s.div=1;s.split=1;s.step=0;db.world.seasons[key]=s;
  playDay(db,s);check(s.done,'synthetic first split did not complete');
  const raw=JSON.stringify(db),copy=JSON.parse(raw),closed=clubs[1].id,entrant=clubs[2].id;
  const snapshot=JSON.stringify(copy.world.seasons[key].formatSnapshot.teams),planBefore=financeCloseoutPrizes(copy,copy.world);
  foldTeam(copy,copy.teams[closed]);
  check(copy.teams[closed].active===false,'controlled closure failed');
  advanceStep(copy);
  const current=copy.competitions[id].teams,after=copy.world.seasons[key],planAfter=financeCloseoutPrizes(copy,copy.world);
  check(copy.world.step===1&&copy.world.seasons[id+'-2'],'next split not created');
  check(JSON.stringify(after.formatSnapshot.teams)===snapshot,'past snapshot changed');
  check(!current.includes(closed)&&current.includes(entrant),'current active list did not reflect closure');
  const worldBeforeClose=JSON.stringify(copy.world.seasons[key].formatSnapshot.teams);
  closeFinances(copy,copy.world,new RNG('split-prize-close','finance'),()=>{});
  const ledger={closed:copy.teams[closed].finance.history.at(-1)?.rev?.prize??null,
    entrant:copy.teams[entrant].finance.history.at(-1)?.rev?.prize??null};
  const restored=unpackDB(packDB(copy));
  check(JSON.stringify(restored.world.seasons[key].formatSnapshot.teams)===worldBeforeClose,'restore changed historical snapshot');
  check((restored.teams[entrant].finance.history.at(-1)?.rev?.prize??null)===ledger.entrant,'restore changed entrant ledger');
  check(JSON.stringify(db)===raw,'original synthetic world changed');
  console.log('PRIZE_SPLIT_TRANSITION_OBSERVATION '+JSON.stringify({synthetic:true,actualFirstMatch:true,
    controlledFormat:true,controlledClubClosure:true,fullSeason:false,closed,entrant,
    snapshot:JSON.parse(snapshot),current,planBefore,planAfter,ledger,
    originalUnchanged:true,syntheticRestore:true,actualUserSave:false,confirmedPrizeDebt:false}));
})();`);
