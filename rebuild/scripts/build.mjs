import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync('cargo', ['build', '--release', '--locked', '--target', 'wasm32-unknown-unknown'], { cwd: root, stdio: 'inherit' });
const bytes = await readFile(new URL('../target/wasm32-unknown-unknown/release/lolgm_foundation.wasm', import.meta.url));
await writeFile(new URL('../web/core.b64', import.meta.url), bytes.toString('base64'));
execFileSync(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'build'], { cwd: root, stdio: 'inherit' });
