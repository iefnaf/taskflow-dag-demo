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

在仓库根目录运行测试:

```sh
npm test
```

测试基于 Node 内置的 `node --test` runner,用例放在 `test/` 目录下。运行前请确保 Node.js 版本支持内置 test runner(Node 18+)。

## 工作方式

每张子票由 taskflow 的 subagent 实现,reviewer agent 审查(gate),`npm test` 零 token 验证后关闭票据。
