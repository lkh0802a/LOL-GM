import {readFile} from 'node:fs/promises';
import {runEngineFixture} from './test-harness.mjs';
// Real scheduled fixture is built by the retained season-history acceptance.
// This continuation uses its archived actual output, never fabricated results.
const fixture=JSON.parse(await readFile(new URL('../docs/evidence/unemployed-season-fixture-2026-10-08.json',import.meta.url)));
const originalWriter=(await readFile(new URL('../docs/evidence/unemployed-season-original-offseason-2026-10-08.js',import.meta.url),'utf8')).split('function runOffseason(db){')[1].split('// ---------- 오프시즌 2단계')[0].replace(/^/,'function originalRunOffseason(db){');
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('UNEMPLOYED '+m)},copy=x=>unpackDB(JSON.stringify(x));
 const baseline=copy(FIXTURE),before=JSON.stringify(baseline);
 for(const mode of ['null','missing','inactive','region']){
  const db=copy(baseline);
  if(mode==='null')setManagedTeam(db,null);
  if(mode==='missing')db.manager.teamId='missing-team';
  if(mode==='inactive')managedTeam(db).active=false;
  if(mode==='region')managedTeam(db).region='missing-region';
  const team=managedTeamId(db),record=JSON.stringify(db.world.seasons['compact-official'].days[0].matches[0].res),publicBefore=JSON.stringify(db.world.seasons['compact-official'].days[0].matches[0].res.games[0].publicRecord);
  const report=runOffseason(db);check(report===db.world.report&&db.world.phase==='market','actual offseason '+mode);
  check(db.world.sponsorOffers.length===0&&managedTeamId(db)===team,'no invented sponsor/assignment '+mode);
  check(JSON.stringify(db.world.seasons['compact-official'].days[0].matches[0].res)===record,'official archive retained '+mode);
  for(const restored of [unpackDB(JSON.stringify(db)),unpackDB(packDB(db))])check(JSON.stringify(restored.world.seasons['compact-official'].days[0].matches[0].res.games[0].publicRecord)===publicBefore,'raw/compact history '+mode);
  if(mode==='null'){closeMarket(db);check(db.world.phase==='preseason'&&managedTeamId(db)===null,'actual market close without assignment');startWorldSeason(db,null,'unemployed-next');check(db.world.phase==='season'&&managedTeamId(db)===null,'actual next season');const x=playWorldDay(db);check(x&&x.advanced,'actual daily consumer')}
 }
 const managed=copy(baseline),expectedDb=copy(baseline);runOffseason(managed);originalRunOffseason(expectedDb);check(JSON.stringify(managed)===JSON.stringify(expectedDb),'valid managed whole DB original writer parity');
 check(JSON.stringify(baseline)===before,'baseline investigation purity');
 const ownFull=copy(FIXTURE),ownSeason=Object.values(ownFull.world.seasons).find(s=>s.region==='NA'),ownMatch=ownSeason.days.flatMap(d=>d.matches).find(m=>m.res),foreignMatch=ownFull.world.seasons['compact-official'].days[0].matches[0];setManagedTeam(ownFull,ownMatch.a);
 const ownedBefore=JSON.stringify(ownMatch.res),foreignBefore=JSON.stringify(foreignMatch.res.games[0].publicRecord);runOffseason(ownFull);
 check(JSON.stringify(ownMatch.res)===ownedBefore,'actual full official result remains untouched by offseason');
 const restoredOwn=unpackDB(packDB(ownFull)),ownedSaved=restoredOwn.world.seasons[ownSeason.key].days.flatMap(d=>d.matches).find(m=>m.id===ownMatch.id).res;
 check(!ownedSaved.lite&&JSON.stringify(ownedSaved)===JSON.stringify(seriesResultForSave(ownMatch.res,false)),'actual own region existing full save contract');
 check(restoredOwn.world.seasons['compact-official'].days[0].matches[0].res.lite&&JSON.stringify(restoredOwn.world.seasons['compact-official'].days[0].matches[0].res.games[0].publicRecord)===foreignBefore,'actual foreign lite public source save');
 const historic=FIXTURE.world.seasons['compact-official'].days[0].matches[0].res.games[0];check(historic.publicRecord.ending.kind==='nexus','actual source ending');
 console.log('무소속 진행 수용 통과: 실제 오프시즌·시장 마감·다음 시즌·일일 소비, 원래 공식 nexus/raw·compact 기록 및 구단 선택 권한 유지');
})()`,{timeout:120000,setupSources:['const FIXTURE='+JSON.stringify(fixture)+';',originalWriter]});
