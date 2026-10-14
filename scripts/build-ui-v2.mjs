import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {ENGINE_MODULES} from './artifact-modules.mjs';
const root=new URL('../',import.meta.url),get=p=>readFile(new URL(p,root),'utf8');
const ui=['state.js','market.js','contracts.js','views.js','app.js'];
const [shell,style,engine,modules]=await Promise.all([get('src/ui-v2/shell.html'),get('src/ui-v2/style.css'),Promise.all(ENGINE_MODULES.map(p=>get('src/artifact/'+p))),Promise.all(ui.map(p=>get('src/ui-v2/'+p)))]);
for(const marker of ['/*STYLE*/','/*ENGINE*/','/*UI*/'])if(shell.split(marker).length!==2)throw Error('한 개의 조립 위치 필요: '+marker);
const html=shell.replace('/*STYLE*/',style).replace('/*ENGINE*/',engine.join('\n')).replace('/*UI*/',modules.join('\n'));
await writeFile(new URL('ui-v2.html',root),html);await mkdir(new URL('dist/',root),{recursive:true});await writeFile(new URL('dist/ui-v2.html',root),html);
console.log(`새 화면 조립: 기존 엔진 ${ENGINE_MODULES.length}개 · 새 화면 ${ui.length}개 · 기존 UI 0개`);
