import assert from 'node:assert/strict';
import {runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('WORLDS_TIEBREAK '+m)},id='WORLD_CHAMPIONSHIP',db=buildWorld(),owner=activeTeams(db,'NA',1)[0];startCareer(db,owner.id,'worlds-tie');for(const t of setupTeamsForManager(db))autoBuildInitialSquad(db,t,new RNG('worlds-tie-roster/'+t.id));finalizeInitialRosters(db);check(startInternational(db,id,'2027-09-01',new Set()),'constructor');
 const s=db.world.seasons[id],sd=s.stageData.league,league=s.days.flatMap(d=>d.matches),adj=Object.fromEntries(sd.teams.map(t=>[t,[]])),used=new Set();league.forEach((m,i)=>{adj[m.a].push([i,m.b]);adj[m.b].push([i,m.a]);});
 // Controlled result fixture, not a claim that these 72 series were simulated.
 // Orient the even-degree draw as Euler circuits: each team is exactly 3-3.
 const visit=a=>{for(const [i,b] of adj[a])if(!used.has(i)){used.add(i);const m=league[i];m.res={winner:a,score:m.a===a?[2,1]:[1,2],games:[]};visit(b);}};for(const t of sd.teams)visit(t);
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
  check(standings(game,season,'league').every(r=>r.w===3&&r.gw===9&&r.sos===18),'tiebreak contaminated league metrics');reports.push({boundary,controlledInitialTiebreakSeries:276,actualDecidingBO1:actual,rounds:data.tiebreaks.length,nativeResume:true,pairedWholeResume:true,originalLeagueUnchanged:true});
 }
 return {reports,controlledLeagueFixture:true,fullWorldSeasonNotRun:true};
})()`,{timeout:180000});
assert.equal(result.reports.length,2);console.log('WORLDS_TIEBREAK_ACCEPTANCE',JSON.stringify(result));
