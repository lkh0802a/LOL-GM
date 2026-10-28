import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export const REQUIRED_CHECKS=['changes','static-fast','ui-v2 / ui-v2','ui-finance-contracts','calendar-scouting','medical','regression','smoke (core)','smoke (patch-system)','career','daily-career-smoke','perf-build','verify','focused','regression-smoke-career'];
const sha=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);
const hash=x=>createHash('sha256').update(x).digest('hex');
export function assessMerge(snapshot,{now=Date.now()}={}){
 const reasons=[],block=x=>reasons.push(x),{repository,pr,main,checks,runs,files,local,lease,reviews,threads,testedMerge}=snapshot;
 if(!Number.isFinite(Date.parse(snapshot.observedAt))||now-Date.parse(snapshot.observedAt)>120000||Date.parse(snapshot.observedAt)>now+5000)block('STALE_OR_INVALID_OBSERVATION');
 if(repository?.full_name!=='lkh0802a/LOL-GM'||repository?.default_branch!=='main'||repository?.archived||repository?.disabled||repository?.permissions?.push!==true||repository?.allow_merge_commit!==true)block('REPOSITORY_OR_WRITE_CAPABILITY_UNCONFIRMED');
 if(pr?.state!=='open'||pr?.draft!==false||pr?.merged!==false||pr?.base?.ref!=='main'||pr?.base?.repo?.full_name!==repository?.full_name||pr?.head?.repo?.full_name!==repository?.full_name||!Number.isInteger(pr?.number)||!sha(pr?.head?.sha)||!sha(main?.commit?.sha)||pr?.base?.sha!==main?.commit?.sha||pr?.mergeable!==true||pr?.mergeable_state!=='clean')block('PR_HEAD_BASE_OR_MERGE_STATE_NOT_READY');
 if(!Array.isArray(files)||!files.length||files.length!==pr?.changed_files)block('INCOMPLETE_CHANGED_FILES');
 let enhanced=false;
 for(const f of files||[]){
  if(!['added','modified'].includes(f.status)||!f.filename||f.filename.startsWith('/')||f.filename.split('/').includes('..'))block('DELETION_RENAME_OR_UNKNOWN_PATH');
  if(/^src\/artifact\//.test(f.filename||''))enhanced=true;
  if(f.status==='modified'&&/^scripts\/.*(?:-acceptance|\.test)\.mjs$/.test(f.filename||''))block('EXISTING_TEST_CHANGE_REQUIRES_INDEPENDENT_INTEGRITY_REVIEW');
  // Source-engine paths require stronger evidence, never human approval merely
  // because they contain engines. Authority/security/deployment is separate.
  if(!/^(src\/(artifact|ui-v2)\/|scripts\/.*(?:-acceptance|\.test)\.mjs$|docs\/.*\.md$|README\.md$|CHANGELOG\.md$)/.test(f.filename||'')||/^(\.github\/|AGENTS\.md$|package(?:-lock)?\.json$|scripts\/codex-|docs\/(DECISIONS|LOL_GM_SPEC|CODEX_AUTOMATION_5H|CODEX_MASTER_BLUEPRINT)\.md$)/.test(f.filename||''))block('EXPLICIT_AUTHORITY_SECURITY_OR_DEPLOYMENT_SCOPE_REQUIRED');
 }
 if(!Array.isArray(checks)||!Array.isArray(runs)||snapshot.ciComplete!==true)block('MISSING_CI_EVIDENCE');
 for(const c of checks||[])if(!REQUIRED_CHECKS.includes(c.name)&&!(['standalone-sync','smoke-parity'].includes(c.name)&&c.status==='completed'&&['success','skipped'].includes(c.conclusion)))block('UNRECOGNIZED_OR_UNSUCCESSFUL_CHECK');
 for(const name of REQUIRED_CHECKS){
  const matches=(checks||[]).filter(c=>c.name===name).sort((a,b)=>b.id-a.id),check=matches[0],match=check?.details_url?.match(/^https:\/\/github\.com\/lkh0802a\/LOL-GM\/actions\/runs\/(\d+)\/job\/\d+$/),run=match&&(runs||[]).find(r=>String(r.id)===match[1]);
  if(!check||check.app?.slug!=='github-actions'||check.head_sha!==pr?.head?.sha||check.status!=='completed'||check.conclusion!=='success'||!run||run.head_sha!==pr?.head?.sha||run.status!=='completed'||run.conclusion!=='success'||run.event!=='pull_request'||run.repository?.full_name!==repository?.full_name||!['.github/workflows/ci.yml','.github/workflows/training-cleanup.yml'].includes(run.path))block('CI_NOT_SUCCESSFUL_OR_TRUSTED:'+name);
 }
 if(!testedMerge||testedMerge.sha!==pr?.merge_commit_sha||testedMerge.parents?.length!==2||testedMerge.parents[0]?.sha!==main?.commit?.sha||testedMerge.parents[1]?.sha!==pr?.head?.sha)block('TEST_MERGE_DOES_NOT_BIND_CURRENT_BASE_AND_HEAD');
 if(!Array.isArray(reviews)||!Array.isArray(threads))block('REVIEW_STATE_UNCONFIRMED');
 const latest=new Map();for(const r of reviews||[])if(r.user?.login&&r.state!=='COMMENTED'&&(!latest.has(r.user.login)||latest.get(r.user.login).id<r.id))latest.set(r.user.login,r);
 if([...latest.values()].some(r=>r.state==='CHANGES_REQUESTED')||(threads||[]).some(t=>t.isResolved!==true))block('UNRESOLVED_REVIEW');
 if(!local||local.head!==pr?.head?.sha||local.clean!==true||local.fixedSources!==true||local.sourceBindingVerified!==true||!['focus','adjacent','build','check','ui','medical','core'].every(k=>local.tests?.[k]==='PASS'))block('LOCAL_ACCEPTANCE_NOT_BOUND_TO_HEAD');
 if(enhanced&&(!local?.enhanced||local.enhanced.head!==pr?.head?.sha||local.enhanced.status!=='PASS'||local.enhanced.deterministic!==true||!Array.isArray(local.enhanced.seeds)||new Set(local.enhanced.seeds).size<2||local.enhanced.sourceCommit!==pr?.head?.sha))block('ENHANCED_ENGINE_ACCEPTANCE_REQUIRED');
 if(!lease||lease.runId!==snapshot.runId||!lease.runId||lease.repository!=='lkh0802a/LOL-GM'||lease.queue!=='READY'||lease.owned!==true)block('EXCLUSIVE_EXECUTION_UNCONFIRMED');
 const unique=[...new Set(reasons)];return {schemaVersion:1,state:unique.length?'BLOCKED':'READY_FOR_FRESH_RECHECK',automaticMergeAllowed:false,enhanced,reasons:unique,head:pr?.head?.sha,base:main?.commit?.sha,pr:pr?.number,snapshotSha256:hash(JSON.stringify(snapshot)),limits:['A snapshot is not a merge authorization. Recollect remote facts and local lease immediately before applying a HEAD-conditional GitHub merge. Never self-enable from a PR label or this report. GitHub REST has no expected-base compare-and-swap; a concurrently advanced main requires integration revalidation.']};
}
export function prepareMerge(first,fresh,options){
 const a=assessMerge(first,options),b=assessMerge(fresh,options);
 if(a.reasons.length||b.reasons.length||a.head!==b.head||a.base!==b.base||a.pr!==b.pr||first.runId!==fresh.runId)throw Error('Merge refused: missing acceptance, changed HEAD/base or ownership');
 return {repository_full_name:'lkh0802a/LOL-GM',pr_number:b.pr,expected_head_sha:b.head,merge_method:'merge',expectedBase:b.base,snapshotSha256:b.snapshotSha256};
}
export function verifyMergeResult(plan,result,commit){
 if(result?.merged!==true)return {state:'MERGE_REJECTED',deployAllowed:false};
 if(!sha(result.sha)||commit?.sha!==result.sha||commit.parents?.length!==2||commit.parents[0]?.sha!==plan.expectedBase||commit.parents[1]?.sha!==plan.expected_head_sha)return {state:'INTEGRATION_REVALIDATION_REQUIRED',deployAllowed:false};
 return {state:'MERGED_AWAITING_MAIN_VALIDATION',head:result.sha,deployAllowed:false};
}
export async function executeMerge({snapshot,refresh,merge,readCommit,record,now=Date.now}){
 // The trusted coordinator supplies authenticated adapters. This module never
 // reads tokens, changes protections, force-pushes, retries or self-approves.
 const fresh=await refresh(),plan=prepareMerge(snapshot,fresh,{now:typeof now==='function'?now():now});
 await record({state:'MERGE_INTENT',...plan});
 let result;
 try{result=await merge({repository_full_name:plan.repository_full_name,pr_number:plan.pr_number,expected_head_sha:plan.expected_head_sha,merge_method:plan.merge_method});}
 catch(error){await record({state:'MERGE_FAILED',head:plan.expected_head_sha,base:plan.expectedBase,error:String(error.message)});throw error;}
 let commit=null;
 if(result?.merged===true)try{commit=await readCommit(result.sha);}catch(error){const outcome={state:'MERGED_RESULT_UNCONFIRMED',head:result.sha,deployAllowed:false,error:String(error.message)};await record(outcome);return outcome;}
 const outcome=verifyMergeResult(plan,result,commit);
 await record({...outcome,head:result?.sha||plan.expected_head_sha,expectedBase:plan.expectedBase});return outcome;
}
export async function bindLocalAcceptance(root,evidenceDir,declared={}){
 const git=(...xs)=>execFileSync('git',['-C',root,...xs],{encoding:'utf8',stdio:['ignore','pipe','pipe']}),head=git('rev-parse','HEAD').trim(),pipeline=JSON.parse(await readFile(path.join(evidenceDir,'pipeline.json'),'utf8')),start=JSON.parse(await readFile(path.join(evidenceDir,'validation-start.json'),'utf8'));
 const names=['ui-v2','full','medical-core','core-smoke'];
 if(pipeline.head!==head||start.head!==head||pipeline.status!=='success'||pipeline.fixedSources!==true||pipeline.jobs?.length!==4||!pipeline.jobs.every((r,i)=>r.job===names[i]&&r.exit===0&&r.fixedSources===true))throw Error('Local final pipeline is incomplete or belongs to another HEAD');
 const files=git('ls-files','-z').split('\0').filter(Boolean).sort();if(JSON.stringify(files)!==JSON.stringify(Object.keys(start.sources||{}).sort()))throw Error('Local source coverage changed');
 for(const file of files)if(hash(await readFile(path.join(root,file)))!==start.sources[file])throw Error('Local source changed: '+file);
 return {...declared,head,clean:!git('status','--porcelain').trim(),fixedSources:true,sourceBindingVerified:true,tests:{...declared.tests,ui:'PASS',check:'PASS',medical:'PASS',core:'PASS'}};
}
// Assessment only. No token, network writer, merge, approval or repository
// setting is available to a candidate PR. Activation is a separate trusted-main
// installation and verified coordinator step, tracked in #311.
export async function main(args){
 const [root,snapshotFile,output,...extra]=args;if(!root||!snapshotFile||!output||extra.length)throw Error('Usage: ROOT SNAPSHOT_JSON NEW_REPORT');
 const snapshot=JSON.parse(await readFile(snapshotFile,'utf8')),git=(...xs)=>execFileSync('git',['-C',root,...xs],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
 if(git('rev-parse','HEAD').trim()!==snapshot.pr?.head?.sha||git('status','--porcelain').trim())throw Error('Candidate checkout changed or dirty');
 const policy=git('show',snapshot.main.commit.sha+':scripts/codex-merge-gate.mjs');
 if(hash(policy)!==hash(await readFile(new URL(import.meta.url))))throw Error('Trusted main gate absent or differs; bootstrap installation is not an automatic merge');
 snapshot.local=await bindLocalAcceptance(root,snapshot.local?.evidenceDir,snapshot.local);
 const preflightUrl=new URL('./codex-development-preflight.mjs',import.meta.url),trustedPreflight=git('show',snapshot.main.commit.sha+':scripts/codex-development-preflight.mjs');
 if(hash(trustedPreflight)!==hash(await readFile(preflightUrl)))throw Error('Trusted preflight dependency differs');
 const {inspectRepository}=await import(preflightUrl.href),state=await inspectRepository(root),owner=JSON.parse(await readFile(snapshot.lease?.file,'utf8'));
 snapshot.lease={...snapshot.lease,runId:owner.runId,owned:owner.commonGitDir===state.commonGitDir&&owner.runId===snapshot.runId,queue:state.gates.localTestQueue};
 const report=assessMerge(snapshot);await writeFile(path.resolve(output),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main(process.argv.slice(2)).then(r=>{console.log(r.state);if(r.reasons.length)process.exitCode=2;}).catch(e=>{console.error('CODEX_MERGE_GATE',e.message);process.exitCode=1;});
