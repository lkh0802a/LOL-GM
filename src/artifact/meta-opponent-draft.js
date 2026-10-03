// Recorded target-club choices, independent of a champion-anchor meta panel.
// Current roster membership labels history; it never rewrites past lineups.
function opponentDraftPreparation(db,{observer=managedTeamId(db),target=null,filter={},champ=null}={}){
  const out={...opponentReportContext(db,{observer,target}),coverage:{sample:0,undated:0,knownOrder:0,unknownOrder:0,globalOpening:0,completeComposition:0,partialComposition:0,unknownChampion:0,knownColor:0,unknownColor:0,allCurrent:0,changedLineup:0,unknownLineup:0,unknownPatch:0,unknownRegion:0,unknownResult:0,knownBans:0,unknownBans:0},firstPicks:[],followups:[],pairs:[],bans:[],patches:[],patterns:[]};
  if(!out.allowed||out.warnings.length)return out;
  const rival=db.teams[out.target],roster=new Set(rival.roster||[]),scoped={...filter,team:rival.id};delete scoped.opponent;
  const c=out.coverage,bags={firstPicks:new Map(),followups:new Map(),pairs:new Map(),bans:new Map()},patches=new Map();
  const add=(kind,fields,row,side,context)=>{const key=JSON.stringify([fields,context]);let g=bags[kind].get(key);if(!g){g={...fields,...context,g:0,w:0,results:0,from:row.date,to:row.date};bags[kind].set(key,g)}g.g++;if(typeof side.win==='boolean'){g.results++;if(side.win)g.w++}if(row.date<g.from)g.from=row.date;if(row.date>g.to)g.to=row.date};
  for(const row of metaRowsFiltered(db,scoped))for(let index=0;index<(row.sides||[]).length;index++){
    const side=row.sides[index];if(!metaSideMatches(row,side,scoped))continue;
    const picks=(side.picks||[]).map(p=>typeof p==='string'?{champ:p}:p);
    // Actor/role/champion conditions select one matching appearance on this
    // target side. The resulting whole-team report keeps all its teammates.
    if((scoped.player||scoped.position||champ)&&!picks.some(p=>p&&(!scoped.player||p.player===scoped.player)&&(!scoped.position||p.role===scoped.position)&&(!champ||p.champ===champ)))continue;
    if(!observedMetaDate(db,row)){c.undated++;continue}c.sample++;
    const ids=[...new Set(picks.filter(p=>typeof p?.champ==='string'&&p.champ).map(p=>p.champ))].sort(),players=picks.map(p=>typeof p?.player==='string'&&p.player?p.player:null),color=metaSideColor(row,side),patch=typeof row.patch==='string'&&row.patch?row.patch:null,region=typeof side.region==='string'&&side.region?side.region:null,context={patch,region,color};
    if(color)c.knownColor++;else c.unknownColor++;if(!patch)c.unknownPatch++;if(!region)c.unknownRegion++;if(typeof side.win!=='boolean')c.unknownResult++;
    c.unknownChampion+=picks.filter(p=>typeof p?.champ!=='string'||!p.champ).length;
    if(picks.length===5&&ids.length===5)c.completeComposition++;else c.partialComposition++;
    if(players.length===5&&players.every(Boolean)&&new Set(players).size===5){if(players.every(id=>roster.has(id)))c.allCurrent++;else c.changedLineup++}else c.unknownLineup++;
    let p=patches.get(patch);if(!p){p={patch,g:0,w:0,results:0};patches.set(patch,p)}p.g++;if(typeof side.win==='boolean'){p.results++;if(side.win)p.w++}
    for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)add('pairs',{champs:[ids[i],ids[j]]},row,side,context);
    const sequence=recordedDraftSequence(row);
    if(sequence){
      c.knownOrder++;const events=sequence.events.filter(e=>e[1]==='P'),own=events.filter(e=>e[2]===index),first=own[0],opening=events[0][2]===index;
      if(opening)c.globalOpening++;
      add('firstPicks',{champ:first[3],opening,globalSlot:events.indexOf(first)+1},row,side,context);
      for(let slot=1;slot<own.length;slot++)add('followups',{first:first[3],champ:own[slot][3],ownSlot:slot+1,globalSlot:events.indexOf(own[slot])+1},row,side,context);
    }else c.unknownOrder++;
    const sides=row.sides||[],flat=sides.flatMap(s=>Array.isArray(s.bans)?s.bans:[]),knownBans=sides.length===2&&sides.every(s=>Array.isArray(s.bans)&&s.bans.length===5&&s.bans.every(id=>typeof id==='string'&&id))&&new Set(flat).size===10&&Array.isArray(row.bans)&&JSON.stringify(flat.slice().sort())===JSON.stringify(row.bans.slice().sort());
    if(knownBans){c.knownBans++;for(const id of side.bans)add('bans',{champ:id},row,side,context)}else c.unknownBans++;
  }
  const sort=(a,b)=>b.g-a.g||b.to.localeCompare(a.to)||JSON.stringify(a).localeCompare(JSON.stringify(b));for(const key of Object.keys(bags))out[key]=[...bags[key].values()].sort(sort);
  out.patches=[...patches.values()].sort((a,b)=>b.g-a.g||String(a.patch).localeCompare(String(b.patch)));
  out.warnings.push('historic-lineup');if(!c.sample)out.warnings.push('no-sample');else if(c.sample<ANALYST_REPORT_POLICY.smallSample)out.warnings.push('small-sample');
  if([...patches.keys()].filter(Boolean).length>1)out.warnings.push('mixed-patches');
  if(c.unknownOrder||c.partialComposition||c.unknownColor||c.unknownLineup||c.unknownPatch||c.unknownRegion||c.unknownResult||c.unknownBans||c.undated)out.warnings.push('incomplete-source');
  if(out.level>=1)for(const p of out.patches.slice(0,3))out.patterns.push({kind:'patch',...p});
  if(out.level>=2){for(const p of out.firstPicks.slice(0,3))out.patterns.push({kind:'first',...p});for(const p of out.pairs.slice(0,3))out.patterns.push({kind:'pair',...p})}
  return out;
}
