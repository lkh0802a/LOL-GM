// ===== LOL GM: 월드 (Phase 5 성장 + 월드 확장) =====
const WORLD_GENERATION_SEED='world-v7';
// Before a career starts, simulation belongs to the canonical generated world.
// saveId identifies storage/transactions and must never seed gameplay.
function worldSimulationSeed(db){return db.world?.seed||WORLD_GENERATION_SEED}
function genTactics(rng){return {aggression:rng.int(35,80),risk_tolerance:rng.int(30,75),objective_priority:rng.int(45,80),vision_investment:rng.int(45,80),scaling_preference:rng.int(30,75)}}
const PHILOSOPHIES=['win-now','youth','balanced','superstar','cost'];
const PHIL_KO={'win-now':'즉시 전력','youth':'유망주 육성','balanced':'균형','superstar':'스타 영입','cost':'효율 중시'};
const SPLIT_NAME={1:'윈터',2:'스프링',3:'서머'};
// Scheduling periods and season-result aggregation are separate rules.
const SPLIT_STANDINGS_MODES={independent:'스플릿별 독립',cumulative:'정규시즌 전적 누적',points:'챔피언십 포인트 누적'};
// ---------- 지역 프리셋 / 월드 설정 ----------
// 실제 LoL e스포츠 구조를 본뜬 기본 리그 (리그 수준·시장 규모는 고정, 구조만 편집 가능)
const REGION_PRESETS = {
  KR:{name:'한국',leagueName:'LCK',short:'LCK',strength:75,templates:true,tier:'major',d:{teams:12,splits:3,format:'rr_de',playoffTake:6,div2:true,system:'franchise',slots:4}},
  CN:{name:'중국',leagueName:'LPL',short:'LPL',strength:74,tier:'major',d:{teams:16,splits:3,format:'groups_po',playoffTake:8,div2:true,system:'franchise',slots:4}},
  EU:{name:'유럽',leagueName:'LEC',short:'LEC',strength:71,tier:'major',d:{teams:12,splits:3,format:'rr_de',playoffTake:8,system:'franchise',slots:3}},
  NA:{name:'북미',leagueName:'LCS',short:'LCS',strength:68,tier:'major',d:{teams:10,splits:3,format:'rr_de',playoffTake:6,system:'franchise',slots:3}},
  AP:{name:'아시아태평양',leagueName:'LCP',short:'LCP',strength:67,tier:'major',d:{teams:12,splits:3,format:'rr_po',playoffTake:6,system:'mixed',slots:3}},
  BR:{name:'브라질',leagueName:'CBLOL',short:'CBLOL',strength:65,tier:'major',d:{teams:10,splits:3,format:'rr_po',playoffTake:6,system:'franchise',slots:3}},
  VN:{name:'베트남',leagueName:'VCS',short:'VCS',strength:66,tier:'emerging',parent:'AP',d:{teams:10,splits:2,format:'rr_po',playoffTake:6,system:'relegation',slots:3}},
  JP:{name:'일본',leagueName:'LJL',short:'LJL',strength:62,tier:'emerging',parent:'AP',d:{teams:10,splits:2,format:'rr_po',playoffTake:4,system:'franchise',slots:3}},
  TW:{name:'대만·홍콩·마카오',leagueName:'PCS',short:'PCS',strength:64,tier:'emerging',parent:'AP',d:{teams:10,splits:2,format:'rr_po',playoffTake:6,system:'relegation',slots:3}},
  OC:{name:'오세아니아',leagueName:'LCO',short:'LCO',strength:60,tier:'emerging',parent:'AP',d:{teams:10,splits:2,format:'rr_po',playoffTake:4,system:'relegation',slots:3}},
  SEA:{name:'동남아시아',leagueName:'SEA League',short:'SEAL',strength:61,tier:'emerging',parent:'AP',d:{teams:10,splits:2,format:'rr_po',playoffTake:6,system:'relegation',slots:3}},
  TR:{name:'튀르키예',leagueName:'TCL',short:'TCL',strength:62,tier:'emerging',parent:'EU',d:{teams:10,splits:2,format:'rr_po',playoffTake:6,system:'relegation',slots:3}},
  ME:{name:'중동·북아프리카',leagueName:'Arabian League',short:'AL',strength:60,tier:'emerging',parent:'EU',d:{teams:10,splits:2,format:'rr_po',playoffTake:6,system:'franchise',slots:3}},
  CIS:{name:'독립국가연합',leagueName:'LCL',short:'LCL',strength:63,tier:'emerging',parent:'EU',d:{teams:10,splits:2,format:'rr_po',playoffTake:6,system:'relegation',slots:3}},
  LA:{name:'라틴 아메리카',leagueName:'LLA',short:'LLA',strength:62,tier:'emerging',parent:'BR',d:{teams:10,splits:2,format:'rr_po',playoffTake:6,system:'franchise',slots:3}}
};
const INTL_PRESETS=[
  // 국제대회는 1부 프로팀 전용이다. 내부 ID는 공식 명칭을 사용하고 표시 약칭은 별도 보관한다.
  {id:'FIRST_STAND',name:'First Stand',short:'FS',phase:1,tier:1,timing:'early',teams:12,baseSlots:2,format:'first_stand',groupBo:3,knockoutBo:5,prestige:1},
  {id:'MID_SEASON_INVITATIONAL',name:'Mid-Season Invitational',short:'MSI',phase:2,tier:1,timing:'mid',teams:16,baseSlots:2,extraSlots:4,format:'msi_swiss_de',knockoutBo:5,prestige:2},
  {id:'EASTERN_CUP',name:'Eastern Cup',short:'EC',phase:2,tier:2,timing:'mid',zone:'east',teams:8,format:'regional_cup',groupBo:3,knockoutBo:5,prestige:1},
  {id:'WESTERN_CUP',name:'Western Cup',short:'WEC',phase:2,tier:2,timing:'mid',zone:'west',teams:8,format:'regional_cup',groupBo:3,knockoutBo:5,prestige:1},
  {id:'WORLD_CHAMPIONSHIP',name:'World Championship',short:'Worlds',phase:3,tier:1,timing:'end',teams:24,baseSlots:4,maxSlots:4,format:'worlds_league_phase',pots:3,potSize:8,leagueMatches:6,leagueBo:3,knockoutTake:16,knockoutBo:5,prestige:3},
  {id:'MASTERS',name:'Worlds Masters',short:'Worlds Masters',phase:3,tier:2,timing:'end',teams:16,baseSlots:2,maxSlots:3,extraSlots:4,format:'masters_groups',groupBo:3,groupLegs:2,knockoutBo:5,prestige:2},
  {id:'OPEN',name:'Worlds Open',short:'Worlds Open',phase:3,tier:3,timing:'end',teams:12,baseSlots:2,maxSlots:2,format:'open_groups',groupBo:3,groupLegs:1,knockoutBo:5,prestige:1},
];
const INTL_ZONES={east:['KR','CN','AP','VN','JP','TW','OC','SEA'],west:['EU','NA','BR','TR','ME','CIS','LA']};
const ZONE_KO={east:'Eastern',west:'Western'};

function regionCfg(id,over={}){
  const P=REGION_PRESETS[id]||{name:'새 지역',leagueName:'새 리그',short:'NEW',strength:63,d:{}},d=P.d||{};
  return {id,name:P.name,leagueName:P.leagueName,short:P.short,strength:P.strength,templates:!!P.templates,tier:P.tier||'emerging',parent:P.parent||null,
    format:'rr_po',div2:false,div2Teams:8,teams:10,splits:2,standingsMode:'independent',legs:2,regularBo:3,playoffTake:6,playoffBo:5,system:'franchise',relegate:1,slots:3,office:null,
    fearless:true,payScale:null,spendingRule:null,sfrMode:null,sfrTeamShare:0,salaryCap:0,salaryFloor:0,luxuryTax:.5,importLimit:null,importRecruitMinGap:null,rosterRuleProfile:null,marketProfile:null,policyMode:'engine',policyLocks:{},...d,...over,
    spendingRule:null,sfrMode:null,sfrTeamShare:0,salaryCap:0,salaryFloor:0,importLimit:null,importRecruitMinGap:null,rosterRuleProfile:null,marketProfile:null,office:null,payScale:null};
}
function defaultWorldConfig(){return {
  regions:['KR','CN','EU','NA','AP','BR'].map(id=>regionCfg(id)),
  internationals:INTL_PRESETS.map(x=>({...x})),
  // Fictional game balance inputs; these are not Riot scoring values.
  internationalPolicy:{version:1,windowYears:3,weights:{
    FIRST_STAND:1,MID_SEASON_INVITATIONAL:2,EASTERN_CUP:1,WESTERN_CUP:1,
    WORLD_CHAMPIONSHIP:3,MASTERS:2,OPEN:1
  },placementPoints:{champion:8,runnerUp:6,topFour:4,topEight:2,participant:1}},
  subs:1, changes:'normal', startYear:2027, manage:'manual', universalLanguage:true
}}
const WORLD_CHANGE_FREQUENCY=1; // Always the normal office/world evolution rate.

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
  return !!team&&team.active!==false&&(!team.parent||db.teams[team.parent]?.active!==false&&!!db.teams[team.parent]);
}
function managerSelectableTeams(db,rid,div){return activeTeams(db,rid,div).filter(t=>isManagerSelectableTeam(db,t))}
function genTeam(db,rng,regionId,strength,o={}){
  const on=o.name?{name:o.name,short:o.short}:orgName(db,rng), subs=db.worldConfig.subs||0;
  const t={id:on.short,name:on.name,short:on.short,region:regionId,division:o.div||1,parent:o.parent||null,active:true,fans:baseFans(strength-4-(o.div===2?15:0),rng),tactics:genTactics(rng),training:defaultTraining(),philosophy:o.parent?'youth':rng.pick(PHILOSOPHIES),roster:[],founded:db.year};
  db.teams[t.id]=t;
  const tb=strength+rng.normal(0,3);
  for(const role of ROLES){const age=o.parent?rng.int(17,20):rng.int(18,27);genPlayer(db,rng,{role,age,base:tb+(age<20?-4:0),region:regionId,team:t.id})}
  for(let i=0;i<subs;i++){const age=rng.int(17,20);genPlayer(db,rng,{role:rng.pick(ROLES),age,base:tb-7,region:regionId,team:t.id})}
  initFinance(db,t,rng);t.roster.forEach(id=>signContract(db,db.players[id],t,marketSalary(db,db.players[id],regionId),rng.int(1,3)));
  ensureClubLicense(db,t);
  return t;
}
function makeAcademy(db,rng,parent){
  const R=db.regions[parent.region];let short=parent.short+'C';while(db.teams[short])short=parent.short+String.fromCharCode(65+rng.int(0,25));
  return genTeam(db,rng,R.id,R.strength-9,{div:2,parent:parent.id,name:parent.name+' Challengers',short});
}
function reserveRequirement(db,t){
  const team=teamRef(db,t);if(!team||team.parent||(team.division||1)!==1)return 'none';
  const R=db.regions[team.region];if(!R||!R.div2)return 'none';
  if(R.system==='franchise')return 'required';
  if(R.system==='mixed')return team.franchised?'required':'optional';
  return 'optional';
}
function promotionEligible(db,t){
  const team=teamRef(db,t);if(!team||team.active===false||(team.division||1)!==2)return false;
  if(team.parent)return false;
  const R=db.regions[team.region];return !!R&&(R.system==='relegation'||R.system==='mixed');
}
function createDiv2(db,rng,R){
  R.div2=true;
  const first=activeTeams(db,R.id,1);
  if(R.system==='franchise'){
    first.forEach(t=>{t.franchised=true;t.license='franchise';if(!reserveTeamsOf(db,t).length)makeAcademy(db,rng,t)});
  }else if(R.system==='mixed'){
    markFranchised(db,R);
    first.forEach(t=>{t.license=t.franchised?'certified':'open';if(reserveRequirement(db,t)==='required'&&!reserveTeamsOf(db,t).length)makeAcademy(db,rng,t)});
    const target=R.div2Teams||Math.max(8,Math.min(12,first.length));
    const independent=Math.max(4,target-activeTeams(db,R.id,2).length);
    for(let i=0;i<independent;i++)genTeam(db,rng,R.id,R.strength-8,{div:2});
  }else{
    first.forEach(t=>{t.franchised=false;t.license='open'});
    const n=R.div2Teams||Math.max(6,Math.min(10,first.length));
    for(let i=0;i<n;i++)genTeam(db,rng,R.id,R.strength-8,{div:2});
  }
  if(R.policyMode==='engine'&&!R.policyLocks?.rosterRuleProfile)R.rosterRuleProfile=activeTeams(db,R.id,2).some(t=>t.parent)?'ENGINE_OWNED_RESERVE':'STANDARD_TIER1_2026';
  for(const t of activeTeams(db,R.id))syncClubLicense(db,t,'tier2-structure-review');
}
function abolishDiv2(db,R){R.div2=false;for(const t of activeTeams(db,R.id,2))foldTeam(db,t);if(R.policyMode==='engine'&&!R.policyLocks?.rosterRuleProfile)R.rosterRuleProfile='STANDARD_TIER1_2026'}
function reconcileTier2Structure(db,rng,R,ev=()=>{}){
  if(!R||!R.div2)return;
  const first=activeTeams(db,R.id,1);
  if(R.system==='franchise'){
    first.forEach(t=>{t.franchised=true;t.license='franchise';if(!reserveTeamsOf(db,t).length){const a=makeAcademy(db,rng,t);ev(`${t.name} 산하 2군 창단: ${a.name}`)}});
  }else if(R.system==='mixed'){
    first.forEach(t=>{
      t.license=t.franchised?'certified':'open';
      if(t.franchised&&!reserveTeamsOf(db,t).length){const a=makeAcademy(db,rng,t);ev(`${t.name} 인증 유지용 산하 2군 창단: ${a.name}`)}
    });
  }
  for(const a of activeTeams(db,R.id,2).filter(t=>t.parent)){
    const parent=db.teams[a.parent];
    if(!parent||parent.active===false||parent.region!==R.id||(parent.division||1)!==1||reserveRequirement(db,parent)!=='required'){
      foldTeam(db,a);ev(`${a.name} 산하 2군 운영 종료`);
    }
  }
  if(R.policyMode==='engine'&&!R.policyLocks?.rosterRuleProfile)R.rosterRuleProfile=activeTeams(db,R.id,2).some(t=>t.parent)?'ENGINE_OWNED_RESERVE':'STANDARD_TIER1_2026';
  for(const t of activeTeams(db,R.id))syncClubLicense(db,t,'tier2-structure-review');
}
function markFranchised(db,R){const ts=activeTeams(db,R.id,1).sort((a,b)=>(b.fans||0)-(a.fans||0));ts.forEach((t,i)=>t.franchised=i<Math.ceil(ts.length/2))}
function deriveRegionPayScale(R){
  const strength=R.strength||63,teams=R.teams||8,tierBoost=R.tier==='major'?.12:0,parentAdj=R.parent?-.08:0;
  return Math.round(clamp(.28+(strength-58)*.045+Math.log2(Math.max(4,teams)/8)*.08+tierBoost+parentAdj,.22,1.35)*100)/100;
}
function inferRegionPolicy(db,R){
  if(!R||R.policyMode!=='engine')return R;
  const teams=activeTeams(db,R.id,1),n=Math.max(1,teams.length);
  const owners=teams.map(t=>t.owner&&t.owner.wealth||50),ownerAvg=avg(owners),fans=teams.map(t=>t.fans||30),fanAvg=avg(fans);
  const pays=teams.map(t=>topFivePayroll(db,t)).filter(x=>x>0).sort((a,b)=>a-b),med=pays.length?pays[Math.floor(pays.length/2)]:Math.max(1,8*psOf(db,R.id)),disp=pays.length>1?pays[pays.length-1]/Math.max(.1,pays[0]):1;
  const locals=Object.values(db.players).filter(p=>!p.retired&&isLocalPlayer(p,R.id)&&playerOvr(p)>=R.strength-10).length/n,reserveOwned=R.div2&&activeTeams(db,R.id,2).some(t=>t.parent);
  R.rosterRuleProfile=reserveOwned?'ENGINE_OWNED_RESERVE':'STANDARD_TIER1_2026';
  const importNeed=clamp((6-locals)/4+(R.strength<66?.25:0)+(fanAvg>50?.15:0),0,1.5),spendPower=clamp((ownerAvg-45)/35+(R.payScale-.55),0,2);
  R.marketProfile=spendPower>=1.15?'high_spend':importNeed>=.75?'open_market':locals>=7?'domestic_development':'balanced';
  R.importLimit=FIRST_TEAM_NON_LOCAL_LIMIT; // legacy field: 1군 비로컬 상한은 글로벌 2명 고정
  R.reserveImportLimit=clamp(Math.round(1+importNeed+(R.marketProfile==='open_market'?.7:0)),1,4);
  R.importRecruitMinGap=clamp(Math.round(3-importNeed*2-spendPower*.45),0,4);
  const pressure=n>=8&&disp>=2.65&&ownerAvg>=52;
  R.spendingRule=pressure?'sfr_top5':'none';
  if(pressure){R.sfrMode='engine_progressive';R.sfrTeamShare=clamp(Math.round((.6+(fanAvg/100)*.25)*100)/100,.6,.85);R.salaryCap=Math.max(1,Math.round(med*(1.35+Math.min(.2,disp/20))));R.salaryFloor=Math.max(0,Math.round(R.salaryCap*clamp(.42+(locals/20),.42,.58)));R.luxuryTax=clamp(Math.round((.55+(disp-2.5)*.18)*100)/100,.5,1.15)}
  else{R.sfrMode=null;R.sfrTeamShare=0;R.salaryCap=0;R.salaryFloor=0;R.luxuryTax=.5}
  const expansionPressure=fanAvg>=52&&locals>=5&&ownerAvg>=55,costPressure=fanAvg<30||ownerAvg<38;
  R.office=costPressure?'conservative':expansionPressure?'expansion':disp>2.4?'balance':spendPower>1?'revenue':'conservative';
  R.policyBasis={year:db.year,teams:n,ownerAvg:Math.round(ownerAvg),fanAvg:Math.round(fanAvg),payDisp:Math.round(disp*100)/100,localDepth:Math.round(locals*10)/10,importNeed:Math.round(importNeed*100)/100,spendPower:Math.round(spendPower*100)/100,reserveOwned,source:'engine'};
  return R;
}

function addRegion(db,rng,cfg){
  const R={...cfg,releaseGuaranteeRate:.5,talent:cfg.strength,joined:db.year,lastPlacement:null,metrics:[],decisions:[]};
  R.payScale=deriveRegionPayScale(R);
  db.regions[R.id]=R;
  let made=0;
  if(R.templates) for(const tt of TEAM_TEMPLATES.slice(0,R.teams)){
    const t={id:tt.id,name:tt.name,short:tt.short,region:R.id,division:1,active:true,fans:baseFans(tt.base,rng),tactics:{...tt.tactics},training:defaultTraining(),philosophy:rng.pick(PHILOSOPHIES),roster:[],founded:db.year};
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
  for(let i=0;i<Math.ceil(R.teams*0.6);i++) genPlayer(db,rng,{role:rng.pick(ROLES),age:rng.int(17,19),base:R.strength-11+rng.normal(0,5),region:R.id});
  inferRegionPolicy(db,R);
  return R;
}
function buildWorld(cfg){
  cfg=JSON.parse(JSON.stringify(cfg||defaultWorldConfig()));
  cfg.changes='normal';
  const db={version:15,saveId:'save-'+Date.now().toString(36),manager:{id:'manager-human',teamId:null,startMode:null,careerStartedAt:null},worldDate:`${cfg.startYear||2027}-01-01`,awards:[],hof:[],global:{decisions:[],power:{}},patch:buildPatch(),teams:{},players:{},regions:{},competitions:{},worldConfig:cfg,world:null,history:[],news:[],year:cfg.startYear||2027,configDirty:false,scout:{}};
  const rng=new RNG(WORLD_GENERATION_SEED,'gen');
  initPatches(db);
  for(const r of cfg.regions) addRegion(db,rng,r);
  for(const t of activeTeams(db))ensureTeamStaff(db,t,rng);genStaffPool(db,rng)
  prepareFirstSeasonFreeAgency(db);
  syncCompetitionLicenses(db,'initial-office-approval');
  return db;
}
function managedTeamId(db){return db.manager&&db.manager.teamId||null}
function managedTeam(db){const id=managedTeamId(db);return id&&db.teams[id]?db.teams[id]:null}
function managedRecruitmentTeamId(db){return managedTeam(db)?.parent?null:managedTeamId(db)}
function managerControlsSquad(db,t){
  const team=teamRef(db,t),mine=managedTeam(db);
  return !!team&&!!mine&&(mine.parent?team.id===mine.id:
    team.id===mine.id||team.parent===mine.id);
}
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
    if(r.teams<10||r.teams%2)errs.push(`${r.leagueName}: 1부 팀 수는 최소 10팀이며 짝수여야 합니다`);
    if(r.playoffTake>r.teams)errs.push(`${r.leagueName}: 플레이오프 진출 팀이 전체 팀보다 많습니다`);
    if(r.standingsMode&&!Object.hasOwn(SPLIT_STANDINGS_MODES,r.standingsMode))
      errs.push(`${r.leagueName}: 지원하지 않는 스플릿 성적 집계 방식입니다`);
    if(r.format==='groups_po'&&r.teams<10)errs.push(`${r.leagueName}: 그룹 스테이지 방식은 10팀 이상에서 쓸 수 있습니다`);
    if(r.div2&&r.system!=='franchise'&&(r.div2Teams||6)%2)errs.push(`${r.leagueName}: 하부 리그 팀 수는 짝수여야 합니다`);
  }
  for(const it of cfg.internationals) if(shorts.has(it.id)||shorts.has(it.short))errs.push(`${it.name}: 리그 약칭과 겹칩니다`);
  return errs;
}
