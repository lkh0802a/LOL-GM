// ===== LOL GM: 월드 (Phase 5 성장 + 월드 확장) =====
const NICK_A=['Ka','Zer','Lu','Vex','Mor','Ny','Ti','Rho','Sa','Quin','El','Dra','Fen','Jo','Kai','Mir','Oz','Pyr','Ren','Syl','Ul','Wyn','Xan','Yor','Bru','Cae','Del','Gor','Hex','Ish','Lor','Nim','Pax','Riv','Tor','Val','Zu','Aki','Bly','Cro'];
const NICK_B=['n','ra','x','lo','th','ne','ko','vy','dan','rin','zo','sk','mi','ro','ve','ly','ce','ta','ix','or','us','en','al','yx','e','o','ash','ek','im','ul'];
const STYLES=Object.keys(STYLE_BIAS);
function roleFamiliarity(p,role){if(role===p.role)return 100;return (p.roleFamiliarity&&p.roleFamiliarity[role])||0}
function playerGroupScore(p,g,role=p.role){const keys=ATTR_GROUPS[g].filter(a=>!(a==='smite_execution'&&role!=='JGL')&&!(a==='csing'&&role==='SUP'));return keys.length?avg(keys.map(a=>p.attrs[a])):50}
function playerRoleRating(p,role=p.role){
  if(!p||!p.attrs)return 0;const gw=ROLE_GROUP_WEIGHTS[role]||ROLE_GROUP_WEIGHTS[p.role]||ROLE_GROUP_WEIGHTS.MID;
  let base=0,w=0;for(const [g,x] of Object.entries(gw)){base+=playerGroupScore(p,g,role)*x;w+=x}base=w?base/w:50;
  const keys=ROLE_KEY_ATTRS[role]||[],key=keys.length?avg(keys.map(a=>p.attrs[a]??50)):base,raw=base*.82+key*.18,fam=roleFamiliarity(p,role);
  return Math.round(clamp(raw*(role===p.role?1:.82+.18*fam/100),20,99));
}
function playerOvr(p){return playerRoleRating(p,p.role)}
function ensurePlayerDevelopment(p){
  if(p.development)return p.development;const h=Math.abs(hashStr(p.id||p.name||'player')),base={TOP:24.5,JGL:24,MID:25,ADC:25,SUP:26}[p.role]||25;
  p.development={growthRate:.88+(h%29)/100,peakAge:Math.round((base+((h>>4)%31-15)/10)*10)/10,declineRate:.85+((h>>9)%36)/100};return p.development;
}
function careerStage(p){if(p.retired)return '은퇴';const d=ensurePlayerDevelopment(p),seasons=p.proSeasons||0;if(seasons<=1||p.age<=19)return '신인';if(p.age<d.peakAge-1)return '성장';if(p.age<=d.peakAge+1)return '전성기';return '쇠퇴'}
function playerCoreMetrics(p){
  const A=p.attrs,T=p.tend||{},m=(...xs)=>Math.round(avg(xs.map(x=>typeof x==='string'?(A[x]??50):x)));
  return {
    laning:m('trading',p.role==='SUP'?'harass':'csing','wave_control','pressure','lane_adaptation'),
    skirmish:m('reaction','precision','all_in','positioning','extended_fight'),
    teamfight:m('teamfight_awareness','positioning','target_selection','engage','disengage','peeling'),
    positioning:Math.round(A.positioning||50),
    damage:m('precision','kiting','target_selection','burst_execution','extended_fight'),
    survival:m('dodging','spacing','gank_avoidance','disengage','composure'),
    vision:m('vision_understanding','map_awareness'),
    objective:m('objective_setup','decision_making',p.role==='JGL'?(A.smite_execution||50):(A.tempo||50)),
    roaming:m('rotation','map_awareness','tempo'),
    macro:m('map_awareness','rotation','tempo','resource_allocation','crossmap_decision'),
    sidelane:m('sidelane','wave_control','map_awareness'),
    decision:Math.round(A.decision_making||50),
    stability:m('consistency','composure','pressure_handling'),
    aggression:Math.round(T.aggression??50),
    concentration:Math.round(A.concentration||50),
    adaptability:Math.round(A.adaptability||50),
    volatility:Math.round(clamp(100-(A.consistency||50),1,99)),
    championLearning:Math.round(A.champion_learning||50),
    metaAdaptation:Math.round(A.meta_adaptation||50)
  };
}
function playerSquadLabel(db,p){if(!p.team||!db.teams[p.team])return 'FA';return db.teams[p.team].parent?'2군':'1군'}
function recordPlayerEvent(p,type,year,data={}){p.careerEvents=p.careerEvents||[];p.careerEvents.push({type,year,...data});if(p.careerEvents.length>120)p.careerEvents=p.careerEvents.slice(-120)}
function trainSecondaryRole(p,role,amount=1){if(!ROLES.includes(role)||role===p.role)return roleFamiliarity(p,role);p.roleFamiliarity=p.roleFamiliarity||{[p.role]:100};const gain=Math.max(.2,amount)*(.55+(p.attrs.adaptability||50)/100*.55);p.roleFamiliarity[role]=Math.round(clamp((p.roleFamiliarity[role]||25)+gain,0,90));p.secondaryRoles=p.secondaryRoles||[];if(p.roleFamiliarity[role]>=55&&!p.secondaryRoles.includes(role))p.secondaryRoles.push(role);return p.roleFamiliarity[role]}
function ensureChampionProfile(db,p,cid){if(!p.pool)p.pool={};if(!p.pool[cid])p.pool[cid]={mastery:25,experience:0,matchup_knowledge:35,confidence:40,scrimExperience:0,trainingExperience:0,scrimSeason:0,trainingSeason:0};const pr=p.pool[cid];pr.scrimExperience=pr.scrimExperience||0;pr.trainingExperience=pr.trainingExperience||0;pr.scrimSeason=pr.scrimSeason||0;pr.trainingSeason=pr.trainingSeason||0;return pr}
function practiceChampion(db,p,cid,kind='training',amount=1){const pr=ensureChampionProfile(db,p,cid),n=Math.max(0,amount);if(kind==='scrim'){pr.scrimExperience+=n;pr.scrimSeason+=n;pr.confidence=Math.round(clamp(pr.confidence+n*.08,10,99))}else{pr.trainingExperience+=n;pr.trainingSeason+=n}return pr}
function championLearningMultiplier(db,p,cid){const c=db.patch.champions[cid],diff=c&&c.kit?c.kit.difficulty||5:5;return (.65+.7*(p.attrs.champion_learning||50)/100)*(.92+.2*(p.attrs.adaptability||50)/100)/(1+Math.max(0,diff-5)*.045)}
function adaptPlayerPoolsToPatch(db,notes,major=false){const changed={};for(const n of notes||[])if((n.type==='kit'||n.type==='base')&&n.c)changed[n.c]=(changed[n.c]||0)+1;for(const p of Object.values(db.players))if(!p.retired&&p.pool)for(const [cid,count] of Object.entries(changed)){const pr=p.pool[cid];if(!pr)continue;const adapt=(p.attrs.meta_adaptation||p.attrs.adaptability||50)/100,loss=Math.min(5,Math.max(0,Math.round(count*(major?1.25:.55)*(1.25-adapt))));pr.mastery=Math.round(clamp(pr.mastery-loss,20,99));pr.confidence=Math.round(clamp(pr.confidence-Math.ceil(loss/2),10,99))}}
function uniqNick(db,rng){for(let i=0;i<200;i++){let n=rng.pick(NICK_A)+rng.pick(NICK_B);if(rng.chance(0.2))n+=rng.pick(['','x','z','9','7']);const taken=Object.values(db.players).some(p=>p.name===n);if(!taken)return n}return 'P'+rng.int(100,999)}
function uniqId(db,prefix){let i=Object.keys(db.players).length;while(db.players[prefix+i])i++;return prefix+i}

function genPlayer(db,rng,o){
  const {role,age,base}=o, style=o.style||rng.pick(STYLES), bias=STYLE_BIAS[style], sig=o.sig||[];
  const attrs={};
  for(const g in ATTR_GROUPS)for(const a of ATTR_GROUPS[g]){
    let v=base+(bias.g[g]||0)+rng.normal(0,6);
    if(a==='smite_execution')v+=role==='JGL'?6:-30;
    if(a==='csing'&&role==='SUP')v-=18;
    if((a==='shotcalling'||a==='vision_understanding')&&(role==='SUP'||role==='JGL'))v+=6;
    if(a==='consistency'&&age<21)v-=6;
    if(ATTR_GROUPS.mental.includes(a)||ATTR_GROUPS.macro.includes(a))v-=Math.max(0,22-age)*1.2; // 어린 선수는 운영/멘탈이 덜 여묾
    attrs[a]=Math.round(clamp(v,20,99));
  }
  if(style==='caller')attrs.shotcalling=Math.max(attrs.shotcalling,Math.round(base+8));
  const tend={};for(const t of TENDENCIES)tend[t]=Math.round(clamp(50+(bias.t[t]||0)+rng.normal(0,12),5,95));
  if(role==='TOP')tend.split_preference=Math.min(95,tend.split_preference+15);
  const champs=Object.values(db.patch.champions).filter(c=>c.roles.includes(role)).map(c=>c.id);
  const sigIds=sig.map(x=>db.patch.champions[x]?x:(championByName(db,x)?.id)).filter(Boolean);
  const mySig=sigIds.length?sigIds:champs.slice().sort(()=>rng.next()-0.5).slice(0,2);
  const pool={};
  const n=clamp(Math.round(9+(age-17)*0.7+rng.normal(0,2)),7,18), picks=[...mySig,...champs.filter(c=>!mySig.includes(c)).sort(()=>rng.next()-0.5).slice(0,n)];
  for(const c of picks){const s=mySig.includes(c);
    pool[c]={mastery:Math.round(clamp(s?80+rng.normal(0,6)+(age-20):55+rng.normal(0,12),20,99)),experience:Math.round(clamp(s?70+rng.normal(0,10)+(age-20)*2:40+rng.normal(0,15),5,99)),
      matchup_knowledge:Math.round(clamp(base-10+rng.normal(0,10)+(age-20),20,99)),confidence:Math.round(clamp(s?72+rng.normal(0,8):50+rng.normal(0,10),10,99)),scrimExperience:0,trainingExperience:0,scrimSeason:0,trainingSeason:0};}
  const secondaryRoles=[],flex=SECONDARY_ROLE_OPTIONS[role]||[];if(flex.length&&rng.chance(.28))secondaryRoles.push(rng.pick(flex));
  const roleFamiliarityMap={[role]:100};for(const r of secondaryRoles)roleFamiliarityMap[r]=rng.int(58,78);const peakBase={TOP:24.5,JGL:24,MID:25,ADC:25,SUP:26}[role]||25;
  const p={id:o.id||uniqId(db,(o.region||'X')+'_'),name:o.name||uniqNick(db,rng),role,secondaryRoles,roleFamiliarity:roleFamiliarityMap,age,team:null,region:o.region,nationality:o.nationality||o.region,attrs,tend,pool,
    pot:0,reputation:0,personality:{professionalism:Math.round(clamp(rng.normal(60,15),10,99)),ambition:Math.round(clamp(rng.normal(60,15),10,99))},
    development:{growthRate:Math.round(clamp(rng.normal(1,.1),.78,1.22)*100)/100,peakAge:Math.round(clamp(rng.normal(peakBase,1.15),21.5,29)*10)/10,declineRate:Math.round(clamp(rng.normal(1,.12),.72,1.35)*100)/100},
    career:[],careerEvents:[],titles:[],proSeasons:0,retired:false,faYears:0};
  const ovr=playerOvr(p);p.pot=Math.round(clamp(o.pot!==undefined?o.pot:ovr+Math.max(0,24-age)*rng.range(0.8,2.4)+rng.normal(2,3),ovr,99));
  p.reputation=Math.round(clamp(ovr*.82+Math.max(0,age-19)*.65+rng.normal(0,3),20,95));
  db.players[p.id]=p;
  if(o.team)assignPlayerToTeam(db,p,o.team);
  return p;
}
function genCoach(rng,base){const nm=rng.pick(NICK_A)+rng.pick(NICK_B);return {name:nm.charAt(0).toUpperCase()+nm.slice(1),draft:Math.round(clamp(base+rng.normal(0,8),40,95)),analysis:Math.round(clamp(base+rng.normal(0,8),40,95)),development:Math.round(clamp(base+rng.normal(0,10),35,95))}}
function genTactics(rng){return {aggression:rng.int(35,80),risk_tolerance:rng.int(30,75),objective_priority:rng.int(45,80),vision_investment:rng.int(45,80),scaling_preference:rng.int(30,75)}}
const PHILOSOPHIES=['win-now','youth','balanced','superstar','cost'];
const PHIL_KO={'win-now':'즉시 전력','youth':'유망주 육성','balanced':'균형','superstar':'스타 영입','cost':'효율 중시'};
const TRAIN_POINTS=100;
const SPLIT_NAME={1:'윈터',2:'스프링',3:'서머'};
// 그 해 마지막 스플릿 시즌 (승강·시상·목표 판정 기준)
function finalSeason(w,R,div=1){return Object.values(w.seasons).filter(s=>s.region===R.id&&(s.div||1)===div&&s.split).sort((a,b)=>b.split-a.split)[0]}
// 나이가 어릴수록 더 많이, 더 빠르게 오른다
function youthMul(age){return age<=18?1.4:age<=20?1.25:age<=22?1.1:age<=24?1:0.85}
function growthCap(age){return age<=18?4.2:age<=20?3.5:age<=22?2.8:age<=24?2.1:age<=26?1.5:1.0}
function defaultTraining(){return {mechanical:20,laning:20,combat:20,macro:20,mental:20}}
function facilityMul(t){return t?0.92+0.05*((t.facility||2)-1):1}
function facilityCost(db,t){return Math.round(((t.facility||2)+1)*6*psOf(db,t.region)*10)/10}
function facilityUpkeep(db,t){return Math.round((t.facility||2)*1.2*psTeam(db,t)*10)/10}

// ---------- 지역 프리셋 / 월드 설정 ----------
// 실제 LoL e스포츠 구조를 본뜬 기본 리그 (리그 수준·시장 규모는 고정, 구조만 편집 가능)
const ROSTER_RULE_PROFILES={
  OWNED_RESERVE_LCK_STYLE_2026:{id:'OWNED_RESERVE_LCK_STYLE_2026',source:'LCK_2026',integratedMin:11,integratedMax:20,firstTeamMin:5,firstTeamMax:10,reserveTeamMin:5,reserveTeamMax:10,reserveSubMax:5}
};
function rosterRuleProfile(id='OWNED_RESERVE_LCK_STYLE_2026'){return ROSTER_RULE_PROFILES[id]||ROSTER_RULE_PROFILES.OWNED_RESERVE_LCK_STYLE_2026}

const REGION_PRESETS = {
  KR:{name:'한국',leagueName:'LCK',short:'LCK',strength:75,templates:true,tier:'major',d:{teams:12,splits:3,format:'rr_de',playoffTake:6,div2:true,system:'franchise',slots:4,salaryCap:40,salaryFloor:12}},
  CN:{name:'중국',leagueName:'LPL',short:'LPL',strength:74,tier:'major',d:{teams:16,splits:3,format:'groups_po',playoffTake:8,div2:true,system:'franchise',slots:4,salaryCap:70,salaryFloor:18}},
  EU:{name:'유럽',leagueName:'LEC',short:'LEC',strength:71,tier:'major',d:{teams:12,splits:3,format:'rr_de',playoffTake:8,system:'franchise',slots:3,salaryCap:0,salaryFloor:6}},
  NA:{name:'북미',leagueName:'LCS',short:'LCS',strength:68,tier:'major',d:{teams:10,splits:3,format:'rr_de',playoffTake:6,system:'franchise',slots:3,salaryCap:0,salaryFloor:8}},
  AP:{name:'아시아태평양',leagueName:'LCP',short:'LCP',strength:67,tier:'major',d:{teams:12,splits:3,format:'rr_po',playoffTake:6,system:'mixed',slots:3,salaryCap:0,salaryFloor:3}},
  BR:{name:'브라질',leagueName:'CBLOL',short:'CBLOL',strength:65,tier:'major',d:{teams:10,splits:3,format:'rr_po',playoffTake:6,system:'franchise',slots:3,salaryCap:0,salaryFloor:2}},
  VN:{name:'베트남',leagueName:'VCS',short:'VCS',strength:66,tier:'emerging',parent:'AP',d:{teams:8,splits:2,format:'rr_po',playoffTake:6,system:'relegation',slots:3}},
  JP:{name:'일본',leagueName:'LJL',short:'LJL',strength:62,tier:'emerging',parent:'AP',d:{teams:6,splits:2,format:'rr_po',playoffTake:4,system:'franchise',slots:3}},
  TW:{name:'대만·홍콩·마카오',leagueName:'PCS',short:'PCS',strength:64,tier:'emerging',parent:'AP',d:{teams:8,splits:2,format:'rr_po',playoffTake:6,system:'relegation',slots:3}},
  OC:{name:'오세아니아',leagueName:'LCO',short:'LCO',strength:60,tier:'emerging',parent:'AP',d:{teams:6,splits:2,format:'rr_po',playoffTake:4,system:'relegation',slots:3}},
  SEA:{name:'동남아시아',leagueName:'SEA League',short:'SEAL',strength:61,tier:'emerging',parent:'AP',d:{teams:8,splits:2,format:'rr_po',playoffTake:6,system:'relegation',slots:3}},
  TR:{name:'튀르키예',leagueName:'TCL',short:'TCL',strength:62,tier:'emerging',parent:'EU',d:{teams:8,splits:2,format:'rr_po',playoffTake:6,system:'relegation',slots:3}},
  ME:{name:'중동·북아프리카',leagueName:'Arabian League',short:'AL',strength:60,tier:'emerging',parent:'EU',d:{teams:8,splits:2,format:'rr_po',playoffTake:6,system:'franchise',slots:3}},
  CIS:{name:'독립국가연합',leagueName:'LCL',short:'LCL',strength:63,tier:'emerging',parent:'EU',d:{teams:8,splits:2,format:'rr_po',playoffTake:6,system:'relegation',slots:3}},
  LA:{name:'라틴 아메리카',leagueName:'LLA',short:'LLA',strength:62,tier:'emerging',parent:'BR',d:{teams:8,splits:2,format:'rr_po',playoffTake:6,system:'franchise',slots:3}}
};
const INTL_PRESETS=[
  // 최상위 대회 (tier top): 서로 날짜가 겹치지 않게 순서대로 진행
  {id:'FS',name:'퍼스트 스탠드',short:'FS',tier:'top',timing:'early',entry:'champions',format:'ko',bo:5,ratio:1,prestige:1},
  {id:'MSI',name:'미드 시즌 인비테이셔널',short:'MSI',tier:'top',timing:'mid',entry:'slots',format:'playin_de',bo:5,ratio:0.5,prestige:2},
  {id:'WORLDS',name:'월드 챔피언십',short:'WC',tier:'top',timing:'end',entry:'slots',format:'playin_swiss_ko',bo:5,ratio:1,prestige:3},
  // 중하위권 대회 (tier low): 상위 대회와 같은 기간에 열리고, 그 대회에 못 나간 팀이 출전
  {id:'ASCI',name:'아시아 스타 챌린저스',short:'ASCI',tier:'low',timing:'mid',entry:'div2',per:3,zone:'asia',format:'groups_ko',bo:3,prestige:0.3},
  {id:'EMM',name:'EMEA 마스터즈',short:'EMM',tier:'low',timing:'end',entry:'div2',per:3,zone:'emea',format:'groups_ko',bo:3,prestige:0.3},
  {id:'AMC',name:'아메리카스 컵',short:'AMC',tier:'low',timing:'early',entry:'next',per:3,zone:'americas',format:'groups_ko',bo:3,prestige:0.3}
];
const INTL_ZONES={asia:['KR','CN','AP','VN','JP','TW','OC','SEA'],emea:['EU','TR','ME','CIS'],americas:['NA','BR','LA']};
const ZONE_KO={asia:'아시아·태평양',emea:'EMEA',americas:'아메리카스'};

function regionCfg(id,over={}){
  const P=REGION_PRESETS[id]||{name:'새 지역',leagueName:'새 리그',short:'NEW',strength:63,d:{}};
  return {id,name:P.name,leagueName:P.leagueName,short:P.short,strength:P.strength,templates:!!P.templates,tier:P.tier||'emerging',parent:P.parent||null,
    format:'rr_po',div2:false,div2Teams:8,teams:8,splits:2,legs:2,regularBo:3,playoffTake:6,playoffBo:5,system:'franchise',relegate:1,slots:3,office:PRESET_OFFICE[id]||'conservative',
    fearless:true,payScale:PAY_SCALE[id]??0.4,salaryCap:0,salaryFloor:0,importLimit:2,rosterRuleProfile:'OWNED_RESERVE_LCK_STYLE_2026',...P.d,...over};
}
function defaultWorldConfig(){return {
  regions:['KR','CN','EU','NA','AP','BR'].map(id=>regionCfg(id)),
  internationals:['FS','MSI','WORLDS','ASCI','EMM','AMC'].map(id=>({...INTL_PRESETS.find(p=>p.id===id)})),
  subs:1, changes:'normal', startYear:2027, manage:'manual', universalLanguage:true
}}
const CHANGE_F={none:0,low:0.5,normal:1,high:1.8};

// ---------- 프로게임단 이름 ----------
const ORG_BRANDS=[['넥서스','Nexus','NX'],['반타','Vanta','VT'],['오닉스','Onyx','OX'],['크림슨','Crimson','CR'],['오로라','Aurora','AU'],['제니스','Zenith','ZN'],['헬릭스','Helix','HX'],['솔스티스','Solstice','SL'],['패러곤','Paragon','PG'],['버텍스','Vertex','VX'],['이클립스','Eclipse','EC'],['아펙스','Apex','AP'],['레디언트','Radiant','RD'],['보텍스','Vortex','VO'],['세이블','Sable','SB'],['템페스트','Tempest','TP'],['루멘','Lumen','LU'],['스펙터','Specter','SP'],['코발트','Cobalt','CB'],['아르고스','Argos','AR'],['미라지','Mirage','MR'],['케스트럴','Kestrel','KS'],['오블리비언','Oblivion','OB'],['인피니티','Infinity','IF'],['퀘이사','Quasar','QS'],['블랙쏜','Blackthorn','BT'],['하이드라','Hydra','HY'],['세라프','Seraph','SR'],['엠버','Ember','EM'],['글레이셔','Glacier','GL'],['노스타','Northstar','NS'],['프리즘','Prism','PZ']];
const ORG_SUFFIX=[['e스포츠 클럽','Esports Club','C'],['게이밍 클럽','Gaming Club','C'],['e스포츠','Esports','E'],['게이밍','Gaming','G'],['','','']];
const CORPS=[['온누리','Onnuri','O'],['한결','Hangyeol','H'],['누리','Nuri','N'],['세진','Sejin','S'],['가온','Gaon','G'],['청운','Cheongun','C'],['다온','Daon','D'],['라온','Raon','L'],['미르','Mir','M'],['아름','Areum','A'],['해솔','Haesol','Y'],['도담','Dodam','B'],['윤슬','Yunseul','U'],['한별','Hanbyeol','J']];
const CORP_BIZ=[['텔레콤','Telecom','T'],['생명','Life','L'],['모터스','Motors','M'],['에너지','Energy','E'],['전자','Electronics','D'],['증권','Securities','S'],['건설','E&C','C'],['식품','Foods','F'],['캐피탈','Capital','K']];
const MASCOTS=[['라이온즈','Lions','L'],['레드윙스','Red Wings','R'],['블리츠','Blitz','B'],['팔콘스','Falcons','F'],['레이더스','Raiders','D'],['샤크스','Sharks','S'],['나이츠','Knights','K'],['워리어스','Warriors','W'],['타이거즈','Tigers','T'],['피닉스','Phoenix','P'],['울브스','Wolves','V'],['드래곤즈','Dragons','G'],['호크스','Hawks','H'],['스팅어스','Stingers','N']];
function orgName(db,rng){
  const used=new Set(Object.values(db.teams).map(t=>t.name)), shorts=new Set(Object.keys(db.teams));
  for(let i=0;i<300;i++){
    const r=rng.next(); let name,short;
    if(r<0.45){const b=rng.pick(ORG_BRANDS),x=rng.pick(ORG_SUFFIX);name=(b[1]+' '+x[1]).trim();short=b[2]+(x[2]||'')}
    else if(r<0.8){const c=rng.pick(CORPS),z=rng.pick(CORP_BIZ),m=rng.pick(MASCOTS);name=rng.chance(0.5)?`${c[1]} ${z[1]} ${m[1]}`:`${c[1]} ${m[1]}`;short=c[2]+z[2]+m[2]}
    else{const L='ABCDEFGHJKLMNPRSTVWXZ';short=L[rng.int(0,L.length-1)]+L[rng.int(0,L.length-1)]+L[rng.int(0,L.length-1)];name=short+' '+rng.pick(['Gaming','Esports','Gaming Club'])}
    const head=name.split(' ')[0];
    const clash=Object.values(db.teams).some(t=>t.active!==false&&t.name.split(' ')[0]===head);
    if(!used.has(name)&&!shorts.has(short)&&(!clash||i>150))return {name,short};
  }
  const n='T'+rng.int(100,999);return {name:n+' Gaming',short:n};
}
function activeTeams(db,rid,div){return Object.values(db.teams).filter(t=>t.active!==false&&(!rid||t.region===rid)&&(!div||(t.division||1)===div))}
function isManagerSelectableTeam(db,t){
  const team=typeof t==='string'?db.teams[t]:t;
  return !!team&&team.active!==false&&!team.parent;
}
function managerSelectableTeams(db,rid,div){return activeTeams(db,rid,div).filter(t=>isManagerSelectableTeam(db,t))}
function rosterRulesForTeam(db,t){
  const team=teamRef(db,t);if(!team)return rosterRuleProfile();
  const region=db.regions[team.region];return rosterRuleProfile(region&&region.rosterRuleProfile);
}
function parentTeamOf(db,t){const team=teamRef(db,t);if(!team)return null;return team.parent?db.teams[team.parent]||null:team}
function reserveTeamsOf(db,t){const parent=parentTeamOf(db,t);if(!parent)return [];return activeTeams(db,parent.region,2).filter(x=>x.parent===parent.id)}
function organizationTeams(db,t){const parent=parentTeamOf(db,t);if(!parent)return [];return [parent,...reserveTeamsOf(db,parent)]}
function organizationRoster(db,t){return Array.from(new Set(organizationTeams(db,t).flatMap(x=>x.roster||[])))}
function rosterMoveCheck(db,p,target){
  const player=playerRef(db,p),dst=teamRef(db,target);
  if(!player)return {ok:false,reason:'선수를 찾을 수 없습니다'};
  if(!dst||dst.active===false)return {ok:false,reason:'이동할 팀을 찾을 수 없습니다'};
  const src=player.team&&db.teams[player.team];if(!src||src.active===false)return {ok:false,reason:'현재 소속팀이 없습니다'};
  if(src.id===dst.id)return {ok:false,reason:'이미 해당 스쿼드 소속입니다'};
  const srcParent=parentTeamOf(db,src),dstParent=parentTeamOf(db,dst);
  if(!srcParent||!dstParent||srcParent.id!==dstParent.id)return {ok:false,reason:'같은 구단의 1군/2군 사이에서만 이동할 수 있습니다'};
  const rules=rosterRulesForTeam(db,srcParent);if(!reserveTeamsOf(db,srcParent).length)return {ok:false,reason:'이 구단은 산하 2군을 운영하지 않습니다'};
  const srcIsFirst=!src.parent,dstIsFirst=!dst.parent;if(srcIsFirst===dstIsFirst)return {ok:false,reason:'콜업/샌드다운은 1군과 산하 2군 사이에서만 가능합니다'};
  const srcMin=srcIsFirst?rules.firstTeamMin:rules.reserveTeamMin,dstMax=dstIsFirst?rules.firstTeamMax:rules.reserveTeamMax;
  if((src.roster||[]).length-1<srcMin)return {ok:false,reason:(srcIsFirst?'1군':'2군')+' 최소 '+srcMin+'명을 유지해야 합니다'};
  if((dst.roster||[]).length+1>dstMax)return {ok:false,reason:(dstIsFirst?'1군':'2군')+' 최대 '+dstMax+'명을 초과할 수 없습니다'};
  const total=organizationRoster(db,srcParent).length;if(total<rules.integratedMin||total>rules.integratedMax)return {ok:false,reason:'통합 로스터는 '+rules.integratedMin+'~'+rules.integratedMax+'명이어야 합니다'};
  return {ok:true,kind:dstIsFirst?'callup':'senddown',from:src.id,to:dst.id,parent:srcParent.id};
}
function movePlayerBetweenSquads(db,p,target){const player=playerRef(db,p),check=rosterMoveCheck(db,player,target);if(!check.ok)throw new Error(check.reason);assignPlayerToTeam(db,player,target);if(db.world)recordPlayerEvent(player,'squad_move',db.year,{from:check.from,to:check.to,kind:check.kind,date:db.worldDate});return check}
function playerRef(db,p){return typeof p==='string'?db.players[p]:p}
function teamRef(db,t){return typeof t==='string'?db.teams[t]:t}
function removePlayerFromTeam(db,p){
  const player=playerRef(db,p);if(!player)return null;
  const oldId=player.team;
  for(const t of Object.values(db.teams))if(t.roster&&t.roster.includes(player.id))t.roster=t.roster.filter(id=>id!==player.id);
  player.team=null;
  return oldId;
}
function assignPlayerToTeam(db,p,t){
  const player=playerRef(db,p),team=teamRef(db,t);
  if(!player)throw new Error('Unknown player');
  if(!team)throw new Error(`Unknown team: ${typeof t==='string'?t:'?'}`);
  const oldTeam=player.team&&db.teams[player.team],oldOrg=oldTeam?(oldTeam.parent||oldTeam.id):null,newOrg=team.parent||team.id;
  for(const other of Object.values(db.teams))if(other.id!==team.id&&other.roster&&other.roster.includes(player.id))other.roster=other.roster.filter(id=>id!==player.id);
  team.roster=Array.from(new Set([...(team.roster||[]),player.id]));player.team=team.id;
  if(typeof pState==='function'){pState(player);if(oldOrg!==newOrg){player.teamAdaptation=oldOrg?45:55;player.tacticalAdaptation=oldOrg?48:58}}
  return player;
}
function rosterIntegrityErrors(db){
  const errors=[],seen=new Map();
  for(const t of Object.values(db.teams)){
    const roster=t.roster||[];
    const local=new Set();
    for(const pid of roster){
      if(local.has(pid))errors.push(`duplicate roster entry ${t.id}:${pid}`);else local.add(pid);
      const p=db.players[pid];
      if(!p){errors.push(`missing player ${pid} in ${t.id}`);continue}
      if(p.team!==t.id)errors.push(`team mismatch ${pid}: player=${p.team||'FA'}, roster=${t.id}`);
      const prev=seen.get(pid);if(prev&&prev!==t.id)errors.push(`player ${pid} listed by ${prev} and ${t.id}`);else seen.set(pid,t.id);
    }
  }
  for(const p of Object.values(db.players)){
    if(!p.team)continue;
    const t=db.teams[p.team];
    if(!t)errors.push(`player ${p.id} references missing team ${p.team}`);
    else if(!(t.roster||[]).includes(p.id))errors.push(`player ${p.id} references ${p.team} but is absent from roster`);
  }
  return errors;
}

function genTeam(db,rng,regionId,strength,o={}){
  const on=o.name?{name:o.name,short:o.short}:orgName(db,rng), subs=db.worldConfig.subs||0;
  const t={id:on.short,name:on.name,short:on.short,region:regionId,division:o.div||1,parent:o.parent||null,active:true,fans:baseFans(strength-4-(o.div===2?15:0),rng),coach:genCoach(rng,strength+2),tactics:genTactics(rng),training:defaultTraining(),philosophy:o.parent?'youth':rng.pick(PHILOSOPHIES),roster:[],founded:db.year};
  db.teams[t.id]=t;
  const tb=strength+rng.normal(0,3);
  for(const role of ROLES){const age=o.parent?rng.int(17,20):rng.int(18,27);genPlayer(db,rng,{role,age,base:tb+(age<20?-4:0),region:regionId,team:t.id})}
  for(let i=0;i<subs;i++){const age=rng.int(17,20);genPlayer(db,rng,{role:rng.pick(ROLES),age,base:tb-7,region:regionId,team:t.id})}
  initFinance(db,t,rng);t.roster.forEach(id=>signContract(db,db.players[id],t,marketSalary(db,db.players[id],regionId),rng.int(1,3)));
  return t;
}
function makeAcademy(db,rng,parent){
  const R=db.regions[parent.region];let short=parent.short+'C';while(db.teams[short])short=parent.short+String.fromCharCode(65+rng.int(0,25));
  return genTeam(db,rng,R.id,R.strength-9,{div:2,parent:parent.id,name:parent.name+' Challengers',short});
}
function createDiv2(db,rng,R){
  R.div2=true;
  if(R.system==='franchise'){for(const t of activeTeams(db,R.id,1))makeAcademy(db,rng,t)}
  else{const n=R.div2Teams||Math.max(6,Math.min(10,activeTeams(db,R.id,1).length));for(let i=0;i<n;i++)genTeam(db,rng,R.id,R.strength-8,{div:2})}
}
function abolishDiv2(db,R){R.div2=false;for(const t of activeTeams(db,R.id,2))foldTeam(db,t)}
function markFranchised(db,R){const ts=activeTeams(db,R.id,1).sort((a,b)=>(b.fans||0)-(a.fans||0));ts.forEach((t,i)=>t.franchised=i<Math.ceil(ts.length/2))}
function addRegion(db,rng,cfg){
  const R={office:PRESET_OFFICE[cfg.id]||'conservative',...cfg,talent:cfg.strength,joined:db.year,lastPlacement:null,metrics:[],decisions:[]};
  db.regions[R.id]=R;
  let made=0;
  if(R.templates) for(const tt of TEAM_TEMPLATES.slice(0,R.teams)){
    const t={id:tt.id,name:tt.name,short:tt.short,region:R.id,division:1,active:true,fans:baseFans(tt.base,rng),coach:{...tt.coach,development:tt.coach.analysis},tactics:{...tt.tactics},training:defaultTraining(),philosophy:rng.pick(PHILOSOPHIES),roster:[],founded:db.year};
    db.teams[tt.id]=t;
    for(const [nick,role,age,style,sig] of tt.players)genPlayer(db,rng,{id:tt.id+'_'+role,name:nick,role,age,style,sig,base:tt.base,region:R.id,team:tt.id});
    for(let i=0;i<(db.worldConfig.subs||0);i++)genPlayer(db,rng,{role:rng.pick(ROLES),age:rng.int(17,20),base:tt.base-8,region:R.id,team:tt.id});
    initFinance(db,t,rng);t.roster.forEach(id=>signContract(db,db.players[id],t,marketSalary(db,db.players[id],R.id),rng.int(1,3)));
    made++;
  }
  for(let i=made;i<R.teams;i++) genTeam(db,rng,R.id,R.strength+rng.normal(0,3.5));
  if(R.system==='mixed')markFranchised(db,R);
  if(R.div2){R.div2=false;createDiv2(db,rng,R)}
  R.baseSlots=R.slots;
  // 샐러리플로어에 맞춰 초기 연봉 조정
  if(R.salaryFloor>0)for(const t of activeTeams(db,R.id,1)){const pay=payroll(db,t);if(pay<R.salaryFloor&&pay>0){const k=R.salaryFloor/pay;t.roster.forEach(id=>{const p=db.players[id];if(p.contract)p.contract.salary=Math.round(p.contract.salary*k*10)/10})}}
  for(let i=0;i<Math.ceil(R.teams*0.6);i++) genPlayer(db,rng,{role:rng.pick(ROLES),age:rng.int(17,19),base:R.strength-11+rng.normal(0,5),region:R.id});
  return R;
}
function buildWorld(cfg){
  cfg=JSON.parse(JSON.stringify(cfg||defaultWorldConfig()));
  const db={version:12,saveId:'save-'+Date.now().toString(36),manager:{id:'manager-human',teamId:null,startMode:null,careerStartedAt:null},worldDate:`${cfg.startYear||2027}-01-01`,coachPool:[],awards:[],hof:[],global:{decisions:[],power:{}},patch:buildPatch(),teams:{},players:{},regions:{},competitions:{},worldConfig:cfg,world:null,history:[],news:[],year:cfg.startYear||2027,configDirty:false,scout:{}};
  const rng=new RNG('world-v7','gen');
  initPatches(db);
  for(const r of cfg.regions) addRegion(db,rng,r);
  prepareFirstSeasonFreeAgency(db);
  return db;
}
function managedTeamId(db){return db.manager&&db.manager.teamId||null}
function managedTeam(db){const id=managedTeamId(db);return id&&db.teams[id]?db.teams[id]:null}
function setManagedTeam(db,teamId){
  if(teamId!==null&&(!db.teams[teamId]||db.teams[teamId].active===false))throw new Error('관리할 수 없는 팀입니다');
  db.manager.teamId=teamId;return teamId;
}
function startCareer(db,teamId,seed){
  if(!db.firstSeasonSetup||!db.firstSeasonSetup.blankRosters)throw new Error('첫 시즌 백지 로스터 세계가 준비되지 않았습니다');
  return beginInitialRosterPhase(db,teamId,seed);
}

function validateConfig(cfg){
  const errs=[], shorts=new Set();
  if(!cfg.regions.length)errs.push('리그가 하나 이상 있어야 합니다');
  for(const r of cfg.regions){
    if(!r.short||shorts.has(r.short))errs.push(`리그 약칭 "${r.short}"이 비었거나 겹칩니다`);shorts.add(r.short);shorts.add(r.short+'2');
    if(r.teams<4||r.teams>16||r.teams%2)errs.push(`${r.leagueName}: 팀 수는 4~16 사이 짝수여야 합니다`);
    if(r.playoffTake>r.teams)errs.push(`${r.leagueName}: 플레이오프 진출 팀이 전체 팀보다 많습니다`);
    if(r.format==='groups_po'&&r.teams<10)errs.push(`${r.leagueName}: 그룹 스테이지 방식은 10팀 이상에서 쓸 수 있습니다`);
    if(r.div2&&r.system!=='franchise'&&(r.div2Teams||6)%2)errs.push(`${r.leagueName}: 하부 리그 팀 수는 짝수여야 합니다`);
  }
  for(const it of cfg.internationals) if(shorts.has(it.id)||shorts.has(it.short))errs.push(`${it.name}: 리그 약칭과 겹칩니다`);
  return errs;
}

// ---------- 리그/시즌 구성 ----------
function divName(R){return R.system==='franchise'?`${R.leagueName} 챌린저스`:`${R.leagueName} 2부`}
function leagueComp(db,rid,div=1){
  const R=db.regions[rid], teams=activeTeams(db,rid,div).filter(t=>div===1||true).map(t=>t.id);
  return {id:div===2?R.short+'2':R.short,name:div===2?divName(R):R.leagueName,short:div===2?R.short+'2':R.short,region:rid,div,teams,rules:{fearless:true},stages:leagueStages(R,teams.length,div)};
}
function startWorldSeason(db,myTeam,seed){
  setManagedTeam(db,myTeam);
  const regs=Object.values(db.regions), I=db.worldConfig.internationals, maxK=Math.max(...regs.map(r=>r.splits||1));
  const steps=[];
  const intlSteps=tm=>{const tops=I.filter(i=>i.timing===tm&&i.tier!=='low').sort((a,b)=>(a.prestige||1)-(b.prestige||1)),lows=I.filter(i=>i.timing===tm&&i.tier==='low');
    const out=tops.map(i=>({kind:'intl',ids:[i.id],label:i.name}));
    if(lows.length){if(out.length){const L=out[out.length-1];L.ids.push(...lows.map(i=>i.id));L.label+=` · ${lows.map(i=>i.name).join(' · ')}`}else out.push({kind:'intl',ids:lows.map(i=>i.id),label:lows.map(i=>i.name).join(' · ')})}
    return out};
  // 3스플릿제: 스플릿1(윈터) → 퍼스트 스탠드 → 스플릿2(스프링) → MSI → 스플릿3(서머) → 월즈. 스플릿이 적은 리그는 뒤쪽 스플릿만 치른다
  const tim={1:'early',2:'mid',3:'end'};
  for(let sp=1;sp<=3;sp++){
    if(regs.some(r=>(r.splits||1)>=4-sp))steps.push({kind:'league',split:sp,label:maxK===1?'정규 시즌':SPLIT_NAME[sp]});
    steps.push(...intlSteps(tim[sp]));
  }
  const manage=db.world?db.world.manage:(db.worldConfig.manage||'manual');
  db.world={year:db.year,seed,manage,phase:'season',seasons:{},steps,step:-1,report:null,lastDate:`${db.year}-01-07`,offers:[],marketLog:[]};
  seasonPatch(db,`${db.year}-01-02`,new RNG(seed+db.year,'patch'));
  setGoals(db);
  advanceStep(db);
}
function seasonLastDate(s){return s.days[s.days.length-1].date}
// 저장 공간 절약: 내 지역이 아닌 리그 경기는 세트 요약만 남긴다
function compactSeason(db,s){
  if(s.compact)return; const my=db.teams[managedTeamId(db)].region; if(s.region===my||db.competitions[s.comp].international)return;
  for(const d of s.days)for(const m of d.matches)if(m.res){const r=m.res;r.games=r.games.map(g=>({n:g.n,blue:g.blue,red:g.red,winner:g.winner,kills:g.kills,dur:g.dur,mvp:g.mvp}));delete r.tac;r.lite=true}
  s.compact=true;
}
function advanceStep(db){
  const w=db.world;
  for(const s of Object.values(w.seasons))if(s.done)compactSeason(db,s);
  for(const s of Object.values(w.seasons)){const d=seasonLastDate(s);if(d>w.lastDate)w.lastDate=d}
  while(true){
    w.step++;
    if(w.step>=w.steps.length){w.phase='offseason';news(db,`${w.year} 시즌 일정이 모두 끝났습니다`);return}
    const st=w.steps[w.step], start=addDays(w.lastDate,st.kind==='intl'?18:(w.step===0?7:14));
    if(st.kind==='league'){
      if(st.split>1&&w.step>0){ // 스플릿 개막: 대형 패치 + 사무국 중간 점검
        const rng=new RNG(w.seed+w.year,'mid');
        const p=newPatch(db,start,true,rng);db.patches.nextDate=addDays(start,db.patches.cadence||14);
        const nc=p.notes.find(n=>n.type==='new');news(db,`${SPLIT_NAME[st.split]} 개막 패치 ${p.id}${nc?` — 신규 챔피언 ${nc.def.name} 출시`:''}`);
        officeMidSeason(db,rng,CHANGE_F[db.worldConfig.changes]??1);
      }
      let any=false;
      for(const R of Object.values(db.regions)){
        if((R.splits||1)<4-st.split)continue;
        for(const div of R.div2?[1,2]:[1]){
          if(activeTeams(db,R.id,div).length<2)continue;
          const comp=leagueComp(db,R.id,div); db.competitions[comp.id]=comp;
          const key=comp.id+'-'+st.split, s=newSeason(db,comp.id,w.year,`${w.seed}/${w.year}/${key}`,start,key);
          s.key=key;s.split=st.split;s.region=R.id;s.div=div;s.step=w.step;s.label=(R.splits||1)>1?SPLIT_NAME[st.split]:'';
          w.seasons[key]=s;any=true;
        }
      }
      if(any)return;
    } else {let any=false;const taken=new Set();for(const id of (st.ids||[st.id]))if(startInternational(db,id,start,taken))any=true;if(any)return}
  }
}
function placements(db,s){
  const comp=db.competitions[s.comp];const reg=standings(db,s,comp.stages[0].id).map(x=>x.tid);
  const out=[s.champion,s.runnerUp].filter(Boolean);for(const t of reg)if(!out.includes(t))out.push(t);return out;
}
function regionPlacements(db,R){
  const w=db.world, act=activeTeams(db,R.id,1).map(t=>t.id);
  const done=[3,2,1].map(sp=>w.seasons[R.short+'-'+sp]).find(s=>s&&s.done);
  let base=done?placements(db,done):(R.lastPlacement||[]);
  base=base.filter(t=>act.includes(t));
  const rest=act.filter(t=>!base.includes(t)).sort((a,b)=>teamStrength(db,b)-teamStrength(db,a));
  return [...base,...rest];
}
function regionPower(db,R){const h=(db.global&&db.global.power||{})[R.id];return h!==undefined?h:R.strength}
function teamStrength(db,tid){const t=db.teams[tid];return avg(ROLES.map(r=>{const p=starterFor(db,t,r);return p?playerOvr(p):40}))}
function startInternational(db,id,start,taken=new Set()){
  const w=db.world, it=db.worldConfig.internationals.find(x=>x.id===id); if(!it)return false;
  const regs=Object.values(db.regions).filter(R=>!it.zone||(INTL_ZONES[it.zone]||[]).includes(R.id)).sort((a,b)=>regionPower(db,b)-regionPower(db,a));
  const topSlots=R=>{const top=db.worldConfig.internationals.find(x=>x.tier!=='low'&&x.timing===it.timing&&x.entry==='slots');return top?Math.max(1,Math.ceil(R.slots*(top.ratio||1))):R.slots};
  const lists=regs.map(R=>{
    if(it.entry==='champions')return regionPlacements(db,R).slice(0,1);
    if(it.entry==='slots')return regionPlacements(db,R).slice(0,Math.max(1,Math.ceil(R.slots*(it.ratio||1))));
    const per=(it.per||2)*(regs.length<=2?2:1);
    if(it.entry==='div2'&&R.div2){const s=[3,2,1].map(sp=>w.seasons[R.short+'2-'+sp]).find(s=>s&&s.done);if(s)return placements(db,s).filter(t=>!taken.has(t)).slice(0,per)}
    // 'next' (또는 하부 리그 없는 지역): 상위 대회 진출권 바로 다음 순위부터, 같은 기간 다른 대회에 이미 나간 팀은 건너뜀
    return regionPlacements(db,R).slice(topSlots(R)).filter(t=>!taken.has(t)).slice(0,per);
  }).map(l=>l.filter(t=>!taken.has(t)));
  const teams=[];for(let k=0;k<6;k++)for(const l of lists)if(l[k])teams.push(l[k]);
  if(teams.length<4)return false;
  teams.forEach(t=>taken.add(t));
  db.competitions[id]={id,name:it.name,short:it.short||id,teams,rules:{fearless:true},international:true,tier:it.tier||'top',stages:intlStages(it.format,teams,it.bo)};
  const s=newSeason(db,id,w.year,`${w.seed}/${w.year}/${id}`,start,id);
  s.key=id;s.label='';s.step=w.step;w.seasons[id]=s;
  s.stagesInfo=db.competitions[id].stages.map(x=>x.name).join(' → ');
  news(db,`${it.name} 개막 — ${teams.length}팀 참가 (${INTL_FORMATS[it.format]||it.format})`);
  return true;
}
function activeSeasons(db){return Object.values(db.world.seasons).filter(s=>!s.done)}
function nextDate(db){const a=activeSeasons(db);if(!a.length)return null;return a.map(s=>s.days[s.cur].date).sort()[0]}
function playWorldDay(db){
  const w=db.world; if(w.phase!=='season')return null;
  const d=nextDate(db); if(!d){advanceStep(db);return {date:null,played:[]}}
  db.worldDate=d;
  patchTick(db,d,new RNG(w.seed+d,'patch'));
  dailyRecovery(db);
  const played=[];
  for(const s of activeSeasons(db)) if(s.days[s.cur].date===d){const day=playDay(db,s);played.push({s,day});scoutFromDay(db,s,day)}
  if(!activeSeasons(db).length) advanceStep(db);
  return {date:d,played};
}
function news(db,text){db.news.unshift({year:db.world?db.world.year:db.year,text});if(db.news.length>250)db.news.length=250}

// ---------- 오프시즌 1단계: 기록·성장·은퇴·승강·흥행·재정·사무국 ----------
function runOffseason(db){
  const w=db.world, rng=new RNG(w.seed+'/'+w.year,'offseason'), f=CHANGE_F[db.worldConfig.changes]??1;
  const rep={year:w.year,growth:[],retired:[],signings:[],resign:[],expired:[],transfers:[],events:[]};
  const ev=t=>{rep.events.push(t);news(db,t)};
  const games={}, champGames={};
  for(const s of Object.values(w.seasons)){
    const cname=db.competitions[s.comp].name+(s.label?' '+s.label:'');
    for(const [pid,st] of Object.entries(s.pstats)){const p=db.players[pid];if(!p||p.retired)continue;
      games[pid]=(games[pid]||0)+st.g;champGames[pid]=champGames[pid]||{};
      for(const [c,[n]] of Object.entries(st.champs))champGames[pid][c]=(champGames[pid][c]||0)+n;
      const tm=p.team&&db.teams[p.team],value=typeof playerMarketValue==='function'?playerMarketValue(db,p):0;
      p.career.push({year:w.year,seasonId:s.id,comp:s.comp,cname,team:p.team,division:tm?(tm.division||1):null,squad:playerSquadLabel(db,p),international:!!db.competitions[s.comp].international,ovr:playerOvr(p),reputation:p.reputation||0,marketValue:value,salary:p.contract?p.contract.salary:null,contractUntil:p.contract?p.contract.until:null,g:st.g,w:st.w,k:st.k,d:st.d,a:st.a,cs:st.cs,dmg:st.dmg,gold:st.gold||0,dmgTaken:st.dmgTaken||0,vision:st.vision||0,objectives:st.objectives||0,csDiff:st.csDiff||0,goldDiff:st.goldDiff||0,laneAdv:st.laneAdvGames?st.laneAdvSum/st.laneAdvGames:0,teamfightDmg:st.teamfightDmg||0,teamfights:st.teamfights||0,teamfightWins:st.teamfightWins||0,teamfightShare:st.g?st.teamfightShareSum/st.g:0,kp:st.g?st.kpSum/st.g:0,min:st.min,mvp:st.mvp,rating:st.g&&st.ratingSum?st.ratingSum/st.g:null});}
    if(s.champion)db.teams[s.champion].roster.forEach(pid=>{const p=db.players[pid];if(p){p.titles.push(`${w.year} ${cname}`);p.reputation=Math.round(clamp((p.reputation||playerOvr(p))+2,20,99));recordPlayerEvent(p,'title',w.year,{competition:cname,team:s.champion,international:!!db.competitions[s.comp].international})}});
  }
  rep.awards=[];rep.coaches=[];rep.hof=[];
  seasonAwards(db,w,rep);
  for(const p of Object.values(db.players)){const rows=(p.career||[]).filter(c=>c.year===w.year);if(!rows.length)continue;const gamesN=rows.reduce((a,c)=>a+c.g,0),rating=gamesN?rows.reduce((a,c)=>a+(c.rating||6.5)*c.g,0)/gamesN:6.5,intl=rows.some(c=>c.international),awardN=rep.awards.filter(a=>a.pid===p.id).length,target=clamp(playerOvr(p)*.72+rating*3.2+(intl?2:0)+awardN*2,20,99);p.reputation=Math.round(clamp((p.reputation||playerOvr(p))*.72+target*.28,20,99))}
  evalGoals(db,w,rep,ev);
  for(const R of Object.values(db.regions)){const s=finalSeason(w,R);if(s&&s.done)R.lastPlacement=placements(db,s)}
  for(const p of Object.values(db.players)){if(p.retired)continue;const d=growPlayer(db,p,rng,games[p.id]||0,champGames[p.id]||{});if(p.team)rep.growth.push({pid:p.id,d,ovr:playerOvr(p)})}
  rep.growth.sort((a,b)=>b.d-a.d);
  for(const p of Object.values(db.players)){ if(p.retired)continue;
    const o=playerOvr(p), R=db.regions[p.region],dev=ensurePlayerDevelopment(p),declineYears=p.age-(dev.peakAge+1);
    let pr=declineYears<=0?0:declineYears*.06*dev.declineRate+(p.age>=31?.18:0)+(R&&o<R.strength-8?.12:0);
    if(R&&o>=R.strength+5)pr*=.4;
    if(!p.team){p.faYears++;if(p.age>=23&&p.faYears>=2)pr+=0.5;if(p.faYears>=3)pr+=0.6;if(p.faYears>=2&&!p.career.length){delete db.players[p.id];continue}}
    if(rng.chance(pr)){p.retired=true;p.retiredYear=w.year;p.peak=Math.max(o,...p.career.map(c=>c.ovr||0));
      const wasTeam=p.team;
      if(p.team){const oldTeam=p.team;removePlayerFromTeam(db,p);rep.retired.push({pid:p.id,team:oldTeam,age:p.age,ovr:o})}
      if(!p.career.length&&!wasTeam){delete db.players[p.id];continue}
      recordPlayerEvent(p,'retirement',w.year,{team:wasTeam,age:p.age,peak:p.peak});if(hallOfFame(db,p))rep.hof.push(p.id);
      delete p.pool;delete p.tend;delete p.attrs;}
  }
  db.year=w.year+1;
  promotionRelegation(db,w,rng,ev);
  updateHype(db,w);
  closeFinances(db,w,rng,ev);
  if(f>0){
    officeDecisions(db,rng,f,ev);
    globalOffice(db,w,rng,f,ev);
  }
  for(const R of Object.values(db.regions)){const nT=activeTeams(db,R.id).length,k=Math.max(2,Math.round(nT*0.65)),tal=R.talent||R.strength;
    for(let i=0;i<k;i++){const age=rng.int(17,19),b=tal-12+rng.normal(0,5);genPlayer(db,rng,{role:rng.pick(ROLES),age,base:b,region:R.id,pot:Math.round(clamp(b+12+(tal-70)*0.4+rng.normal(4,6),b+2,99))})}}
  for(const k in db.scout)db.scout[k]=Math.round(db.scout[k]*0.85);
  ensureEven(db,rng,ev);
  genCoachPool(db,rng);
  // 훈련 시설: 여유 자금이 있는 AI 구단은 증설 (최대 5단계)
  for(const t of activeTeams(db,null,1)){if(t.id===managedTeamId(db)||(t.facility||2)>=5)continue;const c=facilityCost(db,t);
    if(t.finance.cash>c*3&&rng.chance(['youth','balanced'].includes(t.philosophy)?0.5:0.25)){t.finance.cash=Math.round((t.finance.cash-c)*10)/10;t.facility=(t.facility||2)+1}}
  // 사기: 연봉 불만·출전 기회. 사기가 바닥이면 이적 요청
  for(const t of activeTeams(db)){const before=t.roster.slice();t._pre=before;
    for(const id of t.roster){const p=db.players[id];if(!p||!p.contract)continue;pState(p);
      const fair=marketSalary(db,p,t.region), starter=starterFor(db,t,p.role)===p;
      p.morale=clamp(p.morale*0.8+13+(p.contract.salary<fair*0.7?-12:0)+(starter?4:-8)+(p.personality.ambition>70&&teamStrength(db,t.id)<db.regions[t.region].strength?-6:0),0,100);
      p.form=0;p.fatigue=5;p.wantsOut=p.morale<30;
      if(p.wantsOut&&t.id===managedTeamId(db))ev(`${p.name} 이적 요청 (사기 ${Math.round(p.morale)})`)}}
  w.sponsorOffers=sponsorOffers(db,db.teams[managedTeamId(db)]);
  w.report=rep; w.phase='market'; w.offers=[]; w.marketLog=[];
  return rep;
}
// ---------- 오프시즌 2단계: 이적 시장 마감 ----------
function closeMarket(db){
  const w=db.world, rng=new RNG(w.seed+'/'+w.year,'market'), rep=w.report;
  const ev=t=>{rep.events.push(t);news(db,t)};
  contractMarket(db,rng,rep,ev);
  ensureEven(db,rng,ev);
  for(const t of activeTeams(db)){const pre=t._pre||[];const now=ROLES.map(r=>starterFor(db,t,r)).filter(Boolean).map(p=>p.id);const changed=now.filter(id=>!pre.includes(id)).length;
    t.synergy=clamp(teamSynergy(t)*0.85+15-changed*8,10,100);delete t._pre;
    if(!t.sponsor&&t.id!==managedTeamId(db)&&rng.chance(0.5)){const o=sponsorOffers(db,t);t.sponsor={...rng.pick(o),until:db.year+0}}}
  for(const R of Object.values(db.regions)){const ts=activeTeams(db,R.id,1);R.teams=ts.length;if(ts.length)R.strength=Math.round(avg(ts.map(t=>teamStrength(db,t.id))))}
  rep.retired.slice(0,3).forEach(r=>news(db,`${db.players[r.pid].name} 은퇴 (${r.age}세)`));
  w.phase='preseason';
}
// 승강: 승강제는 1부 하위 ↔ 2부 상위 교체, 혼합은 프랜차이즈 보호 구단 제외
function promotionRelegation(db,w,rng,ev){
  for(const R of Object.values(db.regions)){
    if(R.system!=='relegation'&&R.system!=='mixed')continue;
    const s=finalSeason(w,R); if(!s||!s.done)continue;
    const k=Math.max(1,R.relegate||1);
    for(const a of activeTeams(db,R.id,2).filter(t=>t.parent)){const on=orgName(db,rng);a.formerNames=[a.name];a.name=on.name;a.parent=null;ev(`${a.formerNames[0]} 독립 구단으로 전환 → ${a.name}`)}
    const down=standings(db,s,'regular').map(x=>x.tid).filter(t=>!(R.system==='mixed'&&db.teams[t].franchised)).slice(-k);
    const s2=finalSeason(w,R,2);
    const up=R.div2&&s2&&s2.done?placements(db,s2).filter(t=>!db.teams[t].parent).slice(0,k):[];
    down.forEach((tid,i)=>{
      const t=db.teams[tid];
      if(up[i]){const u=db.teams[up[i]];t.division=2;u.division=1;u.fans=Math.round((u.fans||10)+8);t.fans=Math.round((t.fans||20)*0.8);ev(`${R.leagueName} 승강: ${u.name} 승격 ↔ ${t.name} 강등`)}
      else{foldTeam(db,t);const nt=genTeam(db,rng,R.id,R.strength-3);if(R.system==='mixed')nt.franchised=false;ev(`${R.leagueName} 강등: ${t.name} → 신생팀 ${nt.name} 합류`)}
    });
  }
}

function ageCurve(age,g){
  const T={mechanical:[[19,3],[21,2],[23,0.8],[25,0],[27,-1],[99,-2.2]],laning:[[19,2.5],[22,1.8],[24,0.6],[26,0],[28,-0.8],[99,-1.8]],combat:[[19,2.5],[22,1.8],[24,0.6],[26,0],[28,-0.8],[99,-1.8]],
    macro:[[19,2.5],[23,2],[26,1],[28,0.3],[30,-0.3],[99,-1]],mental:[[19,2.5],[23,2],[26,1],[28,0.3],[30,-0.3],[99,-1]]}[g];
  for(const [a,v] of T)if(age<=a)return v;return -1;
}
function growPlayer(db,p,rng,games,champGames){
  const team=p.team?db.teams[p.team]:null, before=playerOvr(p),dev=ensurePlayerDevelopment(p);
  const room=clamp((p.pot-before)/10,-0.5,1.5), prof=p.personality.professionalism/100,ageShift=dev.peakAge-25;
  const coach=team?team.coach.development/100:0.45, play=clamp(games/30,0,1);
  const tr=team?team.training:defaultTraining(), tsum=Object.values(tr).reduce((a,b)=>a+b,0)||1;
  for(const g in ATTR_GROUPS){
    // 훈련 포인트는 총 100점 한도: 배분하지 않은 포인트는 버려진다 (나눠 쓰는 만큼만 효과)
    const base=ageCurve(p.age-ageShift,g), train=team?(Math.min(TRAIN_POINTS,tr[g])/TRAIN_POINTS*5-1)*0.9:-0.3;
    pState(p);
    let d=base>0?base*dev.growthRate*(0.45+room*0.6)*(0.7+0.6*prof)*(0.8+0.4*coach)*(0.65+0.55*play)*trainingGrowthMul(team)*facilityMul(team)*(0.9+0.2*p.morale/100):base*dev.declineRate*(1.3-0.6*prof);
    d+=train*(base>0?1:0.5);
    if(d>0)d*=youthMul(p.age);
    d=Math.min(d,growthCap(p.age)); // 한 시즌 영역별 성장 상한 (어릴수록 높음)
    const ceil=Math.min(99,p.pot+6); // 잠재력 + 6을 넘는 능력치는 더 오르지 않음
    for(const a of ATTR_GROUPS[g]){const v=p.attrs[a]+d+rng.normal(0,1.3);p.attrs[a]=Math.round(clamp(d>0&&p.attrs[a]>=ceil?Math.min(v,p.attrs[a]):d>0?Math.min(v,Math.max(ceil,p.attrs[a])):v,20,99))}
  }
  // 챔피언 폭: 공식전 + 스크림 + 훈련 + 난이도 + 학습 능력을 함께 반영
  for(const c in champGames)ensureChampionProfile(db,p,c);
  if(team&&p.pool){const practice=Math.max(2,Math.round((tr.combat+tr.mental)/12*(.7+coach*.5)));Object.entries(p.pool).sort((a,b)=>b[1].mastery-a[1].mastery).slice(0,6).forEach(([c])=>practiceChampion(db,p,c,'training',practice))}
  for(const c of Object.keys(p.pool||{})){const n=champGames[c]||0,pr=ensureChampionProfile(db,p,c),learn=championLearningMultiplier(db,p,c),practiceGain=(pr.scrimSeason||0)*.16+(pr.trainingSeason||0)*.09,officialGain=Math.min(7,n*.42),gain=Math.min(8,(officialGain+practiceGain)*learn*(p.age<22?1.12:1));
    if(n||practiceGain){pr.mastery=Math.round(clamp(pr.mastery+gain,20,99));pr.experience=Math.round(clamp(pr.experience+n*1.5,0,999));pr.confidence=Math.round(clamp(pr.confidence+rng.normal(n?2:1,3),10,99))}
    else {pr.mastery=Math.round(clamp(pr.mastery-rng.range(0,1.8)*(1-(p.attrs.meta_adaptation||50)/180),20,99));if(pr.mastery<36&&Object.keys(p.pool).length>12)delete p.pool[c]}
    if(p.pool[c]){pr.matchup_knowledge=Math.round(clamp(pr.matchup_knowledge+(n?1.5:.35),20,99));pr.scrimSeason=0;pr.trainingSeason=0}}
  if(games>0)p.proSeasons=(p.proSeasons||0)+1;p.age++;
  return playerOvr(p)-before;
}
function playerValue(db,p,team){
  const o=playerOvr(p), up=Math.max(0,p.pot-o);
  const w={'win-now':0.1,'youth':0.6,'balanced':0.3,'superstar':0.15,'cost':0.35}[team.philosophy]||0.3;
  return o+up*w-(team.philosophy==='youth'&&p.age>26?2:0);
}

// ---- 저장용 압축: 능력치·성향·챔피언 폭을 배열로 ----
const ALL_ATTRS=Object.values(ATTR_GROUPS).flat();
function packDB(db){
  const players={};
  for(const [id,p] of Object.entries(db.players)){
    const q={...p};
    if(p.attrs)q.attrs=ALL_ATTRS.map(a=>p.attrs[a]);
    if(p.tend)q.tend=TENDENCIES.map(t=>p.tend[t]);
    if(p.pool)q.pool=Object.fromEntries(Object.entries(p.pool).map(([c,v])=>[c,[v.mastery,v.experience,v.matchup_knowledge,v.confidence,v.scrimExperience||0,v.trainingExperience||0,v.scrimSeason||0,v.trainingSeason||0]]));
    players[id]=q;
  }
  return JSON.stringify({...db,players,packed:1});
}
function unpackDB(str){
  const db=JSON.parse(str); if(!db.packed)return db;
  for(const p of Object.values(db.players)){
    if(Array.isArray(p.attrs))p.attrs=Object.fromEntries(ALL_ATTRS.map((a,i)=>[a,p.attrs[i]]));
    if(Array.isArray(p.tend))p.tend=Object.fromEntries(TENDENCIES.map((t,i)=>[t,p.tend[i]]));
    if(p.pool)for(const c in p.pool){const v=p.pool[c];if(Array.isArray(v))p.pool[c]={mastery:v[0],experience:v[1],matchup_knowledge:v[2],confidence:v[3],scrimExperience:v[4]||0,trainingExperience:v[5]||0,scrimSeason:v[6]||0,trainingSeason:v[7]||0}}
  }
  delete db.packed; return db;
}

function stepOf(db,s){
  if(s.step!==undefined)return s.step;
  const w=db.world;
  return w.steps.findIndex(st=>st.kind==='league'?st.split===s.split:(st.ids||[st.id]).includes(s.comp));
}