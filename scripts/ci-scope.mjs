import {appendFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export function validationScope(event,files){
  const documentation=f=>f.startsWith('docs/')||!f.includes('/')&&f.endsWith('.md');
  const docs=files.length>0&&files.every(documentation);
  // Keep one merge gate for every change. Drafts, documentation, UI, CI and
  // engine edits all receive the same complete validation; main also repeats
  // the complete gate before standalone publication.
  return {docs_only:docs,run_full:true,run_ui:true,run_calendar:true,run_build:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [event,...files]=process.argv.slice(2),scope=validationScope(event,files);
  const output=Object.entries(scope).map(([k,v])=>k+'='+v).join('\n')+'\n';
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,output);
  console.log(output);
}
