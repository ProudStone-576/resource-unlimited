#!/usr/bin/env node
// Parallel dev runner that works with either pnpm or npm without depending on
// pnpm being on PATH. Spawns both apps' dev scripts and pipes their output.
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const apps = [
  { name: 'api', cwd: resolve(repoRoot, 'apps/api') },
  { name: 'web', cwd: resolve(repoRoot, 'apps/web') },
];

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'cmd.exe' : 'npm';
const npmArgs = isWin ? ['/d', '/s', '/c', 'npm run dev'] : ['run', 'dev'];

const procs = apps.map(({ name, cwd }) => {
  const child = spawn(npmCmd, npmArgs, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  const tag = `[${name}]`;
  child.stdout.on('data', (b) => process.stdout.write(`${tag} ${b}`));
  child.stderr.on('data', (b) => process.stderr.write(`${tag} ${b}`));
  child.on('exit', (code) => {
    process.stderr.write(`${tag} exited with code ${code}\n`);
    for (const p of procs) if (p !== child && !p.killed) p.kill();
    process.exit(code ?? 1);
  });
  return child;
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    for (const p of procs) if (!p.killed) p.kill();
  });
}
