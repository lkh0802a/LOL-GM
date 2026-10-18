import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runEngineFixture} from './test-harness.mjs';
import {SEEDED_SHUFFLE_FIXTURE} from './seeded-shuffle-fixture.mjs';
const golden={
  "mech": {
    "next": [
      0.7878796763252467,
      0.9603385280352086,
      0.5196623785886914,
      0.7818201628979295,
      0.25997439958155155,
      0.08344445237889886
    ],
    "mixed": [
      2,
      -1.433834234951064,
      false,
      0.8405477397201451,
      0.3162219170265707
    ],
    "state": {
      "a": 409165028,
      "sp": null
    }
  },
  "dec": {
    "next": [
      0.6840121278073639,
      0.6383492497261614,
      0.8594895382411778,
      0.49784224620088935,
      0.06809832411818206,
      0.7139468332752585
    ],
    "mixed": [
      2,
      2.6914181113243103,
      true,
      -0.265435184857051,
      -1.0402077458171972
    ],
    "state": {
      "a": 1860785703,
      "sp": null
    }
  },
  "info": {
    "next": [
      0.9578645515721291,
      0.2703091131988913,
      0.6886799796484411,
      0.8327732048928738,
      0.570207349024713,
      0.8029404440894723
    ],
    "mixed": [
      5,
      1.4151718858629465,
      true,
      1.0206166557259988,
      -0.4015492147610389
    ],
    "state": {
      "a": 1070872659,
      "sp": null
    }
  },
  "exec": {
    "next": [
      0.32311550341546535,
      0.08624814334325492,
      0.2932520667091012,
      0.27212869096547365,
      0.7438378729857504,
      0.3925362383015454
    ],
    "mixed": [
      5,
      -1.90881351637654,
      false,
      0.33620895397272654,
      0.5386282529024901
    ],
    "state": {
      "a": 120370319,
      "sp": null
    }
  },
  "draft": {
    "next": [
      0.19954205257818103,
      0.9956567408517003,
      0.7958863431122154,
      0.2854629592038691,
      0.5641714630182832,
      0.504140563774854
    ],
    "mixed": [
      7,
      1.6844194331206381,
      true,
      -0.7706186887731266,
      -0.3775989319027532
    ],
    "state": {
      "a": -1078109424,
      "sp": null
    }
  },
  "log": {
    "next": [
      0.9920335419010371,
      0.5492385234683752,
      0.8501028132159263,
      0.7560896286740899,
      0.1318787783384323,
      0.33531269431114197
    ],
    "mixed": [
      8,
      1.2460705598350614,
      true,
      0.029991031517538718,
      -0.10311461322468515
    ],
    "state": {
      "a": -878719465,
      "sp": null
    }
  }
};
const result=await runEngineFixture(String.raw`(()=>{
 const check=(v,m)=>{if(!v)throw Error('SEEDED_SHUFFLE '+m)},vectors={};
 for(const [key,rng]of Object.entries(makeStreams('unicode-가-🎮')))vectors[key]={next:Array.from({length:6},()=>rng.next()),mixed:[rng.int(1,9),rng.range(-2,3),rng.chance(.4),rng.normal(),rng.normal()],state:{a:rng.a,sp:rng.sp}};
 const permutations=new Set();for(let first=0;first<3;first++)for(let second=0;second<2;second++){const r=new RNG('enumerate','shuffle'),draws=[(first+.5)/3,(second+.5)/2];let calls=0;r.next=()=>{check(calls<2,'extra draw');return draws[calls++]};const input=Object.freeze(['A','B','C']),out=r.shuffle(input);check(calls===2&&out!==input&&new Set(out).size===3,'permutation or draw count');permutations.add(out.join(''))}check(permutations.size===6,'all six draw branches must give distinct permutations');
 const r=new RNG('unchanged','shuffle'),state=r.a,sp=r.sp;check(r.shuffle([]).length===0&&r.shuffle([1])[0]===1&&r.a===state&&r.sp===sp,'empty/single consumed RNG');const obj={},input=Object.freeze([obj,obj,2]);check(r.shuffle(input).filter(x=>x===obj).length===2,'object identity or multiplicity lost');
 const streams=makeStreams('separate-streams'),independent=JSON.stringify(Object.fromEntries(Object.entries(streams).filter(([k])=>k!=='dec').map(([k,v])=>[k,{a:v.a,sp:v.sp}])));streams.dec.normal();const spare=streams.dec.sp;streams.dec.shuffle([1,2,3,4]);check(streams.dec.sp===spare,'shuffle discarded cached normal');check(JSON.stringify(Object.fromEntries(Object.entries(streams).filter(([k])=>k!=='dec').map(([k,v])=>[k,{a:v.a,sp:v.sp}])))===independent,'shuffle consumed a different stream');
 for(let n=2;n<40;n++){const a=new RNG('draws/'+n,'gen'),b=new RNG('draws/'+n,'gen');a.shuffle(Array.from({length:n},(_,i)=>i));for(let i=0;i<n-1;i++)b.next();check(a.a===b.a&&a.sp===b.sp,'draw count '+n)}
 return {vectors,permutations:permutations.size,cases:`+SEEDED_SHUFFLE_FIXTURE+String.raw`};
})()`,{filename:'seeded-shuffle.vm.js'});
assert.deepEqual(JSON.parse(JSON.stringify(result.vectors)),golden,'existing RNG algorithms and independent streams changed');
for(const file of ['player.js','contracts.js','patch-content.js','competition.js','contract-transfer-market.js']){const source=await readFile(new URL('../src/artifact/'+file,import.meta.url),'utf8');assert(!/\.sort\(\(\)\s*=>\s*rng\.next/.test(source),'random comparator returned in '+file)}
console.log('SEEDED_SHUFFLE_ACCEPTANCE '+JSON.stringify({permutations:result.permutations,streamsUnchanged:6,cases:result.cases.map(r=>({seed:r.seed,players:r.result.generated.length,runes:r.result.runes.length,contracts:r.result.report.signings.length,sha256:createHash('sha256').update(JSON.stringify(r.result)).digest('hex')}))}));
