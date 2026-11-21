// Synthetic identity diagnostic; it does not change real saves or seed data.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`(()=>{
  const db=buildWorld(),original=packDB(db),existing=Object.values(db.players)[0];
  const countNames=players=>{
    const counts=new Map();for(const p of Object.values(players))counts.set(p.name,(counts.get(p.name)||0)+1);
    return [...counts.values()].filter(n=>n>1).length;
  };
  const baselineDuplicateNames=countNames(db.players);
  const copy=unpackDB(original),beforeIds=Object.keys(copy.players).length;
  const p=genPlayer(copy,new RNG('seeded-name-probe'),{name:existing.name,role:'TOP',age:20,base:60,region:existing.region});
  const matches=Object.values(copy.players).filter(x=>x.name===existing.name).map(x=>x.id);
  const saved=unpackDB(packDB(copy));
  console.log('SEEDED_NICKNAME_OBSERVATION '+JSON.stringify({baselinePlayers:Object.keys(db.players).length,
    baselineDuplicateNames,distinctIds:new Set(matches).size,matchingNames:matches.length,
    added:!!copy.players[p.id]&&Object.keys(copy.players).length===beforeIds+1,
    matchingNamesAfterRestore:Object.values(saved.players).filter(x=>x.name===existing.name).length,
    originalUnchanged:packDB(db)===original}));
})();`);
