---
sidebar_custom_props:
  method: GET
sidebar_label: 获取单个表单视图
---

# v1 API 获取单个表单视图

> API 使用者，可以通过本接口，获取指定表单下某个视图的详细信息

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 获取单个表单视图 | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

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

<!-- openapi:params getFormView -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 Token（URL 路径参数） |
| VIEW_TOKEN | 是 | String | 视图 Token（URL 路径参数） |

<!-- /openapi -->

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

<!-- openapi:response getFormView -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| token | 是 | String | 视图 Token |
| name | 是 | String | 视图名称 |
| view_type | 是 | String | 视图类型：`grid` / `kanban` / `stats` / `form`（表单视图） |
| position | 是 | Integer | 视图排序位置 |
| predefined | 是 | Boolean | 是否为系统预设视图 |
| visibility | 是 | String | 可见性：`cooperators`（协作者可见）/ `personal`（仅创建者可见） |
| view_scope | 是 | String | 视图归属：`user` / `form`。`form` 视图不可删除，也不可切换可见性 |
| prefer_columns | 是 | Array(String) | 视图展示的字段 `api_code` 列表；为空时表示展示表单可推送字段 |
| sorted_columns | 是 | Array(Object) | 列的显示顺序，按 `position` 升序 |
| sorted_columns[].api_code | 是 | String | 字段的 `api_code` |
| sorted_columns[].position | 是 | Integer | 列位置，从 1 开始 |
| kanban_group_by_api_code | 是 | String / null | 看板视图分组字段的 `api_code` |
| kanban_card_title_api_code | 是 | String / null | 看板卡片标题字段的 `api_code`；未设置时按 `prefer_columns` 推算 |
| kanban_group_order | 是 | Array(String) | 看板分组的显示顺序，元素为分组选项的 `api_code`；`__unset__` 表示未分组 |
| kanban_hidden_groups | 是 | Array(String) | 隐藏的看板分组，取值同 `kanban_group_order` |
| grid_frozen_boundary_api_code | 是 | String / null | 表格视图中冻结列边界处字段的 `api_code` |
| sort | 是 | Array(Object) | 排序规则数组 |
| sort[].api_code | 是 | String | 排序字段的 `api_code`，可包含系统字段如 `serial_number` |
| sort[].order | 是 | String | 排序方向：`asc` / `desc` |
| filter | 是 | Array(Object) | 视图筛选条件数组。无筛选条件时返回空数组 |
| filter[].field | 是 | String | 筛选字段的 `api_code` |
| filter[].operator | 是 | String | 筛选操作符 |
| filter[].value | 否 | Any | 筛选值；`null` / `not_null` 不返回该字段 |
| created_at | 是 | DateTime | 视图创建时间 |
| updated_at | 是 | DateTime | 视图最后更新时间 |
| title | 否 | String / null | 填写页标题（仅表单视图返回） |
| description | 否 | String / null | 填写页描述（仅表单视图返回） |
| published | 否 | Boolean | 是否已发布，未发布时填写链接不可用（仅表单视图返回） |
| fill_url | 否 | String | 对外填写链接（仅表单视图返回） |
| fill_items | 否 | Array(Object) | 填写页上勾选的填写项，按填写页顺序（仅表单视图返回） |
| fill_items[].api_code | 是 | String | 列的 `api_code` |
| fill_items[].label | 是 | String / null | 填写页上显示的标题，未单独设置时为列标题 |
| fill_items[].notes | 是 | String / null | 填写页上显示的说明，未单独设置时为列说明 |
| fill_items[].required | 是 | Boolean | 是否必填 |

<!-- /openapi -->

> 注意：数据中的日期时间，使用的是 UTC 时间（例如：`"2026-05-26T02:00:00.000Z"`），接受者需要自行转换为自己所需要的时区（例如北京时间）。

### 状态码

<!-- openapi:status getFormView -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 获取成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 403 | 无权限（如 OAuth scope 不足） |
| 404 | 表单或视图不存在，或无权访问 |

<!-- /openapi -->

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/forms/$FORM_TOKEN/views/$VIEW_TOKEN

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'
view_token = 'YOUR_VIEW_TOKEN'

response = requests.get(
    f'https://jinshuju.net/api/v1/forms/{form_token}/views/{view_token}',
    headers={'Authorization': f'Bearer {access_token}'}
)

print(response.text)
```
