/**
 * --find <text> 文本过滤命令:
 * - args 层:恰两参数、text 非空,校验同 --add;
 * - cli 层:输出 text 子串匹配(大小写不敏感)的条目,行格式与 --list 一致;
 *   无匹配无输出、退出码 0;不改变存储;
 * - 进程级:新进程空存储无输出退出码 0。
 * node --test 为每个文件启动独立进程,模块级存储从空开始。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseArgs } from '../src/args.js';
// 与 cli.test.js 同理:测试运行器在同一进程内聚合各测试文件,而 src/cli.js 的
// store 是模块级单例。用查询串获取独立模块实例,避免被 count.test.js 等留下的数据污染。
import { main } from '../src/cli.js?find-test-isolation';

const exec = promisify(execFile);
const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'cli.js');

function run(argv) {
  const out = [];
  const err = [];
  const writes = (arr) => ({ write(s) { arr.push(s); } });
  main(argv, { out: writes(out), err: writes(err) });
  return { out: out.join(''), err: err.join('') };
}

async function runCli(args) {
  try {
    const { stdout, stderr } = await exec(process.execPath, [cli, ...args]);
    return { stdout, stderr, code: 0 };
  } catch (e) {
    return { stdout: e.stdout, stderr: e.stderr, code: e.code };
  }
}

test('find(args): --find 解析为 find 动作并保留 text', () => {
  assert.deepEqual(parseArgs(['--find', '牛']), { action: 'find', text: '牛' });
});

test('find(args): --find 缺参数或空串抛 usage', () => {
  assert.throws(() => parseArgs(['--find']), /usage/);
  assert.throws(() => parseArgs(['--find', '']), /usage/);
});

test('find(args): --find 多余参数抛 usage', () => {
  assert.throws(() => parseArgs(['--find', 'a', 'b']), /usage/);
});

test('find(cli): 大小写不敏感子串过滤,行格式与 --list 一致', () => {
  run(['--add', 'Buy Milk']);
  run(['--add', '写周报']);
  run(['--add', 'buy bread']);
  run(['--done', '1']);

  const { out, err } = run(['--find', 'BUY']);
  assert.equal(out, '#1 [x] Buy Milk\n#3 [ ] buy bread\n');
  assert.equal(err, '');
});

test('find(cli): 无匹配时无输出、退出码 0,且不改变存储', () => {
  const before = run(['--list']).out;
  process.exitCode = 0;
  const { out, err } = run(['--find', '不存在的关键词']);
  assert.equal(out, '');
  assert.equal(err, '');
  assert.equal(process.exitCode, 0);
  assert.equal(run(['--list']).out, before);
});

test('find(cli): 非法参数打印 usage 到 stderr 且退出码 1', () => {
  process.exitCode = 0;
  const { out, err } = run(['--find']);
  assert.equal(out, '');
  assert.match(err, /^usage: cli --add <text> \| --list \| --done <id> \| --remove <id> \| --find <text>/);
  assert.equal(process.exitCode, 1);
  process.exitCode = 0;
});

test('find(进程级): 空存储 --find 无输出、退出码 0', async () => {
  assert.deepEqual(
    await runCli(['--find', '牛']),
    { stdout: '', stderr: '', code: 0 },
  );
});

test('find(进程级): --find 缺参数打印 usage 且退出码 1', async () => {
  const { stdout, stderr, code } = await runCli(['--find']);
  assert.equal(stdout, '');
  assert.match(stderr, /^usage: cli --add <text> \| --list \| --done <id> \| --remove <id> \| --find <text>/);
  assert.equal(code, 1);
});
