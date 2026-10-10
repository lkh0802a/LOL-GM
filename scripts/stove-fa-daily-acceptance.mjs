import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {artifactSources,compiledEngine} from './test-harness.mjs';
const [stoveSource,fa,season,market,recruit]=await artifactSources(['ui-stove.js','ui-stove-fa.js','ui-season.js','ui-market.js','ui-club-recruitment.js']);
const stove=fa+'\n'+stoveSource;
const archive=JSON.parse(gunzipSync(await readFile(new URL('../docs/evidence/stove-daily-2026-10-10.raw.json.gz',import.meta.url))));
const original=Buffer.from(archive.find(r=>r.path==='original/src/artifact/ui-market.js').base64,'base64').toString();
const binder=s=>s.slice(s.indexOf('function bindContractWindow('),s.indexOf('\nfunction renderMarket('));
const guard=season.slice(season.indexOf('function seasonUiGuard('),season.indexOf('\nfunction seasonChoiceReturnCurrent('));
const context=vm.createContext({console,Date,Math,JSON,Set,Map,WeakMap,Object,Array,String,Number,Boolean,RegExp,Error,Intl,performance,crypto});
(await compiledEngine()).runInContext(context,{timeout:30000});
new vm.Script(String.raw`
let DB,SLOT='1',VIEW='season',UI_RENDER_ID=1,UI_OVERLAY=null,SLOT_SWITCHING=false,MSG='',saves=0,navs=0,answer=()=>true;
const nodes=new Map();const node=s=>{if(!nodes.has(s))nodes.set(s,{dataset:{},style:{},getBoundingClientRect(){return {bottom:0}},scrollIntoView(){},focus(){}});return nodes.get(s)};
const document={querySelector:s=>node(s),querySelectorAll:s=>[node(s)]};
const esc=s=>String(s).replaceAll('<','&lt;');function confirm(s){return answer(s)}function saveDB(){saves++}function nav(){navs++}function navKeepScroll(){}function transferTabAllowed(){return true}function navigateTo(v){VIEW=v}
function bindMutualTerminationControls(){}function bindContractEntryControls(){}function bindRecruitmentControls(){}function bindNegotiationControls(){}
`+recruit.split('\n').find(l=>l.startsWith('function recruitUiAllowed('))+'\n'+guard+'\n'+stove+'\n'+binder(market)+'\n'+binder(original).replace('function bindContractWindow(','function originalBindContractWindow(')).runInContext(context,{timeout:30000});
new vm.Script(String.raw`(()=>{
const check=(v,m)=>{if(!v)throw Error('STOVE_DAILY '+m)};
const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:2,div2:false})];cfg.internationals=[];
DB=buildWorld(cfg);const own=activeTeams(DB,'KR',1)[0];startCareer(DB,own.id,'stove-date');own.finance.cash=1000;
const p=Object.values(DB.players).find(p=>!p.retired&&!p.team);signContract(DB,p,own,asking(DB,p,'KR'),1,{promisedRole:'core'});p.contract.option=null;
DB.world={year:DB.year,seed:'stove-date',manage:'manual',phase:'offseason',seasons:{},steps:[],step:0,negotiations:{},lastDate:'2027-11-16'};DB.worldDate='2027-11-16';initOffseasonContractWindow(DB);
const negotiating=startNegotiation(DB,p.id,'renewal');check(negotiating.ok,'actual manual renewal negotiation');
advanceOffseasonContractWindow(DB);

const base=JSON.stringify(DB),reset=()=>{DB=JSON.parse(base);SLOT='1';VIEW='season';UI_RENDER_ID++;UI_OVERLAY=null;SLOT_SWITCHING=false;answer=()=>true;saves=0;navs=0;nodes.clear()};
const state=freeAgencyDayState(DB);check(state.ready&&state.next==='2027-12-02'&&state.through==='2028-01-06','existing annual boundary and actual next day');
// 기존 실제 정산 작성자. 금액은 가상 검사 자료이며 게임 가격을 변경하지 않는다.
const seller=activeTeams(DB,'KR',1).find(t=>t.id!==own.id);seller.finance.cash=1000;
const moved=DB.players[p.id];settleTransferSigningFee(DB,moved,seller,managedTeam(DB),1,{upfront:0,installments:[{date:state.next,amount:1}],addOns:[]});
const invoice=JSON.stringify(DB),expected=JSON.parse(invoice);setWorldCalendarDate(expected,state.next);processTransferPayments(expected);processLocalServiceDaily(expected);aiChooseLocalEligibility(expected);
check(renderStove().includes('합의된 이적료 일정')&&renderStove().includes(state.next)&&JSON.stringify(DB)===invoice,'pure actual owned invoice date');
bindStove(seasonUiGuard());answer=()=>false;node('[data-stove-day]').onclick();check(JSON.stringify(DB)===invoice&&saves===0,'cancel invoice and draft unchanged');
answer=()=>true;node('[data-stove-day]').onclick();check(JSON.stringify(DB)===JSON.stringify(expected)&&saves===1&&transferDealRows(managedTeam(DB))[0].rows[0].status==='paid','actual whole state date writers and installment payment');
const completed=JSON.stringify(DB);node('[data-stove-day]').onclick();check(JSON.stringify(DB)===completed&&saves===1,'duplicate inert');
const saved=unpackDB(packDB(DB));check(saved.worldDate===DB.worldDate&&JSON.stringify(transferDealRows(managedTeam(saved)))===JSON.stringify(transferDealRows(managedTeam(DB))),'actual payment save/load');
let stale=0;for(const mode of ['loaded','manager','team','slot','view','render','date','year','manage','fired','phase','window','negotiation','invoice','cash','service','overlay','switching']){
 reset();bindStove(seasonUiGuard());const held=node('[data-stove-day]').onclick;
 if(mode==='loaded')DB=JSON.parse(base);if(mode==='manager')DB.manager={...DB.manager};if(mode==='team')DB.manager.teamId=null;if(mode==='slot')SLOT='2';if(mode==='view')VIEW='data';if(mode==='render')UI_RENDER_ID++;if(mode==='date')DB.worldDate=addDays(DB.worldDate,1);if(mode==='year')DB.year++;if(mode==='manage')DB.world.manage='ai';if(mode==='fired')DB.world.fired=true;if(mode==='phase')DB.world.phase='market';if(mode==='window')DB.world.contractWindow.completed=false;if(mode==='negotiation')DB.world.negotiations.changed={status:'open'};if(mode==='cash')DB.teams[seller.id].finance.cash--;if(mode==='service')DB.players[p.id].localEligibility={changed:true};if(mode==='overlay')UI_OVERLAY={};if(mode==='switching')SLOT_SWITCHING=true;
 // 정산 변경은 항상 현재 세계의 기록에 적용한다.
 if(mode==='invoice')DB.teams[seller.id].finance.transferDeals={changed:true};
 const before=JSON.stringify(DB);held();check(JSON.stringify(DB)===before&&saves===0&&navs===0,'stale '+mode);stale++;
}
for(const mode of ['unemployed','fired','ai','reserve','inactive','pending']){reset();if(mode==='unemployed')setManagedTeam(DB,null);if(mode==='fired')DB.world.fired=true;if(mode==='ai')DB.world.manage='ai';if(mode==='reserve')managedTeam(DB).parent='other';if(mode==='inactive')managedTeam(DB).active=false;if(mode==='pending')DB.world.pendingOfficial={queue:[{}]};const before=JSON.stringify(DB);check(!advanceOffseasonFreeAgencyDay(DB).ok&&JSON.stringify(DB)===before,'engine manual refusal '+mode);bindStove(seasonUiGuard());node('[data-stove-day]').onclick();check(JSON.stringify(DB)===before&&saves===0,'UI fresh refusal '+mode)}
reset();const sys=JSON.parse(base),manual=JSON.parse(base);check(advanceOffseasonFreeAgencyDay(sys,'system').ok&&advanceOffseasonFreeAgencyDay(manual).ok&&JSON.stringify(sys)===JSON.stringify(manual),'system/player consumer parity');
reset();DB.worldDate='2028-01-05';const boundary=JSON.parse(JSON.stringify(DB));check(advanceOffseasonFreeAgencyDay(boundary).ok&&boundary.worldDate==='2028-01-06'&&!advanceOffseasonFreeAgencyDay(boundary).ok,'existing Jan06 boundary no annual auto writer');
reset();DB.worldDate='2028-01-06';check(!freeAgencyDayState(DB).ready&&renderStove().includes('연간 결산 기준일'),'manual annual boundary');
reset();const bad=JSON.stringify(DB);const consumer=processTransferPayments;processTransferPayments=db=>{db.teams[seller.id].finance.cash=1;throw Error('synthetic late payment')};try{advanceOffseasonFreeAgencyDay(DB);check(false,'late failure must throw')}catch{}processTransferPayments=consumer;check(JSON.stringify(DB)===bad,'engine preparation failure no partial state');
reset();bindStove(seasonUiGuard());answer=()=>{DB.worldDate=addDays(DB.worldDate,1);return true};node('[data-stove-day]').onclick();check(DB.worldDate===addDays(JSON.parse(base).worldDate,1)&&saves===0,'confirmation recheck');
reset();DB.world.contractWindow.outsideContactDate='2027-13-20';const invalid=JSON.stringify(DB);check(!freeAgencyDayState(DB).ready&&!advanceOffseasonFreeAgencyDay(DB).ok&&JSON.stringify(DB)===invalid,'invalid date readonly');
for(const field of ['contractExpiryDate','outsideContactDate']){reset();DB.world.contractWindow[field]='2027-13-20';const before=JSON.stringify(DB);check(!advanceOffseasonFreeAgencyDay(DB).ok&&JSON.stringify(DB)===before,'malformed date '+field)}
reset();mInterest(DB,p.id);mEvaluateTarget(DB,p.id);const opened=startNegotiation(DB,p.id,'fa');check(opened.ok,'actual observed FA manual negotiation');const nid=opened.neg.id,created=opened.neg.createdDate;advanceOffseasonFreeAgencyDay(DB);const currentNeg=DB.world.negotiations[nid];check(currentNeg.createdDate===created&&currentNeg.round===0,'day keeps actual negotiation start and no submitted round');const offer=submitNegotiationOffer(DB,nid,currentNeg.demand);check(offer.ok&&DB.world.negotiations[nid].status==='accepted'&&DB.world.negotiations[nid].closedDate===DB.worldDate&&DB.players[p.id].contract.signed===DB.world.contractWindow.startSeason,'manual existing offer after day has actual closed date and next season contract');const signedSaved=unpackDB(packDB(DB));check(signedSaved.world.negotiations[nid].closedDate===DB.worldDate&&signedSaved.players[p.id].contract.until===DB.players[p.id].contract.until,'actual signed negotiation save');
reset();const rounds=JSON.stringify(DB.world.negotiations);advanceOffseasonFreeAgencyDay(DB);check(JSON.stringify(DB.world.negotiations)===rounds,'day does not submit or invent deadline/negotiation rounds');
console.log('STOVE_FA_DAILY_ACCEPTANCE '+JSON.stringify({stale,actualPayment:true,existingBoundary:true,manualAuthority:true,cancel:true,duplicate:true,prepareRollback:true,systemParity:true,save:true}));
})()`).runInContext(context,{timeout:30000});
context.officialFixture=JSON.parse(await readFile(new URL('../docs/evidence/unemployed-season-fixture-2026-10-08.json',import.meta.url)));
new vm.Script(String.raw`(()=>{
DB=unpackDB(JSON.stringify(officialFixture));setManagedTeam(DB,activeTeams(DB,'NA',1)[0].id);DB.world.phase='offseason';delete DB.world.contractWindow;initOffseasonContractWindow(DB);
advanceOffseasonContractWindow(DB);
const rec=DB.world.seasons['compact-official'].days[0].matches[0].res,original=JSON.stringify(rec),history=JSON.stringify(DB.history),meta=JSON.stringify(DB.metaHistory);if(rec.games[0].publicRecord.ending.kind!=='nexus')throw Error('STOVE_DAILY actual official nexus');
SLOT='1';VIEW='season';UI_RENDER_ID++;UI_OVERLAY=null;SLOT_SWITCHING=false;answer=()=>true;saves=0;bindStove(seasonUiGuard());node('[data-stove-day]').onclick();
const saved=unpackDB(packDB(DB)),game=saved.world.seasons['compact-official'].days[0].matches[0].res.games[0];if(JSON.stringify(rec)!==original||JSON.stringify(DB.history)!==history||JSON.stringify(DB.metaHistory)!==meta||game.publicRecord.ending.kind!=='nexus'||JSON.stringify(saved.world.contractAgreements)!==JSON.stringify(DB.world.contractAgreements)||saves!==1)throw Error('STOVE_DAILY raw and compact official continuity');
console.log('STOVE_FA_OFFICIAL_SAVE_ACCEPTANCE actual professional nexus and existing full/lite save');
})()`).runInContext(context,{timeout:30000});
