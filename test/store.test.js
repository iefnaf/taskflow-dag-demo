import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createStore } from '../src/store.js';

test('store: id 从 1 起递增', () => {
  const store = createStore();
  const a = store.add('买牛奶');
  const b = store.add('写代码');
  assert.equal(a.id, 1);
  assert.equal(b.id, 2);
  assert.equal(a.text, '买牛奶');
  assert.equal(a.done, false);
});

test('store: list 返回全部条目的快照', () => {
  const store = createStore();
  store.add('a');
  store.add('b');
  const snapshot = store.list();
  assert.equal(snapshot.length, 2);
  // 快照与内部状态解耦:修改快照不影响后续 list
  snapshot[0].text = 'mutated';
  snapshot.pop();
  assert.equal(store.list()[0].text, 'a');
  assert.equal(store.list().length, 2);
});

test('store: done 将对应条目置为 true', () => {
  const store = createStore();
  const { id } = store.add('task');
  store.done(id);
  const [item] = store.list();
  assert.equal(item.done, true);
});

test('store: done 对不存在的 id 抛错', () => {
  const store = createStore();
  store.add('task');
  assert.throws(() => store.done(999), /not found/);
});
