// D04-B3: contracts expire two weeks after Worlds; incumbent exclusivity lasts
// through expiry, with optional club-granted early contact and day-15 open FA.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';

const root=resolve(import.meta.dirname,'..','src','artifact');
let source='';
for(const file of ENGINE_MODULES)source+=await readFile(resolve(root,file),'utf8')+'\n';
source+=String.raw`(()=>{
  const assert=(x,m)=>{if(!x)throw new Error('D04_CONTRACT_WINDOW '+m)};
  let db=buildWorld(),teams=activeTeams(db,null,1).slice(0,4),
    pool=Object.values(db.players).filter(p=>!p.retired&&!p.team).slice(0,10);
  assert(teams.length===4&&pool.length>=7,'fixture missing teams/players');
  let [mine,other,third,fourth]=teams,
    [own,ownWaive,optionPlayer,target,aiTarget,otherStarter,careerFa]=pool;
  setManagedTeam(db,mine.id);
  for(const t of teams)t.finance.cash=1000;
  const oneYear=(p,t,role='starter')=>{
    signContract(db,p,t,asking(db,p,t.region),1,{promisedRole:role});
    p.contract.until=2027;return p;
  };
  own.careerGoal='stability';own.personality.ambition=45;
  oneYear(own,mine,'starter');oneYear(ownWaive,mine,'backup');
  oneYear(optionPlayer,mine,'competition');
  optionPlayer.contract.option={type:'team',year:2028,salary:optionPlayer.contract.salary};
  target.careerGoal='stability';target.personality.ambition=35;
  oneYear(target,other,'starter');
  aiTarget.careerGoal='stability';aiTarget.personality.ambition=30;
  oneYear(aiTarget,third,'backup');
  oneYear(otherStarter,other,'starter');
  aiTarget.role=otherStarter.role;
  otherStarter.wantsOut=true;

  db.competitions.WORLD_CHAMPIONSHIP=db.competitions.WORLD_CHAMPIONSHIP||{
    id:'WORLD_CHAMPIONSHIP',name:'World Championship',short:'Worlds',international:true};
  db.world={year:2027,seed:'d04-b3',manage:'manual',phase:'offseason',
    seasons:{worlds:{done:true,comp:'WORLD_CHAMPIONSHIP',
      days:[{date:'2027-11-16',matches:[]}]}},
    steps:[],step:0,report:null,offers:[],marketLog:[],negotiations:{},
    recruitment:{},lastDate:'2027-11-20'};
  db.year=2027;db.worldDate='2027-11-20';

  let cw=initOffseasonContractWindow(db);
  assert(cw.seasonEndDate==='2027-11-16',
    'contract window followed a later event instead of Worlds');
  assert(cw.startDate==='2027-11-17'&&cw.exclusiveThrough==='2027-11-30'&&
    cw.contractExpiryDate==='2027-11-30'&&cw.outsideContactDate==='2027-12-01'&&
    cw.effectiveDate==='2027-12-01',
    'Worlds+14 expiry / day-15 FA boundaries are wrong');
  assert(db.worldDate==='2027-11-20',
    'opening contract window rewound an already-later world date');

  // Normal outside clubs cannot contact a contracted player during exclusivity.
  setRecruitmentPriority(db,target.id,'A');
  scoutPlayers(db,[target.id],40,0);scoutPlayers(db,[target.id],40,0);
  assert(recruitmentEvaluation(db,target.id,mine.id).ok,'target evaluation failed');
  let blocked=startNegotiation(db,target.id,'early_fa',{teamId:mine.id});
  assert(!blocked.ok&&blocked.msg.includes('허용하지 않은'),
    'outside club bypassed incumbent exclusivity');

  // Both manager and AI incumbents use the same explicit waiver. It only opens
  // talks; it does not release the player or end the existing playing contract.
  let waiver=grantEarlyContact(db,ownWaive.id,'manager');
  assert(waiver.ok&&ownWaive.team===mine.id&&ownWaive.contract.until===2027,
    'manager waiver prematurely released the player');
  assert(!grantEarlyContact(db,optionPlayer.id,'manager').ok,
    'pending team option was waived before option resolution');
  waiver=grantEarlyContact(db,target.id,'ai');
  assert(waiver.ok&&target.team===other.id,
    'AI incumbent could not grant the same early-contact permission');

  // Waiver state must survive save/restore before any agreement.
  let packed=packDB(db);db=unpackDB(packed);
  mine=db.teams[mine.id];other=db.teams[other.id];third=db.teams[third.id];
  own=db.players[own.id];ownWaive=db.players[ownWaive.id];
  optionPlayer=db.players[optionPlayer.id];target=db.players[target.id];
  aiTarget=db.players[aiTarget.id];careerFa=db.players[careerFa.id];
  cw=db.world.contractWindow;
  assert(cw.contactWaivers[target.id]&&cw.contactWaivers[ownWaive.id],
    'exclusive-contact waiver failed save/restore');

  const acceptable=(p,t,kind)=>{
    const ask=asking(db,p,t.region);
    for(const role of ['starter','core','competition'])for(const years of [1,2,3])
      for(const mul of [1,1.05,1.1,1.2]){
        const offer=normalizeContractTerms(db,p,t,ask*mul,years,{
          signingBonus:0,bonuses:{performance:0,title:0,international:0},
          promisedRole:role,option:null,buyout:null});
        if(!negotiationBudgetError(db,p,t,offer,kind)&&
          contractOfferReasonable(db,p,t,offer,kind)&&
          offerUtility(db,p,t,offer,{renewal:kind==='renewal'})>=
            offerAcceptanceThreshold(db,p,{kind}))return offer;
      }
    throw new Error('D04_CONTRACT_WINDOW no reasonable acceptable offer '+p.id);
  };

  // Manager early contact becomes a binding next-season agreement but current
  // club/contract stay unchanged until Worlds+14 expiry.
  let n=startNegotiation(db,target.id,'early_fa',{teamId:mine.id});
  assert(n.ok&&n.neg.kind==='early_fa','authorized early-contact negotiation failed');
  let offer=acceptable(target,mine,'early_fa'),
    result=submitNegotiationOffer(db,n.neg.id,offer);
  assert(result.ok&&n.neg.status==='accepted','reasonable early-contact deal rejected');
  let earlyAgreement=contractAgreementFor(db,target.id);
  assert(earlyAgreement?.kind==='early_fa'&&earlyAgreement.status==='agreed'&&
    earlyAgreement.effectiveDate==='2027-12-01'&&target.team===other.id&&
    target.contract.until===2027,
    'early agreement changed current playing rights before expiry');

  // Incumbent renewal follows the same expiry date and starts next season.
  n=startNegotiation(db,own.id,'renewal');
  assert(n.ok,'incumbent renewal could not start');
  offer=acceptable(own,mine,'renewal');
  result=submitNegotiationOffer(db,n.neg.id,offer);
  assert(result.ok&&contractAgreementFor(db,own.id)?.kind==='renewal'&&
    own.contract.until===2027,'renewal did not remain future-dated');

  // AI early-contact path: prepare another source waiver and a destination with
  // a replaceable starter, then let the production AI offer engine decide.
  grantEarlyContact(db,aiTarget.id,'ai');
  const cur=starterFor(db,other,aiTarget.role);if(cur)cur.wantsOut=true;
  const aiRows=aiRunEarlyContactOffers(db);
  assert(aiRows.every(row=>row.kind==='early_fa'&&row.actor==='ai'),
    'AI early-contact writer diverged from shared agreement rules');

  // Player employment logic: a realistic offer receives an offseason
  // employment-risk adjustment, but an established-market-floor violation
  // remains an explicit reject.
  const faTeam=fourth,ask=asking(db,careerFa,faTeam.region),
    fair=normalizeContractTerms(db,careerFa,faTeam,ask,1,{promisedRole:'starter'}),
    cheap=normalizeContractTerms(db,careerFa,faTeam,ask*.5,1,{promisedRole:'starter'}),
    baseThreshold=1.04+(careerFa.reputation||playerOvr(careerFa))/520+
      careerFa.personality.ambition/100*.12+(careerFa.age<=20?.04:0),
    faThreshold=offerAcceptanceThreshold(db,careerFa,{kind:'fa'});
  assert(faThreshold<baseThreshold&&contractOfferReasonable(db,careerFa,faTeam,fair,'fa')&&
    !contractOfferReasonable(db,careerFa,faTeam,cheap,'fa'),
    'employment risk did not distinguish reasonable offer from undervaluation');

  const seasonPayroll=financeSeasonPayroll(db,other,db.world);
  assert(seasonPayroll.salary===cw.financePayroll[other.id].salary,
    'season finance no longer uses Worlds-close payroll snapshot');

  // Through Nov 30, current contracts remain. Day 15 (Dec 1) closes them,
  // activates accepted next-season agreements, and opens normal FA access.
  db.worldDate='2027-11-30';
  assert(target.team===other.id&&target.contract,
    'contract ended before Worlds+14 boundary');
  const closed=advanceOffseasonContractDay(db);cw=db.world.contractWindow;
  assert(closed.stage==='fa'&&db.worldDate==='2027-12-01'&&cw.completed,
    'day-15 FA opening did not occur');
  own=db.players[own.id];target=db.players[target.id];ownWaive=db.players[ownWaive.id];
  assert(own.team===mine.id&&own.contract.signed===2028,
    'renewal agreement did not activate as next-season contract');
  assert(target.team===mine.id&&target.contract.signed===2028&&
    contractAgreementFor(db,target.id).status==='effective',
    'early-contact agreement did not activate after old contract expired');
  assert(!ownWaive.team&&!ownWaive.contract,
    'waived player without a deal was not released to FA at expiry');

  // A player released on day 15 is now a normal FA, not a pre-contract case.
  setRecruitmentPriority(db,ownWaive.id,'A');
  scoutPlayers(db,[ownWaive.id],40,0);scoutPlayers(db,[ownWaive.id],40,0);
  assert(recruitmentEvaluation(db,ownWaive.id,mine.id).ok,
    'released FA evaluation failed');
  const faStart=startNegotiation(db,ownWaive.id,'fa',{teamId:mine.id});
  assert(faStart.ok,'day-15 normal FA negotiation did not open');

  packed=packDB(db);db=unpackDB(packed);
  assert(db.world.contractWindow.completed&&
    contractAgreementFor(db,target.id)?.status==='effective'&&
    db.players[target.id].team===mine.id,
    'expiry settlement failed save/restore');

  console.log('D04_CONTRACT_WINDOW_ACCEPTANCE '+JSON.stringify({
    worlds:'2027-11-16',exclusive:['2027-11-17','2027-11-30'],
    expiry:'2027-11-30',faOpen:'2027-12-01',
    waivers:Object.keys(cw.contactWaivers||{}).length,
    earlyAiAgreements:aiRows.length,
    activated:closed.settlement.applied.map(x=>({pid:x.pid,kind:x.kind,team:x.teamId})),
    employmentRisk:{base:Math.round(baseThreshold*1000)/1000,
      offseason:Math.round(faThreshold*1000)/1000,
      cheapReasonable:contractOfferReasonable(db,db.players[careerFa.id]||careerFa,
        db.teams[faTeam.id],cheap,'fa')},
    saveFormat:JSON.parse(packed).saveFormat
  }));
})();`;
vm.runInNewContext(source,{console,Date,Math,JSON,Set,Map,WeakMap,Object,
  Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},{timeout:30000});

const [app,market]=await Promise.all([
  readFile(resolve(root,'app.js'),'utf8'),readFile(resolve(root,'ui-market.js'),'utf8')
]);
if(!app.includes('scontractday')||!app.includes('scontractopen')||
  !market.includes('data-waive-contact')||!market.includes('data-start-early-fa')||
  market.includes('data-start-precontract'))
  throw new Error('D04_CONTRACT_WINDOW UI does not expose waiver / early-contact / day-15 FA rules');
console.log('D04_CONTRACT_WINDOW_UI_ACCEPTANCE '+JSON.stringify({
  dailyExclusive:true,contactWaiver:true,earlyContact:true,day15RegularFa:true
}));
