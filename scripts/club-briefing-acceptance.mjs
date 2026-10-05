import {artifactSources,runEngineFixture} from './test-harness.mjs';
const sources=await artifactSources(['ui-negotiations.js','ui-club-briefing.js','ui-club-eligibility.js','ui-club-finance.js','ui-club-staff.js','ui-club-medical.js','ui-club-contracts.js','ui-club-practice.js','ui-club-scrim.js','ui-scrim-plans.js','ui-staff-controls.js','ui-registration.js','ui-transfer-terms.js','app.js']);
const app=sources.pop(),esc=app.match(/^const esc=.*$/m)[0];
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('CLUB_BRIEF '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:4,div2:true})];cfg.internationals=[];
 DB=buildWorld(cfg);const [t,other]=activeTeams(DB,'KR',1);setManagedTeam(DB,t.id);
 const p=genPlayer(DB,new RNG('briefing-renewal'),{region:t.region,role:'MID',age:22,base:65});signContract(DB,p,t,1,3);
 DB.world={phase:'season',year:DB.year,seed:'briefing',manage:'manual',seasons:{},steps:[],step:0};
 const cid='brief-cup';DB.competitions[cid]={id:cid,name:'공식 브리핑 대회',region:'KR',teams:[t.id,other.id],rules:{fearless:true},stages:[{id:'group',name:'정규',type:'round_robin',legs:2,bestOf:3}]};
 const season=newSeason(DB,cid,DB.year,'briefing-calendar',DB.worldDate);DB.world.seasons[season.key]=season;
 let old=JSON.stringify(DB);check(renderClubBriefing().includes('열린 협상 0건')&&JSON.stringify(DB)===old&&!DB.world.negotiations,'pure missing negotiation store');
 const nx=clubBriefFixture(DB);check(nx&&nx.m.a!==nx.m.b&&!nx.m.res,'actual generated fixture');
 const allDays=season.days;season.days=[];check(!clubBriefFixture(DB),'missing fixture honest');season.days=allDays;
 nx.m.res={winner:nx.m.a};check(clubBriefFixture(DB)?.m.id!==nx.m.id,'completed fixture excluded');delete nx.m.res;
 const r=startNegotiation(DB,p.id,'renewal');check(r.ok&&r.neg.status==='open','actual renewal writer');const n=r.neg;
 const f=genPlayer(DB,new RNG('briefing-foreign'),{region:t.region,role:'TOP',age:22,base:65});signContract(DB,f,other,1,3);const foreign=startNegotiation(DB,f.id,'renewal',{teamId:other.id});check(foreign.ok,'foreign source fixture');
 old=JSON.stringify(DB);const markup=renderClubBriefing();check(markup.includes('열린 협상 1건')&&!markup.includes('data-brief-neg="'+foreign.neg.id+'"')&&JSON.stringify(DB)===old,'owned/pure render');
 const realId=n.id;n.id='bad"saved';check(!clubBriefNegotiations(DB).some(x=>x===n),'malformed saved selector rejected');n.id=realId;
 check(openClubBriefNegotiation(n.id)&&JSON.stringify(DB)===old,'real detail pure');
 const submit=nodes.get('[data-neg-submit="'+n.id+'"]').onclick,cancel=nodes.get('[data-neg-cancel="'+n.id+'"]').onclick;
 for(const [k,v] of Object.entries({sal:'1.3',years:'2',sign:'0.2',perf:'0.1',title:'0.2',intl:'0.3',buyout:'0','buyout-type':'negotiation',option:'none',role:'starter'}))nodes.get('[data-neg-'+k+'="'+n.id+'"]').value=v;
 nodes.get('#brief-neg-close').onclick();check(!UI_OVERLAY&&JSON.stringify(DB)===old,'cancel editing pure');
 check(openClubBriefNegotiation(n.id)&&nodes.get('[data-neg-sal="'+n.id+'"]').value==='1.3','same-context raw draft restore');
 const oldClose=nodes.get('#brief-neg-close').onclick,dialog=UI_OVERLAY;UI_OVERLAY={kind:'foreign-dialog'};oldClose();check(UI_OVERLAY.kind==='foreign-dialog','stale close never closes another dialog');UI_OVERLAY=dialog;
 const sameDialog=UI_OVERLAY;UI_OVERLAY={kind:'club-negotiation'};old=JSON.stringify(DB);cancel();check(JSON.stringify(DB)===old,'retained callback cannot mutate behind another same-kind dialog');UI_OVERLAY=sameDialog;
 DB=unpackDB(packDB(DB));const loaded=JSON.stringify(DB);cancel();submit();check(JSON.stringify(DB)===loaded,'actual stale controls inert across load');UI_OVERLAY=null;UI_RENDER_ID++;
 check(openClubBriefNegotiation(n.id),'loaded actual detail');const live=DB.world.negotiations[n.id];const cancelLive=nodes.get('[data-neg-cancel="'+n.id+'"]').onclick;
 DB.world.fired=true;old=JSON.stringify(DB);cancelLive();check(renderClubBriefing()===''&&JSON.stringify(DB)===old,'fired current controls inert');DB.world.fired=false;UI_OVERLAY=null;UI_RENDER_ID++;
 check(openClubBriefNegotiation(n.id),'reopen authority');const dateCancel=nodes.get('[data-neg-cancel="'+n.id+'"]').onclick;DB.worldDate=addDays(DB.worldDate,1);old=JSON.stringify(DB);dateCancel();check(JSON.stringify(DB)===old,'date stale inert');UI_OVERLAY=null;UI_RENDER_ID++;
 check(openClubBriefNegotiation(n.id),'current cancel detail');const goodCancel=nodes.get('[data-neg-cancel="'+n.id+'"]').onclick;goodCancel();check(live.status==='cancelled'&&saves===1&&CLUB_BRIEF.message.includes('종료'),'actual cancel result/save');old=JSON.stringify(DB);goodCancel();check(JSON.stringify(DB)===old&&saves===1,'duplicate cancel inert');
 const fresh=startNegotiation(DB,p.id,'renewal');check(fresh.ok,'new actual renewal');UI_OVERLAY=null;UI_RENDER_ID++;
 check(openClubBriefNegotiation(fresh.neg.id),'agreement detail');const actual=DB.world.negotiations[fresh.neg.id],accepted=normalizeContractTerms(DB,p,t,Math.min(asking(DB,p,t.region)*1.5,salaryBudget(DB,t)),3,{signingBonus:0,promisedRole:'core',bonuses:{performance:1,title:1,international:1}});
 // A legitimate demand/counter from the actual negotiation writer is submitted unchanged.
 const owned=DB.players[p.id],terms=actual.counter;const before=JSON.stringify(DB);const projected=JSON.parse(before);const expected=acceptNegotiationCounter(projected,actual.id);
 const accept=nodes.get('[data-neg-accept="'+actual.id+'"]').onclick;accept();check(expected.ok&&actual.status==='accepted'&&JSON.stringify(DB)===JSON.stringify(projected),'existing agreement exact result '+expected.msg);check(CLUB_BRIEF.message===expected.msg&&saves===2,'actual result feedback/save');
 const feeRoot={querySelector:s=>({value:s.includes('upfront')?'50':s.includes('bonus')?'1.1':s.includes('kind')?'titles':'2'})};const feePlan=transferFeePlanFromDom('scoped-fee',5,DB.worldDate,feeRoot);check(feePlan.upfront===2.5&&feePlan.installments[0].amount===2.5&&feePlan.addOns[0].amount===1.1&&feePlan.addOns[0].kind==='titles','scoped actual fee fields');
 const pack=packDB(DB),full=unpackDB(pack);check(JSON.stringify(full.world.negotiations)===JSON.stringify(DB.world.negotiations),'full/lite actual negotiations preserved');
 DB.world.manage='ai';UI_OVERLAY=null;UI_RENDER_ID++;check(!openClubBriefNegotiation(actual.id),'AI setting not silently overridden');
 DB.world.phase='initial_roster';check(renderClubBriefing()==='','initial explorer stays owner');DB.world.phase='pick';check(renderClubBriefing()==='','career picker stays owner');
 DB.world.phase='season';DB.world.manage='manual';DB.world.pendingOfficial={queue:[{}]};check(!openClubBriefNegotiation(actual.id),'pending official protected');
 DB.world.pendingOfficial=null;const message=CLUB_BRIEF.message;setManagedTeam(DB,other.id);clubBriefState();check(!CLUB_BRIEF.message&&!CLUB_BRIEF.draft,'manager identity clears ephemeral state');setManagedTeam(DB,t.id);SLOT='2';clubBriefState();check(CLUB_BRIEF.slot==='2'&&!CLUB_BRIEF.message,'slot identity reset');
 console.log('CLUB_BRIEFING_ACCEPTANCE '+JSON.stringify({pure:true,owned:true,fixture:true,completedExcluded:true,actualRenewal:true,draftReturn:true,staleLoadDateFired:true,cancelDuplicate:true,commandParity:true,result:expected,save:true,AI:true,initial:true,pending:true}));
})()`,{timeout:30000,setupSources:[esc,...sources,String.raw`
var DB,UI_OVERLAY=null,SLOT='1',SLOT_SWITCHING=false,VIEW='season',UI_RENDER_ID=1,MSG='';const SSET={tab:'table'},nodes=new Map();let saves=0;
const document={querySelector:s=>{if(!nodes.has(s))nodes.set(s,{value:'',dataset:{},focus(){},setAttribute(){},click(){this.onclick?.()}});return nodes.get(s)},querySelectorAll:s=>{if(s==='[data-neg-bid]'||s==='[data-accept-seller]'||s==='[data-brief-neg]')return [];if(/^\[data-neg-(submit|accept|cancel)\]$/.test(s)){const key=s.slice(1,-1),ds=key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return [...nodes].filter(([k])=>k.startsWith('['+key+'=')).map(([,v])=>v)}return []}};const $=s=>document.querySelector(s);
function fixtureTimeInfo(m){return m.time||'시간 미정'}function saveDB(){saves++}function navKeepScroll(){UI_RENDER_ID++}function closeUiOverlay(){UI_OVERLAY=null;return true}
function openUiOverlay(x){UI_OVERLAY={kind:x.kind};const root=document.querySelector('#overlay');root.querySelector=document.querySelector;root.querySelectorAll=document.querySelectorAll;for(const m of x.html.matchAll(/data-neg-(sal|years|sign|perf|title|intl|buyout|buyout-type|option|role|submit|accept|cancel)="([^"]+)"/g)){const key='[data-neg-'+m[1]+'="'+m[2]+'"]';const node=document.querySelector(key);node.dataset['neg'+m[1][0].toUpperCase()+m[1].slice(1)]=m[2];}}
`]});
