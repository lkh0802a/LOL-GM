// Deterministic tournament matching helpers; no separate competition engine.
function dePair(sd,entrants){
  const teams=seedSort(sd,entrants);
  if(new Set(teams).size!==teams.length)throw Error('Duplicate bracket entrants');
  let size=1;while(size<teams.length)size*=2;
  const byes=teams.slice(0,size-teams.length),pairs=hiLo(teams.slice(byes.length));
  if(pairs.some(([a,b])=>!a||!b||a===b))throw Error('Invalid double-elimination pairing');
  return {byes,pairs};
}

function swissPairings(sd,teams){
  const rank=t=>sd.teams.indexOf(t),rec=t=>sd.rec[t];
  const entrants=teams.slice().sort((a,b)=>(rec(b).w-rec(b).l)-(rec(a).w-rec(a).l)||rank(a)-rank(b));
  if(entrants.length%2)throw Error('Swiss pairing requires an even number of teams');
  const cost=(a,b)=>(rec(a).opp.includes(b)||rec(b).opp.includes(a)?10000:0)+
    250*(Math.abs(rec(a).w-rec(b).w)+Math.abs(rec(a).l-rec(b).l))+
    Math.abs(rank(a)-rank(b));
  if(entrants.length<=14){
    const memo=new Map();
    const solve=mask=>{
      if(!mask)return {cost:0,pairs:[]};
      if(memo.has(mask))return memo.get(mask);
      let i=0;while(!(mask&(1<<i)))i++;
      let best=null;
      for(let j=i+1;j<entrants.length;j++)if(mask&(1<<j)){
        const sub=solve(mask^(1<<i)^(1<<j)),value=cost(entrants[i],entrants[j])+sub.cost;
        if(!best||value<best.cost)best={cost:value,pairs:[[entrants[i],entrants[j]],...sub.pairs]};
      }
      memo.set(mask,best);return best;
    };
    return solve((1<<entrants.length)-1).pairs;
  }
  const pairs=[];
  while(entrants.length){
    const a=entrants.shift();entrants.sort((b,c)=>cost(a,b)-cost(a,c)||rank(b)-rank(c));
    pairs.push([a,entrants.shift()]);
  }
  for(let k=0;k<3;k++){
    let changed=false;
    for(let i=0;i<pairs.length;i++)for(let j=i+1;j<pairs.length;j++){
      const [a,b]=pairs[i],[c,d]=pairs[j],initial=cost(a,b)+cost(c,d);
      for(const swap of [[[a,c],[b,d]],[[a,d],[b,c]]]){
        if(cost(...swap[0])+cost(...swap[1])<initial){
          pairs[i]=swap[0];pairs[j]=swap[1];changed=true;break;
        }
      }
    }
    if(!changed)break;
  }
  return pairs;
}

