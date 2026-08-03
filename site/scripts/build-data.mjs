#!/usr/bin/env node --experimental-strip-types
/**
 * 从仓库根的 docs/ 生成站点数据。
 *
 *   node --experimental-strip-types site/scripts/build-data.mjs [仓库根路径]
 *
 * 默认就是本仓库根（site/ 的上一层），也可用环境变量 OPEN_DOC_REPO 指向别的副本。
 *
 * 产物：
 *   site/src/data/site.json   nav 树 + 每篇文档（正文 markdown + 接口元数据）
 *   site/public/img/**        docs 里引用的本地图片
 *
 * 内容源永远是 docs/ 里的 .md，本脚本不改写正文语义，只做三件事：
 *   1. 按 sidebars.ts 还原导航树和分组
 *   2. 把站内绝对链接改写成本站路由
 *   3. 从「### Request」代码块和紧随其后的参数表里抽出接口元数据，供在线调试面板使用
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const HERE = path.resolve(import.meta.dirname, "..");
const REPO = path.resolve(process.argv[2] || process.env.OPEN_DOC_REPO || path.join(HERE, ".."));
const DOCS = path.join(REPO, "docs");

if (!fs.existsSync(DOCS)) {
  console.error(`找不到 ${DOCS}\n用法: npm run data -- <仓库根路径>`);
  process.exit(1);
}

/* ---------------- 读取所有 md ---------------- */

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".md") || name.endsWith(".mdx")) out.push(p);
  }
  return out;
}

function parseFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return { data, body: raw.slice(m[0].length) };
}

// docusaurus doc id → 文件、front-matter、正文
const byId = new Map();
for (const file of walk(DOCS)) {
  const rel = path.relative(DOCS, file).replace(/\\/g, "/");
  const id = rel.replace(/\.mdx?$/, "");
  const { data, body } = parseFrontMatter(fs.readFileSync(file, "utf8"));
  byId.set(id, { id, file, rel, fm: data, body });
}

/* ---------------- 路由 ---------------- */

// docusaurus 的 URL 规则：slug 优先；否则 id，且 index/README 落到目录本身
function routeOf(doc) {
  if (doc.fm.slug) return doc.fm.slug.replace(/^\/|\/$/g, "");
  return doc.id.replace(/\/index$/, "");
}

for (const doc of byId.values()) doc.route = routeOf(doc);

// 站内绝对路径 → 路由，用于链接改写
const routeByUrl = new Map();
for (const doc of byId.values()) {
  routeByUrl.set("/" + doc.route, doc.route);
  routeByUrl.set("/" + doc.route + "/", doc.route);
  if (!doc.fm.slug) {
    routeByUrl.set("/" + doc.id, doc.route);
    routeByUrl.set("/" + doc.id + "/", doc.route);
  }
}
routeByUrl.set("/", ""); // intro

function rewriteLinks(md, doc) {
  return md
    // 站内链接：归一成「站点根相对」写法，渲染时再拼上部署基路径（见 public/markdown.js）
    .replace(/\]\((\/[^)\s#]*)(#[^)\s]*)?\)/g, (whole, url, frag) => {
      const target = routeByUrl.get(url) ?? routeByUrl.get(url.replace(/\/$/, ""));
      if (target === undefined) return whole; // 站外或未知，保持原样
      return `](/${target}${frag || ""})`;
    })
    // 相对图片 → 打包到 public/img
    .replace(/\]\((\.\.?\/[^)\s]+\.(?:png|jpe?g|gif|svg|webp))\)/gi, (whole, relPath) => {
      const abs = path.resolve(path.dirname(doc.file), relPath);
      if (!fs.existsSync(abs)) return whole;
      const section = path.relative(DOCS, path.dirname(doc.file)).split(path.sep)[0] || "root";
      const dest = path.join(HERE, "public", "img", section, path.basename(abs));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(abs, dest);
      copiedImages.push(path.relative(HERE, dest));
      return `](img/${section}/${path.basename(abs)})`;
    });
}
const copiedImages = [];

/* ---------------- 接口元数据抽取 ---------------- */

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function fences(md) {
  const out = [];
  const re = /^[ \t]*```(\S*)[ \t]*\r?\n([\s\S]*?)^[ \t]*```[ \t]*$/gm;
  let m;
  while ((m = re.exec(md)) !== null) {
    out.push({ lang: m[1] || "", code: m[2], start: m.index, end: re.lastIndex });
  }
  return out;
}

// 解析紧跟在某个位置之后的第一张 markdown 表格
function tableAfter(md, from) {
  const rest = md.slice(from);
  const m = rest.match(/^[ \t]*\|(.+)\|[ \t]*\r?\n[ \t]*\|[\s:|-]+\|[ \t]*\r?\n((?:[ \t]*\|.*\|[ \t]*\r?\n?)*)/m);
  if (!m) return null;
  // 只接受紧邻（中间不能夹别的正文块）
  const gap = rest.slice(0, m.index).replace(/\s/g, "");
  if (gap.length > 0) return null;
  const cells = (line) =>
    line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const head = cells(m[1]);
  const rows = m[2].split(/\r?\n/).filter((l) => l.trim().startsWith("|")).map(cells);
  return { head, rows, end: from + m.index + m[0].length };
}

// 从一段文本里取出第一个配平且能被 JSON.parse 的对象/数组
function firstJson(text) {
  for (let i = 0; i < text.length; i++) {
    const open = text[i];
    if (open !== "{" && open !== "[") continue;
    const close = open === "{" ? "}" : "]";
    let depth = 0, inStr = false, escaped = false;
    for (let j = i; j < text.length; j++) {
      const c = text[j];
      if (inStr) {
        if (escaped) escaped = false;
        else if (c === "\\") escaped = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') { inStr = true; continue; }
      if (c === open) depth++;
      else if (c === close) {
        depth--;
        if (depth === 0) {
          const candidate = text.slice(i, j + 1);
          try { JSON.parse(candidate); return candidate; } catch { break; }
        }
      }
    }
  }
  return null;
}

function paramsFromTable(t) {
  if (!t) return [];
  const iName = t.head.findIndex((h) => /参数名称|字段|属性名/.test(h));
  if (iName === -1) return [];
  const iReq = t.head.findIndex((h) => /是否必须|必填/.test(h));
  const iType = t.head.findIndex((h) => /^类型$/.test(h));
  const iDesc = t.head.findIndex((h) => /说明|描述/.test(h));
  return t.rows
    .map((r) => ({
      name: (r[iName] || "").replace(/`/g, "").trim(),
      type: iType >= 0 ? (r[iType] || "").replace(/`/g, "").trim() : "",
      required: iReq >= 0 ? /是|✔|必/.test(r[iReq] || "") : false,
      desc: iDesc >= 0 ? (r[iDesc] || "").trim() : "",
    }))
    .filter((p) => p.name && !/^-+$/.test(p.name));
}

function extractApi(doc) {
  const md = doc.body;
  // 只处理 api_v1/endpoints 下的文档
  if (!/^api_v1\/endpoints\//.test(doc.id)) return null;

  const reqHeading = md.search(/^###\s+Request\s*$/m);
  if (reqHeading === -1) return null;

  const blocks = fences(md).filter((b) => b.start > reqHeading);
  if (!blocks.length) return null;
  const block = blocks[0];

  // 请求行形如：POST https://jinshuju.net/api/v1/forms/FORM_TOKEN/copy
  // 也可能一行写多个方法：PATCH/POST/PUT https://...
  const VERBS = `(?:${METHODS.join("|")})`;
  const reqLine = new RegExp(`^\\s*(${VERBS}(?:/${VERBS})*)\\s+(?:https?://[^/\\s]+)?(/\\S*)`);
  let method = null, urlPath = null;
  const allMethods = [];
  const lines = block.code.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(reqLine);
    if (!m) continue;
    for (const v of m[1].split("/")) if (!allMethods.includes(v)) allMethods.push(v);
    if (!method) { method = m[1].split("/")[0]; urlPath = m[2]; }
  }
  if (!method) return null;
  const alsoMethods = allMethods.filter((v) => v !== method);

  const cleanPath = urlPath.split("?")[0].replace(/\/$/, "");
  const isMultipart = /multipart\/form-data/i.test(block.code);

  // 请求体示例：代码块里第一段配平的 JSON（GET/DELETE 没有请求体，那段 JSON 是参数示例）
  const requestExample = ["GET", "DELETE"].includes(method) ? null : firstJson(block.code);

  // 参数表（紧跟 Request 代码块）
  const all = paramsFromTable(tableAfter(md, block.end));

  // URL 里出现的大写占位符即 path 参数
  const placeholders = (cleanPath.match(/[A-Z][A-Z0-9_]{2,}/g) || []);
  const query = new Set();
  const qs = urlPath.includes("?") ? urlPath.slice(urlPath.indexOf("?") + 1) : "";
  for (const kv of qs.split("&")) if (kv) query.add(kv.split("=")[0]);
  // Request 代码块里其他示例行的查询串也算
  for (const line of lines) {
    const m = line.match(/\?([^\s#]+)/);
    if (m) for (const kv of m[1].split("&")) if (kv) query.add(kv.split("=")[0]);
  }

  // 有请求体的方法：路径参数之外的都算 body；multipart 也算 body（表单字段）
  const takesBody = isMultipart || ["POST", "PUT", "PATCH"].includes(method);

  const pathParams = [], queryParams = [], bodyParams = [];
  for (const p of all) {
    const bare = p.name.replace(/\\/g, "");
    if (placeholders.includes(bare)) pathParams.push(p);
    else if (query.has(bare)) queryParams.push(p);
    else if (takesBody) bodyParams.push(p);
    else queryParams.push(p);
  }

  return {
    method,
    alsoMethods,
    path: cleanPath,
    contentType: isMultipart ? "multipart/form-data" : "application/json",
    runnable: !isMultipart,
    pathParams,
    queryParams,
    bodyParams,
    requestExample,
  };
}

/* ---------------- 导航树 ---------------- */

const sidebars = (await import(pathToFileURL(path.join(REPO, "sidebars.ts")).href)).default;

const used = new Set();
function buildNav(items) {
  const out = [];
  for (const item of items) {
    if (typeof item === "string") {
      const doc = byId.get(item) || byId.get(item + "/index");
      if (!doc) { console.warn(`  ! sidebars 里的 ${item} 找不到对应文件`); continue; }
      used.add(doc.id);
      out.push({ type: "doc", id: doc.id });
    } else if (item.type === "category") {
      const kids = buildNav(item.items || []);
      if (kids.length) out.push({ type: "category", label: item.label, items: kids });
    } else if (item.type === "doc" && item.id) {
      const doc = byId.get(item.id);
      if (doc) { used.add(doc.id); out.push({ type: "doc", id: doc.id }); }
    }
  }
  return out;
}

const nav = buildNav(sidebars.docsSidebar);

// 面包屑：doc id → 它在 nav 里的分类路径
const crumbs = new Map();
(function walkNav(items, trail) {
  for (const it of items) {
    if (it.type === "category") walkNav(it.items, trail.concat(it.label));
    else crumbs.set(it.id, trail);
  }
})(nav, []);

/* ---------------- 组装 ---------------- */

function titleOf(doc) {
  if (doc.fm.title) return doc.fm.title;
  const h1 = doc.body.match(/^#\s+(.+)$/m);
  return h1 ? h1[1].trim() : doc.id;
}
function labelOf(doc) {
  if (doc.fm.sidebar_label) return doc.fm.sidebar_label;
  // 接口页：去掉 "v1 API " 前缀，目录里更紧凑
  const t = titleOf(doc);
  return t.replace(/^v1\s*API\s*/i, "").replace(/^API\s*V1\s*/i, "").trim() || t;
}

const docs = {};
let apiCount = 0;
for (const doc of byId.values()) {
  if (!used.has(doc.id)) { console.warn(`  ! ${doc.rel} 未出现在 sidebars.ts，已跳过`); continue; }
  const api = extractApi(doc);
  if (api) apiCount++;
  docs[doc.route] = {
    route: doc.route,
    id: doc.id,
    name: labelOf(doc),
    title: titleOf(doc),
    breadcrumb: crumbs.get(doc.id) || [],
    markdown: rewriteLinks(doc.body, doc).trim(),
    api,
  };
}

/* ---------------- 页面标题 ---------------- */

// <title> 在这里定稿，预渲染（build-static.mjs）和前端 pushState（app.js）都直接用
// doc.pageTitle，免得同一页「直接打开」和「站内点进来」显示两种标题。
const SITE_TITLE = "金数据开放平台";
const titleCount = {};
for (const d of Object.values(docs)) titleCount[d.title] = (titleCount[d.title] || 0) + 1;
for (const d of Object.values(docs)) {
  if (d.route === "") { d.pageTitle = `${SITE_TITLE} · 开发者文档`; continue; }
  // 「概览」这种标题好几个分区都在用，靠面包屑最后一级区分，
  // 否则搜索结果里一排同名条目，点进去才知道是哪一块
  const crumb = (d.breadcrumb || [])[d.breadcrumb.length - 1];
  const base = titleCount[d.title] > 1 && crumb ? `${d.title} | ${crumb}` : d.title;
  d.pageTitle = `${base} | ${SITE_TITLE}`;
}

// nav 里存路由，前端直接拿
(function toRoutes(items) {
  for (const it of items) {
    if (it.type === "category") toRoutes(it.items);
    else {
      const doc = byId.get(it.id);
      it.route = doc.route;
      it.name = labelOf(doc);
      if (doc && extractApi(doc)) it.method = extractApi(doc).method;
      delete it.id;
    }
  }
})(nav);

/* ---------------- 站点资源 ---------------- */

// static/img/ 整个搬过来。这些文件在原站是 /img/* 可直接访问的，
// 挑着复制会让本来能打开的地址变 404，所以一律照搬（站点自己用的是 img/logo.png）。
(function copyStaticImg(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyStaticImg(a, b);
    else {
      fs.copyFileSync(a, b);
      copiedImages.push(path.relative(HERE, b));
    }
  }
})(path.join(REPO, "static", "img"), path.join(HERE, "public", "img"));

const out = {
  generatedAt: new Date().toISOString(),
  source: "jinshuju/open-doc",
  nav,
  docs,
};

const dest = path.join(HERE, "src", "data", "site.json");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 2));

// 旧的手工数据文件不再使用
for (const stale of ["endpoints.json", "guides.json"]) {
  const p = path.join(HERE, "src", "data", stale);
  if (fs.existsSync(p)) fs.rmSync(p);
}

console.log(`✓ ${path.relative(HERE, dest)}`);
console.log(`  文档 ${Object.keys(docs).length} 篇，其中可在线调试的接口 ${apiCount} 个`);
if (copiedImages.length) console.log(`  图片 ${[...new Set(copiedImages)].length} 张 → public/img/`);
