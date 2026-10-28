// Portable, read-only connector boundary. The host supplies its existing tools;
// no credentials, dynamic tool names, evaluated PR text or mutation route.
const REPO='lkh0802a/LOL-GM',API='https://api.github.com/repos/'+REPO;
const pick=(x,keys)=>Object.fromEntries(keys.filter(k=>x?.[k]!==undefined).map(k=>[k,x[k]]));
const check=x=>({...pick(x,['id','name','head_sha','status','conclusion','details_url']),app:pick(x.app,['slug'])});
const commit=x=>({...pick(x,['sha']),parents:x.parents?.map(p=>pick(p,['sha'])),commit:{tree:pick(x.commit?.tree,['sha'])}});
export function projectFetch(url,x){
 if(typeof url!=='string'||!(url===API||url.startsWith(API+'/')))throw Error('Fixed repository required');
 const route=url.slice(API.length);
 if(route==='')return {...pick(x,['full_name','default_branch','archived','disabled','allow_merge_commit']),permissions:pick(x.permissions,['push'])};
 if(/^\/pulls\/\d+$/.test(route))return {...pick(x,['number','state','draft','merged','mergeable','mergeable_state','merge_commit_sha','changed_files']),user:pick(x.user,['login']),base:{...pick(x.base,['ref','sha']),repo:pick(x.base?.repo,['full_name'])},head:{...pick(x.head,['sha']),repo:pick(x.head?.repo,['full_name'])}};
 if(route==='/branches/main')return {...pick(x,['protected']),commit:pick(x.commit,['sha'])};
 if(route==='/issues/311')return {body:x.body,user:pick(x.user,['login'])};
 if(/^\/pulls\/\d+\/files\?per_page=100&page=\d+$/.test(route)){if(!Array.isArray(x))throw Error('File page unavailable');return x.map(f=>pick(f,['filename','status']));}
 if(/^\/pulls\/\d+\/reviews\?per_page=100&page=\d+$/.test(route)){if(!Array.isArray(x))throw Error('Review page unavailable');return x.map(r=>({...pick(r,['id','state']),user:pick(r.user,['login'])}));}
 if(/^\/commits\/[a-f0-9]{40}\/check-runs\?per_page=100&page=\d+$/.test(route))return {total_count:x.total_count,check_runs:x.check_runs?.map(check)};
 if(/^\/actions\/runs\/\d+$/.test(route))return {...pick(x,['id','head_sha','status','conclusion','event','path']),repository:pick(x.repository,['full_name'])};
 if(/^\/commits\/[a-f0-9]{40}$/.test(route))return commit(x);
 throw Error('Read route outside broker scope');
}
export async function readOnlyRequest(packet,adapter){
 if(packet?.protocol!=='lol-gm-merge-v1'||!Number.isSafeInteger(packet.id)||packet.id<1)throw Error('Invalid protocol');
 const {operation,params:p}=packet;
 if(operation==='fetch'){
  const route=typeof p?.url==='string'&&p.url.startsWith(API)?p.url.slice(API.length):null;
  if(route===null||! /^(?:|\/branches\/main|\/issues\/311|\/pulls\/\d+|\/pulls\/\d+\/(?:files|reviews)\?per_page=100&page=\d+|\/commits\/[a-f0-9]{40}(?:\/check-runs\?per_page=100&page=\d+)?|\/actions\/runs\/\d+)$/.test(route))throw Error('Read route outside broker scope');
  return projectFetch(p.url,await adapter.fetch(p.url));
 }
 if(p?.repo_full_name!==REPO)throw Error('Fixed repository required');
 if(operation==='threads'&&Number.isSafeInteger(p.pr_number)&&p.pr_number>0){const x=await adapter.threads(p);return {...pick(x,['total_count','pageInfo']),review_threads:x.review_threads?.map(t=>pick(t,['id','isResolved']))};}
 if(operation==='jobLog'&&Number.isSafeInteger(p.job_id)&&p.job_id>0)return String(await adapter.jobLog(p)).split('\n').filter(line=>/STANDALONE_ARTIFACT \{/.test(line)).join('\n');
 if(operation==='artifacts'&&Number.isSafeInteger(p.run_id)&&p.run_id>0&&p.name==='lol-gm-html-preview'){const x=await adapter.artifacts(p);return {total_count:x.total_count,artifacts:x.artifacts?.map(a=>({...pick(a,['id','name','expired','digest']),workflow_run:pick(a.workflow_run,['id','head_sha'])}))};}
 throw Error('Read-only adapter refuses operation');
}
export function responseChunks(id,result,size=1000){
 if(!Number.isSafeInteger(size)||size<2||size>1000)throw Error('Reviewable input size required');
 const line=JSON.stringify({id,result})+'\n',parts=[];
 for(let start=0;start<line.length;){let end=Math.min(start+size,line.length);if(end<line.length&&/[\uD800-\uDBFF]/.test(line[end-1]))end--;parts.push(line.slice(start,end));start=end;}
 return parts;
}
