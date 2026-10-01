import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error('CONTRACT_ROLE_PROMISE '+msg)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];
  cfg.internationals=[];
  const db=buildWorld(cfg),[team,other]=activeTeams(db),
    p=Object.values(db.players).find(p=>!p.team&&!p.retired),
    comp={id:'PROMISE_DOMESTIC',international:false};
  db.competitions[comp.id]=comp;
  setManagedTeam(db,team.id);db.world={phase:'market',manage:'manual',year:db.year};
  usageFor(p,db.year).teamGames=30;
  signContract(db,p,team,asking(db,p,team.region)*2,2,{promisedRole:'starter'});
  check(contractRolePromiseStatus(db,p).teamGames===0,
    'contract counted earlier club/contract appearances');
  setRosterRole(db,p,'backup','manager',true);
  check(p.contract.promisedRole==='starter'&&
    satisfactionIssues(db,p).some(x=>x.code==='promise_role')&&
    !satisfactionIssues(db,p).some(x=>x.code==='playing_time'),
    'role edit erased promise or reused pre-contract usage');
  const before=JSON.stringify(db);contractRolePromiseStatus(db,p);
  check(JSON.stringify(db)===before,'promise status mutated world');
  const trust=p.managerTrust,sat=p.satisfaction;
  const s={comp:comp.id,year:db.year},rec={a:team.id,b:other.id,
    games:Array.from({length:4},()=>({winner:team.id}))};
  for(let i=0;i<6;i++)updatePlayerUsage(db,s,rec,[]);
  const status=contractRolePromiseStatus(db,p);
  check(status.teamGames===24&&status.games===0&&
    p.satisfactionReasons.includes('playing_time')&&
    p.satisfactionReasons.includes('promise_role')&&
    p.managerTrust<trust&&p.satisfaction<sat,
    'official usage failed to penalize the actual broken promise');
  const loaded=unpackDB(packDB(db));
  check(JSON.stringify(contractRolePromiseStatus(loaded,loaded.players[p.id]))===
    JSON.stringify(status),'promise baseline lost in save');
  const disposition=renewalDisposition(p);
  applySatisfaction(db,p,{offseason:true,year:db.year});
  check(renewalDisposition(p)<disposition,
    'promise breach did not affect real renewal willingness');
  // New negotiated terms restart the observation window, not the season clock.
  signContract(db,p,team,p.contract.salary,2,{promisedRole:'backup'});
  check(contractRolePromiseStatus(db,p).teamGames===0&&
    !satisfactionIssues(db,p).some(x=>['promise_role','playing_time'].includes(x.code)),
    'agreed new role retained the old broken promise');
  signContract(db,p,team,p.contract.salary,2,{promisedRole:'starter'});
  const appearances=Array.from({length:4},()=>({pid:p.id,win:true}));
  for(let i=0;i<6;i++)updatePlayerUsage(db,s,rec,appearances);
  check(contractRolePromiseStatus(db,p).actual===1&&
    !satisfactionIssues(db,p).some(x=>['promise_role','playing_time'].includes(x.code)),
    'fulfilled starter promise generated a breach');
  signContract(db,p,team,p.contract.salary,2,{promisedRole:'starter'});
  p.medical={daysLeft:10,out:true};
  for(let i=0;i<6;i++)updatePlayerUsage(db,s,rec,[]);
  check(contractRolePromiseStatus(db,p).teamGames===0&&
    !satisfactionIssues(db,p).some(x=>x.code==='playing_time'),
    'medically unavailable games counted as refused playing opportunities');
  delete p.medical;
  // Retained-contract transfer starts fresh; first/reserve moves are not contracts.
  doTransfer(db,p,team,other,0);
  check(contractRolePromiseStatus(db,p).teamGames===0&&
    p.contract.rolePromiseStart.teamId===other.id,'transfer retained former club usage');
  // Existing saves need no fabricated timestamps or migration writes.
  delete p.contract.rolePromiseStart;p.contract.promisedRole='starter';p.rosterRole='backup';
  const legacyBefore=JSON.stringify(db),legacy=contractRolePromiseStatus(db,p);
  check(legacy.downgraded&&JSON.stringify(db)===legacyBefore,
    'legacy promise lost or status invented a baseline');
  const next=contractRolePromiseStatus(db,p,db.year+1);
  check(next.teamGames===0,'new season reused previous season usage');
  console.log('CONTRACT_ROLE_PROMISE_ACCEPTANCE '+JSON.stringify({
    officialUsage:true,roleEditProtected:true,trustRenewal:true,pureStatus:true,
    contractWindow:true,renegotiation:true,transferReset:true,saveLegacy:true,
    fulfilledPromise:true,medicalAbsence:true}));
})();`,{filename:'contract-role-promise.fixture.js'});
