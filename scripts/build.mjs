import {mkdir,writeFile,rename,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {buildUiV2} from './build-ui-v2.mjs';
const root=new URL('../',import.meta.url),html=await buildUiV2();
await mkdir(new URL('dist/',root),{recursive:true});
for(const name of ['index.html','dist/index.html']){
 const target=new URL(name,root),temp=new URL(name+'.'+process.pid+'.'+randomUUID()+'.tmp',root);
 try{await writeFile(temp,html);await rename(temp,target)}finally{await unlink(temp).catch(error=>{if(error.code!=='ENOENT')throw error})}
}
console.log('Built current engine + new UI -> index.html and dist/index.html');
