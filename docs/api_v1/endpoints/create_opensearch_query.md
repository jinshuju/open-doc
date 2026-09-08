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

| 参数名称 | 是否必须 | 类型 | 说明 |
| ------ | ------ | ------ | ------ |
| form_token | 是 | String | 数据来源表单的 Token |
| name | 是 | String | 查询页标题 |
| search_field_rules | 是 | Array | 查询条件组，通常只有一组；结构见[获取单个对外查询](/api_v1/endpoints/get_opensearch_query) |
| display_field_rules | 是 | Array | 命中数据展示的字段，按展示顺序，不能为空 |
| description | 否 | String | 查询页描述文案 |
| messages | 否 | Object | 结果文案，包含 `has_result` / `no_result`；未传的 key 在公开页上回落到产品默认值 |
| search_button | 否 | Object | 查询按钮外观，包含 `text` / `color` |
| allow_to_export_results | 否 | Bool | 是否允许访问者导出查询结果，默认 `false` |
| enabled | 否 | Bool | 是否启用，默认 `true` |

### Response

`201 Created`，返回新建查询的完整配置，结构同[获取单个对外查询](/api_v1/endpoints/get_opensearch_query)。把响应里的 `url` 交给访问者即可开始使用。

### 状态码

| 状态码 | 说明 |
| ------ | ------ |
| 201 | 创建成功 |
| 400 | 参数不合法：`api_code` 不在该表单的可查询/可展示字段内、查询条件或展示字段为空等，错误详情见 `error_description` |
| 401 | 未认证 |
| 402 | 当前套餐不支持 V1 API 或不支持「对外查询」 |
| 403 | 能访问该表单但不是表单管理员 |
| 404 | 表单不存在或无权访问 |

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
