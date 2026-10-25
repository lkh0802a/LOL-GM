#!/usr/bin/env node
// Read-only audit of the exact patch-pinned snapshot embedded in the current engine.
// No network requests, source mutation, runtime data substitution, or guessed values.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const path = fileURLToPath(new URL('../src/artifact/champion-source.js', import.meta.url));
const source = await readFile(path, 'utf8');
const match = source.match(/^const CHAMPION_SOURCE_SNAPSHOT=(.+);\s*$/m);
if (!match) throw new Error('Pinned champion snapshot constant not found');
const snapshot = JSON.parse(match[1]);
const champions = Object.entries(snapshot.champions || {});
const missing = [], zeroAdGrowth = [], suspiciousRange = [], noNumeric = [];
const required = ['hp', 'hpg', 'ad', 'adg', 'arm', 'armg', 'mr', 'mrg', 'as', 'asg', 'range', 'ms'];
let spells = 0, withNumeric = 0;
for (const [key, champ] of champions) {
  for (const stat of required) {
    if (!Number.isFinite(champ.base?.[stat])) missing.push(key + '.base.' + stat);
  }
  if (champ.base?.adg === 0) zeroAdGrowth.push(key);
  if (!Array.isArray(champ.spells) || champ.spells.length !== 4) {
    missing.push(key + '.spells[Q,W,E,R]');
    continue;
  }
  for (let idx = 0; idx < 4; idx++) {
    const spell = champ.spells[idx], slot = ['Q', 'W', 'E', 'R'][idx];
    if (spell?.slot !== slot || !spell.nameKo || !spell.descriptionKo) {
      missing.push(key + '.' + slot + '.identity');
    }
    spells++;
    if (spell.numeric && Object.keys(spell.numeric).length) withNumeric++;
    if ((spell?.range || []).some(n => Number.isFinite(n) && n > 10000)) {
      suspiciousRange.push(key + '.' + slot);
    }
  }
  if (!champ.spells.some(sp => sp.numeric && Object.keys(sp.numeric).length)) {
    noNumeric.push(key);
  }
}
const result = {
  source: 'Riot Data Dragon (as embedded in repo)',
  version: snapshot.version,
  championCount: champions.length,
  spellCount: spells,
  growth: {
    zeroAdGrowthCount: zeroAdGrowth.length,
    zeroAdGrowthSample: zeroAdGrowth.slice(0, 12),
    allZero: zeroAdGrowth.length === champions.length
  },
  mechanics: {
    spellsWithStructuredNumeric: withNumeric,
    championsWithoutStructuredNumeric: noNumeric.length,
    apparentRangeSentinelCount: suspiciousRange.length,
    rangeSentinelSample: suspiciousRange.slice(0, 12)
  },
  invalidFieldsCount: missing.length,
  invalidFieldsSample: missing.slice(0, 30),
  warnings: [
    ...(zeroAdGrowth.length === champions.length
      ? ['All champions have zero AD growth: verify patch-matched source before using in combat']
      : []),
    ...(withNumeric === 0
      ? ['No spells have executable structured numeric mechanics: text and cooldown are not full spell simulations']
      : []),
    ...(suspiciousRange.length
      ? ['Some range arrays contain sentinels; do not interpret these as normal cast range']
      : [])
  ]
};
console.log(JSON.stringify(result, null, 2));
if (missing.length || !champions.length || spells !== champions.length * 4) process.exitCode = 1;
if (process.argv.includes('--strict') && result.warnings.length) process.exitCode = 1;
