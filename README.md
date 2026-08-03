# 金数据开放平台文档

这是金数据开放平台的官方开发者文档仓库，覆盖 MCP Server、API v1、Webhook、URL 传参、表单嵌入和场景案例。

线上文档地址：[open.jinshuju.net](https://open.jinshuju.net)

## 适合谁使用

- 需要接入金数据 API、Webhook 或 MCP 的开发者
- 需要维护开放平台文档内容的金数据团队成员
- 希望了解金数据开放能力、集成方式和场景案例的技术同学

## 快速开始

如果你只是想查看文档，请访问：[open.jinshuju.net](https://open.jinshuju.net)。

如果你需要本地预览或修改文档（需要 Node ≥ 22）：

```bash
npm run start
```

访问 `http://localhost:3000` 查看文档。**站点没有运行时依赖，不需要 `npm install`。**

改完 `docs/` 下的 `.md` 重新跑一次即可；只想重新生成不起服务器就用 `npm run build`。

## 仓库结构

内容和渲染分开：`docs/` 是文档本身，`site/` 是把它渲染成站点的那一层。

```text
docs/                     # 内容，改文档只动这里
├── intro.md              # 首页
├── api_v1/               # API v1 文档
├── webhook/              # Webhook 文档
├── url_params/           # URL 传参文档
├── embedded/             # 表单嵌入文档
├── api_code_alias/       # API CODE 重命名
└── best_practice.md      # 场景案例

sidebars.ts               # 导航树（新增文档要挂到这里才会出现）
static/img/               # 站点图片，构建后在 /img/* 下可访问

site/                     # 渲染层
├── scripts/
│   ├── build-data.mjs    # 读 docs/ + sidebars.ts，产出 site.json
│   ├── build-static.mjs  # 按路由预渲染静态 HTML
│   └── build.mjs         # 上面两步的统一入口
├── src/page.js           # 页面外壳模板
├── public/
│   ├── app.js            # 前端（原生 JS，无框架、无打包）
│   ├── markdown.js       # 正文渲染，浏览器与构建脚本共用
│   ├── nav.js            # 目录树，浏览器与构建脚本共用
│   └── app.css
└── test/                 # npm test 跑的检查
```

新增一篇文档：在 `docs/` 下写 `.md`，挂进 `sidebars.ts`，重新构建即可，不需要动 `site/` 里的代码。

## 构建

```bash
npm run build
```

产物在 `dist/`：

- **每个路由一份静态 HTML**（`api_v1/authentication/index.html` 这种），正文和目录已经写在
  HTML 里，所以站外深链、搜索引擎和没开 JS 的读者拿到的都是完整页面；
  加载 `app.js` 后站内点击走 pushState，体验是单页应用
- `sitemap.xml` / `robots.txt`
- `llms.txt` —— AI/LLM 文档索引
- `llms-full.txt` —— 完整文档内容
- `404.html`

默认按根路径构建（`open.jinshuju.net` 就在根上）。GitHub Actions 部署时**不需要操心这个** ——
基路径由 `actions/configure-pages` 读仓库的 Pages 配置自动推导，自定义域名解析成根路径，
fork 出去的项目站自动解析成 `/<仓库名>/` 子路径。

要部署到别处、或者本地想验证子路径下的产物，可以显式指定：

```bash
npm run build -- --base=/子路径/ --site-url=https://example.com/子路径
```

## 检查

```bash
npm test
```

四组检查，全程只连本机：

| 组 | 盯什么 |
| --- | --- |
| 链接 / 图片 / 协议 | 站内链接的目标页真实存在、图片文件在、`javascript:` 一类协议被拦、API 凭据不落盘 |
| 请求代码 | 每个接口生成的 cURL 和 Python 片段真的执行一遍（PATCH 不能退化成 POST、Python 里不能出现 `true/false/null`） |
| URL 传参签名 | HMAC-SHA256 与 JWT 的实现对着 Python 独立实现逐字节比对 |
| 预渲染产物 | 51 个路由各有一份能独立打开的 HTML，title / description / canonical 各自正确且 title 不重复，目录链接完整 |

`npm test` 需要先 `npm run build`（预渲染那组要读 `dist/`）。

## 在线调试

接口页右侧的「在线调试」是**浏览器直连** `https://jinshuju.net/api/v1/*`，
凭据只留在页面内存里，不写 localStorage / sessionStorage，也不经过任何第三方服务器。
之所以不需要服务端，是因为金数据 API 自己开了 CORS。

URL 传参那两页右侧是链接生成器，`sign_secret` 同样在浏览器里用 Web Crypto 计算，不发给任何服务器。

> 「请求代码」会把填入的真实 Key / Secret 内联进代码方便直接跑，
> 所以复制出去的片段含明文凭据，别贴到公共渠道。

## 部署

推送到 `master` 分支后，GitHub Actions 自动构建、跑检查并部署到 GitHub Pages。

## 维护状态

本仓库由金数据团队维护。开放平台文档会随着 MCP、API、Webhook 等能力更新持续维护。问题和建议可以通过本仓库 Issues 反馈。
