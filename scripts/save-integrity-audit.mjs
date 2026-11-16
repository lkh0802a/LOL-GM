// Read-only diagnostic of synthetic legacy saves; this never opens user slots.
// Acceptance of a damaged input is reported as an observation, not a policy.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const db=buildWorld(),team=activeTeams(db,null,1)[0],
    player=Object.values(db.players).find(p=>!p.retired&&!p.team);
  if(!team||!player)throw Error('missing synthetic club or player');
  signContract(db,player,team,asking(db,player,team.region),1,{promisedRole:'core'});
  const raw=packDB(db);
  const cases=[
    ['baseline',()=>{}],
    ['unsupported-world-version',d=>{d.version=999}],
    ['unsupported-save-format',d=>{d.saveFormat=999}],
    ['missing-roster-player',d=>{d.teams[team.id].roster.push('missing-player-id')}],
    ['invalid-club-cash',d=>{d.teams[team.id].finance.cash='not-a-number'}],
    ['invalid-contract-salary',d=>{d.players[player.id].contract.salary='not-a-number'}],
    ['missing-player-team',d=>{d.players[player.id].team='missing-team-id'}]
  ];
  for(const [name,mutate] of cases){
    const candidate=JSON.parse(raw);mutate(candidate);
    let result,details;
    try{
      const restored=unpackDB(JSON.stringify(candidate));result='accepted';
      details={cash:restored.teams[team.id].finance.cash,
        salary:restored.players[player.id].contract?.salary,
        team:restored.players[player.id].team};
    }catch(e){result='rejected';details={error:e.message}}
    if(name==='baseline'&&result!=='accepted')throw Error('synthetic baseline cannot be restored');
    const originalUnchanged=packDB(db)===raw;
    if(!originalUnchanged)throw Error('synthetic original mutated: '+name);
    console.log('SAVE_INTEGRITY_AUDIT '+JSON.stringify({name,result,details,originalUnchanged}));
  }
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
