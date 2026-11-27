// Proposed acceptance for an isolated #315 export; never opens real saves.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('OPTIONAL_ACADEMY '+m)};
 for(const system of ['relegation','mixed']){
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('VN',{teams:10,system,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),R=db.regions.VN,parent=activeTeams(db,'VN',1).find(t=>reserveRequirement(db,t)==='optional');
  check(!!parent,'optional parent not found: '+system);
  db.world={year:db.year,phase:'offseason',manage:'manual',seasons:{}};
  const academy=makeAcademy(db,new RNG('optional-academy-'+system),parent);
  const p=genPlayer(db,new RNG('optional-player-'+system),{region:'VN',role:ROLES[0],age:22,base:60});signContract(db,p,academy,1,3);
  const original=packDB(db),copy=unpackDB(original),player=copy.players[p.id],contract=JSON.stringify(player.contract),events=[];
  reconcileTier2Structure(copy,new RNG('optional-reconcile-'+system),copy.regions.VN,e=>events.push(e));
  check(copy.teams[academy.id].active!==false,'active Academy was closed: '+system);
  check(player.team===academy.id&&JSON.stringify(player.contract)===contract,'contract or employer changed: '+system);
  check(!events.some(e=>e.includes(academy.name+' 산하 2군 운영 종료')),'unexpected closure event: '+system);
  const restored=unpackDB(packDB(copy));
  check(restored.teams[academy.id].active!==false&&restored.players[p.id].team===academy.id&&JSON.stringify(restored.players[p.id].contract)===contract,'restored academy differs: '+system);
  check(packDB(db)===original,'source fixture changed: '+system);
 }
 console.log('OPTIONAL_ACADEMY_PROPOSED_ACCEPTANCE PASS (relegation/mixed, contract, save, source)');
})();`);
