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

这两个文件都不收录 API v1 的页面，而是让模型直接读取 [openapi.yaml](https://jinshuju.net/api/v1/openapi.yaml)，见 `docusaurus.config.ts` 中 `docusaurus-plugin-llms` 的配置。

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
spec/
└── openapi.yaml          # 线上 openapi.yaml 的原样副本
```

## API 文档与 openapi.yaml

API v1 接口页里的参数表、响应字段表和状态码表夹在 `<!-- openapi:… -->` 注释之间：

- 哪些行、参数名称、是否必须、类型：按 [openapi.yaml](https://jinshuju.net/api/v1/openapi.yaml) 生成，不要手改。
- 说明：手写，力求简短，生成时按行名保留。
- 简介、示例和代码示例：仍是手写的。

```bash
npm run generate        # 让接口页里的表格跟上 spec/openapi.yaml
npm run generate:check  # 只检查，不改文件；有空着的说明也会失败
npm run spec:update     # 拉取最新的 openapi.yaml 后再生成
```

openapi.yaml 有变化时，交给 AI 按项目里的 skill [`.claude/skills/sync-openapi`](.claude/skills/sync-openapi/SKILL.md) 更新：在 Claude Code 里运行 `/sync-openapi`。它会拉取 spec、更新表格、给新出现的行写说明，并核对手写的示例。详见 [CONTRIBUTING.md](CONTRIBUTING.md#tables-generated-from-openapiyaml)。

## 维护状态

本仓库由金数据团队维护。开放平台文档会随着 MCP、API、Webhook 等能力更新持续维护。问题和建议可以通过本仓库 Issues 反馈。
