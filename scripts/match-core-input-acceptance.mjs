import assert from 'node:assert/strict';
import {runEngineFixture} from './test-harness.mjs';

const result=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('MATCH_CORE_INPUT '+m)},copy=x=>JSON.parse(JSON.stringify(x));
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:2,div2:true,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1),reserve=reserveTeamsOf(db,a)[0];
 for(const t of [a,b,reserve]){
  for(const role of ROLES){const p=genPlayer(db,new RNG('core-input|'+t.id+'|'+role),{region:'NA',role,age:22,base:65});signContract(db,p,t,1,2,{})}
  initializeDepthChart(db,t,true);
 }
 db.world={phase:'season',year:db.year,manage:'manual',seasons:{},registrationVersion:1};initializeOfficialRegistrations(db);
 const session=createSeriesSession(db,a.id,b.id,3,'actual-prepared-input',{fearless:true});
 const prepared=seriesSessionPrepareGame(db,session),view=officialMatchView(db,null,prepared.blue,prepared.red);
 const draft=runDraft(view,[prepared.blue,prepared.red],makeStreams(prepared.gseed).draft,prepared.snap);
 const before=JSON.stringify(db),sessionBefore=JSON.stringify(session),draftBefore=JSON.stringify(draft);
 const input=matchCoreInputFromResolvedDraft(view,prepared,draft,'existing-fixture-game-id'),kernel=new MatchCoreKernel(input);
 check(input.seed===prepared.gseed&&input.matchId==='existing-fixture-game-id','existing identity/seed changed');
 check(JSON.stringify(db)===before&&JSON.stringify(session)===sessionBefore&&JSON.stringify(draft)===draftBefore,'input adapter wrote producer');
 for(const [i,tid] of [prepared.blue,prepared.red].entries())for(const role of ROLES){
  const actor=input.teams[i].actors.find(p=>p.role===role);
  check(actor.id===view.teams[tid].depthChart[role]&&actor.championId===draft.picks[i][role],'resolved role/player/pick changed');
 }
 const initial=kernel.snapshot();
 const oldDraft=runDraft,oldPrepare=seriesSessionPrepareGame,oldStarter=starterFor,oldInitialize=initializeDepthChart;
 const forbidden=()=>{throw Error('adapter reran a state owner')};
 runDraft=forbidden;seriesSessionPrepareGame=forbidden;starterFor=forbidden;initializeDepthChart=forbidden;
 try{check(JSON.stringify(matchCoreInputFromResolvedDraft(view,prepared,draft,'existing-fixture-game-id'))===JSON.stringify(input),'read-only admission reran owner')}
 finally{runDraft=oldDraft;seriesSessionPrepareGame=oldPrepare;starterFor=oldStarter;initializeDepthChart=oldInitialize}
 check(kernel.command(prepared.red,{id:'foreign',type:'wait',actorId:input.teams[0].actors[0].id,durationMs:1}).code==='ACTOR_AUTHORITY','projected identity lost authority');
 check(JSON.stringify(kernel.snapshot())===JSON.stringify(initial),'foreign projected command wrote');
 check(initial.result===null&&initial.mechanicsStatus==='NOT_IMPLEMENTED','metadata admitted physical result');
 const oldRevision=db.patch._revision;db.patch._revision=97;draft.picks[0].TOP='changed';input.teams[0].actors[0].id='changed';
 check(JSON.stringify(kernel.snapshot())===JSON.stringify(initial),'producer/consumer alias changed match input');
 db.patch._revision=oldRevision;draft.picks[0].TOP=JSON.parse(draftBefore).picks[0].TOP;
 const clean=JSON.stringify(db),reject=(fn,label)=>{let failed=false;try{fn()}catch{failed=true}check(failed,label);check(JSON.stringify(db)===clean,'invalid input wrote world')};
 const adapt=(p=prepared,d=draft,id='existing-fixture-game-id',v=view)=>matchCoreInputFromResolvedDraft(v,p,d,id);
 reject(()=>adapt({...prepared,red:prepared.blue}),'same team accepted');
 reject(()=>adapt({...prepared,blue:'unknown'}),'unknown team accepted');
 reject(()=>adapt({...prepared,gseed:3}),'invented seed accepted');reject(()=>adapt(prepared,draft,''),'missing identity accepted');
 for(const change of [d=>{delete d.picks[0].MID},d=>{d.picks[0].TOP='unknown'},d=>{d.picks[1].MID=d.picks[0].TOP}]){
  const bad=copy(draft);change(bad);reject(()=>adapt(prepared,bad),'damaged resolved picks accepted');
 }
 const mismatched=view.teams[prepared.blue].depthChart.TOP,otherPlayer=view.teams[prepared.blue].depthChart.MID;
 reject(()=>adapt(prepared,draft,'existing-fixture-game-id',{...view,players:{...view.players,[mismatched]:view.players[otherPlayer]}}),'player key/identity mismatch accepted');
 const patch=view.patch;
 for(const bad of [{...patch,_revision:NaN},{...patch,_revision:-1},{...patch,championSource:{version:'latest'}},{...patch,championSource:null}])
  reject(()=>adapt(prepared,draft,'existing-fixture-game-id',{...view,patch:bad}),'unversioned metadata accepted');
 const team=view.teams[prepared.blue],saved={...team.depthChart};
 team.depthChart.TOP=team.depthChart.MID;const invalidBefore=JSON.stringify(db);
 let failed=false;try{adapt()}catch{failed=true}check(failed&&JSON.stringify(db)===invalidBefore,'duplicate lineup repaired or accepted');team.depthChart=saved;
 // Existing official registration is independent of training/employment squad moves.
 const pid=a.registration.depthChart?.TOP||a.depthChart.TOP;
 db.players[pid].team=reserve.id;a.roster=a.roster.filter(id=>id!==pid);reserve.roster.push(pid);
 const official=officialMatchView(db,null,prepared.blue,prepared.red),officialBefore=JSON.stringify(db);
 const registered=adapt(prepared,draft,'existing-fixture-game-id',official);
 check(registered.teams.find(t=>t.id===a.id).actors.some(p=>p.id===pid),'official entrant replaced with training roster');
 check(JSON.stringify(db)===officialBefore&&db.players[pid].team===reserve.id,'official adapter changed assignment');
 const medical=db.players[pid].medical;db.players[pid].medical={daysLeft:2,out:true};
 let blocked=false;const medicalBefore=JSON.stringify(db);try{adapt(prepared,draft,'existing-fixture-game-id',official)}catch{blocked=true}
 check(blocked&&JSON.stringify(db)===medicalBefore,'unavailable entrant admitted/replaced');db.players[pid].medical=medical;
 // The trusted eligibility owner may read medical, but attrs/private/future data must not enter the kernel input.
 for(const t of registered.teams)for(const actor of t.actors){
  const p=db.players[actor.id];for(const key of ['attrs','pool','futureResult'])Object.defineProperty(p,key,{configurable:true,get(){throw Error('private '+key)}});
 }
 const hidden=adapt(prepared,draft,'existing-fixture-game-id',official);new MatchCoreKernel(hidden);
 check(hidden.teams.every(t=>t.actors.every(p=>Object.keys(p).sort().join(',')==='championId,id,role')),'private fields projected');
 const resumed=MatchCoreKernel.restore(JSON.stringify(initial));check(JSON.stringify(resumed.snapshot())===JSON.stringify(initial),'native input roundtrip');
 return {realResolvedDraft:true,existingSeed:true,officialRegistration:true,readOnly:true,damagedInputRejected:true,
  noLineupRepair:true,identityOnly:true,pinnedMetadata:true,nativeRoundtrip:true,physicalGames:0,operatingResultPathSwitched:false};
})()`,{timeout:60000,filename:'match-core-input-acceptance.js'});
assert.equal(result.readOnly,true);assert.equal(result.physicalGames,0);
console.log('MATCH_CORE_INPUT_ACCEPTANCE '+JSON.stringify(result));
