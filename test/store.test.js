import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createStore } from '../src/store.js'

test('add: id 从 1 起递增,新条目 done 为 false', () => {
  const store = createStore()
  assert.deepEqual(store.add('first'), { id: 1, text: 'first', done: false })
  assert.deepEqual(store.add('second'), { id: 2, text: 'second', done: false })
  assert.deepEqual(store.add('third'), { id: 3, text: 'third', done: false })
})

test('list: 返回全部条目的数组快照', () => {
  const store = createStore()
  store.add('first')
  store.add('second')

  const snapshot = store.list()
  assert.deepEqual(snapshot, [
    { id: 1, text: 'first', done: false },
    { id: 2, text: 'second', done: false },
  ])

  // 快照与内部状态隔离:后续 done 不影响已返回的快照
  store.done(1)
  assert.equal(snapshot[0].done, false)

  // 修改快照也不影响存储
  snapshot[1].text = 'hacked'
  assert.equal(store.list()[1].text, 'second')
})

test('done: 将对应条目置为 done', () => {
  const store = createStore()
  store.add('first')
  store.add('second')

  store.done(2)

  const items = store.list()
  assert.equal(items[0].done, false)
  assert.equal(items[1].done, true)
})

test('done: id 不存在时抛错', () => {
  const store = createStore()
  store.add('only')

  assert.throws(() => store.done(99), /not found/)
})

test('createStore: 每个实例相互独立', () => {
  const a = createStore()
  const b = createStore()
  a.add('a1')

  assert.equal(b.list().length, 0)
  assert.equal(a.add('a2').id, 2)
  assert.equal(b.add('b1').id, 1)
})
