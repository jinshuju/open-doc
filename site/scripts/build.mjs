#!/usr/bin/env node
/**
 * 一步构建：先从 docs/ 生成数据，再产出静态站。
 *
 *   npm run build                                    # 读本仓库的 docs/，产出 dist/
 *   npm run build -- --out=public-dist               # 换输出目录
 *   npm run build -- --base=/repo-name/              # 部署在子路径下（GitHub Pages 项目站）
 *   npm run build -- --site-url=https://example.com  # canonical / sitemap 用的站点地址
 *   npm run build -- /path/to/another-copy           # 显式指定内容仓库路径
 *
 * 单独一个入口的原因：`npm run a && b -- 参数` 里的参数只会传给链条最后一个命令，
 * 很容易把「仓库路径」误传成「输出目录」。这里统一收口：
 * 位置参数给 build-data，`--` 开头的选项给 build-static。
 */

import { spawnSync } from "node:child_process";
import path from "node:path";

const HERE = path.resolve(import.meta.dirname);
const args = process.argv.slice(2);

const flags = args.filter((a) => a.startsWith("-"));
const repo = args.find((a) => !a.startsWith("-"));

function run(script, scriptArgs) {
  const r = spawnSync(
    process.execPath,
    ["--experimental-strip-types", path.join(HERE, script), ...scriptArgs],
    { stdio: "inherit" }
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run("build-data.mjs", repo ? [repo] : []);
run("build-static.mjs", flags);
