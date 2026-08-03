/**
 * 跑全部检查：npm test
 *
 * 四组：
 *   1. check-links      链接 / 图片 / 协议白名单 / 凭据不落盘
 *   2. check-snippets   生成的 cURL 与 Python 真的执行一遍
 *   3. check-url-params URL 传参签名 / JWT，对着 Python 实现逐字节比对
 *   4. check-prerender  每个路由都有一份能独立打开的 HTML（深链 / SEO 不回归）
 *
 * 前置：site/src/data/site.json 得先生成好（npm run data）；
 * 第 4 组还需要 dist/（npm run build）——没有就跳过，只提示一句。
 * 全程只连本机，不碰线上。
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

// 子脚本里的路径都是相对 site/ 写的，工作目录统一在这儿定下来，
// 于是从仓库根跑 `npm test` 和直接进 site/ 跑，结果一致。
const SITE = path.resolve(import.meta.dirname, "..");

if (!fs.existsSync(path.join(SITE, "src/data/site.json"))) {
  console.error("✗ 缺 site/src/data/site.json，先跑：npm run data");
  process.exit(1);
}

function node(args) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, args, { stdio: "inherit", cwd: SITE });
    p.on("exit", (code) => resolve(code ?? 1));
  });
}

let failed = 0;
const section = (name) => console.log(`\n──── ${name} ────`);

section("链接 / 图片 / 协议");
failed += (await node(["test/check-links.mjs"])) === 0 ? 0 : 1;

section("请求代码");
failed += (await node(["test/check-snippets.mjs"])) === 0 ? 0 : 1;

section("URL 传参签名");
failed += (await node(["test/check-url-params.mjs"])) === 0 ? 0 : 1;

section("预渲染产物");
if (fs.existsSync(path.join(SITE, "..", "dist"))) {
  failed += (await node(["test/check-prerender.mjs"])) === 0 ? 0 : 1;
} else {
  console.log("  ! 没有 dist/，跳过（先跑 npm run build 才检查预渲染）");
}

console.log(failed === 0 ? "\n全部通过" : `\n有 ${failed} 组检查失败`);
process.exit(failed === 0 ? 0 : 1);
