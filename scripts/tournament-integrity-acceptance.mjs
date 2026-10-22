// Tournament-integrity regression: actual existing engine functions and schedule writers.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(ok,message)=>{if(!ok)throw Error('TOURNAMENT_INTEGRITY '+message)};
  const ids=['A','B','C','D'];
  const matches=roundRobin(ids,4).flat();
  check(matches.length===24,'four-leg round-robin match count');
  for(const id of ids)check(matches.filter(m=>m[0]===id).length===6,'four-leg home parity '+id);
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
    const a=ids[i],b=ids[j],head=matches.filter(m=>m.includes(a)&&m.includes(b));
    check(head.length===4&&head.filter(m=>m[0]===a).length===2,'pair home/away balance '+a+'/'+b);
  }
  const oddRoundRobin=roundRobin(['A','B','C','D','E'],2).flat();
  check(oddRoundRobin.length===20,'odd round-robin bye / match count');

  const regular=defaultWorldConfig();
  regular.regions=[regionCfg('NA',{teams:10,div2:false})];
  regular.internationals=[];
  const db=buildWorld(regular);
  const clubs=activeTeams(db,'NA',1).map(x=>x.id);
  check(clubs.length===10,'expected ten legal teams');

  const problems=[];
  for(const size of [4,6,8,10]){
    for(const reset of [false,true]){
      const id='QA_DE_'+size+'_'+(reset?'R':'N'),teams=clubs.slice(0,size);
      db.competitions[id]={id,name:'Tournament integrity',region:'NA',div:1,teams,
        rules:{fearless:false},stages:[{id:'bracket',name:'Playoffs',type:'double_elim',bestOf:3,dayGap:[2]}]};
      const s=newSeason(db,id,db.year,'audit-'+id,'2026-02-01',id);
      let turns=0,finalReset=0;
      while(!s.done){
        check(++turns<160,'bracket did not terminate '+id);
        const day=s.days[s.cur],cfg=db.competitions[id].stages[0];
        check(!!day,'missing scheduled day '+id);
        for(const m of day.matches)if(!m.res){
          check(m.a!==m.b&&teams.includes(m.a)&&teams.includes(m.b),'invalid bracket teams '+id);
          const bracket=s.stageData.bracket,round=bracket.rounds.find(r=>r.label===day.label);
          check(!!round,'round provenance lost '+id);
          if(round.br==='GFR')finalReset++;
          const winner=reset&&round.br==='GF'?m.b:m.a;
          m.res={winner,score:winner===m.a?[2,0]:[0,2],games:[]};
        }
        finalizeCompetitionDay(db,s,day,0,cfg);
      }
      const bracket=s.stageData.bracket;
      check(bracket.alive.length===1&&bracket.elim.length===size-1,'elimination count '+id);
      check(new Set(bracket.elim).size===size-1&&teams.includes(s.champion),'missing or duplicate club '+id);
      if(reset)check(finalReset===1,'unbeaten finalist reset omitted '+id);
      problems.push({teams:size,reset,days:s.days.length,champion:s.champion});
    }
  }

  const rec={A:{w:1,l:1,opp:[]},B:{w:1,l:1,opp:[]},
    C:{w:1,l:1,opp:['D']},D:{w:1,l:1,opp:['C']}};
  const swiss=swissPairings({teams:ids,rec},ids);
  check(swiss.length===2&&swiss.every(([a,b])=>a!==b&&!rec[a].opp.includes(b)),
    'avoidable Swiss rematch');

  db.competitions.QA_SWISS={id:'QA_SWISS',name:'Swiss odd',region:'NA',div:1,
    teams:clubs.slice(0,5),rules:{fearless:false},
    stages:[{id:'swiss',name:'Swiss',type:'swiss',wins:3,losses:3,bestOf:3}]};
  const odd=newSeason(db,'QA_SWISS',db.year,'odd-swiss','2026-03-01');
  const data=odd.stageData.swiss,first=odd.days[0];
  check(data.byes?.length===1&&first.matches.length===2,
    'odd Swiss participant silently excluded');
  const bye=data.byes[0].team;
  check(data.rec[bye].w===1&&data.rec[bye].byes===1,
    'Swiss bye not tracked as an administrative advance');
  check(!first.matches.some(m=>m.a===bye||m.b===bye),'Swiss bye team secretly played a match');

  const koIds=clubs.slice(0,10),ko=intlStages('ko',koIds,3);
  check(ko.length===1&&ko[0].take===10,'non-power-of-two knockout entrants truncated');
  db.competitions.QA_KO={id:'QA_KO',name:'Knockout 10',region:'NA',div:1,teams:koIds,
    rules:{fearless:false},stages:ko};
  const single=newSeason(db,'QA_KO',db.year,'ko-ten','2026-04-01');
  check(single.stageData.knockout.alive.length===10,'knockout schedule lost entrants');
  check(single.stageData.knockout.rounds[0].byes.length===6,'knockout byes not kept');

  db.world={year:db.year,seed:'tournament-integrity',phase:'season',
    registrationVersion:1,seasons:{},steps:[],step:0};
  const fixture={a:clubs[0],b:clubs[1],bo:5};
  // Official medical availability is computed from actual registered players.
  // A full player pool is not necessary for a double-shortage fixture: no players
  // are registered to these two match sides.
  const empty={comp:'QA_KO',entries:{[fixture.a]:[],[fixture.b]:[]}};
  const oldA=db.teams[fixture.a].registration,oldB=db.teams[fixture.b].registration;
  db.teams[fixture.a].registration={year:db.year,players:[]};
  db.teams[fixture.b].registration={year:db.year,players:[]};
  let rejected=false;
  try{scheduledRegistrationForfeit(db,empty,fixture)}catch(e){
    rejected=String(e.message).includes('양팀 모두');
  }
  db.teams[fixture.a].registration=oldA;
  db.teams[fixture.b].registration=oldB;
  check(rejected,'double shortage advanced the first listed team');

  return {status:'PASS',doubleElimination:problems,swissPairings:swiss,
    swissByes:data.byes.length,roundRobinHomeGames:6,koEntrants:koIds.length,
    doubleShortagePrevented:rejected};
})()`,{timeout:120000}).then(result=>console.log('TOURNAMENT_INTEGRITY_ACCEPTANCE',JSON.stringify(result)));
