// D-032 preset entry allocation. Legacy/custom entry modes retain their writer.
function internationalEventPriority(a,b){
  if((a.tier==='low')!==(b.tier==='low'))return a.tier==='low'?1:-1;
  const tier=i=>Number.isFinite(i.tier)?i.tier:1;
  return tier(a)-tier(b)||(a.prestige||1)-(b.prestige||1);
}
function internationalEntryExclusions(db,it,taken){
  const excluded=new Set(taken);
  for(const s of Object.values(db.world.seasons||{})){
    if(s.year!==db.world.year||!(s.formatSnapshot?.international||db.competitions[s.comp]?.international))continue;
    const event=s.internationalPeriodSnapshot||db.worldConfig.internationals.find(x=>x.id===canonicalInternationalId(s.comp));
    if(!event)continue;
    const same=it.phase!=null&&event.phase!=null?event.phase===it.phase:it.timing!=null&&event.timing!=null&&event.timing===it.timing;
    if(same)for(const t of s.formatSnapshot?.teams||Object.keys(s.internationalRegionSnapshot||{}))excluded.add(t);
  }
  return excluded;
}
function internationalQualifierOrder(db,R){
  const s=Object.values(db.world?.seasons||{}).filter(s=>s.done&&s.year<=db.world.year&&Number.isInteger(s.split)&&
    (s.region||s.formatSnapshot?.region)===R.id&&(s.div||s.formatSnapshot?.div||1)===1)
    .sort((a,b)=>b.year-a.year||b.split-a.split)[0];
  if(!s){ // retain bootstrap seeding, without consulting future season results
    const view=Object.create(db);view.world={...db.world,seasons:Object.fromEntries(Object.entries(db.world?.seasons||{}).filter(([,s])=>s.year<=db.world.year))};
    return regionPlacements(view,R);
  }
  const view=historicalSeasonView(db,s);if(!view)return [];
  const comp=view.competitions[s.comp],cfg=comp.stages.at(-1),sd=s.stageData[cfg.id];
  if(!['single_elim','double_elim'].includes(cfg.type)||!sd?.seeds||!Array.isArray(sd.rounds)||!s.champion||!s.runnerUp||s.days.some(d=>d.matches.some(m=>!m.res)))return [];
  const order=['round_robin','swiss'].includes(comp.stages[0].type)?standings(view,s,comp.stages[0].id).map(r=>r.tid):sd.seeds,exits=new Map();
  for(const [round,rd] of (sd.rounds||[]).entries()){
    if(cfg.type==='double_elim'&&!['L','LX','GF'].includes(rd.br))continue;
    for(const day of s.days.filter(d=>d.stage===cfg.id&&d.label===rd.label))for(const m of day.matches){
      if(m.res)exits.set(m.res.winner===m.a?m.b:m.a,round);
    }
  }
  return [...new Set([s.champion,s.runnerUp,...sd.seeds.slice().sort((a,b)=>(exits.get(b)??-1)-(exits.get(a)??-1)||order.indexOf(a)-order.indexOf(b))])]
    .filter(t=>t&&db.teams[t]?.active!==false&&db.teams[t]?.region===R.id&&(db.teams[t]?.division||1)===1);
}
function presetInternationalEntries(db,it,taken){
  if(it.entry!=null||!['first_stand','msi_swiss_de','worlds_league_phase','regional_cup'].includes(it.format))return null;
  if(!Number.isSafeInteger(it.teams)||it.teams<4)return [];
  // Ratings normalize only a small policy copy, never the live save on a read.
  const read={world:db.world,global:db.global||{},worldConfig:{internationalPolicy:JSON.parse(JSON.stringify(db.worldConfig.internationalPolicy||{}))}},ratings=internationalRegionRatings(read,db.world.year);
  const regions=Object.values(db.regions).filter(R=>R.tier==='major'&&(!it.zone||(INTL_ZONES[it.zone]||[]).includes(R.id)))
    .sort((a,b)=>Object.keys(ratings).length?compareInternationalRegions(read,ratings,a,b,db.world.year):(b.strength-a.strength||a.id.localeCompare(b.id)));
  const excluded=internationalEntryExclusions(db,it,taken);
  const base=it.baseSlots??2,extra=it.extraSlots??(it.format==='regional_cup'?Math.max(0,it.teams-base*regions.length):0),max=it.maxSlots??Math.max(base+extra,4);
  if(![base,extra,max].every(n=>Number.isSafeInteger(n)&&n>=0))return [];
  const entries=regions.map(R=>({candidates:internationalQualifierOrder(db,R).filter(t=>!excluded.has(t)),count:0})),teams=[];
  const take=e=>{if(e.count>=max||!e.candidates.length||teams.length>=it.teams)return false;teams.push(e.candidates.shift());e.count++;return true};
  for(let i=0;i<base&&teams.length<it.teams;i++){let added=false;for(const e of entries)if(take(e))added=true;if(!added)break;}
  let remaining=extra;
  while(remaining>0&&teams.length<it.teams){let added=false;for(const e of entries)if(remaining>0&&take(e)){remaining--;added=true}if(!added)break;}
  return teams;
}
