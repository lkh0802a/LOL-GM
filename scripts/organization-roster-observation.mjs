// Synthetic legacy registration observation; no real game or save slot is modified.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:true,system:'franchise'})];cfg.internationals=[];
  const db=buildWorld(cfg),parent=activeTeams(db,'NA',1)[0],reserve=reserveTeamsOf(db,parent)[0];
  if(!reserve)throw Error('missing synthetic reserve');
  db.world={year:db.year,phase:'offseason',manage:'manual',registrationVersion:1,seasons:{}};
  setManagedTeam(db,parent.id);
  for(const t of [parent,reserve])for(const role of ROLES){
    const p=genPlayer(db,new RNG('organization-roster|'+t.id+role),{region:t.region,role,age:22,base:65});
    signContract(db,p,t,1,3);t.depthChart[role]=p.id;
  }
  initializeOfficialRegistrations(db);
  const registrations={[parent.id]:parent.registration.players.slice(),[reserve.id]:reserve.registration.players.slice()};
  const before=packDB(db),individual=[parent,reserve].map(t=>officialRegistrationErrors(db,t,registrations[t.id],registrations));
  const plan=previewWorldAction(db,{type:'roster.register',actor:'manager',teamId:parent.id,registrations});
  const unique=new Set([...parent.roster,...reserve.roster]);
  const initialErrors=initialOrganizationErrors(db,parent),profile=rosterRulesForTeam(db,parent);
  const copy=unpackDB(before),copyBefore=packDB(copy);let finalizationError=null;
  try{finalizeInitialRosters(copy)}catch(error){finalizationError=error.message}
  const compliant=unpackDB(before),compliantReserve=compliant.teams[reserve.id];
  const extra=genPlayer(compliant,new RNG('organization-roster-extra'),{region:compliantReserve.region,role:ROLES[0],age:22,base:60});
  signContract(compliant,extra,compliantReserve,.1,3);
  const compliantErrors=initialOrganizationErrors(compliant,compliant.teams[parent.id]);
  console.log('ORGANIZATION_ROSTER_OBSERVATION '+JSON.stringify({synthetic:true,individual,preview:plan.ok,
    previewErrors:plan.errors??[],contractPlayers:unique.size,profile:profile.id,integratedMin:profile.integratedMin,
    initialErrors,finalizationError,copyUnchanged:packDB(copy)===copyBefore,
    compliantPlayers:organizationRoster(compliant,compliant.teams[parent.id]).length,compliantErrors,
    originalUnchanged:packDB(db)===before}));
})();`);
