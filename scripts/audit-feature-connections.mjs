// 파일 존재·정적 연결 후보 조사. 동적 호출/실제 수용을 대신하는 완료 판정기가 아니다.
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {ENGINE_MODULES,UI_MODULES} from './artifact-modules.mjs';
const root=new URL('../',import.meta.url),read=p=>readFile(new URL(p,root),'utf8');
const engine=await Promise.all(ENGINE_MODULES.map(async name=>({path:'src/artifact/'+name,text:await read('src/artifact/'+name)})));
const uiNames=(await readdir(new URL('src/ui-v2/',root))).filter(x=>x.endsWith('.js')).sort();
const ui=await Promise.all(uiNames.map(async name=>({path:'src/ui-v2/'+name,text:await read('src/ui-v2/'+name)})));
const tests=await Promise.all((await readdir(new URL('scripts/',root))).filter(x=>x.endsWith('.mjs')).map(async name=>({path:'scripts/'+name,text:await read('scripts/'+name)})));
const count=(s,n)=>(s.match(new RegExp('\\b'+n+'\\b','g'))||[]).length;
const rows=engine.map(file=>{const declarations=[...file.text.matchAll(/(?:^|\n)(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(x=>x[1]);return {path:file.path,sha256:createHash('sha256').update(file.text).digest('hex'),declarations:declarations.map(name=>({name,newUiReferences:ui.filter(x=>count(x.text,name)).map(x=>x.path),engineReferences:engine.filter(x=>x!==file&&count(x.text,name)).map(x=>x.path),scriptReferences:tests.filter(x=>x.path!=='scripts/audit-feature-connections.mjs'&&count(x.text,name)).map(x=>x.path)}))};});
const domain=await readdir(new URL('src/domain/',root)).catch(e=>{if(e.code==='ENOENT')return [];throw e;});
const build=await read('scripts/build-ui-v2.mjs');
const report={schema:1,limitations:['문자열 참조는 실행 도달성을 증명하지 않는다','선언 목록에 없는 화살표·객체 함수와 동적 호출은 별도 확인한다','새 화면 직접 참조가 없어도 엔진의 소비 경로 또는 의도한 비공개 경로일 수 있다','기존 화면은 전면 재구축 결정에 따라 새 조립에서 제외하며 삭제 기능으로 세지 않는다'],engineFiles:rows.length,newUiFiles:ui.map(x=>({path:x.path,inBuild:build.includes("'"+x.path.split('/').at(-1)+"'")})),legacyUiFiles:UI_MODULES?.length??null,domainCandidates:domain.map(name=>({path:'src/domain/'+name,inBuild:build.includes(name),status:'실제 조립·작성자/소비자 수용 별도 확인'})),rows};
const json=JSON.stringify(report,null,2)+'\n';if(process.argv[2])await writeFile(process.argv[2],json);else console.log(json);
console.error(JSON.stringify({engineFiles:rows.length,functions:rows.reduce((n,x)=>n+x.declarations.length,0),directUiFunctions:rows.reduce((n,x)=>n+x.declarations.filter(d=>d.newUiReferences.length).length,0),unbuiltDomain:report.domainCandidates.filter(x=>!x.inBuild).map(x=>x.path),unbuiltUi:report.newUiFiles.filter(x=>!x.inBuild).map(x=>x.path)}));
