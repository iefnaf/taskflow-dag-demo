import { test } from 'node:test'
import assert from 'node:assert/strict'

// import 即验证入口保护:若 main 被误执行,会用测试 runner 的 argv 跑 main
// 并把退出码置 1,导致整个测试进程失败。能正常走到下面的用例说明保护生效。
import { formatItem, main } from '../src/cli.js'

test('入口保护:import cli.js 不自动运行 main', () => {
  assert.equal(typeof main, 'function')
  assert.equal(process.exitCode, undefined)
})

test('formatItem: 未完成显示 [ ],完成显示 [x]', () => {
  assert.equal(formatItem({ id: 1, text: '买牛奶', done: false }), '#1 [ ] 买牛奶')
  assert.equal(formatItem({ id: 2, text: '写代码', done: true }), '#2 [x] 写代码')
})

// 捕获 main() 的 stdout/stderr/exitCode,跑完恢复现场
function runMain(argv) {
  const originalArgv = process.argv
  const originalLog = console.log
  const originalWrite = process.stderr.write
  const originalExitCode = process.exitCode
  const out = []
  const err = []
  process.argv = ['node', 'src/cli.js', ...argv]
  console.log = (line) => out.push(line)
  process.stderr.write = (chunk) => {
    err.push(String(chunk))
    return true
  }
  try {
    main()
    return { out, err, exitCode: process.exitCode ?? 0 }
  } finally {
    process.argv = originalArgv
    console.log = originalLog
    process.stderr.write = originalWrite
    process.exitCode = originalExitCode
  }
}

test('--add 打印新增条目,退出码 0', () => {
  const { out, err, exitCode } = runMain(['--add', '买牛奶'])
  assert.deepEqual(out, ['#1 [ ] 买牛奶'])
  assert.deepEqual(err, [])
  assert.equal(exitCode, 0)
})

test('--list 逐行打印全部条目;空列表无输出', () => {
  // main 每次调用创建独立内存 store,且 parseArgs 限制单命令,
  // 故 list 在本用例中只能观察到空列表(跨命令保留数据不在本票范围)
  const { out, err, exitCode } = runMain(['--list'])
  assert.deepEqual(out, [])
  assert.deepEqual(err, [])
  assert.equal(exitCode, 0)
})

test('--done 的 id 不存在:错误打到 stderr,退出码 1', () => {
  const { out, err, exitCode } = runMain(['--done', '1'])
  assert.deepEqual(out, [])
  assert.equal(err.length, 1)
  assert.match(err[0], /todo not found: 1/)
  assert.equal(exitCode, 1)
})

test('非法参数:usage 提示打到 stderr,退出码 1', () => {
  for (const argv of [[], ['--foo'], ['--add', '--list']]) {
    const { out, err, exitCode } = runMain(argv)
    assert.deepEqual(out, [], `argv=${JSON.stringify(argv)}`)
    assert.equal(err.length, 1, `argv=${JSON.stringify(argv)}`)
    assert.match(err[0], /usage:/i, `argv=${JSON.stringify(argv)}`)
    assert.equal(exitCode, 1, `argv=${JSON.stringify(argv)}`)
  }
})
