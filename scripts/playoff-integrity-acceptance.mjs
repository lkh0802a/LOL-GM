import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {runEngineFixture} from './test-harness.mjs';
const archive=await readFile(new URL('../docs/evidence/originals/competition-493ffe2.js.gz',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(archive),'65fe9a96f736087475529cf804d4b196c2eb464d6276895c3382d0ed1d9a5100');
const prior=gunzipSync(archive);assert.equal(sha(prior),'3ed196f4b3c56e2687133dfd52a8281db9dd493cbaa0806c9f2a2ccebe2dcf33');
const old=prior.toString(),round=old.slice(old.indexOf('function deRound('),old.indexOf('// 스위스:')),stages=old.slice(old.indexOf('function leagueStages('),old.indexOf('// 국제대회:'));
assert(round.includes('function deAfter(')&&stages.includes('take>=6&&n>=8?8:4'));
const result=await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('PLAYOFF_INTEGRITY '+m)},key='playoff-probe';
 const defaults=buildWorld(),formats=['KR','NA','EU','CN','AP','BR'].map(id=>{const r=defaults.regions[id],po=leagueStages(r,activeTeams(defaults,id,1).length,1).at(-1);check(po.take===r.playoffTake,'declared entrants '+id);return {id,take:po.take,type:po.type}});
 check(legacyDE.stages(defaults.regions.NA,10,1).at(-1).take===8,'retained original discrepancy');
 function make(n,bo=1){
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:Math.max(10,n),div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),clubs=activeTeams(db,'NA',1);startCareer(db,clubs[0].id,'de-probe-'+n);for(const t of setupTeamsForManager(db))autoBuildInitialSquad(db,t,new RNG('de-probe/'+t.id));finalizeInitialRosters(db);
  const reference=Object.values(db.competitions).find(c=>c.region==='NA'&&c.div===1),c={...reference,id:'DE_PROBE',name:'Double elimination diagnostic',teams:clubs.slice(0,n).map(t=>t.id),stages:[{id:'playoffs',name:'Playoffs',type:'double_elim',take:n,bestOf:bo,dayGap:[3,3]}]};db.competitions[c.id]=c;
  db.world.seasons[key]=newSeason(db,c.id,db.year,'de-'+n,'2027-05-01');return db;
 }
 function step(db){
  const s=db.world.seasons[key],d=s.days[s.cur];check(d&&d.matches.length,'scheduled next day');check(d.matches.every(m=>m.a!==m.b&&db.competitions[s.comp].teams.includes(m.a)&&db.competitions[s.comp].teams.includes(m.b)),'self/foreign entrant');
  setWorldCalendarDate(db,d.date);playDay(db,s);
 }
 function complete(db,saveAt=0){let steps=0;while(!db.world.seasons[key].done&&steps<120){step(db);if(++steps===saveAt)db=unpackDB(packDB(db));}check(db.world.seasons[key].done,'bracket did not terminate');return db;}
 function audit(db,n,bo){
  const s=db.world.seasons[key],c=db.competitions[s.comp],matches=s.days.flatMap(d=>d.matches),losses=Object.fromEntries(c.teams.map(t=>[t,0]));let games=0;
  for(const m of matches){check(m.res&&(m.res.winner===m.a||m.res.winner===m.b),'actual result');check(m.bo===bo,'declared Bo');losses[m.a===m.res.winner?m.b:m.a]++;for(const g of m.res.games){check(g.publicRecord?.ending.kind==='nexus','actual nexus source');games++;}}
  check(matches.length===2*n-2,'no missing entrants or reset series');check(s.stageData.playoffs.rounds.filter(r=>r.br==='GF').length===1,'exactly one final');
  check(new Set(s.stageData.playoffs.elim).size===n-1&&!s.stageData.playoffs.elim.includes(s.champion),'one champion and all other entrants retained');
  check(c.teams.every(t=>t===s.champion?losses[t]<=1:t===s.runnerUp?losses[t]===(losses[s.champion]===1?1:2):losses[t]===2),'elimination loss invariant');
  check(Object.values(s.pstats).reduce((sum,p)=>sum+p.g,0)===games*10,'byes minted player games');
  let size=1;while(size<n)size*=2;check(s.stageData.playoffs.rounds[0].byes.length===size-n,'seeded initial byes');
  const restored=unpackDB(packDB(db));check(JSON.stringify(restored.world.seasons[key].pstats)===JSON.stringify(s.pstats)&&restored.world.seasons[key].champion===s.champion,'results/statistics save');
  return {n,bo,series:matches.length,nexusGames:games,championLosses:losses[s.champion],oneFinal:true,allEntrantsAccounted:true,save:true};
 }
 const rows=[];let fixture=null;
 for(const n of [4,6,8,12,16,24]){
  const bo=n===6?5:1,base=make(n,bo),snapshot=packDB(base),db=complete(unpackDB(snapshot));rows.push(audit(db,n,bo));if(n===6)fixture=packDB(db);
  if(n===6||n===8){const saved=complete(unpackDB(snapshot),3);check(packDB(saved)===packDB(db),'mid-bracket native save determinism '+n);}
 }
 check(rows.some(r=>r.championLosses===0)&&rows.some(r=>r.championLosses===1),'both upper/lower final outcomes');
 const current={round:deRound,after:deAfter},legacy=[];
 for(const n of [6,8]){
  let db;
  try{
   deRound=legacyDE.round;deAfter=legacyDE.after;db=make(n);
   if(n===6)step(db);else for(let i=0;i<30;i++){const sd=db.world.seasons[key].stageData.playoffs;if(sd.lb.length===2&&sd.drop.length===1&&sd.rounds.at(-1).br==='LX')break;step(db);}
  }finally{deRound=current.round;deAfter=current.after;}
  const original=JSON.stringify(db);let loaded=unpackDB(packDB(db));const prefix=loaded.world.seasons[key].days.flatMap(d=>d.matches).filter(m=>m.res).map(m=>[m.id,JSON.stringify(m.res)]);
  loaded=complete(loaded);const s=loaded.world.seasons[key];for(const [id,raw] of prefix)check(JSON.stringify(s.days.flatMap(d=>d.matches).find(m=>m.id===id).res)===raw,'old completed match rewritten');check(JSON.stringify(db)===original,'original old save mutated');
  const matches=s.days.flatMap(d=>d.matches),losses=Object.fromEntries(loaded.competitions[s.comp].teams.map(t=>[t,0]));for(const m of matches)losses[m.a===m.res.winner?m.b:m.a]++;
  check(matches.length===2*n-2&&loaded.competitions[s.comp].teams.every(t=>t===s.champion?losses[t]<=1:t===s.runnerUp?losses[t]===(losses[s.champion]===1?1:2):losses[t]===2),'old in-progress entrants lost');legacy.push({n,retainedActualSeries:prefix.length,totalSeries:matches.length});
 }
 // A completed old bracket remains historical truth, including its old defect.
 let archiveDb;
 try{deRound=legacyDE.round;deAfter=legacyDE.after;archiveDb=complete(make(8));}finally{deRound=current.round;deAfter=current.after;}
 archiveDb=unpackDB(packDB(archiveDb));const archived=JSON.stringify(archiveDb.world.seasons[key]),history=JSON.stringify(archiveDb.history),c=archiveDb.competitions.DE_PROBE;
 check(archiveDb.world.seasons[key].days.flatMap(d=>d.matches).length===13,'old broken source retained');
 archiveDb.competitions.DE_PROBE={...c,stages:leagueStages(archiveDb.regions.NA,c.teams.length,1)};
 newSeason(archiveDb,'DE_PROBE',archiveDb.year,'next-de','2027-10-01','next-playoff');
 check(JSON.stringify(archiveDb.world.seasons[key])===archived&&JSON.stringify(archiveDb.history)===history,'future format rewrote completed archive');
 const restoredArchive=unpackDB(packDB(archiveDb));check(JSON.stringify(restoredArchive.world.seasons[key])===archived,'old archive save changed');
 return {fixture,formats,rows,midBracketNativeSaveEqual:true,legacy,oldCompletedArchiveUnchanged:true,fullWorldSeasonNotRun:true};
})()`,{setupSources:['const legacyDE=(()=>{'+round+stages+';return {round:deRound,after:deAfter,stages:leagueStages};})();'],timeout:180000});
if(process.env.PLAYOFF_INTEGRITY_FIXTURE)await writeFile(process.env.PLAYOFF_INTEGRITY_FIXTURE,JSON.stringify({game:result.fixture}));
delete result.fixture;assert(result.oldCompletedArchiveUnchanged&&result.midBracketNativeSaveEqual);console.log('PLAYOFF_INTEGRITY_ACCEPTANCE',JSON.stringify(result));
