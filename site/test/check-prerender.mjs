/**
 * 预渲染产物：每个路由是不是真的有一份能独立打开的 HTML。
 *
 *   node test/check-prerender.mjs [--out=目录]      # 默认 ../dist
 *
 * 这组检查盯的是「替换 Docusaurus 之后不能丢的东西」：
 *   - 51 个路由各有一份 index.html，URL 与原站一字不差（老链接不失效）
 *   - 每页 title / description / canonical 都是自己的，且 title 不重复
 *   - 正文已经写进 HTML（不靠 JS 才出现），爬虫和没开 JS 的读者都能看到
 *   - 目录也在 HTML 里，爬虫能顺着链接走完整站
 *   - 不再有 hash 路由残留（#/xxx）
 *   - sitemap.xml / robots.txt / llms.txt / llms-full.txt 都在，且 sitemap 覆盖全部路由
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const outFlag = args.find((a) => a.startsWith("--out="));
const OUT = path.resolve(outFlag ? outFlag.slice("--out=".length) : "../dist");

if (!fs.existsSync(OUT)) {
  console.error(`✗ 找不到构建产物 ${OUT}，先跑：npm run build`);
  process.exit(1);
}

// base / siteUrl 从构建产物自己的标记文件里读，别在这儿写死：
// 上游是根路径，fork 的项目站挂在 /open-doc/ 子路径下，两种构建都要能过。
const info = JSON.parse(fs.readFileSync(path.join(OUT, ".build-static-output"), "utf8"));
const BASE = info.base;
const SITE_URL = info.siteUrl;
console.log(`产物基路径 ${BASE}，站点地址 ${SITE_URL}`);

const site = JSON.parse(fs.readFileSync("src/data/site.json", "utf8"));
const routes = Object.keys(site.docs);

const results = [];
function check(ok, name, detail) {
  results.push({ ok: !!ok, name });
  if (!ok) console.log(`  ✗ ${name}\n      ${detail}`);
}

const pick = (html, re) => { const m = html.match(re); return m ? m[1] : null; };

console.log(`逐个路由检查（${routes.length} 个）：`);
const titles = new Map();
for (const route of routes) {
  const rel = route === "" ? "index.html" : path.join(route, "index.html");
  const file = path.join(OUT, rel);
  if (!fs.existsSync(file)) { check(false, `${rel} 存在`, `文件不存在，深链 /${route} 会 404`); continue; }
  const html = fs.readFileSync(file, "utf8");
  const label = route === "" ? "(首页)" : route;

  const title = pick(html, /<title>([^<]*)<\/title>/);
  check(title && title.length > 2, `${label} 有 title`, `拿到 ${JSON.stringify(title)}`);
  if (title) {
    check(!titles.has(title), `${label} title 不与别页重复`, `与 ${titles.get(title)} 撞了：${title}`);
    if (!titles.has(title)) titles.set(title, label);
  }

  const desc = pick(html, /<meta name="description" content="([^"]*)"/);
  check(desc && desc.length > 8, `${label} 有 description`, `拿到 ${JSON.stringify(desc)}`);

  const canonical = pick(html, /<link rel="canonical" href="([^"]*)"/);
  check(canonical === `${SITE_URL}/${route}`, `${label} canonical 正确`,
    `期望 ${SITE_URL}/${route}，拿到 ${canonical}`);

  check(pick(html, /data-route="([^"]*)"/) === route, `${label} data-route 正确`,
    `app.js 靠它反推部署基路径，拿到 ${pick(html, /data-route="([^"]*)"/)}`);

  // 正文必须已经在 HTML 里，而不是等 JS 填
  const body = pick(html, /<div class="markdown" id="md">([\s\S]*?)<\/div>\s*<\/div>/) ||
    pick(html, /<div class="markdown" id="md">([\s\S]*)$/);
  const text = String(body || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  check(text.length > 80, `${label} 正文已预渲染`, `去掉标签后只有 ${text.length} 个字符`);
  check(/<h1>/.test(html), `${label} 有 h1`, "预渲染的正文里找不到 <h1>");

  // 目录也要在 HTML 里，爬虫才能走完链接图；顺便验证链接都拼上了部署基路径
  const anyMenu = (html.match(/class="menu-link[^"]*" href="/g) || []).length;
  const based = (html.match(new RegExp(`class="menu-link[^"]*" href="${BASE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g")) || []).length;
  check(anyMenu === routes.length, `${label} 目录含全部 ${routes.length} 条链接`, `只找到 ${anyMenu} 条`);
  check(based === anyMenu, `${label} 目录链接都拼上了基路径 ${BASE}`,
    `${anyMenu} 条里只有 ${based} 条以 ${BASE} 开头`);

  check(!html.includes('href="#/'), `${label} 无 hash 路由残留`, "还能找到 href=\"#/");
}

console.log("站点级产物：");
for (const f of ["sitemap.xml", "robots.txt", "llms.txt", "llms-full.txt", ".nojekyll", "404.html",
  "app.css", "app.js", "markdown.js", "nav.js", "data.json"]) {
  check(fs.existsSync(path.join(OUT, f)), `${f} 存在`, "构建产物里缺这个文件");
}

const sitemap = fs.readFileSync(path.join(OUT, "sitemap.xml"), "utf8");
for (const route of routes) {
  check(sitemap.includes(`<loc>${SITE_URL}/${route}</loc>`), `sitemap 收录 /${route}`, "sitemap.xml 里没有这条");
}

const llms = fs.readFileSync(path.join(OUT, "llms.txt"), "utf8");
check(llms.split("\n").filter((l) => l.startsWith("- [")).length === routes.length,
  `llms.txt 列出全部 ${routes.length} 篇`,
  `只列了 ${llms.split("\n").filter((l) => l.startsWith("- [")).length} 篇`);

// 404 不该被索引，也不该把首个文档当结果渲染出来（软 404）
const notFound = fs.readFileSync(path.join(OUT, "404.html"), "utf8");
check(/name="robots" content="noindex"/.test(notFound), "404 页标了 noindex", "缺 noindex");
check(!notFound.includes("app.js"), "404 页不挂 app.js", "挂了 app.js 会渲染出首个文档，变成软 404");

const failed = results.filter((x) => !x.ok);
console.log(`  —— ${results.length} 项，失败 ${failed.length} 项`);
process.exit(failed.length === 0 ? 0 : 1);
