// 실제 자정 초과 경기 결과를 재사용한 제한된 단계 종료 입력. 자연 발생 시즌 빈도 검사가 아니다.
import assert from 'node:assert/strict';
import {runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('STAGE_ACTUAL_END '+m)},cfg=defaultWorldConfig();cfg.regions=[regionCfg('BR',{teams:10,div2:false})];cfg.internationals=[];
 // Independent initial offers change the old fixture to a 23:54:38 finish.
 // Use the same real 00:05:32 midnight case as automatic resume; assertions stay unchanged.
 let db=buildWorld(cfg);const team=activeTeams(db,'BR',1)[0];startCareer(db,team.id,'midnight-existing-br-2');autoBuildInitialSquad(db,team,new RNG('midnight-roster','fixture'),5);finalizeInitialRosters(db);
 const season=Object.values(db.world.seasons)[0],day=season.days.find(d=>d.matches.some(m=>m.utcAt.endsWith('T23:00:00.000Z'))),target=day.matches.find(m=>m.utcAt.endsWith('T23:00:00.000Z'));let turns=0;setManagedTeam(db,target.a);while(db.world.pendingOfficial?.queue?.[0]?.matchId!==target.id){check(++turns<=30,'기존 수동 준비 도달');playWorldDay(db);}db.world.manage='ai';
 while(!target.res){check(++turns<=30,'실제 자정 경기 소비 범위');playWorldDay(db);}
 const record=officialGameTimeRecord(target,target.res.games);check(record.gameTimeThrough.slice(0,10)>day.date&&officialGameTimeSame(record,target.gameTime),'기존 실제 소요 시간/넥서스의 자정 초과');check(target.res.games.every(g=>g.publicRecord.ending.kind==='nexus'),'실제 넥서스 결과');
 // 경기/날짜/결과를 변경하지 않고 이 완료일을 단계 종료 입력으로 격리한다.
 season.days=[day];season.cur=1;season.done=true;db.world.seasons={[season.key]:season};negotiationStore(db);recruitmentStore(db);
 const initial=packDB(db);db=unpackDB(initial);const old=unpackDB(initial);officialAdvanceStepBeforePeerPeriods(old);
 const planned=old.world.lastDate,actual=record.gameTimeThrough.slice(0,10);check(planned<actual,'원래 예정일 기준 경계 반례');
 const saved=unpackDB(initial),beforeResults=JSON.stringify(db.world.seasons[season.key].days);advanceStep(db);advanceStep(saved);
 check(db.world.lastDate===actual&&saved.world.lastDate===actual,'실제 종료 날짜 기준 기존 간격 시작');
 check(JSON.stringify(db)===JSON.stringify(saved)&&packDB(db)===packDB(saved),'저장 복원 전체 상태/바이트 동일');
 check(JSON.stringify(db.world.seasons[season.key].days)===beforeResults,'원래 편성/경기/결과 불변');
 const future=Object.values(db.world.seasons).find(s=>!s.done),oldFuture=Object.values(old.world.seasons).find(s=>!s.done);const expectedWriter=unpackDB(initial);expectedWriter.world.lastDate=actual;officialAdvanceStepBeforePeerPeriods(expectedWriter);check(JSON.stringify(db)===JSON.stringify(expectedWriter),'기존 다음 시즌 작성자의 전체 결과/방송 요일 규칙 보존');
 const legacy=unpackDB(initial);for(const m of legacy.world.seasons[season.key].days[0].matches)delete m.gameTime;const expected=unpackDB(packDB(legacy));advanceStep(legacy);officialAdvanceStepBeforePeerPeriods(expected);check(JSON.stringify(legacy)===JSON.stringify(expected),'실제 시각 없는 기존 기록 추정 없음');
 const bad=unpackDB(initial);bad.world.seasons[season.key].days[0].matches.find(m=>m.id===target.id).gameTime.gameTimeThrough=addDays(actual,1)+'T00:00:00.000Z';const before=JSON.stringify(bad);let rejected=false;try{advanceStep(bad);}catch{rejected=true;}check(rejected&&JSON.stringify(bad)===before,'손상 종료 근거는 작성 전 거절');
 return {planned,actual,nextStart:future.days[0].date,oldNextStart:oldFuture.days[0].date,actualNexus:true,wholeSaveSame:true,originalFixtureAndResult:true,legacyUnchanged:true,damagedEndInert:true,scope:'실제 엔진 자정 경기의 제한된 완료 단계 입력; 자연 발생 전체 시즌 수용 아님'};
})()`,{timeout:120000});
assert(result.wholeSaveSame&&result.damagedEndInert);
console.log('OFFICIAL_STAGE_END_ACCEPTANCE',JSON.stringify(result));
