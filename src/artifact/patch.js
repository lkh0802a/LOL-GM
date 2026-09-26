// ===== 롤FM: 패치 / 메타 =====
// 패치 = 수치 변화(델타)의 기록. 어떤 시점의 패치든 기본 데이터 + 델타로 다시 만들 수 있다
const PATCH_CACHE={};
const RULE_KO={dragonRespawn:'드래곤 재생성(분)',baronBuff:'바론 버프 지속(분)',csGold:'미니언 골드',killGold:'처치 골드',heraldSpawn:'전령 등장(분)',baronSpawn:'바론 등장(분)'};
function initPatches(db){
  db.patches={base:JSON.parse(JSON.stringify(db.patch)),list:[],prev:[],nextDate:null,newIdx:0,y:0,n:0};
  db.metaStats={};db.metaGames=0;
}
function applyNote(P,n){
  const c=P.champions[n.c];
  if(n.type==='kit'&&c)c.kit[n.key]=clamp(c.kit[n.key]+n.d,1,10);
  else if(n.type==='base'&&c)c.base[n.key]=Math.round(c.base[n.key]*(1+n.d)*100)/100;
  else if(n.type==='new'){const c=archChampion(n.def.name,n.def.roles,n.def.arch,n.def.dmg);P.champions[n.def.id||c.id]=c;}
  else if(n.type==='rule')P.rules[n.key]=n.v;
}
function getPatch(db,id){
  if(db.patch&&db.patch.id===id)return db.patch;
  if(PATCH_CACHE[id])return PATCH_CACHE[id];
  const P=JSON.parse(JSON.stringify(db.patches.base));
  for(const p of db.patches.list){if(P.id===id)break;for(const n of p.notes)applyNote(P,n);P.id=p.id}
  return PATCH_CACHE[id]=P;
}
function recordMeta(db,r){
  if(!db.metaStats)return;
  db.metaGames=(db.metaGames||0)+1;
  const st=db.metaStats;
  r.sides.forEach((s,i)=>s.ps.forEach(p=>{const x=st[p.champ.id]||(st[p.champ.id]={p:0,w:0,b:0});x.p++;if(r.winner===i)x.w++}));
  r.draft.bans.flat().forEach(c=>{const x=st[c]||(st[c]={p:0,w:0,b:0});x.b++});
}
function metaTable(db){
  const G=Math.max(1,db.metaGames||0), st=db.metaStats||{};
  return Object.values(db.patch.champions).map(c=>{const s=st[c.id]||{p:0,w:0,b:0};return {c,p:s.p,b:s.b,w:s.w,pres:(s.p+s.b)/G,wr:s.p?s.w/s.p:null}}).sort((a,b)=>b.pres-a.pres);
}
function patchId(db,year){const pt=db.patches;if(pt.y!==year){pt.y=year;pt.n=0}pt.n++;return `${String(year).slice(2)}.${pt.n}`}
// 밸런스 팀의 판단: 대회에서 너무 많이 쓰이고 이기는 챔피언은 하향, 외면받는 챔피언은 상향
function newPatch(db,date,major,rng){
  const notes=[], mt=metaTable(db), P=db.patch, id=patchId(db,+date.slice(0,4));
  const strong=['burst','dps','cc','engage','early','mid','late','sustain','poke'];
  const nerfN=major?rng.int(6,9):rng.int(3,5), buffN=major?rng.int(7,10):rng.int(4,6);
  const nerfs=mt.filter(x=>x.p+x.b>=4&&(x.wr===null||x.wr>=0.48)).slice(0,nerfN+2).sort(()=>rng.next()-0.5).slice(0,nerfN);
  const low=mt.filter(x=>x.pres<0.04).sort(()=>rng.next()-0.5).slice(0,buffN);
  const change=(x,dir,why)=>{
    const c=x.c;
    if(rng.chance(0.6)){const k=strong.filter(s=>dir<0?c.kit[s]>=4:c.kit[s]<=8).sort((a,b)=>dir<0?c.kit[b]-c.kit[a]:c.kit[a]-c.kit[b]).slice(0,3);const key=rng.pick(k.length?k:strong);notes.push({type:'kit',c:c.id,key,d:dir,why})}
    else {const key=rng.pick(['ad','hp','arm','adg','hpg']);notes.push({type:'base',c:c.id,key,d:Math.round(dir*rng.range(0.03,0.07)*1000)/1000,why})}
  };
  nerfs.forEach(x=>change(x,-1,`밴픽률 ${Math.round(x.pres*100)}%${x.wr!==null?` · 승률 ${Math.round(x.wr*100)}%`:''}`));
  low.forEach(x=>change(x,+1,`밴픽률 ${Math.round(x.pres*100)}%로 외면받음`));
  if(rng.chance(major?0.8:0.15)){
    const opts=[['dragonRespawn',[5,6]],['baronBuff',[3,3.5,2.5]],['csGold',[21,22,23,24]],['killGold',[275,300,325]],['heraldSpawn',[14,15,16]],['baronSpawn',[20,22,25]]];
    const [key,vals]=rng.pick(opts), cur=P.rules[key], v=rng.pick(vals.filter(x=>x!==cur)); if(v!==undefined)notes.push({type:'rule',key,v,old:cur,why:'게임 템포 조정'});
  }
  // 신규 챔피언: 시즌 개막·중반 패치에 출시
  if(major){
    let def;
    if(db.patches.newIdx<CHAMP_RELEASES.length){const [name,roles,arch,dmg]=CHAMP_RELEASES[db.patches.newIdx++];def={id:makeChampionId(name),name,roles,arch,dmg}}
    else{let name;do{name=rng.pick(NEWCHAMP_A)+rng.pick(NEWCHAMP_B)}while(Object.values(P.champions).some(c=>c.name===name));const role=rng.pick(ROLES);
      const arch=rng.pick({TOP:['juggernaut','diver','skirmisher','vanguard'],JGL:['diver','assassin','skirmisher','vanguard'],MID:['burst','control','battle','assassin','artillery'],ADC:['marksman','hyper','bully'],SUP:['enchanter','catcher','warden','control']}[role]);
      def={id:makeChampionId(name),name,roles:[role],arch,dmg:['burst','control','battle','artillery','enchanter','specialist'].includes(arch)?'AP':'AD'};db.patches.newIdx++}
    notes.push({type:'new',def,why:'신규 챔피언 출시',c:def.id});
  }
  notes.forEach(n=>applyNote(P,n));
  P.id=id;
  db.patches.list.push({id,date,major:!!major,notes});
  for(const k in PATCH_CACHE)delete PATCH_CACHE[k];
  // 메타 데이터는 새 패치에서 절반만 이어짐 (팀들이 다시 학습)
  for(const k in db.metaStats){const x=db.metaStats[k];x.p=Math.floor(x.p/3);x.w=Math.floor(x.w/3);x.b=Math.floor(x.b/3)}
  db.metaGames=Math.floor((db.metaGames||0)/3);
  return {id,notes};
}
function patchTick(db,date,rng){
  const pt=db.patches; if(!pt.nextDate)pt.nextDate=addDays(date,14);
  while(date>=pt.nextDate){const p=newPatch(db,pt.nextDate,false,rng);news(db,`패치 ${p.id} 적용 — 챔피언 ${p.notes.filter(n=>n.c).length}명 조정`);pt.nextDate=addDays(pt.nextDate,pt.cadence||14)}
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