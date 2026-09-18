// CLI 集成层:组合 args.js(参数解析)与 store.js(内存存储),把一条命令翻译成终端输出。
//
// 输出约定(与 README「使用」示例一致),条目统一打印为 `#id [x| ] text`:
//   --add <text>  打印新增条目      → #1 [ ] 买牛奶
//   --list        逐行打印全部条目  → #1 [ ] 买牛奶 / #2 [x] 写代码(完成显示 [x]),空列表无输出
//   --done <id>   打印完成后的条目  → #1 [x] 买牛奶
//
// 出错一律打到 stderr 并置退出码 1:parseArgs 抛出的错误信息自带 usage 提示;
// --done 的 id 不存在时 store 抛 `todo not found: <id>`。
// 存储是内存版的:数据随进程结束即丢,不跨命令保留。

import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { parseArgs } from './args.js'
import { createStore } from './store.js'

// 单条 TODO 的统一展示格式,--add / --list / --done 三处共用
export function formatItem(item) {
  return `#${item.id} ${item.done ? '[x]' : '[ ]'} ${item.text}`
}

// 执行一条命令(argv 取自 process.argv)并打印结果;出错写 stderr、置退出码 1。
export function main() {
  try {
    const command = parseArgs(process.argv.slice(2))
    const store = createStore()

    if (command.action === 'add') {
      console.log(formatItem(store.add(command.text)))
    } else if (command.action === 'list') {
      for (const item of store.list()) {
        console.log(formatItem(item))
      }
    } else {
      // store.done() 只做标记不返回条目,标记后从 list() 快照中取回并打印
      store.done(command.id)
      const item = store.list().find((entry) => entry.id === command.id)
      console.log(formatItem(item))
    }
  } catch (err) {
    process.stderr.write(`${err.message}\n`)
    process.exitCode = 1
  }
}

// 入口保护:仅当本文件是直接执行入口(node src/cli.js)时才运行 main,
// 被测试等场景 import 时不产生副作用。
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main()
}
