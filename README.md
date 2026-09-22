# taskflow-dag-demo

微型 TODO CLI 演示项目,用于测试 taskflow 声明式 DAG 编排:里程碑地图见 issue 列表中的「里程碑地图」。

## 目标

用 Node.js 内置能力(零第三方依赖)实现一个内存版 TODO CLI:

```
node src/cli.js --add "买牛奶"
node src/cli.js --list
node src/cli.js --done 1
```

- 存储:`src/store.js` — createStore() 提供 add/list/done
- 参数解析:`src/args.js` — parseArgs()
- 集成:`src/cli.js`
- 测试:node --test(Node 内置 test runner),`npm test` 一键全跑

## 开发

运行测试(Node 内置 test runner,零第三方依赖):

```
npm test
```

## 使用

新增一条 TODO:

```
$ node src/cli.js --add "买牛奶"
新增 #1: 买牛奶
```

列出全部条目(未完成显示 `[ ]`,完成显示 `[x]`):

```
$ node src/cli.js --list
#1 [ ] 买牛奶
```

标记完成:

```
$ node src/cli.js --done 1
完成 #1: 买牛奶
$ node src/cli.js --list
#1 [x] 买牛奶
```

注:存储为内存版,进程退出后数据不保留。

## 工作方式

每张子票由 taskflow 的 subagent 实现,reviewer agent 审查(gate),`npm test` 零 token 验证后关闭票据。
