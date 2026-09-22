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

存储为内存版,**每次 CLI 调用都是一个独立进程,数据不跨进程保留**。因此所有操作需在同一次调用中串联完成:

新增并列出(一次调用内,命令按顺序作用于同一份进程内存储):

```
$ node src/cli.js --add "买牛奶" --add "写代码" --list
新增 #1: 买牛奶
新增 #2: 写代码
#1 [ ] 买牛奶
#2 [ ] 写代码
```

新增、标记完成、再列出:

```
$ node src/cli.js --add "买牛奶" --done 1 --list
新增 #1: 买牛奶
完成 #1: 买牛奶
#1 [x] 买牛奶
```

单独调用 `--list` 时,因为新的进程内没有数据,输出为空:

```
$ node src/cli.js --list
$
```

传入非法参数时退出码为 1,并在 stderr 输出用法:

```
$ node src/cli.js --bogus
未知参数: "--bogus"。用法: node src/cli.js --add <text> | --list | --done <id>
$ echo $?
1
```

## 工作方式

每张子票由 taskflow 的 subagent 实现,reviewer agent 审查(gate),`npm test` 零 token 验证后关闭票据。
