// Joint office policy is a game rule, not a reconstruction of real residency law.
// Existing service runs keep their own copied terms; only new runs read this rule.
function localPolicyTerms(rule){
  return !!rule&&['seasons','days','choiceYears','effectiveYear'].every(k=>Number.isInteger(rule[k]))&&
    rule.seasons>=1&&rule.days>=0&&rule.choiceYears>=1;
}
function localPolicyAgreement(db,R,year){
  if((R.metrics||[]).length<2)return null;
  const previous=(R.localServiceAgreements||[]).at(-1);
  if(previous&&year-previous.reviewYear<4)return null;
  const teams=activeTeams(db,R.id,1);if(!teams.length)return null;
  const candidates=Object.values(db.players).filter(p=>!p.retired&&!p.team&&isLocalPlayer(p,R.id)&&
    playerOvr(p)>=R.strength-10).length,depth=candidates/teams.length,
    current=localServicePolicy(db,R.id),baseline=4,
    requested=depth<1?baseline-1:depth>1.8?baseline+1:baseline;
  if(requested===current.seasons)return null;
  // Use the same public international-strength boundary as slot reallocation.
  // A competitive region cannot shortcut scarce local recruitment to gain an
  // additional domestic advantage; the international office counters at baseline.
  const power=db.global?.power?.[R.id]??R.strength/20,
    agreed=requested<baseline&&power>=1.2?baseline:requested;
  return {reviewYear:year,announcedDate:db.worldDate||null,effectiveYear:year+1,
    regionalProposal:{seasons:requested,reason:depth<1?'로컬 자유계약 인재 부족':depth>1.8?'로컬 육성 기회 보호':'기준 근속 기간 복귀'},
    internationalResponse:{seasons:agreed,result:agreed===requested?'accepted':'counter',
      reason:agreed===requested?'지역 인재 여건과 공동 자격 기준 합의':'국제 경쟁력 우위 지역의 자격 단축 제한'},
    evidence:{localCandidates:candidates,firstDivisionClubs:teams.length,depth,internationalPower:power},
    previous:{...current},rule:{...current,seasons:agreed,effectiveYear:year+1}};
}
function reviewLocalServiceAgreements(db,w,f,ev){
  if(f<=0)return;
  for(const R of Object.values(db.regions)){
    const agreement=localPolicyAgreement(db,R,w.year);if(!agreement)continue;
    // Keep the current rule available until the announced season actually starts.
    R.localServiceRule={...agreement.previous};
    R.localServicePending={...agreement.rule};
    R.localServiceAgreements=[...(R.localServiceAgreements||[]),agreement];
    db.global=db.global||{decisions:[],power:{}};
    db.global.localServiceAgreements=[...(db.global.localServiceAgreements||[]),{region:R.id,agreement}];
    ev(`${R.leagueName} 로컬 취득 협의: 지역 ${agreement.regionalProposal.seasons}시즌 제안 → 공동 ${agreement.rule.seasons}시즌, ${agreement.effectiveYear}시즌 신규 근속부터 적용`);
  }
}
function validateStoredLocalPolicies(db){
  const valid=a=>!(
      !a||!Number.isInteger(a.reviewYear)||!localPolicyTerms(a.rule)||!localPolicyTerms(a.previous)||
      a.effectiveYear!==a.rule.effectiveYear||a.effectiveYear!==a.reviewYear+1||
      !a.regionalProposal||!a.internationalResponse||!Number.isInteger(a.regionalProposal.seasons)||
      a.regionalProposal.seasons<1||!['accepted','counter'].includes(a.internationalResponse.result)||
      a.internationalResponse.seasons!==a.rule.seasons);
  for(const R of Object.values(db.regions)){
    if(R.localServicePending&&!localPolicyTerms(R.localServicePending))throw Error('예정 로컬 취득 규정이 손상되었습니다');
    if(R.localServiceAgreements&&(!Array.isArray(R.localServiceAgreements)||R.localServiceAgreements.some(a=>!valid(a))))
      throw Error('로컬 취득 공동 합의 기록이 손상되었습니다');
  }
  const global=db.global?.localServiceAgreements;
  if(global&&(!Array.isArray(global)||global.some(row=>typeof row?.region!=='string'||!valid(row.agreement))))
    throw Error('국제 로컬 취득 합의 기록이 손상되었습니다');
}
