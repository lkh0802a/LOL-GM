// Validate a complete private kernel snapshot before installing any state.
function restoreMatchCoreState(saved){
  const s=typeof saved==='string'?JSON.parse(saved):matchCoreClone(saved);
  matchCoreAssert(matchCoreKeys(s,['schema','engine','matchId','seed','patchSnapshot','mechanicsStatus','result',
    'clockMs','teams','participants','actors','queue','nextEventSeq','commands','receipts','rng'])&&
    s.schema===1&&s.engine==='causal-foundation-v1'&&
    s.mechanicsStatus==='NOT_IMPLEMENTED'&&s.result===null,'unsupported state/result');
  matchCoreAssert(Array.isArray(s.teams)&&Array.isArray(s.participants),'participant metadata missing');
  const state=createMatchCoreState({matchId:s.matchId,seed:s.seed,patchSnapshot:s.patchSnapshot,
    teams:s.teams.map(t=>({...t,actors:s.participants.filter(p=>p.teamId===t.id)}))});
  matchCoreAssert(matchCoreKeys(s.patchSnapshot,['id','revision','sourceVersion'])&&
    state.teams.length===s.teams.length&&state.teams.every((t,i)=>matchCoreKeys(s.teams[i],['id','side'])&&t.id===s.teams[i].id&&t.side===s.teams[i].side)&&
    state.participants.length===s.participants.length&&state.participants.every((p,i)=>
      matchCoreKeys(s.participants[i],['id','teamId','role','championId'])&&
      ['id','teamId','role','championId'].every(k=>p[k]===s.participants[i][k])),'participant order/identity mismatch');
  matchCoreAssert(matchCoreTime(s.clockMs)&&matchCoreTime(s.nextEventSeq)&&matchCoreRecord(s.actors)&&
    matchCoreRecord(s.commands)&&Array.isArray(s.queue)&&Array.isArray(s.receipts)&&matchCoreRecord(s.rng),'invalid state shape');
  state.clockMs=s.clockMs;state.nextEventSeq=s.nextEventSeq;
  const people=new Map(state.participants.map(p=>[p.id,p]));
  matchCoreAssert(Object.keys(s.actors).length===people.size,'actor count mismatch');
  for(const [id,actor] of Object.entries(s.actors)){
    matchCoreAssert(people.has(id)&&matchCoreKeys(actor,['generation','waitingFor'])&&matchCoreTime(actor.generation)&&
      (actor.waitingFor===null||typeof actor.waitingFor==='string'),'invalid actor activity');
    state.actors[id]={generation:actor.generation,waitingFor:actor.waitingFor};
  }
  let waits=0;const generations=new Map(),cancelTargets=new Set();
  for(const [key,c] of Object.entries(s.commands)){
    const r=c?.request,person=people.get(r?.actorId);
    matchCoreAssert(matchCoreRecord(c)&&matchCoreRecord(r)&&person&&person.teamId===c.teamId&&matchCoreId(r.id)&&
      key===matchCoreCommandKey(c.teamId,r.id)&&c.requestKey===matchCoreRequestKey(r)&&
      ['wait','cancel'].includes(r.type)&&['pending','complete','cancelled'].includes(c.status)&&
      matchCoreTime(c.acceptedAtMs)&&c.acceptedAtMs<=s.clockMs,'invalid command');
    if(r.type==='wait'){
      waits++;matchCoreAssert(matchCoreTime(r.durationMs)&&matchCoreTime(c.dueAtMs)&&
        c.dueAtMs===c.acceptedAtMs+r.durationMs,'invalid wait time');
      if(c.status==='pending')matchCoreAssert(c.dueAtMs>=s.clockMs&&state.actors[r.actorId].waitingFor===key,'missing active wait');
    }else matchCoreAssert(matchCoreId(r.targetId)&&c.status==='complete'&&c.completedAtMs===c.acceptedAtMs,'invalid cancellation');
    matchCoreAssert(matchCoreKeys(r,r.type==='wait'?['id','type','actorId','durationMs']:['id','type','actorId','targetId'])&&
      matchCoreKeys(c,['teamId','request','requestKey','acceptedAtMs','status',
        ...(r.type==='wait'?['dueAtMs']:[]),...(c.status!=='pending'?['completedAtMs']:[])]),'unknown command fields');
    if(c.status!=='pending')matchCoreAssert(matchCoreTime(c.completedAtMs)&&c.completedAtMs<=s.clockMs&&
        c.completedAtMs>=c.acceptedAtMs&&(r.type!=='wait'||c.completedAtMs<=c.dueAtMs)&&
        !(r.type==='wait'&&c.status==='complete'&&c.completedAtMs!==c.dueAtMs),'invalid completion');
    generations.set(r.actorId,(generations.get(r.actorId)||0)+1);
    state.commands[key]=c;
  }
  matchCoreAssert(waits===s.nextEventSeq,'event sequence mismatch');
  for(const c of Object.values(state.commands))if(c.request.type==='cancel'){
    const targetKey=matchCoreCommandKey(c.teamId,c.request.targetId),target=state.commands[targetKey];
    matchCoreAssert(target?.request.type==='wait'&&target.request.actorId===c.request.actorId&&
      target.status==='cancelled'&&target.completedAtMs===c.acceptedAtMs&&!cancelTargets.has(targetKey),'invalid cancelled target');
    cancelTargets.add(targetKey);
  }
  for(const [key,c] of Object.entries(state.commands))if(c.status==='cancelled')
    matchCoreAssert(c.request.type==='wait'&&cancelTargets.has(key),'cancelled command lacks cause');
  const sequences=new Set(),pending=new Set();
  for(let i=0;i<s.queue.length;i++){
    const e=s.queue[i],c=state.commands[e?.commandKey],actor=state.actors[e?.actorId];
    matchCoreAssert(matchCoreKeys(e,['kind','atMs','seq','actorId','commandKey','generation'])&&e.kind==='wait-completed'&&c?.request.type==='wait'&&
      actor&&e.actorId===c.request.actorId&&e.atMs===c.dueAtMs&&matchCoreTime(e.atMs)&&e.atMs>=s.clockMs&&
      matchCoreTime(e.seq)&&e.seq<s.nextEventSeq&&!sequences.has(e.seq)&&matchCoreTime(e.generation)&&
      e.generation<=actor.generation&&c.status!=='complete','invalid queued event');
    sequences.add(e.seq);
    if(c.status==='pending'){
      matchCoreAssert(e.generation===actor.generation&&actor.waitingFor===e.commandKey&&!pending.has(e.commandKey),'invalid active event');pending.add(e.commandKey);
    }else matchCoreAssert(c.status==='cancelled'&&e.generation<actor.generation,'invalid stale event');
    if(i)matchCoreAssert(!matchCoreEventBefore(e,s.queue[(i-1)>>1]),'invalid heap order');
  }
  for(const [id,a] of Object.entries(state.actors)){
    matchCoreAssert(a.generation===(generations.get(id)||0),'activity generation mismatch');
    if(a.waitingFor!==null)matchCoreAssert(pending.has(a.waitingFor)&&state.commands[a.waitingFor]?.request.actorId===id,'missing queued activity');
  }
  let lastTime=0,lastCompletion=null;const receiptKinds=new Map(),eventOrder=new Map(),activeHistory=new Map();
  for(const [seq,r] of s.receipts.entries()){
    const person=people.get(r?.actorId),c=state.commands[matchCoreCommandKey(person?.teamId,r?.commandId)];
    matchCoreAssert(matchCoreKeys(r,['seq','atMs','kind','actorId','commandId',...(r?.kind==='wait-cancelled'?['targetId']:[])])&&
      r.seq===seq&&matchCoreTime(r.atMs)&&r.atMs>=lastTime&&r.atMs<=s.clockMs&&
      person&&c&&r.actorId===c.request.actorId&&['wait-started','wait-completed','wait-cancelled'].includes(r.kind),'invalid receipt');lastTime=r.atMs;
    const key=matchCoreCommandKey(person.teamId,r.commandId),kindKey=JSON.stringify([key,r.kind]);
    matchCoreAssert(!receiptKinds.has(kindKey),'duplicate receipt');receiptKinds.set(kindKey,true);
    if(r.kind==='wait-started'){
      matchCoreAssert(c.request.type==='wait'&&r.atMs===c.acceptedAtMs&&!activeHistory.has(r.actorId),'invalid start receipt');
      activeHistory.set(r.actorId,key);eventOrder.set(key,eventOrder.size);
    }else if(r.kind==='wait-completed'){
      const order=eventOrder.get(key);
      matchCoreAssert(c.request.type==='wait'&&c.status==='complete'&&r.atMs===c.completedAtMs&&activeHistory.get(r.actorId)===key&&
        (lastCompletion===null||lastCompletion.atMs!==r.atMs||lastCompletion.order<order),'invalid completion receipt');
      activeHistory.delete(r.actorId);lastCompletion={atMs:r.atMs,order};
    }else{
      matchCoreAssert(c.request.type==='cancel'&&r.atMs===c.acceptedAtMs&&r.targetId===c.request.targetId&&
        activeHistory.get(r.actorId)===matchCoreCommandKey(c.teamId,r.targetId),'invalid cancellation receipt');
      activeHistory.delete(r.actorId);
    }
  }
  for(const [key,c] of Object.entries(state.commands)){
    const has=kind=>receiptKinds.has(JSON.stringify([key,kind]));
    matchCoreAssert(c.request.type==='wait'?has('wait-started')&&(c.status!=='complete'||has('wait-completed')):has('wait-cancelled'),'command lacks receipt');
  }
  for(const [id,a] of Object.entries(state.actors))matchCoreAssert((activeHistory.get(id)??null)===a.waitingFor,'receipt activity differs from actor');
  for(const e of s.queue)matchCoreAssert(e.seq===eventOrder.get(e.commandKey),'event order differs from its cause');
  matchCoreAssert(matchCoreKeys(s.rng,['decision','execution']),'unknown random stream');
  for(const channel of ['decision','execution']){
    const r=s.rng[channel];matchCoreAssert(matchCoreKeys(r,['a','sp'])&&Number.isInteger(r.a)&&r.a>=-2147483648&&r.a<=2147483647&&r.sp===null,'invalid random stream');
    state.rng[channel].a=r.a;
  }
  state.queue=s.queue;state.receipts=s.receipts;return state;
}
