// ===== LOL GM: AI active scouting operations =====
// Pre-market target allocation, regional/league coverage and finance-backed
// observation spending. Manager scouting remains in scouting.js.

function aiScoutingTargetRegion(db,p){
  return p?.team&&db.teams[p.team]?.region||p?.region||null;
}
function aiScoutingUnitCost(db,t){
  // Same per-player cash cost used by manager manual initial-market scouting:
  // 0.1 * regional pay scale.
  return Math.round(.1*psOf(db,t.region)*1000)/1000;
}
function aiScoutingVisitGain(){
  // Manager scoutPlayers with effort 40 converts to 22 observation gain.
  // Reuse that existing unit rather than introducing a second tuning.
  return 22;
}
function aiScoutingPublicFit(db,t,p){
  const view=aiPublicMarketObservation(db,p,t),
    roleCount=(t.roster||[]).reduce((n,id)=>n+(db.players[id]?.role===p.role?1:0),0),
    need=roleCount===0?7:roleCount===1?3:0,
    youth=t.philosophy==='youth'&&p.age<=21?4:0,
    star=t.philosophy==='superstar'&&p.reputation>=78?4:0,
    winNow=t.philosophy==='win-now'?Math.max(0,view.ability-68)*.15:0,
    info=Math.min(4,view.uncertainty*.35),
    local=isLocalPlayer(p,t.region,t.id)?1.5:0;
  return view.ability+Math.max(0,view.potential-view.ability)*
    (t.philosophy==='youth'?.45:.18)+need+youth+star+winNow+info+local;
}
function aiScoutingEligibleTarget(db,t,p){
  if(!p||p.retired||aiBaseScoutKnowledge(db,t,p)>=100)return false;
  // Scout players who are already free or whose contract is due to expire in
  // the coming market. Research remains tied to actionable recruitment.
  return !p.team||!p.contract||p.contract.until<db.year;
}
function aiScoutingLeagueKeys(db,region){
  const live=Object.values(db.competitions||{}).filter(c=>!c.international&&c.region===region)
    .map(c=>c.id).sort();
  if(live.length)return live;
  const R=db.regions[region];
  // Offseason scouting runs before next-season competition instances exist.
  // Keep a stable tier assignment instead of dropping league ownership.
  return R?.div2?[region+':DIV1',region+':DIV2']:[region+':DIV1'];
}
function aiScoutingCoveragePlan(db,t,candidates,capacity){
  const scouts=staffByRole(t,'scout').slice().sort((a,b)=>(b.rating||0)-(a.rating||0)),
    f=ensureFacilities(t),
    slots=Math.min(Object.keys(db.regions).length,Math.max(1,Math.ceil(capacity/3))),
    grouped={};
  for(const p of candidates){
    const region=aiScoutingTargetRegion(db,p);if(!region||!db.regions[region])continue;
    (grouped[region]=grouped[region]||[]).push(p);
  }
  const regionScore=region=>{
    const rows=(grouped[region]||[]).map(p=>aiScoutingPublicFit(db,t,p))
      .sort((a,b)=>b-a).slice(0,3);
    return rows.length?rows.reduce((a,b)=>a+b,0)/rows.length:-Infinity;
  };
  const regions=[t.region,...Object.keys(db.regions)
    .filter(r=>r!==t.region)
    .sort((a,b)=>regionScore(b)-regionScore(a)||a.localeCompare(b))]
    .filter((r,i,x)=>x.indexOf(r)===i).slice(0,slots);
  return regions.map((region,i)=>({
    region,
    leagues:aiScoutingLeagueKeys(db,region),
    scoutIds:scouts.length?scouts.filter((_,j)=>j%regions.length===i).map(s=>s.id):[],
    scoutingFacility:f.scouting,
    publicPool:(grouped[region]||[]).length
  }));
}
function aiScoutingBatchCharge(unitCost,count){
  return Math.round(unitCost*Math.max(0,count)*10)/10;
}
function aiScoutingAffordableTargets(available,unitCost,capacity){
  for(let n=capacity;n>0;n--)if(aiScoutingBatchCharge(unitCost,n)<=available+.001)return n;
  return 0;
}
function aiRunScoutingOperation(db,t){
  const owner=aiScoutingOwner(db,t);if(!owner||owner.parent||
    owner.id===managedTeamId(db)||!owner.finance)return null;
  const state=ensureAiScoutingState(db,owner),f=ensureFacilities(owner),
    scouts=staffByRole(owner,'scout'),
    capacity=Math.max(1,Math.min(10,scouts.length+f.scouting)),
    unitCost=aiScoutingUnitCost(db,owner),
    runway=financeRunway(db,owner),
    reserve=runway.monthly*3,
    available=Math.max(0,owner.finance.cash-reserve),
    targetLimit=unitCost>0?aiScoutingAffordableTargets(available,unitCost,capacity):0,
    candidates=Object.values(db.players).filter(p=>aiScoutingEligibleTarget(db,owner,p)),
    assignments=aiScoutingCoveragePlan(db,owner,candidates,capacity),
    covered=new Set(assignments.map(x=>x.region)),
    ranked=candidates.filter(p=>covered.has(aiScoutingTargetRegion(db,p)))
      .map(p=>({p,score:aiScoutingResearchPriority(db,owner,p)}))
      .sort((a,b)=>b.score-a.score||a.p.id.localeCompare(b.p.id)),
    targets=[],cashBefore=owner.finance.cash;
  const reassessments=[];
  for(const row of ranked){
    if(targets.length>=targetLimit)break;
    const p=row.p,before=aiScoutReport(db,owner,p),beforeK=before.knowledge||0,
      staleBefore=before.staleYears||0,
      marketBefore=staleBefore>0?aiMarketOfferRankSnapshot(db,owner,p):null;
    const report=observeAiPlayer(db,owner,p,aiScoutingVisitGain(),{
      comp:'SCOUT:'+aiScoutingTargetRegion(db,p),games:0});
    if(!report)continue;
    const marketAfter=staleBefore>0?aiMarketOfferRankSnapshot(db,owner,p):null;
    targets.push({pid:p.id,region:aiScoutingTargetRegion(db,p),role:p.role,
      publicScore:Math.round(row.score*10)/10,beforeKnowledge:Math.round(beforeK),
      afterKnowledge:Math.round(report.knowledge||0),sourceBefore:before.source,
      sourceAfter:report.source||'scouted',staleYearsBefore:staleBefore});
    if(staleBefore>0&&marketBefore&&marketAfter)reassessments.push({
      pid:p.id,role:p.role,staleYearsBefore:staleBefore,
      before:marketBefore,after:marketAfter,
      leaderChanged:marketBefore.leader!==marketAfter.leader,
      rankChanged:marketBefore.rank!==marketAfter.rank,
      valueDelta:marketAfter.value==null||marketBefore.value==null?null:
        Math.round((marketAfter.value-marketBefore.value)*10)/10
    });
  }
  const charge=aiScoutingBatchCharge(unitCost,targets.length);
  if(charge)payFinancePrepaid(owner,'scoutingExpense',charge);
  const spent=Math.round((cashBefore-owner.finance.cash)*10)/10,
    operation={year:db.year,date:db.worldDate,capacity,targetLimit,unitCost,
      reserve:Math.round(reserve*1000)/1000,runway:runway.severity,
      assignments,targets,spent,cashBefore:Math.round(cashBefore*1000)/1000,
      cashAfter:Math.round(owner.finance.cash*1000)/1000,
      reason:targetLimit<=0?'liquidity':targets.length?'completed':'no-covered-targets',
      reassessments};
  state.operations=[...(state.operations||[]),operation].slice(-6);
  state.reassessments=[...(state.reassessments||[]),...reassessments].slice(-12);
  state.lastOperation=operation;return operation;
}
function aiRunActiveScouting(db){
  const mine=managedTeamId(db),rows=[];
  for(const t of activeTeams(db,null,1)){
    if(t.parent||t.id===mine)continue;
    const op=aiRunScoutingOperation(db,t);if(op)rows.push({team:t.id,...op});
  }
  return rows;
}
