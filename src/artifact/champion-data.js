// ===== LOL GM: champion identity, visuals, source normalization =====
function championId(name){
  const slug=String(name).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  return 'champ_'+(slug||Math.abs(hashStr(String(name))));
}
function championByName(db,name){return Object.values(db.patch.champions).find(c=>c.name===name)||null}
function championLabel(db,id){const c=db&&db.patch&&db.patch.champions?db.patch.champions[id]:null;return c?(c.nameKo||c.name):String(id||'')}
function championDisplayName(c){return c?(c.nameKo||c.name):''}
const CHAMPION_VISUAL_VERSION=1;
const CHAMPION_VISUAL_THEMES=['arcane','celestial','infernal','verdant','storm','shadow','void','frost','solar','hex'];
const CHAMPION_VISUAL_ORNAMENTS=['hood','crown','horns','mask','halo','crest','braids','visor'];
function generatedChampionVisual(def){
  const id=String(def?.id||championId(def?.name||'champion')),seed=Math.abs(hashStr(id+'|'+(def?.arch||'')+'|portrait-v'+CHAMPION_VISUAL_VERSION));
  const cls=def?.cls||({juggernaut:'fighter',diver:'fighter',skirmisher:'fighter',vanguard:'tank',warden:'tank',burst:'mage',control:'mage',battle:'mage',artillery:'mage',hyper:'marksman',bully:'marksman',catcher:'enchanter'}[def?.arch]||'fighter');
  const silhouette={tank:'heavy',fighter:'plated',mage:'robed',assassin:'hooded',marksman:'ranged',enchanter:'ornate'}[cls]||'plated';
  const weapon={tank:'shield',fighter:seed%2?'blade':'spear',mage:seed%2?'staff':'orb',assassin:'blades',marksman:seed%2?'bow':'rifle',enchanter:seed%2?'staff':'orb'}[cls]||'blade';
  const pool=(def?.dmg==='AP'?['arcane','celestial','verdant','void','frost','hex']:['infernal','storm','shadow','solar','frost','hex']),theme=pool[(seed>>>3)%pool.length];
  return {version:CHAMPION_VISUAL_VERSION,seed,revision:0,theme,silhouette,weapon,ornament:CHAMPION_VISUAL_ORNAMENTS[(seed>>>7)%CHAMPION_VISUAL_ORNAMENTS.length],pose:['front','threeQuarter','profile'][(seed>>>11)%3],aura:CHAMPION_VISUAL_THEMES[(seed>>>15)%CHAMPION_VISUAL_THEMES.length]};
}
const DETAIL_BASE_KEYS=['resource','resourceg','resourceRegen','mr','mrg','asg'];
const CHAMPION_SOURCE_PATCH='16.19.1';
function cleanChampionSourceText(v){return String(v||'').replace(/<br\s*\/?>/gi,' ').replace(/<[^>]*>/g,'').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&#39;/g,"'").replace(/&quot;/gi,'"').replace(/\s+/g,' ').trim()}
function sourceSkillControl(raw){
  const ko=cleanChampionSourceText(raw?.descriptionKo||''),en=cleanChampionSourceText(raw?.descriptionEn||'');
  const koPatterns=[['stun',/기절시/],['root',/속박(?:하|시)|발을 묶/],['airborne',/공중(?:으로|에) 띄|공중으로 날려/],['displacement',/적(?:을|들을) 밀어|뒤로 밀어|중앙으로 끌려/],['sleep',/잠들게/],['taunt',/도발(?:하|시)/],['fear',/공포에 (?:빠|질)|공포를 (?:주|느끼게)/],['silence',/침묵시/],['slow',/둔화(?:시|됩|시키)|(?:적|대상)[^.]*속도를 늦추|이동 속도를 (?:감소시|줄이거나|훔)/],['suppression',/제압(?:하|시)/],['disarm',/무장 해제(?:하|시)/]];
  const enPatterns=[['stun',/\bstuns?\b|\bstunned\b|\bstunning\b/i],['root',/\broots?\b|\brooted\b|\bsnares?\b|\bsnared\b|\bimmobiliz(?:e|es|ed|ing)\b/i],['airborne',/\bairborne\b|\bknocks?\s+(?:them\s+)?up\b/i],['displacement',/\b(?:knocks?|pushes?)\s+(?:them\s+)?back\b|\bpulls?\s+(?:them\s+)?(?:in|toward|towards)\b|\bdisplaces?\b/i],['sleep',/\bsleeps?\b|\basleep\b/i],['taunt',/\btaunts?\b|\btaunted\b/i],['fear',/\bfears?\b|\bfeared\b|\bflee\b/i],['silence',/\bsilences?\b|\bsilenced\b/i],['slow',/\bslows?\b|\bslowed\b|\breduces?\s+(?:their\s+)?movement speed\b/i],['suppression',/\bsuppress(?:es|ed|ing)?\b/i],['disarm',/\bdisarms?\b|\bdisarmed\b/i]];
  const koClauses=ko.split(/[.!?;]/).filter(clause=>!/기절시키지|속박하지|둔화시키지|제압하지|무장 해제하지/.test(clause)&&(!/(?:미니언|몬스터)(?:에게|를|들을)/.test(clause)||/챔피언/.test(clause)));
  const enClauses=en.split(/[.!?;]/).filter(clause=>
    !/\b(?:cannot|can't)\b[^,]{0,90}\b(?:stun|root|snare|immobil|airborne|knock|sleep|taunt|fear|silence|slow|suppress|disarm)/i.test(clause)&&
    !/(?<!not )\b(?:immune to|unaffected by)\b[^,]{0,90}\b(?:stun|root|snare|immobil|airborne|knock|sleep|taunt|fear|silence|slow|suppress|disarm)/i.test(clause)&&
    (!/\b(?:minions?|monsters?)\b/i.test(clause)||/\bchampions?\b/i.test(clause)));
  const types=[...new Set([
    ...koPatterns.filter(([,pattern])=>koClauses.some(clause=>pattern.test(clause))).map(([type])=>type),
    ...enPatterns.filter(([,pattern])=>enClauses.some(clause=>pattern.test(clause))).map(([type])=>type)
  ])];
  return types.length?{version:1,types,provider:'Riot Data Dragon description',aggregate:true}:null;
}
function normalizeSourceSkill(slot,raw,fallback){
  if(!raw)return fallback;
  const cds=(raw.cooldown||[]).filter(Number.isFinite), cd=cds.length?cds[0]:fallback.cooldown;
  const numeric=raw.numeric||{};return {...fallback,slot,name:raw.nameKo||raw.nameEn||fallback.name||slot,sourceName:raw.nameEn||'',sourceDescription:cleanChampionSourceText(raw.descriptionKo||raw.descriptionEn||''),cooldown:cd,baseDamage:numeric.baseDamage||fallback.baseDamage||[],ratios:numeric.ratios||fallback.ratios||{},cost:(raw.cost||[]).filter(Number.isFinite),range:(raw.range||[]).filter(Number.isFinite),rangeDisplay:raw.rangeDisplay||null,sourceEffect:raw.effectBurn||[],sourceVars:raw.vars||[],cc:numeric.cc||fallback.cc||null,sourceControl:sourceSkillControl(raw),heal:numeric.heal||fallback.heal||null,shield:numeric.shield||fallback.shield||null,charges:numeric.charges||fallback.charges||null,recast:!!numeric.recast,source:{version:CHAMPION_SOURCE_PATCH,provider:raw.provider||'Riot Data Dragon'}};
}
function mergeChampionSource(c,raw){
  if(!raw)return c;
  const b=raw.base||{}, map=['hp','hpg','ad','adg','arm','armg','mr','mrg','as','asg','range','ms','resource','resourceg','resourceRegen'];
  for(const k of map)if(Number.isFinite(b[k]))c.base[k]=b[k];
  c.riotKey=raw.riotKey??c.riotKey;c.riotAlias=raw.alias||c.riotAlias;c.nameKo=raw.nameKo||c.nameKo;c.resourceType=raw.resourceType||c.resourceType;
  c=enrichChampion(c);
  if(raw.passive)c.skills.P={...c.skills.P,name:raw.passive.nameKo||raw.passive.nameEn||'P',sourceName:raw.passive.nameEn||'',sourceDescription:cleanChampionSourceText(raw.passive.descriptionKo||raw.passive.descriptionEn||''),source:{version:CHAMPION_SOURCE_PATCH,provider:'Riot Data Dragon'}};
  for(const sp of raw.spells||[])if(c.skills[sp.slot])c.skills[sp.slot]=normalizeSourceSkill(sp.slot,sp,c.skills[sp.slot]);
  c.baseSource='riot_ddragon';c.detailSource=raw.spells?.length?'riot_ddragon':'hybrid_ddragon';c.detailVersion=CHAMPION_SOURCE_PATCH;
  return c;
}
function applyChampionSource(champions,snapshot){
  if(!snapshot||snapshot.version!==CHAMPION_SOURCE_PATCH)return {matched:0,total:Object.keys(champions).length};
  const raws=Object.values(snapshot.champions||{}),norm=x=>String(x||'').replace(/[^a-z0-9]/gi,'').toLowerCase(),byAlias=new Map();for(const x of raws){byAlias.set(norm(x.alias),x);byAlias.set(norm(x.nameEn),x)}
  let matched=0,localized=0;
  for(const c of Object.values(champions)){const alias=String(c.riotAlias||c.name||'').replace(/[^a-z0-9]/gi,'').toLowerCase();const raw=byAlias.get(alias);if(raw){mergeChampionSource(c,raw);matched++;if(raw.passive?.descriptionKo&&(raw.spells||[]).length===4&&raw.spells.every(s=>s.descriptionKo))localized++}}
  return {matched,localized,total:Object.keys(champions).length};
}
function enrichChampion(c){
  const b=c.base,h=Math.abs(hashStr(c.id||c.name)),manaFree=['fighter','assassin'].includes(c.cls)&&((h%5)===0);
  if(b.mr===undefined)b.mr=c.cls==='marksman'?30:c.cls==='mage'||c.cls==='enchanter'?30:32;
  if(b.mrg===undefined)b.mrg=c.cls==='marksman'?1.3:2.05;
  if(b.asg===undefined)b.asg=Math.round((1.5+(h%31)/10)*100)/100;
  if(b.resource===undefined)b.resource=manaFree?0:Math.round((c.cls==='mage'||c.cls==='enchanter'?430:330)+(h%121));
  if(b.resourceg===undefined)b.resourceg=b.resource?Math.round((25+(h%31))*10)/10:0;
  if(b.resourceRegen===undefined)b.resourceRegen=b.resource?Math.round((6+(h%45)/10)*10)/10:0;
  if(!c.skills){
    c.detailSource='generated_fallback';
    const k=c.kit,physical=c.dmg==='AD',damageType=physical?'physical':'magic';
    c.skills={
      P:{slot:'P',kind:'passive',effects:['identity'],power:Math.round((k.sustain+k.mobility+k.dps)/3*10)/10},
      Q:{slot:'Q',kind:'basic',damageType,effects:[k.poke>=7?'poke':'damage'],power:k.burst,cooldown:Math.max(3,13-k.early)},
      W:{slot:'W',kind:'basic',damageType,effects:[k.sustain>=6?'sustain':k.peel>=6?'shield':'utility'],power:Math.max(k.sustain,k.peel,k.disengage),cooldown:Math.max(5,16-k.mid)},
      E:{slot:'E',kind:'basic',damageType,effects:[k.cc>=6?'cc':k.mobility>=6?'mobility':'damage'],power:Math.max(k.cc,k.mobility,k.engage),cooldown:Math.max(5,17-k.mid)},
      R:{slot:'R',kind:'ultimate',damageType,effects:[k.engage>=7?'engage':k.burst>=7?'burst':'teamfight'],power:Math.max(k.burst,k.cc,k.engage,k.dps),cooldown:Math.max(45,130-k.late*6)}
    };
  }
  if(!c.detailSource)c.detailSource='curated';
  return c;
}
