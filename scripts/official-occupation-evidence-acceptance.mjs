// 실제 자정 진행 저장의 경기 점유 근거와 날짜 소비 전 무결성. 새 훈련 정책은 만들지 않는다.
import assert from 'node:assert/strict';
import {runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('OCCUPATION_EVIDENCE '+m)},cfg=defaultWorldConfig();cfg.regions=[regionCfg('BR',{teams:10,div2:false})];cfg.internationals=[];
 // Independent initial offers change the old fixture to a 23:54:38 finish.
 // Use the same real 00:05:32 midnight case as automatic resume; assertions stay unchanged.
 const db=buildWorld(cfg),team=activeTeams(db,'BR',1)[0];startCareer(db,team.id,'midnight-existing-br-2');autoBuildInitialSquad(db,team,new RNG('midnight-roster','fixture'),5);finalizeInitialRosters(db);
 const s=Object.values(db.world.seasons)[0],day=s.days.find(d=>d.matches.some(m=>m.utcAt.endsWith('T23:00:00.000Z'))),target=day.matches.find(m=>m.utcAt.endsWith('T23:00:00.000Z'));setManagedTeam(db,target.a);let turns=0;
 while(db.world.pendingOfficial?.queue?.[0]?.matchId!==target.id){check(++turns<=30,'기존 수동 준비');playWorldDay(db);}db.world.manage='ai';playWorldDay(db);
 const daily=applyWorldDailyEffects;let packed=null;applyWorldDailyEffects=function(current,date){if(current===db&&date>day.date)packed=packDB(current);return daily(current,date);};try{playWorldDay(db);}finally{applyWorldDailyEffects=daily;}
 check(packed,'실제 자정 전 일일 소비 입력');const base=unpackDB(packed),date=addDays(day.date,1),q=base.world.pendingOfficial.queue[0],refs=pendingOfficialRefs(base,q);check(q.inflight.endAt.slice(0,10)===date,'실제 다음날 진행 종료');
 const before=JSON.stringify(base),busy=officialBookedTeams(base,date);check([target.a,target.b].every(id=>busy.has(id))&&JSON.stringify(base)===before,'조회 순수/실제 진행 두 팀 점유');
 const same=unpackDB(packDB(base));check(JSON.stringify([...officialBookedTeams(same,date)].sort())===JSON.stringify([...busy].sort()),'실제 저장 점유 동일');
 for(const mode of ['ai','fired','unemployed']){const current=unpackDB(packed);if(mode==='fired')current.world.fired=true;if(mode==='unemployed')setManagedTeam(current,null);const state=JSON.stringify(current);check(JSON.stringify([...officialBookedTeams(current,date)].sort())===JSON.stringify([...busy].sort())&&JSON.stringify(current)===state,'현재 감독 변경에도 실제 점유/조회 순수 '+mode);}
 const cases=[
  ['stored_end',d=>{const r=pendingOfficialRefs(d,d.world.pendingOfficial.queue[0]);r.m.gameTime.gameTimeThrough=addDays(date,3)+'T00:00:00.000Z';}],
  ['inflight_end',d=>{d.world.pendingOfficial.queue[0].inflight.endAt=addDays(date,3)+'T00:00:00.000Z';}],
  ['basis',d=>{d.world.pendingOfficial.queue[0].inflight.basis='damaged';}],
  ['session_team',d=>{d.world.pendingOfficial.queue[0].inflight.session.a='missing-team';}],
  ['nexus_duration',d=>{d.world.pendingOfficial.queue[0].inflight.session.games.at(-1).duration+=1;}]
 ];
 for(const [name,damage] of cases){
  const bad=unpackDB(packed);damage(bad);const original=JSON.stringify(bad),world=bad.world,club=bad.teams[target.a];let rejected=false;try{officialBookedTeams(bad,date);}catch{rejected=true;}check(rejected&&JSON.stringify(bad)===original,'손상 점유 조회 거절 '+name);
  rejected=false;try{runDailyPractice(bad);}catch{rejected=true;}check(rejected&&JSON.stringify(bad)===original,'연습 자원 작성 전 거절 '+name);
  rejected=false;try{applyWorldDailyEffects(bad,date);}catch{rejected=true;}check(rejected&&JSON.stringify(bad)===original&&bad.world===world&&bad.teams[target.a]===club,'일일 날짜/재정/의료 작성 전 거절 '+name);
 }
 // 손상 종료일이 원래 조회에서 불필요한 미래 점유를 만드는 실제 반례도 보존한다.
 const forged=unpackDB(packed),forgedRef=pendingOfficialRefs(forged,forged.world.pendingOfficial.queue[0]);forgedRef.m.gameTime.gameTimeThrough=addDays(date,6)+'T00:00:00.000Z';let falseBooking=null;
 for(let offset=1;offset<=6;offset++){const future=addDays(date,offset),normal=officialBookedTeamsBeforeResourceEvidence(base,future),wrong=officialBookedTeamsBeforeResourceEvidence(forged,future);if([target.a,target.b].some(id=>wrong.has(id)&&!normal.has(id))){falseBooking=future;break;}}check(falseBooking,'손상 저장이 추가한 원래 미래 점유 반례');
 const actual=unpackDB(packed),restored=unpackDB(packDB(base)),legacy=unpackDB(packed);
 const query=officialBookedTeams;officialBookedTeams=officialBookedTeamsBeforeResourceEvidence;try{officialDailyBeforeResourceEvidence(legacy,date);}finally{officialBookedTeams=query;}
 applyWorldDailyEffects(actual,date);applyWorldDailyEffects(restored,date);
 check(JSON.stringify(actual)===JSON.stringify(legacy),'정상 입력의 원래 일일 소비 전체 상태 동일');check(JSON.stringify(actual)===JSON.stringify(restored)&&packDB(actual)===packDB(restored),'정상 날짜 소비 저장 전체 값/바이트 동일');
 check([target.a,target.b].every(id=>actual.teams[id].practiceDay.drills===0),'진행 경기 참가팀 연습 중복 없음');check(applyWorldDailyEffects(actual,date)===false,'일일 소비 한 번');
 const later=addDays(date,1),oldLater=officialBookedTeamsBeforeResourceEvidence(actual,later);check(JSON.stringify([...officialBookedTeams(actual,later)].sort())===JSON.stringify([...oldLater].sort()),'기존 이후 날짜 점유/정책 동일');
 return {actualMidnightInput:true,currentAuthorityIndependentPhysicalOccupation:true,falseBooking,date,actualInflightEnd:q.inflight.endAt,queryPure:true,savedOccupationSame:true,rejectedCases:cases.map(x=>x[0]),practiceWriteInert:true,dailyAllWritesInert:true,originalWholeDailyState:true,wholeSaveValuesAndBytes:true,noDuplicatePractice:true,dailyOnce:true,laterCalendarUnchanged:true};
})()`,{timeout:120000});
assert(result.dailyAllWritesInert&&result.originalWholeDailyState);
console.log('OFFICIAL_OCCUPATION_EVIDENCE_ACCEPTANCE',JSON.stringify(result));
