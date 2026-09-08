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

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| QUERY_TOKEN | 是 | String | 对外查询 Token（URL 路径参数） |

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

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| token | 是 | String | 对外查询 Token |
| url | 是 | String | 公开查询页地址 |
| name | 是 | String | 查询页标题 |
| enabled | 是 | Bool | 是否启用 |
| form_token | 否 | String | 数据来源表单 Token；来源表单已删除时为 `null` |
| description | 否 | String | 查询页描述文案 |
| status | 是 | String | 查询页可用状态：`active` = 正常；`entries_count_limited` = 表单数据量超出套餐的对外查询上限，访问者会看到不可用提示；`form_not_found` = 来源表单已删除。**与 `enabled` 无关**，停用的查询 `status` 仍可能是 `active` |
| search_field_rules | 是 | Array | 查询条件组，通常只有一组 |
| search_field_rules[].operand | 是 | String | 组内多个查询字段的关系：`and` = 全部匹配；`or` = 任一匹配 |
| search_field_rules[].search_field_settings | 是 | Array | 访问者需要填写的查询字段 |
| search_field_rules[].search_field_settings[].field_api_code | 是 | String | 查询字段的 `api_code` |
| search_field_rules[].search_field_settings[].field_label | 否 | String | 展示给访问者的自定义标签；未设置为 `null` |
| search_field_rules[].search_field_settings[].fuzzy | 是 | Bool | `true` = 包含匹配；`false` = 精确匹配 |
| search_field_rules[].search_field_settings[].sms_verification | 是 | Bool | 查询前是否要求短信验证（仅手机号字段生效） |
| display_field_rules | 是 | Array | 命中数据展示的字段，按展示顺序 |
| display_field_rules[].field_api_code | 是 | String | 展示字段的 `api_code` |
| display_field_rules[].field_label | 否 | String | 自定义标签；未设置为 `null` |
| display_field_rules[].editable | 是 | Bool | 是否允许访问者在结果页编辑该字段值 |
| display_field_rules[].protected | 是 | Bool | 是否对值做隐私脱敏（如 张*三） |
| display_field_rules[].highlight | 否 | Object | 高亮设置；未设置为 `null` |
| display_field_rules[].highlight.color | 否 | String | 高亮颜色（CSS 颜色值） |
| display_field_rules[].highlight.position | 否 | Number | 多个高亮字段间的排序，越小越靠前 |
| messages | 是 | Object | 已存下来的结果文案；未设置的 key 不出现 |
| default_messages | 是 | Object | 回落默认值之后的实际生效文案 |
| search_button | 是 | Object | 查询按钮外观，包含 `text` / `color`；未设置时为 `{}` |
| allow_to_export_results | 是 | Bool | 是否允许访问者导出查询结果 |
| created_at | 是 | DateTime | 创建时间 |
| updated_at | 是 | DateTime | 最后更新时间 |
| searches_count | 是 | Number | 累计查询次数 |
| views_count | 是 | Number | 累计访问次数 |

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 200 | 获取成功 |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API |
| 404 | 对外查询不存在，或不是当前调用方创建的 |

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
