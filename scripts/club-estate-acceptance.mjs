import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(v,m)=>{if(!v)throw Error('CLUB_ESTATE '+m)},near=(a,b)=>Math.abs(a-b)<1e-8;
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),[estate,buyer,creditor]=activeTeams(db),year=db.year;
  db.world={phase:'season',year,manage:'manual',seasons:{}};setWorldCalendarDate(db,year+'-01-10');
  for(const t of [estate,buyer,creditor])for(const s of t.staffRoster||[])s.contract.until=year-1;
  const p=Object.values(db.players).find(p=>!p.team&&!p.retired);
  estate.finance.cash=0;buyer.finance.cash=10;creditor.finance.cash=0;
  estate.finance.buyout=4;estate.finance.releaseObligations=[
    {pid:p.id,amount:2,mode:'club_closure'},
    {staffId:'previous-staff',amount:1,mode:'club_closure'}];
  settleTransferSigningFee(db,p,estate,buyer,3,{upfront:0,
    installments:[{date:year+'-01-11',amount:1.5},{date:year+'-02-11',amount:1.5}],addOns:[]});
  writeTransferDeal(db,{id:'estate-debt',pid:p.id,fromId:creditor.id,teamId:estate.id,
    date:db.worldDate,fee:.7,upfront:0,rows:[
      {kind:'installment',date:year+'-02-01',amount:.7,paid:0,status:'pending'},
      {kind:'appearances',threshold:200,baseline:0,through:year+'-12-31',amount:.5,paid:0,status:'pending'}]});
  check(commitWorldAction(db,{type:'club.close',actor:'system',teamId:estate.id}).ok,'real closure failed');
  const closure=JSON.stringify(estate.finance.closureSettlement);
  setWorldCalendarDate(db,year+'-01-11');processTransferPayments(db);
  check(near(estate.finance.cash,.7)&&near(estate.finance.buyout,3.2),'receivable was stranded or guaranteed invoice spent');
  const first=estate.finance.estateRecovery.history[0];
  check(near(first.items[0].paidAmount,.4)&&near(first.items[1].paidAmount,.2)&&near(first.unattributedPaid,.2),
    'player, staff and legacy claims were not proportional');
  check(first.reservedAmount===.7&&transferPaymentExposure(estate).contingent===.5,'unearned bonus invented a claim');
  const repeat=JSON.stringify(db);processTransferPayments(db);check(JSON.stringify(db)===repeat,'repeated tick paid twice');
  const command={type:'finance.estate-recovery',actor:'system',teamId:estate.id};
  check(!previewWorldAction(db,{...command,actor:'manager'}).ok,'manager distributed estate');
  check(!previewWorldAction(db,{...command,teamId:buyer.id}).ok,'active club treated as closed');
  setWorldCalendarDate(db,year+'-02-01');processTransferPayments(db);
  check(near(estate.finance.cash,0)&&near(creditor.finance.cash,.7)&&near(estate.finance.buyout,3.2),
    'scheduled outgoing invoice failed or charged releases again');
  setWorldCalendarDate(db,year+'-02-11');processTransferPayments(db);
  check(near(estate.finance.buyout,1.7)&&near(buyer.finance.cash,7),'second recovered installment failed');
  const restored=unpackDB(packDB(db)),t=restored.teams[estate.id];
  check(near(t.finance.estateRecovery.paidAmount,2.3)&&JSON.stringify(t.finance.closureSettlement)===closure,
    'save lost payouts or overwrote initial closure');
  t.finance.cash=.13;
  const before=JSON.stringify(restored),plan=previewWorldAction(restored,command),financeRef=t.finance;
  check(plan.ok&&JSON.stringify(restored)===before,'recovery preview mutated estate');
  const writer=settleClubEstateRecovery;
  settleClubEstateRecovery=(...args)=>{writer(...args);throw Error('late recovery failure')};
  check(!applyWorldAction(restored,plan).ok&&JSON.stringify(restored)===before&&t.finance===financeRef,
    'late failure did not restore original finance journal');
  settleClubEstateRecovery=writer;t.finance.cash+=.01;
  check(!applyWorldAction(restored,plan).ok&&near(t.finance.buyout,1.7),'stale recovery accepted');
  check(commitWorldAction(restored,command).ok&&near(t.finance.buyout,1.56)&&near(t.finance.cash,0),
    'fractional real cash lost during distribution');
  t.finance.cash=1.56;processTransferPayments(restored);
  check(near(t.finance.buyout,0)&&near(t.finance.estateRecovery.paidAmount,4)&&!t.finance.releaseObligations.length,
    'final payment lost claims or invented excess payout');
  // Closed cash can be fractional after proportional distributions. Preserve
  // it when collecting/sending decimal invoices rather than creating rounding cash.
  t.finance.cash=.037;receiveFinancePrepaidTransfer(t,.1);payFinancePrepaid(t,'transferPaid',.1);
  check(near(t.finance.cash,.037),'estate invoice rounding created or destroyed cash');
  const done=JSON.stringify(restored);processTransferPayments(restored);
  check(JSON.stringify(restored)===done,'fully paid estate repeated payout');
  check(JSON.stringify(t.finance.closureSettlement)===closure,'original closure history changed');
  check(near(unpackDB(packDB(restored)).teams[estate.id].finance.cash,.037),'fractional cash failed save restoration');
  console.log('CLUB_ESTATE_ACCEPTANCE actual closure / mirrored recoveries / reserved invoices / proportional staff-player-legacy / save / rollback / stale / no double payment');
})()`);
