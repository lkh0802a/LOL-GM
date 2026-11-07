// Diagnostic for #237: exit nonzero while hidden attributes change public hype.
// This is a controlled fresh world, not a production save or balance benchmark.
import {runEngineFixture} from './test-harness.mjs';

const result=await runEngineFixture(String.raw`(()=>{
  const cfg=defaultWorldConfig();
  cfg.regions=[regionCfg('NA',{teams:3,div2:false})];
  cfg.internationals=[];
  const base=buildWorld(cfg),owner=activeTeams(base,'NA',1)[0];
  startCareer(base,owner.id,'hype-proof');
  for(const t of setupTeamsForManager(base))autoBuildInitialSquad(base,t,new RNG('hype-proof/'+t.id));
  finalizeInitialRosters(base);
  const rostered=activeTeams(base,'NA',1).flatMap(t=>t.roster||[]);
  if(!rostered.length || !rostered.every(id=>base.players[id]?.attrs && Object.keys(base.players[id].attrs).length))throw Error('diagnostic requires rostered players with hidden attributes');
  const low=JSON.parse(JSON.stringify(base)),high=JSON.parse(JSON.stringify(base));
  for(const p of Object.values(low.players))for(const k of Object.keys(p.attrs||{}))p.attrs[k]=20;
  for(const p of Object.values(high.players))for(const k of Object.keys(p.attrs||{}))p.attrs[k]=99;
  const w={year:base.year,seasons:{}},a=updateHype(low,w).NA,b=updateHype(high,w).NA;
  const teams=activeTeams(base,'NA',1).map(t=>t.id);
  return {publicSeasons:0,teams:teams.length,rostered:rostered.length,low:{stars:a.stars,hype:a.hype,fans:teams.map(t=>low.teams[t].fans)},high:{stars:b.stars,hype:b.hype,fans:teams.map(t=>high.teams[t].fans)}};
})()`,{timeout:30000});

const equal=JSON.stringify(result.low)===JSON.stringify(result.high);
console.log('FANDOM_OBSERVATION_AUDIT '+JSON.stringify({...result,hiddenAttributesOnly:true,equal}));
if(!equal)process.exitCode=1;
