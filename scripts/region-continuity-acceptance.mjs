import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(x,m)=>{if(!x)throw Error('REGION_CONTINUITY '+m)};
  const cfg=defaultWorldConfig();cfg.regions=['VN','JP','OC','TR','ME'].map(id=>regionCfg(id,{teams:10,div2:true,system:'franchise'}));cfg.internationals=[];
  const db=buildWorld(cfg);
  db.world={year:db.year,phase:'offseason',seed:'region-merger',seasons:{}};
  for(const r of Object.values(db.regions)){r.tier='emerging';r.parent=null;r.metrics=[{hype:20},{hype:20}]}
  db.worldHype=100;
  const low=Object.values(db.regions).sort((a,b)=>a.strength-b.strength),[a,b]=low,
    host=a.strength>=b.strength?a:b,gone=host===a?b:a;
  const parent=activeTeams(db,gone.id,1)[0],reserve=reserveTeamsOf(db,parent)[0];
  check(reserve,'missing owned reserve fixture');
  const p=Object.values(db.players).find(p=>!p.retired&&!p.team);signContract(db,p,reserve,1,3);
  const protectedState=()=>JSON.stringify({club:parent.id,reserve:reserve.id,parent:reserve.parent,division:reserve.division,
    roster:reserve.roster,staff:reserve.staff,contract:p.contract,finance:reserve.finance,history:db.history});
  const before=protectedState(),rng=new RNG('region-merger','office');rng.chance=p=>p===.4;
  worldDecisions(db,rng,1,()=>{});
  check(!db.regions[gone.id]&&parent.region===host.id&&reserve.region===host.id,'production merger did not move organization');
  check(reserve.parent===parent.id&&reserve.division===2&&host.div2,'reserve became independent first team');
  check(protectedState()===before,'merger changed employment, financial or historical continuity');
  check(reserve.regionHistory.at(-1).continuity==='same-club'&&db.global.regionHistory.at(-1).source===gone.id,'succession evidence missing');
  const saved=unpackDB(packDB(db));check(saved.teams[reserve.id].parent===parent.id&&saved.global.regionHistory.at(-1).source===gone.id,'save lost successor chain');
  const target=Object.values(db.regions).find(r=>r.id!==host.id);target.div2=false;
  moveClubForRegionReorganization(db,parent,target.id,'regional-independence');
  recordRegionSuccession(db,host.id,[host.id,target.id],'regional-independence');
  check(reserve.region===target.id&&target.div2&&reserve.parent===parent.id,'split lost owned reserve');
  check(!(host.predecessors||[]).includes(host.id),'split created self-predecessor');
  const snap=JSON.stringify(parent);let rejected=false;
  try{moveClubForRegionReorganization(db,parent,'missing','test')}catch{rejected=true}
  check(rejected&&JSON.stringify(parent)===snap,'invalid destination partly moved club');
  console.log('REGION_CONTINUITY_ACCEPTANCE: PASS (production merger, split organization, owned reserves, contracts/history, saved succession, invalid destination)');
})();`);
