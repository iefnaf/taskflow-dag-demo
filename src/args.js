/**
 * CLI 参数解析:与存储解耦的纯函数。
 */
const USAGE = 'usage: cli --add <text> | --list | --done <id>';

export function parseArgs(argv) {
  if (!Array.isArray(argv) || argv.length === 0) {
    throw new Error(USAGE);
  }

  const [cmd, value] = argv;

  if (argv.length > 2) {
    throw new Error(USAGE);
  }

  if (cmd === '--add') {
    if (value === undefined || value === '') {
      throw new Error(USAGE);
    }
    return { action: 'add', text: value };
  }

  if (cmd === '--list') {
    if (argv.length !== 1) {
      throw new Error(USAGE);
    }
    return { action: 'list' };
  }

  if (cmd === '--done') {
    const id = Number(value);
    if (value === undefined || !Number.isInteger(id) || id < 1) {
      throw new Error(USAGE);
    }
    return { action: 'done', id };
  }

  throw new Error(USAGE);
}
