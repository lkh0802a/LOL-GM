import {runEngineFixture,artifactSource} from './test-harness.mjs';
const engine=await artifactSource('engine.js'),fightSource=engine.slice(engine.indexOf('function fight('),engine.indexOf('function laneProgress('));
const observed=fightSource.replace('const K=',"globalThis.__combatHealth.starts.push(...F.map(f=>({input:f.ps.hp,start:f.hp/f.max})));const K=").replace('else f.ps.hp=clamp(f.hp/f.max,0,1);',"else {f.ps.hp=clamp(f.hp/f.max,0,1);globalThis.__combatHealth.ends.push({remaining:f.hp/f.max,stored:f.ps.hp});}");
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('COMBAT_RESOURCE '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:true,system:'franchise'})];cfg.internationals=[];
 const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1);setManagedTeam(db,a.id);
 for(const t of [a,b])for(const role of ROLES){const p=genPlayer(db,new RNG('match-history|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 db.world={year:db.year,manage:'manual',phase:'season',seasons:{}};
 // Real quest consumer sees only applied report damage. No completion/reward is
 // inferred from overkill; repeated packets on the same dead target are inert.
 const ps=newPS(db.players[a.depthChart.MID],0,'MID',championByName(db,'Ahri').id,db.patch),victim=newPS(db.players[b.depthChart.MID],1,'MID',championByName(db,'Ahri').id,db.patch);
 const st={t:12,ending:null,quiet:true,patch:db.patch,rng:makeStreams('packet'),sides:[{team:a,ps:[ps]},{team:b,ps:[victim]}],log:[],expl:[]};
 const f={ps,side:0,hp:100,alive:true},t={ps:victim,side:1,alive:true,hp:100,max:100,hitters:new Set(),last:null},questBefore=ps.quest.progress;
 const paid=applyFightDamage(st,f,t,1000,true);check(paid===90&&t.hp===0&&ps.dmg===victim.dmgTaken&&ps.teamfightDmg===90&&t.last===f,'effective budget/stat accounting');
 const frozen=JSON.stringify([ps,victim,t.hp,st.rng]),hitters=t.hitters.size;
 check(applyFightDamage(st,f,t,1000,true)===0&&JSON.stringify([ps,victim,t.hp,st.rng])===frozen&&t.hitters.size===hitters,'duplicate/dead target mutated');
 check(ps.quest.progress===questBefore+90*ps.quest.rules.damageRanged,'quest received attempted overkill');
 const live={...t,hp:40,hitters:new Set(),last:null};st.ending={kind:'nexus'};const terminal=JSON.stringify([ps,victim,live.hp,st.rng]);
 check(applyFightDamage(st,f,live,20,true)===0&&JSON.stringify([ps,victim,live.hp,st.rng])===terminal,'post-end damage mutated');st.ending=null;
 const missed=JSON.stringify([ps,victim,live.hp,st.rng]);for(const d of [0,-1,NaN])check(applyFightDamage(st,f,live,d,false)===0&&JSON.stringify([ps,victim,live.hp,st.rng])===missed,'nonpositive packet consumed');
 // A second target retains its own budget; overkill is never moved for free.
 const other={ps:victim,side:1,alive:true,hp:50,hitters:new Set(),last:null};check(other.hp===50&&applyFightDamage(st,f,other,20,false)===18&&other.hp===30,'separate target budget');
 const saved=packDB(db),digest=r=>JSON.stringify({winner:r.winner,ending:r.ending,duration:r.duration,gold:r.goldHist,ps:r.sides.map(s=>s.ps.map(p=>({k:p.k,d:p.d,a:p.a,dmg:p.dmg,taken:p.dmgTaken,hp:p.hp,quest:p.quest,ledger:matchGoldLedger(p),items:matchQuestItems(p)})))});
 let pairs=0;for(const seed of ['record-official','combat-resource-1'])for(const ids of [[a.id,b.id],[b.id,a.id]]){const r=simulateMatch(db,...ids,seed,null,false),q=simulateMatch(db,...ids,seed,null,true);check(digest(r)===digest(q)&&r.ending.kind==='nexus','actual logged/quiet/side outcome');check(r.sides.flatMap(s=>s.ps).reduce((v,p)=>v+p.dmg,0)===r.sides.flatMap(s=>s.ps).reduce((v,p)=>v+p.dmgTaken,0),'actual damage totals disagree');pairs++;}
 check(packDB(db)===saved,'simulation modified world/history');
 check(__combatHealth.starts.length>0&&__combatHealth.starts.every(x=>Math.abs(x.start-x.input)<1e-10),'fight manufactured starting health');
 check(__combatHealth.ends.length>0&&__combatHealth.ends.every(x=>x.stored===x.remaining),'survivor manufactured health');
 check(__combatHealth.starts.some(x=>x.input<.2)&&__combatHealth.ends.some(x=>x.remaining<.05),'real low-health carry fixture missing');
 const session=createSeriesSession(db,a.id,b.id,1,'combat-resource-series',{compId:'resource'});db.world.pendingOfficial={queue:[{session}]};const resumed=unpackDB(packDB(db)),sess=resumed.world.pendingOfficial.queue[0].session;playSeriesSessionGame(resumed,sess,null,false);
 const rec=seriesSessionResult(resumed,sess).rec,g=rec.games[0],p=recordedPublicMatch(resumed,rec,g).record;check(p?.damageBasis==='effective-aggregate-v1','actual official source basis missing');
 resumed.world.seasons.resource={id:'resource',comp:'resource',region:'NA',done:true,days:[{date:g.date,matches:[{res:rec}]}]};
 for(const region of ['NA','EU']){resumed.world.seasons.resource.region=region;const copy=unpackDB(packDB(resumed)),r=copy.world.seasons.resource.days[0].matches[0].res;check(JSON.stringify(r.games[0].publicRecord)===JSON.stringify(g.publicRecord),'full/lite original source changed');}
 globalThis.esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 check(renderPublicMatchReview(resumed,rec,g,{}).includes('남은 체력 예산'),'real review explanation disconnected');
 const legacy=JSON.parse(JSON.stringify(g));delete legacy.publicRecord.damageBasis;const old=JSON.stringify(legacy);check(recordedPublicMatch(resumed,rec,legacy).record&&renderPublicMatchReview(resumed,rec,legacy,{}).includes('이전 기록의 피해 집계 방식')&&JSON.stringify(legacy)===old,'legacy invented source/recomputed');
 const malformed=JSON.parse(JSON.stringify(g));malformed.publicRecord.damageBasis='exact-spells';check(!recordedPublicMatch(resumed,rec,malformed).record,'forged unsupported model accepted');
 check(!renderPublicMatchReview(resumed,rec,g,{}).includes('<th>아이템'),'item review column returned');
 console.log('COMBAT_RESOURCE_ACCEPTANCE PASS '+JSON.stringify({pairs,appliedPacket:paid,officialBasis:p.damageBasis,pendingFullLite:true,legacyPure:true,exactGeometry:false}));
})()`,{timeout:60000,setupSources:[await artifactSource('ui-match-history.js'),await artifactSource('ui-takedown-history.js'),'globalThis.__combatHealth={starts:[],ends:[]};'+observed]});
