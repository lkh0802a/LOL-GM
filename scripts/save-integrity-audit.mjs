// Read-only diagnostic of synthetic legacy saves; this never opens user slots.
// Acceptance of a damaged input is reported as an observation, not a policy.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const db=buildWorld(),team=activeTeams(db,null,1)[0],other=activeTeams(db,null,1)[1],
    player=Object.values(db.players).find(p=>!p.retired&&!p.team);
  if(!team||!other||!player)throw Error('missing synthetic clubs or player');
  signContract(db,player,team,asking(db,player,team.region),1,{promisedRole:'core'});
  for(const club of [team,other])while(club.roster.length<5){
    const free=Object.values(db.players).find(p=>!p.retired&&!p.team);
    if(!free)throw Error('missing synthetic players for valid registration');
    signContract(db,free,club,asking(db,free,club.region),1,{promisedRole:'core'});
  }
  db.world={year:db.year,phase:'offseason',registrationVersion:1,seasons:{}};
  for(const club of [team,other])club.registration={year:db.year,players:club.roster.slice(),date:db.worldDate,depthChart:{},history:[]};
  const raw=packDB(db);
  const cases=[
    ['baseline',()=>{}],
    ['unsupported-world-version',d=>{d.version=999}],
    ['unsupported-save-format',d=>{d.saveFormat=999}],
    ['missing-roster-player',d=>{d.teams[team.id].roster.push('missing-player-id')}],
    ['duplicate-roster-player',d=>{d.teams[team.id].roster.push(player.id)}],
    ['player-in-two-rosters',d=>{d.teams[other.id].roster.push(player.id)}],
    ['duplicate-official-registration',d=>{d.teams[team.id].registration.players.push(player.id)}],
    ['player-in-two-official-registrations',d=>{d.teams[other.id].registration.players.push(player.id)}],
    ['foreign-official-replaces-valid-player',d=>{d.teams[other.id].registration.players[0]=player.id}],
    ['invalid-club-cash',d=>{d.teams[team.id].finance.cash='not-a-number'}],
    ['invalid-contract-salary',d=>{d.players[player.id].contract.salary='not-a-number'}],
    ['missing-player-team',d=>{d.players[player.id].team='missing-team-id'}]
  ];
  for(const [name,mutate] of cases){
    const candidate=JSON.parse(raw);mutate(candidate);
    let result,details;
    try{
      const restored=unpackDB(JSON.stringify(candidate));result='accepted';
      const savedRegistrations=JSON.stringify([restored.teams[team.id].registration,restored.teams[other.id].registration]);
      const matchView=officialMatchView(restored,null,team.id,other.id);
      const forfeit=scheduledRegistrationForfeit(restored,{comp:'synthetic'}, {a:team.id,b:other.id,bo:1});
      details={cash:restored.teams[team.id].finance.cash,
        salary:restored.players[player.id].contract?.salary,
        team:restored.players[player.id].team,
        rosterCount:restored.teams[team.id].roster.filter(id=>id===player.id).length,
        otherRosterCount:restored.teams[other.id].roster.filter(id=>id===player.id).length,
        registrationErrors:officialRegistrationErrors(restored,restored.teams[team.id],restored.teams[team.id].roster),
        otherRegistrationErrors:officialRegistrationErrors(restored,restored.teams[other.id],restored.teams[other.id].roster),
        officialErrors:officialRegistrationErrors(restored,restored.teams[team.id],restored.teams[team.id].registration.players),
        otherOfficialErrors:officialRegistrationErrors(restored,restored.teams[other.id],restored.teams[other.id].registration.players),
        otherMatchViewContainsPlayer:matchView.teams[other.id].roster.includes(player.id),
        matchViewCounts:[matchView.teams[team.id].roster.length,matchView.teams[other.id].roster.length],
        scheduledForfeitWinner:forfeit?.rec?.winner??null,
        officialRegistrationsUnchanged:JSON.stringify([restored.teams[team.id].registration,restored.teams[other.id].registration])===savedRegistrations};
    }catch(e){result='rejected';details={error:e.message}}
    if(name==='baseline'&&result!=='accepted')throw Error('synthetic baseline cannot be restored');
    const originalUnchanged=packDB(db)===raw;
    if(!originalUnchanged)throw Error('synthetic original mutated: '+name);
    console.log('SAVE_INTEGRITY_AUDIT '+JSON.stringify({name,result,details,originalUnchanged}));
  }
})()`,{timeout:60000});

await runEngineFixture(String.raw`(()=>{
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1);
  db.world={year:db.year,phase:'season',manage:'manual',registrationVersion:1,seasons:{}};
  for(const t of [a,b])for(const role of ROLES){
    const p=genPlayer(db,new RNG('save-scheduled|'+t.id+role),{region:t.region,role,age:22,base:65});
    signContract(db,p,t,1,3);t.depthChart[role]=p.id;
  }
  initializeOfficialRegistrations(db);
  const cid='save-scheduled-audit';db.competitions[cid]={id:cid,name:'Synthetic audit',region:'NA',teams:[a.id,b.id],
    rules:{fearless:true},stages:[{id:'regular',name:'Regular',type:'round_robin',legs:1,bestOf:1}]};
  const season=newSeason(db,cid,db.year,'save-scheduled-audit',db.worldDate);
  season.key=cid;season.region='NA';season.div=1;db.world.seasons[cid]=season;
  const raw=packDB(db),baseline=unpackDB(raw),baseSeason=baseline.world.seasons[cid],baseMatch=baseSeason.days[baseSeason.cur].matches[0];
  playDay(baseline,baseSeason);
  const candidate=JSON.parse(raw);
  candidate.teams[b.id].registration.players[0]=a.registration.players[0];
  const restored=unpackDB(JSON.stringify(candidate)),s=restored.world.seasons[cid],m=s.days[s.cur].matches[0];
  const beforeResult=m.res??null,beforeOriginal=packDB(db)===raw;
  playDay(restored,s);
  const observed={name:'scheduled-corrupt-registration',baselineForfeit:baseMatch.res?.forfeit??false,
    baselineGames:baseMatch.res?.games?.length??null,beforeResult,afterWinner:m.res?.winner??null,
    forfeit:m.res?.forfeit??false,games:m.res?.games?.length??null,originalUnchanged:beforeOriginal&&packDB(db)===raw};
  console.log('SAVE_INTEGRITY_AUDIT '+JSON.stringify(observed));
  if(!observed.originalUnchanged)throw Error('synthetic scheduled original mutated');
})()`,{timeout:60000});

await runEngineFixture(String.raw`(()=>{
  const cfg=defaultWorldConfig();
  cfg.regions=[regionCfg('NA',{teams:4,div2:true,system:'franchise'})];cfg.internationals=[];
  const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1);setManagedTeam(db,a.id);
  for(const t of [a,b])for(const role of ROLES){
    const p=genPlayer(db,new RNG('match-history|'+t.id+role),{region:t.region,role,age:22,base:65});
    signContract(db,p,t,1,3);t.depthChart[role]=p.id;
  }
  db.world={year:db.year,manage:'manual',phase:'season',seasons:{}};
  const session=createSeriesSession(db,a.id,b.id,1,'record-official',{compId:'history'});
  playSeriesSessionGame(db,session,null,false);
  const rec=seriesSessionResult(db,session).rec;
  db.world.seasons.history={id:'history',comp:'history',region:'EU',done:true,
    days:[{date:db.worldDate,matches:[{res:rec}]}]};
  db.competitions.history={name:'기록 대회'};
  const raw=packDB(db),baseline=unpackDB(raw),baseRec=baseline.world.seasons.history.days[0].matches[0].res;
  const baselineReview=recordedPublicMatch(baseline,baseRec,baseRec.games[0]).reason??'no-error';
  if(baselineReview!=='no-error')throw Error('synthetic baseline match cannot be reviewed: '+baselineReview);
  const candidate=JSON.parse(raw);
  candidate.world.seasons.history.days[0].matches[0].res.games[0].publicRecord.sides[0].players[0][0]='missing-player-id';
  let result,review;
  try{
    const restored=unpackDB(JSON.stringify(candidate));result='accepted';
    const restoredRec=restored.world.seasons.history.days[0].matches[0].res;
    review=recordedPublicMatch(restored,restoredRec,restoredRec.games[0]).reason??'no-error';
  }catch(e){result='rejected';review=e.message}
  const originalUnchanged=packDB(db)===raw;
  if(!originalUnchanged)throw Error('synthetic match original mutated');
  console.log('SAVE_INTEGRITY_AUDIT '+JSON.stringify({name:'historical-player-reference',baselineReview,result,review,originalUnchanged}));
})()`,{timeout:60000});
