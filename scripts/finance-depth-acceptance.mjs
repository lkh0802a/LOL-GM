// Phase 12 depth: commercial performance, solvency, facilities, academy cash and UI contracts.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';

import {ENGINE_MODULES} from './artifact-modules.mjs';

let code='';
const root=resolve(import.meta.dirname,'..','src','artifact');
for(const file of ENGINE_MODULES)code+=await readFile(resolve(root,file),'utf8')+'\n';
const tests=String.raw`(()=>{
  const check=(value,message)=>{if(!value)throw new Error(message)};
  const near=(a,b)=>Math.abs(a-b)<.11;
  const world=buildWorld(),teams=activeTeams(world,null,1),club=teams.find(t=>!t.parent);
  check(club&&teams.length>2,'need active clubs');
  const restored=unpackDB(packDB(world)),legacy=restored.teams[club.id];
  delete legacy.facilities.scouting;
  const migration=unpackDB(packDB(restored));
  check(migration.version===15&&migration.saveFormat===2,'save schema/format drift');
  check(migration.teams[club.id].facilities.scouting===1,'legacy facility saves must restore a functioning scouting unit');

  club.goal='final';club.sponsor=null;
  const all=sponsorOffers(world,club),ids=all.map(v=>v.id);
  check(ids.join(',')==='fixed,perf,long','sponsor marketplace must expose distinct contracts');
  check(all[1].milestone==='final'&&all[1].milestoneBonus>0&&all[1].perWin>0,
    'performance deals require actual objectives, not cosmetic labels');
  const before=sponsorMarketStrength(world,club).base;
  club.fans+=20;
  check(sponsorMarketStrength(world,club).base>before,'sponsor guarantees must react to club market appeal');
  club.fans-=20;
  const w={year:world.year,seasons:{FAKE:{done:true,comp:'FAKE',region:club.region,
    div:1,champion:club.id,runnerUp:null,stageData:{}}}};
  world.competitions.FAKE={id:'FAKE',region:club.region,international:false,teams:[]};
  check(sponsorGoalReached(world,club,w,'final'),'domestic final should meet a final milestone');
  club.sponsor={...all[1],until:world.year};
  check(sponsorAchievementBonus(world,club,w)===all[1].milestoneBonus,'earned sponsor bonus not paid');
  check(financeCommercialIncome(world,club,w,true).sponsorMilestone===0,
    'conservative forecast must not guarantee unearned milestone payments');
  check(financeCommercialIncome(world,club,w,false).sponsorMilestone>0,
    'annual settlement must pay an achieved sponsor target');
  w.seasons.FAKE.champion=teams[1].id;w.seasons.FAKE.runnerUp=teams[2].id;
  check(!sponsorGoalReached(world,club,w,'final')&&sponsorAchievementBonus(world,club,w)===0,
    'missed goals must not receive milestone bonuses');
  delete world.competitions.FAKE;
  club.sponsor=null;
  const ai=aiSelectSponsor(world,club);
  check(!!ai&&club.sponsor.until>=world.year&&ai.id===club.sponsor.id,
    'AI club should actually choose a finance-aware sponsor');
  check(aiSelectSponsor(world,club)===null,'AI must not overwrite an active sponsor agreement');

  const f=ensureFacilities(club);
  check(FACILITY_TYPES.length===5&&f.scouting>=1,'scouting campus is not an independent facility');
  const scoutBefore=facilityScoutingBonus(club),knowledgeBefore=scoutingPower(world);
  f.scouting=Math.min(5,f.scouting+1);
  check(facilityScoutingBonus(club)>scoutBefore,'scouting capital must change evaluation effectiveness');
  f.scouting-=1;
  const age=19,older=29,from=facilityMul(club,age),adult=facilityMul(club,older),youth=f.youth;
  f.youth=Math.min(5,f.youth+1);
  if(f.youth>youth)check(facilityMul(club,age)-from>facilityMul(club,older)-adult,
    'youth center must help prospects more than veterans');
  f.youth=youth;
  check(FACILITY_TYPES.every(key=>Number.isFinite(facilityInvestmentScore(world,club,key))),
    'board investment should have measurable distinct scores');
  check(financeRunway(world,club).months>=0,'cash runway should be measurable');
  const income=financeCommercialIncome(world,club,null,true);
  check(income.merch>=0&&income.league>0,'commercial engine omitted fan commerce or league rights');
  const cash=club.finance.cash,good=salaryBudget(world,club);
  club.finance.cash=-20;
  check(financeRunway(world,club).severity==='critical','negative cash should activate crisis discipline');
  const bad=salaryBudget(world,club);
  check(bad<=good,'insolvent clubs must not have more available payroll than healthy clubs');
  club.finance.cash=cash;

  const academy=activeTeams(world).find(t=>t.parent&&world.teams[t.parent]?.active!==false);
  check(academy,'need an active reserve for internal finance balancing');
  const parent=world.teams[academy.parent];
  academy.finance.cash=-10;academy.finance.prepaid={};
  parent.finance.cash=100;parent.finance.prepaid={};
  const expected=financeCommercialIncome(world,academy,null,true);
  check(Number.isFinite(expected.owner),'reserve subsidies should be representable');
  closeFinances(world,{year:world.year,seasons:{}},new RNG('phase12-depth','finance'),()=>{});
  const aYear=academy.finance.history.at(-1),pYear=parent.finance.history.at(-1);
  check(academy.finance.cash>=0&&aYear.rev.academyFunding>0,
    'reserve deficit must be covered by parent club, not silently erased');
  check(near(aYear.rev.academyFunding,pYear.exp.academySupport),
    'academy income and parent operating cash must match exactly');
  check(near(aYear.net,Object.values(aYear.rev).reduce((a,b)=>a+b,0)-
    Object.values(aYear.exp).reduce((a,b)=>a+b,0)),'academy statement fails debit-credit parity');
  check(near(pYear.net,Object.values(pYear.rev).reduce((a,b)=>a+b,0)-
    Object.values(pYear.exp).reduce((a,b)=>a+b,0)),'parent statement fails debit-credit parity');
  const copy=unpackDB(packDB(world));
  check(copy.teams[academy.id].finance.history.at(-1).rev.academyFunding>0,
    'parent/academy finance settlement must survive v15 save encoding');
  console.log('PHASE12_DEPTH_ACCEPTANCE '+JSON.stringify({
    sponsors:all.map(s=>s.type),facilities:FACILITY_TYPES,runway:financeRunway(world,club).severity,
    sponsorBonus:all[1].milestoneBonus,academySupport:aYear.rev.academyFunding,
    worldVersion:copy.version,saveFormat:copy.saveFormat}));
})()`;
vm.runInNewContext(code+'\n'+tests,{console,Date,Math,JSON,Set,Map,Object,Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},{timeout:35000});
const ui=await Promise.all(['ui-manager.js','ui-market-staff.js','ui-season.js'].map(
  path=>readFile(resolve(root,path),'utf8')));
const require=(check,message)=>{if(!check)throw new Error(message)};
require(ui[0].includes('outlook.runway.months')&&ui[0].includes('sponsorMilestone'),
  'club finance screen lacks solvency and earned sponsor payout display');
require(ui[1].includes('sponsorExpectedValue(DB,t,o)')&&ui[1].includes('FACILITY_LABELS'),
  'club office lacks contract-risk previews or differentiated facilities');
require(ui[2].includes('financePanel(DB.teams[me])'),'financial strategy screen is missing');
console.log('Phase 12 depth UI acceptance: PASS');
