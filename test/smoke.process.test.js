/**
 * 进程级冒烟:用真实子进程执行 node src/cli.js,验证 README 示例与实际行为一致。
 * 每次命令行调用都是新进程、独立空存储——这正是本测试要覆盖的跨进程语义。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const exec = promisify(execFile);
const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'cli.js');

async function runCli(args) {
  try {
    const { stdout, stderr } = await exec(process.execPath, [cli, ...args]);
    return { stdout, stderr, code: 0 };
  } catch (e) {
    return { stdout: e.stdout, stderr: e.stderr, code: e.code };
  }
}

test('smoke(进程级): --add 在新进程中打印 added #1', async () => {
  const { stdout, stderr, code } = await runCli(['--add', '买牛奶']);
  assert.equal(stdout, 'added #1 买牛奶\n');
  assert.equal(stderr, '');
  assert.equal(code, 0);
});

test('smoke(进程级): --list 是独立新进程,空存储无输出', async () => {
  const { stdout, code } = await runCli(['--list']);
  assert.equal(stdout, '');
  assert.equal(code, 0);
});

test('smoke(进程级): --done 跨进程后 id 不存在,报错且退出码 1', async () => {
  const { stdout, stderr, code } = await runCli(['--done', '1']);
  assert.equal(stdout, '');
  assert.equal(stderr, 'TODO #1 not found\n');
  assert.equal(code, 1);
});

test('smoke(进程级): --version 打印 name@version 且退出码 0', async () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const { stdout, stderr, code } = await runCli(['--version']);
  assert.equal(stdout, `${pkg.name}@${pkg.version}\n`);
  assert.equal(stderr, '');
  assert.equal(code, 0);
});

test('smoke(进程级): --count 新进程空存储输出 total=0', async () => {
  const { stdout, stderr, code } = await runCli(['--count']);
  assert.equal(stdout, 'total=0 pending=0 done=0\n');
  assert.equal(stderr, '');
  assert.equal(code, 0);
});

test('smoke(进程级): --count 带多余参数打印 usage 且退出码 1', async () => {
  const { stdout, stderr, code } = await runCli(['--count', 'x']);
  assert.equal(stdout, '');
  assert.match(stderr, /\| --count \| --version\n$/);
  assert.equal(code, 1);
});

test('smoke(进程级): 无参数打印 usage 且退出码 1', async () => {
  const { stdout, stderr, code } = await runCli([]);
  assert.equal(stdout, '');
  assert.match(stderr, /^usage: cli --add <text> \| --list \| --done <id> \| --count \| --version\n$/);
  assert.equal(code, 1);
});
