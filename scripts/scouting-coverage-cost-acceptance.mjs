import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {runEngineFixture} from './test-harness.mjs';
// Exact public faa1547 baseline; compare actual assignments, writers and saves.
const original=String.raw`function aiScoutingCoveragePlan(db,t,candidates,capacity){
  const f=ensureFacilities(t),
    slots=Math.min(Object.keys(db.regions).length,Math.max(1,Math.ceil(capacity/3))),
    grouped={};
  for(const p of candidates){
    const region=aiScoutingTargetRegion(db,p);if(!region||!db.regions[region])continue;
    (grouped[region]=grouped[region]||[]).push(p);
  }
  const regionScore=region=>{
    const rows=(grouped[region]||[]).map(p=>aiScoutingPublicFit(db,t,p))
      .sort((a,b)=>b-a).slice(0,3);
    return rows.length?rows.reduce((a,b)=>a+b,0)/rows.length:-Infinity;
  };
  const regions=[t.region,...Object.keys(db.regions)
    .filter(r=>r!==t.region)
    .sort((a,b)=>regionScore(b)-regionScore(a)||a.localeCompare(b))]
    .filter((r,i,x)=>x.indexOf(r)===i).slice(0,slots);
  return regionalScoutingAssignments(db,t,regions).map(({region,scoutIds})=>({
    region,
    leagues:aiScoutingLeagueKeys(db,region),
    scoutIds,
    scoutingFacility:f.scouting,
    publicPool:(grouped[region]||[]).length
  }));
}
`;
assert.equal(createHash('sha256').update(original).digest('hex'),'3dd03026aa88ea1dd3673e1289f9285c76cb1d6d52594ae0e39dee203e0c9a14');
const result=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('SCOUTING_COVERAGE_COST '+m)},db=buildWorld(),teams=activeTeams(db,null,1);setManagedTeam(db,teams[0].id);
 const saved=packDB(db),before=coverageBeforeMemo,after=aiScoutingCoveragePlan,fit=aiScoutingPublicFit,rows=[];
 let calls=0;aiScoutingPublicFit=(...args)=>{calls++;return fit(...args)};
 for(let i=0;i<3;i++){
  const a=unpackDB(saved),b=unpackDB(saved),left=a.teams[teams[i+1].id],right=b.teams[teams[i+1].id],ca=Object.values(a.players).filter(p=>aiScoutingEligibleTarget(a,left,p)),cb=Object.values(b.players).filter(p=>aiScoutingEligibleTarget(b,right,p));
  calls=0;const old=before(a,left,ca,6),beforeCalls=calls;calls=0;const next=after(b,right,cb,6),afterCalls=calls;
  check(JSON.stringify(old)===JSON.stringify(next)&&JSON.stringify(a)===JSON.stringify(b)&&packDB(a)===packDB(b),'assignment or complete state/save changed');
  check(afterCalls>0&&afterCalls<beforeCalls,'duplicate public scores not reduced or stale cross-owner reuse');rows.push({team:left.id,beforeCalls,afterCalls});
  ca[0].reputation=cb[0].reputation=99;left.philosophy=right.philosophy='youth';
  calls=0;const refreshed=after(b,right,cb,6);check(calls>0&&JSON.stringify(before(a,left,ca,6))===JSON.stringify(refreshed),'public input changes did not refresh per-call scores');
 }
 const a=unpackDB(saved),b=unpackDB(saved);aiScoutingCoveragePlan=before;calls=0;const old=aiRunActiveScouting(a),beforeCalls=calls;
 aiScoutingCoveragePlan=after;calls=0;const next=aiRunActiveScouting(b),afterCalls=calls;
 check(JSON.stringify(old)===JSON.stringify(next)&&JSON.stringify(a)===JSON.stringify(b)&&packDB(a)===packDB(b),'actual scouting operations/cash/observations/whole save changed');
 check(afterCalls<beforeCalls,'actual operation pipeline did not avoid repeated public scoring');
 const privateDb=unpackDB(saved),team=privateDb.teams[teams[1].id],candidates=Object.values(privateDb.players).filter(p=>aiScoutingEligibleTarget(privateDb,team,p)),foreign=candidates.find(p=>p.region!==team.region),properties=[];
 for(const key of ['attrs','pot','pool']){properties.push([key,Object.getOwnPropertyDescriptor(foreign,key)]);Object.defineProperty(foreign,key,{configurable:true,get(){throw Error('hidden truth read '+key)}})}
 check(JSON.stringify(before(privateDb,team,candidates,6))===JSON.stringify(after(privateDb,team,candidates,6)),'private boundary differs');
 for(const [key,desc] of properties){if(desc)Object.defineProperty(foreign,key,desc);else delete foreign[key]}
 aiScoutingCoveragePlan=after;aiScoutingPublicFit=fit;
 return {teams:teams.length,rows,actualOperations:old.length,beforeCalls,afterCalls,wholeStateAndSaveSame:true,actualCashAndObservationsSame:true,publicInputsRefresh:true,hiddenTruthUnread:true};
})()`,{setupSources:['const coverageBeforeMemo=('+original+');']});
assert.equal(result.wholeStateAndSaveSame,true);
console.log('SCOUTING_COVERAGE_COST_ACCEPTANCE',JSON.stringify(result));
