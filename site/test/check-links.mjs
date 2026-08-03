/**
 * 正文里的链接与图片：地址是否落到本站路由上、目标页是否真实存在、
 * 图片文件是否真的存在、恶意协议是否被拦、凭据有没有落盘。
 *
 *   node test/check-links.mjs        # 需要先 npm run data 生成 site.json
 *
 * 测的是真代码：直接 import public/markdown.js —— 浏览器和构建脚本用的就是这一份。
 */
import fs from "node:fs";
import { createMarkdown } from "../public/markdown.js";

const site = JSON.parse(fs.readFileSync("src/data/site.json", "utf8"));
const routes = new Set(Object.keys(site.docs));

// 模拟「部署在子路径 + 资源在 CDN 上」——这是最容易出错的组合，
// 线上就踩过一次：图片用站点路径去拼，结果落到 worker 兜底页返回 HTML。
const SITE = "/jinshuju-open-api-docs/";
const ASSET_BASE = "https://static.example.net/assets/lf/jinshuju-open-api-docs/v1/";
const { safeLinkHref, safeImgSrc } = createMarkdown({
  site: SITE,
  assetBase: ASSET_BASE,
  state: { docs: site.docs },
});

const results = [];
function check(ok, name, detail) {
  results.push({ ok: !!ok, name });
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok ? "" : "\n      " + detail}`);
}

// ---- 收集正文里的链接和图片 ----
const linkRe = /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const links = [];
for (const [route, doc] of Object.entries(site.docs)) {
  let m;
  const md = String(doc.markdown || "");
  while ((m = linkRe.exec(md)) !== null) links.push({ page: route, isImg: m[1] === "!", target: m[3] });
}

console.log("内部文档链接（应落到 站点基路径 + 路由）：");
const internalLinks = links.filter((l) => !l.isImg && !/^(https?:|mailto:|tel:|#)/i.test(l.target));
for (const l of internalLinks) {
  const href = String(safeLinkHref(l.target));
  check(href.startsWith(SITE), `${l.target} → ${href}`,
    `应以站点基路径 ${SITE} 开头（hash 路由已经废弃，别再生成 #/）`);
  const route = href.slice(SITE.length).split("#")[0];
  check(routes.has(route), `${l.target} → ${href}`,
    `目标页 "${route}" 不在 site.json 里（出现在 ${l.page}）`);
}
if (!internalLinks.length) console.log("  （没有需要改写的内部链接）");

console.log("内部图片：");
const internalImgs = links.filter((l) => l.isImg && !/^(https?:|data:)/i.test(l.target));
for (const l of internalImgs) {
  const src = String(safeImgSrc(l.target));
  check(src.startsWith(ASSET_BASE), `${l.target} 用资源基地址而不是站点路径`,
    `得到 ${src}，应以 ${ASSET_BASE} 开头（用站点路径拼会落到兜底页面）`);
  const local = src.replace(ASSET_BASE, "public/");
  check(fs.existsSync(local), `${l.target} → ${src}`, `本地文件不存在：${local}（出现在 ${l.page}）`);
}
if (!internalImgs.length) console.log("  （没有需要改写的内部图片）");

console.log("锚点改写（docsify 的 ?id= 要变成 hash 片段）：");
const withAnchor = internalLinks.filter((l) => l.target.includes("?id="));
for (const l of withAnchor) {
  const href = String(safeLinkHref(l.target));
  const want = decodeURIComponent(l.target.split("?id=")[1]);
  check(href.endsWith("#" + want), `${l.target} → ${href}`, `片段应为 #${want}`);
}
if (!withAnchor.length) console.log("  （数据里暂时没有 ?id= 写法）");

console.log("站点根链接：");
check(safeLinkHref("/") === SITE, `/ → ${SITE}`, `得到 ${safeLinkHref("/")}`);

console.log("恶意协议必须被拦（返回 null，退化成纯文本）：");
for (const a of [
  "javascript:alert(1)",
  "JavaScript:alert(1)",
  "javascript&#58;alert(1)",
  "javascript&#x3a;alert(1)",
  "java\tscript:alert(1)",
  " javascript:alert(1)",
  "vbscript:msgbox(1)",
  "data:text/html,<script>alert(1)</script>",
]) {
  check(safeLinkHref(a) === null, JSON.stringify(a), `没拦住，返回了 ${JSON.stringify(safeLinkHref(a))}`);
}

console.log("正常协议必须放行：");
for (const a of ["https://jinshuju.net", "http://example.com/x", "mailto:a@b.com", "tel:123", "#anchor"]) {
  check(safeLinkHref(a) !== null, a, "被误拦了");
}

console.log("图片协议：");
check(safeImgSrc("data:text/html,x") === null, "data:text/html 被拦", "没拦住");
check(safeImgSrc("data:image/png;base64,AAA") !== null, "data:image/png 放行", "被误拦");
check(safeImgSrc("https://help-assets.jinshuju.net/a.png") !== null, "外部 https 图片放行", "被误拦");
check(String(safeImgSrc("img/a.png")).startsWith(ASSET_BASE), "相对图片拼上资源基地址", `得到 ${safeImgSrc("img/a.png")}`);

console.log("凭据不落盘：");
const appSrc = fs.readFileSync("public/app.js", "utf8");
// 填过的 API_KEY / API_SECRET / sign_secret 不该跨刷新留存，所以任何 storage 都不能写
const setItems = [...appSrc.matchAll(/(?:session|local)Storage\.setItem\(([^)]*)\)/g)].map((m) => m[1]);
// 词表要精确：布局宽度那处是 setItem(key, ...)，key 只是形参名，不能算凭据
const leaky = setItems.filter((arg) => /creds|secret|api_?key|passw/i.test(arg));
check(leaky.length === 0, "没有把凭据写进 localStorage / sessionStorage",
  `这些写入看着像凭据：${leaky.join(" | ")}`);
check(/sessionStorage\.removeItem\("jsj_creds"\)/.test(appSrc),
  "启动时清掉早先版本残留的 jsj_creds", "找不到清理代码");
// 允许留存的只有主题和几个布局宽度
// remember() 存布局宽度时第一个参数是形参 key，键名常量在调用处（jsj_sidebar_w 等）
const allowed = setItems.filter((arg) => !/^"jsj_theme"|^key,/.test(arg.trim()));
check(allowed.length === 0, "只有主题和布局宽度会落盘", `多出来的写入：${allowed.join(" | ")}`);

const failed = results.filter((x) => !x.ok);
console.log(`  —— ${results.length} 项，失败 ${failed.length} 项`);
process.exit(failed.length === 0 ? 0 : 1);
