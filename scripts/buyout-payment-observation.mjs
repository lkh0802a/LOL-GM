// Synthetic transfer command observation; no user save or actual contract.
import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:3,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),[seller,buyer]=activeTeams(db),p=Object.values(db.players).find(p=>!p.team&&!p.retired);
 setManagedTeam(db,buyer.id);db.world={phase:'market',year:db.year,manage:'manual',seasons:{}};
 seller.finance.cash=100;buyer.finance.cash=100;
 p.personality.ambition=10;p.careerGoal='stability';
 signContract(db,p,seller,10,2,{promisedRole:'backup',buyout:{type:'release',amount:2}});
 const original=packDB(db),clone=unpackDB(original),command={type:'player.transfer',actor:'manager',pid:p.id,fromId:seller.id,teamId:buyer.id,fee:2,feePlan:{upfront:0,installments:[{date:addDays(db.worldDate,30),amount:2}],addOns:[]}};
 const preview=previewWorldAction(clone,command);const result=commitWorldAction(clone,command);
 const deals=Object.values(clone.teams[buyer.id].finance.transferDeals||{}),loaded=unpackDB(packDB(clone));
 const restoredDeals=Object.values(loaded.teams[buyer.id].finance.transferDeals||{});
 const upfront=unpackDB(original),control=commitWorldAction(upfront,{...command,feePlan:{upfront:2,installments:[],addOns:[]}});
 console.log('BUYOUT_PLAN_OBSERVATION '+JSON.stringify({date:db.worldDate,preview:preview.ok,result:result.ok,reason:result.reason||null,errors:result.errors||[],buyerCash:clone.teams[buyer.id].finance.cash,sellerCash:clone.teams[seller.id].finance.cash,team:clone.players[p.id].team,deals,restoredStatus:restoredDeals[0]?.rows[0]?.status,upfrontControl:{accepted:control.ok,buyerCash:upfront.teams[buyer.id].finance.cash,sellerCash:upfront.teams[seller.id].finance.cash},originalUnchanged:packDB(db)===original}));
})();`);
