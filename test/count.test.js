/**
 * --count 汇总命令:只读,输出 total/pending/done,不改变存储。
 * node --test 为每个文件启动独立进程,模块级存储从空开始。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { main } from '../src/cli.js';

function run(argv) {
  const out = [];
  const err = [];
  const writes = (arr) => ({ write(s) { arr.push(s); } });
  main(argv, { out: writes(out), err: writes(err) });
  return { out: out.join(''), err: err.join('') };
}

test('count: 空存储输出 total=0 pending=0 done=0,无 stderr', () => {
  const { out, err } = run(['--count']);
  assert.equal(out, 'total=0 pending=0 done=0\n');
  assert.equal(err, '');
});

test('count: add 两条、done 一条后输出 total=2 pending=1 done=1', () => {
  run(['--add', 'a']);
  run(['--add', 'b']);
  run(['--done', '1']);
  const { out, err } = run(['--count']);
  assert.equal(out, 'total=2 pending=1 done=1\n');
  assert.equal(err, '');
});

test('count: 只读,不改变存储', () => {
  const before = run(['--list']).out;
  run(['--count']);
  const after = run(['--list']).out;
  assert.equal(before, after);
  assert.equal(after, '#1 [x] a\n#2 [ ] b\n');
});

test('count: 多余参数打印 usage 到 stderr 且退出码 1', () => {
  process.exitCode = 0;
  const { out, err } = run(['--count', 'x']);
  assert.equal(out, '');
  assert.match(err, /^usage: cli --add <text> \| --list \| --done <id> \| --remove <id> \| --find <text> \| --count \| --version\n$/);
  assert.equal(process.exitCode, 1);
  process.exitCode = 0;
});
