import { spawn, spawnSync } from 'node:child_process';
const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const build = spawnSync(command, ['run', 'build', '-w', '@heroforce/api'], {
  stdio: 'inherit',
  cwd: new URL('..', import.meta.url),
  shell: process.platform === 'win32',
});
if (build.status !== 0) process.exit(build.status ?? 1);
const children = [
  spawn(
    command,
    [
      'exec',
      '-w',
      '@heroforce/api',
      '--',
      'tsc',
      '-p',
      'tsconfig.json',
      '--watch',
      '--preserveWatchOutput',
    ],
    { stdio: 'inherit', cwd: new URL('..', import.meta.url), shell: process.platform === 'win32' },
  ),
  spawn(process.execPath, ['--watch', 'dist/main.js'], {
    stdio: 'inherit',
    cwd: new URL('../apps/api/', import.meta.url),
  }),
];
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    children.forEach((c) => c.kill(signal));
    process.exit(0);
  });
