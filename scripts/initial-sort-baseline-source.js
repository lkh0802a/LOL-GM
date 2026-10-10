function initialCandidatePage(db,state,target){
  const allowed=initialCandidateAllowed(db,target);
  if(!allowed)return {allowed:false,rows:[],total:0,pages:0,page:0,view:null};
  const view=initialCandidateView(db),query=String(state.q||'').trim().toLocaleLowerCase('ko'),minimum=clamp(Number(state.minimum)||0,0,99),key=INITIAL_CANDIDATE_SORTS[state.sort]?state.sort:'ability',direction=state.direction==='asc'?1:-1;
  const roles=initialCandidateRoles(state),conditions=initialMetricConditions(state);
  const rows=Object.values(db.players).filter(p=>!p.retired&&!p.team&&(!roles.length||roles.includes(p.role))&&(state.scope==='all'||(state.scope==='overseas'?p.region!==target.region:p.region===target.region))&&(!query||p.name.toLocaleLowerCase('ko').includes(query))).map(p=>({p,ability:obsOvr(view,p)})).filter(x=>(minimum===0||Number.isFinite(x.ability)&&x.ability>=minimum)&&initialCandidateMetricMatch(view,x,conditions));
  const orders=initialCandidateOrders(state),valued=rows.map(x=>({...x,value:initialCandidateSortValue(view,x,key,target)}));
  valued.sort((a,b)=>{for(const order of orders){const av=initialCandidateSortValue(view,a,order.key,target),bv=initialCandidateSortValue(view,b,order.key,target),missing=x=>typeof x!=='string'&&!Number.isFinite(x);if(missing(av)||missing(bv)){const cmp=Number(missing(av))-Number(missing(bv));if(cmp)return cmp;continue}const cmp=typeof av==='string'?av.localeCompare(bv,'ko'):av-bv;if(cmp)return (order.direction==='asc'?1:-1)*cmp}return a.p.id.localeCompare(b.p.id)});
  const pages=Math.ceil(valued.length/INITIAL_CANDIDATE_PAGE_SIZE),page=Math.max(0,Math.min(Math.floor(Number(state.page)||0),Math.max(0,pages-1)));
  return {allowed:true,rows:valued.slice(page*INITIAL_CANDIDATE_PAGE_SIZE,(page+1)*INITIAL_CANDIDATE_PAGE_SIZE),total:valued.length,pages,page,view};
}
