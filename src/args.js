const USAGE = 'usage: todo [--add <text> | --list | --done <id>]'

const FLAGS = ['--add', '--list', '--done']

/**
 * 解析命令行参数(与存储层解耦)。
 *
 * @param {string[]} argv - process.argv.slice(2) 形式的参数数组
 * @returns {{ action: 'add', text: string } | { action: 'list' } | { action: 'done', id: number }}
 *   解析后的命令对象
 * @throws {Error} 未知参数、非法组合或缺参数时抛出,错误信息包含 usage 提示
 */
export function parseArgs(argv) {
  if (!Array.isArray(argv)) {
    throw new Error(`parseArgs expects an array, got ${typeof argv}. ${USAGE}`)
  }

  let parsed = null

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (!FLAGS.includes(arg)) {
      throw new Error(`unknown argument: ${arg}. ${USAGE}`)
    }

    if (parsed !== null) {
      throw new Error(`cannot combine commands: ${arg}. ${USAGE}`)
    }

    if (arg === '--list') {
      parsed = { action: 'list' }
      continue
    }

    const value = argv[++i]
    if (value === undefined || FLAGS.includes(value)) {
      throw new Error(`${arg} requires a value. ${USAGE}`)
    }

    if (arg === '--add') {
      parsed = { action: 'add', text: value }
    } else {
      const id = Number(value)
      if (!Number.isInteger(id) || id < 1) {
        throw new Error(`--done expects a positive integer id, got "${value}". ${USAGE}`)
      }
      parsed = { action: 'done', id }
    }
  }

  if (parsed === null) {
    throw new Error(`no command given. ${USAGE}`)
  }

  return parsed
}
