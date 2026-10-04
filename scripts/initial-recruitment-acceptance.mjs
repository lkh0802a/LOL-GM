import assert from 'node:assert/strict';
import {artifactSources,runEngineFixture} from './test-harness.mjs';
const sources=await artifactSources(['ui-observed-radar.js','ui-initial-comparison.js','ui-initial-offer-preview.js','ui-initial-candidates.js','ui-market-initial.js','ui-negotiations.js','ui-roster.js','app.js']);
const esc=sources.pop().match(/^const esc=.*$/m)?.[0];assert(esc);
await runEngineFixture(String.raw`(()=>{
 const check=(ok,msg)=>{if(!ok)throw Error('INITIAL_RECRUITMENT '+msg)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:8,div2:true}),regionCfg('NA',{teams:8,div2:true})];cfg.internationals=[];
 const db=buildWorld(cfg),t=activeTeams(db,'KR',1)[0];startCareer(db,t.id,'initial-observed-acceptance');DB=db;MSG='';initialCandidateContext(db);INITMK.target=t.id;
 const before=JSON.stringify(db);let parity=0,midFixed=0;for(const p of Object.values(db.players).filter(p=>!p.retired&&!p.team)){const view=initialCandidateView(db),k=knowledge(view,p),gw=ROLE_GROUP_WEIGHTS[p.role],gs=g=>avg(ATTR_GROUPS[g].filter(a=>!(a==='smite_execution'&&p.role!=='JGL')&&!(a==='csing'&&p.role==='SUP')).map(a=>obsAttr(view,p,a,k)));let base=0,w=0;for(const [g,x] of Object.entries(gw)){base+=gs(g)*x;w+=x}base/=w;const old=Math.round(clamp(base*.82+avg(ROLE_KEY_ATTRS[p.role].map(a=>obsAttr(view,p,a,k)))*.18,20,99)),current=obsOvr(view,p);check(Number.isFinite(current)&&current===playerRoleRating({role:p.role,attrs:observedPlayerAttributes(view,p,k)}),'shared observed rating');if(p.role==='MID'){check(Number.isNaN(old)&&!Object.hasOwn(p.attrs,'roaming'),'MID original missing attr');midFixed++}else{check(current===old,'nonMID parity');parity++}}
 const page=initialCandidatePage(db,INITMK,t);
 check(page.allowed&&page.total>25&&page.rows.every(x=>x.p.region===t.region),'regional default');
 const p=page.rows[0].p;INITMK.detail=p.id;const html=renderInitialRosterMarket();
 check(JSON.stringify(db)===before,'list/detail mutated world');
 check(html.includes('data-init-detail')&&html.includes('관측 기반 능력 지표')&&!html.includes('공용어 사용')&&!html.includes('페널티 없음'),'real observed UI');
 check(html.includes('공개 경기에서 확인된 챔피언 기록이 없습니다')&&html.includes('관찰 날짜 없음'),'honest missing information');
 // Candidate detail calls the established observed path. No signed-player fallback.
 const core=playerCoreMetrics;playerCoreMetrics=x=>{check(x!==p,'hidden true core input');return core(x)};initialCandidateDetail(page);playerCoreMetrics=core;const reaction=p.attrs.reaction;delete p.attrs.reaction;const malformed=JSON.stringify(db);check(initialCandidatePage(db,{...INITMK,q:p.name},t).rows.some(x=>x.p.id===p.id)&&initialCandidateDetail(initialCandidatePage(db,INITMK,t)).includes('정보 부족'),'missing data shown');check(initialCandidateCommand(db,INITMK,p.id,'evaluate').includes('자료가 부족')&&JSON.stringify(db)===malformed,'malformed observed source inert');p.attrs.reaction=reaction;
 INITMK.scope='overseas';let overseas=initialCandidatePage(db,INITMK,t);check(overseas.rows.every(x=>x.p.region!==t.region),'overseas');
 for(let i=0;i<90;i++){const p=genPlayer(db,new RNG('extra-candidate-'+i),{role:ROLES[i%5],age:21,base:60,region:'NA'});db.players[p.id]=p}
 INITMK.scope='all';let all=initialCandidatePage(db,INITMK,t);check(all.total===Object.values(db.players).filter(p=>!p.retired&&!p.team).length&&all.total>80,'full candidate count');
 const ids=new Set();for(let i=0;i<all.pages;i++){INITMK.page=i;for(const x of initialCandidatePage(db,INITMK,t).rows){check(!ids.has(x.p.id),'page duplicate');ids.add(x.p.id)}}check(ids.size===all.total,'lost candidates');
 INITMK.page=0;INITMK.sort='name';INITMK.direction='asc';let asc=initialCandidatePage(db,INITMK,t);check(asc.rows.every((x,i,a)=>!i||a[i-1].value.localeCompare(x.value,'ko')<=0),'ascending');
 INITMK.direction='desc';let desc=initialCandidatePage(db,INITMK,t);check(desc.rows.every((x,i,a)=>!i||a[i-1].value.localeCompare(x.value,'ko')>=0),'descending');
 INITMK.q=p.name;INITMK.minimum=0;check(initialCandidatePage(db,INITMK,t).rows.some(x=>x.p===p),'name filter');INITMK.minimum=99;check(initialCandidatePage(db,INITMK,t).rows.every(x=>x.ability>=99),'minimum observed filter');
 INITMK.q='';INITMK.minimum=0;INITMK.scope='region';INITMK.selected=[p.id];renderInitialRosterMarket();check(INITMK.selected[0]===p.id,'selection lost');
 check(initialCandidateCommand(db,INITMK,'missing-candidate','scout').includes('권한'),'missing candidate');
 check(initialCandidateCommand(db,INITMK,p.id,'evaluate').includes('먼저 관심'),'evaluation prerequisites');
 initialCandidateCommand(db,INITMK,p.id,'interest');mInterest(db,p.id,'A');check(initialCandidateActions(initialCandidateView(db),p,t).includes('value="A" selected'),'manual priority');initialCandidateCommand(db,INITMK,p.id,'evaluate');check(recruitmentTarget(db,p.id).evaluation.teamId===t.id,'real evaluation');
 const foreign=activeTeams(db,'NA',1)[0],saved=JSON.stringify(db);check(initialCandidateCommand(db,{...INITMK,target:foreign.id},p.id,'scout').includes('권한')&&JSON.stringify(db)===saved,'foreign authority');
 const candidate=Object.values(db.players).find(p=>!p.team&&p.region===t.region&&initialSignCheck(db,p,t).ok);check(candidate,'affordable candidate missing');
 INITMK.detail=candidate.id;initialCandidateCommand(db,INITMK,candidate.id,'interest');initialCandidateCommand(db,INITMK,candidate.id,'evaluate');initialCandidateCommand(db,INITMK,candidate.id,'negotiate');
 const nid=negotiationId(db,candidate.id,'initial',t.id),n=negotiationStore(db)[nid];check(n?.status==='open','actual negotiation');
 const count=Object.keys(db.world.negotiations).length;initialCandidateCommand(db,INITMK,candidate.id,'negotiate');check(Object.keys(db.world.negotiations).length===count,'duplicate negotiation');
 let copy=unpackDB(packDB(db));check(negotiationStore(copy)[nid].status==='open'&&recruitmentTarget(copy,candidate.id).evaluation.teamId===t.id,'save negotiation/report');
 cancelNegotiation(db,nid);check(negotiationStore(db)[nid].status!=='open'&&!candidate.team,'cancel signed player');
 const k=knowledge(initialCandidateView(db),candidate);initialCandidateCommand(db,INITMK,candidate.id,'scout');check(knowledge(db,candidate)>=k&&db.scout[candidate.id].observations>0,'actual observation');
 const agreement=submitNegotiationOffer(copy,nid,{...negotiationStore(copy)[nid].demand,salary:Math.floor((initialSalaryBudget(copy,copy.teams[t.id])-payroll(copy,copy.teams[t.id]))*10)/10});check(agreement.ok&&copy.players[candidate.id].team===t.id,'supported agreement '+JSON.stringify(agreement));const replay=JSON.stringify(copy);check(!submitNegotiationOffer(copy,nid,negotiationStore(copy)[nid].demand).ok&&JSON.stringify(copy)===replay,'agreement duplicate');check(unpackDB(packDB(copy)).players[candidate.id].team===t.id,'agreement save');
 const oldPhase=db.world.phase;db.world.phase='season';const inert=JSON.stringify(db);check(initialCandidateCommand(db,INITMK,candidate.id,'interest').includes('권한')&&JSON.stringify(db)===inert,'stale phase');db.world.phase=oldPhase;
 db.world.fired=true;const fired=JSON.stringify(db);check(!initialCandidatePage(db,INITMK,t).allowed&&initialCandidateCommand(db,INITMK,candidate.id,'scout').includes('권한')&&JSON.stringify(db)===fired,'fired authority');db.world.fired=false;
 candidate.team=t.id;const signed=JSON.stringify(db);check(initialCandidateDetail(initialCandidatePage(db,INITMK,t)).includes('더 이상 FA')&&initialCandidateCommand(db,INITMK,candidate.id,'evaluate').includes('권한')&&JSON.stringify(db)===signed,'signed candidate truth');candidate.team=null;
 DB=copy;initialCandidateContext(copy);check(INITMK.scope==='region'&&!INITMK.detail&&!INITMK.selected.length,'world/save reset');
 console.log('INITIAL_RECRUITMENT_ACCEPTANCE '+JSON.stringify({readOnly:true,nonMidParity:parity,midFixed,regional:true,pages:all.pages,total:all.total,observed:true,commands:true,permissions:true,cancel:true,save:true,reset:true}));
})();`,{filename:'initial-recruitment.fixture.js',setupSources:[...sources,esc,'var DB,MSG;function recruitStageLabel(e){return e.stage}']});
