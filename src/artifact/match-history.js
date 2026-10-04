// Public event-time observations only. Never persist profiles/ratings/tactics.
function publicMatchRecord(r,patch){
  const events=(r.log||[]).filter(e=>['kill','fight','obj','tower','nexus'].includes(e.kind)),limit=24,
    selected=events.length>limit?[...events.slice(0,12),...events.slice(-12)]:events;
  return {version:1,date:r.date,patch,winner:r.sides[r.winner].team.id,duration:r.duration,
    sides:r.sides.map(s=>({team:s.team.id,name:s.team.name,players:s.ps.map(p=>[p.p.id,p.p.name,p.role,p.champ.id,p.k,p.d,p.a,Math.round(p.cs),Math.round(p.goldEarned),Math.round(p.dmg),p.lvl,matchQuestItems(p).slice()])})),
    championNames:Object.fromEntries(r.sides.flatMap(s=>s.ps.map(p=>[p.champ.id,championDisplayName(p.champ)]))),
    itemNames:Object.fromEntries(r.sides.flatMap(s=>s.ps.flatMap(p=>matchQuestItems(p).map(id=>[id,p.patchRef?.itemDefs?.[id]?.name||id])))),
    eventCount:events.length,events:selected.map(e=>[e.t,e.sec,e.kind,e.side,e.text])};
}
function recordedPublicMatch(db,rec,game){
  const p=game?.publicRecord;
  if(!p)return {reason:'not-recorded',record:null};
  if(p.version!==1||!['championNames','itemNames'].every(k=>p[k]&&typeof p[k]==='object'&&!Array.isArray(p[k])&&Object.values(p[k]).every(x=>typeof x==='string'))||p.date!==game.date||p.patch!==game.patch||p.patch!==rec.patch||!observedMetaDate(db,p)||p.winner!==game.winner||!Number.isFinite(p.duration)||p.duration<=0||!Array.isArray(p.sides)||p.sides.length!==2||p.sides.some((s,i)=>!s||typeof s!=='object'||s.team!==[game.blue,game.red][i]||typeof s.name!=='string'||!Array.isArray(s.players)||s.players.length!==5||new Set(s.players.map(x=>x?.[2])).size!==5||s.players.some(x=>!Array.isArray(x)||x.length!==12||typeof x[0]!=='string'||typeof x[1]!=='string'||!ROLES.includes(x[2])||typeof x[3]!=='string'||!x.slice(4,11).every(Number.isFinite)||!Array.isArray(x[11])||x[11].length>7||!x[11].every(id=>typeof id==='string')))||!Array.isArray(p.events)||p.events.length>24||!Number.isInteger(p.eventCount)||p.eventCount<p.events.length||p.events.some(e=>!Array.isArray(e)||e.length!==5||!Number.isFinite(e[0])||!Number.isFinite(e[1])||![-1,0,1].includes(e[3])||typeof e[4]!=='string'||!['kill','fight','obj','tower','nexus'].includes(e[2])||e[0]<0||e[0]>Math.ceil(p.duration)||e[1]<0||e[1]>=60))return {reason:'unverified-source',record:null};
  return {reason:null,record:p};
}
function officialMatchReviews(db,team,filter={}){
  const club=db.teams[team];if(db.world?.fired||!club||!managerControlsSquad(db,club))return [];
  const out=[];
  for(const [key,s] of Object.entries(db.world?.seasons||{}))for(const [di,day] of (s.days||[]).entries())for(const [mi,m] of (day.matches||[]).entries()){
    const rec=m.res;if(!rec||![rec.a,rec.b].includes(team)||filter.comp&&filter.comp!==s.comp)continue;
    for(const [gi,g] of (rec.games||[]).entries()){
      const date=g.date||day.date,patch=g.patch||rec.patch;
      if(!observedMetaDate(db,{date})||filter.from&&date<filter.from||filter.to&&date>filter.to||filter.patch&&patch!==filter.patch)continue;
      const publicRead=recordedPublicMatch(db,rec,g);
      if(filter.position&&(!publicRead.record||!publicRead.record.sides.find(x=>x.team===team)?.players.some(x=>x[2]===filter.position)))continue;
      out.push({key,di,mi,gi,date,patch,comp:s.comp,rec,game:g});
    }
  }
  return out.sort((a,b)=>b.date.localeCompare(a.date)||a.key.localeCompare(b.key)||a.di-b.di||a.mi-b.mi||a.gi-b.gi);
}
