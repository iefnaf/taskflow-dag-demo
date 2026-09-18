# taskflow 驱动协议

对**任意** map issue(含「票|阻塞」表格)按 DAG 分阶段执行子票。GitHub issue 状态是唯一事实源;本协议幂等,中断后从头重跑即可续上。

## 输入
- map issue 号(如 `6`);repo 默认取 origin remote。
- 配置: `.pi/taskflow.json` → `{ testCmd, baseBranch, branchPrefix, worktreeDir, maxRounds, merge }`(缺省: `npm test` / `main` / `tf` / `.wt` / `3` / `ff`)。

## 主循环
1. **算 frontier**: `node scripts/frontier.mjs <map> --verify` → JSON。
2. **完整性异常处理**: `integrity.ok === false` 且 `suspects` 非空(已关票声称测试绿但主干测试红 = 虚假关票):
   - 逐张 `gh issue reopen <id> -R <repo>`,评论附证据(哪个测试命令、什么输出、缺什么文件);
   - 回到 1 重算 frontier。
3. **frontier 空**: 全量跑一次 `testCmd` 于主干;向用户汇报地图最终状态(每票轮数/结果),结束。
4. **备批**: 执行层用 pi-herdr-agents(需在 herdr 内运行,HERDR_ENV=1):每张票一个可见 pane,不预建 worktree(managed worktree 由 subagent 工具创建)。
5. **跑阶段**(每张票的执行全部在 herdr pane 中可见,可 focus/attach 接管):
   a. 实现: `subagent({ name: "tf<id>-impl", agent: "worker", cwd: <仓库绝对路径>, worktree: { branch: "tf/<id>", base: <baseBranch> }, task: 票面全文 + 纪律(只改边界内文件;完成必须 git commit(信息以 "ticket #<id>" 开头);不 push/merge/切分支/删worktree) })`;
   b. 收到 subagent_result 后,外层在该票 worktree 路径(由结果或 worktree_list 得)跑 `testCmd`(bash,确定性门);
   c. 评审: `subagent({ name: "tf<id>-review", agent: "reviewer", cwd: <该票worktree绝对路径>, task: 审查 git diff <baseBranch>...HEAD 对照票面交付/边界/验收,末尾输出 VERDICT: lgtm 或 VERDICT: iterate + issues })`;
   d. 打回: iterate 时用 `subagent_send` 把 issues 发回 impl(或重开 worker 进同一 worktree),循环 ≤ maxRounds;
   e. 阶段 barrier: 等本批全部票出结果再进入回写。
6. **过关回写**(仅对过关票,按 id 升序;merge 在仓库主 checkout 操作,分支已在本地):
   a. 批内首张 `git merge --ff-only tf/<id>`;后续票先 `git rebase <baseBranch> tf/<id>` 再 ff-only(冲突 → 停止,上报用户,不关票);
   b. 主干重跑 `testCmd`,绿才继续;
   c. `git push origin <baseBranch>`;
   d. `gh issue close <id> -R <repo> -c "taskflow: review gate + <testCmd> 过关(<轮数>轮),merged <短SHA>"`;
   e. `worktree_remove` 清理该票 managed worktree。
7. **未过关**: 不关票;向用户转述评审 issues 与测试输出;**停止循环**等人工决定(重跑/改票/放弃)。
8. 回到 1。

## 纪律
- 关票只凭第 6 步证据(SHA 在主干 + 主干测试绿),绝不凭 agent 口头声称。
- 阶段 barrier:第 5 步收齐全部结果后才进第 6 步;同批票互不等待对方过关。
- 不越边界:每票只动票面「边界」内的文件;评审 iterate 含越界即打回。
- GitHub 读写、合并、测试门全在外层本会话;pane 内子代理只做实现/评审,不 gh 不 push。
- 可见性:一切子代理跑在 herdr pane(Agents tab),用户可随时 focus/attach/interrupt。
