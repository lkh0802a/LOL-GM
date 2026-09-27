import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ARTIFACT_MODULES } from './artifact-modules.mjs';

const root = resolve(import.meta.dirname, '..');
const artifact = resolve(root, 'src', 'artifact');
const modules = ARTIFACT_MODULES;

const shell = await readFile(resolve(artifact, 'shell.html'), 'utf8');
if ((shell.match(/\/\*CODE\*\//g) || []).length !== 1) {
  throw new Error('src/artifact/shell.html must contain exactly one /*CODE*/ placeholder');
}

const chunks = [];
for (const file of modules) {
  const source = await readFile(resolve(artifact, file), 'utf8');
  chunks.push(`/* ==== FILE: ${file} ==== */\n${source.trim()}\n`);
}

const banner = `/* LOL GM generated bundle. Canonical source lives in src/artifact/*.js. */\n`;
const html = shell.replace('/*CODE*/', banner + chunks.join('\n'));

await writeFile(resolve(root, 'index.html'), html, 'utf8');
await mkdir(resolve(root, 'dist'), { recursive: true });
await writeFile(resolve(root, 'dist', 'index.html'), html, 'utf8');
console.log(`Built ${modules.length} modules -> index.html and dist/index.html`);
