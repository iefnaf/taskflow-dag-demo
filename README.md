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

## 使用

新增一条 TODO 并打印它:

```console
$ node src/cli.js --add "买牛奶"
#1 [ ] 买牛奶
```

逐行列出全部条目(未完成 `[ ]`、完成 `[x]`,空列表无输出):

```console
$ node src/cli.js --list
#1 [ ] 买牛奶
#2 [x] 写代码
```

标记完成并打印该条目:

```console
$ node src/cli.js --done 1
#1 [x] 买牛奶
```

- 参数不合法(未知参数、缺参数、多命令组合)时,错误信息(自带 usage 提示)打到 stderr,退出码 1。
- `--done` 的 id 不存在时,`todo not found: <id>` 打到 stderr,退出码 1。

> 存储为内存版,不落盘:每条命令都是独立进程、独立存储,数据不跨命令保留。
> 因此把上面三条命令按顺序作为三个独立进程连跑时,`--list` 实际为空、`--done 1` 实际报
> `todo not found: 1`——这是预期行为;`--list` / `--done` 的示例输出展示的是存储中已有上述条目时的效果。

## 开发

项目零第三方依赖,直接用 Node 内置 test runner:

```
npm test
```

等价于 `node --test test/*.test.js`,无需先执行 `npm install`。

## 工作方式

每张子票由 taskflow 的 subagent 实现,reviewer agent 审查(gate),`npm test` 零 token 验证后关闭票据。
