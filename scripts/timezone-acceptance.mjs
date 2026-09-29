// Locale clock/DST fixture grouping and cross-club scrim-hour acceptance.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';
const root=resolve(import.meta.dirname,'..','src','artifact');
let engine='';
for(const file of ENGINE_MODULES)
  engine+=await readFile(resolve(root,file),'utf8')+'\n';
const acceptance=String.raw`(()=>{
  const check=(ok,why)=>{if(!ok)throw new Error('TIMEZONE_ACCEPTANCE: '+why)};
  const fixed=[
    ['2027-01-19','17:00','Asia/Seoul','2027-01-19T08:00:00.000Z'],
    ['2027-01-19','20:00','America/Los_Angeles','2027-01-20T04:00:00.000Z'],
    ['2027-07-20','20:00','America/Los_Angeles','2027-07-21T03:00:00.000Z'],
    ['2027-01-19','17:00','Europe/Berlin','2027-01-19T16:00:00.000Z'],
    ['2027-07-20','17:00','Europe/Berlin','2027-07-20T15:00:00.000Z'],
    ['2027-01-19','17:00','America/Sao_Paulo','2027-01-19T20:00:00.000Z']
  ];
  for(const [day,hour,zone,expected] of fixed){
    const actual=zonedKickoffUTC(day,hour,zone);
    check(actual===expected,'wrong DST/offset conversion '+zone+' '+day+' '+actual);
    const roundtrip=zonedClock(actual,zone);
    check(roundtrip.date===day&&roundtrip.time===hour,
      'local date/time did not survive UTC round trip '+zone);
  }
  const cfg=defaultWorldConfig();
  cfg.regions=[regionCfg('NA',{teams:10,splits:1,legs:1,
    regularBo:1,playoffBo:1,div2:false})];cfg.internationals=[];
  cfg.subs=0;cfg.changes='none';
  const db=buildWorld(cfg),user=activeTeams(db,null,1)[0];
  startCareer(db,user.id,'timezone-world');
  autoBuildInitialSquad(db,user,new RNG('tz-initial','squad'),5);
  finalizeInitialRosters(db);
  const season=Object.values(db.world.seasons).find(s=>s.region==='NA'&&s.div===1);
  check(season.timeZone==='America/Los_Angeles','NA venue zone omitted');
  check(season.days.every((d,i)=>i===0||d.date>=season.days[i-1].date),
    'converted UTC event dates are not globally chronological');
  let utcNext=0,night=0,localMonday=0;
  for(const day of season.days){
    for(const match of day.matches){
      if(!match.startsAt)continue;
      const local=zonedClock(match.startsAt,match.timeZone);
      check(match.localDate===local.date&&match.time===local.time,
        'match wall clock is not its actual local start');
      check(match.startsAt.slice(0,10)===day.date,
        'match must be played on its actual UTC kickoff date');
      if(match.startsAt.slice(0,10)!==match.localDate)utcNext++;
      if(match.time==='20:00')night++;
      if(day.stage==='regular'&&
        new Date(match.localDate+'T00:00:00Z').getUTCDay()===1)localMonday++;
    }
  }
  check(utcNext>=night&&night>=20&&localMonday===0,
    'late-night Pacific broadcasts did not cross UTC midnight as scheduled');
  const first=season.days[0],pair=first.matches[0],
    utcDay=first.date,localDay=pair.localDate;
  check(utcDay===addDays(localDay,1),
    'west coast regular-season opening must occur next UTC calendar date');
  db.worldDate=localDay;
  const localBusy=officialBookedTeams(db);
  check(localBusy.has(pair.a)&&localBusy.has(pair.b),
    'practice not blocked on home local match date');
  db.worldDate=utcDay;
  const utcBusy=officialBookedTeams(db);
  check(utcBusy.has(pair.a)&&utcBusy.has(pair.b),
    'practice not blocked on the world UTC kickoff date');

  // A host can be 3h behind its opponent. Choose the same absolute instant,
  // not "14:00 local" independently for both teams.
  db.worldDate=addDays(utcDay,-5);
  const clubs=activeTeams(db,null,1),
    practice=clubs.flatMap((a,i)=>clubs.slice(i+1).filter(b=>
      scrimPartnerAssessment(db,a,b).allowed).map(b=>[a,b]))[0];
  check(practice,'need a genuine unrelated practice pair');
  const [west,east]=practice;
  west.timeZone='America/Los_Angeles';
  east.timeZone='America/New_York';
  const shared=scrimSharedWorkHours(db,west,east,'afternoon');
  check(shared&&shared.startsAt.slice(0,10)===db.worldDate,
    'compatible club hours were incorrectly rejected');
  check(zonedClock(shared.startsAt,teamTimeZone(db,west.id)).hour===14&&
    zonedClock(shared.startsAt,teamTimeZone(db,east.id)).hour===17,
    'clubs did not actually meet at the same instant');
  check(!scrimSharedWorkHours(db,west,east,'evening'),
    'cross-coast 19:00 Pacific cannot request 22:00 New York practice');
  const rec=simulateBackgroundScrim(db,west,east,2,
    new RNG('tz-shared-session','scrim'),'afternoon');
  check(rec&&rec.startsAt===shared.startsAt&&
    rec.slots[west.id]&&rec.slots[east.id],
    'agreed real-time practice could not be booked');
  for(const club of [west,east]){
    const log=club.scrimLog.find(x=>x.startsAt===rec.startsAt);
    check(log&&log.localDate===rec.localDates[club.id]&&
      log.timeZone===teamTimeZone(db,club.id),
      'club-local practice record has wrong day/zone');
  }
  east.timeZone='Asia/Seoul';
  check(!scrimSharedWorkHours(db,west,east,'afternoon'),
    'Los Angeles afternoon must not force Seoul early-morning practice');
  const saved=unpackDB(packDB(db));
  check(saved.version===15&&saved.saveFormat===2&&
    saved.teams[west.id].scrimLog.some(x=>x.startsAt===rec.startsAt),
    'UTC time and partner-local practice slots did not survive save roundtrip');
  // Explicit international host clocks do not silently use the manager zone.
  db.competitions._HOST={id:'_HOST',name:'Hosted event',
    international:true,timeZone:'Europe/Berlin',
    teams:clubs.map(x=>x.id),
    stages:[{id:'rr',name:'Hosted RR',type:'round_robin',bestOf:1,legs:1}]};
  const hosted=newSeason(db,'_HOST',2027,'intl-venue-test','2027-07-20');
  check(hosted.timeZone==='Europe/Berlin'&&hosted.days.every(day=>
    day.matches.every(m=>m.startsAt&&
      zonedClock(m.startsAt,m.timeZone).date===m.localDate)),
    'international venue did not determine DST-aware real kickoffs');
  console.log('TIMEZONE_ACCEPTANCE '+JSON.stringify({
    checkedOffsets:fixed.length,worldTimezone:season.timeZone,
    pastMidnight:utcNext,lateShows:night,shared:rec.startsAt,
    intl:hosted.timeZone,version:saved.version,format:saved.saveFormat
  }));
})()`;
vm.runInNewContext(engine+'\n'+acceptance,{console,Date,Math,JSON,
  Set,Map,Object,Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},
  {timeout:40000});
