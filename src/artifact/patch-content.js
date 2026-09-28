// ===== LOL GM: patch content lifecycle (items, runes, reworks, releases) =====
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
