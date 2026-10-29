import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { statfsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { classifyWorkspaceSpace, inspectWorkspaceSpace, runSpacePreflight } from './codex-space-preflight.mjs';

const GiB = 1024n ** 3n;
for (const [available, state] of [[0n, 'BLOCKED'], [GiB - 1n, 'BLOCKED'],
  [GiB, 'WARN'], [4n * GiB - 1n, 'WARN'], [4n * GiB, 'READY']])
  assert.equal(classifyWorkspaceSpace(32n * GiB, available), state);
for (const [total, available] of [[0n, 0n], [GiB, -1n], [GiB, GiB + 1n], [32, 10]])
  assert.throws(() => classifyWorkspaceSpace(total, available));

const folder = await mkdtemp(join(tmpdir(), 'lolgm-space-probe-'));
try {
  const sentinel = join(folder, 'retained-evidence.txt');
  await writeFile(sentinel, 'Read-only capacity probe must preserve this fixture.');
  const before = await readFile(sentinel);
  const report = inspectWorkspaceSpace(folder), fs = statfsSync(folder, { bigint: true });
  assert.equal(report.totalBytes, String(fs.blocks * fs.bsize));
  assert(BigInt(report.availableBytes) >= 0n);
  assert.equal(report.automaticDeletion, false);
  const script = fileURLToPath(new URL('./codex-space-preflight.mjs', import.meta.url));
  const cli = spawnSync(process.execPath, [script, '--path', folder], { encoding: 'utf8' });
  const output = JSON.parse(cli.stdout);
  assert.equal(cli.status, output.state === 'BLOCKED' ? 2 : 0);
  assert.equal(output.path, folder);
  const fromOtherCwd = spawnSync(process.execPath, [script], { cwd: folder, encoding: 'utf8' });
  const defaultReport = JSON.parse(fromOtherCwd.stdout);
  assert.equal(defaultReport.path, fileURLToPath(new URL('../', import.meta.url)).replace(/\/$/, ''));
  assert.equal(fromOtherCwd.status, defaultReport.state === 'BLOCKED' ? 2 : 0);
  assert.equal(runSpacePreflight(['--path', join(folder, 'missing')]).exit, 3);
  assert.equal(runSpacePreflight(['--clean', folder]).exit, 64);
  assert.deepEqual(await readFile(sentinel), before);
  assert.deepEqual(await readdir(folder), ['retained-evidence.txt']);
} finally { await rm(folder, { recursive: true }); }
console.log('CODEX_SPACE_PREFLIGHT_ACCEPTANCE', JSON.stringify({ boundaries: 5,
  invalidCapacity: 4, actualFilesystem: true, readonly: true, missingFailsClosed: true,
  deletionFlagRejected: true, platformQuotaChanged: false }));
