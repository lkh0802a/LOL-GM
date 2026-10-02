// ===== LOL GM: automated item/rune selection and champion system meta =====
const SYSTEM_META_CACHE=new WeakMap();
const SYSTEM_CHOICE_CACHE=new WeakMap();
function championSystemMetaProfile(patch,c){
  if(!patch||!patch.itemDefs||!patch.runeDefs)return {power:0,roles:{}};
  const cache=revisionBucket(SYSTEM_META_CACHE,patch,draftPatchRevisionKey(patch));if(cache.has(c.id))return cache.get(c.id);
  const roles=(c.roles&&c.roles.length?c.roles:['MID']),vals=[],byRole={};
  for(const role of roles){
    const pseudo={id:'meta:'+c.id+':'+role},items=selectItemBuild(patch,c,pseudo,role),runes=selectRunePage(patch,c,pseudo,role);
    const ie=systemEffects(patch.itemDefs,items),re=systemEffects(patch.runeDefs,runes),all={};
    for(const k of SYSTEM_EFFECT_KEYS)all[k]=(ie[k]||0)+(re[k]||0);
    const fit=systemChoiceScore(c,all,role),cost=items.length?avg(items.map(id=>patch.itemDefs[id]?.cost||3000)):3000,tempo=clamp((3300-cost)/2600,-.18,.22);
    byRole[role]={fit,cost,items,runes,power:fit*.085+tempo*.025};vals.push(byRole[role].power);
  }
  const result={power:avg(vals),roles:byRole};cache.set(c.id,result);return result;
}
function systemEffects(defs,ids){
  const out=Object.fromEntries(SYSTEM_EFFECT_KEYS.map(k=>[k,0]));
  for(const id of ids||[]){const d=defs&&defs[id];if(!d||d.active===false)continue;for(const k in out)out[k]+=Number(d.effects&&d.effects[k])||0}
  return out;
}
function systemChoiceScore(c,e,role){
  const k=c.kit||{},front=['fighter','tank'].includes(c.cls),support=role==='SUP'||c.cls==='enchanter';
  return (e.offense||0)*(.8+(k.burst+k.dps)/16)+(e.defense||0)*(front?1.35:.75)+(e.sustain||0)*(.7+(k.sustain||5)/8)+(e.utility||0)*(support?1.5:.7)+(e.haste||0)*(.8+(k.cc+k.poke)/18)+(e.mobility||0)*(.75+(k.mobility||5)/8)+(e.early||0)*(.65+(k.early||5)/8)+(e.scaling||0)*(.65+(k.late||5)/8);
}
function systemChoiceBase(patch,c,role){
  const cache=revisionBucket(SYSTEM_CHOICE_CACHE,patch,draftPatchRevisionKey(patch)),key=c.id+'|'+role;if(cache.has(key))return cache.get(key);
  const items=(patch.items&&patch.items[c.cls]||[]).filter(id=>patch.itemDefs&&patch.itemDefs[id]&&patch.itemDefs[id].active!==false&&patch.itemDefs[id].shopActive!==false).map(id=>{const d=patch.itemDefs[id];return {id,tier:d.tier,fit:systemChoiceScore(c,d.effects||{},role),cost:d.cost||3000}});
  const roleFit=d=>{const t=new Set(d.tags||[]);if(role==='JGL')return t.has('Jungle')?.12:-.1;if(t.has('Jungle'))return -.18;if(role==='SUP'&&(t.has('GoldPer')||t.has('Vision')))return .08;return 0};
  const starters=Object.values(patch.itemDefs||{}).filter(d=>d.active!==false&&d.shopActive!==false&&d.tier==='starter'&&(!d.requiredChampion||d.requiredChampion===c.name)).map(d=>({id:d.id,fit:systemChoiceScore(c,d.effects||{},role),roleFit:roleFit(d),cost:d.cost||450}));
  const runes={};for(const d of Object.values(patch.runeDefs||{}))if(d.active!==false)runes[d.id]=systemChoiceScore(c,d.effects||{},role);
  const out={items,starters,runes};cache.set(key,out);return out;
}
function selectItemBuild(patch,c,p,role){
  const ranked=systemChoiceBase(patch,c,role).items.map(x=>{const noise=((hashStr((p&&p.id||'')+'|'+c.id+'|'+role+'|'+x.id)%1000)/1000-.5)*.012;return {id:x.id,tier:x.tier,s:x.fit+noise-x.cost/140000+(x.tier==='boots'?.006:0)}}).sort((x,y)=>y.s-x.s);
  const out=[];let boots=false;for(const x of ranked){if(x.tier==='boots'&&boots)continue;out.push(x.id);if(x.tier==='boots')boots=true;if(out.length>=6)break}return out;
}
function selectStarterItem(patch,c,p,role){
  const rows=systemChoiceBase(patch,c,role).starters.map(d=>({id:d.id,s:d.fit+d.roleFit+((hashStr((p&&p.id||'')+'|start|'+d.id)%1000)/1000-.5)*.008-d.cost/40000})).sort((a,b)=>b.s-a.s);
  return rows[0]?.id||null;
}
function itemCraftActions(patch,finalBuild){
  const defs=patch.itemDefs||{},actions=[];
  const craft=id=>{const d=defs[id];if(!d||d.active===false||d.shopActive===false)return;for(const from of d.from||[])craft(from);actions.push({id,cost:Math.max(0,Number(d.recipeCost??d.cost??0)),consume:(d.from||[]).slice(),tier:d.tier})};
  for(const id of finalBuild||[])craft(id);
  return actions;
}
function itemPurchasePlan(patch,finalBuild,starterId){
  const actions=itemCraftActions(patch,finalBuild);let spent=starterId&&patch.itemDefs?.[starterId]?patch.itemDefs[starterId].cost||0:0;
  for(const a of actions){spent+=a.cost;a.threshold=500+spent}
  return actions;
}
function runeChoiceScore(patch,c,p,role,id){
  const d=patch.runeDefs&&patch.runeDefs[id];if(!d||d.active===false)return -Infinity;
  const noise=((hashStr((p&&p.id||'')+'|'+c.id+'|'+role+'|rune|'+id)%1000)/1000-.5)*.01;
  return (systemChoiceBase(patch,c,role).runes[id]??systemChoiceScore(c,d.effects||{},role))+noise;
}
function selectRunePage(patch,c,p,role){
  const styles=Object.values(patch.runes||{}).filter(s=>s&&Array.isArray(s.slots)&&s.slots.length>=4);
  if(styles.length<2)return [];
  const bestIn=(style,slot)=>((style.slots&&style.slots[slot])||[]).filter(id=>patch.runeDefs?.[id]?.active!==false).map(id=>({id,s:runeChoiceScore(patch,c,p,role,id),slot})).sort((x,y)=>y.s-x.s)[0]||null;
  const ranked=styles.map(style=>{const picks=[0,1,2,3].map(slot=>bestIn(style,slot));return {style,picks,score:picks.every(Boolean)?picks.reduce((z,x)=>z+x.s,0):-Infinity}}).filter(x=>Number.isFinite(x.score)).sort((x,y)=>y.score-x.score);
  const primary=ranked[0];if(!primary)return [];
  // Primary ranking already computed each style's best pick in all four slots.
  // Reuse slots 1–3 without repeating scoring/hash/sort work for the secondary.
  const secondary=ranked.slice(1).map(x=>{const picks=x.picks.slice(1).filter(Boolean).sort((u,v)=>v.s-u.s).slice(0,2);return {style:x.style,picks,score:picks.length===2?picks.reduce((z,y)=>z+y.s,0):-Infinity}}).filter(x=>Number.isFinite(x.score)).sort((x,y)=>y.score-x.score)[0];
  return [...primary.picks.map(x=>x.id),...(secondary?secondary.picks.map(x=>x.id):[])];
}
function applyItemCraftAction(ps,a){
  for(const id of a.consume||[]){const i=ps.items.indexOf(id);if(i>=0)ps.items.splice(i,1)}
  ps.items.push(a.id);
  if(ps.items.length>6){const i=ps.items.findIndex(id=>['starter','consumable'].includes(ps.patchRef?.itemDefs?.[id]?.tier));if(i>=0)ps.items.splice(i,1)}
}
function advanceItemPurchases(ps){
  const actions=ps.itemActions||[];
  while(ps.itemActionIndex<actions.length&&ps.goldEarned>=actions[ps.itemActionIndex].threshold){
    const start=ps.itemActionIndex,preview={items:ps.items.slice(),patchRef:ps.patchRef};let end=start;
    // With a full inventory, wait until enough gold can combine the remaining
    // components atomically. Intermediate ingredients never occupy extra slots.
    for(;end<actions.length&&ps.goldEarned>=actions[end].threshold;end++){
      applyItemCraftAction(preview,actions[end]);if(preview.items.length<=6)break;
    }
    if(end>=actions.length||ps.goldEarned<actions[end].threshold)break;
    for(;ps.itemActionIndex<=end;ps.itemActionIndex++)applyItemCraftAction(ps,actions[ps.itemActionIndex]);
  }
}
