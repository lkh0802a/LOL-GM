import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {runEngineFixture} from './test-harness.mjs';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const e=JSON.parse(await readFile(new URL('docs/evidence/draft-staff-profile-clock-2026-10-21.json',root)));
const zipped=await readFile(new URL(e.archive.path,root));assert.equal(zipped.length,e.archive.bytes);assert.equal(sha(zipped),e.archive.sha256);
const originals=JSON.parse(gunzipSync(zipped));for(const [p,h] of Object.entries(e.originals))assert.equal(sha(originals[p]),h);
for(const [p,h] of Object.entries(e.sources))assert.equal(sha(await readFile(new URL(p,root))),h);
const part=(text,a,b)=>{const start=text.indexOf(a),end=text.indexOf(b,start);assert(start>=0&&end>start);return text.slice(start,end)};
const prior=part(originals['staff.js'],'function staffProfile(', '\nfunction staffDevelopmentFor').replace('function staffProfile','function priorStaffProfile')+
 part(originals['draft-analysis.js'],'function draftMasteryObservation(', '\nfunction draftMetaEvidence').replace('function draftMasteryObservation','function priorDraftMasteryObservation').replaceAll('staffProfile(', 'priorStaffProfile(');
const result=await runEngineFixture(prior+String.raw`
(()=>{
 const same=(a,b,msg)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error('DRAFT_STAFF_PROFILE '+msg)};
 let profiles=0,observations=0;
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:false})];const db=buildWorld(cfg);startCareer(db,'VXG','staff-subset-acceptance');
 const teams=Object.values(db.teams).filter(t=>t.active!==false),fields=['draft','analysis','development','recovery','scouting'];
 for(const t of [null,...teams]){
  const expected=priorStaffProfile(t);same(staffProfile(t),expected,'all fields');profiles++;
  for(const requested of [[],['scouting'],['scouting','analysis'],fields]){same(staffProfile(t,requested),Object.fromEntries(requested.map(k=>[k,expected[k]])),'selected fields');profiles++;}
 }
 const observer=teams.find(t=>t.id==='VXG'),target=teams.find(t=>t.id!==observer.id),player=db.players[target.roster[0]],cid=Object.keys(db.patch.champions)[0];
 const state={db,teamIds:[observer.id,target.id],ctx:{byTeam:{}}};
 const compare=()=>{for(const p of [null,player])for(const side of [0,1]){same(draftMasteryObservation(state,0,side,p,cid),priorDraftMasteryObservation(state,0,side,p,cid),'live observation');observations++;}};
 compare();const saved=packDB(db),member=teamStaffMembers(observer)[0];
 if(member){member.rating=98;member.specialties={scout:93,analyst:87};member.role='performanceCoach';}
 compare();same(staffProfile(observer),priorStaffProfile(observer),'current changed staff');
 const restored=unpackDB(saved);state.db=restored;compare();
 setManagedTeam(restored,null);compare();
 return {profiles,observations,changedAppointment:true,saveRestore:true,manualAndAutonomous:true};
})()`,{timeout:30000,filename:'draft-staff-profile-acceptance.js'});
console.log('DRAFT_STAFF_PROFILE_ACCEPTANCE '+JSON.stringify(result));

// The original null/missing-player comparisons above remain intact. Exercise
// actual roster members and the real staff sign/release writers as well.
const native=await runEngineFixture(prior+String.raw`
(()=>{
 const check=(ok,msg)=>{if(!ok)throw Error('NATIVE_STAFF_SUBSET '+msg)},cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:false})];cfg.internationals=[];
 let db=buildWorld(cfg);const team=activeTeams(db,'NA',1)[0];startCareer(db,team.id,'native-staff-subset');autoBuildInitialSquad(db,team,new RNG('staff-subset-roster'),5);finalizeInitialRosters(db);negotiationStore(db);recruitmentStore(db);
 const other=activeTeams(db,'NA',1).find(t=>t.id!==team.id),ids=[team.id,other.id],champions=Object.keys(db.patch.champions).slice(0,2);let observations=0;
 const compare=()=>{const state={db,teamIds:ids,ctx:{byTeam:{}}},before=JSON.stringify(db);
  for(const side of [0,1])for(const cid of champions){const p=db.players[db.teams[ids[side]].roster[0]];check(p,'real roster member');const actual=draftMasteryObservation(state,0,side,p,cid),expected=priorDraftMasteryObservation(state,0,side,p,cid);check(JSON.stringify(actual)===JSON.stringify(expected),'actual observation/full original parity');observations++;}
  check(JSON.stringify(db)===before,'live observation pure');};
 compare();const t=db.teams[team.id],candidate=(db.staffPool||[]).map(s=>({s,command:{type:'staff.sign',actor:'manager',teamId:t.id,sid:s.id,years:2,salary:staffAskingSalary(db,t,s)}})).find(x=>previewWorldAction(db,x.command).ok);check(candidate,'actual lawful staff offer');
 const signed=commitWorldAction(db,candidate.command);check(signed.ok&&teamStaffMembers(db.teams[team.id]).some(s=>s.id===candidate.s.id),'real staff appointment');compare();
 const saved=packDB(db);db=unpackDB(saved);compare();check(packDB(db)===saved,'native staff save restored');
 const released=commitWorldAction(db,{type:'staff.release',actor:'manager',teamId:team.id,sid:candidate.s.id});check(released.ok&&!teamStaffMembers(db.teams[team.id]).some(s=>s.id===candidate.s.id),'real staff release');compare();
 const foreign=db.players[db.teams[other.id].roster[0]],descriptor=Object.getOwnPropertyDescriptor(foreign,'pool');Object.defineProperty(foreign,'pool',{configurable:true,get(){throw Error('private foreign mastery read');}});
 try{const state={db,teamIds:ids,ctx:{byTeam:{}}};for(const cid of champions){check(JSON.stringify(draftMasteryObservation(state,0,1,foreign,cid))===JSON.stringify(priorDraftMasteryObservation(state,0,1,foreign,cid)),'foreign hidden pool never read');}}finally{Object.defineProperty(foreign,'pool',descriptor);}
 db.world.fired=true;compare();db.world.fired=false;setManagedTeam(db,null);compare();
 return {actualRosterObservations:observations,actualStaffSignRelease:true,wholeOriginalValues:true,nativeSave:true,hiddenForeignPool:true,firedAndAutonomous:true};
})()`,{timeout:30000,filename:'native-staff-subset-acceptance.js'});
assert(native.actualStaffSignRelease&&native.hiddenForeignPool);
console.log('NATIVE_STAFF_SUBSET_ACCEPTANCE '+JSON.stringify(native));
