// Local exploration hints for the assembled global JS engine. Never executes it.
import {execFileSync} from 'node:child_process';
import {readFile,realpath,lstat,mkdir,writeFile,rename} from 'node:fs/promises';
import {resolve,relative,basename,sep,join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const sha=s=>createHash('sha256').update(s).digest('hex');
const git=(root,...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:32*1024*1024}).trimEnd();
const nul=s=>s.split('\0').filter(Boolean);
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function names(text){
 const definitions=[...text.matchAll(/\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|\bclass\s+([A-Za-z_$][\w$]*)\b|\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^;{}]*\)|[\w$]+)\s*=>/g)].map(m=>m[1]||m[2]||m[3]);
 const stateKeys=[...text.matchAll(/\b(?:db|DB)\.((?:world|manager|players|teams|patch)(?:\.[A-Za-z_$][\w$]*)+)/g)].map(m=>m[1]);
 return {definitions:[...new Set(definitions)].sort(),stateKeys:[...new Set(stateKeys)].sort()};
}
function manifestList(text,name){
 const match=new RegExp('export\\s+const\\s+'+name+'\\s*=\\s*\\[([\\s\\S]*?)\\]').exec(text);
 if(!match)throw Error('manifest '+name+' 목록을 읽을 수 없습니다. Git/rg로 확인하세요.');
 const body=match[1].replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,'');
 if(body.replace(/'[^']*'|"[^"]*"|[\s,]/g,''))throw Error('동적 manifest는 미지원입니다. Git/rg로 확인하세요.');
 return [...body.matchAll(/['"]([^'"]+)['"]/g)].map(m=>'src/artifact/'+m[1]);
}
function parseDiff(raw,phase,add){
 const parts=nul(raw);
 for(let i=0;i<parts.length;){const status=parts[i++],oldPath=parts[i++];
  if(!oldPath)throw Error('Git 변경 목록 형식 오류');
  if(/^[RC]/.test(status)){const path=parts[i++];if(!path)throw Error('Git rename 경로 누락');add(path,phase,status,oldPath)}
  else add(oldPath,phase,status);
 }
}
export async function impactMap({cwd=process.cwd(),base='origin/main',files=[],changed=files.length===0,cache=true}={}){
 const began=performance.now(),root=git(cwd,'rev-parse','--show-toplevel'),head=git(root,'rev-parse','HEAD');
 const baseSha=git(root,'rev-parse','--verify',base+'^{commit}'),mergeBase=git(root,'merge-base',head,baseSha);
 let branch;try{branch=git(root,'symbolic-ref','--quiet','--short','HEAD')}catch(e){if(e.status!==1)throw e;branch='(detached)';}
 const changes=new Map();
 const add=(path,phase,status,oldPath)=>{const r=changes.get(path)||{path,phases:[],statuses:[],oldPaths:[]};r.phases.push(phase);r.statuses.push(status);if(oldPath)r.oldPaths.push(oldPath);changes.set(path,r)};
 parseDiff(git(root,'diff','--name-status','-z','--find-renames',mergeBase,head),'committed',add);
 parseDiff(git(root,'diff','--cached','--name-status','-z','--find-renames'),'staged',add);
 parseDiff(git(root,'diff','--name-status','-z','--find-renames'),'unstaged',add);
 for(const p of nul(git(root,'ls-files','--others','--exclude-standard','-z')))add(p,'untracked','?');
 const safePath=async p=>{const absolute=resolve(root,p),rel=relative(root,absolute);if(!rel||rel.startsWith('..'+sep)||rel==='..'||resolve(absolute)===root)throw Error('저장소 밖 경로는 허용하지 않습니다: '+p);
  try{const real=await realpath(absolute);if(relative(root,real).startsWith('..'+sep)||relative(root,real)==='..')throw Error('외부 symlink는 읽지 않습니다: '+p)}catch(e){if(e.code!=='ENOENT')throw e}
  return rel.split(sep).join('/');};
 const selected=new Set(changed?[...changes.keys()]:[]);for(const f of files)selected.add(await safePath(f));
 const tracked=[...new Set(nul(git(root,'ls-files','-c','-o','--exclude-standard','-z')))];
 const candidates=tracked.filter(p=>/^(src\/artifact\/.*\.js|scripts\/.*\.mjs|package\.json)$/.test(p)).sort();
 const contents=new Map(),hashes={};
 for(const p of [...new Set([...candidates,...selected])].sort()){
  await safePath(p);
  try{if(!(await lstat(resolve(root,p))).isFile()){hashes[p]='nonregular';continue}const b=await readFile(resolve(root,p));hashes[p]=sha(b);if(!b.includes(0))contents.set(p,b.toString('utf8'));}
  catch(e){if(e.code!=='ENOENT')throw e;hashes[p]='missing';}
 }
 const manifest=contents.get('scripts/artifact-modules.mjs');if(!manifest)throw Error('artifact manifest가 없습니다');
 const engines=manifestList(manifest,'ENGINE_MODULES'),uis=manifestList(manifest,'UI_MODULES');
 const version=sha(await readFile(new URL(import.meta.url)));
 const key=sha(JSON.stringify({version,root,head,branch,baseSha,mergeBase,selected:[...selected].sort(),changes:[...changes.values()],hashes}));
 const cacheDir=join(tmpdir(),'lol-gm-impact-map-'+(process.getuid?.()??'user')),cachePath=join(cacheDir,sha(root)+'.json');
 if(cache){await mkdir(cacheDir,{recursive:true,mode:0o700});const st=await lstat(cacheDir);if(!st.isDirectory()||st.isSymbolicLink()||(process.getuid&&st.uid!==process.getuid())||(st.mode&0o077))throw Error('임시 캐시 디렉터리 소유권/권한 불일치; --no-cache 사용');}
 if(cache)try{const st=await lstat(cachePath);if(st.isFile()&&!st.isSymbolicLink()){const saved=JSON.parse(await readFile(cachePath,'utf8'));if(saved.key===key)return {...saved.result,cacheHit:true,elapsedMs:performance.now()-began};}}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}
 const pkg=JSON.parse(contents.get('package.json')||'{}'),rows=[];
 for(const path of [...selected].sort()){
  const change=changes.get(path),oldPath=change?.oldPaths[0]||path;
  let old='';try{old=git(root,'show',mergeBase+':'+oldPath)}catch{/* New files have no base content. */}
  const current=contents.get(path);
  if(current===undefined&&!change)throw Error('파일을 읽을 수 없습니다: '+path);
  const symbols=names((current||'')+'\n'+old),tokens=[...symbols.definitions,...symbols.stateKeys];
  const references=[],tests=[];
  const pattern=tokens.length?new RegExp('(?<![\\w$])('+tokens.map(escape).join('|')+')(?![\\w$])','g'):null;
  for(const [other,text] of contents){
   if(other===path||!pattern)continue;
   const hits=[];let line=1,last=0;
   for(const m of text.matchAll(pattern)){line+=text.slice(last,m.index).split('\n').length-1;last=m.index;hits.push({symbol:m[0],line});}
   if(!hits.length)continue;
   const unique=[...new Map(hits.map(h=>[h.symbol+':'+h.line,{...h,kind:symbols.definitions.includes(h.symbol)?'declaration-reference':'state-key-reference'}])).values()].sort((a,b)=>(a.kind==='state-key-reference')-(b.kind==='state-key-reference')||a.line-b.line);
   const evidence={path:other,certainty:'lexical-candidate',evidence:unique};
   if(/^scripts\/.*(?:acceptance|\.test)\.mjs$/.test(other)){
    const loaders=candidates.filter(p=>p.startsWith('scripts/')&&p!==other&&(contents.get(p)||'').includes(basename(other)));
    const commands=Object.entries(pkg.scripts||{}).filter(([,v])=>v.includes(other)||loaders.some(p=>v.includes(p))).map(([k])=>k);
    tests.push({...evidence,harness:/runEngineFixture|artifactSources|node:test|vm\./.test(text),loaders,commands});
   }else if(other.startsWith('src/artifact/'))references.push(evidence);
  }
  const kind=engines.includes(path)?'engine':uis.includes(path)?'ui':path.startsWith('scripts/')?'script':'other';
  rows.push({path,kind,change:change||null,symbols,references,tests:tests.sort((a,b)=>b.evidence.length-a.evidence.length||a.path.localeCompare(b.path)),unknown:tokens.length?'문자열·주석을 포함한 어휘 참조 후보. 실제 호출·읽기/쓰기·동적/간접 영향은 미확정.':'정의·상태 키 근거 없음; Git/rg로 직접 확인 필요'});
 }
 const result={root,head,branch,base:baseSha,mergeBase,changes:[...changes.values()],rows,scannedFiles:contents.size,cacheHit:false,warning:'탐색 후보이며 테스트 PASS·영향 없음·완전한 호출 그래프가 아닙니다. 함수 내 변경뿐 아니라 선택 파일의 모든 선언을 검색합니다.'};
 if(cache){await mkdir(cacheDir,{recursive:true,mode:0o700});const tmp=cachePath+'.'+randomUUID();await writeFile(tmp,JSON.stringify({key,result}),{mode:0o600,flag:'wx'});await rename(tmp,cachePath);}
 return {...result,elapsedMs:performance.now()-began};
}
export function formatMap(r){
 const lines=[`HEAD ${r.head} / ${r.branch} / base ${r.base}`,`탐색 ${r.scannedFiles}파일 / ${r.elapsedMs.toFixed(1)}ms / 재사용 ${r.cacheHit}`,r.warning];
 for(const row of r.rows){lines.push(`${row.kind} ${row.path} [${row.change?.phases.join(',')||'selected'}]`, `  선언 ${row.symbols.definitions.length} / 상태 키 ${row.symbols.stateKeys.length} / 직접 참조 후보 ${row.references.length} / 테스트 후보 ${row.tests.length}`);
  for(const t of row.tests.slice(0,3))lines.push(`  후보 ${t.path}:${t.evidence[0].line} (${t.evidence[0].symbol}; ${t.commands.join(',')||'명령 연결 미확인'})`);
  if(row.tests.length>3)lines.push(`  나머지 ${row.tests.length-3}개: --json에서 전체 근거 확인`);if(!row.tests.length)lines.push('  관련 테스트 미확인');
 }
 return lines.join('\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const options={files:[]};let json=false;for(let i=2;i<process.argv.length;i++){const a=process.argv[i];if(a==='--changed')options.changed=true;else if(a==='--json')json=true;else if(a==='--no-cache')options.cache=false;else if(a==='--file'||a==='--base'){const value=process.argv[++i];if(!value||value.startsWith('--'))throw Error(a+' 값이 필요합니다');if(a==='--file')options.files.push(value);else options.base=value;}else throw Error('알 수 없는 인자: '+a);}
  const result=await impactMap(options);console.log(json?JSON.stringify(result,null,2):formatMap(result));
 }catch(e){console.error('코드 맵 실패: '+e.message+'\n대체: git status --short; git diff --name-status; rg -n <확인한식별자> src/artifact scripts');process.exitCode=1;}
}
