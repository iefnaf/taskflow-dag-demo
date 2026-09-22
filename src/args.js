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
