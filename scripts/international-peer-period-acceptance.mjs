import assert from 'node:assert/strict';
import {runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('INTERNATIONAL_PEER_PERIOD '+m)},cfg=defaultWorldConfig(),db=buildWorld(cfg),team=activeTeams(db,'KR',1)[0],old=JSON.parse(JSON.stringify(db));
 officialWorldSeasonBeforePeerPeriods(old,team.id,'peer-period-writer');startWorldSeason(db,team.id,'peer-period-writer');
 const east=db.world.steps.findIndex(s=>s.ids?.includes('EASTERN_CUP')),west=db.world.steps.findIndex(s=>s.ids?.includes('WESTERN_CUP'));
 check(east===west&&east>db.world.step,'동서 대회의 실제 미래 기간 공유');
 const steps=db.world.steps,originalSteps=old.world.steps,originalSummer=originalSteps.findIndex(s=>s.kind==='league'&&s.split===3);old.world.steps=steps;check(JSON.stringify(old)===JSON.stringify(db),'현재 편성/시드/구단/선수/예산/기존 전체 상태 불변');
 const patchDb=JSON.parse(JSON.stringify(db)),patchOriginal=JSON.parse(JSON.stringify(db)),summer=steps.findIndex(s=>s.kind==='league'&&s.split===3);patchDb.world.step=summer-1;advanceStep(patchDb);check(patchDb.world.majorPatchEvents.at(-1).step===originalSummer,'기간 단계 축소 뒤 원래 패치 난수 입력 보존');
 patchOriginal.world.steps=originalSteps;patchOriginal.world.step=originalSummer-1;officialAdvanceStepBeforePeerPeriods(patchOriginal);const patchDate=patchDb.world.majorPatchEvents.at(-1).date;applyCalendarPatchEvents(patchDb,patchDate);applyCalendarPatchEvents(patchOriginal,patchDate);check(JSON.stringify(patchDb.patch)===JSON.stringify(patchOriginal.patch)&&JSON.stringify(patchDb.patches)===JSON.stringify(patchOriginal.patches),'원래 실제 대형 패치 작성자 전체 결과 보존');
 const before=JSON.stringify(db);check(JSON.stringify(officialPeerPeriodSteps(db,steps))===JSON.stringify(steps)&&JSON.stringify(db)===before,'기간 조회 순수/중복 묶음 방지');
 for(const t of activeTeams(db,null,1))autoBuildInitialSquad(db,t,new RNG('peer-period-roster/'+t.id),5);
 applyWorldDailyEffects(db,addDays(db.worldDate,1));
 for(const t of activeTeams(db,null,1)){
   const registered=commitWorldAction(db,{type:'roster.register',actor:managerControlsSquad(db,t)?'manager':'ai',teamId:t.id,players:initialOfficialRoster(db,t)});
   check(registered.ok,'현재 권한의 실제 선수 등록 '+JSON.stringify(registered.errors||[]));
 }
 const baseline=JSON.stringify(db.worldConfig),set=new Set(),step=steps[east],start='2027-06-01';
 db.world.step=east;check(step.ids.every(id=>startInternational(db,id,start,set)),'기존 실제 두 국제 작성자');
 const a=db.world.seasons.EASTERN_CUP,b=db.world.seasons.WESTERN_CUP;
 check(a.step===b.step&&a.days[0].date<=b.days.at(-1).date&&b.days[0].date<=a.days.at(-1).date,'실제 동서 대회 편성 기간 겹침');
 check(db.competitions[a.comp].teams.every(id=>!db.competitions[b.comp].teams.includes(id)),'동서 참가팀 중복 없음');
 check(JSON.stringify(db.worldConfig)===baseline,'기존 대회 참가권/형식 설정 불변');
 const saved=unpackDB(packDB(db));check(JSON.stringify(saved.world.steps)===JSON.stringify(steps)&&JSON.stringify(saved.world.seasons)===JSON.stringify(db.world.seasons),'실제 기간/현재 대회 저장 복원');
 const planned=JSON.stringify(saved.world);saved.worldConfig.internationals=[];check(JSON.stringify(saved.world)===planned,'이전 저장의 생성된 단계 자동 재배치 없음');
 const unsupported=[{kind:'intl',ids:['UNKNOWN'],label:'기타'}];check(officialPeerPeriodSteps(db,unsupported)[0]===unsupported[0],'없는 설정 기간 추정 없음');
 const custom=JSON.parse(JSON.stringify(db));custom.worldConfig.internationals.find(x=>x.id==='WESTERN_CUP').prestige=2;const separate=officialPeerPeriodSteps(custom,[{kind:'intl',ids:['EASTERN_CUP'],label:'동부'},{kind:'intl',ids:['WESTERN_CUP'],label:'서부'}]);check(separate.length===2,'다른 위상 대회 임의 병합 없음');
 // 실제 새 국제 작성자의 편성을 격리해 기존 선수단/등록/세계 사건 소비까지 연결한다.
 db.world.seasons={EASTERN_CUP:a,WESTERN_CUP:b};db.world.manage='ai';initializeOfficialRegistrations(db);negotiationStore(db);recruitmentStore(db);
 setWorldCalendarDate(db,[a.days[0].date,b.days[0].date].sort()[0]);let turns=0;
 const hasResult=s=>s.days.some(d=>d.matches.some(m=>m.res));
 while(!hasResult(a)||!hasResult(b)){check(++turns<=5,'기존 첫 경기 소비 범위');playWorldDay(db);}
 const matches=[a,b].flatMap(s=>s.days.flatMap(d=>d.matches)).filter(m=>m.gameTime).sort((x,y)=>officialActualStart(x).localeCompare(officialActualStart(y)));
 check(matches.length>=2&&matches.every(m=>m.res.games.length&&m.res.games.every(g=>g.publicRecord.ending.kind==='nexus')),'실제 세계 작성자의 양 대회 넥서스 종료');
 check(matches.every((m,i)=>!i||matches[i-1].gameTime.gameTimeThrough<=officialActualStart(m)),'실제 공통 중계 무겹침');
 const consumed=unpackDB(packDB(db));check(JSON.stringify(consumed.world)===JSON.stringify(db.world),'실제 양 대회 소비 저장 복원');
 return {realSeasonWriter:true,peerPeriods:true,existingCurrentWholeState:true,originalPatchSeedStep:true,realInternationalWriters:true,distinctParticipants:true,configUnchanged:true,pureAndIdempotent:true,savedPeriods:true,existingSaveNotRewritten:true,differentPrestigeUnchanged:true,actualSharedBroadcast:true,actualNexus:true,consumedSave:true,consumedMatches:matches.length,firstDates:[a.days[0].date,b.days[0].date],sourceOfDate:'제한된 작성자 수용 입력이며 실제 공식 일정/자연 발생 빈도 근거가 아님'};
})()`,{timeout:120000});
assert(result.peerPeriods&&result.existingCurrentWholeState&&result.savedPeriods);
console.log('INTERNATIONAL_PEER_PERIOD_ACCEPTANCE',JSON.stringify(result));
