import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(x,m)=>{if(!x)throw Error('CLUB_OWNERSHIP '+m)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:true,system:'franchise'})];cfg.internationals=[];
  const db=buildWorld(cfg),t=activeTeams(db,'NA',1)[0],child=reserveTeamsOf(db,t)[0];
  const p=Object.values(db.players).find(p=>!p.team&&!p.retired);signContract(db,p,t,1,3);
  t.registration={year:db.year,players:[p.id],depthChart:{[p.role]:p.id},history:[]};
  const continuity=()=>JSON.stringify({id:t.id,region:t.region,division:t.division,
    license:t.license,franchised:t.franchised,registration:t.registration,roster:t.roster,
    staff:t.staff,contract:p.contract,finance:t.finance,parent:child.parent,manager:db.manager,history:db.history});
  const before=continuity(),owner=t.owner.id,name=t.name;
  transferClubOwnership(db,t,{name:'New Holdings Esports',wealth:80,reason:'acceptance'});
  check(t.owner.id!==owner&&t.owner.wealth===80&&t.owner.patience===2,'owner did not change');
  check(continuity()===before,'acquisition altered club license, contracts, finances or history');
  check(t.ownershipHistory[0].previousOwner.id===owner&&t.ownershipHistory[0].previousName===name&&t.ownershipHistory[0].continuity==='same-club','missing predecessor evidence');
  const first=t.owner.id;transferClubOwnership(db,t,{name:'Second Holdings',wealth:60,reason:'acceptance'});
  check(t.owner.id!==first&&t.ownershipHistory[1].previousOwner.id===first,'identity chain broken');
  const saved=unpackDB(packDB(db));check(JSON.stringify(saved.teams[t.id].ownershipHistory)===JSON.stringify(t.ownershipHistory),'save lost history');
  delete t.owner.id;delete t.owner.name;delete t.ownershipSerial;delete t.ownershipHistory;
  const legacy=unpackDB(packDB(db));check(legacy.teams[t.id].owner.id&&legacy.teams[t.id].ownershipHistory.length===0,'legacy restore invented events');
  const childBefore=JSON.stringify(child);let rejected=false;
  try{transferClubOwnership(db,child,{name:'Illegal independent sale',wealth:80,reason:'test'})}catch{rejected=true}
  check(rejected&&JSON.stringify(child)===childBefore,'owned reserve sold independently');
  // Exercise the existing ordinary-acquisition writer, not only the helper.
  const oldOwners=new Map(activeTeams(db,null,1).map(x=>[x.id,ensureClubOwnership(x).id]));
  const rng=new RNG('ownership-production','office');rng.chance=p=>p>0&&p<.04;
  worldDecisions(db,rng,1,()=>{});
  check(activeTeams(db,null,1).some(x=>x.owner.id!==oldOwners.get(x.id)&&x.ownershipHistory.some(e=>e.reason==='office-approved-acquisition')),'production acquisition only renamed club');
  const troubled=activeTeams(db,null,1).find(x=>x.id===p.team),oldOwner=troubled.owner.id;
  troubled.finance.cash=-1000;troubled.finance.history=[{year:db.year-1,net:-100,cash:-1000}];
  p.contract.salary=1000;
  closeFinances(db,{year:db.year,seasons:{}},new RNG('ownership-recapitalization','finance'),()=>{});
  check(troubled.owner.id!==oldOwner&&troubled.ownershipHistory.at(-1).reason==='financial-recapitalization','financial sale omitted owner chain');
  const statement=troubled.finance.history.at(-1);
  check(statement.capital.newOwner>0&&statement.cash===troubled.finance.cash,'capital statement lost recapitalization');
  check(p.team===troubled.id&&p.contract.salary===1000,'sale reset existing employment');
  console.log('CLUB_OWNERSHIP_ACCEPTANCE: PASS (license/contracts/finance/history continuity, distinct owners, reserve guard, legacy save, production acquisition)');
})();`);
