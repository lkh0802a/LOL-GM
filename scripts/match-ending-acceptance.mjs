import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(x,m)=>{if(!x)throw Error('MATCH_ENDING '+m)};
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:10,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),teams=activeTeams(db,null,1),a=teams[0],b=teams[1];
  startCareer(db,a.id,'ending-baseline');autoBuildInitialSquad(db,a,new RNG('ending-squad','squad'),5);finalizeInitialRosters(db);
  const saved=packDB(db),ordinary=simulateMatch(db,a.id,b.id,'ending-baseline-0',null,false);
  check(ordinary.winner>=0&&!ordinary.sides[1-ordinary.winner].nexus,'ordinary result requires destroyed nexus');
  check(packDB(db)===saved,'ordinary simulation mutated career');
  const original=takeStructure;
  // Stalled structures reproduce the old timeout without forging match results.
  takeStructure=()=>null;
  try{
    let failed=false;
    try{simulateMatch(db,a.id,b.id,'ending-cap-probe',null,false)}
    catch(e){failed=/Match unresolved: neither nexus/.test(e.message)&&e.message.includes('ending-cap-probe')}
    check(failed,'unresolved match produced a gold winner or lost diagnostic context');
    check(packDB(db)===saved,'guard failure changed career/save');
  }finally{takeStructure=original;}
  // Permit actual structure conversion only after the former cutoff. The existing
  // tick/fight/conversion path must continue rather than force a deadline winner.
  takeStructure=(st,side,opt)=>st.t<=70?null:original(st,side,opt);
  try{
    const late=simulateMatch(db,a.id,b.id,'ending-cap-probe',null,false);
    check(late.duration>70&&late.duration<=MATCH_SIMULATION_MAX_MINUTES+1,'ordinary ticks did not continue after old cutoff');
    check(!late.sides[1-late.winner].nexus&&late.log.some(x=>x.kind==='nexus'),'late winner lacks actual nexus destruction');
    check(!late.log.some(x=>x.text.includes('골드 우위 팀 승리')),'gold timeout remained');
    check(packDB(db)===saved,'late match mutated career');
  }finally{takeStructure=original;}
  const loaded=unpackDB(saved),resumed=simulateMatch(loaded,a.id,b.id,'ending-baseline-0',null,false);
  const signature=m=>JSON.stringify({winner:m.winner,duration:m.duration,gold:m.goldHist,firsts:m.firsts,log:m.log});
  check(signature(resumed)===signature(ordinary),'modern save resume changed seeded match');
  console.log('MATCH_ENDING_ACCEPTANCE_PASS');
})()`,{timeout:30000});
