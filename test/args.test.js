import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseArgs } from '../src/args.js';

test('args: --add → { action: "add", text }', () => {
  assert.deepEqual(parseArgs(['--add', '买牛奶']), { action: 'add', text: '买牛奶' });
});

test('args: --list → { action: "list" }', () => {
  assert.deepEqual(parseArgs(['--list']), { action: 'list' });
});

test('args: --done <id> → 数字化 id', () => {
  assert.deepEqual(parseArgs(['--done', '3']), { action: 'done', id: 3 });
});

test('args: 未知参数抛错并含 usage', () => {
  assert.throws(() => parseArgs(['--foo']), /usage|用法/);
  assert.throws(() => parseArgs(['add']), /usage|用法/);
});

test('args: 缺参数抛错', () => {
  assert.throws(() => parseArgs([]), /usage|用法/);
  assert.throws(() => parseArgs(['--add']), /usage|用法/);
  assert.throws(() => parseArgs(['--done']), /usage|用法/);
});

test('args: 非法组合抛错', () => {
  assert.throws(() => parseArgs(['--list', '--add', 'x']), /usage|用法/);
  assert.throws(() => parseArgs(['--add', 'x', 'y']), /usage|用法/);
  assert.throws(() => parseArgs(['--add', 'x', '--done', '1']), /usage|用法/);
});

test('args: 非法 id 抛错', () => {
  assert.throws(() => parseArgs(['--done', 'abc']), /usage|用法/);
  assert.throws(() => parseArgs(['--done', '1.5']), /usage|用法/);
  assert.throws(() => parseArgs(['--done', '0']), /usage|用法/);
});
