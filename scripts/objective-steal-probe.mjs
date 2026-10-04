import {runEngineFixture} from './test-harness.mjs';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const count=Number(process.argv[3]||32),offset=Number(process.argv[4]||0);
if(!Number.isInteger(count)||count<1||count>64||!Number.isInteger(offset)||offset<0||offset>96)throw Error('bounded count 1–64 and offset 0–96 required');
const source=await runEngineFixture(`(()=>{
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:4,div2:true,system:'franchise'})];cfg.internationals=[];const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1);setManagedTeam(db,a.id);
 for(const t of [a,b])for(const role of ROLES){const p=genPlayer(db,new RNG('match-history|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 const original={teamCall,log,awardMatchObjective},calls=new WeakMap(),steals=new WeakMap(),trace=[];
 teamCall=(st,side,key,...rest)=>{const r=original.teamCall(st,side,key,...rest);let c=calls.get(st);if(!c)calls.set(st,c={});(c[key]||=[])[side]=r.part.map(p=>p.p.id);return r};
 log=(st,text,options)=>{if(text.includes(' 스틸!')){const actor=st.sides[options.side].ps.find(p=>p.role==='JGL');steals.set(st,{actor:actor.p.id,side:options.side,minute:st.t,calls:JSON.parse(JSON.stringify(calls.get(st))),before:{objectives:actor.objectives,quest:JSON.parse(JSON.stringify(actor.quest))}})}return original.log(st,text,options)};
 awardMatchObjective=(st,key,side,part,...rest)=>{const pending=steals.get(st),ok=original.awardMatchObjective(st,key,side,part,...rest);if(pending){const actor=st.sides[side].ps.find(p=>p.p.id===pending.actor);trace.push({...pending,key,part:part.map(p=>p.p.id),accepted:ok,after:{objectives:actor.objectives,quest:JSON.parse(JSON.stringify(actor.quest))},receipt:st.objectiveEvents?.at(-1)});steals.delete(st)}return ok};
 const world=packDB(db),runs=[];for(let i=${offset};i<${offset+count};i++)for(const ids of [[a.id,b.id],[b.id,a.id]]){const seed='objective-steal-source-'+i,start=trace.length,r=simulateMatch(db,...ids,seed,null,false);runs.push({seed,sides:ids,winner:r.winner,ending:r.ending,duration:r.duration,objectives:r.objectiveEvents,players:r.sides.map(s=>s.ps.map(p=>({id:p.p.id,k:p.k,d:p.d,a:p.a,quest:p.quest,objectives:p.objectives,gold:p.goldEarned,held:p.gold,items:p.items,damage:p.dmg}))),log:r.log,steals:trace.slice(start)});if(packDB(db)!==world)throw Error('observer world mutation')}
 return {setup:'NA4 franchise, default tactics, genPlayer match-history|team.id+role age22/base65',provenance:'Seeded fictional match execution with read-only wrappers, no injected outcomes/professional frequency target',runs};
})()`,{timeout:60000});
source.hashes={};for(const f of ['engine.js','objective-awards.js','role-quest-match.js','takedown-rewards.js']){try{source.hashes[f]=createHash('sha256').update(await readFile('src/artifact/'+f)).digest('hex')}catch{}}
if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(source,null,2)+'\n');const events=source.runs.flatMap(r=>r.steals.map(s=>({...s,seed:r.seed,sides:r.sides})));console.log(JSON.stringify({runs:source.runs.length,steals:events.length,omitted:events.filter(e=>!e.receipt.participants.includes(e.actor))}));
