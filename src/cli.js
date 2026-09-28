/**
 * CLI 入口:组合 parseArgs + createStore。
 * 存储为模块级单例:同一进程内的多次调用共享数据(便于测试 import);
 * 每个命令行调用都是独立进程,数据不跨调用持久化。
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseArgs } from './args.js';
import { createStore } from './store.js';

const store = createStore();

/** 从 package.json 读取 name@version(不硬编码)。 */
export function versionString() {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  return `${pkg.name}@${pkg.version}`;
}

export function main(argv = process.argv.slice(2), { out = process.stdout, err = process.stderr } = {}) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (e) {
    err.write(`${e.message}\n`);
    process.exitCode = 1;
    return;
  }

  if (parsed.action === 'version') {
    out.write(`${versionString()}\n`);
    return;
  }

  if (parsed.action === 'add') {
    const item = store.add(parsed.text);
    out.write(`added #${item.id} ${item.text}\n`);
  } else if (parsed.action === 'list') {
    for (const item of store.list()) {
      out.write(`#${item.id} [${item.done ? 'x' : ' '}] ${item.text}\n`);
    }
  } else if (parsed.action === 'count') {
    const items = store.list();
    const done = items.filter((i) => i.done).length;
    out.write(`total=${items.length} pending=${items.length - done} done=${done}\n`);
  } else if (parsed.action === 'done') {
    let item;
    try {
      item = store.done(parsed.id);
    } catch {
      err.write(`TODO #${parsed.id} not found\n`);
      process.exitCode = 1;
      return;
    }
    out.write(`done #${item.id} ${item.text}\n`);
  } else if (parsed.action === 'remove') {
    let item;
    try {
      item = store.remove(parsed.id);
    } catch {
      err.write(`TODO #${parsed.id} not found\n`);
      process.exitCode = 1;
      return;
    }
    out.write(`removed #${item.id} ${item.text}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
