import assert from 'node:assert/strict';
import {runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('PATCH_REWORK '+m)},passed=[];
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:false})];cfg.internationals=[];
 const base=buildWorld(cfg),cid=Object.keys(base.patch.champions)[0],opponent=Object.keys(base.patch.champions)[1],teamIds=activeTeams(base).map(t=>t.id);
 startCareer(base,teamIds[0],'patch-rework-fixture');autoBuildInitialSquad(base,base.teams[teamIds[0]],new RNG('patch-rework-fixture','squad'),5);finalizeInitialRosters(base);
 const initialId=base.patch.id;
 const fixture=()=>{
  const db=JSON.parse(JSON.stringify(base)),c=db.patch.champions[cid],old=c.base.hp;
  const correction={type:'base',c:cid,key:'hp',old,new:old+1,dir:1,size:'micro',category:'balance'};applyNote(db.patch,correction);
  db.patches.history=[{id:'review-prior',date:'2027-01-01',notes:[correction]},{id:'review-1',date:'2027-01-10',notes:[]},{id:'review-2',date:'2027-02-10',notes:[]}];
  db.patches.list=db.patches.history.slice();db.patch.id='review-3';db.worldDate='2027-04-01';db.metaHistory=[];
  for(const [wi,id] of ['review-1','review-2','review-3'].entries())for(let i=0;i<400;i++){
   const picked=i<8;db.metaHistory.push({date:'2027-0'+(wi+1)+'-20',patch:id,regions:['NA'],sides:[
    {team:teamIds[i%4],region:'NA',win:false,picks:picked?[{champ:cid,role:'TOP',player:'controlled-player-'+(i%4)}]:[]},
    {team:teamIds[(i+4)%teamIds.length],region:'NA',win:true,picks:[{champ:opponent,role:'TOP',player:'controlled-opponent-'+i}]}],bans:[]});
  }
  return db;
 };
 const review=db=>diagnosePatchMeta(db).reviews.find(r=>r.cid===cid),test=(name,fn)=>{fn();passed.push(name)};
 test('zero picks never create buffs or mandatory reworks',()=>{
  const db=fixture();db.metaHistory=db.metaHistory.map(r=>({...r,sides:r.sides.map(s=>({...s,picks:s.picks.filter(p=>p.champ!==cid)}))}));
  const d=diagnosePatchMeta(db),c=d.champions.find(x=>x.cid===cid);check(c.dir===0&&c.buffSignal===0,'zero-pick buff');
  check(review(db).status==='observe','zero-pick candidate');check(!maybeChampionRework(db,db.worldDate,true,{chance:()=>true},d).length,'forced RNG filled empty rework quota');
 });
 test('persistent weak role after actual prior correction can be a minor candidate',()=>{const r=review(fixture());check(r.status==='candidate'&&r.scope==='mid','missing independently observed candidate')});
 test('missing previous repair remains observation',()=>{const db=fixture();db.patches.history[0].notes=[];check(review(db).status==='observe','unrepaired low use became structural diagnosis')});
 test('one recent active window protects usage without a participation target',()=>{const db=fixture();for(let i=808;i<820;i++)db.metaHistory[i].bans=[cid];check(review(db).status==='retain','current ban/selection pressure ignored')});
 test('healthy niche role is retained',()=>{const db=fixture();for(let i=0;i<8;i++)db.metaHistory[i].sides[0].win=true;check(review(db).status==='retain','successful niche reworked')});
 test('uncertain role blocks structural escalation',()=>{const db=fixture();db.metaHistory[0].sides[0].picks[0].role='MID';check(review(db).status==='observe','single off-role loss treated as proven role failure')});
 test('a single team is not broad structural evidence',()=>{const db=fixture();for(const r of db.metaHistory)r.sides[0].team=teamIds[0];check(review(db).status==='observe','team concentration ignored')});
 test('concentrated use and missing role remain uncertain',()=>{const db=fixture();for(const r of db.metaHistory)if(r.sides[0].picks.length){r.sides[0].team=teamIds[0];r.sides[0].picks[0].player='single-specialist';}db.metaHistory[0].sides[0].team=teamIds[1];db.metaHistory[0].sides[0].picks[0].player='one-other';check(review(db).status==='observe','nominal second team defeated concentration guard');const missing=fixture();delete missing.metaHistory[0].sides[0].picks[0].role;check(review(missing).status==='observe','missing role accepted')});
 test('new and pro-locked champions lack exposure',()=>{const db=fixture();db.patch.champions[cid].proEligibleDate='2027-04-02';check(review(db).status==='observe','locked champion judged');db.patch.champions[cid].proEligibleDate='2027-03-25';check(review(db).status==='observe','pre-eligibility rows counted')});
 test('missing and future dates are not historical opportunities',()=>{const db=fixture();for(let i=0;i<400;i++)db.metaHistory[i].date=null;check(review(db).status==='observe','unknown dates counted');for(let i=0;i<400;i++)db.metaHistory[i].date='2028-01-01';check(review(db).status==='observe','future observations counted')});
 test('sparse third window is not replaced by older volume',()=>{const db=fixture();db.metaHistory=db.metaHistory.slice(0,810);check(review(db).status==='observe','short current window filled from history')});
 test('a recent adjustment resets the independent observation requirement',()=>{const db=fixture();db.patches.history[2].notes=db.patches.history[0].notes.slice();check(review(db).status==='observe','immediate repeat after change')});
 test('major requires a previous minor rework plus new observation',()=>{const db=fixture();db.patches.history[0].notes=[{type:'rework',c:cid,scope:'mid',stableId:cid}];const r=review(db);check(r.status==='candidate'&&r.scope==='major','no escalation after failed minor');db.patches.history[0].notes[0].scope='major';check(review(db).status==='observe','major remake loop')});
 test('manager identity never changes diagnosis or selected rework',()=>{
  const db=fixture(),before=JSON.stringify(db),a=diagnosePatchMeta(db);check(JSON.stringify(db)===before,'read mutated world');
  db.manager.teamId=teamIds[7];
  check(JSON.stringify(diagnosePatchMeta(db))===JSON.stringify(a),'manager affected evidence');
 });
 test('existing annual caps and no ordinary-patch reworks',()=>{const db=fixture(),d=diagnosePatchMeta(db),rng={chance:()=>true};check(!maybeChampionRework(db,db.worldDate,false,rng,d).length,'ordinary patch rework');db.patches.reworksByYear[2027]=2;db.patches.majorReworksByYear[2027]=1;check(!maybeChampionRework(db,db.worldDate,true,rng,d).length,'annual cap bypass')});
 test('actual selected notes preserve identity and store contemporaneous review',()=>{
  const db=fixture(),before=JSON.stringify(db.patch.champions[cid]),rng=new RNG('patch-review-actual'),identity=({id,name,nameKo,roles,arch,dmg})=>({id,name,nameKo,roles,arch,dmg}),ident=JSON.stringify(identity(db.patch.champions[cid]));
  rng.chance=()=>true;const notes=maybeChampionRework(db,db.worldDate,true,rng,diagnosePatchMeta(db));
  check(notes[0]?.type==='rework'&&notes[0].scope==='mid'&&notes[0].stableId===cid,'wrong actual rework');for(const n of notes)applyNote(db.patch,n);
  check(JSON.stringify(identity(db.patch.champions[cid]))===ident,'identity/roles rewritten');check(JSON.stringify(db.patch.champions[cid])!==before,'notes have no actual state effects');
  const p=newPatch(db,db.worldDate,false,new RNG('patch-review-record')),record=db.patches.history.at(-1);check(record.analysis.reworkReview.allChampionsRequired===false,'mandatory participation flag');
  const packed=packDB(db),restored=unpackDB(packed);check(JSON.stringify(restored.patches.history.at(-1).analysis)===JSON.stringify(record.analysis),'review history lost in full save');
  check(JSON.stringify(review(restored))===JSON.stringify(review(db)),'restored observations differ');
  const savedAnalysis=JSON.stringify(record.analysis);restored.metaHistory=[];check(JSON.stringify(restored.patches.history.at(-1).analysis)===savedAnalysis,'past review rewritten from present');
 });
 test('win interval bounds and zero information',()=>{check(patchWinInterval(0,0).upper===1,'zero sample confidence');check(patchWinInterval(0,1).upper>.47,'one loss overconfident');check(patchWinInterval(0,8).upper<.47,'known Wilson bound');check(patchWinInterval(8,8).lower>.47,'known successful niche bound')});
 return {passed,controlledEvidence:true,fixtures:'synthetic observations exercise policy, not measured professional frequencies',baselinePatch:initialId,lowUsePolicy:'no required professional appearance, no low-use-only buff/rework'};
})()`,{timeout:120000});
assert.equal(result.passed.length,17);
console.log('PATCH_REWORK_ACCEPTANCE '+JSON.stringify(result));
