// 内存版 TODO 存储:零依赖,供 CLI 集成使用(票据 #2)。

/**
 * 创建一个内存版 TODO 存储。
 * @returns {{ add(text: string): {id: number, text: string, done: boolean},
 *             list(): Array<{id: number, text: string, done: boolean}>,
 *             done(id: number): void }}
 */
export function createStore() {
  /** @type {Array<{id: number, text: string, done: boolean}>} */
  const items = [];
  let nextId = 1;

  return {
    add(text) {
      const item = { id: nextId++, text, done: false };
      items.push(item);
      return item;
    },

    list() {
      return items.map((item) => ({ ...item }));
    },

    done(id) {
      const item = items.find((entry) => entry.id === id);
      if (!item) {
        throw new Error(`TODO #${id} not found`);
      }
      item.done = true;
    },
  };
}
