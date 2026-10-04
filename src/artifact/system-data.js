// ===== LOL GM: pinned item/rune source normalization =====
const SYSTEM_EFFECT_KEYS=['offense','defense','sustain','utility','haste','mobility','early','scaling'];
function systemSourceText(v){return String(v||'').toLowerCase()}
function itemTier(raw){
  if(raw.hideFromAll||raw.requiredChampion)return 'special';
  if((raw.tags||[]).includes('Consumable'))return 'consumable';
  const hasUpgrade=(raw.into||[]).some(id=>SYSTEM_SOURCE_SNAPSHOT.items[id]&&!SYSTEM_SOURCE_SNAPSHOT.items[id].hideFromAll);
  if((raw.tags||[]).includes('Boots'))return hasUpgrade?'component':'boots';
  if((raw.gold?.total||0)<=500&&!(raw.from||[]).length)return 'starter';
  if(hasUpgrade)return 'component';
  return 'final';
}
function itemEffectsFromSource(raw){
  const s=raw.stats||{},tags=new Set(raw.tags||[]),txt=systemSourceText((raw.descriptionKo||'')+' '+(raw.plaintextKo||'')),e={offense:0,defense:0,sustain:0,utility:0,haste:0,mobility:0,early:0,scaling:0};
  e.offense+=(s.FlatPhysicalDamageMod||0)/1000+(s.FlatMagicDamageMod||0)/1600+(s.PercentAttackSpeedMod||0)*.1+(s.FlatCritChanceMod||0)*.1;
  e.defense+=(s.FlatHPPoolMod||0)/10000+(s.FlatArmorMod||0)/1000+(s.FlatSpellBlockMod||0)/1000;
  e.sustain+=(s.PercentLifeStealMod||0)*.18+(tags.has('HealthRegen')?.012:0)+(tags.has('SpellVamp')?.012:0);
  e.mobility+=(s.FlatMovementSpeedMod||0)/1000+(s.PercentMovementSpeedMod||0);
  if(tags.has('ArmorPenetration')||tags.has('MagicPenetration')||/관통/.test(txt))e.offense+=.018;
  if(tags.has('AbilityHaste')||tags.has('CooldownReduction')||/스킬 가속|재사용 대기시간/.test(txt))e.haste+=.022;
  if(tags.has('ManaRegen')||tags.has('Mana'))e.utility+=.008;
  if(tags.has('Vision')||tags.has('Stealth')||/와드|시야/.test(txt))e.utility+=.025;
  if(tags.has('Active')||/사용 시|고유.*사용/.test(txt))e.utility+=.01;
  if(/보호막/.test(txt)){e.defense+=.014;e.utility+=.012}
  if(/회복|흡혈|생명력 흡수/.test(txt))e.sustain+=.015;
  if(/이동 속도|돌진/.test(txt))e.mobility+=.012;
  if(/중첩|영구|레벨/.test(txt))e.scaling+=.012;
  const tier=itemTier(raw);if(tier==='starter')e.early+=.025;else if(tier==='component')e.early+=.008;else if(tier==='final'&&(raw.gold?.total||0)>=3000)e.scaling+=.008;
  for(const k of SYSTEM_EFFECT_KEYS)e[k]=Math.round(clamp(e[k],0,.16)*1000)/1000;
  return e;
}
function itemClassesFromSource(raw,e){
  if(itemTier(raw)==='special')return [];
  if((raw.tags||[]).includes('Boots'))return ['fighter','tank','mage','assassin','marksman','enchanter'];
  const t=new Set(raw.tags||[]),score={fighter:0,tank:0,mage:0,assassin:0,marksman:0,enchanter:0};
  if(t.has('Damage')){score.fighter+=3;score.assassin+=3;score.marksman+=3}
  if(t.has('AttackSpeed')){score.marksman+=4;score.fighter+=2;score.assassin+=1}
  if(t.has('CriticalStrike'))score.marksman+=6;
  if(t.has('LifeSteal')){score.marksman+=3;score.fighter+=2;score.assassin+=2}
  if(t.has('ArmorPenetration')){score.assassin+=5;score.fighter+=2;score.marksman+=2}
  if(t.has('SpellDamage')){score.mage+=5;score.enchanter+=2}
  if(t.has('Mana')||t.has('ManaRegen')){score.mage+=2;score.enchanter+=3}
  if(t.has('Health')){score.tank+=4;score.fighter+=3;score.enchanter+=1}
  if(t.has('Armor')||t.has('SpellBlock')){score.tank+=5;score.fighter+=2;score.enchanter+=1}
  if(t.has('HealthRegen')){score.tank+=2;score.fighter+=1;score.enchanter+=1}
  if(t.has('AbilityHaste')||t.has('CooldownReduction')){score.fighter+=1;score.tank+=1;score.mage+=2;score.enchanter+=2}
  if(t.has('Vision'))score.enchanter+=5;
  const max=Math.max(...Object.values(score));if(max<=0)return ['fighter','tank','mage','assassin','marksman','enchanter'];
  return Object.keys(score).filter(k=>score[k]>=Math.max(1,max*.5));
}
// Keep the original normalized stat contribution separate from effect-patch
// deltas. Combat consumes these three stats directly; draft scoring still uses
// the complete existing effects. Older saves derive this split without mutation.
function itemDefenseStatEffect(raw){
  const stats={...(raw.stats||{}),FlatHPPoolMod:0,FlatArmorMod:0,FlatSpellBlockMod:0};
  return itemEffectsFromSource(raw).defense-itemEffectsFromSource({...raw,stats}).defense;
}
function itemAttackStatEffects(raw){
  const withoutAD={...raw,stats:{...(raw.stats||{}),FlatPhysicalDamageMod:0}};
  const withoutAP={...withoutAD,stats:{...withoutAD.stats,FlatMagicDamageMod:0}};
  const remaining=itemEffectsFromSource(withoutAD).offense;
  return {ad:itemEffectsFromSource(raw).offense-remaining,ap:remaining-itemEffectsFromSource(withoutAP).offense};
}
function buildItemSystems(snapshot=SYSTEM_SOURCE_SNAPSHOT){
  const defs={},pool={fighter:[],tank:[],mage:[],assassin:[],marksman:[],enchanter:[]};
  for(const [id,raw] of Object.entries(snapshot.items||{})){const tier=itemTier(raw),effects=itemEffectsFromSource(raw),classes=itemClassesFromSource(raw,effects),d={id,name:raw.nameKo,nameKo:raw.nameKo,descriptionKo:raw.descriptionKo,plaintextKo:raw.plaintextKo,cost:raw.gold?.total||0,recipeCost:raw.gold?.base??raw.gold?.total??0,sell:raw.gold?.sell||0,tags:(raw.tags||[]).slice(),stats:{...(raw.stats||{})},from:(raw.from||[]).slice(),into:(raw.into||[]).slice(),tier,classes,effects,active:true,shopActive:!raw.hideFromAll&&!raw.requiredChampion&&raw.inStore!==false,requiredChampion:raw.requiredChampion||null,source:{provider:snapshot.provider,version:snapshot.version,mapId:snapshot.mapId}};
    d.defenseStatEffect=itemDefenseStatEffect(raw);
    d.attackStatEffects=itemAttackStatEffects(raw);
    defs[id]=d;if(d.shopActive&&['final','boots'].includes(tier))for(const cls of classes)pool[cls].push(id)}
  for(const cls of Object.keys(pool))pool[cls].sort((a,b)=>(defs[a].cost-defs[b].cost)||defs[a].name.localeCompare(defs[b].name));
  return {defs,pool};
}
function runeEffectsFromSource(raw){
  const txt=systemSourceText((raw.shortDescKo||'')+' '+(raw.longDescKo||'')),base=raw.slot===0?.04:.018,e={offense:0,defense:0,sustain:0,utility:0,haste:0,mobility:0,early:0,scaling:0};
  if(/피해|공격력|주문력|공격 속도|치명타|관통/.test(txt))e.offense+=base;
  if(/체력 회복|회복|흡혈/.test(txt))e.sustain+=base*.9;
  if(/보호막|방어력|마법 저항력|최대 체력|피해.*감소/.test(txt))e.defense+=base*.9;
  if(/이동 속도|돌진|도약/.test(txt))e.mobility+=base*.75;
  if(/스킬 가속|재사용 대기시간|궁극기.*가속/.test(txt))e.haste+=base*.8;
  if(/와드|시야|골드|소환사 주문|아이템 가속/.test(txt))e.utility+=base*.75;
  if(/영구|중첩|레벨에 비례|레벨당/.test(txt))e.scaling+=base*.55;
  if(/초반|첫|3초|4초|10초/.test(txt))e.early+=base*.25;
  if(!SYSTEM_EFFECT_KEYS.some(k=>e[k]>0))e.utility=base*.6;
  for(const k of SYSTEM_EFFECT_KEYS)e[k]=Math.round(clamp(e[k],0,.09)*1000)/1000;
  return e;
}
function buildRuneSystems(snapshot=SYSTEM_SOURCE_SNAPSHOT){
  const defs={};for(const [id,raw] of Object.entries(snapshot.runes||{}))defs[id]={id,name:raw.nameKo,nameKo:raw.nameKo,key:raw.key,styleId:raw.styleId,styleKey:raw.styleKey,styleNameKo:raw.styleNameKo,slot:raw.slot,kind:raw.slot===0?'keystone':'minor',shortDescKo:raw.shortDescKo,longDescKo:raw.longDescKo,effects:runeEffectsFromSource(raw),active:true,source:{provider:snapshot.provider,version:snapshot.version}};
  const styles={};for(const s of snapshot.runeStyles||[])styles[s.id]={id:s.id,key:s.key,name:s.nameKo,nameKo:s.nameKo,slots:s.slots.map(x=>x.slice())};
  return {defs,styles};
}
