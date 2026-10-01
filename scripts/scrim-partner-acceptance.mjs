// Realistic AI practice-market acceptances, using canonical engine and save code.
import {artifactSources,runEngineFixture} from './test-harness.mjs';
const source=String.raw`(()=>{
  const check=(ok,why)=>{if(!ok)throw new Error('SCRIM_PARTNER_ACCEPTANCE '+why)};
  const cfg=defaultWorldConfig();
  cfg.regions=[regionCfg('NA',{teams:10,splits:1,legs:1,regularBo:1,
    playoffBo:1,playoffTake:4,format:'rr_po',div2:false,
    system:'franchise'})];
  cfg.internationals=[];cfg.subs=0;cfg.changes='none';
  const db=buildWorld(cfg),clubs=activeTeams(db,null,1);
  startCareer(db,clubs[0].id,'scrim-partners-test');
  autoBuildInitialSquad(db,clubs[0],new RNG('partner-start','squad'),5);
  finalizeInitialRosters(db);
  const date=addDays(nextDate(db),-4);
  db.worldDate=date;
  const match=Object.values(db.world.seasons).flatMap(s=>s.days)
    .find(d=>d.date>=date&&d.date<=addDays(date,7))?.matches[0];
  check(match,'a real scheduled opponent is required');
  const rivalA=db.teams[match.a],rivalB=db.teams[match.b];
  check(!officialBookedTeams(db).has(rivalA.id)&&
    scrimReadiness(db,rivalA).ok&&scrimReadiness(db,rivalB).ok,
    'both imminent opponents should have otherwise-open practice schedules');
  const conflict=scrimPartnerAssessment(db,rivalA,rivalB);
  check(!conflict.allowed&&conflict.rivalDays>=0&&conflict.rivalDays<=7,
    'upcoming head-to-head teams must protect private tactical prep');
  check(simulateBackgroundScrim(db,rivalA,rivalB,2,
    new RNG('embargo','test'),'afternoon')===null,
    'direct practice booking bypassed imminent official-rival exclusion');
  const fresh=clubs.flatMap((a,i)=>clubs.slice(i+1)
    .filter(b=>scrimPartnerAssessment(db,a,b).allowed).map(b=>[a,b]))[0];
  check(fresh,'need a non-rival pair on a regular domestic week');
  const [strong,weak]=fresh;
  const strengths={[strong.id]:96,[weak.id]:66},
    comparable={[strong.id]:80,[weak.id]:81};
  const fair=scrimPartnerAssessment(db,strong,weak,null,comparable);
  const lopsided=scrimPartnerAssessment(db,strong,weak,null,strengths);
  check(fair.allowed&&lopsided.allowed&&fair.acceptance>=.74&&
    fair.acceptance<=.84&&lopsided.acceptance>=.30&&
    lopsided.acceptance<=.42,
    'scrim probabilities left the moderate same-tier / strength-gap bands');
  check(fair.acceptance>lopsided.acceptance*1.8&&
    lopsided.left.approval<lopsided.right.approval*.75,
    'weak club should welcome strong practice more often, without blanket rejection');
  const gaps=[8,12,20,30,40],rates=gaps.map(gap=>
    scrimPartnerAssessment(db,strong,weak,null,
      {[strong.id]:80+gap,[weak.id]:80}).acceptance);
  check(rates.every((v,i)=>i===0||v<rates[i-1])&&
    rates.every(rate=>rate>=.25),
    'acceptance must soften gradually and remain possible across realistic strength gaps');
  const confidenceDb=unpackDB(packDB(db));
  const confidenceStrong=confidenceDb.teams[strong.id],
    confidenceWeak=confidenceDb.teams[weak.id];
  for(const role of ROLES){
    const player=starterFor(confidenceDb,confidenceStrong,role);
    if(player)player.morale=43;
  }
  const separateRival=clubs.find(x=>x.id!==strong.id&&x.id!==weak.id);
  const losing=Array.from({length:3},(_,i)=>({
    date:addDays(date,-(i+1)),matches:[{
      a:strong.id,b:separateRival.id,res:{winner:separateRival.id}
    }]
  }));
  confidenceDb.world.seasons._formEvidence={days:losing};
  const form=scrimRecentResults(confidenceDb,strong.id),
    intent=scrimClubIntent(confidenceDb,confidenceStrong);
  check(form.losingStreak>=3&&intent.confidence&&intent.goal==='자신감 회복',
    'losing streak and low player morale did not change practice goals');
  const recovering=scrimPartnerAssessment(confidenceDb,
    confidenceStrong,confidenceWeak,null,strengths);
  check(recovering.allowed&&
    recovering.acceptance>=lopsided.acceptance+.10&&
    recovering.acceptance<=lopsided.acceptance+.23&&
    recovering.acceptance<fair.acceptance&&
    recovering.left.reason.includes('자신감'),
    'confidence reset should increase interest by a moderate amount, not override team strength');
  // A less severe slump must have a smaller boost than a deep slump.
  const partialDb=unpackDB(packDB(db)),partialStrong=partialDb.teams[strong.id];
  for(const role of ROLES){
    const player=starterFor(partialDb,partialStrong,role);
    if(player)player.morale=54;
  }
  partialDb.world.seasons._partialEvidence={
    days:losing.slice(0,2)
  };
  const partial=scrimPartnerAssessment(partialDb,partialStrong,
    partialDb.teams[weak.id],null,strengths);
  check(partial.allowed&&partial.acceptance>lopsided.acceptance+.04&&
    partial.acceptance<recovering.acceptance-.01,
    'the confidence-building boost must scale with slump severity');
  // Opponent relationships are evaluated for both teams, so invert the
  // invitation without changing whether a match is a forbidden future rival.
  const reversed=scrimPartnerAssessment(db,weak,strong,null,strengths);
  check(reversed.allowed&&Math.abs(reversed.acceptance-lopsided.acceptance)<1e-8,
    'bilateral offer acceptance should not depend on who initiated it');
  const matchDate=addDays(date,9);
  const secrecyDb=unpackDB(packDB(db));
  secrecyDb.world.seasons._futureEvidence={
    days:[{date:matchDate,matches:[{a:strong.id,b:weak.id,res:null}]}]
  };
  const confidential=scrimPartnerAssessment(secrecyDb,
    secrecyDb.teams[strong.id],secrecyDb.teams[weak.id],null,comparable);
  check(confidential.allowed&&
    confidential.acceptance>=fair.acceptance*.60&&
    confidential.acceptance<=fair.acceptance*.75,
    'the two-week tactical secrecy window should lower interest, not nearly ban it');
  // Repeated partners lose selection weight even if both teams remain free.
  const repeatDb=unpackDB(packDB(db));
  repeatDb.teams[strong.id].scrimLog=Array.from({length:3},(_,i)=>({
    date:addDays(date,-i-1),opponent:weak.id,games:2,slot:'afternoon'
  }));
  const repeated=scrimPartnerAssessment(repeatDb,
    repeatDb.teams[strong.id],repeatDb.teams[weak.id],null,comparable);
  check(repeated.allowed&&repeated.weight<fair.weight,
    'stale repetitive partners must lose preference relative to novel matches');
  const beforeMeta=db.metaGames||0;
  const result=aiRunScrims(db,new RNG('market-partners','daily'));
  check(result.blocks>=2&&result.sets>=4,
    'scrim search should still produce multiple blocks in an ordinary ten-team league');
  let activities=0;
  for(const club of clubs){
    for(const row of club.scrimLog||[]){
      if(row.date!==date)continue;
      const other=db.teams[row.opponent];
      check(other&&row.purpose&&['afternoon','evening'].includes(row.slot),
        'practice did not record per-team purpose, partner and slot');
      check(scrimPartnerAssessment(db,club,other).allowed,
        'search scheduled an excluded near-future official rival');
      check((other.scrimLog||[]).some(x=>x.date===date&&x.slot===row.slot&&
        x.opponent===club.id&&x.games===row.games),
        'scrim offer failed to reserve a matching block in both club calendars');
      activities++;
    }
  }
  check(activities>=4,'not enough bilateral practice sessions were persisted');
  check((db.metaGames||0)===beforeMeta,
    'private scrims must not contaminate the competitive meta sample');
  const restored=unpackDB(packDB(db));
  check(restored.version===15&&restored.saveFormat===2&&
    restored.teams[clubs[0].id].scrimLog?.length===
      db.teams[clubs[0].id].scrimLog?.length,
    'realistic practice purposes must survive world v15/save-format 2');
  console.log('SCRIM_PARTNER_ACCEPTANCE '+JSON.stringify({
    embargo:conflict.rivalDays,strongVsWeak:Math.round(lopsided.acceptance*100),
    slumpingStrong:Math.round(recovering.acceptance*100),
    sameTier:Math.round(fair.acceptance*100),
    moderateSlump:Math.round(partial.acceptance*100),
    strengthBands:gaps.map((gap,i)=>[gap,Math.round(rates[i]*100)]),
    blocks:result.blocks,sets:result.sets,recorded:activities,
    version:restored.version,saveFormat:restored.saveFormat
  }));
})()`;
await runEngineFixture(source,{timeout:40000,filename:'scrim-partner-acceptance.fixture.js'});
const [owner,practice,ui]=await artifactSources(
  ['scrim-partner.js','scrim.js','ui-roster.js']
);
const assert=(condition,msg)=>{if(!condition)throw new Error('Scrim UI: '+msg)};
assert(owner.includes('scrimOfficialRivalWindow')&&
  owner.includes('scrimClubIntent')&&owner.includes('scrimPartnerAssessment')&&
  owner.includes('losingStreak'),'market must assess rivals, results and confidence');
assert(practice.includes('scrimPartnerAssessment(db,t,opp)')&&
  practice.includes("purpose:rec.goals?.[tid]")&&
  practice.includes('chosen.offer.acceptance'),
  'both direct booking and AI negotiation must use the acceptance engine');
assert(ui.includes('x.purpose')&&ui.includes('7일 내 공식전 상대'),
  'the selected practice motivation and tactical embargo must be visible');
console.log('Scrim partner UI integration: PASS');
