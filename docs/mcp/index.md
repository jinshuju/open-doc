---
slug: /mcp
sidebar_label: 概览
title: 金数据 MCP Server
---

# 金数据 MCP Server

金数据 MCP Server 让 Claude、Cursor、Windsurf 等支持 MCP 的 AI 工具连接金数据。配置后，你可以通过自然语言让 AI 助手查询表单、管理数据、创建表单、查看账户信息。

## 适合什么场景

- 让 AI 助手查询、整理表单数据
- 通过自然语言创建和修改表单
- 在 AI Agent 工作流中接入金数据
- 让团队成员不用进入后台，也能完成常见数据操作

## 快速接入

推荐使用 OAuth 方式，Server URL：`https://jinshuju.net/mcp`，配置完成后在 AI 助手中发送 `列出我的金数据表单` 验证连接。

查看各工具的详细配置步骤：[快速接入](/mcp/configuration/)

## 支持的操作

| 功能 | 说明 |
|---|---|
| 管理表单 | 查询表单列表、获取表单详情、创建新表单、编辑表单结构与设置 |
| 表单设置 | 配置表单提交后行为、发布/停止收集、提交限制、访问密码/可见人群、Webhook 等，详见 [表单设置 Schema](/api_v1/schemas/form_setting) |
| 管理数据 | 查询数据列表、获取单条数据、新增数据、修改数据、删除数据 |
| 账户与团队 | 查询当前用户信息、企业账户信息（套餐 / 用量 / 到期）、企业成员列表 |

> MCP 的 `create_form` / `edit_form` / `get_form` 工具中 `setting` 对象的字段与 v1 API 完全对齐；未在白名单里的 key 会被静默忽略，因此所有可用字段必须来自 [表单设置 Schema](/api_v1/schemas/form_setting)。

## 了解更多

- [快速接入](/mcp/configuration/) — 各工具详细配置步骤
- [场景案例](/mcp/use_cases/) — 常见使用场景与示例
- [OAuth 协议细节](/mcp/oauth/) — 面向开发者的 OAuth 接入流程参考
