import test from 'node:test';
import assert from 'node:assert/strict';
import {mutationInventory,assertMutationOwnership} from './mutation-ownership.mjs';

test('rejects a new UI writer and an extra write in an existing owner',()=>{
  assert.throws(()=>assertMutationOwnership(new Map([
    ['ui-manager.js','team.finance.cash -= cost;']
  ]),{}),/ui-manager.js: cash expected 0, found 1/);
  assert.throws(()=>assertMutationOwnership(new Map([
    ['contracts.js','t.finance.cash -= bonus; t.finance.cash += fee;']
  ]),{'contracts.js':{cash:1}}),/cash expected 1, found 2/);
});

test('caller migration must shrink its old inventory and declare its new owner',()=>{
  const sources=new Map([['contracts.js','payBonus(t,bonus)'],['finance.js','t.finance.cash -= bonus']]);
  assert.throws(()=>assertMutationOwnership(sources,{'contracts.js':{cash:1}}),/contracts.js: cash expected 1, found 0/);
  assert.doesNotThrow(()=>assertMutationOwnership(sources,{'finance.js':{cash:1}}));
  assert.throws(()=>assertMutationOwnership(new Map(),{'contracts.js':{cash:1}}),/missing from module manifest/);
});

test('reads/comparisons/function definitions are not writer calls',()=>{
  assert.deepEqual(mutationInventory('t.finance.cash===0; t.finance.cash<=0; t.finance.cash>=1; db.worldDate==day; db.worldDate<=day; x=>x.finance.cash; function assignPlayerToTeam(db,p,t){} function removePlayerFromTeam(db,p){}'),{});
  assert.deepEqual(mutationInventory('assignPlayerToTeam(db,p,t); removePlayerFromTeam(db,p);'),{assign:1,remove:1});
});

test('tracks compound writes and literal bracket properties',()=>{
  assert.deepEqual(mutationInventory('t["finance"]["cash"] -= cost; t.finance.cash++; db["worldDate"] ||= day; db.worldDate = next;'),{cash:2,date:2});
});

test('release liabilities may only be written by the finance owner',()=>{
  assert.deepEqual(mutationInventory('t["finance"]["buyout"] += fee;'),{obligation:1});
  assert.throws(()=>assertMutationOwnership(new Map([
    ['ui-market.js','t.finance.buyout += fee;']
  ]),{}),/ui-market.js: obligation expected 0, found 1/);
});
