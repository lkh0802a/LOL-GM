import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const check=(truth,why)=>{if(!truth)throw Error('TIER_POLICY_CORRECTION '+why)};
  const initial=defaultWorldConfig();
  check(initial.regions.every(r=>r.div2&&r.tier2Required),'six founding major leagues retain their existing tier 2');
  check(regionCfg('VN').tier2Required===false,'emerging region incorrectly requires a second league');
  const cfg=defaultWorldConfig();
  cfg.regions=[regionCfg('VN',{teams:10,system:'franchise',div2:false})];
  cfg.internationals=[];
  const db=buildWorld(cfg),R=db.regions.VN;
  check(!R.div2&&!R.tier2Required,'new region silently founded a formal second tier');
  const top=activeTeams(db,'VN',1)[0],owned=reserveTeamsOf(db,top)[0];
  check(!!owned&&owned.academyOnly===true&&reserveRequirement(db,top)==='required',
    'franchise Academy duty incorrectly depends on an official tier-2 league');
  check(owned.parent===top.id&&owned.competitionLicense.current.kind==='reserve',
    'Academy lost its owned-club licensing identity');
  const license=top.competitionLicense.id,academyLicense=owned.competitionLicense.id;
  const failBefore=JSON.stringify({license:top.competitionLicense,academy:owned.competitionLicense});
  check(psTeam(db,top)===psOf(db,'VN'),'top-tier scale changed');
  check(psTeam(db,owned)===psOf(db,'VN')*0.35,'legacy reserve budget changed');
  const third={id:'tier3-test',region:'VN',division:3,parent:null};
  check(clubLicenseState(db,third).kind==='open','independent tier-3 classified as franchise');
  let blocked=false;try{psTeam(db,third)}catch{blocked=true}
  check(blocked,'unapproved 3+ finance silently inherited top-tier budget');
  R.divisionEconomy={3:{payScaleRatio:0.18}};
  check(Math.abs(psTeam(db,third)-psOf(db,'VN')*.18)<1e-9,'approved division budget not used');
  check(JSON.stringify({license:top.competitionLicense,academy:owned.competitionLicense})===failBefore,
    'pure club-license or finance read mutated existing license records');
  const saved=unpackDB(packDB(db));
  check(saved.teams[owned.id].academyOnly===true&&saved.teams[owned.id].parent===top.id
    &&saved.teams[top.id].competitionLicense.id===license
    &&saved.teams[owned.id].competitionLicense.id===academyLicense,
    'Academy-only and licenses did not persist');
  // No lower competition, no eligible promotions: retaining incumbents is
  // mandatory. A missing replacement is not a legitimate closure event.
  const second=defaultWorldConfig();
  second.regions=[regionCfg('VN',{teams:10,system:'relegation',div2:false,relegate:2})];
  second.internationals=[];
  const d=buildWorld(second),region=d.regions.VN,teams=activeTeams(d,'VN',1);
  d.world={year:d.year,phase:'offseason',seed:'tier-promotions',seasons:{}};
  const id='tier-no-lower-league';
  const matches=[];
  for(let i=0;i<teams.length;i++)for(let j=i+1;j<teams.length;j++){
    const a=teams[i].id,b=teams[j].id;
    matches.push({id:id+'-'+i+'-'+j,a,b,res:{winner:a,score:[1,0]}});
  }
  d.competitions[id]={id,region:'VN',teams:teams.map(t=>t.id),stages:[{id:'regular',name:'Regular',type:'round_robin',legs:1,bestOf:1}]};
  d.world.seasons[id]={id,comp:id,region:'VN',div:1,split:1,done:true,champion:teams[0].id,
    stageData:{regular:{teams:teams.map(t=>t.id)}},days:[{stage:'regular',matches}]};
  const originally=teams.map(t=>t.id).sort(),events=[];
  promotionRelegation(d,d.world,new RNG('tier-promotions'),e=>events.push(e));
  check(activeTeams(d,'VN',1).map(t=>t.id).sort().join('|')===originally.join('|'),
    'relegation without an eligible promoted club closed/replaced an incumbent');
  check(teams.every(t=>t.active!==false),'incumbents were folded');
  check(events.some(t=>t.includes('잔류')),'missing eligible promotion not reported');
  console.log('TIER_POLICY_CORRECTION PASS (major initial, optional 2nd tier, owned academy, license, finance, promotion retention, save)');
})();`);