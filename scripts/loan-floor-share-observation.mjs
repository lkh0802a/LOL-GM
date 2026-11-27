// Synthetic loan wage attribution; no real contracts, policy or user saves.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),[owner,borrower]=activeTeams(db),year=db.year;
 for(const t of [owner,borrower]){for(const role of ROLES){const q=genPlayer(db,new RNG('share|'+t.id+role),{region:t.region,role,age:22,base:60});signContract(db,q,t,2,2)}t.finance.cash=100;initializeDepthChart(db,t,true)}
 const p=genPlayer(db,new RNG('share-player'),{region:owner.region,role:ROLES[0],age:22,base:45});p.personality.ambition=10;p.careerGoal='stability';signContract(db,p,owner,20,2,{promisedRole:'backup'});p.rosterRole='backup';
 db.world={phase:'season',year,manage:'manual',seasons:{}};setManagedTeam(db,borrower.id);setWorldCalendarDate(db,year+'-01-10');db.regions.NA.spendingRule='sfr_top5';
 const original=packDB(db),copy=unpackDB(original),cmd={type:'player.loan',actor:'manager',pid:p.id,fromId:owner.id,teamId:borrower.id,duration:'half',salaryShare:.5,fee:0,promisedRole:'starter',recall:false};
 const view=x=>[owner.id,borrower.id].map(id=>{const t=x.teams[id],a=financeSeasonPayroll(x,t,x.world),e=financeOperatingExpense(x,t,x.world);return {id,basis:a,annualExpense:e.salary+(e.loanWages||0)+(e.loanConversion||0),loanWages:t.finance.loanWages||null}});
 const initial=view(copy),previewBefore=packDB(copy),preview=previewWorldAction(copy,cmd),previewUnchanged=packDB(copy)===previewBefore,result=commitWorldAction(copy,cmd);
 setWorldCalendarDate(copy,year+'-02-10');processLoanDaily(copy);const accrued=view(copy),saved=packDB(copy),restored=unpackDB(saved);
 const repeatedBefore=packDB(restored);processLoanDaily(restored);const repeated=view(restored);
 const closeout=unpackDB(saved);closeout.regions.NA.salaryCap=10;closeout.regions.NA.salaryFloor=10;closeout.regions.NA.sfrTeamShare=1;
 const highFloor=unpackDB(packDB(closeout));highFloor.regions.NA.salaryFloor=10.5;
 closeFinances(closeout,closeout.world,new RNG('loan-share-closeout','finance'),()=>{});
 closeFinances(highFloor,highFloor.world,new RNG('loan-share-closeout','finance'),()=>{});
 const ledger=x=>[owner.id,borrower.id].map(id=>{const f=x.teams[id].finance,h=f.history.at(-1);return {id,year:h?.year,salary:h?.exp?.salary,loanWages:h?.exp?.loanWages,tax:h?.exp?.tax,taxRevenue:h?.rev?.tax??0,loanOutstanding:f.loanWages||null}});
 const closeoutResult=ledger(closeout),highFloorResult=ledger(highFloor),closedBytes=packDB(closeout),closedRestore=unpackDB(closedBytes);
 closeFinances(closeout,closeout.world,new RNG('loan-share-closeout','finance'),()=>{});
 const totalControl=unpackDB(saved);totalControl.regions.NA.spendingRule=null;const fullBasisControl=view(totalControl);
 console.log('LOAN_FLOOR_SHARE_OBSERVATION '+JSON.stringify({synthetic:true,preview:preview.ok,previewUnchanged,committed:result.ok,initial,accrued,repeated,fullBasisControl,closeoutResult,highFloorResult,closeoutRestoreMatches:JSON.stringify(closeoutResult)===JSON.stringify(ledger(closedRestore)),closeoutRepeatUnchanged:packDB(closeout)===closedBytes,
  restoreMatches:JSON.stringify(accrued)===JSON.stringify(view(unpackDB(saved))),sameDayUnchanged:packDB(restored)===repeatedBefore,originalUnchanged:packDB(db)===original}));
})();`);
