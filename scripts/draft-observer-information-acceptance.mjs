import {runEngineFixture,artifactSource} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('DRAFT_OBSERVER '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,system:'franchise'})];cfg.internationals=[];cfg.changes='none';
 const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1);setManagedTeam(db,a.id);
 for(const t of [a,b])for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 const first=simulateMatch(db,a.id,b.id,'draft-observer-public',null,true);recordMeta(db,first);
 const ctx={used:[],byTeam:{[a.id]:{won:[],lost:[]},[b.id]:{won:[],lost:[]}}},state=createDraftSession(db,[a.id,b.id],new RNG('draft-observer-live'),ctx);
 const cid=state.champs[0].id,p=state.roster[1].MID,own=state.roster[0].MID;
 const before=JSON.stringify(draftMasteryObservation(state,0,1,p,cid)),beforePool=JSON.stringify(draftManagedChampionPoolEvidence(db,p,cid));
 check(!draftMasteryObservation(state,0,1,p,cid).known&&draftMasteryObservation(state,0,1,p,cid).value===25,'unobserved mastery became estimate');
 const pool=p.pool;p.pool={[cid]:{mastery:99,confidence:99,trainingExperience:999}};check(JSON.stringify(draftMasteryObservation(state,0,1,p,cid))===before&&JSON.stringify(draftManagedChampionPoolEvidence(db,p,cid))===beforePool,'latent pool changes observer evidence');p.pool=pool;
 check(draftMasteryObservation(state,0,0,own,cid).value===draftMastery(own,cid)&&draftMasteryObservation(state,0,0,own,cid).known,'own mastery changed');
 let manual=false,turns=0;
 while(draftTurn(state)){
   const turn=draftTurn(state),opp=1-turn.side,foreign=Object.values(state.roster[opp]),descs=foreign.map(x=>Object.getOwnPropertyDescriptor(x,'pool'));
   for(const x of foreign)Object.defineProperty(x,'pool',{configurable:true,get(){throw Error('foreign pool read')}});
   const oldTac=state.tacs[opp],oldMeta=state.vhat[opp];state.tacs[opp]=new Proxy(oldTac,{get(){throw Error('foreign tactics read')}});state.vhat[opp]=new Proxy(oldMeta,{get(){throw Error('foreign meta research read')}});
   firstSelectionEvidence(db,state.teamIds[turn.side],state.teamIds[opp],ctx);
   const choice=draftAiChoice(state);check(choice&&draftValidateChoice(state,choice).ok,'actual AI choice illegal');
   if(turn.kind==='B'){
     const evidence=draftCandidateAnalysis(state,turn.side,choice.champ);check(evidence.opponentPool.every(x=>!x.known&&x.selectedRange[0]===20&&x.selectedRange[1]===99),'candidate fabricates numerical mastery');
     DRAFT_UI={state,playerSide:turn.side,selected:choice.champ};const html=draftUiAnalysisContent();check(html.includes('숙련도 수치 미관측')&&!html.includes('숙련 추정'),'ban UI lost unknown state');
   }
   if(turn.side===0&&turn.kind==='P'&&!manual){choice.source='player';manual=true}
   draftApplyChoice(state,choice);draftOpponentIntent(state,turn.side,3);
   foreign.forEach((x,i)=>Object.defineProperty(x,'pool',descs[i]));state.tacs[opp]=oldTac;state.vhat[opp]=oldMeta;turns++;
 }
 check(manual&&turns===20,'actual manual/AI full draft incomplete');
 const result=draftResult(state);check(validDraftSequence(result.sequence,result.picks.map(x=>Object.values(x)),result.bans),'final legal sequence invalid');
 const match=simulateMatch(db,a.id,b.id,'draft-observer-forced-match',{forced:result,used:[],byTeam:ctx.byTeam},true);check(JSON.stringify(match.draft.picks)===JSON.stringify(result.picks)&&JSON.stringify(match.draft.bans)===JSON.stringify(result.bans),'played match did not use manual draft');recordMeta(db,match);check(db.metaHistory.length===2,'actual played manual draft record missing');
 const full=JSON.stringify(db),rng=JSON.stringify(state.rng);draftOpponentIntent(state,0,20);draftManagedChampionPoolEvidence(db,p,cid);check(JSON.stringify(db)===full&&JSON.stringify(state.rng)===rng,'read-only evidence changes state/random stream');
 const copy=unpackDB(packDB(db));check(JSON.stringify(draftManagedChampionPoolEvidence(copy,copy.players[p.id],cid))===JSON.stringify(draftManagedChampionPoolEvidence(db,p,cid)),'save changes public pool');
 const empty=unpackDB(packDB(db));empty.metaHistory=[];empty.scout={[p.id]:98};const legacy=draftManagedChampionPoolEvidence(empty,empty.players[p.id],cid);check(!legacy.top.length&&!legacy.known&&legacy.selectedRange[0]===20&&legacy.selectedRange[1]===99,'legacy counter reveals pool or mastery');
 console.log('DRAFT_OBSERVER_INFORMATION_ACCEPTANCE PASS full 20-turn manual/AI draft, opponent pool/tactics/meta traps, own mastery, latent invariance, unknown/legacy/public/save, actual played match');
})();`,{timeout:60000,setupSources:["let DRAFT_UI;const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');",await artifactSource('ui-draft.js')]});
