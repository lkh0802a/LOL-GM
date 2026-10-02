import {runEngineFixture} from './test-harness.mjs';
await runEngineFixture(String.raw`(()=>{
  const check=(x,m)=>{if(!x)throw Error('SAVE_HISTORY '+m)},rows=[];
  let reads=0;
  for(let i=0;i<100;i++)rows.push({get date(){reads++;return '2027-01-01'},patch:'27.1',comp:'LCK',season:'s',year:2027,split:1,stage:'regular',league:'LCK',international:false,regions:['KR'],sides:[{team:'t',region:'KR',win:true,picks:[{champ:'c',role:'MID',player:'p',items:['item'],runes:['rune']}]}],bans:['ban']});
  const actual=stringifyMetaHistory(rows);check(reads===100,'rows must be visited once');
  const expected=JSON.stringify(rows.map(packMetaHistoryRow));check(actual===expected,'persisted format changed');
  check(rows[0].sides[0].picks[0].items[0]==='item'&&!Array.isArray(rows[0]),'source row mutated');
  check(JSON.stringify(packMetaHistory(unpackMetaHistory(JSON.parse(actual))))===actual,'restored evidence changed');
  check(JSON.stringify(packMetaHistory([]))==='[]','empty archive');
  const db=buildWorld();db.metaHistory=unpackMetaHistory(JSON.parse(actual));
  const saved=packDB(db);check(JSON.parse(saved).metaHistoryPacked===1,'format version changed');
  const restored=unpackDB(saved);check(restored.metaHistory.length===100&&JSON.stringify(packMetaHistory(restored.metaHistory))===actual,'full save restoration');
  const many=Array.from({length:1200},()=>rows[0]),original=JSON.stringify,batches=[];
  JSON.stringify=function(value,...args){if(Array.isArray(value))batches.push(value.length);return original(value,...args)};
  let chunked;try{chunked=stringifyMetaHistory(many)}finally{JSON.stringify=original}
  check(batches.length===3&&Math.max(...batches)<=512,'unbounded encoded batch');
  check(chunked===original(packMetaHistory(many)),'batch boundaries changed history');
  const archive=[];
  const evidence=(n,player='p')=>({date:'2027-01-01',regions:[],bans:[],sides:[{picks:[{champ:'c',role:'MID',player,items:['i'+n,'i'+n],runes:['r'+n]}]}]});
  // Fill both bounded windows with old builds, then repeat a new cohort.
  for(let i=0;i<9000;i++)archive.push(evidence(i));
  for(let i=0;i<1024;i++)archive.push(evidence(9000+i%512));
  const before=JSON.stringify(archive),decoded=unpackMetaHistory(archive);
  const pickAt=i=>decoded[i].sides[0].picks[0];
  check(pickAt(9000)===pickAt(9512),'recent pick sharing stopped after old window filled');
  check(pickAt(9000).items===pickAt(9512).items&&pickAt(9000).runes===pickAt(9512).runes,'recent loadout sharing');
  check(Object.isFrozen(pickAt(9000))&&Object.isFrozen(pickAt(9000).items),'shared evidence mutable');
  check(JSON.stringify(decoded)===before,'archive evidence lost');
  check(JSON.stringify(unpackMetaHistory(decoded))===before,'repeated restoration changed frozen evidence');
  const different=[evidence(1,'a'),evidence(1,'b'),evidence(2,'a')];different[2].sides[0].picks[0].items=['i1','i2'];
  unpackMetaHistory(different);check(different[0].sides[0].picks[0]!==different[1].sides[0].picks[0],'players collapsed');
  check(different[2].sides[0].picks[0].items.join(',')==='i1,i2','item order or duplicates lost');
  const extended=[evidence(1),evidence(1)];for(const row of extended)row.sides[0].picks[0].extra={note:'legacy'};
  const legacyBefore=JSON.stringify(extended);unpackMetaHistory(extended);
  check(JSON.stringify(extended)===legacyBefore&&extended[0].sides[0].picks[0]!==extended[1].sides[0].picks[0],'extended legacy record aliased or lost');
  console.log('SAVE_HISTORY_ACCEPTANCE PASS (bounded batches, exact format parity, pure packing, archive/full-save restore)');
})()`,{filename:'save-history-acceptance.vm.js',timeout:120000});
