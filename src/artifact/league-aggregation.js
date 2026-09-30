// ===== LOL GM: League annual standings and split result aggregation =====
// Separate from competition fixture generation, playoff execution and season progression.

function rrTable(db,s,stageId,teams){
  const tb={};teams.forEach(t=>tb[t]={tid:t,w:0,l:0,gw:0,gl:0,h2h:{},form:[]});
  const comp=db.competitions[s.comp],region=comp&&!comp.international&&db.regions[comp.region];
  // Each split remains a separate fixture/playoff tournament. Only the
  // regular-season table carries older results when the region explicitly
  // chooses cumulative records; other regions, years and divisions cannot mix.
  const previous=(s.standingsMode||region?.standingsMode)==='cumulative'&&s.split?
    Object.values(db.world?.seasons||{}).filter(x=>x!==s&&x.done&&
      x.comp===s.comp&&x.year===s.year&&x.split&&x.split<s.split)
      .sort((a,b)=>a.split-b.split):[];
  for(const season of [...previous,s])for(const d of season.days)
    if(d.stage===stageId)for(const m of d.matches){
      if(!m.res||!tb[m.a]&&!tb[m.b])continue;
      const [sa,sb]=m.res.score,wa=m.res.winner===m.a;
      if(tb[m.a]){
        tb[m.a].gw+=sa;tb[m.a].gl+=sb;tb[m.a][wa?'w':'l']++;
        tb[m.a].form.push(wa?'W':'L');
        if(tb[m.b])tb[m.a].h2h[m.b]=(tb[m.a].h2h[m.b]||0)+(wa?1:-1);
      }
      if(tb[m.b]){
        tb[m.b].gw+=sb;tb[m.b].gl+=sa;tb[m.b][wa?'l':'w']++;
        tb[m.b].form.push(wa?'L':'W');
        if(tb[m.a])tb[m.b].h2h[m.a]=(tb[m.b].h2h[m.a]||0)+(wa?-1:1);
      }
    }
  return Object.values(tb).sort((x,y)=>(y.w-x.w)||((y.gw-y.gl)-(x.gw-x.gl))||((y.h2h[x.tid]||0)-(x.h2h[y.tid]||0))||(hashStr(s.seed+x.tid)-hashStr(s.seed+y.tid)));
}
// Annual championship points are earned at the end of each independently
// completed split. Unfinished playoffs award no speculative points.
const CHAMPIONSHIP_FINISH_POINTS=[0,20,45,70,100];
function championshipStandings(db,R,div=1){
  const teams=activeTeams(db,R.id,div).map(t=>t.id),world=db.world;
  const seasons=Object.values(world?.seasons||{}).filter(s=>s.done&&s.year===world.year&&
    s.region===R.id&&(s.div||1)===div&&s.split).sort((a,b)=>a.split-b.split);
  const totals=Object.fromEntries(teams.map(t=>[t,{tid:t,points:0,bySplit:{}}]));
  for(const s of seasons)for(const id of teams){
    const award=CHAMPIONSHIP_FINISH_POINTS[elimReach(db,s,id)]||0;
    totals[id].points+=award;totals[id].bySplit[s.split]=award;
  }
  const latest=seasons.at(-1),order=latest?placements(db,latest):
    teams.slice().sort((a,b)=>teamStrength(db,b)-teamStrength(db,a));
  const tie=new Map(order.map((id,i)=>[id,i]));
  return Object.values(totals).sort((a,b)=>b.points-a.points||
    (tie.get(a.tid)??999)-(tie.get(b.tid)??999)||a.tid.localeCompare(b.tid));
}
function recentSplitChampion(db,R){
  return [3,2,1].map(sp=>db.world?.seasons[R.short+'-'+sp])
    .find(s=>s?.done)?.champion||null;
}
function regionPlacements(db,R,div=1){
  const w=db.world,act=activeTeams(db,R.id,div).map(t=>t.id);
  const done=[3,2,1].map(sp=>w?.seasons[R.short+(div===2?'2':'')+'-'+sp])
    .find(s=>s?.done);
  const mode=done?.standingsMode||R.standingsMode||'independent';
  let base=done?(mode==='points'?championshipStandings(db,R,div).map(x=>x.tid):
    mode==='cumulative'?standings(db,done,'regular').map(x=>x.tid):
    placements(db,done)):(div===1?R.lastPlacement||[]:[]);
  base=base.filter(t=>act.includes(t));
  const rest=act.filter(t=>!base.includes(t)).sort((a,b)=>teamStrength(db,b)-teamStrength(db,a));
  return [...base,...rest];
}
