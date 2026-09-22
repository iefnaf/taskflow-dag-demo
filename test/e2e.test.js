import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const run = promisify(execFile);
const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'cli.js');

function cliRun(args) {
  return run(process.execPath, [cli, ...args], { encoding: 'utf8' });
}

function cliRunFail(args) {
  return run(process.execPath, [cli, ...args], { encoding: 'utf8' }).then(
    () => {
      throw new Error('expected non-zero exit code');
    },
    (err) => err,
  );
}

test('e2e: --add 两条 → --list 输出两行', async () => {
  const { stdout } = await cliRun(['--add', '第一条', '--add', '第二条', '--list']);
  const lines = stdout.split('\n').filter((line) => /^#\d+ \[.\]/.test(line));
  assert.equal(lines.length, 2);
  assert.match(lines[0], /^#1 \[ \] 第一条$/);
  assert.match(lines[1], /^#2 \[ \] 第二条$/);
});

test('e2e: --done 1 后 --list 首行标记完成', async () => {
  const { stdout } = await cliRun([
    '--add', '第一条',
    '--add', '第二条',
    '--done', '1',
    '--list',
  ]);
  const lines = stdout.split('\n').filter((line) => /^#\d+ \[.\]/.test(line));
  assert.equal(lines.length, 2);
  assert.match(lines[0], /^#1 \[x\] 第一条$/);
  assert.match(lines[1], /^#2 \[ \] 第二条$/);
});

test('e2e: 非法参数退出码 1 且 stderr 含 usage', async () => {
  const err = await cliRunFail(['--bogus']);
  assert.equal(err.code, 1);
  assert.match(err.stderr, /usage|用法/);
});
