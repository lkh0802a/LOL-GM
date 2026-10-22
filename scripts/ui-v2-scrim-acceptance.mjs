import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {runEngineFixture} from './test-harness.mjs';
const sources=await Promise.all(['state','market','contracts','views','management'].map(p=>readFile(new URL('../src/ui-v2/'+p+'.js',import.meta.url),'utf8')));
const result=await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('UI_V2_SCRIM '+m)},cfg=defaultWorldConfig();cfg.regions=['KR','CN'].map(id=>regionCfg(id,{teams:10,div2:false}));cfg.internationals=[];
 const db=buildWorld(cfg),a=activeTeams(db,'KR',1)[0],b=activeTeams(db,'CN',1)[0];startCareer(db,a.id,'remote-native');for(const t of activeTeams(db,null,1))autoBuildInitialSquad(db,t,new RNG('remote-roster/'+t.id),5);finalizeInitialRosters(db);db.worldDate=addDays(nextDate(db),-10);for(const p of Object.values(db.players)){p.fatigue=0;p.condition=96;p.injury=null;p.medicalPlan='normal'}
 V2.db=db;V2.target=a.id;const command={type:'scrim.request',actor:'manager',teamId:a.id,opponentId:b.id,date:addDays(db.worldDate,2),slot:'afternoon',games:2};
 let accepted=false;for(let i=0;i<50;i++){db.world.seed='design-consent-'+i;const p=previewWorldAction(db,command);if(p.ok&&p.changes[0].status==='accepted'){accepted=true;break}}check(accepted,'독립 수락 조건의 재현 가능한 시험');
 const before=JSON.stringify(db),html=v2PracticeView();check(html.includes('data-scrim-field')&&!html.includes('data-allocation')&&JSON.stringify(db)===before,'조회 순수·폐지 입력 없음');
 v2ReviewScrim(command);check(V2.managementReview&&JSON.stringify(db)===before,'검토는 요청하지 않음');V2.managementReview=null;check(JSON.stringify(db)===before,'검토 취소 무변경');
 const reference=v2Copy(db);check(commitWorldAction(reference,command).ok,'기존 writer 기준');v2ReviewScrim(command);const review=V2.managementReview;check(v2CommitManagement(review).ok,'수동 최종 요청');check(JSON.stringify(db)===JSON.stringify(reference),'현재 엔진과 전체 상태 동일');check(!a.practiceDay&&!b.practiceDay,'예약은 소비 아님');
 V2.managementReview=null;const booked=JSON.stringify(db);check(!v2CommitManagement(review).ok&&JSON.stringify(db)===booked,'중복 입력 무효');
 const id=scrimPlans(db)[0].id;v2ReviewScrim({type:'scrim.cancel',actor:'manager',id});const cancel=V2.managementReview;db.world.manage='ai';check(!v2CommitManagement(cancel).ok,'권한 변경 뒤 거절');db.world.manage='manual';check(v2CommitManagement(cancel).ok&&scrimPlans(db)[0].status==='cancelled','기존 취소 writer');
 check(scrimPlans(unpackDB(packDB(db)))[0].status==='cancelled','저장 복원');return {readPure:true,manualReviewAndCancel:true,canonicalWholeState:true,remoteConsent:true,noPracticeGrant:true,duplicateInert:true,authorityRechecked:true,saveRestore:true};
})()`,{setupSources:[...sources,`function v2Render(){}function v2Icon(){return ''}const document={getElementById(){return {textContent:''}}};`],timeout:120000});
assert(result.canonicalWholeState&&result.remoteConsent);console.log('UI_V2_SCRIM_ACCEPTANCE',JSON.stringify(result));
