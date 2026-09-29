// D01: per-day world clock, development, patch dates and official-match pause.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';
const artifact=resolve(import.meta.dirname,'..','src','artifact');
let engine='';
for(const file of ENGINE_MODULES)engine+=await readFile(resolve(artifact,file),'utf8')+'\n';
const fixture=String.raw`(()=>{
  const assert=(value,message)=>{if(!value)throw new Error('D01 calendar: '+message)};
  const cfg=defaultWorldConfig();
  cfg.regions=[regionCfg('NA',{teams:10,splits:1,legs:1,regularBo:1,
    playoffBo:1,playoffTake:4,format:'rr_po',div2:false,system:'franchise'})];
  cfg.internationals=[];cfg.subs=0;cfg.changes='none';
  let db=buildWorld(cfg);
  const user=activeTeams(db,null,1)[0];
  startCareer(db,user.id,'d01-world-days');
  autoBuildInitialSquad(db,user,new RNG('d01-roster','user'),5);
  finalizeInitialRosters(db);
  assert(db.world.phase==='season','first season did not start');
  const firstFixture=nextDate(db),initial=db.worldDate;
  assert(firstFixture>addDays(initial,8),'need an authentic inter-fixture gap');
  const domestic=Object.values(db.world.seasons).find(x=>x.region===user.region&&x.div===1);
  assert(domestic,'the real first-division fixture list is missing');
  const leagueFixtureDates=domestic.days.filter(d=>d.matches.some(m=>
    m.a===user.id||m.b===user.id)).map(d=>d.date);
  assert(leagueFixtureDates.length>=8,'league schedule does not reach eight games');
  const firstBroadcast=domestic.days[0].date,myOpening=leagueFixtureDates[0];
  for(let week=0;week<4;week++){
    const start=addDays(firstBroadcast,week*7),end=addDays(start,7);
    const weekly=leagueFixtureDates.filter(date=>date>=start&&date<end);
    assert(weekly.length===2,'each team must have two regular series per broadcast week');
    const period=domestic.days.filter(day=>day.date>=start&&day.date<end);
    assert(period.length===4,'each broadcast week must use four program days');
    assert(period.every(day=>day.broadcast&&day.matches.length>=1&&
      day.matches.every(match=>!!match.broadcastTime)),
      'series must be assigned actual dated and timed broadcast slots');
    const weekTeams=new Map();
    for(const day of period)for(const m of day.matches)for(const id of [m.a,m.b])
      weekTeams.set(id,[...(weekTeams.get(id)||[]),day.date]);
    for(const dates of weekTeams.values()){
      assert(dates.length===2,'every club must appear twice in each full broadcast week');
      const elapsed=(new Date(dates[1]+'T00:00:00Z')-
        new Date(dates[0]+'T00:00:00Z'))/86400000;
      assert(elapsed>=2&&elapsed<=5,
        'teams must have a normal recovery interval between two weekly broadcasts');
    }
  }
  const t=db.teams[user.id],p=db.players[t.roster[0]];
  assert(p,'managed team needs a real player');
  pState(p);p.fatigue=40;p.condition=75;
  const startFatigue=p.fatigue,level=ensureFacilities(t).training,initialPatch=db.patch.id;
  p.roleConversion={fromRole:p.role,targetRole:ROLES.find(role=>role!==p.role),
    progress:0,trainingDays:0,officialGames:0,scrimGames:0,
    startedYear:db.year,startedDate:db.worldDate};
  t.finance.cash=200;
  const cost=upgradeFacility(db,t,'training',{deferDays:3});
  assert(cost>0&&t.facilities.training===level,'premature training upgrade');
  const majorDate=addDays(initial,7);
  db.world.majorPatchEvents.push({date:majorDate,step:99,split:2});
  db.patches.nextDate=addDays(initial,5);
  const oldPatchCount=db.patches.list.length;
  const day1=playWorldDay(db);
  assert(day1.advanced&&day1.date===addDays(initial,1)&&day1.played.length===0,
    'first press must advance one real calendar day');
  assert(db.worldDate===day1.date&&db.world.lastDailyTick===day1.date,
    'processed date marker not retained');
  // Recovery is followed by actual private scrim practice. A club can
  // finish a productive day with higher NET fatigue, despite recuperating.
  const recovery=4+(staffProfile(t).recovery-50)/45+facilityRecoveryBonus(t),
    train=trainingIntensity(t);
  assert(p.fatigue<=startFatigue-recovery+train.fatigue+6*1.2+.01&&
    p.condition>=75+2.5+train.condition-6*.45-.01,
    'daily recovery was missing from the scrim-inclusive workload');
  assert(p.roleConversion.trainingDays===1,'no daily role-practice tick');
  assert(t.facilities.training===level,'facility benefit activated too early');
  assert(db.patch.id===initialPatch&&db.patches.list.length===oldPatchCount,
    'patch applied before its effective date');
  const previousFatigue=p.fatigue;
  assert(!applyWorldDailyEffects(db,day1.date)&&p.fatigue===previousFatigue&&
    p.roleConversion.trainingDays===1,'daily effects can be applied twice');
  const checkpoint=unpackDB(packDB(db));
  assert(checkpoint.version===15&&checkpoint.saveFormat===2&&
    checkpoint.world.lastDailyTick===day1.date&&
    checkpoint.teams[user.id].facilityProjects.length===1&&
    checkpoint.players[p.id].roleConversion.trainingDays===1,
    'daily status, construction and role progress not saved');
  for(let i=2;i<=7;i++){
    const oldDate=db.worldDate,r=playWorldDay(db);
    assert(r.advanced&&r.date===addDays(oldDate,1)&&r.played.length===0,
      'skipped an intervening calendar date '+i);
    assert(p.roleConversion.trainingDays===i,'role conversion trained an incorrect number of days');
    assert(t.facilities.training===(i<3?level:level+1),
      'facility construction completed on wrong date '+i);
    if(i<5)assert(db.patches.list.length===oldPatchCount,'early ordinary patch');
    if(i===5)assert(db.patches.list.some(rec=>rec.date===r.date),
      'ordinary patch not applied on scheduled day');
    if(i<7)assert(db.world.majorPatchEvents.length===1,'major patch applied too early');
  }
  assert(db.worldDate===majorDate&&db.world.majorPatchEvents.length===0&&
    db.patches.list.some(rec=>rec.date===majorDate&&rec.major),
    'inter-split major patch failed to apply at intended date');
  const snap=unpackDB(packDB(db)),one=unpackDB(packDB(snap)),
    batch=unpackDB(packDB(snap));
  for(let n=0;n<3;n++)playWorldDay(one);
  let steps=0;
  while(steps<3){const r=playWorldDay(batch);if(!r.advanced)break;steps++}
  const sample=world=>({
    date:world.worldDate,marker:world.world.lastDailyTick,patch:world.patch.id,
    facility:world.teams[user.id].facilities.training,
    projects:world.teams[user.id].facilityProjects,
    practice:world.players[p.id].roleConversion?.trainingDays,
    fatigue:world.players[p.id].fatigue,condition:world.players[p.id].condition
  });
  assert(JSON.stringify(sample(one))===JSON.stringify(sample(batch)),
    'multi-day progression differs from repeated one-day progression');
  let pending=null,days=0,last=db.worldDate;
  while(db.world.phase==='season'&&days++<40){
    const r=playWorldDay(db);
    assert(r&&r.date===addDays(last,1),'world clock skipped or reran a calendar date');
    last=r.date;
    if(r.pending){pending=r;break}
  }
  assert(pending&&pending.date===myOpening,'managed draft did not pause on its actual broadcast date');
  const matchDate=db.worldDate,marker=db.world.lastDailyTick,
    practice=p.roleConversion?.trainingDays,fatigue=p.fatigue,
    facility=t.facilities.training,patches=db.patches.list.length;
  const hold1=playWorldDay(db),hold2=playWorldDay(db);
  assert(hold1.pending&&hold2.pending&&!hold1.advanced&&!hold2.advanced,
    'unresolved managed series did not block progress');
  assert(db.worldDate===matchDate&&db.world.lastDailyTick===marker&&
    p.roleConversion?.trainingDays===practice&&p.fatigue===fatigue&&
    t.facilities.training===facility&&db.patches.list.length===patches,
    'paused match reran recovery, conversion, facility or patches');
  const resumed=unpackDB(packDB(db)),held=playWorldDay(resumed);
  assert(held.pending&&!held.advanced&&resumed.worldDate===matchDate&&
    resumed.world.lastDailyTick===marker,
    'save/reload changed an official match pause');
  // Genuine double-header training: on off days each team can play two
  // opponent-matched practice blocks, with 2-3 private games per block.
  const prep=unpackDB(packDB(checkpoint)),practiceDay=addDays(firstFixture,-4);
  prep.worldDate=practiceDay;
  const practiceTeams=activeTeams(prep,null,1);
  const preCap=Object.fromEntries(practiceTeams.map(team=>
    [team.id,scrimDailyCapacity(prep,team)]));
  const priorMeta=prep.metaGames||0;
  const priorLearning=Object.values(prep.players).reduce((n,player)=>n+
    Object.values(player.pool||{}).reduce((m,pr)=>m+(pr.scrimExperience||0),0),0);
  const scrimOut=aiRunScrims(prep,new RNG('d01-daily-practice','training'));
  assert(scrimOut.blocks>=2&&scrimOut.sets>=6,
    'clubs should hold multiple practice blocks and private scrim sets in one day');
  const activePractice=practiceTeams.map(team=>({
    team,dateLogs:(team.scrimLog||[]).filter(log=>log.date===practiceDay)
  })).filter(x=>x.dateLogs.length);
  assert(activePractice.some(x=>x.dateLogs.length>=2),
    'at least one club must play two distinct scrim sessions on a normal practice day');
  for(const entry of activePractice){
    const games=entry.dateLogs.reduce((total,row)=>total+row.games,0);
    assert(games<=preCap[entry.team.id],
      'practice workload exceeded pre-game rest/fatigue limits');
    assert(entry.dateLogs.every(row=>row.games>=1&&row.games<=3&&row.opponent&&
      row.wins+row.losses===row.games),
      'practice block is not recorded as actual private games against a named opponent');
  }
  const learned=Object.values(prep.players).reduce((n,player)=>n+
    Object.values(player.pool||{}).reduce((m,pr)=>m+(pr.scrimExperience||0),0),0);
  assert(learned>priorLearning,'private scrims did not train champion mastery');
  assert((prep.metaGames||0)===priorMeta,
    'private practice polluted the official patch/meta sample count');
  const checkTeam=activePractice[0].team;
  prep.worldDate=addDays(myOpening,-1);
  assert(scrimDailyCapacity(prep,user)<=2,
    'match eve should cap private practice at a light two-set session');
  prep.worldDate=myOpening;
  assert(scrimDailyCapacity(prep,user)===0&&!scrimReadiness(prep,user).ok,
    'official double-header dates cannot schedule conflicting scrims');
  const scrimSaved=unpackDB(packDB(prep));
  assert(scrimSaved.teams[checkTeam.id].scrimLog.length===checkTeam.scrimLog.length,
    'multiple same-day private scrim sessions were lost in v15 save/restore');
  const legacy=JSON.parse(packDB(resumed));
  delete legacy.saveFormat;delete legacy.world.lastDailyTick;
  const oldSave=unpackDB(JSON.stringify(legacy));
  assert(oldSave.saveFormat===2&&playWorldDay(oldSave).pending,
    'supported format-1 save cannot resume pending match');
  console.log('D01_CALENDAR_ACCEPTANCE '+JSON.stringify({
    firstFixture,daysUntilMatch:days+7,constructionCost:cost,
    roleTrainingDays:practice,patches,schema:oldSave.version,
    saveFormat:oldSave.saveFormat,managedDraftHeld:true
  }));
})()`;
vm.runInNewContext(engine+'\n'+fixture,{console,Date,Math,JSON,Set,Map,Object,Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},{timeout:40000});
const [ui,home,season,scrim]=await Promise.all(
  ['ui-season.js','app.js','season.js','scrim.js'].map(file=>readFile(resolve(artifact,file),'utf8'))
);
const check=(value,message)=>{if(!value)throw new Error('D01 UI contract: '+message)};
check(ui.includes("'#sfixture'")&&ui.includes('run(r=>r.played.length>0)')&&ui.includes("'#sday'"),
  'single calendar day and next fixture actions are missing');
check(home.includes('id="sday">하루 진행')&&home.includes('id="sfixture">다음 경기일'),
  'day-advance controls are not labelled truthfully');
check(season.includes('lastDailyTick===date')&&season.includes('majorPatchEvents.push'),
  'idempotent dates and deferred patch processing missing');
check(scrim.includes('scrimDailyCapacity')&&scrim.includes('simulateBackgroundScrim')&&
  scrim.includes('slice(-39)'),
  'multi-block daily scrim planning and multi-day practice history missing');
console.log('D01 calendar/UI integration acceptance: PASS');
