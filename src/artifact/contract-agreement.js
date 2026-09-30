// ===== LOL GM: D04-B3 future contract agreement activation lifecycle =====
// Loaded after contract-window.js. Keeps future-agreement settlement and
// exceptional void handling separate from contact-window eligibility.
function contractAgreementActionKind(row){
  return row.kind==='renewal'?'renewal_agreement':'precontract';
}
function voidContractAgreement(db,row,reason,p=null){
  row.status='void';row.voidReason=reason;row.voidDate=db.worldDate;
  if(p&&!p.retired)recordPlayerEvent(p,'contract_agreement_void',
    contractWindowYear(db),{from:row.fromTeamId,to:row.teamId,kind:row.kind,
      reason,date:db.worldDate,effectiveDate:row.effectiveDate});
  return row;
}
function applyDueContractAgreements(db,rep=null){
  const store=contractAgreementStore(db),applied=[],voided=[];
  for(const row of Object.values(store)){
    if(row.status!=='agreed'||row.effectiveDate>db.worldDate)continue;
    const p=db.players[row.pid],t=db.teams[row.teamId];
    if(!p||p.retired){
      voided.push(voidContractAgreement(db,row,'player_retired_or_missing',p||null));
      continue;
    }
    if(!t||t.active===false){
      voided.push(voidContractAgreement(db,row,'target_team_inactive',p));
      continue;
    }
    // An early release/fold may leave the player unattached before Jan 1.
    // The binding agreement still stands. A move to a different active club
    // creates a new live contract relationship and voids this future deal.
    if(p.team&&p.team!==row.fromTeamId&&p.team!==row.teamId){
      voided.push(voidContractAgreement(db,row,'source_contract_changed',p));
      continue;
    }
    if(p.contract&&p.contract.until>=db.year){
      voided.push(voidContractAgreement(db,row,'source_contract_extended',p));
      continue;
    }
    const result=commitWorldAction(db,{type:'player.sign',pid:p.id,teamId:t.id,
      fromId:row.fromTeamId,kind:contractAgreementActionKind(row),actor:'system',
      salary:row.salary,years:row.years,terms:row.terms});
    if(!result.ok)throw new Error('Binding contract agreement failed: '+
      row.pid+' '+(result.errors||[]).join(' · '));
    row.status='effective';row.appliedDate=db.worldDate;applied.push(row);
    if(rep){
      if(row.kind==='renewal')rep.resign.push({pid:p.id,team:t.id,
        salary:row.salary,years:row.years,terms:row.terms,agreement:true});
      else rep.signings.push({pid:p.id,team:t.id,salary:row.salary,
        years:row.years,precontract:true,from:row.fromTeamId});
    }
  }
  if(rep&&voided.length)rep.contractVoids=[...(rep.contractVoids||[]),
    ...voided.map(row=>({pid:row.pid,team:row.teamId,kind:row.kind,
      reason:row.voidReason,date:row.voidDate}))];
  return {applied,voided};
}
function settleOffseasonContractRollover(db,rep){
  const w=db.world,cw=w?.contractWindow;
  if(!cw)return {applied:[],released:[],options:[]};
  if(cw.stage==='exclusive')advanceOffseasonContractWindow(db);
  const precontracts=aiRunOutsidePreContracts(db);
  cw.completed=true;
  const restoreDate=db.worldDate,effective=cw.effectiveDate;
  db.worldDate=effective;
  const activation=applyDueContractAgreements(db,rep),
    applied=activation.applied,voided=activation.voided,released=[],options=[],
    mine=w.manage==='manual'?managedTeamId(db):null;
  for(const t of activeTeams(db))for(const id of (t.roster||[]).slice()){
    const p=db.players[id];if(!p?.contract||p.contract.medicalReplacement||
      p.contract.until>=db.year)continue;
    const o=p.contract.option;
    if(o&&o.year===db.year&&shouldAutoExerciseOption(db,p,t,mine)){
      const r=commitWorldAction(db,{type:'player.option',pid:p.id,teamId:t.id,
        actor:o.type==='player'?'system':'ai'});
      if(r.ok){options.push(p.id);continue}
    }
    if(o&&o.year===db.year&&t.id===mine&&o.type==='team')continue;
    const from=t.id,r=commitWorldAction(db,{type:'player.release',pid:p.id,
      teamId:from,mode:'expired',actor:'system'});
    if(!r.ok)throw new Error('Expired contract release failed: '+p.id);
    released.push(p.id);
    if(rep)rep.expired.push({pid:p.id,team:from,why:'계약 종료 — FA 전환'});
  }
  db.worldDate=restoreDate;
  return {applied,voided,released,options,precontracts};
}
