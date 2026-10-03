import {runEngineFixture,artifactSources} from './test-harness.mjs';
const ui=await artifactSources(['ui-player.js','ui-scouting-regions.js','ui-player-commitments.js','ui-player-loans.js','ui-local-service.js']);
await runEngineFixture(String.raw`(()=>{
 const check=(x,m)=>{if(!x)throw Error('OBSERVER_PROFILE '+m)};
 const cfg=defaultWorldConfig();cfg.regions=[regionCfg('NA',{teams:6,div2:true,system:'franchise'})];cfg.internationals=[];cfg.changes='none';
 const db=buildWorld(cfg),a=activeTeams(db,'NA',1)[0],b=activeTeams(db,'NA',1)[1];
 for(const t of [a,b])for(const role of ROLES){const p=genPlayer(db,new RNG(t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
 startWorldSeason(db,a.id,'observer-profile');DB=db;
 const p=db.players[b.depthChart.MID],own=db.players[a.depthChart.MID];
 const result=simulateMatch(db,a.id,b.id,'observer-profile-match',null,true);recordMeta(db,result);
 p.careerEvents.push({year:db.year,type:'role_conversion_started',from:'MID',target:'TOP'},{year:db.year,type:'role_promise',role:'core',until:db.year+1},{year:db.year,type:'award',competition:'Public cup',award:'Public award'});
 const archive=JSON.stringify(p.careerEvents),raw=playerCoreMetrics(p),observed=observedPlayerCoreMetrics(db,p);
 check(!Object.hasOwn(observed,'aggression')&&Object.keys(observed).some(k=>observed[k]!==raw[k]),'derived profile shows raw metrics');
 const agrid=playerDetail(p);check(agrid.includes('관찰 능력치 기반 추정')&&agrid.includes('시장가치 추정')&&agrid.includes('Public award')&&!agrid.includes('전향 시작')&&!agrid.includes('구두 약속 ·')&&!agrid.includes('현재 선발'),'foreign UI has private events/lineup');
 const keys=['tend','personality','development','form','condition','fatigue','morale','sharpness','teamAdaptation','tacticalAdaptation','satisfaction','satisfactionReasons','rosterRole','rolePromise','roleConversion','wantsOut','wantsOutReason'],descriptors=new Map(keys.map(k=>[k,Object.getOwnPropertyDescriptor(p,k)]));
 for(const k of keys)Object.defineProperty(p,k,{configurable:true,get(){throw Error('private '+k+' read')}});
 const guarded=playerDetail(p);check(guarded.includes('공개 출전 기록')&&!guarded.includes('width:')&&!guarded.includes('전성기 예상')&&!guarded.includes('data-role-convert='),'guarded popup lost public information');
 const metrics=JSON.stringify(observedPlayerCoreMetrics(db,p)),value=observedPlayerMarketValue(db,p);check(Number.isFinite(value)&&value>0,'observed valuation missing');
 for(const k of keys){const d=descriptors.get(k);if(d)Object.defineProperty(p,k,d);else delete p[k]}
 const snap=JSON.stringify(p);p.form=99;p.fatigue=99;p.morale=1;p.tend.aggression=99;p.personality.ambition=1;p.development.peakAge=99;
 check(JSON.stringify(observedPlayerCoreMetrics(db,p))===metrics&&observedPlayerMarketValue(db,p)===value,'private state influences derived signal or valuation');
 const restoredP=JSON.parse(snap);for(const k of Object.keys(p))delete p[k];Object.assign(p,restoredP);
 const before=JSON.stringify(p);playerDetail(p);check(JSON.stringify(p)===before&&JSON.stringify(p.careerEvents)===archive,'foreign rendering mutates private player/history');
 check(playerDetail(own).includes('전성기 예상')&&playerDetail(own).includes('data-role-convert=')&&JSON.stringify(observedPlayerCoreMetrics(db,own))===JSON.stringify(playerCoreMetrics(own))&&observedPlayerMarketValue(db,own)===playerMarketValue(db,own),'own controls/metrics/value changed');
 const reserve=reserveTeamsOf(db,a)[0];own.team=reserve.id;check(playerDetail(own).includes('전성기 예상'),'parent lost reserve management');setManagedTeam(db,reserve.id);own.team=a.id;check(!playerDetail(own).includes('전성기 예상'),'reserve manager sees parent');setManagedTeam(db,a.id);
 own.team=b.id;check(!playerDetail(own).includes('data-role-convert='),'outgoing loan squad boundary');p.team=a.id;check(playerDetail(p).includes('전성기 예상'),'incoming squad boundary');p.team=b.id;own.team=a.id;
 db.world.fired=true;check(knowledge(db,own)<99,'fired manager retains exact observation signal');check(!playerDetail(own).includes('data-role-convert=')&&!playerDetail(own).includes('전성기 예상'),'fired controls');db.world.fired=false;
 const packed=packDB(db),copy=unpackDB(packed);DB=copy;check(JSON.stringify(observedPlayerCoreMetrics(copy,copy.players[p.id]))===JSON.stringify(observedPlayerCoreMetrics(db,p))&&playerDetail(copy.players[p.id]).includes('Public award'),'save observer view');DB=db;
 p.team=null;p.retired=true;check(!playerDetail(p).includes('전성기 예상')&&playerDetail(p).includes('은퇴'),'retired FA private plan');p.team=b.id;p.retired=false;
 observePlayer(db,p,50);check(playerDetail(p).includes('관찰 능력치 기반 추정')&&!Object.hasOwn(observedPlayerCoreMetrics(db,p),'aggression'),'high knowledge exposes unsupported trait');
 console.log('OBSERVER_PROFILE_ACCEPTANCE PASS actual match/full-popup/private getters/source purity/observed metrics/value/own/reserve/loan/fired/save/FA');
})();`,{timeout:60000,setupSources:["let DB;const tshort=id=>DB.teams[id]?.short||id;const ovrTag=x=>'<b>'+x+'</b>';const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');",...ui]});
