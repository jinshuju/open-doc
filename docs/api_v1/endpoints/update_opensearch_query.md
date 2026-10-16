---
sidebar_custom_props:
  method: PATCH
sidebar_label: 编辑对外查询
---

# v1 API 编辑对外查询

> API 使用者，可以通过本接口，修改对外查询页面的配置，或启用/停用它

| 功能 | 免费版 | 专业版/专业增强版 | 企业基础版 | 企业协作版 | 企业高级版 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 对外查询 | ❌ | ✔️ | ✔️ | ✔️ | ✔️ |

## 认证方式

[V1 Bearer 认证方式](/api_v1/authentication)

## headers 设置

需要在请求中设置如下 headers

* `Content-Type: application/json`
* `Accept: application/json`
* `Authorization: Bearer YOUR_ACCESS_TOKEN`

## 接口说明

* 只能编辑**自己创建**的对外查询；别人创建的返回 404。
* **只有传入的 key 会被更新**，未传的 key 保持原值。
* `search_field_rules` / `display_field_rules` / `messages` / `search_button` 都是 **REPLACE 语义**：传该字段会整体替换当前值。改规则前请先用[获取单个对外查询](/api_v1/endpoints/get_opensearch_query)读出完整列表再合并后回传，否则没回传的规则会被静默删除。
* 合并 `messages` 时基于响应里的 `messages`（已存值），**不要基于 `default_messages`**，否则会把产品默认文案固化进记录。
* 停用查询只需传 `{"enabled": false}`。注意 `status` 字段与 `enabled` 无关，它描述的是「表单是否还在、数据量是否超出套餐上限」。
* 已有查询的编辑**不受套餐限制** —— 套餐不支持对外查询时，仍可以编辑或停用已存在的查询（只有新建会返回 402）。
* 来源表单已被删除的查询无法再编辑，返回 400。
* 也接受 `PUT` 方法，语义与 `PATCH` 相同。

## 接口描述

### Request

```
PATCH https://jinshuju.net/api/v1/opensearch/queries/QUERY_TOKEN

{
    "name": "2026 春季成绩查询",
    "enabled": false
}
```

<!-- openapi:params updateOpensearchQuery -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| QUERY_TOKEN | 是 | String | 对外查询 token（也接受 id） |
| form_token | 否 | String | 仅创建时使用：所属表单的 token（也可作为 query 参数传递） |
| name | 否 | String | 名称，不能为空 |
| description | 否 | String | 说明文字 |
| enabled | 否 | Boolean | 是否启用 |
| search_field_rules | 否 | Array(Object) | 查询字段规则，整体替换；传入时不能为空数组，每条规则的 search_field_settings 不能为空<br />数量：≥ 1 项 |
| search_field_rules[].operand | 否 | String | 规则内各查询字段的组合方式<br />可选值：`and`、`or`；默认值：`and` |
| search_field_rules[].search_field_settings | 是 | Array(Object) | 查询字段设置，不能为空<br />数量：≥ 1 项 |
| search_field_rules[].search_field_settings[].field_api_code | 是 | String | 查询字段 api_code，必须是表单可查询的字段 |
| search_field_rules[].search_field_settings[].field_label | 否 | String / null | 对外显示的字段标签，为空时用字段原标签 |
| search_field_rules[].search_field_settings[].fuzzy | 否 | Boolean | 是否模糊匹配<br />默认值：`false` |
| search_field_rules[].search_field_settings[].sms_verification | 否 | Boolean | 是否需要短信验证（仅对手机字段生效）<br />默认值：`false` |
| display_field_rules | 否 | Array(Object) | 展示字段规则，整体替换；传入时不能为空数组<br />数量：≥ 1 项 |
| display_field_rules[].field_api_code | 是 | String | 展示字段 api_code，必须是表单可展示的字段 |
| display_field_rules[].field_label | 否 | String / null | 对外显示的字段标签，为空时用字段原标签 |
| display_field_rules[].editable | 否 | Boolean | 查询者是否可在结果页编辑该字段<br />默认值：`false` |
| display_field_rules[].protected | 否 | Boolean | 是否隐私保护（脱敏显示，仅对支持隐私保护的字段生效）<br />默认值：`false` |
| display_field_rules[].highlight | 否 | Object / null | 高亮设置，未设置时为 null |
| display_field_rules[].highlight.color | 否 | String / null | 高亮颜色 |
| display_field_rules[].highlight.position | 否 | Integer | 高亮排序位置<br />默认值：`999` |
| search_button | 否 | Object | 查询按钮设置，只读取 text 与 color |
| search_button.text | 否 | String | 按钮文字 |
| search_button.color | 否 | String | 按钮颜色 |
| messages | 否 | Object | 提示文案，只读取 has_result 与 no_result；缺省的键使用产品默认文案 |
| messages.has_result | 否 | String | 查到结果时的提示 |
| messages.no_result | 否 | String | 未查到结果时的提示 |
| allow_to_export_results | 否 | Boolean | 是否允许查询者导出结果 |
| header | 否 | Object | 页头设置，只读取 background_image 的 attachment_id、image_upload_token、position_x、position_y（以服务端实现为准） |
| header.background_image | 否 | Object |  |
| header.background_image.attachment_id | 否 | String | 背景图附件 id，由「上传表单图片」（`POST /form_image_attachments`，`image_type=opensearch_header`）返回 |
| header.background_image.image_upload_token | 否 | String | 代替 attachment_id：以 `form_image_token`（用途为 opensearch_header）上传后，直接传这个令牌。令牌须已上传、未过期、属于调用者且用途为 opensearch_header，否则返回 400 |
| header.background_image.position_x | 否 | Number | 背景图横向位置 |
| header.background_image.position_y | 否 | Number | 背景图纵向位置 |
| extra_configurable_setting | 否 | Object | 额外设置（以服务端实现为准） |
| extra_configurable_setting.show_exam_correct_answer | 否 | Boolean | 是否显示考试正确答案 |
| extra_configurable_setting.show_exam_explanation | 否 | Boolean | 是否显示考试解析 |
| scope_conditions | 否 | Array(Object) | 限定可查询数据范围的条件，需要套餐支持，否则返回 400；每项只读取 trigger、operator、value、group_index、scope_attr |
| scope_conditions[].trigger | 否 | String | 触发字段 api_code |
| scope_conditions[].operator | 否 | String | 运算符（以服务端实现为准） |
| scope_conditions[].value | 否 | Any | 条件值 |
| scope_conditions[].group_index | 否 | Integer | 条件分组序号，同组为 and，不同组为 or |
| scope_conditions[].scope_attr | 否 | String | 条件作用的属性（以服务端实现为准） |

<!-- /openapi -->

### Response

返回更新后的完整配置，结构同[获取单个对外查询](/api_v1/endpoints/get_opensearch_query)。

<!-- openapi:response updateOpensearchQuery -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| token | 是 | String | 对外查询 token |
| url | 是 | String | 对外查询公开访问地址（/os/\{token\}，使用账户子域名或自定义域名） |
| name | 是 | String | 名称 |
| enabled | 是 | Boolean | 是否启用 |
| form_token | 是 | String / null | 所属表单 token，表单已删除时为 null |
| created_at | 是 | DateTime | 创建时间 |
| searches_count | 是 | Integer | 累计查询次数 |
| views_count | 是 | Integer | 累计访问次数 |
| description | 是 | String / null | 说明文字 |
| status | 是 | String | 状态：active 可用；entries_count_limited 表单数据量超过套餐对外查询上限；form_not_found 表单已删除<br />可选值：`active`、`entries_count_limited`、`form_not_found` |
| search_field_rules | 是 | Array(Object) | 查询字段规则 |
| search_field_rules[].operand | 是 | String | 规则内各查询字段的组合方式<br />可选值：`and`、`or`；默认值：`and` |
| search_field_rules[].search_field_settings | 是 | Array(Object) | 查询字段设置，不能为空<br />数量：≥ 1 项 |
| search_field_rules[].search_field_settings[].field_api_code | 是 | String | 查询字段 api_code，必须是表单可查询的字段 |
| search_field_rules[].search_field_settings[].field_label | 否 | String / null | 对外显示的字段标签，为空时用字段原标签 |
| search_field_rules[].search_field_settings[].fuzzy | 否 | Boolean | 是否模糊匹配<br />默认值：`false` |
| search_field_rules[].search_field_settings[].sms_verification | 否 | Boolean | 是否需要短信验证（仅对手机字段生效）<br />默认值：`false` |
| display_field_rules | 是 | Array(Object) | 展示字段规则 |
| display_field_rules[].field_api_code | 是 | String | 展示字段 api_code，必须是表单可展示的字段 |
| display_field_rules[].field_label | 是 | String / null | 对外显示的字段标签，为空时用字段原标签 |
| display_field_rules[].editable | 是 | Boolean | 查询者是否可在结果页编辑该字段<br />默认值：`false` |
| display_field_rules[].protected | 是 | Boolean | 是否隐私保护（脱敏显示，仅对支持隐私保护的字段生效）<br />默认值：`false` |
| display_field_rules[].highlight | 是 | Object / null | 高亮设置，未设置时为 null |
| display_field_rules[].highlight.color | 否 | String / null | 高亮颜色 |
| display_field_rules[].highlight.position | 否 | Integer | 高亮排序位置<br />默认值：`999` |
| messages | 是 | Object / null | 已保存的提示文案原始值，未自定义时为空对象或 null |
| messages.has_result | 否 | String | 查到结果时的提示 |
| messages.no_result | 否 | String | 未查到结果时的提示 |
| default_messages | 是 | Object | 合并产品默认文案后的提示文案（按表单语言） |
| default_messages.has_result | 是 | String | 查到结果时的提示 |
| default_messages.no_result | 是 | String | 未查到结果时的提示 |
| search_button | 是 | Object | 查询按钮设置，未设置时为空对象 |
| search_button.text | 否 | String | 按钮文字 |
| search_button.color | 否 | String | 按钮颜色 |
| allow_to_export_results | 是 | Boolean | 是否允许查询者导出结果 |
| header | 是 | Object | 页头设置 |
| header.background_image | 是 | Object / null | 页头背景图，未设置时为 null |
| header.background_image.attachment_id | 是 | String | 背景图附件 id |
| header.background_image.position_x | 是 | Number / null | 背景图横向位置 |
| header.background_image.position_y | 是 | Number / null | 背景图纵向位置 |
| header.background_image.image_url | 是 | String / null | 背景图地址 |
| updated_at | 是 | DateTime | 更新时间 |

<!-- /openapi -->

### 状态码

<!-- openapi:status updateOpensearchQuery -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 更新成功，返回对外查询详情 |
| 400 | 请求参数或数据不合法 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |

<!-- /openapi -->

## 示例代码

### HTTP

```http
PATCH https://jinshuju.net/api/v1/opensearch/queries/$QUERY_TOKEN

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{"enabled": false}
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
query_token = 'YOUR_QUERY_TOKEN'
base = 'https://jinshuju.net/api/v1'
headers = {'Authorization': f'Bearer {access_token}'}

# 新增一个展示字段：先读全量，合并后整体回传
current = requests.get(f'{base}/opensearch/queries/{query_token}', headers=headers).json()
display_rules = [
    {k: v for k, v in rule.items() if v is not None}
    for rule in current['display_field_rules']
]
display_rules.append({'field_api_code': 'field_4'})

response = requests.patch(
    f'{base}/opensearch/queries/{query_token}',
    headers=headers,
    json={'display_field_rules': display_rules}
)

print(response.text)
```
