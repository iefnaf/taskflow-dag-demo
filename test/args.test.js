import { test } from 'node:test'
import assert from 'node:assert/strict'

import { parseArgs } from '../src/args.js'

test('--add <text> → { action: "add", text }', () => {
  assert.deepEqual(parseArgs(['--add', '买牛奶']), { action: 'add', text: '买牛奶' })
  assert.deepEqual(parseArgs(['--add', 'hello world']), { action: 'add', text: 'hello world' })
})

test('--list → { action: "list" }', () => {
  assert.deepEqual(parseArgs(['--list']), { action: 'list' })
})

test('--done <id> → { action: "done", id } with id coerced to number', () => {
  assert.deepEqual(parseArgs(['--done', '3']), { action: 'done', id: 3 })
  assert.equal(parseArgs(['--done', '1']).id, 1)
  assert.ok(typeof parseArgs(['--done', '42']).id === 'number')
})

test('empty argv throws with usage hint (缺参数)', () => {
  assert.throws(() => parseArgs([]), /usage:/i)
})

test('unknown flag throws with usage hint (未知参数)', () => {
  assert.throws(() => parseArgs(['--foo']), /usage:/i)
})

test('unknown positional argument throws with usage hint', () => {
  assert.throws(() => parseArgs(['foo']), /usage:/i)
})

test('--add without value throws with usage hint', () => {
  assert.throws(() => parseArgs(['--add']), /usage:/i)
})

test('--add followed by another flag throws (非法组合)', () => {
  assert.throws(() => parseArgs(['--add', '--list']), /usage:/i)
})

test('--done without value throws with usage hint', () => {
  assert.throws(() => parseArgs(['--done']), /usage:/i)
})

test('--done with non-numeric id throws with usage hint', () => {
  assert.throws(() => parseArgs(['--done', 'abc']), /usage:/i)
})

test('--done with non-positive-integer id throws', () => {
  assert.throws(() => parseArgs(['--done', '0']), /usage:/i)
  assert.throws(() => parseArgs(['--done', '-1']), /usage:/i)
})

test('combining commands throws with usage hint (非法组合)', () => {
  assert.throws(() => parseArgs(['--add', 'x', '--list']), /usage:/i)
  assert.throws(() => parseArgs(['--list', '--done', '1']), /usage:/i)
  assert.throws(() => parseArgs(['--list', '--list']), /usage:/i)
})
