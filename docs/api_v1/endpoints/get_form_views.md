# v1 API 获取表单视图列表

> API 使用者，可以通过本接口，获取指定表单下的视图列表

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取表单视图列表 | | | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Basic 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: 放入上一步骤生成的 CODE`

## 接口说明

* API 使用者可以获取自己创建或有访问权限的共享表单下的视图。
* 返回结果只包含当前 API 使用者在该表单下可访问的视图。
* 结果按视图的 `position`、创建时间升序返回。

## 接口描述

### Request

```
GET https://jinshuju.net/api/v1/forms/FORM_TOKEN/views
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 Token（URL 路径参数） |

### Response

```json
{
    "count": 2,
    "data": [
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
            "filter": [],
            "created_at": "2026-05-26T02:00:00.000Z",
            "updated_at": "2026-05-26T02:00:00.000Z"
        },
        {
            "token": "vD3e4F",
            "name": "待跟进客户",
            "view_type": "kanban",
            "position": 1,
            "predefined": false,
            "prefer_columns": ["serial_number", "field_1", "field_3"],
            "sort": [],
            "filter": [
                { "field": "field_3", "operator": "eq", "value": "待跟进" }
            ],
            "created_at": "2026-05-26T03:00:00.000Z",
            "updated_at": "2026-05-26T03:10:00.000Z"
        }
    ]
}
```

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| count | 是 | Number | 本次返回的视图数量 |
| data | 是 | Array | 视图数组 |
| data[].token | 是 | String | 视图 Token，用于后续获取、更新、删除视图，或获取视图下的数据 |
| data[].name | 是 | String | 视图名称 |
| data[].view_type | 是 | String | 视图类型：`grid` / `kanban` / `stats` |
| data[].position | 是 | Number | 视图排序位置 |
| data[].predefined | 是 | Boolean | 是否为系统预设视图 |
| data[].prefer_columns | 是 | Array(String) | 视图展示的字段 `api_code` 列表；为空时表示展示表单可推送字段 |
| data[].sort | 是 | Array | 排序规则数组 |
| data[].sort[].api_code | 是 | String | 排序字段的 `api_code`，可包含系统字段如 `serial_number` |
| data[].sort[].order | 是 | String | 排序方向：`asc` / `desc` |
| data[].filter | 是 | Array | 视图筛选条件数组。无筛选条件时返回空数组 |
| data[].filter[].field | 是 | String | 筛选字段的 `api_code` |
| data[].filter[].operator | 是 | String | 筛选操作符 |
| data[].filter[].value | 否 | 取决于 operator | 筛选值；`null` / `not_null` 不返回该字段 |
| data[].created_at | 是 | DateTime | 视图创建时间 |
| data[].updated_at | 是 | DateTime | 视图最后更新时间 |

> 注意：数据中的日期时间，使用的是 UTC 时间（例如：`"2026-05-26T02:00:00.000Z"`），接受者需要自行转换为自己所需要的时区（例如北京时间）。

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 获取成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 404 | 表单不存在或无权访问 |

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/forms/$FORM_TOKEN/views

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

response = requests.get(
    f'https://jinshuju.net/api/v1/forms/{form_token}/views',
    auth=(api_key, api_secret)
)

print(response.text)
```
