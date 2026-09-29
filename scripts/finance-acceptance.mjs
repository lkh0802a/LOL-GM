// Phase 12: player/AI facility projects, prepaid finance flows, forecast and save parity.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';

const artifact=resolve(import.meta.dirname,'..','src','artifact');
let source='';
for(const file of ENGINE_MODULES)source+=await readFile(resolve(artifact,file),'utf8')+'\n';
const fixture=String.raw`(()=>{
  const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
  const close=(a,b)=>Math.abs(a-b)<.11;
  const db=buildWorld(),clubs=activeTeams(db,null,1),t=clubs.find(x=>ensureFacilities(x).training<5);
  assert(t,'expected at least one upgradeable first-division team');
  const level=ensureFacilities(t).training,initialCash=100;
  t.finance.cash=initialCash;t.finance.buyout=0;t.finance.prepaid={};
  const forecastBefore=financeForecast(db,t);
  assert(Number.isFinite(forecastBefore.revenue)&&Number.isFinite(forecastBefore.expense),'forecast should have finite amounts');
  assert(forecastBefore.expense>0,'the budget outlook must include operating expenditures');
  const cost=facilityCost(db,t,'training'),construction=facilityBuildDays(level);
  const paid=upgradeFacility(db,t,'training',{deferDays:construction});
  assert(paid===cost&&t.facilities.training===level,'facility construction must not grant benefits early');
  assert(close(t.finance.cash,initialCash-cost),'capex must be charged exactly once');
  assert(t.finance.prepaid.facilityInvestment===cost,'capital outlay must be reflected in the pending statement');
  const project=t.facilityProjects?.[0],originalReady=facilityReadyDate(db.worldDate,construction);
  assert(project&&project.ready===originalReady&&project.to===level+1,'construction must have a deterministic completion date');
  try{upgradeFacility(db,t,'training',{deferDays:construction});throw Error('repeat upgrade accepted')}
  catch(e){assert(e.message.includes('증설 중'),'duplicate facility project must be rejected')}
  advanceFacilityConstruction(db,facilityReadyDate(db.worldDate,construction-1));
  assert(t.facilities.training===level&&t.facilityProjects.length===1,'construction cannot finish before its date');
  const mid=unpackDB(packDB(db)),midT=mid.teams[t.id];
  assert(mid.version===15&&mid.saveFormat===2,'save version/format changed');
  assert(midT.facilityProjects.length===1&&midT.finance.prepaid.facilityInvestment===cost,'construction/capex must survive save round-trip');
  assert(advanceFacilityConstruction(db,originalReady)===1,'scheduled completion did not occur');
  assert(t.facilities.training===level+1&&t.facilityProjects.length===0,'facility must grant upgrade only after construction');
  assert(advanceFacilityConstruction(db,originalReady)===0,'a project must never complete twice');
  t.finance.cash=Math.round((t.finance.cash-1-4-0.8+2)*10)/10;
  recordFinancePrepaid(t,'signingBonus',1);
  recordFinancePrepaid(t,'transferPaid',4);
  recordFinancePrepaid(t,'transferReceived',2);
  recordFinancePrepaid(t,'staffSeverance',.8);
  const beforeClose=financeForecast(db,t);
  const prepaidIn=2,prepaidOut=cost+1+4+.8;
  assert(close(beforeClose.closingCash,t.finance.cash+beforeClose.revenue-prepaidIn-beforeClose.expense+prepaidOut),
    'forecast must not deduct already paid cash a second time');
  assert(close(beforeClose.net,beforeClose.revenue-beforeClose.expense),'forecast net must equal its itemized totals');
  const closeCash=t.finance.cash,w={year:db.year,seasons:{}};
  closeFinances(db,w,new RNG('phase12-finance','year'),()=>{});
  const row=t.finance.history.at(-1),rev=Object.values(row.rev).reduce((a,b)=>a+b,0),exp=Object.values(row.exp).reduce((a,b)=>a+b,0);
  assert(row.rev.transfer===2&&row.exp.transfer===4&&row.exp.facilityInvestment===cost&&
    row.exp.signingBonus===1&&row.exp.staffSeverance===.8,
    'annual statement omitted a prepaid purchase/transfer/severance');
  assert(close(row.net,rev-exp),'the recorded net must match the statement');
  assert(close(t.finance.cash,closeCash+row.net+prepaidOut-prepaidIn),
    'closeout must account for prepaid cash settlement exactly once');
  assert(!Object.keys(t.finance.prepaid).length,'prepaid ledger should clear on annual close');
  assert(t.finance.history.length>0&&t.finance.history.at(-1).year===db.year,'no completed finance year');
  const again=unpackDB(packDB(db));
  const reloaded=again.teams[t.id];
  assert(reloaded.facilities.training===level+1&&reloaded.finance.history.at(-1).exp.facilityInvestment===cost,
    'finished infrastructure and finance statement must be persistent');
  const broken=t.finance.cash,levels=JSON.stringify(t.facilities);
  t.finance.cash=0;
  try{upgradeFacility(db,t,'analysis',{deferDays:30});throw Error('unfunded facility project accepted')}
  catch(e){assert(e.message.includes('자금이 부족'),'insufficient-funds upgrade not blocked')}
  assert(JSON.stringify(t.facilities)===levels&&!t.facilityProjects.length,'failed facility upgrade must not mutate levels');
  t.finance.cash=broken;
  console.log('PHASE12_ACCEPTANCE {"worldVersion":'+db.version+',"saveFormat":'+again.saveFormat+',"capex":'+cost+',"ready":"'+originalReady+'","financeNet":'+row.net+',"forecastNet":'+beforeClose.net+'}');
})()`;
vm.runInNewContext(source+'\n'+fixture,{console,Date,Math,JSON,Set,Map,Object,Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},{timeout:35000});
const ui=await readFile(resolve(artifact,'ui-manager.js'),'utf8');
const season=await readFile(resolve(artifact,'ui-season.js'),'utf8');
const office=await readFile(resolve(artifact,'ui-market-staff.js'),'utf8');
const day=await readFile(resolve(artifact,'season.js'),'utf8');
const year=await readFile(resolve(artifact,'offseason.js'),'utf8');
assert(ui.includes('financeForecast(DB,t)')&&ui.includes('예상 수입')&&ui.includes('예상 결산 현금'),
  'financial outlook must be accessible in the user interface');
assert(season.includes('financePanel(DB.teams[me])'),'forecast is not visible in the season history view');
assert(office.includes('facilityProjects')&&office.includes('완료 예정'),'club office must show active construction');
assert(day.includes('advanceFacilityConstruction(db,date)'),'calendar must complete facility construction');
assert(year.includes('facilityInvestmentScore(db,t,key)')&&year.includes('financeRunway(db,t)')&&year.includes('opt.cost+opt.reserve'),
  'AI board investments must respect marginal facility benefit and liquidity');
console.log('Phase 12 finance UI/AI integration: PASS');
