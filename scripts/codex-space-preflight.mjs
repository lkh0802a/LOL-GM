import { statfsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const GiB = 1024n ** 3n;
const repository = fileURLToPath(new URL('../', import.meta.url));

// Application headroom, not a platform quota. This probe never deletes files.
export function classifyWorkspaceSpace(totalBytes, availableBytes) {
  if (typeof totalBytes !== 'bigint' || typeof availableBytes !== 'bigint' ||
      totalBytes <= 0n || availableBytes < 0n || availableBytes > totalBytes)
    throw new Error('Invalid filesystem capacity');
  return availableBytes < GiB ? 'BLOCKED' : availableBytes < 4n * GiB ? 'WARN' : 'READY';
}

export function inspectWorkspaceSpace(path = repository) {
  const filesystem = statfsSync(path, { bigint: true });
  const total = filesystem.blocks * filesystem.bsize;
  const available = filesystem.bavail * filesystem.bsize;
  return { schemaVersion: 1, checkedAt: new Date().toISOString(), path: resolve(path),
    state: classifyWorkspaceSpace(total, available), totalBytes: String(total),
    availableBytes: String(available), minimumFreeBytes: String(GiB),
    warningFreeBytes: String(4n * GiB), automaticDeletion: false };
}

export function runSpacePreflight(args) {
  if (args.length && (args.length !== 2 || args[0] !== '--path'))
    return { exit: 64, report: { state: 'UNKNOWN', error: 'Usage: codex-space-preflight.mjs [--path PATH]' } };
  try {
    const report = inspectWorkspaceSpace(args.length ? args[1] : repository);
    return { exit: report.state === 'BLOCKED' ? 2 : 0, report };
  } catch (error) {
    return { exit: 3, report: { state: 'UNKNOWN', error: error.code || error.message } };
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = runSpacePreflight(process.argv.slice(2));
  console.log(JSON.stringify(result.report));
  process.exitCode = result.exit;
}
