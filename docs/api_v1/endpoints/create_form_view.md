---
sidebar_custom_props:
  method: POST
sidebar_label: 创建表单视图
---

# v1 API 创建表单视图

> API 使用者，可以通过本接口，在指定表单下创建自定义视图

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 创建表单视图 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的 CODE`

## 接口说明

* API 使用者可以在自己创建或有管理权限的共享表单下创建视图。
* 创建自定义视图需要账户套餐支持自定义视图能力。
* 单个表单下最多支持 100 个视图。
* `view_type` 默认为 `grid`。
* `prefer_columns` 为空时，服务端会根据表单默认展示字段生成视图展示列。
* `filter` 使用数组形式传入；传空数组表示没有筛选条件。

## 接口描述

### Request

```
POST https://jinshuju.net/api/v1/forms/FORM_TOKEN/views

{
    "name": "待跟进客户",
    "view_type": "kanban",
    "prefer_columns": ["serial_number", "field_1", "field_2", "field_3"],
    "kanban_group_by_api_code": "field_3",
    "kanban_card_title_api_code": "field_1",
    "sort": [
        { "api_code": "serial_number", "order": "desc" }
    ],
    "filter": [
        { "field": "field_3", "operator": "eq", "value": "待跟进" }
    ]
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 Token（URL 路径参数） |
| name | 是 | String | 视图名称，最长 120 个字符 |
| view_type | 否 | String | 视图类型：`grid` / `kanban` / `stats`。默认 `grid` |
| prefer_columns | 否 | Array(String) | 视图展示的字段 `api_code` 列表 |
| kanban_group_by_api_code | 否 | String | 看板视图分组字段的 `api_code`。字段必须支持看板分组 |
| kanban_card_title_api_code | 否 | String | 看板卡片标题字段的 `api_code` |
| sort | 否 | Array | 排序规则数组 |
| sort[].api_code | 是 | String | 排序字段的 `api_code`，可包含系统字段如 `serial_number` |
| sort[].order | 是 | String | 排序方向：`asc` / `desc` |
| filter | 否 | Array | 视图筛选条件数组 |
| filter[].field | 是 | String | 筛选字段的 `api_code` |
| filter[].operator | 是 | String | 筛选操作符 |
| filter[].value | 否 | 取决于 operator | 筛选值；`null` / `not_null` 不需要传 |

### filter 字段过滤

`filter` 用于保存视图筛选条件。每个元素是 `{field, operator, value}` 三元组，多个条件之间是 **AND** 关系。

| 元素 | 类型 | 说明 |
| ---- | ---- | ---- |
| `field` | String | 字段的 `api_code`（如 `field_3`），或系统字段名 `created_at` |
| `operator` | String | 操作符，见下方表格 |
| `value` | 取决于 operator | 比较值；`null` / `not_null` 不需要传 |

**支持的 operator**：

| 类别 | operator | value 形式 | 示例 |
| ---- | -------- | ---------- | ---- |
| 等值 | `eq` / `ne` | 标量 | `{"field":"field_1","operator":"eq","value":"张三"}` |
| 比较 | `gt` / `gte` / `lt` / `lte` | 标量 | `{"field":"field_3","operator":"gte","value":6}` |
| 区间 | `between` / `not_between` | 2 元素数组 `[min, max]`（闭区间） | `{"field":"field_3","operator":"between","value":[80,100]}` |
| 集合 | `any_in` / `none_in` | 数组 | `{"field":"field_2","operator":"any_in","value":["北京","上海"]}` |
| 文本 | `like` / `not_like` | 子串 | `{"field":"field_2","operator":"like","value":"张"}` |
| 是否为空 | `null` / `not_null` | 省略 | `{"field":"field_4","operator":"not_null"}` |

> `filter` 必须传数组；不要传 `{ "scope_conditions": [] }` 这类内部存储结构。

### Response

创建成功时返回新创建的视图结构。

```json
{
    "token": "vD3e4F",
    "name": "待跟进客户",
    "view_type": "kanban",
    "position": 1,
    "predefined": false,
    "prefer_columns": ["serial_number", "field_1", "field_2", "field_3"],
    "sort": [
        { "api_code": "serial_number", "order": "desc" }
    ],
    "filter": [
        { "field": "field_3", "operator": "eq", "value": "待跟进" }
    ],
    "created_at": "2026-05-26T03:00:00.000Z",
    "updated_at": "2026-05-26T03:00:00.000Z"
}
```

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 201 | 创建成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API，或当前账户不支持自定义视图 |
| 404 | 表单不存在或无权访问 |
| 422 | 参数校验失败、视图数量达到上限、筛选条件不合法 |

## 示例代码

### HTTP

```http
POST https://jinshuju.net/api/v1/forms/$FORM_TOKEN/views

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "name": "待跟进客户",
  "view_type": "kanban",
  "filter": [{ "field": "field_3", "operator": "eq", "value": "待跟进" }]
}
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'

payload = {
    "name": "待跟进客户",
    "view_type": "kanban",
    "filter": [{"field": "field_3", "operator": "eq", "value": "待跟进"}]
}

response = requests.post(
    f'https://jinshuju.net/api/v1/forms/{form_token}/views',
    headers={'Authorization': f'Bearer {access_token}'},
    json=payload
)

print(response.text)
```
