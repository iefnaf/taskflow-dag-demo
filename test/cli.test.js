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

test('cli: add 打印新增条目', () => {
  const { out } = run(['--add', '买牛奶']);
  assert.equal(out, 'added #1 买牛奶\n');
});

test('cli: list 逐行打印 #id [x| ] text', () => {
  const { out } = run(['--list']);
  assert.equal(out, '#1 [ ] 买牛奶\n');
});

test('cli: done 打印完成条目,list 显示 [x]', () => {
  const { out } = run(['--done', '1']);
  assert.equal(out, 'done #1 买牛奶\n');
  const listed = run(['--list']).out;
  assert.equal(listed, '#1 [x] 买牛奶\n');
});

test('cli: 非法参数打印 usage 到 stderr 且退出码 1', () => {
  process.exitCode = 0;
  const { err } = run([]);
  assert.match(err, /^usage: cli --add <text> | --list | --done <id>$/);
  assert.equal(process.exitCode, 1);
  process.exitCode = 0;
});
