// ===== LOL GM: Scouting domain =====
// Owns observation knowledge, uncertainty, reports, report ageing and manual scouting actions.

function sameScoutZone(a,b){if(a===b)return true;return Object.values(INTL_ZONES).some(z=>z.includes(a)&&z.includes(b))}
function scoutingPowerForTeam(t){if(!t)return 1;return clamp(.78+facilityScoutingBonus(t)+staffProfile(t).scouting/250,.8,1.46)}
function scoutingPower(db){return scoutingPowerForTeam(managedTeam(db))}
// Fictional, bounded regional experience; absent legacy records mean unknown,
// not an invented nationality, home-region expertise or historical service.
function scoutRegionalKnowledge(s,region){return s.scoutRegions?.[region]?.knowledge||0}
function scoutRegionalCapacity(s){const known=Object.values(s.scoutRegions||{}).map(r=>r.knowledge);return Math.min(3,1+Math.floor((clamp(staffRoleAbility(s,'scout'),0,99)+Math.min(30,known.length?avg(known)*.3:0))/45))}
function scoutRegionalMembers(db,t,region,ids=null){
  const owner=aiScoutingOwner(db,t),allowed=ids?new Set(ids):null;
  return staffByRole(owner,'scout').filter(s=>!s.retired&&(!s.contract||s.contract.until>=db.year)&&(!allowed||allowed.has(s.id)))
    .sort((a,b)=>(scoutRegionalKnowledge(b,region)-scoutRegionalKnowledge(a,region))||staffRoleAbility(b,'scout')-staffRoleAbility(a,'scout')||a.id.localeCompare(b.id));
}
function scoutingRegionalPower(db,t,p,opt={}){
  const owner=aiScoutingOwner(db,t),region=aiScoutingTargetRegion(db,p),members=scoutRegionalMembers(db,owner,region,opt.scoutIds);
  const expertise=Math.min(1,members.reduce((v,s,i)=>v+scoutRegionalKnowledge(s,region)*([1,.28,.16][i]||.1),0)/100);
  return {owner,region,members,power:clamp(scoutingPowerForTeam(owner)*(1+expertise*.15),.8,1.65)};
}
function recordScoutRegionalObservation(db,view,gain){
  if(!db.regions[view.region]||gain<=0)return;
  // Select the actual responsible investigator, not every employee in the club.
  const s=view.members[0];if(!s)return;
  s.scoutRegions=s.scoutRegions||{};
  const row=s.scoutRegions[view.region]||{knowledge:0,observations:0};
  row.knowledge=clamp(row.knowledge+Math.min(2,gain/20)*(1-row.knowledge/100),0,100);
  row.observations++;row.lastYear=db.year;row.lastDate=db.worldDate||null;s.scoutRegions[view.region]=row;
}
function regionalScoutingAssignments(db,t,regions){
  const assigned=new Map();
  return regions.map(region=>{
    const members=scoutRegionalMembers(db,t,region).filter(s=>(assigned.get(s.id)||0)<scoutRegionalCapacity(s)).sort((a,b)=>{
      const fit=s=>scoutRegionalKnowledge(s,region)-Math.max(0,...regions.filter(r=>r!==region).map(r=>scoutRegionalKnowledge(s,r)))*.5-(assigned.get(s.id)||0)*10;
      return fit(b)-fit(a)||staffRoleAbility(b,'scout')-staffRoleAbility(a,'scout')||a.id.localeCompare(b.id);
    });
    // Staff are allocated to the best-fit region first; each person's capacity
    // is bounded by their own expertise rather than a round-robin ID counter.
    const chosen=members.slice(0,1);for(const s of chosen)assigned.set(s.id,(assigned.get(s.id)||0)+1);
    return {region,scoutIds:chosen.map(s=>s.id)};
  }).filter(a=>a.scoutIds.length||a.region===t.region);
}
function scoutingOperationAtomically(db,t,work){
  const owner=aiScoutingOwner(db,t),human=t.id===managedTeamId(db),rows=[],nodes=[],seen=new Set();
  const capture=ref=>{if(!ref||typeof ref!=='object'||seen.has(ref))return;seen.add(ref);const entries=Object.entries(ref);nodes.push({ref,record:Object.fromEntries(entries),length:Array.isArray(ref)?ref.length:null});for(const [,child] of entries)capture(child)};
  for(const [object,key] of [[t,'finance'],[owner,'finance'],[owner,'scoutingState'],...(human?[[db,'scout'],[db.world||{},'recruitment']]:[]),...staffByRole(owner,'scout').map(s=>[s,'scoutRegions'])]){rows.push({object,key,present:Object.hasOwn(object,key),ref:object[key]});capture(object[key])}
  try{return work()}catch(error){
    for(const node of nodes){actionJournalRestoreObject(node.ref,node.record);if(node.length!==null)node.ref.length=node.length}
    for(const r of rows){if(!r.present)delete r.object[r.key];else r.object[r.key]=r.ref}
    throw error;
  }
}
function aiScoutingBatchCharge(unitCost,count){return Math.round(unitCost*Math.max(0,count)*10)/10}
function aiScoutingAffordableTargets(available,unitCost,capacity){for(let n=capacity;n>0;n--)if(aiScoutingBatchCharge(unitCost,n)<=available+.001)return n;return 0}
function baseScoutKnowledge(db,p){const me=managedTeam(db);if(!me)return 0;if(!db.world?.fired&&(p.team===me.id||(p.team&&db.teams[p.team]&&db.teams[p.team].parent===me.id)))return 100;if(p.region===me.region)return 35;return sameScoutZone(p.region,me.region)?30:25}
function ensureScoutReport(db,p){db.scout=db.scout||{};let r=db.scout[p.id];if(typeof r==='number')r=db.scout[p.id]={knowledge:r,lastSeenYear:db.year-1,lastSeenDate:null,observations:0,gamesSeen:0,competitions:{},snapshots:[]};if(!r)r=db.scout[p.id]={knowledge:baseScoutKnowledge(db,p),lastSeenYear:null,lastSeenDate:null,observations:0,gamesSeen:0,competitions:{},snapshots:[]};r.competitions=r.competitions||{};r.snapshots=r.snapshots||[];return r}
function knowledge(db,p){if(!db.world)return 100;const base=baseScoutKnowledge(db,p);if(base>=100)return 100;const r=ensureScoutReport(db,p);return Math.round(clamp(Math.max(base,r.knowledge||0),0,98))}
function scoutSample(db,p){let g=0,k=0,d=0,a=0,min=0,dmg=0,rating=0,csd=0,gd=0;const comps=new Set(),seasons=db.world?Object.values(db.world.seasons):[];for(const s of seasons){const st=s.pstats&&s.pstats[p.id];if(!st||!st.g)continue;g+=st.g;k+=st.k;d+=st.d;a+=st.a;min+=st.min||0;dmg+=st.dmg||0;rating+=st.ratingSum||0;csd+=st.csDiff||0;gd+=st.goldDiff||0;comps.add(s.comp)}if(!g&&p.career&&p.career.length){for(const st of p.career.slice(-3)){g+=st.g||0;k+=st.k||0;d+=st.d||0;a+=st.a||0;min+=st.min||0;dmg+=st.dmg||0;rating+=(st.rating||0)*(st.g||0);csd+=st.csDiff||0;gd+=st.goldDiff||0;if(st.comp)comps.add(st.comp)}}return {g,k,d,a,min,dmg,rating:g?rating/g:null,kda:(k+a)/Math.max(1,d),dpm:min?dmg/min:0,csDiff:g?csd/g:0,goldDiff:g?gd/g:0,competitions:[...comps]}}
function scoutingRisk(db,p){const me=managedTeam(db),k=knowledge(db,p),sample=scoutSample(db,p),tm=p.team&&db.teams[p.team];return (p.age<=20?2.5:0)+(me&&p.region!==me.region?2:0)+(tm&&(tm.division||1)===2?2:0)+(sample.g<8?3:sample.g<20?1.5:0)+(100-k)/20}
function obsAttr(db,p,a,k=knowledge(db,p)){if(k>=99)return p.attrs[a];const risk=scoutingRisk(db,p),n=((hashStr(p.id+a)%2001)/1000-1)*((1-k/100)*11+risk*.3);return Math.round(clamp(p.attrs[a]+n,20,99))}
function obsOvr(db,p,raw=false){const k=raw?Math.min(98,Math.max(knowledge(db,p),30)):knowledge(db,p);if(k>=99)return playerOvr(p);const role=p.role,gw=ROLE_GROUP_WEIGHTS[role]||ROLE_GROUP_WEIGHTS.MID,gs=g=>{const keys=ATTR_GROUPS[g].filter(a=>!(a==='smite_execution'&&role!=='JGL')&&!(a==='csing'&&role==='SUP'));return avg(keys.map(a=>obsAttr(db,p,a,k)))};let base=0,w=0;for(const [g,x] of Object.entries(gw)){base+=gs(g)*x;w+=x}base/=w||1;const keys=ROLE_KEY_ATTRS[role]||[],key=keys.length?avg(keys.map(a=>obsAttr(db,p,a,k))):base;return Math.round(clamp(base*.82+key*.18,20,99))}
function observePlayer(db,p,gain,opt={}){if(!p||p.retired||baseScoutKnowledge(db,p)>=100)return;const r=ensureScoutReport(db,p),view=scoutingRegionalPower(db,managedTeam(db),p,opt),power=view.power,diminish=.55+.45*(1-(r.knowledge||0)/100);r.knowledge=clamp((r.knowledge||0)+gain*power*diminish,0,98);r.observations=(r.observations||0)+1;r.gamesSeen=(r.gamesSeen||0)+(opt.games||0);if(opt.comp)r.competitions[opt.comp]=(r.competitions[opt.comp]||0)+(opt.games||1);r.lastSeenDate=db.worldDate;r.lastSeenYear=db.year;r.snapshots.push({year:db.year,date:db.worldDate,estimate:obsOvr(db,p,true),games:scoutSample(db,p).g});r.snapshots=r.snapshots.slice(-8);recordChampionScoutObservation(db,managedTeam(db),p,r,opt);recordScoutRegionalObservation(db,view,gain)}

function ageScoutReports(db){
  for(const [id,r0] of Object.entries(db.scout||{})){
    const p=db.players[id];if(!p||p.retired){delete db.scout[id];continue}
    const r=typeof r0==='number'?ensureScoutReport(db,p):r0,
      base=baseScoutKnowledge(db,p),young=p.age<=20?1.12:1,me=managedTeam(db),
      decay=8*young+(me&&p.region===me.region?0:3);
    r.knowledge=Math.max(base,Math.round((r.knowledge||base)-decay));
    r.staleYears=Math.max(0,db.year-(r.lastSeenYear??db.year));
  }
  ageAiScoutReports(db);
}
function scoutFromDay(db,s,day){
  const me=managedTeamId(db),comp=db.competitions[s.comp],games=m=>m.res?m.res.games.length:1;
  if(me){
    const myR=db.teams[me].region,visible=comp.international||s.region===myR;
    if(visible)for(const m of day.matches){
      const involved=m.a===me||m.b===me,
        gain=involved?9:comp.international?4.5:(s.div===2?2.5:3.2);
      for(const tid of [m.a,m.b])for(const role of ROLES){
        const p=starterFor(db,db.teams[tid],role);
        if(p)observePlayer(db,p,gain,{comp:s.comp,games:games(m)});
      }
    }
  }
  scoutAiFromDay(db,s,day);
}
function scoutAbilityRange(db,p){const k=knowledge(db,p),c=obsOvr(db,p),w=Math.max(1,Math.ceil((100-k)/10+scoutingRisk(db,p)*.35));return [Math.max(20,c-w),Math.min(99,c+w)]}
function scoutPotentialRange(db,p){const k=knowledge(db,p),risk=scoutingRisk(db,p),noise=((hashStr(p.id+'pot')%2001)/1000-1)*Math.max(1,(100-k)/13),center=clamp(p.pot+noise,playerOvr(p),99),w=Math.max(3,Math.ceil((100-k)/8+risk*.45));return [Math.max(playerOvr(p),Math.round(center-w)),Math.min(99,Math.round(center+w))]}
function scoutGrowthTrend(p){const a=(p.developmentTrail||[]).slice(-3);if(a.length<2)return {delta:null,label:'표본 부족'};const d=a[a.length-1].ovr-a[0].ovr;return {delta:d,label:d>=3?'빠른 상승':d>=1?'상승':d<=-2?'하락':d<0?'소폭 하락':'정체'}}
// Internal preparation belongs to the current controlled squad, including an
// incoming loan. Parent ownership alone does not reveal an outgoing loan's work.
function playerChampionInternalAccess(db,p){return !db.world?.fired&&managerControlsSquad(db,p.team&&db.teams[p.team])}
// Reuse the established observation signal; no separate trait noise or scouting
// policy is introduced by rendering derived metrics.
function observedPlayerAttributes(db,p,k=knowledge(db,p)){
  return Object.fromEntries([...new Set(Object.values(ATTR_GROUPS).flat())].map(a=>[a,obsAttr(db,p,a,k)]));
}
function observedPlayerCoreMetrics(db,p,k=knowledge(db,p)){
  if(playerChampionInternalAccess(db,p))return playerCoreMetrics(p);
  const metrics=playerCoreMetrics({role:p.role,attrs:observedPlayerAttributes(db,p,k),tend:{}});
  delete metrics.aggression;return metrics;
}
function observedPlayerMarketValue(db,p,k=knowledge(db,p)){
  if(playerChampionInternalAccess(db,p))return playerMarketValue(db,p);
  const potential=scoutPotentialRange(db,p),view=Object.create(p);
  Object.defineProperties(view,{attrs:{value:observedPlayerAttributes(db,p,k)},pot:{value:avg(potential)},form:{value:0}});
  return playerMarketValue(db,view);
}
function publicPlayerChampions(db,p){
  const groups=new Map();let unknown=0;
  for(const row of metaRowsFiltered(db,{player:p.id})){
    if(!observedMetaDate(db,row)){unknown++;continue}
    const picks=(row.sides||[]).flatMap(side=>(side.picks||[]).filter(x=>x&&typeof x==='object'&&x.player===p.id).map(pick=>({side,pick})));
    if(picks.length!==1){unknown++;continue}
    const {side,pick}=picks[0];if(typeof pick.champ!=='string'||!pick.champ){unknown++;continue}
    let g=groups.get(pick.champ);if(!g){g={id:pick.champ,g:0,w:0,results:0,from:row.date,to:row.date};groups.set(g.id,g)}
    g.g++;if(typeof side.win==='boolean'){g.results++;if(side.win)g.w++}
    if(row.date<g.from)g.from=row.date;if(row.date>g.to)g.to=row.date;
  }
  return {champions:[...groups.values()].sort((a,b)=>b.g-a.g||b.to.localeCompare(a.to)||a.id.localeCompare(b.id)),unknown};
}
function scoutReport(db,p){
  const r=ensureScoutReport(db,p),sample=scoutSample(db,p),ability=scoutAbilityRange(db,p),potential=scoutPotentialRange(db,p),growth=scoutGrowthTrend(p),internal=playerChampionInternalAccess(db,p),publicPool=internal?null:publicPlayerChampions(db,p),champions=internal?Object.entries(p.pool||{}).sort((a,b)=>b[1].mastery-a[1].mastery).slice(0,5).map(([id,v])=>({id,mastery:Math.round(v.mastery)})):publicPool.champions.slice(0,5).map(x=>({...x,observation:championScoutObservation(db,managedTeam(db),p,x.id)}));
  return {knowledge:knowledge(db,p),ability,potential,sample,growth,champions,championSource:internal?'internal':'public',championUnknown:publicPool?.unknown||0,lastSeenDate:r.lastSeenDate,staleYears:r.staleYears||0,observations:r.observations||0,gamesSeen:r.gamesSeen||0};
}
function scoutPlayers(db,ids,amt,cost){
  const t=myT(db);
  if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length||ids.some(id=>!db.players[id]||db.players[id].retired||baseScoutKnowledge(db,db.players[id])>=100)||!Number.isFinite(amt)||amt<=0||!Number.isFinite(cost)||cost<0)return '유효한 외부 선수와 관찰 비용을 선택하세요';
  if(t.finance.cash<cost)return '보유 자금이 부족합니다';
  try{return scoutingOperationAtomically(db,t,()=>{payFinancePrepaid(t,'scoutingExpense',cost);for(const id of ids){observePlayer(db,db.players[id],Math.min(24,amt*.55),{games:0,comp:'manual'});syncRecruitmentObservation(db,id)}return `스카우팅 보고서 갱신 (${money(cost)})`})}catch(error){return '스카우팅 처리 실패 · '+error.message}
}
