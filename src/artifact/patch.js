// ===== LOL GM: 패치 / 메타 =====
// 패치 = 수치 변화(델타)의 기록. 어떤 시점의 패치든 기본 데이터 + 델타로 다시 만들 수 있다
const PATCH_CACHE=new WeakMap();
const META_HISTORY_CACHE=new WeakMap();
const EMPTY_META_HISTORY=[];
function patchCache(db){let c=PATCH_CACHE.get(db);if(!c){c=new Map();PATCH_CACHE.set(db,c)}return c}
function clearPatchCache(db){PATCH_CACHE.delete(db)}
function metaHistoryIndex(db){
  const rows=db.metaHistory||EMPTY_META_HISTORY;let c=META_HISTORY_CACHE.get(db);
  if(c&&c.rows===rows&&c.length===rows.length)return c;
  c={rows,length:rows.length,byPatch:new Map(),byComp:new Map(),byRegion:new Map(),filtered:new Map(),patchSorted:new Map()};
  const add=(map,key,row)=>{if(key==null)return;let a=map.get(key);if(!a){a=[];map.set(key,a)}a.push(row)};
  for(const row of rows){add(c.byPatch,row.patch,row);add(c.byComp,row.comp,row);for(const region of row.regions||[])add(c.byRegion,region,row)}
  META_HISTORY_CACHE.set(db,c);return c;
}
function metaFilterKey(filter){
  return ['region','patch','comp','season','year','split','league','scope','from','to','position'].map(k=>String(filter[k]??'')).join('|');
}
function metaRowsFiltered(db,filter={}){
  const c=metaHistoryIndex(db),key=metaFilterKey(filter);if(c.filtered.has(key))return c.filtered.get(key);
  const choices=[c.rows];if(filter.patch)choices.push(c.byPatch.get(filter.patch)||EMPTY_META_HISTORY);if(filter.comp)choices.push(c.byComp.get(filter.comp)||EMPTY_META_HISTORY);if(filter.region)choices.push(c.byRegion.get(filter.region)||EMPTY_META_HISTORY);
  const base=choices.reduce((a,b)=>b.length<a.length?b:a),rows=base.filter(r=>(!filter.region||(r.regions||[]).includes(filter.region))&&(!filter.patch||r.patch===filter.patch)&&(!filter.comp||r.comp===filter.comp)&&(!filter.season||r.season===filter.season)&&(!filter.year||r.year===+filter.year)&&(!filter.split||String(r.split)===String(filter.split))&&(!filter.league||r.league===filter.league)&&(!filter.scope||(filter.scope==='INTL'?r.international:!r.international))&&(!filter.from||r.date>=filter.from)&&(!filter.to||r.date<=filter.to));
  c.filtered.set(key,rows);return rows;
}
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
  const cache=patchCache(db);if(cache.has(id))return cache.get(id);
  const P=buildPatch();
  if(P.id===id){cache.set(id,P);return P}
  const hist=db.patches.history&&db.patches.history.length?db.patches.history:db.patches.list;
  for(const p of hist){for(const n of p.notes||[])applyNote(P,n);P.id=p.id;if(P.id===id){cache.set(id,P);return P}}
  cache.set(id,P);return P;
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
  db.metaHistory.push({date:r.date||db.worldDate,patch:r.patch||db.patch.id,comp:r.comp||r.competitionId||null,season:mc.season||null,year:mc.year||+(r.date||db.worldDate).slice(0,4),split:mc.split||null,stage:mc.stage||null,league:mc.league||null,international:!!mc.international,regions,sides:r.sides.map((s,i)=>({team:s.team?.id||null,region:s.team?.region||null,win:r.winner===i,picks:s.ps.map(x=>({champ:x.champ.id,role:x.role||null,player:x.p?.id||null,items:(x.items||[]).slice(),runes:(x.runes||[]).slice()}))})),bans:r.draft.bans.flat()});
  const international=regions.length>1;
  for(const side of r.sides){const t=side.team;if(!t)continue;t.metaKnowledge=t.metaKnowledge||{};t.metaCounter=t.metaCounter||{};for(const os of r.sides){if(os===side)continue;for(const pick of os.ps){const cid=pick.champ.id,success=r.winner===r.sides.indexOf(os),novel=((db.regionMetaStats?.[t.region]||{})[cid]?.p||0)<3,analysis=.65+staffProfile(t).analysis/140,learn=(success?.055:.018)*(novel?1.6:1)*(international?1.35:1)*analysis;t.metaKnowledge[cid]=clamp((t.metaKnowledge[cid]||0)+learn,0,1);if(r.winner!==r.sides.indexOf(side))t.metaCounter[cid]=clamp((t.metaCounter[cid]||0)+.02*analysis,0,1)}}}
}
function metaTableFiltered(db,filter={}){
  const rows=metaRowsFiltered(db,filter);
  if(!rows.length)return metaTable(db,filter.region||null);
  const st={},add=(cid,key)=>{const x=st[cid]||(st[cid]={p:0,w:0,b:0});x[key]++};
  for(const r of rows){for(const side of r.sides){if(filter.region&&side.region!==filter.region)continue;for(const pick of side.picks){const p=typeof pick==='string'?{champ:pick}:pick;if(filter.position&&p.role!==filter.position)continue;add(p.champ,'p');if(side.win)add(p.champ,'w')}}for(const cid of r.bans)add(cid,'b')}
  const G=Math.max(1,rows.length);return Object.values(db.patch.champions).map(c=>{const s=st[c.id]||{p:0,w:0,b:0};return {c,p:s.p,b:s.b,w:s.w,pres:(s.p+s.b)/G,wr:s.p?s.w/s.p:null,sample:G,eligible:championProEligible(db,c)}}).sort((a,b)=>b.pres-a.pres);
}

function championMetaInsights(db,cid,filter={}){
  const players={},teams={},matchups={},recent=[],rows=metaRowsFiltered(db,filter);
  for(const r of rows)for(const side of r.sides||[]){if(filter.region&&side.region!==filter.region)continue;const picks=(side.picks||[]).map(p=>typeof p==='string'?{champ:p}:p),me=picks.find(p=>p.champ===cid&&(!filter.position||p.role===filter.position));if(!me)continue;if(me.player){const x=players[me.player]||(players[me.player]={g:0,w:0});x.g++;if(side.win)x.w++}if(side.team){const x=teams[side.team]||(teams[side.team]={g:0,w:0});x.g++;if(side.win)x.w++}const opp=(r.sides||[]).find(x=>x!==side);if(opp&&me.role){const op=(opp.picks||[]).map(p=>typeof p==='string'?{champ:p}:p).find(p=>p.role===me.role);if(op){const x=matchups[op.champ]||(matchups[op.champ]={g:0,w:0});x.g++;if(side.win)x.w++}}recent.push({date:r.date,win:side.win})}
  const top=o=>Object.entries(o).sort((a,b)=>b[1].g-a[1].g||b[1].w-a[1].w).slice(0,5);return {players:top(players),teams:top(teams),matchups:top(matchups),recent:recent.sort((a,b)=>a.date.localeCompare(b.date)).slice(-10)};
}
function metaTable(db,regionId=null){
  const G=Math.max(1,regionId?(db.regionMetaGames||{})[regionId]||0:db.metaGames||0), st=regionId?((db.regionMetaStats||{})[regionId]||{}):(db.metaStats||{});
  return Object.values(db.patch.champions).map(c=>{const s=st[c.id]||{p:0,w:0,b:0};return {c,p:s.p,b:s.b,w:s.w,pres:(s.p+s.b)/G,wr:s.p?s.w/s.p:null,sample:G,eligible:championProEligible(db,c)}}).sort((a,b)=>b.pres-a.pres);
}
function patchId(db,year){const pt=db.patches;if(pt.y!==year){pt.y=year;pt.n=0}pt.n++;return String(year).slice(2)+'.'+pt.n}
const PATCH_SIZE_KO={micro:'미세',small:'소규모',medium:'중간',large:'대규모'};
const PATCH_SIZE_PROFILE={
  micro:{stat:[.005,.012],cd:[.25,.5],range:[10,20],cost:[5,10],mod:[.01,.018]},
  small:{stat:[.012,.022],cd:[.5,1],range:[15,30],cost:[5,15],mod:[.018,.03]},
  medium:{stat:[.022,.04],cd:[1,1.75],range:[25,50],cost:[10,20],mod:[.03,.05]},
  large:{stat:[.04,.065],cd:[1.5,2.5],range:[40,75],cost:[15,30],mod:[.05,.08]}
};
function patchHistory(db){return db.patches.history&&db.patches.history.length?db.patches.history:db.patches.list||[]}
function patchEvidenceRows(db){const c=metaHistoryIndex(db),id=db.patch.id;if(c.patchSorted.has(id))return c.patchSorted.get(id);const rows=(c.byPatch.get(id)||EMPTY_META_HISTORY).slice().sort((a,b)=>(a.date||'').localeCompare(b.date||''));c.patchSorted.set(id,rows);return rows}
function patchTeamPower(db,tid){
  const t=db.teams&&db.teams[tid];if(!t)return 0;
  const vals=(t.roster||[]).map(id=>db.players&&db.players[id]).filter(Boolean).map(p=>typeof playerOvr==='function'?playerOvr(p):50);
  return vals.length?avg(vals):Number(t.base||t.reputation||50);
}
function patchEvidenceContext(db,rows){
  const tids=[...new Set(rows.flatMap(r=>(r.sides||[]).map(s=>s.team).filter(Boolean)))],powers=tids.map(t=>patchTeamPower(db,t)).sort((a,b)=>a-b);
  return {topCut:powers.length?powers[Math.floor((powers.length-1)*.75)]:Infinity,regionCount:Math.max(1,Object.keys(db.regions||{}).length)};
}
function patchChampionEvidence(db,cid,rows,ctx){
  rows=rows||patchEvidenceRows(db);ctx=ctx||patchEvidenceContext(db,rows);
  let p=0,w=0,b=0,intl=0,top=0,recentP=0,recentB=0,oldP=0,oldB=0;const pos={},regions={},teams={},players={},partners={};
  const cut=Math.floor(rows.length/2);
  rows.forEach((r,ri)=>{
    const recent=ri>=cut;if((r.bans||[]).includes(cid)){b++;if(recent)recentB++;else oldB++}
    for(const side of r.sides||[]){const picks=(side.picks||[]).map(x=>typeof x==='string'?{champ:x}:x),me=picks.find(x=>x.champ===cid);if(!me)continue;
      p++;if(side.win)w++;if(recent)recentP++;else oldP++;if(r.international)intl++;if(me.role)pos[me.role]=(pos[me.role]||0)+1;if(side.region)regions[side.region]=(regions[side.region]||0)+1;
      if(side.team){teams[side.team]=(teams[side.team]||0)+1;if(patchTeamPower(db,side.team)>=ctx.topCut)top++}if(me.player)players[me.player]=(players[me.player]||0)+1;
      for(const x of picks)if(x.champ!==cid)partners[x.champ]=(partners[x.champ]||0)+1;
    }
  });
  const games=Math.max(1,rows.length),pres=(p+b)/games,wr=p?(w+2)/(p+4):.5,recentGames=Math.max(1,rows.length-cut),oldGames=Math.max(1,cut),recentPres=(recentP+recentB)/recentGames,oldPres=(oldP+oldB)/oldGames,trend=recentPres-oldPres;
  const maxShare=o=>{const v=Object.values(o);return p&&v.length?Math.max(...v)/p:0},playerConc=maxShare(players),teamConc=maxShare(teams),comboConc=maxShare(partners),flex=Object.keys(pos).length,regionSpread=Object.keys(regions).length/ctx.regionCount,intlShare=p?intl/p:0,topShare=p?top/p:0;
  const confidence=clamp((p+b)/(p+b+12)*Math.min(1,rows.length/24),0,1);
  const nerfSignal=pres*1.02+Math.max(0,wr-.51)*2.4*confidence+Math.max(0,trend)*.8+Math.max(0,flex-1)*.055+intlShare*.07+regionSpread*.05-Math.max(0,playerConc-.45)*.2-Math.max(0,teamConc-.5)*.12-Math.max(0,comboConc-.65)*.08;
  const buffSignal=Math.max(0,.065-pres)*3.3*Math.min(1,rows.length/18)+Math.max(0,.47-wr)*1.7*confidence+Math.max(0,-trend)*.38+(p===0&&rows.length>=16?.12:0);
  let dir=0,signal=0;if(rows.length>=8&&nerfSignal>=.48&&nerfSignal-buffSignal>=.16){dir=-1;signal=nerfSignal}else if(rows.length>=12&&buffSignal>=.2&&buffSignal-nerfSignal*.38>=.07){dir=1;signal=buffSignal}
  const diagnosis=dir<0?(flex>=2&&pres>.25?'플렉스와 프로 우선순위 과다':wr>=.545&&confidence>.25?'실전 성능 과다':topShare>.65?'상위권 중심 우선순위 과다':'밴픽 압력 과다'):(dir>0?(pres<.025?'저사용으로 전략적 가치 부족':'낮은 실전 성능과 선택률'):'관찰');
  const why='표본 '+rows.length+'경기 · 밴픽 '+Math.round(pres*100)+'% · 승률 '+Math.round(wr*100)+'% · 최근 추세 '+(trend>=0?'+':'')+Math.round(trend*100)+'%p'+(flex>1?' · '+flex+'포지션 플렉스':'')+(intlShare>.2?' · 국제전 비중 '+Math.round(intlShare*100)+'%':'')+(playerConc>.5?' · 특정 선수 의존 '+Math.round(playerConc*100)+'%':'')+(teamConc>.55?' · 특정 팀 의존 '+Math.round(teamConc*100)+'%':'');
  return {c:db.patch.champions[cid],cid,games:rows.length,p,b,w,pres,wr,trend,confidence,flex,regionSpread,intlShare,topShare,playerConc,teamConc,comboConc,nerfSignal,buffSignal,dir,signal,diagnosis,why};
}
function patchSizeForSignal(signal,major){
  let s=signal>=.9?'large':signal>=.68?'medium':signal>=.42?'small':'micro';
  if(major&&s==='micro')s='small';return s;
}
function diagnosePatchMeta(db,major=false){
  const rows=patchEvidenceRows(db),ctx=patchEvidenceContext(db,rows),champions=Object.keys(db.patch.champions).map(id=>patchChampionEvidence(db,id,rows,ctx));
  return {sampleGames:rows.length,rows,ctx,champions,major:!!major};
}
function recentDirectionCount(db,cid,dir,lookback=2){
  return patchHistory(db).slice(-lookback).reduce((z,p)=>z+(p.notes||[]).some(n=>n.c===cid&&n.dir===dir&&['skill','base','kit'].includes(n.type))?1:0,0);
}
function lastChampionChange(db,cid){
  const h=patchHistory(db);for(let i=h.length-1;i>=0;i--)for(let j=(h[i].notes||[]).length-1;j>=0;j--){const n=h[i].notes[j];if(n.c===cid&&n.dir&&['skill','base','kit'].includes(n.type))return {patch:h[i],note:n}}return null;
}
function blendPatchValue(cur,target,f){
  if(Array.isArray(cur)&&Array.isArray(target))return cur.map((x,i)=>Number.isFinite(+x)&&Number.isFinite(+target[i])?Math.round((+x+(+target[i]-+x)*f)*100)/100:x);
  return Number.isFinite(+cur)&&Number.isFinite(+target)?Math.round((+cur+(+target-+cur)*f)*100)/100:cur;
}
function partialChampionRollback(db,diag,rng){
  const hit=lastChampionChange(db,diag.cid);if(!hit||hit.note.dir===diag.dir||hit.note.old==null)return null;const n=hit.note,c=diag.c,f=rng.range(.35,.65),out={...n,dir:diag.dir,size:'micro',category:'rollback',why:'직전 '+hit.patch.id+' 조정의 과도한 반응을 부분 롤백 · '+diag.why,rollbackOf:hit.patch.id};
  if(n.type==='skill'&&c.skills&&c.skills[n.slot]){out.old=JSON.parse(JSON.stringify(c.skills[n.slot][n.field]));out.new=blendPatchValue(out.old,n.old,f)}
  else if(n.type==='base'){out.old=c.base[n.key];out.new=blendPatchValue(out.old,n.old,f)}
  else if(n.type==='kit'){out.old=c.kit[n.key];out.new=Math.round(blendPatchValue(out.old,n.old,f)*10)/10;out.d=out.new-out.old}
  if(JSON.stringify(out.old)===JSON.stringify(out.new))return null;return out;
}
function shiftedArray(old,delta,min=0,max=9999){
  return old.map(x=>{const n=Number(x);if(!Number.isFinite(n)||n<=0)return x;return Math.round(clamp(n+delta,min,max)*100)/100});
}
function championBalanceNote(db,diag,dir,size,rng,category='balance'){
  const c=diag.c,p=PATCH_SIZE_PROFILE[size]||PATCH_SIZE_PROFILE.small,skills=['Q','W','E','R'].map(k=>c.skills&&c.skills[k]).filter(Boolean);
  const rangeSkills=skills.filter(s=>(s.range||[]).some(x=>Number.isFinite(+x)&&+x>=100&&+x<3000)),costSkills=skills.filter(s=>(s.cost||[]).some(x=>Number.isFinite(+x)&&+x>0)),cdSkills=skills.filter(s=>Number.isFinite(+s.cooldown)&&+s.cooldown>1);
  let families=dir<0?['cooldown','damage','base','range','utility','cost']:['damage','cooldown','range','base','cost','utility','mobility'];
  if(diag.flex>=2||diag.pres>.45)families=['range','cooldown','utility','mobility','base','damage','cost'];
  if(diag.wr>=.55&&diag.confidence>.25)families=['damage','base','cooldown','sustain','range','cost'];
  for(let tries=0;tries<10;tries++){
    const fam=rng.pick(families),why=diag.diagnosis+' · '+diag.why;
    if(fam==='cooldown'&&cdSkills.length){const sk=rng.pick(cdSkills),old=+sk.cooldown,step=rng.range(p.cd[0],p.cd[1]),nv=Math.max(1,Math.round((old+(dir<0?step:-step))*4)/4);if(nv!==old)return {type:'skill',c:c.id,slot:sk.slot,field:'cooldown',old,new:nv,dir,size,category,why}}
    if(fam==='range'&&rangeSkills.length){const sk=rng.pick(rangeSkills),old=JSON.parse(JSON.stringify(sk.range)),step=Math.round(rng.range(p.range[0],p.range[1])),nv=old.map(x=>Number.isFinite(+x)&&+x>=100&&+x<3000?Math.max(100,+x+(dir<0?-step:step)):x);if(JSON.stringify(nv)!==JSON.stringify(old))return {type:'skill',c:c.id,slot:sk.slot,field:'range',old,new:nv,dir,size,category,why}}
    if(fam==='cost'&&costSkills.length){const sk=rng.pick(costSkills),old=JSON.parse(JSON.stringify(sk.cost)),step=Math.round(rng.range(p.cost[0],p.cost[1])/5)*5,nv=shiftedArray(old,dir<0?step:-step,0,250);if(JSON.stringify(nv)!==JSON.stringify(old))return {type:'skill',c:c.id,slot:sk.slot,field:'cost',old,new:nv,dir,size,category,why}}
    if(['damage','utility','sustain','mobility'].includes(fam)&&skills.length){const sk=rng.pick(skills),field=fam==='damage'?'damageMod':fam==='utility'?'utilityMod':fam==='sustain'?(rng.chance(.5)?'healMod':'shieldMod'):'mobilityMod',old=Number(sk[field]??1),step=rng.range(p.mod[0],p.mod[1]),nv=Math.round(clamp(old+(dir>0?step:-step),.72,1.3)*1000)/1000;if(nv!==old)return {type:'skill',c:c.id,slot:sk.slot,field,old,new:nv,dir,size,category,why}}
    if(fam==='base'){const keys=['hp','ad','arm','mr','hpg','adg','armg','mrg','ms','range','resource','resourceRegen'].filter(k=>Number.isFinite(c.base[k])&&(k!=='resource'||c.base[k]>0)),key=rng.pick(keys);if(!key)continue;const old=c.base[key];let nv;if(key==='ms')nv=Math.round(clamp(old+(dir>0?rng.int(2,4):-rng.int(2,4)),300,380));else if(key==='range')nv=Math.round(clamp(old+(dir>0?rng.pick([10,15,25]):-rng.pick([10,15,25])),100,700));else{const step=rng.range(p.stat[0],p.stat[1]);nv=Math.round(old*(1+(dir>0?step:-step))*100)/100}if(nv!==old)return {type:'base',c:c.id,key,old,new:nv,d:old?nv/old-1:0,dir,size,category,why}}
  }
  return null;
}
function chooseChampionBalanceChanges(db,diag,major,rng){
  const nerfN=major?rng.int(6,10):rng.int(2,4),buffN=major?rng.int(7,11):rng.int(3,5),out=[];
  const take=(dir,n)=>diag.champions.filter(x=>x.dir===dir).sort((a,b)=>b.signal-a.signal).slice(0,n*3);
  for(const dir of [-1,1]){const limit=dir<0?nerfN:buffN;let count=0;for(const d of take(dir,limit)){if(count>=limit)break;
      const last=lastChampionChange(db,d.cid);if(last&&last.note.dir!==dir){const rb=partialChampionRollback(db,d,rng);if(rb){out.push(rb);count++;continue}}
      const same=recentDirectionCount(db,d.cid,dir,2);if(same&&d.signal<.88)continue;let size=patchSizeForSignal(d.signal,major);if(same&&['medium','large'].includes(size))size='small';
      const n=championBalanceNote(db,d,dir,size,rng);if(n){out.push(n);count++}
    }}
  return out;
}
function systemUsageEvidence(db,kind,id,rows){
  rows=rows||patchEvidenceRows(db);const def=kind==='item'?db.patch.itemDefs&&db.patch.itemDefs[id]:db.patch.runeDefs&&db.patch.runeDefs[id];if(!def||def.active===false)return {id,uses:0,eligible:0,usage:0,wr:.5,confidence:0};
  if(kind==='item'&&!['final','boots'].includes(def.tier))return {id,uses:0,eligible:0,usage:0,wr:.5,confidence:0};
  const classes=kind==='item'?(def.classes||[]):null;let uses=0,wins=0,eligible=0;
  for(const r of rows)for(const side of r.sides||[])for(const raw of side.picks||[]){const p=typeof raw==='string'?{champ:raw}:raw,c=db.patch.champions[p.champ];if(!c||(classes&&!classes.includes(c.cls)))continue;eligible++;const arr=kind==='item'?(p.items||[]):p.runes||[];if(arr.includes(id)){uses++;if(side.win)wins++}}
  const usage=eligible?uses/eligible:0,wr=uses?(wins+2)/(uses+4):.5,confidence=clamp(uses/(uses+10)*Math.min(1,eligible/30),0,1);
  return {id,uses,wins,eligible,usage,wr,confidence,nerf:Math.max(0,usage-.55)*.8+Math.max(0,wr-.53)*1.5*confidence,buff:Math.max(0,.16-usage)*.55+Math.max(0,.47-wr)*1.1*confidence};
}
function lastSystemChange(db,kind,id){
  const h=patchHistory(db);for(let i=h.length-1;i>=0;i--)for(let j=(h[i].notes||[]).length-1;j>=0;j--){const n=h[i].notes[j];if(n.type===kind&&n.id===id&&n.dir)return {patch:h[i],note:n}}return null;
}
function systemBalanceNote(db,kind,ev,dir,size,rng){
  const defs=kind==='item'?db.patch.itemDefs:db.patch.runeDefs,d=defs[ev.id],p=PATCH_SIZE_PROFILE[size]||PATCH_SIZE_PROFILE.small,keys=Object.keys(d.effects||{}).filter(k=>Number.isFinite(d.effects[k]));
  if(kind==='item'&&rng.chance(.35)){const old=d.cost,step={micro:50,small:100,medium:150,large:200}[size]||100,nv=clamp(old+(dir<0?step:-step),Math.min(500,old),Math.max(4500,old));if(nv!==old)return {type:'item',id:ev.id,field:'cost',old,new:nv,dir,size,why:'아이템 사용률 '+Math.round(ev.usage*100)+'% · 승률 '+Math.round(ev.wr*100)+'%'}}
  const field=keys.length?rng.pick(keys):(kind==='item'?'offense':'utility'),old=Number(d.effects[field]||0),step=rng.range(p.mod[0],p.mod[1])*.6,nv=Math.round(clamp(old+(dir>0?step:-step),0,.14)*1000)/1000;if(nv===old)return null;
  return {type:kind,id:ev.id,field,old,new:nv,dir,size,why:(kind==='item'?'아이템':'룬')+' 사용률 '+Math.round(ev.usage*100)+'% · 승률 '+Math.round(ev.wr*100)+'%'};
}
function chooseSystemBalanceChanges(db,diag,major,rng){
  const rows=diag.rows,out=[];for(const kind of ['item','rune']){const defs=kind==='item'?db.patch.itemDefs||{}:db.patch.runeDefs||{},evs=Object.keys(defs).map(id=>systemUsageEvidence(db,kind,id,rows)).filter(x=>x.eligible>=12),nerfs=evs.filter(x=>x.nerf>=.055).sort((a,b)=>b.nerf-a.nerf),buffs=evs.filter(x=>x.buff>=.055).sort((a,b)=>b.buff-a.buff),limit=major?2:1;
      for(const [dir,list] of [[-1,nerfs],[1,buffs]]){let n=0;for(const ev of list){if(n>=limit)break;const last=lastSystemChange(db,kind,ev.id);if(last&&last.note.dir===dir&&patchHistory(db).slice(-2).includes(last.patch))continue;const sig=dir<0?ev.nerf:ev.buff,size=patchSizeForSignal(sig*4,major),note=systemBalanceNote(db,kind,ev,dir,size,rng);if(note){out.push(note);n++}}}
    }return out;
}
function generatedItemDef(db,rng,year){
  const cls=rng.pick(Object.keys(db.patch.items||{})),idx=(db.patches.systemLifeByYear[year]&&db.patches.systemLifeByYear[year].itemNew||0)+1,id='item_gen_'+year+'_'+idx;
  const keys=cls==='tank'?['defense','sustain','utility','haste']:cls==='enchanter'?['utility','sustain','haste','defense']:cls==='marksman'?['offense','mobility','scaling','sustain']:['offense','haste','mobility','sustain','defense'],effects={};
  for(const k of keys.slice(0,3))effects[k]=Math.round(rng.range(.018,.055)*1000)/1000;
  const nm=generateItemContentName(db,rng,{cls,effects}),cost=Math.round(rng.range(cls==='enchanter'?2200:2700,cls==='enchanter'?2800:3500)/50)*50;
  return {id,name:nm.name,nameKo:nm.nameKo,naming:nm.naming,cost,recipeCost:cost,effects,classes:[cls],tier:'final',shopActive:true,from:[],into:[],tags:[],active:true,createdYear:year};
}
function generatedRuneDef(db,rng,year){
  const styles=Object.values(db.patch.runes||{}),style=rng.pick(styles),slot=rng.chance(.28)?0:rng.int(1,3),idx=(db.patches.systemLifeByYear[year]&&db.patches.systemLifeByYear[year].runeNew||0)+1,id='rune_gen_'+year+'_'+idx,kind=slot===0?'keystone':'minor';
  const keys=['offense','defense','sustain','utility','haste','mobility','early','scaling'].sort(()=>rng.next()-.5),effects={};for(const k of keys.slice(0,kind==='keystone'?2:1))effects[k]=Math.round(rng.range(kind==='keystone'?.025:.012,kind==='keystone'?.06:.035)*1000)/1000;
  const nm=generateRuneContentName(db,rng,{style,kind,effects});
  return {id,name:nm.name,nameKo:nm.nameKo,naming:nm.naming,key:id,kind,styleId:style.id,styleKey:style.key,styleNameKo:style.nameKo||style.name,slot,effects,active:true,createdYear:year};
}
function canRemoveItem(db,id){
  const d=db.patch.itemDefs?.[id];if(!d||d.active===false||!['final','boots'].includes(d.tier))return false;
  for(const cls of d.classes||[]){const active=(db.patch.items?.[cls]||[]).filter(x=>x!==id&&db.patch.itemDefs?.[x]?.active!==false&&db.patch.itemDefs?.[x]?.shopActive!==false);if(active.length<8)return false}
  return true;
}
function canRemoveRune(db,id){
  const d=db.patch.runeDefs?.[id];if(!d||d.active===false)return false;const style=db.patch.runes?.[String(d.styleId)],slot=style?.slots?.[d.slot]||[];
  return slot.filter(x=>x!==id&&db.patch.runeDefs?.[x]?.active!==false).length>=1;
}
function maybeSystemLifecycle(db,date,major,rng,diag){
  if(!major)return [];const year=+date.slice(0,4),st=db.patches.systemLifeByYear[year]||(db.patches.systemLifeByYear[year]={itemNew:0,itemRemove:0,runeNew:0,runeRemove:0}),out=[];
  if(st.itemNew<2&&rng.chance(.24)){const def=generatedItemDef(db,rng,year);out.push({type:'item_new',id:def.id,def,why:'새로운 빌드 선택지 추가'});st.itemNew++}
  if(st.runeNew<1&&rng.chance(.12)){const def=generatedRuneDef(db,rng,year);out.push({type:'rune_new',id:def.id,def,why:'새로운 룬 선택지 추가'});st.runeNew++}
  if(diag.sampleGames>=20&&st.itemRemove<1&&rng.chance(.16)){const ev=Object.keys(db.patch.itemDefs||{}).map(id=>systemUsageEvidence(db,'item',id,diag.rows)).filter(x=>x.eligible>=15&&x.usage<.035&&db.patch.itemDefs[x.id].active!==false&&canRemoveItem(db,x.id)).sort((a,b)=>a.usage-b.usage)[0];if(ev){out.push({type:'item_remove',id:ev.id,oldActive:true,why:'장기간 낮은 사용률 '+Math.round(ev.usage*100)+'% · 아이템 체계 정리'});st.itemRemove++}}
  if(diag.sampleGames>=20&&st.runeRemove<1&&rng.chance(.07)){const ev=Object.keys(db.patch.runeDefs||{}).map(id=>systemUsageEvidence(db,'rune',id,diag.rows)).filter(x=>x.eligible>=15&&x.usage<.025&&db.patch.runeDefs[x.id].active!==false&&canRemoveRune(db,x.id)).sort((a,b)=>a.usage-b.usage)[0];if(ev){out.push({type:'rune_remove',id:ev.id,oldActive:true,why:'장기간 낮은 사용률 '+Math.round(ev.usage*100)+'% · 룬 체계 정리'});st.runeRemove++}}
  return out;
}
function maybeChampionRework(db,date,major,rng,diag){
  if(!major)return [];const year=+date.slice(0,4),out=[],mid=db.patches.reworksByYear[year]||0,big=db.patches.majorReworksByYear[year]||0,doBig=big<1&&rng.chance(.018),doMid=!doBig&&mid<2&&rng.chance(.16);if(!doBig&&!doMid)return out;
  const scope=doBig?'major':'mid',cand=diag.champions.filter(x=>x.c&&!x.c.releaseDate).sort((a,b)=>a.pres-b.pres||a.wr-b.wr)[0]||rng.pick(diag.champions.filter(x=>x.c&&!x.c.releaseDate));if(!cand)return out;
  out.push({type:'rework',c:cand.cid,scope,stableId:cand.cid,why:(scope==='major'?'대규모 챔피언 업데이트':'미드스코프 업데이트')+' · 낮은 선택률과 역할 정체성 재정비'});
  const c=cand.c,kitKeys=['burst','dps','cc','engage','disengage','peel','poke','waveclear','mobility','sustain','early','mid','late'],kN=scope==='major'?4:2;
  for(const key of kitKeys.sort(()=>rng.next()-.5).slice(0,kN)){const old=c.kit[key],dir=rng.chance(.68)?1:-1,step=scope==='major'?rng.pick([1,1,2]):1,nv=clamp(old+dir*step,1,10);if(nv!==old)out.push({type:'kit',c:c.id,key,old,new:nv,d:nv-old,dir:Math.sign(nv-old),size:scope==='major'?'large':'medium',category:'rework',why:out[0].why})}
  for(let i=0;i<(scope==='major'?4:2);i++){const d={...cand,diagnosis:out[0].why},n=championBalanceNote(db,d,i%3===2?-1:1,scope==='major'?'large':'medium',rng,'rework');if(n)out.push(n)}
  if(doBig)db.patches.majorReworksByYear[year]=big+1;else db.patches.reworksByYear[year]=mid+1;return out;
}
function maybeRuleChange(db,major,rng){
  if(!rng.chance(major?.32:.025))return null;const opts=[['dragonRespawn',[5,6]],['baronBuff',[2.5,3,3.5]],['csGold',[21,22,23,24]],['killGold',[275,300,325]],['heraldSpawn',[14,15,16]],['baronSpawn',[20,22,25]]],pick=rng.pick(opts),key=pick[0],vals=pick[1],cur=db.patch.rules[key],v=rng.pick(vals.filter(x=>x!==cur));return v===undefined?null:{type:'rule',key,v,old:cur,why:'게임 템포와 오브젝트 가치 조정'};
}
function releaseTarget(db,year,rng){db.patches.releaseTargets=db.patches.releaseTargets||{};if(!db.patches.releaseTargets[year])db.patches.releaseTargets[year]=rng.int(2,3);return db.patches.releaseTargets[year]}
function maybeNewChampion(db,date,major,rng){
  const year=+date.slice(0,4),released=(db.patches.releasesByYear&&db.patches.releasesByYear[year])||0,target=releaseTarget(db,year,rng);if(released>=target)return null;
  const month=+date.slice(5,7),remaining=target-released,opps=Math.max(1,Math.ceil((13-month)*2.1)),chance=clamp(remaining/opps+(major?.16:0)+(month>=10?.08:0),.04,month>=11?.65:.36);if(!rng.chance(chance))return null;
  let def;if(db.patches.newIdx<CHAMP_RELEASES.length){const x=CHAMP_RELEASES[db.patches.newIdx++];def={id:championId(x[0]),name:x[0],roles:x[1],arch:x[2],dmg:x[3]}}
  else{const role=rng.pick(ROLES),arch=rng.pick({TOP:['juggernaut','diver','skirmisher','vanguard'],JGL:['diver','assassin','skirmisher','vanguard'],MID:['burst','control','battle','assassin','artillery'],ADC:['marksman','hyper','bully'],SUP:['enchanter','catcher','warden','control']}[role]),dmg=['burst','control','battle','artillery','enchanter','specialist'].includes(arch)?'AP':'AD',nm=generateChampionContentName(db,rng,{role,arch,dmg}),id=championId(nm.name);def={id,name:nm.name,nameKo:nm.nameKo,naming:nm.naming,roles:[role],arch,dmg};db.patches.newIdx++}
  def.releaseDate=date;def.proEligibleDate=addDays(date,14);def.visual=generatedChampionVisual(def);db.patches.releasesByYear[year]=released+1;return {type:'new',def,c:def.id,why:'신규 챔피언 출시 · 프로 대회 14일 사용 제한'};
}
function newPatch(db,date,major,rng){
  const notes=[],P=db.patch,id=patchId(db,+date.slice(0,4)),diag=diagnosePatchMeta(db,major);
  notes.push(...chooseChampionBalanceChanges(db,diag,major,rng));
  notes.push(...maybeChampionRework(db,date,major,rng,diag));
  notes.push(...chooseSystemBalanceChanges(db,diag,major,rng));
  notes.push(...maybeSystemLifecycle(db,date,major,rng,diag));
  const rule=maybeRuleChange(db,major,rng);if(rule)notes.push(rule);
  const nc=maybeNewChampion(db,date,major,rng);if(nc)notes.push(nc);
  notes.forEach(n=>applyNote(P,n));
  if(typeof adaptPlayerPoolsToPatch==='function')adaptPlayerPoolsToPatch(db,notes,!!major);
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