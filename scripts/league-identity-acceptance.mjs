import {runEngineFixture,artifactSource} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(x,m)=>{if(!x)throw Error('LEAGUE_IDENTITY '+m)};
  const cfg=defaultWorldConfig();cfg.regions.find(r=>r.id==='NA').splitNames={1:'개막 시즌',2:'중간 시즌',3:'최종 시즌'};const db=buildWorld(cfg);
  const repeat=buildWorld(cfg);
  const generatedSignature=x=>JSON.stringify({...x,saveId:'storage-only'});
  check(generatedSignature(db)===generatedSignature(repeat),'cached world differs from seeded world');
  const firstAthlete=Object.keys(db.players)[0],firstClub=Object.keys(db.teams)[0];
  repeat.players[firstAthlete].attrs.csing=1;repeat.teams[firstClub].name='Changed world';repeat.regions.KR.name='Changed region';
  const fresh=buildWorld(cfg);
  check(generatedSignature(db)===generatedSignature(fresh),'world template retained live mutations');
  check(!PLAYER_GENERATION_INDEX.has(db),'generation identity lookup escaped batch');
  check(cfg.regions.length===6,'initial major region count changed');
  check(cfg.regions.every(r=>/^L[A-Z]{2}$/.test(r.short)&&r.div2),'initial leagues need three-letter abbreviations and tier two');
  check(Object.values(REGION_PRESETS).every(r=>/^L[A-Z]{2}$/.test(r.short)),'preset abbreviation is inconsistent');
  check(db.regions.BR.name==='남미'&&db.regions.BR.short==='LSA','South American ecosystem missing');
  check(REGION_PRESETS.LA.name==='중미·카리브'&&REGION_PRESETS.LA.parent==='NA','Central American parent/label still overlaps South America');
  const expected={KR:'LKC',CN:'LDL',EU:'LEA',NA:'LNA',AP:'LPA',BR:'LSC'};
  for(const r of Object.values(db.regions)){
    const top=activeTeams(db,r.id,1),second=activeTeams(db,r.id,2);
    check(top.length&&second.length,'tier two missing in '+r.id);
    check(second.every(t=>!t.parent||db.teams[t.parent].region===r.id),'reserve belongs to another regional organization');
    check(managerSelectableTeams(db,r.id,2).length===second.length,'tier two cannot be managed');
    const comp=leagueComp(db,r.id,2);
    check(comp.id===r.short+'2'&&comp.name===expected[r.id]&&comp.short===expected[r.id],'competition ID/display mixup '+r.id);
    check(comp.teams.length===second.length&&comp.stages.length,'tier two lacks actual competition stages');
  }
  // Scoped identity lookup preserves ordinary seeded generation (names, IDs,
  // attributes, contracts/profile data) and never becomes persisted state.
  const ordinary={...db,players:{...db.players}},indexed={...db,players:{...db.players}};
  const identityIndex={count:Object.keys(indexed.players).length,names:new Set(Object.values(indexed.players).map(p=>p.name))};
  const rngA=new RNG('identity-parity','players'),rngB=new RNG('identity-parity','players');
  for(let i=0;i<20;i++){
    const opts={role:ROLES[i%ROLES.length],age:20,base:55,region:'KR'};
    const a=genPlayer(ordinary,rngA,opts),b=genPlayer(indexed,rngB,opts,identityIndex);
    check(JSON.stringify(a)===JSON.stringify(b),'generation index changed seeded athlete');
  }
  check(divName({short:'XYZ',leagueName:'Custom',system:'relegation'})==='XYZ CL','generic league copied a national label');
  // Exercise legal first-season formation and all six actual scheduled tier-twos.
  const reserve=activeTeams(db,'NA',2)[0];
  startCareer(db,reserve.id,'league-identity-career');finalizeInitialRosters(db);
  check(db.world.steps.find(s=>s.kind==='league').label==='스플릿 1','default official split name is stale');
  check(Object.values(db.world.seasons).find(s=>s.region==='NA'&&s.div===1)?.label==='개막 시즌','regional office split label was ignored');
  for(const r of Object.values(db.regions)){
    const c=db.competitions[r.short+'2'];
    const s=Object.values(db.world.seasons).find(s=>s.comp===c?.id);
    check(c?.short===expected[r.id]&&s?.days.some(d=>d.matches.length),'scheduled tier-two fixtures missing '+r.id);
  }
  // Generated labels can change on load; geographic identity and every evidence key cannot.
  db.regions.BR.name='브라질';db.regions.BR.leagueName='CBLOL';db.regions.BR.short='CBLOL';
  db.regions.LA=regionCfg('LA',{name:'라틴 아메리카',leagueName:'LLA',short:'LLA',parent:'BR',div2:false});
  const c=db.competitions.LPL2;c.name='LPL 챌린저스';c.short='LPL2';
  db.history.push({year:2026,comp:'LPL2',compName:'LPL 챌린저스',champion:c.teams[0]});
  const identity=()=>JSON.stringify(Object.values(db.players).map(p=>[p.id,p.region,p.originRegion,p.nationality,p.activeLocalRegion,p.contract]));
  const before=identity(),history=JSON.stringify(db.history),seasons=JSON.stringify(Object.keys(db.world.seasons));
  const restored=unpackDB(packDB(db));
  check(restored.competitions.LPL2.id==='LPL2'&&restored.competitions.LPL2.name==='LDL'&&restored.competitions.LPL2.short==='LDL','legacy default label not restored');
  check(restored.regions.BR.name==='브라질'&&restored.regions.LA.parent==='BR','legacy geography silently reorganized');
  check(JSON.stringify(Object.values(restored.players).map(p=>[p.id,p.region,p.originRegion,p.nationality,p.activeLocalRegion,p.contract]))===before,'player geography/contract changed on load');
  check(JSON.stringify(restored.history)===history&&JSON.stringify(Object.keys(restored.world.seasons))===seasons,'historical names or season IDs rewritten');
  restored.competitions.LPL2.name='Custom Cup';restored.competitions.LPL2.short='CUSTOM';
  const custom=unpackDB(packDB(restored));check(custom.competitions.LPL2.name==='Custom Cup'&&custom.competitions.LPL2.short==='CUSTOM','custom league label overwritten');
  // New geographic submarket independence must not dissolve the entire North American league.
  const gov=buildWorld();gov.world={year:gov.year,seed:'region-office'};gov.worldHype=600;
  const rng=new RNG('league-identity-governance','office');let call=0;
  rng.chance=()=>++call===1; // approve joining, choose historic pool and explicit candidate only
  const oldPick=rng.pick.bind(rng);rng.pick=xs=>xs.find?.(x=>x?.id==='LA')||oldPick(xs);
  worldDecisions(gov,rng,1,()=>{});
  check(gov.regions.LA&&gov.regions.NA&&gov.regions.BR,'Central American independence dissolved North/South America');
  check(gov.regions.LA.parent==='NA','new submarket parent changed');
  check(gov.regions.LA.div2&&gov.regions.LA.tier2Required&&activeTeams(gov,'LA',2).length,'new regional league lacks required tier two');
  let rejected=false;try{abolishDiv2(gov,gov.regions.LA)}catch(e){rejected=e.message.includes('필수')}
  check(rejected&&gov.regions.LA.div2,'required tier two can be abolished');
  const freshIdentity=newLeagueIdentity(gov,new RNG('league-names','fixture'),FUTURE_LEAGUE_MARKETS[0]);
  check(/^L[A-Z]{2}$/.test(freshIdentity.short)&&/^L[A-Z]{2}$/.test(freshIdentity.tier2Short)&&freshIdentity.short!==freshIdentity.tier2Short,'future league naming loses the agreed convention');
  const expanded=addRegion(gov,new RNG('league-expansion','fixture'),regionCfg('IN',{...freshIdentity,teams:10,div2:true}));
  check(expanded.tier2Required&&activeTeams(gov,'IN',2).length&&leagueComp(gov,'IN',2).short===freshIdentity.tier2Short,'fictional expansion lacks real tier two');
  // Render the actual picker: both divisions use league labels, and the selected label follows it.
  DB=restored;SSET={team:c.teams[0],region:'CN',division:2};
  const html=managerTeamPicker();
  check(html.includes('>LPL</option>')&&html.includes('>LDL</option>'),'picker still mixes tier numbers with league abbreviations');
  check(html.includes('static-field">LDL</span>'),'picker league field disagrees with selected tier');
  console.log('LEAGUE_IDENTITY_ACCEPTANCE_PASS '+JSON.stringify({majorRegions:cfg.regions.length,tierTwoLeagues:6,labels:expected,initialAthletes:Object.keys(db.players).length,preAuctionAdded:db.initialRegionalSupply.created,legacyIdsPreserved:true}));
})()`,{timeout:60000,setupSources:[
  'let DB=null,SSET={};const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");',
  await artifactSource('ui-setup.js')
]});
