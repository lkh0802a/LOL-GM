// Adapters for the minute-based match engine. Lane time, camp equivalents,
// ward placement and teleport joins are aggregate proxies, not map geometry.
function matchQuestItems(ps){const items=ps.items||[];return ps.questBoots?[...items,ps.questBoots]:items}
function roleQuestBootUpgrade(patch,id){return Object.values(patch.itemDefs||{}).find(d=>d.active!==false&&d.tags?.includes('Boots')&&d.from?.length===1&&d.from[0]===id&&patch.itemDefs[id]?.tags?.includes('Boots'))?.id||null}
function syncRoleQuestEquipment(ps){
  if(!ps.quest?.completed)return;
  const i=ps.items.findIndex(id=>ps.patchRef.itemDefs[id]?.tags?.includes('Boots'));if(i<0)return;
  if((ps.itemActions||[]).slice(ps.itemActionIndex||0).some(a=>a.consume?.includes(ps.items[i])))return;
  if(ps.role==='ADC'){ps.questBoots=ps.items.splice(i,1)[0];ps.questRevision=(ps.questRevision||0)+1}
  else if(ps.role==='MID'){const upgrade=roleQuestBootUpgrade(ps.patchRef,ps.items[i]);if(upgrade){ps.items[i]=upgrade;ps.questRevision=(ps.questRevision||0)+1}}
}
function matchQuestEvent(st,ps,event){
  if(!ps.quest)return;
  const reward=advanceRoleQuest(ps.quest,{sequence:ps.quest.lastSequence+1,minute:st.t,level:ps.lvl,melee:ps.champ.base.range<=300,...event});
  if(!reward)return;
  ps.questRevision=(ps.questRevision||0)+1;
  const r=reward.rules;
  if(r.goldReward)addGold(ps,r.goldReward);
  if(r.xpReward)addXp(ps,r.xpReward,'quest');
  syncRoleQuestEquipment(ps);
  if(ps.role==='ADC')extendBotQuestBuild(ps);
  if(ps.role==='SUP')upgradeSupportQuestItem(ps);
  log(st,`${pname(st,ps)} ${ROLE_KO[ps.role]} 퀘스트 완료`,{side:ps.side,major:true,kind:'quest'});
}
function extendBotQuestBuild(ps){
  if(ps.questBuildExtended||!ps.itemPlan.some(id=>ps.patchRef.itemDefs[id]?.tags?.includes('Boots')))return;
  ps.questBuildExtended=true;
  const choice=systemChoiceBase(ps.patchRef,ps.champ,ps.role).items.filter(x=>!ps.itemPlan.includes(x.id)&&!ps.patchRef.itemDefs[x.id]?.tags?.includes('Boots')&&!ps.patchRef.itemDefs[x.id]?.from?.includes('3867')).sort((a,b)=>b.fit-a.fit)[0];
  if(!choice)return;
  const extra=itemCraftActions(ps.patchRef,[choice.id]);let threshold=ps.itemActions.at(-1)?.threshold||500;
  for(const action of extra){threshold+=action.cost;action.threshold=threshold}
  ps.itemPlan.push(choice.id);ps.itemActions.push(...extra);
}
function roleQuestIncome(st,ps,cs,recalled){
  if(!ps.quest)return;
  const away=ps.questAwayUntil>=st.t,seconds=st.t<2?0:Math.max(0,(st.t===2?55:60)-(recalled?12:0));
  const r=ps.quest.rules,wasComplete=ps.quest.completed;
  const campEquivalent=ps.role==='JGL'?cs/4:0;
  // Supports consume at most three regenerated charges per minute alongside
  // their live bot partner. Existing passive gold is not counted as quest gold.
  const partner=st.sides[ps.side].ps.find(p=>p.role==='ADC');
  const supportGold=ps.role==='SUP'&&!wasComplete&&partner&&alive(st,partner)?3*(ps.quest.progress>=500?21:18)*(away&&ps.lvl<5?2/3:1):0;
  if(supportGold)addGold(ps,supportGold);
  const offFactor=away?1-.75*(1-ps.quest.progress/r.threshold):1;
  matchQuestEvent(st,ps,{cs:ps.role==='JGL'||ps.role==='SUP'?0:cs*offFactor,laneSeconds:away?0:seconds,awaySeconds:away?seconds:0,jungleStacks:campEquivalent+Math.min(1,campEquivalent),supportGold});
  // Benefits start on subsequent income/events, never retroactively on the
  // CS or monster which completed a quest.
  if(wasComplete){
    if(ps.role==='ADC')addGold(ps,cs*(r.csGold||0));
    if(ps.role==='JGL'){addGold(ps,campEquivalent*(r.monsterGold||0));addXp(ps,campEquivalent*(r.monsterXp||0),'quest')}
    if(ps.role==='SUP')addGold(ps,54);
  }
}
function roleQuestTakedown(st,ps){
  const r=ps.quest?.completed?ps.quest.rules:null;
  if(r?.takedownGold)addGold(ps,r.takedownGold);
  if(r?.takedownXp)addXp(ps,r.takedownXp,'quest');
  matchQuestEvent(st,ps,{takedowns:1});
}
function roleQuestWard(st,ps){
  if(ps.role!=='SUP'||!ps.quest?.completed)return 0;
  const price=ps.quest.rules.controlWardCost,capacity=ps.quest.rules.controlWardCapacity;
  if(!capacity||!Number.isFinite(price)||price<0||ps.gold<price||st.t<(ps.questWardAt||0))return 0;
  ps.gold-=price;ps.questWardSpent=(ps.questWardSpent||0)+price;ps.questWardAt=st.t+Math.max(1,3-capacity);ps.questWards=(ps.questWards||0)+1;
  return .25+st.sides[ps.side].team.tactics.vision_investment/200;
}
function roleQuestObjectiveJoin(st,side,part){
  const top=st.sides[side].ps.find(p=>p.role==='TOP');
  if(!top?.quest?.completed||!alive(st,top)||part.includes(top)||st.t<(top.questTeleportAt||0))return part;
  top.questTeleportAt=st.t+top.quest.rules.teleportCooldown;top.questTeleports=(top.questTeleports||0)+1;
  log(st,`${pname(st,top)} 퀘스트 순간이동으로 합류`,{side,kind:'quest'});
  return [...part,top];
}
function roleQuestSmite(ps){return ps?.quest?.completed?ps.quest.rules.smiteDamage:ps?.quest?.progress>=15?1000:600}

function upgradeSupportQuestItem(ps){
  const reward=Object.values(ps.patchRef.itemDefs||{}).filter(d=>d.active!==false&&d.from?.includes('3867')).sort((a,b)=>systemChoiceScore(ps.champ,b.effects||{},ps.role)-systemChoiceScore(ps.champ,a.effects||{},ps.role))[0];
  const i=ps.items.indexOf('3865');if(!reward||i<0)return;
  ps.items[i]=reward.id;const plan=ps.itemPlan.indexOf('3865');if(plan>=0)ps.itemPlan[plan]=reward.id;
  ps.questSupportItem=reward.id;ps.questRevision=(ps.questRevision||0)+1;
}
