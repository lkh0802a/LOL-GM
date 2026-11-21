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
  // Explicit synthetic profiles isolate profile selection from actual region policy provenance.
  const profiles=['ENGINE_OWNED_RESERVE','LCS_2026','STANDARD_TIER1_2026'].map(id=>{
    const variant=unpackDB(before),root=variant.teams[parent.id];
    variant.regions[root.region].rosterRuleProfile=id;
    const snapshot=packDB(variant),rule=rosterRulesForTeam(variant,root);
    const rosterSizes=()=>activeTeams(variant).map(t=>({id:t.id,players:t.roster.length}));
    const sizesBefore=rosterSizes();
    const errors=initialOrganizationErrors(variant,root);
    let finalizeError=null;
    try{finalizeInitialRosters(variant)}catch(error){finalizeError=error.message}
    const after=packDB(variant),pre=JSON.parse(snapshot),post=JSON.parse(after);
    const changedRootKeys=Array.from(new Set([...Object.keys(pre),...Object.keys(post)])).filter(key=>JSON.stringify(pre[key])!==JSON.stringify(post[key]));
    const changedTeamFields=Object.keys(post.teams).flatMap(id=>Object.keys(post.teams[id]).filter(key=>JSON.stringify(pre.teams[id]?.[key])!==JSON.stringify(post.teams[id][key])).map(key=>({id,key})));
    let restoredPlayers=null,restoreError=null,retryError=null,retryUnchanged=null,reloadedRetryError=null,reloadedRetryUnchanged=null;
    try{
      const restored=unpackDB(after);restoredPlayers=organizationRoster(restored,restored.teams[parent.id]).length;
      if(finalizeError){
        const restoredBefore=packDB(restored);
        try{finalizeInitialRosters(restored)}catch(error){reloadedRetryError=error.message}
        reloadedRetryUnchanged=packDB(restored)===restoredBefore;
        try{finalizeInitialRosters(variant)}catch(error){retryError=error.message}
        retryUnchanged=packDB(variant)===after;
      }
    }catch(error){restoreError=error.message}
    return {id,integratedMin:rule.integratedMin,players:organizationRoster(variant,root).length,
      errors,finalizeError,unchangedAfterFailure:finalizeError?after===snapshot:null,restoredPlayers,restoreError,retryError,retryUnchanged,reloadedRetryError,reloadedRetryUnchanged,changedRootKeys,changedTeamFields,
      sizeChanges:rosterSizes().filter((v,i)=>v.players!==sizesBefore[i].players).map(v=>({id:v.id,before:sizesBefore.find(x=>x.id===v.id).players,after:v.players}))};
  });
  // In a separate fixture, repair the managed organization and populate every AI role.
  // These synthetic signings are not a replay of real contracts or economic provenance.
  const repaired=unpackDB(before);
  function repairSynthetic(target,addManaged=true){
  if(addManaged){const targetExtra=genPlayer(target,new RNG('repair-managed-extra'),{region:'NA',role:ROLES[0],age:22,base:60});
  signContract(target,targetExtra,target.teams[reserve.id],.1,3);}
  for(const team of activeTeams(target).filter(t=>![parent.id,reserve.id].includes(t.id))){
    for(const role of ROLES){
      const player=genPlayer(target,new RNG('repair-ai|'+team.id+'|'+role),{region:team.region,role,age:22,base:60});
      signContract(target,player,team,.1,3);team.depthChart[role]=player.id;
    }
  }
  for(const team of activeTeams(target).filter(t=>t.parent&&t.id!==reserve.id)){
    while(team.roster.length<initialLegalMinimumTarget(target,team)){
      const player=genPlayer(target,new RNG('repair-extra|'+team.id+'|'+team.roster.length),{region:team.region,role:ROLES[0],age:22,base:60});
      signContract(target,player,team,.1,3);
    }
  }
  }
  repairSynthetic(repaired);
  const repairedBefore=packDB(repaired);let repairedError=null;
  try{finalizeInitialRosters(repaired)}catch(error){repairedError=error.message}
  const repairedResult={error:repairedError,completed:!!repaired.firstSeasonSetup?.completed,
    phase:repaired.world?.phase,changed:packDB(repaired)!==repairedBefore,managedPlayers:organizationRoster(repaired,repaired.teams[parent.id]).length};
  // Compare repair after a failure that has already changed depth charts with a fresh same-profile repair.
  const retry=unpackDB(before),fresh=unpackDB(before);
  retry.regions.NA.rosterRuleProfile='LCS_2026';fresh.regions.NA.rosterRuleProfile='LCS_2026';
  const retryBefore=packDB(retry);let firstError=null,retryError=null,freshError=null,reloadedError=null;
  try{finalizeInitialRosters(retry)}catch(error){firstError=error.message}
  const afterFirst=packDB(retry),reloaded=unpackDB(afterFirst);repairSynthetic(retry,false);repairSynthetic(fresh,false);repairSynthetic(reloaded,false);
  try{finalizeInitialRosters(retry)}catch(error){retryError=error.message}
  try{finalizeInitialRosters(fresh)}catch(error){freshError=error.message}
  try{finalizeInitialRosters(reloaded)}catch(error){reloadedError=error.message}
  const retryAfterRepair={firstError,failedChanged:afterFirst!==retryBefore,retryError,freshError,reloadedError,
    retryCompleted:!!retry.firstSeasonSetup?.completed,freshCompleted:!!fresh.firstSeasonSetup?.completed,
    retryPhase:retry.world?.phase,freshPhase:fresh.world?.phase,
    retryManaged:organizationRoster(retry,retry.teams[parent.id]).length,
    freshManaged:organizationRoster(fresh,fresh.teams[parent.id]).length,
    packedEqual:packDB(retry)===packDB(fresh),reloadedEqual:packDB(reloaded)===packDB(fresh)};
  const compliant=unpackDB(before),compliantReserve=compliant.teams[reserve.id];
  const extra=genPlayer(compliant,new RNG('organization-roster-extra'),{region:compliantReserve.region,role:ROLES[0],age:22,base:60});
  signContract(compliant,extra,compliantReserve,.1,3);
  const compliantErrors=initialOrganizationErrors(compliant,compliant.teams[parent.id]);
  console.log('ORGANIZATION_ROSTER_OBSERVATION '+JSON.stringify({synthetic:true,individual,preview:plan.ok,
    previewErrors:plan.errors??[],contractPlayers:unique.size,profile:profile.id,integratedMin:profile.integratedMin,
    initialErrors,finalizationError,profiles,repairedResult,retryAfterRepair,copyUnchanged:packDB(copy)===copyBefore,
    compliantPlayers:organizationRoster(compliant,compliant.teams[parent.id]).length,compliantErrors,
    originalUnchanged:packDB(db)===before}));
})();`);
