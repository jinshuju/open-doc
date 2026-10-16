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

<!-- openapi:params createFormView -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| FORM_TOKEN | 是 | String | 表单 token（`GET /forms` 返回的 `token`），也接受 24 位十六进制的表单 id。 |
| name | 是 | String | 视图名称，不能为空<br />长度：≤ 120 个字符 |
| view_type | 否 | String | 视图类型，创建时默认 grid；form 为表单视图（对外填写页），仅表格支持<br />可选值：`grid`、`kanban`、`stats`、`form` |
| visibility | 否 | String | 可见性，创建时默认 cooperators；更新时只有创建者可切换<br />可选值：`cooperators`、`personal` |
| prefer_columns | 否 | Array(String) | 显示的字段 api_code 列表 |
| kanban_group_by_api_code | 否 | String | 看板分组字段 api_code，必须是支持看板分组的字段 |
| kanban_card_title_api_code | 否 | String | 看板卡片标题字段 api_code |
| kanban_group_order | 否 | Array(String) | 看板分组显示顺序，元素须为非空且不重复的字符串 |
| kanban_hidden_groups | 否 | Array(String) | 隐藏的看板分组，元素须为非空且不重复的字符串；传空数组表示显示全部分组 |
| sort | 否 | Array(Object) | 排序规则，整体替换 |
| sort[].api_code | 是 | String | 排序字段 api_code |
| sort[].order | 否 | String | 排序方向<br />可选值：`asc`、`desc`；默认值：`asc` |
| sorted_columns | 否 | Array(Object) | 列显示顺序，整体替换，position 按数组顺序从 1 生成 |
| sorted_columns[].api_code | 是 | String | 字段 api_code |
| filter | 否 | Array(Object) | 筛选条件数组，整体替换；传空数组清空筛选；不是数组时返回 422 |
| filter[].field | 是 | String | 字段 api_code（也接受 api_code / trigger 作为键名） |
| filter[].operator | 是 | String | 运算符，与数据列表 filters 相同：eq、ne、any_in、none_in、between、not_between、null、not_null、gte、gt、lte、lt、like、not_like、match、within_last； 别名 start / end / equal / not_equal 分别等价于 gte / lte / eq / ne。每种字段支持的子集以服务端为准。 选项类字段的 eq / ne 保存时会转为 any_in / none_in 且值转为数组。 |
| filter[].value | 否 | Any | 条件值，类型随字段与运算符而定：between 为两元素数组；within_last 为 \{"unit": "day", "n": 30\}（unit 可为 minute / day / week / month）； 选项类字段可传选项 api_code 或选项文本，"null" 表示未填写；null / not_null 无需 value。 |
| title | 否 | String | 填写页标题，不能为空；创建时缺省为表格名称。仅表单视图（view_type=form）可用，用在其他类型上返回 422。<br />长度：≤ 120 个字符 |
| description | 否 | String / null | 填写页描述。仅表单视图（view_type=form）可用，用在其他类型上返回 422。 |
| published | 否 | Boolean | 是否发布填写页，创建时缺省 false。仅表单视图（view_type=form）可用，用在其他类型上返回 422。 |
| field_overrides | 否 | Array(Object) | 填写项配置，整体替换；创建时不传则按当前列顺序勾选全部可填写的列。仅表单视图（view_type=form）可用，用在其他类型上返回 422。 |
| field_overrides[].field_api_code | 是 | String | 列的 api_code；列必须存在且可作为填写项，同一请求中不能重复 |
| field_overrides[].label | 否 | String / null | 填写页上的标题；为空时沿用列标题 |
| field_overrides[].notes | 否 | String / null | 填写页上的说明；为空时沿用列说明 |
| field_overrides[].private | 否 | Boolean / null | 为 true 时不出现在填写页；不传时沿用列自身设置 |
| field_overrides[].position | 否 | Integer / null | 在填写页中的顺序；不传时按数组顺序 |
| field_overrides[].validations | 否 | Array(String) | 该填写项的校验，目前用 `presence` 表示必填；必须是该列类型支持的校验（如是否列、计算列不能设为必填），否则 422 |
| cid | 否 | String | 客户端标识，随实时变更广播透传（以服务端实现为准） |

<!-- /openapi -->

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

<!-- openapi:response createFormView -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| token | 是 | String | 视图 token |
| name | 是 | String | 视图名称 |
| view_type | 是 | String | 视图类型；form 为表单视图（对外填写页，仅表格支持）<br />可选值：`grid`、`kanban`、`stats`、`form` |
| position | 是 | Integer | 排序位置 |
| predefined | 是 | Boolean | 是否为预置视图（不可删除） |
| visibility | 是 | String | 可见性，cooperators 对全部协作者可见，personal 仅创建者可见<br />可选值：`cooperators`、`personal` |
| view_scope | 是 | String | 视图归属，form 表示属于表单本身（不可删除、不可切换可见性）<br />可选值：`user`、`form` |
| prefer_columns | 是 | Array(String) | 显示的字段 api_code 列表 |
| sorted_columns | 是 | Array(Object) | 列显示顺序，按 position 升序 |
| sorted_columns[].api_code | 是 | String | 字段 api_code |
| sorted_columns[].position | 是 | Integer | 列位置，从 1 开始 |
| kanban_group_by_api_code | 是 | String / null | 看板分组字段 api_code |
| kanban_card_title_api_code | 是 | String / null | 看板卡片标题字段 api_code，未设置时由服务端根据 prefer_columns 推算 |
| kanban_group_order | 是 | Array(String) | 看板分组显示顺序（分组选项 api_code，`__unset__` 表示未设置分组） |
| kanban_hidden_groups | 是 | Array(String) | 隐藏的看板分组（同 kanban_group_order 的取值） |
| grid_frozen_boundary_api_code | 是 | String / null | 表格视图冻结列边界字段 api_code |
| sort | 是 | Array(Object) | 排序规则 |
| sort[].api_code | 是 | String | 排序字段 api_code |
| sort[].order | 是 | String | 排序方向<br />可选值：`asc`、`desc` |
| filter | 是 | Array(Object) | 筛选条件，无筛选时为空数组 |
| filter[].field | 是 | String | 字段 api_code（也接受 api_code / trigger 作为键名） |
| filter[].operator | 是 | String | 运算符，与数据列表 filters 相同：eq、ne、any_in、none_in、between、not_between、null、not_null、gte、gt、lte、lt、like、not_like、match、within_last； 别名 start / end / equal / not_equal 分别等价于 gte / lte / eq / ne。每种字段支持的子集以服务端为准。 选项类字段的 eq / ne 保存时会转为 any_in / none_in 且值转为数组。 |
| filter[].value | 否 | Any | 条件值，类型随字段与运算符而定：between 为两元素数组；within_last 为 \{"unit": "day", "n": 30\}（unit 可为 minute / day / week / month）； 选项类字段可传选项 api_code 或选项文本，"null" 表示未填写；null / not_null 无需 value。 |
| created_at | 是 | DateTime | 创建时间 |
| updated_at | 是 | DateTime | 更新时间 |
| title | 否 | String / null | 填写页标题（仅表单视图返回） |
| description | 否 | String / null | 填写页描述（仅表单视图返回） |
| published | 否 | Boolean | 是否已发布；未发布时填写链接不可用（仅表单视图返回） |
| fill_url | 否 | String | 对外填写链接（仅表单视图返回） |
| fill_items | 否 | Array(Object) | 填写页上勾选的填写项，按填写页顺序，值为生效值（仅表单视图返回） |
| fill_items[].api_code | 是 | String | 列的 api_code |
| fill_items[].label | 是 | String / null | 填写页上显示的标题（未单独设置时为列标题） |
| fill_items[].notes | 是 | String / null | 填写页上显示的说明（未单独设置时为列说明） |
| fill_items[].required | 是 | Boolean | 是否必填 |

<!-- /openapi -->

### 状态码

<!-- openapi:status createFormView -->

| 状态码 | 说明 |
| ------ | ------ |
| 201 | 创建成功，返回视图 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |
| 422 | 请求无法处理（视图数量达到上限、筛选条件不合法、模型校验失败、不允许删除等），响应体为 \{ error_description \} |

<!-- /openapi -->

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
