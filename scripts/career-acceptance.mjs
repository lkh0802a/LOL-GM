// 11.5/5-4b: bounded multi-year career + save/legacy restore acceptance.
// Deliberately uses the canonical standalone engine modules and real league
// simulation/market writers, not hand-crafted season winners or fake rosters.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ENGINE_MODULES } from './artifact-modules.mjs';
import vm from 'node:vm';

const resultPath=process.env.CAREER_RESULT_FILE;
const checkpoints=[];
const fingerprint=value=>createHash('sha256').update(JSON.stringify(value,(key,item)=>{
  if(key==='saveId')return undefined;
  return item&&typeof item==='object'&&!Array.isArray(item)
    ?Object.fromEntries(Object.keys(item).sort().map(k=>[k,item[k]])):item;
})).digest('hex');

const artifact=resolve(import.meta.dirname,'..','src','artifact');
let source='';
for(const file of ENGINE_MODULES)source+=(await readFile(resolve(artifact,file),'utf8'))+'\n';
source+=String.raw`
(()=>{
  const fail=message=>{throw new Error('Stage 5-4b career acceptance: '+message)};
  const assert=(condition,message)=>{if(!condition)fail(message)};
  const cfg=defaultWorldConfig();
  // Small but real ten-team domestic competition, including postseason.
  cfg.regions=[regionCfg('NA',{teams:10,splits:1,legs:1,regularBo:1,
    playoffBo:1,playoffTake:4,format:'rr_po',div2:false,system:'franchise'})];
  cfg.internationals=[];
  cfg.subs=0;
  cfg.changes='none';
  let db=buildWorld(cfg);
  const owner=activeTeams(db,null,1)[0];
  assert(owner&&db.year===2027,'small-world initialization failed');
  startCareer(db,owner.id,'stage5-4b-long-career');
  autoBuildInitialSquad(db,owner,new RNG('stage5-4b-user-roster','user'),5);
  finalizeInitialRosters(db);
  assert(db.world.phase==='season','initial-roster market did not start a season');
  const teamId=owner.id;
  const rows=[];
  let resumes=0,legacyResumes=0,totalMatches=0;
  const checkpoint=(why,legacy=false)=>{
    const before=JSON.stringify(db),saved=packDB(db);
    assert(JSON.stringify(db)===before,'save packing mutated runtime at '+why);
    const data=JSON.parse(saved);
    assert(data.version===15&&data.saveFormat===2&&data.packed===1,
      'save schema drift at '+why);
    if(legacy){
      delete data.saveFormat;
      delete data.players[Object.keys(data.players)[0]].activeLocalRegion;
      const normalized=unpackDB(JSON.stringify(data));
      assert(normalized.saveFormat===2,'format-1 compatibility failed at '+why);
      db=normalized;legacyResumes++;
    }else{
      db=unpackDB(saved);resumes++;
    }
    assert(db.manager.teamId===teamId&&!rosterIntegrityErrors(db).length,
      'save/restore altered managed team or rosters at '+why);
    assert(!Object.prototype.hasOwnProperty.call(db,'_marketDemandCache')&&
      !Object.prototype.hasOwnProperty.call(db,'initialPayrollFloorCache'),
      'transient caches leaked into resumed save at '+why);
    if(__careerObserve)__careerCheckpoint(why,legacy,db,JSON.parse(packDB(db)));
    return db;
  };
  checkpoint('first season bootstrap');
  for(let cycle=0;cycle<2;cycle++){
    const expectedYear=2027+cycle;
    assert(db.year===expectedYear&&db.world.year===expectedYear,
      'year rollover drift before season '+expectedYear);
    let dates=0,playedMatches=0,seasonSaves=0;
    while(db.world.phase==='season'&&dates++<250){
      const date=nextDate(db);
      if(date===null){advanceStep(db);continue}
      db.worldDate=date;
      // Real competition writers resolve standings and knockout brackets.
      for(const s of activeSeasons(db).filter(s=>s.days[s.cur].date===date)){
        const day=s.days[s.cur];
        const r=playDay(db,s);
        assert(r&&r.day===day,'scheduled league day did not advance');
        playedMatches+=day.matches.filter(m=>!!m.res).length;
      }
      if(!activeSeasons(db).length)advanceStep(db);
      if(seasonSaves===0&&playedMatches>0){
        const preserved=playedMatches;
        checkpoint('in-season '+expectedYear,cycle===0);
        assert(db.world.phase==='season'&&
          Object.values(db.world.seasons).some(s=>s.days.some(d=>d.matches.some(m=>m.res))),
          'saved season lost already completed official match');
        playedMatches=preserved;
        seasonSaves++;
      }
    }
    assert(db.world.phase==='offseason'&&dates<250&&playedMatches>0,
      'real competition did not reach offseason '+expectedYear);
    const finished=Object.values(db.world.seasons);
    assert(finished.length>0&&finished.every(s=>s.done&&s.champion),
      'season champion or completed bracket missing '+expectedYear);
    const matchIds=finished.flatMap(s=>s.days.flatMap(d=>d.matches.map(m=>m.id)));
    assert(matchIds.length===new Set(matchIds).size&&
      finished.every(s=>s.days.every(d=>d.matches.every(m=>!!m.res))),
      'duplicate or unfinished official fixture '+expectedYear);
    totalMatches+=playedMatches;
    checkpoint('offseason boundary '+expectedYear);
    const report=runOffseason(db);
    assert(db.world.phase==='market'&&db.year===expectedYear+1&&
      report.rookieGlobal&&report.rookies.length===1,
      'rookie intake or year handoff failed '+expectedYear);
    assert(!rosterIntegrityErrors(db).length&&
      !talentSupplyErrors(db).length,'offseason damaged roster/supply '+expectedYear);
    checkpoint('open player market '+expectedYear,cycle===1);
    closeMarket(db);
    assert(db.world.phase==='preseason'&&
      !rosterIntegrityErrors(db).length,'market close damaged roster '+expectedYear);
    for(const team of activeTeams(db)){
      const lim=initialSquadLimits(db,team);
      assert(team.roster.length>=lim.min&&team.roster.length<=lim.max,
        'team depth out of bounds after market '+expectedYear+' '+team.id);
      for(const role of ROLES)assert(!!starterFor(db,team,role),
        'missing starter after market '+expectedYear+' '+team.id+' '+role);
    }
    rows.push({season:expectedYear,matches:playedMatches,rookies:report.rookies[0].count,
      players:Object.keys(db.players).length,saves:resumes+legacyResumes});
    checkpoint('closed player market '+expectedYear);
    if(cycle===0){
      startWorldSeason(db,teamId,'stage5-4b-long-career');
      checkpoint('second season bootstrap');
    }
  }
  assert(rows.length===2&&totalMatches>=50&&resumes>=5&&legacyResumes===2,
    'two-year acceptance did not cover enough real league games and saved phases');
  console.log('CAREER_ACCEPTANCE '+JSON.stringify({
    seasons:rows,officialMatches:totalMatches,
    modernSaveResumes:resumes,legacySaveResumes:legacyResumes,
    worldVersion:db.version,saveFormat:db.saveFormat
  }));
})();
`;
vm.runInNewContext(source,{console,Date,Math,JSON,Set,Map,WeakMap,Object,Array,String,
  Number,Boolean,RegExp,Error,Intl,performance,crypto,
  __careerObserve:!!resultPath,
  __careerCheckpoint:(phase,legacy,db,persisted)=>{
    checkpoints.push({phase,legacy,runtime:fingerprint(db),persisted:fingerprint(persisted)});
  }},{timeout:120000});
if(resultPath)await writeFile(resultPath,JSON.stringify({checkpoints},null,2)+'\n');
