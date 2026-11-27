import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error(m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:true,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),t=activeTeams(db,'NA',1)[0],p=Object.values(db.players).find(p=>!p.team&&!p.retired);
 db.world={year:db.year,seed:'contract-history',phase:'season',manage:'manual',seasons:{},steps:[],step:0};signContract(db,p,t,3,2);const id=p.id,initial=JSON.stringify(p.contract),e=(p.careerEvents||[]).filter(x=>x.type==='contract').at(-1);
 check(e&&e.salary===p.contract.salary,'contract event missing');
 const base=packDB(db),copy=unpackDB(base),q=copy.players[id];
 for(let n=0;n<120;n++)recordPlayerEvent(q,'synthetic_observation',copy.year,{ordinal:n,date:copy.worldDate});
 const restored=unpackDB(packDB(copy)),v=restored.players[id];
 check(packDB(db)===base,'source changed');
 console.log(JSON.stringify({eventBefore:!!e,eventAfter:v.careerEvents.some(x=>x.type==='contract'),count:v.careerEvents.length,currentContractSame:JSON.stringify(v.contract)===initial,syntheticOnly:true}));
})();`);
