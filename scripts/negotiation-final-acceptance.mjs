await import('./negotiation-clock-acceptance.mjs');
import assert from 'node:assert/strict';
import {artifactSources,runEngineFixture} from './test-harness.mjs';
const result=await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('NEGOTIATION_FINAL '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:3,div2:true})];cfg.internationals=[];
 const db=buildWorld(cfg),team=activeTeams(db,'KR',1)[0];startCareer(db,team.id,'manual-final');
 const player=Object.values(db.players).find(p=>!p.team&&!p.retired&&p.region===team.region&&initialSignCheck(db,p,team).ok);
 check(player,'eligible actual candidate');mInterest(db,player.id,'B');mEvaluateTarget(db,player.id,team.id);initialStartNegotiation(db,player.id,team.id);
 const id=negotiationId(db,player.id,'initial',team.id),n=db.world.negotiations[id];
 n.maxRounds=2;
 const terms={...n.demand,salary:Math.floor((initialSalaryBudget(db,team)-payroll(db,team))*10)/10};
 const base=JSON.stringify(db),legacy=JSON.parse(base),old=submitNegotiationOffer(legacy,id,terms);check(old.ok&&legacy.world.negotiations[id].status==='accepted','existing accepted writer');
 const result=stageNegotiationOffer(db,id,terms);check(result.ok&&result.agreed,'actual acceptance staged');
 const unchanged=x=>{const clone=JSON.parse(JSON.stringify(x));delete clone.world.negotiations;return JSON.stringify(clone)};
 check(unchanged(db)===unchanged(JSON.parse(base)),'agreement changes no roster/contract/cash/target/history outside negotiation');
 check(db.world.negotiations[id].stage==='agreement'&&!db.players[player.id].team,'separate final decision');
 const staged=JSON.stringify(db),duplicate=stageNegotiationOffer(db,id,terms);check(!duplicate.ok&&JSON.stringify(db)===staged,'duplicate offer inert');
 const restored=unpackDB(packDB(db));check(restored.world.negotiations[id].stage==='agreement'&&!restored.players[player.id].team,'actual pending save restore');
 const denied={fired:x=>x.world.fired=true,ai:x=>x.world.manage='ai',manager:x=>x.manager='missing',retired:x=>x.players[player.id].retired=true,owned:x=>x.players[player.id].team='other',phase:x=>x.world.phase='season',cash:x=>x.teams[team.id].finance.cash=-1,pending:x=>x.world.pendingOfficial={}};
 for(const [kind,change] of Object.entries(denied)){const x=JSON.parse(staged);change(x);const before=JSON.stringify(x);const final=finalizeStagedNegotiation(x,id);check(!final.ok&&JSON.stringify(x)===before,kind+' final refuses without mutation')}
 const cancelled=JSON.parse(staged);cancelNegotiation(cancelled,id);const afterCancel=JSON.stringify(cancelled);check(!finalizeStagedNegotiation(cancelled,id).ok&&JSON.stringify(cancelled)===afterCancel,'cancel refuses old final');
 check(finalizeStagedNegotiation(db,id).ok,'manual final writer');check(unchanged(db)===unchanged(legacy),'existing complete writer state equal');
 const final=JSON.stringify(db);check(!finalizeStagedNegotiation(db,id).ok&&JSON.stringify(db)===final,'duplicate final inert');
 const saved=unpackDB(packDB(db));check(saved.players[player.id].team===team.id&&saved.world.negotiations[id].status==='accepted','actual final save restore');
 return JSON.stringify({agreement:true,writerParity:true,cancel:true,duplicate:true,save:true,denied:Object.keys(denied).length});
})()`,{timeout:30000});
assert.equal(JSON.parse(result).denied,8);
console.log('NEGOTIATION_FINAL_ACCEPTANCE '+result);
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('NEGOTIATION_FINAL_KINDS '+m)};
 const results=[];
 for(const kind of ['fa','renewal','transfer','early_fa']){
  const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:3,div2:false})];cfg.internationals=[];
  const db=buildWorld(cfg),[buyer,seller]=activeTeams(db,'KR',1);
  buyer.finance.cash=seller.finance.cash=100000;setManagedTeam(db,buyer.id);
  db.world={year:db.year,seed:'manual-final-'+kind,manage:'manual',phase:'market',seasons:{},steps:[],step:0,report:null,offers:[],marketLog:[],negotiations:{},recruitment:{targets:{}}};db.worldDate=db.year+'-01-10';
  const p=genPlayer(db,new RNG('manual-final-'+kind,'fixture'),{region:buyer.region,role:ROLES[0],age:24,base:45});p.careerGoal='stability';p.personality.ambition=10;p.wantsOut=true;
  if(kind!=='fa')signContract(db,p,kind==='renewal'?buyer:seller,2,kind==='transfer'?2:1,{promisedRole:'starter'});
  if(kind==='early_fa'){
   db.world.phase='offseason';db.world.lastDate=db.year+'-11-16';db.worldDate=db.world.lastDate;
   initOffseasonContractWindow(db);setManagedTeam(db,seller.id);check(grantEarlyContact(db,p.id).ok,'actual early contact waiver');setManagedTeam(db,buyer.id);
  }
  if(kind!=='renewal'){mInterest(db,p.id);mEvaluateTarget(db,p.id,buyer.id)}
  let n;
  if(kind==='transfer'){mTransferBid(db,p.id,sellerTransferAsk(db,p,seller));n=db.world.negotiations[negotiationId(db,p.id,kind)];check(n?.stage==='player','actual seller agreement')}
  else {const started=startNegotiation(db,p.id,kind);check(started.ok,kind+' start '+started.msg);n=started.neg}
  n.maxRounds=2;
  const original=JSON.stringify(db);let accepted;
  for(const factor of [1,1.2,1.5,2]){
   const clone=JSON.parse(original),neg=clone.world.negotiations[n.id],terms={...neg.demand,salary:neg.demand.salary*factor},r=submitNegotiationOffer(clone,n.id,terms);
   if(r.ok&&clone.world.negotiations[n.id].status==='accepted'){accepted={clone,terms};break}
  }
  check(accepted,kind+' existing accepted conditions');
  const timed=JSON.parse(original);timed.world.negotiations[n.id].maxRounds=3;timed.world.negotiations[n.id].competitors=[];
  const delayed=stageNegotiationOffer(timed,n.id,accepted.terms);check(delayed.ok&&delayed.waiting,kind+' actual timed submission');
  const timedSave=unpackDB(packDB(timed));check(timedSave.world.negotiations[n.id].response.dueAt===delayed.dueAt,kind+' timed save');
  const contact=advanceToNegotiationResponse(timedSave);check(contact.response&&timedSave.world.negotiations[n.id].stage==='agreement',kind+' timed contact stop');
  check(finalizeStagedNegotiation(timedSave,n.id).ok,kind+' timed manual final');
  const result=stageNegotiationOffer(db,n.id,accepted.terms);check(result.ok&&result.agreed,kind+' staged response');
  const compare=x=>{const c=JSON.parse(JSON.stringify(x));delete c.world.negotiations;return JSON.stringify(c)};
  check(compare(db)===compare(JSON.parse(original)),kind+' no ownership/payment/reservation before final');
  if(kind==='transfer')check(db.world.negotiations[n.id].history.some(h=>h.stage==='club'&&h.side==='seller'&&h.result==='accept'), 'seller acceptance remains seller event');
  check(finalizeStagedNegotiation(db,n.id).ok,kind+' actual final');check(compare(db)===compare(accepted.clone),kind+' full writer parity');
  const restored=unpackDB(packDB(db));check(restored.world.negotiations[n.id].status==='accepted',kind+' actual save');results.push(kind);
 }
 console.log('NEGOTIATION_FINAL_KINDS_ACCEPTANCE '+JSON.stringify({actualWriters:results,fullStateParity:true,noReservation:true,save:true}));
})()`,{timeout:30000});

const [ui,finalUi]=await artifactSources(['ui-negotiations.js','ui-negotiation-final.js']);
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('NEGOTIATION_FINAL_UI '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:3,div2:true})];cfg.internationals=[];
 DB=buildWorld(cfg);const team=activeTeams(DB,'KR',1)[0];startCareer(DB,team.id,'manual-final-ui');
 const p=Object.values(DB.players).find(p=>!p.team&&!p.retired&&p.region===team.region&&initialSignCheck(DB,p,team).ok);
 mInterest(DB,p.id,'B');mEvaluateTarget(DB,p.id,team.id);initialStartNegotiation(DB,p.id,team.id);
 const id=negotiationId(DB,p.id,'initial',team.id),n=DB.world.negotiations[id];n.maxRounds=2;n.counter={...n.demand,salary:Math.floor((initialSalaryBudget(DB,team)-payroll(DB,team))*10)/10};
 const values=n.counter;fields={sal:{value:values.salary},years:{value:values.years},sign:{value:values.signingBonus||0},perf:{value:values.bonuses?.performance||0},title:{value:values.bonuses?.title||0},intl:{value:values.bonuses?.international||0},buyout:{value:0},'buyout-type':{value:'negotiation'},option:{value:'none'},role:{value:values.promisedRole||'competition'}};
 buttons={submit:node({negSubmit:id}),accept:node({negAccept:id}),final:node({negFinal:id}),cancel:node({negCancel:id})};
 const act=()=>saves++;bindNegotiationControls(act,()=>permission,root);
 const inherited=Object.create(DB);inherited.world={...DB.world};check(renderNegotiations(null,inherited).includes('data-neg-submit'),'inherited read-only view before agreement');const before=JSON.stringify(DB);buttons.accept.onclick();check(saves===0&&JSON.stringify(DB)===before&&!panel.hidden,'review pure');check(panel.innerHTML.includes('최종 계약은 별개'),'honest boundary');const old=panel.commit.onclick;panel.cancel.onclick();old();check(saves===0&&JSON.stringify(DB)===before&&buttons.accept.focused,'cancel/old confirmation inert');
 buttons.accept.onclick();panel.commit.onclick();check(saves===1&&!DB.players[p.id].team&&DB.world.negotiations[id].stage==='agreement','actual UI agreement without signing');
 const projected=Object.create(DB);projected.world={...DB.world};const agreed=JSON.stringify(DB),html=renderNegotiations(null,projected);check(html.includes('최종 계약 검토')&&html.includes('선수 조건 수락 · 최종 계약 전')&&!html.includes('data-neg-submit'),'actual agreement card');check(JSON.stringify(DB)===agreed,'agreement read-only');
 buttons.final.onclick();const cancelledFinal=panel.commit.onclick;panel.cancel.onclick();cancelledFinal();check(JSON.stringify(DB)===agreed&&saves===1&&buttons.final.focused,'final review cancel restores focus');
 const changes={db:()=>DB=JSON.parse(JSON.stringify(DB)),world:()=>DB.world={...DB.world},year:()=>DB.year++,phase:()=>DB.world.phase='season',manage:()=>DB.world.manage='ai',fired:()=>DB.world.fired=true,player:()=>DB.players[p.id].retired=true,negotiation:()=>DB.world.negotiations[id].round++,slot:()=>SLOT='2',view:()=>VIEW='squad',render:()=>UI_RENDER_ID++,date:()=>DB.worldDate=addDays(DB.worldDate,1),permission:()=>permission=false,manager:()=>DB.manager='other',budget:()=>DB.teams[team.id].finance.cash++,dialog:()=>UI_OVERLAY={},switching:()=>SLOT_SWITCHING=true,clock:()=>DB.world.negotiationClock={at:DB.worldDate+'T01:00:00.000Z'}};
 for(const [kind,change] of Object.entries(changes)){DB=JSON.parse(agreed);SLOT='1';VIEW='season';UI_RENDER_ID=0;UI_OVERLAY=null;SLOT_SWITCHING=false;permission=true;buttons.final.onclick();change();const b=JSON.stringify(DB);panel.commit.onclick();check(JSON.stringify(DB)===b&&saves===1,kind+' stale review inert')}
 DB=JSON.parse(agreed);SLOT='1';VIEW='season';UI_RENDER_ID=0;UI_OVERLAY=null;SLOT_SWITCHING=false;permission=true;buttons.final.onclick();const final=panel.commit.onclick;final();final();check(saves===2&&DB.players[p.id].team===team.id,'actual manual final once');
 console.log('NEGOTIATION_FINAL_UI_ACCEPTANCE '+JSON.stringify({actualAgreement:true,actualFinal:true,cancel:true,focus:true,stale:Object.keys(changes).length,duplicate:true}));
})()`,{timeout:30000,setupSources:[String.raw`
let DB,SLOT='1',UI_RENDER_ID=0,VIEW='season',UI_OVERLAY=null,SLOT_SWITCHING=false,saves=0,permission=true,fields,buttons;
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function node(dataset){return {dataset,focus(){this.focused=true}}}
const panel={hidden:true,innerHTML:'',commit:{},cancel:{},status:{textContent:''},focus(){},querySelector(s){return s==='[data-review-commit]'?this.commit:s==='[data-review-cancel]'?this.cancel:this.status}};
const root={querySelectorAll(s){return s==='[data-neg-submit]'?[buttons.submit]:s==='[data-neg-accept]'?[buttons.accept]:s==='[data-neg-final]'?[buttons.final]:s==='[data-neg-cancel]'?[buttons.cancel]:[]},querySelector(s){if(s.startsWith('[data-neg-review='))return panel;return fields[s.match(/^\[data-neg-([^=]+)/)?.[1]]}};
`,ui,finalUi]});
