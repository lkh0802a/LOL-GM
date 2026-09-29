// Real event time zones, KST broadcast display, DST and bilateral practice hours.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';
const base=resolve(import.meta.dirname,'..','src','artifact');
let engine='';
for(const file of ENGINE_MODULES)
  engine+=await readFile(resolve(base,file),'utf8')+'\n';
const fixture=String.raw`(()=>{
  const verify=(condition,msg)=>{if(!condition)throw new Error('TIMEZONE_ACCEPTANCE '+msg)};
  const utc=(day,time,zone)=>venueToUtc(day,time,zone);
  verify(utc('2027-01-14','20:00','America/Los_Angeles')==='2027-01-15T04:00:00.000Z',
    'January Los Angeles PST must be UTC-8');
  verify(utc('2027-07-14','20:00','America/Los_Angeles')==='2027-07-15T03:00:00.000Z',
    'July Los Angeles PDT must be UTC-7');
  verify(utc('2027-01-14','17:00','Europe/Berlin')==='2027-01-14T16:00:00.000Z',
    'Berlin winter CET conversion failed');
  verify(utc('2027-07-14','17:00','Europe/Berlin')==='2027-07-14T15:00:00.000Z',
    'Berlin summer CEST conversion failed');
  verify(utc('2027-07-14','17:00','Asia/Seoul')==='2027-07-14T08:00:00.000Z',
    'KST must not observe summer time');
  verify(venueClockParts('2027-07-15T03:00:00.000Z','Asia/Seoul').time==='12:00',
    'broadcast cannot be converted to Korean viewing hours');
  const cfg=defaultWorldConfig();
  cfg.regions=[
    regionCfg('KR',{teams:10,splits:1,legs:1,regularBo:1,
      playoffBo:1,playoffTake:4,format:'rr_po',div2:false,system:'franchise'}),
    regionCfg('NA',{teams:10,splits:1,legs:1,regularBo:1,
      playoffBo:1,playoffTake:4,format:'rr_po',div2:false,system:'franchise'})
  ];
  cfg.internationals=[];cfg.subs=0;cfg.changes='none';
  const db=buildWorld(cfg),managed=activeTeams(db,'KR',1)[0];
  startCareer(db,managed.id,'real-timezones');
  autoBuildInitialSquad(db,managed,new RNG('tz-roster','user'),5);
  finalizeInitialRosters(db);
  const kr=Object.values(db.world.seasons).find(s=>s.region==='KR'&&s.div===1),
    na=Object.values(db.world.seasons).find(s=>s.region==='NA'&&s.div===1);
  verify(kr&&na,'both domestic regions must have actual broadcast seasons');
  const krFirst=kr.days[0].matches[0],naFirst=na.days[0].matches[0];
  verify(krFirst.timeZone==='Asia/Seoul'&&naFirst.timeZone==='America/Los_Angeles',
    'league broadcast did not select its physical local venue');
  verify(naFirst.localDate<na.days[0].date&&
    na.days[0].date===naFirst.utcAt.slice(0,10),
    'LA evening broadcast was not processed on the next UTC calendar day');
  verify(krFirst.localDate===kr.days[0].date&&
    kr.days[0].date===krFirst.utcAt.slice(0,10),
    'Korean broadcast must use same local and UTC calendar date');
  verify(venueClockParts(naFirst.utcAt,naFirst.timeZone).date===naFirst.localDate&&
    venueClockParts(naFirst.utcAt,naFirst.timeZone).time===naFirst.time,
    'absolute UTC kickoff cannot be converted back to the original local broadcast');
  verify(fixtureTimeInfo(naFirst).includes('한국')&&
    fixtureTimeInfo(naFirst).includes('KST')&&
    fixtureTimeInfo(naFirst).includes('2027-01-20'),
    'Korean viewing time and potentially different local date must be displayed');
  const utcDate=na.days[0].date,localDate=naFirst.localDate;
  verify(officialBookedTeams(db,utcDate).has(naFirst.a)&&
    officialBookedTeams(db,localDate).has(naFirst.a),
    'official event must block both actual UTC and venue-local date');
  // Already-played official games still occupy the broadcast slot.
  naFirst.res={winner:naFirst.a,score:[2,0]};
  verify(officialBookedTeams(db,utcDate).has(naFirst.a)&&
    officialBookedTeams(db,localDate).has(naFirst.a),
    'completed official games lost the booked time zone date');
  naFirst.res=null;
  db.worldDate=localDate;
  verify(scrimDailyCapacity(db,db.teams[naFirst.a])===0,
    'practice should be blocked on local match day even when UTC is tomorrow');
  const intlTeams=[activeTeams(db,'NA',1)[0].id,managed.id];
  db.competitions.TIMEZONE_NEUTRAL={id:'TIMEZONE_NEUTRAL',teams:intlTeams,
    international:true,stages:[{id:'rr',name:'neutral',type:'round_robin',
      legs:1,bestOf:1}]};
  const intl=newSeason(db,'TIMEZONE_NEUTRAL',db.year,'neutral-timezone',
    '2027-07-12','TIMEZONE_NEUTRAL');
  verify(intl.venueRegion&&
    intl.venueTimeZone===venueZone(db,intl.venueRegion)&&
    intl.days.every(d=>d.matches.every(m=>m.utcAt&&
      m.utcAt.slice(0,10)===d.date&&m.timeZone===intl.venueTimeZone)),
    'international event must use one neutral hosting region and real UTC timing');

  // A 16–20 club Pacific league has simultaneous *local* TV dates whose
  // early and late matches occupy different UTC dates. No fixture may be
  // dropped, duplicated, or processed twice after midnight.
  let rollover=0;
  for(const n of [10,12,16,18,20]){
    const R=regionCfg('NA',{teams:n,legs:2,format:'rr_po',div2:false}),
      teamIds=Array.from({length:n},(_,i)=>'ZONE_FAKE_'+n+'_'+i),
      id='ZONE_BROADCAST_'+n;
    db.competitions[id]={id,region:'NA',teams:teamIds,
      stages:leagueStages(R,n,1)};
    const fixture=newSeason(db,id,2027,'tz-competition-'+n,'2027-01-19',id),
      matches=fixture.days.filter(d=>d.stage==='regular')
        .flatMap(d=>d.matches.map(m=>({m,d}))),
      local=matches[0].m.localDate;
    verify(fixture.days.every((d,i)=>i===0||fixture.days[i-1].date<=d.date),
      'UTC game days not chronological for '+n+' teams');
    const idSet=new Set(matches.map(x=>x.m.id));
    verify(idSet.size===matches.length,'cross-midnight lost/duplicated official match IDs');
    for(const {m,d} of matches){
      verify(m.utcAt.slice(0,10)===d.date&&
        venueClockParts(m.utcAt,m.timeZone).date===m.localDate&&
        venueClockParts(m.utcAt,m.timeZone).time===m.time,
        'local clock converted to wrong UTC date for '+n+' teams');
    }
    for(let week=0;week<4;week++){
      const from=addDays(local,week*7),to=addDays(from,7),
        weekly=matches.filter(x=>x.m.localDate>=from&&x.m.localDate<to),
        byClub=Object.fromEntries(teamIds.map(id=>[id,[]])),
        localDays=new Set();
      for(const {m} of weekly){
        localDays.add(m.localDate);
        for(const tid of [m.a,m.b])byClub[tid].push(m.localDate);
      }
      verify(localDays.size===6&&[...localDays].every(date=>
        new Date(date+'T00:00:00Z').getUTCDay()!==1),
        n+'-club broadcast week lost a local TV day or included Monday');
      verify(Object.values(byClub).every(days=>days.length===2&&
        days[0]!==days[1]),
        'club booked incorrect weekly series count across midnight '+n);
    }
    const localDays=[...new Set(matches.map(x=>x.m.localDate))];
    if(n>=16){
      const spans=localDays.filter(day=>
        new Set(matches.filter(x=>x.m.localDate===day)
          .map(x=>x.d.date)).size>=2).length;
      verify(spans>0,'large Pacific league did not exercise split UTC dates');
      rollover+=spans;
    }
    delete db.competitions[id];
  }
  // 16-team neutral Swiss is staged over several local broadcast days. Every
  // participant's first-round record must be counted exactly once when the
  // final UTC day is completed, and the next round must wait for recovery.
  const swissTeams=activeTeams(db,null,1).slice(0,16).map(t=>t.id),
    swissComp={id:'_TZ_SWISS',name:'Timezone Swiss',international:true,
      timeZone:'America/Los_Angeles',teams:swissTeams,
      stages:[{id:'sw',name:'Swiss',type:'swiss',bestOf:1,wins:3,losses:3}]};
  db.competitions._TZ_SWISS=swissComp;
  const swiss=newSeason(db,'_TZ_SWISS',db.year,'timezone-swiss','2027-01-19'),
    firstRound=swiss.days.slice(),cfgSwiss=swissComp.stages[0];
  verify(firstRound.length>=3&&firstRound.reduce((n,day)=>
    n+day.matches.length,0)===swissTeams.length/2,
    'international Swiss round was not spread across several local broadcast days');
  for(const d of firstRound){
    verify(d.matches.every(m=>m.utcAt.slice(0,10)===d.date),
      'Swiss round date must equal actual UTC start');
    for(const m of d.matches)m.res={winner:m.a,score:[1,0]};
    finalizeCompetitionDay(db,swiss,d,0,cfgSwiss);
  }
  verify(Object.values(swiss.stageData.sw.rec).every(row=>row.w+row.l===1),
    'cross-midnight Swiss bracket omitted results from earlier UTC days');
  const lastLocal=firstRound.at(-1).matches.at(-1).localDate,
    nextLocal=swiss.days.slice(firstRound.length)[0]?.matches[0]?.localDate;
  verify(nextLocal&&nextLocal>=addDays(lastLocal,2),
    'next Swiss round did not preserve one full local rest day');
  console.log('TIMEZONE_CROSS_MIDNIGHT '+JSON.stringify({
    pacificRolloverDays:rollover,swissDays:firstRound.length,
    originalSwissMatches:swissTeams.length/2
  }));

  const pair=activeTeams(db,'KR',1).flatMap((first,i,a)=>a.slice(i+1)
    .filter(second=>scrimPartnerAssessment(db,first,second).allowed)
    .map(second=>[first,second]))[0];
  verify(pair,'a real non-rival Korean pair must be available');
  const a=pair[0],b=pair[1];
  db.worldDate=addDays(kr.days[0].date,-4);
  const same=scrimTimeOverlap(db,a,b,db.worldDate,'afternoon');
  verify(same&&same.startsAt===scrimUtcRange(db,a,db.worldDate,'afternoon').startsAt,
    'same-zone teammates must share a real afternoon UTC training window');
  b.practiceTimeZone='America/Los_Angeles';
  verify(scrimTimeOverlap(db,a,b,db.worldDate,'afternoon')===null&&
    simulateBackgroundScrim(db,a,b,1,new RNG('no-utc-overlap','scrim'),
      'afternoon')===null,
    'same nominal afternoon in Korea and Los Angeles cannot be booked together');
  b.practiceTimeZone='Asia/Taipei';
  const partial=scrimTimeOverlap(db,a,b,db.worldDate,'afternoon');
  verify(scrimOverlapGames(partial)===2,
    'one-hour time-zone difference should leave only two shared practice hours');
  verify(simulateBackgroundScrim(db,a,b,3,new RNG('too-many-sets','scrim'),
    'afternoon')===null,
    'cross-timezone overlap must reject more practice games than time permits');
  delete b.practiceTimeZone;
  const rec=simulateBackgroundScrim(db,a,b,2,new RNG('utc-shared','scrim'),
    'afternoon');
  verify(rec&&rec.startsAt===same.startsAt&&
    a.scrimLog.at(-1).startsAt===b.scrimLog.at(-1).startsAt&&
    a.scrimLog.at(-1).endsAt===b.scrimLog.at(-1).endsAt,
    'mutual practice did not persist the same absolute time in both calendars');
  const loaded=unpackDB(packDB(db));
  verify(loaded.version===15&&loaded.saveFormat===2&&
    loaded.teams[a.id].scrimLog.at(-1).startsAt===rec.startsAt,
    'zone-aware scrim booking must survive v15 compact save and restore');
  const old=unpackDB(packDB(db));
  const previous=old.teams[a.id].scrimLog.at(-1);
  delete previous.startsAt;delete previous.endsAt;
  verify(scrimReadiness(old,old.teams[a.id]).availableSlots?.includes('evening'),
    'pre-timezone saves without absolute scrim times must remain compatible');
  console.log('TIMEZONE_ACCEPTANCE '+JSON.stringify({
    kr:krFirst.utcAt,la:naFirst.utcAt,koreanAudience:fixtureTimeInfo(naFirst),
    internationalHost:intl.venueRegion,sharedScrim:rec.startsAt,
    worldVersion:loaded.version,saveFormat:loaded.saveFormat
  }));
})()`;
vm.runInNewContext(engine+'\n'+fixture,{console,Date,Math,JSON,Set,Map,
  Object,Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},
  {timeout:40000});
const ui=await readFile(resolve(base,'ui-season.js'),'utf8');
if(!ui.includes('fixtureTimeInfo(m)')||
   !ui.includes('d.date)} UTC')||
   !ui.includes('new Set(d.matches.map(m=>m.localDate||d.date))'))
  throw new Error('Live broadcasts must show the real UTC day, all venue-local dates and KST conversion');
console.log('Timezone broadcast UI integration: PASS');
