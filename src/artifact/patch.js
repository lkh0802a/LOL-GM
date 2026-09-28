// ===== LOL GM: patch persistence, snapshot replay and time orchestration =====
// Owns patch snapshots, deltas, eligibility, diagnosis, champion/system balance, reworks and releases.

// 패치 = 수치 변화(델타)의 기록. 어떤 시점의 패치든 기본 데이터 + 델타로 다시 만들 수 있다
const PATCH_CACHE=new WeakMap();

const RULE_KO={dragonRespawn:'드래곤 재생성(분)',baronBuff:'바론 버프 지속(분)',csGold:'미니언 골드',killGold:'처치 골드',heraldSpawn:'전령 등장(분)',baronSpawn:'바론 등장(분)'};
function initPatches(db){
  db.patches={list:[],history:[],prev:[],nextDate:null,newIdx:0,y:0,n:0,releasesByYear:{},releaseTargets:{},reworksByYear:{},majorReworksByYear:{},systemLifeByYear:{},cadence:14};
  db.metaStats={};db.metaGames=0;db.regionMetaStats={};db.regionMetaGames={};
}
function applyNote(P,n){
  const c=P.champions[n.c];
  P._revision=(P._revision||0)+1;if(/^item/.test(n.type)||/^rune/.test(n.type))P._systemRevision=(P._systemRevision||0)+1;
  if(n.type==='skill'&&c&&c.skills&&c.skills[n.slot])c.skills[n.slot][n.field]=JSON.parse(JSON.stringify(n.new));
  else if(n.type==='kit'&&c)c.kit[n.key]=n.new!=null?n.new:clamp(c.kit[n.key]+n.d,1,10);
  else if(n.type==='base'&&c)c.base[n.key]=n.new!=null?n.new:Math.round(c.base[n.key]*(1+n.d)*100)/100;
  else if(n.type==='new'){const nc=archChampion(n.def.name,n.def.roles,n.def.arch,n.def.dmg,null,n.def.id||championId(n.def.name));nc.releaseDate=n.def.releaseDate||null;nc.proEligibleDate=n.def.proEligibleDate||null;nc.nameKo=n.def.nameKo||nc.nameKo;nc.naming=n.def.naming?JSON.parse(JSON.stringify(n.def.naming)):null;nc.visual=JSON.parse(JSON.stringify(n.def.visual||generatedChampionVisual(n.def)));P.champions[nc.id]=nc}
  else if(n.type==='rework'&&c&&c.visual){c.visual={...c.visual,revision:(c.visual.revision||0)+(n.scope==='major'?1:0)}}
  else if(n.type==='rule')P.rules[n.key]=n.v;
  else if(n.type==='item'&&P.itemDefs&&P.itemDefs[n.id]){const d=P.itemDefs[n.id];if(n.field==='cost'){const delta=Number(n.new)-Number(d.cost||0);d.cost=n.new;d.recipeCost=Math.max(0,Math.round((Number(d.recipeCost??d.cost)+delta)*100)/100)}else{d.effects=d.effects||{};d.effects[n.field]=n.new}}
  else if(n.type==='item_new'){P.itemDefs=P.itemDefs||{};P.itemDefs[n.def.id]=JSON.parse(JSON.stringify(n.def));P.items=P.items||{};for(const cls of n.def.classes||[]){P.items[cls]=P.items[cls]||[];if(!P.items[cls].includes(n.def.id))P.items[cls].push(n.def.id)}}
  else if(n.type==='item_remove'&&P.itemDefs&&P.itemDefs[n.id])P.itemDefs[n.id].active=false;
  else if(n.type==='rune'&&P.runeDefs&&P.runeDefs[n.id]){const d=P.runeDefs[n.id];d.effects=d.effects||{};d.effects[n.field]=n.new}
  else if(n.type==='rune_new'){P.runeDefs=P.runeDefs||{};P.runeDefs[n.def.id]=JSON.parse(JSON.stringify(n.def));P.runes=P.runes||{};const sid=String(n.def.styleId),slot=Math.max(0,Math.min(3,+n.def.slot||0));if(P.runes[sid]){P.runes[sid].slots=P.runes[sid].slots||[[],[],[],[]];P.runes[sid].slots[slot]=P.runes[sid].slots[slot]||[];if(!P.runes[sid].slots[slot].includes(n.def.id))P.runes[sid].slots[slot].push(n.def.id)}}
  else if(n.type==='rune_remove'&&P.runeDefs&&P.runeDefs[n.id])P.runeDefs[n.id].active=false;
}
function getPatch(db,id){
  if(db.patch&&db.patch.id===id)return db.patch;
  const cached=historicPatchCacheHit(db,id);if(cached)return cached;
  const P=buildPatch();
  if(P.id===id)return rememberHistoricPatch(db,id,P);
  const hist=db.patches.history&&db.patches.history.length?db.patches.history:db.patches.list;
  for(const p of hist){for(const n of p.notes||[])applyNote(P,n);P.id=p.id;if(P.id===id)return rememberHistoricPatch(db,id,P)}
  return rememberHistoricPatch(db,id,P);
}
function championProEligible(db,c,date=db.worldDate){
  if(!c)return false;
  return !c.proEligibleDate||date>=c.proEligibleDate;
}
function championAvailableForContext(db,c,ctx={}){if(!c)return false;if(ctx.practice)return true;if(!championProEligible(db,c))return false;return !ctx.championPool||ctx.championPool.includes(c.id)}

function patchId(db,year){const pt=db.patches;if(pt.y!==year){pt.y=year;pt.n=0}pt.n++;return String(year).slice(2)+'.'+pt.n}
function newPatch(db,date,major,rng){
  const notes=[],P=db.patch,id=patchId(db,+date.slice(0,4)),diag=diagnosePatchMeta(db,major);
  notes.push(...chooseChampionBalanceChanges(db,diag,major,rng));
  notes.push(...maybeChampionRework(db,date,major,rng,diag));
  notes.push(...chooseSystemBalanceChanges(db,diag,major,rng));
  notes.push(...maybeSystemLifecycle(db,date,major,rng,diag));
  const rule=maybeRuleChange(db,major,rng);if(rule)notes.push(rule);
  const nc=maybeNewChampion(db,date,major,rng);if(nc)notes.push(nc);
  notes.forEach(n=>applyNote(P,n));
  adaptPlayerPoolsToPatch(db,notes,!!major);
  P.id=id;
  const rec={id,date,major:!!major,notes,analysis:{sampleGames:diag.sampleGames,championChanges:notes.filter(n=>n.c&&['skill','base','kit'].includes(n.type)).map(n=>n.c),reworks:notes.filter(n=>n.type==='rework').map(n=>({c:n.c,scope:n.scope})),itemChanges:notes.filter(n=>n.type.indexOf('item')===0).map(n=>n.id),runeChanges:notes.filter(n=>n.type.indexOf('rune')===0).map(n=>n.id)}};
  db.patches.list.push(rec);db.patches.history=db.patches.history||[];db.patches.history.push(rec);
  clearPatchCache(db);
  for(const k in db.metaStats){const x=db.metaStats[k];x.p=Math.floor(x.p/3);x.w=Math.floor(x.w/3);x.b=Math.floor(x.b/3)}
  db.metaGames=Math.floor((db.metaGames||0)/3);
  for(const rid in db.regionMetaStats||{})for(const k in db.regionMetaStats[rid]){const x=db.regionMetaStats[rid][k];x.p=Math.floor(x.p/3);x.w=Math.floor(x.w/3);x.b=Math.floor(x.b/3)}
  for(const rid in db.regionMetaGames||{})db.regionMetaGames[rid]=Math.floor(db.regionMetaGames[rid]/3);
  return {id,notes,analysis:rec.analysis};
}
function patchTick(db,date,rng){
  const pt=db.patches;if(!pt.nextDate)pt.nextDate=addDays(date,14);
  while(date>=pt.nextDate){const p=newPatch(db,pt.nextDate,false,rng);news(db,'패치 '+p.id+' 적용 — 챔피언 '+new Set(p.notes.filter(n=>n.c).map(n=>n.c)).size+'명 · 아이템 '+p.notes.filter(n=>n.type.indexOf('item')===0).length+'건 · 룬 '+p.notes.filter(n=>n.type.indexOf('rune')===0).length+'건');const gap=rng.chance(.08)?21:(pt.cadence||14);pt.nextDate=addDays(pt.nextDate,gap)}
}
// 새 시즌: 지난 시즌 패치를 기준점으로 접고(재생은 이번 시즌 경기만 필요) 개막 대형 패치 적용
function seasonPatch(db,date,rng){
  const pt=db.patches;
  pt.prev=pt.list.map(p=>({id:p.id,date:p.date,major:p.major,notes:p.notes}));
  pt.list=[];
  clearPatchCache(db);
  const p=newPatch(db,date,true,rng);pt.nextDate=addDays(date,pt.cadence||14);
  const nc=p.notes.find(n=>n.type==='new');
  news(db,`시즌 개막 패치 ${p.id} — 챔피언 ${p.notes.filter(n=>n.c).length}명 조정${nc?`, 신규 챔피언 ${nc.def.nameKo||nc.def.name} 출시`:''}`);
}
