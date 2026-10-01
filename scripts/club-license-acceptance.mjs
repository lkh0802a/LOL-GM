import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(x,m)=>{if(!x)throw Error('CLUB_LICENSE '+m)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:true,system:'franchise'}),
    regionCfg('EU',{teams:10,div2:true,system:'mixed'}),regionCfg('VN',{teams:10,div2:true,system:'relegation'})];cfg.internationals=[];
  const db=buildWorld(cfg);db.world={year:db.year,phase:'offseason',seed:'license',seasons:{}};
  const parent=activeTeams(db,'NA',1)[0],reserve=reserveTeamsOf(db,parent)[0];
  check(parent.competitionLicense.current.kind==='franchise'&&reserve.competitionLicense.current.kind==='reserve', 'initial approvals');
  const licenseId=parent.competitionLicense.id,reserveId=reserve.competitionLicense.id;
  const owner=parent.owner.id;
  transferClubOwnership(db,parent,{name:'License Continuing Club',wealth:70,reason:'office-approved-acquisition'});
  check(parent.competitionLicense.id===licenseId&&reserve.competitionLicense.id===reserveId,'sale created new club license');
  check(parent.competitionLicense.current.holder===parent.owner.id&&reserve.competitionLicense.current.holder===parent.owner.id&&parent.owner.id!==owner,'organization owner not transferred');
  moveClubForRegionReorganization(db,parent,'EU','regional-reorganization');
  check(parent.competitionLicense.current.kind==='certified'&&parent.license==='certified'&&reserve.competitionLicense.current.region==='EU','destination policy not applied');
  const unchanged=JSON.stringify(parent.competitionLicense);syncCompetitionLicenses(db,'repeat-review');
  check(JSON.stringify(parent.competitionLicense)===unchanged,'unchanged review duplicated history');
  const fake=(id,r,div,teams,winner,loser)=>{const matches=[];
    for(let i=0;i<teams.length;i++)for(let j=i+1;j<teams.length;j++){
      const a=teams[i].id,b=teams[j].id,win=a===winner||b===loser||(a!==loser&&b!==winner&&i<j)?a:b;
      matches.push({id:id+'-'+i+'-'+j,a,b,res:{winner:win,score:win===a?[1,0]:[0,1]}});
    }
    db.competitions[id]={id,stages:[{id:'regular'}]};
    return {id,comp:id,region:r.id,div,split:99,done:true,champion:winner,stageData:{regular:{teams:teams.map(t=>t.id)}},days:[{stage:'regular',matches}]};
  };
  for(const rid of ['EU','VN']){
    const R=db.regions[rid],first=activeTeams(db,rid,1),second=activeTeams(db,rid,2);
    const down=first.find(t=>!t.franchised),up=second.find(t=>promotionEligible(db,t));
    check(down&&up,'promotion fixture');
    const id=up.competitionLicense.id,protectedLicense=JSON.stringify(parent.competitionLicense),downId=down.competitionLicense.id;
    db.world.seasons[rid+'1']=fake(rid+'1',R,1,first,first.find(t=>t!==down).id,down.id);
    db.world.seasons[rid+'2']=fake(rid+'2',R,2,second,up.id,second.find(t=>t!==up).id);
    promotionRelegation(db,db.world,new RNG('license-promotion-'+rid),()=>{});
    check(up.division===1&&down.division===2&&up.competitionLicense.id===id&&down.competitionLicense.id===downId,'promotion changed legal identity');
    check(up.competitionLicense.current.division===1&&down.competitionLicense.current.division===2&&down.license==='open','stale license division');
    check(up.competitionLicense.history.at(-1).reason==='promotion'&&down.competitionLicense.history.at(-1).reason==='relegation','missing promotion evidence');
    check(parent.division===1&&reserve.division===2&&JSON.stringify(parent.competitionLicense)===protectedLicense,'mixed protection/reserve violated');
  }
  const plan=previewWorldAction(db,{type:'club.close',teamId:parent.id,actor:'system'});
  transferClubOwnership(db,parent,{name:'Second Continuing Club',wealth:80,reason:'sale'});
  check(!applyWorldAction(db,plan).ok,'old-owner closure preview accepted');
  const before=JSON.stringify(db),original=worldActionScopeErrors;
  worldActionScopeErrors=()=>['late license failure'];
  const failed=commitWorldAction(db,{type:'club.close',teamId:parent.id,actor:'system'});worldActionScopeErrors=original;
  check(!failed.ok&&JSON.stringify(db)===before,'failed closure left returned license');
  foldTeam(db,parent);check(parent.competitionLicense.current.status==='returned'&&reserve.competitionLicense.current.status==='returned','closure omitted license return');
  const history=JSON.stringify(parent.competitionLicense),saved=unpackDB(packDB(db));
  check(JSON.stringify(saved.teams[parent.id].competitionLicense)===history,'save lost legal history');
  const legacy=activeTeams(db,'NA',1)[0];delete legacy.competitionLicense;
  const old=unpackDB(packDB(db)).teams[legacy.id];
  check(old.competitionLicense.current.status==='approved'&&old.competitionLicense.history.length===0,'legacy save invented license events');
  console.log('CLUB_LICENSE_ACCEPTANCE: PASS (policies, owner/reserve transfer, succession, actual promotion, protected clubs, closure rollback, saves)');
})();`);
