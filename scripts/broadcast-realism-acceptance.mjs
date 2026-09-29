// Reality-oriented domestic broadcast scheduling and team-chemistry contract.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';
const artifact=resolve(import.meta.dirname,'..','src','artifact');
let source='';
for(const file of ENGINE_MODULES)source+=await readFile(resolve(artifact,file),'utf8')+'\n';
const fixture=String.raw`(()=>{
  const assert=(x,msg)=>{if(!x)throw new Error('BROADCAST_REALISM: '+msg)};
  const dayNum=x=>Date.parse(x+'T00:00:00Z')/86400000;
  const cfg=defaultWorldConfig();
  cfg.regions=[
    regionCfg('KR',{teams:12,splits:3,div2:false,system:'franchise'}),
    regionCfg('CN',{teams:16,splits:3,div2:false,system:'franchise'}),
    regionCfg('EU',{teams:10,splits:2,div2:false,system:'franchise'}),
    regionCfg('NA',{teams:10,splits:1,div2:false,system:'franchise'})
  ];
  cfg.internationals=[];cfg.changes='none';cfg.subs=1;
  const db=buildWorld(cfg),date='2027-01-14';
  const checks=[];
  for(const R of Object.values(db.regions)){
    const comp=leagueComp(db,R.id,1,1);db.competitions[comp.id]=comp;
    const s=newSeason(db,comp.id,db.year,'broadcast-'+R.id,date);
    const rr=comp.stages[0],weeks=Math.floor((R.teams*(rr.legs||1)-rr.legs)/2);
    assert(rr.type==='round_robin','initial regional stage should be round robin');
    if(R.splits>=3)assert(rr.legs===1,
      '3-split first event must be a shorter opening tournament');
    else assert(rr.legs>=2,'single/two-split league must retain return fixtures');
    const matchCount=s.days.flatMap(d=>d.matches).length,
      expected=(s.stageData[rr.id].groups||[comp.teams]).reduce(
        (total,group)=>total+group.length*(group.length-1)/2*rr.legs,0);
    assert(matchCount===expected,'fixture conservation fails '+R.id);
    const w0=s.days[0].date;
    const weekdayOrder=broadcastDays(R);
    assert(weekdayOrder.length===4,'league requires four broadcasting days');
    const seenFixtureIds=new Set();
    for(let k=0;k<Math.min(4,Math.floor((R.teams-1)*rr.legs/2));k++){
      const from=dayNum(w0)+k*7,into=from+7;
      const days=s.days.filter(x=>dayNum(x.date)>=from&&dayNum(x.date)<into);
      assert(days.length===4,'broadcast week must occupy four dates '+R.id+'/'+k);
      const teamGames=new Map();
      for(const day of days){
        assert(day.broadcast&&day.matches.length<=Math.ceil(R.teams/4),
          'regional broadcast overload '+R.id+'/'+day.date);
        const wd=new Date(day.date+'T00:00:00Z').getUTCDay();
        assert(weekdayOrder.includes(wd),'match scheduled outside regional airtime '+R.id);
        day.matches.forEach((m,i)=>{
          assert(m.broadcastSlot===i+1&&m.broadcastTime&&
            /^([0-2]\d):[0-5]\d$/.test(m.broadcastTime),
            'no broadcast sequence or local timeslots '+R.id);
          assert(!seenFixtureIds.has(m.id),'duplicate fixture id '+m.id);seenFixtureIds.add(m.id);
          for(const id of [m.a,m.b])teamGames.set(id,[...(teamGames.get(id)||[]),dayNum(day.date)]);
        });
      }
      assert(teamGames.size===R.teams,'some region clubs have no fixture '+R.id);
      for(const [id,dates] of teamGames){
        dates.sort((a,b)=>a-b);
        assert(dates.length===2,'a club must play exactly twice a week '+R.id+'/'+id);
        assert(dates[1]-dates[0]>=2,'a club must recover between weekly broadcasts '+id);
      }
    }
    const distinctDays=[...new Set(s.days.map(x=>x.date))];
    assert(distinctDays.length===s.days.length,
      'same league contains two duplicate date objects');
    checks.push({region:R.id,teams:R.teams,legs:rr.legs,matches:matchCount,
      broadcastDays:weekdayOrder.map(n=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][n])});
  }
  const club=leagueComp(db,'KR',1,2);
  assert(club.stages[0].legs>=2,'main-season return fixtures accidentally removed');
  // Team-cohesion checks do not rely on old design spec: a losing team with
  // awful real peer relationships must be able to lose chemistry.
  const team=activeTeams(db,'NA',1)[0],opp=activeTeams(db,'NA',1)[1];
  const rng=new RNG('fixture-squad', 'chemistry');
  db.playerRelations=db.playerRelations||{};
  for(const t of [team,opp])for(let i=0;i<6;i++)
    genPlayer(db,rng,{role:ROLES[i%5],age:21+i,base:65,region:t.region,team:t.id});
  for(const t of [team,opp]){
    const starterIds=t.roster.slice(0,5);
    assert(starterIds.length>=5,'fixture world has no roster');
    t.synergy=50;
    for(let i=0;i<starterIds.length;i++)for(let j=i+1;j<starterIds.length;j++)
      db.playerRelations[playerRelationKey(starterIds[i],starterIds[j])]=0;
    t.roster.forEach(id=>{const p=db.players[id];p.rosterRole='backup';pState(p);p.morale=60});
  }
  const generateLines=t=>t.roster.slice(0,5).map(pid=>({
    pid,k:1,a:2,d:3,win:t.id===opp.id,mvp:false
  }));
  afterSeries(db,[...generateLines(team),...generateLines(opp)],
    {a:team.id,b:opp.id,winner:opp.id,seed:'loss-chemistry'});
  assert(team.synergy<50,
    'severely strained relationships plus losing still produced automatic chemistry growth');
  const reserve=db.players[team.roster[5]];
  assert(reserve?.morale===60,
    'an unplayed backup loses morale by default every series');
  for(const t of [team,opp])for(const a of t.roster.slice(0,5))
    for(const b of t.roster.slice(0,5))if(a!==b)
      db.playerRelations[playerRelationKey(a,b)]=100;
  const rise=team.synergy;
  afterSeries(db,[...generateLines(team),...generateLines(opp)],
    {a:team.id,b:opp.id,winner:team.id,seed:'win-chemistry'});
  assert(team.synergy>rise,
    'victory with positive peer chemistry should be able to improve cohesion');
  console.log('BROADCAST_REALISM_ACCEPTANCE '+JSON.stringify({schedules:checks,
    cohesionAfterLoss:rise,cohesionAfterWin:team.synergy,
    backupMorale:reserve.morale,protectedSchema:db.version}));
})()`;
vm.runInNewContext(source+'\n'+fixture,
 {console,Date,Math,JSON,Set,Map,Object,Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},
 {timeout:45000});
