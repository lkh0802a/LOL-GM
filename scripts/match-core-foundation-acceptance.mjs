// Controlled S0 contract tests. No physical game, official result or world-save adapter is claimed.
import assert from 'node:assert/strict';
import {runEngineFixture} from './test-harness.mjs';

const result=await runEngineFixture(String.raw`(()=>{
  const check=(v,m)=>{if(!v)throw Error('MATCH_CORE_FOUNDATION '+m)},
    copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(matchCoreClone(a))===JSON.stringify(matchCoreClone(b));
  const spec=()=>({matchId:'foundation-controlled-match',seed:'core-foundation-seed',
    patchSnapshot:{id:'26.19',revision:0,sourceVersion:'16.19.1'},teams:[
      {id:'blue',side:'BLUE',actors:ROLES.map((role,i)=>({id:'b-'+role,role,
        championId:['champ_aatrox','champ_vi','champ_ahri','champ_jinx','champ_leona'][i]}))},
      {id:'red',side:'RED',actors:ROLES.map((role,i)=>({id:'r-'+role,role,
        championId:['champ_ornn','champ_viego','champ_orianna','champ_xayah','champ_maokai'][i]}))}
    ]});
  const input=spec(),inputBefore=JSON.stringify(input),k=new MatchCoreKernel(input);
  check(JSON.stringify(input)===inputBefore,'constructor mutated source');
  const initial=k.snapshot();input.patchSnapshot.revision=99;input.teams[0].actors[0].championId='changed';
  check(same(k.snapshot(),initial),'producer alias changed pinned match');
  const reordered=spec();reordered.teams.reverse();for(const t of reordered.teams)t.actors.reverse();
  check(same(new MatchCoreKernel(reordered).snapshot(),initial),'input array order changed identity/seed');
  const hidden=spec();for(const t of hidden.teams)for(const p of t.actors)
    for(const field of ['attrs','medical','futureResult'])Object.defineProperty(p,field,{enumerable:true,get(){throw Error('hidden '+field)}});
  check(same(new MatchCoreKernel(hidden).snapshot(),initial),'constructor read unrelated hidden fields');
  for(const mutate of [s=>{s.teams[0].actors.pop()},s=>{s.teams[1].side='BLUE'},
    s=>{s.teams[1].actors[0].id=s.teams[0].actors[0].id},s=>{s.teams[0].actors[0].role='unknown'},
    s=>{s.patchSnapshot.revision=-1},s=>{s.seed=1}]){
    const bad=spec();mutate(bad);let failed=false;try{new MatchCoreKernel(bad)}catch{failed=true}
    check(failed,'malformed participant/patch input accepted');
  }
  const unchanged=(fn,label)=>{const before=k.snapshot();fn();check(same(k.snapshot(),before),label)};
  unchanged(()=>check(k.command('red',{id:'wrong',type:'wait',actorId:'b-TOP',durationMs:10}).code==='ACTOR_AUTHORITY','authority result'),'foreign authority wrote');
  for(const durationMs of [-1,.5,Infinity,Number.MAX_SAFE_INTEGER+1])unchanged(()=>
    check(!k.command('blue',{id:'invalid',type:'wait',actorId:'b-TOP',durationMs}).ok,'invalid time accepted'),'invalid command wrote');
  unchanged(()=>check(k.command('blue',{id:'fake-win',type:'finish',actorId:'b-TOP'}).code==='UNSUPPORTED_COMMAND','invented result allowed'),'unsupported action wrote');
  check(k.command('blue',{id:'a',type:'wait',actorId:'b-TOP',durationMs:100}).ok,'first wait');
  unchanged(()=>check(k.command('blue',{durationMs:100,actorId:'b-TOP',type:'wait',id:'a'}).ok,'duplicate rejected'),'duplicate reserved again');
  unchanged(()=>check(k.command('blue',{id:'a',type:'wait',actorId:'b-TOP',durationMs:101}).code==='COMMAND_CONFLICT','conflict accepted'),'conflict wrote');
  unchanged(()=>check(k.command('blue',{id:'busy',type:'wait',actorId:'b-TOP',durationMs:1}).code==='ACTOR_BUSY','concurrent activity accepted'),'busy actor wrote');
  check(k.command('red',{id:'a',type:'wait',actorId:'r-TOP',durationMs:50}).ok,'team-scoped id collided');
  check(k.command('blue',{id:'tie',type:'wait',actorId:'b-JGL',durationMs:100}).ok,'tie wait');
  check(k.advanceTo(49).length===0,'effect occurred before due time');
  check(k.advanceTo(50)[0].actorId==='r-TOP','earliest event not first');
  k.advanceTo(99);
  const reverseKeys=x=>Array.isArray(x)?x.map(reverseKeys):x&&typeof x==='object'
    ?Object.fromEntries(Object.entries(x).reverse().map(([a,b])=>[a,reverseKeys(b)])):x;
  const resumed=MatchCoreKernel.restore(JSON.stringify(reverseKeys(k.snapshot())));
  check(same(resumed.snapshot(),k.snapshot()),'valid property-order restore changed state');
  const events=k.advanceTo(100),again=resumed.advanceTo(100);
  const completedTieOrder=events.map(e=>e.actorId);
  check(same(events,again)&&events.map(e=>e.actorId).join(',')==='b-TOP,b-JGL','same-time event order/resume changed');
  check(same(resumed.snapshot(),k.snapshot()),'resumed execution diverged');
  events[0].actorId='changed-by-consumer';
  const detachedView=k.observe('blue');detachedView.teams[0].actors[0].id='changed-by-consumer';
  check(same(k.snapshot(),resumed.snapshot()),'returned receipt/view aliased private state');
  unchanged(()=>check(k.advanceTo(100).length===0,'duplicate advancement replayed events'),'duplicate clock wrote');
  unchanged(()=>{let failed=false;try{k.advanceTo(99)}catch{failed=true}check(failed,'backward clock accepted')},'backward clock wrote');
  const c=new MatchCoreKernel(spec());c.command('blue',{id:'old',type:'wait',actorId:'b-TOP',durationMs:10});
  c.advanceTo(2);check(c.command('blue',{id:'cancel',type:'cancel',actorId:'b-TOP',targetId:'old'}).ok,'cancel failed');
  c.command('blue',{id:'next',type:'wait',actorId:'b-TOP',durationMs:20});
  const c2=MatchCoreKernel.restore(c.snapshot());
  check(c.advanceTo(10).length===0&&c2.advanceTo(10).length===0,'cancelled stale event wrote an effect');
  const saved=c.snapshot();check(c.command('blue',{id:'late-cancel',type:'cancel',actorId:'b-TOP',targetId:'old'}).code==='STALE_COMMAND'&&same(saved,c.snapshot()),'old response cancelled new activity');
  check(same(c.advanceTo(22),c2.advanceTo(22))&&same(c.snapshot(),c2.snapshot()),'cancel/replace native roundtrip diverged');
  const zero=new MatchCoreKernel(spec());zero.command('blue',{id:'zero',type:'wait',actorId:'b-MID',durationMs:0});
  check(zero.advanceTo(0).length===1&&zero.advanceTo(0).length===0,'zero-duration event ordering');
  let causalRejected=0;
  const rejectCausalOrder=(kernel,order,label)=>{
    const original=kernel.snapshot();check(same(MatchCoreKernel.restore(original).snapshot(),original),'valid causal history rejected');
    const bad=copy(original);bad.receipts=order.map(i=>bad.receipts[i]);bad.receipts.forEach((r,i)=>r.seq=i);
    let failed=false;try{MatchCoreKernel.restore(bad)}catch{failed=true}
    check(failed,label);causalRejected++;check(same(kernel.snapshot(),original),'corrupt receipt order changed producer');
  };
  rejectCausalOrder(zero,[1,0],'same-time completion before start accepted');
  const cancelledAtZero=new MatchCoreKernel(spec());
  cancelledAtZero.command('blue',{id:'wait',type:'wait',actorId:'b-MID',durationMs:10});
  cancelledAtZero.command('blue',{id:'cancel',type:'cancel',actorId:'b-MID',targetId:'wait'});
  rejectCausalOrder(cancelledAtZero,[1,0],'same-time cancellation before start accepted');
  const serialAtZero=new MatchCoreKernel(spec());
  for(const id of ['first','second']){serialAtZero.command('blue',{id,type:'wait',actorId:'b-MID',durationMs:0});serialAtZero.advanceTo(0)}
  rejectCausalOrder(serialAtZero,[0,2,1,3],'overlapping activity history accepted');
  const simultaneous=new MatchCoreKernel(spec());
  for(const actorId of ['b-TOP','b-JGL'])simultaneous.command('blue',{id:actorId,type:'wait',actorId,durationMs:10});
  simultaneous.advanceTo(10);rejectCausalOrder(simultaneous,[0,1,3,2],'same-time completion queue order changed');
  const accessor=new MatchCoreKernel(spec());let actorReads=0,durationReads=0;
  check(accessor.command('blue',{id:'captured',type:'wait',get actorId(){actorReads++;return actorReads===1?'b-TOP':'r-TOP'},
    get durationMs(){durationReads++;return durationReads===1?10:-1}}).ok&&actorReads===1&&durationReads===1,
    'validated identity/time was read again after validation');
  check(accessor.advanceTo(10)[0].actorId==='b-TOP','accessor changed effect owner');
  const boundary=new MatchCoreKernel(spec());boundary.command('blue',{id:'limit',type:'wait',actorId:'b-TOP',durationMs:Number.MAX_SAFE_INTEGER});
  boundary.advanceTo(Number.MAX_SAFE_INTEGER);const boundaryBefore=boundary.snapshot();
  check(boundary.command('blue',{id:'limit',type:'wait',actorId:'b-TOP',durationMs:Number.MAX_SAFE_INTEGER}).ok&&
    same(boundaryBefore,boundary.snapshot()),'clock-dependent revalidation broke duplicate identity');
  check(!boundary.command('blue',{id:'overflow',type:'wait',actorId:'b-TOP',durationMs:1}).ok&&
    same(boundaryBefore,boundary.snapshot()),'overflow partially wrote state');
  const own=new MatchCoreKernel(spec()),other=new MatchCoreKernel(spec()),view=own.observe('blue');
  other.command('red',{id:'secret',type:'wait',actorId:'r-MID',durationMs:1000});other.random('execution');
  check(same(view,other.observe('blue')),'enemy activity/queue/random leaked to observer');
  check(!('queue' in view)&&!('rng' in view)&&!('activity' in view.teams[1].actors[0]),'private state projected');
  const a=new MatchCoreKernel(spec()),b=new MatchCoreKernel(spec());
  for(let i=0;i<40;i++)a.random('execution');
  for(let i=0;i<40;i++)check(a.random('decision')===b.random('decision'),'random channels coupled');
  const a2=MatchCoreKernel.restore(a.snapshot());for(let i=0;i<40;i++)check(a.random('execution')===a2.random('execution'),'random state did not resume');
  const otherSeed=spec();otherSeed.seed+='-other';
  check(new MatchCoreKernel(otherSeed).random('execution')!==new MatchCoreKernel(spec()).random('execution'),'seed ignored');
  const valid=new MatchCoreKernel(spec());valid.command('blue',{id:'pending',type:'wait',actorId:'b-TOP',durationMs:100});
  const validSave=valid.snapshot();let rejected=0;
  for(const mutate of [s=>{s.schema=2},s=>{s.result={winner:'blue'}},s=>{s.clockMs=-1},
    s=>{s.queue[0].atMs=99},s=>{s.queue.push(copy(s.queue[0]))},s=>{s.actors['b-TOP'].generation++},
    s=>{s.commands[matchCoreCommandKey('blue','pending')].status='complete'},s=>{s.receipts=[]},
    s=>{s.rng.decision.a=NaN},s=>{s.futureField=true}]){
    const bad=copy(validSave);mutate(bad);let failed=false;try{MatchCoreKernel.restore(bad)}catch{failed=true}
    check(failed,'malformed snapshot accepted');rejected++;check(same(valid.snapshot(),validSave),'bad restore changed active match');
  }
  const special=spec();special.teams[0].actors[0].id='__proto__';const safe=new MatchCoreKernel(special);
  check(safe.command('blue',{id:'__proto__',type:'wait',actorId:'__proto__',durationMs:1}).ok,'stable special id unsupported');
  safe.advanceTo(1);check(same(MatchCoreKernel.restore(safe.snapshot()).snapshot(),safe.snapshot()),'special id restore');
  check(k.result===null&&c.result===null&&k.snapshot().mechanicsStatus==='NOT_IMPLEMENTED','foundation invented a game result');
  const heap=[];for(let i=0;i<1000;i++)matchCoreQueuePush(heap,{atMs:hashStr('heap-'+i)%97,seq:i});
  const want=heap.slice().sort((a,b)=>a.atMs-b.atMs||a.seq-b.seq),got=[];
  while(heap.length)got.push(matchCoreQueuePop(heap));check(same(want,got),'heap ordering differs from full sort');
  const stale=new MatchCoreKernel(spec());
  for(let i=0;i<100;i++){
    stale.command('blue',{id:'stale-'+i,type:'wait',actorId:'b-TOP',durationMs:hashStr('stale-'+i)%1000});
    stale.command('blue',{id:'cancel-'+i,type:'cancel',actorId:'b-TOP',targetId:'stale-'+i});
  }
  stale.command('blue',{id:'live',type:'wait',actorId:'b-TOP',durationMs:1200});
  const staleResume=MatchCoreKernel.restore(stale.snapshot());
  check(stale.advanceTo(1200).length===1&&staleResume.advanceTo(1200).length===1&&
    same(stale.snapshot(),staleResume.snapshot()),'many stale events replayed or lost the live activity');
  const start=performance.now();const batch=new MatchCoreKernel(spec());
  for(let i=0;i<1000;i++){check(batch.command('blue',{id:'batch-'+i,type:'wait',actorId:'b-TOP',durationMs:1}).ok,'batch command');batch.advanceTo(i+1)}
  check(batch.clockMs===1000&&batch.snapshot().receipts.length===2000,'bounded causal batch lost/duplicated actions');
  check(same(MatchCoreKernel.restore(batch.snapshot()).snapshot(),batch.snapshot()),'batch snapshot divergence');
  return {actors:10,completedTieOrder,cancelledStaleInert:true,propertyOrderResume:true,
    privateObservation:true,randomChannels:true,malformedRejected:rejected,causalRejected,specialIds:true,heapEvents:1000,staleEvents:100,batchActions:1000,
    batchMs:Math.round(performance.now()-start),physicalMechanicsImplemented:false,officialAdapterImplemented:false};
})()`);
assert.equal(result.actors,10);
console.log('MATCH_CORE_FOUNDATION_ACCEPTANCE '+JSON.stringify(result));
