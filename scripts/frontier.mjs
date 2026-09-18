#!/usr/bin/env node
/**
 * taskflow frontier — 地图 issue → blocker DAG → 当前可执行批
 *
 * 用法: node scripts/frontier.mjs <map-number> [--verify] [-R owner/repo]
 * 输出: JSON { repo, map, dag, done, open, frontier:[{id,title,body}], waiting, integrity }
 *
 * 契约: 地图 issue 中存在一张表,表头含「票|ticket」列与「阻塞|blocked」列,
 *       票列含 #N,阻塞列为 无/none 或 #N 列表。GitHub issue 状态是唯一事实源。
 */
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const verify = args.includes("--verify");
const rIdx = args.indexOf("-R");
const repoFlag = rIdx >= 0 ? args[rIdx + 1] : null;
const mapNumber = args.find((a) => /^\d+$/.test(a));

if (!mapNumber) {
  console.error("用法: node scripts/frontier.mjs <map-number> [--verify] [-R owner/repo]");
  process.exit(2);
}

function gh(cmd) {
  return execSync(`gh ${cmd}`, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

const repo =
  repoFlag ||
  execSync("git remote get-url origin", { encoding: "utf8" })
    .trim()
    .replace(/^git@github.com:/, "https://github.com/")
    .replace(/\.git$/, "")
    .replace(/^https:\/\/github.com\//, "");

// ---- 配置(.pi/taskflow.json 可覆盖) ----
let cfg = { testCmd: "npm test" };
try {
  const fs = await import("node:fs");
  cfg = { ...cfg, ...JSON.parse(fs.readFileSync(".pi/taskflow.json", "utf8")) };
} catch {
  /* 缺省配置 */
}

// ---- 1. 解析地图表格 → DAG ----
const map = JSON.parse(gh(`issue view ${mapNumber} -R ${repo} --json title,body`));
const dag = {}; // id -> { title, blockers: [id] }
for (const line of map.body.split("\n")) {
  if (!line.trim().startsWith("|")) continue;
  const cells = line.split("|").slice(1, -1).map((c) => c.trim());
  if (cells.length < 2) continue;
  const headerish = (i, re) => re.test(cells[i] || "");
  // 表头行: 定位票列与阻塞列
  if (headerish(0, /票|ticket|task|issue/i) || cells.some((c) => /票|ticket/i.test(c) && /^---/.test(cells[1] || ""))) {
    const tCol = cells.findIndex((c) => /票|ticket|task|issue/i.test(c));
    const bCol = cells.findIndex((c) => /阻塞|blocked|block|depend|依赖/i.test(c));
    if (tCol >= 0 && bCol >= 0) {
      process.env._tf_cols = `${tCol}:${bCol}`;
      continue;
    }
  }
  if (/^-+$/.test((cells[0] || "").replace(/[:\s-]/g, "")) && cells.every((c) => /^[-:\s]*$/.test(c))) continue;
  const cols = (process.env._tf_cols || "1:2").split(":").map(Number);
  const [tCol, bCol] = cols;
  const ticketCell = cells[tCol] || "";
  const m = ticketCell.match(/#(\d+)/);
  if (!m) continue;
  const id = Number(m[1]);
  const blockerCell = cells[bCol] || "";
  const blockers = /无|none|—|--/i.test(blockerCell)
    ? []
    : [...blockerCell.matchAll(/#(\d+)/g)].map((x) => Number(x[1]));
  dag[id] = { title: ticketCell.replace(/#\d+\s*/, ""), blockers, closed: false };
}

// ---- 2. issue 实际状态 ----
const issues = JSON.parse(gh(`issue list -R ${repo} --state all --limit 500 --json number,title,state`));
const state = new Map(issues.map((i) => [i.number, i.state]));
const done = [], open = [];
for (const id of Object.keys(dag).map(Number)) {
  if (state.get(id) === "CLOSED") { done.push(id); dag[id].closed = true; }
  else open.push(id);
}

// ---- 3. frontier / waiting ----
const frontier = [], waiting = [];
for (const id of open) {
  const openBlockers = dag[id].blockers.filter((b) => state.get(b) !== "CLOSED");
  (openBlockers.length === 0 ? frontier : waiting).push(id);
}
for (const id of waiting) {
  dag[id].waitingFor = dag[id].blockers.filter((b) => state.get(b) !== "CLOSED");
}

// ---- 4. frontier 票面(喂给流水线) ----
for (const id of frontier) {
  const v = JSON.parse(gh(`issue view ${id} -R ${repo} --json title,body`));
  dag[id].title = v.title;
  dag[id].body = v.body;
}

// ---- 5. 完整性检查(--verify): 已关票声称测试通过,但当前主干跑不过 → 虚假关票 ----
let integrity = { checked: false };
if (verify && done.length > 0) {
  let testNow = { ok: false, output: "" };
  try {
    const out = execSync(cfg.testCmd, { encoding: "utf8", stdio: "pipe" });
    testNow = { ok: true, output: out.slice(-500) };
  } catch (e) {
    testNow = { ok: false, output: String(e.stdout || e.stderr || e.message).slice(-500) };
  }
  const suspects = [];
  if (!testNow.ok) {
    for (const id of done) {
      const c = JSON.parse(gh(`issue view ${id} -R ${repo} --json comments`));
      const claims = c.comments.some((x) => /green|全绿|passed|通过/i.test(x.body));
      if (claims) suspects.push(id);
    }
  }
  integrity = {
    checked: true,
    testCmd: cfg.testCmd,
    testNow,
    ok: testNow.ok,
    suspects, // 已关且声称测试绿,但主干测试红 → 建议 reopen 重新入队
  };
}

console.log(
  JSON.stringify(
    {
      repo,
      map: { number: Number(mapNumber), title: map.title },
      dag,
      done,
      open,
      frontier: frontier.map((id) => ({ id, title: dag[id].title, body: dag[id].body })),
      waiting: waiting.map((id) => ({ id, waitingFor: dag[id].waitingFor })),
      integrity,
    },
    null,
    2,
  ),
);
