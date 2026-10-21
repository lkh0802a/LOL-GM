// Reads persisted recovery candidates without changing the active world.
async function saveRecoveryRaw(row){return row.backend==='local'?localStorage.getItem(row.key):idbGet(row.key)}
async function readSaveRecovery(key){
  const sources=[{backend:'local',key,label:'저장 원본'},{backend:'local',key:key+'-checkpoint',label:'이전 보관 원본'},{backend:'local',key:key+'-restore',label:'보호 보관 원본',protected:true}];
  if(!DIRECT_FILE_PREVIEW&&typeof indexedDB!=='undefined')sources.push({backend:'idb',key,label:'저장 원본'},{backend:'idb',key:key+'-checkpoint',label:'이전 보관 원본'},{backend:'idb',key:key+'-damaged',label:'읽지 못한 보관 원본'},{backend:'idb',key:key+'-restore',label:'보호 보관 원본',protected:true});
  const values=await Promise.all(sources.map(async row=>{try{return {...row,raw:await saveRecoveryRaw(row)}}catch(e){return {...row,error:true}}}));
  const rows=[],seen=new Map();let errors=0;
  for(const row of values){
    if(row.error){errors++;continue}if(row.raw===null||row.raw===undefined)continue;if(seen.has(row.raw)){if(row.protected)seen.get(row.raw).protected=true;continue}
    let entry;try{const db=unpackDB(row.raw);entry={...row,valid:true,summary:savedGameSummary(db)}}catch(e){entry={...row,valid:false,summary:null}}seen.set(row.raw,entry);rows.push(entry);
  }
  return {rows,errors};
}
function exportSaveRecovery(row){
  const raw=typeof row.raw==='string'?row.raw:JSON.stringify(row.raw),url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),link=document.createElement('a');
  try{link.href=url;link.download='LOL-GM-복구-'+Date.now()+'.json';link.click()}finally{URL.revokeObjectURL(url)}
}
