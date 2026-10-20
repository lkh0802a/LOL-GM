// Reproduce the already-reviewed behind-resource inputs using only public
// generator source from main d3bd47f. All match code runs from the current engine.
// This is never assembled into the game; no trial save/player snapshot is bundled.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
export async function reviewedResourceFixtureSetup(){
 const source=await readFile(new URL('../docs/evidence/originals/genPlayer-d3bd47f.js.txt',import.meta.url),'utf8');
 assert.equal(createHash('sha256').update(source).digest('hex'),'cbcebd3eb9fd2bd556d624767d3dd2f119f093fd97605de6ae42fbd4e0c362cc');
 return `function reviewedResourceFixture(cfg,withSeason=true){
  const currentGenerator=genPlayer,template={...INITIAL_WORLD_TEMPLATE};
  try{
   genPlayer=(${source});INITIAL_WORLD_TEMPLATE.key=null;INITIAL_WORLD_TEMPLATE.json=null;
   const db=buildWorld(cfg),[a,b]=activeTeams(db,'NA',1);setManagedTeam(db,a.id);
   for(const t of [a,b])for(const role of ROLES){const p=genPlayer(db,new RNG('match-history|'+t.id+role),{region:t.region,role,age:22,base:65});signContract(db,p,t,1,3);t.depthChart[role]=p.id}
   db.world=withSeason?{year:db.year,manage:'manual',phase:'season',seasons:{}}:null;return {db,a,b};
  }finally{genPlayer=currentGenerator;Object.assign(INITIAL_WORLD_TEMPLATE,template)}
 }`;
}
