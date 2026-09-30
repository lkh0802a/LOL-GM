// ===== LOL GM: D04 contract-market career continuity =====
// Players account for the career cost of remaining unsigned, while established
// market offer floors still prevent desperation from accepting clear undervaluation.

function unsignedSeasonCareerRisk(db,p,kind='fa'){
  // A year without professional matches already compounds faYears/retirement.
  // Apply the opportunity cost only at genuine offseason contract decisions.
  const w=db.world;
  if(!w||!['offseason','market'].includes(w.phase)||p.retired||
    !['fa','early_fa','renewal'].includes(kind))return 0;
  if(kind==='renewal'&&(!w.contractWindow||!contractExpiresThisSeason(db,p)||p.wantsOut))
    return 0;
  if(kind==='early_fa'&&!w.contractWindow)return 0;
  // Reuse existing negotiation magnitudes instead of inventing a separate
  // "desperation" scale: one duration-utility step is .055 and .22 is the
  // existing meaningful under-offer/patience boundary.
  const step=.055,base=kind==='renewal'?step:step*2,
    unsigned=Math.min(2,p.faYears||0)*step,
    prime=p.age>=24&&p.age<=29?step:0;
  return Math.min(.22,base+unsigned+prime);
}
function offerAcceptanceThreshold(db,p,opt={}){
  const rep=(p.reputation||playerOvr(p)),amb=p.personality.ambition/100,
    base=1.04+rep/520+amb*.12+(p.age<=20?.04:0);
  return base-unsignedSeasonCareerRisk(db,p,opt.kind||(p.team?'renewal':'fa'));
}
function contractOfferReasonable(db,p,t,offer,kind='fa'){
  // The opportunity cost of unemployment does not override genuine
  // undervaluation: low guaranteed pay + bench/minor role is still rejectable.
  const ask=Math.max(.1,asking(db,p,t.region)),
    guaranteed=offer.salary+(offer.signingBonus||0)/Math.max(1,offer.years||1),
    // Existing AI market offers start at .95 of ask before the same medical
    // risk discount. Treat anything below that established floor as genuine
    // undervaluation; role/club quality remains inside offerUtility.
    establishedFloor=.95*(1-medicalContractRisk(db,p)*.4);
  return guaranteed>=ask*establishedFloor;
}
