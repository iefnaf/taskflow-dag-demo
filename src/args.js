/**
 * CLI 参数解析 —— 与存储解耦。
 *
 * parseArgs(argv) 接收 process.argv.slice(2) 形式的字符串数组,
 * 返回 { action, ... } 形式的指令对象;非法输入抛错并带 usage 提示。
 */

const USAGE =
  '用法: node src/cli.js --add <text> | --list | --done <id>';

export function parseArgs(argv) {
  if (!Array.isArray(argv) || argv.length === 0) {
    throw new Error(`缺少参数。${USAGE}`);
  }

  const [first, second] = argv;

  if (first === '--add') {
    if (argv.length !== 2) {
      throw new Error(`--add 需要恰好一个文本参数。${USAGE}`);
    }
    return { action: 'add', text: second };
  }

  if (first === '--list') {
    if (argv.length !== 1) {
      throw new Error(`--list 不接受额外参数。${USAGE}`);
    }
    return { action: 'list' };
  }

  if (first === '--done') {
    if (argv.length !== 2) {
      throw new Error(`--done 需要恰好一个数字参数。${USAGE}`);
    }
    const id = Number(second);
    if (!Number.isInteger(id) || id < 1) {
      throw new Error(`--done 需要正整数 id,收到: ${JSON.stringify(second)}。${USAGE}`);
    }
    return { action: 'done', id };
  }

  throw new Error(`未知参数: ${JSON.stringify(first)}。${USAGE}`);
}

/**
 * 解析完整 argv 为命令序列:每个 --add/--list/--done 开启一个命令段,
 * 其后的非 flag 参数归属于该段;每段仍用 parseArgs 校验。
 *
 * 这样内存版存储可以在单个进程内依次执行多条命令
 * (例:`--add "买牛奶" --add "写代码" --list`)。
 */
export function parseCommands(argv) {
  if (!Array.isArray(argv) || argv.length === 0) {
    return [parseArgs(argv)]; // 触发缺参报错(含 usage)
  }

  const segments = [];
  let current = null;
  for (const token of argv) {
    if (token === '--add' || token === '--list' || token === '--done') {
      if (current) segments.push(current);
      current = [token];
    } else if (current) {
      current.push(token);
    } else {
      // 以非 flag 开头:交给 parseArgs 统一抛「未知参数」
      return [parseArgs([token])];
    }
  }
  segments.push(current);
  return segments.map((segment) => parseArgs(segment));
}
