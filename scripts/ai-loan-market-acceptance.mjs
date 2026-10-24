import assert from 'node:assert/strict';
import {runEngineFixture,testHarnessStats} from './test-harness.mjs';
const contexts=testHarnessStats().contexts;
const result=await runEngineFixture(String.raw`(()=>{
 const check=(ok,msg)=>{if(!ok)throw Error('AI_LOAN_MARKET '+msg)};
 function fixture(count=1){
  const cfg=defaultWorldConfig();cfg.regions=['NA','EU','KR'].map(id=>regionCfg(id,{teams:count*2+1,div2:false}));cfg.internationals=[];
  let db=buildWorld(cfg);const pairs=[];let managed=null;
  for(const R of Object.values(db.regions)){
   const teams=activeTeams(db,R.id,1).filter(t=>!t.parent),other=teams.at(-1);if(!managed)managed=other.id;
   // Existing protected starters have wages above the borrower's room: isolate
   // the global cap from the separate eight-candidate scouting shortlist.
   for(const t of teams){const borrower=teams.indexOf(t)<count*2&&teams.indexOf(t)%2===1;
    for(const role of ROLES){const base=borrower?(role===ROLES[0]?20:70):95,p=genPlayer(db,new RNG('loan-cap/'+t.id,role),{region:R.id,role,age:24,base});p.attrs=Object.fromEntries(Object.keys(p.attrs).map(k=>[k,base]));p.reputation=base;signContract(db,p,t,borrower?2:500,2,{promisedRole:'starter'});}t.finance.cash=1000;
   }
   for(let i=0;i<count;i++){
    const owner=teams[i*2],borrower=teams[i*2+1],p=genPlayer(db,new RNG('loan-cap/'+R.id,'bench/'+i),{region:R.id,role:ROLES[0],age:22,base:80});
    p.attrs=Object.fromEntries(Object.keys(p.attrs).map(k=>[k,80]));p.reputation=80;p.personality.ambition=10;p.careerGoal='stability';signContract(db,p,owner,50,2,{promisedRole:'backup'});p.rosterRole='backup';pairs.push({region:R.id,owner:owner.id,borrower:borrower.id,pid:p.id});
   }
   for(const t of teams){for(const role of ROLES){const pid=t.roster.find(id=>db.players[id].role===role&&!pairs.some(pair=>pair.pid===id));setDepthStarter(db,t,role,pid,'fixture',true);}initializeDepthChart(db,t,false);}
  }
  db.world={phase:'season',year:db.year,seed:'loan-cap-real',manage:'manual',seasons:{},registrationVersion:1};setManagedTeam(db,managed);setWorldCalendarDate(db,db.year+'-01-10');initializeOfficialRegistrations(db);db=unpackDB(packDB(db));return {db,pairs,managed};
 }
 const command=(db,pair)=>({type:'player.loan',actor:'ai',pid:pair.pid,fromId:db.players[pair.pid].team,teamId:pair.borrower,duration:'half',salaryShare:1,fee:0,promisedRole:'starter',recall:true});
 const canonical=v=>JSON.stringify(v,(_k,x)=>x&&!Array.isArray(x)&&typeof x==='object'?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x);
 const loans=db=>Object.values(db.players).filter(p=>p.loan).sort((a,b)=>a.id.localeCompare(b.id));
 const reorder=(object,mode)=>Object.fromEntries(Object.entries(object).sort(([a],[b])=>mode===1?b.localeCompare(a):a.localeCompare(b)));
 const rows=[];
 for(const count of [1,4,7]){
  const f=fixture(count),saved=packDB(f.db),outcomes=[];
  for(const mode of [0,1,2]){
   const db=unpackDB(saved);
   if(mode){db.regions=reorder(db.regions,mode);db.teams=reorder(db.teams,mode);db.players=reorder(db.players,mode);}
   const managedBefore=canonical(db.teams[f.managed]),contracts=Object.fromEntries(Object.values(db.players).map(p=>[p.id,canonical(p.contract)])),cash=Object.fromEntries(Object.values(db.teams).map(t=>[t.id,t.finance.cash]));
   for(const pair of f.pairs){const before=packDB(db),preview=previewWorldAction(db,command(db,pair));check(preview.ok,'controlled loan must be legal '+pair.region+' '+JSON.stringify(preview));check(packDB(db)===before,'preview must be pure');}
   const deals=aiReviewLoanMarket(db),active=loans(db);
   check(deals===count*3&&active.length===deals,'lawful regional opportunities dropped '+deals+'/'+count*3);
   check(canonical(db.teams[f.managed])===managedBefore,'AI modified managed club');
   for(const pair of f.pairs)check(active.some(p=>p.loan.borrowerId===pair.borrower),'regional borrower starved');
   for(const p of active){check(contracts[p.id]===canonical(p.contract),'original contract rewritten');check(contractedMoveCount(db,p)===1,'loan counted more than once');check(!db.teams[p.loan.ownerId].roster.includes(p.id)&&db.teams[p.loan.borrowerId].roster.includes(p.id),'ownership/roster inconsistent');}
   for(const t of Object.values(db.teams))check(t.finance.cash===cash[t.id],'free wage loan invented fee');
   const first=packDB(db);check(aiReviewLoanMarket(db)===0&&packDB(db)===first,'duplicate window changed save');
   const restored=unpackDB(first);check(packDB(restored)===first,'native save changed loans or receipts');check(aiReviewLoanMarket(restored)===0&&packDB(restored)===first,'reload repeated review');
   setWorldCalendarDate(db,db.year+'-02-10');processLoanDaily(db);
   const wages=Object.values(db.teams).reduce((n,t)=>n+(t.finance.loanWages?.amount||0),0);check(Math.abs(wages)<1e-8,'wage ledger not conserved');
   for(const pair of f.pairs)check((db.teams[pair.borrower].finance.loanWages?.amount||0)>0,'real borrower wages missing');
   const accrued=packDB(db);processLoanDaily(db);check(packDB(db)===accrued,'wages accrued twice');
   outcomes.push(canonical(db));
  }
  check(outcomes.every(x=>x===outcomes[0]),'same seed depends on region/team/player enumeration');rows.push({regions:3,clubsPerRegion:count*2+1,deals:count*3,permutations:3});
 }
 // A removed cap is not a promise to transact: existing consent, window,
 // medical/registration and economic authority remain the only gateway.
 const retainedCases=[];
 for(const scenario of ['recall','expiresBefore','covering','obligation']){
  const {db,pairs}=fixture(),[a,b,c]=pairs,A=db.teams[a.owner],original=starterFor(db,A,ROLES[0]);
  for(const id of A.roster)db.players[id].contract.salary=2;
  original.attrs=Object.fromEntries(Object.keys(original.attrs).map(k=>[k,50]));original.reputation=50;original.contract.salary=50;original.personality.ambition=10;original.careerGoal='stability';
  const incoming={...command(db,b),teamId:A.id,duration:scenario==='covering'?'season':'half',recall:scenario==='recall'};
  if(scenario==='obligation'){const quote=aiLoanPurchaseProposal(db,db.players[b.pid],A);check(quote.purchase,'existing lawful purchase proposal');incoming.purchase={...quote.purchase,type:'obligation'};}
  check(commitWorldAction(db,incoming).ok,'real incoming loan '+scenario);setDepthStarter(db,A,ROLES[0],b.pid,'fixture',true);
  const outgoingDuration=['expiresBefore','obligation'].includes(scenario)?'season':'half',first={...command(db,a),duration:outgoingDuration};
  check(commitWorldAction(db,first).ok,'first outgoing loan leaves five durable players '+scenario);
  const second={...command(db,c),pid:original.id,fromId:A.id,duration:outgoingDuration};
  if(scenario==='obligation')second.purchase={type:'option',fee:sellerTransferAsk(db,original,A),salary:Math.max(original.contract.salary,asking(db,original,db.teams[c.borrower].region))*2,years:2,terms:{promisedRole:'starter',releaseGuaranteeRate:1}};
  const before=packDB(db),plan=previewWorldAction(db,second);
  check(packDB(db)===before,'retained squad preview changed state');
  check(previewWorldAction(unpackDB(packDB(db)),second).ok===plan.ok,'retained consent changed after native save');
  if(scenario==='covering'||scenario==='obligation'){
   check(plan.ok,'non-recallable longer contract legitimately covers outgoing loan');
   if(scenario==='covering'){db.players[b.pid].loan.recall=true;const changed=packDB(db);check(!applyWorldAction(db,plan).ok&&packDB(db)===changed,'stale incoming recall terms authorized outgoing loan');db.players[b.pid].loan.recall=false;}
   check(commitWorldAction(db,second).ok,'valid longer cover failed existing writer');
  }
  else{
   check(!plan.ok&&!commitWorldAction(db,second).ok&&packDB(db)===before,'AI lent below retained minimum '+scenario);
   const manual=unpackDB(before);setManagedTeam(manual,A.id);check(previewWorldAction(manual,{...second,actor:'manager'}).ok,'explicit lender manager consent removed');
  }
  if(scenario==='recall'){
   const p=db.players[b.pid],result=commitWorldAction(db,{type:'player.loan-return',actor:'ai',pid:p.id,fromId:A.id,teamId:b.owner});
   check(result.ok&&!p.loan&&A.roster.length===5&&medicalAvailable(db,A)===5,'independent real recall leaves original club with five');
  }
  retainedCases.push(scenario);
 }
 {
  const {db,pairs}=fixture(),a=pairs[0],A=db.teams[a.owner],patient=db.players[A.roster.find(id=>id!==a.pid)];
  check(startMedicalEvent(db,patient,'injury','moderate',14)?.out&&medicalAvailable(db,A)===5,'actual medical five-player fixture');
  const before=packDB(db),plan=previewWorldAction(db,command(db,a));check(!plan.ok&&!commitWorldAction(db,command(db,a)).ok&&packDB(db)===before,'AI lent the medically protected fifth player');retainedCases.push('medical');
 }
 {
  const {db,pairs}=fixture(),[a,b,c]=pairs,A=db.teams[a.owner],p=starterFor(db,A,ROLES[0]);
  for(const id of A.roster)db.players[id].contract.salary=2;
  p.attrs=Object.fromEntries(Object.keys(p.attrs).map(k=>[k,50]));p.reputation=50;p.contract.salary=50;p.personality.ambition=10;p.careerGoal='stability';
  const cmd=(pid,fromId,teamId,extra={})=>({type:'player.loan',actor:'ai',pid,fromId,teamId,duration:'half',salaryShare:1,fee:0,promisedRole:'starter',recall:true,...extra});
  check(commitWorldAction(db,cmd(b.pid,b.owner,A.id,{duration:'season',recall:false})).ok,'longer non-recallable arrival');setDepthStarter(db,A,ROLES[0],b.pid,'fixture',true);
  const purchase=(pid,toId)=>{const player=db.players[pid],to=db.teams[toId];return {purchase:{type:'option',fee:sellerTransferAsk(db,player,A),salary:Math.max(player.contract.salary,asking(db,player,to.region))*2,years:2,terms:{promisedRole:'starter',releaseGuaranteeRate:1}}};};
  const first=cmd(a.pid,A.id,a.borrower,purchase(a.pid,a.borrower));check(commitWorldAction(db,first).ok,'first actual outgoing option');
  const second=cmd(p.id,A.id,c.borrower,purchase(p.id,c.borrower)),before=packDB(db),plan=previewWorldAction(db,second);
  check(!plan.ok&&!commitWorldAction(db,second).ok&&packDB(db)===before,'temporary longer arrival covered possible permanent second departure');
  const manual=unpackDB(before);setManagedTeam(manual,A.id);check(previewWorldAction(manual,{...second,actor:'manager'}).ok,'explicit manager permanent-risk consent removed');
  check(commitWorldAction(db,{type:'player.loan-purchase',actor:'ai',pid:a.pid,fromId:A.id,teamId:a.borrower}).ok,'already negotiated independent option blocked');
  setWorldCalendarDate(db,db.year+'-12-31');processLoanDaily(db);check(db.players[b.pid].team===b.owner&&A.roster.length===5&&medicalAvailable(db,A)===5,'real option exercise and incoming expiry lost fifth owned player');
  retainedCases.push('outgoingPurchaseRisk');
 }
 const blocked=[];
 for(const reason of ['managed','noSupply','budget','closed','offseason','reviewed']){
  const {db,pairs}=fixture();
  if(reason==='managed')setManagedTeam(db,pairs[0].borrower);
  if(reason==='noSupply')for(const pair of pairs)db.players[pair.pid].retired=true;
  if(reason==='budget')for(const pair of pairs)db.players[pair.pid].contract.salary=1e6;
  if(reason==='closed')setWorldCalendarDate(db,db.year+'-02-01');
  if(reason==='offseason')db.world.phase='offseason';
  if(reason==='reviewed')db.world.loanMarketReviews=Object.fromEntries(pairs.map(pair=>[pair.region+'/'+db.year+'/01-07',db.worldDate]));
  const before=packDB(db),deals=aiReviewLoanMarket(db);
  if(reason==='managed'){check(!loans(db).some(p=>p.loan.borrowerId===pairs[0].borrower||p.loan.ownerId===pairs[0].borrower),'managed economics bypass');}
  else check(deals===0&&!loans(db).length,'invented loan despite '+reason);
  if(['closed','offseason','reviewed'].includes(reason))check(packDB(db)===before,'historical receipt/window state changed '+reason);
  blocked.push(reason);
 }
 return {rows,blocked,retainedCases,actualConsentGateway:true,nativeSave:true,duplicate:true,ledgerConserved:true};
})()`,{filename:'ai-loan-market.vm.js',timeout:180000});
assert.equal(testHarnessStats().contexts,contexts+1,'one fresh acceptance VM');
console.log('AI_LOAN_MARKET_ACCEPTANCE '+JSON.stringify(result));
