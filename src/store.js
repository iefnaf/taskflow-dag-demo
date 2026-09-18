// 内存版 TODO 存储:createStore() 每次调用返回一个独立的存储实例。
// 条目形如 { id, text, done },id 从 1 起递增。
export function createStore() {
  let nextId = 1
  const items = []

  return {
    // 新增条目,返回其快照
    add(text) {
      const item = { id: nextId++, text, done: false }
      items.push(item)
      return { ...item }
    },

    // 返回全部条目的数组快照(与内部状态隔离,后续增删改不影响已返回结果)
    list() {
      return items.map((item) => ({ ...item }))
    },

    // 将对应条目 done 置 true;id 不存在时抛错
    done(id) {
      const item = items.find((entry) => entry.id === id)
      if (!item) {
        throw new Error(`todo not found: ${id}`)
      }
      item.done = true
    },
  }
}
