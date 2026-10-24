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
 return {rows,blocked,actualConsentGateway:true,nativeSave:true,duplicate:true,ledgerConserved:true};
})()`,{filename:'ai-loan-market.vm.js',timeout:180000});
assert.equal(testHarnessStats().contexts,contexts+1,'one fresh acceptance VM');
console.log('AI_LOAN_MARKET_ACCEPTANCE '+JSON.stringify(result));
