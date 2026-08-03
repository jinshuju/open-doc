#!/usr/bin/env node
/**
 * 产出纯静态站到 dist/，直接扔 GitHub Pages / OSS / Nginx —— 不需要任何服务端。
 *
 *   node site/scripts/build-static.mjs [--out=目录] [--base=/] [--site-url=https://open.jinshuju.net]
 *
 * 输出目录只能用 --out= 指定，不接受位置参数——因为下面会把输出目录整个删掉重建，
 * 用位置参数太容易误删别的目录。删除前还会做一次安全检查。
 *
 * 每个路由输出一份独立 HTML（<route>/index.html），里面已经带着正文、目录、面包屑
 * 和这一页自己的 title / description / canonical。这样：
 *   - 站外深链、搜索收录、没开 JS 的读者，拿到的都是完整页面
 *   - URL 与原 Docusaurus 站一字不差，老链接不会失效
 * app.js 加载后接管站内点击走 pushState，体验仍是单页应用。
 *
 * 顺带产出 sitemap.xml / robots.txt / llms.txt / llms-full.txt
 * （后两个替代原站的 docusaurus-plugin-llms）。
 *
 * 之所以不需要服务端：金数据 API 自己开了 CORS
 * （Access-Control-Allow-Origin: *，且允许 authorization 头），
 * 所以「在线调试」是浏览器直连 jinshuju.net，凭据不经第三方。
 *
 * 前置：先跑 scripts/build-data.mjs 生成 src/data/site.json。
 */

import fs from "node:fs";
import path from "node:path";
import { renderPage } from "../src/page.js";
import { createMarkdown } from "../public/markdown.js";
import { createNav } from "../public/nav.js";

const HERE = path.resolve(import.meta.dirname, "..");
const DATA = path.join(HERE, "src", "data", "site.json");
const MARKER = ".build-static-output";

const SITE_TITLE = "金数据开放平台";
const SITE_DESC = "金数据开放平台 API、Webhook、URL 传参等系统集成能力文档";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("-"));
if (positional.length) {
  console.error(
    `不接受位置参数 “${positional[0]}”。输出目录请用 --out=<目录> 指定。\n` +
      "（本脚本会清空输出目录，用位置参数太容易误删别的目录）"
  );
  process.exit(1);
}
function flag(name, fallback) {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? fallback : hit.slice(name.length + 3);
}

const OUT = path.resolve(flag("out", path.join(HERE, "..", "dist")));
// 部署基路径：预渲染出来的链接都拼它。默认根路径（open.jinshuju.net 就是根）。
const trimmedBase = flag("base", "/").replace(/^\/+|\/+$/g, "");
const BASE = trimmedBase ? `/${trimmedBase}/` : "/";
const SITE_URL = flag("site-url", "https://open.jinshuju.net").replace(/\/+$/, "");

if (!fs.existsSync(DATA)) {
  console.error("缺少 src/data/site.json，先跑：npm run data");
  process.exit(1);
}

/* ---------------- 清空输出目录（带安全检查） ---------------- */

// 只允许清空「空目录」或「上次本脚本产出的目录」
if (fs.existsSync(OUT)) {
  const entries = fs.readdirSync(OUT);
  const isOurs = entries.includes(MARKER);
  if (entries.length && !isOurs) {
    console.error(
      `拒绝清空 ${OUT}\n` +
        "该目录非空，且不含本脚本的标记文件，看起来不是构建产物目录。\n" +
        `目录内容：${entries.slice(0, 8).join(", ")}${entries.length > 8 ? " …" : ""}\n` +
        "请换一个输出目录，或先手动清空它。"
    );
    process.exit(1);
  }
  fs.rmSync(OUT, { recursive: true, force: true });
}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, MARKER), "由 site/scripts/build-static.mjs 生成，可安全删除。\n");

const site = JSON.parse(fs.readFileSync(DATA, "utf8"));
const routes = Object.keys(site.docs);

function writeFile(rel, body) {
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, body);
}

/* ---------------- 预渲染 ---------------- */

// 渲染器与浏览器共用同一份实现（public/markdown.js、public/nav.js），
// 所以产物里的 HTML 与 JS 接管后生成的 DOM 是同一套，不会出现两种排版。
const state = { docs: site.docs, collapsed: {}, current: null };
const md = createMarkdown({ site: BASE, assetBase: BASE, state });
const nav = createNav({ state, esc: md.esc, site: BASE });

// meta description：取正文第一段能读的文字，去掉 markdown 标记。
// 接口页的摘要写在标题下面的引用块里（「> API使用者，可以通过本接口，……」），
// 所以引用块要当正文用，不能跳过。
function describe(doc) {
  const lines = String(doc.markdown || "").split("\n");
  let inFence = false;
  for (const raw of lines) {
    if (/^\s*```/.test(raw)) { inFence = !inFence; continue; }
    if (inFence) continue;
    let t = raw.trim();
    if (!t) continue;
    if (/^#/.test(t)) continue;                    // 标题
    if (/^\|/.test(t)) continue;                   // 表格
    if (/^[-*+]\s/.test(t) || /^\d+\.\s/.test(t)) continue; // 列表
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) continue;         // 分隔线
    if (/^>/.test(t)) t = t.replace(/^>\s?/, "");  // 引用块正是摘要
    // 只有一个链接的行（比如「[V1 Basic 认证方式](/api_v1/authentication)」）不是摘要
    if (/^\[[^\]]*\]\([^)]*\)$/.test(t)) continue;
    const plain = t
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[`*_]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (plain.length < 12) continue; // 太短的一行当不了摘要，继续往下找
    return plain.length > 150 ? plain.slice(0, 150) + "…" : plain;
  }
  return `${doc.title} —— ${SITE_DESC}`;
}

let pages = 0;
for (const route of routes) {
  const doc = site.docs[route];
  state.current = doc;
  md.resetRender(); // 标题去重表按页重置，否则第二页的锚点会被加上 -1 后缀

  const bodyHtml = md.renderMarkdown(doc.markdown, true);
  // 与 app.js 的 route() 保持同一套结构；顶部那两个按钮要 JS 才有用，预渲染时不放，
  // 免得没开 JS 的读者点到死按钮（app.js 一加载就会把它们补上）。
  const docHtml =
    '<div class="doc-head' + (route === "" ? " no-crumbs" : "") + '">' +
    nav.breadcrumbsHtml(doc) +
    '<div class="doc-head-actions"></div></div>' +
    '<div class="markdown" id="md">' + bodyHtml + "</div>";

  const html = renderPage({
    css: BASE + "app.css",
    js: BASE + "app.js",
    logo: BASE + "img/logo.png",
    route,
    base: BASE,
    title: doc.pageTitle, // 由 build-data.mjs 定稿，app.js 用的是同一个字段
    description: describe(doc),
    siteUrl: SITE_URL,
    menuHtml: nav.menuHtml(site.nav, 0, "").html,
    docHtml,
  });

  writeFile(route === "" ? "index.html" : path.join(route, "index.html"), html);
  pages++;
}

/* ---------------- 前端资源 ---------------- */

for (const f of ["app.css", "app.js", "markdown.js", "nav.js"]) {
  fs.copyFileSync(path.join(HERE, "public", f), path.join(OUT, f));
}

// 图片（手写递归拷贝：fs.cpSync 在某些挂载盘上会因为保留属性而失败）
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}
const img = path.join(HERE, "public", "img");
if (fs.existsSync(img)) copyDir(img, path.join(OUT, "img"));

// 文档数据（app.js 启动后 fetch 的就是这个，供目录搜索和在线调试面板使用）
fs.copyFileSync(DATA, path.join(OUT, "data.json"));

/* ---------------- sitemap / robots ---------------- */

const lastmod = String(site.generatedAt || "").slice(0, 10);
writeFile(
  "sitemap.xml",
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    routes
      .slice()
      .sort()
      .map(
        (r) =>
          "  <url><loc>" + SITE_URL + "/" + r + "</loc>" +
          (lastmod ? "<lastmod>" + lastmod + "</lastmod>" : "") +
          "</url>"
      )
      .join("\n") +
    "\n</urlset>\n"
);

writeFile("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

/* ---------------- llms.txt（替代 docusaurus-plugin-llms） ---------------- */

// 按导航树的顺序走，分组标题沿用 sidebars.ts 里的 label
function llmsIndex() {
  const out = [`# ${SITE_TITLE}文档`, "", `> ${SITE_DESC}`, ""];
  (function walk(items) {
    for (const it of items) {
      if (it.type === "category") {
        out.push(`## ${it.label}`, "");
        walk(it.items);
        out.push("");
        continue;
      }
      const doc = site.docs[it.route];
      if (!doc) continue;
      out.push(`- [${doc.title}](${SITE_URL}/${it.route}): ${describe(doc)}`);
    }
  })(site.nav);
  return out.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}

function llmsFull() {
  const parts = [`# ${SITE_TITLE}文档`, "", `> ${SITE_DESC}`, ""];
  (function walk(items) {
    for (const it of items) {
      if (it.type === "category") { walk(it.items); continue; }
      const doc = site.docs[it.route];
      if (!doc) continue;
      // 标题这里已经写了，正文开头那个 h1 就别再重复一遍
      const body = String(doc.markdown || "").trim().replace(/^#\s+.*\r?\n+/, "");
      parts.push("---", "", `# ${doc.title}`, "", `来源：${SITE_URL}/${it.route}`, "", body, "");
    }
  })(site.nav);
  return parts.join("\n") + "\n";
}

writeFile("llms.txt", llmsIndex());
writeFile("llms-full.txt", llmsFull());

/* ---------------- GitHub Pages 兜底 ---------------- */

// 别把下划线开头的路径当 Jekyll 处理
writeFile(".nojekyll", "");

// 每个路由都有真实文件，404 只会落在真正不存在的地址上：给一个静态页面就够了，
// 不挂 app.js —— 否则它会把首个文档当结果渲染出来，变成软 404。
writeFile(
  "404.html",
  `<!doctype html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>页面不存在 | ${SITE_TITLE}</title>
<link rel="icon" href="${BASE}img/logo.png">
<link rel="stylesheet" href="${BASE}app.css">
</head>
<body>
<div class="notfound">
  <h1>404</h1>
  <p>这个地址下没有文档。</p>
  <p><a href="${BASE}">回到文档首页</a></p>
</div>
</body>
</html>
`
);

/* ---------------- 收尾 ---------------- */

function size(p) {
  let total = 0;
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    const full = path.join(p, e.name);
    total += e.isDirectory() ? size(full) : fs.statSync(full).size;
  }
  return total;
}

console.log(`✓ ${path.relative(process.cwd(), OUT) || OUT}`);
console.log(`  ${pages} 个路由各一份 HTML，共 ${(size(OUT) / 1024 / 1024).toFixed(1)} MB`);
console.log(`  基路径 ${BASE}，站点地址 ${SITE_URL}`);
console.log("  纯静态，直接托管即可；在线调试走浏览器直连，无需服务端");
