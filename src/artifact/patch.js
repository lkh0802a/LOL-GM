// ===== LOL GM: 패치 / 메타 =====
// 패치 = 수치 변화(델타)의 기록. 어떤 시점의 패치든 기본 데이터 + 델타로 다시 만들 수 있다
const PATCH_CACHE={};
const RULE_KO={dragonRespawn:'드래곤 재생성(분)',baronBuff:'바론 버프 지속(분)',csGold:'미니언 골드',killGold:'처치 골드',heraldSpawn:'전령 등장(분)',baronSpawn:'바론 등장(분)'};
function initPatches(db){
  db.patches={base:JSON.parse(JSON.stringify(db.patch)),list:[],prev:[],nextDate:null,newIdx:0,y:0,n:0,releasesByYear:{}};
  db.metaStats={};db.metaGames=0;db.regionMetaStats={};db.regionMetaGames={};
}
function applyNote(P,n){
  const c=P.champions[n.c];
  if(n.type==='skill'&&c&&c.skills?.[n.slot])c.skills[n.slot][n.field]=n.new;
  else if(n.type==='kit'&&c)c.kit[n.key]=clamp(c.kit[n.key]+n.d,1,10);
  else if(n.type==='base'&&c)c.base[n.key]=n.new??Math.round(c.base[n.key]*(1+n.d)*100)/100;
  else if(n.type==='new'){const c=archChampion(n.def.name,n.def.roles,n.def.arch,n.def.dmg,null,n.def.id||championId(n.def.name));c.releaseDate=n.def.releaseDate||null;c.proEligibleDate=n.def.proEligibleDate||null;P.champions[c.id]=c}
  else if(n.type==='rule')P.rules[n.key]=n.v;
}
function getPatch(db,id){
  if(db.patch&&db.patch.id===id)return db.patch;
  if(PATCH_CACHE[id])return PATCH_CACHE[id];
  const P=JSON.parse(JSON.stringify(db.patches.base));
  for(const p of db.patches.list){if(P.id===id)break;for(const n of p.notes)applyNote(P,n);P.id=p.id}
  return PATCH_CACHE[id]=P;
}
function championProEligible(db,c,date=db.worldDate){
  if(!c)return false;
  return !c.proEligibleDate||date>=c.proEligibleDate;
}
function championAvailableForContext(db,c,ctx={}){if(!c)return false;if(ctx.practice)return true;if(!championProEligible(db,c))return false;return !ctx.championPool||ctx.championPool.includes(c.id)}
function recordMeta(db,r){
  if(!db.metaStats)return;
  db.metaGames=(db.metaGames||0)+1;
  const st=db.metaStats, regions=[...new Set(r.sides.map(s=>s.team&&s.team.region).filter(Boolean))];
  const add=(bag,cid,key)=>{const x=bag[cid]||(bag[cid]={p:0,w:0,b:0});x[key]++};
  r.sides.forEach((s,i)=>s.ps.forEach(p=>{add(st,p.champ.id,'p');if(r.winner===i)add(st,p.champ.id,'w')}));
  r.draft.bans.flat().forEach(c=>add(st,c,'b'));
  db.regionMetaStats=db.regionMetaStats||{};db.regionMetaGames=db.regionMetaGames||{};
  for(const rid of regions){
    const bag=db.regionMetaStats[rid]||(db.regionMetaStats[rid]={});db.regionMetaGames[rid]=(db.regionMetaGames[rid]||0)+1;
    r.sides.forEach((s,i)=>{if(!s.team||s.team.region!==rid)return;s.ps.forEach(p=>{add(bag,p.champ.id,'p');if(r.winner===i)add(bag,p.champ.id,'w')})});
    r.draft.bans.flat().forEach(c=>add(bag,c,'b'));
  }
  db.metaHistory=db.metaHistory||[];
  const mc=r.metaContext||{};
  db.metaHistory.push({date:r.date||db.worldDate,patch:r.patch||db.patch.id,comp:r.comp||r.competitionId||null,season:mc.season||null,year:mc.year||+(r.date||db.worldDate).slice(0,4),split:mc.split||null,stage:mc.stage||null,league:mc.league||null,international:!!mc.international,regions,sides:r.sides.map((s,i)=>({team:s.team?.id||null,region:s.team?.region||null,win:r.winner===i,picks:s.ps.map(x=>({champ:x.champ.id,role:x.role||null,player:x.p?.id||null}))})),bans:r.draft.bans.flat()});
  const international=regions.length>1;
  for(const side of r.sides){const t=side.team;if(!t)continue;t.metaKnowledge=t.metaKnowledge||{};t.metaCounter=t.metaCounter||{};for(const os of r.sides){if(os===side)continue;for(const pick of os.ps){const cid=pick.champ.id,success=r.winner===r.sides.indexOf(os),novel=((db.regionMetaStats?.[t.region]||{})[cid]?.p||0)<3,analysis=.65+(t.coach?.analysis||50)/140,learn=(success?.055:.018)*(novel?1.6:1)*(international?1.35:1)*analysis;t.metaKnowledge[cid]=clamp((t.metaKnowledge[cid]||0)+learn,0,1);if(r.winner!==r.sides.indexOf(side))t.metaCounter[cid]=clamp((t.metaCounter[cid]||0)+.02*analysis,0,1)}}}
}
function metaTableFiltered(db,filter={}){
  const rows=(db.metaHistory||[]).filter(r=>(!filter.region||r.regions.includes(filter.region))&&(!filter.patch||r.patch===filter.patch)&&(!filter.comp||r.comp===filter.comp)&&(!filter.season||r.season===filter.season)&&(!filter.year||r.year===+filter.year)&&(!filter.split||String(r.split)===String(filter.split))&&(!filter.league||r.league===filter.league)&&(!filter.scope||(filter.scope==='INTL'?r.international:!r.international))&&(!filter.from||r.date>=filter.from)&&(!filter.to||r.date<=filter.to));
  if(!rows.length)return metaTable(db,filter.region||null);
  const st={},add=(cid,key)=>{const x=st[cid]||(st[cid]={p:0,w:0,b:0});x[key]++};
  for(const r of rows){for(const side of r.sides){if(filter.region&&side.region!==filter.region)continue;for(const pick of side.picks){const p=typeof pick==='string'?{champ:pick}:pick;if(filter.position&&p.role!==filter.position)continue;add(p.champ,'p');if(side.win)add(p.champ,'w')}}for(const cid of r.bans)add(cid,'b')}
  const G=Math.max(1,rows.length);return Object.values(db.patch.champions).map(c=>{const s=st[c.id]||{p:0,w:0,b:0};return {c,p:s.p,b:s.b,w:s.w,pres:(s.p+s.b)/G,wr:s.p?s.w/s.p:null,sample:G,eligible:championProEligible(db,c)}}).sort((a,b)=>b.pres-a.pres);
}

function championMetaInsights(db,cid,filter={}){
  const players={},teams={},matchups={},recent=[], rows=(db.metaHistory||[]).filter(r=>(!filter.region||r.regions.includes(filter.region))&&(!filter.patch||r.patch===filter.patch)&&(!filter.comp||r.comp===filter.comp)&&(!filter.season||r.season===filter.season)&&(!filter.year||r.year===+filter.year)&&(!filter.split||String(r.split)===String(filter.split))&&(!filter.league||r.league===filter.league)&&(!filter.scope||(filter.scope==='INTL'?r.international:!r.international))&&(!filter.from||r.date>=filter.from)&&(!filter.to||r.date<=filter.to));
  for(const r of rows)for(const side of r.sides||[]){if(filter.region&&side.region!==filter.region)continue;const picks=(side.picks||[]).map(p=>typeof p==='string'?{champ:p}:p),me=picks.find(p=>p.champ===cid&&(!filter.position||p.role===filter.position));if(!me)continue;if(me.player){const x=players[me.player]||(players[me.player]={g:0,w:0});x.g++;if(side.win)x.w++}if(side.team){const x=teams[side.team]||(teams[side.team]={g:0,w:0});x.g++;if(side.win)x.w++}const opp=(r.sides||[]).find(x=>x!==side);if(opp&&me.role){const op=(opp.picks||[]).map(p=>typeof p==='string'?{champ:p}:p).find(p=>p.role===me.role);if(op){const x=matchups[op.champ]||(matchups[op.champ]={g:0,w:0});x.g++;if(side.win)x.w++}}recent.push({date:r.date,win:side.win})}
  const top=o=>Object.entries(o).sort((a,b)=>b[1].g-a[1].g||b[1].w-a[1].w).slice(0,5);return {players:top(players),teams:top(teams),matchups:top(matchups),recent:recent.sort((a,b)=>a.date.localeCompare(b.date)).slice(-10)};
}
function metaTable(db,regionId=null){
  const G=Math.max(1,regionId?(db.regionMetaGames||{})[regionId]||0:db.metaGames||0), st=regionId?((db.regionMetaStats||{})[regionId]||{}):(db.metaStats||{});
  return Object.values(db.patch.champions).map(c=>{const s=st[c.id]||{p:0,w:0,b:0};return {c,p:s.p,b:s.b,w:s.w,pres:(s.p+s.b)/G,wr:s.p?s.w/s.p:null,sample:G,eligible:championProEligible(db,c)}}).sort((a,b)=>b.pres-a.pres);
}
function patchId(db,year){const pt=db.patches;if(pt.y!==year){pt.y=year;pt.n=0}pt.n++;return `${String(year).slice(2)}.${pt.n}`}
// 밸런스 팀의 판단: 대회에서 너무 많이 쓰이고 이기는 챔피언은 하향, 외면받는 챔피언은 상향
function newPatch(db,date,major,rng){
  const notes=[], mt=metaTable(db), P=db.patch, id=patchId(db,+date.slice(0,4));
  const strong=['burst','dps','cc','engage','early','mid','late','sustain','poke'];
  const nerfN=major?rng.int(5,8):rng.int(2,4), buffN=major?rng.int(6,9):rng.int(3,5);
  const last=db.patches.list.at(-1),recentDir=(cid,dir)=>!!last?.notes?.some(n=>n.c===cid&&n.dir===dir);
  const nerfs=mt.filter(x=>x.p+x.b>=4&&(x.wr===null||x.wr>=0.48)&&!recentDir(x.c.id,-1)).slice(0,nerfN+2).sort(()=>rng.next()-0.5).slice(0,nerfN);
  const low=mt.filter(x=>x.pres<0.04&&!recentDir(x.c.id,1)).sort(()=>rng.next()-0.5).slice(0,buffN);
  const change=(x,dir,why)=>{
    const c=x.c,skills=['Q','W','E','R'].map(k=>c.skills?.[k]).filter(s=>s&&Number.isFinite(s.cooldown)&&s.cooldown>0);
    if(skills.length&&rng.chance(.62)){const sk=rng.pick(skills),old=sk.cooldown,step=rng.chance(.75)?1:2,newV=Math.max(1,Math.round((old+(dir<0?step:-step))*10)/10);notes.push({type:'skill',c:c.id,slot:sk.slot,field:'cooldown',old,new:newV,dir,why})}
    else {const key=rng.pick(['ad','hp','arm','adg','hpg']),old=c.base[key],delta=Math.round(dir*rng.range(.015,.04)*1000)/1000,newV=Math.round(old*(1+delta)*100)/100;notes.push({type:'base',c:c.id,key,old,new:newV,d:delta,dir,why})}
  };
  nerfs.forEach(x=>change(x,-1,`밴픽률 ${Math.round(x.pres*100)}%${x.wr!==null?` · 승률 ${Math.round(x.wr*100)}%`:''}`));
  low.forEach(x=>change(x,+1,`밴픽률 ${Math.round(x.pres*100)}%로 외면받음`));
  if(major&&rng.chance(.025)){const cand=mt.filter(x=>!x.c.releaseDate)[rng.int(0,Math.max(0,mt.filter(x=>!x.c.releaseDate).length-1))];if(cand){const key=rng.pick(['early','mid','late','burst','dps','cc','engage','peel','poke','sustain']),d=rng.chance(.5)?1:-1;notes.push({type:'kit',c:cand.c.id,key,d,dir:d,why:'희귀 대규모 챔피언 리워크'})}}
  if(rng.chance(major?.35:.03)){
    const opts=[['dragonRespawn',[5,6]],['baronBuff',[3,3.5,2.5]],['csGold',[21,22,23,24]],['killGold',[275,300,325]],['heraldSpawn',[14,15,16]],['baronSpawn',[20,22,25]]];
    const [key,vals]=rng.pick(opts), cur=P.rules[key], v=rng.pick(vals.filter(x=>x!==cur)); if(v!==undefined)notes.push({type:'rule',key,v,old:cur,why:'게임 템포 조정'});
  }
  // 신규 챔피언은 패치마다 나오지 않는다. 연 2~3명 수준을 중심으로 드물게 출시한다.
  const year=+date.slice(0,4),released=(db.patches.releasesByYear&&db.patches.releasesByYear[year])||0,releaseChance=major?.58:.07;
  if(released<4&&rng.chance(releaseChance)){
    let def;
    if(db.patches.newIdx<CHAMP_RELEASES.length){const [name,roles,arch,dmg]=CHAMP_RELEASES[db.patches.newIdx++];def={id:championId(name),name,roles,arch,dmg}}
    else{let name,id;do{name=rng.pick(NEWCHAMP_A)+rng.pick(NEWCHAMP_B);id=championId(name)}while(P.champions[id]);const role=rng.pick(ROLES);
      const arch=rng.pick({TOP:['juggernaut','diver','skirmisher','vanguard'],JGL:['diver','assassin','skirmisher','vanguard'],MID:['burst','control','battle','assassin','artillery'],ADC:['marksman','hyper','bully'],SUP:['enchanter','catcher','warden','control']}[role]);
      def={id,name,roles:[role],arch,dmg:['burst','control','battle','artillery','enchanter','specialist'].includes(arch)?'AP':'AD'};db.patches.newIdx++}
    def.releaseDate=date;def.proEligibleDate=addDays(date,14);
    db.patches.releasesByYear=db.patches.releasesByYear||{};db.patches.releasesByYear[year]=released+1;
    notes.push({type:'new',def,why:'신규 챔피언 출시',c:def.name});
  }
  notes.forEach(n=>applyNote(P,n));
  if(typeof adaptPlayerPoolsToPatch==='function')adaptPlayerPoolsToPatch(db,notes,!!major);
  P.id=id;
  db.patches.list.push({id,date,major:!!major,notes});
  for(const k in PATCH_CACHE)delete PATCH_CACHE[k];
  // 메타 데이터는 새 패치에서 절반만 이어짐 (팀들이 다시 학습)
  for(const k in db.metaStats){const x=db.metaStats[k];x.p=Math.floor(x.p/3);x.w=Math.floor(x.w/3);x.b=Math.floor(x.b/3)}
  db.metaGames=Math.floor((db.metaGames||0)/3);
  for(const rid in db.regionMetaStats||{})for(const k in db.regionMetaStats[rid]){const x=db.regionMetaStats[rid][k];x.p=Math.floor(x.p/3);x.w=Math.floor(x.w/3);x.b=Math.floor(x.b/3)}
  for(const rid in db.regionMetaGames||{})db.regionMetaGames[rid]=Math.floor(db.regionMetaGames[rid]/3);
  return {id,notes};
}
function patchTick(db,date,rng){
  const pt=db.patches;if(!pt.nextDate)pt.nextDate=addDays(date,14);
  while(date>=pt.nextDate){const p=newPatch(db,pt.nextDate,false,rng);news(db,`패치 ${p.id} 적용 — 챔피언 ${p.notes.filter(n=>n.c).length}명 조정`);const gap=rng.chance(.08)?21:14;pt.nextDate=addDays(pt.nextDate,pt.cadence||gap)}
}
// 새 시즌: 지난 시즌 패치를 기준점으로 접고(재생은 이번 시즌 경기만 필요) 개막 대형 패치 적용
function seasonPatch(db,date,rng){
  const pt=db.patches;
  pt.prev=pt.list.map(p=>({id:p.id,date:p.date,major:p.major,notes:p.notes}));
  pt.base=JSON.parse(JSON.stringify(db.patch));pt.list=[];
  for(const k in PATCH_CACHE)delete PATCH_CACHE[k];
  const p=newPatch(db,date,true,rng);pt.nextDate=addDays(date,pt.cadence||14);
  const nc=p.notes.find(n=>n.type==='new');
  news(db,`시즌 개막 패치 ${p.id} — 챔피언 ${p.notes.filter(n=>n.c).length}명 조정${nc?`, 신규 챔피언 ${nc.def.name} 출시`:''}`);
}