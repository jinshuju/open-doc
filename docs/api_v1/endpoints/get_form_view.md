---
sidebar_custom_props:
  method: GET
sidebar_label: 获取单个表单视图
---

# v1 API 获取单个表单视图

> API 使用者，可以通过本接口，获取指定表单下某个视图的详细信息

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取单个表单视图 | | | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Basic 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的 CODE`

## 接口说明

* API 使用者可以获取自己创建或有访问权限的共享表单下的视图。
* `VIEW_TOKEN` 可以从[获取表单视图列表](/api_v1/endpoints/get_form_views)接口取得。

## 接口描述

### Request

```
GET https://jinshuju.net/api/v1/forms/FORM_TOKEN/views/VIEW_TOKEN
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 Token（URL 路径参数） |
| VIEW_TOKEN | 是 | String | 视图 Token（URL 路径参数） |

### Response

```json
{
    "token": "vA1b2C",
    "name": "全部数据",
    "view_type": "grid",
    "position": 0,
    "predefined": true,
    "prefer_columns": ["serial_number", "field_1", "field_2"],
    "sort": [
        { "api_code": "serial_number", "order": "desc" }
    ],
    "filter": [
        { "field": "field_3", "operator": "eq", "value": "待跟进" }
    ],
    "created_at": "2026-05-26T02:00:00.000Z",
    "updated_at": "2026-05-26T02:00:00.000Z"
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| token | 是 | String | 视图 Token |
| name | 是 | String | 视图名称 |
| view_type | 是 | String | 视图类型：`grid` / `kanban` / `stats` |
| position | 是 | Number | 视图排序位置 |
| predefined | 是 | Boolean | 是否为系统预设视图 |
| prefer_columns | 是 | Array(String) | 视图展示的字段 `api_code` 列表；为空时表示展示表单可推送字段 |
| sort | 是 | Array | 排序规则数组 |
| sort[].api_code | 是 | String | 排序字段的 `api_code`，可包含系统字段如 `serial_number` |
| sort[].order | 是 | String | 排序方向：`asc` / `desc` |
| filter | 是 | Array | 视图筛选条件数组。无筛选条件时返回空数组 |
| filter[].field | 是 | String | 筛选字段的 `api_code` |
| filter[].operator | 是 | String | 筛选操作符 |
| filter[].value | 否 | 取决于 operator | 筛选值；`null` / `not_null` 不返回该字段 |
| created_at | 是 | DateTime | 视图创建时间 |
| updated_at | 是 | DateTime | 视图最后更新时间 |

> 注意：数据中的日期时间，使用的是 UTC 时间（例如：`"2026-05-26T02:00:00.000Z"`），接受者需要自行转换为自己所需要的时区（例如北京时间）。

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 获取成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 404 | 表单或视图不存在，或无权访问 |

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/forms/$FORM_TOKEN/views/$VIEW_TOKEN

Content-Type: application/json
Accept: application/json
Authorization: Basic BASE_64_ENCODED_CREDENTIALS
```

### Python

```python
import requests

api_key = 'YOUR_API_KEY'
api_secret = 'YOUR_API_SECRET'
form_token = 'YOUR_FORM_TOKEN'
view_token = 'YOUR_VIEW_TOKEN'

response = requests.get(
    f'https://jinshuju.net/api/v1/forms/{form_token}/views/{view_token}',
    auth=(api_key, api_secret)
)

print(response.text)
```
