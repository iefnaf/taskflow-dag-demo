// 内存版 TODO 存储:零依赖,不持久化。
// createStore() 返回 { add(text), list(), done(id) }。

export function createStore() {
  const items = [];
  let nextId = 1;

  function add(text) {
    const item = { id: nextId, text, done: false };
    nextId += 1;
    items.push(item);
    return { ...item };
  }

  function list() {
    // 返回数组快照:内部条目的增删改不影响调用方,反之亦然。
    return items.map((item) => ({ ...item }));
  }

  function done(id) {
    const item = items.find((entry) => entry.id === id);
    if (!item) {
      throw new Error(`TODO 不存在: id=${id}`);
    }
    item.done = true;
    return { ...item };
  }

  return { add, list, done };
}
