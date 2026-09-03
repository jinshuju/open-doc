---
sidebar_label: 快速接入
title: 快速接入
---

# 快速接入

## 认证方式怎么选

金数据 MCP Server 支持两种认证方式：

| 认证方式 | 适合场景 | 说明 |
|---|---|---|
| OAuth 2.0 | 推荐给支持 OAuth 的 AI 工具和第三方应用 | 标准 OAuth 2.0 授权流程，按 scope 控制权限，无需手动保存凭据 |
| Access Token | 固定凭证场景，或工具不支持 OAuth 时 | 在「个人中心 → API」或「系统设置 → 企业 API」创建 Access Token，通过 `Authorization: Bearer` 传递 |

Access Token 的创建方式参考 [API v1 认证方式](/api_v1/authentication/) 中的「获取 Access Token」部分。把下方配置里的 `YOUR_ACCESS_TOKEN` 换成你创建的 Token 即可。

个人 Access Token 与企业 Access Token 都可用于 MCP，权限范围与 API v1 一致：

| Token | 能操作的数据 |
|---|---|
| 个人 Access Token | 该账号创建的表单，以及共享给它的表单 |
| 企业 Access Token | 整个企业的表单与数据；写入和操作记录挂在企业所有者名下 |

> 「我提交过的表单 / 数据」这类按个人维度回答的工具（`list_my_submitted_forms`、`list_my_submitted_entries`），只能用个人 Access Token 或 OAuth 调用。
>
> 已有 API Key/Secret 的存量集成仍可继续使用 HTTP Basic 认证（`Authorization: Basic BASE64(api_key:api_secret)`），该方式后续会下线，建议迁移到 Access Token。

## 在 Claude Code 中配置

### 使用 OAuth 认证

项目级别配置（仅当前项目生效）：

```bash
claude mcp add jinshuju --transport http https://jinshuju.net/mcp
```

用户级别配置（所有项目生效）：

```bash
claude mcp add jinshuju -s user --transport http https://jinshuju.net/mcp
```

使用 OAuth 方式时，Claude Code 会自动引导你完成授权流程。

### 使用 Access Token 认证

项目级别配置（仅当前项目生效）：

```bash
claude mcp add jinshuju --transport http https://jinshuju.net/mcp \
  --header "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

用户级别配置（所有项目生效）：

```bash
claude mcp add jinshuju -s user --transport http https://jinshuju.net/mcp \
  --header "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 在 Cursor 中配置

在 Cursor 的 MCP 设置中添加：

### 使用 OAuth 认证

```json
{
  "mcpServers": {
    "jinshuju": {
      "url": "https://jinshuju.net/mcp"
    }
  }
}
```

使用 OAuth 方式时，Cursor 会自动引导你完成授权流程。

### 使用 Access Token 认证

```json
{
  "mcpServers": {
    "jinshuju": {
      "url": "https://jinshuju.net/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_ACCESS_TOKEN"
      }
    }
  }
}
```

## 在 Windsurf 中配置

编辑 Windsurf MCP 配置文件（`~/.codeium/windsurf/mcp_config.json`）：

### 使用 OAuth 认证

```json
{
  "mcpServers": {
    "jinshuju": {
      "serverUrl": "https://jinshuju.net/mcp"
    }
  }
}
```

### 使用 Access Token 认证

```json
{
  "mcpServers": {
    "jinshuju": {
      "serverUrl": "https://jinshuju.net/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_ACCESS_TOKEN"
      }
    }
  }
}
```

## 在 OpenClaw 中配置

将本网页发送给你的模型，并告诉它帮你安装金数据 MCP 即可。OpenClaw 会自动通过系统自带的 mcporter skill 完成安装和配置。

> 使用前请确保已安装系统自带的 mcporter skill。

## 在其他支持 MCP 的工具中配置

金数据 MCP Server 遵循标准 MCP 协议，理论上支持所有兼容 MCP 协议的 AI 工具和平台，如 ChatGPT、Cline、Continue 等。

配置时只需提供以下信息：

| 配置项 | 值 |
|---|---|
| MCP Server URL | `https://jinshuju.net/mcp` |
| 认证方式（OAuth） | 无需额外配置，工具会自动发起 OAuth 授权流程 |
| 认证方式（Access Token） | `Authorization: Bearer YOUR_ACCESS_TOKEN` |

不同工具的配置方式可能略有差异，请参考对应工具的 MCP 配置文档。核心配置通常只需要 Server URL 和认证信息。

## 验证连接

配置完成后，你可以在 AI 助手中尝试以下操作来验证连接是否成功：

- 列出我的金数据表单
- 查看某个表单的数据
- 帮我创建一个活动报名表
- 查询我当前账户的套餐和用量

如果 AI 助手能够正确返回你的表单信息，说明配置成功。
