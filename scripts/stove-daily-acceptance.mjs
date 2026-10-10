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
const base=JSON.stringify(DB),reset=()=>{DB=JSON.parse(base);SLOT='1';VIEW='season';UI_RENDER_ID++;UI_OVERLAY=null;SLOT_SWITCHING=false;answer=()=>true;saves=0;navs=0;nodes.clear()};
node('[data-allow-contact]').dataset.allowContact=p.id;originalBindContractWindow(()=>false);const previous=node('[data-allow-contact]').onclick;DB=JSON.parse(base);previous();check(saves===1&&DB.world.contractWindow.contactWaivers[p.id],'original ignores permission and writes replacement world');
reset();node('[data-allow-contact]').dataset.allowContact=p.id;bindContractWindow(seasonUiGuard());const retained=node('[data-allow-contact]').onclick;DB=JSON.parse(base);const replaced=JSON.stringify(DB);retained();check(saves===0&&JSON.stringify(DB)===replaced,'replacement contact callback inert');
for(const mode of ['fired','ai','initial','reserve','pending']){reset();if(mode==='fired')DB.world.fired=true;if(mode==='ai')DB.world.manage='ai';if(mode==='initial')DB.world.phase='initial_roster';if(mode==='reserve')DB.teams[managedTeamId(DB)].parent='other';if(mode==='pending')DB.world.pendingOfficial={queue:[{}]};node('[data-allow-contact]').dataset.allowContact=p.id;bindContractWindow(seasonUiGuard());const before=JSON.stringify(DB);node('[data-allow-contact]').onclick();check(JSON.stringify(DB)===before&&saves===0,'fresh manual authority '+mode)}
reset();const pristine=JSON.stringify(DB);check(stoveModel().ready&&stoveModel().rows.length===1&&stoveModel().rows[0].created===DB.worldDate&&renderStove().includes(p.name)&&JSON.stringify(DB)===pristine,'actual open negotiation date and pure model');bindStove(seasonUiGuard());answer=()=>false;node('[data-stove-day]').onclick();check(JSON.stringify(DB)===pristine&&saves===0&&navs===0,'cancel retains world and UI');
answer=()=>true;const expected=JSON.parse(pristine);advanceOffseasonContractDay(expected);node('[data-stove-day]').onclick();check(JSON.stringify(DB)===JSON.stringify(expected)&&saves===1,'daily whole world existing writer equality');const completed=JSON.stringify(DB);node('[data-stove-day]').onclick();check(JSON.stringify(DB)===completed&&saves===1,'duplicate inert');
let cases=0;for(const mode of ['loaded','world','manager','team','slot','view','render','date','year','manage','fired','phase','window','agreements','negotiations','overlay','switching']){
reset();bindStove(seasonUiGuard());bindContractWindow(seasonUiGuard());node('[data-allow-contact]').dataset.allowContact=p.id;node('[data-start-early]').dataset.startEarly=p.id;node('[data-start-fa]').dataset.startFa=p.id;const callbacks=['[data-stove-day]','[data-stove-end]','[data-stove-market]','[data-allow-contact]','[data-start-early]','[data-start-fa]'].map(s=>node(s).onclick);
if(mode==='loaded')DB=JSON.parse(base);if(mode==='world')DB.world={...DB.world};if(mode==='manager')DB.manager={...DB.manager};if(mode==='team')DB.manager.teamId=null;
if(mode==='slot')SLOT='2';if(mode==='view')VIEW='data';if(mode==='render')UI_RENDER_ID++;if(mode==='date')DB.worldDate=addDays(DB.worldDate,1);if(mode==='year')DB.year++;
if(mode==='manage')DB.world.manage='ai';if(mode==='fired')DB.world.fired=true;if(mode==='phase')DB.world.phase='market';if(mode==='window')DB.world.contractWindow.stage='fa';if(mode==='agreements')DB.world.contractAgreements={changed:true};if(mode==='negotiations')DB.world.negotiations.changed={status:'open'};if(mode==='overlay')UI_OVERLAY={};if(mode==='switching')SLOT_SWITCHING=true;
const before=JSON.stringify(DB),view=VIEW;for(const cb of callbacks)cb();check(JSON.stringify(DB)===before&&VIEW===view&&saves===0&&navs===0,'stale '+mode);cases++}
reset();bindStove(seasonUiGuard());answer=()=>{DB.worldDate=addDays(DB.worldDate,1);return true};const date=addDays(DB.worldDate,1);node('[data-stove-day]').onclick();check(DB.worldDate===date&&saves===0,'confirmation external date recheck');
reset();DB.worldDate=DB.world.contractWindow.exclusiveThrough;const expiry=JSON.parse(JSON.stringify(DB));advanceOffseasonContractDay(expiry);bindStove(seasonUiGuard());node('[data-stove-day]').onclick();check(JSON.stringify(DB)===JSON.stringify(expiry)&&DB.world.contractWindow.stage==='fa'&&saves===1,'actual expiry and contact consumers');
reset();const end=JSON.parse(base);advanceOffseasonContractWindow(end);bindStove(seasonUiGuard());node('[data-stove-end]').onclick();check(JSON.stringify(DB)===JSON.stringify(end)&&saves===1,'explicit end writer equality');
reset();const payment=processTransferPayments;processTransferPayments=()=>{throw Error('synthetic late payment failure')};bindStove(seasonUiGuard());node('[data-stove-day]').onclick();processTransferPayments=payment;check(JSON.stringify(DB)===base&&saves===0&&MSG.includes('기록을 유지'),'late failure rollback');
reset();const actualSave=saveDB;saveDB=()=>{throw Error('synthetic save failure')};bindStove(seasonUiGuard());node('[data-stove-day]').onclick();saveDB=actualSave;check(DB.worldDate===addDays(JSON.parse(base).worldDate,1)&&MSG.includes('저장하지 못'),'completed date retained on save error');
const raw=JSON.stringify(DB),loaded=unpackDB(packDB(DB));check(loaded.worldDate===DB.worldDate&&JSON.stringify(loaded.world.contractWindow)===JSON.stringify(DB.world.contractWindow)&&JSON.stringify(DB)===raw,'actual full save continuity');
reset();DB.world.contractWindow.exclusiveThrough='unknown';check(!stoveModel().ready&&renderStove().includes(' disabled'),'missing date not invented');
for(const field of ['startDate','exclusiveThrough','contractExpiryDate','outsideContactDate']){
 reset();DB.world.contractWindow[field]='2027-13-20';DB=unpackDB(JSON.stringify(DB));const before=JSON.stringify(DB);check(!stoveModel().ready&&renderStove().includes('계약 날짜 정보를 확인할 수 없어'),'invalid saved date displayed without exception');bindStove(seasonUiGuard());node('[data-stove-day]').onclick();check(JSON.stringify(DB)===before&&saves===0,'invalid calendar metadata does not consume or overwrite save');
}
reset();DB.worldDate='2027-00-00';DB=unpackDB(JSON.stringify(DB));const invalidBefore=JSON.stringify(DB);check(!stoveModel().ready&&renderStove().includes(' disabled')&&JSON.stringify(DB)===invalidBefore,'invalid saved world clock does not invent date');
console.log('STOVE_DAILY_ACCEPTANCE '+JSON.stringify({stale:cases,originalCounterexample:true,dailyWriter:true,expiryWriter:true,endWriter:true,cancel:true,duplicate:true,rollback:true,save:true,readPure:true}));
})()`).runInContext(context,{timeout:30000});
assert.equal(new vm.Script('saves').runInContext(context),0);
context.officialFixture=JSON.parse(await readFile(new URL('../docs/evidence/unemployed-season-fixture-2026-10-08.json',import.meta.url)));
new vm.Script(String.raw`(()=>{
DB=unpackDB(JSON.stringify(officialFixture));setManagedTeam(DB,activeTeams(DB,'NA',1)[0].id);DB.world.phase='offseason';delete DB.world.contractWindow;initOffseasonContractWindow(DB);
const rec=DB.world.seasons['compact-official'].days[0].matches[0].res,original=JSON.stringify(rec),history=JSON.stringify(DB.history),meta=JSON.stringify(DB.metaHistory);if(rec.games[0].publicRecord.ending.kind!=='nexus')throw Error('STOVE_DAILY actual official nexus');
SLOT='1';VIEW='season';UI_RENDER_ID++;UI_OVERLAY=null;SLOT_SWITCHING=false;answer=()=>true;saves=0;bindStove(seasonUiGuard());node('[data-stove-day]').onclick();
const saved=unpackDB(packDB(DB)),game=saved.world.seasons['compact-official'].days[0].matches[0].res.games[0];if(JSON.stringify(rec)!==original||JSON.stringify(DB.history)!==history||JSON.stringify(DB.metaHistory)!==meta||game.publicRecord.ending.kind!=='nexus'||JSON.stringify(saved.world.contractAgreements)!==JSON.stringify(DB.world.contractAgreements)||saves!==1)throw Error('STOVE_DAILY raw and compact official continuity');
console.log('STOVE_DAILY_OFFICIAL_SAVE_ACCEPTANCE actual professional nexus and existing full/lite save');
})()`).runInContext(context,{timeout:30000});
