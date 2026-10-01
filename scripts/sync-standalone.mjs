import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export function syncStandalone({cwd=process.cwd(),expected=process.env.GITHUB_SHA,git}={}){
  function runGit(args){return execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}
  git??=runGit;
  if(!expected||git(['rev-parse','HEAD'])!==expected)throw new Error('Standalone sync requires the tested checkout SHA');
  if(!git(['status','--porcelain','--','index.html']))return 'unchanged';
  const remoteHead=()=>{git(['fetch','origin','main']);return git(['rev-parse','refs/remotes/origin/main']);};
  if(remoteHead()!==expected)return 'stale';
  if(git(['diff','--cached','--name-only']))throw new Error('Standalone sync requires an empty index');
  git(['add','--','index.html']);
  git(['-c','user.name=github-actions[bot]','-c','user.email=41898282+github-actions[bot]@users.noreply.github.com','commit','-m','build: sync generated standalone']);
  try{git(['push','origin','HEAD:main']);}
  catch(error){if(remoteHead()!==expected)return 'stale';throw error;}
  return 'published';
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  console.log(`Standalone sync: ${syncStandalone()}`);
}
