import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('WORLDS_IDENTITY '+m)};
 const aliases=['WORLD_CHAMPIONSHIP','WORLDS','World Championship'],preset=INTL_PRESETS.find(x=>isWorldChampionshipId(x.id));
 check(INTL_PRESETS.length===7&&preset.teams===24&&preset.format==='worlds_league_phase'&&preset.timing==='end'&&preset.prestige===3,'approved preset changed');
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,slots:4,div2:false,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),teams=activeTeams(db,'NA',1);
 for(const t of teams)for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 const base=packDB(db),rows=[];
 for(const id of aliases){
  const d=unpackDB(base),ids=teams.map(t=>t.id);
  d.worldConfig.internationals=[{...preset,id,entry:'slots'}];
  d.worldConfig.internationalPolicy.weights={[id]:3};
  d.competitions[id]={id,name:'World Championship',short:'Worlds',international:true,tier:1,teams:ids,rules:{fearless:false},stages:[{id:'regular',name:'상금 수용',type:'round_robin',legs:1,bestOf:1}]};
  const s=newSeason(d,id,d.year,'worlds-identity',d.worldDate,id);s.key=id;
  s.internationalRegionSnapshot=Object.fromEntries(ids.map(t=>[t,d.teams[t].region]));
  d.world={year:d.year,seed:'worlds-identity',manage:'ai',phase:'season',seasons:{[id]:s},steps:[{kind:'intl',ids:[id]}],step:0,offers:[],marketLog:[]};
  // Resume an actual in-progress legacy bracket, preserving pending keys and seed.
  setWorldCalendarDate(d,s.days[0].date);playDay(d,s);
  const blob=packDB(d),loaded=unpackDB(blob),again=unpackDB(blob),season=loaded.world.seasons[id];
  const old=JSON.parse(JSON.stringify(d));delete old.saveFormat;
  const legacy=unpackDB(JSON.stringify(old));
  check(legacy.version===15&&legacy.world.seasons[id].comp===id&&legacy.worldConfig.internationals[0].id==='WORLD_CHAMPIONSHIP','v15 format-1 legacy save did not restore');
  check(JSON.stringify(again.world.seasons[id])===JSON.stringify(season)&&JSON.stringify(season)===JSON.stringify(unpackDB(packDB(d)).world.seasons[id]),'repeated load changed bracket');
  check(season.comp===id&&season.id===s.id&&season.seed===s.seed,'legacy source identity rewritten');
  check(loaded.worldConfig.internationals.length===1&&loaded.worldConfig.internationals[0].id==='WORLD_CHAMPIONSHIP','future config not canonical');
  check(!startInternational(loaded,'WORLD_CHAMPIONSHIP',loaded.worldDate)&&JSON.stringify(season)===JSON.stringify(again.world.seasons[id]),'duplicate bracket overwrote resumed season');
  while(!season.done){setWorldCalendarDate(loaded,season.days[season.cur].date);playDay(loaded,season)}
  const history=JSON.stringify(loaded.history),source=JSON.stringify(season.days),cashBefore=JSON.stringify(Object.values(loaded.teams).map(t=>t.finance));
  recordInternationalResults(loaded,loaded.world);const archived=JSON.stringify(loaded.global.internationalResults);
  check(loaded.global.internationalResults[0].eventId===season.year+':'+season.id&&loaded.global.internationalResults[0].competitionId===id&&loaded.global.internationalResults[0].weight===3,'event source or weight lost');
  check(latestWorldsRank(loaded,'NA',loaded.year)===1,'legacy rank missing');
  const financeLoaded=unpackDB(packDB(loaded));recordInternationalResults(financeLoaded,financeLoaded.world);
  check(JSON.stringify(financeLoaded.global.internationalResults)===archived&&JSON.stringify(financeLoaded.history)===history&&JSON.stringify(financeLoaded.world.seasons[id].days)===source,'archive changed/repeated after restore');
  check(JSON.stringify(Object.values(financeLoaded.teams).map(t=>t.finance))===cashBefore,'loading retroactively paid prize');
  const annual=unpackDB(packDB(financeLoaded));annual.world.phase='offseason';
  // Manual annual closeout uses the real career/awards/finance/office writers.
  // This tests the existing date policy, not implementation of N02B (#224).
  const report=runOffseason(annual),annualSaved=packDB(annual);
  check(report.year===season.year&&annual.world.phase==='market'&&annual.world.financeClosedYear===season.year,'annual closeout did not complete');
  const annualRestored=unpackDB(annualSaved),annualBefore=packDB(annualRestored),storedWindow=JSON.stringify(annualRestored.world.contractWindow);
  check(runOffseason(annualRestored)===annualRestored.world.report&&packDB(annualRestored)===annualBefore&&JSON.stringify(annualRestored.world.contractWindow)===storedWindow,'restored annual report/contract dates replayed');
  check(JSON.stringify(annualRestored.world.seasons[id].days)===source&&JSON.stringify(annualRestored.history)===history,'annual closeout rewrote past official source');
  const paid={},original=financeCommercialIncome;
  const partial=unpackDB(packDB(financeLoaded));
  partial.teams[ids[0]].finance.history.push({year:partial.world.year,rev:{prize:1},exp:{},net:1,cash:partial.teams[ids[0]].finance.cash});
  const partialBefore=packDB(partial);let rejected=false;
  try{closeFinances(partial,partial.world,new RNG('partial'),()=>{})}catch(e){rejected=e.message.includes('일부')}
  check(rejected&&packDB(partial)===partialBefore,'partial statement was repaid or mutated before rejection');
  rejected=false;try{runOffseason(partial)}catch(e){rejected=e.message.includes('일부')}
  check(rejected&&packDB(partial)===partialBefore,'annual command changed contracts/growth before partial statement rejection');
  financeCommercialIncome=(d,t,w,forecast,prize)=>{paid[t.id]=prize;return original(d,t,w,forecast,prize)};
  try{closeFinances(financeLoaded,financeLoaded.world,new RNG('worlds-identity','finance'),()=>{})}finally{financeCommercialIncome=original}
  const pool=Object.values(paid).reduce((n,x)=>n+x,0);check(Math.abs(pool-45)<1e-9,'Worlds did not pay established 45 pool');
  const settled=packDB(financeLoaded),resumed=unpackDB(settled),beforeDuplicate=packDB(resumed);
  closeFinances(resumed,resumed.world,new RNG('worlds-identity','finance'),()=>{});
  check(packDB(resumed)===beforeDuplicate,'restored annual closeout paid twice');
  // A pre-marker v15 statement remains authoritative; no retroactive correction.
  delete resumed.world.financeClosedYear;const oldPaid=packDB(resumed);
  closeFinances(resumed,resumed.world,new RNG('worlds-identity','finance'),()=>{});
  check(packDB(resumed)===oldPaid,'old paid statement was paid again');
  // Emulate a previously underpaid completed statement. Loading and retrying
  // must not issue an automatic correction or alter that historical amount.
  resumed.teams[ids[0]].finance.history.at(-1).rev.prize=1;
  const underpaid=packDB(resumed),underpaidLoaded=unpackDB(underpaid),underpaidBefore=packDB(underpaidLoaded);
  closeFinances(underpaidLoaded,underpaidLoaded.world,new RNG('underpaid'),()=>{});
  check(packDB(underpaidLoaded)===underpaidBefore,'previously underpaid history automatically corrected');
  const originalSnapshot=JSON.stringify(resumed.world.seasons[id].internationalRegionSnapshot);
  resumed.global.internationalResults[0].weight=7;const prior=JSON.stringify(resumed.global.internationalResults);
  const fixed=unpackDB(packDB(resumed));recordInternationalResults(fixed,fixed.world);
  check(JSON.stringify(fixed.global.internationalResults)===prior&&JSON.stringify(fixed.world.seasons[id].internationalRegionSnapshot)===originalSnapshot,'historical policy/snapshot rewritten');
  // A later annual event is a new canonical writer, never an alias duplicate.
  fixed.world={year:fixed.year+1,seed:'next-worlds',seasons:{},step:0,steps:[]};
  check(startInternational(fixed,id,'2028-08-01')&&Object.keys(fixed.world.seasons).join()==='WORLD_CHAMPIONSHIP','future event did not use canonical ID');
  check(!startInternational(fixed,'WORLDS','2028-08-01'),'future event duplicated');
  rows.push({id,pool,matches:season.days.reduce((n,d)=>n+d.matches.length,0),restore:true,paidOnce:true});
 }
 // The same actual results determine all four prize classes, not fabricated standings.
 const done=unpackDB(base),cid='OTHER';done.competitions[cid]={id:cid,name:'Custom',short:'Worlds',international:true,teams:teams.map(t=>t.id),rules:{fearless:false},stages:[{id:'regular',type:'round_robin',legs:1,bestOf:1}]};
 const season=newSeason(done,cid,done.year,'other-prize',done.worldDate,cid);done.world={year:done.year,seed:'other-prize',manage:'ai',seasons:{[cid]:season},offers:[],marketLog:[]};
 while(!season.done){setWorldCalendarDate(done,season.days[season.cur].date);playDay(done,season)}
 for(const kind of ['international','low','domestic']){
  const d=unpackDB(packDB(done)),c=d.competitions[cid];c.tier=kind==='low'?'low':1;c.international=kind!=='domestic';c.region='NA';
  let pool=0;const original=financeCommercialIncome;financeCommercialIncome=(db,t,w,f,p)=>{pool+=p;return original(db,t,w,f,p)};
  try{closeFinances(d,d.world,new RNG('other-prize'),()=>{})}finally{financeCommercialIncome=original}
  check(Math.abs(pool-(kind==='international'?18:kind==='low'?5:9*psOf(d,'NA')))<1e-9,'other prize policy changed: '+kind);
 }
 const config={internationals:[{...preset,id:'WORLDS',name:'old'},{...preset,name:'canonical'},{...preset,id:'CUSTOM',name:'World Championship'}],internationalPolicy:{weights:{WORLDS:4,CUSTOM:2}}};
 normalizeInternationalConfig(config);const normalized=JSON.stringify(config);normalizeInternationalConfig(config);
 check(JSON.stringify(config)===normalized&&config.internationals.length===2&&config.internationals[0].name==='canonical'&&config.internationals[1].id==='CUSTOM'&&config.internationalPolicy.weights.WORLD_CHAMPIONSHIP===4,'alias collision/custom policy normalization');
 const office=buildWorld(defaultWorldConfig());office.world={year:office.year,seasons:{}};
 const worlds=office.worldConfig.internationals.find(x=>isWorldChampionshipId(x.id)),snapshot=JSON.stringify(worlds);
 // Force only the existing format-review branch; World Championship must keep
 // its approved format even when the ordinary large-field path would change it.
 globalOffice(office,office.world,{chance:p=>p===.1,pick:()=>null,int:()=>0},1,()=>{});
 check(JSON.stringify(worlds)===snapshot,'office changed protected Worlds format/slots/timing');
 const poor=buildWorld(defaultWorldConfig());poor.world={year:poor.year,seasons:{}};poor.worldHype=0;
 poor.worldConfig.internationals=[{...preset,id:'WORLDS',prestige:0}];
 for(const r of Object.values(poor.regions))r.metrics=[{hype:0},{hype:0}];
 worldDecisions(poor,{chance:p=>p===.3,pick:()=>null,int:()=>0},1,()=>{});
 check(poor.worldConfig.internationals.length===1&&poor.worldConfig.internationals[0].id==='WORLD_CHAMPIONSHIP','office abolished or duplicated low-prestige legacy Worlds');
 // Direct actual duplicate annual command must return the existing report.
 const report={year:office.year};office.world.report=report;office.world.phase='market';const ledger=packDB(office);
 check(runOffseason(office)===report&&packDB(office)===ledger,'duplicate annual command mutated world');
 console.log('WORLDS_IDENTITY_ACCEPTANCE '+JSON.stringify({rows,otherPools:[18,5,'9*regionalScale'],canonicalCollision:true,customUntouched:true,officeProtected:true,fullWorldsSeasonNotRun:true}));
})()`,{timeout:60000,filename:'worlds-identity-acceptance.fixture.js'});
