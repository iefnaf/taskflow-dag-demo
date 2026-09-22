/**
 * 端到端冒烟。
 *
 * 产品是纯内存版(见 README):每次 CLI 调用都是新进程、从空存储开始,
 * 生产代码不含任何持久化。因此在设计 e2e 时区分两层:
 *
 * 1) 真实 CLI 入口的黑盒验证:链路中的每条命令(--add/--add/--list/
 *    --done/--list)都逐条用 execFile 启动真实 `node src/cli.js` 子进程,
 *    直接断言该命令的 stdout/stderr/退出码(含纯内存语义:新进程从空开始)。
 *
 * 2) 跨命令流转验证:add → list → done → list 的状态流转必须在同一进程
 *    内观察(这是纯内存设计的固有约束)。用一个独立的驱动子进程
 *    (node --input-type=module -e)按顺序调用真实的 src/cli.js 的 main(),
 *    走的是产品入口的同一 parseArgs → store → 输出 路径,不重复实现任何
 *    逻辑;驱动代码仅存在于本测试文件,不涉及生产代码。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const exec = promisify(execFile);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'src', 'cli.js');

async function runCli(args) {
  try {
    const { stdout, stderr } = await exec(process.execPath, [cli, ...args]);
    return { stdout, stderr, code: 0 };
  } catch (e) {
    return { stdout: e.stdout, stderr: e.stderr, code: e.code };
  }
}

/**
 * 在一个全新子进程里按顺序执行真实 main(argv) 调用序列,返回 stdout 分行数组。
 */
async function runSequence(steps) {
  const driver = `
    import { main } from ${JSON.stringify(pathToFileURL(cli).href)};
    for (const argv of ${JSON.stringify(steps)}) {
      main(argv);
    }
  `;
  const { stdout } = await exec(process.execPath, ['--input-type=module', '-e', driver], { cwd: root });
  return stdout.split('\n').filter((line) => line !== '');
}

test('e2e: 完整流转 add×2 → list → done → list(同一进程内,真实 main 链路)', async () => {
  const lines = await runSequence([
    ['--add', '买牛奶'],
    ['--add', '写周报'],
    ['--list'],
    ['--done', '1'],
    ['--list'],
  ]);

  assert.deepEqual(lines, [
    'added #1 买牛奶',
    'added #2 写周报',
    '#1 [ ] 买牛奶',
    '#2 [ ] 写周报',
    'done #1 买牛奶',
    '#1 [x] 买牛奶',
    '#2 [ ] 写周报',
  ]);
});

test('e2e: 真实进程 --add 两条(各为新进程,均从 id=1 开始)', async () => {
  assert.deepEqual(
    await runCli(['--add', '买牛奶']),
    { stdout: 'added #1 买牛奶\n', stderr: '', code: 0 },
  );
  assert.deepEqual(
    await runCli(['--add', '写周报']),
    { stdout: 'added #1 写周报\n', stderr: '', code: 0 },
  );
});

test('e2e: 真实进程 --list 为空且退出码 0(纯内存:新进程从空存储开始)', async () => {
  assert.deepEqual(
    await runCli(['--list']),
    { stdout: '', stderr: '', code: 0 },
  );
});

test('e2e: 真实进程 --done 1 在空存储上报 not found、退出码 1', async () => {
  assert.deepEqual(
    await runCli(['--done', '1']),
    { stdout: '', stderr: 'TODO #1 not found\n', code: 1 },
  );
});

test('e2e: 非法参数退出码 1 且 stderr 含 usage', async () => {
  assert.deepEqual(
    await runCli([]),
    { stdout: '', stderr: 'usage: cli --add <text> | --list | --done <id>\n', code: 1 },
  );
});
