import {createInterface} from 'node:readline';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,open,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {assessMerge,executeMerge,bindLocalAcceptance,bindUiRunner,bindEnhancedEvidence} from './codex-merge-gate.mjs';

const REPO='lkh0802a/LOL-GM',API='https://api.github.com/repos/'+REPO,hash=x=>createHash('sha256').update(x).digest('hex');
const commit=x=>({sha:x.sha,parents:x.parents,tree:x.commit?.tree?.sha||x.tree?.sha});
export function jsonLineClient(input,output){
 if(input.isTTY&&typeof input.setRawMode==='function')input.setRawMode(true);
 const lines=createInterface({input}),pending=new Map();let id=0;
 lines.on('line',line=>{let r;try{r=JSON.parse(line);}catch{for(const p of pending.values())p.reject(Error('Invalid broker response'));lines.close();return;}const p=pending.get(r.id);if(!p)return;pending.delete(r.id);if(r.error)p.reject(Error(r.error.message||'Connector request failed'));else p.resolve(r.result);});
 lines.on('close',()=>{if(input.isTTY&&typeof input.setRawMode==='function')input.setRawMode(false);for(const p of pending.values())p.reject(Error('Connector transport closed'));pending.clear();});
 return {request(operation,params){const n=++id;return new Promise((resolve,reject)=>{pending.set(n,{resolve,reject});output.write(JSON.stringify({protocol:'lol-gm-merge-v1',id:n,operation,params})+'\n');});},close:()=>lines.close()};
}
export async function collectRemote(prNumber,request,contextPolicySha){
 if(!Number.isSafeInteger(prNumber)||prNumber<1)throw Error('Positive PR number required');
 const observedAt=new Date().toISOString(),get=route=>request('fetch',{url:route?API+'/'+route:API});
 const repository=await get(''),pr=await get('pulls/'+prNumber),main=await get('branches/main');
 async function pages(route){const out=[];for(let page=1;page<=20;page++){const rows=await get(route+'?per_page=100&page='+page);if(!Array.isArray(rows))throw Error('Incomplete list response');out.push(...rows);if(rows.length<100)return out;}throw Error('Pagination exceeds bounded review scope');}
 const policyIssue=await get('issues/311'),policy={owner:policyIssue.user?.login,sha256:hash(policyIssue.body||'')};
 const files=await pages('pulls/'+prNumber+'/files'),reviews=await pages('pulls/'+prNumber+'/reviews'),checks=[];let ciComplete=false;
 for(let page=1;page<=20;page++){const result=await get('commits/'+pr.head.sha+'/check-runs?per_page=100&page='+page);if(!Array.isArray(result.check_runs)||!Number.isSafeInteger(result.total_count))throw Error('Incomplete check pagination');checks.push(...result.check_runs);if(checks.length===result.total_count){ciComplete=true;break;}if(result.check_runs.length<100)break;}
 const runIds=[...new Set(checks.map(c=>c.details_url?.match(/^https:\/\/github\.com\/lkh0802a\/LOL-GM\/actions\/runs\/(\d+)\/job\/\d+$/)?.[1]).filter(Boolean))];if(runIds.length>20)throw Error('Too many workflow attempts for one review');
 const runs=[];for(const id of runIds)runs.push(await get('actions/runs/'+id));
 const threadResult=await request('threads',{repo_full_name:REPO,pr_number:prNumber}),threads=threadResult.review_threads;
 if(!Array.isArray(threads))throw Error('Review thread state unavailable');
 // The current connector has no cursor. Empty is complete; nonempty without
 // explicit total/page metadata must never silently stand for all threads.
 const reviewComplete=threads.length===0||threadResult.total_count===threads.length||threadResult.pageInfo?.hasNextPage===false;
 const testedMerge=/^[a-f0-9]{40}$/.test(pr.merge_commit_sha||'')?commit(await get('commits/'+pr.merge_commit_sha)):null;
 let integration=null;const perf=checks.filter(c=>c.name==='perf-build').sort((a,b)=>b.id-a.id)[0],match=perf?.details_url?.match(/\/actions\/runs\/(\d+)\/job\/(\d+)$/);
 if(match&&perf.app?.slug==='github-actions'&&perf.status==='completed'&&perf.conclusion==='success'){
  const log=await request('jobLog',{repo_full_name:REPO,job_id:Number(match[2])}),records=String(log).split('\n').map(line=>line.match(/STANDALONE_ARTIFACT (\{.*\})\s*$/)?.[1]).filter(Boolean);
  if(records.length===1){const m=JSON.parse(records[0]),artifacts=await request('artifacts',{repo_full_name:REPO,run_id:Number(match[1]),name:'lol-gm-html-preview'}),a=artifacts.artifacts?.length===1?artifacts.artifacts[0]:null;
   if(m.action==='record'&&m.schemaVersion===1&&m.repository===REPO&&m.runId===match[1]&&/^[a-f0-9]{40}$/.test(m.head||'')&&/^[a-f0-9]{64}$/.test(m.sha256||'')&&Number.isSafeInteger(m.bytes)&&m.bytes>0&&a?.name==='lol-gm-html-preview'&&a.expired===false&&a.workflow_run?.id===Number(match[1])&&a.workflow_run?.head_sha===pr.head.sha&&/^sha256:[a-f0-9]{64}$/.test(a.digest||'')){
    const source=commit(await get('commits/'+m.head));integration={status:'ATTESTED',head:pr.head.sha,base:main.commit.sha,source,runId:Number(match[1]),sha256:m.sha256,bytes:m.bytes,artifactId:a.id,artifactDigest:a.digest};
   }
  }
 }
 return {observedAt,policy,contextPolicySha,repository,pr,main,files,reviews,checks,runs,threads,reviewComplete,ciComplete,testedMerge,integration};
}
export async function enrichLocal(snapshot,{root,evidenceDir,ownerFile,runId,enhancedProof}){
 const git=(...a)=>execFileSync('git',['-C',root,...a],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
 snapshot.runId=runId;
 try{snapshot.local=await bindLocalAcceptance(root,evidenceDir,{base:snapshot.main.commit.sha,evidenceDir});}catch(error){snapshot.local={head:git('rev-parse','HEAD').trim(),clean:false,sourceBindingVerified:false,error:error.message};}
 try{
  const preflightUrl=new URL('./codex-development-preflight.mjs',import.meta.url),{inspectRepository}=await import(preflightUrl.href),state=await inspectRepository(root),owner=JSON.parse(await readFile(ownerFile,'utf8'));
  snapshot.lease={file:ownerFile,runId:owner.runId,repository:REPO,owned:owner.runId===runId&&owner.commonGitDir===state.commonGitDir,queue:state.gates.localTestQueue};
 }catch(error){snapshot.lease={owned:false,queue:'UNKNOWN',error:error.message};}
 try{
  const labels={focus:'focus',adjacent:'adjacent',build:'build'};snapshot.local.tests??={};
  for(const [key,label] of Object.entries(labels)){const p=JSON.parse(await readFile(path.join(evidenceDir,'lifecycle',label+'.process.json'),'utf8')),r=JSON.parse(await readFile(path.join(evidenceDir,'lifecycle',label+'.json'),'utf8'));snapshot.local.tests[key]=p.revision===snapshot.pr.head.sha&&p.trackedChanges===false&&p.status==='success'&&p.exitCode===0&&r.status==='success'?'PASS':'NOT_BOUND';}
 }catch(error){snapshot.local.externalEvidenceError=error.message;}
 try{if(snapshot.files.some(f=>f.filename==='scripts/check-ui-v2.mjs'))snapshot.local.uiRunnerIntegrity=await bindUiRunner(root,snapshot.main.commit.sha,snapshot.pr.head.sha,snapshot.files);}catch(error){snapshot.local.uiRunnerIntegrity={status:'BLOCKED',error:error.message};}
 try{if(enhancedProof)snapshot.local.enhanced=await bindEnhancedEvidence(root,JSON.parse(await readFile(enhancedProof,'utf8')).directories);}catch(error){snapshot.local.enhanced={status:'BLOCKED',error:error.message};}
 if(snapshot.integration?.status==='ATTESTED'&&snapshot.testedMerge?.tree===snapshot.integration.source.tree&&snapshot.integration.source.parents?.[0]?.sha===snapshot.main.commit.sha&&snapshot.integration.source.parents?.[1]?.sha===snapshot.pr.head.sha){snapshot.integration.status='VERIFIED';try{const bytes=await readFile(path.join(root,'index.html'));snapshot.local.generatedIndex={head:snapshot.pr.head.sha,base:snapshot.main.commit.sha,verified:hash(bytes)===snapshot.integration.sha256&&bytes.length===snapshot.integration.bytes};}catch{}}
 return snapshot;
}
export async function verifyInstalled(root,mainSha){
 if(!/^[a-f0-9]{40}$/.test(mainSha||''))throw Error('Exact trusted main SHA required');
 const git=(...a)=>execFileSync('git',['-C',root,...a],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
 if(git('ls-remote','--exit-code','origin','refs/heads/main').trim().split(/\s+/)[0]!==mainSha)throw Error('Main advanced during collection');
 for(const name of ['codex-merge-gate.mjs','codex-merge-broker.mjs','codex-development-preflight.mjs'])if(hash(git('show',mainSha+':scripts/'+name))!==hash(await readFile(new URL('./'+name,import.meta.url))))throw Error('Trusted main installation differs');
}
export async function runBroker({root,prNumber,evidenceDir,ownerFile,runId,policySha,output,enhancedProof,apply=false},request){
 if(apply&&!/^[a-f0-9]{64}$/.test(policySha||''))throw Error('External current-policy acknowledgement required');
 const get=async()=>enrichLocal(await collectRemote(prNumber,request,policySha),{root,evidenceDir,ownerFile,runId,enhancedProof}),snapshot=await get();let installed=false,installationError;
 try{await verifyInstalled(root,snapshot.main.commit.sha);installed=true;}catch(error){installationError=error.message;}
 const assessment=assessMerge(snapshot),report={mode:apply?'APPLY':'AUDIT',installed,installationError,assessment,snapshot};
 const out=path.join(await realpath(path.dirname(path.resolve(output))),path.basename(output));const {inside,inspectRepository}=await import('./codex-development-preflight.mjs');const state=await inspectRepository(root);for(const w of state.worktrees)if(inside(out,await realpath(w.root)))throw Error('Broker evidence must be outside worktrees');
 await writeFile(out,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
 if(!apply||!installed||assessment.reasons.length)return report;
 const intent=path.join(path.dirname(out),'merge-intent-'+prNumber+'-'+snapshot.pr.head.sha+'-'+snapshot.main.commit.sha+'.jsonl'),handle=await open(intent,'wx',0o600);
 try{report.outcome=await executeMerge({snapshot,refresh:async()=>{const fresh=await get();await verifyInstalled(root,fresh.main.commit.sha);return fresh;},record:async record=>{await handle.writeFile(JSON.stringify({at:new Date().toISOString(),...record})+'\n');await handle.sync();},merge:args=>request('merge',args),readCommit:async sha=>commit(await request('fetch',{url:API+'/commits/'+sha}))});await writeFile(out+'.result.json',JSON.stringify(report.outcome,null,2)+'\n',{flag:'wx',mode:0o600});}finally{await handle.close();}
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [root,number,evidenceDir,ownerFile,runId,policySha,output,flag,enhancedProof,...extra]=process.argv.slice(2),client=jsonLineClient(process.stdin,process.stdout);
 try{if(!root||!output||extra.length||(flag&&!['--apply','--audit'].includes(flag)))throw Error('Usage: ROOT PR EVIDENCE_DIR OWNER_FILE RUN_ID POLICY_SHA NEW_REPORT [--apply [ENHANCED_JSON]]');const report=await runBroker({root,prNumber:Number(number),evidenceDir,ownerFile,runId,policySha,output,enhancedProof,apply:flag==='--apply'},client.request);console.log(JSON.stringify({protocol:'lol-gm-merge-result-v1',state:report.outcome?.state||report.assessment.state,installed:report.installed,report:output}));if(report.assessment.reasons.length||!report.installed)process.exitCode=2;}catch(error){console.error('CODEX_MERGE_BROKER',error.message);process.exitCode=1;}finally{client.close();}
}
