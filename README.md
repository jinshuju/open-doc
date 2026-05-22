# 金数据开放平台文档

这是金数据开放平台的官方开发者文档仓库，覆盖 MCP Server、API v1、Webhook、URL 传参、表单嵌入和场景案例。

线上文档地址：[open.jinshuju.net](https://open.jinshuju.net)

## 适合谁使用

- 需要接入金数据 API、Webhook 或 MCP 的开发者
- 需要维护开放平台文档内容的金数据团队成员
- 希望了解金数据开放能力、集成方式和场景案例的技术同学

## 快速开始

如果你只是想查看文档，请访问：[open.jinshuju.net](https://open.jinshuju.net)。

如果你需要本地预览或修改文档：

```bash
npm install
npm run start
```

访问 `http://localhost:3000` 查看文档。

## 构建

```bash
npm run build
```

构建产物在 `build` 目录，包含：

- 静态 HTML 文件
- `llms.txt` - AI/LLM 文档索引
- `llms-full.txt` - 完整文档内容

## 部署

推送到 `master` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。

## 文档结构

```text
docs/
├── intro.md              # 首页
├── api_v1/               # API v1 文档
├── webhook/              # Webhook 文档
├── url_params/           # URL 传参文档
├── embedded/             # 表单嵌入文档
├── api_code_alias/       # API CODE 重命名
└── best_practice.md      # 场景案例
```

## 维护状态

本仓库由金数据团队维护。开放平台文档会随着 MCP、API、Webhook 等能力更新持续维护。问题和建议可以通过本仓库 Issues 反馈。
