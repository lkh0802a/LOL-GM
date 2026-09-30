// D04-B2: renewal rejection cooldown and hard-breakdown reopening conditions.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';

const root=resolve(import.meta.dirname,'..','src','artifact');
let source='';
for(const file of ENGINE_MODULES)source+=await readFile(resolve(root,file),'utf8')+'\n';
source+=String.raw`(()=>{
  const assert=(x,m)=>{if(!x)throw new Error('D04_NEGOTIATION_STATE '+m)};
  let db=buildWorld(),team=activeTeams(db,null,1)[0],
    player=Object.values(db.players).find(p=>!p.retired&&!p.team&&p.age>=22&&p.age<=27);
  assert(team&&player,'fixture missing team/player');
  setManagedTeam(db,team.id);
  team.finance.cash=Math.max(team.finance.cash||0,100);
  db.world={year:db.year,seed:'d04-b2',manage:'manual',phase:'market',
    seasons:{},steps:[],step:0,report:null,offers:[],marketLog:[],
    negotiations:{},recruitment:{}};
  db.worldDate=db.year+'-06-01';
  player.careerGoal='stability';player.personality.ambition=58;
  const baseSalary=asking(db,player,team.region);
  signContract(db,player,team,baseSalary,1,{promisedRole:'starter'});
  player.contract.until=db.year;
  ensureSatisfaction(player);

  const mildOffer=(neg)=>{
    const threshold=offerAcceptanceThreshold(db,player),
      roles=['backup','prospect','competition','starter','core'],
      options=[null,{type:'team'},{type:'player'}];
    for(const role of roles)for(const years of [1,2,3])for(const option of options)
      for(const bonusFactor of [0,.35,.7,1])for(let n=10;n<=110;n+=2){
        const salary=Math.max(.1,Math.round(neg.demand.salary*n/100*10)/10),
          offer=normalizeContractTerms(db,player,team,salary,years,{
            signingBonus:Math.round((neg.demand.signingBonus||0)*bonusFactor*10)/10,
            bonuses:{
              performance:Math.round((neg.demand.bonuses?.performance||0)*bonusFactor*10)/10,
              title:Math.round((neg.demand.bonuses?.title||0)*bonusFactor*10)/10,
              international:Math.round((neg.demand.bonuses?.international||0)*bonusFactor*10)/10
            },
            option,buyout:null,promisedRole:role
          }),
          utility=offerUtility(db,player,team,offer,{renewal:true});
        if(utility<threshold-.04&&utility>=threshold-.20)
          return {offer,utility,threshold};
      }
    throw new Error('D04_NEGOTIATION_STATE could not construct mild rejection offer');
  };

  // Normal rejection: exhaust rounds with an offer that is below acceptance
  // but not low enough to consume patience or trigger a hard breakdown.
  let started=startNegotiation(db,player.id,'renewal');
  assert(started.ok&&started.neg.attempt===1,'first renewal did not start');
  let neg=started.neg,mild=mildOffer(neg),result=null;
  for(let i=0;i<neg.maxRounds;i++)result=submitNegotiationOffer(db,neg.id,mild.offer);
  assert(!result.ok&&neg.status==='withdrawn'&&neg.failureType==='rejected'&&
    !neg.reopenRequiresChange,'round exhaustion was not classified as ordinary rejection');
  const firstClosed=neg.closedDate,firstUntil=neg.cooldownUntil,
    cooldownDays=neg.maxRounds;
  assert(firstUntil===addDays(firstClosed,cooldownDays),
    'renewal cooldown did not reuse the existing negotiation patience horizon');
  assert(neg.patience===neg.maxRounds,
    'mild rejection unexpectedly consumed patience and became a hard breakdown');

  let blocked=startNegotiation(db,player.id,'renewal');
  assert(!blocked.ok&&blocked.msg.includes(firstUntil),
    'same-day retry bypassed renewal cooldown');

  // Closed-state restrictions must survive save/restore.
  let packed=packDB(db);db=unpackDB(packed);
  team=db.teams[team.id];player=db.players[player.id];
  db.worldDate=addDays(firstUntil,-1);
  blocked=startNegotiation(db,player.id,'renewal');
  assert(!blocked.ok,'retry reopened before cooldown boundary after save/restore');
  db.worldDate=firstUntil;
  started=startNegotiation(db,player.id,'renewal');
  assert(started.ok&&started.neg.attempt===2&&
    started.neg.previousAttempts.length===1&&
    started.neg.previousAttempts[0].failureType==='rejected',
    'cooldown boundary did not reopen with prior attempt audit');

  // Hard breakdown: reuse the production severe-gap condition. Find a legal
  // offer below threshold-.62 rather than modifying any engine threshold.
  neg=started.neg;
  const threshold=offerAcceptanceThreshold(db,player);
  let hard=null;
  for(const role of ['backup','prospect','competition']){
    for(const buyoutMul of [8,4,2,1]){
      const offer=normalizeContractTerms(db,player,team,.1,1,{
        signingBonus:0,bonuses:{performance:0,title:0,international:0},
        buyout:Math.round(playerMarketValue(db,player)*buyoutMul*10)/10,
        option:{type:'team'},promisedRole:role
      }),utility=offerUtility(db,player,team,offer,{renewal:true});
      if(utility<threshold-.62){hard={offer,utility};break}
    }
    if(hard)break;
  }
  assert(hard,'fixture could not reach existing severe-gap breakdown condition');
  result=submitNegotiationOffer(db,neg.id,hard.offer);
  assert(!result.ok&&neg.status==='withdrawn'&&neg.failureType==='breakdown'&&
    neg.reopenRequiresChange,'severe offer did not create a hard breakdown');
  const hardUntil=neg.cooldownUntil;
  assert(hardUntil===addDays(neg.closedDate,neg.maxRounds),
    'hard renewal breakdown lost mandatory cooldown');

  db.worldDate=hardUntil;
  blocked=startNegotiation(db,player.id,'renewal');
  assert(!blocked.ok&&blocked.msg.includes('의미 있게'),
    'time alone reopened a completely broken negotiation');

  // A real player-state change used by renewal utility is meaningful.
  player.wantsOut=true;player.wantsOutReason='contract';
  started=startNegotiation(db,player.id,'renewal');
  assert(started.ok&&started.neg.attempt===3&&
    started.neg.reopenedChanges.includes('wantsOut')&&
    started.neg.reopenedChanges.includes('wantsOutReason'),
    'meaningful player situation change did not reopen hard breakdown');
  assert(started.neg.previousAttempts.length===2&&
    started.neg.previousAttempts[1].failureType==='breakdown',
    'hard-breakdown history was not carried into reopened attempt');

  packed=packDB(db);db=unpackDB(packed);
  const restored=negotiationStore(db)[started.neg.id];
  assert(restored?.attempt===3&&restored.previousAttempts.length===2&&
    restored.reopenedChanges.includes('wantsOut'),
    'reopen state machine failed save/restore');

  // Club cancellation is not a player rejection and remains immediately
  // restartable, preserving the existing manager cancellation behavior.
  const cancelled=cancelNegotiation(db,restored.id);
  assert(cancelled.includes('종료'), 'manager cancellation failed');
  const retry=startNegotiation(db,player.id,'renewal');
  assert(retry.ok&&retry.neg.attempt===4,
    'manager cancellation incorrectly created a player rejection lock');

  console.log('D04_CONTRACT_NEGOTIATION_STATE_ACCEPTANCE '+JSON.stringify({
    normalRejection:{rounds:cooldownDays,closed:firstClosed,cooldownUntil:firstUntil},
    hardBreakdown:{cooldownUntil:hardUntil,severeGap:Math.round((threshold-hard.utility)*1000)/1000},
    reopen:{attempt:started.neg.attempt,changes:started.neg.reopenedChanges},
    auditAttempts:restored.previousAttempts.map(x=>({attempt:x.attempt,failureType:x.failureType})),
    saveFormat:JSON.parse(packed).saveFormat
  }));
})();`;
vm.runInNewContext(source,{console,Date,Math,JSON,Set,Map,WeakMap,Object,
  Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},{timeout:30000});
