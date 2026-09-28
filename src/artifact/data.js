// ===== LOL GM: 데이터 모델 / 기본 월드 =====
const ROLES = ['TOP','JGL','MID','ADC','SUP'];
const ROLE_KO = {TOP:'탑',JGL:'정글',MID:'미드',ADC:'원딜',SUP:'서폿'};
const LANES = ['top','mid','bot'];
const LANE_ROLES = {top:['TOP'], mid:['MID'], bot:['ADC','SUP']};
const LANE_KO = {top:'탑', mid:'미드', bot:'바텀'};

const ATTR_GROUPS = {
  mechanical:['reaction','precision','skillshot','dodging','combo_execution','kiting','spacing','animation_control','smite_execution'],
  laning:['trading','csing','wave_control','pressure','all_in','harass','recall_timing','gank_avoidance','lane_adaptation'],
  combat:['positioning','target_selection','engage','disengage','peeling','flanking','burst_execution','extended_fight','teamfight_awareness'],
  macro:['map_awareness','rotation','tempo','objective_setup','resource_allocation','sidelane','vision_understanding','crossmap_decision'],
  mental:['decision_making','anticipation','concentration','composure','consistency','adaptability','communication','shotcalling','creativity','pressure_handling','champion_learning','meta_adaptation']
};
const GROUP_KO = {mechanical:'피지컬', laning:'라인전', combat:'교전', macro:'운영', mental:'멘탈/판단'};
const ATTR_KO = {
  reaction:'반응속도', precision:'정교함', skillshot:'논타겟', dodging:'회피', combo_execution:'콤보', kiting:'카이팅', spacing:'거리조절', animation_control:'캔슬', smite_execution:'강타',
  trading:'딜교환', csing:'CS', wave_control:'웨이브 관리', pressure:'라인 압박', all_in:'올인', harass:'견제', recall_timing:'귀환 타이밍', gank_avoidance:'갱 회피', lane_adaptation:'라인 적응',
  positioning:'포지셔닝', target_selection:'타겟 선정', engage:'이니시', disengage:'디스인게이지', peeling:'보호', flanking:'측면 진입', burst_execution:'폭딜 실행', extended_fight:'장기전', teamfight_awareness:'한타 판단',
  map_awareness:'맵 인지', rotation:'합류', tempo:'템포', objective_setup:'오브젝트 준비', resource_allocation:'자원 분배', sidelane:'사이드 운영', vision_understanding:'시야 이해', crossmap_decision:'크로스맵',
  decision_making:'판단력', anticipation:'예측', concentration:'집중력', composure:'침착함', consistency:'기복 없음', adaptability:'적응력', communication:'소통', shotcalling:'오더', creativity:'창의성', pressure_handling:'압박 대처', champion_learning:'챔피언 학습', meta_adaptation:'메타 적응'
};
const TENDENCIES = ['aggression','risk_taking','roaming','resource_demand','teamplay','trading_frequency','engage_preference','objective_preference','split_preference'];
const TEND_KO = {aggression:'공격성', risk_taking:'위험 감수', roaming:'로밍', resource_demand:'자원 요구', teamplay:'팀플레이', trading_frequency:'딜교 빈도', engage_preference:'이니시 선호', objective_preference:'오브젝트 선호', split_preference:'스플릿 선호'};
const ROLE_GROUP_WEIGHTS={
  TOP:{mechanical:.22,laning:.28,combat:.22,macro:.17,mental:.11},
  JGL:{mechanical:.14,laning:.07,combat:.20,macro:.36,mental:.23},
  MID:{mechanical:.24,laning:.25,combat:.22,macro:.18,mental:.11},
  ADC:{mechanical:.32,laning:.23,combat:.29,macro:.09,mental:.07},
  SUP:{mechanical:.10,laning:.09,combat:.24,macro:.34,mental:.23}
};
const ROLE_KEY_ATTRS={
  TOP:['trading','wave_control','all_in','positioning','sidelane','decision_making'],
  JGL:['smite_execution','map_awareness','rotation','tempo','objective_setup','crossmap_decision','decision_making'],
  MID:['precision','trading','wave_control','positioning','roaming','rotation','decision_making'],
  ADC:['reaction','kiting','spacing','csing','positioning','target_selection','extended_fight'],
  SUP:['engage','disengage','peeling','map_awareness','objective_setup','vision_understanding','shotcalling']
};
const SECONDARY_ROLE_OPTIONS={TOP:['MID','JGL'],JGL:['SUP','TOP'],MID:['TOP','ADC'],ADC:['MID','SUP'],SUP:['JGL','ADC']};
const CLASS_KO = {fighter:'전사', tank:'탱커', mage:'마법사', assassin:'암살자', marksman:'원거리 딜러', enchanter:'서포터'};
const KIT_KEYS = ['burst','dps','cc','engage','disengage','peel','poke','waveclear','mobility','sustain','early','mid','late','difficulty'];
const KIT_KO = {burst:'폭딜', dps:'지속딜', cc:'CC', engage:'이니시', disengage:'받아치기', peel:'보호', poke:'포킹', waveclear:'라인클리어', mobility:'기동성', sustain:'유지력', early:'초반', mid:'중반', late:'후반', difficulty:'난이도'};
const BASE_KEYS = ['hp','hpg','ad','adg','arm','armg','as','range','ms'];

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
function ensureChampionVisual(c){if(!c)return null;if(!c.visual)c.visual=generatedChampionVisual(c);return c.visual}
const DETAIL_BASE_KEYS=['resource','resourceg','resourceRegen','mr','mrg','asg'];
const CHAMPION_SOURCE_PATCH='16.19.1';
function cleanChampionSourceText(v){return String(v||'').replace(/<br\s*\/?>/gi,' ').replace(/<[^>]*>/g,'').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&#39;/g,"'").replace(/&quot;/gi,'"').replace(/\s+/g,' ').trim()}
function normalizeSourceSkill(slot,raw,fallback){
  if(!raw)return fallback;
  const cds=(raw.cooldown||[]).filter(Number.isFinite), cd=cds.length?cds[0]:fallback.cooldown;
  const numeric=raw.numeric||{};return {...fallback,slot,name:raw.nameKo||raw.nameEn||fallback.name||slot,sourceName:raw.nameEn||'',sourceDescription:cleanChampionSourceText(raw.descriptionKo||raw.descriptionEn||''),cooldown:cd,baseDamage:numeric.baseDamage||fallback.baseDamage||[],ratios:numeric.ratios||fallback.ratios||{},cost:(raw.cost||[]).filter(Number.isFinite),range:(raw.range||[]).filter(Number.isFinite),sourceEffect:raw.effectBurn||[],sourceVars:raw.vars||[],cc:numeric.cc||fallback.cc||null,heal:numeric.heal||fallback.heal||null,shield:numeric.shield||fallback.shield||null,charges:numeric.charges||fallback.charges||null,recast:!!numeric.recast,source:{version:CHAMPION_SOURCE_PATCH,provider:raw.provider||'Riot Data Dragon'}};
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

// base: [hp,hp성장,공격력,공격력성장,방어,방어성장,공속,사거리,이속]
// kit : [burst,dps,cc,engage,disengage,peel,poke,waveclear,mobility,sustain,early,mid,late,difficulty]
const CHAMP_RAW = [
  ['Aatrox',['TOP'],'fighter','AD',[650,114,60,5,38,4.8,.651,175,345],[6,7,4,5,2,1,3,6,5,8,8,7,5,6]],
  ['Ornn',['TOP'],'tank','AP',[660,109,69,3.5,33,5.2,.625,175,335],[4,3,8,8,5,6,2,5,3,4,5,7,8,4]],
  ['Jax',['TOP'],'fighter','AD',[665,103,68,4.25,36,4.2,.638,125,350],[5,8,5,5,3,1,1,5,6,4,6,7,9,5]],
  ["K'Sante",['TOP'],'tank','AD',[625,120,64,3.5,36,5.2,.688,150,330],[4,4,8,6,6,6,2,4,5,5,6,7,7,8]],
  ['Rumble',['TOP'],'mage','AP',[655,105,61,3.2,36,4.7,.644,125,345],[7,7,5,6,3,1,4,8,3,3,8,8,5,6]],
  ['Lee Sin',['JGL'],'fighter','AD',[645,108,69,3.7,36,4.9,.651,125,345],[7,5,6,7,4,3,2,4,9,5,9,7,4,9]],
  ['Sejuani',['JGL'],'tank','AP',[630,114,66,4,34,5.45,.688,150,340],[4,3,9,8,5,5,1,4,4,4,6,8,7,4]],
  ['Viego',['JGL'],'assassin','AD',[630,109,57,3.5,34,4.6,.658,200,345],[7,7,4,4,3,1,1,4,7,6,6,8,7,7]],
  ['Vi',['JGL'],'fighter','AD',[655,99,63,3.5,30,4.25,.644,125,340],[7,5,7,7,2,2,1,4,6,4,7,8,5,5]],
  ['Maokai',['JGL','SUP'],'tank','AP',[665,109,64,3.3,35,5.2,.8,125,335],[4,3,8,7,6,6,3,5,3,6,6,8,6,3]],
  ['Azir',['MID'],'mage','AP',[575,119,56,3.5,25,4.7,.625,525,335],[5,9,5,5,6,5,6,7,5,3,4,7,9,9]],
  ['Ahri',['MID'],'mage','AP',[590,104,53,3,21,4.2,.668,550,330],[8,5,6,5,4,2,5,7,8,4,6,8,6,5]],
  ['Syndra',['MID'],'mage','AP',[563,104,54,2.9,25,4.6,.658,550,330],[9,5,6,3,5,4,7,8,2,2,7,8,7,6]],
  ['Orianna',['MID'],'mage','AP',[585,110,44,3,20,4.2,.658,525,325],[7,6,7,7,5,6,6,8,3,3,6,7,8,6]],
  ['Taliyah',['MID','JGL'],'mage','AP',[550,104,58,3.3,18,4.7,.658,525,330],[7,6,6,4,5,4,6,9,6,3,7,8,6,6]],
  ["Kai'Sa",['ADC'],'marksman','AD',[640,102,59,2.6,25,4.2,.644,525,335],[7,8,1,3,3,1,3,6,7,3,5,7,8,6]],
  ['Varus',['ADC'],'marksman','AD',[600,105,59,3.4,24,4.6,.658,575,330],[7,7,5,3,3,3,8,6,2,3,6,8,7,5]],
  ['Jinx',['ADC'],'marksman','AD',[630,105,59,3.15,26,4.7,.625,525,325],[5,10,3,1,4,2,5,8,3,2,4,7,10,5]],
  ['Xayah',['ADC'],'marksman','AD',[630,107,60,3.5,25,4.2,.658,525,330],[7,8,4,2,6,3,3,6,4,3,6,8,8,6]],
  ['Ezreal',['ADC'],'marksman','AD',[600,102,60,2.5,24,4.7,.625,550,325],[6,6,1,1,4,1,9,5,8,3,6,7,7,7]],
  ['Nautilus',['SUP'],'tank','AP',[646,112,61,3.3,39,4.95,.706,175,325],[4,2,9,9,3,5,1,2,3,4,8,7,5,3]],
  ['Rakan',['SUP'],'enchanter','AP',[610,99,62,3.5,32,3.9,.635,300,335],[3,2,8,9,6,6,1,2,9,3,7,8,6,7]],
  ['Alistar',['SUP'],'tank','AP',[685,120,62,3.75,47,4.7,.625,125,330],[3,2,9,9,6,8,1,2,4,5,8,7,6,5]],
  ['Karma',['SUP','MID'],'enchanter','AP',[604,95,51,3.3,28,4.7,.625,525,335],[5,3,4,4,7,8,8,6,5,5,8,7,5,4]],
  ['Braum',['SUP'],'tank','AD',[610,112,55,3.2,47,5.2,.644,125,335],[2,2,7,5,8,10,1,1,3,3,7,7,6,4]],
  ['Renekton',['TOP'],'fighter','AD',[660,111,69,4.15,35,5.2,.665,125,345],[7,6,5,6,2,1,2,6,6,6,9,7,4,5]],
  ['Gnar',['TOP'],'fighter','AD',[620,105,60,3.2,32,4.2,.625,175,335],[6,6,7,7,5,3,5,6,6,4,6,7,7,7]],
  ['Xin Zhao',['JGL'],'fighter','AD',[640,106,63,3,35,4.4,.645,175,345],[7,6,6,7,3,3,1,4,6,5,8,7,5,4]],
  ['Wukong',['JGL','TOP'],'fighter','AD',[610,99,66,4,31,4.7,.69,175,340],[7,5,7,8,3,1,1,5,6,4,6,8,7,5]],
  ['LeBlanc',['MID'],'assassin','AP',[598,111,55,3.5,22,4.9,.658,525,340],[10,3,4,4,2,1,5,5,9,2,8,8,5,8]],
  ['Corki',['MID','ADC'],'marksman','AD',[610,100,55,2.5,27,4.6,.644,550,345],[6,7,1,1,3,1,8,6,6,3,5,7,8,6]],
  ['Aphelios',['ADC'],'marksman','AD',[600,102,55,2.3,26,4.2,.665,550,325],[7,9,4,1,4,2,4,8,2,2,5,7,9,9]],
  ['Zeri',['ADC'],'marksman','AD',[600,110,53,2,24,4.2,.658,500,330],[5,8,2,1,5,2,3,7,9,3,4,7,9,7]],
  ['Thresh',['SUP'],'tank','AP',[620,120,56,2.2,33,4,.625,450,330],[3,2,9,8,7,8,2,2,4,3,7,8,7,8]],
  ['Renata Glasc',['SUP'],'enchanter','AP',[545,94,49,3.2,27,5,.625,550,330],[4,3,7,6,8,8,3,3,4,4,6,7,7,6]]
];
// 추가 챔피언: 기본 스탯은 역할군 기준값에서 파생 (range는 개별 지정)
const CLASS_BASE={fighter:[640,106,64,3.8,34,4.6,.65,150,345],tank:[640,112,62,3.4,36,5,.66,150,335],mage:[580,104,53,3.1,22,4.5,.645,525,330],assassin:[600,105,60,3.4,28,4.6,.65,175,345],marksman:[620,104,58,3,25,4.3,.645,550,330],enchanter:[580,98,50,3,26,4.4,.625,525,330]};
const CHAMP_EXTRA = [
  ['Camille',['TOP'],'fighter','AD',[7,7,5,6,2,1,1,5,8,4,6,8,8,8]],['Fiora',['TOP'],'fighter','AD',[6,9,2,3,2,1,1,5,7,7,7,8,9,8]],
  ['Gragas',['TOP','JGL','SUP'],'tank','AP',[6,4,7,7,6,5,3,6,6,5,7,7,6,6]],['Sion',['TOP'],'tank','AD',[4,3,7,8,4,4,1,7,3,4,5,7,8,4]],
  ['Gwen',['TOP'],'fighter','AP',[6,8,2,3,3,1,1,6,6,6,5,7,9,6]],['Kennen',['TOP'],'mage','AP',[8,5,8,8,3,2,5,6,6,3,6,8,7,6],550],
  ['Jayce',['TOP','MID'],'fighter','AD',[8,5,2,2,3,1,9,6,5,2,9,8,5,8],500],['Yone',['TOP','MID'],'assassin','AD',[7,8,6,7,2,1,1,6,7,5,5,8,9,8]],
  ['Poppy',['TOP','JGL','SUP'],'tank','AD',[5,3,8,6,8,7,1,4,5,3,7,7,6,5]],['Kled',['TOP'],'fighter','AD',[7,6,4,8,2,1,2,5,6,5,8,8,5,6]],
  ['Riven',['TOP'],'fighter','AD',[8,6,5,6,2,1,1,6,8,5,8,8,6,9]],['Galio',['MID','SUP','TOP'],'tank','AP',[5,3,8,8,6,7,2,6,5,4,5,8,7,5]],
  ['Nidalee',['JGL'],'assassin','AP',[8,4,1,2,3,1,8,6,8,5,9,7,4,9],525],['Kindred',['JGL'],'marksman','AD',[6,8,2,2,6,5,2,5,6,3,6,8,9,7],500],
  ['Elise',['JGL'],'mage','AP',[8,4,6,5,3,1,4,5,6,3,9,7,4,7]],['Jarvan IV',['JGL'],'fighter','AD',[7,4,7,9,3,3,1,5,6,3,8,8,5,5]],
  ['Skarner',['JGL'],'tank','AD',[5,4,9,8,4,5,1,5,6,4,7,8,6,5]],['Graves',['JGL'],'marksman','AD',[7,7,2,3,3,1,2,7,6,6,7,8,7,6],425],
  ['Nocturne',['JGL'],'assassin','AD',[7,6,4,8,2,1,1,5,7,5,6,8,6,4]],['Pantheon',['JGL','SUP','TOP'],'fighter','AD',[8,4,6,7,3,3,3,5,6,3,9,7,4,5]],
  ['Viktor',['MID'],'mage','AP',[7,7,5,3,5,3,7,9,3,2,5,8,9,6]],['Sylas',['MID','JGL'],'mage','AP',[8,6,5,6,3,1,2,6,7,7,6,8,7,8],175],
  ['Tristana',['MID','ADC'],'marksman','AD',[8,8,2,3,4,2,3,8,7,3,7,8,8,5]],['Hwei',['MID'],'mage','AP',[7,6,6,4,5,4,8,8,2,2,5,8,8,9]],
  ['Aurora',['MID','TOP'],'mage','AP',[8,5,5,5,5,2,5,7,8,3,6,8,7,7]],['Akali',['MID','TOP'],'assassin','AP',[9,5,2,5,3,1,2,5,9,4,6,8,6,9]],
  ['Cassiopeia',['MID'],'mage','AP',[6,9,6,4,4,3,5,8,2,4,6,8,8,7]],['Ryze',['MID','TOP'],'mage','AP',[7,8,4,3,4,2,4,8,4,4,4,7,9,8]],
  ['Zoe',['MID'],'mage','AP',[9,3,5,2,3,2,9,6,4,2,7,8,6,8]],
  ['Ashe',['ADC','SUP'],'marksman','AD',[5,7,7,7,5,4,6,6,2,3,6,8,7,3],600],['Caitlyn',['ADC'],'marksman','AD',[6,7,4,1,4,2,8,7,3,3,9,7,7,5],650],
  ['Kalista',['ADC'],'marksman','AD',[5,8,5,6,6,4,3,6,8,3,8,8,5,8]],['Lucian',['ADC','MID'],'marksman','AD',[8,7,1,3,4,1,3,7,7,4,9,8,5,7],500],
  ['Jhin',['ADC'],'marksman','AD',[8,6,5,2,3,2,7,6,2,2,6,8,8,5]],['Sivir',['ADC'],'marksman','AD',[4,8,1,5,6,3,3,10,5,3,4,7,8,4]],
  ['Smolder',['ADC','MID'],'marksman','AD',[6,8,2,1,3,1,6,8,3,3,3,6,10,5]],['Draven',['ADC'],'marksman','AD',[8,8,3,2,3,1,2,6,4,3,9,8,6,9]],
  ['Ziggs',['ADC','MID'],'mage','AP',[7,6,2,1,4,2,9,10,2,2,5,8,8,5]],
  ['Leona',['SUP'],'tank','AP',[4,2,9,9,3,5,1,2,4,4,8,7,6,4],125],['Rell',['SUP','JGL'],'tank','AP',[4,2,9,9,5,6,1,2,4,3,7,8,6,5],125],
  ['Lulu',['SUP'],'enchanter','AP',[4,3,6,3,8,10,5,4,4,3,6,8,8,5],550],['Milio',['SUP'],'enchanter','AP',[2,2,3,2,8,9,3,3,4,6,5,7,8,5]],
  ['Neeko',['SUP','MID'],'mage','AP',[8,4,7,7,4,3,5,7,4,2,6,8,6,6]],['Bard',['SUP'],'enchanter','AP',[5,3,7,6,7,6,4,2,8,4,6,8,7,8],500],
  ['Zyra',['SUP','JGL'],'mage','AP',[7,6,6,4,6,5,7,7,1,2,7,8,6,5],575]
];

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
function buildItemSystems(snapshot=SYSTEM_SOURCE_SNAPSHOT){
  const defs={},pool={fighter:[],tank:[],mage:[],assassin:[],marksman:[],enchanter:[]};
  for(const [id,raw] of Object.entries(snapshot.items||{})){const tier=itemTier(raw),effects=itemEffectsFromSource(raw),classes=itemClassesFromSource(raw,effects),d={id,name:raw.nameKo,nameKo:raw.nameKo,descriptionKo:raw.descriptionKo,plaintextKo:raw.plaintextKo,cost:raw.gold?.total||0,recipeCost:raw.gold?.base??raw.gold?.total??0,sell:raw.gold?.sell||0,tags:(raw.tags||[]).slice(),stats:{...(raw.stats||{})},from:(raw.from||[]).slice(),into:(raw.into||[]).slice(),tier,classes,effects,active:true,shopActive:!raw.hideFromAll&&!raw.requiredChampion&&raw.inStore!==false,requiredChampion:raw.requiredChampion||null,source:{provider:snapshot.provider,version:snapshot.version,mapId:snapshot.mapId}};
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

function buildPatch(championSnapshot=CHAMPION_SOURCE_SNAPSHOT,systemSnapshot=SYSTEM_SOURCE_SNAPSHOT){
  const champions = {};
  for (const [name,roles,cls,dmg,base,kit] of CHAMP_RAW){
    const b={}, k={}, id=championId(name);
    BASE_KEYS.forEach((key,i)=>b[key]=base[i]);
    KIT_KEYS.forEach((key,i)=>k[key]=kit[i]);
    champions[id] = enrichChampion({id,name, roles, cls, dmg, base:b, kit:k});
  }
  for (const [name,roles,cls,dmg,kit,range] of CHAMP_EXTRA){
    const h=hashStr(name), base=CLASS_BASE[cls].slice(), b={}, k={};
    BASE_KEYS.forEach((key,i)=>{let v=base[i]; if(key!=='range'&&key!=='as') v=Math.round(v*(0.97+(((h>>(i*3))&7)/7)*0.06)*100)/100; b[key]=v});
    if(range) b.range=range;
    KIT_KEYS.forEach((key,i)=>k[key]=kit[i]);
    const id=championId(name);champions[id]=enrichChampion({id,name,roles,cls,dmg,base:b,kit:k});
  }
  for (const [name,roles,arch,dmg] of CHAMP_ARCH){const c=enrichChampion(archChampion(name,roles,arch,dmg));champions[c.id]=c}
  const sourceCoverage=applyChampionSource(champions,championSnapshot),itemSystem=buildItemSystems(systemSnapshot),runeSystem=buildRuneSystems(systemSnapshot);
  return {
    id:'26.19',
    championSource:{version:CHAMPION_SOURCE_PATCH,...sourceCoverage},systemSource:{provider:systemSnapshot.provider,version:systemSnapshot.version,mapId:systemSnapshot.mapId,itemCount:Object.keys(systemSnapshot.items||{}).length,runeCount:Object.keys(systemSnapshot.runes||{}).length,runeStyleCount:(systemSnapshot.runeStyles||[]).length},
    rules:{ csGold:23, passiveGold:122, killGold:300, assistGold:150, dragonSpawn:5, dragonRespawn:5, heraldSpawn:14, baronSpawn:20, baronRespawn:6, baronBuff:3, elderBuff:2.5, inhibRespawn:5 },
    champions, items:itemSystem.pool, itemDefs:itemSystem.defs, runes:runeSystem.styles, runeDefs:runeSystem.defs
  };
}

// ---- 월드 생성 (가상 선수/팀) ----
const TEAM_TEMPLATES = [
  {id:'HTG', name:'Hangyeol Tigers', short:'HTG', base:78,
   tactics:{aggression:55, risk_tolerance:45, objective_priority:65, vision_investment:70, scaling_preference:60},
   players:[['Rook','TOP',23,'laner',['Ornn',"K'Sante"]],['Veil','JGL',24,'macro',['Sejuani','Maokai']],['Solace','MID',25,'star',['Azir','Orianna']],['Kestrel','ADC',21,'mechanical',["Kai'Sa",'Xayah']],['Anchor','SUP',26,'caller',['Rakan','Nautilus']]]},
  {id:'SBZ', name:'Saebit Blaze', short:'SBZ', base:77,
   tactics:{aggression:80, risk_tolerance:70, objective_priority:55, vision_investment:50, scaling_preference:35},
   players:[['Tyrant','TOP',22,'aggressive',['Aatrox','Rumble']],['Fang','JGL',20,'aggressive',['Lee Sin','Vi']],['Cinder','MID',23,'mechanical',['Ahri','Syndra']],['Volt','ADC',24,'laner',['Varus','Ezreal']],['Guard','SUP',25,'aggressive',['Nautilus','Alistar']]]},
  {id:'OCN', name:'Ocean Gaming', short:'OCN', base:74,
   tactics:{aggression:40, risk_tolerance:35, objective_priority:75, vision_investment:80, scaling_preference:70},
   players:[['Tide','TOP',27,'macro',['Jax',"K'Sante"]],['Current','JGL',26,'macro',['Sejuani','Viego']],['Harbor','MID',28,'caller',['Orianna','Taliyah']],['Gale','ADC',25,'laner',['Jinx','Xayah']],['Buoy','SUP',27,'caller',['Braum','Karma']]]},
  {id:'NVA', name:'Nova Esports', short:'NVA', base:72,
   tactics:{aggression:65, risk_tolerance:60, objective_priority:50, vision_investment:55, scaling_preference:50},
   players:[['Nova','TOP',19,'mechanical',['Jax','Aatrox']],['Orbit','JGL',19,'aggressive',['Viego','Lee Sin']],['Pulse','MID',18,'star',['Syndra','Ahri']],['Comet','ADC',20,'mechanical',['Ezreal',"Kai'Sa"]],['Halo','SUP',21,'laner',['Karma','Rakan']]]},
  {id:'CRW', name:'Crown Gaming Club', short:'CRW', base:77,
   tactics:{aggression:50, risk_tolerance:50, objective_priority:70, vision_investment:65, scaling_preference:65},
   players:[['Regal','TOP',25,'macro',['Ornn','Jax']],['Scepter','JGL',23,'caller',['Maokai','Sejuani']],['Monarch','MID',24,'star',['Azir','Syndra']],['Crest','ADC',22,'laner',['Jinx','Varus']],['Warden','SUP',24,'caller',['Braum','Alistar']]]},
  {id:'STM', name:'Storm Esports', short:'STM', base:75,
   tactics:{aggression:70, risk_tolerance:60, objective_priority:55, vision_investment:55, scaling_preference:40},
   players:[['Thunder','TOP',22,'aggressive',['Rumble','Aatrox']],['Squall','JGL',21,'mechanical',['Vi','Lee Sin']],['Static','MID',22,'mechanical',['Ahri','Taliyah']],['Bolt','ADC',23,'mechanical',['Xayah',"Kai'Sa"]],['Aegis','SUP',23,'aggressive',['Rakan','Nautilus']]]},
  {id:'RSG', name:'Rising Star Gaming', short:'RSG', base:72,
   tactics:{aggression:45, risk_tolerance:40, objective_priority:65, vision_investment:70, scaling_preference:60},
   players:[['Ridge','TOP',24,'macro',["K'Sante",'Ornn']],['Sprout','JGL',20,'macro',['Sejuani','Viego']],['Glint','MID',21,'laner',['Orianna','Azir']],['Arrow','ADC',22,'laner',['Varus','Jinx']],['Petal','SUP',23,'caller',['Karma','Braum']]]},
  {id:'IRN', name:'Iron Wolves', short:'IRN', base:71,
   tactics:{aggression:60, risk_tolerance:55, objective_priority:50, vision_investment:50, scaling_preference:45},
   players:[['Forge','TOP',26,'laner',['Aatrox','Jax']],['Anvil','JGL',25,'aggressive',['Vi','Viego']],['Rivet','MID',24,'caller',['Taliyah','Orianna']],['Spark','ADC',21,'mechanical',['Ezreal','Xayah']],['Plate','SUP',27,'macro',['Alistar','Maokai']]]}
];
const STYLE_BIAS = {
  laner:{g:{laning:6,mechanical:2,macro:-3}, t:{trading_frequency:12,aggression:5}},
  macro:{g:{macro:7,mental:3,mechanical:-4}, t:{objective_preference:15,teamplay:10,aggression:-8}},
  star:{g:{mechanical:5,combat:4,laning:3,mental:1}, t:{resource_demand:18,creativity:0}},
  mechanical:{g:{mechanical:8,combat:2,macro:-5,mental:-3}, t:{aggression:10,risk_taking:12}},
  caller:{g:{mental:7,macro:5,mechanical:-5}, t:{teamplay:15,engage_preference:10}},
  aggressive:{g:{combat:3,mechanical:2,mental:-4}, t:{aggression:22,risk_taking:18,roaming:15,engage_preference:12}}
};
