// Synthetic known transfer invoice vs legacy annual prize; no real contract or save.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('PRIZE_ESTATE_INVOICE_OBSERVATION '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,slots:4,div2:false,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),clubs=activeTeams(db,'NA',1),id='SYNTHETIC_ANNUAL_PRIZE';
 for(const t of clubs)for(const role of ROLES){const p=genPlayer(db,new RNG('annual-prize|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 db.competitions[id]={id,name:'Synthetic annual prize',short:id,region:'NA',teams:clubs.map(t=>t.id),rules:{fearless:true},stages:[{id:'regular',name:'Regular',type:'round_robin',legs:1,bestOf:1}]};
 const s=newSeason(db,id,db.year,'annual-prize',db.worldDate,id);s.key=id;s.region='NA';s.div=1;s.split=3;
 db.world={year:db.year,seed:'annual-prize',manage:'ai',phase:'season',seasons:{[id]:s},steps:[{kind:'league',split:3}],step:0,offers:[],marketLog:[]};
 let days=0;while(!s.done&&days++<100){setWorldCalendarDate(db,s.days[s.cur].date);playDay(db,s)}
 check(s.done&&s.days.every(d=>d.matches.every(m=>m.res)),'incomplete synthetic competition');
 const matches=s.days.reduce((n,d)=>n+d.matches.length,0),old=clubs.find(t=>t.id!==s.champion&&t.id!==s.runnerUp).id;
 const payer=clubs.find(t=>t.id!==old),player=Object.values(db.players).find(p=>!p.team&&!p.retired);
 check(payer&&player,'missing synthetic invoice entities');payer.finance.cash=100;
 const due=(db.year+1)+'-01-07';
 // Controlled synthetic installment in the existing transfer ledger; this does not simulate a player transfer.
 settleTransferSigningFee(db,player,db.teams[old],payer,2,{upfront:0,installments:[{date:due,amount:2}],addOns:[]});
 const dealId=Object.keys(db.teams[old].finance.transferDeals)[0];
 const before=packDB(db),baseline=unpackDB(before),changed=unpackDB(before);
 baseline.world.phase='offseason';changed.world.phase='offseason';
 const recorded=JSON.stringify(changed.world.seasons[id].formatSnapshot.teams),planBefore=financeCloseoutPrizes(changed,changed.world)[old]??null;
 foldTeam(changed,changed.teams[old]);check(changed.teams[old].active===false,'controlled closure failed');
 const basePlan=financeCloseoutPrizes(baseline,baseline.world)[old]??null,changedPlan=financeCloseoutPrizes(changed,changed.world)[old]??null;
 const a=runOffseason(baseline),b=runOffseason(changed);
 check(a.year===s.year&&b.year===s.year&&baseline.world.phase==='market'&&changed.world.phase==='market','annual close did not finish');
 const baseRows=baseline.teams[old].finance.history.filter(x=>x.year===s.year),changedRows=changed.teams[old].finance.history.filter(x=>x.year===s.year);
 const beforeInvoice=changed.teams[old].finance.transferDeals[dealId]?.rows?.[0];
 check(beforeInvoice?.status==='pending','synthetic invoice did not remain pending through close');
 const balancesBefore={seller:changed.teams[old].finance.cash,buyer:changed.teams[payer.id].finance.cash};
 setWorldCalendarDate(changed,due);processTransferPayments(changed);
 const balancesAfter={seller:changed.teams[old].finance.cash,buyer:changed.teams[payer.id].finance.cash};
 const sellerInvoice=changed.teams[old].finance.transferDeals[dealId].rows[0],buyerInvoice=changed.teams[payer.id].finance.transferDeals[dealId].rows[0];
 const recovery=changed.teams[old].finance.estateRecovery||null;
 check(sellerInvoice.status==='paid'&&buyerInvoice.status==='paid'&&sellerInvoice.paid===2&&buyerInvoice.paid===2,'mirrored synthetic invoice not paid');
 const reopened=unpackDB(packDB(changed));check(JSON.stringify(reopened.world.seasons[id].formatSnapshot.teams)===recorded,'restore changed snapshot');
 const restoredBefore=packDB(reopened);processTransferPayments(reopened);check(packDB(reopened)===restoredBefore,'duplicate synthetic invoice processing changed state');
 check(packDB(db)===before,'source synthetic world changed');
 console.log('PRIZE_ESTATE_INVOICE_OBSERVATION '+JSON.stringify({synthetic:true,controlledClosure:true,actualMatches:matches,
  format:'four-team-single-round-bo1',worlds:false,old,planBefore,basePlan,changedPlan,
  baselineAnnualPrize:baseRows.at(-1)?.rev?.prize??null,closedAnnualPrize:changedRows.at(-1)?.rev?.prize??null,
  closedActive:changed.teams[old].active,baselinePhase:baseline.world.phase,closedPhase:changed.world.phase,
  snapshotPreserved:true,syntheticRestore:true,syntheticInvoice:{due,amount:2,sellerStatus:sellerInvoice.status,buyerStatus:buyerInvoice.status,balancesBefore,balancesAfter,recoveryPaid:recovery?.paidAmount??0},duplicateInvoiceUnchanged:true,originalUnchanged:true,confirmedPrizeDebt:false,actualUserSave:false}));
})()`,{timeout:120000});
