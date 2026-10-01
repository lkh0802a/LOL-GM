// D04-B1: one 1-3 year duration policy shared by normalization, player preference, AI negotiation and UI.
import {artifactSource,runEngineFixture} from './test-harness.mjs';

const fixture=String.raw`(()=>{
  const assert=(x,m)=>{if(!x)throw new Error('D04_DURATION '+m)};
  let db=buildWorld(),team=activeTeams(db,null,1)[0],
    free=Object.values(db.players).filter(p=>!p.retired&&!p.team).slice(0,2);
  assert(team&&free.length===2,'fixture missing team/free agents');
  const stability=free[0],flexible=free[1];
  stability.age=26;stability.careerGoal='stability';stability.personality.ambition=45;
  flexible.age=25;flexible.careerGoal='titles';flexible.personality.ambition=90;
  flexible.reputation=Math.max(85,flexible.reputation||0);

  const stablePolicy=contractDurationPolicy(db,stability,team),
    flexPolicy=contractDurationPolicy(db,flexible,team);
  assert(stablePolicy.min===1&&stablePolicy.max===3&&
    JSON.stringify(stablePolicy.choices)==='[1,2,3]'&&stablePolicy.preferred===3,
    'stability policy did not preserve confirmed 1-3 range / long preference');
  assert(flexPolicy.min===1&&flexPolicy.max===3&&flexPolicy.preferred===1,
    'ambitious prime player did not prefer short flexibility');

  const stableAsk=asking(db,stability,team.region),
    flexAsk=asking(db,flexible,team.region),
    stable1=normalizeContractTerms(db,stability,team,stableAsk,1,{promisedRole:'starter'}),
    stable3=normalizeContractTerms(db,stability,team,stableAsk,3,{promisedRole:'starter'}),
    flex1=normalizeContractTerms(db,flexible,team,flexAsk,1,{promisedRole:'starter'}),
    flex3=normalizeContractTerms(db,flexible,team,flexAsk,3,{promisedRole:'starter'});
  assert(normalizeContractTerms(db,stability,team,stableAsk,4,{}).years===3&&
    normalizeContractTerms(db,stability,team,stableAsk,0,{}).years===1&&
    normalizeContractTerms(db,stability,team,stableAsk,null,{}).years===3,
    'normalization no longer shares policy bounds/default preference');
  assert(offerUtility(db,stability,team,stable3)>offerUtility(db,stability,team,stable1),
    'stability player did not value preferred long duration');
  assert(offerUtility(db,flexible,team,flex1)>offerUtility(db,flexible,team,flex3),
    'ambitious player did not value preferred short duration');

  const stableDemand=negotiationDemand(db,stability,team,'fa',new RNG('d04-stable','demand'),[]),
    flexDemand=negotiationDemand(db,flexible,team,'fa',new RNG('d04-flex','demand'),[]);
  assert(stableDemand.years===3&&flexDemand.years===1,
    'player negotiation demand bypassed central duration preference');

  const generated=[];
  for(let i=0;i<32;i++)generated.push(contractYearsForPlayer(
    db,flexible,new RNG('d04-ai-'+i,'years'),team));
  assert(generated.every(y=>flexPolicy.choices.includes(y)),
    'AI duration generation escaped central legal range');

  const beforeId=stability.id;
  signContract(db,stability,team,stable3.salary,stable3.years,stable3);
  assert(stability.contract?.years===3&&stability.contract.until===db.year+2,
    'three-year protected contract did not sign with expected end year');
  const packed=packDB(db);db=unpackDB(packed);
  assert(db.players[beforeId].contract?.years===3,
    'duration policy contract failed save/restore');

  console.log('D04_CONTRACT_DURATION_ACCEPTANCE '+JSON.stringify({
    range:[stablePolicy.min,stablePolicy.max],
    stability:{preferred:stablePolicy.preferred,reason:stablePolicy.reason,
      utility:[offerUtility(db,db.players[beforeId],db.teams[team.id],
        {...db.players[beforeId].contract,years:1}),
        offerUtility(db,db.players[beforeId],db.teams[team.id],
        {...db.players[beforeId].contract,years:3})]},
    flexible:{preferred:flexPolicy.preferred,reason:flexPolicy.reason,
      generated:[...new Set(generated)].sort()},
    saveFormat:JSON.parse(packed).saveFormat
  }));
})();`;
await runEngineFixture(fixture,{timeout:30000,filename:'contract-duration-acceptance.fixture.js'});

const ui=await artifactSource('ui-negotiations.js');
if(!ui.includes('contractDurationPolicy(DB,p,team)')||ui.includes('[1,2,3,4].map'))
  throw new Error('D04_DURATION negotiation UI does not consume engine duration choices');
console.log('D04_CONTRACT_DURATION_UI_ACCEPTANCE '+JSON.stringify({enginePolicy:true,legacyFourYearChoice:false}));
