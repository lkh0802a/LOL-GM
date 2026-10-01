import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {ENGINE_MODULES} from './artifact-modules.mjs';

const root=resolve(import.meta.dirname,'..','src','artifact');
const sources=new Map();
let reads=0,engineCompiles=0,contexts=0;
let engineSourcePromise=null,engineScriptPromise=null;

export function artifactSource(file){
  let pending=sources.get(file);
  if(!pending){
    pending=readFile(resolve(root,file),'utf8');
    sources.set(file,pending);
    reads++;
  }
  return pending;
}

export function artifactSources(files){
  return Promise.all(files.map(artifactSource));
}

export function engineSource(){
  if(!engineSourcePromise)engineSourcePromise=Promise.all(
    ENGINE_MODULES.map(artifactSource)
  ).then(parts=>parts.join('\n')+'\n');
  return engineSourcePromise;
}

export function compiledEngine(){
  if(!engineScriptPromise)engineScriptPromise=engineSource().then(source=>{
    engineCompiles++;
    return new vm.Script(source,{
      filename:'lol-gm-engine.acceptance.js',
      displayErrors:true
    });
  });
  return engineScriptPromise;
}

export async function runEngineFixture(fixture,{
  timeout=30000,
  filename='acceptance-fixture.js',
  setupSources=[]
}={}){
  const engine=await compiledEngine();
  // Every acceptance gets a new Realm/context. Only immutable engine source and
  // the compiled Script are shared; DB/global state never crosses test cases.
  contexts++;
  const context=vm.createContext({
    console,Date,Math,JSON,Set,Map,WeakMap,Object,Array,String,Number,Boolean,
    RegExp,Error,Intl,performance,crypto
  });
  const started=performance.now();
  engine.runInContext(context,{timeout});
  let elapsed=Math.max(0,Math.ceil(performance.now()-started));
  for(let index=0;index<setupSources.length;index++){
    const remaining=Math.max(1,timeout-elapsed);
    const setup=new vm.Script(setupSources[index],{
      filename:filename+'.setup-'+index,
      displayErrors:true
    });
    setup.runInContext(context,{timeout:remaining});
    elapsed=Math.max(0,Math.ceil(performance.now()-started));
  }
  const remaining=Math.max(1,timeout-elapsed);
  const test=new vm.Script(fixture,{filename,displayErrors:true});
  return test.runInContext(context,{timeout:remaining});
}

export function testHarnessStats(){
  return {reads,cachedArtifacts:sources.size,engineCompiles,contexts};
}
