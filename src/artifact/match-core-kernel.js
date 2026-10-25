// Approved replacement core, S0 only. Wait/cancel and causal time are executable;
// damage, movement, gold, victory and production game adapters are not yet supplied.
class MatchCoreKernel{
  #state;#people;
  constructor(spec){this.#state=createMatchCoreState(spec);this.#index()}
  #index(){this.#people=Object.create(null);for(const p of this.#state.participants)this.#people[p.id]=p}
  static restore(saved){
    const state=restoreMatchCoreState(saved),kernel=new MatchCoreKernel({matchId:state.matchId,seed:state.seed,
      patchSnapshot:state.patchSnapshot,teams:state.teams.map(t=>({...t,actors:state.participants.filter(p=>p.teamId===t.id)}))});
    kernel.#state=state;kernel.#index();return kernel;
  }
  snapshot(){return matchCoreClone(this.#state)}
  get clockMs(){return this.#state.clockMs}
  get result(){return null}
  random(channel){
    matchCoreAssert(['decision','execution'].includes(channel),'unknown random channel');
    return this.#state.rng[channel].next();
  }
  #receipt(kind,actorId,commandId,targetId){
    const s=this.#state,r={seq:s.receipts.length,atMs:s.clockMs,kind,actorId,commandId};
    if(targetId!==undefined)r.targetId=targetId;s.receipts.push(r);
  }
  #reply(c){return {ok:true,id:c.request.id,status:c.status,acceptedAtMs:c.acceptedAtMs,
    ...(c.status==='pending'?{dueAtMs:c.dueAtMs}:{completedAtMs:c.completedAtMs})}}
  command(teamId,input){
    const s=this.#state,fail=code=>({ok:false,code});
    if(!matchCoreRecord(input))return fail('INVALID_COMMAND');
    const id=input.id,type=input.type,actorId=input.actorId;
    if(!matchCoreId(id)||!matchCoreId(actorId))return fail('INVALID_COMMAND');
    const person=this.#people[actorId];
    if(!person||person.teamId!==teamId)return fail('ACTOR_AUTHORITY');
    let request;
    if(type==='wait'){
      const durationMs=input.durationMs;if(!matchCoreTime(durationMs))return fail('INVALID_TIME');
      request={id,type,actorId,durationMs};
    }else if(type==='cancel'){
      const targetId=input.targetId;if(!matchCoreId(targetId))return fail('INVALID_TARGET');
      request={id,type,actorId,targetId};
    }else return fail('UNSUPPORTED_COMMAND');
    const key=matchCoreCommandKey(teamId,request.id),requestKey=matchCoreRequestKey(request),old=s.commands[key];
    if(old)return old.requestKey===requestKey?this.#reply(old):fail('COMMAND_CONFLICT');
    if(type==='wait'&&!matchCoreTime(s.clockMs+request.durationMs))return fail('INVALID_TIME');
    const actor=s.actors[request.actorId];
    if(actor.generation===Number.MAX_SAFE_INTEGER||s.nextEventSeq===Number.MAX_SAFE_INTEGER)return fail('COUNTER_EXHAUSTED');
    if(request.type==='wait'){
      if(actor.waitingFor!==null)return fail('ACTOR_BUSY');
      const c={teamId,request,requestKey,acceptedAtMs:s.clockMs,status:'pending',dueAtMs:s.clockMs+request.durationMs};
      s.commands[key]=c;actor.generation++;actor.waitingFor=key;
      matchCoreQueuePush(s.queue,{kind:'wait-completed',atMs:c.dueAtMs,seq:s.nextEventSeq++,
        actorId:request.actorId,commandKey:key,generation:actor.generation});
      this.#receipt('wait-started',request.actorId,request.id);return this.#reply(c);
    }
    const targetKey=matchCoreCommandKey(teamId,request.targetId),target=s.commands[targetKey];
    if(!target||target.request.type!=='wait'||target.request.actorId!==request.actorId||
      target.status!=='pending'||actor.waitingFor!==targetKey)return fail('STALE_COMMAND');
    const c={teamId,request,requestKey,acceptedAtMs:s.clockMs,status:'complete',completedAtMs:s.clockMs};
    s.commands[key]=c;actor.generation++;actor.waitingFor=null;
    target.status='cancelled';target.completedAtMs=s.clockMs;
    this.#receipt('wait-cancelled',request.actorId,request.id,request.targetId);return this.#reply(c);
  }
  advanceTo(atMs){
    const s=this.#state;
    matchCoreAssert(matchCoreTime(atMs)&&atMs>=s.clockMs,'clock cannot move backwards or use invalid time');
    const first=s.receipts.length;
    while(s.queue.length&&s.queue[0].atMs<=atMs){
      const e=matchCoreQueuePop(s.queue),actor=s.actors[e.actorId],command=s.commands[e.commandKey];s.clockMs=e.atMs;
      if(actor.generation!==e.generation||actor.waitingFor!==e.commandKey||command.status!=='pending')continue;
      actor.waitingFor=null;command.status='complete';command.completedAtMs=s.clockMs;
      this.#receipt('wait-completed',e.actorId,command.request.id);
    }
    s.clockMs=atMs;return matchCoreClone(s.receipts.slice(first));
  }
  observe(teamId){
    const s=this.#state;
    matchCoreAssert(s.teams.some(t=>t.id===teamId),'unknown observing team');
    return {matchId:s.matchId,clockMs:s.clockMs,patchSnapshot:{...s.patchSnapshot},mechanicsStatus:s.mechanicsStatus,
      teams:s.teams.map(t=>({...t,actors:s.participants.filter(p=>p.teamId===t.id).map(p=>{
        const row={id:p.id,role:p.role,championId:p.championId};
        if(t.id===teamId){const key=s.actors[p.id].waitingFor,c=key&&s.commands[key];
          row.activity=c?{kind:'wait',commandId:c.request.id,untilMs:c.dueAtMs}:null}
        return row;
      })}))};
  }
}
