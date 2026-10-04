import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('MATCH_ADJUDICATION '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:true,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1);setManagedTeam(db,a.id);
 for(const t of [a,b])for(const role of ROLES){const p=genPlayer(db,new RNG('match-history|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 db.world={year:db.year,manage:'manual',phase:'season',seasons:{}};
 const saved=packDB(db),signature=r=>JSON.stringify({winner:r.winner,ending:r.ending,duration:r.duration,gold:r.goldHist,firsts:r.firsts,sides:r.sides.map(s=>({nexus:s.nexus,towers:s.towers,kills:s.kills,players:s.ps.map(p=>({id:p.p.id,k:p.k,d:p.d,a:p.a,cs:p.cs,gold:p.goldEarned,xp:p.xp,lvl:p.lvl,dmg:p.dmg,hp:p.hp,items:p.items,quest:p.quest,vision:p.vision,objectives:p.objectives}))}))});
 const winners=new Set();let pairs=0;
 for(const seed of ['record-official','ending-clock-1','ending-clock-2'])for(const ids of [[a.id,b.id],[b.id,a.id]]){
  const logged=simulateMatch(db,...ids,seed,null,false),quiet=simulateMatch(db,...ids,seed,null,true);pairs++;
  check(signature(logged)===signature(quiet),'quiet/logged actual state, XP/items, clock or history differs');
  const n=logged.log.filter(e=>e.kind==='nexus'),last=logged.log.at(-1);winners.add(logged.winner);
  check(n.length===1&&last.kind==='nexus'&&last.side===logged.winner,'duplicate or post-nexus event');
  check(last.t===logged.ending.minute&&last.sec===logged.ending.second&&logged.duration===last.t+last.sec/60,'clock rewritten after termination');
  check(quiet.log.length===0&&!quiet.sides[1-quiet.winner].nexus&&quiet.sides[quiet.winner].nexus,'quiet ended without lawful nexus');
  check(JSON.stringify(seriesResultLines(logged,logged.sides[logged.winner].team.id,null))===JSON.stringify(seriesResultLines(quiet,quiet.sides[quiet.winner].team.id,null)),'ratings or rate consumers differ');
 }
 // Reviewed real behind-resource conversions after purchase timing correction.
 // Prior 13/21 source traces remain preserved for their original engine head.
 for(const seed of ['nexus-resource-scenario-19','nexus-resource-scenario-22']){
  const r=simulateMatch(db,a.id,b.id,seed,null,false),gold=r.sides.map(s=>s.ps.reduce((v,p)=>v+p.goldEarned,0)),w=r.winner;
  check(gold[w]<gold[1-w]&&!r.sides[1-w].nexus&&r.sides[w].nexus,'resource lead alone won or missing natural behind win');
  check(r.sides[w].ps.some(p=>p.deadUntil<=r.ending.minute)&&r.sides[1-w].nexusT===0&&LANES.some(l=>!r.sides[1-w].towers[l][3]),'no surviving conversion or open base');
  check(r.log.some(e=>e.side===w&&(e.kind==='fight'||e.kind==='obj'))&&r.log.at(-1).kind==='nexus','behind win lacks actual play/outcome evidence');
 }
 check(winners.size===2,'both-side fixtures missing');check(packDB(db)===saved,'simulation mutated world');
 // Real ordered structure destruction: first terminal event freezes the state.
 for(const quiet of [false,true])for(const side of [0,1]){
  const st={t:25,eventSecond:17,ending:null,quiet,seed:'end-boundary',rng:makeStreams('end-boundary'),winner:-1,log:[],expl:[],sides:[{team:a,nexus:true},{team:b,nexus:true}]};
  check(destroyMatchNexus(st,side)==='nexus'&&st.winner===side,'actual terminal writer');const frozen=JSON.stringify(st);
  check(destroyMatchNexus(st,1-side)===null,'same-minute second nexus accepted');
  for(const fn of [incomeTick,visionTick,laningTick,jungleTick,objectiveTick,macroTick,towerTick])fn(st);
  takeStructure(st,1-side,{allowNexus:true});convert(st,1-side,{});fight(st,'mid',[[],[]]);killPlayer(st,null,null,[],null);log(st,'post-end',{sec:58});expl(st,'post-end',[]);
  check(JSON.stringify(st)===frozen,'post-end tick/action/trace or RNG changed state');
 }
 const runOfficial=quiet=>{const copy=unpackDB(saved),sess=createSeriesSession(copy,a.id,b.id,1,'record-official',{compId:'history'});playSeriesSessionGame(copy,sess,null,quiet);return {copy,sess,rec:seriesSessionResult(copy,sess).rec}};
 const logged=runOfficial(false),quiet=runOfficial(true),g=logged.rec.games[0],q=quiet.rec.games[0];
 check(JSON.stringify(logged.sess.lines)===JSON.stringify(quiet.sess.lines),'actual official lines/rating differs');
 check(JSON.stringify(packMetaHistory(logged.copy.metaHistory))===JSON.stringify(packMetaHistory(quiet.copy.metaHistory)),'official public meta differs');
 const source=recordedPublicMatch(logged.copy,logged.rec,g).record;
 check(source?.ending?.kind==='nexus'&&source.ending.winner===g.winner&&q.publicRecord.events.length===0,'actual official ending source');
 const bad=JSON.parse(JSON.stringify(g));bad.publicRecord.ending.second=(bad.publicRecord.ending.second+1)%60;check(recordedPublicMatch(logged.copy,logged.rec,bad).reason==='unverified-source','forged ending accepted');
 const old=JSON.parse(JSON.stringify(g));delete old.publicRecord.ending;check(recordedPublicMatch(logged.copy,logged.rec,old).record,'legacy evidence rejected/reconstructed');
 logged.copy.world.seasons.history={id:'history',comp:'history',region:'EU',done:true,days:[{date:g.date,matches:[{res:logged.rec}]}]};
 const loaded=unpackDB(packDB(logged.copy)),lr=loaded.world.seasons.history.days[0].matches[0].res;
 check(lr.lite&&JSON.stringify(recordedPublicMatch(loaded,lr,lr.games[0]).record)===JSON.stringify(source),'lite ending history loss');
 console.log('MATCH_ADJUDICATION_ACCEPTANCE PASS '+pairs+' paired games, both winners, first-end/same-minute idempotence, all post-end phases/actions/RNG frozen, quiet/logged actual stats/XP/items/rates/meta equality, official source/lite/legacy/forged ending');
})()`,{timeout:60000});
