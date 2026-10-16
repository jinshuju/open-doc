---
sidebar_custom_props:
  method: GET
sidebar_label: 获取表单视图列表
---

# v1 API 获取表单视图列表

> API 使用者，可以通过本接口，获取指定表单下的视图列表

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取表单视图列表 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

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

<!-- openapi:params listFormViews -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 Token（URL 路径参数） |

<!-- /openapi -->

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

<!-- openapi:response listFormViews -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| count | 是 | Integer | 本次返回的视图数量 |
| data | 是 | Array(Object) | 视图数组 |
| data[].token | 是 | String | 视图 Token，用于后续获取、更新、删除视图，或获取视图下的数据 |
| data[].name | 是 | String | 视图名称 |
| data[].view_type | 是 | String | 视图类型：`grid` / `kanban` / `stats` / `form`（表单视图） |
| data[].position | 是 | Integer | 视图排序位置 |
| data[].predefined | 是 | Boolean | 是否为系统预设视图 |
| data[].visibility | 是 | String | 可见性：`cooperators`（协作者可见）/ `personal`（仅创建者可见） |
| data[].view_scope | 是 | String | 视图归属：`user` / `form`。`form` 视图不可删除，也不可切换可见性 |
| data[].prefer_columns | 是 | Array(String) | 视图展示的字段 `api_code` 列表；为空时表示展示表单可推送字段 |
| data[].sorted_columns | 是 | Array(Object) | 列的显示顺序，按 `position` 升序 |
| data[].sorted_columns[].api_code | 是 | String | 字段的 `api_code` |
| data[].sorted_columns[].position | 是 | Integer | 列位置，从 1 开始 |
| data[].kanban_group_by_api_code | 是 | String / null | 看板视图分组字段的 `api_code` |
| data[].kanban_card_title_api_code | 是 | String / null | 看板卡片标题字段的 `api_code`；未设置时按 `prefer_columns` 推算 |
| data[].kanban_group_order | 是 | Array(String) | 看板分组的显示顺序，元素为分组选项的 `api_code`；`__unset__` 表示未分组 |
| data[].kanban_hidden_groups | 是 | Array(String) | 隐藏的看板分组，取值同 `kanban_group_order` |
| data[].grid_frozen_boundary_api_code | 是 | String / null | 表格视图中冻结列边界处字段的 `api_code` |
| data[].sort | 是 | Array(Object) | 排序规则数组 |
| data[].sort[].api_code | 是 | String | 排序字段的 `api_code`，可包含系统字段如 `serial_number` |
| data[].sort[].order | 是 | String | 排序方向：`asc` / `desc` |
| data[].filter | 是 | Array(Object) | 视图筛选条件数组。无筛选条件时返回空数组 |
| data[].filter[].field | 是 | String | 筛选字段的 `api_code` |
| data[].filter[].operator | 是 | String | 筛选操作符 |
| data[].filter[].value | 否 | Any | 筛选值；`null` / `not_null` 不返回该字段 |
| data[].created_at | 是 | DateTime | 视图创建时间 |
| data[].updated_at | 是 | DateTime | 视图最后更新时间 |
| data[].title | 否 | String / null | 填写页标题（仅表单视图返回） |
| data[].description | 否 | String / null | 填写页描述（仅表单视图返回） |
| data[].published | 否 | Boolean | 是否已发布，未发布时填写链接不可用（仅表单视图返回） |
| data[].fill_url | 否 | String | 对外填写链接（仅表单视图返回） |
| data[].fill_items | 否 | Array(Object) | 填写页上勾选的填写项，按填写页顺序（仅表单视图返回） |
| data[].fill_items[].api_code | 是 | String | 列的 `api_code` |
| data[].fill_items[].label | 是 | String / null | 填写页上显示的标题，未单独设置时为列标题 |
| data[].fill_items[].notes | 是 | String / null | 填写页上显示的说明，未单独设置时为列说明 |
| data[].fill_items[].required | 是 | Boolean | 是否必填 |

<!-- /openapi -->

> 注意：数据中的日期时间，使用的是 UTC 时间（例如：`"2026-05-26T02:00:00.000Z"`），接受者需要自行转换为自己所需要的时区（例如北京时间）。

### 状态码

<!-- openapi:status listFormViews -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 获取成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 403 | 无权限（如 OAuth scope 不足） |
| 404 | 表单不存在或无权访问 |

<!-- /openapi -->

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/forms/$FORM_TOKEN/views

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'

response = requests.get(
    f'https://jinshuju.net/api/v1/forms/{form_token}/views',
    headers={'Authorization': f'Bearer {access_token}'}
)

print(response.text)
```
