// Isolated schema observation: synthetic input, no real contract or save slot.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const db={worldDate:'2027-01-01'};
  const sellOn={beneficiary:'synthetic-club',rate:0.1,expires:'2029-01-01'};
  const input={upfront:1,installments:[{date:'2027-06-01',amount:1}],addOns:[],sellOn};
  const before=JSON.stringify(input),result=normalizeTransferFeePlan(db,2,input);
  if(!result.ok||result.plan?.installments?.[0]?.amount!==1)
    throw Error('synthetic supported installment control failed');
  console.log('SELL_ON_FEE_PLAN_OBSERVATION '+JSON.stringify({
    accepted:result.ok,installmentRetained:result.plan.installments.length===1,
    syntheticExtraFieldRetained:Object.hasOwn(result.plan,'sellOn'),
    inputUnchanged:JSON.stringify(input)===before
  }));
})();`);
