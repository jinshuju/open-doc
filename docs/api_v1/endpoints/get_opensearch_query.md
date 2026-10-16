---
sidebar_custom_props:
  method: GET
sidebar_label: 获取单个对外查询
---

# v1 API 获取单个对外查询

> API 使用者，可以通过本接口，获取一个对外查询页面的完整配置

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

* 只能获取**自己创建**的对外查询；别人创建的查询返回 404。
* `search_field_rules` 和 `display_field_rules` 在[编辑对外查询](/api_v1/endpoints/update_opensearch_query)时是 REPLACE 语义，所以改之前先用本接口把完整列表读出来再合并。
* `messages` 是**已存下来的**文案，未设置的 key 在公开页上会回落到产品默认值；`default_messages` 是回落之后的实际生效文案。编辑时要基于 `messages` 合并，**不要基于 `default_messages`**，否则会把默认值固化进记录里。

## 接口描述

### Request

```
GET https://jinshuju.net/api/v1/opensearch/queries/QUERY_TOKEN
```

<!-- openapi:params getOpensearchQuery -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| QUERY_TOKEN | 是 | String | 对外查询 token（也接受 id） |

<!-- /openapi -->

### Response

```json
{
    "token": "o5qeEX",
    "url": "https://demo.jinshuju.net/os/o5qeEX",
    "name": "成绩查询",
    "enabled": true,
    "form_token": "wX7pQ2",
    "created_at": "2026-09-07T16:11:37.532+08:00",
    "description": null,
    "status": "active",
    "search_field_rules": [
        {
            "operand": "and",
            "search_field_settings": [
                {
                    "field_api_code": "field_2",
                    "field_label": "手机号",
                    "fuzzy": false,
                    "sms_verification": false
                }
            ]
        }
    ],
    "display_field_rules": [
        {
            "field_api_code": "field_1",
            "field_label": null,
            "editable": false,
            "protected": true,
            "highlight": null
        }
    ],
    "messages": { "has_result": "查到了", "no_result": "没查到" },
    "default_messages": { "has_result": "查到了", "no_result": "没查到" },
    "search_button": {},
    "allow_to_export_results": false,
    "updated_at": "2026-09-07T16:11:56.412+08:00",
    "searches_count": 128,
    "views_count": 356
}
```

<!-- openapi:response getOpensearchQuery -->

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

<!-- openapi:status getOpensearchQuery -->

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 对外查询详情 |
| 401 | 未认证：令牌无效或已撤销 |
| 402 | 当前套餐不包含 API v1 能力 |
| 403 | 无权限：OAuth 令牌 scope 不足，或操作被业务规则拒绝 |
| 404 | 资源不存在或当前身份不可访问（个人令牌只能访问自己创建或被共享的表单） |

<!-- /openapi -->

## 示例代码

### HTTP

```http
GET https://jinshuju.net/api/v1/opensearch/queries/$QUERY_TOKEN

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
query_token = 'YOUR_QUERY_TOKEN'

response = requests.get(
    f'https://jinshuju.net/api/v1/opensearch/queries/{query_token}',
    headers={'Authorization': f'Bearer {access_token}'}
)

print(response.text)
```
