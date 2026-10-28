import {createHash} from 'node:crypto';
// Preserve the existing smoke projection: saveId is storage identity and must
// not seed gameplay. Keep every other ID, clock, contract, result and value.
export const canonical=value=>JSON.stringify(value,(key,item)=>key==='saveId'?undefined:item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.keys(item).sort().map(k=>[k,item[k]])):item);
export function fingerprint(value){
 const digest=createHash('sha256'),active=new Set();let buffer='';const emit=s=>{buffer+=s;if(buffer.length>=32768){digest.update(buffer);buffer='';}};
 const normalize=(item,key)=>{if(item&&typeof item==='object'&&typeof item.toJSON==='function')item=item.toJSON(key);return key==='saveId'||item===undefined||typeof item==='function'||typeof item==='symbol'?undefined:item;};
 function write(item,key,arrayItem=false,prepared=false){
  if(!prepared)item=normalize(item,key);
  if(item===undefined){if(arrayItem)emit('null');return false;}
  if(!item||typeof item!=='object'){emit(JSON.stringify(item));return true;}
  if(active.has(item))throw Error('Circular causal state');active.add(item);
  if(Array.isArray(item)){emit('[');for(let i=0;i<item.length;i++){if(i)emit(',');write(item[i],String(i),true);}emit(']');}
  else{const ordered=Object.fromEntries(Object.keys(item).sort().map(k=>[k,item[k]])),entries=Object.keys(ordered).map(k=>[k,ordered[k]]);emit('{');let first=true;for(const [k,v] of entries){const next=normalize(v,k);if(next===undefined)continue;if(!first)emit(',');emit(JSON.stringify(k)+':');write(next,k,false,true);first=false;}emit('}');}
  active.delete(item);return true;
 }
 if(!write(value,''))throw Error('Undefined causal root');if(buffer)digest.update(buffer);return digest.digest('hex');
}
