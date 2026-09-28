import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// test/index.js 在同一进程内聚合全部测试文件,而 src/cli.js 的 store 是模块级单例。
// 用查询串获取独立的 cli.js 模块实例,等价于 node --test 按文件独立进程时的
// “从空存储开始”语义,避免与同样依赖空存储的 count.test.js 互相污染。
import { main } from '../src/cli.js?test-isolation';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(argv) {
  const out = [];
  const err = [];
  const writes = (arr) => ({ write(s) { arr.push(s); } });
  main(argv, { out: writes(out), err: writes(err) });
  return { out: out.join(''), err: err.join('') };
}

test('cli: --version 打印 package.json 的 name@version,退出码 0', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const { out, err } = run(['--version']);
  assert.equal(out, `${pkg.name}@${pkg.version}\n`);
  assert.equal(err, '');
});

test('cli: 源码不存在硬编码的 0.1.0 版本字面量', () => {
  const srcDir = path.join(__dirname, '..', 'src');
  for (const f of readdirSync(srcDir)) {
    const text = readFileSync(path.join(srcDir, f), 'utf8');
    assert.ok(!text.includes('0.1.0'), `src/${f} 硬编码了版本号 0.1.0`);
  }
});

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

test('cli: remove 打印被删条目,list/count 同步', () => {
  run(['--add', '待删']);
  const { out, err } = run(['--remove', '2']);
  assert.equal(out, 'removed #2 待删\n');
  assert.equal(err, '');
  assert.equal(run(['--list']).out, '#1 [x] 买牛奶\n');
  assert.equal(run(['--count']).out, 'total=1 pending=0 done=1\n');
});

test('cli: remove 不存在的 id 报错到 stderr 且退出码 1', () => {
  process.exitCode = 0;
  const { out, err } = run(['--remove', '99']);
  assert.equal(out, '');
  assert.equal(err, 'TODO #99 not found\n');
  assert.equal(process.exitCode, 1);
  process.exitCode = 0;
});

test('cli: remove 非法参数打印 usage 到 stderr 且退出码 1', () => {
  process.exitCode = 0;
  const { err } = run(['--remove', 'abc']);
  assert.match(err, /^usage: cli --add <text> \| --list \| --done <id> \| --remove <id>/);
  assert.equal(process.exitCode, 1);
  process.exitCode = 0;
});

test('cli: 非法参数打印 usage 到 stderr 且退出码 1', () => {
  process.exitCode = 0;
  const { err } = run([]);
  assert.match(err, /^usage: cli --add <text> | --list | --done <id>/);
  assert.equal(process.exitCode, 1);
  process.exitCode = 0;
});
