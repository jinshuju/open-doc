---
sidebar_label: 快速接入
title: 快速接入
---

# 快速接入

## 认证方式怎么选

金数据 MCP Server 支持两种认证方式：

| 认证方式 | 适合场景 | 说明 |
|---|---|---|
| OAuth 2.0 | 推荐给支持 OAuth 的 AI 工具和第三方应用 | 标准 OAuth 2.0 授权流程，按 scope 控制权限，无需手动保存 API Key/Secret |
| API Key/Secret | 已有 Key/Secret 的存量集成 | 使用 HTTP Basic 认证。MCP Server 暂不支持 Access Token，新接入请使用 OAuth 2.0 |

API Key/Secret 的说明参考 [API v1 认证方式](/api_v1/authentication/) 中的「旧版认证方式」部分。

如使用 API Key/Secret，需要先生成 `BASE64_ENCODED_CREDENTIALS`：

```bash
echo -n "api_key:api_secret" | base64
```

将输出的字符串替换下方配置中的 `BASE64_ENCODED_CREDENTIALS` 即可。

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

### 使用 API Key/Secret 认证

项目级别配置（仅当前项目生效）：

```bash
claude mcp add jinshuju --transport http https://jinshuju.net/mcp \
  --header "Authorization: Basic BASE64_ENCODED_CREDENTIALS"
```

用户级别配置（所有项目生效）：

```bash
claude mcp add jinshuju -s user --transport http https://jinshuju.net/mcp \
  --header "Authorization: Basic BASE64_ENCODED_CREDENTIALS"
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

### 使用 API Key/Secret 认证

```json
{
  "mcpServers": {
    "jinshuju": {
      "url": "https://jinshuju.net/mcp",
      "headers": {
        "Authorization": "Basic BASE64_ENCODED_CREDENTIALS"
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

### 使用 API Key/Secret 认证

```json
{
  "mcpServers": {
    "jinshuju": {
      "serverUrl": "https://jinshuju.net/mcp",
      "headers": {
        "Authorization": "Basic BASE64_ENCODED_CREDENTIALS"
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
| 认证方式（API Key/Secret） | `Authorization: Basic BASE64(api_key:api_secret)` |

不同工具的配置方式可能略有差异，请参考对应工具的 MCP 配置文档。核心配置通常只需要 Server URL 和认证信息。

## 验证连接

配置完成后，你可以在 AI 助手中尝试以下操作来验证连接是否成功：

- 列出我的金数据表单
- 查看某个表单的数据
- 帮我创建一个活动报名表
- 查询我当前账户的套餐和用量

如果 AI 助手能够正确返回你的表单信息，说明配置成功。
