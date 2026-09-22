// 兼容性入口:Node 22+ 的测试 runner 不再把目录参数展开成测试文件,
// 而是把 `test/` 当作模块入口解析。package.json 的 scripts.test 按票面
// 固定为 `node --test test/`,因此这里作为目录默认入口(index.js)运行冒烟测试。
import "./sanity.test.js";
