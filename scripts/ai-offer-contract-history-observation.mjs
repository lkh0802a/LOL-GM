import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('AI_OFFER_CONTRACT_OBSERVATION '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:18,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),human=activeTeams(db,'KR',1)[0];startCareer(db,human.id,'actual-independent-bid-probe');
 const original=packDB(db),copy=unpackDB(original),teams=activeTeams(copy,null,1).filter(t=>t.id!==human.id);
 const result=resolveInitialOfferRound(copy,teams,0,copy.world.seed+'|minimum',t=>initialLegalMinimumTarget(copy,t));
 const accepted=currentAIMarketOffers(copy).find(o=>o.status==='accepted');check(result.signed>0&&accepted,'actual accepted AI offer absent');
 const player=copy.players[accepted.pid],event=(player.careerEvents||[]).findLast(x=>x.type==='contract');check(event&&player.team===accepted.teamId,'signed contract event absent');
 const saved=unpackDB(packDB(copy)),offer2=currentAIMarketOffers(saved).find(o=>o.id===accepted.id),p2=saved.players[accepted.pid];
 check(offer2&&offer2.status==='accepted'&&JSON.stringify(offer2.terms)===JSON.stringify(accepted.terms),'accepted quote not restored');
 check(JSON.stringify(p2.contract)===JSON.stringify(player.contract),'contract not restored');check(packDB(db)===original,'synthetic original modified');
 console.log(JSON.stringify({accepted:true,kind:accepted.kind,offerBonus:accepted.terms.bonuses,contractBonus:player.contract.bonuses,eventHasBonuses:Object.hasOwn(event,'bonuses'),restored:true,syntheticOnly:true}));
})();`);
