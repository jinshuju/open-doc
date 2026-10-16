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
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |

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
| count | 是 | Integer | 返回的视图数量 |
| data | 是 | Array(Object) |  |
| data[].token | 是 | String | 视图 token |
| data[].name | 是 | String | 视图名称 |
| data[].view_type | 是 | String | 视图类型；form 为表单视图（对外填写页，仅表格支持）<br />可选值：`grid`、`kanban`、`stats`、`form` |
| data[].position | 是 | Integer | 排序位置 |
| data[].predefined | 是 | Boolean | 是否为预置视图（不可删除） |
| data[].visibility | 是 | String | 可见性，cooperators 对全部协作者可见，personal 仅创建者可见<br />可选值：`cooperators`、`personal` |
| data[].view_scope | 是 | String | 视图归属，form 表示属于表单本身（不可删除、不可切换可见性）<br />可选值：`user`、`form` |
| data[].prefer_columns | 是 | Array(String) | 显示的字段 api_code 列表 |
| data[].sorted_columns | 是 | Array(Object) | 列显示顺序，按 position 升序 |
| data[].sorted_columns[].api_code | 是 | String | 字段 api_code |
| data[].sorted_columns[].position | 是 | Integer | 列位置，从 1 开始 |
| data[].kanban_group_by_api_code | 是 | String / null | 看板分组字段 api_code |
| data[].kanban_card_title_api_code | 是 | String / null | 看板卡片标题字段 api_code，未设置时由服务端根据 prefer_columns 推算 |
| data[].kanban_group_order | 是 | Array(String) | 看板分组显示顺序（分组选项 api_code，`__unset__` 表示未设置分组） |
| data[].kanban_hidden_groups | 是 | Array(String) | 隐藏的看板分组（同 kanban_group_order 的取值） |
| data[].grid_frozen_boundary_api_code | 是 | String / null | 表格视图冻结列边界字段 api_code |
| data[].sort | 是 | Array(Object) | 排序规则 |
| data[].sort[].api_code | 是 | String | 排序字段 api_code |
| data[].sort[].order | 是 | String | 排序方向<br />可选值：`asc`、`desc` |
| data[].filter | 是 | Array(Object) | 筛选条件，无筛选时为空数组 |
| data[].filter[].field | 是 | String | 字段 api_code（也接受 api_code / trigger 作为键名） |
| data[].filter[].operator | 是 | String | 运算符，与数据列表 filters 相同：eq、ne、any_in、none_in、between、not_between、null、not_null、gte、gt、lte、lt、like、not_like、match、within_last； 别名 start / end / equal / not_equal 分别等价于 gte / lte / eq / ne。每种字段支持的子集以服务端为准。 选项类字段的 eq / ne 保存时会转为 any_in / none_in 且值转为数组。 |
| data[].filter[].value | 否 | Any | 条件值，类型随字段与运算符而定：between 为两元素数组；within_last 为 \{"unit": "day", "n": 30\}（unit 可为 minute / day / week / month）； 选项类字段可传选项 api_code 或选项文本，"null" 表示未填写；null / not_null 无需 value。 |
| data[].created_at | 是 | DateTime | 创建时间 |
| data[].updated_at | 是 | DateTime | 更新时间 |
| data[].title | 否 | String / null | 填写页标题（仅表单视图返回） |
| data[].description | 否 | String / null | 填写页描述（仅表单视图返回） |
| data[].published | 否 | Boolean | 是否已发布；未发布时填写链接不可用（仅表单视图返回） |
| data[].fill_url | 否 | String | 对外填写链接（仅表单视图返回） |
| data[].fill_items | 否 | Array(Object) | 填写页上勾选的填写项，按填写页顺序，值为生效值（仅表单视图返回） |
| data[].fill_items[].api_code | 是 | String | 列的 api_code |
| data[].fill_items[].label | 是 | String / null | 填写页上显示的标题（未单独设置时为列标题） |
| data[].fill_items[].notes | 是 | String / null | 填写页上显示的说明（未单独设置时为列说明） |
| data[].fill_items[].required | 是 | Boolean | 是否必填 |

<!-- /openapi -->

> 注意：数据中的日期时间，使用的是 UTC 时间（例如：`"2026-05-26T02:00:00.000Z"`），接受者需要自行转换为自己所需要的时区（例如北京时间）。

### 状态码

<!-- openapi:status listFormViews -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 视图列表 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |

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
