// Public, observed preparation evidence. Never consult a player's latent pool,
// private practice, scouting estimate or the opponent's hidden match plans.
function opponentReportContext(db,{observer=managedTeamId(db),target=null}={}){
  const out={allowed:false,observer,target:null,next:null,selected:!!target,available:false,level:0,warnings:[]},club=db.teams[observer];
  if(db.world?.fired||!club||!managerControlsSquad(db,club))return out;
  out.allowed=true;Object.assign(out,analystReportSupport(club,'opponent'));out.next=nextTeamMatch(db,observer);out.target=target||out.next?.opponent||null;
  if(!db.teams[out.target]||out.target===observer)out.warnings.push(out.target?'invalid-target':'no-next-match');
  return out;
}
function observedMetaDate(db,row){return typeof row.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(row.date)&&Number.isFinite(Date.parse(row.date))&&new Date(row.date).toISOString().slice(0,10)===row.date&&row.date<=db.worldDate}
function opponentPreparation(db,{observer=managedTeamId(db),target=null,filter={},champ=null}={}){
  const out={allowed:false,observer,target:null,next:null,selected:!!target,available:false,level:0,players:[],groups:[],patterns:[],warnings:[],coverage:{teamGames:0,appearances:0,atTarget:0,elsewhere:0,unknownPlayer:0,unknownChampion:0,unknownRole:0,unknownPatch:0,unknownAffiliation:0,unknownResult:0,undatedSides:0,duplicatePlayers:0}};
  Object.assign(out,opponentReportContext(db,{observer,target}));if(!out.allowed||out.warnings.length)return out;
  const rival=db.teams[out.target];
  // Roster membership is public context, not a prediction of the next lineup.
  const roster=new Set((rival.roster||[]).filter(id=>typeof id==='string'&&id)),players=new Map(),groups=new Map(),patches=new Set(),c=out.coverage;
  const player=id=>{let p=players.get(id);if(!p){p={id,current:roster.has(id),appearances:0,atTarget:0,elsewhere:0,from:null,to:null};players.set(id,p)}return p};
  for(const id of roster)player(id);
  // The report has its own target. Generic team/opponent controls retain their
  // original meaning elsewhere; time/patch/region/player/role/side still apply.
  const scoped={...filter};delete scoped.team;delete scoped.opponent;
  const rows=new Set(metaRowsFiltered(db,{...scoped,team:rival.id}));
  for(const id of roster)if(!scoped.player||scoped.player===id)for(const row of metaRowsFiltered(db,{...scoped,player:id}))rows.add(row);
  for(const row of rows)for(const side of row.sides||[]){
    if(!metaSideMatches(row,side,scoped))continue;
    const atTarget=side.team===rival.id,picks=side.picks||[];
    if(!atTarget&&!picks.some(p=>p&&typeof p==='object'&&roster.has(p.player)))continue;
    if(!observedMetaDate(db,row)){c.undatedSides++;continue}
    if(atTarget)c.teamGames++;
    const seen=new Set();
    for(const pick of picks){
      const p=typeof pick==='string'?{champ:pick}:pick;if(!p||scoped.position&&p.role!==scoped.position||scoped.player&&p.player!==scoped.player||champ&&p.champ!==champ)continue;
      const id=typeof p.player==='string'&&p.player?p.player:null;
      if(!atTarget&&!roster.has(id))continue;
      if(!id){c.unknownPlayer++;continue}
      if(seen.has(id)){c.duplicatePlayers++;continue}seen.add(id);
      const actor=player(id);actor.appearances++;actor[atTarget?'atTarget':'elsewhere']++;actor.from=!actor.from||row.date<actor.from?row.date:actor.from;actor.to=!actor.to||row.date>actor.to?row.date:actor.to;
      c.appearances++;c[atTarget?'atTarget':'elsewhere']++;
      const cid=typeof p.champ==='string'&&p.champ?p.champ:null,role=ROLES.includes(p.role)?p.role:null,patch=typeof row.patch==='string'&&row.patch?row.patch:null,team=typeof side.team==='string'&&side.team?side.team:null,region=typeof side.region==='string'&&side.region?side.region:null,knownResult=typeof side.win==='boolean';
      if(!role)c.unknownRole++;if(!patch)c.unknownPatch++;else patches.add(patch);if(!team||!region)c.unknownAffiliation++;if(!knownResult)c.unknownResult++;
      if(!cid){c.unknownChampion++;continue}
      // Recorded affiliation is part of the key: a move never transfers old
      // appearances to today's club or region. Missing fields remain null.
      const key=JSON.stringify([id,cid,role,patch,team,region]);let g=groups.get(key);
      if(!g){g={player:id,champ:cid,role,patch,team,region,g:0,w:0,results:0,from:row.date,to:row.date};groups.set(key,g)}g.g++;if(knownResult){g.results++;if(side.win)g.w++}if(row.date<g.from)g.from=row.date;if(row.date>g.to)g.to=row.date;
    }
  }
  out.players=[...players.values()].filter(p=>!scoped.player||p.id===scoped.player).sort((a,b)=>Number(b.current)-Number(a.current)||b.appearances-a.appearances||a.id.localeCompare(b.id));
  out.groups=[...groups.values()].sort((a,b)=>b.g-a.g||b.to.localeCompare(a.to)||JSON.stringify(a).localeCompare(JSON.stringify(b)));
  out.warnings.push('roster-not-lineup');
  if(!c.teamGames)out.warnings.push('no-team-sample');else if(c.teamGames<ANALYST_REPORT_POLICY.smallSample)out.warnings.push('small-team-sample');
  if(out.players.some(p=>p.current&&p.appearances<ANALYST_REPORT_POLICY.smallSample))out.warnings.push('small-player-sample');
  if(patches.size>1)out.warnings.push('mixed-patches');
  if(c.unknownPlayer||c.unknownChampion||c.unknownRole||c.unknownPatch||c.unknownAffiliation||c.unknownResult||c.undatedSides||c.duplicatePlayers)out.warnings.push('incomplete-source');
  if(out.level>=1)for(const g of out.groups.slice(0,3))out.patterns.push({kind:'recorded-patch',player:g.player,champ:g.champ,patch:g.patch,g:g.g});
  if(out.level>=2){
    const frequencies=new Map();for(const g of out.groups){const key=JSON.stringify([g.player,g.champ,g.role]);let f=frequencies.get(key);if(!f){f={kind:'observed-choice',player:g.player,champ:g.champ,role:g.role,g:0,patches:new Set()};frequencies.set(key,f)}f.g+=g.g;if(g.patch)f.patches.add(g.patch)}
    for(const f of [...frequencies.values()].sort((a,b)=>b.g-a.g||a.player.localeCompare(b.player)||a.champ.localeCompare(b.champ)).slice(0,3))out.patterns.push({...f,patches:f.patches.size});
  }
  return out;
}
