import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/store.js';

test('store: add 返回新条目且 id 从 1 递增', () => {
  const store = createStore();
  const a = store.add('买牛奶');
  const b = store.add('写代码');
  assert.deepEqual(a, { id: 1, text: '买牛奶', done: false });
  assert.deepEqual(b, { id: 2, text: '写代码', done: false });
});

test('store: list 返回全部条目的快照', () => {
  const store = createStore();
  store.add('a');
  store.add('b');
  assert.deepEqual(store.list(), [
    { id: 1, text: 'a', done: false },
    { id: 2, text: 'b', done: false },
  ]);
  // 快照性:外部修改不影响内部状态
  const snapshot = store.list();
  snapshot.push({ id: 99, text: 'x', done: false });
  assert.equal(store.list().length, 2);
});

test('store: done 将对应条目置为 true', () => {
  const store = createStore();
  store.add('task');
  const item = store.done(1);
  assert.equal(item.done, true);
  assert.equal(store.list()[0].done, true);
});

test('store: done 对不存在的 id 抛错', () => {
  const store = createStore();
  assert.throws(() => store.done(42), /not found/);
});
