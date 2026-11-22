import assert from 'node:assert/strict';
import {runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('WORLDS_TIEBREAK '+m)},id='WORLD_CHAMPIONSHIP',db=buildWorld(),owner=activeTeams(db,'NA',1)[0];startCareer(db,owner.id,'worlds-tie');for(const t of setupTeamsForManager(db))autoBuildInitialSquad(db,t,new RNG('worlds-tie-roster/'+t.id));finalizeInitialRosters(db);check(startInternational(db,id,'2027-09-01',new Set()),'constructor');
 const s=db.world.seasons[id],sd=s.stageData.league,league=s.days.flatMap(d=>d.matches),adj=Object.fromEntries(sd.teams.map(t=>[t,[]])),used=new Set();league.forEach((m,i)=>{adj[m.a].push([i,m.b]);adj[m.b].push([i,m.a]);});
 // Execute one actual regular series in an isolated clone, then reproduce it
 // in the fixture; remaining regular results are still controlled inputs.
 let realIndex=-1,realWinner=null;
 for(let i=0;i<league.length&&realIndex<0;i++){
  const probe=unpackDB(packDB(db)),ps=probe.world.seasons[id],pm=ps.days.flatMap(d=>d.matches)[i],pd=ps.days.find(d=>d.matches.some(x=>x.id===pm.id));
  const outcome=simulateScheduledSeries(probe,ps,pd,pm,probe.competitions[id].stages[0]);
  if(outcome.rec.score.slice().sort().join(',')==='1,2'){realIndex=i;realWinner=outcome.rec.winner;}
 }
 check(realIndex>=0,'no real 2-1 regular fixture found');
 const realMatch=league[realIndex],realDay=s.days.find(d=>d.matches.some(m=>m.id===realMatch.id));
 const realSeries=simulateScheduledSeries(db,s,realDay,realMatch,db.competitions[id].stages[0]);
 check(realSeries.rec.winner===realWinner&&realSeries.rec.score.slice().sort().join(',')==='1,2','actual regular replay changed');
 commitScheduledSeries(db,s,realMatch,realSeries);
 const regularPlayerGames=Object.values(s.pstats).reduce((n,p)=>n+p.g,0);
 check(regularPlayerGames===30,'actual regular player lines missing');
 const regularGamesByPlayer=Object.fromEntries(Object.entries(s.pstats).map(([pid,row])=>[pid,row.g]));
 // Orient the graph from the actual winner, taking its real edge first.
 const edges=adj[realWinner],first=edges.findIndex(([i])=>i===realIndex);check(first>=0,'actual edge missing from draw');edges.unshift(edges.splice(first,1)[0]);
 // Controlled result fixture, not a claim that these 72 series were simulated.
 // Orient the even-degree draw as Euler circuits: each team is exactly 3-3.
 const visit=a=>{for(const [i,b] of adj[a])if(!used.has(i)){used.add(i);const m=league[i];if(i===realIndex)check(m.res?.winner===a,'actual series orientation changed');else m.res={winner:a,score:m.a===a?[2,1]:[1,2],games:[]};visit(b);}};visit(realWinner);for(const t of sd.teams)visit(t);
 check(standings(db,s,'league').every(r=>r.w===3&&r.l===3&&r.gw===9&&r.gl===9&&r.sos===18&&r.opponentSetDiff===0),'controlled full tie fixture');s.cur=s.days.length;
 const base=packDB(db),reports=[],canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
 for(const boundary of [8,16]){
  let game=unpackDB(base),season=game.world.seasons[id],data=season.stageData.league,cfg=game.competitions[id].stages[0];
  continueWorldsLeague(game,season,0,season.days.at(-1).localDate);check(data.tiebreaks.length===1&&data.tiebreaks[0].teams.length===24&&data.tiebreaks[0].matches.length===276,'24-team tie round robin schedule');
  const original=JSON.stringify(season.days.filter(d=>d.stage==='league').flatMap(d=>d.matches).filter(m=>!m.worldsTiebreak)),ordered=data.teams,cycle=ordered.slice(boundary-1,boundary+2),initial=data.tiebreaks[0];
  for(const m of season.days.flatMap(d=>d.matches).filter(m=>initial.matches.includes(m.id))){const a=ordered.indexOf(m.a),b=ordered.indexOf(m.b);let winner=a<b?m.a:m.b;if(cycle.includes(m.a)&&cycle.includes(m.b)){const ai=cycle.indexOf(m.a),bi=cycle.indexOf(m.b);winner=(ai+1)%3===bi?m.a:m.b;}m.res={winner,score:winner===m.a?[1,0]:[0,1],games:[]};}
  season.cur=season.days.length;continueWorldsLeague(game,season,0,season.days.at(-1).localDate);check(data.tiebreaks.length===2&&data.tiebreaks[1].teams.length===3&&data.tiebreaks[1].teams.every(t=>cycle.includes(t)),'repeat only unresolved boundary subset '+boundary);
  const second=data.tiebreaks[1],group=second.teams;
  for(const m of season.days.flatMap(d=>d.matches).filter(m=>second.matches.includes(m.id))){const winner=(group.indexOf(m.a)+1)%3===group.indexOf(m.b)?m.a:m.b;m.res={winner,score:winner===m.a?[1,0]:[0,1],games:[]};}
  season.cur=season.days.length;continueWorldsLeague(game,season,0,season.days.at(-1).localDate);check(data.tiebreaks.length===3&&data.tiebreaks[2].teams.length===3,'cyclic new round retained');
  let days=0,saved=false,actual=0,reference=null;
  while(season.stage===0&&days++<100){const day=season.days[season.cur];check(day.matches.every(m=>m.worldsTiebreak>=3&&m.bo===1),'repeated BO1 fixtures');setWorldCalendarDate(game,day.date);playDay(game,season);for(const m of day.matches){check(m.res.games.length===1&&m.res.games[0].publicRecord?.ending.kind==='nexus','real deciding nexus');actual++;}
   if(!saved){reference=game;const raw=JSON.stringify(season),packed=packDB(game);game=unpackDB(packed);season=game.world.seasons[id];data=season.stageData.league;check(JSON.stringify(season)===raw,'mid tiebreak whole native save');saved=true;}
  }
  check(saved&&season.stage===1&&actual>=3,'actual tiebreak resolved boundary');const referenceSeason=reference.world.seasons[id];let referenceDays=0;while(referenceSeason.stage===0&&referenceDays++<100){setWorldCalendarDate(reference,referenceSeason.days[referenceSeason.cur].date);playDay(reference,referenceSeason);}check(referenceSeason.stage===1&&canonical(reference)===canonical(game)&&packDB(reference)===packDB(game),'uninterrupted vs native tiebreak complete graph/fixture/history/save');check(JSON.stringify(season.days.filter(d=>d.stage==='league').flatMap(d=>d.matches).filter(m=>!m.worldsTiebreak))===original,'original league results rewritten');
  const raw=JSON.stringify(game);check(!startInternational(game,id,'2027-09-01',new Set())&&JSON.stringify(game)===raw,'duplicate tournament replaced tiebreak progress');
  check(standings(game,season,'league').every(r=>r.w===3&&r.gw===9&&r.sos===18),'tiebreak contaminated league metrics');
  // One real regular series and the subsequent deciding games have player lines;
  // all other preloaded results are controlled inputs.
  const tiebreakPlayerGames=Object.values(season.pstats).reduce((n,p)=>n+p.g,0);
  check(tiebreakPlayerGames===regularPlayerGames+actual*10,'actual tiebreak player lines not retained');
  check(Object.entries(regularGamesByPlayer).every(([pid,g])=>(season.pstats[pid]?.g||0)>=g),'regular player appearances lost');
  reports.push({boundary,controlledInitialTiebreakSeries:276,actualDecidingBO1:actual,rounds:data.tiebreaks.length,nativeResume:true,pairedWholeResume:true,originalLeagueUnchanged:true,regularPlayerGames,tiebreakPlayerGames:tiebreakPlayerGames-regularPlayerGames,playerStatsScope:'season-aggregate-not-regular-award'});
 }
 return {reports,controlledLeagueFixture:true,fullWorldSeasonNotRun:true};
})()`,{timeout:180000});
assert.equal(result.reports.length,2);console.log('WORLDS_TIEBREAK_ACCEPTANCE',JSON.stringify(result));
