// D04-B3: 14-day incumbent exclusivity, day-15 outside contact and Jan-1 future contract activation.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';

const root=resolve(import.meta.dirname,'..','src','artifact');
let source='';
for(const file of ENGINE_MODULES)source+=await readFile(resolve(root,file),'utf8')+'\n';
source+=String.raw`(()=>{
  const assert=(x,m)=>{if(!x)throw new Error('D04_CONTRACT_WINDOW '+m)};
  let db=buildWorld(),teams=activeTeams(db,null,1).slice(0,3),
    pool=Object.values(db.players).filter(p=>!p.retired&&!p.team);
  assert(teams.length===3&&pool.length>=4,'fixture missing teams/players');
  let [mine,other,third]=teams,[own,target,optionPlayer,aiTarget]=pool.slice(0,4);
  setManagedTeam(db,mine.id);
  mine.finance.cash=other.finance.cash=third.finance.cash=1000;
  own.age=25;own.careerGoal='stability';own.personality.ambition=45;
  target.age=24;target.careerGoal='stability';target.personality.ambition=30;
  target.satisfaction=95;target.managerTrust=90;target.managerRelationship=90;
  target.rosterRole='core';
  optionPlayer.age=24;
  aiTarget.age=25;aiTarget.careerGoal='stability';aiTarget.personality.ambition=35;
  aiTarget.satisfaction=95;aiTarget.managerTrust=90;aiTarget.managerRelationship=90;
  aiTarget.rosterRole='core';
  signContract(db,own,mine,asking(db,own,mine.region),1,{promisedRole:'starter'});
  signContract(db,target,other,asking(db,target,other.region),1,{promisedRole:'core'});
  signContract(db,optionPlayer,other,asking(db,optionPlayer,other.region),1,{
    promisedRole:'competition',option:{type:'team'}});
  signContract(db,aiTarget,third,asking(db,aiTarget,third.region),1,{promisedRole:'core'});
  assert([own,target,optionPlayer,aiTarget].every(x=>x.contract.until===2027),
    'fixture contracts do not expire in season year');

  db.world={year:2027,seed:'d04-b3',manage:'manual',phase:'offseason',
    seasons:{},steps:[],step:0,report:null,offers:[],marketLog:[],
    negotiations:{},recruitment:{},lastDate:'2027-11-16'};
  db.year=2027;db.worldDate='2027-11-16';

  let cw=initOffseasonContractWindow(db);
  assert(cw.startDate==='2027-11-17'&&cw.exclusiveThrough==='2027-11-30'&&
    cw.outsideContactDate==='2027-12-01'&&
    cw.contractExpiryDate==='2027-12-31'&&cw.effectiveDate==='2028-01-01',
    'calendar boundaries are not day 1-14 / day 15 / year-end / Jan 1');
  assert(db.worldDate==='2027-11-17','exclusive window did not begin day after final competition');
  const dayStep=advanceOffseasonContractDay(db);
  assert(dayStep.ok&&dayStep.stage==='exclusive'&&db.worldDate==='2027-11-18',
    'exclusive contract window cannot advance one real day for B2 cooldowns');
  db.worldDate=cw.startDate;

  let blocked=startNegotiation(db,target.id,'precontract',{teamId:mine.id});
  assert(!blocked.ok&&blocked.msg.includes('14일'),'outside contact opened during incumbent exclusivity');

  const acceptedOffer=(neg,p,t,renewal)=>{
    const competitor=neg.competitors?.length?Math.max(...neg.competitors.map(x=>x.utility)):0,
      threshold=Math.max(offerAcceptanceThreshold(db,p),competitor-.035),
      cap=(renewal?salaryBudget(db,t)-payroll(db,t)+(p.contract?.salary||0):
        salaryBudget(db,t)-payroll(db,t))*1.2;
    for(const role of ['core','starter','competition'])for(const years of [1,2,3])
      for(let k=10;k<=20;k++){
        const sal=Math.round(Math.min(cap,asking(db,p,t.region)*k/10)*10)/10,
          offer=normalizeContractTerms(db,p,t,sal,years,{
            signingBonus:0,bonuses:{performance:0,title:0,international:0},
            promisedRole:role,option:null,buyout:null
          });
        if(!negotiationBudgetError(db,p,t,offer,renewal?'renewal':'precontract')&&
          offerUtility(db,p,t,offer,{renewal})>=threshold)return offer;
      }
    throw new Error('D04_CONTRACT_WINDOW no acceptable legal offer found');
  };

  let n=startNegotiation(db,own.id,'renewal');
  assert(n.ok,'incumbent renewal could not start in exclusive window');
  let offer=acceptedOffer(n.neg,own,mine,true),r=submitNegotiationOffer(db,n.neg.id,offer);
  assert(r.ok&&n.neg.status==='accepted','exclusive renewal agreement did not accept');
  let ownAgreement=contractAgreementFor(db,own.id);
  assert(ownAgreement?.kind==='renewal'&&ownAgreement.status==='agreed'&&
    own.team===mine.id&&own.contract.until===2027,
    'renewal agreement changed current contract before expiry');

  // AI uses the same incumbent agreement writer and cannot operate the managed organization.
  let aiDb=unpackDB(packDB(db)),aiRows=aiRunExclusiveRenewals(aiDb);
  assert(aiDb.world.contractWindow.incumbentProcessed&&
    aiRows.every(x=>x.kind==='renewal'&&x.fromTeamId===x.teamId&&x.status==='agreed'),
    'AI incumbent renewal path bypassed the shared agreement rules');
  assert(!aiRows.some(x=>x.teamId===mine.id),
    'AI changed the manually managed organization during exclusivity');

  // Isolate manager outside-contact behavior after the AI parity branch above.
  db.world.contractWindow.incumbentProcessed=true;
  let adv=advanceOffseasonContractWindow(db);cw=db.world.contractWindow;
  assert(adv.ok&&cw.stage==='outside'&&db.worldDate==='2027-12-01',
    'day-15 outside contact boundary did not open');

  blocked=startNegotiation(db,optionPlayer.id,'precontract',{teamId:mine.id});
  assert(!blocked.ok&&blocked.msg.includes('옵션'),
    'player with next-season option was exposed to pre-contract');

  setRecruitmentPriority(db,target.id,'A');
  scoutPlayers(db,[target.id],40,0);scoutPlayers(db,[target.id],40,0);
  assert(recruitmentEvaluation(db,target.id,mine.id).ok,
    'outside target could not complete real recruitment evaluation');
  n=startNegotiation(db,target.id,'precontract',{teamId:mine.id});
  assert(n.ok&&n.neg.kind==='precontract','day-15 pre-contract negotiation did not start');
  offer=acceptedOffer(n.neg,target,mine,false);
  r=submitNegotiationOffer(db,n.neg.id,offer);
  assert(r.ok&&n.neg.status==='accepted','pre-contract agreement did not accept');
  let pre=contractAgreementFor(db,target.id);
  assert(pre?.kind==='precontract'&&pre.teamId===mine.id&&pre.fromTeamId===other.id&&
    target.team===other.id&&target.contract.until===2027,
    'pre-contract moved player before existing contract expiry');

  // AI outside offers use the same legal contact gate/writer. A direct legal AI
  // agreement on a separate player proves actor parity without consuming the manager fixture.
  const aiTerms=normalizeContractTerms(db,aiTarget,other,asking(db,aiTarget,other.region),1,{
    promisedRole:'starter'});
  const aiAgreement=recordContractAgreement(db,aiTarget,other,aiTerms,'precontract','ai');
  assert(aiAgreement.ok&&contractAgreementFor(db,aiTarget.id)?.actor==='ai'&&
    aiTarget.team===third.id,'AI pre-contract did not use shared future-agreement semantics');

  let packed=packDB(db);db=unpackDB(packed);
  mine=db.teams[mine.id];other=db.teams[other.id];
  own=db.players[own.id];target=db.players[target.id];aiTarget=db.players[aiTarget.id];
  assert(contractAgreementFor(db,target.id)?.status==='agreed'&&
    db.world.contractWindow.stage==='outside','contract window/agreement failed save restore');

  // Binding agreement cannot activate before Jan 1 or with altered terms.
  db.year=2028;db.worldDate='2027-12-31';
  let preview=previewWorldAction(db,{type:'player.sign',pid:target.id,teamId:mine.id,
    fromId:other.id,kind:'precontract',actor:'system',
    salary:pre.salary,years:pre.years,terms:pre.terms});
  assert(!preview.ok,'pre-contract activated before existing contract ended');
  db.worldDate='2028-01-01';
  preview=previewWorldAction(db,{type:'player.sign',pid:target.id,teamId:mine.id,
    fromId:other.id,kind:'precontract',actor:'system',
    salary:pre.salary+.1,years:pre.years,terms:{...pre.terms,salary:pre.salary+.1}});
  assert(!preview.ok&&preview.reason==='invalid_terms',
    'future activation allowed terms different from binding agreement');

  // Controlled fixture: outside AI market was covered separately above.
  db.world.contractWindow.outsideProcessed=true;
  const rep={resign:[],signings:[],expired:[]},
    settle=settleOffseasonContractRollover(db,rep);
  own=db.players[own.id];target=db.players[target.id];aiTarget=db.players[aiTarget.id];
  assert(settle.applied.length===3&&own.team===mine.id&&target.team===mine.id&&
    aiTarget.team===other.id,'Jan-1 agreement activation did not move/sign expected players');
  assert(contractAgreementFor(db,target.id).status==='effective'&&
    contractAgreementFor(db,target.id).appliedDate==='2028-01-01'&&
    target.contract.signed===2028&&target.contract.until===2028+pre.years-1,
    'pre-contract did not become the real contract on Jan 1');
  assert(!db.teams[other.id].roster.includes(target.id),
    'old club retained player after pre-contract activation');
  assert(db.worldDate==='2028-01-01',
    'controlled Jan-1 settlement unexpectedly changed the caller date');

  // A binding agreement must not crash the world if the player retires before
  // its effective date. It becomes an audited void without any signing action.
  const voidPlayer=Object.values(db.players).find(p=>!p.retired&&!p.team&&p.id!==target.id);
  assert(voidPlayer,'fixture missing player for agreement-void lifecycle');
  assignPlayerToTeam(db,voidPlayer,other);
  signContract(db,voidPlayer,other,asking(db,voidPlayer,other.region),1,{promisedRole:'backup'});
  voidPlayer.contract.until=2028;
  db.world.year=2028;db.world.contractWindow={
    seasonYear:2028,seasonEndDate:'2028-11-16',startDate:'2028-11-17',
    exclusiveThrough:'2028-11-30',outsideContactDate:'2028-12-01',
    contractExpiryDate:'2028-12-31',effectiveDate:'2029-01-01',
    stage:'outside',incumbentProcessed:true,outsideProcessed:true,completed:true
  };
  db.worldDate='2028-12-01';
  const voidTerms=normalizeContractTerms(db,voidPlayer,mine,
    asking(db,voidPlayer,mine.region),1,{promisedRole:'backup'});
  const voidAgreement=recordContractAgreement(db,voidPlayer,mine,voidTerms,'precontract','manager');
  assert(voidAgreement.ok,'void lifecycle agreement could not be recorded');
  removePlayerFromTeam(db,voidPlayer);voidPlayer.retired=true;voidPlayer.retiredYear=2028;
  db.year=2029;db.worldDate='2029-01-01';
  const voidActivation=applyDueContractAgreements(db,null);
  assert(voidActivation.applied.length===0&&voidActivation.voided.length===1&&
    contractAgreementFor(db,voidPlayer.id).status==='void'&&
    contractAgreementFor(db,voidPlayer.id).voidReason==='player_retired_or_missing',
    'retired player agreement did not void cleanly');

  packed=packDB(db);db=unpackDB(packed);
  assert(contractAgreementFor(db,target.id)?.status==='effective'&&
    db.players[target.id].team===mine.id,
    'effective future contract failed save/restore');

  console.log('D04_CONTRACT_WINDOW_ACCEPTANCE '+JSON.stringify({
    dates:{end:'2027-11-16',start:cw.startDate,exclusiveThrough:cw.exclusiveThrough,
      outside:cw.outsideContactDate,expiry:cw.contractExpiryDate,effective:cw.effectiveDate},
    agreements:{renewal:own.id,precontract:target.id,ai:aiTarget.id},
    aiExclusiveAgreements:aiRows.length,
    activated:settle.applied.map(x=>({pid:x.pid,kind:x.kind,team:x.teamId,
      appliedDate:x.appliedDate})),
    saveFormat:JSON.parse(packed).saveFormat
  }));
})();`;
vm.runInNewContext(source,{console,Date,Math,JSON,Set,Map,WeakMap,Object,
  Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto},{timeout:30000});

const [app,market]=await Promise.all([
  readFile(resolve(root,'app.js'),'utf8'),readFile(resolve(root,'ui-market.js'),'utf8')
]);
if(!app.includes('renderContractWindow()')||!app.includes('scontractday')||
  !app.includes('scontractopen')||
  !market.includes('data-start-precontract')||!market.includes('bindContractWindow'))
  throw new Error('D04_CONTRACT_WINDOW manager UI does not expose both contract-window stages');
console.log('D04_CONTRACT_WINDOW_UI_ACCEPTANCE '+JSON.stringify({
  exclusiveControl:true,outsidePrecontract:true,futureDates:true
}));
