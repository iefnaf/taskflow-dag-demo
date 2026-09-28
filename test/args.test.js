import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../src/args.js';

test('args: --add 解析为 add 动作', () => {
  assert.deepEqual(parseArgs(['--add', 'hello world']), {
    action: 'add',
    text: 'hello world',
  });
});

test('args: --version 解析为 version 动作', () => {
  assert.deepEqual(parseArgs(['--version']), { action: 'version' });
  assert.throws(() => parseArgs(['--version', 'extra']), /usage/);
});

test('args: --list 解析为 list 动作', () => {
  assert.deepEqual(parseArgs(['--list']), { action: 'list' });
});

test('args: --count 解析为 count 动作', () => {
  assert.deepEqual(parseArgs(['--count']), { action: 'count' });
  assert.throws(() => parseArgs(['--count', 'extra']), /usage/);
});

test('args: --done 将 id 数字化', () => {
  assert.deepEqual(parseArgs(['--done', '3']), { action: 'done', id: 3 });
});

test('args: --remove 将 id 数字化', () => {
  assert.deepEqual(parseArgs(['--remove', '3']), { action: 'remove', id: 3 });
});

test('args: --remove 非法 id 抛错', () => {
  assert.throws(() => parseArgs(['--remove', 'abc']), /usage/);
  assert.throws(() => parseArgs(['--remove']), /usage/);
  assert.throws(() => parseArgs(['--remove', '0']), /usage/);
});

test('args: 非法 id 抛错', () => {
  assert.throws(() => parseArgs(['--done', 'abc']), /usage/);
  assert.throws(() => parseArgs(['--done']), /usage/);
  assert.throws(() => parseArgs(['--done', '0']), /usage/);
});

test('args: 未知参数抛错', () => {
  assert.throws(() => parseArgs(['--delete', '1']), /usage/);
  assert.throws(() => parseArgs(['add']), /usage/);
});

test('args: 缺参数/空输入抛错', () => {
  assert.throws(() => parseArgs([]), /usage/);
  assert.throws(() => parseArgs(['--add']), /usage/);
});

test('args: 非法组合抛错', () => {
  assert.throws(() => parseArgs(['--list', 'extra']), /usage/);
  assert.throws(() => parseArgs(['--add', 'a', '--list']), /usage/);
});
