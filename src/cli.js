/**
 * CLI 入口 —— 组合 parseArgs 与 createStore(票据 #4)。
 *
 * 仅当本文件是执行入口(import.meta.url 匹配 process.argv[1])时运行 main,
 * 便于测试直接 import 其中的函数而不产生副作用。
 */

import { parseCommands } from './args.js';
import { createStore } from './store.js';

export function main(argv = process.argv.slice(2), { io = process, store = createStore() } = {}) {
  let commands;
  try {
    commands = parseCommands(argv);
  } catch (err) {
    io.stderr.write(`${err.message}\n`);
    io.exitCode = 1;
    return;
  }

  for (const cmd of commands) {
    if (cmd.action === 'add') {
      const item = store.add(cmd.text);
      io.stdout.write(`新增 #${item.id}: ${item.text}\n`);
      continue;
    }

    if (cmd.action === 'list') {
      for (const item of store.list()) {
        io.stdout.write(`#${item.id} [${item.done ? 'x' : ' '}] ${item.text}\n`);
      }
      continue;
    }

    if (cmd.action === 'done') {
      const item = store.list().find((entry) => entry.id === cmd.id);
      store.done(cmd.id);
      io.stdout.write(`完成 #${item.id}: ${item.text}\n`);
    }
  }
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main();
}
