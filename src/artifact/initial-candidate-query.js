// Shared observed-only initial FA query; original callers retain page25.
const INITIAL_CANDIDATE_PAGE_SIZE=25;
const INITIAL_CANDIDATE_SORTS={ability:'종합 기량 추정',name:'선수 이름',role:'포지션',region:'출신 지역',age:'나이',potential:'잠재력 추정',reputation:'명성',salary:'요구 연봉',...Object.fromEntries(Object.entries(INITIAL_COMPARE_METRICS).map(([k,v])=>[k,v+' 추정']))};
function initialCandidateRoles(s){return (s.roles?.length?s.roles:s.role&&s.role!=='ALL'?[s.role]:[]).filter(r=>ROLES.includes(r))}
function initialMetricConditions(s){
 const rows=[];let valid=true;
 for(const [key,bounds] of Object.entries(s.metricFilters||{})){
  if(!Object.hasOwn(INITIAL_COMPARE_METRICS,key)||!bounds||typeof bounds!=='object'){valid=false;continue}
  const min=bounds.min===''||bounds.min==null?null:Number(bounds.min),max=bounds.max===''||bounds.max==null?null:Number(bounds.max);
  if([min,max].some(x=>x!==null&&(!Number.isInteger(x)||x<1||x>99))||min!==null&&max!==null&&min>max){valid=false;continue}
  if(min!==null||max!==null)rows.push({key,min,max});
 }
 return {valid,rows};
}
function initialCandidateMetrics(view,row){return row.metrics||(row.metrics=observedPlayerCoreMetrics(view,row.p))}
function initialCandidateMetricMatch(view,row,conditions){return conditions.valid&&conditions.rows.every(({key,min,max})=>{const value=initialCandidateMetrics(view,row)[key];return Number.isFinite(value)&&(min===null||value>=min)&&(max===null||value<=max)})}
function initialCandidateOrders(state){const rows=[{key:INITIAL_CANDIDATE_SORTS[state.sort]?state.sort:'ability',direction:state.direction},...(state.secondary||[])],seen=new Set();return rows.filter(r=>INITIAL_CANDIDATE_SORTS[r.key]&&!seen.has(r.key)&&seen.add(r.key)).slice(0,3).map(r=>({key:r.key,direction:r.direction==='asc'?'asc':'desc'}))}
function initialCandidateSortValue(view,x,key,target){const p=x.p;if(Object.hasOwn(INITIAL_COMPARE_METRICS,key))return initialCandidateMetrics(view,x)[key];if(key==='ability')return x.ability;if(key==='name')return p.name;if(key==='role')return ROLES.indexOf(p.role);if(key==='region')return view.regions[p.region]?.name||p.region;if(key==='potential')return avg(scoutPotentialRange(view,p));if(key==='salary')return asking(view,p,target.region);return p[key]??NaN}
function initialCandidateDirection(key,direction){const asc=direction==='asc';return key==='name'||key==='region'?(asc?'가나다순':'가나다 역순'):key==='role'?(asc?'탑→정글→미드→원딜→서포터':'서포터→원딜→미드→정글→탑'):key==='age'?(asc?'어린 순':'나이 많은 순'):key==='salary'?(asc?'저렴한 순':'비싼 순'):(asc?'낮은 순':'높은 순')}
function initialCandidatePage(db,state,target,{pageSize=INITIAL_CANDIDATE_PAGE_SIZE,interestsOnly=false}={}){
  const allowed=initialCandidateAllowed(db,target);
  if(!allowed)return {allowed:false,rows:[],total:0,pages:0,page:0,view:null};
  const view=initialCandidateView(db),query=String(state.q||'').trim().toLocaleLowerCase('ko'),minimum=clamp(Number(state.minimum)||0,0,99),key=INITIAL_CANDIDATE_SORTS[state.sort]?state.sort:'ability',direction=state.direction==='asc'?1:-1;
  const roles=initialCandidateRoles(state),conditions=initialMetricConditions(state);
  const rows=Object.values(db.players).filter(p=>!p.retired&&!p.team&&(!interestsOnly||!!db.world.recruitment?.targets?.[p.id])&&(!roles.length||roles.includes(p.role))&&(state.scope==='all'||(state.scope==='overseas'?p.region!==target.region:p.region===target.region))&&(!query||p.name.toLocaleLowerCase('ko').includes(query))).map(p=>({p,ability:obsOvr(view,p)})).filter(x=>(minimum===0||Number.isFinite(x.ability)&&x.ability>=minimum)&&initialCandidateMetricMatch(view,x,conditions));
  const orders=initialCandidateOrders(state),valued=rows.map(x=>({...x,value:initialCandidateSortValue(view,x,key,target)}));
  const values=new WeakMap(valued.map(x=>[x,new Map([[key,x.value]])])),sortValue=(x,k)=>{const cache=values.get(x);if(!cache.has(k))cache.set(k,initialCandidateSortValue(view,x,k,target));return cache.get(k)};
  valued.sort((a,b)=>{for(const order of orders){const av=sortValue(a,order.key),bv=sortValue(b,order.key),missing=x=>typeof x!=='string'&&!Number.isFinite(x);if(missing(av)||missing(bv)){const cmp=Number(missing(av))-Number(missing(bv));if(cmp)return cmp;continue}const cmp=typeof av==='string'?av.localeCompare(bv,'ko'):av-bv;if(cmp)return (order.direction==='asc'?1:-1)*cmp}return a.p.id.localeCompare(b.p.id)});
  const size=Number.isInteger(pageSize)&&pageSize>0?pageSize:INITIAL_CANDIDATE_PAGE_SIZE;
  const pages=Math.ceil(valued.length/size),page=Math.max(0,Math.min(Math.floor(Number(state.page)||0),Math.max(0,pages-1)));
  return {allowed:true,rows:valued.slice(page*size,(page+1)*size),total:valued.length,pages,page,view};
}
