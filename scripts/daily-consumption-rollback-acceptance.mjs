import assert from 'node:assert/strict';
import {runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('DAILY_CONSUMPTION_ROLLBACK '+m)},cfg=defaultWorldConfig();cfg.regions=['NA','KR','CN','EU','AP','BR'].map(id=>regionCfg(id,{teams:['NA','KR'].includes(id)?10:4,div2:false}));
 const db=buildWorld(cfg),initial=activeTeams(db,'NA',1)[0];startCareer(db,initial.id,'scrim-plan-travel');for(const t of activeTeams(db,null,1))autoBuildInitialSquad(db,t,new RNG('schedule-basis/'+t.id),5);finalizeInitialRosters(db);db.world.seasons={};db.worldDate='2027-03-01';for(const p of Object.values(db.players)){p.fatigue=0;p.condition=96;p.medicalPlan='normal';p.injury=null;}
 let selected=null;for(let i=0;i<50&&!selected;i++){db.world.seed='scrim-trip-'+i;const future=unpackDB(packDB(db));check(startInternational(future,'WORLD_CHAMPIONSHIP','2027-03-06',new Set()),'실제 국제대회 작성자');future.worldDate='2027-03-03';const ids=future.competitions.WORLD_CHAMPIONSHIP.teams.filter(id=>future.teams[id].region==='NA');for(const a of ids){for(const b of ids){if(a===b||!scrimPartnerAssessment(future,future.teams[a],future.teams[b]).allowed)continue;setManagedTeam(db,a);const command={type:'scrim.request',teamId:a,opponentId:b,date:'2027-03-03',slot:'afternoon',games:2},preview=previewWorldAction(db,command);if(preview.ok&&preview.changes[0].status==='accepted'){selected={command,preview};break;}}if(selected)break;}}
 check(selected,'원래 독립 수락의 고정 시험 입력');const {command,preview}=selected,t=db.teams[command.teamId],o=db.teams[command.opponentId],before=JSON.stringify(db);check(previewWorldAction(db,command).ok&&JSON.stringify(db)===before,'미리보기 순수');check(applyWorldAction(db,preview).accepted,'기존 수락 작성자');
 const plan=scrimPlans(db)[0];check(plan.scheduleBasis?.startsAt===preview.changes[0].startsAt&&plan.scheduleBasis?.endsAt===preview.changes[0].endsAt,'예약 당시 실제 시간 보존');check(plan.scheduleBasis.venues.every(v=>v.region==='NA'&&v.timeZone==='America/Los_Angeles'),'예약 당시 기존 체류 지역/시간대');

 // 기존 정산 작성자의 통제된 분할금 입력이다. 실제 시장 가격이나 새 계약 정책이 아니다.
 t.finance.cash=100;o.finance.cash=100;
 settleTransferSigningFee(db,db.players[t.roster[0]],o,t,9,{upfront:3,installments:[{date:command.date,amount:6}],addOns:[]});
 // The normal-consumption case keeps the booked home venue. The separate
 // schedule-basis acceptance covers international relocation blocking.
 const nextOfficial=Object.values(db.competitions).find(c=>c.region==='NA'&&(c.div||1)===1);check(nextOfficial,'실제 국내 공식 대회');db.world.seasons[nextOfficial.id]=newSeason(db,nextOfficial.id,db.year,'daily-home-fixture','2027-03-06');check(db.world.seasons[nextOfficial.id].days.length>0,'실제 다음 공식 편성');
 const base=packDB(db),date=command.date,old=unpackDB(base),normal=unpackDB(base);
 officialDailyBeforeResourceEvidence(old,date);applyWorldDailyEffects(normal,date);
 check(JSON.stringify(normal)===JSON.stringify(old)&&packDB(normal)===packDB(old),'정상 원래 일일 작성자의 전체 상태/시드/저장');
 check(transferDealRows(normal.teams[t.id])[0].rows[0].paid===6,'실제 분할금 소비');
 check(scrimPlans(normal)[0].status==='completed','실제 예약 소비');
 const cases=['payment','recovery','scrim','practice','registration'],results=[];
 for(const kind of cases){
  const x=unpackDB(base),original=JSON.stringify(x),saved=packDB(x),refs=[x.world,x.teams,x.players,x.teams[t.id],x.players[t.roster[0]],x.news,x.world.scrimPlans,x.teams[t.id].finance],failure=Error('통제된 '+kind+' 작성 후 실패');
  const getter=()=>[x.world,x.teams,x.players,x.teams[t.id],x.players[t.roster[0]],x.news,x.world.scrimPlans,x.teams[t.id].finance];
  let ran=false,caught=null,restore;
  const wrap=writer=>function(...args){const output=writer(...args);if(args[0]===x){ran=true;throw failure;}return output;};
  if(kind==='payment'){const writer=processTransferPayments;processTransferPayments=wrap(writer);restore=()=>processTransferPayments=writer;}
  if(kind==='recovery'){const writer=medicalDailyTick;medicalDailyTick=wrap(writer);restore=()=>medicalDailyTick=writer;}
  if(kind==='scrim'){const writer=recordScrimPractice;recordScrimPractice=wrap(writer);restore=()=>recordScrimPractice=writer;}
  if(kind==='practice'){const writer=runDailyPractice;runDailyPractice=wrap(writer);restore=()=>runDailyPractice=writer;}
  if(kind==='registration'){const writer=aiReviewCompetitionStaffRegistrations;aiReviewCompetitionStaffRegistrations=wrap(writer);restore=()=>aiReviewCompetitionStaffRegistrations=writer;}
  try{applyWorldDailyEffects(x,date);}catch(error){caught=error;}finally{restore();}
  check(ran&&caught===failure,'원래 오류 객체 보존 '+kind);
  check(JSON.stringify(x)===original&&packDB(x)===saved,'실패한 하루 전체 값/저장 복구 '+kind);
  check(refs.every((ref,index)=>getter()[index]===ref),'실패한 하루 기존 객체 참조 '+kind);
  check(applyWorldDailyEffects(x,date),'명시 재시도 '+kind);
  check(JSON.stringify(x)===JSON.stringify(normal)&&packDB(x)===packDB(normal),'재시도 전체 상태/시드/저장 동일 '+kind);
  const complete=JSON.stringify(x);check(!applyWorldDailyEffects(x,date)&&JSON.stringify(x)===complete,'같은 날 중복 소비 없음 '+kind);
  results.push(kind);
 }
 const partial=unpackDB(base);const first=playWorldDay(partial);check(first?.advanced&&partial.worldDate==='2027-03-02','기존 진행의 첫 완료 날짜');
 const good=packDB(partial),completed=JSON.stringify(partial),world=partial.world,writer=recordScrimPractice;let ran=false;
 recordScrimPractice=function(...args){const result=writer(...args);if(args[0]===partial){ran=true;throw Error('두 번째 날짜의 실제 예약 소비 후 실패')}return result;};let caught=false;
 try{playWorldDay(partial);}catch{caught=true;}finally{recordScrimPractice=writer;}
 check(ran&&caught&&JSON.stringify(partial)===completed&&partial.world===world&&packDB(partial)===good,'이전 완료 날짜 보존/현재 실패 날짜 전체 복구');
 const firstRestored=unpackDB(good);playWorldDay(partial);playWorldDay(firstRestored);const wholeValues=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);check(wholeValues(partial)===wholeValues(firstRestored)&&packDB(partial)===packDB(firstRestored),'실제 진행 재시도와 저장 복원 전체 동일');
 return {normalOriginalWholeState:true,actualInstallmentPaid:6,actualBookedScrim:true,afterWriterFailures:results,originalErrorIdentity:true,wholeValuesReferencesAndSave:true,explicitRetryWholeStateAndSeed:true,duplicateDayInert:true,priorCompletedDayPreserved:true,actualWorldProgressRetryAndRestore:true};
})()`,{timeout:120000});
assert.equal(result.actualWorldProgressRetryAndRestore,true);
console.log('DAILY_CONSUMPTION_ROLLBACK_ACCEPTANCE',JSON.stringify(result));
