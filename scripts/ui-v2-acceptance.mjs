import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runEngineFixture} from './test-harness.mjs';
import {ENGINE_MODULES,UI_MODULES} from './artifact-modules.mjs';
const root=new URL('../',import.meta.url),get=p=>readFile(new URL(p,root),'utf8');
const modules=['state.js','market.js','contracts.js','views.js','management.js','app.js'];
const sources=await Promise.all(modules.map(p=>get('src/ui-v2/'+p)));
const build=await get('scripts/build-ui-v2.mjs');assert(build.includes('ENGINE_MODULES'));assert(!build.includes('UI_MODULES'));

for(const source of sources)assert(!/\b(?:renderInitialRosterMarket|bindInitialRosterMarket|viewSeason|navigateTo|renderNegotiations|bindNegotiationControls)\s*\(/.test(source),'기존 화면/바인딩 재사용 금지');
const shell=await get('src/ui-v2/shell.html'),css=await get('src/ui-v2/style.css');
const html=shell.replace('/*STYLE*/',css).replace('/*ENGINE*/',(await Promise.all(ENGINE_MODULES.map(p=>get('src/artifact/'+p)))).join('\n')).replace('/*UI*/',sources.join('\n'));
assert.equal(await get('ui-v2.html'),html,'현재 엔진·새 화면과 조립 HTML 동일');
for(const file of UI_MODULES)assert(!html.includes(await get('src/artifact/'+file)),'기존 UI 소스 미포함: '+file);
const result=await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('UI_V2 '+m)};
 const moneyCases=[[.0085,'85만 원'],[.125,'1,250만 원'],[1,'1억 원'],[12.5,'12억 5,000만 원'],[100,'100억 원'],[0,'0 원'],[-.125,'-1,250만 원'],[NaN,'정보 없음']];
 for(const [n,label] of moneyCases)check(v2Money(n)===label,'공통 금액 '+label);
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('KR',{teams:10,div2:false})];cfg.internationals=[];
 const db=buildWorld(cfg),team=activeTeams(db,'KR',1)[0];startCareer(db,team.id,'ui-v2-authority');V2.db=unpackDB(packDB(db));V2.target=team.id;
 let current=v2Guard();V2.revision++;check(!current(),'이전 화면');current=v2Guard();V2.db=unpackDB(packDB(V2.db));check(!current(),'복원 뒤 이전 입력');
 for(const field of ['fired','manage','pendingOfficial']){const w=V2.db.world,old=w[field];w[field]=field==='fired'?true:field==='manage'?'ai':{};check(!!v2ManualError(),field+' 실제 권한 거절');w[field]=old;}
 V2.db.world.negotiations={};V2.read={};const before=packDB(V2.db);check(v2Mail().length===0,'빈 연락');v2Assistant();check(packDB(V2.db)===before,'비서 조회 저장 값 불변');
 return {moneyCases:moneyCases.length,staleRenderAndLoad:true,currentAuthority:true,assistantGamePure:true,legacyUIIncluded:false};
})()`,{setupSources:[...sources.slice(0,4),"function v2Icon(){return ''}"],timeout:120000});
assert.equal(result.moneyCases,8);assert(result.staleRenderAndLoad&&result.currentAuthority&&result.assistantGamePure);console.log('UI_V2_ACCEPTANCE',JSON.stringify(result));
