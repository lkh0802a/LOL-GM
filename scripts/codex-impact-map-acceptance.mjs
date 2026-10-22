import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {impactMap,formatMap} from './codex-impact-map.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const realCases=[
 ['src/artifact/series.js','scripts/scrim-single-result-acceptance.mjs','simulateSeries'],
 ['src/artifact/contracts.js','scripts/market-reserve-acceptance.mjs','contractMarket'],
 ['src/artifact/season.js','scripts/season-progress-acceptance.mjs','playWorldDay'],
 ['src/artifact/ui-player.js','scripts/observer-player-profile-acceptance.mjs','playerDetail']
];
for(const [file,test,symbol] of realCases){const r=await impactMap({cwd:root,base:'HEAD',files:[file],cache:false});const row=r.rows[0];assert.equal(row.kind,file.includes('/ui-')?'ui':'engine');
 assert(row.tests.some(t=>t.path===test&&t.evidence.some(h=>h.symbol===symbol)),file+' real acceptance evidence');
 assert(row.references.length>0);assert(row.references.every(r=>r.certainty==='lexical-candidate'));
 assert.match(formatMap(r),/완전한 호출 그래프가 아닙니다/);
}
const dir=await mkdtemp(join(tmpdir(),'lol-gm-codemap-test-'));
const git=(...args)=>execFileSync('git',args,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const put=async(p,s)=>{await mkdir(join(dir,p,'..'),{recursive:true});await writeFile(join(dir,p),s);};
try{
 git('init','-b','main');git('config','user.email','fixture@example.invalid');git('config','user.name','fixture');
 await put('scripts/artifact-modules.mjs',"export const ENGINE_MODULES=['engine.js']; export const UI_MODULES=['ui.js'];");
 await put('src/artifact/engine.js','function act(db){db.world.date=1}');
 await put('src/artifact/ui.js','function draw(){act(DB)}');
 await put('scripts/probe-acceptance.mjs','// act in a comment is only a candidate\nconst text="act(db)";');
 await put('scripts/probe-runner.mjs',"import './probe-acceptance.mjs';");
 await put('package.json',JSON.stringify({scripts:{check:'node scripts/probe-runner.mjs'}}));
 await put('unrelated.txt','indirect runtime reference not statically known');
 git('add','.');git('commit','-m','base');const base=git('rev-parse','HEAD');
 let r=await impactMap({cwd:dir,base,files:['src/artifact/engine.js']});assert(!r.cacheHit);assert.equal(r.rows[0].references[0].path,'src/artifact/ui.js');
 let t=r.rows[0].tests[0];assert.equal(t.path,'scripts/probe-acceptance.mjs');assert.equal(t.certainty,'lexical-candidate');assert.deepEqual(t.commands,['check']);assert(!t.harness);
 r=await impactMap({cwd:dir,base,files:['src/artifact/engine.js']});assert(r.cacheHit);
 // Preserve timestamps/length: content hashes, not mtime, must invalidate.
 await put('src/artifact/ui.js','function draw(){act(XX)}');
 r=await impactMap({cwd:dir,base,files:['src/artifact/engine.js']});assert(!r.cacheHit);
 await put('scripts/probe-runner.mjs','// no longer loads the acceptance');
 r=await impactMap({cwd:dir,base,files:['src/artifact/engine.js']});assert(!r.cacheHit);assert.deepEqual(r.rows[0].tests[0].commands,[]);
 git('mv','src/artifact/engine.js','src/artifact/moved engine.js');
 await put('src/artifact/ui.js','function draw(){act(DB)} // dirty');
 await put('scripts/new-acceptance.mjs','act(db)');await rm(join(dir,'unrelated.txt'));
 r=await impactMap({cwd:dir,base,changed:true});
 assert(r.changes.some(c=>c.path==='src/artifact/moved engine.js'&&c.oldPaths.includes('src/artifact/engine.js')&&c.phases.includes('staged')));
 assert(r.changes.some(c=>c.path==='src/artifact/ui.js'&&c.phases.includes('unstaged')));
 assert(r.changes.some(c=>c.path==='scripts/new-acceptance.mjs'&&c.phases.includes('untracked')));
 assert(r.changes.some(c=>c.path==='unrelated.txt'&&c.statuses.includes('D')));
 assert(r.rows.find(c=>c.path==='src/artifact/moved engine.js').tests.some(t=>t.path==='scripts/new-acceptance.mjs'));
 git('add','.');git('commit','-m','rename and dirty');
 r=await impactMap({cwd:dir,base,changed:true});assert(r.changes.every(c=>c.phases.includes('committed')));
 const oldHead=r.head;git('checkout','-b','next');r=await impactMap({cwd:dir,base,changed:true});assert(!r.cacheHit);assert.equal(r.head,oldHead);assert.equal(r.branch,'next');
 git('checkout','--detach');r=await impactMap({cwd:dir,base,changed:true});assert.equal(r.branch,'(detached)');assert(!r.cacheHit);
 r=await impactMap({cwd:dir,base,files:['unrelated.txt']});assert.equal(r.rows[0].tests.length,0);assert.match(r.rows[0].unknown,/근거 없음/);
 await assert.rejects(impactMap({cwd:dir,base:'missing-base',changed:true}));
 await assert.rejects(impactMap({cwd:dir,base,files:['../outside.js']}),/저장소 밖/);
 await symlink('/etc/passwd',join(dir,'outside.js'));await assert.rejects(impactMap({cwd:dir,base,files:['outside.js']}),/외부 symlink/);await rm(join(dir,'outside.js'));
 await put('scripts/artifact-modules.mjs',"export const ENGINE_MODULES=makeModules(); export const UI_MODULES=[];");await assert.rejects(impactMap({cwd:dir,base,changed:true}),/manifest/);
 const proc=(()=>{try{execFileSync(process.execPath,[join(root,'scripts/codex-impact-map.mjs'),'--bad'],{cwd:dir,stdio:'pipe'});return null}catch(e){return e}})();assert.equal(proc.status,1);assert.match(proc.stderr.toString(),/대체: git status/);
}finally{await rm(dir,{recursive:true,force:true});}
console.log('CODEX_IMPACT_MAP_ACCEPTANCE '+JSON.stringify({realDomains:4,gitChangePhases:true,renameDelete:true,branchDetached:true,contentInvalidation:true,runnerInvalidation:true,uncertainReferences:true,safeFailures:true}));
