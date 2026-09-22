import { test } from 'node:test';
import assert from 'node:assert/strict';

import { main } from '../src/cli.js';
import { createStore } from '../src/store.js';

function fakeIo() {
  const out = [];
  const err = [];
  return {
    stdout: { write: (s) => out.push(s) },
    stderr: { write: (s) => err.push(s) },
    exitCode: 0,
    outText: () => out.join(''),
    errText: () => err.join(''),
  };
}

test('cli: add 打印新增条目', () => {
  const io = fakeIo();
  const store = createStore();
  main(['--add', '买牛奶'], { io, store });
  assert.equal(io.outText(), '新增 #1: 买牛奶\n');
  assert.equal(io.exitCode, 0);
});

test('cli: list 打印 #id [x| ] text', () => {
  const io = fakeIo();
  const store = createStore();
  main(['--add', '买牛奶'], { io, store });
  main(['--add', '写代码'], { io, store });
  main(['--done', '1'], { io, store });
  main(['--list'], { io, store });
  assert.ok(io.outText().endsWith('#1 [x] 买牛奶\n#2 [ ] 写代码\n'));
});

test('cli: done 打印完成条目', () => {
  const io = fakeIo();
  const store = createStore();
  main(['--add', '买牛奶'], { io, store });
  main(['--done', '1'], { io, store });
  assert.ok(io.outText().endsWith('完成 #1: 买牛奶\n'));
});

test('cli: parseArgs 抛错时打印 usage 到 stderr 并置退出码 1', () => {
  const io = fakeIo();
  main(['--foo'], { io, store: createStore() });
  assert.equal(io.outText(), '');
  assert.match(io.errText(), /usage|用法/);
  assert.equal(io.exitCode, 1);
});
