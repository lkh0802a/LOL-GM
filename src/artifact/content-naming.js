// ===== LOL GM: 절차형 콘텐츠 작명 엔진 =====
// 의미(역할/효과/룬 스타일)를 먼저 정하고 이름을 만든 뒤, 기존 콘텐츠와 중복·유사성을 검증한다.

const CONTENT_NAME_VERSION=1;
function contentNameNorm(v){return String(v||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9가-힣]/g,'')}
function contentNameDistance(a,b){
  a=[...contentNameNorm(a)];b=[...contentNameNorm(b)];if(!a.length)return b.length;if(!b.length)return a.length;
  let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){const cur=[i];for(let j=1;j<=b.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=cur}
  return prev[b.length];
}
function contentNameTooSimilar(name,existing){
  const n=contentNameNorm(name);if(!n)return true;
  for(const raw of existing||[]){const e=contentNameNorm(raw);if(!e)continue;if(n===e)return true;
    const max=Math.max(n.length,e.length),d=contentNameDistance(n,e),sim=1-d/max;
    if((Math.min(n.length,e.length)<=5&&d<=1)||(max>=6&&sim>=.78))return true;
  }return false;
}
function contentExistingNames(db,kind){
  if(kind==='champion')return Object.values(db.patch?.champions||{}).flatMap(x=>[x.name,x.nameKo]).filter(Boolean);
  if(kind==='item')return Object.values(db.patch?.itemDefs||{}).flatMap(x=>[x.name,x.nameKo]).filter(Boolean);
  return Object.values(db.patch?.runeDefs||{}).flatMap(x=>[x.name,x.nameKo]).filter(Boolean);
}
function contentRecentPrefixKeys(db,kind,n=4){
  const rows=kind==='champion'?Object.values(db.patch?.champions||{}):kind==='item'?Object.values(db.patch?.itemDefs||{}):Object.values(db.patch?.runeDefs||{});
  return rows.filter(x=>x.naming?.prefixKey).slice(-n).map(x=>x.naming.prefixKey);
}
function contentUniqueName(db,kind,rng,factory){
  const existing=contentExistingNames(db,kind),recent=contentRecentPrefixKeys(db,kind);
  let last=null;for(let i=0;i<96;i++){const x=factory(i);last=x;if(!x||!x.name||!x.nameKo)continue;
    if(recent.slice(-2).includes(x.naming?.prefixKey))continue;
    if(!contentNameTooSimilar(x.name,existing)&&!contentNameTooSimilar(x.nameKo,existing))return x;
  }
  return {...last,name:(last?.name||'Unnamed')+' '+Math.abs(rng.int(10,99)),nameKo:(last?.nameKo||'이름 없음')+' '+Math.abs(rng.int(10,99))};
}
const CHAMPION_NAME_BANKS={
  shadow:{
    start:[['Va','바'],['Ny','니'],['Zer','제르'],['Kha','카'],['Mor','모르'],['Sha','샤'],['Rav','라브'],['Vex','벡'],['Dra','드라'],['Syl','실']],
    mid:[['kir','키르'],['za','자'],['ren','렌'],['vor','보르'],['shi','시'],['neth','네스'],['dra','드라'],['vel','벨']],
    end:[['en','엔'],['is','리스'],['ath','아스'],['or','오르'],['yn','인'],['ek','에크'],['a','아'],['os','오스']]
  },
  arcane:{
    start:[['Ae','에'],['Ori','오리'],['Sae','세'],['Ly','리'],['Meri','메리'],['Tha','타'],['Eli','엘리'],['Cae','케'],['Iri','이리'],['Vio','비오']],
    mid:[['lo','로'],['ria','리아'],['the','테'],['mi','미'],['syl','실'],['qua','콰'],['ne','네'],['vra','브라']],
    end:[['n','엔'],['ra','라'],['lis','리스'],['on','온'],['ia','이아'],['eth','에스'],['el','엘'],['um','움']]
  },
  martial:{
    start:[['Kor','코르'],['Gar','가르'],['Tor','토르'],['Bra','브라'],['Ren','렌'],['Kael','카엘'],['Var','바르'],['Rok','로크'],['Dal','달'],['Mar','마르']],
    mid:[['dan','단'],['rik','릭'],['vor','보르'],['gan','간'],['tar','타르'],['mon','몬'],['dra','드라'],['ken','켄']],
    end:[['or','오르'],['an','안'],['ek','에크'],['us','우스'],['en','엔'],['ar','아르'],['ok','오크'],['ir','이르']]
  },
  celestial:{
    start:[['Ael','아엘'],['Ser','세르'],['Lumi','루미'],['Eos','에오스'],['Sol','솔'],['Celi','셀리'],['Ari','아리'],['Ily','일리'],['Nae','네'],['Ora','오라']],
    mid:[['via','비아'],['riel','리엘'],['lun','룬'],['sa','사'],['the','테'],['mir','미르'],['eli','엘리'],['ora','오라']],
    end:[['el','엘'],['ia','이아'],['is','이스'],['on','온'],['a','아'],['iel','이엘'],['en','엔'],['ys','이스']]
  },
  wild:{
    start:[['Gor','고르'],['Fen','펜'],['Ruk','루크'],['Tala','탈라'],['Vara','바라'],['Oru','오루'],['Kesh','케시'],['Nara','나라'],['Bram','브람'],['Yor','요르']],
    mid:[['ka','카'],['gar','가르'],['ra','라'],['mok','모크'],['sha','샤'],['tan','탄'],['ruk','루크'],['ven','벤']],
    end:[['a','아'],['ok','오크'],['ar','아르'],['un','운'],['esh','에시'],['or','오르'],['ai','아이'],['en','엔']]
  },
  frontier:{
    start:[['Jas','자스'],['Vay','베이'],['Cor','코르'],['Rin','린'],['Dex','덱스'],['Tess','테스'],['Kyr','키르'],['Ash','애시'],['Mara','마라'],['Zin','진']],
    mid:[['tal','탈'],['ren','렌'],['vi','비'],['dra','드라'],['sen','센'],['kai','카이'],['lo','로'],['mer','메르']],
    end:[['a','아'],['en','엔'],['is','리스'],['on','온'],['er','어'],['yn','인'],['al','알'],['ix','익스']]
  }
};
function championNamingTheme(spec){
  const a=spec.arch||'',r=spec.role||spec.roles?.[0]||'';
  if(['assassin'].includes(a))return 'shadow';
  if(['burst','control','battle','artillery','specialist'].includes(a)||spec.dmg==='AP'&&r==='MID')return 'arcane';
  if(['enchanter','catcher'].includes(a)||r==='SUP'&&spec.dmg==='AP')return 'celestial';
  if(['marksman','hyper','bully'].includes(a)||r==='ADC')return 'frontier';
  if(r==='JGL'&&['diver','skirmisher','vanguard'].includes(a))return 'wild';
  return 'martial';
}
function championNameCandidate(rng,theme){
  const b=CHAMPION_NAME_BANKS[theme]||CHAMPION_NAME_BANKS.martial,a=rng.pick(b.start),m=rng.pick(b.mid),z=rng.pick(b.end),long=rng.chance(.38),m2=long?rng.pick(b.mid):null;
  const en=a[0]+m[0]+(m2?m2[0]:'')+z[0],ko=a[1]+m[1]+(m2?m2[1]:'')+z[1];
  return {name:en.charAt(0).toUpperCase()+en.slice(1),nameKo:ko,naming:{version:CONTENT_NAME_VERSION,kind:'champion',theme,prefixKey:theme+':'+a[0].toLowerCase()}};
}
function generateChampionContentName(db,rng,spec){
  const theme=championNamingTheme(spec);return contentUniqueName(db,'champion',rng,()=>championNameCandidate(rng,theme));
}

const ITEM_WORDS={
  offense:{pre:[['Bloodforged','핏빛 벼림'],['Razorwind','칼바람'],['Emberbound','잿불 결속'],['Warborn','전쟁의'],['Kingslayer','왕을 베는'],['Fellsteel','흉철']],noun:[['Edge','칼날'],['Spear','창'],['Reaver','약탈검'],['Claw','갈퀴'],['Crescent','초승달'],['Brand','낙인']]},
  defense:{pre:[['Ironbound','철벽의'],['Stoneward','바위 수호'],['Oathforged','서약의'],['Unbroken','불굴의'],['Dawnward','여명 수호'],['Graveguard','묘지 수호']],noun:[['Aegis','방패'],['Bulwark','성채'],['Mantle','망토'],['Plate','갑주'],['Vow','서약'],['Bastion','보루']]},
  sustain:{pre:[['Lifebound','생명 결속'],['Everflow','영원의 흐름'],['Verdant','푸른'],['Bloodwell','핏샘의'],['Merciful','자비의'],['Deepwell','깊은 샘의']],noun:[['Chalice','성배'],['Heart','심장'],['Bloom','꽃'],['Vessel','그릇'],['Font','샘'],['Embrace','포옹']]},
  mobility:{pre:[['Galefoot','질풍의'],['Wayfarer','길잡이의'],['Stormstep','폭풍걸음'],['Skybound','천공의'],['Fleetborn','쾌속의'],['Cloudpiercer','구름을 가르는']],noun:[['Stride','발걸음'],['Wing','날개'],['Path','길'],['Spur','박차'],['Talon','발톱'],['Compass','나침반']]},
  haste:{pre:[['Quickened','재촉하는'],['Clockwork','태엽의'],['Echoing','메아리치는'],['Runic','룬의'],['Spellbound','주문결속'],['Hourglass','시계의']],noun:[['Sigil','인장'],['Codex','고서'],['Hour','시간'],['Censer','향로'],['Glyph','문양'],['Focus','초점']]},
  utility:{pre:[['Watchful','주시자의'],['Guiding','인도의'],['Veiled','장막의'],['Concordant','조화의'],['Starwoven','별실의'],['Pilgrim','순례자의']],noun:[['Lantern','등불'],['Crown','관'],['Standard','깃발'],['Bell','종'],['Talisman','부적'],['Promise','약속']]},
  scaling:{pre:[['Ascendant','승천의'],['Endless','끝없는'],['Latebloom','늦피는'],['Worldroot','세계뿌리'],['Epochal','시대의'],['Eternal','영원의']],noun:[['Crown','왕관'],['Engine','기관'],['Seed','씨앗'],['Legacy','유산'],['Spire','첨탑'],['Core','핵']]},
  early:{pre:[['Firststrike','선제의'],['Dawnbreak','새벽을 깨는'],['Vanguard','선봉의'],['Rising','떠오르는'],['Redhand','붉은 손의'],['Sunflash','햇살의']],noun:[['Blade','검'],['Crest','문장'],['Horn','뿔피리'],['Torch','횃불'],['Banner','기치'],['Fang','송곳니']]}
};
function dominantContentEffect(effects,fallback='utility'){return Object.entries(effects||{}).sort((a,b)=>Number(b[1]||0)-Number(a[1]||0))[0]?.[0]||fallback}
function itemNameCandidate(rng,theme,cls){
  const bank=ITEM_WORDS[theme]||ITEM_WORDS.utility,p=rng.pick(bank.pre),n=rng.pick(bank.noun);
  const possessive=rng.chance(.18),name=possessive?`${n[0]} of the ${p[0].replace(/bound$|born$/i,'')}`:`${p[0]} ${n[0]}`,nameKo=p[1].endsWith('의')||p[1].includes('을 ')||p[1].includes('를 ')?p[1]+n[1]:p[1]+' '+n[1];
  return {name,nameKo,naming:{version:CONTENT_NAME_VERSION,kind:'item',theme,class:cls,prefixKey:theme+':'+p[0].toLowerCase()}};
}
function generateItemContentName(db,rng,spec){
  const theme=dominantContentEffect(spec.effects,spec.cls==='tank'?'defense':spec.cls==='marksman'?'offense':'utility');
  return contentUniqueName(db,'item',rng,()=>itemNameCandidate(rng,theme,spec.cls));
}

const RUNE_STYLE_BANKS={
  precision:[['Relentless','끊임없는'],['Keen','예리한'],['Measured','정교한'],['Victorious','승리의'],['Unfaltering','흔들림 없는'],['Tempered','단련된']],
  domination:[['Veiled','장막의'],['Ravenous','굶주린'],['Crimson','진홍의'],['Hunting','사냥의'],['Nightbound','밤의'],['Merciless','무자비한']],
  sorcery:[['Arcane','비전의'],['Resonant','공명의'],['Astral','성운의'],['Stormborn','폭풍의'],['Runic','룬의'],['Fluxing','흐르는']],
  resolve:[['Unbroken','불굴의'],['Stonebound','바위의'],['Guardian','수호의'],['Rooted','뿌리내린'],['Steadfast','굳건한'],['Oathbound','서약의']],
  inspiration:[['Clever','영리한'],['Wayward','변칙의'],['Timely','절묘한'],['Borrowed','빌린'],['Curious','기묘한'],['Fortunate','행운의']]
};
const RUNE_EFFECT_NOUNS={
  offense:[['Cadence','박동'],['Edge','칼끝'],['Fervor','격정'],['Volley','연사']],
  defense:[['Guard','수호'],['Shell','껍질'],['Stand','버팀'],['Ward','결계']],
  sustain:[['Renewal','회복'],['Breath','숨결'],['Feast','포식'],['Well','샘']],
  utility:[['Insight','통찰'],['Bond','결속'],['Signal','신호'],['Pact','맹세']],
  haste:[['Tempo','박자'],['Echo','메아리'],['Impulse','충동'],['Refrain','후렴']],
  mobility:[['Pursuit','추적'],['Step','발걸음'],['Rush','질주'],['Current','흐름']],
  early:[['Opening','개시'],['Spark','불꽃'],['Firstlight','첫빛'],['Ambush','기습']],
  scaling:[['Legacy','유산'],['Ascent','승천'],['Harvest','수확'],['Promise','약속']]
};
function runeStyleKey(style){
  const x=String(style?.key||style?.name||'inspiration').toLowerCase();
  return ['precision','domination','sorcery','resolve','inspiration'].find(k=>x.includes(k))||'inspiration';
}
function runeNameCandidate(rng,styleKey,effect,kind){
  const p=rng.pick(RUNE_STYLE_BANKS[styleKey]),n=rng.pick(RUNE_EFFECT_NOUNS[effect]||RUNE_EFFECT_NOUNS.utility);
  const name=kind==='keystone'&&rng.chance(.25)?`${p[0]} ${n[0]} Prime`:`${p[0]} ${n[0]}`,nameKo=kind==='keystone'&&rng.chance(.25)?`${p[1]} ${n[1]}의 정점`:`${p[1]} ${n[1]}`;
  return {name,nameKo,naming:{version:CONTENT_NAME_VERSION,kind:'rune',theme:styleKey,effect,prefixKey:styleKey+':'+p[0].toLowerCase()}};
}
function generateRuneContentName(db,rng,spec){
  const styleKey=runeStyleKey(spec.style),effect=dominantContentEffect(spec.effects,'utility');
  return contentUniqueName(db,'rune',rng,()=>runeNameCandidate(rng,styleKey,effect,spec.kind));
}
