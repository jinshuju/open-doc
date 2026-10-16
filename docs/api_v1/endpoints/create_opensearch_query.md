---
sidebar_custom_props:
  method: POST
sidebar_label: 创建对外查询
---

# v1 API 创建对外查询

> API 使用者，可以通过本接口，为一张表单创建对外查询页面：访问者填入查询条件即可查到匹配的数据

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

* **先调用[获取对外查询可用字段](/api_v1/endpoints/get_opensearch_query_suggestions)**，`search_field_rules` / `display_field_rules` 里的 `api_code` 必须来自那里，否则返回 400 并列出合法取值。
* 调用方需要是该表单的**管理员**；能读表单但无管理权时返回 403。
* 需要当前套餐支持「对外查询」，否则返回 402。
* 创建出的查询归调用方所有，之后只有创建者能获取和编辑（账号级 API 的身份等同于账号 owner）。
* `display_field_rules` 不能为空。`protected` / `editable` 只在字段本身支持时生效（见可用字段接口的 `privacy_protectable` / `editable`）。

## 接口描述

### Request

```
POST https://jinshuju.net/api/v1/opensearch/queries

{
    "form_token": "wX7pQ2",
    "name": "成绩查询",
    "search_field_rules": [
        {
            "operand": "and",
            "search_field_settings": [
                { "field_api_code": "field_2", "field_label": "手机号", "sms_verification": true }
            ]
        }
    ],
    "display_field_rules": [
        { "field_api_code": "field_1", "protected": true },
        { "field_api_code": "field_3" }
    ],
    "messages": { "has_result": "查到了你的成绩", "no_result": "没有查到，请核对手机号" },
    "search_button": { "text": "查询成绩", "color": "#1F6FEB" },
    "allow_to_export_results": false
}
```

<!-- openapi:params createOpensearchQuery -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| form_token | 是 | String | 数据来源表单的 Token |
| name | 是 | String | 查询页标题 |
| description | 否 | String | 查询页描述文案 |
| enabled | 否 | Boolean | 是否启用，默认 `true` |
| search_field_rules | 否 | Array([OpensearchSearchFieldRule](#opensearchsearchfieldrule)) | 查询条件组，通常只有一组；结构见[获取单个对外查询](/api_v1/endpoints/get_opensearch_query) |
| display_field_rules | 是 | Array([OpensearchDisplayFieldRule](#opensearchdisplayfieldrule)) | 命中数据展示的字段，按展示顺序，不能为空 |
| search_button | 否 | Object | 查询按钮外观，包含 `text` / `color` |
| search_button.text | 否 | String | 按钮文字 |
| search_button.color | 否 | String | 按钮颜色 |
| messages | 否 | Object | 结果文案，包含 `has_result` / `no_result`；未传的 key 在公开页上回落到产品默认值 |
| messages.has_result | 否 | String | 查到结果时的提示文案 |
| messages.no_result | 否 | String | 未查到结果时的提示文案 |
| allow_to_export_results | 否 | Boolean | 是否允许访问者导出查询结果，默认 `false` |
| header | 否 | Object | 页头设置 |
| header.background_image | 否 | Object | 页头背景图 |
| header.background_image.attachment_id | 否 | String | 背景图附件 ID，由 `POST /form_image_attachments`（`image_type=opensearch_header`）返回 |
| header.background_image.image_upload_token | 否 | String | 与 `attachment_id` 二选一：用途为 `opensearch_header` 的 `form_image_token` |
| header.background_image.position_x | 否 | Number | 背景图横向位置 |
| header.background_image.position_y | 否 | Number | 背景图纵向位置 |
| extra_configurable_setting | 否 | Object | 额外设置 |
| extra_configurable_setting.show_exam_correct_answer | 否 | Boolean | 是否展示考试正确答案 |
| extra_configurable_setting.show_exam_explanation | 否 | Boolean | 是否展示考试答案解析 |
| scope_conditions | 否 | Array(Object) | 限定可被查询的数据范围；需套餐支持，否则返回 400 |
| scope_conditions[].trigger | 否 | String | 触发字段的 `api_code` |
| scope_conditions[].operator | 否 | String | 运算符 |
| scope_conditions[].value | 否 | Any | 条件值 |
| scope_conditions[].group_index | 否 | Integer | 条件分组序号；同组条件为 and，不同组之间为 or |
| scope_conditions[].scope_attr | 否 | String | 条件作用的属性 |

<!-- /openapi -->

### Response

`201 Created`，返回新建查询的完整配置，结构同[获取单个对外查询](/api_v1/endpoints/get_opensearch_query)。把响应里的 `url` 交给访问者即可开始使用。

<!-- openapi:response createOpensearchQuery -->

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| token | 是 | String | 对外查询 Token |
| url | 是 | String | 公开查询页地址 |
| name | 是 | String | 查询页标题 |
| enabled | 是 | Boolean | 是否启用 |
| form_token | 是 | String / null | 数据来源表单 Token；来源表单已删除时为 `null` |
| created_at | 是 | DateTime | 创建时间 |
| searches_count | 是 | Integer | 累计查询次数 |
| views_count | 是 | Integer | 累计访问次数 |
| description | 是 | String / null | 查询页描述文案 |
| status | 是 | String | 查询页可用状态：`active` = 正常；`entries_count_limited` = 表单数据量超出套餐的对外查询上限，访问者会看到不可用提示；`form_not_found` = 来源表单已删除。**与 `enabled` 无关**，停用的查询 `status` 仍可能是 `active` |
| search_field_rules | 是 | Array(Object) | 查询条件组，通常只有一组 |
| search_field_rules[].operand | 是 | String | 组内多个查询字段的关系：`and` = 全部匹配；`or` = 任一匹配 |
| search_field_rules[].search_field_settings | 是 | Array([OpensearchSearchFieldSetting](#opensearchsearchfieldsetting)) | 访问者需要填写的查询字段 |
| display_field_rules | 是 | Array(Object) | 命中数据展示的字段，按展示顺序 |
| display_field_rules[].field_api_code | 是 | String | 展示字段的 `api_code` |
| display_field_rules[].field_label | 是 | String / null | 自定义标签；未设置为 `null` |
| display_field_rules[].editable | 是 | Boolean | 是否允许访问者在结果页编辑该字段值 |
| display_field_rules[].protected | 是 | Boolean | 是否对值做隐私脱敏（如 张*三） |
| display_field_rules[].highlight | 是 | Object / null | 高亮设置；未设置为 `null` |
| display_field_rules[].highlight.color | 否 | String / null | 高亮颜色（CSS 颜色值） |
| display_field_rules[].highlight.position | 否 | Integer | 多个高亮字段间的排序，越小越靠前 |
| messages | 是 | Object / null | 已存下来的结果文案；未设置的 key 不出现 |
| messages.has_result | 否 | String | 查到结果时的提示文案 |
| messages.no_result | 否 | String | 未查到结果时的提示文案 |
| default_messages | 是 | Object | 回落默认值之后的实际生效文案 |
| default_messages.has_result | 是 | String | 查到结果时的提示文案 |
| default_messages.no_result | 是 | String | 未查到结果时的提示文案 |
| search_button | 是 | Object | 查询按钮外观，包含 `text` / `color`；未设置时为 `{}` |
| search_button.text | 否 | String | 按钮文字 |
| search_button.color | 否 | String | 按钮颜色 |
| allow_to_export_results | 是 | Boolean | 是否允许访问者导出查询结果 |
| header | 是 | Object | 页头设置 |
| header.background_image | 是 | Object / null | 页头背景图；未设置为 `null` |
| header.background_image.attachment_id | 是 | String | 背景图附件 ID |
| header.background_image.position_x | 是 | Number / null | 背景图横向位置 |
| header.background_image.position_y | 是 | Number / null | 背景图纵向位置 |
| header.background_image.image_url | 是 | String / null | 背景图地址 |
| updated_at | 是 | DateTime | 最后更新时间 |

<!-- /openapi -->

### 状态码

<!-- openapi:status createOpensearchQuery -->

| 状态码 | 说明 |
| ------ | ------ |
| 201 | 创建成功 |
| 400 | 参数不合法：`api_code` 不在该表单的可查询/可展示字段内、查询条件或展示字段为空等，错误详情见 `error_description` |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API 或不支持「对外查询」 |
| 403 | 能访问该表单但不是表单管理员 |
| 404 | 表单不存在或无权访问 |

<!-- /openapi -->

## 数据类型

<!-- openapi:types -->

### OpensearchSearchFieldRule

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| operand | 否 | String | 组内多个查询字段的关系：`and` = 全部匹配；`or` = 任一匹配。默认 `and` |
| search_field_settings | 是 | Array([OpensearchSearchFieldSetting](#opensearchsearchfieldsetting)) | 访问者需要填写的查询字段，不能为空 |

### OpensearchDisplayFieldRule

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| field_api_code | 是 | String | 展示字段的 `api_code`，须在[可用字段](/api_v1/endpoints/get_opensearch_query_suggestions)的 `display_fields` 中 |
| field_label | 否 | String / null | 展示给访问者的自定义标签；为空时用字段标题 |
| editable | 否 | Boolean | 是否允许访问者在结果页编辑该字段值，默认 `false` |
| protected | 否 | Boolean | 是否对值做隐私脱敏，默认 `false`；仅支持脱敏的字段生效 |
| highlight | 否 | Object / null | 高亮设置；`null` 表示不高亮 |
| highlight.color | 否 | String / null | 高亮颜色（CSS 颜色值） |
| highlight.position | 否 | Integer | 多个高亮字段间的排序，越小越靠前，默认 `999` |

### OpensearchSearchFieldSetting

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| field_api_code | 是 | String | 查询字段的 `api_code`，须在[可用字段](/api_v1/endpoints/get_opensearch_query_suggestions)的 `search_fields` 中 |
| field_label | 否 | String / null | 展示给访问者的自定义标签；未设置（`null`）时用字段标题 |
| fuzzy | 否 | Boolean | `true` = 包含匹配；`false` = 精确匹配（默认） |
| sms_verification | 否 | Boolean | 查询前是否要求短信验证（仅手机号字段生效），默认 `false` |

<!-- /openapi -->

## 示例代码

### HTTP

```http
POST https://jinshuju.net/api/v1/opensearch/queries

Content-Type: application/json
Accept: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "form_token": "$FORM_TOKEN",
  "name": "成绩查询",
  "search_field_rules": [{"operand": "and", "search_field_settings": [{"field_api_code": "field_2"}]}],
  "display_field_rules": [{"field_api_code": "field_1", "protected": true}]
}
```

### Python

```python
import requests

access_token = 'YOUR_ACCESS_TOKEN'
form_token = 'YOUR_FORM_TOKEN'
base = 'https://jinshuju.net/api/v1'
headers = {'Authorization': f'Bearer {access_token}'}

# 1. 先拿到该表单允许的字段
suggestions = requests.get(
    f'{base}/opensearch/query_suggestions',
    headers=headers, params={'form_token': form_token}
).json()
search_code = suggestions['recommend_search_fields'][0]

# 2. 创建对外查询
response = requests.post(
    f'{base}/opensearch/queries',
    headers=headers,
    json={
        'form_token': form_token,
        'name': '成绩查询',
        'search_field_rules': [
            {'operand': 'and', 'search_field_settings': [{'field_api_code': search_code}]}
        ],
        'display_field_rules': [{'field_api_code': suggestions['display_fields'][0]['api_code']}]
    }
)

print(response.json()['url'])
```
