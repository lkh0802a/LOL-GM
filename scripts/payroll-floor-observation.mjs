// Synthetic salary floor/tax-distribution observation; no actual league policy or user save.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),teams=activeTeams(db,'NA',1);db.world={year:db.year,phase:'season',manage:'manual',seasons:{}};
 const R=db.regions.NA;R.spendingRule='sfr_top5';R.salaryCap=50;R.salaryFloor=55;R.sfrTeamShare=1;
 for(let i=0;i<teams.length;i++){
  for(let j=0;j<6;j++){
   const p=genPlayer(db,new RNG('floor-probe|'+i+'|'+j),{region:'NA',role:ROLES[j%ROLES.length],age:22,base:60});
   signContract(db,p,teams[i],i===0?10:i===1?12:1,3);
  }
 }
 const input=packDB(db),high=unpackDB(input),control=unpackDB(input);control.regions.NA.salaryFloor=50;
 const beforeHigh=packDB(high),beforeControl=packDB(control);
 const basis=x=>teams.map(t=>({id:t.id,...financeSeasonPayroll(x,x.teams[t.id],x.world),full:ownedContractPayroll(x,x.teams[t.id],x.world.year)}));
 const highBasis=basis(high),controlBasis=basis(control);
 closeFinances(high,high.world,new RNG('floor-probe-close','finance'),()=>{});
 closeFinances(control,control.world,new RNG('floor-probe-close','finance'),()=>{});
 const snapshot=x=>teams.map(t=>{const a=x.teams[t.id].finance.history.at(-1);return {id:t.id,taxPaid:a.exp.tax,taxRevenue:a.rev.tax??0}});
 const highResult=snapshot(high),controlResult=snapshot(control),restored=unpackDB(packDB(high));
 console.log('PAYROLL_FLOOR_OBSERVATION '+JSON.stringify({synthetic:true,ruleAndAmountsAreTestInputs:true,
  highBasis,controlBasis,highResult,controlResult,restoreMatches:JSON.stringify(highResult)===JSON.stringify(snapshot(restored)),
  originalUnchanged:packDB(db)===input,highInputChanged:packDB(high)!==beforeHigh,controlInputChanged:packDB(control)!==beforeControl}));
})();`);
