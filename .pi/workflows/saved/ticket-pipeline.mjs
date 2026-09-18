export const meta = {
  name: 'ticket-pipeline',
  description: '一个 frontier 阶段的票级流水线:实现(thread,worktree 内)→评审(schema 裁决)→测试(真命令)→打回循环',
  phases: [{ title: '执行' }],
}

// args: {
//   tickets: [{ id, title, body, worktree(绝对路径), branch }],
//   baseBranch, testCmd, maxRounds(默认3)
// }

const verdictSchema = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['lgtm', 'iterate'] },
    issues: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
  required: ['verdict', 'issues'],
}
const testSchema = {
  type: 'object',
  properties: { passed: { type: 'boolean' }, summary: { type: 'string' } },
  required: ['passed', 'summary'],
}

async function safeAgent(prompt, opts) {
  try {
    return await agent(prompt, opts)
  } catch (e) {
    log('agent 失败: ' + opts.label + ' — ' + (e && e.message ? e.message : String(e)))
    return null
  }
}

function implPrompt(t, round, feedback) {
  return [
    '你是实现者,负责在当前工作目录(已是为本票准备的隔离 git worktree)完成一张 GitHub 票。',
    '',
    '票 #' + t.id + ': ' + t.title,
    '---',
    t.body,
    '---',
    '',
    round === 0
      ? '从零实现,遵守票内全部「交付」「边界」「验收」要求;参考仓库 README 了解项目约定。'
      : '这是第 ' + (round + 1) + ' 轮。评审/测试反馈如下,针对性修复(不要推倒重来,可 git log 看自己上一轮提交):\n' + feedback,
    '',
    '规则: 只改本票边界内的文件;完成后必须 git add -A && git commit(信息以 "ticket #' + t.id + '" 开头);不 push;不关票(关票由外层负责)。',
  ].join('\n')
}

function reviewPrompt(t, baseBranch) {
  return [
    '你是独立评审(fresh eyes),审查当前工作目录(git worktree)中针对下述票的改动。不要修改任何文件。',
    '',
    '票 #' + t.id + ': ' + t.title,
    '验收要点: 票内「交付」「边界」「验收」三条全部满足才算 lgtm。',
    '',
    '步骤: git log --oneline ' + baseBranch + '..HEAD 看提交;git diff ' + baseBranch + '...HEAD 看全量改动;逐文件读改动;核对票面每条交付项。',
    '严格但公正:边界越界(改了不属于本票的文件)、缺测试、验收不满足 → iterate 并给出具体 issues;只在确实达标时 lgtm。',
  ].join('\n')
}

function testPrompt(testCmd) {
  return [
    '你是测试执行员。在当前工作目录原样执行: ' + testCmd,
    '只如实报告:命令退出码与输出摘要。不许修代码,不许重试别的写法,不许美化结果。',
  ].join('\n')
}

phase('执行')
log('frontier 批: ' + args.tickets.map((t) => '#' + t.id).join(', ') + ' · testCmd=' + args.testCmd)

const results = await parallel(
  args.tickets.map((t) => () =>
    (async () => {
      const maxRounds = args.maxRounds || 3
      let feedback = '', history = []
      for (let round = 0; round < maxRounds; round++) {
        const impl = await safeAgent(implPrompt(t, round, feedback), {
          label: 'impl:#' + t.id + ':' + round,
          thread: 'impl-' + t.id,          // 同一实现者,打回保留上下文
          cwd: t.worktree,                 // 外层预建的票级隔离 worktree
        })
        const review = await safeAgent(reviewPrompt(t, args.baseBranch), {
          label: 'review:#' + t.id + ':' + round,
          cwd: t.worktree,
          schema: verdictSchema,
        })
        const test = await safeAgent(testPrompt(args.testCmd), {
          label: 'test:#' + t.id + ':' + round,
          cwd: t.worktree,
          schema: testSchema,
        })
        history.push({
          round,
          implDone: impl !== null,
          review: review ? review.verdict : null,
          testPassed: test ? test.passed : null,
        })
        // fail-closed:评审/测试结果缺失按不通过处理
        if (review && review.verdict === 'lgtm' && test && test.passed === true) {
          return { id: t.id, branch: t.branch, passed: true, rounds: round + 1, history }
        }
        feedback = [
          review ? (review.verdict === 'lgtm' ? null : '评审(iterate): ' + (review.issues || []).join('; ')) : '评审结果缺失(按不通过处理)',
          test ? (test.passed ? null : '测试未过: ' + test.summary) : '测试结果缺失(按不通过处理)',
        ]
          .filter(Boolean)
          .join('\n')
        log('#' + t.id + ' 第' + (round + 1) + '轮未过 → ' + (round + 1 < maxRounds ? '打回' : '停止'))
      }
      return { id: t.id, branch: t.branch, passed: false, rounds: maxRounds, feedback, history }
    })(),
  ),
)

return { stage: args.tickets.map((t) => t.id), results }
