/**
 * 内存版 TODO 存储:createStore() 返回 { add, list, done }
 */
export function createStore() {
  let nextId = 1;
  const items = [];

  return {
    /** 新增条目,返回 { id, text, done: false },id 从 1 递增 */
    add(text) {
      const item = { id: nextId++, text, done: false };
      items.push(item);
      return { ...item };
    },

    /** 返回全部条目的数组快照 */
    list() {
      return items.map((item) => ({ ...item }));
    },

    /** 将对应条目 done 置 true;id 不存在时抛错 */
    done(id) {
      const item = items.find((i) => i.id === id);
      if (!item) {
        throw new Error(`TODO #${id} not found`);
      }
      item.done = true;
      return { ...item };
    },
  };
}
