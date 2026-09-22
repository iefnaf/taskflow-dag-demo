# taskflow-dag-demo

微型 TODO CLI 演示项目,用于测试 taskflow 声明式 DAG 编排:里程碑地图见 issue 列表中的「里程碑地图」。

## 目标

用 Node.js 内置能力(零第三方依赖)实现一个内存版 TODO CLI,支持三个子命令(每次调用都是新进程、从空存储开始):

```
node src/cli.js --add "买牛奶"   # added #1 买牛奶
node src/cli.js --list           # 新进程空存储,无输出
node src/cli.js --done 1         # 新进程中 id 不存在:TODO #1 not found(退出码 1)
```

- 存储:`src/store.js` — createStore() 提供 add/list/done
- 参数解析:`src/args.js` — parseArgs()
- 集成:`src/cli.js`
- 测试:node --test(Node 内置 test runner),`npm test` 一键全跑

## 使用

零依赖、纯内存:数据只在单个 Node 进程内存在,不跨命令持久化。**命令行下每次调用都是新进程,都从空存储开始**,因此下面每条示例都独立成立:

新增条目(新进程,空存储 + 新增,打印后退出):

```
$ node src/cli.js --add "买牛奶"
added #1 买牛奶
```

列出条目(又是一个新进程,存储为空,无输出):

```
$ node src/cli.js --list
$
```

完成条目(新进程中 id 不存在,报错到 stderr,退出码 1):

```
$ node src/cli.js --done 1
TODO #1 not found
```

要观察 add → list → done 的完整流转,需在同一进程内多次调用(例如测试里 `import { main } from './src/cli.js'`,见 `test/cli.test.js`)。

参数不合法时打印 usage 到 stderr 并以退出码 1 结束:

```
$ node src/cli.js
usage: cli --add <text> | --list | --done <id>
```

## 开发

运行测试(零依赖,使用 Node 内置 test runner):

```
npm test
```

## 工作方式

每张子票由 taskflow 的 subagent 实现,reviewer agent 审查(gate),`npm test` 零 token 验证后关闭票据。
