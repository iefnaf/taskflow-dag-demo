import assert from "node:assert/strict";
import test from "node:test";

import { createStore } from "../src/store.js";

test("add 返回新条目,id 从 1 递增且 done 初始为 false", () => {
  const store = createStore();
  assert.deepEqual(store.add("买牛奶"), { id: 1, text: "买牛奶", done: false });
  assert.deepEqual(store.add("写代码"), { id: 2, text: "写代码", done: false });
  assert.deepEqual(store.add("睡觉"), { id: 3, text: "睡觉", done: false });
});

test("list 返回全部条目的数组快照", () => {
  const store = createStore();
  store.add("a");
  store.add("b");

  const snapshot = store.list();
  assert.deepEqual(snapshot, [
    { id: 1, text: "a", done: false },
    { id: 2, text: "b", done: false },
  ]);

  // 修改快照不影响内部状态。
  snapshot.push({ id: 99, text: "x", done: false });
  snapshot[0].done = true;
  snapshot[1].text = "changed";

  assert.deepEqual(store.list(), [
    { id: 1, text: "a", done: false },
    { id: 2, text: "b", done: false },
  ]);
});

test("done 将对应条目置为已完成,且不影响其他条目", () => {
  const store = createStore();
  store.add("a");
  store.add("b");

  store.done(2);

  assert.deepEqual(store.list(), [
    { id: 1, text: "a", done: false },
    { id: 2, text: "b", done: true },
  ]);
});

test("done 对不存在的 id 抛错", () => {
  const store = createStore();
  store.add("a");

  assert.throws(() => store.done(42), /42/);
  assert.throws(() => store.done(0));
});

test("多次 createStore 产生的实例相互独立", () => {
  const a = createStore();
  const b = createStore();

  a.add("x");

  assert.deepEqual(a.list(), [{ id: 1, text: "x", done: false }]);
  assert.deepEqual(b.list(), []);
});
