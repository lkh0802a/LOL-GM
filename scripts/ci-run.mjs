// Observe an existing command without changing its inputs, coverage or exit status.
import {spawn,execFileSync} from 'node:child_process';
import {createWriteStream,writeFileSync,renameSync} from 'node:fs';
import {mkdir,writeFile,appendFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {finished} from 'node:stream/promises';
import {resolve,join} from 'node:path';

const [label,separator,command,...args]=process.argv.slice(2);
if(!/^[a-z0-9-]+$/.test(label||'')||separator!=='--'||!command){
  console.error('Usage: node scripts/ci-run.mjs <label> -- <command> [args...]');
  process.exit(2);
}
const directory=resolve(process.env.CI_RESULTS_DIR||'ci-results');
await mkdir(directory,{recursive:true});
const log=createWriteStream(join(directory,label+'.log'));
const started=performance.now(),records=[],tails={stdout:[],stderr:[]},pending={stdout:'',stderr:''};
const lifecyclePath=join(directory,label+'.process.json'),startedUtc=new Date().toISOString();
let revision=null,trackedChanges=null;
try{
  revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  trackedChanges=execFileSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim().length>0;
}catch{} // A command can also run outside a Git checkout; unknown is not clean.
let sourceHashAtSpawn=null;
if(args.some(a=>/(^|[\\/])daily-career-acceptance\.mjs$/.test(a))){
  const {ENGINE_MODULES}=await import('./artifact-modules.mjs');
  const source=(await Promise.all(ENGINE_MODULES.map(f=>readFile(new URL('../src/artifact/'+f,import.meta.url),'utf8')))).join('\n');
  sourceHashAtSpawn=createHash('sha256').update(source).digest('hex');
}
const identity={label,command:[command,...args],parentPid:process.pid,startedUtc,
  revision,trackedChanges,sourceHashAtSpawn,node:process.version,
  career:process.env.CAREER_SEED?{seed:process.env.CAREER_SEED,seasons:process.env.CAREER_SEASONS||'100',
    heapMB:process.env.CAREER_MEMORY_MB||'1536',rssMB:process.env.CAREER_RSS_MB||'4096'}:null};
function persistLifecycle(status,extra={}){
  const tmp=lifecyclePath+'.tmp';
  writeFileSync(tmp,JSON.stringify({...identity,childPid:child.pid??null,status,
    observedUtc:new Date().toISOString(),elapsedMs:Math.round(performance.now()-started),...extra},null,2)+'\n');
  renameSync(tmp,lifecyclePath);
}
let spawnError=null;
function line(stream,value){
  tails[stream].push(value.slice(0,2000));
  if(tails[stream].length>12)tails[stream].shift();
  const match=value.match(/^([A-Z][A-Z0-9_]+) (\{.*\}|\[.*\])$/);
  if(match){try{records.push({marker:match[1],value:JSON.parse(match[2])})}catch{}}
  if(value.startsWith('11.5 Step 1 regression baseline: OK ('))
    records.push({marker:'REGRESSION_CASES',value:value.slice(value.indexOf('(')+1,-1).split(', ')});
}
function observe(stream,chunk){
  process[stream].write(chunk);log.write(chunk);
  pending[stream]+=chunk;
  const lines=pending[stream].split(/\r?\n/);pending[stream]=lines.pop();
  for(const value of lines)line(stream,value);
}
const child=spawn(command==='node'?process.execPath:command,args,{
  stdio:['ignore','pipe','pipe'],env:process.env,shell:false
});
persistLifecycle('running');
// Low-frequency liveness evidence. If this parent also disappears, the last
// running record remains unknown; it must never be interpreted as a pass.
const heartbeat=setInterval(()=>persistLifecycle('running'),30_000);
heartbeat.unref();
child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
child.stdout.on('data',chunk=>observe('stdout',chunk));
child.stderr.on('data',chunk=>observe('stderr',chunk));
child.on('error',error=>{spawnError=error.message});
const outcome=await new Promise(resolve=>child.on('close',(code,signal)=>resolve({code,signal})));
clearInterval(heartbeat);
for(const stream of ['stdout','stderr'])if(pending[stream])line(stream,pending[stream]);
log.end();await finished(log);
const exitCode=outcome.code??1;
const result={label,command:[command,...args],status:exitCode===0?'success':'failure',
  exitCode,signal:outcome.signal,error:spawnError,ms:Math.round(performance.now()-started),records,
  process:identity,childPid:child.pid??null,
  failureTail:exitCode===0?[]:[...tails.stdout,...tails.stderr]};
await writeFile(join(directory,label+'.json'),JSON.stringify(result,null,2)+'\n');
persistLifecycle(result.status,{endedUtc:new Date().toISOString(),exitCode,signal:outcome.signal,error:spawnError});
const escape=value=>String(value).replaceAll('|','\\|').replaceAll('\n',' ');
if(process.env.GITHUB_STEP_SUMMARY){
  let summary=`### ${label}\n\n| Result | Duration | Command |\n| --- | --- | --- |\n| ${result.status} (${exitCode}) | ${(result.ms/1000).toFixed(2)}s | ${escape(result.command.join(' '))} |\n\n`;
  summary+=`JSON/log artifact: \`${label}.json\` / \`${label}.log\`.\n\n`;
  if(records.length)summary+='Recorded: '+records.map(row=>row.marker).join(', ')+'.\n\n';
  if(exitCode!==0)summary+='<pre>'+[spawnError,...result.failureTail].filter(Boolean).join('\n').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')+'</pre>\n';
  await appendFile(process.env.GITHUB_STEP_SUMMARY,summary);
}
console.log('CI_RESULT '+JSON.stringify({label,status:result.status,exitCode,ms:result.ms,records:records.length}));
process.exitCode=exitCode;
