/**
 * 页面外壳模板 —— 构建时每个路由渲染一份。
 *
 * 关键是「每个路由一份真实 HTML」：
 *   - 正文和目录已经写在 HTML 里，爬虫和没开 JS 的读者直接能看到内容
 *   - title / description / canonical / og 都是这一页自己的
 *   - <html data-route> 告诉 app.js 当前是哪个路由，它据此反推部署基路径
 * app.js 加载后接管站内点击走 pushState，不再整页刷新。
 *
 * 参数：
 *   css / js / logo   资源地址（可以是 CDN 绝对地址，也可以是相对路径）
 *   route             当前路由，首页为 ""
 *   base              部署基路径，以 / 开头和结尾；预渲染出来的链接都拼它
 *   title             <title> 用的完整标题
 *   description       meta description
 *   siteUrl           站点根的绝对地址，用来拼 canonical 和 og:url
 *   menuHtml          预渲染好的左侧目录
 *   docHtml           预渲染好的正文（含面包屑）
 */

// 资源可能挂在 CDN 上，CSP 得把这些来源算进去
function assetOrigins(urls) {
  const out = new Set();
  for (const u of urls) {
    if (/^https?:\/\//.test(String(u || ""))) {
      try { out.add(new URL(u).origin); } catch { /* 忽略非法地址 */ }
    }
  }
  return [...out];
}

// 正文来自 docs/ 里的 markdown，万一被写进 javascript: 链接或外部脚本，CSP 是第二道闸
// （第一道是 public/markdown.js 里的链接协议白名单）
function csp({ css, js, logo }) {
  const extra = assetOrigins([css, js, logo]);
  const src = ["'self'", ...extra].join(" ");
  return [
    "default-src 'self'",
    `script-src ${src}`,
    `style-src ${src} 'unsafe-inline'`,
    "img-src 'self' data: https:",
    `connect-src 'self' https://jinshuju.net`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
}

// 正文里的图片跟 css/js 一起被托管到同一个地方。
// 从 css 的地址剥掉文件名即可：CDN → 绝对地址，静态构建 → 站点基路径。
function assetBaseOf(css) {
  return String(css || "").replace(/[?#].*$/, "").replace(/[^/]*$/, "");
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// footer 的三栏与版权：内容照搬原站 docusaurus.config.ts 的 themeConfig.footer，
// 只是换成静态 HTML。站内目标写路由，由 base 拼成完整地址。
const FOOTER = [
  {
    title: "文档",
    items: [
      { label: "MCP Server", to: "mcp" },
      { label: "API v1", to: "api_v1" },
      { label: "Webhook", to: "webhook" },
      { label: "URL 传参", to: "url_params" },
      { label: "表单嵌入", to: "embedded/overview" },
    ],
  },
  {
    title: "开发者资源",
    items: [
      { label: "场景案例", to: "best_practice" },
      { label: "API 状态码", to: "api_v1/status_code" },
      { label: "API 请求速率", to: "api_v1/request_rate" },
      { label: "GitHub", href: "https://github.com/jinshuju" },
    ],
  },
  {
    title: "更多",
    items: [
      { label: "金数据首页", href: "https://jinshuju.net" },
      { label: "帮助中心", href: "https://help.jinshuju.net" },
    ],
  },
];

function footerHtml(base, year) {
  const cols = FOOTER.map((col) =>
    '<div class="footer__col"><div class="footer__title">' + esc(col.title) + "</div>" +
    '<ul class="footer__items">' +
    col.items.map((it) => {
      const href = it.href ? it.href : base + it.to;
      return '<li><a class="footer__link" href="' + esc(href) + '"' +
        (it.href ? ' target="_blank" rel="noopener"' : "") + ">" + esc(it.label) + "</a></li>";
    }).join("") +
    "</ul></div>"
  ).join("");
  return '<footer class="footer"><div class="footer__inner">' + cols + "</div>" +
    '<div class="footer__copyright">© ' + esc(year) + " 金数据开放平台 - 文档中心</div></footer>";
}

export function renderPage(opts) {
  const {
    css, js, logo,
    route = "",
    base = "/",
    title = "金数据开放平台",
    description = "金数据开放平台 API、Webhook、URL 传参等系统集成能力文档。",
    siteUrl = "https://open.jinshuju.net",
    menuHtml = "",
    docHtml = "",
    year = new Date().getFullYear(),
  } = opts;

  const assetBase = assetBaseOf(css);
  const canonical = siteUrl.replace(/\/+$/, "") + "/" + route;

  return `<!doctype html>
<html lang="zh-CN" data-theme="light" data-route="${esc(route)}" data-asset-base="${esc(assetBase)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${esc(csp({ css, js, logo }))}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="金数据开放平台">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(siteUrl.replace(/\/+$/, "") + "/img/logo.png")}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="${esc(logo)}">
<link rel="stylesheet" href="${esc(css)}">
</head>
<body>

<header class="navbar">
  <div class="navbar__inner">
    <div class="navbar__items">
      <a class="navbar__brand" href="${esc(base)}">
        <img class="navbar__logo" src="${esc(logo)}" alt="金数据">
        <b class="navbar__title">金数据开放平台</b>
      </a>
      <a class="navbar__link navbar__link--active" href="${esc(base)}">文档</a>
    </div>
    <div class="navbar__items navbar__items--right">
      <a class="navbar__link" href="https://jinshuju.net" target="_blank" rel="noopener">金数据首页<svg width="13" height="13" aria-hidden="true" viewBox="0 0 24 24" class="ext-icon"><path fill="currentColor" d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"/></svg></a>
      <button class="clean-btn" id="btn-theme" title="切换主题"></button>
    </div>
  </div>
</header>

<div class="layout" id="layout">

  <aside class="sidebar">
    <div class="search-wrap">
      <div class="search-box">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7">
          <circle cx="7" cy="7" r="4.6"/><path d="M10.5 10.5L14 14"/>
        </svg>
        <input id="search" type="text" placeholder="搜索接口" autocomplete="off" spellcheck="false">
        <kbd>⌘K</kbd>
      </div>
    </div>
    <div class="menu" id="menu">${menuHtml}</div>
    <div class="resize-handle resize-sidebar" id="resize-sidebar" role="separator" aria-label="调整目录宽度" aria-orientation="vertical" tabindex="0"></div>
  </aside>

  <main class="main" id="main">
    <div class="main-inner">
      <div class="container" id="doc">${docHtml}</div>
      <aside class="toc" id="toc"></aside>
    </div>
    <!-- footer 必须放在 .main 里：.layout 是 position:fixed 铺满视口，
         滚动容器是 .main，放到 .layout 外面就永远滚不到了 -->
    ${footerHtml(base, year)}
  </main>

  <button class="runner-backdrop" id="runner-backdrop" type="button" aria-label="关闭在线调试"></button>

  <aside class="runner" aria-label="在线调试浮窗">
    <div class="resize-handle resize-runner" id="resize-runner" role="separator" aria-label="调整在线调试宽度" aria-orientation="vertical" tabindex="0"></div>
    <div class="runner-top">
      <div class="runner-req" id="runner-req"></div>
      <div class="runner-acts">
        <button class="btn" id="btn-reset" title="参数与 JSON 恢复成文档里的示例值">重置</button>
        <button class="btn btn-accent" id="btn-send">发送请求</button>
        <button class="clean-btn" id="btn-close-runner" title="收起">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7">
            <path d="M4 4l8 8M12 4l-8 8"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="runner-scroll" id="runner-scroll"></div>
    <div class="resize-handle resize-runner-split" id="resize-runner-split" role="separator" aria-label="调整请求与结果区域高度" aria-orientation="horizontal" tabindex="0"></div>
    <div class="runner-out">
      <div class="tabs" id="out-tabs"></div>
      <div class="out-pane" id="out-pane"></div>
    </div>
  </aside>

</div>

<div class="modal-root" id="modal-root" hidden></div>
<div class="toast" id="toast"></div>
<script type="module" src="${esc(js)}"></script>
</body>
</html>`;
}
