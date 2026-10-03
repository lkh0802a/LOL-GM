// Descriptive tiers reuse established labels and actual draft evaluation.
// No new draft coefficient, game state, observation or random draw is created.
function championTierLabels(db,rows){
  const ranked=rows.filter(x=>x.eligible).map(x=>({id:x.c.id,power:champStrength(x.c,db.patch)})).sort((a,b)=>b.power-a.power),
    ranks=new Map(ranked.map((x,i)=>[x.id,i/Math.max(1,ranked.length)])),observed=rows.some(x=>x.p||x.b);
  const tiers=new Map(rows.map(x=>[x.c.id,!x.eligible?'제한':observed?
    (x.pres>=.35?'S':x.pres>=.18?'A':x.pres>=.08?'B':x.pres>0?'C':'D'):
    (ranks.get(x.c.id)<.15?'S':ranks.get(x.c.id)<.4?'A':ranks.get(x.c.id)<.7?'B':'C')]));
  return {ranks,observed,tiers};
}
function publicChampionTiers(db,filter={},role=null){
  const scoped=Object.fromEntries(['region','patch','comp','season','year','split','league','scope','from','to'].filter(k=>filter[k]).map(k=>[k,filter[k]]));
  scoped.to=!scoped.to||scoped.to>db.worldDate?db.worldDate:scoped.to;
  const candidates=metaRowsFiltered(db,{...scoped,from:undefined,to:undefined}),dated=candidates.filter(row=>observedMetaDate(db,row)),
    valid=dated.filter(row=>(!scoped.from||row.date>=scoped.from)&&(!scoped.to||row.date<=scoped.to)),
    source=valid.length===candidates.length?db:{...db,metaHistory:valid},table=metaTableFiltered(source,scoped),
    labels=championTierLabels(db,table),sample=valid.length;
  let rows=table.filter(x=>!ROLES.includes(role)||x.c.roles.includes(role)).map(x=>({
    champ:x.c.id,tier:labels.tiers.get(x.c.id),eligible:x.eligible,picks:x.p,bans:x.b,wins:x.w,
    presence:x.pres,winRate:x.wr,sample,roles:x.c.roles.slice()}));
  if(!labels.observed)rows.sort((a,b)=>(labels.ranks.get(a.champ)??2)-(labels.ranks.get(b.champ)??2));
  return {rows,sample,observed:labels.observed,excluded:candidates.length-dated.length,patch:db.patch.id,filter:scoped,
    source:labels.observed?'게임 내 공개 공식 대회':'현재 패치 공개 규칙 기반 예상',externalValidated:false};
}
function internalChampionTiers(db,{team=managedTeamId(db),role=null,patch=db.patch.id}={}){
  const club=db.teams[team],base={allowed:false,team,patch:db.patch.id,date:db.worldDate,rows:[],missingRoles:[]};
  if(db.world?.fired||!club||club.active===false||!managerControlsSquad(db,club))return {...base,reason:'no-authority'};
  if(patch!==db.patch.id)return {...base,allowed:true,reason:'historical-state-unavailable'};
  const current=metaRowsFiltered(db,{patch:db.patch.id});
  if(current.some(row=>!observedMetaDate(db,row)))return {...base,allowed:true,reason:'unverified-current-evidence'};
  // Read the explicit current lineup. starterFor may repair/write a lineup,
  // so report viewing must not call it or create a speculative opponent session.
  const roster={},ids=new Set();
  for(const r of ROLES){const p=db.players[club.depthChart?.[r]];
    if(p?.team===club.id&&(club.roster||[]).includes(p.id)&&ROLES.every(other=>other===r||club.depthChart?.[other]!==p.id)&&validLineupPlayer(db,club,p)&&!ids.has(p.id)){roster[r]=p;ids.add(p.id)}else base.missingRoles.push(r);
  }
  const pool=draftPoolSnapshot(db,{}),samples=currentPatchMetaSamples(db),
    assessment=draftTeamMetaAssessment(db,club,pool,samples),
    state={db,teamIds:[team,null],roster:[roster,{}],tacs:[club.tactics,{}],vhat:[assessment,{}],pickList:[[],[]],ctx:{byTeam:{}}};
  const rows=[];
  for(const c of pool.champs){
    const fits=(c.roles||[]).filter(r=>ROLES.includes(r)&&(!ROLES.includes(role)||r===role)&&roster[r]).map(r=>{
      const p=roster[r],factors=draftPickValue(state,0,r,c.id,[]);
      return {role:r,player:p.id,mastery:draftMastery(p,c.id),trained:Object.hasOwn(p.pool||{},c.id),factors,score:factors.total};
    }).sort((a,b)=>b.score-a.score||ROLES.indexOf(a.role)-ROLES.indexOf(b.role));
    if(!fits.length)continue;
    rows.push({champ:c.id,best:fits[0],fits,meta:draftMetaEvidence(state,0,c.id)});
  }
  rows.sort((a,b)=>b.best.score-a.best.score||a.champ.localeCompare(b.champ));
  rows.forEach((row,i)=>{const rank=i/Math.max(1,rows.length);row.tier=rank<.15?'S':rank<.4?'A':rank<.7?'B':'C';row.rank=i+1});
  return {...base,allowed:true,reason:rows.length?null:'no-valid-lineup',rows};
}

// Compare different evidence scopes without subtracting incompatible grades.
function championTierComparison(db,{team=managedTeamId(db),filter={},role=null}={}){
  const publicReport=publicChampionTiers(db,filter,role),internalReport=internalChampionTiers(db,{team,role,patch:filter.patch||db.patch.id}),
    own=new Map(internalReport.rows.map(row=>[row.champ,row]));
  const rows=publicReport.rows.map(publicRow=>({champ:publicRow.champ,public:publicRow,internal:own.get(publicRow.champ)||null}));
  if(!internalReport.reason)rows.sort((a,b)=>(a.internal?.rank??Infinity)-(b.internal?.rank??Infinity)||a.champ.localeCompare(b.champ));
  return {public:publicReport,internal:internalReport,rows};
}
function publicTierSourceGroups(db,filter={}){
  const report=publicChampionTiers(db,filter),groups=new Map(),unverified=new Set(metaRowsFiltered(db,{...report.filter,from:undefined,to:undefined}).filter(row=>!observedMetaDate(db,row)).map(row=>JSON.stringify([row.comp||null,row.patch||null])));
  for(const row of metaRowsFiltered(db,report.filter)){
    if(!observedMetaDate(db,row))continue;
    const key=JSON.stringify([row.comp||null,row.patch||null]),group=groups.get(key)||{comp:row.comp||null,patch:row.patch||null,games:0,from:row.date,to:row.date,navigationSafe:!unverified.has(key)};
    group.games++;if(row.date<group.from)group.from=row.date;if(row.date>group.to)group.to=row.date;groups.set(key,group);
  }
  return [...groups.values()].sort((a,b)=>b.games-a.games||String(a.comp).localeCompare(String(b.comp))||String(a.patch).localeCompare(String(b.patch)));
}
