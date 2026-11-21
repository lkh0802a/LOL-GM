// Synthetic transfer command observation; no user save or actual contract.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),[seller,buyer]=activeTeams(db),p=Object.values(db.players).find(p=>!p.team&&!p.retired);
 setManagedTeam(db,buyer.id);db.world={phase:'market',year:db.year,manage:'manual',seasons:{}};
 seller.finance.cash=100;buyer.finance.cash=100;
 p.personality.ambition=10;p.careerGoal='stability';
 signContract(db,p,seller,10,2,{promisedRole:'backup',buyout:{type:'release',amount:2}});
 const original=packDB(db),clone=unpackDB(original),command={type:'player.transfer',actor:'manager',pid:p.id,fromId:seller.id,teamId:buyer.id,fee:2,feePlan:{upfront:0,installments:[{date:addDays(db.worldDate,30),amount:2}],addOns:[]}};
 const preview=previewWorldAction(clone,command);const result=commitWorldAction(clone,command);
 const deals=Object.values(clone.teams[buyer.id].finance.transferDeals||{}),loaded=unpackDB(packDB(clone));
 const restoredDeals=Object.values(loaded.teams[buyer.id].finance.transferDeals||{});
 const settlement=unpackDB(packDB(clone)),due=command.feePlan.installments[0].date;
 const dealId=deals[0]?.id;
 const view=x=>({date:x.worldDate,buyerCash:x.teams[buyer.id].finance.cash,sellerCash:x.teams[seller.id].finance.cash,
   row:x.teams[buyer.id].finance.transferDeals[dealId].rows[0],
   mirrorEqual:JSON.stringify(x.teams[buyer.id].finance.transferDeals[dealId])===JSON.stringify(x.teams[seller.id].finance.transferDeals[dealId])});
 processTransferPayments(settlement);const beforeDue=view(settlement);
 settlement.worldDate=due;settlement.teams[buyer.id].finance.cash=.5;
 processTransferPayments(settlement);const partial=view(settlement),partialSaved=packDB(settlement),restoredPartial=unpackDB(partialSaved);
 processTransferPayments(restoredPartial);const repeated=view(restoredPartial);
 restoredPartial.teams[buyer.id].finance.cash=2;processTransferPayments(restoredPartial);const paid=view(restoredPartial),paidSaved=packDB(restoredPartial);
 processTransferPayments(restoredPartial);const repeatPaidUnchanged=packDB(restoredPartial)===paidSaved;
 const restoredFinal=unpackDB(paidSaved);
 const mismatched=unpackDB(partialSaved);mismatched.teams[seller.id].finance.transferDeals[dealId].rows[0].paid=0;
 const mismatchBefore=packDB(mismatched),mismatchCommand={type:'finance.transfer-payment',actor:'system',pid:p.id,fromId:seller.id,teamId:buyer.id,dealId};
 const mismatchPreview=previewWorldAction(mismatched,mismatchCommand),mismatchCommit=commitWorldAction(mismatched,mismatchCommand);
 let mismatchRestoreError=null;try{unpackDB(mismatchBefore)}catch(error){mismatchRestoreError=error.message}
 const mismatch={previewOk:mismatchPreview.ok,commitOk:mismatchCommit.ok,reason:mismatchCommit.reason||null,
   restoreError:mismatchRestoreError,unchanged:packDB(mismatched)===mismatchBefore,partialOriginalUnchanged:packDB(settlement)===partialSaved};

 // Closed invoices are compacted per team; test absence separately for active and paid rows.
 const mirrorAbsence=[['earned',partialSaved],['paid',paidSaved]].map(([status,saved])=>{
   const probe=unpackDB(saved);delete probe.teams[seller.id].finance.transferDeals[dealId];
   const input=packDB(probe);let restored=null,error=null;
   try{restored=unpackDB(input)}catch(e){error=e.message}
   return {status,error,restored:!!restored,inputUnchanged:packDB(probe)===input,
     buyerRecordPresent:restored?!!restored.teams[buyer.id].finance.transferDeals?.[dealId]:null,
     sellerRecordPresent:restored?!!restored.teams[seller.id].finance.transferDeals?.[dealId]:null};
 });
 // Isolate retention behavior using fabricated closed journal entries; no payments are executed.
 const retention=unpackDB(paidSaved),third=activeTeams(retention).find(t=>t.id!==buyer.id&&t.id!==seller.id),template=retention.teams[seller.id].finance.transferDeals[dealId];
 for(let i=0;i<10;i++)writeTransferDeal(retention,{...JSON.parse(JSON.stringify(template)),id:seller.id+'/retention-probe-'+i,teamId:third.id});
 const retentionSaved=packDB(retention);let retentionRestored=null,retentionError=null;
 try{retentionRestored=unpackDB(retentionSaved)}catch(e){retentionError=e.message}
 const retentionProbe={syntheticJournalEntries:10,noPaymentsExecuted:true,error:retentionError,
   sellerOldPresent:!!retention.teams[seller.id].finance.transferDeals[dealId],buyerOldPresent:!!retention.teams[buyer.id].finance.transferDeals[dealId],
   restored:!!retentionRestored,sourceUnchanged:packDB(restoredFinal)===paidSaved};
 const upfront=unpackDB(original),control=commitWorldAction(upfront,{...command,feePlan:{upfront:2,installments:[],addOns:[]}});
 console.log('BUYOUT_PLAN_OBSERVATION '+JSON.stringify({date:db.worldDate,preview:preview.ok,result:result.ok,reason:result.reason||null,errors:result.errors||[],buyerCash:clone.teams[buyer.id].finance.cash,sellerCash:clone.teams[seller.id].finance.cash,team:clone.players[p.id].team,deals,restoredStatus:restoredDeals[0]?.rows[0]?.status,upfrontControl:{accepted:control.ok,buyerCash:upfront.teams[buyer.id].finance.cash,sellerCash:upfront.teams[seller.id].finance.cash},retentionProbe,mirrorAbsence,mismatch,settlement:{beforeDue,partial,partialRestore:view(unpackDB(partialSaved)),repeated,paid,repeatPaidUnchanged,finalRestore:view(restoredFinal)},originalUnchanged:packDB(db)===original}));
})();`);
