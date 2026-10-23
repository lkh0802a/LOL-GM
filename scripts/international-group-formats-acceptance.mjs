import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('INTERNATIONAL_GROUP_FORMAT '+m)};
 const db=buildWorld(),team=activeTeams(db,'NA',1)[0];startCareer(db,team.id,'international-group-formats');for(const t of setupTeamsForManager(db))autoBuildInitialSquad(db,t,new RNG('group-format/'+t.id));finalizeInitialRosters(db);
 const source=packDB(db),rows=[];let firstFixture=null;
 for(const [id,groups,legs,take] of [['FIRST_STAND',2,1,8],['OPEN',2,1,8]]){
  let game=unpackDB(source);check(startInternational(game,id,'2027-07-01',new Set()),'actual event start '+id);let s=game.world.seasons[id];const comp=game.competitions[id],sd=s.stageData.groups;
  check(comp.teams.length===12&&comp.stages[0].groups===groups&&comp.stages[0].legs===legs,'declared groups '+id);
  check(sd.groups.every(g=>g.length===6&&new Set(g.map(t=>game.teams[t].region)).size===6),'same-region separation '+id);
  let steps=0,restored=false;while(!s.done&&steps++<120){const d=s.days[s.cur];setWorldCalendarDate(game,d.date);playDay(game,s);if(!restored&&s.cur===3){const loaded=unpackDB(packDB(game));check(JSON.stringify(loaded.world.seasons[id])===JSON.stringify(s),'mid-event entire season restore');game=loaded;s=game.world.seasons[id];restored=true;}}
  check(s.done,'event did not finish');const matches=s.days.flatMap(d=>d.matches),groupMatches=s.days.filter(d=>d.stage==='groups').flatMap(d=>d.matches),ko=s.days.filter(d=>d.stage==='knockout').flatMap(d=>d.matches);
  check(groupMatches.length===30&&groupMatches.every(m=>m.bo===3),'actual single round robin Bo3');
  check(ko.length===take-1&&ko.every(m=>m.bo===5),'actual knockout Bo5');
  for(const g of sd.groups){const counts=Object.fromEntries(g.map(t=>[t,0]));for(const m of groupMatches)if(g.includes(m.a)){check(g.includes(m.b),'cross-group fixture');counts[m.a]++;counts[m.b]++;}check(Object.values(counts).every(n=>n===5),'each entrant exactly five group series');}
  const qualifiers=groupStandings(game,s,'groups').flatMap(g=>g.slice(0,4).map(r=>r.tid));check(new Set(s.stageData.knockout.seeds).size===8&&s.stageData.knockout.seeds.every(t=>qualifiers.includes(t)),'top four per group');
  check(matches.every(m=>m.a!==m.b&&m.res.games.every(g=>g.publicRecord?.ending.kind==='nexus')),'actual nexus results');
  const snapshot=JSON.stringify(s),saved=unpackDB(packDB(game));check(JSON.stringify(saved.world.seasons[id])===snapshot,'completed whole season restore');const before=JSON.stringify(game);standings(game,s,'groups');check(JSON.stringify(game)===before,'standings read mutation');
  const h=game.history.find(h=>h.comp===id&&h.year===s.year);check(h&&h.champion===s.champion&&h.runnerUp===s.runnerUp,'actual historical writer');
  if(id==='FIRST_STAND')firstFixture=packDB(game);
  rows.push({id,participants:12,groups:2,groupSeries:groupMatches.length,knockoutSeries:ko.length,nexusGames:matches.reduce((n,m)=>n+m.res.games.length,0),wholeSeasonSave:true,actualHistory:true});
 }
 // Masters and Cup format policy uses the declared participant list here;
 // entry allocation is a separate, still-unfinished startInternational contract.
 for(const [fmt,n,groups,legs,take] of [['masters_groups',16,4,2,8],['regional_cup',8,2,2,4]]){
  const pools=(fmt==='regional_cup'?['KR','CN','AP']:['KR','CN','EU','NA','AP','BR']).map(r=>activeTeams(db,r,1));const teams=[];for(let i=0;teams.length<n;i++)for(const pool of pools)if(teams.length<n&&pool[i])teams.push(pool[i].id);const stages=intlStages(fmt,teams,5,{groupBo:3,groupLegs:legs,knockoutBo:5});check(stages[0].groups===groups&&stages[0].legs===legs&&stages[0].bestOf===3&&stages[1].take===take&&stages[1].bestOf===5,'declared policy '+fmt);
  let game=unpackDB(source);const id='FORMAT_PROBE_'+fmt;game.competitions[id]={id,name:'Group format diagnostic',teams,stages,international:true,rules:{fearless:true}};game.world.seasons[id]=newSeason(game,id,game.year,'group-policy/'+fmt,'2027-07-01');let season=game.world.seasons[id],steps=0;
  while(!season.done&&steps++<160){const day=season.days[season.cur];setWorldCalendarDate(game,day.date);playDay(game,season);if(steps===3){game=unpackDB(packDB(game));season=game.world.seasons[id];}}
  check(season.done,'format diagnostic did not finish '+fmt);const groupMatches=season.days.filter(d=>d.stage==='groups').flatMap(d=>d.matches),knockout=season.days.filter(d=>d.stage==='knockout').flatMap(d=>d.matches),size=n/groups;
  check(groupMatches.length===groups*size*(size-1)/2*legs&&groupMatches.every(m=>m.bo===3),'double round robin actual fixtures '+fmt);check(knockout.length===take-1&&knockout.every(m=>m.bo===5),'actual knockout fixtures '+fmt);
  const qualified=groupStandings(game,season,'groups').flatMap(g=>g.slice(0,take/groups).map(r=>r.tid));check(season.stageData.knockout.seeds.every(t=>qualified.includes(t)),'each group qualifier count '+fmt);
  check(season.days.flatMap(d=>d.matches).every(m=>m.a!==m.b&&m.res.games.every(g=>g.publicRecord?.ending.kind==='nexus')),'actual format nexus '+fmt);check(JSON.stringify(unpackDB(packDB(game)).world.seasons[id])===JSON.stringify(season),'whole diagnostic season restore '+fmt);
  rows.push({format:fmt,fixtureScope:'stage writer only, not entry allocation',participants:n,groups,groupSeries:groupMatches.length,knockoutSeries:knockout.length,nexusGames:season.days.flatMap(d=>d.matches).reduce((n,m)=>n+m.res.games.length,0),wholeSeasonSave:true});
 }
 check(packDB(db)===source,'source fixture mutated');return {fixture:firstFixture,rows,mastersAndCupFormatPolicy:true,entryAllocationNotCompleted:true,msiAndWorldsNotCompleted:true,fullWorldSeasonNotRun:true};
})()`,{timeout:180000});
if(process.env.INTERNATIONAL_GROUP_FIXTURE)await writeFile(process.env.INTERNATIONAL_GROUP_FIXTURE,JSON.stringify({game:result.fixture}));delete result.fixture;
assert.equal(result.rows.length,4);console.log('INTERNATIONAL_GROUP_FORMATS_ACCEPTANCE',JSON.stringify(result));
