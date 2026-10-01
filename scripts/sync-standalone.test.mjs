import test from 'node:test';
import assert from 'node:assert/strict';
import {syncStandalone} from './sync-standalone.mjs';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';

test('real remote receives the built bytes once and rejects stale artifacts',()=>{
  const dir=mkdtempSync(join(tmpdir(),'lol-gm-sync-'));
  const remote=join(dir,'remote.git'),checkout=join(dir,'checkout');
  const git=(args,cwd=dir)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  try{
    git(['init','--bare',remote]);git(['clone',remote,checkout]);
    git(['checkout','-b','main'],checkout);
    writeFileSync(join(checkout,'index.html'),'original');
    git(['add','index.html'],checkout);
    git(['-c','user.name=Test','-c','user.email=test@example.com','commit','-m','initial'],checkout);
    git(['push','origin','main'],checkout);
    const expected=git(['rev-parse','HEAD'],checkout);
    writeFileSync(join(checkout,'index.html'),'built offline artifact');
    assert.equal(syncStandalone({cwd:checkout,expected}),'published');
    assert.equal(git(['show','main:index.html'],remote),'built offline artifact');
    const published=git(['rev-parse','HEAD'],checkout);
    assert.equal(syncStandalone({cwd:checkout,expected:published}),'unchanged');
    git(['checkout','--detach',expected],checkout);
    writeFileSync(join(checkout,'index.html'),'stale artifact');
    assert.equal(syncStandalone({cwd:checkout,expected}),'stale');
    assert.equal(git(['rev-parse','main'],remote),published);
  }finally{
    assert.equal(dirname(resolve(dir)),resolve(tmpdir()));
    rmSync(dir,{recursive:true,force:true});
  }
});

function scenario({head='tested',changed=true,remote=['tested'],staged='',pushError=false}={}){
  const calls=[];
  const git=args=>{
    calls.push(args.join(' '));
    if(args.join(' ')==='rev-parse HEAD')return head;
    if(args[0]==='status')return changed?' M index.html':'';
    if(args.join(' ')==='rev-parse refs/remotes/origin/main')return remote.length>1?remote.shift():remote[0];
    if(args[0]==='diff')return staged;
    if(args[0]==='push'&&pushError)throw new Error('push rejected');
    return '';
  };
  return {calls,run:()=>syncStandalone({expected:'tested',git})};
}
test('publishes the existing artifact with a normal push',()=>{
  const s=scenario();assert.equal(s.run(),'published');
  assert(s.calls.includes('add -- index.html'));assert(s.calls.includes('push origin HEAD:main'));
  assert(!s.calls.some(x=>/reset|force|build.mjs/.test(x)));
});
test('unchanged and stale runs do not commit',()=>{
  for(const options of [{changed:false},{remote:['newer']}]){
    const s=scenario(options);assert.equal(s.run(),options.changed===false?'unchanged':'stale');
    assert(!s.calls.some(x=>x.startsWith('add ')));
  }
});
test('a push race skips stale publication but transport failures fail',()=>{
  assert.equal(scenario({remote:['tested','newer'],pushError:true}).run(),'stale');
  assert.throws(()=>scenario({pushError:true}).run(),/push rejected/);
});
test('rejects another checkout or unrelated staged changes',()=>{
  assert.throws(()=>scenario({head:'other'}).run(),/tested checkout/);
  assert.throws(()=>scenario({staged:'src/game.js'}).run(),/empty index/);
});
