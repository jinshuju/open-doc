# v1 API 更新表单视图

> API 使用者，可以通过本接口，更新指定表单下的视图配置

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 更新表单视图 | | | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Basic 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的 CODE`

## 接口说明

* API 使用者可以更新自己创建或有管理权限的共享表单下的视图。
* `VIEW_TOKEN` 可以从[获取表单视图列表](/api_v1/endpoints/get_form_views)接口取得。
* 只会更新请求中传入的字段；未传入的字段保持原值。
* 更新自定义视图、或修改系统预设视图的类型，需要账户套餐支持自定义视图能力。
* 系统预设视图的 `view_type` 不允许修改，但可以更新名称等其他配置。
* `filter` 传空数组会清空筛选条件；不传 `filter` 则保持原筛选条件。

## 接口描述

### Request

```
PATCH https://jinshuju.net/api/v1/forms/FORM_TOKEN/views/VIEW_TOKEN

{
    "name": "重点客户",
    "prefer_columns": ["serial_number", "field_1", "field_2"],
    "sort": [
        { "api_code": "serial_number", "order": "desc" }
    ],
    "filter": [
        { "field": "field_2", "operator": "not_null" }
    ]
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 Token（URL 路径参数） |
| VIEW_TOKEN | 是 | String | 视图 Token（URL 路径参数） |
| name | 否 | String | 视图名称，最长 120 个字符 |
| view_type | 否 | String | 视图类型：`grid` / `kanban` / `stats`。系统预设视图不允许修改该字段 |
| prefer_columns | 否 | Array(String) | 视图展示的字段 `api_code` 列表 |
| kanban_group_by_api_code | 否 | String | 看板视图分组字段的 `api_code`。字段必须支持看板分组 |
| kanban_card_title_api_code | 否 | String | 看板卡片标题字段的 `api_code` |
| sort | 否 | Array | 排序规则数组。传空数组会清空排序规则 |
| sort[].api_code | 是 | String | 排序字段的 `api_code`，可包含系统字段如 `serial_number` |
| sort[].order | 是 | String | 排序方向：`asc` / `desc` |
| filter | 否 | Array | 视图筛选条件数组。传空数组会清空筛选条件 |
| filter[].field | 是 | String | 筛选字段的 `api_code` |
| filter[].operator | 是 | String | 筛选操作符 |
| filter[].value | 否 | 取决于 operator | 筛选值；`null` / `not_null` 不需要传 |

### filter 字段过滤

`filter` 的格式同[创建表单视图](/api_v1/endpoints/create_form_view)。每个元素是 `{field, operator, value}` 三元组，多个条件之间是 **AND** 关系。

> `filter` 必须传数组；不要传 `{ "scope_conditions": [] }` 这类内部存储结构。

### Response

更新成功时返回更新后的视图结构。

```json
{
    "token": "vD3e4F",
    "name": "重点客户",
    "view_type": "grid",
    "position": 1,
    "predefined": false,
    "prefer_columns": ["serial_number", "field_1", "field_2"],
    "sort": [
        { "api_code": "serial_number", "order": "desc" }
    ],
    "filter": [
        { "field": "field_2", "operator": "not_null" }
    ],
    "created_at": "2026-05-26T03:00:00.000Z",
    "updated_at": "2026-05-26T03:10:00.000Z"
}
```

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 更新成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API，或当前账户不支持自定义视图 |
| 404 | 表单或视图不存在，或无权访问 |
| 422 | 参数校验失败、筛选条件不合法、系统预设视图类型不允许修改 |

## 示例代码

### HTTP

```http
PATCH https://jinshuju.net/api/v1/forms/$FORM_TOKEN/views/$VIEW_TOKEN

Content-Type: application/json
Accept: application/json
Authorization: Basic BASE_64_ENCODED_CREDENTIALS

{
  "name": "重点客户",
  "filter": [{ "field": "field_2", "operator": "not_null" }]
}
```

### Python

```python
import requests

api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'
form_token = 'YOUR_FORM_TOKEN'
view_token = 'YOUR_VIEW_TOKEN'

payload = {
    "name": "重点客户",
    "filter": [{"field": "field_2", "operator": "not_null"}]
}

response = requests.patch(
    f'https://jinshuju.net/api/v1/forms/{form_token}/views/{view_token}',
    auth=(api_key, api_secret),
    json=payload
)

print(response.text)
```
