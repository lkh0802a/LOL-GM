// Run inside an isolated export of PR #315 at the exact reviewed HEAD.
// Synthetic inputs; no real regulations, user saves or registrations.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('VN',{teams:10,system:'franchise',div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),R=db.regions.VN,top=activeTeams(db,'VN',1)[0],academy=reserveTeamsOf(db,top)[0];
 const p=genPlayer(db,new RNG('tier-owned-fixture'),{region:'VN',role:ROLES[0],age:22,base:60});signContract(db,p,academy,1,3);
 if(!academy||!academy.academyOnly||R.div2)throw Error('synthetic one-tier academy setup missing');
 const before=packDB(db),draft=unpackDB(before),A=draft.teams[academy.id],L=draft.regions.VN;
 const snapshot=x=>({div2:x.regions.VN.div2,academyOnly:x.teams[academy.id].academyOnly,parent:x.teams[academy.id].parent,roster:[...x.teams[academy.id].roster],license:x.teams[academy.id].competitionLicense,registration:x.teams[academy.id].registration??null});
 const original=snapshot(db),beforeCreate=snapshot(draft);createDiv2(draft,new RNG('tier-create-probe'),L);
 const afterCreate=snapshot(draft),comp=leagueComp(draft,'VN',2),post=packDB(draft),restored=unpackDB(post);
 if(packDB(db)!==before)throw Error('synthetic source changed');
 // An optional owned academy is separate from whether a formal second tier exists.
 const optionalConfig=defaultWorldConfig();optionalConfig.regions=[regionCfg('VN',{teams:10,system:'relegation',div2:false})];optionalConfig.internationals=[];
 const optional=buildWorld(optionalConfig),optionalRegion=optional.regions.VN,optionalParent=activeTeams(optional,'VN',1)[0];
 optional.world={year:optional.year,phase:'offseason',manage:'manual',seasons:{}};
 const optionalAcademy=makeAcademy(optional,new RNG('optional-academy'),optionalParent);
 const player=genPlayer(optional,new RNG('optional-academy-player'),{region:'VN',role:ROLES[0],age:22,base:60});signContract(optional,player,optionalAcademy,1,3);
 const optionalSource=packDB(optional),candidate=unpackDB(optionalSource),events=[],beforeOptional={requirement:reserveRequirement(candidate,candidate.teams[optionalParent.id]),active:candidate.teams[optionalAcademy.id].active,team:candidate.players[player.id].team,contract:candidate.players[player.id].contract};
 let reconcileError=null;try{reconcileTier2Structure(candidate,new RNG('optional-reconcile'),candidate.regions.VN,e=>events.push(e))}catch(e){reconcileError=e.message}
 const observed={error:reconcileError,before:beforeOptional,after:{active:candidate.teams[optionalAcademy.id].active,team:candidate.players[player.id].team,contract:candidate.players[player.id].contract},events,originalUnchanged:packDB(optional)===optionalSource};
 let optionalRestore=null;try{const saved=unpackDB(packDB(candidate));optionalRestore={active:saved.teams[optionalAcademy.id].active,team:saved.players[player.id].team,contract:saved.players[player.id].contract}}catch(e){optionalRestore={error:e.message}}
 // Use controlled league results to reach the actual offseason caller as a separate fixture.
 const viaSeason=unpackDB(optionalSource),seasonTeams=activeTeams(viaSeason,'VN',1),matches=[];
 const seasonId='optional-academy-controlled-season';
 for(let i=0;i<seasonTeams.length;i++)for(let j=i+1;j<seasonTeams.length;j++){
  const a=seasonTeams[i].id,b=seasonTeams[j].id;matches.push({id:seasonId+'-'+i+'-'+j,a,b,res:{winner:a,score:[1,0]}});
 }
 viaSeason.competitions[seasonId]={id:seasonId,region:'VN',teams:seasonTeams.map(t=>t.id),stages:[{id:'regular',name:'Regular',type:'round_robin',legs:1,bestOf:1}]};
 viaSeason.world.seasons[seasonId]={id:seasonId,comp:seasonId,region:'VN',div:1,split:1,done:true,champion:seasonTeams[0].id,stageData:{regular:{teams:seasonTeams.map(t=>t.id)}},days:[{stage:'regular',matches}]};
 const seasonBefore=packDB(viaSeason),seasonEvents=[];let seasonError=null;
 try{promotionRelegation(viaSeason,viaSeason.world,new RNG('optional-season'),e=>seasonEvents.push(e))}catch(e){seasonError=e.message}
 const seasonResult={controlledResults:true,error:seasonError,active:viaSeason.teams[optionalAcademy.id].active,playerTeam:viaSeason.players[player.id].team,contract:viaSeason.players[player.id].contract,
  originalUnchanged:packDB(optional)===optionalSource,changed:packDB(viaSeason)!==seasonBefore,events:seasonEvents,
  playerHistory:viaSeason.players[player.id].careerEvents.filter(e=>e.type==='club_closure'),closure:viaSeason.teams[optionalAcademy.id].finance.closureSettlement};
 const seasonRestored=unpackDB(packDB(viaSeason));seasonResult.restore={active:seasonRestored.teams[optionalAcademy.id].active,playerTeam:seasonRestored.players[player.id].team,contract:seasonRestored.players[player.id].contract,playerHistory:seasonRestored.players[player.id].careerEvents.filter(e=>e.type==='club_closure'),closure:seasonRestored.teams[optionalAcademy.id].finance.closureSettlement};
 console.log('TIER2_CREATION_OBSERVATION '+JSON.stringify({synthetic:true,optionalReconciliation:{...observed,restore:optionalRestore},seasonCaller:seasonResult,initial:beforeCreate,after:afterCreate,competitionContainsAcademy:comp.teams.includes(academy.id),competitionTeams:comp.teams.length,restored:snapshot(restored),originalUnchanged:packDB(db)===before,originalMatches:JSON.stringify(snapshot(db))===JSON.stringify(original)}));
})();`);
