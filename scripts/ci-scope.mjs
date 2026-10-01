import {appendFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export function validationScope(event,draft,files){
  const docs=files.length>0&&files.every(f=>f.startsWith('docs/')||!f.includes('/')&&f.endsWith('.md'));
  const tooling=f=>/^\.github\/workflows\//.test(f)||/^scripts\/ci-(scope|run)(\.test)?\.mjs$/.test(f);
  const ui=f=>/^src\/artifact\/ui.*\.js$/.test(f)||f==='src/artifact/styles.css'||f==='src/artifact/shell.html';
  const mainPublish=event==='push';
  const full=event==='workflow_dispatch'||(!mainPublish&&!docs&&draft!=='true'&&(!files.length||files.some(f=>!tooling(f)&&!ui(f))));
  const selected=!docs&&draft!=='true';
  return {docs_only:docs,run_full:full,run_ui:full||!mainPublish&&selected&&files.some(ui),
    run_calendar:full,run_build:full||selected&&files.some(f=>ui(f)||mainPublish&&!tooling(f))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [event,draft,...files]=process.argv.slice(2),scope=validationScope(event,draft,files);
  const output=Object.entries(scope).map(([k,v])=>k+'='+v).join('\n')+'\n';
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,output);
  console.log(output);
}
