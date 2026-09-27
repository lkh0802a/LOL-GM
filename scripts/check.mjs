import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { ARTIFACT_MODULES } from './artifact-modules.mjs';

const root = resolve(import.meta.dirname, '..');
const artifact = resolve(root, 'src', 'artifact');
const modules = ARTIFACT_MODULES;

let failed = false;
const globalSymbols = new Map();
for (const file of modules) {
  const path = resolve(artifact, file);
  const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    console.error(`Syntax check failed: ${file}`);
    console.error(result.stderr || result.stdout);
  }
  const source = await readFile(path, 'utf8');
  const symbols = [
    ...[...source.matchAll(/(?:^|\n)function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1]),
    ...[...source.matchAll(/(?:^|\n)(?:const|let|class)\s+([A-Za-z_$][\w$]*)/g)].map(m=>m[1]),
  ];
  for (const name of symbols) {
    if (globalSymbols.has(name)) {
      failed = true;
      console.error(`Duplicate global symbol ${name}: ${globalSymbols.get(name)} and ${file}`);
    } else globalSymbols.set(name, file);
  }
}

const maintainabilityBudgets = {
  'app.js': 90000,
  'ui-patch.js': 30000,
  'ui-market.js': 35000,
};
for (const [file, maxBytes] of Object.entries(maintainabilityBudgets)) {
  const source = await readFile(resolve(artifact, file), 'utf8');
  if (Buffer.byteLength(source, 'utf8') > maxBytes) {
    failed = true;
    console.error(`Maintainability budget exceeded: ${file} > ${maxBytes} bytes; split the domain UI instead of growing the monolith`);
  }
}

const appSource = await readFile(resolve(artifact, 'app.js'), 'utf8');
const worldSource = await readFile(resolve(artifact, 'world.js'), 'utf8');
const saveVersion = Number(appSource.match(/const SAVE_VERSION=(\d+)/)?.[1]);
const worldVersion = Number(worldSource.match(/version:(\d+),saveId:/)?.[1]);
if (!Number.isInteger(saveVersion) || !Number.isInteger(worldVersion) || saveVersion !== worldVersion) {
  failed = true;
  console.error(`Save schema mismatch: app SAVE_VERSION=${saveVersion}, buildWorld version=${worldVersion}`);
}

const shell = await readFile(resolve(artifact, 'shell.html'), 'utf8');
if (!shell.includes('<meta name="viewport"')) {
  failed = true;
  console.error('Missing mobile viewport meta tag');
}
if (!shell.includes('/*CODE*/')) {
  failed = true;
  console.error('Missing /*CODE*/ build placeholder');
}
if (!shell.includes('LOL <span>GM</span>')) {
  failed = true;
  console.error('LOL GM branding is missing from shell');
}

if (failed) process.exit(1);
console.log(`Checked ${modules.length} JavaScript modules and Artifact shell: OK`);
