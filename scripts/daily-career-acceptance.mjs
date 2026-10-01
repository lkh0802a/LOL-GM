import {readFile} from 'node:fs/promises';
import {mkdirSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import {resolve,dirname} from 'node:path';
import {performance} from 'node:perf_hooks';
import {ENGINE_MODULES} from '../scripts/artifact-modules.mjs';
const seasons=Number(process.env.CAREER_SEASONS||100),seed=process.env.CAREER_SEED||'daily-1';
if(!Number.isInteger(seasons)||seasons<1||seasons>100)throw Error('CAREER_SEASONS must be 1..100');
const rows=[],events=[],started=performance.now();
const warnings=[];
const warningThresholds={championShareOverTenYears:.7,metaTopPickShare:.08,
  tenYearMedianAbilityIncrease:8,tenYearMedianSalaryMultiplier:3};
function observeYear(row){
  rows.push(row);
  const recent=rows.slice(-10),old=rows.at(-11);
  if(row.meta.topShare>warningThresholds.metaTopPickShare)warnings.push({year:row.year,type:'meta-concentration',value:row.meta.topShare});
  if(old&&row.ability[1]-old.ability[1]>warningThresholds.tenYearMedianAbilityIncrease)warnings.push({year:row.year,type:'ability-inflation',from:old.ability[1],to:row.ability[1]});
  if(old&&old.salary[1]>0&&row.salary[1]/old.salary[1]>warningThresholds.tenYearMedianSalaryMultiplier)warnings.push({year:row.year,type:'salary-inflation',from:old.salary[1],to:row.salary[1]});
  if(recent.length===10)for(const c of row.champions){
    const matching=recent.flatMap(x=>x.champions).filter(x=>x.competition===c.competition);
    const share=matching.filter(x=>x.champion===c.champion).length/Math.max(1,matching.length);
    if(matching.length===10&&share>warningThresholds.championShareOverTenYears)warnings.push({year:row.year,type:'champion-monopoly',competition:c.competition,champion:c.champion,share});
  }
}
const reportFile=process.env.CAREER_RESULT_FILE||resolve('reports','daily-career-'+seed+'.json');
const memoryMB=Number(process.env.CAREER_MEMORY_MB||1536);
if(!Number.isFinite(memoryMB)||memoryMB<128)throw Error('CAREER_MEMORY_MB must be at least 128');
mkdirSync(dirname(reportFile),{recursive:true});
const persist=(status,error=null)=>writeFileSync(reportFile,JSON.stringify({seed,
  requestedSeasons:seasons,completedSeasons:rows.length,status,
  elapsedMs:performance.now()-started,error,warningThresholds,warnings,rows,events},null,2));
persist('running');
const source=(await Promise.all(ENGINE_MODULES.map(f=>readFile(new URL('../src/artifact/'+f,import.meta.url),'utf8')))).join('\n');
let error=null;
try{vm.runInNewContext(source+String.raw`
(()=>{
 const check=(x,m)=>{if(!x)throw Error('DAILY_CAREER '+m)};
 const cfg=defaultWorldConfig();
 cfg.regions=[regionCfg('NA',{teams:10,splits:1,legs:1,regularBo:1,playoffBo:3,playoffTake:4,div2:false,system:'franchise',format:'rr_po'}),regionCfg('EU',{teams:10,splits:1,legs:1,regularBo:1,playoffBo:3,playoffTake:4,div2:true,div2Teams:8,system:'relegation',format:'rr_po'})];
 cfg.internationals=[{id:'DAILY_WORLD',name:'Long-career international',short:'LCI',tier:1,timing:'end',teams:8,baseSlots:4,maxSlots:4,format:'swiss_ko',bo:3,prestige:3}];cfg.subs=1;
 let db=buildWorld(cfg);let teamId=activeTeams(db,'NA',1)[0].id;
 startCareer(db,teamId,__seed);db.world.manage='ai';
 autoBuildInitialSquad(db,db.teams[teamId],new RNG(__seed,'founding'),6);finalizeInitialRosters(db);
 const quantiles=values=>{const xs=values.slice().sort((a,b)=>a-b);return [.1,.5,.9].map(q=>xs[Math.floor((xs.length-1)*q)]??null)};
 const checkpoint=()=>{const date=db.worldDate,phase=db.world.phase,pending=!!db.world.pendingOfficial;db=unpackDB(packDB(db));check(db.worldDate===date&&db.world.phase===phase&&!!db.world.pendingOfficial===pending,'resume lost clock/phase/pending');};
 for(let cycle=0;cycle<__seasons;cycle++){
  const year=db.year,begin=performance.now();let ticks=0,operations=0,pendingGames=0,pendingSaved=false;
  while(db.world.phase==='season'&&ticks<1200&&operations++<5000){
   if(db.world.pendingOfficial){
    if(!pendingSaved){checkpoint();pendingSaved=true;}
    const selection=pendingOfficialSelectionSetup(db);
    if(selection){const kind=selection.prompt.mode==='first'?'order':selection.prompt.remaining;applyPendingOfficialSelection(db,{kind,value:kind==='order'?'first':'blue'});}
    const setup=pendingOfficialDraftSetup(db);check(setup,'missing interactive draft');
    const matchDb=seriesOfficialView(db,setup.session),draft=runDraft(matchDb,[setup.blue,setup.red],new RNG(setup.gseed,'draft'),setup.draftCtx);
    resolvePendingOfficialMatch(db,draft);pendingGames++;
   }else{
    const old=db.worldDate,out=playWorldDay(db);if(out.advanced){ticks++;check(out.date===old||out.date===addDays(old,1),'skipped calendar date');}
   }
  }
  check(operations<5000&&ticks<1200&&db.world.phase==='offseason','season stalled '+year);
  const ss=Object.values(db.world.seasons),fixtures=ss.flatMap(s=>s.days.flatMap(d=>d.matches));
  check(ss.length&&ss.every(s=>s.done&&s.champion),'unfinished competition');
  check(fixtures.every(m=>m.res)&&new Set(fixtures.map(m=>m.id)).size===fixtures.length,'missing/duplicate fixture');
  check(!rosterIntegrityErrors(db).length,'roster damaged before offseason');
  const meta=Object.values(db.metaStats||{}),metaPicks=meta.map(x=>x.p||0),metaTotal=metaPicks.reduce((s,v)=>s+v,0);
  const patchCount=db.patches.list.length,champions=ss.map(s=>({competition:s.comp,region:s.region,division:s.div||1,champion:s.champion}));
  checkpoint();const report=runOffseason(db);check(db.year===year+1&&db.world.phase==='market','year handoff');
  __event({year,events:report.events});checkpoint();closeMarket(db);
  check(db.world.phase==='preseason'&&!rosterIntegrityErrors(db).length&&!talentSupplyErrors(db).length,'market integrity');
  for(const p of Object.values(db.players))if(!p.retired)check(Object.values(p.attrs).every(Number.isFinite),'invalid player attribute '+p.id);
  for(const t of activeTeams(db)){check(Number.isFinite(t.finance.cash),'invalid cash '+t.id);check(ROLES.every(r=>starterFor(db,t,r)),'missing starter '+t.id);}
  const saved=packDB(db),players=Object.values(db.players).filter(p=>!p.retired),cash=activeTeams(db).map(t=>t.finance.cash);
  __row({year,ticks,pendingGames,fixtures:fixtures.length,champions,patches:patchCount,players:players.length,allPlayers:Object.keys(db.players).length,teams:activeTeams(db).length,ability:quantiles(players.map(playerOvr)),cash:quantiles(cash),salary:quantiles(players.filter(p=>p.contract).map(p=>p.contract.salary)),marketValue:quantiles(players.map(p=>playerMarketValue(db,p))),meta:{pickedChampions:metaPicks.filter(x=>x>0).length,topShare:metaTotal?Math.max(0,...metaPicks)/metaTotal:0},saveBytes:new TextEncoder().encode(saved).length,heapBytes:__heap(),ms:performance.now()-begin});
  check(__heap()<__memory,'memory budget exceeded');checkpoint();
  if(cycle+1<__seasons){if(!isManagerSelectableTeam(db,db.teams[teamId])){const next=managerSelectableTeams(db)[0];check(next,'no available coaching job');__event({year,jobChange:{from:teamId,to:next.id}});teamId=next.id;}
   startWorldSeason(db,teamId,__seed);db.world.manage='ai';}
 }
})();`,{console,Date,Math,JSON,Set,Map,WeakMap,Object,Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto,TextEncoder,
 __seed:seed,__seasons:seasons,__row:r=>{observeYear(r);persist('running');console.log('DAILY_CAREER_YEAR '+JSON.stringify(r));},__event:r=>events.push(r),__heap:()=>process.memoryUsage().heapUsed,__memory:memoryMB*1024*1024},{timeout:7_200_000});}
catch(e){error=e.stack;}
persist(error?'failed':'passed',error);
if(error)throw Error(error);
console.log('DAILY_CAREER_ACCEPTANCE PASS '+JSON.stringify({seed,seasons:rows.length}));
