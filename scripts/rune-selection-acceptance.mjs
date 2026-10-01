// Frozen pre-optimization selector from main@150bc72. Its repeated secondary
// scoring is the reference oracle; optimized selection must preserve exact IDs.
import {runEngineFixture} from './test-harness.mjs';

await runEngineFixture(String.raw`
function referenceRunePage(patch,c,p,role){
  const styles=Object.values(patch.runes||{}).filter(s=>s&&Array.isArray(s.slots)&&s.slots.length>=4);
  if(styles.length<2)return [];
  const bestIn=(style,slot)=>((style.slots&&style.slots[slot])||[]).filter(id=>patch.runeDefs?.[id]?.active!==false).map(id=>({id,s:runeChoiceScore(patch,c,p,role,id),slot})).sort((x,y)=>y.s-x.s)[0]||null;
  const ranked=styles.map(style=>{const picks=[0,1,2,3].map(slot=>bestIn(style,slot));return {style,picks,score:picks.every(Boolean)?picks.reduce((z,x)=>z+x.s,0):-Infinity}}).filter(x=>Number.isFinite(x.score)).sort((x,y)=>y.score-x.score);
  const primary=ranked[0];if(!primary)return [];
  const secondary=ranked.slice(1).map(x=>{const picks=[1,2,3].map(slot=>bestIn(x.style,slot)).filter(Boolean).sort((u,v)=>v.s-u.s).slice(0,2);return {style:x.style,picks,score:picks.length===2?picks.reduce((z,y)=>z+y.s,0):-Infinity}}).filter(x=>Number.isFinite(x.score)).sort((x,y)=>y.score-x.score)[0];
  return [...primary.picks.map(x=>x.id),...(secondary?secondary.picks.map(x=>x.id):[])];
}
(()=>{
  const check=(ok,msg)=>{if(!ok)throw new Error('RUNE_SELECTION '+msg)};
  const db=buildWorld(),champions=Object.values(db.patch.champions),
    player=Object.values(db.players)[0],before=JSON.stringify(db);
  let cases=0;
  const compare=(patch,c,p,role)=>{
    const expected=referenceRunePage(patch,c,p,role),actual=selectRunePage(patch,c,p,role);
    check(JSON.stringify(actual)===JSON.stringify(expected),'rune IDs/order differ');
    cases++;return actual;
  };
  for(const c of champions)for(const role of ROLES)for(const p of [null,player])
    compare(db.patch,c,p,role);
  check(JSON.stringify(db)===before,'selection changed world/save state');
  const restored=unpackDB(packDB(db));
  for(const c of Object.values(restored.patch.champions).slice(0,10))
    for(const role of ROLES)compare(restored.patch,c,restored.players[player.id],role);
  const c=champions[0],patch=JSON.parse(JSON.stringify(db.patch));
  const disabled=Object.keys(patch.runeDefs)[0];
  patch.runeDefs[disabled].active=false;patch._systemRevision=(patch._systemRevision||0)+1;
  for(const role of ROLES)compare(patch,c,player,role);
  for(const style of Object.values(patch.runes))style.slots[0]=[];
  check(compare(patch,c,player,'MID').length===0,'incomplete styles accepted');
  patch.runes={};check(compare(patch,c,null,'SUP').length===0,'empty styles accepted');

  const original=runeChoiceScore;
  // Stable score ties must retain the same style/slot order.
  runeChoiceScore=()=>0;
  for(const role of ROLES)compare(db.patch,c,null,role);
  runeChoiceScore=original;
  let calls=0;
  runeChoiceScore=(...args)=>{calls++;return original(...args)};
  referenceRunePage(db.patch,c,player,'MID');const referenceCalls=calls;
  calls=0;selectRunePage(db.patch,c,player,'MID');const optimizedCalls=calls;
  runeChoiceScore=original;
  check(optimizedCalls<referenceCalls,'secondary scoring work was not eliminated');
  const result=selectRunePage(db.patch,c,player,'MID');result.push('caller-mutation');
  compare(db.patch,c,player,'MID');

  // Alternating warmed samples: report speed evidence without a noisy time gate.
  const times={reference:[],optimized:[]},run=fn=>{
    const started=performance.now();
    for(let i=0;i<200;i++)fn(db.patch,c,player,'MID');
    return performance.now()-started;
  };
  for(let sample=0;sample<5;sample++){
    const order=sample%2?['optimized','reference']:['reference','optimized'];
    for(const label of order)times[label].push(run(label==='reference'?referenceRunePage:selectRunePage));
  }
  const median=xs=>xs.slice().sort((a,b)=>a-b)[Math.floor(xs.length/2)],
    referenceMs=median(times.reference),optimizedMs=median(times.optimized);
  console.log('RUNE_SELECTION_ACCEPTANCE '+JSON.stringify({exact:true,cases,
    referenceCalls,optimizedCalls,scoreWorkReduction:1-optimizedCalls/referenceCalls,
    iterationsPerSample:200,samplesPerSelector:5,referenceMedianMs:referenceMs,
    optimizedMedianMs:optimizedMs,speedRatio:referenceMs/optimizedMs,
    saveRestore:true,worldUnchanged:true}));
})();`,{filename:'rune-selection.fixture.js'});
