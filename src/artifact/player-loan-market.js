// Review once per regional window, never on a background timer. AI uses its
// existing observations and the same club/player consent gateway as the manager.
function aiReviewLoanMarket(db){
  const w=db.world;if(w?.phase!=='season')return 0;
  const date=db.worldDate,md=date.slice(5),regions=Object.values(db.regions)
    .filter(R=>(R.loanWindows||[{from:'01-07',through:'01-31'},{from:'07-01',through:'07-14'}])
      .some(period=>md>=period.from&&md<=period.through));
  let deals=0;
  for(const R of regions){
    const period=(R.loanWindows||[{from:'01-07',through:'01-31'},{from:'07-01',through:'07-14'}])
      .find(period=>md>=period.from&&md<=period.through),key=R.id+'/'+w.year+'/'+period.from;
    if(w.loanMarketReviews?.[key])continue;
    w.loanMarketReviews=w.loanMarketReviews||{};w.loanMarketReviews[key]=date;
    const borrowers=activeTeams(db,R.id,1).filter(t=>!playerActionAuthority(db,'ai',t));
    for(const to of borrowers){
      if(deals>=2)break;
      const role=ROLES.slice().sort((a,b)=>{
        const pa=starterFor(db,to,a),pb=starterFor(db,to,b);
        return (pa?aiMarketValue(db,pa,to):0)-(pb?aiMarketValue(db,pb,to):0);
      })[0],current=starterFor(db,to,role),room=Math.max(0,salaryBudget(db,to)-payroll(db,to));
      const candidates=Object.values(db.players).filter(p=>p.team&&!p.loan&&!p.retired&&p.role===role&&
        p.contract&&!p.contract.medicalReplacement&&p.contract.salary<=room&&
        p.team!==to.id&&!playerActionAuthority(db,'ai',db.teams[p.team])&&
        db.teams[p.team]?.active!==false&&db.teams[p.team]?.roster.length>5&&
        !contractedMoveError(db,p)&&!localRegistrationError(db,to,p))
        .map(p=>({p,value:aiMarketValue(db,p,to)}))
        .filter(x=>!current||x.value>aiMarketValue(db,current,to)+3)
        .sort((a,b)=>b.value-a.value||a.p.id.localeCompare(b.p.id)).slice(0,8);
      for(const {p} of candidates){
        const result=commitWorldAction(db,{type:'player.loan',actor:'ai',pid:p.id,
          fromId:p.team,teamId:to.id,duration:md<'07-01'?'half':'season',
          salaryShare:1,fee:0,promisedRole:'starter',recall:false});
        if(result.ok){deals++;break}
      }
    }
  }
  return deals;
}
