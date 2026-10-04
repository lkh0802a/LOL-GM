// Actual recipe costs and bank balances; planning never mutates quest state.
function itemCraftInventory(ps,items,a){
  const defs=ps.patchRef?.itemDefs,d=defs?.[a?.id],from=d?.from||[],cost=d?.recipeCost??d?.cost;
  if(!d||d.active===false||d.shopActive===false||!Number.isFinite(cost)||cost<0||a.cost!==cost||!Array.isArray(a.consume)||JSON.stringify(a.consume)!==JSON.stringify(from)||d.requiredChampion&&d.requiredChampion!==ps.champ?.name)return null;
  if(d.tier==='final'&&items.includes(a.id)||d.tags?.includes('Boots')&&(ps.champ?.name==='Cassiopeia'||ps.questBoots))return null;
  const next=items.slice();for(const id of from){const i=next.indexOf(id);if(i<0)return null;next.splice(i,1)}
  next.push(a.id);
  if(d.tags?.includes('Boots')&&next.filter(id=>defs[id]?.tags?.includes('Boots')).length>1)return null;
  return next;
}
function itemCraftSlotResult(ps,items,last){
  if(items.length<=6)return {items,disposed:false};
  // Only the actual starting item may be discarded, once, without a refund.
  // Cheap recipe components can also be classified as "starter" in the source.
  if(!ps.starterDisposed&&(ps.itemPlan?.includes(last.id)||ps.patchRef.itemDefs[last.id]?.tier==='final')&&!(ps.starterItem==='3865'&&ps.quest?.role==='SUP')){
    const i=items.indexOf(ps.starterItem);if(i>=0){const next=items.slice();next.splice(i,1);if(next.length<=6)return {items:next,disposed:true}}
  }
  return null;
}
function commitItemCraftBatch(ps,actions,nextIndex){
  let items=ps.items.slice(),cost=0;
  for(const a of actions){items=itemCraftInventory(ps,items,a);if(!items)return false;cost+=a.cost}
  const slots=itemCraftSlotResult(ps,items,actions.at(-1));
  if(!slots||!Number.isFinite(ps.gold)||ps.gold<cost)return false;
  ps.gold-=cost;ps.itemSpent=(ps.itemSpent||0)+cost;ps.items=slots.items;
  if(slots.disposed)ps.starterDisposed=true;
  if(nextIndex!==undefined)ps.itemActionIndex=nextIndex;
  ps.itemRevision=(ps.itemRevision||0)+1;syncRoleQuestEquipment(ps);return true;
}
function applyItemCraftAction(ps,a){return commitItemCraftBatch(ps,[a])}
function advanceItemPurchases(ps){
  const actions=ps.itemActions||[];
  while(ps.itemActionIndex<actions.length){
    const start=ps.itemActionIndex;let items=ps.items.slice(),cost=0,end=start;
    // Wait for an affordable whole combine when components exceed six slots.
    for(;end<actions.length;end++){
      const a=actions[end];cost+=a.cost;if(!Number.isFinite(cost)||cost>ps.gold)return;
      items=itemCraftInventory(ps,items,a);if(!items)return;
      if(itemCraftSlotResult(ps,items,a))break;
    }
    if(end===actions.length||!commitItemCraftBatch(ps,actions.slice(start,end+1),end+1))return;
  }
}
function matchGoldLedger(ps){return {earned:ps.goldEarned,items:ps.itemSpent||0,wards:ps.questWardSpent||0,held:ps.gold}}
