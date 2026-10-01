// Observe an existing command without changing its inputs, coverage or exit status.
import {spawn} from 'node:child_process';
import {createWriteStream} from 'node:fs';
import {mkdir,writeFile,appendFile} from 'node:fs/promises';
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
child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
child.stdout.on('data',chunk=>observe('stdout',chunk));
child.stderr.on('data',chunk=>observe('stderr',chunk));
child.on('error',error=>{spawnError=error.message});
const outcome=await new Promise(resolve=>child.on('close',(code,signal)=>resolve({code,signal})));
for(const stream of ['stdout','stderr'])if(pending[stream])line(stream,pending[stream]);
log.end();await finished(log);
const exitCode=outcome.code??1;
const result={label,command:[command,...args],status:exitCode===0?'success':'failure',
  exitCode,signal:outcome.signal,error:spawnError,ms:Math.round(performance.now()-started),records,
  failureTail:exitCode===0?[]:[...tails.stdout,...tails.stderr]};
await writeFile(join(directory,label+'.json'),JSON.stringify(result,null,2)+'\n');
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
