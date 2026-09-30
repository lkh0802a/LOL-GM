// ===== LOL GM: D04-B3 contract expiry / next-contract activation =====
// The current playing contract remains in force through the 14-day incumbent
// window. Renewal and explicitly permitted early-contact agreements are
// binding for next season, and activate only after the old contract expires.

function withContractStartSeason(db,season,fn){
  const before=db.year;db.year=season;
  try{return fn()}finally{db.year=before}
}
function voidContractAgreement(row,reason,date){
  row.status='void';row.voidReason=reason;row.voidDate=date;return row;
}
function applyDueRenewalAgreements(db){
  const store=contractAgreementStore(db),applied=[];
  for(const row of Object.values(store)){
    if(row.kind!=='renewal'||row.status!=='agreed'||row.effectiveDate>db.worldDate)continue;
    const p=db.players[row.pid],t=db.teams[row.teamId];
    if(!p||p.retired||!t||t.active===false||p.team!==row.fromTeamId){
      voidContractAgreement(row,'party_unavailable',db.worldDate);continue;
    }
    const result=withContractStartSeason(db,row.startSeason,()=>commitWorldAction(db,{
      type:'player.sign',pid:p.id,teamId:t.id,kind:'renewal_agreement',actor:'system',
      salary:row.salary,years:row.years,terms:row.terms
    }));
    if(!result.ok)throw new Error('Binding renewal activation failed: '+
      row.pid+' '+(result.errors||[]).join(' · '));
    row.status='effective';row.appliedDate=db.worldDate;applied.push(row);
  }
  return applied;
}
function expireContractPlayer(db,p,t,cw){
  const result=withContractStartSeason(db,cw.startSeason,()=>commitWorldAction(db,{
    type:'player.release',pid:p.id,teamId:t.id,mode:'expired',actor:'system'
  }));
  if(!result.ok)throw new Error('Expired contract release failed: '+
    p.id+' '+(result.errors||[]).join(' · '));
  return {pid:p.id,team:t.id};
}
function autoResolveExpiryOption(db,p,t,cw,mine){
  const o=p.contract?.option;
  if(!o||o.year!==cw.startSeason)return false;
  return withContractStartSeason(db,cw.startSeason,()=>{
    if(!shouldAutoExerciseOption(db,p,t,mine))return false;
    const r=commitWorldAction(db,{type:'player.option',pid:p.id,teamId:t.id,
      actor:o.type==='player'?'system':'ai'});
    return !!r.ok;
  });
}
function applyDueEarlyContactAgreements(db){
  const store=contractAgreementStore(db),applied=[];
  for(const row of Object.values(store)){
    if(row.kind!=='early_fa'||row.status!=='agreed'||row.effectiveDate>db.worldDate)continue;
    const p=db.players[row.pid],t=db.teams[row.teamId];
    if(!p||p.retired||!t||t.active===false){
      voidContractAgreement(row,'party_unavailable',db.worldDate);continue;
    }
    if(p.team){
      voidContractAgreement(row,'source_contract_not_expired',db.worldDate);continue;
    }
    const result=withContractStartSeason(db,row.startSeason,()=>commitWorldAction(db,{
      type:'player.sign',pid:p.id,teamId:t.id,kind:'early_fa_agreement',
      actor:'system',salary:row.salary,years:row.years,terms:row.terms
    }));
    if(!result.ok)throw new Error('Binding early-contact activation failed: '+
      row.pid+' '+(result.errors||[]).join(' · '));
    row.status='effective';row.appliedDate=db.worldDate;applied.push(row);
  }
  return applied;
}
function finalizeExclusiveContractExpiry(db){
  const w=db.world,cw=w?.contractWindow;
  if(!cw)return {applied:[],released:[],options:[]};
  const renewals=applyDueRenewalAgreements(db),released=[],options=[],
    mine=w.manage==='manual'?managedTeamId(db):null;
  for(const t of activeTeams(db))for(const id of (t.roster||[]).slice()){
    const p=db.players[id];
    if(!p?.contract||p.contract.medicalReplacement||
      p.contract.until!==cw.seasonYear)continue;
    if(autoResolveExpiryOption(db,p,t,cw,mine)){options.push(p.id);continue}
    released.push(expireContractPlayer(db,p,t,cw));
  }
  const early=applyDueEarlyContactAgreements(db),applied=[...renewals,...early];
  return {applied,renewals,early,released,options,
    expiryDate:cw.contractExpiryDate,faOpenDate:cw.outsideContactDate,reported:false};
}
function settleOffseasonContractRollover(db,rep){
  const w=db.world,cw=w?.contractWindow;
  if(!cw)return {applied:[],released:[],options:[]};
  if(cw.stage==='exclusive')closeExclusiveContractWindow(db);
  const settlement=cw.settlement||{applied:[],renewals:[],early:[],released:[],options:[]};
  if(rep&&!settlement.reported){
    for(const row of settlement.renewals||[])rep.resign.push({
      pid:row.pid,team:row.teamId,salary:row.salary,years:row.years,
      terms:row.terms,agreement:true
    });
    for(const row of settlement.early||[])rep.signings.push({
      pid:row.pid,team:row.teamId,salary:row.salary,years:row.years,
      terms:row.terms,earlyContact:true,from:row.fromTeamId
    });
    for(const row of settlement.released)rep.expired.push({
      pid:row.pid,team:row.team,why:'월즈 종료 2주 후 계약 만료 — FA 전환'
    });
    settlement.reported=true;
  }
  return settlement;
}
