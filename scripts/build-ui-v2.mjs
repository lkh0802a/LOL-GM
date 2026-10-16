import {readFile,writeFile,mkdir,rename,unlink} from 'node:fs/promises';
import {ENGINE_MODULES} from './artifact-modules.mjs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
const root=new URL('../',import.meta.url),get=p=>readFile(new URL(p,root),'utf8');
const ui=['state.js','market.js','contracts.js','views.js','management.js','champion-art.js','official.js','dialog.js','app.js'];
export async function buildUiV2(){
const [shell,style,engine,modules]=await Promise.all([get('src/ui-v2/shell.html'),get('src/ui-v2/style.css'),Promise.all(ENGINE_MODULES.map(p=>get('src/artifact/'+p))),Promise.all(ui.map(p=>get('src/ui-v2/'+p)))]);
for(const marker of ['/*STYLE*/','/*ENGINE*/','/*UI*/'])if(shell.split(marker).length!==2)throw Error('한 개의 조립 위치 필요: '+marker);
const html=shell.replace('/*STYLE*/',style).replace('/*ENGINE*/',engine.join('\n')).replace('/*UI*/',modules.join('\n'));
await mkdir(new URL('dist/',root),{recursive:true});
for(const name of ['ui-v2.html','dist/ui-v2.html']){const target=new URL(name,root),temp=new URL(name+'.'+process.pid+'.'+randomUUID()+'.tmp',root);try{await writeFile(temp,html);await rename(temp,target);}finally{await unlink(temp).catch(error=>{if(error.code!=='ENOENT')throw error;});}}
console.log(`새 화면 조립: 기존 엔진 ${ENGINE_MODULES.length}개 · 새 화면 ${ui.length}개 · 기존 UI 0개`);
return html;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildUiV2();
