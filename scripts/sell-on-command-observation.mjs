// Unsupported synthetic marker, not a real sell-on agreement or user save.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),[seller,buyer]=activeTeams(db),p=Object.values(db.players).find(p=>!p.team&&!p.retired);
 setManagedTeam(db,buyer.id);db.world={phase:'market',year:db.year,manage:'manual',seasons:{}};
 seller.finance.cash=100;buyer.finance.cash=100;p.personality.ambition=10;p.careerGoal='stability';
 signContract(db,p,seller,10,2,{promisedRole:'backup',buyout:{type:'release',amount:2}});
 const original=packDB(db),base={type:'player.transfer',actor:'manager',pid:p.id,fromId:seller.id,teamId:buyer.id,fee:2,
  feePlan:{upfront:1,installments:[{date:addDays(db.worldDate,30),amount:1}],addOns:[]}};
 const marked=JSON.parse(JSON.stringify(base));marked.feePlan.sellOn={beneficiary:'synthetic-club',rate:.1,expires:'2029-01-01'};
 const input=JSON.stringify(marked),control=unpackDB(original),experiment=unpackDB(original);
 const experimentBefore=packDB(experiment),preview=previewWorldAction(experiment,marked),previewUnchanged=packDB(experiment)===experimentBefore;
 const controlBefore=packDB(control),controlPreview=previewWorldAction(control,base),controlPreviewUnchanged=packDB(control)===controlBefore;
 const result=commitWorldAction(experiment,marked),controlResult=commitWorldAction(control,base);
 const saved=packDB(experiment),loaded=unpackDB(saved);
 const inspect=x=>({playerTeam:x.players[p.id].team,events:(x.players[p.id].careerEvents||[]).filter(e=>e.type==='transfer'),
  buyerDeals:Object.values(x.teams[buyer.id].finance.transferDeals||{}),sellerDeals:Object.values(x.teams[seller.id].finance.transferDeals||{}),
  buyerCash:x.teams[buyer.id].finance.cash,sellerCash:x.teams[seller.id].finance.cash});
 const observed=inspect(experiment),restored=inspect(loaded),controlView=inspect(control);
 console.log('SELL_ON_COMMAND_OBSERVATION '+JSON.stringify({synthetic:true,markerIsNotContract:true,previewOk:preview.ok,previewUnchanged,controlPreviewOk:controlPreview.ok,controlPreviewUnchanged,
  committed:result.ok,controlCommitted:controlResult.ok,inputUnchanged:JSON.stringify(marked)===input,originalUnchanged:packDB(db)===original,
  markerInObserved:JSON.stringify(observed).includes('synthetic-club'),markerInRestored:JSON.stringify(restored).includes('synthetic-club'),
  sameAsUnmarkedControl:JSON.stringify(observed)===JSON.stringify(controlView),restoreMatches:JSON.stringify(observed)===JSON.stringify(restored),
  observed}));
})();`);
