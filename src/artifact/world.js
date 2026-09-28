// ===== LOL GM: 월드 (Phase 5 성장 + 월드 확장) =====
function genTactics(rng){return {aggression:rng.int(35,80),risk_tolerance:rng.int(30,75),objective_priority:rng.int(45,80),vision_investment:rng.int(45,80),scaling_preference:rng.int(30,75)}}
const PHILOSOPHIES=['win-now','youth','balanced','superstar','cost'];
const PHIL_KO={'win-now':'즉시 전력','youth':'유망주 육성','balanced':'균형','superstar':'스타 영입','cost':'효율 중시'};
const SPLIT_NAME={1:'윈터',2:'스프링',3:'서머'};
// 그 해 마지막 스플릿 시즌 (승강·시상·목표 판정 기준)
function finalSeason(w,R,div=1){let best=null;for(const s of Object.values(w.seasons))if(s.region===R.id&&(s.div||1)===div&&s.split&&(!best||s.split>best.split))best=s;return best}
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
  {id:'MASTERS',name:'Masters',short:'Masters',phase:3,tier:2,timing:'end',teams:16,baseSlots:2,maxSlots:3,extraSlots:4,format:'masters_groups',groupBo:3,groupLegs:2,knockoutBo:5,prestige:2},
  {id:'OPEN',name:'Open',short:'Open',phase:3,tier:3,timing:'end',teams:12,baseSlots:2,maxSlots:2,format:'open_groups',groupBo:3,groupLegs:1,knockoutBo:5,prestige:1},
];
const INTL_ZONES={east:['KR','CN','AP','VN','JP','TW','OC','SEA'],west:['EU','NA','BR','TR','ME','CIS','LA']};
const ZONE_KO={east:'Eastern',west:'Western'};

function regionCfg(id,over={}){
  const P=REGION_PRESETS[id]||{name:'새 지역',leagueName:'새 리그',short:'NEW',strength:63,d:{}},d=P.d||{};
  return {id,name:P.name,leagueName:P.leagueName,short:P.short,strength:P.strength,templates:!!P.templates,tier:P.tier||'emerging',parent:P.parent||null,
    format:'rr_po',div2:false,div2Teams:8,teams:10,splits:2,legs:2,regularBo:3,playoffTake:6,playoffBo:5,system:'franchise',relegate:1,slots:3,office:null,
    fearless:true,payScale:null,spendingRule:null,sfrMode:null,sfrTeamShare:0,salaryCap:0,salaryFloor:0,luxuryTax:.5,importLimit:null,importRecruitMinGap:null,rosterRuleProfile:null,marketProfile:null,policyMode:'engine',policyLocks:{},...d,...over,
    spendingRule:null,sfrMode:null,sfrTeamShare:0,salaryCap:0,salaryFloor:0,importLimit:null,importRecruitMinGap:null,rosterRuleProfile:null,marketProfile:null,office:null,payScale:null};
}
function defaultWorldConfig(){return {
  regions:['KR','CN','EU','NA','AP','BR'].map(id=>regionCfg(id)),
  internationals:INTL_PRESETS.map(x=>({...x})),
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
function genTeam(db,rng,regionId,strength,o={}){
  const on=o.name?{name:o.name,short:o.short}:orgName(db,rng), subs=db.worldConfig.subs||0;
  const t={id:on.short,name:on.name,short:on.short,region:regionId,division:o.div||1,parent:o.parent||null,active:true,fans:baseFans(strength-4-(o.div===2?15:0),rng),tactics:genTactics(rng),training:defaultTraining(),philosophy:o.parent?'youth':rng.pick(PHILOSOPHIES),roster:[],founded:db.year};
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
  const R={...cfg,talent:cfg.strength,joined:db.year,lastPlacement:null,metrics:[],decisions:[]};
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
  const db={version:15,saveId:'save-'+Date.now().toString(36),manager:{id:'manager-human',teamId:null,startMode:null,careerStartedAt:null},worldDate:`${cfg.startYear||2027}-01-01`,awards:[],hof:[],global:{decisions:[],power:{}},patch:buildPatch(),teams:{},players:{},regions:{},competitions:{},worldConfig:cfg,world:null,history:[],news:[],year:cfg.startYear||2027,configDirty:false,scout:{}};
  const rng=new RNG('world-v7','gen');
  initPatches(db);
  for(const r of cfg.regions) addRegion(db,rng,r);
  if(typeof ensureTeamStaff==='function'){for(const t of activeTeams(db))ensureTeamStaff(db,t,rng);genStaffPool(db,rng)}
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
    if(r.teams<10||r.teams%2)errs.push(`${r.leagueName}: 1부 팀 수는 최소 10팀이며 짝수여야 합니다`);
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
  db.world={year:db.year,seed,manage,phase:'season',seasons:{},steps,step:-1,report:null,pendingOfficial:null,lastDate:`${db.year}-01-07`,offers:[],marketLog:[]};
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
function teamStrength(db,tid){const t=db.teams[tid];return avg(ROLES.map(r=>{const p=starterFor(db,t,r);return p?playerRoleRating(p,r):40}))}
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
function nextDate(db){let next=null;for(const s of Object.values(db.world.seasons)){if(s.done)continue;const d=s.days[s.cur].date;if(next===null||d<next)next=d}return next}
function nextTeamMatch(db,tid){
  let best=null;for(const s of Object.values(db.world?.seasons||{})){if(s.done)continue;for(let i=s.cur;i<s.days.length;i++){const d=s.days[i],m=d.matches.find(x=>!x.res&&(x.a===tid||x.b===tid));if(m&&(!best||d.date<best.date)){best={date:d.date,opponent:m.a===tid?m.b:m.a,comp:s.comp};break}}}return best;
}
function daysUntil(db,date){return date?Math.max(0,Math.ceil((new Date(date)-new Date(db.worldDate))/86400000)):99}
function trainingRecommendation(db,t){
  const next=nextTeamMatch(db,t.id),days=daysUntil(db,next?.date),roster=t.roster.map(id=>db.players[id]).filter(Boolean),fat=avg(roster.map(p=>p.fatigue||0)),cond=avg(roster.map(p=>p.condition??96));
  const intensity=fat>38||cond<84||days<=1?'light':days>=5&&fat<20&&cond>91?'high':'normal';
  const scrim=days>=2&&fat<42&&cond>80;return {intensity,scrim,next,days,fat,cond};
}
function pendingOfficialRefs(db,q){
  const s=db.world.seasons[q.seasonKey],day=s&&s.days[s.cur],m=day&&day.matches.find(x=>x.id===q.matchId);
  if(!s||!m||m.res)return null;const comp=db.competitions[s.comp],cfgIdx=comp.stages.findIndex(x=>x.id===day.stage),cfg=comp.stages[cfgIdx];
  return {s,day,m,comp,cfg,cfgIdx};
}
function pendingOfficialSession(db){
  const p=db.world&&db.world.pendingOfficial,q=p&&p.queue&&p.queue[0];if(!q)return null;
  const refs=pendingOfficialRefs(db,q);if(!refs)return null;
  if(!q.session)q.session=scheduledSeriesSession(db,refs.s,refs.m).session;
  return {p,q,refs,session:q.session};
}
function pendingOfficialSelectionSetup(db){
  const x=pendingOfficialSession(db);if(!x)return null;
  const me=managedTeamId(db),prompt=seriesSelectionPrompt(db,x.session,me);if(!prompt)return null;
  const last=x.session.games[x.session.games.length-1]||null,score=[x.session.wins[x.session.a],x.session.wins[x.session.b]];
  return {...x.refs,prompt,session:x.session,game:x.session.g,score,lastGame:last,homeTeam:x.refs.m.a};
}
function applyPendingOfficialSelection(db,choice){
  const x=pendingOfficialSession(db);if(!x)throw new Error('No pending official selection');
  return seriesApplyManagedSelection(db,x.session,managedTeamId(db),choice);
}
function pendingOfficialDraftSetup(db){
  const x=pendingOfficialSession(db);if(!x)return null;
  if(!x.session.current&&!x.session.selectionResolved)return null;
  const cur=seriesSessionPrepareGame(db,x.session);if(!cur)return null;
  return {...x.refs,...cur,draftCtx:cur.snap,session:x.session,seasonKey:x.q.seasonKey,pendingDate:x.p.date,game:x.session.g,score:[x.session.wins[x.session.a],x.session.wins[x.session.b]],fearlessUsed:x.session.ctx.used.slice(),homeTeam:x.refs.m.a};
}
function resolvePendingOfficialMatch(db,forcedDraft){
  const w=db.world,p=w&&w.pendingOfficial,q=p&&p.queue&&p.queue[0];if(!q)throw new Error('No pending official match');
  const refs=pendingOfficialRefs(db,q);if(!refs)throw new Error('Pending official match is stale');
  if(!q.session)q.session=scheduledSeriesSession(db,refs.s,refs.m).session;
  const played=playSeriesSessionGame(db,q.session,{bans:forcedDraft.bans,picks:forcedDraft.picks},false);
  if(!played.done)return {game:played.game,done:false,score:played.score,pending:w.pendingOfficial};
  const series=seriesSessionResult(db,q.session);commitScheduledSeries(db,refs.s,refs.m,series);
  const finalized=finalizeCompetitionDay(db,refs.s,refs.day,refs.cfgIdx,refs.cfg);if(finalized)scoutFromDay(db,refs.s,refs.day);
  p.queue.shift();if(!p.queue.length){w.pendingOfficial=null;if(!activeSeasons(db).length)advanceStep(db)}
  return {game:played.game,done:true,score:played.score,rec:series.rec,lines:series.lines,finalized,pending:w.pendingOfficial};
}
function playWorldDay(db){
  const w=db.world;if(w.phase!=='season')return null;
  if(w.pendingOfficial&&w.pendingOfficial.queue&&w.pendingOfficial.queue.length)return {date:w.pendingOfficial.date,played:[],pending:w.pendingOfficial};
  const d=nextDate(db);if(!d){advanceStep(db);return {date:null,played:[],pending:null}}
  db.worldDate=d;patchTick(db,d,new RNG(w.seed+d,'patch'));dailyRecovery(db);
  for(const t of activeTeams(db))aiManageTraining(db,t);
  if(typeof aiReviewRoleConversions==='function')for(const t of activeTeams(db))aiReviewRoleConversions(db,t);
  if(typeof advanceRoleConversionsDay==='function')advanceRoleConversionsDay(db);
  if(typeof aiRunScrims==='function')aiRunScrims(db,new RNG(w.seed+d,'scrim'));
  for(const t of activeTeams(db,null,1))aiManageOwnedReserve(db,t);
  const played=[],queue=[],me=managedTeamId(db);
  for(const [seasonKey,s] of Object.entries(w.seasons))if(!s.done&&s.days[s.cur].date===d){
    const r=playDay(db,s,{deferTeam:me});played.push({s,day:r.day});
    if(r.finalized)scoutFromDay(db,s,r.day);
    for(const x of r.pending)queue.push({seasonKey,matchId:x.matchId,date:d});
  }
  if(queue.length)w.pendingOfficial={date:d,queue};
  else if(!activeSeasons(db).length)advanceStep(db);
  return {date:d,played,pending:w.pendingOfficial};
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
      p.career.push({year:w.year,seasonId:s.id,comp:s.comp,cname,team:p.team,region:tm?tm.region:playerActiveLocalRegion(p),division:tm?(tm.division||1):null,squad:playerSquadLabel(db,p),international:!!db.competitions[s.comp].international,ovr:playerOvr(p),reputation:p.reputation||0,marketValue:value,salary:p.contract?p.contract.salary:null,contractUntil:p.contract?p.contract.until:null,g:st.g,w:st.w,k:st.k,d:st.d,a:st.a,cs:st.cs,dmg:st.dmg,gold:st.gold||0,dmgTaken:st.dmgTaken||0,vision:st.vision||0,objectives:st.objectives||0,csDiff:st.csDiff||0,goldDiff:st.goldDiff||0,laneAdv:st.laneAdvGames?st.laneAdvSum/st.laneAdvGames:0,teamfightDmg:st.teamfightDmg||0,teamfights:st.teamfights||0,teamfightWins:st.teamfightWins||0,teamfightShare:st.g?st.teamfightShareSum/st.g:0,kp:st.g?st.kpSum/st.g:0,min:st.min,mvp:st.mvp,rating:st.g&&st.ratingSum?st.ratingSum/st.g:null});}
    if(s.champion)db.teams[s.champion].roster.forEach(pid=>{const p=db.players[pid];if(p){p.titles.push(`${w.year} ${cname}`);p.reputation=Math.round(clamp((p.reputation||playerOvr(p))+2,20,99));recordPlayerEvent(p,'title',w.year,{competition:cname,team:s.champion,international:!!db.competitions[s.comp].international})}});
  }
  rep.awards=[];rep.coaches=[];rep.hof=[];
  seasonAwards(db,w,rep);
  for(const p of Object.values(db.players)){const rows=(p.career||[]).filter(c=>c.year===w.year);if(!rows.length)continue;const gamesN=rows.reduce((a,c)=>a+c.g,0),rating=gamesN?rows.reduce((a,c)=>a+(c.rating||6.5)*c.g,0)/gamesN:6.5,intl=rows.some(c=>c.international),awardN=rep.awards.filter(a=>a.pid===p.id).length,target=clamp(playerOvr(p)*.72+rating*3.2+(intl?2:0)+awardN*2,20,99);p.reputation=Math.round(clamp((p.reputation||playerOvr(p))*.72+target*.28,20,99))}
  evalGoals(db,w,rep,ev);
  for(const R of Object.values(db.regions)){const s=finalSeason(w,R);if(s&&s.done)R.lastPlacement=placements(db,s)}
  for(const p of Object.values(db.players)){if(p.retired)continue;const d=growPlayer(db,p,rng,games[p.id]||0,champGames[p.id]||{});p.developmentTrail=p.developmentTrail||[];p.developmentTrail.push({year:w.year,ovr:playerOvr(p)});p.developmentTrail=p.developmentTrail.slice(-6);if(p.team)rep.growth.push({pid:p.id,d,ovr:playerOvr(p)})}
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
  ensureEven(db,rng,ev);
  rep.rookies=[];rep.rookieGlobal=rookieGlobalCohort(db);
  for(const R of Object.values(db.regions)){const cls=generateRookieClass(db,R,rng),ri=R.rookieIntake[R.rookieIntake.length-1];rep.rookies.push({region:R.id,count:cls.length,ids:cls.map(p=>p.id),label:ri.label,tiers:ri.tiers,profile:ri.profile})}
  const supplyErrs=talentSupplyErrors(db);if(supplyErrs.length)throw new Error('Talent supply invariant failed before market: '+supplyErrs.slice(0,8).join(' | '));
  for(const t of activeTeams(db)){if(t.id===managedTeamId(db))ensureStaffRoster(t);else ensureTeamStaff(db,t,rng)}ageStaff(db,rng);genStaffPool(db,rng);
  if(typeof ageScoutReports==='function')ageScoutReports(db);
  for(const t of activeTeams(db,null,1))aiManageStaff(db,t,rng);
  for(const t of activeTeams(db))aiManageTraining(db,t);
  // 시설은 플레이어/AI 공통으로 구단 경영진이 자동 관리한다. 전략적 선택이 아닌 유지·증설 행정은 직접 조작하지 않는다.
  for(const t of activeTeams(db,null,1)){const f=ensureFacilities(t),weights=t.philosophy==='youth'?{youth:1,training:.9,recovery:.45,analysis:.5}:t.philosophy==='win-now'?{analysis:1,recovery:.9,training:.55,youth:.3}:t.philosophy==='cost'?{training:.45,analysis:.4,recovery:.4,youth:.35}:{training:.75,analysis:.7,recovery:.65,youth:.6};
    const choices=Object.keys(weights).filter(k=>f[k]<5).sort((a,b)=>weights[b]-weights[a]);for(const k of choices){const cost=facilityCost(db,t,k),reserve=cost*(t.philosophy==='cost'?5:3);if(t.finance.cash>reserve&&rng.chance(.12+.22*weights[k])){upgradeFacility(db,t,k);break}}}
  // 선수 만족도: 한 시즌 누적 출전/역할/계약/성적/국제전/커리어 목표를 결산한다.
  for(const t of activeTeams(db)){t._pre=t.roster.slice();for(const id of t.roster){const p=db.players[id];if(!p||!p.contract)continue;pState(p);p.form=0;p.fatigue=5;}}
  if(typeof offseasonPlayerSatisfaction==='function')offseasonPlayerSatisfaction(db,w,rep,ev);
  w.sponsorOffers=sponsorOffers(db,db.teams[managedTeamId(db)]);
  w.report=rep; w.phase='market'; w.offers=[]; w.negotiations={}; w.marketLog=[];
  return rep;
}
// ---------- 오프시즌 2단계: 이적 시장 마감 ----------
function closeMarket(db){
  const w=db.world, rng=new RNG(w.seed+'/'+w.year,'market'), rep=w.report;
  const ev=t=>{rep.events.push(t);news(db,t)};
  if(typeof closeOpenNegotiationsForDeadline==='function')closeOpenNegotiationsForDeadline(db);
  contractMarket(db,rng,rep,ev);
  ensureEven(db,rng,ev);
  for(const t of activeTeams(db,null,1))aiManageOwnedReserve(db,t);
  for(const t of activeTeams(db)){aiReviewDepthChart(db,t);rebalanceAiRosterRoles(db,t)}
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
    const down=standings(db,s,'regular').map(x=>x.tid).filter(t=>!(R.system==='mixed'&&db.teams[t].franchised)).slice(-k);
    const s2=finalSeason(w,R,2);
    const up=R.div2&&s2&&s2.done?placements(db,s2).filter(t=>promotionEligible(db,t)).slice(0,k):[];
    down.forEach((tid,i)=>{
      const t=db.teams[tid];
      if(up[i]){const u=db.teams[up[i]];t.division=2;u.division=1;u.franchised=false;u.license='open';t.fans=Math.round((t.fans||20)*0.8);u.fans=Math.round((u.fans||10)+8);ev(`${R.leagueName} 승강: ${u.name} 승격 ↔ ${t.name} 강등`)}
      else{foldTeam(db,t);const nt=genTeam(db,rng,R.id,R.strength-3);if(R.system==='mixed'){nt.franchised=false;nt.license='open'}ev(`${R.leagueName} 강등: ${t.name} → 신생팀 ${nt.name} 합류`)}
    });
    reconcileTier2Structure(db,rng,R,ev);
    inferRegionPolicy(db,R);
  }
}

// ---- 저장용 압축: 능력치·성향·챔피언 폭을 배열로 ----
function packMetaHistory(rows){
  return (rows||[]).map(r=>[
    r.date,r.patch,r.comp,r.season,r.year,r.split,r.stage,r.league,r.international?1:0,r.regions||[],
    (r.sides||[]).map(s=>[s.team,s.region,s.win?1:0,(s.picks||[]).map(p=>{const x=typeof p==='string'?{champ:p}:p;return [x.champ,x.role||null,x.player||null,x.items||[],x.runes||[]]})]),
    r.bans||[]
  ]);
}
function unpackMetaHistory(rows){
  return (rows||[]).map(r=>Array.isArray(r)?{date:r[0],patch:r[1],comp:r[2],season:r[3],year:r[4],split:r[5],stage:r[6],league:r[7],international:!!r[8],regions:r[9]||[],sides:(r[10]||[]).map(s=>({team:s[0],region:s[1],win:!!s[2],picks:(s[3]||[]).map(p=>({champ:p[0],role:p[1],player:p[2],items:p[3]||[],runes:p[4]||[]}))})),bans:r[11]||[]}:r);
}
const ALL_ATTRS=Object.values(ATTR_GROUPS).flat();
function seriesResultForSave(r,lite){
  const q={...r};delete q.seed;delete q.firstChoice;
  if(lite&&!q.lite){q.games=(q.games||[]).map(g=>({n:g.n,blue:g.blue,red:g.red,winner:g.winner,kills:g.kills,dur:g.dur,mvp:g.mvp}));delete q.tac;q.lite=true}
  return q;
}
function worldForSave(db){
  const w=db.world;if(!w)return w;const managed=db.teams&&db.teams[managedTeamId(db)],my=managed&&managed.region,seasons={};
  for(const [id,s] of Object.entries(w.seasons||{})){
    if(!s.done){seasons[id]=s;continue}
    const lite=!!(my&&s.region&&s.region!==my&&!db.competitions?.[s.comp]?.international);
    const days=(s.days||[]).map(d=>({...d,matches:(d.matches||[]).map(m=>m.res?{...m,res:seriesResultForSave(m.res,lite)}:m)}));
    seasons[id]={...s,days};if(lite)seasons[id].compact=true;
  }
  return {...w,seasons};
}
function packDB(db){
  const world=worldForSave(db);
  const players={};
  for(const [id,p] of Object.entries(db.players)){
    const q={...p};delete q.secondaryRoles;delete q.roleFamiliarity;
    if(p.attrs)q.attrs=ALL_ATTRS.map(a=>p.attrs[a]);
    if(p.tend)q.tend=TENDENCIES.map(t=>p.tend[t]);
    if(p.pool)q.pool=Object.fromEntries(Object.entries(p.pool).map(([c,v])=>[c,[v.mastery,v.experience,v.matchup_knowledge,v.confidence,v.scrimExperience||0,v.trainingExperience||0,v.scrimSeason||0,v.trainingSeason||0]]));
    players[id]=q;
  }
  const scout=Object.fromEntries(Object.entries(db.scout||{}).filter(([id,r])=>db.players[id]&&!db.players[id].retired&&(typeof r==='number'||(r.knowledge||0)>baseScoutKnowledge(db,db.players[id])||(r.observations||0)>0)));
  const teams=Object.fromEntries(Object.entries(db.teams).map(([id,t])=>{const q={...t};delete q._pre;delete q.coach;delete q.staff;if(q.facilities)delete q.facility;return [id,q]}));
  const patches={...(db.patches||{})};delete patches.base;delete patches.initialBase;const metaHistory=packMetaHistory(db.metaHistory||[]);
  return JSON.stringify({...db,world,teams,players,scout,patches,metaHistory,metaHistoryPacked:1,packed:1});
}
function unpackDB(str){
  const db=JSON.parse(str);
  if(!db.packed){for(const p of Object.values(db.players||{})){delete p.secondaryRoles;delete p.roleFamiliarity}return typeof migrateLegacyStaffState==='function'?migrateLegacyStaffState(db):db}
  if(db.metaHistoryPacked){db.metaHistory=unpackMetaHistory(db.metaHistory||[]);delete db.metaHistoryPacked}
  for(const t of Object.values(db.teams||{}))ensureFacilities(t);
  for(const p of Object.values(db.players)){
    delete p.secondaryRoles;delete p.roleFamiliarity;
    if(Array.isArray(p.attrs))p.attrs=Object.fromEntries(ALL_ATTRS.map((a,i)=>[a,p.attrs[i]]));
    if(Array.isArray(p.tend))p.tend=Object.fromEntries(TENDENCIES.map((t,i)=>[t,p.tend[i]]));
    if(p.pool)for(const c in p.pool){const v=p.pool[c];if(Array.isArray(v))p.pool[c]={mastery:v[0],experience:v[1],matchup_knowledge:v[2],confidence:v[3],scrimExperience:v[4]||0,trainingExperience:v[5]||0,scrimSeason:v[6]||0,trainingSeason:v[7]||0}}
  }
  delete db.packed;
  return typeof migrateLegacyStaffState==='function'?migrateLegacyStaffState(db):db;
}

function stepOf(db,s){
  if(s.step!==undefined)return s.step;
  const w=db.world;
  return w.steps.findIndex(st=>st.kind==='league'?st.split===s.split:(st.ids||[st.id]).includes(s.comp));
}